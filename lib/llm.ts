import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { ProductBriefSchema, GenerateResponseSchema, RelaxedGenerateResponseSchema } from "./schemas";
import type { ProductBrief, GenerateResponse } from "./schemas";
import {
  EXTRACTION_SYSTEM_PROMPT,
  GENERATION_SYSTEM_PROMPT,
  buildExtractionUserPrompt,
  buildGenerationUserPrompt,
} from "./prompts";

/** Extract JSON object from LLM text that may contain markdown fences or prose. */
function parseJsonFromLLM(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenced) {
      return JSON.parse(fenced[1].trim());
    }
    const start = text.indexOf("{");
    if (start === -1) throw new Error("LLM did not return valid JSON");
    let depth = 0;
    for (let i = start; i < text.length; i++) {
      if (text[i] === "{") depth++;
      if (text[i] === "}") depth--;
      if (depth === 0) {
        return JSON.parse(text.slice(start, i + 1));
      }
    }
    throw new Error("LLM returned malformed JSON");
  }
}

function isOpenAIModel(model: string): boolean {
  return model.startsWith("gpt-") || model.startsWith("o");
}

// Fallback model when primary provider fails
function getFallbackModel(model: string): string | null {
  if (isOpenAIModel(model)) return "claude-haiku-4-5-20251001";
  return process.env.OPENAI_API_KEY ? "gpt-4o-mini" : null;
}

// Check if error is retryable
function isRetryable(err: unknown): boolean {
  if (err instanceof Error) {
    const msg = err.message.toLowerCase();
    if (msg.includes("rate") || msg.includes("429")) return true;
    if (msg.includes("500") || msg.includes("502") || msg.includes("503") || msg.includes("504")) return true;
    if (msg.includes("timeout") || msg.includes("abort")) return true;
    if (msg.includes("overloaded")) return true;
  }
  // Check status property on API errors
  const status = (err as Record<string, unknown>)?.status;
  if (typeof status === "number" && (status === 429 || status >= 500)) return true;
  return false;
}

// Sleep for exponential backoff
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Status callback for UI updates
export type StatusCallback = (status: string) => void;

async function callClaude(system: string, userPrompt: string, model: string, maxTokens: number): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey === "sk-ant-placeholder") {
    throw new Error("ANTHROPIC_API_KEY is not configured. Set it in .env.local");
  }
  const client = new Anthropic({ apiKey });
  const response = await client.messages.create({
    model,
    max_tokens: maxTokens,
    system,
    messages: [{ role: "user", content: userPrompt }],
  });
  return response.content[0].type === "text" ? response.content[0].text : "";
}

async function callOpenAI(system: string, userPrompt: string, model: string, maxTokens: number): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured. Set it in .env.local");
  }
  const client = new OpenAI({ apiKey });
  const response = await client.chat.completions.create({
    model,
    max_tokens: maxTokens,
    messages: [
      { role: "system", content: system },
      { role: "user", content: userPrompt },
    ],
  });
  return response.choices[0]?.message?.content || "";
}

async function callProvider(system: string, userPrompt: string, model: string, maxTokens: number): Promise<string> {
  if (isOpenAIModel(model)) {
    return callOpenAI(system, userPrompt, model, maxTokens);
  }
  return callClaude(system, userPrompt, model, maxTokens);
}

const MAX_RETRIES = 2;
const BASE_DELAY_MS = 1000;

/**
 * Reliable LLM caller with retry + exponential backoff + provider fallback.
 */
async function callLLM(
  system: string,
  userPrompt: string,
  model: string,
  maxTokens: number,
  onStatus?: StatusCallback,
): Promise<string> {
  let lastError: unknown;

  // Try primary model with retries
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      if (attempt > 0) {
        const delay = BASE_DELAY_MS * Math.pow(2, attempt - 1);
        onStatus?.(`Retrying (attempt ${attempt + 1})...`);
        await sleep(delay);
      }
      return await callProvider(system, userPrompt, model, maxTokens);
    } catch (err) {
      lastError = err;
      if (!isRetryable(err) || attempt === MAX_RETRIES) break;
    }
  }

  // Try fallback provider
  const fallback = getFallbackModel(model);
  if (fallback) {
    try {
      onStatus?.(`Switching to fallback (${fallback})...`);
      return await callProvider(system, userPrompt, fallback, maxTokens);
    } catch {
      // Fallback also failed — throw original error
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("LLM request failed after retries and fallback.");
}

export async function extractProductBrief(
  pageText: string,
  model = "claude-haiku-4-5-20251001",
  onStatus?: StatusCallback,
): Promise<ProductBrief> {
  onStatus?.("Extracting product information...");
  const text = await callLLM(EXTRACTION_SYSTEM_PROMPT, buildExtractionUserPrompt(pageText), model, 2048, onStatus);
  const parsed = parseJsonFromLLM(text);
  return ProductBriefSchema.parse(parsed);
}

export async function generateCreatives(
  brief: ProductBrief,
  model = "claude-sonnet-4-6",
  onStatus?: StatusCallback,
): Promise<GenerateResponse> {
  const makeCall = async (extraInstruction?: string) => {
    const userPrompt = buildGenerationUserPrompt(brief) +
      (extraInstruction ? `\n\n${extraInstruction}` : "");
    const text = await callLLM(GENERATION_SYSTEM_PROMPT, userPrompt, model, 4096, onStatus);
    return parseJsonFromLLM(text);
  };

  // First attempt
  onStatus?.("Generating creatives across 6 angles...");
  const raw = await makeCall();
  const firstTry = GenerateResponseSchema.safeParse(raw);
  if (firstTry.success) return firstTry.data;

  // Retry once with validation error feedback
  onStatus?.("Refining output format...");
  const errorMsg = `Your previous response had validation errors. Fix these issues:\n${JSON.stringify(firstTry.error.issues, null, 2)}`;
  const retryRaw = await makeCall(errorMsg);
  const secondTry = GenerateResponseSchema.safeParse(retryRaw);
  if (secondTry.success) return secondTry.data;

  // Fallback: accept with relaxed validation
  const relaxedTry = RelaxedGenerateResponseSchema.safeParse(retryRaw);
  if (relaxedTry.success) {
    return relaxedTry.data as unknown as GenerateResponse;
  }

  throw new Error(
    "Could not generate valid creatives. Please try again or simplify the product brief."
  );
}

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

async function callLLM(system: string, userPrompt: string, model: string, maxTokens: number): Promise<string> {
  if (isOpenAIModel(model)) {
    return callOpenAI(system, userPrompt, model, maxTokens);
  }
  return callClaude(system, userPrompt, model, maxTokens);
}

export async function extractProductBrief(pageText: string, model = "claude-haiku-4-5-20251001"): Promise<ProductBrief> {
  const text = await callLLM(EXTRACTION_SYSTEM_PROMPT, buildExtractionUserPrompt(pageText), model, 2048);
  const parsed = parseJsonFromLLM(text);
  return ProductBriefSchema.parse(parsed);
}

export async function generateCreatives(
  brief: ProductBrief,
  model = "claude-sonnet-4-6"
): Promise<GenerateResponse> {
  const makeCall = async (extraInstruction?: string) => {
    const userPrompt = buildGenerationUserPrompt(brief) +
      (extraInstruction ? `\n\n${extraInstruction}` : "");
    const text = await callLLM(GENERATION_SYSTEM_PROMPT, userPrompt, model, 4096);
    return parseJsonFromLLM(text);
  };

  // First attempt
  const raw = await makeCall();
  const firstTry = GenerateResponseSchema.safeParse(raw);
  if (firstTry.success) return firstTry.data;

  // Retry once with validation error feedback
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

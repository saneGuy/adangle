import Anthropic from "@anthropic-ai/sdk";
import { ProductBriefSchema, GenerateResponseSchema } from "./schemas";
import type { ProductBrief, GenerateResponse } from "./schemas";
import {
  EXTRACTION_SYSTEM_PROMPT,
  GENERATION_SYSTEM_PROMPT,
  buildExtractionUserPrompt,
  buildGenerationUserPrompt,
} from "./prompts";

/** Extract JSON object from LLM text that may contain markdown fences or prose. */
function parseJsonFromLLM(text: string): unknown {
  // Try direct parse first
  try {
    return JSON.parse(text);
  } catch {
    // Strip markdown code fences if present
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenced) {
      return JSON.parse(fenced[1].trim());
    }
    // Find the outermost balanced { } block
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

function getClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey === "sk-ant-placeholder") {
    throw new Error("ANTHROPIC_API_KEY is not configured. Set it in .env.local");
  }
  return new Anthropic({ apiKey });
}

export async function extractProductBrief(pageText: string): Promise<ProductBrief> {
  const client = getClient();

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2048,
    system: EXTRACTION_SYSTEM_PROMPT,
    messages: [{ role: "user", content: buildExtractionUserPrompt(pageText) }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  const parsed = parseJsonFromLLM(text);
  return ProductBriefSchema.parse(parsed);
}

export async function generateCreatives(
  brief: ProductBrief
): Promise<GenerateResponse> {
  const client = getClient();

  const callLLM = async (extraInstruction?: string) => {
    const userPrompt = buildGenerationUserPrompt(brief) +
      (extraInstruction ? `\n\n${extraInstruction}` : "");

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      system: GENERATION_SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";
    return parseJsonFromLLM(text);
  };

  // First attempt
  const raw = await callLLM();
  const firstTry = GenerateResponseSchema.safeParse(raw);
  if (firstTry.success) return firstTry.data;

  // Retry once with validation error feedback
  const errorMsg = `Your previous response had validation errors. Fix these issues:\n${JSON.stringify(firstTry.error.issues, null, 2)}`;
  const retryRaw = await callLLM(errorMsg);
  const secondTry = GenerateResponseSchema.safeParse(retryRaw);
  if (secondTry.success) return secondTry.data;

  // Return partial results with relaxed validation
  throw new Error(
    `LLM output failed validation after retry: ${JSON.stringify(secondTry.error.issues.slice(0, 3))}`
  );
}

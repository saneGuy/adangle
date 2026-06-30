import { NextRequest, NextResponse } from "next/server";
import { GenerateRequestSchema } from "@/lib/schemas";
import { generateCreatives } from "@/lib/llm";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productBrief } = GenerateRequestSchema.parse(body);

    const result = await generateCreatives(productBrief);

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Generation failed";
    return NextResponse.json(
      { error: "generate_failed", message },
      { status: 400 }
    );
  }
}

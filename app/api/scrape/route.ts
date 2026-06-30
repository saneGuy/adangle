import { NextRequest, NextResponse } from "next/server";
import { ScrapeRequestSchema } from "@/lib/schemas";
import { fetchAndExtract } from "@/lib/scraper";
import { extractProductBrief } from "@/lib/llm";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = ScrapeRequestSchema.parse(body);
    const model = body.model || "claude-haiku-4-5-20251001";

    const pageText = await fetchAndExtract(url);
    const brief = await extractProductBrief(pageText, model);

    return NextResponse.json(brief);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Scrape failed";
    return NextResponse.json(
      { error: "scrape_failed", message },
      { status: 400 }
    );
  }
}

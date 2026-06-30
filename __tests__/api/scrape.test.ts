import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/scraper", () => ({
  fetchAndExtract: vi.fn(),
}));
vi.mock("@/lib/llm", () => ({
  extractProductBrief: vi.fn(),
}));

import { POST } from "@/app/api/scrape/route";
import { fetchAndExtract } from "@/lib/scraper";
import { extractProductBrief } from "@/lib/llm";
import { NextRequest } from "next/server";

function makeRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/scrape", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

describe("POST /api/scrape", () => {
  it("returns product brief on success", async () => {
    const mockBrief = { productName: "Test", description: "A test", features: [], pricing: "", targetAudience: "general", claims: [] };
    vi.mocked(fetchAndExtract).mockResolvedValueOnce("page text");
    vi.mocked(extractProductBrief).mockResolvedValueOnce(mockBrief);

    const res = await POST(makeRequest({ url: "https://example.com" }));
    const data = await res.json();
    expect(data.productName).toBe("Test");
    expect(res.status).toBe(200);
  });

  it("returns 400 on invalid URL", async () => {
    const res = await POST(makeRequest({ url: "not-a-url" }));
    const data = await res.json();
    expect(data.error).toBe("scrape_failed");
    expect(res.status).toBe(400);
  });

  it("returns 400 on scrape failure", async () => {
    vi.mocked(fetchAndExtract).mockRejectedValueOnce(new Error("timeout"));

    const res = await POST(makeRequest({ url: "https://example.com" }));
    const data = await res.json();
    expect(data.error).toBe("scrape_failed");
    expect(res.status).toBe(400);
  });
});

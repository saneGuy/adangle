import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/llm", () => ({
  generateCreatives: vi.fn(),
}));

import { POST } from "@/app/api/generate/route";
import { generateCreatives } from "@/lib/llm";
import { NextRequest } from "next/server";

function makeRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/generate", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

const validBrief = {
  productName: "Widget",
  description: "A widget",
  features: [],
  pricing: "",
  targetAudience: "general",
  claims: [],
};

describe("POST /api/generate", () => {
  it("returns creatives on success", async () => {
    const mockResult = { angles: [] };
    vi.mocked(generateCreatives).mockResolvedValueOnce(mockResult as never);

    const res = await POST(makeRequest({ productBrief: validBrief }));
    expect(res.status).toBe(200);
  });

  it("returns 400 on missing productBrief", async () => {
    const res = await POST(makeRequest({}));
    const data = await res.json();
    expect(data.error).toBe("generate_failed");
    expect(res.status).toBe(400);
  });

  it("returns 400 on LLM failure", async () => {
    vi.mocked(generateCreatives).mockRejectedValueOnce(new Error("LLM error"));

    const res = await POST(makeRequest({ productBrief: validBrief }));
    const data = await res.json();
    expect(data.error).toBe("generate_failed");
    expect(res.status).toBe(400);
  });
});

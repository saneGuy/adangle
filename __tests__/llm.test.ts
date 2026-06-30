import { describe, it, expect, vi, beforeEach } from "vitest";

// mockCreate is defined at module scope so the factory closure can reference it
// and tests can call mockCreate.mockResolvedValueOnce etc.
const mockCreate = vi.fn();

// Mock the Anthropic SDK before importing llm.
// The default export must be a class (constructor) so `new Anthropic(...)` works.
vi.mock("@anthropic-ai/sdk", () => {
  class MockAnthropic {
    messages = { create: mockCreate };
  }
  return { default: MockAnthropic };
});

// Set env before importing the module under test
process.env.ANTHROPIC_API_KEY = "sk-ant-test-key";

import { extractProductBrief, generateCreatives } from "@/lib/llm";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("extractProductBrief", () => {
  it("extracts valid brief from LLM response", async () => {
    const mockBrief = {
      productName: "TestWidget",
      description: "A test product",
      features: ["Fast"],
      pricing: "$10/mo",
      targetAudience: "Developers",
      claims: [{ id: "c1", text: "Saves time" }],
    };
    mockCreate.mockResolvedValueOnce({
      content: [{ type: "text", text: JSON.stringify(mockBrief) }],
    });

    const result = await extractProductBrief("Some page text");
    expect(result.productName).toBe("TestWidget");
    expect(result.claims).toHaveLength(1);
  });

  it("handles JSON wrapped in markdown fences", async () => {
    const mockBrief = { productName: "Test", description: "Desc" };
    mockCreate.mockResolvedValueOnce({
      content: [{ type: "text", text: "```json\n" + JSON.stringify(mockBrief) + "\n```" }],
    });

    const result = await extractProductBrief("Page text");
    expect(result.productName).toBe("Test");
  });

  it("throws on completely invalid response", async () => {
    mockCreate.mockResolvedValueOnce({
      content: [{ type: "text", text: "I cannot help with that." }],
    });

    await expect(extractProductBrief("Page text")).rejects.toThrow();
  });
});

describe("generateCreatives", () => {
  const validBrief = {
    productName: "Widget",
    description: "A widget",
    features: ["Fast"],
    pricing: "$10",
    targetAudience: "Devs",
    claims: [{ id: "c1", text: "Saves time" }],
  };

  const makeValidResponse = () => {
    const angle = {
      name: "Urgency",
      headlines: [
        { text: "Act Now", platformSlot: "Meta Headline", groundedIn: ["c1"] },
        { text: "Limited Time", platformSlot: "Google RSA Headline", groundedIn: [] },
        { text: "Hurry Up", platformSlot: "Meta Headline", groundedIn: [] },
      ],
      bodyCopy: [
        { text: "Don't miss this deal.", platformSlot: "Meta Primary Text", groundedIn: ["c1"] },
        { text: "Time running out.", platformSlot: "Meta Primary Text", groundedIn: [] },
      ],
      cta: "Buy Now",
    };
    return {
      angles: ["Urgency", "Social Proof", "Curiosity", "Pain/Solution", "Authority", "FOMO"].map(
        (name) => ({ ...angle, name })
      ),
    };
  };

  it("returns creatives on valid LLM response", async () => {
    mockCreate.mockResolvedValueOnce({
      content: [{ type: "text", text: JSON.stringify(makeValidResponse()) }],
    });

    const result = await generateCreatives(validBrief);
    expect(result.angles).toHaveLength(6);
  });

  it("retries once on validation failure then succeeds", async () => {
    // First call returns invalid (only 1 angle instead of 6)
    mockCreate.mockResolvedValueOnce({
      content: [{ type: "text", text: JSON.stringify({ angles: [{ name: "Urgency" }] }) }],
    });
    // Second call returns valid
    mockCreate.mockResolvedValueOnce({
      content: [{ type: "text", text: JSON.stringify(makeValidResponse()) }],
    });

    const result = await generateCreatives(validBrief);
    expect(result.angles).toHaveLength(6);
    expect(mockCreate).toHaveBeenCalledTimes(2);
  });

  it("throws after two validation failures with completely invalid data", async () => {
    const bad = { notAngles: "invalid" };
    mockCreate.mockResolvedValue({
      content: [{ type: "text", text: JSON.stringify(bad) }],
    });

    await expect(generateCreatives(validBrief)).rejects.toThrow("Could not generate valid creatives");
    expect(mockCreate).toHaveBeenCalledTimes(2);
  });
});

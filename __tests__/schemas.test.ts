import { describe, it, expect } from "vitest";
import {
  ScrapeRequestSchema,
  ProductBriefSchema,
  GenerateRequestSchema,
  CreativeVariantSchema,
  AngleSchema,
  GenerateResponseSchema,
  ClaimSchema,
} from "@/lib/schemas";

describe("ScrapeRequestSchema", () => {
  it("accepts valid HTTPS URL", () => {
    const result = ScrapeRequestSchema.safeParse({ url: "https://example.com/product" });
    expect(result.success).toBe(true);
  });

  it("rejects non-URL string", () => {
    const result = ScrapeRequestSchema.safeParse({ url: "not-a-url" });
    expect(result.success).toBe(false);
  });

  it("rejects missing url", () => {
    const result = ScrapeRequestSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe("ClaimSchema", () => {
  it("accepts valid claim", () => {
    const result = ClaimSchema.safeParse({ id: "c1", text: "Saves 10 hours" });
    expect(result.success).toBe(true);
  });
});

describe("ProductBriefSchema", () => {
  it("accepts full brief", () => {
    const result = ProductBriefSchema.safeParse({
      productName: "Widget",
      description: "A great widget",
      features: ["Fast", "Cheap"],
      pricing: "$10/mo",
      targetAudience: "Developers",
      claims: [{ id: "c1", text: "Saves time" }],
    });
    expect(result.success).toBe(true);
  });

  it("accepts minimal brief (name + description only)", () => {
    const result = ProductBriefSchema.safeParse({
      productName: "Widget",
      description: "A great widget",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing productName", () => {
    const result = ProductBriefSchema.safeParse({ description: "A great widget" });
    expect(result.success).toBe(false);
  });
});

describe("GenerateResponseSchema", () => {
  const validAngle = {
    name: "Urgency",
    headlines: [
      { text: "Act Now", platformSlot: "Meta Headline", groundedIn: ["c1"] },
      { text: "Limited Time", platformSlot: "Google RSA Headline", groundedIn: [] },
      { text: "Hurry Up", platformSlot: "Meta Headline", groundedIn: [] },
    ],
    bodyCopy: [
      { text: "Don't miss this deal on our product.", platformSlot: "Meta Primary Text", groundedIn: ["c1"] },
      { text: "Time is running out for this offer.", platformSlot: "Meta Primary Text", groundedIn: [] },
    ],
    cta: "Buy Now",
  };

  it("accepts valid response with 6 angles", () => {
    const angles = Array.from({ length: 6 }, (_, i) => ({
      ...validAngle,
      name: ["Urgency", "Social Proof", "Curiosity", "Pain/Solution", "Authority", "FOMO"][i],
    }));
    const result = GenerateResponseSchema.safeParse({ angles });
    expect(result.success).toBe(true);
  });

  it("rejects response with 5 angles", () => {
    const angles = Array.from({ length: 5 }, () => validAngle);
    const result = GenerateResponseSchema.safeParse({ angles });
    expect(result.success).toBe(false);
  });

  it("rejects headline over 40 chars", () => {
    const longAngle = {
      ...validAngle,
      headlines: [
        { text: "A".repeat(41), platformSlot: "Meta Headline", groundedIn: [] },
        { text: "OK", platformSlot: "Meta Headline", groundedIn: [] },
        { text: "OK", platformSlot: "Meta Headline", groundedIn: [] },
      ],
    };
    const angles = Array.from({ length: 6 }, () => longAngle);
    const result = GenerateResponseSchema.safeParse({ angles });
    expect(result.success).toBe(false);
  });

  it("rejects body copy over 125 chars", () => {
    const longAngle = {
      ...validAngle,
      bodyCopy: [
        { text: "A".repeat(126), platformSlot: "Meta Primary Text", groundedIn: [] },
        { text: "OK body text here.", platformSlot: "Meta Primary Text", groundedIn: [] },
      ],
    };
    const angles = Array.from({ length: 6 }, () => longAngle);
    const result = GenerateResponseSchema.safeParse({ angles });
    expect(result.success).toBe(false);
  });
});

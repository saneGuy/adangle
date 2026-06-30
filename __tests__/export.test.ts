import { describe, it, expect } from "vitest";
import { anglesToCsv, anglesToJson } from "@/lib/export";
import type { Angle } from "@/lib/schemas";

const mockAngles: Angle[] = [
  {
    name: "Urgency",
    headlines: [
      { text: "Act Now", platformSlot: "Meta Headline", groundedIn: ["c1"] },
      { text: "Limited Time", platformSlot: "Google RSA Headline", groundedIn: [] },
      { text: "Hurry", platformSlot: "Meta Headline", groundedIn: [] },
    ],
    bodyCopy: [
      { text: "Don't miss this deal.", platformSlot: "Meta Primary Text", groundedIn: ["c1"] },
      { text: "Time is running out.", platformSlot: "Meta Primary Text", groundedIn: [] },
    ],
    cta: "Buy Now",
  },
];

describe("anglesToCsv", () => {
  it("produces correct CSV header", () => {
    const csv = anglesToCsv(mockAngles);
    const lines = csv.split("\n");
    expect(lines[0]).toBe("angle,platform_slot,variant_index,text,cta,grounded_in");
  });

  it("produces correct number of rows (3 headlines + 2 body per angle)", () => {
    const csv = anglesToCsv(mockAngles);
    const lines = csv.split("\n").filter(Boolean);
    // 1 header + 5 data rows
    expect(lines.length).toBe(6);
  });

  it("escapes commas in text", () => {
    const angles: Angle[] = [{
      ...mockAngles[0],
      headlines: [
        { text: "Save time, money", platformSlot: "Meta Headline", groundedIn: [] },
        { text: "OK", platformSlot: "Meta Headline", groundedIn: [] },
        { text: "OK", platformSlot: "Meta Headline", groundedIn: [] },
      ],
    }];
    const csv = anglesToCsv(angles);
    expect(csv).toContain('"Save time, money"');
  });
});

describe("anglesToJson", () => {
  it("returns valid JSON string", () => {
    const json = anglesToJson(mockAngles);
    expect(() => JSON.parse(json)).not.toThrow();
  });

  it("round-trips angle data", () => {
    const json = anglesToJson(mockAngles);
    const parsed = JSON.parse(json);
    expect(parsed.angles[0].name).toBe("Urgency");
  });
});

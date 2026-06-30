import type { Angle, ProductBrief } from "./schemas";

export interface ScoredCreative {
  angle: string;
  type: "headline" | "body" | "cta";
  index: number;
  text: string;
  platformSlot: string;
  verdict: "launch" | "edit" | "skip";
  reason: string;
  charCount: number;
  charLimit: number;
  overLimit: boolean;
  groundedIn: string[];
}

export function scoreCreatives(angles: Angle[], brief: ProductBrief): ScoredCreative[] {
  const results: ScoredCreative[] = [];
  const claimTexts = new Set((brief.claims || []).map(c => c.id));

  for (const angle of angles) {
    for (let i = 0; i < angle.headlines.length; i++) {
      const h = angle.headlines[i];
      const overLimit = h.text.length > 40;
      const grounded = h.groundedIn.length > 0;
      let verdict: "launch" | "edit" | "skip" = "launch";
      let reason = "Within character limit, ready to use.";

      if (overLimit) {
        verdict = "edit";
        reason = `Over 40-char limit (${h.text.length} chars). Trim before launching.`;
      } else if (h.text.length < 15) {
        verdict = "edit";
        reason = "Too short — may underperform. Add specificity.";
      }

      // Prefer grounded creatives for launch
      if (verdict === "launch" && grounded) {
        reason = "Grounded in product claims. Strong for trust-building.";
      }

      results.push({
        angle: angle.name,
        type: "headline",
        index: i,
        text: h.text,
        platformSlot: h.platformSlot,
        verdict,
        reason,
        charCount: h.text.length,
        charLimit: 40,
        overLimit,
        groundedIn: h.groundedIn,
      });
    }

    for (let i = 0; i < angle.bodyCopy.length; i++) {
      const b = angle.bodyCopy[i];
      const overLimit = b.text.length > 125;
      const grounded = b.groundedIn.length > 0;
      let verdict: "launch" | "edit" | "skip" = "launch";
      let reason = "Within character limit, ready to use.";

      if (overLimit) {
        verdict = "edit";
        reason = `Over 125-char limit (${b.text.length} chars). Trim before launching.`;
      }

      if (verdict === "launch" && grounded) {
        reason = "Grounded in product claims. Factually defensible.";
      }

      results.push({
        angle: angle.name,
        type: "body",
        index: i,
        text: b.text,
        platformSlot: b.platformSlot,
        verdict,
        reason,
        charCount: b.text.length,
        charLimit: 125,
        overLimit,
        groundedIn: b.groundedIn,
      });
    }

    // CTA
    const ctaOver = angle.cta.length > 25;
    results.push({
      angle: angle.name,
      type: "cta",
      index: 0,
      text: angle.cta,
      platformSlot: "CTA",
      verdict: ctaOver ? "edit" : "launch",
      reason: ctaOver ? `Over 25-char limit (${angle.cta.length} chars).` : "Good length for CTA.",
      charCount: angle.cta.length,
      charLimit: 25,
      overLimit: ctaOver,
      groundedIn: [],
    });
  }

  // Sort: launch first, then edit, then skip
  const order = { launch: 0, edit: 1, skip: 2 };
  results.sort((a, b) => order[a.verdict] - order[b.verdict]);

  return results;
}

export function getShortlistSummary(scored: ScoredCreative[]): { launch: number; edit: number; skip: number } {
  return {
    launch: scored.filter(s => s.verdict === "launch").length,
    edit: scored.filter(s => s.verdict === "edit").length,
    skip: scored.filter(s => s.verdict === "skip").length,
  };
}

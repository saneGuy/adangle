import type { Angle } from "./schemas";

export interface BrandKit {
  brandVoice: string;
  targetAudience: string;
  bannedWords: string[];
  requiredDisclaimers: string[];
  approvedCTAs: string[];
  complianceNotes: string;
}

export const DEFAULT_BRAND_KIT: BrandKit = {
  brandVoice: "",
  targetAudience: "",
  bannedWords: [],
  requiredDisclaimers: [],
  approvedCTAs: [],
  complianceNotes: "",
};

// Common risky ad claims that platforms flag
const RISKY_PATTERNS = [
  { pattern: /\bguaranteed?\b/i, reason: "Guarantee claims may violate ad policies" },
  { pattern: /\b#1\b/i, reason: "Superlative claims require substantiation" },
  { pattern: /\bbest\b/i, reason: "Superlative claims may need substantiation" },
  { pattern: /\bcure[sd]?\b/i, reason: "Health claims are restricted on most platforms" },
  { pattern: /\bfree\b/i, reason: "Free offers have specific disclosure requirements" },
  { pattern: /\brisk[- ]?free\b/i, reason: "Risk-free claims may need qualification" },
  { pattern: /\bno[- ]?risk\b/i, reason: "No-risk claims may need qualification" },
  { pattern: /\bact now\b/i, reason: "Urgency language may be flagged as pressure tactic" },
  { pattern: /\blimited time\b/i, reason: "Scarcity claims must be truthful" },
  { pattern: /\b100%\b/i, reason: "Absolute claims require substantiation" },
  { pattern: /\binstant(ly)?\b/i, reason: "Instant results claims may need qualification" },
];

export interface PreflightResult {
  text: string;
  angle: string;
  type: "headline" | "body" | "cta";
  status: "pass" | "review" | "blocked";
  issues: string[];
}

export function runPreflight(angles: Angle[], brandKit: BrandKit): PreflightResult[] {
  const results: PreflightResult[] = [];
  const bannedLower = brandKit.bannedWords.map(w => w.toLowerCase());

  function checkText(text: string, angle: string, type: "headline" | "body" | "cta"): PreflightResult {
    const issues: string[] = [];
    const textLower = text.toLowerCase();

    // Check banned words
    for (const banned of bannedLower) {
      if (banned && textLower.includes(banned)) {
        issues.push(`Contains banned word: "${banned}"`);
      }
    }

    // Check risky patterns
    for (const { pattern, reason } of RISKY_PATTERNS) {
      if (pattern.test(text)) {
        issues.push(reason);
      }
    }

    // Check CTA against approved list
    if (type === "cta" && brandKit.approvedCTAs.length > 0) {
      const approved = brandKit.approvedCTAs.some(
        cta => cta.toLowerCase() === textLower
      );
      if (!approved) {
        issues.push("CTA not in approved list");
      }
    }

    let status: "pass" | "review" | "blocked" = "pass";
    if (issues.some(i => i.startsWith("Contains banned"))) {
      status = "blocked";
    } else if (issues.length > 0) {
      status = "review";
    }

    return { text, angle, type, status, issues };
  }

  for (const angle of angles) {
    for (const h of angle.headlines) {
      results.push(checkText(h.text, angle.name, "headline"));
    }
    for (const b of angle.bodyCopy) {
      results.push(checkText(b.text, angle.name, "body"));
    }
    results.push(checkText(angle.cta, angle.name, "cta"));
  }

  // Check for missing disclaimers across all body copy
  if (brandKit.requiredDisclaimers.length > 0) {
    const allBodyText = angles.flatMap(a => a.bodyCopy.map(b => b.text)).join(" ").toLowerCase();
    for (const disclaimer of brandKit.requiredDisclaimers) {
      if (disclaimer && !allBodyText.includes(disclaimer.toLowerCase())) {
        results.push({
          text: `Missing required disclaimer: "${disclaimer}"`,
          angle: "All",
          type: "body",
          status: "review",
          issues: [`Required disclaimer not found in any body copy: "${disclaimer}"`],
        });
      }
    }
  }

  return results;
}

export function getPreflightSummary(results: PreflightResult[]): { pass: number; review: number; blocked: number } {
  return {
    pass: results.filter(r => r.status === "pass").length,
    review: results.filter(r => r.status === "review").length,
    blocked: results.filter(r => r.status === "blocked").length,
  };
}

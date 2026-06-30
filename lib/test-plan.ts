import type { Angle, ProductBrief } from "./schemas";

export interface TestPlan {
  campaignName: string;
  adSets: Array<{
    name: string;
    angle: string;
    hypothesis: string;
    headlines: string[];
    bodyCopy: string[];
    cta: string;
    budgetPercent: number;
  }>;
  totalBudgetNote: string;
  kpis: Array<{ metric: string; target: string }>;
  decisionRules: string[];
  timeline: string;
}

export function generateTestPlan(brief: ProductBrief, angles: Angle[]): TestPlan {
  const campaignName = `${brief.productName} - Angle Test - ${new Date().toISOString().slice(0, 10)}`;

  const adSets = angles.map((angle) => ({
    name: `${brief.productName} | ${angle.name}`,
    angle: angle.name,
    hypothesis: getHypothesis(angle.name, brief.productName),
    headlines: angle.headlines.map((h) => h.text),
    bodyCopy: angle.bodyCopy.map((b) => b.text),
    cta: angle.cta,
    budgetPercent: Math.round(100 / angles.length),
  }));

  return {
    campaignName,
    adSets,
    totalBudgetNote: `Split evenly across ${angles.length} ad sets. After 72 hours, reallocate budget from losing angles to winners.`,
    kpis: [
      { metric: "CTR", target: "> 1.5%" },
      { metric: "CPC", target: "Below account average" },
      { metric: "Hook Rate (3s views)", target: "> 25%" },
      { metric: "CPA", target: "Within 2x target CPA" },
    ],
    decisionRules: [
      "Day 1-3: Let all ad sets run. Do not make changes.",
      "Day 3: Kill any ad set with CTR < 0.5% and CPA > 3x target.",
      "Day 5: Shift 50% of budget from bottom 2 performers to top 2.",
      "Day 7: Pause all but the top 2 angles. Scale winners by 20%.",
      "If a clear winner emerges before Day 7, scale immediately.",
    ],
    timeline: "7-day structured test with decision checkpoints at Day 3, 5, and 7.",
  };
}

function getHypothesis(angleName: string, productName: string): string {
  const hypotheses: Record<string, string> = {
    Urgency: `Time-pressure messaging will drive higher CTR by creating immediate action intent for ${productName}.`,
    "Social Proof": `Showing adoption metrics and peer usage will build trust and lower CPA for ${productName}.`,
    Curiosity: `Question-based hooks will generate higher engagement by creating an information gap about ${productName}.`,
    "Pain/Solution": `Problem-aware messaging will resonate with users actively seeking a solution like ${productName}.`,
    Authority: `Credibility and reliability messaging will attract higher-intent buyers for ${productName}.`,
    FOMO: `Fear of missing out will drive urgency without explicit time pressure for ${productName}.`,
  };
  return hypotheses[angleName] || `${angleName} messaging will outperform other angles for ${productName}.`;
}

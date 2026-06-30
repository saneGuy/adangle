import type { ProductBrief, Angle } from "./schemas";

export const DEMO_BRIEF: ProductBrief = {
  productName: "Acme Analytics",
  description: "Real-time analytics platform that helps marketing teams measure campaign performance across all channels in one dashboard.",
  features: [
    "Real-time cross-channel dashboard",
    "Automated attribution modeling",
    "Custom report builder",
    "Slack and email alerts",
    "API access for custom integrations",
  ],
  pricing: "$49/month per seat",
  targetAudience: "Digital marketing teams and agencies",
  claims: [
    { id: "c1", text: "Reduces reporting time by 80%" },
    { id: "c2", text: "Trusted by 2,000+ marketing teams" },
    { id: "c3", text: "Connects to 50+ ad platforms and data sources" },
    { id: "c4", text: "Set up in under 5 minutes" },
    { id: "c5", text: "99.9% uptime guarantee" },
  ],
};

export const DEMO_ANGLES: Angle[] = [
  {
    name: "Urgency",
    headlines: [
      { text: "Stop Wasting Hours on Reports", platformSlot: "Meta Headline", groundedIn: ["c1"] },
      { text: "Your Data Is Aging Every Minute", platformSlot: "Google RSA Headline", groundedIn: [] },
      { text: "Set Up in Under 5 Minutes", platformSlot: "Meta Headline", groundedIn: ["c4"] },
    ],
    bodyCopy: [
      { text: "Acme Analytics cuts reporting time by 80%. Get real-time insights before your competitors do.", platformSlot: "Meta Primary Text", groundedIn: ["c1"] },
      { text: "Every hour spent building reports is an hour not optimizing. Set up Acme in 5 minutes.", platformSlot: "Meta Primary Text", groundedIn: ["c1", "c4"] },
    ],
    cta: "Start Free Trial",
  },
  {
    name: "Social Proof",
    headlines: [
      { text: "2,000+ Teams Trust Acme", platformSlot: "Meta Headline", groundedIn: ["c2"] },
      { text: "The Analytics Teams Actually Use", platformSlot: "Google RSA Headline", groundedIn: [] },
      { text: "Join 2,000+ Marketing Teams", platformSlot: "Meta Headline", groundedIn: ["c2"] },
    ],
    bodyCopy: [
      { text: "Over 2,000 marketing teams rely on Acme Analytics for real-time campaign insights.", platformSlot: "Meta Primary Text", groundedIn: ["c2"] },
      { text: "Connects to 50+ platforms. Trusted by thousands. One dashboard for everything.", platformSlot: "Meta Primary Text", groundedIn: ["c2", "c3"] },
    ],
    cta: "See Why Teams Switch",
  },
  {
    name: "Curiosity",
    headlines: [
      { text: "What Are You Missing in Your Data?", platformSlot: "Meta Headline", groundedIn: [] },
      { text: "The Report Your CMO Wants", platformSlot: "Google RSA Headline", groundedIn: [] },
      { text: "50+ Data Sources, One Truth", platformSlot: "Meta Headline", groundedIn: ["c3"] },
    ],
    bodyCopy: [
      { text: "Most teams only see half the picture. Acme connects 50+ sources into one real-time view.", platformSlot: "Meta Primary Text", groundedIn: ["c3"] },
      { text: "What if you could see every channel's performance in one place, updated live?", platformSlot: "Meta Primary Text", groundedIn: [] },
    ],
    cta: "Explore the Dashboard",
  },
  {
    name: "Pain/Solution",
    headlines: [
      { text: "Tired of Manual Reporting?", platformSlot: "Meta Headline", groundedIn: [] },
      { text: "End the Spreadsheet Chaos", platformSlot: "Google RSA Headline", groundedIn: [] },
      { text: "One Dashboard. Every Channel.", platformSlot: "Meta Headline", groundedIn: ["c3"] },
    ],
    bodyCopy: [
      { text: "Stop pulling data from 10 tabs. Acme gives you one dashboard with automated attribution.", platformSlot: "Meta Primary Text", groundedIn: ["c3"] },
      { text: "Reporting takes your team hours. Acme cuts that by 80% with real-time automation.", platformSlot: "Meta Primary Text", groundedIn: ["c1"] },
    ],
    cta: "Fix Your Reporting",
  },
  {
    name: "Authority",
    headlines: [
      { text: "99.9% Uptime. Always On.", platformSlot: "Meta Headline", groundedIn: ["c5"] },
      { text: "Built for Serious Marketers", platformSlot: "Google RSA Headline", groundedIn: [] },
      { text: "Enterprise-Grade Analytics", platformSlot: "Meta Headline", groundedIn: ["c5"] },
    ],
    bodyCopy: [
      { text: "99.9% uptime guarantee. 50+ integrations. Built for teams that can't afford data gaps.", platformSlot: "Meta Primary Text", groundedIn: ["c5", "c3"] },
      { text: "Acme Analytics is trusted by 2,000+ teams with a 99.9% uptime guarantee.", platformSlot: "Meta Primary Text", groundedIn: ["c2", "c5"] },
    ],
    cta: "See Our Reliability",
  },
  {
    name: "FOMO",
    headlines: [
      { text: "Your Competitors See This Data", platformSlot: "Meta Headline", groundedIn: [] },
      { text: "2,000 Teams Moved Already", platformSlot: "Google RSA Headline", groundedIn: ["c2"] },
      { text: "Still Using Spreadsheets?", platformSlot: "Meta Headline", groundedIn: [] },
    ],
    bodyCopy: [
      { text: "2,000+ teams already switched to real-time analytics. How long will you wait?", platformSlot: "Meta Primary Text", groundedIn: ["c2"] },
      { text: "While you build reports manually, competitors optimize in real time with Acme.", platformSlot: "Meta Primary Text", groundedIn: [] },
    ],
    cta: "Don't Fall Behind",
  },
];

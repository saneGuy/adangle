# AdAngle Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an AI ad creative generator that scrapes a product URL and generates structured ad copy across 6 psychological angles, deployed to Vercel.

**Architecture:** Single-page Next.js 14 wizard with two API routes (`/api/scrape`, `/api/generate`). Cheerio for HTML parsing, Claude API for extraction + generation, Zod for all validation. No DB, no auth.

**Tech Stack:** Next.js 14 (App Router), TypeScript, Tailwind CSS, Cheerio, Zod, @anthropic-ai/sdk

**Spec:** `docs/superpowers/specs/2026-06-30-adangle-design.md`

---

## File Structure

```
adangle/
├── app/
│   ├── layout.tsx                    — Root layout with Tailwind, metadata
│   ├── page.tsx                      — Single-page wizard orchestrator
│   ├── globals.css                   — Tailwind directives
│   ├── api/
│   │   ├── scrape/route.ts           — POST: URL → product brief
│   │   └── generate/route.ts         — POST: product brief → creatives
│   └── components/
│       ├── UrlInput.tsx              — URL input + analyze button
│       ├── ProductBriefForm.tsx      — Editable product brief (scrape result or manual)
│       ├── AngleCard.tsx             — Single angle card with creatives
│       ├── CopyButton.tsx            — Copy-to-clipboard
│       └── ExportButtons.tsx         — CSV + JSON download
├── lib/
│   ├── schemas.ts                    — All Zod schemas + inferred types
│   ├── scraper.ts                    — Cheerio HTML → text extraction + SSRF validation
│   ├── llm.ts                        — Claude API wrapper (extract + generate)
│   ├── prompts.ts                    — System/user prompts for both LLM calls
│   └── export.ts                     — CSV + JSON export helpers
├── __tests__/
│   ├── schemas.test.ts               — Zod schema validation tests
│   ├── scraper.test.ts               — SSRF + HTML extraction tests
│   ├── llm.test.ts                   — Mocked LLM client tests (extract + generate + retry)
│   ├── export.test.ts                — CSV/JSON export tests
│   └── api/
│       ├── scrape.test.ts            — Scrape API route tests (mocked LLM)
│       └── generate.test.ts          — Generate API route tests (mocked LLM)
├── vitest.config.ts                  — Vitest configuration
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js
├── .env.local                        — ANTHROPIC_API_KEY (gitignored)
├── .gitignore
└── README.md
```

---

## Chunk 1: Scaffolding + Schemas

### Task 1: Project Scaffolding

**Files:**
- Create: `package.json`, `tsconfig.json`, `tailwind.config.ts`, `next.config.js`, `app/layout.tsx`, `app/page.tsx`, `app/globals.css`, `.gitignore`, `.env.local`

- [ ] **Step 1: Initialize Next.js project**

Run:
```bash
mkdir -p /Users/lordviswa/Projects/adangle
cd /Users/lordviswa/Projects/adangle
npx create-next-app@14 . --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*" --use-npm
```
Expected: Next.js 14 project scaffolded with App Router, Tailwind, TypeScript.

Note: The directory may already exist with the spec/plan docs — that's fine, `create-next-app` will scaffold around existing files.

- [ ] **Step 2: Install dependencies**

Run:
```bash
cd /Users/lordviswa/Projects/adangle
npm install cheerio zod @anthropic-ai/sdk
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

- [ ] **Step 3: Add vitest config**

Create `vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname),
    },
  },
});
```

Add to `package.json` scripts:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 4: Create .env.local with placeholder**

```
ANTHROPIC_API_KEY=sk-ant-placeholder
```

Add `.env.local` to `.gitignore` if not already present.

- [ ] **Step 5: Verify project builds**

Run:
```bash
cd /Users/lordviswa/Projects/adangle && npm run build
```
Expected: Build succeeds.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "chore: scaffold Next.js 14 project with deps"
```

---

### Task 2: Zod Schemas + Types

**Files:**
- Create: `lib/schemas.ts`
- Test: `__tests__/schemas.test.ts`

- [ ] **Step 1: Write failing tests for schemas**

Create `__tests__/schemas.test.ts`:
```ts
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /Users/lordviswa/Projects/adangle && npx vitest run __tests__/schemas.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement schemas**

Create `lib/schemas.ts`:
```ts
import { z } from "zod";

// --- Scrape API ---

export const ScrapeRequestSchema = z.object({
  url: z.string().url(),
});

// --- Product Brief ---

export const ClaimSchema = z.object({
  id: z.string(),
  text: z.string(),
});

export const ProductBriefSchema = z.object({
  productName: z.string().min(1),
  description: z.string().min(1),
  features: z.array(z.string()).optional().default([]),
  pricing: z.string().optional().default(""),
  targetAudience: z.string().optional().default("general"),
  claims: z.array(ClaimSchema).optional().default([]),
});

// --- Generate API ---

export const GenerateRequestSchema = z.object({
  productBrief: ProductBriefSchema,
});

export const CreativeVariantSchema = z.object({
  text: z.string(),
  platformSlot: z.string(),
  groundedIn: z.array(z.string()),
});

export const HeadlineSchema = CreativeVariantSchema.extend({
  text: z.string().max(40),
});

export const BodyCopySchema = CreativeVariantSchema.extend({
  text: z.string().max(125),
});

export const AngleSchema = z.object({
  name: z.string(),
  headlines: z.array(HeadlineSchema).length(3),
  bodyCopy: z.array(BodyCopySchema).length(2),
  cta: z.string().max(25),
});

export const GenerateResponseSchema = z.object({
  angles: z.array(AngleSchema).length(6),
});

// --- Inferred Types ---

export type ScrapeRequest = z.infer<typeof ScrapeRequestSchema>;
export type Claim = z.infer<typeof ClaimSchema>;
export type ProductBrief = z.infer<typeof ProductBriefSchema>;
export type GenerateRequest = z.infer<typeof GenerateRequestSchema>;
export type CreativeVariant = z.infer<typeof CreativeVariantSchema>;
export type Angle = z.infer<typeof AngleSchema>;
export type GenerateResponse = z.infer<typeof GenerateResponseSchema>;
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd /Users/lordviswa/Projects/adangle && npx vitest run __tests__/schemas.test.ts`
Expected: All pass

- [ ] **Step 5: Commit**

```bash
cd /Users/lordviswa/Projects/adangle
git add lib/schemas.ts __tests__/schemas.test.ts
git commit -m "feat: add Zod schemas for scrape/generate API + LLM validation"
```

---

## Chunk 2: Scraper + SSRF Protection

### Task 3: URL Validator + SSRF Protection

**Files:**
- Create: `lib/scraper.ts`
- Test: `__tests__/scraper.test.ts`

- [ ] **Step 1: Write failing tests for SSRF protection + HTML extraction**

Create `__tests__/scraper.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { validateUrl, extractTextFromHtml } from "@/lib/scraper";

describe("validateUrl", () => {
  it("accepts https URL", () => {
    expect(() => validateUrl("https://example.com")).not.toThrow();
  });

  it("accepts http URL", () => {
    expect(() => validateUrl("http://example.com")).not.toThrow();
  });

  it("rejects ftp URL", () => {
    expect(() => validateUrl("ftp://example.com")).toThrow("Only http/https");
  });

  it("rejects localhost", () => {
    expect(() => validateUrl("http://localhost/admin")).toThrow();
  });

  it("rejects 127.0.0.1", () => {
    expect(() => validateUrl("http://127.0.0.1/secret")).toThrow();
  });

  it("rejects 10.x.x.x", () => {
    expect(() => validateUrl("http://10.0.0.1/internal")).toThrow();
  });

  it("rejects 172.16.x.x", () => {
    expect(() => validateUrl("http://172.16.0.1/internal")).toThrow();
  });

  it("rejects 192.168.x.x", () => {
    expect(() => validateUrl("http://192.168.1.1/internal")).toThrow();
  });

  it("rejects 169.254.x.x (link-local)", () => {
    expect(() => validateUrl("http://169.254.169.254/metadata")).toThrow();
  });

  it("rejects 0.0.0.0", () => {
    expect(() => validateUrl("http://0.0.0.0/")).toThrow();
  });

  it("rejects IPv6 loopback", () => {
    expect(() => validateUrl("http://[::1]/")).toThrow();
  });
});

describe("extractTextFromHtml", () => {
  it("extracts text content from HTML", () => {
    const html = `
      <html>
        <head><title>Product</title></head>
        <body>
          <h1>Amazing Widget</h1>
          <p>Saves you 10 hours per week.</p>
          <script>alert('xss')</script>
          <style>.hidden{display:none}</style>
        </body>
      </html>
    `;
    const text = extractTextFromHtml(html);
    expect(text).toContain("Amazing Widget");
    expect(text).toContain("Saves you 10 hours per week");
    expect(text).not.toContain("alert");
    expect(text).not.toContain("display:none");
  });

  it("truncates very long text", () => {
    const html = `<html><body><p>${"word ".repeat(20000)}</p></body></html>`;
    const text = extractTextFromHtml(html);
    expect(text.length).toBeLessThanOrEqual(15000);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /Users/lordviswa/Projects/adangle && npx vitest run __tests__/scraper.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement scraper**

Create `lib/scraper.ts`:
```ts
import * as cheerio from "cheerio";

const BLOCKED_HOSTNAMES = ["localhost", "0.0.0.0"];

const PRIVATE_IP_PATTERNS = [
  /^127\./,                          // 127.0.0.0/8
  /^10\./,                           // 10.0.0.0/8
  /^172\.(1[6-9]|2\d|3[01])\./,      // 172.16.0.0/12
  /^192\.168\./,                      // 192.168.0.0/16
  /^169\.254\./,                      // 169.254.0.0/16
  /^0\./,                             // 0.0.0.0/8
];

const BLOCKED_IPV6 = ["::1", "::"];

export function validateUrl(urlString: string): URL {
  const url = new URL(urlString);

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Only http/https URLs are allowed");
  }

  const hostname = url.hostname.replace(/^\[|\]$/g, "");

  if (BLOCKED_HOSTNAMES.includes(hostname)) {
    throw new Error("Blocked hostname");
  }

  if (BLOCKED_IPV6.includes(hostname)) {
    throw new Error("Blocked IPv6 address");
  }

  // Check IPv6 private ranges (fe80::/10 link-local, fc00::/7 ULA)
  if (/^fe[89ab]/i.test(hostname) || /^f[cd]/i.test(hostname)) {
    throw new Error("Private IPv6 address blocked");
  }

  for (const pattern of PRIVATE_IP_PATTERNS) {
    if (pattern.test(hostname)) {
      throw new Error("Private IP addresses are blocked");
    }
  }

  return url;
}

export function extractTextFromHtml(html: string): string {
  const $ = cheerio.load(html);

  // Remove non-content elements
  $("script, style, nav, footer, header, iframe, noscript").remove();

  const text = $("body").text();

  // Collapse whitespace
  const cleaned = text.replace(/\s+/g, " ").trim();

  // Truncate to ~15k chars to stay within LLM context limits
  return cleaned.slice(0, 15000);
}

const MAX_REDIRECTS = 3;
const MAX_SIZE = 5 * 1024 * 1024;

export async function fetchAndExtract(urlString: string): Promise<string> {
  let currentUrl = urlString;

  for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount++) {
    // Validate EVERY URL (initial + each redirect target)
    validateUrl(currentUrl);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(currentUrl, {
        signal: controller.signal,
        redirect: "manual", // Handle redirects manually to validate each hop
        headers: {
          "User-Agent": "AdAngle/1.0 (product-analysis)",
        },
      });

      // Handle redirects manually
      if ([301, 302, 303, 307, 308].includes(response.status)) {
        const location = response.headers.get("location");
        if (!location) throw new Error("Redirect without Location header");
        // Resolve relative redirects
        currentUrl = new URL(location, currentUrl).toString();
        continue; // Loop back to validate the new URL
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      // Check content type
      const contentType = response.headers.get("content-type") || "";
      if (!contentType.includes("text/html")) {
        throw new Error("URL did not return HTML content");
      }

      // Check size via header
      const contentLength = response.headers.get("content-length");
      if (contentLength && parseInt(contentLength) > MAX_SIZE) {
        throw new Error("Response too large (>5MB)");
      }

      const html = await response.text();

      if (html.length > MAX_SIZE) {
        throw new Error("Response too large (>5MB)");
      }

      return extractTextFromHtml(html);
    } finally {
      clearTimeout(timeout);
    }
  }

  throw new Error("Too many redirects");
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd /Users/lordviswa/Projects/adangle && npx vitest run __tests__/scraper.test.ts`
Expected: All pass

- [ ] **Step 5: Commit**

```bash
cd /Users/lordviswa/Projects/adangle
git add lib/scraper.ts __tests__/scraper.test.ts
git commit -m "feat: add URL scraper with SSRF protection + HTML text extraction"
```

---

## Chunk 3: LLM Integration (Prompts + Client)

### Task 4: LLM Prompts

**Files:**
- Create: `lib/prompts.ts`

- [ ] **Step 1: Write extraction + generation prompts**

Create `lib/prompts.ts`:
```ts
export const EXTRACTION_SYSTEM_PROMPT = `You are a product analyst. Given webpage text, extract structured product information.

Return ONLY valid JSON matching this exact schema:
{
  "productName": "string",
  "description": "string (1-2 sentence value proposition)",
  "features": ["string array of key features"],
  "pricing": "string or empty string if not found",
  "targetAudience": "string describing who this is for",
  "claims": [{"id": "c1", "text": "specific claim from the page"}, ...]
}

Rules:
- Extract ONLY information explicitly stated on the page
- Do NOT invent or infer claims not present in the text
- Number claims sequentially: c1, c2, c3, ...
- If a field is not found, use empty string or empty array
- Keep descriptions concise`;

export const GENERATION_SYSTEM_PROMPT = `You are an expert performance marketing copywriter. Given a product brief, generate ad creatives across 6 psychological angles.

Return ONLY valid JSON matching this exact schema:
{
  "angles": [
    {
      "name": "Urgency",
      "headlines": [
        {"text": "max 40 chars", "platformSlot": "Meta Headline", "groundedIn": ["c1"]},
        {"text": "max 40 chars", "platformSlot": "Google RSA Headline", "groundedIn": []},
        {"text": "max 40 chars", "platformSlot": "Meta Headline", "groundedIn": []}
      ],
      "bodyCopy": [
        {"text": "max 125 chars", "platformSlot": "Meta Primary Text", "groundedIn": ["c1"]},
        {"text": "max 125 chars", "platformSlot": "Meta Primary Text", "groundedIn": []}
      ],
      "cta": "max 25 chars"
    }
  ]
}

The 6 angles (in this order): Urgency, Social Proof, Curiosity, Pain/Solution, Authority, FOMO

Platform slot assignments:
- Headlines: alternate between "Meta Headline" and "Google RSA Headline"
- Body copy: always "Meta Primary Text"

CRITICAL GROUNDING RULES:
- groundedIn must reference claim IDs from the product brief's claims array
- Only reference claims, metrics, endorsements, or statistics that appear in the extracted claims
- Do NOT invent numbers, ratings, expert endorsements, health/financial outcomes, or guarantees
- If no claim supports an angle, use general benefit language and leave groundedIn as []
- Every creative must be factually defensible

Character limits are STRICT:
- Headlines: max 40 characters
- Body copy: max 125 characters
- CTA: max 25 characters`;

export function buildExtractionUserPrompt(pageText: string): string {
  return `Extract product information from this webpage text:\n\n${pageText}`;
}

export function buildGenerationUserPrompt(brief: {
  productName: string;
  description: string;
  features: string[];
  pricing: string;
  targetAudience: string;
  claims: { id: string; text: string }[];
}): string {
  return `Generate ad creatives for this product:

Product: ${brief.productName}
Description: ${brief.description}
Features: ${brief.features.join(", ") || "none listed"}
Pricing: ${brief.pricing || "not specified"}
Target Audience: ${brief.targetAudience}
Claims:
${brief.claims.map((c) => `  ${c.id}: ${c.text}`).join("\n") || "  none"}`;
}
```

- [ ] **Step 2: Commit**

```bash
cd /Users/lordviswa/Projects/adangle
git add lib/prompts.ts
git commit -m "feat: add LLM prompts for extraction and generation"
```

### Task 5: LLM Client

**Files:**
- Create: `lib/llm.ts`

- [ ] **Step 1: Implement LLM client**

Create `lib/llm.ts`:
```ts
import Anthropic from "@anthropic-ai/sdk";
import { ProductBriefSchema, GenerateResponseSchema } from "./schemas";
import type { ProductBrief, GenerateResponse } from "./schemas";
import {
  EXTRACTION_SYSTEM_PROMPT,
  GENERATION_SYSTEM_PROMPT,
  buildExtractionUserPrompt,
  buildGenerationUserPrompt,
} from "./prompts";

/** Extract JSON object from LLM text that may contain markdown fences or prose. */
function parseJsonFromLLM(text: string): unknown {
  // Try direct parse first
  try {
    return JSON.parse(text);
  } catch {
    // Strip markdown code fences if present
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenced) {
      return JSON.parse(fenced[1].trim());
    }
    // Find the outermost balanced { } block
    const start = text.indexOf("{");
    if (start === -1) throw new Error("LLM did not return valid JSON");
    let depth = 0;
    for (let i = start; i < text.length; i++) {
      if (text[i] === "{") depth++;
      if (text[i] === "}") depth--;
      if (depth === 0) {
        return JSON.parse(text.slice(start, i + 1));
      }
    }
    throw new Error("LLM returned malformed JSON");
  }
}

function getClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey === "sk-ant-placeholder") {
    throw new Error("ANTHROPIC_API_KEY is not configured. Set it in .env.local");
  }
  return new Anthropic({ apiKey });
}

export async function extractProductBrief(pageText: string): Promise<ProductBrief> {
  const client = getClient();

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2048,
    system: EXTRACTION_SYSTEM_PROMPT,
    messages: [{ role: "user", content: buildExtractionUserPrompt(pageText) }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  const parsed = parseJsonFromLLM(text);
  return ProductBriefSchema.parse(parsed);
}

export async function generateCreatives(
  brief: ProductBrief
): Promise<GenerateResponse> {
  const client = getClient();

  const callLLM = async (extraInstruction?: string) => {
    const userPrompt = buildGenerationUserPrompt(brief) +
      (extraInstruction ? `\n\n${extraInstruction}` : "");

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: GENERATION_SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";
    return parseJsonFromLLM(text);
  };

  // First attempt
  const raw = await callLLM();
  const firstTry = GenerateResponseSchema.safeParse(raw);
  if (firstTry.success) return firstTry.data;

  // Retry once with validation error feedback
  const errorMsg = `Your previous response had validation errors. Fix these issues:\n${JSON.stringify(firstTry.error.issues, null, 2)}`;
  const retryRaw = await callLLM(errorMsg);
  const secondTry = GenerateResponseSchema.safeParse(retryRaw);
  if (secondTry.success) return secondTry.data;

  // Return partial results with relaxed validation
  throw new Error(
    `LLM output failed validation after retry: ${JSON.stringify(secondTry.error.issues.slice(0, 3))}`
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd /Users/lordviswa/Projects/adangle
git add lib/llm.ts
git commit -m "feat: add Claude API client with extraction + generation + retry"
```

### Task 5b: Mocked LLM Tests

**Files:**
- Create: `__tests__/llm.test.ts`

- [ ] **Step 1: Write mocked LLM tests**

Create `__tests__/llm.test.ts`:
```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the Anthropic SDK before importing llm
vi.mock("@anthropic-ai/sdk", () => {
  const mockCreate = vi.fn();
  return {
    default: vi.fn().mockImplementation(() => ({
      messages: { create: mockCreate },
    })),
    __mockCreate: mockCreate,
  };
});

// Set env before importing
process.env.ANTHROPIC_API_KEY = "sk-ant-test-key";

import { extractProductBrief, generateCreatives } from "@/lib/llm";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const { __mockCreate: mockCreate } = await import("@anthropic-ai/sdk") as any;

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
    // First call returns invalid (only 2 angles)
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

  it("throws after two validation failures", async () => {
    const bad = { angles: [] };
    mockCreate.mockResolvedValue({
      content: [{ type: "text", text: JSON.stringify(bad) }],
    });

    await expect(generateCreatives(validBrief)).rejects.toThrow("failed validation after retry");
    expect(mockCreate).toHaveBeenCalledTimes(2);
  });
});
```

- [ ] **Step 2: Run tests to verify they pass**

Run: `cd /Users/lordviswa/Projects/adangle && npx vitest run __tests__/llm.test.ts`
Expected: All pass

- [ ] **Step 3: Commit**

```bash
cd /Users/lordviswa/Projects/adangle
git add __tests__/llm.test.ts
git commit -m "test: add mocked LLM client tests (extract, generate, retry)"
```

---

## Chunk 4: API Routes

### Task 6: Scrape API Route

**Files:**
- Create: `app/api/scrape/route.ts`

- [ ] **Step 1: Implement scrape route**

Create `app/api/scrape/route.ts`:
```ts
import { NextRequest, NextResponse } from "next/server";
import { ScrapeRequestSchema } from "@/lib/schemas";
import { fetchAndExtract } from "@/lib/scraper";
import { extractProductBrief } from "@/lib/llm";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = ScrapeRequestSchema.parse(body);

    const pageText = await fetchAndExtract(url);
    const brief = await extractProductBrief(pageText);

    return NextResponse.json(brief);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Scrape failed";
    return NextResponse.json(
      { error: "scrape_failed", message },
      { status: 400 }
    );
  }
}
```

- [ ] **Step 2: Commit**

```bash
cd /Users/lordviswa/Projects/adangle
git add app/api/scrape/route.ts
git commit -m "feat: add /api/scrape route with SSRF protection"
```

### Task 7: Generate API Route

**Files:**
- Create: `app/api/generate/route.ts`

- [ ] **Step 1: Implement generate route**

Create `app/api/generate/route.ts`:
```ts
import { NextRequest, NextResponse } from "next/server";
import { GenerateRequestSchema } from "@/lib/schemas";
import { generateCreatives } from "@/lib/llm";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productBrief } = GenerateRequestSchema.parse(body);

    const result = await generateCreatives(productBrief);

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Generation failed";
    return NextResponse.json(
      { error: "generate_failed", message },
      { status: 400 }
    );
  }
}
```

- [ ] **Step 2: Commit**

```bash
cd /Users/lordviswa/Projects/adangle
git add app/api/generate/route.ts
git commit -m "feat: add /api/generate route with Zod validation + retry"
```

### Task 7b: API Route Tests (Mocked)

**Files:**
- Create: `__tests__/api/scrape.test.ts`, `__tests__/api/generate.test.ts`

- [ ] **Step 1: Write scrape API route tests**

Create `__tests__/api/scrape.test.ts`:
```ts
import { describe, it, expect, vi } from "vitest";

// Mock dependencies
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
```

- [ ] **Step 2: Write generate API route tests**

Create `__tests__/api/generate.test.ts`:
```ts
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
    const mockResult = { angles: [] }; // simplified for test
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
```

- [ ] **Step 3: Run all tests**

Run: `cd /Users/lordviswa/Projects/adangle && npx vitest run`
Expected: All pass

- [ ] **Step 4: Commit**

```bash
cd /Users/lordviswa/Projects/adangle
git add __tests__/api/
git commit -m "test: add API route tests with mocked LLM"
```

---

## Chunk 5: Export Helpers

### Task 8: CSV + JSON Export

**Files:**
- Create: `lib/export.ts`
- Test: `__tests__/export.test.ts`

- [ ] **Step 1: Write failing tests**

Create `__tests__/export.test.ts`:
```ts
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /Users/lordviswa/Projects/adangle && npx vitest run __tests__/export.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement export helpers**

Create `lib/export.ts`:
```ts
import type { Angle } from "./schemas";

function escapeCsv(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function anglesToCsv(angles: Angle[]): string {
  const header = "angle,platform_slot,variant_index,text,cta,grounded_in";
  const rows: string[] = [];

  for (const angle of angles) {
    for (let i = 0; i < angle.headlines.length; i++) {
      const h = angle.headlines[i];
      rows.push(
        [
          escapeCsv(angle.name),
          escapeCsv(h.platformSlot),
          `headline_${i + 1}`,
          escapeCsv(h.text),
          escapeCsv(angle.cta),
          escapeCsv(h.groundedIn.join(";")),
        ].join(",")
      );
    }
    for (let i = 0; i < angle.bodyCopy.length; i++) {
      const b = angle.bodyCopy[i];
      rows.push(
        [
          escapeCsv(angle.name),
          escapeCsv(b.platformSlot),
          `body_${i + 1}`,
          escapeCsv(b.text),
          escapeCsv(angle.cta),
          escapeCsv(b.groundedIn.join(";")),
        ].join(",")
      );
    }
  }

  return [header, ...rows].join("\n");
}

export function anglesToJson(angles: Angle[]): string {
  return JSON.stringify({ angles }, null, 2);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd /Users/lordviswa/Projects/adangle && npx vitest run __tests__/export.test.ts`
Expected: All pass

- [ ] **Step 5: Commit**

```bash
cd /Users/lordviswa/Projects/adangle
git add lib/export.ts __tests__/export.test.ts
git commit -m "feat: add CSV + JSON export helpers with tests"
```

---

## Chunk 6: UI Components

### Task 9: CopyButton + ExportButtons Components

**Files:**
- Create: `app/components/CopyButton.tsx`, `app/components/ExportButtons.tsx`

- [ ] **Step 1: Create CopyButton**

Create `app/components/CopyButton.tsx`:
```tsx
"use client";

import { useState } from "react";

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button
      onClick={handleCopy}
      className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}
```

- [ ] **Step 2: Create ExportButtons**

Create `app/components/ExportButtons.tsx`:
```tsx
"use client";

import type { Angle } from "@/lib/schemas";
import { anglesToCsv, anglesToJson } from "@/lib/export";

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function ExportButtons({ angles }: { angles: Angle[] }) {
  return (
    <div className="flex gap-3">
      <button
        onClick={() => downloadFile(anglesToCsv(angles), "adangle-creatives.csv", "text/csv")}
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm font-medium"
      >
        Download CSV
      </button>
      <button
        onClick={() => downloadFile(anglesToJson(angles), "adangle-creatives.json", "application/json")}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
      >
        Download JSON
      </button>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
cd /Users/lordviswa/Projects/adangle
git add app/components/CopyButton.tsx app/components/ExportButtons.tsx
git commit -m "feat: add CopyButton + ExportButtons components"
```

### Task 10: AngleCard Component

**Files:**
- Create: `app/components/AngleCard.tsx`

- [ ] **Step 1: Create AngleCard**

Create `app/components/AngleCard.tsx`:
```tsx
"use client";

import type { Angle, Claim } from "@/lib/schemas";
import { CopyButton } from "./CopyButton";

const ANGLE_COLORS: Record<string, string> = {
  Urgency: "border-red-400 bg-red-50",
  "Social Proof": "border-blue-400 bg-blue-50",
  Curiosity: "border-purple-400 bg-purple-50",
  "Pain/Solution": "border-orange-400 bg-orange-50",
  Authority: "border-green-400 bg-green-50",
  FOMO: "border-yellow-400 bg-yellow-50",
};

export function AngleCard({
  angle,
  claims,
}: {
  angle: Angle;
  claims: Claim[];
}) {
  const colorClass = ANGLE_COLORS[angle.name] || "border-gray-400 bg-gray-50";
  const claimMap = Object.fromEntries(claims.map((c) => [c.id, c.text]));

  return (
    <div className={`border-2 rounded-lg p-4 ${colorClass}`}>
      <h3 className="text-lg font-bold mb-3">{angle.name}</h3>

      {/* Headlines */}
      <div className="mb-3">
        <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Headlines</h4>
        {angle.headlines.map((h, i) => (
          <div key={i} className="flex items-start justify-between gap-2 mb-1">
            <div className="flex-1">
              <p className="text-sm font-medium">{h.text}</p>
              <span className="text-xs text-gray-400">{h.platformSlot}</span>
              {h.groundedIn.length > 0 && (
                <div className="flex gap-1 mt-0.5">
                  {h.groundedIn.map((id) => (
                    <span key={id} className="text-xs bg-white/60 px-1 rounded" title={claimMap[id]}>
                      {id}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <CopyButton text={h.text} />
          </div>
        ))}
      </div>

      {/* Body Copy */}
      <div className="mb-3">
        <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Body Copy</h4>
        {angle.bodyCopy.map((b, i) => (
          <div key={i} className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1">
              <p className="text-sm">{b.text}</p>
              <span className="text-xs text-gray-400">{b.platformSlot}</span>
              {b.groundedIn.length > 0 && (
                <div className="flex gap-1 mt-0.5">
                  {b.groundedIn.map((id) => (
                    <span key={id} className="text-xs bg-white/60 px-1 rounded" title={claimMap[id]}>
                      {id}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <CopyButton text={b.text} />
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="flex items-center justify-between border-t pt-2">
        <div>
          <span className="text-xs text-gray-500 uppercase">CTA: </span>
          <span className="text-sm font-semibold">{angle.cta}</span>
        </div>
        <CopyButton text={angle.cta} />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd /Users/lordviswa/Projects/adangle
git add app/components/AngleCard.tsx
git commit -m "feat: add AngleCard component with platform labels + grounding"
```

### Task 11: UrlInput + ProductBriefForm Components

**Files:**
- Create: `app/components/UrlInput.tsx`, `app/components/ProductBriefForm.tsx`

- [ ] **Step 1: Create UrlInput**

Create `app/components/UrlInput.tsx`:
```tsx
"use client";

import { useState } from "react";

export function UrlInput({
  onAnalyze,
  loading,
}: {
  onAnalyze: (url: string) => void;
  loading: boolean;
}) {
  const [url, setUrl] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) onAnalyze(url.trim());
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-3 w-full max-w-2xl">
      <input
        type="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://example.com/product"
        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        required
        disabled={loading}
      />
      <button
        type="submit"
        disabled={loading || !url.trim()}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
      >
        {loading ? "Analyzing..." : "Analyze"}
      </button>
    </form>
  );
}
```

- [ ] **Step 2: Create ProductBriefForm**

Create `app/components/ProductBriefForm.tsx`:
```tsx
"use client";

import { useState, useEffect } from "react";
import type { ProductBrief, Claim } from "@/lib/schemas";

export function ProductBriefForm({
  initial,
  onGenerate,
  loading,
}: {
  initial?: ProductBrief;
  onGenerate: (brief: ProductBrief) => void;
  loading: boolean;
}) {
  const [productName, setProductName] = useState(initial?.productName || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [features, setFeatures] = useState(initial?.features?.join("\n") || "");
  const [pricing, setPricing] = useState(initial?.pricing || "");
  const [targetAudience, setTargetAudience] = useState(initial?.targetAudience || "");
  const [claimsText, setClaimsText] = useState(
    initial?.claims?.map((c) => c.text).join("\n") || ""
  );

  // Sync local state when initial prop changes (e.g., after scrape completes)
  useEffect(() => {
    if (initial) {
      setProductName(initial.productName || "");
      setDescription(initial.description || "");
      setFeatures(initial.features?.join("\n") || "");
      setPricing(initial.pricing || "");
      setTargetAudience(initial.targetAudience || "");
      setClaimsText(initial.claims?.map((c) => c.text).join("\n") || "");
    }
  }, [initial]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const claimLines = claimsText.split("\n").filter((l) => l.trim());
    const claims: Claim[] = claimLines.map((text, i) => ({
      id: `c${i + 1}`,
      text: text.trim(),
    }));

    onGenerate({
      productName,
      description,
      features: features.split("\n").filter((f) => f.trim()),
      pricing,
      targetAudience: targetAudience || "general",
      claims,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl space-y-4">
      <h2 className="text-lg font-semibold">Product Brief</h2>
      <p className="text-sm text-gray-500">Review and edit the extracted information before generating creatives.</p>

      <div>
        <label className="block text-sm font-medium mb-1">
          Product Name <span className="text-red-500">*</span>
        </label>
        <input
          value={productName}
          onChange={(e) => setProductName(e.target.value)}
          className="w-full px-3 py-2 border rounded text-sm"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Description <span className="text-red-500">*</span>
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-3 py-2 border rounded text-sm"
          rows={2}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Features (one per line)</label>
        <textarea
          value={features}
          onChange={(e) => setFeatures(e.target.value)}
          className="w-full px-3 py-2 border rounded text-sm"
          rows={3}
          placeholder="Fast processing&#10;Easy integration&#10;24/7 support"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Pricing</label>
          <input
            value={pricing}
            onChange={(e) => setPricing(e.target.value)}
            className="w-full px-3 py-2 border rounded text-sm"
            placeholder="$49/month"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Target Audience</label>
          <input
            value={targetAudience}
            onChange={(e) => setTargetAudience(e.target.value)}
            className="w-full px-3 py-2 border rounded text-sm"
            placeholder="Small business owners"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Claims (one per line)</label>
        <textarea
          value={claimsText}
          onChange={(e) => setClaimsText(e.target.value)}
          className="w-full px-3 py-2 border rounded text-sm"
          rows={3}
          placeholder="Saves 10 hours per week&#10;Used by 5000+ companies&#10;99.9% uptime"
        />
      </div>

      <button
        type="submit"
        disabled={loading || !productName.trim() || !description.trim()}
        className="w-full py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Generating Creatives..." : "Generate Creatives"}
      </button>
    </form>
  );
}
```

- [ ] **Step 3: Commit**

```bash
cd /Users/lordviswa/Projects/adangle
git add app/components/UrlInput.tsx app/components/ProductBriefForm.tsx
git commit -m "feat: add UrlInput + ProductBriefForm components"
```

---

## Chunk 7: Main Page (Wizard Orchestrator)

### Task 12: Wire Up the Wizard

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Implement the single-page wizard**

Replace `app/page.tsx` with:
```tsx
"use client";

import { useState } from "react";
import type { ProductBrief, Angle, Claim } from "@/lib/schemas";
import { UrlInput } from "./components/UrlInput";
import { ProductBriefForm } from "./components/ProductBriefForm";
import { AngleCard } from "./components/AngleCard";
import { ExportButtons } from "./components/ExportButtons";

type Step = "input" | "brief" | "results";

export default function Home() {
  const [step, setStep] = useState<Step>("input");
  const [brief, setBrief] = useState<ProductBrief | undefined>();
  const [angles, setAngles] = useState<Angle[]>([]);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [scrapeError, setScrapeError] = useState(false);

  const handleAnalyze = async (url: string) => {
    setLoading(true);
    setError("");
    setScrapeError(false);
    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (data.error) {
        setScrapeError(true);
        setStep("brief");
      } else {
        setBrief(data as ProductBrief);
        setStep("brief");
      }
    } catch {
      setScrapeError(true);
      setStep("brief");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async (editedBrief: ProductBrief) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productBrief: editedBrief }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.message || "Generation failed");
      } else {
        setBrief(editedBrief);
        setAngles(data.angles);
        setStep("results");
      }
    } catch {
      setError("Failed to generate creatives. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStep("input");
    setBrief(undefined);
    setAngles([]);
    setError("");
    setScrapeError(false);
  };

  const claims: Claim[] = brief?.claims || [];

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">AdAngle</h1>
          <p className="text-gray-500">
            Paste a product URL. Get ad creatives across 6 psychological angles.
          </p>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="max-w-2xl mx-auto mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Step 1: URL Input */}
        {step === "input" && (
          <div className="flex flex-col items-center gap-4">
            <UrlInput onAnalyze={handleAnalyze} loading={loading} />
            <button
              onClick={() => setStep("brief")}
              className="text-sm text-gray-500 underline hover:text-gray-700"
            >
              Or enter product details manually
            </button>
          </div>
        )}

        {/* Step 2: Product Brief */}
        {step === "brief" && (
          <div className="flex flex-col items-center gap-4">
            {scrapeError && (
              <div className="max-w-2xl w-full p-3 bg-yellow-50 border border-yellow-200 rounded text-yellow-700 text-sm">
                Could not scrape the URL. Please enter product details manually.
              </div>
            )}
            <ProductBriefForm
              initial={brief}
              onGenerate={handleGenerate}
              loading={loading}
            />
            <button
              onClick={handleReset}
              className="text-sm text-gray-500 underline hover:text-gray-700"
            >
              Start over
            </button>
          </div>
        )}

        {/* Step 3: Results */}
        {step === "results" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold">
                  Creatives for {brief?.productName}
                </h2>
                {claims.length > 0 && (
                  <div className="flex gap-2 mt-1 flex-wrap">
                    {claims.map((c) => (
                      <span
                        key={c.id}
                        className="text-xs bg-gray-100 px-2 py-0.5 rounded"
                        title={c.text}
                      >
                        {c.id}: {c.text}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-3 items-center">
                <ExportButtons angles={angles} />
                <button
                  onClick={handleReset}
                  className="px-4 py-2 border rounded text-sm hover:bg-gray-50"
                >
                  New Analysis
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {angles.map((angle) => (
                <AngleCard key={angle.name} angle={angle} claims={claims} />
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Update layout.tsx metadata**

Replace `app/layout.tsx` metadata:
```tsx
export const metadata = {
  title: "AdAngle — AI Ad Creative Generator",
  description: "Paste a product URL, get ad creatives across 6 psychological angles.",
};
```

- [ ] **Step 3: Verify build succeeds**

Run: `cd /Users/lordviswa/Projects/adangle && npm run build`
Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
cd /Users/lordviswa/Projects/adangle
git add app/page.tsx app/layout.tsx
git commit -m "feat: wire up single-page wizard with all components"
```

---

## Chunk 8: Testing, README, Deploy

### Task 13: Manual Smoke Test

- [ ] **Step 1: Set real API key in .env.local**

```bash
# Add your real ANTHROPIC_API_KEY to .env.local
```

- [ ] **Step 2: Start dev server and test all flows**

Run: `cd /Users/lordviswa/Projects/adangle && npm run dev`

Test:
1. Paste a real product URL → verify brief extraction → verify creative generation
2. Test manual input flow (click "enter product details manually")
3. Test copy buttons
4. Test CSV + JSON download
5. Test scrape failure recovery (paste invalid URL)

- [ ] **Step 3: Run all unit tests**

Run: `cd /Users/lordviswa/Projects/adangle && npm test`
Expected: All pass

### Task 14: README

**Files:**
- Create: `README.md`

- [ ] **Step 1: Write README**

Create `README.md` with:
- What it does (product URL → 6 angles × structured creatives)
- Why this tool (creative fatigue problem, grounded claims, platform-ready, CSV export)
- What you'd build next (campaign history, A/B tracking, ad platform integration, image gen)
- Example input/output (use a real example from smoke testing)
- Tech stack
- How to run locally

- [ ] **Step 2: Commit**

```bash
cd /Users/lordviswa/Projects/adangle
git add README.md
git commit -m "docs: add README with contest answers + example"
```

### Task 15: Deploy to Vercel

- [ ] **Step 1: Create GitHub repo**

```bash
cd /Users/lordviswa/Projects/adangle
gh repo create saneGuy/adangle --public --source=. --push
```

- [ ] **Step 2: Link Vercel project and set env vars FIRST**

```bash
cd /Users/lordviswa/Projects/adangle
npx vercel link
npx vercel env add ANTHROPIC_API_KEY production
```

Enter your real Anthropic API key when prompted.

- [ ] **Step 3: Deploy to Vercel**

```bash
cd /Users/lordviswa/Projects/adangle
npx vercel --prod
```

- [ ] **Step 4: Verify live URL works**

Test the deployed URL end-to-end:
1. Paste a real product URL → verify brief extraction
2. Edit brief → generate creatives
3. Verify all 6 angle cards render
4. Test copy buttons + CSV/JSON download
5. Test manual input flow

- [ ] **Step 5: Submit to contest**

Register at itstoday.media and submit:
1. Live URL
2. GitHub repo URL
3. README (already in repo)

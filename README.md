# AdAngle — AI Ad Creative Generator

Paste a product URL. Get ad creatives across 6 psychological angles, ready to copy into Meta Ads, Google Ads, or any ad platform.

## What does it do?

AdAngle takes a product or offer URL, scrapes the page to extract product information, and generates structured ad copy across six proven persuasion angles:

| Angle | Strategy |
|-------|----------|
| **Urgency** | Time-limited offers, scarcity |
| **Social Proof** | Community, adoption, reviews |
| **Curiosity** | Intrigue, questions, reveals |
| **Pain/Solution** | Problem identification, resolution |
| **Authority** | Expertise, credentials, trust |
| **FOMO** | Exclusivity, trending, missing out |

For each angle, AdAngle generates:
- **3 headlines** (max 40 chars — Meta/Google headline length)
- **2 body copy variants** (max 125 chars — Meta Primary Text length)
- **1 CTA** (max 25 chars)

Every creative is labeled with its ad platform slot (e.g., "Meta Headline", "Google RSA Headline", "Meta Primary Text") so you can drop them straight into your campaign.

### Grounded in facts, not hallucinations

Each creative references specific claims extracted from the product page. AdAngle shows which source facts back each headline and body copy variant. The AI is explicitly instructed never to invent numbers, ratings, endorsements, or guarantees.

### Export for bulk upload

Download all creatives as CSV (for ad platform bulk upload) or JSON (for programmatic use). CSV columns: `angle, platform_slot, variant_index, text, cta, grounded_in`.

## Why this tool?

Creative fatigue is the #1 time sink for media buyers. Ads stop performing, and teams need constant new copy variations across different angles. Generating these manually is slow and repetitive.

AdAngle solves this by:
1. **Extracting real product claims** from the page (no manual data entry)
2. **Generating across 6 proven angles** so you always have fresh hooks
3. **Grounding every creative in source facts** so claims are defensible
4. **Formatting for ad platforms** with character limits and slot labels built in
5. **Exporting as CSV** for instant bulk upload to Meta, Google, etc.

A media buyer can go from product URL to 30 platform-ready ad creatives in under 60 seconds.

## What would you build next?

1. **Campaign history** — save and compare creative sets over time
2. **A/B test result tracking** — learn which angles perform best per vertical
3. **Ad platform API integration** — publish creatives directly to Meta Ads Manager and Google Ads
4. **Image creative generation** — pair copy with AI-generated visuals
5. **Competitor analysis** — paste a competitor's ad, reverse-engineer their angle, generate counter-positioning

## Example

**Input:** `https://linear.app`

**Extracted Brief:**
```json
{
  "productName": "Linear",
  "description": "Purpose-built for modern product development. Streamline issues, projects, and product roadmaps.",
  "features": ["Issue tracking", "Project management", "Roadmaps", "Cycles"],
  "pricing": "Free for small teams",
  "targetAudience": "Software development teams",
  "claims": [
    {"id": "c1", "text": "Purpose-built for modern product development"},
    {"id": "c2", "text": "Used by thousands of product teams"},
    {"id": "c3", "text": "Free for small teams"}
  ]
}
```

**Sample Output (Urgency angle):**

| Slot | Text | Grounded In |
|------|------|-------------|
| Meta Headline | Switch to Linear Before Q3 Planning | — |
| Google RSA Headline | Free for Small Teams — Start Now | c3 |
| Meta Headline | Modern Teams Ship Faster with Linear | c1 |
| Meta Primary Text | Purpose-built for product development. Start free and upgrade as your team grows. | c1, c3 |
| Meta Primary Text | Thousands of teams already switched. Don't start Q3 with outdated tools. | c2 |
| CTA | Start Free |

## Tech Stack

- **Next.js 16** (App Router) — single-page wizard, two API routes
- **TypeScript** — full type safety via Zod schema inference
- **Claude API** (Anthropic) — product extraction + creative generation
- **Cheerio** — HTML parsing with SSRF protection
- **Zod** — request/response validation + LLM output enforcement
- **Tailwind CSS** — minimal, functional UI
- **Vitest** — 41 tests (schemas, SSRF, LLM mocks, API routes, exports)

## Run Locally

```bash
git clone https://github.com/saneGuy/adangle.git
cd adangle
npm install
echo "ANTHROPIC_API_KEY=your-key-here" > .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Run Tests

```bash
npm test
```

## Architecture

```
app/
  page.tsx              — Single-page wizard (input → brief → results)
  api/scrape/route.ts   — POST: URL → product brief (Cheerio + Claude)
  api/generate/route.ts — POST: brief → creatives (Claude + Zod validation)
  components/           — UrlInput, ProductBriefForm, AngleCard, CopyButton, ExportButtons
lib/
  schemas.ts            — Zod schemas for all data types
  scraper.ts            — URL fetching with SSRF protection
  llm.ts                — Claude API client with retry on validation failure
  prompts.ts            — System prompts for extraction + generation
  export.ts             — CSV + JSON export helpers
```

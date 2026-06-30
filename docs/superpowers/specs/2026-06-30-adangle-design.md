# AdAngle — AI Ad Creative Generator

## Contest
- **Host:** It's Today Media (performance/affiliate marketing)
- **Prize:** $5,000 + full-time job offer
- **Deadline:** July 4, 2026, 11:59 PM ET
- **Submission:** Live URL + GitHub repo + README

## Problem
Media buyers suffer from **creative fatigue**: ads stop performing and teams need constant new copy variations across different psychological angles. Generating these manually is slow and repetitive. An AI tool that extracts product information from a URL and generates structured ad creatives across proven persuasion frameworks saves hours per campaign launch.

## Solution
A web app where a media buyer pastes a product/offer URL and gets back structured ad creatives across 6 psychological angles, ready to copy into ad platforms.

## User Flow

```
1. Paste URL ──► 2. Review/Edit Extracted Brief ──► 3. Generate Creatives ──► 4. Browse & Export
```

### Step 1: Input
- Single text input for product/offer URL
- Fallback: if scraping fails, show a manual form (product name, description, features, pricing, target audience)

### Step 2: Editable Product Brief
- After scraping + LLM extraction, display an editable form with:
  - Product name
  - Description / value proposition
  - Key features (list)
  - Pricing
  - Target audience
  - Key claims
- User can correct any field before generation
- This prevents hallucinated ad claims downstream

### Step 3: Generate Creatives
- Takes the (possibly edited) product brief
- Generates ad copy across 6 psychological angles:
  1. **Urgency** — "Limited time...", "Act now..."
  2. **Social Proof** — "Join 10,000+ customers...", "Top-rated..."
  3. **Curiosity** — "The secret behind...", "What if..."
  4. **Pain/Solution** — "Tired of X? Here's Y..."
  5. **Authority** — "Recommended by experts...", "Industry-leading..."
  6. **FOMO** — "Don't miss out...", "Everyone's switching to..."
- Per angle output (structured JSON from LLM):
  - 3 headlines (short, punchy)
  - 2 body copy variants (2-3 sentences each)
  - 1 CTA
  - Source facts: which extracted product claims each creative references

### Step 4: Browse & Export
- Card grid layout, one card per angle
- Each card shows the angle name, its creatives, and cited source facts
- Actions:
  - Copy individual headline/body/CTA to clipboard
  - Download all creatives as CSV (for ad platform bulk upload)
  - Download all as JSON (for programmatic use)

## Architecture

```
Next.js 14 App (Vercel)
├── app/
│   ├── page.tsx              — Landing page + URL input form
│   ├── results/page.tsx      — Card grid of generated creatives
│   ├── api/
│   │   ├── scrape/route.ts   — Fetch URL, parse with Cheerio, extract with LLM
│   │   └── generate/route.ts — Take product brief, return creatives as structured JSON
│   └── components/
│       ├── ProductBriefForm.tsx  — Editable extraction review
│       ├── AngleCard.tsx         — Single angle's creatives
│       ├── CopyButton.tsx        — Copy-to-clipboard
│       └── ExportButtons.tsx     — CSV/JSON download
├── lib/
│   ├── scraper.ts            — Cheerio HTML parsing + text extraction
│   ├── llm.ts                — Claude/OpenAI API wrapper
│   ├── prompts.ts            — System prompts for extraction + generation
│   └── types.ts              — TypeScript interfaces for product brief + creatives
```

### No external dependencies beyond:
- **cheerio** — HTML parsing
- **@anthropic-ai/sdk** or **openai** — LLM calls
- **tailwindcss** — styling
- No database, no auth, no sessions

## API Design

### POST /api/scrape
**Request:**
```json
{ "url": "https://example.com/product" }
```
**Response:**
```json
{
  "productName": "Example Widget",
  "description": "A widget that...",
  "features": ["Feature 1", "Feature 2"],
  "pricing": "$49/month",
  "targetAudience": "Small business owners",
  "claims": ["Saves 10 hours/week", "Used by 5000+ companies"]
}
```
**Error fallback:** Returns `{ "error": "scrape_failed", "message": "..." }` and frontend shows manual input form.

### POST /api/generate
**Request:**
```json
{
  "productBrief": {
    "productName": "...",
    "description": "...",
    "features": ["..."],
    "pricing": "...",
    "targetAudience": "...",
    "claims": ["..."]
  }
}
```
**Response:**
```json
{
  "angles": [
    {
      "name": "Urgency",
      "headlines": ["H1", "H2", "H3"],
      "bodyCopy": ["Body 1", "Body 2"],
      "cta": "Act Now",
      "sourceFacts": ["Saves 10 hours/week"]
    }
  ]
}
```

## LLM Strategy
- Use structured JSON output (response_format or system prompt enforcement)
- Two LLM calls total:
  1. **Extraction:** "Given this webpage text, extract product information as JSON"
  2. **Generation:** "Given this product brief, generate ad creatives for each of 6 angles as JSON"
- Keep prompts in `lib/prompts.ts` for readability and iteration
- Claude API preferred (builder has existing SDK experience); OpenAI as fallback

## UI Design
- Minimal, functional — contest values "ugly and functional over beautiful and broken"
- Tailwind defaults, no custom design system
- Mobile-responsive card grid
- Clear visual separation between angles
- Copy buttons with "Copied!" feedback
- Loading states during scrape + generation (skeleton cards or spinner)

## README Structure (Contest Requirement)
Three required questions:
1. **What does it do?** — Paste a product URL, get ad creatives across 6 psychological angles
2. **Why this tool?** — Creative fatigue is the #1 time sink for media buyers. Fresh angles on demand, grounded in actual product claims (not hallucinated), structured for bulk upload
3. **What would you build next?** — Campaign history, A/B test result tracking to learn which angles perform best per vertical, ad platform API integration for direct publishing

Include one example input/output in the README (Codex suggestion).

## Out of Scope
- No database, auth, user accounts
- No image/visual generation
- No ad platform API connectors
- No analytics or campaign tracking
- No A/B testing infrastructure
- No multi-language support

## Deployment
- Vercel (free tier sufficient)
- Single environment variable: `ANTHROPIC_API_KEY` (or `OPENAI_API_KEY`)
- No build-time secrets needed

## Time Budget (1 day)
1. **Scaffolding + scraper** — 2 hours
2. **LLM prompts + API routes** — 2 hours
3. **UI (cards, forms, export)** — 2 hours
4. **Testing + polish + deploy** — 1 hour
5. **README + submission** — 1 hour

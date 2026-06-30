# AdAngle — AI Ad Creative Generator

## Contest
- **Host:** It's Today Media (performance/affiliate marketing)
- **Prize:** $5,000 + full-time job offer
- **Deadline:** July 4, 2026, 11:59 PM ET
- **Submission:** Live URL + GitHub repo + README

## Problem
Media buyers suffer from **creative fatigue**: ads stop performing and teams need constant new copy variations across different psychological angles. Generating these manually is slow and repetitive. An AI tool that extracts product information from a URL and generates structured ad creatives across proven persuasion frameworks saves hours per campaign launch.

## Solution
A web app where a media buyer pastes a product/offer URL and gets back structured ad creatives across 6 psychological angles, ready to copy into ad platforms. Outputs are labeled with ad platform conventions (Meta Primary Text, Google Headline, etc.) for immediate use.

## User Flow

```
Single-page wizard (no routing between steps):

1. Paste URL ──► 2. Review/Edit Extracted Brief ──► 3. Generate Creatives ──► 4. Browse & Export
     │                                                        │
     └── OR: Manual Input (if scrape fails) ──────────────────┘
```

**State management:** All state lives in React component state within a single page (`page.tsx`). No routing between steps — the wizard advances in-place. No DB, no localStorage, no URL params needed.

### Step 1: Input
- Single text input for product/offer URL
- "Analyze" button triggers scrape
- If scrape fails: automatically show manual input form with all required fields

### Step 2: Editable Product Brief
- After scraping + LLM extraction, display an editable form with:
  - Product name (required)
  - Description / value proposition (required)
  - Key features (list, optional)
  - Pricing (optional)
  - Target audience (optional, defaults to "general")
  - Key claims (list, optional)
- User can correct any field before generation
- "Generate Creatives" button advances to step 3
- Manual fallback form has the same fields with the same validation

### Step 3: Generate Creatives
- Takes the (possibly edited) product brief
- Generates ad copy across 6 psychological angles:
  1. **Urgency** — time-limited offers, scarcity
  2. **Social Proof** — community, adoption, reviews
  3. **Curiosity** — intrigue, questions, reveals
  4. **Pain/Solution** — problem identification, resolution
  5. **Authority** — expertise, credentials, trust
  6. **FOMO** — exclusivity, missing out, trending
- Per angle output (structured JSON, validated with Zod):
  - 3 headlines (max 40 chars each — Meta/Google headline length)
  - 2 body copy variants (max 125 chars — Meta Primary Text length)
  - 1 CTA (max 25 chars)
  - Per-variant `groundedIn`: list of claim IDs referencing the extracted claims array
- **Platform labels:** Each output slot is labeled with its ad platform equivalent (e.g., "Meta Headline", "Google RSA Headline", "Meta Primary Text")

### Step 4: Browse & Export
- Card grid layout, one card per angle
- Each card shows the angle name, its creatives, and which source claims each variant references
- Actions:
  - Copy individual headline/body/CTA to clipboard
  - Download all creatives as CSV with columns: `angle, platform_slot, variant_index, text, cta, grounded_in`
  - Download all as JSON

## Architecture

```
Next.js 14 App (Vercel) — Single-Page Wizard
├── app/
│   ├── page.tsx              — Full wizard (input → brief → results)
│   ├── api/
│   │   ├── scrape/route.ts   — Fetch URL, parse with Cheerio, extract with LLM
│   │   └── generate/route.ts — Take product brief, return creatives as structured JSON
│   └── components/
│       ├── UrlInput.tsx          — URL input + analyze button
│       ├── ProductBriefForm.tsx  — Editable extraction review (also manual fallback)
│       ├── AngleCard.tsx         — Single angle's creatives with platform labels
│       ├── CopyButton.tsx        — Copy-to-clipboard with "Copied!" feedback
│       └── ExportButtons.tsx     — CSV/JSON download
├── lib/
│   ├── scraper.ts            — Cheerio HTML parsing + text extraction
│   ├── llm.ts                — Claude/OpenAI API wrapper
│   ├── prompts.ts            — System prompts for extraction + generation
│   ├── schemas.ts            — Zod schemas for API I/O + LLM response validation
│   └── types.ts              — TypeScript interfaces (inferred from Zod schemas)
```

### Dependencies:
- **cheerio** — HTML parsing
- **@anthropic-ai/sdk** or **openai** — LLM calls
- **zod** — API input validation + LLM output validation
- **tailwindcss** — styling
- No database, no auth, no sessions

## API Design

### POST /api/scrape
**Request (validated with Zod):**
```json
{ "url": "https://example.com/product" }
```

**URL validation (SSRF protection):**
- Only `http` / `https` schemes allowed
- Block private IPs: `127.0.0.0/8`, `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `169.254.0.0/16`
- Block `localhost`, `0.0.0.0`
- Max 3 redirects
- 10-second fetch timeout
- Max 5MB response size
- Require `text/html` content type

**Response:**
```json
{
  "productName": "Example Widget",
  "description": "A widget that...",
  "features": ["Feature 1", "Feature 2"],
  "pricing": "$49/month",
  "targetAudience": "Small business owners",
  "claims": [
    { "id": "c1", "text": "Saves 10 hours/week" },
    { "id": "c2", "text": "Used by 5000+ companies" }
  ]
}
```
**Error fallback:** Returns `{ "error": "scrape_failed", "message": "..." }` — frontend shows manual input form.

### POST /api/generate
**Request (validated with Zod):**
```json
{
  "productBrief": {
    "productName": "Example Widget",
    "description": "A widget that...",
    "features": ["Feature 1", "Feature 2"],
    "pricing": "$49/month",
    "targetAudience": "Small business owners",
    "claims": [
      { "id": "c1", "text": "Saves 10 hours/week" },
      { "id": "c2", "text": "Used by 5000+ companies" }
    ]
  }
}
```
**Response (validated with Zod — retry once on validation failure):**
```json
{
  "angles": [
    {
      "name": "Urgency",
      "headlines": [
        { "text": "Save 10 Hours This Week Only", "platformSlot": "Meta Headline", "groundedIn": ["c1"] },
        { "text": "Limited Time: Try Example Widget", "platformSlot": "Google RSA Headline", "groundedIn": [] },
        { "text": "Act Now — Special Launch Pricing", "platformSlot": "Meta Headline", "groundedIn": [] }
      ],
      "bodyCopy": [
        { "text": "Example Widget saves you 10 hours/week. Start your trial before this offer expires.", "platformSlot": "Meta Primary Text", "groundedIn": ["c1"] },
        { "text": "Join 5000+ companies already saving time. Limited availability.", "platformSlot": "Meta Primary Text", "groundedIn": ["c1", "c2"] }
      ],
      "cta": "Start Free Trial"
    }
  ]
}
```

**LLM output validation:**
- Zod schema enforces: exactly 6 angles, 3 headlines per angle, 2 body copy per angle, 1 CTA per angle
- String length limits: headlines max 40 chars, body max 125 chars, CTA max 25 chars
- `groundedIn` must reference valid claim IDs from the input
- On validation failure: retry LLM call once with the validation error in the prompt. If second attempt also fails, return partial results with a warning.

## LLM Strategy
- Use structured JSON output (system prompt with JSON schema example + Zod validation of response)
- Two LLM calls total:
  1. **Extraction:** "Given this webpage text, extract product information as JSON matching this schema"
  2. **Generation:** "Given this product brief, generate ad creatives for each of 6 angles as JSON matching this schema"
- **Grounding rule in prompt:** "Only reference claims, metrics, endorsements, or statistics that appear in the extracted claims. Do not invent numbers, ratings, expert endorsements, health/financial outcomes, or guarantees. If no claim supports an angle, use general benefit language instead."
- Keep prompts in `lib/prompts.ts` for readability and iteration
- Claude API preferred (builder has existing SDK experience); OpenAI as fallback

## UI Design
- Minimal, functional — contest values "ugly and functional over beautiful and broken"
- Tailwind defaults, no custom design system
- Mobile-responsive card grid
- Platform slot labels on each creative (e.g., "Meta Headline", "Google RSA Headline")
- Clear visual separation between angles
- Copy buttons with "Copied!" feedback
- Loading states during scrape + generation (skeleton cards or spinner)
- Grounding citations shown as small tags under each variant

## README Structure (Contest Requirement)
Three required questions:
1. **What does it do?** — Paste a product URL, get ad creatives across 6 psychological angles with platform-ready labels (Meta, Google) and source-fact grounding
2. **Why this tool?** — Creative fatigue is the #1 time sink for media buyers. Fresh angles on demand, grounded in actual product claims (not hallucinated), structured for bulk upload via CSV export
3. **What would you build next?** — Campaign history, A/B test result tracking to learn which angles perform best per vertical, ad platform API integration for direct publishing, image creative generation

Include one complete example input/output in the README showing a real product URL → extracted brief → generated creatives.

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
1. **Scaffolding + scraper + SSRF protection** — 2 hours
2. **Zod schemas + LLM prompts + API routes** — 2 hours
3. **UI (wizard, cards, forms, export)** — 2 hours
4. **Testing + polish + deploy** — 1 hour
5. **README + submission** — 1 hour

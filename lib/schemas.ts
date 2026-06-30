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

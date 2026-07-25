import { z } from 'zod';

export const AffordabilityTierSchema = z.enum(['staple_cheap', 'market', 'premium']);
export type AffordabilityTier = z.infer<typeof AffordabilityTierSchema>;

export const AvailabilitySchema = z.enum(['abundant', 'available', 'scarce']);
export type Availability = z.infer<typeof AvailabilitySchema>;

export const SelectedFoodSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  localName: z.string(),
  foodGroup: z.string(),
  tier: AffordabilityTierSchema,
  reasons: z.array(z.string()),
});
export type SelectedFood = z.infer<typeof SelectedFoodSchema>;

export const PlanSchema = z.object({
  id: z.string().uuid(),
  clientId: z.string().uuid(),
  visitId: z.string().uuid(),
  seasonMonth: z.number().int().min(1).max(12),
  district: z.string(),
  targetNutrients: z.array(z.string()),
  foods: z.array(SelectedFoodSchema),
  adequacy: z.record(z.string(), z.number().min(0).max(2)),
  rationale: z.array(
    z.object({
      foodId: z.string().uuid(),
      reasons: z.array(z.string()),
    }),
  ),
  voiceScript: z.string().nullable(),
  voicePackId: z.string().uuid().nullable(),
  aiEnriched: z.boolean().default(false),
  referenceBundleVersion: z.string(),
  createdBy: z.string().uuid(),
  createdAt: z.string().datetime(),
});
export type Plan = z.infer<typeof PlanSchema>;

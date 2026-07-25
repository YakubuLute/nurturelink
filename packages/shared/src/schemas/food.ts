import { z } from 'zod';
import { AffordabilityTierSchema, AvailabilitySchema } from './plan';

export const NutrientsSchema = z.object({
  ironMg: z.number().min(0),
  folateUg: z.number().min(0),
  proteinG: z.number().min(0),
  energyKcal: z.number().min(0),
  vitAUgRae: z.number().min(0),
  zincMg: z.number().min(0),
});
export type Nutrients = z.infer<typeof NutrientsSchema>;

export const FoodSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  localNames: z.record(z.string(), z.string()),
  foodGroup: z.string(),
  nutrients: NutrientsSchema,
  affordabilityTier: AffordabilityTierSchema,
  storable: z.boolean(),
  gardenWild: z.boolean(),
  active: z.boolean(),
});
export type Food = z.infer<typeof FoodSchema>;

export const SeasonalAvailabilitySchema = z.object({
  id: z.string().uuid(),
  agroZoneId: z.string().uuid(),
  month: z.number().int().min(1).max(12),
  foodId: z.string().uuid(),
  availability: AvailabilitySchema,
});
export type SeasonalAvailability = z.infer<typeof SeasonalAvailabilitySchema>;

export const NutrientTargetSchema = z.object({
  id: z.string().uuid(),
  profile: z.enum(['pregnant', 'child_6_23m', 'child_24_59m']),
  nutrient: z.enum(['ironMg', 'folateUg', 'proteinG', 'energyKcal', 'vitAUgRae', 'zincMg']),
  dailyTarget: z.number().positive(),
  source: z.string(),
});
export type NutrientTarget = z.infer<typeof NutrientTargetSchema>;

export const ClinicalThresholdSchema = z.object({
  id: z.string().uuid(),
  metric: z.enum(['muac_mm', 'hb_g_dl', 'weight_for_age_zscore']),
  condition: z.enum(['child', 'pregnant']),
  severity: z.enum(['ok', 'watch', 'moderate', 'refer']),
  thresholdValue: z.number(),
  thresholdDirection: z.enum(['lt', 'lte', 'gte', 'gt']),
  source: z.string(),
});
export type ClinicalThreshold = z.infer<typeof ClinicalThresholdSchema>;

import { z } from 'zod';

export const ReferralStatusSchema = z.enum([
  'issued',
  'in_transit',
  'arrived',
  'outcome_good',
  'outcome_poor',
  'lost_to_follow_up',
]);
export type ReferralStatus = z.infer<typeof ReferralStatusSchema>;

export const ReferralSchema = z.object({
  id: z.string().uuid(),
  clientId: z.string().uuid(),
  visitId: z.string().uuid(),
  reason: z.string(),
  flagCodes: z.array(z.string()),
  facilityTo: z.string().nullable(),
  status: ReferralStatusSchema.default('issued'),
  queuedOffline: z.boolean().default(true),
  issuedAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  syncedAt: z.string().datetime().nullable(),
});
export type Referral = z.infer<typeof ReferralSchema>;

export const CreateReferralSchema = ReferralSchema.omit({ syncedAt: true });
export type CreateReferralInput = z.infer<typeof CreateReferralSchema>;

export const UpdateReferralStatusSchema = z.object({
  id: z.string().uuid(),
  status: ReferralStatusSchema,
  updatedAt: z.string().datetime(),
});

import { z } from 'zod';

export const ClientTypeSchema = z.enum(['pregnant', 'child']);
export type ClientType = z.infer<typeof ClientTypeSchema>;

export const ClientSchema = z.object({
  id: z.string().uuid(),
  householdId: z.string().uuid(),
  type: ClientTypeSchema,
  name: z.string().min(1),
  dob: z.string().date().nullable(),
  eddGestation: z.string().nullable(),
  sex: z.enum(['M', 'F', 'unknown']).nullable(),
  consentAt: z.string().datetime(),
  active: z.boolean().default(true),
  updatedAt: z.string().datetime(),
  deletedAt: z.string().datetime().nullable(),
  syncedAt: z.string().datetime().nullable(),
});
export type Client = z.infer<typeof ClientSchema>;

export const CreateClientSchema = ClientSchema.omit({
  syncedAt: true,
  deletedAt: true,
});
export type CreateClientInput = z.infer<typeof CreateClientSchema>;

export const HouseholdSchema = z.object({
  id: z.string().uuid(),
  facilityId: z.string().uuid(),
  label: z.string().min(1),
  community: z.string().min(1),
  geo: z.object({ lat: z.number(), lng: z.number() }).nullable(),
  notes: z.string().nullable(),
  updatedAt: z.string().datetime(),
  deletedAt: z.string().datetime().nullable(),
});
export type Household = z.infer<typeof HouseholdSchema>;

import { z } from 'zod';

export const UserRoleSchema = z.enum([
  'system_admin',
  'district_admin',
  'CHO',
  'nutrition_officer',
  'supervisor',
]);
export type UserRole = z.infer<typeof UserRoleSchema>;

export const LoginSchema = z.object({
  phone: z.string().min(10),
  password: z.string().min(8),
});
export type LoginInput = z.infer<typeof LoginSchema>;

export const LoginResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  user: z.object({
    id: z.string().uuid(),
    name: z.string(),
    role: UserRoleSchema,
    facilityId: z.string().uuid().nullable(),
  }),
});
export type LoginResponse = z.infer<typeof LoginResponseSchema>;

export const RefreshTokenSchema = z.object({
  refreshToken: z.string(),
});

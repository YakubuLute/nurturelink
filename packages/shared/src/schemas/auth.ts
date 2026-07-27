import { z } from 'zod';

export const UserRoleSchema = z.enum([
  'system_admin',
  'district_admin',
  'CHO',
  'nutrition_officer',
  'supervisor',
]);
export type UserRole = z.infer<typeof UserRoleSchema>;

// PIN is a 4-digit code sent as a string; hashed server-side with bcrypt.
export const LoginSchema = z.object({
  phone: z.string().min(10),
  pin: z.string().length(4).regex(/^\d{4}$/, 'PIN must be 4 digits'),
});
export type LoginInput = z.infer<typeof LoginSchema>;

export const AuthUserSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  role: UserRoleSchema,
  facilityId: z.string().uuid().nullable(),
});
export type AuthUser = z.infer<typeof AuthUserSchema>;

export const LoginResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresIn: z.number().int().positive(),   // seconds until accessToken expires
  user: AuthUserSchema,
});
export type LoginResponse = z.infer<typeof LoginResponseSchema>;

export const RefreshTokenSchema = z.object({
  refreshToken: z.string(),
});
export type RefreshTokenInput = z.infer<typeof RefreshTokenSchema>;

export const RefreshTokenResponseSchema = z.object({
  accessToken: z.string(),
  expiresIn: z.number().int().positive(),
});
export type RefreshTokenResponse = z.infer<typeof RefreshTokenResponseSchema>;

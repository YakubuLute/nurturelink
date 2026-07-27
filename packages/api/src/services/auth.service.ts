import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { LoginInput, LoginResponse, RefreshTokenResponse } from '@nurturelink/shared';
import { AuthRepository } from '../repositories/auth.repository';

/** Parse '15m', '1h', '7d' → seconds for the expiresIn response field. */
function parseTtlSeconds(ttl: string): number {
  const match = ttl.match(/^(\d+)([smhd])$/);
  if (!match) return 900;
  const n = parseInt(match[1], 10);
  const unit = match[2];
  if (unit === 's') return n;
  if (unit === 'm') return n * 60;
  if (unit === 'h') return n * 3600;
  if (unit === 'd') return n * 86400;
  return 900;
}

export class AuthService {
  private repo = new AuthRepository();

  async login(input: LoginInput): Promise<LoginResponse> {
    const user = await this.repo.findByPhone(input.phone);
    if (!user) throw Object.assign(new Error('Invalid credentials'), { status: 401 });

    // PIN is compared against the bcrypt hash stored as password_hash in DB.
    const valid = await bcrypt.compare(input.pin, user.passwordHash);
    if (!valid) throw Object.assign(new Error('Invalid credentials'), { status: 401 });

    const secret = process.env.JWT_SECRET!;
    const expiresIn = process.env.JWT_EXPIRES_IN ?? '15m';
    const jwtPayload = { id: user.id, role: user.role, facilityId: user.facilityId };
    const accessToken = jwt.sign(jwtPayload, secret, { expiresIn: expiresIn as never });
    const refreshToken = await this.repo.createRefreshToken(user.id);

    return {
      accessToken,
      refreshToken,
      expiresIn: parseTtlSeconds(expiresIn),
      user: { id: user.id, name: user.name, role: user.role, facilityId: user.facilityId },
    };
  }

  async refresh(token: string): Promise<RefreshTokenResponse> {
    const stored = await this.repo.findRefreshToken(token);
    if (!stored || stored.expiresAt < new Date()) {
      throw Object.assign(new Error('Invalid refresh token'), { status: 401 });
    }
    const secret = process.env.JWT_SECRET!;
    const expiresIn = process.env.JWT_EXPIRES_IN ?? '15m';
    const jwtPayload = { id: stored.userId, role: stored.user.role, facilityId: stored.user.facilityId };
    const accessToken = jwt.sign(jwtPayload, secret, { expiresIn: expiresIn as never });
    return { accessToken, expiresIn: parseTtlSeconds(expiresIn) };
  }
}

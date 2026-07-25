import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { LoginInput, LoginResponse } from '@nurturelink/shared';
import { AuthRepository } from '../repositories/auth.repository';

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? '15m';

export class AuthService {
  private repo = new AuthRepository();

  async login(input: LoginInput): Promise<LoginResponse> {
    const user = await this.repo.findByPhone(input.phone);
    if (!user) throw Object.assign(new Error('Invalid credentials'), { status: 401 });

    const valid = await bcrypt.compare(input.password, user.passwordHash);
    if (!valid) throw Object.assign(new Error('Invalid credentials'), { status: 401 });

    const payload = { id: user.id, role: user.role, facilityId: user.facilityId };
    const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    const refreshToken = await this.repo.createRefreshToken(user.id);

    return {
      accessToken,
      refreshToken,
      user: { id: user.id, name: user.name, role: user.role, facilityId: user.facilityId },
    };
  }

  async refresh(token: string): Promise<{ accessToken: string }> {
    const stored = await this.repo.findRefreshToken(token);
    if (!stored || stored.expiresAt < new Date()) {
      throw Object.assign(new Error('Invalid refresh token'), { status: 401 });
    }
    const payload = { id: stored.userId, role: stored.user.role, facilityId: stored.user.facilityId };
    const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    return { accessToken };
  }
}

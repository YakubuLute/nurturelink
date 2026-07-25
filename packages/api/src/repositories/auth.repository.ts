import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

const REFRESH_TOKEN_TTL_DAYS = 7;

export class AuthRepository {
  async findByPhone(phone: string) {
    return prisma.user.findUnique({ where: { phone } });
  }

  async createRefreshToken(_userId: string): Promise<string> {
    const token = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_TTL_DAYS);
    // TODO: Store in a refresh_tokens table (add to schema.prisma)
    // For MVP: use a signed JWT as the refresh token
    return token;
  }

  async findRefreshToken(_token: string) {
    // TODO: Query refresh_tokens table
    return null as unknown as { userId: string; expiresAt: Date; user: { role: string; facilityId: string | null } };
  }
}

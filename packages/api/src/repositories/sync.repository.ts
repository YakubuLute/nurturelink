import { PrismaClient } from '@prisma/client';
import { SyncMutation } from '@nurturelink/shared';
import { AuthUser } from '../middleware/authenticate';

const prisma = new PrismaClient();

export class SyncRepository {
  async upsert(mutation: SyncMutation, _actor: AuthUser): Promise<void> {
    const { entityType, entityId, operation, payload } = mutation;

    switch (entityType) {
      case 'clients':
        if (operation === 'delete') {
          await prisma.client.update({
            where: { id: entityId },
            data: { deletedAt: new Date(), syncedAt: new Date() },
          });
        } else {
          await prisma.client.upsert({
            where: { id: entityId },
            update: { ...payload as object, syncedAt: new Date() },
            create: { ...(payload as object), syncedAt: new Date() },
          });
        }
        break;

      case 'visits':
        if (operation !== 'delete') {
          await prisma.visit.upsert({
            where: { id: entityId },
            update: { ...payload as object, syncedAt: new Date() },
            create: { ...(payload as object), syncedAt: new Date() },
          });
        }
        break;

      case 'referrals':
        await prisma.referral.upsert({
          where: { id: entityId },
          update: { ...payload as object, syncedAt: new Date() },
          create: { ...(payload as object), syncedAt: new Date() },
        });
        break;

      default:
        throw new Error(`Unknown entity type: ${entityType}`);
    }
  }

  async pullSince(
    since: string,
    tables: string[],
    facilityId: string | null,
  ): Promise<Record<string, unknown[]>> {
    const sinceDate = new Date(since);
    const rows: Record<string, unknown[]> = {};

    if (tables.includes('clients')) {
      rows['clients'] = await prisma.client.findMany({
        where: {
          updatedAt: { gt: sinceDate },
          household: { facilityId: facilityId ?? undefined },
        },
      });
    }

    if (tables.includes('visits')) {
      rows['visits'] = await prisma.visit.findMany({
        where: {
          updatedAt: { gt: sinceDate },
          client: { household: { facilityId: facilityId ?? undefined } },
        },
      });
    }

    if (tables.includes('referrals')) {
      rows['referrals'] = await prisma.referral.findMany({
        where: { updatedAt: { gt: sinceDate } },
      });
    }

    return rows;
  }
}

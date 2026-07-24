import { PrismaClient } from '@prisma/client';
import zlib from 'zlib';
import { promisify } from 'util';

const prisma = new PrismaClient();
const gzip = promisify(zlib.gzip);

/**
 * Builds a gzipped JSON bundle of reference data for a given bundle name.
 * The device uses these bundles to run the recommendation engine offline.
 */
export class BundleBuilder {
  async buildGzipped(name: string, _version: string): Promise<Buffer> {
    const data = await this.collectData(name);
    const json = JSON.stringify(data);
    return gzip(json);
  }

  private async collectData(name: string): Promise<unknown> {
    switch (name) {
      case 'foods':
        return prisma.food.findMany({ where: { active: true } });

      case 'seasonal':
        return prisma.seasonalAvailability.findMany({
          include: { food: { select: { id: true, name: true } } },
        });

      case 'nutrient_targets':
        return prisma.nutrientTarget.findMany();

      case 'clinical_thresholds':
        return prisma.clinicalThreshold.findMany();

      case 'voice_packs':
        return prisma.voicePack.findMany({ where: { active: true } });

      default:
        throw Object.assign(new Error(`Unknown bundle: ${name}`), { status: 404 });
    }
  }
}

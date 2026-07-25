import { ReferenceBundleManifest } from '@nurturelink/shared';
import { ReferenceRepository } from '../repositories/reference.repository';
import { BundleBuilder } from '../lib/bundle-builder';

export class ReferenceService {
  private repo = new ReferenceRepository();
  private builder = new BundleBuilder();

  async getManifest(): Promise<ReferenceBundleManifest> {
    const bundles = await this.repo.getActiveBundles();
    return {
      bundles: bundles.map((b) => ({
        name: b.versionTag.split('-')[0],
        currentVersion: b.versionTag,
        checksum: b.checksum,
        updatedAt: b.publishedAt.toISOString(),
      })),
    };
  }

  async getBundle(name: string, version: string): Promise<Buffer> {
    const bundle = await this.repo.findBundle(version);
    if (!bundle) throw Object.assign(new Error('Bundle not found'), { status: 404 });
    return this.builder.buildGzipped(name, version);
  }
}

import { z } from 'zod';

export const SyncOperationSchema = z.enum(['insert', 'update', 'delete']);
export type SyncOperation = z.infer<typeof SyncOperationSchema>;

export const SyncMutationSchema = z.object({
  idempotencyKey: z.string().uuid(),
  entityType: z.string(),
  entityId: z.string().uuid(),
  operation: SyncOperationSchema,
  payload: z.record(z.unknown()),
});
export type SyncMutation = z.infer<typeof SyncMutationSchema>;

export const SyncPushSchema = z.object({
  mutations: z.array(SyncMutationSchema).min(1).max(500),
});
export type SyncPushInput = z.infer<typeof SyncPushSchema>;

export const SyncPushResponseSchema = z.object({
  accepted: z.array(z.string()),
  errors: z.array(
    z.object({
      idempotencyKey: z.string(),
      reason: z.string(),
    }),
  ),
});
export type SyncPushResponse = z.infer<typeof SyncPushResponseSchema>;

export const SyncPullResponseSchema = z.object({
  rows: z.record(z.string(), z.array(z.record(z.unknown()))),
  cursor: z.string(),
  hasMore: z.boolean(),
});
export type SyncPullResponse = z.infer<typeof SyncPullResponseSchema>;

export const ReferenceBundleManifestSchema = z.object({
  bundles: z.array(
    z.object({
      name: z.string(),
      currentVersion: z.string(),
      checksum: z.string(),
      updatedAt: z.string().datetime(),
    }),
  ),
});
export type ReferenceBundleManifest = z.infer<typeof ReferenceBundleManifestSchema>;

import { v4 as uuidv4 } from 'uuid';
import { SyncMutation, SyncOperation } from '@nurturelink/shared';

// TODO: inject db instance
// import { db } from '../db';

/**
 * Adds a mutation to the local outbox for later push to the server.
 * Every local write should call this to guarantee sync eventually delivers it.
 */
export async function enqueue(
  entityType: string,
  entityId: string,
  operation: SyncOperation,
  payload: Record<string, unknown>,
): Promise<void> {
  const idempotencyKey = uuidv4();
  const createdAt = Date.now();

  // TODO: db.execute(
  //   'INSERT INTO outbox (idempotency_key, entity_type, entity_id, operation, payload, created_at) VALUES (?,?,?,?,?,?)',
  //   [idempotencyKey, entityType, entityId, operation, JSON.stringify(payload), createdAt]
  // );

  console.debug('[Outbox] Enqueued', { entityType, entityId, operation, idempotencyKey });
}

/** Returns all pending outbox mutations ordered by creation time. */
export async function drain(): Promise<SyncMutation[]> {
  // TODO: const rows = await db.execute('SELECT * FROM outbox ORDER BY id ASC');
  // return rows.map(row => ({
  //   idempotencyKey: row.idempotency_key,
  //   entityType: row.entity_type,
  //   entityId: row.entity_id,
  //   operation: row.operation as SyncOperation,
  //   payload: JSON.parse(row.payload),
  // }));
  return [];
}

/** Removes successfully accepted mutations from the outbox. */
export async function acknowledge(idempotencyKeys: string[]): Promise<void> {
  if (idempotencyKeys.length === 0) return;
  // TODO: db.execute(
  //   `DELETE FROM outbox WHERE idempotency_key IN (${idempotencyKeys.map(() => '?').join(',')})`,
  //   idempotencyKeys
  // );
}

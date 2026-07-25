/**
 * On-device SQLCipher database — NurtureLink mobile.
 *
 * Uses @op-engineering/op-sqlite which compiles SQLite with SQLCipher for
 * at-rest encryption. The encryption key is generated on first launch and
 * stored in expo-secure-store (Keychain on iOS, Android Keystore on Android).
 *
 * Usage:
 *   import { execute, query, transaction } from '../db';
 */

import { open, type DB, type Scalar } from '@op-engineering/op-sqlite';
import * as SecureStore from 'expo-secure-store';
import { CREATE_TABLES } from './schema';

const DB_NAME = 'nurturelink.db';
const KEY_ALIAS = 'nl_db_key';

// ─── Key management ───────────────────────────────────────────────────────────

async function getOrCreateKey(): Promise<string> {
  const existing = await SecureStore.getItemAsync(KEY_ALIAS);
  if (existing) return existing;

  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const key = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  await SecureStore.setItemAsync(KEY_ALIAS, key, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
  return key;
}

// ─── Database singleton ───────────────────────────────────────────────────────

let _db: DB | null = null;
let _initPromise: Promise<DB> | null = null;

/** Split a multi-statement SQL string into individual executable statements. */
function splitStatements(sql: string): string[] {
  return sql
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith('--'));
}

async function initDb(): Promise<DB> {
  const encryptionKey = await getOrCreateKey();

  const db = open({ name: DB_NAME, encryptionKey });

  // Run schema creation — split into individual statements
  for (const stmt of splitStatements(CREATE_TABLES)) {
    await db.execute(stmt);
  }

  return db;
}

/**
 * Returns the initialised database instance, creating it on first call.
 * Safe to call from multiple places — opens the DB exactly once.
 */
export async function getDb(): Promise<DB> {
  if (_db) return _db;
  if (!_initPromise) {
    _initPromise = initDb().then((db) => {
      _db = db;
      return db;
    });
  }
  return _initPromise;
}

export async function closeDb(): Promise<void> {
  if (_db) {
    _db.close();
    _db = null;
    _initPromise = null;
  }
}

// ─── Convenience wrappers ─────────────────────────────────────────────────────

/** Execute a write statement (INSERT / UPDATE / DELETE / PRAGMA). */
export async function execute(sql: string, params: Scalar[] = []): Promise<number> {
  const db = await getDb();
  const result = await db.execute(sql, params);
  return result.rowsAffected;
}

/** Query rows and return them as typed objects. */
export async function query<T = Record<string, Scalar>>(
  sql: string,
  params: Scalar[] = [],
): Promise<T[]> {
  const db = await getDb();
  const result = await db.execute(sql, params);
  return result.rows as T[];
}

/**
 * Run multiple write statements in a single transaction via the native callback API.
 * Rolls back automatically on any error.
 */
export async function transaction(
  statements: Array<{ sql: string; params?: Scalar[] }>,
): Promise<void> {
  const db = await getDb();
  await db.transaction(async (tx) => {
    for (const { sql, params } of statements) {
      await tx.execute(sql, params ?? []);
    }
  });
}

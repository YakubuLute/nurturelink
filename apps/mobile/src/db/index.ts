/**
 * On-device SQLCipher database — NurtureLink mobile.
 *
 * Uses @op-engineering/op-sqlite which compiles SQLite with SQLCipher for
 * at-rest encryption. The encryption key is generated on first launch and
 * stored in expo-secure-store (Keychain on iOS, Android Keystore on Android).
 *
 * Usage:
 *   import { getDb } from '../db';
 *   const db = await getDb();
 *   await db.executeAsync('SELECT * FROM clients WHERE id = ?', [id]);
 */

import { open, type DB } from '@op-engineering/op-sqlite';
import * as SecureStore from 'expo-secure-store';
import { CREATE_TABLES } from './schema';

const DB_NAME = 'nurturelink.db';
const KEY_ALIAS = 'nl_db_key';

// ─── Key management ───────────────────────────────────────────────────────────

/** Returns the existing encryption key or generates and stores a new one. */
async function getOrCreateKey(): Promise<string> {
  const existing = await SecureStore.getItemAsync(KEY_ALIAS);
  if (existing) return existing;

  // Generate a 256-bit hex key
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

async function initDb(): Promise<DB> {
  const encryptionKey = await getOrCreateKey();

  const db = open({
    name: DB_NAME,
    encryptionKey,
  });

  // Enable WAL and foreign keys, then run schema migrations
  await db.executeAsync('PRAGMA journal_mode = WAL;');
  await db.executeAsync('PRAGMA foreign_keys = ON;');
  await db.executeAsync(CREATE_TABLES);

  return db;
}

/**
 * Returns the initialised database instance, creating it on first call.
 * Safe to call from multiple places — only opens the DB once.
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

/**
 * Closes the database. Call on app unmount or before background-task handoff
 * if you need a clean flush.
 */
export async function closeDb(): Promise<void> {
  if (_db) {
    _db.close();
    _db = null;
    _initPromise = null;
  }
}

// ─── Convenience wrappers ─────────────────────────────────────────────────────

/**
 * Execute a write statement (INSERT / UPDATE / DELETE).
 * @returns rowsAffected
 */
export async function execute(sql: string, params: unknown[] = []): Promise<number> {
  const db = await getDb();
  const result = await db.executeAsync(sql, params);
  return result.rowsAffected ?? 0;
}

/**
 * Query rows as typed objects.
 * op-sqlite returns `rows._array` for row results.
 */
export async function query<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = [],
): Promise<T[]> {
  const db = await getDb();
  const result = await db.executeAsync(sql, params);
  return (result.rows?._array ?? []) as T[];
}

/**
 * Run multiple statements in a single transaction.
 * Rolls back automatically on any error.
 */
export async function transaction(
  statements: Array<{ sql: string; params?: unknown[] }>,
): Promise<void> {
  const db = await getDb();
  await db.executeAsync('BEGIN;');
  try {
    for (const { sql, params } of statements) {
      await db.executeAsync(sql, params ?? []);
    }
    await db.executeAsync('COMMIT;');
  } catch (err) {
    await db.executeAsync('ROLLBACK;');
    throw err;
  }
}

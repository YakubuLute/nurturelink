const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';
const SYNCABLE_TABLES = ['clients', 'households', 'visits', 'flags', 'plans', 'referrals'];

export async function pullChanges(): Promise<void> {
  // TODO: read cursor from sync_state table
  const cursor = new Date(0).toISOString();
  const tables = SYNCABLE_TABLES.join(',');

  // TODO: get token from SecureStore
  const token = '';

  const res = await fetch(
    `${API_URL}/sync/pull?since=${encodeURIComponent(cursor)}&tables=${tables}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );

  if (!res.ok) throw new Error(`Pull failed: ${res.status}`);

  const { rows, cursor: newCursor } = await res.json() as {
    rows: Record<string, unknown[]>;
    cursor: string;
    hasMore: boolean;
  };

  // TODO: apply rows to local SQLite via upsert
  for (const [table, records] of Object.entries(rows)) {
    console.log(`[Pull] ${table}: ${records.length} records`);
  }

  // TODO: advance cursor in sync_state table
  console.log('[Pull] New cursor:', newCursor);
}

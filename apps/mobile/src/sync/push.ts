import { drain, acknowledge } from './outbox';
import { getToken, clearSession } from '../auth/session';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8181';

/**
 * Push all queued outbox mutations to the server.
 *
 * - 401: clears the stored session (forces re-login on next sync attempt).
 *   Does not crash — the app is fully offline-capable.
 * - 5xx / network error: throws so the orchestrator can log and back off.
 */
export async function pushMutations(): Promise<void> {
  const mutations = await drain();
  if (mutations.length === 0) return;

  const token = await getToken();

  const res = await fetch(`${API_URL}/sync/push`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ mutations }),
  });

  if (res.status === 401) {
    // Session expired — clear the token and bail out gracefully.
    // The next login will store a fresh token.
    await clearSession().catch(() => {});
    console.warn('[Push] 401 Unauthorized — session cleared, re-login required');
    return;
  }

  if (!res.ok) {
    throw new Error(`Push failed: ${res.status}`);
  }

  const { accepted } = (await res.json()) as { accepted: string[]; errors: unknown[] };
  await acknowledge(accepted);

  console.log(`[Push] Accepted ${accepted.length}/${mutations.length} mutations`);
}

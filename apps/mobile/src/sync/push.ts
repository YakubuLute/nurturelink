import { drain, acknowledge } from './outbox';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

export async function pushMutations(): Promise<void> {
  const mutations = await drain();
  if (mutations.length === 0) return;

  // TODO: get token from SecureStore
  const token = '';

  const res = await fetch(`${API_URL}/sync/push`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ mutations }),
  });

  if (!res.ok) {
    throw new Error(`Push failed: ${res.status}`);
  }

  const { accepted } = (await res.json()) as { accepted: string[]; errors: unknown[] };
  await acknowledge(accepted);

  console.log(`[Push] Accepted ${accepted.length}/${mutations.length} mutations`);
}

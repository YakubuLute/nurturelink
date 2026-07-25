/**
 * Session helpers — persist the JWT produced by POST /auth/login in SecureStore.
 *
 * In the demo build we mint a signed-looking placeholder token so the sync layer
 * has a non-empty Authorization header to send. The API will reject it with 401,
 * which the sync layer treats as a soft failure (no crash, just skipped).
 *
 * In a production build replace storeSession() with a real login API call and
 * store the token the server returns.
 */

import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'nl_access_token';
const SECURE_OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

/**
 * Store a session token after login.
 * In demo mode this mints a placeholder; swap for the real server token in prod.
 */
export async function storeSession(role: string, token?: string): Promise<void> {
  const value = token ?? `demo.${role}.${Date.now()}`;
  await SecureStore.setItemAsync(TOKEN_KEY, value, SECURE_OPTIONS);
}

/** Remove the token on logout or forced sign-out (e.g. 401 from server). */
export async function clearSession(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

/** Read the current token (null if not logged in). */
export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

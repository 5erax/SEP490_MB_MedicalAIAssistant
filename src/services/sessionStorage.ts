import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

import { STORAGE_KEYS } from "@/src/constants/storageKeys";
import { AuthSession } from "@/src/types/auth";

// Tokens live in SecureStore (Keychain/Keystore); the rest of the session
// (display fields, role/entitlement flags) lives in AsyncStorage. SecureStore
// has a practical ~2KB per-value limit on some iOS releases, so only the
// small, sensitive token pair is stored there.
const TOKEN_KEY = `${STORAGE_KEYS.authSession}.tokens`;

type StoredTokens = {
  accessToken?: string;
  refreshToken?: string;
};

type SessionListener = (session: AuthSession | null) => void;
const sessionListeners = new Set<SessionListener>();

function notifySessionListeners(session: AuthSession | null) {
  sessionListeners.forEach((listener) => listener(session));
}

export function subscribeStoredSession(listener: SessionListener) {
  sessionListeners.add(listener);
  return () => {
    sessionListeners.delete(listener);
  };
}

async function getStoredTokens(): Promise<StoredTokens | null> {
  try {
    const raw = await SecureStore.getItemAsync(TOKEN_KEY);
    return raw ? (JSON.parse(raw) as StoredTokens) : null;
  } catch {
    return null;
  }
}

async function setStoredTokens(tokens: StoredTokens) {
  await SecureStore.setItemAsync(TOKEN_KEY, JSON.stringify(tokens));
}

async function clearStoredTokens() {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export async function getStoredSession(): Promise<AuthSession | null> {
  try {
    const [raw, tokens] = await Promise.all([
      AsyncStorage.getItem(STORAGE_KEYS.authSession),
      getStoredTokens(),
    ]);
    if (!raw && !tokens?.accessToken) return null;

    const rest = raw ? (JSON.parse(raw) as Partial<AuthSession>) : {};
    const session = { ...rest, ...tokens } as AuthSession;

    // Keep an expired access token long enough for the API layer to exchange
    // the backend's HttpOnly refresh cookie. It is never sent as a valid token.
    return session.accessToken ? session : null;
  } catch {
    await clearStoredSession();
    return null;
  }
}

export async function setStoredSession(session: AuthSession) {
  const { accessToken, refreshToken, ...rest } = session;
  await Promise.all([
    setStoredTokens({ accessToken, refreshToken }),
    AsyncStorage.setItem(STORAGE_KEYS.authSession, JSON.stringify(rest)),
  ]);
  notifySessionListeners(session);
}

export async function patchStoredSession(patch: Partial<AuthSession>) {
  const current = await getStoredSession();
  const next = { ...current, ...patch } as AuthSession;
  await setStoredSession(next);
  return next;
}

export async function clearStoredSession() {
  await Promise.all([clearStoredTokens(), AsyncStorage.removeItem(STORAGE_KEYS.authSession)]);
  notifySessionListeners(null);
}

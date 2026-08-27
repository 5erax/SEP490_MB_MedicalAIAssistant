import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

import { STORAGE_KEYS } from "@/src/constants/storageKeys";
import { AuthSession } from "@/src/types/auth";
import { isExpiredToken } from "@/src/utils/jwt";

// Tokens live in SecureStore (Keychain/Keystore); the rest of the session
// (display fields, role/entitlement flags) lives in AsyncStorage. SecureStore
// has a practical ~2KB per-value limit on some iOS releases, so only the
// small, sensitive token pair is stored there.
const TOKEN_KEY = `${STORAGE_KEYS.authSession}.tokens`;
const WEB_TOKEN_KEY = `${TOKEN_KEY}.web`;

type StoredTokens = {
  accessToken?: string;
  refreshToken?: string;
};

async function getStoredTokens(): Promise<StoredTokens | null> {
  try {
    const raw = Platform.OS === "web"
      ? await AsyncStorage.getItem(WEB_TOKEN_KEY)
      : await SecureStore.getItemAsync(TOKEN_KEY);
    return raw ? (JSON.parse(raw) as StoredTokens) : null;
  } catch {
    return null;
  }
}

async function setStoredTokens(tokens: StoredTokens) {
  const value = JSON.stringify(tokens);
  if (Platform.OS === "web") {
    await AsyncStorage.setItem(WEB_TOKEN_KEY, value);
    return;
  }
  await SecureStore.setItemAsync(TOKEN_KEY, value);
}

async function clearStoredTokens() {
  if (Platform.OS === "web") {
    await AsyncStorage.removeItem(WEB_TOKEN_KEY);
    return;
  }
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

    if (session.accessToken && isExpiredToken(session.accessToken)) {
      await clearStoredSession();
      return null;
    }

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
}

export async function patchStoredSession(patch: Partial<AuthSession>) {
  const current = await getStoredSession();
  const next = { ...current, ...patch } as AuthSession;
  await setStoredSession(next);
  return next;
}

export async function clearStoredSession() {
  await Promise.all([clearStoredTokens(), AsyncStorage.removeItem(STORAGE_KEYS.authSession)]);
}

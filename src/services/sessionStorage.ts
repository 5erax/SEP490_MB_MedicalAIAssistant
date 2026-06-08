import AsyncStorage from "@react-native-async-storage/async-storage";

import { STORAGE_KEYS } from "@/src/constants/storageKeys";
import { AuthSession } from "@/src/types/auth";
import { isExpiredToken } from "@/src/utils/jwt";

export async function getStoredSession() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.authSession);
    if (!raw) return null;

    const session = JSON.parse(raw) as AuthSession;
    if (session.accessToken && isExpiredToken(session.accessToken)) {
      await clearStoredSession();
      return null;
    }

    return session;
  } catch {
    await clearStoredSession();
    return null;
  }
}

export async function setStoredSession(session: AuthSession) {
  await AsyncStorage.setItem(STORAGE_KEYS.authSession, JSON.stringify(session));
}

export async function patchStoredSession(patch: Partial<AuthSession>) {
  const current = await getStoredSession();
  const next = { ...current, ...patch } as AuthSession;
  await setStoredSession(next);
  return next;
}

export async function clearStoredSession() {
  await AsyncStorage.removeItem(STORAGE_KEYS.authSession);
}


import AsyncStorage from "@react-native-async-storage/async-storage";

import { STORAGE_KEYS } from "@/src/constants/storageKeys";
import { AuthSession } from "@/src/types/auth";
import { isExpiredToken } from "@/src/utils/jwt";

// SecureStore is only implemented on Android/iOS/tvOS. The web preview uses
// AsyncStorage (localStorage-backed on web) so authenticated UI flows can be
// exercised in a browser. Native builds continue to resolve sessionStorage.ts
// and keep access/refresh tokens in the encrypted platform keystore.
export async function getStoredSession(): Promise<AuthSession | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.authSession);
    if (!raw) return null;

    const session = JSON.parse(raw) as AuthSession;
    if (!session.accessToken) return null;
    if (isExpiredToken(session.accessToken)) {
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

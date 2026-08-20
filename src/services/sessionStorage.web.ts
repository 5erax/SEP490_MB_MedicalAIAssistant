import { AuthSession } from "@/src/types/auth";

// Web is a development preview target, not the shipped mobile security model.
// Keep credentials in memory only: never persist bearer tokens in localStorage
// or AsyncStorage. Reloading the browser intentionally requires a new login.
let memorySession: AuthSession | null = null;
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

export async function getStoredSession(): Promise<AuthSession | null> {
  if (!memorySession?.accessToken) return null;
  return memorySession;
}

export async function setStoredSession(session: AuthSession) {
  memorySession = session;
  notifySessionListeners(session);
}

export async function patchStoredSession(patch: Partial<AuthSession>) {
  const current = await getStoredSession();
  const next = { ...current, ...patch } as AuthSession;
  await setStoredSession(next);
  return next;
}

export async function clearStoredSession() {
  memorySession = null;
  notifySessionListeners(null);
}

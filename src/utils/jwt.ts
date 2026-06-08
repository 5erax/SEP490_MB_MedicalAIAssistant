export function decodeJwtPayload<T = Record<string, unknown>>(token?: string | null): T | null {
  if (!token || typeof token !== "string" || !token.includes(".")) return null;

  try {
    const payload = token.split(".")[1];
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");

    if (typeof globalThis.atob === "function") {
      return JSON.parse(globalThis.atob(padded)) as T;
    }

    return null;
  } catch {
    return null;
  }
}

export function isExpiredToken(token?: string | null) {
  const payload = decodeJwtPayload<{ exp?: number }>(token);
  if (!payload?.exp) return false;
  return Number(payload.exp) * 1000 <= Date.now();
}


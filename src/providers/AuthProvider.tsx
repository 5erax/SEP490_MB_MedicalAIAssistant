import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { AuthContextValue, AuthSession } from "@/src/types/auth";
import { getSessionRoles } from "@/src/utils/roles";
import {
  clearStoredSession,
  getStoredSession,
  patchStoredSession,
  setStoredSession,
} from "@/src/services/sessionStorage";

const AuthContext = createContext<AuthContextValue | null>(null);

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSessionState] = useState<AuthSession | null>(null);
  const [isRestoring, setIsRestoring] = useState(true);

  const restoreSession = useCallback(async () => {
    setIsRestoring(true);
    try {
      const storedSession = await getStoredSession();
      setSessionState(storedSession);
    } finally {
      setIsRestoring(false);
    }
  }, []);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  const setSession = useCallback(async (nextSession: AuthSession) => {
    await setStoredSession(nextSession);
    setSessionState(nextSession);
  }, []);

  const updateSession = useCallback(async (patch: Partial<AuthSession>) => {
    const nextSession = await patchStoredSession(patch);
    setSessionState(nextSession);
  }, []);

  const clearSession = useCallback(async () => {
    await clearStoredSession();
    setSessionState(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      isAuthenticated: Boolean(session?.accessToken),
      isRestoring,
      roles: getSessionRoles(session),
      setSession,
      updateSession,
      clearSession,
      restoreSession,
    }),
    [clearSession, isRestoring, restoreSession, session, setSession, updateSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return value;
}


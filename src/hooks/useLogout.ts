import { useCallback, useState } from "react";
import { router } from "expo-router";

import { ROUTES } from "@/src/navigation/routes";
import { useAuth } from "@/src/providers/AuthProvider";
import { authService } from "@/src/services/authService";

// Mirrors Web's logoutService.js: best-effort call to the backend logout
// endpoint (errors are swallowed — an expired/invalid token must never block
// clearing the local session), then always clear local session and redirect.
export function useLogout() {
  const { clearSession } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  const logout = useCallback(async () => {
    setLoggingOut(true);
    try {
      await authService.logout();
    } catch {
      // best-effort: local session must still be cleared even if this fails
    } finally {
      await clearSession();
      setLoggingOut(false);
      router.replace(ROUTES.PUBLIC.LOGIN);
    }
  }, [clearSession]);

  return { logout, loggingOut };
}

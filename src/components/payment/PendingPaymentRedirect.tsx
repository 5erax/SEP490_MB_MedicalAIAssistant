import { useCallback, useEffect, useRef } from "react";
import { AppState } from "react-native";
import { router, usePathname } from "expo-router";

import { ROUTES } from "@/src/navigation/routes";
import { useAuth } from "@/src/providers/AuthProvider";
import { getPendingPaymentCheckout } from "@/src/services/paymentCheckoutStorage";

export function PendingPaymentRedirect() {
  const pathname = usePathname();
  const { session, isRestoring } = useAuth();
  const pathnameRef = useRef(pathname);
  const checkedSessionRef = useRef("");

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  const openPendingCheckoutStatus = useCallback(async () => {
    if (!session || isRestoring || pathnameRef.current.endsWith("/pricing")) return;
    const checkout = await getPendingPaymentCheckout();
    if (!checkout) return;
    router.replace(ROUTES.PUBLIC.PRICING);
  }, [isRestoring, session]);

  useEffect(() => {
    if (isRestoring || !session) return;
    const sessionKey = String(session.userId ?? session.identityId ?? session.accessToken);
    if (checkedSessionRef.current === sessionKey) return;
    checkedSessionRef.current = sessionKey;
    void openPendingCheckoutStatus();
  }, [isRestoring, openPendingCheckoutStatus, session]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") void openPendingCheckoutStatus();
    });
    return () => subscription.remove();
  }, [openPendingCheckoutStatus]);

  return null;
}

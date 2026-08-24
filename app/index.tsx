import { useEffect } from "react";
import { router } from "expo-router";

import { LoadingState, Screen } from "@/src/components/ui";
import { getInitialRouteForSession } from "@/src/navigation/roleRedirect";
import { useAuth } from "@/src/providers";

export default function AppIndex() {
  const { session, isRestoring } = useAuth();

  useEffect(() => {
    if (!isRestoring) {
      router.replace(getInitialRouteForSession(session));
    }
  }, [isRestoring, session]);

  return (
    <Screen>
      <LoadingState title="Dang mo MediMate AI..." />
    </Screen>
  );
}

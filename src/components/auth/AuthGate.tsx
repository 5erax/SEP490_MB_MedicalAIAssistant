import { ReactNode } from "react";
import { Redirect } from "expo-router";

import { LoadingState } from "@/src/components/ui";
import { ROUTES } from "@/src/navigation/routes";
import {
  AppRole,
  getInitialRouteForSession,
  getPrimaryRoleForSession,
  getRoleHomeRoute,
} from "@/src/navigation/roleRedirect";
import { useAuth } from "@/src/providers";

type AuthGateProps = {
  children?: ReactNode;
  allowedRole?: AppRole;
};

export function AuthGate({ children, allowedRole }: AuthGateProps) {
  const { session, isRestoring } = useAuth();

  if (isRestoring) {
    return <LoadingState title="Đang khôi phục phiên đăng nhập..." />;
  }

  if (!session) {
    return <Redirect href={ROUTES.PUBLIC.LOGIN} />;
  }

  const currentRole = getPrimaryRoleForSession(session);
  if (allowedRole && currentRole !== allowedRole) {
    return <Redirect href={getRoleHomeRoute(currentRole)} />;
  }

  if (!children) {
    return <Redirect href={getInitialRouteForSession(session)} />;
  }

  return children;
}

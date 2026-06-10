import { ROUTES } from "@/src/navigation/routes";
import { AuthSession } from "@/src/types/auth";
import { getSessionRoles, hasRole } from "@/src/utils/roles";

export type AppRole = "patient" | "doctor" | "staff" | "admin";

export function getPrimaryRoleForSession(session: AuthSession | null): AppRole {
  const roles = getSessionRoles(session);

  if (hasRole(roles, "admin")) return "admin";
  if (roles.includes("doctor")) return "doctor";
  if (hasRole(roles, "staff")) return "staff";
  return "patient";
}

export function getRoleHomeRoute(role: AppRole) {
  switch (role) {
    case "admin":
      return ROUTES.ADMIN.DASHBOARD;
    case "doctor":
      return ROUTES.DOCTOR.DASHBOARD;
    case "staff":
      return ROUTES.STAFF.DASHBOARD;
    case "patient":
    default:
      return ROUTES.PATIENT.HOME;
  }
}

export function getInitialRouteForSession(session: AuthSession | null) {
  if (!session) {
    return ROUTES.PUBLIC.LOGIN;
  }

  return getRoleHomeRoute(getPrimaryRoleForSession(session));
}

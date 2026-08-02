import { ROUTES } from "@/src/navigation/routes";
import { AuthSession } from "@/src/types/auth";
import { getSessionRoles, hasRole, shouldSetupPatientProfile } from "@/src/utils/roles";

export type AppRole = "patient" | "doctor" | "staff" | "admin";

// Priority mirrors Web's getWorkspacePath() (src/utils/roles.js): admin, then
// doctor (hasRole covers the "clinician" synonym), then staff, else patient.
export function getPrimaryRoleForSession(session: AuthSession | null): AppRole {
  const roles = getSessionRoles(session);

  if (hasRole(roles, "admin")) return "admin";
  if (hasRole(roles, "doctor")) return "doctor";
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

// Mirrors Web's getPostAuthDestination() (src/router/returnIntent.js): a
// first-login patient with an incomplete profile is routed to setup instead
// of straight into the role home route.
export function getInitialRouteForSession(session: AuthSession | null) {
  if (!session) {
    return ROUTES.PUBLIC.LOGIN;
  }

  if (shouldSetupPatientProfile(session)) {
    return ROUTES.SETUP.PATIENT_PROFILE;
  }

  return getRoleHomeRoute(getPrimaryRoleForSession(session));
}

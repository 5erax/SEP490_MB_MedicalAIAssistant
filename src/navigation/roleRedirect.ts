import { ROUTES } from "@/src/navigation/routes";
import { AuthSession } from "@/src/types/auth";
import { getSessionRoles, hasRole, shouldSetupPatientProfile } from "@/src/utils/roles";

export function getInitialRouteForSession(session: AuthSession | null) {
  if (!session) {
    return ROUTES.PUBLIC.ONBOARDING;
  }

  if (shouldSetupPatientProfile(session)) {
    return ROUTES.SETUP.PATIENT_PROFILE;
  }

  const roles = getSessionRoles(session);

  if (hasRole(roles, "admin")) {
    return ROUTES.OPERATOR.ADMIN_UNSUPPORTED;
  }

  if (hasRole(roles, "staff")) {
    return ROUTES.OPERATOR.STAFF_UNSUPPORTED;
  }

  return ROUTES.PATIENT.TABS;
}

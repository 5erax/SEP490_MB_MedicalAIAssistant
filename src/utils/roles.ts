import { AuthSession } from "@/src/types/auth";
import { decodeJwtPayload } from "./jwt";

function collectRoleValues(session?: AuthSession | null) {
  if (!session) return [];

  const jwtPayload = decodeJwtPayload<Record<string, unknown>>(session.accessToken);

  return [
    session.roles,
    session.role,
    session.Role,
    session.userRoles,
    session.data && typeof session.data === "object" ? (session.data as Record<string, unknown>).roles : undefined,
    session.data && typeof session.data === "object" ? (session.data as Record<string, unknown>).role : undefined,
    jwtPayload?.roles,
    jwtPayload?.role,
    jwtPayload?.["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"],
  ];
}

export function normalizeRoles(roles: unknown = []) {
  const values = Array.isArray(roles) ? roles : [roles];

  return values
    .flatMap((role) => (Array.isArray(role) ? role : String(role ?? "").split(",")))
    .map((role) => String(role).trim().toLowerCase())
    .filter(Boolean);
}

export function getSessionRoles(session?: AuthSession | null) {
  return normalizeRoles(collectRoleValues(session));
}

export function hasRole(roles: unknown = [], role: string) {
  const normalizedRoles = normalizeRoles(roles);
  const wanted = role.toLowerCase();

  return normalizedRoles.some((current) => {
    if (current === wanted) return true;
    if (wanted === "admin") return ["administrator", "superadmin"].includes(current);
    if (wanted === "doctor") return ["clinician"].includes(current);
    if (wanted === "patient") return ["user"].includes(current);
    return false;
  });
}

// Ported 1:1 from src/utils/roles.js (Web) — shouldSetupPatientProfile().
export function shouldSetupPatientProfile(session?: AuthSession | null) {
  const roles = getSessionRoles(session);
  const isFirstLogin = session?.isFirstLogin === true || session?.firstLogin === true;
  const isProfileCompleted = session?.isProfileCompleted === true;

  return (
    isFirstLogin
    && !isProfileCompleted
    && hasRole(roles, "patient")
    && !hasRole(roles, "admin")
    && !hasRole(roles, "doctor")
  );
}


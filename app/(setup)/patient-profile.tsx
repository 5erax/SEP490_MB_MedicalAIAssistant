/**
 * Screen: PatientProfileSetupScreen
 * Workflow: Authentication → post-login redirect for first-login patients
 * API: GET /api/users/me, GET /api/patient-profiles, PUT /api/users/{id},
 *      POST /api/patient-profiles
 *
 * Ported from Web's PersonalPatientProfilePage.jsx — see
 * shouldSetupPatientProfile in src/utils/roles.ts for the redirect gate.
 */
import { AuthGate } from "@/src/components/auth";
import { PatientProfileSetupScreen } from "@/src/components/profile";

export default function PatientProfileSetupRoute() {
  return (
    <AuthGate>
      <PatientProfileSetupScreen />
    </AuthGate>
  );
}

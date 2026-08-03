/**
 * Screen: RecordsScreen
 * Workflow: Medical Records / Lab Tests
 * API: GET /api/users/me, POST /api/lab-tests/analyze,
 *      GET /api/lab-tests/my-sessions, GET /api/lab-tests/{sessionId}
 *
 * Access matches Web's route exactly: "auth", not "premium" — Web's own
 * route comment says this is a temporary downgrade for product testing, to
 * be restored to "premium" later. Do not upgrade this to PremiumGate ahead
 * of Web actually doing so.
 */
import { AuthGate } from "@/src/components/auth";
import { RecordsScreen } from "@/src/components/records";

export default function PatientRecordsScreen() {
  return (
    <AuthGate>
      <RecordsScreen />
    </AuthGate>
  );
}

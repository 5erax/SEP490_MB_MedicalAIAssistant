/**
 * Screen: PreConsultationScreen
 * Workflow: Pre-Consultation (Tư vấn trước khám)
 * API: POST /api/consultation-sessions/generate-questions-for-consultant-session,
 *      GET /api/consultation-sessions/{sessionId},
 *      GET /api/consultation-sessions/my-sessions,
 *      GET /api/checklist-items/by-department/{departmentId},
 *      POST /api/consultation-sessions/{sessionId}/register-reminder,
 *      GET /api/consultation-sessions/{sessionId}/summary,
 *      POST /api/consultation-sessions/{sessionId}/complete
 */
import { AuthGate } from "@/src/components/auth";
import { PreConsultationScreen } from "@/src/components/preConsultation";

export default function PatientPreConsultationScreen() {
  return (
    <AuthGate allowedRole="patient">
      <PreConsultationScreen />
    </AuthGate>
  );
}

/**
 * Screen: ClinicalDiagnosisScreen
 * Workflow: Symptom Triage (clinical diagnosis)
 * API: POST /api/symptom-analysis/suggest-clinical-questions,
 *      POST /api/symptom-analysis/submit-diagnosis,
 *      GET /api/symptom-analysis/my-sessions
 */
import { AuthGate } from "@/src/components/auth";
import { ClinicalDiagnosisScreen } from "@/src/components/dashboard";

export default function PatientSymptomScreen() {
  return (
    <AuthGate allowedRole="patient">
      <ClinicalDiagnosisScreen />
    </AuthGate>
  );
}

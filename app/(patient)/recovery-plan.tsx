import { AuthGate } from "@/src/components/auth";
import { RecoveryPlanScreen } from "@/src/components/recovery";

export default function PatientRecoveryPlanScreen() {
  return (
    <AuthGate>
      <RecoveryPlanScreen />
    </AuthGate>
  );
}

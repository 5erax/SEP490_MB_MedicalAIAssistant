import { AuthGate } from "@/src/components/auth";
import { SpecialtyIntakeScreen } from "@/src/components/dashboard";

export default function PatientHomeScreen() {
  return (
    <AuthGate allowedRole="patient">
      <SpecialtyIntakeScreen />
    </AuthGate>
  );
}

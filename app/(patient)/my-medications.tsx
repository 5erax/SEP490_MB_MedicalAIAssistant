import { AuthGate } from "@/src/components/auth";
import { UserMedicationsScreen } from "@/src/components/medication";

export default function PatientMyMedicationsScreen() {
  return (
    <AuthGate>
      <UserMedicationsScreen />
    </AuthGate>
  );
}

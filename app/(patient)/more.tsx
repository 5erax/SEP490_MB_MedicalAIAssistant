import { AuthGate } from "@/src/components/auth";
import { MoreScreen } from "@/src/components/more";

export default function PatientMoreScreen() {
  return (
    <AuthGate>
      <MoreScreen />
    </AuthGate>
  );
}

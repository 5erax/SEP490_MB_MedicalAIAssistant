import { AuthGate } from "@/src/components/auth";
import { SettingsScreen } from "@/src/components/settings";

export default function PatientSettingsScreen() {
  return (
    <AuthGate>
      <SettingsScreen />
    </AuthGate>
  );
}

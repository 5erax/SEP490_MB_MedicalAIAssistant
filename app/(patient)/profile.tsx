import { AuthGate } from "@/src/components/auth";
import { ProfileScreen } from "@/src/components/profile";

export default function PatientProfileScreen() {
  return (
    <AuthGate>
      <ProfileScreen />
    </AuthGate>
  );
}

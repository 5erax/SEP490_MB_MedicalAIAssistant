import { AuthGate } from "@/src/components/auth";
import { DoctorRecoveryWorkspace } from "@/src/components/doctor";

export default function DoctorDashboard() {
  return (
    <AuthGate allowedRole="doctor">
      <DoctorRecoveryWorkspace />
    </AuthGate>
  );
}

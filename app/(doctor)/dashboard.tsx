import { AuthGate, RolePlaceholderScreen } from "@/src/components/auth";

export default function DoctorDashboardPlaceholder() {
  return (
    <AuthGate allowedRole="doctor">
      <RolePlaceholderScreen title="Doctor Dashboard" role="DOCTOR" />
    </AuthGate>
  );
}

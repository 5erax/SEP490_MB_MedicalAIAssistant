import { AuthGate, RolePlaceholderScreen } from "@/src/components/auth";

export default function StaffDashboardPlaceholder() {
  return (
    <AuthGate allowedRole="staff">
      <RolePlaceholderScreen title="Staff Dashboard" role="STAFF" />
    </AuthGate>
  );
}

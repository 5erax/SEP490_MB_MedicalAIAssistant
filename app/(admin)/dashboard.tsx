import { AuthGate, RolePlaceholderScreen } from "@/src/components/auth";

export default function AdminDashboardPlaceholder() {
  return (
    <AuthGate allowedRole="admin">
      <RolePlaceholderScreen title="Admin Dashboard" role="ADMIN" />
    </AuthGate>
  );
}

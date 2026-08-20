import { AdminWorkspace } from "@/src/components/admin";
import { AuthGate } from "@/src/components/auth";

export default function AdminDashboard() {
  return (
    <AuthGate allowedRole="admin">
      <AdminWorkspace />
    </AuthGate>
  );
}

import { AuthGate } from "@/src/components/auth";
import { StaffWorkspace } from "@/src/components/staff";

export default function StaffDashboard() {
  return (
    <AuthGate allowedRole="staff">
      <StaffWorkspace />
    </AuthGate>
  );
}

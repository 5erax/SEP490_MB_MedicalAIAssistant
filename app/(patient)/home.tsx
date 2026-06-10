import { AuthGate, RolePlaceholderScreen } from "@/src/components/auth";

export default function PatientHomePlaceholder() {
  return (
    <AuthGate allowedRole="patient">
      <RolePlaceholderScreen title="Patient Home" role="PATIENT" />
    </AuthGate>
  );
}

import { AuthGate } from "@/src/components/auth";
import { PreConsultationScreen } from "@/src/components/consultation";

export default function PreConsultationRoute() {
  return (
    <AuthGate>
      <PreConsultationScreen />
    </AuthGate>
  );
}

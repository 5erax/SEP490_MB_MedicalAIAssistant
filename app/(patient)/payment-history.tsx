import { AuthGate } from "@/src/components/auth";
import { PaymentHistoryScreen } from "@/src/components/payment";

export default function PatientPaymentHistoryScreen() {
  return (
    <AuthGate>
      <PaymentHistoryScreen />
    </AuthGate>
  );
}

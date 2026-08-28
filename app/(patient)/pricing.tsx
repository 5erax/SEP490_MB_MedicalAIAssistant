import { AuthGate } from "@/src/components/auth";
import { SubscriptionScreen } from "@/src/components/subscription";

export default function PatientPricingScreen() {
  return (
    <AuthGate>
      <SubscriptionScreen showBackHeader />
    </AuthGate>
  );
}

// Not wrapped in AuthGate: Web's /pricing route has access:"public".
import { SubscriptionScreen } from "@/src/components/subscription";

export default function PricingScreen() {
  return <SubscriptionScreen />;
}

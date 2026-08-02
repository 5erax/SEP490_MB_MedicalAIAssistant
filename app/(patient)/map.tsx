// Not wrapped in AuthGate: Web's /map route has access:"public" (guests can
// browse facilities without logging in). Only clinical-flow recovery and
// (future) review submission require auth, gated inline — see
// useClinicalRecommendation's "locked" status.
import { MapScreen } from "@/src/components/map";

export default function PatientMapScreen() {
  return <MapScreen />;
}

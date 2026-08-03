import { PremiumGate } from "@/src/components/auth";
import { MedicationScanScreen } from "@/src/components/medication";

export default function PatientMedicationScanScreen() {
  return (
    <PremiumGate>
      <MedicationScanScreen />
    </PremiumGate>
  );
}

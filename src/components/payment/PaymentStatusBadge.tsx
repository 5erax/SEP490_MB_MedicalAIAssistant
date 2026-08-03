import { Badge } from "@/src/components/ui";
import { Payment } from "@/src/types/subscription";
import { getPaymentStatus, PaymentStatusTone } from "@/src/utils/paymentPresentation";

const TONE_MAP: Record<PaymentStatusTone, "warning" | "success" | "neutral" | "danger"> = {
  warning: "warning",
  success: "success",
  neutral: "neutral",
  danger: "danger",
};

export function PaymentStatusBadge({ payment }: { payment: Payment }) {
  const status = getPaymentStatus(payment);
  return <Badge tone={TONE_MAP[status.tone]}>{status.label}</Badge>;
}

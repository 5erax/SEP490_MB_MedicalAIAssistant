// Ported 1:1 from src/utils/subscriptionPlanPresentation.js (Web).
import { SubscriptionPlanQuota } from "@/src/types/subscription";

export const PUBLIC_ACCESS_BENEFITS = [
  "Phân tích triệu chứng qua câu hỏi lâm sàng tham khảo",
  "Tìm cơ sở y tế trên bản đồ công khai",
  "Hỏi trợ lý AI trên trang chủ để tham khảo thông tin",
];

export function getPlanDisplayName(value: unknown) {
  const name = String(value || "").trim();
  if (!name) return "Gói chưa cập nhật tên";

  const normalized = name.toLowerCase().replace(/\s+/g, " ");
  if (/^medimate\s*(?:\+|plus)?\s*(?:tháng|hàng tháng|month|monthly)?$/.test(normalized)) {
    return "MediMate Plus";
  }

  return name.replace(/^medimate/i, "MediMate");
}

const FEATURE_LIMIT_LABELS: Record<string, (limit: unknown) => string> = {
  symptomAnalysisPerMonth: (limit) => `${limit} lượt phân tích triệu chứng mỗi tháng`,
  aiChatPerDay: (limit) => `${limit} lượt trò chuyện với trợ lý AI mỗi ngày`,
  clinicalQuestionPerMonth: (limit) => `${limit} bộ câu hỏi lâm sàng mỗi tháng`,
};

export function getPlanBenefits(value: unknown, quotas: SubscriptionPlanQuota[] = []): string[] {
  const quotaBenefits = quotas.flatMap((quota) => {
    if (quota.isActive === false) return [];
    const limit = Number(quota.limitValue);
    if (!Number.isFinite(limit) || limit <= 0) return [];

    const code = String(quota.quotaCode ?? "").trim().toUpperCase();
    if (code === "SERVICE_CREDIT") {
      return [`${limit.toLocaleString("vi-VN")} lượt sử dụng dịch vụ MediMate trong mỗi chu kỳ`];
    }

    const name = String(quota.quotaName ?? "quyền lợi").trim();
    return [`${limit.toLocaleString("vi-VN")} ${name} trong mỗi chu kỳ`];
  });

  if (!value) return quotaBenefits;

  try {
    const limits = typeof value === "string" ? JSON.parse(value) : value;
    if (!limits || Array.isArray(limits) || typeof limits !== "object") return quotaBenefits;

    const featureBenefits = Object.entries(limits as Record<string, unknown>).flatMap(([key, limit]) => {
      const formatLabel = FEATURE_LIMIT_LABELS[key];
      if (!formatLabel || limit === null || limit === undefined || limit === "") return [];
      return [formatLabel(limit)];
    });
    return [...quotaBenefits, ...featureBenefits];
  } catch {
    return quotaBenefits;
  }
}

export function getPlanCycle(plan: { durationInDays?: number } | null | undefined): "yearly" | "monthly" {
  return Number(plan?.durationInDays) >= 300 ? "yearly" : "monthly";
}

export function getDurationLabel(durationInDays: unknown) {
  const duration = Number(durationInDays);
  if (!Number.isFinite(duration) || duration <= 0) return "";
  if (duration === 365) return "1 năm";
  if (duration === 30) return "30 ngày";
  return `${duration.toLocaleString("vi-VN")} ngày`;
}

export function formatPrice(value: number) {
  return `${value.toLocaleString("vi-VN")} ₫`;
}

export function isActiveSubscription(subscription: { statusName?: string; status?: number } | null | undefined) {
  const status = String(subscription?.statusName ?? "").toLowerCase();
  return status === "active" || Number(subscription?.status) === 1;
}

export function isSuccessfulPayment(payment: { statusName?: string; paidAt?: string } | null | undefined) {
  const status = String(payment?.statusName ?? "").toLowerCase();
  return Boolean(payment?.paidAt) || ["paid", "completed", "success", "succeeded"].includes(status);
}

export function isTerminalPayment(payment: { statusName?: string } | null | undefined) {
  const status = String(payment?.statusName ?? "").toLowerCase();
  return ["failed", "cancelled", "canceled", "expired", "refunded"].includes(status);
}

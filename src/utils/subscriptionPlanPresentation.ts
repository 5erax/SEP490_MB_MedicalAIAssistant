// Ported 1:1 from src/utils/subscriptionPlanPresentation.js (Web).
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

function normalizeQuotaCode(value: unknown) {
  return String(value ?? "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function findServiceCreditQuota(plan: unknown) {
  if (!plan || typeof plan !== "object" || Array.isArray(plan)) return null;
  const quotas = Array.isArray((plan as { quotas?: unknown[] }).quotas) ? (plan as { quotas: Record<string, unknown>[] }).quotas : [];
  return quotas.find((quota) => (
    quota?.isActive !== false
    && normalizeQuotaCode(quota?.quotaCode ?? quota?.code) === "SERVICECREDIT"
  )) ?? null;
}

export function getServiceCreditLimit(plan: unknown) {
  const quota = findServiceCreditQuota(plan);
  if (!quota || quota.limitValue === null || quota.limitValue === undefined || quota.limitValue === "") return null;
  const limit = Number(quota.limitValue);
  return Number.isFinite(limit) ? Math.max(0, Math.trunc(limit)) : null;
}

function getQuotaBenefits(plan: unknown) {
  const limit = getServiceCreditLimit(plan);
  if (limit === null) return [];
  return [`${limit.toLocaleString("vi-VN")} lượt dùng chung cho kế hoạch phục hồi, tư vấn trước khám và phân tích xét nghiệm`];
}

export function getPlanBenefits(value: unknown): string[] {
  if (!value) return [];

  try {
    if (typeof value === "object" && !Array.isArray(value) && "quotas" in value) {
      return getQuotaBenefits(value);
    }

    const limits = typeof value === "string" ? JSON.parse(value) : value;
    if (!limits || Array.isArray(limits) || typeof limits !== "object") return [];

    return Object.entries(limits as Record<string, unknown>).flatMap(([key, limit]) => {
      const formatLabel = FEATURE_LIMIT_LABELS[key];
      if (!formatLabel || limit === null || limit === undefined || limit === "") return [];
      return [formatLabel(limit)];
    });
  } catch {
    return [];
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

import { apiRequest } from "@/src/api/client";
import { ENDPOINTS } from "@/src/api/endpoints";
import { SubscriptionUsageQuota } from "@/src/types/subscription";

const SERVICE_CREDIT_CODE = "SERVICE_CREDIT";

export const subscriptionUsageApi = {
  getUsage() {
    return apiRequest<SubscriptionUsageQuota | SubscriptionUsageQuota[]>(ENDPOINTS.SUBSCRIPTION_USAGE.ME, { requiresAuth: true });
  },
};

function normalizeCode(value: unknown) {
  return String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

function toCount(value: unknown, fallback = 0) {
  const count = Number(value);
  return Number.isFinite(count) ? Math.max(0, Math.trunc(count)) : fallback;
}

export function normalizeRecoveryQuota(data: SubscriptionUsageQuota | SubscriptionUsageQuota[] | undefined) {
  const candidate = Array.isArray(data)
    ? data.find((item) => normalizeCode(item.quotaCode ?? item.code) === normalizeCode(SERVICE_CREDIT_CODE)) ?? data[0] ?? null
    : data ?? null;

  if (!candidate || typeof candidate !== "object") return null;

  const usedCount = toCount(candidate.usedCount);
  const reservedCount = toCount(candidate.reservedCount);
  const hasRemaining = candidate.remainingCount !== undefined && candidate.remainingCount !== null;
  const remainingCount = hasRemaining ? toCount(candidate.remainingCount) : null;
  const grantedFallback = usedCount + reservedCount + (remainingCount ?? 0);
  const grantedCount = toCount(candidate.grantedCount ?? candidate.limitValue, grantedFallback);

  return {
    ...candidate,
    quotaCode: SERVICE_CREDIT_CODE,
    grantedCount,
    limitValue: grantedCount,
    usedCount,
    reservedCount,
    remainingCount: remainingCount ?? Math.max(0, grantedCount - usedCount - reservedCount),
  };
}

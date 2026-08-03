// Ported from src/services/subscriptionUsageService.js (Web).
import { apiRequest } from "@/src/api/client";
import { ENDPOINTS } from "@/src/api/endpoints";
import { SubscriptionUsageQuota } from "@/src/types/subscription";

export const subscriptionUsageApi = {
  getUsage() {
    return apiRequest<SubscriptionUsageQuota | SubscriptionUsageQuota[]>(ENDPOINTS.SUBSCRIPTION_USAGE.ME, { requiresAuth: true });
  },
};

// Ported from normalizeQuota() in RecoveryPlanPage.jsx — the response can be
// a single quota object or an array of per-feature quotas; pick the one
// whose quotaCode mentions "recovery", falling back to the first entry.
export function normalizeRecoveryQuota(data: SubscriptionUsageQuota | SubscriptionUsageQuota[] | undefined) {
  if (Array.isArray(data)) {
    return data.find((item) => String(item.quotaCode).toLowerCase().includes("recovery")) ?? data[0] ?? null;
  }
  return data ?? null;
}

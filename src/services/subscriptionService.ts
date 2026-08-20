// Ported from src/services/subscriptionService.js (Web) — user-facing
// operations only (subscriptionPlansApi.create/update/setStatus/remove are
// Admin-only, not ported here).
import { apiRequest } from "@/src/api/client";
import { ENDPOINTS } from "@/src/api/endpoints";
import { PayOsCheckout, PayOsReconcileResult, Payment, SubscriptionPlan, UserSubscription } from "@/src/types/subscription";
import { ApiResponse } from "@/src/types/api";

function withQuery(path: string, params: Record<string, string | number | undefined> = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== "" && value !== null && value !== undefined) search.set(key, String(value));
  });
  const query = search.toString();
  return query ? `${path}?${query}` : path;
}

export const subscriptionPlansApi = {
  list() {
    return apiRequest<SubscriptionPlan[]>(ENDPOINTS.SUBSCRIPTION_PLANS.BASE, { requiresAuth: true });
  },
  active() {
    return apiRequest<SubscriptionPlan[]>(ENDPOINTS.SUBSCRIPTION_PLANS.ACTIVE);
  },
};

export const userSubscriptionsApi = {
  checkout(planId: string, autoRenew = false) {
    return apiRequest<PayOsCheckout>(ENDPOINTS.USER_SUBSCRIPTIONS.CHECKOUT, {
      method: "POST",
      data: { planId, autoRenew },
      requiresAuth: true,
    });
  },

  me() {
    return apiRequest<UserSubscription[]>(ENDPOINTS.USER_SUBSCRIPTIONS.ME, { requiresAuth: true });
  },

  cancel(id: string) {
    return apiRequest(ENDPOINTS.USER_SUBSCRIPTIONS.CANCEL(id), { method: "POST", requiresAuth: true });
  },
};

export const paymentsApi = {
  getMyPayments(pageNumber = 1, pageSize = 10) {
    return apiRequest<Payment[]>(withQuery(ENDPOINTS.PAYMENTS.ME, { PageNumber: pageNumber, PageSize: pageSize }), {
      requiresAuth: true,
    });
  },

  getMyPayment(id: string) {
    return apiRequest<Payment>(ENDPOINTS.PAYMENTS.MY_PAYMENT(id), { requiresAuth: true });
  },

  payOsReturn(params: Record<string, string> = {}) {
    return apiRequest<ApiResponse>(withQuery(ENDPOINTS.PAYMENTS.PAYOS_RETURN, params));
  },

  payOsCancel(params: Record<string, string> = {}) {
    return apiRequest<ApiResponse>(withQuery(ENDPOINTS.PAYMENTS.PAYOS_CANCEL, params));
  },

  payOsStatus(orderCode: string) {
    return apiRequest<ApiResponse>(ENDPOINTS.PAYMENTS.PAYOS_STATUS(orderCode));
  },

  // Ported from paymentsApi.reconcilePayOs (Web) — replaces payOsStatus as
  // the source of truth: this actively re-queries PayOS live server-side
  // instead of reading a locally cached DB status, and is auth-scoped to
  // the caller's own payments (POST, not GET).
  reconcilePayOs(orderCode: string) {
    const normalizedOrderCode = String(orderCode ?? "").trim();
    if (!normalizedOrderCode) {
      return Promise.reject(new Error("Thiếu mã giao dịch PayOS."));
    }
    return apiRequest<PayOsReconcileResult>(ENDPOINTS.PAYMENTS.PAYOS_RECONCILE(normalizedOrderCode), {
      method: "POST",
      requiresAuth: true,
    });
  },
};

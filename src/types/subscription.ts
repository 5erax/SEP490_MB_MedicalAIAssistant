export type SubscriptionPlan = {
  id: string;
  planName?: string;
  price?: number;
  durationInDays?: number;
  featureLimitJson?: string | Record<string, unknown>;
  [key: string]: unknown;
};

export type UserSubscription = {
  id: string;
  planName?: string;
  status?: number;
  statusName?: string;
  startDate?: string;
  endDate?: string;
  autoRenew?: boolean;
  [key: string]: unknown;
};

export type Payment = {
  id: string;
  planName?: string;
  statusName?: string;
  status?: string;
  amount?: number;
  currency?: string;
  provider?: string;
  transactionReference?: string;
  createdAt?: string;
  updatedAt?: string;
  paidAt?: string;
  [key: string]: unknown;
};

export type PayOsCheckout = {
  paymentId: string;
  paymentUrl: string;
  orderCode?: string;
  [key: string]: unknown;
};

// Ported from the /api/me/subscription-usage response shape (Web) — used
// by Recovery Plan (single, "recovery"-code quota), Profile's "Gói dịch
// vụ" tab (full per-feature list), and PricingPage's post-checkout cache
// warm (fetched but not rendered there).
export type SubscriptionUsageQuota = {
  code?: string;
  quotaCode?: string;
  quotaName?: string;
  grantedCount?: number;
  limitValue?: number;
  remainingCount?: number;
  usedCount?: number;
  reservedCount?: number;
  cycleStart?: string;
  cycleEnd?: string;
};

export type PayOsReconcileResult = {
  providerStatus?: string;
  paymentStatus?: string;
  isPaid?: boolean;
  isActive?: boolean;
  isCancelled?: boolean;
  amountRemaining?: number;
  message?: string;
};

export type CheckoutStatus = "idle" | "creating" | "pending" | "success" | "error";

export type CheckoutState = {
  status: CheckoutStatus;
  message: string;
  paymentId: string;
};

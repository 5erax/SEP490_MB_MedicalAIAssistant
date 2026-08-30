export type SubscriptionPlan = {
  id: string;
  planName?: string;
  price?: number;
  durationInDays?: number;
  featureLimitJson?: string | Record<string, unknown>;
  quotas?: SubscriptionPlanQuota[];
  [key: string]: unknown;
};

export type SubscriptionPlanQuota = {
  quotaCode?: string;
  quotaName?: string;
  quotaDescription?: string;
  unit?: string;
  limitValue?: number;
  resetPeriod?: string;
  isActive?: boolean;
};

export type SaleCampaignEligibilityType = 0 | 1 | 2;

export type SaleOffer = {
  offerId: string;
  campaignId: string;
  campaignName?: string | null;
  description?: string | null;
  badgeText?: string | null;
  eligibilityType?: SaleCampaignEligibilityType;
  originalPrice: number;
  effectivePrice: number;
  discountAmount: number;
  discountPercent: number;
  baseCredit: number;
  bonusCredit: number;
  grantedCredit: number;
  startAt?: string;
  endAt?: string;
  maxRedemptions?: number | null;
  remainingRedemptions?: number | null;
  maxRedemptionsPerUser?: number | null;
};

export type SubscriptionPlanOffer = {
  plan: SubscriptionPlan;
  originalPrice: number;
  effectivePrice: number;
  baseCredit: number;
  bonusCredit: number;
  grantedCredit: number;
  offer?: SaleOffer | null;
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
  originalAmount?: number;
  discountAmount?: number;
  saleCampaignId?: string | null;
  saleCampaignName?: string | null;
  saleBadgeText?: string | null;
  baseCredit?: number | null;
  bonusCredit?: number;
  grantedCredit?: number | null;
  currency?: string;
  provider?: string;
  paymentProvider?: string;
  transactionReference?: string;
  createdAt?: string;
  updatedAt?: string;
  paidAt?: string;
  [key: string]: unknown;
};

export type PayOsCheckout = {
  subscriptionId?: string;
  paymentId: string;
  transactionId?: string;
  paymentUrl: string;
  orderCode?: string;
  paymentProvider?: string;
  originalPrice?: number;
  finalPrice?: number;
  discountAmount?: number;
  baseCredit?: number;
  bonusCredit?: number;
  grantedCredit?: number;
  appliedSaleCampaignId?: string | null;
  appliedSaleCampaignPlanId?: string | null;
  saleCampaignName?: string | null;
  saleBadgeText?: string | null;
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
  orderCode?: string;
  paymentId?: string;
  subscriptionId?: string;
  providerStatus?: string;
  paymentStatus?: string;
  subscriptionStatus?: string;
  amountPaid?: number;
  isPaid?: boolean;
  isActive?: boolean;
  isCancelled?: boolean;
  amountRemaining?: number;
  message?: string;
};

export type CheckoutStatus = "idle" | "creating" | "pending" | "success" | "cancelled" | "error";

export type CheckoutState = {
  status: CheckoutStatus;
  message: string;
  paymentId: string;
  orderCode?: string;
};

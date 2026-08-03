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
  [key: string]: unknown;
};

export type CheckoutStatus = "idle" | "creating" | "pending" | "success" | "error";

export type CheckoutState = {
  status: CheckoutStatus;
  message: string;
  paymentId: string;
};

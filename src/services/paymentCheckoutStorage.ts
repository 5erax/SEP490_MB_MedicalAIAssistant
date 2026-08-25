import AsyncStorage from "@react-native-async-storage/async-storage";

import { STORAGE_KEYS } from "@/src/constants/storageKeys";

const PENDING_CHECKOUT_MAX_AGE_MS = 24 * 60 * 60 * 1000;

export type PendingPaymentCheckout = {
  paymentId: string;
  orderCode?: string;
  paymentUrl: string;
  createdAt: number;
};

function normalizePendingCheckout(value: unknown): PendingPaymentCheckout | null {
  if (!value || typeof value !== "object") return null;

  const checkout = value as Partial<PendingPaymentCheckout>;
  const paymentId = String(checkout.paymentId ?? "").trim();
  const paymentUrl = String(checkout.paymentUrl ?? "").trim();
  const orderCode = String(checkout.orderCode ?? "").trim();
  const createdAt = Number(checkout.createdAt);

  if (!paymentId || !/^https?:\/\//i.test(paymentUrl) || !Number.isFinite(createdAt)) {
    return null;
  }

  if (createdAt + PENDING_CHECKOUT_MAX_AGE_MS <= Date.now()) return null;

  return {
    paymentId,
    paymentUrl,
    orderCode: orderCode || undefined,
    createdAt,
  };
}

export async function getPendingPaymentCheckout() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.pendingPaymentCheckout);
    const checkout = normalizePendingCheckout(raw ? JSON.parse(raw) : null);
    if (!checkout && raw) await clearPendingPaymentCheckout();
    return checkout;
  } catch {
    await clearPendingPaymentCheckout();
    return null;
  }
}

export async function setPendingPaymentCheckout(checkout: PendingPaymentCheckout) {
  await AsyncStorage.setItem(STORAGE_KEYS.pendingPaymentCheckout, JSON.stringify(checkout));
}

export async function clearPendingPaymentCheckout() {
  await AsyncStorage.removeItem(STORAGE_KEYS.pendingPaymentCheckout);
}

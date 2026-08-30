import type { SubscriptionPlanOffer } from "@/src/types/subscription";

export const OFFER_CHANGED_MESSAGE =
  "Giá hoặc số lượt vừa được cập nhật. Vui lòng kiểm tra lại gói và bấm mua lần nữa để xác nhận.";

// These values are an acknowledgement of the displayed server offer, never a
// client-side price calculation. No-sale purchases also require all three fields.
export function getPricingSnapshot(item: SubscriptionPlanOffer | null | undefined) {
  if (!item?.plan?.id) return null;
  if (typeof item.effectivePrice !== "number" || !Number.isFinite(item.effectivePrice) || item.effectivePrice < 0) return null;
  if (typeof item.grantedCredit !== "number" || !Number.isSafeInteger(item.grantedCredit) || item.grantedCredit < 0) return null;
  if (item.offer != null && !item.offer.offerId) return null;

  return {
    expectedOfferId: item.offer?.offerId ?? null,
    expectedEffectivePrice: item.effectivePrice,
    expectedGrantedCredit: item.grantedCredit,
  };
}

export function isSamePricingSnapshot(
  displayed: SubscriptionPlanOffer | null | undefined,
  latest: SubscriptionPlanOffer | null | undefined,
) {
  const left = getPricingSnapshot(displayed);
  const right = getPricingSnapshot(latest);
  return Boolean(left && right && displayed?.plan.id === latest?.plan.id
    && left.expectedOfferId === right.expectedOfferId
    && left.expectedEffectivePrice === right.expectedEffectivePrice
    && left.expectedGrantedCredit === right.expectedGrantedCredit);
}

export function isSaleOfferUnavailable(error: unknown) {
  const apiError = error as { status?: number; payload?: { errors?: unknown } } | null;
  if (apiError?.status !== 409) return false;
  const errors = apiError.payload?.errors;
  const codes = Array.isArray(errors) ? errors : [errors];
  return codes.some((code) => code === "SALE_OFFER_UNAVAILABLE");
}

// Ported 1:1 from src/pages/NearbyClinicPage.jsx (Web) — review display/
// ownership/error-message helpers. getReviewMessageText string-matches
// literal English backend response text (fragile, backend-contract-coupled,
// same caveat as Web) — kept verbatim for parity rather than "cleaned up"
// independently of the backend contract.
import { ApiError } from "@/src/api/client";
import { AuthSession } from "@/src/types/auth";
import { normalizeSearchText } from "@/src/utils/facilityNormalize";

export type FeedbackReview = {
  id?: string;
  rating?: number | string;
  comment?: string;
  imageUrls?: unknown;
  images?: unknown;
  reviewImages?: unknown;
  imageUrl?: string;
  reviewImageUrl?: string;
  photoUrl?: string;
  reviewerName?: string;
  userFullName?: string;
  fullName?: string;
  userName?: string;
  username?: string;
  createdByName?: string;
  patientName?: string;
  createdAt?: string;
  reviewedAt?: string;
  updatedAt?: string;
  userId?: string;
  reviewerId?: string;
  identityId?: string;
  createdBy?: string;
  reviewerEmail?: string;
  userEmail?: string;
  facilityId?: string;
  isCurrentUser?: boolean;
  isKnownDuplicate?: boolean;
  [key: string]: unknown;
};

export function getReviewAuthorName(review: FeedbackReview | null | undefined) {
  return (
    review?.reviewerName ||
    review?.userFullName ||
    review?.fullName ||
    review?.userName ||
    review?.username ||
    review?.createdByName ||
    review?.patientName ||
    "Người dùng ẩn danh"
  );
}

export function getReviewAuthorInitial(name: string) {
  if (name === "Người dùng ẩn danh") return "ND";
  const words = String(name).trim().split(/\s+/).filter(Boolean);
  return (
    words
      .slice(-2)
      .map((word) => word[0])
      .join("")
      .toUpperCase() || "ND"
  );
}

export function getReviewDate(review: FeedbackReview | null | undefined) {
  const value = review?.createdAt || review?.reviewedAt || review?.updatedAt;
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString("vi-VN");
}

export function getReviewImageUrls(review: FeedbackReview | null | undefined): string[] {
  const collection = review?.imageUrls || review?.images || review?.reviewImages || [];
  const collectionUrls = Array.isArray(collection)
    ? collection
        .map((image) => (typeof image === "string" ? image : (image as { url?: string; imageUrl?: string })?.url || (image as { url?: string; imageUrl?: string })?.imageUrl))
        .filter(Boolean)
    : Object.values((collection as Record<string, unknown>) || {}).filter((url): url is string => typeof url === "string" && Boolean(url));
  const legacyUrl = review?.imageUrl || review?.reviewImageUrl || review?.photoUrl || "";
  return Array.from(new Set([...(collectionUrls as string[]), legacyUrl].filter(Boolean)));
}

export function toReviewImageUrlMap(imageUrls: string[]) {
  return Object.fromEntries(imageUrls.slice(0, 5).map((imageUrl, index) => [`image${index + 1}`, imageUrl]));
}

export function isReviewByCurrentUser(review: FeedbackReview | null | undefined, auth: AuthSession | null | undefined) {
  if (!review || !auth) return false;
  const currentIds = [auth.userId, auth.identityId].filter(Boolean).map(String);
  const reviewIds = [review.userId, review.reviewerId, review.identityId, review.createdBy].filter(Boolean).map(String);
  if (currentIds.some((id) => reviewIds.includes(id))) return true;

  const currentEmail = String(auth.email || "").trim().toLowerCase();
  const reviewEmail = String(review.reviewerEmail || review.userEmail || "").trim().toLowerCase();
  return Boolean(currentEmail && reviewEmail && currentEmail === reviewEmail);
}

export function getReviewMessageText(message: unknown, fallback = "Không thể xử lý đánh giá lúc này.") {
  const error = message as (ApiError & { payload?: { message?: string; errors?: unknown } }) | string | undefined;
  const source = [
    typeof message === "string" ? message : "",
    typeof error === "object" ? error?.message : "",
    typeof error === "object" ? error?.payload?.message : "",
    typeof error === "object" && error?.payload?.errors ? JSON.stringify(error.payload.errors) : "",
  ]
    .filter(Boolean)
    .join(" ")
    .trim();
  if (!source) return fallback;

  const normalized = normalizeSearchText(source);
  if (normalized.includes("already reviewed") || normalized.includes("reviewed this facility")) {
    return "Bạn đã đánh giá cơ sở y tế này rồi.";
  }
  if (normalized.includes("create feedback review failed")) {
    return "Không thể gửi đánh giá. Vui lòng thử lại sau.";
  }
  if (
    normalized.includes("feedback review created") ||
    normalized.includes("review created") ||
    normalized.includes("create feedback review success") ||
    normalized.includes("created successfully") ||
    normalized === "ok"
  ) {
    return "Đã gửi đánh giá của bạn.";
  }
  if (normalized.includes("unauthorized") || normalized.includes("forbidden")) {
    return "Bạn cần đăng nhập để gửi đánh giá.";
  }
  if (normalized.includes("network") || normalized.includes("failed to fetch")) {
    return "Không thể tải thông tin. Vui lòng thử lại.";
  }

  return source;
}

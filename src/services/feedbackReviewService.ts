// Ported from src/services/feedbackReviewService.js (Web) — only the
// user-facing operations (public read, authenticated create/update).
// list()/setStatus()/remove() are Admin-only and out of scope here.
import { apiRequest } from "@/src/api/client";
import { ENDPOINTS } from "@/src/api/endpoints";
import { withPagination } from "@/src/utils/pagination";

export type ReviewPayload = {
  rating: number;
  comment: string | null;
  imageUrls: Record<string, string> | null;
  facilityId?: string;
};

export const feedbackReviewsApi = {
  byFacility(facilityId: string, pageNumber = 1, pageSize = 20) {
    return apiRequest(`${ENDPOINTS.FEEDBACK_REVIEWS.BY_FACILITY(facilityId)}?${withPagination(pageNumber, pageSize)}`);
  },

  create(payload: ReviewPayload) {
    return apiRequest(ENDPOINTS.FEEDBACK_REVIEWS.BASE, { method: "POST", data: payload, requiresAuth: true });
  },

  update(id: string, payload: ReviewPayload) {
    return apiRequest(ENDPOINTS.FEEDBACK_REVIEWS.BY_ID(id), { method: "PUT", data: payload, requiresAuth: true });
  },
};

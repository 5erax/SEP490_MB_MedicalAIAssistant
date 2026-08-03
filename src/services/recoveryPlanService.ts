// Ported from src/services/recoveryPlanService.js (Web).
import { apiRequest } from "@/src/api/client";
import { ENDPOINTS } from "@/src/api/endpoints";
import { PaginatedResult } from "@/src/types/api";
import { CreateRecoveryPlanRequestPayload, RecoveryPlan, RecoveryPlanRequest } from "@/src/types/recoveryPlan";

function withQuery(path: string, params: Record<string, string | number | undefined> = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== "" && value !== null && value !== undefined) search.set(key, String(value));
  });
  const query = search.toString();
  return query ? `${path}?${query}` : path;
}

export const recoveryPlanRequestsApi = {
  create(payload: CreateRecoveryPlanRequestPayload, idempotencyKey: string) {
    return apiRequest<RecoveryPlanRequest>(ENDPOINTS.RECOVERY_PLAN_REQUESTS.BASE, {
      method: "POST",
      data: payload,
      headers: { "Idempotency-Key": idempotencyKey },
      requiresAuth: true,
    });
  },

  listMine(pageNumber = 1, pageSize = 10, status = "") {
    return apiRequest<PaginatedResult<RecoveryPlanRequest>>(
      withQuery(ENDPOINTS.RECOVERY_PLAN_REQUESTS.ME, { PageNumber: pageNumber, PageSize: pageSize, Status: status || undefined }),
      { requiresAuth: true },
    );
  },

  get(requestId: string) {
    return apiRequest<RecoveryPlanRequest>(ENDPOINTS.RECOVERY_PLAN_REQUESTS.BY_ID(requestId), { requiresAuth: true });
  },

  cancel(requestId: string) {
    return apiRequest<RecoveryPlanRequest>(ENDPOINTS.RECOVERY_PLAN_REQUESTS.CANCEL(requestId), { method: "POST", requiresAuth: true });
  },

  // Ported verbatim: submitted text REPLACES the existing note, it does not
  // append to a conversation thread — matches Web's copy ("Nội dung gửi đi
  // sẽ thay thế phần ghi chú hiện tại, không tạo thành chuỗi trò chuyện.").
  provideInformation(requestId: string, additionalInformation: string) {
    return apiRequest<RecoveryPlanRequest>(ENDPOINTS.RECOVERY_PLAN_REQUESTS.PROVIDE_INFORMATION(requestId), {
      method: "POST",
      data: { additionalInformation },
      requiresAuth: true,
    });
  },
};

export const recoveryPlansApi = {
  listMine(pageNumber = 1, pageSize = 10, status = "") {
    return apiRequest<PaginatedResult<RecoveryPlan>>(
      withQuery(ENDPOINTS.RECOVERY_PLANS.ME, { PageNumber: pageNumber, PageSize: pageSize, Status: status || undefined }),
      { requiresAuth: true },
    );
  },

  get(planId: string) {
    return apiRequest<RecoveryPlan>(ENDPOINTS.RECOVERY_PLANS.BY_ID(planId), { requiresAuth: true });
  },

  // Server computes startDate/endDate from the account's timezone; no body.
  start(planId: string) {
    return apiRequest<RecoveryPlan>(ENDPOINTS.RECOVERY_PLANS.START(planId), { method: "POST", requiresAuth: true });
  },
};

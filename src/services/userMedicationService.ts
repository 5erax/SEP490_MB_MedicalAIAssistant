// Ported from src/services/userMedicationService.js (Web).
import { apiRequest } from "@/src/api/client";
import { ENDPOINTS } from "@/src/api/endpoints";
import { PaginatedResult } from "@/src/types/api";
import { UserMedication, UserMedicationPayload } from "@/src/types/medication";
import { withPagination } from "@/src/utils/pagination";

export const userMedicationsApi = {
  list(pageNumber = 1, pageSize = 5) {
    return apiRequest<PaginatedResult<UserMedication> | UserMedication[]>(
      `${ENDPOINTS.USER_MEDICATIONS.BASE}?${withPagination(pageNumber, pageSize)}`,
      { requiresAuth: true },
    );
  },

  create(payload: UserMedicationPayload) {
    return apiRequest<UserMedication>(ENDPOINTS.USER_MEDICATIONS.BASE, {
      method: "POST",
      data: payload,
      requiresAuth: true,
    });
  },

  update(id: string, payload: UserMedicationPayload) {
    return apiRequest<UserMedication>(ENDPOINTS.USER_MEDICATIONS.BY_ID(id), {
      method: "PUT",
      data: payload,
      requiresAuth: true,
    });
  },

  remove(id: string) {
    return apiRequest(ENDPOINTS.USER_MEDICATIONS.BY_ID(id), { method: "DELETE", requiresAuth: true });
  },
};

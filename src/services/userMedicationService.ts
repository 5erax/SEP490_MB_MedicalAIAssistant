// Ported from src/services/userMedicationService.js (Web).
import { apiRequest } from "@/src/api/client";
import { ENDPOINTS } from "@/src/api/endpoints";
import { UserMedication, UserMedicationPayload } from "@/src/types/medication";

export const userMedicationsApi = {
  list() {
    return apiRequest<UserMedication[]>(ENDPOINTS.USER_MEDICATIONS.BASE, { requiresAuth: true });
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

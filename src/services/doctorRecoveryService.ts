import { apiRequest } from "@/src/api/client";
import { ENDPOINTS } from "@/src/api/endpoints";
import { PaginatedResult } from "@/src/types/api";
import { DoctorClinicalContext, DoctorRecoveryRequest } from "@/src/types/doctorRecovery";

function pageParams(pageNumber = 1, pageSize = 10, filter?: { name: string; value?: string }) {
  return {
    PageNumber: pageNumber,
    PageSize: pageSize,
    ...(filter?.value ? { [filter.name]: filter.value } : {}),
  };
}

export const doctorRecoveryService = {
  listOpen(pageNumber = 1, diseaseGroup = "") {
    return apiRequest<PaginatedResult<DoctorRecoveryRequest>>(ENDPOINTS.DOCTOR_RECOVERY_REQUESTS.OPEN, {
      method: "GET",
      params: pageParams(pageNumber, 10, { name: "DiseaseGroup", value: diseaseGroup }),
      requiresAuth: true,
    });
  },
  listMine(pageNumber = 1, status = "") {
    return apiRequest<PaginatedResult<DoctorRecoveryRequest>>(ENDPOINTS.DOCTOR_RECOVERY_REQUESTS.MINE, {
      method: "GET",
      params: pageParams(pageNumber, 10, { name: "Status", value: status }),
      requiresAuth: true,
    });
  },
  get(requestId: string) {
    return apiRequest<DoctorRecoveryRequest>(ENDPOINTS.DOCTOR_RECOVERY_REQUESTS.BY_ID(requestId), { requiresAuth: true });
  },
  getClinicalContext(requestId: string) {
    return apiRequest<DoctorClinicalContext>(ENDPOINTS.DOCTOR_RECOVERY_REQUESTS.CLINICAL_CONTEXT(requestId), { requiresAuth: true });
  },
  accept(requestId: string) {
    return apiRequest(ENDPOINTS.DOCTOR_RECOVERY_REQUESTS.ACCEPT(requestId), { method: "POST", requiresAuth: true });
  },
  startReview(requestId: string) {
    return apiRequest(ENDPOINTS.DOCTOR_RECOVERY_REQUESTS.START_REVIEW(requestId), { method: "POST", requiresAuth: true });
  },
  release(requestId: string, reason?: string) {
    return apiRequest(ENDPOINTS.DOCTOR_RECOVERY_REQUESTS.RELEASE(requestId), { method: "POST", data: { reason: reason || null }, requiresAuth: true });
  },
};

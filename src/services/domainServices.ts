import { apiRequest } from "@/src/api/client";
import { ENDPOINTS } from "@/src/api/endpoints";
import { withPagination } from "@/src/utils/pagination";

export const usersService = {
  list(pageNumber = 1, pageSize = 10) {
    return apiRequest(`${ENDPOINTS.USERS.BASE}?${withPagination(pageNumber, pageSize)}`, { requiresAuth: true });
  },
  update(userId: string, payload: unknown) {
    return apiRequest(ENDPOINTS.USERS.BY_ID(userId), { method: "PUT", data: payload, requiresAuth: true });
  },
  remove(userId: string) {
    return apiRequest(ENDPOINTS.USERS.BY_ID(userId), { method: "DELETE", requiresAuth: true });
  },
  restore(userId: string) {
    return apiRequest(`${ENDPOINTS.USERS.BY_ID(userId)}/restore`, { method: "POST", requiresAuth: true });
  },
  approve(userId: string) {
    return apiRequest(ENDPOINTS.AUTH.APPROVE_STAFF(userId), { method: "POST", requiresAuth: true });
  },
};

export const medicalDepartmentsService = {
  list() {
    return apiRequest(ENDPOINTS.MEDICAL_DEPARTMENTS.BASE);
  },
  get(id: string) {
    return apiRequest(ENDPOINTS.MEDICAL_DEPARTMENTS.BY_ID(id));
  },
  create(payload: unknown) {
    return apiRequest(ENDPOINTS.MEDICAL_DEPARTMENTS.BASE, { method: "POST", data: payload, requiresAuth: true });
  },
  update(id: string, payload: unknown) {
    return apiRequest(ENDPOINTS.MEDICAL_DEPARTMENTS.BY_ID(id), { method: "PUT", data: payload, requiresAuth: true });
  },
  remove(id: string) {
    return apiRequest(ENDPOINTS.MEDICAL_DEPARTMENTS.BY_ID(id), { method: "DELETE", requiresAuth: true });
  },
};

// Real medical-facilities / doctors services live in facilityService.ts /
// doctorService.ts (built for the Nearby Clinics / Map + Doctor modules) —
// see those files instead of duplicating placeholder services here.

export const patientProfilesService = {
  list(pageNumber = 1, pageSize = 50) {
    return apiRequest(`${ENDPOINTS.PATIENT_PROFILES.BASE}?${withPagination(pageNumber, pageSize)}`, { requiresAuth: true });
  },
  get(id: string) {
    return apiRequest(ENDPOINTS.PATIENT_PROFILES.BY_ID(id), { requiresAuth: true });
  },
  create(payload: unknown) {
    return apiRequest(ENDPOINTS.PATIENT_PROFILES.BASE, { method: "POST", data: payload, requiresAuth: true });
  },
  update(id: string, payload: unknown) {
    return apiRequest(ENDPOINTS.PATIENT_PROFILES.BY_ID(id), { method: "PUT", data: payload, requiresAuth: true });
  },
};

// Real subscription-plans / user-subscriptions / payments services live in
// subscriptionService.ts (built for the Subscription + Payment modules).

export const webChatbotService = {
  message(message: string, auth = false) {
    return apiRequest(ENDPOINTS.WEB_CHATBOT.MESSAGE, {
      method: "POST",
      data: { message },
      requiresAuth: auth,
    });
  },
};

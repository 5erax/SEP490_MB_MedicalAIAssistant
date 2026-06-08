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

export const medicalFacilitiesService = {
  list(pageNumber = 1, pageSize = 50) {
    return apiRequest(`${ENDPOINTS.MEDICAL_FACILITIES.BASE}?${withPagination(pageNumber, pageSize)}`);
  },
  active() {
    return apiRequest(ENDPOINTS.MEDICAL_FACILITIES.ACTIVE);
  },
  get(id: string) {
    return apiRequest(ENDPOINTS.MEDICAL_FACILITIES.BY_ID(id));
  },
};

export const doctorsService = {
  list(pageNumber = 1, pageSize = 50) {
    return apiRequest(`${ENDPOINTS.DOCTORS.BASE}?${withPagination(pageNumber, pageSize)}`);
  },
  active() {
    return apiRequest(ENDPOINTS.DOCTORS.ACTIVE);
  },
  get(id: string) {
    return apiRequest(ENDPOINTS.DOCTORS.BY_ID(id));
  },
};

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

export const subscriptionPlansService = {
  list() {
    return apiRequest(ENDPOINTS.SUBSCRIPTION_PLANS.BASE);
  },
  active() {
    return apiRequest(ENDPOINTS.SUBSCRIPTION_PLANS.ACTIVE);
  },
  get(id: string) {
    return apiRequest(ENDPOINTS.SUBSCRIPTION_PLANS.BY_ID(id));
  },
};

export const webChatbotService = {
  message(message: string, auth = false) {
    return apiRequest(ENDPOINTS.WEB_CHATBOT.MESSAGE, {
      method: "POST",
      data: { message },
      requiresAuth: auth,
    });
  },
};

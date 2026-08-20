import { apiRequest } from "@/src/api/client";
import { ENDPOINTS } from "@/src/api/endpoints";
import { PaginatedResult } from "@/src/types/api";
import {
  DoctorClinicalContext,
  DoctorPlanDetail,
  DoctorRecoveryRequest,
  RecoveryFeedbackAnalytics,
  RecoveryPlanDraftPayload,
  RecoveryPlanFood,
  RecoveryPlanFoodPayload,
  RecoveryPlanNutrient,
  RecoveryPlanNutrientPayload,
  RecoveryPlan,
  RecoveryPlanPhase,
  RecoveryPlanPhasePayload,
} from "@/src/types/doctorRecovery";

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
  reject(requestId: string, rejectionReasonCode: string, rejectionReason: string) {
    return apiRequest(ENDPOINTS.DOCTOR_RECOVERY_REQUESTS.REJECT(requestId), {
      method: "POST",
      data: { rejectionReasonCode, rejectionReason },
      requiresAuth: true,
    });
  },
  createPlan(requestId: string, payload: RecoveryPlanDraftPayload) {
    return apiRequest<RecoveryPlan>(ENDPOINTS.DOCTOR_RECOVERY_REQUESTS.CREATE_PLAN(requestId), {
      method: "POST",
      data: payload,
      requiresAuth: true,
    });
  },
  getPlan(planId: string) {
    return apiRequest<DoctorPlanDetail>(ENDPOINTS.DOCTOR_RECOVERY_PLANS.BY_ID(planId), { requiresAuth: true });
  },
  updatePlan(planId: string, payload: RecoveryPlanDraftPayload) {
    return apiRequest(ENDPOINTS.DOCTOR_RECOVERY_PLANS.BY_ID(planId), { method: "PUT", data: payload, requiresAuth: true });
  },
  deletePlan(planId: string) {
    return apiRequest(ENDPOINTS.DOCTOR_RECOVERY_PLANS.BY_ID(planId), { method: "DELETE", requiresAuth: true });
  },
  createPhase(planId: string, payload: RecoveryPlanPhasePayload) {
    return apiRequest<RecoveryPlanPhase>(ENDPOINTS.DOCTOR_RECOVERY_PLANS.PHASES(planId), { method: "POST", data: payload, requiresAuth: true });
  },
  updatePhase(planId: string, phaseId: string, payload: RecoveryPlanPhasePayload) {
    return apiRequest(ENDPOINTS.DOCTOR_RECOVERY_PLANS.PHASE(planId, phaseId), { method: "PUT", data: payload, requiresAuth: true });
  },
  deletePhase(planId: string, phaseId: string) {
    return apiRequest(ENDPOINTS.DOCTOR_RECOVERY_PLANS.PHASE(planId, phaseId), { method: "DELETE", requiresAuth: true });
  },
  createNutrient(planId: string, phaseId: string, payload: RecoveryPlanNutrientPayload) {
    return apiRequest<RecoveryPlanNutrient>(ENDPOINTS.DOCTOR_RECOVERY_PLANS.NUTRIENTS(planId, phaseId), { method: "POST", data: payload, requiresAuth: true });
  },
  updateNutrient(planId: string, phaseId: string, nutrientId: string, payload: RecoveryPlanNutrientPayload) {
    return apiRequest(ENDPOINTS.DOCTOR_RECOVERY_PLANS.NUTRIENT(planId, phaseId, nutrientId), { method: "PUT", data: payload, requiresAuth: true });
  },
  deleteNutrient(planId: string, phaseId: string, nutrientId: string) {
    return apiRequest(ENDPOINTS.DOCTOR_RECOVERY_PLANS.NUTRIENT(planId, phaseId, nutrientId), { method: "DELETE", requiresAuth: true });
  },
  createFood(planId: string, phaseId: string, nutrientId: string, payload: RecoveryPlanFoodPayload) {
    return apiRequest<RecoveryPlanFood>(ENDPOINTS.DOCTOR_RECOVERY_PLANS.FOODS(planId, phaseId, nutrientId), { method: "POST", data: payload, requiresAuth: true });
  },
  updateFood(planId: string, phaseId: string, nutrientId: string, foodId: string, payload: RecoveryPlanFoodPayload) {
    return apiRequest(ENDPOINTS.DOCTOR_RECOVERY_PLANS.FOOD(planId, phaseId, nutrientId, foodId), { method: "PUT", data: payload, requiresAuth: true });
  },
  deleteFood(planId: string, phaseId: string, nutrientId: string, foodId: string) {
    return apiRequest(ENDPOINTS.DOCTOR_RECOVERY_PLANS.FOOD(planId, phaseId, nutrientId, foodId), { method: "DELETE", requiresAuth: true });
  },
  publish(planId: string) {
    return apiRequest(ENDPOINTS.DOCTOR_RECOVERY_PLANS.PUBLISH(planId), { method: "POST", requiresAuth: true });
  },
  feedbackAnalytics() {
    return apiRequest<RecoveryFeedbackAnalytics>(ENDPOINTS.DOCTOR_RECOVERY_PLANS.FEEDBACK_ANALYTICS, { requiresAuth: true });
  },
};

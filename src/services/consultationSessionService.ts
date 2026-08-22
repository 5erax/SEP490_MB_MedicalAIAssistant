// Ported from src/services/consultationSessionService.js and
// src/services/consultationCatalogService.js (Web).
import { apiRequest } from "@/src/api/client";
import { ENDPOINTS } from "@/src/api/endpoints";
import { PaginatedResult } from "@/src/types/api";
import { ChecklistItem, ConsultationSession, ConsultationSummary } from "@/src/types/consultation";

export type GenerateConsultationQuestionsPayload = {
  departmentId: string;
  facilityId?: string | null;
  appointmentTime: string;
  symptoms: string;
};

function withQuery(path: string, params: Record<string, string | number | undefined> = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== "" && value !== null && value !== undefined) search.set(key, String(value));
  });
  const query = search.toString();
  return query ? `${path}?${query}` : path;
}

export const consultationSessionsApi = {
  /**
   * Screen: PreConsultationScreen (step 1 - Info)
   * Endpoint: POST /api/consultation-sessions/generate-questions-for-consultant-session
   */
  generateQuestions(payload: GenerateConsultationQuestionsPayload) {
    return apiRequest<ConsultationSession>(ENDPOINTS.CONSULTATION_SESSIONS.GENERATE_QUESTIONS, {
      method: "POST",
      data: payload,
      requiresAuth: true,
    });
  },

  get(sessionId: string) {
    return apiRequest<ConsultationSession>(ENDPOINTS.CONSULTATION_SESSIONS.BY_ID(sessionId), { requiresAuth: true });
  },

  mySessions(pageNumber = 1, pageSize = 10) {
    return apiRequest<PaginatedResult<ConsultationSession>>(
      withQuery(ENDPOINTS.CONSULTATION_SESSIONS.MY_SESSIONS, { PageNumber: pageNumber, PageSize: pageSize }),
      { requiresAuth: true },
    );
  },

  registerReminder(sessionId: string, enableReminder: boolean) {
    return apiRequest<ConsultationSession>(ENDPOINTS.CONSULTATION_SESSIONS.REGISTER_REMINDER(sessionId), {
      method: "POST",
      data: { enableReminder },
      requiresAuth: true,
    });
  },

  getSummary(sessionId: string) {
    return apiRequest<ConsultationSummary>(ENDPOINTS.CONSULTATION_SESSIONS.SUMMARY(sessionId), { requiresAuth: true });
  },

  complete(sessionId: string) {
    return apiRequest<ConsultationSummary>(ENDPOINTS.CONSULTATION_SESSIONS.COMPLETE(sessionId), {
      method: "POST",
      requiresAuth: true,
    });
  },
};

export const checklistItemsApi = {
  byDepartment(departmentId: string) {
    return apiRequest<ChecklistItem[] | { items: ChecklistItem[] }>(
      ENDPOINTS.CHECKLIST_ITEMS.BY_DEPARTMENT(departmentId),
      { requiresAuth: true },
    );
  },
};

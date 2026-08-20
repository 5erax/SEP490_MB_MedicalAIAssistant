import { apiRequest } from "@/src/api/client";
import { ENDPOINTS } from "@/src/api/endpoints";
import { ConsultationSession, ConsultationSummary } from "@/src/types/consultation";
import { withPagination } from "@/src/utils/pagination";

export type GenerateConsultationPayload = {
  departmentId: string;
  symptoms: string;
  facilityId?: string | null;
  appointmentTime?: string | null;
};

export const consultationSessionsApi = {
  generateQuestions(payload: GenerateConsultationPayload) {
    return apiRequest<ConsultationSession>(ENDPOINTS.CONSULTATION_SESSIONS.GENERATE_QUESTIONS, {
      method: "POST",
      data: payload,
      requiresAuth: true,
    });
  },

  listMySessions(pageNumber = 1, pageSize = 30) {
    return apiRequest<{ items?: ConsultationSession[] }>(
      `${ENDPOINTS.CONSULTATION_SESSIONS.MY_SESSIONS}?${withPagination(pageNumber, pageSize)}`,
      { requiresAuth: true },
    );
  },

  get(sessionId: string) {
    return apiRequest<ConsultationSession>(ENDPOINTS.CONSULTATION_SESSIONS.BY_ID(sessionId), { requiresAuth: true });
  },

  registerReminder(sessionId: string, enableReminder: boolean) {
    return apiRequest(ENDPOINTS.CONSULTATION_SESSIONS.REGISTER_REMINDER(sessionId), {
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

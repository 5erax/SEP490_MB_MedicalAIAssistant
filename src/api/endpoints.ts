const byId = (base: string, id: string | number) => `${base}/${id}`;
const status = (base: string, id: string | number) => `${byId(base, id)}/status`;

const AUTH_BASE = "/api/authentication";
const USERS_BASE = "/api/users";
const DEPARTMENTS_BASE = "/api/medical-departments";
const FACILITIES_BASE = "/api/medical-facilities";
const FACILITY_DEPARTMENTS_BASE = "/api/facility-departments";
const DOCTORS_BASE = "/api/doctors";
const PATIENT_PROFILES_BASE = "/api/patient-profiles";
const SUBSCRIPTION_PLANS_BASE = "/api/subscription-plans";
const USER_SUBSCRIPTIONS_BASE = "/api/user-subscriptions";
const PAYMENTS_BASE = "/api/payments";
const AI_CONFIGS_BASE = "/api/ai-configs";
const WEB_CHATBOT_BASE = "/api/web-chatbot";
const SYMPTOM_ANALYSIS_BASE = "/api/symptom-analysis";
const FEEDBACK_REVIEWS_BASE = "/api/feedback-reviews";
const USER_MEDICATIONS_BASE = "/api/user-medications";

export const ENDPOINTS = {
  AUTH: {
    LOGIN: `${AUTH_BASE}/login`,
    REGISTER: `${AUTH_BASE}/register`,
    REGISTER_STAFF: `${AUTH_BASE}/register/staff`,
    GOOGLE: `${AUTH_BASE}/google`,
    REFRESH: `${AUTH_BASE}/refresh`,
    LOGOUT: `${AUTH_BASE}/logout`,
    FORGOT_PASSWORD: `${AUTH_BASE}/forgot-password`,
    CHANGE_PASSWORD: `${AUTH_BASE}/change-password`,
    APPROVE_STAFF: (userId: string | number) => `${AUTH_BASE}/${userId}/approve-staff`,
  },
  USERS: {
    BASE: USERS_BASE,
    ME: `${USERS_BASE}/me`,
    BY_ID: (userId: string | number) => byId(USERS_BASE, userId),
  },
  MEDICAL_DEPARTMENTS: {
    BASE: DEPARTMENTS_BASE,
    BY_ID: (id: string | number) => byId(DEPARTMENTS_BASE, id),
  },
  MEDICAL_FACILITIES: {
    BASE: FACILITIES_BASE,
    ACTIVE: `${FACILITIES_BASE}/active`,
    BY_ID: (id: string | number) => byId(FACILITIES_BASE, id),
    STATUS: (id: string | number) => status(FACILITIES_BASE, id),
  },
  FACILITY_DEPARTMENTS: {
    ACTIVE: `${FACILITY_DEPARTMENTS_BASE}/active`,
  },
  FEEDBACK_REVIEWS: {
    BASE: FEEDBACK_REVIEWS_BASE,
    BY_ID: (id: string | number) => byId(FEEDBACK_REVIEWS_BASE, id),
    BY_FACILITY: (facilityId: string) => `${FEEDBACK_REVIEWS_BASE}/facility/${facilityId}`,
  },
  SYMPTOM_ANALYSIS: {
    SUGGEST_CLINICAL_QUESTIONS: `${SYMPTOM_ANALYSIS_BASE}/suggest-clinical-questions`,
    SUBMIT_CLINICAL_QUESTION_ANSWERS: `${SYMPTOM_ANALYSIS_BASE}/submit-clinical-question-answers`,
    SUBMIT_DIAGNOSIS: `${SYMPTOM_ANALYSIS_BASE}/submit-diagnosis`,
    MY_SESSIONS: `${SYMPTOM_ANALYSIS_BASE}/my-sessions`,
    BY_SESSION: (sessionId: string) => byId(SYMPTOM_ANALYSIS_BASE, sessionId),
  },
  DOCTORS: {
    BASE: DOCTORS_BASE,
    ACTIVE: `${DOCTORS_BASE}/active`,
    BY_ID: (id: string | number) => byId(DOCTORS_BASE, id),
    STATUS: (id: string | number) => status(DOCTORS_BASE, id),
  },
  PATIENT_PROFILES: {
    BASE: PATIENT_PROFILES_BASE,
    BY_ID: (id: string | number) => byId(PATIENT_PROFILES_BASE, id),
  },
  SUBSCRIPTION_PLANS: {
    BASE: SUBSCRIPTION_PLANS_BASE,
    ACTIVE: `${SUBSCRIPTION_PLANS_BASE}/active`,
    BY_ID: (id: string | number) => byId(SUBSCRIPTION_PLANS_BASE, id),
    STATUS: (id: string | number) => status(SUBSCRIPTION_PLANS_BASE, id),
  },
  USER_SUBSCRIPTIONS: {
    CHECKOUT: `${USER_SUBSCRIPTIONS_BASE}/checkout`,
    ME: `${USER_SUBSCRIPTIONS_BASE}/me`,
    BY_ID: (id: string | number) => byId(USER_SUBSCRIPTIONS_BASE, id),
    CANCEL: (id: string | number) => `${byId(USER_SUBSCRIPTIONS_BASE, id)}/cancel`,
  },
  PAYMENTS: {
    ME: `${PAYMENTS_BASE}/me`,
    MY_PAYMENT: (id: string | number) => `${PAYMENTS_BASE}/me/${encodeURIComponent(String(id))}`,
    BY_ID: (id: string | number) => byId(PAYMENTS_BASE, id),
    BY_USER: (userId: string | number) => `${PAYMENTS_BASE}/user/${encodeURIComponent(String(userId))}`,
    PAYOS_RETURN: `${PAYMENTS_BASE}/payos-return`,
    PAYOS_CANCEL: `${PAYMENTS_BASE}/payos-cancel`,
    PAYOS_STATUS: (orderCode: string | number) => `${PAYMENTS_BASE}/payos-status/${encodeURIComponent(String(orderCode))}`,
  },
  AI_CONFIGS: {
    BASE: AI_CONFIGS_BASE,
    ACTIVE: `${AI_CONFIGS_BASE}/active`,
    BY_TASK_TYPE: (taskType: string) => `${AI_CONFIGS_BASE}/by-task-type/${encodeURIComponent(taskType)}`,
    BY_ID: (id: string | number) => byId(AI_CONFIGS_BASE, id),
    STATUS: (id: string | number) => status(AI_CONFIGS_BASE, id),
  },
  WEB_CHATBOT: {
    MESSAGE: `${WEB_CHATBOT_BASE}/message`,
  },
  USER_MEDICATIONS: {
    BASE: USER_MEDICATIONS_BASE,
    BY_ID: (id: string | number) => byId(USER_MEDICATIONS_BASE, id),
    REMINDERS: (id: string | number) => `${byId(USER_MEDICATIONS_BASE, id)}/reminders`,
  },
} as const;


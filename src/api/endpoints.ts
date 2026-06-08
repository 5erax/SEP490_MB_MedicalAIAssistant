const byId = (base: string, id: string | number) => `${base}/${id}`;
const status = (base: string, id: string | number) => `${byId(base, id)}/status`;

const AUTH_BASE = "/api/authentication";
const USERS_BASE = "/api/users";
const DEPARTMENTS_BASE = "/api/medical-departments";
const FACILITIES_BASE = "/api/medical-facilities";
const DOCTORS_BASE = "/api/doctors";
const PATIENT_PROFILES_BASE = "/api/patient-profiles";
const SUBSCRIPTION_PLANS_BASE = "/api/subscription-plans";
const AI_CONFIGS_BASE = "/api/ai-configs";
const WEB_CHATBOT_BASE = "/api/web-chatbot";

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
} as const;


export const ROUTES = {
  PUBLIC: {
    ONBOARDING: "/(public)/onboarding",
    LOGIN: "/(public)/login",
    REGISTER: "/(public)/register",
    FORGOT_PASSWORD: "/(public)/forgot-password",
    CHANGE_PASSWORD: "/(public)/change-password",
    PRICING: "/(public)/pricing",
    MEDICAL_DISCLAIMER: "/(public)/medical-disclaimer",
  },
  SETUP: {
    PATIENT_PROFILE: "/(setup)/patient-profile",
  },
  PATIENT: {
    HOME: "/(patient)/home",
    TABS: "/(patient)/home",
    MAP: "/(patient)/map",
    CHAT: "/(patient)/chat",
    RECORDS: "/(patient)/records",
    PROFILE: "/(patient)/profile",
    SYMPTOM: "/(patient)/symptom",
    SYMPTOM_RESULT: "/(patient)/symptom/result",
    FACILITY_DETAIL: "/(patient)/facilities/[id]",
    MEDICATION: "/(patient)/medication",
    MEDICATION_RESULT: "/(patient)/medication/result",
    SETTINGS: "/(patient)/settings",
  },
  DOCTOR: {
    DASHBOARD: "/(doctor)/dashboard",
  },
  STAFF: {
    DASHBOARD: "/(staff)/dashboard",
  },
  ADMIN: {
    DASHBOARD: "/(admin)/dashboard",
  },
  OPERATOR: {
    STAFF_UNSUPPORTED: "/(operator)/staff",
    ADMIN_UNSUPPORTED: "/(operator)/admin",
  },
} as const;

export type AppRouteGroup = keyof typeof ROUTES;

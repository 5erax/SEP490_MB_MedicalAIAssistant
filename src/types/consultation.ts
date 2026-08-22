// Backend payloads mix PascalCase/camelCase in places; kept loosely typed
// where Web's own consultationSessionService.js is similarly defensive.
export type ConsultationSessionStatus = "processing" | "completed" | "failed" | string;

export type ConsultationQuestion = {
  id: string;
  category: string;
  text: string;
  priority: number;
  [key: string]: unknown;
};

export type ConsultationSession = {
  sessionId: string;
  departmentId?: string;
  departmentName?: string;
  facilityId?: string;
  facilityName?: string;
  appointmentTime?: string;
  symptoms?: string;
  status?: ConsultationSessionStatus;
  questions?: ConsultationQuestion[];
  [key: string]: unknown;
};

export type ChecklistItem = {
  id: string;
  content: string;
  isMandatory: boolean;
  [key: string]: unknown;
};

export type ConsultationSummary = {
  departmentName?: string;
  appointmentTime?: string;
  isReminderEnabled?: boolean;
  symptoms?: string;
  questions?: ConsultationQuestion[];
  checklistItems?: ChecklistItem[];
  [key: string]: unknown;
};

export type SuggestedConsultationFacility = {
  facilityId: string;
  facilityName: string;
  address?: string;
};

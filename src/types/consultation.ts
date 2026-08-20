export type ConsultationSessionStatus = "processing" | "completed" | "failed";

export type ConsultationQuestion = {
  id: string;
  questionText?: string | null;
  category?: string | null;
  priority?: number;
};

export type ConsultationChecklistItem = {
  id: string;
  content?: string | null;
  isMandatory?: boolean;
};

export type ConsultationSession = {
  sessionId: string;
  departmentId: string;
  departmentName?: string | null;
  facilityId?: string | null;
  facilityName?: string | null;
  appointmentTime?: string | null;
  symptoms?: string | null;
  status: ConsultationSessionStatus;
  createdAt?: string;
  questions?: ConsultationQuestion[] | null;
};

export type ConsultationSummary = ConsultationSession & {
  isReminderEnabled: boolean;
  reminderSmsSent: boolean;
  checklistItems?: ConsultationChecklistItem[] | null;
  user?: {
    displayName?: string | null;
    email?: string | null;
    dateOfBirth?: string | null;
  };
};

export type MedicalDepartment = {
  id: string;
  departmentName?: string | null;
  description?: string | null;
};

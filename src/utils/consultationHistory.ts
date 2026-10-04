import { unwrapApiData } from "@/src/services/symptomAnalysisService";
import { ChecklistItem, ConsultationQuestion, ConsultationSession, ConsultationSummary } from "@/src/types/consultation";

export type ConsultationHistorySession = ConsultationSession & {
  checklistItems?: ChecklistItem[];
  questions?: ConsultationQuestion[];
  createdAt?: string;
};

export const CONSULTATION_STATUS_LABELS: Record<string, { label: string; tone: "warning" | "success" | "danger" }> = {
  processing: { label: "Đang phân tích", tone: "warning" },
  completed: { label: "Đã hoàn tất", tone: "success" },
  failed: { label: "Không thành công", tone: "danger" },
};

export function formatConsultationDateTime(value?: string, options: Intl.DateTimeFormatOptions = { dateStyle: "short", timeStyle: "short" }) {
  if (!value) return "Chưa có thời gian";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Chưa có thời gian";
  return date.toLocaleString("vi-VN", options);
}

function readString(record: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (value !== null && value !== undefined && String(value).trim()) return String(value).trim();
  }
  return "";
}

function readArray<T>(record: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (Array.isArray(value)) return value as T[];
  }
  return [];
}

export function normalizeConsultationQuestion(raw: unknown, index: number): ConsultationQuestion {
  const item = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  return {
    ...item,
    id: readString(item, "id", "Id", "questionId", "QuestionId") || `question-${index + 1}`,
    category: readString(item, "category", "Category"),
    text: readString(item, "text", "Text", "questionText", "QuestionText", "question", "Question"),
    priority: Number(item.priority ?? item.Priority ?? index + 1) || index + 1,
  };
}

export function normalizeConsultationChecklistItem(raw: unknown, index: number): ChecklistItem {
  const item = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  return {
    ...item,
    id: readString(item, "id", "Id", "checklistItemId", "ChecklistItemId") || `checklist-${index + 1}`,
    content: readString(item, "content", "Content", "title", "Title", "description", "Description"),
    isMandatory: (item.isMandatory ?? item.IsMandatory) === true,
  };
}

export function normalizeConsultationSession(raw: unknown): ConsultationHistorySession | null {
  if (!raw || typeof raw !== "object") return null;
  const item = raw as Record<string, unknown>;
  const sessionId = readString(item, "sessionId", "SessionId", "id", "Id", "consultationSessionId", "ConsultationSessionId");
  if (!sessionId) return null;

  return {
    ...item,
    sessionId,
    departmentId: readString(item, "departmentId", "DepartmentId"),
    departmentName: readString(item, "departmentName", "DepartmentName"),
    facilityId: readString(item, "facilityId", "FacilityId"),
    facilityName: readString(item, "facilityName", "FacilityName"),
    appointmentTime: readString(item, "appointmentTime", "AppointmentTime"),
    createdAt: readString(item, "createdAt", "CreatedAt", "createdDate", "CreatedDate"),
    symptoms: readString(item, "symptoms", "Symptoms"),
    status: readString(item, "status", "Status"),
    questions: readArray<unknown>(item, "questions", "Questions").map(normalizeConsultationQuestion).filter((question) => question.text),
    checklistItems: readArray<unknown>(item, "checklistItems", "ChecklistItems").map(normalizeConsultationChecklistItem).filter((entry) => entry.content),
  };
}

export function readConsultationSessionList(response: unknown) {
  const data = unwrapApiData<unknown>(response);
  const page = (data && typeof data === "object" ? data : response) as Record<string, unknown>;
  const directItems = Array.isArray(data) ? data : null;
  const nestedData = page.data && typeof page.data === "object" ? page.data as Record<string, unknown> : null;
  const items =
    directItems
    ?? (Array.isArray(page.items) ? page.items : null)
    ?? (Array.isArray(page.Items) ? page.Items : null)
    ?? (nestedData && Array.isArray(nestedData.items) ? nestedData.items : null)
    ?? (nestedData && Array.isArray(nestedData.Items) ? nestedData.Items : null)
    ?? [];

  return items.map(normalizeConsultationSession).filter((session): session is ConsultationHistorySession => Boolean(session));
}

export function readConsultationSessionDetail(response: unknown) {
  const data = unwrapApiData<unknown>(response);
  const record = (data && typeof data === "object" ? data : response) as Record<string, unknown>;
  return normalizeConsultationSession(record.session ?? record.Session ?? record.consultationSession ?? record.ConsultationSession ?? record);
}

export function readConsultationSummary(response: unknown): ConsultationSummary | null {
  const data = unwrapApiData<unknown>(response);
  const record = (data && typeof data === "object" ? data : response) as Record<string, unknown>;
  const summary = (record.summary ?? record.Summary ?? record) as Record<string, unknown>;
  if (!summary || typeof summary !== "object") return null;

  return {
    ...summary,
    departmentName: readString(summary, "departmentName", "DepartmentName"),
    appointmentTime: readString(summary, "appointmentTime", "AppointmentTime"),
    symptoms: readString(summary, "symptoms", "Symptoms"),
    questions: readArray<unknown>(summary, "questions", "Questions").map(normalizeConsultationQuestion).filter((question) => question.text),
    checklistItems: readArray<unknown>(summary, "checklistItems", "ChecklistItems").map(normalizeConsultationChecklistItem).filter((entry) => entry.content),
  };
}

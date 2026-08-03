// Ported from the validation/formatting helpers inline in
// MedicalRecordPage.jsx (Web) — there is no separate labTestValidation.js
// file on Web either.
import { LabResultStatus, LabSessionStatus } from "@/src/types/labTest";

export function todayInputValue() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Whole years between dateOfBirth and testDate.
export function calculateAgeAtTest(dateOfBirth: string, testDate: string): number | null {
  const birth = new Date(dateOfBirth);
  const test = new Date(testDate);
  if (Number.isNaN(birth.getTime()) || Number.isNaN(test.getTime()) || test < birth) return null;

  let age = test.getFullYear() - birth.getFullYear();
  const monthDiff = test.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && test.getDate() < birth.getDate())) {
    age -= 1;
  }
  return age >= 0 ? age : null;
}

// Web's profileProblem(): gender 1 = Nam, 2 = Nữ, 0 = Khác (per
// profileValidation.ts) — only 1/2 map to the male/female field the
// analyze endpoint expects.
export function genderToAnalysisGender(gender: unknown): "male" | "female" | null {
  if (Number(gender) === 1) return "male";
  if (Number(gender) === 2) return "female";
  return null;
}

export type SessionStatusPresentation = { label: string; tone: "warning" | "success" | "danger" };

const SESSION_STATUS: Record<LabSessionStatus, SessionStatusPresentation> = {
  processing: { label: "Đang xử lý", tone: "warning" },
  completed: { label: "Hoàn tất", tone: "success" },
  failed: { label: "Thất bại", tone: "danger" },
};

export function getSessionStatusPresentation(status: LabSessionStatus): SessionStatusPresentation {
  return SESSION_STATUS[status] ?? { label: status, tone: "warning" };
}

export type ResultStatusPresentation = { label: string; tone: "success" | "warning" | "danger" | "neutral" };

const RESULT_STATUS: Record<LabResultStatus, ResultStatusPresentation> = {
  normal: { label: "Bình thường", tone: "success" },
  high: { label: "Cao", tone: "warning" },
  low: { label: "Thấp", tone: "warning" },
  criticalHigh: { label: "Rất cao", tone: "danger" },
  criticalLow: { label: "Rất thấp", tone: "danger" },
  unknown: { label: "Chưa xác định", tone: "neutral" },
};

export function getResultStatusPresentation(status: LabResultStatus): ResultStatusPresentation {
  return RESULT_STATUS[status] ?? RESULT_STATUS.unknown;
}

export function formatDateOnly(value: unknown) {
  if (!value) return "—";
  const date = new Date(value as string);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium" }).format(date);
}

export function formatDateTime(value: unknown) {
  if (!value) return "—";
  const date = new Date(value as string);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

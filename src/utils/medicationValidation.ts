// Ported 1:1 from the inline validation/formatting logic in Web's
// UserMedicationsPage.jsx (there is no separate medicationValidation.js
// file on Web; this mirrors its exact rules and constants).
import { ApiError } from "@/src/api/client";
import { UserMedication, UserMedicationPayload } from "@/src/types/medication";

export const MAX_REMINDER_TIMES = 12;
export const MAX_MEDICINE_NAME_LENGTH = 256;
export const MAX_DOSAGE_LENGTH = 1000;

export const MEDICATION_DISCLAIMER_TEXT =
  "Đây là lịch nhắc dựa trên thông tin bạn đã cung cấp. Hệ thống không kê đơn hoặc xác minh chỉ định dùng thuốc.";

export type MedicationFormState = {
  medicineName: string;
  dosageInstruction: string;
  startDate: string;
  endDate: string;
  isReminderEnabled: boolean;
  reminderTimes: string[];
};

export type MedicationFormErrors = Partial<Record<keyof MedicationFormState, string>>;

export const INITIAL_MEDICATION_FORM: MedicationFormState = {
  medicineName: "",
  dosageInstruction: "",
  startDate: "",
  endDate: "",
  isReminderEnabled: false,
  reminderTimes: [],
};

export function validateMedicationForm(form: MedicationFormState): MedicationFormErrors {
  const errors: MedicationFormErrors = {};
  const name = form.medicineName.trim();

  if (!name) {
    errors.medicineName = "Tên thuốc là bắt buộc.";
  } else if (name.length > MAX_MEDICINE_NAME_LENGTH) {
    errors.medicineName = `Tên thuốc tối đa ${MAX_MEDICINE_NAME_LENGTH} ký tự.`;
  }

  if (form.dosageInstruction.length > MAX_DOSAGE_LENGTH) {
    errors.dosageInstruction = `Hướng dẫn dùng thuốc tối đa ${MAX_DOSAGE_LENGTH} ký tự.`;
  }

  if (form.startDate && form.endDate && form.endDate < form.startDate) {
    errors.endDate = "Ngày kết thúc phải sau hoặc bằng ngày bắt đầu.";
  }

  const times = form.reminderTimes.filter(Boolean);
  if (new Set(times).size !== times.length) {
    errors.reminderTimes = "Không được trùng giờ nhắc.";
  } else if (times.length > MAX_REMINDER_TIMES) {
    errors.reminderTimes = `Tối đa ${MAX_REMINDER_TIMES} giờ nhắc.`;
  }

  if (form.isReminderEnabled) {
    if (!form.startDate) errors.startDate = "Cần chọn ngày bắt đầu để bật nhắc nhở.";
    if (!form.endDate) errors.endDate = errors.endDate || "Cần chọn ngày kết thúc để bật nhắc nhở.";
    if (times.length === 0) errors.reminderTimes = errors.reminderTimes || "Cần ít nhất một giờ nhắc khi bật nhắc nhở.";
  }

  return errors;
}

function normalizeTimePayload(value: string) {
  return value ? `${value}:00` : "";
}

export function buildMedicationPayload(form: MedicationFormState): UserMedicationPayload {
  return {
    medicineName: form.medicineName.trim(),
    dosageInstruction: form.dosageInstruction.trim() || null,
    startDate: form.startDate || null,
    endDate: form.endDate || null,
    isReminderEnabled: form.isReminderEnabled,
    reminderTimes: form.reminderTimes.filter(Boolean).map(normalizeTimePayload),
  };
}

export function toMedicationFormState(medication: UserMedication): MedicationFormState {
  return {
    medicineName: medication.medicineName || "",
    dosageInstruction: medication.dosageInstruction || "",
    startDate: medication.startDate ? medication.startDate.slice(0, 10) : "",
    endDate: medication.endDate ? medication.endDate.slice(0, 10) : "",
    isReminderEnabled: Boolean(medication.isReminderEnabled),
    reminderTimes: (medication.reminderTimes ?? [])
      .map((entry) => (entry?.timeOfDay ? String(entry.timeOfDay).slice(0, 5) : ""))
      .filter(Boolean),
  };
}

export function formatMedicationDateRange(startDate?: string | null, endDate?: string | null) {
  if (!startDate && !endDate) return "Chưa đặt thời gian dùng thuốc";
  const start = startDate ? new Date(`${String(startDate).slice(0, 10)}T00:00:00`).toLocaleDateString("vi-VN") : "?";
  const end = endDate ? new Date(`${String(endDate).slice(0, 10)}T00:00:00`).toLocaleDateString("vi-VN") : "?";
  return `${start} - ${end}`;
}

export function getMedicationErrorMessage(error: unknown, fallback: string) {
  const status = (error as ApiError)?.status;
  if (status === 401) return "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
  if (status === 404) return "Không tìm thấy thuốc này hoặc bạn không có quyền truy cập.";
  if (status === 409) return "Dữ liệu đã thay đổi. Vui lòng tải lại và thử lại.";
  return (error as Error)?.message || fallback;
}

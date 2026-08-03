// Ported 1:1 from src/utils/profileValidation.js (Web).
import { ChronicDisease } from "@/src/types/patientProfile";

const PHONE_PATTERN = /^(?:0\d{8,10}|\+[1-9]\d{8,14})$/;
export const MAX_NOTE_LENGTH = 1000;
export const MAX_DISEASE_NAME_LENGTH = 160;

export function normalizePhoneNumber(value: unknown) {
  return String(value ?? "").trim().replace(/[\s.-]/g, "");
}

function isDateInRange(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  const min = new Date(1900, 0, 1);
  const max = new Date();
  return date >= min && date <= max;
}

function validateMeasurement(value: unknown, minimum: number, maximum: number, label: string) {
  if (value === "" || value === null || value === undefined) return "";
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < minimum || numeric > maximum) {
    return `${label} phải từ ${minimum} đến ${maximum}.`;
  }
  return "";
}

export type PersonalProfileForm = {
  displayName: string;
  gender: string;
  dateOfBirth: string;
  phoneNumber: string;
  address: string;
};

export type PersonalProfileErrors = Partial<Record<keyof PersonalProfileForm, string>>;

export function validatePersonalProfile(form: PersonalProfileForm, { required = false } = {}): PersonalProfileErrors {
  const errors: PersonalProfileErrors = {};
  const displayName = String(form.displayName ?? "").trim();
  const address = String(form.address ?? "").trim();
  const phoneNumber = normalizePhoneNumber(form.phoneNumber);

  if (!displayName) {
    errors.displayName = "Vui lòng nhập họ và tên.";
  } else if (displayName.length < 2 || displayName.length > 100) {
    errors.displayName = "Họ và tên phải có từ 2 đến 100 ký tự.";
  }

  if (required && !form.dateOfBirth) {
    errors.dateOfBirth = "Vui lòng chọn ngày sinh.";
  } else if (form.dateOfBirth && !isDateInRange(form.dateOfBirth)) {
    errors.dateOfBirth = "Ngày sinh phải từ năm 1900 đến hôm nay.";
  }

  if (required && !phoneNumber) {
    errors.phoneNumber = "Vui lòng nhập số điện thoại.";
  } else if (phoneNumber && !PHONE_PATTERN.test(phoneNumber)) {
    errors.phoneNumber = "Số điện thoại phải có 9-15 chữ số và có thể bắt đầu bằng +.";
  }

  if (required && !address) {
    errors.address = "Vui lòng nhập địa chỉ.";
  } else if (address && (address.length < 5 || address.length > 255)) {
    errors.address = "Địa chỉ phải có từ 5 đến 255 ký tự.";
  }

  if (!["0", "1", "2"].includes(String(form.gender))) {
    errors.gender = "Vui lòng chọn giới tính hợp lệ.";
  }

  return errors;
}

export function normalizePersonalProfile(form: PersonalProfileForm) {
  return {
    displayName: String(form.displayName ?? "").trim(),
    address: String(form.address ?? "").trim(),
    gender: Number(form.gender),
    dateOfBirth: form.dateOfBirth || null,
    phoneNumber: normalizePhoneNumber(form.phoneNumber) || null,
  };
}

export type MedicalProfileForm = {
  bloodType: string;
  height: string;
  weight: string;
  allergyNote: string;
  chronicDiseases: ChronicDisease[];
};

export type MedicalProfileErrors = {
  height?: string;
  weight?: string;
  allergyNote?: string;
  [key: `chronicDiseases.${number}.${string}`]: string | undefined;
};

export function validateMedicalProfile(form: MedicalProfileForm): MedicalProfileErrors {
  const errors: MedicalProfileErrors = {};
  const heightError = validateMeasurement(form.height, 40, 250, "Chiều cao (cm)");
  const weightError = validateMeasurement(form.weight, 2, 500, "Cân nặng (kg)");

  if (heightError) errors.height = heightError;
  if (weightError) errors.weight = weightError;

  if (String(form.allergyNote ?? "").trim().length > MAX_NOTE_LENGTH) {
    errors.allergyNote = `Thông tin dị ứng không được vượt quá ${MAX_NOTE_LENGTH} ký tự.`;
  }

  form.chronicDiseases.forEach((disease, index) => {
    const diseaseName = String(disease?.diseaseName ?? "").trim();
    const from = String(disease?.from ?? "").trim();
    const to = String(disease?.to ?? "").trim();
    const note = String(disease?.note ?? "").trim();
    const hasDiseaseDetails = Boolean(diseaseName || from || to || note);

    if (hasDiseaseDetails && !diseaseName) {
      errors[`chronicDiseases.${index}.diseaseName`] = "Vui lòng nhập tên bệnh nền.";
    } else if (diseaseName.length > MAX_DISEASE_NAME_LENGTH) {
      errors[`chronicDiseases.${index}.diseaseName`] = `Tên bệnh không được vượt quá ${MAX_DISEASE_NAME_LENGTH} ký tự.`;
    }
    if (from && to && to < from) {
      errors[`chronicDiseases.${index}.to`] = "Đến ngày không được trước từ ngày.";
    }
    if (note.length > MAX_NOTE_LENGTH) {
      errors[`chronicDiseases.${index}.note`] = `Ghi chú bệnh nền không được vượt quá ${MAX_NOTE_LENGTH} ký tự.`;
    }
  });

  return errors;
}

export function hasChronicDiseaseDetails(disease: ChronicDisease) {
  return Boolean(
    String(disease?.diseaseName ?? "").trim() ||
      String(disease?.from ?? "").trim() ||
      String(disease?.to ?? "").trim() ||
      String(disease?.note ?? "").trim(),
  );
}

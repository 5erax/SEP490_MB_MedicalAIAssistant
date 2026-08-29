import { UserMedication } from "@/src/types/medication";

export type MedicationReminderTone = "success" | "warning" | "danger" | "neutral";

export type MedicationReminderStatus = {
  key: "active" | "scheduled" | "expired" | "incomplete" | "off";
  label: string;
  description: string;
  emptyText: string;
  tone: MedicationReminderTone;
  active: boolean;
};

function toDateOnly(value?: string | null) {
  return value ? String(value).slice(0, 10) : "";
}

export function getLocalIsoDate(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getMedicationReminderTimes(medication: UserMedication) {
  return (medication.reminderTimes ?? [])
    .filter((entry) => (entry as { isActive?: boolean })?.isActive !== false)
    .map((entry) => String(entry?.timeOfDay ?? entry).slice(0, 5))
    .filter(Boolean)
    .sort();
}

export function getMedicationReminderStatus(
  medication: UserMedication,
  today = getLocalIsoDate(),
): MedicationReminderStatus {
  const times = getMedicationReminderTimes(medication);

  if (!medication.isReminderEnabled || times.length === 0) {
    return {
      key: "off",
      label: "Không nhắc",
      description: "Chưa bật lịch nhắc",
      emptyText: "Chưa có giờ",
      tone: "neutral",
      active: false,
    };
  }

  const startDate = toDateOnly(medication.startDate);
  const endDate = toDateOnly(medication.endDate);

  if (!startDate || !endDate) {
    return {
      key: "incomplete",
      label: "Thiếu lịch",
      description: "Thiếu ngày dùng thuốc",
      emptyText: "Cần bổ sung ngày dùng thuốc",
      tone: "warning",
      active: false,
    };
  }

  if (today < startDate) {
    return {
      key: "scheduled",
      label: "Sắp nhắc",
      description: "Sắp bật lịch nhắc",
      emptyText: "Lịch nhắc chưa đến ngày bắt đầu",
      tone: "warning",
      active: false,
    };
  }

  if (today > endDate) {
    return {
      key: "expired",
      label: "Đã hết hạn",
      description: "Đã qua ngày kết thúc",
      emptyText: "Lịch nhắc đã hết hạn",
      tone: "danger",
      active: false,
    };
  }

  return {
    key: "active",
    label: "Đang nhắc",
    description: "Đang bật lịch nhắc",
    emptyText: "Chưa có giờ",
    tone: "success",
    active: true,
  };
}

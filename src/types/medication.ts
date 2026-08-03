export type MedicationReminderTime = {
  id?: string;
  timeOfDay: string;
};

export type UserMedication = {
  id: string;
  medicineName: string;
  dosageInstruction?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  isReminderEnabled: boolean;
  reminderTimes?: MedicationReminderTime[];
  [key: string]: unknown;
};

export type UserMedicationPayload = {
  medicineName: string;
  dosageInstruction: string | null;
  startDate: string | null;
  endDate: string | null;
  isReminderEnabled: boolean;
  reminderTimes: string[];
};

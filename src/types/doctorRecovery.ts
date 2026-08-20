export type DoctorRecoveryRequest = {
  id: string;
  userId?: string;
  assignedDoctorId?: string | null;
  diseaseGroup: string | number;
  status: string | number;
  requestNote?: string | null;
  requestedAt?: string;
  acceptedAt?: string | null;
  reviewStartedAt?: string | null;
  assignmentExpiresAt?: string | null;
  recoveryPlanId?: string | null;
  recoveryPlanStatus?: string | number | null;
};

export type DoctorClinicalContext = {
  requestId: string;
  diseaseGroup: string | number;
  requestNote?: string | null;
  patientProfile?: {
    height?: number | null;
    weight?: number | null;
    bmi?: number | null;
    allergyNote?: string | null;
  } | null;
  chronicDiseases?: { diseaseName: string; note?: string | null }[];
  primaryLabTest?: {
    results?: {
      indicatorId: string;
      symbol: string;
      fullName?: string | null;
      userValue?: number | null;
      unit?: string | null;
      status?: string | null;
    }[];
  } | null;
  userMedications?: {
    userMedicationId: string;
    medicineName: string;
    dosageInstruction?: string | null;
    status?: string | null;
  }[];
  treatmentJourney?: {
    title?: string | null;
    diagnosisSummary?: string | null;
    status?: string | null;
  } | null;
};

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

export type RecoveryPlanDraftPayload = {
  planName: string;
  summary?: string | null;
  durationDays: number;
  recheckInstruction?: string | null;
};

export type RecoveryPlanFood = {
  id: string;
  foodName: string;
  suggestedServing?: string | null;
  note?: string | null;
  sortOrder: number;
};

export type RecoveryPlanNutrient = {
  id: string;
  nutrientName: string;
  amountPerDay: number;
  unit: string;
  instruction?: string | null;
  sortOrder: number;
  foodSources: RecoveryPlanFood[];
};

export type RecoveryPlanPhase = {
  id: string;
  phaseName: string;
  startDay: number;
  endDay: number;
  sleepAndRestHoursPerDay?: number | null;
  instruction?: string | null;
  sortOrder: number;
  nutrientTargets: RecoveryPlanNutrient[];
};

export type RecoveryPlan = RecoveryPlanDraftPayload & {
  id: string;
  recoveryPlanRequestId: string;
  status: string | number;
  publishedAt?: string | null;
  phases: RecoveryPlanPhase[];
};

export type DoctorPlanDetail = {
  plan: RecoveryPlan;
  requestId: string;
  diseaseGroup: string | number;
  doctorId?: string | null;
};

export type RecoveryPlanPhasePayload = Omit<RecoveryPlanPhase, "id" | "nutrientTargets">;
export type RecoveryPlanNutrientPayload = Omit<RecoveryPlanNutrient, "id" | "foodSources">;
export type RecoveryPlanFoodPayload = Omit<RecoveryPlanFood, "id">;

export type RecoveryFeedbackAnalytics = {
  averageRating: number;
  totalFeedbacks: number;
  completedPlans: number;
  feedbackRate: number;
  ratingDistribution?: { rating: number; count: number }[];
  timeline?: { period: string; averageRating: number; count: number }[];
};

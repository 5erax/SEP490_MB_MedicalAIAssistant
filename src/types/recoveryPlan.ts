export type DiseaseGroup = "respiratory" | "musculoskeletal" | "infectiousDisease";

export type RecoveryPlanRequestStatus =
  | "waitingForDoctor"
  | "assigned"
  | "inReview"
  | "needMoreInformation"
  | "published"
  | "rejected"
  | "cancelled"
  | "expired";

export type RecoveryPlanRequest = {
  id: string;
  diseaseGroup: DiseaseGroup;
  status: RecoveryPlanRequestStatus;
  requestNote?: string | null;
  requestedAt?: string;
  reviewStartedAt?: string | null;
  acceptedAt?: string | null;
  rejectionReason?: string | null;
};

export type CreateRecoveryPlanRequestPayload = {
  diseaseGroup: DiseaseGroup;
  treatmentJourneyId: string | null;
  primaryLabTestSessionId: string | null;
  requestNote: string | null;
};

export type RecoveryPlanStatus = "readyToStart" | "active" | "completed" | "cancelled" | "superseded";

export type RecoveryPlanFoodSource = {
  id: string;
  sortOrder?: number;
  foodName: string;
  suggestedServing?: string;
  note?: string | null;
};

export type RecoveryPlanNutrientTarget = {
  id: string;
  sortOrder?: number;
  nutrientName: string;
  amountPerDay?: number | string;
  unit?: string;
  instruction?: string | null;
  foodSources?: RecoveryPlanFoodSource[];
};

export type RecoveryPlanPhase = {
  id: string;
  sortOrder?: number;
  startDay?: number;
  endDay?: number;
  phaseName: string;
  instruction?: string | null;
  sleepHoursPerDay?: number | null;
  restHoursPerDay?: number | null;
  nutrientTargets?: RecoveryPlanNutrientTarget[];
};

export type RecoveryPlan = {
  id: string;
  planName: string;
  status: RecoveryPlanStatus;
  summary?: string | null;
  durationDays?: number;
  startDate?: string | null;
  endDate?: string | null;
  recheckInstruction?: string | null;
  phases?: RecoveryPlanPhase[];
};

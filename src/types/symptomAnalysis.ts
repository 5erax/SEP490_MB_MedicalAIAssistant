// Backend payloads mix PascalCase/camelCase and are intentionally loosely
// typed here — mirrors the defensive, dynamic shape handling in Web's
// src/services/symptomAnalysisService.js (source of truth).
export type ClinicalQuestion = {
  questionId: string;
  questionText: string;
  questionVi: string;
  questionOriginalText: string;
  chapterId: string;
  chapterCode: string;
  totalScore: number;
  matchedKeywords: string[];
  answers: Record<string, unknown>;
  [key: string]: unknown;
};

export type ClinicalDepartment = {
  confidenceScore: number;
  departmentId: string;
  departmentName: string;
  icdChapterCode?: string;
  isEmergencySuggested: boolean;
  priorityRank: number;
  reason?: string;
  [key: string]: unknown;
};

export type ClinicalFacility = {
  address: string;
  departments: ClinicalDepartment[];
  facilityId: string;
  facilityName: string;
  facilityType?: string;
  imageUrl?: string;
  isActive: boolean;
  latitude: number | null;
  longitude: number | null;
  openingHours?: string;
  phone?: string;
  website?: string;
  rating?: number;
  averageRating?: number;
  [key: string]: unknown;
};

export type ClinicalAnalysisResult = {
  recommendedDepartment: ClinicalDepartment | null;
  recommendedFacilities: ClinicalFacility[];
  [key: string]: unknown;
};

export type ClinicalMapSnapshot = {
  sessionId: string;
  recommendedDepartment: ClinicalDepartment | null;
  recommendedFacilities: ClinicalFacility[];
};

export type SymptomAnalysisSession = {
  sessionId?: string;
  id?: string;
  inputText?: string;
  userInput?: string;
  symptoms?: string;
  createdAt?: string;
  createdDate?: string;
  sessionType?: string;
  status?: string;
  [key: string]: unknown;
};

export type ClinicalAnswerItem = {
  questionId: string;
  answers: Record<string, boolean>;
};

export type AnswerValue = string | Record<string, boolean> | boolean | undefined;

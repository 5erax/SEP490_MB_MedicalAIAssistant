// Ported 1:1 from src/services/symptomAnalysisService.js (Web). The clinical
// question rendering/answer-building logic lives in
// src/utils/clinicalQuestions.ts; this file owns the API calls and the
// clinical-map handoff cache (Web uses sessionStorage + an in-memory Map,
// mobile uses AsyncStorage + an in-memory Map — same contract).
import AsyncStorage from "@react-native-async-storage/async-storage";

import { apiRequest } from "@/src/api/client";
import { ENDPOINTS } from "@/src/api/endpoints";
import {
  ClinicalAnalysisResult,
  ClinicalAnswerItem,
  ClinicalDepartment,
  ClinicalDiagnosis,
  ClinicalFacility,
  ClinicalMapSnapshot,
  SymptomAnalysisSession,
} from "@/src/types/symptomAnalysis";
import { readSuggestClinicalQuestionsPayload, unwrapApiData } from "@/src/utils/clinicalQuestions";

const CLINICAL_MAP_CACHE_KEY = "medimate.clinical-map.recommendation";
const clinicalAnalysisCache = new Map<string, ClinicalMapSnapshot>();

function normalizeText(value: unknown) {
  return String(value ?? "").trim().replace(/\s+/g, " ");
}

function normalizeCoordinate(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const coordinate = Number(value);
  return Number.isFinite(coordinate) ? coordinate : null;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function createDepartmentSnapshot(department: unknown): ClinicalDepartment | null {
  if (!isPlainObject(department)) return null;

  const departmentId = normalizeText(department.departmentId ?? department.DepartmentId ?? department.id);
  const departmentName = normalizeText(department.departmentName ?? department.DepartmentName ?? department.name);
  if (!departmentId && !departmentName) return null;

  return {
    confidenceScore: Number(department.confidenceScore ?? department.ConfidenceScore ?? 0) || 0,
    description: normalizeText(department.description ?? department.Description),
    departmentId,
    departmentName,
    icdChapterCode: normalizeText(department.icdChapterCode ?? department.IcdChapterCode),
    isEmergencySuggested: (department.isEmergencySuggested ?? department.IsEmergencySuggested) === true,
    priorityRank: Number(department.priorityRank ?? department.PriorityRank ?? 0) || 0,
    reason: normalizeText(department.reason ?? department.Reason),
  };
}

function normalizeProbability(value: unknown) {
  const numeric = Number(value ?? 0);
  return Number.isFinite(numeric) ? numeric : 0;
}

function createDiagnosisSnapshot(diagnosis: unknown, index = 0): ClinicalDiagnosis | null {
  if (!isPlainObject(diagnosis)) return null;

  const diseaseName = normalizeText(diagnosis.diseaseName ?? diagnosis.DiseaseName ?? diagnosis.name);
  const icd10Code = normalizeText(diagnosis.icd10Code ?? diagnosis.Icd10Code ?? diagnosis.icdCode);
  if (!diseaseName && !icd10Code) return null;

  return {
    clinicalReasoning: normalizeText(diagnosis.clinicalReasoning ?? diagnosis.ClinicalReasoning),
    diseaseName,
    icd10Code,
    paGivenB: normalizeProbability(
      diagnosis.paGivenB
        ?? diagnosis.PaGivenB
        ?? diagnosis.probability
        ?? diagnosis.Probability
        ?? diagnosis.confidenceScore
        ?? diagnosis.ConfidenceScore,
    ),
    rank: Number(diagnosis.rank ?? diagnosis.Rank ?? index + 1) || index + 1,
    searchKeyword: normalizeText(diagnosis.searchKeyword ?? diagnosis.SearchKeyword),
  };
}

function createSymptomDiagnosisSnapshot(symptom: unknown, index = 0): ClinicalDiagnosis | null {
  if (!isPlainObject(symptom)) return null;

  return createDiagnosisSnapshot(
    {
      clinicalReasoning: symptom.extractedText ?? symptom.ExtractedText,
      diseaseName: symptom.symptomName ?? symptom.SymptomName,
      icd10Code: symptom.icd10Code ?? symptom.Icd10Code,
      paGivenB: symptom.confidenceScore ?? symptom.ConfidenceScore,
      rank: index + 1,
    },
    index,
  );
}

function createFacilitySnapshot(facility: unknown): ClinicalFacility | null {
  if (!isPlainObject(facility)) return null;

  const facilityId = normalizeText(
    facility.facilityId ?? facility.FacilityId ?? facility.medicalFacilityId ?? facility.id,
  );
  if (!facilityId) return null;

  const departmentItems = facility.departments ?? facility.Departments;
  const departments = (Array.isArray(departmentItems) ? departmentItems : [])
    .map(createDepartmentSnapshot)
    .filter((department): department is ClinicalDepartment => Boolean(department));

  return {
    address: normalizeText(facility.address ?? facility.Address),
    departments,
    facilityId,
    facilityName: normalizeText(facility.facilityName ?? facility.FacilityName ?? facility.name),
    facilityType: normalizeText(facility.facilityType ?? facility.FacilityType),
    imageUrl: normalizeText(facility.imageUrl ?? facility.ImageUrl),
    isActive: (facility.isActive ?? facility.IsActive) !== false,
    latitude: normalizeCoordinate(facility.latitude ?? facility.Latitude),
    longitude: normalizeCoordinate(facility.longitude ?? facility.Longitude),
    openingHours: normalizeText(facility.openingHours ?? facility.OpeningHours),
    phone: normalizeText(facility.phone ?? facility.Phone),
    website: normalizeText(facility.website ?? facility.Website),
    rating: facility.rating as number | undefined,
    averageRating: facility.averageRating as number | undefined,
  };
}

function createClinicalMapSnapshot(analysis: unknown, fallbackSessionId: string): ClinicalMapSnapshot | null {
  if (!isPlainObject(analysis)) return null;

  const diagnosisItems = analysis.diagnoses ?? analysis.Diagnoses;
  const primaryDiagnosis = analysis.primaryDiagnosis ?? analysis.PrimaryDiagnosis;
  let diagnoses = (Array.isArray(diagnosisItems) && diagnosisItems.length > 0 ? diagnosisItems : primaryDiagnosis ? [primaryDiagnosis] : [])
    .map(createDiagnosisSnapshot)
    .filter((diagnosis): diagnosis is ClinicalDiagnosis => Boolean(diagnosis))
    .sort((left, right) => left.rank - right.rank);
  if (diagnoses.length === 0) {
    const symptomItems = analysis.symptoms ?? analysis.Symptoms;
    diagnoses = (Array.isArray(symptomItems) ? symptomItems : [])
      .map(createSymptomDiagnosisSnapshot)
      .filter((diagnosis): diagnosis is ClinicalDiagnosis => Boolean(diagnosis))
      .sort((left, right) => (right.paGivenB ?? 0) - (left.paGivenB ?? 0))
      .map((diagnosis, index) => ({ ...diagnosis, rank: index + 1 }));
  }

  const departmentItems = analysis.recommendedDepartments ?? analysis.RecommendedDepartments;
  const firstRecommendedDepartment = Array.isArray(departmentItems) ? departmentItems[0] : null;
  const facilityItems = analysis.recommendedFacilities ?? analysis.RecommendedFacilities;
  const recommendedFacilities = (Array.isArray(facilityItems) ? facilityItems : [])
    .map(createFacilitySnapshot)
    .filter((facility): facility is ClinicalFacility => Boolean(facility));
  const recommendedDepartment = createDepartmentSnapshot(
    analysis.recommendedDepartment ?? analysis.RecommendedDepartment ?? firstRecommendedDepartment,
  )
    ?? recommendedFacilities[0]?.departments?.[0]
    ?? null;

  if (!recommendedDepartment && recommendedFacilities.length === 0 && diagnoses.length === 0) return null;

  return {
    diagnoses,
    recommendedDepartment,
    recommendedFacilities,
    sessionId: normalizeText(analysis.sessionId ?? analysis.SessionId ?? fallbackSessionId),
  };
}

function createStoredClinicalMapSnapshot(snapshot: ClinicalMapSnapshot) {
  return {
    diagnoses: snapshot.diagnoses,
    sessionId: snapshot.sessionId,
    recommendedDepartment: snapshot.recommendedDepartment,
    recommendedFacilities: snapshot.recommendedFacilities.map((facility) => ({
      ...facility,
      departments: facility.departments.map((department) => ({
        departmentId: department.departmentId,
        departmentName: department.departmentName,
      })),
    })),
  };
}

async function clearStoredClinicalMapSnapshot() {
  try {
    await AsyncStorage.removeItem(CLINICAL_MAP_CACHE_KEY);
  } catch {
    // the in-memory cache still supports the current app session
  }
}

async function storeClinicalMapSnapshot(snapshot: ClinicalMapSnapshot) {
  try {
    await AsyncStorage.setItem(CLINICAL_MAP_CACHE_KEY, JSON.stringify(createStoredClinicalMapSnapshot(snapshot)));
  } catch {
    // the in-memory cache still supports the current app session
  }
}

async function cacheClinicalMapSnapshot(snapshot: ClinicalMapSnapshot) {
  clinicalAnalysisCache.clear();
  clinicalAnalysisCache.set(snapshot.sessionId, snapshot);
  await storeClinicalMapSnapshot(snapshot);
}

async function readStoredClinicalMapSnapshot(sessionId: string): Promise<{ available: boolean; snapshot: ClinicalMapSnapshot | null }> {
  try {
    const raw = await AsyncStorage.getItem(CLINICAL_MAP_CACHE_KEY);
    if (!raw) return { available: true, snapshot: null };

    const parsed = JSON.parse(raw) as { sessionId?: string };
    const snapshot = createClinicalMapSnapshot(parsed, parsed?.sessionId ?? "");
    if (!snapshot || snapshot.sessionId !== sessionId) return { available: true, snapshot: null };

    return { available: true, snapshot };
  } catch {
    await clearStoredClinicalMapSnapshot();
    return { available: true, snapshot: null };
  }
}

function readItemsFromPage(page: unknown): SymptomAnalysisSession[] {
  if (!page || typeof page !== "object") return [];
  const record = page as Record<string, unknown>;
  const items = record.items ?? record.Items ?? (Array.isArray(page) ? page : undefined);
  return Array.isArray(items) ? (items as SymptomAnalysisSession[]) : [];
}

export const symptomAnalysisApi = {
  analyze(message: string) {
    return this.suggestClinicalQuestions(message);
  },

  /**
   * Screen: DashboardPage (specialty intake)
   * Endpoint: POST /api/symptom-analysis/suggest-clinical-questions
   */
  suggestClinicalQuestions(userInput: string) {
    return apiRequest(ENDPOINTS.SYMPTOM_ANALYSIS.SUGGEST_CLINICAL_QUESTIONS, {
      method: "POST",
      data: { userInput: normalizeText(userInput) },
      requiresAuth: true,
    });
  },

  /**
   * Screen: DashboardPage (specialty intake — question flow)
   * Endpoint: POST /api/symptom-analysis/submit-clinical-question-answers
   */
  async submitClinicalQuestionAnswers(sessionId: string, answers: ClinicalAnswerItem[]) {
    const response = await apiRequest(ENDPOINTS.SYMPTOM_ANALYSIS.SUBMIT_CLINICAL_QUESTION_ANSWERS, {
      method: "POST",
      data: { sessionId, answers: Array.isArray(answers) ? answers : [] },
      requiresAuth: true,
    });
    const data = unwrapApiData<Record<string, unknown>>(response) ?? {};
    const resolvedSessionId = String(data.sessionId ?? sessionId ?? "").trim();
    const analysis = createClinicalMapSnapshot(data.analysis ?? data.result ?? null, resolvedSessionId);

    await clearStoredClinicalMapSnapshot();
    if (resolvedSessionId && analysis) {
      await cacheClinicalMapSnapshot(analysis);
    }

    return response;
  },

  async getCachedClinicalAnalysis(sessionId: string) {
    const resolvedSessionId = String(sessionId ?? "").trim();
    const inMemorySnapshot = clinicalAnalysisCache.get(resolvedSessionId);
    if (inMemorySnapshot) return inMemorySnapshot;

    const stored = await readStoredClinicalMapSnapshot(resolvedSessionId);
    if (stored.available && !stored.snapshot) {
      clinicalAnalysisCache.clear();
      return null;
    }

    return stored.snapshot ?? null;
  },

  async clearCachedClinicalAnalysis() {
    clinicalAnalysisCache.clear();
    await clearStoredClinicalMapSnapshot();
  },

  /**
   * Endpoint: POST /api/symptom-analysis/submit-diagnosis
   */
  submitDiagnosis(sessionId: string, answers: ClinicalAnswerItem[]) {
    return apiRequest(ENDPOINTS.SYMPTOM_ANALYSIS.SUBMIT_DIAGNOSIS, {
      method: "POST",
      data: { sessionId, answers: Array.isArray(answers) ? answers : [] },
      requiresAuth: true,
    });
  },

  listMySessions(pageNumber = 1, pageSize = 10, sessionType = "") {
    const search = new URLSearchParams({ PageNumber: String(pageNumber), PageSize: String(pageSize) });
    if (sessionType) search.set("sessionType", sessionType);

    return apiRequest(`${ENDPOINTS.SYMPTOM_ANALYSIS.MY_SESSIONS}?${search.toString()}`, {
      requiresAuth: true,
    });
  },

  async listAllMySessions(sessionType = "", pageSize = 50): Promise<SymptomAnalysisSession[]> {
    const firstResponse = await this.listMySessions(1, pageSize, sessionType);
    const firstPage = unwrapApiData<Record<string, unknown>>(firstResponse) || {};
    const firstItems = readItemsFromPage(firstPage);
    const totalPages = Math.max(1, Number(firstPage.totalPages ?? firstPage.TotalPages) || 1);

    if (totalPages === 1) return firstItems;

    const remainingResponses = await Promise.all(
      Array.from({ length: totalPages - 1 }, (_, index) => this.listMySessions(index + 2, pageSize, sessionType)),
    );
    const allItems = remainingResponses.reduce<SymptomAnalysisSession[]>((items, response) => {
      const page = unwrapApiData<Record<string, unknown>>(response) || {};
      return items.concat(readItemsFromPage(page));
    }, firstItems);

    const seenSessionIds = new Set<string>();
    return allItems.filter((session) => {
      const sessionId = session?.sessionId || session?.id;
      if (!sessionId || !seenSessionIds.has(sessionId)) {
        if (sessionId) seenSessionIds.add(sessionId);
        return true;
      }
      return false;
    });
  },

  get(sessionId: string) {
    return apiRequest(ENDPOINTS.SYMPTOM_ANALYSIS.BY_SESSION(sessionId), {
      requiresAuth: true,
    });
  },

  async cacheClinicalResult(sessionId: string, analysis: unknown) {
    const snapshot = createClinicalMapSnapshot(analysis, sessionId);
    if (!snapshot?.sessionId) return null;
    await clearStoredClinicalMapSnapshot();
    await cacheClinicalMapSnapshot(snapshot);
    return snapshot;
  },
};

export { readSuggestClinicalQuestionsPayload, unwrapApiData };

export function readResultPayload(response: unknown): ClinicalAnalysisResult | null {
  const data = unwrapApiData<Record<string, unknown>>(response);
  const sessionId = String(data?.sessionId ?? data?.SessionId ?? "").trim();
  const snapshot = createClinicalMapSnapshot(data?.analysis ?? data?.Analysis ?? data?.result ?? data?.Result ?? data ?? null, sessionId);
  if (!snapshot) return null;
  return {
    diagnoses: snapshot.diagnoses,
    recommendedDepartment: snapshot.recommendedDepartment,
    recommendedFacilities: snapshot.recommendedFacilities,
  };
}

// Ported from src/services/labTestService.js (Web).
import { apiRequest } from "@/src/api/client";
import { ENDPOINTS } from "@/src/api/endpoints";
import {
  AnalyzeLabTestPayload,
  LabIndicatorTrend,
  LabOcrExtract,
  LabTestSession,
  LabTrendIndicator,
} from "@/src/types/labTest";

export type LabSessionPage = {
  items: LabTestSession[];
  totalCount?: number;
  totalPages?: number;
};

function withQuery(path: string, params: Record<string, string | number | undefined> = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== "" && value !== null && value !== undefined) search.set(key, String(value));
  });
  const query = search.toString();
  return query ? `${path}?${query}` : path;
}

export const labTestsApi = {
  analyze(payload: AnalyzeLabTestPayload) {
    return apiRequest<LabTestSession>(ENDPOINTS.LAB_TESTS.ANALYZE, {
      method: "POST",
      data: payload,
      requiresAuth: true,
    });
  },

  mySessions(pageNumber = 1, pageSize = 8, status = "") {
    return apiRequest<LabSessionPage>(
      withQuery(ENDPOINTS.LAB_TESTS.MY_SESSIONS, { PageNumber: pageNumber, PageSize: pageSize, status: status || undefined }),
      { requiresAuth: true },
    );
  },

  get(sessionId: string) {
    return apiRequest<LabTestSession>(ENDPOINTS.LAB_TESTS.BY_SESSION(sessionId), { requiresAuth: true });
  },

  summarize(sessionId: string) {
    return apiRequest<string>(ENDPOINTS.LAB_TESTS.SUMMARY(sessionId), { method: "POST", requiresAuth: true });
  },

  ocrExtracts(sessionId: string) {
    return apiRequest<LabOcrExtract[]>(ENDPOINTS.LAB_TESTS.OCR_EXTRACTS(sessionId), { requiresAuth: true });
  },

  trendIndicators({ from = "", to = "" }: { from?: string; to?: string } = {}) {
    return apiRequest<LabTrendIndicator[]>(withQuery(ENDPOINTS.LAB_TESTS.TREND_INDICATORS, { from, to }), { requiresAuth: true });
  },

  indicatorTrend(indicatorId: string, { from = "", to = "" }: { from?: string; to?: string } = {}) {
    return apiRequest<LabIndicatorTrend>(withQuery(ENDPOINTS.LAB_TESTS.INDICATOR_TREND(indicatorId), { from, to }), { requiresAuth: true });
  },
};

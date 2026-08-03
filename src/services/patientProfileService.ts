// Ported from src/services/patientProfileService.js (Web) — only the
// operations actually called. Web defines a BY_USER lookup endpoint but
// never calls it (it pages through list() and finds the match client-side
// instead); mobile mirrors that actual behavior rather than the unused
// endpoint.
import { apiRequest } from "@/src/api/client";
import { ENDPOINTS } from "@/src/api/endpoints";
import { PatientProfile } from "@/src/types/patientProfile";

function withQuery(path: string, params: Record<string, string | number | undefined> = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== "" && value !== null && value !== undefined) search.set(key, String(value));
  });
  const query = search.toString();
  return query ? `${path}?${query}` : path;
}

export const patientProfilesApi = {
  list(pageNumber = 1, pageSize = 100) {
    return apiRequest<PatientProfile[]>(withQuery(ENDPOINTS.PATIENT_PROFILES.BASE, { PageNumber: pageNumber, PageSize: pageSize }), {
      requiresAuth: true,
    });
  },

  create(payload: Partial<PatientProfile>) {
    return apiRequest<PatientProfile>(ENDPOINTS.PATIENT_PROFILES.BASE, {
      method: "POST",
      data: payload,
      requiresAuth: true,
    });
  },

  update(id: string, payload: Partial<PatientProfile>) {
    return apiRequest<PatientProfile>(ENDPOINTS.PATIENT_PROFILES.BY_ID(id), {
      method: "PUT",
      data: payload,
      requiresAuth: true,
    });
  },
};

type PatientProfileListData = {
  items?: PatientProfile[];
  totalPages?: number;
  totalPage?: number;
  pageCount?: number;
  totalCount?: number;
  totalItems?: number;
  count?: number;
};

type PatientProfileListResponse = { data?: PatientProfileListData | PatientProfile[] };

function getPagedItems(response: PatientProfileListResponse) {
  const data = response?.data;
  if (Array.isArray(data)) return data;
  return data?.items ?? [];
}

function getTotalPages(response: PatientProfileListResponse, itemsLength: number, pageNumber: number, pageSize: number) {
  const data = Array.isArray(response?.data) ? ({} as PatientProfileListData) : (response?.data ?? ({} as PatientProfileListData));
  const explicitTotalPages = Number(data.totalPages ?? data.totalPage ?? data.pageCount);
  if (Number.isFinite(explicitTotalPages) && explicitTotalPages > 0) return explicitTotalPages;

  const totalCount = Number(data.totalCount ?? data.totalItems ?? data.count);
  if (Number.isFinite(totalCount) && totalCount > 0) return Math.ceil(totalCount / pageSize);

  return itemsLength < pageSize ? pageNumber : pageNumber + 1;
}

// Ported from patientProfilesApi.findByUserId (Web) — used by the first-time
// setup flow (PersonalPatientProfilePage.jsx), which pages through *every*
// page of results looking for a match. This is a different (more thorough)
// algorithm than UserProfilePage.jsx's own inline single-page lookup, which
// is what useProfile.ts mirrors instead — a real inconsistency in Web
// itself between the two flows, preserved faithfully rather than unified.
export async function findPatientProfileByUserId(userId: string, pageSize = 100): Promise<PatientProfile | null> {
  if (!userId) return null;
  const wantedUserId = userId.toLowerCase();
  let currentPage = 1;

  for (;;) {
    const response = (await patientProfilesApi.list(currentPage, pageSize)) as PatientProfileListResponse;
    const items = getPagedItems(response);
    const match = items.find((item) => String(item.userId).toLowerCase() === wantedUserId);
    if (match) return match;

    const totalPages = getTotalPages(response, items.length, currentPage, pageSize);
    if (currentPage >= totalPages) break;
    currentPage += 1;
  }

  return null;
}

import { ApiError, apiRequest } from "@/src/api/client";
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

function unwrapPatientProfile(response: unknown): PatientProfile | null {
  if (!response || typeof response !== "object") return (response as PatientProfile | null) ?? null;
  if (!("data" in response)) return response as PatientProfile;

  const data = (response as { data?: unknown }).data;
  if (data && typeof data === "object" && "data" in data) {
    return ((data as { data?: PatientProfile | null }).data ?? null) as PatientProfile | null;
  }

  return (data as PatientProfile | null) ?? null;
}

export const patientProfilesApi = {
  list(pageNumber = 1, pageSize = 100) {
    return apiRequest<PatientProfile[]>(withQuery(ENDPOINTS.PATIENT_PROFILES.BASE, { PageNumber: pageNumber, PageSize: pageSize }), {
      requiresAuth: true,
    });
  },

  getByUserId(userId: string) {
    return apiRequest<PatientProfile>(ENDPOINTS.PATIENT_PROFILES.BY_USER(userId), {
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

export async function findPatientProfileByUserId(userId: string): Promise<PatientProfile | null> {
  if (!userId) return null;

  try {
    const response = await patientProfilesApi.getByUserId(userId);
    return unwrapPatientProfile(response);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

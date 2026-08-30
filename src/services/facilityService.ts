import { apiRequest } from "@/src/api/client";
import { ENDPOINTS } from "@/src/api/endpoints";

export type ActiveFacilityFilters = {
  departmentId?: string;
  search?: string;
};

export type NearbyFacilityFilters = {
  latitude: number;
  longitude: number;
  radiusKm?: number;
  departmentId?: string;
  limit?: number;
};

export const DEFAULT_NEARBY_RADIUS_KM = 7;
export const NEARBY_FACILITY_LIMIT = 20;

export function buildNearbyFacilityQuery({ latitude, longitude, radiusKm = DEFAULT_NEARBY_RADIUS_KM, departmentId, limit = NEARBY_FACILITY_LIMIT }: NearbyFacilityFilters) {
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90
    || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    throw new Error("Vị trí chưa hợp lệ. Vui lòng định vị lại.");
  }
  if (!Number.isFinite(radiusKm) || radiusKm <= 0 || !Number.isInteger(limit) || limit < 1) {
    throw new Error("Bán kính hoặc số lượng kết quả chưa hợp lệ.");
  }
  const params = new URLSearchParams({ latitude: String(latitude), longitude: String(longitude), radiusKm: String(radiusKm), limit: String(limit) });
  if (departmentId) params.set("departmentId", departmentId);
  return params.toString();
}

export const medicalFacilitiesApi = {
  nearby(filters: NearbyFacilityFilters) {
    return apiRequest(`${ENDPOINTS.MEDICAL_FACILITIES.BASE}/nearby?${buildNearbyFacilityQuery(filters)}`);
  },

  active(filters: ActiveFacilityFilters = {}) {
    const search = new URLSearchParams();
    if (filters.departmentId) search.set("departmentId", filters.departmentId);
    if (filters.search) search.set("search", filters.search);
    const query = search.toString();

    return apiRequest(query ? `${ENDPOINTS.MEDICAL_FACILITIES.ACTIVE}?${query}` : ENDPOINTS.MEDICAL_FACILITIES.ACTIVE);
  },

  get(id: string) {
    return apiRequest(ENDPOINTS.MEDICAL_FACILITIES.BY_ID(id));
  },
};

export const facilityDepartmentsApi = {
  active() {
    return apiRequest(ENDPOINTS.FACILITY_DEPARTMENTS.ACTIVE);
  },
};

// Ported from src/services/facilityService.js and facilityDepartmentService.js
// (Web). NearbyClinicPage.jsx always calls active() with no filters (all
// department/search filtering happens client-side) — the service still
// accepts filters for parity/future use, matching Web's service signature.
import { apiRequest } from "@/src/api/client";
import { ENDPOINTS } from "@/src/api/endpoints";

export type ActiveFacilityFilters = {
  departmentId?: string;
  search?: string;
};

export const medicalFacilitiesApi = {
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

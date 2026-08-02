// Ported from src/services/doctorService.js (Web) — buildDoctorQuery +
// doctorManagementApi.list(). Only the filtered "management" list variant is
// needed here (facility-detail doctor teaser); full doctor browsing UI is
// Module 6.
import { apiRequest } from "@/src/api/client";
import { ENDPOINTS } from "@/src/api/endpoints";

export type DoctorQueryFilters = {
  pageNumber?: number;
  pageSize?: number;
  search?: string;
  facilityId?: string;
  departmentId?: string;
  isActive?: boolean | string;
  departmentRole?: string;
};

function buildDoctorQuery(filters: DoctorQueryFilters = {}) {
  const { pageNumber = 1, pageSize = 10, search = "", facilityId = "", departmentId = "", isActive = "", departmentRole = "" } = filters;
  const params = new URLSearchParams({ PageNumber: String(pageNumber), PageSize: String(pageSize) });
  if (search) params.set("search", search);
  if (facilityId) params.set("facilityId", facilityId);
  if (departmentId) params.set("departmentId", departmentId);
  if (isActive !== "") params.set("isActive", String(isActive));
  if (departmentRole) params.set("departmentRole", departmentRole);
  return params.toString();
}

export const doctorManagementApi = {
  list(filters: DoctorQueryFilters = {}) {
    return apiRequest(`${ENDPOINTS.DOCTORS.BASE}?${buildDoctorQuery(filters)}`);
  },
};

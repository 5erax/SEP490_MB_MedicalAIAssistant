import { apiRequest } from "@/src/api/client";
import { ENDPOINTS } from "@/src/api/endpoints";

export type AdminModuleKey = keyof typeof ENDPOINTS.ADMIN_MODULES;

export const adminService = {
  list(module: AdminModuleKey, pageNumber = 1, pageSize = 20, search = "") {
    const params = new URLSearchParams({ PageNumber: String(pageNumber), PageSize: String(pageSize) });
    if (search.trim()) params.set("search", search.trim());
    return apiRequest(`${ENDPOINTS.ADMIN_MODULES[module]}?${params}`, { requiresAuth: true });
  },
};

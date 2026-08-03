import { create, type AxiosRequestConfig } from "axios";

import { env } from "@/src/config/env";
import { ApiResponse } from "@/src/types/api";
import { getErrorMessage } from "@/src/utils/errors";
import { getStoredSession } from "@/src/services/sessionStorage";

export type ApiRequestConfig = AxiosRequestConfig & {
  requiresAuth?: boolean;
};

export class ApiError extends Error {
  status?: number;
  payload?: unknown;

  constructor(message: string, status?: number, payload?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

function formatApiErrors(errors: ApiResponse["errors"]) {
  if (!errors) return "";
  if (Array.isArray(errors)) return errors.filter(Boolean).join(", ");
  if (typeof errors === "string") return errors;

  return Object.values(errors)
    .flatMap((value) => (Array.isArray(value) ? value : [value]))
    .filter(Boolean)
    .join(", ");
}

export const apiClient = create({
  baseURL: env.apiBaseUrl,
  timeout: 30000,
  headers: {
    Accept: "application/json",
  },
});

apiClient.interceptors.request.use(async (config) => {
  const requestConfig = config as ApiRequestConfig;

  if (requestConfig.requiresAuth) {
    const session = await getStoredSession();
    if (session?.accessToken) {
      config.headers.Authorization = `Bearer ${session.accessToken}`;
    }
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    const payload = response.data as ApiResponse | undefined;
    if (payload?.success === false) {
      const details = formatApiErrors(payload.errors);
      const message =
        (payload.message && details ? `${payload.message}: ${details}` : payload.message) ||
        details ||
        payload.title ||
        "Yeu cau that bai.";
      throw new ApiError(message, response.status, payload);
    }

    return response;
  },
  (error) => {
    throw new ApiError(getErrorMessage(error), error.response?.status, error.response?.data);
  },
);

export async function apiRequest<T = unknown>(path: string, options: ApiRequestConfig = {}) {
  const { requiresAuth, ...axiosConfig } = options;
  const response = await apiClient.request<ApiResponse<T>>({
    url: path,
    requiresAuth,
    ...axiosConfig,
  } as ApiRequestConfig);

  return response.data;
}

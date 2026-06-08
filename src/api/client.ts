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
      throw new ApiError(payload.message || "Yeu cau that bai.", response.status, payload);
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

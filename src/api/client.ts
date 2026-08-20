import { create, type AxiosError, type AxiosRequestConfig } from "axios";

import { env } from "@/src/config/env";
import { ApiResponse } from "@/src/types/api";
import { AuthSession } from "@/src/types/auth";
import { getErrorMessage } from "@/src/utils/errors";
import {
  clearStoredSession,
  getStoredSession,
  setStoredSession,
} from "@/src/services/sessionStorage";
import { isExpiredToken } from "@/src/utils/jwt";

export type ApiRequestConfig = AxiosRequestConfig & {
  requiresAuth?: boolean;
  skipAuthRefresh?: boolean;
  authRetried?: boolean;
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
  withCredentials: true,
  headers: {
    Accept: "application/json",
  },
});

const refreshClient = create({
  baseURL: env.apiBaseUrl,
  timeout: 30000,
  withCredentials: true,
  headers: { Accept: "application/json" },
});

let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken() {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const current = await getStoredSession();
      const response = await refreshClient.post<ApiResponse<AuthSession>>(
        "/api/authentication/refresh",
      );
      const data = response.data?.data;
      const accessToken = typeof data?.accessToken === "string" ? data.accessToken : "";
      if (!accessToken) throw new Error("Backend không trả access token mới.");

      await setStoredSession({ ...(current ?? {}), ...data, accessToken });
      return accessToken;
    } catch (error) {
      await clearStoredSession();
      throw error;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

apiClient.interceptors.request.use(async (config) => {
  const requestConfig = config as ApiRequestConfig;

  if (requestConfig.requiresAuth) {
    const session = await getStoredSession();
    if (session?.accessToken) {
      const accessToken = isExpiredToken(session.accessToken)
        ? await refreshAccessToken()
        : session.accessToken;
      config.headers.Authorization = `Bearer ${accessToken}`;
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
  async (error: AxiosError) => {
    const requestConfig = error.config as ApiRequestConfig | undefined;
    if (
      error.response?.status === 401 &&
      requestConfig?.requiresAuth &&
      !requestConfig.authRetried &&
      !requestConfig.skipAuthRefresh
    ) {
      try {
        const accessToken = await refreshAccessToken();
        requestConfig.authRetried = true;
        requestConfig.headers = requestConfig.headers ?? {};
        requestConfig.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient.request(requestConfig);
      } catch {
        // Fall through to the normalized authentication error below.
      }
    }

    throw new ApiError(
      getErrorMessage(error),
      error.response?.status,
      error.response?.data,
    );
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

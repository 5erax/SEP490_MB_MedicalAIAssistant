import { apiRequest } from "@/src/api/client";
import { ENDPOINTS } from "@/src/api/endpoints";
import { ApiResponse } from "@/src/types/api";
import { AuthSession } from "@/src/types/auth";
import { UserProfile } from "@/src/types/user";

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = {
  email: string;
  userName: string;
  password: string;
  confirmPassword: string;
  displayName: string;
  address?: string;
  gender?: number;
  dateOfBirth?: string | null;
  otp: string;
};

// Ported 1:1 from src/services/authService.js (Web) — normalizeAuthResponse().
// Derives firstLogin/isFirstLogin/isProfileCompleted the same way; unlike
// Web this has no storage side effect — callers persist via useAuth().setSession.
export function normalizeAuthSession(response: ApiResponse<AuthSession>): AuthSession | null {
  const authData = response?.data;
  if (!authData?.accessToken) return null;

  const isProfileCompleted = authData.isProfileCompleted === true;
  const isFirstLogin = isProfileCompleted
    ? false
    : authData.firstLogin === true || authData.isFirstLogin === true;

  return {
    ...authData,
    firstLogin: isFirstLogin,
    isFirstLogin,
    isProfileCompleted,
  };
}

export const authService = {
  /**
   * Screen: LoginScreen
   * Workflow: Authentication
   * Endpoint: POST /api/authentication/login
   */
  login(payload: LoginPayload) {
    return apiRequest<AuthSession>(ENDPOINTS.AUTH.LOGIN, {
      method: "POST",
      data: payload,
    });
  },

  /**
   * Screen: RegisterScreen
   * Workflow: Authentication
   * Endpoint: POST /api/authentication/register
   */
  async register(payload: RegisterPayload) {
    await apiRequest<UserProfile>(ENDPOINTS.AUTH.REGISTER, {
      method: "POST",
      data: payload,
    });
    return authService.login({ email: payload.email, password: payload.password });
  },

  sendRegisterOtp(email: string) {
    return apiRequest(ENDPOINTS.AUTH.SEND_REGISTER_OTP, {
      method: "POST",
      data: { email },
    });
  },

  registerStaff(payload: RegisterPayload) {
    return apiRequest<AuthSession>(ENDPOINTS.AUTH.REGISTER_STAFF, {
      method: "POST",
      data: payload,
    });
  },

  /**
   * Screen: LoginScreen (Google button)
   * Workflow: Authentication
   * Endpoint: POST /api/authentication/google
   */
  googleLogin(credential: string) {
    return apiRequest<AuthSession>(ENDPOINTS.AUTH.GOOGLE, {
      method: "POST",
      data: { credential },
    });
  },

  refresh() {
    return apiRequest<AuthSession>(ENDPOINTS.AUTH.REFRESH, {
      method: "POST",
    });
  },

  logout() {
    return apiRequest(ENDPOINTS.AUTH.LOGOUT, {
      method: "POST",
      requiresAuth: true,
    });
  },

  forgotPassword(email: string) {
    return apiRequest(ENDPOINTS.AUTH.FORGOT_PASSWORD, {
      method: "POST",
      data: { email },
    });
  },

  changePassword(payload: {
    email: string;
    otp: string;
    newPassword: string;
    confirmNewPassword: string;
  }) {
    return apiRequest(ENDPOINTS.AUTH.CHANGE_PASSWORD, {
      method: "POST",
      data: payload,
    });
  },

  updatePassword(payload: { currentPassword: string; newPassword: string; confirmNewPassword: string }) {
    return apiRequest(ENDPOINTS.AUTH.UPDATE_PASSWORD, {
      method: "POST",
      data: payload,
      requiresAuth: true,
    });
  },

  me() {
    return apiRequest<UserProfile>(ENDPOINTS.USERS.ME, { requiresAuth: true });
  },

  updateUser(userId: string, payload: Partial<UserProfile>) {
    return apiRequest(ENDPOINTS.USERS.BY_ID(userId), {
      method: "PUT",
      data: payload,
      requiresAuth: true,
    });
  },
};

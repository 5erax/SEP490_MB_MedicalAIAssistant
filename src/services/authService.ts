import { apiRequest } from "@/src/api/client";
import { ENDPOINTS } from "@/src/api/endpoints";
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
};

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

  register(payload: RegisterPayload) {
    return apiRequest<AuthSession>(ENDPOINTS.AUTH.REGISTER, {
      method: "POST",
      data: payload,
    });
  },

  registerStaff(payload: RegisterPayload) {
    return apiRequest<AuthSession>(ENDPOINTS.AUTH.REGISTER_STAFF, {
      method: "POST",
      data: payload,
    });
  },

  googleLogin(credential: string) {
    return apiRequest<AuthSession>(ENDPOINTS.AUTH.GOOGLE, {
      method: "POST",
      data: { credential },
    });
  },

  refresh() {
    return apiRequest<AuthSession>(ENDPOINTS.AUTH.REFRESH, {
      method: "POST",
      requiresAuth: true,
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

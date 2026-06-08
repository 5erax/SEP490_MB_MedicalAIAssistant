export type UserRole = "guest" | "patient" | "staff" | "admin";

export type AuthSession = {
  accessToken: string;
  refreshToken?: string;
  tokenType?: string;
  expiresAt?: string;
  userId?: string;
  identityId?: string;
  email?: string;
  displayName?: string;
  name?: string;
  roles?: string[] | string;
  role?: string;
  isFirstLogin?: boolean;
  firstLogin?: boolean;
  isProfileCompleted?: boolean;
  isPremium?: boolean;
  isSubscribed?: boolean;
  hasPremiumAccess?: boolean;
  planName?: string;
  subscriptionPlan?: string;
  subscriptionStatus?: string;
  subscription?: {
    status?: string;
  };
  [key: string]: unknown;
};

export type AuthContextValue = {
  session: AuthSession | null;
  isAuthenticated: boolean;
  isRestoring: boolean;
  roles: string[];
  setSession: (session: AuthSession) => Promise<void>;
  updateSession: (patch: Partial<AuthSession>) => Promise<void>;
  clearSession: () => Promise<void>;
  restoreSession: () => Promise<void>;
};


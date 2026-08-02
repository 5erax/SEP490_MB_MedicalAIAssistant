export const DEFAULT_API_BASE_URL = "http://52.77.210.243:8080";

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

export const env = {
  apiBaseUrl: trimTrailingSlash(process.env.EXPO_PUBLIC_API_BASE_URL || DEFAULT_API_BASE_URL),
  appEnv: process.env.EXPO_PUBLIC_APP_ENV || "development",
  // Web Client ID from Google Cloud Console, required by
  // @react-native-google-signin for the idToken flow against our backend.
  // Left unset until the team registers Android/iOS OAuth clients.
  googleWebClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || "",
};

// Mirrors Web's isGoogleOAuthEnabledForCurrentOrigin() (src/services/googleOAuthConfig.js):
// Google Sign-In is feature-flagged by configuration presence rather than
// always-on, so the UI degrades gracefully when native OAuth clients aren't
// registered yet.
export function isGoogleAuthConfigured() {
  return Boolean(env.googleWebClientId);
}


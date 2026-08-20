// Never ship a real host as a fallback. Development can opt into an HTTP
// origin explicitly, while preview/production are rejected unless HTTPS.
export const DEFAULT_API_BASE_URL = "https://api.example.com";

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
  // Same unsigned Cloudinary upload preset Web's .env.production uses
  // (VITE_CLOUDINARY_*) — an unsigned preset is designed to be public/
  // client-exposed (restricted server-side by Cloudinary settings, not by
  // secrecy), so reusing the real values here (rather than leaving them
  // unset) is required for the review-photo upload feature to work at all.
  cloudinaryCloudName: process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME || "dnfcv21cy",
  cloudinaryUploadPreset: process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "medimate_unsigned",
  cloudinaryFolder: process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_FOLDER || "medical-facilities",
};

if (env.appEnv !== "development" && !env.apiBaseUrl.startsWith("https://")) {
  throw new Error("MediMate yêu cầu HTTPS cho API ở môi trường preview/production.");
}

// Mirrors Web's isGoogleOAuthEnabledForCurrentOrigin() (src/services/googleOAuthConfig.js):
// Google Sign-In is feature-flagged by configuration presence rather than
// always-on, so the UI degrades gracefully when native OAuth clients aren't
// registered yet.
export function isGoogleAuthConfigured() {
  return Boolean(env.googleWebClientId);
}


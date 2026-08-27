// Matches Web's real backend origin exactly (VITE_API_BASE_URL /
// API_BASE_URL in .env.development, .env.production and .env.example on
// Web — no port, defaults to :80). A previous version of this file used
// ":8080", which is not the backend's actual listening port (verified: the
// backend responds on plain :80 — e.g. GET /swagger/v1/swagger.json and
// POST /api/authentication/login both succeed there — while :8080 times
// out with no response at all). That mismatch is what produced the
// generic axios "Network Error" seen when testing Login/Register.
export const DEFAULT_API_BASE_URL = "http://52.77.210.243";
export const DEFAULT_GOOGLE_WEB_CLIENT_ID = "976426394148-eub0i02sbrseoob7r4lbe8ubr3bqv3n2.apps.googleusercontent.com";
export const DEFAULT_GOOGLE_ANDROID_CLIENT_ID = "976426394148-9n1brtej8v6105qr9h76bk1dv3put34s.apps.googleusercontent.com";

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

export const env = {
  apiBaseUrl: trimTrailingSlash(process.env.EXPO_PUBLIC_API_BASE_URL || DEFAULT_API_BASE_URL),
  appEnv: process.env.EXPO_PUBLIC_APP_ENV || "development",
  // Web Client ID from Google Cloud Console, required by
  // @react-native-google-signin for the idToken flow against our backend.
  // Android/iOS client IDs are preferred on native builds. googleWebClientId
  // remains useful for Expo Go/web and as the backend audience for id tokens.
  googleWebClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || DEFAULT_GOOGLE_WEB_CLIENT_ID,
  googleAndroidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || DEFAULT_GOOGLE_ANDROID_CLIENT_ID,
  googleIosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || "",
  // Same unsigned Cloudinary upload preset Web's .env.production uses
  // (VITE_CLOUDINARY_*) — an unsigned preset is designed to be public/
  // client-exposed (restricted server-side by Cloudinary settings, not by
  // secrecy), so reusing the real values here (rather than leaving them
  // unset) is required for the review-photo upload feature to work at all.
  cloudinaryCloudName: process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME || "dnfcv21cy",
  cloudinaryUploadPreset: process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "medimate_unsigned",
  cloudinaryFolder: process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_FOLDER || "medical-facilities",
};

// Mirrors Web's isGoogleOAuthEnabledForCurrentOrigin() (src/services/googleOAuthConfig.js):
// Google Sign-In is feature-flagged by configuration presence rather than
// always-on, so the UI degrades gracefully when native OAuth clients aren't
// registered yet.
export function isGoogleAuthConfigured() {
  return Boolean(env.googleWebClientId);
}


export const DEFAULT_API_BASE_URL = "http://52.77.210.243:8080";

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

export const env = {
  apiBaseUrl: trimTrailingSlash(process.env.EXPO_PUBLIC_API_BASE_URL || DEFAULT_API_BASE_URL),
  appEnv: process.env.EXPO_PUBLIC_APP_ENV || "development",
};


import Constants from "expo-constants";
import { Platform } from "react-native";

import { getOrCreatePushInstallationId } from "@/src/services/pushInstallationService";
import { pushDevicesApi } from "@/src/services/pushDeviceService";

export const PUSH_CHANNEL_ID = "medimate-notifications";

type NotificationsModule = typeof import("expo-notifications");
type DevicePushToken = import("expo-notifications").DevicePushToken;

let notificationsModule: NotificationsModule | null | undefined;
let notificationHandlerConfigured = false;

function logPushDebug(message: string, details?: unknown) {
  if (__DEV__) {
    console.info(`[Push] ${message}`, details ?? "");
  }
}

export function getNotificationsModule() {
  if (notificationsModule !== undefined) return notificationsModule;

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    notificationsModule = require("expo-notifications") as NotificationsModule;
  } catch {
    notificationsModule = null;
  }

  if (notificationsModule && !notificationHandlerConfigured) {
    notificationsModule.setNotificationHandler({
      handleNotification: async () => ({
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
    notificationHandlerConfigured = true;
  }

  return notificationsModule;
}

export async function ensureAndroidNotificationChannel() {
  const Notifications = getNotificationsModule();
  if (!Notifications) {
    logPushDebug("expo-notifications native module is unavailable.");
    return;
  }
  if (Platform.OS !== "android") return;

  await Notifications.setNotificationChannelAsync(PUSH_CHANNEL_ID, {
    name: "Thông báo MediMate AI",
    importance: Notifications.AndroidImportance.HIGH,
    sound: "default",
    vibrationPattern: [0, 250, 250, 250],
  });
  logPushDebug("Android notification channel is ready.", PUSH_CHANNEL_ID);
}

export async function ensureNotificationPermission() {
  const Notifications = getNotificationsModule();
  if (!Notifications) {
    logPushDebug("Cannot request permission because expo-notifications is unavailable.");
    return false;
  }

  const current = await Notifications.getPermissionsAsync();
  if (current.granted) {
    logPushDebug("Notification permission already granted.");
    return true;
  }

  const requested = await Notifications.requestPermissionsAsync();
  logPushDebug("Notification permission requested.", { granted: requested.granted, status: requested.status });
  return requested.granted;
}

export function getExpoProjectId() {
  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  if (typeof projectId !== "string" || !projectId) {
    throw new Error("Expo EAS projectId is missing.");
  }

  return projectId;
}

export async function getCurrentExpoPushToken(devicePushToken?: DevicePushToken) {
  const Notifications = getNotificationsModule();
  if (!Notifications) return null;

  await ensureAndroidNotificationChannel();

  const permissionGranted = await ensureNotificationPermission();
  if (!permissionGranted) return null;

  const token = await Notifications.getExpoPushTokenAsync({
    projectId: getExpoProjectId(),
    ...(devicePushToken ? { devicePushToken } : {}),
  });

  logPushDebug("Expo push token resolved.", {
    preview: `${token.data.slice(0, 22)}...`,
    projectId: getExpoProjectId(),
  });

  return token.data;
}

export async function registerCurrentPushDevice(devicePushToken?: DevicePushToken) {
  const expoPushToken = await getCurrentExpoPushToken(devicePushToken);
  if (!expoPushToken) return null;

  const installationId = await getOrCreatePushInstallationId();
  const platform = Platform.OS === "ios" ? "ios" : "android";
  const appVersion = Constants.expoConfig?.version ?? null;

  const response = await pushDevicesApi.register({
    installationId,
    expoPushToken,
    platform,
    appVersion,
  });

  logPushDebug("Push device registered with backend.", {
    installationId,
    platform,
    isActive: response.data?.isActive,
  });

  return response;
}

export type PushNotificationType =
  | "RecoveryPlanReady"
  | "RecoveryPlanCompleted"
  | "RecoveryPlanCancelled"
  | "MedicationReminder";

export type PushNotificationData = {
  notificationId?: string;
  type?: PushNotificationType | string;
  notificationType?: PushNotificationType | string;
  referenceType?: string;
  referenceId?: string;
};

export type RegisterPushDevicePayload = {
  installationId: string;
  expoPushToken: string;
  platform: "android" | "ios";
  appVersion?: string | null;
};

export type PushDeviceResponse = {
  id: string;
  installationId: string;
  platform: "android" | "ios";
  isActive: boolean;
  lastSeenAt: string;
};

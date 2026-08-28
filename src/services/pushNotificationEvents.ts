import { PushNotificationData } from "@/src/types/pushNotification";

type PushNotificationListener = (data: PushNotificationData) => void;

const listeners = new Set<PushNotificationListener>();

export function emitPushNotificationData(data: PushNotificationData) {
  listeners.forEach((listener) => listener(data));
}

export function subscribePushNotificationData(listener: PushNotificationListener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function isRecoveryPushNotification(data: PushNotificationData) {
  return (
    data.notificationType === "RecoveryPlanReady" ||
    data.notificationType === "RecoveryPlanCompleted" ||
    data.notificationType === "RecoveryPlanCancelled"
  );
}

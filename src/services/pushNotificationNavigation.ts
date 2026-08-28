import { ROUTES } from "@/src/navigation/routes";
import { PushNotificationData } from "@/src/types/pushNotification";

export function routeForPushNotification(data: PushNotificationData) {
  switch (data.notificationType) {
    case "RecoveryPlanReady":
    case "RecoveryPlanCompleted":
    case "RecoveryPlanCancelled":
      return {
        pathname: ROUTES.PATIENT.RECOVERY_PLAN,
        params: data.referenceId ? { planId: data.referenceId } : undefined,
      };
    case "MedicationReminder":
      return {
        pathname: ROUTES.PATIENT.MY_MEDICATIONS,
        params: undefined,
      };
    default:
      return null;
  }
}

import { ReactNode, useCallback, useEffect, useRef } from "react";
import { AppState } from "react-native";
import { router } from "expo-router";

import { ROUTES } from "@/src/navigation/routes";
import { useAuth } from "@/src/providers/AuthProvider";
import { PushNotificationData } from "@/src/types/pushNotification";
import { hasRole } from "@/src/utils/roles";
import { getNotificationsModule, registerCurrentPushDevice } from "@/src/services/pushNotificationService";
import { routeForPushNotification } from "@/src/services/pushNotificationNavigation";
import { emitPushNotificationData } from "@/src/services/pushNotificationEvents";

type PushNotificationProviderProps = {
  children: ReactNode;
};

type NotificationResponse = import("expo-notifications").NotificationResponse;
type Notification = import("expo-notifications").Notification;

function normalizeNotificationData(data: Record<string, unknown>): PushNotificationData {
  const notificationType =
    typeof data.notificationType === "string"
      ? data.notificationType
      : typeof data.type === "string"
        ? data.type
        : undefined;

  return {
    notificationId: typeof data.notificationId === "string" ? data.notificationId : undefined,
    type: typeof data.type === "string" ? data.type : undefined,
    notificationType,
    referenceType: typeof data.referenceType === "string" ? data.referenceType : undefined,
    referenceId: typeof data.referenceId === "string" ? data.referenceId : undefined,
  };
}

function readNotificationData(response: NotificationResponse): PushNotificationData {
  return normalizeNotificationData(response.notification.request.content.data ?? {});
}

function readReceivedNotificationData(notification: Notification): PushNotificationData {
  return normalizeNotificationData(notification.request.content.data ?? {});
}

export function PushNotificationProvider({ children }: PushNotificationProviderProps) {
  const { isAuthenticated, isRestoring, roles } = useAuth();
  const isPatient = hasRole(roles, "patient");
  const canUsePatientPush = isAuthenticated && isPatient;
  const handledResponseIdsRef = useRef<Set<string>>(new Set());

  const handleNotificationResponse = useCallback(
    async (response: NotificationResponse | null | undefined) => {
      const Notifications = getNotificationsModule();
      if (!Notifications) return;
      if (!response) return;
      if (response.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return;

      if (isRestoring) return;

      const responseId = response.notification.request.identifier;
      if (handledResponseIdsRef.current.has(responseId)) return;
      handledResponseIdsRef.current.add(responseId);

      const route = routeForPushNotification(readNotificationData(response));
      if (!route) {
        await Notifications.clearLastNotificationResponseAsync();
        return;
      }

      if (!canUsePatientPush) {
        router.replace(ROUTES.PUBLIC.LOGIN);
        await Notifications.clearLastNotificationResponseAsync();
        return;
      }

      router.push({
        pathname: route.pathname as never,
        params: route.params,
      });
      await Notifications.clearLastNotificationResponseAsync();
    },
    [canUsePatientPush, isRestoring],
  );

  const ensureRegistration = useCallback(async () => {
    if (!canUsePatientPush) return;

    try {
      await registerCurrentPushDevice();
    } catch (error) {
      if (__DEV__) {
        console.warn("[Push] Failed to register push device.", error);
      }
      // Push is best-effort and must never break the patient session.
    }
  }, [canUsePatientPush]);

  useEffect(() => {
    if (isRestoring) return;
    ensureRegistration();
  }, [ensureRegistration, isRestoring]);

  useEffect(() => {
    if (!canUsePatientPush) return;
    const Notifications = getNotificationsModule();
    if (!Notifications) return;

    const subscription = Notifications.addPushTokenListener(async (devicePushToken) => {
      try {
        await registerCurrentPushDevice(devicePushToken);
      } catch (error) {
        if (__DEV__) {
          console.warn("[Push] Failed to refresh rotated push token.", error);
        }
        // App-active registration will retry later.
      }
    });

    return () => subscription.remove();
  }, [canUsePatientPush]);

  useEffect(() => {
    if (!canUsePatientPush) return;

    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        ensureRegistration();
      }
    });

    return () => subscription.remove();
  }, [canUsePatientPush, ensureRegistration]);

  useEffect(() => {
    const Notifications = getNotificationsModule();
    if (!Notifications) return;

    const receivedSubscription = Notifications.addNotificationReceivedListener((notification) => {
      const data = readReceivedNotificationData(notification);
      if (__DEV__) {
        console.info("[Push] Notification received.", {
          notificationType: data.notificationType,
          referenceType: data.referenceType,
          referenceId: data.referenceId,
        });
      }
      emitPushNotificationData(data);
    });

    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      handleNotificationResponse(response);
    });

    return () => {
      receivedSubscription.remove();
      subscription.remove();
    };
  }, [handleNotificationResponse]);

  useEffect(() => {
    if (isRestoring) return;
    const Notifications = getNotificationsModule();
    if (!Notifications) return;

    Notifications.getLastNotificationResponseAsync()
      .then(handleNotificationResponse)
      .catch(() => undefined);
  }, [handleNotificationResponse, isRestoring]);

  return <>{children}</>;
}

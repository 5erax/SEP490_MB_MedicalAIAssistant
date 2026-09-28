// Native equivalent of Web's requestUserLocation() in DashboardPage.jsx
// (browser Geolocation API). Same status contract: idle -> loading ->
// ready | denied | unsupported.
import { useCallback, useRef, useState } from "react";
import { Platform } from "react-native";
import * as Location from "expo-location";

import { GeoPoint } from "@/src/utils/facilityRanking";

export type LocationStatus = "idle" | "loading" | "ready" | "denied" | "unsupported";

const LOCATION_TIMEOUT_MS = 12000;
const LAST_KNOWN_MAX_AGE_MS = 10 * 60 * 1000;
const CURRENT_LOCATION_MAX_AGE_MS = 2 * 60 * 1000;

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number) {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timeout = setTimeout(() => reject(new Error("Location timeout")), timeoutMs);
      }),
    ]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

function isFreshPosition(position: Location.LocationObject, maxAgeMs: number) {
  return Date.now() - position.timestamp <= maxAgeMs;
}

async function waitForFreshPosition(accuracy: Location.Accuracy) {
  let resolvedBeforeSubscription = false;
  let subscription: Location.LocationSubscription | undefined;

  const position = await withTimeout(
    new Promise<Location.LocationObject>((resolve, reject) => {
      Location.watchPositionAsync(
        { accuracy, distanceInterval: 0, timeInterval: 500 },
        (nextPosition) => {
          if (!isFreshPosition(nextPosition, CURRENT_LOCATION_MAX_AGE_MS)) return;
          if (subscription) subscription.remove();
          else resolvedBeforeSubscription = true;
          resolve(nextPosition);
        },
      ).then((nextSubscription) => {
        subscription = nextSubscription;
        if (resolvedBeforeSubscription) subscription.remove();
      }).catch(reject);
    }),
    LOCATION_TIMEOUT_MS,
  );

  subscription?.remove();
  return position;
}

async function readDevicePosition() {
  const accuracyAttempts = [Location.Accuracy.High, Location.Accuracy.Balanced, Location.Accuracy.Low];
  for (const accuracy of accuracyAttempts) {
    const position = await withTimeout(Location.getCurrentPositionAsync({ accuracy }), LOCATION_TIMEOUT_MS).catch(() => null);
    if (position && isFreshPosition(position, CURRENT_LOCATION_MAX_AGE_MS)) return position;

    const watchedPosition = await waitForFreshPosition(accuracy).catch(() => null);
    if (watchedPosition) return watchedPosition;
  }

  const lastKnown = await Location.getLastKnownPositionAsync({ maxAge: LAST_KNOWN_MAX_AGE_MS }).catch(() => null);
  if (lastKnown && Date.now() - lastKnown.timestamp <= LAST_KNOWN_MAX_AGE_MS) return lastKnown;
  throw new Error("Location unavailable");
}

export function useUserLocation() {
  const [userLocation, setUserLocation] = useState<GeoPoint | null>(null);
  const [locationStatus, setLocationStatus] = useState<LocationStatus>("idle");
  const requesting = useRef(false);

  const requestUserLocation = useCallback(async () => {
    if (requesting.current) return;
    requesting.current = true;
    setLocationStatus("loading");
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== Location.PermissionStatus.GRANTED) {
        setUserLocation(null);
        setLocationStatus("denied");
        return;
      }

      let servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled && Platform.OS === "android") {
        await Location.enableNetworkProviderAsync().catch(() => undefined);
        servicesEnabled = await Location.hasServicesEnabledAsync();
      }
      if (!servicesEnabled) {
        setUserLocation(null);
        setLocationStatus("unsupported");
        return;
      }

      const position = await readDevicePosition();
      setUserLocation({ latitude: position.coords.latitude, longitude: position.coords.longitude });
      setLocationStatus("ready");
    } catch {
      setUserLocation(null);
      setLocationStatus("unsupported");
    } finally {
      requesting.current = false;
    }
  }, []);

  return { userLocation, locationStatus, requestUserLocation };
}

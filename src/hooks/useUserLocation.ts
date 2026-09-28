// Native equivalent of Web's requestUserLocation() in DashboardPage.jsx
// (browser Geolocation API). Same status contract: idle -> loading ->
// ready | denied | unsupported.
import { useCallback, useRef, useState } from "react";
import { Platform } from "react-native";
import * as Location from "expo-location";

import { GeoPoint } from "@/src/utils/facilityRanking";

export type LocationStatus = "idle" | "loading" | "ready" | "denied" | "unsupported";

const LOCATION_TIMEOUT_MS = 5000;
const LAST_KNOWN_MAX_AGE_MS = 10 * 60 * 1000;
const MOCK_LOCATION_MAX_AGE_MS = 24 * 60 * 60 * 1000;
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

function hasUsableCoordinates(position: Location.LocationObject | null) {
  if (!position) return false;
  const { latitude, longitude } = position.coords;
  return Number.isFinite(latitude) && latitude >= -90 && latitude <= 90
    && Number.isFinite(longitude) && longitude >= -180 && longitude <= 180;
}

function isUsablePosition(position: Location.LocationObject | null, maxAgeMs: number) {
  return hasUsableCoordinates(position) && (position?.mocked || isFreshPosition(position as Location.LocationObject, maxAgeMs));
}

async function waitForFreshPosition(accuracy: Location.Accuracy) {
  let resolvedBeforeSubscription = false;
  let subscription: Location.LocationSubscription | undefined;

  const position = await withTimeout(
    new Promise<Location.LocationObject>((resolve, reject) => {
      Location.watchPositionAsync(
        { accuracy, distanceInterval: 0, timeInterval: 500 },
        (nextPosition) => {
          if (!isUsablePosition(nextPosition, CURRENT_LOCATION_MAX_AGE_MS)) return;
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
  const cached = await Location.getLastKnownPositionAsync({
    maxAge: MOCK_LOCATION_MAX_AGE_MS,
    requiredAccuracy: 100,
  }).catch(() => null);
  if (isUsablePosition(cached, LAST_KNOWN_MAX_AGE_MS)) return cached as Location.LocationObject;

  const accuracyAttempts = [Location.Accuracy.Balanced, Location.Accuracy.Low, Location.Accuracy.High];
  for (const accuracy of accuracyAttempts) {
    const position = await withTimeout(
      Location.getCurrentPositionAsync({ accuracy, mayShowUserSettingsDialog: false }),
      LOCATION_TIMEOUT_MS,
    ).catch(() => null);
    if (isUsablePosition(position, CURRENT_LOCATION_MAX_AGE_MS)) return position as Location.LocationObject;
  }

  const watchedPosition = await waitForFreshPosition(Location.Accuracy.Balanced).catch(() => null);
  if (isUsablePosition(watchedPosition, CURRENT_LOCATION_MAX_AGE_MS)) return watchedPosition as Location.LocationObject;

  const lastKnown = await Location.getLastKnownPositionAsync({ maxAge: LAST_KNOWN_MAX_AGE_MS, requiredAccuracy: 250 }).catch(() => null);
  if (isUsablePosition(lastKnown, LAST_KNOWN_MAX_AGE_MS)) return lastKnown as Location.LocationObject;
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

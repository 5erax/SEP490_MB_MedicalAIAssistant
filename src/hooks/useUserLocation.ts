// Native equivalent of Web's requestUserLocation() in DashboardPage.jsx
// (browser Geolocation API). Same status contract: idle -> loading ->
// ready | denied | unsupported.
import { useCallback, useRef, useState } from "react";
import * as Location from "expo-location";

import { GeoPoint } from "@/src/utils/facilityRanking";

export type LocationStatus = "idle" | "loading" | "ready" | "denied" | "unsupported";

export function useUserLocation() {
  const [userLocation, setUserLocation] = useState<GeoPoint | null>(null);
  const [locationStatus, setLocationStatus] = useState<LocationStatus>("idle");
  const requesting = useRef(false);

  const requestUserLocation = useCallback(async () => {
    if (requesting.current) return;
    requesting.current = true;
    setLocationStatus("loading");
    let timeout: ReturnType<typeof setTimeout> | undefined;
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== Location.PermissionStatus.GRANTED) {
        setUserLocation(null);
        setLocationStatus("denied");
        return;
      }

      const position = await Promise.race([
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
        new Promise<never>((_, reject) => { timeout = setTimeout(() => reject(new Error("Location timeout")), 20000); }),
      ]);
      setUserLocation({ latitude: position.coords.latitude, longitude: position.coords.longitude });
      setLocationStatus("ready");
    } catch {
      setUserLocation(null);
      setLocationStatus("unsupported");
    } finally {
      if (timeout) clearTimeout(timeout);
      requesting.current = false;
    }
  }, []);

  return { userLocation, locationStatus, requestUserLocation };
}

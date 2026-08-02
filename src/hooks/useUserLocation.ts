// Native equivalent of Web's requestUserLocation() in DashboardPage.jsx
// (browser Geolocation API). Same status contract: idle -> loading ->
// ready | denied | unsupported.
import { useCallback, useState } from "react";
import * as Location from "expo-location";

import { GeoPoint } from "@/src/utils/facilityRanking";

export type LocationStatus = "idle" | "loading" | "ready" | "denied" | "unsupported";

export function useUserLocation() {
  const [userLocation, setUserLocation] = useState<GeoPoint | null>(null);
  const [locationStatus, setLocationStatus] = useState<LocationStatus>("idle");

  const requestUserLocation = useCallback(async () => {
    setLocationStatus("loading");
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== Location.PermissionStatus.GRANTED) {
        setLocationStatus("denied");
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setUserLocation({ latitude: position.coords.latitude, longitude: position.coords.longitude });
      setLocationStatus("ready");
    } catch {
      setLocationStatus("unsupported");
    }
  }, []);

  return { userLocation, locationStatus, requestUserLocation };
}

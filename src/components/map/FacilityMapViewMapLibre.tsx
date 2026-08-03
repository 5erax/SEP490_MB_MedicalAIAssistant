// Native map for Nearby Clinics — @maplibre/maplibre-react-native, same free
// keyless CARTO Positron vector style Web uses (no Google/Mapbox API key
// required). Requires a custom dev client (expo prebuild / EAS build) —
// does not run in Expo Go (see FacilityMapView.native.tsx for the dispatcher
// that keeps this file's import out of the Expo Go bundle path entirely).
// API verified against the installed package's own TypeScript definitions
// (node_modules/@maplibre/maplibre-react-native), not just docs, since this
// component cannot be exercised in this sandbox.
import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { Camera, type CameraRef, Map, Marker, type MapRef } from "@maplibre/maplibre-react-native";

import { AppText, Button } from "@/src/components/ui";
import { colors, radius, spacing } from "@/src/theme/tokens";
import type { FacilityMapViewProps, MapLoadStatus } from "./FacilityMapView.types";

const FREE_MAP_STYLE = "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";
const MAP_LOAD_TIMEOUT_MS = 12_000;

export function FacilityMapViewMapLibre({
  facilities,
  selectedFacility,
  userLocation,
  onSelectFacility,
  onStatusChange,
  retryKey = 0,
}: FacilityMapViewProps) {
  const [status, setStatus] = useState<MapLoadStatus>("loading");
  const mapRef = useRef<MapRef>(null);
  const cameraRef = useRef<CameraRef>(null);

  const mappableFacilities = useMemo(() => facilities.filter((facility) => facility.hasValidCoordinates), [facilities]);

  function updateStatus(next: MapLoadStatus) {
    setStatus((current) => {
      if (current === "ready" && next === "error") return current;
      return next;
    });
  }

  useEffect(() => {
    setStatus("loading");
  }, [retryKey]);

  useEffect(() => {
    onStatusChange?.(status);
  }, [status, onStatusChange]);

  useEffect(() => {
    if (status !== "loading") return;
    const timer = setTimeout(() => updateStatus("error"), MAP_LOAD_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [status, retryKey]);

  useEffect(() => {
    if (status !== "ready") return;

    if (selectedFacility?.hasValidCoordinates && selectedFacility.longitude != null && selectedFacility.latitude != null) {
      cameraRef.current?.flyTo({
        center: [selectedFacility.longitude, selectedFacility.latitude],
        zoom: 16,
        duration: 800,
      });
      return;
    }

    if (mappableFacilities.length === 1) {
      const only = mappableFacilities[0];
      cameraRef.current?.flyTo({ center: [only.longitude as number, only.latitude as number], zoom: 14, duration: 800 });
      return;
    }

    if (mappableFacilities.length > 1) {
      const longitudes = mappableFacilities.map((facility) => facility.longitude as number);
      const latitudes = mappableFacilities.map((facility) => facility.latitude as number);
      cameraRef.current?.fitBounds(
        [Math.min(...longitudes), Math.min(...latitudes), Math.max(...longitudes), Math.max(...latitudes)],
        { padding: { top: 72, bottom: 72, left: 72, right: 72 }, duration: 800 },
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, selectedFacility?.facilityId]);

  if (status === "error") {
    return (
      <View style={styles.fallback}>
        <AppText variant="bodyStrong" center>
          Không thể hiển thị bản đồ lúc này
        </AppText>
        <AppText color={colors.muted} center>
          Danh sách cơ sở y tế vẫn dùng được trong lúc chờ.
        </AppText>
        <Button size="sm" onPress={() => updateStatus("loading")}>
          Thử lại
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <Map
        ref={mapRef}
        style={styles.map}
        mapStyle={FREE_MAP_STYLE}
        onDidFinishLoadingMap={() => updateStatus("ready")}
        onDidFailLoadingMap={() => updateStatus("error")}
        logo={false}
      >
        <Camera ref={cameraRef} initialViewState={{ center: [106.700424, 10.775658], zoom: 11 }} />

        {mappableFacilities.map((facility) => (
          <Marker
            key={facility.facilityId}
            id={facility.facilityId}
            lngLat={[facility.longitude as number, facility.latitude as number]}
            onPress={() => onSelectFacility(facility)}
          >
            <View style={[styles.pin, selectedFacility?.facilityId === facility.facilityId && styles.pinSelected]} />
          </Marker>
        ))}

        {userLocation ? (
          <Marker id="user-location" lngLat={[userLocation.longitude, userLocation.latitude]}>
            <View style={styles.userDot} />
          </Marker>
        ) : null}
      </Map>

      {status === "loading" ? (
        <View pointerEvents="none" style={styles.loadingOverlay}>
          <ActivityIndicator color={colors.teal} />
          <AppText variant="caption" color={colors.muted}>
            Đang tải bản đồ…
          </AppText>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  fallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.paperSoft,
    padding: spacing.xl,
  },
  loadingOverlay: {
    position: "absolute",
    top: spacing.lg,
    left: spacing.lg,
    right: spacing.lg,
    alignItems: "center",
    gap: spacing.xs,
    borderRadius: radius.md,
    backgroundColor: "rgba(255,255,255,0.92)",
    paddingVertical: spacing.md,
  },
  pin: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.white,
    backgroundColor: colors.limeDark,
  },
  pinSelected: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.danger,
  },
  userDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: colors.white,
    backgroundColor: colors.blue,
  },
});

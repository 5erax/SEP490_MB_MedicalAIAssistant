// Native map for Nearby Clinics — @maplibre/maplibre-react-native, same free
// keyless CARTO Positron vector style Web uses (no Google/Mapbox API key
// required). Requires a custom dev client (expo prebuild / EAS build) —
// does not run in Expo Go (see FacilityMapView.native.tsx for the dispatcher
// that keeps this file's import out of the Expo Go bundle path entirely).
// API verified against the installed package's own TypeScript definitions
// (node_modules/@maplibre/maplibre-react-native), not just docs, since this
// component cannot be exercised in this sandbox.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import {
  Camera,
  type CameraRef,
  GeoJSONSource,
  type GeoJSONSourceRef,
  Layer,
  Map,
  Marker,
  type MapRef,
} from "@maplibre/maplibre-react-native";

import { AppText, Button } from "@/src/components/ui";
import { colors, radius, spacing } from "@/src/theme/tokens";
import type { FacilityMapViewProps, MapLoadStatus } from "./FacilityMapView.types";

const WEB_ALIGNED_MAP_STYLE = "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";
const MAP_STYLE = process.env.EXPO_PUBLIC_MAP_STYLE_URL ?? WEB_ALIGNED_MAP_STYLE;
const MAP_LOAD_TIMEOUT_MS = 12_000;
const MIN_ZOOM = 9;
const MAX_ZOOM = 18;
const CLUSTER_MAX_ZOOM = 14;
const CAMERA_ANIMATION_MS = 420;
const MAP_BOUNDS: [number, number, number, number] = [106.3, 10.35, 107.15, 11.15];
const DEFAULT_CENTER: [number, number] = [106.700424, 10.775658];

type FacilityFeatureProperties = {
  facilityId: string;
  title: string;
  typeLabel: string;
  selected: boolean;
};

type FacilityFeature = GeoJSON.Feature<GeoJSON.Point, FacilityFeatureProperties>;
type FacilityFeatureCollection = GeoJSON.FeatureCollection<GeoJSON.Point, FacilityFeatureProperties>;

function isFacilityFeature(feature: GeoJSON.Feature): feature is FacilityFeature {
  return feature.geometry?.type === "Point" && typeof feature.properties?.facilityId === "string";
}

function getFeatureCoordinates(feature: GeoJSON.Feature) {
  return feature.geometry?.type === "Point" ? feature.geometry.coordinates : null;
}

export function FacilityMapViewMapLibre({
  facilities,
  selectedFacility,
  userLocation,
  onSelectFacility,
  onStatusChange,
  retryKey = 0,
  zoomResetKey = 0,
}: FacilityMapViewProps) {
  const [status, setStatus] = useState<MapLoadStatus>("loading");
  const mapRef = useRef<MapRef>(null);
  const cameraRef = useRef<CameraRef>(null);
  const facilitySourceRef = useRef<GeoJSONSourceRef>(null);

  const mappableFacilities = useMemo(() => facilities.filter((facility) => facility.hasValidCoordinates), [facilities]);

  const facilitiesById = useMemo(() => {
    const next = new globalThis.Map<string, (typeof mappableFacilities)[number]>();
    mappableFacilities.forEach((facility) => next.set(facility.facilityId, facility));
    return next;
  }, [mappableFacilities]);

  const facilityFeatureCollection = useMemo<FacilityFeatureCollection>(
    () => ({
      type: "FeatureCollection",
      features: mappableFacilities.map(
        (facility): FacilityFeature => ({
          type: "Feature",
          id: facility.facilityId,
          geometry: {
            type: "Point",
            coordinates: [facility.longitude as number, facility.latitude as number],
          },
          properties: {
            facilityId: facility.facilityId,
            title: facility.facilityName,
            typeLabel: facility.facilityTypeLabel || facility.facilityType || "Cơ sở y tế",
            selected: selectedFacility?.facilityId === facility.facilityId,
          },
        }),
      ),
    }),
    [mappableFacilities, selectedFacility?.facilityId],
  );

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

  const focusVisibleFacilities = useCallback((duration = 800) => {
    if (selectedFacility?.hasValidCoordinates && selectedFacility.longitude != null && selectedFacility.latitude != null) {
      cameraRef.current?.flyTo({
        center: [selectedFacility.longitude, selectedFacility.latitude],
        zoom: 16,
        duration,
      });
      return;
    }

    if (mappableFacilities.length === 1) {
      const only = mappableFacilities[0];
      cameraRef.current?.flyTo({ center: [only.longitude as number, only.latitude as number], zoom: 14, duration });
      return;
    }

    if (mappableFacilities.length > 1) {
      const longitudes = mappableFacilities.map((facility) => facility.longitude as number);
      const latitudes = mappableFacilities.map((facility) => facility.latitude as number);
      cameraRef.current?.fitBounds(
        [Math.min(...longitudes), Math.min(...latitudes), Math.max(...longitudes), Math.max(...latitudes)],
        { padding: { top: 112, bottom: 112, left: 72, right: 72 }, duration },
      );
    }
  }, [mappableFacilities, selectedFacility]);

  useEffect(() => {
    if (status !== "ready") return;
    focusVisibleFacilities(800);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, selectedFacility?.facilityId]);

  useEffect(() => {
    if (status !== "ready" || zoomResetKey === 0) return;
    focusVisibleFacilities(520);
  }, [focusVisibleFacilities, status, zoomResetKey]);

  const handleFacilitySourcePress = useCallback(
    async (event: { nativeEvent?: { features?: GeoJSON.Feature[] }; stopPropagation?: () => void }) => {
      event.stopPropagation?.();
      const feature = event.nativeEvent?.features?.[0];
      if (!feature) return;

      const coordinates = getFeatureCoordinates(feature);
      if (!coordinates) return;

      const clusterId = feature.properties?.cluster_id;
      if (typeof clusterId === "number") {
        const expansionZoom = await facilitySourceRef.current?.getClusterExpansionZoom(clusterId);
        cameraRef.current?.easeTo({
          center: coordinates as [number, number],
          zoom: Math.min(expansionZoom ?? CLUSTER_MAX_ZOOM + 1, MAX_ZOOM),
          duration: CAMERA_ANIMATION_MS,
          easing: "ease",
        });
        return;
      }

      if (!isFacilityFeature(feature)) return;
      const facility = facilitiesById.get(feature.properties.facilityId);
      if (facility) {
        onSelectFacility(facility);
        cameraRef.current?.easeTo({
          center: coordinates as [number, number],
          zoom: 16,
          duration: CAMERA_ANIMATION_MS,
          easing: "ease",
        });
      }
    },
    [facilitiesById, onSelectFacility],
  );

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
        mapStyle={MAP_STYLE}
        onDidFinishLoadingMap={() => updateStatus("ready")}
        onDidFailLoadingMap={() => updateStatus("error")}
        preferredFramesPerSecond={60}
        androidView="surface"
        dragPan
        touchZoom
        doubleTapZoom
        doubleTapHoldZoom
        touchRotate
        touchPitch={false}
        compass
        scaleBar={false}
        attribution
        logo={false}
      >
        <Camera
          ref={cameraRef}
          initialViewState={{ center: DEFAULT_CENTER, zoom: 11, bearing: 0, pitch: 0 }}
          minZoom={MIN_ZOOM}
          maxZoom={MAX_ZOOM}
          maxBounds={MAP_BOUNDS}
        />

        <GeoJSONSource
          id="facility-points"
          ref={facilitySourceRef}
          data={facilityFeatureCollection}
          cluster
          clusterRadius={46}
          clusterMaxZoom={CLUSTER_MAX_ZOOM}
          clusterMinPoints={3}
          maxzoom={MAX_ZOOM}
          buffer={96}
          tolerance={0.4}
          onPress={handleFacilitySourcePress}
        >
          <Layer
            id="facility-cluster-halo"
            type="circle"
            filter={["has", "point_count"]}
            paint={{
              "circle-color": "rgba(8,127,140,0.18)",
              "circle-radius": ["step", ["get", "point_count"], 22, 10, 27, 25, 33],
              "circle-stroke-color": colors.white,
              "circle-stroke-width": 2,
            }}
          />
          <Layer
            id="facility-cluster-dot"
            type="circle"
            filter={["has", "point_count"]}
            paint={{
              "circle-color": colors.teal,
              "circle-radius": ["step", ["get", "point_count"], 15, 10, 18, 25, 22],
              "circle-stroke-color": colors.white,
              "circle-stroke-width": 2,
            }}
          />
          <Layer
            id="facility-cluster-label"
            type="symbol"
            filter={["has", "point_count"]}
            layout={{
              "text-field": ["get", "point_count_abbreviated"],
              "text-size": 12,
              "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
              "text-allow-overlap": true,
              "text-ignore-placement": true,
            }}
            paint={{
              "text-color": colors.white,
            }}
          />
          <Layer
            id="facility-point-halo"
            type="circle"
            filter={["!", ["has", "point_count"]]}
            paint={{
              "circle-color": ["case", ["get", "selected"], "rgba(180,35,24,0.2)", "rgba(8,127,140,0.14)"],
              "circle-radius": ["case", ["get", "selected"], 19, 13],
              "circle-stroke-color": colors.white,
              "circle-stroke-width": 1,
            }}
          />
          <Layer
            id="facility-point-dot"
            type="circle"
            filter={["!", ["has", "point_count"]]}
            paint={{
              "circle-color": ["case", ["get", "selected"], colors.danger, colors.teal],
              "circle-radius": ["case", ["get", "selected"], 10, 7],
              "circle-stroke-color": colors.white,
              "circle-stroke-width": 2,
            }}
          />
          <Layer
            id="facility-point-label"
            type="symbol"
            minzoom={14}
            filter={["!", ["has", "point_count"]]}
            layout={{
              "text-field": ["get", "title"],
              "text-size": 11,
              "text-font": ["Open Sans Semibold", "Arial Unicode MS Regular"],
              "text-offset": [0, 1.45],
              "text-anchor": "top",
              "text-max-width": 9,
              "text-optional": true,
              "text-padding": 4,
            }}
            paint={{
              "text-color": colors.ink,
              "text-halo-color": colors.white,
              "text-halo-width": 1.4,
            }}
          />
        </GeoJSONSource>

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
    backgroundColor: colors.teal,
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

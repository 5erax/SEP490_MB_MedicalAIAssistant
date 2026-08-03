// Expo Go cannot load @maplibre/maplibre-react-native's native module, so this
// renders an interactive coordinate map with SVG. It keeps the user workflow
// usable in Expo Go while the real MapLibre map still renders in a dev build.
import { memo, useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Svg, { Line, Path, Rect } from "react-native-svg";
import { Maximize2 } from "lucide-react-native";

import { AppText } from "@/src/components/ui";
import { colors, radius, spacing } from "@/src/theme/tokens";
import type { FacilityMapViewProps } from "./FacilityMapView.types";

type LayoutSize = {
  width: number;
  height: number;
};

type ProjectedFacility = {
  id: string;
  label: string;
  x: number;
  y: number;
  facility: FacilityMapViewProps["facilities"][number];
};

const HCM_BOUNDS = {
  minLon: 106.55,
  maxLon: 106.9,
  minLat: 10.68,
  maxLat: 10.88,
};

const MIN_SPAN = 0.015;
const MAP_PADDING = 28;

function getNumber(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function createBounds(points: { longitude: number; latitude: number }[]) {
  if (points.length === 0) return HCM_BOUNDS;

  const longitudes = points.map((point) => point.longitude);
  const latitudes = points.map((point) => point.latitude);
  const minLon = Math.min(...longitudes);
  const maxLon = Math.max(...longitudes);
  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const lonSpan = Math.max(maxLon - minLon, MIN_SPAN);
  const latSpan = Math.max(maxLat - minLat, MIN_SPAN);

  return {
    minLon: minLon - lonSpan * 0.18,
    maxLon: maxLon + lonSpan * 0.18,
    minLat: minLat - latSpan * 0.18,
    maxLat: maxLat + latSpan * 0.18,
  };
}

function projectPoint(
  longitude: number,
  latitude: number,
  bounds: typeof HCM_BOUNDS,
  layout: LayoutSize,
) {
  const width = Math.max(layout.width, 1);
  const height = Math.max(layout.height, 1);
  const drawableWidth = Math.max(width - MAP_PADDING * 2, 1);
  const drawableHeight = Math.max(height - MAP_PADDING * 2, 1);
  const x = MAP_PADDING + ((longitude - bounds.minLon) / (bounds.maxLon - bounds.minLon)) * drawableWidth;
  const y = MAP_PADDING + ((bounds.maxLat - latitude) / (bounds.maxLat - bounds.minLat)) * drawableHeight;

  return {
    x: Math.max(MAP_PADDING * 0.7, Math.min(width - MAP_PADDING * 0.7, x)),
    y: Math.max(MAP_PADDING * 0.7, Math.min(height - MAP_PADDING * 0.7, y)),
  };
}

function StaticMapBackground({ width, height }: LayoutSize) {
  return (
    <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
      <Rect width={width} height={height} fill="#eef4f5" />
      <Path
        d={`M ${width * 0.62} 0 C ${width * 0.58} ${height * 0.28}, ${width * 0.72} ${height * 0.48}, ${width * 0.66} ${height}`}
        stroke="#cce3e8"
        strokeWidth={36}
        strokeLinecap="round"
        fill="none"
      />
      <Line x1={-20} y1={height * 0.28} x2={width + 20} y2={height * 0.1} stroke="#ffffff" strokeWidth={9} />
      <Line x1={-20} y1={height * 0.58} x2={width + 20} y2={height * 0.45} stroke="#ffffff" strokeWidth={8} />
      <Line x1={width * 0.18} y1={-20} x2={width * 0.34} y2={height + 20} stroke="#ffffff" strokeWidth={8} />
      <Line x1={width * 0.78} y1={-20} x2={width * 0.54} y2={height + 20} stroke="#ffffff" strokeWidth={7} />
      <Line x1={-20} y1={height * 0.8} x2={width + 20} y2={height * 0.72} stroke="#dde8e5" strokeWidth={4} />
      <Line x1={width * 0.44} y1={-20} x2={width * 0.52} y2={height + 20} stroke="#dde8e5" strokeWidth={4} />
    </Svg>
  );
}

const MemoizedMapBackground = memo(StaticMapBackground);

export function FacilityMapViewFallback({
  facilities,
  selectedFacility,
  userLocation,
  onSelectFacility,
  onStatusChange,
}: FacilityMapViewProps) {
  const [layout, setLayout] = useState<LayoutSize>({ width: 0, height: 0 });

  const mappableFacilities = useMemo(
    () =>
      facilities.filter((facility) => getNumber(facility.longitude) != null && getNumber(facility.latitude) != null),
    [facilities],
  );

  const bounds = useMemo(() => {
    const facilityPoints = mappableFacilities.map((facility) => ({
      longitude: facility.longitude as number,
      latitude: facility.latitude as number,
    }));
    const points = userLocation ? [...facilityPoints, userLocation] : facilityPoints;
    return createBounds(points);
  }, [mappableFacilities, userLocation]);

  useEffect(() => {
    onStatusChange?.(mappableFacilities.length > 0 ? "ready" : "error");
  }, [mappableFacilities.length, onStatusChange]);

  const projectedFacilities = useMemo<ProjectedFacility[]>(() => {
    if (layout.width <= 0 || layout.height <= 0) return [];

    return mappableFacilities.map((facility) => {
      const point = projectPoint(facility.longitude as number, facility.latitude as number, bounds, layout);
      return {
        id: facility.facilityId,
        label: facility.facilityName,
        x: point.x,
        y: point.y,
        facility,
      };
    });
  }, [bounds, layout, mappableFacilities]);

  const projectedUserLocation = useMemo(() => {
    if (!userLocation || layout.width <= 0 || layout.height <= 0) return null;
    return projectPoint(userLocation.longitude, userLocation.latitude, bounds, layout);
  }, [bounds, layout, userLocation]);

  return (
    <View
      style={styles.root}
      onLayout={(event) => {
        const { width, height } = event.nativeEvent.layout;
        setLayout((current) => (current.width === width && current.height === height ? current : { width, height }));
      }}
    >
      {layout.width > 0 && layout.height > 0 ? (
        <>
          <MemoizedMapBackground width={layout.width} height={layout.height} />
          {projectedFacilities.map((item, index) => {
            const selected = selectedFacility?.facilityId === item.id;
            return (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                accessibilityLabel={item.label}
                onPress={() => onSelectFacility(item.facility)}
                hitSlop={8}
                style={[
                  styles.pinHitbox,
                  { left: item.x - 18, top: item.y - 18 },
                  selected && styles.pinHitboxSelected,
                ]}
              >
                <View style={[styles.pinHalo, selected && styles.pinHaloSelected]} />
                <View style={[styles.pin, selected && styles.pinSelected]}>
                  {index < 9 && !selected ? (
                    <AppText variant="caption" color={colors.white} style={styles.pinIndex}>
                      {index + 1}
                    </AppText>
                  ) : null}
                </View>
              </Pressable>
            );
          })}
          {selectedFacility ? (
            <View style={styles.selectedLabel} pointerEvents="none">
              <AppText variant="caption" color={colors.ink} numberOfLines={1}>
                {selectedFacility.facilityName}
              </AppText>
            </View>
          ) : null}
          {projectedUserLocation ? (
            <View
              pointerEvents="none"
              style={[styles.userMarker, { left: projectedUserLocation.x - 10, top: projectedUserLocation.y - 10 }]}
            >
              <View style={styles.userDot} />
            </View>
          ) : null}
        </>
      ) : null}

      <View pointerEvents="none" style={styles.badge}>
        <Maximize2 size={14} color={colors.teal} />
        <AppText variant="caption" color={colors.teal}>
          Bản đồ Expo Go
        </AppText>
      </View>

      {mappableFacilities.length === 0 ? (
        <View style={styles.emptyOverlay}>
          <AppText variant="bodyStrong" center>
            Chưa có tọa độ hợp lệ
          </AppText>
          <AppText color={colors.muted} center>
            Danh sách cơ sở y tế bên dưới vẫn dùng được.
          </AppText>
        </View>
      ) : null}

      <View style={styles.quickPins}>
        {mappableFacilities.slice(0, 4).map((facility, index) => (
          <Pressable
            key={facility.facilityId}
            accessibilityRole="button"
            onPress={() => onSelectFacility(facility)}
            style={[styles.quickPin, selectedFacility?.facilityId === facility.facilityId && styles.quickPinSelected]}
          >
            <AppText variant="caption" color={selectedFacility?.facilityId === facility.facilityId ? colors.white : colors.teal}>
              {index + 1}
            </AppText>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    overflow: "hidden",
    backgroundColor: "#eef4f5",
  },
  badge: {
    position: "absolute",
    top: spacing.md,
    left: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: "rgba(8,127,140,0.18)",
    borderRadius: radius.pill,
    backgroundColor: "rgba(255,255,255,0.92)",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  emptyOverlay: {
    position: "absolute",
    inset: spacing.xl,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: "rgba(255,255,255,0.86)",
    padding: spacing.xl,
  },
  pinHitbox: {
    position: "absolute",
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  pinHitboxSelected: {
    zIndex: 3,
  },
  pinHalo: {
    position: "absolute",
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(8,127,140,0.14)",
  },
  pinHaloSelected: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(180,35,24,0.14)",
  },
  pin: {
    width: 17,
    height: 17,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.white,
    borderRadius: 9,
    backgroundColor: colors.teal,
  },
  pinSelected: {
    width: 23,
    height: 23,
    borderRadius: 12,
    backgroundColor: colors.danger,
  },
  pinIndex: {
    fontSize: 8,
    lineHeight: 10,
  },
  selectedLabel: {
    position: "absolute",
    left: spacing.md,
    right: spacing.md,
    bottom: spacing["4xl"] + spacing.md,
    borderWidth: 1,
    borderColor: "rgba(17,20,18,0.12)",
    borderRadius: radius.sm,
    backgroundColor: "rgba(255,255,255,0.94)",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  userMarker: {
    position: "absolute",
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    backgroundColor: "rgba(29,78,216,0.14)",
  },
  userDot: {
    width: 12,
    height: 12,
    borderWidth: 2,
    borderColor: colors.white,
    borderRadius: 6,
    backgroundColor: colors.blue,
  },
  quickPins: {
    position: "absolute",
    right: spacing.md,
    bottom: spacing.md,
    flexDirection: "row",
    gap: spacing.xs,
  },
  quickPin: {
    minWidth: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(8,127,140,0.28)",
    borderRadius: radius.pill,
    backgroundColor: "rgba(255,255,255,0.92)",
  },
  quickPinSelected: {
    borderColor: colors.teal,
    backgroundColor: colors.teal,
  },
});

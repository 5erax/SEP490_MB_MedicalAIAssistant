// Expo Go cannot load @maplibre/maplibre-react-native's native module, so this
// renders an interactive coordinate map with SVG. It keeps the user workflow
// usable in Expo Go while the real MapLibre map still renders in a dev build.
import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Svg, { Circle, G, Line, Path, Rect, Text as SvgText } from "react-native-svg";
import { Maximize2 } from "lucide-react-native";

import { AppText } from "@/src/components/ui";
import { colors, radius, spacing } from "@/src/theme/tokens";
import type { FacilityMapViewProps } from "./FacilityMapView.types";

type LayoutSize = {
  width: number;
  height: number;
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

  function project(longitude: number, latitude: number) {
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

  return (
    <View
      style={styles.root}
      onLayout={(event) => {
        const { width, height } = event.nativeEvent.layout;
        setLayout({ width, height });
      }}
    >
      {layout.width > 0 && layout.height > 0 ? (
        <Svg width={layout.width} height={layout.height} style={StyleSheet.absoluteFill}>
          <Rect width={layout.width} height={layout.height} fill="#eef4f5" />
          <Path
            d={`M ${layout.width * 0.62} 0 C ${layout.width * 0.58} ${layout.height * 0.28}, ${layout.width * 0.72} ${layout.height * 0.48}, ${layout.width * 0.66} ${layout.height}`}
            stroke="#cce3e8"
            strokeWidth={42}
            strokeLinecap="round"
            fill="none"
          />
          <Line x1={-20} y1={layout.height * 0.28} x2={layout.width + 20} y2={layout.height * 0.1} stroke="#ffffff" strokeWidth={12} />
          <Line x1={-20} y1={layout.height * 0.58} x2={layout.width + 20} y2={layout.height * 0.45} stroke="#ffffff" strokeWidth={10} />
          <Line x1={layout.width * 0.18} y1={-20} x2={layout.width * 0.34} y2={layout.height + 20} stroke="#ffffff" strokeWidth={10} />
          <Line x1={layout.width * 0.78} y1={-20} x2={layout.width * 0.54} y2={layout.height + 20} stroke="#ffffff" strokeWidth={9} />
          <Line x1={-20} y1={layout.height * 0.8} x2={layout.width + 20} y2={layout.height * 0.72} stroke="#dde8e5" strokeWidth={5} />
          <Line x1={layout.width * 0.44} y1={-20} x2={layout.width * 0.52} y2={layout.height + 20} stroke="#dde8e5" strokeWidth={5} />

          {mappableFacilities.map((facility, index) => {
            const point = project(facility.longitude as number, facility.latitude as number);
            const selected = selectedFacility?.facilityId === facility.facilityId;
            const radiusSize = selected ? 11 : 8;

            return (
              <G key={facility.facilityId} onPress={() => onSelectFacility(facility)}>
                <Circle cx={point.x} cy={point.y} r={radiusSize + 5} fill="rgba(8,127,140,0.14)" />
                <Circle cx={point.x} cy={point.y} r={radiusSize} fill={selected ? colors.danger : colors.teal} stroke={colors.white} strokeWidth={3} />
                {selected ? (
                  <SvgText x={point.x + 14} y={point.y - 12} fill={colors.ink} fontSize="11" fontWeight="700">
                    {facility.facilityName.slice(0, 24)}
                  </SvgText>
                ) : index < 8 ? (
                  <SvgText x={point.x + 11} y={point.y - 9} fill="rgba(17,20,18,0.58)" fontSize="9" fontWeight="700">
                    {index + 1}
                  </SvgText>
                ) : null}
              </G>
            );
          })}

          {userLocation ? (
            <G>
              {(() => {
                const point = project(userLocation.longitude, userLocation.latitude);
                return (
                  <>
                    <Circle cx={point.x} cy={point.y} r={14} fill="rgba(29,78,216,0.14)" />
                    <Circle cx={point.x} cy={point.y} r={7} fill={colors.blue} stroke={colors.white} strokeWidth={3} />
                  </>
                );
              })()}
            </G>
          ) : null}
        </Svg>
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

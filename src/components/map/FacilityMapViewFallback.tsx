// Expo Go cannot load @maplibre/maplibre-react-native, so this is a fast
// interactive map fallback. Pan/zoom run on the UI thread via Reanimated,
// markers are memoized, and nearby facilities are clustered before render.
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import Svg, { Line, Path, Rect } from "react-native-svg";
import { Layers3, Maximize2, Minus, Plus } from "lucide-react-native";

import { AppText } from "@/src/components/ui";
import { colors, radius, spacing } from "@/src/theme/tokens";
import type { FacilityMapViewProps } from "./FacilityMapView.types";

type Facility = FacilityMapViewProps["facilities"][number];

type LayoutSize = {
  width: number;
  height: number;
};

type Bounds = {
  minLon: number;
  maxLon: number;
  minLat: number;
  maxLat: number;
};

type ProjectedFacility = {
  id: string;
  label: string;
  x: number;
  y: number;
  facility: Facility;
};

type MarkerItem =
  | {
      type: "facility";
      id: string;
      x: number;
      y: number;
      index: number;
      facility: Facility;
    }
  | {
      type: "cluster";
      id: string;
      x: number;
      y: number;
      count: number;
      facility: Facility;
    };

const HCM_BOUNDS: Bounds = {
  minLon: 106.55,
  maxLon: 106.9,
  minLat: 10.68,
  maxLat: 10.88,
};

const MIN_SPAN = 0.015;
const MAP_PADDING = 28;
const CLUSTER_DISTANCE = 34;
const MIN_SCALE = 1;
const MAX_SCALE = 4;

function clamp(value: number, min: number, max: number) {
  "worklet";
  return Math.min(Math.max(value, min), max);
}

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

function projectPoint(longitude: number, latitude: number, bounds: Bounds, layout: LayoutSize) {
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

function clusterFacilities(points: ProjectedFacility[]) {
  const buckets = new Map<string, ProjectedFacility[]>();

  points.forEach((point) => {
    const key = `${Math.round(point.x / CLUSTER_DISTANCE)}:${Math.round(point.y / CLUSTER_DISTANCE)}`;
    const bucket = buckets.get(key);
    if (bucket) {
      bucket.push(point);
    } else {
      buckets.set(key, [point]);
    }
  });

  return Array.from(buckets.entries()).map(([key, bucket], clusterIndex): MarkerItem => {
    if (bucket.length === 1) {
      const point = bucket[0];
      return {
        type: "facility",
        id: point.id,
        x: point.x,
        y: point.y,
        index: clusterIndex,
        facility: point.facility,
      };
    }

    const x = bucket.reduce((sum, point) => sum + point.x, 0) / bucket.length;
    const y = bucket.reduce((sum, point) => sum + point.y, 0) / bucket.length;
    return {
      type: "cluster",
      id: `cluster-${key}`,
      x,
      y,
      count: bucket.length,
      facility: bucket[0].facility,
    };
  });
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

type MarkerProps = {
  item: MarkerItem;
  selected: boolean;
  onSelectFacility: (facility: Facility) => void;
};

const MapMarker = memo(
  function MapMarker({ item, selected, onSelectFacility }: MarkerProps) {
    const handlePress = useCallback(() => onSelectFacility(item.facility), [item.facility, onSelectFacility]);
    const isCluster = item.type === "cluster";

    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={isCluster ? `${item.count} cơ sở y tế` : item.facility.facilityName}
        onPress={handlePress}
        hitSlop={8}
        style={[
          styles.pinHitbox,
          { left: item.x - 18, top: item.y - 18 },
          selected && styles.pinHitboxSelected,
        ]}
      >
        <View style={[styles.pinHalo, selected && styles.pinHaloSelected, isCluster && styles.clusterHalo]} />
        <View style={[styles.pin, selected && styles.pinSelected, isCluster && styles.clusterPin]}>
          <AppText variant="caption" color={colors.white} style={styles.pinIndex}>
            {isCluster ? item.count : item.index < 9 && !selected ? item.index + 1 : ""}
          </AppText>
        </View>
      </Pressable>
    );
  },
  (prev, next) =>
    prev.item.id === next.item.id &&
    prev.item.x === next.item.x &&
    prev.item.y === next.item.y &&
    prev.selected === next.selected,
);

export const FacilityMapViewFallback = memo(function FacilityMapViewFallback({
  facilities,
  selectedFacility,
  userLocation,
  onSelectFacility,
  onStatusChange,
}: FacilityMapViewProps) {
  const [layout, setLayout] = useState<LayoutSize>({ width: 0, height: 0 });

  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const startScale = useSharedValue(1);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);

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

  const markerItems = useMemo(() => clusterFacilities(projectedFacilities), [projectedFacilities]);

  const selectedPoint = useMemo(() => {
    if (!selectedFacility || layout.width <= 0 || layout.height <= 0) return null;
    const longitude = getNumber(selectedFacility.longitude);
    const latitude = getNumber(selectedFacility.latitude);
    if (longitude == null || latitude == null) return null;
    return projectPoint(longitude, latitude, bounds, layout);
  }, [bounds, layout, selectedFacility]);

  const projectedUserLocation = useMemo(() => {
    if (!userLocation || layout.width <= 0 || layout.height <= 0) return null;
    return projectPoint(userLocation.longitude, userLocation.latitude, bounds, layout);
  }, [bounds, layout, userLocation]);

  useEffect(() => {
    onStatusChange?.(mappableFacilities.length > 0 ? "ready" : "error");
  }, [mappableFacilities.length, onStatusChange]);

  useEffect(() => {
    if (!selectedPoint || layout.width <= 0 || layout.height <= 0) return;
    const nextScale = Math.max(scale.value, 1.6);
    scale.value = withTiming(nextScale, { duration: 260 });
    translateX.value = withTiming(layout.width / 2 - selectedPoint.x * nextScale, { duration: 260 });
    translateY.value = withTiming(layout.height / 2 - selectedPoint.y * nextScale, { duration: 260 });
  }, [layout.height, layout.width, scale, selectedPoint, translateX, translateY]);

  const pan = Gesture.Pan()
    .onBegin(() => {
      startX.value = translateX.value;
      startY.value = translateY.value;
    })
    .onUpdate((event) => {
      translateX.value = startX.value + event.translationX;
      translateY.value = startY.value + event.translationY;
    });

  const pinch = Gesture.Pinch()
    .onBegin(() => {
      startScale.value = scale.value;
    })
    .onUpdate((event) => {
      scale.value = clamp(startScale.value * event.scale, MIN_SCALE, MAX_SCALE);
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd((event) => {
      const nextScale = scale.value >= 2.4 ? 1 : Math.min(scale.value + 0.75, MAX_SCALE);
      scale.value = withTiming(nextScale, { duration: 220 });
      translateX.value = withTiming(layout.width / 2 - event.x * nextScale, { duration: 220 });
      translateY.value = withTiming(layout.height / 2 - event.y * nextScale, { duration: 220 });
    });

  const gesture = Gesture.Simultaneous(doubleTap, pan, pinch);

  const mapTransformStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  const zoomIn = useCallback(() => {
    const nextScale = Math.min(scale.value + 0.45, MAX_SCALE);
    scale.value = withTiming(nextScale, { duration: 180 });
  }, [scale]);

  const zoomOut = useCallback(() => {
    const nextScale = Math.max(scale.value - 0.45, MIN_SCALE);
    scale.value = withTiming(nextScale, { duration: 180 });
    if (nextScale === MIN_SCALE) {
      translateX.value = withTiming(0, { duration: 180 });
      translateY.value = withTiming(0, { duration: 180 });
    }
  }, [scale, translateX, translateY]);

  return (
    <View
      style={styles.root}
      onLayout={(event) => {
        const { width, height } = event.nativeEvent.layout;
        setLayout((current) => (current.width === width && current.height === height ? current : { width, height }));
      }}
    >
      {layout.width > 0 && layout.height > 0 ? (
        <GestureDetector gesture={gesture}>
          <Animated.View style={[styles.mapLayer, mapTransformStyle]}>
            <MemoizedMapBackground width={layout.width} height={layout.height} />
            {markerItems.map((item) => (
              <MapMarker
                key={item.id}
                item={item}
                selected={selectedFacility?.facilityId === item.facility.facilityId}
                onSelectFacility={onSelectFacility}
              />
            ))}
            {projectedUserLocation ? (
              <View
                pointerEvents="none"
                style={[styles.userMarker, { left: projectedUserLocation.x - 10, top: projectedUserLocation.y - 10 }]}
              >
                <View style={styles.userDot} />
              </View>
            ) : null}
          </Animated.View>
        </GestureDetector>
      ) : null}

      <View pointerEvents="none" style={styles.badge}>
        <Maximize2 size={14} color={colors.teal} />
        <AppText variant="caption" color={colors.teal}>
          Bản đồ Expo Go
        </AppText>
      </View>

      <View style={styles.zoomControls}>
        <Pressable accessibilityRole="button" accessibilityLabel="Phóng to bản đồ" onPress={zoomIn} style={styles.zoomButton}>
          <Plus size={16} color={colors.ink} />
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Thu nhỏ bản đồ" onPress={zoomOut} style={styles.zoomButton}>
          <Minus size={16} color={colors.ink} />
        </Pressable>
      </View>

      {mappableFacilities.length === 0 ? (
        <View style={styles.emptyOverlay}>
          <Layers3 size={22} color={colors.teal} />
          <AppText variant="bodyStrong" center>
            Chưa có tọa độ hợp lệ
          </AppText>
          <AppText color={colors.muted} center>
            Danh sách cơ sở y tế vẫn dùng được khi mở bảng bên dưới.
          </AppText>
        </View>
      ) : null}

      {selectedFacility ? (
        <View style={styles.selectedLabel} pointerEvents="none">
          <AppText variant="caption" color={colors.ink} numberOfLines={1}>
            {selectedFacility.facilityName}
          </AppText>
        </View>
      ) : null}
    </View>
  );
}, areMapPropsEqual);

function areMapPropsEqual(prev: FacilityMapViewProps, next: FacilityMapViewProps) {
  if (prev.selectedFacility?.facilityId !== next.selectedFacility?.facilityId) return false;
  if (prev.userLocation?.latitude !== next.userLocation?.latitude || prev.userLocation?.longitude !== next.userLocation?.longitude) return false;
  if (prev.facilities.length !== next.facilities.length) return false;

  for (let index = 0; index < prev.facilities.length; index += 1) {
    const previous = prev.facilities[index];
    const current = next.facilities[index];
    if (
      previous.facilityId !== current.facilityId ||
      previous.latitude !== current.latitude ||
      previous.longitude !== current.longitude ||
      previous.facilityName !== current.facilityName
    ) {
      return false;
    }
  }

  return true;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    overflow: "hidden",
    backgroundColor: "#eef4f5",
  },
  mapLayer: {
    ...StyleSheet.absoluteFillObject,
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
  zoomControls: {
    position: "absolute",
    top: spacing.md,
    right: spacing.md,
    gap: spacing.xs,
  },
  zoomButton: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(17,20,18,0.12)",
    borderRadius: radius.pill,
    backgroundColor: "rgba(255,255,255,0.94)",
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
  clusterHalo: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(8,127,140,0.18)",
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
  clusterPin: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  pinIndex: {
    fontSize: 8,
    lineHeight: 10,
  },
  selectedLabel: {
    position: "absolute",
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing["4xl"] + spacing.xl,
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
});

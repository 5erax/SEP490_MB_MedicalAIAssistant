// Shown instead of the real map when running inside Expo Go, which doesn't
// bundle @maplibre/maplibre-react-native's native modules — see
// FacilityMapView.native.tsx for the environment check that picks this.
import { useEffect } from "react";
import { StyleSheet, View } from "react-native";

import { AppText } from "@/src/components/ui";
import { colors, radius, spacing } from "@/src/theme/tokens";
import type { FacilityMapViewProps } from "./FacilityMapView.types";

export function FacilityMapViewFallback({ facilities, onStatusChange }: FacilityMapViewProps) {
  useEffect(() => {
    onStatusChange?.("error");
  }, [onStatusChange]);

  return (
    <View style={styles.fallback}>
      <AppText variant="bodyStrong" center>
        Bản đồ cần bản dựng native riêng
      </AppText>
      <AppText color={colors.muted} center>
        Expo Go chưa có module MapLibre. Danh sách {facilities.length} cơ sở y tế bên dưới vẫn dùng được.
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.paperSoft,
    padding: spacing.xl,
  },
});

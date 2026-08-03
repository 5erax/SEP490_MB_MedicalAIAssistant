// Expo Go does not include @maplibre/maplibre-react-native's native modules.
// Keep this file native-safe so auth and the rest of the app can run in Expo Go.
// A custom dev client/EAS build can restore the real MapLibre view.
import { useEffect } from "react";
import { StyleSheet, View } from "react-native";

import { AppText } from "@/src/components/ui";
import { colors, radius, spacing } from "@/src/theme/tokens";
import type { FacilityMapViewProps } from "./FacilityMapView.types";

export function FacilityMapView({ facilities, onStatusChange }: FacilityMapViewProps) {
  useEffect(() => {
    onStatusChange?.("error");
  }, [onStatusChange]);

  return (
    <View style={styles.fallback}>
      <AppText variant="bodyStrong" center>
        Ban do can ban dung native rieng
      </AppText>
      <AppText color={colors.muted} center>
        Expo Go chua co module MapLibre. Danh sach {facilities.length} co so y te ben duoi van dung duoc.
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

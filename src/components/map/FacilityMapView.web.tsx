// Web/dev-preview stub — @maplibre/maplibre-react-native is native-only
// (requires a custom dev client, not supported on the web/RNW target or in
// Expo Go). The real map renders via FacilityMapView.native.tsx on iOS/Android.
import { StyleSheet, View } from "react-native";

import { AppText } from "@/src/components/ui";
import { colors, radius, spacing } from "@/src/theme/tokens";
import type { FacilityMapViewProps } from "./FacilityMapView.types";

export function FacilityMapView({ facilities }: FacilityMapViewProps) {
  return (
    <View style={styles.root}>
      <AppText variant="bodyStrong" color={colors.muted} center>
        Bản đồ chỉ khả dụng trên bản dựng native (iOS/Android).
      </AppText>
      <AppText variant="caption" color={colors.subtle} center>
        {facilities.length} cơ sở y tế trong danh sách.
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.paperSoft,
    padding: spacing.xl,
  },
});

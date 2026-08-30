import { StyleSheet, View } from "react-native";
import { Star } from "lucide-react-native";

import { AppText } from "@/src/components/ui";
import { colors, spacing } from "@/src/theme/tokens";
import { FacilityRatingSummary, formatFacilityRating } from "@/src/utils/facilityRating";

export function FacilityRating({ averageRating, reviewCount }: FacilityRatingSummary) {
  const label = formatFacilityRating({ averageRating, reviewCount });
  return (
    <View style={styles.row} accessible accessibilityLabel={label}>
      <Star size={15} color={averageRating == null ? colors.subtle : colors.amber} fill={averageRating == null ? "transparent" : colors.amber} />
      <AppText variant="caption" color={colors.muted} style={styles.label}>{label}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  label: { flexShrink: 1 },
});

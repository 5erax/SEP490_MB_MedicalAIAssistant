import { Pressable, StyleSheet, View } from "react-native";
import { MapPin } from "lucide-react-native";

import { AppText, Badge } from "@/src/components/ui";
import { colors, radius, spacing } from "@/src/theme/tokens";
import { NormalizedFacility } from "@/src/types/facility";
import { formatDistance } from "@/src/utils/facilityRanking";
import { FacilityRating } from "@/src/components/reviews/FacilityRating";

type FacilityListItemProps = {
  facility: NormalizedFacility;
  selected: boolean;
  onPress: () => void;
};

export function FacilityListItem({ facility, selected, onPress }: FacilityListItemProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.card, selected && styles.cardSelected]}
    >
      <View style={styles.header}>
        <AppText variant="bodyStrong" style={styles.name}>
          {facility.facilityName}
        </AppText>
        <Badge tone="info">{facility.facilityTypeLabel}</Badge>
      </View>
      <FacilityRating averageRating={facility.averageRating} reviewCount={facility.reviewCount} />
      <View style={styles.row}>
        <MapPin size={14} color={colors.subtle} />
        <AppText variant="caption" color={colors.muted} style={styles.address}>
          {facility.address}
        </AppText>
      </View>
      {facility.distanceKm != null ? (
        <AppText variant="caption" color={colors.teal}>
          Cách bạn khoảng {formatDistance(facility.distanceKm)}
        </AppText>
      ) : null}
      <AppText variant="caption" color={colors.subtle} numberOfLines={1}>
        {facility.departments.join(" · ")}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.sm,
    backgroundColor: colors.paper,
    padding: spacing.lg,
  },
  cardSelected: {
    borderColor: colors.teal,
    backgroundColor: colors.mint,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  name: {
    flex: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  address: {
    flex: 1,
  },
});

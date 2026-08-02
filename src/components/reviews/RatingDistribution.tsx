import { StyleSheet, View } from "react-native";

import { AppText } from "@/src/components/ui";
import { colors, radius, spacing } from "@/src/theme/tokens";
import { FeedbackReview } from "@/src/utils/reviewHelpers";

// Ported from the reviewDistribution computation in NearbyClinicPage.jsx —
// a 5->1 star histogram over the currently-loaded review page (not a
// server-computed aggregate over all reviews).
export function RatingDistribution({ reviews }: { reviews: FeedbackReview[] }) {
  const total = reviews.length;

  return (
    <View style={styles.group}>
      {[5, 4, 3, 2, 1].map((star) => {
        const count = reviews.filter((review) => Math.round(Number(review.rating)) === star).length;
        const percent = total ? Math.round((count / total) * 100) : 0;
        return (
          <View key={star} style={styles.row}>
            <AppText variant="caption" color={colors.subtle} style={styles.starLabel}>
              {star} sao
            </AppText>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${percent}%` }]} />
            </View>
            <AppText variant="caption" color={colors.subtle} style={styles.countLabel}>
              {count}
            </AppText>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    gap: spacing.xs,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  starLabel: {
    width: 44,
  },
  track: {
    flex: 1,
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.line,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: radius.pill,
    backgroundColor: colors.amber,
  },
  countLabel: {
    width: 20,
    textAlign: "right",
  },
});

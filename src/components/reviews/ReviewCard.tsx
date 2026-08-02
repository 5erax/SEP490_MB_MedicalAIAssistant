import { Image, ScrollView, StyleSheet, View } from "react-native";

import { AppText, Badge } from "@/src/components/ui";
import { colors, radius, spacing } from "@/src/theme/tokens";
import {
  FeedbackReview,
  getReviewAuthorInitial,
  getReviewAuthorName,
  getReviewDate,
  getReviewImageUrls,
} from "@/src/utils/reviewHelpers";
import { StarRatingDisplay } from "./StarRatingInput";

export function ReviewCard({ review }: { review: FeedbackReview }) {
  const authorName = getReviewAuthorName(review);
  const images = getReviewImageUrls(review);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <AppText variant="caption" color={colors.teal}>
            {getReviewAuthorInitial(authorName)}
          </AppText>
        </View>
        <View style={styles.headerText}>
          <View style={styles.nameRow}>
            <AppText variant="bodyStrong">{authorName}</AppText>
            {review.isCurrentUser ? <Badge tone="info">Của bạn</Badge> : null}
          </View>
          <View style={styles.metaRow}>
            <StarRatingDisplay value={Number(review.rating) || 0} />
            <AppText variant="caption" color={colors.subtle}>
              {getReviewDate(review)}
            </AppText>
          </View>
        </View>
      </View>

      {review.comment ? <AppText color={colors.muted}>{review.comment}</AppText> : null}

      {images.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.imageRow}>
          {images.map((url) => (
            <Image key={url} source={{ uri: url }} style={styles.image} />
          ))}
        </ScrollView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    backgroundColor: colors.paper,
    padding: spacing.md,
  },
  header: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  avatar: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: colors.mint,
  },
  headerText: {
    flex: 1,
    gap: spacing.xs / 2,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  imageRow: {
    gap: spacing.sm,
  },
  image: {
    width: 72,
    height: 72,
    borderRadius: radius.sm,
    backgroundColor: colors.paperSoft,
  },
});

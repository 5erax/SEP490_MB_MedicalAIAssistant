// Ported from the "reviews" detail tab in Web's NearbyClinicPage.jsx.
import { StyleSheet, View } from "react-native";
import { router } from "expo-router";

import { AppText, Button, EmptyState, SkeletonGroup } from "@/src/components/ui";
import { colors, radius, spacing } from "@/src/theme/tokens";
import { useFacilityReviews } from "@/src/hooks/useFacilityReviews";
import { useToast } from "@/src/hooks/useToast";
import { useAuth } from "@/src/providers";
import { ROUTES } from "@/src/navigation/routes";
import { getAverageRating } from "@/src/utils/reviewHelpers";
import { RatingDistribution } from "./RatingDistribution";
import { ReviewCard } from "./ReviewCard";
import { ReviewForm } from "./ReviewForm";
import { StarRatingDisplay } from "./StarRatingInput";

export function ReviewsSection({ facilityId }: { facilityId: string }) {
  const { session } = useAuth();
  const { showToast } = useToast();
  const {
    reviews,
    loading,
    form,
    setForm,
    editing,
    submitting,
    uploadingImage,
    message,
    currentUserReview,
    startEditing,
    cancelEditing,
    pickAndUploadImage,
    removeImage,
    submit,
  } = useFacilityReviews(facilityId);

  const averageRating = getAverageRating(reviews);

  async function handleSubmit() {
    const result = await submit();
    if (result === "requires-auth") {
      router.push(ROUTES.PUBLIC.LOGIN);
      return;
    }
    if (result === "success") {
      showToast({ type: "success", message: "Đã lưu đánh giá của bạn." });
    }
  }

  return (
    <View style={styles.group}>
      <View style={styles.summaryRow}>
        <View>
          <AppText variant="h2">{averageRating ? averageRating.toFixed(1) : "—"}</AppText>
          <StarRatingDisplay value={averageRating ?? 0} size={16} />
          <AppText variant="caption" color={colors.subtle}>
            {reviews.length} đánh giá
          </AppText>
        </View>
        <View style={styles.distributionWrap}>
          <RatingDistribution reviews={reviews} />
        </View>
      </View>

      {message ? (
        <View style={styles.notice}>
          <AppText variant="caption" color={colors.warning}>
            {message}
          </AppText>
        </View>
      ) : null}

      {!session ? (
        <View style={styles.loginPrompt}>
          <AppText color={colors.muted}>Đăng nhập để viết đánh giá cho cơ sở này.</AppText>
          <Button size="sm" onPress={() => router.push(ROUTES.PUBLIC.LOGIN)}>
            Đăng nhập
          </Button>
        </View>
      ) : currentUserReview && !editing ? (
        <View style={styles.ownReviewCard}>
          <ReviewCard review={currentUserReview} />
          {currentUserReview.id ? (
            <Button variant="secondary" size="sm" onPress={startEditing}>
              Chỉnh sửa đánh giá
            </Button>
          ) : null}
        </View>
      ) : (
        <ReviewForm
          form={form}
          onChange={setForm}
          editing={editing}
          submitting={submitting}
          uploadingImage={uploadingImage}
          onPickImage={pickAndUploadImage}
          onRemoveImage={removeImage}
          onSubmit={handleSubmit}
          onCancel={cancelEditing}
        />
      )}

      <View style={styles.list}>
        {loading ? (
          <SkeletonGroup lines={3} />
        ) : reviews.length === 0 ? (
          <EmptyState title="Chưa có đánh giá" description="Chưa có đánh giá công khai cho cơ sở này." />
        ) : (
          reviews.map((review, index) => <ReviewCard key={review.id || index} review={review} />)
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    gap: spacing.lg,
  },
  summaryRow: {
    flexDirection: "row",
    gap: spacing.lg,
  },
  distributionWrap: {
    flex: 1,
    justifyContent: "center",
  },
  notice: {
    borderRadius: radius.md,
    backgroundColor: colors.warningBg,
    padding: spacing.md,
  },
  loginPrompt: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    backgroundColor: colors.paperSoft,
    padding: spacing.lg,
  },
  ownReviewCard: {
    gap: spacing.sm,
  },
  list: {
    gap: spacing.md,
  },
});

import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { ImagePlus, X } from "lucide-react-native";

import { AppText, Button, TextField } from "@/src/components/ui";
import { colors, radius, spacing } from "@/src/theme/tokens";
import { ReviewForm as ReviewFormState } from "@/src/hooks/useFacilityReviews";
import { RATING_LABELS, StarRatingInput } from "./StarRatingInput";

type ReviewFormProps = {
  form: ReviewFormState;
  onChange: (form: ReviewFormState) => void;
  editing: boolean;
  submitting: boolean;
  uploadingImage: boolean;
  onPickImage: () => void;
  onRemoveImage: (url: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
};

export function ReviewForm({
  form,
  onChange,
  editing,
  submitting,
  uploadingImage,
  onPickImage,
  onRemoveImage,
  onSubmit,
  onCancel,
}: ReviewFormProps) {
  const rating = Number(form.rating) || 5;

  return (
    <View style={styles.group}>
      <AppText variant="bodyStrong">{editing ? "Chỉnh sửa đánh giá của bạn" : "Viết đánh giá"}</AppText>

      <View style={styles.ratingRow}>
        <StarRatingInput value={rating} onChange={(value) => onChange({ ...form, rating: String(value) })} />
        <AppText variant="caption" color={colors.subtle}>
          {RATING_LABELS[rating]}
        </AppText>
      </View>

      <TextField
        label="Nhận xét (không bắt buộc)"
        value={form.comment}
        onChangeText={(value) => onChange({ ...form, comment: value.slice(0, 1000) })}
        placeholder="Chia sẻ trải nghiệm của bạn tại cơ sở này..."
        multiline
        numberOfLines={3}
        style={styles.textarea}
      />

      <View style={styles.imageSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.imageRow}>
          {form.imageUrls.map((url) => (
            <View key={url} style={styles.imageWrap}>
              <Image source={{ uri: url }} style={styles.image} />
              <Pressable accessibilityRole="button" accessibilityLabel="Xoá ảnh" onPress={() => onRemoveImage(url)} style={styles.removeButton}>
                <X size={12} color={colors.white} />
              </Pressable>
            </View>
          ))}
          {form.imageUrls.length < 5 ? (
            <Pressable accessibilityRole="button" onPress={onPickImage} disabled={uploadingImage} style={styles.addImageButton}>
              {uploadingImage ? <ActivityIndicator size="small" color={colors.teal} /> : <ImagePlus size={20} color={colors.teal} />}
            </Pressable>
          ) : null}
        </ScrollView>
        <AppText variant="caption" color={colors.subtle}>
          Tối đa 5 ảnh.
        </AppText>
      </View>

      <View style={styles.actions}>
        {editing ? (
          <Button variant="secondary" onPress={onCancel} disabled={submitting}>
            Hủy
          </Button>
        ) : null}
        <Button onPress={onSubmit} disabled={submitting} style={styles.submitButton}>
          {submitting ? "Đang gửi..." : editing ? "Cập nhật đánh giá" : "Gửi đánh giá"}
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    gap: spacing.md,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  textarea: {
    minHeight: 72,
    textAlignVertical: "top",
    paddingTop: spacing.sm,
  },
  imageSection: {
    gap: spacing.xs,
  },
  imageRow: {
    gap: spacing.sm,
  },
  imageWrap: {
    position: "relative",
  },
  image: {
    width: 64,
    height: 64,
    borderRadius: radius.sm,
    backgroundColor: colors.paperSoft,
  },
  removeButton: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    backgroundColor: colors.danger,
  },
  addImageButton: {
    width: 64,
    height: 64,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    borderStyle: "dashed",
  },
  actions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  submitButton: {
    flex: 1,
  },
});

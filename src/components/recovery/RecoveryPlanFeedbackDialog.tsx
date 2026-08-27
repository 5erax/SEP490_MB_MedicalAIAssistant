import { useEffect, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { X } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppText, Button, TextField } from "@/src/components/ui";
import { colors, radius, spacing } from "@/src/theme/tokens";
import { RATING_LABELS, StarRatingInput } from "@/src/components/reviews/StarRatingInput";
import { RecoveryPlan } from "@/src/types/recoveryPlan";
import { formatDateOnly } from "@/src/utils/recoveryPlanPresentation";

type RecoveryPlanFeedbackDialogProps = {
  visible: boolean;
  plan: RecoveryPlan | null;
  submitting: boolean;
  errorMessage?: string;
  onClose: () => void;
  onSubmit: (payload: { rating: number; note: string | null }) => void;
};

export function RecoveryPlanFeedbackDialog({ visible, plan, submitting, errorMessage, onClose, onSubmit }: RecoveryPlanFeedbackDialogProps) {
  const [rating, setRating] = useState(0);
  const [note, setNote] = useState("");

  useEffect(() => {
    if (visible) {
      setRating(0);
      setNote("");
    }
  }, [visible, plan?.id]);

  if (!plan) return null;

  function handleSubmit() {
    if (rating < 1) return;
    onSubmit({ rating, note: note.trim() || null });
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
        <View style={styles.header}>
          <View style={styles.headerTitleWrap}>
            <AppText variant="caption" color={colors.teal}>
              HOÀN THÀNH KẾ HOẠCH
            </AppText>
            <AppText variant="h3">Đánh giá kế hoạch phục hồi</AppText>
          </View>
          <Pressable accessibilityRole="button" onPress={onClose} style={styles.closeButton} hitSlop={8} disabled={submitting}>
            <X size={20} color={colors.ink} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.summaryCard}>
            <AppText variant="bodyStrong">{plan.planName || "Kế hoạch phục hồi"}</AppText>
            <AppText variant="caption" color={colors.subtle}>
              Hoàn thành: {formatDateOnly(plan.completedAt || plan.endDate)}
            </AppText>
          </View>

          <AppText color={colors.muted}>
            Chia sẻ trải nghiệm của bạn để đội ngũ hiểu rõ hơn mức độ hữu ích của kế hoạch. Đánh giá này không thay đổi nội dung kế hoạch đã hoàn thành.
          </AppText>

          <View style={styles.ratingSection}>
            <AppText variant="bodyStrong">Mức độ hài lòng *</AppText>
            <StarRatingInput value={rating} onChange={setRating} size={32} />
            <AppText variant="caption" color={colors.subtle}>
              {rating > 0 ? RATING_LABELS[rating] : "Chưa chọn mức đánh giá"}
            </AppText>
          </View>

          <TextField
            label="Ghi chú thêm (không bắt buộc)"
            value={note}
            onChangeText={(text) => setNote(text.slice(0, 1000))}
            placeholder="Chia sẻ thêm điều hữu ích hoặc điểm bạn thấy khó thực hiện..."
            multiline
            numberOfLines={5}
            style={styles.textarea}
            hint={`${note.length} / 1.000 ký tự`}
          />

          {errorMessage ? (
            <View style={styles.errorBanner}>
              <AppText color={colors.danger}>{errorMessage}</AppText>
            </View>
          ) : null}

          <View style={styles.actions}>
            <Button variant="secondary" onPress={onClose} disabled={submitting} style={styles.actionButton}>
              Để sau
            </Button>
            <Button onPress={handleSubmit} disabled={rating < 1 || submitting} style={styles.actionButton}>
              {submitting ? "Đang gửi..." : "Gửi đánh giá"}
            </Button>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  headerTitleWrap: {
    flex: 1,
    gap: spacing.xs / 2,
  },
  closeButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.pill,
    backgroundColor: colors.paperSoft,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
    paddingBottom: spacing["4xl"],
  },
  summaryCard: {
    gap: spacing.xs / 2,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    backgroundColor: colors.paperSoft,
    padding: spacing.md,
  },
  ratingSection: {
    gap: spacing.sm,
  },
  textarea: {
    minHeight: 110,
    textAlignVertical: "top",
    paddingTop: spacing.sm,
  },
  errorBanner: {
    borderRadius: radius.md,
    backgroundColor: colors.dangerBg,
    padding: spacing.md,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
});

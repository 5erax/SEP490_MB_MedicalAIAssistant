import { ActivityIndicator, StyleSheet, View } from "react-native";

import { AppText, Button, Card, TextField } from "@/src/components/ui";
import { colors, radius, spacing } from "@/src/theme/tokens";

type IntakeFormProps = {
  input: string;
  onChangeInput: (value: string) => void;
  loading: boolean;
  onSubmit: () => void;
};

export function IntakeForm({ input, onChangeInput, loading, onSubmit }: IntakeFormProps) {
  return (
    <View style={styles.group}>
      <Card variant="hard" style={styles.card}>
        <View style={styles.stepHeader}>
          <AppText variant="caption" color={colors.subtle}>
            Bước 1
          </AppText>
          <AppText variant="h3">Mô tả điều bạn đang cảm nhận</AppText>
        </View>

        <TextField
          label="Triệu chứng bạn đang gặp"
          hint="Mô tả thời điểm bắt đầu, mức độ và dấu hiệu đi kèm để gợi ý phù hợp hơn."
          value={input}
          onChangeText={onChangeInput}
          placeholder="Ví dụ: Tôi đau bụng âm ỉ sau bữa ăn, buồn nôn nhẹ..."
          multiline
          numberOfLines={4}
          style={styles.textarea}
          editable={!loading}
        />

        <View style={styles.statusRow}>
          <AppText variant="caption" color={colors.subtle} style={styles.statusText}>
            {loading ? "AI đang chọn câu hỏi cần hỏi thêm..." : "Sẵn sàng. MediMate sẽ hỏi thêm một số câu ngắn."}
          </AppText>
        </View>

        <Button fullWidth disabled={!input.trim() || loading} onPress={onSubmit}>
          {loading ? (
            <View style={styles.loadingLabel}>
              <ActivityIndicator color={colors.ink} size="small" />
              <AppText variant="bodyStrong">Đang tạo câu hỏi...</AppText>
            </View>
          ) : (
            "Gửi triệu chứng"
          )}
        </Button>
      </Card>

      <View style={styles.emergencyNote}>
        <AppText variant="bodyStrong" color={colors.warning}>
          Khi nào cần cấp cứu?
        </AppText>
        <AppText color={colors.muted}>
          Nếu có dấu hiệu nghiêm trọng hoặc tình trạng chuyển nặng nhanh, hãy liên hệ dịch vụ cấp cứu tại nơi bạn sống
          hoặc đến cơ sở y tế gần nhất.
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    gap: spacing.lg,
  },
  card: {
    gap: spacing.lg,
  },
  stepHeader: {
    gap: spacing.xs,
  },
  textarea: {
    minHeight: 96,
    textAlignVertical: "top",
    paddingTop: spacing.md,
  },
  statusRow: {
    flexDirection: "row",
  },
  statusText: {
    flex: 1,
  },
  loadingLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  emergencyNote: {
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.warningBg,
    borderRadius: radius.lg,
    backgroundColor: colors.warningBg,
    padding: spacing.lg,
  },
});

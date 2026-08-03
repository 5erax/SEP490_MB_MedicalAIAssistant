import { Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { X } from "lucide-react-native";

import { AppText, Button, TextField } from "@/src/components/ui";
import { colors, radius, spacing } from "@/src/theme/tokens";
import { ROUTES } from "@/src/navigation/routes";
import { CreateRequestForm } from "@/src/hooks/useRecoveryPlan";
import { DISEASE_GROUPS } from "@/src/utils/recoveryPlanPresentation";

const NOTE_MAX_LENGTH = 2000;

type CreateRequestSheetProps = {
  visible: boolean;
  form: CreateRequestForm;
  errors: { diseaseGroup?: string; requestNote?: string };
  submitting: boolean;
  submitError: string;
  needsSubscription: boolean;
  onClose: () => void;
  onChange: <K extends keyof CreateRequestForm>(key: K, value: CreateRequestForm[K]) => void;
  onSubmit: () => void;
};

export function CreateRequestSheet({
  visible,
  form,
  errors,
  submitting,
  submitError,
  needsSubscription,
  onClose,
  onChange,
  onSubmit,
}: CreateRequestSheetProps) {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.root}>
        <View style={styles.header}>
          <AppText variant="h3">Yêu cầu kế hoạch phục hồi</AppText>
          <Pressable accessibilityRole="button" accessibilityLabel="Đóng" onPress={onClose} style={styles.closeButton} hitSlop={8}>
            <X size={20} color={colors.ink} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.fieldGroup}>
            <AppText variant="caption" color={errors.diseaseGroup ? colors.danger : colors.muted}>
              Nhóm bệnh cần hỗ trợ
            </AppText>
            <View style={styles.diseaseRow}>
              {DISEASE_GROUPS.map(({ value, label }) => {
                const selected = form.diseaseGroup === value;
                return (
                  <Pressable
                    key={value}
                    accessibilityRole="button"
                    disabled={submitting}
                    onPress={() => onChange("diseaseGroup", value)}
                    style={[styles.diseaseChip, selected && styles.diseaseChipSelected]}
                  >
                    <AppText variant="bodyStrong" color={selected ? colors.white : colors.muted}>
                      {label}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>
            {errors.diseaseGroup ? (
              <AppText variant="caption" color={colors.danger}>
                {errors.diseaseGroup}
              </AppText>
            ) : null}
          </View>

          <TextField
            label={`Ghi chú cho bác sĩ (tuỳ chọn) · ${form.requestNote.length}/${NOTE_MAX_LENGTH}`}
            placeholder="Mô tả điều bạn muốn bác sĩ lưu ý khi lên kế hoạch phục hồi"
            value={form.requestNote}
            onChangeText={(value) => onChange("requestNote", value.slice(0, NOTE_MAX_LENGTH))}
            editable={!submitting}
            error={errors.requestNote}
            multiline
            numberOfLines={4}
            style={styles.multiline}
          />

          {submitError ? (
            <View style={styles.errorGroup}>
              <AppText color={colors.danger} variant="caption">
                {submitError}
              </AppText>
              {needsSubscription ? (
                <Button
                  variant="secondary"
                  size="sm"
                  onPress={() => {
                    onClose();
                    router.push(ROUTES.PUBLIC.PRICING as never);
                  }}
                >
                  Xem gói dịch vụ
                </Button>
              ) : null}
            </View>
          ) : null}
        </ScrollView>

        <View style={styles.footer}>
          <Button fullWidth disabled={submitting} onPress={onSubmit}>
            {submitting ? "Đang gửi..." : "Gửi yêu cầu"}
          </Button>
        </View>
      </View>
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
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
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
  },
  fieldGroup: {
    gap: spacing.sm,
  },
  diseaseRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  diseaseChip: {
    borderWidth: 1.5,
    borderColor: colors.lineStrong,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.paper,
  },
  diseaseChipSelected: {
    borderColor: colors.teal,
    backgroundColor: colors.teal,
  },
  multiline: {
    minHeight: 96,
    textAlignVertical: "top",
    paddingTop: spacing.md,
  },
  errorGroup: {
    gap: spacing.sm,
    alignItems: "flex-start",
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
});

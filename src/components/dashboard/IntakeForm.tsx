import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from "react-native";
import { ClipboardList, SendHorizontal, ShieldCheck, Sparkles } from "lucide-react-native";

import { AppText } from "@/src/components/ui";
import { colors, radius, spacing } from "@/src/theme/tokens";

type IntakeFormProps = {
  input: string;
  onChangeInput: (value: string) => void;
  loading: boolean;
  onSubmit: () => void;
};

export function IntakeForm({ input, onChangeInput, loading, onSubmit }: IntakeFormProps) {
  const disabled = !input.trim() || loading;

  return (
    <View style={styles.group}>
      <View style={styles.intakeCard}>
        <View style={styles.cardHeader}>
          <View style={styles.headerMain}>
            <View style={styles.headerIcon}>
              <ClipboardList size={20} color={colors.teal} />
            </View>
            <View style={styles.headerText}>
              <AppText variant="caption" color={colors.teal}>
                Bắt đầu tư vấn
              </AppText>
              <AppText variant="bodyStrong" style={styles.headerTitle}>
                Mô tả triệu chứng của bạn
              </AppText>
            </View>
          </View>
          <View style={styles.aiBadge}>
            <Sparkles size={13} color={colors.teal} />
            <AppText variant="caption" color={colors.teal}>
              AI hỗ trợ
            </AppText>
          </View>
        </View>

        <View style={styles.inputShell}>
          <TextInput
            value={input}
            onChangeText={onChangeInput}
            placeholder="Ví dụ: đau họng 2 ngày, ho nhiều về đêm, sốt nhẹ..."
            placeholderTextColor={colors.subtle}
            multiline
            editable={!loading}
            style={styles.input}
          />
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.safeNote}>
            <ShieldCheck size={16} color={colors.teal} />
            <AppText variant="caption" color={colors.subtle} style={styles.safeNoteText}>
              Kết quả chỉ dùng để định hướng, không thay thế chẩn đoán của bác sĩ.
            </AppText>
          </View>
          <Pressable
            accessibilityRole="button"
            disabled={disabled}
            onPress={onSubmit}
            style={({ pressed }) => [styles.sendButton, disabled && styles.disabled, pressed && !disabled && styles.pressed]}
          >
            {loading ? (
              <ActivityIndicator color={colors.white} size="small" />
            ) : (
              <>
                <AppText variant="bodyStrong" color={colors.white}>
                  Phân tích
                </AppText>
                <SendHorizontal size={17} color={colors.white} />
              </>
            )}
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  pressed: {
    opacity: 0.86,
    transform: [{ translateY: 1 }],
  },
  disabled: {
    opacity: 0.5,
  },
  intakeCard: {
    width: "100%",
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: "rgba(8,127,140,0.12)",
    borderRadius: radius.lg,
    backgroundColor: colors.paper,
    padding: spacing.md,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  headerMain: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  headerIcon: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.lg,
    backgroundColor: colors.mint,
  },
  headerText: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs / 2,
  },
  headerTitle: {
    lineHeight: 21,
  },
  aiBadge: {
    minHeight: 28,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.mint,
    paddingHorizontal: spacing.sm,
  },
  inputShell: {
    minHeight: 124,
    borderWidth: 1,
    borderColor: "rgba(17,20,18,0.12)",
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  input: {
    minHeight: 112,
    maxHeight: 150,
    color: colors.ink,
    paddingVertical: spacing.sm,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "500",
    letterSpacing: 0,
    textAlignVertical: "top",
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  safeNote: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  safeNoteText: {
    flex: 1,
  },
  sendButton: {
    minWidth: 118,
    height: 46,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.teal,
    paddingHorizontal: spacing.md,
    shadowColor: colors.teal,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 2,
  },
});

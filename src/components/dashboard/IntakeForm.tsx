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

const EXAMPLE_PROMPTS = [
  "Đau họng, ho khan 2 ngày, hơi sốt về chiều",
  "Đau bụng âm ỉ sau khi ăn, buồn nôn nhẹ",
  "Đau đầu, chóng mặt khi đứng dậy",
];

export function IntakeForm({ input, onChangeInput, loading, onSubmit }: IntakeFormProps) {
  const disabled = !input.trim() || loading;

  return (
    <View style={styles.group}>
      <View style={styles.intakeCard}>
        <View style={styles.cardHeader}>
          <View style={styles.headerIcon}>
            <ClipboardList size={21} color={colors.teal} />
          </View>
          <View style={styles.headerText}>
            <AppText variant="caption" color={colors.teal}>
              Bắt đầu tư vấn
            </AppText>
            <AppText variant="bodyStrong">Mô tả triệu chứng càng cụ thể càng tốt</AppText>
          </View>
          <View style={styles.aiBadge}>
            <Sparkles size={13} color={colors.teal} />
            <AppText variant="caption" color={colors.teal}>
              AI
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

        <View style={styles.examples}>
          {EXAMPLE_PROMPTS.map((prompt) => (
            <Pressable
              key={prompt}
              accessibilityRole="button"
              disabled={loading}
              onPress={() => onChangeInput(prompt)}
              style={({ pressed }) => [styles.exampleChip, pressed && styles.pressed, loading && styles.disabled]}
            >
              <AppText variant="caption" color={colors.muted} numberOfLines={1}>
                {prompt}
              </AppText>
            </Pressable>
          ))}
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
            {loading ? <ActivityIndicator color={colors.white} size="small" /> : <SendHorizontal size={18} color={colors.white} />}
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
    gap: spacing.md,
    borderWidth: 1,
    borderColor: "rgba(8,127,140,0.16)",
    borderRadius: radius.xl,
    backgroundColor: "rgba(255,255,255,0.96)",
    padding: spacing.md,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  headerIcon: {
    width: 44,
    height: 44,
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
  aiBadge: {
    minHeight: 30,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.mint,
    paddingHorizontal: spacing.md,
  },
  inputShell: {
    minHeight: 118,
    borderWidth: 1,
    borderColor: "rgba(17,20,18,0.1)",
    borderRadius: radius.lg,
    backgroundColor: colors.paperSoft,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  input: {
    minHeight: 96,
    maxHeight: 150,
    color: colors.ink,
    paddingVertical: spacing.sm,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "500",
    letterSpacing: 0,
    textAlignVertical: "top",
  },
  examples: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  exampleChip: {
    maxWidth: "100%",
    minHeight: 34,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(8,127,140,0.14)",
    borderRadius: radius.pill,
    backgroundColor: colors.paper,
    paddingHorizontal: spacing.md,
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
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.pill,
    backgroundColor: colors.teal,
  },
});

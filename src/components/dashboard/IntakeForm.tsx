import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from "react-native";
import { Bot, Plus, SendHorizontal } from "lucide-react-native";

import { AppText } from "@/src/components/ui";
import { colors, radius, spacing } from "@/src/theme/tokens";

type IntakeFormProps = {
  input: string;
  onChangeInput: (value: string) => void;
  loading: boolean;
  onSubmit: () => void;
};

const SAMPLE_SYMPTOMS = ["Đau họng và sốt nhẹ", "Đau bụng sau khi ăn", "Ho kéo dài về đêm"];

export function IntakeForm({ input, onChangeInput, loading, onSubmit }: IntakeFormProps) {
  const disabled = !input.trim() || loading;

  return (
    <View style={styles.group}>
      <View style={styles.promptArea}>
        <View style={styles.aiBadge}>
          <Bot size={15} color={colors.teal} />
          <AppText variant="caption" color={colors.muted}>
            MediMate AI
          </AppText>
        </View>
        <AppText variant="h2" style={styles.promptTitle}>
          Bạn đang gặp triệu chứng gì?
        </AppText>
        <AppText color={colors.muted} style={styles.promptCopy}>
          Mô tả ngắn gọn triệu chứng. MediMate sẽ hỏi thêm khi cần và gợi ý chuyên khoa phù hợp.
        </AppText>
        <View style={styles.sampleRow}>
          {SAMPLE_SYMPTOMS.map((sample) => (
            <Pressable
              key={sample}
              accessibilityRole="button"
              disabled={loading}
              onPress={() => onChangeInput(sample)}
              style={({ pressed }) => [styles.sampleChip, pressed && styles.pressed, loading && styles.disabled]}
            >
              <AppText variant="caption" color={colors.teal}>
                {sample}
              </AppText>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.composer}>
        <Pressable accessibilityRole="button" disabled={loading} style={({ pressed }) => [styles.addButton, pressed && styles.pressed, loading && styles.disabled]}>
          <Plus size={22} color={colors.ink} />
        </Pressable>
        <TextInput
          value={input}
          onChangeText={onChangeInput}
          placeholder="Hỏi MediMate..."
          placeholderTextColor={colors.subtle}
          multiline
          editable={!loading}
          style={styles.input}
        />
        <Pressable accessibilityRole="button" disabled={disabled} onPress={onSubmit} style={({ pressed }) => [styles.sendButton, disabled && styles.disabled, pressed && !disabled && styles.pressed]}>
          {loading ? <ActivityIndicator color={colors.white} size="small" /> : <SendHorizontal size={18} color={colors.white} />}
        </Pressable>
      </View>

      <View style={styles.statusRow}>
        <View style={styles.statusDot} />
        <AppText variant="caption" color={colors.subtle} style={styles.statusText}>
          {loading ? "Đang phân tích..." : "Kết quả chỉ dùng để định hướng, không thay thế chẩn đoán của bác sĩ."}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    minHeight: 520,
    justifyContent: "flex-end",
    gap: spacing.md,
  },
  promptArea: {
    gap: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  aiBadge: {
    alignSelf: "flex-start",
    minHeight: 30,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.mint,
    paddingHorizontal: spacing.md,
  },
  promptTitle: {
    maxWidth: 320,
  },
  promptCopy: {
    maxWidth: 330,
  },
  sampleRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    paddingTop: spacing.sm,
  },
  sampleChip: {
    minHeight: 34,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(8,127,140,0.24)",
    borderRadius: radius.pill,
    backgroundColor: colors.paperSoft,
    paddingHorizontal: spacing.md,
  },
  pressed: {
    opacity: 0.86,
    transform: [{ translateY: 1 }],
  },
  disabled: {
    opacity: 0.5,
  },
  composer: {
    minHeight: 60,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.paper,
    padding: spacing.sm,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 3,
  },
  addButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.pill,
    backgroundColor: colors.paperSoft,
  },
  input: {
    flex: 1,
    maxHeight: 108,
    minHeight: 44,
    color: colors.ink,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.sm,
    textAlignVertical: "center",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  statusText: {
    flex: 1,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.teal,
  },
  sendButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.pill,
    backgroundColor: colors.teal,
  },
});

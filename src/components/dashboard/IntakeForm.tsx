import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from "react-native";
import { Plus, SendHorizontal } from "lucide-react-native";

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
    alignItems: "center",
    gap: spacing.md,
  },
  pressed: {
    opacity: 0.86,
    transform: [{ translateY: 1 }],
  },
  disabled: {
    opacity: 0.5,
  },
  composer: {
    width: "100%",
    maxWidth: 360,
    minHeight: 60,
    flexDirection: "row",
    alignItems: "center",
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
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.pill,
    backgroundColor: "rgba(231,243,245,0.68)",
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
    width: "100%",
    maxWidth: 348,
    flexDirection: "row",
    alignItems: "flex-start",
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
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.pill,
    backgroundColor: colors.teal,
  },
});

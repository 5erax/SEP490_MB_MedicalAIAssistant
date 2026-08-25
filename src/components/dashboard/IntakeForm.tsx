import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import { AlertTriangle, Bot, SendHorizontal } from "lucide-react-native";

import { AppText, Button, Card, TextField } from "@/src/components/ui";
import { colors, radius, spacing } from "@/src/theme/tokens";

type IntakeFormProps = {
  input: string;
  onChangeInput: (value: string) => void;
  loading: boolean;
  onSubmit: () => void;
};

const SAMPLE_SYMPTOMS = ["Đau họng và sốt nhẹ", "Đau bụng sau khi ăn", "Ho kéo dài về đêm"];

export function IntakeForm({ input, onChangeInput, loading, onSubmit }: IntakeFormProps) {
  return (
    <View style={styles.group}>
      <Card variant="hard" style={styles.card}>
        <View style={styles.chatIntro}>
          <View style={styles.botAvatar}>
            <Bot size={20} color={colors.white} />
          </View>
          <View style={styles.aiBubble}>
            <AppText variant="caption" color={colors.teal}>
              MediMate AI
            </AppText>
            <AppText variant="h3">Bạn đang gặp triệu chứng gì?</AppText>
            <AppText variant="caption" color={colors.muted}>
              Mình sẽ hỏi thêm khi cần và gợi ý chuyên khoa phù hợp.
            </AppText>
          </View>
        </View>

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

        <View style={styles.composer}>
          <TextField
            label="Mô tả triệu chứng"
            value={input}
            onChangeText={onChangeInput}
            placeholder="Nhập triệu chứng của bạn..."
            multiline
            numberOfLines={4}
            style={styles.textarea}
            editable={!loading}
          />
          <View style={styles.composerFooter}>
            <View style={styles.statusRow}>
              <View style={styles.statusDot} />
              <AppText variant="caption" color={colors.subtle} style={styles.statusText}>
                {loading ? "Đang phân tích..." : "Sẵn sàng tư vấn"}
              </AppText>
            </View>
            <Button disabled={!input.trim() || loading} onPress={onSubmit} style={styles.sendButton}>
              {loading ? <ActivityIndicator color={colors.white} size="small" /> : <SendHorizontal size={18} color={colors.white} />}
            </Button>
          </View>
        </View>
      </Card>

      <View style={styles.emergencyNote}>
        <AlertTriangle size={18} color={colors.warning} />
        <View style={styles.emergencyText}>
          <AppText variant="bodyStrong" color={colors.warning}>
            Khi nào cần cấp cứu?
          </AppText>
          <AppText variant="caption" color={colors.muted}>
            Nếu tình trạng chuyển nặng nhanh, hãy liên hệ cấp cứu hoặc đến cơ sở y tế gần nhất.
          </AppText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    gap: spacing.lg,
  },
  card: {
    gap: spacing.md,
    borderColor: "rgba(8,127,140,0.18)",
  },
  chatIntro: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  botAvatar: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
    backgroundColor: colors.teal,
  },
  aiBubble: {
    flex: 1,
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.lg,
    borderTopLeftRadius: radius.sm,
    backgroundColor: colors.paperSoft,
    padding: spacing.md,
  },
  sampleRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    paddingLeft: 50,
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
    borderWidth: 1,
    borderColor: "rgba(8,127,140,0.2)",
    borderRadius: radius.lg,
    backgroundColor: colors.paper,
    padding: spacing.md,
  },
  textarea: {
    minHeight: 104,
    textAlignVertical: "top",
    paddingTop: spacing.md,
  },
  composerFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    marginTop: spacing.sm,
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
    minHeight: 44,
    borderRadius: radius.pill,
    paddingHorizontal: 0,
  },
  emergencyNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.warningBg,
    borderRadius: radius.lg,
    backgroundColor: colors.warningBg,
    padding: spacing.md,
  },
  emergencyText: {
    flex: 1,
    gap: spacing.xs / 2,
  },
});

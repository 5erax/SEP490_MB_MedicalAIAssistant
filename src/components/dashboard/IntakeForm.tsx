import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import { AlertTriangle, Bot, SendHorizontal, Sparkles } from "lucide-react-native";

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
            <View style={styles.stepBadge}>
              <Sparkles size={14} color={colors.teal} />
              <AppText variant="caption" color={colors.teal}>
                AI chuyên khoa
              </AppText>
            </View>
            <AppText variant="h3">Bạn đang gặp triệu chứng gì?</AppText>
            <AppText variant="caption" color={colors.muted}>
              Mình sẽ hỏi thêm vài câu ngắn rồi gợi ý chuyên khoa và nơi khám phù hợp.
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
            label="Tin nhắn của bạn"
            hint="Nên có vị trí đau, thời điểm bắt đầu, mức độ và dấu hiệu đi kèm."
            value={input}
            onChangeText={onChangeInput}
            placeholder="Ví dụ: Tôi đau bụng âm ỉ sau bữa ăn, buồn nôn nhẹ..."
            multiline
            numberOfLines={4}
            style={styles.textarea}
            editable={!loading}
          />
        </View>

        <View style={styles.statusRow}>
          <View style={styles.statusDot} />
          <AppText variant="caption" color={colors.subtle} style={styles.statusText}>
            {loading ? "AI đang chọn câu hỏi cần hỏi thêm..." : "Sẵn sàng. MediMate sẽ hỏi thêm một số câu ngắn."}
          </AppText>
        </View>

        <Button fullWidth disabled={!input.trim() || loading} onPress={onSubmit} rightIcon={!loading ? <SendHorizontal size={17} color={colors.white} /> : undefined}>
          {loading ? (
            <View style={styles.loadingLabel}>
              <ActivityIndicator color={colors.white} size="small" />
              <AppText variant="bodyStrong" color={colors.white}>
                Đang tạo câu hỏi...
              </AppText>
            </View>
          ) : (
            "Gửi triệu chứng"
          )}
        </Button>
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
  stepBadge: {
    alignSelf: "flex-start",
    minHeight: 28,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.mint,
    paddingHorizontal: spacing.md,
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
    minHeight: 120,
    textAlignVertical: "top",
    paddingTop: spacing.md,
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
  loadingLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
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

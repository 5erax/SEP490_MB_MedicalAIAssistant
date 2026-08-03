import { Pressable, StyleSheet, View } from "react-native";
import { Activity, ChevronRight, CircleAlert, MessageCircleHeart, Stethoscope } from "lucide-react-native";

import { AppText } from "@/src/components/ui";
import { colors, radius, spacing } from "@/src/theme/tokens";

const WELCOME_PROMPTS = [
  { icon: Activity, label: "Làm rõ triệu chứng", prompt: "Tôi bị đau đầu và sốt nhẹ 2 ngày" },
  { icon: Stethoscope, label: "Chuẩn bị đi khám", prompt: "Tôi nên chuẩn bị gì trước khi đi khám?" },
  { icon: CircleAlert, label: "Nhận biết dấu hiệu khẩn cấp", prompt: "Triệu chứng nào cần đi cấp cứu ngay?" },
  { icon: MessageCircleHeart, label: "Hiểu thông tin sức khỏe", prompt: "Giải thích chỉ số xét nghiệm máu" },
];

export function WelcomePrompts({ onSelect }: { onSelect: (prompt: string) => void }) {
  return (
    <View style={styles.group}>
      <AppText variant="eyebrow" color={colors.teal}>
        Gợi ý để bắt đầu
      </AppText>
      {WELCOME_PROMPTS.map(({ icon: Icon, label, prompt }) => (
        <Pressable key={prompt} accessibilityRole="button" onPress={() => onSelect(prompt)} style={styles.card}>
          <View style={styles.iconMark}>
            <Icon size={18} color={colors.teal} />
          </View>
          <View style={styles.textGroup}>
            <AppText variant="bodyStrong">{label}</AppText>
            <AppText variant="caption" color={colors.muted}>
              {prompt}
            </AppText>
          </View>
          <ChevronRight size={18} color={colors.subtle} />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    gap: spacing.sm,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    backgroundColor: colors.paper,
    padding: spacing.md,
  },
  iconMark: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: colors.mint,
  },
  textGroup: {
    flex: 1,
    gap: spacing.xs / 2,
  },
});

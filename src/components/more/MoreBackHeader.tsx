import { Pressable, StyleSheet, View, ViewStyle } from "react-native";
import { router } from "expo-router";
import { ChevronLeft } from "lucide-react-native";

import { AppText } from "@/src/components/ui";
import { ROUTES } from "@/src/navigation/routes";
import { colors, radius, shadows, spacing } from "@/src/theme/tokens";

type MoreBackHeaderProps = {
  title: string;
  eyebrow?: string;
  backRoute?: string;
  style?: ViewStyle;
};

export function MoreBackHeader({
  title,
  eyebrow = "Mở rộng",
  backRoute = ROUTES.PATIENT.MORE,
  style,
}: MoreBackHeaderProps) {
  function handleBack() {
    router.replace(backRoute as never);
  }

  return (
    <View style={[styles.wrap, style]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Quay lại"
        onPress={handleBack}
        style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
      >
        <ChevronLeft size={22} color={colors.teal} strokeWidth={2.6} />
      </Pressable>
      <View style={styles.copy}>
        <AppText variant="caption" color={colors.subtle} center>
          {eyebrow}
        </AppText>
        <AppText variant="bodyStrong" center numberOfLines={1}>
          {title}
        </AppText>
      </View>
      <View style={styles.balance} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  backButton: {
    width: 46,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(8,127,140,0.22)",
    borderRadius: radius.pill,
    backgroundColor: colors.mint,
    ...shadows.soft,
  },
  backButtonPressed: {
    opacity: 0.86,
    transform: [{ translateY: 1 }],
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  balance: {
    width: 46,
    height: 46,
  },
});

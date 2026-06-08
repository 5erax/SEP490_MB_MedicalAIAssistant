import { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { colors, radius, spacing } from "@/src/theme/tokens";
import { AppText } from "./AppText";

type BadgeTone = "info" | "success" | "warning" | "danger" | "neutral";

type BadgeProps = {
  children: ReactNode;
  tone?: BadgeTone;
};

export function Badge({ children, tone = "info" }: BadgeProps) {
  return (
    <View style={[styles.base, styles[tone]]}>
      <AppText variant="caption" color={toneText[tone]}>
        {children}
      </AppText>
    </View>
  );
}

const toneText = {
  info: colors.teal,
  success: colors.success,
  warning: colors.warning,
  danger: colors.danger,
  neutral: colors.muted,
};

const styles = StyleSheet.create({
  base: {
    alignSelf: "flex-start",
    minHeight: 26,
    justifyContent: "center",
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  info: {
    backgroundColor: colors.mint,
  },
  success: {
    backgroundColor: colors.successBg,
  },
  warning: {
    backgroundColor: colors.warningBg,
  },
  danger: {
    backgroundColor: colors.dangerBg,
  },
  neutral: {
    backgroundColor: colors.paperSoft,
  },
});


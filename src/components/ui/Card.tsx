import { ReactNode } from "react";
import { StyleSheet, View, ViewProps } from "react-native";

import { colors, radius, shadows, spacing } from "@/src/theme/tokens";

type CardProps = ViewProps & {
  children: ReactNode;
  variant?: "hard" | "soft" | "dark";
};

export function Card({ children, variant = "hard", style, ...props }: CardProps) {
  return (
    <View {...props} style={[styles.base, styles[variant], style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.lg,
    padding: spacing.xl,
  },
  hard: {
    borderWidth: 1.5,
    borderColor: colors.ink,
    backgroundColor: colors.paper,
    ...shadows.hard,
  },
  soft: {
    borderWidth: 1,
    borderColor: "rgba(16,20,17,0.12)",
    backgroundColor: "rgba(255,255,255,0.86)",
    ...shadows.soft,
  },
  dark: {
    borderWidth: 1.5,
    borderColor: colors.ink,
    backgroundColor: colors.ink,
  },
});


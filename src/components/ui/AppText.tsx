import { ReactNode } from "react";
import { StyleSheet, Text, TextProps, TextStyle } from "react-native";

import { colors, typography } from "@/src/theme/tokens";

type TextVariant = keyof typeof typography;

type AppTextProps = TextProps & {
  children: ReactNode;
  variant?: TextVariant;
  color?: string;
  center?: boolean;
};

export function AppText({ children, variant = "body", color, center, style, ...props }: AppTextProps) {
  return (
    <Text
      {...props}
      style={[
        styles.base,
        typography[variant] as TextStyle,
        { color: color ?? colors.ink },
        center && styles.center,
        style,
      ]}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    includeFontPadding: false,
  },
  center: {
    textAlign: "center",
  },
});


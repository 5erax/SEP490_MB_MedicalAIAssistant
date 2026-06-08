import { ReactNode } from "react";
import { Pressable, PressableProps, StyleSheet, TextStyle, ViewStyle } from "react-native";
import * as Haptics from "expo-haptics";

import { colors, radius, shadows, spacing, typography } from "@/src/theme/tokens";
import { AppText } from "./AppText";

type ButtonVariant = "primary" | "secondary" | "ghost" | "dark" | "danger";

type ButtonProps = PressableProps & {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: "sm" | "md";
  fullWidth?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
};

export function Button({
  children,
  variant = "primary",
  size = "md",
  fullWidth,
  leftIcon,
  rightIcon,
  style,
  textStyle,
  onPress,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <Pressable
      {...props}
      disabled={disabled}
      onPress={(event) => {
        if (!disabled && variant === "primary") {
          Haptics.selectionAsync();
        }
        onPress?.(event);
      }}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        styles[size],
        fullWidth && styles.fullWidth,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
        style,
      ]}
    >
      {leftIcon}
      <AppText
        variant="bodyStrong"
        color={variant === "dark" || variant === "danger" ? colors.white : colors.ink}
        style={[styles.label, textStyle]}
      >
        {children}
      </AppText>
      {rightIcon}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: spacing.sm,
    borderWidth: 1.5,
    borderColor: colors.ink,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
  },
  md: {
    minHeight: 48,
  },
  sm: {
    minHeight: 38,
    paddingHorizontal: spacing.md,
  },
  primary: {
    backgroundColor: colors.lime,
    ...shadows.hard,
  },
  secondary: {
    backgroundColor: colors.paper,
  },
  ghost: {
    backgroundColor: "rgba(255,255,255,0.76)",
    borderColor: colors.lineStrong,
  },
  dark: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  danger: {
    backgroundColor: colors.danger,
    borderColor: colors.danger,
  },
  fullWidth: {
    alignSelf: "stretch",
  },
  disabled: {
    opacity: 0.48,
  },
  pressed: {
    opacity: 0.86,
    transform: [{ translateY: 1 }],
  },
  label: {
    ...(typography.bodyStrong as TextStyle),
  },
});


import { ReactNode } from "react";
import { Pressable, PressableProps, StyleSheet, TextStyle, ViewStyle } from "react-native";
import * as Haptics from "expo-haptics";

import { colors, radius, spacing, typography } from "@/src/theme/tokens";
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
      accessibilityRole="button"
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
      {typeof children === "string" || typeof children === "number" ? (
        <AppText
          variant="bodyStrong"
          color={variant === "primary" || variant === "dark" || variant === "danger" ? colors.white : colors.ink}
          style={[styles.label, textStyle]}
        >
          {children}
        </AppText>
      ) : (
        // Non-text children (e.g. a <View> row combining an icon + label)
        // must not be nested inside <Text> — React Native only supports
        // <Text> nesting <Text>, not <View>, on native iOS/Android (this
        // renders fine on react-native-web, which is why it can look correct
        // in a browser preview while still being broken on a real device).
        children
      )}
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
    borderWidth: 1,
    borderColor: colors.lineStrong,
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
    borderColor: colors.teal,
    backgroundColor: colors.teal,
    shadowColor: colors.teal,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 18,
    elevation: 3,
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
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
    elevation: 3,
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


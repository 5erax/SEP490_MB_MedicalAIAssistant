import { useState } from "react";
import { StyleSheet, TextInput, TextInputProps, View } from "react-native";

import { colors, radius, spacing, typography } from "@/src/theme/tokens";
import { AppText } from "./AppText";

type TextFieldProps = TextInputProps & {
  label: string;
  error?: string;
  hint?: string;
};

export function TextField({ label, error, hint, style, onBlur, onFocus, ...props }: TextFieldProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.root}>
      <AppText variant="caption" color={error ? colors.danger : colors.muted}>
        {label}
      </AppText>
      <TextInput
        {...props}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
        placeholderTextColor={colors.subtle}
        style={[styles.input, focused && styles.focused, error && styles.error, style]}
      />
      {error ? (
        <AppText variant="caption" color={colors.danger}>
          {error}
        </AppText>
      ) : hint ? (
        <AppText variant="caption" color={colors.subtle}>
          {hint}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: spacing.sm,
  },
  input: {
    minHeight: 48,
    borderWidth: 1.5,
    borderColor: colors.lineStrong,
    borderRadius: radius.md,
    backgroundColor: colors.paper,
    color: colors.ink,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    ...(typography.body as object),
  },
  focused: {
    borderColor: colors.teal,
  },
  error: {
    borderColor: colors.danger,
    backgroundColor: colors.dangerBg,
  },
});


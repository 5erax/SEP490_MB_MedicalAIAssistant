import { useEffect, useState } from "react";
import { StyleSheet, TextInput, TextInputProps, View } from "react-native";

import { colors, radius, spacing, typography } from "@/src/theme/tokens";
import { AppText } from "./AppText";

type TextFieldProps = TextInputProps & {
  label: string;
  error?: string;
  hint?: string;
};

export function TextField({ label, error, hint, style, onBlur, onFocus, onChangeText, value, ...props }: TextFieldProps) {
  const [focused, setFocused] = useState(false);
  const [draftValue, setDraftValue] = useState(typeof value === "string" ? value : "");

  useEffect(() => {
    if (!focused && typeof value === "string") {
      setDraftValue(value);
    }
  }, [focused, value]);

  const inputValue = typeof value === "string" ? draftValue : value;

  return (
    <View style={styles.root}>
      <AppText variant="caption" color={error ? colors.danger : colors.muted}>
        {label}
      </AppText>
      <TextInput
        {...props}
        value={inputValue}
        onChangeText={(text) => {
          if (typeof value === "string") {
            setDraftValue(text);
          }
          onChangeText?.(text);
        }}
        onFocus={(event) => {
          setFocused(true);
          if (typeof value === "string") {
            setDraftValue(value);
          }
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
    borderRadius: radius.sm,
    backgroundColor: colors.paper,
    color: colors.ink,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    ...(typography.body as object),
  },
  focused: {
    borderColor: colors.teal,
    backgroundColor: colors.paperSoft,
  },
  error: {
    borderColor: colors.danger,
    backgroundColor: colors.dangerBg,
  },
});

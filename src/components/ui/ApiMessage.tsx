import { StyleSheet, View } from "react-native";

import { colors, radius, spacing } from "@/src/theme/tokens";
import { AppText } from "./AppText";

type ApiMessageType = "error" | "success" | "warning" | "info";

type ApiMessageProps = {
  type?: ApiMessageType;
  message?: string;
};

export function ApiMessage({ type = "info", message }: ApiMessageProps) {
  if (!message) return null;

  return (
    <View style={[styles.base, styles[type]]}>
      <AppText variant="caption" color={messageTextColor[type]}>
        {message}
      </AppText>
    </View>
  );
}

const messageTextColor = {
  error: colors.danger,
  success: colors.success,
  warning: colors.warning,
  info: colors.teal,
};

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  error: {
    borderColor: "rgba(180,35,24,0.26)",
    backgroundColor: colors.dangerBg,
  },
  success: {
    borderColor: "rgba(21,128,61,0.24)",
    backgroundColor: colors.successBg,
  },
  warning: {
    borderColor: "rgba(180,83,9,0.25)",
    backgroundColor: colors.warningBg,
  },
  info: {
    borderColor: "rgba(8,127,140,0.22)",
    backgroundColor: colors.mint,
  },
});


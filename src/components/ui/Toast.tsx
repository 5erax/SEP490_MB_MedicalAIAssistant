import { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, View } from "react-native";

import { colors, radius, shadows, spacing } from "@/src/theme/tokens";
import { AppText } from "./AppText";

export type ToastTone = "success" | "error" | "warning" | "info";

export type ToastData = {
  id: string;
  type: ToastTone;
  title?: string;
  message: string;
};

type ToastItemProps = {
  toast: ToastData;
  leaving: boolean;
  onDismiss: (id: string) => void;
  onLeft: (id: string) => void;
};

const TONE_ACCENT: Record<ToastTone, string> = {
  success: colors.success,
  error: colors.danger,
  warning: colors.warning,
  info: colors.teal,
};

export function ToastItem({ toast, leaving, onDismiss, onLeft }: ToastItemProps) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(progress, {
      toValue: 1,
      useNativeDriver: true,
      speed: 16,
      bounciness: 6,
    }).start();
  }, [progress]);

  useEffect(() => {
    if (!leaving) return;
    Animated.timing(progress, {
      toValue: 0,
      duration: 180,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) onLeft(toast.id);
    });
  }, [leaving, onLeft, progress, toast.id]);

  return (
    <Animated.View
      style={[
        styles.card,
        {
          borderLeftColor: TONE_ACCENT[toast.type],
          opacity: progress,
          transform: [
            {
              translateY: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [-24, 0],
              }),
            },
          ],
        },
      ]}
    >
      <Pressable
        accessibilityRole="alert"
        onPress={() => onDismiss(toast.id)}
        style={styles.pressable}
        hitSlop={8}
      >
        <View style={styles.textGroup}>
          {toast.title ? (
            <AppText variant="bodyStrong" color={colors.ink}>
              {toast.title}
            </AppText>
          ) : null}
          <AppText variant="caption" color={colors.muted}>
            {toast.message}
          </AppText>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderLeftWidth: 4,
    borderColor: colors.line,
    borderRadius: radius.md,
    backgroundColor: colors.paper,
    ...shadows.soft,
  },
  pressable: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  textGroup: {
    gap: spacing.xs / 2,
  },
});

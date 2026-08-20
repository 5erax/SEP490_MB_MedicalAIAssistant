import { createContext, ReactNode, useCallback, useContext, useMemo, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ToastData, ToastItem, ToastTone } from "@/src/components/ui/Toast";
import { spacing } from "@/src/theme/tokens";

export type ShowToastInput = {
  type?: ToastTone;
  title?: string;
  message: string;
  duration?: number;
};

type ToastContextValue = {
  showToast: (toast: ShowToastInput) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const DEFAULT_DURATION = 3200;

const HAPTIC_BY_TONE: Partial<Record<ToastTone, () => void>> = {
  success: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  error: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
  warning: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),
};

type InternalToast = ToastData & { leaving: boolean };

export function ToastProvider({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const [toasts, setToasts] = useState<InternalToast[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismissToast = useCallback((id: string) => {
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
    setToasts((current) => current.map((toast) => (toast.id === id ? { ...toast, leaving: true } : toast)));
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    ({ type = "info", title, message, duration = DEFAULT_DURATION }: ShowToastInput) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      setToasts((current) => [...current, { id, type, title, message, leaving: false }]);
      HAPTIC_BY_TONE[type]?.();

      const timer = setTimeout(() => dismissToast(id), duration);
      timers.current.set(id, timer);
    },
    [dismissToast],
  );

  const value = useMemo<ToastContextValue>(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <View style={[styles.host, { top: insets.top + spacing.sm }]}>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} leaving={toast.leaving} onDismiss={dismissToast} onLeft={removeToast} />
        ))}
      </View>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const value = useContext(ToastContext);
  if (!value) {
    throw new Error("useToast must be used within ToastProvider");
  }

  return value;
}

const styles = StyleSheet.create({
  host: {
    pointerEvents: "box-none",
    position: "absolute",
    left: spacing.lg,
    right: spacing.lg,
    gap: spacing.sm,
  },
});

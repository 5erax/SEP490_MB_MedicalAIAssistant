import { ReactNode } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AppThemeProvider } from "@/src/theme/ThemeProvider";
import { PendingPaymentRedirect } from "@/src/components/payment/PendingPaymentRedirect";
import { AuthProvider } from "./AuthProvider";
import { PushNotificationProvider } from "./PushNotificationProvider";
import { ToastProvider } from "./ToastProvider";

type AppProvidersProps = {
  children: ReactNode;
  colorScheme?: "light" | "dark" | null;
};

export function AppProviders({ children, colorScheme }: AppProvidersProps) {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppThemeProvider colorScheme={colorScheme}>
          <AuthProvider>
            <PushNotificationProvider>
              <ToastProvider>
                {children}
                <PendingPaymentRedirect />
              </ToastProvider>
            </PushNotificationProvider>
          </AuthProvider>
        </AppThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}


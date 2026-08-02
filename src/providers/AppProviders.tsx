import { ReactNode } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AppThemeProvider } from "@/src/theme/ThemeProvider";
import { AuthProvider } from "./AuthProvider";
import { ToastProvider } from "./ToastProvider";

type AppProvidersProps = {
  children: ReactNode;
  colorScheme?: "light" | "dark" | null;
};

export function AppProviders({ children, colorScheme }: AppProvidersProps) {
  return (
    <SafeAreaProvider>
      <AppThemeProvider colorScheme={colorScheme}>
        <AuthProvider>
          <ToastProvider>{children}</ToastProvider>
        </AuthProvider>
      </AppThemeProvider>
    </SafeAreaProvider>
  );
}


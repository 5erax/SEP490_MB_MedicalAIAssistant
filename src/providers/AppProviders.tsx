import { ReactNode } from "react";

import { AppThemeProvider } from "@/src/theme/ThemeProvider";
import { AuthProvider } from "./AuthProvider";

type AppProvidersProps = {
  children: ReactNode;
  colorScheme?: "light" | "dark" | null;
};

export function AppProviders({ children, colorScheme }: AppProvidersProps) {
  return (
    <AppThemeProvider colorScheme={colorScheme}>
      <AuthProvider>{children}</AuthProvider>
    </AppThemeProvider>
  );
}


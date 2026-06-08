import { createContext, ReactNode, useContext, useMemo } from "react";

import { appTheme, AppTheme } from "./tokens";

type ThemeContextValue = {
  theme: AppTheme;
  colorScheme: "light" | "dark";
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

type AppThemeProviderProps = {
  children: ReactNode;
  colorScheme?: "light" | "dark" | null;
};

export function AppThemeProvider({ children, colorScheme = "light" }: AppThemeProviderProps) {
  const value = useMemo(
    () => ({
      theme: appTheme,
      colorScheme: colorScheme ?? "light",
    }),
    [colorScheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme() {
  const value = useContext(ThemeContext);
  if (!value) {
    throw new Error("useAppTheme must be used within AppThemeProvider");
  }

  return value;
}


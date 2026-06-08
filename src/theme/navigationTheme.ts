import { DarkTheme, DefaultTheme, Theme } from "@react-navigation/native";

import { colors } from "./tokens";

export function createNavigationTheme(colorScheme: "light" | "dark" | null | undefined): Theme {
  const baseTheme = colorScheme === "dark" ? DarkTheme : DefaultTheme;

  return {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      primary: colors.teal,
      background: colors.bg,
      card: colors.paper,
      text: colors.ink,
      border: colors.line,
      notification: colors.lime,
    },
  };
}


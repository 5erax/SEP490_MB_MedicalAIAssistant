import { Platform } from "react-native";

export const colors = {
  bg: "#f7f8f3",
  workspaceBg: "#f4f7ef",
  operatorBg: "#f6f8f3",
  paper: "#ffffff",
  paperSoft: "#fbfcf7",
  ink: "#111412",
  inkStrong: "#101411",
  muted: "rgba(17,20,18,0.68)",
  subtle: "rgba(17,20,18,0.42)",
  line: "#dde4d5",
  lineStrong: "#b9c5ad",
  lime: "#087f8c",
  limeDark: "#05616a",
  mint: "#e7f3f5",
  teal: "#087f8c",
  blue: "#1d4ed8",
  amber: "#d97706",
  coral: "#ef6f61",
  danger: "#b42318",
  dangerBg: "#fff4f2",
  success: "#087f8c",
  successBg: "#e7f3f5",
  warning: "#b45309",
  warningBg: "#fef3c7",
  white: "#ffffff",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 18,
  xl: 22,
  pill: 999,
} as const;

const fontFamily = Platform.select({
  ios: "System",
  android: "sans-serif",
  default: "system-ui",
});

export const typography = {
  h1: {
    fontFamily,
    fontSize: 36,
    lineHeight: 40,
    fontWeight: "800",
    letterSpacing: 0,
  },
  h2: {
    fontFamily,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "800",
    letterSpacing: 0,
  },
  h3: {
    fontFamily,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "700",
  },
  body: {
    fontFamily,
    fontSize: 15,
    lineHeight: 24,
    fontWeight: "400",
  },
  bodyStrong: {
    fontFamily,
    fontSize: 15,
    lineHeight: 24,
    fontWeight: "700",
  },
  caption: {
    fontFamily,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "700",
  },
  eyebrow: {
    fontFamily,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "800",
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
} as const;

export const shadows = {
  hard: {
    shadowColor: colors.ink,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  soft: {
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.08,
    shadowRadius: 30,
    elevation: 3,
  },
} as const;

export const appTheme = {
  colors,
  spacing,
  radius,
  typography,
  shadows,
} as const;

export type AppTheme = typeof appTheme;

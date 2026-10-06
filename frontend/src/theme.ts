// Design tokens for Roundr. Dark-first utility theme.
// Sourced from /app/design_guidelines.json (personality: "7 Dark-First Utility").
//
// The keys match the "color" block of design_guidelines.json. Consumers use
// `useTheme()` or `makeStyles((colors) => ...)`. Never write hex literals in
// components; add new tokens here if a color is missing.

import { useMemo } from "react";
import { Appearance, StyleSheet, useColorScheme } from "react-native";

export type ColorScheme = "light" | "dark";

const dark = {
  // ---------------------------------------------------------------------------
  // Surfaces — nuit de stade : noir bleuté, cartes légèrement plus claires
  // ---------------------------------------------------------------------------
  surface: "#010a0b",
  onSurface: "#f2f8f7",
  surfaceSecondary: "#081718",
  onSurfaceSecondary: "#F4F4F5",
  surfaceTertiary: "#0c1b1c",
  onSurfaceTertiary: "#a5b5b6",
  surfaceInverse: "#FFFFFF",
  onSurfaceInverse: "#000000",
  muted: "#7a8d90",

  // ---------------------------------------------------------------------------
  // Brand: neon green (maquettes Roundr) sur fond quasi noir
  // ---------------------------------------------------------------------------
  brand: "#5ce07d",
  onBrand: "#03110b",
  brandPrimary: "#5ce07d",
  onBrandPrimary: "#03110b",
  brandSecondary: "#22B85A",
  onBrandSecondary: "#03110b",
  brandTertiary: "#00331c",
  onBrandTertiary: "#6FF5A0",

  // Accents des modes (maquettes)
  modeClassique: "#5ce07d",
  modeMaracana: "#2F7BFF",
  modeCup: "#8B5CF6",
  modeSurvie: "#FF8A1F",
  modeCustom: "#6B7280",

  // ---------------------------------------------------------------------------
  // Status
  // ---------------------------------------------------------------------------
  success: "#10B981",
  onSuccess: "#FFFFFF",
  warning: "#F59E0B",
  onWarning: "#FFFFFF",
  error: "#EF4444",
  onError: "#FFFFFF",
  info: "#3B82F6",
  onInfo: "#FFFFFF",

  // ---------------------------------------------------------------------------
  // Lines
  // ---------------------------------------------------------------------------
  border: "#2d3e41",
  borderStrong: "#2d3e41",
  divider: "#2d3e41",
};

export type ThemeColors = typeof dark;

export const defaultScheme = "dark" satisfies ColorScheme;

export const themes: { light?: ThemeColors; dark: ThemeColors } = { dark };

// Design tokens shared across screens.
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  "2xl": 32,
  "3xl": 48,
} as const;

export const radius = {
  sm: 10,
  md: 18,
  lg: 22,
  xl: 28,
  pill: 999,
} as const;

export const fontFamily = {
  display: "ManropeRefined-Bold",
  text: "ManropeRefined-Medium",
  textBold: "ManropeRefined-Bold",
} as const;

export const fontSize = {
  sm: 12,
  base: 14,
  lg: 17,
  xl: 21,
  "2xl": 30,
  "3xl": 48,
  "4xl": 80,
  giant: 140,
} as const;

// Cibles tactiles et hauteurs de contrôles (cohérence inter-écrans).
export const control = {
  chip: 44,
  row: 62,
  button: 50,
  icon: 46,
} as const;

export function setColorScheme(scheme: ColorScheme) {
  Appearance.setColorScheme?.(scheme);
}

// Force dark scheme app-wide for consistency with the pitch-side utility brief.
setColorScheme?.("dark");

export function useTheme(): { scheme: ColorScheme; colors: ThemeColors } {
  const system = useColorScheme();
  const scheme: ColorScheme =
    system === "light" && themes.light ? "light" : "dark";
  return { scheme, colors: themes[scheme] ?? themes.dark };
}

export function makeStyles<
  T extends StyleSheet.NamedStyles<T> | StyleSheet.NamedStyles<any>,
>(
  factory: (colors: ThemeColors) => T & StyleSheet.NamedStyles<any>,
): () => T {
  return function useStyles(): T {
    const { colors } = useTheme();
    return useMemo(() => StyleSheet.create(factory(colors)), [colors]);
  };
}

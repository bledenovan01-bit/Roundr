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
  // Surfaces
  // ---------------------------------------------------------------------------
  surface: "#0B0F0D",
  onSurface: "#FFFFFF",
  surfaceSecondary: "#161B19",
  onSurfaceSecondary: "#F4F4F5",
  surfaceTertiary: "#232A27",
  onSurfaceTertiary: "#E4E4E7",
  surfaceInverse: "#FFFFFF",
  onSurfaceInverse: "#000000",
  muted: "#9AA39F",

  // ---------------------------------------------------------------------------
  // Brand: neon green (maquettes Roundr) sur fond quasi noir
  // ---------------------------------------------------------------------------
  brand: "#3DF27C",
  onBrand: "#06210F",
  brandPrimary: "#3DF27C",
  onBrandPrimary: "#06210F",
  brandSecondary: "#22B85A",
  onBrandSecondary: "#06210F",
  brandTertiary: "#0F2A1A",
  onBrandTertiary: "#6FF5A0",

  // Accents des modes (maquettes)
  modeClassique: "#3DF27C",
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
  border: "#262D2A",
  borderStrong: "#3A433F",
  divider: "#1F2623",
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
  sm: 8,
  md: 14,
  lg: 20,
  pill: 999,
} as const;

export const fontFamily = {
  display: "BarlowCondensed-Bold",
  text: "Manrope-Medium",
  textBold: "Manrope-Bold",
} as const;

export const fontSize = {
  sm: 12,
  base: 14,
  lg: 16,
  xl: 20,
  "2xl": 28,
  "3xl": 48,
  "4xl": 80,
  giant: 140,
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

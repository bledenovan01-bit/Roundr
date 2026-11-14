// Design tokens for Roundr. Dark-first utility theme.
// Personality: "7 Dark-First Utility".
//
// The keys match the "color" block of the original design tokens. Consumers use
// `useTheme()` or `makeStyles((colors) => ...)`. Never write hex literals in
// components; add new tokens here if a color is missing.

import { useMemo, useSyncExternalStore } from "react";
import { Appearance, StyleSheet } from "react-native";
import { subscribeTheme, themeName } from "@/src/visual/lovable";
import type { ImageStyle, TextStyle, ViewStyle } from "react-native";

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

// Light counterpart for the screens still built on these tokens (shared team
// editor, summaries, error screen). Same roles as src/visual/lovable.ts.
const light: ThemeColors = {
  surface: "#f3f6f1",
  onSurface: "#0c1b18",
  surfaceSecondary: "#ffffff",
  onSurfaceSecondary: "#0c1b18",
  surfaceTertiary: "#eef2ec",
  onSurfaceTertiary: "#3f4d48",
  surfaceInverse: "#0c1b18",
  onSurfaceInverse: "#ffffff",
  muted: "#55655f",
  brand: "#17694a",
  onBrand: "#ffffff",
  brandPrimary: "#17694a",
  onBrandPrimary: "#ffffff",
  brandSecondary: "#1f8a4c",
  onBrandSecondary: "#ffffff",
  brandTertiary: "#e3f2e7",
  onBrandTertiary: "#17694a",
  modeClassique: "#17794a",
  modeMaracana: "#1f5fd6",
  modeCup: "#6a3fd0",
  modeSurvie: "#b85a06",
  modeCustom: "#56637a",
  success: "#0f8a5f",
  onSuccess: "#FFFFFF",
  warning: "#9a5600",
  onWarning: "#FFFFFF",
  error: "#c62828",
  onError: "#FFFFFF",
  info: "#1f5fd6",
  onInfo: "#FFFFFF",
  border: "#d6ded5",
  borderStrong: "#c4cec3",
  divider: "#d6ded5",
};

export const defaultScheme = "dark" satisfies ColorScheme;

export const themes: { light: ThemeColors; dark: ThemeColors } = { dark, light };

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
  chip: 48,
  row: 62,
  button: 52,
  icon: 48,
} as const;

export function setColorScheme(scheme: ColorScheme) {
  Appearance.setColorScheme?.(scheme);
}

// Force dark scheme app-wide for consistency with the pitch-side utility brief.
setColorScheme?.("dark");

// The appearance is the user's choice in Settings, not the phone's setting.
export function useTheme(): { scheme: ColorScheme; colors: ThemeColors } {
  const scheme = useSyncExternalStore(subscribeTheme, themeName, themeName);
  return { scheme, colors: themes[scheme] };
}

type NamedStyles<T> = { [P in keyof T]: ViewStyle | TextStyle | ImageStyle };

export function makeStyles<
  T extends NamedStyles<T> | NamedStyles<any>,
>(
  factory: (colors: ThemeColors) => T & NamedStyles<any>,
): () => T {
  return function useStyles(): T {
    const { colors } = useTheme();
    return useMemo(() => StyleSheet.create(factory(colors)), [colors]);
  };
}

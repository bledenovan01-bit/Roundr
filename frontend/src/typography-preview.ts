// Opt-in typography pass: Home, Live, Classic setup and Maracana setup only.
// Keep global theme tokens and all other screens unchanged until approval.
import { createContext } from "react";
import { StyleSheet } from "react-native";

export const TypographyPreview = createContext(false);

export const refinedFontFamily = {
  display: "BarlowCondensed-Bold",
  text: "ManropeRefined-Medium",
  textBold: "ManropeRefined-Bold",
} as const;

export const refinedType = StyleSheet.create({
  pageTitle: { fontFamily: refinedFontFamily.textBold, fontSize: 32, lineHeight: 40, letterSpacing: -0.8 },
  sectionTitle: { fontFamily: refinedFontFamily.textBold, fontSize: 18, lineHeight: 24, letterSpacing: 1 },
  fieldLabel: { fontFamily: refinedFontFamily.textBold, fontSize: 17, lineHeight: 24 },
  control: { fontFamily: refinedFontFamily.textBold, fontSize: 17, lineHeight: 24 },
  tile: { fontFamily: refinedFontFamily.textBold, fontSize: 15, lineHeight: 21 },
  secondary: { fontFamily: refinedFontFamily.text, fontSize: 12, lineHeight: 18 },
  subtitle: { fontFamily: refinedFontFamily.text, fontSize: 13, lineHeight: 19 },
  primaryButton: { fontFamily: refinedFontFamily.textBold, fontSize: 20, lineHeight: 28, letterSpacing: 0 },
  secondaryButton: { fontFamily: refinedFontFamily.textBold, fontSize: 17, lineHeight: 24, letterSpacing: 0 },
});
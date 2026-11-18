import { useState } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { brand, withAlpha } from "@/src/visual/lovable";

const PITCH = require("../../../assets/images/pitch-night.jpg");

/**
 * Night pitch with the ball in the foreground. A photo file, always shown dark:
 * the logo, texts and buttons stay interface components laid over it.
 * `shade` chooses where the dark veil is strongest, to keep text readable.
 */
export function PitchPhoto({
  shade = "left",
  position = "right bottom",
  style,
}: {
  shade?: "left" | "top" | "full";
  position?: "right bottom" | "bottom" | "center";
  style?: StyleProp<ViewStyle>;
}) {
  const ink = (alpha: number) => withAlpha(brand.ink, alpha);
  return (
    <View pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[StyleSheet.absoluteFill, { backgroundColor: brand.ink, overflow: "hidden" }, style]}>
      <Image source={PITCH} contentFit="cover" contentPosition={position} style={StyleSheet.absoluteFill} transition={0} />
      {shade === "left" ? (
        <LinearGradient colors={[ink(0.96), ink(0.82), ink(0.25), ink(0.05)]} locations={[0, 0.38, 0.7, 1]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFill} />
      ) : shade === "top" ? (
        <LinearGradient colors={[ink(1), ink(0.9), ink(0.35), ink(0.1), ink(0.75)]} locations={[0, 0.3, 0.55, 0.8, 1]} style={StyleSheet.absoluteFill} />
      ) : (
        <LinearGradient colors={[ink(0.5), ink(0.38), ink(0.62)]} style={StyleSheet.absoluteFill} />
      )}
    </View>
  );
}

/** Validated HD photo (1024 × 1536), shared by the intro and the home banner. */
export const INTRO_PHOTO = require("../../../assets/images/roundr-intro-hd.png");

/**
 * Home banner: the portrait intro photo laid out horizontally. The photo is
 * sized to the banner width and placed so the big ball sits on the right; a
 * left veil keeps the logo and the slogan on a dark area.
 */
export function HomeBannerPhoto() {
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  const ink = (alpha: number) => withAlpha(brand.ink, alpha);
  // Framing measured on the mockup: photo as wide as the banner, shifted right
  // by 27 %, with the top of the ball (photo row ~990) at 47 % of the banner height.
  const frame = size && (() => {
    const width = size.width * 1.02;
    const k = width / 1024;
    return { width, height: 1536 * k, left: size.width * 0.27, top: size.height * 0.47 - 990 * k };
  })();
  return (
    <View
      testID="home-banner-photo"
      pointerEvents="none"
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      onLayout={e => setSize({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height })}
      style={[StyleSheet.absoluteFill, { backgroundColor: brand.ink, overflow: "hidden" }]}
    >
      {frame ? <Image source={INTRO_PHOTO} contentFit="cover" style={{ position: "absolute", ...frame }} transition={0} /> : null}
      <LinearGradient colors={[ink(1), ink(0.88), ink(0.3), ink(0)]} locations={[0, 0.3, 0.5, 0.66]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFill} />
    </View>
  );
}

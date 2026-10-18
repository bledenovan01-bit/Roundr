import { StyleSheet } from "react-native";
import Svg, { Defs, RadialGradient, Rect, Stop } from "react-native-svg";
import { lovable } from "@/src/visual/lovable";

// The reference's CSS radial gradients, rendered natively rather than as photos.
export function LovableBackground({ intro = false }: { intro?: boolean }) {
  return <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" aria-hidden>
    <Defs><RadialGradient id={intro ? "intro-glow" : "home-glow"} cx="50%" cy={intro ? "0%" : "25%"} rx={intro ? "120%" : "80%"} ry={intro ? "55%" : "30%"}>
      <Stop offset="0" stopColor={intro ? lovable.introGlow : lovable.homeGlow} stopOpacity={intro ? 0.5 : 0.12} />
      <Stop offset={intro ? "65%" : "100%"} stopColor={intro ? lovable.introGlow : lovable.homeGlow} stopOpacity="0" />
    </RadialGradient></Defs>
    <Rect width="100%" height="100%" fill={`url(#${intro ? "intro-glow" : "home-glow"})`} />
  </Svg>;
}

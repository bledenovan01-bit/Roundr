import { useId } from "react";
import { Text, View } from "react-native";
import Svg, { Circle, ClipPath, Defs, G, Path } from "react-native-svg";
import { brand, lovable, lovableFont } from "@/src/visual/lovable";
import geometry from "../../../assets/images/logo-geometry.json";

/** The small green football that replaces the full stop of the logo. */
export function RoundrBall({ size }: { size: number }) {
  const clipId = `ball-${useId().replace(/:/g, "")}`;
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" aria-hidden>
      <Defs><ClipPath id={clipId}><Circle cx={50} cy={50} r={50} /></ClipPath></Defs>
      <Circle cx={50} cy={50} r={50} fill={brand.ball} />
      <G clipPath={`url(#${clipId})`}>
        {geometry.paths.map((path, i) => <Path key={i} d={path.d} fill={path.stroke ? "none" : brand.ink} stroke={path.stroke ? brand.ink : "none"} strokeWidth={geometry.seamWidth} />)}
      </G>
      <Circle cx={50} cy={50} r={50 - geometry.rimWidth / 2} fill="none" stroke={brand.ball} strokeWidth={geometry.rimWidth} />
    </Svg>
  );
}

/**
 * Full logo: "Roundr" with the football in place of the full stop. The ball
 * keeps its green in both themes; `onPhoto` keeps the letters light on a photo.
 */
export function Wordmark({ size = 26, testID, onPhoto = false }: { size?: number; testID?: string; onPhoto?: boolean }) {
  const ball = size * geometry.wordBallRadiusPerSize * 2;
  return (
    <View testID={testID} accessible accessibilityRole="image" accessibilityLabel="Roundr" style={{ flexDirection: "row", alignItems: "flex-end" }}>
      <Text
        maxFontSizeMultiplier={1.2}
        style={{ color: onPhoto ? brand.paper : lovable.foreground, fontFamily: lovableFont.extrabold, fontSize: size, lineHeight: size * 1.1, letterSpacing: 0, includeFontPadding: false }}
      >
        Roundr
      </Text>
      {/* The ball sits on the baseline, which is 0.2 em above the bottom of the line box. */}
      <View style={{ marginLeft: size * geometry.wordGapPerSize, marginBottom: size * 0.17 }}>
        <RoundrBall size={ball} />
      </View>
    </View>
  );
}

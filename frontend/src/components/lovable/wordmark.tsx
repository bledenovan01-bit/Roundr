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
  // The line box is exactly the font's ascent + descent: iOS, Android and the
  // web then all put the baseline DESCENT above the bottom of the text, so the
  // bottom of the ball sits on the baseline of the "r", as in the icon.
  const line = size * (MANROPE_ASCENT + MANROPE_DESCENT);
  return (
    <View
      testID={testID}
      accessible
      accessibilityRole="image"
      accessibilityLabel="Roundr"
      // Keeps the former 1.1 em footprint in the screens' layouts.
      style={{ flexDirection: "row", alignItems: "flex-end", marginVertical: -(line - size * 1.1) / 2 }}
    >
      <Text
        allowFontScaling={false}
        style={{ color: onPhoto ? brand.paper : lovable.foreground, fontFamily: lovableFont.extrabold, fontSize: size, lineHeight: line, letterSpacing: geometry.letterSpacingEm * size, includeFontPadding: false }}
      >
        Roundr
      </Text>
      <View style={{ marginLeft: size * geometry.wordGapPerSize, marginBottom: size * MANROPE_DESCENT }}>
        <RoundrBall size={ball} />
      </View>
    </View>
  );
}

/** Manrope Refined ExtraBold vertical metrics (hhea = typo = win), in em. */
const MANROPE_ASCENT = 2132 / 2000;
const MANROPE_DESCENT = 600 / 2000;

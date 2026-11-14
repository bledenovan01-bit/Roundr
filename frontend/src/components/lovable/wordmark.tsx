import { Text, View } from "react-native";
import Svg, { Circle, Line, Polygon } from "react-native-svg";
import { brand, lovable, lovableFont } from "@/src/visual/lovable";

// Geometry shared with scripts/generate-brand-assets.cjs (icon, splash, favicon).
const BALL_RADIUS = 0.13; // per unit of type size
const BALL_GAP = 0.035;

/** The small green football that replaces the full stop of the logo. */
export function RoundrBall({ size }: { size: number }) {
  const r = 50;
  const at = (deg: number, k: number) => {
    const a = ((deg - 90) * Math.PI) / 180;
    return [50 + Math.cos(a) * r * k, 50 + Math.sin(a) * r * k] as const;
  };
  const p = (xy: readonly [number, number]) => `${xy[0].toFixed(2)},${xy[1].toFixed(2)}`;
  const spokes = [0, 72, 144, 216, 288];
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" aria-hidden>
      <Circle cx={50} cy={50} r={r} fill={brand.ball} />
      <Polygon points={spokes.map((a) => p(at(a, 0.36))).join(" ")} fill={brand.ink} />
      {spokes.map((a) => (
        <Line key={`l${a}`} x1={at(a, 0.36)[0]} y1={at(a, 0.36)[1]} x2={at(a, 0.7)[0]} y2={at(a, 0.7)[1]} stroke={brand.ink} strokeWidth={5} strokeLinecap="round" />
      ))}
      {spokes.map((a) => (
        <Polygon key={`p${a}`} points={`${p(at(a, 0.68))} ${p(at(a - 19, 1))} ${p(at(a + 19, 1))}`} fill={brand.ink} />
      ))}
    </Svg>
  );
}

/**
 * Full logo: "Roundr" with the football in place of the full stop. The ball
 * keeps its green in both themes; `onPhoto` keeps the letters light on a photo.
 */
export function Wordmark({ size = 26, testID, onPhoto = false }: { size?: number; testID?: string; onPhoto?: boolean }) {
  const ball = size * BALL_RADIUS * 2;
  return (
    <View testID={testID} accessible accessibilityRole="image" accessibilityLabel="Roundr" style={{ flexDirection: "row", alignItems: "flex-end" }}>
      <Text
        maxFontSizeMultiplier={1.2}
        style={{ color: onPhoto ? brand.paper : lovable.foreground, fontFamily: lovableFont.extrabold, fontSize: size, lineHeight: size * 1.1, letterSpacing: -0.03 * size, includeFontPadding: false }}
      >
        Roundr
      </Text>
      {/* The ball sits on the baseline, which is 0.2 em above the bottom of the line box. */}
      <View style={{ marginLeft: size * BALL_GAP, marginBottom: size * 0.17 }}>
        <RoundrBall size={ball} />
      </View>
    </View>
  );
}

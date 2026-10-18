// Affichage analogique du chrono (Chrono libre, Phase 3). Cadran + aiguilles
// (minutes + secondes). Présentation seulement — ne calcule aucun temps.
import { View } from "react-native";
import Svg, { Circle, Line, G } from "react-native-svg";
import { ChronoTime } from "./chrono-time";
import { fontFamily, makeStyles, useTheme } from "@/src/theme";

export function AnalogChrono({ totalMs, time, size = 220 }: { totalMs: number; time: string; size?: number }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const r = size / 2;
  const cx = r, cy = r;
  const sec = (totalMs / 1000) % 60;
  const min = (totalMs / 60000) % 60;
  const secAngle = (sec / 60) * 360;
  const minAngle = (min / 60) * 360;
  const hand = (angleDeg: number, length: number, width: number, color: string, key: string) => {
    const a = ((angleDeg - 90) * Math.PI) / 180;
    return <Line key={key} x1={cx} y1={cy} x2={cx + Math.cos(a) * length} y2={cy + Math.sin(a) * length} stroke={color} strokeWidth={width} strokeLinecap="round" />;
  };
  const ticks = Array.from({ length: 12 }, (_, i) => {
    const a = ((i * 30 - 90) * Math.PI) / 180;
    const outer = r - 6, inner = r - 14;
    return <Line key={i} x1={cx + Math.cos(a) * inner} y1={cy + Math.sin(a) * inner} x2={cx + Math.cos(a) * outer} y2={cy + Math.sin(a) * outer} stroke={colors.border} strokeWidth={2} />;
  });
  return (
    <View style={styles.wrap}>
      <Svg width={size} height={size}>
        <Circle cx={cx} cy={cy} r={r - 3} stroke={colors.borderStrong} strokeWidth={2} fill={colors.surfaceSecondary} />
        <G>{ticks}</G>
        {hand(minAngle, r * 0.5, 4, colors.onSurface, "min")}
        {hand(secAngle, r * 0.72, 2.5, colors.brandPrimary, "sec")}
        <Circle cx={cx} cy={cy} r={5} fill={colors.brandPrimary} />
      </Svg>
      <ChronoTime time={time} style={styles.time} ccStyle={styles.cc} />
    </View>
  );
}

const useStyles = makeStyles(c => ({
  wrap: { alignItems: "center", gap: 10 },
  time: { fontFamily: fontFamily.textBold, fontSize: 30, color: c.onSurface, fontVariant: ["tabular-nums"] },
  cc: { fontFamily: fontFamily.textBold, fontSize: 16, color: c.onSurfaceTertiary, fontVariant: ["tabular-nums"] },
}));

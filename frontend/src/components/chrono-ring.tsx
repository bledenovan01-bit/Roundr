// Anneau de progression + chrono géant (maquette live).
import { Text, View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";

import { fontFamily, fontSize, makeStyles, useTheme } from "@/src/theme";

type Props = {
  time: string;
  caption: string;
  status: string;
  progress: number; // 0..1
  size?: number;
  accent?: string;
  testID?: string;
};

export function ChronoRing({ time, caption, status, progress, size = 280, accent, testID }: Props) {
  const styles = useStyles();
  const { colors } = useTheme();
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const p = Math.min(1, Math.max(0, progress));
  // Cercle tracé depuis midi dans le sens horaire (pas de rotation : évite
  // les propriétés de transformation non supportées sur certaines plateformes).
  const ringPath = `M ${size / 2} ${size / 2 - r} A ${r} ${r} 0 0 1 ${size / 2} ${size / 2 + r} A ${r} ${r} 0 0 1 ${size / 2} ${size / 2 - r}`;
  const base = Math.min(fontSize["4xl"], size * 0.36);
  const fontScale = time.length > 5 ? 0.7 : 1;
  return (
    <View style={[styles.wrap, { width: size, height: size }]} testID={testID}>
      <Svg width={size} height={size} style={styles.svg}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={colors.surfaceTertiary} strokeWidth={stroke} fill="none" />
        <Path
          d={ringPath}
          stroke={accent ?? colors.brandPrimary}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${c} ${c}`}
          strokeDashoffset={c * (1 - p)}
        />
      </Svg>
      <Text style={styles.caption}>{caption.toUpperCase()}</Text>
      <Text style={[styles.time, { fontSize: base * fontScale, lineHeight: base * fontScale * 1.05 }]} testID="live-time">
        {time}
      </Text>
      <Text style={styles.status} numberOfLines={1}>{status}</Text>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  wrap: { alignItems: "center", justifyContent: "center", alignSelf: "center" },
  svg: { position: "absolute", top: 0, left: 0 },
  caption: { fontFamily: fontFamily.textBold, fontSize: fontSize.sm, letterSpacing: 2.5, color: colors.muted },
  time: {
    fontFamily: fontFamily.display,
    color: colors.onSurface,
    letterSpacing: 1,
    // @ts-ignore react-native fontVariant tuple
    fontVariant: ["tabular-nums"],
  },
  status: { fontFamily: fontFamily.text, fontSize: fontSize.sm, color: colors.muted, maxWidth: 140, textAlign: "center" },
}));

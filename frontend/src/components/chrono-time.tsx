// Affichage du chrono avec centièmes en petit suffixe (réf. Lovable).
// Le "MM:SS" reste dominant ; les centièmes ".cc" sont rendus plus petits et
// dé-emphasés, toujours visibles quand ils sont fournis. Vue de présentation
// uniquement : ne calcule aucun temps.
import { Text, type StyleProp, type TextStyle } from "react-native";

// Sépare un éventuel suffixe ".dd" (2 chiffres) à la fin de la chaîne.
// "15:00.00" -> { base: "15:00", cc: "00" } ; "+06:58.42" -> { "+06:58", "42" }.
// "15:00" / "TAB" -> { base, cc: null }.
export function splitChrono(time: string): { base: string; cc: string | null } {
  const m = /^(.*)\.(\d{2})$/.exec(time);
  if (m) return { base: m[1], cc: m[2] };
  return { base: time, cc: null };
}

type Props = {
  time: string;
  style?: StyleProp<TextStyle>;
  ccStyle?: StyleProp<TextStyle>;
  testID?: string;
  numberOfLines?: number;
  adjustsFontSizeToFit?: boolean;
  minimumFontScale?: number;
  maxFontSizeMultiplier?: number;
  accessibilityLabel?: string;
};

export function ChronoTime({
  time,
  style,
  ccStyle,
  testID,
  numberOfLines,
  adjustsFontSizeToFit,
  minimumFontScale,
  maxFontSizeMultiplier,
  accessibilityLabel,
}: Props) {
  const { base, cc } = splitChrono(time);
  return (
    <Text
      testID={testID}
      numberOfLines={numberOfLines}
      adjustsFontSizeToFit={adjustsFontSizeToFit}
      minimumFontScale={minimumFontScale}
      maxFontSizeMultiplier={maxFontSizeMultiplier}
      accessibilityLabel={accessibilityLabel ?? time}
      style={style}
    >
      {base}
      {cc != null ? <Text style={ccStyle}>.{cc}</Text> : null}
    </Text>
  );
}

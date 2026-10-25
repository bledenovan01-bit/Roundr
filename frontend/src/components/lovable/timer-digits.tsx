import { useState } from "react";
import { Text, View } from "react-native";
import { lovable as c, lovableFont as f } from "@/src/visual/lovable";

// Presentation only. Reserve space for the complete suffix before fitting the
// main readout; React Native Web does not implement adjustsFontSizeToFit.
export function TimerDigits({ main, cents, size, ratio = 0.42, ring = false, testID, centsTestID }: {
  main: string; cents: string; size: number; ratio?: number; ring?: boolean;
  testID?: string; centsTestID?: string;
}) {
  const [width, setWidth] = useState(0);
  const emWidth = (text: string) => [...text].reduce((sum, char) => sum + (char === ":" || char === "." ? 0.3 : 0.68), 0);
  const fitted = width > 0
    ? Math.max(1, Math.min(size, (width - 4) / (emWidth(main) + emWidth(cents) * ratio)))
    : size;
  return <View testID={testID} accessibilityLabel={main + cents}
    onLayout={e => setWidth(e.nativeEvent.layout.width)}
    style={{ width: "100%", maxWidth: ring ? "82%" : "100%", alignSelf: "center", flexDirection: "row", alignItems: "baseline", justifyContent: "center" }}>
    <Text numberOfLines={1} maxFontSizeMultiplier={1} style={{ fontFamily: f.extrabold, fontSize: fitted, lineHeight: fitted * 1.35, color: c.foreground, letterSpacing: ring ? 0 : -fitted * 0.01, fontVariant: ["tabular-nums"] }}>{main}</Text>
    <Text testID={centsTestID} numberOfLines={1} maxFontSizeMultiplier={1} style={{ fontFamily: f.extrabold, fontSize: fitted * ratio, lineHeight: fitted * ratio * 1.35, color: c.muted, marginLeft: 1, fontVariant: ["tabular-nums"] }}>{cents}</Text>
  </View>;
}

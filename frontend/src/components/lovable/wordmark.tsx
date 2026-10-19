import { Text } from "react-native";
import { lovable, lovableFont } from "@/src/visual/lovable";

export function Wordmark({ size = 26, testID }: { size?: number; testID?: string }) {
  return <Text testID={testID} accessibilityLabel="Roundr" style={{ color: lovable.foreground, fontFamily: lovableFont.extrabold, fontSize: size, lineHeight: size, letterSpacing: -0.03 * size, includeFontPadding: false }}>Roundr<Text style={{ color: lovable.primary }}>.</Text></Text>;
}

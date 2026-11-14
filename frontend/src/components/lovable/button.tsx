import { Pressable, StyleSheet, Text } from "react-native";
import * as Haptics from "@/src/haptics";
import { brand, lovable, lovableFont, withAlpha, themed } from "@/src/visual/lovable";
import { LovableIcon } from "./icon";

// `onPhoto` keeps the bright brand green and dark label of the night pitch, in both themes.
export function LovableButton({ label, onPress, landscape = false, testID, onPhoto = false }: { label: string; onPress: () => void; landscape?: boolean; testID?: string; onPhoto?: boolean }) {
  const ink = onPhoto ? brand.ink : lovable.onPrimary;
  return <Pressable testID={testID} accessibilityRole="button" accessibilityLabel={label} onPress={() => { Haptics.selectionAsync().catch(() => {}); onPress(); }} style={({ pressed }) => [styles.button, onPhoto && styles.onPhoto, landscape && styles.landscape, pressed && styles.pressed]}>
    <Text style={[styles.label, { color: ink }]}>{label}</Text><LovableIcon name="chevron" color={ink} />
  </Pressable>;
}

const styles = themed(() => (StyleSheet.create({
  button: { width: "100%", minHeight: 58, borderRadius: 16, backgroundColor: lovable.primary, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingHorizontal: 16, paddingVertical: 8, boxShadow: [{ offsetX: 0, offsetY: 14, blurRadius: 36, spreadDistance: -10, color: withAlpha(lovable.primary, 0.7) }] },
  onPhoto: { backgroundColor: brand.ball, boxShadow: [{ offsetX: 0, offsetY: 14, blurRadius: 36, spreadDistance: -10, color: withAlpha(brand.ball, 0.5) }] },
  landscape: { maxWidth: 420, minHeight: 48 },
  label: { fontFamily: lovableFont.extrabold, color: lovable.onPrimary, fontSize: 16, lineHeight: 160 / 7, includeFontPadding: false },
  pressed: { transform: [{ scale: 0.97 }] },
})));

import { Pressable, StyleSheet, Text } from "react-native";
import * as Haptics from "@/src/haptics";
import { lovable, lovableFont, withAlpha } from "@/src/visual/lovable";
import { LovableIcon } from "./icon";

export function LovableButton({ label, onPress, landscape = false, testID }: { label: string; onPress: () => void; landscape?: boolean; testID?: string }) {
  return <Pressable testID={testID} accessibilityRole="button" accessibilityLabel={label} onPress={() => { Haptics.selectionAsync().catch(() => {}); onPress(); }} style={({ pressed }) => [styles.button, landscape && styles.landscape, pressed && styles.pressed]}>
    <Text style={styles.label}>{label}</Text><LovableIcon name="chevron" color={lovable.onPrimary} />
  </Pressable>;
}

const styles = StyleSheet.create({
  button: { width: "100%", minHeight: 58, borderRadius: 16, backgroundColor: lovable.primary, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingHorizontal: 16, paddingVertical: 8, boxShadow: [{ offsetX: 0, offsetY: 14, blurRadius: 36, spreadDistance: -10, color: withAlpha(lovable.primary, 0.7) }] },
  landscape: { maxWidth: 420, minHeight: 48 },
  label: { fontFamily: lovableFont.extrabold, color: lovable.onPrimary, fontSize: 16, lineHeight: 160 / 7, includeFontPadding: false },
  pressed: { transform: [{ scale: 0.97 }] },
});

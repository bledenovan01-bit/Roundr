import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from "react-native";
import * as Haptics from "@/src/haptics";
import { brand, lovable, lovableFont, withAlpha, themed } from "@/src/visual/lovable";
import { LovableIcon, type LovableIconName } from "./lovable/icon";

type Props = {
  title: string;
  description?: string;
  icon: LovableIconName;
  /** Colour of the icon tile. With `solid`, the tile is filled and the pictogram is light. */
  accent: string;
  solid?: boolean;
  onPress: () => void;
  testID: string;
  quiet?: boolean;
  resume?: boolean;
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  onLayout?: (event: LayoutChangeEvent) => void;
};

// Shared home tile. No entrance animation: all cards appear together.
export function ModeCard({ title, description, icon, accent, solid, onPress, testID, quiet, resume, children, style, onLayout }: Props) {
  const tile = solid
    ? { backgroundColor: accent, borderColor: accent }
    : resume
      ? { backgroundColor: "transparent", borderColor: lovable.primary, borderRadius: 23 }
      : { backgroundColor: withAlpha(accent, 0.16), borderColor: withAlpha(accent, 0.35) };
  const pictogram = solid ? brand.paper : resume ? lovable.primary : quiet || icon === "timer" ? lovable.muted : accent;
  return <Pressable testID={testID} onLayout={onLayout} accessibilityRole="button" accessibilityLabel={children ? undefined : `${title}. ${description ?? ""}`} onPress={() => { Haptics.selectionAsync().catch(() => {}); onPress(); }} style={({ pressed }) => [styles.card, quiet && styles.quiet, resume && styles.resume, style, pressed && styles.pressed]}>
    <View style={[styles.icon, tile]}>
      <LovableIcon name={icon} size={solid ? 22 : 18} color={pictogram} />
    </View>
    <View style={styles.copy}>
      <Text testID={`${testID}-title`} style={[styles.title, resume && { color: lovable.primary }]}>{title}</Text>
      {description ? <Text testID={`${testID}-description`} style={styles.description}>{description}</Text> : null}
      {children}
    </View>
    <LovableIcon name="chevron" color={lovable.muted} />
  </Pressable>;
}

export const homeCopyStyles = themed(() => (StyleSheet.create({
  detail: { fontFamily: lovableFont.regular, fontSize: 13, lineHeight: 18, color: lovable.muted, includeFontPadding: false },
  state: { fontFamily: lovableFont.semibold, color: lovable.amber },
  action: { fontFamily: lovableFont.extrabold, color: lovable.primary, marginTop: 5 },
})));

const styles = themed(() => (StyleSheet.create({
  card: { minHeight: 68, flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 18, backgroundColor: lovable.card, borderColor: lovable.border, borderWidth: 1 },
  quiet: { backgroundColor: "transparent" },
  resume: { backgroundColor: lovable.resume, borderColor: withAlpha(lovable.primary, 0.45) },
  pressed: { transform: [{ scale: 0.97 }] },
  icon: { width: 46, height: 46, borderRadius: 13, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  copy: { flex: 1, minWidth: 0, gap: 2 },
  title: { fontFamily: lovableFont.extrabold, fontSize: 16, lineHeight: 22, color: lovable.foreground, includeFontPadding: false },
  description: { fontFamily: lovableFont.regular, fontSize: 13, lineHeight: 18, color: lovable.muted, includeFontPadding: false },
})));

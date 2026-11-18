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
  /** Shows a "?" button that explains the mode without opening it. */
  onHelp?: () => void;
  testID: string;
  quiet?: boolean;
  resume?: boolean;
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  onLayout?: (event: LayoutChangeEvent) => void;
};

// Shared home tile. No entrance animation: all cards appear together.
export function ModeCard({ title, description, icon, accent, solid, onPress, onHelp, testID, quiet, resume, children, style, onLayout }: Props) {
  const tile = solid
    ? { backgroundColor: accent, borderColor: accent }
    : resume
      ? { backgroundColor: "transparent", borderColor: lovable.primary, borderRadius: 23 }
      : { backgroundColor: withAlpha(accent, 0.16), borderColor: withAlpha(accent, 0.35) };
  const pictogram = solid ? brand.paper : resume ? lovable.primary : quiet || icon === "timer" ? lovable.muted : accent;
  const content = <>
    <View style={[styles.icon, tile]}>
      <LovableIcon name={icon} size={solid ? 22 : 18} color={pictogram} />
    </View>
    <View style={styles.copy}>
      <Text testID={`${testID}-title`} style={[styles.title, resume && { color: lovable.primary }]}>{title}</Text>
      {description ? <Text testID={`${testID}-description`} style={styles.description}>{description}</Text> : null}
      {children}
    </View>
    {/* Mode choice cards show only the help "?" on the right, no chevron. */}
    {onHelp ? null : <LovableIcon name="chevron" color={lovable.muted} />}
  </>;
  const press = () => { Haptics.selectionAsync().catch(() => {}); onPress(); };
  const label = children ? undefined : `${title}. ${description ?? ""}`;
  if (!onHelp) return <Pressable testID={testID} onLayout={onLayout} accessibilityRole="button" accessibilityLabel={label} onPress={press} style={({ pressed }) => [styles.card, quiet && styles.quiet, resume && styles.resume, style, pressed && styles.pressed]}>
    {content}
  </Pressable>;
  // The help button sits beside the card action, never inside it: a button
  // nested in a button is invalid on the web and steals the tap on native.
  return <View onLayout={onLayout} style={[styles.card, styles.split, quiet && styles.quiet, resume && styles.resume, style]}>
    <Pressable testID={testID} accessibilityRole="button" accessibilityLabel={label} onPress={press} style={({ pressed }) => [styles.main, pressed && styles.pressed]}>
      {content}
    </Pressable>
    <Pressable testID={`${testID}-help`} accessibilityRole="button" accessibilityLabel={`Comment fonctionne ${title}`} onPress={onHelp} style={({ pressed }) => [styles.help, pressed && styles.pressed]}>
      {/* Small visual mark, full 44 pt touch area. */}
      <View style={styles.helpMark}><Text style={styles.helpText}>?</Text></View>
    </Pressable>
  </View>;
}

export const homeCopyStyles = themed(() => (StyleSheet.create({
  detail: { fontFamily: lovableFont.regular, fontSize: 13, lineHeight: 18, color: lovable.muted, includeFontPadding: false },
  state: { fontFamily: lovableFont.semibold, color: lovable.amber },
  action: { fontFamily: lovableFont.extrabold, color: lovable.primary, marginTop: 5 },
})));

const styles = themed(() => (StyleSheet.create({
  card: { minHeight: 68, flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 18, backgroundColor: lovable.card, borderColor: lovable.border, borderWidth: 1 },
  split: { paddingVertical: 0, paddingLeft: 0, paddingRight: 8, gap: 4 },
  main: { flex: 1, minWidth: 0, minHeight: 66, flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 10, paddingLeft: 12, paddingRight: 4 },
  quiet: { backgroundColor: "transparent" },
  resume: { backgroundColor: lovable.resume, borderColor: withAlpha(lovable.primary, 0.45) },
  pressed: { transform: [{ scale: 0.97 }] },
  icon: { width: 46, height: 46, borderRadius: 13, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  copy: { flex: 1, minWidth: 0, gap: 2 },
  title: { fontFamily: lovableFont.extrabold, fontSize: 16, lineHeight: 22, color: lovable.foreground, includeFontPadding: false },
  description: { fontFamily: lovableFont.regular, fontSize: 13, lineHeight: 18, color: lovable.muted, includeFontPadding: false },
  help: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  helpMark: { width: 24, height: 24, borderRadius: 12, borderWidth: 1, borderColor: withAlpha(lovable.foreground, 0.28), alignItems: "center", justifyContent: "center" },
  helpText: { fontFamily: lovableFont.extrabold, fontSize: 12, lineHeight: 15, color: lovable.foreground, includeFontPadding: false },
})));

import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from "react-native";
import * as Haptics from "@/src/haptics";
import { lovable, lovableFont, withAlpha } from "@/src/visual/lovable";
import { LovableIcon, type LovableIconName } from "./lovable/icon";

type Props = {
  title: string;
  description?: string;
  icon: LovableIconName;
  accent: string;
  onPress: () => void;
  testID: string;
  quiet?: boolean;
  resume?: boolean;
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  onLayout?: (event: LayoutChangeEvent) => void;
};

// Shared home tile: exact frozen-reference spacing and icon geometry.
// No entrance animation: Lovable displays all cards together.
export function ModeCard({ title, description, icon, accent, onPress, testID, quiet, resume, children, style, onLayout }: Props) {
  return <Pressable testID={testID} onLayout={onLayout} accessibilityRole="button" accessibilityLabel={children ? undefined : `${title}. ${description ?? ""}`} onPress={() => { Haptics.selectionAsync().catch(() => {}); onPress(); }} style={({ pressed }) => [styles.card, quiet && styles.quiet, resume && styles.resume, style, pressed && styles.pressed]}>
    <View style={[styles.icon, { backgroundColor: withAlpha(accent, 0.16), borderColor: withAlpha(accent, 0.35) }]}>
      <LovableIcon name={icon} color={quiet || icon === "timer" ? lovable.muted : accent} />
    </View>
    <View style={styles.copy}>
      <Text testID={`${testID}-title`} style={styles.title}>{title}</Text>
      {description ? <Text testID={`${testID}-description`} style={styles.description}>{description}</Text> : null}
      {children}
    </View>
    <LovableIcon name="chevron" color={lovable.muted} />
  </Pressable>;
}

export const homeCopyStyles = StyleSheet.create({
  detail: { fontFamily: lovableFont.semibold, fontSize: 12, lineHeight: 120 / 7, color: lovable.muted, includeFontPadding: false },
  state: { color: lovable.amber },
  action: { fontFamily: lovableFont.extrabold, color: lovable.primary, marginTop: 5 },
});

const styles = StyleSheet.create({
  card: { minHeight: 76, flexDirection: "row", alignItems: "center", gap: 14, padding: 14, borderRadius: 18, backgroundColor: lovable.card, borderColor: lovable.border, borderWidth: 1 },
  quiet: { backgroundColor: "transparent" },
  resume: { backgroundColor: lovable.resume, borderColor: withAlpha(lovable.primary, 0.45) },
  pressed: { transform: [{ scale: 0.97 }] },
  icon: { width: 46, height: 46, borderRadius: 14, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  copy: { flex: 1, minWidth: 0, gap: 3 },
  title: { fontFamily: lovableFont.extrabold, fontSize: 15, lineHeight: 150 / 7, color: lovable.foreground, includeFontPadding: false },
  description: homeCopyStyles.detail,
});

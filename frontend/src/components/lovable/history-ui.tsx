import type { ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LovableIcon, type LovableIconName } from "./icon";
import { LovableBackground } from "./background";
import { lovable as c, lovableFont as f } from "@/src/visual/lovable";

// Opt-in frozen Screen/CTA geometry. Other native screens keep their components.
export function HistoryScreenFrame({ title, subtitle, accent, onBack, children, footer }: { title: string; subtitle: string; accent?: string; onBack: () => void; children: ReactNode; footer?: ReactNode }) {
  const { width, height, fontScale } = useWindowDimensions(), inset = useSafeAreaInsets();
  const landscape = width > height;
  const two = landscape && width - inset.left - inset.right >= 600 && fontScale <= 1.5;
  return <View testID="history-screen" style={{ flex: 1, backgroundColor: c.background }}>
    <LovableBackground />
    <View style={[h.header, { paddingTop: inset.top + (landscape ? 10 : 18), paddingBottom: landscape ? 4 : 10, paddingLeft: inset.left + 20, paddingRight: inset.right + 20 }]}>
      <Pressable accessibilityRole="button" accessibilityLabel="Retour" onPress={onBack} style={h.back}><LovableIcon name="back" color={c.foreground} size={20} /></Pressable>
      <View style={{ flex: 1 }}><Text accessibilityRole="header" numberOfLines={1} style={h.title}>{title}</Text><Text style={[h.subtitle, accent ? { color: accent } : null]}>{subtitle}</Text></View><View style={{ width: 44 }} />
    </View>
    <ScrollView testID="history-scroll" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: 6, paddingLeft: inset.left + 20, paddingRight: inset.right + 20, paddingBottom: Math.max(16, inset.bottom), gap: 12, flexDirection: "row", flexWrap: "wrap", alignItems: "flex-start" }}>
      {Array.isArray(children) ? children.flat(Infinity).filter(Boolean).map((child, i) => <View key={i} style={{ width: two ? (width - inset.left - inset.right - 52) / 2 : "100%" }}>{child}</View>) : children}
    </ScrollView>
    {footer ? <View style={{ paddingLeft: 20 + (landscape ? inset.left : 0), paddingRight: 20 + (landscape ? inset.right : 0), paddingTop: landscape ? 8 : 12, paddingBottom: Math.max(inset.bottom, landscape ? 10 : 16), alignItems: "center" }}><View style={{ width: landscape ? undefined : "100%", maxWidth: landscape ? 420 : undefined, gap: landscape ? 4 : 8 }}>{footer}</View></View> : null}
  </View>;
}
export function HistoryAction({ label, icon, onPress, variant = "primary", disabled, testID, fitContent = false }: { label: string; icon?: LovableIconName; onPress: () => void; variant?: "primary" | "secondary" | "ghost" | "danger"; disabled?: boolean; testID?: string; fitContent?: boolean }) {
  const color = variant === "primary" ? c.onPrimary : variant === "danger" ? c.foreground : variant === "ghost" ? c.muted : c.foreground;
  return <Pressable testID={testID} accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} style={({ pressed }) => [h.action, { width: fitContent ? undefined : "100%", minHeight: variant === "ghost" ? 44 : variant === "secondary" ? 50 : 56, backgroundColor: variant === "primary" ? c.primary : variant === "danger" ? c.error : variant === "secondary" ? c.cardRaised : "transparent", opacity: disabled ? 0.55 : 1, borderWidth: variant === "secondary" ? 1 : 0, borderColor: c.border }, pressed && { transform: [{ scale: 0.97 }] }]}>
    {icon ? <LovableIcon name={icon} color={color} /> : null}<Text style={{ fontFamily: variant === "primary" || variant === "danger" ? f.extrabold : "ManropeRefined-Bold", fontSize: variant === "primary" || variant === "danger" ? 16 : 14, lineHeight: 20, color, textAlign: "center", flexShrink: 1 }}>{label}</Text>
  </Pressable>;
}
export const h = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", gap: 8 },
  back: { width: 44, minHeight: 44, borderRadius: 14, backgroundColor: c.cardRaised, borderWidth: 1, borderColor: c.border, alignItems: "center", justifyContent: "center" },
  title: { fontFamily: f.extrabold, fontSize: 20, lineHeight: 30, textAlign: "center", color: c.foreground, includeFontPadding: false },
  subtitle: { fontFamily: f.semibold, fontSize: 12, lineHeight: 18, marginTop: 2, textAlign: "center", color: c.muted, includeFontPadding: false },
  card: { padding: 14, borderWidth: 1, borderColor: c.border, borderRadius: 18, backgroundColor: c.card, gap: 12 },
  heading: { fontFamily: f.extrabold, fontSize: 15, lineHeight: 22.5, color: c.foreground, includeFontPadding: false },
  hint: { fontFamily: f.semibold, fontSize: 12, lineHeight: 18, color: c.muted, includeFontPadding: false },
  eyebrow: { fontFamily: f.extrabold, fontSize: 11, lineHeight: 16.5, letterSpacing: 1.32, color: c.muted, includeFontPadding: false },
  error: { fontFamily: f.semibold, fontSize: 12, lineHeight: 18, color: c.error },
  text: { fontFamily: f.semibold, fontSize: 14, lineHeight: 21, color: c.foreground, includeFontPadding: false },
  action: { width: "100%", borderRadius: 16, paddingHorizontal: 16, paddingVertical: 8, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8 },
  row: { flexDirection: "row", gap: 10, alignItems: "center" },
});

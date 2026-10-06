import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fontFamily, makeStyles, useTheme } from "@/src/theme";
import { layoutStyles, useScreenLayout } from "@/src/layout";

export function DesignScreen({ title, subtitle, children, footer, testID }: { title: string; subtitle?: string; children: React.ReactNode; footer?: React.ReactNode; testID?: string }) {
  const styles = useDesignStyles();
  const insets = useSafeAreaInsets();
  const { safeSides } = useScreenLayout();
  const router = useRouter();
  const screenTestID = testID ?? `screen-${title.toLowerCase().replace(/[^a-z0-9]+/gi, "-")}`;
  return <KeyboardAvoidingView testID={screenTestID} style={[styles.root, safeSides]} behavior={Platform.OS === "ios" ? "padding" : "height"}>
    <ScrollView testID={`${screenTestID}-scroll`} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" contentContainerStyle={[layoutStyles.formContent, styles.content, { paddingTop: insets.top + 28, paddingBottom: insets.bottom + 32 }]}>
      <View style={styles.header}>
        <Pressable testID={`${screenTestID}-back-button`} onPress={() => router.canGoBack() ? router.back() : router.replace("/")} accessibilityRole="button" accessibilityLabel="Retour" hitSlop={8}><Text testID={`${screenTestID}-title`} accessibilityRole="header" style={styles.title}>{title}</Text></Pressable>
        {subtitle ? <Text testID={`${screenTestID}-subtitle`} style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {children}
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </ScrollView>
  </KeyboardAvoidingView>;
}

export function DesignRow({ title, detail, onPress, children, testID }: { title: string; detail?: string; onPress?: () => void; children?: React.ReactNode; testID?: string }) {
  const styles = useDesignStyles();
  const [open, setOpen] = useState(false);
  const rowTestID = testID ?? `design-row-${title.toLowerCase().replace(/[^a-z0-9]+/gi, "-")}`;
  return <View>
    <Pressable testID={rowTestID} disabled={!onPress && !children} onPress={onPress ?? (() => setOpen(!open))} accessibilityRole={onPress || children ? "button" : undefined} accessibilityLabel={[title, detail].filter(Boolean).join(", ")} accessibilityState={children ? { expanded: open } : undefined} style={styles.row}>
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}><Text testID={`${rowTestID}-title`} style={styles.rowTitle}>{title}</Text>{detail ? <Text testID={`${rowTestID}-detail`} style={styles.subtitle}>{detail}</Text> : null}</View>
      {onPress || children ? <Text style={styles.chevron}>{open ? "⌄" : "›"}</Text> : null}
    </Pressable>
    {open ? <View style={styles.editor}>{children}</View> : null}
  </View>;
}

export function DesignSection({ children }: { children: string }) { const styles = useDesignStyles(); return <Text testID={`design-section-${children.toLowerCase().replace(/[^a-z0-9]+/gi, "-")}`} style={styles.section}>{children}</Text>; }

export function DesignInputStyles() { const { colors } = useTheme(); return { minHeight: 48, color: colors.onSurface, fontFamily: fontFamily.text, fontSize: 14, borderColor: colors.border, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, backgroundColor: colors.surfaceSecondary }; }

export const useDesignStyles = makeStyles(c => ({
  root: { flex: 1, backgroundColor: c.surface },
  content: { flexGrow: 1, paddingHorizontal: 18, gap: 14 },
  header: { minHeight: 58, gap: 4 },
  title: { fontFamily: fontFamily.textBold, fontSize: 24, lineHeight: 33, color: c.onSurface },
  subtitle: { fontFamily: fontFamily.text, fontSize: 12, lineHeight: 17, color: c.muted },
  row: { minHeight: 62, paddingVertical: 11, paddingHorizontal: 14, borderRadius: 18, borderWidth: 1, borderColor: c.border, backgroundColor: c.surfaceSecondary, flexDirection: "row", alignItems: "center", gap: 10 },
  rowTitle: { fontFamily: fontFamily.text, fontSize: 14, lineHeight: 19, color: c.onSurface },
  chevron: { fontFamily: fontFamily.text, fontSize: 22, color: c.onSurfaceTertiary },
  editor: { padding: 14, gap: 14, borderRadius: 18, backgroundColor: c.surfaceSecondary, marginTop: 8 },
  section: { fontFamily: fontFamily.textBold, fontSize: 10, letterSpacing: 1.2, color: c.muted, textTransform: "uppercase" },
  footer: { marginTop: "auto", paddingTop: 14, gap: 14 },
}));

import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fontFamily, makeStyles, useTheme } from "@/src/theme";
import { layoutStyles, useScreenLayout } from "@/src/layout";

export function DesignScreen({ title, subtitle, children, footer, testID }: { title: string; subtitle?: string; children: React.ReactNode; footer?: React.ReactNode; testID?: string }) {
  const styles = useDesignStyles();
  const insets = useSafeAreaInsets();
  const { safeSides } = useScreenLayout();
  const router = useRouter();
  return <View testID={testID} style={[styles.root, safeSides]}>
    <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={[layoutStyles.content, styles.content, { paddingTop: insets.top + 28, paddingBottom: insets.bottom + 20 }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.canGoBack() ? router.back() : router.replace("/")} accessibilityRole="button" accessibilityLabel="Retour" hitSlop={8}><Text accessibilityRole="header" style={styles.title}>{title}</Text></Pressable>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {children}
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </ScrollView>
  </View>;
}

export function DesignRow({ title, detail, onPress, children, testID }: { title: string; detail?: string; onPress?: () => void; children?: React.ReactNode; testID?: string }) {
  const styles = useDesignStyles();
  const [open, setOpen] = useState(false);
  return <View>
    <Pressable testID={testID} disabled={!onPress && !children} onPress={onPress ?? (() => setOpen(!open))} accessibilityRole={onPress || children ? "button" : undefined} accessibilityLabel={[title, detail].filter(Boolean).join(", ")} accessibilityState={children ? { expanded: open } : undefined} style={styles.row}>
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}><Text style={styles.rowTitle}>{title}</Text>{detail ? <Text style={styles.subtitle}>{detail}</Text> : null}</View>
      {onPress || children ? <Text style={styles.chevron}>{open ? "⌄" : "›"}</Text> : null}
    </Pressable>
    {open ? <View style={styles.editor}>{children}</View> : null}
  </View>;
}

export function DesignSection({ children }: { children: string }) { const styles = useDesignStyles(); return <Text style={styles.section}>{children}</Text>; }

export function DesignInputStyles() { const { colors } = useTheme(); return { minHeight: 44, color: colors.onSurface, fontFamily: fontFamily.text, fontSize: 14, borderColor: colors.border, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, backgroundColor: colors.surfaceSecondary }; }

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

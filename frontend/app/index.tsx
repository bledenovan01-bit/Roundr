import { useRouter } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ModeCard } from "@/src/components/mode-card";
import { PrimaryButton } from "@/src/components/primary-button";
import { DesignRow, DesignSection } from "@/src/components/design-screen";
import { GAME_MODES } from "@/src/data/modes";
import { useStore } from "@/src/store/session-store";
import { fontFamily, makeStyles, useTheme } from "@/src/theme";
import { layoutStyles, useScreenLayout } from "@/src/layout";

export default function HomeScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { safeSides } = useScreenLayout();
  const router = useRouter();
  const session = useStore(s => s.session);
  const saveError = useStore(s => s.saveError);
  return <View testID="home-screen" style={[styles.root, safeSides]}>
    <ScrollView showsVerticalScrollIndicator={false} testID="home-scroll" contentContainerStyle={[layoutStyles.content, styles.content, { paddingTop: insets.top + 28, paddingBottom: insets.bottom + 20 }]}>
      <View testID="home-header" style={styles.header}><Text testID="home-wordmark" style={styles.logo}>Roundr<Text style={{ color: colors.brandPrimary }}>.</Text></Text></View>
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Lance ta session</Text>
        <Text style={styles.heroCopy}>Choisis un mode, configure en quelques secondes et joue.</Text>
        <View style={{ alignSelf: "flex-start" }}><PrimaryButton testID="home-new-session" label="Nouvelle session" onPress={() => router.push("/config/classique")} /></View>
      </View>
      {saveError ? <Text style={{ color: colors.error }}>{saveError}</Text> : null}
      {session?.status === "active" ? <DesignRow testID="resume-session-card" title="Reprendre la session" detail={GAME_MODES.find(m => m.id === session.mode)?.title} onPress={() => router.push("/live")} /> : null}
      <DesignSection>MODES</DesignSection>
      <View testID="modes-section" style={{ gap: 14 }}>{GAME_MODES.map((mode, index) => <ModeCard key={mode.id} index={index} testID={`mode-card-${mode.id}`} title={mode.title} description={mode.description} iconName={mode.icon} accent={colors[mode.accent]} onPress={() => router.push(`/config/${mode.id}` as never)} />)}</View>
      <View style={styles.bottom}>
        <DesignRow testID="presets-manage" title="Mes chronos" detail="Presets et sessions" onPress={() => router.push("/presets")} />
        <View style={styles.links}>
          <Pressable onPress={() => router.push("/teams")} accessibilityRole="button"><Text style={styles.link}>Équipes</Text></Pressable>
          <Pressable onPress={() => router.push("/team-builder")} accessibilityRole="button"><Text style={styles.link}>Faire les équipes</Text></Pressable>
          <Pressable onPress={() => router.push("/settings")} accessibilityRole="button"><Text style={styles.link}>Paramètres</Text></Pressable>
        </View>
      </View>
    </ScrollView>
  </View>;
}
const useStyles = makeStyles(c => ({
  root: { flex: 1, backgroundColor: c.surface },
  content: { flexGrow: 1, paddingHorizontal: 18, gap: 14 },
  header: { alignItems: "center", minHeight: 58, justifyContent: "center" },
  logo: { fontFamily: fontFamily.textBold, fontSize: 44, lineHeight: 50, letterSpacing: -1.4, color: c.onSurface, textAlign: "center" },
  hero: { backgroundColor: c.brandTertiary, borderWidth: 1, borderColor: c.brandSecondary, borderRadius: 22, padding: 16, gap: 9 },
  heroTitle: { fontFamily: fontFamily.text, fontSize: 24, color: c.onSurface },
  heroCopy: { fontFamily: fontFamily.text, fontSize: 13, lineHeight: 18, color: c.onSurface },
  bottom: { marginTop: "auto", paddingTop: 28, gap: 14 },
  links: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 8 },
  link: { color: c.muted, fontFamily: fontFamily.text, fontSize: 12, paddingVertical: 8 },
}));

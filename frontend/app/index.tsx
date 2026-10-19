import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ModeCard, homeCopyStyles } from "@/src/components/mode-card";
import { LovableBackground } from "@/src/components/lovable/background";
import { LovableIcon, type LovableIconName } from "@/src/components/lovable/icon";
import { LovableIntro } from "@/src/components/lovable/intro";
import { Wordmark } from "@/src/components/lovable/wordmark";
import { homeSessionPreviews } from "@/src/features/home-session-preview";
import { useStore } from "@/src/store/session-store";
import { lovable, lovableFont } from "@/src/visual/lovable";

// Frozen Lovable MODES. Keep the shorter native configuration catalogue intact.
const modes = [
  { id: "classique", title: "Match classique", description: "Un match, une ou deux mi-temps.", icon: "pitch", accent: lovable.classic },
  { id: "maracana", title: "Maracana", description: "3 à 8 équipes qui tournent sur le terrain.", icon: "refresh", accent: lovable.maracana },
  { id: "cup", title: "Cup", description: "Poules puis phases finales.", icon: "trophy", accent: lovable.cup },
  { id: "survie", title: "Survie", description: "Élimination directe jusqu'au vainqueur.", icon: "swords", accent: lovable.survie },
  { id: "custom", title: "Chrono libre", description: "Chronomètre, compte à rebours et intervalles personnalisés.", icon: "timer", accent: lovable.custom },
] as const;

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { width, height, fontScale } = useWindowDimensions();
  const router = useRouter();
  const session = useStore(s => s.session);
  const freeTimer = useStore(s => s.freeTimer);
  const saveError = useStore(s => s.saveError);
  const now = useStore(s => s.now);
  const resumes = homeSessionPreviews(session, freeTimer, now);
  const [showWelcome, setShowWelcome] = useState<boolean | null>(null);
  const [cardHeights, setCardHeights] = useState<Record<string, number>>({});
  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem("roundr.welcome.v1").then(value => { if (mounted) setShowWelcome(value !== "seen"); }, () => { if (mounted) setShowWelcome(false); });
    return () => { mounted = false; };
  }, []);
  const enter = () => { setShowWelcome(false); AsyncStorage.setItem("roundr.welcome.v1", "seen").catch(() => {}); };
  if (showWelcome === null && !resumes.length) return <View style={styles.root} />;
  if (showWelcome && !resumes.length) return <LovableIntro onStart={enter} />;

  const landscape = width > height;
  // Preserve usable cards with native large text / safe-area insets.
  const usableWidth = width - insets.left - insets.right;
  const columns = landscape && usableWidth >= 600 && fontScale <= 1.5 ? 2 : 1;
  const cardWidth = (usableWidth - 40 - (columns - 1) * 12) / columns;
  // Frozen CSS grid uses 76 px implicit tracks even when a tile overflows.
  // The landscape resume/title overlap is intentional here, explicitly approved.
  // Native accessibility text can grow its rows instead of obscuring controls.
  const cardStyle = (id: string) => ({ width: cardWidth, marginBottom: columns === 2 && fontScale <= 1 ? Math.min(0, 76 - (cardHeights[id] ?? 76)) : 0 });
  const measureCard = (id: string, height: number) => setCardHeights(previous => previous[id] === height ? previous : { ...previous, [id]: height });
  return <View testID="home-screen" style={styles.root}>
    <LovableBackground />
    <View testID="home-header" style={[styles.header, { paddingTop: insets.top + (landscape ? 10 : 24), paddingBottom: landscape ? 4 : 12, gap: landscape ? 4 : 8 }]}>
      <Wordmark testID="home-wordmark" />
      <Text testID="home-slogan" style={styles.slogan}>Moins d&apos;organisation, plus de jeu.</Text>
    </View>
    <ScrollView testID="home-scroll" showsVerticalScrollIndicator={false} contentContainerStyle={[styles.grid, { paddingLeft: 20 + insets.left, paddingRight: 20 + insets.right, paddingBottom: Math.max(16, insets.bottom) }]}>
      {saveError ? <Text accessibilityRole="alert" style={[styles.error, { width: "100%" }]}>{saveError}</Text> : null}
      {resumes.map(resume => <ModeCard key={resume.key} testID={resume.route === "/live" ? "resume-session-card" : "resume-free-card"} title={resume.title} icon="history" accent={lovable.primary} resume style={cardStyle(resume.key)} onLayout={e => measureCard(resume.key, e.nativeEvent.layout.height)} onPress={() => router.push(resume.route)}>
        <Text style={[homeCopyStyles.detail, homeCopyStyles.state]}>{resume.state}</Text>
        {resume.teams ? <Text style={homeCopyStyles.detail}>{resume.teams}</Text> : null}
        {resume.time ? <Text style={[homeCopyStyles.detail, { fontVariant: ["tabular-nums"] }]}>{resume.time}</Text> : null}
        <Text style={[homeCopyStyles.detail, homeCopyStyles.action]}>{resume.action}</Text>
      </ModeCard>)}
      <View testID="home-hero" style={styles.hero}><Text testID="home-title" accessibilityRole="header" style={styles.title}>Quel format aujourd&apos;hui ?</Text></View>
      {modes.map(mode => <ModeCard key={mode.id} testID={`mode-card-${mode.id}`} title={mode.title} description={mode.description} icon={mode.icon} accent={mode.accent} style={cardStyle(mode.id)} onLayout={e => measureCard(mode.id, e.nativeEvent.layout.height)} onPress={() => router.push((mode.id === "custom" ? "/chrono-libre" : `/config/${mode.id}`) as never)} />)}
      <ModeCard testID="mode-card-team-builder" title="Faire les équipes" description="Tirage au sort à partir des joueurs présents" icon="users" accent={lovable.custom} quiet style={cardStyle("team-builder")} onLayout={e => measureCard("team-builder", e.nativeEvent.layout.height)} onPress={() => router.push("/team-builder")} />
      <HomeLink title="Historique des compétitions" icon="trophy" testID="home-history-link" width={cardWidth} onPress={() => router.push("/history")} />
      <HomeLink title="Paramètres" icon="settings" testID="home-settings-link" width={cardWidth} onPress={() => router.push("/settings")} />
    </ScrollView>
  </View>;
}

function HomeLink({ title, icon, testID, width, onPress }: { title: string; icon: LovableIconName; testID: string; width: number; onPress?: () => void }) {
  return <Pressable testID={testID} accessibilityRole="button" accessibilityLabel={title} accessibilityState={{ disabled: !onPress }} disabled={!onPress} onPress={onPress} style={({ pressed }) => [styles.link, { width }, pressed && styles.pressed]}>
    <LovableIcon name={icon} color={lovable.muted} /><Text testID={`${testID}-label`} style={styles.linkText}>{title}</Text><LovableIcon name="chevron" color={lovable.muted} />
  </Pressable>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: lovable.background },
  header: { paddingHorizontal: 20, alignItems: "center" },
  slogan: { fontFamily: lovableFont.semibold, fontSize: 13, lineHeight: 19.5, color: lovable.muted, textAlign: "center", includeFontPadding: false },
  grid: { flexDirection: "row", flexWrap: "wrap", alignItems: "flex-start", gap: 12, paddingTop: 6 },
  hero: { width: "100%", paddingTop: 6, paddingBottom: 4 },
  title: { fontFamily: lovableFont.extrabold, fontSize: 26, lineHeight: 29.9, color: lovable.foreground, includeFontPadding: false },
  link: { minHeight: 44, marginTop: 4, paddingHorizontal: 16, paddingVertical: 8, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 6 },
  linkText: { flexShrink: 1, fontFamily: lovableFont.semibold, fontSize: 14, lineHeight: 20, color: lovable.muted, includeFontPadding: false },
  pressed: { transform: [{ scale: 0.97 }] },
  error: { color: lovable.error, fontFamily: lovableFont.semibold },
});

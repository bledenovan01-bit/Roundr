import { useAppearance } from "@/src/hooks/use-appearance";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { Alert } from "@/src/alert";
import Swipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ModeCard, homeCopyStyles } from "@/src/components/mode-card";
import { LovableIcon, type LovableIconName } from "@/src/components/lovable/icon";
import { LovableIntro } from "@/src/components/lovable/intro";
import { PitchPhoto } from "@/src/components/lovable/pitch-photo";
import { Wordmark } from "@/src/components/lovable/wordmark";
import { homeSessionPreviews, type HomeResume } from "@/src/features/home-session-preview";
import { discardSession, getStoreState, replaceFreeTimer, retryStorage, useStore } from "@/src/store/session-store";
import { brand, lovable, lovableFont, themed, withAlpha } from "@/src/visual/lovable";

// The five modes, in the order of the merged mockup. Each description says what the mode does.
const modes = [
  { id: "classique", title: "Match classique", description: "Deux équipes, un chrono.", icon: "pitch", tile: brand.tile.classic },
  { id: "maracana", title: "Maracana", description: "3 à 8 équipes. Roundr gère les rotations.", icon: "refresh", tile: brand.tile.maracana },
  { id: "cup", title: "Cup", description: "Des poules, puis des matchs à élimination.", icon: "trophy", tile: brand.tile.cup },
  { id: "survie", title: "Survie", description: "Matchs à élimination directe.", icon: "swords", tile: brand.tile.survie },
  { id: "custom", title: "Chrono libre", description: "Chrono, compte à rebours, intervalles.", icon: "timer", tile: brand.tile.custom },
] as const;

export default function HomeScreen() {
  useAppearance();
  const insets = useSafeAreaInsets();
  const { width, height, fontScale } = useWindowDimensions();
  const router = useRouter();
  const session = useStore(s => s.session);
  const freeTimer = useStore(s => s.freeTimer);
  const saveError = useStore(s => s.saveError);
  const now = useStore(s => s.now);
  const resumes = homeSessionPreviews(session, freeTimer, now);
  const [showWelcome, setShowWelcome] = useState<boolean | null>(null);
  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem("roundr.welcome.v1").then(value => { if (mounted) setShowWelcome(value !== "seen"); }, () => { if (mounted) setShowWelcome(false); });
    return () => { mounted = false; };
  }, []);
  const enter = () => { setShowWelcome(false); AsyncStorage.setItem("roundr.welcome.v1", "seen").catch(() => {}); };
  if (showWelcome === null && !resumes.length) return <View style={styles.root} />;
  if (showWelcome && !resumes.length) return <LovableIntro onStart={enter} />;

  const confirmAbandon = (resume: HomeResume) => Alert.alert(
    "Abandonner la session ?",
    "Cette session ne sera plus reprenable. Les résultats déjà enregistrés sont conservés.",
    [
      { text: "Annuler", style: "cancel" },
      { text: "Abandonner", style: "destructive", onPress: () => {
        const current = getStoreState();
        if (resume.route === "/live") {
          if (current.session?.id === resume.key) discardSession();
        } else if (current.freeTimer && `free-${current.freeTimer.createdAt}` === resume.key) {
          void replaceFreeTimer(null, current.freeTimer);
        }
      } },
    ],
  );
  const landscape = width > height;
  // Usable width with native large text and safe-area insets.
  const usableWidth = width - insets.left - insets.right;
  const columns = landscape && usableWidth >= 600 && fontScale <= 1.5 ? 2 : 1;
  const cardWidth = (usableWidth - 40 - (columns - 1) * 10) / columns;
  const compactHero = landscape || height < 640;
  return <View testID="home-screen" style={styles.root}>
    <ScrollView testID="home-scroll" showsVerticalScrollIndicator={false} contentContainerStyle={[styles.grid, { paddingTop: insets.top + (landscape ? 8 : 12), paddingLeft: 20 + insets.left, paddingRight: 20 + insets.right, paddingBottom: Math.max(16, insets.bottom) }]}>
      {/* The photo stays in this banner in both themes; everything below is on plain surfaces. */}
      <View testID="home-header" style={[styles.hero, { minHeight: compactHero ? 104 : 150 }]}>
        <PitchPhoto shade="left" position="right bottom" />
        <View style={styles.heroCopy}>
          <Wordmark testID="home-wordmark" size={compactHero ? 30 : 38} onPhoto />
          <Text testID="home-slogan" style={[styles.slogan, compactHero && styles.sloganCompact]}>Lance tes matchs,{compactHero ? " " : "\n"}gère les scores{compactHero ? " " : "\n"}et les rotations.</Text>
        </View>
        <Pressable testID="home-settings-link" accessibilityRole="button" accessibilityLabel="Paramètres" hitSlop={6} onPress={() => router.push("/settings")} style={({ pressed }) => [styles.gear, pressed && styles.pressed]}>
          <LovableIcon name="gear" color={brand.paper} size={20} />
        </Pressable>
      </View>
      {saveError ? <View style={{ width: "100%", gap: 4 }}><Text accessibilityRole="alert" style={styles.error}>La sauvegarde a échoué. Réessaie.</Text><HomeAction title="Réessayer la sauvegarde" icon="refresh" testID="home-retry-save" onPress={() => { void retryStorage(); }} /></View> : null}
      {resumes.map(resume => <View key={resume.key} style={{ width: cardWidth, gap: 4 }}><ModeCard testID={resume.route === "/live" ? "resume-session-card" : "resume-free-card"} title={resume.title} icon="history" accent={lovable.primary} resume style={{ width: cardWidth }} onPress={() => router.push(resume.route)}>
        {resume.state === "En cours" ? <Text style={homeCopyStyles.detail}>Le chrono continue. Touche cette carte pour y revenir.</Text> : null}
        <Text style={[homeCopyStyles.detail, homeCopyStyles.state]}>{resume.state}</Text>
        {resume.teams ? <Text style={homeCopyStyles.detail}>{resume.teams}</Text> : null}
        {resume.time ? <Text style={[homeCopyStyles.detail, { fontVariant: ["tabular-nums"] }]}>{resume.time}</Text> : null}
        <Text style={[homeCopyStyles.detail, homeCopyStyles.action]}>{resume.action}</Text>
      </ModeCard>
        <Pressable accessibilityRole="button" accessibilityLabel={`Abandonner : ${resume.title}`} onPress={() => confirmAbandon(resume)} style={{ minHeight: 44, flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "center" }}>
          <LovableIcon name="trash" color={lovable.error} size={17} /><Text style={[homeCopyStyles.detail, { color: lovable.error }]}>Abandonner la session</Text>
        </Pressable>
      </View>)}
      <View testID="home-hero" style={styles.heading}><Text testID="home-title" accessibilityRole="header" style={styles.title}>Choisis ton mode</Text></View>
      {modes.map(mode => {
        const resume = resumes.find(item =>
          item.route === "/live" ? session?.mode === mode.id : mode.id === "custom",
        );
        const card = (
          <ModeCard key={mode.id} testID={`mode-card-${mode.id}`} title={mode.title}
            description={resume ? resume.action : mode.description}
            icon={mode.icon} accent={mode.tile} solid style={{ width: cardWidth }}
            onPress={() => {
              if (resume) router.push(resume.route);
              else if (mode.id === "custom") router.push("/chrono-libre");
              else router.push(`/config/${mode.id}`);
            }} />
        );
        if (!resume) return card;
        return (
          <Swipeable key={`${mode.id}-${resume.key}`} containerStyle={{ width: cardWidth }}
            overshootRight={false} rightThreshold={32}
            renderRightActions={() => (
              <Pressable testID={`abandon-${mode.id}`} accessibilityRole="button"
                accessibilityLabel={`Abandonner la session : ${mode.title}`}
                style={styles.abandon}
                onPress={() => confirmAbandon(resume)}>
                <LovableIcon name="trash" color={lovable.onError} size={23} />
              </Pressable>
            )}>
            {card}
          </Swipeable>
        );
      })}
      <View style={styles.actions}>
        <HomeAction title="Faire les équipes" icon="users" testID="mode-card-team-builder" onPress={() => router.push("/team-builder")} />
        <HomeAction title="Tournois joués" icon="history" testID="home-history-link" onPress={() => router.push("/history")} />
      </View>
    </ScrollView>
  </View>;
}

function HomeAction({ title, icon, testID, onPress }: { title: string; icon: LovableIconName; testID: string; onPress: () => void }) {
  return <Pressable testID={testID} accessibilityRole="button" accessibilityLabel={title} onPress={onPress} style={({ pressed }) => [styles.action, pressed && styles.pressed]}>
    <LovableIcon name={icon} color={lovable.foreground} size={18} /><Text testID={`${testID}-label`} numberOfLines={1} style={styles.actionText}>{title}</Text>
  </Pressable>;
}

const styles = themed(() => StyleSheet.create({
  root: { flex: 1, backgroundColor: lovable.background },
  grid: { flexDirection: "row", flexWrap: "wrap", alignItems: "flex-start", gap: 10 },
  hero: { width: "100%", borderRadius: 22, overflow: "hidden", flexDirection: "row", alignItems: "stretch", gap: 12, paddingVertical: 16, paddingLeft: 20, paddingRight: 14, backgroundColor: brand.ink },
  heroCopy: { flex: 1, minWidth: 0, gap: 8, justifyContent: "center" },
  slogan: { fontFamily: lovableFont.semibold, fontSize: 15, lineHeight: 21, color: brand.paper, includeFontPadding: false },
  sloganCompact: { fontSize: 13, lineHeight: 18 },
  gear: { width: 44, height: 44, borderRadius: 14, borderWidth: 1, borderColor: withAlpha(brand.paper, 0.22), backgroundColor: withAlpha(brand.ink, 0.72), alignItems: "center", justifyContent: "center" },
  heading: { width: "100%", paddingTop: 6, paddingBottom: 2 },
  title: { fontFamily: lovableFont.extrabold, fontSize: 26, lineHeight: 30, color: lovable.foreground, includeFontPadding: false },
  actions: { width: "100%", flexDirection: "row", gap: 10, marginTop: 2 },
  action: { flex: 1, minWidth: 0, minHeight: 50, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 16, borderWidth: 1, borderColor: lovable.border, backgroundColor: lovable.cardRaised },
  actionText: { flexShrink: 1, fontFamily: lovableFont.extrabold, fontSize: 14, lineHeight: 20, color: lovable.foreground, includeFontPadding: false },
  abandon: { width: 64, marginLeft: 6, borderRadius: 16, backgroundColor: lovable.error, alignItems: "center", justifyContent: "center" },
  pressed: { transform: [{ scale: 0.97 }] },
  error: { width: "100%", color: lovable.error, fontFamily: lovableFont.semibold },
}));

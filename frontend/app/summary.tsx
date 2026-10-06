// E09 / E11 — Fin de session, résumé par mode, carte de partage PNG locale.
import { useRef, useState } from "react";
import { useRouter } from "expo-router";
import { Alert } from "@/src/alert";
import { Platform, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { captureRef } from "react-native-view-shot";
import * as Sharing from "expo-sharing";

import { DesignScreen, DesignRow } from "@/src/components/design-screen";
import { formatMMSS } from "@/src/chrono/format";
import { PrimaryButton } from "@/src/components/primary-button";
import { GAME_MODES } from "@/src/data/modes";
import { createSession } from "@/src/domain/session";
import { buildSummary } from "@/src/domain/summary";
import { discardSession, getStoreState, startSession, useStore } from "@/src/store/session-store";
import { fontFamily, fontSize, makeStyles, radius, spacing, useTheme } from "@/src/theme";
import { layoutStyles, useScreenLayout } from "@/src/layout";

export default function SummaryScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { safeSides } = useScreenLayout();
  const router = useRouter();
  const session = useStore((s) => s.lastSummary);
  const cardRef = useRef<View>(null);
  const [sharing, setSharing] = useState(false);

  if (!session) {
    return (
      <ScrollView
        testID="summary-empty"
        style={[styles.root, safeSides]}
        contentContainerStyle={[
          layoutStyles.content,
          styles.emptyContent,
          { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.xl },
        ]}
      >
        <Text testID="summary-empty-label" style={styles.sub}>Aucun résumé disponible.</Text>
        <PrimaryButton testID="summary-empty-home" label="Accueil" onPress={() => router.replace("/" as never)} />
      </ScrollView>
    );
  }
  const mode = GAME_MODES.find((m) => m.id === session.mode)!;
  const summary = buildSummary(session);
  const single = session.mode === "classique" || session.mode === "custom";

  // C21 — Rejouer : même configuration et équipes, nouvelle session à zéro.
  const replay = () => {
    const go = () => {
      startSession(createSession(session.config, session.teams, Date.now()));
      router.replace("/live" as never);
    };
    const active = getStoreState().session;
    if (active && active.status === "active") {
      Alert.alert("Session en cours", "Remplacer la session active ?", [{ text: "Annuler", style: "cancel" }, { text: "Remplacer", style: "destructive", onPress: () => { discardSession(); go(); } }]);
      return;
    }
    go();
  };

  const share = async () => {
    if (sharing) return;
    setSharing(true);
    try {
      const uri = await captureRef(cardRef, { format: "png", quality: 1, result: "tmpfile" });
      if (Platform.OS !== "web" && (await Sharing.isAvailableAsync())) {
        await Sharing.shareAsync(uri, { mimeType: "image/png", dialogTitle: "Partager le résultat" });
      } else {
        Alert.alert("Partage", "Partage système indisponible sur cette plateforme. La carte a été générée localement.");
      }
    } catch {
      Alert.alert("Partage", "Génération de la carte impossible.");
    } finally {
      setSharing(false);
    }
  };

  const match = session.matches.find(m=>m.status === "finished");
  const title = single ? "Match terminé" : session.mode === "cup" ? summary.interrupted ? "Tournoi interrompu" : "Champion" : session.mode === "survie" ? summary.interrupted ? "Tournoi interrompu" : "Vainqueur" : "Session terminée";
  return <DesignScreen title={title} subtitle={single ? `${formatMMSS(match?.playedMs ?? 0)} jouées` : summary.interrupted ? "Résultats conservés" : `${mode.title} terminé`} testID="summary-screen">
    <View ref={cardRef} collapsable={false} style={styles.card} testID="share-card">
      <Text style={styles.cardMode}>{single ? "SCORE FINAL" : title.toUpperCase()}</Text>
      {!single && summary.podium.length ? <Text style={{color:colors.onSurface,fontSize:40}}>★</Text> : null}
      <Text testID="summary-headline" style={[styles.cardHeadline,single && {color:colors.brandPrimary,fontSize:42}]}>{single && match?.score ? `${match.score[0]} – ${match.score[1]}` : summary.headline}</Text>
      {single ? <Text style={styles.cardSub}>{summary.sub ?? summary.headline}</Text> : summary.sub ? <Text style={styles.cardSub}>{summary.sub}</Text> : null}
    </View>
    <PrimaryButton testID="summary-replay" label="Rejouer" variant="secondary" onPress={replay}/>
    {!single ? <PrimaryButton testID="summary-details" label={session.mode==="maracana"?"Voir le classement":"Voir le tableau"} variant="secondary" onPress={()=>router.push("/standings?summary=1" as never)}/> : null}
    <PrimaryButton testID="summary-new" label={single?"Nouveau match":session.mode==="cup"?"Nouvelle Cup":"Nouvelle session"} variant="secondary" onPress={()=>router.replace(`/config/${session.mode}` as never)}/>
    <PrimaryButton testID="summary-home" label="Accueil" variant="secondary" onPress={()=>router.replace("/")}/>
    <DesignRow title="Détails et partage" detail="Résultats de la session">
      {summary.stats.map(s=><Text key={s.label} style={styles.sub}>{s.label} : {s.value}</Text>)}
      <PrimaryButton testID="summary-share" label={sharing?"Génération…":"Partager le résultat"} variant="secondary" onPress={share}/>
    </DesignRow>
  </DesignScreen>;

}

const useStyles = makeStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.surface },
  emptyContent: { flexGrow: 1, justifyContent: "center", paddingHorizontal: spacing.xl, gap: spacing.lg },
  scroll: { padding: spacing.lg, gap: spacing.xl },
  header: { gap: spacing.xs },
  eyebrow: { fontFamily: fontFamily.textBold, fontSize: fontSize.sm, letterSpacing: 2.2, color: colors.brandPrimary },
  title: { fontFamily: fontFamily.textBold, fontSize: fontSize["2xl"], color: colors.onSurface, letterSpacing: -0.6 },
  sub: { fontFamily: fontFamily.text, fontSize: fontSize.base + 1, color: colors.muted },
  card: { minHeight: 210, backgroundColor: colors.surfaceSecondary, borderRadius: 18, padding: 24, gap: 14, borderWidth: 1, borderColor: colors.border, justifyContent: "center", alignItems: "center" },
  cardTop: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, justifyContent: "space-between", alignItems: "center" },
  brand: { fontFamily: fontFamily.textBold, fontSize: fontSize["2xl"] - 2, color: colors.onSurface, letterSpacing: -0.8 },
  cardMode: { flexShrink: 1, fontFamily: fontFamily.textBold, fontSize: fontSize.sm, letterSpacing: 1.8, color: colors.muted, textTransform: "uppercase" },
  cardHeadline: { fontFamily: fontFamily.display, fontSize: 28, lineHeight: 40, color: colors.onSurface },
  cardSub: { fontFamily: fontFamily.textBold, fontSize: fontSize.xl - 2, color: colors.brandPrimary },
  statsRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  stat: { flexBasis: 128, minWidth: 0, flexGrow: 1, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  statValue: { fontFamily: fontFamily.display, fontSize: fontSize["2xl"] + 2, color: colors.onSurface },
  statLabel: { fontFamily: fontFamily.text, fontSize: fontSize.sm, color: colors.muted },
  podium: { fontFamily: fontFamily.textBold, fontSize: fontSize.xl - 2, color: colors.onSurface },
  tagline: { fontFamily: fontFamily.text, fontSize: 10, letterSpacing: 2.2, color: colors.muted, textAlign: "center" },
  actions: { gap: spacing.md },
  link: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm, minHeight: 52 },
  linkLabel: { flexShrink: 1, minWidth: 0, textAlign: "center", fontFamily: fontFamily.textBold, fontSize: fontSize.base + 1, color: colors.brandPrimary },
}));
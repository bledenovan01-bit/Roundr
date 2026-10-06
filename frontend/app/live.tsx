// E03–E07 — Live commun, pause, pause entre périodes, départage, transition.
import { useEffect, useRef, useState } from "react";
import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";
import { usePreferences } from "@/src/store/preferences";
import { useRouter } from "expo-router";
import { Alert } from "@/src/alert";
import { AppState, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialCommunityIcons from "@react-native-vector-icons/material-design-icons";

import { liveNotice } from "@/src/domain/live-notices";
import { elapsedMs } from "@/src/chrono/engine";
import { formatMMSS } from "@/src/chrono/format";
import { DesignRow } from "@/src/components/design-screen";
import { LiveHero, LiveControls } from "@/src/components/design-live";
import { GiantChrono } from "@/src/components/giant-chrono";
import { PrimaryButton } from "@/src/components/primary-button";
import { GAME_MODES } from "@/src/data/modes";
import { TEAM_PALETTE } from "@/src/domain/defaults";
import * as S from "@/src/domain/session";
import type { Session } from "@/src/domain/types";
import { archiveSession, dispatchSession, tick, useStore } from "@/src/store/session-store";
import { fontSize, makeStyles, radius, spacing, useTheme } from "@/src/theme";
import { TypographyPreview, refinedFontFamily as fontFamily } from "@/src/typography-preview";
import { layoutStyles, useScreenLayout } from "@/src/layout";

const TEAM_COL = 68;

export default function LiveScreen() {
  const styles = useStyles();
  const leaving = useRef(false);
  const preferences = usePreferences();
  useEffect(() => {
    if (preferences.keepAwake) void activateKeepAwakeAsync("roundr-match").catch(() => {});
    return () => { void deactivateKeepAwake("roundr-match"); };
  }, [preferences.keepAwake]);
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const session = useStore((s) => s.session);
  const now = useStore((s) => s.now);
  const saveError = useStore((s) => s.saveError);
  const { safeSides } = useScreenLayout();


  // Measured presentation height prevents correction controls / long names
  // overflowing the arena. This never affects the match or chrono state.

  const [correcting, setCorrecting] = useState(false);
  const [giant, setGiant] = useState(false);
  const [locked, setLocked] = useState(false);
  const [tab, setTab] = useState<[string, string]>(["", ""]);

  const live = session?.live ?? null;
  const running = !!live && live.chrono.runningSince != null && live.stage !== "finished";

  useEffect(() => {
    if (!running) return;
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [running]);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (st) => {
      if (st === "active") tick();
    });
    return () => sub.remove();
  }, []);

  // Match unique terminé → résumé (FI-01). Jamais de match suivant seul.
  const single = session?.mode === "classique" || session?.mode === "custom";
  useEffect(() => {
    if (leaving.current) return;
    if (!session) {
      router.replace("/" as never);
      return;
    }
    if (session.status !== "active") {
      leaving.current = true; archiveSession(session);
      router.replace("/summary" as never);
      return;
    }
    if (single && live?.stage === "finished") {
      leaving.current = true; archiveSession(S.endSession(session, Date.now()));
      router.replace("/summary" as never);
    }
  }, [session, live?.stage, single, router]);

  if (!session || !live) return <View style={styles.root} />;

  const mode = GAME_MODES.find((m) => m.id === session.mode)!;

  const match = S.currentMatch(session)!;
  const [teamA, teamB] = S.liveTeams(session);
  const el = elapsedMs(live.chrono, now);
  const paused = S.isPaused(live);
  const next = S.nextMatchInfo(session);

  // Affichage du temps selon l'étape.
  let time = "00:00";
  let caption = "Temps restant";
  let status = "Match en cours";
  let progress = 0;
  const target = live.periodMs[live.periodIndex] ?? 0;
  switch (live.stage) {
    case "period":
      if (live.end.byTime) {
        time = formatMMSS(Math.max(0, target - el));
        progress = target ? el / target : 0;
      } else {
        time = formatMMSS(el);
        caption = "Temps de jeu";
        status = `Premier à ${live.end.goalTarget} buts`;
      }
      if (live.periodMs.length > 1) status = `Période ${live.periodIndex + 1}/${live.periodMs.length}`;
      if (paused) status = "PAUSE";
      break;
    case "break":
      time = formatMMSS(Math.max(0, live.breakMs - el));
      caption = "Pause";
      status = `Période ${live.periodIndex + 1} terminée`;
      progress = el / live.breakMs;
      break;
    case "awaitPeriod":
      time = formatMMSS(live.periodMs[live.periodIndex]);
      caption = "Prochaine période";
      status = `Période ${live.periodIndex + 1}/${live.periodMs.length}`;
      break;
    case "additional":
      time = `+${formatMMSS(el)}`;
      caption = "Temps additionnel";
      status = paused ? "PAUSE" : "Arrêt manuel";
      progress = 1;
      break;
    case "extra":
      time = formatMMSS(Math.max(0, live.extraMs - el));
      caption = live.maracanaExtension ? "Extension 2 min" : "Prolongation";
      status = live.maracanaExtension ? "Premier but gagnant" : paused ? "PAUSE" : "Prolongation";
      progress = el / live.extraMs;
      break;
    case "golden":
      time = `+${formatMMSS(el)}`;
      caption = "Golden goal";
      status = "Premier but gagnant";
      progress = 1;
      break;
    case "shootout":
      time = "TAB";
      caption = "Tirs au but";
      status = "Saisis le résultat";
      progress = 1;
      break;
    case "finished":
      time = formatMMSS(live.playedMs);
      caption = "Durée jouée";
      status = "Match terminé";
      progress = 1;
      break;
  }

  const inPlay = S.isPlayStage(live.stage);
  const canScore = live.scoreOn && live.stage !== "shootout" && live.stage !== "finished";

  const confirmEnd = () => {
    // C03 : le chrono continue pendant la confirmation.
    Alert.alert("Terminer le match ?", live.drawRule && live.scoreOn && live.score[0] === live.score[1] ? "Le match est nul : le départage configuré s’appliquera." : undefined, [
      { text: "Annuler", style: "cancel" },
      { text: "Terminer", style: "destructive", onPress: () => dispatchSession(S.endManual) },
    ]);
  };

  const finishSession = () => {
    Alert.alert(S.hasPendingMatches(session) && session.mode !== "maracana" ? "Interrompre le tournoi ?" : "Terminer la session ?", S.hasPendingMatches(session) && session.mode !== "maracana" ? "Les résultats réels sont conservés, aucun champion ne sera désigné." : undefined, [
      { text: "Annuler", style: "cancel" },
      {
        text: "Terminer",
        style: "destructive",
        onPress: () => {
          leaving.current = true; archiveSession(S.endSession(session, Date.now()));
          router.replace("/summary" as never);
        },
      },
    ]);
  };

  const addTeam = () => {
    const n = session.teams.length + 1;
    dispatchSession((s, t) => S.addMaracanaTeam(s, { id: `t${n}${Date.now().toString(36)}`, name: `Équipe ${n}`, color: TEAM_PALETTE[(n - 1) % TEAM_PALETTE.length] }, t));
  };


  const remainingMs = live.stage === "period" && live.end.byTime ? Math.max(0, target - el) : null;

  return (
    <TypographyPreview.Provider value={true}>
    <KeyboardAvoidingView testID="live-screen" style={[styles.root, safeSides, { paddingTop: insets.top }]} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView testID="live-scroll" style={layoutStyles.scroll} contentContainerStyle={[layoutStyles.content, styles.scroll, { paddingBottom: 20 }]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">

        {saveError ? <Text style={styles.errorText}>{saveError}</Text> : null}
        {live.stage !== "finished" ? <LiveHero title={mode.title} subtitle={session.mode === "custom" ? `Période ${live.periodIndex+1} / ${live.periodMs.length}` : single ? paused && el===0 ? "Prêt à jouer" : "Match en cours" : match.label}
          time={time} caption={caption} status={paused ? el===0 ? "Prêt" : "Match en pause" : status} progress={1-progress}
          teamA={teamA} teamB={teamB} score={live.score} scoreOn={live.scoreOn} canScore={canScore} correcting={correcting} locked={locked}
          onGoal={(side,delta)=>dispatchSession((s,t)=>live.stage==="finished"?S.correctLast(s,side,delta,t):S.goal(s,side,delta,t))}
          onCorrect={()=>setCorrecting(!correcting)} onBack={()=>router.replace("/")}
          onMusic={()=>dispatchSession(s=>({...s,config:{...s.config,sounds:!s.config.sounds}}))}
          onSettings={()=>router.push("/settings")} onGiant={()=>setGiant(true)}
          notice={next ? { time, cue: liveNotice(remainingMs, next.durationMin, running), matchup: `${next.aLabel} vs ${next.bLabel}`, badge: remainingMs == null ? "À la fin du match" : `Dans ${Math.ceil(remainingMs/60000)} min`, preparation: next.certain ? `${next.aLabel} et ${next.bLabel} : préparez-vous pour le prochain match.` : session.mode === "maracana" ? `${next.aLabel} : commencez l’échauffement. L’adversaire dépend du résultat.` : "Les équipes qualifiées pour le prochain match se préparent dès que leur place est confirmée.", locked, onPress: ()=>router.push("/standings") } : undefined}/> : null}
        {live.stage === "break" ? (
          <PrimaryButton testID="skip-break" label="Passer la pause" variant="secondary" onPress={() => dispatchSession((s, t) => S.startNextPeriod({ ...s, live: { ...s.live!, stage: "awaitPeriod", periodIndex: s.live!.periodIndex + 1 } }, t))} />
        ) : null}
        {live.stage === "awaitPeriod" ? (
          <PrimaryButton testID="start-period" label={`Lancer la période ${live.periodIndex + 1}`} onPress={() => dispatchSession(S.startNextPeriod)} />
        ) : null}

        {live.stage === "shootout" ? (
          <View style={styles.panel} testID="shootout-panel">
            <Text style={styles.panelTitle}>Tirs au but</Text>
            <Text style={styles.panelHint}>Score de jeu conservé : {live.score[0]}–{live.score[1]}. Saisis le résultat de la séance (deux nombres différents).</Text>
            <View style={styles.tabRow}>
              {[0, 1].map((i) => (
                <View key={i} style={{ flex: 1, gap: spacing.xs }}>
                  <Text testID={`tab-team-${i}`} style={styles.tabTeam}>{(i === 0 ? teamA : teamB)?.name}</Text>
                  <TextInput
                    testID={`tab-${i}`}
                    accessibilityLabel={`Tirs au but : ${(i === 0 ? teamA : teamB)?.name}`}
                    value={tab[i]}
                    onChangeText={(t) => setTab((prev) => (i === 0 ? [t.replace(/\D/g, ""), prev[1]] : [prev[0], t.replace(/\D/g, "")]))}
                    keyboardType="number-pad"
                    style={styles.tabInput}
                    placeholder="0"
                    placeholderTextColor={colors.muted}
                  />
                </View>
              ))}
            </View>
            <PrimaryButton
              testID="tab-submit"
              label="Valider les TAB"
              disabled={tab[0] === "" || tab[1] === "" || tab[0] === tab[1]}
              onPress={() => {
                dispatchSession((s, t) => S.submitShootout(s, parseInt(tab[0], 10), parseInt(tab[1], 10), t));
                setTab(["", ""]);
              }}
            />
          </View>
        ) : null}

        {/* Transition E07 */}
        {live.stage === "finished" && !single ? (
          <Transition session={session} next={next} onNext={() => dispatchSession(S.launchNext)} onEndSession={finishSession} onAddTeam={addTeam} onSummary={() => { leaving.current = true; archiveSession(S.endSession(session, Date.now())); router.replace("/summary" as never); }} onStandings={() => router.push("/standings" as never)} />
        ) : null}

        {session.cup?.tieChoice ? <TieChoice session={session} /> : null}

      </ScrollView>


      {inPlay ? <View style={[layoutStyles.content,{paddingBottom:insets.bottom+14}]}><LiveControls paused={paused} ready={paused&&el===0} locked={locked} onEnd={confirmEnd} onLock={()=>setLocked(!locked)}
        onRestart={()=>Alert.alert("Relancer le match ?", "Le score et le temps du match actuel seront remis à zéro.", [{text:"Annuler",style:"cancel"},{text:"Relancer",onPress:()=>dispatchSession(S.restartCurrent)}])}
        onPause={()=>dispatchSession(paused?S.resume:S.pause)}/></View>:null}
      <GiantChrono
        visible={giant}
        time={time}
        caption={caption}
        status={status}
        scoreLine={live.scoreOn ? `${live.score[0]} – ${live.score[1]}` : null}
        paused={paused}
        canPause={inPlay}
        onTogglePause={() => dispatchSession(paused ? S.resume : S.pause)}
        onClose={() => setGiant(false)}
      />
    </KeyboardAvoidingView>
    </TypographyPreview.Provider>
  );
}

function Transition({ session, next, onNext, onEndSession, onAddTeam, onSummary, onStandings }: { session: Session; next: S.NextInfo | null; onNext: () => void; onEndSession: () => void; onAddTeam: () => void; onSummary: () => void; onStandings: () => void }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const match = S.currentMatch(session)!;
  const [a, b] = S.liveTeams(session);
  const complete = S.sessionComplete(session);
  const winner = match.winnerId ? S.teamName(session, match.winnerId) : null;
  return (
    <View style={{gap:14, paddingTop:12}} testID="transition-panel">
      <Text style={{fontFamily:fontFamily.textBold,fontSize:24,lineHeight:33,color:colors.onSurface}}>Match terminé</Text>
      <Text style={styles.panelHint}>
        {a?.name} {match.score ? `${match.score[0]} – ${match.score[1]}` : "vs"} {b?.name}
      </Text>
      {match.shootout ? <Text style={styles.panelHint}>TAB {match.shootout[0]}–{match.shootout[1]} · {winner} qualifié</Text> : winner ? <Text style={styles.panelHint}>Vainqueur : {winner}</Text> : <Text style={styles.panelHint}>Match nul</Text>}
      {session.lastEvent ? <Text style={styles.panelHint}>{session.lastEvent}</Text> : null}
      {complete ? (
        <PrimaryButton testID="see-summary" label="Voir le résumé" onPress={onSummary} />
      ) : next && !session.cup?.tieChoice ? (
        <>
          <DesignRow title="Prochain match" detail={`${next.aLabel} vs ${next.bLabel}`} />
          {session.lastEvent ? <DesignRow title="Rotation" detail={session.lastEvent} /> : null}
          <PrimaryButton testID="launch-next" label="Lancer le prochain match" onPress={onNext} disabled={!next.certain} />
        </>
      ) : null}
      <View style={styles.linksRow}>
        <Pressable onPress={onStandings} style={styles.link} testID="transition-standings" accessibilityRole="button" accessibilityLabel={session.mode === "maracana" ? "Classement" : "Tableau"}>
          <MaterialCommunityIcons name="podium" size={18} color={colors.brandPrimary} />
          <Text style={styles.linkLabel}>{session.mode === "maracana" ? "Classement" : "Tableau"}</Text>
        </Pressable>
        {session.mode === "maracana" && session.teams.length < 8 ? (
          <Pressable onPress={onAddTeam} style={styles.link} testID="add-team" accessibilityRole="button" accessibilityLabel="Ajouter une équipe">
            <MaterialCommunityIcons name="account-multiple-plus" size={18} color={colors.brandPrimary} />
            <Text style={styles.linkLabel}>Ajouter une équipe</Text>
          </Pressable>
        ) : null}
        {!complete ? (
          <Pressable onPress={onEndSession} style={styles.link} testID="end-session" accessibilityRole="button" accessibilityLabel="Terminer la session">
            <MaterialCommunityIcons name="flag-checkered" size={18} color={colors.error} />
            <Text style={[styles.linkLabel, { color: colors.error }]}>Terminer la session</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

// C14 — égalité parfaite à la coupure : choix explicite de l'organisateur.
function TieChoice({ session }: { session: Session }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const tc = session.cup!.tieChoice!;
  const [picked, setPicked] = useState<string[]>([]);
  return (
    <View style={[styles.panel, { borderColor: colors.warning }]} testID="tie-choice">
      <Text style={styles.panelTitle}>Égalité parfaite</Text>
      <Text style={styles.panelHint}>{tc.context} : choisis {tc.slots} équipe{tc.slots > 1 ? "s" : ""} qualifiée{tc.slots > 1 ? "s" : ""} parmi les ex æquo. Le classement n’est pas modifié.</Text>
      <View style={{ gap: spacing.sm }}>
        {tc.candidates.map((id) => {
          const on = picked.includes(id);
          return (
            <Pressable key={id} testID={`tie-${id}`} onPress={() => setPicked((p) => (on ? p.filter((x) => x !== id) : p.length < tc.slots ? [...p, id] : p))} style={[styles.tieRow, on && { borderColor: colors.brandPrimary }]} accessibilityRole="checkbox" accessibilityLabel={S.teamName(session, id)} accessibilityState={{ checked: on }} aria-checked={on}>
              <MaterialCommunityIcons name={on ? "checkbox-marked" : "checkbox-blank-outline"} size={22} color={on ? colors.brandPrimary : colors.muted} />
              <Text style={styles.tieName}>{S.teamName(session, id)}</Text>
            </Pressable>
          );
        })}
      </View>
      <PrimaryButton testID="tie-confirm" label="Confirmer" disabled={picked.length !== tc.slots} onPress={() => dispatchSession((s, t) => S.resolveTieChoice(s, picked, t))} />
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.surface },
  scroll: { paddingHorizontal: 25, paddingTop: 16, gap: 0, flexGrow: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  iconBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  modeTitle: { fontFamily: fontFamily.textBold, fontSize: 20, lineHeight: 26, color: colors.onSurface, letterSpacing: 0.4, flexShrink: 1, textAlign: "center" },
  brandFooter: { alignItems: "center", gap: spacing.xs, paddingTop: spacing.lg, marginTop: "auto" },
  brandTagline: { fontFamily: fontFamily.text, fontSize: 10, color: colors.muted, letterSpacing: 2.2, textAlign: "center" },
  brandWordmark: { fontFamily: fontFamily.textBold, fontSize: fontSize.xl, color: colors.onSurface, letterSpacing: -0.8 },
  nextTeamRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  nextTeamRowStacked: { flexDirection: "column", alignItems: "stretch" },
  nextTeamIdentity: { flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center", gap: spacing.md },
  nextJersey: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, alignItems: "center", justifyContent: "center", backgroundColor: colors.surface },
  vs: { fontFamily: fontFamily.textBold, fontSize: fontSize.base, color: colors.muted, letterSpacing: 1.2, textAlign: "center" },
  matchLabel: { fontFamily: fontFamily.text, fontSize: 13, lineHeight: 19, color: colors.muted },
  errorBanner: { flexDirection: "row", gap: spacing.sm, alignItems: "center", padding: spacing.md, borderRadius: radius.sm, backgroundColor: colors.error },
  errorText: { flex: 1, fontFamily: fontFamily.textBold, fontSize: fontSize.sm, color: colors.onError },
  arena: { alignItems: "center", justifyContent: "center", marginTop: spacing.sm, alignSelf: "center", width: "100%", maxWidth: 480 },
  arenaStacked: { gap: spacing.lg },
  arenaLandscape: { marginTop: 0, flexShrink: 0 },
  heroLandscape: { flexDirection: "row", alignItems: "center", gap: spacing.lg },
  heroRail: { flex: 1, minWidth: 0, gap: spacing.lg },
  teamOverlay: { position: "absolute", top: 0, bottom: 0, left: 0, right: 0 },
  teamsBelow: { width: "100%", flexDirection: "row", gap: spacing.lg, alignItems: "flex-start" },
  teamSlot: { position: "absolute", top: 0, bottom: 0, width: TEAM_COL, justifyContent: "center" },
  teamCol: { width: TEAM_COL, alignItems: "center", gap: spacing.sm },
  teamColCompact: { width: "100%" },
  teamIdentity: { alignItems: "center", gap: spacing.sm },
  teamIdentityCompact: { flexDirection: "row", width: "100%" },
  scoreActions: { alignItems: "center", gap: spacing.sm },
  scoreActionsCompact: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", width: "100%" },
  jersey: { width: 54, height: 54, borderRadius: 27, borderWidth: 3, alignItems: "center", justifyContent: "center", backgroundColor: colors.surfaceSecondary },
  teamName: { fontFamily: fontFamily.textBold, fontSize: 14, lineHeight: 18, color: colors.onSurface, letterSpacing: 0.1, maxWidth: TEAM_COL, textAlign: "center" },
  teamNameLong: { fontSize: 12, lineHeight: 16 },
  teamNameCompact: { flex: 1, minWidth: 0, maxWidth: "100%" },
  score: {
    fontFamily: fontFamily.display,
    fontSize: 72,
    color: colors.onSurface,
    lineHeight: 72,
    // @ts-ignore
    fontVariant: ["tabular-nums"],
  },
  plus: { width: TEAM_COL, height: 58, borderRadius: radius.md, backgroundColor: colors.surfaceSecondary, borderWidth: 1.5, borderColor: colors.borderStrong, alignItems: "center", justifyContent: "center" },
  minus: { height: 44, backgroundColor: colors.surface },
  plusLabel: { fontFamily: fontFamily.display, fontSize: fontSize["2xl"], color: colors.onSurface },
  teamsLine: { textAlign: "center", fontFamily: fontFamily.textBold, fontSize: fontSize.xl, color: colors.onSurface },
  correctLink: { flexDirection: "row", alignSelf: "center", alignItems: "center", gap: spacing.xs, minHeight: 40, paddingHorizontal: spacing.md },
  correctLabel: { flexShrink: 1, textAlign: "center", fontFamily: fontFamily.textBold, fontSize: 13, lineHeight: 19, color: colors.muted },
  nextCard: { backgroundColor: colors.surfaceSecondary, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.md, borderWidth: 1, borderColor: colors.border },
  rowBetween: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, justifyContent: "space-between", alignItems: "center" },
  nextTitle: { fontFamily: fontFamily.textBold, fontSize: 16, lineHeight: 22, color: colors.onSurfaceTertiary },
  nextMeta: { fontFamily: fontFamily.text, fontSize: 12, lineHeight: 18, color: colors.muted },
  nextTeams: { fontFamily: fontFamily.textBold, fontSize: fontSize.lg, color: colors.onSurface, letterSpacing: 0.6 },
  prepBanner: { flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.brandPrimary, backgroundColor: colors.brandTertiary },
  prepTitle: { fontFamily: fontFamily.textBold, fontSize: fontSize.lg, color: colors.onSurface },
  prepSub: { fontFamily: fontFamily.text, fontSize: 12, lineHeight: 18, color: colors.muted },
  controls: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  ctrl: { flexGrow: 1, flexBasis: 150, minWidth: 0, minHeight: 68, paddingHorizontal: spacing.sm, paddingVertical: spacing.md, borderRadius: radius.lg, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm },
  ctrlStacked: { flexBasis: "100%" },
  ctrlSecondary: { backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderColor: colors.borderStrong },
  ctrlPrimary: {
    backgroundColor: colors.brandPrimary,
    ...Platform.select({
      web: { boxShadow: `0 0 18px ${colors.brandPrimary}73` },
      default: {
        shadowColor: colors.brandPrimary,
        shadowOpacity: 0.45,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 0 },
        elevation: 10,
      },
    }),
  },
  correctPill: {
    flexDirection: "row",
    alignSelf: "center",
    alignItems: "center",
    gap: spacing.sm,
    minHeight: 44,
    maxWidth: "100%",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSecondary,
  },
  ctrlLabel: { fontFamily: fontFamily.textBold, fontSize: 17, lineHeight: 24, color: colors.onSurface, flexShrink: 1, textAlign: "center" },
  ctrlPrimaryLabel: { fontSize: 20, lineHeight: 28, color: colors.onBrandPrimary },
  panel: { backgroundColor: colors.surfaceSecondary, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.md, borderWidth: 1, borderColor: colors.border },
  panelTitle: { fontFamily: fontFamily.textBold, fontSize: 20, lineHeight: 26, letterSpacing: 0.8, color: colors.brandPrimary, textTransform: "uppercase" },
  panelHint: { fontFamily: fontFamily.text, fontSize: 12, color: colors.muted, lineHeight: 18 },
  result: { fontFamily: fontFamily.display, fontSize: fontSize["2xl"] + 4, color: colors.onSurface },
  tabRow: { flexDirection: "row", gap: spacing.md },
  tabTeam: { fontFamily: fontFamily.textBold, fontSize: 14, lineHeight: 20, color: colors.onSurface },
  tabInput: { width: "100%", minWidth: 0, minHeight: 64, borderRadius: radius.sm, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderStrong, color: colors.onSurface, fontFamily: fontFamily.display, fontSize: fontSize["2xl"], textAlign: "center" },
  linksRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  link: { flexDirection: "row", alignItems: "center", gap: spacing.xs, minHeight: 44, maxWidth: "100%", paddingHorizontal: spacing.sm, paddingVertical: spacing.sm },
  linkLabel: { flexShrink: 1, fontFamily: fontFamily.textBold, fontSize: fontSize.base, color: colors.brandPrimary },
  tieRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, minHeight: 52, paddingHorizontal: spacing.md, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  tieName: { flex: 1, minWidth: 0, fontFamily: fontFamily.textBold, fontSize: fontSize.lg, color: colors.onSurface },
}));

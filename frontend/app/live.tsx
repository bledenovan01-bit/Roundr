import { Alert } from '@/src/components/confirm';
import { useAudioError } from "@/src/audio/sounds";
import { requestMatchNotifications, useNotificationMessage } from "@/src/audio/notifications";
// E03–E07 — Live commun, pause, pause entre périodes, départage, transition.
import { useState } from "react";
import { Redirect, useRouter } from "expo-router";
import { useKeepAwake } from "expo-keep-awake";
import {  KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import MaterialCommunityIcons from "@react-native-vector-icons/material-design-icons";

import { elapsedMs } from "@/src/chrono/engine";
import { formatMMSS, formatRemaining } from "@/src/chrono/format";
import { PrimaryButton } from "@/src/components/primary-button";
import { GAME_MODES } from "@/src/data/modes";
import { TEAM_PALETTE } from "@/src/domain/defaults";

import * as S from "@/src/domain/session";
import type { Session, Team } from "@/src/domain/types";
import { archiveSession, dispatchSession, retrySave, useStore } from "@/src/store/session-store";
import { fontSize, makeStyles, radius, spacing, useTheme } from "@/src/theme";
import { TypographyPreview, refinedFontFamily as fontFamily } from "@/src/typography-preview";
import { layoutStyles, useScreenLayout } from "@/src/layout";

const TEAM_COL = 48;

export default function LiveScreen() {
  useKeepAwake();
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const session = useStore((s) => s.session);
  const now = useStore((s) => s.now);
  const saveError = useStore((s) => s.saveError);
  const audioError = useAudioError();
  const notificationMessage = useNotificationMessage();
  const { safeSides } = useScreenLayout();
  const [correcting, setCorrecting] = useState(false);
  const [locked, setLocked] = useState(false);
  const [tab, setTab] = useState<[string, string]>(["", ""]);
  const archiving = useStore(s => s.archiving);
  const lastSummary = useStore(s => s.lastSummary);
  const live = session?.live ?? null;
  const single = session?.mode === "classique" || session?.mode === "custom";
  const [editingMatch, setEditingMatch] = useState(live?.matchId);
  if (editingMatch !== live?.matchId) { setEditingMatch(live?.matchId); setCorrecting(false); setTab(["", ""]); }

  if (!session || !live) return <Redirect href={lastSummary ? "/summary" : "/"} />;

  const mode = GAME_MODES.find((m) => m.id === session.mode)!;
  const accent = colors[mode.accent];
  const match = S.currentMatch(session)!;
  const [teamA, teamB] = S.liveTeams(session);
  const el = elapsedMs(live.chrono, now);
  const paused = S.isPaused(live);
  const next = S.nextMatchInfo(session);

  // Affichage du temps selon l'étape.
  let time = "00:00";
  let caption = "Temps restant";
  let status = "Match en cours";
  const target = live.periodMs[live.periodIndex] ?? 0;
  switch (live.stage) {
    case "period":
      if (live.end.byTime) {
        time = formatRemaining(target - el);
      } else {
        time = formatMMSS(el);
        caption = "Temps de jeu";
        status = `Premier à ${live.end.goalTarget} buts`;
      }
      if (live.periodMs.length > 1) status = `Période ${live.periodIndex + 1}/${live.periodMs.length}`;
      if (paused) status = "PAUSE";
      break;
    case "break":
      time = formatRemaining(live.breakMs - el);
      caption = "Pause";
      status = `Période ${live.periodIndex + 1} terminée`;
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
      break;
    case "extra":
      time = formatRemaining(live.extraMs - el);
      caption = live.maracanaExtension ? "Extension 2 min" : "Prolongation";
      status = paused ? "PAUSE" : live.maracanaExtension ? "Premier but gagnant" : "Prolongation";
      break;
    case "golden":
      time = `+${formatMMSS(el)}`;
      caption = "Golden goal";
      status = paused ? "PAUSE" : "Premier but gagnant";
      break;
    case "shootout":
      time = "TAB";
      caption = "Tirs au but";
      status = "Saisis le résultat";
      break;
    case "finished":
      time = formatMMSS(live.playedMs);
      caption = "Durée jouée";
      status = "Match terminé";
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
        onPress: async () => {
          if (await archiveSession(S.endSession(session, Date.now()))) router.replace("/summary" as never);
        },
      },
    ]);
  };

  const addTeam = () => {
    const n = session.teams.length + 1;
    dispatchSession((s, t) => S.addMaracanaTeam(s, { id: `t${n}${Date.now().toString(36)}`, name: `Équipe ${n}`, color: TEAM_PALETTE[(n - 1) % TEAM_PALETTE.length] }, t));
  };

  const prepActive = live.firedAlerts.includes("prep") && live.stage !== "finished" && next;

  const liveHeader = (
    <View style={styles.header}>
      <Pressable testID="live-back" onPress={() => router.replace("/" as never)} hitSlop={12} style={styles.iconBtn} accessibilityRole="button" accessibilityLabel="Retour accueil">
        <MaterialCommunityIcons name="chevron-left" size={30} color={colors.onSurface} />
      </Pressable>
      <View style={{ alignItems: "center", flex: 1, minWidth: 0 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, maxWidth: "100%" }}>
          <MaterialCommunityIcons name={mode.icon} size={18} color={accent} />
          <Text testID="live-title" accessibilityRole="header" style={styles.modeTitle}>{mode.title.toUpperCase()}</Text>
        </View>
        <Text testID="live-match-label" style={styles.matchLabel}>{match.label}</Text>
      </View>
      <Pressable testID="live-standings" onPress={() => router.push("/standings" as never)} hitSlop={12} style={[styles.iconBtn, single && { opacity: 0 }]} disabled={single} accessibilityRole="button" accessibilityLabel="Voir le classement" accessibilityElementsHidden={single} aria-hidden={single} importantForAccessibility={single ? "no-hide-descendants" : "auto"}>
        <MaterialCommunityIcons name="podium" size={26} color={colors.onSurface} />
      </Pressable>
    </View>
  );
  const scoreTeams = live.scoreOn ? (
    <View testID="live-score-teams" style={styles.teamsBelow}>
      {[teamA, teamB].map((team, side) => (
        <View key={side} style={layoutStyles.flexible}>
          <TeamColumn team={team} score={live.score[side]} side={side as 0 | 1} canScore={canScore} correcting={correcting} finished={live.stage === "finished"} compact />
        </View>
      ))}
    </View>
  ) : null;
  const showSummary = async () => {
    if (await archiveSession(S.endSession(session, Date.now()))) router.replace("/summary" as never);
  };
  const restart = () => Alert.alert("Recommencer ce match ?", "Le score et le chrono de ce match seront remis à zéro. Les matchs précédents sont conservés.", [
    { text: "Annuler", style: "cancel" },
    { text: "Recommencer", style: "destructive", onPress: () => dispatchSession(S.restartCurrent) },
  ]);

  return (
    <TypographyPreview.Provider value={true}>
    <KeyboardAvoidingView testID="live-screen" style={[styles.root, safeSides, { paddingTop: insets.top }]} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <View style={layoutStyles.scroll} pointerEvents={locked || archiving ? "none" : "auto"} accessibilityElementsHidden={locked} importantForAccessibility={locked ? "no-hide-descendants" : "auto"}>
      <ScrollView testID="live-scroll" style={layoutStyles.scroll} contentContainerStyle={[layoutStyles.content, styles.scroll, { paddingBottom: insets.bottom + spacing["2xl"] }]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
        {liveHeader}
        {audioError ? <Text style={styles.panelHint}>{audioError}</Text> : null}
        {notificationMessage && session.config.sounds ? <Pressable onPress={() => void requestMatchNotifications()} style={styles.correctPill} accessibilityRole="button"><Text style={styles.correctLabel}>{notificationMessage}</Text></Pressable> : null}

        {saveError ? (
          <View style={styles.errorBanner} testID="save-error">
            <MaterialCommunityIcons name="alert" size={18} color={colors.onError} />
            <Text style={styles.errorText}>{saveError}</Text><Pressable accessibilityRole="button" onPress={() => void retrySave()}><Text style={styles.errorText}>Réessayer</Text></Pressable>
          </View>
        ) : null}

        {scoreTeams}
        <View testID="live-chrono" style={styles.timer}>
          <Text style={styles.timerCaption}>{caption}</Text>
          <Text testID="live-time" maxFontSizeMultiplier={1} style={[styles.timerTime, time.length > 5 && { fontSize: 58 }]} accessibilityLabel={caption + " : " + time}>{time}</Text>
          <Text testID="live-time-status" style={[styles.timerStatus, paused && { color: colors.warning }]}>{status}</Text>
        </View>
        {!live.scoreOn ? (
          <Text style={styles.teamsLine}>{teamA?.name} <Text style={{ color: colors.muted }}>vs</Text> {teamB?.name}</Text>
        ) : null}

        {live.scoreOn && live.stage !== "shootout" ? (
          <Pressable testID="toggle-correct" onPress={() => setCorrecting((c) => !c)} style={styles.correctPill} accessibilityRole="button" accessibilityLabel={correcting ? "Terminer la correction" : "Corriger le score"} accessibilityState={{ expanded: correcting }} aria-expanded={correcting}>
            <MaterialCommunityIcons name={correcting ? "check" : "pencil-outline"} size={16} color={colors.muted} />
            <Text style={styles.correctLabel}>{correcting ? "Terminer la correction" : "Corriger le score"}</Text>
          </Pressable>
        ) : null}

        {next && live.stage !== "finished" ? (
          <View style={styles.nextCard} testID="next-card">
            <Text style={styles.nextTitle}>Ensuite</Text>
            <Text style={styles.nextTeams}>{next.aLabel} · {next.bLabel}</Text>
            {prepActive ? <View style={styles.prepBanner} testID="prep-banner">
              <MaterialCommunityIcons name="bullhorn-outline" size={18} color={colors.brandPrimary} />
              <Text style={[styles.prepTitle, { flex: 1 }]}>{live.firedAlerts.includes("prep1") ? "Vous jouez juste après" : "Préparez-vous"}</Text>
            </View> : null}
          </View>
        ) : null}
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
              disabled={tab[0] === "" || tab[1] === "" || !Number.isSafeInteger(Number(tab[0])) || !Number.isSafeInteger(Number(tab[1])) || Number(tab[0]) === Number(tab[1])}
              onPress={() => {
                dispatchSession((s, t) => S.submitShootout(s, parseInt(tab[0], 10), parseInt(tab[1], 10), t));
                setTab(["", ""]);
              }}
            />
          </View>
        ) : null}

        {/* Transition E07 */}
        {live.stage === "finished" ? (
          <Transition session={session} next={next} onNext={() => dispatchSession(S.launchNext)} onEndSession={finishSession} onAddTeam={addTeam} onSummary={() => void showSummary()} onStandings={() => router.push("/standings" as never)} />
        ) : null}

        {session.cup?.tieChoice ? <TieChoice key={session.cup.tieChoice.context + session.cup.tieChoice.candidates.join()} session={session} /> : null}

      </ScrollView>
      </View>
      <View testID="live-controls" style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
        {locked ? <Pressable testID="live-unlock" accessibilityRole="button" accessibilityLabel="Maintenir pour déverrouiller" onLongPress={() => setLocked(false)} delayLongPress={800} style={[styles.barButton, { flex: 1 }]}>
          <MaterialCommunityIcons name="lock" size={22} color={colors.brandPrimary} />
          <Text style={styles.barLabel}>Maintenir pour déverrouiller</Text>
        </Pressable> : <>
          <Pressable testID="live-end" disabled={!inPlay || archiving} onPress={confirmEnd} accessibilityRole="button" accessibilityLabel="Fin du match" style={[styles.barButton, !inPlay && { opacity: 0.35 }]}><MaterialCommunityIcons name="stop" size={22} color={colors.error} /><Text style={styles.barLabel}>Fin</Text></Pressable>
          <Pressable testID="live-lock" disabled={archiving} onPress={() => setLocked(true)} accessibilityRole="button" accessibilityLabel="Verrouiller les commandes" style={styles.barButton}><MaterialCommunityIcons name="lock-outline" size={22} color={colors.onSurface} /><Text style={styles.barLabel}>Verrouiller</Text></Pressable>
          <Pressable testID="live-restart" disabled={archiving} onPress={restart} accessibilityRole="button" accessibilityLabel="Recommencer ce match" style={styles.barButton}><MaterialCommunityIcons name="restart" size={22} color={colors.onSurface} /><Text style={styles.barLabel}>Recommencer</Text></Pressable>
          <Pressable testID={paused ? "live-resume" : "live-pause"} disabled={!inPlay || archiving} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {}); dispatchSession(paused ? S.resume : S.pause); }} accessibilityRole="button" accessibilityLabel={paused ? "Reprendre le chrono" : "Mettre le chrono en pause"} style={[styles.barButton, styles.barPrimary, !inPlay && { opacity: 0.35 }]}><MaterialCommunityIcons name={paused ? "play" : "pause"} size={24} color={colors.onBrandPrimary} /><Text style={[styles.barLabel, { color: colors.onBrandPrimary }]}>{paused ? "Reprendre" : "Pause"}</Text></Pressable>
        </>}
      </View>
    </KeyboardAvoidingView>
    </TypographyPreview.Provider>
  );
}

function TeamColumn({ team, score, side, canScore, correcting, finished, compact }: { team: Team | null; score: number; side: 0 | 1; canScore: boolean; correcting: boolean; finished: boolean; compact: boolean }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const { contentWidth } = useScreenLayout();
  const scoreSize = (compact ? 52 : Math.min(52, contentWidth * 0.18)) / Math.max(1, String(score).length / 1.5);
  const act = (delta: 1 | -1) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    dispatchSession((s, now) => (finished ? S.correctLast(s, side, delta, now) : S.goal(s, side, delta, now)));
  };
  const canCorrectFinished = finished && correcting;
  return (
    <View testID={`live-team-${side}`} style={[styles.teamCol, compact && styles.teamColCompact]}>
      <View style={[styles.teamIdentity, compact && styles.teamIdentityCompact]}>
      <View style={[styles.jersey, { borderColor: team?.color ?? colors.border }]}>
        <MaterialCommunityIcons name="tshirt-crew" size={26} color={team?.color ?? colors.muted} />
      </View>
      <Text testID={`live-team-${side}-name`} style={[styles.teamName, (team?.name.length ?? 0) > 10 && styles.teamNameLong, compact && styles.teamNameCompact]}>{team?.name?.toUpperCase()}</Text>
      </View>
      <View style={[styles.scoreActions, compact && styles.scoreActionsCompact]}>
      <Text style={[styles.score, { fontSize: scoreSize, lineHeight: scoreSize }]} testID={`score-${side}`}>{score}</Text>
      {canScore || canCorrectFinished ? (
        <View style={{ gap: spacing.xs }}>
          <Pressable testID={`goal-${side}`} onPress={() => act(1)} style={[styles.plus, { borderColor: team?.color ?? colors.borderStrong }, correcting && { borderColor: colors.brandPrimary }]} accessibilityRole="button" accessibilityLabel={`Ajouter un but : ${team?.name}`}>
            <Text style={styles.plusLabel}>+1</Text>
          </Pressable>
          {correcting ? (
            <Pressable testID={`ungoal-${side}`} onPress={() => act(-1)} style={[styles.plus, styles.minus]} disabled={score <= 0} accessibilityRole="button" accessibilityLabel={`Retirer un but : ${team?.name}`} accessibilityState={{ disabled: score <= 0 }} aria-disabled={score <= 0}>
              <Text style={[styles.plusLabel, { color: score <= 0 ? colors.muted : colors.error }]}>−1</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
      </View>
    </View>
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
    <View style={styles.panel} testID="transition-panel">
      <Text style={styles.panelTitle}>Match terminé</Text>
      <Text style={styles.result}>
        {a?.name} {match.score ? `${match.score[0]} – ${match.score[1]}` : "vs"} {b?.name}
      </Text>
      {match.shootout ? <Text style={styles.panelHint}>TAB {match.shootout[0]}–{match.shootout[1]} · {winner} qualifié</Text> : winner ? <Text style={styles.panelHint}>Vainqueur : {winner}</Text> : <Text style={styles.panelHint}>Match nul</Text>}
      {session.lastEvent ? <Text style={styles.panelHint}>{session.lastEvent}</Text> : null}
      {complete ? (
        <PrimaryButton testID="see-summary" label="Voir le résumé" onPress={onSummary} />
      ) : next && !session.cup?.tieChoice ? (
        <>
          <View style={styles.nextCard}>
            <Text style={styles.nextTitle}>Prochain match · {next.durationMin} min</Text>
            <Text style={styles.nextTeams}>{next.aLabel}  vs  {next.bLabel}</Text>
            <Text style={styles.prepSub}>Préparez-vous</Text>
          </View>
          <PrimaryButton testID="launch-next" label="Lancer le prochain match" onPress={onNext} disabled={!next.certain} />
        </>
      ) : null}
      {match.shootout ? <Pressable onPress={() => dispatchSession(S.correctShootout)} style={styles.link}><Text style={styles.linkLabel}>Corriger les TAB</Text></Pressable> : null}
      <View style={styles.linksRow}>
        {session.mode !== "classique" && session.mode !== "custom" ? <Pressable onPress={onStandings} style={styles.link} testID="transition-standings" accessibilityRole="button" accessibilityLabel={session.mode === "maracana" ? "Classement" : "Tableau"}>
          <MaterialCommunityIcons name="podium" size={18} color={colors.brandPrimary} />
          <Text style={styles.linkLabel}>{session.mode === "maracana" ? "Classement" : "Tableau"}</Text>
        </Pressable> : null}
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
  timer: { alignItems: "center", paddingVertical: spacing.sm },
  timerCaption: { fontFamily: fontFamily.text, fontSize: 13, color: colors.muted },
  timerTime: { fontFamily: fontFamily.display, fontSize: 76, lineHeight: 82, color: colors.onSurface, fontVariant: ["tabular-nums"] },
  timerStatus: { fontFamily: fontFamily.textBold, fontSize: 14, color: colors.brandPrimary, textAlign: "center" },
  bottomBar: { flexDirection: "row", paddingHorizontal: 8, paddingTop: 8, gap: 4, borderTopWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  barButton: { flex: 1, minWidth: 0, minHeight: 60, gap: 4, alignItems: "center", justifyContent: "center", borderRadius: 12, paddingVertical: 8, backgroundColor: colors.surfaceSecondary },
  barPrimary: { backgroundColor: colors.brandPrimary },
  barLabel: { fontFamily: fontFamily.textBold, fontSize: 10, color: colors.onSurface, textAlign: "center", flexShrink: 1 },

  scroll: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, gap: spacing.lg, flexGrow: 1 },
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
  teamIdentityCompact: { minHeight: 54, flexDirection: "row", width: "100%" },
  scoreActions: { alignItems: "center", gap: spacing.sm },
  scoreActionsCompact: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", width: "100%" },
  jersey: { width: 34, height: 34, borderRadius: 17, borderWidth: 3, alignItems: "center", justifyContent: "center", backgroundColor: colors.surfaceSecondary },
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
  plus: { width: TEAM_COL, height: 44, borderRadius: radius.md, backgroundColor: colors.surfaceSecondary, borderWidth: 1.5, borderColor: colors.borderStrong, alignItems: "center", justifyContent: "center" },
  minus: { height: 44, backgroundColor: colors.surface },
  plusLabel: { fontFamily: fontFamily.display, fontSize: 23, color: colors.onSurface },
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
    borderWidth: 0,
    backgroundColor: "transparent",
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



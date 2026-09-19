// E03–E07 — Live commun, pause, pause entre périodes, départage, transition.
import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { Alert, AppState, Platform, Pressable, ScrollView, Text, TextInput, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import MaterialCommunityIcons from "@react-native-vector-icons/material-design-icons";

import { elapsedMs } from "@/src/chrono/engine";
import { formatMMSS } from "@/src/chrono/format";
import { ChronoRing } from "@/src/components/chrono-ring";
import { GiantChrono } from "@/src/components/giant-chrono";
import { PrimaryButton } from "@/src/components/primary-button";
import { GAME_MODES } from "@/src/data/modes";
import { TEAM_PALETTE } from "@/src/domain/defaults";
import { prepLeadMs } from "@/src/domain/preparation";
import * as S from "@/src/domain/session";
import type { Session, Team } from "@/src/domain/types";
import { archiveSession, dispatchSession, tick, useStore } from "@/src/store/session-store";
import { fontFamily, fontSize, makeStyles, radius, spacing, useTheme } from "@/src/theme";

const TEAM_COL = 68;

export default function LiveScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const session = useStore((s) => s.session);
  const now = useStore((s) => s.now);
  const saveError = useStore((s) => s.saveError);
  const { width } = useWindowDimensions();
  const [correcting, setCorrecting] = useState(false);
  const [giant, setGiant] = useState(false);
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
    if (!session) {
      router.replace("/" as never);
      return;
    }
    if (session.status !== "active") {
      archiveSession(session);
      router.replace("/summary" as never);
      return;
    }
    if (single && live?.stage === "finished") {
      archiveSession(S.endSession(session, Date.now()));
      router.replace("/summary" as never);
    }
  }, [session, live?.stage, single, router]);

  if (!session || !live) return <View style={styles.root} />;

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
          archiveSession(S.endSession(session, Date.now()));
          router.replace("/summary" as never);
        },
      },
    ]);
  };

  const addTeam = () => {
    const n = session.teams.length + 1;
    dispatchSession((s, t) => S.addMaracanaTeam(s, { id: `t${n}${Date.now().toString(36)}`, name: `Équipe ${n}`, color: TEAM_PALETTE[(n - 1) % TEAM_PALETTE.length] }, t));
  };

  const prepActive = live.firedAlerts.includes("prep") && live.stage !== "finished" && next;
  const remainingMs = live.stage === "period" && live.end.byTime ? Math.max(0, target - el) : null;
  const teamColor = (label: string) => session.teams.find((t) => t.name === label)?.color ?? null;
  const ringSize = Math.min(268, width - spacing.lg * 2);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + spacing["2xl"] }]} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable testID="live-back" onPress={() => router.replace("/" as never)} hitSlop={12} style={styles.iconBtn}>
            <MaterialCommunityIcons name="chevron-left" size={30} color={colors.onSurface} />
          </Pressable>
          <View style={{ alignItems: "center", flex: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
              <MaterialCommunityIcons name={mode.icon} size={18} color={accent} />
              <Text style={styles.modeTitle}>{mode.title.toUpperCase()}</Text>
            </View>
            <Text style={styles.matchLabel}>{match.label}</Text>
          </View>
          <Pressable testID="live-standings" onPress={() => router.push("/standings" as never)} hitSlop={12} style={[styles.iconBtn, single && { opacity: 0 }]} disabled={single}>
            <MaterialCommunityIcons name="podium" size={26} color={colors.onSurface} />
          </Pressable>
        </View>

        {saveError ? (
          <View style={styles.errorBanner} testID="save-error">
            <MaterialCommunityIcons name="alert" size={18} color={colors.onError} />
            <Text style={styles.errorText}>{saveError}</Text>
          </View>
        ) : null}

        {/* Score + chrono — le chrono domine l'écran (maquette live) */}
        <View style={[styles.arena, { height: ringSize }]}>
          <ChronoRing
            time={time}
            caption={caption}
            status={status}
            progress={progress}
            size={ringSize}
            accent={paused ? colors.muted : colors.brandPrimary}
            testID="live-chrono"
          />
          {live.scoreOn ? (
            <>
              <View style={[styles.teamSlot, { left: 0 }]}>
                <TeamColumn team={teamA} score={live.score[0]} side={0} canScore={canScore} correcting={correcting} finished={live.stage === "finished"} />
              </View>
              <View style={[styles.teamSlot, { right: 0 }]}>
                <TeamColumn team={teamB} score={live.score[1]} side={1} canScore={canScore} correcting={correcting} finished={live.stage === "finished"} />
              </View>
            </>
          ) : null}
        </View>
        {!live.scoreOn ? (
          <Text style={styles.teamsLine}>{teamA?.name} <Text style={{ color: colors.muted }}>vs</Text> {teamB?.name}</Text>
        ) : null}

        {live.scoreOn && live.stage !== "shootout" ? (
          <Pressable testID="toggle-correct" onPress={() => setCorrecting((c) => !c)} style={styles.correctPill}>
            <MaterialCommunityIcons name={correcting ? "check" : "pencil-outline"} size={16} color={colors.muted} />
            <Text style={styles.correctLabel}>{correcting ? "Terminer la correction" : "Corriger le score"}</Text>
          </Pressable>
        ) : null}

        {/* Prochain match / préparation (§8) */}
        {next && live.stage !== "finished" ? (
          <View style={styles.nextCard} testID="next-card">
            <View style={styles.rowBetween}>
              <Text style={styles.nextTitle}>Prochain match</Text>
              <Text style={styles.nextMeta}>{live.end.byTime ? `${next.durationMin} min` : "Ensuite"}</Text>
            </View>
            {next.certain ? (
              <View style={styles.nextTeamRow}>
                <View style={[styles.nextJersey, { borderColor: teamColor(next.aLabel) ?? colors.borderStrong }]}>
                  <MaterialCommunityIcons name="tshirt-crew" size={20} color={teamColor(next.aLabel) ?? colors.muted} />
                </View>
                <Text style={styles.nextTeams} numberOfLines={1}>{next.aLabel.toUpperCase()}</Text>
                <Text style={styles.vs}>VS</Text>
                <Text style={[styles.nextTeams, { flex: 1, textAlign: "right" }]} numberOfLines={1}>{next.bLabel.toUpperCase()}</Text>
                <View style={[styles.nextJersey, { borderColor: teamColor(next.bLabel) ?? colors.borderStrong }]}>
                  <MaterialCommunityIcons name="tshirt-crew" size={20} color={teamColor(next.bLabel) ?? colors.muted} />
                </View>
              </View>
            ) : (
              <Text style={styles.nextTeams}>{`${next.aLabel} contre ${next.bLabel}`}</Text>
            )}
            {prepActive ? (
              <View style={styles.prepBanner} testID="prep-banner">
                <MaterialCommunityIcons name="bullhorn-outline" size={20} color={colors.brandPrimary} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.prepTitle}>{live.firedAlerts.includes("prep1") ? "Vous jouez juste après" : `Préparez-vous — ${next.aLabel} vs ${next.bLabel}`}</Text>
                  {remainingMs != null ? <Text style={styles.prepSub}>{live.end.goalTarget != null ? "Ensuite, selon la fin du match" : `Prochain match dans ~${Math.ceil(remainingMs / 60_000)} min`}</Text> : null}
                </View>
              </View>
            ) : live.end.byTime && live.stage === "period" && remainingMs != null && remainingMs > prepLeadMs(next.durationMin) ? (
              <Text style={styles.prepSub}>Réactivation prévue {Math.round(prepLeadMs(next.durationMin) / 60_000)} min avant la fin.</Text>
            ) : null}
          </View>
        ) : null}

        {/* Commandes principales (UX-03) */}
        {inPlay ? (
          <View style={styles.controls}>
            <Pressable
              testID={paused ? "live-resume" : "live-pause"}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
                dispatchSession(paused ? S.resume : S.pause);
              }}
              style={[styles.ctrl, styles.ctrlSecondary]}
            >
              <MaterialCommunityIcons name={paused ? "play" : "pause"} size={24} color={colors.onSurface} />
              <Text style={styles.ctrlLabel}>{paused ? "Reprendre" : "Pause"}</Text>
            </Pressable>
            <Pressable testID="live-end" onPress={confirmEnd} style={[styles.ctrl, styles.ctrlPrimary]}>
              <MaterialCommunityIcons name="stop" size={22} color={colors.onBrandPrimary} />
              <Text style={[styles.ctrlLabel, { color: colors.onBrandPrimary }]}>Fin du match</Text>
            </Pressable>
          </View>
        ) : null}

        {inPlay ? (
          <Pressable testID="live-giant" onPress={() => setGiant(true)} style={styles.correctPill}>
            <MaterialCommunityIcons name="arrow-expand-all" size={18} color={colors.brandPrimary} />
            <Text style={[styles.correctLabel, { color: colors.brandPrimary }]}>Chrono géant</Text>
          </Pressable>
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
                  <Text style={styles.tabTeam} numberOfLines={1}>{(i === 0 ? teamA : teamB)?.name}</Text>
                  <TextInput
                    testID={`tab-${i}`}
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
          <Transition session={session} next={next} onNext={() => dispatchSession(S.launchNext)} onEndSession={finishSession} onAddTeam={addTeam} onSummary={() => { archiveSession(S.endSession(session, Date.now())); router.replace("/summary" as never); }} onStandings={() => router.push("/standings" as never)} />
        ) : null}

        {session.cup?.tieChoice ? <TieChoice session={session} /> : null}

        <View style={styles.brandFooter} testID="live-brand">
          <Text style={styles.brandTagline}>PLUS DE JEU. MOINS D’ORGANISATION.</Text>
          <Text style={styles.brandWordmark}>
            Roundr<Text style={{ color: colors.brandPrimary }}>.</Text>
          </Text>
        </View>
      </ScrollView>

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
    </View>
  );
}

function TeamColumn({ team, score, side, canScore, correcting, finished }: { team: Team | null; score: number; side: 0 | 1; canScore: boolean; correcting: boolean; finished: boolean }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const act = (delta: 1 | -1) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    dispatchSession((s, now) => (finished ? S.correctLast(s, side, delta, now) : S.goal(s, side, delta, now)));
  };
  const canCorrectFinished = finished && correcting;
  return (
    <View style={styles.teamCol}>
      <View style={[styles.jersey, { borderColor: team?.color ?? colors.border }]}>
        <MaterialCommunityIcons name="tshirt-crew" size={26} color={team?.color ?? colors.muted} />
      </View>
      <Text style={styles.teamName} numberOfLines={1}>{team?.name?.toUpperCase()}</Text>
      <Text style={styles.score} testID={`score-${side}`}>{score}</Text>
      {canScore || canCorrectFinished ? (
        <View style={{ gap: spacing.xs }}>
          <Pressable testID={`goal-${side}`} onPress={() => act(1)} style={[styles.plus, { borderColor: team?.color ?? colors.borderStrong }, correcting && { borderColor: colors.brandPrimary }]}>
            <Text style={styles.plusLabel}>+1</Text>
          </Pressable>
          {correcting ? (
            <Pressable testID={`ungoal-${side}`} onPress={() => act(-1)} style={[styles.plus, styles.minus]} disabled={score <= 0}>
              <Text style={[styles.plusLabel, { color: score <= 0 ? colors.muted : colors.error }]}>−1</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
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
      <View style={styles.linksRow}>
        <Pressable onPress={onStandings} style={styles.link} testID="transition-standings">
          <MaterialCommunityIcons name="podium" size={18} color={colors.brandPrimary} />
          <Text style={styles.linkLabel}>{session.mode === "maracana" ? "Classement" : "Tableau"}</Text>
        </Pressable>
        {session.mode === "maracana" && session.teams.length < 8 ? (
          <Pressable onPress={onAddTeam} style={styles.link} testID="add-team">
            <MaterialCommunityIcons name="account-multiple-plus" size={18} color={colors.brandPrimary} />
            <Text style={styles.linkLabel}>Ajouter une équipe</Text>
          </Pressable>
        ) : null}
        {!complete ? (
          <Pressable onPress={onEndSession} style={styles.link} testID="end-session">
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
            <Pressable key={id} testID={`tie-${id}`} onPress={() => setPicked((p) => (on ? p.filter((x) => x !== id) : p.length < tc.slots ? [...p, id] : p))} style={[styles.tieRow, on && { borderColor: colors.brandPrimary }]}>
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
  scroll: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, gap: spacing.lg, flexGrow: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  iconBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  modeTitle: { fontFamily: fontFamily.textBold, fontSize: fontSize.lg, color: colors.onSurface, letterSpacing: 1.6 },
  brandFooter: { alignItems: "center", gap: spacing.xs, paddingTop: spacing.lg, marginTop: "auto" },
  brandTagline: { fontFamily: fontFamily.text, fontSize: 10, color: colors.muted, letterSpacing: 2.2 },
  brandWordmark: { fontFamily: fontFamily.textBold, fontSize: fontSize.xl, color: colors.onSurface, letterSpacing: -0.8 },
  nextTeamRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  nextJersey: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, alignItems: "center", justifyContent: "center", backgroundColor: colors.surface },
  vs: { fontFamily: fontFamily.textBold, fontSize: fontSize.base, color: colors.muted, letterSpacing: 1.2 },
  matchLabel: { fontFamily: fontFamily.text, fontSize: fontSize.base, color: colors.muted },
  errorBanner: { flexDirection: "row", gap: spacing.sm, alignItems: "center", padding: spacing.md, borderRadius: radius.sm, backgroundColor: colors.error },
  errorText: { flex: 1, fontFamily: fontFamily.textBold, fontSize: fontSize.sm, color: colors.onError },
  arena: { alignItems: "center", justifyContent: "center", marginTop: spacing.sm },
  teamSlot: { position: "absolute", top: 0, bottom: 0, width: TEAM_COL, justifyContent: "center" },
  teamCol: { width: TEAM_COL, alignItems: "center", gap: spacing.sm },
  jersey: { width: 54, height: 54, borderRadius: 27, borderWidth: 3, alignItems: "center", justifyContent: "center", backgroundColor: colors.surfaceSecondary },
  teamName: { fontFamily: fontFamily.textBold, fontSize: fontSize.sm, color: colors.onSurface, letterSpacing: 0.8, maxWidth: TEAM_COL },
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
  correctLabel: { fontFamily: fontFamily.textBold, fontSize: fontSize.base, color: colors.onSurfaceTertiary },
  nextCard: { backgroundColor: colors.surfaceSecondary, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.md, borderWidth: 1, borderColor: colors.border },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  nextTitle: { fontFamily: fontFamily.text, fontSize: fontSize.base + 1, color: colors.muted },
  nextMeta: { fontFamily: fontFamily.textBold, fontSize: fontSize.base, color: colors.muted },
  nextTeams: { fontFamily: fontFamily.textBold, fontSize: fontSize.lg, color: colors.onSurface, letterSpacing: 0.6 },
  prepBanner: { flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.brandPrimary, backgroundColor: colors.brandTertiary },
  prepTitle: { fontFamily: fontFamily.textBold, fontSize: fontSize.lg, color: colors.onSurface },
  prepSub: { fontFamily: fontFamily.text, fontSize: fontSize.base, color: colors.muted },
  controls: { flexDirection: "row", gap: spacing.md },
  ctrl: { flex: 1, minHeight: 68, borderRadius: radius.lg, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm },
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
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSecondary,
  },
  ctrlLabel: { fontFamily: fontFamily.textBold, fontSize: fontSize.xl - 2, color: colors.onSurface },
  panel: { backgroundColor: colors.surfaceSecondary, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.md, borderWidth: 1, borderColor: colors.border },
  panelTitle: { fontFamily: fontFamily.textBold, fontSize: fontSize.sm, letterSpacing: 1.5, color: colors.brandPrimary, textTransform: "uppercase" },
  panelHint: { fontFamily: fontFamily.text, fontSize: fontSize.base, color: colors.muted, lineHeight: fontSize.base * 1.4 },
  result: { fontFamily: fontFamily.display, fontSize: fontSize["2xl"] + 4, color: colors.onSurface },
  tabRow: { flexDirection: "row", gap: spacing.md },
  tabTeam: { fontFamily: fontFamily.textBold, fontSize: fontSize.sm, color: colors.onSurface },
  tabInput: { minHeight: 64, borderRadius: radius.sm, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderStrong, color: colors.onSurface, fontFamily: fontFamily.display, fontSize: fontSize["2xl"], textAlign: "center" },
  linksRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  link: { flexDirection: "row", alignItems: "center", gap: spacing.xs, minHeight: 44, paddingHorizontal: spacing.sm },
  linkLabel: { fontFamily: fontFamily.textBold, fontSize: fontSize.base, color: colors.brandPrimary },
  tieRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, minHeight: 52, paddingHorizontal: spacing.md, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  tieName: { fontFamily: fontFamily.textBold, fontSize: fontSize.lg, color: colors.onSurface },
}));

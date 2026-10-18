import { FreeStorageNotice } from "@/src/components/free-storage-notice";
// Chrono libre — Écran d'exécution (Phase 3, réf. Lovable).
// Gère les 3 outils : chronomètre (tours), compte à rebours, intervalles.
// Affichages numérique / circulaire / analogique. Moteur temporel fiable.
import { useEffect, useRef, useState } from "react";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialCommunityIcons from "@react-native-vector-icons/material-design-icons";

import { Alert } from "@/src/alert";
import { ChronoRing } from "@/src/components/chrono-ring";
import { ChronoTime } from "@/src/components/chrono-time";
import { AnalogChrono } from "@/src/components/analog-chrono";
import { PrimaryButton } from "@/src/components/primary-button";
import { Segmented } from "@/src/components/fields";
import { useDisplayClock } from "@/src/chrono/use-display-clock";
import { formatMMSScc } from "@/src/chrono/format";
import { getPreferences } from "@/src/store/preferences";
import * as Haptics from "@/src/haptics";
import { playSound } from "@/src/audio/sounds";
import {
  currentStep, stepElapsed, lapSplits, lapExtremes,
  toggleFree, recordLap, nextStep, resetTime, restartSession,
  type FreeTimerDisplay,
} from "@/src/domain/free-timer";
import { replaceFreeTimer, setFreeTimer, tickFreeTimer, useStore } from "@/src/store/session-store";
import { fontFamily, makeStyles, useTheme } from "@/src/theme";

export default function FreeTimerRun() {
  const router = useRouter();
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const ft = useStore(s => s.freeTimer);
  const [display, setDisplay] = useState<FreeTimerDisplay>(ft?.config.display ?? "numeric");
  const running = !!ft?.running;
  const clock = useDisplayClock(running);
  const prevStep = useRef(0);
  const prevFinished = useRef(false);

  // Tick logique (transitions de step / fin) — écrit seulement sur changement.
  useEffect(() => {
    if (!running) return;
    const id = setInterval(tickFreeTimer, 250);
    return () => clearInterval(id);
  }, [running]);

  // Signaux sonores/haptiques aux transitions et à la fin.
  useEffect(() => {
    if (!ft) return;
    const prefs = getPreferences();
    const signal = ft.config.kind !== "stopwatch" && (ft.config as { endSignal?: boolean }).endSignal;
    if (ft.stepIndex !== prevStep.current) {
      prevStep.current = ft.stepIndex;
      if (signal) { if (prefs.sounds) void playSound("gong"); void Haptics.selectionAsync().catch(() => {}); }
    }
    if (ft.finished && !prevFinished.current) {
      prevFinished.current = true;
      if (signal) { if (prefs.sounds) void playSound("final"); void Haptics.selectionAsync().catch(() => {}); }
    }
    if (!ft.finished) prevFinished.current = false;
  }, [ft]);

  useEffect(() => { if (!ft) router.replace("/chrono-libre"); }, [ft, router]);
  if (!ft) return null;

  const step = currentStep(ft);
  const el = stepElapsed(ft, running ? clock : ft.stepStartedAt + ft.stepAccumulatedMs);
  const isStopwatch = ft.config.kind === "stopwatch";
  const dur = step?.durationMs ?? null;
  const displayMs = isStopwatch || dur == null ? el : Math.max(0, dur - el);
  const progress = dur ? Math.min(1, el / dur) : 0;
  const time = formatMMSScc(displayMs);
  const splits = lapSplits(ft.laps);
  const { fastest, slowest } = lapExtremes(ft.laps);

  const caption = ft.finished ? "Terminé" : isStopwatch ? "Chronomètre" : ft.config.kind === "countdown" ? "Temps restant" : (step?.label ?? "");
  const status = ft.config.kind === "interval" && step ? `Rép ${step.rep}/${step.totalReps} · Série ${step.set}/${step.totalSets}` : running ? "En cours" : ft.stepAccumulatedMs > 0 || ft.laps.length ? "En pause" : "Prêt";
  const stepColor = step?.type === "work" ? colors.brandPrimary : step?.type === "rest" ? colors.warning : colors.onSurface;

  const toggle = () => setFreeTimer(toggleFree(ft, Date.now()));
  const onLap = () => setFreeTimer(recordLap(ft, Date.now()));
  const onNext = () => setFreeTimer(nextStep(ft, Date.now()));
  const onReset = () => { void replaceFreeTimer(resetTime(ft, Date.now()), ft); };
  const onRestart = () => Alert.alert("Recommencer la séance ?", "Le temps, les tours et les scores seront remis à zéro.", [
    { text: "Annuler", style: "cancel" },
    { text: "Recommencer", style: "destructive", onPress: () => { void replaceFreeTimer(restartSession(ft), ft); } },
  ]);
  const onEnd = () => Alert.alert("Terminer le chrono ?", "La séance en cours sera fermée.", [
    { text: "Annuler", style: "cancel" },
    { text: "Terminer", style: "destructive", onPress: async () => { if (await replaceFreeTimer(null, ft)) router.replace("/chrono-libre"); } },
  ]);
  const score = (side: 0 | 1, delta: 1 | -1) => {
    const next: [number, number] = [...ft.score] as [number, number];
    next[side] = Math.max(0, next[side] + delta);
    setFreeTimer({ ...ft, score: next });
  };

  const toggleLabel = ft.finished ? "Terminé" : running ? "Pause" : ft.stepAccumulatedMs > 0 || ft.laps.length ? "Reprendre" : "Démarrer";

  return (
    <View testID="free-run-screen" style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable testID="free-run-back" onPress={() => router.replace("/chrono-libre")} hitSlop={12} accessibilityRole="button" accessibilityLabel="Retour">
          <MaterialCommunityIcons name="chevron-left" size={30} color={colors.onSurface} />
        </Pressable>
        <Text style={styles.headerTitle}>{isStopwatch ? "Chronomètre" : ft.config.kind === "countdown" ? "Compte à rebours" : "Intervalles"}</Text>
        <View style={{ width: 30 }} />
      </View>

      <FreeStorageNotice />
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <Text style={[styles.caption, { color: stepColor }]}>{caption.toUpperCase()}</Text>

        {display === "numeric" ? (
          <View style={styles.numericWrap}>
            <ChronoTime testID="free-time" time={time} numberOfLines={1} adjustsFontSizeToFit style={styles.bigTime} ccStyle={styles.bigCc} />
            {!isStopwatch ? <View style={styles.track}><View style={[styles.fill, { width: `${progress * 100}%` }]} /></View> : null}
          </View>
        ) : display === "circular" ? (
          <View style={{ alignItems: "center" }}><ChronoRing time={time} caption="" status={status} progress={isStopwatch ? (el / 60000) % 1 : 1 - progress} size={230} /></View>
        ) : (
          <AnalogChrono totalMs={isStopwatch ? el : displayMs} time={time} size={230} />
        )}

        <Text testID="free-status" style={styles.status}>{status}</Text>

        <Segmented testID="free-display" value={display} onChange={setDisplay} options={[{ value: "numeric", label: "Numérique" }, { value: "circular", label: "Cercle" }, { value: "analog", label: "Aiguilles" }]} />

        {ft.config.withTeams ? (
          <View style={styles.teamsRow}>
            {([0, 1] as const).map(i => (
              <View key={i} style={styles.teamCol}>
                <Text style={styles.teamName}>Équipe {i === 0 ? "A" : "B"}</Text>
                <Text style={styles.teamScore}>{ft.score[i]}</Text>
                <View style={styles.teamBtns}>
                  <Pressable testID={`free-score-minus-${i}`} onPress={() => score(i, -1)} accessibilityRole="button" accessibilityLabel={`Retirer un but équipe ${i + 1}`} style={styles.scoreBtn}><Text style={styles.scoreBtnText}>−</Text></Pressable>
                  <Pressable testID={`free-score-plus-${i}`} onPress={() => score(i, 1)} accessibilityRole="button" accessibilityLabel={`Ajouter un but équipe ${i + 1}`} style={[styles.scoreBtn, styles.scoreBtnPlus]}><Text style={[styles.scoreBtnText, { color: colors.onBrandPrimary }]}>+1</Text></Pressable>
                </View>
              </View>
            ))}
          </View>
        ) : null}

        <View style={styles.controls}>
          <PrimaryButton testID="free-toggle" label={toggleLabel} disabled={ft.finished} onPress={toggle}
            leadingIcon={<MaterialCommunityIcons name={running ? "pause" : "play"} size={20} color={colors.onBrandPrimary} />} />
          {isStopwatch ? (
            <PrimaryButton testID="free-lap" label="Tour" variant="secondary" disabled={!running} onPress={onLap}
              leadingIcon={<MaterialCommunityIcons name="flag-outline" size={18} color={colors.onSurface} />} />
          ) : ft.config.kind === "interval" && !ft.config.autoChain ? (
            <PrimaryButton testID="free-next" label="Suivant" variant="secondary" disabled={ft.finished} onPress={onNext}
              leadingIcon={<MaterialCommunityIcons name="skip-next-outline" size={18} color={colors.onSurface} />} />
          ) : null}
        </View>

        <View style={styles.secondaryRow}>
          <Pressable testID="free-reset" onPress={onReset} accessibilityRole="button" accessibilityLabel="Réinitialiser le chrono" style={styles.secondaryBtn}>
            <MaterialCommunityIcons name="refresh" size={18} color={colors.onSurface} /><Text style={styles.secondaryText}>Réinitialiser</Text>
          </Pressable>
          <Pressable testID="free-restart" onPress={onRestart} accessibilityRole="button" accessibilityLabel="Recommencer la séance" style={styles.secondaryBtn}>
            <MaterialCommunityIcons name="backup-restore" size={18} color={colors.onSurface} /><Text style={styles.secondaryText}>Recommencer</Text>
          </Pressable>
        </View>

        {isStopwatch && ft.laps.length ? (
          <View style={styles.laps} testID="free-laps">
            <Text style={styles.lapsTitle}>Tours</Text>
            {splits.map((split, i) => (
              <View key={i} style={styles.lapRow}>
                <Text style={styles.lapIndex}>Tour {i + 1}</Text>
                <Text style={[styles.lapSplit, i === fastest && { color: colors.brandPrimary }, i === slowest && { color: colors.warning }]}>{formatMMSScc(split)}{i === fastest ? "  ▲" : i === slowest ? "  ▼" : ""}</Text>
                <Text style={styles.lapTotal}>{formatMMSScc(ft.laps[i])}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <PrimaryButton testID="free-end" label="Fin" variant="ghost" onPress={onEnd}
          leadingIcon={<MaterialCommunityIcons name="stop" size={18} color={colors.onSurface} />} />
      </View>
    </View>
  );
}

const useStyles = makeStyles(c => ({
  root: { flex: 1, backgroundColor: c.surface },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, minHeight: 48 },
  headerTitle: { fontFamily: fontFamily.textBold, fontSize: 16, color: c.onSurface },
  body: { paddingHorizontal: 18, paddingTop: 10, paddingBottom: 20, gap: 16, alignItems: "stretch" },
  caption: { fontFamily: fontFamily.textBold, fontSize: 11, letterSpacing: 1.5, textAlign: "center" },
  numericWrap: { gap: 10 },
  bigTime: { fontFamily: fontFamily.textBold, fontSize: 68, lineHeight: 92, color: c.onSurface, textAlign: "center", fontVariant: ["tabular-nums"] },
  bigCc: { fontFamily: fontFamily.textBold, fontSize: 32, color: c.onSurfaceTertiary, fontVariant: ["tabular-nums"] },
  track: { height: 6, borderRadius: 3, backgroundColor: c.border, overflow: "hidden", marginHorizontal: 20 },
  fill: { height: 6, backgroundColor: c.brandPrimary, borderRadius: 3 },
  status: { fontFamily: fontFamily.text, fontSize: 13, color: c.muted, textAlign: "center" },
  teamsRow: { flexDirection: "row", gap: 12 },
  teamCol: { flex: 1, alignItems: "center", gap: 6, padding: 12, borderRadius: 16, borderWidth: 1, borderColor: c.border, backgroundColor: c.surfaceSecondary },
  teamName: { fontFamily: fontFamily.textBold, fontSize: 12, color: c.onSurface },
  teamScore: { fontFamily: fontFamily.textBold, fontSize: 30, color: c.onSurface, fontVariant: ["tabular-nums"] },
  teamBtns: { flexDirection: "row", gap: 8 },
  scoreBtn: { minWidth: 44, minHeight: 40, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: c.surface, borderWidth: 1, borderColor: c.border },
  scoreBtnPlus: { backgroundColor: c.brandPrimary, borderColor: c.brandPrimary },
  scoreBtnText: { fontFamily: fontFamily.textBold, fontSize: 16, color: c.onSurface },
  controls: { gap: 10 },
  secondaryRow: { flexDirection: "row", gap: 10 },
  secondaryBtn: { flex: 1, minHeight: 48, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 14, borderWidth: 1, borderColor: c.border, backgroundColor: c.surfaceSecondary },
  secondaryText: { fontFamily: fontFamily.textBold, fontSize: 13, color: c.onSurface },
  laps: { gap: 8, padding: 14, borderRadius: 16, borderWidth: 1, borderColor: c.border, backgroundColor: c.surfaceSecondary },
  lapsTitle: { fontFamily: fontFamily.textBold, fontSize: 12, letterSpacing: 1, color: c.muted },
  lapRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  lapIndex: { fontFamily: fontFamily.text, fontSize: 13, color: c.muted, flex: 1 },
  lapSplit: { fontFamily: fontFamily.textBold, fontSize: 14, color: c.onSurface, fontVariant: ["tabular-nums"], flex: 1, textAlign: "center" },
  lapTotal: { fontFamily: fontFamily.text, fontSize: 13, color: c.onSurfaceTertiary, fontVariant: ["tabular-nums"], flex: 1, textAlign: "right" },
  footer: { paddingHorizontal: 18, paddingTop: 8, borderTopWidth: 1, borderColor: c.border, backgroundColor: c.surface },
}));

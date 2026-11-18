import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import {
  BackHandler,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { useFocusEffect, useNavigation, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSubviewBack } from "@/src/hooks/use-subview-back";
import { setPreferences, usePreferences } from "@/src/store/preferences";
import { Alert } from "@/src/alert";
import { elapsedMs } from "@/src/chrono/engine";
import { useDisplayClock } from "@/src/chrono/use-display-clock";
import * as S from "@/src/domain/session";
import type { Session, Team } from "@/src/domain/types";
import { computeStandings } from "@/src/domain/standings";
import {
  archiveSession,
  dispatchSession,
  discardSession,
  restoreSession,
  getStoreState,
  retryStorage,
  startSession,
  useStore,
} from "@/src/store/session-store";
import { offerAbandonUndo } from "@/src/store/abandon-undo";
import { useAlertPermissionGate } from "@/src/components/lovable/alert-permission";
import {
  brand,
  lovable as c,
  lovableFont as f,
  withAlpha,
} from "@/src/visual/lovable";
import { LovableBackground } from "@/src/components/lovable/background";
import { PitchPhoto } from "@/src/components/lovable/pitch-photo";
import { sessionShareText } from "./share-summary";
import { shareText } from "./share";
import { LovableIcon } from "@/src/components/lovable/icon";
import { configStyles } from "@/src/components/lovable/configuration";
import { PhaseFrame } from "@/src/components/lovable/phase2b-ui";
import { GiantChrono } from "@/src/components/giant-chrono";
import { MatchAnnouncer } from "@/src/components/lovable/match-announcer";
import { KeepAwakeControl } from "@/src/components/lovable/keep-awake-control";
import { MatchBarButton, useMatchBarMetrics } from "@/src/components/lovable/match-bar";
import { LiveNoticeBanner } from "@/src/components/live-notice-banner";
import {
  MatchAction,
  MatchCarousel,
  MatchIcon,
  MatchScoreboard,
  MatchSheet,
  m,
  pressedControl,
} from "@/src/components/lovable/match-ui";
import {
  CLOCK_FILL_MAX_FONT_SCALE,
  MATCH_CAROUSEL_CHROME,
  matchClockLayout,
} from "./chrono-layout";
import {
  beginMatch,
  maracanaUpcoming,
  matchProjection,
  nextTeamId,
  periodName,
  rotationCards,
} from "./match-presentation";
import { referenceTeamPalette } from "./lovable-config-state";
import { confirmMatchRestart } from "./match-confirmations";

const fmt = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  return (
    String(Math.floor(s / 60)).padStart(2, "0") +
    ":" +
    String(s % 60).padStart(2, "0")
  );
};
export type TournamentMatchUI = {
  title: string; subtitle: string; rankingLabel: string; onRanking: () => void;
  info: ReactNode; onCorrect?: () => void;
  onDiscard?: () => void;
  overlay: (controls: { locked: boolean; onUnlock: () => void }) => ReactNode;
};
export function LovableMatchScreen({ tournament }: { tournament?: TournamentMatchUI } = {}) {
  const session = useStore((s) => s.session),
    saveError = useStore((s) => s.saveError),
    storeNow = useStore((s) => s.now);
  const router = useRouter(),
    navigation = useNavigation(),
    inset = useSafeAreaInsets();
  const { width, height, fontScale } = useWindowDimensions(),
    landscape = width > height,
    two =
      landscape && width - inset.left - inset.right >= 600 && fontScale <= 1.5;
  const [locked, setLocked] = useState(false),
    [giant, setGiant] = useState(false),
    [showElapsed, setShowElapsed] = useState(false),
    [ranking, setRanking] = useState(false),
    [correcting, setCorrecting] = useState(false),
    [adding, setAdding] = useState(false),
    [teamName, setTeamName] = useState("");
  const preferences = usePreferences();
  const keepAwake = preferences.keepAwake;
  const [undoRestart, setUndoRestart] = useState<{ before: Session; after: Session; until: number; label: string } | null>(null);
  useEffect(() => {
    if (!undoRestart) return;
    const timer = setTimeout(() => setUndoRestart(null), Math.max(0, undoRestart.until - Date.now()));
    return () => clearTimeout(timer);
  }, [undoRestart]);
  const [stopping, setStopping] = useState(false);
  const [options, setOptions] = useState(false);
  const bar = useMatchBarMetrics(landscape);
  const alertGate = useAlertPermissionGate();
  const leaving = useRef(false);
  const [selectedPage, setSelectedPage] = useState(0);
  // Portrait only: the clock card takes the height the screen leaves unused.
  const [clockFill, setClockFill] = useState<number | undefined>(undefined);
  const fillClock = !two && !landscape && fontScale <= CLOCK_FILL_MAX_FONT_SCALE;
  const clockBase =
    matchClockLayout({ landscape, screenHeight: height }).baseSlide + MATCH_CAROUSEL_CHROME;
  const l = session?.live,
    running = !!l && l.chrono.runningSince !== null && l.stage !== "finished",
    now = useDisplayClock(running);
  useSubviewBack(!!tournament && !locked && !giant, () => tournament?.onRanking());
  const matchKey = session?.id + ":" + l?.matchId + (tournament ? ":" + (l?.tiebreakStep === "choice" ? "period" : l?.stage === "extra" || l?.stage === "golden" ? l.stage : "period") : "");
  const [displayMatch, setDisplayMatch] = useState(matchKey);
  useEffect(() => {
    navigation.setOptions({ gestureEnabled: !locked });
    return () => navigation.setOptions({ gestureEnabled: true });
  }, [navigation, locked]);
  useFocusEffect(useCallback(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (giant) {
        setGiant(false);
        return true;
      }
      if (locked) return true;
      const current = getStoreState().session;
      if (current?.mode === "classique" && current.live?.stage === "finished") {
        archiveSession(S.endSession(current, Date.now()));
        if (!getStoreState().session) {
          leaving.current = true;
          router.dismissTo("/");
        }
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [locked, giant, router]));
  useEffect(() => {
    if (!session && !leaving.current) router.dismissTo("/");
  }, [session, router]);
  if (displayMatch !== matchKey) {
    setDisplayMatch(matchKey);
    setShowElapsed(false);
    setSelectedPage(0);
  }
  if (!session || !l) return <View style={m.root} />;
  const projection = matchProjection(session, now, showElapsed),
    teams = S.liveTeams(session),
    finished = l.stage === "finished",
    between = l.stage === "break" || l.stage === "awaitPeriod";
  const canScore = l.scoreOn && !finished && !between && l.stage !== "ready" && l.stage !== "shootout" && !l.tiebreakStep;
  const upcoming = maracanaUpcoming(session);
  const undoNotice = undoRestart && session === undoRestart.after ? undoRestart : null;
  const home = () => {
    if (!locked) router.dismissTo("/");
  };
  const archiveAndHome = (summary = false) => {
    archiveSession(S.endSession(session, Date.now()));
    if (!getStoreState().session) {
      leaving.current = true;
      if (summary) router.replace("/summary");
      else router.dismissTo("/");
    }
  };
  const replay = () => {
    const go = () => {
      archiveSession(S.endSession(session, Date.now()));
      if (getStoreState().session) return;
      if (
        startSession(S.createSession(session.config, session.teams, Date.now()))
      )
        router.replace("/live");
    };
    Alert.alert(
      "Rejouer ce match ?",
      "Le résultat actuel est conservé et un nouveau match est préparé.",
      [
        { text: "Annuler", style: "cancel" },
        { text: "Rejouer", onPress: go },
      ],
    );
  };
  const correct = () => {
    if (locked || !l.scoreOn) return;
    if (session.pendingLaunch && !session.pendingLaunch.cancelled)
      dispatchSession(S.pauseNextLaunch);
    if (tournament?.onCorrect) { tournament.onCorrect(); return; }
    setCorrecting(true);
  };
  const changeScore = (side: 0 | 1, delta: 1 | -1) => {
    if (!locked)
      dispatchSession((s, t) =>
        s.live?.stage === "finished"
          ? S.correctLast(s, side, delta, t)
          : S.goal(s, side, delta, t),
      );
  };
  const finish = () => {
    if (locked) return;
    Alert.alert("Terminer le match ?", undefined, [
      { text: "Annuler", style: "cancel" },
      {
        text: "Terminer",
        style: "destructive",
        onPress: () => dispatchSession(S.endManual),
      },
    ]);
  };
  const hasResults = session.mode !== "classique" && session.matches.some(match => match.status === "finished");
  const discard = () => {
    const abandoned = getStoreState().session;
    if (abandoned?.id !== session.id) return;
    discardSession();
    if (!getStoreState().session) {
      offerAbandonUndo("Session abandonnée · Annuler", () => restoreSession(abandoned));
      tournament?.onDiscard?.();
      leaving.current = true;
      router.dismissTo("/");
    }
  };
  // In a tournament extra time or golden goal, only the time restarts: the score is kept.
  const keepsScore = !!tournament && (l.stage === "extra" || l.stage === "golden");
  const restart = () => {
    if (locked) return;
    confirmMatchRestart(() => {
      setShowElapsed(false);
      const before = getStoreState().session;
      dispatchSession(S.restartCurrent);
      const after = getStoreState().session;
      if (before && after && before !== after) setUndoRestart({ before, after, until: Date.now() + 5000, label: keepsScore ? "Temps remis à zéro · Annuler" : "Match remis à zéro · Annuler" });
    }, keepsScore);
  };
  if (session.mode === "classique" && finished)
    return (
      <ClassicMatchResult
        session={session}
        error={saveError}
        onHome={() => archiveAndHome()}
        onReplay={replay}
        onCorrect={correct}
        correcting={correcting}
        onCloseCorrection={() => setCorrecting(false)}
        onGoal={changeScore}
      />
    );
  const title = tournament?.title ?? (session.mode === "classique" ? "MATCH CLASSIQUE" : "MARACANA"),
    match = S.currentMatch(session);
  const subtitle = tournament ? [tournament.subtitle, projection.status].join(" · ") : [
    session.mode === "maracana" ? match?.label : null,
    l.periodMs.length > 1 && !finished ? projection.periodLabel : null,
    projection.status,
  ]
    .filter(Boolean)
    .join(" · ");
  const nextPage = (
    <View style={{ flex: 1, padding: landscape ? 10 : 14 }}>
      <View
        style={{
          backgroundColor: c.secondary,
          borderWidth: 1,
          borderColor: c.border,
          borderRadius: 16,
          paddingVertical: landscape ? 8 : 12,
          paddingHorizontal: 14,
          gap: 6,
        }}
      >
        <Text style={[m.eyebrow, { textAlign: "left" }]}>PROCHAIN MATCH</Text>
        {upcoming ? (
          <>
            <Matchup
              a={upcoming.a}
              b={upcoming.b}
              aLabel={upcoming.aLabel}
              bLabel={upcoming.bLabel}
            />
            <Text
              style={{
                fontFamily: f.extrabold,
                fontSize: 11,
                lineHeight: 16.5,
                color: c.primary,
                backgroundColor: withAlpha(c.primary, 0.14),
                borderRadius: 99,
                paddingHorizontal: 9,
                paddingVertical: 3,
                alignSelf: "flex-start",
              }}
            >
              {l.stage === "period" && l.end.byTime
                ? "Dans " +
                  Math.max(
                    1,
                    Math.ceil(
                      ((l.periodMs[l.periodIndex] ?? 0) -
                        elapsedMs(l.chrono, now)) /
                        60000,
                    ),
                  ) +
                  " min"
                : l.stage === "extra"
                  ? "Après la prolongation"
                  : "Après ce match"}
            </Text>
            {upcoming.following ? (
              <Text
                style={[
                  m.muted,
                  { fontSize: 12, lineHeight: 18, marginTop: 4 },
                ]}
              >
                Puis : {upcoming.following[0]?.name} vs{" "}
                {upcoming.following[1]?.name}
              </Text>
            ) : null}
          </>
        ) : null}
      </View>
    </View>
  );
  const rankingLink =
    session.mode === "maracana" || tournament ? (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={tournament?.rankingLabel ?? "Voir le classement"}
        disabled={locked}
        onPress={() => tournament ? tournament.onRanking() : setRanking(true)}
        style={({ pressed }) => [{
          height: landscape ? 44 : 52,
          borderWidth: 1,
          borderColor: c.border,
          borderRadius: 16,
          backgroundColor: c.card,
          paddingHorizontal: 16,
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
        }, pressed && pressedControl]}
      >
        <LovableIcon name="trophy" size={18} color={c.primary} />
        <Text
          style={{
            fontFamily: "ManropeRefined-Bold",
            fontSize: 14,
            lineHeight: 20,
            color: c.foreground,
            flex: 1,
          }}
        >
          {tournament?.rankingLabel ?? "Voir le classement"}
        </Text>
        <LovableIcon name="chevron" size={18} color={c.foreground} />
      </Pressable>
    ) : null;
  const scoreboard = (
    <MatchScoreboard
      teams={teams}
      score={l.score}
      scoreOn={l.scoreOn}
      canScore={canScore}
      locked={locked}
      onGoal={changeScore}
      onCorrect={correct}
      goalTarget={l.end.goalTarget}
      gridSecondRow={two ? (session.mode === "maracana" || tournament ? 44 : 40) : undefined}
    />
  );
  const carousel = (
    <View style={{ position: "relative", width: "100%" }}>
      <MatchCarousel
        key={l.matchId}
        session={session}
        projection={projection}
        locked={locked}
        next={tournament?.info ?? nextPage}
        selected={selectedPage}
        onSelect={setSelectedPage}
        onToggle={() => setShowElapsed((v) => !v)}
        onGiant={() => setGiant(true)}
        fill={fillClock ? clockFill : undefined}
      />
      <View pointerEvents="box-none" testID="match-notice-host" style={{ position: "absolute", top: 8, left: 10, right: 10, zIndex: 2 }}>
        {/* The restart undo is a one-off notice too, so the bar keeps one row. */}
        {undoNotice ? (
          <LiveNoticeBanner
            variant="lovable"
            notice={{ message: undoNotice.label, until: undoNotice.until, tone: "warmup" }}
            action={{
              label: "Annuler la remise à zéro",
              onPress: () => {
                if (Date.now() <= undoNotice.until) dispatchSession(current => current === undoNotice.after ? undoNotice.before : current, { silent: true });
                setUndoRestart(null);
              },
            }}
          />
        ) : (
          <MatchAnnouncer session={session} now={Math.max(now, storeNow)} />
        )}
      </View>
    </View>
  );
  const begin = () => {
    if (!locked) alertGate.gate(() => dispatchSession(beginMatch));
  };
  const primary = l.stage === "ready" || between || l.tiebreakStep === "ready";
  // Before the first kick-off of this match the bar only offers Démarrer.
  const beforeKickoff = l.stage === "ready";
  const blockedStage = finished || l.stage === "shootout" || l.tiebreakStep === "choice";
  const startLabel = between
    ? "Démarrer la " + periodName(l.periodMs.length, l.stage === "break" ? l.periodIndex + 1 : l.periodIndex).toLowerCase()
    : "Démarrer";
  // The match settings stay editable until a match of the session has been played.
  const editable = (session.mode === "classique" || session.mode === "maracana") && l.stage === "ready" && !session.matches.some(match => match.status === "finished");
  return (
    <View testID="match-screen" style={m.root}>
      <LovableBackground />
      <View
        testID="match-header"
        style={[
          m.header,
          {
            paddingTop: inset.top + (landscape ? 10 : 18),
            paddingBottom: landscape ? 4 : 6,
            paddingLeft: 20 + inset.left,
            paddingRight: 20 + inset.right,
          },
        ]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Retour à l’accueil"
          disabled={locked}
          onPress={home}
          style={({ pressed }) => [m.headerButton, pressed && pressedControl]}
        >
          <LovableIcon name="back" size={20} color={c.foreground} />
        </Pressable>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[m.title, !landscape && width <= 360 && {fontSize: 17, lineHeight: 25.5, letterSpacing: 0.3}]} accessibilityRole="header" numberOfLines={1}>
            {title}
          </Text>
          <Text style={[m.subtitle,tournament?{color:session.mode==="cup"?c.cup:c.survie}:null,!landscape && width <= 360 && {fontSize: 11, lineHeight: 15}]} numberOfLines={!landscape && width <= 360 ? 2 : 1}>
            {subtitle}
          </Text>
        </View>
        {/* Options only: locking has its own padlock in the match bar. */}
        <Pressable
          testID="match-options"
          accessibilityRole="button"
          accessibilityLabel="Options du match"
          accessibilityHint={editable ? "Réglages du match, paramètres de l’app ou arrêt de la session" : "Paramètres de l’app ou arrêt de la session"}
          accessibilityState={{ disabled: locked }}
          disabled={locked}
          onPress={() => setOptions(true)}
          style={({ pressed }) => [m.headerButton, locked && { opacity: 0.45 }, pressed && pressedControl]}
        >
          <LovableIcon name="gear" size={20} color={c.foreground} />
        </Pressable>
      </View>
      <ScrollView
        testID="match-body"
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: landscape ? 4 : 8,
          paddingBottom: 4,
          paddingLeft: 20 + inset.left,
          paddingRight: 20 + inset.right,
          gap: landscape ? 10 : 14,
        }}
      >
        {l.stage === "ready" && preferences.theme === "dark" && new Date(now).getHours() >= 8 && new Date(now).getHours() < 19 ? <MatchAction label="En extérieur ? Choisir le thème clair" kind="text" onPress={() => { void setPreferences({ theme: "light" }); }} /> : null}
        {!keepAwake ? <Text style={m.hint}>Veille autorisée. Écran verrouillé, la fin est signalée par une notification si tu l’as autorisée.</Text> : null}
        {saveError ? (
          <View>
            <Text accessibilityRole="alert" style={m.error}>
              {saveError}
            </Text>
            <MatchAction
              label="Réessayer la sauvegarde"
              kind="text"
              onPress={() => {
                void retryStorage();
              }}
            />
          </View>
        ) : null}
        {two ? (
          <View
            style={{ flexDirection: "row", gap: 10, alignItems: "flex-start" }}
          >
            {/* Landscape: clock on the left, scores on the right, commands below. */}
            <View style={{ flex: 1, minWidth: 0 }}>{carousel}</View>
            <View style={{ flex: 1, minWidth: 0, gap: 10 }}>
              {scoreboard}
              {rankingLink}
            </View>
          </View>
        ) : (
          <>
            {/* Portrait: the clock comes first, above the score. */}
            {fillClock ? (
              <View
                testID="match-clock-fill"
                onLayout={(e) => setClockFill(e.nativeEvent.layout.height)}
                style={{ flexGrow: 1, flexBasis: clockBase, minHeight: clockBase, justifyContent: "center" }}
              >
                {carousel}
              </View>
            ) : (
              carousel
            )}
            {scoreboard}
            {rankingLink}
          </>
        )}
      </ScrollView>
      <View
        testID="match-dock"
        style={{
          paddingTop: landscape ? 8 : 12,
          paddingBottom: Math.max(inset.bottom, landscape ? 10 : 16),
          paddingLeft: 20 + inset.left,
          paddingRight: 20 + inset.right,
          alignItems: "center",
        }}
      >
        {beforeKickoff && !locked ? (
          // Before the first kick-off: one full-width command.
          <View style={{ width: "100%", maxWidth: landscape ? 420 : undefined }}>
            <MatchAction testID="match-start" label="Démarrer" icon="play" height={bar.height} onPress={begin} />
          </View>
        ) : (
          // In play, paused or between periods: one row, always in this order.
          <View
            testID="match-bar"
            style={{
              width: "100%",
              maxWidth: landscape ? 640 : undefined,
              flexDirection: "row",
              gap: bar.gap,
            }}
          >
            <MatchBarButton
              testID="match-lock"
              landscape={landscape}
              icon={locked ? "lock" : "unlock"}
              tone={locked ? "active" : "neutral"}
              accessibilityRole="switch"
              checked={locked}
              accessibilityLabel={locked ? "Déverrouiller les commandes" : "Verrouiller les commandes"}
              accessibilityHint={locked ? "Commandes et score bloqués, le chrono continue. Touche pour déverrouiller." : "Bloque les commandes et le score ; le chrono continue."}
              onPress={() => setLocked(value => !value)}
            />
            <KeepAwakeControl compact landscape={landscape} height={bar.height} disabled={locked} />
            <MatchBarButton
              testID="match-end"
              landscape={landscape}
              icon="stop"
              label="Fin"
              tone="danger"
              accessibilityLabel="Terminer le match"
              disabled={locked || blockedStage}
              onPress={finish}
            />
            <MatchBarButton
              testID="match-restart"
              landscape={landscape}
              icon="restart"
              label="Relancer"
              accessibilityLabel={keepsScore ? "Relancer le temps de cette phase" : "Relancer le match"}
              disabled={locked || blockedStage}
              onPress={restart}
            />
            <MatchBarButton
              testID="match-pause"
              landscape={landscape}
              icon={projection.running ? "pause" : "play"}
              label={projection.running ? "Pause" : primary ? "Démarrer" : "Reprendre"}
              accessibilityLabel={projection.running ? "Pause" : primary ? startLabel : "Reprendre"}
              tone="primary"
              disabled={locked || blockedStage}
              onPress={primary ? begin : () => dispatchSession(projection.running ? S.pause : S.resume)}
            />
          </View>
        )}
      </View>
      {alertGate.sheet}
      {options && !locked ? (
        <MatchSheet label="Options du match" onClose={() => setOptions(false)} dismissOnBackdrop>
          <Text accessibilityRole="header" style={m.title}>Options du match</Text>
          {editable ? (
            <MatchAction testID="match-options-config" label="Modifier les réglages du match" icon="pencil" kind="secondary" onPress={() => { setOptions(false); router.push({ pathname: "/config/[mode]", params: { mode: session.mode, edit: session.id } }); }} />
          ) : null}
          <MatchAction testID="match-options-settings" label="Paramètres de l’app" kind="secondary" onPress={() => { setOptions(false); router.push({ pathname: "/settings", params: { from: "match" } }); }} />
          <MatchAction testID="match-options-stop" label="Arrêter la session" icon="stop" kind="text" danger onPress={() => { setOptions(false); setStopping(true); }} />
          <MatchAction label="Fermer" kind="text" onPress={() => setOptions(false)} />
        </MatchSheet>
      ) : null}
      {stopping ? (
        <MatchSheet label="Arrêter la session ?" onClose={() => setStopping(false)}>
          <Text accessibilityRole="header" style={m.title}>Arrêter la session ?</Text>
          <Text style={m.hint}>Le match en cours ne sera pas compté.</Text>
          {hasResults ? <MatchAction label="Garder les résultats joués" onPress={() => archiveAndHome(true)} /> : null}
          <MatchAction label={hasResults ? "Tout supprimer" : "Abandonner"} kind="secondary" onPress={discard} />
          <MatchAction label="Annuler" kind="text" onPress={() => setStopping(false)} />
        </MatchSheet>
      ) : null}
      {tournament ? tournament.overlay({locked,onUnlock:()=>setLocked(false)}) : null}
      {session.mode === "maracana" && finished && !ranking && !correcting && !adding ? (
        <MatchSheet label="Fin du match" onClose={home}>
          {locked ? (
            <MatchAction
              label="Déverrouiller les commandes"
              icon="unlock"
              kind="secondary"
              onPress={() => setLocked(false)}
            />
          ) : null}
          <View testID="rotation-result" style={{ borderRadius: 18, borderWidth: 1, borderColor: c.border, backgroundColor: c.secondary, padding: 18, gap: 8, alignItems: "center" }}>
          <Text style={m.eyebrow}>RÉSULTAT DU MATCH {match?.order}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel={`Score ${l.score[0]} à ${l.score[1]} ; corriger le score`} disabled={locked} onPress={correct} style={{ minHeight: 60, paddingHorizontal: 16 }}>
            <Text testID="match-score-result" style={[m.big, { fontSize: 52, lineHeight: 64 }]}>{l.score.join(" – ")}</Text>
          </Pressable>
          <Text style={m.resultLine}>
            {l.score[0] === l.score[1]
              ? "Match nul"
              : "Victoire : " + teams[l.score[0] > l.score[1] ? 0 : 1]?.name}
            {match?.finishReason === "extension"
              ? " · but décisif en prolongation"
              : match?.finishReason === "goalTarget"
                ? " · premier à " + l.end.goalTarget
                : ""}
          </Text>
          <Text style={[m.muted, { textAlign: "center" }]}>{teams[0]?.name} · {teams[1]?.name}</Text>
          </View>
          {l.scoreOn ? <MatchAction testID="maracana-correct-score" label="Corriger le score" icon="pencil" kind="secondary" disabled={locked} onPress={correct} /> : null}
          <Rotation session={session} />
          <NextLaunch session={session} locked={locked} />
          <View style={{ gap: 8 }}>
            {!session.pendingLaunch || session.pendingLaunch.cancelled ? (
              <MatchAction
                label="Lancer le prochain match"
                icon="play"
                height={56}
                disabled={locked}
                onPress={() => {
                  setShowElapsed(false);
                  dispatchSession(S.launchNext);
                }}
              />
            ) : null}
            {!session.pendingLaunch || session.pendingLaunch.cancelled ? (
              <Text style={[m.muted, { textAlign: "center", fontSize: 12, lineHeight: 18 }]}>Le match sera prêt. Touche Démarrer au coup d’envoi.</Text>
            ) : null}
            <MatchAction
              label="Voir le classement"
              icon="trophy"
              kind="secondary"
              disabled={locked}
              onPress={() => setRanking(true)}
            />
            {session.teams.length < 8 ? (
              <MatchAction
                label={`Ajouter une équipe (${session.teams.length}/8)`}
                kind="text"
                icon="userPlus"
                disabled={locked}
                onPress={() => {
                  setTeamName("Équipe " + (session.teams.length + 1));
                  if (session.pendingLaunch) dispatchSession(S.pauseNextLaunch);
                  setAdding(true);
                }}
              />
            ) : null}
            <MatchAction
              label="Terminer la session"
              icon="flag"
              kind="text"
              disabled={locked}
              onPress={() =>
                Alert.alert(
                  "Terminer la session ?",
                  "Les résultats joués sont conservés.",
                  [
                    { text: "Annuler", style: "cancel" },
                    { text: "Terminer", onPress: () => archiveAndHome(true) },
                  ],
                )
              }
            />
            <MatchAction
              testID="maracana-home"
              label="Retour à l’accueil"
              icon="home"
              kind="text"
              disabled={locked}
              onPress={home}
            />
          </View>
        </MatchSheet>
      ) : null}
      {ranking ? (
        <Ranking session={session} onClose={() => setRanking(false)} />
      ) : null}
      {correcting ? (
        <Correction
          teams={teams}
          score={l.score}
          onGoal={changeScore}
          onClose={() => setCorrecting(false)}
        />
      ) : null}
      {adding ? (
        <MatchSheet label="Ajouter une équipe" onClose={() => setAdding(false)}>
          <Text
            accessibilityRole="header"
            style={[m.title, { fontSize: 18, lineHeight: 27 }]}
          >
            Ajouter une équipe
          </Text>
          <TextInput
            accessibilityLabel="Nom de la nouvelle équipe"
            value={teamName}
            maxLength={18}
            onChangeText={setTeamName}
            style={configStyles.input}
          />
          <MatchAction
            label="Ajouter"
            disabled={
              !teamName.trim() ||
              session.teams.some(
                (t) =>
                  t.name.trim().toLowerCase() === teamName.trim().toLowerCase(),
              )
            }
            onPress={() => {
              const name = teamName.trim();
              dispatchSession((s, t) =>
                S.addMaracanaTeam(
                  s,
                  {
                    id: nextTeamId(s.teams),
                    name,
                    color:
                      referenceTeamPalette[
                        s.teams.length % referenceTeamPalette.length
                      ],
                  },
                  t,
                ),
              );
              setAdding(false);
            }}
          />
          <MatchAction
            label="Annuler"
            kind="text"
            onPress={() => setAdding(false)}
          />
        </MatchSheet>
      ) : null}
      <GiantChrono
        visible={giant}
        time={projection.time}
        caption={projection.label}
        status={projection.status}
        scoreLine={l.scoreOn ? l.score.join(" – ") : null}
        paused={!projection.running}
        canPause={S.isPlayStage(l.stage) && !locked}
        onTogglePause={() =>
          dispatchSession(projection.running ? S.pause : S.resume)
        }
        onClose={() => setGiant(false)}
      />
    </View>
  );
}
function Matchup({
  a,
  b,
  aLabel,
  bLabel,
}: {
  a: Team | null;
  b: Team | null;
  aLabel: string;
  bLabel: string;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        flexWrap: "wrap",
        alignItems: "baseline",
        gap: 8,
      }}
    >
      <TeamLabel team={a} name={aLabel} />
      <Text style={[m.muted, { fontSize: 12 }]}>vs</Text>
      <TeamLabel team={b} name={bLabel} />
    </View>
  );
}
function TeamLabel({ team, name }: { team: Team | null; name: string }) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        minWidth: 0,
        maxWidth: "100%",
      }}
    >
      {team ? (
        <View
          style={{
            height: 10,
            width: 10,
            borderRadius: 5,
            backgroundColor: team.color,
            marginRight: 6,
          }}
        />
      ) : null}
      <Text
        style={{
          fontFamily: f.extrabold,
          fontSize: 16,
          lineHeight: 24,
          color: c.foreground,
          flexShrink: 1,
        }}
      >
        {name}
      </Text>
    </View>
  );
}
function Rotation({ session }: { session: Session }) {
  const cards = rotationCards(session),
    up = maracanaUpcoming(session);
  const { width, height, fontScale } = useWindowDimensions(),
    cols =
      width > height && fontScale <= 1.5
        ? cards.some((r) => r.kind === "stay")
          ? 3
          : 2
        : 1;
  const [listWidth, setListWidth] = useState(0);
  return (
    <View
      accessibilityLabel="Rotation pour le prochain match"
      testID="rotation-teams"
      style={{ gap: 8 }}
    >
      <View
        onLayout={(e) => setListWidth(e.nativeEvent.layout.width)}
        style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}
      >
        {cards.map(({ team, kind, note }) => (
          <View
            key={team.id}
            testID={`rotation-${kind}-${team.id}`}
            style={{
              width:
                cols === 1
                  ? "100%"
                  : listWidth
                    // LayoutEvent can round the available width up by a fraction.
                    ? (listWidth - 6 * (cols - 1) - 1) / cols
                    : cols === 2
                      ? "49%"
                      : "32%",
              minWidth: 0,
              padding: 10,
              paddingHorizontal: 12,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: c.border,
              backgroundColor: c.card,
              zIndex: cols > 1 && kind === "stay" ? 1 : undefined,
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
            }}
          >
            <View style={{ height: 10, width: 10, borderRadius: 5, backgroundColor: team.color, borderWidth: 1, borderColor: withAlpha(c.foreground, 0.2) }} />
            <View style={{ flex: 1, minWidth: 0, gap: 1 }}>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
              >
                {kind === "stay" ? (
                  <LovableIcon name="check" size={12} color={c.primary} />
                ) : (
                  <MatchIcon
                    name={kind === "out" ? "out" : "in"}
                    size={12}
                    color={kind === "out" ? c.error : c.incoming}
                  />
                )}
                <Text
                  numberOfLines={cols === 1 ? 1 : undefined}
                  style={{
                    fontFamily: f.extrabold,
                    fontSize: 10,
                    lineHeight: 15,
                    letterSpacing: 0.2,
                    color: c.muted,
                    flexShrink: 1,
                  }}
                >
                  {kind === "stay"
                    ? "RESTE SUR LE TERRAIN"
                    : kind === "out"
                      ? "SORT DU TERRAIN"
                      : "ENTRE SUR LE TERRAIN"}
                </Text>
              </View>
              <Text
                numberOfLines={1}
                style={{
                  fontFamily: f.extrabold,
                  fontSize: 15,
                  lineHeight: 22.5,
                  color: c.foreground,
                }}
              >
                {team.name}
              </Text>
              {note ? (
                <Text
                  style={{
                    fontFamily: f.semibold,
                    fontSize: 11,
                    lineHeight: 16.5,
                    color: c.muted,
                  }}
                >
                  {note}
                </Text>
              ) : null}
            </View>
          </View>
        ))}
      </View>
      {up ? (
        <View
          testID="rotation-next"
          style={{
            borderRadius: 14,
            backgroundColor: c.secondary,
            padding: 16,
            gap: 8,
          }}
        >
          <Text style={[m.eyebrow, { textAlign: "left", color: c.primary }]}>PROCHAIN MATCH</Text>
          <Matchup a={up.a} b={up.b} aLabel={up.aLabel} bLabel={up.bLabel} />
        </View>
      ) : null}
    </View>
  );
}
export function NextLaunch({
  session,
  locked,
}: {
  session: Session;
  locked: boolean;
}) {
  const pending = session.pendingLaunch,
    now = useStore((s) => s.now),
    { width, height } = useWindowDimensions();
  if (!pending || pending.cancelled) return null;
  const running = pending.chrono.runningSince !== null,
    left =
      Math.ceil(
        Math.max(
          0,
          pending.chrono.regulationTargetMs - elapsedMs(pending.chrono, now),
        ) / 1000,
      ) * 1000;
  return (
    <View
      testID="match-launch-countdown"
      accessibilityLabel="Démarrage du prochain match"
      style={{
        paddingVertical: width > height ? 6 : 12,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: c.border,
      }}
    >
      <Text style={m.eyebrow}>
        {running ? "PROCHAIN MATCH DANS" : "LANCEMENT EN PAUSE"}
      </Text>
      <Text
        style={[
          m.big,
          {
            fontSize: width > height ? 30 : 40,
            lineHeight: width > height ? 30 : 40,
            color: c.primary,
            textAlign: "center",
            marginVertical: 6,
          },
        ]}
      >
        {fmt(left)}
      </Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        <View style={{ flex: 1, minWidth: 160 }}>
          <MatchAction
            label="Démarrer immédiatement"
            fontSize={12}
            height={44}
            icon="play"
            disabled={locked}
            onPress={() => dispatchSession(S.startNextImmediately)}
          />
        </View>
        <View style={{ flex: 1, minWidth: 160 }}>
          <MatchAction
            label={running ? "Pause du délai" : "Reprendre le délai"}
            fontSize={12}
            height={44}
            kind="secondary"
            icon={running ? "pause" : "play"}
            disabled={locked}
            onPress={() =>
              dispatchSession(running ? S.pauseNextLaunch : S.resumeNextLaunch)
            }
          />
        </View>
        <MatchAction
          label="Annuler le lancement automatique"
          fontSize={12}
          kind="text"
          icon="close"
          disabled={locked}
          onPress={() => dispatchSession(S.cancelNextLaunch)}
        />
      </View>
    </View>
  );
}
function Ranking({
  session,
  onClose,
}: {
  session: Session;
  onClose: () => void;
}) {
  const rows = computeStandings(
    session.teams.map((t) => t.id),
    session.matches,
  );
  return (
    <MatchSheet label="Classement" onClose={onClose}>
      <View style={m.row}>
        <Text style={[m.title, { fontSize: 18, lineHeight: 27 }]}>
          Classement
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Fermer"
          onPress={onClose}
          style={{
            width: 44,
            height: 44,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <MatchIcon name="close" />
        </Pressable>
      </View>
      <View role="table">
        <View
          style={[
            m.row,
            { gap: 0, borderBottomWidth: 1, borderColor: c.border },
          ]}
        >
          {["#", "Équipe", "J", "Diff", "Pts"].map((h, i) => (
            <Text
              key={h}
              style={[
                m.tableHead,
                {
                  flex: i === 1 ? 1 : undefined,
                  width: i === 0 ? 25 : i > 1 ? 40 : undefined,
                  textAlign: i > 1 ? "right" : "left",
                },
              ]}
            >
              {h}
            </Text>
          ))}
        </View>
        {rows.map((r, i) => (
          <View
            key={r.teamId}
            style={{
              flexDirection: "row",
              alignItems: "center",
              borderBottomWidth: 1,
              borderColor: c.border,
            }}
          >
            <Text style={[m.tableCell, { width: 25 }]}>{i + 1}</Text>
            <View
              style={{
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 4,
                minWidth: 0,
              }}
            >
              <View
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 5,
                  marginRight: 8,
                  backgroundColor: session.teams.find((t) => t.id === r.teamId)
                    ?.color,
                }}
              />
              <Text
                numberOfLines={1}
                style={[m.tableCell, { paddingHorizontal: 0, flex: 1 }]}
              >
                {S.teamName(session, r.teamId)}
              </Text>
            </View>
            {[r.played, (r.gd > 0 ? "+" : "") + r.gd, r.points].map((v, j) => (
              <Text
                key={j}
                style={[
                  m.tableCell,
                  {
                    width: 40,
                    textAlign: "right",
                    fontFamily: j === 2 ? f.extrabold : f.semibold,
                  },
                ]}
              >
                {v}
              </Text>
            ))}
          </View>
        ))}
      </View>
    </MatchSheet>
  );
}
function Correction({
  teams,
  score,
  onGoal,
  onClose,
}: {
  teams: [Team | null, Team | null];
  score: [number, number];
  onGoal: (s: 0 | 1, d: 1 | -1) => void;
  onClose: () => void;
}) {
  return (
    <MatchSheet label="Corriger le score" onClose={onClose}>
      <Text
        accessibilityRole="header"
        style={[m.title, { fontSize: 18, lineHeight: 27 }]}
      >
        Corriger le score
      </Text>
      {teams.map((t, i) => (
        <View key={i} style={{ gap: 8 }}>
          <Text style={[m.bodyText, { textAlign: "center" }]}>
            {t?.name} · {score[i]}
          </Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <View style={{ flex: 1 }}>
              <MatchAction
                label={`Retirer un but à ${t?.name}`}
                kind="secondary"
                disabled={score[i] === 0}
                icon="minus"
                onPress={() => onGoal(i as 0 | 1, -1)}
              />
            </View>
            <View style={{ flex: 1 }}>
              <MatchAction
                label={`Ajouter un but à ${t?.name}`}
                kind="secondary"
                icon="plus"
                onPress={() => onGoal(i as 0 | 1, 1)}
              />
            </View>
          </View>
        </View>
      ))}
      <MatchAction label="Fermer la correction" onPress={onClose} />
    </MatchSheet>
  );
}
function ClassicMatchResult({
  session,
  error,
  onHome,
  onReplay,
  onCorrect,
  correcting,
  onCloseCorrection,
  onGoal,
}: {
  session: Session;
  error: string | null;
  onHome: () => void;
  onReplay: () => void;
  onCorrect: () => void;
  correcting: boolean;
  onCloseCorrection: () => void;
  onGoal: (s: 0 | 1, d: 1 | -1) => void;
}) {
  const { width, height } = useWindowDimensions();
  const [shareNote, setShareNote] = useState<string | null>(null);
  const l = session.live!,
    teams = S.liveTeams(session),
    detail = l.detail,
    match = S.currentMatch(session);
  const draw = l.score[0] === l.score[1];
  const share = async () => {
    const outcome = await shareText(sessionShareText(session));
    setShareNote(
      outcome === "copied"
        ? "Résumé copié."
        : outcome === "unavailable"
          ? "Partage indisponible sur cet appareil."
          : null,
    );
  };
  const reason =
    match?.finishReason === "regulation"
      ? "Fin du temps réglementaire"
      : match?.finishReason === "goalTarget"
        ? `Objectif de ${l.end.goalTarget} buts atteint`
        : "Match arrêté par l'organisateur";
  const periodValue = { ...m.bodyText, fontFamily: "ManropeRefined-Bold" };
  const cards: ReactNode[] = [
    // Final score on the night pitch. Always light on dark, in both themes.
    <View
      key="result"
      testID="match-result-card"
      style={{
        borderRadius: 22,
        overflow: "hidden",
        minHeight: width > height ? 150 : 220,
        paddingVertical: 20,
        paddingHorizontal: 16,
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        backgroundColor: brand.ink,
      }}
    >
      <PitchPhoto shade="full" position="bottom" />
      <Text style={{ fontFamily: f.extrabold, fontSize: 16, lineHeight: 22, color: brand.paper }}>
        {l.scoreOn ? "Score final" : "Match terminé"}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          l.scoreOn
            ? `Score ${l.score[0]} à ${l.score[1]} ; corriger le score`
            : "Score désactivé"
        }
        accessibilityHint="Ouvrir les commandes de correction du score"
        disabled={!l.scoreOn}
        onPress={onCorrect}
        hitSlop={8}
      >
        <Text
          testID="match-score"
          accessibilityLiveRegion="polite"
          maxFontSizeMultiplier={1.2}
          style={{
            fontFamily: f.extrabold,
            fontSize: 60,
            lineHeight: 66,
            color: brand.paper,
            fontVariant: ["tabular-nums"],
            includeFontPadding: false,
          }}
        >
          {l.scoreOn ? l.score[0] + " – " + l.score[1] : "—"}
        </Text>
      </Pressable>
      <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center", columnGap: 16, rowGap: 4 }}>
        {teams.map((team, i) => (
          <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: 6, maxWidth: "100%" }}>
            <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: team?.color ?? brand.paper }} />
            <Text numberOfLines={1} style={{ flexShrink: 1, fontFamily: f.semibold, fontSize: 13, lineHeight: 19, color: brand.paper }}>
              {team?.name}
            </Text>
          </View>
        ))}
      </View>
      {l.scoreOn ? (
        <Text style={{ fontFamily: f.extrabold, fontSize: 15, lineHeight: 21, color: brand.paper, textAlign: "center" }}>
          {draw
            ? "Match nul"
            : teams[l.score[0] > l.score[1] ? 0 : 1]?.name + " remporte le match"}
        </Text>
      ) : null}
      <Text style={{ fontFamily: f.regular, fontSize: 13, lineHeight: 19, color: withAlpha(brand.paper, 0.78), textAlign: "center" }}>
        {reason}
      </Text>
    </View>,
    <View
      key="time"
      testID="match-result-periods"
      style={[m.card, { gap: 12 }]}
    >
      <View style={m.row}>
        <Text
          style={{
            fontFamily: f.extrabold,
            fontSize: 15,
            lineHeight: 22.5,
            color: c.foreground,
          }}
        >
          Temps de jeu
        </Text>
        <Text style={periodValue}>{fmt(match?.playedMs ?? l.playedMs)}</Text>
      </View>
      <View>
        {l.periodMs.map((duration, i) => {
          const played = detail?.periods[i],
            goals = detail?.goals.filter((g) => g.period === i) ?? [],
            extra = played == null ? 0 : Math.max(0, played - duration);
          return (
            <View key={i} style={[m.row, m.rule]}>
              <Text style={[m.muted, { flex: 1 }]}>
                {periodName(l.periodMs.length, i)}
                {goals.length > 0 && l.scoreOn
                  ? " · " +
                    goals.filter((g) => g.side === 0).length +
                    "–" +
                    goals.filter((g) => g.side === 1).length
                  : ""}
              </Text>
              <Text style={periodValue}>
                {detail
                  ? played == null
                    ? "Non jouée"
                    : fmt(Math.min(played, duration)) +
                      (extra ? " +" + fmt(extra) : "")
                  : "Non enregistré"}
              </Text>
            </View>
          );
        })}
      </View>
    </View>,
  ];
  if (l.scoreOn && detail?.goals.length)
    cards.push(
      <View
        key="goals"
        testID="match-result-goals"
        style={[m.card, { gap: 12 }]}
      >
        <Text
          style={{
            fontFamily: f.extrabold,
            fontSize: 15,
            lineHeight: 22.5,
            color: c.foreground,
          }}
        >
          Buts
        </Text>
        <View>
          {detail.goals.map((g, i) => (
            <View
              key={i}
              style={[
                m.row,
                {
                  gap: 4,
                  paddingVertical: 10,
                  borderTopWidth: 1,
                  borderColor: c.border,
                },
              ]}
            >
              <View
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: teams[g.side]?.color,
                  marginRight: 4,
                }}
              />
              <Text
                style={{
                  fontFamily: "ManropeRefined-Bold",
                  fontSize: 13,
                  lineHeight: 19.5,
                  color: c.foreground,
                  flex: 1,
                }}
                numberOfLines={1}
              >
                {teams[g.side]?.name}
              </Text>
              <Text style={m.muted}>
                {periodName(l.periodMs.length, g.period)} ·{" "}
                {g.atMs === null ? "Correction" : fmt(g.atMs)}
              </Text>
            </View>
          ))}
        </View>
      </View>,
    );
  if (!detail)
    cards.push(
      <Text key="legacy" style={m.muted}>
        Le détail des périodes et des buts n’a pas été enregistré dans cette
        ancienne séance.
      </Text>,
    );
  if (error)
    cards.push(
      <Text key="error" accessibilityRole="alert" style={m.error}>
        {error}
      </Text>,
    );
  return (
    <>
      <PhaseFrame
        hideBack
        title="Fin de session"
        subtitle="Match classique"
        onBack={onHome}
        footer={
          <View
            style={{
              gap: 8,
              width: "100%",
              maxWidth: width > height ? 341.234375 : undefined,
              alignSelf: "center",
            }}
          >
            {l.scoreOn ? (
              <MatchAction
                testID="result-correct-score"
                label="Corriger le score"
                icon="pencil"
                kind="secondary"
                onPress={onCorrect}
              />
            ) : null}
            {/* Rejouer is the main action, full width; share and home share one row. */}
            <MatchAction
              testID="result-replay"
              label="Rejouer"
              icon="restart"
              onPress={onReplay}
            />
            <View style={{ flexDirection: "row", gap: 8 }}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <MatchAction
                  testID="result-share"
                  label="Partager le résumé"
                  icon="share"
                  kind="secondary"
                  fontSize={13} compact
                  onPress={() => {
                    void share();
                  }}
                />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <MatchAction
                  testID="result-home"
                  label="Retour à l’accueil"
                  icon="home"
                  kind="secondary"
                  danger
                  fontSize={13} compact
                  onPress={onHome}
                />
              </View>
            </View>
            {shareNote ? (
              <Text accessibilityLiveRegion="polite" style={[m.muted, { textAlign: "center" }]}>
                {shareNote}
              </Text>
            ) : null}
          </View>
        }
      >
        {cards}
      </PhaseFrame>
      {correcting ? (
        <Correction
          teams={teams}
          score={l.score}
          onGoal={onGoal}
          onClose={onCloseCorrection}
        />
      ) : null}
    </>
  );
}

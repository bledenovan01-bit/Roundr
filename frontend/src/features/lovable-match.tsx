import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  BackHandler,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { useNavigation, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Alert } from "@/src/alert";
import { elapsedMs } from "@/src/chrono/engine";
import { useDisplayClock } from "@/src/chrono/use-display-clock";
import * as S from "@/src/domain/session";
import type { Session, Team } from "@/src/domain/types";
import { computeStandings } from "@/src/domain/standings";
import {
  archiveSession,
  dispatchSession,
  getStoreState,
  retryStorage,
  startSession,
  useStore,
} from "@/src/store/session-store";
import {
  lovable as c,
  lovableFont as f,
  withAlpha,
} from "@/src/visual/lovable";
import { LovableBackground } from "@/src/components/lovable/background";
import { LovableIcon } from "@/src/components/lovable/icon";
import { Jersey, configStyles } from "@/src/components/lovable/configuration";
import { PhaseFrame } from "@/src/components/lovable/phase2b-ui";
import { GiantChrono } from "@/src/components/giant-chrono";
import { MatchAnnouncer } from "@/src/components/lovable/match-announcer";
import {
  MatchAction,
  MatchCarousel,
  MatchIcon,
  MatchScoreboard,
  MatchSheet,
  m,
  type MatchIconName,
} from "@/src/components/lovable/match-ui";
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
  const lockHeld = useRef(false);
  const [selectedPage, setSelectedPage] = useState(0);
  const l = session?.live,
    running = !!l && l.chrono.runningSince !== null && l.stage !== "finished",
    now = useDisplayClock(running);
  const matchKey = session?.id + ":" + l?.matchId + (tournament ? ":" + (l?.tiebreakStep === "choice" ? "period" : l?.stage === "extra" || l?.stage === "golden" ? l.stage : "period") : "");
  const [displayMatch, setDisplayMatch] = useState(matchKey);
  useEffect(() => {
    navigation.setOptions({ gestureEnabled: !locked });
    return () => navigation.setOptions({ gestureEnabled: true });
  }, [navigation, locked]);
  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (giant) {
        setGiant(false);
        return true;
      }
      return locked;
    });
    return () => sub.remove();
  }, [locked, giant]);
  useEffect(() => {
    if (!session) router.replace("/");
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
  const home = () => {
    if (!locked) router.replace("/");
  };
  const archiveAndHome = () => {
    archiveSession(S.endSession(session, Date.now()));
    if (!getStoreState().session) router.replace("/");
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
  const restart = () => {
    if (locked) return;
    confirmMatchRestart(() => {
      setShowElapsed(false);
      dispatchSession(S.restartCurrent);
    }, !!tournament && (l.stage === "extra" || l.stage === "golden"));
  };
  if (session.mode === "classique" && finished)
    return (
      <ClassicMatchResult
        session={session}
        error={saveError}
        onHome={archiveAndHome}
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
        style={{
          height: landscape ? 44 : 52,
          borderWidth: 1,
          borderColor: c.border,
          borderRadius: 16,
          backgroundColor: c.card,
          paddingHorizontal: 16,
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
        }}
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
    />
  );
  const noticeLayer = (
    <MatchAnnouncer session={session} now={Math.max(now, storeNow)} />
  );
  const begin = () => {
    if (!locked) dispatchSession(beginMatch);
  };
  const primary = l.stage === "ready" || between || l.tiebreakStep === "ready";
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
          style={m.headerButton}
        >
          <LovableIcon name="back" size={20} color={c.foreground} />
        </Pressable>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={m.title} accessibilityRole="header" numberOfLines={1}>
            {title}
          </Text>
          <Text style={[m.subtitle,tournament?{color:session.mode==="cup"?c.cup:c.survie}:null]} numberOfLines={1}>
            {subtitle}
          </Text>
        </View>
        <Pressable
          testID="match-lock-settings"
          accessibilityRole="button"
          accessibilityLabel={
            locked ? "Déverrouiller les commandes" : "Paramètres du match"
          }
          accessibilityHint="Appui long pour verrouiller ou déverrouiller les commandes"
          accessibilityActions={[
            {
              name: "activate",
              label: locked ? "Déverrouiller" : "Paramètres",
            },
            {
              name: "longpress",
              label: locked ? "Déverrouiller" : "Verrouiller",
            },
          ]}
          onAccessibilityAction={(e) => {
            if (e.nativeEvent.actionName === "longpress" || locked)
              setLocked((v) => !v);
            else router.push({ pathname: "/settings", params: { from: "match" } });
          }}
          onPressIn={() => {
            lockHeld.current = false;
          }}
          onPress={() => {
            if (!lockHeld.current && !locked) router.push({ pathname: "/settings", params: { from: "match" } });
            lockHeld.current = false;
          }}
          onLongPress={() => {
            lockHeld.current = true;
            setLocked((v) => !v);
          }}
          delayLongPress={550}
          style={m.headerButton}
        >
          {locked ? (
            <MatchIcon name="lock" color={c.amber} />
          ) : (
            <LovableIcon name="settings" size={20} color={c.foreground} />
          )}
        </Pressable>
      </View>
      <ScrollView
        testID="match-body"
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: landscape ? 4 : 8,
          paddingBottom: 4,
          paddingLeft: 20 + inset.left,
          paddingRight: 20 + inset.right,
          gap: landscape ? 10 : 14,
        }}
      >
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
            <View style={{ flex: 1, minWidth: 0, gap: 10 }}>
              {scoreboard}
              {rankingLink}
              {noticeLayer}
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>{carousel}</View>
          </View>
        ) : (
          <>
            {scoreboard}
            {carousel}
            {rankingLink}
            {noticeLayer}
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
        {primary ? (
          <View
            style={{ width: "100%", maxWidth: landscape ? 420 : undefined }}
          >
            <MatchAction
              label={
                between
                  ? "Démarrer la " +
                    periodName(
                      l.periodMs.length,
                      l.stage === "break" ? l.periodIndex + 1 : l.periodIndex,
                    ).toLowerCase()
                  : "Démarrer"
              }
              icon="play"
              onPress={begin}
              disabled={locked}
            />
          </View>
        ) : (
          <View
            style={{
              width: "100%",
              maxWidth: landscape ? 640 : undefined,
              flexDirection: "row",
              gap: 8,
            }}
          >
            {(
              [
                {
                  label:
                    l.stage === "additional"
                      ? l.periodIndex + 1 < l.periodMs.length
                        ? "Fin période"
                        : "Siffler"
                      : "Fin",
                  icon: "stop",
                  action: finish,
                  disabled: finished || l.stage === "shootout" || l.tiebreakStep === "choice",
                },
                {
                  label: "Relancer",
                  icon: "restart",
                  action: restart,
                  disabled: finished || l.stage === "shootout" || l.tiebreakStep === "choice",
                },
                {
                  label: projection.running ? "Pause" : "Reprendre",
                  icon: projection.running ? "pause" : "play",
                  action: () =>
                    dispatchSession(projection.running ? S.pause : S.resume),
                  disabled: finished || l.stage === "shootout" || l.tiebreakStep === "choice",
                },
              ] as {
                label: string;
                icon: MatchIconName;
                action: () => void;
                disabled: boolean;
              }[]
            ).map((b, i) => (
              <Pressable
                key={i}
                testID={
                  i === 0
                    ? "match-end"
                    : i === 1
                      ? "match-restart"
                      : "match-pause"
                }
                accessibilityRole="button"
                accessibilityLabel={b.label}
                disabled={locked || b.disabled}
                accessibilityState={{ disabled: locked || b.disabled }}
                onPress={b.action}
                style={{
                  flex: i === 2 ? 1.6 : 1,
                  minHeight: landscape ? 48 : 60,
                  minWidth: 44,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: i === 2 ? c.primary : c.border,
                  backgroundColor: i === 2 ? c.primary : c.cardRaised,
                  opacity: locked || b.disabled ? 0.35 : 1,
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: landscape ? "row" : "column",
                  gap: landscape ? 6 : 4,
                }}
              >
                <MatchIcon
                  name={b.icon}
                  color={i === 2 ? c.onPrimary : c.foreground}
                />
                <Text
                  style={{
                    fontFamily: "ManropeRefined-Bold",
                    fontSize: i === 2 ? 13 : 11,
                    lineHeight: i === 2 ? 130 / 7 : 110 / 7,
                    color: i === 2 ? c.onPrimary : c.foreground,
                  }}
                >
                  {b.label}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>
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
          <NextLaunch session={session} locked={locked} />
          <Text style={m.eyebrow}>MATCH {match?.order} TERMINÉ</Text>
          <MatchScoreboard
            compact
            teams={teams}
            score={l.score}
            scoreOn={l.scoreOn}
            canScore={false}
            locked={locked}
            onGoal={changeScore}
            onCorrect={correct}
          />
          <Text style={m.resultLine}>
            {l.score[0] === l.score[1]
              ? "Match nul"
              : "Victoire de " + teams[l.score[0] > l.score[1] ? 0 : 1]?.name}
            {match?.finishReason === "extension"
              ? " · but décisif en prolongation"
              : match?.finishReason === "goalTarget"
                ? " · premier à " + l.end.goalTarget
                : ""}
          </Text>
          <Rotation session={session} />
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
                    { text: "Terminer", onPress: archiveAndHome },
                  ],
                )
              }
            />
            <MatchAction
              label="Retour à l’accueil"
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
      style={{ gap: 8 }}
    >
      <View
        onLayout={(e) => setListWidth(e.nativeEvent.layout.width)}
        style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}
      >
        {cards.map(({ team, kind, note }) => (
          <View
            key={team.id}
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
              padding: kind === "stay" ? 12 : 8,
              paddingHorizontal: 12,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: kind === "stay" ? c.primary : c.border,
              backgroundColor:
                kind === "stay" ? withAlpha(c.primary, 0.14) : c.secondary,
              opacity: kind === "out" ? 0.85 : 1,
              zIndex: cols > 1 && kind === "stay" ? 1 : undefined,
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
            }}
          >
            <Jersey color={team.color} size={kind === "stay" ? 34 : 28} />
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
                    color={kind === "out" ? c.error : "#20c8d5"}
                  />
                )}
                <Text
                  numberOfLines={cols === 1 ? 1 : undefined}
                  style={{
                    fontFamily: f.extrabold,
                    fontSize: cols === 1 ? 10 : 9,
                    lineHeight: cols === 1 ? 15 : 13.5,
                    letterSpacing: cols === 1 ? 0.6 : 0.54,
                    color:
                      kind === "stay"
                        ? c.primary
                        : kind === "out"
                          ? c.error
                          : "#20c8d5",
                    flexShrink: 0,
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
                  fontSize: kind === "stay" ? 17 : 15,
                  lineHeight: kind === "stay" ? 25.5 : 22.5,
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
          style={{
            borderRadius: 14,
            borderWidth: 1,
            borderStyle: "dashed",
            borderColor: c.border,
            paddingVertical: 10,
            paddingHorizontal: 12,
            alignItems: "center",
          }}
        >
          <Text style={m.eyebrow}>PROCHAINE AFFICHE</Text>
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
  const l = session.live!,
    teams = S.liveTeams(session),
    detail = l.detail,
    match = S.currentMatch(session);
  const reason =
    match?.finishReason === "regulation"
      ? "Fin du temps réglementaire"
      : match?.finishReason === "goalTarget"
        ? `Objectif de ${l.end.goalTarget} buts atteint`
        : "Match arrêté par l'organisateur";
  const periodValue = { ...m.bodyText, fontFamily: "ManropeRefined-Bold" };
  const cards: ReactNode[] = [
    <View
      key="result"
      testID="match-result-card"
      style={[m.card, { gap: 10, alignItems: "stretch" }]}
    >
      <MatchScoreboard
        compact
        compactSize={40}
        winner={
          l.scoreOn && l.score[0] !== l.score[1]
            ? l.score[0] > l.score[1]
              ? 0
              : 1
            : null
        }
        teams={teams}
        score={l.score}
        scoreOn={l.scoreOn}
        canScore={false}
        locked={false}
        onGoal={onGoal}
        onCorrect={onCorrect}
      />
      {l.scoreOn ? (
        <Text style={m.resultLine}>
          {l.score[0] === l.score[1]
            ? "Match nul"
            : "Victoire de " + teams[l.score[0] > l.score[1] ? 0 : 1]?.name}
        </Text>
      ) : null}
      <Text
        style={[m.muted, { fontSize: 14, lineHeight: 21, textAlign: "center" }]}
      >
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
        title="Résultat"
        subtitle="MATCH CLASSIQUE"
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
            <MatchAction
              label="Rejouer avec les mêmes paramètres"
              icon="restart"
              onPress={onReplay}
            />
            <MatchAction
              label="Terminer et revenir à l'accueil"
              icon="home"
              kind="text"
              onPress={onHome}
            />
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

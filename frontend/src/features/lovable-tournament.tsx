import { useEffect, useRef, useState, type ReactNode } from "react";
import { Pressable, Text, View, useWindowDimensions } from "react-native";
import { useRouter } from "expo-router";
import { Alert } from "@/src/alert";
import * as S from "@/src/domain/session";
import { matchTeams } from "@/src/domain/bracket";
import {
  canCorrectTournament,
  correctTournamentResult,
  fixtureLabel,
  resultHow,
  teamLabel,
  tournamentBest,
  tournamentGroupRows,
  tournamentProjection,
  tournamentSize,
  qualificationTitle,
  submitTournamentShootout,
  createTournamentSession,
} from "@/src/domain/tournament-presentation";
import type { Session } from "@/src/domain/types";
import {
  archiveSession,
  dispatchSession,
  flushStorage,
  getStoreState,
  renameCompetition,
  retryStorage,
  startSession,
  useStore,
} from "@/src/store/session-store";
import {
  competitionName,
  snapshotCompetition,
} from "@/src/store/competition-history";
import { LovableMatchScreen, NextLaunch } from "./lovable-match";
import { HistoryScreenFrame, h } from "@/src/components/lovable/history-ui";
import { historySummaryCards } from "@/src/components/lovable/history-summary";
import { PhaseInput } from "@/src/components/lovable/phase2b-ui";
import { Jersey } from "@/src/components/lovable/configuration";
import { LovableIcon } from "@/src/components/lovable/icon";
import {
  MatchAction,
  MatchScoreboard,
  MatchSheet,
  m,
} from "@/src/components/lovable/match-ui";
import {
  FixtureMatchup,
  TournamentBadge,
  TournamentBar,
  TournamentBracket,
  TournamentCard,
  TournamentDanger,
  TournamentFixtures,
  TournamentGroupCards,
  TournamentInfo,
  TournamentNote,
  TournamentScoreDuo,
  TournamentStorageError,
  TournamentTabs,
  TournamentSheetHeader,
} from "@/src/components/lovable/tournament-ui";
import { lovable as c, lovableFont as f } from "@/src/visual/lovable";

type Overlay =
  | { kind: "correct"; id: string }
  | { kind: "decision" }
  | { kind: "stop" }
  | null;
export function LovableTournamentFlow({
  initialHub = false,
}: {
  initialHub?: boolean;
}) {
  const session = useStore((s) => s.session),
    last = useStore((s) => s.lastSummary),
    error = useStore((s) => s.saveError),
    router = useRouter();
  const { width, height } = useWindowDimensions(),
    landscape = width > height;
  const [overlay, setOverlay] = useState<Overlay>(null),
    [tab, setTab] = useState(""),
    [localView, setLocalView] = useState<string | null>(
      initialHub ? "hub" : null,
    );
  useEffect(() => {
    if (!session)
      router.replace(
        last && (last.mode === "cup" || last.mode === "survie")
          ? "/summary"
          : "/",
      );
  }, [session, last, router]);
  if (!session || (session.mode !== "cup" && session.mode !== "survie"))
    return <View style={{ flex: 1, backgroundColor: c.background }} />;
  const s = session,
    p = tournamentProjection(s),
    accent = s.mode === "cup" ? c.cup : c.survie,
    live = s.live,
    match = S.currentMatch(s);
  const view = localView ?? s.tournamentView ?? (live ? "match" : "hub"),
    home = () => router.replace("/");
  const setView = (v: "hub" | "match" | "summary") => {
    if (s.tournamentView !== undefined) {
      dispatchSession((x) => ({ ...x, tournamentView: v }));
      setLocalView(null);
    } else setLocalView(v);
    if (initialHub && v !== "hub") router.replace("/live");
  };
  const open = (o: NonNullable<Overlay>) => {
    if (s.pendingLaunch && !s.pendingLaunch.cancelled)
      dispatchSession(S.pauseNextLaunch);
    setOverlay(o);
  };
  const prepare = () => {
    if (live && live.stage !== "finished") setView("match");
    else {
      dispatchSession(S.launchNext);
      setLocalView("match");
      if (initialHub) router.replace("/live");
    }
  };
  const interrupt = () => {
    archiveSession(S.endSession(s, Date.now()));
    setOverlay(null);
    router.replace("/summary");
  };
  const overlays =
    overlay?.kind === "correct" ? (
      <TournamentCorrection
        key={overlay.id}
        session={s}
        id={overlay.id}
        onClose={() => setOverlay(null)}
      />
    ) : overlay?.kind === "decision" && p.decision ? (
      <TournamentDecision
        key={p.decision.context}
        session={s}
        onClose={() => setOverlay(null)}
      />
    ) : overlay?.kind === "stop" ? (
      <MatchSheet
        label="Interrompre le tournoi"
        onClose={() => setOverlay(null)}
      >
        <TournamentSheetHeader
          title="Interrompre le tournoi ?"
          onClose={() => setOverlay(null)}
        />
        <Text style={[h.text, { color: c.muted, textAlign: "center" }]}>
          Les résultats déjà joués sont conservés dans le résumé. Aucun
          vainqueur ne sera désigné si la finale n&apos;est pas terminée.
        </Text>
        <TournamentDanger onPress={interrupt} />
        <MatchAction
          label="Continuer le tournoi"
          kind="text"
          onPress={() => setOverlay(null)}
        />
      </MatchSheet>
    ) : null;
  if (view === "summary" && (p.complete || s.status !== "active"))
    return <TournamentSummary session={s} />;
  const ranking =
    s.mode === "cup" ? "Classements et tableau" : "Voir le tableau";
  const next = p.next;
  const nextMatchup = next ? (
    <FixtureMatchup a={teamLabel(s, next.a)} b={teamLabel(s, next.b)} />
  ) : null;
  const after =
    p.fixtures.find(
      (m) =>
        m.id !== live?.matchId &&
        m.status !== "finished" &&
        m.status !== "bye" &&
        matchTeams(m, p.fixtures).every(Boolean),
    ) ??
    p.fixtures.find(
      (m) =>
        m.id !== live?.matchId && m.status !== "finished" && m.status !== "bye",
    );
  const info = (
    <View
      style={{
        flex: 1,
        minWidth: 0,
        gap: landscape ? 6 : 10,
        padding: landscape ? 10 : 14,
      }}
    >
      <TournamentInfo accent={accent}>
        <Text style={h.eyebrow}>ENSUITE</Text>
        {after ? (
          <FixtureMatchup
            a={teamLabel({ ...s, matches: p.fixtures }, after.a)}
            b={teamLabel({ ...s, matches: p.fixtures }, after.b)}
          />
        ) : (
          <Text style={[h.text, { fontFamily: f.extrabold, fontSize: 16 }]}>
            {match?.roundOf === 2 ? "Remise du trophée" : "Fin des matchs"}
          </Text>
        )}
        <TournamentBadge
          accent={accent}
          text={after ? fixtureLabel(s, after) : "Dernier match"}
        />
      </TournamentInfo>
      <TournamentInfo accent={accent}>
        <Text style={h.eyebrow}>PROGRESSION</Text>
        <TournamentBar played={p.done.length} total={p.total} />
        <Text
          style={[h.text, { fontSize: 13, lineHeight: 18.2, marginTop: 4 }]}
        >
          {p.done.length} match{p.done.length > 1 ? "s" : ""} joué
          {p.done.length > 1 ? "s" : ""} sur {p.total}
        </Text>
      </TournamentInfo>
    </View>
  );
  if (view === "match" && live && match) {
    const groupMatches = s.matches.filter((m) => m.stage === "group"),
      groupNo =
        match.stage === "group"
          ? `Match ${groupMatches.findIndex((m) => m.id === match.id) + 1}/${groupMatches.length}`
          : "";
    const phase =
      live.tiebreakStep === "choice"
        ? ""
        : live.stage === "extra"
          ? "Prolongation"
          : live.stage === "golden"
            ? "Golden goal"
            : "";
    return (
      <LovableMatchScreen
        tournament={{
          title: s.mode === "cup" ? "CUP" : "SURVIE",
          subtitle: [fixtureLabel(s, match), groupNo, phase]
            .filter(Boolean)
            .join(" · "),
          rankingLabel: ranking,
          onRanking: () => setView("hub"),
          info,
          onCorrect:
            live.stage === "finished"
              ? () => open({ kind: "correct", id: match.id })
              : undefined,
          overlay: ({ locked, onUnlock }) => {
            if (overlays) return overlays;
            if (live.stage === "shootout")
              return (
                <TournamentShootout
                  key={match.id}
                  session={s}
                  locked={locked}
                  onUnlock={onUnlock}
                />
              );
            if (live.tiebreakStep === "choice")
              return (
                <MatchSheet label="Égalité">
                  <Text style={[h.eyebrow, { textAlign: "center" }]}>
                    {fixtureLabel(s, match).toUpperCase()} · ÉGALITÉ
                  </Text>
                  <MatchScoreboard
                    compact
                    teams={S.liveTeams(s)}
                    score={live.score}
                    scoreOn
                    canScore={false}
                    locked={locked}
                    onGoal={() => {}}
                    onCorrect={() => {}}
                  />
                  <Text
                    style={[h.text, { color: c.muted, textAlign: "center" }]}
                  >
                    Élimination directe : un vainqueur doit être désigné.{" "}
                    {live.stage === "extra"
                      ? `Prolongation de ${live.extraMs / 60000} min, puis tirs au but si l'égalité persiste.`
                      : "Temps ouvert : le premier but qualifie. Sans but, tirs au but."}
                  </Text>
                  {locked ? (
                    <MatchAction
                      label="Déverrouiller les commandes"
                      kind="secondary"
                      onPress={onUnlock}
                    />
                  ) : null}
                  <MatchAction
                    height={56}
                    label={
                      live.stage === "extra"
                        ? "Préparer la prolongation"
                        : "Préparer le golden goal"
                    }
                    icon="play"
                    disabled={locked}
                    onPress={() => dispatchSession(S.prepareTournamentTiebreak)}
                  />
                </MatchSheet>
              );
            if (live.stage !== "finished") return null;
            const winner = match.winnerId
              ? s.teams.find((t) => t.id === match.winnerId)
              : null;
            return (
              <MatchSheet label="Fin du match">
                <NextLaunch session={s} locked={locked} />
                <Text style={[h.eyebrow, { textAlign: "center" }]}>
                  {fixtureLabel(s, match).toUpperCase()} · TERMINÉ
                </Text>
                <MatchScoreboard
                  compact
                  teams={S.liveTeams(s)}
                  score={live.score}
                  scoreOn
                  canScore={false}
                  locked={locked}
                  onGoal={() => {}}
                  onCorrect={() => open({ kind: "correct", id: match.id })}
                />
                <Text style={m.resultLine}>
                  {winner
                    ? `${match.stage !== "group" && match.stage !== "small" && match.roundOf !== 2 ? "Qualification" : "Victoire"} de ${winner.name}`
                    : "Match nul"}
                  {resultHow(match) ? ` · ${resultHow(match)}` : ""}
                </Text>
                <TournamentInfo accent={accent}>
                  <Text style={[h.eyebrow, { textAlign: "center" }]}>
                    PROGRESSION · {p.done.length}/{p.total}
                  </Text>
                  <TournamentBar played={p.done.length} total={p.total} />
                  {p.decision ? (
                    <Text style={h.text}>
                      Égalité parfaite : l&apos;organisateur doit désigner les
                      qualifiés.
                    </Text>
                  ) : p.complete ? (
                    <Text style={h.text}>
                      {s.teams.find((t) => t.id === p.champion)?.name} remporte{" "}
                      {s.mode === "cup" ? "la Cup" : "le tournoi"} !
                    </Text>
                  ) : (
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        flexWrap: "wrap",
                        gap: 8,
                      }}
                    >
                      {nextMatchup}
                      {next ? (
                        <TournamentBadge
                          text={fixtureLabel(s, next)}
                          accent={accent}
                        />
                      ) : null}
                    </View>
                  )}
                </TournamentInfo>
                {locked ? (
                  <MatchAction
                    label="Déverrouiller les commandes"
                    kind="secondary"
                    onPress={onUnlock}
                  />
                ) : null}
                {p.decision ? (
                  <MatchAction
                    label="Désigner les qualifiés"
                    disabled={locked}
                    onPress={() => {
                      setView("hub");
                      open({ kind: "decision" });
                    }}
                  />
                ) : p.complete ? (
                  <MatchAction
                    height={56}
                    label="Voir le palmarès"
                    icon="trophy"
                    disabled={locked}
                    onPress={() => setView("summary")}
                  />
                ) : !s.pendingLaunch || s.pendingLaunch.cancelled ? (
                  <MatchAction
                    height={56}
                    label="Lancer le prochain match"
                    icon="play"
                    disabled={locked || !next}
                    onPress={prepare}
                  />
                ) : null}
                <MatchAction
                  label={ranking}
                  icon="trophy"
                  kind="secondary"
                  disabled={locked}
                  onPress={() => setView("hub")}
                />
                <MatchAction
                  label="Corriger le résultat"
                  icon="pencil"
                  kind="text"
                  disabled={locked}
                  onPress={() => open({ kind: "correct", id: match.id })}
                />
                <MatchAction
                  label="Retour à l’accueil"
                  kind="text"
                  disabled={locked}
                  onPress={home}
                />
                <MatchAction
                  label="Interrompre le tournoi"
                  icon="flag"
                  kind="text"
                  disabled={locked}
                  onPress={() => open({ kind: "stop" })}
                />
              </MatchSheet>
            );
          },
        }}
      />
    );
  }
  const groupsDone =
    s.mode === "survie" ||
    s.cup?.phase === "knockout" ||
    s.matches
      .filter((m) => m.stage === "group")
      .every((m) => m.status === "finished");
  const current =
    tab ||
    (s.mode === "cup" ? (groupsDone ? "bracket" : "matches") : "bracket");
  const pending = !!live && live.stage !== "finished";
  const cta = pending ? (
    <MatchAction
      label="Retour au match"
      icon="play"
      onPress={() => setView("match")}
    />
  ) : p.decision ? (
    <MatchAction
      label="Désigner les qualifiés"
      onPress={() => open({ kind: "decision" })}
    />
  ) : p.complete ? (
    <MatchAction
      label="Voir le palmarès"
      icon="trophy"
      onPress={() => setView("summary")}
    />
  ) : s.pendingLaunch && !s.pendingLaunch.cancelled ? undefined : next ? (
    <MatchAction
      label={
        p.done.length ? "Lancer le prochain match" : "Préparer le premier match"
      }
      icon="play"
      onPress={prepare}
    />
  ) : undefined;
  const byes = s.matches.filter((m) => m.status === "bye").length;
  const cards: ReactNode[] = [
    <TournamentStorageError
      key="storage"
      error={error}
      onRetry={() => {
        void retryStorage();
      }}
    />,
    <TournamentNote key="summary">
      {s.mode === "cup" && s.config.mode === "cup"
        ? `${s.cup?.groups.length} poule${(s.cup?.groups.length ?? 0) > 1 ? "s" : ""} · ${s.matches.filter((m) => m.stage === "group").length} matchs de poule · ${s.config.qualifiersPerGroup} qualifié${s.config.qualifiersPerGroup > 1 ? "s" : ""} par poule${tournamentBest(s) ? ` + ${tournamentBest(s)} repêché${tournamentBest(s) > 1 ? "s" : ""}` : ""}${tournamentSize(s) >= 2 ? ` · tableau de ${tournamentSize(s)}` : ""} · ${p.total} rencontres au total.`
        : `Tableau de ${tournamentSize(s)}${byes ? ` · ${byes} exemption${byes > 1 ? "s" : ""} (qualification directe, pas de match)` : ""} · ${p.total} rencontres au total.`}
    </TournamentNote>,
  ];
  if (s.pendingLaunch && !s.pendingLaunch.cancelled)
    cards.push(<NextLaunch key="launch" session={s} locked={false} />);
  if (next && !pending && !p.decision)
    cards.push(
      <TournamentInfo key="next" accent={accent} highlight>
        <Text style={h.eyebrow}>
          {p.done.length ? "PROCHAIN MATCH" : "PREMIER MATCH"}
        </Text>
        {nextMatchup}
        <TournamentBadge
          accent={accent}
          text={`${fixtureLabel(s, next)} · ${S.matchMinutes(s, next)} min`}
        />
      </TournamentInfo>,
    );
  if (p.decision)
    cards.push(
      <TournamentNote key="decision" warn>
        Égalité parfaite ({qualificationTitle(p.decision.context).toLowerCase()}
        ) : désignez{" "}
        {p.decision.slots > 1
          ? `les ${p.decision.slots} qualifiés`
          : "le qualifié"}{" "}
        pour générer le tableau.
      </TournamentNote>,
    );
  cards.push(
    <MatchAction
      key="stop"
      label="Interrompre le tournoi"
      icon="flag"
      kind="text"
      onPress={() => open({ kind: "stop" })}
    />,
    <TournamentTabs
      key="tabs"
      value={current}
      cup={s.mode === "cup"}
      onChange={setTab}
    />,
  );
  if (current === "matches")
    cards.push(
      <TournamentFixtures
        key="matches"
        session={s}
        canCorrect={canCorrectTournament(s)}
        onCorrect={(id) => open({ kind: "correct", id })}
      />,
    );
  if (current === "groups") cards.push(...TournamentGroupCards(s));
  if (current === "bracket")
    cards.push(
      <TournamentCard
        key="bracket"
        title="Tableau final"
        count={s.mode === "cup" && !groupsDone ? "Après les poules" : undefined}
      >
        <TournamentBracket session={s} />
      </TournamentCard>,
    );
  return (
    <>
      <HistoryScreenFrame
        wideFooter
        title={s.mode === "cup" ? "Cup" : "Survie"}
        subtitle={`${s.teams.length} équipes · ${p.done.length}/${p.total} matchs`}
        accent={accent}
        onBack={home}
        right={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Paramètres du match"
            onPress={() => router.push("/settings")}
            style={h.back}
          >
            <LovableIcon name="settings" size={20} color={c.foreground} />
          </Pressable>
        }
        footer={cta}
      >
        {cards.filter((card, i) => i !== 0 || !!error)}
      </HistoryScreenFrame>
      {overlays}
    </>
  );
}

function TournamentShootout({
  session: s,
  locked,
  onUnlock,
}: {
  session: Session;
  locked: boolean;
  onUnlock: () => void;
}) {
  const [value, setValue] = useState<[number, number]>([0, 0]),
    live = s.live!,
    match = S.currentMatch(s)!,
    ids = matchTeams(match, s.matches) as [string, string];
  return (
    <MatchSheet label="Tirs au but">
      <TournamentSheetHeader title="Tirs au but" />
      <Text style={[h.text, { color: c.muted, textAlign: "center" }]}>
        Score conservé : {live.score[0]} – {live.score[1]}. Saisissez la séance
        de tirs au but.
      </Text>
      <TournamentScoreDuo
        session={s}
        ids={ids}
        value={value}
        onChange={(v) => {
          if (!locked) setValue(v);
        }}
        label="Tirs au but réussis par"
      />
      {value[0] === value[1] ? (
        <Text style={h.hint}>
          Les tirs au but doivent désigner un vainqueur.
        </Text>
      ) : null}
      {locked ? (
        <MatchAction
          label="Déverrouiller les commandes"
          kind="secondary"
          onPress={onUnlock}
        />
      ) : null}
      <MatchAction
        height={56}
        label="Valider les tirs au but"
        icon="check"
        disabled={locked || value[0] === value[1]}
        onPress={() =>
          dispatchSession((x, t) => submitTournamentShootout(x, value, t))
        }
      />
    </MatchSheet>
  );
}
function TournamentCorrection({
  session: s,
  id,
  onClose,
}: {
  session: Session;
  id: string;
  onClose: () => void;
}) {
  const result = s.matches.find((m) => m.id === id)!;
  const [score, setScore] = useState<[number, number]>(result.score ?? [0, 0]),
    [pens, setPens] = useState<[number, number]>(result.shootout ?? [0, 0]);
  const ko = result.stage !== "group",
    draw = score[0] === score[1],
    invalid = !canCorrectTournament(s) || (ko && draw && pens[0] === pens[1]);
  return (
    <MatchSheet label="Corriger le résultat" onClose={onClose}>
      <TournamentSheetHeader title="Corriger le résultat" onClose={onClose} />
      <TournamentScoreDuo
        session={s}
        ids={matchTeams(result, s.matches) as [string, string]}
        value={score}
        onChange={setScore}
        label="Buts de"
      />
      {ko && draw ? (
        <>
          <Text style={h.eyebrow}>TIRS AU BUT</Text>
          <TournamentScoreDuo
            session={s}
            ids={matchTeams(result, s.matches) as [string, string]}
            value={pens}
            onChange={setPens}
            label="Tirs au but de"
          />
        </>
      ) : null}
      <Text style={h.hint}>
        Les classements et le tableau sont recalculés. Si un qualifié change,
        les matchs qui en dépendaient sont annulés.
      </Text>
      {!canCorrectTournament(s) ? (
        <Text accessibilityRole="alert" style={h.error}>
          Terminez la rencontre en cours avant de corriger un résultat
          antérieur.
        </Text>
      ) : null}
      <MatchAction
        height={56}
        label="Enregistrer la correction"
        icon="check"
        disabled={invalid}
        onPress={() => {
          dispatchSession((x, t) =>
            correctTournamentResult(x, id, score, ko && draw ? pens : null, t),
          );
          onClose();
        }}
      />
    </MatchSheet>
  );
}
function TournamentDecision({
  session: s,
  onClose,
}: {
  session: Session;
  onClose: () => void;
}) {
  const decision = s.cup!.tieChoice!,
    [selected, setSelected] = useState<string[]>([]),
    accent = c.cup;
  const rows = (s.cup?.groups ?? []).flatMap((g) =>
    tournamentGroupRows(s, g.id),
  );
  return (
    <MatchSheet label="Égalité parfaite" onClose={onClose}>
      <TournamentSheetHeader title="Égalité parfaite" onClose={onClose} />
      <Text style={[h.text, { color: c.muted, textAlign: "center" }]}>
        {qualificationTitle(decision.context)}. Ces équipes sont strictement à
        égalité sur tous les critères. Sélectionnez{" "}
        {decision.slots === 1
          ? "l'équipe qualifiée"
          : `les ${decision.slots} équipes qualifiées`}
        .
      </Text>
      <View style={{ gap: 8 }}>
        {decision.candidates.map((id) => {
          const t = s.teams.find((t) => t.id === id)!,
            row = rows.find((r) => r.teamId === id)!,
            on = selected.includes(id);
          return (
            <Pressable
              key={id}
              accessibilityRole="button"
              accessibilityLabel={t.name}
              accessibilityState={{ selected: on }}
              aria-pressed={on}
              onPress={() =>
                setSelected(
                  on
                    ? selected.filter((x) => x !== id)
                    : selected.length < decision.slots
                      ? [...selected, id]
                      : selected,
                )
              }
              style={{
                paddingVertical: 10,
                paddingHorizontal: 12,
                gap: 10,
                flexDirection: "row",
                alignItems: "center",
                borderWidth: 1,
                borderColor: on ? accent : c.border,
                borderRadius: 14,
                backgroundColor: c.secondary,
              }}
            >
              <Jersey color={t.color} size={28} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text
                  numberOfLines={1}
                  style={[h.text, { fontFamily: f.extrabold }]}
                >
                  {t.name}
                </Text>
                <Text style={[h.hint, { fontSize: 11, lineHeight: 16.5 }]}>
                  {row.points} pts · {row.gd > 0 ? "+" : ""}
                  {row.gd} · {row.gf} buts · {row.wins} V
                </Text>
              </View>
              {on ? (
                <LovableIcon name="check" color={accent} size={18} />
              ) : null}
            </Pressable>
          );
        })}
      </View>
      <MatchAction
        height={56}
        label={`Confirmer (${selected.length}/${decision.slots})`}
        icon="check"
        disabled={selected.length !== decision.slots}
        onPress={() => {
          dispatchSession((x, t) => S.resolveTieChoice(x, selected, t));
          onClose();
        }}
      />
    </MatchSheet>
  );
}

export function TournamentSummary({ session: s }: { session: Session }) {
  const router = useRouter(),
    error = useStore((s) => s.saveError),
    entries = useStore((s) => s.competitions);
  const current = entries.find((c) => c.id === s.id),
    nameDefault = competitionName(s.mode as "cup" | "survie", s.createdAt);
  const [name, setName] = useState(
      current
        ? current.name === nameDefault
          ? ""
          : current.name
        : "name" in s.config
          ? (s.config.name ?? "")
          : "",
    ),
    [nameError, setNameError] = useState(false),
    [saving, setSaving] = useState(false),
    [busy, setBusy] = useState(false),
    revision = useRef(0);
  const entry = snapshotCompetition(
    s.status === "active"
      ? S.endSession(s, s.live?.finishedAt ?? s.updatedAt)
      : s,
    current,
  );
  const durable =
    !!current &&
    JSON.stringify(current.session.matches) === JSON.stringify(s.matches) &&
    current.status === entry.status;
  const rename = (value: string) => {
    setName(value);
    setSaving(true);
    const attempt = ++revision.current;
    void renameCompetition(s.id, value.trim() || nameDefault).then((ok) => {
      if (attempt === revision.current) {
        setSaving(false);
        setNameError(!ok);
      }
    });
  };
  const finish = async () => {
    if (busy) return;
    setBusy(true);
    if (getStoreState().session?.id === s.id)
      archiveSession(S.endSession(s, Date.now()));
    await flushStorage();
    setBusy(false);
    if (!getStoreState().saveError) router.replace("/");
  };
  const replay = () =>
    Alert.alert(
      "Rejouer ce tournoi ?",
      getStoreState().session?.status === "active" &&
        getStoreState().session?.id !== s.id
        ? "Une autre séance est en cours. La remplacer efface sa progression. La compétition rejouée reste dans l’historique."
        : "La compétition actuelle reste conservée dans l’historique.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Rejouer",
          onPress: () => {
            void (async () => {
              if (busy) return;
              setBusy(true);
              if (getStoreState().session?.id === s.id)
                archiveSession(S.endSession(s, Date.now()));
              await flushStorage();
              if (getStoreState().saveError) {
                setBusy(false);
                return;
              }
              if (s.config.mode !== "cup" && s.config.mode !== "survie") {
                setBusy(false);
                return;
              }
              const next = createTournamentSession(
                JSON.parse(JSON.stringify(s.config)),
                JSON.parse(JSON.stringify(s.teams)),
                Date.now(),
              );
              if (startSession({ ...next, tournamentView: "hub" }))
                router.replace("/live");
              setBusy(false);
            })();
          },
        },
      ],
    );
  const nameCard = (
    <TournamentCard key="name" title="Nom de la compétition">
      <PhaseInput
        accessibilityLabel="Nom de la compétition"
        placeholder={nameDefault}
        value={name}
        maxLength={40}
        editable={!busy}
        onChangeText={rename}
      />
      <Text
        accessibilityRole={error || nameError ? "alert" : undefined}
        style={error || nameError ? h.error : h.hint}
      >
        {error || nameError
          ? "Échec de l’enregistrement local : cette compétition n’est pas sauvegardée avec les dernières modifications. Réessaie la sauvegarde."
          : saving || !durable
            ? "Enregistrement dans l’historique…"
            : "✓ Enregistrée dans l’historique de cet appareil (non synchronisé)."}
      </Text>
    </TournamentCard>
  );
  const retry = () => {
    void retryStorage().then(() => {
      if (nameError) rename(name);
    });
  };
  return (
    <HistoryScreenFrame
      wideFooter
      title={
        entry.status === "interrupted" && !tournamentProjection(s).champion
          ? "Tournoi interrompu"
          : "Palmarès"
      }
      subtitle={s.mode === "cup" ? "Cup" : "Survie"}
      accent={s.mode === "cup" ? c.cup : c.survie}
      hideBack
      onBack={() => {
        void finish();
      }}
      footer={
        <View style={{ gap: 4 }}>
          <MatchAction
            label="Rejouer avec les mêmes paramètres"
            icon="restart"
            disabled={busy || saving || !!error || nameError}
            onPress={replay}
          />
          <MatchAction
            label="Terminer et revenir à l'accueil"
            icon="home"
            kind="text"
            disabled={busy || saving}
            onPress={() => {
              void finish();
            }}
          />
        </View>
      }
    >
      {[
        nameCard,
        ...historySummaryCards(entry, { showTeams: false }),
        ...(error || nameError
          ? [
              <TournamentStorageError
                key="storage"
                error={error ?? "Le nom n’a pas pu être enregistré."}
                onRetry={retry}
              />,
            ]
          : []),
      ]}
    </HistoryScreenFrame>
  );
}

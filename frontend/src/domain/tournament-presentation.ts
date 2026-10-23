import { buildBracket, matchTeams, nextPow2, resolveSlot } from "./bracket";
import {
  computeConfiguredQualification,
  computeQualification,
  bestNextCount,
} from "./cup";
import { computeStandings } from "./standings";
import * as S from "./session";
import type {
  CupConfig,
  SurvieConfig,
  Match,
  Session,
  Slot,
  Team,
} from "./types";

export function createTournamentSession(
  config: CupConfig | SurvieConfig,
  teams: Team[],
  now: number,
): Session {
  const session = S.createSession(config, teams, now);
  return {
    ...session,
    tournamentView: "hub",
    live: null,
    matches: session.matches.map((m) =>
      m.status === "live" ? { ...m, status: "scheduled" } : m,
    ),
  };
}

export const isTournament = (s: Session) =>
  s.mode === "cup" || s.mode === "survie";
export const qualificationTitle = (context: string) =>
  context.startsWith("Dernière place qualifiée · ")
    ? context.slice("Dernière place qualifiée · ".length) +
      " : dernière place qualificative"
    : context === "Meilleurs suivants"
      ? "Repêchage des meilleurs suivants"
      : context;
export const tournamentAccent = (s: Session) =>
  s.mode === "cup" ? "#8d5df8" : "#fe860f";
export const tournamentRound = (n: number) =>
  n === 2
    ? "Finale"
    : n === 4
      ? "Demi-finales"
      : n === 8
        ? "Quarts de finale"
        : n === 16
          ? "Huitièmes"
          : `Tour de ${n}`;
export const fixtureLabel = (s: Session, m: Match) =>
  m.stage === "group"
    ? (s.cup?.groups.find((g) => g.id === m.groupId)?.name ?? "Poule")
    : m.stage === "small"
      ? "Petite finale"
      : m.roundOf === 2
        ? "Finale"
        : m.roundOf === 4
          ? "Demi-finale"
          : m.roundOf === 8
            ? "Quart de finale"
            : m.roundOf === 16
              ? "Huitième"
              : `Tour de ${m.roundOf}`;
export const teamLabel = (s: Session, slot: Slot) => {
  const id = resolveSlot(slot, s.matches);
  return id
    ? (s.teams.find((t) => t.id === id)?.name ?? "?")
    : slot.kind === "tbd" && /exempt/i.test(slot.label)
      ? "Exempté"
      : "À déterminer";
};
export const resultHow = (m: Match) =>
  m.shootout
    ? `TAB ${m.shootout[0]}–${m.shootout[1]}`
    : m.finishReason === "goldenGoal" || m.completedPhase === "golden"
      ? "golden goal"
      : m.finishReason === "extraTimeEnd" || m.completedPhase === "prol"
        ? "a.p."
        : "";
export function tournamentSize(s: Session) {
  if (s.mode !== "cup" || s.config.mode !== "cup")
    return nextPow2(s.teams.length);
  const direct =
      (s.cup?.groups.length ?? s.config.groups) * s.config.qualifiersPerGroup,
    p = nextPow2(direct);
  return s.config.tournamentPolicy === "lovable"
    ? direct === 1
      ? 1
      : direct === p || s.config.bestNext
        ? p
        : p / 2
    : p;
}
export function tournamentBest(s: Session) {
  if (s.config.mode !== "cup") return 0;
  const n = s.config.groups * s.config.qualifiersPerGroup;
  return s.config.tournamentPolicy === "lovable"
    ? s.config.bestNext && n > 1
      ? nextPow2(n) - n
      : 0
    : bestNextCount(s.config.groups, s.config.qualifiersPerGroup);
}
/** Unresolved bracket slots are a read-only preview, never persisted as results. */
export function tournamentFixtures(s: Session): Match[] {
  if (
    s.mode !== "cup" ||
    s.cup?.phase === "knockout" ||
    s.config.mode !== "cup"
  )
    return [...s.matches];
  const size = tournamentSize(s);
  if (size < 2) return [...s.matches];
  const preview = buildBracket(
    Array.from(
      { length: size },
      (): Slot => ({ kind: "tbd", label: "À déterminer" }),
    ),
    {
      smallFinal: s.config.smallFinal,
      startOrder: s.matches.length + 1,
      idPrefix: "preview-",
      reference: s.config.tournamentPolicy === "lovable",
    },
  );
  return [...s.matches, ...preview];
}
export function tournamentProjection(s: Session) {
  const fixtures = tournamentFixtures(s),
    done = fixtures.filter((m) => m.status === "finished");
  const next =
    [...fixtures]
      .sort((a, b) => a.order - b.order)
      .find(
        (m) =>
          m.id !== s.live?.matchId &&
          m.status === "scheduled" &&
          matchTeams(m, fixtures).every(Boolean),
      ) ??
    (s.live?.stage === "ready"
      ? fixtures.find((m) => m.id === s.live?.matchId)
      : null) ??
    null;
  const final = s.matches.find((m) => m.stage === "ko" && m.roundOf === 2),
    small = s.matches.find((m) => m.stage === "small");
  const champion =
    final && (final.status === "finished" || final.status === "bye")
      ? final.winnerId
      : null;
  const sides = final ? matchTeams(final, s.matches) : [null, null];
  const finalist =
    final?.status === "finished"
      ? (sides.find((id) => id !== champion) ?? null)
      : null;
  return {
    fixtures,
    done,
    next,
    total: fixtures.filter((m) => m.status !== "bye").length,
    champion,
    finalist,
    third: small?.status === "finished" ? small.winnerId : null,
    complete: !!champion && !S.hasPendingMatches(s),
    decision: s.cup?.tieChoice ?? null,
  };
}
export function canCorrectTournament(s: Session) {
  return (
    isTournament(s) &&
    s.status === "active" &&
    (!s.live || s.live.stage === "ready" || s.live.stage === "finished")
  );
}
const scoresOK = (p: readonly number[]) =>
  p.length === 2 && p.every((n) => Number.isSafeInteger(n) && n >= 0);
export function submitTournamentShootout(
  s: Session,
  pens: [number, number],
  now: number,
) {
  return isTournament(s) && scoresOK(pens) && pens[0] !== pens[1]
    ? S.submitShootout(s, pens[0], pens[1], now)
    : s;
}
function resetResult(m: Match): Match {
  const reset = {
    ...m,
    status: "scheduled" as const,
    score: null,
    shootout: null,
    winnerId: null,
    finishReason: null,
    playedMs: 0,
    finishedAt: null,
  };
  delete reset.completedPhase;
  return reset;
}
/** Same native qualification policy as the engine; only stale dependent results are cleared. */
export function correctTournamentResult(
  s: Session,
  id: string,
  score: [number, number],
  pens: [number, number] | null,
  now: number,
): Session {
  const original = s.matches.find((m) => m.id === id);
  if (
    !canCorrectTournament(s) ||
    !original ||
    original.status !== "finished" ||
    !scoresOK(score)
  )
    return s;
  const ko = original.stage !== "group",
    draw = score[0] === score[1];
  if (ko && draw && (!pens || !scoresOK(pens) || pens[0] === pens[1])) return s;
  const [a, b] = matchTeams(original, s.matches);
  if (!a || !b) return s;
  const shootout = ko && draw ? pens : null;
  const winnerId = draw
    ? shootout
      ? shootout[0] > shootout[1]
        ? a
        : b
      : null
    : score[0] > score[1]
      ? a
      : b;
  const edited: Match = {
    ...original,
    score: [...score],
    shootout: shootout ? [...shootout] : null,
    winnerId,
    finishReason: shootout
      ? "shootout"
      : original.finishReason === "shootout"
        ? "regulation"
        : original.finishReason,
  };
  let matches = s.matches.map((m) => (m.id === id ? edited : m)),
    cup = s.cup;
  if (s.mode === "cup" && s.config.mode === "cup" && cup) {
    const groups = matches.filter((m) => m.stage === "group");
    if (groups.every((m) => m.status === "finished")) {
      const q =
        s.config.tournamentPolicy === "lovable"
          ? computeConfiguredQualification(
              cup.groups,
              groups,
              s.config.qualifiersPerGroup,
              cup.qualificationChoices ?? {},
              !!s.config.bestNext,
            )
          : computeQualification(
              cup.groups,
              groups,
              s.config.qualifiersPerGroup,
              cup.qualificationChoices ?? {},
            );
      if (q.kind === "tie") {
        cup = {
          ...cup,
          phase: "groups",
          qualifiedIds: [],
          tieChoice: {
            candidates: q.candidates,
            slots: q.slots,
            context: q.context,
          },
        };
        matches = groups;
      } else {
        const bracket = buildBracket(q.seeds, {
          smallFinal: s.config.smallFinal,
          startOrder: groups.length + 1,
          idPrefix: "k",
          reference: s.config.tournamentPolicy === "lovable",
        });
        cup = {
          ...cup,
          phase: "knockout",
          qualifiedIds: q.seeds.flatMap((sl) =>
            sl.kind === "team" ? [sl.teamId] : [],
          ),
          tieChoice: null,
        };
        matches = [...groups, ...bracket];
      }
    }
  }
  // Resolve in bracket order so a changed semifinal invalidates its final too.
  const oldById = new Map(s.matches.map((m) => [m.id, m]));
  for (const m of [...matches].sort(
    (a, b) =>
      (b.roundOf ?? Infinity) - (a.roundOf ?? Infinity) || a.order - b.order,
  )) {
    if (m.stage === "group" || m.status === "bye") continue;
    const old = m.id === id ? edited : oldById.get(m.id);
    if (!old) continue;
    const before = matchTeams(old, s.matches),
      after = matchTeams(m, matches);
    const same = before.every((team, i) => team === after[i] && team !== null);
    const value = same ? { ...m, ...old, a: m.a, b: m.b } : resetResult(m);
    matches = matches.map((x) => (x.id === m.id ? value : x));
  }
  let live = s.live;
  const current = live && matches.find((m) => m.id === live!.matchId);
  if (!current || current.status !== "finished") live = null;
  else if (live)
    live = {
      ...live,
      score: current.score ?? live.score,
      finishedAt: current.finishedAt,
    };
  let next: Session = {
    ...s,
    matches,
    cup,
    live,
    preFinish: null,
    pendingLaunch: undefined,
    ...(s.tournamentView !== undefined
      ? { tournamentView: live ? s.tournamentView : ("hub" as const) }
      : {}),
    updatedAt: now,
  };
  // Cancelling a pending launch while editing prevents any automatic restart.
  if (
    S.nextMatchInfo(next) &&
    next.config.mode !== "classique" &&
    "launch" in next.config &&
    next.config.launch !== "manual"
  )
    next = {
      ...next,
      live: null,
      ...(s.tournamentView !== undefined
        ? { tournamentView: "hub" as const }
        : {}),
    };
  return next;
}
export function tournamentGroupRows(s: Session, groupId: string) {
  const group = s.cup?.groups.find((g) => g.id === groupId);
  return group
    ? computeStandings(
        group.teamIds,
        s.matches.filter((m) => m.groupId === group.id),
        s.config.mode === "cup" && s.config.tournamentPolicy === "lovable",
      )
    : [];
}
export const unfinishedRevision = (active: Session | null, archived: Session) =>
  !!active &&
  active.id === archived.id &&
  !tournamentProjection(active).complete &&
  JSON.stringify(active.matches) !== JSON.stringify(archived.matches);

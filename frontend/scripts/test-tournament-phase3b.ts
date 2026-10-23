import * as S from "../src/domain/session";
import { matchTeams } from "../src/domain/bracket";
import { computeStandings } from "../src/domain/standings";
import { buildGroups, scheduleGroups } from "../src/domain/cup";
import {
  canCorrectTournament,
  correctTournamentResult,
  createTournamentSession,
  submitTournamentShootout,
  tournamentFixtures,
  tournamentProjection,
  unfinishedRevision,
} from "../src/domain/tournament-presentation";
import {
  matchPages,
  matchProjection,
} from "../src/features/match-presentation";
import {
  tournamentDefaults,
  tournamentTeams,
} from "../src/features/tournament-config-state";
import { snapshotCompetition } from "../src/store/competition-history";
import { validSession } from "../src/store/storage-validation";
import type {
  CupConfig,
  DrawRule,
  Session,
  SurvieConfig,
} from "../src/domain/types";
const builtin = (
  process as unknown as { getBuiltinModule: (id: string) => any }
).getBuiltinModule;
const assert = builtin("assert/strict"),
  req = builtin("module").createRequire(process.argv[1]);
const R = req("./tournament-reference.cjs");
const t0 = 1700000000000;
const cfg = (mode: "cup" | "survie", n: number, extra: object = {}) =>
  ({
    ...tournamentDefaults(mode),
    teamCount: n,
    draw: "manual",
    sounds: false,
    ...extra,
  }) as CupConfig | SurvieConfig;
const fresh = (mode: "cup" | "survie", n: number, extra: object = {}) =>
  createTournamentSession(cfg(mode, n, extra), tournamentTeams(n), t0);
function resolve(s: Session): Session {
  for (let i = 0; i < 20 && s.cup?.tieChoice; i++) {
    const tc = s.cup.tieChoice;
    s = S.resolveTieChoice(s, tc.candidates.slice(0, tc.slots), s.updatedAt);
  }
  return s;
}
function win(s: Session): Session {
  const at = s.updatedAt + 20000;
  s = S.launchNext(s, at);
  s = S.startReady(s, at);
  const [a, b] = matchTeams(S.currentMatch(s)!, s.matches).map((id) =>
    Number(id!.slice(1)),
  );
  for (let i = 0; i < s.teams.length - Math.min(a, b) + 1; i++)
    s = S.goal(s, a < b ? 0 : 1, 1, at + 100 + i * 10);
  return resolve(S.endManual(s, at + 12345));
}
function finish(s: Session, limit = 2000): Session {
  for (let i = 0; i < limit && !tournamentProjection(s).complete; i++)
    s = win(s);
  assert(tournamentProjection(s).complete, "competition completes");
  return s;
}
const reference = (s: Session) => {
  const c = s.config as CupConfig | SurvieConfig;
  return R.generate({
    kind: s.mode,
    teams: s.teams.map((t) => ({ name: t.name, color: t.color })),
    settings: {
      minutes: c.matchMin,
      byTime: c.end.byTime,
      byGoals: c.end.goalTarget !== null,
      goals: c.end.goalTarget ?? 3,
      extra: c.mode === "cup" && c.groupAdditional,
      tie:
        c.drawRule === "shootout"
          ? "tab"
          : c.drawRule === "golden"
            ? "golden"
            : "prol",
      prol: c.extraMin,
      rounds: c.roundMinutes,
      third: c.smallFinal,
    },
    draw: "manual",
    ...(c.mode === "cup"
      ? {
          groups: c.groups,
          qualified: c.qualifiersPerGroup,
          legs: c.doubleRound ? "double" : "single",
          best: c.bestNext,
        }
      : {}),
  });
};

for (const n of [2, 3, 5, 8, 16, 32])
  for (const small of [false, true]) {
    let s = fresh("survie", n, {
        smallFinal: n >= 4 && small,
        roundMinutes: { 2: 11, 4: 7, 8: 4 },
      }),
      d = reference(s);
    assert.equal(s.live, null);
    assert.equal(s.tournamentView, "hub");
    assert.equal(
      tournamentFixtures(s).filter((m) => m.status === "bye").length,
      2 ** Math.ceil(Math.log2(n)) - n,
    );
    for (
      let guard = 0;
      !tournamentProjection(s).complete && guard < 100;
      guard++
    ) {
      const a = R.analyze(d),
        next = a.next;
      s = S.launchNext(s, s.updatedAt + 1000);
      const m = S.currentMatch(s)!;
      assert.deepEqual(
        matchTeams(m, s.matches).map((id) => Number(id!.slice(1)) - 1),
        [next.a, next.b],
      );
      assert.equal(S.matchMinutes(s, m), R.fixtureMinutes(d, next.id));
      const before = s;
      s = win(s);
      assert.equal(before.live!.chrono.runningSince, null);
      const result = s.matches.find((x) => x.id === m.id)!;
      d = {
        ...d,
        seq: d.seq + 1,
        results: {
          ...d.results,
          [next.id]: {
            a: next.a,
            b: next.b,
            score: result.score,
            how: "reg",
            ms: result.playedMs,
            order: d.seq + 1,
          },
        },
      };
      assert(validSession(s));
    }
    const p = tournamentProjection(s),
      a = R.analyze(d);
    assert.equal(p.champion, "t" + (a.champion + 1));
    assert.equal(p.total, a.total);
    assert.equal(p.done.length, a.played);
    assert.equal(p.third, a.third === null ? null : "t" + (a.third + 1));
    assert.equal(
      snapshotCompetition(S.endSession(s, s.updatedAt)).summary.podium[0].name,
      s.teams[a.champion].name,
    );
  }
console.log(
  "✓ Survie 2/3/5/8/16/32, byes, rounds, small final, champion and podium agree with the frozen Lovable engine",
);

for (const [n, g, q, best] of [
  [4, 1, 1, 0],
  [4, 1, 2, 0],
  [7, 3, 2, 1],
  [8, 2, 2, 0],
  [10, 3, 2, 0],
  [10, 3, 2, 1],
  [12, 3, 2, 0],
  [12, 3, 2, 1],
  [16, 4, 2, 0],
]) {
  let s = fresh("cup", n, {
      groups: g,
      qualifiersPerGroup: q,
      bestNext: !!best,
      smallFinal: true,
    }),
    d = reference(s);
  for (
    let guard = 0;
    !tournamentProjection(s).complete && guard < 400;
    guard++
  ) {
    let a = R.analyze(d);
    if (a.decision) {
      d = {
        ...d,
        picks: {
          ...d.picks,
          [a.decision.key]: a.decision.candidates.slice(0, a.decision.need),
        },
      };
      a = R.analyze(d);
    }
    const next = a.next;
    s = S.launchNext(s, s.updatedAt + 1000);
    const m = S.currentMatch(s)!;
    assert(next, "reference has a playable next match");
    assert.deepEqual(
      matchTeams(m, s.matches).map((id) => Number(id!.slice(1)) - 1),
      [next.a, next.b],
    );
    s = win(s);
    const result = s.matches.find((x) => x.id === m.id)!;
    d = {
      ...d,
      seq: d.seq + 1,
      results: {
        ...d.results,
        [next.id]: {
          a: next.a,
          b: next.b,
          score: result.score,
          how: "reg",
          ms: result.playedMs,
          order: d.seq + 1,
        },
      },
    };
    assert(validSession(s));
  }
  assert.equal(
    tournamentProjection(s).champion,
    "t" + (R.analyze(d).champion + 1),
  );
  assert.equal(tournamentProjection(s).done.length, R.analyze(d).played);
  assert.equal(tournamentProjection(s).total, R.analyze(d).total);
  assert.equal(
    snapshotCompetition(S.endSession(s, s.updatedAt)).summary.podium[0].name,
    s.teams[R.analyze(d).champion].name,
  );
}
console.log(
  "✓ Cup group/KO progression, 1–4 groups, best-following ON/OFF, reduced brackets and a single qualifier match the frozen reference",
);

for (const mode of ["cup", "survie"] as const)
  for (const rule of [
    "shootout",
    "extraThenShootout",
    "golden",
  ] as DrawRule[]) {
    let s = fresh(mode, mode === "cup" ? 4 : 2, {
      groups: 1,
      qualifiersPerGroup: 2,
      drawRule: rule,
      matchMin: 1,
      extraMin: 1,
      smallFinal: false,
    });
    if (mode === "cup") while (s.cup?.phase !== "knockout") s = win(s);
    s = S.launchNext(s, t0 + 1000000);
    s = S.startReady(s, t0 + 1000000);
    s = S.advance(s, t0 + 1060000);
    if (rule === "shootout") assert.equal(s.live!.stage, "shootout");
    else {
      assert.equal(s.live!.tiebreakStep, "choice");
      assert.equal(s.live!.chrono.runningSince, null);
      assert.equal(S.resume(s, t0 + 2000000), s);
      assert.equal(S.goal(s, 0, 1, t0 + 2000000), s);
      assert.equal(S.endManual(s, t0 + 2000000), s);
      const raw = JSON.stringify(s);
      assert(validSession(JSON.parse(raw)));
      assert.equal(
        JSON.stringify(S.advance(JSON.parse(raw), t0 + 3000000)),
        raw,
      );
      s = S.prepareTournamentTiebreak(s, t0 + 3000000);
      assert.equal(s.live!.tiebreakStep, "ready");
      assert.equal(matchProjection(s, t0 + 4000000).status, "Prêt à démarrer");
      s = S.startTournamentTiebreak(s, t0 + 4000000);
      assert.equal(s.live!.chrono.runningSince, t0 + 4000000);
      if (rule === "golden") {
        s = S.goal(s, 0, 1, t0 + 4001000);
        assert.equal(s.live!.stage, "finished");
        assert.equal(S.currentMatch(s)!.finishReason, "goldenGoal");
        continue;
      }
      s = S.advance(s, t0 + 4060000);
      assert.equal(s.live!.stage, "shootout");
    }
    const raw = JSON.stringify(s);
    for (const bad of [
      [0, 0],
      [-1, 2],
      [NaN, 1],
      [1.5, 2],
      [Infinity, 1],
    ])
      assert.equal(
        submitTournamentShootout(s, bad as [number, number], s.updatedAt),
        s,
      );
    assert.equal(JSON.stringify(s), raw);
    s = submitTournamentShootout(s, [4, 3], s.updatedAt + 1000);
    assert.equal(s.live!.stage, "finished");
    assert.deepEqual(S.currentMatch(s)!.score, [0, 0]);
    assert.deepEqual(S.currentMatch(s)!.shootout, [4, 3]);
  }
console.log(
  "✓ Cup/Survie ties: explicit preparation, paused restore, overtime, shootouts and golden goal; no clock starts on preparation",
);

for (const mode of ["cup", "survie"] as const)
  for (const launch of ["manual", "auto", "delay"] as const) {
    let s = fresh(mode, 8, { launch, launchDelaySec: 30 });
    s = win(s);
    const at = s.updatedAt;
    s = S.advance(s, at);
    if (launch === "manual") {
      assert.equal(s.live!.stage, "finished");
      s = S.launchNext(s, at + 50000);
      assert.equal(s.live!.stage, "ready");
      assert.equal(S.advance(s, at + 500000).live!.chrono.runningSince, null);
    } else if (launch === "auto") {
      assert.equal(s.live!.stage, "period");
      assert.equal(s.tournamentView, "match");
    } else {
      assert(s.pendingLaunch);
      s = S.pauseNextLaunch(s, at + 10000);
      const raw = JSON.stringify(s);
      assert(validSession(JSON.parse(raw)));
      assert.equal(
        S.advance(JSON.parse(raw), at + 200000).live!.stage,
        "finished",
      );
      s = S.resumeNextLaunch(s, at + 200000);
      s = S.advance(s, at + 220000);
      assert.equal(s.live!.chrono.runningSince, at + 220000);
      let cancel = win(fresh(mode, 8, { launch, launchDelaySec: 30 }));
      cancel = S.advance(cancel, cancel.updatedAt);
      cancel = S.cancelNextLaunch(cancel, cancel.updatedAt + 1000);
      assert.equal(S.advance(cancel, at + 1000000).live!.stage, "finished");
    }
  }
console.log(
  "✓ Manual/automatic/delayed launches, pause/resume/cancel and restoration retain existing timestamp policies",
);

const original = finish(fresh("survie", 8, { smallFinal: true }));
const first = original.matches.find(
  (m) => m.stage === "ko" && m.roundOf === 8,
)!;
const oldRaw = JSON.stringify(original),
  oldArchive = snapshotCompetition(S.endSession(original, original.updatedAt));
const same = correctTournamentResult(
  original,
  first.id,
  [first.score![0] + 1, first.score![1]],
  null,
  original.updatedAt + 1000,
);
assert.equal(
  same.matches.filter((m) => m.status === "finished").length,
  original.matches.filter((m) => m.status === "finished").length,
);
assert.equal(
  tournamentProjection(same).champion,
  tournamentProjection(original).champion,
);
const reversed = correctTournamentResult(
  original,
  first.id,
  [0, 2],
  null,
  original.updatedAt + 2000,
);
assert.equal(JSON.stringify(original), oldRaw);
assert.equal(tournamentProjection(reversed).champion, null);
assert(
  reversed.matches.filter((m) => m.status === "finished").length <
    original.matches.filter((m) => m.status === "finished").length,
);
for (const m of original.matches.filter(
  (m) => m.roundOf === 8 && m.id !== first.id,
))
  assert.deepEqual(
    reversed.matches.find((x) => x.id === m.id),
    m,
  );
assert(unfinishedRevision(reversed, oldArchive.session));
assert(validSession(reversed));
const cup = finish(fresh("cup", 8, { groups: 2, qualifiersPerGroup: 2 }));
const target = cup.matches.find(
  (m) =>
    m.stage === "group" &&
    matchTeams(m, cup.matches).every((id) => id === "t1" || id === "t3"),
)!;
const [ta] = matchTeams(target, cup.matches),
  edited = correctTournamentResult(
    cup,
    target.id,
    ta === "t1" ? [0, 5] : [5, 0],
    null,
    cup.updatedAt + 1000,
  );
assert.notDeepEqual(edited.cup!.qualifiedIds, cup.cup!.qualifiedIds);
assert.equal(tournamentProjection(edited).champion, null);
assert(validSession(edited));
const inPlay = S.startReady(
  S.launchNext(reversed, reversed.updatedAt + 1000),
  reversed.updatedAt + 1000,
);
assert.equal(canCorrectTournament(inPlay), false);
assert.equal(
  correctTournamentResult(inPlay, first.id, [1, 0], null, inPlay.updatedAt),
  inPlay,
);
assert.equal(
  correctTournamentResult(original, first.id, [0, 0], null, original.updatedAt),
  original,
);
console.log(
  "✓ Historical score corrections preserve unrelated results, prune dependent rounds/qualifiers, preserve played durations and reject edits during play",
);

const zero = fresh("survie", 2, { drawRule: "extraThenShootout" }),
  legacy = S.createSession(zero.config, zero.teams, t0);
const oldExtra = S.endManual(legacy, t0 + 1000);
assert.equal(oldExtra.live!.tiebreakStep, undefined);
assert.equal(oldExtra.live!.chrono.runningSince, t0 + 1000);
assert(validSession(JSON.parse(JSON.stringify(oldExtra))));
assert(!validSession({ ...original, tournamentView: "unknown" }));
assert(
  !validSession({
    ...original,
    live: { ...original.live!, tiebreakStep: "ready" },
  }),
);
assert(
  !validSession({
    ...original,
    matches: original.matches.map((m, i) =>
      i ? m : { ...m, completedPhase: "invented" },
    ),
  }),
);
assert.deepEqual(matchPages(zero), ["digital", "ring", "tournament", "music"]);
assert.equal(JSON.stringify(oldExtra).includes("tournamentView"), false);
console.log(
  "✓ New optional UI metadata is validated; old saves keep their original overtime behavior and never acquire invented results",
);

// Exact ranking counterexample already approved for new Cup launches in Phase 2B.
const group = buildGroups(["t1", "t2", "t3", "t4"], 1, true),
  scores: Record<string, [number, number]> = {
    t1t2: [3, 0],
    t2t3: [2, 0],
    t1t3: [0, 1],
    t1t4: [1, 0],
    t2t4: [10, 0],
    t3t4: [1, 0],
  };
const matches = scheduleGroups(group, false).map((m) => {
  const [a, b] = matchTeams(m, []);
  const key = [a!, b!].sort(),
    v = scores[key.join("")];
  return {
    ...m,
    status: "finished" as const,
    score: a === key[0] ? v : ([v[1], v[0]] as [number, number]),
  };
});
const ref = R.generate({
  kind: "cup",
  teams: tournamentTeams(4),
  settings: reference(fresh("cup", 4)).settings,
  groups: 1,
  qualified: 1,
  legs: "single",
  best: false,
  draw: "manual",
});
for (let i = 0; i < ref.groupFixtures.length; i++) {
  const f = ref.groupFixtures[i];
  ref.results[f.id] = {
    a: f.a,
    b: f.b,
    score: matches[i].score,
    how: "reg",
    ms: 1000,
    order: i + 1,
  };
}
assert.equal(R.groupTable(ref, 0)[0][0].t, 0);
assert.equal(computeStandings(group[0].teamIds, matches, true)[0].teamId, "t1");
assert.equal(
  computeStandings(group[0].teamIds, matches, false)[0].teamId,
  "t2",
);
console.log(
  "✓ Frozen reference comparison proves mini-table/global-GD differences without changing legacy sporting criteria",
);
// Known remaining sporting differences, deliberately characterized rather than silently changed.
const doubleRef = R.generate({ ...ref.launch, legs: "double" });
for (let i = 0; i < ref.groupFixtures.length; i++) {
  const f = doubleRef.groupFixtures[i];
  doubleRef.results[f.id] = ref.results[f.id];
}
const doubleMatches = [
  ...matches,
  ...scheduleGroups(group, true).slice(matches.length),
];
assert.equal(R.groupTable(doubleRef, 0)[0][0].t, 1);
assert.equal(
  computeStandings(group[0].teamIds, doubleMatches, true)[0].teamId,
  "t1",
);
assert.equal(R.cupQual(doubleRef).done, false);
console.log(
  "✓ Documented difference: incomplete return legs can order a temporary table differently; qualification remains unavailable",
);
let targetExtra = fresh("survie", 2, {
  drawRule: "extraThenShootout",
  matchMin: 1,
  end: { byTime: true, goalTarget: 2 },
});
targetExtra = S.startReady(S.launchNext(targetExtra, t0), t0);
targetExtra = S.goal(targetExtra, 0, 1, t0 + 1000);
targetExtra = S.goal(targetExtra, 1, 1, t0 + 2000);
targetExtra = S.advance(targetExtra, t0 + 60000);
targetExtra = S.startTournamentTiebreak(
  S.prepareTournamentTiebreak(targetExtra, t0 + 61000),
  t0 + 62000,
);
const extraReference = reference(targetExtra);
extraReference.current = R.analyze(extraReference).next.id;
assert.equal(
  R.fixtureClock(extraReference, extraReference.current, "prol").goalTarget,
  null,
);
targetExtra = S.goal(targetExtra, 0, 1, t0 + 63000);
assert.equal(targetExtra.live!.stage, "finished");
assert.equal(S.currentMatch(targetExtra)!.finishReason, "goalTarget");
console.log(
  "✓ Documented difference: the existing native goal target still applies during overtime; no sporting rule silently changed",
);
// Editing an older save must not opt its future clocks into the new preparation flow.
const older: Session = JSON.parse(JSON.stringify(original));
delete older.tournamentView;
const olderCorrected = correctTournamentResult(
  older,
  first.id,
  [0, 2],
  null,
  older.updatedAt + 1000,
);
assert.equal(olderCorrected.tournamentView, undefined);
assert.equal(JSON.stringify(olderCorrected).includes("tournamentView"), false);
assert(validSession(olderCorrected));
let olderNext = {
  ...olderCorrected,
  config: { ...olderCorrected.config, drawRule: "extraThenShootout" },
} as Session;
olderNext = S.startReady(
  S.launchNext(olderNext, older.updatedAt + 2000),
  older.updatedAt + 2000,
);
olderNext = S.endManual(olderNext, older.updatedAt + 3000);
assert.equal(olderNext.live!.stage, "extra");
assert.equal(olderNext.live!.tiebreakStep, undefined);
assert.equal(olderNext.live!.chrono.runningSince, older.updatedAt + 3000);
console.log(
  "✓ Correcting an old save never silently switches its future overtime clocks to the new UI policy",
);
// The frozen UI/history asks for a nonexistent final when only one team qualifies.
assert.equal(ref.size, 1);
assert.equal(R.analyze(ref).champion, 0);
assert.throws(() => R.analyze(ref).br.outcome("K2-0"), { name: "RangeError" });
const singleQualified = finish(
  fresh("cup", 4, { groups: 1, qualifiersPerGroup: 1 }),
);
assert(tournamentProjection(singleQualified).complete);
assert.doesNotThrow(() =>
  snapshotCompetition(S.endSession(singleQualified, singleQualified.updatedAt)),
);
console.log(
  "✓ Known frozen-reference one-qualifier archival error characterized; native archives the champion without inventing a final",
);
const byeLayout = fresh("survie", 5, { smallFinal: true }),
  byeReference = reference(byeLayout),
  byeAnalysis = R.analyze(byeReference);
assert.deepEqual(
  tournamentFixtures(byeLayout)
    .filter((m) => m.stage === "ko" && m.roundOf === 8)
    .map((m) =>
      matchTeams(m, byeLayout.matches).map((id) =>
        id ? Number(id.slice(1)) - 1 : null,
      ),
    ),
  R.koFixtures(byeReference)
    .filter((m: any) => m.size === 8)
    .map((m: any) => byeAnalysis.br.sides(m.id)),
);
console.log(
  "✓ Bracket display preserves the reference seed positions; exempt teams are not sorted ahead of playable quarter-finals",
);

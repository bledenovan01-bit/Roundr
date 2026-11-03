import * as S from "../src/domain/session";
import { createFreeTimer, defaultConfig, advanceFree } from "../src/domain/free-timer";
import { freeCommand, freeReadout } from "../src/features/free-live-state";
import { homeSessionPreviews } from "../src/features/home-session-preview";
import { matchProjection } from "../src/features/match-presentation";
import { lovableLaunchDefaults, lovableConfigTeams } from "../src/features/lovable-config-state";
import { tournamentDefaults, tournamentTeams } from "../src/features/tournament-config-state";
import { createTournamentSession } from "../src/domain/tournament-presentation";
import { validSession } from "../src/store/storage-validation";
import { restoreFreeTimer } from "../src/store/free-timer-validation";
import { drawPlayers, validComposition } from "../src/domain/team-maker";
import { playerCount } from "../src/utils/player-count";
import type { ClassicConfig, MaracanaConfig } from "../src/domain/types";
const assert = (process as unknown as {getBuiltinModule: (id: string) => any}).getBuiltinModule("assert/strict");
const at = 1700000000000;
const classic = lovableLaunchDefaults("classique") as ClassicConfig;
const maracana = lovableLaunchDefaults("maracana") as MaracanaConfig;

for (const mode of ["classique", "maracana", "cup", "survie"] as const) {
  let s = mode === "classique" || mode === "maracana"
    ? S.createSession({...lovableLaunchDefaults(mode), ...(mode === "classique" ? {periods: 1 as const} : {})}, lovableConfigTeams(mode, mode === "classique" ? 2 : 5), at)
    : S.startReady(S.launchNext(createTournamentSession({...tournamentDefaults(mode), teamCount: 8}, tournamentTeams(8), at), at), at);
  const duration = s.live!.periodMs[0];
  s = S.goal(s, 0, 1, at + 1000);
  s = S.endManual(s, at + 12345);
  assert.equal(s.live!.stage, "finished");
  assert.equal(s.live!.chrono.accumulatedMs, 12345);
  assert.equal(s.live!.playedMs, 12345);
  assert.equal(S.currentMatch(s)!.playedMs, 12345);
  const frozen = JSON.stringify(s);
  const restored = JSON.parse(frozen);
  assert(validSession(restored));
  assert.equal(matchProjection(restored, at + 999999).time, matchProjection({...restored, live: {...restored.live, stage: "period"}}, at + 12345).time);
  assert.equal(matchProjection(s, at, true).time, "00:12.34");
  assert.equal(matchProjection(s, at).progress, 1); // completed match, irrespective of remaining time
  assert.equal(JSON.stringify(s), frozen);
  assert(duration > 12345);
}
let halves = S.createSession({...classic, periods: 2, totalMin: 2, breakMin: 0, additional: false}, lovableConfigTeams("classique", 2), at);
halves = S.advance(halves, at + 60000);
assert.equal(halves.live!.stage, "awaitPeriod");
halves = S.startNextPeriod(halves, at + 60000);
halves = S.endManual(halves, at + 72345);
assert.equal(matchProjection(halves, at).time, "00:47.65");
assert.equal(halves.live!.playedMs, 72345);
const natural = S.advance(S.createSession({...classic, periods: 1, totalMin: 1, additional: false}, lovableConfigTeams("classique", 2), at), at + 60000);
assert.equal(matchProjection(natural, at).time, "00:00.00");
console.log("✓ V0 manual finish: four modes, frozen clocks and results, JSON restore, second period and natural expiry");

const cd = freeCommand(createFreeTimer(defaultConfig("countdown")), "toggle", at);
const raw = JSON.stringify(cd);
assert.equal(homeSessionPreviews(null, cd, at + 600000).length, 0);
assert.equal(homeSessionPreviews(null, cd, at + 599000).length, 1);
assert.equal(JSON.stringify(cd), raw);
const ended = advanceFree(cd, at + 600000);
assert.equal(homeSessionPreviews(null, restoreFreeTimer(JSON.parse(JSON.stringify(ended))).value, at).length, 0);
const paused = freeCommand(cd, "toggle", at + 12345);
assert.equal(freeReadout(paused, at + 999999).main, "09:47");
assert.equal(restoreFreeTimer(JSON.parse(JSON.stringify(paused))).value!.stepAccumulatedMs, 12345);
assert.equal(homeSessionPreviews(null, paused, at + 999999).length, 1);
const intervals = freeCommand(createFreeTimer(defaultConfig("interval")), "toggle", at);
assert.equal(homeSessionPreviews(null, intervals, at + 9999999).length, 0);
console.log("✓ V0 resume: expiry without runtime tick, natural end restored, paused countdown retained, interval expiry, no mutation");

for (const launch of ["manual", "auto"] as const) {
  let s = S.createSession({...maracana, teamCount: 5, rotation: "winnerStays", launch, end: {byTime: true, goalTarget: 2}}, lovableConfigTeams("maracana", 5), at);
  const winner = S.liveTeams(s)[0]!.id;
  s = S.goal(s, 0, 1, at + 1000);
  assert.equal(s.live!.stage, "period");
  s = S.goal(s, 0, 1, at + 2000);
  assert.equal(s.live!.stage, "finished");
  assert.equal(S.currentMatch(s)!.finishReason, "goalTarget");
  assert.equal(S.currentMatch(s)!.winnerId, winner);
  s = S.advance(s, at + 2000);
  if (launch === "manual") s = S.startReady(S.launchNext(s, at + 2001), at + 2001);
  assert.equal(s.live!.stage, "period");
  assert(S.liveTeams(s).some(t => t?.id === winner));
  assert.equal(s.matches.filter(m => m.status === "finished").length, 1);
}
let golden = createTournamentSession({...tournamentDefaults("survie"), mode: "survie", teamCount: 2, drawRule: "golden", end: {byTime: true, goalTarget: null}}, tournamentTeams(2), at);
golden = S.startReady(S.launchNext(golden, at), at);
golden = S.endManual(golden, at + 1000);
assert.equal(golden.live!.stage, "golden");
assert.equal(golden.live!.tiebreakStep, "choice");
golden = S.prepareTournamentTiebreak(golden, at + 1000);
golden = S.startTournamentTiebreak(golden, at + 1000);
golden = S.goal(golden, 1, 1, at + 3000);
assert.equal(golden.live!.stage, "finished");
assert.equal(S.currentMatch(golden)!.finishReason, "goldenGoal");
assert.equal(matchProjection(golden, at + 999999).time, "00:02.00");
console.log("✓ V0 winner stays, first to two goals, manual/automatic next match and golden goal");

for (const count of [2, 3, 8, 17]) for (const teams of [2, Math.min(count, 8)]) {
  const players = Array.from({length: count}, (_, i) => `Joueur ${i + 1}`);
  const groups = drawPlayers(players, teams, at);
  assert.deepEqual(groups.flat().sort(), [...players].sort());
  assert(Math.max(...groups.map(g => g.length)) - Math.min(...groups.map(g => g.length)) <= 1);
  assert(validComposition({teams: tournamentTeams(teams), groups}));
}
assert.deepEqual([0, 1, 2].map(playerCount), ["0 joueur", "1 joueur", "2 joueurs"]);
console.log("✓ V0 named player draws: no loss/duplicate, balanced teams, valid composition and French counts");

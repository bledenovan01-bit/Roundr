import { homeSessionPreviews } from "../src/features/home-session-preview";
import { createFreeTimer, defaultConfig as freeConfig } from "../src/domain/free-timer";
import { createSession } from "../src/domain/session";
import { defaultConfig, defaultTeams } from "../src/domain/defaults";
import type { Session } from "../src/domain/types";

// Match the storage suite: Expo excludes Node ambient types; tests run on 22+.
const assert = (process as unknown as { getBuiltinModule: (id: string) => any }).getBuiltinModule("assert/strict");

const now = 1_000_000;
const free = createFreeTimer(freeConfig("stopwatch"));
const session = createSession(defaultConfig("classique"), defaultTeams("classique", 2), now);

function freeze<T>(value: T): T {
  if (value && typeof value === "object") {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}

assert.deepEqual(homeSessionPreviews(null, null, now), []);
assert.deepEqual(homeSessionPreviews(null, { ...free, finished: true }, now), []);
assert.deepEqual(homeSessionPreviews({ ...session, status: "finished" }, null, now), []);
assert.deepEqual(homeSessionPreviews({ ...session, status: "interrupted" }, null, now), []);

const ready = homeSessionPreviews(null, free, now)[0];
assert.equal(ready.state, "Prêt à démarrer");
assert.equal(ready.time, "temps de jeu : 00:00");
assert.equal(ready.route, "/chrono-libre/run");

// Presentation cannot erase paused progress, laps, scores or running timestamps.
const paused = freeze({ ...free, config: { ...free.config, withTeams: true }, stepAccumulatedMs: 16_460, laps: [7210, 15460], score: [2, 1] as [number, number] });
const before = JSON.stringify(paused);
const pausedCard = homeSessionPreviews(null, paused, now)[0];
assert.equal(pausedCard.state, "En pause");
assert.equal(pausedCard.time, "temps de jeu : 00:16");
assert.equal(pausedCard.teams, "Équipe A vs Équipe B");
assert.equal(JSON.stringify(paused), before);
assert.equal(homeSessionPreviews(null, { ...paused, running: true, stepStartedAt: now }, now + 2000)[0].time, "temps de jeu : 00:18");

const countdown = createFreeTimer(freeConfig("countdown"));
assert.equal(homeSessionPreviews(null, { ...countdown, stepAccumulatedMs: 5000 }, now)[0].time, "temps restant : 09:55");
assert.equal(homeSessionPreviews(null, { ...countdown, stepAccumulatedMs: 900_000 }, now)[0].time, "temps restant : 00:00");
const intervals = createFreeTimer(freeConfig("interval"));
assert.equal(homeSessionPreviews(null, { ...intervals, stepIndex: 1, stepAccumulatedMs: 5000 }, now)[0].time, "temps restant : 00:25");

const readyMatch: Session = { ...session, live: { ...session.live!, stage: "ready", chrono: { ...session.live!.chrono, runningSince: null, accumulatedMs: 0 } } };
const matchCard = homeSessionPreviews(readyMatch, null, now)[0];
assert.equal(matchCard.title, "Session en cours — Match classique");
assert.equal(matchCard.state, "Prêt à démarrer");
assert.equal(matchCard.time, "temps restant : 10:00");
assert.equal(matchCard.route, "/live");
assert.equal(matchCard.teams, session.teams.map(t => t.name).join(" vs "));

const running = freeze(session);
const snapshot = JSON.stringify(running);
assert.equal(homeSessionPreviews(running, null, now + 2000)[0].time, "temps restant : 09:58");
assert.equal(homeSessionPreviews(running, null, now + 2000)[0].state, "En cours");
assert.equal(JSON.stringify(running), snapshot);
const pausedMatch = { ...readyMatch, live: { ...readyMatch.live!, stage: "period" as const, chrono: { ...readyMatch.live!.chrono, accumulatedMs: 2000 } } };
assert.equal(homeSessionPreviews(pausedMatch, null, now + 500_000)[0].time, "temps restant : 09:58");
assert.equal(homeSessionPreviews(pausedMatch, null, now)[0].state, "En pause");

const overtime = { ...pausedMatch, live: { ...pausedMatch.live, stage: "additional" as const } };
assert.equal(homeSessionPreviews(overtime, null, now)[0].time, "temps additionnel : +00:02");
const rest = { ...pausedMatch, live: { ...pausedMatch.live, stage: "break" as const, breakMs: 60_000 } };
assert.equal(homeSessionPreviews(rest, null, now)[0].time, "pause : 00:58");
assert.equal(homeSessionPreviews(rest, null, now)[0].state, "Pause entre les périodes");
const goalsOnly = { ...pausedMatch, live: { ...pausedMatch.live, end: { byTime: false, goalTarget: 3 } } };
assert.equal(homeSessionPreviews(goalsOnly, null, now)[0].time, "temps de jeu : 00:02");

// Native match and free timer are independent. Neither resume entry is hidden.
const both = homeSessionPreviews(running, paused, now);
assert.deepEqual(both.map(c => c.route), ["/live", "/chrono-libre/run"]);
assert.notEqual(both[0].key, both[1].key);
assert.equal(JSON.stringify(paused), before);
assert.equal(JSON.stringify(running), snapshot);
console.log("✓ Accueil : reprise des deux séances, temps projetés et données inchangées");

import { createClockGuard } from "../src/chrono/clock-guard";
import { elapsedMs } from "../src/chrono/engine";
import assert from "node:assert/strict";
import { defaultConfig, defaultTeams } from "../src/domain/defaults";
import * as S from "../src/domain/session";
import type { AnyConfig } from "../src/domain/types";
import { validateConfig } from "../src/domain/validate";
import { buildGroups } from "../src/domain/cup";
import { formatRemaining } from "../src/chrono/format";
import { notificationPlan } from "../src/audio/notification-plan";
import { sessionSound } from "../src/audio/events";
import { createPersistence, STATE_KEY, BACKUP_KEY, validSession, type SavedState } from "../src/store/persistence";

const t = 1_000_000;
const make = (mode: AnyConfig["mode"], patch: object = {}, n = 2) => S.createSession({ ...defaultConfig(mode), ...patch } as AnyConfig, defaultTeams(mode, n), t);
let cases = 0;
function check(name: string, run: () => void) { run(); cases++; console.log("✓", name); }

check("Cup: successive qualification choices survive serialization", () => {
  let s = make("cup", { teamCount: 8, groups: 2, qualifiersPerGroup: 2, draw: "manual" }, 8);
  for (let i = 0; i < 12; i++) { s = S.endManual(s, t + i * 2000 + 1000); if (i < 11) s = S.launchNext(s, t + i * 2000 + 1500); }
  s = S.resolveTieChoice(s, ["t1", "t2"], t + 30000);
  assert.match(s.cup!.tieChoice!.context, /B/);
  s = JSON.parse(JSON.stringify(s));
  s = S.resolveTieChoice(s, ["t5", "t6"], t + 31000);
  assert.equal(s.cup!.phase, "knockout");
  assert.deepEqual(new Set(s.cup!.qualifiedIds), new Set(["t1", "t2", "t5", "t6"]));
  assert.equal(validSession(s), true);
});
check("Corrected knockout draw reopens configured tiebreak", () => {
  for (const drawRule of ["shootout", "extraThenShootout", "golden"]) {
    let s = make("survie", { teamCount: 4, draw: "manual", drawRule }, 4);
    s = S.endManual(S.goal(s, 0, 1, t + 1000), t + 2000);
    s = S.correctLast(s, 0, -1, t + 3000);
    assert.equal(s.live!.stage, drawRule === "shootout" ? "shootout" : drawRule === "golden" ? "golden" : "extra");
    if (s.live!.stage === "shootout") s = S.submitShootout(s, 4, 3, t + 4000);
    else { s = S.goal(s, 0, 1, t + 4000); s = S.endManual(s, t + 5000); }
    s = S.launchNext(s, t + 6000);
    s = S.endManual(S.goal(s, 0, 1, t + 7000), t + 8000);
    assert.equal(S.nextMatchInfo(s)!.certain, true);
  }
});
check("Golden correction retains decisive result; cancellation restores pause", () => {
  let s = make("survie", { teamCount: 2, drawRule: "golden" });
  s = S.goal(S.advance(s, t + 480000), 0, 1, t + 481000);
  assert.equal(S.correctLast(s, 0, 1, t + 482000).live!.stage, "finished");
  const cancelled = S.correctLast(s, 0, -1, t + 482000);
  assert.equal(cancelled.live!.stage, "golden"); assert.equal(S.isPaused(cancelled.live!), true);
});
check("Manual Maracana 0-0 ends without an unwanted extension", () => {
  assert.equal(S.endManual(make("maracana", {}, 3), t + 1000).live!.stage, "finished");
  assert.equal(S.advance(make("maracana", {}, 3), t + 480000).live!.stage, "extra");
});
check("Reconcile time before late action prevents overtime score/pause", () => {
  const before = make("classique", { totalMin: 1 });
  const settled = S.advance(before, t + 120000);
  assert.equal(S.pause(settled, t + 120000).live!.stage, "finished");
  assert.deepEqual(S.goal(settled, 0, 1, t + 120000).matches[0].score, [0, 0]);
});
check("Restart retains earlier tournament results", () => {
  let s = make("survie", { teamCount: 4, draw: "manual" }, 4);
  s = S.endManual(S.goal(s, 0, 1, t + 1000), t + 2000);
  const first = JSON.stringify(s.matches[0]);
  s = S.goal(S.launchNext(s, t + 3000), 1, 1, t + 4000);
  s = S.restartCurrent(s, t + 5000);
  assert.equal(JSON.stringify(s.matches[0]), first);
  assert.deepEqual(s.live!.score, [0, 0]); assert.equal(s.live!.chrono.runningSince, t + 5000);
});
check("Invalid presets and malformed storage are rejected", () => {
  assert.ok(validateConfig({ ...defaultConfig("custom"), end: { byTime: false, goalTarget: null } } as AnyConfig, defaultTeams("custom", 2)).length);
  assert.equal(validSession({ status: "active" }), false);
  const s = make("classique"); (s.live!.chrono as any).accumulatedMs = "broken";
  assert.equal(validSession(s), false);
});
check("Countdown never displays zero before expiry; 16 group labels", () => {
  assert.equal(formatRemaining(1), "00:01"); assert.equal(formatRemaining(0), "00:00");
  assert.equal(buildGroups(Array.from({ length: 32 }, (_, i) => String(i)), 16)[15].name, "Poule P");
});
check("Audio start, prep priority and goal-target final", () => {
  const s = make("maracana", {}, 3);
  assert.equal(sessionSound(s, S.restartCurrent(s, t + 1000)), "whistle");
  assert.equal(sessionSound(s, S.advance(s, t + 300000)), "prep");
  const g = make("custom", { end: { byTime: false, goalTarget: 1 } });
  assert.equal(sessionSound(g, S.goal(g, 0, 1, t + 1000)), "final");
});
check("Background plans cancel on pause and distinguish open additional time", () => {
  const s = make("classique", { totalMin: 5 });
  const plan = notificationPlan(s, t);
  assert.equal(plan.at(-1)!.sound, "final"); assert.equal(plan.at(-1)!.at, t + 300000);
  assert.equal(notificationPlan(S.pause(s, t + 1000), t + 1000).length, 0);
  const extra = notificationPlan(make("classique", { totalMin: 5, additional: true }), t);
  assert.equal(extra.at(-1)!.sound, "whistle");
  const paused = S.resume(S.pause(s, t + 10000), t + 30000);
  assert.equal(notificationPlan(paused, t + 30000).at(-1)!.at, t + 320000);
});
check("Every Survie size 2-32 reaches a champion", () => {
  for (let n = 2; n <= 32; n++) {
    let s = make("survie", { teamCount: n, draw: "manual", smallFinal: true, end: { byTime: false, goalTarget: 1 } }, n);
    let i = 0;
    while (!S.sessionComplete(s) && i++ < 40) { s = S.goal(s, 0, 1, t + i * 2000); if (!S.sessionComplete(s)) { assert.equal(S.nextMatchInfo(s)!.certain, true); s = S.launchNext(s, t + i * 2000 + 1000); } }
    assert.equal(S.sessionComplete(s), true);
  }
});
check("Foreground wall-clock jumps preserve elapsed time; suspension resets the guard", () => {
  const guard = createClockGuard(); let s = make("classique");
  s = guard.reconcile(s, t, 0);
  s = guard.reconcile(s, t + 3610000, 10000);
  assert.equal(elapsedMs(s.live!.chrono, t + 3610000), 10000);
  s = guard.reconcile(s, t + 20000, 20000);
  assert.equal(elapsedMs(s.live!.chrono, t + 20000), 20000);
  guard.reset(); assert.equal(guard.reconcile(s, t + 90000, 20000), s);
});
check("Malformed bracket dependencies, saved corrections and qualifications are rejected", () => {
  const cycle = make("survie", { teamCount: 4 }, 4);
  cycle.matches[0].a = { kind: "winner", matchId: cycle.matches[0].id };
  assert.equal(validSession(cycle), false);
  const finished = S.endManual(make("classique"), t + 1000);
  finished.preFinish!.matches[0].a = null as never;
  assert.equal(validSession(finished), false);
  const cup = make("cup", {}, 8); cup.cup!.qualificationChoices = { A: ["unknown"] };
  assert.equal(validSession(cup), false);
});
async function persistenceTests() {
  const db = new Map<string, string>();
  let fail = false;
  const io = { async getItem(k: string) { return db.get(k) ?? null; }, async setItem(k: string, v: string) { if (fail && k === STATE_KEY) throw Error("disk full"); db.set(k, v); } };
  const p = createPersistence(io);
  const original: SavedState = { version: 2, session: make("classique"), lastSummary: null, presets: [] };
  await p.save(original);
  const finished = S.endSession(S.endManual(original.session!, t + 1000), t + 2000);
  fail = true;
  await assert.rejects(p.save({ ...original, session: null, lastSummary: finished }));
  assert.equal(JSON.parse(db.get(STATE_KEY)!).session.id, original.session!.id);
  fail = false;
  await p.save({ ...original, session: null, lastSummary: finished });
  assert.equal(JSON.parse(db.get(STATE_KEY)!).lastSummary.id, original.session!.id);
  assert.ok(db.has(BACKUP_KEY));
  db.set(STATE_KEY, '{"broken": true}');
  const recovered = await createPersistence(io).load();
  assert.ok(recovered.warning); assert.ok(recovered.data.session);
  assert.ok([...db.keys()].some(k => k.startsWith("roundr.corrupt.")));
  db.clear();
  let legacy = make("maracana", {}, 3);
  legacy = S.addMaracanaTeam(S.endManual(legacy, t + 1000), { id: "t4", name: "Quatrième", color: "#FFFFFF" }, t + 2000);
  (legacy.config as any).teamCount = 3;
  db.set("roundr.session.v1", JSON.stringify(legacy));
  const migrated = await createPersistence(io).load();
  assert.equal(migrated.warning, null); assert.equal(migrated.data.session!.teams.length, 4);
  console.log("✓ Atomic archive failure, retry, backup and corrupted-state recovery");
  console.log(cases + 1, "freeze regression scenarios passed");
}
void persistenceTests().catch(e => { console.error(e); process.exitCode = 1; });


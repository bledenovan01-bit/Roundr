import * as S from "../src/domain/session";
import type {
  ClassicConfig,
  MaracanaConfig,
  Session,
} from "../src/domain/types";
import {
  emptyMatchDetail,
  recordMatchDetail,
  validMatchDetail,
} from "../src/domain/match-detail";
import { validSession } from "../src/store/storage-validation";
import {
  lovableLaunchDefaults,
  lovableConfigTeams,
} from "../src/features/lovable-config-state";
import {
  beginMatch,
  maracanaUpcoming,
  matchPages,
  matchProjection,
  nextTeamId,
  rotationCards,
  visibleMatchPage,
} from "../src/features/match-presentation";
import {
  announcementScope,
  emptyAnnouncements,
  matchAnnouncements,
  reduceAnnouncements,
} from "../src/features/match-announcements";
const builtin = (
  process as unknown as { getBuiltinModule: (id: string) => any }
).getBuiltinModule;
const assert = builtin("assert/strict");
const req = builtin("module").createRequire(process.argv[1]) as {
  (id: string): unknown;
  cache: Record<string, unknown>;
  resolve: (id: string) => string;
};
const t0 = 1700000000000;
const classic = lovableLaunchDefaults("classique") as ClassicConfig;
const teams = lovableConfigTeams("classique", 2);
const ready = (config = classic) =>
  S.restartCurrent(S.createSession(config, teams, t0), t0);
let s = ready();
assert.deepEqual(matchPages(s), ["digital", "ring"]);
assert.equal(matchProjection(s, t0).time, "15:00.00");
assert.equal(matchProjection(s, t0, true).time, "00:00.00");
assert.equal(matchProjection(s, t0).canToggle, true);
assert.equal(S.advance(s, t0 + 1000000).live!.chrono.runningSince, null);
s = beginMatch(s, t0);
let p = matchProjection(s, t0 + 12345);
assert.equal(p.time, "14:47.65");
assert.equal(matchProjection(s, t0 + 12345, true).time, "00:12.34");
assert.equal(p.progress, 12345 / 900000);
s = S.pause(s, t0 + 12345);
assert.equal(matchProjection(s, t0 + 9000000).time, "14:47.65");
const raw = JSON.stringify(s);
matchProjection(s, t0 + 30000, true);
maracanaUpcoming(s);
rotationCards(s);
assert.equal(JSON.stringify(s), raw);
console.log(
  "✓ Classic remaining/elapsed, exact centiseconds, progress direction and paused timestamp projection are read-only",
);

const mara = (
  count = 5,
  launch: "manual" | "auto" | "delay" = "manual",
  rotation: "classic" | "winnerStays" = "classic",
  drawRule4: "oneLeaves" | "bothLeave" = "oneLeaves",
) => ({
  ...(lovableLaunchDefaults("maracana") as MaracanaConfig),
  teamCount: count,
  launch,
  launchDelaySec: 30,
  rotation,
  drawRule4,
});
const createMara = (
  count = 5,
  launch: "manual" | "auto" | "delay" = "manual",
  rotation: "classic" | "winnerStays" = "classic",
  drawRule4: "oneLeaves" | "bothLeave" = "oneLeaves",
) =>
  S.createSession(
    mara(count, launch, rotation, drawRule4),
    lovableConfigTeams("maracana", count),
    t0,
  );
let m = createMara();
assert.deepEqual(matchPages(m), ["digital", "ring", "next", "music"]);
assert.deepEqual(matchPages(S.restartCurrent(m, t0)), [
  "digital",
  "ring",
  "next",
]);
const heldSession = S.advance(S.pause(m, t0 + 1000), t0 + 10000);
assert.equal(visibleMatchPage(2, matchPages(heldSession)), 2);
assert(!JSON.stringify(matchPages(m)).includes("warmup"));
assert.equal(maracanaUpcoming(createMara(3))!.aLabel, "Vainqueur");
assert.equal(maracanaUpcoming(createMara(3))!.bLabel, "Panthères");
assert.equal(
  nextTeamId([
    { ...teams[0], id: "t3" },
    { ...teams[1], id: "t4" },
  ]),
  "t5",
);
m = S.goal(m, 0, 1, t0 + 1000);
m = S.endManual(m, t0 + 2000);
let prepared = S.launchNext(m, t0 + 2500);
assert.equal(prepared.live!.stage, "ready");
assert.equal(prepared.live!.chrono.runningSince, null);
assert.equal(S.advance(prepared, t0 + 600000).live!.stage, "ready");
prepared = beginMatch(prepared, t0 + 600001);
assert.equal(prepared.live!.chrono.runningSince, t0 + 600001);
assert.equal(prepared.matches.filter((x) => x.status === "finished").length, 1);
const auto = S.advance(
  S.endManual(S.goal(createMara(5, "auto"), 0, 1, t0 + 1000), t0 + 2000),
  t0 + 2000,
);
assert.equal(auto.live!.stage, "period");
assert.equal(auto.live!.chrono.runningSince, t0 + 2000);
let delayed = S.advance(
  S.endManual(S.goal(createMara(5, "delay"), 0, 1, t0 + 1000), t0 + 2000),
  t0 + 2000,
);
delayed = S.pauseNextLaunch(delayed, t0 + 12000);
assert.equal(S.advance(delayed, t0 + 900000).live!.stage, "finished");
const immediate = S.startNextImmediately(delayed, t0 + 900001);
assert.equal(immediate.live!.chrono.runningSince, t0 + 900001);
const cancelled = S.cancelNextLaunch(delayed, t0 + 12001);
assert.equal(S.advance(cancelled, t0 + 900000).live!.stage, "finished");
console.log(
  "✓ Carousel order stays manual; no Warmup page; preparing the next match never starts it; auto/delay require their explicit policy",
);

for (const count of [3, 4, 5, 8])
  for (const rotation of ["classic", "winnerStays"] as const)
    for (const drawRule of ["oneLeaves", "bothLeave"] as const) {
      let x = createMara(count, "manual", rotation, drawRule);
      x = S.goal(x, 0, 1, t0 + 100);
      x = S.endManual(x, t0 + 1000);
      const r = rotationCards(x);
      assert.equal(
        r.filter((c) => c.kind === "stay").length +
          r.filter((c) => c.kind === "in").length,
        2,
      );
      assert.deepEqual(
        r
          .filter((c) => c.kind === "out")
          .map((c) => c.team.id)
          .sort(),
        x.maracana!.lastOut.slice().sort(),
      );
      assert.deepEqual(
        r
          .filter((c) => c.kind === "stay" || c.kind === "in")
          .map((c) => c.team.id)
          .sort(),
        x.maracana!.onField.slice().sort(),
      );
    }
let draw = S.endManual(
  createMara(5, "manual", "winnerStays", "bothLeave"),
  t0 + 1000,
);
assert.equal(rotationCards(draw).filter((r) => r.kind === "stay").length, 0);
assert.equal(rotationCards(draw).filter((r) => r.kind === "in").length, 2);
console.log(
  "✓ Rotation cards derive frozen results and queues for 3–8 teams, winner stays and both draw policies without recalculating rules",
);

const step = (
  before: Session,
  fn: (s: Session, n: number) => Session,
  n: number,
) => recordMatchDetail(before, fn(before, n), n);
let trace = ready();
trace = { ...trace, live: { ...trace.live!, detail: emptyMatchDetail(2) } };
trace = step(trace, S.startReady, t0);
trace = step(trace, (x, n) => S.goal(x, 0, 1, n), t0 + 12345);
assert.deepEqual(trace.live!.detail!.goals, [
  { side: 0, period: 0, atMs: 12345 },
]);
trace = step(trace, S.advance, t0 + 900100);
assert.equal(trace.live!.stage, "break");
assert.deepEqual(trace.live!.detail!.periods, [900000, null]);
assert.equal(
  matchProjection(trace, t0 + 901000).label,
  "PAUSE · TEMPS RESTANT",
);
const beforeBreak = trace;
trace = step(trace, beginMatch, t0 + 902000);
assert.equal(trace.live!.periodIndex, 1);
assert.equal(trace.live!.chrono.runningSince, t0 + 902000);
assert.equal(trace.live!.playedMs, beforeBreak.live!.playedMs);
trace = step(trace, (x, n) => S.goal(x, 1, 1, n), t0 + 912000);
trace = step(trace, S.endManual, t0 + 932000);
assert.deepEqual(trace.live!.detail!.periods, [900000, 30000]);
assert.equal(trace.live!.playedMs, 930000);
assert(validSession(trace));
const tracedRaw = JSON.stringify(trace);
const reread = JSON.parse(tracedRaw);
assert(validSession(reread));
assert.deepEqual(reread.live.detail, trace.live!.detail);
const repeated = recordMatchDetail(
  trace,
  S.advance(trace, t0 + 999999),
  t0 + 999999,
);
assert.deepEqual(repeated.live!.detail, trace.live!.detail);
const corrected = step(trace, (x, n) => S.correctLast(x, 0, 1, n), t0 + 940000);
assert.equal(corrected.live!.detail!.goals.at(-1)!.atMs, null);
assert.equal(corrected.live!.playedMs, 930000);
assert(validSession(corrected));
const zero = ready();
const immediateFinish = step(
  step(
    { ...zero, live: { ...zero.live!, detail: emptyMatchDetail(2) } },
    S.startReady,
    t0,
  ),
  S.endManual,
  t0,
);
assert.deepEqual(immediateFinish.live!.detail!.periods, [0, null]);
const legacy = ready();
const legacyUpdated = S.goal(S.startReady(legacy, t0), 0, 1, t0 + 1000);
assert.equal(
  recordMatchDetail(legacy, legacyUpdated, t0 + 1000).live!.detail,
  undefined,
);
assert.equal(
  validMatchDetail({ periods: [NaN, null], goals: [] }, 2, [0, 0]),
  false,
);
assert.equal(
  validMatchDetail(
    { periods: [0, null], goals: [{ side: 2, period: 0, atMs: 1 }] },
    2,
    [1, 0],
  ),
  false,
);
assert.equal(
  validMatchDetail({ periods: [0, null], goals: [] }, 2, [1, 0]),
  false,
);
const reset = step(
  {
    ...trace,
    live: {
      ...trace.live!,
      stage: "period",
      chrono: { ...trace.live!.chrono, phase: "paused" },
    },
  },
  S.restartCurrent,
  t0 + 950000,
);
assert.deepEqual(reset.live!.detail, emptyMatchDetail(2));
console.log(
  "✓ Period/goal metadata records actual timestamps, excludes breaks, survives storage, resets on restart, preserves legacy unknowns and never invents correction times",
);

let a = createMara(5);
const announcements = matchAnnouncements(a);
assert.equal(announcements.find((e) => e.key === "warm")!.at, 240);
assert.equal(
  matchAnnouncements(createMara(3)).find((e) => e.key === "warm")!.message,
  "Panthères, échauffez-vous !",
);
assert(
  !matchAnnouncements({
    ...a,
    config: { ...mara(), end: { byTime: false, goalTarget: 3 } },
    live: { ...a.live!, end: { byTime: false, goalTarget: 3 } },
  }).length,
);
assert(!matchAnnouncements(a, false).some((e) => e.tone === "warmup"));
let q = emptyAnnouncements(announcementScope(a));
q = reduceAnnouncements(q, a, t0 + 240000);
assert.equal(q.current!.key, "warm");
assert.equal(reduceAnnouncements(q, a, t0 + 240100), q);
q = reduceAnnouncements(q, a, t0 + 244500);
assert.equal(q.current, null);
q = reduceAnnouncements(q, a, t0 + 420000);
assert.equal(q.current!.key, "prep");
assert.equal(q.queue[0].key, "t60");
q = reduceAnnouncements(q, a, t0 + 424500);
assert.equal(q.current!.key, "t60");
const stale = reduceAnnouncements(
  emptyAnnouncements(announcementScope(a)),
  a,
  t0 + 450000,
);
assert(!stale.queue.some((e) => e.key === "warm"));
assert.notEqual(stale.current?.key, "warm");
assert.equal(visibleMatchPage(2, matchPages(a)), 2);
console.log(
  "✓ Reference announcement thresholds, certain entering teams, priorities, 4.5 s expiry, replay grace and settings never move the carousel",
);

async function storage() {
  const original = Date.now;
  let time = t0;
  Date.now = () => time;
  try {
    const memory = new Map<string, string>(),
      faults = { write: false };
    (globalThis as any).__roundrTestModules = {
      "@react-native-async-storage/async-storage": {
        async getAllKeys() {
          return [...memory.keys()];
        },
        async getItem(k: string) {
          return memory.get(k) ?? null;
        },
        async setItem(k: string, v: string) {
          if (faults.write) throw Error("write");
          memory.set(k, v);
        },
        async removeItem(k: string) {
          memory.delete(k);
        },
      },
      react: { useSyncExternalStore() {} },
      "@/src/audio/sounds": { async playSound() {} },
      "@/src/haptics": { async selectionAsync() {} },
    };
    const fresh = () => {
      delete req.cache[req.resolve("../src/store/session-store")];
      return req(
        "../src/store/session-store",
      ) as typeof import("../src/store/session-store");
    };
    let st = fresh();
    await st.loadStore();
    assert(st.startSession(S.createSession(classic, teams, time)));
    st.dispatchSession(S.startReady);
    time += 12345;
    st.dispatchSession((x, n) => S.goal(x, 0, 1, n));
    await st.flushStorage();
    const saved = memory.get("roundr.session.v1")!;
    assert.equal(JSON.parse(saved).live.detail.goals[0].atMs, 12345);
    time = t0 + 900100;
    st = fresh();
    await st.loadStore();
    assert.equal(st.getStoreState().session!.live!.detail!.periods[0], 900000);
    faults.write = true;
    st.dispatchSession(beginMatch);
    await st.flushStorage();
    assert.equal(memory.get("roundr.session.v1"), saved);
    assert(st.getStoreState().saveError);
    faults.write = false;
    await st.retryStorage();
    assert.equal(st.getStoreState().saveError, null);
    assert(validSession(JSON.parse(memory.get("roundr.session.v1")!)));
    const legacyState = S.pause(S.startReady(ready(), t0), t0 + 12000),
      legacyRaw = JSON.stringify(legacyState);
    memory.set("roundr.session.v1", legacyRaw);
    st = fresh();
    await st.loadStore();
    assert.equal(st.getStoreState().session!.live!.detail, undefined);
    assert.equal(memory.get("roundr.session.v1"), legacyRaw);
    const rejected = JSON.stringify({
      ...legacyState,
      live: {
        ...legacyState.live!,
        detail: { periods: [-1, null], goals: [] },
      },
    });
    memory.set("roundr.session.v1", rejected);
    st = fresh();
    await st.loadStore();
    assert.equal(st.getStoreState().session, null);
    assert(st.getStoreState().saveError);
    assert.equal(memory.get("roundr.session.v1"), rejected);
    assert([...memory.entries()].some(([key, value]) => key !== "roundr.session.v1" && value === rejected));
    console.log(
      "✓ Classic goal/period details restore through the real store; failed writes preserve the durable value and remain visible until retry succeeds",
    );
  } finally {
    Date.now = original;
  }
}
void storage().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});

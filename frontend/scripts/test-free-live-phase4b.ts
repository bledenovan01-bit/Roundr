import {
  createFreeTimer,
  defaultConfig,
  advanceFree,
  buildSteps,
} from "../src/domain/free-timer";
import {
  configFromDraft,
  initialFreeDraft,
} from "../src/domain/free-configuration";
import {
  freeCommand,
  changeFreeScore,
  freeStationaryTap,
  freeTransition,
  freeReadout,
  freeStage,
  freeSwipe,
  freeViews,
  freeTimeNotice,
} from "../src/features/free-live-state";
import {
  validFreeTimer,
  restoreFreeTimer,
} from "../src/store/free-timer-validation";
const builtin = (
  process as unknown as { getBuiltinModule: (id: string) => any }
).getBuiltinModule;
const assert = builtin("assert/strict"),
  req = builtin("module").createRequire(process.argv[1]);
const base = 1700000000000;
let sw = createFreeTimer(defaultConfig("stopwatch"));
sw.createdAt = base;
assert.equal(freeStage(sw), "ready");
sw = freeCommand(sw, "toggle", base);
assert.equal(freeStage(sw), "running");
sw = freeCommand(sw, "lap", base + 12340);
sw = freeCommand(sw, "lap", base + 20450);
sw = freeCommand(sw, "toggle", base + 34560);
assert.equal(freeReadout(sw, base + 100000).main, "00:34");
assert.equal(freeReadout(sw, base).cents, ".56");
assert.deepEqual(sw.laps, [12340, 20450]);
const old = JSON.stringify(sw);
const reset = freeCommand(sw, "reset", base + 99999);
assert.deepEqual(reset.laps, []);
assert.equal(freeStage(reset), "ready");
assert.equal(reset.running, false);
assert.equal(JSON.stringify(sw), old);
sw.score = [2, 3];
assert.deepEqual(freeCommand(sw, "reset", base).score, [2, 3]);
assert.deepEqual(freeCommand(sw, "restart", base).score, [0, 0]);
assert.deepEqual(freeCommand(sw, "relaunch", base).score, [2, 3]);
assert(freeCommand(sw, "relaunch", base).running);
const hours = freeReadout({ ...sw, stepAccumulatedMs: 3723450 }, base);
assert.equal(hours.main, "1:02:03");
assert.equal(hours.cents, ".45");
for (const view of freeViews) {
  const state = {
    ...sw,
    ui: { view, elapsed: true, started: true, name: "Chrono enregistré" },
  };
  assert(validFreeTimer(state));
  const restored = restoreFreeTimer(JSON.parse(JSON.stringify(state))).value!;
  assert.equal(restored.ui?.view, view);
  assert.equal(restored.ui?.elapsed, true);
  assert.deepEqual(restored.laps, sw.laps);
}
for (const ui of [
  { view: "music" },
  { elapsed: 1 },
  { started: "yes" },
  { name: 3 },
  null,
])
  assert(!validFreeTimer({ ...sw, ui }));
assert(freeStationaryTap({ x: 100, y: 100 }, { x: 103, y: 104 }));
assert(!freeStationaryTap({ x: 300, y: 250 }, { x: 80, y: 250 }));
assert(!freeStationaryTap({ x: 100, y: 100 }, { x: 100, y: 130 }));
assert(freeStationaryTap(null, { x: 0, y: 0 }));
assert.equal(freeSwipe(-80, 5), 1);
assert.equal(freeSwipe(80, 5), -1);
assert.equal(freeSwipe(10, 1), 0);
assert.equal(freeSwipe(80, 100), 0);
assert.equal(freeSwipe(0, 100), 0);
let cd = createFreeTimer({
  ...defaultConfig("countdown"),
  kind: "countdown",
  durationMs: 90000,
  endSignal: true,
});
cd = freeCommand(cd, "toggle", base);
assert.equal(freeTimeNotice(cd, base + 30000)?.text, "Plus qu'1 minute !");
assert.equal(
  freeTimeNotice(cd, base + 60000)?.text,
  "Fin du compte à rebours dans 30 secondes !",
);
assert.equal(freeTimeNotice(cd, base + 70000), null);
assert.equal(freeReadout(cd, base + 15000).main, "01:15");
assert.equal(
  freeReadout({ ...cd, ui: { elapsed: true } }, base + 15000).main,
  "00:15",
);
const end = advanceFree(cd, base + 120000);
assert.equal(end.finished, true);
assert.equal(end.running, false);
assert.equal(freeReadout(end, base + 120000).main, "00:00");
assert(validFreeTimer(end));
for (const auto of [true, false])
  for (const count of [1, 2, 5, 12]) {
    const cfg = configFromDraft({
      ...initialFreeDraft(),
      kind: "interval",
      periods: Array.from({ length: count }, (_, i) => 5 + i * 5),
      rest: 5,
      reps: 2,
      repRest: 10,
      auto,
    });
    let ft = createFreeTimer(cfg),
      time = base;
    ft = freeCommand(ft, "toggle", time);
    for (let i = 0; i < ft.steps.length; i++) {
      const d = ft.steps[i].durationMs!;
      time += d;
      ft = advanceFree(ft, time);
      assert(validFreeTimer(ft, time));
      if (i === ft.steps.length - 1) {
        assert(ft.finished);
        break;
      }
      if (!auto) {
        assert.equal(freeStage(ft), "waiting");
        assert(!ft.running);
        ft = freeCommand(ft, "next", time);
        assert(ft.running);
        assert.equal(ft.stepIndex, i + 1);
      } else assert.equal(ft.stepIndex, i + 1);
    }
    assert.equal(freeStage(ft), "ended");
    assert.deepEqual(freeCommand(ft, "restart", time).steps, buildSteps(cfg));
  }
let manual = createFreeTimer(
  configFromDraft({
    ...initialFreeDraft(),
    kind: "interval",
    periods: [5, 10],
    rest: 0,
    reps: 1,
    auto: false,
  }),
);
manual = freeCommand(manual, "toggle", base);
manual = freeCommand(manual, "skip", base + 2000);
assert.equal(freeStage(manual), "waiting");
assert.equal(manual.stepIndex, 0);
manual = freeCommand(manual, "toggle", base + 5000);
assert.equal(manual.stepIndex, 1);
assert.equal(manual.running, true);
assert.equal(
  freeTransition(
    {
      ...manual,
      stepIndex: 0,
      running: false,
      stepAccumulatedMs: 5000,
      stepStartedAt: 0,
    },
    manual,
  ),
  "step",
);
assert.equal(
  freeTransition(manual, freeCommand(manual, "reset", base + 6000)),
  null,
);
assert.equal(freeTransition(manual, advanceFree(manual, base + 20000)), "end");
const scoredReady = createFreeTimer(
  configFromDraft({
    ...initialFreeDraft(),
    kind: "stopwatch",
    teamsOn: true,
    teamCount: 8,
  }),
);
assert.equal(changeFreeScore(scoredReady, 0, 1), scoredReady);
const scored = freeCommand(scoredReady, "toggle", base);
assert.equal(changeFreeScore(scored, 7, 1).score[7], 1);
assert.equal(changeFreeScore(scored, 7, -1).score[7], 0);
assert.equal(changeFreeScore(scored, 8, 1), scored);
assert.equal(
  changeFreeScore(
    { ...scored, config: { ...scored.config, scoreOn: false } },
    0,
    1,
  ).score[0],
  0,
);
console.log(
  "✓ FreeLive: three persisted views, elapsed/remaining, hours/centiseconds, laps, confirmations candidates, reset/restart/relaunch scores, gestures, countdown thresholds, interrupts and 1–12 variable intervals (manual/auto)",
);
const memory = new Map<string, string>();
let fail = false;
(globalThis as any).__roundrTestModules = {
  "@react-native-async-storage/async-storage": {
    async getAllKeys() {
      return [...memory.keys()];
    },
    async getItem(k: string) {
      return memory.get(k) ?? null;
    },
    async setItem(k: string, v: string) {
      if (fail) throw Error("write refused");
      memory.set(k, v);
    },
    async removeItem(k: string) {
      memory.delete(k);
    },
  },
  react: {
    useSyncExternalStore(_subscribe: unknown, snapshot: () => unknown) {
      return snapshot();
    },
  },
  "react-native": {},
  "expo-keep-awake": {},
  "@/src/audio/sounds": { async playSound() {} },
  "@/src/haptics": { async selectionAsync() {} },
};
const runtime = req(
  "../src/components/free-timer-runtime",
) as typeof import("../src/components/free-timer-runtime");
runtime.updateFreeNotice(cd, base + 30000);
assert.equal(runtime.getFreeNotice()?.until, base + 34500);
runtime.updateFreeNotice(cd, base + 34499);
assert(runtime.getFreeNotice());
runtime.updateFreeNotice(cd, base + 34500);
assert.equal(runtime.getFreeNotice(), null);
runtime.updateFreeNotice(cd, base + 34600);
assert.equal(runtime.getFreeNotice(), null);
runtime.updateFreeNotice({ ...cd, createdAt: cd.createdAt + 1 }, base + 60000);
assert(runtime.getFreeNotice());
runtime.updateFreeNotice(sw, base + 60001);
assert.equal(runtime.getFreeNotice(), null);
console.log(
  "✓ Non-blocking time notice expires at 4500 ms, cannot replay after expiry, and never leaks to another session",
);
const fresh = () => {
  delete req.cache[req.resolve("../src/store/session-store")];
  return req(
    "../src/store/session-store",
  ) as typeof import("../src/store/session-store");
};
async function storage() {
  const requests: { tag: string; resolve: () => void; reject: () => void }[] = [], releases: string[] = [];
  Object.assign((globalThis as any).__roundrTestModules["expo-keep-awake"], {
    activateKeepAwakeAsync(tag: string) {
      return new Promise<void>((resolve, reject) => requests.push({ tag, resolve, reject: () => reject(Error("unavailable")) }));
    },
    async deactivateKeepAwake(tag: string) { releases.push(tag); },
  });
  const { acquireRuntimeKeepAwake: lease } = req("../src/hooks/use-runtime-keep-awake") as typeof import("../src/hooks/use-runtime-keep-awake");
  const settle = async () => { for (let i = 0; i < 5; i++) await Promise.resolve(); };
  assert.equal(lease(false, "roundr-free"), undefined);
  assert.equal(requests.length, 0, "Disabled keep-awake must not request or release a lock");
  const stop = lease(true, "roundr-free")!;
  stop(); stop(); await settle();
  assert.deepEqual(releases, [], "Cleanup must wait for its own acquisition");
  requests[0].resolve(); await settle();
  assert.deepEqual(releases, [requests[0].tag], "Late acquisition is released exactly once");
  const unavailable = lease(true, "roundr-free")!;
  requests[1].reject(); unavailable(); await settle();
  assert.equal(releases.length, 1, "Rejected acquisition must never be released");
  const first = lease(true, "roundr-match")!, second = lease(true, "roundr-match")!;
  assert.notEqual(requests[2].tag, requests[3].tag, "Rapid effects must not share lock ownership");
  first(); requests[3].resolve(); requests[2].resolve(); await settle();
  assert.deepEqual(releases, [requests[0].tag, requests[2].tag], "Old cleanup must not release the newer lock");
  second(); await settle();
  assert.equal(releases[2], requests[3].tag);
  console.log("✓ Screen locks: disabled, late acquisition, denial, single cleanup and concurrent ownership");
  let st = fresh();
  await st.loadStore();
  let ft = createFreeTimer(
    configFromDraft({
      ...initialFreeDraft(),
      kind: "stopwatch",
      teamsOn: true,
      teamCount: 8,
    }),
  );
  ft = {
    ...freeCommand(ft, "toggle", Date.now()),
    ui: { view: "analog", elapsed: false, started: true },
    laps: [],
    score: [1, 2, 3, 4, 5, 6, 7, 8],
  };
  assert(await st.replaceFreeTimer(ft, null));
  st.setFreeTimer(
    freeCommand(st.getStoreState().freeTimer!, "lap", Date.now() + 1000),
  );
  await st.flushStorage();
  st = fresh();
  await st.loadStore();
  const before = st.getStoreState().freeTimer!;
  assert.equal(before.ui?.view, "analog");
  assert.equal(before.score[7], 8);
  assert.equal(before.laps.length, 1);
  const raw = memory.get("roundr.free-timer.v1");
  for (const action of ["reset", "restart", "end"] as const) {
    const candidate =
      action === "end" ? null : freeCommand(before, action, Date.now());
    assert.equal(st.getStoreState().freeTimer, before);
    assert.equal(memory.get("roundr.free-timer.v1"), raw);
    fail = true;
    assert.equal(await st.replaceFreeTimer(candidate, before), false);
    assert.equal(st.getStoreState().freeTimer, before);
    assert.equal(memory.get("roundr.free-timer.v1"), raw);
    assert(st.getStoreState().saveError);
    fail = false;
    await st.retryStorage();
    assert.equal(st.getStoreState().freeTimer, before);
  }
  assert(
    await st.replaceFreeTimer(freeCommand(before, "reset", Date.now()), before),
  );
  await st.flushStorage();
  assert.deepEqual(
    st.getStoreState().freeTimer!.score,
    [1, 2, 3, 4, 5, 6, 7, 8],
  );
  assert.equal(st.getStoreState().freeTimer!.ui?.view, "analog");
  assert.equal(st.getStoreState().freeTimer!.laps.length, 0);
  const rejectedRaw = JSON.stringify({
    ...st.getStoreState().freeTimer!,
    ui: { view: "music" },
  });
  memory.set("roundr.free-timer.v1", rejectedRaw);
  st = fresh();
  await st.loadStore();
  assert.equal(st.getStoreState().freeTimer, null);
  assert.equal(memory.get("roundr.free-timer.v1"), rejectedRaw);
  assert(st.getStoreState().saveError);
  console.log(
    "✓ FreeLive storage: view, eight scores and laps restored; rejected destructive commands preserve exact previous session and durable bytes; generic retry cannot apply them later",
  );
}
void storage().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});

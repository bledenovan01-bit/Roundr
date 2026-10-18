import { defaultConfig, defaultTeams } from "../src/domain/defaults";
import * as Session from "../src/domain/session";
import * as Free from "../src/domain/free-timer";
import { restoreFreeTimer, validFreeTimer } from "../src/store/free-timer-validation";

const K = { old: "roundr.presets.v1", presets: "roundr.free-presets.v1", marker: "roundr.free-presets.migrated.v1", timer: "roundr.free-timer.v1", session: "roundr.session.v1", summary: "roundr.summary.v1" };
const legacy = (id = "legacy") => ({ id, name: "Ancien " + id, config: defaultConfig("custom"), teams: null, createdAt: 1 });
const preset = (id = "user") => ({ id, name: "Mon chrono", config: Free.defaultConfig("countdown"), createdAt: 2 });
const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));
// Expo deliberately excludes Node's ambient types. The test runner is Node 22+.
const builtin = (process as unknown as { getBuiltinModule: (id: string) => any }).getBuiltinModule;
const assert = builtin("assert/strict");
const testRequire = builtin("module").createRequire(process.argv[1]) as {
  (id: string): unknown; cache: Record<string, unknown>; resolve: (id: string) => string;
};
function deferred() { let release!: () => void; const promise = new Promise<void>(resolve => { release = resolve; }); return { promise, release }; }
type Button = { text: string; style?: string; onPress?: () => void };
function fixture(memory = new Map<string, string>()) {
  const failedReads = new Set<string>(), failedWrites = new Set<string>();
  const reads: string[] = [], writes: string[] = [], dialogs: Button[][] = [];
  let readGate: Promise<void> | null = null, writeGate: Promise<void> | null = null;
  const keyGates = new Map<string, Promise<void>>(), writeWaiters = new Map<string, () => void>();
  let concurrent = 0, maximum = 0;
  const storage = {
    async getAllKeys() { return [...memory.keys()]; },
    async getItem(key: string) {
      reads.push(key); if (readGate) await readGate;
      if (failedReads.has(key)) throw Error("read failed");
      return memory.get(key) ?? null;
    },
    async setItem(key: string, value: string) {
      concurrent++; maximum = Math.max(maximum, concurrent);
      try {
        writeWaiters.get(key)?.();
        if (keyGates.has(key)) await keyGates.get(key);
        if (writeGate) await writeGate;
        if (failedWrites.has(key)) throw Error("write failed");
        memory.set(key, value); writes.push(key);
      } finally { concurrent--; }
    },
    async removeItem(key: string) {
      concurrent++; maximum = Math.max(maximum, concurrent);
      try {
        if (writeGate) await writeGate;
        if (failedWrites.has(key)) throw Error("remove failed");
        memory.delete(key); writes.push(key);
      } finally { concurrent--; }
    },
  };
  (globalThis as any).__roundrTestModules = {
    "@react-native-async-storage/async-storage": storage,
    react: { useSyncExternalStore() {} },
    "@/src/audio/sounds": { async playSound() {} },
    "@/src/haptics": { async selectionAsync() {} },
    "@/src/alert": { Alert: { alert(_title: string, _message: string, buttons: Button[]) { dialogs.push(buttons ?? []); } } },
  };
  delete testRequire.cache[testRequire.resolve("../src/store/session-store")];
  delete testRequire.cache[testRequire.resolve("../src/features/prepare-free-timer")];
  const store = testRequire("../src/store/session-store") as typeof import("../src/store/session-store");
  const prepare = testRequire("../src/features/prepare-free-timer") as typeof import("../src/features/prepare-free-timer");
  return { memory, store, prepare, failedReads, failedWrites, reads, writes, dialogs, max: () => maximum,
    pauseReads: (gate: Promise<void> | null) => { readGate = gate; }, pauseWrites: (gate: Promise<void> | null) => { writeGate = gate; },
    pauseWriteKey: (key: string, gate: Promise<void>) => { keyGates.set(key, gate); },
    watchWrite: (key: string) => new Promise<void>(resolve => { writeWaiters.set(key, resolve); }) };
}
const tests: [string, () => void | Promise<void>][] = [];
const test = (name: string, run: () => void | Promise<void>) => tests.push([name, run]);
const sourceMemory = () => new Map([[K.old, JSON.stringify([legacy()])]]);

test("data-write failure never completes migration; retry succeeds", async () => {
  const f = fixture(sourceMemory()); f.failedWrites.add(K.presets);
  await f.store.loadStore(); await f.store.flushStorage();
  assert.equal(f.memory.has(K.marker), false); assert(f.store.getStoreState().saveError);
  f.failedWrites.clear(); await f.store.retryStorage();
  assert.equal(JSON.parse(f.memory.get(K.marker)!).version, 2);
  assert.equal(JSON.parse(f.memory.get(K.presets)!).length, 1);
  assert.equal(f.store.getStoreState().saveError, null);
});
test("marker failure / interruption: restart merges without duplicate or edit loss", async () => {
  const memory = sourceMemory(); const f = fixture(memory); f.failedWrites.add(K.marker);
  await f.store.loadStore(); await f.store.flushStorage();
  assert.equal(memory.has(K.marker), false); assert.equal(JSON.parse(memory.get(K.presets)!).length, 1);
  const edited = { ...f.store.getStoreState().freePresets[0], name: "Renommé", config: { ...Free.defaultConfig("countdown"), durationMs: 9000 } };
  await f.store.saveFreePreset(edited); await f.store.saveFreePreset(preset());
  const restarted = fixture(memory); await restarted.store.loadStore();
  assert.equal(restarted.store.getStoreState().freePresets.length, 2);
  assert.deepEqual(restarted.store.getStoreState().freePresets.find(p => p.id === edited.id), edited);
  assert.deepEqual(JSON.parse(memory.get(K.old)!), [legacy()]);
  assert(restarted.writes.indexOf(K.presets) < restarted.writes.indexOf(K.marker));
});
test("power-loss snapshot between durable data and marker resumes once", async () => {
  const f = fixture(sourceMemory()), gate = deferred(); f.pauseWriteKey(K.marker, gate.promise);
  const reached = f.watchWrite(K.marker), loading = f.store.loadStore(); await reached;
  const diskAtPowerLoss = new Map(f.memory);
  assert(diskAtPowerLoss.has(K.presets)); assert(!diskAtPowerLoss.has(K.marker));
  gate.release(); await loading;
  const restarted = fixture(diskAtPowerLoss); await restarted.store.loadStore();
  assert.equal(restarted.store.getStoreState().freePresets.length, 1);
  assert.equal(JSON.parse(diskAtPowerLoss.get(K.marker)!).version, 2);
});
test("legacy marker offers recovery; declining persists a tombstone", async () => {
  const memory = sourceMemory(); const marker = JSON.stringify({ at: 1, count: 1 }); memory.set(K.marker, marker);
  const f = fixture(memory); await f.store.loadStore();
  assert.equal(f.store.getStoreState().freePresets.length, 0);
  assert.equal(f.store.getStoreState().legacyRecovery!.length, 1);
  assert.equal(memory.get(K.marker), marker);
  assert.equal(await f.store.resolveLegacyRecovery(false), true);
  const next = fixture(memory); await next.store.loadStore();
  assert.equal(next.store.getStoreState().legacyRecovery, null);
  assert.equal(next.store.getStoreState().freePresets.length, 0);
});
test("explicit recovery preserves user presets and survives subsequent deletion", async () => {
  const memory = sourceMemory(); memory.set(K.marker, JSON.stringify({ at: 1, count: 1 }));
  memory.set(K.presets, JSON.stringify([preset()]));
  const f = fixture(memory); await f.store.loadStore();
  assert.equal(await f.store.resolveLegacyRecovery(true), true);
  assert.deepEqual(f.store.getStoreState().freePresets[0], preset());
  await f.store.deleteFreePreset("free-mig-legacy");
  const next = fixture(memory); await next.store.loadStore();
  assert.equal(next.store.getStoreState().freePresets.length, 1);
  assert.equal(next.store.getStoreState().legacyRecovery, null);
});
test("deletion cannot become an accidental reimport when the marker is still failing", async () => {
  const f = fixture(sourceMemory()); f.failedWrites.add(K.marker); await f.store.loadStore();
  assert.equal(await f.store.deleteFreePreset("free-mig-legacy"), false);
  assert.equal(JSON.parse(f.memory.get(K.presets)!).length, 1);
  assert.equal(f.store.getStoreState().freePresets.length, 1);
  f.failedWrites.clear(); assert.equal(await f.store.deleteFreePreset("free-mig-legacy"), true);
  const restarted = fixture(f.memory); await restarted.store.loadStore();
  assert.equal(restarted.store.getStoreState().freePresets.length, 0);
  assert.equal(restarted.store.getStoreState().legacyRecovery, null);
});
test("existing migrated edits are never overwritten", async () => {
  const memory = sourceMemory(); const edited = { ...preset("free-mig-legacy"), name: "Utilisateur" };
  memory.set(K.presets, JSON.stringify([edited]));
  const f = fixture(memory); await f.store.loadStore(); assert.deepEqual(f.store.getStoreState().freePresets, [edited]);
});
test("user edits during a recovery write survive the migration commit", async () => {
  const memory = sourceMemory(); memory.set(K.marker, JSON.stringify({ at: 1, count: 1 })); memory.set(K.presets, JSON.stringify([preset()]));
  const f = fixture(memory); await f.store.loadStore();
  const gate = deferred(); f.pauseWriteKey(K.presets, gate.promise); const reached = f.watchWrite(K.presets);
  const recovery = f.store.resolveLegacyRecovery(true); await reached;
  const edit = f.store.renameFreePreset("user", "Edited during recovery"); gate.release();
  await Promise.all([recovery, edit]); await f.store.flushStorage();
  assert.equal(JSON.parse(memory.get(K.presets)!).find((p: Free.FreeTimerPreset) => p.id === "user").name, "Edited during recovery");
});
test("missing data is empty, but unreadable / invalid lists cannot complete migration", async () => {
  const empty = fixture(); await empty.store.loadStore(); assert.equal(JSON.parse(empty.memory.get(K.marker)!).version, 2);
  for (const key of [K.old, K.presets, K.marker]) {
    const f = fixture(sourceMemory()); f.failedReads.add(key); await f.store.loadStore();
    assert.equal(f.memory.has(K.marker), false); assert(f.store.getStoreState().saveError);
    assert.equal(f.store.setFreeTimer(Free.createFreeTimer(Free.defaultConfig("stopwatch"))), true);
    await f.store.flushStorage(); assert(f.store.getStoreState().saveError);
  }
  for (const key of [K.old, K.presets]) {
    for (const raw of ["{bad", "null", "{}", JSON.stringify([preset(), preset()])]) {
      const f = fixture(sourceMemory()); f.memory.set(key, raw); await f.store.loadStore();
      assert.equal(f.memory.get(key), raw); assert.equal(f.memory.has(K.marker), false);
      assert.equal(await f.store.saveFreePreset(preset()), key !== K.presets);
      await f.store.flushStorage();
    }
  }
});
test("invalid marker is preserved and requires an explicit recovery decision", async () => {
  const f = fixture(sourceMemory()); f.memory.set(K.marker, "not-json"); await f.store.loadStore();
  assert.equal(f.memory.get(K.marker), "not-json"); assert.equal(f.store.getStoreState().legacyRecovery!.length, 1);
  assert.equal(f.memory.get(K.marker + ".corrupt"), "not-json");
  assert.equal(await f.store.resolveLegacyRecovery(true), true);
  assert.equal(f.store.getStoreState().saveError, null);
});
test("valid states retain times, laps, scores and current-version formats", async () => {
  const sw = { ...Free.createFreeTimer(Free.defaultConfig("stopwatch")), stepAccumulatedMs: 8000, laps: [3000, 8000], score: [3, 2] as [number, number] };
  const interval = Free.nextStep(Free.createFreeTimer({ ...Free.defaultConfig("interval"), reps: 1, sets: 1, autoChain: false } as Free.IntervalConfig), Date.now());
  for (const state of [sw, Free.createFreeTimer(Free.defaultConfig("countdown")), interval]) {
    assert.equal(validFreeTimer(state), true);
    const f = fixture(new Map([[K.timer, JSON.stringify(state)]])); await f.store.loadStore();
    assert.deepEqual(f.store.getStoreState().freeTimer, state); assert.equal(f.memory.get(K.timer), JSON.stringify(state));
  }
});
test("reject incomplete / incoherent states and retain every raw payload", async () => {
  const base = Free.createFreeTimer(Free.defaultConfig("stopwatch"));
  const invalid: unknown[] = [null, {}, { config: base.config, running: false }, { ...base, steps: [] }, { ...base, steps: [{ ...base.steps[0], type: "rest" }] },
    { ...base, stepIndex: -1 }, { ...base, stepIndex: 0.5 }, { ...base, stepIndex: 1 }, { ...base, stepAccumulatedMs: -1 },
    { ...base, stepAccumulatedMs: Infinity }, { ...base, stepStartedAt: 10 }, { ...base, createdAt: -1 },
    { ...base, running: true, finished: true }, { ...base, running: "yes" }, { ...base, finished: true },
    { ...base, laps: [2, 1], stepAccumulatedMs: 4 }, { ...base, laps: [5], stepAccumulatedMs: 4 }, { ...base, laps: null },
    { ...base, score: [0] }, { ...base, score: [1, -1] }, { ...base, score: [0.5, 0] },
    { ...base, config: { ...base.config, display: "bad" } }, { ...base, config: { ...Free.defaultConfig("interval"), reps: 1e20 } }];
  for (const value of invalid) {
    assert.equal(validFreeTimer(value), false);
    const raw = JSON.stringify(value); const f = fixture(new Map([[K.timer, raw]])); await f.store.loadStore();
    assert.equal(f.store.getStoreState().freeTimer, null); assert.equal(f.memory.get(K.timer), raw);
    assert.equal(f.memory.get(K.timer + ".corrupt"), raw); assert(f.store.getStoreState().saveError);
  }
  for (const raw of ["{bad", "undefined"]) {
    const f = fixture(new Map([[K.timer, raw]])); await f.store.loadStore(); assert.equal(f.memory.get(K.timer + ".corrupt"), raw);
  }
  const cd = Free.createFreeTimer(Free.defaultConfig("countdown"));
  assert.equal(validFreeTimer({ ...cd, laps: [1] }), false);
  assert.equal(validFreeTimer({ ...cd, stepAccumulatedMs: 700000 }), false);
});
test("only missing derived steps are repairable, never missing time / laps / scores", async () => {
  const original = { ...Free.createFreeTimer(Free.defaultConfig("stopwatch")), stepAccumulatedMs: 5, laps: [5], score: [1, 2] as [number, number] };
  const old: any = clone(original); delete old.steps;
  assert.deepEqual(restoreFreeTimer(old), { value: original, repaired: true });
  const f = fixture(new Map([[K.timer, JSON.stringify(old)]])); await f.store.loadStore();
  assert.deepEqual(JSON.parse(f.memory.get(K.timer)!), original); assert(f.store.getStoreState().storageInfo);
  for (const key of ["stepAccumulatedMs", "stepStartedAt", "laps", "score", "createdAt"]) { const bad = clone(old); delete bad[key]; assert.equal(restoreFreeTimer(bad).value, null); }
});
test("backup failure is truthful, blocks overwrite, retries and does not erase earlier raw copies", async () => {
  const f = fixture(new Map([[K.timer, "bad"]])); f.failedWrites.add(K.timer + ".corrupt"); await f.store.loadStore();
  assert(!f.memory.has(K.timer + ".corrupt")); assert(!f.store.getStoreState().saveError!.includes("conservée à part"));
  assert.equal(f.store.setFreeTimer(null), false); assert.equal(f.memory.get(K.timer), "bad");
  f.failedWrites.clear(); await f.store.retryStorage(); assert.equal(f.memory.get(K.timer + ".corrupt"), "bad");
  assert.equal(f.store.setFreeTimer(Free.createFreeTimer(Free.defaultConfig("stopwatch"))), true);
  await f.store.flushStorage(); assert.equal(f.store.getStoreState().saveError, null);
  f.memory.set(K.timer, "another bad value"); const second = fixture(f.memory); await second.store.loadStore();
  assert.equal(f.memory.get(K.timer + ".corrupt"), "bad"); assert([...f.memory.entries()].some(([k, v]) => k.startsWith(K.timer + ".corrupt.") && v === "another bad value"));
});
test("single-flight load and mutation gates protect pending reads", async () => {
  const state = Free.createFreeTimer(Free.defaultConfig("stopwatch")); state.score = [1, 2];
  const f = fixture(new Map([[K.timer, JSON.stringify(state)]])); const gate = deferred(); f.pauseReads(gate.promise);
  const first = f.store.loadStore(), second = f.store.loadStore(); assert.equal(first, second);
  assert.equal(f.store.setFreeTimer(null), false); assert.equal(await f.store.saveFreePreset(preset()), false);
  gate.release(); await first; assert.deepEqual(f.store.getStoreState().freeTimer, state);
  assert.equal(f.reads.filter(k => k === K.timer).length, 1); assert.equal(f.memory.get(K.timer), JSON.stringify(state));
});
test("read retry cannot replace subsequent edits to unrelated resources", async () => {
  const f = fixture(new Map([[K.presets, JSON.stringify([preset()])]])); f.failedReads.add(K.session); await f.store.loadStore();
  await f.store.renameFreePreset("user", "Edited after load"); f.failedReads.clear(); await f.store.retryStorage();
  assert.equal(f.store.getStoreState().freePresets[0].name, "Edited after load"); assert.equal(f.reads.filter(k => k === K.presets).length, 1);
});
test("failed timer reads block empty writes until a successful reread", async () => {
  const timer = { ...Free.createFreeTimer(Free.defaultConfig("stopwatch")), score: [4, 3] as [number, number] };
  const raw = JSON.stringify(timer); const f = fixture(new Map([[K.timer, raw]])); f.failedReads.add(K.timer);
  await f.store.loadStore(); assert.equal(f.store.setFreeTimer(null), false); assert.equal(f.memory.get(K.timer), raw);
  f.failedReads.clear(); await f.store.retryStorage(); assert.deepEqual(f.store.getStoreState().freeTimer, timer);
});
test("all new-timer kinds / preset configs guard cancel and confirm; pristine / finished skip dialog", async () => {
  const f = fixture(); await f.store.loadStore();
  const progressed = { ...Free.createFreeTimer(Free.defaultConfig("stopwatch")), stepAccumulatedMs: 12000, laps: [4000, 12000], score: [2, 1] as [number, number] };
  let navigation = 0;
  for (const config of [Free.defaultConfig("stopwatch"), Free.defaultConfig("countdown"), Free.defaultConfig("interval"), preset().config]) {
    f.store.setFreeTimer(clone(progressed)); await f.store.flushStorage(); const current = f.store.getStoreState().freeTimer, raw = f.memory.get(K.timer);
    f.prepare.prepareFreeTimer(config, () => { navigation++; });
    const buttons = f.dialogs.at(-1)!; buttons.find(b => b.style === "cancel")?.onPress?.();
    assert.equal(f.store.getStoreState().freeTimer, current); assert.equal(f.memory.get(K.timer), raw);
    buttons.find(b => b.style === "destructive")!.onPress!(); await f.store.flushStorage();
    assert.equal(f.store.getStoreState().freeTimer!.config.kind, config.kind); assert.deepEqual(f.store.getStoreState().freeTimer!.score, [0, 0]);
  }
  assert.equal(navigation, 4);
  f.store.setFreeTimer(Free.createFreeTimer(Free.defaultConfig("stopwatch"))); const count = f.dialogs.length;
  f.prepare.prepareFreeTimer(Free.defaultConfig("countdown"), () => { navigation++; }); assert.equal(f.dialogs.length, count);
  const cd = Free.startFree(Free.createFreeTimer(Free.defaultConfig("countdown")), 0);
  f.store.setFreeTimer(Free.advanceFree(cd, 700000));
  f.prepare.prepareFreeTimer(Free.defaultConfig("interval"), () => { navigation++; }); assert.equal(f.dialogs.length, count);
  await f.store.flushStorage();
});
test("a delayed confirmation never replaces a newer progressed session", async () => {
  const f = fixture(); await f.store.loadStore();
  f.store.setFreeTimer({ ...Free.createFreeTimer(Free.defaultConfig("stopwatch")), score: [1, 0] });
  f.prepare.prepareFreeTimer(Free.defaultConfig("countdown"), () => {}); const old = f.dialogs.at(-1)!;
  f.store.setFreeTimer({ ...Free.createFreeTimer(Free.defaultConfig("stopwatch")), score: [9, 0] }); const current = f.store.getStoreState().freeTimer;
  old.find(b => b.style === "destructive")!.onPress!(); assert.equal(f.store.getStoreState().freeTimer, current); assert.equal(f.dialogs.length, 2);
  await f.store.flushStorage();
});
test("failed replacement keeps the previous session and never navigates as if saved", async () => {
  const f = fixture(); await f.store.loadStore();
  const previous = { ...Free.createFreeTimer(Free.defaultConfig("stopwatch")), stepAccumulatedMs: 8000, laps: [4000, 8000], score: [3, 2] as [number, number] };
  f.store.setFreeTimer(previous); await f.store.flushStorage(); const raw = f.memory.get(K.timer);
  let navigation = 0; f.failedWrites.add(K.timer);
  f.prepare.prepareFreeTimer(Free.defaultConfig("countdown"), () => { navigation++; });
  await f.dialogs.at(-1)!.find(b => b.style === "destructive")!.onPress!();
  await f.store.flushStorage();
  assert.equal(navigation, 0, "navigation must await durable replacement");
  assert.deepEqual(f.store.getStoreState().freeTimer, previous);
  assert.equal(f.memory.get(K.timer), raw); assert(f.store.getStoreState().saveError);
  assert.equal(f.memory.get("roundr.free-timer.previous.v1"), raw);
  f.failedWrites.clear(); await f.store.retryStorage();
  assert.equal(navigation, 0); assert.deepEqual(f.store.getStoreState().freeTimer, previous);
  assert.equal(f.memory.get(K.timer), raw); assert.equal(f.store.getStoreState().saveError, null);
  const restarted = fixture(new Map(f.memory)); await restarted.store.loadStore();
  assert.deepEqual(restarted.store.getStoreState().freeTimer, previous);
});
test("replacement stays pending until durable write; concurrent actions cannot overwrite it", async () => {
  const f = fixture(); await f.store.loadStore();
  const previous = { ...Free.createFreeTimer(Free.defaultConfig("stopwatch")), score: [2, 1] as [number, number] };
  f.store.setFreeTimer(previous); await f.store.flushStorage();
  const gate = deferred(); f.pauseWriteKey(K.timer, gate.promise); const reached = f.watchWrite(K.timer);
  let navigation = 0; f.prepare.prepareFreeTimer(Free.defaultConfig("countdown"), () => { navigation++; });
  const confirmation = f.dialogs.at(-1)!.find(b => b.style === "destructive")!.onPress!(); await reached;
  assert.equal(navigation, 0); assert.equal(f.store.getStoreState().replacingFreeTimer, true);
  assert.deepEqual(f.store.getStoreState().freeTimer, previous);
  assert.deepEqual(JSON.parse(f.memory.get("roundr.free-timer.previous.v1")!), previous);
  assert.equal(f.store.setFreeTimer(null), false);
  assert.equal(await f.store.replaceFreeTimer(null, previous), false);
  gate.release(); await confirmation; await f.store.flushStorage();
  assert.equal(navigation, 1); assert.equal(f.store.getStoreState().replacingFreeTimer, false);
  assert.equal(f.store.getStoreState().freeTimer!.config.kind, "countdown");
});
test("failed backup prevents replacement; retrying backup never starts the candidate", async () => {
  const f = fixture(); await f.store.loadStore();
  const previous = { ...Free.createFreeTimer(Free.defaultConfig("stopwatch")), stepAccumulatedMs: 10, laps: [10] };
  f.store.setFreeTimer(previous); await f.store.flushStorage(); const writes = f.writes.filter(k => k === K.timer).length;
  f.failedWrites.add("roundr.free-timer.previous.v1");
  assert.equal(await f.store.replaceFreeTimer(Free.createFreeTimer(Free.defaultConfig("countdown")), previous), false);
  assert.equal(f.writes.filter(k => k === K.timer).length, writes);
  assert.deepEqual(f.store.getStoreState().freeTimer, previous); assert(f.store.getStoreState().saveError);
  f.failedWrites.clear(); await f.store.retryStorage();
  assert.deepEqual(f.store.getStoreState().freeTimer, previous);
  assert.equal(f.writes.filter(k => k === K.timer).length, writes);
});
test("failed destructive restart or finish retains time, laps and score", async () => {
  const f = fixture(); await f.store.loadStore();
  const previous = { ...Free.createFreeTimer(Free.defaultConfig("stopwatch")), stepAccumulatedMs: 8000, laps: [4000, 8000], score: [3, 2] as [number, number] };
  f.store.setFreeTimer(previous); await f.store.flushStorage(); const raw = f.memory.get(K.timer);
  f.failedWrites.add(K.timer);
  for (const candidate of [Free.resetTime(previous, Date.now()), Free.restartSession(previous), null]) {
    assert.equal(await f.store.replaceFreeTimer(candidate, previous), false);
    assert.deepEqual(f.store.getStoreState().freeTimer, previous); assert.equal(f.memory.get(K.timer), raw);
  }
  f.failedWrites.clear(); await f.store.retryStorage(); assert.equal(f.memory.get(K.timer), raw);
});
test("rapid writes / archive then new session preserve order; failed operations remain visible", async () => {
  const f = fixture(); await f.store.loadStore(); const gate = deferred(); f.pauseWrites(gate.promise);
  const a = f.store.saveFreePreset(preset("a")), b = f.store.saveFreePreset(preset("b"));
  gate.release(); await Promise.all([a, b]); assert.equal(f.max(), 1); assert.equal(JSON.parse(f.memory.get(K.presets)!).length, 2);
  const c = defaultConfig("classique"), teams = defaultTeams("classique", 2);
  const old = Session.createSession(c, teams, 1000); f.store.startSession(old); await f.store.flushStorage();
  f.failedWrites.add(K.summary); f.store.archiveSession(Session.endSession(old, 2000));
  const next = Session.createSession(c, teams, 3000); f.store.startSession(next); await f.store.flushStorage();
  assert.equal(JSON.parse(f.memory.get(K.session)!).id, next.id); assert(f.store.getStoreState().saveError);
  await f.store.saveFreePreset(preset("unrelated")); assert(f.store.getStoreState().saveError);
  f.failedWrites.clear(); await f.store.retryStorage();
  assert.equal(JSON.parse(f.memory.get(K.session)!).id, next.id); assert.equal(JSON.parse(f.memory.get(K.summary)!).id, old.id);
  assert.equal(f.store.getStoreState().saveError, null);
});
async function main() { for (const [name, run] of tests) { await run(); console.log("✓ " + name); } console.log(tests.length + " storage reliability scenarios passed"); }
main().catch(error => { console.error(error); process.exitCode = 1; });

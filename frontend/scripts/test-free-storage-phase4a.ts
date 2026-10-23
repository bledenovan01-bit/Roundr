import {
  createFreeTimer,
  defaultConfig,
  startFree,
} from "../src/domain/free-timer";
import {
  initialFreeDraft,
  configFromDraft,
} from "../src/domain/free-configuration";
const builtin = (
  process as unknown as { getBuiltinModule: (id: string) => any }
).getBuiltinModule;
const assert = builtin("assert/strict"),
  req = builtin("module").createRequire(process.argv[1]);
const memory = new Map<string, string>();
let fail = false,
  gate: Promise<void> | null = null;
let buttons: any[] = [];
const ftKey = "roundr.free-timer.v1",
  presetKey = "roundr.free-presets.v1";
(globalThis as any).__roundrTestModules = {
  "@react-native-async-storage/async-storage": {
    async getAllKeys() {
      return [...memory.keys()];
    },
    async getItem(k: string) {
      return memory.get(k) ?? null;
    },
    async setItem(k: string, v: string) {
      if (gate) await gate;
      if (fail) throw Error("write rejected");
      memory.set(k, v);
    },
    async removeItem(k: string) {
      memory.delete(k);
    },
  },
  "@/src/alert": {
    Alert: {
      alert(_title: string, _message: string, next: any[]) {
        buttons = next;
      },
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
async function run() {
  let st = fresh();
  await st.loadStore();
  const c = configFromDraft({
      ...initialFreeDraft(),
      kind: "interval",
      periods: [5, 10, 15],
      teamsOn: true,
      teamCount: 8,
    }),
    p = {
      id: "phase4a",
      name: "Fractionné",
      config: c,
      createdAt: 1700000000000,
    };
  const priorPresets = memory.get(presetKey);
  let release!: () => void;
  gate = new Promise<void>((r) => {
    release = r;
  });
  let acknowledged = false;
  const saving = st.saveFreePreset(p).then((ok) => {
    acknowledged = ok;
    return ok;
  });
  await Promise.resolve();
  assert.equal(acknowledged, false);
  assert.equal(
    st.getStoreState().freePresets.length,
    0,
    "Unconfirmed writes must not appear as saved chronos",
  );
  assert.equal(memory.get(presetKey), priorPresets);
  gate = null;
  release();
  assert(await saving);
  await st.flushStorage();
  const state = startFree(createFreeTimer(c), Date.now());
  state.score[7] = 4;
  assert(await st.replaceFreeTimer(state, null));
  await st.flushStorage();
  const activeRaw = memory.get(ftKey);
  assert(activeRaw);
  delete req.cache[req.resolve("../src/features/prepare-free-timer")];
  const guard4 = req("../src/features/prepare-free-timer").prepareFreeTimer;
  for (const kind of [
    "stopwatch",
    "countdown",
    "interval",
    "interval",
  ] as const) {
    let launched = false;
    guard4(configFromDraft({ ...initialFreeDraft(), kind }), () => {
      launched = true;
    });
    assert.equal(buttons[0].text, "Annuler");
    buttons[0].onPress?.();
    await st.flushStorage();
    assert.equal(launched, false);
    assert.equal(memory.get(ftKey), activeRaw);
    assert.deepEqual(st.getStoreState().freeTimer, state);
  }

  fail = true;
  assert.equal(await st.saveFreePreset({ ...p, name: "Échec" }), false);
  assert(st.getStoreState().saveError);
  assert.equal(memory.get(ftKey), activeRaw);
  assert.equal(
    JSON.parse(memory.get(presetKey)!).find((x: any) => x.id === p.id).name,
    p.name,
  );
  fail = false;
  await st.retryStorage();
  assert(st.getStoreState().saveError); // Retry of retained bytes is not acknowledgement of the rejected edit.
  assert.equal(st.getStoreState().freePresets[0].name, p.name);
  assert(
    await st.saveFreePreset({
      ...p,
      name: "Modifié",
      config: { ...c, scoreOn: false },
    }),
  );
  assert(await st.saveFreePreset({ ...p, id: "copy", name: "Copie" }));
  assert.equal(memory.get(ftKey), activeRaw);
  st = fresh();
  await st.loadStore();
  assert.equal(st.getStoreState().freeTimer!.score[7], 4);
  assert.equal(st.getStoreState().freeTimer!.config.kind, "interval");
  assert.equal(st.getStoreState().freePresets.length, 2);
  fail = true;
  assert.equal(await st.deleteFreePreset(p.id), false);
  assert.equal(st.getStoreState().freePresets.length, 2);
  fail = false;
  await st.retryStorage();
  assert.equal(st.getStoreState().freePresets.length, 2);
  assert(st.getStoreState().saveError);
  assert(await st.deleteFreePreset(p.id));
  assert.equal(st.getStoreState().saveError, null);
  assert.equal(memory.get(ftKey), activeRaw);
  // Old running timer/presets are accepted byte-for-byte, without adding periods/teams.
  memory.clear();
  const old = createFreeTimer(defaultConfig("interval"));
  const raw = JSON.stringify(old),
    legacyPreset = JSON.stringify([{ ...p, config: old.config }]);
  memory.set(ftKey, raw);
  memory.set(presetKey, legacyPreset);
  st = fresh();
  await st.loadStore();
  await st.flushStorage();
  assert.equal(memory.get(ftKey), raw);
  assert.equal(memory.get(presetKey), legacyPreset);
  assert.equal(
    (st.getStoreState().freeTimer!.config as any).periodsMs,
    undefined,
  );
  // Incompatible new data stays raw and cannot silently replace a saved state.
  memory.clear();
  const invalid = JSON.stringify({ ...state, score: [0, 0] });
  memory.set(ftKey, invalid);
  st = fresh();
  await st.loadStore();
  assert.equal(st.getStoreState().freeTimer, null);
  assert.equal(memory.get(ftKey), invalid);
  assert(st.getStoreState().saveError);
  delete req.cache[req.resolve("../src/features/prepare-free-timer")];
  const prepare = req("../src/features/prepare-free-timer").prepareFreeTimer;
  let ready = false;
  prepare(c, () => {
    ready = true;
  });
  assert.equal(buttons[0].text, "Annuler");
  assert.equal(ready, false);
  buttons[0].onPress?.();
  await st.flushStorage();
  assert.equal(memory.get(ftKey), invalid);
  await buttons[1].onPress();
  assert.equal(ready, true);
  assert([...memory.entries()].some(([k, v]) => k !== ftKey && v === invalid));
  console.log(
    "✓ Phase4A: actual durable acknowledgement, failed save/retry, edit/save-as-new/delete never changes active session; eight scores restored",
  );
  console.log(
    "✓ Legacy bytes retained without conversion; incompatible new scores preserved raw, restoration refused visibly, explicit recovery cancellation/confirmation preserves original backup",
  );
}
void run().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});

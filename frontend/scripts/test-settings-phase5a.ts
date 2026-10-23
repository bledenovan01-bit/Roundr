import {
  settingsReturn,
  settingsRotation,
  settingsSessionLabel,
  settingsFreeLabel,
} from "../src/features/settings-state";
import { createSession } from "../src/domain/session";
import { defaultConfig, defaultTeams } from "../src/domain/defaults";
import {
  createFreeTimer,
  defaultConfig as freeConfig,
} from "../src/domain/free-timer";
import type { MaracanaConfig } from "../src/domain/types";
const builtin = (
  process as unknown as { getBuiltinModule: (id: string) => any }
).getBuiltinModule;
const assert = builtin("assert/strict"),
  req = builtin("module").createRequire(process.argv[1]);
const config = {
  ...defaultConfig("maracana"),
  teamCount: 4,
  rotation: "classic",
} as MaracanaConfig;
const session = createSession(config, defaultTeams("maracana", 4), 1000);
const before = JSON.stringify(session),
  free = createFreeTimer(freeConfig("stopwatch"));
assert.equal(settingsReturn(undefined, session, free), null);
assert.equal(settingsReturn("free", session, free), "/chrono-libre/run");
assert.equal(settingsReturn("match", session, free), "/live");
assert.equal(settingsReturn("free", session, null), null);
assert.equal(
  settingsReturn("match", { ...session, status: "finished" }, free),
  null,
);
assert.equal(settingsReturn(["free"], session, free), null);
const next = settingsRotation(session, { rotation: "winnerStays" });
assert.equal(
  next.config.mode === "maracana" && next.config.rotation,
  "winnerStays",
);
assert.strictEqual(next.live, session.live);
assert.strictEqual(next.matches, session.matches);
assert.strictEqual(next.maracana, session.maracana);
assert.strictEqual(next.preFinish, session.preFinish);
assert.strictEqual(next.pendingLaunch, session.pendingLaunch);
assert.equal(JSON.stringify(session), before);
const draw = settingsRotation(next, { drawRule4: "bothLeave" });
assert.equal(
  draw.config.mode === "maracana" && draw.config.drawRule4,
  "bothLeave",
);
assert.strictEqual(
  settingsRotation(session, { drawRule4: "bothLeave" }),
  session,
);
const three = { ...next, teams: next.teams.slice(0, 3) };
assert.strictEqual(settingsRotation(three, { drawRule4: "bothLeave" }), three);
const finished = { ...next, status: "finished" as const };
assert.strictEqual(
  settingsRotation(finished, { rotation: "classic" }),
  finished,
);
const classic = createSession(
  defaultConfig("classique"),
  defaultTeams("classique", 2),
  1000,
);
assert.strictEqual(
  settingsRotation(classic, { rotation: "winnerStays" }),
  classic,
);

assert.equal(settingsSessionLabel(session), "Maracana · 4 équipes · 8 min");
assert.equal(settingsFreeLabel(free), "Chrono libre · Chronomètre · sans limite");
assert.equal(settingsFreeLabel({...free,ui:{name:"Fractionné"}}), "Fractionné · Chronomètre");
async function run() {
  const raw = new Map<string, string>(),
    key = "roundr.preferences.v1";
  let fail = false;
  (globalThis as any).__roundrTestModules = {
    react: { useSyncExternalStore() {} },
    "@react-native-async-storage/async-storage": {
      async getItem(k: string) {
        return raw.get(k) ?? null;
      },
      async setItem(k: string, v: string) {
        if (fail) throw Error("write");
        raw.set(k, v);
      },
    },
  };
  function reload() {
    delete req.cache[req.resolve("../src/store/preferences")];
    return req(
      "../src/store/preferences",
    ) as typeof import("../src/store/preferences");
  }
  let prefs = reload();
  await prefs.loadPreferences();
  await prefs.setPreferences({
    sounds: false,
    vibrations: false,
    keepAwake: true,
    volume: 0.35,
    startSound: "gong",
    preparation: false,
    additional: false,
  });
  prefs = reload();
  await prefs.loadPreferences();
  const p = prefs.getPreferences();
  for (const [k, v] of Object.entries({
    sounds: false,
    vibrations: false,
    keepAwake: true,
    volume: 0.35,
    startSound: "gong",
    preparation: false,
    additional: false,
  }))
    assert.equal((p as any)[k], v);
  const saved = raw.get(key);
  fail = true;
  await prefs.setPreferences({ volume: 0.8 });
  assert(prefs.getPreferences().error);
  assert.equal(raw.get(key), saved);
  await prefs.flushPreferences();
  assert(prefs.getPreferences().error);
  fail = false;
  await prefs.setPreferences({ volume: 0.8 });
  assert.equal(prefs.getPreferences().error, null);
  await Promise.all([
    prefs.setPreferences({ sounds: true }),
    prefs.setPreferences({ vibrations: true }),
    prefs.setPreferences({ keepAwake: false }),
  ]);
  prefs = reload();
  await prefs.loadPreferences();
  assert(prefs.getPreferences().sounds && prefs.getPreferences().vibrations);
  assert.equal(prefs.getPreferences().keepAwake, false);
  raw.set(key, "{invalid");
  prefs = reload();
  await prefs.loadPreferences();
  await prefs.setPreferences({ sounds: true });
  assert.equal(raw.get(key), "{invalid");
  assert(prefs.getPreferences().error);
  console.log(
    "✓ Settings entry targets, future-only Maracana policy, durable native preferences, errors and invalid raw preservation",
  );
}
run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

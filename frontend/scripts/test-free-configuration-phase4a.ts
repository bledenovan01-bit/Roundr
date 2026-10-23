import {
  buildSteps,
  createFreeTimer,
  defaultConfig,
  startFree,
  advanceFree,
  nextStep,
  restartSession,
  validFreeConfig,
} from "../src/domain/free-timer";
import {
  initialFreeDraft,
  configFromDraft,
  draftFromConfig,
  freeConfigSummary,
} from "../src/domain/free-configuration";
import {
  validFreeTimer,
  restoreFreeTimer,
} from "../src/store/free-timer-validation";
const builtin = (
  process as unknown as { getBuiltinModule: (id: string) => any }
).getBuiltinModule;
const assert = builtin("assert/strict"),
  req = builtin("module").createRequire(process.argv[1]),
  R = req("./free-reference.cjs");
const now = 1700000000000;
assert.deepEqual(
  buildSteps(
    configFromDraft({
      ...initialFreeDraft(),
      kind: "interval",
      periods: [5, 10],
      rest: 0,
      reps: 1,
    }),
  ).map((s) => s.durationMs),
  [5000, 10000],
  "Each configured period must retain its own duration",
);
for (const periods of [
  [30],
  [20],
  [600, 600, 600, 600],
  [5, 30, 60],
  Array.from({ length: 12 }, (_, i) => 5 + i * 5),
])
  for (const reps of [1, 2, 20])
    for (const rest of [0, 30])
      for (const repRest of [0, 60]) {
        const d = {
          ...initialFreeDraft(),
          kind: "interval" as const,
          periods,
          reps,
          rest,
          repRest,
        };
        const c = configFromDraft(d);
        assert(validFreeConfig(c));
        const native = buildSteps(c),
          ref = R.segments({ iv: { periods, reps, rest, repRest } });
        assert.deepEqual(
          native.map((s) => ({
            kind: s.type === "work" ? "work" : "rest",
            sec: s.durationMs! / 1000,
            label: s.label,
            rep: s.set,
          })),
          ref,
        );
        assert.equal(
          freeConfigSummary(c),
          R.summary({
            kind: "intervals",
            iv: { periods, reps, rest, repRest },
            teamsOn: false,
          }),
        );
        let f = startFree(createFreeTimer(c), now);
        f = advanceFree(f, now + native.reduce((n, s) => n + s.durationMs!, 0));
        assert(f.finished);
        assert(validFreeTimer(f));
      }
const manual = configFromDraft({
  ...initialFreeDraft(),
  kind: "interval",
  periods: [5, 10],
  reps: 2,
  rest: 5,
  repRest: 15,
  auto: false,
});
let f = startFree(createFreeTimer(manual), now);
f = advanceFree(f, now + 999999);
assert.equal(f.stepIndex, 0);
assert.equal(f.stepAccumulatedMs, 5000);
assert.equal(f.running, false);
f = nextStep(f, now + 999999);
assert.equal(f.stepIndex, 1);
assert.equal(f.running, false);
assert(validFreeTimer(f));
const old = {
  ...defaultConfig("interval"),
  kind: "interval" as const,
  display: "circular" as const,
  sounds: false,
  workMs: 30000,
  restMs: 10000,
  reps: 8,
  sets: 2,
  restBetweenSetsMs: 60000,
  autoChain: true,
  endSignal: true,
};
const original = JSON.stringify(old),
  oldState = createFreeTimer(old),
  oldRaw = JSON.stringify(oldState);
assert.equal(buildSteps(old).length, 31);
assert.equal(buildSteps(old)[0].label, "Effort");
const edited = draftFromConfig(old),
  converted = configFromDraft(edited);
assert.equal(converted.display, old.display);
assert.equal(converted.sounds, old.sounds);
assert.deepEqual(
  buildSteps(converted).map((s) => s.durationMs),
  buildSteps(old).map((s) => s.durationMs),
);
assert.equal(JSON.stringify(old), original);
assert.equal(JSON.stringify(restoreFreeTimer(oldState).value), oldRaw);
const exceptional = { ...old, reps: 13, workMs: 1000 };
assert.deepEqual(
  configFromDraft(draftFromConfig(exceptional)).kind,
  "interval",
);
assert.deepEqual(
  buildSteps(configFromDraft(draftFromConfig(exceptional))).map(
    (s) => s.durationMs,
  ),
  buildSteps(exceptional).map((s) => s.durationMs),
);
for (const n of [2, 3, 8]) {
  const d = { ...initialFreeDraft(), teamsOn: true, teamCount: n };
  const c = configFromDraft(d),
    state = createFreeTimer(c);
  assert.equal(state.score.length, n);
  assert(validFreeTimer(state));
  state.score[n - 1] = 9;
  assert(validFreeTimer(state));
  assert.equal(JSON.parse(JSON.stringify(state)).score[n - 1], 9);
  assert.deepEqual(restartSession(state).score, Array(n).fill(0));
  assert(!validFreeTimer({ ...state, score: [0] }));
  assert(!validFreeConfig({ ...c, teams: [c.teams![0], c.teams![0]] }));
  assert(!validFreeConfig({ ...c, scoreOn: "yes" }));
  const before = c.teams![0].name;
  state.config.teams![0].name = "Session";
  assert.equal(c.teams![0].name, before);
}
const laps = createFreeTimer(configFromDraft(initialFreeDraft()));
laps.laps = [1000, 2000];
laps.stepAccumulatedMs = 2000;
assert(validFreeTimer(laps));
assert.deepEqual(
  restoreFreeTimer(JSON.parse(JSON.stringify(laps))).value?.laps,
  [1000, 2000],
);
const invalids = [
  { ...manual, periodsMs: [] },
  { ...manual, periodsMs: Array(13).fill(5000) },
  { ...manual, periodsMs: [NaN, 10000] },
  { ...manual, sets: 21 },
];
invalids.forEach((c) => assert(!validFreeConfig(c)));
assert(
  !validFreeConfig(
    configFromDraft({
      ...initialFreeDraft(),
      kind: "countdown",
      cd: { h: 0, m: 0, s: 0 },
    }),
  ),
);
console.log(
  "✓ Frozen Lovable interval oracle: 60 programs, 1–12 individual periods, rests/series, summaries, timestamp completion and manual chaining",
);
console.log(
  "✓ Legacy intervals/sessions unchanged; explicit editor adaptation preserves every duration; exceptional legacy configurations remain launchable",
);
console.log(
  "✓ Teams 2–8, independent scores, cloned configurations, laps, restoration and invalid configurations",
);

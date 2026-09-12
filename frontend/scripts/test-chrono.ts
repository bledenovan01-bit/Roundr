// Quick sanity check of the pure engine. Run with:
//   npx tsx /app/frontend/scripts/test-chrono.ts
// Not part of the app bundle.

import {
  chronoReducer,
  elapsedMs,
  hasReachedTarget,
  initialChronoState,
  remainingMs,
} from "../src/chrono/engine";

let s = initialChronoState;
const t0 = 1_000_000; // arbitrary "now" baseline

function step(label: string, fn: () => void) {
  fn();
  console.log(`✓ ${label}`);
}

step("configure regulation 60s + extra 10s", () => {
  s = chronoReducer(
    s,
    { type: "configure", regulationDurationMs: 60_000, extraDurationMs: 10_000 },
    t0,
  );
  if (s.regulationTargetMs !== 60_000) throw new Error("bad regulation");
  if (s.extraTargetMs !== 10_000) throw new Error("bad extra");
  if (s.targetDurationMs !== 60_000) throw new Error("bad target");
});

step("start at t0", () => {
  s = chronoReducer(s, { type: "start" }, t0);
  if (s.phase !== "playing") throw new Error("not playing");
  if (s.runningSince !== t0) throw new Error("bad runningSince");
});

step("elapsed after 5s = 5000", () => {
  const e = elapsedMs(s, t0 + 5_000);
  if (e !== 5_000) throw new Error(`elapsed=${e}`);
});

step("remaining after 5s = 55000", () => {
  const r = remainingMs(s, t0 + 5_000);
  if (r !== 55_000) throw new Error(`remaining=${r}`);
});

step("pause at t+10s freezes accumulated to 10000", () => {
  s = chronoReducer(s, { type: "pause" }, t0 + 10_000);
  if (s.phase !== "paused") throw new Error("not paused");
  if (s.accumulatedMs !== 10_000) throw new Error("bad accumulated");
  if (s.runningSince !== null) throw new Error("still running");
});

step("elapsed while paused stays 10000 even 30s later", () => {
  const e = elapsedMs(s, t0 + 40_000);
  if (e !== 10_000) throw new Error(`elapsed=${e}`);
});

step("resume adds new run time", () => {
  s = chronoReducer(s, { type: "resume" }, t0 + 40_000);
  const e = elapsedMs(s, t0 + 45_000);
  if (e !== 15_000) throw new Error(`elapsed=${e}`);
});

step("addTime bumps target", () => {
  s = chronoReducer(s, { type: "addTime", ms: 10_000 }, t0 + 45_000);
  if (s.targetDurationMs !== 70_000) throw new Error("bad target");
});

step("hasReachedTarget false at 15s", () => {
  if (hasReachedTarget(s, t0 + 45_000)) throw new Error("wrongly reached");
});

step("enter additional -> phase additional, target null, elapsed reset", () => {
  s = chronoReducer(s, { type: "enterAdditional" }, t0 + 50_000);
  if (s.phase !== "additional") throw new Error("not additional");
  if (s.targetDurationMs !== null) throw new Error("target not null");
  const e = elapsedMs(s, t0 + 52_000);
  if (e !== 2_000) throw new Error(`elapsed=${e}`);
});

step("enter extra -> phase extra with extraTarget 10s", () => {
  s = chronoReducer(s, { type: "enterExtra" }, t0 + 60_000);
  if (s.phase !== "extra") throw new Error("not extra");
  if (s.targetDurationMs !== 10_000) throw new Error("bad target");
});

step("enter golden -> phase golden, no target", () => {
  s = chronoReducer(s, { type: "enterGolden" }, t0 + 70_000);
  if (s.phase !== "golden") throw new Error("not golden");
  if (s.targetDurationMs !== null) throw new Error("target not null");
});

step("finish -> phase finished, reason stored, frozen accumulated", () => {
  s = chronoReducer(
    s,
    { type: "finish", reason: "goldenGoal" },
    t0 + 75_000,
  );
  if (s.phase !== "finished") throw new Error("not finished");
  if (s.finishReason !== "goldenGoal") throw new Error("bad reason");
  if (s.runningSince !== null) throw new Error("still running");
  if (s.accumulatedMs !== 5_000) throw new Error(`accum=${s.accumulatedMs}`);
});

step("reset returns to initial", () => {
  s = chronoReducer(s, { type: "reset" }, t0 + 80_000);
  if (s.phase !== "idle") throw new Error("not idle");
  if (s.accumulatedMs !== 0) throw new Error("bad accum");
});

console.log("\nAll chrono engine tests passed ✅");

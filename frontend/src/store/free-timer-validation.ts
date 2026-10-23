import { buildSteps, validFreeConfig, type FreeTimerState } from "@/src/domain/free-timer";

const record = (x: unknown): x is Record<string, unknown> => !!x && typeof x === "object" && !Array.isArray(x);
const nonnegative = (x: unknown): x is number => typeof x === "number" && Number.isFinite(x) && x >= 0 && x <= Number.MAX_SAFE_INTEGER;

export function validFreeTimer(value: unknown, now = Date.now()): value is FreeTimerState {
  if (!record(value) || !validFreeConfig(value.config)) return false;
  const c = value.config;
  // Bound reconstruction before allocating a sequence from untrusted storage.
  if (c.kind === "interval" && (!Number.isSafeInteger(c.reps * c.sets) || c.reps * c.sets > 5000)) return false;
  const expected = buildSteps(c);
  if (!Array.isArray(value.steps) || value.steps.length !== expected.length || !expected.length) return false;
  const steps = value.steps;
  if (!expected.every((step, i) => {
    const actual: unknown = steps[i];
    return record(actual) && Object.entries(step).every(([key, v]) => actual[key] === v);
  })) return false;
  if (!Number.isInteger(value.stepIndex) || (value.stepIndex as number) < 0 || (value.stepIndex as number) >= expected.length) return false;
  if (!nonnegative(value.stepAccumulatedMs) || !nonnegative(value.stepStartedAt) || !nonnegative(value.createdAt)) return false;
  if (typeof value.running !== "boolean" || typeof value.finished !== "boolean") return false;
  if ((!value.running && value.stepStartedAt !== 0) || (value.running && value.finished)) return false;
  if (value.finished && (c.kind === "stopwatch" || value.stepIndex !== expected.length - 1)) return false;
  const duration = expected[value.stepIndex as number].durationMs;
  if (duration !== null && (!nonnegative(duration) || duration <= 0 || value.stepAccumulatedMs > duration)) return false;
  if (value.finished && (c.kind === "countdown" || (c.kind === "interval" && c.autoChain)) && value.stepAccumulatedMs !== duration) return false;
  if (!expected.every(s => s.durationMs === null || (nonnegative(s.durationMs) && s.durationMs > 0))) return false;
  if (!nonnegative(expected.reduce((n, s) => n + (s.durationMs ?? 0), 0))) return false;
  if (!Array.isArray(value.laps) || (c.kind !== "stopwatch" && value.laps.length !== 0)) return false;
  const elapsed = value.stepAccumulatedMs + (value.running ? Math.max(0, now - value.stepStartedAt) : 0);
  if (!value.laps.every((lap, i, laps) => nonnegative(lap) && (value.running || lap <= elapsed) && (i === 0 || lap >= laps[i - 1]))) return false;
  const scoreCount = c.withTeams && c.teams ? c.teams.length : 2;
  return Array.isArray(value.score) && value.score.length === scoreCount && value.score.every(n => nonnegative(n) && Number.isSafeInteger(n));
}

export function restoreFreeTimer(value: unknown): { value: FreeTimerState | null; repaired: boolean } {
  if (validFreeTimer(value)) return { value, repaired: false };
  // Only the derived sequence can be reconstructed. Never invent elapsed time,
  // timestamps, laps or scores. Inconsistent existing sequences are rejected.
  if (record(value) && value.steps === undefined && validFreeConfig(value.config)) {
    const c = value.config;
    if (c.kind !== "interval" || (Number.isSafeInteger(c.reps * c.sets) && c.reps * c.sets <= 5000)) {
      const repaired = { ...value, steps: buildSteps(c) };
      if (validFreeTimer(repaired)) return { value: repaired, repaired: true };
    }
  }
  return { value: null, repaired: false };
}

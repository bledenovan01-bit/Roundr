// Roundr V0 — Moteur chrono commun (Prompt 02).
// Pure state machine, no React, no side-effects. Time is computed from
// Date.now() references so the engine keeps counting even when the app was
// backgrounded or the JS timer was throttled. UI code drives it via the
// `useChrono` hook or by dispatching actions directly.

export type ChronoPhase =
  // Nothing configured yet.
  | "idle"
  // Regulation time counting up towards `targetDurationMs`.
  | "playing"
  // Regulation time frozen (manual pause or between periods).
  | "paused"
  // Regulation duration reached; open additional time (no target).
  | "additional"
  // Extra time period after a draw (limited duration).
  | "extra"
  // Golden goal: unbounded, ends on the next goal.
  | "golden"
  // Match over, chrono stopped for good.
  | "finished";

// Reasons the chrono was moved into "finished" state. Consumers use this
// to display the transition (E07) and log the summary (E09).
export type FinishReason =
  | "regulation" // target reached and no extra rules were needed
  | "manual" // organizer stopped early
  | "goldenGoal" // first goal during golden phase
  | "extraTimeEnd" // extra time target reached
  | "shootout"; // TAB flow decided the winner outside the engine

export type ChronoState = {
  phase: ChronoPhase;
  // Reference for the current run. `runningSince` is the Date.now() value at
  // which the chrono last resumed. When paused it is null and `accumulatedMs`
  // holds every elapsed ms up to that point.
  runningSince: number | null;
  accumulatedMs: number;
  // Target duration for the *current* phase. null means "open time" (used by
  // additional and golden phases).
  targetDurationMs: number | null;
  // Regulation target, memoised so we can jump into additional/extra flows.
  regulationTargetMs: number;
  extraTargetMs: number | null;
  // Alert thresholds already fired (ms values), so we don't buzz twice.
  firedAlertsMs: number[];
  // Reason the chrono ended, only meaningful in "finished".
  finishReason: FinishReason | null;
};

export type ChronoAction =
  | {
      type: "configure";
      regulationDurationMs: number;
      extraDurationMs?: number | null;
    }
  | { type: "start" }
  | { type: "pause" }
  | { type: "resume" }
  // Manually add ms to the current phase target (referee stoppage).
  | { type: "addTime"; ms: number }
  | { type: "enterAdditional" }
  | { type: "enterExtra" }
  | { type: "enterGolden" }
  | { type: "finish"; reason: FinishReason }
  | { type: "markAlertFired"; ms: number }
  | { type: "reset" };

export const initialChronoState: ChronoState = {
  phase: "idle",
  runningSince: null,
  accumulatedMs: 0,
  targetDurationMs: null,
  regulationTargetMs: 0,
  extraTargetMs: null,
  firedAlertsMs: [],
  finishReason: null,
};

// Elapsed ms in the *current* phase, computed on demand.
// Passing an explicit `now` keeps the function pure so tests are trivial.
export function elapsedMs(state: ChronoState, now: number = Date.now()): number {
  if (state.runningSince == null) return state.accumulatedMs;
  const delta = Math.max(0, now - state.runningSince);
  return state.accumulatedMs + delta;
}

// Ms remaining before the current phase target. Returns null when the phase
// has no target (additional, golden).
export function remainingMs(
  state: ChronoState,
  now: number = Date.now(),
): number | null {
  if (state.targetDurationMs == null) return null;
  return Math.max(0, state.targetDurationMs - elapsedMs(state, now));
}

// Has the current phase reached its target duration?
export function hasReachedTarget(
  state: ChronoState,
  now: number = Date.now(),
): boolean {
  if (state.targetDurationMs == null) return false;
  return elapsedMs(state, now) >= state.targetDurationMs;
}

// Freeze the current elapsed time into accumulatedMs and clear runningSince.
function freeze(state: ChronoState, now: number): ChronoState {
  if (state.runningSince == null) return state;
  return {
    ...state,
    accumulatedMs: elapsedMs(state, now),
    runningSince: null,
  };
}

// Move to a new phase, resetting the accumulator and target as configured.
function enterPhase(
  state: ChronoState,
  phase: ChronoPhase,
  targetDurationMs: number | null,
  now: number,
): ChronoState {
  return {
    ...state,
    phase,
    runningSince: now,
    accumulatedMs: 0,
    targetDurationMs,
    firedAlertsMs: [],
    finishReason: null,
  };
}

// Reducer entry point. All transitions go through here.
export function chronoReducer(
  state: ChronoState,
  action: ChronoAction,
  now: number = Date.now(),
): ChronoState {
  switch (action.type) {
    case "configure":
      return {
        ...initialChronoState,
        regulationTargetMs: action.regulationDurationMs,
        extraTargetMs: action.extraDurationMs ?? null,
        targetDurationMs: action.regulationDurationMs,
      };

    case "start":
      // Only "idle" or "paused" can start regulation from zero.
      if (state.phase === "playing") return state;
      return {
        ...state,
        phase: "playing",
        targetDurationMs: state.regulationTargetMs,
        accumulatedMs: 0,
        runningSince: now,
        firedAlertsMs: [],
        finishReason: null,
      };

    case "pause":
      if (state.runningSince == null) return state;
      return { ...freeze(state, now), phase: "paused" };

    case "resume":
      // Only makes sense out of a paused state.
      if (state.phase !== "paused") return state;
      return { ...state, phase: "playing", runningSince: now };

    case "addTime":
      if (state.targetDurationMs == null) return state;
      return {
        ...state,
        targetDurationMs: state.targetDurationMs + Math.max(0, action.ms),
      };

    case "enterAdditional":
      return enterPhase(state, "additional", null, now);

    case "enterExtra":
      return enterPhase(state, "extra", state.extraTargetMs, now);

    case "enterGolden":
      return enterPhase(state, "golden", null, now);

    case "finish":
      return {
        ...freeze(state, now),
        phase: "finished",
        finishReason: action.reason,
      };

    case "markAlertFired": {
      if (state.firedAlertsMs.includes(action.ms)) return state;
      return {
        ...state,
        firedAlertsMs: [...state.firedAlertsMs, action.ms],
      };
    }

    case "reset":
      return initialChronoState;

    default:
      return state;
  }
}

// Given a running state and a list of threshold ms (e.g. [halftimeMs,
// finalWhistleMs]), returns the thresholds that were just crossed since
// last tick and haven't been fired yet.
export function crossedThresholds(
  state: ChronoState,
  thresholds: number[],
  now: number = Date.now(),
): number[] {
  const elapsed = elapsedMs(state, now);
  return thresholds.filter(
    (t) => t <= elapsed && !state.firedAlertsMs.includes(t),
  );
}

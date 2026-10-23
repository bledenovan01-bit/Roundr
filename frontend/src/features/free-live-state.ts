import {
  advanceFree,
  currentStep,
  nextStep,
  pauseFree,
  recordLap,
  restartSession,
  startFree,
  stepElapsed,
  type FreeTimerState,
} from "@/src/domain/free-timer";

export const freeViews = ["numeric", "analog", "circular"] as const;
export function freeStationaryTap(
  start: { x: number; y: number } | null,
  end: { x: number; y: number },
) {
  // Keyboard/accessibility activation may not carry pointer coordinates.
  return (
    start === null ||
    ![start.x, start.y, end.x, end.y].every(Number.isFinite) ||
    Math.hypot(end.x - start.x, end.y - start.y) <= 10
  );
}
export function changeFreeScore(
  ft: FreeTimerState,
  index: number,
  delta: 1 | -1,
) {
  if (
    !ft.config.withTeams ||
    ft.config.scoreOn === false ||
    freeStage(ft) === "ready" ||
    !Number.isInteger(index) ||
    index < 0 ||
    index >= ft.score.length
  )
    return ft;
  return {
    ...ft,
    score: ft.score.map((value, i) =>
      i === index ? Math.max(0, value + delta) : value,
    ),
  };
}
export type FreeCommand =
  | "toggle"
  | "lap"
  | "skip"
  | "next"
  | "reset"
  | "restart"
  | "relaunch";
export function freeStage(ft: FreeTimerState) {
  if (ft.finished) return "ended";
  if (
    ft.config.kind === "interval" &&
    !ft.config.autoChain &&
    !ft.running &&
    ft.stepAccumulatedMs === currentStep(ft)?.durationMs
  )
    return "waiting";
  return ft.running
    ? "running"
    : ft.ui?.started ||
        ft.stepIndex > 0 ||
        ft.stepAccumulatedMs > 0 ||
        ft.laps.length
      ? "paused"
      : "ready";
}
export function freeTransition(
  before: FreeTimerState | null,
  after: FreeTimerState,
): "step" | "end" | null {
  if (
    !before ||
    before.createdAt !== after.createdAt ||
    after.config.kind === "stopwatch" ||
    freeStage(after) === "ready"
  )
    return null;
  if (after.finished && !before.finished) return "end";
  if (
    before.stepIndex !== after.stepIndex ||
    (after.config.kind === "interval" &&
      ((before.finished && after.running) ||
        (before.running &&
          !after.running &&
          after.stepAccumulatedMs === currentStep(after)?.durationMs)))
  )
    return "step";
  return null;
}
export function freeCommand(
  ft: FreeTimerState,
  action: FreeCommand,
  now: number,
): FreeTimerState {
  const current = advanceFree(ft, now);
  const ui = { ...current.ui, started: true };
  if (action === "reset" || action === "restart" || action === "relaunch") {
    const reset = {
      ...restartSession(current),
      score:
        action === "restart" ? current.score.map(() => 0) : [...current.score],
      ui: { ...current.ui, started: false },
    };
    return action === "relaunch" ? { ...startFree(reset, now), ui } : reset;
  }
  if (current.finished) return current;
  if (action === "lap")
    return current.config.kind === "stopwatch" && current.running
      ? recordLap(current, now)
      : current;
  if (
    action === "next" ||
    (action === "toggle" && freeStage(current) === "waiting")
  )
    return startFree(nextStep(current, now), now);
  if (action === "skip") {
    if (current.config.kind !== "interval" || !current.running) return current;
    if (
      !current.config.autoChain &&
      current.stepIndex < current.steps.length - 1
    )
      return {
        ...current,
        running: false,
        stepStartedAt: 0,
        stepAccumulatedMs: currentStep(current)!.durationMs!,
      };
    const next = nextStep(current, now);
    return next.finished
      ? { ...next, stepAccumulatedMs: currentStep(next)!.durationMs! }
      : next;
  }
  return {
    ...(current.running ? pauseFree(current, now) : startFree(current, now)),
    ui,
  };
}
export function freeReadout(ft: FreeTimerState, now: number) {
  const state = advanceFree(ft, now),
    step = currentStep(state)!,
    stage = freeStage(state);
  const elapsed = Math.min(
    step.durationMs ?? Infinity,
    stepElapsed(state, now),
  );
  const remaining =
    stage === "waiting" || stage === "ended"
      ? 0
      : Math.max(0, (step.durationMs ?? 0) - elapsed);
  const ms =
    state.config.kind === "stopwatch" || state.ui?.elapsed
      ? elapsed
      : remaining;
  const v = Math.max(0, ms),
    total = Math.floor(v / 1000),
    hours = Math.floor(total / 3600);
  const main = `${hours ? hours + ":" : ""}${String(Math.floor(total / 60) % 60).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
  const cents = "." + String(Math.floor((v % 1000) / 10)).padStart(2, "0");
  const status =
    stage === "ready"
      ? "Prêt à démarrer"
      : stage === "ended"
        ? state.config.kind === "countdown"
          ? "Temps écoulé"
          : "Programme terminé"
        : stage === "waiting"
          ? "En attente de la période suivante"
          : stage === "running"
            ? "En cours"
            : "En pause";
  const label =
    state.config.kind === "stopwatch"
      ? "CHRONOMÈTRE"
      : `${state.config.kind === "interval" ? (stage === "ended" ? "TERMINÉ · " : step.type === "work" ? "TRAVAIL · " : "REPOS · ") : ""}${state.ui?.elapsed ? "TEMPS ÉCOULÉ" : "TEMPS RESTANT"}`;
  const progress =
    step.durationMs === null
      ? null
      : step.durationMs
        ? 1 - remaining / step.durationMs
        : 1;
  return { state, stage, status, ms, main, cents, label, progress };
}
// A horizontal gesture is distinct from vertical scrolling and a short tap.
export function freeSwipe(dx: number, dy: number) {
  return Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.4
    ? dx < 0
      ? 1
      : -1
    : 0;
}
export function freeTimeNotice(ft: FreeTimerState, now: number) {
  if (ft.config.kind !== "countdown" || !ft.config.endSignal || !ft.running)
    return null;
  const elapsed = stepElapsed(ft, now),
    duration = ft.config.durationMs;
  for (const seconds of [30, 60]) {
    const crossed = elapsed - (duration - seconds * 1000);
    if (duration > seconds * 1000 && crossed >= 0 && crossed < 3000)
      return {
        id: `${ft.createdAt}:${seconds}`,
        text:
          seconds === 60
            ? "Plus qu'1 minute !"
            : "Fin du compte à rebours dans 30 secondes !",
      };
  }
  return null;
}

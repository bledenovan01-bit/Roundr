// Pure computation of the moments a running chrono reaches a boundary, so the
// system can ring when Roundr is in the background or the screen is locked.
// Deadlines are derived from stored timestamps only (never from `now`), so the
// plan stays identical between display ticks and is rescheduled only when the
// chrono really changes (start, pause, correction, next period, reset).
import type { FreeTimerState } from "@/src/domain/free-timer";
import type { Session } from "@/src/domain/types";

export type EndAlert = { at: number; title: string; body: string };
export type EndAlertPlan = { alerts: EndAlert[]; sound: boolean };
export type AlertPreferences = { sounds: boolean; vibrations: boolean };

/** iOS keeps at most 64 pending notifications per app; stay well below. */
export const MAX_ALERTS = 20;

const MODE_NAMES: Record<Session["mode"], string> = {
  classique: "Match classique", maracana: "Maracana", cup: "Cup", survie: "Survie", custom: "Match",
};

export function matchAlertPlan(session: Session | null, prefs: AlertPreferences): EndAlertPlan | null {
  if (!session || session.status !== "active" || (!prefs.sounds && !prefs.vibrations)) return null;
  const live = session.live;
  const chrono = live?.chrono;
  if (!live || !chrono || chrono.runningSince == null || chrono.targetDurationMs == null) return null;
  const at = chrono.runningSince + chrono.targetDurationMs - chrono.accumulatedMs;
  const last = live.periodIndex >= live.periodMs.length - 1;
  let body: string;
  switch (live.stage) {
    case "period":
      body = last ? "Fin du temps réglementaire." : `Fin de la période ${live.periodIndex + 1}.`;
      break;
    case "break": body = "Fin de la pause. La période suivante peut commencer."; break;
    case "extra": body = "Fin de la prolongation."; break;
    default: return null;
  }
  const config = session.config as { sounds?: boolean; soundControl?: string };
  const sessionSound = config.soundControl !== "session" || config.sounds !== false;
  return { alerts: [{ at, title: MODE_NAMES[session.mode], body }], sound: prefs.sounds && sessionSound };
}

export function freeAlertPlan(ft: FreeTimerState | null, prefs: AlertPreferences): EndAlertPlan | null {
  if (!ft || !ft.running || ft.finished || (!prefs.sounds && !prefs.vibrations)) return null;
  const config = ft.config;
  if (config.kind === "stopwatch" || !config.endSignal) return null;
  const autoChain = config.kind === "interval" ? config.autoChain : true;
  const title = ft.ui?.name ?? (config.kind === "countdown" ? "Compte à rebours" : "Intervalles");
  const alerts: EndAlert[] = [];
  let at = ft.stepStartedAt - ft.stepAccumulatedMs;
  for (let i = ft.stepIndex; i < ft.steps.length && alerts.length < MAX_ALERTS; i++) {
    const duration = ft.steps[i].durationMs;
    if (duration == null) break;
    at += duration;
    const next = ft.steps[i + 1];
    alerts.push({ at, title, body: next ? `${next.label} : c'est parti.` : "Fin du chrono." });
    // Without auto-chaining the timer waits for a manual tap after this step.
    if (!autoChain) break;
  }
  const sounds = (config as { sounds?: boolean }).sounds;
  return { alerts, sound: prefs.sounds && sounds !== false };
}

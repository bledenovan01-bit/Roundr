// Read-only home presentation. Delegates all time projection to existing engines;
// never advances, pauses, replaces or persists either independent native session.
import { elapsedMs } from "@/src/chrono/engine";
import { formatMMSS } from "@/src/chrono/format";
import { currentStep, stepElapsed, type FreeTimerState } from "@/src/domain/free-timer";
import { liveTeams } from "@/src/domain/session";
import type { Session } from "@/src/domain/types";

const modes = { classique: "Match classique", custom: "Chrono libre", maracana: "Maracana", cup: "Cup", survie: "Survie" };

export type HomeResume = {
  key: string;
  title: string;
  state: string;
  teams: string | null;
  time: string | null;
  action: string;
  route: "/live" | "/chrono-libre/run";
};

export function homeSessionPreviews(session: Session | null, free: FreeTimerState | null, now: number): HomeResume[] {
  const result: HomeResume[] = [];
  if (session?.status === "active") {
    const live = session.live;
    const elapsed = live ? elapsedMs(live.chrono, now) : 0;
    let state = "Rencontre à préparer", time: string | null = null;
    if (live) {
      state = live.stage === "ready" ? "Prêt à démarrer" : live.stage === "finished" ? "Match terminé" : live.stage === "break" || live.stage === "awaitPeriod" ? "Pause entre les périodes" : live.stage === "shootout" ? "Tirs au but" : live.chrono.runningSince != null ? "En cours" : "En pause";
      switch (live.stage) {
        case "ready": case "period":
          time = live.end.byTime ? `temps restant : ${formatMMSS((live.periodMs[live.periodIndex] ?? 0) - elapsed)}` : `temps de jeu : ${formatMMSS(elapsed)}`;
          break;
        case "break": time = `pause : ${formatMMSS(live.breakMs - elapsed)}`; break;
        case "awaitPeriod": time = `temps restant : ${formatMMSS(live.periodMs[live.periodIndex] ?? 0)}`; break;
        case "extra": time = `prolongation : ${formatMMSS(live.extraMs - elapsed)}`; break;
        case "additional": time = `temps additionnel : +${formatMMSS(elapsed)}`; break;
        case "golden": time = `temps de jeu : ${formatMMSS(elapsed)}`; break;
        case "finished": time = `temps de jeu : ${formatMMSS(live.playedMs)}`; break;
      }
    }
    const teams = liveTeams(session).filter(t => t != null).map(t => t.name).join(" vs ");
    result.push({ key: session.id, title: `Session en cours — ${modes[session.mode]}`, state, teams: teams || null, time, action: "Reprendre le match", route: "/live" });
  }
  if (free && !free.finished) {
    const elapsed = stepElapsed(free, now);
    const duration = currentStep(free)?.durationMs;
    const progressed = free.stepIndex > 0 || elapsed > 0 || free.laps.length > 0 || free.score.some(n => n > 0);
    result.push({
      key: `free-${free.createdAt}`,
      title: "Session en cours — Chrono libre",
      state: free.running ? "En cours" : progressed ? "En pause" : "Prêt à démarrer",
      teams: free.config.withTeams ? "Équipe A vs Équipe B" : null,
      time: duration == null ? `temps de jeu : ${formatMMSS(elapsed)}` : `temps restant : ${formatMMSS(duration - elapsed)}`,
      action: "Reprendre la session",
      route: "/chrono-libre/run",
    });
  }
  return result;
}

import { nextMatchInfo } from "./session";
import type { Session } from "./types";

export type SessionEventKind = "start" | "goal" | "minute" | "periodEnd" | "matchEnd" | "warmup" | "next";
export type SessionEvent = { kind: SessionEventKind; message: string };

export function sessionEvents(prev: Session | null, next: Session): SessionEvent[] {
  const nl = next.live;
  if (!nl) return [];
  const pl = prev?.id === next.id ? prev.live : null;
  const same = pl?.matchId === nl.matchId;
  const events: SessionEvent[] = [];
  if (same && pl.stage === "ready" && nl.stage === "period") {
    events.push({ kind: "start", message: "C’est parti !" });
    return events;
  }
  if (same && pl.stage !== "finished" && nl.stage === "finished") {
    events.push({ kind: "matchEnd", message: "Match terminé" });
    const upcoming = nextMatchInfo(next);
    if (upcoming?.certain) events.push({ kind: "next", message: `Prochain match : ${upcoming.aLabel} – ${upcoming.bLabel}` });
    return events;
  }
  if (same && pl.stage === "period" && ["break", "awaitPeriod", "additional", "extra", "golden", "shootout"].includes(nl.stage)) {
    events.push({ kind: "periodEnd", message: "Fin de période" });
  }
  if (same && nl.score.some((score, i) => score > pl.score[i])) events.push({ kind: "goal", message: "But !" });
  if (nl.chrono.runningSince != null && nl.chrono.accumulatedMs === 0 &&
      (!same || pl.chrono.runningSince == null || pl.stage !== nl.stage)) {
    events.push({ kind: "start", message: "C’est parti !" });
  }
  const fresh = same ? nl.firedAlerts.filter(k => !pl.firedAlerts.includes(k)) : [];
  if (fresh.some(k => k.endsWith(":60000"))) events.push({ kind: "minute", message: "1 minute restante" });
  if (fresh.some(k => k.endsWith(":30000"))) events.push({ kind: "minute", message: "Plus que 30 secondes" });
  if (fresh.some(k => k === "prep" || k === "prep1")) {
    const upcoming = nextMatchInfo(next);
    if (upcoming?.certain) events.push({ kind: "warmup", message: fresh.includes("prep1")
      ? `${upcoming.aLabel} et ${upcoming.bLabel} : préparez-vous à entrer sur le terrain !`
      : `${upcoming.aLabel} et ${upcoming.bLabel} : commencez l’échauffement !` });
  }
  return events;
}

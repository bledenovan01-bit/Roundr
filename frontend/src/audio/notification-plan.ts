import { advance, nextMatchInfo } from "../domain/session";
import { prepLeadMs, REMINDER_MS } from "../domain/preparation";
import type { Session } from "../domain/types";
import type { SoundKey } from "./events";
export type PlannedAlert = { id: string; at: number; title: string; sound: SoundKey };

// Plan known deadlines only. No future match or period starts automatically.
export function notificationPlan(session: Session | null, now: number): PlannedAlert[] {
  if (!session || session.status !== "active" || !session.config.sounds) return [];
  let s = advance(session, now);
  const events = new Map<number, PlannedAlert>();
  const add = (at: number, title: string, sound: SoundKey) => {
    if (at > now + 250) events.set(at, { id: `roundr:${s.id}:${s.live!.matchId}:${at}`, at, title, sound });
  };
  for (let guard = 0; guard < 4; guard++) {
    const l = s.live;
    if (!l || l.chrono.runningSince === null || !["period", "extra", "break"].includes(l.stage) || (l.stage === "period" && !l.end.byTime)) break;
    const duration = l.stage === "period" ? l.periodMs[l.periodIndex] : l.stage === "extra" ? l.extraMs : l.breakMs;
    const end = l.chrono.runningSince - l.chrono.accumulatedMs + duration;
    if (l.stage !== "break") {
      for (const threshold of [180000, 120000, 60000, 30000]) {
        if (threshold < duration) add(end - threshold, threshold === 30000 ? "30 secondes restantes" : `${threshold / 60000} min restante(s)`, `alert${threshold / 1000}` as SoundKey);
      }
      const next = nextMatchInfo(s);
      if (next && l.periodIndex === l.periodMs.length - 1 && l.end.byTime) {
        for (const lead of [prepLeadMs(next.durationMin), REMINDER_MS]) {
          if (lead < duration) add(end - lead, `Préparez-vous : ${next.aLabel} · ${next.bLabel}`, "prep");
        }
      }
    }
    const next = advance(s, end + 1);
    if (next.live?.stage === "finished") add(end, "Fin du match", "final");
    else add(end, next.live?.stage === "shootout" ? "Tirs au but" : next.live?.stage === "extra" ? "Prolongation" : next.live?.stage === "golden" ? "Golden goal" : next.live?.stage === "additional" ? "Temps additionnel" : "Fin de période / pause", "whistle");
    if (next === s) break;
    s = next;
  }
  return [...events.values()].sort((a, b) => a.at - b.at);
}


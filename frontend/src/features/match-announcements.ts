import { elapsedMs } from "@/src/chrono/engine";
import type { Session } from "@/src/domain/types";

export type MatchAnnouncement = {
  key: string;
  at: number;
  message: string;
  tone: "warmup" | "time";
  priority: number;
};
export type AnnouncementQueue = {
  scope: string;
  fired: string[];
  queue: MatchAnnouncement[];
  current: (MatchAnnouncement & { until: number }) | null;
};
export const announcementScope = (s: Session) =>
  s.id + ":" + s.live?.matchId + ":" + s.live?.periodIndex;
export const emptyAnnouncements = (scope: string): AnnouncementQueue => ({
  scope,
  fired: [],
  queue: [],
  current: null,
});
export function matchAnnouncements(
  s: Session,
  preparation = true,
): MatchAnnouncement[] {
  const l = s.live;
  if (!l || !l.end.byTime || l.stage !== "period") return [];
  const duration = l.periodMs[l.periodIndex] / 1000,
    events: MatchAnnouncement[] = [];
  if (duration > 60)
    events.push({
      key: "t60",
      at: 60,
      message: "Plus qu'1 minute !",
      tone: "time",
      priority: 2,
    });
  if (duration > 30)
    events.push({
      key: "t30",
      at: 30,
      message:
        (l.periodIndex === l.periodMs.length - 1
          ? "Fin du match"
          : "Fin de la période") + " dans 30 secondes !",
      tone: "time",
      priority: 2,
    });
  if (s.mode === "maracana" && s.maracana && preparation) {
    const waiting = s.maracana.waiting
      .map((id) => s.teams.find((t) => t.id === id)?.name)
      .filter((n): n is string => !!n);
    const one =
      s.teams.length === 3 ||
      (s.config.mode === "maracana" && s.config.rotation === "winnerStays");
    const names = waiting.slice(0, one ? 1 : 2),
      who = names.join(" et ");
    if (who) {
      events.push(
        {
          key: "warm",
          at: 240,
          message: who + ", échauffez-vous !",
          tone: "warmup",
          priority: 1,
        },
        {
          key: "prep",
          at: 60,
          message: who + ", préparez-vous !",
          tone: "warmup",
          priority: 3,
        },
      );
      if (one && waiting[1])
        events.push({
          key: "following",
          at: 60,
          message: waiting[1] + ", préparez-vous pour la suite !",
          tone: "warmup",
          priority: 1,
        });
    }
  }
  return events;
}
// Same grace/priority as the frozen reference. Visibility timers never drive a match.
export function reduceAnnouncements(
  state: AnnouncementQueue,
  s: Session,
  now: number,
  preparation = true,
): AnnouncementQueue {
  const scope = announcementScope(s);
  if (state.scope !== scope)
    return reduceAnnouncements(emptyAnnouncements(scope), s, now, preparation);
  const l = s.live;
  if (!l) return state;
  const remaining = l.end.byTime
    ? (l.periodMs[l.periodIndex] - elapsedMs(l.chrono, now)) / 1000
    : null;
  const fired = new Set(state.fired),
    fresh: MatchAnnouncement[] = [];
  let changed = false;
  for (const e of matchAnnouncements(s, preparation)) {
    if (remaining === null) continue;
    if (remaining > e.at) {
      if (fired.delete(e.key)) changed = true;
      continue;
    }
    if (fired.has(e.key)) continue;
    fired.add(e.key);
    changed = true;
    if (l.chrono.runningSince !== null && e.at - remaining <= 3) fresh.push(e);
  }
  let queue = [...state.queue, ...fresh].sort(
      (a, b) => b.priority - a.priority,
    ),
    current = state.current;
  if (current && now >= current.until) {
    current = null;
    changed = true;
  }
  if (!current && queue.length) {
    const [first, ...rest] = queue;
    queue = rest;
    current = { ...first, until: now + 4500 };
    changed = true;
  }
  return changed ? { scope, fired: [...fired], queue, current } : state;
}

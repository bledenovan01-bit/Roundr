import type { Session, MaracanaConfig } from "@/src/domain/types";
import type { FreeTimerState } from "@/src/domain/free-timer";
import { freeConfigSummary, freeLabels } from "@/src/domain/free-configuration";

export function settingsSessionLabel(session: Session): string {
  const c = session.config;
  if (c.mode === "classique")
    return `Match classique · ${c.periods === 2 ? `2 × ${c.totalMin / 2}` : c.totalMin} min`;
  if (c.mode === "maracana")
    return `Maracana · ${session.teams.length} équipes · ${c.matchMin} min`;
  if (c.mode === "cup" || c.mode === "survie")
    return `${c.mode === "cup" ? "Cup" : "Survie"} · ${session.teams.length} équipes`;
  return "Chrono libre";
}
export function settingsFreeLabel(free: FreeTimerState): string {
  return free.ui?.name
    ? `${free.ui.name} · ${freeLabels[free.config.kind]}`
    : `Chrono libre · ${freeConfigSummary(free.config)}`;
}

// Explicit entry target avoids sending a free-timer user to a coexisting match.
export function settingsReturn(
  from: unknown,
  session: Session | null,
  free: FreeTimerState | null,
) {
  if (from === "free" && free) return "/chrono-libre/run" as const;
  if (from === "match" && session?.status === "active") return "/live" as const;
  return null;
}
// Only the future policy changes: frozen results, queue and live clock stay intact.
export function settingsRotation(
  session: Session,
  patch: Pick<Partial<MaracanaConfig>, "rotation" | "drawRule4">,
): Session {
  if (session.config.mode !== "maracana" || session.status !== "active")
    return session;
  if (
    patch.rotation !== undefined &&
    !["classic", "winnerStays"].includes(patch.rotation)
  )
    return session;
  if (
    patch.drawRule4 !== undefined &&
    (!["oneLeaves", "bothLeave"].includes(patch.drawRule4) ||
      session.teams.length < 4 ||
      session.config.rotation !== "winnerStays")
  )
    return session;
  return { ...session, config: { ...session.config, ...patch } };
}

import { elapsedMs } from "@/src/chrono/engine";
import * as S from "@/src/domain/session";
import type { Session, Team } from "@/src/domain/types";

export type MatchPage = "digital" | "ring" | "next" | "tournament" | "music";
export const pageNames: Record<MatchPage, string> = {
  digital: "Chrono classique",
  ring: "Chrono circulaire",
  next: "Prochain match",
  tournament: "Tournoi",
  music: "Musique",
};
export function matchPages(s: Session): MatchPage[] {
  return [
    "digital",
    "ring",
    ...(s.mode === "maracana" ? ["next" as const] : []),
    ...(s.mode === "cup" || s.mode === "survie" ? ["tournament" as const] : []),
    ...(s.live?.stage !== "ready" && s.live?.tiebreakStep !== "ready" ? ["music" as const] : []),
  ];
}
// A projection only: ticks, banners and rotation never select a carousel page.
export function visibleMatchPage(selected: number, pages: MatchPage[]) {
  return Math.max(0, Math.min(pages.length - 1, selected));
}
export function periodName(count: number, index: number) {
  return count === 1
    ? "Match"
    : count === 2
      ? index === 0
        ? "1re mi-temps"
        : "2e mi-temps"
      : "Période " + (index + 1);
}
export function matchProjection(s: Session, now: number, showElapsed = false) {
  const l = s.live!;
  const running = l.chrono.runningSince !== null && l.stage !== "finished";
  const between = l.stage === "break" || l.stage === "awaitPeriod";
  const index =
    l.stage === "awaitPeriod" ? Math.max(0, l.periodIndex - 1) : l.periodIndex;
  const duration = between
    ? l.breakMs
    : l.stage === "extra"
      ? l.extraMs
      : (l.periodMs[l.periodIndex] ?? 0);
  const passed =
    l.stage === "ready"
      ? 0
      : l.stage === "finished"
        ? (l.detail?.periods[l.periodIndex] ?? l.playedMs)
        : l.stage === "awaitPeriod"
          ? l.breakMs
          : elapsedMs(l.chrono, now);
  const timed =
    (l.end.byTime || between || l.stage === "extra") &&
    duration > 0 &&
    l.stage !== "additional" &&
    l.stage !== "golden";
  const value = timed
    ? showElapsed
      ? Math.min(duration, passed)
      : l.stage === "finished"
        ? 0
        : Math.max(0, duration - passed)
    : passed;
  const ms = Math.max(0, Math.floor(value)),
    seconds = Math.floor(ms / 1000);
  const main =
    (l.stage === "additional" ? "+" : "") +
    String(Math.floor(seconds / 60)).padStart(2, "0") +
    ":" +
    String(seconds % 60).padStart(2, "0");
  const cents = "." + String(Math.floor((ms % 1000) / 10)).padStart(2, "0");
  const label = timed
    ? (between ? "PAUSE · " : l.stage === "extra" && s.mode === "maracana" ? "BUT DÉCISIF · " : "") +
      (showElapsed ? "TEMPS ÉCOULÉ" : "TEMPS RESTANT")
    : l.stage === "finished"
      ? "TERMINÉ"
      : l.stage === "additional"
        ? "TEMPS ADDITIONNEL"
        : "TEMPS DE JEU";
  const status =
    l.stage === "ready"
      ? "Prêt à démarrer"
      : l.stage === "finished"
        ? "Match terminé"
        : between
          ? l.periodMs.length === 2
            ? "Mi-temps"
            : "Pause entre les périodes"
          : l.stage === "additional"
            ? running
              ? "Temps additionnel"
              : "Temps additionnel en pause"
            : l.stage === "extra" && s.mode === "maracana"
              ? running
                ? "Prolongation · but décisif"
                : "Prolongation en pause"
              : running
                ? "Match en cours"
                : "Match en pause";
  const tone =
    l.stage === "ready"
      ? "ready"
      : l.stage === "finished"
        ? "ended"
        : between || !running
          ? "paused"
          : "running";
  const progress =
    l.stage === "finished" || l.stage === "additional"
      ? 1
      : duration > 0 && timed
        ? Math.max(0, Math.min(1, passed / duration))
        : 0;
  return {
    main,
    cents,
    time: main + cents,
    label,
    status,
    tone,
    progress,
    canToggle: timed,
    running,
    period: index,
    periodLabel: periodName(l.periodMs.length, index),
    ...(l.tiebreakStep === "ready" ? {status:"Prêt à démarrer",tone:"ready"} : l.tiebreakStep === "choice" || l.stage === "shootout" ? {main:"00:00",cents:".00",time:"00:00.00",status:"Match terminé",tone:"ended",progress:1} : {}),
  };
}
export function beginMatch(s: Session, now: number): Session {
  const l = s.live;
  if (!l) return s;
  if (l.tiebreakStep === "ready") return S.startTournamentTiebreak(s, now);
  if (l.stage === "ready") return S.startReady(s, now);
  if (l.stage === "awaitPeriod") return S.startNextPeriod(s, now);
  if (l.stage === "break" && l.periodIndex + 1 < l.periodMs.length)
    return S.startNextPeriod(
      {
        ...s,
        live: { ...l, stage: "awaitPeriod", periodIndex: l.periodIndex + 1 },
      },
      now,
    );
  return s;
}
export function maracanaUpcoming(s: Session) {
  const st = s.maracana;
  if (!st) return null;
  const find = (id: string | undefined) =>
    s.teams.find((t) => t.id === id) ?? null;
  const next = S.nextMatchInfo(s);
  if (!next) return null;
  if (s.live?.stage === "finished")
    return {
      a: find(st.onField[0]),
      b: find(st.onField[1]),
      aLabel: next.aLabel,
      bLabel: next.bLabel,
      following: null,
    };
  const one =
    s.teams.length === 3 ||
    (s.config.mode === "maracana" && s.config.rotation === "winnerStays");
  const a = one ? null : find(st.waiting[0]),
    b = find(st.waiting[one ? 0 : 1]);
  return {
    a,
    b,
    aLabel: one ? "Vainqueur" : next.aLabel,
    bLabel: one ? (b?.name ?? "?") : next.bLabel,
    following:
      !one && st.waiting.length >= 4
        ? ([find(st.waiting[2]), find(st.waiting[3])] as const)
        : null,
  };
}
export type RotationCard = {
  team: Team;
  kind: "stay" | "out" | "in";
  note?: string;
};
export function nextTeamId(teams: Team[]) {
  let n = teams.length + 1;
  while (teams.some((t) => t.id === "t" + n)) n++;
  return "t" + n;
}
export function rotationCards(s: Session): RotationCard[] {
  const before = s.preFinish?.maracana?.onField,
    after = s.maracana?.onField;
  if (!before || !after) return [];
  const draw = s.live?.score[0] === s.live?.score[1];
  const stay = after.filter((id) => before.includes(id));
  const row = (id: string, kind: RotationCard["kind"], note?: string) => ({
    team: s.teams.find((t) => t.id === id)!,
    kind,
    ...(note ? { note } : {}),
  });
  return [
    ...stay.map((id) =>
      row(
        id,
        "stay",
        draw ? "Nul : arrivée la plus récente" : "Victoire : garde sa place",
      ),
    ),
    ...before
      .filter((id) => !after.includes(id))
      .map((id) =>
        row(
          id,
          "out",
          draw && stay.length
            ? "Nul : présente depuis le plus longtemps"
            : undefined,
        ),
      ),
    ...after.filter((id) => !before.includes(id)).map((id) => row(id, "in")),
  ];
}

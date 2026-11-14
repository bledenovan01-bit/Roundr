import { buildSummary } from "@/src/domain/summary";
import type { Session } from "@/src/domain/types";

const modeNames: Record<Session["mode"], string> = {
  classique: "Match classique",
  maracana: "Maracana",
  cup: "Cup",
  survie: "Survie",
  custom: "Chrono libre",
};

/**
 * Plain-text summary of a session, for the native share sheet. Built from the
 * existing computed summary: nothing is invented, and a draw, a session without
 * score or an interrupted tournament read as what they are.
 */
export function sessionShareText(session: Session): string {
  const summary = buildSummary(session);
  const lines = [`Roundr · ${modeNames[session.mode]}`];
  const single = session.mode === "classique" || session.mode === "custom";
  // A match played without score keeps a 0–0 internally: it is not a draw to announce.
  const noScore = single && (session.config as { score?: boolean }).score === false;
  if (noScore) {
    const [a, b] = session.teams;
    lines.push(`${a?.name ?? "?"} vs ${b?.name ?? "?"}`);
  } else {
    // A single match reads as its score line; other modes name what the line is.
    lines.push(single ? summary.headline : `${summary.title} : ${summary.headline}`);
    if (summary.sub) lines.push(summary.sub);
  }
  if (summary.podium.length > 1) for (const p of summary.podium) lines.push(`${p.place}. ${p.name}`);
  for (const stat of summary.stats) lines.push(`${stat.label} : ${stat.value}`);
  return lines.join("\n");
}

import { GAME_MODES } from "@/src/data/modes";
import type { Preset } from "@/src/domain/types";

export function presetMeta(p: Preset): string {
  const c = p.config;
  const parts = [GAME_MODES.find(m => m.id === c.mode)?.title ?? c.mode];
  if (c.mode === "classique") {
    parts.push(`${c.totalMin} min`, `${c.periods} période(s)`);
  } else {
    parts.push(c.end.byTime ? `${c.mode === "custom" ? c.totalMin : c.matchMin} min` : "Objectif de buts");
    if (c.end.goalTarget != null) parts.push(`Premier à ${c.end.goalTarget} buts`);
    if (c.mode === "custom") parts.push(`${c.periods} période(s)`);
    else parts.push(`${c.teamCount} équipes`);
  }
  return parts.join(" · ");
}

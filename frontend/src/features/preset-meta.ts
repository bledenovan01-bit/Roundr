import type { Preset } from "@/src/domain/types";

export function presetMeta(p: Preset): string {
  const c = p.config;
  const parts = [c.end.byTime ? `${c.totalMin} min` : "buts seul", `${c.periods} pér.`];
  if (c.end.goalTarget != null) parts.push(`1er à ${c.end.goalTarget}`);
  if (!c.score) parts.push("sans score");
  return parts.join(" · ");
}


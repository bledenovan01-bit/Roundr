import type { Session } from "../domain/types";
export type SoundKey = "whistle" | "final" | "prep" | "alert180" | "alert120" | "alert60" | "alert30";
export function sessionSound(prev: Session, next: Session): SoundKey | null {
  const a = prev.live, b = next.live;
  if (!b) return null;
  if (!a || a.matchId !== b.matchId || a.startedAt !== b.startedAt) return "whistle";
  if (a.stage !== "finished" && b.stage === "finished") return "final";
  if (a.stage === "period" && a.stage !== b.stage) return "whistle";
  if (a.stage === "awaitPeriod" && b.stage === "period") return "whistle";
  const fresh = b.firedAlerts.filter(k => !a.firedAlerts.includes(k));
  if (fresh.some(k => k.startsWith("prep"))) return "prep";
  const thresholds = fresh.map(k => Number(k.split(":")[1])).filter(n => [180000, 120000, 60000, 30000].includes(n));
  return thresholds.length ? `alert${Math.min(...thresholds) / 1000}` as SoundKey : null;
}


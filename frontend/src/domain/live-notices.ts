import { prepLeadMs } from "./preparation";

export type Notice = "chrono" | "next" | "warmup";
// Two short windows near the end. The match clock is the only time source.
export function liveNotice(remainingMs: number | null, durationMin: number, running: boolean): Notice {
  if (!running || remainingMs == null || remainingMs <= 0) return "chrono";
  const lead = prepLeadMs(durationMin);
  for (const threshold of [lead, 60_000]) {
    const elapsed = threshold - remainingMs;
    if (elapsed >= 0 && elapsed < 8_000) return "next";
    if (elapsed >= 8_000 && elapsed < 16_000) return "warmup";
  }
  return "chrono";
}

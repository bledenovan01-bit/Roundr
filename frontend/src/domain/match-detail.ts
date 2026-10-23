import { elapsedMs } from "@/src/chrono/engine";
import type { MatchDetail, Session } from "./types";

export const emptyMatchDetail = (periods: number): MatchDetail => ({
  periods: Array.from({ length: periods }, () => null),
  goals: [],
});
// Observational metadata for NEW Classic matches only. Never invent old goal times.
// The timestamp engine, final scores, rotations and sporting rules are untouched.
export function recordMatchDetail(
  before: Session,
  after: Session,
  now: number,
): Session {
  const a = before.live,
    b = after.live;
  if (
    after === before ||
    before.id !== after.id ||
    before.mode !== "classique" ||
    !a ||
    !b ||
    a.matchId !== b.matchId ||
    !a.detail
  )
    return after;
  if (b.stage === "ready" && a.stage !== "ready")
    return {
      ...after,
      live: { ...b, detail: emptyMatchDetail(b.periodMs.length) },
    };
  const goals = [...a.detail.goals],
    periods = [...a.detail.periods];
  let changed = false;
  for (const side of [0, 1] as const) {
    const delta = b.score[side] - a.score[side];
    if (delta > 0) {
      for (let i = 0; i < delta; i++)
        goals.push({
          side,
          period: a.periodIndex,
          atMs: a.stage === "finished" ? null : elapsedMs(a.chrono, now),
        });
      changed = true;
    }
    if (delta < 0) {
      for (let i = 0; i > delta; i--) {
        const index = goals.findLastIndex((g) => g.side === side);
        if (index >= 0) goals.splice(index, 1);
      }
      changed = true;
    }
  }
  const closed = b.playedMs - a.playedMs;
  if (
    closed !== 0 ||
    (["period", "additional", "extra", "golden"].includes(a.stage) &&
      b.stage !== a.stage)
  ) {
    periods[a.periodIndex] = Math.max(
      0,
      (periods[a.periodIndex] ?? 0) + closed,
    );
    changed = true;
  }
  if (!changed) return after;
  return { ...after, live: { ...b, detail: { goals, periods } } };
}
export function validMatchDetail(
  value: unknown,
  periodCount: number,
  score: [number, number],
): value is MatchDetail {
  if (!value || typeof value !== "object") return false;
  const d = value as MatchDetail;
  if (
    !Array.isArray(d.periods) ||
    d.periods.length !== periodCount ||
    d.periods.some((n) => n !== null && (!Number.isFinite(n) || n < 0))
  )
    return false;
  if (
    !Array.isArray(d.goals) ||
    d.goals.some(
      (g) =>
        !g ||
        ![0, 1].includes(g.side) ||
        !Number.isInteger(g.period) ||
        g.period < 0 ||
        g.period >= periodCount ||
        (g.atMs !== null && (!Number.isFinite(g.atMs) || g.atMs < 0)),
    )
  )
    return false;
  return (
    d.goals.filter((g) => g.side === 0).length === score[0] &&
    d.goals.filter((g) => g.side === 1).length === score[1]
  );
}

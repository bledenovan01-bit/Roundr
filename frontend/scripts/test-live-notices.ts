import { liveNotice } from "../src/domain/live-notices";

const cases: [number | null, boolean, string][] = [
  [480_000, true, "chrono"], [180_001, true, "chrono"],
  [180_000, true, "next"], [172_001, true, "next"],
  [172_000, true, "warmup"], [164_001, true, "warmup"],
  [164_000, true, "chrono"], [60_000, true, "next"],
  [52_000, true, "warmup"], [44_000, true, "chrono"],
  [0, true, "chrono"], [null, true, "chrono"], [180_000, false, "chrono"],
];
for (const [remaining, running, expected] of cases) {
  const actual = liveNotice(remaining, 8, running);
  if (actual !== expected) throw new Error(`${remaining}/${running}: ${actual} instead of ${expected}`);
}
console.log("✓ Notices: preparation, one-minute reminder, short windows, pause, untimed and completed matches.");

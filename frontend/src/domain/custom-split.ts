// C05 — Division d'une durée totale (secondes) en périodes entières.
// Reliquat d'une seconde attribué aux premières périodes.
export function splitPeriods(totalSec: number, periods: number): number[] {
  const n = Math.max(1, Math.floor(periods));
  const base = Math.floor(totalSec / n);
  const rest = totalSec - base * n;
  return Array.from({ length: n }, (_, i) => base + (i < rest ? 1 : 0));
}

// Écart (secondes) entre la somme saisie et le total attendu. 0 = OK.
export function periodsDelta(periodSec: number[], totalSec: number): number {
  return periodSec.reduce((s, v) => s + v, 0) - totalSec;
}

// §8 / C18 — Avance de préparation selon la durée du prochain match.
export function prepLeadMs(nextMatchMin: number): number {
  const m = nextMatchMin;
  const min =
    m <= 4 ? 2 : m <= 8 ? 3 : m <= 12 ? 4 : m <= 20 ? 5 : m <= 30 ? 7 : m <= 45 ? 10 : 15;
  return min * 60_000;
}

export const REMINDER_MS = 60_000;

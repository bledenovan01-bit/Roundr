// §7.3 / SU-02 / C15 — Tableau à élimination directe avec exemptions.
import type { Match, Slot, Team } from "./types";

export function nextPow2(n: number): number {
  let p = 1;
  while (p < n) p *= 2;
  return Math.max(2, p);
}

export function roundName(roundOf: number): string {
  switch (roundOf) {
    case 2:
      return "Finale";
    case 4:
      return "Demi-finale";
    case 8:
      return "Quart de finale";
    case 16:
      return "Huitième de finale";
    default:
      return `Tour de ${roundOf}`;
  }
}

// Construit tous les matchs du tableau. `seeds` ordonnés (tête de série en
// premier) : les exemptions vont aux premières places, sans match entre
// deux places vides. Appariement des extrêmes (C15).
export function buildBracket(
  seeds: Slot[],
  opts: { smallFinal: boolean; startOrder: number; idPrefix: string },
): Match[] {
  const P = nextPow2(seeds.length);
  const positions: (Slot | null)[] = Array.from({ length: P }, (_, i) => seeds[i] ?? null);
  const matches: Match[] = [];
  let order = opts.startOrder;
  let counter = 0;
  const mk = (partial: Omit<Match, "id" | "status" | "score" | "shootout" | "winnerId" | "finishReason" | "playedMs" | "finishedAt">): Match => ({
    id: `${opts.idPrefix}${++counter}`,
    status: "scheduled",
    score: null,
    shootout: null,
    winnerId: null,
    finishReason: null,
    playedMs: 0,
    finishedAt: null,
    ...partial,
  });

  // Premier tour : paires (i, P-1-i).
  let previous: Match[] = [];
  for (let i = 0; i < P / 2; i++) {
    const a = positions[i];
    const b = positions[P - 1 - i];
    const roundOf = P;
    const idx = previous.length + 1;
    if (a && !b) {
      const bye = mk({ order: -1, label: "Exempt", stage: "ko", roundOf, a, b: { kind: "tbd", label: "Exempt" } });
      bye.status = "bye";
      bye.winnerId = a.kind === "team" ? a.teamId : null;
      previous.push(bye);
    } else if (a && b) {
      previous.push(mk({ order: order++, label: `${roundName(roundOf)}${P > 2 ? ` ${idx}` : ""}`, stage: "ko", roundOf, a, b }));
    }
  }
  matches.push(...previous);

  let roundOf = P / 2;
  while (roundOf >= 2) {
    const current: Match[] = [];
    for (let i = 0; i < previous.length; i += 2) {
      const m1 = previous[i];
      const m2 = previous[i + 1];
      const idx = current.length + 1;
      current.push(
        mk({
          order: order++,
          label: `${roundName(roundOf)}${roundOf > 2 ? ` ${idx}` : ""}`,
          stage: "ko",
          roundOf,
          a: { kind: "winner", matchId: m1.id },
          b: { kind: "winner", matchId: m2.id },
        }),
      );
    }
    if (roundOf === 2 && opts.smallFinal && previous.length === 2 && previous.every((m) => m.status !== "bye")) {
      // Petite finale avant la finale (C15).
      const small = mk({
        order: current[0].order,
        label: "Petite finale",
        stage: "small",
        roundOf: 4,
        a: { kind: "loser", matchId: previous[0].id },
        b: { kind: "loser", matchId: previous[1].id },
      });
      current[0].order = order++;
      matches.push(small);
    }
    matches.push(...current);
    previous = current;
    roundOf /= 2;
  }
  return matches;
}

// Exemptions dans un tableau (places vides).
export function byeCount(n: number): number {
  return nextPow2(n) - n;
}

export function resolveSlot(slot: Slot, matches: Match[]): string | null {
  switch (slot.kind) {
    case "team":
      return slot.teamId;
    case "tbd":
      return null;
    case "winner": {
      const m = matches.find((x) => x.id === slot.matchId);
      if (!m || (m.status !== "finished" && m.status !== "bye")) return null;
      return m.winnerId;
    }
    case "loser": {
      const m = matches.find((x) => x.id === slot.matchId);
      if (!m || m.status !== "finished" || !m.winnerId) return null;
      const ids = [resolveSlot(m.a, matches), resolveSlot(m.b, matches)];
      return ids.find((id) => id && id !== m.winnerId) ?? null;
    }
  }
}

export function slotLabel(slot: Slot, matches: Match[], teams: Team[]): string {
  const id = resolveSlot(slot, matches);
  if (id) return teams.find((t) => t.id === id)?.name ?? "?";
  if (slot.kind === "winner" || slot.kind === "loser") {
    const m = matches.find((x) => x.id === slot.matchId);
    return `${slot.kind === "winner" ? "Vainqueur" : "Perdant"} ${m?.label ?? "?"}`;
  }
  if (slot.kind === "tbd") return slot.label;
  return "?";
}

export function matchTeams(m: Match, matches: Match[]): [string | null, string | null] {
  return [resolveSlot(m.a, matches), resolveSlot(m.b, matches)];
}

// Mélange déterministe à partir d'une graine (tirage persistant SU-03).
export function shuffleWithSeed<T>(items: T[], seed: number): T[] {
  const arr = [...items];
  let s = seed >>> 0;
  for (let i = arr.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) >>> 0;
    const j = s % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

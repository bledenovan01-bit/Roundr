// §5.3 Cup — poules, calendrier, qualification (C12–C15).
import type { Group, Match, Slot } from "./types";
import { compareAcrossGroups, computeStandings, type StandingRow } from "./standings";
import { nextPow2 } from "./bracket";

export const GROUP_LETTERS = "ABCDEFGH";

// C12 — nombre de poules recommandé : puissance de 2, ≥2 équipes par poule,
// taille moyenne la plus proche de 4, égalité vers le moins de poules.
export function recommendCup(n: number): { groups: number; qualifiersPerGroup: number } {
  if (n === 12) return { groups: 3, qualifiersPerGroup: 2 };
  let best = 1;
  let bestDist = Infinity;
  for (let g = 1; g <= 8; g *= 2) {
    if (n / g < 2) break;
    const dist = Math.abs(n / g - 4);
    if (dist < bestDist) {
      bestDist = dist;
      best = g;
    }
  }
  return { groups: best, qualifiersPerGroup: 2 };
}

export function groupSizes(n: number, groups: number): number[] {
  const base = Math.floor(n / groups);
  const rest = n % groups;
  return Array.from({ length: groups }, (_, i) => base + (i < rest ? 1 : 0));
}

// Vérifie la faisabilité (C12). Retourne null si OK, sinon l'explication.
export function validateCupStructure(n: number, groups: number, q: number): string | null {
  if (groups < 1 || groups > Math.floor(n / 2)) return `Entre 1 et ${Math.floor(n / 2)} poules pour ${n} équipes.`;
  const sizes = groupSizes(n, groups);
  if (q < 1 || q > Math.min(...sizes)) return `Qualifiés par poule : 1 à ${Math.min(...sizes)}.`;
  const total = groups * q;
  if (total > 32) return "Plus de 32 qualifiés : impossible.";
  const p = nextPow2(total);
  const extra = p - total;
  if (extra > 0 && (groups === 1 || extra >= groups || q >= Math.min(...sizes))) {
    return `${total} qualifiés ne forment pas un tableau complet. Ajuste poules ou qualifiés.`;
  }
  return null;
}

export function bestNextCount(groups: number, q: number): number {
  const total = groups * q;
  return nextPow2(total) - total;
}

export function buildGroups(teamIds: string[], groups: number, reference = false): Group[] {
  if (reference) return Array.from({ length: groups }, (_, i) => ({ id: "g" + i, name: "Poule " + String.fromCharCode(65 + i), teamIds: teamIds.filter((_, j) => j % groups === i) }));
  const sizes = groupSizes(teamIds.length, groups);
  let cursor = 0;
  return sizes.map((size, i) => {
    const ids = teamIds.slice(cursor, cursor + size);
    cursor += size;
    return { id: `g${i}`, name: `Poule ${GROUP_LETTERS[i]}`, teamIds: ids };
  });
}

// Tournoi toutes rondes (méthode du cercle) → rondes de paires.
function roundRobin(ids: string[]): [string, string][][] {
  const arr = [...ids];
  if (arr.length % 2 === 1) arr.push("");
  const n = arr.length;
  const rounds: [string, string][][] = [];
  for (let r = 0; r < n - 1; r++) {
    const round: [string, string][] = [];
    for (let i = 0; i < n / 2; i++) {
      const a = arr[i];
      const b = arr[n - 1 - i];
      if (a && b) round.push(r % 2 === 0 ? [a, b] : [b, a]);
    }
    rounds.push(round);
    arr.splice(1, 0, arr.pop()!);
  }
  return rounds;
}

// CU-02 / C12 — calendrier par rondes, en alternant les poules.
export function scheduleGroups(groups: Group[], doubleRound: boolean): Match[] {
  const perGroup = groups.map((g) => {
    const rounds = roundRobin(g.teamIds);
    if (doubleRound) rounds.push(...rounds.map((r) => r.map(([a, b]) => [b, a] as [string, string])));
    return rounds;
  });
  const maxRounds = Math.max(...perGroup.map((r) => r.length));
  const out: Match[] = [];
  for (let r = 0; r < maxRounds; r++) {
    groups.forEach((g, gi) => {
      const round = perGroup[gi][r];
      if (!round) return;
      round.forEach(([a, b]) => {
        const n = out.length + 1;
        out.push({
          id: `gm${n}`,
          order: n,
          label: `Match ${n} · ${g.name}`,
          stage: "group",
          groupId: g.id,
          a: { kind: "team", teamId: a },
          b: { kind: "team", teamId: b },
          status: "scheduled",
          score: null,
          shootout: null,
          winnerId: null,
          finishReason: null,
          playedMs: 0,
          finishedAt: null,
        });
      });
    });
  }
  return out;
}

export type Qualification =
  | { kind: "seeds"; seeds: Slot[] }
  | { kind: "tie"; candidates: string[]; slots: number; context: string };

// Sélectionne `slots` équipes dans `rows` (déjà triées) ; si l'égalité à la
// coupure n'est pas résolue par `chosen`, demande le choix (C14).
function takeWithTie(
  rows: StandingRow[],
  slots: number,
  equal: (a: StandingRow, b: StandingRow) => boolean,
  chosen: string[],
  context: string,
): { ids: string[] } | Qualification {
  if (slots <= 0) return { ids: [] };
  if (rows.length <= slots) return { ids: rows.map((r) => r.teamId) };
  const last = rows[slots - 1];
  const tiedBlock = rows.filter((r) => equal(r, last));
  if (tiedBlock.length <= 1 || !equal(rows[slots], last)) return { ids: rows.slice(0, slots).map((r) => r.teamId) };
  const sure = rows.filter((r) => !equal(r, last) && rows.indexOf(r) < slots).map((r) => r.teamId);
  const need = slots - sure.length;
  const picked = tiedBlock.filter((r) => chosen.includes(r.teamId)).map((r) => r.teamId);
  if (picked.length >= need) return { ids: [...sure, ...picked.slice(0, need)] };
  return { kind: "tie", candidates: tiedBlock.map((r) => r.teamId), slots: need, context };
}

export function computeQualification(
  groups: Group[],
  matches: Match[],
  q: number,
  chosen: string[] | Record<string, string[]>,
): Qualification {
  const choicesFor = (context: string) => Array.isArray(chosen) ? chosen : chosen[context] ?? [];
  const standings = groups.map((g) => computeStandings(g.teamIds, matches.filter((m) => m.groupId === g.id)));
  const sameRank = (a: StandingRow, b: StandingRow) => a.rank === b.rank;
  const direct: string[][] = [];
  const leftovers: StandingRow[] = [];
  for (let gi = 0; gi < groups.length; gi++) {
    const context = `Dernière place qualifiée · ${groups[gi].name}`;
    const res = takeWithTie(standings[gi], q, sameRank, choicesFor(context), context);
    if ("kind" in res) return res;
    direct.push(res.ids);
    leftovers.push(...standings[gi].filter((r) => !res.ids.includes(r.teamId)).slice(0, 1));
  }
  const extra = bestNextCount(groups.length, q);
  let seeds: Slot[] = [];
  // Ordre C15 : par rang, puis lettre de poule.
  for (let rank = 0; rank < q; rank++) {
    for (let gi = 0; gi < groups.length; gi++) {
      const id = direct[gi][rank];
      if (id) seeds.push({ kind: "team", teamId: id });
    }
  }
  if (extra > 0) {
    const perMatch = new Set(groups.map((g) => g.teamIds.length)).size > 1;
    const sorted = [...leftovers].sort((a, b) => compareAcrossGroups(a, b, perMatch));
    const res = takeWithTie(sorted, extra, (a, b) => compareAcrossGroups(a, b, perMatch) === 0, choicesFor("Meilleurs suivants"), "Meilleurs suivants");
    if ("kind" in res) return res;
    seeds = seeds.concat(res.ids.map((id) => ({ kind: "team", teamId: id })));
  }
  return { kind: "seeds", seeds };
}

// Optional new-launch policy. The legacy qualification function and ranking rules
// remain unchanged for existing sessions. Perfect ties still require a human choice.
export function computeConfiguredQualification(groups: Group[], matches: Match[], q: number, chosen: Record<string, string[]>, best: boolean, requireScheduledComplete = false): Qualification {
  const rows = groups.map(g => computeStandings(g.teamIds, matches.filter(m => m.groupId === g.id), true, requireScheduledComplete));
  const position = new Map<string, number>(), direct: StandingRow[] = [], leftovers: StandingRow[] = [];
  for (let i = 0; i < groups.length; i++) {
    const context = "Dernière place qualifiée · " + groups[i].name;
    const selected = takeWithTie(rows[i], q, (a,b) => a.rank === b.rank, chosen[context] ?? [], context);
    if ("kind" in selected) return selected;
    const ordered = [...selected.ids.map(id => rows[i].find(r => r.teamId === id)!), ...rows[i].filter(r => !selected.ids.includes(r.teamId))];
    ordered.forEach((r,j) => position.set(r.teamId,j));
    direct.push(...ordered.slice(0,q));
    if (ordered[q]) leftovers.push(ordered[q]);
  }
  const p = nextPow2(direct.length), extra = best && direct.length > 1 ? p - direct.length : 0;
  let qualified = [...direct];
  if (extra) {
    const sorted = [...leftovers].sort((a,b) => compareAcrossGroups(a,b,true));
    const picked = takeWithTie(sorted, extra, (a,b) => compareAcrossGroups(a,b,true) === 0, chosen["Meilleurs suivants"] ?? [], "Meilleurs suivants");
    if ("kind" in picked) return picked;
    qualified.push(...picked.ids.map(id => sorted.find(r => r.teamId === id)!));
  }
  const compare = (a: StandingRow,b: StandingRow) => (position.get(a.teamId)! - position.get(b.teamId)!) || compareAcrossGroups(a,b,true);
  qualified.sort(compare);
  const size = extra ? p : direct.length === p ? p : p / 2;
  if (qualified.length > size) {
    const context = "Places dans le tableau de " + size;
    const picked = takeWithTie(qualified, size, (a,b) => compare(a,b) === 0, chosen[context] ?? [], context);
    if ("kind" in picked) return picked;
    qualified = picked.ids.map(id => qualified.find(r => r.teamId === id)!);
  }
  return { kind: "seeds", seeds: qualified.map(r => ({ kind: "team", teamId: r.teamId })) };
}

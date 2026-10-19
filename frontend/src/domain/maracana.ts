// §5.2 Maracana — rotation continue (MA-01, MA-03, C07, C08, C09).
import type { MaracanaState, Match } from "./types";

export function initMaracana(teamIds: string[]): MaracanaState {
  const consecutive: Record<string, number> = {};
  teamIds.forEach((id) => (consecutive[id] = 0));
  return {
    onField: [teamIds[0], teamIds[1]],
    waiting: teamIds.slice(2),
    consecutive,
    initialOrder: [...teamIds],
    lastOut: [],
  };
}

function matchesPlayed(teamId: string, matches: Match[]): number {
  return matches.filter(
    (m) =>
      m.status === "finished" &&
      ((m.a.kind === "team" && m.a.teamId === teamId) ||
        (m.b.kind === "team" && m.b.teamId === teamId)),
  ).length;
}

function confrontations(x: string, y: string, matches: Match[]): number {
  return matches.filter((m) => {
    if (m.status !== "finished" || m.a.kind !== "team" || m.b.kind !== "team") return false;
    const ids = [m.a.teamId, m.b.teamId];
    return ids.includes(x) && ids.includes(y);
  }).length;
}

function lexLess(a: number[], b: number[]): boolean {
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return a[i] < b[i];
  return false;
}

// C08 — paire suivante parmi les équipes en attente (sortantes exclues).
export function pickNextPair(
  state: MaracanaState,
  candidates: string[],
  matches: Match[],
): [string, string] {
  let best: [string, string] | null = null;
  let bestKey: number[] = [];
  for (let i = 0; i < candidates.length; i++) {
    for (let j = i + 1; j < candidates.length; j++) {
      const x = candidates[i];
      const y = candidates[j];
      const key = [
        matchesPlayed(x, matches) + matchesPlayed(y, matches),
        confrontations(x, y, matches),
        state.waiting.indexOf(x) + state.waiting.indexOf(y),
        state.initialOrder.indexOf(x) + state.initialOrder.indexOf(y),
      ];
      if (!best || lexLess(key, bestKey)) {
        best = [x, y];
        bestKey = key;
      }
    }
  }
  return best!;
}

// Applique le résultat du match courant et prépare l'affiche suivante.
export function rotate(
  state: MaracanaState,
  winnerId: string | null,
  matches: Match[],
  opts?: { rotation?: "classic" | "winnerStays"; drawRule4?: "oneLeaves" | "bothLeave"; queuePolicy?: "lovable" },
): { state: MaracanaState; out: string[]; in: string[]; next: [string, string] } {
  const [a, b] = state.onField;
  const total = 2 + state.waiting.length;
  const consecutive = { ...state.consecutive, [a]: (state.consecutive[a] ?? 0) + 1, [b]: (state.consecutive[b] ?? 0) + 1 };
  const rotation = opts?.rotation ?? "classic";
  const drawRule4 = opts?.drawRule4 ?? "oneLeaves";

  // Départage de présence : la plus ancienne/longue présence sort (C07).
  const oldestOut = (): string => {
    if (consecutive[a] !== consecutive[b]) return consecutive[a] > consecutive[b] ? a : b;
    return state.initialOrder.indexOf(a) < state.initialOrder.indexOf(b) ? a : b;
  };
  // Un seul sort : le vainqueur (ou tenant) reste, l'autre sort, le suivant entre.
  const oneLeaves = (out: string) => {
    const stay = out === a ? b : a;
    const entering = state.waiting[0];
    consecutive[out] = 0;
    return {
      state: { ...state, onField: [stay, entering] as [string, string], waiting: [...state.waiting.slice(1), out], consecutive, lastOut: [out] },
      out: [out], in: [entering], next: [stay, entering] as [string, string],
    };
  };

  // Frozen Lovable FIFO. The optional flag leaves saved native rules untouched.
  if (opts?.queuePolicy === "lovable") {
    if (total === 3 || (rotation === "winnerStays" && (winnerId || drawRule4 === "oneLeaves"))) {
      return oneLeaves(winnerId === a ? b : a);
    }
    const next: [string, string] = [state.waiting[0], state.waiting[1]];
    const out = winnerId === b ? [b, a] : [a, b];
    consecutive[a] = 0; consecutive[b] = 0;
    return { state: { ...state, onField: next, waiting: [...state.waiting.slice(2), ...out], consecutive, lastOut: out }, out, in: [...next], next };
  }

  if (total <= 3) {
    // MA-01 : le vainqueur reste ; nul = plus ancienne présence sort ; C07.
    return oneLeaves(winnerId ? (winnerId === a ? b : a) : oldestOut());
  }

  // 4 équipes ou plus.
  if (rotation === "winnerStays") {
    if (winnerId) return oneLeaves(winnerId === a ? b : a); // le gagnant reste, le perdant sort
    if (drawRule4 === "oneLeaves") return oneLeaves(oldestOut()); // nul : une équipe sort (départage)
    // nul + "les deux sortent" → comme la rotation classique ci-dessous.
  }

  // Rotation classique (défaut) OU nul "les deux sortent" : MA-03, exclues du prochain (C08).
  consecutive[a] = 0;
  consecutive[b] = 0;
  const next = pickNextPair(state, state.waiting, matches);
  const waiting = [...state.waiting.filter((t) => !next.includes(t)), a, b];
  return {
    state: { ...state, onField: next, waiting, consecutive, lastOut: [a, b] },
    out: [a, b],
    in: [...next],
    next,
  };
}

// C09 — ajout en cours de session, à la transition uniquement.
export function addTeam(state: MaracanaState, teamId: string): MaracanaState {
  return {
    ...state,
    waiting: [...state.waiting, teamId],
    consecutive: { ...state.consecutive, [teamId]: 0 },
    initialOrder: [...state.initialOrder, teamId],
  };
}

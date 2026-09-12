// SC-02 / C13 — Classement 3/1/0 : points → confrontation directe →
// différence → buts marqués → victoires → ex æquo. Calculé depuis les
// résultats finalisés uniquement (jamais depuis les buts live).
import type { Match } from "./types";

export type StandingRow = {
  teamId: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  gf: number;
  gc: number;
  gd: number;
  points: number;
  rank: number; // rang sportif ; identique pour les ex æquo
  tied: boolean;
};

type Finished = { a: string; b: string; sa: number; sb: number };

// Ne retient que les matchs finalisés à deux équipes connues (TAB exclus).
export function finishedPairs(matches: Match[]): Finished[] {
  const out: Finished[] = [];
  for (const m of matches) {
    if (m.status !== "finished" || !m.score) continue;
    if (m.a.kind !== "team" || m.b.kind !== "team") continue;
    out.push({ a: m.a.teamId, b: m.b.teamId, sa: m.score[0], sb: m.score[1] });
  }
  return out;
}

function tally(teamIds: string[], pairs: Finished[]): Map<string, StandingRow> {
  const rows = new Map<string, StandingRow>();
  teamIds.forEach((id) =>
    rows.set(id, {
      teamId: id,
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      gf: 0,
      gc: 0,
      gd: 0,
      points: 0,
      rank: 0,
      tied: false,
    }),
  );
  for (const p of pairs) {
    const ra = rows.get(p.a);
    const rb = rows.get(p.b);
    if (!ra || !rb) continue;
    ra.played++;
    rb.played++;
    ra.gf += p.sa;
    ra.gc += p.sb;
    rb.gf += p.sb;
    rb.gc += p.sa;
    if (p.sa > p.sb) {
      ra.wins++;
      rb.losses++;
      ra.points += 3;
    } else if (p.sb > p.sa) {
      rb.wins++;
      ra.losses++;
      rb.points += 3;
    } else {
      ra.draws++;
      rb.draws++;
      ra.points++;
      rb.points++;
    }
  }
  rows.forEach((r) => (r.gd = r.gf - r.gc));
  return rows;
}

// Points de confrontation directe dans un mini-groupe. Retourne null si le
// mini-groupe est incomplet ou si les paires n'ont pas le même nombre de
// rencontres (C13 : critère ignoré).
function headToHead(ids: string[], pairs: Finished[]): Map<string, number> | null {
  const set = new Set(ids);
  const count = new Map<string, number>();
  const pts = new Map<string, number>(ids.map((i) => [i, 0]));
  for (const p of pairs) {
    if (!set.has(p.a) || !set.has(p.b)) continue;
    const key = [p.a, p.b].sort().join("|");
    count.set(key, (count.get(key) ?? 0) + 1);
    if (p.sa > p.sb) pts.set(p.a, (pts.get(p.a) ?? 0) + 3);
    else if (p.sb > p.sa) pts.set(p.b, (pts.get(p.b) ?? 0) + 3);
    else {
      pts.set(p.a, (pts.get(p.a) ?? 0) + 1);
      pts.set(p.b, (pts.get(p.b) ?? 0) + 1);
    }
  }
  const expectedPairs = (ids.length * (ids.length - 1)) / 2;
  if (count.size !== expectedPairs) return null;
  const counts = [...count.values()];
  if (counts.some((c) => c !== counts[0])) return null;
  return pts;
}

export function computeStandings(teamIds: string[], matches: Match[]): StandingRow[] {
  const pairs = finishedPairs(matches);
  const rows = tally(teamIds, pairs);
  const list = [...rows.values()];

  // Groupe par points, puis départage interne.
  const byPoints = new Map<number, StandingRow[]>();
  list.forEach((r) => {
    const g = byPoints.get(r.points) ?? [];
    g.push(r);
    byPoints.set(r.points, g);
  });

  const ordered: StandingRow[] = [];
  [...byPoints.keys()]
    .sort((a, b) => b - a)
    .forEach((points) => {
      const group = byPoints.get(points)!;
      const h2h = group.length > 1 ? headToHead(group.map((r) => r.teamId), pairs) : null;
      const key = (r: StandingRow) => [h2h?.get(r.teamId) ?? 0, r.gd, r.gf, r.wins];
      const cmp = (x: StandingRow, y: StandingRow) => {
        const kx = key(x);
        const ky = key(y);
        for (let i = 0; i < kx.length; i++) if (kx[i] !== ky[i]) return ky[i] - kx[i];
        return 0;
      };
      // Ordre stable d'affichage : ordre initial des équipes pour les ex æquo.
      const sorted = [...group].sort((x, y) => cmp(x, y) || teamIds.indexOf(x.teamId) - teamIds.indexOf(y.teamId));
      sorted.forEach((r, i) => {
        r.rank = ordered.length + 1;
        if (i > 0 && cmp(sorted[i - 1], r) === 0) {
          r.rank = sorted[i - 1].rank;
          r.tied = true;
          sorted[i - 1].tied = true;
        }
        ordered.push(r);
      });
    });
  return ordered;
}

// Comparaison entre poules (C14) : par match si tailles différentes.
export function compareAcrossGroups(a: StandingRow, b: StandingRow, perMatch: boolean): number {
  const k = (r: StandingRow) => {
    const d = perMatch && r.played > 0 ? r.played : 1;
    return [r.points / d, r.gd / d, r.gf / d, r.wins / d];
  };
  const ka = k(a);
  const kb = k(b);
  for (let i = 0; i < ka.length; i++) if (ka[i] !== kb[i]) return kb[i] - ka[i];
  return 0;
}

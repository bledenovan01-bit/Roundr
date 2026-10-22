import type { Team } from "./types";
import { shuffleWithSeed } from "./bracket";

export type TeamComposition = { teams: Team[]; groups: string[][]; savedAt?: number };
const key = (s: string) => s.trim().toLocaleLowerCase("fr-FR");
export function validComposition(value: unknown): value is TeamComposition {
  if (!value || typeof value !== "object") return false;
  const c = value as TeamComposition;
  if (!Array.isArray(c.teams) || c.teams.length < 2 || c.teams.length > 8 || !c.teams.every(t => t && typeof t.id === "string" && !!t.id && typeof t.name === "string" && !!t.name.trim() && t.name.length <= 18 && typeof t.color === "string" && !!t.color)) return false;
  if (new Set(c.teams.map(t => t.id)).size !== c.teams.length || new Set(c.teams.map(t => key(t.name))).size !== c.teams.length) return false;
  if (!Array.isArray(c.groups) || c.groups.length !== c.teams.length || !c.groups.every(g => Array.isArray(g) && g.length && g.every(p => typeof p === "string" && !!p.trim()))) return false;
  const players = c.groups.flat();
  return new Set(players.map(key)).size === players.length && (c.savedAt === undefined || (Number.isFinite(c.savedAt) && c.savedAt >= 0));
}
export const copyComposition = (c: TeamComposition): TeamComposition => ({ teams: c.teams.map(t => ({ ...t })), groups: c.groups.map(g => [...g]), ...(c.savedAt === undefined ? {} : { savedAt: c.savedAt }) });
export function editPlayer(players: string[], name: string, index: number | null = null): string[] | null {
  const clean = name.trim();
  if (!clean || clean.length > 20 || players.some((p,i) => i !== index && key(p) === key(clean))) return null;
  return index === null ? [...players, clean] : players.map((p,i) => i === index ? clean : p);
}
export function drawPlayers(players: string[], count: number, seed: number): string[][] {
  if (!Number.isInteger(count) || count < 2 || count > 8 || players.length < count || new Set(players.map(key)).size !== players.length || players.some(p => !p.trim())) throw Error("Répartition invalide");
  const groups = Array.from({ length: count }, () => [] as string[]);
  shuffleWithSeed(players, seed).forEach((p,i) => groups[i % count].push(p));
  return groups;
}
export function movePlayer(groups: string[][], from: number, index: number, target: number): string[][] {
  if (from === target || !groups[from]?.[index] || !groups[target]) return groups;
  const copy = groups.map(g => [...g]), [player] = copy[from].splice(index,1);
  copy[target].push(player);
  return copy;
}

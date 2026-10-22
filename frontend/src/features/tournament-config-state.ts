import { defaultConfig } from "@/src/domain/defaults";
import { nextPow2 } from "@/src/domain/bracket";
import type { CupConfig, SurvieConfig, Team } from "@/src/domain/types";
import { referenceTeamPalette } from "./lovable-config-state";

export type TournamentConfig = CupConfig | SurvieConfig;
const names = ["Les Renards", "FC Amigos", "Panthères", "Galactiques", "Tigers", "Squad FC", "Los Amigos", "Dream Team", "Titans", "Faucons", "Requins", "Lions", "Aigles", "Vikings", "Spartiates", "Comètes"];
export function tournamentTeams(count: number): Team[] {
  return Array.from({ length: count }, (_, i) => ({ id: "t" + (i + 1), name: names[i] ?? "Équipe " + (i + 1), color: referenceTeamPalette[i % referenceTeamPalette.length] }));
}
export function tournamentDefaults(mode: "cup" | "survie"): TournamentConfig {
  const base = { ...defaultConfig(mode), tournamentPolicy: "lovable" as const, name: "", launch: "manual" as const, launchDelaySec: 60, drawRule: "shootout" as const };
  return mode === "cup" ? { ...base, mode, matchMin: 10, groups: 2, qualifiersPerGroup: 2, doubleRound: false, smallFinal: true, extraMin: 5, groupAdditional: false, bestNext: false } as CupConfig
    : { ...base, mode, matchMin: 8, extraMin: 3, smallFinal: false, soundControl: "session" } as SurvieConfig;
}
export function cupPlan(c: CupConfig) {
  const groups = Math.max(1, Math.min(c.groups, Math.floor(c.teamCount / 2)));
  const size = Math.floor(c.teamCount / groups), qualified = Math.max(1, Math.min(c.qualifiersPerGroup, size));
  const direct = groups * qualified, bracket = nextPow2(direct), needBest = direct !== bracket && direct > 1;
  const bestCount = needBest && c.bestNext ? bracket - direct : 0;
  const finalSize = bestCount ? bracket : direct === bracket ? direct : bracket / 2;
  const rounds: number[] = []; for (let n = finalSize; n >= 2; n /= 2) rounds.push(n);
  const groupMatches = Array.from({ length: groups }, (_, i) => { const n = size + (i < c.teamCount % groups ? 1 : 0); return n * (n - 1) / 2; }).reduce((a,b) => a+b, 0) * (c.doubleRound ? 2 : 1);
  return { groups, size, qualified, direct, bracket, needBest, bestCount, finalSize, rounds, groupMatches };
}
export function normalizeTournament(c: TournamentConfig): TournamentConfig {
  const count = Math.max(c.mode === "cup" ? 4 : 2, Math.min(32, Math.trunc(c.teamCount)));
  if (c.mode === "survie") return { ...c, teamCount: count, smallFinal: count >= 4 && c.smallFinal };
  const plan = cupPlan({ ...c, teamCount: count });
  return { ...c, teamCount: count, groups: plan.groups, qualifiersPerGroup: plan.qualified };
}
export function tournamentRounds(c: TournamentConfig): number[] {
  if (c.mode === "cup") return cupPlan(c).rounds;
  const rounds: number[] = []; for (let n = nextPow2(c.teamCount); n >= 2; n /= 2) rounds.push(n);
  return rounds;
}
export const tournamentRoundName = (n: number) => n === 2 ? "Finale" : n === 4 ? "Demi-finales" : n === 8 ? "Quarts de finale" : n === 16 ? "Huitièmes" : "Tour de " + n;

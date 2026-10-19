import { defaultConfig } from "@/src/domain/defaults";
import type { ClassicConfig, MaracanaConfig, Team } from "@/src/domain/types";

// New configurations only. Restored sessions and replay configurations keep their values.
export function lovableLaunchDefaults(mode: "classique" | "maracana"): ClassicConfig | MaracanaConfig {
  if (mode === "classique") return { ...defaultConfig(mode) as ClassicConfig, totalMin: 30, periods: 2, additionalEachPeriod: true, soundControl: "session" };
  return { ...defaultConfig(mode) as MaracanaConfig, teamCount: 5, customTeams: true, queuePolicy: "lovable", soundControl: "session" };
}
export function lovableReplayConfig(config: ClassicConfig | MaracanaConfig): ClassicConfig | MaracanaConfig {
  return config.mode === "classique" ? { ...config, additionalEachPeriod: true, soundControl: "session" } : { ...config, queuePolicy: "lovable", soundControl: "session" };
}
// sRGB conversion of the reference's 28 OKLCH team colors, without changing saved colors.
export const referenceTeamPalette = ["#ff8900", "#5ad578", "#2e91ff", "#fd393f", "#fcca21", "#b671f9", "#43d5dc", "#f779ba", "#b1ef4a", "#00ba99", "#6cd3fa", "#6f71fb", "#e749df", "#f6a3af", "#e0af3b", "#f5f5f5", "#8b9095", "#393e42", "#305eb7", "#b3363d", "#96a136", "#96edc7", "#fa8467", "#c5b3ea", "#ae6f42", "#e0cba1", "#21914e", "#aa295f"];
const referenceTeamColors = [0, 1, 2, 5, 4, 3, 6, 7].map(index => referenceTeamPalette[index]);
const names = ["Les Renards", "FC Amigos", "Panthères", "Galactiques", "Tigers", "Squad FC", "Los Amigos", "Dream Team"];
export function lovableConfigTeams(mode: "classique" | "maracana", count: number): Team[] {
  const list = mode === "classique" ? names.slice(0, 2) : names;
  return Array.from({ length: count }, (_, i) => ({ id: `t${i + 1}`, name: list[i] ?? `Équipe ${i + 1}`, color: referenceTeamColors[i % referenceTeamColors.length] }));
}

// Retain edits in hidden rows, without colliding with IDs from an imported composition.
export function mergeConfigurationTeams(previous: Team[], visible: Team[]): Team[] {
  const ids = new Set(visible.map(team => team.id));
  return [...visible, ...previous.slice(visible.length).map(team => {
    let id = team.id;
    while (ids.has(id)) id += "_";
    ids.add(id);
    return id === team.id ? team : { ...team, id };
  })];
}

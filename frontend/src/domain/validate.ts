// Validation des configurations (CH-06, C05, C12). Retourne les messages
// bloquants ; vide = Lancer autorisé.
import { validateCupStructure } from "./cup";
import { periodsDelta } from "./custom-split";
import type { AnyConfig, Team } from "./types";

export function validateConfig(config: AnyConfig, teams: Team[]): string[] {
  const errors: string[] = [];
  const names = teams.map((t) => t.name.trim().toLowerCase());
  if (names.some((n) => !n)) errors.push("Chaque équipe doit avoir un nom.");
  if (new Set(names).size !== names.length) errors.push("Deux équipes portent le même nom.");

  if ("end" in config) {
    if (!config.end.byTime && config.end.goalTarget == null) errors.push("Active au moins une condition de fin (Au temps ou Premier à X buts).");
    if (config.end.goalTarget != null && (!Number.isInteger(config.end.goalTarget) || config.end.goalTarget <= 0)) errors.push("Le nombre de buts doit être un entier positif.");
  }

  switch (config.mode) {
    case "classique":
      if (!Number.isInteger(config.totalMin) || config.totalMin <= 0) errors.push("Durée totale : minutes entières > 0.");
      break;
    case "custom": {
      if (!Number.isInteger(config.totalMin) || config.totalMin <= 0) errors.push("Durée totale : minutes entières > 0.");
      if (config.end.byTime) {
        if (config.periodSec.some((s) => s < 1)) errors.push("Chaque période dure au moins 1 seconde.");
        const delta = periodsDelta(config.periodSec, config.totalMin * 60);
        if (delta !== 0) errors.push(`La somme des périodes diffère du total de ${Math.abs(delta / 60)} min (${delta > 0 ? "trop" : "pas assez"}).`);
      }
      if (config.savePreset && !config.presetName.trim()) errors.push("Donne un nom au preset.");
      break;
    }
    case "maracana":
      if (config.teamCount < 3 || config.teamCount > 8) errors.push("Maracana : 3 à 8 équipes.");
      break;
    case "survie":
      if (config.teamCount < 2 || config.teamCount > 32) errors.push("Survie : 2 à 32 équipes.");
      break;
    case "cup": {
      if (config.teamCount < 4 || config.teamCount > 32) errors.push("Cup : 4 à 32 équipes.");
      const e = validateCupStructure(config.teamCount, config.groups, config.qualifiersPerGroup);
      if (e) errors.push(e);
      break;
    }
  }
  if ("matchMin" in config && (!Number.isInteger(config.matchMin) || config.matchMin <= 0) && config.end.byTime) errors.push("Durée des matchs : minutes entières > 0.");
  return errors;
}

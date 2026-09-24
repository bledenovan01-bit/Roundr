// Validation des configurations (CH-06, C05, C12). Retourne les messages
// bloquants ; vide = Lancer autorisé.
import { validateCupStructure } from "./cup";
import { periodsDelta } from "./custom-split";
import type { AnyConfig, Team } from "./types";

export function validateConfig(config: AnyConfig, teams: Team[]): string[] {
  if (!config || !["classique", "custom", "maracana", "survie", "cup"].includes(config.mode)) return ["Mode invalide."];
  if (!Array.isArray(teams) || teams.some(t => !t || typeof t.id !== "string" || typeof t.name !== "string" || typeof t.color !== "string")) return ["Équipes invalides."];
  const errors: string[] = [];
  const positive = (n: unknown) => typeof n === "number" && Number.isSafeInteger(n) && n > 0 && Number.isSafeInteger(n * 60_000);
  if (new Set(teams.map(t => t.id)).size !== teams.length) errors.push("Identifiants d’équipe invalides.");
  if (typeof config.sounds !== "boolean" || typeof config.customTeams !== "boolean") errors.push("Options invalides.");
  const single = config.mode === "classique" || config.mode === "custom";
  if (teams.length !== (single ? 2 : config.teamCount)) errors.push("Nombre d’équipes incohérent.");
  if (single && (typeof config.score !== "boolean" || typeof config.additional !== "boolean")) errors.push("Options de match invalides.");
  if (config.mode === "custom" && (typeof config.autoSplit !== "boolean" || typeof config.savePreset !== "boolean")) errors.push("Options Custom invalides.");
  if ((config.mode === "cup" || config.mode === "survie") && typeof config.smallFinal !== "boolean") errors.push("Option petite finale invalide.");
  if (config.mode === "cup" && (typeof config.doubleRound !== "boolean" || typeof config.groupAdditional !== "boolean")) errors.push("Options Cup invalides.");
  if (single && (!Number.isSafeInteger(config.breakMin) || config.breakMin < 0 || !Number.isSafeInteger(config.breakMin * 60_000))) errors.push("Durée de pause invalide.");
  if (config.mode === "classique" && config.periods !== 1 && config.periods !== 2) errors.push("Nombre de périodes invalide.");
  if (config.mode === "custom" && (!Number.isSafeInteger(config.periods) || config.periods < 1 || config.periods > 12 || !Array.isArray(config.periodSec) || config.periodSec.length !== config.periods || config.periodSec.some(s => !Number.isSafeInteger(s) || s < 1) || typeof config.presetName !== "string")) return [...errors, "Périodes ou preset invalides."];
  if (config.mode === "survie" || config.mode === "cup") {
    if (!["shootout", "extraThenShootout", "golden"].includes(config.drawRule) || !positive(config.extraMin)) errors.push("Départage invalide.");
    if (!config.roundMinutes || typeof config.roundMinutes !== "object" || Object.entries(config.roundMinutes).some(([r, n]) => ![2, 4, 8, 16, 32].includes(Number(r)) || !positive(n))) errors.push("Durées par tour invalides.");
    if (!["random", "manual"].includes(config.draw)) errors.push("Tirage invalide.");
  }
  if (config.mode === "cup" && (!Number.isSafeInteger(config.groups) || config.groups < 1 || config.groups > 16 || !Number.isSafeInteger(config.qualifiersPerGroup))) return [...errors, "Structure des poules invalide."];
  const names = teams.map((t) => t.name.trim().toLowerCase());
  if (names.some((n) => !n)) errors.push("Chaque équipe doit avoir un nom.");
  if (new Set(names).size !== names.length) errors.push("Deux équipes portent le même nom.");

  if (config.mode !== "classique") {
    if (!config.end || typeof config.end.byTime !== "boolean") return [...errors, "Conditions de fin invalides."];
    if (!config.end.byTime && config.end.goalTarget == null) errors.push("Active au moins une condition de fin (Au temps ou Premier à X buts).");
    if (config.end.goalTarget != null && (!Number.isSafeInteger(config.end.goalTarget) || config.end.goalTarget <= 0)) errors.push("Le nombre de buts doit être un entier positif.");
  }

  switch (config.mode) {
    case "classique":
      if (!positive(config.totalMin)) errors.push("Durée totale : minutes entières > 0.");
      break;
    case "custom": {
      if (!positive(config.totalMin)) errors.push("Durée totale : minutes entières > 0.");
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
  if ("matchMin" in config && !positive(config.matchMin)) errors.push("Durée des matchs : minutes entières > 0.");
  return errors;
}



// Roundr V0 — Conventions C02 et paramètres métier centralisés (§16).
import type {
  AnyConfig,
  ClassicConfig,
  CupConfig,
  CustomConfig,
  MaracanaConfig,
  ModeId,
  SurvieConfig,
  Team,
} from "./types";
import { splitPeriods } from "./custom-split";
import { recommendCup } from "./cup";

export const CONVENTIONS = {
  MARACANA_EXTENSION_MS: 2 * 60_000, // MA-02
  DEFAULT_EXTRA_MIN: 2, // SC-03
  MAX_MARACANA_TEAMS: 8,
  ALERT_THRESHOLDS_MS: [3 * 60_000, 2 * 60_000, 60_000, 30_000], // §9
};

export const TEAM_PALETTE = [
  "#ff8331",
  "#53d273",
  "#3B82F6",
  "#F59E0B",
  "#EF4444",
  "#A855F7",
  "#14B8A6",
  "#F4F4F5",
];

export function uid(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export function classicBreakDefault(totalMin: number): number {
  return totalMin >= 90 ? 15 : 5; // C02
}

export function defaultConfig(mode: ModeId): AnyConfig {
  switch (mode) {
    case "classique":
      return {
        mode,
        totalMin: 10,
        periods: 1,
        breakMin: 5,
        additional: false,
        score: true,
        sounds: true,
        customTeams: false,
      } satisfies ClassicConfig;
    case "custom":
      return {
        mode,
        totalMin: 30,
        periods: 1,
        periodSec: splitPeriods(30 * 60, 1),
        autoSplit: true,
        breakMin: 3,
        end: { byTime: true, goalTarget: null },
        additional: false,
        score: true,
        sounds: true,
        customTeams: false,
        savePreset: false,
        presetName: "",
      } satisfies CustomConfig;
    case "maracana":
      return {
        mode,
        matchMin: 8,
        end: { byTime: true, goalTarget: null },
        teamCount: 3,
        sounds: true,
        customTeams: false,
      } satisfies MaracanaConfig;
    case "survie":
      return {
        mode,
        matchMin: 8,
        end: { byTime: true, goalTarget: null },
        teamCount: 8,
        drawRule: "extraThenShootout",
        extraMin: 2,
        smallFinal: false,
        draw: "random",
        roundMinutes: {},
        sounds: true,
        customTeams: false,
      } satisfies SurvieConfig;
    case "cup": {
      const rec = recommendCup(8);
      return {
        mode,
        matchMin: 8,
        end: { byTime: true, goalTarget: null },
        teamCount: 8,
        groups: rec.groups,
        doubleRound: false,
        qualifiersPerGroup: rec.qualifiersPerGroup,
        drawRule: "extraThenShootout",
        extraMin: 2,
        smallFinal: false,
        groupAdditional: false,
        draw: "random",
        roundMinutes: {},
        sounds: true,
        customTeams: false,
      } satisfies CupConfig;
    }
  }
}

// Noms génériques : Équipe A/B pour 2 équipes, Équipe 1..n sinon (§5).
export function defaultTeams(mode: ModeId, count: number): Team[] {
  const two = mode === "classique" || mode === "custom";
  return Array.from({ length: count }, (_, i) => ({
    id: `t${i + 1}`,
    name: two ? `Équipe ${i === 0 ? "A" : "B"}` : `Équipe ${i + 1}`,
    color: TEAM_PALETTE[i % TEAM_PALETTE.length],
  }));
}

export function teamCountFor(config: AnyConfig): number {
  switch (config.mode) {
    case "classique":
    case "custom":
      return 2;
    default:
      return config.teamCount;
  }
}

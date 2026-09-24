// Roundr V0 — Objets fonctionnels (§13 du cahier des charges).
import type { ChronoState, FinishReason } from "@/src/chrono/engine";
import type { GameModeId } from "@/src/data/modes";

export type ModeId = GameModeId;

export type Team = { id: string; name: string; color: string };

// CH-06 — deux cases indépendantes. goalTarget null = objectif OFF.
export type EndRules = { byTime: boolean; goalTarget: number | null };

// SC-03 — règle de nul en élimination.
export type DrawRule = "shootout" | "extraThenShootout" | "golden";

export type ClassicConfig = {
  mode: "classique";
  totalMin: number;
  periods: 1 | 2;
  breakMin: number;
  additional: boolean;
  score: boolean;
  sounds: boolean;
  customTeams: boolean;
};

export type CustomConfig = {
  mode: "custom";
  totalMin: number;
  periods: number;
  // Durée de chaque période en secondes (somme = totalMin*60). C05.
  periodSec: number[];
  autoSplit: boolean;
  breakMin: number;
  end: EndRules;
  additional: boolean;
  score: boolean;
  sounds: boolean;
  customTeams: boolean;
  savePreset: boolean;
  presetName: string;
};

export type MaracanaConfig = {
  mode: "maracana";
  matchMin: number;
  end: EndRules;
  teamCount: number;
  sounds: boolean;
  customTeams: boolean;
};

// Durées par tour (C15) indexées par taille du tour : 2 = finale, 4 = demies, 8 = quarts…
export type RoundMinutes = Partial<Record<number, number>>;

export type SurvieConfig = {
  mode: "survie";
  matchMin: number;
  end: EndRules;
  teamCount: number;
  drawRule: DrawRule;
  extraMin: number;
  smallFinal: boolean;
  draw: "random" | "manual";
  roundMinutes: RoundMinutes;
  sounds: boolean;
  customTeams: boolean;
};

export type CupConfig = {
  mode: "cup";
  matchMin: number;
  end: EndRules;
  teamCount: number;
  groups: number;
  doubleRound: boolean;
  qualifiersPerGroup: number;
  drawRule: DrawRule;
  extraMin: number;
  smallFinal: boolean;
  groupAdditional: boolean;
  draw: "random" | "manual";
  roundMinutes: RoundMinutes;
  sounds: boolean;
  customTeams: boolean;
};

export type AnyConfig =
  | ClassicConfig
  | CustomConfig
  | MaracanaConfig
  | SurvieConfig
  | CupConfig;

// Place d'un match : équipe connue ou dépendance (§13 Tournoi).
export type Slot =
  | { kind: "team"; teamId: string }
  | { kind: "winner"; matchId: string }
  | { kind: "loser"; matchId: string }
  | { kind: "tbd"; label: string };

export type MatchStage = "single" | "rotation" | "group" | "ko" | "small";

export type Match = {
  id: string;
  order: number;
  label: string;
  stage: MatchStage;
  groupId?: string;
  roundOf?: number; // taille du tour (2 = finale)
  a: Slot;
  b: Slot;
  status: "scheduled" | "live" | "finished" | "bye";
  score: [number, number] | null; // buts de jeu, TAB exclus
  shootout: [number, number] | null;
  winnerId: string | null; // null = nul
  finishReason: FinishReason | "goalTarget" | "extension" | null;
  playedMs: number;
  finishedAt: number | null;
};

export type LiveStage =
  | "period"
  | "break"
  | "awaitPeriod"
  | "additional"
  | "extra"
  | "golden"
  | "shootout"
  | "finished";

// État temporel du match actif. Le chrono (moteur commun) porte le temps
// de la phase en cours ; playedMs cumule les phases de jeu terminées.
export type Live = {
  matchId: string;
  periodMs: number[];
  breakMs: number;
  end: EndRules;
  additional: boolean;
  scoreOn: boolean;
  drawRule: DrawRule | null; // null = nul accepté
  extraMs: number;
  maracanaExtension: boolean; // MA-02 applicable (3 équipes)
  stage: LiveStage;
  periodIndex: number;
  chrono: ChronoState;
  playedMs: number;
  score: [number, number];
  firedAlerts: string[];
  extensionUsed: boolean;
  prevStage: LiveStage | null; // étape avant finalisation (C16)
  finishCount: boolean; // le temps de la phase finale a-t-il été ajouté à playedMs
  finishedAt: number | null;
  startedAt: number;
};

export type MaracanaState = {
  onField: [string, string];
  waiting: string[]; // ordre d'arrivée en attente
  consecutive: Record<string, number>; // présence consécutive (matchs)
  initialOrder: string[];
  lastOut: string[];
};

export type Group = { id: string; name: string; teamIds: string[] };

export type CupState = {
  groups: Group[];
  phase: "groups" | "knockout";
  // Égalité parfaite à la coupure (C14) : choix explicite requis.
  tieChoice: { candidates: string[]; slots: number; context: string } | null;
  qualifiedIds: string[];
  qualificationChoices?: Record<string, string[]>;
};

export type Session = {
  id: string;
  mode: ModeId;
  config: AnyConfig;
  teams: Team[];
  createdAt: number;
  updatedAt: number;
  endedAt: number | null;
  status: "active" | "finished" | "interrupted";
  matches: Match[];
  live: Live | null;
  maracana: MaracanaState | null;
  cup: CupState | null;
  // Instantané avant la finalisation du dernier match (C16, correction).
  preFinish: {
    matches: Match[];
    maracana: MaracanaState | null;
    cup: CupState | null;
  } | null;
  lastEvent: string | null;
};

export type Preset = {
  id: string;
  name: string;
  config: CustomConfig;
  teams: Team[] | null;
  createdAt: number;
};



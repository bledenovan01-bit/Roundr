// Chrono libre (Phase 3 — réf. Lovable). Module AUTONOME : n'affecte ni le
// moteur de session (matchs/tournois) ni ses sauvegardes. Modèle temporel basé
// sur des horodatages (comme le moteur chrono) pour un calcul fiable.
import type { Preset, Team } from "./types";

export type FreeTimerDisplay = "numeric" | "circular" | "analog";
export type FreeTimerKind = "stopwatch" | "countdown" | "interval";

type Base = { withTeams: boolean; display: FreeTimerDisplay; sounds: boolean; teams?: Team[]; scoreOn?: boolean };
export type StopwatchConfig = { kind: "stopwatch" } & Base;
export type CountdownConfig = { kind: "countdown"; durationMs: number; endSignal: boolean } & Base;
export type IntervalConfig = {
  kind: "interval";
  // Optional: old saves retain their exact repeated-work sequence. New configs
  // repeat this list (one series) `sets` times, with restMs only inside a series.
  periodsMs?: number[];
  workMs: number;
  restMs: number;
  reps: number;
  sets: number;
  restBetweenSetsMs: number;
  autoChain: boolean;
  endSignal: boolean;
} & Base;
export type FreeTimerConfig = StopwatchConfig | CountdownConfig | IntervalConfig;

export type FreeTimerPreset = { id: string; name: string; config: FreeTimerConfig; createdAt: number };

export type StepType = "work" | "rest" | "restSet";
export type FreeStep = { type: StepType; durationMs: number | null; label: string; rep: number; set: number; totalReps: number; totalSets: number };

// --- Presets Lovable ----------------------------------------------------------
export const COUNTDOWN_PRESETS_MS = [60_000, 300_000, 600_000, 900_000, 1_800_000]; // 1,5,10,15,30 min
export const INTERVAL_PRESETS: { name: string; workMs: number; restMs: number; reps: number; sets: number }[] = [
  { name: "30 / 30", workMs: 30_000, restMs: 30_000, reps: 8, sets: 1 },
  { name: "Tabata", workMs: 20_000, restMs: 10_000, reps: 8, sets: 1 },
];

export function defaultConfig(kind: FreeTimerKind): FreeTimerConfig {
  const base: Base = { withTeams: false, display: "numeric", sounds: true };
  if (kind === "stopwatch") return { kind, ...base };
  if (kind === "countdown") return { kind, durationMs: 600_000, endSignal: true, ...base };
  return { kind: "interval", workMs: 30_000, restMs: 30_000, reps: 8, sets: 1, restBetweenSetsMs: 60_000, autoChain: true, endSignal: true, ...base };
}

// Séquence de steps déroulée pour l'exécution.
export function buildSteps(c: FreeTimerConfig): FreeStep[] {
  if (c.kind === "stopwatch") return [{ type: "work", durationMs: null, label: "Chronomètre", rep: 1, set: 1, totalReps: 1, totalSets: 1 }];
  if (c.kind === "countdown") return [{ type: "work", durationMs: c.durationMs, label: "Compte à rebours", rep: 1, set: 1, totalReps: 1, totalSets: 1 }];
  const steps: FreeStep[] = [];
  const reps = Math.max(1, Math.floor(c.reps));
  const sets = Math.max(1, Math.floor(c.sets));
  for (let s = 1; s <= sets; s++) {
    for (let r = 1; r <= reps; r++) {
      steps.push({ type: "work", durationMs: c.periodsMs?.[r - 1] ?? Math.max(1000, c.workMs), label: c.periodsMs ? reps > 1 ? `Période ${r}` : "Travail" : "Effort", rep: r, set: s, totalReps: reps, totalSets: sets });
      if (r < reps && c.restMs > 0) steps.push({ type: "rest", durationMs: c.restMs, label: "Repos", rep: r, set: s, totalReps: reps, totalSets: sets });
    }
    if (s < sets && c.restBetweenSetsMs > 0) steps.push({ type: "restSet", durationMs: c.restBetweenSetsMs, label: "Repos entre séries", rep: reps, set: s, totalReps: reps, totalSets: sets });
  }
  return steps;
}

export type FreeTimerState = {
  config: FreeTimerConfig;
  steps: FreeStep[];
  stepIndex: number;
  stepAccumulatedMs: number; // temps figé accumulé dans le step courant
  stepStartedAt: number; // horodatage de reprise ; 0 si en pause/arrêt
  running: boolean;
  finished: boolean;
  laps: number[]; // chrono croissant : total écoulé à chaque tour
  score: number[]; // old saves: pair; configured teams: 2–8 independent scores
  createdAt: number;
};

export function createFreeTimer(config: FreeTimerConfig): FreeTimerState {
  const snapshot = JSON.parse(JSON.stringify(config)) as FreeTimerConfig;
  return { config: snapshot, steps: buildSteps(snapshot), stepIndex: 0, stepAccumulatedMs: 0, stepStartedAt: 0, running: false, finished: false, laps: [], score: Array(snapshot.withTeams && snapshot.teams ? snapshot.teams.length : 2).fill(0), createdAt: Date.now() };
}

export function stepElapsed(ft: FreeTimerState, now: number): number {
  return ft.stepAccumulatedMs + (ft.running ? Math.max(0, now - ft.stepStartedAt) : 0);
}

export function currentStep(ft: FreeTimerState): FreeStep | null {
  return ft.steps[ft.stepIndex] ?? null;
}

// Avance les transitions de steps (auto-chaînage) et détecte la fin.
// Ne dépend QUE d'horodatages fiables, pas d'un intervalle d'affichage.
export function advanceFree(ft: FreeTimerState, now: number): FreeTimerState {
  if (!ft.running || ft.finished) return ft;
  let cur = ft;
  for (let guard = 0; guard < 10_000; guard++) {
    const step = cur.steps[cur.stepIndex];
    if (!step || step.durationMs == null) return cur; // step ouvert (chronomètre) : jamais de fin auto
    const el = cur.stepAccumulatedMs + Math.max(0, now - cur.stepStartedAt);
    if (el < step.durationMs) return cur;
    const overflow = el - step.durationMs;
    const isLast = cur.stepIndex >= cur.steps.length - 1;
    if (isLast) return { ...cur, finished: true, running: false, stepAccumulatedMs: step.durationMs, stepStartedAt: 0 };
    const autoChain = cur.config.kind === "interval" ? cur.config.autoChain : true;
    if (!autoChain) return { ...cur, running: false, stepAccumulatedMs: step.durationMs, stepStartedAt: 0 }; // attend un passage manuel
    cur = { ...cur, stepIndex: cur.stepIndex + 1, stepAccumulatedMs: overflow, stepStartedAt: now };
  }
  return cur;
}

export function startFree(ft: FreeTimerState, now: number): FreeTimerState {
  if (ft.finished) return ft;
  return { ...ft, running: true, stepStartedAt: now };
}
export function pauseFree(ft: FreeTimerState, now: number): FreeTimerState {
  if (!ft.running) return ft;
  return { ...ft, running: false, stepAccumulatedMs: stepElapsed(ft, now), stepStartedAt: 0 };
}
export function toggleFree(ft: FreeTimerState, now: number): FreeTimerState {
  return ft.running ? pauseFree(ft, now) : startFree(ft, now);
}
// Passage manuel au step suivant (chaînage manuel des intervalles).
export function nextStep(ft: FreeTimerState, now: number): FreeTimerState {
  if (ft.stepIndex >= ft.steps.length - 1) return { ...ft, finished: true, running: false, stepStartedAt: 0 };
  return { ...ft, stepIndex: ft.stepIndex + 1, stepAccumulatedMs: 0, stepStartedAt: ft.running ? now : 0, finished: false };
}
// Tour (chrono croissant) : enregistre le total écoulé courant.
export function recordLap(ft: FreeTimerState, now: number): FreeTimerState {
  return { ...ft, laps: [...ft.laps, stepElapsed(ft, now)] };
}
// Réinitialiser le chrono : temps + tours à zéro, SCORES CONSERVÉS.
export function resetTime(ft: FreeTimerState, now: number): FreeTimerState {
  return { ...ft, steps: buildSteps(ft.config), stepIndex: 0, stepAccumulatedMs: 0, stepStartedAt: ft.running ? now : 0, finished: false, laps: [] };
}
// Recommencer la séance : temps + tours + SCORES à zéro, arrêté.
export function restartSession(ft: FreeTimerState): FreeTimerState {
  return { ...ft, steps: buildSteps(ft.config), stepIndex: 0, stepAccumulatedMs: 0, stepStartedAt: 0, running: false, finished: false, laps: [], score: ft.score.map(() => 0) };
}

// Splits (durée de chaque tour) à partir des totaux cumulés.
export function lapSplits(laps: number[]): number[] {
  return laps.map((t, i) => (i === 0 ? t : t - laps[i - 1]));
}
// Index du tour le plus rapide / le plus lent (sur les splits). -1 si < 2 tours.
export function lapExtremes(laps: number[]): { fastest: number; slowest: number } {
  const splits = lapSplits(laps);
  if (splits.length < 2) return { fastest: -1, slowest: -1 };
  let fastest = 0, slowest = 0;
  splits.forEach((s, i) => { if (s < splits[fastest]) fastest = i; if (s > splits[slowest]) slowest = i; });
  return { fastest, slowest };
}

// --- Migration non destructive des anciens presets Custom --------------------
// Un ancien preset Custom (durée totale) devient un compte à rebours équivalent.
// Les presets d'origine ne sont JAMAIS supprimés (conservés dans KEYS.presets).
export function migrateCustomPreset(p: Preset): FreeTimerPreset | null {
  if (!p || p.config?.mode !== "custom") return null;
  const totalMin = typeof (p.config as { totalMin?: number }).totalMin === "number" ? (p.config as { totalMin: number }).totalMin : 0;
  const durationMs = Math.max(1000, Math.round(totalMin * 60_000));
  return {
    id: `free-mig-${p.id}`,
    name: p.name,
    config: { kind: "countdown", durationMs, endSignal: true, withTeams: !!p.config.customTeams, display: "numeric", sounds: p.config.sounds !== false },
    createdAt: typeof p.createdAt === "number" ? p.createdAt : Date.now(),
  };
}

// --- Validation (stockage) ----------------------------------------------------
const isFiniteNum = (x: unknown): x is number => typeof x === "number" && Number.isFinite(x);
export function validFreeConfig(c: unknown): c is FreeTimerConfig {
  if (!c || typeof c !== "object" || Array.isArray(c)) return false;
  const o = c as Record<string, unknown>;
  if (o.scoreOn !== undefined && typeof o.scoreOn !== "boolean") return false;
  if (o.teams !== undefined) {
    if (!Array.isArray(o.teams) || o.teams.length < 2 || o.teams.length > 8 || !o.teams.every(t => t && typeof t.id === "string" && typeof t.name === "string" && typeof t.color === "string") || new Set(o.teams.map(t => t.id)).size !== o.teams.length) return false;
    if (o.withTeams && (o.teams.some(t => !t.name.trim()) || new Set(o.teams.map(t => t.name.trim().toLocaleLowerCase())).size !== o.teams.length)) return false;
  }
  if (o.periodsMs !== undefined && (o.kind !== "interval" || !Array.isArray(o.periodsMs) || o.periodsMs.length < 1 || o.periodsMs.length > 12 || o.reps !== o.periodsMs.length || !o.periodsMs.every(n => Number.isSafeInteger(n) && n >= 5000 && n <= 3600000) || o.workMs !== o.periodsMs[0] || !Number.isSafeInteger(o.sets) || (o.sets as number) > 20)) return false;
  if (typeof o.withTeams !== "boolean" || typeof o.sounds !== "boolean") return false;
  if (o.display !== "numeric" && o.display !== "circular" && o.display !== "analog") return false;
  if (o.kind === "stopwatch") return true;
  if (o.kind === "countdown") return isFiniteNum(o.durationMs) && o.durationMs > 0 && o.durationMs <= Number.MAX_SAFE_INTEGER && typeof o.endSignal === "boolean";
  if (o.kind === "interval") return isFiniteNum(o.workMs) && o.workMs > 0 && o.workMs <= Number.MAX_SAFE_INTEGER && isFiniteNum(o.restMs) && o.restMs >= 0 && o.restMs <= Number.MAX_SAFE_INTEGER && Number.isSafeInteger(o.reps) && (o.reps as number) >= 1 && Number.isSafeInteger(o.sets) && (o.sets as number) >= 1 && (o.reps as number) * (o.sets as number) <= 5000 && isFiniteNum(o.restBetweenSetsMs) && o.restBetweenSetsMs >= 0 && o.restBetweenSetsMs <= Number.MAX_SAFE_INTEGER && typeof o.autoChain === "boolean" && typeof o.endSignal === "boolean";
  return false;
}
export function validFreePreset(p: unknown): p is FreeTimerPreset {
  if (!p || typeof p !== "object") return false;
  const o = p as Record<string, unknown>;
  return typeof o.id === "string" && o.id.length > 0 && typeof o.name === "string" && isFiniteNum(o.createdAt) && o.createdAt >= 0 && validFreeConfig(o.config);
}

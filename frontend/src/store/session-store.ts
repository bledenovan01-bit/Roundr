// Roundr V0 — Store local unique (session active + dernier résumé + presets).
// §10 / C20 : persistance à chaque mutation utile, erreurs signalées, aucune
// sauvegarde lisible n'est écrasée par une sauvegarde vide.
import AsyncStorage from "@react-native-async-storage/async-storage";
import { emptyMatchDetail, recordMatchDetail } from "@/src/domain/match-detail";
import { useSyncExternalStore } from "react";

import { getPreferences } from "./preferences";
import { playSound } from "@/src/audio/sounds";
import { advance, endSession, sessionComplete } from "@/src/domain/session";
import { competitionKey, HISTORY_INDEX, HISTORY_PREFIX, isCompetition, snapshotCompetition, validCompetitionRecord, type Competition, type CompetitionRecord } from "./competition-history";
import { sessionEvents, type SessionEvent } from "@/src/domain/session-events";
import { validPreset, validSession } from "./storage-validation";
import { restoreFreeTimer, validFreeTimer } from "./free-timer-validation";
import { migrateCustomPreset, validFreePreset, advanceFree, type FreeTimerPreset, type FreeTimerState } from "@/src/domain/free-timer";
import * as Haptics from "@/src/haptics";
import type { Preset, Session } from "@/src/domain/types";

const KEYS = {
  session: "roundr.session.v1",
  summary: "roundr.summary.v1",
  presets: "roundr.presets.v1",
  corrupt: "roundr.session.corrupt.v1",
  freePresets: "roundr.free-presets.v1",
  freeTimer: "roundr.free-timer.v1",
  previousFreeTimer: "roundr.free-timer.previous.v1",
  freeMigrated: "roundr.free-presets.migrated.v1",
};

export type StoreState = {
  loaded: boolean;
  loading: boolean;
  replacingFreeTimer: boolean;
  legacyRecovery: FreeTimerPreset[] | null;
  storageInfo: string | null;
  session: Session | null;
  lastSummary: Session | null;
  presets: Preset[];
  saveError: string | null;
  now: number; // horloge de rendu (tick)
  notice: { message: string; until: number; tone: "warmup" | "time" } | null;
  freePresets: FreeTimerPreset[];
  freeTimer: FreeTimerState | null;
  competitions: Competition[];
  historyAvailable: boolean;
};

let state: StoreState = {
  loaded: false,
  loading: false,
  replacingFreeTimer: false,
  legacyRecovery: null,
  storageInfo: null,
  session: null,
  lastSummary: null,
  presets: [],
  saveError: null,
  now: Date.now(),
  notice: null,
  freePresets: [],
  freeTimer: null,
  competitions: [],
  historyAvailable: false,
};
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}
function set(partial: Partial<StoreState>) {
  state = { ...state, ...partial };
  emit();
}

// Storage operations share one queue, including raw backups and migration commits.
// A failed operation is retained until that SAME resource is successfully saved.
type Write = { key: string; raw: string | null; dependency?: Write; succeeded: boolean };
type Marker = { version: 2; sourceIds: string[] };
let pendingWrite: Promise<unknown> = Promise.resolve();
const errors = new Map<string, string>();
const failedWrites = new Map<string, Write>();
const desiredWrites = new Map<string, Write>();
const records = new WeakMap<Promise<boolean>, Write>();
const blocked = new Set<string>();
const backedInvalid = new Set<string>();
const known = new Set<string>();
let migrationMarker: Marker | "legacy" | "ambiguous" | null = null;
let loadPromise: Promise<void> | null = null;
let retryPromise: Promise<void> | null = null;
let replacementPromise: Promise<boolean> | null = null;
let historyWork: Promise<unknown> = Promise.resolve();
let freePresetWork: Promise<unknown> = Promise.resolve();
const deletedCompetitions = new Set<string>();
const pendingCompetitions = new Map<string, Session>();
let pendingSummary: Session | null = null;
const labels: Record<string, string> = {
  [KEYS.session]: "session de match", [KEYS.summary]: "résumé", [KEYS.presets]: "anciens chronos",
  [KEYS.freePresets]: "Mes chronos", [KEYS.freeTimer]: "chrono libre", [KEYS.freeMigrated]: "migration des chronos",
  [KEYS.previousFreeTimer]: "séance précédente du chrono libre",
  [HISTORY_INDEX]: "historique des compétitions",
};
function acceptCompetition(record: CompetitionRecord) {
  const others = state.competitions.filter(c => c.id !== record.id);
  if ("deleted" in record) { deletedCompetitions.add(record.id); set({ competitions: others }); }
  else { deletedCompetitions.delete(record.id); set({ competitions: [...others, record] }); }
}
function showErrors() { set({ saveError: [...new Set(errors.values())].join(" ") || null, historyAvailable: known.has(HISTORY_INDEX) && ![...blocked].some(k => k === HISTORY_INDEX || k.startsWith(HISTORY_PREFIX)) }); }
function issue(id: string, message: string) { errors.set(id, message); showErrors(); }
function queueWrite(write: Write): Promise<boolean> {
  const operation = pendingWrite.then(async () => {
    if (write.dependency && !write.dependency.succeeded) {
      failedWrites.set(write.key, write);
      issue("write:" + write.key, "Sauvegarde en attente : l’enregistrement préalable a échoué. Réessaie.");
      return false;
    }
    try {
      if (write.raw === null) await AsyncStorage.removeItem(write.key);
      else await AsyncStorage.setItem(write.key, write.raw);
      write.succeeded = true;
      if (write.key.startsWith(HISTORY_PREFIX) && write.raw) acceptCompetition(JSON.parse(write.raw) as CompetitionRecord);
      failedWrites.delete(write.key);
      errors.delete("write:" + write.key);
      errors.delete("input:" + write.key);
      if (backedInvalid.has(write.key)) {
        backedInvalid.delete(write.key); blocked.delete(write.key); known.add(write.key);
        errors.delete("invalid:" + write.key);
      }
      // Explicit replacement is only possible after a successful read. Raw
      // rejected data stays blocked; an unrelated write cannot clear its error.
      if (write.key === KEYS.freeMigrated && write.raw) {
        migrationMarker = JSON.parse(write.raw) as Marker;
        blocked.delete(write.key);
        errors.delete("invalid:" + write.key);
      }
      showErrors();
      return true;
    } catch {
      failedWrites.set(write.key, write);
      issue("write:" + write.key, "Sauvegarde impossible (" + (write.key.startsWith(HISTORY_PREFIX) ? "historique de la compétition" : labels[write.key] ?? "copie de secours") + "). Garde l’application ouverte et réessaie.");
      return false;
    }
  });
  pendingWrite = operation;
  records.set(operation, write);
  return operation;
}
function persistRaw(key: string, raw: string | null, prerequisite?: Promise<boolean>) {
  const write: Write = { key, raw, succeeded: false, dependency: prerequisite ? records.get(prerequisite) : undefined };
  desiredWrites.set(key, write);
  return queueWrite(write);
}
function persist(key: string, value: unknown, prerequisite?: Promise<boolean>): Promise<boolean> {
  return persistRaw(key, value == null ? null : JSON.stringify(value), prerequisite);
}
// Deterministic synchronization for tests and callers; includes writes added
// by completions, rather than guessing how long the storage device takes.
export async function flushStorage(): Promise<void> {
  for (;;) {
    const current = pendingWrite;
    const history = historyWork;
    const presets = freePresetWork;
    await current;
    await history;
    await presets;
    if (replacementPromise) await replacementPromise;
    if (current === pendingWrite && history === historyWork && presets === freePresetWork && !replacementPromise) return;
  }
}
function writable(...keys: string[]): boolean {
  if (!state.loaded || state.loading) {
    issue("loading", "Chargement des sauvegardes en cours. Réessaie après le chargement.");
    return false;
  }
  if (keys.some(key => blocked.has(key) && !backedInvalid.has(key))) {
    showErrors();
    return false;
  }
  return true;
}
function arrayOf<T>(value: unknown, valid: (x: unknown) => x is T): value is T[] {
  return Array.isArray(value) && value.every(valid) && new Set(value.map(x => (x as { id: string }).id)).size === value.length;
}
function validMarker(value: unknown): value is Marker {
  if (!value || typeof value !== "object") return false;
  const m = value as Marker;
  return m.version === 2 && Array.isArray(m.sourceIds) && m.sourceIds.every(x => typeof x === "string") && new Set(m.sourceIds).size === m.sourceIds.length;
}
async function preserveRaw(key: string, raw: string): Promise<boolean> {
  // Content-based name plus collision check: never replace an older raw copy.
  let hash = 2166136261;
  for (let i = 0; i < raw.length; i++) hash = Math.imul(hash ^ raw.charCodeAt(i), 16777619);
  const base = key.startsWith(HISTORY_PREFIX) ? "roundr.competitions.rejected.v1." + key.slice(HISTORY_PREFIX.length) : key === KEYS.session ? KEYS.corrupt : key + ".corrupt";
  for (let i = 0; ; i++) {
    const backup = base + (i ? "." + (hash >>> 0).toString(16) + "." + i : "");
    try {
      const existing = await AsyncStorage.getItem(backup);
      errors.delete("read:" + backup);
      if (existing !== null && existing !== raw) continue;
      // Even an existing identical copy must go through the queue to clear a
      // previous failure for this exact backup operation.
      return await persistRaw(backup, raw);
    } catch {
      issue("read:" + backup, "Lecture de la copie de secours impossible. L’original n’a pas été remplacé.");
      return false;
    }
  }
}
async function migratePresets(explicit?: "recover" | "skip"): Promise<boolean> {
  if (![KEYS.presets, KEYS.freePresets, KEYS.freeMigrated].every(key => known.has(key)) || blocked.has(KEYS.presets) || blocked.has(KEYS.freePresets)) return false;
  const converted = state.presets.map(migrateCustomPreset).filter((x): x is FreeTimerPreset => x !== null);
  const existing = new Set(state.freePresets.map(p => p.id));
  const handled = typeof migrationMarker === "object" && migrationMarker ? migrationMarker.sourceIds : [];
  const missing = converted.filter(p => !existing.has(p.id) && !handled.includes(p.id));
  const ambiguous = migrationMarker === "ambiguous" || (migrationMarker === "legacy" && missing.length > 0);
  if (ambiguous && !explicit) { set({ legacyRecovery: missing }); return false; }
  if (validMarker(migrationMarker) && missing.length === 0 && !explicit) { set({ legacyRecovery: null }); return true; }
  const next = explicit === "skip" ? state.freePresets : [...state.freePresets, ...missing];
  set({ freePresets: next });
  // Data first, marker second. Existing objects, edits and originals survive.
  if (!(await persist(KEYS.freePresets, next))) return false;
  const marker: Marker = { version: 2, sourceIds: [...new Set([...handled, ...converted.map(p => p.id), ...next.filter(p => p.id.startsWith("free-mig-")).map(p => p.id)])] };
  if (!(await persist(KEYS.freeMigrated, marker))) return false;
  set({ legacyRecovery: null });
  return true;
}
let recoveryPromise: Promise<boolean> | null = null;
export function resolveLegacyRecovery(recover: boolean): Promise<boolean> {
  if (recoveryPromise) return recoveryPromise;
  if (!writable(KEYS.freePresets) || state.legacyRecovery === null) return Promise.resolve(false);
  if(retryPromise)return retryPromise.then(()=>resolveLegacyRecovery(recover));
  recoveryPromise = freePresetWork.then(()=>migratePresets(recover ? "recover" : "skip")).finally(() => { recoveryPromise = null; });
  freePresetWork = recoveryPromise.then(()=>undefined,()=>undefined);
  return recoveryPromise;
}

// Concurrent loaders share one promise. Mutations fail closed while reading;
// retries only reread failed resources, never replacing newer unrelated edits.
export function loadStore(): Promise<void> {
  if (replacementPromise) return replacementPromise.then(() => loadStore());
  if (loadPromise) return loadPromise;
  if (state.loaded && blocked.size === 0) return Promise.resolve();
  const keys = state.loaded ? [...blocked].filter(k => k !== HISTORY_INDEX) : [KEYS.session, KEYS.summary, KEYS.presets, KEYS.freePresets, KEYS.freeTimer, KEYS.freeMigrated];
  set({ loading: true });
  loadPromise = (async () => {
    await flushStorage();
    if (!known.has(HISTORY_INDEX) || blocked.has(HISTORY_INDEX)) {
      try {
        const all = await AsyncStorage.getAllKeys();
        keys.push(...all.filter(k => k.startsWith(HISTORY_PREFIX) && !keys.includes(k)));
        known.add(HISTORY_INDEX); blocked.delete(HISTORY_INDEX); errors.delete("read:" + HISTORY_INDEX);
      } catch {
        blocked.add(HISTORY_INDEX); known.delete(HISTORY_INDEX);
        issue("read:" + HISTORY_INDEX, "Lecture de l’historique impossible. Les archives sont conservées ; réessaie.");
      }
    }
    const reads = await Promise.allSettled(keys.map(key => Promise.resolve().then(() => AsyncStorage.getItem(key))));
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i], read = reads[i];
      if (read.status === "rejected") {
        blocked.add(key); known.delete(key);
        issue("read:" + key, "Lecture impossible (" + (key.startsWith(HISTORY_PREFIX) ? "archive de compétition" : labels[key]) + "). Aucune donnée n’a été remplacée. Réessaie.");
        continue;
      }
      errors.delete("read:" + key);
      const raw = read.value;
      let value: unknown = null, valid = true, repaired = false;
      try { if (raw !== null) value = JSON.parse(raw); } catch { valid = false; }
      if (raw !== null && valid) {
        if (key.startsWith(HISTORY_PREFIX)) valid = validCompetitionRecord(value, key);
        switch (key) {
          case KEYS.session: case KEYS.summary: valid = validSession(value); break;
          case KEYS.presets: valid = arrayOf(value, validPreset); break;
          case KEYS.freePresets: valid = arrayOf(value, validFreePreset); break;
          case KEYS.freeTimer: {
            const restored = restoreFreeTimer(value); valid = restored.value !== null;
            value = restored.value; repaired = restored.repaired; break;
          }
          case KEYS.freeMigrated:
            if (!validMarker(value)) {
              const old = value as { at?: unknown; count?: unknown } | null;
              if (old && Number.isFinite(old.at) && Number.isInteger(old.count) && (old.count as number) >= 0) value = "legacy";
              else valid = false;
            }
            break;
        }
      }
      if (!valid && raw !== null) {
        blocked.add(key); known.delete(key);
        const copied = await preserveRaw(key, raw);
        if (copied && [KEYS.session, KEYS.summary, KEYS.freeTimer].includes(key)) backedInvalid.add(key);
        issue("invalid:" + key, "Sauvegarde illisible (" + (key.startsWith(HISTORY_PREFIX) ? "archive de compétition" : labels[key]) + "). " + (copied ? "Valeur brute conservée à part ; restauration refusée." : "Copie de secours impossible ; l’original est intact et la restauration refusée."));
        if (key === KEYS.freeMigrated && copied) { migrationMarker = "ambiguous"; known.add(key); }
        continue;
      }
      known.add(key); blocked.delete(key); errors.delete("invalid:" + key);
      backedInvalid.delete(key);
      if (key.startsWith(HISTORY_PREFIX) && value) acceptCompetition(value as CompetitionRecord);
      switch (key) {
        case KEYS.session: {
          const original = value as Session | null;
          const restored = original?.status === "active" ? recordMatchDetail(original,advance(original,Date.now()),Date.now()) : original;
          set({ session: restored });
          // A recovered automatic Maracana launch must retain its original boundary
          // across another close. Only write after a valid read; failures stay visible.
          if (restored !== original && original && (original.config.mode === "maracana" || original.config.mode === "cup" || original.config.mode === "survie") && original.config.launch && original.config.launch !== "manual") await persist(KEYS.session, restored);
          break;
        }
        case KEYS.summary: set({ lastSummary: value as Session | null }); break;
        case KEYS.presets: set({ presets: (value as Preset[] | null) ?? [] }); break;
        case KEYS.freePresets: set({ freePresets: (value as FreeTimerPreset[] | null) ?? [] }); break;
        case KEYS.freeTimer: {
          set({ freeTimer: value ? advanceFree(value as FreeTimerState, Date.now()) : null });
          if (repaired) {
            set({ storageInfo: "Ancienne sauvegarde du chrono réparée : seules les étapes ont été reconstruites, sans changer le temps, les tours ni les scores." });
            await persist(KEYS.freeTimer, state.freeTimer);
          }
          break;
        }
        case KEYS.freeMigrated: migrationMarker = value as Marker | "legacy" | null; break;
      }
    }
    await migratePresets();
    errors.delete("loading");
    errors.delete("load");
    set({ loaded: true, loading: false, now: Date.now() });
    await backfillCompetitions();
    showErrors();
  })().catch(() => {
    // Fail closed even if an unexpected storage adapter/restore error escapes.
    for (const key of keys) { blocked.add(key); known.delete(key); backedInvalid.delete(key); }
    set({ loaded: true, loading: false });
    issue("load", "Chargement interrompu. Les sauvegardes d’origine sont conservées ; les modifications sont bloquées jusqu’à une nouvelle lecture réussie.");
  }).finally(() => { loadPromise = null; });
  return loadPromise;
}
export function retryStorage(): Promise<void> {
  if (retryPromise) return retryPromise;
  retryPromise = (async () => {
    if (loadPromise) await loadPromise;
    if (replacementPromise) await replacementPromise;
    await historyWork;
    await freePresetWork;
    for (const write of [...failedWrites.values()]) {
      if (desiredWrites.get(write.key) === write) await queueWrite(write);
    }
    await loadStore();
    await migratePresets();
    await backfillCompetitions();
    persistPendingSummary();
    await flushStorage();
  })().finally(() => { retryPromise = null; });
  return retryPromise;
}

// Visual announcements and audio share the same deduplicated state transitions.
function emitSounds(prev: Session | null, next: Session | null, silent: boolean) {
  if (silent || !next?.live) return;
  const p = getPreferences();
  const events = sessionEvents(prev, next).filter(e => p.preparation || (e.kind !== "warmup" && e.kind !== "next"));
  if (!events.length) return;
  const visible = events.filter(e => e.kind !== "goal" && e.kind !== "start");
  if (visible.length) {
    // Orange = alertes de temps (minute/fin de période/fin de match),
    // vert = échauffement/préparation du prochain match. Priorité au temps.
    const timeKinds: SessionEvent["kind"][] = ["minute", "periodEnd", "matchEnd"];
    const tone: "warmup" | "time" = visible.some(e => timeKinds.includes(e.kind)) ? "time" : "warmup";
    set({ notice: { message: visible.map(e => e.message).join(" · "), until: Date.now() + 4500, tone } });
  }
  const sounds: Partial<Record<SessionEvent["kind"], import("./preferences").EventSound>> = {
    start:p.startSound, goal:p.goalSound, minute:p.minuteSound, periodEnd:p.periodSound, matchEnd:p.endSound, warmup:p.warmupSound,
  };
  // Prefer the end event; never replay a burst of missed alerts after a delay.
  const soundEvent = events.find(e => e.kind === "matchEnd")?.kind ?? events[0].kind;
  const sound = sounds[soundEvent];
  const localSoundControl = (next.config.mode === "classique" || next.config.mode === "maracana" || next.config.mode === "survie") && next.config.soundControl === "session";
  const sessionSound = !localSoundControl || next.config.sounds;
  if (p.sounds && sessionSound && sound && sound !== "off") void playSound(sound, soundEvent === "periodEnd" ? "periodEnd" : undefined);
  void Haptics.selectionAsync().catch(() => {});
}

export function dispatchSession(fn: (s: Session, now: number) => Session, opts: { silent?: boolean } = {}) {
  if (!writable(KEYS.session)) return;
  const prev = state.session;
  if (!prev) return;
  const now = Date.now();
  const advanced = advance(prev, now);
  // A tap made against an expired phase must not alter its successor.
  const changedPhase = advanced.live?.stage !== prev.live?.stage || advanced.live?.matchId !== prev.live?.matchId;
  const next = recordMatchDetail(prev,changedPhase ? advanced : advance(fn(advanced, now), now),now);
  if (next === prev) {
    set({ now });
    return;
  }
  emitSounds(prev, next, !!opts.silent);
  set({ session: next, now });
  void persist(KEYS.session, next);
  if ((next.mode === "cup" || next.mode === "survie") && (next.live?.stage === "finished" || next.tournamentView !== undefined) && sessionComplete(next)) {
    void archiveCompetition(endSession(next, next.live?.finishedAt ?? now));
  }
}

export function tick() {
  dispatchSession((s) => s);
}

export function startSession(session: Session) {
  if (!writable(KEYS.session)) return false;
  if (pendingCompetitions.size) {
    issue("history:pending", "Une compétition attend sa sauvegarde dans l’historique. Réessaie la sauvegarde avant de commencer une nouvelle séance.");
    return false;
  }
  // Every entry path opens ready: configure, saved chrono, and replay.
  session = { ...session, live: session.live ? { ...session.live, stage: "ready", startedAt: 0, chrono: { ...session.live.chrono, phase: "idle", runningSince: null, accumulatedMs: 0 } } : null };
  if(session.mode==="classique"&&session.live&&session.live.playedMs===0&&session.live.score.every(n=>n===0))session={...session,live:{...session.live,detail:emptyMatchDetail(session.live.periodMs.length)}};
  set({ session, notice: null, now: Date.now() });
  void persist(KEYS.session, session);
  return true;
}

// Fin de session : la session devient le dernier résumé (C20).
export function archiveSession(finished: Session) {
  if (!writable(KEYS.session, KEYS.summary)) return;
  set({ session: null, lastSummary: finished });
  pendingSummary = finished;
  if (isCompetition(finished)) void archiveCompetition(finished).then(persistPendingSummary);
  else persistPendingSummary();
}

function persistPendingSummary() {
  if (!pendingSummary || pendingCompetitions.size) return;
  const finished = pendingSummary; pendingSummary = null;
  const saved = persist(KEYS.summary, finished);
  if (!state.session || state.session.id === finished.id) void persist(KEYS.session, null, saved);
}

function historyTask(run: () => Promise<boolean>): Promise<boolean> {
  const result = historyWork.then(run).catch(() => {
    issue("history:unexpected", "L’historique n’a pas pu être enregistré. Les données de la séance sont conservées ; réessaie.");
    return false;
  });
  historyWork = result;
  return result;
}
function historyWritable(key: string) {
  return known.has(HISTORY_INDEX) && !blocked.has(HISTORY_INDEX) && writable(key);
}
function archiveCompetition(finished: Session): Promise<boolean> {
  if (!isCompetition(finished)) return Promise.resolve(true);
  pendingCompetitions.set(finished.id, finished);
  return historyTask(async () => {
    const key = competitionKey(finished.id);
    if (!historyWritable(key)) return false;
    if (deletedCompetitions.has(finished.id)) { pendingCompetitions.delete(finished.id); return true; }
    const previous = state.competitions.find(c => c.id === finished.id);
    const record = snapshotCompetition(finished, previous);
    const saved = !!previous && JSON.stringify(previous) === JSON.stringify(record) || await persist(key, record);
    if (saved && pendingCompetitions.get(finished.id) === finished) pendingCompetitions.delete(finished.id);
    if (saved && !pendingCompetitions.size) { errors.delete("history:pending"); errors.delete("history:unexpected"); }
    showErrors();
    return saved;
  });
}
async function backfillCompetitions() {
  const candidates = [state.lastSummary, state.session].filter((s): s is Session => s !== null);
  for (const session of candidates) {
    const finished = session.status === "active" && (session.mode === "cup" || session.mode === "survie") && (session.live?.stage === "finished" || session.tournamentView !== undefined) && sessionComplete(session) ? endSession(session, session.live?.finishedAt ?? session.updatedAt) : session;
    if (isCompetition(finished)) {
      const previous = state.competitions.find(c => c.id === finished.id);
      // A completed session can be newer than its durable history entry after a
      // failed correction write. Reconcile it on restart, retaining the name
      // and archival date rather than treating the existing entry as current.
      // A stale last-summary copy must not roll a newer archive back. Existing
      // records are reconciled only from the durable current session; summary
      // writes occur after the history commit and cannot be ahead of it.
      if (!previous || session === state.session && JSON.stringify(previous.session) !== JSON.stringify(finished)) pendingCompetitions.set(finished.id, finished);
    }
  }
  for (const finished of [...pendingCompetitions.values()]) await archiveCompetition(finished);
  if (!pendingCompetitions.size) { errors.delete("history:pending"); persistPendingSummary(); }
}
export function renameCompetition(id: string, name: string): Promise<boolean> {
  return changeCompetition(id, previous => ({ ...previous, name: name.trim().slice(0, 40) || snapshotCompetition(previous.session).name }));
}
export function deleteCompetition(id: string): Promise<boolean> {
  return changeCompetition(id, () => ({ schema: 1, id, deleted: true }));
}
function changeCompetition(id: string, update: (previous: Competition) => CompetitionRecord): Promise<boolean> {
  return historyTask(async () => {
    const key = competitionKey(id);
    if (!historyWritable(key)) return false;
    const previous = state.competitions.find(c => c.id === id);
    if (!previous) return false;
    const saved = await persist(key, update(previous));
    if (!saved) {
      // An abandoned rename/delete must never execute later during a generic retry.
      const failed = failedWrites.get(key);
      if (failed && desiredWrites.get(key) === failed) failed.raw = JSON.stringify(previous);
    }
    return saved;
  });
}

export function discardSession() {
  if (!writable(KEYS.session)) return;
  set({ session: null });
  void persist(KEYS.session, null);
}

export async function setPresets(presets: Preset[]): Promise<boolean> {
  if (!writable(KEYS.presets)) return false;
  if (!arrayOf(presets, validPreset)) { issue("input:" + KEYS.presets, "Anciens chronos invalides : sauvegarde refusée."); return false; }
  set({ presets });
  return persist(KEYS.presets, presets);
}

// --- Chrono libre : presets (Mes chronos) + session persistée ----------------
// Serialize list mutations against the latest durable list, never optimistic UI.
function changeFreePresets(
  id: string,
  update: (
    current: FreeTimerPreset[],
  ) => FreeTimerPreset[] | null | Promise<FreeTimerPreset[] | null>,
): Promise<boolean> {
  if (!writable(KEYS.freePresets)) return Promise.resolve(false);
  if (retryPromise)
    return retryPromise.then(() => changeFreePresets(id, update));
  const operation = freePresetWork.then(async () => {
    if (!writable(KEYS.freePresets)) return false;
    const next = await update(state.freePresets);
    if (next === null) return false;
    const retained = state.freePresets;
    if (!(await persist(KEYS.freePresets, next))) {
      // A generic retry must not perform an abandoned save or deletion later.
      const failed = failedWrites.get(KEYS.freePresets);
      if (failed && desiredWrites.get(KEYS.freePresets) === failed)
        failed.raw = JSON.stringify(retained);
      issue(
        "free-preset:" + id,
        "Modification du chrono non enregistrée. La liste précédente est conservée. Réessaie cette action pour la confirmer.",
      );
      return false;
    }
    set({ freePresets: next });
    errors.delete("free-preset:" + id);
    showErrors();
    return true;
  });
  freePresetWork = operation.then(
    () => undefined,
    () => undefined,
  );
  return operation;
}
export function saveFreePreset(preset: FreeTimerPreset): Promise<boolean> {
  if (!validFreePreset(preset)) {
    issue(
      "input:" + KEYS.freePresets,
      "Configuration de chrono invalide : sauvegarde refusée.",
    );
    return Promise.resolve(false);
  }
  const copy = JSON.parse(JSON.stringify(preset)) as FreeTimerPreset;
  return changeFreePresets(copy.id, (current) =>
    current.some((p) => p.id === copy.id)
      ? current.map((p) => (p.id === copy.id ? copy : p))
      : [copy, ...current],
  );
}
export function deleteFreePreset(id: string): Promise<boolean> {
  return changeFreePresets(id, async () => {
    if (
      id.startsWith("free-mig-") &&
      (!validMarker(migrationMarker) || !migrationMarker.sourceIds.includes(id))
    ) {
      if (
        !(await migratePresets()) ||
        !validMarker(migrationMarker) ||
        !migrationMarker.sourceIds.includes(id) ||
        !writable(KEYS.freePresets)
      )
        return null;
    }
    return state.freePresets.filter((p) => p.id !== id);
  });
}
export function renameFreePreset(id: string, name: string): Promise<boolean> {
  return changeFreePresets(id, (current) =>
    current.map((p) => (p.id === id ? { ...p, name } : p)),
  );
}
// Met à jour la session Chrono libre en cours (persistée pour la reprise).
// L'affichage haute fréquence NE passe PAS par ici : seules les actions
// discrètes (start/pause/tour/step/reset) écrivent, évitant les rafales.
export function setFreeTimer(ft: FreeTimerState | null): boolean {
  // Live actions stay immediate. This boolean means accepted in memory, never
  // a durable-save acknowledgement. Destructive changes use replaceFreeTimer.
  if (state.replacingFreeTimer) return false;
  if (!writable(KEYS.freeTimer)) return false;
  if (ft !== null && !validFreeTimer(ft)) {
    issue("input:" + KEYS.freeTimer, "Chrono incohérent : modification refusée pour protéger la sauvegarde.");
    return false;
  }
  set({ freeTimer: ft });
  void persist(KEYS.freeTimer, ft);
  return true;
}
// Keep the previous session in memory until both its backup and the new state
// are durable. A failed candidate is never retried silently as a replacement.
export function freeTimerRecoveryPending(): boolean { return blocked.has(KEYS.freeTimer); }
export function replaceFreeTimer(ft: FreeTimerState | null, expected: FreeTimerState | null): Promise<boolean> {
  if (state.replacingFreeTimer || replacementPromise || !writable(KEYS.freeTimer) || state.freeTimer !== expected) return Promise.resolve(false);
  if (ft !== null && !validFreeTimer(ft)) {
    issue("input:" + KEYS.freeTimer, "Chrono incohérent : remplacement refusé. La séance précédente est conservée.");
    return Promise.resolve(false);
  }
  const previous = state.freeTimer;
  const previousRaw = previous === null ? null : JSON.stringify(previous);
  const next = ft === null ? null : JSON.parse(JSON.stringify(ft)) as FreeTimerState;
  set({ replacingFreeTimer: true });
  replacementPromise = (async () => {
    if (previousRaw !== null && !(await persistRaw(KEYS.previousFreeTimer, previousRaw))) return false;
    if (!(await persist(KEYS.freeTimer, next))) {
      // Retrying storage saves the retained session, not the rejected candidate.
      const failed = failedWrites.get(KEYS.freeTimer);
      if (failed && desiredWrites.get(KEYS.freeTimer) === failed) failed.raw = previousRaw;
      issue("write:" + KEYS.freeTimer, "Remplacement non enregistré. La séance précédente est conservée. Réessaie avant de fermer l’application.");
      return false;
    }
    set({ freeTimer: next });
    return true;
  })().finally(() => {
    replacementPromise = null;
    set({ replacingFreeTimer: false });
  });
  return replacementPromise;
}
// Tick logique du Chrono libre : n'écrit QUE sur transition de step / fin.
export function tickFreeTimer(): void {
  const ft = state.freeTimer;
  if (!ft || !ft.running || ft.finished) return;
  const adv = advanceFree(ft, Date.now());
  if (adv !== ft) setFreeTimer(adv);
}

export function dismissNotice() { set({ notice: null }); }

export function getStoreState() {
  return state;
}

export function useStore<T>(selector: (s: StoreState) => T): T {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => selector(state),
    () => selector(state),
  );
}

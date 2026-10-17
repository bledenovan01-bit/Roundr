// Roundr V0 — Store local unique (session active + dernier résumé + presets).
// §10 / C20 : persistance à chaque mutation utile, erreurs signalées, aucune
// sauvegarde lisible n'est écrasée par une sauvegarde vide.
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSyncExternalStore } from "react";

import { getPreferences } from "./preferences";
import { playSound } from "@/src/audio/sounds";
import { advance } from "@/src/domain/session";
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
  freeMigrated: "roundr.free-presets.migrated.v1",
};

export type StoreState = {
  loaded: boolean;
  loading: boolean;
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
};

let state: StoreState = {
  loaded: false,
  loading: false,
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
const labels: Record<string, string> = {
  [KEYS.session]: "session de match", [KEYS.summary]: "résumé", [KEYS.presets]: "anciens chronos",
  [KEYS.freePresets]: "Mes chronos", [KEYS.freeTimer]: "chrono libre", [KEYS.freeMigrated]: "migration des chronos",
};
function showErrors() { set({ saveError: [...new Set(errors.values())].join(" ") || null }); }
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
      issue("write:" + write.key, "Sauvegarde impossible (" + (labels[write.key] ?? "copie de secours") + "). Garde l’application ouverte et réessaie.");
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
  for (;;) { const current = pendingWrite; await current; if (current === pendingWrite) return; }
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
  const base = key === KEYS.session ? KEYS.corrupt : key + ".corrupt";
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
  recoveryPromise = migratePresets(recover ? "recover" : "skip").finally(() => { recoveryPromise = null; });
  return recoveryPromise;
}

// Concurrent loaders share one promise. Mutations fail closed while reading;
// retries only reread failed resources, never replacing newer unrelated edits.
export function loadStore(): Promise<void> {
  if (loadPromise) return loadPromise;
  if (state.loaded && blocked.size === 0) return Promise.resolve();
  const keys = state.loaded ? [...blocked] : [KEYS.session, KEYS.summary, KEYS.presets, KEYS.freePresets, KEYS.freeTimer, KEYS.freeMigrated];
  set({ loading: true });
  loadPromise = (async () => {
    await flushStorage();
    const reads = await Promise.allSettled(keys.map(key => Promise.resolve().then(() => AsyncStorage.getItem(key))));
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i], read = reads[i];
      if (read.status === "rejected") {
        blocked.add(key); known.delete(key);
        issue("read:" + key, "Lecture impossible (" + labels[key] + "). Aucune donnée n’a été remplacée. Réessaie.");
        continue;
      }
      errors.delete("read:" + key);
      const raw = read.value;
      let value: unknown = null, valid = true, repaired = false;
      try { if (raw !== null) value = JSON.parse(raw); } catch { valid = false; }
      if (raw !== null && valid) {
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
        issue("invalid:" + key, "Sauvegarde illisible (" + labels[key] + "). " + (copied ? "Valeur brute conservée à part ; restauration refusée." : "Copie de secours impossible ; l’original est intact et la restauration refusée."));
        if (key === KEYS.freeMigrated && copied) { migrationMarker = "ambiguous"; known.add(key); }
        continue;
      }
      known.add(key); blocked.delete(key); errors.delete("invalid:" + key);
      backedInvalid.delete(key);
      switch (key) {
        case KEYS.session: set({ session: value ? ((value as Session).status === "active" ? advance(value as Session, Date.now()) : value as Session) : null }); break;
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
    for (const write of [...failedWrites.values()]) {
      if (desiredWrites.get(write.key) === write) await queueWrite(write);
    }
    await loadStore();
    await migratePresets();
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
  const sound = sounds[events.find(e => e.kind === "matchEnd")?.kind ?? events[0].kind];
  if (p.sounds && sound && sound !== "off") void playSound(sound);
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
  const next = changedPhase ? advanced : advance(fn(advanced, now), now);
  if (next === prev) {
    set({ now });
    return;
  }
  emitSounds(prev, next, !!opts.silent);
  set({ session: next, now });
  void persist(KEYS.session, next);
}

export function tick() {
  dispatchSession((s) => s);
}

export function startSession(session: Session) {
  if (!writable(KEYS.session)) return;
  // Every entry path opens ready: configure, saved chrono, and replay.
  session = { ...session, live: session.live ? { ...session.live, stage: "ready", startedAt: 0, chrono: { ...session.live.chrono, phase: "idle", runningSince: null, accumulatedMs: 0 } } : null };
  set({ session, notice: null, now: Date.now() });
  void persist(KEYS.session, session);
}

// Fin de session : la session devient le dernier résumé (C20).
export function archiveSession(finished: Session) {
  if (!writable(KEYS.session, KEYS.summary)) return;
  set({ session: null, lastSummary: finished });
  const saved = persist(KEYS.summary, finished);
  void persist(KEYS.session, null, saved);
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
export async function saveFreePreset(preset: FreeTimerPreset): Promise<boolean> {
  if (!writable(KEYS.freePresets)) return false;
  if (!validFreePreset(preset)) { issue("input:" + KEYS.freePresets, "Configuration de chrono invalide : sauvegarde refusée."); return false; }
  const next = [...state.freePresets.filter(p => p.id !== preset.id), preset];
  set({ freePresets: next });
  return persist(KEYS.freePresets, next);
}
export async function deleteFreePreset(id: string): Promise<boolean> {
  if (!writable(KEYS.freePresets)) return false;
  if (id.startsWith("free-mig-") && (!validMarker(migrationMarker) || !migrationMarker.sourceIds.includes(id))) {
    // Do not make an uncommitted import disappear: without a durable receipt,
    // a restart could interpret its deletion as an interrupted migration.
    if (!(await migratePresets()) || !validMarker(migrationMarker) || !migrationMarker.sourceIds.includes(id)) return false;
    if (!writable(KEYS.freePresets)) return false;
  }
  const next = state.freePresets.filter(p => p.id !== id);
  set({ freePresets: next });
  return persist(KEYS.freePresets, next);
}
export async function renameFreePreset(id: string, name: string): Promise<boolean> {
  if (!writable(KEYS.freePresets)) return false;
  const next = state.freePresets.map(p => (p.id === id ? { ...p, name } : p));
  set({ freePresets: next });
  return persist(KEYS.freePresets, next);
}
// Met à jour la session Chrono libre en cours (persistée pour la reprise).
// L'affichage haute fréquence NE passe PAS par ici : seules les actions
// discrètes (start/pause/tour/step/reset) écrivent, évitant les rafales.
export function setFreeTimer(ft: FreeTimerState | null): boolean {
  if (!writable(KEYS.freeTimer)) return false;
  if (ft !== null && !validFreeTimer(ft)) {
    issue("input:" + KEYS.freeTimer, "Chrono incohérent : modification refusée pour protéger la sauvegarde.");
    return false;
  }
  set({ freeTimer: ft });
  void persist(KEYS.freeTimer, ft);
  return true;
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

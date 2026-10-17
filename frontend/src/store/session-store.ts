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
import * as Haptics from "@/src/haptics";
import type { Preset, Session } from "@/src/domain/types";

const KEYS = {
  session: "roundr.session.v1",
  summary: "roundr.summary.v1",
  presets: "roundr.presets.v1",
  corrupt: "roundr.session.corrupt.v1",
};

export type StoreState = {
  loaded: boolean;
  session: Session | null;
  lastSummary: Session | null;
  presets: Preset[];
  saveError: string | null;
  now: number; // horloge de rendu (tick)
  notice: { message: string; until: number; tone: "warmup" | "time" } | null;
};

let state: StoreState = {
  loaded: false,
  session: null,
  lastSummary: null,
  presets: [],
  saveError: null,
  now: Date.now(),
  notice: null,
};
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}
function set(partial: Partial<StoreState>) {
  state = { ...state, ...partial };
  emit();
}

let pendingWrite: Promise<unknown> = Promise.resolve();
const failedKeys = new Set<string>();
function persist(key: string, value: unknown, prerequisite?: Promise<boolean>): Promise<boolean> {
  // Serialize immutable snapshots, including archive/remove, in mutation order.
  const snapshot = value == null ? null : JSON.stringify(value);
  const operation = pendingWrite.then(async () => {
    if (prerequisite && !(await prerequisite)) return false;
    try {
      if (snapshot == null) await AsyncStorage.removeItem(key);
      else await AsyncStorage.setItem(key, snapshot);
      const wasFailed = failedKeys.delete(key);
      if (wasFailed) set({ saveError: failedKeys.size ? "Certaines données ne sont pas encore sauvegardées." : null });
      return true;
    } catch {
      failedKeys.add(key);
      set({ saveError: `Sauvegarde impossible (${key.split(".")[1]}). Garde l’application ouverte et réessaie.` });
      return false;
    }
  });
  pendingWrite = operation;
  return operation;
}

function parse<T>(raw: string | null, valid: (v: unknown) => boolean): { value: T | null; corrupt: boolean } {
  if (raw == null) return { value: null, corrupt: false };
  try {
    const value = JSON.parse(raw);
    return valid(value) ? { value: value as T, corrupt: false } : { value: null, corrupt: true };
  } catch {
    return { value: null, corrupt: true };
  }
}

// Restauration : reconstitue le chrono et traite une fin franchie UNE fois.
export async function loadStore(): Promise<void> {
  if (state.loaded) return;
  let saveError: string | null = null;
  let session: Session | null = null;
  let lastSummary: Session | null = null;
  let presets: Preset[] = [];
  try {
    const [rs, rsum, rp] = await Promise.all([
      AsyncStorage.getItem(KEYS.session),
      AsyncStorage.getItem(KEYS.summary),
      AsyncStorage.getItem(KEYS.presets),
    ]);
    const ps = parse<Session>(rs, validSession);
    if (ps.corrupt && rs) {
      // Conserver la sauvegarde illisible au lieu de l'effacer (C20).
      await AsyncStorage.setItem(KEYS.corrupt, rs).catch(() => {});
      saveError = "Session sauvegardée illisible : conservée à part, non restaurée.";
    }
    session = ps.value && ps.value.status === "active" ? advance(ps.value, Date.now()) : ps.value;
    const summary = parse<Session>(rsum, validSession);
    const saved = parse<Preset[]>(rp, v => Array.isArray(v) && v.every(validPreset));
    lastSummary = summary.value;
    presets = saved.value ?? [];
    for (const [key, raw, corrupt] of [[KEYS.summary, rsum, summary.corrupt], [KEYS.presets, rp, saved.corrupt]] as const) {
      if (corrupt && raw) {
        await AsyncStorage.setItem(key + ".corrupt", raw).catch(() => {});
        saveError = "Certaines données sauvegardées sont illisibles et ont été conservées à part.";
      }
    }
  } catch {
    saveError = "Lecture du stockage local impossible.";
  }
  set({ loaded: true, session, lastSummary, presets, saveError, now: Date.now() });
  if (session) void persist(KEYS.session, session);
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
  // Every entry path opens ready: configure, saved chrono, and replay.
  session = { ...session, live: session.live ? { ...session.live, stage: "ready", startedAt: 0, chrono: { ...session.live.chrono, phase: "idle", runningSince: null, accumulatedMs: 0 } } : null };
  set({ session, notice: null, now: Date.now() });
  void persist(KEYS.session, session);
}

// Fin de session : la session devient le dernier résumé (C20).
export function archiveSession(finished: Session) {
  set({ session: null, lastSummary: finished });
  const saved = persist(KEYS.summary, finished);
  void persist(KEYS.session, null, saved);
}

export function discardSession() {
  set({ session: null });
  void persist(KEYS.session, null);
}

export async function setPresets(presets: Preset[]): Promise<boolean> {
  set({ presets });
  return persist(KEYS.presets, presets);
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

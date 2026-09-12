// Roundr V0 — Store local unique (session active + dernier résumé + presets).
// §10 / C20 : persistance à chaque mutation utile, erreurs signalées, aucune
// sauvegarde lisible n'est écrasée par une sauvegarde vide.
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSyncExternalStore } from "react";

import { playSound } from "@/src/audio/sounds";
import { advance } from "@/src/domain/session";
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
};

let state: StoreState = {
  loaded: false,
  session: null,
  lastSummary: null,
  presets: [],
  saveError: null,
  now: Date.now(),
};
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}
function set(partial: Partial<StoreState>) {
  state = { ...state, ...partial };
  emit();
}

async function persist(key: string, value: unknown) {
  try {
    if (value == null) await AsyncStorage.removeItem(key);
    else await AsyncStorage.setItem(key, JSON.stringify(value));
    if (state.saveError) set({ saveError: null });
  } catch (e) {
    set({ saveError: `Sauvegarde impossible (${key.split(".")[1]})` });
  }
}

function parse<T>(raw: string | null): { value: T | null; corrupt: boolean } {
  if (raw == null) return { value: null, corrupt: false };
  try {
    return { value: JSON.parse(raw) as T, corrupt: false };
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
    const ps = parse<Session>(rs);
    if (ps.corrupt && rs) {
      // Conserver la sauvegarde illisible au lieu de l'effacer (C20).
      await AsyncStorage.setItem(KEYS.corrupt, rs).catch(() => {});
      saveError = "Session sauvegardée illisible : conservée à part, non restaurée.";
    }
    session = ps.value && ps.value.status === "active" ? advance(ps.value, Date.now()) : ps.value;
    lastSummary = parse<Session>(rsum).value;
    presets = parse<Preset[]>(rp).value ?? [];
  } catch {
    saveError = "Lecture du stockage local impossible.";
  }
  set({ loaded: true, session, lastSummary, presets, saveError, now: Date.now() });
  if (session) void persist(KEYS.session, session);
}

// Sons déclenchés par différence d'état (dédupliqués côté moteur, C19).
function emitSounds(prev: Session | null, next: Session | null, silent: boolean) {
  if (silent || !next?.config.sounds || !next.live) return;
  const pl = prev?.live;
  const nl = next.live;
  if (pl?.matchId === nl.matchId && pl.stage !== "finished" && nl.stage === "finished") {
    void playSound("final");
    return;
  }
  if (pl?.matchId === nl.matchId && pl.stage === "period" && (nl.stage === "break" || nl.stage === "awaitPeriod" || nl.stage === "additional" || nl.stage === "extra" || nl.stage === "golden" || nl.stage === "shootout")) {
    void playSound("whistle");
    return;
  }
  const fresh = pl?.matchId === nl.matchId ? nl.firedAlerts.filter((k) => !pl.firedAlerts.includes(k)) : [];
  if (!fresh.length) return;
  // Une seule annonce par lot : pas de rafale au retour d'arrière-plan.
  void playSound(fresh.some((k) => k.startsWith("prep")) && fresh.length === 1 ? "prep" : "alert");
}

export function dispatchSession(fn: (s: Session, now: number) => Session, opts: { silent?: boolean } = {}) {
  const prev = state.session;
  if (!prev) return;
  const now = Date.now();
  const next = advance(fn(prev, now), now);
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
  set({ session, now: Date.now() });
  void persist(KEYS.session, session);
}

// Fin de session : la session devient le dernier résumé (C20).
export function archiveSession(finished: Session) {
  set({ session: null, lastSummary: finished });
  void persist(KEYS.session, null);
  void persist(KEYS.summary, finished);
}

export function discardSession() {
  set({ session: null });
  void persist(KEYS.session, null);
}

export function setPresets(presets: Preset[]) {
  set({ presets });
  void persist(KEYS.presets, presets);
}

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

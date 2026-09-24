import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSyncExternalStore } from "react";
import { playSound } from "@/src/audio/sounds";
import { sessionSound } from "@/src/audio/events";
import { createClockGuard } from "../chrono/clock-guard";
import { advance } from "@/src/domain/session";
import type { Preset, Session } from "@/src/domain/types";
import { validateConfig } from "@/src/domain/validate";
import { createPersistence, validPreset, type SavedState } from "./persistence";

export type StoreState = {
  loaded: boolean; session: Session | null; lastSummary: Session | null;
  presets: Preset[]; saveError: string | null; now: number; archiving: boolean;
};
let state: StoreState = { loaded: false, session: null, lastSummary: null, presets: [], saveError: null, now: Date.now(), archiving: false };
const listeners = new Set<() => void>();
const persistence = createPersistence(AsyncStorage);
let loading: Promise<void> | null = null;
const clockGuard = createClockGuard();
export function resetClockGuard() { clockGuard.reset(); }
let revision = 0;
let storageReadable = true;
function set(partial: Partial<StoreState>) { state = { ...state, ...partial }; listeners.forEach(l => l()); }
function snapshot(partial: Partial<SavedState> = {}): SavedState {
  return { version: 2, session: state.session, lastSummary: state.lastSummary, presets: state.presets, ...partial };
}
async function persist(data = snapshot()): Promise<boolean> {
  const current = ++revision;
  try {
    await persistence.save(data);
    if (current === revision) set({ saveError: null });
    return true;
  } catch {
    set({ saveError: "Sauvegarde impossible. Garde l’application ouverte et réessaie." });
    return false;
  }
}
export function retrySave() { return storageReadable ? persist() : Promise.resolve(false); }
export function loadStore(): Promise<void> {
  if (state.loaded) return Promise.resolve();
  if (loading) return loading;
  loading = (async () => {
    try {
      const { data, warning } = await persistence.load();
      const now = Date.now();
      const session = data.session?.status === "active" ? advance(data.session, now) : data.session;
      set({ ...data, session, loaded: true, now, saveError: warning });
      // Do not overwrite a recoverable/corrupt snapshot just by opening the app.
      if (!warning) await persist();
    } catch { storageReadable = false; set({ loaded: true, saveError: "Lecture du stockage local impossible. Réouvre l’application avant de lancer une nouvelle session." }); }
  })();
  return loading;
}
export function dispatchSession(fn: (s: Session, now: number) => Session, opts: { silent?: boolean } = {}) {
  const prev = state.session;
  if (!prev || state.archiving) return;
  const now = Date.now();
  const adjusted = clockGuard.reconcile(prev, now, performance.now());
  const current = advance(adjusted, now);
  const next = advance(fn(current, now), now);
  const sound = !opts.silent && next.config.sounds ? sessionSound(prev, next) : null;
  if (sound) void playSound(sound);
  set({ session: next, now });
  if (next !== prev) void persist();
}
export function tick() { dispatchSession(s => s); }
export function startSession(session: Session): boolean {
  if (!state.loaded || !storageReadable || state.archiving) return false;
  const errors = validateConfig(session.config, session.teams);
  if (errors.length) { set({ saveError: errors.join(" ") }); return false; }
  clockGuard.reset();
  set({ session, now: Date.now() });
  if (session.config.sounds) void playSound("whistle");
  void persist();
  return true;
}
export async function archiveSession(finished: Session): Promise<boolean> {
  if (state.archiving) return false;
  set({ archiving: true });
  const saved = await persist(snapshot({ session: null, lastSummary: finished }));
  if (saved) set({ session: null, lastSummary: finished, archiving: false });
  else set({ archiving: false });
  return saved;
}
export function discardSession() { if (!state.archiving) { set({ session: null }); void persist(); } }
export function setPresets(presets: Preset[]): boolean {
  if (!state.loaded || !storageReadable || state.archiving || !presets.every(validPreset)) return false;
  set({ presets }); void persist(); return true;
}
export function getStoreState() { return state; }
export function useStore<T>(selector: (s: StoreState) => T): T {
  return useSyncExternalStore(l => { listeners.add(l); return () => { listeners.delete(l); }; }, () => selector(state), () => selector(state));
}



// Undo offered on the home screen for 5 seconds after a session is abandoned,
// whichever screen the abandon came from (home, match, tournament, free timer).
// The abandon is already saved; undo performs a separate write.
import { useSyncExternalStore } from "react";

export type AbandonUndo = { label: string; until: number; restore: () => Promise<boolean> };

export const ABANDON_UNDO_MS = 5000;
let current: AbandonUndo | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach(listener => listener());

function clear() {
  if (timer) clearTimeout(timer);
  timer = null;
  current = null;
  emit();
}

export function offerAbandonUndo(label: string, restore: () => Promise<boolean>) {
  if (timer) clearTimeout(timer);
  current = { label, restore, until: Date.now() + ABANDON_UNDO_MS };
  timer = setTimeout(clear, ABANDON_UNDO_MS);
  emit();
}

export function restoreAbandoned(): Promise<boolean> {
  const offer = current;
  if (!offer || Date.now() > offer.until) return Promise.resolve(false);
  clear();
  return offer.restore();
}

export function useAbandonUndo(): AbandonUndo | null {
  return useSyncExternalStore(
    listener => { listeners.add(listener); return () => { listeners.delete(listener); }; },
    () => current,
    () => null,
  );
}

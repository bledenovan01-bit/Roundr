import { useEffect, useRef, useSyncExternalStore } from "react";
import { AppState } from "react-native";
import { useRuntimeKeepAwake } from "@/src/hooks/use-runtime-keep-awake";
import { usePreferences } from "@/src/store/preferences";
import {
  tickFreeTimer,
  useStore,
  getStoreState,
} from "@/src/store/session-store";
import { playSound } from "@/src/audio/sounds";
import * as Haptics from "@/src/haptics";
import { freeTimeNotice, freeTransition } from "@/src/features/free-live-state";
import type { FreeTimerState } from "@/src/domain/free-timer";
let notice: { text: string; until: number } | null = null;
let scope: number | null = null;
const listeners = new Set<() => void>(),
  fired = new Set<string>();
export function updateFreeNotice(ft: FreeTimerState | null, now: number) {
  if ((ft?.createdAt ?? null) !== scope) {
    scope = ft?.createdAt ?? null;
    fired.clear();
    notice = null;
    listeners.forEach((l) => l());
  }
  if (!ft || (notice && now >= notice.until)) {
    notice = null;
    listeners.forEach((l) => l());
  }
  if (!ft) return;
  if (ft.config.kind === "countdown")
    for (const seconds of [30, 60])
      if (
        ft.stepAccumulatedMs +
          (ft.running ? Math.max(0, now - ft.stepStartedAt) : 0) <
        ft.config.durationMs - seconds * 1000
      )
        fired.delete(`${ft.createdAt}:${seconds}`);
  const due = freeTimeNotice(ft, now);
  if (due && !fired.has(due.id)) {
    fired.add(due.id);
    notice = { text: due.text, until: now + 4500 };
    listeners.forEach((l) => l());
  }
}
export const getFreeNotice = () => notice;
export const useFreeNotice = () =>
  useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => {
        listeners.delete(l);
      };
    },
    getFreeNotice,
    () => null,
  );
export function FreeTimerRuntime() {
  const cue = useFreeNotice();
  // Expiry is independent of the timer's running state (including a pause
  // while the banner is visible).
  useEffect(() => {
    if (!cue) return;
    if (AppState.currentState === "active")
      void Haptics.selectionAsync().catch(() => {});
    const id = setTimeout(
      () => updateFreeNotice(getStoreState().freeTimer, Date.now()),
      Math.max(0, cue.until - Date.now()),
    );
    return () => clearTimeout(id);
  }, [cue]);
  const ft = useStore((s) => s.freeTimer),
    prefs = usePreferences(),
    running = !!ft?.running;
  const previous = useRef(ft);
  useEffect(() => {
    const before = previous.current;
    previous.current = ft;
    updateFreeNotice(ft, Date.now());
    if (
      !ft ||
      !freeTransition(before, ft) ||
      ft.config.kind === "stopwatch" ||
      !ft.config.endSignal ||
      AppState.currentState !== "active"
    )
      return;
    if (prefs.sounds && ft.config.sounds)
      void playSound(ft.finished ? "final" : "gong", ft.finished ? "freeEnd" : "freeTransition");
    if (prefs.vibrations) void Haptics.selectionAsync().catch(() => {});
  }, [ft, prefs.sounds, prefs.vibrations]);
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    const step = () => {
      tickFreeTimer();
      updateFreeNotice(getStoreState().freeTimer, Date.now());
    };
    const start = () => {
      step();
      interval = setInterval(step, 250);
    };
    if (running && AppState.currentState === "active") start();
    const subscription = AppState.addEventListener("change", (state) => {
      clearInterval(interval);
      if (state === "active" && getStoreState().freeTimer?.running) start();
    });
    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [running]);
  useRuntimeKeepAwake(running && prefs.keepAwake, "roundr-free");
  return null;
}

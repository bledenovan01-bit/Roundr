import { useEffect } from "react";
import { AppState, Platform } from "react-native";
import { dispatchSession, resetClockGuard, tick, useStore } from "../store/session-store";
import { prepareAudio } from "../audio/sounds";
import { syncMatchNotifications } from "../audio/notifications";

export function SessionLifecycle() {
  const session = useStore(s => s.session);
  useEffect(() => {
    void prepareAudio().catch(() => {});
    const timer = setInterval(() => { if (AppState.currentState === "active" || AppState.currentState === null) tick(); }, 250);
    const sub = AppState.addEventListener("change", state => {
      resetClockGuard();
      if (state === "active") dispatchSession(s => s, { silent: true });
    });
    return () => { clearInterval(timer); sub.remove(); };
  }, []);
  useEffect(() => { syncMatchNotifications(session); }, [session]);
  useEffect(() => {
    if (Platform.OS === "web" && !__DEV__ && "serviceWorker" in navigator) {
      void navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);
  return null;
}


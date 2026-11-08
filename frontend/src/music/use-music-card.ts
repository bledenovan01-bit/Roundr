import { useCallback, useSyncExternalStore } from "react";
import { AppState, Linking } from "react-native";
import { useFocusEffect } from "expo-router";
import { musicCardModel, type MusicAction } from "./music-card-model";
import { MusicController } from "./music-controller";
import { createMusicAdapters, isOtherAudioPlaying } from "./native-adapters";

/** iOS sends no event when a third app starts or stops playing. */
const OTHER_AUDIO_REFRESH_MS = 4000;

function watchPlayers(music: MusicController) {
  const appState = AppState.addEventListener("change", (next) => {
    if (next === "active") void music.foreground();
  });
  const timer = setInterval(() => {
    if (AppState.currentState === "active") void music.refresh();
  }, OTHER_AUDIO_REFRESH_MS);
  return () => {
    appState.remove();
    clearInterval(timer);
  };
}

// One controller for the whole app: every music card shares its connections.
let shared: MusicController | null = null;
const controller = () =>
  (shared ??= new MusicController(createMusicAdapters(), isOtherAudioPlaying, watchPlayers));

/** Follows the players only while a music view is on the focused screen. */
export function useMusicCard(active: boolean) {
  const music = controller();
  const state = useSyncExternalStore(music.subscribe, music.getState, music.getState);
  useFocusEffect(
    useCallback(() => {
      if (active) return music.hold();
    }, [active, music]),
  );
  return {
    model: musicCardModel(state),
    busy: state.busy !== null,
    command: music.command.bind(music),
    run: (action: MusicAction) => {
      if (action.type === "connect") void music.connect(action.source);
      else void Linking.openSettings();
    },
  };
}

import { useEffect, useSyncExternalStore } from "react";
import { AppState, Linking } from "react-native";
import { musicCardModel, type MusicAction } from "./music-card-model";
import { MusicController } from "./music-controller";
import { createMusicAdapters, isOtherAudioPlaying } from "./native-adapters";

let shared: MusicController | null = null;
const controller = () => (shared ??= new MusicController(createMusicAdapters(), isOtherAudioPlaying));

/** iOS sends no event when a third app starts or stops playing. */
const OTHER_AUDIO_REFRESH_MS = 4000;

/** Follows the players only while the music view is on screen. */
export function useMusicCard(active: boolean) {
  const music = controller();
  const state = useSyncExternalStore(music.subscribe, music.getState, music.getState);
  useEffect(() => {
    if (!active) return;
    void music.start();
    const appState = AppState.addEventListener("change", (next) => {
      if (next === "active") void music.foreground();
    });
    const timer = setInterval(() => {
      if (AppState.currentState === "active") void music.refresh();
    }, OTHER_AUDIO_REFRESH_MS);
    return () => {
      appState.remove();
      clearInterval(timer);
      void music.stop();
    };
  }, [active, music]);
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

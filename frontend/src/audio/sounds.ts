import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from "expo-audio";
import { AppState } from "react-native";
import { useSyncExternalStore } from "react";
import type { SoundKey } from "./events";

const SOURCES: Record<SoundKey, number> = {
  whistle: require("../../assets/sounds/whistle.wav"),
  final: require("../../assets/sounds/final.wav"),
  prep: require("../../assets/sounds/prep.wav"),
  alert180: require("../../assets/sounds/alert180.wav"),
  alert120: require("../../assets/sounds/alert120.wav"),
  alert60: require("../../assets/sounds/alert60.wav"),
  alert30: require("../../assets/sounds/alert30.wav"),
};
const players: Partial<Record<SoundKey, AudioPlayer>> = {};
let ready: Promise<void> | null = null;
let generation = 0;
let error: string | null = null;
const listeners = new Set<() => void>();
function report(message: string | null) { error = message; listeners.forEach(l => l()); }
export function useAudioError() { return useSyncExternalStore(l => { listeners.add(l); return () => { listeners.delete(l); }; }, () => error, () => null); }
export function prepareAudio(): Promise<void> {
  if (!ready) ready = setAudioModeAsync({ playsInSilentMode: true, interruptionMode: "mixWithOthers", shouldPlayInBackground: false })
    .then(() => {
      for (const key of Object.keys(SOURCES) as SoundKey[]) {
        const player = players[key] ?? createAudioPlayer(SOURCES[key], { keepAudioSessionActive: false });
        player.volume = key === "whistle" || key === "final" ? 1 : 0.55;
        players[key] = player;
      }
    }).catch(e => { ready = null; throw e; });
  return ready;
}
export async function playSound(key: SoundKey): Promise<void> {
  if (AppState.currentState !== "active" && AppState.currentState !== null) return;
  const request = ++generation;
  try {
    await prepareAudio();
    if (request !== generation) return;
    Object.values(players).forEach(p => p?.pause());
    const p = players[key]!;
    await p.seekTo(0);
    if (request !== generation) return;
    p.play();
    report(null);
  } catch { report("Son indisponible. Vérifie le volume du téléphone."); }
}



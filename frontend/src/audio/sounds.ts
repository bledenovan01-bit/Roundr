// §9 / C19 — Audio local (WAV embarqués, aucune voix, aucun réseau).
// Coexistence avec la musique externe : mode "mixWithOthers", jamais de stop.
import { getPreferences } from "@/src/store/preferences";
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from "expo-audio";

type SoundKey = "alert" | "whistle" | "final" | "prep";

const SOURCES: Record<SoundKey, number> = {
  alert: require("../../assets/sounds/alert.wav"),
  whistle: require("../../assets/sounds/whistle.wav"),
  final: require("../../assets/sounds/final.wav"),
  prep: require("../../assets/sounds/prep.wav"),
};

const players: Partial<Record<SoundKey, AudioPlayer>> = {};
let modeReady = false;

async function ensureMode() {
  if (modeReady) return;
  modeReady = true;
  try {
    await setAudioModeAsync({
      playsInSilentMode: true,
      interruptionMode: "mixWithOthers",
      shouldPlayInBackground: false,
    });
  } catch {
    // Web / plateforme sans réglage : lecture simple.
  }
}

export async function playSound(key: SoundKey): Promise<void> {
  try {
    await ensureMode();
    let p = players[key];
    if (!p) {
      p = createAudioPlayer(SOURCES[key]);
      players[key] = p;
    }
    p.volume = getPreferences().volume;
    await p.seekTo(0);
    p.play();
  } catch {
    // Jamais bloquant : le retour visuel reste disponible.
  }
}

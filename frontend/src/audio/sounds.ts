// §9 / C19 — Audio local (WAV embarqués, aucune voix, aucun réseau).
// Coexistence avec la musique externe : mode "mixWithOthers", jamais de stop.
import { getPreferences } from "@/src/store/preferences";
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from "expo-audio";

export type SoundKey = "alert" | "whistle" | "final" | "prep" | "gong";
export const SOUND_CATALOG: {key:SoundKey; title:string; role:string; duration:number}[] = [
  {key:"whistle",title:"Sifflet d’arbitre",role:"Début du match, alternative pour fin et but",duration:0.65},
  {key:"final",title:"Sifflet final · trois coups",role:"Fin du match",duration:1.9},
  {key:"alert",title:"Célébration · fanfare courte",role:"But marqué",duration:1.65},
  {key:"prep",title:"Gong de préparation",role:"Équipes à préparer et rappels",duration:1.2},
  {key:"gong",title:"Gong de transition",role:"Fin de période, départage et alertes du chrono",duration:1.8},
];

const SOURCES: Record<SoundKey, number> = {
  gong: require("../../assets/sounds/gong.wav"),
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

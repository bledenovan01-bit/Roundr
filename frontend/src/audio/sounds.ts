// §9 / C19 — Audio local (WAV embarqués, aucune voix, aucun réseau).
// Coexistence avec la musique externe : mode "mixWithOthers", jamais de stop.
import { getPreferences } from "@/src/store/preferences";
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from "expo-audio";

import { soundAsset, type SoundKey, type SoundAsset, type SoundContext } from "./sound-identity";
export type { SoundKey } from "./sound-identity";
export const SOUND_CATALOG: {key:SoundKey; title:string; role:string; duration:number}[] = [
  {key:"whistle",title:"Metal Whistle",role:"Début du match, alternative pour fin et but",duration:0.8},
  {key:"final",title:"Metal Whistle · fin",role:"Fin du match · deux coups courts et un long",duration:1.737936507936508},
  {key:"alert",title:"Millerntor Stadium · but",role:"But marqué · B1 V2",duration:2.4},
  {key:"prep",title:"Hint · transition",role:"Équipes à préparer et transitions",duration:0.265},
  {key:"gong",title:"Digital Interface Alert 20",role:"Alertes temporelles ; Hint pour les transitions",duration:0.552},
];

const SOURCES: Record<SoundAsset, number> = {
  gong: require("../../assets/sounds/gong.wav"),
  alert: require("../../assets/sounds/alert.wav"),
  whistle: require("../../assets/sounds/whistle.wav"),
  final: require("../../assets/sounds/final.wav"),
  prep: require("../../assets/sounds/prep.wav"),
  "free-final": require("../../assets/sounds/free-final.wav"),
  // Selected E1 resource, reserved: no confirmation event exists in this base.
  confirmation: require("../../assets/sounds/confirmation.wav"),
};

const players: Partial<Record<SoundAsset, AudioPlayer>> = {};
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

export async function playSound(key: SoundKey, context?: SoundContext): Promise<void> {
  try {
    const asset = soundAsset(key, context);
    await ensureMode();
    let p = players[asset];
    if (!p) {
      p = createAudioPlayer(SOURCES[asset]);
      players[asset] = p;
    }
    p.volume = getPreferences().volume;
    await p.seekTo(0);
    p.play();
  } catch {
    // Jamais bloquant : le retour visuel reste disponible.
  }
}

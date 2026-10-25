// Keep persisted preference keys stable; context selects resources only at
// existing calls. Choosing a different sound in Settings still takes priority.
export type SoundKey = "alert" | "whistle" | "final" | "prep" | "gong";
export type SoundContext = "periodEnd" | "freeTransition" | "freeEnd";
export type SoundAsset = SoundKey | "free-final" | "confirmation";
export function soundAsset(key: SoundKey, context?: SoundContext): SoundAsset {
  if (key === "final" && context === "freeEnd") return "free-final";
  if (key === "gong" && (context === "periodEnd" || context === "freeTransition")) return "prep";
  return key;
}

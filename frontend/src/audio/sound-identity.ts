// Keep persisted preference keys stable; context selects resources only at
// existing calls. Choosing a different sound in Settings still takes priority.
export type SoundKey = "alert" | "whistle" | "final" | "prep" | "gong";
export type SoundContext = "periodEnd" | "freeTransition" | "freeEnd";
export type SoundAsset = SoundKey | "free-final" | "confirmation";
export type SoundPreference = "startSound" | "goalSound" | "minuteSound" | "periodSound" | "endSound" | "warmupSound";
// Settings previews must resolve the same context as the existing match event.
export function soundPreviewContext(preference: SoundPreference): SoundContext | undefined {
  return preference === "periodSound" ? "periodEnd" : undefined;
}
export function soundAsset(key: SoundKey, context?: SoundContext): SoundAsset {
  if (key === "final" && context === "freeEnd") return "free-final";
  if (key === "gong" && (context === "periodEnd" || context === "freeTransition")) return "prep";
  return key;
}

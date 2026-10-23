import {
  initialFreeDraft,
  copyFreeDraft,
  type FreeDraft,
} from "@/src/domain/free-configuration";
import type { FreeTimerConfig, FreeTimerPreset } from "@/src/domain/free-timer";
export type FreeEditing = { id: string; name: string } | null;
let draft = initialFreeDraft();
let editing: FreeEditing = null;
export const readFreeDraft = () => copyFreeDraft(draft);
export const rememberFreeDraft = (next: FreeDraft) => {
  draft = copyFreeDraft(next);
};
export const readFreeEditing = () => editing;
export const rememberFreeEditing = (next: FreeEditing) => {
  editing = next;
};
export function freePresetSnapshot(
  name: string,
  config: FreeTimerConfig,
  previous?: FreeTimerPreset,
): FreeTimerPreset {
  return {
    id:
      previous?.id ??
      `free-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    name: name.trim(),
    config: JSON.parse(JSON.stringify(config)),
    createdAt: previous?.createdAt ?? Date.now(),
  };
}

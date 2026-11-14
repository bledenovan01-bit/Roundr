import { useSyncExternalStore } from "react";
import { subscribeTheme, themeName } from "@/src/visual/lovable";

/**
 * Subscribe at each screen's render boundary, including routes kept in the
 * navigation stack. Re-render the existing tree when colours change: never
 * replace its identity, local controls, carousel selection or open sheets.
 * Shared children render normally; legacy components already use useTheme().
 */
export function useAppearance() {
  return useSyncExternalStore(subscribeTheme, themeName, themeName);
}

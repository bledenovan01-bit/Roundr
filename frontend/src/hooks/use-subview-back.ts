import { useCallback } from "react";
import { BackHandler } from "react-native";
import { useFocusEffect } from "expo-router";
import { usePreventRemove } from "expo-router/react-navigation";

/** Give native back the same meaning as the screen's back button in a subview. */
export function useSubviewBack(active: boolean, onBack: () => void) {
  usePreventRemove(active, ({ data, repeat }) => {
    if (["GO_BACK", "POP", "POP_TO_TOP"].includes(data.action.type)) onBack();
    // Any other navigation (e.g. dismissTo the home screen) goes through.
    // `repeat` lifts the prevention first: dispatching the action directly
    // would be prevented again and loop ("Maximum update depth exceeded").
    else repeat();
  });
  useFocusEffect(useCallback(() => {
    if (!active) return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      onBack();
      return true;
    });
    return () => sub.remove();
  }, [active, onBack]));
}

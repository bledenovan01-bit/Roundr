import { useCallback } from "react";
import { BackHandler } from "react-native";
import { useFocusEffect, useNavigation } from "expo-router";
import { usePreventRemove } from "expo-router/react-navigation";

/** Give native back the same meaning as the screen's back button in a subview. */
export function useSubviewBack(active: boolean, onBack: () => void) {
  const navigation = useNavigation();
  usePreventRemove(active, ({ data }) => {
    if (["GO_BACK", "POP", "POP_TO_TOP"].includes(data.action.type)) onBack();
    else navigation.dispatch(data.action);
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

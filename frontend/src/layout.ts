// Presentation only: safe usable width, never device names or game state.
import { StyleSheet, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export function useScreenLayout() {
  const { width, height, fontScale } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const contentWidth = Math.min(760, width - insets.left - insets.right);
  return {
    insets,
    contentWidth,
    compact: contentWidth / fontScale < 360,
    landscape: width > height,
    fontScale,
    safeSides: { paddingLeft: insets.left, paddingRight: insets.right },
  };
}

export const layoutStyles = StyleSheet.create({
  content: { width: "100%", maxWidth: 760, alignSelf: "center" },
  scroll: { flex: 1, minHeight: 0 },
  flexible: { flex: 1, minWidth: 0 },
});
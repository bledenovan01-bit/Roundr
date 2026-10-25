import { Platform, useWindowDimensions } from "react-native";

// RN Web measures the visual viewport, which shrinks/zooms when an iOS keyboard
// opens. Form columns must follow the layout viewport instead of treating that
// change as a device rotation. Keep the native sizing/keyboard behavior intact.
export function useFormWindowDimensions() {
  const dimensions = useWindowDimensions();
  if (Platform.OS !== "web" || typeof document === "undefined") return dimensions;
  return {
    ...dimensions,
    width: document.documentElement.clientWidth || dimensions.width,
    height: document.documentElement.clientHeight || dimensions.height,
  };
}

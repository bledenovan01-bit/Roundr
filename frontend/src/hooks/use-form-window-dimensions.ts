import { useSyncExternalStore } from "react";
import { Platform, useWindowDimensions } from "react-native";

function readScreenLandscape(): boolean | null {
  if (Platform.OS !== "web" || typeof window === "undefined") return null;
  const legacyAngle = (window as Window & { orientation?: number }).orientation;
  // Desktop windows must remain responsive to window resizing, independently
  // of the monitor's orientation. Mobile screen orientation ignores keyboards.
  if (typeof legacyAngle !== "number" && !window.matchMedia("(pointer: coarse)").matches) return null;
  const type = window.screen.orientation?.type;
  if (type?.startsWith("portrait")) return false;
  if (type?.startsWith("landscape")) return true;
  // Older iOS exposes window.orientation rather than ScreenOrientation.
  return typeof legacyAngle === "number" ? Math.abs(legacyAngle % 180) === 90 : null;
}

function subscribeOrientation(onChange: () => void) {
  if (Platform.OS !== "web" || typeof window === "undefined") return () => {};
  const orientation = window.screen.orientation;
  window.addEventListener("resize", onChange);
  window.addEventListener("orientationchange", onChange);
  orientation?.addEventListener("change", onChange);
  return () => {
    window.removeEventListener("resize", onChange);
    window.removeEventListener("orientationchange", onChange);
    orientation?.removeEventListener("change", onChange);
  };
}

const serverOrientation = () => null;

// Both visualViewport and document.clientHeight can shrink for a keyboard.
// Dimensions still size the form, but only device rotation selects its columns.
export function useFormWindowDimensions() {
  const dimensions = useWindowDimensions();
  const screenLandscape = useSyncExternalStore(subscribeOrientation, readScreenLandscape, serverOrientation);
  const layout = Platform.OS === "web" && typeof document !== "undefined" ? {
    width: document.documentElement.clientWidth || dimensions.width,
    height: document.documentElement.clientHeight || dimensions.height,
  } : dimensions;
  return {
    ...dimensions,
    ...layout,
    landscape: screenLandscape ?? layout.width > layout.height,
  };
}

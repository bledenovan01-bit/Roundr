import { Platform } from "react-native";
import type { GProps } from "react-native-svg";

// Svg's web renderer forwards native-only `accessible` to React DOM. Keep the
// native flag intact and express the same decorative intent with ARIA on web.
export const decorativeSvgAccessibility = Platform.OS === "web"
  ? { "aria-hidden": true } as const
  : { accessible: false } as const;

// `origin` in react-native-svg 15.15.4 generates the invalid React DOM prop
// `transform-origin`. Use SVG's standard centred rotation on web only.
export function svgRotation(rotation: number, originX: number, originY: number): Pick<GProps, "transform" | "rotation" | "origin"> {
  return Platform.OS === "web"
    ? { transform: `rotate(${rotation} ${originX} ${originY})` }
    : { rotation, origin: `${originX},${originY}` };
}

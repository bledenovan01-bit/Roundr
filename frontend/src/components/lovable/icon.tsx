import Svg, { Circle, Line, Path, Polyline, Rect } from "react-native-svg";

// Exact geometry from the frozen reference: its custom pitch + Lucide 0.575.0.
// Lucide (ISC): Copyright (c) Cole Bemis 2013-2026 (Feather portions, MIT)
// and Lucide Contributors 2026. See docs/lucide-license.txt.
export type LovableIconName = "pitch" | "refresh" | "trophy" | "swords" | "timer" | "users" | "history" | "settings" | "chevron" | "back" | "pencil" | "trash" | "flag" | "archive" | "check";

export function LovableIcon({ name, color, size = 16 }: { name: LovableIconName; color: string; size?: number }) {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={name === "settings" ? 1.8 : 2} strokeLinecap={name === "pitch" ? "butt" : "round"} strokeLinejoin={name === "pitch" ? "miter" : "round"} accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" aria-hidden>
    {name === "pitch" ? <><Rect x="2" y="4" width="20" height="16" rx="1" /><Path d="M12 4v16M2 8h4v8H2m20-8h-4v8h4" /><Circle cx="12" cy="12" r="3" /></> : null}
    {name === "refresh" ? <><Path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><Path d="M21 3v5h-5" /><Path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" /><Path d="M8 16H3v5" /></> : null}
    {name === "trophy" ? <><Path d="M10 14.66v1.626a2 2 0 0 1-.976 1.696A5 5 0 0 0 7 21.978" /><Path d="M14 14.66v1.626a2 2 0 0 0 .976 1.696A5 5 0 0 1 17 21.978" /><Path d="M18 9h1.5a1 1 0 0 0 0-5H18" /><Path d="M4 22h16" /><Path d="M6 9a6 6 0 0 0 12 0V3a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1z" /><Path d="M6 9H4.5a1 1 0 0 1 0-5H6" /></> : null}
    {name === "swords" ? <><Polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5" /><Line x1="13" x2="19" y1="19" y2="13" /><Line x1="16" x2="20" y1="16" y2="20" /><Line x1="19" x2="21" y1="21" y2="19" /><Polyline points="14.5 6.5 18 3 21 3 21 6 17.5 9.5" /><Line x1="5" x2="9" y1="14" y2="18" /><Line x1="7" x2="4" y1="17" y2="20" /><Line x1="3" x2="5" y1="19" y2="21" /></> : null}
    {name === "timer" ? <><Line x1="10" x2="14" y1="2" y2="2" /><Line x1="12" x2="15" y1="14" y2="11" /><Circle cx="12" cy="14" r="8" /></> : null}
    {name === "users" ? <><Path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><Path d="M16 3.128a4 4 0 0 1 0 7.744" /><Path d="M22 21v-2a4 4 0 0 0-3-3.87" /><Circle cx="9" cy="7" r="4" /></> : null}
    {name === "history" ? <><Path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><Path d="M3 3v5h5" /><Path d="M12 7v5l4 2" /></> : null}
    {name === "settings" ? <><Path d="M14 17H5" /><Path d="M19 7h-9" /><Circle cx="17" cy="17" r="3" /><Circle cx="7" cy="7" r="3" /></> : null}
    {name === "chevron" ? <Path d="m9 18 6-6-6-6" /> : null}
    {name === "back" ? <><Path d="m12 19-7-7 7-7" /><Path d="M5 12h14" /></> : null}
    {name === "pencil" ? <><Path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" /><Path d="m15 5 4 4" /></> : null}
    {name === "trash" ? <><Path d="M10 11v6M14 11v6M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></> : null}
    {name === "flag" ? <Path d="M4 22V4a1 1 0 0 1 .4-.8A6 6 0 0 1 8 2c3 0 5 2 7.333 2q2 0 3.067-.8A1 1 0 0 1 20 4v10a1 1 0 0 1-.4.8A6 6 0 0 1 16 16c-3 0-5-2-8-2a6 6 0 0 0-4 1.528" /> : null}
    {name === "archive" ? <><Rect width="20" height="5" x="2" y="3" rx="1" /><Path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8M10 12h4" /></> : null}
    {name === "check" ? <Path d="M20 6 9 17l-5-5" /> : null}
  </Svg>;
}

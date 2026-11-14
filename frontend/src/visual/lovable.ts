// Roundr colours by role, in two themes. Presentation only.
//
// Dark is the Lovable reference (1c59720): sRGB equivalents of its OKLCH
// tokens. Light follows the merged Lovable/Krono mockup: off-white page, clear
// surfaces, dark text and a deeper green for commands.
//
// Screens read `lovable.<role>`; the object is switched in place by
// `applyTheme`, so no screen names a theme. Module-level styles must go through
// `themed()` so they are rebuilt for the active theme.

export type ThemeName = "dark" | "light";

const dark = {
  background: "#020909",
  foreground: "#edf3f0",
  card: "#091516",
  cardRaised: "#101f1f",
  secondary: "#0e1b1c",
  mutedSurface: "#152223",
  cupChampion: "#131c27",
  cupPodium: "#141d29",
  survieChampion: "#1d1f1a",
  surviePodium: "#1f201b",
  primary: "#6ce182",
  onPrimary: "#03130b",
  muted: "#92a2a3",
  border: "#202e30",
  amber: "#fcb442",
  resume: "#0e211d",
  error: "#fd393f",
  introGlow: "#003821",
  homeGlow: "#00391b",
  classic: "#6ce182",
  maracana: "#3480fc",
  cup: "#8d5df8",
  survie: "#fe860f",
  custom: "#6b727e",
  // Roles added for the two-theme design.
  /** Text on the destructive button. */
  onError: "#edf3f0",
  /** Backdrop behind sheets. */
  scrim: "rgba(0,3,3,.78)",
  /** "Enters the pitch" marker in the Maracana rotation. */
  incoming: "#20c8d5",
};

export type Palette = { [K in keyof typeof dark]: string };

const light: Palette = {
  background: "#f3f6f1",
  foreground: "#0c1b18",
  card: "#ffffff",
  cardRaised: "#eef2ec",
  secondary: "#eef2ec",
  mutedSurface: "#e1e8e0",
  cupChampion: "#eeeafb",
  cupPodium: "#f1eefb",
  survieChampion: "#fbefdf",
  surviePodium: "#fcf3e6",
  primary: "#17694a",
  onPrimary: "#ffffff",
  muted: "#55655f",
  border: "#d6ded5",
  amber: "#9a5600",
  resume: "#e3f2e7",
  error: "#c62828",
  introGlow: "#cfe9d6",
  homeGlow: "#d7eedd",
  classic: "#17794a",
  maracana: "#1f5fd6",
  cup: "#6a3fd0",
  survie: "#b85a06",
  custom: "#56637a",
  onError: "#ffffff",
  scrim: "rgba(12,27,24,.45)",
  incoming: "#0b7f8a",
};

export const palettes: Record<ThemeName, Palette> = { dark, light };

/** Colours that never change with the theme: logo, photo overlays, mode tiles. */
export const brand = {
  ink: "#020909",
  paper: "#edf3f0",
  ball: "#6ce182",
  /** Solid mode tiles on the home screen, with a white pictogram. */
  tile: {
    classic: "#1f7a4d",
    maracana: "#2f6bd6",
    cup: "#7648c8",
    survie: "#b05e1a",
    custom: "#566579",
  },
} as const;

export const lovable: Palette = { ...dark };

let current: ThemeName = "dark";
let version = 0;
const listeners = new Set<() => void>();

export function themeName(): ThemeName {
  return current;
}
export function themeVersion() {
  return version;
}
export function isThemeName(value: unknown): value is ThemeName {
  return value === "dark" || value === "light";
}
/** Switches every role colour at once. Never touches timers, scores or storage. */
export function applyTheme(name: ThemeName) {
  if (name === current) return;
  current = name;
  Object.assign(lovable, palettes[name]);
  version++;
  listeners.forEach((listener) => listener());
}
export function subscribeTheme(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Module-level styles that read `lovable`. The factory runs again after a theme
 * change, so a style object created at import time never keeps old colours.
 */
export function themed<T extends object>(factory: () => T): T {
  let cached: T | undefined;
  let builtFor = -1;
  const value = () => {
    if (builtFor !== version || cached === undefined) {
      cached = factory();
      builtFor = version;
    }
    return cached;
  };
  return new Proxy({} as T, {
    get: (_target, key) => (value() as Record<PropertyKey, unknown>)[key],
    has: (_target, key) => key in value(),
    ownKeys: () => Reflect.ownKeys(value()),
    getOwnPropertyDescriptor: (_target, key) => {
      const descriptor = Object.getOwnPropertyDescriptor(value(), key);
      return descriptor ? { ...descriptor, configurable: true } : undefined;
    },
  });
}

export const lovableFont = {
  regular: "ManropeRefined-Regular",
  semibold: "ManropeRefined-SemiBold",
  extrabold: "ManropeRefined-ExtraBold",
} as const;

export const lovableSpace = { page: 20, gap: 12, card: 14, radius: 18 } as const;

export function withAlpha(hex: string, alpha: number) {
  const rgb = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
  return `rgba(${rgb.join(",")},${alpha})`;
}

// Opt-in foundations for the frozen Lovable reference (1c59720).
// sRGB equivalents of src/styles.css OKLCH tokens, rounded to 8-bit channels.
// Existing screens keep their theme until their visual phase is approved.
export const lovable = {
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
} as const;

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

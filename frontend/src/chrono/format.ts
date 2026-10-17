// Formatting helpers for the chrono. Kept separate so screens can import
// only what they need and unit tests stay light.

// MM:SS. Never negative, ms rounded down to the second.
export function formatMMSS(ms: number): string {
  const safe = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

// MM:SS.cc — avec centièmes de seconde (réf. Lovable). Ex. "06:58.42".
// Jamais négatif. Les centièmes sont tronqués (floor) pour un décompte franc.
export function formatMMSScc(ms: number): string {
  const safe = Math.max(0, ms);
  const totalSeconds = Math.floor(safe / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const centis = Math.floor((safe % 1000) / 10);
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(centis).padStart(2, "0")}`;
}

// HH:MM:SS variant when a session runs over an hour (rare in amateur play).
export function formatHHMMSS(ms: number): string {
  const safe = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

// Human-readable phase label for UI (French, keeping the spec's vocabulary).
export function phaseLabel(
  phase:
    | "idle"
    | "playing"
    | "paused"
    | "additional"
    | "extra"
    | "golden"
    | "finished",
): string {
  switch (phase) {
    case "idle":
      return "Prêt";
    case "playing":
      return "En jeu";
    case "paused":
      return "Pause";
    case "additional":
      return "Additionnel";
    case "extra":
      return "Prolongation";
    case "golden":
      return "Golden goal";
    case "finished":
      return "Terminé";
    default:
      return "";
  }
}

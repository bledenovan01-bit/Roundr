import type MaterialCommunityIcons from "@react-native-vector-icons/material-design-icons";

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];

export type GameModeId =
  | "classique"
  | "maracana"
  | "cup"
  | "survie"
  | "custom";

export type GameMode = {
  id: GameModeId;
  title: string;
  description: string;
  icon: IconName;
  accent: "modeClassique" | "modeMaracana" | "modeCup" | "modeSurvie" | "modeCustom";
};

// Static catalogue of the 5 modes shipped in Roundr V0.
// Descriptions kept short for pitch-side legibility (§ E01 cahier des charges).
export const GAME_MODES: GameMode[] = [
  {
    id: "classique",
    title: "Match classique",
    description: "2 équipes · chrono rapide",
    icon: "soccer-field",
    accent: "modeClassique",
  },
  {
    id: "maracana",
    title: "Maracana",
    description: "Rotations automatiques · 3 à 8 équipes",
    icon: "sync",
    accent: "modeMaracana",
  },
  {
    id: "cup",
    title: "Cup",
    description: "Poules + phases finales · 4 à 32 équipes",
    icon: "trophy",
    accent: "modeCup",
  },
  {
    id: "survie",
    title: "Survie",
    description: "Élimination directe · 2 à 32 équipes",
    icon: "fire",
    accent: "modeSurvie",
  },
  {
    id: "custom",
    title: "Custom",
    description: "Chrono personnalisable · presets",
    icon: "tune-variant",
    accent: "modeCustom",
  },
];

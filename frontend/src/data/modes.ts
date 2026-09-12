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
};

// Static catalogue of the 5 modes shipped in Roundr V0.
// Descriptions kept short for pitch-side legibility (§ E01 cahier des charges).
export const GAME_MODES: GameMode[] = [
  {
    id: "classique",
    title: "Match Classique",
    description: "1 match, 2 équipes, périodes chronométrées.",
    icon: "whistle",
  },
  {
    id: "maracana",
    title: "Maracana",
    description: "Rotations continues, 3 à 8 équipes, vainqueur reste.",
    icon: "sync",
  },
  {
    id: "cup",
    title: "Cup",
    description: "Poules puis phases finales, 4 à 32 équipes.",
    icon: "trophy",
  },
  {
    id: "survie",
    title: "Survie",
    description: "Élimination directe, 2 à 32 équipes.",
    icon: "sword-cross",
  },
  {
    id: "custom",
    title: "Custom",
    description: "Chrono libre, périodes et pauses au choix.",
    icon: "tune-variant",
  },
];

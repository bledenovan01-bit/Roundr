import { Alert } from "@/src/alert";

/** Only the affirmative native/web button may mutate the current match. */
export function confirmMatchRestart(onConfirmed: () => void) {
  Alert.alert(
    "Relancer le match ?",
    "Le score et le temps du match actuel seront remis à zéro.",
    [
      { text: "Annuler", style: "cancel" },
      { text: "Relancer", onPress: onConfirmed },
    ],
  );
}

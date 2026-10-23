import { Alert } from "@/src/alert";
import { createFreeTimer, stepElapsed, validFreeConfig, type FreeTimerConfig, type FreeTimerState } from "@/src/domain/free-timer";
import { freeTimerRecoveryPending, getStoreState, replaceFreeTimer } from "@/src/store/session-store";

export function hasFreeTimerProgress(timer: FreeTimerState | null, now = Date.now()): boolean {
  return !!timer && !timer.finished && (timer.stepIndex > 0 || stepElapsed(timer, now) > 0 || timer.laps.length > 0 || timer.score.some(n => n > 0));
}

// All four entry paths use this guard. Cancel/dismiss does not mutate memory
// or storage. A delayed dialog never authorizes replacing a different session.
export function prepareFreeTimer(config: FreeTimerConfig, onReady: () => void): void {
  if (!validFreeConfig(config)) {
    Alert.alert("Chrono invalide", "Cette configuration ne peut pas être utilisée. La séance en cours est conservée.");
    return;
  }
  const current = getStoreState().freeTimer;
  const snapshot = JSON.parse(JSON.stringify(config)) as FreeTimerConfig;
  const replace = async () => {
    if (getStoreState().freeTimer !== current) {
      prepareFreeTimer(snapshot, onReady);
      return;
    }
    if (await replaceFreeTimer(createFreeTimer(snapshot), current)) onReady();
  };
  if (freeTimerRecoveryPending()) {
    Alert.alert("Sauvegarde non restaurée", "Une sauvegarde n’a pas pu être lue ou restaurée. Consulte l’erreur affichée avant de préparer une nouvelle séance. Annuler conserve la sauvegarde actuelle.", [
      { text: "Annuler", style: "cancel" },
      { text: "Préparer une nouvelle séance", onPress: replace },
    ], { cancelable: true });
    return;
  }
  if (!hasFreeTimerProgress(current)) { replace(); return; }
  Alert.alert("Remplacer le chrono en cours ?", "Sa progression, ses tours et ses scores seront remplacés par une nouvelle séance.", [
    { text: "Annuler", style: "cancel" },
    { text: "Remplacer", style: "destructive", onPress: replace },
  ], { cancelable: true });
}

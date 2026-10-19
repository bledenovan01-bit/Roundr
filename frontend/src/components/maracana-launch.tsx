import { Text, View } from "react-native";
import { elapsedMs } from "@/src/chrono/engine";
import { formatMMSS } from "@/src/chrono/format";
import { cancelNextLaunch, pauseNextLaunch, resumeNextLaunch, startNextImmediately } from "@/src/domain/session";
import type { Session } from "@/src/domain/types";
import { dispatchSession, useStore } from "@/src/store/session-store";
import { useTheme, fontFamily } from "@/src/theme";
import { PrimaryButton } from "./primary-button";

// Necessary controls for the new launch policy; the existing live layout stays intact.
export function MaracanaLaunchCountdown({ session }: { session: Session }) {
  const now = useStore(state => state.now), { colors } = useTheme();
  const pending = session.pendingLaunch;
  if (session.mode !== "maracana" || !pending || pending.cancelled) return null;
  const running = pending.chrono.runningSince !== null;
  const left = Math.ceil(Math.max(0, pending.chrono.regulationTargetMs - elapsedMs(pending.chrono, now)) / 1000) * 1000;
  return <View testID="next-launch-countdown" accessibilityLabel="Démarrage du prochain match" style={{ gap: 8, padding: 12, borderWidth: 1, borderRadius: 12, borderColor: colors.border }}>
    <Text style={{ fontFamily: fontFamily.textBold, color: colors.onSurface, textAlign: "center" }}>{running ? "PROCHAIN MATCH DANS" : "LANCEMENT EN PAUSE"}</Text>
    <Text accessibilityLiveRegion="polite" style={{ fontFamily: fontFamily.textBold, color: colors.onSurface, fontSize: 28, textAlign: "center", fontVariant: ["tabular-nums"] }}>{formatMMSS(left)}</Text>
    <PrimaryButton label="Démarrer immédiatement" onPress={() => dispatchSession(startNextImmediately)} />
    <PrimaryButton label={running ? "Pause du délai" : "Reprendre le délai"} variant="secondary" onPress={() => dispatchSession(running ? pauseNextLaunch : resumeNextLaunch)} />
    <PrimaryButton label="Annuler le lancement automatique" variant="secondary" onPress={() => dispatchSession(cancelNextLaunch)} />
  </View>;
}

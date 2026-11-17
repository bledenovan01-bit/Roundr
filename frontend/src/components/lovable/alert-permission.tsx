import { useState, type ReactNode } from "react";
import { StyleSheet, Text } from "react-native";
import { MatchAction, MatchSheet } from "./match-ui";
import { endAlertPermission, requestEndAlertPermission } from "@/src/notifications/end-alerts";
import { lovable, lovableFont, themed } from "@/src/visual/lovable";

// "Plus tard" holds for the rest of this app run; the question comes back at
// the next launch until the user answers the system prompt.
let postponed = false;

/**
 * Before the first chrono start, explains why Roundr asks for notifications,
 * then lets the system prompt appear only if the user agrees. The start always
 * goes ahead, whatever the answer.
 */
export function useAlertPermissionGate(): { gate: (start: () => void) => void; sheet: ReactNode } {
  const [pending, setPending] = useState<(() => void) | null>(null);
  const gate = (start: () => void) => {
    if (postponed) { start(); return; }
    void endAlertPermission().then(status => {
      if (status === "undetermined") setPending(() => start);
      else start();
    });
  };
  const finish = (allow: boolean) => {
    const start = pending;
    setPending(null);
    if (!allow) postponed = true;
    const go = () => start?.();
    if (allow) void requestEndAlertPermission().finally(go);
    else go();
  };
  const sheet = pending ? <MatchSheet label="Sifflet téléphone verrouillé" onClose={() => finish(false)}>
    <Text accessibilityRole="header" style={styles.title}>Entendre le sifflet téléphone verrouillé</Text>
    <Text style={styles.text}>Si l'écran se verrouille ou si tu changes d'appli, Roundr signale la fin de la période par une notification. Ton téléphone va te demander l'autorisation.</Text>
    <MatchAction testID="alert-permission-allow" label="Autoriser" onPress={() => finish(true)} />
    <MatchAction testID="alert-permission-later" label="Plus tard" kind="text" onPress={() => finish(false)} />
  </MatchSheet> : null;
  return { gate, sheet };
}

const styles = themed(() => StyleSheet.create({
  title: { fontFamily: lovableFont.extrabold, fontSize: 20, lineHeight: 28, color: lovable.foreground, textAlign: "center" },
  text: { fontFamily: lovableFont.regular, fontSize: 15, lineHeight: 22, color: lovable.foreground, textAlign: "center" },
}));

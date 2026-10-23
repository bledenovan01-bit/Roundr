// Isolated interaction harness. Never copied into the production repository/export.
import { useEffect } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import * as S from "@/src/domain/session";
import { lovableConfigTeams, lovableLaunchDefaults } from "@/src/features/lovable-config-state";
import { dispatchSession, loadStore, startSession, useStore } from "@/src/store/session-store";
import { LovableMatchScreen } from "@/src/features/lovable-match";

export default function InteractionLab() {
  const session = useStore(s => s.session);
  useEffect(() => { void loadStore(); }, []);
  const seed = (kind: "classic" | "manual" | "banner") => {
    const mode = kind === "classic" ? "classique" : "maracana", now = Date.now();
    const origin = now - (kind === "banner" ? 238000 : 12345);
    const config: any = { ...lovableLaunchDefaults(mode), sounds: false, launch: "manual" };
    let s = S.restartCurrent(S.createSession(config, lovableConfigTeams(mode, mode === "classique" ? 2 : 5), origin), origin);
    s = S.startReady(s, origin);
    if (kind !== "banner") { s = S.goal(s, 0, 1, origin + 1000); s = S.pause(s, now); }
    if (kind === "manual") s = S.endManual(s, now);
    startSession(s); dispatchSession(() => s, { silent: true });
  };
  return <View style={{ flex: 1 }}>
    <View style={{ flexDirection: "row", backgroundColor: "white", gap: 12 }}>
      {(["classic", "manual", "banner"] as const).map(kind => <Pressable accessibilityRole="button" key={kind} onPress={() => seed(kind)}><Text style={{ color: "black" }}>Préparer {kind}</Text></Pressable>)}
    </View>
    <ScrollView horizontal style={{ flexGrow: 0, height: 24, backgroundColor: "white" }}><Text testID="lab-session" style={{ color: "black", fontSize: 10 }}>{JSON.stringify(session)}</Text></ScrollView>
    {session ? <LovableMatchScreen /> : <Text>Aucune séance de test</Text>}
  </View>;
}

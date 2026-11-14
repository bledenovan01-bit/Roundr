import { useState } from "react";
import { Text, View } from "react-native";
import { useRouter } from "expo-router";
import type { Session } from "@/src/domain/types";
import { buildSummary } from "@/src/domain/summary";
import { createSession } from "@/src/domain/session";
import { getStoreState, startSession, useStore } from "@/src/store/session-store";
import { PhaseFrame } from "@/src/components/lovable/phase2b-ui";
import { MatchAction, m } from "@/src/components/lovable/match-ui";
import { PitchPhoto } from "@/src/components/lovable/pitch-photo";
import { brand, lovable as c, lovableFont as f } from "@/src/visual/lovable";
import { sessionShareText } from "./share-summary";
import { shareText } from "./share";

/** The archived session remains the source for both the screen and sharing. */
export function MaracanaSummary({ session }: { session: Session }) {
  const router = useRouter();
  const error = useStore(s => s.saveError);
  const active = useStore(s => s.session);
  const [note, setNote] = useState<string | null>(null);
  const summary = buildSummary(session);
  const home = () => router.replace("/");
  const share = async () => {
    const result = await shareText(sessionShareText(session));
    setNote(result === "copied" ? "Résumé copié." : result === "unavailable" ? "Partage indisponible sur cet appareil." : null);
  };
  return <PhaseFrame title="Fin de session" subtitle="Maracana" onBack={home} footer={
    <View style={{ gap: 8 }}>
      <MatchAction testID="result-share" label="Partager le résumé" icon="share" onPress={() => { void share(); }} />
      {note ? <Text accessibilityLiveRegion="polite" style={[m.muted, { textAlign: "center" }]}>{note}</Text> : null}
      <View style={{ flexDirection: "row", gap: 8 }}>
        <View style={{ flex: 1 }}><MatchAction label="Rejouer" kind="secondary" icon="restart" disabled={!!active || !!error} onPress={() => {
          if (!getStoreState().session && startSession(createSession(session.config, session.teams, Date.now()))) router.replace("/live");
        }} /></View>
        <View style={{ flex: 1 }}><MatchAction label="Retour à l’accueil" kind="secondary" onPress={home} /></View>
      </View>
    </View>
  }>{[
    error ? <Text key="error" accessibilityRole="alert" style={m.error}>{error}</Text> : null,
    <View key="result" testID="summary-result" style={{ minHeight: 210, borderRadius: 20, overflow: "hidden", padding: 24, gap: 14, alignItems: "center", justifyContent: "center" }}>
      <PitchPhoto />
      <Text style={{ color: brand.paper, fontFamily: f.semibold, fontSize: 14 }}>{summary.leaders.length > 1 ? "Équipes en tête" : "Équipe en tête"}</Text>
      <Text testID="summary-headline" style={{ color: brand.paper, fontFamily: f.extrabold, fontSize: 28, lineHeight: 38, textAlign: "center" }}>{summary.headline}</Text>
      {summary.sub ? <Text style={{ color: brand.ball, fontFamily: f.extrabold, fontSize: 18 }}>{summary.sub}</Text> : null}
    </View>,
    <View key="stats" style={[m.card, { gap: 12 }]}>{summary.stats.map(stat => <View key={stat.label} style={{ flexDirection: "row", gap: 12, justifyContent: "space-between" }}>
      <Text style={{ color: c.muted, fontFamily: f.regular, flex: 1 }}>{stat.label}</Text>
      <Text style={{ color: c.foreground, fontFamily: f.extrabold }}>{stat.value}</Text>
    </View>)}</View>,
    <MatchAction key="ranking" label="Voir le classement" kind="secondary" icon="trophy" onPress={() => router.push("/standings?summary=1")} />,
  ]}</PhaseFrame>;
}

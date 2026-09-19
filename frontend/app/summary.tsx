// E09 / E11 — Fin de session, résumé par mode, carte de partage PNG locale.
import { useRef, useState } from "react";
import { useRouter } from "expo-router";
import { Alert, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialCommunityIcons from "@react-native-vector-icons/material-design-icons";
import { captureRef } from "react-native-view-shot";
import * as Sharing from "expo-sharing";

import { PrimaryButton } from "@/src/components/primary-button";
import { GAME_MODES } from "@/src/data/modes";
import { createSession } from "@/src/domain/session";
import { buildSummary } from "@/src/domain/summary";
import { discardSession, getStoreState, startSession, useStore } from "@/src/store/session-store";
import { fontFamily, fontSize, makeStyles, radius, spacing, useTheme } from "@/src/theme";

export default function SummaryScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const session = useStore((s) => s.lastSummary);
  const cardRef = useRef<View>(null);
  const [sharing, setSharing] = useState(false);

  if (!session) {
    return (
      <View
        style={[
          styles.root,
          {
            paddingTop: insets.top + spacing.xl,
            paddingHorizontal: spacing.xl,
            paddingBottom: spacing.xl,
            justifyContent: "center",
            gap: spacing.lg,
          },
        ]}
      >
        <Text style={styles.sub}>Aucun résumé disponible.</Text>
        <PrimaryButton label="Accueil" onPress={() => router.replace("/" as never)} />
      </View>
    );
  }
  const mode = GAME_MODES.find((m) => m.id === session.mode)!;
  const summary = buildSummary(session);
  const single = session.mode === "classique" || session.mode === "custom";

  // C21 — Rejouer : même configuration et équipes, nouvelle session à zéro.
  const replay = () => {
    const go = () => {
      startSession(createSession(session.config, session.teams, Date.now()));
      router.replace("/live" as never);
    };
    const active = getStoreState().session;
    if (active && active.status === "active") {
      Alert.alert("Session en cours", "Remplacer la session active ?", [{ text: "Annuler", style: "cancel" }, { text: "Remplacer", style: "destructive", onPress: () => { discardSession(); go(); } }]);
      return;
    }
    go();
  };

  const share = async () => {
    if (sharing) return;
    setSharing(true);
    try {
      const uri = await captureRef(cardRef, { format: "png", quality: 1, result: "tmpfile" });
      if (Platform.OS !== "web" && (await Sharing.isAvailableAsync())) {
        await Sharing.shareAsync(uri, { mimeType: "image/png", dialogTitle: "Partager le résultat" });
      } else {
        Alert.alert("Partage", "Partage système indisponible sur cette plateforme. La carte a été générée localement.");
      }
    } catch {
      Alert.alert("Partage", "Génération de la carte impossible.");
    } finally {
      setSharing(false);
    }
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + spacing["2xl"] }]}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>{mode.title.toUpperCase()}</Text>
          <Text style={styles.title}>{summary.title}</Text>
          {summary.interrupted ? <Text style={[styles.sub, { color: colors.warning }]}>Interrompu · résultats réels conservés, aucun champion fictif.</Text> : null}
        </View>

        {/* Carte de partage (E11) — capturée en PNG */}
        <View ref={cardRef} collapsable={false} style={styles.card} testID="share-card">
          <View style={styles.cardTop}>
            <Text style={styles.brand}>Roundr<Text style={{ color: colors.brandPrimary }}>.</Text></Text>
            <Text style={styles.cardMode}>{mode.title}</Text>
          </View>
          <Text style={styles.cardHeadline} numberOfLines={3} adjustsFontSizeToFit>{summary.headline}</Text>
          {summary.sub ? <Text style={styles.cardSub}>{summary.sub}</Text> : null}
          <View style={styles.statsRow}>
            {summary.stats.map((s) => (
              <View key={s.label} style={styles.stat}>
                <Text style={styles.statValue}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>
          {summary.podium.length ? (
            <View style={{ gap: spacing.xs }}>
              {summary.podium.map((p) => (
                <Text key={`${p.place}-${p.name}`} style={styles.podium}>{p.place === 1 ? "🥇" : p.place === 2 ? "🥈" : "🥉"} {p.name}</Text>
              ))}
            </View>
          ) : null}
          <Text style={styles.tagline}>PLUS DE JEU. MOINS D’ORGANISATION.</Text>
        </View>

        <View style={styles.actions}>
          {single ? <PrimaryButton testID="summary-replay" label="Rejouer" onPress={replay} /> : null}
          {!single ? <PrimaryButton testID="summary-new" label="Nouvelle session" onPress={() => router.replace(`/config/${session.mode}` as never)} /> : null}
          {single ? <PrimaryButton testID="summary-new" label="Nouveau match" variant="secondary" onPress={() => router.replace(`/config/${session.mode}` as never)} /> : null}
          {!single ? (
            <Pressable testID="summary-details" onPress={() => router.push("/standings" as never)} style={styles.link}>
              <MaterialCommunityIcons name="podium" size={20} color={colors.brandPrimary} />
              <Text style={styles.linkLabel}>{session.mode === "maracana" ? "Classement complet & résultats" : "Tableau & résultats"}</Text>
            </Pressable>
          ) : null}
          <PrimaryButton testID="summary-share" label={sharing ? "Génération…" : "Partager le résultat"} variant="secondary" onPress={share} leadingIcon={<MaterialCommunityIcons name="share-variant" size={20} color={colors.onSurface} />} />
          <PrimaryButton testID="summary-home" label="Retour accueil" variant="ghost" onPress={() => router.replace("/" as never)} />
        </View>
      </ScrollView>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.surface },
  scroll: { padding: spacing.lg, gap: spacing.xl },
  header: { gap: spacing.xs },
  eyebrow: { fontFamily: fontFamily.textBold, fontSize: fontSize.sm, letterSpacing: 2.2, color: colors.brandPrimary },
  title: { fontFamily: fontFamily.textBold, fontSize: fontSize["2xl"], color: colors.onSurface, letterSpacing: -0.6 },
  sub: { fontFamily: fontFamily.text, fontSize: fontSize.base + 1, color: colors.muted },
  card: { backgroundColor: colors.surfaceSecondary, borderRadius: radius.xl, padding: spacing.xl, gap: spacing.lg, borderWidth: 1.5, borderColor: colors.brandPrimary, aspectRatio: 0.8, justifyContent: "space-between" },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  brand: { fontFamily: fontFamily.textBold, fontSize: fontSize["2xl"] - 2, color: colors.onSurface, letterSpacing: -0.8 },
  cardMode: { fontFamily: fontFamily.textBold, fontSize: fontSize.sm, letterSpacing: 1.8, color: colors.muted, textTransform: "uppercase" },
  cardHeadline: { fontFamily: fontFamily.display, fontSize: fontSize["3xl"], lineHeight: fontSize["3xl"] * 1.02, color: colors.onSurface },
  cardSub: { fontFamily: fontFamily.textBold, fontSize: fontSize.xl - 2, color: colors.brandPrimary },
  statsRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  stat: { minWidth: "44%", flexGrow: 1, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  statValue: { fontFamily: fontFamily.display, fontSize: fontSize["2xl"] + 2, color: colors.onSurface },
  statLabel: { fontFamily: fontFamily.text, fontSize: fontSize.sm, color: colors.muted },
  podium: { fontFamily: fontFamily.textBold, fontSize: fontSize.xl - 2, color: colors.onSurface },
  tagline: { fontFamily: fontFamily.text, fontSize: 10, letterSpacing: 2.2, color: colors.muted },
  actions: { gap: spacing.md },
  link: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm, minHeight: 52 },
  linkLabel: { fontFamily: fontFamily.textBold, fontSize: fontSize.base + 1, color: colors.brandPrimary },
}));

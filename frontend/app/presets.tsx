// E10 — Mes chronos : presets Custom locaux (C23).
import { useRouter } from "expo-router";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialCommunityIcons from "@react-native-vector-icons/material-design-icons";

import { PrimaryButton } from "@/src/components/primary-button";
import { defaultTeams, uid } from "@/src/domain/defaults";
import { createSession } from "@/src/domain/session";
import type { Preset } from "@/src/domain/types";
import { presetMeta } from "@/src/features/preset-meta";
import { discardSession, getStoreState, setPresets, startSession, useStore } from "@/src/store/session-store";
import { fontFamily, fontSize, makeStyles, radius, spacing, useTheme } from "@/src/theme";
import { layoutStyles, useScreenLayout } from "@/src/layout";

export default function PresetsScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { safeSides } = useScreenLayout();
  const router = useRouter();
  const presets = useStore((s) => s.presets);

  const launch = (p: Preset) => {
    const go = () => {
      startSession(createSession({ ...p.config, savePreset: false }, p.teams ?? defaultTeams("custom", 2), Date.now()));
      router.replace("/live" as never);
    };
    const active = getStoreState().session;
    if (active && active.status === "active") {
      Alert.alert("Session en cours", "Remplacer la session active ?", [{ text: "Annuler", style: "cancel" }, { text: "Remplacer", style: "destructive", onPress: () => { discardSession(); go(); } }]);
      return;
    }
    go();
  };
  const duplicate = (p: Preset) => setPresets([...presets, { ...p, id: uid(), name: `${p.name} (copie)`, createdAt: Date.now(), config: { ...p.config }, teams: p.teams ? p.teams.map((t) => ({ ...t })) : null }]);
  const remove = (p: Preset) =>
    Alert.alert("Supprimer le preset ?", `« ${p.name} » sera retiré de Mes chronos. Une session déjà lancée n’est pas affectée.`, [
      { text: "Annuler", style: "cancel" },
      { text: "Supprimer", style: "destructive", onPress: () => setPresets(presets.filter((x) => x.id !== p.id)) },
    ]);
  const rename = (p: Preset) => {
    if (Alert.prompt) {
      Alert.prompt("Renommer", undefined, (name) => name?.trim() && setPresets(presets.map((x) => (x.id === p.id ? { ...x, name: name.trim() } : x))), "plain-text", p.name);
    } else {
      router.push(`/config/custom?preset=${p.id}` as never);
    }
  };

  return (
    <View testID="presets-screen" style={[styles.root, safeSides, { paddingTop: insets.top }]}>
      <View style={[layoutStyles.content, styles.header]}>
        <Pressable testID="presets-back" onPress={() => router.back()} hitSlop={12} style={styles.iconBtn} accessibilityRole="button" accessibilityLabel="Retour">
          <MaterialCommunityIcons name="chevron-left" size={30} color={colors.onSurface} />
        </Pressable>
        <Text testID="presets-title" accessibilityRole="header" style={styles.title}>Mes chronos</Text>
        <View style={styles.iconBtn} />
      </View>
      <ScrollView testID="presets-scroll" contentContainerStyle={[layoutStyles.content, styles.scroll, { paddingBottom: insets.bottom + spacing["2xl"] }]}>
        {presets.length === 0 ? (
          <View style={styles.empty}>
            <MaterialCommunityIcons name="timer-plus-outline" size={32} color={colors.muted} />
            <Text style={styles.emptyTitle}>Aucun preset</Text>
            <Text style={styles.emptySub}>Depuis Custom, active « Sauvegarder comme preset » pour relancer un format en un tap.</Text>
            <PrimaryButton testID="presets-create" label="Créer un Custom" onPress={() => router.push("/config/custom" as never)} />
          </View>
        ) : (
          presets.map((p) => (
            <View key={p.id} style={styles.card} testID={`preset-${p.id}`}>
              <View style={{ flex: 1, gap: 2 }}>
                <Text testID={`preset-name-${p.id}`} style={styles.name}>{p.name}</Text>
                <Text testID={`preset-meta-${p.id}`} style={styles.meta}>{presetMeta(p)}{p.teams ? ` · ${p.teams.map((t) => t.name).join(" / ")}` : ""}</Text>
              </View>
              <View style={styles.actions}>
                <Pressable testID={`preset-launch-${p.id}`} onPress={() => launch(p)} style={[styles.action, { backgroundColor: colors.brandPrimary }]} accessibilityRole="button" accessibilityLabel={`Lancer ${p.name}`}>
                  <MaterialCommunityIcons name="play" size={24} color={colors.onBrandPrimary} />
                </Pressable>
                <Pressable testID={`preset-edit-${p.id}`} onPress={() => router.push(`/config/custom?preset=${p.id}` as never)} style={styles.action} accessibilityRole="button" accessibilityLabel={`Modifier ${p.name}`}>
                  <MaterialCommunityIcons name="pencil-outline" size={22} color={colors.onSurface} />
                </Pressable>
                <Pressable testID={`preset-rename-${p.id}`} onPress={() => rename(p)} style={styles.action} accessibilityRole="button" accessibilityLabel={`Renommer ${p.name}`}>
                  <MaterialCommunityIcons name="form-textbox" size={22} color={colors.onSurface} />
                </Pressable>
                <Pressable testID={`preset-duplicate-${p.id}`} onPress={() => duplicate(p)} style={styles.action} accessibilityRole="button" accessibilityLabel={`Dupliquer ${p.name}`}>
                  <MaterialCommunityIcons name="content-copy" size={22} color={colors.onSurface} />
                </Pressable>
                <Pressable testID={`preset-delete-${p.id}`} onPress={() => remove(p)} style={styles.action} accessibilityRole="button" accessibilityLabel={`Supprimer ${p.name}`}>
                  <MaterialCommunityIcons name="trash-can-outline" size={22} color={colors.error} />
                </Pressable>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.surface },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  iconBtn: { width: 46, height: 46, alignItems: "center", justifyContent: "center" },
  title: { flex: 1, minWidth: 0, textAlign: "center", fontFamily: fontFamily.textBold, fontSize: fontSize["2xl"] - 4, color: colors.onSurface, letterSpacing: -0.4 },
  scroll: { padding: spacing.lg, gap: spacing.md },
  empty: { alignItems: "center", gap: spacing.md, padding: spacing.xl, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceSecondary },
  emptyTitle: { fontFamily: fontFamily.textBold, fontSize: fontSize.xl, color: colors.onSurface },
  emptySub: { fontFamily: fontFamily.text, fontSize: fontSize.base + 1, color: colors.muted, textAlign: "center", lineHeight: 21 },
  card: { backgroundColor: colors.surfaceSecondary, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.md, borderWidth: 1, borderColor: colors.border },
  name: { fontFamily: fontFamily.textBold, fontSize: fontSize.xl, color: colors.onSurface, letterSpacing: -0.3 },
  meta: { fontFamily: fontFamily.text, fontSize: fontSize.base, color: colors.muted },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  action: { width: 52, height: 52, borderRadius: radius.pill, backgroundColor: colors.surfaceTertiary, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" },
}));

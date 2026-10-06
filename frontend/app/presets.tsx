// E10 — Mes chronos : presets Custom locaux (C23).
import { useRouter } from "expo-router";
import { Alert } from "@/src/alert";
import { Text } from "react-native";



import { DesignScreen, DesignRow } from "@/src/components/design-screen";
import { PrimaryButton } from "@/src/components/primary-button";
import { defaultTeams, uid } from "@/src/domain/defaults";
import { createSession } from "@/src/domain/session";
import type { Preset } from "@/src/domain/types";
import { presetMeta } from "@/src/features/preset-meta";
import { discardSession, getStoreState, setPresets, startSession, useStore } from "@/src/store/session-store";
import { fontFamily, fontSize, makeStyles, radius, spacing } from "@/src/theme";


export default function PresetsScreen() {
  const styles = useStyles();



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

  return <DesignScreen title="Mes chronos" subtitle="Presets enregistrés" testID="presets-screen">
    {presets.length === 0 ? <Text style={styles.emptySub}>Aucun preset enregistré.</Text> : null}
    {presets.map(p=><DesignRow key={p.id} testID={`preset-${p.id}`} title={p.name} detail={presetMeta(p)}>
      <PrimaryButton testID={`preset-launch-${p.id}`} label="Lancer" onPress={()=>launch(p)}/>
      <PrimaryButton testID={`preset-edit-${p.id}`} label="Modifier" variant="secondary" onPress={()=>router.push(`/config/custom?preset=${p.id}` as never)}/>
      <PrimaryButton label="Renommer" variant="secondary" onPress={()=>rename(p)}/>
      <PrimaryButton label="Dupliquer" variant="secondary" onPress={()=>duplicate(p)}/>
      <PrimaryButton label="Supprimer" variant="secondary" onPress={()=>remove(p)}/>
    </DesignRow>)}
    <PrimaryButton testID="presets-create" label="Nouveau preset" variant="secondary" onPress={()=>router.push("/config/custom?presetNew=1" as never)}/>
  </DesignScreen>;

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
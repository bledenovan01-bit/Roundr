import { FreeStorageNotice } from "@/src/components/free-storage-notice";
import { prepareFreeTimer } from "@/src/features/prepare-free-timer";
// Chrono libre — Mes chronos (presets enregistrés). Phase 3, réf. Lovable.
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import MaterialCommunityIcons from "@react-native-vector-icons/material-design-icons";
import { Alert } from "@/src/alert";
import { DesignScreen, DesignInputStyles } from "@/src/components/design-screen";
import { type FreeTimerConfig, type FreeTimerPreset } from "@/src/domain/free-timer";
import { deleteFreePreset, renameFreePreset, saveFreePreset, useStore } from "@/src/store/session-store";
import { fontFamily, makeStyles, useTheme } from "@/src/theme";

function describe(c: FreeTimerConfig): string {
  if (c.kind === "stopwatch") return "Chronomètre croissant · tours";
  if (c.kind === "countdown") {
    const totalS = Math.round(c.durationMs / 1000);
    return totalS % 60 === 0 ? `Compte à rebours · ${totalS / 60} min` : `Compte à rebours · ${Math.floor(totalS / 60)} min ${totalS % 60} s`;
  }
  return `Intervalles · ${c.workMs / 1000}s / ${c.restMs / 1000}s × ${c.reps}${c.sets > 1 ? ` · ${c.sets} séries` : ""}`;
}

export default function FreePresets() {
  const router = useRouter();
  const styles = useStyles();
  const { colors } = useTheme();
  const presets = useStore(s => s.freePresets);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const input = DesignInputStyles();

  const launch = (p: FreeTimerPreset) => prepareFreeTimer(p.config, () => router.push("/chrono-libre/run"));
  const duplicate = (p: FreeTimerPreset) => void saveFreePreset({ id: `free-${Date.now().toString(36)}`, name: `${p.name} (copie)`, config: p.config, createdAt: Date.now() });
  const remove = (p: FreeTimerPreset) => Alert.alert("Supprimer ce chrono ?", `« ${p.name} » sera supprimé.`, [
    { text: "Annuler", style: "cancel" },
    { text: "Supprimer", style: "destructive", onPress: () => void deleteFreePreset(p.id) },
  ]);
  const commitRename = (id: string) => { void renameFreePreset(id, draft.trim() || "Chrono"); setEditing(null); };

  return (
    <DesignScreen testID="free-presets" title="Mes chronos" subtitle={presets.length ? `${presets.length} enregistré${presets.length > 1 ? "s" : ""}` : "Aucun chrono enregistré"} onBack={() => router.replace("/chrono-libre")}>
      <FreeStorageNotice />
      {presets.length === 0 ? (
        <View style={styles.empty}><MaterialCommunityIcons name="bookmark-outline" size={34} color={colors.muted} /><Text style={styles.emptyText}>Aucun chrono enregistré pour l’instant. Enregistrez une configuration depuis Compte à rebours ou Intervalles.</Text></View>
      ) : null}
      {presets.slice().sort((a, b) => b.createdAt - a.createdAt).map(p => (
        <View key={p.id} testID={`free-preset-${p.id}`} style={styles.card}>
          {editing === p.id ? (
            <View style={styles.renameRow}>
              <TextInput testID="free-rename-input" value={draft} onChangeText={setDraft} style={[input, { flex: 1 }]} autoFocus maxLength={40} returnKeyType="done" onSubmitEditing={() => commitRename(p.id)} />
              <Pressable testID="free-rename-save" onPress={() => commitRename(p.id)} accessibilityRole="button" accessibilityLabel="Valider le nom" style={[styles.iconBtn, { backgroundColor: colors.brandPrimary }]}><MaterialCommunityIcons name="check" size={18} color={colors.onBrandPrimary} /></Pressable>
            </View>
          ) : (
            <View style={styles.cardHead}>
              <View style={{ flex: 1, minWidth: 0 }}><Text style={styles.name}>{p.name}</Text><Text style={styles.detail}>{describe(p.config)}</Text></View>
              <Pressable testID={`free-launch-${p.id}`} onPress={() => launch(p)} accessibilityRole="button" accessibilityLabel={`Lancer ${p.name}`} style={styles.launchBtn}><MaterialCommunityIcons name="play" size={18} color={colors.onBrandPrimary} /><Text style={styles.launchText}>Lancer</Text></Pressable>
            </View>
          )}
          <View style={styles.actions}>
            <Pressable testID={`free-rename-${p.id}`} onPress={() => { setEditing(p.id); setDraft(p.name); }} accessibilityRole="button" accessibilityLabel="Renommer" style={styles.iconBtn}><MaterialCommunityIcons name="pencil-outline" size={18} color={colors.onSurface} /></Pressable>
            <Pressable testID={`free-duplicate-${p.id}`} onPress={() => duplicate(p)} accessibilityRole="button" accessibilityLabel="Dupliquer" style={styles.iconBtn}><MaterialCommunityIcons name="content-copy" size={17} color={colors.onSurface} /></Pressable>
            <Pressable testID={`free-delete-${p.id}`} onPress={() => remove(p)} accessibilityRole="button" accessibilityLabel="Supprimer" style={styles.iconBtn}><MaterialCommunityIcons name="trash-can-outline" size={18} color={colors.error} /></Pressable>
          </View>
        </View>
      ))}
    </DesignScreen>
  );
}

const useStyles = makeStyles(c => ({
  empty: { alignItems: "center", gap: 12, paddingVertical: 40 },
  emptyText: { fontFamily: fontFamily.text, fontSize: 13, lineHeight: 19, color: c.muted, textAlign: "center", paddingHorizontal: 20 },
  card: { gap: 12, padding: 14, borderRadius: 18, borderWidth: 1, borderColor: c.border, backgroundColor: c.surfaceSecondary },
  cardHead: { flexDirection: "row", alignItems: "center", gap: 12 },
  name: { fontFamily: fontFamily.textBold, fontSize: 15, color: c.onSurface },
  detail: { fontFamily: fontFamily.text, fontSize: 12, lineHeight: 17, color: c.muted, marginTop: 2 },
  launchBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, minHeight: 42, borderRadius: 12, backgroundColor: c.brandPrimary },
  launchText: { fontFamily: fontFamily.textBold, fontSize: 13, color: c.onBrandPrimary },
  renameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  actions: { flexDirection: "row", gap: 10, justifyContent: "flex-end" },
  iconBtn: { width: 44, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: c.surface, borderWidth: 1, borderColor: c.border },
}));

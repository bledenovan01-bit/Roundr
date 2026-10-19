import { useState } from "react";
import { useRouter } from "expo-router";
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HistoryAction, HistoryScreenFrame, h } from "@/src/components/lovable/history-ui";
import { historySummaryCards } from "@/src/components/lovable/history-summary";
import { LovableIcon } from "@/src/components/lovable/icon";
import { competitionName, sortedCompetitions, type Competition } from "@/src/store/competition-history";
import { deleteCompetition, renameCompetition, retryStorage, useStore } from "@/src/store/session-store";
import { lovable as c, withAlpha } from "@/src/visual/lovable";

const date = (at: number) => new Date(at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
type Sheet = { kind: "rename" | "delete"; entry: Competition };
export default function History() {
  const { width, height } = useWindowDimensions(), landscape = width > height;
  const router = useRouter(), entries = useStore(s => s.competitions), available = useStore(s => s.historyAvailable), error = useStore(s => s.saveError);
  const [open, setOpen] = useState<string | null>(null), [sheet, setSheet] = useState<Sheet | null>(null);
  const current = entries.find(entry => entry.id === open);
  const errors = error ? <View key="errors" style={{ gap: 8 }}><Text accessibilityRole="alert" style={h.error}>{error}</Text><HistoryAction label="Réessayer la sauvegarde" variant="secondary" onPress={() => { void retryStorage(); }} /></View> : null;
  return <>
    <HistoryScreenFrame accent={current ? current.kind === "cup" ? c.cup : c.survie : undefined} title={current?.name ?? "Historique"} subtitle={current ? `${current.kind === "cup" ? "Cup" : "Survie"} · ${date(current.endedAt)}` : "Compétitions Cup et Survie"} onBack={() => current ? setOpen(null) : router.back()} footer={current ? <><HistoryAction label="Renommer" icon="pencil" variant="secondary" fitContent={landscape} onPress={() => setSheet({ kind: "rename", entry: current })} /><HistoryAction label="Retour à l'historique" variant="ghost" fitContent={landscape} onPress={() => setOpen(null)} /></> : undefined}>
      {current ? [<View key="readonly" style={[h.row, { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12, backgroundColor: withAlpha(c.primary, 0.14), alignItems: "flex-start" }]}><LovableIcon name="archive" color={c.primary} /><Text style={[h.hint, { flex: 1, color: c.foreground, lineHeight: 17.4 }]}>Consultation en lecture seule · {current.status === "finished" ? "Terminée" : "Interrompue"} · {current.session.teams.length} équipes</Text></View>, errors, ...historySummaryCards(current)] : [
        <Text key="hint" style={h.hint}>Enregistré uniquement sur cet appareil. Aucune synchronisation.</Text>, errors,
        !entries.length && available ? <View key="empty" testID="history-empty" style={[h.card, { paddingVertical: 28, paddingHorizontal: 18, alignItems: "center", gap: 8 }]}><LovableIcon name="trophy" size={30} color={c.primary} /><Text accessibilityRole="header" style={[h.heading, { textAlign: "center" }]}>Aucune compétition enregistrée</Text><Text style={[h.hint, { textAlign: "center" }]}>Terminez ou interrompez une Cup ou une Survie : son palmarès apparaîtra ici automatiquement.</Text></View> : null,
        ...sortedCompetitions(entries).map(entry => { const accent = entry.kind === "cup" ? c.cup : c.survie; const champion = entry.summary.podium.find(p => p.place === 1)?.name; return <View key={entry.id} testID={`history-entry-${entry.id}`} style={[h.card, { padding: 0, overflow: "hidden" }]}>
          <Pressable accessibilityRole="button" accessibilityLabel={`Consulter ${entry.name}`} onPress={() => setOpen(entry.id)} style={[h.row, { minHeight: 64, padding: 14, gap: 12 }]}><View style={{ width: 46, height: 46, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: withAlpha(accent, 0.13), borderWidth: 1, borderColor: withAlpha(accent, 0.28) }}><LovableIcon name={entry.status === "finished" ? "trophy" : "flag"} size={20} color={accent} /></View><View style={{ flex: 1, gap: 2 }}><Text numberOfLines={1} style={h.heading}>{entry.name}</Text><Text style={h.hint}>{date(entry.endedAt)} · {entry.kind === "cup" ? "Cup" : "Survie"} · {entry.session.teams.length} équipes</Text><Text style={[h.hint, { color: c.muted }]}>{entry.status === "finished" ? `Terminée${champion ? ` · Champion : ${champion}` : ""}` : "Interrompue"}</Text></View><LovableIcon name="chevron" size={20} color={c.muted} /></Pressable>
          <View style={{ flexDirection: "row", borderTopWidth: 1, borderColor: c.border }}><Pressable accessibilityRole="button" accessibilityLabel={`Renommer ${entry.name}`} onPress={() => setSheet({ kind: "rename", entry })} style={[h.row, { flex: 1, minHeight: 44, gap: 8, justifyContent: "center" }]}><LovableIcon name="pencil" color={c.muted} /><Text style={[h.text, { fontFamily: "ManropeRefined-Bold", fontSize: 14, color: c.muted }]}>Renommer</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel={`Supprimer ${entry.name}`} onPress={() => setSheet({ kind: "delete", entry })} style={[h.row, { flex: 1, minHeight: 44, gap: 8, justifyContent: "center", borderLeftWidth: 1, borderColor: c.border }]}><LovableIcon name="trash" color={c.error} /><Text style={[h.text, { fontFamily: "ManropeRefined-Bold", fontSize: 14, color: c.error }]}>Supprimer</Text></Pressable></View>
        </View>; }),
      ]}
    </HistoryScreenFrame>
    {sheet ? <HistorySheet key={sheet.kind + sheet.entry.id} sheet={sheet} onClose={() => setSheet(null)} onDeleted={() => { setSheet(null); setOpen(null); }} /> : null}
  </>;
}

function HistorySheet({ sheet, onClose, onDeleted }: { sheet: Sheet; onClose: () => void; onDeleted: () => void }) {
  const { width, height } = useWindowDimensions(), landscape = width > height, inset = useSafeAreaInsets();
  const entry = sheet.entry, rename = sheet.kind === "rename", defaultName = competitionName(entry.kind, entry.createdAt);
  const landscapeDelete = landscape && !rename;
  const [value, setValue] = useState(entry.name === defaultName ? "" : entry.name), [busy, setBusy] = useState(false), [focused, setFocused] = useState(false);
  const error = useStore(s => s.saveError);
  const close = () => { if (!busy) onClose(); };
  const save = async () => {
    if (busy) return;
    setBusy(true);
    const ok = rename ? await renameCompetition(entry.id, value) : await deleteCompetition(entry.id);
    setBusy(false);
    if (ok) { if (rename) onClose(); else onDeleted(); }
  };
  return <Modal transparent visible animationType="slide" onRequestClose={close} supportedOrientations={["portrait", "landscape"]}>
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1, backgroundColor: "rgba(0,3,3,0.78)", justifyContent: landscape && !landscapeDelete ? "center" : "flex-end", alignItems: "center", paddingLeft: landscapeDelete ? inset.left : 0, paddingRight: landscapeDelete ? inset.right : 0 }}>
      <Pressable accessibilityLabel="Fermer la fenêtre" accessibilityRole="button" disabled={busy} onPress={close} style={{ position: "absolute", inset: 0 }} />
      <View accessibilityViewIsModal accessibilityLabel={rename ? "Renommer la compétition" : "Supprimer la compétition"} style={{ width: "100%", maxWidth: landscape ? 520 : undefined, maxHeight: landscapeDelete ? Math.min(height * 0.96, height - inset.top) : landscape ? "96%" : "92%", backgroundColor: c.card, borderTopWidth: 1, borderColor: c.border, borderTopLeftRadius: 26, borderTopRightRadius: 26, overflow: "hidden" }}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 20, paddingTop: landscape ? 14 : 20, paddingBottom: Math.max(18, inset.bottom), gap: landscape ? 8 : 14 }}>
          <Text accessibilityRole="header" style={[h.heading, { fontSize: 18, lineHeight: 27, textAlign: "center" }]}>{rename ? "Renommer la compétition" : `Supprimer « ${entry.name} » ?`}</Text>
          {rename ? <><TextInput testID="history-rename-input" accessibilityLabel="Nouveau nom" autoFocus editable={!busy} value={value} onChangeText={setValue} maxLength={40} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} placeholder={defaultName} placeholderTextColor={c.muted} style={{ minHeight: 44, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: focused ? 2 : 1, borderColor: focused ? c.primary : c.border, outlineStyle: "solid", outlineWidth: 0, backgroundColor: c.secondary, fontFamily: "ManropeRefined-Bold", fontSize: 15, lineHeight: 22.5, color: c.foreground }} /><Text style={[h.hint, { textAlign: "center" }]}>Laissé vide, le nom par défaut est utilisé.</Text></> : <Text style={[h.text, { color: c.muted, textAlign: "center" }]}>Seule cette compétition est retirée de l&apos;historique. Les autres compétitions et Mes chronos ne changent pas.</Text>}
          {error ? <Text accessibilityRole="alert" style={h.error}>{error}</Text> : null}
          <View style={{ gap: 8 }}><HistoryAction label={busy ? "Enregistrement…" : rename ? "Enregistrer" : "Supprimer"} icon={rename ? "check" : "trash"} variant={rename ? "primary" : "danger"} disabled={busy} onPress={() => { void save(); }} /><HistoryAction label="Annuler" variant="ghost" disabled={busy} onPress={close} /></View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  </Modal>;
}

// Bouton "Enregistrer dans Mes chronos" avec saisie de nom en ligne
// (pas de prompt natif : compatible iOS/Android/web).
import { useState } from "react";
import { Text, TextInput, View } from "react-native";
import MaterialCommunityIcons from "@react-native-vector-icons/material-design-icons";
import { PrimaryButton } from "@/src/components/primary-button";
import { DesignInputStyles } from "@/src/components/design-screen";
import type { FreeTimerConfig } from "@/src/domain/free-timer";
import { saveFreePreset, useStore } from "@/src/store/session-store";
import { fontFamily, makeStyles, useTheme } from "@/src/theme";

export function SavePresetButton({ config }: { config: FreeTimerConfig }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const input = DesignInputStyles();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [saved, setSaved] = useState(false);
  const count = useStore(s => s.freePresets.length);

  const save = () => {
    const finalName = name.trim() || `Chrono ${count + 1}`;
    void saveFreePreset({ id: `free-${Date.now().toString(36)}`, name: finalName, config, createdAt: Date.now() });
    setSaved(true); setOpen(false); setName("");
  };

  if (saved) return <View style={styles.savedRow}><MaterialCommunityIcons name="check-circle" size={18} color={colors.brandPrimary} /><Text style={styles.savedText}>Enregistré dans Mes chronos</Text></View>;
  if (!open) return <PrimaryButton testID="free-save-open" variant="secondary" label="Enregistrer dans Mes chronos" leadingIcon={<MaterialCommunityIcons name="content-save-outline" size={18} color={colors.onSurface} />} onPress={() => setOpen(true)} />;
  return (
    <View style={styles.wrap}>
      <TextInput testID="free-save-name" placeholder="Nom du chrono" placeholderTextColor={colors.muted} value={name} onChangeText={setName} style={input} maxLength={40} returnKeyType="done" onSubmitEditing={save} />
      <PrimaryButton testID="free-save-confirm" label="Enregistrer" onPress={save} />
    </View>
  );
}

const useStyles = makeStyles(c => ({
  wrap: { gap: 10 },
  savedRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, minHeight: 48 },
  savedText: { fontFamily: fontFamily.textBold, fontSize: 13, color: c.brandPrimary },
}));

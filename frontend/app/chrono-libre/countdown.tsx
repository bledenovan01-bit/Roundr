// Chrono libre — Configuration "Compte à rebours" (Phase 3, réf. Lovable).
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import MaterialCommunityIcons from "@react-native-vector-icons/material-design-icons";
import { DesignScreen } from "@/src/components/design-screen";
import { Section, Stepper, ToggleRow } from "@/src/components/fields";
import { PrimaryButton } from "@/src/components/primary-button";
import { COUNTDOWN_PRESETS_MS, createFreeTimer, type CountdownConfig } from "@/src/domain/free-timer";
import { SavePresetButton } from "@/src/features/free-save";
import { setFreeTimer } from "@/src/store/session-store";
import { fontFamily, makeStyles, useTheme } from "@/src/theme";

export default function CountdownConfigScreen() {
  const router = useRouter();
  const styles = useStyles();
  const { colors } = useTheme();
  const [h, setH] = useState(0);
  const [m, setM] = useState(10);
  const [s, setS] = useState(0);
  const [endSignal, setEndSignal] = useState(true);
  const [withTeams, setWithTeams] = useState(false);
  const durationMs = (h * 3600 + m * 60 + s) * 1000;
  const totalLabel = h ? `${h} h ${m} min` : s ? `${m} min ${s} s` : `${m} min`;
  const config: CountdownConfig = { kind: "countdown", durationMs, endSignal, withTeams, display: "numeric", sounds: true };

  const applyPreset = (ms: number) => { setH(Math.floor(ms / 3600000)); setM(Math.floor((ms % 3600000) / 60000)); setS(Math.floor((ms % 60000) / 1000)); };

  const prepare = () => { setFreeTimer(createFreeTimer(config)); router.replace("/chrono-libre/run"); };

  return (
    <DesignScreen testID="countdown-config" title="Compte à rebours" subtitle="Chrono libre · Réglages"
      footer={<PrimaryButton testID="countdown-prepare" label="Préparer le chrono" disabled={durationMs < 1000} leadingIcon={<MaterialCommunityIcons name="play" size={20} color={colors.onBrandPrimary} />} onPress={prepare} />} stickyFooter>
      <Section title="Durée" hint={`Total : ${totalLabel}`}>
        <View style={styles.presets}>
          {COUNTDOWN_PRESETS_MS.map(ms => {
            const sel = ms === durationMs;
            const label = ms >= 60000 ? `${ms / 60000} min` : `${ms / 1000} s`;
            return <Pressable key={ms} testID={`cd-preset-${ms}`} accessibilityRole="button" accessibilityState={{ selected: sel }} onPress={() => applyPreset(ms)} style={[styles.chip, sel && styles.chipActive]}><Text style={[styles.chipText, sel && styles.chipTextActive]}>{label}</Text></Pressable>;
          })}
        </View>
      </Section>
      <Stepper testID="cd-hours" label="Heures" value={h} min={0} max={12} onChange={setH} />
      <Stepper testID="cd-min" label="Minutes" value={m} min={0} max={59} onChange={setM} />
      <Stepper testID="cd-sec" label="Secondes" value={s} min={0} max={59} onChange={setS} />
      <ToggleRow testID="cd-signal" label="Signal de fin" hint="Son et vibration à zéro" value={endSignal} onChange={setEndSignal} />
      <ToggleRow testID="cd-teams" label="Avec équipes" hint="Facultatif : sans équipe, seul le chrono s'affiche." value={withTeams} onChange={setWithTeams} />
      <SavePresetButton config={config} />
    </DesignScreen>
  );
}

const useStyles = makeStyles(c => ({
  presets: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { minWidth: 72, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: c.border, backgroundColor: c.surfaceSecondary, alignItems: "center" },
  chipActive: { backgroundColor: c.brandPrimary, borderColor: c.brandPrimary },
  chipText: { fontFamily: fontFamily.textBold, fontSize: 13, color: c.onSurface },
  chipTextActive: { color: c.onBrandPrimary },
}));

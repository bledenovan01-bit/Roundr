// Chrono libre — Configuration "Intervalles" (Phase 3, réf. Lovable).
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import MaterialCommunityIcons from "@react-native-vector-icons/material-design-icons";
import { DesignScreen } from "@/src/components/design-screen";
import { Section, Stepper, ToggleRow } from "@/src/components/fields";
import { PrimaryButton } from "@/src/components/primary-button";
import { INTERVAL_PRESETS, buildSteps, createFreeTimer, type IntervalConfig } from "@/src/domain/free-timer";
import { SavePresetButton } from "@/src/features/free-save";
import { setFreeTimer } from "@/src/store/session-store";
import { fontFamily, makeStyles, useTheme } from "@/src/theme";

export default function IntervalConfigScreen() {
  const router = useRouter();
  const styles = useStyles();
  const { colors } = useTheme();
  const [workS, setWorkS] = useState(30);
  const [restS, setRestS] = useState(30);
  const [reps, setReps] = useState(8);
  const [sets, setSets] = useState(1);
  const [restSetS, setRestSetS] = useState(60);
  const [autoChain, setAutoChain] = useState(true);
  const [endSignal, setEndSignal] = useState(true);
  const [withTeams, setWithTeams] = useState(false);
  const config: IntervalConfig = { kind: "interval", workMs: workS * 1000, restMs: restS * 1000, reps, sets, restBetweenSetsMs: restSetS * 1000, autoChain, endSignal, withTeams, display: "numeric", sounds: true };
  const stepCount = buildSteps(config).length;

  const applyPreset = (p: typeof INTERVAL_PRESETS[number]) => { setWorkS(p.workMs / 1000); setRestS(p.restMs / 1000); setReps(p.reps); setSets(p.sets); };

  const prepare = () => { setFreeTimer(createFreeTimer(config)); router.replace("/chrono-libre/run"); };

  return (
    <DesignScreen testID="interval-config" title="Intervalles" subtitle="Chrono libre · Réglages"
      footer={<PrimaryButton testID="interval-prepare" label="Préparer le chrono" leadingIcon={<MaterialCommunityIcons name="play" size={20} color={colors.onBrandPrimary} />} onPress={prepare} />} stickyFooter>
      <Section title="Préréglages">
        <View style={styles.presets}>
          {INTERVAL_PRESETS.map(p => <Pressable key={p.name} testID={`iv-preset-${p.name}`} accessibilityRole="button" onPress={() => applyPreset(p)} style={styles.chip}><Text style={styles.chipText}>{p.name}</Text></Pressable>)}
        </View>
      </Section>
      <Stepper testID="iv-work" label="Effort (s)" value={workS} min={5} max={600} onChange={setWorkS} />
      <Stepper testID="iv-rest" label="Repos (s)" value={restS} min={0} max={600} onChange={setRestS} />
      <Stepper testID="iv-reps" label="Répétitions" value={reps} min={1} max={50} onChange={setReps} />
      <Stepper testID="iv-sets" label="Séries" value={sets} min={1} max={20} onChange={setSets} />
      {sets > 1 ? <Stepper testID="iv-restset" label="Repos entre séries (s)" value={restSetS} min={0} max={600} onChange={setRestSetS} /> : null}
      <ToggleRow testID="iv-auto" label="Enchaînement automatique" hint="Sinon, passage manuel entre les périodes." value={autoChain} onChange={setAutoChain} />
      <ToggleRow testID="iv-signal" label="Signal de fin" hint="Son et vibration aux transitions." value={endSignal} onChange={setEndSignal} />
      <ToggleRow testID="iv-teams" label="Avec équipes" hint="Facultatif : sans équipe, seul le chrono s'affiche." value={withTeams} onChange={setWithTeams} />
      <Text style={styles.summary}>{stepCount} périodes au total</Text>
      <SavePresetButton config={config} />
    </DesignScreen>
  );
}

const useStyles = makeStyles(c => ({
  presets: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 18, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: c.border, backgroundColor: c.surfaceSecondary },
  chipText: { fontFamily: fontFamily.textBold, fontSize: 13, color: c.onSurface },
  summary: { fontFamily: fontFamily.text, fontSize: 12, color: c.muted, textAlign: "center" },
}));

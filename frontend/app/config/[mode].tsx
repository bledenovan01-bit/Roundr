import { useMemo, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialCommunityIcons from "@react-native-vector-icons/material-design-icons";

import { Card, ErrorText, TeamsEditor, ToggleRow } from "@/src/components/fields";
import { PrimaryButton } from "@/src/components/primary-button";
import { GAME_MODES, type GameModeId } from "@/src/data/modes";
import { defaultConfig, defaultTeams, teamCountFor, uid } from "@/src/domain/defaults";
import { createSession } from "@/src/domain/session";
import type { AnyConfig, CustomConfig, Team } from "@/src/domain/types";
import { validateConfig } from "@/src/domain/validate";
import { ClassicForm, CupForm, CustomForm, MaracanaForm, SurvieForm } from "@/src/features/config-forms";
import { getStoreState, setPresets, startSession, useStore } from "@/src/store/session-store";
import { fontFamily, fontSize, makeStyles, radius, spacing, useTheme } from "@/src/theme";

export default function ConfigScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ mode: GameModeId; preset?: string; replay?: string }>();
  const mode = GAME_MODES.find((m) => m.id === params.mode);
  const presets = useStore((s) => s.presets);
  const activeSession = useStore((s) => s.session);

  const preset = params.preset ? presets.find((p) => p.id === params.preset) : null;
  const replayFrom = params.replay ? getStoreState().lastSummary : null;

  const [config, setConfig] = useState<AnyConfig>(() => {
    if (preset) return { ...preset.config, savePreset: false };
    if (replayFrom && replayFrom.mode === params.mode) return replayFrom.config;
    return defaultConfig(params.mode ?? "classique");
  });
  const [teams, setTeams] = useState<Team[]>(() => {
    if (preset?.teams) return preset.teams;
    if (replayFrom && replayFrom.mode === params.mode) return replayFrom.teams;
    return defaultTeams(params.mode ?? "classique", teamCountFor(config));
  });
  const [attempted, setAttempted] = useState(false);

  // Aligne la liste d'équipes sur le nombre configuré, en conservant les noms.
  const count = teamCountFor(config);
  const alignedTeams = useMemo(() => {
    if (teams.length === count) return teams;
    const base = defaultTeams(config.mode, count);
    return base.map((t, i) => teams[i] ?? t);
  }, [teams, count, config.mode]);

  const errors = validateConfig(config, alignedTeams);

  const launch = () => {
    setAttempted(true);
    if (errors.length) return;
    const go = () => {
      const now = Date.now();
      const session = createSession(config, alignedTeams, now);
      if (config.mode === "custom" && (config as CustomConfig).savePreset) {
        const c = config as CustomConfig;
        setPresets([...getStoreState().presets, { id: uid(), name: c.presetName.trim(), config: { ...c, savePreset: false }, teams: c.customTeams ? alignedTeams : null, createdAt: now }]);
      }
      startSession(session);
      router.replace("/live" as never);
    };
    if (activeSession && activeSession.status === "active") {
      // C03 — ne jamais écraser silencieusement une session active.
      Alert.alert("Session en cours", "Une session active existe déjà. La remplacer efface sa progression.", [
        { text: "Annuler", style: "cancel" },
        { text: "Remplacer", style: "destructive", onPress: go },
      ]);
      return;
    }
    go();
  };

  const savePresetOnly = () => {
    if (config.mode !== "custom") return;
    setAttempted(true);
    const c = config as CustomConfig;
    if (!c.presetName.trim()) return;
    const others = preset ? presets.filter((p) => p.id !== preset.id) : presets;
    setPresets([...others, { id: preset?.id ?? uid(), name: c.presetName.trim(), config: { ...c, savePreset: false }, teams: c.customTeams ? alignedTeams : null, createdAt: preset?.createdAt ?? Date.now() }]);
    router.back();
  };

  const form = (() => {
    switch (config.mode) {
      case "classique":
        return <ClassicForm config={config} onChange={setConfig} />;
      case "custom":
        return <CustomForm config={config} onChange={setConfig} />;
      case "maracana":
        return <MaracanaForm config={config} onChange={setConfig} />;
      case "survie":
        return <SurvieForm config={config} onChange={setConfig} />;
      case "cup":
        return <CupForm config={config} onChange={setConfig} />;
    }
  })();

  const ctaLabel = config.mode === "classique" || config.mode === "custom" ? "Lancer le match" : config.mode === "maracana" ? "Lancer la session" : "Lancer le tournoi";
  const reorderable = (config.mode === "survie" || config.mode === "cup") && config.draw === "manual";

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + 120 }]} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Pressable testID="config-back" onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
            <MaterialCommunityIcons name="chevron-left" size={30} color={colors.onSurface} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{preset ? preset.name : mode?.title ?? "Mode"}</Text>
            <Text style={styles.subtitle}>{preset ? "Preset Custom" : mode?.description}</Text>
          </View>
        </View>

        {form}

        <Card>
          <ToggleRow testID="toggle-teams" label={config.mode === "classique" || config.mode === "custom" ? "Ajouter les équipes" : "Personnaliser les équipes"} hint="Noms et couleurs. OFF = noms génériques." value={config.customTeams} onChange={(v) => setConfig({ ...config, customTeams: v } as AnyConfig)} />
          {config.customTeams ? <TeamsEditor teams={alignedTeams} onChange={setTeams} reorder={reorderable} /> : null}
          {reorderable && !config.customTeams ? <Text style={styles.note}>Tirage manuel : active la personnalisation pour ordonner les équipes dans le tableau.</Text> : null}
        </Card>

        {config.mode === "custom" ? (
          <Card>
            <ToggleRow testID="toggle-save-preset" label="Sauvegarder comme preset" value={(config as CustomConfig).savePreset} onChange={(v) => setConfig({ ...config, savePreset: v } as AnyConfig)} />
            {(config as CustomConfig).savePreset || preset ? (
              <TextInput
                testID="preset-name"
                value={(config as CustomConfig).presetName}
                onChangeText={(t) => setConfig({ ...config, presetName: t } as AnyConfig)}
                placeholder="Nom du preset"
                placeholderTextColor={colors.muted}
                style={styles.input}
                maxLength={30}
              />
            ) : null}
            {preset ? <PrimaryButton testID="preset-save-only" label="Enregistrer les modifications" variant="secondary" onPress={savePresetOnly} /> : null}
          </Card>
        ) : null}

        {attempted && errors.length ? (
          <View style={styles.errors} testID="config-errors">
            {errors.map((e) => (
              <ErrorText key={e}>{e}</ErrorText>
            ))}
          </View>
        ) : null}
      </ScrollView>

      <View style={[styles.cta, { paddingBottom: insets.bottom + spacing.md }]}>
        <PrimaryButton testID="config-launch" label={ctaLabel} onPress={launch} disabled={attempted && errors.length > 0} />
      </View>
    </KeyboardAvoidingView>
  );
}

const useStyles = makeStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.surface },
  scroll: { paddingHorizontal: spacing.lg, gap: spacing.lg },
  header: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.xs },
  backBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center", marginLeft: -spacing.sm },
  title: { fontFamily: fontFamily.textBold, fontSize: fontSize["2xl"], color: colors.onSurface, letterSpacing: -0.6 },
  subtitle: { fontFamily: fontFamily.text, fontSize: fontSize.base + 1, color: colors.muted, marginTop: 2 },
  note: { fontFamily: fontFamily.text, fontSize: fontSize.sm, color: colors.muted },
  input: { minHeight: 54, paddingHorizontal: spacing.lg, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderStrong, color: colors.onSurface, fontFamily: fontFamily.textBold, fontSize: fontSize.lg },
  errors: { gap: spacing.xs, padding: spacing.lg, borderRadius: radius.md, borderWidth: 1, borderColor: colors.error, backgroundColor: colors.surfaceSecondary },
  cta: { position: "absolute", left: 0, right: 0, bottom: 0, paddingHorizontal: spacing.lg, paddingTop: spacing.md, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
}));

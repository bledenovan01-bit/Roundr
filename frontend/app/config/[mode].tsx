import { getPreferences } from "@/src/store/preferences";
import { useMemo, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Alert } from "@/src/alert";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialCommunityIcons from "@react-native-vector-icons/material-design-icons";

import { ErrorText } from "@/src/components/fields";
import { PrimaryButton } from "@/src/components/primary-button";
import { GAME_MODES, type GameModeId } from "@/src/data/modes";
import { defaultConfig, defaultTeams, teamCountFor, uid } from "@/src/domain/defaults";
import { createSession } from "@/src/domain/session";
import type { AnyConfig, CustomConfig, Team } from "@/src/domain/types";
import { validateConfig } from "@/src/domain/validate";
import { DesignConfig } from "@/src/features/design-config";
import { getStoreState, setPresets, startSession, useStore } from "@/src/store/session-store";
import { fontFamily, fontSize, makeStyles, radius, spacing, useTheme } from "@/src/theme";
import { TypographyPreview, refinedType } from "@/src/typography-preview";
import { layoutStyles, useScreenLayout } from "@/src/layout";

export default function ConfigScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { safeSides } = useScreenLayout();
  const router = useRouter();
  const params = useLocalSearchParams<{ mode: GameModeId; preset?: string; replay?: string; teams?: string; presetNew?: string }>();
  const mode = GAME_MODES.find((m) => m.id === params.mode);
  const presets = useStore((s) => s.presets);
  const activeSession = useStore((s) => s.session);

  const preset = params.preset ? presets.find((p) => p.id === params.preset) : null;
  const replayFrom = params.replay ? getStoreState().lastSummary : null;

  const [config, setConfig] = useState<AnyConfig>(() => {
    if (preset) return { ...preset.config, savePreset: false };
    if (replayFrom && replayFrom.mode === params.mode) return replayFrom.config;
    const base = defaultConfig(params.mode ?? "classique");
    const pref = getPreferences();
    return { ...base, sounds: pref.sounds, ...(base.mode === "classique" || base.mode === "custom" ? { additional: pref.additional } : {}), ...(params.teams && base.mode !== "classique" && base.mode !== "custom" ? { teamCount: pref.teams.length } : {}), ...(params.teams ? { customTeams: true } : {}), ...(params.presetNew && base.mode === "custom" ? { savePreset: true } : {}) };
  });
  const [teams, setTeams] = useState<Team[]>(() => {
    if (preset?.teams) return preset.teams;
    if (replayFrom && replayFrom.mode === params.mode) return replayFrom.teams;
    if (params.teams && getPreferences().teams.length) return getPreferences().teams;
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
      startSession({ ...session, live: session.live ? { ...session.live, chrono: { ...session.live.chrono, runningSince: null } } : null });
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

  const ctaLabel = config.mode === "classique" ? "Préparer le match" : config.mode === "custom" ? "Préparer le chrono" : config.mode === "maracana" ? "Créer la rotation" : config.mode === "cup" ? "Générer la Cup" : "Créer le tableau";
  const refinedTypography = true;

  return (
    <TypographyPreview.Provider value={refinedTypography}>
    <KeyboardAvoidingView style={[styles.root, safeSides]} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView testID="config-scroll" style={layoutStyles.scroll} contentContainerStyle={[layoutStyles.content, styles.scroll, { paddingTop: insets.top + 28, paddingBottom: spacing.xl }]} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
        <View style={styles.header}>
          <Pressable testID="config-back" onPress={() => router.back()} style={styles.backBtn} hitSlop={12} accessibilityRole="button" accessibilityLabel="Retour">
            <MaterialCommunityIcons name="chevron-left" size={30} color={colors.onSurface} />
          </Pressable>
          <View style={layoutStyles.flexible}>
            <Text testID="config-title" accessibilityRole="header" style={[styles.title, refinedTypography && refinedType.pageTitle]}>{preset ? preset.name : mode?.title ?? "Mode"}</Text>
            <Text testID="config-subtitle" style={[styles.subtitle, refinedTypography && refinedType.subtitle]}>{preset ? "Preset Custom" : ({ classique: "Configure puis lance quand tout le monde est prêt.", maracana: "Rotations automatiques et préparation des équipes.", cup: "Crée une compétition complète.", survie: "Perdre = sortir.", custom: "Construis exactement ton chrono." }[config.mode])}</Text>
          </View>
        </View>

        <DesignConfig config={config} onChange={setConfig} teams={alignedTeams} onTeams={setTeams} />
        {preset ? <PrimaryButton testID="preset-save-only" label="Enregistrer les modifications" variant="secondary" onPress={savePresetOnly} /> : null}

        {attempted && errors.length ? (
          <View style={styles.errors} testID="config-errors">
            {errors.map((e, i) => (
              <ErrorText key={e} testID={`config-error-${i}`}>{e}</ErrorText>
            ))}
          </View>
        ) : null}
      </ScrollView>

      <View testID="config-footer" style={[layoutStyles.content, styles.cta, { paddingBottom: insets.bottom + spacing.md }]}>
        <PrimaryButton testID="config-launch" label={ctaLabel} onPress={launch} disabled={attempted && errors.length > 0} />
      </View>
    </KeyboardAvoidingView>
    </TypographyPreview.Provider>
  );
}

const useStyles = makeStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.surface },
  scroll: { paddingHorizontal: 18, gap: 14, flexGrow: 1 },
  header: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.xs },
  backBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center", marginLeft: -spacing.sm },
  title: { fontFamily: fontFamily.textBold, fontSize: fontSize["2xl"], color: colors.onSurface, letterSpacing: -0.6 },
  subtitle: { fontFamily: fontFamily.text, fontSize: 12, color: colors.muted, marginTop: 2 },
  note: { fontFamily: fontFamily.text, fontSize: fontSize.sm, color: colors.muted },
  input: { minHeight: 54, paddingHorizontal: spacing.lg, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderStrong, color: colors.onSurface, fontFamily: fontFamily.textBold, fontSize: fontSize.lg },
  errors: { gap: spacing.xs, padding: spacing.lg, borderRadius: radius.md, borderWidth: 1, borderColor: colors.error, backgroundColor: colors.surfaceSecondary },
  cta: { marginTop: spacing.sm, paddingHorizontal: spacing.lg, paddingTop: spacing.md, backgroundColor: colors.surface,  },
}));

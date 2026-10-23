import { useUnsavedChanges } from "@/src/hooks/use-unsaved-changes";
import { getPreferences } from "@/src/store/preferences";
import { useCallback, useMemo, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Alert } from "@/src/alert";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialCommunityIcons from "@react-native-vector-icons/material-design-icons";

import { FormValidityContext, ErrorText } from "@/src/components/fields";
import { PrimaryButton } from "@/src/components/primary-button";
import { GAME_MODES, type GameModeId } from "@/src/data/modes";
import { alignTeams, defaultConfig, defaultTeams, teamCountFor } from "@/src/domain/defaults";
import { createSession } from "@/src/domain/session";
import { createTournamentSession } from "@/src/domain/tournament-presentation";
import type { AnyConfig, Team } from "@/src/domain/types";
import { validateConfig } from "@/src/domain/validate";
import { DesignConfig } from "@/src/features/design-config";
import { TournamentConfiguration } from "@/src/features/tournament-configuration";
import { normalizeTournament, tournamentDefaults, tournamentTeams } from "@/src/features/tournament-config-state";
import { LovableConfig } from "@/src/features/lovable-config";
import { lovableConfigTeams, lovableLaunchDefaults, lovableReplayConfig, mergeConfigurationTeams } from "@/src/features/lovable-config-state";
import { getStoreState, startSession, useStore } from "@/src/store/session-store";
import { control, fontFamily, fontSize, makeStyles, radius, spacing, useTheme } from "@/src/theme";
import { TypographyPreview } from "@/src/typography-preview";
import { layoutStyles, useScreenLayout } from "@/src/layout";

export default function ConfigScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { safeSides } = useScreenLayout();
  const router = useRouter();
  const params = useLocalSearchParams<{ mode: GameModeId; replay?: string; teams?: string }>();
  const mode = GAME_MODES.find((m) => m.id === params.mode);
  const activeSession = useStore((s) => s.session);
  const saveError = useStore(s=>s.saveError);

  const replayFrom = params.replay ? getStoreState().lastSummary : null;

  const [config, setConfig] = useState<AnyConfig>(() => {
    if (replayFrom && replayFrom.mode === params.mode && (replayFrom.config.mode === "cup" || replayFrom.config.mode === "survie")) return normalizeTournament({ ...replayFrom.config, tournamentPolicy: "lovable", ...(replayFrom.config.mode === "cup" ? {bestNext: replayFrom.config.bestNext ?? true} : {soundControl:"session"}) });
    if (replayFrom && replayFrom.mode === params.mode) return replayFrom.config.mode === "classique" || replayFrom.config.mode === "maracana" ? lovableReplayConfig(replayFrom.config) : replayFrom.config;
    const base = params.mode === "classique" || params.mode === "maracana" ? lovableLaunchDefaults(params.mode) : params.mode === "cup" || params.mode === "survie" ? tournamentDefaults(params.mode) : defaultConfig(params.mode ?? "classique");
    const pref = getPreferences();
    return { ...base, sounds: pref.sounds, ...(base.mode === "custom" ? { additional: pref.additional } : {}), ...(params.teams && base.mode !== "classique" && base.mode !== "custom" ? { teamCount: pref.teams.length } : {}), ...(params.teams ? { customTeams: true } : {}), ...(base.mode === "custom" ? { savePreset: false } : {}) };
  });
  const [teams, setTeams] = useState<Team[]>(() => {
    if (replayFrom && replayFrom.mode === params.mode) return replayFrom.teams;
    if (params.teams && getPreferences().teams.length) return getPreferences().teams;
    if (params.mode === "classique" || params.mode === "maracana") return lovableConfigTeams(params.mode, params.mode === "maracana" ? 8 : 2);
    if (params.mode === "cup" || params.mode === "survie") return tournamentTeams(32);
    return defaultTeams(params.mode ?? "classique", teamCountFor(config));
  });
  const [attempted, setAttempted] = useState(false);

  // Aligne la liste d'équipes sur le nombre configuré, en conservant les noms.
  const count = teamCountFor(config);
  const alignedTeams = useMemo(() => alignTeams(teams,config.mode,count), [teams,count,config.mode]);
  const launchTeams = (config.mode === "cup" || config.mode === "survie") && !config.customTeams ? tournamentTeams(count) : (config.mode === "classique" || config.mode === "maracana") && !config.customTeams ? lovableConfigTeams(config.mode, count) : alignedTeams;

  const [fieldErrors, setFieldErrors] = useState<Record<string,string>>({});
  const reportValidity = useCallback((id:string,message:string|null) => setFieldErrors(prev => {
    if (prev[id] === message || (message==null && !(id in prev))) return prev;
    const next={...prev};if(message) next[id]=message;else delete next[id];return next;
  }),[]);
  const errors = [...validateConfig(config, launchTeams), ...Object.values(fieldErrors)];
  const snapshot = JSON.stringify({config,teams});
  const [initial] = useState(snapshot);
  const leave = useUnsavedChanges(initial !== snapshot || Object.keys(fieldErrors).length>0);

  const launch = () => {
    setAttempted(true);
    if (errors.length) return;
    const go = () => leave(() => {
      const now = Date.now();
      const session = config.mode === "cup" || config.mode === "survie" ? createTournamentSession(config, launchTeams, now) : createSession(config, launchTeams, now);
      if (startSession({ ...session, ...(config.mode === "cup" || config.mode === "survie" ? { tournamentView: "hub" as const } : {}), live: session.live ? { ...session.live, chrono: { ...session.live.chrono, runningSince: null } } : null })) router.replace("/live" as never);
    });
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

  const ctaLabel = config.mode === "custom" ? "Préparer le chrono" : "Lancer la session";
  const refinedTypography = true;

  if (config.mode === "cup" || config.mode === "survie") return <TournamentConfiguration config={config} onChange={setConfig} teams={alignedTeams} onTeams={next => setTeams(previous => mergeConfigurationTeams(previous, next))} onBack={() => router.canGoBack() ? router.back() : router.replace("/")} onLaunch={launch} errors={[...(saveError ? [saveError] : []), ...errors]} disabled={errors.length > 0} />;

  if (config.mode === "classique" || config.mode === "maracana") return <LovableConfig config={config} onChange={setConfig} teams={alignedTeams} onTeams={next => setTeams(previous => mergeConfigurationTeams(previous, next))} onBack={() => router.canGoBack() ? router.back() : router.replace("/")} onLaunch={launch} errors={[...(saveError ? [saveError] : []), ...errors]} disabled={errors.length > 0} />;

  return (
    <TypographyPreview.Provider value={refinedTypography}>
    <KeyboardAvoidingView style={[styles.root, safeSides]} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView testID="config-scroll" style={layoutStyles.scroll} contentContainerStyle={[layoutStyles.formContent, styles.scroll, { paddingTop: insets.top + 28, paddingBottom: insets.bottom + spacing["3xl"] }]} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
        <View style={styles.header}>
          <Pressable testID="config-back" onPress={() => router.canGoBack() ? router.back() : router.replace("/")} style={styles.backBtn} hitSlop={12} accessibilityRole="button" accessibilityLabel="Retour">
            <MaterialCommunityIcons name="chevron-left" size={30} color={colors.onSurface} />
          </Pressable>
          <View style={layoutStyles.flexible}>
            <Text testID="config-title" accessibilityRole="header" style={styles.title}>Mode {mode?.title ?? "Match"}</Text>
            <Text testID="config-subtitle" style={styles.subtitle}>Paramètres</Text>
          </View>
          <View style={styles.headerBalance}/>
        </View>

        <View style={styles.modeIntro}><MaterialCommunityIcons name={mode?.icon ?? "soccer"} size={34} color={colors[mode?.accent ?? "modeClassique"]}/><View style={{flex:1}}><Text style={styles.modeName}>{mode?.description}</Text><Text style={styles.modeHint}>Un maximum de jeu, un minimum d’organisation.</Text></View></View>

        {getPreferences().teams.length>=count?<PrimaryButton label="Utiliser mes équipes enregistrées" variant="secondary" onPress={()=>{setTeams(getPreferences().teams.slice(0,count));setConfig({...config,customTeams:true});}}/>:null}
        <FormValidityContext.Provider value={reportValidity}>
        <DesignConfig config={config} onChange={setConfig} teams={alignedTeams} onTeams={setTeams} validationErrors={attempted ? errors : []} />
        </FormValidityContext.Provider>
        {saveError?<ErrorText>{saveError}</ErrorText>:null}
        {attempted && errors.length ? (
          <View style={styles.errors} testID="config-errors">
            {errors.map((e, i) => (
              <ErrorText key={e} testID={`config-error-${i}`}>{e}</ErrorText>
            ))}
          </View>
        ) : null}
      </ScrollView>
      <View testID="config-footer" style={[styles.cta, {paddingBottom:insets.bottom+12}]}>
        <PrimaryButton testID="config-launch" label={ctaLabel} leadingIcon={<MaterialCommunityIcons name="play" size={20} color={colors.onBrandPrimary}/>} onPress={launch} disabled={errors.length > 0} />
      </View>
    </KeyboardAvoidingView>
    </TypographyPreview.Provider>
  );
}

const useStyles = makeStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.surface },
  scroll: { paddingHorizontal: 18, gap: 14, flexGrow: 1 },
  header: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.xs },
  backBtn: { width: 40, height: control.icon, alignItems: "center", justifyContent: "center" },
  headerBalance: {width:40},
  title: { fontFamily: fontFamily.textBold, fontSize: 20, color: colors.onSurface, letterSpacing: -0.4, textAlign:"center" },
  subtitle: { fontFamily: fontFamily.text, fontSize: 12, color: colors.muted, marginTop: 2, textAlign:"center" },
  modeIntro: {flexDirection:"row",alignItems:"center",gap:14,paddingHorizontal:12,paddingVertical:8},
  modeName: {fontFamily:fontFamily.textBold,fontSize:13,color:colors.onSurface},
  modeHint: {fontFamily:fontFamily.text,fontSize:11,color:colors.muted,marginTop:3},
  note: { fontFamily: fontFamily.text, fontSize: fontSize.sm, color: colors.muted },
  input: { minHeight: 54, paddingHorizontal: spacing.lg, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderStrong, color: colors.onSurface, fontFamily: fontFamily.textBold, fontSize: fontSize.lg },
  errors: { gap: spacing.xs, padding: spacing.lg, borderRadius: radius.md, borderWidth: 1, borderColor: colors.error, backgroundColor: colors.surfaceSecondary },
  cta: { paddingHorizontal:18,paddingTop:10,backgroundColor:colors.surface,borderTopWidth:1,borderColor:colors.border },
}));

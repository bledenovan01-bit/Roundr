import { useRouter } from "expo-router";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import MaterialCommunityIcons from "@react-native-vector-icons/material-design-icons";

import { ModeCard } from "@/src/components/mode-card";
import { PresetPill } from "@/src/components/preset-pill";
import { ResumeCard } from "@/src/components/resume-card";
import { GAME_MODES, type GameModeId } from "@/src/data/modes";
import { formatRemaining } from "@/src/chrono/format";
import { elapsedMs } from "@/src/chrono/engine";
import { presetMeta } from "@/src/features/preset-meta";
import { useStore } from "@/src/store/session-store";
import { refinedFontFamily as fontFamily } from "@/src/typography-preview";
import { layoutStyles, useScreenLayout } from "@/src/layout";
import {
  fontSize,
  makeStyles,
  radius,
  spacing,
  useTheme,
} from "@/src/theme";

export default function HomeScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { safeSides } = useScreenLayout();
  const router = useRouter();
  const session = useStore((s) => s.session);
  const now = useStore(s => s.now);
  const presets = useStore((s) => s.presets);
  const saveError = useStore((s) => s.saveError);
  const activeMode = session ? GAME_MODES.find((m) => m.id === session.mode) : null;
  const resumeSubtitle = (() => {
    if (!session?.live) return "";
    const live = session.live;
    const match = session.matches.find((m) => m.id === live.matchId);
    if (live.stage === "finished") return `${match?.label ?? ""} terminé · transition`;
    if (live.stage === "period" && live.end.byTime) return `${match?.label ?? ""} · ${formatRemaining(Math.max(0, live.periodMs[live.periodIndex] - elapsedMs(live.chrono, now)))} restantes${live.chrono.runningSince == null ? " · en pause" : ""}`;
    return `${match?.label ?? ""} · ${session.teams.length} équipes`;
  })();

  const openMode = (id: GameModeId) => {
    // Prompt 02+ wires each mode to its configuration screen.
    // For now we keep the route stable so future screens plug in cleanly.
    router.push(`/config/${id}` as never);
  };

  const resumeSession = () => {
    router.push("/live" as never);
  };

  return (
    <View testID="home-screen" style={[styles.root, safeSides, { paddingTop: insets.top }]}>
      <View style={styles.hero}>
        <Image source={require("@/assets/images/pitch-night.png")} style={styles.heroImage} resizeMode="cover" />
        <LinearGradient
          colors={["transparent", colors.surface]}
          locations={[0.1, 0.92]}
          style={styles.heroFade}
        />
      </View>
      <ScrollView
        testID="home-scroll"
        contentContainerStyle={[
          layoutStyles.content,
          styles.scroll,
          { paddingBottom: insets.bottom + spacing["2xl"] },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View
          entering={FadeIn.duration(400)}
          style={styles.header}
          testID="home-header"
        >
          <View style={styles.brandRow}>
            <Text testID="home-wordmark" style={styles.brandName}>Roundr<Text style={{ color: colors.brandPrimary }}>.</Text></Text>
          </View>
          <Text testID="home-tagline" style={styles.tagline}>Plus de jeu. Moins d’organisation.</Text>
        </Animated.View>

        {/* Resume session (conditional) */}
        {saveError ? (
          <Text style={styles.saveError} testID="home-save-error">{saveError}</Text>
        ) : null}
        {session && session.status === "active" && activeMode ? (
          <Animated.View
            entering={FadeInDown.duration(360)}
            style={styles.resumeWrap}
          >
            <ResumeCard
              testID="resume-session-card"
              modeLabel={activeMode.title}
              subtitle={resumeSubtitle}
              onPress={resumeSession}
            />
          </Animated.View>
        ) : null}

        {/* Modes de jeu */}
        <View style={styles.section} testID="modes-section">
          <View style={styles.sectionHeader}>
            <Text testID="home-modes-title" style={styles.sectionTitle}>Choisis ton mode</Text>
          </View>
          <View style={styles.modesList}>
            {GAME_MODES.map((mode, index) => (
              <ModeCard
                key={mode.id}
                index={index}
                testID={`mode-card-${mode.id}`}
                title={mode.title}
                description={mode.description}
                iconName={mode.icon}
                accent={colors[mode.accent]}
                dominant={index === 0}
                onPress={() => openMode(mode.id)}
              />
            ))}
          </View>
        </View>

        {/* Mes chronos (conditional presets) */}
        {presets.length > 0 ? (
          <View style={styles.section} testID="presets-section">
            <Pressable style={styles.sectionHeader} onPress={() => router.push("/presets" as never)} testID="presets-manage" accessibilityRole="button" accessibilityLabel="Gérer mes chronos">
              <Text testID="home-presets-title" style={styles.sectionTitle}>Mes chronos</Text>
              <Text style={[styles.sectionHint, { color: colors.brandPrimary }]}>Gérer ›</Text>
            </Pressable>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.presetsRow}
            >
              {presets.map((preset) => (
                <PresetPill
                  key={preset.id}
                  testID={`preset-${preset.id}`}
                  name={preset.name}
                  meta={presetMeta(preset)}
                  onPress={() => router.push(`/config/custom?preset=${preset.id}` as never)}
                />
              ))}
            </ScrollView>
          </View>
        ) : (
          <Pressable style={styles.emptyPresets} testID="presets-empty" onPress={() => router.push("/presets" as never)} accessibilityRole="button" accessibilityLabel="Mes chronos, formats sauvegardés">
            <View style={styles.emptyPresetsIcon}>
              <MaterialCommunityIcons
                name="clock-outline"
                size={24}
                color={colors.onSurface}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text testID="home-empty-presets-title" style={styles.emptyPresetsTitle}>Mes chronos</Text>
              <Text testID="home-empty-presets-subtitle" style={styles.emptyPresetsSubtitle}>
                Vos formats sauvegardés
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color={colors.muted} />
          </Pressable>
        )}

        {/* Footer */}
        <View style={styles.footer} testID="home-footer">
          <Text style={styles.footerTagline}>PLUS DE JEU. MOINS D’ORGANISATION.</Text>
          <Text style={styles.footerWordmark}>
            Roundr<Text style={{ color: colors.brandPrimary }}>.</Text>
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  root: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  hero: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 300,
    pointerEvents: "none",
  },
  heroImage: {
    width: "100%",
    height: "100%",
    opacity: 0.55,
  },
  heroFade: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    gap: spacing.xl,
  },
  header: {
    gap: spacing.sm,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  brandName: {
    fontFamily: fontFamily.textBold,
    fontSize: 44,
    lineHeight: 50,
    color: colors.onSurface,
    letterSpacing: -1.4,
  },
  tagline: {
    fontFamily: fontFamily.text,
    fontSize: 14,
    lineHeight: 20,
    color: colors.muted,
  },
  resumeWrap: {},
  section: {
    gap: spacing.md,
  },
  sectionHeader: {
    minHeight: 44,
    flexWrap: "wrap",
    gap: spacing.sm,
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontFamily: fontFamily.textBold,
    fontSize: 32,
    lineHeight: 40,
    letterSpacing: -0.6,
    color: colors.onSurface,
  },
  sectionHint: {
    fontFamily: fontFamily.text,
    fontSize: fontSize.sm,
    color: colors.muted,
  },
  modesList: {
    gap: spacing.md,
  },
  presetsRow: {
    gap: spacing.md,
    paddingRight: spacing.lg,
  },
  emptyPresets: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSecondary,
  },
  emptyPresetsIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: colors.borderStrong,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyPresetsTitle: {
    fontFamily: fontFamily.textBold,
    fontSize: 20,
    lineHeight: 26,
    color: colors.onSurface,
  },
  emptyPresetsSubtitle: {
    fontFamily: fontFamily.text,
    fontSize: 12,
    lineHeight: 18,
    color: colors.muted,
    marginTop: 2,
  },
  footer: {
    alignItems: "center",
    paddingVertical: spacing.md,
    gap: spacing.xs,
  },
  footerTagline: {
    textAlign: "center",
    fontFamily: fontFamily.text,
    fontSize: 10,
    color: colors.muted,
    letterSpacing: 2.2,
  },
  footerWordmark: {
    fontFamily: fontFamily.textBold,
    fontSize: fontSize.xl,
    color: colors.onSurface,
    letterSpacing: -0.8,
  },
  saveError: {
    fontFamily: fontFamily.textBold,
    fontSize: fontSize.sm,
    color: colors.onError,
    backgroundColor: colors.error,
    padding: spacing.md,
    borderRadius: 8,
  },
}));



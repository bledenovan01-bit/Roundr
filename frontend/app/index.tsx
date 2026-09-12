import { useRouter } from "expo-router";
import {
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import MaterialCommunityIcons from "@react-native-vector-icons/material-design-icons";

import { ModeCard } from "@/src/components/mode-card";
import { PresetPill } from "@/src/components/preset-pill";
import { ResumeCard } from "@/src/components/resume-card";
import { GAME_MODES, type GameModeId } from "@/src/data/modes";
import {
  fontFamily,
  fontSize,
  makeStyles,
  spacing,
  useTheme,
} from "@/src/theme";

// V0 placeholder state: no persistence yet (prompt 03 handles that).
// The home screen still renders the conditional sections when data exists.
const HAS_ACTIVE_SESSION = false;
const CUSTOM_PRESETS: { id: string; name: string; meta: string }[] = [];

export default function HomeScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const openMode = (id: GameModeId) => {
    // Prompt 02+ wires each mode to its configuration screen.
    // For now we keep the route stable so future screens plug in cleanly.
    router.push(`/config/${id}` as never);
  };

  const resumeSession = () => {
    router.push("/live" as never);
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={[
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
            <View style={styles.logoDot}>
              <MaterialCommunityIcons
                name="soccer"
                size={22}
                color={colors.onBrandPrimary}
              />
            </View>
            <Text style={styles.brandName}>ROUNDR</Text>
          </View>
          <Text style={styles.tagline}>Plus de jeu. Moins d’organisation.</Text>
        </Animated.View>

        {/* Resume session (conditional) */}
        {HAS_ACTIVE_SESSION ? (
          <Animated.View
            entering={FadeInDown.duration(360)}
            style={styles.resumeWrap}
          >
            <ResumeCard
              testID="resume-session-card"
              modeLabel="Maracana"
              subtitle="4 équipes · 5 min · 12:34 restantes"
              onPress={resumeSession}
            />
          </Animated.View>
        ) : null}

        {/* Modes de jeu */}
        <View style={styles.section} testID="modes-section">
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>MODES DE JEU</Text>
            <Text style={styles.sectionHint}>Choisis un format</Text>
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
                onPress={() => openMode(mode.id)}
              />
            ))}
          </View>
        </View>

        {/* Mes chronos (conditional presets) */}
        {CUSTOM_PRESETS.length > 0 ? (
          <View style={styles.section} testID="presets-section">
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>MES CHRONOS</Text>
              <Text style={styles.sectionHint}>Presets Custom</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.presetsRow}
            >
              {CUSTOM_PRESETS.map((preset) => (
                <PresetPill
                  key={preset.id}
                  testID={`preset-${preset.id}`}
                  name={preset.name}
                  meta={preset.meta}
                  onPress={() => openMode("custom")}
                />
              ))}
            </ScrollView>
          </View>
        ) : (
          <View style={styles.emptyPresets} testID="presets-empty">
            <MaterialCommunityIcons
              name="timer-plus-outline"
              size={24}
              color={colors.muted}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.emptyPresetsTitle}>Mes chronos</Text>
              <Text style={styles.emptyPresetsSubtitle}>
                Enregistre tes réglages Custom pour les relancer en un tap.
              </Text>
            </View>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer} testID="home-footer">
          <Text style={styles.footerText}>Roundr V0 · Hors-ligne</Text>
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
  logoDot: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.brandPrimary,
    alignItems: "center",
    justifyContent: "center",
  },
  brandName: {
    fontFamily: fontFamily.display,
    fontSize: fontSize["3xl"],
    color: colors.onSurface,
    letterSpacing: 2,
  },
  tagline: {
    fontFamily: fontFamily.text,
    fontSize: fontSize.base,
    color: colors.muted,
  },
  resumeWrap: {},
  section: {
    gap: spacing.md,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontFamily: fontFamily.textBold,
    fontSize: fontSize.sm,
    letterSpacing: 1.5,
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
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: "dashed",
    backgroundColor: colors.surfaceSecondary,
  },
  emptyPresetsTitle: {
    fontFamily: fontFamily.textBold,
    fontSize: fontSize.base,
    color: colors.onSurface,
  },
  emptyPresetsSubtitle: {
    fontFamily: fontFamily.text,
    fontSize: fontSize.sm,
    color: colors.muted,
    marginTop: 2,
  },
  footer: {
    alignItems: "center",
    paddingVertical: spacing.md,
  },
  footerText: {
    fontFamily: fontFamily.text,
    fontSize: fontSize.sm,
    color: colors.muted,
    letterSpacing: 0.5,
  },
}));

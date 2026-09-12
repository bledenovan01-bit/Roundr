import { useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialCommunityIcons from "@react-native-vector-icons/material-design-icons";

import { GAME_MODES, type GameModeId } from "@/src/data/modes";
import {
  fontFamily,
  fontSize,
  makeStyles,
  spacing,
  useTheme,
} from "@/src/theme";

// Placeholder screen shipped with prompt 01. Prompt 02+ replaces the body
// with the per-mode configuration flow. Kept minimal on purpose.
export default function ConfigScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ mode: GameModeId }>();

  const mode = GAME_MODES.find((m) => m.id === params.mode);

  return (
    <View
      style={[
        styles.root,
        { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom },
      ]}
    >
      <Pressable
        testID="config-back"
        onPress={() => router.back()}
        style={styles.backBtn}
        hitSlop={12}
      >
        <MaterialCommunityIcons
          name="chevron-left"
          size={28}
          color={colors.onSurface}
        />
        <Text style={styles.backLabel}>Accueil</Text>
      </Pressable>

      <View style={styles.body}>
        <Text style={styles.eyebrow}>CONFIGURATION</Text>
        <Text style={styles.title}>{mode?.title ?? "Mode"}</Text>
        <Text style={styles.description}>
          {mode?.description ?? "Mode inconnu."}
        </Text>
        <View style={styles.placeholder}>
          <MaterialCommunityIcons
            name="hammer-wrench"
            size={28}
            color={colors.brandPrimary}
          />
          <Text style={styles.placeholderTitle}>Bientôt disponible</Text>
          <Text style={styles.placeholderText}>
            L’écran de configuration arrive au prochain sprint.
          </Text>
        </View>
      </View>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  root: {
    flex: 1,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    gap: spacing.xl,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    alignSelf: "flex-start",
  },
  backLabel: {
    fontFamily: fontFamily.textBold,
    fontSize: fontSize.lg,
    color: colors.onSurface,
  },
  body: {
    gap: spacing.md,
  },
  eyebrow: {
    fontFamily: fontFamily.textBold,
    fontSize: fontSize.sm,
    letterSpacing: 1.5,
    color: colors.brandPrimary,
  },
  title: {
    fontFamily: fontFamily.display,
    fontSize: fontSize["3xl"],
    color: colors.onSurface,
    letterSpacing: 1,
  },
  description: {
    fontFamily: fontFamily.text,
    fontSize: fontSize.lg,
    color: colors.muted,
  },
  placeholder: {
    marginTop: spacing.xl,
    padding: spacing.xl,
    borderRadius: 8,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  placeholderTitle: {
    fontFamily: fontFamily.textBold,
    fontSize: fontSize.lg,
    color: colors.onSurface,
  },
  placeholderText: {
    fontFamily: fontFamily.text,
    fontSize: fontSize.base,
    color: colors.muted,
  },
}));

import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialCommunityIcons from "@react-native-vector-icons/material-design-icons";

import {
  fontFamily,
  fontSize,
  makeStyles,
  spacing,
  useTheme,
} from "@/src/theme";

// Placeholder for the Live screen. Prompt 02+ (moteur chrono) fills this out.
export default function LiveScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View
      style={[
        styles.root,
        { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom },
      ]}
    >
      <Pressable
        testID="live-back"
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

      <View style={styles.hero}>
        <Text style={styles.eyebrow}>LIVE</Text>
        <Text style={styles.chrono}>00:00</Text>
        <Text style={styles.hint}>Moteur chrono à venir (prompt 02)</Text>
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
  hero: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
  },
  eyebrow: {
    fontFamily: fontFamily.textBold,
    fontSize: fontSize.sm,
    letterSpacing: 2,
    color: colors.brandPrimary,
  },
  chrono: {
    fontFamily: fontFamily.display,
    fontSize: fontSize.giant,
    color: colors.onSurface,
    letterSpacing: 2,
    // @ts-expect-error react-native tabular-nums
    fontVariant: ["tabular-nums"],
  },
  hint: {
    fontFamily: fontFamily.text,
    fontSize: fontSize.base,
    color: colors.muted,
  },
}));

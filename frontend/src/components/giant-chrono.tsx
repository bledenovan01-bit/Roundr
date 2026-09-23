// Chrono géant : téléphone posé au bord du terrain, lecture à plusieurs mètres.
// Vue de présentation uniquement (aucune règle de jeu ici) : elle affiche l'état
// du chrono fourni et relaie pause/reprise à l'écran live.
import { Modal, Pressable, ScrollView, Text, View, useWindowDimensions } from "react-native";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialCommunityIcons from "@react-native-vector-icons/material-design-icons";

import { fontFamily, fontSize, makeStyles, radius, spacing, useTheme } from "@/src/theme";

type Props = {
  visible: boolean;
  time: string;
  caption: string;
  status: string;
  scoreLine: string | null;
  paused: boolean;
  canPause: boolean;
  onTogglePause: () => void;
  onClose: () => void;
};

export function GiantChrono(props: Props) {
  return (
    <Modal visible={props.visible} animationType="fade" onRequestClose={props.onClose} supportedOrientations={["portrait", "landscape"]}>
      <SafeAreaProvider>
        <GiantChronoContent {...props} />
      </SafeAreaProvider>
    </Modal>
  );
}

function GiantChronoContent({ time, caption, status, scoreLine, paused, canPause, onTogglePause, onClose }: Props) {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const landscape = width > height;
  const usableWidth = width - insets.left - insets.right;
  const timerWidth = usableWidth - spacing.lg * 2 - (landscape ? 160 + spacing.xl : 0);
  const base = Math.min((landscape ? timerWidth : usableWidth) / 2.6, height * 0.42);
  const size = Math.min(base * (time.length > 5 ? 0.75 : 1), timerWidth / (time.length * 0.46));

  return (
      <View style={[styles.root, { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.md, paddingLeft: insets.left + spacing.lg, paddingRight: insets.right + spacing.lg }]} testID="giant-chrono">
        <View style={styles.closeRow}>
        <Pressable testID="giant-close" onPress={onClose} style={styles.close} accessibilityRole="button" accessibilityLabel="Fermer le chrono géant">
          <MaterialCommunityIcons name="arrow-collapse" size={26} color={colors.muted} />
        </Pressable>
        </View>
        <ScrollView testID="giant-scroll" style={styles.scroll} contentContainerStyle={[styles.body, landscape && styles.bodyLandscape]}>
        <View style={[styles.timerGroup, landscape && styles.timerGroupLandscape]}>
        <Text testID="giant-caption" style={styles.caption}>{caption.toUpperCase()}</Text>
        <Text maxFontSizeMultiplier={1} accessibilityLabel={`${caption} : ${time}`} style={[styles.time, { fontSize: size, lineHeight: size }]} testID="giant-time">
          {time}
        </Text>
        <Text testID="giant-status" style={[styles.status, paused && { color: colors.warning }]}>{status}</Text>
        </View>
        <View style={[styles.actions, landscape && styles.actionsLandscape]}>
        {scoreLine ? <Text style={styles.score} testID="giant-score">{scoreLine}</Text> : null}

        {canPause ? (
          <Pressable testID="giant-pause" onPress={onTogglePause} style={[styles.ctrl, landscape && styles.ctrlLandscape, paused && { borderColor: colors.brandPrimary }]} accessibilityRole="button" accessibilityLabel={paused ? "Reprendre le chrono" : "Mettre le chrono en pause"}>
            <MaterialCommunityIcons name={paused ? "play" : "pause"} size={26} color={paused ? colors.brandPrimary : colors.onSurface} />
            <Text testID="giant-pause-label" style={[styles.ctrlLabel, paused && { color: colors.brandPrimary }]}>{paused ? "Reprendre" : "Pause"}</Text>
          </Pressable>
        ) : null}
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
  closeRow: { alignItems: "flex-end" },
  close: { width: 48, height: 48, alignItems: "center", justifyContent: "center" },
  scroll: { flex: 1, minHeight: 0 },
  body: { flexGrow: 1, alignItems: "center", justifyContent: "center", gap: spacing.md, paddingVertical: spacing.md },
  bodyLandscape: { flexDirection: "row", gap: spacing.xl },
  timerGroup: { width: "100%", alignItems: "center", gap: spacing.md },
  timerGroupLandscape: { flex: 1, minWidth: 0, width: "auto" },
  actions: { alignItems: "center", gap: spacing.md, maxWidth: "100%" },
  actionsLandscape: { width: 160 },
  caption: { maxWidth: "100%", textAlign: "center", fontFamily: fontFamily.textBold, fontSize: fontSize.lg, letterSpacing: 4, color: colors.muted },
  time: {
    fontFamily: fontFamily.display,
    color: colors.onSurface,
    textAlign: "center",
    // @ts-ignore react-native fontVariant tuple
    fontVariant: ["tabular-nums"],
  },
  status: { fontFamily: fontFamily.textBold, fontSize: fontSize.xl, color: colors.muted, textAlign: "center" },
  score: { fontFamily: fontFamily.display, fontSize: fontSize["2xl"] + 10, color: colors.onSurface, letterSpacing: 2 },
  ctrl: {
    maxWidth: "100%",
    paddingVertical: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    minHeight: 64,
    paddingHorizontal: spacing["2xl"],
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  ctrlLabel: { flexShrink: 1, textAlign: "center", fontFamily: fontFamily.textBold, fontSize: fontSize.xl - 2, color: colors.onSurface },
  ctrlLandscape: { paddingHorizontal: spacing.lg },
}));

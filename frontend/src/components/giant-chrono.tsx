// Chrono géant : téléphone posé au bord du terrain, lecture à plusieurs mètres.
// Vue de présentation uniquement (aucune règle de jeu ici) : elle affiche l'état
// du chrono fourni et relaie pause/reprise à l'écran live.
import { Modal, Pressable, Text, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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

export function GiantChrono({ visible, time, caption, status, scoreLine, paused, canPause, onTogglePause, onClose }: Props) {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const size = Math.min(width / 2.6, height * 0.42) * (time.length > 5 ? 0.75 : 1);

  return (
    <Modal visible={visible} animationType="fade" onRequestClose={onClose} supportedOrientations={["portrait", "landscape"]}>
      <View style={[styles.root, { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.md }]} testID="giant-chrono">
        <Pressable testID="giant-close" onPress={onClose} style={styles.close} hitSlop={12}>
          <MaterialCommunityIcons name="arrow-collapse" size={26} color={colors.muted} />
        </Pressable>

        <Text style={styles.caption}>{caption.toUpperCase()}</Text>
        <Text style={[styles.time, { fontSize: size, lineHeight: size }]} testID="giant-time">
          {time}
        </Text>
        <Text style={[styles.status, paused && { color: colors.warning }]}>{status}</Text>
        {scoreLine ? <Text style={styles.score} testID="giant-score">{scoreLine}</Text> : null}

        {canPause ? (
          <Pressable testID="giant-pause" onPress={onTogglePause} style={[styles.ctrl, paused && { borderColor: colors.brandPrimary }]}>
            <MaterialCommunityIcons name={paused ? "play" : "pause"} size={26} color={paused ? colors.brandPrimary : colors.onSurface} />
            <Text style={[styles.ctrlLabel, paused && { color: colors.brandPrimary }]}>{paused ? "Reprendre" : "Pause"}</Text>
          </Pressable>
        ) : null}
      </View>
    </Modal>
  );
}

const useStyles = makeStyles((colors) => ({
  root: {
    flex: 1,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  close: { position: "absolute", top: spacing["2xl"], right: spacing.lg, width: 48, height: 48, alignItems: "center", justifyContent: "center" },
  caption: { fontFamily: fontFamily.textBold, fontSize: fontSize.lg, letterSpacing: 4, color: colors.muted },
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
    marginTop: spacing.lg,
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
  ctrlLabel: { fontFamily: fontFamily.textBold, fontSize: fontSize.xl - 2, color: colors.onSurface },
}));

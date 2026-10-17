// Bannière de notification ponctuelle interne (Phase 2 — réf. Lovable).
// S'affiche SOUS le bloc du chronomètre. Vert = échauffement/préparation,
// orange = alertes de temps. ~4,5 s (piloté par `notice.until` via le store).
// Non bloquante (pointerEvents="none"), fondu discret en entrée ET en sortie.
import { useEffect, useRef, useState } from "react";
import { Animated, Text, View } from "react-native";
import MaterialCommunityIcons from "@react-native-vector-icons/material-design-icons";
import { fontFamily, makeStyles, radius, spacing, useTheme } from "@/src/theme";

export type LiveNoticeTone = "warmup" | "time";
export type LiveNotice = { message: string; until: number; tone: LiveNoticeTone };

export function LiveNoticeBanner({ notice }: { notice: LiveNotice | null }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(10)).current;
  // On garde la dernière notice pendant le fondu de sortie, puis on démonte.
  const [shown, setShown] = useState<LiveNotice | null>(null);
  const key = notice ? `${notice.message}@${notice.until}` : "none";

  useEffect(() => {
    if (notice) {
      setShown(notice);
      opacity.setValue(0);
      translateY.setValue(10);
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 260, useNativeDriver: true }),
      ]).start();
    } else if (shown) {
      // Fondu de sortie discret avant de retirer la bannière.
      Animated.timing(opacity, { toValue: 0, duration: 260, useNativeDriver: true }).start(({ finished }) => {
        if (finished) setShown(null);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  if (!shown) return null;
  const warm = shown.tone === "warmup";
  const accent = warm ? colors.brandPrimary : colors.warning;
  const bg = warm ? colors.brandTertiary : "rgba(245,158,11,0.14)";
  const icon = warm ? "bullhorn-variant" : "timer-alert-outline";
  return (
    <Animated.View
      pointerEvents="none"
      testID="live-notice-banner"
      accessibilityLiveRegion="polite"
      accessible
      accessibilityLabel={shown.message}
      style={[styles.wrap, { borderColor: accent, backgroundColor: bg, opacity, transform: [{ translateY }] }]}
    >
      <View style={[styles.iconWrap, { backgroundColor: accent }]}>
        <MaterialCommunityIcons name={icon} size={18} color={colors.surface} />
      </View>
      <Text style={[styles.message, { color: colors.onSurface }]} numberOfLines={3}>
        {shown.message}
      </Text>
    </Animated.View>
  );
}

const useStyles = makeStyles((colors) => ({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    marginTop: spacing.md,
  },
  iconWrap: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  message: { flex: 1, minWidth: 0, fontFamily: fontFamily.textBold, fontSize: 14, lineHeight: 20 },
}));

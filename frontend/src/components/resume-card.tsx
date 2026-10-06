import { Pressable, Text, View } from "react-native";
import * as Haptics from "@/src/haptics";
import MaterialCommunityIcons from "@react-native-vector-icons/material-design-icons";
import { refinedFontFamily as fontFamily } from "@/src/typography-preview";
import { useScreenLayout } from "@/src/layout";

import {
  fontSize,
  makeStyles,
  radius,
  spacing,
  useTheme,
} from "@/src/theme";

type Props = {
  modeLabel: string;
  subtitle: string;
  onPress: () => void;
  testID?: string;
};

export function ResumeCard({ modeLabel, subtitle, onPress, testID }: Props) {
  const styles = useStyles();
  const { colors } = useTheme();
  const { compact } = useScreenLayout();

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    onPress();
  };

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={`Reprendre la session. ${modeLabel}. ${subtitle}`}
      onPress={handlePress}
      style={({ pressed }) => [styles.card, compact && styles.cardCompact, pressed && styles.pressed]}
    >
      <View style={[styles.left, compact && styles.compactHeading]}>
        <View style={styles.badge}>
          <MaterialCommunityIcons
            name="play"
            size={22}
            color={colors.brandPrimary}
          />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text testID={`${testID}-title`} style={styles.title}>
            Reprendre la session en cours
          </Text>
          {!compact ? <Text testID={`${testID}-subtitle`} style={styles.subtitle}>
            {modeLabel} · {subtitle}
          </Text> : null}
        </View>
        {compact ? <MaterialCommunityIcons name="chevron-right" size={24} color={colors.muted} /> : null}
      </View>
      {compact ? <Text testID={`${testID}-subtitle`} style={styles.subtitle}>{modeLabel} · {subtitle}</Text> : null}
      <View style={[styles.statusPill, compact && styles.inlineStatus]}>
        <Text testID={`${testID}-status`} style={styles.statusLabel}>En cours</Text>
      </View>
      {!compact ? <MaterialCommunityIcons
        name="chevron-right"
        size={24}
        color={colors.muted}
      /> : null}
    </Pressable>
  );
}

const useStyles = makeStyles((colors) => ({
  card: {
    minHeight: 84,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  pressed: {
    backgroundColor: colors.surfaceTertiary,
  },
  cardCompact: { flexDirection: "column", alignItems: "stretch" },
  compactHeading: { flexGrow: 0, flexShrink: 0, flexBasis: "auto" },
  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    flex: 1,
  },
  badge: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: colors.brandPrimary,
    alignItems: "center",
    justifyContent: "center",
  },
  statusPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.sm,
    backgroundColor: colors.brandTertiary,
  },
  statusLabel: {
    fontFamily: fontFamily.textBold,
    fontSize: fontSize.sm,
    color: colors.brandPrimary,
  },
  title: {
    fontFamily: fontFamily.textBold,
    fontSize: 16,
    lineHeight: 21,
    color: colors.onSurface,
  },
  inlineStatus: { alignSelf: "flex-start" },
  subtitle: {
    fontFamily: fontFamily.text,
    fontSize: 12,
    lineHeight: 18,
    color: colors.muted,
    marginTop: 2,
  },
}));

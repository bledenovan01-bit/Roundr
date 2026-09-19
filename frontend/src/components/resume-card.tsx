import { Pressable, Text, View, useWindowDimensions } from "react-native";
import * as Haptics from "expo-haptics";
import MaterialCommunityIcons from "@react-native-vector-icons/material-design-icons";
import { refinedFontFamily as fontFamily } from "@/src/typography-preview";

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
  const { width } = useWindowDimensions();

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    onPress();
  };

  return (
    <Pressable
      testID={testID}
      onPress={handlePress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.left}>
        <View style={styles.badge}>
          <MaterialCommunityIcons
            name="play"
            size={22}
            color={colors.brandPrimary}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text testID={`${testID}-title`} style={[styles.title, width < 360 && styles.titleCompact]}>
            Reprendre la session en cours
          </Text>
          <Text testID={`${testID}-subtitle`} style={styles.subtitle}>
            {modeLabel} · {subtitle}
          </Text>
        </View>
      </View>
      <View style={styles.statusPill}>
        <Text testID={`${testID}-status`} style={styles.statusLabel}>En cours</Text>
      </View>
      <MaterialCommunityIcons
        name="chevron-right"
        size={24}
        color={colors.muted}
      />
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
  titleCompact: { fontSize: 14, lineHeight: 19 },
  subtitle: {
    fontFamily: fontFamily.text,
    fontSize: 12,
    lineHeight: 18,
    color: colors.muted,
    marginTop: 2,
  },
}));

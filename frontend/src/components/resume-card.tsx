import { Pressable, Text, View } from "react-native";
import * as Haptics from "expo-haptics";
import MaterialCommunityIcons from "@react-native-vector-icons/material-design-icons";

import {
  fontFamily,
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
            color={colors.onBrandPrimary}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.eyebrow}>REPRENDRE LA SESSION</Text>
          <Text style={styles.title} numberOfLines={1}>
            {modeLabel}
          </Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        </View>
      </View>
      <MaterialCommunityIcons
        name="arrow-right"
        size={26}
        color={colors.onBrandPrimary}
      />
    </Pressable>
  );
}

const useStyles = makeStyles((colors) => ({
  card: {
    minHeight: 96,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.brandPrimary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    gap: spacing.md,
  },
  pressed: {
    backgroundColor: colors.brandSecondary,
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
    backgroundColor: "rgba(0,0,0,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  eyebrow: {
    fontFamily: fontFamily.textBold,
    fontSize: fontSize.sm,
    color: colors.onBrandPrimary,
    opacity: 0.85,
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  title: {
    fontFamily: fontFamily.display,
    fontSize: fontSize["2xl"],
    color: colors.onBrandPrimary,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  subtitle: {
    fontFamily: fontFamily.text,
    fontSize: fontSize.base,
    color: colors.onBrandPrimary,
    opacity: 0.9,
  },
}));

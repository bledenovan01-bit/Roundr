import { Pressable, Text, View } from "react-native";
import * as Haptics from "@/src/haptics";
import MaterialCommunityIcons from "@react-native-vector-icons/material-design-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import { refinedFontFamily as fontFamily } from "@/src/typography-preview";
import { useScreenLayout } from "@/src/layout";

import {
  makeStyles,
  radius,
  spacing,
  useTheme,
} from "@/src/theme";

type Props = {
  title: string;
  description: string;
  iconName: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  onPress: () => void;
  index?: number;
  testID?: string;
  accent?: string;
  dominant?: boolean;
};

export function ModeCard({
  title,
  description,
  iconName,
  onPress,
  index = 0,
  testID,
  accent,
  dominant,
}: Props) {
  const styles = useStyles();
  const { colors } = useTheme();
  const { compact } = useScreenLayout();

  const handlePress = () => {
    Haptics.selectionAsync().catch(() => {});
    onPress();
  };

  return (
    <Animated.View entering={FadeInDown.delay(index * 60).duration(360)}>
      <Pressable
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={`${title}. ${description}`}
        onPress={handlePress}
        style={({ pressed }) => [
          styles.card,

          pressed && styles.pressed,
        ]}
      >
        <View style={[styles.iconWrap, { backgroundColor: accent ?? colors.brandPrimary }]}>
          <MaterialCommunityIcons
            name={iconName}
            size={24}
            color={colors.onBrandPrimary}
          />
        </View>
        <View style={styles.body}>
          <View style={compact ? styles.compactTitleRow : undefined}>
          <Text testID={`${testID}-title`} style={[styles.title, compact && styles.compactTitle]}>
            {title}
          </Text>
          {compact ? <MaterialCommunityIcons name="chevron-right" size={28} color={colors.muted} /> : null}
          </View>
          <Text testID={`${testID}-description`} style={styles.description}>
            {description}
          </Text>
        </View>
        {!compact ? <MaterialCommunityIcons
          name="chevron-right"
          size={28}
          color={colors.muted}
        /> : null}
      </Pressable>
    </Animated.View>
  );
}

const useStyles = makeStyles((colors) => ({
  card: {
    minHeight: 62,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 18,
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressed: {
    backgroundColor: colors.surfaceTertiary,
    transform: [{ scale: 0.99 }],
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.brandTertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  compactTitleRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  compactTitle: { flex: 1, minWidth: 0 },
  title: {
    fontFamily: fontFamily.textBold,
    color: colors.onSurface,
    fontSize: 14,
    lineHeight: 19,
    letterSpacing: -0.3,
  },
  description: {
    fontFamily: fontFamily.text,
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17,
  },
}));

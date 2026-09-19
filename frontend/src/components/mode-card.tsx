import { Pressable, Text, View } from "react-native";
import * as Haptics from "expo-haptics";
import MaterialCommunityIcons from "@react-native-vector-icons/material-design-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import { refinedFontFamily as fontFamily } from "@/src/typography-preview";

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

  const handlePress = () => {
    Haptics.selectionAsync().catch(() => {});
    onPress();
  };

  return (
    <Animated.View entering={FadeInDown.delay(index * 60).duration(360)}>
      <Pressable
        testID={testID}
        onPress={handlePress}
        style={({ pressed }) => [
          styles.card,
          dominant && { borderColor: colors.brandPrimary, borderWidth: 2, backgroundColor: colors.brandTertiary },
          pressed && styles.pressed,
        ]}
      >
        <View style={[styles.iconWrap, { backgroundColor: accent ?? colors.brandPrimary }]}>
          <MaterialCommunityIcons
            name={iconName}
            size={30}
            color={colors.onBrandPrimary}
          />
        </View>
        <View style={styles.body}>
          <Text testID={`${testID}-title`} style={styles.title} numberOfLines={2}>
            {title}
          </Text>
          <Text testID={`${testID}-description`} style={styles.description} numberOfLines={2}>
            {description}
          </Text>
        </View>
        <MaterialCommunityIcons
          name="chevron-right"
          size={28}
          color={colors.muted}
        />
      </Pressable>
    </Animated.View>
  );
}

const useStyles = makeStyles((colors) => ({
  card: {
    minHeight: 92,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressed: {
    backgroundColor: colors.surfaceTertiary,
    transform: [{ scale: 0.99 }],
  },
  iconWrap: {
    width: 58,
    height: 58,
    borderRadius: radius.md,
    backgroundColor: colors.brandTertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    flex: 1,
    gap: 3,
  },
  title: {
    fontFamily: fontFamily.textBold,
    color: colors.onSurface,
    fontSize: 23,
    lineHeight: 29,
    letterSpacing: -0.3,
  },
  description: {
    fontFamily: fontFamily.text,
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17,
  },
}));

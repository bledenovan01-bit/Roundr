import { Pressable, Text, View } from "react-native";
import * as Haptics from "expo-haptics";
import MaterialCommunityIcons from "@react-native-vector-icons/material-design-icons";
import Animated, { FadeInDown } from "react-native-reanimated";

import {
  fontFamily,
  fontSize,
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
          dominant && { borderColor: colors.brandPrimary, backgroundColor: colors.brandTertiary },
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
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.description} numberOfLines={2}>
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
    minHeight: 84,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.md,
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
    width: 56,
    height: 56,
    borderRadius: radius.md,
    backgroundColor: colors.brandTertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontFamily: fontFamily.textBold,
    color: colors.onSurface,
    fontSize: fontSize.xl,
    lineHeight: fontSize.xl * 1.2,
  },
  description: {
    fontFamily: fontFamily.text,
    color: colors.muted,
    fontSize: fontSize.base,
    lineHeight: fontSize.base * 1.35,
  },
}));

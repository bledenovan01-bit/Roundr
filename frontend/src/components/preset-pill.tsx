import { Pressable, Text, View } from "react-native";
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
  name: string;
  meta: string;
  onPress: () => void;
  testID?: string;
};

export function PresetPill({ name, meta, onPress, testID }: Props) {
  const styles = useStyles();
  const { colors } = useTheme();

  const handlePress = () => {
    Haptics.selectionAsync().catch(() => {});
    onPress();
  };

  return (
    <Pressable
      testID={testID}
      onPress={handlePress}
      style={({ pressed }) => [styles.pill, pressed && styles.pressed]}
    >
      <MaterialCommunityIcons
        name="timer-outline"
        size={20}
        color={colors.brandPrimary}
      />
      <View style={styles.body}>
        <Text testID={`${testID}-name`} style={styles.name} numberOfLines={1}>
          {name}
        </Text>
        <Text testID={`${testID}-meta`} style={styles.meta} numberOfLines={1}>
          {meta}
        </Text>
      </View>
    </Pressable>
  );
}

const useStyles = makeStyles((colors) => ({
  pill: {
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    flexShrink: 0,
  },
  pressed: {
    backgroundColor: colors.surfaceTertiary,
  },
  body: {
    gap: 2,
  },
  name: {
    fontFamily: fontFamily.textBold,
    fontSize: 16,
    lineHeight: 22,
    color: colors.onSurface,
  },
  meta: {
    fontFamily: fontFamily.text,
    fontSize: fontSize.sm,
    color: colors.muted,
  },
}));

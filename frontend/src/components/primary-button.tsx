import { Pressable, Text, View, ActivityIndicator } from "react-native";

import * as Haptics from "@/src/haptics";


import {
  fontFamily,
  control,
  makeStyles,
  spacing,
  useTheme,
} from "@/src/theme";

type Variant = "primary" | "secondary" | "ghost";

type Props = {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  testID?: string;
  leadingIcon?: React.ReactNode;
};

export function PrimaryButton({
  label,
  onPress,
  variant = "primary",
  disabled,
  loading,
  testID,
  leadingIcon,
}: Props) {
  const styles = useStyles();
  const { colors } = useTheme();


  const handlePress = () => {
    if (disabled || loading) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onPress?.();
  };

  const bgByVariant = {
    primary: styles.bgPrimary,
    secondary: styles.bgSecondary,
    ghost: styles.bgGhost,
  }[variant];

  const textByVariant = {
    primary: styles.textPrimary,
    secondary: styles.textSecondary,
    ghost: styles.textGhost,
  }[variant];

  const spinnerColor =
    variant === "primary" ? colors.onBrandPrimary : colors.onSurface;

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!(disabled || loading), busy: !!loading }}
      aria-disabled={!!(disabled || loading)}
      aria-busy={!!loading}
      onPress={handlePress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        bgByVariant,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={spinnerColor} />
      ) : (
        <View style={styles.inner}>
          {leadingIcon}
          <Text testID={`${testID}-label`} style={[styles.label, textByVariant]}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}

const useStyles = makeStyles((colors) => ({
  base: {
    minHeight: control.button,
    borderRadius: 15,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    maxWidth: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  inner: {
    maxWidth: "100%",
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  bgPrimary: {
    backgroundColor: colors.brandPrimary,
  },
  bgSecondary: {
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  bgGhost: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  disabled: {
    opacity: 0.4,
  },
  label: {
    flexShrink: 1,
    minWidth: 0,
    textAlign: "center",
    fontFamily: fontFamily.textBold,
    fontSize: 13,
    letterSpacing: 0,
  },
  textPrimary: {
    color: colors.onBrandPrimary,
  },
  textSecondary: {
    color: colors.onSurface,
  },
  textGhost: {
    color: colors.onSurface,
  },
}));

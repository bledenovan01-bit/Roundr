import { Pressable, Text, useWindowDimensions, type AccessibilityState } from "react-native";
import { lovable as c, withAlpha } from "@/src/visual/lovable";
import { MatchIcon, pressedControl, type MatchIconName } from "./match-ui";

/** Tone of a command in the match bar. */
export type MatchBarTone = "neutral" | "danger" | "primary" | "active" | "warning";

/** Sizes shared by every button of the match bar, so the row never wraps. */
export function useMatchBarMetrics(landscape: boolean) {
  const { width } = useWindowDimensions();
  const narrow = !landscape && width < 360;
  return {
    narrow,
    height: landscape ? 48 : 60,
    /** Square icon-only buttons (lock, sleep): never below a 44 pt target. */
    iconWidth: landscape ? 52 : narrow ? 44 : 48,
    gap: narrow ? 4 : 8,
    fontSize: narrow ? 11.5 : 13,
  };
}

function tones(tone: MatchBarTone) {
  switch (tone) {
    case "primary":
      return { bg: c.primary, border: c.primary, fg: c.onPrimary };
    case "danger":
      return { bg: c.dangerSurface, border: c.dangerBorder, fg: c.dangerText };
    case "active":
      return { bg: withAlpha(c.primary, 0.12), border: c.primary, fg: c.primary };
    case "warning":
      return { bg: withAlpha(c.amber, 0.14), border: c.amber, fg: c.amber };
    default:
      return { bg: c.cardRaised, border: c.border, fg: c.foreground };
  }
}

/**
 * One command of the match bar. Without `label` it is a square icon-only
 * button (lock, sleep), whose name is given to screen readers only.
 */
export function MatchBarButton({
  icon,
  label,
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole = "button",
  checked,
  onPress,
  disabled = false,
  tone = "neutral",
  landscape,
  testID,
}: {
  icon: MatchIconName;
  label?: string;
  accessibilityLabel: string;
  accessibilityHint?: string;
  accessibilityRole?: "button" | "switch";
  checked?: boolean;
  onPress: () => void;
  disabled?: boolean;
  tone?: MatchBarTone;
  landscape: boolean;
  testID?: string;
}) {
  const metrics = useMatchBarMetrics(landscape);
  const { bg, border, fg } = tones(tone);
  const state: AccessibilityState = { disabled };
  if (checked !== undefined) state.checked = checked;
  return (
    <Pressable
      testID={testID}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={state}
      aria-checked={checked}
      disabled={disabled}
      onPress={onPress}
      hitSlop={4}
      style={({ pressed }) => [
        {
          height: metrics.height,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: border,
          backgroundColor: bg,
          opacity: disabled ? 0.45 : 1,
          alignItems: "center",
          justifyContent: "center",
          flexDirection: landscape ? "row" : "column",
          gap: landscape ? 6 : 3,
          paddingHorizontal: label ? (metrics.narrow ? 1 : 4) : 0,
          minWidth: label ? (metrics.narrow ? 44 : 52) : metrics.iconWidth,
        },
        !label
          ? { width: metrics.iconWidth, flexShrink: 0 }
          : tone === "primary"
            // The main command takes the rest of the row: its width never
            // depends on its label, so Pause and Reprendre stay in place.
            ? { flexGrow: 1, flexShrink: 1, flexBasis: 0 }
            // Fin and Relancer keep their whole label and share a little of the rest.
            : { flexGrow: 0.1, flexShrink: 0, flexBasis: "auto" },
        pressed && !disabled && pressedControl,
      ]}
    >
      <MatchIcon name={icon} size={label ? 20 : 22} color={fg} />
      {label ? (
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.8}
          maxFontSizeMultiplier={1.15}
          style={{
            fontFamily: tone === "primary" ? "ManropeRefined-ExtraBold" : "ManropeRefined-Bold",
            fontSize: metrics.fontSize,
            lineHeight: metrics.fontSize + 3,
            color: fg,
            textAlign: "center",
          }}
        >
          {label}
        </Text>
      ) : null}
    </Pressable>
  );
}

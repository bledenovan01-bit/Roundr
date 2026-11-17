import { Pressable, Text } from "react-native";
import { lovable as c, withAlpha } from "@/src/visual/lovable";
import { setPreferences, usePreferences } from "@/src/store/preferences";
import { keepAwakeLabel } from "@/src/features/keep-awake-control";
import { MatchIcon } from "./match-ui";
import { MatchBarButton } from "./match-bar";

/**
 * "Écran" button of the chrono command bars. It reads and writes the same
 * keepAwake preference as Settings, so both always show the same state; the
 * existing runtime hooks keep acquiring and releasing the screen lock.
 */
export function KeepAwakeControl({
  landscape,
  height,
  disabled = false,
  testID = "keep-awake-toggle",
  compact = false,
}: {
  landscape: boolean;
  height: number;
  disabled?: boolean;
  testID?: string;
  /** Icon only, for the match bar: moon = sleep allowed, sun = screen kept on. */
  compact?: boolean;
}) {
  const on = usePreferences().keepAwake;
  if (compact)
    return (
      <MatchBarButton
        testID={testID}
        landscape={landscape}
        icon={on ? "sun" : "moon"}
        tone={on ? "active" : "neutral"}
        accessibilityRole="switch"
        accessibilityLabel="Maintenir l’écran allumé"
        accessibilityHint={keepAwakeLabel(on).hint}
        checked={on}
        disabled={disabled}
        onPress={() => {
          void setPreferences({ keepAwake: !on });
        }}
      />
    );
  const tint = on ? c.primary : c.foreground;
  return (
    <Pressable
      testID={testID}
      accessibilityRole="switch"
      accessibilityLabel="Maintenir l’écran allumé"
      accessibilityHint={keepAwakeLabel(on).hint}
      accessibilityState={{ checked: on, disabled }}
      aria-checked={on}
      disabled={disabled}
      onPress={() => {
        void setPreferences({ keepAwake: !on });
      }}
      style={({ pressed }) => ({
        // Fixed and compact so the existing commands keep their width.
        width: landscape ? 132 : 84,
        flexShrink: 0,
        height,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: on ? c.primary : c.border,
        backgroundColor: on ? withAlpha(c.primary, 0.12) : c.cardRaised,
        opacity: disabled ? 0.5 : pressed ? 0.9 : 1,
        alignItems: "center",
        justifyContent: "center",
        flexDirection: landscape ? "row" : "column",
        gap: landscape ? 6 : 4,
        paddingHorizontal: 4,
      })}
    >
      <MatchIcon name={on ? "lock" : "unlock"} color={tint} />
      <Text
        numberOfLines={2}
        adjustsFontSizeToFit
        style={{
          fontFamily: "ManropeRefined-Bold",
          fontSize: 13,
          lineHeight: 15,
          textAlign: "center",
          color: tint,
        }}
      >
        {keepAwakeLabel(on).text}
      </Text>
    </Pressable>
  );
}

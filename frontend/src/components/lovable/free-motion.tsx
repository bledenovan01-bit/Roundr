import { freeTransition } from "@/src/features/free-live-state";
import { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Animated, Platform } from "react-native";
import type { FreeTimerState } from "@/src/domain/free-timer";
import { lovable as c, lovableFont as f } from "@/src/visual/lovable";
// Visual feedback only. Neither animation changes time, score or storage.
export function FreeTransitionFlash({ timer }: { timer: FreeTimerState }) {
  const previous = useRef(timer),
    [opacity] = useState(() => new Animated.Value(0));
  useEffect(() => {
    const before = previous.current;
    previous.current = timer;
    const changed = freeTransition(before, timer);
    if (!changed) return;
    let cancelled = false;
    let animation: Animated.CompositeAnimation | undefined;
    void AccessibilityInfo.isReduceMotionEnabled()
      .then((reduced) => {
        if (reduced || cancelled) return;
        opacity.setValue(1);
        animation = Animated.sequence([
          Animated.delay(480),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 720,
            useNativeDriver: Platform.OS !== "web",
          }),
        ]);
        animation.start();
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      animation?.stop();
      opacity.setValue(0);
    };
  }, [timer, opacity]);
  return (
    <Animated.View
      pointerEvents="none"
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 5,
        borderWidth: 4,
        borderColor: c.primary,
        opacity,
      }}
    />
  );
}

export function FreeScore({ value, size }: { value: number; size: number }) {
  const previous = useRef(value),
    [scale] = useState(() => new Animated.Value(1));
  useEffect(() => {
    const changed = previous.current !== value;
    previous.current = value;
    if (!changed) return;
    let cancelled = false;
    let animation: Animated.CompositeAnimation | undefined;
    void AccessibilityInfo.isReduceMotionEnabled()
      .then((reduced) => {
        if (reduced || cancelled) return;
        scale.setValue(1.15);
        animation = Animated.timing(scale, {
          toValue: 1,
          duration: 350,
          useNativeDriver: Platform.OS !== "web",
        });
        animation.start();
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      animation?.stop();
      scale.setValue(1);
    };
  }, [value, scale]);
  return (
    <Animated.Text
      accessibilityLiveRegion="polite"
      style={{
        fontFamily: f.extrabold,
        fontSize: size,
        lineHeight: size * 1.5,
        color: c.foreground,
        fontVariant: ["tabular-nums"],
        transform: [{ scale }],
      }}
    >
      {value}
    </Animated.Text>
  );
}

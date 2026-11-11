import { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Animated } from "react-native";
import { usePanGesture } from "react-native-gesture-handler";
import {
  SWIPE_ACTIVATION_X,
  SWIPE_FAIL_Y,
  recentSwipe,
  swipeDrag,
  swipeTarget,
} from "@/src/features/carousel-swipe";

/**
 * Horizontal swipe between carousel views. The content follows the finger,
 * then settles on the chosen view with the existing 350 ms slide. Uses the
 * native gesture handler so a horizontal drag is not taken over by the
 * vertical page scroll on iOS, while vertical drags still scroll the page.
 */
export function useSwipeCarousel({
  page,
  count,
  width,
  enabled,
  onSelect,
  onSwipeActivity,
}: {
  page: number;
  count: number;
  width: number;
  enabled: boolean;
  onSelect: (index: number) => void;
  /** Called when a swipe starts and ends (lets a parent ignore its tap). */
  onSwipeActivity?: () => void;
}) {
  const [offset] = useState(() => new Animated.Value(0));
  const [reduceMotion, setReduceMotion] = useState(false);
  // Gesture callbacks read the latest layout and page without re-creating
  // the gesture on every render.
  const latest = useRef({ page, count, width, onSelect, reduceMotion });
  useEffect(() => {
    latest.current = { page, count, width, onSelect, reduceMotion };
  });
  useEffect(() => {
    let active = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((value) => {
      if (active) setReduceMotion(value);
    });
    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReduceMotion,
    );
    return () => {
      active = false;
      subscription.remove();
    };
  }, []);
  // A restored session opens directly on its saved view: the first placement,
  // once the width is known, is not animated.
  const placed = useRef(false);
  useEffect(() => {
    if (!placed.current) {
      if (width <= 0) return;
      placed.current = true;
      offset.setValue(-width * page);
      return;
    }
    const animation = Animated.timing(offset, {
      toValue: -width * page,
      duration: reduceMotion ? 0 : 350,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [offset, width, page, reduceMotion]);
  // Time of the last swipe, so a tap released at the end of a drag is not
  // also taken as a tap on the clock underneath.
  const lastSwipe = useRef(0);
  const gesture = usePanGesture({
    enabled: enabled && count > 1 && width > 0,
    runOnJS: true,
    activeOffsetX: [-SWIPE_ACTIVATION_X, SWIPE_ACTIVATION_X],
    failOffsetY: [-SWIPE_FAIL_Y, SWIPE_FAIL_Y],
    onActivate: () => {
      lastSwipe.current = Date.now();
      onSwipeActivity?.();
    },
    onUpdate: (event) => {
      const s = latest.current;
      offset.setValue(
        -s.width * s.page + swipeDrag(event.translationX, s.page, s.count, s.width),
      );
    },
    onDeactivate: (event) => {
      lastSwipe.current = Date.now();
      onSwipeActivity?.();
      const s = latest.current;
      const target = event.canceled
        ? s.page
        : swipeTarget(s.page, s.count, event.translationX, event.velocityX, s.width);
      if (target !== s.page) s.onSelect(target);
      else
        Animated.timing(offset, {
          toValue: -s.width * s.page,
          duration: s.reduceMotion ? 0 : 220,
          useNativeDriver: true,
        }).start();
    },
  });
  /** True just after a swipe: ignore the tap that ends it. */
  const justSwiped = () => recentSwipe(lastSwipe.current, Date.now());
  return { offset, gesture, justSwiped };
}

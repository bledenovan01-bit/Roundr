import {
  SWIPE_ACTIVATION_X,
  SWIPE_FAIL_Y,
  SWIPE_TAP_GUARD_MS,
  recentSwipe,
  swipeDrag,
  swipeTarget,
  swipeThreshold,
} from "../src/features/carousel-swipe";
import {
  WHEEL_ITEM_HEIGHT,
  spokenDuration,
  wheelClamp,
  wheelIndex,
  wheelOffset,
  wheelValues,
} from "../src/features/duration-wheel";
import { countdownWheelColumns } from "../src/features/countdown-wheel";
import { keepAwakeLabel } from "../src/features/keep-awake-control";

const builtin = (
  process as unknown as { getBuiltinModule: (id: string) => any }
).getBuiltinModule;
const assert = builtin("assert/strict"),
  fs = builtin("fs"),
  path = builtin("path");
const root = path.join(path.dirname(process.argv[1]), "..");
const source = (file: string): string => fs.readFileSync(path.join(root, file), "utf8");

// 1. Carousel swipe: one view at a time, never past the ends.
assert.equal(swipeThreshold(350), 70);
assert.equal(swipeThreshold(120), 40);
assert.equal(swipeThreshold(800), 80);
assert.equal(swipeTarget(0, 3, -80, 0, 350), 1, "left swipe shows next view");
assert.equal(swipeTarget(1, 3, 80, 0, 350), 0, "right swipe shows previous view");
assert.equal(swipeTarget(0, 3, 80, 0, 350), 0, "no view before the first");
assert.equal(swipeTarget(2, 3, -300, -2000, 350), 2, "no view after the last");
assert.equal(swipeTarget(1, 3, -400, -3000, 350), 2, "a long flick moves one view only");
assert.equal(swipeTarget(1, 3, -30, 0, 350), 1, "short slow drag snaps back");
assert.equal(swipeTarget(1, 3, -30, -900, 350), 2, "short fast flick changes view");
assert.equal(swipeTarget(1, 3, 30, -900, 350), 1, "flick against the drag is ignored");
assert.equal(swipeTarget(5, 3, 0, 0, 350), 2, "out-of-range page is clamped");
assert.equal(swipeTarget(0, 0, -80, 0, 350), 0);
assert.equal(swipeDrag(-100, 1, 3, 350), -100, "content follows the finger");
assert.equal(swipeDrag(-500, 1, 3, 350), -350, "never more than one view");
assert.equal(swipeDrag(90, 0, 3, 350), 30, "resistance before the first view");
assert.equal(swipeDrag(-90, 2, 3, 350), -30, "resistance after the last view");
assert.equal(swipeDrag(-90, 0, 1, 350), 0, "single view does not move");
assert.equal(swipeDrag(Number.NaN, 1, 3, 350), 0);
assert.ok(SWIPE_ACTIVATION_X > 0 && SWIPE_FAIL_Y > SWIPE_ACTIVATION_X, "vertical scroll stays possible");

// Both carousels use the shared native gesture, with commands locked when needed.
const matchUi = source("src/components/lovable/match-ui.tsx");
const freeClock = source("src/components/lovable/free-clock.tsx");
const freeLive = source("src/features/lovable-free-live.tsx");
assert.match(matchUi, /useSwipeCarousel\(\{[\s\S]*enabled: !locked/);
assert.match(matchUi, /<GestureDetector gesture=\{gesture\}>/);
assert.doesNotMatch(matchUi, /PanResponder/);
assert.match(freeClock, /useSwipeCarousel\(/);
assert.match(freeLive, /swipeEnabled=\{!locked\}/);
assert.doesNotMatch(freeLive, /PanResponder/);
// A swipe over the clock must not also toggle remaining/elapsed or open the giant clock.
assert.equal(recentSwipe(0, 100), false, "no swipe yet");
assert.equal(recentSwipe(1000, 1000 + SWIPE_TAP_GUARD_MS - 1), true);
assert.equal(recentSwipe(1000, 1000 + SWIPE_TAP_GUARD_MS), false);
assert.equal(recentSwipe(2000, 1000), false, "clock going backwards is ignored");
assert.match(matchUi, /projection\.canToggle && !justSwiped\(\)/);
assert.match(matchUi, /if \(!justSwiped\(\)\) onGiant\(\);/);
assert.match(freeLive, /if \(recentSwipe\(swipedAt\.current, Date\.now\(\)\)\) return;/);

// 2. Keep-awake button: the same preference as Settings, in both command bars.
const control = source("src/components/lovable/keep-awake-control.tsx");
assert.match(control, /usePreferences\(\)\.keepAwake/);
assert.match(control, /setPreferences\(\{ keepAwake: !on \}\)/);
assert.match(control, /accessibilityRole="switch"/);
assert.match(source("src/features/lovable-match.tsx"), /<KeepAwakeControl[\s\S]*disabled=\{locked\}/);
assert.match(freeLive, /<KeepAwakeControl[\s\S]*disabled=\{locked\}/);
assert.match(source("src/features/lovable-settings.tsx"), /setPreferences\(\{ keepAwake \}\)/, "Settings still writes the same preference");
assert.equal(keepAwakeLabel(true).text, "Écran");
assert.notEqual(keepAwakeLabel(true).hint, keepAwakeLabel(false).hint);
// Screen-lock runtime is unchanged: it still follows the preference.
assert.match(source("src/components/session-runtime.tsx"), /const awake=!!running&&p\.keepAwake;/);
assert.match(source("src/components/free-timer-runtime.ts"), /useRuntimeKeepAwake\(running && prefs\.keepAwake, "roundr-free"\)/);

// 3. Duration wheels: same limits as the former steppers.
assert.deepEqual(wheelValues(0, 3), [0, 1, 2, 3]);
assert.equal(wheelValues(0, 59).length, 60);
assert.equal(wheelIndex(0, 60), 0);
assert.equal(wheelIndex(WHEEL_ITEM_HEIGHT * 7 + 10, 60), 7, "nearest row");
assert.equal(wheelIndex(WHEEL_ITEM_HEIGHT * 7 + 20, 60), 8);
assert.equal(wheelIndex(-50, 60), 0, "bounce above the top");
assert.equal(wheelIndex(WHEEL_ITEM_HEIGHT * 100, 60), 59, "bounce below the bottom");
assert.equal(wheelIndex(Number.NaN, 60), 0);
assert.equal(wheelOffset(7), WHEEL_ITEM_HEIGHT * 7);
for (let i = 0; i < 60; i++) assert.equal(wheelIndex(wheelOffset(i), 60), i);
assert.equal(wheelClamp(75, 0, 59), 59);
assert.equal(wheelClamp(-3, 0, 59), 0);
assert.equal(wheelClamp(12.8, 0, 59), 12);
assert.deepEqual(
  countdownWheelColumns.map(([key, , , max]) => [key, max]),
  [["h", 23], ["m", 59], ["s", 59]],
);
assert.equal(spokenDuration(0, 1, 30), "1 minute 30 secondes");
assert.equal(spokenDuration(2, 0, 0), "2 heures");
assert.equal(spokenDuration(0, 0, 0), "0 seconde");
const freeConfig = source("src/features/lovable-free-config.tsx");
assert.match(freeConfig, /<DurationWheel[\s\S]*set\(\{ cd: \{ \.\.\.d\.cd, \[key\]: n \} \}\)/, "wheel writes the same draft fields");
assert.match(freeConfig, /<DurationChips/, "quick duration chips are kept");

console.log("✓ UX: carousel swipe, keep-awake button and duration wheels");

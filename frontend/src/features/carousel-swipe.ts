// Pure rules for swiping between carousel views. The gesture itself lives in
// use-swipe-carousel.ts; keeping the decisions here makes them testable.

/** Horizontal travel (pt) before the swipe takes over from taps. */
export const SWIPE_ACTIVATION_X = 12;
/** Vertical travel (pt) that hands the touch back to the page scroll. */
export const SWIPE_FAIL_Y = 14;
/** Flick speed (pt/s) that changes view even on a short drag. */
export const SWIPE_FLICK_VELOCITY = 500;

/** Distance the content follows the finger, with resistance past the ends. */
export function swipeDrag(dx: number, page: number, count: number, width: number) {
  if (!Number.isFinite(dx) || count < 2) return 0;
  const pastStart = page <= 0 && dx > 0,
    pastEnd = page >= count - 1 && dx < 0;
  if (pastStart || pastEnd) return dx / 3;
  const limit = Math.max(width, 0);
  return Math.max(-limit, Math.min(limit, dx));
}

/** Distance needed to change view: a fifth of the width, bounded. */
export function swipeThreshold(width: number) {
  return Math.min(80, Math.max(40, width * 0.2));
}

/** Time (ms) after a swipe during which a tap is ignored. */
export const SWIPE_TAP_GUARD_MS = 450;

/** Whether a tap at `now` belongs to the swipe that ended at `swipedAt`. */
export function recentSwipe(swipedAt: number, now: number) {
  return swipedAt > 0 && now - swipedAt >= 0 && now - swipedAt < SWIPE_TAP_GUARD_MS;
}

/** View to show once the finger is lifted. Always one step at most. */
export function swipeTarget(
  page: number,
  count: number,
  dx: number,
  velocityX: number,
  width: number,
) {
  if (count < 1) return 0;
  const current = Math.max(0, Math.min(count - 1, page));
  const threshold = swipeThreshold(width);
  let step = 0;
  if (dx <= -threshold || (dx < 0 && velocityX <= -SWIPE_FLICK_VELOCITY)) step = 1;
  else if (dx >= threshold || (dx > 0 && velocityX >= SWIPE_FLICK_VELOCITY)) step = -1;
  return Math.max(0, Math.min(count - 1, current + step));
}

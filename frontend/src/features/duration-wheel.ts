// Pure helpers for the iPhone-style duration wheels.

/** Height of one row of a wheel, in points. */
export const WHEEL_ITEM_HEIGHT = 36;
/** Rows visible in a wheel; odd so that one row sits in the middle. */
export const WHEEL_VISIBLE_ROWS = 5;

/** Values offered by a wheel column, from min to max inclusive. */
export function wheelValues(min: number, max: number) {
  const low = Math.ceil(Math.min(min, max)),
    high = Math.floor(Math.max(min, max));
  return Array.from({ length: high - low + 1 }, (_, i) => low + i);
}

/** Index of the row centred for a scroll offset, kept inside the column. */
export function wheelIndex(offsetY: number, count: number, itemHeight = WHEEL_ITEM_HEIGHT) {
  if (count <= 0 || !Number.isFinite(offsetY)) return 0;
  return Math.max(0, Math.min(count - 1, Math.round(offsetY / itemHeight)));
}

/** Scroll offset that centres a given row. */
export function wheelOffset(index: number, itemHeight = WHEEL_ITEM_HEIGHT) {
  return Math.max(0, index) * itemHeight;
}

/** Value shown for a stored number: clamped, and never a value off the wheel. */
export function wheelClamp(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, Math.trunc(value)));
}

/** Spoken value of the whole countdown duration, for VoiceOver. */
export function spokenDuration(h: number, m: number, s: number) {
  const parts: string[] = [];
  if (h) parts.push(`${h} heure${h > 1 ? "s" : ""}`);
  if (m) parts.push(`${m} minute${m > 1 ? "s" : ""}`);
  if (s || !parts.length) parts.push(`${s} seconde${s > 1 ? "s" : ""}`);
  return parts.join(" ");
}

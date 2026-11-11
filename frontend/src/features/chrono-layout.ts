// Presentation only: how much room the clock takes on a given screen.
// Never reads or changes time, score, session or storage.
//
// The Lovable sizes are the minimum. In portrait, when the screen leaves
// unused height under the clock card, the card grows into it (up to a limit)
// and the readout grows with it. Landscape and two-column layouts keep the
// reference sizes unchanged.

/** Dots row (24) + bottom padding (12) + borders (2) of the match carousel. */
export const MATCH_CAROUSEL_CHROME = 38;
/** Tabs (46) + dots (24) + status line (21) + bottom padding (12) + borders (2). */
export const FREE_CAROUSEL_CHROME = 105;
/** Above this text size the card keeps its reference height (labels may wrap). */
export const CLOCK_FILL_MAX_FONT_SCALE = 1.15;

const MATCH_MAX_GROWTH = 160;
const FREE_MAX_GROWTH = 220;
/** Horizontal padding of a clock page (22 on each side). */
const PAGE_PADDING = 44;

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));
const growth = (fill: number | undefined, base: number, max: number) =>
  fill === undefined || !Number.isFinite(fill) ? 0 : clamp(Math.floor(fill - base), 0, max);
/** A dial grows with the card but never wider than its page. */
const dial = (base: number, grow: number, pageWidth: number) =>
  pageWidth > 0 ? Math.max(base, Math.min(base + grow, pageWidth - PAGE_PADDING)) : base;

export function matchClockLayout({
  landscape,
  screenHeight,
  fill,
  pageWidth = 0,
}: {
  landscape: boolean;
  screenHeight: number;
  /** Height offered to the whole carousel card, when it may grow. */
  fill?: number;
  pageWidth?: number;
}) {
  const baseSlide = landscape ? 170 : screenHeight < 620 ? 164 : screenHeight < 720 ? 196 : 232;
  const baseDial = landscape ? 126 : screenHeight < 620 ? 122 : screenHeight < 720 ? 146 : 174;
  const baseDigits = landscape ? 34 : screenHeight < 720 ? 38 : 44;
  const baseRingDigits = landscape ? 26 : screenHeight < 620 ? 25 : screenHeight < 720 ? 30 : 36;
  const grow = landscape ? 0 : growth(fill, baseSlide + MATCH_CAROUSEL_CHROME, MATCH_MAX_GROWTH);
  const dialSize = dial(baseDial, grow, pageWidth);
  const scale = dialSize / baseDial;
  return {
    baseSlide,
    grow,
    slideHeight: baseSlide + grow,
    dialSize,
    digitsSize: Math.round(Math.min(68, baseDigits + grow * 0.18)),
    ringDigitsSize: Math.round(baseRingDigits * scale),
    ringLabelScale: Math.min(1.3, scale),
    gap: Math.round((landscape || screenHeight < 620 ? 8 : 14) + grow * 0.06),
  };
}

export function freeClockLayout({
  landscape,
  screenHeight,
  fill,
}: {
  landscape: boolean;
  screenHeight: number;
  fill?: number;
}) {
  const baseClock = landscape ? 128 : screenHeight <= 720 ? 196 : 220;
  const grow = landscape ? 0 : growth(fill, baseClock + FREE_CAROUSEL_CHROME, FREE_MAX_GROWTH);
  return { baseClock, grow, clockHeight: baseClock + grow };
}

/** Sizes of the three free clock faces for a given growth of their card. */
export function freeFaceLayout({
  landscape,
  screenWidth,
  screenHeight,
  grow = 0,
  pageWidth = 0,
}: {
  landscape: boolean;
  screenWidth: number;
  screenHeight: number;
  grow?: number;
  pageWidth?: number;
}) {
  const short = !landscape && screenHeight <= 720;
  const g = landscape ? 0 : Math.max(0, grow);
  const baseDigits = landscape ? 40 : screenWidth <= 340 ? 42 : 48;
  const baseCircular = landscape ? 104 : screenHeight < 620 ? 122 : short ? 146 : 174;
  const baseAnalog = landscape ? 120 : short ? 160 : screenWidth <= 340 ? 164 : 186;
  const circular = dial(baseCircular, g, pageWidth);
  const circularScale = circular / baseCircular;
  return {
    digitsSize: Math.round(Math.min(76, baseDigits + g * 0.16)),
    gap: Math.round(16 + g * 0.06),
    circularSize: circular,
    circularDigitsSize: Math.round((landscape ? 24 : 36) * circularScale),
    circularLabelScale: Math.min(1.3, circularScale),
    analogSize: dial(baseAnalog, g, pageWidth),
  };
}

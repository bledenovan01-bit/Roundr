import {
  FREE_CAROUSEL_CHROME,
  MATCH_CAROUSEL_CHROME,
  freeClockLayout,
  freeFaceLayout,
  matchClockLayout,
} from "../src/features/chrono-layout";

const builtin = (
  process as unknown as { getBuiltinModule: (id: string) => any }
).getBuiltinModule;
const assert = builtin("assert/strict"),
  fs = builtin("fs"),
  path = builtin("path");
const root = path.join(path.dirname(process.argv[1]), "..");
const source = (file: string): string => fs.readFileSync(path.join(root, file), "utf8");

// 1. Without spare height the Lovable reference sizes are untouched.
for (const [screenHeight, slide, dial, digits, ring] of [
  [568, 164, 122, 38, 25],
  [667, 196, 146, 38, 30],
  [852, 232, 174, 44, 36],
] as const) {
  for (const fill of [undefined, 0, slide + MATCH_CAROUSEL_CHROME, Number.NaN]) {
    const l = matchClockLayout({ landscape: false, screenHeight, fill, pageWidth: 348 });
    assert.deepEqual(
      [l.slideHeight, l.dialSize, l.digitsSize, l.ringDigitsSize, l.grow],
      [slide, dial, digits, ring, 0],
      `reference match sizes at ${screenHeight}`,
    );
  }
}

// 2. Landscape never grows, whatever height is offered.
const land = matchClockLayout({ landscape: true, screenHeight: 390, fill: 900, pageWidth: 400 });
assert.deepEqual([land.slideHeight, land.dialSize, land.digitsSize, land.ringDigitsSize], [170, 126, 34, 26]);
assert.equal(freeClockLayout({ landscape: true, screenHeight: 390, fill: 900 }).clockHeight, 128);
assert.equal(freeFaceLayout({ landscape: true, screenWidth: 844, screenHeight: 390, grow: 200, pageWidth: 400 }).analogSize, 120);

// 3. Portrait: the card takes the spare height, the readout grows with it.
const tall = matchClockLayout({ landscape: false, screenHeight: 852, fill: 232 + MATCH_CAROUSEL_CHROME + 80, pageWidth: 348 });
assert.equal(tall.slideHeight, 312);
assert.equal(tall.dialSize, 254);
assert.ok(tall.digitsSize > 44 && tall.ringDigitsSize > 36, "readout grows with the card");
assert.ok(tall.dialSize + 58 <= tall.slideHeight, "the dial keeps its margins inside the card");

// 4. Growth is capped: the clock gets its fair share, not the whole screen.
const huge = matchClockLayout({ landscape: false, screenHeight: 1200, fill: 2000, pageWidth: 348 });
assert.equal(huge.slideHeight, 232 + 160);
assert.ok(huge.digitsSize <= 68);
assert.ok(huge.dialSize <= 348 - 44, "a dial never exceeds its page width");
const free = freeClockLayout({ landscape: false, screenHeight: 932, fill: 2000 });
assert.equal(free.clockHeight, 220 + 220);
const face = freeFaceLayout({ landscape: false, screenWidth: 430, screenHeight: 932, grow: free.grow, pageWidth: 388 });
assert.ok(face.digitsSize <= 76 && face.digitsSize > 48);
assert.ok(face.analogSize <= 388 - 44 && face.circularSize <= 388 - 44);
// Analogue face: dial + label (19.5) + top padding (16) still fits the card.
assert.ok(face.analogSize + 36 <= free.clockHeight);

// 5. Free clock reference sizes without spare height.
assert.equal(freeClockLayout({ landscape: false, screenHeight: 852 }).clockHeight, 220);
assert.equal(freeClockLayout({ landscape: false, screenHeight: 667, fill: 196 + FREE_CAROUSEL_CHROME }).clockHeight, 196);
const baseFace = freeFaceLayout({ landscape: false, screenWidth: 390, screenHeight: 852 });
assert.deepEqual(
  [baseFace.digitsSize, baseFace.circularSize, baseFace.circularDigitsSize, baseFace.analogSize, baseFace.gap],
  [48, 174, 36, 186, 16],
);
assert.equal(freeFaceLayout({ landscape: false, screenWidth: 320, screenHeight: 568 }).digitsSize, 42);

// 6. A narrow page limits the dial but never shrinks it below the reference.
assert.equal(matchClockLayout({ landscape: false, screenHeight: 852, fill: 600, pageWidth: 200 }).dialSize, 174);

// 7. Layout only: the module and its call sites never touch time or sessions.
const layout = source("src/features/chrono-layout.ts");
assert.doesNotMatch(layout, /from "@\/src\/(chrono|domain|store)/);
const match = source("src/features/lovable-match.tsx");
const freeLive = source("src/features/lovable-free-live.tsx");
assert.match(match, /fillClock = !two && !landscape && fontScale <= CLOCK_FILL_MAX_FONT_SCALE/);
assert.match(freeLive, /fillClock = !two && !land && fontScale <= CLOCK_FILL_MAX_FONT_SCALE/);
// The carousel stays manual: no timer or effect selects a view.
const matchUi = source("src/components/lovable/match-ui.tsx");
assert.doesNotMatch(matchUi, /setInterval|setTimeout/);

console.log("✓ Chrono layout: reference sizes kept, portrait growth capped, landscape unchanged");

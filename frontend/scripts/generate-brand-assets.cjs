// Rasterises the validated page-1 logo geometry. Does not re-encode the pitch photo.
// Usage: NODE_PATH=<isolated tools> node scripts/generate-brand-assets.cjs <Manrope ExtraBold.ttf> <images dir>
const sharp = require("sharp"), opentype = require("opentype.js"), fs = require("fs"), path = require("path");
const [fontFile, outDir] = process.argv.slice(2);
const geometry = require("../assets/images/logo-geometry.json");
const INK = "#020909", PAPER = "#edf3f0", BALL = "#6ce182";
const font = opentype.loadSync(fontFile);

// Same panel paths and proportions as RoundrBall, extracted from the validated PDF.
function ball(cx, cy, r) {
  const paths = geometry.paths.map(p => '<path d="'+p.d+'" fill="'+(p.stroke?'none':INK)+'" stroke="'+(p.stroke?INK:'none')+'" stroke-width="'+geometry.seamWidth+'"/>').join('');
  return '<g transform="translate('+(cx-r)+','+(cy-r)+') scale('+(r/50)+')"><defs><clipPath id="ball"><circle cx="50" cy="50" r="50"/></clipPath></defs><circle cx="50" cy="50" r="50" fill="'+BALL+'"/><g clip-path="url(#ball)">'+paths+'</g><circle cx="50" cy="50" r="'+(50-geometry.rimWidth/2)+'" fill="none" stroke="'+BALL+'" stroke-width="'+geometry.rimWidth+'"/></g>';
}
// Text as outlines, so no font needs to be installed to rasterise.
function word(text, size, x, baseline, fill) {
  const p = font.getPath(text, x, baseline, size, { letterSpacing: geometry.letterSpacingEm });
  const b = p.getBoundingBox();
  return { svg: `<path d="${p.toPathData(2)}" fill="${fill}"/>`, box: b };
}
function logo({ text, size, fill, pad = 0 }) {
  const w = word(text, size, 0, 0, fill);
  const r = size * (text === "r" ? geometry.iconBallRadiusPerSize : geometry.wordBallRadiusPerSize);
  const gap = size * (text === "r" ? geometry.iconGapPerSize : geometry.wordGapPerSize);
  const width = font.getAdvanceWidth(text, size) - w.box.x1 + gap + 2 * r, height = w.box.y2 - w.box.y1;
  const ox = pad - w.box.x1, oy = pad - w.box.y1;
  const bx = font.getAdvanceWidth(text, size) + gap + r, by = -r;       // the ball sits on the baseline, like a full stop
  return { width: width + 2 * pad, height: height + 2 * pad, inner: `<g transform="translate(${ox.toFixed(2)},${oy.toFixed(2)})">${w.svg}${ball(bx, by, r)}</g>` };
}
const svg = (w, h, body, bg) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${bg ? `<rect width="${w}" height="${h}" fill="${bg}"/>` : ""}${body}</svg>`;
const centred = (canvas, l, scaleTo) => { const k = scaleTo / l.width; const x = (canvas - l.width * k) / 2, y = (canvas - l.height * k) / 2; return `<g transform="translate(${x.toFixed(2)},${y.toFixed(2)}) scale(${k.toFixed(4)})">${l.inner}</g>`; };

(async () => {
  const r = logo({ text: "r", size: 600, fill: PAPER });
  const full = logo({ text: "Roundr", size: 300, fill: PAPER });
  // App icon: no transparency (App Store requirement).
  await sharp(Buffer.from(svg(1024, 1024, centred(1024, r, 512), INK))).flatten({ background: INK }).removeAlpha().png().toFile(path.join(outDir, "icon.png"));
  // Android adaptive foreground: transparent, inside the 66 % safe zone.
  await sharp(Buffer.from(svg(1024, 1024, centred(1024, r, 330)))).png().toFile(path.join(outDir, "adaptive-icon.png"));
  // Splash: full logo, transparent, shown on #020909.
  await sharp(Buffer.from(svg(1024, 1024, centred(1024, full, 860)))).png().toFile(path.join(outDir, "splash-image.png"));
  await sharp(Buffer.from(svg(256, 256, centred(256, r, 128), INK))).resize(64, 64).flatten({ background: INK }).removeAlpha().png().toFile(path.join(outDir, "favicon.png"));
  for (const f of ["icon.png", "adaptive-icon.png", "splash-image.png", "favicon.png"]) { const m = await sharp(path.join(outDir, f)).metadata(); console.log(f, m.width + "x" + m.height, "alpha=" + m.hasAlpha, Math.round(fs.statSync(path.join(outDir, f)).size / 1024) + "KB"); }
})();

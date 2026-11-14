// Generates the Roundr logo assets and the night-pitch photo from the validated references.
const sharp = require("sharp"), opentype = require("opentype.js"), fs = require("fs"), path = require("path");
const [fontFile, kronoBoard, outDir] = process.argv.slice(2);
const INK = "#020909", PAPER = "#edf3f0", BALL = "#6ce182";
const font = opentype.loadSync(fontFile);

// Football: green disc, dark centre pentagon, five seams and five edge patches.
function ball(cx, cy, r) {
  const pt = (deg, k) => [cx + Math.cos((deg - 90) * Math.PI / 180) * r * k, cy + Math.sin((deg - 90) * Math.PI / 180) * r * k];
  const f = (p) => p.map(n => n.toFixed(2)).join(",");
  let s = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${BALL}"/>`;
  s += `<polygon points="${[0, 72, 144, 216, 288].map(a => f(pt(a, 0.36))).join(" ")}" fill="${INK}"/>`;
  for (const a of [0, 72, 144, 216, 288]) {
    s += `<line x1="${pt(a, 0.36)[0].toFixed(2)}" y1="${pt(a, 0.36)[1].toFixed(2)}" x2="${pt(a, 0.7)[0].toFixed(2)}" y2="${pt(a, 0.7)[1].toFixed(2)}" stroke="${INK}" stroke-width="${(r * 0.1).toFixed(2)}" stroke-linecap="round"/>`;
    s += `<polygon points="${f(pt(a, 0.68))} ${f(pt(a - 19, 1.0))} ${f(pt(a + 19, 1.0))}" fill="${INK}"/>`;
  }
  return `<g>${s}</g>`;
}
// Text as outlines, so no font needs to be installed to rasterise.
function word(text, size, x, baseline, fill) {
  const p = font.getPath(text, x, baseline, size, { letterSpacing: -0.03 });
  const b = p.getBoundingBox();
  return { svg: `<path d="${p.toPathData(2)}" fill="${fill}"/>`, box: b };
}
function logo({ text, size, fill, pad = 0 }) {
  const w = word(text, size, 0, 0, fill);
  const r = size * 0.115;                       // ball radius relative to the type size
  const gap = size * 0.035;
  const width = w.box.x2 - w.box.x1 + gap + 2 * r, height = w.box.y2 - w.box.y1;
  const ox = pad - w.box.x1, oy = pad - w.box.y1;
  const bx = w.box.x2 + gap + r, by = -r;       // the ball sits on the baseline, like a full stop
  return { width: width + 2 * pad, height: height + 2 * pad, inner: `<g transform="translate(${ox.toFixed(2)},${oy.toFixed(2)})">${w.svg}${ball(bx, by, r)}</g>` };
}
const svg = (w, h, body, bg) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${bg ? `<rect width="${w}" height="${h}" fill="${bg}"/>` : ""}${body}</svg>`;
const centred = (canvas, l, scaleTo) => { const k = scaleTo / l.width; const x = (canvas - l.width * k) / 2, y = (canvas - l.height * k) / 2; return `<g transform="translate(${x.toFixed(2)},${y.toFixed(2)}) scale(${k.toFixed(4)})">${l.inner}</g>`; };

(async () => {
  const r = logo({ text: "r", size: 600, fill: PAPER });
  const full = logo({ text: "Roundr", size: 300, fill: PAPER });
  // App icon: no transparency (App Store requirement).
  await sharp(Buffer.from(svg(1024, 1024, centred(1024, r, 470), INK))).flatten({ background: INK }).removeAlpha().png().toFile(path.join(outDir, "icon.png"));
  // Android adaptive foreground: transparent, inside the 66 % safe zone.
  await sharp(Buffer.from(svg(1024, 1024, centred(1024, r, 330)))).png().toFile(path.join(outDir, "adaptive-icon.png"));
  // Splash: full logo, transparent, shown on #020909.
  await sharp(Buffer.from(svg(1024, 1024, centred(1024, full, 860)))).png().toFile(path.join(outDir, "splash-image.png"));
  await sharp(Buffer.from(svg(256, 256, centred(256, r, 124), INK))).resize(64, 64).flatten({ background: INK }).removeAlpha().png().toFile(path.join(outDir, "favicon.png"));
  // Night pitch: the area of the Krono intro between the text and the button.
  const crop = { left: 38, top: 247, width: 254, height: 175 };
  await sharp(kronoBoard).extract(crop).resize({ width: 1016, kernel: "lanczos3" }).blur(0.6).sharpen({ sigma: 0.8, m1: 0.6, m2: 1.2 }).jpeg({ quality: 84, mozjpeg: true }).toFile(path.join(outDir, "pitch-night.jpg"));
  fs.writeFileSync(path.join(outDir, "logo-geometry.json"), JSON.stringify({ ballRadiusPerSize: 0.115, gapPerSize: 0.035, letterSpacingEm: -0.03, wordWidthPerSize: (full.width - 0) / 300, wordHeightPerSize: full.height / 300 }));
  for (const f of ["icon.png", "adaptive-icon.png", "splash-image.png", "favicon.png", "pitch-night.jpg"]) { const m = await sharp(path.join(outDir, f)).metadata(); console.log(f, m.width + "x" + m.height, "alpha=" + m.hasAlpha, Math.round(fs.statSync(path.join(outDir, f)).size / 1024) + "KB"); }
})();

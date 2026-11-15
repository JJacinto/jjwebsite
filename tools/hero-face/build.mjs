/* Builds the hero dot-matrix portrait from tools/hero-face/source.webp.
   Run:  node tools/hero-face/build.mjs [previewDir]

   Writes
     public/assets/images/hero-face.webp   head and neck, cut out, fading into the shirt
     public/assets/hero-face-dark.json     dots for the dark theme  (dots where the photo is light)
     public/assets/hero-face-light.json    dots for the light theme (dots where the photo is dark)
   Each JSON: { w, h, d: [x, y, r*10, lum*100, ...] } in a w x h space.
   With previewDir, also writes preview-dark.png / preview-light.png there.

   To use a new photo: replace source.webp (subject on pure black), adjust CROP
   and the fade numbers below, run this again. */
import sharp from 'sharp';
import { writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(here, '../..');
const SRC = path.join(here, 'source.webp');
const previewDir = process.argv[2];

// Region of the source photo to keep, in source pixels.
const CROP = { x: 200, y: 0, w: 872, h: 1090 };
// Where the neck starts to fade into the shirt, and where nothing is left.
const FADE_Y0 = 880, FADE_Y1 = 1075;
const OUT_W = 640;                     // photo width shipped to the browser
const SPACE_W = 1000;                  // coordinate space of the dots
const S_MIN = 9, S_MAX = 30;          // dot spacing at full tone / at the faintest tone
const TONE_FLOOR = 0.07;               // below this there are no dots

const clamp = (x, a, b) => (x < a ? a : x > b ? b : x);
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
function rng(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const { data: src, info } = await sharp(SRC).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const SW = info.width, SH = info.height;

/* ---- silhouette: flood the black background in from the borders ---- */
const bg = new Uint8Array(SW * SH);
const isBlack = (i) => Math.max(src[i * 3], src[i * 3 + 1], src[i * 3 + 2]) <= 7;
const stack = [];
for (let x = 0; x < SW; x++) { stack.push(x, (SH - 1) * SW + x); }
for (let y = 0; y < SH; y++) { stack.push(y * SW, y * SW + SW - 1); }
while (stack.length) {
  const i = stack.pop();
  if (bg[i] || !isBlack(i)) continue;
  bg[i] = 1;
  const x = i % SW, y = (i / SW) | 0;
  if (x > 0) stack.push(i - 1);
  if (x < SW - 1) stack.push(i + 1);
  if (y > 0) stack.push(i - SW);
  if (y < SH - 1) stack.push(i + SW);
}

/* ---- crop, cut out, fade the shoulders away ---- */
const CW = CROP.w, CH = CROP.h;
const rgba = Buffer.alloc(CW * CH * 4);
const cx = CW / 2;
for (let y = 0; y < CH; y++) {
  for (let x = 0; x < CW; x++) {
    const si = (y + CROP.y) * SW + (x + CROP.x), o = (y * CW + x) * 4;
    const fy = 1 - smooth(FADE_Y0, FADE_Y1, y + CROP.y);
    const below = smooth(FADE_Y0 - 60, FADE_Y0 + 40, y + CROP.y);
    const fx = 1 - below * smooth(0.5, 0.98, Math.abs(x - cx) / cx);
    rgba[o] = src[si * 3]; rgba[o + 1] = src[si * 3 + 1]; rgba[o + 2] = src[si * 3 + 2];
    rgba[o + 3] = bg[si] ? 0 : Math.round(255 * fy * fx);
  }
}
// Feather the cut-out edge slightly so hair does not end in a hard line.
const alphaSoft = await sharp(rgba, { raw: { width: CW, height: CH, channels: 4 } })
  .extractChannel(3).blur(1.6).raw().toBuffer();
for (let i = 0; i < CW * CH; i++) rgba[i * 4 + 3] = Math.min(rgba[i * 4 + 3], alphaSoft[i]);

const OUT_H = Math.round(OUT_W * CH / CW);
await mkdir(path.join(rootDir, 'public/assets/images'), { recursive: true });
await sharp(rgba, { raw: { width: CW, height: CH, channels: 4 } })
  .resize(OUT_W, OUT_H)
  .webp({ quality: 82, alphaQuality: 90 })
  .toFile(path.join(rootDir, 'public/assets/images/hero-face.webp'));

/* ---- tone map, slightly blurred so single pixels do not steer the dots ---- */
const SPACE_H = Math.round(SPACE_W * CH / CW);
const small = await sharp(rgba, { raw: { width: CW, height: CH, channels: 4 } })
  .resize(SPACE_W / 2, SPACE_H / 2).blur(1.2).raw().toBuffer({ resolveWithObject: true });
const TW = small.info.width, TH = small.info.height, td = small.data;
function sample(x, y) {
  const ix = clamp(Math.round(x / 2), 0, TW - 1), iy = clamp(Math.round(y / 2), 0, TH - 1), o = (iy * TW + ix) * 4;
  const lum = (0.2126 * td[o] + 0.7152 * td[o + 1] + 0.0722 * td[o + 2]) / 255;
  return { lum, a: td[o + 3] / 255 };
}

/* ---- stipple: dart throwing with a spacing that follows the tone ---- */
function stipple(toneOf, seed) {
  const rand = rng(seed), cell = S_MAX, gw = Math.ceil(SPACE_W / cell), gh = Math.ceil(SPACE_H / cell);
  const grid = Array.from({ length: gw * gh }, () => []);
  const dots = [];
  for (let n = 0; n < 900000; n++) {
    const x = rand() * SPACE_W, y = rand() * SPACE_H;
    const s = sample(x, y), tone = toneOf(s);
    if (tone < TONE_FLOOR) continue;
    const sp = clamp(S_MIN / Math.sqrt(tone), S_MIN, S_MAX);
    const gx = (x / cell) | 0, gy = (y / cell) | 0;
    let ok = true;
    for (let yy = Math.max(0, gy - 1); ok && yy <= Math.min(gh - 1, gy + 1); yy++) {
      for (let xx = Math.max(0, gx - 1); ok && xx <= Math.min(gw - 1, gx + 1); xx++) {
        for (const d of grid[yy * gw + xx]) {
          const need = (sp + d.sp) / 2, dx = d.x - x, dy = d.y - y;
          if (dx * dx + dy * dy < need * need) { ok = false; break; }
        }
      }
    }
    if (!ok) continue;
    const d = { x, y, sp, r: S_MIN * (0.2 + 0.2 * tone), lum: s.lum };
    grid[gy * gw + gx].push(d);
    dots.push(d);
  }
  return dots;
}
// The photo is dark overall, so stretch the range before using it.
const norm = (lum) => clamp((lum - 0.05) / 0.5, 0, 1);
const dark = stipple((s) => Math.pow(clamp((s.lum - 0.1) / 0.4, 0, 1), 1.8) * s.a, 7);
const light = stipple((s) => Math.pow(1 - norm(s.lum), 1.3) * s.a * s.a, 11);

async function emit(name, dots) {
  const d = [];
  for (const p of dots) d.push(Math.round(p.x), Math.round(p.y), Math.round(p.r * 10), Math.round(clamp(norm(p.lum), 0, 1) * 100));
  await writeFile(path.join(rootDir, 'public/assets', name), JSON.stringify({ w: SPACE_W, h: SPACE_H, d }));
  console.log(name, dots.length, 'dots');
}
await emit('hero-face-dark.json', dark);
await emit('hero-face-light.json', light);

if (previewDir) {
  const svg = (dots, bgc, fg) => Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${SPACE_W}" height="${SPACE_H}"><rect width="100%" height="100%" fill="${bgc}"/>` +
    dots.map((p) => `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${p.r.toFixed(2)}" fill="${fg}"/>`).join('') + '</svg>');
  await sharp(svg(dark, '#1c1a17', '#f0ede8')).resize(500).png().toFile(path.join(previewDir, 'preview-dark.png'));
  await sharp(svg(light, '#f0ede8', '#1c1a17')).resize(500).png().toFile(path.join(previewDir, 'preview-light.png'));
  await sharp(path.join(rootDir, 'public/assets/images/hero-face.webp')).flatten({ background: '#5c5cd4' }).resize(500).png().toFile(path.join(previewDir, 'preview-cut.png'));
}

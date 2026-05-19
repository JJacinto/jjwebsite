// One-shot resize: case-study images >1600px → 1600px long side (q85);
// avatar webps → 256² (q88). Writes to a temp file then moves over the
// original via the OS rename, which on Windows succeeds against locks
// that block in-place truncate (Vite/Astro dev's read handle).
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const cases = [
  'public/assets/images/cases/namecheap/hero.webp',
  'public/assets/images/cases/namecheap/button-docs.webp',
  'public/assets/images/cases/sy-ds/hero.webp',
  'public/assets/images/cases/sy-ds/component-checklist.webp',
  'public/assets/images/cases/sy-webinar/3a.webp',
  'public/assets/images/cases/sy-webinar/7c.webp',
  'public/assets/images/cases/sy-webinar/6a.webp',
];
const avatars = [
  'public/assets/images/photo-astronaut.webp',
  'public/assets/images/photo-guitar.webp',
  'public/assets/images/photo-padel.webp',
  'public/assets/images/photo-tickets.webp',
  'public/assets/images/photo-vr.webp',
  'public/assets/images/photo.webp',
];

// Two-phase swap: write .new sidecar here, then run a PowerShell pass
// to Move-Item -Force onto the original. Node's renameSync can't
// replace files held open by the running astro/Vite dev server on
// Windows, but Move-Item -Force (MoveFileEx with REPLACE_EXISTING)
// succeeds against the same lock.
function swap(p, buf) {
  fs.writeFileSync(`${p}.new`, buf);
}

async function processOne(p, opts) {
  const before = fs.statSync(p).size;
  const meta = await sharp(p).metadata();
  if (opts.kind === 'case') {
    const longest = Math.max(meta.width, meta.height);
    if (longest <= 1600) { console.log(`= ${p} ${meta.width}x${meta.height} skip`); return [before, before]; }
  }
  const buf = await sharp(p).resize(opts.resize).webp({ quality: opts.q }).toBuffer();
  swap(p, buf);
  const after = fs.statSync(p).size;
  const m2 = await sharp(p).metadata();
  console.log(`✓ ${p} ${meta.width}x${meta.height}/${(before / 1024).toFixed(1)}KB → ${m2.width}x${m2.height}/${(after / 1024).toFixed(1)}KB`);
  return [before, after];
}

let bb = 0, ba = 0;
for (const p of cases) {
  const meta = await sharp(p).metadata();
  const r = meta.width >= meta.height
    ? { width: 1600, withoutEnlargement: true, fit: 'inside' }
    : { height: 1600, withoutEnlargement: true, fit: 'inside' };
  const [b, a] = await processOne(p, { kind: 'case', resize: r, q: 85 });
  bb += b; ba += a;
}
console.log(`Cases: saved ${((bb - ba) / 1024).toFixed(0)} KB\n`);

let ab = 0, aa = 0;
for (const p of avatars) {
  if (!fs.existsSync(p)) continue;
  const [b, a] = await processOne(p, { kind: 'avatar', resize: { width: 256, height: 256, withoutEnlargement: true, fit: 'inside' }, q: 88 });
  ab += b; aa += a;
}
console.log(`Avatars: saved ${((ab - aa) / 1024).toFixed(0)} KB`);

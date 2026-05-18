#!/usr/bin/env node
// One-shot: resize every .webp in SY-Webinar so the longest side is ≤ 2000px.
// Backs up originals to `_originals/` first. Aspect ratio preserved.
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const DIR = 'D:/Claude/Personal website/Repository/Assets/SY-Webinar';
const MAX = 2000;
const BACKUP = path.join(DIR, '_originals');

fs.mkdirSync(BACKUP, { recursive: true });

const files = fs.readdirSync(DIR).filter(f => f.toLowerCase().endsWith('.webp'));
console.log(`Found ${files.length} webp files.`);

let resized = 0, skipped = 0, failed = 0;

for (const name of files) {
  const src = path.join(DIR, name);
  try {
    const meta = await sharp(src).metadata();
    const longest = Math.max(meta.width || 0, meta.height || 0);
    if (!longest) { console.log(`? ${name} — no dimensions, skipping`); skipped++; continue; }
    if (longest <= MAX) {
      console.log(`= ${name} (${meta.width}x${meta.height}) already ≤ ${MAX}px`);
      skipped++;
      continue;
    }

    const backupPath = path.join(BACKUP, name);
    if (!fs.existsSync(backupPath)) fs.copyFileSync(src, backupPath);

    const buf = await sharp(src)
      .resize({ width: meta.width >= meta.height ? MAX : null,
                height: meta.height > meta.width ? MAX : null,
                withoutEnlargement: true,
                fit: 'inside' })
      .webp({ quality: 90 })
      .toBuffer();
    fs.writeFileSync(src, buf);
    const newMeta = await sharp(src).metadata();
    console.log(`✓ ${name}  ${meta.width}x${meta.height} → ${newMeta.width}x${newMeta.height}`);
    resized++;
  } catch (e) {
    console.error(`✗ ${name} — ${e.message}`);
    failed++;
  }
}

console.log(`\nDone. Resized: ${resized}, skipped: ${skipped}, failed: ${failed}.`);
console.log(`Originals backed up to: ${BACKUP}`);

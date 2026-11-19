/* Builds the raster icons from the logo: node scripts/make-icons.mjs
   Every icon is two-tone: the logo in white on a tile in the site's dark
   page colour. The bare logo is black on transparent, so it disappears on
   dark browser chrome; with the tile, the tile carries it on light chrome
   and the white mark carries it on dark chrome.
   favicon.svg is the main favicon. The bitmaps cover the places that want
   one: Google's search results (multiples of 48px), iOS home screens, and
   browsers that ask for /favicon.ico. */
import sharp from 'sharp';
import { readFile, writeFile } from 'node:fs/promises';

const INK = '#ffffff';
const TILE = '#0e0d0c'; // --color-neutral-100, the page background
const source = await readFile('public/assets/jj-logo.svg', 'utf8');
const logo = source.replace('<svg ', `<svg fill="${INK}" `);

/* The vector favicon: the logo's own paths, scaled onto the tile. It is
   drawn at 16px in a tab, so the mark gets less padding than the bitmaps. */
function vector({ pad = 0.1, radius = 0.22 } = {}) {
  const box = 1080; // the logo's viewBox edge
  const paths = source.slice(source.indexOf('>', source.indexOf('<svg ')) + 1, source.lastIndexOf('</svg>')).trim();
  const scale = 1 - pad * 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${box} ${box}">
  <rect width="${box}" height="${box}" rx="${box * radius}" fill="${TILE}"/>
  <g fill="${INK}" fill-rule="evenodd" transform="translate(${box * pad} ${box * pad}) scale(${scale})">
    ${paths}
  </g>
</svg>
`;
}

/* size: output edge in px. pad: share of the edge left empty on each side.
   radius: corner radius as a share of the edge (iOS rounds its own). */
async function icon(size, { pad = 0.16, radius = 0.22 } = {}) {
  const inner = Math.round(size * (1 - pad * 2));
  const glyph = await sharp(Buffer.from(logo), { density: 600 })
    .resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png().toBuffer();
  const r = Math.round(size * radius);
  const tile = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${r}" fill="${TILE}"/></svg>`
  );
  return sharp(tile).composite([{ input: glyph, gravity: 'centre' }]).png().toBuffer();
}

/* An .ico file that wraps one PNG: 6-byte header, one 16-byte entry, data. */
function ico(png, size) {
  const head = Buffer.alloc(22);
  head.writeUInt16LE(1, 2);            // type: icon
  head.writeUInt16LE(1, 4);            // one image
  head.writeUInt8(size, 6);            // width
  head.writeUInt8(size, 7);            // height
  head.writeUInt16LE(1, 10);           // colour planes
  head.writeUInt16LE(32, 12);          // bits per pixel
  head.writeUInt32LE(png.length, 14);  // data size
  head.writeUInt32LE(22, 18);          // data offset
  return Buffer.concat([head, png]);
}

await writeFile('public/favicon.svg', vector());
await writeFile('public/favicon-96x96.png', await icon(96));
await writeFile('public/apple-touch-icon.png', await icon(180, { radius: 0 }));
await writeFile('public/favicon.ico', ico(await icon(48), 48));
console.log('wrote favicon.svg, favicon-96x96.png, apple-touch-icon.png, favicon.ico in public/');

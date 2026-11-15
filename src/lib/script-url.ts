import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/* URL for a file in public/ with a content hash appended (?v=…).
   The server sends public/scripts/*.js with a 30-day "immutable" cache,
   so without this a browser that loaded an older copy keeps running it
   after a deploy. The hash changes whenever the file does, which makes
   every browser fetch the new version. Computed at build time. */
const cache = new Map<string, string>();

export function versioned(path: string): string {
  let url = cache.get(path);
  if (!url) {
    try {
      const hash = createHash('sha1')
        .update(readFileSync(join(process.cwd(), 'public', path)))
        .digest('hex')
        .slice(0, 10);
      url = `${path}?v=${hash}`;
    } catch {
      url = path;
    }
    if (!import.meta.env.DEV) cache.set(path, url);
  }
  return url;
}

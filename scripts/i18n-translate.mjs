/* Fill the es / fr / de / zh / ja dictionaries with a local model (Ollama).

   Run after `npm run build`, which writes the lists of English strings:
     node scripts/i18n-translate.mjs            every language, pages + UI
     node scripts/i18n-translate.mjs ja         one language
     node scripts/i18n-translate.mjs --model gemma4:12b-it-qat

   Only strings with no entry yet are translated, so it is safe to re-run
   after a copy change. The result is a draft: read it before publishing.
   To redo a string, delete its entry from src/i18n/pages/<code>.json (or
   ui/<code>.json) and run again.

   The Portuguese on the site is hand-written, so each English string is
   sent with its Portuguese version when there is one: it tells the model
   what a short label like "Work" or "Home" means here. */
import { readFile, writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as parse5 from 'parse5';
import { keyOf } from '../src/i18n/languages.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
/* OLLAMA_HOST is often set as a bare host:port. */
const OLLAMA = (process.env.OLLAMA_HOST || 'localhost:11434').replace(/^(?!https?:\/\/)/, 'http://').replace(/\/$/, '');
const args = process.argv.slice(2);
const flag = (name, dflt) => { const i = args.indexOf(name); return i >= 0 ? args.splice(i, 2)[1] : dflt; };
const MODEL = flag('--model', 'gemma4:26b-a4b-it-qat');
const BATCH = Number(flag('--batch', '12'));

const TARGETS = {
  es: 'European Spanish (Spain). Address the reader as "tú".',
  fr: 'French (France). Address the reader as "vous".',
  de: 'German (Germany). Address the reader as "Sie".',
  zh: 'Simplified Chinese (Mainland China). Use full-width Chinese punctuation.',
  ja: 'Japanese. Polite です/ます style; natural, not word-for-word.',
};
const langs = args.length ? args : Object.keys(TARGETS);

const readJson = async (file, dflt) => { try { return JSON.parse(await readFile(file, 'utf8')); } catch { return dflt; } };

/* ---- English -> Portuguese pairs, read from the built pages ---- */
async function htmlFiles(dir, out = []) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) await htmlFiles(p, out);
    else if (e.name === 'index.html') out.push(p);
  }
  return out;
}
function stamped(doc) {
  const map = new Map();
  (function walk(n) {
    const id = n.attrs?.find((a) => a.name === 'data-i18n')?.value;
    if (id) map.set(id, n);
    for (const k of (n.content ? n.content.childNodes : n.childNodes) || []) walk(k);
  })(doc);
  return map;
}
const get = (el, name) => el.attrs.find((a) => a.name === name)?.value;
async function portuguesePairs() {
  const pairs = new Map();
  const dist = path.join(ROOT, 'dist');
  const ptRoot = path.join(dist, 'pt');
  let files;
  try { files = await htmlFiles(ptRoot); } catch { return pairs; }
  for (const ptFile of files) {
    const enFile = path.join(dist, path.relative(ptRoot, ptFile));
    let en, pt;
    try {
      en = stamped(parse5.parse(await readFile(enFile, 'utf8')));
      pt = stamped(parse5.parse(await readFile(ptFile, 'utf8')));
    } catch { continue; }
    for (const [id, e] of en) {
      const p = pt.get(id);
      if (!p) continue;
      if (get(e, 'data-i18n-t') !== undefined) pairs.set(keyOf(parse5.serialize(e)), keyOf(parse5.serialize(p)));
      for (const a of (get(e, 'data-i18n-a') || '').split(' ').filter(Boolean)) {
        const ev = get(e, a), pv = get(p, a);
        if (ev && pv) pairs.set(keyOf(ev), keyOf(pv));
      }
    }
  }
  return pairs;
}

/* ---- checks on what comes back ---- */
const tags = (s) => (s.match(/<\/?[a-zA-Z][^>]*>/g) || []).map((t) => t.replace(/\s+/g, ' ')).sort().join('|');
function problem(en, out) {
  if (typeof out !== 'string' || !out.trim()) return 'empty';
  if (tags(en) !== tags(out)) return 'HTML tags changed';
  if (out.length > en.length * 4 + 40) return 'far too long';
  return null;
}

async function ask(lang, items) {
  const system = [
    `You translate the website of João Jacinto, a senior product designer in Aveiro, Portugal (portfolio, case studies, contact form). Translate from English into ${TARGETS[lang]}`,
    'It is his own voice, first person: plain, direct, warm, no marketing gloss. Keep it as short as the English where you can; many strings are buttons, labels and headings.',
    'Rules: keep every HTML tag and attribute exactly as it is and in a sensible place; keep entities such as &nbsp; and &amp;; keep names, brands and product names (João Jacinto, LinkedIn, Figma, company names), numbers, URLs, e-mail addresses and emoji unchanged; do not add notes or quotes.',
    'Each item has "en" and sometimes "pt", his own Portuguese version of the same string: use it to understand the meaning and context, but translate from the English.',
    `Answer with a JSON array of exactly ${items.length} strings, the translations in the same order.`,
  ].join('\n');
  const res = await fetch(`${OLLAMA}/api/chat`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      model: MODEL, stream: false, think: false,
      options: { temperature: 0.2, num_ctx: 8192 },
      format: { type: 'array', items: { type: 'string' }, minItems: items.length, maxItems: items.length },
      messages: [{ role: 'system', content: system }, { role: 'user', content: JSON.stringify(items, null, 1) }],
    }),
  });
  if (!res.ok) throw new Error(`Ollama ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const out = JSON.parse((await res.json()).message.content);
  if (!Array.isArray(out) || out.length !== items.length) throw new Error('wrong number of items');
  return out;
}

async function fill(lang, keys, file, pairs) {
  const dict = await readJson(file, {});
  const todo = keys.filter((k) => !(k in dict));
  const failed = [];
  const save = async () => {
    const ordered = {};
    for (const k of keys) if (k in dict) ordered[k] = dict[k];
    for (const k of Object.keys(dict)) if (!(k in ordered)) ordered[k] = dict[k];
    await writeFile(file, JSON.stringify(ordered, null, 2) + '\n');
  };
  const item = (k) => (pairs.has(k) && pairs.get(k) !== k ? { en: k, pt: pairs.get(k) } : { en: k });
  for (let i = 0; i < todo.length; i += BATCH) {
    const batch = todo.slice(i, i + BATCH);
    let out;
    try { out = await ask(lang, batch.map(item)); } catch { out = []; }
    for (let j = 0; j < batch.length; j++) {
      let t = out[j];
      let why = problem(batch[j], t);
      if (why) {
        /* One more try, alone. */
        try { t = (await ask(lang, [item(batch[j])]))[0]; why = problem(batch[j], t); } catch (e) { why = e.message; }
      }
      if (why) failed.push(`${why}: ${batch[j].slice(0, 80)}`); else dict[batch[j]] = t.trim();
    }
    await save();
    process.stdout.write(`\r${lang} ${path.basename(path.dirname(file))}: ${Math.min(i + BATCH, todo.length)}/${todo.length}`);
  }
  if (todo.length) process.stdout.write('\n');
  return { done: todo.length - failed.length, failed };
}

const pairs = await portuguesePairs();
console.log(`model ${MODEL}; ${pairs.size} English/Portuguese pairs for context`);
const pageKeys = await readJson(path.join(ROOT, '.astro', 'i18n-source.json'), null);
if (!pageKeys) { console.error('No .astro/i18n-source.json: run `npm run build` first.'); process.exit(1); }
const uiKeys = (await readJson(path.join(ROOT, 'src', 'i18n', 'ui', 'source.json'), [])).map(keyOf);

for (const lang of langs) {
  if (!TARGETS[lang]) { console.error(`unknown language: ${lang}`); continue; }
  for (const [kind, keys] of [['pages', pageKeys], ['ui', uiKeys]]) {
    const r = await fill(lang, keys, path.join(ROOT, 'src', 'i18n', kind, `${lang}.json`), pairs);
    console.log(`${lang} ${kind}: ${r.done} translated, ${r.failed.length} failed`);
    for (const f of r.failed) console.log(`  - ${f}`);
  }
}

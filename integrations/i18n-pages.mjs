/* Every language at real URLs, and the stamps the browser needs to switch
   language without a reload.

   Source copy is English with data-pt="…" / data-pt-<attr>="…" opt-ins (a
   "carrier"). English is served at /x/, every other language in
   src/i18n/languages.mjs at /<code>/x/.
     pt            the data-pt* attributes in the source.
     es fr de zh ja  dictionaries src/i18n/pages/<code>.json:
                   { "<keyOf(English)>": "<translation>" }. A missing entry
                   leaves the English in place.

   One pure function, localize(html, lang, ctx), does the work. The build
   (astro:build:done) runs it for every page and language; the dev server
   (astro:server:setup) runs it on the English page it fetches from itself.

   Stamps, on every output page, on the English tree before any translation
   so the ids are the same in every language:
     data-i18n="t<N>"  every carrier in document order (N from 0; templates
                       included; a carrier with a fixed id still counts).
     data-i18n-t=""    the carrier has data-pt (its inner HTML is translated).
     data-i18n-a="a b" the attributes it translates (the <attr> of data-pt-<attr>).
     fixed ids         html, canonical, ogurl, oglocale, short.
   data-pt* attributes are removed from every output.

   Register AFTER sitemap(): it edits the sitemap file sitemap() writes. */
import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import * as parse5 from 'parse5';
import { LANGUAGES, TRANSLATED, byCode, keyOf } from '../src/i18n/languages.mjs';

const { parse, parseFragment, serialize } = parse5;

/* ---- small tree helpers ---- */
const isEl = (n) => n && typeof n.tagName === 'string';
const attr = (el, name) => el.attrs.find((a) => a.name === name);
const getAttr = (el, name) => attr(el, name)?.value;
function setAttr(el, name, value) {
  const a = attr(el, name);
  if (a) a.value = value; else el.attrs.push({ name, value });
}
function walk(node, fn) {
  fn(node);
  const kids = node.content ? node.content.childNodes : node.childNodes;
  if (kids) for (const k of [...kids]) walk(k, fn);
}
function find(root, test) {
  let hit = null;
  walk(root, (n) => { if (!hit && isEl(n) && test(n)) hit = n; });
  return hit;
}
function findAll(root, test) {
  const out = [];
  walk(root, (n) => { if (isEl(n) && test(n)) out.push(n); });
  return out;
}
function makeEl(tagName, attrs) {
  return {
    nodeName: tagName, tagName, attrs: Object.entries(attrs).map(([name, value]) => ({ name, value })),
    namespaceURI: 'http://www.w3.org/1999/xhtml', childNodes: [], parentNode: null,
  };
}
function textNode(value) {
  return { nodeName: '#text', value, parentNode: null };
}
function insertAfter(ref, nodes) {
  const parent = ref.parentNode;
  const i = parent.childNodes.indexOf(ref);
  for (const n of nodes) n.parentNode = parent;
  parent.childNodes.splice(i + 1, 0, ...nodes);
}
function setChildren(el, kids) {
  for (const k of kids) k.parentNode = el;
  el.childNodes = kids;
}
function stripPtAttrs(root) {
  walk(root, (n) => {
    if (isEl(n)) n.attrs = n.attrs.filter((a) => a.name !== 'data-pt' && !a.name.startsWith('data-pt-'));
  });
}
const RAW = new Set(['script', 'title', 'style']);
const rawText = (el) => el.childNodes.map((c) => c.value ?? '').join('');
const isLd = (el) => el.tagName === 'script' && getAttr(el, 'type') === 'application/ld+json';
const has = (dict, key) => typeof dict?.[key] === 'string' && dict[key].trim() !== '';

/* ---- URLs and links ---- */
const urlFor = (site, code, urlPath) => `${site}${code === 'en' ? '' : '/' + code}${urlPath}`;
function withSlash(p) { return p.endsWith('/') ? p : p + '/'; }
/* Site-relative page link: starts with "/", not "//", last segment has no
   extension. Returns { pathname, rest } or null. */
function splitInternal(href) {
  if (!href || href[0] !== '/' || href[1] === '/') return null;
  const m = /^([^?#]*)(.*)$/s.exec(href);
  const pathname = m[1];
  if (pathname.split('/').pop().includes('.')) return null;
  return { pathname, rest: m[2] };
}
/* `only` is the set of page paths to touch; null means every page path (dev,
   where nothing is built yet). */
function rewriteLinks(root, only, prefix) {
  for (const a of findAll(root, (n) => n.tagName === 'a' && attr(n, 'href'))) {
    const parts = splitInternal(getAttr(a, 'href'));
    if (!parts) continue;
    const p = withSlash(parts.pathname);
    if (only && !only.has(p)) continue;
    setAttr(a, 'href', prefix + p + parts.rest);
  }
}

/* ---- JSON-LD ---- */
const LD_SKIP_TYPES = new Set(['WebSite', 'Person', 'PostalAddress', 'Organization']);
const LD_SKIP_KEYS = new Set(['url', 'item', 'image', 'sameAs', 'inLanguage', 'telephone', 'email']);
/* Maps every string value of a graph. f.str(key, value, skipped) returns the
   new value; f.lang, when set, replaces every inLanguage. Nodes of the
   site-level types are "skipped": their strings are left alone. */
function ldMap(v, f, skipped = false) {
  if (Array.isArray(v)) return v.map((x) => ldMap(x, f, skipped));
  if (v && typeof v === 'object') {
    const types = [].concat(v['@type'] || []);
    const skip = skipped || types.some((t) => LD_SKIP_TYPES.has(t));
    const out = {};
    for (const [k, val] of Object.entries(v)) {
      if (k === 'inLanguage' && f.lang) out[k] = f.lang;
      else if (typeof val === 'string') out[k] = f.str(k, val, skip);
      else out[k] = ldMap(val, f, skip);
    }
    return out;
  }
  return v;
}
const ldEscape = (obj) => JSON.stringify(obj).replace(/</g, '\\u003c');
function ldKeys(text, add) {
  let obj;
  try { obj = JSON.parse(text); } catch { return; }
  ldMap(obj, { str(k, s, skipped) {
    if (!skipped && !k.startsWith('@') && !LD_SKIP_KEYS.has(k) && !/^https?:\/\//.test(s)) add(keyOf(s));
    return s;
  } });
}

/* ---- stamping (English tree, before any translation) ---- */
function fixedOf(el) {
  if (el.tagName === 'html') return { id: 'html', a: ['lang'] };
  if (el.tagName === 'link' && getAttr(el, 'rel') === 'canonical') return { id: 'canonical', a: ['href'] };
  if (el.tagName === 'meta' && getAttr(el, 'property') === 'og:url') return { id: 'ogurl', a: ['content'] };
  if (el.tagName === 'meta' && getAttr(el, 'property') === 'og:locale') return { id: 'oglocale', a: ['content'] };
  if (attr(el, 'data-lang-short')) return { id: 'short', t: true, a: [] };
  return null;
}

/* Stamps every carrier and fixed element; returns the per-element dictionary
   keys and the ordered unique list of English keys on the page. */
function stamp(doc) {
  const info = new Map();
  const keys = [];
  const seen = new Set();
  const add = (k) => { if (k && !seen.has(k)) { seen.add(k); keys.push(k); } };
  let n = 0;
  walk(doc, (el) => {
    if (!isEl(el)) return;
    const hasPt = getAttr(el, 'data-pt') !== undefined;
    const ptAttrs = el.attrs.filter((a) => a.name.startsWith('data-pt-')).map((a) => a.name.slice('data-pt-'.length));
    const carrier = hasPt || ptAttrs.length > 0;
    const fixed = fixedOf(el);
    if (!carrier && !fixed) return;
    const id = fixed ? fixed.id : `t${n}`;
    if (carrier) n++;
    const t = hasPt || fixed?.t;
    const attrs = [...new Set([...(fixed?.a || []), ...ptAttrs])];
    setAttr(el, 'data-i18n', id);
    if (t) setAttr(el, 'data-i18n-t', '');
    if (attrs.length) setAttr(el, 'data-i18n-a', attrs.join(' '));
    if (fixed) return; // fixed elements are set by localize, not by the dictionaries
    const rec = { textKey: null, attrKeys: {} };
    if (hasPt) {
      if (isLd(el)) ldKeys(rawText(el), add);
      else {
        rec.textKey = keyOf(RAW.has(el.tagName) ? rawText(el) : serialize(el.content || el));
        add(rec.textKey);
      }
    }
    for (const name of ptAttrs) {
      const v = getAttr(el, name);
      if (v === undefined) continue;
      rec.attrKeys[name] = keyOf(v);
      add(rec.attrKeys[name]);
    }
    info.set(el, rec);
  });
  return { info, keys };
}

/* ---- translation ---- */
function translate(doc, lang, ctx, info) {
  const pt = lang.code === 'pt';
  const dict = ctx.dicts?.[lang.code] || {};
  const site = ctx.site;
  const urlFix = (s) => {
    if (!s.startsWith(site + '/')) return null;
    if (s === `${site}/#person` || s === `${site}/#website`) return s;
    const m = /^([^#]*)(#.*)?$/s.exec(s.slice(site.length));
    const p = withSlash(m[1] || '/');
    if (p.split('/').filter(Boolean).pop()?.includes('.')) return s;
    if (ctx.indexable && !ctx.indexable.has(p)) return s;
    return `${site}/${lang.code}${p}${m[2] || ''}`;
  };
  function ldFor(el) {
    let obj;
    try { obj = JSON.parse(rawText(el)); } catch { return null; }
    return ldEscape(ldMap(obj, {
      lang: lang.htmlLang,
      str(k, s, skipped) {
        if (skipped) return s;
        const u = urlFix(s);
        if (u !== null) return u;
        if (k.startsWith('@') || LD_SKIP_KEYS.has(k) || /^https?:\/\//.test(s)) return s;
        const key = keyOf(s);
        return has(dict, key) ? dict[key] : s;
      },
    }));
  }
  function visit(node) {
    if (!isEl(node)) {
      const kids = node.childNodes;
      if (kids) for (const k of [...kids]) visit(k);
      return;
    }
    const rec = info.get(node);
    if (rec) {
      for (const a of [...node.attrs]) {
        if (!a.name.startsWith('data-pt-')) continue;
        const name = a.name.slice('data-pt-'.length);
        if (pt) setAttr(node, name, a.value);
        else if (has(dict, rec.attrKeys[name])) setAttr(node, name, dict[rec.attrKeys[name]]);
      }
      if (getAttr(node, 'data-pt') !== undefined) {
        let out;
        if (isLd(node)) out = pt ? getAttr(node, 'data-pt') : ldFor(node);
        else if (pt) out = getAttr(node, 'data-pt');
        else if (has(dict, rec.textKey)) out = dict[rec.textKey];
        if (out != null) {
          /* Outer element wins: its old descendants are gone and not visited. */
          setChildren(node, RAW.has(node.tagName) ? [textNode(out)] : parseFragment(node, out).childNodes);
          return;
        }
      }
    }
    const kids = node.content ? node.content.childNodes : node.childNodes;
    if (kids) for (const k of [...kids]) visit(k);
  }
  visit(doc);
}

/* Text with letters, in the body, that no data-pt covers. */
export function findLeftovers(root) {
  const out = [];
  const body = find(root, (n) => n.tagName === 'body');
  const SKIP = new Set(['script', 'style', 'svg', 'noscript', 'template']);
  function visit(node, covered) {
    if (isEl(node)) {
      if (SKIP.has(node.tagName)) return;
      const c = covered || getAttr(node, 'data-pt') !== undefined || node.attrs.some((a) => a.name === 'data-lang-short');
      const kids = node.content ? node.content.childNodes : node.childNodes;
      if (kids) for (const k of kids) visit(k, c);
    } else if (node.nodeName === '#text' && !covered) {
      const t = node.value.replace(/\s+/g, ' ').trim();
      if (t.length > 2 && /\p{L}/u.test(t)) out.push(t);
    }
  }
  if (body) visit(body, false);
  return out;
}

export const isNoindex = (html) => /<meta name="robots" content="noindex">/i.test(html);
export const isRefresh = (html) => /<meta http-equiv="refresh"/i.test(html);

/* ---- the one function ----
   html   the English page as Astro wrote it (data-pt present).
   lang   a language code.
   ctx    { site, urlPath, built: Set|null, indexable: Set|null,
            dicts: { es: {...} }, uis: { es: {...} } }
          built/indexable are page paths like "/about/"; null = every path
          (dev server). Returns { html, keys, kind } where keys are the
          English dictionary keys found on the page, in order. */
export function localize(html, lang, ctx) {
  const L = byCode(lang);
  if (isRefresh(html)) return { html, keys: [], kind: 'refresh' };
  const noindex = isNoindex(html);
  const doc = parse(html);
  const htmlEl = find(doc, (n) => n.tagName === 'html');

  /* English links first (trailing slash), so the keys read the same here, in
     the build and in the browser. */
  rewriteLinks(doc, ctx.built, '');
  const { info, keys } = stamp(doc);

  if (L.code !== 'en') {
    translate(doc, L, ctx, info);
    rewriteLinks(doc, ctx.indexable, '/' + L.code);
  }
  stripPtAttrs(doc);

  /* Fixed elements. */
  setAttr(htmlEl, 'lang', L.htmlLang);
  const pageUrl = urlFor(ctx.site, L.code, ctx.urlPath);
  const canon = find(doc, (n) => n.tagName === 'link' && getAttr(n, 'rel') === 'canonical');
  if (canon) setAttr(canon, 'href', pageUrl);
  const meta = (prop, value) => {
    const el = find(doc, (n) => n.tagName === 'meta' && getAttr(n, 'property') === prop);
    if (el) setAttr(el, 'content', value);
  };
  meta('og:url', pageUrl);
  meta('og:locale', L.ogLocale);
  for (const el of findAll(doc, (n) => attr(n, 'data-lang-short'))) setChildren(el, [textNode(L.short)]);

  if (noindex) {
    setAttr(htmlEl, 'data-lang-mode', 'fetch');
    setAttr(htmlEl, 'data-lang-src', ctx.urlPath);
  } else {
    setAttr(htmlEl, 'data-lang-mode', 'url');
    if (canon) {
      insertAfter(canon, [
        ...LANGUAGES.map((l) => makeEl('link', { rel: 'alternate', hreflang: l.hreflang, href: urlFor(ctx.site, l.code, ctx.urlPath) })),
        makeEl('link', { rel: 'alternate', hreflang: 'x-default', href: urlFor(ctx.site, 'en', ctx.urlPath) }),
      ]);
    }
  }

  const ui = ctx.uis?.[L.code];
  if (ui && L.code !== 'pt' && L.code !== 'en') {
    const head = find(doc, (n) => n.tagName === 'head');
    if (head) {
      const s = makeEl('script', { type: 'application/json', id: 'jj-ui' });
      setChildren(s, [textNode(ldEscape(ui))]);
      s.parentNode = head;
      head.childNodes.push(s);
    }
  }
  return { html: serialize(doc), keys, kind: noindex ? 'noindex' : 'page' };
}

/* ---- dictionaries ---- */
async function readJson(file, fallback) {
  try { return JSON.parse(await readFile(file, 'utf8')); } catch { return fallback; }
}
async function loadDicts(rootDir) {
  const dicts = {};
  const uis = {};
  for (const l of TRANSLATED) {
    if (l.code === 'pt') continue;
    dicts[l.code] = await readJson(path.join(rootDir, 'src', 'i18n', 'pages', `${l.code}.json`), {});
    uis[l.code] = await readJson(path.join(rootDir, 'src', 'i18n', 'ui', `${l.code}.json`), null);
  }
  return { dicts, uis };
}

/* ---- files ---- */
async function listHtml(dir, base = dir, out = []) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      /* Skip the translated trees (a rebuild into a dirty dist). */
      if (dir === base && TRANSLATED.some((l) => l.code === e.name)) continue;
      await listHtml(p, base, out);
    } else if (e.name.endsWith('.html')) out.push(p);
  }
  return out;
}
/* dist/about/index.html -> /about/ ; dist/index.html -> / ; dist/404.html -> /404/ */
function urlPathOf(file, outDir) {
  const parts = path.relative(outDir, file).split(path.sep);
  const last = parts.pop();
  if (last !== 'index.html') parts.push(last.replace(/\.html$/, ''));
  return parts.length ? `/${parts.join('/')}/` : '/';
}
const fileOf = (urlPath, outDir) => path.join(outDir, ...urlPath.split('/').filter(Boolean), 'index.html');

/* ---- sitemap ---- */
async function updateSitemap(outDir, site, indexable, log) {
  const file = path.join(outDir, 'sitemap-0.xml');
  let xml;
  try { xml = await readFile(file, 'utf8'); } catch {
    log.warn('sitemap-0.xml not found (is i18n-pages registered after sitemap()?). Sitemap not updated.');
    return;
  }
  const alt = (p) => [
    ...LANGUAGES.map((l) => `<xhtml:link rel="alternate" hreflang="${l.hreflang}" href="${urlFor(site, l.code, p)}"/>`),
    `<xhtml:link rel="alternate" hreflang="x-default" href="${urlFor(site, 'en', p)}"/>`,
  ].join('');
  const extra = [];
  let entries = 0;
  xml = xml.replace(/<url>([\s\S]*?)<\/url>/g, (whole, inner) => {
    const loc = /<loc>([^<]+)<\/loc>/.exec(inner)?.[1];
    if (!loc || !loc.startsWith(site)) return whole;
    const p = withSlash(loc.slice(site.length) || '/');
    if (!indexable.has(p)) return whole;
    entries++;
    for (const l of TRANSLATED) extra.push(`<url><loc>${urlFor(site, l.code, p)}</loc>${alt(p)}</url>`);
    return `<url>${inner}${alt(p)}</url>`;
  });
  if (!xml.includes('xmlns:xhtml')) {
    xml = xml.replace(/<urlset /, '<urlset xmlns:xhtml="http://www.w3.org/1999/xhtml" ');
  }
  xml = xml.replace('</urlset>', extra.join('') + '</urlset>');
  await writeFile(file, xml);
  log.info(`sitemap: ${extra.length} translated URLs added, ${LANGUAGES.length} alternates + x-default on ${entries + extra.length} entries`);
}

/* ---- dev server ---- */
const DEV_HEADER = 'x-jj-i18n';
function devMiddleware(getState, log) {
  const codes = TRANSLATED.map((l) => l.code).join('|');
  const re = new RegExp(`^/(${codes})(/[^?#]*)?(\\?.*)?$`);
  return async (req, res, next) => {
    try {
      if (req.method !== 'GET' || req.headers[DEV_HEADER]) return next();
      const m = re.exec(req.url || '');
      if (!m) return next();
      const code = m[1];
      const pathname = m[2] || '/';
      if (pathname.split('/').pop().includes('.')) return next();
      const { site, rootDir } = getState();
      const r = await fetch(`http://${req.headers.host}${pathname}${m[3] || ''}`, {
        headers: { [DEV_HEADER]: '1', accept: 'text/html' },
      });
      const type = r.headers.get('content-type') || '';
      if (!r.ok || !type.includes('text/html')) return next();
      const { dicts, uis } = await loadDicts(rootDir);
      const out = localize(await r.text(), code, {
        site, urlPath: withSlash(pathname), built: null, indexable: null, dicts, uis,
      });
      res.statusCode = 200;
      res.setHeader('content-type', 'text/html; charset=utf-8');
      res.setHeader('cache-control', 'no-store');
      res.end(out.html);
    } catch (e) {
      log.warn(`i18n dev middleware: ${e?.message || e}`);
      next();
    }
  };
}

/* ---- integration ---- */
export default function i18nPages() {
  let site = '';
  let rootDir = process.cwd();
  return {
    name: 'i18n-pages',
    hooks: {
      'astro:config:done': ({ config }) => {
        site = String(config.site || '').replace(/\/$/, '');
        rootDir = fileURLToPath(config.root);
      },
      'astro:server:setup': ({ server, logger }) => {
        server.middlewares.use(devMiddleware(() => ({ site, rootDir }), logger));
      },
      'astro:build:done': async ({ dir, logger }) => {
        const log = logger;
        const outDir = fileURLToPath(dir);

        /* Load and classify. (parse5 does not reproduce Astro's output byte
           for byte: it writes valueless attributes as name="", re-escapes a
           few entities and moves trailing scripts inside <body>, as a
           browser would. Inline script and style contents are unchanged.) */
        const pages = [];
        for (const file of await listHtml(outDir)) {
          const html = await readFile(file, 'utf8');
          pages.push({ file, urlPath: urlPathOf(file, outDir), html, noindex: isNoindex(html), refresh: isRefresh(html) });
        }
        pages.sort((a, b) => a.urlPath.localeCompare(b.urlPath));

        const built = new Set(pages.map((p) => p.urlPath));
        const indexable = new Set(pages.filter((p) => !p.noindex && !p.refresh).map((p) => p.urlPath));
        const { dicts, uis } = await loadDicts(rootDir);

        const sourceKeys = [];
        const seen = new Set();
        const leftoverLines = [];
        const counts = [];
        let written = 0;
        for (const p of pages) {
          if (p.refresh) continue;
          const ctx = { site, urlPath: p.urlPath, built, indexable, dicts, uis };

          const left = findLeftovers(parse(p.html));
          if (!p.noindex) {
            counts.push([p.urlPath, left.length]);
            leftoverLines.push(`## ${p.urlPath}  (${left.length})`, ...left.map((t) => `- ${t}`), '');
          }

          for (const l of LANGUAGES) {
            const out = localize(p.html, l.code, ctx);
            if (l.code === 'en') {
              for (const k of out.keys) if (!seen.has(k)) { seen.add(k); sourceKeys.push(k); }
              await writeFile(p.file, out.html);
            } else {
              const f = fileOf(`/${l.code}${p.urlPath}`, outDir);
              await mkdir(path.dirname(f), { recursive: true });
              await writeFile(f, out.html);
              written++;
            }
          }
          if (!p.noindex && !find(parse(p.html), (n) => n.tagName === 'link' && getAttr(n, 'rel') === 'canonical')) {
            log.warn(`no canonical link in ${p.urlPath}`);
          }
        }

        log.info(`i18n-pages: wrote ${written} translated pages (${TRANSLATED.length} languages)`);
        for (const [p, n] of counts) log.info(`leftovers ${p}: ${n} text nodes without data-pt`);

        const astroDir = path.join(rootDir, '.astro');
        await mkdir(astroDir, { recursive: true });
        await writeFile(path.join(astroDir, 'i18n-leftovers.txt'), leftoverLines.join('\n'));
        await writeFile(path.join(astroDir, 'i18n-source.json'), JSON.stringify(sourceKeys, null, 2));
        log.info(`i18n-source.json: ${sourceKeys.length} English keys`);
        for (const l of TRANSLATED) {
          if (l.code === 'pt') continue;
          const missing = sourceKeys.filter((k) => !has(dicts[l.code], k));
          await writeFile(path.join(astroDir, `i18n-missing-${l.code}.json`), JSON.stringify(missing, null, 2));
          log.info(`${l.code}: ${missing.length} of ${sourceKeys.length} keys missing`);
        }

        await updateSitemap(outDir, site, indexable, log);
      },
    },
  };
}

/* Portuguese pages at real URLs.

   The source copy is English with data-pt="…" / data-pt-<attr>="…" opt-ins
   (see the language script in src/layouts/Base.astro). After the build this
   integration:
     - writes dist/pt/<same path>/index.html for every indexable page, with
       the Portuguese copy applied and the data-pt* attributes removed;
     - cleans the English pages in place (no data-pt*, data-lang-mode="url",
       hreflang links, internal links ending in a slash);
     - adds the PT pages and the en / pt / x-default alternates to the
       sitemap.
   Register it AFTER sitemap(), so sitemap-0.xml exists when this runs. */
import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import * as parse5 from 'parse5';

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
function insertAfter(ref, nodes) {
  const parent = ref.parentNode;
  const i = parent.childNodes.indexOf(ref);
  for (const n of nodes) n.parentNode = parent;
  parent.childNodes.splice(i + 1, 0, ...nodes);
}
function textNode(value) {
  return { nodeName: '#text', value, parentNode: null };
}
function stripPtAttrs(root) {
  walk(root, (n) => {
    if (isEl(n)) n.attrs = n.attrs.filter((a) => a.name !== 'data-pt' && !a.name.startsWith('data-pt-'));
  });
}

/* ---- files ---- */
async function listIndexFiles(dir, base = dir, out = []) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) await listIndexFiles(p, base, out);
    else if (e.name === 'index.html') out.push(p);
  }
  return out;
}
/* dist/about/index.html -> /about/ ; dist/index.html -> / */
function urlPathOf(file, outDir) {
  const rel = path.relative(outDir, path.dirname(file)).split(path.sep).filter(Boolean).join('/');
  return rel ? `/${rel}/` : '/';
}
function fileOf(urlPath, outDir) {
  return path.join(outDir, ...urlPath.split('/').filter(Boolean), 'index.html');
}

/* ---- link rewriting ---- */
/* Site-relative page link: starts with "/", not "//", last segment has no
   extension. Returns { pathname, rest } or null. */
function splitInternal(href) {
  if (!href || href[0] !== '/' || href[1] === '/') return null;
  const m = /^([^?#]*)(.*)$/s.exec(href);
  const pathname = m[1];
  const last = pathname.split('/').pop();
  if (last.includes('.')) return null;
  return { pathname, rest: m[2] };
}
function withSlash(p) { return p.endsWith('/') ? p : p + '/'; }

function rewriteLinks(root, builtPaths, ptPaths, toPt) {
  for (const a of findAll(root, (n) => n.tagName === 'a' && attr(n, 'href'))) {
    const parts = splitInternal(getAttr(a, 'href'));
    if (!parts) continue;
    const p = withSlash(parts.pathname);
    if (!builtPaths.has(p)) continue;
    let out = p;
    if (toPt) {
      if (!ptPaths.has(p)) continue;
      out = '/pt' + p;
    }
    setAttr(a, 'href', out + parts.rest);
  }
}

/* ---- head ---- */
function setMeta(root, selectorAttr, key, value) {
  const el = find(root, (n) => n.tagName === 'meta' && getAttr(n, selectorAttr) === key);
  if (el) setAttr(el, 'content', value);
}
function addHreflang(root, enUrl, ptUrl) {
  const canon = find(root, (n) => n.tagName === 'link' && getAttr(n, 'rel') === 'canonical');
  if (!canon) return false;
  insertAfter(canon, [
    makeEl('link', { rel: 'alternate', hreflang: 'en', href: enUrl }),
    makeEl('link', { rel: 'alternate', hreflang: 'pt', href: ptUrl }),
    makeEl('link', { rel: 'alternate', hreflang: 'x-default', href: enUrl }),
  ]);
  return true;
}

/* ---- Portuguese ---- */
function applyPortuguese(root) {
  /* Outer element wins: once an element's children are replaced, its old
     descendants are gone and are not visited. */
  function visit(node) {
    if (!isEl(node)) {
      const kids = node.childNodes;
      if (kids) for (const k of [...kids]) visit(k);
      return;
    }
    const pt = getAttr(node, 'data-pt');
    for (const a of [...node.attrs]) {
      if (a.name.startsWith('data-pt-')) setAttr(node, a.name.slice('data-pt-'.length), a.value);
    }
    if (pt !== undefined) {
      const raw = node.tagName === 'script' || node.tagName === 'title' || node.tagName === 'style';
      const kids = raw ? [textNode(pt)] : parseFragment(node, pt).childNodes;
      for (const k of kids) k.parentNode = node;
      node.childNodes = kids;
      stripPtAttrs(node);
      return;
    }
    const kids = node.content ? node.content.childNodes : node.childNodes;
    if (kids) for (const k of [...kids]) visit(k);
  }
  visit(root);
  stripPtAttrs(root);
}

/* Text with letters, in the body, that no data-pt covers. */
function findLeftovers(root) {
  const out = [];
  const body = find(root, (n) => n.tagName === 'body');
  const SKIP = new Set(['script', 'style', 'svg', 'noscript', 'template']);
  function visit(node, covered) {
    if (isEl(node)) {
      if (SKIP.has(node.tagName)) return;
      const c = covered || getAttr(node, 'data-pt') !== undefined;
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

/* ---- sitemap ---- */
async function updateSitemap(outDir, site, ptPaths, log) {
  const file = path.join(outDir, 'sitemap-0.xml');
  let xml;
  try { xml = await readFile(file, 'utf8'); } catch {
    log.warn('sitemap-0.xml not found (is pt-pages registered after sitemap()?). Sitemap not updated.');
    return;
  }
  const alt = (p) => [
    `<xhtml:link rel="alternate" hreflang="en" href="${site}${p}"/>`,
    `<xhtml:link rel="alternate" hreflang="pt" href="${site}/pt${p}"/>`,
    `<xhtml:link rel="alternate" hreflang="x-default" href="${site}${p}"/>`,
  ].join('');
  const extra = [];
  xml = xml.replace(/<url>([\s\S]*?)<\/url>/g, (whole, inner) => {
    const loc = /<loc>([^<]+)<\/loc>/.exec(inner)?.[1];
    if (!loc || !loc.startsWith(site)) return whole;
    const p = withSlash(loc.slice(site.length) || '/');
    if (!ptPaths.has(p)) return whole;
    extra.push(`<url><loc>${site}/pt${p}</loc>${alt(p)}</url>`);
    return `<url>${inner}${alt(p)}</url>`;
  });
  if (!xml.includes('xmlns:xhtml')) {
    xml = xml.replace(/<urlset /, '<urlset xmlns:xhtml="http://www.w3.org/1999/xhtml" ');
  }
  xml = xml.replace('</urlset>', extra.join('') + '</urlset>');
  await writeFile(file, xml);
  log.info(`sitemap: ${extra.length} Portuguese URLs added, en/pt/x-default alternates on ${extra.length * 2} entries`);
}

/* ---- integration ---- */
export default function ptPages() {
  let site = '';
  let rootDir = process.cwd();
  return {
    name: 'pt-pages',
    hooks: {
      'astro:config:done': ({ config }) => {
        site = String(config.site || '').replace(/\/$/, '');
        rootDir = fileURLToPath(config.root);
      },
      'astro:build:done': async ({ dir, logger }) => {
        const log = logger;
        const outDir = fileURLToPath(dir);
        const files = (await listIndexFiles(outDir)).filter((f) => !urlPathOf(f, outDir).startsWith('/pt/'));

        /* Load and classify. (parse5 does not reproduce Astro's output byte
           for byte: it writes valueless attributes as name="", re-escapes a
           few entities and moves trailing scripts inside <body>, as a
           browser would. Inline script and style contents are unchanged.) */
        const pages = [];
        for (const file of files) {
          const html = await readFile(file, 'utf8');
          const noindex = /<meta name="robots" content="noindex">/i.test(html);
          const refresh = /<meta http-equiv="refresh"/i.test(html);
          pages.push({ file, urlPath: urlPathOf(file, outDir), html, noindex, refresh });
        }

        const builtPaths = new Set(pages.map((p) => p.urlPath));
        const indexable = pages.filter((p) => !p.noindex && !p.refresh);
        const ptPaths = new Set(indexable.map((p) => p.urlPath));

        const leftoverLines = [];
        const counts = [];
        for (const p of indexable) {
          const enUrl = `${site}${p.urlPath}`;
          const ptUrl = `${site}/pt${p.urlPath}`;

          /* Portuguese copy. */
          const ptDoc = parse(p.html);
          const left = findLeftovers(ptDoc);
          counts.push([p.urlPath, left.length]);
          leftoverLines.push(`## /pt${p.urlPath}  (${left.length})`, ...left.map((t) => `- ${t}`), '');
          applyPortuguese(ptDoc);
          const htmlEl = find(ptDoc, (n) => n.tagName === 'html');
          setAttr(htmlEl, 'lang', 'pt-PT');
          setAttr(htmlEl, 'data-lang-mode', 'url');
          rewriteLinks(ptDoc, builtPaths, ptPaths, true);
          const canon = find(ptDoc, (n) => n.tagName === 'link' && getAttr(n, 'rel') === 'canonical');
          if (canon) setAttr(canon, 'href', ptUrl);
          setMeta(ptDoc, 'property', 'og:url', ptUrl);
          setMeta(ptDoc, 'property', 'og:locale', 'pt_PT');
          if (!addHreflang(ptDoc, enUrl, ptUrl)) log.warn(`no canonical link in ${p.urlPath}`);
          const ptFile = fileOf(`/pt${p.urlPath}`, outDir);
          await mkdir(path.dirname(ptFile), { recursive: true });
          await writeFile(ptFile, serialize(ptDoc));

          /* English, in place. */
          const enDoc = parse(p.html);
          stripPtAttrs(enDoc);
          setAttr(find(enDoc, (n) => n.tagName === 'html'), 'data-lang-mode', 'url');
          rewriteLinks(enDoc, builtPaths, ptPaths, false);
          addHreflang(enDoc, enUrl, ptUrl);
          await writeFile(p.file, serialize(enDoc));
        }

        log.info(`pt-pages: wrote ${indexable.length} Portuguese pages`);
        for (const [p, n] of counts) log.info(`leftovers /pt${p}: ${n} text nodes without Portuguese`);
        const report = path.join(rootDir, '.astro', 'pt-leftovers.txt');
        await mkdir(path.dirname(report), { recursive: true });
        await writeFile(report, leftoverLines.join('\n'));
        log.info(`leftovers written to ${path.relative(rootDir, report)}`);

        await updateSitemap(outDir, site, ptPaths, log);
      },
    },
  };
}

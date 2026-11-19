import { test, expect } from '@playwright/test';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';

const SITE = 'https://joaojacinto.com';
const ROOT = process.cwd();
/* The registry and the build code are ES modules; Node loads them with require(). */
const { LANGUAGES, TRANSLATED } = require('../src/i18n/languages.mjs');
const { localize } = require('../integrations/i18n-pages.mjs');
const DIST = path.join(ROOT, 'dist');
const read = (rel: string) => readFileSync(path.join(DIST, rel), 'utf8');
const urlOf = (code: string, p: string) => `${SITE}${code === 'en' ? '' : '/' + code}${p}`;
const ids = (html: string) => [...html.matchAll(/data-i18n="([^"]+)"/g)].map((m) => m[1]);

test.describe('Every language at real URLs', () => {
  for (const p of ['/', '/about/', '/contact/']) {
    test(`all ${LANGUAGES.length} versions of ${p} exist`, () => {
      for (const l of LANGUAGES) {
        const rel = l.code === 'en' ? `${p}index.html` : `${l.code}${p}index.html`;
        expect(existsSync(path.join(DIST, rel.replace(/^\//, ''))), `${l.code} ${p}`).toBe(true);
      }
    });
  }

  for (const l of LANGUAGES) {
    test(`${l.code}: lang, canonical, og, 8 hreflang links and no data-pt in ${l.code === 'en' ? '/about/' : '/' + l.code + '/about/'}`, async ({ page }) => {
      /* The built file is the contract; page scripts may adjust the live head. */
      const html = read(l.code === 'en' ? 'about/index.html' : `${l.code}/about/index.html`);
      expect(html).toContain(`<html lang="${l.htmlLang}"`);
      expect(html).toContain('data-lang-mode="url"');
      expect(html).toContain(`<link rel="canonical" href="${urlOf(l.code, '/about/')}"`);
      expect(html).toContain(`<meta property="og:url" content="${urlOf(l.code, '/about/')}"`);
      expect(html).toContain(`<meta property="og:locale" content="${l.ogLocale}"`);
      expect(html.match(/<link rel="alternate" hreflang=/g)).toHaveLength(LANGUAGES.length + 1);
      for (const o of LANGUAGES) {
        expect(html).toContain(`<link rel="alternate" hreflang="${o.hreflang}" href="${urlOf(o.code, '/about/')}">`);
      }
      expect(html).toContain(`hreflang="x-default" href="${urlOf('en', '/about/')}">`);
      await page.goto(l.code === 'en' ? '/about/' : `/${l.code}/about/`);
      /* English is left out here: its page script may restore data-pt on the live DOM. */
      if (l.code !== 'en') expect(await page.locator('[data-pt]').count()).toBe(0);
    });
  }

  test('en and es carry the same data-i18n ids on / and /about/', () => {
    for (const p of ['/', '/about/']) {
      const en = ids(read(`${p}index.html`.replace(/^\//, '')));
      const es = ids(read(`es${p}index.html`));
      expect(en.length).toBeGreaterThan(0);
      expect(es).toEqual(en);
    }
  });

  test('no data-pt attribute is left in any built page', () => {
    for (const rel of ['index.html', 'about/index.html', 'es/index.html', 'ja/contact/index.html', 'pt/about/index.html', '404.html', 'zh/404/index.html']) {
      expect(read(rel), rel).not.toMatch(/<[a-z][^<>]*\sdata-pt(-[\w-]+)?=/i);
    }
  });

  test('the sitemap lists the Japanese URLs with every alternate', () => {
    const xml = read('sitemap-0.xml');
    expect(xml).toContain(`<loc>${SITE}/ja/about/</loc>`);
    const entry = new RegExp(`<url><loc>${SITE}/ja/about/</loc>(.*?)</url>`).exec(xml)![1];
    expect([...entry.matchAll(/<xhtml:link /g)]).toHaveLength(LANGUAGES.length + 1);
    for (const o of LANGUAGES) expect(entry).toContain(`hreflang="${o.hreflang}" href="${urlOf(o.code, '/about/')}"`);
    expect(entry).toContain(`hreflang="x-default" href="${SITE}/about/"`);
    expect(xml).not.toMatch(/<loc>[^<]*\/(403|404|500|error)\//);
  });

  test('Portuguese comes from the data-pt attributes', async ({ page }) => {
    await page.goto('/pt/about/');
    await expect(page).toHaveTitle('Sobre — João Jacinto');
    const href = await page.locator('nav a[href$="about/"]').first().getAttribute('href');
    expect(href).toBe('/pt/about/');
  });

  test('error pages work in every language: fetch mode, noindex, no hreflang', () => {
    for (const l of LANGUAGES) {
      const html = l.code === 'en' ? read('404.html') : read(`${l.code}/404/index.html`);
      expect(html).toContain('data-lang-mode="fetch"');
      expect(html).toContain('data-lang-src="/404/"');
      expect(html).toContain('<meta name="robots" content="noindex">');
      expect(html).not.toContain('hreflang');
    }
  });
});

test.describe('localize()', () => {
  const html = `<!doctype html><html lang="en"><head><title data-pt="Olá">Hello</title>
    <link rel="canonical" href="https://joaojacinto.com/x/"><meta property="og:url" content="https://joaojacinto.com/x/">
    <meta property="og:locale" content="en_US"></head>
    <body><p data-pt="Sim">A <b>bold</b>   word</p><a href="/about">About</a>
    <img alt="Cat" data-pt-alt="Gato"><span data-lang-short>EN</span></body></html>`;
  const ctx = {
    site: SITE, urlPath: '/x/', built: new Set(['/x/', '/about/']), indexable: new Set(['/x/', '/about/']),
    dicts: { es: { Hello: 'Hola', 'A <b>bold</b> word': 'Una palabra <b>negrita</b>', Cat: 'Gato es' } },
    uis: { es: { Save: 'Guardar' } },
  };

  test('a dictionary entry is applied; a missing one leaves English', () => {
    const es = localize(html, 'es', ctx).html;
    expect(es).toContain('<title data-i18n="t0" data-i18n-t="">Hola</title>');
    expect(es).toContain('Una palabra <b>negrita</b>');
    expect(es).toContain('alt="Gato es"');
    expect(es).toContain('href="/es/about/"');
    expect(es).toContain('data-i18n="short" data-i18n-t="">ES<');
    expect(es).toContain('<script type="application/json" id="jj-ui">{"Save":"Guardar"}</script>');
    const fr = localize(html, 'fr', ctx).html;
    expect(fr).toContain('>Hello</title>');
    expect(fr).toContain('>A <b>bold</b>   word<');
  });

  test('stamps are identical across languages and data-pt is gone', () => {
    const per = ['en', 'pt', 'es', 'ja'].map((c) => ids(localize(html, c, ctx).html));
    for (const p of per) expect(p).toEqual(per[0]);
    const pt = localize(html, 'pt', ctx).html;
    expect(pt).toContain('>Olá</title>');
    expect(pt).not.toMatch(/data-pt/);
  });

  test('keys are the collapsed English strings, without the language label', () => {
    expect(localize(html, 'en', ctx).keys).toEqual(['Hello', 'A <b>bold</b> word', 'Cat']);
  });
});

test('every translated language has a dictionary and a UI file', () => {
  for (const l of TRANSLATED.filter((x) => x.code !== 'pt')) {
    for (const d of ['pages', 'ui']) {
      expect(existsSync(path.join(ROOT, 'src', 'i18n', d, `${l.code}.json`)), `${d}/${l.code}.json`).toBe(true);
    }
  }
});

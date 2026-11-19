import { test, expect } from '@playwright/test';

const SITE = 'https://joaojacinto.com';

test.describe('Portuguese pages at /pt/', () => {
  test('/pt/ is a finished Portuguese page', async ({ page }) => {
    await page.goto('/pt/');
    await expect(page.locator('html')).toHaveAttribute('lang', 'pt-PT');
    await expect(page).toHaveTitle(/Senior Product Designer/);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `${SITE}/pt/`);
    await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute('href', `${SITE}/`);
    await expect(page.locator('link[rel="alternate"][hreflang="pt"]')).toHaveAttribute('href', `${SITE}/pt/`);
    await expect(page.locator('link[rel="alternate"][hreflang="x-default"]')).toHaveAttribute('href', `${SITE}/`);
    await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute('content', 'pt_PT');
  });

  test('a Portuguese page has a Portuguese title and no data-pt left', async ({ page }) => {
    await page.goto('/pt/about/');
    await expect(page).toHaveTitle('Sobre — João Jacinto');
    expect(await page.locator('[data-pt]').count()).toBe(0);
  });

  test('English home points at its Portuguese twin', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('link[rel="alternate"][hreflang="pt"]')).toHaveAttribute('href', `${SITE}/pt/`);
  });

  test('navigation links on /pt/ stay under /pt/', async ({ page }) => {
    await page.goto('/pt/');
    const href = await page.locator('nav a[href$="about/"]').first().getAttribute('href');
    expect(href).toBe('/pt/about/');
  });

  test('a saved Portuguese choice moves /about/ to /pt/about/', async ({ page }) => {
    await page.addInitScript(() => { try { localStorage.setItem('lang', 'pt'); } catch {} });
    await page.goto('/about/');
    await page.waitForURL('**/pt/about/');
    await expect(page.locator('html')).toHaveAttribute('lang', 'pt-PT');
  });

  test('choosing English in the settings menu on /pt/about/ ends on /about/', async ({ page }) => {
    await page.goto('/pt/about/');
    await page.locator('#settingsBtn').click();
    await page.locator('input[name="jj-lang"][value="en"]').check({ force: true });
    await page.waitForURL(/\/about\/$/);
    expect(new URL(page.url()).pathname).toBe('/about/');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  });
});

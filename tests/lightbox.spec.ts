import { test, expect } from './fixtures';

const CASE_URL = '/case-studies/designing-a-support-chat-experience';
const OVERLAY = '#caseLightbox';

async function htmlOverflow(page: import('@playwright/test').Page) {
  return page.evaluate(() => document.documentElement.style.overflow);
}

test.describe('image lightbox (DSC case)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(CASE_URL);
    // First clickable body image (skip the lightbox img itself).
    await page.locator('.rwc-body img:not(.rwc-lightbox-img)').first().scrollIntoViewIfNeeded();
  });

  test('clicking a body image opens the overlay and locks html overflow', async ({ page }) => {
    const overlay = page.locator(OVERLAY);
    await expect(overlay).toBeHidden();

    const firstImg = page.locator('.rwc-body img:not(.rwc-lightbox-img)').first();
    const expectedSrc = await firstImg.evaluate((el: HTMLImageElement) => el.currentSrc || el.src);

    await firstImg.click();

    await expect(overlay).toBeVisible();
    await expect(overlay).toHaveClass(/is-open/);
    expect(await htmlOverflow(page)).toBe('hidden');

    const lbSrc = await overlay.locator('.rwc-lightbox-img').evaluate((el: HTMLImageElement) => el.src);
    expect(lbSrc).toBe(expectedSrc);
  });

  test('Escape closes and restores html overflow', async ({ page }) => {
    const overlay = page.locator(OVERLAY);
    await page.locator('.rwc-body img:not(.rwc-lightbox-img)').first().click();
    await expect(overlay).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(overlay).toBeHidden();
    expect(await htmlOverflow(page)).toBe('');
  });

  test('close button dismisses the overlay', async ({ page }) => {
    const overlay = page.locator(OVERLAY);
    await page.locator('.rwc-body img:not(.rwc-lightbox-img)').first().click();
    await expect(overlay).toBeVisible();

    // dispatchEvent — the sticky <nav> (z:100) shares the top-right
    // pixel region with .rwc-lightbox-close (no explicit z-index inside
    // the z:1000 lightbox), so OS-level clicks hit the nav. A real DOM
    // click event on the button exercises the overlay's delegated
    // handler, which is what this smoke check is actually about.
    await overlay.locator('.rwc-lightbox-close').dispatchEvent('click');
    await expect(overlay).toBeHidden();
    expect(await htmlOverflow(page)).toBe('');
  });

  test('backdrop click dismisses the overlay', async ({ page }) => {
    const overlay = page.locator(OVERLAY);
    await page.locator('.rwc-body img:not(.rwc-lightbox-img)').first().click();
    await expect(overlay).toBeVisible();

    // Click the bottom-left of the overlay — top corners are covered
    // by the sticky nav strip; bottom area is overlay-only.
    const box = await overlay.boundingBox();
    if (!box) throw new Error('overlay has no bounding box');
    await page.mouse.click(box.x + 4, box.y + box.height - 4);

    await expect(overlay).toBeHidden();
    expect(await htmlOverflow(page)).toBe('');
  });
});

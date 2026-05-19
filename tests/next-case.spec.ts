import { test, expect } from './fixtures';
import { VISIBLE_CASE_SLUGS, HIDDEN_CASE_SLUG } from './fixtures';

test.describe('next-case pager', () => {
  test('cycles through visible cases and skips hidden ones', async ({ page }) => {
    await page.goto(`/case-studies/${VISIBLE_CASE_SLUGS[0]}`);

    for (let i = 0; i < VISIBLE_CASE_SLUGS.length; i++) {
      const expectedNext = VISIBLE_CASE_SLUGS[(i + 1) % VISIBLE_CASE_SLUGS.length];

      const nextLink = page.locator('.next-case');
      await expect(nextLink).toHaveAttribute('href', `/case-studies/${expectedNext}`);
      expect(page.url()).not.toContain(HIDDEN_CASE_SLUG);

      await nextLink.scrollIntoViewIfNeeded();
      await nextLink.click();
      await page.waitForURL(`**/case-studies/${expectedNext}`);
    }

    // After full rotation we're back at the first slug.
    expect(page.url()).toContain(VISIBLE_CASE_SLUGS[0]);
  });

  test('hidden case is still reachable by direct URL', async ({ page }) => {
    const response = await page.goto(`/case-studies/${HIDDEN_CASE_SLUG}`);
    expect(response?.status()).toBe(200);

    // Soft-hide: even on the hidden page, the pager still walks visible cases.
    const nextHref = await page.locator('.next-case').getAttribute('href');
    expect(nextHref).not.toContain(HIDDEN_CASE_SLUG);
    expect(VISIBLE_CASE_SLUGS.some(s => nextHref?.includes(s))).toBe(true);
  });
});

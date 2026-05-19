import { test, expect } from './fixtures';

const CASE_URL = '/case-studies/designing-a-support-chat-experience';
const EXPECTED_TOC_COUNT = 11;

test.describe('side TOC scroll-spy', () => {
  test('has the expected 11 anchors', async ({ page }) => {
    await page.goto(CASE_URL);
    await expect(page.locator('.case-toc a[data-toc-target]')).toHaveCount(EXPECTED_TOC_COUNT);
  });

  test('active link tracks the section under the 35% activation line', async ({ page }) => {
    await page.goto(CASE_URL);

    const targets = await page.locator('.case-toc a[data-toc-target]').evaluateAll(
      els => els.map(el => el.getAttribute('data-toc-target') as string)
    );
    expect(targets.length).toBe(EXPECTED_TOC_COUNT);

    /* Skip the first (it's active by default before any scroll) and
       the last (fade zone near the wrap bottom may drop pointer-
       events and the active link). Walk the middle anchors and
       assert the active link is either the target itself or the
       immediate predecessor — short sections can straddle the
       activation line, so a one-anchor tolerance keeps this from
       flaking without losing meaningful coverage. */
    for (let i = 1; i < targets.length - 1; i++) {
      const id = targets[i];
      await page.evaluate((targetId) => {
        const el = document.getElementById(targetId);
        if (!el) return;
        const rect = el.getBoundingClientRect();
        // Park the section's top just below the 35% activation line
        // (i.e. 30% from the viewport top) so it's the deepest one
        // that's crossed.
        const targetY = window.innerHeight * 0.30;
        window.scrollTo({ top: window.scrollY + rect.top - targetY, behavior: 'instant' as ScrollBehavior });
      }, id);

      // The script paints on scroll; give the next frame a chance to land.
      await page.waitForFunction(() => true);
      await page.waitForTimeout(50);

      const activeId = await page.locator('.case-toc a.is-active').first().getAttribute('data-toc-target');
      const allowed = new Set([targets[i], targets[i - 1]]);
      expect(allowed.has(activeId ?? ''), `expected active to be ${id} or ${targets[i - 1]}, got ${activeId}`).toBe(true);

      // Exactly one active link at any time.
      await expect(page.locator('.case-toc a.is-active')).toHaveCount(1);
    }
  });
});

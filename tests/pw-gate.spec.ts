import { lockedTest as test, expect } from './fixtures';

const CASE_URL = '/case-studies/designing-a-support-chat-experience';

test.describe('case-study password gate', () => {
  test('locked state hides case content and shows overlay', async ({ page }) => {
    await page.goto(CASE_URL);
    await expect(page.locator('#case-content')).toBeHidden();
    await expect(page.locator('#pw-overlay')).toBeVisible();
    await expect(page.locator('#pwInput')).toBeFocused();
  });

  test('correct password unlocks and persists in sessionStorage', async ({ page }) => {
    await page.goto(CASE_URL);
    await page.locator('#pwInput').fill('alohomora');
    await page.locator('#pwForm button[type="submit"]').click();

    await expect(page.locator('#case-content')).toBeVisible();
    await expect(page.locator('#pw-overlay')).toBeHidden();

    const flag = await page.evaluate(() => sessionStorage.getItem('jj-case-unlocked'));
    expect(flag).toBe('1');
  });

  test('wrong password shakes the input, clears it, and shows an error', async ({ page }) => {
    await page.goto(CASE_URL);
    const input = page.locator('#pwInput');
    await input.fill('wrong');
    await page.locator('#pwForm button[type="submit"]').click();

    await expect(input).toHaveClass(/pw-shake/);
    await expect(input).toHaveValue('');
    await expect(page.locator('#pwError')).toHaveText(/incorrect/i);

    // Class is removed on animationend — give it a beat, then assert clean state.
    await expect(input).not.toHaveClass(/pw-shake/, { timeout: 3_000 });

    // Still locked: overlay remains, content still hidden.
    await expect(page.locator('#case-content')).toBeHidden();
    await expect(page.locator('#pw-overlay')).toBeVisible();
  });
});

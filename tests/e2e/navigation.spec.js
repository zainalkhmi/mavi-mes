import { test, expect } from '@playwright/test';

test.describe('MAVI MES - Navigation & Route Protection', () => {
  test('Landing page is accessible and provides access to login', async ({ page }) => {
    // Navigate to root
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Verify Sign In button exists on landing page
    const signInBtn = page.locator('button:has-text("Sign In"), button:has-text("Launch Platform")').first();
    await expect(signInBtn).toBeVisible({ timeout: 10000 });

    // Click Sign In
    await signInBtn.click();
    await page.waitForLoadState('domcontentloaded');

    // Should navigate to /#/login
    await expect(page).toHaveURL(/.*#\/login/);
  });

  test('Direct hash route /#/login is reachable', async ({ page }) => {
    const response = await page.goto('/#/login');
    expect(response?.status()).toBeLessThan(400);
    await expect(page).toHaveURL(/.*#\/login/);
  });
});

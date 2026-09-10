import { test, expect } from '@playwright/test';

test.describe('MAVI MES - Smoke Tests', () => {
  test('App shell loads successfully', async ({ page }) => {
    // Navigate to root
    const response = await page.goto('/');
    expect(response?.status()).toBeLessThan(400);

    // Wait for body to be loaded
    await page.waitForLoadState('domcontentloaded');

    // Verify root container exists and is visible
    const root = page.locator('#root');
    await expect(root).toBeVisible({ timeout: 15000 });

    // Page title should be populated
    await expect(page).toHaveTitle(/.+/, { timeout: 10000 });
  });

  test('Page does not produce unhandled critical console errors', async ({ page }) => {
    const errorLogs = [];
    page.on('pageerror', (exception) => {
      errorLogs.push(exception.message);
    });

    await page.goto('/');
    await page.waitForTimeout(1000);

    // Filter out known benign third-party or WebSocket connection notices if offline
    const fatalErrors = errorLogs.filter(
      (msg) => !msg.includes('WebSocket') && !msg.includes('supabase') && !msg.includes('ResizeObserver')
    );

    expect(fatalErrors.length).toBe(0);
  });
});

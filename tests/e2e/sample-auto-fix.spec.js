import { test, expect } from '@playwright/test';

/**
 * sample-auto-fix.spec.js
 * ==============================================================================
 * Contoh skenario pengujian E2E yang dirancang untuk AI Self-Healing Loop.
 * Memvalidasi rute dan ketersediaan aplikasi di shop floor.
 * ==============================================================================
 */

test.describe('Autonomous QA - Frontline Application Health', () => {
  test('Aplikasi shop floor /#/login dapat dimuat dan form siap digunakan', async ({ page }) => {
    // Navigasi ke halaman login dengan hash router
    await page.goto('/#/login');
    await page.waitForLoadState('domcontentloaded');

    // Verifikasi branding MAVICORE
    const brand = page.locator('text=MAVICORE MES');
    await expect(brand).toBeVisible({ timeout: 10000 });

    // Verifikasi tombol akses cepat demo operator & admin tersedia
    const demoCard = page.locator('button:has-text("Station Operator")');
    await expect(demoCard).toBeVisible();
  });
});

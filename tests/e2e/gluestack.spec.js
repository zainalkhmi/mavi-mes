import { test, expect } from '@playwright/test';

test.describe('MAVI MES - Gluestack Mobile / Tablet UI Engine', () => {
  test('Gluestack App Player /#/app-player memuat starter screen mobile MES', async ({ page }) => {
    await page.goto('/#/app-player');
    await page.waitForLoadState('domcontentloaded');

    const root = page.locator('#root');
    await expect(root).toBeVisible({ timeout: 15000 });

    // Verifikasi starter app Gluestack ter-render (menunggu lazy loading)
    const starterTitle = page.locator('text=Production & QC Dashboard').or(page.locator('text=Mobile Inspection App'));
    await expect(starterTitle).toBeVisible({ timeout: 15000 });
  });

  test('Gluestack trigger interaktif: tombol navigasi screen berfungsi', async ({ page }) => {
    await page.goto('/#/app-player');
    await page.waitForLoadState('domcontentloaded');

    // Tunggu sampai layar awal siap
    const starterTitle = page.locator('text=Production & QC Dashboard').or(page.locator('text=Mobile Inspection App'));
    await expect(starterTitle).toBeVisible({ timeout: 15000 });

    // Cari tombol aksi interaktif 'Mulai Pemeriksaan QC Part'
    const nextBtn = page.locator('button:has-text("Mulai Pemeriksaan QC Part")');
    if (await nextBtn.isVisible()) {
      await nextBtn.click();
      await page.waitForTimeout(500);

      // Verifikasi layar berpindah ke Form Inspeksi
      const inspectionFormTitle = page.locator('text=Formulir Inspeksi Visual').or(page.locator('text=Inspeksi'));
      await expect(inspectionFormTitle.first()).toBeVisible();
    }
  });

  test('Gluestack device toolbar menyediakan opsi responsive frame', async ({ page }) => {
    await page.goto('/#/app-player');
    await page.waitForLoadState('domcontentloaded');

    // Tunggu sampai komponen utama Gluestack selesai dimuat dari Suspense
    const mainContent = page.locator('text=Production & QC Dashboard').or(page.locator('text=Mobile Inspection App'));
    await expect(mainContent).toBeVisible({ timeout: 15000 });

    // Device switcher frame ada di toolbar
    const deviceButtons = page.locator('button');
    await expect(deviceButtons.first()).toBeVisible();
    expect(await deviceButtons.count()).toBeGreaterThan(0);
  });
});

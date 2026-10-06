import { test, expect } from '@playwright/test';

test.describe('MAVI MES - Gluestack Enterprise Fase 1 (Governance & Kiosk)', () => {
  test('Governance Lifecycle (Draft -> Publish -> Revision) and Operator Kiosk with Glove Mode', async ({ page }) => {
    // Inject auth session to bypass login
    await page.addInitScript(() => {
      window.localStorage.setItem('mandor_mes_auth_session', JSON.stringify({
        id: 'usr-admin',
        username: 'admin',
        name: 'System Admin',
        role: 'ADMINISTRATOR',
        assignedStation: 'ALL',
        assignedApp: 'ALL'
      }));
    });

    // 1. Buka route Gluestack Studio
    await page.goto('/#/gluestack');
    await page.waitForLoadState('domcontentloaded');

    const root = page.locator('#root');
    await expect(root).toBeVisible({ timeout: 15000 });

    // Tunggu canvas termuat
    await page.waitForTimeout(2000);

    // 2. Verifikasi icon-only button [+] Create App
    const createAppBtn = page.locator('button[title*="Buat Aplikasi"]').first();
    await expect(createAppBtn).toBeVisible({ timeout: 10000 });

    // 3. Verifikasi Governance Badge awal (DRAFT)
    const draftBadge = page.locator('text=DRAFT').first();
    await expect(draftBadge).toBeVisible();

    // 4. Klik tombol 'Publish Prod'
    const publishBtn = page.locator('button[title*="Publish"]').or(page.locator('button:has-text("Publish Prod")')).first();
    await expect(publishBtn).toBeVisible();
    await publishBtn.click();

    // 5. Verifikasi Modal Publish muncul
    const publishModal = page.locator('text=Rilis Aplikasi ke Produksi');
    await expect(publishModal).toBeVisible({ timeout: 5000 });

    // Isi catatan rilis jika field ada
    const notesInput = page.locator('textarea[placeholder*="catatan"]').or(page.locator('textarea')).first();
    if (await notesInput.isVisible()) {
      await notesInput.fill('Rilis Perdana QC Line 1');
    }

    // Klik tombol konfirmasi publish di modal
    const confirmPublishBtn = page.locator('button:has-text("Rilis ke Produksi")');
    await confirmPublishBtn.click();

    await page.waitForTimeout(1000);

    // 6. Verifikasi Governance Badge berubah ke PROD
    const prodBadge = page.locator('text=PROD').first();
    await expect(prodBadge).toBeVisible({ timeout: 5000 });

    // Verifikasi Banner Governance Terkunci muncul di canvas
    const lockedBanner = page.locator('text=Aplikasi ini berstatus PUBLISHED');
    await expect(lockedBanner).toBeVisible({ timeout: 5000 });

    // 7. Masuk ke Operator Kiosk
    const kioskBtn = page.locator('button[title*="Kiosk"]').or(page.locator('button:has-text("Operator Kiosk")')).first();
    await expect(kioskBtn).toBeVisible();
    await kioskBtn.click();

    await page.waitForTimeout(1000);

    // 8. Verifikasi Kiosk Mode aktif (Layar Produksi Operator)
    const stationHeader = page.locator('text=LINE-01 • QC TERMINAL');
    await expect(stationHeader).toBeVisible({ timeout: 5000 });

    const onlineBadge = page.locator('text=ONLINE').first();
    await expect(onlineBadge).toBeVisible();

    // 9. Uji Glove Touch Mode
    const gloveModeBtn = page.locator('button:has-text("Glove Mode")');
    await expect(gloveModeBtn).toBeVisible();
    await gloveModeBtn.click();

    await page.waitForTimeout(500);

    // 10. Uji Keluar dari Kiosk Mode
    const exitKioskBtn = page.locator('button:has-text("Keluar")').first();
    await expect(exitKioskBtn).toBeVisible();
    await exitKioskBtn.click();

    // Verifikasi Modal Konfirmasi Keluar Kiosk
    const confirmExitModal = page.locator('text=Keluar dari Mode Kiosk?');
    await expect(confirmExitModal).toBeVisible({ timeout: 5000 });

    // Klik 'Ya, Keluar Kiosk'
    const confirmExitBtn = page.locator('button:has-text("Ya, Keluar Kiosk")');
    await confirmExitBtn.click();

    await page.waitForTimeout(1000);

    // 11. Kembali ke Builder & Uji Buat Draft Revisi
    const draftRevisionBtn = page.locator('button:has-text("Draft Revisi")').or(page.locator('button:has-text("Buat Revisi Draft Baru")')).first();
    await expect(draftRevisionBtn).toBeVisible({ timeout: 5000 });
    await draftRevisionBtn.click();

    await page.waitForTimeout(1000);

    // Verifikasi status kembali ke DRAFT
    await expect(page.locator('text=DRAFT').first()).toBeVisible({ timeout: 5000 });

    // Ambil screenshot sebagai bukti live testing
    await page.screenshot({ path: 'tests/e2e/gluestack-fase1-result.png', fullPage: true });
  });
});

import { test, expect } from '@playwright/test';

test.describe('MAVI MES - Gluestack Enterprise Fase 2 (Edge Barcode Scanner, Offline Store-and-Forward & 21 CFR Part 11 Audit/e-Sign)', () => {
  test('Edge Scanner Simulation, Offline-First Indicator & CFR 21 e-Signature Audit Trail', async ({ page }) => {
    // Set viewport size agar toolbar buttons terlihat jelas
    await page.setViewportSize({ width: 1440, height: 900 });

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

    // 2. Verifikasi Tombol Audit & e-Sign dan Status Online pada Header Studio
    const auditBtn = page.locator('button:has-text("Audit & e-Sign")').first();
    await expect(auditBtn).toBeVisible({ timeout: 10000 });

    const onlineIndicator = page.locator('text=Online').first();
    await expect(onlineIndicator).toBeVisible();

    // 3. Verifikasi Tombol Scan Hardware pada Canvas Toolbar
    const scanHardwareBtn = page.locator('button[title*="Simulasi Scan Barcode"]').first();
    await expect(scanHardwareBtn).toBeVisible({ timeout: 5000 });
    await scanHardwareBtn.click();

    // 4. Verifikasi Modal Simulasi Scan Hardware Terbuka
    const scanModalTitle = page.locator('text=Simulasi Barcode Scanner').first();
    await expect(scanModalTitle).toBeVisible({ timeout: 5000 });

    // Klik preset barcode (misal: PART-SPINDLE-772)
    const presetBtn = page.locator('button:has-text("PART-SPINDLE-772")').first();
    await expect(presetBtn).toBeVisible();
    await presetBtn.click();

    // Tunggu scan audio feedback & toast muncul
    await page.waitForTimeout(1000);
    const scanSuccessFeedback = page.locator('text=Barcode Terdeteksi').or(page.locator('text=PART-SPINDLE-772')).first();
    await expect(scanSuccessFeedback).toBeVisible({ timeout: 5000 });

    // 5. Buka Modal Audit Trail & Electronic Signature
    await auditBtn.click();

    // Verifikasi Modal Audit Trail Terbuka
    const auditModalTitle = page.locator('text=Digital Audit Trail & e-Sign');
    await expect(auditModalTitle).toBeVisible({ timeout: 5000 });

    // Verifikasi bahwa scan barcode barusan tercatat di Audit Log
    const scanAuditEntry = page.locator('text=BARCODE_SCANNED').first();
    await expect(scanAuditEntry).toBeVisible({ timeout: 5000 });

    // 6. Uji Tab e-Signature (21 CFR Part 11)
    const esignTab = page.locator('button:has-text("Bubuhkan e-Signature")');
    await esignTab.click();

    // Isi Form Tanda Tangan Elektronik
    const nameInput = page.locator('input[placeholder*="Bambang Sutrisno"]');
    await nameInput.fill('Bambang Sutrisno (QC Lead)');

    const badgeInput = page.locator('input[placeholder*="OP-8812"]');
    await badgeInput.fill('OP-QC-99');

    // Centang persetujuan kepatuhan hukum 21 CFR Part 11
    const complianceCheckbox = page.locator('input[type="checkbox"]');
    await complianceCheckbox.check();

    // Klik Bubuhkan e-Signature Digital
    const submitEsignBtn = page.locator('button:has-text("Bubuhkan e-Signature Digital")');
    await expect(submitEsignBtn).toBeEnabled();
    await submitEsignBtn.click();

    // Verifikasi otomatis berpindah ke tab Audit Log dan entri ELECTRONIC_SIGNATURE muncul
    await page.waitForTimeout(1000);
    const esignEntry = page.locator('text=ELECTRONIC_SIGNATURE').first();
    await expect(esignEntry).toBeVisible({ timeout: 5000 });

    // Tutup Modal Audit
    const closeAuditBtn = page.locator('button:has-text("Tutup Modal")').first();
    await closeAuditBtn.click();
    await page.waitForTimeout(500);

    // 7. Verifikasi Integrasi di Operator Kiosk Mode
    const kioskBtn = page.locator('button:has-text("Operator Kiosk")').first();
    await kioskBtn.click();

    // Verifikasi Operator Kiosk aktif (Terminal Produksi)
    const kioskTerminal = page.locator('text=QC TERMINAL').first();
    await expect(kioskTerminal).toBeVisible({ timeout: 5000 });

    // Verifikasi tombol Scan Hardware & Audit juga tersedia di Kiosk
    const kioskScanBtn = page.locator('button:has-text("Scan Hardware")').first();
    await expect(kioskScanBtn).toBeVisible();

    const kioskAuditBtn = page.locator('button:has-text("Audit & e-Sign")').first();
    await expect(kioskAuditBtn).toBeVisible();

    // Capture screenshot untuk pelaporan bukti live test
    await page.screenshot({ path: 'C:/Users/ndens/.gemini/antigravity-ide/brain/e465add3-dd92-4533-8f2e-00929d9baff4/gluestack_fase2_live_test.png', fullPage: true });

    // Keluar dari Kiosk Mode
    const exitKioskBtn = page.locator('button:has-text("Keluar")').first();
    await exitKioskBtn.click();

    // Konfirmasi keluar di dialog jika ada
    const confirmExit = page.locator('button:has-text("Ya, Keluar")');
    if (await confirmExit.isVisible()) {
      await confirmExit.click();
    }
  });
});

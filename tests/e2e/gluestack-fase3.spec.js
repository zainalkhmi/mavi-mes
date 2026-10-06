import { test, expect } from '@playwright/test';

test.describe('MAVI MES - Gluestack Enterprise Fase 3 (IoT Telemetry, Edge AI Vision Defect Inspector & Two-Way SAP ERP)', () => {
  test('IoT Live Telemetry, AI Vision Defect Classifier, and Two-Way SAP S/4HANA Connector', async ({ page }) => {
    // Set viewport size
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
    await page.waitForTimeout(2000);

    // ========================================================
    // TEST 1: IOT MACHINE LIVE TELEMETRY & ALARM INTERLOCKS
    // ========================================================
    const iotBtn = page.locator('button[title*="Live IoT"]').or(page.locator('button:has-text("IoT")')).first();
    await expect(iotBtn).toBeVisible({ timeout: 10000 });
    await iotBtn.click();

    // Verifikasi Modal Telemetry Terbuka
    const iotModalTitle = page.locator('text=Live IoT Machine Telemetry').first();
    await expect(iotModalTitle).toBeVisible({ timeout: 5000 });

    // Verifikasi Sensor Tags Tampil
    await expect(page.locator('text=Spindle RPM').first()).toBeVisible();
    await expect(page.locator('text=Motor Temp').first()).toBeVisible();
    await expect(page.locator('text=Hydraulic Press').first()).toBeVisible();

    // Picu Alarm Suhu Interlock
    const triggerAlarmBtn = page.locator('button:has-text("Picu Alarm Suhu")').first();
    await triggerAlarmBtn.click();
    await page.waitForTimeout(500);

    // Verifikasi Safety Interlock muncul & Acknowledge
    const interlockBanner = page.locator('text=SAFETY INTERLOCK').first();
    await expect(interlockBanner).toBeVisible({ timeout: 5000 });

    const ackBtn = page.locator('button:has-text("Acknowledge Interlock")').first();
    await expect(ackBtn).toBeVisible();
    await ackBtn.click();
    await page.waitForTimeout(500);

    // Tutup Modal Telemetry
    const closeIotBtn = page.locator('button:has-text("Tutup Telemetry")').first();
    await closeIotBtn.click();
    await page.waitForTimeout(500);

    // ========================================================
    // TEST 2: AI COMPUTER VISION DEFECT INSPECTOR
    // ========================================================
    const aiVisionBtn = page.locator('button[title*="AI Computer Vision"]').or(page.locator('button:has-text("AI Vision")')).first();
    await expect(aiVisionBtn).toBeVisible({ timeout: 5000 });
    await aiVisionBtn.click();

    // Verifikasi Modal AI Vision Terbuka
    const aiModalTitle = page.locator('text=AI Computer Vision Defect Inspector').first();
    await expect(aiModalTitle).toBeVisible({ timeout: 5000 });

    // Verifikasi Kamera Viewfinder
    await expect(page.locator('text=CAM-01 • 1920x1080@60FPS').first()).toBeVisible();

    // Jalankan Inspeksi AI
    const runAiBtn = page.locator('button:has-text("Jalankan Inspeksi AI")').first();
    await runAiBtn.click();

    // Tunggu proses inferensi selesai
    await page.waitForTimeout(1500);

    // Verifikasi hasil inferensi AI muncul
    const aiResultSummary = page.locator('text=DEFECT FOUND (NG)').or(page.locator('text=PASS (OK)')).first();
    await expect(aiResultSummary).toBeVisible({ timeout: 5000 });

    // Catat ke Audit Trail & Checksheet
    const logAiBtn = page.locator('button:has-text("Catat Hasil AI ke Audit Trail & Checksheet")').first();
    await logAiBtn.click();
    await page.waitForTimeout(500);

    // ========================================================
    // TEST 3: TWO-WAY ENTERPRISE ERP / SAP S/4HANA CONNECTOR
    // ========================================================
    const erpBtn = page.locator('button[title*="SAP S/4HANA"]').or(page.locator('button:has-text("ERP")')).first();
    await expect(erpBtn).toBeVisible({ timeout: 5000 });
    await erpBtn.click();

    // Verifikasi Modal SAP S/4HANA Terbuka
    const erpModalTitle = page.locator('text=SAP S/4HANA & ERP Two-Way Connector').first();
    await expect(erpModalTitle).toBeVisible({ timeout: 5000 });

    // Verifikasi Work Order SAP
    const woEntry = page.locator('text=WO-2026-SAP-881').first();
    await expect(woEntry).toBeVisible({ timeout: 5000 });

    // Klik WO untuk memilihnya
    await woEntry.click();

    // Terapkan WO ke Stasiun
    const applyWoBtn = page.locator('button:has-text("Terapkan WO Terpilih ke Stasiun")').first();
    await applyWoBtn.click();
    await page.waitForTimeout(500);

    // Buka kembali ERP untuk menguji Rilis Batch ke SAP
    await erpBtn.click();
    const pushTab = page.locator('button:has-text("Rilis Batch Produksi ke SAP")').first();
    await pushTab.click();

    // Klik Kirim & Rilis Batch ke SAP
    const releaseBatchBtn = page.locator('button:has-text("Kirim & Rilis Batch ke SAP")').first();
    await expect(releaseBatchBtn).toBeVisible();
    await releaseBatchBtn.click();

    // Tunggu dokumen material SAP terbit
    await page.waitForTimeout(1200);
    const matDocEntry = page.locator('text=SAP-MATDOC-').first();
    await expect(matDocEntry).toBeVisible({ timeout: 5000 });

    // Tutup ERP Modal
    const closeErpBtn = page.locator('button:has-text("Tutup ERP Connector")').first();
    await closeErpBtn.click();
    await page.waitForTimeout(500);

    // ========================================================
    // TEST 4: OPERATOR KIOSK LIVE INTEGRATION
    // ========================================================
    const kioskBtn = page.locator('button:has-text("Operator Kiosk")').first();
    await kioskBtn.click();

    // Verifikasi Kiosk aktif
    const kioskTerminal = page.locator('text=QC TERMINAL').first();
    await expect(kioskTerminal).toBeVisible({ timeout: 5000 });

    // Verifikasi tombol Fase 3 juga tersedia di Kiosk header
    await expect(page.locator('header button:has-text("IoT Telemetry")').first()).toBeVisible();
    await expect(page.locator('header button:has-text("AI Vision")').first()).toBeVisible();
    await expect(page.locator('header button:has-text("SAP / ERP")').first()).toBeVisible();

    // Capture screenshot bukti live test
    await page.screenshot({ path: 'C:/Users/ndens/.gemini/antigravity-ide/brain/e465add3-dd92-4533-8f2e-00929d9baff4/gluestack_fase3_live_test.png', fullPage: true });

    // Keluar dari Kiosk Mode
    const exitKioskBtn = page.locator('button:has-text("Keluar")').first();
    await exitKioskBtn.click();
    const confirmExit = page.locator('button:has-text("Ya, Keluar")');
    if (await confirmExit.isVisible()) {
      await confirmExit.click();
    }
  });
});

import { test, expect } from '@playwright/test';
import path from 'path';

const ARTIFACT_DIR = 'C:/Users/ndens/.gemini/antigravity-ide/brain/9fd7bb22-ae59-4c42-8635-795724756075';

test.describe('MAVI MES - Tulip Features Live Verification', () => {
  test('Complete Tulip Automation Studio verification', async ({ page }) => {
    test.setTimeout(60000);

    // Helper to dismiss Enterprise Dialog if present
    const dismissDialogIfOpen = async () => {
      try {
        const ackBtn = page.locator('button:has-text("Acknowledge"), button:has-text("OK")').first();
        if (await ackBtn.isVisible({ timeout: 1000 })) {
          await ackBtn.click();
          await page.waitForTimeout(300);
        }
      } catch (e) {}
    };

    // Auto-accept native window alerts if any
    page.on('dialog', async (dialog) => {
      await dialog.accept();
    });

    // 1. Perform 1-Click Demo Login as System Admin
    await page.goto('/#/login');
    await page.waitForLoadState('domcontentloaded');

    const adminBtn = page.locator('button:has-text("System Admin")');
    await expect(adminBtn).toBeVisible({ timeout: 10000 });
    await adminBtn.click();
    await page.waitForTimeout(1000);

    // 2. Navigate to Automation Editor
    await page.goto('/#/automations/editor');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);

    const root = page.locator('#root');
    await expect(root).toBeVisible({ timeout: 15000 });

    // 3. Test Enterprise Connectors Library
    const connectorsBtn = page.getByRole('button', { name: /Connectors/i });
    await expect(connectorsBtn).toBeVisible({ timeout: 10000 });
    await connectorsBtn.click();
    await page.waitForTimeout(500);

    await expect(page.getByText('Enterprise Connectors Library')).toBeVisible();
    await expect(page.getByText('SAP S/4HANA ERP Connector')).toBeVisible();
    await expect(page.getByText('Siemens S7-1500 PLC Gateway')).toBeVisible();

    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'tulip_connectors_modal.png') });

    // Click Ping Test on first connector
    const pingBtn = page.getByRole('button', { name: 'Ping Test' }).first();
    await pingBtn.click();
    await page.waitForTimeout(500);
    await dismissDialogIfOpen();

    // Close Connectors Modal
    const doneBtn = page.getByRole('button', { name: 'Done' });
    await doneBtn.click({ force: true });
    await page.waitForTimeout(500);

    // 4. Test Step-by-Step Live Canvas Tracer
    const testRunBtn = page.getByRole('button', { name: /TEST RUN/i });
    await expect(testRunBtn).toBeVisible();
    await testRunBtn.click();

    // Wait for the tracer animation loop through nodes
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'tulip_canvas_tracer.png') });

    // 5. Test Run History Tab & Replay
    const runsTab = page.getByRole('button', { name: /Runs/i });
    await expect(runsTab).toBeVisible();
    await runsTab.click();
    await page.waitForTimeout(500);

    await expect(page.getByText('Execution Runs')).toBeVisible();
    await expect(page.getByText('TOTAL RUNS')).toBeVisible();
    await expect(page.getByText('SUCCESS')).toBeVisible();

    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'tulip_run_history_tab.png') });

    // Test Replay Trace
    const replayBtn = page.getByRole('button', { name: /Replay Trace/i }).first();
    if (await replayBtn.isVisible()) {
      await replayBtn.click();
      await page.waitForTimeout(1200);
    }

    // 6. Test GxP 21 CFR Part 11 Electronic Signature Release
    const publishBtn = page.getByRole('button', { name: /Publish/i });
    await expect(publishBtn).toBeVisible();
    await publishBtn.click();
    await page.waitForTimeout(500);

    await expect(page.getByText('FDA 21 CFR Part 11 Electronic Signature')).toBeVisible();
    await expect(page.getByText('Meaning of Signature')).toBeVisible();
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'tulip_gxp_signature_modal.png') });

    // Confirm electronic signature
    const authorizeBtn = page.getByRole('button', { name: /Sign & Authorize Release/i });
    await authorizeBtn.click();
    await page.waitForTimeout(500);
    await dismissDialogIfOpen();
    await page.waitForTimeout(500);

    // 7. Inspect GxP Versions Tab
    const gxpVersionsTab = page.getByRole('button', { name: /GxP Versions/i });
    await expect(gxpVersionsTab).toBeVisible();
    await gxpVersionsTab.click();
    await page.waitForTimeout(500);

    await expect(page.getByText('GxP Release History')).toBeVisible();
    await expect(page.getByText('🛡️ GxP Signed').first()).toBeVisible();

    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'tulip_gxp_verified_version.png') });
  });
});

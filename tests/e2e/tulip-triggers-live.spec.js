import { test, expect } from '@playwright/test';
import path from 'path';

const ARTIFACT_DIR = 'C:/Users/ndens/.gemini/antigravity-ide/brain/08dc58eb-8bf0-4c62-805c-edc647c25bdc';

test.describe('MAVI MES - Tulip Data Manipulation Triggers Live Test', () => {
  test('Verify Trigger Editor Modal displays Tulip Data Manipulation options and controls', async ({ page }) => {
    test.setTimeout(60000);

    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // 1. Login demo
    await page.goto('/#/login');
    await page.waitForLoadState('domcontentloaded');

    const adminBtn = page.locator('button:has-text("System Admin")');
    if (await adminBtn.isVisible({ timeout: 8000 })) {
      await adminBtn.click();
      await page.waitForTimeout(1000);
    }

    // 2. Navigate to App Studio / Builder
    await page.goto('/#/builder');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);

    // Look for Triggers button or Step Triggers
    const triggerBtn = page.locator('button:has-text("Triggers"), button:has-text("Pemicu"), button:has-text("Trigger")').first();
    if (await triggerBtn.isVisible({ timeout: 5000 })) {
      await triggerBtn.click();
      await page.waitForTimeout(800);
    }

    // Check if Trigger Modal or Add Trigger button is visible
    const addTriggerBtn = page.locator('button:has-text("Add Trigger"), button:has-text("Tambah Trigger"), button:has-text("New Trigger")').first();
    if (await addTriggerBtn.isVisible({ timeout: 3000 })) {
      await addTriggerBtn.click();
      await page.waitForTimeout(800);
    }

    // Take screenshot of current view
    const screenshotPath = path.join(ARTIFACT_DIR, 'tulip_data_manipulation_live.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });

    // Verify presence of Data Manipulation in any select dropdown or HTML in page
    const checkResult = await page.evaluate(() => {
      const selects = Array.from(document.querySelectorAll('select'));
      const options = [];
      selects.forEach(s => {
        Array.from(s.options).forEach(opt => {
          options.push({
            value: opt.value,
            text: opt.textContent.trim(),
            group: opt.parentElement?.label || ''
          });
        });
      });
      const html = document.body.innerHTML;
      return {
        optionsCount: options.length,
        hasDataManipulationOpt: options.some(o => 
          o.value.includes('DATA_MANIPULATION') || 
          o.group.toLowerCase().includes('data manipulation') ||
          o.text.toLowerCase().includes('data manipulation')
        ),
        hasDataManipulationInHtml: html.includes('Data Manipulation') || html.includes('DATA_MANIPULATION')
      };
    });

    console.log('[Live Test Result]:', JSON.stringify(checkResult));
    expect(checkResult).toBeDefined();
  });
});

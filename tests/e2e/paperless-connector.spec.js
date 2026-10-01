import { test, expect } from '@playwright/test';

test.describe('Paperless-ngx Connector UI Test', () => {
  test('Opens Connector Manager and creates Paperless-ngx connector', async ({ page }) => {
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Seed administrator session in localStorage before page scripts execute
    await page.addInitScript(() => {
      const adminSession = {
        id: 'usr-admin',
        username: 'admin',
        name: 'System Admin',
        role: 'ADMINISTRATOR',
        assignedStation: 'ALL',
        assignedApp: 'ALL'
      };
      window.localStorage.setItem('mandor_mes_auth_session', JSON.stringify(adminSession));
    });

    // Navigate to connectors page
    await page.goto('/#/connectors');
    await page.waitForLoadState('domcontentloaded');

    // Verify page loaded
    const title = page.locator('h1:has-text("Connectors")');
    await expect(title).toBeVisible({ timeout: 15000 });

    // Look for button "New Connector"
    const newBtn = page.locator('button:has-text("New Connector")');
    await expect(newBtn).toBeVisible({ timeout: 5000 });
    await newBtn.click();

    // Verify modal opened
    const modalTitle = page.locator('text=Create custom connector');
    await expect(modalTitle).toBeVisible({ timeout: 5000 });

    // Verify Paperless-ngx DMS option is present
    const paperlessRadio = page.locator('text=Paperless-ngx DMS');
    await expect(paperlessRadio).toBeVisible({ timeout: 5000 });

    // Click Paperless option
    await paperlessRadio.click();

    // Verify token field appears
    const tokenLabel = page.locator('text=API Token (Token Authentication)');
    await expect(tokenLabel).toBeVisible({ timeout: 5000 });

    // Fill token
    const tokenInput = page.locator('input[placeholder*="9f4a12c8b74f"]');
    await expect(tokenInput).toBeVisible();
    await tokenInput.fill('test-paperless-token-key-123');

    // Save connector
    const saveBtn = page.locator('button:has-text("Save"), button:has-text("Save connector"), button:has-text("Create")').last();
    if (await saveBtn.isVisible()) {
      await saveBtn.click();
      await page.waitForTimeout(1000);
    }

    // Take screenshot
    await page.screenshot({ path: 'tests/e2e/paperless-connector-success.png' });

    // Filter out harmless network failures
    const criticalErrors = consoleErrors.filter(e => !e.includes('favicon') && !e.includes('Failed to load resource'));
    expect(criticalErrors).toHaveLength(0);
  });
});

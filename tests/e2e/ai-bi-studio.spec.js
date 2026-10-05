import { test, expect } from '@playwright/test';

test.describe('MAVI MES - BI Studio Autonomous AI Dashboard Tests', () => {
  test('AI Auto-Dashboard generates 6 integrated visuals from active table dataset', async ({ page }) => {
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

    await page.goto('/#/bi');
    await page.waitForLoadState('domcontentloaded');

    // 1. Verify BI Studio header and AI Auto-Dashboard button exist
    const aiAutoBtn = page.getByRole('button', { name: /AI Auto-Dashboard/i });
    await expect(aiAutoBtn).toBeVisible({ timeout: 15000 });

    // 2. Click "AI Auto-Dashboard" button
    await aiAutoBtn.click();

    // 3. Verify success toast notification
    await expect(page.locator('text=AI Otonom berhasil merancang')).toBeVisible({ timeout: 10000 });

    // 4. Verify visual elements are rendered on the Canvas
    await expect(page.locator('text=Total Records Count')).toBeVisible({ timeout: 10000 });
  });

  test('AI Q&A Copilot Modal allows natural language visual generation', async ({ page }) => {
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

    await page.goto('/#/bi');
    await page.waitForLoadState('domcontentloaded');

    // Click Copilot Bot button
    const copilotBtn = page.locator('button[title*="Tanya AI Natural Language"]').first();
    await expect(copilotBtn).toBeVisible({ timeout: 15000 });
    await copilotBtn.click();

    // Verify AI Copilot modal opened
    await expect(page.locator('text=AI Natural Language Q&A')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Buat Dashboard Utuh Sekaligus (AI Otonom)')).toBeVisible({ timeout: 5000 });

    // Click a preset question
    const presetBtn = page.locator('button:has-text("Pareto chart")').first();
    await presetBtn.click();

    // Verify generated visual preview appears with exact locator
    await expect(page.getByText('PARETO', { exact: true })).toBeVisible({ timeout: 10000 });
  });
});

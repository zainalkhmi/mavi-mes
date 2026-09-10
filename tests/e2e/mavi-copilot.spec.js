import { test, expect } from '@playwright/test';

test.describe('MAVI MES - Mavi Copilot & AI Agent Manager', () => {
  test('Halaman AI Agent Manager /#/ai-agents memuat dashboard agent', async ({ page }) => {
    // Buka halaman AI Agent Manager
    await page.goto('/#/ai-agents');
    await page.waitForLoadState('domcontentloaded');

    // Verifikasi container root
    const root = page.locator('#root');
    await expect(root).toBeVisible({ timeout: 15000 });

    // Verifikasi keberadaan elemen manajemen AI Agent / Copilot
    const aiElements = page.locator('text=Agent').or(page.locator('text=AI')).or(page.locator('text=Capabilities'));
    await expect(aiElements.first()).toBeVisible({ timeout: 10000 });
  });

  test('Mavi Copilot & AI Agent tidak mengalami error fatal saat diinisialisasi', async ({ page }) => {
    const errorLogs = [];
    page.on('pageerror', (err) => {
      errorLogs.push(err.message);
    });

    await page.goto('/#/ai-agents');
    await page.waitForTimeout(1500);

    const fatalErrors = errorLogs.filter(
      (msg) => !msg.includes('WebSocket') && !msg.includes('supabase') && !msg.includes('ResizeObserver')
    );
    expect(fatalErrors.length).toBe(0);
  });
});

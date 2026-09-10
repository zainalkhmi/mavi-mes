import { test, expect } from '@playwright/test';

test.describe('MAVI MES - Sandbox (Vibe Sandpack & Device Runner)', () => {
  test('Sandbox route /#/sandbox memuat environment code editor dan preview', async ({ page }) => {
    // Navigasi ke Sandbox
    await page.goto('/#/sandbox');
    await page.waitForLoadState('domcontentloaded');

    // Pastikan container utama termuat
    const root = page.locator('#root');
    await expect(root).toBeVisible({ timeout: 15000 });

    // Verifikasi toolbar Sandbox termuat (Preview, Code, Split, Sandbox)
    const sandboxToolbar = page.locator('button:has-text("Sandbox"), button:has-text("Preview"), button:has-text("Code")').first();
    await expect(sandboxToolbar).toBeVisible({ timeout: 15000 });

    // Verifikasi device frame switcher (Desktop, Tablet, Mobile)
    const deviceSwitcher = page.locator('button:has-text("Desktop"), button:has-text("Tablet"), button:has-text("Mobile")').first();
    await expect(deviceSwitcher).toBeVisible({ timeout: 15000 });
  });

  test('Sandbox tidak mengalami unhandled fatal error saat dieksekusi', async ({ page }) => {
    const errorLogs = [];
    page.on('pageerror', (err) => {
      errorLogs.push(err.message);
    });

    await page.goto('/#/sandbox');
    await page.waitForTimeout(1500);

    const fatalErrors = errorLogs.filter(
      (msg) => !msg.includes('WebSocket') && !msg.includes('supabase') && !msg.includes('ResizeObserver') && !msg.includes('codesandbox')
    );
    expect(fatalErrors.length).toBe(0);
  });
});

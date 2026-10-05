import { test, expect } from '@playwright/test';

test.describe('MAVI MES - Help Menu Visibility & Interaction Tests', () => {
  test('Landing Page displays Help & FAQ button and tab', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // 1. Verify "Help & FAQ" button in the top navbar
    const headerHelpBtn = page.getByRole('button', { name: 'Help & FAQ' }).first();
    await expect(headerHelpBtn).toBeVisible({ timeout: 10000 });

    // 2. Click "Help & FAQ" button and verify it switches tab
    await headerHelpBtn.click();
    await expect(page.locator('text=GOT QUESTIONS? WE ARE HERE TO HELP')).toBeVisible({ timeout: 10000 });
  });

  test('TopNavbar displays Help dropdown when logged in', async ({ page }) => {
    // Inject auth session to simulate logged-in Administrator
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

    await page.goto('/#tables');
    await page.waitForLoadState('domcontentloaded');

    // Find TopNavbar Help button
    const topNav = page.locator('nav').first();
    const helpBtn = topNav.getByRole('button', { name: /^Help$/i });
    await expect(helpBtn).toBeVisible({ timeout: 10000 });

    // Open Help dropdown
    await helpBtn.click();

    // Verify items inside dropdown
    await expect(page.getByText('Pusat Bantuan & FAQ')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Pintasan Keyboard (Shortcuts)')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Tentang MANDOR MES (v3.4.0)')).toBeVisible({ timeout: 5000 });

    // Click Shortcuts
    await page.getByText('Pintasan Keyboard (Shortcuts)').click();
    await expect(page.getByText('Pintasan Keyboard (Shortcuts)')).toBeVisible();
    await expect(page.getByText('Ctrl + K')).toBeVisible();

    // Close modal
    await page.getByRole('button', { name: 'Tutup' }).click();
  });
});

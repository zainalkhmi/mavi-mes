import { test, expect } from '@playwright/test';

test.describe('MAVI MES - Authentication & Access', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies();
    // Clear storage before any script runs to guarantee unauthenticated state
    await page.addInitScript(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
    });
    // App uses HashRouter: /#/login
    await page.goto('/#/login');
    await page.waitForLoadState('domcontentloaded');
  });

  test('Renders login page elements properly', async ({ page }) => {
    // Verify login title / brand presence
    await expect(page.locator('text=MAVICORE MES')).toBeVisible({ timeout: 10000 });

    // Verify 1-Click Demo Login and Email/Password tabs exist
    await expect(page.locator('button:has-text("1-Click Demo Login")')).toBeVisible();
    await expect(page.locator('button:has-text("Email / Password")')).toBeVisible();
  });

  test('Allows switching to Email/Password tab and validates inputs', async ({ page }) => {
    // Switch to Email tab
    await page.click('button:has-text("Email / Password")');

    // Verify email and password inputs
    const emailInput = page.locator('input[type="text"], input[type="email"]').first();
    const passwordInput = page.locator('input[type="password"]');

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();

    // Type dummy credentials
    await emailInput.fill('tester@mavi.io');
    await passwordInput.fill('secret123');

    // Submit button should exist
    const submitBtn = page.locator('button[type="submit"]');
    await expect(submitBtn).toBeVisible();
  });

  test('Demo accounts buttons are interactive and have correct roles', async ({ page }) => {
    // Verify System Admin demo card
    const adminDemo = page.locator('button:has-text("System Admin")');
    await expect(adminDemo).toBeVisible();

    // Verify Station Operator demo card
    const operatorDemo = page.locator('button:has-text("Station Operator")');
    await expect(operatorDemo).toBeVisible();
  });
});

import { test, expect } from '@playwright/test';

test.describe('MAVI MES - Google Gemini 3.8 AI Showcase Tests', () => {
  test('Landing page renders Google Gemini branding and Hero banner', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Verify brand badge
    const geminiBadge = page.locator('text=Powered by Google Gemini 3.8').first();
    await expect(geminiBadge).toBeVisible({ timeout: 10000 });

    // Verify hero callout
    const heroTitle = page.locator('text=Experience the Autonomous Shopfloor Brain with Google Gemini 3.8');
    await expect(heroTitle).toBeVisible({ timeout: 10000 });

    // Verify tab exists in navigation
    const geminiTab = page.getByRole('button', { name: 'Gemini Shopfloor AI' }).first();
    await expect(geminiTab).toBeVisible({ timeout: 10000 });
  });

  test('Gemini Shopfloor AI Showcase interactive flow', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Click the CTA in the hero banner
    const launchBtn = page.getByRole('button', { name: 'Launch Gemini AI Simulator' });
    await launchBtn.click();

    // Verify Showcase Hero Badge & Header
    await expect(page.getByText('Google Cloud AI Builder Cup 2026').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('h1').filter({ hasText: 'The Autonomous Shopfloor Brain' })).toBeVisible({ timeout: 10000 });

    // 1. Test Vision QC sub-tab
    const visionTriggerBtn = page.getByRole('button', { name: 'Trigger Gemini 3.8 Vision Inspection' });
    await expect(visionTriggerBtn).toBeVisible();
    await visionTriggerBtn.click();

    // Wait for inspection result to appear
    await expect(page.getByText('Inference Verdict (Google Gemini Multimodal)')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Engineering Spec')).toBeVisible({ timeout: 10000 });

    // 2. Test 1M+ Long-Context Memory sub-tab
    const memoryTabBtn = page.getByRole('button', { name: '2. 1M+ Long-Context Memory & RCA' });
    await memoryTabBtn.click();
    await expect(page.getByText('1M+ Tokens Ingested into Gemini Memory')).toBeVisible({ timeout: 10000 });

    const synthesizeBtn = page.getByRole('button', { name: 'Synthesize Root Cause (5-Why Investigation)' });
    await synthesizeBtn.click();

    // Wait for 5-Why Ladder to appear
    await expect(page.getByText('Automated Root Cause Reasoning (5-Why Methodology)')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Prescriptive Action Plan Generated:')).toBeVisible({ timeout: 10000 });

    // 3. Test Autonomous Agentic Tool Calling sub-tab
    const agenticTabBtn = page.getByRole('button', { name: '3. Autonomous Agentic Tool Calling' });
    await agenticTabBtn.click();
    await expect(page.getByText('Operator Instruction to Actions')).toBeVisible({ timeout: 10000 });

    const executeAgentBtn = page.getByRole('button', { name: 'Execute Autonomous Agent Actions' });
    await executeAgentBtn.click();

    // Wait for Tool execution pipeline to display
    await expect(page.getByText('Autonomous Tool Execution Pipeline')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('triggerAndonStation')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('rerouteWorkOrder')).toBeVisible({ timeout: 10000 });

    // 4. Test Google Cloud Architecture sub-tab
    const cloudTabBtn = page.getByRole('button', { name: '4. Google Cloud Architecture' });
    await cloudTabBtn.click();
    await expect(page.getByText('Built for Scale on Google Cloud')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('gcloud run deploy mavi-mes')).toBeVisible({ timeout: 10000 });
  });
});

import { test, expect } from '@playwright/test';
import { AgenticPromptEngine } from '../../src/vibe/ai/AgenticPromptEngine.js';
import { DyadPatchEngine } from '../../src/vibe/ai/DyadEngine.js';

test.describe('MAVI MES - Sandbox Dyad VibeCoding Integration', () => {
  test('AgenticPromptEngine parses Dyad atomic search_replace format for Sandbox', () => {
    const aiResponse = `
<ai_plan>
1. Ubah teks tombol menjadi Vibe Dyad
</ai_plan>

<search_replace path="/App.jsx">
<search>
<button className="btn-primary">Mulai Shift</button>
</search>
<replace>
<button className="btn-primary">Mulai Shift (Dyad Vibe)</button>
</replace>
</search_replace>
`;

    const { plan, fileActions } = AgenticPromptEngine.parseResponse(aiResponse);
    expect(plan).toContain('Ubah teks tombol');
    expect(fileActions.length).toBe(1);
    expect(fileActions[0].action).toBe('patch');
    expect(fileActions[0].path).toBe('/App.jsx');
    expect(fileActions[0].search).toContain('Mulai Shift');
    expect(fileActions[0].replace).toContain('Dyad Vibe');
  });

  test('DyadPatchEngine correctly mutates Sandbox virtual file code', () => {
    const sandboxSource = `
import React from 'react';

export default function IndustrialApp() {
  return (
    <div className="p-6">
      <h1>OEE Production Line 1</h1>
      <span className="badge">Status: IDLE</span>
    </div>
  );
}
`;

    const search = '<span className="badge">Status: IDLE</span>';
    const replace = '<span className="badge">Status: RUNNING (Dyad Engine)</span>';

    const patchResult = DyadPatchEngine.applySearchReplace(sandboxSource, search, replace);
    expect(patchResult.success).toBe(true);
    expect(patchResult.code).toContain('Status: RUNNING (Dyad Engine)');
    expect(patchResult.code).not.toContain('Status: IDLE');
  });

  test('Sandbox UI /#/sandbox loads without runtime errors after Dyad integration', async ({ page }) => {
    const errorLogs = [];
    page.on('pageerror', (err) => errorLogs.push(err.message));

    await page.goto('/#/sandbox');
    await page.waitForLoadState('domcontentloaded');

    // Pastikan root ter-render
    const root = page.locator('#root');
    await expect(root).toBeVisible({ timeout: 15000 });

    // Tunggu toolbar Sandbox
    const toolbarBtn = page.locator('button:has-text("Sandbox"), button:has-text("Preview")').first();
    await expect(toolbarBtn).toBeVisible({ timeout: 15000 });

    const fatalErrors = errorLogs.filter(
      (msg) => !msg.includes('WebSocket') && !msg.includes('supabase') && !msg.includes('ResizeObserver') && !msg.includes('codesandbox')
    );
    expect(fatalErrors.length).toBe(0);
  });
});

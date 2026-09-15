/**
 * Playwright Test Spec & App Registry Generator
 * Generates automated end-to-end tests for any MaviCore AppBuilder project.
 */

/**
 * Generates Playwright E2E Spec from project state
 */
export function generatePlaywrightSpec(projectState = {}) {
    const {
        appName = 'MaviCore App',
        currentAppId = 'app_default',
        steps = [],
        baseComponents = [],
        appVariables = [],
        appTables = []
    } = projectState;

    const safeAppName = (appName || 'MaviApp').replace(/[^a-zA-Z0-9_-]/g, '_');
    const safeTitle = appName || 'Mavi MES App';

    let testStepsCode = '';

    steps.forEach((step, index) => {
        const stepName = step.title || `Screen ${index + 1}`;
        const components = step.components || [];

        testStepsCode += `
    // -------------------------------------------------------------
    // STEP ${index + 1}: ${stepName}
    // -------------------------------------------------------------
    await test.step('Navigate and verify ${stepName}', async () => {
        // Switch to or verify step indicator/tab
        const stepTab = page.locator(\`[data-testid="step-tab-${step.id || index}"]\`)
            .or(page.getByRole('button', { name: /${escapeRegex(stepName)}/i }))
            .or(page.getByText('${escapeRegex(stepName)}'));
        if (await stepTab.isVisible({ timeout: 2000 }).catch(() => false)) {
            await stepTab.first().click();
        }
`;

        if (components.length === 0) {
            testStepsCode += `        // Note: No components registered on this screen\n`;
        } else {
            components.forEach((c) => {
                const label = c.label || c.title || c.text || c.name || '';
                const cType = (c.type || 'component').toLowerCase();

                if (['button', 'action-button', 'submit'].includes(cType)) {
                    testStepsCode += `        // Button interaction: ${label || cType}
        const btn_${cleanId(c.id)} = page.locator(\`[data-widget-id="${c.id}"]\`)
            .or(page.getByRole('button', { name: /${escapeRegex(label || 'Button')}/i }));
        await expect(btn_${cleanId(c.id)}.first()).toBeVisible({ timeout: 5000 });
`;
                } else if (['text-input', 'number-input', 'textarea', 'input'].includes(cType)) {
                    testStepsCode += `        // Input field: ${label || cType}
        const input_${cleanId(c.id)} = page.locator(\`[data-widget-id="${c.id}"] input\`)
            .or(page.getByLabel(/${escapeRegex(label)}/i))
            .or(page.getByPlaceholder(/${escapeRegex(label)}/i));
        if (await input_${cleanId(c.id)}.first().isVisible({ timeout: 2000 }).catch(() => false)) {
            await input_${cleanId(c.id)}.first().fill('Test Value');
        }
`;
                } else if (['heading', 'text', 'title'].includes(cType) && label) {
                    testStepsCode += `        // Verify heading/text: ${label}
        await expect(page.getByText('${escapeRegex(label)}').first()).toBeVisible({ timeout: 5000 });
`;
                } else {
                    testStepsCode += `        // Component: ${cType} (${c.id})
        const comp_${cleanId(c.id)} = page.locator(\`[data-widget-id="${c.id}"]\`);
        await expect(comp_${cleanId(c.id)}.first()).toBeVisible({ timeout: 5000 });
`;
                }
            });
        }

        testStepsCode += `    });\n`;
    });

    return `import { test, expect } from '@playwright/test';

/**
 * Automated E2E Test Suite for: ${safeTitle} (ID: ${currentAppId})
 * Generated automatically by MaviCore App Test Studio
 */
test.describe('${safeTitle} E2E Suite', () => {
    test.beforeEach(async ({ page }) => {
        // Navigate to the MaviCore player or builder preview
        await page.goto('/#/player/${currentAppId}');
        await page.waitForLoadState('domcontentloaded');
    });

    test('should successfully load ${safeTitle} and render all screens without errors', async ({ page }) => {
        // Validate container visibility
        await expect(page.locator('#app-player-root, .app-player-container, #canvas-container').first()).toBeVisible({ timeout: 10000 });
${testStepsCode}
    });
});
`;
}

/**
 * Performs architectural and functional sanity checks on the project
 */
export function performAppSanityCheck(projectState = {}) {
    const steps = projectState.steps || [];
    const issues = [];
    const titlesSeen = new Set();
    let totalComponents = 0;

    if (steps.length === 0) {
        issues.push({
            id: 'no-screens',
            type: 'NO_SCREENS',
            severity: 'error',
            message: 'App has no screens. Users will see a blank screen.'
        });
    }

    steps.forEach((step, idx) => {
        const title = (step.title || '').trim();
        const comps = step.components || [];
        totalComponents += comps.length;

        if (comps.length === 0) {
            issues.push({
                id: `empty-step-${step.id || idx}`,
                type: 'EMPTY_STEP',
                severity: 'warning',
                stepId: step.id,
                stepTitle: title || `Screen ${idx + 1}`,
                message: `Screen "${title || `Screen ${idx + 1}`}" has 0 components.`
            });
        }

        if (titlesSeen.has(title.toLowerCase())) {
            issues.push({
                id: `dup-title-${step.id || idx}`,
                type: 'DUPLICATE_TITLE',
                severity: 'warning',
                stepId: step.id,
                stepTitle: title,
                message: `Multiple screens have the title "${title}". This may cause ambiguous routing.`
            });
        } else if (title) {
            titlesSeen.add(title.toLowerCase());
        }
    });

    const errorCount = issues.filter(i => i.severity === 'error').length;
    const warningCount = issues.filter(i => i.severity === 'warning').length;

    return {
        status: issues.length === 0 ? 'PASS' : 'FAIL',
        issues,
        screensCount: steps.length,
        totalComponents,
        variablesCount: (projectState.appVariables || []).length,
        functionsCount: (projectState.appFunctions || []).length,
        triggersCount: (projectState.appTriggers || []).length,
        healthScore: Math.max(10, 100 - (errorCount * 30 + warningCount * 10))
    };
}

/**
 * Auto-repairs detected architecture flaws (e.g. empty steps, duplicate titles)
 */
export function repairAppArchitecture(projectState = {}) {
    const steps = projectState.steps || [];
    let fixedCount = 0;
    const usedTitles = new Set();

    const newSteps = steps.map((step, idx) => {
        let title = (step.title || `Screen ${idx + 1}`).trim();
        let comps = [...(step.components || [])];

        // Deduplicate title
        if (usedTitles.has(title.toLowerCase())) {
            let counter = 2;
            while (usedTitles.has(`${title} ${counter}`.toLowerCase())) {
                counter++;
            }
            title = `${title} ${counter}`;
            fixedCount++;
        }
        usedTitles.add(title.toLowerCase());

        // Fill empty screen with standard starter layout if empty
        if (comps.length === 0) {
            comps.push({
                id: `widget_${Date.now()}_hdr_${idx}`,
                type: 'heading',
                title: title,
                fontSize: 22,
                fontWeight: '700',
                color: '#0f172a',
                x: 40,
                y: 40,
                w: 400,
                h: 50
            });
            comps.push({
                id: `widget_${Date.now()}_txt_${idx}`,
                type: 'text',
                text: `Halaman ${title} siap digunakan. Tambahkan widget dari panel kiri.`,
                fontSize: 14,
                color: '#64748b',
                x: 40,
                y: 100,
                w: 400,
                h: 40
            });
            fixedCount++;
        }

        return {
            ...step,
            title,
            components: comps
        };
    });

    return {
        fixedCount,
        newSteps
    };
}

function cleanId(id = '') {
    return String(id).replace(/[^a-zA-Z0-9_]/g, '_');
}

function escapeRegex(str = '') {
    return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

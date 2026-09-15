import { describe, it, expect } from 'vitest';
import {
    generatePlaywrightSpec,
    performAppSanityCheck,
    repairAppArchitecture
} from '../../utils/appTestGenerator';

describe('App Test Studio & Playwright Engine', () => {
    const mockProjectState = {
        currentAppId: 'app_123',
        appName: 'Mes Quality Check',
        appCategory: 'Quality Control',
        appMeta: { description: 'App for inspecting parts' },
        steps: [
            {
                id: 'screen_1',
                title: 'Screen 1',
                components: [
                    { id: 'c1', type: 'heading', title: 'Inspection Form', x: 20, y: 20 },
                    { id: 'c2', type: 'text-input', label: 'Inspector Name', x: 20, y: 80 },
                    { id: 'c3', type: 'button', label: 'Submit Inspection', x: 20, y: 140 }
                ]
            },
            {
                id: 'screen_2',
                title: 'Screen 2',
                components: [
                    { id: 'c4', type: 'heading', title: 'Inspection Result', x: 20, y: 20 },
                    { id: 'c5', type: 'button', label: 'Back to Home', x: 20, y: 100 }
                ]
            }
        ],
        baseComponents: [
            { id: 'header_1', type: 'heading', title: 'Mavi MES Header' }
        ],
        appVariables: [{ name: 'inspector', value: 'John' }],
        appFunctions: [{ name: 'submitData' }],
        appTriggers: [{ name: 'onSave' }],
        appTables: ['work_orders']
    };

    it('generates valid Playwright test spec for multi-screen project', () => {
        const spec = generatePlaywrightSpec(mockProjectState);
        expect(spec).toContain("import { test, expect } from '@playwright/test'");
        expect(spec).toContain("test.describe('Mes Quality Check E2E Suite'");
        expect(spec).toContain("Screen 1");
        expect(spec).toContain("Screen 2");
        expect(spec).toContain("Inspector Name");
        expect(spec).toContain("Submit Inspection");
        expect(spec).toContain("Back to Home");
    });

    it('evaluates app sanity and finds 0 critical issues on healthy project', () => {
        const report = performAppSanityCheck(mockProjectState);
        expect(report.status).toBe('PASS');
        expect(report.screensCount).toBe(2);
        expect(report.totalComponents).toBe(5);
        expect(report.issues.filter(i => i.severity === 'error').length).toBe(0);
    });

    it('flags empty screens and duplicate titles during sanity check', () => {
        const problematicState = {
            appName: 'Faulty App',
            steps: [
                { id: 's1', title: 'Duplicate Name', components: [] },
                { id: 's2', title: 'Duplicate Name', components: [] }
            ],
            baseComponents: [],
            appVariables: [],
            appFunctions: [],
            appTriggers: []
        };

        const report = performAppSanityCheck(problematicState);
        expect(report.status).toBe('FAIL');
        const emptyIssue = report.issues.find(i => i.type === 'EMPTY_STEP');
        const dupIssue = report.issues.find(i => i.type === 'DUPLICATE_TITLE');
        expect(emptyIssue).toBeDefined();
        expect(dupIssue).toBeDefined();
    });

    it('auto-repairs empty screens and duplicate screen titles', () => {
        const problematicState = {
            appName: 'Faulty App',
            steps: [
                { id: 's1', title: 'Home', components: [] },
                { id: 's2', title: 'Home', components: [] }
            ],
            baseComponents: [],
            appVariables: [],
            appFunctions: [],
            appTriggers: []
        };

        const result = repairAppArchitecture(problematicState);
        expect(result.fixedCount).toBeGreaterThan(0);
        expect(result.newSteps[0].components.length).toBeGreaterThan(0); // placeholder added
        expect(result.newSteps[1].title).not.toBe(result.newSteps[0].title); // title uniqueness fixed
    });
});

import { describe, it, expect } from 'vitest';
import { sanitizeCopilotCommands } from '../../utils/copilotSafety';
import { normalizeType } from '../../components/appbuilder/aiHelpers';

describe('Copilot Step & Widget Routing', () => {
    it('normalizes CREATE_STEP and ADD_STEP without blocking on missing payload.title', () => {
        const rawCommandData = {
            commands: [
                {
                    type: 'CREATE_STEP',
                    title: 'Dashboard Produksi'
                },
                {
                    type: 'ADD_STEP',
                    payload: {
                        name: 'Form Input'
                    }
                },
                {
                    type: 'ADD_STEP',
                    payload: {
                        stepTitle: 'Riwayat Log'
                    }
                }
            ]
        };

        const result = sanitizeCopilotCommands(rawCommandData);
        expect(result.hardFail).toBe(false);
        expect(result.safeCommands.length).toBe(3);
        expect(result.safeCommands[0].type).toBe('ADD_STEP');
        expect(result.safeCommands[0].payload.title).toBe('Dashboard Produksi');
        expect(result.safeCommands[1].type).toBe('ADD_STEP');
        expect(result.safeCommands[1].payload.title).toBe('Form Input');
        expect(result.safeCommands[2].type).toBe('ADD_STEP');
        expect(result.safeCommands[2].payload.title).toBe('Riwayat Log');
    });

    it('normalizes CREATE_WIDGET and preserves stepTitle for target screen routing', () => {
        const rawCommandData = {
            commands: [
                {
                    type: 'CREATE_WIDGET',
                    payload: {
                        stepTitle: 'Dashboard Produksi',
                        type: 'Button',
                        displayName: 'BtnSubmit'
                    }
                },
                {
                    type: 'ADD_WIDGET',
                    payload: {
                        screenTitle: 'Form Input',
                        type: 'Card',
                        displayName: 'SummaryCard'
                    }
                }
            ]
        };

        const result = sanitizeCopilotCommands(rawCommandData);
        expect(result.hardFail).toBe(false);
        expect(result.safeCommands.length).toBe(2);
        expect(result.safeCommands[0].type).toBe('ADD_WIDGET');
        expect(result.safeCommands[0].payload.stepTitle).toBe('Dashboard Produksi');
        expect(result.safeCommands[1].type).toBe('ADD_WIDGET');
        expect(result.safeCommands[1].payload.screenTitle).toBe('Form Input');
    });

    it('normalizes navigation commands to GO_TO_STEP', () => {
        const rawCommandData = {
            commands: [
                {
                    type: 'NAVIGATE_STEP',
                    payload: { stepId: 'screen_2' }
                },
                {
                    type: 'SWITCH_STEP',
                    payload: { stepTitle: 'Dashboard' }
                }
            ]
        };

        const result = sanitizeCopilotCommands(rawCommandData);
        expect(result.hardFail).toBe(false);
        expect(result.safeCommands.length).toBe(2);
        expect(result.safeCommands[0].type).toBe('GO_TO_STEP');
        expect(result.safeCommands[1].type).toBe('GO_TO_STEP');
    });

    it('resolves widget type aliases including Badge, Alert, Chip', () => {
        expect(normalizeType('Badge')).toBe('TEXT');
        expect(normalizeType('Alert')).toBe('TEXT');
        expect(normalizeType('Chip')).toBe('BUTTON');
        expect(normalizeType('Card')).toBe('SHAPE_RECTANGLE');
        expect(normalizeType('Button')).toBe('BUTTON');
    });

    it('simulates target step resolution logic matching AppBuilder ADD_WIDGET', () => {
        const mockSteps = [
            { id: 'screen_1', title: '1. Dashboard Produksi', components: [] },
            { id: 'screen_2', title: '2. Form Input QC', components: [] }
        ];

        const resolveTarget = (stepKey) => {
            const lowerKey = String(stepKey || '').toLowerCase().trim();
            const match = mockSteps.find(s =>
                s.id === stepKey ||
                s.title.toLowerCase() === lowerKey ||
                s.title.toLowerCase().includes(lowerKey) ||
                lowerKey.includes(s.title.toLowerCase())
            );
            return match ? match.id : null;
        };

        expect(resolveTarget('1. Dashboard Produksi')).toBe('screen_1');
        expect(resolveTarget('Dashboard Produksi')).toBe('screen_1');
        expect(resolveTarget('Form Input QC')).toBe('screen_2');
        expect(resolveTarget('screen_2')).toBe('screen_2');
        expect(resolveTarget('Unknown Screen')).toBe(null);
    });

    it('handles string payloads for ADD_STEP and GO_TO_STEP gracefully', () => {
        const rawCommandData = {
            commands: [
                {
                    type: 'ADD_STEP',
                    payload: 'Screen 2'
                },
                {
                    type: 'GO_TO_STEP',
                    payload: 'Screen 2'
                }
            ]
        };

        const result = sanitizeCopilotCommands(rawCommandData);
        expect(result.hardFail).toBe(false);
        expect(result.safeCommands.length).toBe(2);
        expect(result.safeCommands[0].type).toBe('ADD_STEP');
        expect(result.safeCommands[0].payload.title).toBe('Screen 2');
        expect(result.safeCommands[1].type).toBe('GO_TO_STEP');
        expect(result.safeCommands[1].payload.stepId).toBe('Screen 2');
    });

    it('prevents Screen 2 from falsely matching Screen 1 or Screen in target resolution', () => {
        const mockSteps = [
            { id: 'screen_1', title: 'Screen 1', components: [] },
            { id: 'screen_plain', title: 'Screen', components: [] }
        ];

        const resolveTargetStrict = (stepKey) => {
            const lowerKey = String(stepKey || '').toLowerCase().trim();
            let match = mockSteps.find(s => s.id === stepKey);
            if (!match) {
                match = mockSteps.find(s => String(s.title || '').toLowerCase().trim() === lowerKey);
            }
            if (!match) {
                const getNum = (str) => {
                    const m = /\b([0-9]+)\b/.exec(str);
                    if (m) return m[1];
                    if (/\b(1|satu|pertama|first)\b/i.test(str)) return '1';
                    if (/\b(2|dua|kedua|second)\b/i.test(str)) return '2';
                    if (/\b(3|tiga|ketiga|third)\b/i.test(str)) return '3';
                    return null;
                };
                const targetNum = getNum(lowerKey);
                match = mockSteps.find(s => {
                    const sTitle = String(s.title || '').toLowerCase().trim();
                    if (!sTitle) return false;
                    const sNum = getNum(sTitle);
                    if (targetNum !== null && sNum !== targetNum) return false;
                    return sTitle.includes(lowerKey) || (lowerKey.length >= 4 && lowerKey.includes(sTitle));
                });
            }
            return match ? match.id : null;
        };

        expect(resolveTargetStrict('Screen 1')).toBe('screen_1');
        expect(resolveTargetStrict('Screen 2')).toBe(null); // Does NOT falsely match Screen 1 or Screen!
        expect(resolveTargetStrict('Halaman 2')).toBe(null); // Does NOT falsely match Screen 1 or Screen!
    });

    it('uses resolveStepTarget to match ordinal and title variations without creating phantom screens', async () => {
        const { resolveStepTarget } = await import('../../components/appbuilder/aiHelpers');

        const mockSteps = [
            { id: 'screen_1', title: '1. Dashboard Produksi', components: [] },
            { id: 'screen_2', title: '2. Form Input QC', components: [] },
            { id: 'screen_3', title: '3. Data Tabel & Log', components: [] }
        ];

        // 1. Exact ID
        expect(resolveStepTarget(mockSteps, 'screen_1')?.id).toBe('screen_1');
        expect(resolveStepTarget(mockSteps, 'screen_2')?.id).toBe('screen_2');
        expect(resolveStepTarget(mockSteps, 'screen_3')?.id).toBe('screen_3');

        // 2. Exact Title
        expect(resolveStepTarget(mockSteps, '1. Dashboard Produksi')?.id).toBe('screen_1');
        expect(resolveStepTarget(mockSteps, '2. Form Input QC')?.id).toBe('screen_2');

        // 3. Clean Title (omitting numbers)
        expect(resolveStepTarget(mockSteps, 'Dashboard Produksi')?.id).toBe('screen_1');
        expect(resolveStepTarget(mockSteps, 'Form Input QC')?.id).toBe('screen_2');
        expect(resolveStepTarget(mockSteps, 'Data Tabel & Log')?.id).toBe('screen_3');

        // 4. Ordinal references (Screen 2, Halaman 2, Page 2, Layar 2)
        expect(resolveStepTarget(mockSteps, 'Screen 2')?.id).toBe('screen_2');
        expect(resolveStepTarget(mockSteps, 'Halaman 2')?.id).toBe('screen_2');
        expect(resolveStepTarget(mockSteps, 'Page 2')?.id).toBe('screen_2');
        expect(resolveStepTarget(mockSteps, 'Layar 2')?.id).toBe('screen_2');
        expect(resolveStepTarget(mockSteps, 'Screen 1')?.id).toBe('screen_1');
        expect(resolveStepTarget(mockSteps, 'Halaman 1')?.id).toBe('screen_1');
        expect(resolveStepTarget(mockSteps, 'Screen 3')?.id).toBe('screen_3');

        // 5. Ordinal on unnumbered steps
        const unnumberedSteps = [
            { id: 's_dash', title: 'Dashboard', components: [] },
            { id: 's_form', title: 'Input Form', components: [] }
        ];
        expect(resolveStepTarget(unnumberedSteps, 'Screen 1')?.id).toBe('s_dash');
        expect(resolveStepTarget(unnumberedSteps, 'Screen 2')?.id).toBe('s_form');
        expect(resolveStepTarget(unnumberedSteps, 'Halaman 2')?.id).toBe('s_form');

        // 6. Base layout
        expect(resolveStepTarget(mockSteps, 'BASE')?.id).toBe('BASE');
        expect(resolveStepTarget(mockSteps, 'Base Layout')?.id).toBe('BASE');

        // 7. Non-existent should return null and never falsely match Screen 1
        const singleStep = [{ id: 'screen_1', title: 'Screen 1', components: [] }];
        expect(resolveStepTarget(singleStep, 'Screen 2')).toBe(null);
        expect(resolveStepTarget(mockSteps, 'Screen 99')).toBe(null);
        expect(resolveStepTarget(mockSteps, 'Unknown Screen')).toBe(null);
    });

    it('normalizes specific widget commands like ADD_BUTTON, ADD_INPUT, ADD_CARD without being blocked', () => {
        const rawCommandData = {
            commands: [
                { type: 'ADD_BUTTON', payload: { label: 'Submit Part' } },
                { type: 'ADD_INPUT', payload: { label: 'Operator ID' } },
                { type: 'CREATE_CARD', payload: { label: 'Card Container' } },
                { type: 'ADD_TABLE', payload: { name: 'Daftar Inspeksi' } }
            ]
        };

        const result = sanitizeCopilotCommands(rawCommandData);
        expect(result.hardFail).toBe(false);
        expect(result.safeCommands.length).toBe(4);
        expect(result.safeCommands[0].type).toBe('ADD_WIDGET');
        expect(result.safeCommands[0].payload.type).toBe('BUTTON');
        expect(result.safeCommands[1].type).toBe('ADD_WIDGET');
        expect(result.safeCommands[1].payload.type).toBe('TEXT_INPUT');
        expect(result.safeCommands[2].type).toBe('ADD_WIDGET');
        expect(result.safeCommands[2].payload.type).toBe('SHAPE_RECTANGLE');
        expect(result.safeCommands[3].type).toBe('ADD_WIDGET');
        expect(result.safeCommands[3].payload.type).toBe('INTERACTIVE_TABLE');
    });
});



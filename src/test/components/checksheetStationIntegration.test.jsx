import { describe, it, expect, vi } from 'vitest';

vi.mock('dexie', () => {
    return {
        default: class MockDexie {
            constructor() {
                this.version = () => ({ stores: () => {} });
                this.templates = {
                    toArray: async () => [],
                    bulkPut: async () => {},
                    clear: async () => {},
                    delete: async () => {}
                };
            }
        }
    };
});

import { getAllChecksheets } from '../../utils/supabaseTemplateDB';
import { saveDrawingWithParametersToSupabase } from '../../utils/mavicorePLM';

describe('Station and Checksheet Integration', () => {
    it('getAllChecksheets should be an exported function', () => {
        expect(typeof getAllChecksheets).toBe('function');
    });

    it('getAllChecksheets should return an array', async () => {
        const checksheets = await getAllChecksheets();
        expect(Array.isArray(checksheets)).toBe(true);
    });

    it('saveDrawingWithParametersToSupabase should be an exported function', () => {
        expect(typeof saveDrawingWithParametersToSupabase).toBe('function');
    });

    it('saveDrawingWithParametersToSupabase should save drawing with parameters', async () => {
        const mockDrawing = {
            id: 'dwg_test_123',
            code: 'DRW-TEST-123',
            name: 'Test Bolt Drawing',
            drawing_type: 'DETAIL'
        };
        const mockBalloons = [
            { balloon_number: '1', position_x: 150, position_y: 200 }
        ];
        const mockFeatures = [
            { feature_code: 'F01', feature_name: 'Diameter', nominal_value: 12.0, upper_tolerance: 0.05, lower_tolerance: -0.05, unit: 'mm' }
        ];

        const res = await saveDrawingWithParametersToSupabase({
            drawing: mockDrawing,
            revision: { revision_code: 'A' },
            balloons: mockBalloons,
            features: mockFeatures
        });

        expect(res.success).toBe(true);
        expect(res.drawing.id).toBe('dwg_test_123');
        expect(res.balloonsCount).toBe(1);
        expect(res.featuresCount).toBe(1);
    });
});


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

describe('Station and Checksheet Integration', () => {
    it('getAllChecksheets should be an exported function', () => {
        expect(typeof getAllChecksheets).toBe('function');
    });

    it('getAllChecksheets should return an array', async () => {
        const checksheets = await getAllChecksheets();
        expect(Array.isArray(checksheets)).toBe(true);
    });
});

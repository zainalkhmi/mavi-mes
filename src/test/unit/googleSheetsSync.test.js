import { describe, it, expect } from 'vitest';
import { inferFieldType } from '../../utils/googleSheetsSync';

describe('Google Sheets & Spreadsheet Sync Service (AppSheet Model)', () => {
  describe('inferFieldType: Automatic Schema Prediction', () => {
    it('infers integer type correctly', () => {
      expect(inferFieldType([10, 20, 30, 40])).toBe('integer');
      expect(inferFieldType(['10', '25', '100'])).toBe('integer');
    });

    it('infers number (decimal) type correctly', () => {
      expect(inferFieldType([10.5, 20.25, 30.0])).toBe('number');
      expect(inferFieldType(['12.45', '$99.50', '8.2%'])).toBe('number');
    });

    it('infers boolean type correctly', () => {
      expect(inferFieldType([true, false, true])).toBe('boolean');
      expect(inferFieldType(['true', 'false', 'TRUE'])).toBe('boolean');
      expect(inferFieldType(['yes', 'no', 'YES'])).toBe('boolean');
      expect(inferFieldType(['1', '0', '1'])).toBe('boolean');
    });

    it('infers datetime type correctly', () => {
      expect(inferFieldType(['2026-09-27', '2026-09-28'])).toBe('datetime');
      expect(inferFieldType(['2026-09-27T06:00:00Z', '2026-09-28T07:00:00Z'])).toBe('datetime');
      expect(inferFieldType(['27/09/2026', '28/09/2026'])).toBe('datetime');
    });

    it('infers text type for general strings', () => {
      expect(inferFieldType(['Part A', 'Part B', 'Part C'])).toBe('text');
      expect(inferFieldType(['WO-001', 'WO-002', 'WO-003'])).toBe('text');
      expect(inferFieldType([])).toBe('text');
      expect(inferFieldType([null, undefined, ''])).toBe('text');
    });
  });
});

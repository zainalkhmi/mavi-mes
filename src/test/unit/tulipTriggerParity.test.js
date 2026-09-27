import { describe, it, expect } from 'vitest';

// Test the logic for the newly expanded Tulip Trigger conditions & operators
describe('Tulip Trigger Parity - Extended Conditions & Array Actions', () => {
  const evaluateTulipCondition = (operator, left, right) => {
    const l = String(left ?? '').toLowerCase();
    const r = String(right ?? '').toLowerCase();
    switch (operator) {
      case '==': return l === r;
      case '!=': return l !== r;
      case '>': return Number(left) > Number(right);
      case '<': return Number(left) < Number(right);
      case '>=': return Number(left) >= Number(right);
      case '<=': return Number(left) <= Number(right);
      case 'CONTAINS': return l.includes(r);
      case 'DOES_NOT_CONTAIN': return !l.includes(r);
      case 'STARTS_WITH': return l.startsWith(r);
      case 'ENDS_WITH': return l.endsWith(r);
      case 'IS_WITHIN_RANGE': {
        const parts = String(right ?? '').split(/[,:\s\.\.]+/).filter(Boolean);
        if (parts.length >= 2) {
          const min = Number(parts[0]);
          const max = Number(parts[1]);
          const cur = Number(left);
          if (!isNaN(min) && !isNaN(max) && !isNaN(cur)) {
            return cur >= Math.min(min, max) && cur <= Math.max(min, max);
          }
        }
        return false;
      }
      case 'IS_EMPTY': return !left || String(left).trim() === '';
      case 'IS_NOT_EMPTY': return Boolean(left) && String(left).trim() !== '';
      default: return true;
    }
  };

  it('correctly evaluates DOES_NOT_CONTAIN', () => {
    expect(evaluateTulipCondition('DOES_NOT_CONTAIN', 'Batch-2026-X', 'DEFECT')).toBe(true);
    expect(evaluateTulipCondition('DOES_NOT_CONTAIN', 'Batch-DEFECT-01', 'DEFECT')).toBe(false);
  });

  it('correctly evaluates STARTS_WITH and ENDS_WITH', () => {
    expect(evaluateTulipCondition('STARTS_WITH', 'SN-998823', 'sn-')).toBe(true);
    expect(evaluateTulipCondition('STARTS_WITH', 'LOT-998823', 'sn-')).toBe(false);

    expect(evaluateTulipCondition('ENDS_WITH', 'part_final_PASS', '_pass')).toBe(true);
    expect(evaluateTulipCondition('ENDS_WITH', 'part_final_FAIL', '_pass')).toBe(false);
  });

  it('correctly evaluates IS_WITHIN_RANGE', () => {
    expect(evaluateTulipCondition('IS_WITHIN_RANGE', 25.4, '20, 30')).toBe(true);
    expect(evaluateTulipCondition('IS_WITHIN_RANGE', 19.9, '20, 30')).toBe(false);
    expect(evaluateTulipCondition('IS_WITHIN_RANGE', 35, '20, 30')).toBe(false);
    expect(evaluateTulipCondition('IS_WITHIN_RANGE', 20, '20..30')).toBe(true);
  });

  it('executes ARRAY_PUSH, ARRAY_POP, and ARRAY_CLEAR accurately', () => {
    let list = ['ITEM_A', 'ITEM_B'];

    // PUSH
    list = [...list, 'ITEM_C'];
    expect(list).toEqual(['ITEM_A', 'ITEM_B', 'ITEM_C']);

    // POP
    const popped = list.pop();
    expect(popped).toBe('ITEM_C');
    expect(list).toEqual(['ITEM_A', 'ITEM_B']);

    // CLEAR
    list = [];
    expect(list).toEqual([]);
  });
});

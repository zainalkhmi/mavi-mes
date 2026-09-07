import { describe, it, expect } from 'vitest';
import {
  parseSqlValue,
  evaluateWhereClause,
  normalizeIdentifier
} from '../../utils/sqlExecutionEngine.js';

describe('sqlExecutionEngine unit tests', () => {
  it('parses SQL literal values properly', () => {
    expect(parseSqlValue("'hello world'")).toBe('hello world');
    expect(parseSqlValue('"hello"')).toBe('hello');
    expect(parseSqlValue('123')).toBe(123);
    expect(parseSqlValue('45.67')).toBe(45.67);
    expect(parseSqlValue('true')).toBe(true);
    expect(parseSqlValue('false')).toBe(false);
    expect(parseSqlValue('null')).toBe(null);
  });

  it('normalizes identifiers properly', () => {
    expect(normalizeIdentifier('"work_orders"')).toBe('work_orders');
    expect(normalizeIdentifier('`users`')).toBe('users');
    expect(normalizeIdentifier('  part_number  ')).toBe('part_number');
  });

  it('evaluates WHERE conditions properly', () => {
    const row = {
      order_number: 'WO-2026-09-001',
      part_name: 'Precision Flange SS316',
      target_quantity: 500,
      completed_quantity: 480,
      status: 'RUNNING'
    };

    // Equal string
    expect(evaluateWhereClause("status = 'RUNNING'", row)).toBe(true);
    expect(evaluateWhereClause("status = 'COMPLETED'", row)).toBe(false);

    // Number comparisons
    expect(evaluateWhereClause("target_quantity > 400", row)).toBe(true);
    expect(evaluateWhereClause("target_quantity <= 500", row)).toBe(true);
    expect(evaluateWhereClause("completed_quantity < 400", row)).toBe(false);

    // LIKE / ILIKE
    expect(evaluateWhereClause("order_number LIKE '%001%'", row)).toBe(true);
    expect(evaluateWhereClause("part_name ILIKE '%flange%'", row)).toBe(true);
    expect(evaluateWhereClause("order_number LIKE 'WO-2025%'", row)).toBe(false);

    // AND / OR
    expect(evaluateWhereClause("status = 'RUNNING' AND target_quantity = 500", row)).toBe(true);
    expect(evaluateWhereClause("status = 'COMPLETED' OR target_quantity = 500", row)).toBe(true);
    expect(evaluateWhereClause("status = 'COMPLETED' AND target_quantity = 500", row)).toBe(false);

    // IN (...)
    expect(evaluateWhereClause("status IN ('RUNNING', 'SCHEDULED')", row)).toBe(true);
    expect(evaluateWhereClause("status IN ('COMPLETED', 'CANCELLED')", row)).toBe(false);

    // IS NOT NULL
    expect(evaluateWhereClause("order_number IS NOT NULL", row)).toBe(true);
  });
});

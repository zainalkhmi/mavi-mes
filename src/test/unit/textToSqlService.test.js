import { describe, it, expect } from 'vitest';
import { generateSqlFromPrompt } from '../../utils/textToSqlService.js';

describe('textToSqlService unit tests', () => {
  const tableSchemas = {
    work_orders: {
      columns: [
        { name: 'id', type: 'text', isPk: true },
        { name: 'order_number', type: 'text' },
        { name: 'part_name', type: 'text' },
        { name: 'line_name', type: 'text' },
        { name: 'target_quantity', type: 'number' },
        { name: 'completed_quantity', type: 'number' },
        { name: 'scrap_quantity', type: 'number' },
        { name: 'status', type: 'text' },
        { name: 'due_date', type: 'datetime' }
      ]
    }
  };

  it('generates query for scrap filter', async () => {
    const res = await generateSqlFromPrompt('Tampilkan 5 order dengan scrap terbanyak', { tableSchemas });
    expect(res).toBeDefined();
    expect(res.sql).toContain('SELECT');
    expect(res.sql).toContain('scrap_quantity');
    expect(res.sql).toContain('ORDER BY');
  });

  it('generates query for status RUNNING filter', async () => {
    const res = await generateSqlFromPrompt('Filter work orders yang statusnya RUNNING', { tableSchemas });
    expect(res).toBeDefined();
    expect(res.sql).toContain('status = \'RUNNING\'');
  });

  it('generates query for grouping by production line', async () => {
    const res = await generateSqlFromPrompt('Rekap total produksi per lini', { tableSchemas });
    expect(res).toBeDefined();
    expect(res.sql).toContain('GROUP BY');
    expect(res.sql).toContain('line_name');
  });

  it('generates query for create table prompt', async () => {
    const res = await generateSqlFromPrompt('buat tabel mesin_produksi', { tableSchemas });
    expect(res).toBeDefined();
    expect(res.sql).toContain('CREATE TABLE mesin_produksi');
  });

  it('generates query for insert prompt', async () => {
    const res = await generateSqlFromPrompt('tambah data baru ke work_orders', { tableSchemas });
    expect(res).toBeDefined();
    expect(res.sql).toContain('INSERT INTO work_orders');
  });
});

import { describe, it, expect, vi } from 'vitest';
import { MAVICORE_BRIDGE_VIRTUAL_FILE } from '../../vibe/sdk/mavicoreBridge';
import { extractTableSchemaFromCode } from '../../utils/vibeTableBridge';

describe('Sandbox App & Real-Time CRUD Bridge', () => {
  it('MAVICORE_BRIDGE_VIRTUAL_FILE contains full CRUD suite', () => {
    expect(MAVICORE_BRIDGE_VIRTUAL_FILE).toBeDefined();
    // Verify CRUD functions exist in the bridge
    expect(MAVICORE_BRIDGE_VIRTUAL_FILE).toContain('createTable:');
    expect(MAVICORE_BRIDGE_VIRTUAL_FILE).toContain('save: async');
    expect(MAVICORE_BRIDGE_VIRTUAL_FILE).toContain('read: async');
    expect(MAVICORE_BRIDGE_VIRTUAL_FILE).toContain('update: async');
    expect(MAVICORE_BRIDGE_VIRTUAL_FILE).toContain('delete: async');
    expect(MAVICORE_BRIDGE_VIRTUAL_FILE).toContain('onRecord:');
    expect(MAVICORE_BRIDGE_VIRTUAL_FILE).toContain('useMaviCoreData');
  });

  it('MAVICORE_BRIDGE_VIRTUAL_FILE includes offline localStorage cache _store', () => {
    expect(MAVICORE_BRIDGE_VIRTUAL_FILE).toContain('_store');
    expect(MAVICORE_BRIDGE_VIRTUAL_FILE).toContain('window.MaviCoreBridge = MaviCoreBridge;');
    expect(MAVICORE_BRIDGE_VIRTUAL_FILE).toContain('window.useMaviCoreData = useMaviCoreData;');
  });

  it('extractTableSchemaFromCode correctly extracts table name and fields from CRUD app code', () => {
    const appCode = `
      import React, { useState } from 'react';
      import { useMaviCoreData } from './mavicore-bridge';

      const TABLE_NAME = 'Warehouse_Inventory';

      export default function App() {
        const { records, insert, update, remove } = useMaviCoreData(TABLE_NAME);
        const [form, setForm] = useState({ partName: '', quantity: 0, status: 'OK' });

        return <div><h1>Warehouse Inventory App</h1></div>;
      }
    `;

    const schema = extractTableSchemaFromCode(appCode);
    expect(schema.name).toBe('Warehouse_Inventory');
    expect(schema.fields.some(f => f.name === 'partName')).toBe(true);
    expect(schema.fields.some(f => f.name === 'quantity')).toBe(true);
    expect(schema.fields.some(f => f.name === 'status')).toBe(true);
  });
});

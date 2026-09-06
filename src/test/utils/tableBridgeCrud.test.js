import { describe, it, expect, vi } from 'vitest';
import { MAVICORE_BRIDGE_VIRTUAL_FILE } from '../../vibe/sdk/mavicoreBridge';
import { extractTableSchemaFromCode } from '../../utils/vibeTableBridge';

describe('MaviCore Table Bridge CRUD Architecture', () => {
  it('exports MAVICORE_BRIDGE_VIRTUAL_FILE with complete CRUD capabilities', () => {
    expect(MAVICORE_BRIDGE_VIRTUAL_FILE).toBeDefined();
    // Must contain CRUD operations
    expect(MAVICORE_BRIDGE_VIRTUAL_FILE).toContain('save: async');
    expect(MAVICORE_BRIDGE_VIRTUAL_FILE).toContain('saveRecord: async');
    expect(MAVICORE_BRIDGE_VIRTUAL_FILE).toContain('read: async');
    expect(MAVICORE_BRIDGE_VIRTUAL_FILE).toContain('update: async');
    expect(MAVICORE_BRIDGE_VIRTUAL_FILE).toContain('updateRecord: async');
    expect(MAVICORE_BRIDGE_VIRTUAL_FILE).toContain('delete: async');
    expect(MAVICORE_BRIDGE_VIRTUAL_FILE).toContain('deleteRecord: async');
    expect(MAVICORE_BRIDGE_VIRTUAL_FILE).toContain('onRecord:');
    expect(MAVICORE_BRIDGE_VIRTUAL_FILE).toContain('export function useMaviCoreData');
    expect(MAVICORE_BRIDGE_VIRTUAL_FILE).toContain('window.MaviCoreBridge = MaviCoreBridge');
    expect(MAVICORE_BRIDGE_VIRTUAL_FILE).toContain('export const bridge = MaviCoreBridge');
  });

  it('extracts table schema from code accurately', () => {
    const codeWithTable = `
      import React from 'react';
      import { useMaviCoreData } from './mavicore-bridge';

      const TABLE_NAME = 'Stasiun Press Assembly';
      export default function App() {
        const { records, insert } = useMaviCoreData(TABLE_NAME);
        return <div>{TABLE_NAME}</div>;
      }
    `;

    const schema = extractTableSchemaFromCode(codeWithTable);
    expect(schema.name).toBe('Stasiun Press Assembly');
  });

  it('handles MAVICORE_TABLE_QUERY, READ, UPDATE, and DELETE message types', () => {
    expect(MAVICORE_BRIDGE_VIRTUAL_FILE).toContain('MAVICORE_TABLE_INSERT');
    expect(MAVICORE_BRIDGE_VIRTUAL_FILE).toContain('MAVICORE_TABLE_READ');
    expect(MAVICORE_BRIDGE_VIRTUAL_FILE).toContain('MAVICORE_TABLE_QUERY');
    expect(MAVICORE_BRIDGE_VIRTUAL_FILE).toContain('MAVICORE_TABLE_UPDATE');
    expect(MAVICORE_BRIDGE_VIRTUAL_FILE).toContain('MAVICORE_TABLE_DELETE');
    expect(MAVICORE_BRIDGE_VIRTUAL_FILE).toContain('MAVICORE_RECORD_SAVED');
    expect(MAVICORE_BRIDGE_VIRTUAL_FILE).toContain('MAVICORE_RECORD_UPDATED');
    expect(MAVICORE_BRIDGE_VIRTUAL_FILE).toContain('MAVICORE_RECORD_DELETED');
  });

  it('accurately extracts genuine form fields and strictly excludes UI state variables', () => {
    const componentWithMixedStates = `
      import React, { useState } from 'react';
      import { useMaviCoreData } from './mavicore-bridge';

      export default function ChecksheetApp() {
        const { insert } = useMaviCoreData('Checksheet Produksi');

        // UI states (MUST NOT BECOME TABLE COLUMNS)
        const [logs, setLogs] = useState([]);
        const [bridgeReady, setBridgeReady] = useState(false);
        const [search, setSearch] = useState('');
        const [selectedLine, setSelectedLine] = useState('Line A');
        const [selectedJudgment, setSelectedJudgment] = useState('OK');
        const [isModalOpen, setIsModalOpen] = useState(false);

        // Actual Form State (MUST BECOME TABLE COLUMNS)
        const [formData, setFormData] = useState({
          productionLine: 'Line A - Stamping',
          shift: 'Shift 1 (Pagi)',
          operatorName: '',
          inspectionItem: '',
          referenceStandard: '',
          actualValue: '',
          judgment: 'OK',
          notes: ''
        });

        const handleSubmit = async (e) => {
          e.preventDefault();
          await insert(formData);
        };

        return <form onSubmit={handleSubmit}><input name="operatorName" /></form>;
      }
    `;

    const schema = extractTableSchemaFromCode(componentWithMixedStates);
    const fieldNames = schema.fields.map(f => f.name);

    // Form fields MUST exist in schema
    expect(fieldNames).toContain('productionLine');
    expect(fieldNames).toContain('shift');
    expect(fieldNames).toContain('operatorName');
    expect(fieldNames).toContain('inspectionItem');
    expect(fieldNames).toContain('referenceStandard');
    expect(fieldNames).toContain('actualValue');
    expect(fieldNames).toContain('judgment');
    expect(fieldNames).toContain('notes');

    // UI state variables MUST NOT exist in schema
    expect(fieldNames).not.toContain('logs');
    expect(fieldNames).not.toContain('bridgeReady');
    expect(fieldNames).not.toContain('search');
    expect(fieldNames).not.toContain('selectedLine');
    expect(fieldNames).not.toContain('selectedJudgment');
    expect(fieldNames).not.toContain('isModalOpen');
  });
});


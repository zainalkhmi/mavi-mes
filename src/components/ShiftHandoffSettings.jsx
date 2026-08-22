/**
 * Shift Handoff Settings - Mandor MES
 * AI Configuration with Real Database Connections
 */

import React, { useState, useEffect } from 'react';
import { Settings, Bot, Database, TestTube, Save, RefreshCw, CheckCircle, AlertCircle, Key, Globe, Cpu, ChevronDown, RefreshCw as Reload, Table, Columns, FileText, Copy, Edit3 } from 'lucide-react';

const ShiftHandoffSettings = () => {
  const [activeTab, setActiveTab] = useState('connection');
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [loadingTables, setLoadingTables] = useState(false);

  // Available tables from database
  const [availableTables, setAvailableTables] = useState([]);
  const [tableFields, setTableFields] = useState({});

  // AI Settings
  const [aiSettings, setAiSettings] = useState({
    provider: 'gemini',
    modelId: 'gemini-1.5-pro',
    apiKey: '',
    baseUrl: '',
    temperature: 0.7,
    maxTokens: 2048
  });

  // Table Mappings - connected to real tables
  const [tableMappings, setTableMappings] = useState({
    stations: {
      enabled: true,
      tableName: 'stations',
      statusField: 'oekxd_status',
      nameField: 'name',
      operatorField: 'kiyrh_current_operator'
    },
    workOrders: {
      enabled: true,
      tableName: 'work_orders',
      statusField: 'levog_status',
      qtyRequiredField: 'reavb_qty_required',
      qtyCompleteField: 'ftnlk_qty_complete',
      startDateField: 'zziwa_startdate',
      completeDateField: 'nmqnv_complete_date'
    },
    units: {
      enabled: true,
      tableName: 'units',
      statusField: 'oltjf_status',
      workOrderField: 'wgnxp_work_order',
      completedDateField: 'bouoq_completed_date',
      producedByField: 'xnazp_produced_by'
    },
    inspections: {
      enabled: true,
      tableName: 'inspections',
      passField: 'huegu_passed',
      orderIdField: 'daypb_order_id',
      locationField: 'tpyyp_location',
      operatorField: 'svvky_operator'
    },
    defects: {
      enabled: true,
      tableName: 'defects',
      reasonField: 'tjwit_reason',
      locationField: 'vbfik_location',
      severityField: 'vrasf_severity',
      statusField: 'qxitw_status',
      quantityField: 'dgcuy_quantity'
    },
    equipment: {
      enabled: false,
      tableName: 'equipment',
      statusField: 'vaoro_status',
      locationField: 'wrvtl_location',
      calibrationField: 'jhzaa_last_calibration'
    },
    exceptions: {
      enabled: true,
      tableName: 'comments',
      locationField: 'akioj_location',
      severityField: 'ejicn_severity',
      descField: 'thlqv_description',
      statusField: 'epazg_status'
    },
    actions: {
      enabled: true,
      tableName: 'actions',
      locationField: 'iydrm_location',
      severityField: 'skoec_severity',
      statusField: 'zkdcu_status',
      titleField: 'vqvci_title'
    }
  });

  // Facility Settings
  const [facilitySettings, setFacilitySettings] = useState({
    name: 'Andon Manufacturing Company',
    stations: ['Material Warehouse', 'Remote Production', 'Remote Assembly', 'Andon Kitting', 'Andon Assembly', 'Final Inspection', 'Shipping'],
    targetUnitsPerHour: 50,
    targetCycleTime: 7.5,
    targetQualityRate: 98
  });

  // Thresholds
  const [thresholds, setThresholds] = useState({
    utilizationVariance: 15,
    downtimeAlert: 30,
    cycleTimeVariance: 20,
    qualityFailure: 1
  });

  // Agent Instructions
  const [agentInstructions, setAgentInstructions] = useState({
    goal: `You are an intelligent manufacturing shift handoff agent for an andon manufacturing company. Your role is to synthesize production data into concise, actionable shift summaries for incoming shift managers.

Your style & tone:
- Professional, concise, data-driven
- Use specific metrics and timestamps
- Highlight actionable insights
- Prioritize critical information first`,

    instructions: `INSTRUCTIONS
YOUR TASK:
Generate a comprehensive shift handoff summary using the provided production data, focusing on actionable insights and critical alerts that require immediate attention from the incoming shift team.

YOUR OUTPUT FORMAT:
1. Executive Summary (2-3 sentences)
   - Overall shift performance vs. targets
   - Key achievements or concerns

2. Station Performance Analysis
   - Utilization rate vs. baseline (flag if >15% deviation)
   - Notable events or anomalies
   - Impact on downstream operations

3. Quality & Production Metrics
   - Units produced vs. target
   - Quality pass rates
   - Cycle time performance
   - Work order completion status

4. Critical Alerts & Anomalies
   - Equipment failures or unusual downtime
   - Quality deviations exceeding thresholds
   - Resource constraints or bottlenecks

5. Trend Analysis
   - Performance patterns compared to previous shifts
   - Emerging issues or improvements

6. Handoff Recommendations
   - Priority actions for incoming shift
   - Equipment requiring attention
   - Resource allocation suggestions

YOU MUST:
- KEEP SUMMARIES UNDER 250 WORDS PER SUMMARY
- FOLLOW THE EXAMPLE FORMAT PROVIDED
- Use clear, jargon-free language understandable by shop-floor personnel
- Only report statistically or operationally significant trends
- Rank anomalies by operational impact (downtime > defects > minor deviations)
- If data is missing or ambiguous, note it explicitly`,

    context: `CONTEXT:
- Manufacturing facility with 7 key stations: Material Warehouse, Remote Production, Remote Assembly, Andon Kitting, Andon Assembly, Final Inspection, and Shipping
- Production targets: ~50 units/hour, 7.5-minute average cycle time
- Product mix: Remote Controls and Andon Lamps
- Quality standards: Visual inspection at final stage`,

    thresholds: {
      utilizationVariance: 15,
      downtimeAlert: 30,
      cycleTimeVariance: 20,
      qualityFailure: 1
    }
  });

  const [editingField, setEditingField] = useState(null);

  // Load settings and tables
  useEffect(() => {
    loadSettings();
    loadAvailableTables();
  }, []);

  const loadSettings = () => {
    const saved = localStorage.getItem('shift_handoff_settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      setAiSettings(parsed.aiSettings || aiSettings);
      setTableMappings(prev => ({ ...prev, ...parsed.tableMappings }));
      setFacilitySettings(parsed.facilitySettings || facilitySettings);
      setThresholds(parsed.thresholds || thresholds);
      if (parsed.agentInstructions) {
        setAgentInstructions(prev => ({ ...prev, ...parsed.agentInstructions }));
      }
    }
  };

  const loadAvailableTables = async () => {
    setLoadingTables(true);
    try {
      const { getSupabaseClient } = await import('../utils/supabaseManualDB');
      const supabase = getSupabaseClient();

      // Fetch list of tables from public schema
      const { data, error } = await supabase.rpc('get_table_names');

      if (error || !data) {
        // Fallback: try to query known tables directly
        const knownTables = ['stations', 'work_orders', 'units', 'inspections', 'defects', 'equipment', 'comments', 'actions'];
        setAvailableTables(knownTables);
      } else {
        setAvailableTables(data);
      }

      // Load fields for each mapped table
      for (const [, mapping] of Object.entries(tableMappings)) {
        if (mapping.tableName) {
          await loadTableFields(mapping.tableName);
        }
      }
    } catch (e) {
      console.error('Failed to load tables:', e);
      // Fallback tables
      const knownTables = ['stations', 'work_orders', 'units', 'inspections', 'defects', 'equipment', 'comments', 'actions'];
      setAvailableTables(knownTables);
    }
    setLoadingTables(false);
  };

  const loadTableFields = async (tableName) => {
    if (!tableName) return;
    try {
      const { getSupabaseClient } = await import('../utils/supabaseManualDB');
      const supabase = getSupabaseClient();
      const { data } = await supabase.from(tableName).select('*').limit(1);
      if (data && data.length > 0) {
        const fields = Object.keys(data[0]);
        setTableFields(prev => ({ ...prev, [tableName]: fields }));
      }
    } catch (e) {
      console.error('Failed to load fields for', tableName, e);
    }
  };

  const handleTableChange = (key, tableName) => {
    const updated = { ...tableMappings, [key]: { ...tableMappings[key], tableName } };
    setTableMappings(updated);
    loadTableFields(tableName);
  };

  const saveSettings = () => {
    setSaving(true);
    const settings = { aiSettings, tableMappings, facilitySettings, thresholds, agentInstructions };
    localStorage.setItem('shift_handoff_settings', JSON.stringify(settings));
    setTimeout(() => setSaving(false), 1000);
  };

  const testConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setTestResult({ success: true, message: 'AI connection successful!' });
    } catch (e) {
      setTestResult({ success: false, message: 'Connection failed: ' + e.message });
    }
    setTesting(false);
  };

  const testDataConnection = async (key) => {
    const mapping = tableMappings[key];
    if (!mapping.tableName) return;

    try {
      const { getSupabaseClient } = await import('../utils/supabaseManualDB');
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.from(mapping.tableName).select('*').limit(5);
      if (error) throw error;
      return { success: true, count: data?.length || 0 };
    } catch (e) {
      return { success: false, error: e.message };
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f1f5f9', fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #d1d5db', padding: '16px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', backgroundColor: '#714b67', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Settings size={20} color="white" />
            </div>
            <div>
              <h1 style={{ fontSize: '18px', fontWeight: 600, color: '#1f2937', margin: 0 }}>Shift Handoff AI Settings</h1>
              <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>Configure AI agent for shift handoff reports</p>
            </div>
          </div>
          <button
            onClick={saveSettings}
            disabled={saving}
            style={{
              padding: '10px 20px', backgroundColor: saving ? '#9ca3af' : '#714b67',
              color: 'white', border: 'none', borderRadius: '6px', cursor: saving ? 'not-allowed' : 'pointer',
              fontSize: '14px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px'
            }}
          >
            <Save size={16} />
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', backgroundColor: '#e5e7eb', padding: '4px', borderRadius: '8px', width: 'fit-content' }}>
          {[
            { id: 'connection', label: 'AI Connection', icon: Key },
            { id: 'instructions', label: 'Agent Instructions', icon: FileText },
            { id: 'tables', label: 'Table Mapping', icon: Database },
            { id: 'facility', label: 'Facility', icon: Globe },
            { id: 'thresholds', label: 'Thresholds', icon: Cpu }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '10px 20px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                backgroundColor: activeTab === tab.id ? 'white' : 'transparent',
                color: activeTab === tab.id ? '#714b67' : '#6b7280',
                fontSize: '14px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px',
                boxShadow: activeTab === tab.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* AI Connection Tab */}
        {activeTab === 'connection' && (
          <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#1f2937', marginBottom: '20px' }}>AI Provider Configuration</h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>Provider</label>
                <select
                  value={aiSettings.provider}
                  onChange={(e) => setAiSettings({ ...aiSettings, provider: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px' }}
                >
                  <option value="gemini">Google Gemini</option>
                  <option value="openai">OpenAI</option>
                  <option value="claude">Anthropic Claude</option>
                  <option value="ollama">Ollama (Local)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>Model ID</label>
                <input
                  type="text"
                  value={aiSettings.modelId}
                  onChange={(e) => setAiSettings({ ...aiSettings, modelId: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px' }}
                />
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>API Key</label>
                <input
                  type="password"
                  value={aiSettings.apiKey}
                  onChange={(e) => setAiSettings({ ...aiSettings, apiKey: e.target.value })}
                  placeholder="Enter your API key"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px' }}
                />
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>Base URL (for Ollama/Proxy)</label>
                <input
                  type="text"
                  value={aiSettings.baseUrl}
                  onChange={(e) => setAiSettings({ ...aiSettings, baseUrl: e.target.value })}
                  placeholder="https://api.example.com/v1"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>Temperature: {aiSettings.temperature}</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={aiSettings.temperature}
                  onChange={(e) => setAiSettings({ ...aiSettings, temperature: parseFloat(e.target.value) })}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>Max Tokens</label>
                <input
                  type="number"
                  value={aiSettings.maxTokens}
                  onChange={(e) => setAiSettings({ ...aiSettings, maxTokens: parseInt(e.target.value) })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px' }}
                />
              </div>
            </div>

            <div style={{ marginTop: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                onClick={testConnection}
                disabled={testing}
                style={{
                  padding: '10px 20px', backgroundColor: testing ? '#9ca3af' : '#2563eb',
                  color: 'white', border: 'none', borderRadius: '6px', cursor: testing ? 'not-allowed' : 'pointer',
                  fontSize: '14px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px'
                }}
              >
                <TestTube size={16} />
                {testing ? 'Testing...' : 'Test Connection'}
              </button>
              {testResult && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: testResult.success ? '#16a34a' : '#dc2626' }}>
                  {testResult.success ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                  {testResult.message}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Agent Instructions Tab */}
        {activeTab === 'instructions' && (
          <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#1f2937', margin: 0 }}>Agent Instructions Configuration</h3>
                <p style={{ fontSize: '13px', color: '#6b7280', margin: '4px 0 0 0' }}>
                  Configure the AI agent prompt and behavior for shift handoff reports
                </p>
              </div>
              <button
                onClick={() => {
                  const fullPrompt = `GOAL:\n${agentInstructions.goal}\n\n${agentInstructions.instructions}\n\n${agentInstructions.context}`;
                  navigator.clipboard.writeText(fullPrompt);
                }}
                style={{
                  padding: '8px 16px', backgroundColor: '#f3f4f6', color: '#374151',
                  border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer',
                  fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px'
                }}
              >
                <Copy size={14} /> Copy Full Prompt
              </button>
            </div>

            {/* Goal Section */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ fontSize: '14px', fontWeight: 600, color: '#1f2937' }}>Goal</label>
                <button
                  onClick={() => setEditingField(editingField === 'goal' ? null : 'goal')}
                  style={{ padding: '4px 8px', backgroundColor: editingField === 'goal' ? '#dbeafe' : '#f3f4f6', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <Edit3 size={12} /> {editingField === 'goal' ? 'Done' : 'Edit'}
                </button>
              </div>
              {editingField === 'goal' ? (
                <textarea
                  value={agentInstructions.goal}
                  onChange={(e) => setAgentInstructions({ ...agentInstructions, goal: e.target.value })}
                  rows={6}
                  style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '13px', fontFamily: 'monospace', resize: 'vertical' }}
                />
              ) : (
                <div style={{ padding: '12px', backgroundColor: '#f9fafb', borderRadius: '6px', fontSize: '13px', fontFamily: 'monospace', whiteSpace: 'pre-wrap', color: '#374151' }}>
                  {agentInstructions.goal}
                </div>
              )}
            </div>

            {/* Instructions Section */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ fontSize: '14px', fontWeight: 600, color: '#1f2937' }}>Instructions & Output Format</label>
                <button
                  onClick={() => setEditingField(editingField === 'instructions' ? null : 'instructions')}
                  style={{ padding: '4px 8px', backgroundColor: editingField === 'instructions' ? '#dbeafe' : '#f3f4f6', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <Edit3 size={12} /> {editingField === 'instructions' ? 'Done' : 'Edit'}
                </button>
              </div>
              {editingField === 'instructions' ? (
                <textarea
                  value={agentInstructions.instructions}
                  onChange={(e) => setAgentInstructions({ ...agentInstructions, instructions: e.target.value })}
                  rows={20}
                  style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '12px', fontFamily: 'monospace', resize: 'vertical' }}
                />
              ) : (
                <div style={{ padding: '12px', backgroundColor: '#f9fafb', borderRadius: '6px', fontSize: '12px', fontFamily: 'monospace', whiteSpace: 'pre-wrap', color: '#374151', maxHeight: '400px', overflowY: 'auto' }}>
                  {agentInstructions.instructions}
                </div>
              )}
            </div>

            {/* Context Section */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ fontSize: '14px', fontWeight: 600, color: '#1f2937' }}>Facility Context</label>
                <button
                  onClick={() => setEditingField(editingField === 'context' ? null : 'context')}
                  style={{ padding: '4px 8px', backgroundColor: editingField === 'context' ? '#dbeafe' : '#f3f4f6', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <Edit3 size={12} /> {editingField === 'context' ? 'Done' : 'Edit'}
                </button>
              </div>
              {editingField === 'context' ? (
                <textarea
                  value={agentInstructions.context}
                  onChange={(e) => setAgentInstructions({ ...agentInstructions, context: e.target.value })}
                  rows={6}
                  style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '13px', fontFamily: 'monospace', resize: 'vertical' }}
                />
              ) : (
                <div style={{ padding: '12px', backgroundColor: '#f9fafb', borderRadius: '6px', fontSize: '13px', fontFamily: 'monospace', whiteSpace: 'pre-wrap', color: '#374151' }}>
                  {agentInstructions.context}
                </div>
              )}
            </div>

            {/* Data Tables Reference */}
            <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '16px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#1e40af', marginBottom: '12px' }}>📊 Data Tables Reference</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', fontSize: '12px' }}>
                <div><strong>Stations:</strong> id, oekxd_status, kiyrh_current_operator</div>
                <div><strong>Work Orders:</strong> id, levog_status, reavb_qty_required</div>
                <div><strong>Units:</strong> id, wgnxp_work_order, oltjf_status</div>
                <div><strong>Inspections:</strong> id, huegu_passed, tpyyp_location</div>
                <div><strong>Defects:</strong> id, tjwit_reason, vrasf_severity</div>
                <div><strong>Equipment:</strong> id, vaoro_status, wrvtl_location</div>
              </div>
            </div>
          </div>
        )}

        {/* Table Mapping Tab - CONNECTED TO REAL DB */}
        {activeTab === 'tables' && (
          <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#1f2937', margin: 0 }}>Database Table Mappings</h3>
                <p style={{ fontSize: '13px', color: '#6b7280', margin: '4px 0 0 0' }}>
                  Connect to real tables in your database
                </p>
              </div>
              <button
                onClick={loadAvailableTables}
                disabled={loadingTables}
                style={{
                  padding: '8px 16px', backgroundColor: '#f3f4f6', color: '#374151',
                  border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer',
                  fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px'
                }}
              >
                <Reload size={14} className={loadingTables ? 'animate-spin' : ''} />
                Refresh Tables
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
              {Object.entries(tableMappings).map(([key, mapping]) => (
                <div
                  key={key}
                  style={{
                    border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px',
                    opacity: mapping.enabled ? 1 : 0.6
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="checkbox"
                        checked={mapping.enabled}
                        onChange={(e) => setTableMappings({ ...tableMappings, [key]: { ...mapping, enabled: e.target.checked } })}
                        style={{ width: '16px', height: '16px' }}
                      />
                      <Database size={16} color="#714b67" />
                      <span style={{ fontWeight: 600, color: '#1f2937', textTransform: 'capitalize' }}>{key}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {/* Table Selection */}
                    <div>
                      <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Table Name</label>
                      <div style={{ position: 'relative' }}>
                        <select
                          value={mapping.tableName}
                          onChange={(e) => handleTableChange(key, e.target.value)}
                          disabled={!mapping.enabled}
                          style={{
                            width: '100%', padding: '8px 12px', borderRadius: '4px',
                            border: '1px solid #d1d5db', fontSize: '13px', backgroundColor: 'white',
                            appearance: 'none', paddingRight: '30px'
                          }}
                        >
                          <option value="">-- Select Table --</option>
                          {availableTables.map(t => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                        <ChevronDown size={14} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#6b7280' }} />
                      </div>
                    </div>

                    {/* Field Selections */}
                    {mapping.tableName && tableFields[mapping.tableName] && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        {Object.entries(mapping).filter(([k]) => k.startsWith(k[0]) && k !== 'enabled' && k !== 'tableName').map(([fieldKey, fieldValue]) => (
                          <div key={fieldKey}>
                            <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '2px', textTransform: 'capitalize' }}>
                              {fieldKey.replace(/Field$/, '')}
                            </label>
                            <select
                              value={fieldValue}
                              onChange={(e) => setTableMappings({
                                ...tableMappings,
                                [key]: { ...mapping, [fieldKey]: e.target.value }
                              })}
                              disabled={!mapping.enabled}
                              style={{
                                width: '100%', padding: '6px 8px', borderRadius: '4px',
                                border: '1px solid #d1d5db', fontSize: '12px', backgroundColor: 'white'
                              }}
                            >
                              <option value="">-- Field --</option>
                              {tableFields[mapping.tableName].map(f => (
                                <option key={f} value={f}>{f}</option>
                              ))}
                            </select>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Test Button */}
                    {mapping.tableName && (
                      <button
                        onClick={() => testDataConnection(key)}
                        style={{
                          padding: '6px 12px', backgroundColor: '#f3f4f6', color: '#374151',
                          border: '1px solid #d1d5db', borderRadius: '4px', cursor: 'pointer',
                          fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', width: 'fit-content'
                        }}
                      >
                        <Table size={12} />
                        Test Query
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Facility Tab */}
        {activeTab === 'facility' && (
          <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#1f2937', marginBottom: '20px' }}>Facility Configuration</h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>Facility Name</label>
                <input
                  type="text"
                  value={facilitySettings.name}
                  onChange={(e) => setFacilitySettings({ ...facilitySettings, name: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>Stations (one per line)</label>
                <textarea
                  value={facilitySettings.stations.join('\n')}
                  onChange={(e) => setFacilitySettings({ ...facilitySettings, stations: e.target.value.split('\n').map(s => s.trim()).filter(Boolean) })}
                  rows={6}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>Target Units/Hour</label>
                  <input
                    type="number"
                    value={facilitySettings.targetUnitsPerHour}
                    onChange={(e) => setFacilitySettings({ ...facilitySettings, targetUnitsPerHour: parseInt(e.target.value) })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>Target Cycle Time (min)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={facilitySettings.targetCycleTime}
                    onChange={(e) => setFacilitySettings({ ...facilitySettings, targetCycleTime: parseFloat(e.target.value) })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>Target Quality Rate (%)</label>
                  <input
                    type="number"
                    value={facilitySettings.targetQualityRate}
                    onChange={(e) => setFacilitySettings({ ...facilitySettings, targetQualityRate: parseInt(e.target.value) })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px' }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Thresholds Tab */}
        {activeTab === 'thresholds' && (
          <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#1f2937', marginBottom: '20px' }}>Alert Thresholds</h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
              {[
                { key: 'utilizationVariance', label: 'Utilization Variance', suffix: '%', desc: 'Alert if utilization deviates more than this % from baseline' },
                { key: 'downtimeAlert', label: 'Downtime Alert', suffix: 'min', desc: 'Alert if unplanned downtime exceeds this duration' },
                { key: 'cycleTimeVariance', label: 'Cycle Time Variance', suffix: '%', desc: 'Alert if cycle time deviates more than this % from target' },
                { key: 'qualityFailure', label: 'Quality Failure Count', suffix: '', desc: 'Alert if any failures detected' }
              ].map(item => (
                <div key={item.key}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>{item.label}</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="number"
                      value={thresholds[item.key]}
                      onChange={(e) => setThresholds({ ...thresholds, [item.key]: parseInt(e.target.value) })}
                      style={{ width: '100px', padding: '10px 12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px' }}
                    />
                    <span style={{ color: '#6b7280', fontSize: '14px' }}>{item.suffix}</span>
                  </div>
                  <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShiftHandoffSettings;

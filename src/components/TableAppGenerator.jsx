/**
 * TableAppGenerator.jsx
 * Generate App Screens from Table Schema
 * Supports: MaviCore, GlueStack, and Sandbox builders
 */

import React, { useState, useMemo } from 'react';
import {
  Bot, Table, Database, Link2, Code, Eye, Copy,
  CheckCircle2, Sparkles, ArrowRight, Download,
  Layout, List, FileText, BarChart3, Settings,
  Trash2, Edit3, Plus, Search, Filter, RefreshCw,
  Smartphone, Monitor, Code2, Layers, X
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function TableAppGenerator({ table, onGenerate, onClose }) {
  const [generatedScreens, setGeneratedScreens] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedBuilder, setSelectedBuilder] = useState('mavicore');
  const [selectedScreens, setSelectedScreens] = useState({
    list: true,
    form: true,
    detail: false,
    dashboard: false
  });

  // Builder options
  const builders = [
    {
      id: 'mavicore',
      name: 'MaviCore',
      description: 'React + Tailwind components',
      icon: Layers,
      color: '#714b67',
      output: 'React + Tailwind + Lucide'
    },
    {
      id: 'gluestack',
      name: 'GlueStack',
      description: 'Gluestack UI v2 components',
      icon: Smartphone,
      color: '#3b82f6',
      output: 'Gluestack UI v2'
    },
    {
      id: 'sandbox',
      name: 'Sandbox',
      description: 'React + Tailwind',
      icon: Monitor,
      color: '#22c55e',
      output: 'Sandpack-ready'
    }
  ];

  // Generate app screens from table schema
  const generateApp = async () => {
    if (!table || !table.fields) {
      toast.error('Tabel tidak memiliki struktur field');
      return;
    }

    setIsGenerating(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      const screens = generateScreensFromSchema(table, selectedBuilder);
      setGeneratedScreens(screens);

      if (onGenerate) {
        onGenerate(screens, selectedBuilder);
      }

      toast.success('✅ App berhasil di-generate!');
    } catch (err) {
      toast.error('Gagal generate: ' + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleScreen = (screen) => {
    setSelectedScreens(prev => ({
      ...prev,
      [screen]: !prev[screen]
    }));
  };

  const copyToClipboard = (code, label) => {
    navigator.clipboard.writeText(code);
    toast.success(`${label} copied!`);
  };

  if (!table) {
    return (
      <div className="p-8 text-center text-slate-500">
        <Table size={48} className="mx-auto mb-4 opacity-50" />
        <p>Pilih tabel untuk generate app</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-slate-50">
      {/* Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-violet-600 to-purple-600 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <Sparkles size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold">Table App Generator</h2>
              <p className="text-sm text-white/70">Generate app screens dari schema tabel</p>
            </div>
          </div>
          {onClose && (
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Table Info */}
      <div className="px-6 py-4 bg-white border-b border-slate-200">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Database size={16} className="text-violet-600" />
            <span className="font-bold text-slate-800">{table.name}</span>
          </div>
          <span className="px-2 py-1 bg-violet-100 text-violet-700 rounded-full text-xs font-medium">
            {table.fields?.length || 0} fields
          </span>
        </div>
      </div>

      {/* Builder Selection */}
      <div className="px-6 py-4 bg-white border-b border-slate-200">
        <p className="text-sm font-medium text-slate-600 mb-3">Pilih Builder:</p>
        <div className="grid grid-cols-3 gap-3">
          {builders.map(builder => {
            const Icon = builder.icon;
            const isSelected = selectedBuilder === builder.id;
            return (
              <button
                key={builder.id}
                onClick={() => setSelectedBuilder(builder.id)}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  isSelected
                    ? 'border-violet-500 bg-violet-50'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{
                    backgroundColor: isSelected ? builder.color : '#f1f5f9'
                  }}>
                    <Icon size={20} style={{ color: isSelected ? 'white' : builder.color }} />
                  </div>
                  <div>
                    <p className={`font-bold ${isSelected ? 'text-violet-700' : 'text-slate-700'}`}>
                      {builder.name}
                    </p>
                    <p className="text-xs text-slate-500">{builder.output}</p>
                  </div>
                  <div className={`ml-auto w-5 h-5 rounded border-2 flex items-center justify-center ${
                    isSelected ? 'border-violet-500 bg-violet-500' : 'border-slate-300'
                  }`}>
                    {isSelected && <CheckCircle2 size={12} className="text-white" />}
                  </div>
                </div>
                <p className="text-xs text-slate-500">{builder.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Screen Selection */}
      <div className="px-6 py-4 bg-white border-b border-slate-200">
        <p className="text-sm font-medium text-slate-600 mb-3">Pilih screens yang di-generate:</p>
        <div className="grid grid-cols-4 gap-3">
          {[
            { id: 'list', icon: List, label: 'List Screen', desc: 'Tampilkan records' },
            { id: 'form', icon: FileText, label: 'Form Screen', desc: 'Create/Edit form' },
            { id: 'detail', icon: Eye, label: 'Detail', desc: 'View record' },
            { id: 'dashboard', icon: BarChart3, label: 'Dashboard', desc: 'Summary' }
          ].map(screen => {
            const Icon = screen.icon;
            const isSelected = selectedScreens[screen.id];
            return (
              <button
                key={screen.id}
                onClick={() => toggleScreen(screen.id)}
                className={`p-3 rounded-xl border-2 transition-all text-left ${
                  isSelected ? 'border-violet-500 bg-violet-50' : 'border-slate-200 bg-white'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Icon size={16} className={isSelected ? 'text-violet-600' : 'text-slate-400'} />
                  <span className={`font-medium text-sm ${isSelected ? 'text-violet-700' : 'text-slate-600'}`}>
                    {screen.label}
                  </span>
                </div>
                <p className="text-xs text-slate-400">{screen.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Generate Button */}
      <div className="px-6 py-4 bg-white border-b border-slate-200">
        <button
          onClick={generateApp}
          disabled={isGenerating}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50"
        >
          {isGenerating ? (
            <>
              <RefreshCw size={18} className="animate-spin" />
              Generating {builders.find(b => b.id === selectedBuilder)?.name} App...
            </>
          ) : (
            <>
              <Sparkles size={18} />
              Generate {builders.find(b => b.id === selectedBuilder)?.name} App
            </>
          )}
        </button>
      </div>

      {/* Generated Screens */}
      {generatedScreens && (
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800">Generated Screens ({builders.find(b => b.id === selectedBuilder)?.name})</h3>
            <button
              onClick={() => copyAllToClipboard(generatedScreens)}
              className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200"
            >
              Copy All
            </button>
          </div>
          {Object.entries(generatedScreens).map(([screenType, content]) => (
            <ScreenPreview
              key={screenType}
              type={screenType}
              content={content}
              builder={selectedBuilder}
              onCopy={(code) => copyToClipboard(code, screenType)}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!generatedScreens && !isGenerating && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Sparkles size={48} className="mx-auto mb-4 text-slate-300" />
            <p className="text-slate-500 font-medium">Pilih builder dan screens, lalu klik Generate</p>
            <p className="text-sm text-slate-400 mt-1">App akan di-generate sesuai schema tabel</p>
          </div>
        </div>
      )}
    </div>
  );
}

// Generate screens from table schema
function generateScreensFromSchema(table, builder = 'mavicore') {
  const fields = table.fields || [];
  const tableName = table.name;
  const camelName = tableName.replace(/[\s-_]+(.)/g, (_, c) => c.toUpperCase());

  const screens = {};

  // LIST SCREEN
  if (selectedScreens?.list !== false && fields.length > 0) {
    screens.list = {
      name: `${camelName}List`,
      type: 'list',
      description: `List view dengan search dan pagination (${builder})`,
      code: generateListScreen(tableName, fields, camelName, builder),
    };
  }

  // FORM SCREEN
  if (selectedScreens?.form !== false) {
    screens.form = {
      name: `${camelName}Form`,
      type: 'form',
      description: `Form untuk create/edit (${builder})`,
      code: generateFormScreen(tableName, fields, camelName, builder),
    };
  }

  // DETAIL SCREEN
  if (selectedScreens?.detail !== false) {
    screens.detail = {
      name: `${camelName}Detail`,
      type: 'detail',
      description: `Detail view (${builder})`,
      code: generateDetailScreen(tableName, fields, camelName, builder),
    };
  }

  // DASHBOARD
  if (selectedScreens?.dashboard !== false) {
    screens.dashboard = {
      name: `${camelName}Dashboard`,
      type: 'dashboard',
      description: `Dashboard dengan metrics (${builder})`,
      code: generateDashboard(tableName, fields, camelName, builder),
    };
  }

  return screens;
}

// Generate List Screen based on builder
function generateListScreen(tableName, fields, camelName, builder) {
  const searchableFields = fields.filter(f => ['text', 'select'].includes(f.type)).slice(0, 3);

  if (builder === 'mavicore' || builder === 'sandbox') {
    return `// ${camelName}ListScreen.jsx
// ${builder === 'mavicore' ? 'MaviCore' : 'Sandbox'} - Auto-generated

import React, { useState, useEffect } from 'react';
import { Search, Plus, RefreshCw, Card, Badge, Button, Input } from '@/components';
import { getTableRecords, addTableRecord } from '@/utils/supabaseTablesDB';

export default function ${camelName}List({ onSelect, onCreateNew }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => { loadRecords(); }, []);

  const loadRecords = async () => {
    setLoading(true);
    try {
      const data = await getTableRecords('${tableName}');
      setRecords(data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const filtered = records.filter(r => {
    if (!searchTerm) return true;
    return ${searchableFields.map(f =>
      `String(r.${f.name} || '').toLowerCase().includes(searchTerm.toLowerCase())`
    ).join(' || ')};
  });

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">${tableName}</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadRecords}><RefreshCw size={16} /></Button>
          <Button onClick={onCreateNew}><Plus size={16} /> Add</Button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <Input
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="space-y-2">
        {filtered.map((record) => (
          <Card
            key={record.id}
            className="p-4 cursor-pointer hover:shadow-md"
            onClick={() => onSelect?.(record)}
          >
            <div className="flex justify-between">
              <div className="space-y-1">
                ${fields.slice(0, 2).map(f => `<p className="font-medium">{record.${f.name}}</p>`).join('\n                ')}
              </div>
              <Badge>{record.status || 'Active'}</Badge>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}`;
  }

  // GlueStack
  return `// ${camelName}ListScreen.jsx
// GlueStack - Auto-generated

import React from 'react';
import { VStack, HStack, Box, Text, Button, Input, InputField } from '@/components';
import { getTableRecords } from '@/utils/supabaseTablesDB';

export default function ${camelName}List({ onSelect, onCreateNew }) {
  const [searchTerm, setSearchTerm] = React.useState('');

  return (
    <Box className="p-4">
      <HStack space="md" className="mb-4">
        <Input className="flex-1">
          <InputField
            placeholder="Search..."
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
        </Input>
        <Button onPress={onCreateNew}>
          <Plus /> Add
        </Button>
      </HStack>

      <VStack space="md">
        {/* Records list here */}
      </VStack>
    </Box>
  );
}`;
}

// Generate Form Screen based on builder
function generateFormScreen(tableName, fields, camelName, builder) {
  const textFields = fields.filter(f => f.type === 'text' || f.type === 'select');
  const numberFields = fields.filter(f => f.type === 'number');

  if (builder === 'mavicore' || builder === 'sandbox') {
    return `// ${camelName}FormScreen.jsx
// ${builder === 'mavicore' ? 'MaviCore' : 'Sandbox'} - Auto-generated

import React, { useState } from 'react';
import { Card, Input, Button, Select, NumberInput } from '@/components';
import { addTableRecord, updateTableRecord } from '@/utils/supabaseTablesDB';
import toast from 'react-hot-toast';

export default function ${camelName}Form({ record, onSave, onCancel }) {
  const isEditing = !!record?.id;
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    ${fields.map(f => `${f.name}: record?.${f.name} || ''`).join(',\n    ')}
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (isEditing) {
        await updateTableRecord('${tableName}', record.id, formData);
        toast.success('Updated!');
      } else {
        await addTableRecord('${tableName}', formData);
        toast.success('Created!');
      }
      onSave?.();
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-4 max-w-2xl mx-auto">
      <Card className="p-6 space-y-4">
        <h2 className="text-lg font-bold">{isEditing ? 'Edit' : 'New'} ${tableName}</h2>

        ${textFields.map(f => `
        <div>
          <label className="block text-sm font-medium mb-1">${f.label || f.name}${f.required ? ' *' : ''}</label>
          ${f.type === 'select' ? `
          <Select
            value={formData.${f.name}}
            onChange={(v) => handleChange('${f.name}', v)}
            options={[{ label: 'Option 1', value: 'opt1' }]}
          />` : `
          <Input
            value={formData.${f.name}}
            onChange={(e) => handleChange('${f.name}', e.target.value)}
            placeholder="Enter ${f.label || f.name}..."
          />`}
        </div>`).join('\n        ')}

        ${numberFields.map(f => `
        <div>
          <label className="block text-sm font-medium mb-1">${f.label || f.name}</label>
          <NumberInput
            value={formData.${f.name} || 0}
            onChange={(v) => handleChange('${f.name}', v)}
          />
        </div>`).join('\n        ')}

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
          <Button type="submit" loading={saving}>
            {isEditing ? 'Update' : 'Create'}
          </Button>
        </div>
      </Card>
    </form>
  );
}`;
  }

  // GlueStack
  return `// ${camelName}FormScreen.jsx
// GlueStack - Auto-generated

import React from 'react';
import { Box, Text, Button, Input, InputField, FormControl, FormControlLabel } from '@/components';

export default function ${camelName}Form({ record, onSave, onCancel }) {
  return (
    <Box className="p-4">
      ${fields.slice(0, 4).map(f => `
      <FormControl className="mb-4">
        <FormControlLabel>${f.label || f.name}</FormControlLabel>
        <Input>
          <InputField />
        </Input>
      </FormControl>`).join('\n      ')}
    </Box>
  );
}`;
}

// Generate Detail Screen
function generateDetailScreen(tableName, fields, camelName, builder) {
  return `// ${camelName}DetailScreen.jsx
// Auto-generated

import React from 'react';
import { Card, Badge, Button } from '@/components';
import { Edit3, Trash2, ArrowLeft } from 'lucide-react';

export default function ${camelName}Detail({ record, onEdit, onDelete, onBack }) {
  if (!record) return <div className="p-8 text-center">Select a record</div>;

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between">
        <Button variant="ghost" onClick={onBack}><ArrowLeft /> Back</Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => onEdit?.(record)}><Edit3 /> Edit</Button>
          <Button variant="danger" onClick={() => onDelete?.(record.id)}><Trash2 /> Delete</Button>
        </div>
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">${tableName} Details</h2>
        <div className="grid grid-cols-2 gap-4">
          ${fields.slice(0, 6).map(f => `
          <div>
            <p className="text-sm text-slate-500">${f.label || f.name}</p>
            <p className="font-medium">{record.${f.name} || '-'}</p>
          </div>`).join('\n          ')}
        </div>
      </Card>
    </div>
  );
}`;
}

// Generate Dashboard
function generateDashboard(tableName, fields, camelName, builder) {
  const numberFields = fields.filter(f => f.type === 'number').slice(0, 3);
  const statusField = fields.find(f => f.type === 'select' && /status/i.test(f.name));

  return `// ${camelName}Dashboard.jsx
// Auto-generated

import React, { useState, useEffect } from 'react';
import { Card, Badge, Button } from '@/components';
import { RefreshCw } from 'lucide-react';
import { getTableRecords } from '@/utils/supabaseTablesDB';

export default function ${camelName}Dashboard() {
  const [records, setRecords] = useState([]);

  useEffect(() => {
    getTableRecords('${tableName}').then(setRecords).catch(console.error);
  }, []);

  const metrics = {
    total: records.length,
    ${numberFields.map(f => `${f.name}: records.reduce((s, r) => s + (Number(r.${f.name}) || 0), 0)`).join(',\n    ')}
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between">
        <h1 className="text-xl font-bold">${tableName} Dashboard</h1>
        <Button variant="outline" onClick={() => window.location.reload()}>
          <RefreshCw /> Refresh
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-slate-500">Total Records</p>
          <p className="text-2xl font-bold">{metrics.total}</p>
        </Card>
        ${numberFields.map(f => `
        <Card className="p-4">
          <p className="text-sm text-slate-500">Total ${f.label || f.name}</p>
          <p className="text-2xl font-bold">{metrics.${f.name}.toLocaleString()}</p>
        </Card>`).join('\n        ')}
      </div>
    </div>
  );
}`;
}

// Copy all screens to clipboard
function copyAllToClipboard(screens) {
  const allCode = Object.entries(screens)
    .map(([name, content]) => `// ${name}\n${content.code}`)
    .join('\n\n');
  navigator.clipboard.writeText(allCode);
  toast.success('All screens copied!');
}

// Screen Preview Component
function ScreenPreview({ type, content, builder, onCopy }) {
  const [expanded, setExpanded] = useState(true);

  const typeConfig = {
    list: { icon: List, color: '#3b82f6', label: 'List Screen' },
    form: { icon: FileText, color: '#22c55e', label: 'Form Screen' },
    detail: { icon: Eye, color: '#f59e0b', label: 'Detail Screen' },
    dashboard: { icon: BarChart3, color: '#8b5cf6', label: 'Dashboard' }
  };

  const config = typeConfig[type] || typeConfig.list;
  const Icon = config.icon;

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div
        className="px-4 py-3 flex items-center justify-between cursor-pointer"
        style={{ backgroundColor: `${config.color}10` }}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: config.color }}>
            <Icon size={16} className="text-white" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800">{content.name}</h3>
            <p className="text-xs text-slate-500">{content.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); onCopy(content.code); }}
            className="px-3 py-1.5 rounded-lg bg-white text-sm font-medium text-slate-600 hover:bg-slate-50 flex items-center gap-1"
          >
            <Copy size={14} /> Copy
          </button>
          <span className="text-slate-400">{expanded ? '▲' : '▼'}</span>
        </div>
      </div>

      {expanded && (
        <pre className="p-4 text-xs font-mono overflow-x-auto bg-slate-900 text-slate-100 max-h-96">
          {content.code}
        </pre>
      )}
    </div>
  );
}

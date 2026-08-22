import React, { useEffect, useMemo, useState } from 'react';
import { 
    Plus, Search, Variable, X, Trash2, Pencil, RefreshCw, 
    ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, 
    Filter, ArrowUpDown, Layers, Database, Check, Eye
} from 'lucide-react';
import { getAllVariables, saveVariable, deleteVariable, getAllFrontlineApps } from '../utils/supabaseFrontlineDB';

const VARIABLE_TYPES = [
    { value: 'TEXT', label: 'Text', description: 'A sequence of characters, like "foo" or "abc123"' },
    { value: 'INTEGER', label: 'Integer', description: 'A whole number without fractional component' },
    { value: 'NUMBER', label: 'Number', description: 'Any real number (including decimals)' },
    { value: 'BOOLEAN', label: 'Boolean', description: 'True or false' },
    { value: 'DATETIME', label: 'Datetime', description: 'A time and date value' },
    { value: 'INTERVAL', label: 'Interval', description: 'An amount of time measured in seconds' },
    { value: 'COLOR', label: 'Color', description: 'Color picker value or HEX code' },
    { value: 'IMAGE', label: 'Image', description: 'Image uploaded from file or URL' },
    { value: 'VIDEO', label: 'Video', description: 'Video uploaded from file or URL' },
    { value: 'USER', label: 'User', description: 'Any user in the system' },
    { value: 'MACHINE', label: 'Machine', description: 'Any connected machine on shop floor' },
    { value: 'OBJECT', label: 'Object', description: 'Object/JSON output (e.g. connector output)' },
    { value: 'STATION', label: 'Station', description: 'Any station on shop floor' },
    { value: 'ARRAY', label: 'Array', description: 'Array of any supported variable type' }
];

const TYPE_COLORS = {
    TEXT: { bg: '#f1f5f9', color: '#334155', border: '#cbd5e1' },
    INTEGER: { bg: '#fef3c7', color: '#92400e', border: '#fde68a' },
    NUMBER: { bg: '#fff7ed', color: '#c2410c', border: '#fed7aa' },
    BOOLEAN: { bg: '#ecfdf5', color: '#047857', border: '#a7f3d0' },
    DATETIME: { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
    INTERVAL: { bg: '#e0e7ff', color: '#4338ca', border: '#c7d2fe' },
    COLOR: { bg: '#f3e8ff', color: '#6b21a8', border: '#e9d5ff' },
    IMAGE: { bg: '#e0f2fe', color: '#0369a1', border: '#bae6fd' },
    VIDEO: { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' },
    USER: { bg: '#fae8ff', color: '#86198f', border: '#f5d0fe' },
    MACHINE: { bg: '#f5f3ff', color: '#5b21b6', border: '#ddd6fe' },
    OBJECT: { bg: '#ffe4e6', color: '#be123c', border: '#fecdd3' },
    STATION: { bg: '#f0fdfa', color: '#0f766e', border: '#99f6e4' },
    ARRAY: { bg: '#fff1f2', color: '#9f1239', border: '#fecdd3' }
};

const emptyVariable = {
    name: '',
    type: 'TEXT',
    defaultValue: '',
    clearOnCompletion: true,
    saveForAnalysis: true,
    whereUsed: '-',
    validationRules: {
        required: false,
        min: '',
        max: '',
        regex: '',
        options: ''
    }
};

// Convert DB row → UI variable object
function dbRowToVariable(row) {
    let defaultValue = '';
    try {
        defaultValue = row.default_value !== null ? JSON.parse(row.default_value) : '';
    } catch {
        defaultValue = row.default_value ?? '';
    }
    return {
        id: row.id,
        name: row.name,
        type: row.type || 'TEXT',
        defaultValue,
        clearOnCompletion: row.clear_on_completion ?? true,
        saveForAnalysis: row.save_for_analysis ?? true,
        whereUsed: row.where_used || '-',
        validationRules: {
            required: row.validation_rules?.required ?? false,
            min: row.validation_rules?.min ?? '',
            max: row.validation_rules?.max ?? '',
            regex: row.validation_rules?.regex ?? '',
            options: Array.isArray(row.validation_rules?.options)
                ? row.validation_rules.options.join(', ')
                : (row.validation_rules?.options ?? '')
        }
    };
}

function stringifyDefaultValue(value) {
    if (value === null || value === undefined) return '';
    if (typeof value === 'object') {
        try {
            return JSON.stringify(value);
        } catch {
            return String(value);
        }
    }
    return String(value);
}

function objectContainsVariableRef(value, variableName, parentKey = '') {
    if (value === null || value === undefined) return false;

    if (typeof value === 'string') {
        if (value.includes(`@${variableName}`)) return true;
        
        // Check common property keys that store variable names
        const variableKeys = [
            'varSource', 'variable', 'varPath', 'targetVariable', 
            'variableName', 'sourceVariable', 'inputVariable', 'outputVariable'
        ];
        if (variableKeys.includes(parentKey) && value === variableName) return true;
        
        return false;
    }

    if (Array.isArray(value)) {
        return value.some((item) => objectContainsVariableRef(item, variableName, parentKey));
    }

    if (typeof value === 'object') {
        return Object.entries(value).some(([k, v]) => objectContainsVariableRef(v, variableName, k));
    }

    return false;
}

function computeWhereUsed(variableName, apps) {
    const hits = [];

    (apps || []).forEach((app) => {
        const cfg = app?.config || {};
        const appLabel = app?.name || 'Unnamed App';

        if ((cfg.appVariables || []).some((v) => v?.name === variableName)) {
            hits.push(`${appLabel} › App Variable`);
        }

        if (objectContainsVariableRef(cfg.baseComponents || [], variableName)) {
            hits.push(`${appLabel} › Base Layout`);
        }

        (cfg.steps || []).forEach((step) => {
            (step.components || []).forEach((comp) => {
                if (objectContainsVariableRef(comp, variableName)) {
                    const widgetName = comp?.props?.label || comp?.props?.text || comp?.type || 'Widget';
                    hits.push(`${appLabel} › ${step?.title || 'Step'} › ${widgetName}`);
                }
            });

            if (objectContainsVariableRef(step?.triggers || [], variableName)) {
                hits.push(`${appLabel} › ${step?.title || 'Step'} › Triggers`);
            }
        });

        if (objectContainsVariableRef(cfg.appTriggers || [], variableName)) {
            hits.push(`${appLabel} › App Triggers`);
        }
    });

    const uniqueHits = Array.from(new Set(hits));
    if (!uniqueHits.length) return '-';
    if (uniqueHits.length <= 3) return uniqueHits.join(' | ');
    return `${uniqueHits.slice(0, 3).join(' | ')} | +${uniqueHits.length - 3} more`;
}

const VariableManager = () => {
    const [variables, setVariables] = useState([]);
    const [search, setSearch] = useState('');
    const [selectedType, setSelectedType] = useState('ALL');
    const [sortBy, setSortBy] = useState('NAME_ASC');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [editor, setEditor] = useState({ isOpen: false, isEdit: false, variable: emptyVariable });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [syncingUsage, setSyncingUsage] = useState(false);
    const [error, setError] = useState(null);

    const loadAllVars = () => {
        setLoading(true);
        getAllVariables()
            .then(rows => setVariables(rows.map(dbRowToVariable)))
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    };

    // Load from DB/local store on mount & listen to real-time events
    useEffect(() => {
        loadAllVars();
        window.addEventListener('mandor_variables_updated', loadAllVars);
        return () => window.removeEventListener('mandor_variables_updated', loadAllVars);
    }, []);

    // Filter and Sort
    const filteredAndSorted = useMemo(() => {
        let list = [...variables];
        
        // Search filter
        const q = search.trim().toLowerCase();
        if (q) {
            list = list.filter(v =>
                v.name.toLowerCase().includes(q) ||
                v.type.toLowerCase().includes(q) ||
                String(v.defaultValue ?? '').toLowerCase().includes(q) ||
                String(v.whereUsed ?? '').toLowerCase().includes(q)
            );
        }

        // Type filter
        if (selectedType !== 'ALL') {
            list = list.filter(v => (v.type || 'TEXT').toUpperCase() === selectedType);
        }

        // Sorting
        list.sort((a, b) => {
            if (sortBy === 'NAME_ASC') return a.name.localeCompare(b.name);
            if (sortBy === 'NAME_DESC') return b.name.localeCompare(a.name);
            if (sortBy === 'TYPE_ASC') return (a.type || '').localeCompare(b.type || '');
            if (sortBy === 'WHERE_USED') return (b.whereUsed || '').localeCompare(a.whereUsed || '');
            return 0;
        });

        return list;
    }, [variables, search, selectedType, sortBy]);

    // Reset pagination when filter/search changes
    useEffect(() => {
        setCurrentPage(1);
    }, [search, selectedType, sortBy, pageSize]);

    // Pagination calculations
    const totalItems = filteredAndSorted.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const paginatedVariables = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredAndSorted.slice(start, start + pageSize);
    }, [filteredAndSorted, currentPage, pageSize]);

    const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
    const endItem = Math.min(currentPage * pageSize, totalItems);

    const getPageNumbers = () => {
        const pages = [];
        const maxPagesToShow = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
        let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

        if (endPage - startPage + 1 < maxPagesToShow) {
            startPage = Math.max(1, endPage - maxPagesToShow + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            pages.push(i);
        }
        return pages;
    };

    const normalizeValidationRules = (variableType, rules = {}) => {
        const required = Boolean(rules.required);
        const normalized = { required };

        if (['NUMBER', 'INTEGER', 'INTERVAL'].includes(variableType)) {
            normalized.min = rules.min !== '' ? Number(rules.min) : null;
            normalized.max = rules.max !== '' ? Number(rules.max) : null;
            if (normalized.min !== null && Number.isNaN(normalized.min)) throw new Error('Min harus angka.');
            if (normalized.max !== null && Number.isNaN(normalized.max)) throw new Error('Max harus angka.');
            if (normalized.min !== null && normalized.max !== null && normalized.min > normalized.max) {
                throw new Error('Min tidak boleh lebih besar dari Max.');
            }
        }

        if (variableType === 'TEXT') {
            const regex = String(rules.regex || '').trim();
            if (regex) {
                try {
                    // Validate regex
                    new RegExp(regex);
                    normalized.regex = regex;
                } catch {
                    throw new Error('Regex tidak valid.');
                }
            }

            const options = String(rules.options || '')
                .split(',')
                .map((v) => v.trim())
                .filter(Boolean);

            if (options.length) {
                normalized.options = options;
            }
        }

        return normalized;
    };

    const buildVariablePayloadFromEditor = () => {
        const name = editor.variable.name.trim().toUpperCase().replace(/\s+/g, '_');
        if (!name) {
            throw new Error('Variable name wajib diisi.');
        }

        if (variables.some(v => v.name === name && v.id !== editor.variable.id)) {
            throw new Error('Variable name sudah ada.');
        }

        let defaultValue = editor.variable.defaultValue;
        if (editor.variable.type === 'NUMBER') defaultValue = Number(editor.variable.defaultValue || 0);
        if (editor.variable.type === 'INTEGER' || editor.variable.type === 'INTERVAL') defaultValue = parseInt(editor.variable.defaultValue || 0, 10) || 0;
        if (editor.variable.type === 'BOOLEAN') defaultValue = Boolean(editor.variable.defaultValue);
        if (editor.variable.type === 'OBJECT') {
            try {
                defaultValue = editor.variable.defaultValue ? JSON.parse(editor.variable.defaultValue) : {};
            } catch {
                throw new Error('Object default value harus JSON valid.');
            }
        }
        if (editor.variable.type === 'ARRAY') {
            try {
                defaultValue = editor.variable.defaultValue ? JSON.parse(editor.variable.defaultValue) : [];
                if (!Array.isArray(defaultValue)) {
                    throw new Error('Array default value harus JSON array, contoh: [1,2,3]');
                }
            } catch {
                throw new Error('Array default value harus JSON array valid.');
            }
        }

        const validationRules = normalizeValidationRules(editor.variable.type, editor.variable.validationRules || {});

        if (validationRules.required) {
            const empty = defaultValue === '' || defaultValue === null || defaultValue === undefined;
            if (empty) throw new Error('Default value wajib diisi jika Required aktif.');
        }

        if (['NUMBER', 'INTEGER', 'INTERVAL'].includes(editor.variable.type)) {
            if (validationRules.min !== null && defaultValue < validationRules.min) {
                throw new Error('Default value lebih kecil dari Min.');
            }
            if (validationRules.max !== null && defaultValue > validationRules.max) {
                throw new Error('Default value lebih besar dari Max.');
            }
        }

        if (editor.variable.type === 'TEXT') {
            const textValue = String(defaultValue ?? '');
            if (validationRules.regex && !new RegExp(validationRules.regex).test(textValue)) {
                throw new Error('Default value tidak sesuai Regex.');
            }
            if (Array.isArray(validationRules.options) && validationRules.options.length && textValue) {
                if (!validationRules.options.includes(textValue)) {
                    throw new Error('Default value tidak ada di daftar Options.');
                }
            }
        }

        return { ...editor.variable, name, defaultValue, validationRules };
    };

    const refreshWhereUsed = async (currentVariables = variables) => {
        setSyncingUsage(true);
        try {
            const apps = await getAllFrontlineApps();
            const next = currentVariables.map((v) => ({
                ...v,
                whereUsed: computeWhereUsed(v.name, apps)
            }));

            setVariables(next);

            await Promise.all(next.map(async (v) => {
                await saveVariable(v);
            }));
        } catch (err) {
            alert('Gagal refresh Where Used: ' + err.message);
        } finally {
            setSyncingUsage(false);
        }
    };

    const handleSaveVariable = async () => {
        let next;
        try {
            next = buildVariablePayloadFromEditor();
        } catch (err) {
            alert(err.message);
            return;
        }

        try {
            setSaving(true);
            const saved = await saveVariable(next);
            const mapped = dbRowToVariable(saved);

            setVariables(prev => {
                if (editor.isEdit) {
                    return prev.map((x) => (x.id === mapped.id ? mapped : x));
                }
                return [...prev, mapped];
            });

            setEditor({ isOpen: false, isEdit: false, variable: emptyVariable });
        } catch (err) {
            alert('Gagal menyimpan variabel: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (variable) => {
        if (!window.confirm(`Hapus variabel "${variable.name}"?`)) return;
        try {
            await deleteVariable(variable.id);
            setVariables(prev => prev.filter(x => x.id !== variable.id));
        } catch (err) {
            alert('Gagal menghapus variabel: ' + err.message);
        }
    };

    const handleFileUpload = (file) => {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            setEditor(prev => ({ ...prev, variable: { ...prev.variable, defaultValue: reader.result } }));
        };
        reader.readAsDataURL(file);
    };

    const openCreateEditor = () => {
        setEditor({
            isOpen: true,
            isEdit: false,
            variable: { ...emptyVariable, validationRules: { ...emptyVariable.validationRules } }
        });
    };

    const openEditEditor = (variable) => {
        setEditor({
            isOpen: true,
            isEdit: true,
            variable: {
                ...variable,
                defaultValue: stringifyDefaultValue(variable.defaultValue),
                validationRules: {
                    required: variable.validationRules?.required ?? false,
                    min: variable.validationRules?.min ?? '',
                    max: variable.validationRules?.max ?? '',
                    regex: variable.validationRules?.regex ?? '',
                    options: Array.isArray(variable.validationRules?.options)
                        ? variable.validationRules.options.join(', ')
                        : (variable.validationRules?.options ?? '')
                }
            }
        });
    };

    return (
        <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: '100%', color: '#0f172a', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* ── Top Header / Toolbar ── */}
            <div style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px 20px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
                        <Database size={20} />
                    </div>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>Variables</span>
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, backgroundColor: '#f1f5f9', color: '#475569', padding: '2px 8px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                {totalItems} {totalItems === 1 ? 'variable' : 'variables'}
                            </span>
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>
                            Centralized variables registry shared across App Builder, Triggers & Connectors
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
                    {/* Search */}
                    <div style={{ position: 'relative', minWidth: '220px' }}>
                        <Search size={15} style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search variable, type, value..."
                            style={{ width: '100%', padding: '8px 12px 8px 34px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.84rem', outline: 'none', backgroundColor: '#f8fafc', transition: 'all 0.2s' }}
                        />
                        {search && (
                            <button 
                                onClick={() => setSearch('')}
                                style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', color: '#94a3b8', cursor: 'pointer', padding: 0 }}
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    {/* Type Filter */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <select
                            value={selectedType}
                            onChange={(e) => setSelectedType(e.target.value)}
                            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.84rem', backgroundColor: '#f8fafc', color: '#334155', fontWeight: 600, outline: 'none', cursor: 'pointer' }}
                        >
                            <option value="ALL">All Types</option>
                            {VARIABLE_TYPES.map(t => (
                                <option key={t.value} value={t.value}>{t.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Sort By */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.84rem', backgroundColor: '#f8fafc', color: '#334155', fontWeight: 600, outline: 'none', cursor: 'pointer' }}
                        >
                            <option value="NAME_ASC">Name (A-Z)</option>
                            <option value="NAME_DESC">Name (Z-A)</option>
                            <option value="TYPE_ASC">Type</option>
                            <option value="WHERE_USED">Where Used</option>
                        </select>
                    </div>

                    {/* Sync Usage */}
                    <button
                        onClick={() => refreshWhereUsed()}
                        disabled={syncingUsage || loading}
                        style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', backgroundColor: 'white', color: '#334155', fontWeight: 600, fontSize: '0.84rem', cursor: syncingUsage ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px', transition: 'background-color 0.2s' }}
                        title="Scan all apps to update Where-Used references"
                    >
                        <RefreshCw size={14} className={syncingUsage ? 'animate-spin' : ''} />
                        {syncingUsage ? 'Syncing...' : 'Refresh Usage'}
                    </button>

                    {/* Create Button */}
                    <button
                        onClick={openCreateEditor}
                        style={{ padding: '8px 16px', border: 'none', borderRadius: '8px', backgroundColor: '#2563eb', color: 'white', fontWeight: 700, fontSize: '0.84rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 2px 4px rgba(37,99,235,0.2)', transition: 'background-color 0.2s' }}
                    >
                        <Plus size={16} /> Create Variable
                    </button>
                </div>
            </div>

            {/* ── Main Table Card ── */}
            <div style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column' }}>
                {error && (
                    <div style={{ padding: '12px 16px', backgroundColor: '#fef2f2', color: '#b91c1c', fontSize: '0.85rem', borderBottom: '1px solid #fecaca' }}>
                        ⚠ Error: {error}
                    </div>
                )}

                {/* ── Scrollable Table Viewport ── */}
                <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: 'calc(100vh - 290px)', minHeight: '380px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
                            <tr>
                                <th style={{ padding: '12px 16px', fontSize: '0.72rem', color: '#475569', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', width: '120px' }}>TYPE</th>
                                <th style={{ padding: '12px 16px', fontSize: '0.72rem', color: '#475569', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', minWidth: '180px' }}>NAME</th>
                                <th style={{ padding: '12px 16px', fontSize: '0.72rem', color: '#475569', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', minWidth: '140px' }}>DEFAULT VALUE</th>
                                <th style={{ padding: '12px 16px', fontSize: '0.72rem', color: '#475569', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>WHERE USED</th>
                                <th style={{ padding: '12px 16px', fontSize: '0.72rem', color: '#475569', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right', width: '90px' }}>ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={5} style={{ textAlign: 'center', padding: '60px 16px', color: '#64748b' }}>
                                        <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 12px', color: '#3b82f6' }} />
                                        <div style={{ fontSize: '0.92rem', fontWeight: 600, color: '#334155' }}>Loading variables...</div>
                                        <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '4px' }}>Syncing with app registry & Supabase</div>
                                    </td>
                                </tr>
                            ) : paginatedVariables.length === 0 ? (
                                <tr>
                                    <td colSpan={5} style={{ textAlign: 'center', padding: '60px 16px', color: '#64748b' }}>
                                        <Variable size={42} color="#cbd5e1" style={{ margin: '0 auto 12px' }} />
                                        <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#334155' }}>
                                            {search || selectedType !== 'ALL' ? 'No matching variables found' : 'No variables found'}
                                        </div>
                                        <div style={{ fontSize: '0.84rem', marginTop: '6px', color: '#64748b' }}>
                                            {search || selectedType !== 'ALL' ? 'Try adjusting your search query or filter.' : 'Create your first variable or generate them via Copilot.'}
                                        </div>
                                        {(search || selectedType !== 'ALL') ? (
                                            <button
                                                onClick={() => { setSearch(''); setSelectedType('ALL'); }}
                                                style={{ marginTop: '14px', padding: '7px 14px', border: '1px solid #cbd5e1', borderRadius: '6px', backgroundColor: 'white', color: '#334155', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer' }}
                                            >
                                                Clear Filters
                                            </button>
                                        ) : (
                                            <button
                                                onClick={openCreateEditor}
                                                style={{ marginTop: '14px', padding: '8px 16px', border: 'none', borderRadius: '6px', backgroundColor: '#2563eb', color: 'white', fontWeight: 700, fontSize: '0.84rem', cursor: 'pointer' }}
                                            >
                                                + Create Variable
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ) : (
                                paginatedVariables.map((v) => {
                                    const typeMeta = TYPE_COLORS[v.type] || TYPE_COLORS.TEXT;
                                    const typeLabel = VARIABLE_TYPES.find(t => t.value === v.type)?.label || v.type || 'Text';
                                    const rawWhereUsed = String(v.whereUsed || '-');
                                    const whereUsedParts = rawWhereUsed !== '-' ? rawWhereUsed.split(' | ') : [];

                                    return (
                                        <tr 
                                            key={v.id || v.name} 
                                            style={{ borderTop: '1px solid #f1f5f9', transition: 'background-color 0.15s' }}
                                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                        >
                                            {/* Type Badge */}
                                            <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                                                <span style={{ 
                                                    display: 'inline-flex', 
                                                    alignItems: 'center', 
                                                    padding: '3px 8px', 
                                                    borderRadius: '6px', 
                                                    fontSize: '0.74rem', 
                                                    fontWeight: 700, 
                                                    backgroundColor: typeMeta.bg, 
                                                    color: typeMeta.color, 
                                                    border: `1px solid ${typeMeta.border}` 
                                                }}>
                                                    {typeLabel}
                                                </span>
                                            </td>

                                            {/* Name */}
                                            <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                                                <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#0f172a', fontFamily: 'monospace' }}>
                                                    {v.name}
                                                </div>
                                                {v.validationRules?.required && (
                                                    <span style={{ fontSize: '0.68rem', color: '#dc2626', fontWeight: 600, display: 'inline-block', marginTop: '2px' }}>
                                                        *Required
                                                    </span>
                                                )}
                                            </td>

                                            {/* Default Value */}
                                            <td style={{ padding: '12px 16px', fontSize: '0.84rem', color: '#334155', verticalAlign: 'middle' }}>
                                                {v.type === 'BOOLEAN' ? (
                                                    <span style={{ 
                                                        padding: '2px 8px', 
                                                        borderRadius: '4px', 
                                                        fontSize: '0.74rem', 
                                                        fontWeight: 700, 
                                                        backgroundColor: String(v.defaultValue) === 'true' ? '#dcfce7' : '#f1f5f9', 
                                                        color: String(v.defaultValue) === 'true' ? '#15803d' : '#64748b' 
                                                    }}>
                                                        {String(v.defaultValue) === 'true' ? 'TRUE' : 'FALSE'}
                                                    </span>
                                                ) : v.type === 'COLOR' && v.defaultValue ? (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                        <div style={{ width: '14px', height: '14px', borderRadius: '4px', backgroundColor: String(v.defaultValue), border: '1px solid #cbd5e1' }} />
                                                        <span style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{String(v.defaultValue)}</span>
                                                    </div>
                                                ) : String(v.defaultValue ?? '') === '' ? (
                                                    <span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '0.78rem' }}>(empty)</span>
                                                ) : (
                                                    <span style={{ fontFamily: ['NUMBER', 'INTEGER', 'INTERVAL'].includes(v.type) ? 'monospace' : 'inherit' }}>
                                                        {String(v.defaultValue)}
                                                    </span>
                                                )}
                                            </td>

                                            {/* Where Used */}
                                            <td style={{ padding: '12px 16px', fontSize: '0.82rem', color: '#475569', verticalAlign: 'middle' }}>
                                                {whereUsedParts.length === 0 ? (
                                                    <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Not used</span>
                                                ) : (
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', alignItems: 'center' }}>
                                                        {whereUsedParts.map((part, idx) => (
                                                            <span 
                                                                key={idx}
                                                                style={{ 
                                                                    backgroundColor: '#f1f5f9', 
                                                                    border: '1px solid #e2e8f0', 
                                                                    borderRadius: '4px', 
                                                                    padding: '2px 7px', 
                                                                    fontSize: '0.74rem', 
                                                                    color: '#334155' 
                                                                }}
                                                            >
                                                                {part}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </td>

                                            {/* Actions */}
                                            <td style={{ padding: '12px 16px', textAlign: 'right', verticalAlign: 'middle' }}>
                                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                                    <button
                                                        onClick={() => openEditEditor(v)}
                                                        style={{ border: 'none', background: 'none', color: '#2563eb', padding: '6px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background-color 0.15s' }}
                                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#eff6ff'}
                                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                                        title="Edit variable"
                                                    >
                                                        <Pencil size={15} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(v)}
                                                        style={{ border: 'none', background: 'none', color: '#ef4444', padding: '6px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background-color 0.15s' }}
                                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fef2f2'}
                                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                                        title="Delete variable"
                                                    >
                                                        <Trash2 size={15} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* ── Pro Pagination Footer ── */}
                <div style={{ padding: '12px 20px', borderTop: '1px solid #e2e8f0', backgroundColor: '#ffffff', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                    {/* Rows per page */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: '#64748b' }}>
                        <span>Rows per page:</span>
                        <select
                            value={pageSize}
                            onChange={(e) => setPageSize(Number(e.target.value))}
                            style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem', backgroundColor: '#f8fafc', color: '#334155', fontWeight: 600, outline: 'none', cursor: 'pointer' }}
                        >
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                        </select>
                    </div>

                    {/* Counter */}
                    <div style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 500 }}>
                        Showing <strong style={{ color: '#0f172a' }}>{startItem}</strong> to <strong style={{ color: '#0f172a' }}>{endItem}</strong> of <strong style={{ color: '#0f172a' }}>{totalItems}</strong> variables
                    </div>

                    {/* Page Controls */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {/* First Page */}
                        <button
                            onClick={() => setCurrentPage(1)}
                            disabled={currentPage === 1}
                            style={{ 
                                width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                                border: '1px solid #cbd5e1', borderRadius: '6px', backgroundColor: currentPage === 1 ? '#f8fafc' : 'white', 
                                color: currentPage === 1 ? '#cbd5e1' : '#475569', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' 
                            }}
                            title="First Page"
                        >
                            <ChevronsLeft size={16} />
                        </button>

                        {/* Prev Page */}
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            style={{ 
                                width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                                border: '1px solid #cbd5e1', borderRadius: '6px', backgroundColor: currentPage === 1 ? '#f8fafc' : 'white', 
                                color: currentPage === 1 ? '#cbd5e1' : '#475569', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' 
                            }}
                            title="Previous Page"
                        >
                            <ChevronLeft size={16} />
                        </button>

                        {/* Page Numbers */}
                        {getPageNumbers().map(p => (
                            <button
                                key={p}
                                onClick={() => setCurrentPage(p)}
                                style={{ 
                                    minWidth: '32px', height: '32px', padding: '0 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                                    border: p === currentPage ? '1px solid #2563eb' : '1px solid #cbd5e1', 
                                    borderRadius: '6px', 
                                    backgroundColor: p === currentPage ? '#2563eb' : 'white', 
                                    color: p === currentPage ? 'white' : '#334155', 
                                    fontWeight: p === currentPage ? 700 : 500, 
                                    fontSize: '0.82rem', 
                                    cursor: 'pointer' 
                                }}
                            >
                                {p}
                            </button>
                        ))}

                        {/* Next Page */}
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages || totalPages === 0}
                            style={{ 
                                width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                                border: '1px solid #cbd5e1', borderRadius: '6px', backgroundColor: (currentPage === totalPages || totalPages === 0) ? '#f8fafc' : 'white', 
                                color: (currentPage === totalPages || totalPages === 0) ? '#cbd5e1' : '#475569', cursor: (currentPage === totalPages || totalPages === 0) ? 'not-allowed' : 'pointer' 
                            }}
                            title="Next Page"
                        >
                            <ChevronRight size={16} />
                        </button>

                        {/* Last Page */}
                        <button
                            onClick={() => setCurrentPage(totalPages)}
                            disabled={currentPage === totalPages || totalPages === 0}
                            style={{ 
                                width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                                border: '1px solid #cbd5e1', borderRadius: '6px', backgroundColor: (currentPage === totalPages || totalPages === 0) ? '#f8fafc' : 'white', 
                                color: (currentPage === totalPages || totalPages === 0) ? '#cbd5e1' : '#475569', cursor: (currentPage === totalPages || totalPages === 0) ? 'not-allowed' : 'pointer' 
                            }}
                            title="Last Page"
                        >
                            <ChevronsRight size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {editor.isOpen && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.35)', display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end', padding: '72px 24px', zIndex: 2000 }}>
                    <div style={{ width: '340px', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '10px', boxShadow: '0 20px 35px rgba(15,23,42,0.18)' }}>
                        <div style={{ padding: '12px 14px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>{editor.isEdit ? 'Edit Variable' : 'Create Variable'}</div>
                            <button onClick={() => setEditor({ isOpen: false, isEdit: false, variable: emptyVariable })} style={{ border: 'none', background: 'none', color: '#64748b', cursor: 'pointer' }}><X size={16} /></button>
                        </div>

                        <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', color: '#475569', marginBottom: '6px', fontWeight: 700 }}>Variable name</label>
                                <input
                                    value={editor.variable.name}
                                    onChange={(e) => setEditor({ ...editor, variable: { ...editor.variable, name: e.target.value.toUpperCase().replace(/\s+/g, '_') } })}
                                    style={{ width: '100%', padding: '9px 10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.85rem' }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', color: '#475569', marginBottom: '6px', fontWeight: 700 }}>Variable type</label>
                                <select
                                    value={editor.variable.type}
                                    onChange={(e) => setEditor({ ...editor, variable: { ...editor.variable, type: e.target.value, defaultValue: '' } })}
                                    style={{ width: '100%', padding: '9px 10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.85rem' }}
                                >
                                    {VARIABLE_TYPES.map((type) => (
                                        <option key={type.value} value={type.value}>{type.label}</option>
                                    ))}
                                </select>
                                <div style={{ marginTop: '6px', fontSize: '0.72rem', color: '#64748b' }}>
                                    {VARIABLE_TYPES.find(t => t.value === editor.variable.type)?.description}
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', color: '#475569', marginBottom: '6px', fontWeight: 700 }}>Default value</label>
                                {editor.variable.type === 'BOOLEAN' ? (
                                    <select
                                        value={String(Boolean(editor.variable.defaultValue))}
                                        onChange={(e) => setEditor({ ...editor, variable: { ...editor.variable, defaultValue: e.target.value === 'true' } })}
                                        style={{ width: '100%', padding: '9px 10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.85rem' }}
                                    >
                                        <option value="false">False</option>
                                        <option value="true">True</option>
                                    </select>
                                ) : editor.variable.type === 'COLOR' ? (
                                    <div style={{ display: 'grid', gridTemplateColumns: '42px 1fr', gap: '8px' }}>
                                        <input
                                            type="color"
                                            value={editor.variable.defaultValue || '#3b82f6'}
                                            onChange={(e) => setEditor({ ...editor, variable: { ...editor.variable, defaultValue: e.target.value } })}
                                            style={{ width: '42px', height: '38px', borderRadius: '6px', border: '1px solid #d1d5db', padding: 0 }}
                                        />
                                        <input
                                            value={editor.variable.defaultValue || ''}
                                            onChange={(e) => setEditor({ ...editor, variable: { ...editor.variable, defaultValue: e.target.value } })}
                                            placeholder="#3b82f6"
                                            style={{ width: '100%', padding: '9px 10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.85rem' }}
                                        />
                                    </div>
                                ) : (editor.variable.type === 'IMAGE' || editor.variable.type === 'VIDEO') ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <input
                                            value={editor.variable.defaultValue || ''}
                                            onChange={(e) => setEditor({ ...editor, variable: { ...editor.variable, defaultValue: e.target.value } })}
                                            placeholder={`https://example.com/${editor.variable.type === 'IMAGE' ? 'image.png' : 'video.mp4'}`}
                                            style={{ width: '100%', padding: '9px 10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.85rem' }}
                                        />
                                        <input
                                            type="file"
                                            accept={editor.variable.type === 'IMAGE' ? 'image/*' : 'video/*'}
                                            onChange={(e) => handleFileUpload(e.target.files?.[0])}
                                            style={{ fontSize: '0.8rem' }}
                                        />
                                    </div>
                                ) : (editor.variable.type === 'ARRAY' || editor.variable.type === 'OBJECT') ? (
                                    <textarea
                                        value={editor.variable.defaultValue || ''}
                                        onChange={(e) => setEditor({ ...editor, variable: { ...editor.variable, defaultValue: e.target.value } })}
                                        placeholder={editor.variable.type === 'ARRAY' ? '["a", "b"]' : '{"key":"value"}'}
                                        rows={4}
                                        style={{ width: '100%', padding: '9px 10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.85rem', fontFamily: 'monospace' }}
                                    />
                                ) : (
                                    <input
                                        type={['NUMBER', 'INTEGER', 'INTERVAL'].includes(editor.variable.type) ? 'number' : (editor.variable.type === 'DATETIME' ? 'datetime-local' : 'text')}
                                        value={editor.variable.defaultValue}
                                        onChange={(e) => setEditor({ ...editor, variable: { ...editor.variable, defaultValue: e.target.value } })}
                                        style={{ width: '100%', padding: '9px 10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.85rem' }}
                                    />
                                )}
                            </div>

                            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '10px' }}>
                                <div style={{ fontSize: '0.75rem', color: '#475569', fontWeight: 700, marginBottom: '8px' }}>Validation</div>

                                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem', color: '#334155', marginBottom: '8px' }}>
                                    <span>Required</span>
                                    <input
                                        type="checkbox"
                                        checked={Boolean(editor.variable.validationRules?.required)}
                                        onChange={(e) => setEditor({ ...editor, variable: { ...editor.variable, validationRules: { ...editor.variable.validationRules, required: e.target.checked } } })}
                                    />
                                </label>

                                {['NUMBER', 'INTEGER', 'INTERVAL'].includes(editor.variable.type) && (
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.72rem', color: '#64748b', marginBottom: '4px' }}>Min</label>
                                            <input
                                                type="number"
                                                value={editor.variable.validationRules?.min ?? ''}
                                                onChange={(e) => setEditor({ ...editor, variable: { ...editor.variable, validationRules: { ...editor.variable.validationRules, min: e.target.value } } })}
                                                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.82rem' }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.72rem', color: '#64748b', marginBottom: '4px' }}>Max</label>
                                            <input
                                                type="number"
                                                value={editor.variable.validationRules?.max ?? ''}
                                                onChange={(e) => setEditor({ ...editor, variable: { ...editor.variable, validationRules: { ...editor.variable.validationRules, max: e.target.value } } })}
                                                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.82rem' }}
                                            />
                                        </div>
                                    </div>
                                )}

                                {editor.variable.type === 'TEXT' && (
                                    <>
                                        <div style={{ marginBottom: '8px' }}>
                                            <label style={{ display: 'block', fontSize: '0.72rem', color: '#64748b', marginBottom: '4px' }}>Regex</label>
                                            <input
                                                value={editor.variable.validationRules?.regex ?? ''}
                                                onChange={(e) => setEditor({ ...editor, variable: { ...editor.variable, validationRules: { ...editor.variable.validationRules, regex: e.target.value } } })}
                                                placeholder="contoh: ^[A-Z0-9_-]+$"
                                                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.82rem' }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.72rem', color: '#64748b', marginBottom: '4px' }}>Options (comma separated)</label>
                                            <input
                                                value={editor.variable.validationRules?.options ?? ''}
                                                onChange={(e) => setEditor({ ...editor, variable: { ...editor.variable, validationRules: { ...editor.variable.validationRules, options: e.target.value } } })}
                                                placeholder="OK, NG, HOLD"
                                                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.82rem' }}
                                            />
                                        </div>
                                    </>
                                )}
                            </div>

                            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem', color: '#334155' }}>
                                <span>Clear on completion</span>
                                <input
                                    type="checkbox"
                                    checked={editor.variable.clearOnCompletion}
                                    onChange={(e) => setEditor({ ...editor, variable: { ...editor.variable, clearOnCompletion: e.target.checked } })}
                                />
                            </label>

                            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem', color: '#334155' }}>
                                <span>Save for analysis</span>
                                <input
                                    type="checkbox"
                                    checked={editor.variable.saveForAnalysis}
                                    onChange={(e) => setEditor({ ...editor, variable: { ...editor.variable, saveForAnalysis: e.target.checked } })}
                                />
                            </label>
                        </div>

                        <div style={{ padding: '12px 14px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                            <button onClick={() => setEditor({ isOpen: false, variable: emptyVariable })} style={{ border: '1px solid #d1d5db', backgroundColor: 'white', color: '#334155', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
                            <button
                                onClick={handleSaveVariable}
                                disabled={saving}
                                style={{ border: 'none', backgroundColor: saving ? '#93c5fd' : '#3b82f6', color: 'white', padding: '8px 14px', borderRadius: '6px', cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 700 }}
                            >
                                {saving ? 'Menyimpan...' : (editor.isEdit ? 'Save Changes' : '+ Create')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VariableManager;

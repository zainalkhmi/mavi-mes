import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
    Table, Plus, Search, Database, ArrowUpDown, Trash2, Archive, Rows3, Columns3,
    Info, RefreshCw, Upload, X, Lock, Type, ChevronDown, Settings, Edit3, Edit2,
    Hash, Calendar, CheckSquare, User, Clock, Filter, Group, MoreHorizontal,
    ChevronRight, ChevronLeft, ChevronsLeft, ChevronsRight, LayoutGrid, GripVertical,
    Eye, MoreVertical, Layers, Key, Zap, AlertTriangle, Menu
} from 'lucide-react';
import {
    getTables,
    createTable,
    updateTable,
    deleteTable,
    getTableRecords,
    addTableRecord,
    updateTableRecord,
    deleteTableRecord,
    linkRecords,
    unlinkRecords,
    TABLE_FIELD_TYPES
} from '../utils/supabaseTablesDB';
import { uploadManualImage, isSupabaseReady } from '../utils/supabaseManualDB';

const FIELD_TYPE_LABELS = {
    text: 'Text',
    number: 'Number',
    boolean: 'Boolean',
    integer: 'Integer',
    interval: 'Interval (seconds)',
    image: 'Image',
    video: 'Video',
    file: 'File',
    user: 'User',
    datetime: 'Datetime',
    color: 'Color',
    linked_record: 'Linked Record',
    machine: 'Machine',
    station: 'Station'
};

const TOKENS = {
    primary: '#6366f1', // Indigo 500
    primaryLight: '#f5f3ff',
    secondary: '#8b5cf6', // Violet 500
    success: '#10b981', // Emerald 500
    warning: '#f59e0b', // Amber 500
    danger: '#ef4444', // Red 500
    sidebarBg: '#ffffff',
    sidebarText: '#334155',
    sidebarTextMuted: '#94a3b8',
    sidebarActive: '#eef2ff',
    bg: '#f8fafc', // Slate 50
    surface: '#ffffff',
    text: '#1e293b', // Slate 800
    textMuted: '#64748b', // Slate 500
    border: '#e2e8f0', // Slate 200
    borderLight: '#f1f5f9', // Slate 100
    radius: '12px',
    radiusSm: '8px',
    shadow: '0 1px 2px 0 rgb(15 23 42 / 0.05)',
    shadowLg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)'
};

const LinkedRecordSelector = ({ field, value, onChange, tables }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const [options, setOptions] = useState([]);
    const targetTable = tables?.find(t => t.id === field?.link_table_id);

    const selectedIds = useMemo(() => {
        if (!value) return [];
        if (Array.isArray(value)) return value;
        if (typeof value === 'string') {
            try { return JSON.parse(value); } catch (e) { return value.split(',').filter(Boolean); }
        }
        return [];
    }, [value]);

    useEffect(() => {
        if (field?.link_table_id) {
            getTableRecords(field.link_table_id).then(setOptions).catch(console.error);
        }
    }, [field?.link_table_id]);

    const filteredOptions = options.filter(opt =>
        String(opt.recordId || opt.record_id || '').toLowerCase().includes(searchTerm.toLowerCase()) &&
        !selectedIds.includes(opt.recordId || opt.record_id)
    );

    const handleSelect = (id) => {
        onChange([...selectedIds, id]);
        setSearchTerm('');
    };

    const handleRemove = (id) => {
        onChange(selectedIds.filter(val => val !== id));
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: TOKENS.text, fontWeight: 700, fontSize: '0.8rem' }}>
                    {field?.name}
                    <Upload size={14} style={{ color: TOKENS.textMuted, transform: 'rotate(90deg)', cursor: 'pointer' }} title="View Table" />
                </div>
                <span style={{ fontSize: '0.7rem', color: TOKENS.textMuted, fontWeight: 500 }}>
                    {field?.link_type?.replace(/_/g, ' ') || 'Many Records'}
                </span>
            </div>

            <div style={{
                border: `1px solid ${isFocused ? TOKENS.primary : TOKENS.border}`,
                borderRadius: '8px',
                padding: '10px 12px',
                backgroundColor: 'white',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                minHeight: '44px',
                position: 'relative',
                transition: 'border-color 0.2s'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Search size={16} color={TOKENS.textMuted} />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                        placeholder="Add a record..."
                        style={{ border: 'none', outline: 'none', width: '100%', fontSize: '0.9rem' }}
                    />
                </div>

                {selectedIds.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', borderTop: `1px solid ${TOKENS.borderLight}`, paddingTop: '10px' }}>
                        {selectedIds.map(id => (
                            <div key={id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 10px', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '0.8rem', fontWeight: 600, color: TOKENS.primary }}>
                                {id}
                                <X
                                    size={14}
                                    style={{ cursor: 'pointer', color: TOKENS.textMuted }}
                                    onClick={() => handleRemove(id)}
                                />
                            </div>
                        ))}
                    </div>
                )}

                {isFocused && filteredOptions.length > 0 && (
                    <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, backgroundColor: 'white', border: `1px solid ${TOKENS.border}`, borderRadius: '8px', boxShadow: TOKENS.shadowLg, zIndex: 100, maxHeight: '200px', overflowY: 'auto' }}>
                        {filteredOptions.map(opt => {
                            const rid = opt.recordId || opt.record_id;
                            return (
                                <div key={opt.id} onClick={() => handleSelect(rid)} style={{ padding: '10px 16px', cursor: 'pointer', fontSize: '0.85rem' }} onMouseEnter={(e) => e.target.style.backgroundColor = '#f8fafc'} onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}>
                                    <div style={{ fontWeight: 600 }}>{rid}</div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};


const TableManager = () => {
    const [tables, setTables] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTableId, setSelectedTableId] = useState(null);
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState(null);
    const [recordsLoading, setRecordsLoading] = useState(false);
    const [recordSearchTerm, setRecordSearchTerm] = useState('');
    const [recordSortField, setRecordSortField] = useState('recordId');
    const [recordSortDirection, setRecordSortDirection] = useState('asc');
    const [selectedRecordInternalId, setSelectedRecordInternalId] = useState(null);
    const [newTableName, setNewTableName] = useState('');
    const [newTableDescription, setNewTableDescription] = useState('');
    const [newFieldName, setNewFieldName] = useState('');
    const [newFieldType, setNewFieldType] = useState('text');
    const [newFieldReverseName, setNewFieldReverseName] = useState('');
    const [newFieldLinkType, setNewFieldLinkType] = useState('one_to_one');
    const [isEditingRecord, setIsEditingRecord] = useState(false);
    const [newRecordId, setNewRecordId] = useState('');
    const [newRecordValues, setNewRecordValues] = useState({});
    const [activePanel, setActivePanel] = useState('records');
    const [csvImporting, setCsvImporting] = useState(false);
    const [isTableSidebarOpen, setIsTableSidebarOpen] = useState(true);
    const [isFieldsSidebarOpen, setIsFieldsSidebarOpen] = useState(true);
    const [hiddenFields, setHiddenFields] = useState([]);
    const [creatingTable, setCreatingTable] = useState(false);
    const [queries, setQueries] = useState([]);
    const [aggregations, setAggregations] = useState([]);
    const [activeQueryId, setActiveQueryId] = useState(null);
    const [targetTableId, setTargetTableId] = useState('');
    const [linkedRecords, setLinkedRecords] = useState([]);
    const [linkedRecordsLoading, setLinkedRecordsLoading] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
    const [isFieldModalOpen, setIsFieldModalOpen] = useState(false);
    const [isEditTableModalOpen, setIsEditTableModalOpen] = useState(false);
    const [isRenameFieldModalOpen, setIsRenameFieldModalOpen] = useState(false);
    const [editingField, setEditingField] = useState(null);
    const [editTableName, setEditTableName] = useState('');
    const [editTableDescription, setEditTableDescription] = useState('');
    const [renameFieldNewName, setRenameFieldNewName] = useState('');
    const [activeMenuField, setActiveMenuField] = useState(null); // { name: string, x: number, y: number }
    const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);
    const [newType, setNewType] = useState('text');
    const [uploadingFields, setUploadingFields] = useState({}); // { fieldName: boolean }

    // Queries & Aggregations state
    const [isQueryEditorOpen, setIsQueryEditorOpen] = useState(false);
    const [editingQuery, setEditingQuery] = useState(null); // { id, name, matchType, filters: [], sort: [], limit }
    const [isAggregationEditorOpen, setIsAggregationEditorOpen] = useState(false);
    const [editingAggregation, setEditingAggregation] = useState(null); // { id, name, calculation, field }
    const csvInputRef = useRef(null);

    useEffect(() => {
        loadTables();
    }, []);

    useEffect(() => {
        if (!selectedTableId) {
            setRecords([]);
            setSelectedRecordInternalId(null);
            setRecordSearchTerm('');
            return;
        }
        loadRecords(selectedTableId);
    }, [selectedTableId]);

    useEffect(() => {
        if (!records.length) {
            setSelectedRecordInternalId(null);
            return;
        }

        if (!selectedRecordInternalId || !records.some((r) => r.id === selectedRecordInternalId)) {
            setSelectedRecordInternalId(records[0].id);
        }
    }, [records, selectedRecordInternalId]);

    const selectedTable = useMemo(
        () => tables.find((table) => table.id === selectedTableId) || null,
        [tables, selectedTableId]
    );

    const activeFields = useMemo(
        () => (selectedTable?.fields || []).filter((f) => !f.archived),
        [selectedTable]
    );

    const fieldUsage = (selectedTable?.archivedFieldCount || 0) + (selectedTable?.fields?.length || 0);
    const remainingFieldSlots = Math.max(0, 200 - fieldUsage);

    const filteredAndSortedRecords = useMemo(() => {
        let baseRows = records;

        // 1. Apply Search Keyword (Optional, works on top of Query)
        const keyword = recordSearchTerm.trim().toLowerCase();
        if (keyword) {
            baseRows = baseRows.filter((record) => {
                const searchableParts = [
                    record.recordId,
                    ...activeFields.map((field) => record[field.name])
                ];
                return searchableParts.some((part) => String(part ?? '').toLowerCase().includes(keyword));
            });
        }

        // 2. Apply Active Query Filters
        const activeQuery = (selectedTable?.queries || []).find(q => q.id === activeQueryId);
        if (activeQuery && activeQuery.filters && activeQuery.filters.length > 0) {
            const matchAll = activeQuery.matchType === 'all';
            baseRows = baseRows.filter(record => {
                const results = activeQuery.filters.map(filter => {
                    const fieldVal = record[filter.field];
                    const targetVal = filter.value;

                    switch (filter.operator) {
                        case 'equals': return String(fieldVal || '').toLowerCase() === String(targetVal || '').toLowerCase();
                        case 'does_not_equal': return String(fieldVal || '').toLowerCase() !== String(targetVal || '').toLowerCase();
                        case 'contains': return String(fieldVal || '').toLowerCase().includes(String(targetVal || '').toLowerCase());
                        case 'does_not_contain': return !String(fieldVal || '').toLowerCase().includes(String(targetVal || '').toLowerCase());
                        case 'starts_with': return String(fieldVal || '').toLowerCase().startsWith(String(targetVal || '').toLowerCase());
                        case 'ends_with': return String(fieldVal || '').toLowerCase().endsWith(String(targetVal || '').toLowerCase());
                        case 'is_null': return fieldVal == null || fieldVal === '';
                        case 'is_not_null': return fieldVal != null && fieldVal !== '';
                        case 'greater_than_or_equal': return Number(fieldVal) >= Number(targetVal);
                        case 'less_than_or_equal': return Number(fieldVal) <= Number(targetVal);
                        case 'is_in': return (targetVal || '').split(',').map(v => v.trim().toLowerCase()).includes(String(fieldVal || '').toLowerCase());
                        case 'is_after': return fieldVal && targetVal && new Date(fieldVal) > new Date(targetVal);
                        case 'is_before': return fieldVal && targetVal && new Date(fieldVal) < new Date(targetVal);
                        default: return true;
                    }
                });
                return matchAll ? results.every(r => r) : results.some(r => r);
            });
        }

        // 3. Sorting
        const sortRules = activeQuery?.sort?.length > 0 ? activeQuery.sort : [{ field: recordSortField, direction: recordSortDirection }];

        const compare = (a, b, field, direction) => {
            const getVal = (r) => field === 'recordId' ? r.recordId : r[field];
            const aVal = getVal(a);
            const bVal = getVal(b);

            const aNum = Number(aVal);
            const bNum = Number(bVal);
            const bothNumeric = Number.isFinite(aNum) && Number.isFinite(bNum) && aVal !== '' && bVal !== '';

            let res = 0;
            if (bothNumeric) res = aNum - bNum;
            else res = String(aVal || '').localeCompare(String(bVal || ''));

            return direction === 'asc' ? res : -res;
        };

        let sortedRows = [...baseRows].sort((a, b) => {
            for (const rule of sortRules) {
                const res = compare(a, b, rule.field, rule.direction);
                if (res !== 0) return res;
            }
            return 0;
        });

        // 4. Limit
        if (activeQuery?.limit) {
            sortedRows = sortedRows.slice(0, activeQuery.limit);
        }

        return sortedRows;
    }, [records, recordSearchTerm, activeFields, activeQueryId, selectedTable?.queries, recordSortField, recordSortDirection]);

    const selectedRecord = useMemo(
        () => filteredAndSortedRecords.find((row) => row.id === selectedRecordInternalId)
            || records.find((row) => row.id === selectedRecordInternalId)
            || null,
        [filteredAndSortedRecords, records, selectedRecordInternalId]
    );

    const relationDiagramData = useMemo(() => {
        if (!selectedTable) return { nodes: [], edges: [] };

        const linkedFields = (selectedTable.fields || []).filter((f) => f.type === 'linked_record');
        if (linkedFields.length === 0) return { nodes: [], edges: [] };

        const nodeMap = new Map();
        const edges = [];

        const putNode = (id, label, group, tableName) => {
            if (!nodeMap.has(id)) nodeMap.set(id, { id, label, group, tableName });
        };

        records.forEach((record) => {
            const sourceId = `${selectedTable.id}:${record.recordId}`;
            putNode(sourceId, record.recordId, 'source', selectedTable.name);

            linkedFields.forEach((field) => {
                const raw = record[field.name];
                const linkedIds = Array.isArray(raw) ? raw : (raw ? [raw] : []);
                const targetTable = tables.find((t) => t.id === field.link_table_id);

                linkedIds.forEach((linkedRecordId) => {
                    const targetId = `${field.link_table_id}:${linkedRecordId}`;
                    putNode(targetId, linkedRecordId, 'target', targetTable?.name || 'Linked Table');
                    edges.push({
                        id: `${sourceId}->${targetId}:${field.name}`,
                        from: sourceId,
                        to: targetId,
                        fieldName: field.name,
                        linkType: field.link_type || 'linked_record'
                    });
                });
            });
        });

        return { nodes: Array.from(nodeMap.values()), edges };
    }, [selectedTable, records, tables]);

    const updateRecordSort = (fieldName) => {
        if (recordSortField === fieldName) {
            setRecordSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
            return;
        }
        setRecordSortField(fieldName);
        setRecordSortDirection('asc');
    };

    const loadTables = async () => {
        setLoading(true);
        setFetchError(null);
        try {
            const data = await getTables();
            setTables(data);
            if (data.length > 0) {
                setSelectedTableId((prev) => (prev && data.some(t => t.id === prev)) ? prev : data[0].id);
            } else {
                setSelectedTableId(null);
            }
        } catch (error) {
            console.error('[TableManager] Failed to load tables:', error);

            // Helpful message for missing tables (PostgREST 404 / code 42P01)
            const isMissingTable =
                error?.message?.includes('404') ||
                error?.code === '42P01' ||
                error?.message?.includes('Could not find the table');

            setFetchError(
                isMissingTable
                    ? 'Table "app_tables" not found. Please run the SQL migration.'
                    : (error.message || 'Failed to connect to Supabase')
            );
        } finally {
            setLoading(false);
        }
    };

    const loadRecords = async (tableId) => {
        if (!tableId) return;
        setRecordsLoading(true);
        try {
            const data = await getTableRecords(tableId);
            setRecords(data);
        } catch (error) {
            console.error('Failed to load records:', error);
        } finally {
            setRecordsLoading(false);
        }
    };

    const handleCreateTable = async () => {
        const name = newTableName.trim();
        console.log('[TableManager] handleCreateTable attempt:', { name, description: newTableDescription });

        if (!name) {
            alert('Table name is required.');
            return;
        }

        setCreatingTable(true);
        try {
            console.log('[TableManager] Calling createTable API...');
            await createTable({
                name,
                description: newTableDescription.trim(),
                fields: []
            });
            console.log('[TableManager] createTable API success');
            setNewTableName('');
            setNewTableDescription('');
            setIsCreateModalOpen(false); // Close modal on success
            await loadTables();
        } catch (error) {
            console.error('[TableManager] handleCreateTable failed:', error);
            alert(error.message || 'Failed to create table');
        } finally {
            setCreatingTable(false);
        }
    };

    const handleDeleteTable = async (tableId) => {
        if (!confirm('Delete this table and all records?')) return;
        try {
            await deleteTable(tableId);
            await loadTables();
            if (selectedTableId === tableId) setSelectedTableId(null);
        } catch (error) {
            alert(error.message || 'Failed to delete table');
        }
    };

    const handleUpdateTableMetadata = async () => {
        if (!selectedTableId) return;
        try {
            setCreatingTable(true);
            await updateTable(selectedTableId, {
                name: editTableName,
                description: editTableDescription
            });
            await loadTables();
            setIsEditTableModalOpen(false);
        } catch (error) {
            alert(error.message || 'Failed to update table');
        } finally {
            setCreatingTable(false);
        }
    };

    const handleRenameField = async (oldName, newName) => {
        if (!selectedTableId || !newName || oldName === newName) {
            setIsRenameFieldModalOpen(false);
            return;
        }

        try {
            setLoading(true);
            const { fields } = selectedTable;
            const updatedFields = fields.map(f => {
                if (f.name === oldName) return { ...f, name: newName.trim() };
                return f;
            });

            await updateTable(selectedTableId, { fields: updatedFields });
            await loadTables();
            setIsRenameFieldModalOpen(false);
        } catch (error) {
            alert(error.message || 'Failed to rename field');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteField = async (fieldName) => {
        if (!confirm(`Permanently delete field "${fieldName}"? This will hide data for this field in all records.`)) return;
        try {
            setLoading(true);
            const { fields } = selectedTable;
            const updatedFields = fields.filter(f => f.name !== fieldName);
            await updateTable(selectedTableId, { fields: updatedFields });
            await loadTables();
        } catch (error) {
            alert(error.message || 'Failed to delete field');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateFieldType = async (fieldName, type) => {
        if (!selectedTableId || !type) return;
        try {
            setLoading(true);
            const { fields } = selectedTable;
            const updatedFields = fields.map(f => {
                if (f.name === fieldName) return { ...f, type };
                return f;
            });
            await updateTable(selectedTableId, { fields: updatedFields });
            await loadTables();
            setIsTypeModalOpen(false);
        } catch (error) {
            alert(error.message || 'Failed to update field type');
        } finally {
            setLoading(false);
        }
    };

    const handleAddField = async () => {
        if (!selectedTable) return;
        const fieldName = newFieldName.trim();
        if (!fieldName) return;
        if (remainingFieldSlots <= 0) {
            alert('Field limit reached (200 including archived fields).');
            return;
        }

        if (fieldName.toLowerCase() === 'id') {
            alert('The name "ID" is reserved for the system primary key.');
            return;
        }

        const exists = (selectedTable.fields || []).some((f) => f.name.toLowerCase() === fieldName.toLowerCase());
        if (exists) {
            alert('Field name already exists in this table.');
            return;
        }

        try {
            const nextFields = [...(selectedTable.fields || []), {
                name: fieldName,
                type: newFieldType,
                archived: false,
                link_table_id: newFieldType === 'linked_record' ? targetTableId : undefined,
                link_type: newFieldType === 'linked_record' ? newFieldLinkType : undefined,
                reverse_link_name: newFieldType === 'linked_record' ? newFieldReverseName : undefined
            }];
            await updateTable(selectedTable.id, {
                fields: nextFields,
                archivedFieldCount: selectedTable.archivedFieldCount || 0
            });
            setNewFieldName('');
            setNewFieldType('text');
            setTargetTableId('');
            setNewFieldReverseName('');
            setNewFieldLinkType('one_to_one');
            await loadTables();
        } catch (error) {
            alert(error.message || 'Failed to add field');
        }
    };

    const handleArchiveField = async (fieldName) => {
        if (!selectedTable) return;
        if (!confirm(`Archive field "${fieldName}"?`)) return;
        try {
            const nextFields = (selectedTable.fields || []).filter((f) => f.name !== fieldName);
            await updateTable(selectedTable.id, {
                fields: nextFields,
                archivedFieldCount: (selectedTable.archivedFieldCount || 0) + 1
            });
            await loadTables();
        } catch (error) {
            alert(error.message || 'Failed to archive field');
        }
    };

    const castValueByType = (type, value) => {
        if (value === '') return '';
        switch (type) {
            case 'number':
            case 'integer':
            case 'interval':
                return Number.isNaN(Number(value)) ? '' : Number(value);
            case 'boolean': {
                if (typeof value === 'boolean') return value;
                const normalized = String(value).trim().toLowerCase();
                if (['true', '1', 'yes', 'y'].includes(normalized)) return true;
                if (['false', '0', 'no', 'n'].includes(normalized)) return false;
                return false;
            }
            default:
                return value;
        }
    };

    const parseCsvText = (text) => {
        const rows = [];
        let currentCell = '';
        let currentRow = [];
        let insideQuotes = false;

        for (let i = 0; i < text.length; i += 1) {
            const char = text[i];
            const next = text[i + 1];

            if (char === '"') {
                if (insideQuotes && next === '"') {
                    currentCell += '"';
                    i += 1;
                } else {
                    insideQuotes = !insideQuotes;
                }
            } else if (char === ',' && !insideQuotes) {
                currentRow.push(currentCell);
                currentCell = '';
            } else if ((char === '\n' || char === '\r') && !insideQuotes) {
                if (char === '\r' && next === '\n') i += 1;
                currentRow.push(currentCell);
                rows.push(currentRow);
                currentCell = '';
                currentRow = [];
            } else {
                currentCell += char;
            }
        }

        currentRow.push(currentCell);
        rows.push(currentRow);

        return rows.map((row) => row.map((cell) => String(cell ?? '').trim()));
    };

    const handleImportButtonClick = () => {
        if (!selectedTable) return;
        csvInputRef.current?.click();
    };

    const handleCsvFileImport = async (event) => {
        const file = event.target.files?.[0];
        if (!selectedTable || !file) return;

        try {
            setCsvImporting(true);
            const csvText = await file.text();
            const rawRows = parseCsvText(csvText).filter((row) => row.some((cell) => cell !== ''));

            if (rawRows.length < 2) {
                alert('CSV must contain a header row and at least one data row.');
                return;
            }

            const headers = rawRows[0].map((header) => header.toLowerCase());
            const recordIdIndex = headers.findIndex((header) => ['recordid', 'record id', 'id'].includes(header));

            if (recordIdIndex === -1) {
                alert('CSV header must include one of: recordId, Record ID, or id.');
                return;
            }

            const fieldColumnIndex = (activeFields || []).reduce((acc, field) => {
                acc[field.name] = headers.findIndex((header) => header === field.name.toLowerCase());
                return acc;
            }, {});

            let importedCount = 0;
            const errors = [];

            for (let rowIndex = 1; rowIndex < rawRows.length; rowIndex += 1) {
                const row = rawRows[rowIndex];
                if (!row || row.every((cell) => String(cell ?? '').trim() === '')) continue;

                const recordId = String(row[recordIdIndex] ?? '').trim();
                if (!recordId) {
                    errors.push(`Row ${rowIndex + 1}: missing Record ID`);
                    continue;
                }

                const payload = (activeFields || []).reduce((acc, field) => {
                    const index = fieldColumnIndex[field.name];
                    if (index < 0) return acc;
                    const rawValue = String(row[index] ?? '').trim();
                    acc[field.name] = castValueByType(field.type, rawValue);
                    return acc;
                }, {});

                try {
                    await addTableRecord(selectedTable.id, {
                        recordId,
                        ...payload
                    });
                    importedCount += 1;
                } catch (error) {
                    errors.push(`Row ${rowIndex + 1}: ${error.message || 'Failed to import row'}`);
                }
            }

            await loadRecords(selectedTable.id);
            await loadTables();

            const errorPreview = errors.slice(0, 5).join('\n');
            const moreErrorText = errors.length > 5 ? `\n...and ${errors.length - 5} more error(s)` : '';
            alert(`CSV import complete.\nImported: ${importedCount}\nFailed: ${errors.length}${errors.length ? `\n\nErrors:\n${errorPreview}${moreErrorText}` : ''}`);
        } catch (error) {
            alert(error.message || 'Failed to import CSV');
        } finally {
            setCsvImporting(false);
            event.target.value = '';
        }
    };

    const handleAddRecord = async () => {
        if (!selectedTable) return;
        const recordId = newRecordId.trim();
        if (!recordId) {
            alert('Record ID is required.');
            return;
        }

        try {
            const payload = activeFields.reduce((acc, field) => {
                const rawValue = newRecordValues[field.name] ?? (field.type === 'linked_record' ? [] : '');
                acc[field.name] = castValueByType(field.type, rawValue);
                return acc;
            }, {});

            if (isEditingRecord) {
                // Update existing record
                const oldValues = selectedRecord;
                await updateTableRecord(selectedRecord.id, payload);

                // Sync links (Diff links)
                for (const field of activeFields) {
                    if (field.type === 'linked_record') {
                        const oldLinks = Array.isArray(oldValues[field.name]) ? oldValues[field.name] : (oldValues[field.name] ? [oldValues[field.name]] : []);
                        const newLinks = Array.isArray(payload[field.name]) ? payload[field.name] : (payload[field.name] ? [payload[field.name]] : []);

                        const added = newLinks.filter(id => !oldLinks.includes(id));
                        const removed = oldLinks.filter(id => !newLinks.includes(id));

                        const targetTable = tables.find(t => t.id === field.link_table_id);
                        if (targetTable && field.reverse_link_name) {
                            for (const tid of added) {
                                await linkRecords(selectedTable.id, recordId, field.name, field.link_table_id, tid, field.reverse_link_name);
                            }
                            for (const tid of removed) {
                                await unlinkRecords(selectedTable.id, recordId, field.name, field.link_table_id, tid, field.reverse_link_name);
                            }
                        }
                    }
                }
            } else {
                // Add new record
                await addTableRecord(selectedTable.id, {
                    recordId,
                    ...payload
                });

                // Perform bi-directional link synchronization for new record
                for (const field of activeFields) {
                    if (field.type === 'linked_record' && payload[field.name]) {
                        const linkedIds = Array.isArray(payload[field.name]) ? payload[field.name] : [payload[field.name]];
                        const targetTable = tables.find(t => t.id === field.link_table_id);
                        if (targetTable && field.reverse_link_name) {
                            for (const targetId of linkedIds) {
                                await linkRecords(
                                    selectedTable.id, recordId, field.name,
                                    field.link_table_id, targetId, field.reverse_link_name
                                );
                            }
                        }
                    }
                }
            }

            setNewRecordId('');
            setNewRecordValues({});
            setIsRecordModalOpen(false);
            setIsEditingRecord(false);
            await loadRecords(selectedTable.id);
            await loadTables();
        } catch (error) {
            alert(error.message || 'Failed to save record');
        }
    };

    const handleFileUpload = async (fieldName, file) => {
        if (!file) return;
        if (!isSupabaseReady()) {
            alert('Supabase is not configured. Please check your settings.');
            return;
        }

        setUploadingFields(prev => ({ ...prev, [fieldName]: true }));
        try {
            const tableId = selectedTable?.id || 'unknown';
            const timestamp = Date.now();
            const extension = file.name.split('.').pop();
            const storagePath = `tables/${tableId}/${fieldName}_${timestamp}.${extension}`;

            const publicUrl = await uploadManualImage(storagePath, file);

            setNewRecordValues(prev => ({ ...prev, [fieldName]: publicUrl }));
        } catch (error) {
            console.error('File upload failed:', error);
            alert(`Upload failed: ${error.message}`);
        } finally {
            setUploadingFields(prev => ({ ...prev, [fieldName]: false }));
        }
    };

    const handleDeleteRecord = async (recordInternalId) => {
        if (!confirm('Delete this record?')) return;
        try {
            await deleteTableRecord(recordInternalId);
            await loadRecords(selectedTable.id);
            await loadTables();
        } catch (error) {
            alert(error.message || 'Failed to delete record');
        }
    };

    const filteredTables = tables.filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div style={{
            display: 'flex',
            height: '100vh',
            backgroundColor: TOKENS.bg,
            color: TOKENS.text,
            fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
            overflow: 'hidden'
        }}>
            {/* Sidebar: Navigation & Table List */}
            {isTableSidebarOpen && (
                <div style={{
                    width: '260px',
                    backgroundColor: TOKENS.sidebarBg,
                    display: 'flex',
                    flexDirection: 'column',
                    flexShrink: 0,
                    color: TOKENS.sidebarText,
                    borderRight: `1px solid ${TOKENS.border}`
                }}>
                    {/* Logo */}
                    <div style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ padding: '8px', backgroundColor: TOKENS.primary, borderRadius: '8px' }}>
                            <Layers size={20} color="white" />
                        </div>
                        <span style={{ fontWeight: 800, fontSize: '1.2rem', letterSpacing: '0.5px', color: '#0f172a' }}>MES CORE</span>
                    </div>

                    <div style={{ padding: '0 24px 12px' }}>
                        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: TOKENS.sidebarTextMuted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Menu</span>
                    </div>
                    <div style={{ padding: '0 16px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '10px', color: TOKENS.sidebarText, fontWeight: 500 }}>
                            <LayoutGrid size={16} color={TOKENS.sidebarTextMuted} />
                            <span>Dashboard</span>
                        </div>
                    </div>

                    <div style={{ padding: '0 24px 12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: TOKENS.sidebarTextMuted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Tables</span>
                    </div>

                    {/* Search */}
                    <div style={{ padding: '0 16px 16px' }}>
                        <div style={{ position: 'relative' }}>
                            <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: TOKENS.sidebarTextMuted }} />
                            <input
                                type="text"
                                placeholder="Find a table..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '10px 12px 10px 36px',
                                    backgroundColor: '#f8fafc',
                                    border: `1px solid ${TOKENS.border}`,
                                    borderRadius: '8px',
                                    color: TOKENS.text,
                                    fontSize: '0.85rem',
                                    outline: 'none'
                                }}
                            />
                            <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.7rem', color: TOKENS.sidebarTextMuted, border: `1px solid ${TOKENS.border}`, padding: '2px 4px', borderRadius: '4px' }}>⌘ K</span>
                        </div>
                    </div>

                    {/* New Table Button */}
                    <div style={{ padding: '0 16px 20px' }}>
                        <button
                            onClick={() => {
                                setNewTableName('');
                                setNewTableDescription('');
                                setIsCreateModalOpen(true);
                            }}
                            style={{
                                width: '100%',
                                padding: '12px',
                                backgroundColor: TOKENS.primary,
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                fontWeight: 700,
                                fontSize: '0.85rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                            }}
                        >
                            <Plus size={18} /> Create
                        </button>
                    </div>

                    {/* Table List */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px' }}>
                        {filteredTables.map(table => (
                            <div
                                key={table.id}
                                onClick={() => setSelectedTableId(table.id)}
                                style={{
                                    padding: '10px 16px',
                                    borderRadius: '8px',
                                    backgroundColor: selectedTableId === table.id ? TOKENS.sidebarActive : 'transparent',
                                    color: selectedTableId === table.id ? TOKENS.primary : TOKENS.sidebarText,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    marginBottom: '2px',
                                    transition: 'all 0.2s',
                                    fontWeight: selectedTableId === table.id ? 700 : 500,
                                    fontSize: '0.9rem'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, overflow: 'hidden' }}>
                                    <Database size={16} color={selectedTableId === table.id ? TOKENS.primary : TOKENS.sidebarTextMuted} />
                                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{table.name}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    {selectedTableId === table.id && <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: TOKENS.primary }}></div>}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteTable(table.id);
                                        }}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            color: TOKENS.sidebarTextMuted,
                                            cursor: 'pointer',
                                            padding: '4px',
                                            borderRadius: '4px',
                                            opacity: 0,
                                            transition: 'opacity 0.2s'
                                        }}
                                        className="table-delete-action"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                                <style>{`
                                div:hover > div > .table-delete-action { opacity: 1 !important; }
                            `}</style>
                            </div>
                        ))}
                    </div>

                    {/* Database Info Card */}
                    <div style={{ padding: '20px' }}>
                        <div style={{ backgroundColor: '#ffffff', border: `1px solid ${TOKENS.border}`, borderRadius: '16px', padding: '20px' }}>
                            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: TOKENS.text, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Database size={14} color={TOKENS.primary} /> Database Status
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                                    <span style={{ color: TOKENS.sidebarTextMuted }}>Total Tables</span>
                                    <span style={{ fontWeight: 700, color: TOKENS.text }}>{tables.length}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                                    <span style={{ color: TOKENS.sidebarTextMuted }}>Total Records</span>
                                    <span style={{ fontWeight: 700, color: TOKENS.text }}>{tables.reduce((acc, t) => acc + (t.recordCount || 0), 0).toLocaleString()}</span>
                                </div>
                            </div>

                            <div style={{ marginTop: '20px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '8px' }}>
                                    <span style={{ color: TOKENS.sidebarTextMuted }}>Storage Usage</span>
                                    <span style={{ fontWeight: 700, color: TOKENS.text }}>{Math.min(100, (tables.length / 50) * 100).toFixed(1)}%</span>
                                </div>
                                <div style={{ height: '6px', backgroundColor: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                                    <div style={{ width: `${Math.min(100, (tables.length / 50) * 100)}%`, height: '100%', background: `linear-gradient(90deg, ${TOKENS.primary}, ${TOKENS.secondary})` }}></div>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', marginTop: '6px', color: TOKENS.sidebarTextMuted }}>
                                    <span>{tables.length} of 50 tables used</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content Area */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {/* Main Header / Breadcrumbs */}
                <div style={{
                    padding: '0 32px',
                    backgroundColor: 'white',
                    borderBottom: `1px solid ${TOKENS.border}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    height: '72px',
                    flexShrink: 0
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <button
                            onClick={() => setIsTableSidebarOpen(!isTableSidebarOpen)}
                            style={{
                                padding: '8px',
                                borderRadius: '8px',
                                border: `1px solid ${TOKENS.border}`,
                                backgroundColor: 'white',
                                color: TOKENS.textMuted,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            <Menu size={20} />
                        </button>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ color: TOKENS.textMuted, fontSize: '0.9rem' }}>Tables</span>
                            <ChevronRight size={14} color={TOKENS.border} />
                            <span style={{ color: TOKENS.text, fontWeight: 700, fontSize: '1.1rem' }}>{selectedTable?.name || '...'}</span>
                        </div>
                    </div>
                    {selectedTable && (
                        <button
                            onClick={() => {
                                setEditTableName(selectedTable.name);
                                setEditTableDescription(selectedTable.description || '');
                                setIsEditTableModalOpen(true);
                            }}
                            style={{
                                background: 'none',
                                border: 'none',
                                padding: '4px',
                                cursor: 'pointer',
                                color: TOKENS.textMuted,
                                display: 'flex',
                                alignItems: 'center'
                            }}
                        >
                            <Settings size={14} />
                        </button>
                    )}


                    <div style={{
                        display: 'flex',
                        backgroundColor: TOKENS.bg,
                        padding: '4px',
                        borderRadius: TOKENS.radiusSm,
                        border: `1px solid ${TOKENS.border}`
                    }}>
                        {[
                            { id: 'records', label: 'Records', icon: Rows3 },
                            { id: 'fields', label: 'Fields', icon: Columns3 },
                            { id: 'queries', label: 'Queries', icon: Search },
                            { id: 'aggregations', label: 'Aggregations', icon: ArrowUpDown },
                            { id: 'relation_diagram', label: 'Relation Diagram', icon: Zap }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActivePanel(tab.id)}
                                style={{
                                    padding: '8px 16px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    backgroundColor: activePanel === tab.id ? 'white' : 'transparent',
                                    color: activePanel === tab.id ? TOKENS.primary : TOKENS.textMuted,
                                    fontWeight: 700,
                                    fontSize: '0.85rem',
                                    cursor: 'pointer',
                                    boxShadow: activePanel === tab.id ? TOKENS.shadow : 'none',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <tab.icon size={16} /> {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    {!selectedTable ? (
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: TOKENS.textMuted, padding: '40px' }}>
                            <div style={{
                                width: '80px',
                                height: '80px',
                                borderRadius: '20px',
                                backgroundColor: TOKENS.bg,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: '24px',
                                color: TOKENS.primary,
                                opacity: 0.5
                            }}>
                                <Database size={40} />
                            </div>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: TOKENS.text, margin: '0 0 12px 0' }}>No Table Selected</h3>
                            <p style={{ fontSize: '0.9rem', margin: 0, maxWidth: '300px', textAlign: 'center', lineHeight: '1.5' }}>
                                Select a table from the sidebar to view its records and manage fields.
                            </p>
                        </div>
                    ) : (
                        <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', padding: '24px 32px' }}>
                            {activePanel === 'records' ? (
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '32px', overflow: 'hidden' }}>
                                    {/* Toolbar */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <button
                                                onClick={() => setIsFieldsSidebarOpen(!isFieldsSidebarOpen)}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px',
                                                    padding: '10px 16px',
                                                    borderRadius: '10px',
                                                    border: `1px solid ${isFieldsSidebarOpen ? TOKENS.primary : TOKENS.border}`,
                                                    backgroundColor: isFieldsSidebarOpen ? TOKENS.primaryLight : 'white',
                                                    fontWeight: 600,
                                                    fontSize: '0.85rem',
                                                    color: isFieldsSidebarOpen ? TOKENS.primary : TOKENS.text,
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                <Layers size={16} /> Fields
                                            </button>
                                            <div style={{ position: 'relative' }}>
                                                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: TOKENS.textMuted }} />
                                                <input
                                                    type="text"
                                                    value={recordSearchTerm}
                                                    onChange={(e) => setRecordSearchTerm(e.target.value)}
                                                    placeholder="Search records..."
                                                    style={{
                                                        padding: '10px 16px 10px 40px',
                                                        borderRadius: '10px',
                                                        border: `1px solid ${TOKENS.border}`,
                                                        backgroundColor: 'white',
                                                        fontSize: '0.9rem',
                                                        width: '300px',
                                                        outline: 'none'
                                                    }}
                                                />
                                            </div>
                                            <div style={{ position: 'relative' }}>
                                                <select
                                                    value={activeQueryId || ''}
                                                    onChange={(e) => setActiveQueryId(e.target.value || null)}
                                                    style={{
                                                        padding: '10px 36px 10px 16px',
                                                        borderRadius: '10px',
                                                        border: `1px solid ${TOKENS.border}`,
                                                        backgroundColor: 'white',
                                                        fontSize: '0.9rem',
                                                        appearance: 'none',
                                                        cursor: 'pointer',
                                                        fontWeight: 600,
                                                        color: TOKENS.text
                                                    }}
                                                >
                                                    <option value="">All Records</option>
                                                    {(selectedTable?.queries || []).map(q => (
                                                        <option key={q.id} value={q.id}>{q.name}</option>
                                                    ))}
                                                </select>
                                                <ChevronDown size={14} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: TOKENS.textMuted }} />
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <button
                                                onClick={handleImportButtonClick}
                                                disabled={csvImporting}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px',
                                                    padding: '10px 16px',
                                                    borderRadius: '10px',
                                                    border: `1px solid ${TOKENS.border}`,
                                                    backgroundColor: 'white',
                                                    fontWeight: 600,
                                                    fontSize: '0.85rem',
                                                    color: TOKENS.text,
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                <Upload size={16} /> Import
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setNewRecordId('');
                                                    setNewRecordValues({});
                                                    setIsEditingRecord(false);
                                                    setIsRecordModalOpen(true);
                                                }}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px',
                                                    padding: '10px 20px',
                                                    borderRadius: '10px',
                                                    backgroundColor: TOKENS.primary,
                                                    color: 'white',
                                                    border: 'none',
                                                    fontWeight: 700,
                                                    fontSize: '0.85rem',
                                                    cursor: 'pointer',
                                                    boxShadow: '0 4px 6px -1px rgba(99, 102, 241, 0.4)'
                                                }}
                                            >
                                                <Plus size={18} /> Create
                                            </button>
                                        </div>
                                    </div>

                                    {/* Table View with Sidebar */}
                                    <div style={{ flex: 1, display: 'flex', gap: '24px', overflow: 'hidden' }}>
                                        {/* Left Fields Sidebar */}
                                        {isFieldsSidebarOpen && (
                                            <div style={{
                                                width: '260px',
                                                backgroundColor: 'white',
                                                borderRadius: '16px',
                                                border: `1px solid ${TOKENS.border}`,
                                                display: 'flex',
                                                flexDirection: 'column',
                                                overflow: 'hidden',
                                                boxShadow: TOKENS.shadow
                                            }}>
                                                <div style={{ padding: '20px', borderBottom: `1px solid ${TOKENS.borderLight}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span style={{ fontWeight: 800, fontSize: '0.9rem', color: TOKENS.text }}>All Fields</span>
                                                    <div style={{ display: 'flex', gap: '8px' }}>
                                                        <button
                                                            onClick={() => setHiddenFields([])}
                                                            style={{ fontSize: '0.7rem', fontWeight: 700, color: TOKENS.primary, background: 'none', border: 'none', cursor: 'pointer' }}
                                                        >Show All</button>
                                                        <button
                                                            onClick={() => setHiddenFields(activeFields.map(f => f.name))}
                                                            style={{ fontSize: '0.7rem', fontWeight: 700, color: TOKENS.textMuted, background: 'none', border: 'none', cursor: 'pointer' }}
                                                        >Hide All</button>
                                                    </div>
                                                </div>
                                                <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                        {/* Primary Key ID is always visible */}
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', borderRadius: '8px', opacity: 0.6 }}>
                                                            <CheckSquare size={16} color={TOKENS.primary} />
                                                            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>ID (Primary Key)</span>
                                                        </div>
                                                        {activeFields.map(field => {
                                                            const isHidden = hiddenFields.includes(field.name);
                                                            return (
                                                                <div
                                                                    key={field.name}
                                                                    onClick={() => {
                                                                        if (isHidden) setHiddenFields(hiddenFields.filter(f => f !== field.name));
                                                                        else setHiddenFields([...hiddenFields, field.name]);
                                                                    }}
                                                                    style={{
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        gap: '10px',
                                                                        padding: '8px 12px',
                                                                        borderRadius: '8px',
                                                                        cursor: 'pointer',
                                                                        backgroundColor: isHidden ? 'transparent' : TOKENS.bg,
                                                                        transition: 'all 0.2s'
                                                                    }}
                                                                    onMouseEnter={e => e.currentTarget.style.backgroundColor = isHidden ? TOKENS.bg : '#eef2ff'}
                                                                    onMouseLeave={e => e.currentTarget.style.backgroundColor = isHidden ? 'transparent' : TOKENS.bg}
                                                                >
                                                                    <div style={{
                                                                        width: '18px',
                                                                        height: '18px',
                                                                        borderRadius: '4px',
                                                                        border: `2px solid ${isHidden ? TOKENS.border : TOKENS.primary}`,
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center',
                                                                        backgroundColor: isHidden ? 'white' : TOKENS.primary
                                                                    }}>
                                                                        {!isHidden && <X size={12} color="white" />}
                                                                    </div>
                                                                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: isHidden ? TOKENS.textMuted : TOKENS.text }}>{field.name}</span>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        <div style={{ flex: 1, backgroundColor: 'white', borderRadius: '16px', border: `1px solid ${TOKENS.border}`, overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: TOKENS.shadow }}>
                                            <div style={{ flex: 1, overflow: 'auto' }}>
                                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                                    <thead style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: '#fafafa' }}>
                                                        <tr style={{ borderBottom: `1px solid ${TOKENS.border}` }}>
                                                            <th style={{ padding: '16px', width: '50px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: TOKENS.textMuted, textTransform: 'uppercase' }}>#</th>
                                                            <th style={{ padding: '16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: TOKENS.textMuted, textTransform: 'uppercase' }}>Record ID</th>
                                                            {activeFields.filter(f => !hiddenFields.includes(f.name)).map(field => (
                                                                <th key={field.name} style={{ padding: '16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: TOKENS.textMuted, textTransform: 'uppercase' }}>
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                        {field.name} <ArrowUpDown size={12} />
                                                                    </div>
                                                                </th>
                                                            ))}
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {filteredAndSortedRecords.map((record, idx) => (
                                                            <tr
                                                                key={record.id}
                                                                onClick={() => setSelectedRecordInternalId(record.id)}
                                                                style={{
                                                                    borderBottom: `1px solid ${TOKENS.borderLight}`,
                                                                    backgroundColor: selectedRecordInternalId === record.id ? '#f5f7ff' : 'transparent',
                                                                    cursor: 'pointer',
                                                                    transition: 'all 0.2s'
                                                                }}
                                                            >
                                                                <td style={{ padding: '16px', color: TOKENS.textMuted, fontSize: '0.85rem' }}>{idx + 1}</td>
                                                                <td style={{ padding: '16px', fontWeight: 700, color: TOKENS.text, fontSize: '0.9rem' }}>{record.recordId}</td>
                                                                {activeFields.filter(f => !hiddenFields.includes(f.name)).map(field => (
                                                                    <td key={field.name} style={{ padding: '16px', fontSize: '0.85rem', color: TOKENS.text }}>
                                                                        {field.type === 'linked_record' ? (
                                                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                                                                {(() => {
                                                                                    const val = record[field.name];
                                                                                    const ids = Array.isArray(val) ? val : (val ? [val] : []);
                                                                                    if (ids.length === 0) return <span style={{ color: TOKENS.textMuted }}>-</span>;
                                                                                    return ids.map(id => (
                                                                                        <span key={id} style={{ padding: '2px 8px', backgroundColor: '#f1f5f9', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700, color: TOKENS.primary, border: '1px solid #e2e8f0' }}>
                                                                                            {id}
                                                                                        </span>
                                                                                    ));
                                                                                })()}
                                                                            </div>
                                                                        ) : field.type === 'image' ? (
                                                                            record[field.name] ? <img src={record[field.name]} alt="" style={{ width: '32px', height: '32px', borderRadius: '6px', objectFit: 'cover' }} /> : '-'
                                                                        ) : field.type === 'boolean' ? (
                                                                            <span style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700, backgroundColor: record[field.name] ? '#ecfdf5' : '#fff1f2', color: record[field.name] ? '#10b981' : '#f43f5e' }}>
                                                                                {record[field.name] ? 'TRUE' : 'FALSE'}
                                                                            </span>
                                                                        ) : String(record[field.name] ?? '-')}
                                                                    </td>
                                                                ))}
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>

                                            {/* Pagination */}
                                            <div style={{ padding: '16px 32px', borderTop: `1px solid ${TOKENS.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fafafa' }}>
                                                <div style={{ fontSize: '0.85rem', color: TOKENS.textMuted }}>
                                                    {filteredAndSortedRecords.length} records found
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <button style={{ padding: '6px', borderRadius: '6px', border: `1px solid ${TOKENS.border}`, backgroundColor: 'white', color: TOKENS.textMuted }}><ChevronLeft size={16} /></button>
                                                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: TOKENS.text }}>Page 1 of 1</span>
                                                    <button style={{ padding: '6px', borderRadius: '6px', border: `1px solid ${TOKENS.border}`, backgroundColor: 'white', color: TOKENS.textMuted }}><ChevronRight size={16} /></button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Details Sidebar */}
                                        <div style={{ width: '400px', backgroundColor: 'white', borderRadius: '16px', border: `1px solid ${TOKENS.border}`, display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: TOKENS.shadow }}>
                                            {selectedRecord ? (
                                                <>
                                                    <div style={{ padding: '24px', borderBottom: `1px solid ${TOKENS.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fafafa' }}>
                                                        <div>
                                                            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: TOKENS.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Record Detail</div>
                                                            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: TOKENS.text }}>{selectedRecord.recordId}</div>
                                                        </div>
                                                        <div style={{ display: 'flex', gap: '8px' }}>
                                                            <button
                                                                onClick={() => {
                                                                    setNewRecordId(selectedRecord.recordId);
                                                                    setNewRecordValues(selectedRecord);
                                                                    setIsEditingRecord(true);
                                                                    setIsRecordModalOpen(true);
                                                                }}
                                                                style={{ padding: '8px', borderRadius: '8px', border: `1px solid ${TOKENS.border}`, backgroundColor: 'white', color: TOKENS.primary, cursor: 'pointer' }}
                                                            >
                                                                <Edit3 size={18} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteRecord(selectedRecord.id)}
                                                                style={{ padding: '8px', borderRadius: '8px', border: `1px solid ${TOKENS.border}`, backgroundColor: 'white', color: '#f43f5e', cursor: 'pointer' }}
                                                            >
                                                                <Trash2 size={18} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                                            {activeFields.map(field => (
                                                                <div key={field.name}>
                                                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: TOKENS.textMuted, textTransform: 'uppercase', marginBottom: '8px' }}>{field.name}</label>
                                                                    <div style={{ padding: '12px', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                                                                        {field.type === 'linked_record' ? (
                                                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                                                                {(() => {
                                                                                    const val = selectedRecord[field.name];
                                                                                    const ids = Array.isArray(val) ? val : (val ? [val] : []);
                                                                                    if (ids.length === 0) return <span style={{ color: TOKENS.textMuted }}>-</span>;
                                                                                    return ids.map(id => (
                                                                                        <div key={id} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 12px', backgroundColor: 'white', borderRadius: '6px', color: TOKENS.primary, fontWeight: 700, border: '1px solid #e2e8f0', fontSize: '0.8rem' }}>
                                                                                            <Database size={12} /> {id}
                                                                                        </div>
                                                                                    ));
                                                                                })()}
                                                                            </div>
                                                                        ) : field.type === 'image' ? (
                                                                            selectedRecord[field.name] ? <img src={selectedRecord[field.name]} alt="" style={{ width: '100%', borderRadius: '10px' }} /> : '-'
                                                                        ) : (
                                                                            <div style={{ fontSize: '0.95rem', color: TOKENS.text, fontWeight: 500 }}>{String(selectedRecord[field.name] ?? '-')}</div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </>
                                            ) : (
                                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: TOKENS.textMuted, padding: '40px', textAlign: 'center' }}>
                                                    <Info size={48} style={{ opacity: 0.1, marginBottom: '20px' }} />
                                                    <div style={{ fontWeight: 700, fontSize: '1rem', color: TOKENS.text, marginBottom: '8px' }}>No Record Selected</div>
                                                    <p style={{ fontSize: '0.85rem' }}>Select a row from the table to view full details and manage this record.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ) : activePanel === 'fields' ? (
                                <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', padding: '32px', overflowY: 'auto', overflowX: 'hidden' }}>
                                    {/* Content Header */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
                                        <div>
                                            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0, color: TOKENS.text, letterSpacing: '-0.02em' }}>Store Schema</h2>
                                            <p style={{ fontSize: '1rem', color: TOKENS.textMuted, margin: '8px 0 0' }}>Configure columns and data types for this table.</p>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <button
                                                onClick={() => setIsFieldsSidebarOpen(!isFieldsSidebarOpen)}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px',
                                                    padding: '10px 16px',
                                                    borderRadius: '10px',
                                                    border: `1px solid ${isFieldsSidebarOpen ? TOKENS.primary : TOKENS.border}`,
                                                    backgroundColor: isFieldsSidebarOpen ? TOKENS.primaryLight : 'white',
                                                    fontWeight: 600,
                                                    fontSize: '0.85rem',
                                                    color: isFieldsSidebarOpen ? TOKENS.primary : TOKENS.text,
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                <Layers size={16} /> Fields
                                            </button>
                                            <div style={{ position: 'relative' }}>
                                                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: TOKENS.textMuted }} />
                                                <input
                                                    type="text"
                                                    placeholder="Search fields..."
                                                    style={{
                                                        padding: '10px 16px 10px 40px',
                                                        borderRadius: '10px',
                                                        border: `1px solid ${TOKENS.border}`,
                                                        backgroundColor: 'white',
                                                        fontSize: '0.9rem',
                                                        width: '240px',
                                                        outline: 'none'
                                                    }}
                                                />
                                            </div>
                                            <button style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '10px', border: `1px solid ${TOKENS.border}`, backgroundColor: 'white', fontWeight: 600, fontSize: '0.85rem', color: TOKENS.text }}>
                                                <Filter size={16} /> Filter
                                            </button>
                                            <button style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '10px', border: `1px solid ${TOKENS.border}`, backgroundColor: 'white', fontWeight: 600, fontSize: '0.85rem', color: TOKENS.text }}>
                                                <Group size={16} /> Group
                                            </button>
                                            <button style={{ padding: '10px', borderRadius: '10px', border: `1px solid ${TOKENS.border}`, backgroundColor: 'white', color: TOKENS.text }}>
                                                <MoreHorizontal size={16} />
                                            </button>
                                            <button
                                                onClick={() => setIsFieldModalOpen(true)}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px',
                                                    padding: '10px 20px',
                                                    borderRadius: '10px',
                                                    backgroundColor: TOKENS.primary,
                                                    color: 'white',
                                                    border: 'none',
                                                    fontWeight: 700,
                                                    fontSize: '0.85rem',
                                                    cursor: 'pointer',
                                                    boxShadow: '0 4px 6px -1px rgba(99, 102, 241, 0.4)'
                                                }}
                                            >
                                                <Plus size={18} /> Add Column
                                            </button>
                                        </div>
                                    </div>

                                    {/* Summary Cards */}
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '32px' }}>
                                        {[
                                            { label: 'Total Fields', value: activeFields.length + 1, icon: Layers, color: '#6366f1' },
                                            { label: 'Visible Fields', value: activeFields.length + 1, icon: Eye, color: '#10b981' },
                                            { label: 'Primary Key', value: 1, icon: Key, color: '#f59e0b' },
                                            { label: 'Indexes', value: 3, icon: Database, color: '#8b5cf6' }
                                        ].map((card, i) => (
                                            <div key={i} style={{ backgroundColor: 'white', borderRadius: '16px', padding: '20px', border: `1px solid ${TOKENS.border}`, display: 'flex', alignItems: 'center', gap: '16px' }}>
                                                <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: `${card.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: card.color }}>
                                                    <card.icon size={24} />
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: TOKENS.textMuted, marginBottom: '4px' }}>{card.label}</div>
                                                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: TOKENS.text }}>{card.value}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Modern Table */}
                                    <div style={{ backgroundColor: 'white', borderRadius: '16px', border: `1px solid ${TOKENS.border}`, overflow: 'hidden', boxShadow: TOKENS.shadow }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                            <thead>
                                                <tr style={{ borderBottom: `1px solid ${TOKENS.border}`, backgroundColor: '#fafafa' }}>
                                                    <th style={{ padding: '16px', width: '40px' }}><input type="checkbox" style={{ cursor: 'pointer' }} /></th>
                                                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: TOKENS.textMuted, textTransform: 'uppercase' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>Field Name <ArrowUpDown size={12} /></div>
                                                    </th>
                                                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: TOKENS.textMuted, textTransform: 'uppercase' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>Type <ArrowUpDown size={12} /></div>
                                                    </th>
                                                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: TOKENS.textMuted, textTransform: 'uppercase' }}>Configuration</th>
                                                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: TOKENS.textMuted, textTransform: 'uppercase' }}>Constraints</th>
                                                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: TOKENS.textMuted, textTransform: 'uppercase' }}>Default</th>
                                                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: TOKENS.textMuted, textTransform: 'uppercase' }}>Status</th>
                                                    <th style={{ padding: '16px', textAlign: 'right', fontSize: '0.75rem', fontWeight: 700, color: TOKENS.textMuted, textTransform: 'uppercase' }}>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {/* ID Row */}
                                                <tr style={{ borderBottom: `1px solid ${TOKENS.borderLight}` }}>
                                                    <td style={{ padding: '16px' }}><div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><GripVertical size={14} color={TOKENS.border} /><input type="checkbox" /></div></td>
                                                    <td style={{ padding: '16px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                            <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: TOKENS.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                <Key size={16} color={TOKENS.textMuted} />
                                                            </div>
                                                            <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>ID</span>
                                                            <span style={{ padding: '2px 6px', backgroundColor: '#f3f4ff', color: '#6366f1', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 800 }}>PK</span>
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '16px' }}>
                                                        <span style={{ padding: '4px 10px', backgroundColor: '#f1f5f9', color: '#334155', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}>System ID</span>
                                                    </td>
                                                    <td style={{ padding: '16px', color: TOKENS.textMuted, fontSize: '0.85rem' }}>Auto increment</td>
                                                    <td style={{ padding: '16px' }}><span style={{ padding: '4px 8px', backgroundColor: '#fdf2f8', color: '#db2777', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700 }}>Primary Key</span></td>
                                                    <td style={{ padding: '16px', color: TOKENS.textMuted, fontSize: '0.85rem' }}>Auto</td>
                                                    <td style={{ padding: '16px' }}><span style={{ padding: '4px 10px', backgroundColor: '#f0fdf4', color: '#15803d', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}>Visible</span></td>
                                                    <td style={{ padding: '16px', textAlign: 'right' }}><div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}><Settings size={16} style={{ color: TOKENS.textMuted }} /><MoreVertical size={16} style={{ color: TOKENS.border }} /></div></td>
                                                </tr>

                                                {/* Other Fields */}
                                                {activeFields.map(field => {
                                                    const isHidden = hiddenFields.includes(field.name);
                                                    const TypeIcon = {
                                                        text: Type,
                                                        number: Hash,
                                                        integer: Hash,
                                                        boolean: CheckSquare,
                                                        datetime: Calendar,
                                                        image: Image,
                                                        user: User,
                                                        linked_record: Database
                                                    }[field.type] || Type;

                                                    const typeColors = {
                                                        text: { bg: '#f1f5f9', text: '#334155' }, // Slate
                                                        number: { bg: '#fff7ed', text: '#c2410c' }, // Orange
                                                        integer: { bg: '#fff7ed', text: '#c2410c' },
                                                        boolean: { bg: '#f0fdf4', text: '#15803d' }, // Green
                                                        datetime: { bg: '#fff1f2', text: '#be123c' }, // Rose
                                                        linked_record: { bg: '#f5f3ff', text: '#6d28d9' } // Violet
                                                    }[field.type] || { bg: '#f1f5f9', text: '#64748b' };

                                                    return (
                                                        <tr key={field.name} style={{ borderBottom: `1px solid ${TOKENS.borderLight}` }}>
                                                            <td style={{ padding: '16px' }}><div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><GripVertical size={14} color={TOKENS.border} /><input type="checkbox" /></div></td>
                                                            <td style={{ padding: '16px' }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: TOKENS.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                        <TypeIcon size={16} color={TOKENS.textMuted} />
                                                                    </div>
                                                                    <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{field.name}</span>
                                                                </div>
                                                            </td>
                                                            <td style={{ padding: '16px' }}>
                                                                <span style={{ padding: '4px 10px', backgroundColor: typeColors.bg, color: typeColors.text, borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}>
                                                                    {FIELD_TYPE_LABELS[field.type] || field.type}
                                                                </span>
                                                            </td>
                                                            <td style={{ padding: '16px', color: TOKENS.textMuted, fontSize: '0.85rem' }}>
                                                                {field.type === 'linked_record' ? `Linked to ${tables.find(t => t.id === field.link_table_id)?.name || 'Table'}` : 'Standard field'}
                                                            </td>
                                                            <td style={{ padding: '16px' }}>
                                                                <div style={{ display: 'flex', gap: '4px' }}>
                                                                    {field.type === 'linked_record' && <span style={{ padding: '4px 8px', backgroundColor: '#eff6ff', color: '#2563eb', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700 }}>Indexed</span>}
                                                                    <span style={{ padding: '4px 8px', backgroundColor: '#f8fafc', color: TOKENS.textMuted, borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700 }}>Not Null</span>
                                                                </div>
                                                            </td>
                                                            <td style={{ padding: '16px', color: TOKENS.textMuted, fontSize: '0.85rem' }}>-</td>
                                                            <td style={{ padding: '16px' }}>
                                                                <span style={{
                                                                    padding: '4px 10px',
                                                                    backgroundColor: isHidden ? '#fef2f2' : '#f0fdf4',
                                                                    color: isHidden ? '#be123c' : '#15803d',
                                                                    borderRadius: '6px',
                                                                    fontSize: '0.75rem',
                                                                    fontWeight: 700
                                                                }}>
                                                                    {isHidden ? 'Hidden' : 'Visible'}
                                                                </span>
                                                            </td>
                                                            <td style={{ padding: '16px', textAlign: 'right' }}>
                                                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                                                    <Settings
                                                                        size={16}
                                                                        style={{ color: TOKENS.textMuted, cursor: 'pointer' }}
                                                                        onClick={(e) => {
                                                                            const rect = e.currentTarget.getBoundingClientRect();
                                                                            setActiveMenuField({ name: field.name, x: rect.left, y: rect.top });
                                                                        }}
                                                                    />
                                                                    <MoreVertical size={16} style={{ color: TOKENS.border }} />
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>

                                        {/* Pagination */}
                                        <div style={{ padding: '16px 32px', borderTop: `1px solid ${TOKENS.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fafafa' }}>
                                            <div style={{ fontSize: '0.85rem', color: TOKENS.textMuted }}>
                                                1 - 10 of {activeFields.length + 1} fields
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <button style={{ padding: '6px', borderRadius: '6px', border: `1px solid ${TOKENS.border}`, backgroundColor: 'white', color: TOKENS.textMuted }}><ChevronsLeft size={16} /></button>
                                                <button style={{ padding: '6px', borderRadius: '6px', border: `1px solid ${TOKENS.border}`, backgroundColor: 'white', color: TOKENS.textMuted }}><ChevronLeft size={16} /></button>
                                                <div style={{ display: 'flex', gap: '4px' }}>
                                                    <button style={{ width: '32px', height: '32px', borderRadius: '6px', border: 'none', backgroundColor: TOKENS.primary, color: 'white', fontWeight: 700, fontSize: '0.85rem' }}>1</button>
                                                    <button style={{ width: '32px', height: '32px', borderRadius: '6px', border: `1px solid ${TOKENS.border}`, backgroundColor: 'white', color: TOKENS.text, fontWeight: 600, fontSize: '0.85rem' }}>2</button>
                                                    <button style={{ width: '32px', height: '32px', borderRadius: '6px', border: `1px solid ${TOKENS.border}`, backgroundColor: 'white', color: TOKENS.text, fontWeight: 600, fontSize: '0.85rem' }}>3</button>
                                                </div>
                                                <button style={{ padding: '6px', borderRadius: '6px', border: `1px solid ${TOKENS.border}`, backgroundColor: 'white', color: TOKENS.textMuted }}><ChevronRight size={16} /></button>
                                                <button style={{ padding: '6px', borderRadius: '6px', border: `1px solid ${TOKENS.border}`, backgroundColor: 'white', color: TOKENS.textMuted }}><ChevronsRight size={16} /></button>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.85rem', color: TOKENS.textMuted }}>
                                                Rows per page
                                                <select style={{ padding: '4px 8px', borderRadius: '6px', border: `1px solid ${TOKENS.border}`, backgroundColor: 'white', outline: 'none' }}>
                                                    <option>10</option>
                                                    <option>20</option>
                                                    <option>50</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : activePanel === 'queries' ? (
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '32px', overflowY: 'auto' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                                        <div>
                                            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0, color: TOKENS.text, letterSpacing: '-0.02em' }}>Table Queries</h2>
                                            <p style={{ fontSize: '1rem', color: TOKENS.textMuted, margin: '8px 0 0' }}>Save filters and sorts to use across apps.</p>
                                        </div>
                                        <button
                                            onClick={() => {
                                                setEditingQuery({ id: Date.now().toString(), name: 'New Query', matchType: 'all', filters: [], sort: [], limit: 1000 });
                                                setIsQueryEditorOpen(true);
                                            }}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                padding: '10px 24px',
                                                borderRadius: '10px',
                                                backgroundColor: TOKENS.primary,
                                                color: 'white',
                                                border: 'none',
                                                fontWeight: 700,
                                                fontSize: '0.85rem',
                                                cursor: 'pointer',
                                                boxShadow: '0 4px 6px -1px rgba(99, 102, 241, 0.4)'
                                            }}
                                        >
                                            <Plus size={18} /> Add Query
                                        </button>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
                                        {(selectedTable?.queries || []).length === 0 ? (
                                            <div style={{ gridColumn: '1 / -1', padding: '100px', textAlign: 'center', backgroundColor: 'white', borderRadius: '16px', border: `1px dashed ${TOKENS.border}`, color: TOKENS.textMuted }}>
                                                <Search size={48} style={{ margin: '0 auto 20px', opacity: 0.1 }} />
                                                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: TOKENS.text, marginBottom: '8px' }}>No Saved Queries</div>
                                                <p style={{ fontSize: '0.9rem' }}>Define custom filters and sorting rules to easily access specific data subsets.</p>
                                            </div>
                                        ) : (
                                            (selectedTable?.queries || []).map(q => (
                                                <div key={q.id} style={{ backgroundColor: 'white', padding: '24px', borderRadius: '16px', border: `1px solid ${TOKENS.border}`, boxShadow: TOKENS.shadow, display: 'flex', flexDirection: 'column', gap: '16px', transition: 'transform 0.2s' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                            <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8b5cf6' }}>
                                                                <Search size={20} />
                                                            </div>
                                                            <div style={{ fontWeight: 800, fontSize: '1.1rem', color: TOKENS.text }}>{q.name}</div>
                                                        </div>
                                                        <div style={{ display: 'flex', gap: '4px' }}>
                                                            <button
                                                                onClick={() => {
                                                                    setEditingQuery(q);
                                                                    setIsQueryEditorOpen(true);
                                                                }}
                                                                style={{ padding: '8px', background: 'none', border: 'none', cursor: 'pointer', borderRadius: '8px', color: TOKENS.textMuted }}
                                                            >
                                                                <Edit2 size={16} />
                                                            </button>
                                                            <button
                                                                onClick={async () => {
                                                                    if (!confirm('Delete this query?')) return;
                                                                    const updatedQueries = selectedTable.queries.filter(existing => existing.id !== q.id);
                                                                    await updateTable(selectedTableId, { queries: updatedQueries });
                                                                    loadTables();
                                                                }}
                                                                style={{ padding: '8px', background: 'none', border: 'none', cursor: 'pointer', borderRadius: '8px', color: '#f43f5e' }}
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                                        <span style={{ padding: '4px 10px', backgroundColor: '#f1f5f9', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, color: TOKENS.textMuted }}>{q.filters?.length || 0} Filters</span>
                                                        <span style={{ padding: '4px 10px', backgroundColor: '#f1f5f9', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, color: TOKENS.textMuted }}>{q.sort?.length || 0} Sorts</span>
                                                        <span style={{ padding: '4px 10px', backgroundColor: '#f1f5f9', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, color: TOKENS.textMuted }}>Limit {q.limit}</span>
                                                    </div>

                                                    <button
                                                        onClick={() => {
                                                            setActiveQueryId(q.id);
                                                            setActivePanel('records');
                                                        }}
                                                        style={{ width: '100%', padding: '12px', backgroundColor: TOKENS.bg, border: `1px solid ${TOKENS.border}`, borderRadius: '10px', fontWeight: 700, fontSize: '0.85rem', color: TOKENS.primary, cursor: 'pointer', marginTop: '8px' }}
                                                    >
                                                        View Data
                                                    </button>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            ) : activePanel === 'relation_diagram' ? (
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '32px', overflow: 'hidden' }}>
                                    <div style={{ marginBottom: '20px' }}>
                                        <h2 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0, color: TOKENS.text, letterSpacing: '-0.02em' }}>Relation Diagram</h2>
                                        <p style={{ fontSize: '1rem', color: TOKENS.textMuted, margin: '8px 0 0' }}>
                                            Visualisasi linked record untuk tabel <strong>{selectedTable.name}</strong>.
                                        </p>
                                    </div>

                                    <div style={{ flex: 1, backgroundColor: 'white', borderRadius: '16px', border: `1px solid ${TOKENS.border}`, boxShadow: TOKENS.shadow, padding: '24px', overflow: 'auto', position: 'relative' }}>
                                        {relationDiagramData.nodes.length === 0 ? (
                                            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: TOKENS.textMuted, textAlign: 'center' }}>
                                                <Database size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
                                                <div style={{ fontWeight: 700, color: TOKENS.text, marginBottom: '8px' }}>Belum ada relasi linked record</div>
                                                <div style={{ fontSize: '0.9rem' }}>Tambahkan field bertipe Linked Record dan isi data untuk melihat diagram relasi.</div>
                                            </div>
                                        ) : (() => {
                                            const { nodes, edges } = relationDiagramData;
                                            const width = 1200;
                                            const height = Math.max(600, Math.ceil(nodes.length / 4) * 170);
                                            const positionedNodes = nodes.map((node, index) => {
                                                const col = index % 4;
                                                const row = Math.floor(index / 4);
                                                return { ...node, x: 120 + col * 280, y: 90 + row * 140 };
                                            });
                                            const positionMap = new Map(positionedNodes.map((n) => [n.id, n]));

                                            return (
                                                <div style={{ minWidth: `${width}px`, minHeight: `${height}px`, position: 'relative' }}>
                                                    <svg width={width} height={height} style={{ position: 'absolute', inset: 0 }}>
                                                        {edges.map((edge) => {
                                                            const from = positionMap.get(edge.from);
                                                            const to = positionMap.get(edge.to);
                                                            if (!from || !to) return null;
                                                            return (
                                                                <g key={edge.id}>
                                                                    <line x1={from.x + 70} y1={from.y + 24} x2={to.x - 70} y2={to.y + 24} stroke="#94a3b8" strokeWidth="1.8" />
                                                                    <text x={(from.x + to.x) / 2} y={(from.y + to.y) / 2 - 4} fill="#64748b" fontSize="10" textAnchor="middle">
                                                                        {edge.fieldName}
                                                                    </text>
                                                                </g>
                                                            );
                                                        })}
                                                    </svg>

                                                    {positionedNodes.map((node) => (
                                                        <div
                                                            key={node.id}
                                                            style={{
                                                                position: 'absolute',
                                                                left: node.x - 70,
                                                                top: node.y,
                                                                width: '140px',
                                                                padding: '10px',
                                                                borderRadius: '10px',
                                                                border: `1px solid ${node.group === 'source' ? '#c7d2fe' : '#e2e8f0'}`,
                                                                backgroundColor: node.group === 'source' ? '#eef2ff' : '#f8fafc',
                                                                boxShadow: TOKENS.shadow
                                                            }}
                                                        >
                                                            <div style={{ fontSize: '0.68rem', color: TOKENS.textMuted, marginBottom: '4px', fontWeight: 700 }}>{node.tableName}</div>
                                                            <div style={{ fontSize: '0.82rem', fontWeight: 800, color: TOKENS.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{node.label}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            );
                                        })()}
                                    </div>
                                </div>
                            ) : (
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '32px', overflowY: 'auto' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                                        <div>
                                            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0, color: TOKENS.text, letterSpacing: '-0.02em' }}>Table Aggregations</h2>
                                            <p style={{ fontSize: '1rem', color: TOKENS.textMuted, margin: '8px 0 0' }}>Calculate statistics across your table data.</p>
                                        </div>
                                        <button
                                            onClick={() => {
                                                setEditingAggregation({ id: Date.now().toString(), name: 'New Aggregation', calculation: 'sum', field: activeFields[0]?.name });
                                                setIsAggregationEditorOpen(true);
                                            }}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                padding: '10px 24px',
                                                borderRadius: '10px',
                                                backgroundColor: TOKENS.primary,
                                                color: 'white',
                                                border: 'none',
                                                fontWeight: 700,
                                                fontSize: '0.85rem',
                                                cursor: 'pointer',
                                                boxShadow: '0 4px 6px -1px rgba(99, 102, 241, 0.4)'
                                            }}
                                        >
                                            <Plus size={18} /> Add Aggregation
                                        </button>
                                    </div>

                                    <div style={{ backgroundColor: 'white', borderRadius: '16px', border: `1px solid ${TOKENS.border}`, overflow: 'hidden', boxShadow: TOKENS.shadow }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                            <thead>
                                                <tr style={{ borderBottom: `1px solid ${TOKENS.border}`, backgroundColor: '#fafafa' }}>
                                                    <th style={{ padding: '20px', textAlign: 'left', fontSize: '0.8rem', fontWeight: 700, color: TOKENS.textMuted, textTransform: 'uppercase' }}>Name</th>
                                                    <th style={{ padding: '20px', textAlign: 'left', fontSize: '0.8rem', fontWeight: 700, color: TOKENS.textMuted, textTransform: 'uppercase' }}>Calculation</th>
                                                    <th style={{ padding: '20px', textAlign: 'left', fontSize: '0.8rem', fontWeight: 700, color: TOKENS.textMuted, textTransform: 'uppercase' }}>Field</th>
                                                    <th style={{ padding: '20px', textAlign: 'left', fontSize: '0.8rem', fontWeight: 700, color: TOKENS.textMuted, textTransform: 'uppercase' }}>Current Result</th>
                                                    <th style={{ padding: '20px', textAlign: 'right', fontSize: '0.8rem', fontWeight: 700, color: TOKENS.textMuted, textTransform: 'uppercase' }}>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {(selectedTable?.aggregations || []).length === 0 ? (
                                                    <tr>
                                                        <td colSpan="5" style={{ padding: '80px', textAlign: 'center', color: TOKENS.textMuted }}>
                                                            <div style={{ fontSize: '1rem', fontWeight: 600 }}>No aggregations defined.</div>
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    (selectedTable?.aggregations || []).map(agg => {
                                                        const result = (() => {
                                                            let values = filteredAndSortedRecords.map(r => Number(r[agg.field])).filter(n => !isNaN(n));
                                                            if (agg.calculation === 'count') return filteredAndSortedRecords.length;
                                                            if (values.length === 0) return '-';
                                                            switch (agg.calculation) {
                                                                case 'sum': return values.reduce((s, v) => s + v, 0).toLocaleString();
                                                                case 'average': return (values.reduce((s, v) => s + v, 0) / values.length).toFixed(2);
                                                                case 'min': return Math.min(...values);
                                                                case 'max': return Math.max(...values);
                                                                default: return '-';
                                                            }
                                                        })();

                                                        return (
                                                            <tr key={agg.id} style={{ borderBottom: `1px solid ${TOKENS.borderLight}` }}>
                                                                <td style={{ padding: '20px', fontWeight: 700, color: TOKENS.text }}>{agg.name}</td>
                                                                <td style={{ padding: '20px' }}>
                                                                    <span style={{ padding: '4px 10px', backgroundColor: '#eef2ff', color: '#6366f1', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>{agg.calculation}</span>
                                                                </td>
                                                                <td style={{ padding: '20px', color: TOKENS.textMuted, fontWeight: 500 }}>{agg.field}</td>
                                                                <td style={{ padding: '20px' }}>
                                                                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: TOKENS.primary }}>{result}</div>
                                                                </td>
                                                                <td style={{ padding: '20px', textAlign: 'right' }}>
                                                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                                                        <button
                                                                            onClick={() => {
                                                                                setEditingAggregation(agg);
                                                                                setIsAggregationEditorOpen(true);
                                                                            }}
                                                                            style={{ padding: '8px', borderRadius: '8px', border: `1px solid ${TOKENS.border}`, backgroundColor: 'white', color: TOKENS.textMuted, cursor: 'pointer' }}
                                                                        >
                                                                            <Edit2 size={16} />
                                                                        </button>
                                                                        <button
                                                                            onClick={async () => {
                                                                                if (!confirm('Delete this aggregation?')) return;
                                                                                const updatedAggs = selectedTable.aggregations.filter(existing => existing.id !== agg.id);
                                                                                await updateTable(selectedTableId, { aggregations: updatedAggs });
                                                                                loadTables();
                                                                            }}
                                                                            style={{ padding: '8px', borderRadius: '8px', border: `1px solid ${TOKENS.border}`, backgroundColor: 'white', color: '#f43f5e', cursor: 'pointer' }}
                                                                        >
                                                                            <Trash2 size={16} />
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
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {isCreateModalOpen && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 5000, backdropFilter: 'blur(12px)' }}>
                    <div style={{ width: '450px', backgroundColor: 'white', borderRadius: '24px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', border: `1px solid ${TOKENS.border}`, overflow: 'hidden' }}>
                        <div style={{ padding: '32px 32px 24px', borderBottom: `1px solid ${TOKENS.borderLight}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ fontWeight: 900, fontSize: '1.4rem', color: TOKENS.text, letterSpacing: '-0.02em' }}>Create New Table</div>
                            <button onClick={() => setIsCreateModalOpen(false)} style={{ border: 'none', background: 'none', color: TOKENS.textMuted, cursor: 'pointer', padding: '8px', borderRadius: '12px' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f1f5f9'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}><X size={24} /></button>
                        </div>
                        <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', color: TOKENS.text, marginBottom: '10px', fontWeight: 700 }}>Table Name</label>
                                <input
                                    value={newTableName}
                                    onChange={(e) => setNewTableName(e.target.value)}
                                    placeholder="e.g. Work Orders"
                                    style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: `1px solid ${TOKENS.border}`, fontSize: '1rem', outline: 'none', transition: 'all 0.2s' }}
                                    onFocus={(e) => { e.target.style.borderColor = TOKENS.primary; e.target.style.boxShadow = `0 0 0 4px ${TOKENS.bg}`; }}
                                    onBlur={(e) => { e.target.style.borderColor = TOKENS.border; e.target.style.boxShadow = 'none'; }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', color: TOKENS.text, marginBottom: '10px', fontWeight: 700 }}>Description</label>
                                <textarea
                                    value={newTableDescription}
                                    onChange={(e) => setNewTableDescription(e.target.value)}
                                    placeholder="What is this table for?"
                                    rows={3}
                                    style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: `1px solid ${TOKENS.border}`, fontSize: '1rem', outline: 'none', resize: 'vertical', transition: 'all 0.2s' }}
                                    onFocus={(e) => { e.target.style.borderColor = TOKENS.primary; e.target.style.boxShadow = `0 0 0 4px ${TOKENS.bg}`; }}
                                    onBlur={(e) => { e.target.style.borderColor = TOKENS.border; e.target.style.boxShadow = 'none'; }}
                                />
                            </div>
                        </div>
                        <div style={{ padding: '24px 32px', borderTop: `1px solid ${TOKENS.borderLight}`, display: 'flex', justifyContent: 'flex-end', gap: '16px', backgroundColor: '#fafafa' }}>
                            <button onClick={() => setIsCreateModalOpen(false)} style={{ border: `1px solid ${TOKENS.border}`, backgroundColor: 'white', color: TOKENS.text, padding: '12px 24px', borderRadius: '12px', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem' }}>Cancel</button>
                            <button
                                onClick={handleCreateTable}
                                disabled={creatingTable}
                                style={{ border: 'none', backgroundColor: TOKENS.primary, color: 'white', padding: '12px 28px', borderRadius: '12px', cursor: 'pointer', fontWeight: 800, fontSize: '0.9rem', boxShadow: '0 4px 6px -1px rgba(99, 102, 241, 0.4)' }}
                            >
                                {creatingTable ? 'Creating...' : 'Create Table'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {isRecordModalOpen && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', zIndex: 6000, backdropFilter: 'blur(12px)' }}>
                    <div style={{ width: '100%', maxWidth: '550px', backgroundColor: 'white', borderRadius: '24px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', border: `1px solid ${TOKENS.border}`, overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
                        <div style={{ padding: '32px 32px 24px', borderBottom: `1px solid ${TOKENS.borderLight}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ fontWeight: 900, fontSize: '1.4rem', color: TOKENS.text, letterSpacing: '-0.02em' }}>
                                {isEditingRecord ? 'Update Record' : 'Add New Record'}
                            </div>
                            <button onClick={() => setIsRecordModalOpen(false)} style={{ border: 'none', background: 'none', color: TOKENS.textMuted, cursor: 'pointer', padding: '8px', borderRadius: '12px' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f1f5f9'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}><X size={24} /></button>
                        </div>

                        <div style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
                            <div style={{ marginBottom: '32px' }}>
                                <label style={{ display: 'block', fontSize: '0.85rem', color: TOKENS.text, marginBottom: '10px', fontWeight: 700 }}>Record ID <span style={{ color: '#ef4444' }}>*</span></label>
                                <input
                                    value={newRecordId}
                                    onChange={(e) => setNewRecordId(e.target.value)}
                                    placeholder="e.g. WO-123"
                                    disabled={isEditingRecord}
                                    style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: `1px solid ${TOKENS.border}`, fontSize: '1rem', outline: 'none', backgroundColor: isEditingRecord ? '#f8fafc' : 'white', transition: 'all 0.2s' }}
                                    onFocus={(e) => { e.target.style.borderColor = TOKENS.primary; e.target.style.boxShadow = `0 0 0 4px ${TOKENS.bg}`; }}
                                    onBlur={(e) => { e.target.style.borderColor = TOKENS.border; e.target.style.boxShadow = 'none'; }}
                                    autoFocus={!isEditingRecord}
                                />
                                <p style={{ margin: '10px 0 0', fontSize: '0.8rem', color: TOKENS.textMuted }}>Unique identifier for this record.</p>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: TOKENS.primary, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Data Fields</div>
                                {activeFields.length === 0 ? (
                                    <div style={{ padding: '40px', backgroundColor: '#f8fafc', borderRadius: '16px', textAlign: 'center', color: TOKENS.textMuted, fontSize: '0.9rem', border: `1px dashed ${TOKENS.border}` }}>
                                        No custom fields defined for this table.
                                    </div>
                                ) : (
                                    activeFields.map((field) => (
                                        <div key={field.name}>
                                            <label style={{ display: 'block', fontSize: '0.85rem', color: TOKENS.text, marginBottom: '10px', fontWeight: 700 }}>
                                                {field.name}
                                                <span style={{ marginLeft: '8px', fontWeight: 500, color: TOKENS.textMuted, fontSize: '0.75rem', textTransform: 'uppercase' }}>• {FIELD_TYPE_LABELS[field.type] || field.type}</span>
                                            </label>
                                            {field.type === 'linked_record' ? (
                                                <LinkedRecordSelector
                                                    field={field}
                                                    value={newRecordValues[field.name] ?? []}
                                                    tables={tables}
                                                    onChange={(val) => setNewRecordValues((prev) => ({ ...prev, [field.name]: val }))}
                                                />
                                            ) : (field.type === 'image' || field.type === 'video') ? (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                        <input
                                                            type="text"
                                                            value={newRecordValues[field.name] ?? ''}
                                                            onChange={(e) => setNewRecordValues((prev) => ({ ...prev, [field.name]: e.target.value }))}
                                                            placeholder={`Public URL or upload...`}
                                                            style={{ flex: 1, padding: '14px 16px', borderRadius: '12px', border: `1px solid ${TOKENS.border}`, fontSize: '1rem', outline: 'none' }}
                                                        />
                                                        <label style={{
                                                            padding: '12px 16px',
                                                            backgroundColor: uploadingFields[field.name] ? '#e2e8f0' : TOKENS.bg,
                                                            color: TOKENS.primary,
                                                            borderRadius: '12px',
                                                            border: `1px solid ${TOKENS.border}`,
                                                            cursor: uploadingFields[field.name] ? 'not-allowed' : 'pointer',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '8px',
                                                            fontSize: '0.85rem',
                                                            fontWeight: 700,
                                                            transition: 'all 0.2s'
                                                        }}>
                                                            {uploadingFields[field.name] ? <RefreshCw size={14} className="animate-spin" /> : <Upload size={14} />}
                                                            {uploadingFields[field.name] ? 'Uploading...' : 'Upload'}
                                                            <input
                                                                type="file"
                                                                accept={field.type === 'image' ? 'image/*' : 'video/*'}
                                                                onChange={(e) => handleFileUpload(field.name, e.target.files?.[0])}
                                                                style={{ display: 'none' }}
                                                                disabled={uploadingFields[field.name]}
                                                            />
                                                        </label>
                                                    </div>
                                                    {newRecordValues[field.name] && field.type === 'image' && (
                                                        <div style={{ width: '100%', height: '200px', borderRadius: '12px', overflow: 'hidden', border: `1px solid ${TOKENS.border}`, marginTop: '8px' }}>
                                                            <img src={newRecordValues[field.name]} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <input
                                                    value={newRecordValues[field.name] ?? ''}
                                                    onChange={(e) => setNewRecordValues((prev) => ({ ...prev, [field.name]: e.target.value }))}
                                                    placeholder={`Enter ${field.name}...`}
                                                    style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: `1px solid ${TOKENS.border}`, fontSize: '1rem', outline: 'none' }}
                                                    onFocus={(e) => { e.target.style.borderColor = TOKENS.primary; e.target.style.boxShadow = `0 0 0 4px ${TOKENS.bg}`; }}
                                                    onBlur={(e) => { e.target.style.borderColor = TOKENS.border; e.target.style.boxShadow = 'none'; }}
                                                />
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        <div style={{ padding: '24px 32px', borderTop: `1px solid ${TOKENS.borderLight}`, display: 'flex', justifyContent: 'flex-end', gap: '16px', backgroundColor: '#fafafa' }}>
                            <button onClick={() => setIsRecordModalOpen(false)} style={{ border: `1px solid ${TOKENS.border}`, backgroundColor: 'white', color: TOKENS.text, padding: '12px 24px', borderRadius: '12px', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem' }}>Cancel</button>
                            <button
                                onClick={handleAddRecord}
                                disabled={recordsLoading || (!isEditingRecord && activeFields.length === 0 && !newRecordId)}
                                style={{ border: 'none', backgroundColor: TOKENS.primary, color: 'white', padding: '12px 28px', borderRadius: '12px', cursor: 'pointer', fontWeight: 800, fontSize: '0.9rem', boxShadow: '0 4px 6px -1px rgba(99, 102, 241, 0.4)', display: 'flex', alignItems: 'center', gap: '8px' }}
                            >
                                {isEditingRecord ? <RefreshCw size={18} /> : <Plus size={18} />}
                                {isEditingRecord ? 'Save Changes' : 'Add Entry'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {isFieldModalOpen && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 6000, backdropFilter: 'blur(12px)' }}>
                    <div style={{ width: '450px', backgroundColor: 'white', borderRadius: '24px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', border: `1px solid ${TOKENS.border}`, overflow: 'hidden' }}>
                        <div style={{ padding: '32px 32px 24px', borderBottom: `1px solid ${TOKENS.borderLight}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ fontWeight: 900, fontSize: '1.4rem', color: TOKENS.text, letterSpacing: '-0.02em' }}>Add New Column</div>
                            <button onClick={() => setIsFieldModalOpen(false)} style={{ border: 'none', background: 'none', color: TOKENS.textMuted, cursor: 'pointer', padding: '8px', borderRadius: '12px' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f1f5f9'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}><X size={24} /></button>
                        </div>
                        <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', color: TOKENS.text, marginBottom: '10px', fontWeight: 700 }}>Column Name</label>
                                <input
                                    value={newFieldName}
                                    onChange={(e) => setNewFieldName(e.target.value)}
                                    placeholder="e.g. Quantity"
                                    style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: `1px solid ${TOKENS.border}`, fontSize: '1rem', outline: 'none', transition: 'all 0.2s' }}
                                    onFocus={(e) => { e.target.style.borderColor = TOKENS.primary; e.target.style.boxShadow = `0 0 0 4px ${TOKENS.bg}`; }}
                                    onBlur={(e) => { e.target.style.borderColor = TOKENS.border; e.target.style.boxShadow = 'none'; }}
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', color: TOKENS.text, marginBottom: '10px', fontWeight: 700 }}>Data Type</label>
                                <select
                                    value={newFieldType}
                                    onChange={(e) => setNewFieldType(e.target.value)}
                                    style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: `1px solid ${TOKENS.border}`, fontSize: '1rem', outline: 'none', backgroundColor: 'white' }}
                                >
                                    {TABLE_FIELD_TYPES.map((type) => (
                                        <option key={type} value={type}>{FIELD_TYPE_LABELS[type] || type}</option>
                                    ))}
                                </select>
                            </div>
                            {newFieldType === 'linked_record' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '24px', backgroundColor: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.8rem', color: TOKENS.text, marginBottom: '8px', fontWeight: 700 }}>Link To Table</label>
                                        <select
                                            value={targetTableId}
                                            onChange={(e) => setTargetTableId(e.target.value)}
                                            style={{ width: '100%', padding: '12px', borderRadius: '10px', border: `1px solid ${TOKENS.border}`, fontSize: '0.9rem', outline: 'none', backgroundColor: 'white' }}
                                        >
                                            <option value="">Select a table...</option>
                                            {tables.filter(t => t.id !== selectedTableId).map((table) => (
                                                <option key={table.id} value={table.id}>{table.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.8rem', color: TOKENS.text, marginBottom: '8px', fontWeight: 700 }}>Label in Target Table</label>
                                        <input
                                            value={newFieldReverseName}
                                            onChange={(e) => setNewFieldReverseName(e.target.value)}
                                            placeholder="e.g. Related Records"
                                            style={{ width: '100%', padding: '12px', borderRadius: '10px', border: `1px solid ${TOKENS.border}`, fontSize: '0.9rem', outline: 'none' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.8rem', color: TOKENS.text, marginBottom: '8px', fontWeight: 700 }}>Link Type</label>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                            {[
                                                { id: 'one_to_one', label: 'One to One', icon: '○──○' },
                                                { id: 'one_to_many', label: 'One to Many', icon: '○──∈' },
                                                { id: 'many_to_one', label: 'Many to One', icon: '∋──○' },
                                                { id: 'many_to_many', label: 'Many to Many', icon: '∋──∈' }
                                            ].map(lt => (
                                                <button
                                                    key={lt.id}
                                                    onClick={() => setNewFieldLinkType(lt.id)}
                                                    style={{
                                                        padding: '12px 8px',
                                                        borderRadius: '10px',
                                                        border: `2px solid ${newFieldLinkType === lt.id ? TOKENS.primary : '#e2e8f0'}`,
                                                        backgroundColor: newFieldLinkType === lt.id ? '#f5f3ff' : 'white',
                                                        color: newFieldLinkType === lt.id ? TOKENS.primary : TOKENS.text,
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        alignItems: 'center',
                                                        gap: '4px',
                                                        fontSize: '0.75rem',
                                                        fontWeight: 700,
                                                        transition: 'all 0.2s'
                                                    }}
                                                >
                                                    <span style={{ fontSize: '1.1rem' }}>{lt.icon}</span>
                                                    {lt.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div style={{ padding: '24px 32px', borderTop: `1px solid ${TOKENS.borderLight}`, display: 'flex', justifyContent: 'flex-end', gap: '16px', backgroundColor: '#fafafa' }}>
                            <button onClick={() => setIsFieldModalOpen(false)} style={{ border: `1px solid ${TOKENS.border}`, backgroundColor: 'white', color: TOKENS.text, padding: '12px 24px', borderRadius: '12px', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem' }}>Cancel</button>
                            <button
                                onClick={async () => {
                                    await handleAddField();
                                    setIsFieldModalOpen(false);
                                }}
                                style={{ border: 'none', backgroundColor: TOKENS.primary, color: 'white', padding: '12px 28px', borderRadius: '12px', cursor: 'pointer', fontWeight: 800, fontSize: '0.9rem', boxShadow: '0 4px 6px -1px rgba(99, 102, 241, 0.4)' }}
                            >
                                Add Column
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {isEditTableModalOpen && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 5000, backdropFilter: 'blur(12px)' }}>
                    <div style={{ width: '450px', backgroundColor: 'white', borderRadius: '24px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', border: `1px solid ${TOKENS.border}`, overflow: 'hidden' }}>
                        <div style={{ padding: '32px 32px 24px', borderBottom: `1px solid ${TOKENS.borderLight}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ fontWeight: 900, fontSize: '1.4rem', color: TOKENS.text, letterSpacing: '-0.02em' }}>Edit Table Settings</div>
                            <button onClick={() => setIsEditTableModalOpen(false)} style={{ border: 'none', background: 'none', color: TOKENS.textMuted, cursor: 'pointer', padding: '8px', borderRadius: '12px' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f1f5f9'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}><X size={24} /></button>
                        </div>
                        <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', color: TOKENS.text, marginBottom: '10px', fontWeight: 700 }}>Table Name</label>
                                <input
                                    value={editTableName}
                                    onChange={(e) => setEditTableName(e.target.value)}
                                    placeholder="Enter table name"
                                    style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: `1px solid ${TOKENS.border}`, fontSize: '1rem', outline: 'none', transition: 'all 0.2s' }}
                                    onFocus={(e) => { e.target.style.borderColor = TOKENS.primary; e.target.style.boxShadow = `0 0 0 4px ${TOKENS.bg}`; }}
                                    onBlur={(e) => { e.target.style.borderColor = TOKENS.border; e.target.style.boxShadow = 'none'; }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', color: TOKENS.text, marginBottom: '10px', fontWeight: 700 }}>Description</label>
                                <textarea
                                    value={editTableDescription}
                                    onChange={(e) => setEditTableDescription(e.target.value)}
                                    placeholder="Table description..."
                                    rows={3}
                                    style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: `1px solid ${TOKENS.border}`, fontSize: '1rem', outline: 'none', resize: 'vertical', transition: 'all 0.2s' }}
                                    onFocus={(e) => { e.target.style.borderColor = TOKENS.primary; e.target.style.boxShadow = `0 0 0 4px ${TOKENS.bg}`; }}
                                    onBlur={(e) => { e.target.style.borderColor = TOKENS.border; e.target.style.boxShadow = 'none'; }}
                                />
                            </div>
                        </div>
                        <div style={{ padding: '24px 32px', borderTop: `1px solid ${TOKENS.borderLight}`, display: 'flex', justifyContent: 'flex-end', gap: '16px', backgroundColor: '#fafafa' }}>
                            <button onClick={() => setIsEditTableModalOpen(false)} style={{ border: `1px solid ${TOKENS.border}`, backgroundColor: 'white', color: TOKENS.text, padding: '12px 24px', borderRadius: '12px', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem' }}>Cancel</button>
                            <button
                                onClick={handleUpdateTableMetadata}
                                disabled={creatingTable}
                                style={{ border: 'none', backgroundColor: TOKENS.primary, color: 'white', padding: '12px 28px', borderRadius: '12px', cursor: 'pointer', fontWeight: 800, fontSize: '0.9rem', boxShadow: '0 4px 6px -1px rgba(99, 102, 241, 0.4)' }}
                            >
                                {creatingTable ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isRenameFieldModalOpen && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 6000, backdropFilter: 'blur(12px)' }}>
                    <div style={{ width: '450px', backgroundColor: 'white', borderRadius: '24px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', border: `1px solid ${TOKENS.border}`, overflow: 'hidden' }}>
                        <div style={{ padding: '32px 32px 24px', borderBottom: `1px solid ${TOKENS.borderLight}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ fontWeight: 900, fontSize: '1.4rem', color: TOKENS.text, letterSpacing: '-0.02em' }}>Rename Column</div>
                            <button onClick={() => setIsRenameFieldModalOpen(false)} style={{ border: 'none', background: 'none', color: TOKENS.textMuted, cursor: 'pointer', padding: '8px', borderRadius: '12px' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f1f5f9'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}><X size={24} /></button>
                        </div>
                        <div style={{ padding: '32px' }}>
                            <label style={{ display: 'block', fontSize: '0.85rem', color: TOKENS.text, marginBottom: '10px', fontWeight: 700 }}>New Name for "{editingField}"</label>
                            <input
                                value={renameFieldNewName}
                                onChange={(e) => setRenameFieldNewName(e.target.value)}
                                placeholder="New column name"
                                style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: `1px solid ${TOKENS.border}`, fontSize: '1rem', outline: 'none', transition: 'all 0.2s' }}
                                onFocus={(e) => { e.target.style.borderColor = TOKENS.primary; e.target.style.boxShadow = `0 0 0 4px ${TOKENS.bg}`; }}
                                onBlur={(e) => { e.target.style.borderColor = TOKENS.border; e.target.style.boxShadow = 'none'; }}
                                autoFocus
                                onKeyDown={(e) => e.key === 'Enter' && handleRenameField(editingField, renameFieldNewName)}
                            />
                        </div>
                        <div style={{ padding: '24px 32px', borderTop: `1px solid ${TOKENS.borderLight}`, display: 'flex', justifyContent: 'flex-end', gap: '16px', backgroundColor: '#fafafa' }}>
                            <button onClick={() => setIsRenameFieldModalOpen(false)} style={{ border: `1px solid ${TOKENS.border}`, backgroundColor: 'white', color: TOKENS.text, padding: '12px 24px', borderRadius: '12px', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem' }}>Cancel</button>
                            <button
                                onClick={() => handleRenameField(editingField, renameFieldNewName)}
                                style={{ border: 'none', backgroundColor: TOKENS.primary, color: 'white', padding: '12px 28px', borderRadius: '12px', cursor: 'pointer', fontWeight: 800, fontSize: '0.9rem', boxShadow: '0 4px 6px -1px rgba(99, 102, 241, 0.4)' }}
                            >
                                Rename
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {isTypeModalOpen && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 6000, backdropFilter: 'blur(12px)' }}>
                    <div style={{ width: '450px', backgroundColor: 'white', borderRadius: '24px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', border: `1px solid ${TOKENS.border}`, overflow: 'hidden' }}>
                        <div style={{ padding: '32px 32px 24px', borderBottom: `1px solid ${TOKENS.borderLight}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ fontWeight: 900, fontSize: '1.4rem', color: TOKENS.text, letterSpacing: '-0.02em' }}>Change Column Type</div>
                            <button onClick={() => setIsTypeModalOpen(false)} style={{ border: 'none', background: 'none', color: TOKENS.textMuted, cursor: 'pointer', padding: '8px', borderRadius: '12px' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f1f5f9'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}><X size={24} /></button>
                        </div>
                        <div style={{ padding: '32px' }}>
                            <label style={{ display: 'block', fontSize: '0.85rem', color: TOKENS.text, marginBottom: '10px', fontWeight: 700 }}>Data Type for "{editingField}"</label>
                            <select
                                value={newType}
                                onChange={(e) => setNewType(e.target.value)}
                                style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: `1px solid ${TOKENS.border}`, fontSize: '1rem', outline: 'none', backgroundColor: 'white' }}
                            >
                                {TABLE_FIELD_TYPES.map(type => (
                                    <option key={type} value={type}>{FIELD_TYPE_LABELS[type] || type}</option>
                                ))}
                            </select>
                            <div style={{ marginTop: '20px', padding: '16px', backgroundColor: '#fef2f2', borderRadius: '12px', border: '1px solid #fee2e2', color: '#b91c1c', fontSize: '0.85rem', lineHeight: '1.5', display: 'flex', gap: '12px' }}>
                                <AlertTriangle size={20} style={{ flexShrink: 0 }} />
                                <span>Changing the data type may cause existing records to become invalid or be permanently altered.</span>
                            </div>
                        </div>
                        <div style={{ padding: '24px 32px', borderTop: `1px solid ${TOKENS.borderLight}`, display: 'flex', justifyContent: 'flex-end', gap: '16px', backgroundColor: '#fafafa' }}>
                            <button onClick={() => setIsTypeModalOpen(false)} style={{ border: `1px solid ${TOKENS.border}`, backgroundColor: 'white', color: TOKENS.text, padding: '12px 24px', borderRadius: '12px', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem' }}>Cancel</button>
                            <button
                                onClick={() => handleUpdateFieldType(editingField, newType)}
                                style={{ border: 'none', backgroundColor: TOKENS.primary, color: 'white', padding: '12px 28px', borderRadius: '12px', cursor: 'pointer', fontWeight: 800, fontSize: '0.9rem', boxShadow: '0 4px 6px -1px rgba(99, 102, 241, 0.4)' }}
                            >
                                Change Type
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isQueryEditorOpen && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 7000, backdropFilter: 'blur(12px)' }}>
                    <div style={{ width: '700px', backgroundColor: 'white', borderRadius: '24px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', border: `1px solid ${TOKENS.border}`, overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
                        <div style={{ padding: '32px 32px 24px', borderBottom: `1px solid ${TOKENS.borderLight}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ fontWeight: 900, fontSize: '1.4rem', color: TOKENS.text, letterSpacing: '-0.02em' }}>{editingQuery?.id ? 'Edit Query' : 'Create New Query'}</div>
                            <button onClick={() => setIsQueryEditorOpen(false)} style={{ border: 'none', background: 'none', color: TOKENS.textMuted, cursor: 'pointer', padding: '8px', borderRadius: '12px' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f1f5f9'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}><X size={24} /></button>
                        </div>
                        <div style={{ padding: '32px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '32px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', color: TOKENS.text, marginBottom: '10px', fontWeight: 700 }}>Query Name</label>
                                    <input
                                        value={editingQuery?.name || ''}
                                        onChange={(e) => setEditingQuery(prev => ({ ...prev, name: e.target.value }))}
                                        placeholder="e.g. Recently Completed"
                                        style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: `1px solid ${TOKENS.border}`, fontSize: '1rem', outline: 'none' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', color: TOKENS.text, marginBottom: '10px', fontWeight: 700 }}>Limit Results</label>
                                    <input
                                        type="number"
                                        value={editingQuery?.limit || 1000}
                                        onChange={(e) => setEditingQuery(prev => ({ ...prev, limit: parseInt(e.target.value) }))}
                                        style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: `1px solid ${TOKENS.border}`, fontSize: '1rem', outline: 'none' }}
                                    />
                                </div>
                            </div>

                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                    <label style={{ fontSize: '0.9rem', color: TOKENS.text, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Filters</label>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                        <select
                                            value={editingQuery?.matchType || 'all'}
                                            onChange={(e) => setEditingQuery(prev => ({ ...prev, matchType: e.target.value }))}
                                            style={{ padding: '6px 12px', borderRadius: '8px', border: `1px solid ${TOKENS.border}`, fontSize: '0.8rem', fontWeight: 600, backgroundColor: '#f8fafc' }}
                                        >
                                            <option value="all">Match All (AND)</option>
                                            <option value="any">Match Any (OR)</option>
                                        </select>
                                        <button
                                            onClick={() => setEditingQuery(prev => ({ ...prev, filters: [...(prev.filters || []), { field: 'recordId', operator: 'equals', value: '' }] }))}
                                            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', backgroundColor: TOKENS.bg, border: 'none', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 700, color: TOKENS.primary, cursor: 'pointer' }}
                                        >
                                            <Plus size={16} /> Add Filter
                                        </button>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {(editingQuery?.filters || []).map((filter, idx) => (
                                        <div key={idx} style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '16px', backgroundColor: '#f8fafc', borderRadius: '16px', border: `1px solid ${TOKENS.border}` }}>
                                            <select
                                                value={filter.field}
                                                onChange={(e) => {
                                                    const newFilters = [...editingQuery.filters];
                                                    newFilters[idx].field = e.target.value;
                                                    setEditingQuery(prev => ({ ...prev, filters: newFilters }));
                                                }}
                                                style={{ flex: 1.2, padding: '10px', borderRadius: '8px', border: `1px solid ${TOKENS.border}`, fontSize: '0.9rem' }}
                                            >
                                                <option value="recordId">ID</option>
                                                {activeFields.map(f => <option key={f.name} value={f.name}>{f.name}</option>)}
                                            </select>
                                            <select
                                                value={filter.operator}
                                                onChange={(e) => {
                                                    const newFilters = [...editingQuery.filters];
                                                    newFilters[idx].operator = e.target.value;
                                                    setEditingQuery(prev => ({ ...prev, filters: newFilters }));
                                                }}
                                                style={{ flex: 1, padding: '10px', borderRadius: '8px', border: `1px solid ${TOKENS.border}`, fontSize: '0.9rem' }}
                                            >
                                                <option value="equals">equals</option>
                                                <option value="does_not_equal">not equal</option>
                                                <option value="contains">contains</option>
                                                <option value="does_not_contain">not contain</option>
                                                <option value="is_null">is empty</option>
                                                <option value="is_not_null">is not empty</option>
                                                <option value="greater_than_or_equal">≥</option>
                                                <option value="less_than_or_equal">≤</option>
                                                <option value="is_in">is in</option>
                                                <option value="is_after">is after</option>
                                                <option value="is_before">is before</option>
                                            </select>
                                            <input
                                                value={filter.value}
                                                onChange={(e) => {
                                                    const newFilters = [...editingQuery.filters];
                                                    newFilters[idx].value = e.target.value;
                                                    setEditingQuery(prev => ({ ...prev, filters: newFilters }));
                                                }}
                                                placeholder="Value..."
                                                style={{ flex: 1.5, padding: '10px', borderRadius: '8px', border: `1px solid ${TOKENS.border}`, fontSize: '0.9rem' }}
                                            />
                                            <button
                                                onClick={() => {
                                                    const newFilters = editingQuery.filters.filter((_, i) => i !== idx);
                                                    setEditingQuery(prev => ({ ...prev, filters: newFilters }));
                                                }}
                                                style={{ padding: '8px', background: 'none', border: 'none', color: '#f43f5e', cursor: 'pointer', borderRadius: '8px' }}
                                                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fff1f2'}
                                                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                                            ><Trash2 size={18} /></button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                    <label style={{ fontSize: '0.9rem', color: TOKENS.text, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sorting</label>
                                    <button
                                        onClick={() => setEditingQuery(prev => ({ ...prev, sort: [...(prev.sort || []), { field: 'recordId', direction: 'asc' }] }))}
                                        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', backgroundColor: TOKENS.bg, border: 'none', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 700, color: TOKENS.primary, cursor: 'pointer' }}
                                    >
                                        <Plus size={16} /> Add Sort
                                    </button>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {(editingQuery?.sort || []).map((s, idx) => (
                                        <div key={idx} style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '16px', backgroundColor: '#f8fafc', borderRadius: '16px', border: `1px solid ${TOKENS.border}` }}>
                                            <select
                                                value={s.field}
                                                onChange={(e) => {
                                                    const newSort = [...editingQuery.sort];
                                                    newSort[idx].field = e.target.value;
                                                    setEditingQuery(prev => ({ ...prev, sort: newSort }));
                                                }}
                                                style={{ flex: 1.5, padding: '10px', borderRadius: '8px', border: `1px solid ${TOKENS.border}`, fontSize: '0.9rem' }}
                                            >
                                                <option value="recordId">ID</option>
                                                {activeFields.map(f => <option key={f.name} value={f.name}>{f.name}</option>)}
                                            </select>
                                            <select
                                                value={s.direction}
                                                onChange={(e) => {
                                                    const newSort = [...editingQuery.sort];
                                                    newSort[idx].direction = e.target.value;
                                                    setEditingQuery(prev => ({ ...prev, sort: newSort }));
                                                }}
                                                style={{ flex: 1, padding: '10px', borderRadius: '8px', border: `1px solid ${TOKENS.border}`, fontSize: '0.9rem' }}
                                            >
                                                <option value="asc">Ascending</option>
                                                <option value="desc">Descending</option>
                                            </select>
                                            <button
                                                onClick={() => {
                                                    const newSort = editingQuery.sort.filter((_, i) => i !== idx);
                                                    setEditingQuery(prev => ({ ...prev, sort: newSort }));
                                                }}
                                                style={{ padding: '8px', background: 'none', border: 'none', color: '#f43f5e', cursor: 'pointer', borderRadius: '8px' }}
                                                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fff1f2'}
                                                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                                            ><Trash2 size={18} /></button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div style={{ padding: '24px 32px', borderTop: `1px solid ${TOKENS.borderLight}`, display: 'flex', justifyContent: 'flex-end', gap: '16px', backgroundColor: '#fafafa' }}>
                            <button onClick={() => setIsQueryEditorOpen(false)} style={{ border: `1px solid ${TOKENS.border}`, backgroundColor: 'white', color: TOKENS.text, padding: '12px 24px', borderRadius: '12px', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem' }}>Cancel</button>
                            <button
                                onClick={async () => {
                                    const updatedQueries = selectedTable.queries ? [...selectedTable.queries] : [];
                                    const index = updatedQueries.findIndex(q => q.id === editingQuery.id);
                                    if (index >= 0) updatedQueries[index] = editingQuery;
                                    else updatedQueries.push(editingQuery);

                                    await updateTable(selectedTableId, { queries: updatedQueries });
                                    await loadTables();
                                    setIsQueryEditorOpen(false);
                                }}
                                style={{ border: 'none', backgroundColor: TOKENS.primary, color: 'white', padding: '12px 28px', borderRadius: '12px', cursor: 'pointer', fontWeight: 800, fontSize: '0.9rem', boxShadow: '0 4px 6px -1px rgba(99, 102, 241, 0.4)' }}
                            >
                                Save Query
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isAggregationEditorOpen && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 7000, backdropFilter: 'blur(12px)' }}>
                    <div style={{ width: '500px', backgroundColor: 'white', borderRadius: '24px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', border: `1px solid ${TOKENS.border}`, overflow: 'hidden' }}>
                        <div style={{ padding: '32px 32px 24px', borderBottom: `1px solid ${TOKENS.borderLight}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ fontWeight: 900, fontSize: '1.4rem', color: TOKENS.text, letterSpacing: '-0.02em' }}>{editingAggregation?.id ? 'Edit Aggregation' : 'Create New Aggregation'}</div>
                            <button onClick={() => setIsAggregationEditorOpen(false)} style={{ border: 'none', background: 'none', color: TOKENS.textMuted, cursor: 'pointer', padding: '8px', borderRadius: '12px' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f1f5f9'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}><X size={24} /></button>
                        </div>
                        <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', color: TOKENS.text, marginBottom: '10px', fontWeight: 700 }}>Aggregation Name</label>
                                <input
                                    value={editingAggregation?.name || ''}
                                    onChange={(e) => setEditingAggregation(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="e.g. Total Revenue"
                                    style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: `1px solid ${TOKENS.border}`, fontSize: '1rem', outline: 'none' }}
                                />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', color: TOKENS.text, marginBottom: '10px', fontWeight: 700 }}>Calculation</label>
                                    <select
                                        value={editingAggregation?.calculation || 'sum'}
                                        onChange={(e) => setEditingAggregation(prev => ({ ...prev, calculation: e.target.value }))}
                                        style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: `1px solid ${TOKENS.border}`, fontSize: '1rem', backgroundColor: 'white' }}
                                    >
                                        <option value="sum">Sum</option>
                                        <option value="average">Average</option>
                                        <option value="count">Count</option>
                                        <option value="min">Min</option>
                                        <option value="max">Max</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', color: TOKENS.text, marginBottom: '10px', fontWeight: 700 }}>Target Field</label>
                                    <select
                                        value={editingAggregation?.field || ''}
                                        onChange={(e) => setEditingAggregation(prev => ({ ...prev, field: e.target.value }))}
                                        style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: `1px solid ${TOKENS.border}`, fontSize: '1rem', backgroundColor: 'white' }}
                                    >
                                        <option value="">Select a field...</option>
                                        <option value="recordId">ID</option>
                                        {activeFields.map(f => <option key={f.name} value={f.name}>{f.name}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div style={{ padding: '24px 32px', borderTop: `1px solid ${TOKENS.borderLight}`, display: 'flex', justifyContent: 'flex-end', gap: '16px', backgroundColor: '#fafafa' }}>
                            <button onClick={() => setIsAggregationEditorOpen(false)} style={{ border: `1px solid ${TOKENS.border}`, backgroundColor: 'white', color: TOKENS.text, padding: '12px 24px', borderRadius: '12px', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem' }}>Cancel</button>
                            <button
                                onClick={async () => {
                                    const updatedAggs = selectedTable.aggregations ? [...selectedTable.aggregations] : [];
                                    const index = updatedAggs.findIndex(a => a.id === editingAggregation.id);
                                    if (index >= 0) updatedAggs[index] = editingAggregation;
                                    else updatedAggs.push(editingAggregation);

                                    await updateTable(selectedTableId, { aggregations: updatedAggs });
                                    await loadTables();
                                    setIsAggregationEditorOpen(false);
                                }}
                                style={{ border: 'none', backgroundColor: TOKENS.primary, color: 'white', padding: '12px 28px', borderRadius: '12px', cursor: 'pointer', fontWeight: 800, fontSize: '0.9rem', boxShadow: '0 4px 6px -1px rgba(99, 102, 241, 0.4)' }}
                            >
                                Save Aggregation
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Global Field Menu (Fixed to avoid clipping) */}
            {activeMenuField && (
                <>
                    <div
                        style={{ position: 'fixed', inset: 0, zIndex: 10000 }}
                        onClick={() => setActiveMenuField(null)}
                    />
                    <div style={{
                        position: 'fixed',
                        top: `${activeMenuField.y + 8}px`,
                        left: `${activeMenuField.x}px`,
                        backgroundColor: TOKENS.surface,
                        boxShadow: TOKENS.shadowLg,
                        borderRadius: '10px',
                        padding: '8px',
                        zIndex: 10001,
                        minWidth: '180px',
                        border: `1px solid ${TOKENS.border}`,
                        animation: 'slideUp 0.15s ease-out'
                    }}>
                        {activeMenuField.name === 'ID' ? (
                            <div style={{ padding: '12px', fontSize: '0.8rem', color: TOKENS.textMuted, fontStyle: 'italic', lineHeight: '1.4' }}>
                                The ID field is managed by the system and cannot be edited.
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                <button
                                    onClick={() => {
                                        setEditingField(activeMenuField.name);
                                        setRenameFieldNewName(activeMenuField.name);
                                        setIsRenameFieldModalOpen(true);
                                        setActiveMenuField(null);
                                    }}
                                    style={{ width: '100%', textAlign: 'left', padding: '10px 12px', border: 'none', background: 'none', cursor: 'pointer', borderRadius: '6px', fontSize: '0.85rem', color: TOKENS.text, display: 'flex', alignItems: 'center', gap: '10px', transition: 'background-color 0.2s' }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = TOKENS.bg}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                >
                                    <Edit2 size={14} color={TOKENS.primary} /> Rename
                                </button>
                                <button
                                    onClick={() => {
                                        const field = selectedTable.fields.find(f => f.name === activeMenuField.name);
                                        setEditingField(activeMenuField.name);
                                        setNewType(field?.type || 'text');
                                        setIsTypeModalOpen(true);
                                        setActiveMenuField(null);
                                    }}
                                    style={{ width: '100%', textAlign: 'left', padding: '10px 12px', border: 'none', background: 'none', cursor: 'pointer', borderRadius: '6px', fontSize: '0.85rem', color: TOKENS.text, display: 'flex', alignItems: 'center', gap: '10px', transition: 'background-color 0.2s' }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = TOKENS.bg}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                >
                                    <Type size={14} color={TOKENS.primary} /> Change Type
                                </button>
                                <div style={{ height: '1px', backgroundColor: TOKENS.borderLight, margin: '6px 4px' }} />
                                <button
                                    onClick={() => {
                                        handleDeleteField(activeMenuField.name);
                                        setActiveMenuField(null);
                                    }}
                                    style={{ width: '100%', textAlign: 'left', padding: '10px 12px', border: 'none', background: 'none', cursor: 'pointer', borderRadius: '6px', fontSize: '0.85rem', color: '#dc2626', display: 'flex', alignItems: 'center', gap: '10px', transition: 'background-color 0.2s' }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fef2f2'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                >
                                    <Trash2 size={14} /> Delete Field
                                </button>
                            </div>
                        )}
                    </div>
                </>
            )}
            {/* Hidden CSV Input */}
            <input
                type="file"
                ref={csvInputRef}
                onChange={handleCsvFileImport}
                accept=".csv"
                style={{ display: 'none' }}
            />
        </div>
    );
};

export default TableManager;

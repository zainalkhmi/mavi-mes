/**
 * QueryStudio.jsx
 * Advanced Visual Query Builder & SQL Studio for MaviCore MES (Supabase / PostgreSQL)
 * Features:
 * - Real-time client & cloud SQL Execution Engine (SELECT, INSERT, UPDATE, DELETE, CREATE TABLE, ALTER, DROP)
 * - Interactive Result Grid with Direct In-Place CRUD (Inline Cell Editing, + Add Row modal, Delete Row action)
 * - DbGate-Style Visual JOIN Canvas with drag & drop column connectors
 * - Quick Sidebar Table Actions: ⚡ One-Click SELECT *, Expand Columns with Data Types, Insert Row
 * - Preset SQL Action Toolbar: [SELECT *], [INSERT], [UPDATE], [DELETE], [COUNT(*)], [JOIN]
 * - Tabbed Output Console: Result Grid, Live Execution Messages/Log, and Table Schema Metadata
 * - CSV & JSON Data Export
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Database, Play, Code, Save, Download, Copy, Trash2,
  RefreshCw, Plus, Check, AlertCircle, ChevronDown,
  ChevronRight, Table, BookOpen, Search, Sliders, Sun, Moon,
  X, RotateCcw, Edit2, Terminal, Info, Zap, CheckCircle2,
  XCircle, ArrowUpDown, FileSpreadsheet, Sparkles, Bot, Eye, EyeOff
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getTables,
  getTableRecords,
  addTableRecord,
  updateTableRecord,
  deleteTableRecord
} from '../utils/supabaseTablesDB.js';
import { executeSql } from '../utils/sqlExecutionEngine.js';
import { generateSqlFromPrompt } from '../utils/textToSqlService.js';
import { INDUSTRIAL_QUERY_TEMPLATES, INDUSTRIAL_QUERY_CATEGORIES } from '../utils/industrialQueryTemplates.js';

// 52-Topic SQL Cheat Sheet & Templates
const SQL_SNIPPETS = [
  {
    category: 'DbGate Visual JOINs',
    title: 'Visual Multi-Table JOIN',
    description: 'Query gabungan orders dan users yang dihasilkan dari canvas',
    sql: `SELECT \n  orders.id,\n  orders.created_at,\n  users.name,\n  users.email\nFROM orders\nJOIN users ON orders.user_id = users.id;`
  },
  {
    category: 'CRUD Dasar',
    title: 'SELECT All Columns',
    description: 'Ambil semua kolom dari tabel dengan limit',
    sql: `SELECT * \nFROM work_orders \nORDER BY created_at DESC \nLIMIT 20;`
  },
  {
    category: 'CRUD Dasar',
    title: 'INSERT New Work Order',
    description: 'Menambahkan baris data perintah kerja baru secara langsung',
    sql: `INSERT INTO work_orders (\n  order_number,\n  part_name,\n  part_number,\n  line_name,\n  target_quantity,\n  completed_quantity,\n  status,\n  due_date\n) VALUES (\n  'WO-2026-09-099',\n  'High Precision Shaft',\n  'PART-SHAFT-99',\n  'Machining Line 2',\n  800,\n  0,\n  'SCHEDULED',\n  '2026-09-15 17:00:00'\n);`
  },
  {
    category: 'CRUD Dasar',
    title: 'UPDATE Status by Order Number',
    description: 'Perbarui status dan jumlah selesai perintah kerja',
    sql: `UPDATE work_orders \nSET status = 'RUNNING', completed_quantity = 150 \nWHERE order_number = 'WO-2026-09-001';`
  },
  {
    category: 'CRUD Dasar',
    title: 'DELETE Completed Orders',
    description: 'Hapus data order yang sudah berstatus CANCELLED',
    sql: `DELETE FROM work_orders \nWHERE status = 'CANCELLED';`
  },
  {
    category: 'Multi-Table JOIN',
    title: 'Work Orders & Parts Master',
    description: 'Hubungkan tabel work_orders dengan data master parts',
    sql: `SELECT \n  wo.order_number,\n  p.part_number,\n  p.name AS part_name,\n  wo.target_quantity,\n  wo.completed_quantity\nFROM work_orders wo\nJOIN parts p ON wo.part_id = p.id\nLIMIT 50;`
  },
  {
    category: 'Agregasi & Analitik',
    title: 'Output per Operator',
    description: 'Total output produksi yang dihasilkan masing-masing operator',
    sql: `SELECT \n  u.name AS operator,\n  COUNT(pl.id) AS total_scans,\n  SUM(pl.good_quantity) AS total_good_qty\nFROM production_logs pl\nJOIN users u ON pl.operator_id = u.id\nGROUP BY u.name\nORDER BY total_good_qty DESC;`
  },
  {
    category: 'DDL & Manajemen Tabel',
    title: 'CREATE TABLE Baru',
    description: 'Membuat tabel baru langsung tanpa membuka Table Manager',
    sql: `CREATE TABLE inspection_logs (\n  inspector_name text,\n  part_number text,\n  defect_type text,\n  qty_defect number,\n  check_date datetime\n);`
  }
];

export default function QueryStudio() {
  // Theme state: 'light' (MaviCore clean) or 'dark' (DbGate authentic)
  const [theme, setTheme] = useState('light');
  
  // View mode: 'visual' (DbGate Canvas) or 'sql' (Code Editor)
  const [activeTab, setActiveTab] = useState('sql');

  // Console output mode: 'grid' (Result Grid), 'messages' (Execution Log), 'schema' (Table Info)
  const [activeConsoleTab, setActiveConsoleTab] = useState('grid');

  // Database Tables catalog (loaded strictly from Table Manager)
  const [tableSchemas, setTableSchemas] = useState({});
  const [loadingTables, setLoadingTables] = useState(true);
  const [searchTableQuery, setSearchTableQuery] = useState('');
  const [expandedSidebarTable, setExpandedSidebarTable] = useState(null);
  
  // Visual Canvas state
  const [canvasTables, setCanvasTables] = useState([]);
  const [joins, setJoins] = useState([]);
  const [connectingSource, setConnectingSource] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [draggingCard, setDraggingCard] = useState(null);

  // SQL query state
  const [generatedSql, setGeneratedSql] = useState('');
  const [customSql, setCustomSql] = useState('SELECT * FROM work_orders LIMIT 50;');
  const [isRunning, setIsRunning] = useState(false);
  const [queryResult, setQueryResult] = useState(null);
  const [executionStats, setExecutionStats] = useState(null);
  const [activeTableContext, setActiveTableContext] = useState({ name: 'work_orders', id: null });
  const [isSnippetsOpen, setIsSnippetsOpen] = useState(false);
  const [snippetCategory, setSnippetCategory] = useState('all');
  const [snippetSearch, setSnippetSearch] = useState('');

  // Execution Messages Log
  const [consoleMessages, setConsoleMessages] = useState([
    {
      time: new Date().toLocaleTimeString(),
      type: 'INFO',
      message: 'Query Studio siap. Jalankan SELECT, INSERT, UPDATE, DELETE, atau CREATE TABLE langsung di sini.',
      status: 'ready'
    }
  ]);

  // Inline Cell Editing State in Result Grid
  const [editingCell, setEditingCell] = useState(null); // { rowIndex, colName, value }
  const [savingEdit, setSavingEdit] = useState(false);

  // Quick Add Row Modal State
  const [isAddRowOpen, setIsAddRowOpen] = useState(false);
  const [newRowData, setNewRowData] = useState({});
  const [isAddingRow, setIsAddingRow] = useState(false);

  // Grid search filter & pagination
  const [gridFilter, setGridFilter] = useState('');
  const [pageSize, setPageSize] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);

  // AI Text-to-SQL Assistant State
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGeneratingSql, setIsGeneratingSql] = useState(false);
  const [aiGeneratedResult, setAiGeneratedResult] = useState(null);

  // Toggle internal system columns (id, tableId, recordId)
  const [showSystemColumns, setShowSystemColumns] = useState(false);

  // Canvas DOM container ref for coordinates
  const canvasRef = useRef(null);

  // Load custom tables from Table Manager (Supabase app_tables)
  const loadTableManagerTables = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoadingTables(true);
    try {
      const custom = await getTables();
      const schemas = {};

      if (Array.isArray(custom)) {
        await Promise.all(
          custom.map(async (t) => {
            let sampleRows = [];
            try {
              const recs = await getTableRecords(t.id);
              sampleRows = (recs || []).map(r => ({
                id: r.recordId || r.id,
                ...r
              }));
            } catch (e) {
              console.warn(`Could not load records for table ${t.name}:`, e);
            }

            const columns = (t.fields || []).map(f => ({
              name: f.name,
              type: f.type || 'text',
              isPk: f.name === 'id' || f.name === 'record_id',
              isFk: f.name.endsWith('_id') || f.type === 'linked_record',
              fkRef: f.link_table_id ? `${f.link_table_id}.id` : undefined
            }));

            if (columns.length === 0) {
              columns.push({ name: 'id', type: 'text', isPk: true, isFk: false });
            }

            schemas[t.name] = {
              id: t.id,
              name: t.name,
              label: t.name,
              category: t.description || 'Table Manager',
              columns,
              sampleRows
            };
          })
        );
      }

      setTableSchemas(schemas);

      // Auto-set active table context safely without triggering infinite loop
      const firstTableName = Object.keys(schemas)[0];
      if (firstTableName) {
        setActiveTableContext(prev => {
          if (!prev?.name || prev?.name === 'work_orders') {
            const found = schemas['work_orders'] || schemas[firstTableName];
            if (found) return { name: found.name, id: found.id };
          }
          return prev;
        });
      }
    } catch (e) {
      console.warn('Could not load tables from Table Manager into QueryStudio:', e);
      toast.error('Gagal memuat tabel dari Table Manager');
    } finally {
      setLoadingTables(false);
    }
  }, []);

  useEffect(() => {
    loadTableManagerTables();
  }, [loadTableManagerTables]);

  // Compute Real-time SQL query whenever canvasTables or joins change
  useEffect(() => {
    if (canvasTables.length === 0) {
      setGeneratedSql('-- Drag atau tambahkan tabel dari panel kiri ke canvas untuk membuat visual query');
      return;
    }

    const selectClauses = [];
    canvasTables.forEach(t => {
      const schema = tableSchemas[t.tableName];
      if (schema && t.selectedColumns && t.selectedColumns.length > 0) {
        t.selectedColumns.forEach(col => {
          selectClauses.push(`  ${t.tableName}.${col}`);
        });
      }
    });

    const selectStr = selectClauses.length > 0 ? selectClauses.join(',\n') : '  *';
    const primaryTable = canvasTables[0];
    let fromClause = `FROM ${primaryTable.tableName}`;

    const joinedTableIds = new Set([primaryTable.id]);
    const joinClauses = [];

    joins.forEach(j => {
      const srcT = canvasTables.find(t => t.id === j.sourceTableId);
      const tgtT = canvasTables.find(t => t.id === j.targetTableId);
      if (srcT && tgtT) {
        joinClauses.push(`${j.joinType || 'JOIN'} ${tgtT.tableName} ON ${srcT.tableName}.${j.sourceCol} = ${tgtT.tableName}.${j.targetCol}`);
        joinedTableIds.add(tgtT.id);
      }
    });

    canvasTables.forEach(t => {
      if (!joinedTableIds.has(t.id)) {
        joinClauses.push(`CROSS JOIN ${t.tableName}`);
      }
    });

    const joinsStr = joinClauses.length > 0 ? '\n' + joinClauses.join('\n') : '';
    const finalSql = `SELECT \n${selectStr}\n${fromClause}${joinsStr};`;
    setGeneratedSql(finalSql);
  }, [canvasTables, joins, tableSchemas]);

  // ─── SQL EXECUTION ENGINE HANDLER ──────────────────────────────────────────
  const handleExecuteQuery = async (overrideSql = null) => {
    const sqlToRun = typeof overrideSql === 'string' ? overrideSql : (activeTab === 'sql' ? customSql : generatedSql);

    if (!sqlToRun || !sqlToRun.trim() || sqlToRun.startsWith('--')) {
      toast.error('Ketik atau buat perintah SQL terlebih dahulu sebelum menjalankan query.');
      return;
    }

    setIsRunning(true);
    const startTime = performance.now();

    try {
      const result = await executeSql(sqlToRun, {
        tableSchemas,
        onTableCreated: () => loadTableManagerTables(),
        onDataMutated: () => loadTableManagerTables()
      });

      const elapsed = result.timeMs || Math.round(performance.now() - startTime);

      if (result.success) {
        setQueryResult(result.rows || []);
        setExecutionStats({
          count: result.affectedRows ?? (result.rows ? result.rows.length : 0),
          time: elapsed
        });

        if (result.targetTable) {
          const matchedSchema = tableSchemas[result.targetTable];
          setActiveTableContext({
            name: result.targetTable,
            id: result.targetTableId || matchedSchema?.id || null
          });
        }

        // Add to log
        setConsoleMessages(prev => [
          {
            time: new Date().toLocaleTimeString(),
            type: result.type,
            message: result.message,
            sql: sqlToRun,
            elapsed,
            status: 'success'
          },
          ...prev.slice(0, 49)
        ]);

        toast.success(result.message || `Query ${result.type} berhasil dieksekusi!`);

        // Switch tab
        if (result.type === 'SELECT' || (result.rows && result.rows.length > 0)) {
          setActiveConsoleTab('grid');
          setCurrentPage(1);
        } else {
          setActiveConsoleTab('messages');
        }
      } else {
        setConsoleMessages(prev => [
          {
            time: new Date().toLocaleTimeString(),
            type: result.type || 'ERROR',
            message: result.message,
            sql: sqlToRun,
            elapsed,
            status: 'error'
          },
          ...prev.slice(0, 49)
        ]);
        toast.error(result.message || 'Eksekusi query gagal');
        setActiveConsoleTab('messages');
      }
    } catch (err) {
      toast.error('Error saat menjalankan query: ' + err.message);
      setConsoleMessages(prev => [
        {
          time: new Date().toLocaleTimeString(),
          type: 'FATAL',
          message: err.message,
          sql: sqlToRun,
          elapsed: 0,
          status: 'error'
        },
        ...prev.slice(0, 49)
      ]);
      setActiveConsoleTab('messages');
    } finally {
      setIsRunning(false);
    }
  };

  // Quick 1-Click SELECT * for any table from left sidebar
  const handleQuickSelectTable = (tableName) => {
    const q = `SELECT * FROM ${tableName} LIMIT 50;`;
    setCustomSql(q);
    setActiveTab('sql');
    handleExecuteQuery(q);
    toast.success(`Menjalankan query cepat untuk tabel "${tableName}"`);
  };

  // Save inline cell edit directly to database
  const handleSaveInlineEdit = async (row, colName, newValue) => {
    const recordId = row.id || row.recordId;
    const targetTable = activeTableContext?.name || canvasTables[0]?.tableName || Object.keys(tableSchemas)[0];

    if (!recordId) {
      toast.error('Tidak dapat memperbarui: Primary key (id) tidak ditemukan pada baris ini.');
      setEditingCell(null);
      return;
    }

    setSavingEdit(true);
    try {
      const targetTableId = activeTableContext?.id || (tableSchemas[targetTable]?.id);

      if (targetTableId) {
        await updateTableRecord(recordId, { [colName]: newValue });
      } else {
        const valFormatted = typeof newValue === 'number' ? newValue : `'${String(newValue).replace(/'/g, "''")}'`;
        await executeSql(`UPDATE ${targetTable} SET ${colName} = ${valFormatted} WHERE id = '${recordId}';`);
      }

      setQueryResult(prev => prev.map(r => {
        if ((r.id || r.recordId) === recordId) {
          return { ...r, [colName]: newValue };
        }
        return r;
      }));

      toast.success(`Data kolom "${colName}" berhasil disimpan ke database.`);
      loadTableManagerTables();
    } catch (err) {
      toast.error('Gagal memperbarui sel: ' + err.message);
    } finally {
      setSavingEdit(false);
      setEditingCell(null);
    }
  };

  // Direct Row Deletion from Result Grid
  const handleDeleteRow = async (row) => {
    const recordId = row.id || row.recordId;
    const targetTable = activeTableContext?.name || canvasTables[0]?.tableName || Object.keys(tableSchemas)[0];

    if (!recordId) {
      toast.error('Tidak dapat menghapus baris tanpa identifier unik.');
      return;
    }

    if (!window.confirm(`Hapus baris data (ID: ${recordId}) ini secara permanen dari database?`)) {
      return;
    }

    try {
      const targetTableId = activeTableContext?.id || (tableSchemas[targetTable]?.id);
      if (targetTableId) {
        await deleteTableRecord(recordId);
      } else {
        await executeSql(`DELETE FROM ${targetTable} WHERE id = '${recordId}';`);
      }

      setQueryResult(prev => prev.filter(r => (r.id || r.recordId) !== recordId));
      toast.success('Baris data berhasil dihapus dari database.');
      loadTableManagerTables();
    } catch (err) {
      toast.error('Gagal menghapus data: ' + err.message);
    }
  };

  // Direct Row Addition into active table
  const handleInsertNewRow = async () => {
    const targetTable = activeTableContext?.name || canvasTables[0]?.tableName || Object.keys(tableSchemas)[0];
    if (!targetTable) {
      toast.error('Pilih atau jalankan query pada suatu tabel terlebih dahulu.');
      return;
    }

    setIsAddingRow(true);
    try {
      const targetTableId = activeTableContext?.id || (tableSchemas[targetTable]?.id);

      if (targetTableId) {
        await addTableRecord(targetTableId, newRowData);
      } else {
        const cols = Object.keys(newRowData);
        const vals = cols.map(c => {
          const v = newRowData[c];
          return typeof v === 'number' ? v : `'${String(v || '').replace(/'/g, "''")}'`;
        });
        const res = await executeSql(`INSERT INTO ${targetTable} (${cols.join(', ')}) VALUES (${vals.join(', ')});`);
        if (!res.success) throw new Error(res.message);
      }

      toast.success(`Data baru berhasil disimpan ke tabel "${targetTable}"!`);
      setIsAddRowOpen(false);
      setNewRowData({});
      loadTableManagerTables();

      // Refresh current query
      handleExecuteQuery();
    } catch (err) {
      toast.error('Gagal menambah baris: ' + err.message);
    } finally {
      setIsAddingRow(false);
    }
  };

  // Preset SQL Action Toolbar helper
  const handleInsertSqlPreset = (type) => {
    const activeTbl = activeTableContext?.name || canvasTables[0]?.tableName || (Object.keys(tableSchemas)[0] || 'work_orders');
    const schema = tableSchemas[activeTbl];
    const cols = schema ? schema.columns.map(c => c.name) : ['id', 'name', 'status'];

    let snippet = '';
    switch (type) {
      case 'SELECT':
        snippet = `SELECT *\nFROM ${activeTbl}\nLIMIT 50;`;
        break;
      case 'INSERT':
        const insertCols = cols.filter(c => c !== 'id' && c !== 'created_at').slice(0, 4);
        snippet = `INSERT INTO ${activeTbl} (\n  ${insertCols.join(',\n  ')}\n)\nVALUES (\n  ${insertCols.map((_, i) => `'Contoh ${i + 1}'`).join(',\n  ')}\n);`;
        break;
      case 'UPDATE':
        const editCol = cols.find(c => c !== 'id' && c !== 'created_at') || cols[1] || 'status';
        snippet = `UPDATE ${activeTbl}\nSET ${editCol} = 'UPDATED_VALUE'\nWHERE id = 'RECORD_ID';`;
        break;
      case 'DELETE':
        snippet = `DELETE FROM ${activeTbl}\nWHERE id = 'RECORD_ID';`;
        break;
      case 'COUNT':
        snippet = `SELECT COUNT(*) AS total_records\nFROM ${activeTbl};`;
        break;
      case 'JOIN':
        const otherTbl = Object.keys(tableSchemas).find(k => k !== activeTbl) || 'users';
        snippet = `SELECT \n  ${activeTbl}.*,\n  ${otherTbl}.*\nFROM ${activeTbl}\nLEFT JOIN ${otherTbl} ON ${activeTbl}.id = ${otherTbl}.${activeTbl}_id\nLIMIT 20;`;
        break;
      default:
        break;
    }

    if (snippet) {
      setCustomSql(snippet);
      setActiveTab('sql');
      toast.success(`Template ${type} dimuat ke editor`);
    }
  };

  // AI Text-to-SQL Generator Handler
  const handleGenerateAiSql = async (promptToUse = null) => {
    const p = promptToUse || aiPrompt;
    if (!p || !p.trim()) {
      toast.error('Masukkan pertanyaan atau instruksi query SQL');
      return;
    }

    setIsGeneratingSql(true);
    try {
      const res = await generateSqlFromPrompt(p, {
        tableSchemas,
        activeTable: activeTableContext?.name || 'work_orders'
      });
      setAiGeneratedResult(res);
      toast.success('Query berhasil dirancang oleh Mandor AI!');
    } catch (err) {
      toast.error('Gagal generate query: ' + err.message);
    } finally {
      setIsGeneratingSql(false);
    }
  };

  // Apply AI Generated SQL to Studio
  const handleApplyAiSql = (shouldRun = false) => {
    if (!aiGeneratedResult?.sql) return;
    setCustomSql(aiGeneratedResult.sql);
    setActiveTab('sql');
    setIsAiModalOpen(false);

    // Auto-add tables involved to canvas
    if (Array.isArray(aiGeneratedResult.tablesInvolved)) {
      aiGeneratedResult.tablesInvolved.forEach(tbl => {
        if (tableSchemas[tbl] && !canvasTables.some(t => t.tableName === tbl)) {
          handleAddTableToCanvas(tbl);
        }
      });
    }

    if (shouldRun) {
      handleExecuteQuery(aiGeneratedResult.sql);
    } else {
      toast.success('Query AI disalin ke SQL Editor');
    }
  };

  // Drag-and-drop / Add table to canvas
  const handleAddTableToCanvas = (tableName) => {
    if (!tableSchemas[tableName]) return;
    const newId = `table-${Date.now()}`;
    const schema = tableSchemas[tableName];
    
    const posX = 80 + (canvasTables.length % 3) * 360;
    const posY = 50 + Math.floor(canvasTables.length / 3) * 220;
    const initialCols = (schema.columns || []).slice(0, 4).map(c => c.name);

    setCanvasTables(prev => [
      ...prev,
      {
        id: newId,
        tableName,
        x: posX,
        y: posY,
        selectedColumns: initialCols
      }
    ]);
    toast.success(`Tabel "${tableName}" ditambahkan ke canvas`);
  };

  const handleRemoveTable = (tableId) => {
    setCanvasTables(prev => prev.filter(t => t.id !== tableId));
    setJoins(prev => prev.filter(j => j.sourceTableId !== tableId && j.targetTableId !== tableId));
    toast.success('Tabel dihapus dari visual canvas');
  };

  const handleToggleColumn = (tableId, colName) => {
    setCanvasTables(prev => prev.map(t => {
      if (t.id !== tableId) return t;
      const exists = t.selectedColumns.includes(colName);
      return {
        ...t,
        selectedColumns: exists 
          ? t.selectedColumns.filter(c => c !== colName)
          : [...t.selectedColumns, colName]
      };
    }));
  };

  const handleAutoArrange = () => {
    setCanvasTables(prev => prev.map((t, idx) => ({
      ...t,
      x: 60 + idx * 380,
      y: 60
    })));
    toast.success('Tabel berhasil ditata otomatis');
  };

  const handleClearCanvas = () => {
    setCanvasTables([]);
    setJoins([]);
    setQueryResult(null);
    toast.success('Canvas dibersihkan');
  };

  // Card dragging handlers
  const handleMouseDownCard = (e, tableId) => {
    if (e.target.closest('button') || e.target.closest('input') || e.target.closest('.port-handle')) {
      return;
    }
    const cardEl = e.currentTarget;
    const rect = cardEl.getBoundingClientRect();
    setDraggingCard({
      tableId,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top
    });
  };

  const handleMouseMoveCanvas = (e) => {
    if (!canvasRef.current) return;
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const currentX = e.clientX - canvasRect.left;
    const currentY = e.clientY - canvasRect.top;

    setMousePos({ x: currentX, y: currentY });

    if (draggingCard) {
      setCanvasTables(prev => prev.map(t => {
        if (t.id !== draggingCard.tableId) return t;
        const newX = Math.max(10, currentX - draggingCard.offsetX);
        const newY = Math.max(10, currentY - draggingCard.offsetY);
        return { ...t, x: newX, y: newY };
      }));
    }
  };

  const handleMouseUpCanvas = () => {
    setDraggingCard(null);
    if (connectingSource) setConnectingSource(null);
  };

  const handleStartConnect = (e, tableId, colName) => {
    e.stopPropagation();
    if (!canvasRef.current) return;
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const portRect = e.currentTarget.getBoundingClientRect();
    setConnectingSource({
      tableId,
      colName,
      x: portRect.right - canvasRect.left,
      y: portRect.top + portRect.height / 2 - canvasRect.top
    });
  };

  const handleEndConnect = (e, targetTableId, targetColName) => {
    e.stopPropagation();
    if (!connectingSource) return;

    if (connectingSource.tableId === targetTableId) {
      toast.error('Tidak bisa membuat JOIN ke tabel yang sama');
      setConnectingSource(null);
      return;
    }

    const exists = joins.some(j => 
      (j.sourceTableId === connectingSource.tableId && j.sourceCol === connectingSource.colName && j.targetTableId === targetTableId && j.targetCol === targetColName) ||
      (j.sourceTableId === targetTableId && j.sourceCol === targetColName && j.targetTableId === connectingSource.tableId && j.targetCol === connectingSource.colName)
    );

    if (exists) {
      toast('Relasi JOIN ini sudah ada', { icon: 'ℹ️' });
      setConnectingSource(null);
      return;
    }

    const newJoin = {
      id: `join-${Date.now()}`,
      sourceTableId: connectingSource.tableId,
      sourceCol: connectingSource.colName,
      targetTableId: targetTableId,
      targetCol: targetColName,
      joinType: 'JOIN'
    };

    setJoins(prev => [...prev, newJoin]);
    setConnectingSource(null);
    toast.success(`JOIN dibuat: ${connectingSource.colName} ──► ${targetColName}`);
  };

  const handleToggleJoinType = (joinId) => {
    setJoins(prev => prev.map(j => {
      if (j.id !== joinId) return j;
      const nextType = j.joinType === 'JOIN' ? 'LEFT JOIN' : j.joinType === 'LEFT JOIN' ? 'RIGHT JOIN' : 'JOIN';
      return { ...j, joinType: nextType };
    }));
  };

  const handleDeleteJoin = (joinId) => {
    setJoins(prev => prev.filter(j => j.id !== joinId));
    toast.success('Relasi JOIN dihapus');
  };

  // Export handlers
  const handleExportCSV = () => {
    if (!queryResult || queryResult.length === 0) {
      toast.error('Tidak ada data hasil query untuk diekspor');
      return;
    }
    const headers = Object.keys(queryResult[0]);
    const csvRows = [headers.join(',')];
    queryResult.forEach(row => {
      const vals = headers.map(h => `"${String(row[h] || '').replace(/"/g, '""')}"`);
      csvRows.push(vals.join(','));
    });
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `query_result_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('File CSV berhasil diunduh');
  };

  const handleExportJSON = () => {
    if (!queryResult || queryResult.length === 0) {
      toast.error('Tidak ada data untuk diekspor');
      return;
    }
    const blob = new Blob([JSON.stringify(queryResult, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `query_result_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('File JSON berhasil diunduh');
  };

  // Theme styling tokens
  const isDark = theme === 'dark';
  const themeStyles = {
    bg: isDark ? '#0f172a' : '#f8fafc',
    canvasBg: isDark ? '#1e293b' : '#ffffff',
    cardBg: isDark ? '#1e293b' : '#ffffff',
    cardBorder: isDark ? '#334155' : '#e2e8f0',
    cardHeaderBg: isDark ? '#0f172a' : '#f1f5f9',
    text: isDark ? '#f8fafc' : '#1e293b',
    subText: isDark ? '#94a3b8' : '#64748b',
    border: isDark ? '#334155' : '#e2e8f0',
    gridDot: isDark ? '#334155' : '#cbd5e1',
    lineColor: isDark ? '#38bdf8' : '#2563eb',
    activeBlue: '#2563eb'
  };

  // Filtered tables in sidebar
  const filteredTableKeys = useMemo(() => {
    return Object.keys(tableSchemas).filter(k => {
      const t = tableSchemas[k];
      return t.name.toLowerCase().includes(searchTableQuery.toLowerCase()) ||
             (t.label && t.label.toLowerCase().includes(searchTableQuery.toLowerCase()));
    });
  }, [tableSchemas, searchTableQuery]);

  // Combined SQL templates
  const allSnippets = useMemo(() => {
    return [
      ...INDUSTRIAL_QUERY_TEMPLATES.map(q => ({ ...q, isIndustrial: true })),
      ...SQL_SNIPPETS.map(s => ({ ...s, isIndustrial: false }))
    ];
  }, []);

  const filteredSnippets = useMemo(() => {
    return allSnippets.filter(snip => {
      const matchCat = snippetCategory === 'all' || snip.category === snippetCategory ||
        (snippetCategory === 'industrial' && snip.isIndustrial);
      const matchSearch = !snippetSearch ||
        snip.title.toLowerCase().includes(snippetSearch.toLowerCase()) ||
        snip.description.toLowerCase().includes(snippetSearch.toLowerCase()) ||
        snip.sql.toLowerCase().includes(snippetSearch.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [allSnippets, snippetCategory, snippetSearch]);

  // Filtered results in Grid
  const filteredGridRows = useMemo(() => {
    if (!queryResult || !Array.isArray(queryResult)) return [];
    if (!gridFilter.trim()) return queryResult;
    const term = gridFilter.toLowerCase();
    return queryResult.filter(row => {
      return Object.values(row).some(v => String(v ?? '').toLowerCase().includes(term));
    });
  }, [queryResult, gridFilter]);

  // Paginated Rows
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredGridRows.slice(start, start + pageSize);
  }, [filteredGridRows, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredGridRows.length / pageSize) || 1;

  // Active table schema columns
  const activeTableSchema = useMemo(() => {
    const name = activeTableContext?.name;
    return name ? tableSchemas[name] : null;
  }, [activeTableContext, tableSchemas]);

  // Clean visible columns (hides internal UUIDs by default)
  const displayColumns = useMemo(() => {
    if (!queryResult || queryResult.length === 0) return [];
    const allCols = Object.keys(queryResult[0]);
    if (showSystemColumns) return allCols;
    const filtered = allCols.filter(c => !['id', 'tableId', 'recordId', 'created_at'].includes(c));
    return filtered.length > 0 ? filtered : allCols;
  }, [queryResult, showSystemColumns]);

  // Status Badge & Clean Cell Renderer
  const renderCellContent = (col, val) => {
    const str = String(val ?? '');
    if (col.toLowerCase().includes('status')) {
      const u = str.toUpperCase();
      let badgeBg = isDark ? '#334155' : '#e2e8f0';
      let badgeColor = isDark ? '#f8fafc' : '#334155';
      if (['RUNNING', 'ACTIVE', 'IN_PROGRESS', 'OPEN'].includes(u)) {
        badgeBg = isDark ? '#1e3a8a' : '#dbeafe';
        badgeColor = isDark ? '#93c5fd' : '#1d4ed8';
      } else if (['COMPLETED', 'FINISHED', 'DONE', 'CLOSED', 'PASS'].includes(u)) {
        badgeBg = isDark ? '#14532d' : '#dcfce7';
        badgeColor = isDark ? '#86efac' : '#15803d';
      } else if (['CANCELLED', 'REJECTED', 'FAIL', 'STOPPED'].includes(u)) {
        badgeBg = isDark ? '#7f1d1d' : '#fee2e2';
        badgeColor = isDark ? '#fca5a5' : '#b91c1c';
      } else if (['SCHEDULED', 'PENDING', 'DRAFT', 'HOLD'].includes(u)) {
        badgeBg = isDark ? '#78350f' : '#fef3c7';
        badgeColor = isDark ? '#fde68a' : '#b45309';
      }
      return (
        <span style={{
          display: 'inline-block',
          padding: '2px 8px',
          borderRadius: '12px',
          backgroundColor: badgeBg,
          color: badgeColor,
          fontWeight: 700,
          fontSize: '0.68rem',
          letterSpacing: '0.02em'
        }}>
          {str}
        </span>
      );
    }
    return str || '-';
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      backgroundColor: themeStyles.bg,
      color: themeStyles.text,
      fontFamily: 'Inter, system-ui, sans-serif',
      overflow: 'hidden'
    }}>
      {/* 1. TOP HEADER & TOOLBAR */}
      <header style={{
        height: '56px',
        padding: '0 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: themeStyles.cardBg,
        borderBottom: `1px solid ${themeStyles.border}`,
        zIndex: 20
      }}>
        {/* Title & Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white'
          }}>
            <Database size={18} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>
                Query Studio & Visual Designer
              </h1>
              <span style={{
                fontSize: '0.68rem',
                fontWeight: 700,
                backgroundColor: isDark ? '#0369a1' : '#eff6ff',
                color: isDark ? '#e0f2fe' : '#2563eb',
                padding: '2px 8px',
                borderRadius: '12px',
                border: isDark ? '1px solid #0284c7' : '1px solid #bfdbfe'
              }}>
                Live CRUD Engine
              </span>
            </div>
            <p style={{ fontSize: '0.72rem', color: themeStyles.subText, margin: 0 }}>
              Eksekusi SELECT, INSERT, UPDATE, DELETE & Visual Designer Langsung ke Database
            </p>
          </div>
        </div>

        {/* View Mode Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            display: 'flex',
            backgroundColor: isDark ? '#0f172a' : '#f1f5f9',
            padding: '3px',
            borderRadius: '8px',
            border: `1px solid ${themeStyles.border}`
          }}>
            <button
              onClick={() => setActiveTab('sql')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 12px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: activeTab === 'sql' ? (isDark ? '#334155' : '#ffffff') : 'transparent',
                color: activeTab === 'sql' ? themeStyles.lineColor : themeStyles.subText,
                fontWeight: 600,
                fontSize: '0.76rem',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
            >
              <Code size={14} />
              SQL Code Editor
            </button>
            <button
              onClick={() => setActiveTab('visual')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 12px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: activeTab === 'visual' ? (isDark ? '#334155' : '#ffffff') : 'transparent',
                color: activeTab === 'visual' ? themeStyles.lineColor : themeStyles.subText,
                fontWeight: 600,
                fontSize: '0.76rem',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
            >
              <Sliders size={14} />
              Visual Designer
            </button>
          </div>

          {/* Mandor AI Text-to-SQL Button */}
          <button
            onClick={() => setIsAiModalOpen(true)}
            title="Tanya Mandor AI (Generate SQL dari Bahasa Indonesia)"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
              color: 'white',
              border: 'none',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(139, 92, 246, 0.35)',
              transition: 'all 0.15s'
            }}
          >
            <Sparkles size={14} fill="white" />
            <span>Mandor AI</span>
          </button>

          {/* Theme Toggle (Light / Dark) */}
          <button
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            title="Ganti Tema (Light MaviCore / Dark DbGate)"
            style={{
              padding: '6px 10px',
              borderRadius: '8px',
              border: `1px solid ${themeStyles.border}`,
              backgroundColor: themeStyles.cardBg,
              color: themeStyles.text,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.76rem',
              fontWeight: 600
            }}
          >
            {isDark ? <Sun size={14} color="#f59e0b" /> : <Moon size={14} color="#64748b" />}
            <span>{isDark ? 'Light UI' : 'Dark Mode'}</span>
          </button>

          {/* SQL Cheat Sheet Drawer Toggle */}
          <button
            onClick={() => setIsSnippetsOpen(!isSnippetsOpen)}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              border: `1px solid ${isSnippetsOpen ? themeStyles.lineColor : themeStyles.border}`,
              backgroundColor: isSnippetsOpen ? (isDark ? '#1e3a8a' : '#eff6ff') : themeStyles.cardBg,
              color: isSnippetsOpen ? themeStyles.lineColor : themeStyles.subText,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.76rem',
              fontWeight: 600
            }}
          >
            <BookOpen size={14} />
            <span>Templates</span>
          </button>

          {/* Execute / Run Query Button */}
          <button
            onClick={() => handleExecuteQuery()}
            disabled={isRunning}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 16px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              color: 'white',
              border: 'none',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: isRunning ? 'not-allowed' : 'pointer',
              boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)',
              opacity: isRunning ? 0.7 : 1
            }}
          >
            {isRunning ? <RefreshCw size={14} className="animate-spin" /> : <Play size={14} fill="white" />}
            <span>{isRunning ? 'Running...' : 'Run Query'}</span>
            <span style={{ fontSize: '0.68rem', opacity: 0.8, marginLeft: '2px' }}>Ctrl+↵</span>
          </button>
        </div>
      </header>

      {/* 2. MAIN WORKSPACE CONTAINER */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        
        {/* A. LEFT SIDEBAR: "CHOOSE DATA & TABLES" */}
        <div style={{
          width: '280px',
          borderRight: `1px solid ${themeStyles.border}`,
          backgroundColor: themeStyles.cardBg,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          {/* Search Header */}
          <div style={{ padding: '12px 14px', borderBottom: `1px solid ${themeStyles.border}` }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '8px'
            }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: themeStyles.subText, letterSpacing: '0.05em' }}>
                DATABASE TABLES
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.7rem', color: themeStyles.subText }}>
                  {filteredTableKeys.length} tabel
                </span>
                <button
                  onClick={() => loadTableManagerTables(false)}
                  title="Refresh Tabel dari Table Manager"
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: '2px',
                    cursor: 'pointer',
                    color: themeStyles.subText,
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <RefreshCw size={12} className={loadingTables ? 'animate-spin' : ''} />
                </button>
              </div>
            </div>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '9px', top: '9px', color: themeStyles.subText }} />
              <input
                type="text"
                value={searchTableQuery}
                onChange={(e) => setSearchTableQuery(e.target.value)}
                placeholder="Cari tabel atau kolom..."
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '6px 8px 6px 30px',
                  borderRadius: '6px',
                  border: `1px solid ${themeStyles.border}`,
                  backgroundColor: isDark ? '#0f172a' : '#f8fafc',
                  color: themeStyles.text,
                  fontSize: '0.76rem',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          {/* Table List with Quick Query Actions */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '10px 8px' }}>
            {loadingTables && Object.keys(tableSchemas).length === 0 ? (
              <div style={{ padding: '24px 16px', textAlign: 'center', color: themeStyles.subText, fontSize: '0.78rem' }}>
                <RefreshCw size={18} className="animate-spin" style={{ margin: '0 auto 8px', display: 'block' }} />
                Memuat katalog tabel...
              </div>
            ) : filteredTableKeys.length === 0 ? (
              <div style={{ padding: '24px 16px', textAlign: 'center', color: themeStyles.subText, fontSize: '0.78rem' }}>
                <Table size={24} style={{ margin: '0 auto 8px', display: 'block', opacity: 0.4 }} />
                <div style={{ fontWeight: 600 }}>Belum Ada Tabel</div>
                <div style={{ fontSize: '0.7rem', marginTop: '4px', opacity: 0.8 }}>
                  Tabel yang dibuat akan muncul di sini.
                </div>
              </div>
            ) : (
              filteredTableKeys.map(k => {
                const tbl = tableSchemas[k];
                const isInCanvas = canvasTables.some(t => t.tableName === tbl.name);
                const isExpanded = expandedSidebarTable === tbl.name;
                const isSelectedContext = activeTableContext?.name === tbl.name;

                return (
                  <div
                    key={tbl.name}
                    style={{
                      borderRadius: '8px',
                      marginBottom: '6px',
                      backgroundColor: isSelectedContext ? (isDark ? '#1e3a8a25' : '#eff6ff') : (isDark ? '#0f172a50' : '#f8fafc'),
                      border: `1px solid ${isSelectedContext ? themeStyles.lineColor : themeStyles.border}`,
                      overflow: 'hidden',
                      transition: 'all 0.15s'
                    }}
                  >
                    {/* Table Row Header */}
                    <div
                      style={{
                        padding: '8px 10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer'
                      }}
                      onClick={() => {
                        setActiveTableContext({ name: tbl.name, id: tbl.id });
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden', flex: 1 }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedSidebarTable(isExpanded ? null : tbl.name);
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            padding: '2px',
                            cursor: 'pointer',
                            color: themeStyles.subText,
                            display: 'flex'
                          }}
                        >
                          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </button>

                        <div style={{ overflow: 'hidden' }}>
                          <div style={{ fontSize: '0.78rem', fontWeight: 700, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                            {tbl.name}
                          </div>
                          <div style={{ fontSize: '0.67rem', color: themeStyles.subText }}>
                            {tbl.columns.length} kolom · {tbl.sampleRows?.length || 0} baris
                          </div>
                        </div>
                      </div>

                      {/* Action buttons: Quick SELECT * and Add to Canvas */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleQuickSelectTable(tbl.name);
                          }}
                          title={`⚡ Eksekusi cepat: SELECT * FROM ${tbl.name} LIMIT 50;`}
                          style={{
                            padding: '3px 6px',
                            borderRadius: '4px',
                            border: `1px solid ${themeStyles.border}`,
                            backgroundColor: isDark ? '#1e293b' : '#ffffff',
                            color: '#eab308',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '3px',
                            fontSize: '0.68rem',
                            fontWeight: 700
                          }}
                        >
                          <Zap size={11} fill="#eab308" />
                          <span>Run</span>
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddTableToCanvas(tbl.name);
                          }}
                          title="Tambahkan ke Visual Canvas"
                          style={{
                            border: 'none',
                            background: 'none',
                            color: isInCanvas ? themeStyles.lineColor : themeStyles.subText,
                            cursor: 'pointer',
                            padding: '3px'
                          }}
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Expandable Columns Details */}
                    {isExpanded && (
                      <div style={{
                        padding: '6px 12px 8px 24px',
                        borderTop: `1px solid ${themeStyles.border}`,
                        backgroundColor: isDark ? '#02061760' : '#ffffff',
                        fontSize: '0.72rem'
                      }}>
                        <div style={{ fontWeight: 600, color: themeStyles.subText, marginBottom: '4px' }}>
                          Struktur Kolom (Klik untuk menyalin ke editor):
                        </div>
                        {tbl.columns.map(col => (
                          <div
                            key={col.name}
                            onClick={() => {
                              setCustomSql(prev => prev + ` ${tbl.name}.${col.name}`);
                              toast.success(`"${tbl.name}.${col.name}" disisipkan ke editor`);
                            }}
                            style={{
                              padding: '2px 0',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              cursor: 'pointer',
                              color: col.isPk ? (isDark ? '#38bdf8' : '#0284c7') : themeStyles.text
                            }}
                          >
                            <span>{col.name}</span>
                            <span style={{ fontSize: '0.65rem', color: themeStyles.subText }}>{col.type}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Canvas Actions in Left Footer */}
          <div style={{ padding: '10px 14px', borderTop: `1px solid ${themeStyles.border}`, display: 'flex', gap: '8px' }}>
            <button
              onClick={handleAutoArrange}
              style={{
                flex: 1,
                padding: '6px 8px',
                borderRadius: '6px',
                border: `1px solid ${themeStyles.border}`,
                backgroundColor: isDark ? '#0f172a' : '#f8fafc',
                color: themeStyles.text,
                fontSize: '0.72rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px'
              }}
            >
              <RotateCcw size={12} />
              (Arranged)
            </button>
            <button
              onClick={handleClearCanvas}
              style={{
                padding: '6px 8px',
                borderRadius: '6px',
                border: `1px solid ${themeStyles.border}`,
                backgroundColor: isDark ? '#0f172a' : '#f8fafc',
                color: '#ef4444',
                fontSize: '0.72rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Trash2 size={12} />
              Clear
            </button>
          </div>
        </div>

        {/* B. CENTER WORKSPACE (EDITOR / CANVAS + RESULTS) */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          
          {/* TOP AREA: VISUAL CANVAS OR RAW SQL CODE EDITOR */}
          <div style={{
            flex: activeTab === 'sql' ? 0.45 : 0.55,
            minHeight: '260px',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            borderBottom: `1px solid ${themeStyles.border}`
          }}>
            
            {activeTab === 'visual' ? (
              /* INTERACTIVE DBGATE VISUAL CANVAS */
              <div
                ref={canvasRef}
                onMouseMove={handleMouseMoveCanvas}
                onMouseUp={handleMouseUpCanvas}
                style={{
                  flex: 1,
                  position: 'relative',
                  overflow: 'auto',
                  backgroundColor: themeStyles.canvasBg,
                  backgroundImage: `radial-gradient(${themeStyles.gridDot} 1px, transparent 1px)`,
                  backgroundSize: '20px 20px',
                  userSelect: 'none'
                }}
              >
                {/* SVG Overlay for JOIN Connector Lines */}
                <svg
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '3000px',
                    height: '2000px',
                    pointerEvents: 'none',
                    zIndex: 5
                  }}
                >
                  {joins.map(j => {
                    const srcT = canvasTables.find(t => t.id === j.sourceTableId);
                    const tgtT = canvasTables.find(t => t.id === j.targetTableId);
                    if (!srcT || !tgtT) return null;

                    const srcSchema = tableSchemas[srcT.tableName];
                    const tgtSchema = tableSchemas[tgtT.tableName];
                    if (!srcSchema || !tgtSchema) return null;

                    const srcColIdx = (srcSchema.columns || []).findIndex(c => c.name === j.sourceCol);
                    const tgtColIdx = (tgtSchema.columns || []).findIndex(c => c.name === j.targetCol);

                    const x1 = srcT.x + 280;
                    const y1 = srcT.y + 45 + (srcColIdx >= 0 ? srcColIdx : 0) * 28 + 14;
                    const x2 = tgtT.x;
                    const y2 = tgtT.y + 45 + (tgtColIdx >= 0 ? tgtColIdx : 0) * 28 + 14;

                    const midX = (x1 + x2) / 2;
                    const midY = (y1 + y2) / 2;
                    const pathD = `M ${x1} ${y1} C ${x1 + 80} ${y1}, ${x2 - 80} ${y2}, ${x2} ${y2}`;

                    return (
                      <g key={j.id}>
                        <path
                          d={pathD}
                          fill="none"
                          stroke={themeStyles.lineColor}
                          strokeWidth="3"
                          strokeOpacity={isDark ? "0.8" : "0.7"}
                        />
                        <foreignObject
                          x={midX - 35}
                          y={midY - 14}
                          width="70"
                          height="28"
                          style={{ pointerEvents: 'auto' }}
                        >
                          <div
                            onClick={() => handleToggleJoinType(j.id)}
                            title={`Tipe JOIN: ${j.joinType}. Klik untuk ganti.`}
                            style={{
                              backgroundColor: isDark ? '#0284c7' : '#2563eb',
                              color: 'white',
                              borderRadius: '12px',
                              fontSize: '0.65rem',
                              fontWeight: 700,
                              textAlign: 'center',
                              padding: '3px 6px',
                              cursor: 'pointer',
                              boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '4px'
                            }}
                          >
                            <span>{j.joinType}</span>
                            <span
                              onClick={(e) => { e.stopPropagation(); handleDeleteJoin(j.id); }}
                              style={{ opacity: 0.7, cursor: 'pointer', marginLeft: '2px' }}
                              title="Hapus Join"
                            >
                              ✕
                            </span>
                          </div>
                        </foreignObject>
                      </g>
                    );
                  })}

                  {connectingSource && (
                    <path
                      d={`M ${connectingSource.x} ${connectingSource.y} C ${connectingSource.x + 60} ${connectingSource.y}, ${mousePos.x - 60} ${mousePos.y}, ${mousePos.x} ${mousePos.y}`}
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="2.5"
                      strokeDasharray="4 4"
                    />
                  )}
                </svg>

                {canvasTables.length === 0 && (
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    textAlign: 'center',
                    color: themeStyles.subText
                  }}>
                    <Database size={40} style={{ opacity: 0.3, marginBottom: '10px' }} />
                    <h3 style={{ fontSize: '0.95rem', margin: '0 0 6px 0', fontWeight: 600 }}>Visual Designer Canvas Kosong</h3>
                    <p style={{ fontSize: '0.8rem', margin: '0 0 14px 0' }}>
                      Pilih tabel dari panel <strong>DATABASE TABLES</strong> di sebelah kiri untuk menambahkannya ke diagram
                    </p>
                  </div>
                )}

                {/* Render Draggable Table Cards */}
                {canvasTables.map((t, idx) => {
                  const schema = tableSchemas[t.tableName];
                  if (!schema) return null;

                  return (
                    <div
                      key={t.id}
                      onMouseDown={(e) => handleMouseDownCard(e, t.id)}
                      style={{
                        position: 'absolute',
                        left: `${t.x}px`,
                        top: `${t.y}px`,
                        width: '280px',
                        backgroundColor: themeStyles.cardBg,
                        border: `1px solid ${themeStyles.cardBorder}`,
                        borderRadius: '8px',
                        boxShadow: isDark ? '0 8px 24px rgba(0,0,0,0.45)' : '0 4px 16px rgba(0,0,0,0.08)',
                        zIndex: 10,
                        overflow: 'visible'
                      }}
                    >
                      <div style={{
                        padding: '8px 12px',
                        backgroundColor: themeStyles.cardHeaderBg,
                        borderBottom: `1px solid ${themeStyles.cardBorder}`,
                        borderTopLeftRadius: '8px',
                        borderTopRightRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'grab'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{
                            width: '18px',
                            height: '18px',
                            borderRadius: '50%',
                            backgroundColor: themeStyles.lineColor,
                            color: 'white',
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            {idx + 1}
                          </span>
                          <span style={{ fontSize: '0.82rem', fontWeight: 700 }}>
                            {schema.name}
                          </span>
                        </div>

                        <button
                          onClick={() => handleRemoveTable(t.id)}
                          title="Hapus tabel dari canvas"
                          style={{
                            border: 'none',
                            background: 'none',
                            color: themeStyles.subText,
                            cursor: 'pointer',
                            padding: '2px',
                            borderRadius: '4px'
                          }}
                        >
                          <X size={14} />
                        </button>
                      </div>

                      <div style={{ padding: '6px 0', maxHeight: '240px', overflowY: 'auto' }}>
                        {(schema.columns || []).map(col => {
                          const isSelected = t.selectedColumns.includes(col.name);
                          return (
                            <div
                              key={col.name}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '4px 12px',
                                height: '28px',
                                boxSizing: 'border-box',
                                backgroundColor: isSelected ? (isDark ? '#0284c71a' : '#f0f9ff') : 'transparent',
                                fontSize: '0.75rem',
                                position: 'relative'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => handleToggleColumn(t.id, col.name)}
                                  style={{ cursor: 'pointer', accentColor: themeStyles.lineColor }}
                                />
                                <span style={{
                                  fontWeight: col.isPk ? 700 : isSelected ? 600 : 400,
                                  color: col.isPk ? (isDark ? '#38bdf8' : '#0369a1') : themeStyles.text
                                }}>
                                  {col.name}
                                </span>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                {col.isPk && (
                                  <span style={{
                                    fontSize: '0.62rem',
                                    fontWeight: 700,
                                    backgroundColor: isDark ? '#0369a1' : '#e0f2fe',
                                    color: isDark ? '#e0f2fe' : '#0369a1',
                                    padding: '1px 4px',
                                    borderRadius: '3px'
                                  }}>
                                    PK
                                  </span>
                                )}

                                <div
                                  className="port-handle"
                                  title={`Tarik untuk menghubungkan JOIN (${col.name})`}
                                  onMouseDown={(e) => handleStartConnect(e, t.id, col.name)}
                                  onMouseUp={(e) => handleEndConnect(e, t.id, col.name)}
                                  style={{
                                    width: '12px',
                                    height: '12px',
                                    borderRadius: '50%',
                                    backgroundColor: connectingSource?.colName === col.name && connectingSource?.tableId === t.id ? '#f59e0b' : themeStyles.lineColor,
                                    border: `2px solid ${themeStyles.cardBg}`,
                                    cursor: 'crosshair',
                                    transform: 'translateX(6px)',
                                    boxShadow: '0 0 4px rgba(0,0,0,0.3)'
                                  }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* RAW SQL CODE EDITOR WITH PRESET TOOLBAR */
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: isDark ? '#0f172a' : '#1e293b' }}>
                {/* Preset SQL Action Toolbar */}
                <div style={{
                  padding: '6px 14px',
                  backgroundColor: isDark ? '#090d16' : '#0f172a',
                  borderBottom: '1px solid #334155',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px',
                  overflowX: 'auto'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ color: '#94a3b8', fontSize: '0.72rem', fontWeight: 600, marginRight: '4px' }}>
                      Snippet CRUD:
                    </span>
                    <button
                      onClick={() => handleInsertSqlPreset('SELECT')}
                      style={{
                        padding: '3px 8px',
                        borderRadius: '4px',
                        border: '1px solid #334155',
                        backgroundColor: isDark ? '#1e293b' : '#334155',
                        color: '#38bdf8',
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      SELECT *
                    </button>
                    <button
                      onClick={() => handleInsertSqlPreset('INSERT')}
                      style={{
                        padding: '3px 8px',
                        borderRadius: '4px',
                        border: '1px solid #334155',
                        backgroundColor: isDark ? '#1e293b' : '#334155',
                        color: '#4ade80',
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      + INSERT
                    </button>
                    <button
                      onClick={() => handleInsertSqlPreset('UPDATE')}
                      style={{
                        padding: '3px 8px',
                        borderRadius: '4px',
                        border: '1px solid #334155',
                        backgroundColor: isDark ? '#1e293b' : '#334155',
                        color: '#facc15',
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      UPDATE
                    </button>
                    <button
                      onClick={() => handleInsertSqlPreset('DELETE')}
                      style={{
                        padding: '3px 8px',
                        borderRadius: '4px',
                        border: '1px solid #334155',
                        backgroundColor: isDark ? '#1e293b' : '#334155',
                        color: '#f87171',
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      DELETE
                    </button>
                    <button
                      onClick={() => handleInsertSqlPreset('COUNT')}
                      style={{
                        padding: '3px 8px',
                        borderRadius: '4px',
                        border: '1px solid #334155',
                        backgroundColor: isDark ? '#1e293b' : '#334155',
                        color: '#c084fc',
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      COUNT(*)
                    </button>
                    <button
                      onClick={() => handleInsertSqlPreset('JOIN')}
                      style={{
                        padding: '3px 8px',
                        borderRadius: '4px',
                        border: '1px solid #334155',
                        backgroundColor: isDark ? '#1e293b' : '#334155',
                        color: '#38bdf8',
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      JOIN
                    </button>
                    <button
                      onClick={() => setIsAiModalOpen(true)}
                      style={{
                        padding: '3px 9px',
                        borderRadius: '4px',
                        border: '1px solid #8b5cf6',
                        backgroundColor: isDark ? '#2e1065' : '#f3e8ff',
                        color: isDark ? '#c084fc' : '#7c3aed',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Sparkles size={11} />
                      <span>Tanya AI</span>
                    </button>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8', fontSize: '0.72rem' }}>
                    <button
                      onClick={() => setCustomSql('')}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#94a3b8',
                        cursor: 'pointer',
                        fontSize: '0.7rem'
                      }}
                    >
                      Clear
                    </button>
                    <span>|</span>
                    <span>Tabel aktif: <strong style={{ color: '#38bdf8' }}>{activeTableContext?.name || 'work_orders'}</strong></span>
                  </div>
                </div>

                {/* SQL Textarea */}
                <textarea
                  value={customSql}
                  onChange={(e) => setCustomSql(e.target.value)}
                  onKeyDown={(e) => {
                    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                      e.preventDefault();
                      handleExecuteQuery();
                    }
                  }}
                  placeholder="Ketik query SQL di sini (SELECT, INSERT, UPDATE, DELETE, CREATE TABLE)..."
                  style={{
                    flex: 1,
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '12px 16px',
                    border: 'none',
                    outline: 'none',
                    backgroundColor: 'transparent',
                    color: '#38bdf8',
                    fontFamily: 'Consolas, Monaco, "Fira Code", monospace',
                    fontSize: '0.86rem',
                    lineHeight: 1.5,
                    resize: 'none'
                  }}
                />
              </div>
            )}

            {/* LIVE SQL PREVIEW STRIP */}
            <div style={{
              padding: '6px 16px',
              backgroundColor: isDark ? '#090d16' : '#0f172a',
              borderTop: `1px solid ${themeStyles.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontFamily: 'Consolas, Monaco, monospace',
              fontSize: '0.72rem',
              color: '#38bdf8'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                <span style={{ color: '#94a3b8', fontWeight: 600 }}>SQL Active:</span>
                <span style={{
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                  color: '#e2e8f0'
                }}>
                  {(activeTab === 'sql' ? customSql : generatedSql).replace(/\n/g, ' ')}
                </span>
              </div>
              
              <button
                onClick={() => {
                  navigator.clipboard.writeText(activeTab === 'sql' ? customSql : generatedSql);
                  toast.success('SQL disalin ke clipboard');
                }}
                title="Salin SQL"
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.7rem'
                }}
              >
                <Copy size={12} />
                Salin
              </button>
            </div>
          </div>

          {/* BOTTOM AREA: RESULTS CONSOLE (GRID, MESSAGES, SCHEMA) */}
          <div style={{
            flex: activeTab === 'sql' ? 0.55 : 0.45,
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: themeStyles.cardBg,
            overflow: 'hidden'
          }}>
            {/* Results Console Header Tabs */}
            <div style={{
              padding: '6px 16px',
              borderBottom: `1px solid ${themeStyles.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: isDark ? '#0f172a' : '#f8fafc'
            }}>
              {/* Tab Switcher */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  onClick={() => setActiveConsoleTab('grid')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: activeConsoleTab === 'grid' ? (isDark ? '#334155' : '#ffffff') : 'transparent',
                    color: activeConsoleTab === 'grid' ? themeStyles.lineColor : themeStyles.subText,
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: activeConsoleTab === 'grid' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                  }}
                >
                  <Table size={13} />
                  <span>Result Grid</span>
                  {queryResult && (
                    <span style={{ fontSize: '0.65rem', opacity: 0.8, backgroundColor: isDark ? '#1e293b' : '#e2e8f0', padding: '1px 5px', borderRadius: '10px' }}>
                      {queryResult.length}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setActiveConsoleTab('messages')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: activeConsoleTab === 'messages' ? (isDark ? '#334155' : '#ffffff') : 'transparent',
                    color: activeConsoleTab === 'messages' ? themeStyles.lineColor : themeStyles.subText,
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: activeConsoleTab === 'messages' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                  }}
                >
                  <Terminal size={13} />
                  <span>Execution Log</span>
                </button>

                <button
                  onClick={() => setActiveConsoleTab('schema')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: activeConsoleTab === 'schema' ? (isDark ? '#334155' : '#ffffff') : 'transparent',
                    color: activeConsoleTab === 'schema' ? themeStyles.lineColor : themeStyles.subText,
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: activeConsoleTab === 'schema' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                  }}
                >
                  <Info size={13} />
                  <span>Table Schema</span>
                </button>
              </div>

              {/* Action Toolbar on the Right */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {executionStats && (
                  <span style={{ fontSize: '0.7rem', color: themeStyles.subText }}>
                    {executionStats.count} baris · {executionStats.time} ms
                  </span>
                )}

                {/* Filter Results Input */}
                {activeConsoleTab === 'grid' && queryResult && queryResult.length > 0 && (
                  <div style={{ position: 'relative' }}>
                    <Search size={12} style={{ position: 'absolute', left: '7px', top: '7px', color: themeStyles.subText }} />
                    <input
                      type="text"
                      value={gridFilter}
                      onChange={(e) => {
                        setGridFilter(e.target.value);
                        setCurrentPage(1);
                      }}
                      placeholder="Filter data..."
                      style={{
                        padding: '4px 8px 4px 24px',
                        borderRadius: '6px',
                        border: `1px solid ${themeStyles.border}`,
                        backgroundColor: isDark ? '#1e293b' : '#ffffff',
                        color: themeStyles.text,
                        fontSize: '0.72rem',
                        outline: 'none',
                        width: '120px'
                      }}
                    />
                  </div>
                )}

                {/* + Add Row Action Button (No need to open table menu!) */}
                <button
                  onClick={() => {
                    const defaultFields = {};
                    if (activeTableSchema?.columns) {
                      activeTableSchema.columns.forEach(c => {
                        if (c.name !== 'id' && c.name !== 'created_at') defaultFields[c.name] = '';
                      });
                    }
                    setNewRowData(defaultFields);
                    setIsAddRowOpen(true);
                  }}
                  title="Tambah baris data baru langsung ke tabel database"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: '#16a34a',
                    color: 'white',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  <Plus size={13} />
                  <span>+ Add Row</span>
                </button>

                {/* Toggle System Columns Button */}
                <button
                  onClick={() => setShowSystemColumns(!showSystemColumns)}
                  title={showSystemColumns ? 'Sembunyikan kolom ID sistem (tableId, recordId)' : 'Tampilkan semua kolom termasuk ID sistem'}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    border: `1px solid ${themeStyles.border}`,
                    backgroundColor: showSystemColumns ? (isDark ? '#334155' : '#e2e8f0') : (isDark ? '#1e293b' : '#ffffff'),
                    color: themeStyles.text,
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  {showSystemColumns ? <EyeOff size={12} /> : <Eye size={12} />}
                  <span>{showSystemColumns ? 'Kolom Bersih' : 'Semua Kolom'}</span>
                </button>

                {/* Export Buttons */}
                <button
                  onClick={handleExportCSV}
                  disabled={!queryResult || queryResult.length === 0}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    border: `1px solid ${themeStyles.border}`,
                    backgroundColor: isDark ? '#1e293b' : '#ffffff',
                    color: themeStyles.text,
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    cursor: (!queryResult || queryResult.length === 0) ? 'not-allowed' : 'pointer',
                    opacity: (!queryResult || queryResult.length === 0) ? 0.5 : 1
                  }}
                >
                  <Download size={12} />
                  CSV
                </button>

                <button
                  onClick={handleExportJSON}
                  disabled={!queryResult || queryResult.length === 0}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    border: `1px solid ${themeStyles.border}`,
                    backgroundColor: isDark ? '#1e293b' : '#ffffff',
                    color: themeStyles.text,
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    cursor: (!queryResult || queryResult.length === 0) ? 'not-allowed' : 'pointer',
                    opacity: (!queryResult || queryResult.length === 0) ? 0.5 : 1
                  }}
                >
                  JSON
                </button>
              </div>
            </div>

            {/* Content Switcher */}
            <div style={{ flex: 1, overflow: 'auto', position: 'relative' }}>
              
              {/* TAB 1: RESULT DATA GRID */}
              {activeConsoleTab === 'grid' && (
                <>
                  {queryResult && queryResult.length > 0 ? (
                    <table style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      fontSize: '0.76rem',
                      textAlign: 'left'
                    }}>
                      <thead style={{ position: 'sticky', top: 0, zIndex: 5 }}>
                        <tr style={{
                          backgroundColor: isDark ? '#0f172a' : '#f1f5f9',
                          borderBottom: `1px solid ${themeStyles.border}`,
                          color: themeStyles.subText
                        }}>
                          <th style={{ padding: '6px 10px', width: '36px', textAlign: 'center' }}>#</th>
                          {displayColumns.map(col => (
                            <th key={col} style={{ padding: '6px 12px', fontWeight: 600 }}>
                              {col}
                            </th>
                          ))}
                          <th style={{ padding: '6px 10px', width: '60px', textAlign: 'center' }}>Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedRows.map((row, rIdx) => {
                          const globalIdx = (currentPage - 1) * pageSize + rIdx;
                          return (
                            <tr
                              key={globalIdx}
                              style={{
                                borderBottom: `1px solid ${themeStyles.border}`,
                                backgroundColor: rIdx % 2 === 0 ? 'transparent' : (isDark ? '#0f172a40' : '#f8fafc')
                              }}
                            >
                              <td style={{ padding: '6px 10px', color: themeStyles.subText, textAlign: 'center' }}>
                                {globalIdx + 1}
                              </td>

                              {displayColumns.map(col => {
                                const isEditing = editingCell?.rowIndex === globalIdx && editingCell?.colName === col;
                                const cellValue = row[col];

                                return (
                                  <td
                                    key={col}
                                    onDoubleClick={() => {
                                      if (col !== 'id' && col !== 'created_at') {
                                        setEditingCell({ rowIndex: globalIdx, colName: col, value: cellValue ?? '' });
                                      }
                                    }}
                                    style={{
                                      padding: '4px 10px',
                                      color: themeStyles.text,
                                      cursor: (col !== 'id' && col !== 'created_at') ? 'pointer' : 'default',
                                      position: 'relative'
                                    }}
                                  >
                                    {isEditing ? (
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <input
                                          autoFocus
                                          type="text"
                                          value={editingCell.value}
                                          onChange={(e) => setEditingCell({ ...editingCell, value: e.target.value })}
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleSaveInlineEdit(row, col, editingCell.value);
                                            else if (e.key === 'Escape') setEditingCell(null);
                                          }}
                                          style={{
                                            padding: '2px 6px',
                                            borderRadius: '4px',
                                            border: `1px solid ${themeStyles.lineColor}`,
                                            backgroundColor: isDark ? '#0f172a' : '#ffffff',
                                            color: themeStyles.text,
                                            fontSize: '0.74rem',
                                            outline: 'none',
                                            width: '100%'
                                          }}
                                        />
                                        <button
                                          onClick={() => handleSaveInlineEdit(row, col, editingCell.value)}
                                          disabled={savingEdit}
                                          style={{ border: 'none', background: 'none', color: '#16a34a', cursor: 'pointer', padding: '1px' }}
                                        >
                                          <Check size={14} />
                                        </button>
                                        <button
                                          onClick={() => setEditingCell(null)}
                                          style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer', padding: '1px' }}
                                        >
                                          <X size={14} />
                                        </button>
                                      </div>
                                    ) : (
                                      <span title="Klik ganda untuk mengedit langsung">{renderCellContent(col, cellValue)}</span>
                                    )}
                                  </td>
                                );
                              })}

                              {/* Row Actions */}
                              <td style={{ padding: '4px 10px', textAlign: 'center' }}>
                                <button
                                  onClick={() => handleDeleteRow(row)}
                                  title="Hapus baris ini dari database"
                                  style={{
                                    border: 'none',
                                    background: 'none',
                                    color: '#ef4444',
                                    cursor: 'pointer',
                                    padding: '2px'
                                  }}
                                >
                                  <Trash2 size={13} />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  ) : (
                    <div style={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: themeStyles.subText,
                      fontSize: '0.8rem',
                      gap: '10px',
                      padding: '20px'
                    }}>
                      <Database size={28} style={{ opacity: 0.3 }} />
                      <span>Belum ada hasil query. Tulis query SQL di atas atau klik <strong>Run Query</strong>.</span>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => handleQuickSelectTable('work_orders')}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '6px',
                            border: `1px solid ${themeStyles.lineColor}`,
                            backgroundColor: isDark ? '#1e3a8a33' : '#eff6ff',
                            color: themeStyles.lineColor,
                            fontSize: '0.74rem',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          ⚡ Run SELECT * FROM work_orders
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* TAB 2: EXECUTION LOG & MESSAGES */}
              {activeConsoleTab === 'messages' && (
                <div style={{ padding: '14px', fontFamily: 'Consolas, Monaco, monospace', fontSize: '0.74rem' }}>
                  {consoleMessages.map((msg, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '6px',
                        marginBottom: '6px',
                        backgroundColor: msg.status === 'error' ? (isDark ? '#7f1d1d25' : '#fef2f2') : (isDark ? '#0f172a' : '#f8fafc'),
                        borderLeft: `3px solid ${msg.status === 'error' ? '#ef4444' : msg.status === 'success' ? '#22c55e' : '#3b82f6'}`
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                        <span style={{ color: themeStyles.subText, fontSize: '0.68rem' }}>[{msg.time}]</span>
                        <span style={{
                          fontWeight: 700,
                          color: msg.status === 'error' ? '#ef4444' : msg.status === 'success' ? '#22c55e' : '#3b82f6'
                        }}>
                          {msg.type}
                        </span>
                        {msg.elapsed !== undefined && (
                          <span style={{ color: themeStyles.subText, fontSize: '0.68rem' }}>({msg.elapsed} ms)</span>
                        )}
                      </div>
                      <div style={{ color: msg.status === 'error' ? '#f87171' : themeStyles.text }}>
                        {msg.message}
                      </div>
                      {msg.sql && (
                        <div style={{ marginTop: '4px', color: '#94a3b8', fontSize: '0.68rem' }}>
                          SQL: {msg.sql.replace(/\n/g, ' ')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* TAB 3: TABLE SCHEMA METADATA */}
              {activeConsoleTab === 'schema' && (
                <div style={{ padding: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <h3 style={{ fontSize: '0.85rem', fontWeight: 700, margin: 0 }}>
                      Struktur Tabel: {activeTableContext?.name || 'Belum dipilih'}
                    </h3>
                    <span style={{ fontSize: '0.72rem', color: themeStyles.subText }}>
                      {activeTableSchema?.columns?.length || 0} Kolom terdefinisi
                    </span>
                  </div>

                  {activeTableSchema ? (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                      <thead>
                        <tr style={{ backgroundColor: isDark ? '#0f172a' : '#f1f5f9', textAlign: 'left', borderBottom: `1px solid ${themeStyles.border}` }}>
                          <th style={{ padding: '6px 10px' }}>#</th>
                          <th style={{ padding: '6px 10px' }}>Nama Kolom</th>
                          <th style={{ padding: '6px 10px' }}>Tipe Data</th>
                          <th style={{ padding: '6px 10px' }}>Primary Key</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(activeTableSchema.columns || []).map((c, i) => (
                          <tr key={c.name} style={{ borderBottom: `1px solid ${themeStyles.border}` }}>
                            <td style={{ padding: '6px 10px', color: themeStyles.subText }}>{i + 1}</td>
                            <td style={{ padding: '6px 10px', fontWeight: 600 }}>{c.name}</td>
                            <td style={{ padding: '6px 10px', color: themeStyles.subText }}>{c.type}</td>
                            <td style={{ padding: '6px 10px' }}>{c.isPk ? '✅ YES' : '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div style={{ color: themeStyles.subText, fontSize: '0.78rem' }}>
                      Pilih tabel dari daftar di panel kiri untuk melihat skema.
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* Pagination Controls */}
            {activeConsoleTab === 'grid' && filteredGridRows.length > pageSize && (
              <div style={{
                padding: '6px 16px',
                borderTop: `1px solid ${themeStyles.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.72rem',
                color: themeStyles.subText
              }}>
                <span>
                  Halaman {currentPage} dari {totalPages} ({filteredGridRows.length} total baris)
                </span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    style={{
                      padding: '3px 8px',
                      borderRadius: '4px',
                      border: `1px solid ${themeStyles.border}`,
                      backgroundColor: themeStyles.cardBg,
                      color: themeStyles.text,
                      cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
                    }}
                  >
                    Prev
                  </button>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    style={{
                      padding: '3px 8px',
                      borderRadius: '4px',
                      border: `1px solid ${themeStyles.border}`,
                      backgroundColor: themeStyles.cardBg,
                      color: themeStyles.text,
                      cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
                    }}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* C. RIGHT DRAWER: SQL CHEAT SHEET & TEMPLATES */}
        {isSnippetsOpen && (
          <div style={{
            width: '360px',
            borderLeft: `1px solid ${themeStyles.border}`,
            backgroundColor: themeStyles.cardBg,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '12px 16px',
              borderBottom: `1px solid ${themeStyles.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BookOpen size={16} color={themeStyles.lineColor} />
                <span style={{ fontSize: '0.82rem', fontWeight: 700 }}>Template Query & CRUD</span>
              </div>
              <button
                onClick={() => setIsSnippetsOpen(false)}
                style={{ border: 'none', background: 'none', color: themeStyles.subText, cursor: 'pointer' }}
              >
                <X size={15} />
              </button>
            </div>

            <div style={{ padding: '10px 12px', borderBottom: `1px solid ${themeStyles.border}`, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ position: 'relative' }}>
                <Search size={13} style={{ position: 'absolute', left: '8px', top: '8px', color: themeStyles.subText }} />
                <input
                  type="text"
                  value={snippetSearch}
                  onChange={(e) => setSnippetSearch(e.target.value)}
                  placeholder="Cari template query..."
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '5px 8px 5px 28px',
                    borderRadius: '6px',
                    border: `1px solid ${themeStyles.border}`,
                    backgroundColor: isDark ? '#0f172a' : '#f8fafc',
                    color: themeStyles.text,
                    fontSize: '0.74rem',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '4px', overflowX: 'auto', paddingBottom: '2px' }}>
                {INDUSTRIAL_QUERY_CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSnippetCategory(cat.id)}
                    style={{
                      padding: '3px 8px',
                      borderRadius: '12px',
                      border: `1px solid ${snippetCategory === cat.id ? themeStyles.lineColor : themeStyles.border}`,
                      backgroundColor: snippetCategory === cat.id ? (isDark ? '#1e3a8a' : '#eff6ff') : 'transparent',
                      color: snippetCategory === cat.id ? themeStyles.lineColor : themeStyles.subText,
                      fontSize: '0.68rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
              {filteredSnippets.map((snip, sIdx) => (
                <div
                  key={sIdx}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    backgroundColor: isDark ? '#0f172a' : '#f8fafc',
                    border: `1px solid ${snip.isIndustrial ? (isDark ? '#0284c7' : '#bfdbfe') : themeStyles.border}`,
                    marginBottom: '10px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '6px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: themeStyles.lineColor, lineHeight: 1.3 }}>
                      {snip.title}
                    </span>
                    <span style={{
                      fontSize: '0.62rem',
                      color: themeStyles.subText,
                      backgroundColor: isDark ? '#1e293b' : '#e2e8f0',
                      padding: '1px 5px',
                      borderRadius: '4px',
                      flexShrink: 0
                    }}>
                      {snip.categoryLabel || snip.category}
                    </span>
                  </div>

                  <p style={{ fontSize: '0.72rem', color: themeStyles.subText, margin: '0 0 8px 0', lineHeight: 1.35 }}>
                    {snip.description}
                  </p>

                  <pre style={{
                    backgroundColor: isDark ? '#020617' : '#1e293b',
                    color: '#38bdf8',
                    padding: '8px',
                    borderRadius: '6px',
                    fontSize: '0.68rem',
                    overflowX: 'auto',
                    margin: '0 0 8px 0',
                    lineHeight: 1.4
                  }}>
                    {snip.sql}
                  </pre>

                  <button
                    onClick={() => {
                      setCustomSql(snip.sql);
                      setActiveTab('sql');
                      toast.success(`Query "${snip.title}" dimuat ke SQL Editor`);
                    }}
                    style={{
                      width: '100%',
                      padding: '6px',
                      borderRadius: '6px',
                      border: `1px solid ${themeStyles.lineColor}`,
                      backgroundColor: isDark ? '#1e3a8a33' : '#eff6ff',
                      color: themeStyles.lineColor,
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <Play size={12} />
                    Pakai Query Template
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* MODAL: DIRECT INSERT NEW ROW (NO NEED TO OPEN TABLE MANAGER) */}
      {isAddRowOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(2px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            width: '460px',
            maxHeight: '85vh',
            backgroundColor: themeStyles.cardBg,
            border: `1px solid ${themeStyles.cardBorder}`,
            borderRadius: '12px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '14px 18px',
              borderBottom: `1px solid ${themeStyles.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: themeStyles.cardHeaderBg
            }}>
              <div>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 700, margin: 0 }}>
                  Tambah Baris Baru ke Database
                </h3>
                <span style={{ fontSize: '0.72rem', color: themeStyles.subText }}>
                  Tabel Target: <strong>{activeTableContext?.name || 'work_orders'}</strong>
                </span>
              </div>
              <button
                onClick={() => setIsAddRowOpen(false)}
                style={{ border: 'none', background: 'none', color: themeStyles.subText, cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Form */}
            <div style={{ padding: '16px', overflowY: 'auto', flex: 1 }}>
              {activeTableSchema?.columns && activeTableSchema.columns.length > 0 ? (
                activeTableSchema.columns
                  .filter(c => c.name !== 'id' && c.name !== 'created_at')
                  .map(col => (
                    <div key={col.name} style={{ marginBottom: '12px' }}>
                      <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, marginBottom: '4px' }}>
                        {col.name} <span style={{ color: themeStyles.subText, fontWeight: 400 }}>({col.type})</span>
                      </label>
                      <input
                        type={col.type === 'number' ? 'number' : 'text'}
                        value={newRowData[col.name] ?? ''}
                        onChange={(e) => setNewRowData({ ...newRowData, [col.name]: col.type === 'number' ? Number(e.target.value) : e.target.value })}
                        placeholder={`Isi nilai untuk ${col.name}...`}
                        style={{
                          width: '100%',
                          boxSizing: 'border-box',
                          padding: '7px 10px',
                          borderRadius: '6px',
                          border: `1px solid ${themeStyles.border}`,
                          backgroundColor: isDark ? '#0f172a' : '#ffffff',
                          color: themeStyles.text,
                          fontSize: '0.78rem',
                          outline: 'none'
                        }}
                      />
                    </div>
                  ))
              ) : (
                /* Fallback simple fields */
                <div>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, marginBottom: '4px' }}>Nama Field 1</label>
                    <input
                      type="text"
                      onChange={(e) => setNewRowData({ ...newRowData, name: e.target.value })}
                      placeholder="Nilai..."
                      style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: `1px solid ${themeStyles.border}`, backgroundColor: isDark ? '#0f172a' : '#ffffff', color: themeStyles.text }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '12px 18px',
              borderTop: `1px solid ${themeStyles.border}`,
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '8px',
              backgroundColor: themeStyles.cardHeaderBg
            }}>
              <button
                onClick={() => setIsAddRowOpen(false)}
                style={{
                  padding: '7px 14px',
                  borderRadius: '6px',
                  border: `1px solid ${themeStyles.border}`,
                  backgroundColor: 'transparent',
                  color: themeStyles.text,
                  fontSize: '0.76rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Batal
              </button>
              <button
                onClick={handleInsertNewRow}
                disabled={isAddingRow}
                style={{
                  padding: '7px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: '#16a34a',
                  color: 'white',
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  cursor: isAddingRow ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                {isAddingRow ? <RefreshCw size={13} className="animate-spin" /> : <Save size={13} />}
                <span>{isAddingRow ? 'Menyimpan...' : 'Simpan Baris ke DB'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: MANDOR AI TEXT-TO-SQL COPILOT */}
      {isAiModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            width: '580px',
            maxHeight: '92vh',
            backgroundColor: themeStyles.cardBg,
            border: `1px solid ${isDark ? '#4c1d95' : '#c4b5fd'}`,
            borderRadius: '14px',
            boxShadow: '0 25px 50px -12px rgba(124, 58, 237, 0.25)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '16px 20px',
              borderBottom: `1px solid ${themeStyles.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: isDark ? 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)' : 'linear-gradient(135deg, #f5f3ff 0%, #ffffff 100%)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  boxShadow: '0 2px 8px rgba(139, 92, 246, 0.4)'
                }}>
                  <Sparkles size={19} fill="white" />
                </div>
                <div>
                  <h3 style={{ fontSize: '0.94rem', fontWeight: 700, margin: 0, color: themeStyles.text }}>
                    Mandor AI — Text to SQL Assistant
                  </h3>
                  <span style={{ fontSize: '0.7rem', color: themeStyles.subText }}>
                    Tulis pertanyaan dalam bahasa manusia, AI akan merancang query SQL secara instan
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsAiModalOpen(false)}
                style={{ border: 'none', background: 'none', color: themeStyles.subText, cursor: 'pointer', padding: '4px' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '18px 20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Input Area */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '6px', color: themeStyles.text }}>
                  Apa yang ingin Anda tampilkan atau hitung?
                </label>
                <div style={{ position: 'relative' }}>
                  <textarea
                    rows={3}
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    onKeyDown={(e) => {
                      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                        e.preventDefault();
                        handleGenerateAiSql();
                      }
                    }}
                    placeholder="Contoh: Tampilkan 5 work order dengan scrap terbanyak atau hitung total produksi per lini..."
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: `1px solid ${isDark ? '#475569' : '#cbd5e1'}`,
                      backgroundColor: isDark ? '#0f172a' : '#f8fafc',
                      color: themeStyles.text,
                      fontSize: '0.82rem',
                      lineHeight: 1.4,
                      outline: 'none',
                      resize: 'none'
                    }}
                  />
                </div>
              </div>

              {/* Quick Prompt Suggestions */}
              <div>
                <div style={{ fontSize: '0.68rem', color: themeStyles.subText, marginBottom: '6px', fontWeight: 600 }}>
                  💡 Contoh Pertanyaan Populer:
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {[
                    '💥 5 Order Scrap Terbanyak',
                    '⚡ Order Sedang Berjalan (RUNNING)',
                    '📊 Rekap Total Produksi per Lini',
                    '⏰ Order Mendekati Batas Waktu',
                    '✅ Order Selesai (COMPLETED)',
                    '➕ Tambah data baru ke tabel',
                    '📝 Buat tabel baru'
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setAiPrompt(preset);
                        handleGenerateAiSql(preset);
                      }}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '12px',
                        border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
                        backgroundColor: isDark ? '#1e293b' : '#ffffff',
                        color: themeStyles.text,
                        fontSize: '0.68rem',
                        fontWeight: 500,
                        cursor: 'pointer',
                        transition: 'all 0.1s'
                      }}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Generate Button */}
              <button
                type="button"
                onClick={() => handleGenerateAiSql()}
                disabled={isGeneratingSql || !aiPrompt.trim()}
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                  color: 'white',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: (isGeneratingSql || !aiPrompt.trim()) ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  opacity: (isGeneratingSql || !aiPrompt.trim()) ? 0.6 : 1,
                  boxShadow: '0 2px 10px rgba(139, 92, 246, 0.3)'
                }}
              >
                {isGeneratingSql ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} fill="white" />}
                <span>{isGeneratingSql ? 'Merancang Query SQL...' : 'Generate SQL dengan AI (Ctrl+Enter)'}</span>
              </button>

              {/* AI Generated Result Box */}
              {aiGeneratedResult && (
                <div style={{
                  padding: '14px',
                  borderRadius: '10px',
                  backgroundColor: isDark ? '#090d16' : '#f8fafc',
                  border: `1px solid ${isDark ? '#312e81' : '#ddd6fe'}`
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#a855f7' }}>
                      ✨ Hasil Rancangan Query:
                    </span>
                    <span style={{
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '10px',
                      backgroundColor: isDark ? '#1e1b4b' : '#ede9fe',
                      color: isDark ? '#c084fc' : '#7c3aed'
                    }}>
                      {aiGeneratedResult.confidence || 'Mandor AI Engine'}
                    </span>
                  </div>

                  <pre style={{
                    backgroundColor: isDark ? '#020617' : '#1e293b',
                    color: '#38bdf8',
                    padding: '12px',
                    borderRadius: '6px',
                    fontFamily: 'Consolas, Monaco, monospace',
                    fontSize: '0.78rem',
                    overflowX: 'auto',
                    margin: '0 0 10px 0',
                    lineHeight: 1.5,
                    border: '1px solid #334155'
                  }}>
                    {aiGeneratedResult.sql}
                  </pre>

                  {aiGeneratedResult.explanation && (
                    <p style={{ fontSize: '0.74rem', color: themeStyles.subText, margin: '0 0 12px 0', lineHeight: 1.4 }}>
                      💡 {aiGeneratedResult.explanation}
                    </p>
                  )}

                  {/* Actions for Generated Query */}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => handleApplyAiSql(true)}
                      style={{
                        flex: 1,
                        padding: '9px 14px',
                        borderRadius: '6px',
                        border: 'none',
                        backgroundColor: '#16a34a',
                        color: 'white',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        boxShadow: '0 2px 6px rgba(22, 163, 74, 0.3)'
                      }}
                    >
                      <Play size={13} fill="white" />
                      <span>▶ Run Query Langsung</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyAiSql(false)}
                      style={{
                        padding: '9px 14px',
                        borderRadius: '6px',
                        border: `1px solid ${themeStyles.border}`,
                        backgroundColor: isDark ? '#1e293b' : '#ffffff',
                        color: themeStyles.text,
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      Buka di Editor
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '12px 20px',
              borderTop: `1px solid ${themeStyles.border}`,
              display: 'flex',
              justifyContent: 'flex-end',
              backgroundColor: isDark ? '#090d16' : '#f8fafc'
            }}>
              <button
                type="button"
                onClick={() => setIsAiModalOpen(false)}
                style={{
                  padding: '6px 16px',
                  borderRadius: '6px',
                  border: `1px solid ${themeStyles.border}`,
                  backgroundColor: 'transparent',
                  color: themeStyles.text,
                  fontSize: '0.75rem',
                  cursor: 'pointer'
                }}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

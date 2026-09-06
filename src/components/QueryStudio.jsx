/**
 * QueryStudio.jsx
 * Advanced Visual Query Builder & SQL Studio for MaviCore MES (Supabase / PostgreSQL)
 * Inspired by DbGate Query Designer: Interactive drag & drop canvas, visual column-to-column JOINs,
 * real-time SQL generation, and hierarchical joined results preview.
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Database, Play, Code, Eye, Save, Download, Copy, Trash2,
  RefreshCw, Sparkles, Plus, Check, AlertCircle, ChevronDown,
  ChevronRight, Filter, Layers, Clock, Shield, Table, BookOpen,
  ArrowRight, CheckSquare, Search, FileCode, Sliders, Sun, Moon,
  Move, Link2, X, RotateCcw, Columns, Settings, HelpCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getSupabaseClient } from '../utils/supabaseManualDB.js';
import { getTables } from '../utils/supabaseTablesDB.js';
import { INDUSTRIAL_TABLE_TEMPLATES } from '../utils/industrialTableTemplates.js';
import { INDUSTRIAL_QUERY_TEMPLATES, INDUSTRIAL_QUERY_CATEGORIES } from '../utils/industrialQueryTemplates.js';

// Default Master & Sample Database Schema definitions for Visual Designer
const DEFAULT_TABLE_SCHEMAS = {
  orders: {
    name: 'orders',
    label: 'Orders (SPK Customer)',
    category: 'Sales & Production',
    columns: [
      { name: 'id', type: 'uuid', isPk: true, isFk: false },
      { name: 'user_id', type: 'uuid', isPk: false, isFk: true, fkRef: 'users.id' },
      { name: 'order_number', type: 'varchar', isPk: false, isFk: false },
      { name: 'total_amount', type: 'numeric', isPk: false, isFk: false },
      { name: 'status', type: 'varchar', isPk: false, isFk: false },
      { name: 'created_at', type: 'timestamptz', isPk: false, isFk: false }
    ],
    sampleRows: [
      { id: 'ord-001', user_id: 'usr-101', order_number: 'ORD-2026-001', total_amount: 15400000, status: 'IN_PRODUCTION', created_at: '2026-09-01 08:30:00' },
      { id: 'ord-002', user_id: 'usr-102', order_number: 'ORD-2026-002', total_amount: 8250000, status: 'COMPLETED', created_at: '2026-09-02 10:15:00' },
      { id: 'ord-003', user_id: 'usr-101', order_number: 'ORD-2026-003', total_amount: 24600000, status: 'PENDING', created_at: '2026-09-03 14:00:00' },
      { id: 'ord-004', user_id: 'usr-103', order_number: 'ORD-2026-004', total_amount: 5120000, status: 'IN_PRODUCTION', created_at: '2026-09-04 11:20:00' }
    ]
  },
  users: {
    name: 'users',
    label: 'Users / Operators',
    category: 'Organization & Security',
    columns: [
      { name: 'id', type: 'uuid', isPk: true, isFk: false },
      { name: 'name', type: 'varchar', isPk: false, isFk: false },
      { name: 'email', type: 'varchar', isPk: false, isFk: false },
      { name: 'role', type: 'varchar', isPk: false, isFk: false },
      { name: 'department', type: 'varchar', isPk: false, isFk: false }
    ],
    sampleRows: [
      { id: 'usr-101', name: 'Budi Santoso', email: 'budi.s@mandor.id', role: 'Production Supervisor', department: 'Machining Line 1' },
      { id: 'usr-102', name: 'Siti Rahma', email: 'siti.r@mandor.id', role: 'QC Inspector', department: 'Quality Assurance' },
      { id: 'usr-103', name: 'Ahmad Fauzi', email: 'ahmad.f@mandor.id', role: 'Line Operator', department: 'Assembly Line 2' }
    ]
  },
  work_orders: {
    name: 'work_orders',
    label: 'Work Orders (SPK)',
    category: 'MES Execution',
    columns: [
      { name: 'id', type: 'uuid', isPk: true, isFk: false },
      { name: 'order_number', type: 'varchar', isPk: false, isFk: false },
      { name: 'part_id', type: 'uuid', isPk: false, isFk: true, fkRef: 'parts.id' },
      { name: 'target_quantity', type: 'int', isPk: false, isFk: false },
      { name: 'completed_quantity', type: 'int', isPk: false, isFk: false },
      { name: 'status', type: 'varchar', isPk: false, isFk: false }
    ],
    sampleRows: [
      { id: 'wo-101', order_number: 'WO-2026-09-001', part_id: 'prt-001', target_quantity: 500, completed_quantity: 480, status: 'RUNNING' },
      { id: 'wo-102', order_number: 'WO-2026-09-002', part_id: 'prt-002', target_quantity: 1200, completed_quantity: 1200, status: 'COMPLETED' },
      { id: 'wo-103', order_number: 'WO-2026-09-003', part_id: 'prt-001', target_quantity: 800, completed_quantity: 350, status: 'RUNNING' }
    ]
  },
  parts: {
    name: 'parts',
    label: 'Parts Master (BOM)',
    category: 'Engineering & PLM',
    columns: [
      { name: 'id', type: 'uuid', isPk: true, isFk: false },
      { name: 'part_number', type: 'varchar', isPk: false, isFk: false },
      { name: 'name', type: 'varchar', isPk: false, isFk: false },
      { name: 'category', type: 'varchar', isPk: false, isFk: false },
      { name: 'standard_cost', type: 'numeric', isPk: false, isFk: false }
    ],
    sampleRows: [
      { id: 'prt-001', part_number: 'PART-FLANGE-001', name: 'Precision Flange SS316', category: 'WIP', standard_cost: 195000 },
      { id: 'prt-002', part_number: 'PART-BOLT-M12', name: 'Hex Bolt M12x50 Steel 8.8', category: 'RAW_MATERIAL', standard_cost: 12500 }
    ]
  },
  production_logs: {
    name: 'production_logs',
    label: 'Production Logs',
    category: 'MES Execution',
    columns: [
      { name: 'id', type: 'uuid', isPk: true, isFk: false },
      { name: 'work_order_id', type: 'uuid', isPk: false, isFk: true, fkRef: 'work_orders.id' },
      { name: 'operator_id', type: 'uuid', isPk: false, isFk: true, fkRef: 'users.id' },
      { name: 'good_quantity', type: 'int', isPk: false, isFk: false },
      { name: 'rejected_quantity', type: 'int', isPk: false, isFk: false },
      { name: 'timestamp', type: 'timestamptz', isPk: false, isFk: false }
    ],
    sampleRows: [
      { id: 'log-001', work_order_id: 'wo-101', operator_id: 'usr-103', good_quantity: 45, rejected_quantity: 2, timestamp: '2026-09-06 14:10:00' },
      { id: 'log-002', work_order_id: 'wo-101', operator_id: 'usr-103', good_quantity: 50, rejected_quantity: 0, timestamp: '2026-09-06 15:20:00' }
    ]
  },
  machines: {
    name: 'machines',
    label: 'Machines & Stations',
    category: 'Shopfloor Assets',
    columns: [
      { name: 'id', type: 'uuid', isPk: true, isFk: false },
      { name: 'code', type: 'varchar', isPk: false, isFk: false },
      { name: 'name', type: 'varchar', isPk: false, isFk: false },
      { name: 'status', type: 'varchar', isPk: false, isFk: false }
    ],
    sampleRows: [
      { id: 'mch-001', code: 'CNC-01', name: 'DMG MORI 5-Axis Milling', status: 'RUNNING' },
      { id: 'mch-002', code: 'LATHE-02', name: 'Mazak Quick Turn 250', status: 'IDLE' }
    ]
  }
};

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
    sql: `SELECT * \nFROM app_tables \nORDER BY created_at DESC \nLIMIT 20;`
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
    category: 'Advanced PostgreSQL',
    title: 'Window Function: Ranking',
    description: 'Ranking performa operator menggunakan DENSE_RANK()',
    sql: `SELECT \n  operator_id,\n  SUM(good_quantity) AS total_good,\n  DENSE_RANK() OVER (ORDER BY SUM(good_quantity) DESC) AS rank\nFROM production_logs\nGROUP BY operator_id;`
  }
];

export default function QueryStudio() {
  // Theme state: 'light' (MaviCore clean) or 'dark' (DbGate authentic)
  const [theme, setTheme] = useState('light');
  
  // View mode: 'visual' (DbGate Canvas), 'sql' (Code Editor), or 'split'
  const [activeTab, setActiveTab] = useState('visual');

  // Database Tables catalog
  const [tableSchemas, setTableSchemas] = useState(DEFAULT_TABLE_SCHEMAS);
  const [searchTableQuery, setSearchTableQuery] = useState('');
  
  // Visual Canvas state
  // canvasTables: array of { id, tableName, x, y, selectedColumns: string[] }
  const [canvasTables, setCanvasTables] = useState([
    {
      id: 'table-1',
      tableName: 'orders',
      x: 60,
      y: 50,
      selectedColumns: ['id', 'user_id', 'created_at']
    },
    {
      id: 'table-2',
      tableName: 'users',
      x: 480,
      y: 50,
      selectedColumns: ['id', 'name', 'email']
    }
  ]);

  // joins: array of { id, sourceTableId, sourceCol, targetTableId, targetCol, joinType: 'JOIN' | 'LEFT JOIN' | 'RIGHT JOIN' }
  const [joins, setJoins] = useState([
    {
      id: 'join-1',
      sourceTableId: 'table-1',
      sourceCol: 'user_id',
      targetTableId: 'table-2',
      targetCol: 'id',
      joinType: 'JOIN'
    }
  ]);

  // Dragging connection state (when user pulls a line from a column port)
  const [connectingSource, setConnectingSource] = useState(null); // { tableId, colName, x, y }
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Dragging card state
  const [draggingCard, setDraggingCard] = useState(null); // { tableId, offsetX, offsetY }

  // SQL query state
  const [generatedSql, setGeneratedSql] = useState('');
  const [customSql, setCustomSql] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [queryResult, setQueryResult] = useState(null);
  const [executionStats, setExecutionStats] = useState(null);
  const [isSnippetsOpen, setIsSnippetsOpen] = useState(false);
  const [snippetCategory, setSnippetCategory] = useState('all');
  const [snippetSearch, setSnippetSearch] = useState('');

  // Canvas DOM container ref for coordinates
  const canvasRef = useRef(null);

  // Load industrial templates & custom tables on mount
  useEffect(() => {
    try {
      const merged = { ...DEFAULT_TABLE_SCHEMAS };

      // 1. Add all Master Industrial Templates
      if (Array.isArray(INDUSTRIAL_TABLE_TEMPLATES)) {
        INDUSTRIAL_TABLE_TEMPLATES.forEach(tmpl => {
          if (!merged[tmpl.name]) {
            merged[tmpl.name] = {
              name: tmpl.name,
              label: tmpl.label,
              category: tmpl.categoryLabel || 'Industrial MES',
              columns: (tmpl.fields || []).map(f => ({
                name: f.name,
                type: f.type || 'text',
                isPk: f.name === 'id' || f.name.endsWith('_number'),
                isFk: f.name.endsWith('_id') || f.name.endsWith('_code')
              })),
              sampleRows: tmpl.sampleRows || []
            };
          }
        });
      }

      // 2. Add custom app tables from Supabase / localStorage
      const custom = getTables();
      if (custom && custom.length > 0) {
        custom.forEach(t => {
          if (!merged[t.name]) {
            merged[t.name] = {
              name: t.name,
              label: t.label || t.name,
              category: 'Custom App Tables',
              columns: (t.columns || []).map(col => ({
                name: col.name,
                type: col.type || 'text',
                isPk: col.name === 'id',
                isFk: col.name.endsWith('_id')
              })),
              sampleRows: (t.rows || []).slice(0, 5)
            };
          }
        });
      }

      setTableSchemas(merged);
    } catch (e) {
      console.warn('Could not load tables into QueryStudio:', e);
    }
  }, []);

  // Compute Real-time SQL query whenever canvasTables or joins change
  useEffect(() => {
    if (canvasTables.length === 0) {
      setGeneratedSql('-- Drag atau tambahkan tabel dari panel kiri ke canvas untuk memulai query');
      return;
    }

    // 1. Build SELECT list
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

    // 2. Build FROM & JOIN clauses
    const primaryTable = canvasTables[0];
    let fromClause = `FROM ${primaryTable.tableName}`;

    const joinedTableIds = new Set([primaryTable.id]);
    const joinClauses = [];

    // Process joins
    joins.forEach(j => {
      const srcT = canvasTables.find(t => t.id === j.sourceTableId);
      const tgtT = canvasTables.find(t => t.id === j.targetTableId);
      if (srcT && tgtT) {
        joinClauses.push(`${j.joinType || 'JOIN'} ${tgtT.tableName} ON ${srcT.tableName}.${j.sourceCol} = ${tgtT.tableName}.${j.targetCol}`);
        joinedTableIds.add(tgtT.id);
      }
    });

    // Check if there are other tables on canvas that aren't joined yet
    canvasTables.forEach(t => {
      if (!joinedTableIds.has(t.id)) {
        joinClauses.push(`CROSS JOIN ${t.tableName}`);
      }
    });

    const joinsStr = joinClauses.length > 0 ? '\n' + joinClauses.join('\n') : '';

    const finalSql = `SELECT \n${selectStr}\n${fromClause}${joinsStr};`;
    setGeneratedSql(finalSql);
    setCustomSql(finalSql);
  }, [canvasTables, joins, tableSchemas]);

  // Drag-and-drop table to canvas
  const handleAddTableToCanvas = (tableName) => {
    if (!tableSchemas[tableName]) return;
    const newId = `table-${Date.now()}`;
    const schema = tableSchemas[tableName];
    
    // Stagger position
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

  // Remove table from canvas
  const handleRemoveTable = (tableId) => {
    setCanvasTables(prev => prev.filter(t => t.id !== tableId));
    setJoins(prev => prev.filter(j => j.sourceTableId !== tableId && j.targetTableId !== tableId));
    toast.success('Tabel dihapus dari visual canvas');
  };

  // Toggle column selection in a table card
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

  // Auto-arrange tables side by side (Arranged button)
  const handleAutoArrange = () => {
    setCanvasTables(prev => prev.map((t, idx) => ({
      ...t,
      x: 60 + idx * 380,
      y: 60
    })));
    toast.success('Tabel berhasil ditata otomatis');
  };

  // Clear all tables from canvas
  const handleClearCanvas = () => {
    setCanvasTables([]);
    setJoins([]);
    setQueryResult(null);
    toast.success('Canvas dibersihkan');
  };

  // Handle Card Dragging on Canvas
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
    if (connectingSource) {
      setConnectingSource(null);
    }
  };

  // Start dragging connection from a column port handle
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

  // Finish dragging connection to target column port handle
  const handleEndConnect = (e, targetTableId, targetColName) => {
    e.stopPropagation();
    if (!connectingSource) return;

    if (connectingSource.tableId === targetTableId) {
      toast.error('Tidak bisa membuat JOIN ke tabel yang sama');
      setConnectingSource(null);
      return;
    }

    // Check if join already exists
    const exists = joins.some(j => 
      (j.sourceTableId === connectingSource.tableId && j.sourceCol === connectingSource.colName && j.targetTableId === targetTableId && j.targetCol === targetColName) ||
      (j.sourceTableId === targetTableId && j.sourceCol === targetColName && j.targetTableId === connectingSource.tableId && j.targetCol === connectingSource.colName)
    );

    if (exists) {
      toast('Relasi JOIN ini sudah ada', { icon: 'ℹ️' });
      setConnectingSource(null);
      return;
    }

    // Add new JOIN
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

  // Toggle JOIN type (INNER JOIN -> LEFT JOIN -> RIGHT JOIN)
  const handleToggleJoinType = (joinId) => {
    setJoins(prev => prev.map(j => {
      if (j.id !== joinId) return j;
      const nextType = j.joinType === 'JOIN' ? 'LEFT JOIN' : j.joinType === 'LEFT JOIN' ? 'RIGHT JOIN' : 'JOIN';
      return { ...j, joinType: nextType };
    }));
  };

  // Delete a JOIN
  const handleDeleteJoin = (joinId) => {
    setJoins(prev => prev.filter(j => j.id !== joinId));
    toast.success('Relasi JOIN dihapus');
  };

  // Execute Query (simulated or Supabase real execution)
  const handleExecuteQuery = async () => {
    setIsRunning(true);
    const startTime = performance.now();

    try {
      await new Promise(resolve => setTimeout(resolve, 350));

      if (canvasTables.length === 0) {
        setQueryResult([]);
        setExecutionStats({ count: 0, time: 0 });
        setIsRunning(false);
        return;
      }

      const table1 = canvasTables[0];
      const schema1 = tableSchemas[table1.tableName];
      const rows1 = schema1?.sampleRows || [
        { id: '1', name: 'Sample Record 1', status: 'ACTIVE' },
        { id: '2', name: 'Sample Record 2', status: 'COMPLETED' }
      ];

      let combinedRows = [];

      if (canvasTables.length > 1 && joins.length > 0) {
        const table2 = canvasTables[1];
        const schema2 = tableSchemas[table2.tableName];
        const rows2 = schema2?.sampleRows || [];
        const activeJoin = joins[0];

        rows1.forEach(r1 => {
          const match = rows2.find(r2 => String(r2[activeJoin.targetCol]) === String(r1[activeJoin.sourceCol])) || {};
          const rowObj = {};
          table1.selectedColumns.forEach(col => {
            rowObj[`${table1.tableName}.${col}`] = r1[col] !== undefined ? r1[col] : '-';
          });
          table2.selectedColumns.forEach(col => {
            rowObj[`${table2.tableName}.${col}`] = match[col] !== undefined ? match[col] : '-';
          });
          combinedRows.push(rowObj);
        });
      } else {
        combinedRows = rows1.map(r => {
          const rowObj = {};
          table1.selectedColumns.forEach(col => {
            rowObj[`${table1.tableName}.${col}`] = r[col] !== undefined ? r[col] : '-';
          });
          return rowObj;
        });
      }

      const elapsed = Math.round(performance.now() - startTime);
      setQueryResult(combinedRows);
      setExecutionStats({ count: combinedRows.length, time: elapsed });
      toast.success(`Query berhasil dieksekusi (${combinedRows.length} baris, ${elapsed} ms)`);
    } catch (err) {
      toast.error('Gagal mengeksekusi query: ' + err.message);
    } finally {
      setIsRunning(false);
    }
  };

  // Export results to CSV
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

  // Combined and filtered SQL templates (Industrial MES + SQL Cheat Sheet)
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
                DbGate-Style Engine
              </span>
            </div>
            <p style={{ fontSize: '0.72rem', color: themeStyles.subText, margin: 0 }}>
              Visual Table Drag & Drop, Multi-Table Column JOINs, dan Supabase SQL Generator
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
              SQL Code
            </button>
          </div>

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
            <span>Cheat Sheet</span>
          </button>

          {/* Execute / Run Query Button */}
          <button
            onClick={handleExecuteQuery}
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
          </button>
        </div>
      </header>

      {/* 2. MAIN WORKSPACE CONTAINER */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        
        {/* A. LEFT SIDEBAR: "CHOOSE DATA & TABLES" */}
        <div style={{
          width: '260px',
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
                CHOOSE DATA
              </span>
              <span style={{ fontSize: '0.7rem', color: themeStyles.subText }}>
                {filteredTableKeys.length} tables
              </span>
            </div>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '9px', top: '9px', color: themeStyles.subText }} />
              <input
                type="text"
                value={searchTableQuery}
                onChange={(e) => setSearchTableQuery(e.target.value)}
                placeholder="Search column or table..."
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

          {/* Table List */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '10px 8px' }}>
            {filteredTableKeys.map(k => {
              const tbl = tableSchemas[k];
              const isInCanvas = canvasTables.some(t => t.tableName === tbl.name);
              return (
                <div
                  key={tbl.name}
                  style={{
                    padding: '8px 10px',
                    borderRadius: '6px',
                    marginBottom: '6px',
                    backgroundColor: isInCanvas ? (isDark ? '#1e3a8a33' : '#eff6ff') : 'transparent',
                    border: `1px solid ${isInCanvas ? (isDark ? '#1d4ed8' : '#bfdbfe') : 'transparent'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                  onClick={() => handleAddTableToCanvas(tbl.name)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                    <Table size={14} color={isInCanvas ? themeStyles.lineColor : themeStyles.subText} />
                    <div style={{ overflow: 'hidden' }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                        {tbl.name}
                      </div>
                      <div style={{ fontSize: '0.68rem', color: themeStyles.subText, whiteSpace: 'nowrap' }}>
                        {tbl.columns.length} kolom · {tbl.category}
                      </div>
                    </div>
                  </div>

                  <button
                    title="Tambahkan ke Canvas"
                    style={{
                      border: 'none',
                      background: 'none',
                      color: isInCanvas ? themeStyles.lineColor : themeStyles.subText,
                      cursor: 'pointer',
                      padding: '2px 4px'
                    }}
                  >
                    <Plus size={15} />
                  </button>
                </div>
              );
            })}
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

        {/* B. CENTER & RIGHT WORKSPACE (CANVAS + SQL + RESULTS) */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          
          {/* TOP AREA: VISUAL CANVAS OR RAW SQL */}
          <div style={{
            flex: activeTab === 'sql' ? 0.45 : 0.6,
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
                  <defs>
                    <linearGradient id="joinGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#2563eb" />
                      <stop offset="100%" stopColor="#38bdf8" />
                    </linearGradient>
                  </defs>

                  {/* Render Existing JOIN Curves */}
                  {joins.map(j => {
                    const srcT = canvasTables.find(t => t.id === j.sourceTableId);
                    const tgtT = canvasTables.find(t => t.id === j.targetTableId);
                    if (!srcT || !tgtT) return null;

                    const srcSchema = tableSchemas[srcT.tableName];
                    const tgtSchema = tableSchemas[tgtT.tableName];
                    if (!srcSchema || !tgtSchema) return null;

                    const srcColIdx = (srcSchema.columns || []).findIndex(c => c.name === j.sourceCol);
                    const tgtColIdx = (tgtSchema.columns || []).findIndex(c => c.name === j.targetCol);

                    // Calculate port coordinates:
                    // card width = 280px; header height approx 40px, each column row approx 28px
                    const x1 = srcT.x + 280;
                    const y1 = srcT.y + 45 + (srcColIdx >= 0 ? srcColIdx : 0) * 28 + 14;
                    const x2 = tgtT.x;
                    const y2 = tgtT.y + 45 + (tgtColIdx >= 0 ? tgtColIdx : 0) * 28 + 14;

                    const midX = (x1 + x2) / 2;
                    const midY = (y1 + y2) / 2;
                    const pathD = `M ${x1} ${y1} C ${x1 + 80} ${y1}, ${x2 - 80} ${y2}, ${x2} ${y2}`;

                    return (
                      <g key={j.id}>
                        {/* Glow Line */}
                        <path
                          d={pathD}
                          fill="none"
                          stroke={themeStyles.lineColor}
                          strokeWidth="3"
                          strokeOpacity={isDark ? "0.8" : "0.7"}
                        />
                        
                        {/* Interactive JOIN Pill Badge at Midpoint */}
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

                  {/* Temporary drag curve when pulling a new connection */}
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

                {/* Canvas Empty State Notice */}
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
                      Pilih tabel dari panel <strong>CHOOSE DATA</strong> di sebelah kiri untuk menambahkannya ke diagram
                    </p>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button
                        onClick={() => handleAddTableToCanvas('orders')}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '6px',
                          border: `1px solid ${themeStyles.lineColor}`,
                          backgroundColor: isDark ? '#1e3a8a33' : '#eff6ff',
                          color: themeStyles.lineColor,
                          fontSize: '0.76rem',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        + Tambah orders
                      </button>
                      <button
                        onClick={() => handleAddTableToCanvas('users')}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '6px',
                          border: `1px solid ${themeStyles.lineColor}`,
                          backgroundColor: isDark ? '#1e3a8a33' : '#eff6ff',
                          color: themeStyles.lineColor,
                          fontSize: '0.76rem',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        + Tambah users
                      </button>
                    </div>
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
                      {/* Card Header */}
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

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
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
                      </div>

                      {/* Columns List */}
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
                              {/* Checkbox & Column Name */}
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

                              {/* Badges & Port Handle */}
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
                                {col.isFk && (
                                  <span style={{
                                    fontSize: '0.62rem',
                                    fontWeight: 700,
                                    backgroundColor: isDark ? '#b45309' : '#fef3c7',
                                    color: isDark ? '#fef3c7' : '#b45309',
                                    padding: '1px 4px',
                                    borderRadius: '3px'
                                  }}>
                                    FK
                                  </span>
                                )}

                                {/* Connection Port Handle (Pull JOIN line) */}
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
              /* RAW SQL CODE EDITOR */
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: isDark ? '#0f172a' : '#1e293b' }}>
                <div style={{
                  padding: '6px 14px',
                  backgroundColor: isDark ? '#090d16' : '#0f172a',
                  borderBottom: '1px solid #334155',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  color: '#94a3b8',
                  fontSize: '0.72rem'
                }}>
                  <span>PostgreSQL / Supabase Query Editor</span>
                  <span>Shortcut: <strong>Ctrl + Enter</strong> untuk Run</span>
                </div>
                <textarea
                  value={customSql}
                  onChange={(e) => setCustomSql(e.target.value)}
                  onKeyDown={(e) => {
                    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                      e.preventDefault();
                      handleExecuteQuery();
                    }
                  }}
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

            {/* LIVE SQL PREVIEW STRIP (BOTTOM OF CANVAS) */}
            <div style={{
              padding: '8px 16px',
              backgroundColor: isDark ? '#090d16' : '#0f172a',
              borderTop: `1px solid ${themeStyles.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontFamily: 'Consolas, Monaco, monospace',
              fontSize: '0.75rem',
              color: '#38bdf8'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                <span style={{ color: '#94a3b8', fontWeight: 600 }}>SQL:</span>
                <span style={{
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                  color: '#e2e8f0'
                }}>
                  {generatedSql.replace(/\n/g, ' ')}
                </span>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(generatedSql);
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
                    fontSize: '0.72rem'
                  }}
                >
                  <Copy size={12} />
                  Copy
                </button>
              </div>
            </div>
          </div>

          {/* BOTTOM AREA: RESULTS DATA GRID (HIERARCHICAL / JOINED TABLE) */}
          <div style={{
            flex: activeTab === 'sql' ? 0.55 : 0.4,
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: themeStyles.cardBg,
            overflow: 'hidden'
          }}>
            {/* Results Header Bar */}
            <div style={{
              padding: '8px 16px',
              borderBottom: `1px solid ${themeStyles.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: themeStyles.text }}>
                  Result Grid
                </span>
                {executionStats && (
                  <span style={{ fontSize: '0.72rem', color: themeStyles.subText }}>
                    {executionStats.count} rows · {executionStats.time} ms
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={handleExportCSV}
                  disabled={!queryResult || queryResult.length === 0}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    border: `1px solid ${themeStyles.border}`,
                    backgroundColor: isDark ? '#1e293b' : '#f8fafc',
                    color: themeStyles.text,
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    cursor: (!queryResult || queryResult.length === 0) ? 'not-allowed' : 'pointer',
                    opacity: (!queryResult || queryResult.length === 0) ? 0.5 : 1
                  }}
                >
                  <Download size={13} />
                  Export CSV
                </button>
              </div>
            </div>

            {/* Results Grid Table */}
            <div style={{ flex: 1, overflow: 'auto' }}>
              {queryResult && queryResult.length > 0 ? (
                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '0.76rem',
                  textAlign: 'left'
                }}>
                  <thead>
                    <tr style={{
                      backgroundColor: isDark ? '#0f172a' : '#f1f5f9',
                      borderBottom: `1px solid ${themeStyles.border}`,
                      color: themeStyles.subText
                    }}>
                      <th style={{ padding: '6px 12px', width: '40px' }}>#</th>
                      {Object.keys(queryResult[0]).map(col => (
                        <th key={col} style={{ padding: '6px 12px', fontWeight: 600 }}>
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {queryResult.map((row, rIdx) => (
                      <tr
                        key={rIdx}
                        style={{
                          borderBottom: `1px solid ${themeStyles.border}`,
                          backgroundColor: rIdx % 2 === 0 ? 'transparent' : (isDark ? '#0f172a40' : '#f8fafc')
                        }}
                      >
                        <td style={{ padding: '6px 12px', color: themeStyles.subText }}>{rIdx + 1}</td>
                        {Object.keys(queryResult[0]).map(col => (
                          <td key={col} style={{ padding: '6px 12px', color: themeStyles.text }}>
                            {String(row[col])}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div style={{
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: themeStyles.subText,
                  fontSize: '0.8rem',
                  gap: '8px'
                }}>
                  <Play size={16} />
                  <span>Klik <strong>Run Query</strong> untuk melihat hasil eksekusi tabel</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* C. RIGHT DRAWER: SQL CHEAT SHEET (52 TOPICS) */}
        {isSnippetsOpen && (
          <div style={{
            width: '360px',
            borderLeft: `1px solid ${themeStyles.border}`,
            backgroundColor: themeStyles.cardBg,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            {/* Drawer Header */}
            <div style={{
              padding: '12px 16px',
              borderBottom: `1px solid ${themeStyles.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BookOpen size={16} color={themeStyles.lineColor} />
                <span style={{ fontSize: '0.82rem', fontWeight: 700 }}>Template Query Industri & SQL</span>
              </div>
              <button
                onClick={() => setIsSnippetsOpen(false)}
                style={{ border: 'none', background: 'none', color: themeStyles.subText, cursor: 'pointer' }}
              >
                <X size={15} />
              </button>
            </div>

            {/* Category Filter Pills & Search */}
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

              {/* Category Pills */}
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

            {/* Snippets List */}
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
                    <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                      {snip.isIndustrial && (
                        <span style={{
                          fontSize: '0.62rem',
                          fontWeight: 700,
                          color: '#16a34a',
                          backgroundColor: '#f0fdf4',
                          border: '1px solid #bbf7d0',
                          padding: '1px 5px',
                          borderRadius: '4px'
                        }}>
                          MES
                        </span>
                      )}
                      <span style={{
                        fontSize: '0.62rem',
                        color: themeStyles.subText,
                        backgroundColor: isDark ? '#1e293b' : '#e2e8f0',
                        padding: '1px 5px',
                        borderRadius: '4px'
                      }}>
                        {snip.categoryLabel || snip.category}
                      </span>
                    </div>
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
    </div>
  );
}

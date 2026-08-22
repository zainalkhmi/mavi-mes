import React, { useState, useEffect, useMemo } from 'react';
import {
  Tag, Plus, Copy, Printer, Download, Search, Filter, RefreshCw,
  Layers, Calendar, Settings, Trash2, Edit3, Database, HardDrive
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import {
  getTables, createTable, getTableRecords, addTableRecord, updateTableRecord
} from '../utils/database';

// ─── MONTH CODE MAPPER ───────────────────────────────────────────────────────
const MONTH_CODES = {
  1: 'A', 2: 'B', 3: 'C', 4: 'D', 5: 'E', 6: 'F',
  7: 'G', 8: 'H', 9: 'I', 10: 'J', 11: 'K', 12: 'L'
};

const MONTH_NAMES_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const INITIAL_MASTER_PARTS = [
  { customer: 'PT. Toyota Motor Manufacturing', part_no: 'PN-TY-9021', part_name: 'Bracket Steering Shaft', mark: '092', sequence_type: 'Normal' },
  { customer: 'PT. Honda Precision Parts', part_no: 'PN-HD-5412', part_name: 'Engine Cover Mount', mark: '068', sequence_type: 'Odd' },
  { customer: 'PT. Mitsubishi Motors', part_no: 'PN-MB-3301', part_name: 'Suspension Arm Rear', mark: '115', sequence_type: 'Even' },
  { customer: 'PT. Astra Daihatsu Motor', part_no: 'PN-DH-8840', part_name: 'Transmission Housing Cap', mark: '204', sequence_type: 'Normal' }
];

const LotGenerator = () => {
  // ─── STATE FOR DATABASE TABLES ─────────────────────────────────────────────
  const [tablesLoaded, setTablesLoaded] = useState(false);
  const [partsTableId, setPartsTableId] = useState(null);
  const [countersTableId, setCountersTableId] = useState(null);
  const [historyTableId, setHistoryTableId] = useState(null);

  // Table Data State
  const [masterParts, setMasterParts] = useState([]);
  const [lotCounters, setLotCounters] = useState({});
  const [lotHistory, setLotHistory] = useState([]);

  // Form State
  const [selectedPartNo, setSelectedPartNo] = useState('');
  const [customMark, setCustomMark] = useState('');
  const [operatorUser, setOperatorUser] = useState('Op-Production-01');
  const [latestGeneratedLot, setLatestGeneratedLot] = useState(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPartNo, setFilterPartNo] = useState('ALL');

  // Master Part Modal State
  const [isPartModalOpen, setIsPartModalOpen] = useState(false);
  const [editingPart, setEditingPart] = useState(null);
  const [partForm, setPartForm] = useState({
    customer: '', part_no: '', part_name: '', mark: '', sequence_type: 'Normal'
  });

  // Print Label Modal State
  const [printModalLot, setPrintModalLot] = useState(null);

  // ─── INITIALIZE MES DATABASE TABLES ───────────────────────────────────────
  useEffect(() => {
    let isMounted = true;
    const initLotTables = async () => {
      try {
        const allTables = await getTables();

        // 1. MasterPart Table
        let partsTbl = allTables.find(t => t.name === 'lot_master_parts');
        if (!partsTbl) {
          partsTbl = await createTable({
            name: 'lot_master_parts',
            description: 'Master Data Part untuk Lot Generator MES',
            fields: [
              { name: 'customer', type: 'text' },
              { name: 'part_no', type: 'text' },
              { name: 'part_name', type: 'text' },
              { name: 'mark', type: 'text' },
              { name: 'sequence_type', type: 'text' }
            ]
          });
          // Seed initial parts
          for (const p of INITIAL_MASTER_PARTS) {
            await addTableRecord({ tableId: partsTbl.id, fields: p });
          }
        }

        // 2. LotCounter Table
        let countersTbl = allTables.find(t => t.name === 'lot_counters');
        if (!countersTbl) {
          countersTbl = await createTable({
            name: 'lot_counters',
            description: 'Tracking Counter Lot Running Number Per Part & Bulan',
            fields: [
              { name: 'part_no', type: 'text' },
              { name: 'year', type: 'number' },
              { name: 'month', type: 'number' },
              { name: 'last_number', type: 'number' }
            ]
          });
        }

        // 3. LotHistory Table
        let historyTbl = allTables.find(t => t.name === 'lot_history');
        if (!historyTbl) {
          historyTbl = await createTable({
            name: 'lot_history',
            description: 'Log History pembuatan Lot Number MES',
            fields: [
              { name: 'date_time', type: 'text' },
              { name: 'lot_number', type: 'text' },
              { name: 'part_no', type: 'text' },
              { name: 'part_name', type: 'text' },
              { name: 'mark', type: 'text' },
              { name: 'customer', type: 'text' },
              { name: 'user', type: 'text' },
              { name: 'format_lot', type: 'text' }
            ]
          });
        }

        if (!isMounted) return;

        setPartsTableId(partsTbl.id);
        setCountersTableId(countersTbl.id);
        setHistoryTableId(historyTbl.id);

        // Fetch records from DB tables
        await refreshTableData(partsTbl.id, countersTbl.id, historyTbl.id);
        setTablesLoaded(true);

      } catch (err) {
        console.error('[LotGenerator] DB Table Init Error:', err);
        toast.error('Gagal memuat tabel database: ' + err.message);
      }
    };

    initLotTables();
    return () => { isMounted = false; };
  }, []);

  // Refresh Table Data from Database API
  const refreshTableData = async (pId = partsTableId, cId = countersTableId, hId = historyTableId) => {
    if (pId) {
      const pRecs = await getTableRecords(pId);
      const formattedParts = pRecs.map(r => ({
        id: r.id,
        recordId: r.recordId || r.id,
        customer: r.customer || r.fields?.customer || '',
        part_no: r.part_no || r.fields?.part_no || '',
        part_name: r.part_name || r.fields?.part_name || '',
        mark: r.mark || r.fields?.mark || '',
        sequence_type: r.sequence_type || r.fields?.sequence_type || 'Normal'
      }));
      setMasterParts(formattedParts);
      if (formattedParts.length > 0 && !selectedPartNo) {
        setSelectedPartNo(formattedParts[0].part_no);
        setCustomMark(formattedParts[0].mark);
      }
    }

    if (cId) {
      const cRecs = await getTableRecords(cId);
      const cMap = {};
      cRecs.forEach(r => {
        const pNo = r.part_no || r.fields?.part_no;
        const yr = r.year || r.fields?.year;
        const mo = r.month || r.fields?.month;
        const lastNum = r.last_number ?? r.fields?.last_number ?? 0;
        if (pNo && yr && mo) {
          cMap[`${pNo}_${yr}_${mo}`] = {
            id: r.id,
            recordId: r.recordId || r.id,
            lastNumber: Number(lastNum)
          };
        }
      });
      setLotCounters(cMap);
    }

    if (hId) {
      const hRecs = await getTableRecords(hId);
      const formattedHistory = hRecs.map(r => ({
        id: r.id,
        recordId: r.recordId || r.id,
        dateTime: r.date_time || r.fields?.date_time || '',
        lotNumber: r.lot_number || r.fields?.lot_number || '',
        partNo: r.part_no || r.fields?.part_no || '',
        partName: r.part_name || r.fields?.part_name || '',
        mark: r.mark || r.fields?.mark || '',
        customer: r.customer || r.fields?.customer || '',
        user: r.user || r.fields?.user || '',
        formatLot: r.format_lot || r.fields?.format_lot || ''
      }));
      formattedHistory.sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime));
      setLotHistory(formattedHistory);
    }
  };

  // Sync Mark when selectedPartNo changes
  useEffect(() => {
    const found = masterParts.find(p => p.part_no === selectedPartNo);
    if (found) {
      setCustomMark(found.mark || '');
    }
  }, [selectedPartNo, masterParts]);

  const activePart = useMemo(() => {
    return masterParts.find(p => p.part_no === selectedPartNo) || masterParts[0] || {};
  }, [masterParts, selectedPartNo]);

  // Current Date Infos
  const currentDate = useMemo(() => new Date(), []);
  const yearDigit = String(currentDate.getFullYear()).slice(-1);
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  const monthCode = MONTH_CODES[currentMonth] || 'A';
  const yearMonthKey = `${selectedPartNo}_${currentYear}_${currentMonth}`;

  // ─── CALCULATE NEXT RUNNING NUMBER ─────────────────────────────────────────
  const getNextRunningNumber = (partNo, seqType) => {
    const key = `${partNo}_${currentYear}_${currentMonth}`;
    const counterObj = lotCounters[key];
    const lastNum = counterObj ? counterObj.lastNumber : 0;

    let nextNum = 1;
    if (lastNum > 0) {
      if (seqType === 'Odd') {
        nextNum = lastNum % 2 === 0 ? lastNum + 1 : lastNum + 2;
      } else if (seqType === 'Even') {
        nextNum = lastNum % 2 === 0 ? lastNum + 2 : lastNum + 1;
      } else {
        nextNum = lastNum + 1;
      }
    } else {
      if (seqType === 'Even') nextNum = 2;
      else nextNum = 1;
    }
    return nextNum;
  };

  const nextSeqNum = useMemo(() => {
    if (!selectedPartNo) return '001';
    const num = getNextRunningNumber(selectedPartNo, activePart.sequence_type || 'Normal');
    return String(num).padStart(3, '0');
  }, [selectedPartNo, activePart, lotCounters, currentYear, currentMonth]);

  const previewLotNumber = useMemo(() => {
    const markStr = customMark ? customMark.trim() + ' ' : '';
    return `${markStr}${yearDigit}${monthCode} ${nextSeqNum}`;
  }, [customMark, yearDigit, monthCode, nextSeqNum]);

  // ─── GENERATE LOT ACTION & SAVE TO DB TABLE ────────────────────────────────
  const handleGenerateLot = async () => {
    if (!selectedPartNo) {
      toast.error('Pilih Part No terlebih dahulu!');
      return;
    }
    if (!historyTableId || !countersTableId) {
      toast.error('Tabel Database sedang diinisialisasi...');
      return;
    }

    const seqType = activePart.sequence_type || 'Normal';
    const nextNum = getNextRunningNumber(selectedPartNo, seqType);
    const formattedSeq = String(nextNum).padStart(3, '0');
    
    const markStr = customMark ? customMark.trim() + ' ' : '';
    const generatedLot = `${markStr}${yearDigit}${monthCode} ${formattedSeq}`;

    // 1. Update/Add LotCounter in DB Table
    const counterKey = `${selectedPartNo}_${currentYear}_${currentMonth}`;
    const existingCounter = lotCounters[counterKey];

    if (existingCounter) {
      await updateTableRecord(countersTableId, existingCounter.recordId, {
        part_no: selectedPartNo,
        year: currentYear,
        month: currentMonth,
        last_number: nextNum
      });
    } else {
      await addTableRecord({
        tableId: countersTableId,
        fields: {
          part_no: selectedPartNo,
          year: currentYear,
          month: currentMonth,
          last_number: nextNum
        }
      });
    }

    // 2. Add Record into LotHistory DB Table
    const now = new Date();
    const dateTimeStr = now.toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'medium' });

    const newRecordFields = {
      date_time: dateTimeStr,
      lot_number: generatedLot,
      part_no: selectedPartNo,
      part_name: activePart.part_name || '-',
      mark: customMark || activePart.mark || '-',
      customer: activePart.customer || '-',
      user: operatorUser || 'Operator',
      format_lot: `${yearDigit}${monthCode} + ${formattedSeq} (${seqType})`
    };

    const addedRec = await addTableRecord({
      tableId: historyTableId,
      fields: newRecordFields
    });

    const newHistoryRow = {
      id: addedRec.id,
      recordId: addedRec.recordId || addedRec.id,
      ...newRecordFields,
      dateTime: dateTimeStr,
      lotNumber: generatedLot,
      partNo: selectedPartNo,
      partName: activePart.part_name || '-',
      mark: customMark || activePart.mark || '-'
    };

    setLatestGeneratedLot(newHistoryRow);
    await refreshTableData();
    toast.success('Lot berhasil dibuat & tersimpan ke Database Table!');
  };

  const handleCopyLot = (lotText) => {
    navigator.clipboard.writeText(lotText);
    toast.success(`Copied: ${lotText}`);
  };

  const handleExportCSV = () => {
    if (filteredHistory.length === 0) {
      toast.error('Tidak ada data history untuk diexport!');
      return;
    }

    const headers = ['Date Time', 'Lot Number', 'Part No', 'Part Name', 'Mark', 'Customer', 'User', 'Format Lot'];
    const csvRows = [headers.join(',')];

    filteredHistory.forEach(item => {
      const row = [
        `"${item.dateTime}"`,
        `"${item.lotNumber}"`,
        `"${item.partNo}"`,
        `"${item.partName || ''}"`,
        `"${item.mark || ''}"`,
        `"${item.customer || ''}"`,
        `"${item.user}"`,
        `"${item.formatLot}"`
      ];
      csvRows.push(row.join(','));
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Lot_History_MES_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Data History berhasil di-export ke CSV!');
  };

  const filteredHistory = useMemo(() => {
    return lotHistory.filter(item => {
      const matchesPart = filterPartNo === 'ALL' || item.partNo === filterPartNo;
      const q = searchQuery.toLowerCase();
      const matchesQuery = !searchQuery ||
        item.lotNumber.toLowerCase().includes(q) ||
        item.partNo.toLowerCase().includes(q) ||
        item.mark.toLowerCase().includes(q) ||
        item.user.toLowerCase().includes(q);
      return matchesPart && matchesQuery;
    });
  }, [lotHistory, filterPartNo, searchQuery]);

  // Master Part Modal Handlers (Writes to lot_master_parts DB Table)
  const handleOpenAddPart = () => {
    setEditingPart(null);
    setPartForm({ customer: '', part_no: '', part_name: '', mark: '', sequence_type: 'Normal' });
    setIsPartModalOpen(true);
  };

  const handleEditPart = (part) => {
    setEditingPart(part);
    setPartForm({ ...part });
    setIsPartModalOpen(true);
  };

  const handleSavePartForm = async (e) => {
    e.preventDefault();
    if (!partForm.part_no || !partForm.mark) {
      toast.error('Part No dan Mark wajib diisi!');
      return;
    }

    if (editingPart) {
      await updateTableRecord(partsTableId, editingPart.recordId, partForm);
      toast.success('Master Part berhasil diperbarui!');
    } else {
      const exists = masterParts.some(p => p.part_no.toLowerCase() === partForm.part_no.toLowerCase());
      if (exists) {
        toast.error('Part No sudah terdaftar!');
        return;
      }
      await addTableRecord({
        tableId: partsTableId,
        fields: partForm
      });
      setSelectedPartNo(partForm.part_no);
      toast.success('Master Part baru tersimpan ke Database Table!');
    }
    setIsPartModalOpen(false);
    await refreshTableData();
  };

  return (
    <div style={{ width: '100%', minHeight: '100vh', backgroundColor: '#0f172a', color: '#f8fafc', fontFamily: "'Inter', system-ui, sans-serif", padding: '20px', boxSizing: 'border-box' }}>
      <Toaster position="top-right" toastOptions={{ style: { background: '#1e293b', color: '#f8fafc', border: '1px solid #334155' } }} />

      {/* ─── HEADER TITLE BAR ─── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid #1e293b' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 16px rgba(37, 99, 235, 0.4)' }}>
            <Tag size={22} color="#ffffff" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#f8fafc', margin: 0, letterSpacing: '0.3px' }}>
              MES LOT NUMBER GENERATOR
            </h1>
            <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '2px 0 0 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Database size={13} color="#38bdf8" /> Powered by MES Database Tables (lot_master_parts, lot_counters, lot_history)
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={handleOpenAddPart}
            style={{
              padding: '8px 14px',
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '8px',
              color: '#38bdf8',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s'
            }}
          >
            <Settings size={14} /> Master Parts ({masterParts.length})
          </button>
        </div>
      </div>

      {/* ─── TOP KPI SUMMARY CARDS ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '24px' }}>
        <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '14px 16px' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Total Lot Generated</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#38bdf8', marginTop: '4px' }}>{lotHistory.length}</div>
        </div>
        <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '14px 16px' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Periode Bulan Ini</div>
          <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#a78bfa', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Calendar size={18} /> {MONTH_NAMES_ID[currentMonth - 1]} {currentYear} ({yearDigit}{monthCode})
          </div>
        </div>
        <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '14px 16px' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Part Sequence Mode</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#34d399', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Layers size={18} /> {activePart.sequence_type || 'Normal'} ({activePart.sequence_type === 'Odd' ? '1,3,5...' : activePart.sequence_type === 'Even' ? '2,4,6...' : '1,2,3...'})
          </div>
        </div>
        <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '14px 16px' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Next Running Number</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#f59e0b', marginTop: '4px' }}>{nextSeqNum}</div>
        </div>
      </div>

      {/* ─── MAIN WORKSPACE GRID ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '20px', alignItems: 'start' }}>
        
        {/* ─── LEFT FORM PANEL ─── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '14px', padding: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.3)' }}>
            <h2 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#f8fafc', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Tag size={16} color="#38bdf8" /> GENERATE LOT NUMBER
            </h2>

            {/* PART NO DROPDOWN */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '6px' }}>
                Part No (from MasterPart Table) <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <select
                value={selectedPartNo}
                onChange={(e) => setSelectedPartNo(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  backgroundColor: '#0f172a',
                  color: '#f8fafc',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                {masterParts.map(p => (
                  <option key={p.id} value={p.part_no}>
                    {p.part_no} — {p.part_name} ({p.customer})
                  </option>
                ))}
              </select>
            </div>

            {/* MARK TEXTBOX */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '6px' }}>
                Mark / Code Prefix <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                value={customMark}
                onChange={(e) => setCustomMark(e.target.value)}
                placeholder="e.g. 092"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  backgroundColor: '#0f172a',
                  color: '#f8fafc',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* OPERATOR USER */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '6px' }}>
                User / Station Operator
              </label>
              <input
                type="text"
                value={operatorUser}
                onChange={(e) => setOperatorUser(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  backgroundColor: '#0f172a',
                  color: '#cbd5e1',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* FORMAT LOT EXPLANATION BOX */}
            <div style={{ padding: '12px', backgroundColor: '#0f172a', borderRadius: '8px', border: '1px solid #334155', marginBottom: '18px' }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#38bdf8', textTransform: 'uppercase', marginBottom: '6px' }}>
                Format Rule Breakdown
              </div>
              <div style={{ fontSize: '0.73rem', color: '#94a3b8', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <div>• Tahun Digit Terakhir: <strong style={{ color: '#f8fafc' }}>{yearDigit}</strong> ({currentYear})</div>
                <div>• Kode Bulan ({MONTH_NAMES_ID[currentMonth - 1]}): <strong style={{ color: '#f8fafc' }}>{monthCode}</strong></div>
                <div>• Next Sequence ({activePart.sequence_type}): <strong style={{ color: '#f59e0b' }}>{nextSeqNum}</strong></div>
                <div>• Result Preview: <strong style={{ color: '#34d399', fontSize: '0.85rem' }}>{previewLotNumber}</strong></div>
              </div>
            </div>

            {/* GENERATE BUTTON */}
            <button
              onClick={handleGenerateLot}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                fontSize: '0.9rem',
                fontWeight: 900,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 0 16px rgba(37, 99, 235, 0.4)',
                transition: 'all 0.2s'
              }}
            >
              <RefreshCw size={18} /> GENERATE LOT NUMBER
            </button>
          </div>

          {/* ─── LIVE BARCODE LABEL PREVIEW CARD ─── */}
          {(latestGeneratedLot || previewLotNumber) && (
            <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '14px', padding: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.3)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>
                  Label Preview (Thermal 50x30mm)
                </span>
                {latestGeneratedLot && (
                  <span style={{ fontSize: '0.65rem', padding: '2px 6px', backgroundColor: '#065f46', color: '#34d399', borderRadius: '4px', fontWeight: 700 }}>
                    ACTIVE
                  </span>
                )}
              </div>

              <div style={{ backgroundColor: '#ffffff', color: '#000000', padding: '14px', borderRadius: '8px', border: '2px solid #000000', fontFamily: 'monospace' }}>
                <div style={{ fontSize: '0.65rem', fontWeight: 800, borderBottom: '1.5px solid #000', paddingBottom: '4px', marginBottom: '6px', display: 'flex', justifyContent: 'space-between' }}>
                  <span>{activePart.customer || 'MES PRODUCTION'}</span>
                  <span>{new Date().toLocaleDateString('id-ID')}</span>
                </div>
                <div style={{ fontSize: '0.7rem', fontWeight: 700 }}>PART: {selectedPartNo}</div>
                <div style={{ fontSize: '0.65rem', color: '#333', marginBottom: '8px' }}>{activePart.part_name}</div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f1f5f9', padding: '8px', borderRadius: '4px', border: '1px dashed #000' }}>
                  <div>
                    <div style={{ fontSize: '0.58rem', fontWeight: 800, color: '#64748b' }}>LOT NUMBER:</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#000' }}>
                      {latestGeneratedLot ? latestGeneratedLot.lotNumber : previewLotNumber}
                    </div>
                  </div>
                  <svg width="60" height="24" viewBox="0 0 60 24">
                    <rect x="0" width="3" height="24" fill="#000" />
                    <rect x="5" width="2" height="24" fill="#000" />
                    <rect x="9" width="4" height="24" fill="#000" />
                    <rect x="15" width="2" height="24" fill="#000" />
                    <rect x="19" width="5" height="24" fill="#000" />
                    <rect x="26" width="3" height="24" fill="#000" />
                    <rect x="31" width="2" height="24" fill="#000" />
                    <rect x="35" width="6" height="24" fill="#000" />
                    <rect x="43" width="2" height="24" fill="#000" />
                    <rect x="47" width="4" height="24" fill="#000" />
                    <rect x="53" width="3" height="24" fill="#000" />
                    <rect x="58" width="2" height="24" fill="#000" />
                  </svg>
                </div>

                <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '0.58rem', color: '#475569' }}>
                  <span>OP: {operatorUser}</span>
                  <span>MARK: {customMark || '-'}</span>
                </div>
              </div>

              {latestGeneratedLot && (
                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                  <button
                    onClick={() => handleCopyLot(latestGeneratedLot.lotNumber)}
                    style={{ flex: 1, padding: '7px', backgroundColor: '#334155', color: '#f8fafc', border: 'none', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                  >
                    <Copy size={13} /> Copy Lot
                  </button>
                  <button
                    onClick={() => setPrintModalLot(latestGeneratedLot)}
                    style={{ flex: 1, padding: '7px', backgroundColor: '#0284c7', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                  >
                    <Printer size={13} /> Print Label
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ─── RIGHT HISTORY TABLE & SEARCH ─── */}
        <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '14px', padding: '20px', minHeight: '620px', display: 'flex', flexDirection: 'column', boxShadow: '0 10px 25px rgba(0,0,0,0.3)' }}>
          
          {/* SEARCH & FILTER CONTROLS */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
                LOT HISTORY TABLE ({filteredHistory.length})
              </h3>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '9px', color: '#64748b' }} />
                <input
                  type="text"
                  placeholder="Search lot, part, mark..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    padding: '6px 10px 6px 30px',
                    backgroundColor: '#0f172a',
                    color: '#f8fafc',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    fontSize: '0.75rem',
                    outline: 'none',
                    width: '180px'
                  }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#0f172a', padding: '2px 8px', borderRadius: '8px', border: '1px solid #334155' }}>
                <Filter size={13} color="#94a3b8" />
                <select
                  value={filterPartNo}
                  onChange={(e) => setFilterPartNo(e.target.value)}
                  style={{
                    backgroundColor: 'transparent',
                    color: '#f8fafc',
                    border: 'none',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value="ALL" style={{ backgroundColor: '#0f172a' }}>All Parts</option>
                  {masterParts.map(p => (
                    <option key={p.id} value={p.part_no} style={{ backgroundColor: '#0f172a' }}>
                      {p.part_no}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleExportCSV}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#059669',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                <Download size={13} /> Export CSV
              </button>
            </div>
          </div>

          {/* TABLE DATA */}
          <div style={{ flex: 1, overflowX: 'auto', border: '1px solid #334155', borderRadius: '10px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#0f172a', borderBottom: '1px solid #334155', color: '#94a3b8', textTransform: 'uppercase', fontSize: '0.68rem', fontWeight: 800 }}>
                  <th style={{ padding: '10px 12px' }}>Date Time</th>
                  <th style={{ padding: '10px 12px' }}>Lot Number</th>
                  <th style={{ padding: '10px 12px' }}>Part No</th>
                  <th style={{ padding: '10px 12px' }}>Mark</th>
                  <th style={{ padding: '10px 12px' }}>User</th>
                  <th style={{ padding: '10px 12px' }}>Format Lot</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                      Belum ada record history lot di tabel `lot_history`. Klik "GENERATE LOT NUMBER" di samping.
                    </td>
                  </tr>
                ) : (
                  filteredHistory.map((row, idx) => (
                    <tr
                      key={row.id}
                      style={{
                        backgroundColor: idx % 2 === 0 ? '#1e293b' : '#0f172a',
                        borderBottom: '1px solid #334155',
                        transition: 'background 0.15s'
                      }}
                    >
                      <td style={{ padding: '10px 12px', color: '#cbd5e1', whiteSpace: 'nowrap' }}>{row.dateTime}</td>
                      <td style={{ padding: '10px 12px', fontWeight: 900, color: '#34d399', fontSize: '0.85rem' }}>
                        {row.lotNumber}
                      </td>
                      <td style={{ padding: '10px 12px', fontWeight: 700, color: '#38bdf8' }}>{row.partNo}</td>
                      <td style={{ padding: '10px 12px', color: '#f8fafc' }}>
                        <span style={{ padding: '2px 6px', backgroundColor: '#334155', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 800 }}>
                          {row.mark}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px', color: '#94a3b8' }}>{row.user}</td>
                      <td style={{ padding: '10px 12px', color: '#a78bfa', fontSize: '0.72rem' }}>{row.formatLot}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                          <button
                            onClick={() => handleCopyLot(row.lotNumber)}
                            style={{ padding: '4px 8px', border: 'none', backgroundColor: '#334155', color: '#38bdf8', borderRadius: '6px', cursor: 'pointer' }}
                            title="Copy Lot Number"
                          >
                            <Copy size={13} />
                          </button>
                          <button
                            onClick={() => setPrintModalLot(row)}
                            style={{ padding: '4px 8px', border: 'none', backgroundColor: '#334155', color: '#34d399', borderRadius: '6px', cursor: 'pointer' }}
                            title="Print Thermal Label"
                          >
                            <Printer size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ─── MASTER PART CRUD MODAL (DB TABLE PERSISTED) ─── */}
      {isPartModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '560px', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '16px', padding: '24px', boxShadow: '0 20px 50px rgba(0,0,0,0.6)' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#f8fafc', margin: '0 0 16px 0' }}>
              {editingPart ? 'EDIT MASTER PART (TABLE: lot_master_parts)' : 'TAMBAH MASTER PART BARU'}
            </h2>

            <form onSubmit={handleSavePartForm} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '4px' }}>Customer Name</label>
                <input
                  type="text"
                  placeholder="e.g. PT. Toyota Motor"
                  value={partForm.customer}
                  onChange={e => setPartForm({ ...partForm, customer: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', backgroundColor: '#0f172a', color: '#f8fafc', border: '1px solid #334155', borderRadius: '8px', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '4px' }}>Part No *</label>
                  <input
                    type="text"
                    required
                    placeholder="PN-9901"
                    value={partForm.part_no}
                    onChange={e => setPartForm({ ...partForm, part_no: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', backgroundColor: '#0f172a', color: '#f8fafc', border: '1px solid #334155', borderRadius: '8px', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '4px' }}>Mark Prefix *</label>
                  <input
                    type="text"
                    required
                    placeholder="092"
                    value={partForm.mark}
                    onChange={e => setPartForm({ ...partForm, mark: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', backgroundColor: '#0f172a', color: '#f8fafc', border: '1px solid #334155', borderRadius: '8px', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '4px' }}>Part Name</label>
                <input
                  type="text"
                  placeholder="Engine Cover Mount"
                  value={partForm.part_name}
                  onChange={e => setPartForm({ ...partForm, part_name: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', backgroundColor: '#0f172a', color: '#f8fafc', border: '1px solid #334155', borderRadius: '8px', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '4px' }}>Sequence Type</label>
                <select
                  value={partForm.sequence_type}
                  onChange={e => setPartForm({ ...partForm, sequence_type: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', backgroundColor: '#0f172a', color: '#f8fafc', border: '1px solid #334155', borderRadius: '8px', fontSize: '0.82rem', outline: 'none', cursor: 'pointer' }}
                >
                  <option value="Normal">Normal (1, 2, 3, 4...)</option>
                  <option value="Odd">Odd / Ganjil (1, 3, 5, 7...)</option>
                  <option value="Even">Even / Genap (2, 4, 6, 8...)</option>
                </select>
              </div>

              {/* EXISTING MASTER PARTS TABLE */}
              <div style={{ marginTop: '10px', maxHeight: '180px', overflowY: 'auto', border: '1px solid #334155', borderRadius: '8px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.73rem', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#0f172a', color: '#94a3b8' }}>
                      <th style={{ padding: '6px 8px' }}>Part No</th>
                      <th style={{ padding: '6px 8px' }}>Mark</th>
                      <th style={{ padding: '6px 8px' }}>Seq</th>
                      <th style={{ padding: '6px 8px', textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {masterParts.map(p => (
                      <tr key={p.id} style={{ borderBottom: '1px solid #334155' }}>
                        <td style={{ padding: '6px 8px', color: '#38bdf8', fontWeight: 700 }}>{p.part_no}</td>
                        <td style={{ padding: '6px 8px', color: '#f8fafc' }}>{p.mark}</td>
                        <td style={{ padding: '6px 8px', color: '#34d399' }}>{p.sequence_type}</td>
                        <td style={{ padding: '6px 8px', textAlign: 'right' }}>
                          <button type="button" onClick={() => handleEditPart(p)} style={{ border: 'none', background: 'none', color: '#38bdf8', cursor: 'pointer', marginRight: '6px' }}><Edit3 size={12} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsPartModalOpen(false)}
                  style={{ padding: '8px 16px', backgroundColor: 'transparent', border: '1px solid #334155', color: '#cbd5e1', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 20px', backgroundColor: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 900, cursor: 'pointer' }}
                >
                  Simpan Master Part
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── PRINT THERMAL LABEL MODAL ─── */}
      {printModalLot && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '420px', backgroundColor: '#ffffff', color: '#000000', borderRadius: '12px', padding: '24px', boxShadow: '0 25px 50px rgba(0,0,0,0.8)' }}>
            <div style={{ textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: '8px', marginBottom: '12px' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase' }}>MANDOR MES PRINT SYSTEM</div>
              <div style={{ fontSize: '0.6rem', color: '#64748b' }}>THERMAL BARCODE LABEL PREVIEW</div>
            </div>

            <div style={{ border: '2px solid #000', padding: '16px', borderRadius: '6px', fontFamily: 'monospace' }}>
              <div style={{ fontSize: '0.65rem', fontWeight: 800, borderBottom: '1px solid #000', paddingBottom: '4px', marginBottom: '8px' }}>
                CUSTOMER: {printModalLot.customer || 'STANDARD MES'}
              </div>
              <div style={{ fontSize: '0.75rem', fontWeight: 800 }}>PART NO: {printModalLot.partNo}</div>
              <div style={{ fontSize: '0.65rem', color: '#333', marginBottom: '10px' }}>NAME: {printModalLot.partName}</div>

              <div style={{ backgroundColor: '#f8fafc', padding: '10px', borderRadius: '4px', border: '1px solid #000', textAlign: 'center', marginBottom: '10px' }}>
                <div style={{ fontSize: '0.6rem', fontWeight: 800, color: '#475569' }}>LOT NUMBER</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 900, letterSpacing: '1px' }}>{printModalLot.lotNumber}</div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.6rem' }}>
                <div>MARK: {printModalLot.mark}</div>
                <div>DATE: {printModalLot.dateTime}</div>
              </div>

              <div style={{ marginTop: '12px', textAlign: 'center' }}>
                <svg width="180" height="36" viewBox="0 0 180 36">
                  <rect x="0" width="4" height="36" fill="#000" />
                  <rect x="6" width="2" height="36" fill="#000" />
                  <rect x="10" width="6" height="36" fill="#000" />
                  <rect x="18" width="3" height="36" fill="#000" />
                  <rect x="23" width="7" height="36" fill="#000" />
                  <rect x="32" width="4" height="36" fill="#000" />
                  <rect x="38" width="3" height="36" fill="#000" />
                  <rect x="43" width="8" height="36" fill="#000" />
                  <rect x="53" width="3" height="36" fill="#000" />
                  <rect x="58" width="5" height="36" fill="#000" />
                  <rect x="65" width="2" height="36" fill="#000" />
                  <rect x="69" width="6" height="36" fill="#000" />
                  <rect x="77" width="4" height="36" fill="#000" />
                  <rect x="83" width="3" height="36" fill="#000" />
                  <rect x="88" width="7" height="36" fill="#000" />
                  <rect x="97" width="2" height="36" fill="#000" />
                  <rect x="101" width="5" height="36" fill="#000" />
                  <rect x="108" width="3" height="36" fill="#000" />
                  <rect x="113" width="6" height="36" fill="#000" />
                  <rect x="121" width="4" height="36" fill="#000" />
                  <rect x="127" width="2" height="36" fill="#000" />
                  <rect x="131" width="5" height="36" fill="#000" />
                  <rect x="138" width="3" height="36" fill="#000" />
                  <rect x="143" width="6" height="36" fill="#000" />
                  <rect x="151" width="2" height="36" fill="#000" />
                  <rect x="155" width="7" height="36" fill="#000" />
                  <rect x="164" width="3" height="36" fill="#000" />
                  <rect x="170" width="4" height="36" fill="#000" />
                  <rect x="176" width="4" height="36" fill="#000" />
                </svg>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
              <button
                onClick={() => setPrintModalLot(null)}
                style={{ flex: 1, padding: '10px', backgroundColor: '#e2e8f0', color: '#1e293b', border: 'none', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
              >
                Tutup
              </button>
              <button
                onClick={() => {
                  window.print();
                  toast.success('Command sent to Thermal Printer');
                }}
                style={{ flex: 1, padding: '10px', backgroundColor: '#0284c7', color: '#ffffff', border: 'none', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                <Printer size={16} /> Print Label Thermal
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default LotGenerator;

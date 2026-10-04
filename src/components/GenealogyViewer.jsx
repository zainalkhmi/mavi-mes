import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GitBranch, Search, ShieldCheck, AlertOctagon, CheckCircle2, Lock, Unlock,
  Cpu, User, Clock, FileText, ChevronRight, Layers, ArrowLeft, RefreshCw,
  ExternalLink, Printer, Database, HardDrive, Wifi, WifiOff, AlertTriangle
} from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';
import { closedLoopQms } from '../services/closedLoopQms.js';
import { edgeEngine } from '../services/edgeStoreAndForward.js';

// Pre-configured rich ISA-95 sample genealogy dataset
const SAMPLE_GENEALOGY = {
  serialNo: 'SN-GBX-2026-0088',
  partNo: 'GBX-DUAL-9000',
  partName: 'Dual-Stage Planetary Gearbox Assembly',
  customer: 'PT Astra Honda Motor',
  workOrder: 'WO-2026-1004',
  status: 'PASS',
  releasedAt: '2026-10-02 14:30:00',
  rootNode: {
    id: 'node-root',
    level: 4,
    levelName: 'Final Assembly & EOL QA',
    partNo: 'GBX-DUAL-9000',
    serialNo: 'SN-GBX-2026-0088',
    station: 'Station 04 (Final Quality & Dyno Test)',
    operator: 'Budi Santoso (ID: OP-402)',
    timestamp: '2026-10-02 14:15:22',
    status: 'PASS',
    cpk: '1.68',
    checkSheetRef: 'CS-GBX-DUAL-9000-A',
    specs: [
      { param: 'Backlash Clearance', val: '0.042 mm', spec: '0.03 - 0.05 mm', status: 'OK' },
      { param: 'Output Torque Peak', val: '450.2 Nm', spec: '420 - 480 Nm', status: 'OK' },
      { param: 'Noise Level @ 3000 RPM', val: '64.5 dB', spec: '< 70 dB', status: 'OK' }
    ],
    children: [
      {
        id: 'node-sub-1',
        level: 3,
        levelName: 'Sub-Assembly 1: Planetary Carrier',
        partNo: 'SUB-CRR-450',
        serialNo: 'LOT-CRR-8921',
        station: 'Station 03 (CNC Milling & Deburring)',
        operator: 'Siti Rahma (ID: OP-308)',
        timestamp: '2026-10-02 11:40:10',
        status: 'PASS',
        cpk: '1.55',
        specs: [
          { param: 'Bore Diameter ØA', val: '45.008 mm', spec: '45.000 ± 0.012', status: 'OK' },
          { param: 'Perpendicularity to Datum B', val: '0.015 mm', spec: '< 0.020 mm', status: 'OK' }
        ],
        children: [
          {
            id: 'node-raw-1',
            level: 1,
            levelName: 'Raw Material: Forged Alloy Ingot',
            partNo: 'RAW-STL-4140',
            serialNo: 'HEAT-KOBE-99120',
            station: 'Receiving Dock & Spectrometry Lab',
            operator: 'Ahmad Dahlan (QA Material)',
            timestamp: '2026-09-28 09:15:00',
            status: 'PASS',
            supplier: 'Kobe Steel Ltd. (CoC #KS-2026-991)',
            specs: [
              { param: 'Carbon Content (C%)', val: '0.41%', spec: '0.38 - 0.43%', status: 'OK' },
              { param: 'Hardness (HRC)', val: '28.5 HRC', spec: '26 - 32 HRC', status: 'OK' }
            ]
          }
        ]
      },
      {
        id: 'node-sub-2',
        level: 3,
        levelName: 'Sub-Assembly 2: Sun Gear Shaft',
        partNo: 'SFT-SUN-220',
        serialNo: 'LOT-SUN-7741',
        station: 'Station 02 (CNC Gear Hobbing & Induction Hardening)',
        operator: 'Dimas Wicaksono (ID: OP-214)',
        timestamp: '2026-10-02 10:15:45',
        status: 'PASS',
        cpk: '1.72',
        specs: [
          { param: 'Tooth Involute Form Error', val: '0.006 mm', spec: '< 0.010 mm', status: 'OK' },
          { param: 'Case Hardness Depth', val: '1.25 mm', spec: '1.10 - 1.40 mm', status: 'OK' }
        ],
        children: [
          {
            id: 'node-raw-2',
            level: 1,
            levelName: 'Raw Material: Ground Steel Bar Stock',
            partNo: 'BAR-SCM440',
            serialNo: 'HEAT-NSSMC-5542',
            station: 'Warehouse Raw Material',
            operator: 'Gunawan (Logistics Lead)',
            timestamp: '2026-09-29 14:00:00',
            status: 'PASS',
            supplier: 'Nippon Steel Corp (CoC #NS-4491)',
            specs: [
              { param: 'Yield Strength', val: '865 MPa', spec: '> 835 MPa', status: 'OK' }
            ]
          }
        ]
      },
      {
        id: 'node-sub-3',
        level: 2,
        levelName: 'Sub-Assembly 3: Flange Housing Casting',
        partNo: 'HSG-FLG-900',
        serialNo: 'LOT-DIE-3301',
        station: 'Station 01 (Die Casting & Leakage Pressure Test)',
        operator: 'Rudi Hartono (ID: OP-105)',
        timestamp: '2026-10-02 08:30:12',
        status: 'PASS',
        cpk: '1.61',
        specs: [
          { param: 'Hydrostatic Leak Test (6 Bar)', val: '0.00 mbar/s', spec: '< 0.05 mbar/s', status: 'OK' }
        ],
        children: [
          {
            id: 'node-raw-3',
            level: 1,
            levelName: 'Raw Material: Aluminum Ingot ADC12',
            partNo: 'ING-ADC12',
            serialNo: 'LOT-INDOALUM-221',
            station: 'Melting Furnace Lab',
            operator: 'Triyono (Melter Lead)',
            timestamp: '2026-09-27 16:40:00',
            status: 'PASS',
            supplier: 'PT Inalum Persero',
            specs: [
              { param: 'Silicon Content (Si%)', val: '10.8%', spec: '9.6 - 12.0%', status: 'OK' }
            ]
          }
        ]
      }
    ]
  }
};

export default function GenealogyViewer() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('SN-GBX-2026-0088');
  const [selectedNode, setSelectedNode] = useState(SAMPLE_GENEALOGY.rootNode);
  const [genealogyData, setGenealogyData] = useState(SAMPLE_GENEALOGY);
  const [interlockState, setInterlockState] = useState({ isInterlockActive: false, incidents: [] });
  const [edgeStatus, setEdgeStatus] = useState({ isOnline: true, queueSize: 0, syncInProgress: false });

  // Listen to ClosedLoopQms & EdgeEngine
  useEffect(() => {
    const unsubQms = closedLoopQms.subscribe(setInterlockState);
    const unsubEdge = edgeEngine.subscribe(setEdgeStatus);
    return () => {
      unsubQms();
      unsubEdge();
    };
  }, []);

  // Simulate Closed-Loop Interlock defect
  const handleSimulateDefectInterlock = () => {
    closedLoopQms.triggerInterlock({
      incidentId: `INC-SIM-${Date.now()}`,
      timestamp: new Date().toISOString(),
      stationId: 'Station 04 (Final Quality & Dyno Test)',
      partNo: genealogyData.partNo,
      serialNo: genealogyData.serialNo,
      docNo: 'CS-GBX-DUAL-9000-A',
      inspector: 'Budi Santoso',
      reason: 'CRITICAL SPC FAIL: Backlash clearance exceeded 0.065mm (> max 0.050mm)',
      failedPoints: [{ pointNumber: 1, paramName: 'Backlash Clearance', isCritical: true, status: 'fail' }]
    });

    // Update root node status to QUARANTINED
    setGenealogyData(prev => ({
      ...prev,
      status: 'QUARANTINED',
      rootNode: {
        ...prev.rootNode,
        status: 'QUARANTINED',
        specs: prev.rootNode.specs.map(s => s.param.includes('Backlash') ? { ...s, val: '0.068 mm', status: 'CRITICAL_FAIL' } : s)
      }
    }));

    toast.error('🚨 SIMULASI INTERLOCK AKTIF! Mesin Stasiun 04 Dikunci Otomatis via PLC Interlock', { duration: 4000 });
  };

  const handleClearInterlock = () => {
    closedLoopQms.clearInterlock('QA-SUPERVISOR-LEAD', 'DISPOSITION_SAMPLE_RETESTED_OK');
    setGenealogyData(prev => ({
      ...prev,
      status: 'PASS',
      rootNode: {
        ...prev.rootNode,
        status: 'PASS',
        specs: prev.rootNode.specs.map(s => s.param.includes('Backlash') ? { ...s, val: '0.042 mm', status: 'OK' } : s)
      }
    }));
    toast.success('🔓 Interlock Mesin Dibuka Kembali oleh QA Supervisor');
  };

  const handleManualSyncEdge = () => {
    edgeEngine.flushQueue();
    toast.success('Store-and-Forward queue disinkronkan ke Cloud Server');
  };

  // Recursive Tree Node Renderer
  const renderTreeNode = (node, depth = 0) => {
    const isSelected = selectedNode?.id === node.id;
    const isQuarantined = node.status === 'QUARANTINED' || (depth === 0 && interlockState.isInterlockActive);

    const getBgColor = () => {
      if (isQuarantined) return '#fef2f2';
      if (isSelected) return '#eff6ff';
      return '#ffffff';
    };

    const getBorderColor = () => {
      if (isQuarantined) return '#ef4444';
      if (isSelected) return '#008784';
      return '#e2e8f0';
    };

    return (
      <div key={node.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {/* Node Card */}
        <div
          onClick={() => setSelectedNode(node)}
          style={{
            width: '280px',
            backgroundColor: getBgColor(),
            border: `1.5px solid ${getBorderColor()}`,
            borderRadius: '8px',
            padding: '12px',
            cursor: 'pointer',
            boxShadow: isSelected ? '0 0 0 3px rgba(0, 135, 132, 0.2), 0 4px 12px rgba(0,0,0,0.06)' : '0 2px 6px rgba(0,0,0,0.04)',
            transition: 'all 0.18s ease',
            position: 'relative'
          }}
        >
          {/* Level Header Tag */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{
              fontSize: '0.62rem',
              fontWeight: 800,
              padding: '2px 6px',
              borderRadius: '4px',
              backgroundColor: node.level === 4 ? '#714b67' : node.level === 3 ? '#008784' : '#64748b',
              color: '#ffffff',
              letterSpacing: '0.02em'
            }}>
              ISA-95 LEVEL {node.level}
            </span>

            <span style={{
              fontSize: '0.62rem',
              fontWeight: 800,
              padding: '2px 6px',
              borderRadius: '10px',
              backgroundColor: isQuarantined ? '#ef4444' : '#10b981',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              gap: '3px'
            }}>
              {isQuarantined ? <Lock size={10} /> : <CheckCircle2 size={10} />}
              {isQuarantined ? 'QUARANTINED' : 'PASS'}
            </span>
          </div>

          {/* Part & Serial Title */}
          <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#1e293b', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {node.partNo}
          </div>
          <div style={{ fontSize: '0.68rem', color: '#64748b', fontFamily: 'monospace', fontWeight: 700, marginBottom: '8px' }}>
            {node.serialNo}
          </div>

          {/* Metadata Snippet */}
          <div style={{ fontSize: '0.65rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: '2px', borderTop: '1px solid #f1f5f9', paddingTop: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Cpu size={12} color="#008784" />
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{node.station}</span>
            </div>
            {node.cpk && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <ShieldCheck size={12} color="#714b67" />
                <span>CPK: <strong>{node.cpk}</strong> (Min 1.33)</span>
              </div>
            )}
            {node.supplier && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <HardDrive size={12} color="#64748b" />
                <span style={{ color: '#0369a1', fontWeight: 600 }}>{node.supplier}</span>
              </div>
            )}
          </div>
        </div>

        {/* Children connector lines */}
        {node.children && node.children.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
            {/* Vertical connector down */}
            <div style={{ width: '2px', height: '24px', backgroundColor: '#cbd5e1' }} />
            
            {/* Horizontal Branch Bar */}
            <div style={{ display: 'flex', justifyContent: 'center', position: 'relative', width: '100%', gap: '24px' }}>
              {node.children.map((child) => (
                <div key={child.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ width: '2px', height: '16px', backgroundColor: '#cbd5e1' }} />
                  {renderTreeNode(child, depth + 1)}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      backgroundColor: '#f8fafc',
      color: '#1e293b',
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      overflow: 'hidden'
    }}>
      <Toaster position="top-right" />

      {/* ─── Top Header: Odoo Purple Theme ─── */}
      <div style={{
        height: '56px',
        backgroundColor: '#714b67',
        backgroundImage: 'linear-gradient(135deg, #714b67 0%, #5d3d54 100%)',
        padding: '0 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 2px 8px rgba(113, 75, 103, 0.25)',
        zIndex: 20
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              background: 'rgba(255, 255, 255, 0.15)',
              border: 'none',
              color: 'white',
              width: '32px',
              height: '32px',
              borderRadius: '7px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
            title="Kembali"
          >
            <ArrowLeft size={16} />
          </button>

          <div style={{
            width: '34px',
            height: '34px',
            backgroundColor: '#008784',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            boxShadow: '0 2px 6px rgba(0, 135, 132, 0.35)'
          }}>
            <GitBranch size={19} />
          </div>

          <div>
            <div style={{ fontWeight: 800, fontSize: '0.96rem', color: '#ffffff' }}>
              ISA-95 MULTI-TIER GENEALOGY & TRACEABILITY
            </div>
            <div style={{ fontSize: '0.65rem', color: '#e9d5ff' }}>
              As-Built Material Genealogy • Closed-Loop Quality • Siemens Opcenter Equivalent
            </div>
          </div>
        </div>

        {/* Right Status Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Edge Store & Forward Status Pill */}
          <div style={{
            backgroundColor: edgeStatus.isOnline ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
            border: `1px solid ${edgeStatus.isOnline ? '#10b981' : '#ef4444'}`,
            borderRadius: '16px',
            padding: '4px 10px',
            fontSize: '0.68rem',
            color: '#ffffff',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            {edgeStatus.isOnline ? <Wifi size={13} color="#10b981" /> : <WifiOff size={13} color="#ef4444" />}
            <span>{edgeStatus.isOnline ? 'Edge Online' : 'Edge Store-and-Forward'}</span>
            {edgeStatus.queueSize > 0 && (
              <span style={{ backgroundColor: '#f59e0b', color: '#000', padding: '1px 5px', borderRadius: '8px', fontSize: '0.6rem' }}>
                {edgeStatus.queueSize} buffer
              </span>
            )}
          </div>

          {/* Machine Interlock Status Badge */}
          <div style={{
            backgroundColor: interlockState.isInterlockActive ? '#ef4444' : 'rgba(255, 255, 255, 0.18)',
            border: `1px solid ${interlockState.isInterlockActive ? '#ffffff' : 'rgba(255, 255, 255, 0.3)'}`,
            borderRadius: '16px',
            padding: '4px 10px',
            fontSize: '0.68rem',
            color: '#ffffff',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            gap: '5px'
          }}>
            {interlockState.isInterlockActive ? <Lock size={13} /> : <Unlock size={13} />}
            <span>{interlockState.isInterlockActive ? '🔒 PLC INTERLOCK ACTIVE' : 'PLC Interlock: Normal'}</span>
          </div>

          {/* Simulate Defect Interlock Action */}
          {interlockState.isInterlockActive ? (
            <button
              onClick={handleClearInterlock}
              style={{
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                padding: '6px 12px',
                fontSize: '0.72rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                boxShadow: '0 2px 6px rgba(16, 185, 129, 0.4)'
              }}
            >
              <Unlock size={14} /> Reset Interlock
            </button>
          ) : (
            <button
              onClick={handleSimulateDefectInterlock}
              style={{
                backgroundColor: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                padding: '6px 12px',
                fontSize: '0.72rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                boxShadow: '0 2px 6px rgba(239, 68, 68, 0.4)'
              }}
            >
              <AlertTriangle size={14} /> Simulasi Defect & Interlock
            </button>
          )}
        </div>
      </div>

      {/* ─── Search & KPI Bar ─── */}
      <div style={{
        padding: '10px 20px',
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px'
      }}>
        {/* Search Input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, maxWidth: '520px' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '10px' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari Serial No, Lot Raw Material, atau Part Number..."
              style={{
                width: '100%',
                padding: '8px 12px 8px 34px',
                backgroundColor: '#f8fafc',
                border: '1.5px solid #cbd5e1',
                borderRadius: '6px',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: '#1e293b',
                outline: 'none'
              }}
            />
          </div>
          <button
            onClick={() => toast.success(`Hasil pohon silsilah ${searchQuery} dimuat`)}
            style={{
              padding: '8px 14px',
              backgroundColor: '#008784',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            Trace Silsilah
          </button>
        </div>

        {/* Quick As-Built Stats */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.72rem' }}>
          <div>
            <span style={{ color: '#64748b', display: 'block', fontSize: '0.62rem' }}>AS-BUILT PART</span>
            <strong style={{ color: '#1e293b' }}>{genealogyData.partName}</strong>
          </div>
          <div style={{ width: '1px', height: '24px', backgroundColor: '#e2e8f0' }} />
          <div>
            <span style={{ color: '#64748b', display: 'block', fontSize: '0.62rem' }}>WORK ORDER</span>
            <strong style={{ color: '#0369a1' }}>{genealogyData.workOrder}</strong>
          </div>
          <div style={{ width: '1px', height: '24px', backgroundColor: '#e2e8f0' }} />
          <div>
            <span style={{ color: '#64748b', display: 'block', fontSize: '0.62rem' }}>CUSTOMER</span>
            <strong>{genealogyData.customer}</strong>
          </div>
          <div style={{ width: '1px', height: '24px', backgroundColor: '#e2e8f0' }} />
          <div>
            <span style={{ color: '#64748b', display: 'block', fontSize: '0.62rem' }}>QC DISPOSITION</span>
            <span style={{
              backgroundColor: genealogyData.status === 'PASS' ? '#dcfce7' : '#fee2e2',
              color: genealogyData.status === 'PASS' ? '#166534' : '#991b1b',
              fontWeight: 800,
              padding: '2px 8px',
              borderRadius: '10px'
            }}>
              {genealogyData.status}
            </span>
          </div>
        </div>
      </div>

      {/* ─── Main Content Split: Tree Canvas (Left) + Node Inspector (Right) ─── */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 380px', overflow: 'hidden' }}>
        
        {/* Tree Canvas */}
        <div style={{
          backgroundColor: '#eef2f6',
          backgroundImage: 'radial-gradient(#cbd5e1 1.2px, transparent 1.2px)',
          backgroundSize: '24px 24px',
          overflow: 'auto',
          padding: '40px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start'
        }}>
          {renderTreeNode(genealogyData.rootNode)}
        </div>

        {/* Node Inspector Drawer */}
        <div style={{
          backgroundColor: '#ffffff',
          borderLeft: '1px solid #e2e8f0',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          {/* Drawer Header */}
          <div style={{
            padding: '14px 16px',
            backgroundColor: '#f8fafc',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div>
              <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#714b67', textTransform: 'uppercase', display: 'block' }}>
                Digital Passport Node
              </span>
              <strong style={{ fontSize: '0.92rem', color: '#1e293b' }}>
                {selectedNode ? selectedNode.partNo : 'Pilih Node'}
              </strong>
            </div>
            {selectedNode && (
              <span style={{
                fontSize: '0.68rem',
                fontWeight: 800,
                padding: '3px 8px',
                borderRadius: '10px',
                backgroundColor: selectedNode.status === 'PASS' ? '#dcfce7' : '#fee2e2',
                color: selectedNode.status === 'PASS' ? '#166534' : '#991b1b'
              }}>
                {selectedNode.status}
              </span>
            )}
          </div>

          {/* Node Details Content */}
          {selectedNode ? (
            <div style={{ flex: 1, overflow: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Basic Specs */}
              <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}>
                <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#008784', display: 'block', marginBottom: '8px' }}>
                  IDENTIFIKASI KOMPONEN (ISA-95)
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.72rem' }}>
                  <div>
                    <span style={{ color: '#64748b', fontSize: '0.62rem', display: 'block' }}>Serial / Lot No</span>
                    <strong>{selectedNode.serialNo}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', fontSize: '0.62rem', display: 'block' }}>Hirarki Level</span>
                    <strong>Level {selectedNode.level}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', fontSize: '0.62rem', display: 'block' }}>Work Center / Station</span>
                    <span>{selectedNode.station}</span>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', fontSize: '0.62rem', display: 'block' }}>Operator / Verifier</span>
                    <span>{selectedNode.operator}</span>
                  </div>
                </div>
              </div>

              {/* Inspection Parameters Table */}
              {selectedNode.specs && selectedNode.specs.length > 0 && (
                <div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#1e293b', display: 'block', marginBottom: '6px' }}>
                    Hasil Pengukuran Toleransi & GD&T:
                  </span>
                  <div style={{ border: '1px solid #cbd5e1', borderRadius: '6px', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.68rem' }}>
                      <thead style={{ backgroundColor: '#f1f5f9', color: '#475569', fontWeight: 700 }}>
                        <tr>
                          <th style={{ padding: '6px 8px', textAlign: 'left' }}>Parameter</th>
                          <th style={{ padding: '6px 8px', textAlign: 'left' }}>Hasil Ukur</th>
                          <th style={{ padding: '6px 8px', textAlign: 'left' }}>Standar</th>
                          <th style={{ padding: '6px 8px', textAlign: 'center' }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedNode.specs.map((s, idx) => (
                          <tr key={idx} style={{ borderTop: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '6px 8px', fontWeight: 600 }}>{s.param}</td>
                            <td style={{ padding: '6px 8px', fontFamily: 'monospace', fontWeight: 700, color: s.status === 'OK' ? '#0f172a' : '#ef4444' }}>{s.val}</td>
                            <td style={{ padding: '6px 8px', color: '#64748b' }}>{s.spec}</td>
                            <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                              <span style={{
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontSize: '0.6rem',
                                fontWeight: 800,
                                backgroundColor: s.status === 'OK' ? '#dcfce7' : '#fee2e2',
                                color: s.status === 'OK' ? '#166534' : '#991b1b'
                              }}>
                                {s.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Linked Digital Checksheet Reference */}
              {selectedNode.checkSheetRef && (
                <div style={{ backgroundColor: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <span style={{ fontSize: '0.62rem', color: '#714b67', fontWeight: 700, display: 'block' }}>TERIKAT DOKUMEN MUTU</span>
                      <strong style={{ fontSize: '0.8rem', color: '#581c87' }}>{selectedNode.checkSheetRef}</strong>
                    </div>
                    <button
                      onClick={() => navigate('/qa-checksheet')}
                      style={{
                        padding: '6px 10px',
                        backgroundColor: '#714b67',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      Buka Checksheet <ExternalLink size={12} />
                    </button>
                  </div>
                </div>
              )}

              {/* Certificate of Conformance Export Action */}
              <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
                <button
                  onClick={() => toast.success(`Mencetak Digital Certificate of Conformance (CoC) untuk ${selectedNode.serialNo}...`)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    backgroundColor: '#008784',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    boxShadow: '0 2px 6px rgba(0, 135, 132, 0.3)'
                  }}
                >
                  <Printer size={15} /> Cetak CoC & As-Built Dossier
                </button>
              </div>
            </div>
          ) : (
            <div style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>
              Pilih salah satu node pada grafik silsilah untuk melihat audit trail.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

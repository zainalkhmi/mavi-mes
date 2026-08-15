import React, { useState, useEffect } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Cpu,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Zap,
  Wrench,
  ShieldAlert,
  Sliders,
  RefreshCw,
  FileText,
  Radio,
  Gauge,
  Layers,
  Search,
  ArrowRight,
  Info,
  ChevronRight,
  HardDrive,
  Plus,
  Settings2,
  SlidersHorizontal,
  X,
  Server,
  Filter,
  Check
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import {
  getLivePredictiveMachines,
  generateFFTSpectrum,
  generateAiDiagnosticReport,
  toggleSafeSpeedDerating,
  createPredictiveWorkOrder,
  saveMachinePredictiveConfig
} from '../utils/predictiveMaintenanceService';
import MachineTagMapper from './MachineTagMapper';

const PredictiveMaintenanceManager = () => {
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMachineId, setSelectedMachineId] = useState('');
  const [fftSpectrum, setFftSpectrum] = useState([]);
  const [aiReport, setAiReport] = useState('');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [searchFilter, setSearchFilter] = useState('');

  // Modals
  const [isTagMapperOpen, setIsTagMapperOpen] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [configForm, setConfigForm] = useState({
    component: '',
    baselineVibrationRms: 1.0,
    criticalVibrationRms: 7.0,
    baselineTemp: 35,
    criticalTemp: 80,
    baselineCurrent: 10,
    criticalCurrent: 30,
    recommendedPart: ''
  });

  const loadLiveMachines = async () => {
    try {
      const list = await getLivePredictiveMachines();
      setMachines(list);
      if (list.length > 0) {
        setSelectedMachineId(prev => (prev && list.some(m => m.id === prev) ? prev : list[0].id));
      }
    } catch (err) {
      console.error('Failed to load live predictive machines:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLiveMachines();
  }, []);

  const selectedMachine = machines.find(m => m.id === selectedMachineId) || machines[0];

  useEffect(() => {
    if (selectedMachine) {
      const spectrum = generateFFTSpectrum(selectedMachine);
      setFftSpectrum(spectrum);
      fetchAiReport(selectedMachine);
      setConfigForm({
        component: selectedMachine.component || '',
        baselineVibrationRms: selectedMachine.baselineVibrationRms || 1.0,
        criticalVibrationRms: selectedMachine.criticalVibrationRms || 7.0,
        baselineTemp: selectedMachine.baselineTemp || 35,
        criticalTemp: selectedMachine.criticalTemp || 80,
        baselineCurrent: selectedMachine.baselineCurrent || 10,
        criticalCurrent: selectedMachine.criticalCurrent || 30,
        recommendedPart: selectedMachine.recommendedPart || ''
      });
    }
  }, [selectedMachineId]);

  // Periodic polling for live PLC/MQTT tags every 3 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      const list = await getLivePredictiveMachines();
      if (list.length > 0) {
        setMachines(list);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedMachine) {
      setFftSpectrum(generateFFTSpectrum(selectedMachine));
    }
  }, [selectedMachine?.currentTelemetry?.vibrationRms]);

  const fetchAiReport = async (machine) => {
    if (!machine) return;
    setIsGeneratingAi(true);
    try {
      const report = await generateAiDiagnosticReport(machine);
      setAiReport(report);
    } catch (e) {
      console.error('Failed to generate AI report:', e);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const handleToggleDerating = async () => {
    if (!selectedMachine) return;
    const nextState = !selectedMachine.deratedSpeedActive;
    const updated = await toggleSafeSpeedDerating(selectedMachine.id, nextState);
    setMachines(updated);
    showToast(nextState 
      ? `⚡ PLC Safe Speed Derating Aktif: Kecepatan ${selectedMachine.id} diturunkan 25% untuk mencegah kegagalan fatal.` 
      : `⚡ Kecepatan ${selectedMachine.id} dikembalikan ke nilai nominal.`
    );
  };

  const handleCreateWorkOrder = async () => {
    if (!selectedMachine) return;
    const { updatedMachines, workOrder } = await createPredictiveWorkOrder(selectedMachine);
    setMachines(updatedMachines);
    showToast(`📋 Maintenance Work Order ${workOrder.id} berhasil dijadwalkan.`);
  };

  const handleSaveThresholds = async (e) => {
    e.preventDefault();
    if (!selectedMachine) return;
    saveMachinePredictiveConfig(selectedMachine.id, {
      component: configForm.component,
      baselineVibrationRms: parseFloat(configForm.baselineVibrationRms),
      criticalVibrationRms: parseFloat(configForm.criticalVibrationRms),
      baselineTemp: parseFloat(configForm.baselineTemp),
      criticalTemp: parseFloat(configForm.criticalTemp),
      baselineCurrent: parseFloat(configForm.baselineCurrent),
      criticalCurrent: parseFloat(configForm.criticalCurrent),
      recommendedPart: configForm.recommendedPart
    });
    setIsConfigModalOpen(false);
    showToast(`⚙️ Parameter batas ambang untuk ${selectedMachine.id} berhasil disimpan.`);
    await loadLiveMachines();
  };

  // Fleet Overview Stats
  const totalMachines = machines.length;
  const criticalCount = machines.filter(m => m.status === 'CRITICAL').length;
  const warningCount = machines.filter(m => m.status === 'WARNING').length;
  const healthyCount = machines.filter(m => m.status === 'HEALTHY').length;
  const unmonitoredCount = machines.filter(m => m.status === 'UNMONITORED').length;

  const getStatusBadge = (status) => {
    if (status === 'CRITICAL') {
      return <span style={{ background: '#F8D7DA', color: '#842029', border: '1px solid #F5C2C7', padding: '3px 9px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 800 }}>CRITICAL</span>;
    }
    if (status === 'WARNING') {
      return <span style={{ background: '#FFF3CD', color: '#664D03', border: '1px solid #FFECB5', padding: '3px 9px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 800 }}>WARNING</span>;
    }
    if (status === 'UNMONITORED') {
      return <span style={{ background: '#E2E3E5', color: '#41464B', border: '1px solid #D3D6D8', padding: '3px 9px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 800 }}>NO SENSOR TAG</span>;
    }
    return <span style={{ background: '#D1E7DD', color: '#0F5132', border: '1px solid #BADBCC', padding: '3px 9px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 800 }}>HEALTHY</span>;
  };

  const filteredMachines = machines.filter(m => 
    m.name.toLowerCase().includes(searchFilter.toLowerCase()) || 
    m.id.toLowerCase().includes(searchFilter.toLowerCase()) ||
    (m.component && m.component.toLowerCase().includes(searchFilter.toLowerCase()))
  );

  return (
    <div style={{ backgroundColor: '#F8F9FA', color: '#212529', minHeight: '100%', padding: '24px 32px', boxSizing: 'border-box', overflowY: 'auto', fontFamily: "'Inter', system-ui, sans-serif" }}>
      
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '70px',
          right: '24px',
          background: '#714B67',
          border: '1px solid #5B3C53',
          color: 'white',
          padding: '14px 20px',
          borderRadius: '8px',
          boxShadow: '0 8px 24px rgba(113, 75, 103, 0.35)',
          zIndex: 9999,
          fontWeight: 700,
          fontSize: '0.88rem',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <Sparkles size={18} />
          {toastMessage}
        </div>
      )}

      {/* Odoo Control Panel Header */}
      <div style={{
        background: '#FFFFFF',
        border: '1px solid #E9ECEF',
        borderRadius: '10px',
        padding: '18px 24px',
        marginBottom: '22px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#714B67', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px' }}>
            <Cpu size={14} /> ODOO MES · PREDICTIVE MAINTENANCE & RUL ENGINE
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#212529', margin: 0 }}>
            Equipment Health & Remaining Useful Life
          </h1>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {selectedMachine && (
            <>
              <button
                type="button"
                onClick={() => setIsTagMapperOpen(true)}
                style={{
                  background: '#00A09D',
                  color: 'white',
                  border: 'none',
                  padding: '9px 16px',
                  borderRadius: '6px',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 1px 3px rgba(0,160,157,0.3)'
                }}
              >
                <SlidersHorizontal size={15} /> Map Sensor Tags
              </button>

              <button
                type="button"
                onClick={() => setIsConfigModalOpen(true)}
                style={{
                  background: '#FFFFFF',
                  color: '#495057',
                  border: '1px solid #CED4DA',
                  padding: '9px 14px',
                  borderRadius: '6px',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Settings2 size={15} /> Thresholds
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => { loadLiveMachines(); if (selectedMachine) fetchAiReport(selectedMachine); }}
            disabled={isGeneratingAi}
            style={{
              background: '#714B67',
              color: 'white',
              border: 'none',
              padding: '9px 16px',
              borderRadius: '6px',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 1px 3px rgba(113,75,103,0.3)'
            }}
          >
            <RefreshCw size={15} className={isGeneratingAi ? 'animate-spin' : ''} />
            {isGeneratingAi ? 'Analyzing Live Telemetry...' : 'Sync Sensor Tags'}
          </button>
        </div>
      </div>

      {/* Empty State if No Machines in DB */}
      {machines.length === 0 && !loading && (
        <div style={{
          background: '#FFFFFF',
          border: '1px dashed #CED4DA',
          borderRadius: '12px',
          padding: '60px 30px',
          textAlign: 'center',
          maxWidth: '600px',
          margin: '40px auto'
        }}>
          <HardDrive size={44} color="#714B67" style={{ margin: '0 auto 14px auto' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#212529', margin: '0 0 6px 0' }}>
            No Equipment Configured
          </h3>
          <p style={{ color: '#6C757D', fontSize: '0.9rem', margin: '0 0 20px 0' }}>
            Register your physical machines in the Machines database and connect their PLC or MQTT sensor tags to view real-time RUL.
          </p>
          <a
            href="#/machines"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: '#714B67',
              color: 'white',
              padding: '10px 20px',
              borderRadius: '6px',
              fontWeight: 700,
              fontSize: '0.85rem',
              textDecoration: 'none'
            }}
          >
            <Plus size={16} /> Register Physical Equipment
          </a>
        </div>
      )}

      {/* 4 Odoo KPI Metric Cards */}
      {machines.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '22px' }}>
          <div style={{ background: '#FFFFFF', border: '1px solid #E9ECEF', borderRadius: '10px', padding: '18px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#6C757D', fontSize: '0.8rem', fontWeight: 700 }}>
              <span>REGISTERED EQUIPMENT</span>
              <HardDrive size={16} color="#714B67" />
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#212529', marginTop: '4px' }}>{totalMachines} Assets</div>
            <span style={{ fontSize: '0.75rem', color: '#00A09D', fontWeight: 700 }}>{totalMachines - unmonitoredCount} Streaming Live Tags</span>
          </div>

          <div style={{ background: '#FFFFFF', border: '1px solid #F5C2C7', borderLeft: '4px solid #D9534F', borderRadius: '10px', padding: '18px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#842029', fontSize: '0.8rem', fontWeight: 700 }}>
              <span>CRITICAL ASSETS (RUL &lt; 24h)</span>
              <ShieldAlert size={16} color="#D9534F" />
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#D9534F', marginTop: '4px' }}>{criticalCount} Critical</div>
            <span style={{ fontSize: '0.75rem', color: '#842029', fontWeight: 600 }}>Requires Urgent Maintenance</span>
          </div>

          <div style={{ background: '#FFFFFF', border: '1px solid #FFECB5', borderLeft: '4px solid #D97706', borderRadius: '10px', padding: '18px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#664D03', fontSize: '0.8rem', fontWeight: 700 }}>
              <span>WARNING ASSETS</span>
              <AlertTriangle size={16} color="#D97706" />
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#D97706', marginTop: '4px' }}>{warningCount} Warnings</div>
            <span style={{ fontSize: '0.75rem', color: '#664D03', fontWeight: 600 }}>Scheduled PM in Progress</span>
          </div>

          <div style={{ background: '#FFFFFF', border: '1px solid #BADBCC', borderLeft: '4px solid #00A09D', borderRadius: '10px', padding: '18px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#0F5132', fontSize: '0.8rem', fontWeight: 700 }}>
              <span>OPTIMAL OPERATING</span>
              <CheckCircle2 size={16} color="#00A09D" />
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#00A09D', marginTop: '4px' }}>{healthyCount} Optimal</div>
            <span style={{ fontSize: '0.75rem', color: '#0F5132', fontWeight: 600 }}>Vibration within Baseline</span>
          </div>
        </div>
      )}

      {/* Equipment Selector Ribbon */}
      {machines.length > 0 && (
        <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '6px', marginBottom: '22px' }}>
          {machines.map(m => {
            const isSelected = m.id === selectedMachineId;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setSelectedMachineId(m.id)}
                style={{
                  background: isSelected ? 'rgba(113, 75, 103, 0.08)' : '#FFFFFF',
                  border: isSelected ? '2px solid #714B67' : '1px solid #E9ECEF',
                  borderRadius: '10px',
                  padding: '12px 18px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  minWidth: '240px',
                  transition: 'all 0.15s',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#6C757D' }}>{m.name}</span>
                  {getStatusBadge(m.status)}
                </div>
                <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#212529', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.component}</div>
                <div style={{ fontSize: '0.75rem', color: '#714B67', marginTop: '4px', fontWeight: 700 }}>
                  {m.status === 'UNMONITORED' ? 'Map Tags in Settings' : `Health: ${m.healthIndex}% · RUL: ${m.rulHours}h`}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Selected Asset Deep Dive Cockpit */}
      {selectedMachine && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 0.85fr', gap: '22px', marginBottom: '24px' }}>
          
          {/* Left Column: Gauges, Health Index & FFT Spectrum */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            
            {/* Health Index & RUL Banner */}
            <div style={{
              background: '#FFFFFF',
              border: selectedMachine.status === 'CRITICAL' ? '2px solid #D9534F' : '1px solid #E9ECEF',
              borderRadius: '12px',
              padding: '22px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
            }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#6C757D', fontWeight: 700, textTransform: 'uppercase' }}>Monitored Component</span>
                <h3 style={{ margin: '3px 0 0 0', fontSize: '1.2rem', color: '#212529', fontWeight: 800 }}>{selectedMachine.component}</h3>
                <span style={{ fontSize: '0.8rem', color: '#6C757D' }}>Nominal: {selectedMachine.nominalRpm} RPM · Work Center: {selectedMachine.line}</span>
              </div>

              {/* RUL Countdown Box */}
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.72rem', color: '#6C757D', fontWeight: 800, textTransform: 'uppercase' }}>Remaining Useful Life (RUL)</span>
                  <div style={{ fontSize: '1.9rem', fontWeight: 900, color: selectedMachine.status === 'CRITICAL' ? '#D9534F' : selectedMachine.status === 'WARNING' ? '#D97706' : selectedMachine.status === 'UNMONITORED' ? '#6C757D' : '#00A09D', lineHeight: 1.1 }}>
                    {selectedMachine.status === 'UNMONITORED' ? '—' : `${selectedMachine.rulHours} Hours`}
                  </div>
                  <span style={{ fontSize: '0.72rem', color: '#6C757D' }}>
                    {selectedMachine.status === 'UNMONITORED' ? 'Waiting for Live Tags' : `~${selectedMachine.rulCycles?.toLocaleString()} cycles left`}
                  </span>
                </div>

                <div style={{
                  width: '62px',
                  height: '62px',
                  borderRadius: '50%',
                  background: `conic-gradient(${selectedMachine.status === 'CRITICAL' ? '#D9534F' : selectedMachine.status === 'WARNING' ? '#D97706' : '#00A09D'} ${selectedMachine.healthIndex * 3.6}deg, #E9ECEF 0deg)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '5px'
                }}>
                  <div style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    backgroundColor: '#FFFFFF',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <span style={{ fontSize: '0.95rem', fontWeight: 900, color: '#212529' }}>{selectedMachine.healthIndex}%</span>
                    <span style={{ fontSize: '0.55rem', color: '#6C757D', fontWeight: 700 }}>HEALTH</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 4 Sensor Telemetry Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
              <div style={{ background: '#FFFFFF', border: '1px solid #E9ECEF', borderRadius: '10px', padding: '14px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                <span style={{ fontSize: '0.7rem', color: '#6C757D', fontWeight: 800 }}>VIBRATION RMS</span>
                <div style={{ fontSize: '1.2rem', fontWeight: 900, color: selectedMachine.currentTelemetry.vibrationRms > selectedMachine.criticalVibrationRms * 0.75 ? '#D9534F' : '#00A09D', marginTop: '2px' }}>
                  {selectedMachine.currentTelemetry.vibrationRms} <span style={{ fontSize: '0.75rem' }}>mm/s</span>
                </div>
                <span style={{ fontSize: '0.65rem', color: '#6C757D' }}>Limit: {selectedMachine.criticalVibrationRms} mm/s</span>
              </div>

              <div style={{ background: '#FFFFFF', border: '1px solid #E9ECEF', borderRadius: '10px', padding: '14px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                <span style={{ fontSize: '0.7rem', color: '#6C757D', fontWeight: 800 }}>BEARING TEMP</span>
                <div style={{ fontSize: '1.2rem', fontWeight: 900, color: selectedMachine.currentTelemetry.temperature > selectedMachine.criticalTemp * 0.85 ? '#D9534F' : '#D97706', marginTop: '2px' }}>
                  {selectedMachine.currentTelemetry.temperature}°C
                </div>
                <span style={{ fontSize: '0.65rem', color: '#6C757D' }}>Limit: {selectedMachine.criticalTemp}°C</span>
              </div>

              <div style={{ background: '#FFFFFF', border: '1px solid #E9ECEF', borderRadius: '10px', padding: '14px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                <span style={{ fontSize: '0.7rem', color: '#6C757D', fontWeight: 800 }}>MOTOR CURRENT</span>
                <div style={{ fontSize: '1.2rem', fontWeight: 900, color: selectedMachine.currentTelemetry.currentA > selectedMachine.criticalCurrent * 0.85 ? '#D9534F' : '#714B67', marginTop: '2px' }}>
                  {selectedMachine.currentTelemetry.currentA} <span style={{ fontSize: '0.75rem' }}>A</span>
                </div>
                <span style={{ fontSize: '0.65rem', color: '#6C757D' }}>Limit: {selectedMachine.criticalCurrent} A</span>
              </div>

              <div style={{ background: '#FFFFFF', border: '1px solid #E9ECEF', borderRadius: '10px', padding: '14px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                <span style={{ fontSize: '0.7rem', color: '#6C757D', fontWeight: 800 }}>LIVE SPEED</span>
                <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#212529', marginTop: '2px' }}>
                  {selectedMachine.currentTelemetry.rpm} <span style={{ fontSize: '0.75rem' }}>RPM</span>
                </div>
                <span style={{ fontSize: '0.65rem', color: selectedMachine.deratedSpeedActive ? '#D97706' : '#6C757D', fontWeight: 700 }}>
                  {selectedMachine.deratedSpeedActive ? 'DERATED (-25%)' : 'NOMINAL SPEED'}
                </span>
              </div>
            </div>

            {/* Real-time FFT Frequency Spectrum Analyzer */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E9ECEF', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Radio size={16} color="#714B67" />
                  <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#212529' }}>Live FFT Vibration Frequency Spectrum (0 - 600 Hz)</span>
                </div>
                <div style={{ display: 'flex', gap: '10px', fontSize: '0.7rem', color: '#6C757D' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '8px', height: '8px', background: '#00A09D', borderRadius: '2px' }}></span> 1X/2X Fundamental</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '8px', height: '8px', background: '#D9534F', borderRadius: '2px' }}></span> Defect BPFO Harmonic</span>
                </div>
              </div>

              {/* Spectrum Chart Bar */}
              <div style={{ height: '130px', display: 'flex', alignItems: 'flex-end', gap: '3px', borderBottom: '1px solid #DEE2E6', paddingBottom: '4px' }}>
                {fftSpectrum.map((bin, i) => {
                  const maxH = 110;
                  const barH = Math.min(maxH, bin.amplitude * 24);
                  const isFaultFreq = (bin.freqHz >= 140 && bin.freqHz <= 160) || (bin.freqHz >= 380 && bin.freqHz <= 420);
                  const color = isFaultFreq && bin.amplitude > 1.2 ? '#D9534F' : bin.isPeak ? '#D97706' : '#00A09D';
                  
                  return (
                    <div
                      key={i}
                      title={`${bin.freqHz} Hz: ${bin.amplitude} mm/s`}
                      style={{
                        flex: 1,
                        height: `${Math.max(2, barH)}px`,
                        backgroundColor: color,
                        opacity: 0.9,
                        borderRadius: '2px 2px 0 0',
                        transition: 'height 0.25s ease'
                      }}
                    />
                  );
                })}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: '#6C757D', marginTop: '6px' }}>
                <span>0 Hz</span>
                <span>150 Hz (BPFO Bearing Defect Zone)</span>
                <span>300 Hz</span>
                <span>450 Hz (Gear Mesh)</span>
                <span>600 Hz</span>
              </div>
            </div>
          </div>

          {/* Right Column: AI Diagnostics & Closed-Loop Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            
            {/* AI Copilot Reliability Diagnostic Card */}
            <div style={{
              background: '#FFFFFF',
              border: '1px solid #E9ECEF',
              borderRadius: '12px',
              padding: '22px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#714B67', marginBottom: '12px' }}>
                  <Sparkles size={18} />
                  <span style={{ fontSize: '0.9rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    AI Copilot Reliability Diagnostics
                  </span>
                </div>

                <div style={{
                  background: '#F8F9FA',
                  border: '1px solid #E9ECEF',
                  borderRadius: '8px',
                  padding: '16px',
                  fontSize: '0.85rem',
                  color: '#495057',
                  lineHeight: '1.6',
                  maxHeight: '260px',
                  overflowY: 'auto'
                }}>
                  {isGeneratingAi ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#714B67' }}>
                      <RefreshCw size={16} className="animate-spin" />
                      <span>Synthesizing live sensor signals with AI Copilot...</span>
                    </div>
                  ) : (
                    <ReactMarkdown>{aiReport}</ReactMarkdown>
                  )}
                </div>
              </div>

              {/* Recommended Sparepart & Saving Box */}
              <div style={{ background: '#E6F6F6', border: '1px solid #BADBCC', borderRadius: '8px', padding: '14px', marginTop: '14px' }}>
                <div style={{ fontSize: '0.72rem', color: '#00A09D', fontWeight: 800, textTransform: 'uppercase' }}>Recommended Spare Part</div>
                <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#212529', marginTop: '2px' }}>{selectedMachine.recommendedPart}</div>
                <div style={{ fontSize: '0.72rem', color: '#6C757D', marginTop: '4px' }}>Impact: {selectedMachine.estCostSaving}</div>
              </div>

              {/* Closed-Loop Autonomous Control Actions */}
              <div style={{ marginTop: '18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#495057', textTransform: 'uppercase' }}>
                  Closed-Loop Autonomous Triggers
                </span>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={handleToggleDerating}
                    style={{
                      background: selectedMachine.deratedSpeedActive ? '#FFF3CD' : '#FFFFFF',
                      border: selectedMachine.deratedSpeedActive ? '1px solid #FFECB5' : '1px solid #CED4DA',
                      color: selectedMachine.deratedSpeedActive ? '#664D03' : '#495057',
                      padding: '10px 14px',
                      borderRadius: '6px',
                      fontWeight: 700,
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <Zap size={14} />
                    {selectedMachine.deratedSpeedActive ? 'Derating Active (-25%)' : 'Auto-Derate Speed'}
                  </button>

                  <button
                    type="button"
                    onClick={handleCreateWorkOrder}
                    disabled={selectedMachine.workOrderCreated}
                    style={{
                      background: selectedMachine.workOrderCreated ? '#D1E7DD' : '#714B67',
                      border: 'none',
                      color: selectedMachine.workOrderCreated ? '#0F5132' : 'white',
                      padding: '10px 14px',
                      borderRadius: '6px',
                      fontWeight: 700,
                      fontSize: '0.78rem',
                      cursor: selectedMachine.workOrderCreated ? 'default' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <FileText size={14} />
                    {selectedMachine.workOrderCreated ? 'WO Scheduled ✓' : 'Create Auto-WO'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fleet Monitored Machines Table */}
      {machines.length > 0 && (
        <div style={{ background: '#FFFFFF', border: '1px solid #E9ECEF', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#212529', fontWeight: 800 }}>Fleet Asset Health & RUL Status</h3>
              <span style={{ fontSize: '0.8rem', color: '#6C757D' }}>Live degradation telemetry tracked across all shop floor machines.</span>
            </div>

            <div style={{ position: 'relative', minWidth: '240px' }}>
              <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6C757D' }} />
              <input
                type="text"
                placeholder="Search equipment name..."
                value={searchFilter}
                onChange={e => setSearchFilter(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px 8px 34px',
                  background: '#FFFFFF',
                  border: '1px solid #CED4DA',
                  borderRadius: '6px',
                  color: '#212529',
                  fontSize: '0.82rem',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #E9ECEF', backgroundColor: '#F8F9FA', color: '#6C757D', textAlign: 'left', textTransform: 'uppercase', fontSize: '0.72rem', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '12px 14px' }}>Asset ID & Name</th>
                  <th style={{ padding: '12px 14px' }}>Component</th>
                  <th style={{ padding: '12px 14px' }}>Vibration RMS</th>
                  <th style={{ padding: '12px 14px' }}>Health Index</th>
                  <th style={{ padding: '12px 14px' }}>Remaining RUL</th>
                  <th style={{ padding: '12px 14px' }}>Status</th>
                  <th style={{ padding: '12px 14px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredMachines.map(m => (
                  <tr
                    key={m.id}
                    style={{
                      borderBottom: '1px solid #F1F3F5',
                      background: m.id === selectedMachineId ? 'rgba(113, 75, 103, 0.04)' : 'transparent',
                      cursor: 'pointer'
                    }}
                    onClick={() => setSelectedMachineId(m.id)}
                  >
                    <td style={{ padding: '12px 14px', fontWeight: 800, color: '#212529' }}>
                      {m.name}
                      <div style={{ fontSize: '0.72rem', color: '#6C757D', fontWeight: 500 }}>{m.id} · {m.line}</div>
                    </td>
                    <td style={{ padding: '12px 14px', color: '#495057' }}>{m.component}</td>
                    <td style={{ padding: '12px 14px', color: m.currentTelemetry.vibrationRms > m.criticalVibrationRms * 0.75 ? '#D9534F' : '#00A09D', fontWeight: 800 }}>
                      {m.currentTelemetry.vibrationRms} mm/s
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '60px', height: '6px', backgroundColor: '#E9ECEF', borderRadius: '10px', overflow: 'hidden' }}>
                          <div style={{
                            width: `${m.healthIndex}%`,
                            height: '100%',
                            backgroundColor: m.status === 'CRITICAL' ? '#D9534F' : m.status === 'WARNING' ? '#D97706' : '#00A09D'
                          }} />
                        </div>
                        <span style={{ fontWeight: 800, color: '#212529' }}>{m.healthIndex}%</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px', fontWeight: 800, color: m.status === 'CRITICAL' ? '#D9534F' : m.status === 'WARNING' ? '#D97706' : m.status === 'UNMONITORED' ? '#6C757D' : '#00A09D' }}>
                      {m.status === 'UNMONITORED' ? '—' : `${m.rulHours} Hours`}
                    </td>
                    <td style={{ padding: '12px 14px' }}>{getStatusBadge(m.status)}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setSelectedMachineId(m.id); }}
                        style={{
                          background: '#FFFFFF',
                          border: '1px solid #CED4DA',
                          color: '#714B67',
                          padding: '5px 12px',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        Inspect <ChevronRight size={12} style={{ display: 'inline', verticalAlign: 'middle' }} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Machine Tag Mapper Modal Integration */}
      {selectedMachine && (
        <MachineTagMapper
          isOpen={isTagMapperOpen}
          machine={selectedMachine}
          onClose={() => setIsTagMapperOpen(false)}
          onSave={async () => {
            setIsTagMapperOpen(false);
            showToast(`Tag sensor untuk ${selectedMachine.name} berhasil dipetakan!`);
            await loadLiveMachines();
          }}
        />
      )}

      {/* Machine Thresholds & Limits Modal */}
      {isConfigModalOpen && selectedMachine && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '500px',
            padding: '26px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
            position: 'relative'
          }}>
            <button
              type="button"
              onClick={() => setIsConfigModalOpen(false)}
              style={{ position: 'absolute', top: '18px', right: '18px', background: 'transparent', border: 'none', color: '#6C757D', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#714B67', marginBottom: '6px' }}>
              <Settings2 size={20} />
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#212529', fontWeight: 800 }}>
                Sensor Thresholds & Limits
              </h3>
            </div>
            <p style={{ color: '#6C757D', fontSize: '0.85rem', margin: '0 0 18px 0' }}>
              Set nominal baseline and critical failure thresholds for <strong>{selectedMachine.name}</strong>.
            </p>

            <form onSubmit={handleSaveThresholds} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#495057', marginBottom: '4px', fontWeight: 700 }}>Monitored Component Name</label>
                <input
                  type="text"
                  required
                  value={configForm.component}
                  onChange={e => setConfigForm({ ...configForm, component: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', background: '#FFFFFF', border: '1px solid #CED4DA', borderRadius: '6px', color: '#212529', fontSize: '0.85rem', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#495057', marginBottom: '4px', fontWeight: 700 }}>Baseline Vib (mm/s)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={configForm.baselineVibrationRms}
                    onChange={e => setConfigForm({ ...configForm, baselineVibrationRms: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', background: '#FFFFFF', border: '1px solid #CED4DA', borderRadius: '6px', color: '#212529', fontSize: '0.85rem', outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#495057', marginBottom: '4px', fontWeight: 700 }}>Critical Vib Limit (mm/s)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={configForm.criticalVibrationRms}
                    onChange={e => setConfigForm({ ...configForm, criticalVibrationRms: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', background: '#FFFFFF', border: '1px solid #CED4DA', borderRadius: '6px', color: '#212529', fontSize: '0.85rem', outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#495057', marginBottom: '4px', fontWeight: 700 }}>Baseline Temp (°C)</label>
                  <input
                    type="number"
                    step="1"
                    required
                    value={configForm.baselineTemp}
                    onChange={e => setConfigForm({ ...configForm, baselineTemp: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', background: '#FFFFFF', border: '1px solid #CED4DA', borderRadius: '6px', color: '#212529', fontSize: '0.85rem', outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#495057', marginBottom: '4px', fontWeight: 700 }}>Critical Temp Limit (°C)</label>
                  <input
                    type="number"
                    step="1"
                    required
                    value={configForm.criticalTemp}
                    onChange={e => setConfigForm({ ...configForm, criticalTemp: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', background: '#FFFFFF', border: '1px solid #CED4DA', borderRadius: '6px', color: '#212529', fontSize: '0.85rem', outline: 'none' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#495057', marginBottom: '4px', fontWeight: 700 }}>Recommended Spare Part No.</label>
                <input
                  type="text"
                  placeholder="e.g. SKF Bearing 7014 CD/P4A"
                  value={configForm.recommendedPart}
                  onChange={e => setConfigForm({ ...configForm, recommendedPart: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', background: '#FFFFFF', border: '1px solid #CED4DA', borderRadius: '6px', color: '#212529', fontSize: '0.85rem', outline: 'none' }}
                />
              </div>

              <button
                type="submit"
                style={{
                  marginTop: '8px',
                  padding: '12px',
                  background: '#714B67',
                  border: 'none',
                  color: 'white',
                  borderRadius: '6px',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  cursor: 'pointer'
                }}
              >
                Save Thresholds Configuration
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default PredictiveMaintenanceManager;

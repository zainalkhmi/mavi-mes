import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Plus,
  ArrowLeft,
  ArrowRight,
  Menu,
  X,
  Sliders,
  Sparkles,
  Smartphone,
  Maximize2,
  Minimize2,
  Layers,
  Database,
  History,
  Activity
} from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';

export default function MachineActivityYieldTracker() {
  const navigate = useNavigate();

  // App step navigation: 'setup' | 'main' | 'downtime' | 'analytics'
  const [currentStep, setCurrentStep] = useState('setup');
  const [isMobileFrame, setIsMobileFrame] = useState(true);

  // Setup Step Variables
  const [orderId, setOrderId] = useState('ORD-2024-001');
  const [operationTimeHours, setOperationTimeHours] = useState(8);
  const [productDemand, setProductDemand] = useState(100);

  // Computed Takt & Production Rate
  const [plannedTaktTimeSec, setPlannedTaktTimeSec] = useState(288); // (8 * 3600) / 100 = 288s
  const [productionRatePerHour, setProductionRatePerHour] = useState(12.5); // 100 / 8 = 12.5 pcs/hr

  // Main Step State
  const [machineStatus, setMachineStatus] = useState('RUNNING'); // 'RUNNING' | 'DOWN' | 'IDLE' | 'OFF / BREAK' | 'SETUP / CHANGEOVER'
  const [goodPartsCount, setGoodPartsCount] = useState(0);
  const [defectsCount, setDefectsCount] = useState(0);
  const [quantityToAdd, setQuantityToAdd] = useState(1);
  const [cycleTimeSec, setCycleTimeSec] = useState(0);
  const [downtimeReason, setDowntimeReason] = useState('');

  // Station and Event Timer
  const [eventDurationSec, setEventDurationSec] = useState(0);
  const [totalRunningTimeSec, setTotalRunningTimeSec] = useState(180);
  const [totalDownTimeSec, setTotalDownTimeSec] = useState(180);
  const [totalIdleTimeSec, setTotalIdleTimeSec] = useState(60);

  // Event Log Records (Station Activity History)
  const [historyRecords, setHistoryRecords] = useState([
    {
      id: 'EVT-001',
      hourBlock: '10:00 - 11:00',
      status: 'RUNNING',
      downtimeReason: '',
      durationSec: 180,
      formattedDuration: '00:03:00',
      station: 'Assembly Station 1',
      actual: 15,
      target: 15,
      defects: 1,
      productId: 'ORD-2024-001'
    },
    {
      id: 'EVT-002',
      hourBlock: '11:00 - 12:00',
      status: 'DOWN',
      downtimeReason: 'Machine error',
      durationSec: 180,
      formattedDuration: '00:03:00',
      station: 'Assembly Station 1',
      actual: 0,
      target: 0,
      defects: 0,
      productId: 'ORD-2024-001'
    }
  ]);

  // Real-time Event Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setEventDurationSec(prev => prev + 1);
      if (machineStatus === 'RUNNING') {
        setTotalRunningTimeSec(prev => prev + 1);
      } else if (machineStatus === 'DOWN') {
        setTotalDownTimeSec(prev => prev + 1);
      } else if (machineStatus === 'IDLE') {
        setTotalIdleTimeSec(prev => prev + 1);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [machineStatus]);

  // Real-time Yield Calculation: (Good Parts) / (Good Parts + Defects) * 100
  const yieldPercentage = useMemo(() => {
    const totalProduced = goodPartsCount + defectsCount;
    if (totalProduced === 0) return '100.00%';
    const pct = (goodPartsCount / totalProduced) * 100;
    return `${pct.toFixed(2)}%`;
  }, [goodPartsCount, defectsCount]);

  // Overall Uptime & Downtime Percentage
  const analyticsSummary = useMemo(() => {
    const totalTime = totalRunningTimeSec + totalDownTimeSec + totalIdleTimeSec || 1;
    const uptimePct = ((totalRunningTimeSec / totalTime) * 100).toFixed(2);
    const downtimePct = ((totalDownTimeSec / totalTime) * 100).toFixed(2);
    const totalParts = goodPartsCount + defectsCount;
    const fpy = totalParts > 0 ? ((goodPartsCount / totalParts) * 100).toFixed(2) : '100.00';
    return {
      uptimePct: `${uptimePct}%`,
      downtimePct: `${downtimePct}%`,
      fpy: `${fpy}%`
    };
  }, [totalRunningTimeSec, totalDownTimeSec, totalIdleTimeSec, goodPartsCount, defectsCount]);

  // Step 1: Start Production
  const handleStartProduction = (e) => {
    if (e) e.preventDefault();
    const opHours = parseFloat(operationTimeHours) || 8;
    const demand = parseInt(productDemand, 10) || 100;
    const totalSec = opHours * 3600;
    const takt = Math.round(totalSec / demand);
    const rate = +(demand / opHours).toFixed(1);

    setPlannedTaktTimeSec(takt);
    setProductionRatePerHour(rate);
    setMachineStatus('RUNNING');
    setEventDurationSec(0);

    // Create Initial Record in Station Activity History
    const newRecord = {
      id: `EVT-${Date.now().toString().slice(-4)}`,
      hourBlock: `${new Date().getHours()}:00 - ${new Date().getHours() + 1}:00`,
      status: 'RUNNING',
      downtimeReason: '',
      durationSec: 0,
      formattedDuration: '00:00:00',
      station: 'Station 1',
      actual: 0,
      target: demand,
      defects: 0,
      productId: orderId
    };
    setHistoryRecords(prev => [newRecord, ...prev]);

    toast.success(`Production started for ${orderId}!`);
    setCurrentStep('main');
  };

  // Step 2: Log Good Parts
  const handleLogGoodParts = () => {
    const qty = parseInt(quantityToAdd, 10) || 1;
    const newGood = goodPartsCount + qty;
    setGoodPartsCount(newGood);

    // Recalculate Cycle Time = Duration / Total Good Parts
    if (newGood > 0 && eventDurationSec > 0) {
      const calculatedCycle = Math.round(eventDurationSec / newGood);
      setCycleTimeSec(calculatedCycle);
    }

    toast.success(`+${qty} Good Part(s) Logged!`);
  };

  // Step 2: Log Defects
  const handleLogDefects = () => {
    const qty = parseInt(quantityToAdd, 10) || 1;
    setDefectsCount(prev => prev + qty);
    toast.error(`+${qty} Defect(s) Logged!`);
  };

  // Machine Status Switch
  const handleChangeStatus = (status) => {
    if (status === 'DOWN') {
      setCurrentStep('downtime');
    } else {
      setMachineStatus(status);
      setDowntimeReason('');
      setEventDurationSec(0);
      toast.success(`Status changed to ${status}`);
    }
  };

  // Step 3: Select Downtime Reason
  const handleSelectDowntimeReason = (reason) => {
    setDowntimeReason(reason);
    setMachineStatus('DOWN');
    setEventDurationSec(0);

    // Append Downtime event record
    const newRecord = {
      id: `EVT-${Date.now().toString().slice(-4)}`,
      hourBlock: `${new Date().getHours()}:00 - ${new Date().getHours() + 1}:00`,
      status: 'DOWN',
      downtimeReason: reason,
      durationSec: 0,
      formattedDuration: '00:00:00',
      station: 'Station 1',
      actual: 0,
      target: 0,
      defects: 0,
      productId: orderId
    };
    setHistoryRecords(prev => [newRecord, ...prev]);

    toast.error(`Machine DOWN: ${reason}`);
    setCurrentStep('main');
  };

  // Finish Production
  const handleFinishProduction = () => {
    toast.success('Production finished successfully!');
    setCurrentStep('analytics');
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0f172a',
      color: '#0f172a',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: isMobileFrame ? '20px 10px' : '0',
      boxSizing: 'border-box'
    }}>
      <Toaster position="top-center" />

      {/* TOP DESKTOP CONTROLS */}
      <div style={{
        width: '100%',
        maxWidth: isMobileFrame ? '420px' : '100%',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '12px',
        color: '#94a3b8',
        fontSize: '0.85rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: '#38bdf8', fontWeight: 800 }}>📱 MOBILE TEMPLATE</span>
          <span>| Machine Activity & Yield</span>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setIsMobileFrame(!isMobileFrame)}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: 'white',
              padding: '4px 10px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            {isMobileFrame ? <Maximize2 size={12} /> : <Smartphone size={12} />}
            {isMobileFrame ? 'Expand Screen' : 'Mobile Frame'}
          </button>
        </div>
      </div>

      {/* DEVICE FRAME CONTAINER */}
      <div style={{
        width: '100%',
        maxWidth: isMobileFrame ? '410px' : '100%',
        minHeight: isMobileFrame ? '760px' : '100vh',
        backgroundColor: '#f8fafc',
        borderRadius: isMobileFrame ? '24px' : '0',
        boxShadow: isMobileFrame ? '0 25px 50px -12px rgba(0, 0, 0, 0.7)' : 'none',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        border: isMobileFrame ? '4px solid #334155' : 'none',
        position: 'relative'
      }}>

        {/* ── TOP APP BAR (MATCHING SCREENSHOT 1:1) ── */}
        <div style={{
          backgroundColor: '#f1f5f9',
          borderBottom: '1px solid #cbd5e1',
          padding: '10px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          height: '52px',
          boxSizing: 'border-box'
        }}>
          {/* Left: Analytics Step Trigger Icon (active when not in setup) */}
          {currentStep !== 'setup' ? (
            <button
              onClick={() => setCurrentStep(currentStep === 'analytics' ? 'main' : 'analytics')}
              style={{
                background: currentStep === 'analytics' ? '#0f172a' : 'transparent',
                border: 'none',
                color: currentStep === 'analytics' ? 'white' : '#0f172a',
                padding: '6px',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="View Analytics Step"
            >
              <BarChart3 size={20} />
            </button>
          ) : (
            <div style={{ width: '28px' }} />
          )}

          {/* Center: Tulip Flower Logo */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }} onClick={() => setCurrentStep('setup')}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="#0f172a">
              <path d="M12 2L4 7v10l8 5 8-5V7l-8-5zm0 2.2l6 3.75v3.1l-6-3.75-6 3.75v-3.1l6-3.75zm-6 8.55l6 3.75 6-3.75v3.85l-6 3.75-6-3.75v-3.85z" />
            </svg>
          </div>

          {/* Right: Hamburger Menu */}
          <button
            onClick={() => setCurrentStep('analytics')}
            style={{
              background: 'none',
              border: 'none',
              color: '#0f172a',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <Menu size={22} />
          </button>
        </div>

        {/* ── STEP CONTENT AREA ── */}
        <div style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>

          {/* ========================================================================= */}
          {/* STEP 1: SELECT PRODUCT & TAKT TIME CALCULATOR (SCREENSHOT 1) */}
          {/* ========================================================================= */}
          {currentStep === 'setup' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
              <div style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '20px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                display: 'flex',
                flexDirection: 'column',
                gap: '18px'
              }}>
                <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#1e293b' }}>
                  Select Product
                </h2>

                <div>
                  <label style={{ display: 'block', fontSize: '0.92rem', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
                    Order ID
                  </label>
                  <input
                    type="text"
                    value={orderId}
                    onChange={e => setOrderId(e.target.value)}
                    placeholder="Enter Order ID"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.95rem',
                      fontWeight: 600,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <h3 style={{ margin: '10px 0 0 0', fontSize: '1.2rem', fontWeight: 800, color: '#1e293b' }}>
                  Takt Time Calculator
                </h3>

                <div>
                  <label style={{ display: 'block', fontSize: '0.92rem', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
                    Operation time (hr)
                  </label>
                  <input
                    type="number"
                    value={operationTimeHours}
                    onChange={e => setOperationTimeHours(e.target.value)}
                    step="0.5"
                    min="1"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.95rem',
                      fontWeight: 600,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.92rem', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
                    Product demand (pcs)
                  </label>
                  <input
                    type="number"
                    value={productDemand}
                    onChange={e => setProductDemand(e.target.value)}
                    min="1"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.95rem',
                      fontWeight: 600,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{
                  backgroundColor: '#f1f5f9',
                  borderRadius: '8px',
                  padding: '12px',
                  fontSize: '0.8rem',
                  color: '#475569',
                  lineHeight: 1.4
                }}>
                  ⏱️ <strong>Planned Takt Time:</strong> {Math.round((parseFloat(operationTimeHours || 8) * 3600) / parseInt(productDemand || 100, 10))} detik/unit
                  <br />
                  📊 <strong>Planned Rate:</strong> {(parseInt(productDemand || 100, 10) / parseFloat(operationTimeHours || 8)).toFixed(1)} pcs/jam
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 2: MAIN STEP (STATUS & OUTPUT LOGGER) (SCREENSHOT 2 - LEFT) */}
          {/* ========================================================================= */}
          {currentStep === 'main' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
              
              {/* Card 1: Header KPI Summary */}
              <div style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '12px 14px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.03)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b' }}>
                    Product ID: <em style={{ fontStyle: 'normal', color: '#2563eb' }}>{orderId}</em>
                  </span>
                </div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b', marginBottom: '10px' }}>
                  Status: <span style={{
                    color: machineStatus === 'RUNNING' ? '#16a34a' : machineStatus === 'DOWN' ? '#dc2626' : '#d97706',
                    fontWeight: 800
                  }}>{machineStatus} {downtimeReason ? `(${downtimeReason})` : ''}</span>
                </div>

                {/* 4 KPIs Row: Target, Yield, Takt time, Cycle Time */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '6px',
                  textAlign: 'center',
                  borderTop: '1px solid #f1f5f9',
                  paddingTop: '8px'
                }}>
                  <div>
                    <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700 }}>Target</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#0f172a', marginTop: '2px' }}>
                      {productDemand}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700 }}>Yield</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#16a34a', marginTop: '2px' }}>
                      {yieldPercentage}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700 }}>Takt time</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#0f172a', marginTop: '2px' }}>
                      {plannedTaktTimeSec}s
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700 }}>Cycle Time</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#2563eb', marginTop: '2px' }}>
                      {cycleTimeSec > 0 ? `${cycleTimeSec}s` : '--'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: Add Output (Defects & Good Parts) */}
              <div style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '14px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.03)'
              }}>
                <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#1e293b', marginBottom: '10px' }}>
                  Add output:
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr 1fr', gap: '8px', alignItems: 'center' }}>
                  <button
                    onClick={handleLogDefects}
                    style={{
                      backgroundColor: '#dc2626',
                      color: 'white',
                      border: 'none',
                      padding: '12px 6px',
                      borderRadius: '6px',
                      fontWeight: 800,
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                      textAlign: 'center',
                      lineHeight: 1.2
                    }}
                  >
                    Log defects
                  </button>

                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, marginBottom: '4px' }}>
                      Quantity to add
                    </div>
                    <input
                      type="number"
                      value={quantityToAdd}
                      onChange={e => setQuantityToAdd(e.target.value)}
                      min="1"
                      style={{
                        width: '100%',
                        padding: '8px',
                        textAlign: 'center',
                        fontSize: '1.1rem',
                        fontWeight: 800,
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <button
                    onClick={handleLogGoodParts}
                    style={{
                      backgroundColor: '#16a34a',
                      color: 'white',
                      border: 'none',
                      padding: '12px 6px',
                      borderRadius: '6px',
                      fontWeight: 800,
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                      textAlign: 'center',
                      lineHeight: 1.2
                    }}
                  >
                    Log good parts
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #f1f5f9' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#334155', fontWeight: 600 }}>
                    <span>Number of good parts:</span>
                    <strong style={{ color: '#16a34a', fontSize: '1rem' }}>{goodPartsCount}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#334155', fontWeight: 600 }}>
                    <span>Number of defects:</span>
                    <strong style={{ color: '#dc2626', fontSize: '1rem' }}>{defectsCount}</strong>
                  </div>
                </div>
              </div>

              {/* Card 3: Change Machine Status */}
              <div style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '14px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.03)'
              }}>
                <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#1e293b', marginBottom: '10px' }}>
                  Change machine status:
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button
                    onClick={() => handleChangeStatus('RUNNING')}
                    style={{
                      backgroundColor: '#16a34a',
                      color: 'white',
                      border: machineStatus === 'RUNNING' ? '3px solid #0f172a' : 'none',
                      padding: '10px',
                      borderRadius: '6px',
                      fontWeight: 800,
                      fontSize: '0.85rem',
                      cursor: 'pointer'
                    }}
                  >
                    RUNNING
                  </button>

                  <button
                    onClick={() => handleChangeStatus('DOWN')}
                    style={{
                      backgroundColor: '#dc2626',
                      color: 'white',
                      border: machineStatus === 'DOWN' ? '3px solid #0f172a' : 'none',
                      padding: '10px',
                      borderRadius: '6px',
                      fontWeight: 800,
                      fontSize: '0.85rem',
                      cursor: 'pointer'
                    }}
                  >
                    DOWN
                  </button>

                  <button
                    onClick={() => handleChangeStatus('IDLE')}
                    style={{
                      backgroundColor: '#eab308',
                      color: '#0f172a',
                      border: machineStatus === 'IDLE' ? '3px solid #0f172a' : 'none',
                      padding: '10px',
                      borderRadius: '6px',
                      fontWeight: 800,
                      fontSize: '0.85rem',
                      cursor: 'pointer'
                    }}
                  >
                    IDLE
                  </button>

                  <button
                    onClick={() => handleChangeStatus('OFF / BREAK')}
                    style={{
                      backgroundColor: '#94a3b8',
                      color: 'white',
                      border: machineStatus === 'OFF / BREAK' ? '3px solid #0f172a' : 'none',
                      padding: '10px',
                      borderRadius: '6px',
                      fontWeight: 800,
                      fontSize: '0.85rem',
                      cursor: 'pointer'
                    }}
                  >
                    OFF / BREAK
                  </button>

                  <button
                    onClick={() => handleChangeStatus('SETUP / CHANGEOVER')}
                    style={{
                      backgroundColor: '#2563eb',
                      color: 'white',
                      border: machineStatus === 'SETUP / CHANGEOVER' ? '3px solid #0f172a' : 'none',
                      padding: '10px',
                      borderRadius: '6px',
                      fontWeight: 800,
                      fontSize: '0.85rem',
                      cursor: 'pointer'
                    }}
                  >
                    SETUP / CHANGEOVER
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 3: SELECT DOWNTIME REASON (SCREENSHOT 2 - RIGHT) */}
          {/* ========================================================================= */}
          {currentStep === 'downtime' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
              <div style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '24px 20px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                display: 'flex',
                flexDirection: 'column',
                gap: '18px'
              }}>
                <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#1e293b' }}>
                  Select downtime reason
                </h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
                  <button
                    onClick={() => handleSelectDowntimeReason('Machine error')}
                    style={{
                      backgroundColor: '#dc2626',
                      color: 'white',
                      border: 'none',
                      padding: '14px',
                      borderRadius: '6px',
                      fontWeight: 800,
                      fontSize: '0.9rem',
                      cursor: 'pointer'
                    }}
                  >
                    Machine error
                  </button>

                  <button
                    onClick={() => handleSelectDowntimeReason('Raw material shortages')}
                    style={{
                      backgroundColor: '#dc2626',
                      color: 'white',
                      border: 'none',
                      padding: '14px',
                      borderRadius: '6px',
                      fontWeight: 800,
                      fontSize: '0.9rem',
                      cursor: 'pointer'
                    }}
                  >
                    Raw material shortages
                  </button>

                  <button
                    onClick={() => handleSelectDowntimeReason('Maintenance')}
                    style={{
                      backgroundColor: '#dc2626',
                      color: 'white',
                      border: 'none',
                      padding: '14px',
                      borderRadius: '6px',
                      fontWeight: 800,
                      fontSize: '0.9rem',
                      cursor: 'pointer'
                    }}
                  >
                    Maintenance
                  </button>

                  <button
                    onClick={() => handleSelectDowntimeReason('Tooling issue')}
                    style={{
                      backgroundColor: '#dc2626',
                      color: 'white',
                      border: 'none',
                      padding: '14px',
                      borderRadius: '6px',
                      fontWeight: 800,
                      fontSize: '0.9rem',
                      cursor: 'pointer'
                    }}
                  >
                    Tooling issue
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 4: REAL-TIME ANALYTICS STEP (SCREENSHOT 3) */}
          {/* ========================================================================= */}
          {currentStep === 'analytics' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
              
              {/* Top 3 KPIs */}
              <div style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '14px',
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                textAlign: 'center',
                boxShadow: '0 2px 4px rgba(0,0,0,0.03)'
              }}>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>Downtime %</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#dc2626', marginTop: '4px' }}>
                    {analyticsSummary.downtimePct}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>Uptime %</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0f172a', marginTop: '4px' }}>
                    {analyticsSummary.uptimePct}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>First pass yield %</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#16a34a', marginTop: '4px' }}>
                    {analyticsSummary.fpy}
                  </div>
                </div>
              </div>

              {/* Chart 1: Downtime reasons */}
              <div style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '14px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.03)'
              }}>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>
                  Downtime reasons
                </h3>

                <div style={{ height: '120px', width: '100%', position: 'relative' }}>
                  <svg width="100%" height="100%" viewBox="0 0 300 100" preserveAspectRatio="none">
                    <line x1="25" y1="20" x2="285" y2="20" stroke="#f1f5f9" strokeWidth="1" />
                    <line x1="25" y1="50" x2="285" y2="50" stroke="#f1f5f9" strokeWidth="1" />
                    <line x1="25" y1="80" x2="285" y2="80" stroke="#cbd5e1" strokeWidth="1" />
                    
                    <text x="18" y="83" fontSize="7" fill="#94a3b8" textAnchor="end">0</text>
                    <text x="290" y="83" fontSize="7" fill="#94a3b8" textAnchor="start">0%</text>

                    <rect x="70" y="40" width="35" height="40" fill="#dc2626" rx="2" />
                    <text x="87" y="93" fontSize="6.5" fill="#64748b" textAnchor="middle">Machine error</text>

                    <rect x="180" y="60" width="35" height="20" fill="#dc2626" rx="2" />
                    <text x="197" y="93" fontSize="6.5" fill="#64748b" textAnchor="middle">Shortages</text>
                  </svg>
                  <div style={{ textAlign: 'center', fontSize: '0.68rem', color: '#64748b' }}>
                    Downtime reason
                  </div>
                </div>
              </div>

              {/* Chart 2: Running and down events */}
              <div style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '14px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.03)'
              }}>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>
                  Running and down events
                </h3>

                <div style={{ height: '140px', width: '100%', position: 'relative' }}>
                  <svg width="100%" height="100%" viewBox="0 0 300 120" preserveAspectRatio="none">
                    <line x1="40" y1="20" x2="280" y2="20" stroke="#f1f5f9" strokeWidth="1" />
                    <line x1="40" y1="50" x2="280" y2="50" stroke="#f1f5f9" strokeWidth="1" />
                    <line x1="40" y1="80" x2="280" y2="80" stroke="#f1f5f9" strokeWidth="1" />
                    <line x1="40" y1="100" x2="280" y2="100" stroke="#cbd5e1" strokeWidth="1" />

                    <text x="35" y="23" fontSize="6" fill="#94a3b8" textAnchor="end">00:03:20</text>
                    <text x="35" y="53" fontSize="6" fill="#94a3b8" textAnchor="end">00:02:30</text>
                    <text x="35" y="83" fontSize="6" fill="#94a3b8" textAnchor="end">00:01:40</text>
                    <text x="35" y="103" fontSize="6" fill="#94a3b8" textAnchor="end">00:00:00</text>

                    {/* Stacked Bar: Blue (ERROR/DOWN) on bottom, Green (RUNNING) on top */}
                    <g transform="translate(100, 0)">
                      <rect x="0" y="60" width="100" height="40" fill="#4f81bd" />
                      <rect x="0" y="20" width="100" height="40" fill="#16a34a" />
                      <text x="50" y="112" fontSize="6.5" fill="#64748b" textAnchor="middle">Today Station Events</text>
                    </g>
                  </svg>
                  <div style={{ textAlign: 'center', fontSize: '0.65rem', color: '#64748b' }}>
                    Date Created
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* ── BOTTOM ACTION BAR ── */}
        <div style={{
          backgroundColor: '#f1f5f9',
          borderTop: '1px solid #cbd5e1',
          padding: '10px 16px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          boxSizing: 'border-box'
        }}>
          {currentStep === 'setup' && (
            <button
              onClick={handleStartProduction}
              style={{
                backgroundColor: '#2563eb',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '6px',
                fontWeight: 800,
                fontSize: '0.9rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                width: '100%',
                justifyContent: 'center'
              }}
            >
              <ArrowRight size={16} /> Start production
            </button>
          )}

          {currentStep === 'main' && (
            <button
              onClick={handleFinishProduction}
              style={{
                backgroundColor: '#2563eb',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '6px',
                fontWeight: 800,
                fontSize: '0.9rem',
                cursor: 'pointer',
                width: '100%'
              }}
            >
              Finish production
            </button>
          )}

          {currentStep === 'downtime' && (
            <button
              onClick={() => setCurrentStep('main')}
              style={{
                backgroundColor: 'transparent',
                color: '#2563eb',
                border: 'none',
                padding: '8px 16px',
                fontWeight: 800,
                fontSize: '0.9rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <ArrowLeft size={16} /> Previous
            </button>
          )}

          {currentStep === 'analytics' && (
            <button
              onClick={() => setCurrentStep('main')}
              style={{
                backgroundColor: 'transparent',
                color: '#2563eb',
                border: 'none',
                padding: '8px 16px',
                fontWeight: 800,
                fontSize: '0.9rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <ArrowLeft size={16} /> Previous
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
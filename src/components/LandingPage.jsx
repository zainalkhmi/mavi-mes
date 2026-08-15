import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Layout,
  Play,
  Settings,
  Zap,
  Database,
  Link2,
  Cpu,
  BarChart3,
  Activity,
  Eye,
  Users,
  CheckCircle2,
  ArrowRight,
  Lock,
  Monitor,
  Smartphone,
  ChevronRight,
  Sparkles,
  Menu,
  X,
  Gauge,
  Sliders,
  Terminal,
  Grid,
  Check,
  Star,
  HelpCircle,
  Copy,
  CheckCheck,
  Building2,
  ShieldCheck,
  FileText,
  Calendar,
  Layers,
  ChevronDown,
  Info,
  ExternalLink,
  PhoneCall,
  Flame,
  Globe2,
  Clock,
  TrendingUp,
  AlertTriangle,
  Server,
  Workflow,
  Camera,
  QrCode,
  SlidersHorizontal,
  DollarSign,
  Calculator,
  HardDrive,
  RefreshCw,
  CheckSquare
} from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Tab Navigation State: 'overview' | 'builder' | 'analytics' | 'iot' | 'features' | 'pricing' | 'faq'
  const [activeTab, setActiveTab] = useState('overview');

  // Pricing, FAQ, Modals & Demo Credentials States
  const [openFaqIndex, setOpenFaqIndex] = useState(0);
  const [copiedDemo, setCopiedDemo] = useState(false);
  const [isWalkthroughModalOpen, setIsWalkthroughModalOpen] = useState(false);
  const [isPilotModalOpen, setIsPilotModalOpen] = useState(false);
  const [modalSuccessMsg, setModalSuccessMsg] = useState('');
  const [walkthroughForm, setWalkthroughForm] = useState({ name: '', company: '', email: '', phone: '', preferredDate: '' });
  const [pilotForm, setPilotForm] = useState({ name: '', company: '', lines: '1', email: '', phone: '' });

  // ROI Calculator States (in Pricing Tab)
  const [roiWorkers, setRoiWorkers] = useState(60);
  const [roiDowntimeHours, setRoiDowntimeHours] = useState(15);

  // App Builder Simulator States
  const [simulatorWidgets, setSimulatorWidgets] = useState([
    { id: 1, type: 'header', text: 'Step 01: Assembly & QR Scan' },
    { id: 2, type: 'text', text: 'Scan product barcode to begin guided work instruction.' },
    { id: 3, type: 'button', text: 'Verify Quality Check' },
    { id: 4, type: 'gauge', text: 'Live Torque: 12.4 Nm [PASS]' }
  ]);
  const [mockAppColor, setMockAppColor] = useState('#2563eb');
  
  // Analytics Widget States
  const [activeMetric, setActiveMetric] = useState('oee'); // 'oee' | 'availability' | 'performance' | 'quality'
  
  // Live Connector States
  const [terminalFilter, setTerminalFilter] = useState('ALL');
  const [machineData, setMachineData] = useState({ temp: 42, speed: 1200, pressure: 6.2, vibration: 1.4, count: 1842 });
  const [terminalLogs, setTerminalLogs] = useState([
    { type: 'MQTT', text: '[MQTT] Broker connected: tcp://broker.mavi-mes.local:1883' },
    { type: 'OPC-UA', text: '[OPC-UA] Subscribed to ns=2;s=Line1.PLC.SpindleSpeed (1200 RPM)' },
    { type: 'EDGE', text: '[EDGE] Station-01 Tablet session active: Operator Budi (Shift A)' },
    { type: 'VISION', text: '[VISION] Defect inspection result: PASS (Confidence: 99.4%)' },
    { type: 'MQTT', text: '[MQTT] Topic factory/line1/temp payload: 42.1 °C' }
  ]);

  // Periodic updates for simulated machine data and terminal logs
  useEffect(() => {
    const interval = setInterval(() => {
      setMachineData(prev => ({
        temp: Math.min(90, Math.max(30, Math.round(prev.temp + (Math.random() - 0.5) * 3))),
        speed: Math.min(1800, Math.max(900, Math.round(prev.speed + (Math.random() - 0.5) * 80))),
        pressure: parseFloat(Math.min(10, Math.max(2, prev.pressure + (Math.random() - 0.5) * 0.3)).toFixed(1)),
        vibration: parseFloat(Math.min(5, Math.max(0.5, prev.vibration + (Math.random() - 0.5) * 0.2)).toFixed(1)),
        count: prev.count + 1
      }));

      const logTemplates = [
        { type: 'OPC-UA', text: `[OPC-UA] Node Line1.PLC.PartCounter incremented -> ${Math.floor(Math.random() * 500 + 1500)}` },
        { type: 'MQTT', text: `[MQTT] factory/line1/press payload: ${(Math.random() * 2 + 5.5).toFixed(1)} bar` },
        { type: 'EDGE', text: `[EDGE] WorkOrder WO-2026-088 step confirmed by operator` },
        { type: 'VISION', text: `[VISION] AI Camera barcode decoded: LOT-${Math.floor(Math.random() * 89999 + 10000)}` },
        { type: 'EDGE', text: `[EDGE] Andon Tower: GREEN status maintained on Station-02` }
      ];
      const randomLog = logTemplates[Math.floor(Math.random() * logTemplates.length)];
      setTerminalLogs(prev => [randomLog, ...prev.slice(0, 7)]);
    }, 2800);

    return () => clearInterval(interval);
  }, []);

  // Hash listener for direct tab navigation
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#', '').replace('/', '');
      if (['overview', 'builder', 'analytics', 'iot', 'capabilities', 'features', 'pricing', 'faq'].includes(hash)) {
        setActiveTab(hash === 'capabilities' ? 'features' : hash);
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const switchTab = (tabKey) => {
    setActiveTab(tabKey);
    window.location.hash = `#${tabKey}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const addWidgetToSimulator = (type) => {
    let text = '';
    if (type === 'button') text = 'Confirm Step Completion';
    if (type === 'input') text = 'Batch Serial Number Field';
    if (type === 'gauge') text = '98.5% Quality Meter';
    if (type === 'camera') text = 'AI Vision Defect Scan (OK)';
    
    setSimulatorWidgets(prev => [
      ...prev,
      { id: Date.now(), type, text }
    ]);
  };

  const removeWidget = (id) => {
    setSimulatorWidgets(prev => prev.filter(w => w.id !== id));
  };

  const getMetricColor = () => {
    if (activeMetric === 'oee') return '#38bdf8';
    if (activeMetric === 'availability') return '#f59e0b';
    if (activeMetric === 'performance') return '#a855f7';
    return '#10b981';
  };

  const calculateMonthlySavings = () => {
    // Basic ROI formula for display: (Workers * Rp 4.5jt avg salary * 0.10 efficiency gain) + (Downtime hours * Rp 1.5jt cost per hour)
    const laborSavings = roiWorkers * 4500000 * 0.12;
    const downtimeSavings = roiDowntimeHours * 1800000 * 4; // 4 weeks in a month
    const total = laborSavings + downtimeSavings;
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(total);
  };

  const tabsList = [
    { key: 'overview', label: 'Overview', icon: <Sparkles size={15} /> },
    { key: 'builder', label: 'App Builder', icon: <Layout size={15} /> },
    { key: 'analytics', label: 'Analytics & OEE', icon: <BarChart3 size={15} /> },
    { key: 'iot', label: 'IoT & Machines', icon: <Cpu size={15} /> },
    { key: 'features', label: 'Features', icon: <Zap size={15} /> },
    { key: 'pricing', label: 'Pricing & Value', icon: <Flame size={15} />, highlight: true },
    { key: 'faq', label: 'FAQ & Support', icon: <HelpCircle size={15} /> }
  ];

  return (
    <div style={{
      backgroundColor: '#0b0f19',
      color: '#cbd5e1',
      minHeight: '100vh',
      fontFamily: "'Inter', sans-serif",
      overflowX: 'hidden',
      position: 'relative'
    }}>
      {/* Ambient background glows */}
      <div style={{
        position: 'absolute',
        top: '-10%',
        left: '-10%',
        width: '60%',
        height: '60%',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(37, 99, 235, 0.15) 0%, rgba(0, 0, 0, 0) 70%)',
        filter: 'blur(90px)',
        zIndex: 0,
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '20%',
        right: '-10%',
        width: '50%',
        height: '50%',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(16, 185, 129, 0.1) 0%, rgba(0, 0, 0, 0) 70%)',
        filter: 'blur(100px)',
        zIndex: 0,
        pointerEvents: 'none'
      }} />

      {/* TOP PRIMARY NAVBAR */}
      <nav style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'rgba(11, 15, 25, 0.94)',
        backdropFilter: 'blur(14px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 36px',
        maxWidth: '1440px',
        margin: '0 auto',
        boxSizing: 'border-box',
        width: '100%'
      }}>
        {/* Brand Logo */}
        <div 
          onClick={() => switchTab('overview')} 
          style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
        >
          <div style={{
            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
            padding: '7px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
            display: 'flex',
            alignItems: 'center'
          }}>
            <Settings size={20} color="white" />
          </div>
          <span style={{
            fontSize: '1.3rem',
            fontWeight: 900,
            color: 'white',
            letterSpacing: '0.5px',
            background: 'linear-gradient(to right, #ffffff, #94a3b8)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            MAVI-MES
          </span>
        </div>

        {/* Right CTA Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }} className="desktop-only">
          <button
            onClick={() => navigate('/login')}
            style={{
              background: 'transparent',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'; e.currentTarget.style.borderColor = 'white'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)'; }}
          >
            Sign In
          </button>
          <button
            onClick={() => navigate('/login')}
            style={{
              background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              border: 'none',
              color: 'white',
              padding: '8px 18px',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.4)',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            Launch Platform <ArrowRight size={14} />
          </button>
        </div>

        {/* Mobile menu trigger */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            padding: '4px',
            display: 'none'
          }}
          className="mobile-toggle"
        >
          {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {/* MOBILE MENU DROPDOWN */}
      {mobileMenuOpen && (
        <div style={{
          position: 'fixed',
          top: '60px',
          left: 0,
          right: 0,
          backgroundColor: '#0b0f19',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '16px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          zIndex: 99,
          boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
        }}>
          {tabsList.map((tab) => (
            <button
              key={tab.key}
              onClick={() => { switchTab(tab.key); setMobileMenuOpen(false); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 12px',
                borderRadius: '8px',
                background: activeTab === tab.key ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                border: activeTab === tab.key ? '1px solid rgba(56, 189, 248, 0.4)' : 'none',
                color: activeTab === tab.key ? '#38bdf8' : '#cbd5e1',
                fontSize: '0.9rem',
                fontWeight: 700,
                textAlign: 'left',
                cursor: 'pointer'
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
          <div style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.08)', margin: '6px 0' }} />
          <button onClick={() => navigate('/login')} style={{ width: '100%', padding: '10px', background: '#2563eb', border: 'none', color: 'white', borderRadius: '8px', fontWeight: 700, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>Launch Platform <ArrowRight size={15} /></button>
        </div>
      )}

      {/* SINGLE PRIMARY STICKY TAB PILL BAR */}
      <div style={{
        position: 'sticky',
        top: '57px',
        zIndex: 90,
        backgroundColor: 'rgba(15, 23, 42, 0.88)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '10px 16px',
        display: 'flex',
        justifyContent: 'center'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          overflowX: 'auto',
          maxWidth: '100%',
          paddingBottom: '2px'
        }}>
          {tabsList.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => switchTab(tab.key)}
                style={{
                  background: isActive ? 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)' : 'rgba(255, 255, 255, 0.04)',
                  border: isActive ? '1px solid #3b82f6' : '1px solid rgba(255, 255, 255, 0.08)',
                  color: isActive ? 'white' : '#94a3b8',
                  padding: '7px 16px',
                  borderRadius: '100px',
                  fontWeight: isActive ? 800 : 600,
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: isActive ? '0 4px 12px rgba(37, 99, 235, 0.35)' : 'none'
                }}
                onMouseEnter={e => {
                  if (!isActive) {
                    e.currentTarget.style.color = 'white';
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    e.currentTarget.style.color = '#94a3b8';
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                  }
                }}
              >
                {tab.icon} {tab.label}
              </button>
            );
          })}
        </div>
      </div>
      {/* MAIN TAB CONTENT DISPLAY */}
      <main style={{ minHeight: 'calc(100vh - 160px)', paddingBottom: '40px' }}>

        {/* ========================================================================= */}
        {/* 1. TAB: OVERVIEW */}
        {/* ========================================================================= */}
        {activeTab === 'overview' && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            {/* Hero Section */}
            <section style={{
              maxWidth: '1200px',
              margin: '0 auto',
              padding: '60px 30px 40px 30px',
              textAlign: 'center',
              boxSizing: 'border-box'
            }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(59, 130, 246, 0.08)',
                border: '1px solid rgba(59, 130, 246, 0.25)',
                padding: '6px 16px',
                borderRadius: '30px',
                color: '#60a5fa',
                fontSize: '0.8rem',
                fontWeight: 700,
                marginBottom: '20px'
              }}>
                <Sparkles size={14} /> The Modern Frontline Operations & MES Ecosystem for Indonesian Factories
              </div>

              <h1 style={{
                fontSize: '3.4rem',
                lineHeight: 1.15,
                fontWeight: 900,
                color: 'white',
                maxWidth: '900px',
                margin: '0 auto 20px auto',
                letterSpacing: '-1px'
              }}>
                Build No-Code Factory Apps. <br />
                <span style={{
                  background: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 50%, #1d4ed8 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  Eliminate Paper & Master Real-Time OEE.
                </span>
              </h1>

              <p style={{
                fontSize: '1.15rem',
                lineHeight: '1.6',
                color: '#94a3b8',
                maxWidth: '720px',
                margin: '0 auto 36px auto',
                fontWeight: 500
              }}>
                Like Tulip, MAVI-MES gives manufacturing engineers the power to build custom operator guide apps, connect shop-floor PLCs, automate AI quality checks, and track live production telemetry—deployed in just 2 weeks.
              </p>

              {/* Action Buttons */}
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '14px',
                flexWrap: 'wrap',
                marginBottom: '36px'
              }}>
                <button
                  onClick={() => navigate('/login')}
                  style={{
                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                    border: 'none',
                    color: 'white',
                    padding: '14px 32px',
                    borderRadius: '10px',
                    fontWeight: 800,
                    fontSize: '0.95rem',
                    cursor: 'pointer',
                    boxShadow: '0 8px 24px rgba(37, 99, 235, 0.4)',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  Launch Platform Workspace <ArrowRight size={18} />
                </button>
                
                <button
                  onClick={() => switchTab('pricing')}
                  style={{
                    background: 'rgba(56, 189, 248, 0.1)',
                    border: '1px solid rgba(56, 189, 248, 0.35)',
                    color: '#38bdf8',
                    padding: '14px 28px',
                    borderRadius: '10px',
                    fontWeight: 800,
                    fontSize: '0.95rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <Flame size={18} /> View Transparent Pricing (Rp 3.5jt/mo)
                </button>
              </div>

              {/* Quick Credentials Info Bar */}
              <div style={{
                maxWidth: '560px',
                margin: '0 auto',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                padding: '12px 20px',
                fontSize: '0.85rem',
                color: '#94a3b8',
                display: 'flex',
                justifyContent: 'center',
                gap: '20px',
                alignItems: 'center'
              }}>
                <div><strong>Engineer:</strong> <span style={{ color: 'white', fontFamily: 'monospace' }}>engineer / 123</span></div>
                <div style={{ width: '1px', height: '14px', backgroundColor: 'rgba(255,255,255,0.15)' }}></div>
                <div><strong>Operator:</strong> <span style={{ color: 'white', fontFamily: 'monospace' }}>operator / 123</span></div>
              </div>
            </section>

            {/* Metric Highlights Banner */}
            <section style={{ maxWidth: '1200px', margin: '0 auto 50px auto', padding: '0 30px' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '16px',
                background: 'rgba(15, 23, 42, 0.7)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '18px',
                padding: '24px 32px'
              }}>
                {[
                  { value: '2 Weeks', label: 'Time to First Production Line Live', color: '#38bdf8' },
                  { value: '99.4%', label: 'First Pass Quality Yield Average', color: '#10b981' },
                  { value: '100% Bahasa', label: 'Indonesian Native Shop-Floor UI', color: '#f59e0b' },
                  { value: '0 Code', label: 'Drag-and-Drop Frontline App Creation', color: '#a855f7' }
                ].map((stat, i) => (
                  <div key={i} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.8rem', fontWeight: 900, color: stat.color, marginBottom: '4px' }}>{stat.value}</div>
                    <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>{stat.label}</div>
                  </div>
                ))}
              </div>
            </section>

            {/* 4 Interactive Feature Pillars */}
            <section style={{ maxWidth: '1200px', margin: '0 auto 60px auto', padding: '0 30px' }}>
              <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <h3 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'white', margin: '0 0 8px 0' }}>
                  Explore The Frontline Operating Suite
                </h3>
                <p style={{ color: '#94a3b8', fontSize: '0.95rem', margin: 0 }}>
                  Click any module to jump directly to its dedicated interactive deep-dive.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
                {[
                  { icon: <Layout size={22} color="#3b82f6" />, title: 'No-Code App Builder', desc: 'Build digital SOPs, inspection checklists, and operator terminals.', tab: 'builder', tag: 'Interactive Studio' },
                  { icon: <BarChart3 size={22} color="#10b981" />, title: 'Real-Time OEE Analytics', desc: 'Availability, Performance, Quality, and downtime root-cause pareto.', tab: 'analytics', tag: 'Live Cockpit' },
                  { icon: <Cpu size={22} color="#f59e0b" />, title: 'IoT & Machine Gateway', desc: 'MQTT, OPC-UA, Siemens/Mitsubishi PLCs, and edge node triggers.', tab: 'iot', tag: 'Edge Connectivity' },
                  { icon: <Zap size={22} color="#a855f7" />, title: 'Platform Capabilities', desc: 'Vision AI defect checks, relational BOM tables, and ERP sync.', tab: 'features', tag: 'Core Engines' }
                ].map((item, i) => (
                  <div
                    key={i}
                    onClick={() => switchTab(item.tab)}
                    style={{
                      background: 'rgba(15, 23, 42, 0.65)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '16px',
                      padding: '24px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                        <div>{item.icon}</div>
                        <span style={{ fontSize: '0.72rem', background: 'rgba(255,255,255,0.06)', padding: '3px 8px', borderRadius: '6px', color: '#cbd5e1' }}>{item.tag}</span>
                      </div>
                      <h4 style={{ color: 'white', margin: '0 0 8px 0', fontSize: '1.1rem', fontWeight: 800 }}>{item.title}</h4>
                      <p style={{ color: '#94a3b8', fontSize: '0.88rem', margin: 0, lineHeight: '1.5' }}>{item.desc}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#38bdf8', fontSize: '0.82rem', fontWeight: 700, marginTop: '20px' }}>
                      Explore Module <ChevronRight size={14} />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Industrial Sectors Grid */}
            <section style={{ maxWidth: '1200px', margin: '0 auto 60px auto', padding: '0 30px' }}>
              <div style={{
                background: 'rgba(15, 23, 42, 0.5)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '20px',
                padding: '36px'
              }}>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'white', margin: '0 0 20px 0', textAlign: 'center' }}>
                  Proven Across Key Indonesian Manufacturing Sectors
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                  {[
                    { title: 'Automotive & Metal Parts', desc: 'Poka-yoke assembly steps, torque gun data logging, and defect logging.' },
                    { title: 'Electronics & PCBA', desc: 'Serial lot tracking, barcode scanning, and inline camera OCR inspection.' },
                    { title: 'Food, Beverage & Pharma', desc: 'Digital batch records, hygiene 5S audit logs, and ingredient scale integration.' },
                    { title: 'Plastics & Packaging', desc: 'Injection mold changeover tracking, scrap rate pareto, and shift handovers.' }
                  ].map((sec, idx) => (
                    <div key={idx} style={{ background: 'rgba(255,255,255,0.02)', padding: '18px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <strong style={{ color: '#38bdf8', display: 'block', marginBottom: '6px', fontSize: '0.95rem' }}>{sec.title}</strong>
                      <p style={{ color: '#94a3b8', fontSize: '0.82rem', margin: 0, lineHeight: '1.4' }}>{sec.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 2. TAB: APP BUILDER */}
        {/* ========================================================================= */}
        {activeTab === 'builder' && (
          <div style={{ animation: 'fadeIn 0.3s ease', maxWidth: '1280px', margin: '0 auto', padding: '40px 30px' }}>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa', padding: '6px 16px', borderRadius: '100px', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '14px' }}>
                <Layout size={14} /> NO-CODE FRONTLINE APP STUDIO
              </div>
              <h2 style={{ fontSize: '2.6rem', fontWeight: 900, color: 'white', margin: '0 0 12px 0' }}>
                Build Frontline Operator Apps in Minutes — Without Writing Code
              </h2>
              <p style={{ color: '#94a3b8', fontSize: '1.1rem', maxWidth: '750px', margin: '0 auto', lineHeight: '1.6' }}>
                Empower manufacturing engineers to design interactive step-by-step digital work instructions, automated quality gates, and operator terminals for touchscreens, tablets, and handhelds.
              </p>
            </div>

            {/* Interactive Visual App Studio Simulation */}
            <div style={{
              background: 'rgba(15, 23, 42, 0.7)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '24px',
              padding: '36px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
              marginBottom: '48px'
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '36px', alignItems: 'center' }} className="grid-responsive">
                {/* Left Side: Features & Live Control */}
                <div>
                  <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'white', margin: '0 0 16px 0' }}>
                    Visual Drag-and-Drop Frontline Canvas
                  </h3>
                  <p style={{ color: '#94a3b8', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '24px' }}>
                    Add rich media (CAD 3D models, PDF blueprints, video clips), form inputs, barcode verifiers, and live machine parameters directly onto steps.
                  </p>

                  {/* Interactive Palette */}
                  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', padding: '18px', marginBottom: '24px' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#e2e8f0', display: 'block', marginBottom: '10px', textTransform: 'uppercase' }}>
                      Try Adding Widgets to Emulated Screen:
                    </span>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button onClick={() => addWidgetToSimulator('button')} style={{ background: '#1e293b', border: '1px solid #334155', color: 'white', padding: '8px 12px', borderRadius: '8px', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>+ Action Button</button>
                      <button onClick={() => addWidgetToSimulator('input')} style={{ background: '#1e293b', border: '1px solid #334155', color: 'white', padding: '8px 12px', borderRadius: '8px', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>+ Barcode Input</button>
                      <button onClick={() => addWidgetToSimulator('gauge')} style={{ background: '#1e293b', border: '1px solid #334155', color: 'white', padding: '8px 12px', borderRadius: '8px', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>+ OEE Gauge</button>
                      <button onClick={() => addWidgetToSimulator('camera')} style={{ background: '#1e293b', border: '1px solid #334155', color: 'white', padding: '8px 12px', borderRadius: '8px', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>+ Vision AI Scan</button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                      onClick={() => navigate('/builder')}
                      style={{
                        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                        border: 'none',
                        color: 'white',
                        padding: '12px 24px',
                        borderRadius: '8px',
                        fontWeight: 800,
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      Open Live App Builder <Play size={15} fill="white" />
                    </button>
                  </div>
                </div>

                {/* Right Side: Simulated Tablet Viewport */}
                <div style={{
                  background: '#090d16',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '18px',
                  padding: '20px',
                  boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.6)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Smartphone size={14} color="#38bdf8" />
                      <span style={{ fontSize: '0.78rem', color: '#cbd5e1', fontWeight: 700 }}>Station-01 Terminal Live Preview</span>
                    </div>
                    <span style={{ fontSize: '0.72rem', color: '#10b981', background: 'rgba(16, 185, 129, 0.15)', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>RUNNING</span>
                  </div>

                  {/* Simulated App Canvas Content */}
                  <div style={{
                    minHeight: '240px',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px dashed rgba(255,255,255,0.15)',
                    borderRadius: '10px',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}>
                    {simulatorWidgets.map((widget) => (
                      <div
                        key={widget.id}
                        style={{
                          background: widget.type === 'button' ? mockAppColor : 'rgba(30, 41, 59, 0.75)',
                          color: 'white',
                          padding: '10px 14px',
                          borderRadius: '8px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          fontSize: widget.type === 'header' ? '0.95rem' : '0.85rem',
                          fontWeight: widget.type === 'header' ? 800 : 500,
                          border: '1px solid rgba(255,255,255,0.05)'
                        }}
                      >
                        <span>{widget.text}</span>
                        <button
                          onClick={() => removeWidget(widget.id)}
                          style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', padding: '2px' }}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 5 Pre-Built App Templates Gallery */}
            <div style={{ marginBottom: '48px' }}>
              <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'white', margin: '0 0 20px 0', textAlign: 'center' }}>
                Pre-Built Frontline Application Templates
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '18px' }}>
                {[
                  { title: 'High-Mix Digital SOP', desc: 'Interactive step navigation, 3D CAD viewer, and torque limits.', icon: <FileText size={20} color="#38bdf8" /> },
                  { title: 'Inline AI Vision QC', desc: 'Defect checks with webcam/IP camera and automated OCR.', icon: <Eye size={20} color="#10b981" /> },
                  { title: 'Machine 5S Checklist', desc: 'Daily autonomous maintenance checklists with photo evidence.', icon: <CheckSquare size={20} color="#f59e0b" /> },
                  { title: 'Material Receiving Lot', desc: 'Scan raw materials, generate lot numbers, and print barcodes.', icon: <QrCode size={20} color="#a855f7" /> },
                  { title: 'Scrap & Defect Logging', desc: 'One-tap defect categorization and immediate andon alert.', icon: <AlertTriangle size={20} color="#ec4899" /> }
                ].map((tmpl, i) => (
                  <div key={i} style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '14px', padding: '20px' }}>
                    <div style={{ marginBottom: '12px' }}>{tmpl.icon}</div>
                    <h4 style={{ color: 'white', margin: '0 0 6px 0', fontSize: '1rem', fontWeight: 800 }}>{tmpl.title}</h4>
                    <p style={{ color: '#94a3b8', fontSize: '0.82rem', margin: 0, lineHeight: '1.5' }}>{tmpl.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 3. TAB: ANALYTICS & OEE */}
        {/* ========================================================================= */}
        {activeTab === 'analytics' && (
          <div style={{ animation: 'fadeIn 0.3s ease', maxWidth: '1280px', margin: '0 auto', padding: '40px 30px' }}>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(16, 185, 129, 0.1)', color: '#34d399', padding: '6px 16px', borderRadius: '100px', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '14px' }}>
                <BarChart3 size={14} /> SHOP-FLOOR TELEMETRY & OEE INTELLIGENCE
              </div>
              <h2 style={{ fontSize: '2.6rem', fontWeight: 900, color: 'white', margin: '0 0 12px 0' }}>
                Live OEE Cockpits, Downtime Pareto & Shift Telemetry
              </h2>
              <p style={{ color: '#94a3b8', fontSize: '1.1rem', maxWidth: '750px', margin: '0 auto', lineHeight: '1.6' }}>
                Eliminate paper tally sheets and whiteboard logs. Uncover why lines stop, monitor First Pass Yield (FPY), and track operator efficiency in real time.
              </p>
            </div>

            {/* Interactive Live OEE Cockpit Simulation */}
            <div style={{
              background: 'rgba(15, 23, 42, 0.7)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '24px',
              padding: '36px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
              marginBottom: '48px'
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '36px', alignItems: 'center' }} className="grid-responsive-reverse">
                {/* Visual Chart & Cockpit */}
                <div style={{
                  background: '#090d16',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '18px',
                  padding: '24px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'white' }}>Line-01 Live Performance Cockpit</span>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {['oee', 'availability', 'performance', 'quality'].map(metric => (
                        <button
                          key={metric}
                          onClick={() => setActiveMetric(metric)}
                          style={{
                            background: activeMetric === metric ? getMetricColor() : '#1e293b',
                            color: 'white',
                            border: 'none',
                            padding: '4px 10px',
                            borderRadius: '6px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            textTransform: 'uppercase'
                          }}
                        >
                          {metric}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 3 OEE Core Factors */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '24px' }}>
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '10px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <span style={{ fontSize: '0.7rem', color: '#f59e0b', fontWeight: 800 }}>AVAILABILITY</span>
                      <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'white', marginTop: '2px' }}>92.4%</div>
                      <span style={{ fontSize: '0.65rem', color: '#64748b' }}>Target: 90%</span>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '10px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <span style={{ fontSize: '0.7rem', color: '#a855f7', fontWeight: 800 }}>PERFORMANCE</span>
                      <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'white', marginTop: '2px' }}>95.8%</div>
                      <span style={{ fontSize: '0.65rem', color: '#64748b' }}>Target: 95%</span>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '10px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <span style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 800 }}>QUALITY (FPY)</span>
                      <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'white', marginTop: '2px' }}>98.6%</div>
                      <span style={{ fontSize: '0.65rem', color: '#64748b' }}>Target: 98%</span>
                    </div>
                  </div>

                  {/* Hourly Output Bar Graph */}
                  <div style={{ height: '120px', display: 'flex', alignItems: 'flex-end', gap: '8px', paddingTop: '10px' }}>
                    {[70, 82, 88, 85, 92, 90, 94, 88, 91, 95, 89, 93].map((val, idx) => (
                      <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                        <div style={{ width: '100%', height: `${val}%`, backgroundColor: getMetricColor(), opacity: 0.85, borderRadius: '4px 4px 0 0', transition: 'all 0.3s' }}></div>
                        <span style={{ fontSize: '0.58rem', color: '#64748b', marginTop: '4px' }}>H{idx+1}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Left Side Explanation */}
                <div>
                  <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'white', margin: '0 0 14px 0' }}>
                    Full Traceability from Station to Factory Wallboard
                  </h3>
                  <p style={{ color: '#94a3b8', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '20px' }}>
                    Stop guessing your productivity. Every part scanned, every cycle completed, and every stop event is recorded in a high-speed relational database.
                  </p>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '28px' }}>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                      <div style={{ color: '#10b981', marginTop: '2px' }}><CheckCircle2 size={16} /></div>
                      <div style={{ fontSize: '0.9rem', color: '#cbd5e1' }}><strong style={{ color: 'white' }}>One-Tap Downtime Categorization:</strong> Operators tag micro-stoppages with cause codes directly on tablet.</div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                      <div style={{ color: '#10b981', marginTop: '2px' }}><CheckCircle2 size={16} /></div>
                      <div style={{ fontSize: '0.9rem', color: '#cbd5e1' }}><strong style={{ color: 'white' }}>Automated Shift Handover Reports:</strong> Generate instant PDF & Excel summaries for supervisors.</div>
                    </div>
                  </div>

                  <button
                    onClick={() => navigate('/analytics')}
                    style={{
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      border: 'none',
                      color: 'white',
                      padding: '12px 24px',
                      borderRadius: '8px',
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                  >
                    Open Live Analytics Workspace
                  </button>
                </div>
              </div>
            </div>

            {/* Downtime Pareto & Root-Cause Categories */}
            <div style={{
              background: 'rgba(15, 23, 42, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '20px',
              padding: '30px',
              marginBottom: '40px'
            }}>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'white', margin: '0 0 16px 0', textAlign: 'center' }}>
                Automated Downtime Pareto Analysis
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
                {[
                  { reason: 'Tool & Die Wear', pct: '38%', color: '#ef4444' },
                  { reason: 'Material Starvation', pct: '24%', color: '#f59e0b' },
                  { reason: 'Product Changeover', pct: '18%', color: '#38bdf8' },
                  { reason: 'Operator Absence', pct: '12%', color: '#a855f7' },
                  { reason: 'Sensor Adjustment', pct: '8%', color: '#64748b' }
                ].map((item, idx) => (
                  <div key={idx} style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ fontSize: '0.8rem', color: '#cbd5e1', fontWeight: 600 }}>{item.reason}</span>
                    <div style={{ fontSize: '1.5rem', fontWeight: 900, color: item.color, marginTop: '4px' }}>{item.pct}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 4. TAB: IOT & MACHINES */}
        {/* ========================================================================= */}
        {activeTab === 'iot' && (
          <div style={{ animation: 'fadeIn 0.3s ease', maxWidth: '1280px', margin: '0 auto', padding: '40px 30px' }}>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(245, 158, 11, 0.1)', color: '#fbbf24', padding: '6px 16px', borderRadius: '100px', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '14px' }}>
                <Cpu size={14} /> UNIVERSAL MACHINE & EDGE GATEWAY
              </div>
              <h2 style={{ fontSize: '2.6rem', fontWeight: 900, color: 'white', margin: '0 0 12px 0' }}>
                Connect Every Machine, PLC, Sensor & Edge Device
              </h2>
              <p style={{ color: '#94a3b8', fontSize: '1.1rem', maxWidth: '750px', margin: '0 auto', lineHeight: '1.6' }}>
                No expensive proprietary lock-in. MAVI-MES communicates natively with industrial PLCs, MQTT brokers, OPC-UA servers, and edge Node-RED instances.
              </p>
            </div>

            {/* Interactive Live Edge Gateway Console */}
            <div style={{
              background: 'rgba(15, 23, 42, 0.7)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '24px',
              padding: '36px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
              marginBottom: '48px'
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '36px', alignItems: 'center' }} className="grid-responsive">
                {/* Left Side: Capabilities */}
                <div>
                  <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'white', margin: '0 0 14px 0' }}>
                    Industrial Protocols Supported Out of the Box
                  </h3>
                  <p style={{ color: '#94a3b8', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '20px' }}>
                    Bridge legacy factory machines and modern IoT sensors without changing existing PLC ladder logic.
                  </p>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
                    {[
                      { name: 'MQTT & Sparkplug B', desc: 'Publish/subscribe edge sensors' },
                      { name: 'OPC-UA Client/Server', desc: 'Industrial tag browsing' },
                      { name: 'Siemens & Mitsubishi', desc: 'S7 & MELSEC direct reads' },
                      { name: 'Modbus TCP / RTU', desc: 'Inverters & digital meters' },
                      { name: 'Node-RED Flows', desc: 'Custom edge automation' },
                      { name: 'REST & Webhooks', desc: 'External cloud APIs' }
                    ].map((proto, idx) => (
                      <div key={idx} style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <strong style={{ color: '#fbbf24', fontSize: '0.85rem', display: 'block' }}>{proto.name}</strong>
                        <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{proto.desc}</span>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => navigate('/iot-hub')}
                      style={{
                        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                        border: 'none',
                        color: 'white',
                        padding: '12px 20px',
                        borderRadius: '8px',
                        fontWeight: 800,
                        cursor: 'pointer'
                      }}
                    >
                      Open IoT & PLC Hub
                    </button>
                    <button
                      onClick={() => navigate('/predictive-maintenance')}
                      style={{
                        background: 'rgba(245, 158, 11, 0.15)',
                        border: '1px solid #f59e0b',
                        color: '#fbbf24',
                        padding: '12px 20px',
                        borderRadius: '8px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <Sparkles size={16} /> AI Predictive RUL
                    </button>
                  </div>
                </div>

                {/* Right Side: Live Sensor Gauges & Real-time Terminal */}
                <div style={{
                  background: '#090d16',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '18px',
                  padding: '20px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981', boxShadow: '0 0 8px #10b981' }}></div>
                      <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'white' }}>Live Machine Telemetry Stream</span>
                    </div>
                    <span style={{ fontSize: '0.72rem', color: '#64748b', fontFamily: 'monospace' }}>BROKER ACTIVE</span>
                  </div>

                  {/* 4 Sensor Live Cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <span style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase' }}>Spindle Speed</span>
                      <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#38bdf8' }}>{machineData.speed} RPM</div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <span style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase' }}>Hydraulic Press</span>
                      <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#34d399' }}>{machineData.pressure} bar</div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <span style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase' }}>Temperature</span>
                      <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#fbbf24' }}>{machineData.temp}°C</div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <span style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase' }}>Total Part Count</span>
                      <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#c084fc' }}>{machineData.count} pcs</div>
                    </div>
                  </div>

                  {/* Terminal Log Console */}
                  <div style={{
                    background: '#040711',
                    borderRadius: '8px',
                    padding: '10px',
                    fontFamily: 'monospace',
                    fontSize: '0.72rem',
                    color: '#94a3b8',
                    height: '130px',
                    overflowY: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}>
                    {terminalLogs.map((log, i) => (
                      <div key={i} style={{ color: i === 0 ? '#38bdf8' : '#64748b' }}>{log.text}</div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 5. TAB: FEATURES */}
        {/* ========================================================================= */}
        {activeTab === 'features' && (
          <div style={{ animation: 'fadeIn 0.3s ease', maxWidth: '1280px', margin: '0 auto', padding: '40px 30px' }}>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(168, 85, 247, 0.1)', color: '#c084fc', padding: '6px 16px', borderRadius: '100px', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '14px' }}>
                <Zap size={14} /> COMPLETE FRONTLINE OPERATING SYSTEM
              </div>
              <h2 style={{ fontSize: '2.6rem', fontWeight: 900, color: 'white', margin: '0 0 12px 0' }}>
                6 Core Engines Powering Your Digital Shop Floor
              </h2>
              <p style={{ color: '#94a3b8', fontSize: '1.1rem', maxWidth: '750px', margin: '0 auto', lineHeight: '1.6' }}>
                Discover how each module integrates into a unified manufacturing platform to eliminate operational friction and boost shop floor throughput.
              </p>
            </div>

            {/* 6 Core Engine Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginBottom: '40px' }}>
              {[
                {
                  icon: <Layout size={24} />,
                  color: '#3b82f6',
                  title: '1. Frontline App Engine',
                  bullets: ['Step-by-step operator SOP guides', 'Interactive forms, sign-offs, and checkboxes', 'Multi-device responsive (Tablet, Android, PC)']
                },
                {
                  icon: <Database size={24} />,
                  color: '#10b981',
                  title: '2. Relational BOM & Tables',
                  bullets: ['Multi-table relational schema with PostgreSQL', 'Bill of Materials & inventory tracking', 'Immutable production and audit history']
                },
                {
                  icon: <Camera size={24} />,
                  color: '#ec4899',
                  title: '3. Vision AI Quality Checks',
                  bullets: ['Camera defect and presence checks', 'OCR serial number & lot verification', 'QR/Barcode live decoding directly in apps']
                },
                {
                  icon: <Workflow size={24} />,
                  color: '#f59e0b',
                  title: '4. Visual Logic & Blockly',
                  bullets: ['No-code drag-and-drop logic triggers', 'Conditional routing (If Passed -> Next, Else -> Andon)', 'Automated WhatsApp & Email notifications']
                },
                {
                  icon: <Link2 size={24} />,
                  color: '#6366f1',
                  title: '5. Enterprise ERP Connectors',
                  bullets: ['Bi-directional sync with Mekari, Accurate, Odoo, SAP', 'Real-time work order and inventory import', 'Automated e-Faktur and shift export']
                },
                {
                  icon: <ShieldCheck size={24} />,
                  color: '#14b8a6',
                  title: '6. Role-Based Governance',
                  bullets: ['Strict Admin, Engineer, and Operator roles', '21 CFR Part 11 compliant digital signatures', 'Full immutable change and session logs']
                }
              ].map((feat, i) => (
                <div
                  key={i}
                  style={{
                    background: 'rgba(15, 23, 42, 0.65)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '18px',
                    padding: '28px',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = feat.color; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  <div style={{ width: '46px', height: '46px', borderRadius: '12px', backgroundColor: `${feat.color}20`, color: feat.color, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                    {feat.icon}
                  </div>
                  <h3 style={{ color: 'white', margin: '0 0 14px 0', fontSize: '1.2rem', fontWeight: 800 }}>{feat.title}</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {feat.bullets.map((b, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.85rem', color: '#cbd5e1' }}>
                        <div style={{ color: feat.color, marginTop: '2px' }}><Check size={13} strokeWidth={3} /></div>
                        <span>{b}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 6. TAB: PRICING & VALUE */}
        {/* ========================================================================= */}
        {activeTab === 'pricing' && (
          <div style={{ animation: 'fadeIn 0.3s ease', maxWidth: '1280px', margin: '0 auto', padding: '40px 30px' }}>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '44px' }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(56, 189, 248, 0.1)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                color: '#38bdf8',
                padding: '6px 16px',
                borderRadius: '100px',
                fontSize: '0.8rem',
                fontWeight: 800,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                marginBottom: '14px'
              }}>
                <Sparkles size={14} /> TRANSPARENT VALUE · INDONESIAN FACTORIES FIRST
              </div>
              <h1 style={{
                fontSize: '2.6rem',
                fontWeight: 900,
                color: 'white',
                margin: '0 0 14px 0',
                lineHeight: '1.2',
                letterSpacing: '-0.02em'
              }}>
                Simple pricing for factories that want results — not IT projects.
              </h1>
              <p style={{
                color: '#94a3b8',
                fontSize: '1.1rem',
                maxWidth: '820px',
                margin: '0 auto',
                lineHeight: '1.6'
              }}>
                No long implementations, no consultants. Pick a tier, deploy in 2 weeks, and see your OEE live on day one. <span style={{ color: '#e2e8f0', fontWeight: 600 }}>Harga per pabrik, dalam Rupiah.</span> <span style={{ color: '#38bdf8' }}>[Harga per pabrik, dalam Rupiah — tanpa proyek IT panjang.]</span>
              </p>
            </div>

            {/* Tier Cards Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '28px',
              alignItems: 'stretch',
              marginBottom: '36px'
            }} className="grid-responsive">
              {/* TIER 1: Starter */}
              <div style={{
                background: 'rgba(15, 23, 42, 0.65)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '20px',
                padding: '36px 30px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                backdropFilter: 'blur(12px)',
                transition: 'all 0.25s'
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.4)'; e.currentTarget.style.transform = 'translateY(-4px)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#10b981', background: 'rgba(16, 185, 129, 0.12)', padding: '4px 10px', borderRadius: '6px' }}>
                      Starter
                    </span>
                    <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>&ldquo;Get off paper&rdquo;</span>
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ fontSize: '2.1rem', fontWeight: 900, color: 'white', letterSpacing: '-0.02em' }}>
                      Rp 3.500.000 <span style={{ fontSize: '0.95rem', fontWeight: 600, color: '#94a3b8' }}>/bulan</span>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '4px' }}>
                      (~$230/mo) — billed monthly
                    </div>
                  </div>

                  <div style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: '10px',
                    padding: '12px 14px',
                    marginBottom: '24px',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    fontSize: '0.85rem',
                    color: '#cbd5e1',
                    lineHeight: '1.4'
                  }}>
                    <strong style={{ color: '#e2e8f0' }}>For:</strong> 50–150-employee plants replacing paper/Excel for the first time.
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
                    {[
                      'Digital SOP (step-by-step operator guides)',
                      'MES core: production logging, work orders, output tracking',
                      'Up to 1 production line · 10 users',
                      'Self-onboard with guided setup · 2-week deployment',
                      'Email support (Bahasa Indonesia)'
                    ].map((feature, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '0.9rem', color: '#cbd5e1' }}>
                        <div style={{ background: 'rgba(16, 185, 129, 0.2)', borderRadius: '50%', padding: '3px', color: '#10b981', flexShrink: 0, marginTop: '2px' }}>
                          <Check size={13} strokeWidth={3} />
                        </div>
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => { setIsPilotModalOpen(true); setPilotForm(prev => ({ ...prev, lines: '1' })); }}
                  style={{
                    width: '100%',
                    padding: '14px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: 'white',
                    borderRadius: '10px',
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  Pilih Starter
                </button>
              </div>

              {/* TIER 2: Growth (MOST POPULAR) */}
              <div style={{
                background: 'linear-gradient(180deg, rgba(30, 58, 138, 0.35) 0%, rgba(15, 23, 42, 0.85) 100%)',
                border: '2px solid #3b82f6',
                borderRadius: '20px',
                padding: '36px 30px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                backdropFilter: 'blur(16px)',
                boxShadow: '0 12px 35px rgba(59, 130, 246, 0.25)',
                transform: 'scale(1.02)',
                transition: 'all 0.25s',
                position: 'relative'
              }}
              >
                {/* Most Popular Badge */}
                <div style={{
                  position: 'absolute',
                  top: '-14px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  color: 'white',
                  padding: '4px 14px',
                  borderRadius: '100px',
                  fontSize: '0.75rem',
                  fontWeight: 900,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}>
                  <Star size={12} fill="white" /> MOST POPULAR
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#60a5fa', background: 'rgba(59, 130, 246, 0.15)', padding: '4px 10px', borderRadius: '6px' }}>
                      Growth
                    </span>
                    <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>&ldquo;Run the floor with data&rdquo;</span>
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ fontSize: '2.1rem', fontWeight: 900, color: 'white', letterSpacing: '-0.02em' }}>
                      Rp 9.500.000 <span style={{ fontSize: '0.95rem', fontWeight: 600, color: '#94a3b8' }}>/bulan</span>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#60a5fa', marginTop: '4px', fontWeight: 600 }}>
                      (~$620/mo) — annual billing
                    </div>
                  </div>

                  <div style={{
                    background: 'rgba(59, 130, 246, 0.08)',
                    borderRadius: '10px',
                    padding: '12px 14px',
                    marginBottom: '20px',
                    border: '1px solid rgba(59, 130, 246, 0.2)',
                    fontSize: '0.85rem',
                    color: '#cbd5e1',
                    lineHeight: '1.4'
                  }}>
                    <strong style={{ color: '#e2e8f0' }}>For:</strong> 150–500-employee plants where rework and downtime cost real money.
                  </div>

                  <div style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#93c5fd', marginBottom: '10px' }}>
                    Everything in Starter, plus:
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
                    {[
                      'AI Quality Inspection (camera/QR/barcode/OCR defect checks)',
                      'Inventory & BOM tables (relational, audit-logged)',
                      'Real-time OEE analytics dashboards on terminals & wallboards',
                      'Up to 5 lines · 30 users',
                      'ERP integration (Mekari, Accurate, Odoo) + e-faktur export',
                      'Priority support'
                    ].map((feature, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '0.9rem', color: '#f1f5f9' }}>
                        <div style={{ background: 'rgba(59, 130, 246, 0.25)', borderRadius: '50%', padding: '3px', color: '#60a5fa', flexShrink: 0, marginTop: '2px' }}>
                          <Check size={13} strokeWidth={3} />
                        </div>
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => { setIsPilotModalOpen(true); setPilotForm(prev => ({ ...prev, lines: '3' })); }}
                  style={{
                    width: '100%',
                    padding: '14px',
                    background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                    border: 'none',
                    color: 'white',
                    borderRadius: '10px',
                    fontWeight: 800,
                    fontSize: '0.95rem',
                    cursor: 'pointer',
                    boxShadow: '0 4px 16px rgba(37, 99, 235, 0.4)',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  Mulai 30-Hari Pilot <ArrowRight size={16} />
                </button>
              </div>

              {/* TIER 3: Enterprise / IoT */}
              <div style={{
                background: 'rgba(15, 23, 42, 0.65)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '20px',
                padding: '36px 30px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                backdropFilter: 'blur(12px)',
                transition: 'all 0.25s'
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.4)'; e.currentTarget.style.transform = 'translateY(-4px)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#c084fc', background: 'rgba(168, 85, 247, 0.15)', padding: '4px 10px', borderRadius: '6px' }}>
                      Enterprise / IoT
                    </span>
                    <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>&ldquo;Connect the machines&rdquo;</span>
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ fontSize: '2.1rem', fontWeight: 900, color: 'white', letterSpacing: '-0.02em' }}>
                      Rp 30.000.000 <span style={{ fontSize: '0.95rem', fontWeight: 600, color: '#94a3b8' }}>/bulan</span>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#c084fc', marginTop: '4px', fontWeight: 600 }}>
                      (~$2,000/mo) — annual, per plant/group
                    </div>
                  </div>

                  <div style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: '10px',
                    padding: '12px 14px',
                    marginBottom: '20px',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    fontSize: '0.85rem',
                    color: '#cbd5e1',
                    lineHeight: '1.4'
                  }}>
                    <strong style={{ color: '#e2e8f0' }}>For:</strong> 500+ employee plants / multi-plant groups standardizing operations.
                  </div>

                  <div style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#d8b4fe', marginBottom: '10px' }}>
                    Everything in Growth, plus:
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
                    {[
                      'IoT & PLC connectors: MQTT, OPC UA, Node-RED, HTTP/SQL',
                      'Machine triggers & andons (automated events from edge signals)',
                      'Vision templates + custom AI models',
                      'AI Copilot (natural-language queries & suggestions)',
                      'Unlimited lines · SSO · dedicated CSM',
                      'Optional on-prem/edge deployment for data residency'
                    ].map((feature, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '0.9rem', color: '#cbd5e1' }}>
                        <div style={{ background: 'rgba(168, 85, 247, 0.2)', borderRadius: '50%', padding: '3px', color: '#c084fc', flexShrink: 0, marginTop: '2px' }}>
                          <Check size={13} strokeWidth={3} />
                        </div>
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => setIsWalkthroughModalOpen(true)}
                  style={{
                    width: '100%',
                    padding: '14px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: 'white',
                    borderRadius: '10px',
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  Hubungi Tim Enterprise
                </button>
              </div>
            </div>

            {/* ONE-TIME FEES FOOTNOTE STRIP */}
            <div style={{
              background: 'rgba(15, 23, 42, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '14px',
              padding: '20px 28px',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '20px',
              marginBottom: '48px',
              fontSize: '0.9rem',
              color: '#94a3b8',
              lineHeight: '1.5'
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ color: '#38bdf8', marginTop: '2px', flexShrink: 0 }}>
                  <Info size={18} />
                </div>
                <div>
                  <strong style={{ color: '#f1f5f9' }}>Onboarding (one-time):</strong> Rp 5–15 juta per pabrik, depending on tier — fixed scope: platform config + digital SOP templates + operator training. <span style={{ color: '#38bdf8' }}>No hourly billing.</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ color: '#f59e0b', marginTop: '2px', flexShrink: 0 }}>
                  <Zap size={18} />
                </div>
                <div>
                  <strong style={{ color: '#f1f5f9' }}>IoT hardware (optional):</strong> Billed at cost + small margin (e.g., gateways, cameras). Software stays the core of your subscription.
                </div>
              </div>
            </div>

            {/* COMPARISON STRIP (3 COLUMNS) */}
            <div style={{ marginBottom: '48px' }}>
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'white', margin: '0 0 8px 0' }}>
                  Why Indonesian Factories Choose MAVI-MES
                </h3>
                <p style={{ color: '#94a3b8', fontSize: '0.95rem', margin: 0 }}>
                  Direct head-to-head comparison: Manual paper vs Legacy ERP/MES vs MAVI-MES
                </p>
              </div>

              <div style={{
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '18px',
                overflow: 'hidden',
                boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
              }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1.2fr 1fr 1fr 1.2fr',
                  background: 'rgba(255, 255, 255, 0.04)',
                  padding: '16px 24px',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  color: '#94a3b8',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
                }}>
                  <div>Capability / Metric</div>
                  <div>Paper & Excel (Status Quo)</div>
                  <div>Global MES (Legacy Class)</div>
                  <div style={{ color: '#38bdf8' }}>MAVI-MES (Modern)</div>
                </div>

                {[
                  { metric: 'Time to live', paper: '—', legacy: '6–18 months, big IT team', mavi: '⚡ 2 weeks' },
                  { metric: 'Cost', paper: 'Hidden rework / downtime losses', legacy: '$100K–$1M+ deployment', mavi: 'Rp 3.5–30 juta/bulan' },
                  { metric: 'Language', paper: '—', legacy: 'English-first', mavi: '🇮🇩 Bahasa-first' },
                  { metric: 'Shop-floor fit', paper: 'Manual, error-prone', legacy: 'Built for multinationals', mavi: 'Built for Indonesian SMEs' },
                  { metric: 'AI quality & IoT', paper: '—', legacy: 'Add-on modules, complex', mavi: 'Included in Growth/Enterprise' }
                ].map((row, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1.2fr 1fr 1fr 1.2fr',
                      padding: '18px 24px',
                      fontSize: '0.9rem',
                      borderBottom: idx === 4 ? 'none' : '1px solid rgba(255, 255, 255, 0.04)',
                      backgroundColor: idx % 2 === 1 ? 'rgba(255, 255, 255, 0.015)' : 'transparent',
                      alignItems: 'center'
                    }}
                  >
                    <div style={{ fontWeight: 700, color: '#f1f5f9' }}>{row.metric}</div>
                    <div style={{ color: '#94a3b8' }}>{row.paper}</div>
                    <div style={{ color: '#94a3b8' }}>{row.legacy}</div>
                    <div style={{ color: '#38bdf8', fontWeight: 700, background: 'rgba(56, 189, 248, 0.08)', padding: '6px 12px', borderRadius: '6px', width: 'fit-content' }}>
                      {row.mavi}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Interactive Factory ROI Calculator */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.3) 0%, rgba(15, 23, 42, 0.8) 100%)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              borderRadius: '20px',
              padding: '32px',
              marginBottom: '20px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#38bdf8', marginBottom: '8px' }}>
                <Calculator size={20} />
                <h3 style={{ margin: 0, fontSize: '1.4rem', color: 'white', fontWeight: 800 }}>
                  Estimate Your Factory ROI & Monthly Savings
                </h3>
              </div>
              <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: '0 0 24px 0' }}>
                See how much your plant can save by eliminating manual tally sheets and reducing unplanned downtime.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr', gap: '28px', alignItems: 'center' }} className="grid-responsive">
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', fontWeight: 700, marginBottom: '8px' }}>
                    Number of Floor Operators: <span style={{ color: '#38bdf8', fontSize: '1rem' }}>{roiWorkers} persons</span>
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="500"
                    step="5"
                    value={roiWorkers}
                    onChange={e => setRoiWorkers(parseInt(e.target.value))}
                    style={{ width: '100%', accentColor: '#38bdf8', cursor: 'pointer' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', fontWeight: 700, marginBottom: '8px' }}>
                    Unplanned Downtime: <span style={{ color: '#f59e0b', fontSize: '1rem' }}>{roiDowntimeHours} hrs/week</span>
                  </label>
                  <input
                    type="range"
                    min="2"
                    max="50"
                    step="1"
                    value={roiDowntimeHours}
                    onChange={e => setRoiDowntimeHours(parseInt(e.target.value))}
                    style={{ width: '100%', accentColor: '#f59e0b', cursor: 'pointer' }}
                  />
                </div>

                <div style={{ background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '14px', padding: '16px 20px', textAlign: 'center' }}>
                  <span style={{ fontSize: '0.78rem', color: '#cbd5e1', textTransform: 'uppercase', fontWeight: 700 }}>
                    Estimated Factory Monthly Savings:
                  </span>
                  <div style={{ fontSize: '1.7rem', fontWeight: 900, color: '#34d399', marginTop: '4px' }}>
                    {calculateMonthlySavings()}
                  </div>
                  <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Based on typical Indonesian SME plant productivity benchmarks</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 7. TAB: FAQ & SUPPORT */}
        {/* ========================================================================= */}
        {activeTab === 'faq' && (
          <div style={{ animation: 'fadeIn 0.3s ease', maxWidth: '1000px', margin: '0 auto', padding: '40px 30px' }}>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(168, 85, 247, 0.1)',
                border: '1px solid rgba(168, 85, 247, 0.3)',
                color: '#c084fc',
                padding: '6px 16px',
                borderRadius: '100px',
                fontSize: '0.8rem',
                fontWeight: 800,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                marginBottom: '14px'
              }}>
                <HelpCircle size={14} /> GOT QUESTIONS? WE ARE HERE TO HELP
              </div>
              <h2 style={{ fontSize: '2.6rem', fontWeight: 900, color: 'white', margin: '0 0 12px 0' }}>
                Frequently Asked Questions & Support Hub
              </h2>
              <p style={{ color: '#94a3b8', fontSize: '1.05rem', margin: 0 }}>
                Clear answers regarding rapid 2-week implementation, data privacy, and hardware compatibility.
              </p>
            </div>

            {/* 6 FAQ Accordion Items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '48px' }}>
              {[
                {
                  q: 'Do we need IT staff or servers?',
                  a: 'No. It runs in the cloud (in-country hosting) or on-prem/edge for Enterprise. We handle setup; your operators only need a tablet or phone.'
                },
                {
                  q: 'How fast can we start?',
                  a: 'Most plants log their first production in 2 weeks. Start with a 30-day pilot on one line — free.'
                },
                {
                  q: 'Is my data secure?',
                  a: 'Yes — in-country hosting, role-based access, full audit logs. Enterprise can deploy fully on-premise for strict compliance.'
                },
                {
                  q: 'What if our machines have no sensors?',
                  a: "Start without hardware: operators log via terminals. Add IoT connectors when you're ready — the platform grows with you."
                },
                {
                  q: 'Can it integrate with our accounting software?',
                  a: 'Yes — Growth and Enterprise include ERP integration (Mekari, Accurate, Odoo) and e-faktur export.'
                },
                {
                  q: 'Is there a discount for multi-plant?',
                  a: 'Yes — talk to us for group pricing. [ID: Hubungi kami untuk harga grup multi-pabrik.]'
                }
              ].map((item, idx) => {
                const isOpen = openFaqIndex === idx;
                return (
                  <div
                    key={idx}
                    style={{
                      background: isOpen ? 'rgba(30, 41, 59, 0.7)' : 'rgba(15, 23, 42, 0.5)',
                      border: isOpen ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '14px',
                      overflow: 'hidden',
                      transition: 'all 0.2s',
                      boxShadow: isOpen ? '0 4px 20px rgba(0,0,0,0.2)' : 'none'
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                      style={{
                        width: '100%',
                        padding: '18px 24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: 'transparent',
                        border: 'none',
                        color: isOpen ? 'white' : '#cbd5e1',
                        fontSize: '1rem',
                        fontWeight: 700,
                        textAlign: 'left',
                        cursor: 'pointer',
                        gap: '16px'
                      }}
                    >
                      <span>{item.q}</span>
                      <div style={{
                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s',
                        color: isOpen ? '#38bdf8' : '#64748b',
                        flexShrink: 0
                      }}>
                        <ChevronDown size={20} />
                      </div>
                    </button>
                    {isOpen && (
                      <div style={{
                        padding: '0 24px 20px 24px',
                        color: '#94a3b8',
                        fontSize: '0.92rem',
                        lineHeight: '1.6',
                        borderTop: '1px solid rgba(255, 255, 255, 0.04)',
                        paddingTop: '14px'
                      }}>
                        {item.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* 4-Week Fast-Track Deployment Roadmap */}
            <div style={{
              background: 'rgba(15, 23, 42, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '20px',
              padding: '30px'
            }}>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'white', margin: '0 0 18px 0', textAlign: 'center' }}>
                4-Week Rapid Factory Implementation Roadmap
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                {[
                  { week: 'Week 1', title: 'Process Mapping', desc: 'Convert paper SOPs and forms into digital templates.' },
                  { week: 'Week 2', title: 'Pilot Line Live', desc: 'Deploy operator tablets on 1 line and train operators.' },
                  { week: 'Week 3', title: 'OEE & Telemetry', desc: 'Connect machine signals, andons, and live wallboard.' },
                  { week: 'Week 4', title: 'Plant-Wide Scaling', desc: 'Expand to remaining lines and sync with ERP accounting.' }
                ].map((step, idx) => (
                  <div key={idx} style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: 800, textTransform: 'uppercase' }}>{step.week}</span>
                    <h5 style={{ color: 'white', fontSize: '0.95rem', fontWeight: 800, margin: '4px 0 6px 0' }}>{step.title}</h5>
                    <p style={{ color: '#94a3b8', fontSize: '0.8rem', margin: 0, lineHeight: '1.4' }}>{step.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </main>

      {/* ========================================================================= */}
      {/* GLOBAL PERSISTENT CALL TO ACTION & TRUST STRIP (BOTTOM OF ALL TABS) */}
      {/* ========================================================================= */}
      <section style={{
        maxWidth: '1140px',
        margin: '10px auto 70px auto',
        padding: '0 30px',
        boxSizing: 'border-box'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.15) 0%, rgba(30, 41, 59, 0.6) 100%)',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          borderRadius: '24px',
          padding: '50px 40px',
          textAlign: 'center',
          boxShadow: '0 20px 50px rgba(37, 99, 235, 0.1)',
          backdropFilter: 'blur(16px)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <h2 style={{ fontSize: '2.4rem', fontWeight: 900, color: 'white', margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>
            See your shop floor come alive.
          </h2>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#38bdf8', marginBottom: '14px' }}>
            [ID: Lihat lantai produksi Anda jadi hidup.]
          </div>
          <p style={{ color: '#94a3b8', fontSize: '1rem', maxWidth: '650px', margin: '0 auto 32px auto', lineHeight: '1.6' }}>
            Eliminate paperwork, empower frontline operators, and track live OEE without painful multi-year IT migrations. Start free today.
          </p>

          {/* 3 Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '32px' }}>
            {/* Button 1: Book Walkthrough */}
            <button
              onClick={() => setIsWalkthroughModalOpen(true)}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: 'white',
                padding: '13px 22px',
                borderRadius: '10px',
                fontWeight: 800,
                fontSize: '0.9rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'; e.currentTarget.style.borderColor = '#38bdf8'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'; e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'; }}
            >
              <Calendar size={16} className="text-sky-400" /> Book a 20-min factory walkthrough
            </button>

            {/* Button 2: Start 30-day pilot */}
            <button
              onClick={() => setIsPilotModalOpen(true)}
              style={{
                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                border: 'none',
                color: 'white',
                padding: '13px 26px',
                borderRadius: '10px',
                fontWeight: 800,
                fontSize: '0.9rem',
                cursor: 'pointer',
                boxShadow: '0 8px 25px rgba(37, 99, 235, 0.4)',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Flame size={16} /> Start free 30-day pilot
            </button>

            {/* Button 3: Interactive Demo */}
            <button
              onClick={() => navigate('/builder')}
              style={{
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                color: '#34d399',
                padding: '13px 22px',
                borderRadius: '10px',
                fontWeight: 800,
                fontSize: '0.9rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Play size={16} fill="#34d399" /> Try the interactive demo
            </button>
          </div>

          {/* Trust Strip */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '14px',
            flexWrap: 'wrap',
            color: '#cbd5e1',
            fontSize: '0.85rem',
            fontWeight: 600,
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            paddingTop: '20px',
            marginBottom: '20px'
          }}>
            <span>✨ Deployable in 2 weeks</span>
            <span style={{ color: 'rgba(255,255,255,0.2)' }}>·</span>
            <span>🇮🇩 Bahasa-first</span>
            <span style={{ color: 'rgba(255,255,255,0.2)' }}>·</span>
            <span>🛡️ In-country hosting</span>
            <span style={{ color: 'rgba(255,255,255,0.2)' }}>·</span>
            <span>🏭 Built for Indonesian factories</span>
          </div>

          {/* Demo Credentials Teaser for Judges */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            borderRadius: '12px',
            padding: '12px 18px',
            maxWidth: '580px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap',
            textAlign: 'left'
          }}>
            <div>
              <div style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: '#38bdf8', letterSpacing: '0.05em', marginBottom: '2px' }}>
                ⭐ Demo Credentials for Judges & Evaluators:
              </div>
              <div style={{ fontSize: '0.82rem', color: '#e2e8f0', fontFamily: 'monospace' }}>
                Username: <strong style={{ color: '#34d399' }}>engineer</strong> &nbsp;|&nbsp; Password: <strong style={{ color: '#34d399' }}>123</strong>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText('engineer\n123');
                  setCopiedDemo(true);
                  setTimeout(() => setCopiedDemo(false), 2000);
                }}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: copiedDemo ? '#34d399' : '#cbd5e1',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                {copiedDemo ? <CheckCheck size={13} /> : <Copy size={13} />} {copiedDemo ? 'Copied!' : 'Copy'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/login')}
                style={{
                  background: '#2563eb',
                  border: 'none',
                  color: 'white',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Login Now
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{
        borderTop: '1px solid rgba(255, 255, 255, 0.06)',
        padding: '30px 30px',
        textAlign: 'center',
        color: '#64748b',
        fontSize: '0.82rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '18px', marginBottom: '12px', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 'bold', color: '#cbd5e1' }}>MAVI-MES Core Platform</span>
          <span style={{ color: 'rgba(255,255,255,0.1)' }}>|</span>
          <span>Version 3.4.0 (Latest)</span>
          <span style={{ color: 'rgba(255,255,255,0.1)' }}>|</span>
          <button onClick={() => switchTab('pricing')} style={{ background: 'none', border: 'none', color: '#38bdf8', cursor: 'pointer', fontSize: '0.82rem', padding: 0 }}>Transparent Pricing</button>
          <span style={{ color: 'rgba(255,255,255,0.1)' }}>|</span>
          <button onClick={() => switchTab('faq')} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.82rem', padding: 0 }}>FAQ</button>
        </div>
        <p style={{ margin: 0 }}>
          &copy; {new Date().getFullYear()} zainalkhmi/mavi-mes. Built for Indonesian Frontline Manufacturing Operations. All rights reserved.
        </p>
      </footer>

      {/* MODAL: Book a 20-min Factory Walkthrough */}
      {isWalkthroughModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: '#0f172a',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '480px',
            padding: '32px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            position: 'relative'
          }}>
            <button
              onClick={() => { setIsWalkthroughModalOpen(false); setModalSuccessMsg(''); }}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer'
              }}
            >
              <X size={20} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#38bdf8', marginBottom: '8px' }}>
              <Calendar size={22} />
              <h3 style={{ margin: 0, fontSize: '1.3rem', color: 'white', fontWeight: 800 }}>
                Book Factory Walkthrough
              </h3>
            </div>
            <p style={{ color: '#94a3b8', fontSize: '0.88rem', margin: '0 0 20px 0' }}>
              Schedule a 20-minute tailored virtual walkthrough with our manufacturing engineers.
            </p>

            {modalSuccessMsg ? (
              <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', borderRadius: '10px', padding: '16px', color: '#34d399', textAlign: 'center', fontWeight: 600 }}>
                {modalSuccessMsg}
              </div>
            ) : (
              <form onSubmit={(e) => {
                e.preventDefault();
                setModalSuccessMsg('Terima kasih! Tim kami akan menghubungi Anda via WhatsApp/Email dalam 1x24 jam.');
                setTimeout(() => { setIsWalkthroughModalOpen(false); setModalSuccessMsg(''); }, 3000);
              }} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '6px', fontWeight: 600 }}>Full Name</label>
                  <input
                    required
                    type="text"
                    placeholder="Nama Lengkap"
                    value={walkthroughForm.name}
                    onChange={e => setWalkthroughForm({ ...walkthroughForm, name: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: 'white', outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '6px', fontWeight: 600 }}>Factory / Company Name</label>
                  <input
                    required
                    type="text"
                    placeholder="PT / Pabrik Anda"
                    value={walkthroughForm.company}
                    onChange={e => setWalkthroughForm({ ...walkthroughForm, company: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: 'white', outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '6px', fontWeight: 600 }}>Work Email</label>
                  <input
                    required
                    type="email"
                    placeholder="email@pabrik.co.id"
                    value={walkthroughForm.email}
                    onChange={e => setWalkthroughForm({ ...walkthroughForm, email: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: 'white', outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '6px', fontWeight: 600 }}>WhatsApp / Phone Number</label>
                  <input
                    required
                    type="tel"
                    placeholder="0812-xxxx-xxxx"
                    value={walkthroughForm.phone}
                    onChange={e => setWalkthroughForm({ ...walkthroughForm, phone: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: 'white', outline: 'none' }}
                  />
                </div>
                <button
                  type="submit"
                  style={{
                    marginTop: '8px',
                    padding: '14px',
                    background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                    border: 'none',
                    color: 'white',
                    borderRadius: '10px',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  Confirm Walkthrough Booking
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL: Start Free 30-Day Pilot */}
      {isPilotModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: '#0f172a',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '480px',
            padding: '32px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            position: 'relative'
          }}>
            <button
              onClick={() => { setIsPilotModalOpen(false); setModalSuccessMsg(''); }}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer'
              }}
            >
              <X size={20} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#10b981', marginBottom: '8px' }}>
              <Flame size={22} />
              <h3 style={{ margin: 0, fontSize: '1.3rem', color: 'white', fontWeight: 800 }}>
                Start Free 30-Day Pilot
              </h3>
            </div>
            <p style={{ color: '#94a3b8', fontSize: '0.88rem', margin: '0 0 20px 0' }}>
              Deploy MAVI-MES on 1 production line for 30 days without commitment.
            </p>

            {modalSuccessMsg ? (
              <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', borderRadius: '10px', padding: '16px', color: '#34d399', textAlign: 'center', fontWeight: 600 }}>
                {modalSuccessMsg}
              </div>
            ) : (
              <form onSubmit={(e) => {
                e.preventDefault();
                setModalSuccessMsg('Pilot Workspace Anda sedang disiapkan! Kredensial akun uji coba telah dikirimkan ke email Anda.');
                setTimeout(() => { setIsPilotModalOpen(false); setModalSuccessMsg(''); }, 3000);
              }} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '6px', fontWeight: 600 }}>Full Name</label>
                  <input
                    required
                    type="text"
                    placeholder="Nama Penanggung Jawab"
                    value={pilotForm.name}
                    onChange={e => setPilotForm({ ...pilotForm, name: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: 'white', outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '6px', fontWeight: 600 }}>Factory / Plant Name</label>
                  <input
                    required
                    type="text"
                    placeholder="Nama Pabrik / Line Produksi"
                    value={pilotForm.company}
                    onChange={e => setPilotForm({ ...pilotForm, company: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: 'white', outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '6px', fontWeight: 600 }}>Email Address</label>
                  <input
                    required
                    type="email"
                    placeholder="email@pabrik.co.id"
                    value={pilotForm.email}
                    onChange={e => setPilotForm({ ...pilotForm, email: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: 'white', outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '6px', fontWeight: 600 }}>WhatsApp Number</label>
                  <input
                    required
                    type="tel"
                    placeholder="0812-xxxx-xxxx"
                    value={pilotForm.phone}
                    onChange={e => setPilotForm({ ...pilotForm, phone: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: 'white', outline: 'none' }}
                  />
                </div>
                <button
                  type="submit"
                  style={{
                    marginTop: '8px',
                    padding: '14px',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    border: 'none',
                    color: 'white',
                    borderRadius: '10px',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  🚀 Activate Free 30-Day Pilot
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Embedded Responsive helper styles */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 900px) {
          .grid-responsive {
            grid-template-columns: 1fr !important;
            gap: 24px !important;
          }
          .grid-responsive-reverse {
            grid-template-columns: 1fr !important;
            gap: 24px !important;
          }
          .grid-responsive-reverse > div:first-child {
            order: 2 !important;
          }
        }
        @media (max-width: 768px) {
          .desktop-only {
            display: none !important;
          }
          .mobile-toggle {
            display: block !important;
          }
          h1 {
            font-size: 2.2rem !important;
          }
          section {
            padding: 40px 16px 20px 16px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default LandingPage;

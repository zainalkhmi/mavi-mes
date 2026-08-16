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
  RotateCw,
  CheckSquare,
  ShoppingBag,
  Award,
  Boxes,
  Wrench,
  HeartPulse,
  Search,
  Download,
  ShieldAlert,
  Tag,
  Share2,
  ThumbsUp
} from 'lucide-react';
import { categories as catalogCategories, rawTemplates as catalogTemplates } from '../utils/appStoreCatalog';

const LandingPage = ({ initialTab = 'overview' }) => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Tab Navigation State: 'overview' | 'store' | 'builder' | 'analytics' | 'iot' | 'features' | 'pricing' | 'faq'
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Mavi Store States
  const [storeSearchQuery, setStoreSearchQuery] = useState('');
  const [storeActiveCategory, setStoreActiveCategory] = useState('All');
  const [selectedTemplateModal, setSelectedTemplateModal] = useState(null);
  const [storeInstalledList, setStoreInstalledList] = useState({});
  const [storeActiveStepIndex, setStoreActiveStepIndex] = useState(0);

  // Pricing, FAQ, Modals & Demo Credentials States
  const [selectedOverviewVideo, setSelectedOverviewVideo] = useState('overview'); // 'overview' | 'checksheet'
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
      if (['overview', 'store', 'builder', 'pricing', 'faq'].includes(hash)) {
        setActiveTab(hash);
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
    { key: 'store', label: 'Mavi Store', icon: <ShoppingBag size={15} />, highlight: true },
    { key: 'builder', label: 'App Builder', icon: <Layout size={15} /> },
    { key: 'pricing', label: 'Pricing & Value', icon: <Flame size={15} /> },
    { key: 'faq', label: 'FAQ & Support', icon: <HelpCircle size={15} /> }
  ];

  // Full Catalog of All Enterprise App Templates (Play Store style, matched 1:1 with Mavi Store)
  const storeCategories = catalogCategories;

  const storeTemplates = catalogTemplates.map((t, idx) => {
    const tableNames = (t.guide?.tables || []).map(tb => tb.name || tb);
    const triggerNames = (t.guide?.triggers || []).map(tr => `${tr.event}: ${tr.function}`);
    const mockupSteps = (t.guide?.steps && t.guide.steps.length > 0)
      ? t.guide.steps.map(st => ({ step: st.name, desc: st.description }))
      : [
          { step: 'Main Interface', desc: t.description },
          { step: 'Operation & Trigger Flow', desc: t.guide?.operation || t.longDescription || t.description },
          { step: 'Database Records & Logging', desc: 'Data tersimpan otomatis dan persisten ke database sistem.' }
        ];

    return {
      id: t.id,
      name: t.name,
      category: t.category,
      badge: idx < 3 ? "Editor's Choice" : (t.rating >= 5.0 ? 'Top Rated' : 'Verified Suite'),
      rating: t.rating || 5.0,
      reviews: 120 + ((idx * 19) % 180),
      installs: t.installs === 'New' ? '3.4k+' : (t.installs || '2.5k+'),
      version: ['incoming-inspection', 'weigh-dispense', 'assy-line-production'].includes(t.id) ? 'v2.0.0' : 'v1.0.0',
      color: t.accent || '#2563eb',
      iconBg: t.bg || 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
      rawIcon: t.icon,
      icon: t.icon,
      tagline: t.description,
      description: t.longDescription || t.description,
      features: t.features || [],
      tables: tableNames.length > 0 ? tableNames : ['System_Logs', 'Operator_Activity'],
      triggers: triggerNames.length > 0 ? triggerNames : ['ON_CLICK: Execute Action', 'ON_SUBMIT: Save Record'],
      mockupSteps: mockupSteps
    };
  });

  const renderTemplateIcon = (iconItem, size = 24) => {
    if (!iconItem) return <Sparkles size={size} color="white" />;
    if (React.isValidElement(iconItem)) {
      return React.cloneElement(iconItem, { size, color: 'white' });
    }
    switch (iconItem) {
      case 'Award': return <Award size={size} color="white" />;
      case 'Activity': return <Activity size={size} color="white" />;
      case 'AlertTriangle': return <AlertTriangle size={size} color="white" />;
      case 'BarChart3': return <BarChart3 size={size} color="white" />;
      case 'FileText': return <FileText size={size} color="white" />;
      case 'ShieldCheck': return <ShieldCheck size={size} color="white" />;
      case 'Boxes': return <Boxes size={size} color="white" />;
      case 'HeartPulse': return <HeartPulse size={size} color="white" />;
      case 'Cpu': return <Cpu size={size} color="white" />;
      case 'ShieldAlert': return <ShieldAlert size={size} color="white" />;
      case 'Wrench': return <Wrench size={size} color="white" />;
      case 'Gauge': return <Gauge size={size} color="white" />;
      case 'Search': return <Search size={size} color="white" />;
      case 'ClipboardList': return <ClipboardList size={size} color="white" />;
      case 'Package': return <Package size={size} color="white" />;
      case 'Truck': return <Truck size={size} color="white" />;
      case 'PlayCircle': return <PlayCircle size={size} color="white" />;
      case 'Settings': return <Settings size={size} color="white" />;
      case 'Layout': return <Layout size={size} color="white" />;
      case 'Zap': return <Zap size={size} color="white" />;
      case 'Sliders': return <Sliders size={size} color="white" />;
      case 'Tag': return <Tag size={size} color="white" />;
      default: return <Sparkles size={size} color="white" />;
    }
  };

  const filteredStoreTemplates = storeTemplates.filter(t => {
    let matchesCat = false;
    if (storeActiveCategory === 'All') {
      matchesCat = true;
    } else if (storeActiveCategory === 'App Management') {
      matchesCat = !!storeInstalledList[t.id];
    } else {
      matchesCat = t.category === storeActiveCategory;
    }

    const query = storeSearchQuery.trim().toLowerCase();
    if (!query) return matchesCat;

    const matchesSearch = 
      t.name.toLowerCase().includes(query) ||
      t.description.toLowerCase().includes(query) ||
      (t.tagline && t.tagline.toLowerCase().includes(query)) ||
      t.category.toLowerCase().includes(query) ||
      (t.features && t.features.some(f => f.toLowerCase().includes(query))) ||
      (t.tables && t.tables.some(tb => String(tb).toLowerCase().includes(query)));

    return matchesCat && matchesSearch;
  });

  const totalSearchMatchesAllCategories = storeSearchQuery.trim()
    ? storeTemplates.filter(t => {
        const query = storeSearchQuery.trim().toLowerCase();
        return t.name.toLowerCase().includes(query) ||
          t.description.toLowerCase().includes(query) ||
          (t.tagline && t.tagline.toLowerCase().includes(query)) ||
          t.category.toLowerCase().includes(query) ||
          (t.features && t.features.some(f => f.toLowerCase().includes(query))) ||
          (t.tables && t.tables.some(tb => String(tb).toLowerCase().includes(query)));
      }).length
    : storeTemplates.length;

  const handleInstallTemplate = (template) => {
    setStoreInstalledList(prev => ({ ...prev, [template.id]: true }));
    setModalSuccessMsg(`Template "${template.name}" berhasil disiapkan untuk workspace!`);
    setTimeout(() => {
      setModalSuccessMsg('');
    }, 4000);
  };

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

      {/* TOAST SUCCESS NOTIFICATION */}
      {modalSuccessMsg && (
        <div style={{
          position: 'fixed',
          top: '75px',
          right: '24px',
          zIndex: 1200,
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          color: 'white',
          padding: '14px 22px',
          borderRadius: '14px',
          boxShadow: '0 10px 30px rgba(16, 185, 129, 0.4)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontWeight: 700,
          fontSize: '0.9rem',
          animation: 'fadeIn 0.25s ease'
        }}>
          <CheckCircle2 size={20} color="white" />
          <span>{modalSuccessMsg}</span>
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
        {/* 1. TAB: OVERVIEW (TULIP PLATFORM INSPIRED: ADAPTABLE PRODUCTION SYSTEMS) */}
        {/* ========================================================================= */}
        {activeTab === 'overview' && (
          <div style={{ animation: 'fadeIn 0.3s ease', maxWidth: '1360px', margin: '0 auto', padding: '20px 24px 60px 24px', boxSizing: 'border-box' }}>
            
            {/* PLATFORM OVERVIEW & DEMO VIDEO SHOWCASE (DUAL-VIDEO SELECTOR) */}
            <section style={{ marginBottom: '64px' }}>
              <div style={{
                background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.7) 100%)',
                border: '1px solid rgba(56, 189, 248, 0.35)',
                borderRadius: '24px',
                padding: '24px',
                boxShadow: '0 25px 60px -12px rgba(56, 189, 248, 0.2), 0 0 0 1px rgba(255,255,255,0.05)',
                overflow: 'hidden'
              }}>
                {/* Video Header Bar & Switcher Tabs */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingBottom: '16px',
                  marginBottom: '16px',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }} />
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b' }} />
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }} />
                    </div>
                    <span style={{ color: '#e2e8f0', fontWeight: 800, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Play size={14} fill="#38bdf8" color="#38bdf8" />
                      {selectedOverviewVideo === 'overview' && 'mavi-core overview 1.mp4'}
                      {selectedOverviewVideo === 'checksheet' && 'mavi-core check sheet.mp4'}
                      {selectedOverviewVideo === 'wi' && 'wi.mp4'}
                    </span>
                  </div>

                  {/* Video Selector Buttons */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => setSelectedOverviewVideo('overview')}
                      style={{
                        background: selectedOverviewVideo === 'overview' ? 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)' : 'rgba(255, 255, 255, 0.06)',
                        border: selectedOverviewVideo === 'overview' ? '1px solid rgba(59, 130, 246, 0.5)' : '1px solid rgba(255, 255, 255, 0.1)',
                        color: selectedOverviewVideo === 'overview' ? 'white' : '#94a3b8',
                        padding: '6px 14px',
                        borderRadius: '8px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 0.2s'
                      }}
                    >
                      <Sparkles size={13} color={selectedOverviewVideo === 'overview' ? '#60a5fa' : '#94a3b8'} />
                      Video 1: Platform Overview
                    </button>

                    <button
                      onClick={() => setSelectedOverviewVideo('checksheet')}
                      style={{
                        background: selectedOverviewVideo === 'checksheet' ? 'linear-gradient(135deg, #059669 0%, #047857 100%)' : 'rgba(255, 255, 255, 0.06)',
                        border: selectedOverviewVideo === 'checksheet' ? '1px solid rgba(52, 211, 153, 0.5)' : '1px solid rgba(255, 255, 255, 0.1)',
                        color: selectedOverviewVideo === 'checksheet' ? 'white' : '#94a3b8',
                        padding: '6px 14px',
                        borderRadius: '8px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 0.2s'
                      }}
                    >
                      <CheckCircle2 size={13} color={selectedOverviewVideo === 'checksheet' ? '#34d399' : '#94a3b8'} />
                      Video 2: Check Sheet
                    </button>

                    <button
                      onClick={() => setSelectedOverviewVideo('wi')}
                      style={{
                        background: selectedOverviewVideo === 'wi' ? 'linear-gradient(135deg, #9333ea 0%, #7e22ce 100%)' : 'rgba(255, 255, 255, 0.06)',
                        border: selectedOverviewVideo === 'wi' ? '1px solid rgba(168, 85, 247, 0.5)' : '1px solid rgba(255, 255, 255, 0.1)',
                        color: selectedOverviewVideo === 'wi' ? 'white' : '#94a3b8',
                        padding: '6px 14px',
                        borderRadius: '8px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 0.2s'
                      }}
                    >
                      <FileText size={13} color={selectedOverviewVideo === 'wi' ? '#c084fc' : '#94a3b8'} />
                      Video 3: Work Instruction (WI)
                    </button>

                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: 'rgba(56, 189, 248, 0.12)',
                      border: '1px solid rgba(56, 189, 248, 0.25)',
                      color: '#38bdf8',
                      padding: '4px 10px',
                      borderRadius: '100px',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      letterSpacing: '0.04em'
                    }}>
                      <RotateCw size={11} className="spin-slow" /> AUTO-LOOP
                    </div>
                  </div>
                </div>

                {/* HTML5 Video Player */}
                <div style={{
                  position: 'relative',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  background: '#000',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.6)'
                }}>
                  <video
                    key={selectedOverviewVideo}
                    controls
                    autoPlay
                    muted
                    playsInline
                    preload="metadata"
                    onEnded={() => {
                      setSelectedOverviewVideo(prev => {
                        if (prev === 'overview') return 'checksheet';
                        if (prev === 'checksheet') return 'wi';
                        return 'overview';
                      });
                    }}
                    style={{
                      width: '100%',
                      height: 'auto',
                      maxHeight: '680px',
                      display: 'block',
                      objectFit: 'contain',
                      borderRadius: '16px'
                    }}
                    src={
                      selectedOverviewVideo === 'overview' ? '/assets/mavi-core-overview-1.mp4' :
                      selectedOverviewVideo === 'checksheet' ? '/assets/mavi-core-check-sheet.mp4' :
                      '/assets/wi.mp4'
                    }
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>

                {/* Video Badges & Highlights */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '18px',
                  paddingTop: '14px',
                  borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}>
                  <div style={{ color: '#94a3b8', fontSize: '0.86rem' }}>
                    {selectedOverviewVideo === 'overview' && (
                      <span><strong>Video 1:</strong> Saksikan bagaimana MAVI menghubungkan aplikasi frontline, otomasi mesin PLC, dan OEE telemetry secara terpadu.</span>
                    )}
                    {selectedOverviewVideo === 'checksheet' && (
                      <span><strong>Video 2:</strong> Demonstrasi pengisian <strong>Digital Check Sheet</strong> & inspeksi kualitas tanpa kertas di stasiun kerja operator.</span>
                    )}
                    {selectedOverviewVideo === 'wi' && (
                      <span><strong>Video 3:</strong> Panduan perakitan interaktif <strong>Digital Work Instruction (WI)</strong> dengan instruksi visual langkah demi langkah.</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', fontSize: '0.8rem', color: '#cbd5e1', fontWeight: 700 }}>
                    <span style={{ color: '#38bdf8' }}>✓ No-Code App Builder</span>
                    <span style={{ color: '#34d399' }}>✓ Paperless Inspection</span>
                    <span style={{ color: '#c084fc' }}>✓ Guided Work Instruction</span>
                    <span style={{ color: '#fbbf24' }}>✓ Live OEE Cockpit</span>
                  </div>
                </div>
              </div>
            </section>

            {/* 1. HERO SECTION (TULIP STYLE: Adaptable production systems. Built around operations.) */}
            <section style={{
              background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.8) 50%, rgba(15, 23, 42, 0.95) 100%)',
              border: '1px solid rgba(59, 130, 246, 0.25)',
              borderRadius: '28px',
              padding: '56px 40px',
              position: 'relative',
              overflow: 'hidden',
              marginBottom: '50px',
              boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
            }}>
              {/* Background ambient glow effects */}
              <div style={{
                position: 'absolute',
                top: '-20%',
                right: '-10%',
                width: '450px',
                height: '450px',
                background: 'radial-gradient(circle, rgba(59, 130, 246, 0.2) 0%, transparent 70%)',
                filter: 'blur(70px)',
                pointerEvents: 'none'
              }} />
              <div style={{
                position: 'absolute',
                bottom: '-20%',
                left: '-10%',
                width: '400px',
                height: '400px',
                background: 'radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, transparent 70%)',
                filter: 'blur(70px)',
                pointerEvents: 'none'
              }} />

              <div style={{ maxWidth: '960px', margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'rgba(59, 130, 246, 0.12)',
                  border: '1px solid rgba(59, 130, 246, 0.35)',
                  padding: '6px 18px',
                  borderRadius: '100px',
                  color: '#60a5fa',
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  marginBottom: '24px'
                }}>
                  <Sparkles size={15} color="#60a5fa" /> Frontline Operations & Composable MES Platform
                </div>

                <h1 style={{
                  fontSize: 'clamp(2.4rem, 4.8vw, 3.8rem)',
                  lineHeight: 1.15,
                  fontWeight: 900,
                  color: 'white',
                  margin: '0 auto 24px auto',
                  letterSpacing: '-0.03em'
                }}>
                  Adaptable production systems. <br />
                  <span style={{
                    background: 'linear-gradient(135deg, #60a5fa 0%, #38bdf8 50%, #34d399 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}>
                    Built around frontline operations.
                  </span>
                </h1>

                <p style={{
                  fontSize: 'clamp(1rem, 1.8vw, 1.2rem)',
                  lineHeight: 1.65,
                  color: '#94a3b8',
                  maxWidth: '820px',
                  margin: '0 auto 36px auto',
                  fontWeight: 400
                }}>
                  Run manufacturing production with solutions as dynamic and unique as your factory floor. 
                  Build no-code operator apps, connect shop-floor PLCs & AI vision cameras, automate line triggers, and master real-time OEE on a unified, governed data model.
                </p>

                {/* Primary CTA Buttons */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap', marginBottom: '32px' }}>
                  <button
                    onClick={() => switchTab('store')}
                    style={{
                      background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                      border: 'none',
                      color: 'white',
                      padding: '14px 30px',
                      borderRadius: '12px',
                      fontWeight: 800,
                      fontSize: '0.95rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      boxShadow: '0 8px 25px rgba(37, 99, 235, 0.45)',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
                  >
                    <ShoppingBag size={18} /> Jelajahi Mavi Store ({storeTemplates.length}+ Apps)
                  </button>

                  <button
                    onClick={() => switchTab('builder')}
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.18)',
                      color: 'white',
                      padding: '14px 26px',
                      borderRadius: '12px',
                      fontWeight: 700,
                      fontSize: '0.95rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.14)'; e.currentTarget.style.borderColor = '#38bdf8'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'; e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.18)'; }}
                  >
                    <Layout size={18} color="#38bdf8" /> Buka App Builder Studio
                  </button>
                  <button
                    onClick={() => switchTab('pricing')}
                    style={{
                      background: 'rgba(16, 185, 129, 0.1)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      color: '#34d399',
                      padding: '14px 24px',
                      borderRadius: '12px',
                      fontWeight: 700,
                      fontSize: '0.95rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <Flame size={18} /> Lihat Harga & Pilot 30-Hari
                  </button>
                </div>

                {/* Quick Account Test Bar */}
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '16px',
                  background: 'rgba(15, 23, 42, 0.85)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  padding: '10px 20px',
                  borderRadius: '12px',
                  fontSize: '0.82rem',
                  color: '#94a3b8',
                  flexWrap: 'wrap',
                  justifyContent: 'center'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Users size={14} color="#38bdf8" />
                    <strong>Akun Demo Engineer:</strong> <span style={{ color: '#e2e8f0', fontFamily: 'monospace' }}>engineer / 123</span>
                  </div>
                  <div style={{ width: '1px', height: '14px', background: 'rgba(255,255,255,0.15)' }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Monitor size={14} color="#34d399" />
                    <strong>Operator:</strong> <span style={{ color: '#e2e8f0', fontFamily: 'monospace' }}>operator / 123</span>
                  </div>
                </div>
              </div>
            </section>

            {/* 2. CONNECTED ARTIFACTS: ONE COMPOSABLE PLATFORM (TULIP SIGNATURE 4 PILLARS) */}
            <section style={{ marginBottom: '60px' }}>
              <div style={{ textAlign: 'center', maxWidth: '780px', margin: '0 auto 36px auto' }}>
                <span style={{ fontSize: '0.8rem', color: '#38bdf8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  AUTHORING & COMPOSABILITY
                </span>
                <h2 style={{ fontSize: '2.2rem', fontWeight: 900, color: 'white', margin: '8px 0 12px 0', letterSpacing: '-0.02em' }}>
                  Connected Artifacts. One Composable Platform.
                </h2>
                <p style={{ color: '#94a3b8', fontSize: '1rem', lineHeight: '1.6', margin: 0 }}>
                  Semua elemen frontline beroperasi di atas satu Common Data Model (CDM). Data dan peristiwa dari operator, mesin, kamera, dan AI saling terhubung secara real-time tanpa batas sistem.
                </p>
              </div>

              {/* 4 Composable Pillars Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
                
                {/* Pillar 1: APPS */}
                <div style={{
                  background: 'rgba(15, 23, 42, 0.75)',
                  border: '1px solid rgba(59, 130, 246, 0.25)',
                  borderRadius: '20px',
                  padding: '28px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: '#3b82f6' }} />
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <span style={{ fontSize: '0.72rem', background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', padding: '4px 10px', borderRadius: '100px', fontWeight: 800, textTransform: 'uppercase' }}>
                        APPS
                      </span>
                      <Layout size={22} color="#3b82f6" />
                    </div>
                    <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'white', margin: '0 0 10px 0' }}>
                      Apps that streamline work
                    </h3>
                    <p style={{ color: '#94a3b8', fontSize: '0.88rem', lineHeight: '1.6', margin: '0 0 20px 0' }}>
                      Bangun instruksi kerja digital (SOP), checklist inspeksi QC, terminal Andon, dan panel manajemen shop-floor tanpa menulis satu baris kode pun.
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8rem', color: '#cbd5e1' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <CheckCircle2 size={14} color="#38bdf8" /> <span>Visual Drag-and-Drop Canvas</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <CheckCircle2 size={14} color="#38bdf8" /> <span>Operator Touchscreen & Barcode Ready</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <CheckCircle2 size={14} color="#38bdf8" /> <span>Step-by-Step Guided Assembly</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => switchTab('builder')}
                    style={{
                      marginTop: '24px',
                      background: 'rgba(59, 130, 246, 0.12)',
                      border: '1px solid rgba(59, 130, 246, 0.3)',
                      color: '#60a5fa',
                      padding: '10px 16px',
                      borderRadius: '10px',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <span>Jelajahi App Studio</span> <ChevronRight size={14} />
                  </button>
                </div>

                {/* Pillar 2: AGENTS */}
                <div style={{
                  background: 'rgba(15, 23, 42, 0.75)',
                  border: '1px solid rgba(168, 85, 247, 0.25)',
                  borderRadius: '20px',
                  padding: '28px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: '#a855f7' }} />
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <span style={{ fontSize: '0.72rem', background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', padding: '4px 10px', borderRadius: '100px', fontWeight: 800, textTransform: 'uppercase' }}>
                        AGENTS & AI
                      </span>
                      <Sparkles size={22} color="#a855f7" />
                    </div>
                    <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'white', margin: '0 0 10px 0' }}>
                      Agents grounded in context
                    </h3>
                    <p style={{ color: '#94a3b8', fontSize: '0.88rem', lineHeight: '1.6', margin: '0 0 20px 0' }}>
                      Agen AI dan model Computer Vision menganalisis data operasional real-time: membaca jangka sorong digital via OCR, mendeteksi cacat visual, dan memberikan rekomendasi terukur.
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8rem', color: '#cbd5e1' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <CheckCircle2 size={14} color="#a855f7" /> <span>Real-Time Caliper & Gauge OCR</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <CheckCircle2 size={14} color="#a855f7" /> <span>Vision QC Pass/Fail AI Inferences</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <CheckCircle2 size={14} color="#a855f7" /> <span>Guarded Context-Aware Decisions</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => switchTab('builder')}
                    style={{
                      marginTop: '24px',
                      background: 'rgba(168, 85, 247, 0.12)',
                      border: '1px solid rgba(168, 85, 247, 0.3)',
                      color: '#c084fc',
                      padding: '10px 16px',
                      borderRadius: '10px',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <span>Pelajari Solusi di App Builder</span> <ChevronRight size={14} />
                  </button>
                </div>

                {/* Pillar 3: AUTOMATIONS */}
                <div style={{
                  background: 'rgba(15, 23, 42, 0.75)',
                  border: '1px solid rgba(245, 158, 11, 0.25)',
                  borderRadius: '20px',
                  padding: '28px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: '#f59e0b' }} />
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <span style={{ fontSize: '0.72rem', background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', padding: '4px 10px', borderRadius: '100px', fontWeight: 800, textTransform: 'uppercase' }}>
                        AUTOMATIONS
                      </span>
                      <Zap size={22} color="#f59e0b" />
                    </div>
                    <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'white', margin: '0 0 10px 0' }}>
                      Automations that span the floor
                    </h3>
                    <p style={{ color: '#94a3b8', fontSize: '0.88rem', lineHeight: '1.6', margin: '0 0 20px 0' }}>
                      Hubungkan trigger otomatis lintas mesin PLC, aplikasi operator, timbangan, dan ERP. Setiap aksi menulis ke basis data bersama sehingga konteks lini tidak pernah terputus.
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8rem', color: '#cbd5e1' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <CheckCircle2 size={14} color="#f59e0b" /> <span>Event-Driven Shopfloor Triggers</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <CheckCircle2 size={14} color="#f59e0b" /> <span>Automated Andon Escalations</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <CheckCircle2 size={14} color="#f59e0b" /> <span>Live Supabase / Postgres Sync</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => switchTab('builder')}
                    style={{
                      marginTop: '24px',
                      background: 'rgba(245, 158, 11, 0.12)',
                      border: '1px solid rgba(245, 158, 11, 0.3)',
                      color: '#fbbf24',
                      padding: '10px 16px',
                      borderRadius: '10px',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <span>Buat Trigger di App Builder</span> <ChevronRight size={14} />
                  </button>
                </div>

                {/* Pillar 4: ANALYTICS */}
                <div style={{
                  background: 'rgba(15, 23, 42, 0.75)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  borderRadius: '20px',
                  padding: '28px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: '#10b981' }} />
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <span style={{ fontSize: '0.72rem', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', padding: '4px 10px', borderRadius: '100px', fontWeight: 800, textTransform: 'uppercase' }}>
                        ANALYTICS
                      </span>
                      <BarChart3 size={22} color="#10b981" />
                    </div>
                    <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'white', margin: '0 0 10px 0' }}>
                      Analytics with live data
                    </h3>
                    <p style={{ color: '#94a3b8', fontSize: '0.88rem', lineHeight: '1.6', margin: '0 0 20px 0' }}>
                      Susun analitik OEE real-time (Availability, Performance, Quality) langsung dari data operasional asli. Setiap metrik dapat ditelusuri ke stasiun dan kejadian downtime penyebabnya.
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8rem', color: '#cbd5e1' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <CheckCircle2 size={14} color="#10b981" /> <span>Real-Time OEE Radial Gauges</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <CheckCircle2 size={14} color="#10b981" /> <span>Downtime Root Cause Pareto</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <CheckCircle2 size={14} color="#10b981" /> <span>Cycle Time vs Takt Balancing</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => switchTab('store')}
                    style={{
                      marginTop: '24px',
                      background: 'rgba(16, 185, 129, 0.12)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      color: '#34d399',
                      padding: '10px 16px',
                      borderRadius: '10px',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <span>Pasang Dashboard dari Store</span> <ChevronRight size={14} />
                  </button>
                </div>

              </div>
            </section>

            {/* 3. OPEN CONNECTIVITY & CONTEXTUALIZED DATA (TULIP EDGE & IIOT ARCHITECTURE) */}
            <section style={{
              background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.6) 100%)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '24px',
              padding: '40px',
              marginBottom: '60px'
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '36px', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '0.78rem', color: '#38bdf8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    EDGE & IIOT INTEGRATION
                  </span>
                  <h2 style={{ fontSize: '2rem', fontWeight: 900, color: 'white', margin: '8px 0 14px 0', lineHeight: 1.25 }}>
                    Open connectivity. Contextualized data.
                  </h2>
                  <p style={{ color: '#94a3b8', fontSize: '0.95rem', lineHeight: '1.65', margin: '0 0 24px 0' }}>
                    Mesin PLC industri (Siemens S7, Omron, Mitsubishi, Modbus TCP), sensor getaran, timbangan digital RS232, barcode scanner, dan input operator terhubung langsung ke satu basis data relasional. Konteks pabrik mengalir otomatis ke seluruh aplikasi dan dashboard.
                  </p>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '28px' }}>
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <Cpu size={16} color="#38bdf8" style={{ marginBottom: '4px' }} />
                      <div style={{ color: 'white', fontWeight: 700, fontSize: '0.84rem' }}>Industrial Protocols</div>
                      <div style={{ color: '#94a3b8', fontSize: '0.74rem' }}>OPC-UA, MQTT, Modbus, REST</div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <Database size={16} color="#34d399" style={{ marginBottom: '4px' }} />
                      <div style={{ color: 'white', fontWeight: 700, fontSize: '0.84rem' }}>Common Data Model</div>
                      <div style={{ color: '#94a3b8', fontSize: '0.74rem' }}>Relational Tables & BOM</div>
                    </div>
                  </div>

                  <button
                    onClick={() => switchTab('builder')}
                    style={{
                      background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                      border: 'none',
                      color: 'white',
                      padding: '12px 24px',
                      borderRadius: '10px',
                      fontWeight: 800,
                      fontSize: '0.88rem',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <Cpu size={16} /> Pelajari Konektivitas Mesin & PLC <ArrowRight size={15} />
                  </button>
                </div>

                {/* Architecture Visual Diagram Card */}
                <div style={{
                  background: '#030712',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  borderRadius: '20px',
                  padding: '24px',
                  position: 'relative'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px' }}>
                    <span style={{ fontSize: '0.8rem', color: '#38bdf8', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Activity size={14} /> LIVE OPERATIONAL DATA FLOW
                    </span>
                    <span style={{ fontSize: '0.7rem', color: '#34d399', background: 'rgba(52, 211, 153, 0.15)', padding: '2px 8px', borderRadius: '100px', fontWeight: 700 }}>
                      Sub-second latency
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.03)', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <span style={{ fontSize: '0.8rem', color: '#e2e8f0', fontWeight: 600 }}>1. Shop Floor Devices & PLCs</span>
                      <span style={{ fontSize: '0.74rem', color: '#38bdf8', fontFamily: 'monospace' }}>Siemens S7 / Modbus / Calipers</span>
                    </div>
                    <div style={{ textAlign: 'center', color: '#64748b', fontSize: '0.75rem' }}>↓ MQTT / OPC-UA Telemetry Stream</div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(59, 130, 246, 0.1)', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                      <span style={{ fontSize: '0.8rem', color: '#60a5fa', fontWeight: 700 }}>2. MAVI Common Data Model</span>
                      <span style={{ fontSize: '0.74rem', color: '#34d399', fontWeight: 700 }}>Centralized Tables & Triggers</span>
                    </div>
                    <div style={{ textAlign: 'center', color: '#64748b', fontSize: '0.75rem' }}>↓ Real-Time Event Broadcasting</div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.03)', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <span style={{ fontSize: '0.8rem', color: '#e2e8f0', fontWeight: 600 }}>3. Operator Apps & Management Cockpit</span>
                      <span style={{ fontSize: '0.74rem', color: '#fbbf24', fontFamily: 'monospace' }}>HMI / OEE / Andon</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* 4. GOVERNANCE THAT SCALES (TULIP ENTERPRISE GOVERNANCE SECTION) */}
            <section style={{ marginBottom: '60px' }}>
              <div style={{ textAlign: 'center', maxWidth: '750px', margin: '0 auto 36px auto' }}>
                <span style={{ fontSize: '0.78rem', color: '#34d399', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  ENTERPRISE SCALABILITY
                </span>
                <h2 style={{ fontSize: '2.2rem', fontWeight: 900, color: 'white', margin: '8px 0 10px 0', letterSpacing: '-0.02em' }}>
                  Governance That Scales
                </h2>
                <p style={{ color: '#38bdf8', fontSize: '1.05rem', fontWeight: 700, margin: '0 0 8px 0' }}>
                  Standardize globally. Govern centrally. Configure locally.
                </p>
                <p style={{ color: '#94a3b8', fontSize: '0.92rem', lineHeight: '1.6', margin: 0 }}>
                  Kembangkan aplikasi manufaktur dengan cepat lintas lini produksi, pabrik, dan unit bisnis tanpa kehilangan kendali tata kelola TI dan kepatuhan mutu.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                <div style={{ background: 'rgba(15, 23, 42, 0.7)', padding: '26px', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <ShieldCheck size={26} color="#34d399" style={{ marginBottom: '14px' }} />
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'white', margin: '0 0 8px 0' }}>
                    Role-Based Access Control (RBAC)
                  </h4>
                  <p style={{ color: '#94a3b8', fontSize: '0.86rem', lineHeight: '1.55', margin: 0 }}>
                    Hak akses terisolasi untuk Operator Stasiun, QC Inspector, Manufacturing Engineer, Supervisor, hingga Administrator Sistem dengan autentikasi aman.
                  </p>
                </div>

                <div style={{ background: 'rgba(15, 23, 42, 0.7)', padding: '26px', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <Layers size={26} color="#38bdf8" style={{ marginBottom: '14px' }} />
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'white', margin: '0 0 8px 0' }}>
                    Release & Version Control
                  </h4>
                  <p style={{ color: '#94a3b8', fontSize: '0.86rem', lineHeight: '1.55', margin: 0 }}>
                    Kelola siklus hidup aplikasi dengan mode Draft, Testing/Staging, dan Published Release disertai audit rollback jika terjadi anomali di lini.
                  </p>
                </div>

                <div style={{ background: 'rgba(15, 23, 42, 0.7)', padding: '26px', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <FileText size={26} color="#fbbf24" style={{ marginBottom: '14px' }} />
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'white', margin: '0 0 8px 0' }}>
                    Immutable Digital Audit Trail
                  </h4>
                  <p style={{ color: '#94a3b8', fontSize: '0.86rem', lineHeight: '1.55', margin: 0 }}>
                    Setiap langkah pengerjaan, nilai torsi, hasil inspeksi, dan pergantian shift tercatat dengan stempel waktu dan ID operator yang tidak dapat diubah.
                  </p>
                </div>
              </div>
            </section>

            {/* 5. COMPLIANCE INHERITED (TULIP COMPLIANCE SECTION) */}
            <section style={{
              background: 'rgba(15, 23, 42, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '24px',
              padding: '36px',
              marginBottom: '60px'
            }}>
              <div style={{ textAlign: 'center', maxWidth: '750px', margin: '0 auto 30px auto' }}>
                <span style={{ fontSize: '0.78rem', color: '#ec4899', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  INDUSTRIAL COMPLIANCE & QUALITY
                </span>
                <h2 style={{ fontSize: '1.9rem', fontWeight: 900, color: 'white', margin: '8px 0 10px 0' }}>
                  Compliance inherited, not configured separately.
                </h2>
                <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: '1.6', margin: 0 }}>
                  Setiap artefak dan aplikasi mewarisi standar keamanan, integritas data, dan ketertelusuran manufaktur sejak saat dibuat tanpa konfigurasi rumit.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <Award size={20} color="#38bdf8" style={{ marginBottom: '8px' }} />
                  <strong style={{ color: '#e2e8f0', display: 'block', marginBottom: '4px', fontSize: '0.92rem' }}>GxP & GMP Capabilities</strong>
                  <p style={{ color: '#94a3b8', fontSize: '0.8rem', margin: 0, lineHeight: '1.45' }}>Kontrol bawaan untuk industri farmasi, F&B, dan kimia di tingkat data model.</p>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <ShieldAlert size={20} color="#34d399" style={{ marginBottom: '8px' }} />
                  <strong style={{ color: '#e2e8f0', display: 'block', marginBottom: '4px', fontSize: '0.92rem' }}>21 CFR Part 11 Alignment</strong>
                  <p style={{ color: '#94a3b8', fontSize: '0.8rem', margin: 0, lineHeight: '1.45' }}>Tanda tangan elektronik dan rekaman digital yang sesuai dengan regulasi FDA.</p>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <CheckCheck size={20} color="#fbbf24" style={{ marginBottom: '8px' }} />
                  <strong style={{ color: '#e2e8f0', display: 'block', marginBottom: '4px', fontSize: '0.92rem' }}>ISO 9001 & IATF 16949 Ready</strong>
                  <p style={{ color: '#94a3b8', fontSize: '0.8rem', margin: 0, lineHeight: '1.45' }}>Validasi toleransi LSL/USL otomatis, kalibrasi alat, dan karantina cacat non-conformance.</p>
                </div>
              </div>
            </section>

            {/* 6. DEPLOYED IN DAYS · BUILT TO COMPOUND (TULIP DEPLOYMENT MATRIX) */}
            <section style={{ marginBottom: '60px' }}>
              <div style={{ textAlign: 'center', maxWidth: '750px', margin: '0 auto 36px auto' }}>
                <span style={{ fontSize: '0.78rem', color: '#f59e0b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  SPEED & BUSINESS ROI
                </span>
                <h2 style={{ fontSize: '2.2rem', fontWeight: 900, color: 'white', margin: '8px 0 10px 0', letterSpacing: '-0.02em' }}>
                  Deployed in days. Built to compound.
                </h2>
                <p style={{ color: '#94a3b8', fontSize: '0.95rem', lineHeight: '1.6', margin: 0 }}>
                  Mulai dari tantangan prioritas tertinggi di lini 1. Setiap solusi baru menambah konteks bagi sistem yang sudah ada sehingga nilai platform berlipat ganda seiring waktu.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
                <div style={{ background: 'rgba(15, 23, 42, 0.7)', padding: '24px', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.08)', textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 900, color: '#38bdf8', marginBottom: '6px' }}>⚡ 2 Minggu</div>
                  <strong style={{ color: '#e2e8f0', display: 'block', marginBottom: '4px', fontSize: '0.95rem' }}>Deploy Lini Pertama</strong>
                  <p style={{ color: '#94a3b8', fontSize: '0.82rem', margin: 0, lineHeight: '1.45' }}>Implementasi workstation pertama siap produksi tanpa siklus proyek bertahun-tahun.</p>
                </div>

                <div style={{ background: 'rgba(15, 23, 42, 0.7)', padding: '24px', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.08)', textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 900, color: '#34d399', marginBottom: '6px' }}>📈 100% Shared</div>
                  <strong style={{ color: '#e2e8f0', display: 'block', marginBottom: '4px', fontSize: '0.95rem' }}>Compounding Context</strong>
                  <p style={{ color: '#94a3b8', fontSize: '0.82rem', margin: 0, lineHeight: '1.45' }}>Setiap aplikasi baru memperkaya data historis dan visibilitas proses pabrik.</p>
                </div>

                <div style={{ background: 'rgba(15, 23, 42, 0.7)', padding: '24px', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.08)', textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 900, color: '#f59e0b', marginBottom: '6px' }}>🛠️ 0 Kode</div>
                  <strong style={{ color: '#e2e8f0', display: 'block', marginBottom: '4px', fontSize: '0.95rem' }}>Frontline Empowerment</strong>
                  <p style={{ color: '#94a3b8', fontSize: '0.82rem', margin: 0, lineHeight: '1.45' }}>Manufacturing engineer membangun & memperbarui aplikasi tanpa antre di tim IT.</p>
                </div>

                <div style={{ background: 'rgba(15, 23, 42, 0.7)', padding: '24px', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.08)', textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 900, color: '#a855f7', marginBottom: '6px' }}>💰 30 Hari</div>
                  <strong style={{ color: '#e2e8f0', display: 'block', marginBottom: '4px', fontSize: '0.95rem' }}>Terukur Penghematan</strong>
                  <p style={{ color: '#94a3b8', fontSize: '0.82rem', margin: 0, lineHeight: '1.45' }}>Pengurangan nyata pada downtime, scrap rate, dan waktu pengisian dokumen kertas.</p>
                </div>
              </div>
            </section>

            {/* 7. QUICK ACCESS PLATFORM HUBS */}
            <section style={{ maxWidth: '1200px', margin: '0 auto 50px auto' }}>
              <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                <h3 style={{ fontSize: '1.7rem', fontWeight: 800, color: 'white', margin: '0 0 8px 0' }}>
                  Jelajahi Modul & Ekosistem Platform
                </h3>
                <p style={{ color: '#94a3b8', fontSize: '0.92rem', margin: 0 }}>
                  Klik modul di bawah untuk langsung mencoba demo dan fitur interaktifnya.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                {[
                  { icon: <ShoppingBag size={22} color="#38bdf8" />, title: 'Mavi Store', desc: `${storeTemplates.length}+ Template industri siap pasang (Play Store style).`, tab: 'store', tag: 'Marketplace' },
                  { icon: <Layout size={22} color="#3b82f6" />, title: 'App Builder', desc: 'No-Code visual drag-and-drop studio untuk SOP dan HMI operator.', tab: 'builder', tag: 'Visual Studio' },
                  { icon: <Flame size={22} color="#ec4899" />, title: 'Pricing & Value', desc: 'Harga transparan dan kalkulator ROI penghematan pabrik.', tab: 'pricing', tag: 'Investasi' },
                  { icon: <HelpCircle size={22} color="#c084fc" />, title: 'FAQ & Support', desc: 'Pertanyaan seputar migrasi cepat 2 minggu & dukungan teknis.', tab: 'faq', tag: 'Bantuan' }
                ].map((item, i) => (
                  <div
                    key={i}
                    onClick={() => switchTab(item.tab)}
                    style={{
                      background: 'rgba(15, 23, 42, 0.65)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '16px',
                      padding: '22px',
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
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <div>{item.icon}</div>
                        <span style={{ fontSize: '0.7rem', background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: '6px', color: '#cbd5e1' }}>{item.tag}</span>
                      </div>
                      <h4 style={{ color: 'white', margin: '0 0 6px 0', fontSize: '1.05rem', fontWeight: 800 }}>{item.title}</h4>
                      <p style={{ color: '#94a3b8', fontSize: '0.82rem', margin: 0, lineHeight: '1.45' }}>{item.desc}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#38bdf8', fontSize: '0.8rem', fontWeight: 700, marginTop: '16px' }}>
                      Buka Modul <ChevronRight size={14} />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* 8. SECTOR HIGHLIGHTS */}
            <section style={{
              background: 'rgba(15, 23, 42, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '20px',
              padding: '32px'
            }}>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'white', margin: '0 0 16px 0', textAlign: 'center' }}>
                Terbukti di Berbagai Sektor Manufaktur Utama Indonesia
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                {[
                  { title: 'Otomotif & Komponen Logam', desc: 'Perakitan poka-yoke, integrasi digital torque wrench, dan pelacakan cacat.' },
                  { title: 'Elektronika & PCBA', desc: 'Pelacakan lot serial, scan barcode, dan inspeksi AI camera OCR otomatis.' },
                  { title: 'Farmasi, Makanan & Minuman', desc: 'Electronic Batch Records (EBR), audit 5S, dan integrasi timbangan resep.' },
                  { title: 'Plastik & Pengemasan', desc: 'Pencatatan pergantian cetakan injeksi, analisis scrap, dan serah terima shift.' }
                ].map((sec, idx) => (
                  <div key={idx} style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <strong style={{ color: '#38bdf8', display: 'block', marginBottom: '4px', fontSize: '0.9rem' }}>{sec.title}</strong>
                    <p style={{ color: '#94a3b8', fontSize: '0.8rem', margin: 0, lineHeight: '1.4' }}>{sec.desc}</p>
                  </div>
                ))}
              </div>
            </section>

          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB: MAVI STORE & TEMPLATES MARKETPLACE (GOOGLE PLAY STORE STYLE) */}
        {/* ========================================================================= */}
        {activeTab === 'store' && (
          <div style={{ animation: 'fadeIn 0.3s ease', maxWidth: '1360px', margin: '0 auto', padding: '40px 30px' }}>
            
            {/* STORE HEADER & SEARCH */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.12) 0%, rgba(15, 23, 42, 0.8) 100%)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              borderRadius: '24px',
              padding: '36px',
              marginBottom: '36px',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute',
                top: '-30%',
                right: '-10%',
                width: '350px',
                height: '350px',
                background: 'radial-gradient(circle, rgba(59, 130, 246, 0.25) 0%, transparent 70%)',
                filter: 'blur(50px)',
                pointerEvents: 'none'
              }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '24px', flexWrap: 'wrap' }}>
                <div style={{ maxWidth: '680px' }}>
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: 'rgba(59, 130, 246, 0.2)',
                    border: '1px solid rgba(59, 130, 246, 0.4)',
                    color: '#60a5fa',
                    padding: '5px 14px',
                    borderRadius: '100px',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: '12px'
                  }}>
                    <ShoppingBag size={14} /> MAVI APP STORE & TEMPLATE MARKETPLACE
                  </div>
                  <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: 'white', margin: '0 0 12px 0', letterSpacing: '-0.02em' }}>
                    Siap Pakai untuk Shop Floor Pabrik Anda
                  </h1>
                  <p style={{ color: '#94a3b8', fontSize: '1.05rem', margin: 0, lineHeight: '1.6' }}>
                    Pasang template aplikasi industri instan seperti Google Play Store — lengkap dengan skema tabel database terhubung, logika trigger otomatis, dan visual HMI siap produksi.
                  </p>
                </div>

                {/* Quick Store Stats Badge */}
                <div style={{
                  display: 'flex',
                  gap: '16px',
                  background: 'rgba(15, 23, 42, 0.7)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  padding: '16px 20px',
                  borderRadius: '16px'
                }}>
                  <div style={{ textAlign: 'center', padding: '0 10px' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#38bdf8' }}>{storeTemplates.length}+</div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>Ready Templates</div>
                  </div>
                  <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)' }} />
                  <div style={{ textAlign: 'center', padding: '0 10px' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#34d399' }}>100%</div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>No-Code Editable</div>
                  </div>
                  <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)' }} />
                  <div style={{ textAlign: 'center', padding: '0 10px' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#f59e0b' }}>1-Click</div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>Direct Deploy</div>
                  </div>
                </div>
              </div>

              {/* SEARCH & QUICK FILTER BAR */}
              <div style={{ marginTop: '28px', display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: '1', minWidth: '280px' }}>
                  <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    placeholder="Cari aplikasi: Skill Matrix, Vision QC, Andon, OEE, Kanban..."
                    value={storeSearchQuery}
                    onChange={e => setStoreSearchQuery(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 14px 12px 42px',
                      background: 'rgba(15, 23, 42, 0.9)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '12px',
                      color: 'white',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                    onFocus={e => e.target.style.borderColor = '#3b82f6'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255, 255, 255, 0.15)'}
                  />
                  {storeSearchQuery && (
                    <button
                      onClick={() => setStoreSearchQuery('')}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'transparent',
                        border: 'none',
                        color: '#94a3b8',
                        cursor: 'pointer'
                      }}
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>

                <button
                  onClick={() => { setStoreActiveCategory('All'); setStoreSearchQuery(''); }}
                  style={{
                    background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                    border: 'none',
                    color: 'white',
                    padding: '12px 22px',
                    borderRadius: '12px',
                    fontWeight: 800,
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 15px rgba(37, 99, 235, 0.4)',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <Sparkles size={16} /> Tampilkan Semua ({storeTemplates.length}) Template
                </button>
              </div>

              {/* CATEGORY CHIPS (PLAY STORE STYLE) */}
              <div style={{
                display: 'flex',
                gap: '8px',
                marginTop: '18px',
                overflowX: 'auto',
                paddingBottom: '6px'
              }}>
                {storeCategories.map(cat => {
                  const isSelected = storeActiveCategory === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => setStoreActiveCategory(cat)}
                      style={{
                        padding: '7px 16px',
                        borderRadius: '100px',
                        fontSize: '0.82rem',
                        fontWeight: isSelected ? 800 : 600,
                        background: isSelected ? '#3b82f6' : 'rgba(255, 255, 255, 0.05)',
                        border: isSelected ? '1px solid #60a5fa' : '1px solid rgba(255, 255, 255, 0.1)',
                        color: isSelected ? 'white' : '#cbd5e1',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        transition: 'all 0.15s'
                      }}
                      onMouseEnter={e => {
                        if (!isSelected) {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                          e.currentTarget.style.color = 'white';
                        }
                      }}
                      onMouseLeave={e => {
                        if (!isSelected) {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                          e.currentTarget.style.color = '#cbd5e1';
                        }
                      }}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* SPOTLIGHT & TOP CHARTS (Only visible on All category with no search query) */}
            {!storeSearchQuery && storeActiveCategory === 'All' && (
              <>
                {/* SPOTLIGHT / FEATURED HERO BANNER CAROUSEL */}
                <div style={{ marginBottom: '40px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Sparkles size={18} color="#f59e0b" />
                      <h3 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'white', margin: 0 }}>
                        Featured & Editor's Choice Templates
                      </h3>
                    </div>
                    <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>Tulip & MES Industry Standard Compliant</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
                    {storeTemplates.slice(0, 3).map((item) => (
                      <div
                        key={item.id}
                        style={{
                          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.9) 100%)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '20px',
                          padding: '24px',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          position: 'relative',
                          overflow: 'hidden',
                          transition: 'all 0.25s',
                          boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.transform = 'translateY(-4px)';
                          e.currentTarget.style.borderColor = item.color;
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                        }}
                      >
                        {/* Top Accent bar */}
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: item.iconBg }} />

                        <div>
                          {/* Card Header with Icon, Badge & Category */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                            <div style={{
                              width: '56px',
                              height: '56px',
                              borderRadius: '14px',
                              background: item.iconBg,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: `0 6px 16px ${item.color}40`
                            }}>
                              {renderTemplateIcon(item.icon, 28)}
                            </div>
                            <span style={{
                              background: 'rgba(245, 158, 11, 0.15)',
                              border: '1px solid rgba(245, 158, 11, 0.3)',
                              color: '#fbbf24',
                              fontSize: '0.72rem',
                              fontWeight: 800,
                              padding: '4px 10px',
                              borderRadius: '100px',
                              textTransform: 'uppercase'
                            }}>
                              {item.badge}
                            </span>
                          </div>

                          {/* App Name & Category */}
                          <span style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            {item.category}
                          </span>
                          <h4 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'white', margin: '4px 0 8px 0', lineHeight: 1.3 }}>
                            {item.name}
                          </h4>
                          <p style={{ color: '#94a3b8', fontSize: '0.86rem', margin: '0 0 16px 0', lineHeight: '1.5' }}>
                            {item.tagline}
                          </p>

                          {/* Rating & Installs Strip */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '18px', fontSize: '0.82rem', color: '#cbd5e1' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#fbbf24', fontWeight: 800 }}>
                              <Star size={14} fill="#fbbf24" /> {item.rating}
                              <span style={{ color: '#64748b', fontWeight: 400 }}>({item.reviews})</span>
                            </div>
                            <span>·</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#94a3b8' }}>
                              <Download size={13} /> {item.installs} installs
                            </div>
                            <span>·</span>
                            <span style={{ color: '#64748b' }}>{item.version}</span>
                          </div>

                          {/* Feature Tags */}
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '20px' }}>
                            {item.features.slice(0, 3).map((f, fi) => (
                              <span key={fi} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', padding: '3px 8px', borderRadius: '6px', fontSize: '0.72rem', color: '#cbd5e1' }}>
                                ✓ {f}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: '10px', marginTop: 'auto' }}>
                          <button
                            onClick={() => { setSelectedTemplateModal(item); setStoreActiveStepIndex(0); }}
                            style={{
                              flex: 1,
                              padding: '10px 14px',
                              background: 'rgba(255, 255, 255, 0.08)',
                              border: '1px solid rgba(255, 255, 255, 0.15)',
                              color: 'white',
                              borderRadius: '10px',
                              fontSize: '0.82rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px'
                            }}
                          >
                            <Eye size={14} /> Lihat Detail
                          </button>
                          <button
                            onClick={() => handleInstallTemplate(item)}
                            style={{
                              flex: 1,
                              padding: '10px 14px',
                              background: item.iconBg,
                              border: 'none',
                              color: 'white',
                              borderRadius: '10px',
                              fontSize: '0.82rem',
                              fontWeight: 800,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px',
                              boxShadow: `0 4px 12px ${item.color}40`
                            }}
                          >
                            {storeInstalledList[item.id] ? <Check size={14} /> : <Download size={14} />}
                            {storeInstalledList[item.id] ? 'Installed' : 'Deploy App'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* TOP CHARTS RANKED STRIP (PLAY STORE STYLE) */}
                <div style={{
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '20px',
                  padding: '24px 28px',
                  marginBottom: '40px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <TrendingUp size={18} color="#34d399" />
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'white', margin: 0 }}>
                        Top Charts: Paling Banyak Dipasang Minggu Ini
                      </h3>
                    </div>
                    <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Live Shop Floor Rankings</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                    {storeTemplates.slice(0, 4).map((item, idx) => (
                      <div
                        key={item.id}
                        onClick={() => { setSelectedTemplateModal(item); setStoreActiveStepIndex(0); }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '14px',
                          padding: '12px 14px',
                          borderRadius: '12px',
                          background: 'rgba(255,255,255,0.02)',
                          border: '1px solid rgba(255,255,255,0.05)',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor = '#38bdf8'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'; }}
                      >
                        <span style={{ fontSize: '1.2rem', fontWeight: 900, color: idx === 0 ? '#fbbf24' : idx === 1 ? '#cbd5e1' : '#94a3b8', width: '20px', textAlign: 'center' }}>
                          {idx + 1}
                        </span>
                        <div style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '10px',
                          background: item.iconBg,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          {renderTemplateIcon(item.icon, 20)}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ color: 'white', fontWeight: 700, fontSize: '0.88rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {item.name}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#94a3b8' }}>
                            <span>{item.category}</span>
                            <span>·</span>
                            <span style={{ color: '#fbbf24', fontWeight: 700 }}>★ {item.rating}</span>
                          </div>
                        </div>
                        <ChevronRight size={16} color="#64748b" />
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* FULL TEMPLATE CATALOG GRID */}
            <div style={{ marginBottom: '40px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h3 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'white', margin: '0 0 4px 0' }}>
                    {storeSearchQuery
                      ? `Hasil Pencarian untuk "${storeSearchQuery}" (${filteredStoreTemplates.length})`
                      : storeActiveCategory !== 'All'
                        ? `Kategori: ${storeActiveCategory} (${filteredStoreTemplates.length})`
                        : `Semua Aplikasi & Template (${filteredStoreTemplates.length})`}
                  </h3>
                  <p style={{ color: '#94a3b8', fontSize: '0.88rem', margin: 0 }}>
                    {storeSearchQuery ? (
                      <span>Filter pencarian aktif · Kategori: <strong style={{ color: '#38bdf8' }}>{storeActiveCategory}</strong></span>
                    ) : (
                      <span>Kategori aktif: <strong style={{ color: '#38bdf8' }}>{storeActiveCategory}</strong></span>
                    )}
                  </p>
                </div>

                {(storeSearchQuery || storeActiveCategory !== 'All') && (
                  <button
                    onClick={() => { setStoreSearchQuery(''); setStoreActiveCategory('All'); }}
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#cbd5e1',
                      padding: '7px 14px',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    ✕ Reset Filter ({storeTemplates.length} total)
                  </button>
                )}
              </div>

              {filteredStoreTemplates.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '60px 20px',
                  background: 'rgba(15, 23, 42, 0.4)',
                  borderRadius: '20px',
                  border: '1px dashed rgba(255, 255, 255, 0.15)'
                }}>
                  <ShoppingBag size={48} color="#64748b" style={{ margin: '0 auto 16px auto', display: 'block' }} />
                  <h4 style={{ color: 'white', fontSize: '1.2rem', margin: '0 0 8px 0' }}>
                    {storeActiveCategory === 'App Management'
                      ? 'Belum Ada Aplikasi Terpasang'
                      : 'Tidak Ada Template yang Cocok'}
                  </h4>
                  <p style={{ color: '#94a3b8', margin: '0 0 16px 0', maxWidth: '480px', marginInline: 'auto' }}>
                    {storeActiveCategory === 'App Management'
                      ? 'Aplikasi yang Anda klik "Deploy / Pasang" akan muncul di tab App Management ini untuk dikelola.'
                      : storeActiveCategory !== 'All' && totalSearchMatchesAllCategories > 0
                        ? `Tidak ada hasil "${storeSearchQuery}" di kategori "${storeActiveCategory}". Ditemukan ${totalSearchMatchesAllCategories} aplikasi yang cocok di kategori lain.`
                        : `Tidak ditemukan template dengan kata kunci "${storeSearchQuery}".`}
                  </p>
                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                    {storeActiveCategory !== 'All' && (
                      <button
                        onClick={() => setStoreActiveCategory('All')}
                        style={{
                          background: '#2563eb',
                          border: 'none',
                          color: 'white',
                          padding: '8px 18px',
                          borderRadius: '8px',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        Cari di Semua Kategori {storeSearchQuery ? `(${totalSearchMatchesAllCategories})` : ''}
                      </button>
                    )}
                    <button
                      onClick={() => { setStoreSearchQuery(''); setStoreActiveCategory('All'); }}
                      style={{
                        background: 'rgba(255,255,255,0.08)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        color: 'white',
                        padding: '8px 18px',
                        borderRadius: '8px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      Reset Filter
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                  {filteredStoreTemplates.map((template) => (
                    <div
                      key={template.id}
                      style={{
                        background: 'rgba(15, 23, 42, 0.75)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '16px',
                        padding: '20px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        transition: 'all 0.2s',
                        cursor: 'pointer'
                      }}
                      onClick={() => { setSelectedTemplateModal(template); setStoreActiveStepIndex(0); }}
                      onMouseEnter={e => {
                        e.currentTarget.style.transform = 'translateY(-3px)';
                        e.currentTarget.style.borderColor = '#38bdf8';
                        e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.3)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <div>
                        {/* App Icon + Title Header */}
                        <div style={{ display: 'flex', gap: '14px', marginBottom: '14px' }}>
                          <div style={{
                            width: '50px',
                            height: '50px',
                            borderRadius: '12px',
                            background: template.iconBg,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            boxShadow: `0 4px 12px ${template.color}30`
                          }}>
                            {renderTemplateIcon(template.icon, 24)}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                              <span style={{ fontSize: '0.7rem', color: '#38bdf8', fontWeight: 800, textTransform: 'uppercase' }}>
                                {template.category}
                              </span>
                            </div>
                            <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'white', margin: 0, lineHeight: '1.3' }}>
                              {template.name}
                            </h4>
                          </div>
                        </div>

                        {/* Description */}
                        <p style={{
                          color: '#94a3b8',
                          fontSize: '0.84rem',
                          margin: '0 0 14px 0',
                          lineHeight: '1.45',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}>
                          {template.tagline}
                        </p>

                        {/* Ratings & Downloads */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.78rem', color: '#cbd5e1', marginBottom: '14px' }}>
                          <span style={{ color: '#fbbf24', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <Star size={12} fill="#fbbf24" /> {template.rating}
                          </span>
                          <span>·</span>
                          <span style={{ color: '#94a3b8' }}>{template.installs} installs</span>
                          <span>·</span>
                          <span style={{ color: '#34d399', fontWeight: 600 }}>{template.badge}</span>
                        </div>

                        {/* Tables included pill */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem', color: '#94a3b8', marginBottom: '16px' }}>
                          <Database size={13} color="#38bdf8" />
                          <span>Includes {template.tables.length} Tables & {template.triggers.length} Logic Triggers</span>
                        </div>
                      </div>

                      {/* Card Action Buttons */}
                      <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '14px' }} onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => { setSelectedTemplateModal(template); setStoreActiveStepIndex(0); }}
                          style={{
                            flex: 1,
                            padding: '8px 12px',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: '#cbd5e1',
                            borderRadius: '8px',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          Details
                        </button>
                        <button
                          onClick={() => handleInstallTemplate(template)}
                          style={{
                            flex: 1.2,
                            padding: '8px 12px',
                            background: template.iconBg,
                            border: 'none',
                            color: 'white',
                            borderRadius: '8px',
                            fontSize: '0.78rem',
                            fontWeight: 800,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px'
                          }}
                        >
                          {storeInstalledList[template.id] ? <Check size={12} /> : <Download size={12} />}
                          {storeInstalledList[template.id] ? 'Installed' : 'Deploy'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* BOTTOM BUILDER CTA BANNER */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.8) 100%)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '20px',
              padding: '30px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '24px',
              flexWrap: 'wrap'
            }}>
              <div>
                <h4 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'white', margin: '0 0 6px 0' }}>
                  Perlu Template Kustom Khusus Pabrik Anda?
                </h4>
                <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: 0 }}>
                  Gunakan Visual App Builder untuk membuat HMI kustom tanpa kode, atau hubungi tim engineer kami untuk template pesanan.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => switchTab('builder')}
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    padding: '10px 18px',
                    borderRadius: '10px',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  <Layout size={14} style={{ display: 'inline', marginRight: '6px' }} /> Buka App Builder
                </button>
                <button
                  onClick={() => setIsWalkthroughModalOpen(true)}
                  style={{
                    background: '#2563eb',
                    border: 'none',
                    color: 'white',
                    padding: '10px 20px',
                    borderRadius: '10px',
                    fontSize: '0.85rem',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  Request Custom App
                </button>
              </div>
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* 2. TAB: APP BUILDER (NO-CODE FRONTLINE APP STUDIO) */}
        {/* ========================================================================= */}
        {activeTab === 'builder' && (
          <div style={{ animation: 'fadeIn 0.3s ease', maxWidth: '1360px', margin: '0 auto', padding: '20px 24px 60px 24px', boxSizing: 'border-box' }}>
            
            {/* 1. HERO SECTION (IMAGE 1: FACTORIES CAN ALSO BUILD APPS WITHOUT CODING) */}
            <section style={{
              background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.85) 100%)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              borderRadius: '28px',
              padding: '44px 36px',
              marginBottom: '50px',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 20px 50px rgba(0,0,0,0.4)'
            }}>
              <div style={{
                position: 'absolute',
                top: '-20%',
                right: '-10%',
                width: '450px',
                height: '450px',
                background: 'radial-gradient(circle, rgba(59, 130, 246, 0.2) 0%, transparent 70%)',
                filter: 'blur(70px)',
                pointerEvents: 'none'
              }} />

              {/* Top Banner Tag */}
              <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'rgba(59, 130, 246, 0.15)',
                  border: '1px solid rgba(59, 130, 246, 0.35)',
                  padding: '6px 18px',
                  borderRadius: '100px',
                  color: '#60a5fa',
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  marginBottom: '16px'
                }}>
                  <Layout size={15} /> NO-CODE FRONTLINE APP STUDIO
                </div>

                <h1 style={{
                  fontSize: 'clamp(2rem, 3.8vw, 3rem)',
                  fontWeight: 900,
                  color: 'white',
                  lineHeight: 1.15,
                  margin: '0 auto 14px auto',
                  letterSpacing: '-0.02em',
                  maxWidth: '1000px'
                }}>
                  FACTORIES CAN ALSO BUILD APPS <br />
                  <span style={{
                    background: 'linear-gradient(135deg, #60a5fa 0%, #38bdf8 50%, #34d399 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}>
                    WITHOUT CODING, DATABASE, OR IT EXPERTS
                  </span>
                </h1>

                <p style={{
                  fontSize: '1.15rem',
                  color: '#94a3b8',
                  maxWidth: '780px',
                  margin: '0 auto 28px auto',
                  lineHeight: 1.6
                }}>
                  Build your own factory apps easily with drag & drop — just like filling out a form!
                </p>

                {/* Primary Action Buttons */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => {
                      const el = document.getElementById('builder-simulator');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                    style={{
                      background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                      border: 'none',
                      color: 'white',
                      padding: '14px 30px',
                      borderRadius: '12px',
                      fontWeight: 800,
                      fontSize: '0.95rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      boxShadow: '0 8px 24px rgba(37, 99, 235, 0.4)',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
                  >
                    <Play size={18} fill="white" /> Coba Simulator Interaktif
                  </button>

                  <button
                    onClick={() => navigate('/login')}
                    style={{
                      background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(37, 99, 235, 0.25) 100%)',
                      border: '1px solid rgba(59, 130, 246, 0.4)',
                      color: '#60a5fa',
                      padding: '14px 26px',
                      borderRadius: '12px',
                      fontWeight: 700,
                      fontSize: '0.95rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <Layout size={18} /> Launch Full Studio Workspace
                  </button>

                  <button
                    onClick={() => switchTab('store')}
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      color: 'white',
                      padding: '14px 24px',
                      borderRadius: '12px',
                      fontWeight: 700,
                      fontSize: '0.95rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <ShoppingBag size={18} color="#38bdf8" /> Pasang dari Mavi Store
                  </button>
                </div>
              </div>

              {/* Main Illustration Preview (Image 1) */}
              <div style={{
                borderRadius: '20px',
                overflow: 'hidden',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
                marginBottom: '32px',
                background: '#090d16'
              }}>
                <img
                  src="/assets/builder-hero-nocode.jpg"
                  alt="Factories Can Also Build Apps Without Coding"
                  style={{ width: '100%', height: 'auto', display: 'block', objectFit: 'contain' }}
                />
              </div>

              {/* 5 Core Feature Capabilities Grid (From Image 1) */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '14px',
                marginBottom: '28px'
              }}>
                {[
                  { icon: <SlidersHorizontal size={20} color="#38bdf8" />, title: 'Drag & Drop UI Builder', desc: 'Design your app with simple drag & drop.' },
                  { icon: <Workflow size={20} color="#34d399" />, title: 'Multi-Step Workflows', desc: 'Automate your process step by step.' },
                  { icon: <Zap size={20} color="#fbbf24" />, title: 'Conditional Logic & Triggers', desc: 'Set rules and triggers easily.' },
                  { icon: <Database size={20} color="#c084fc" />, title: 'No Coding, No Database', desc: 'Build apps without coding or databases.' },
                  { icon: <Users size={20} color="#f472b6" />, title: 'Anyone Can Build', desc: 'Engineers, operators, managers – anyone can build their own apps.' }
                ].map((item, idx) => (
                  <div key={idx} style={{
                    background: 'rgba(15, 23, 42, 0.65)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '14px',
                    padding: '18px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {item.icon}
                      <strong style={{ color: 'white', fontSize: '0.92rem' }}>{item.title}</strong>
                    </div>
                    <p style={{ color: '#94a3b8', fontSize: '0.82rem', margin: 0, lineHeight: 1.4 }}>{item.desc}</p>
                  </div>
                ))}
              </div>

              {/* 4 Bottom Value Highlights (From Image 1) */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '14px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                padding: '20px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <CheckCircle2 size={24} color="#34d399" style={{ flexShrink: 0 }} />
                  <div>
                    <strong style={{ color: 'white', fontSize: '0.9rem', display: 'block' }}>Faster Development</strong>
                    <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Build apps in hours, not weeks.</span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <TrendingUp size={24} color="#38bdf8" style={{ flexShrink: 0 }} />
                  <div>
                    <strong style={{ color: 'white', fontSize: '0.9rem', display: 'block' }}>Reduce Costs</strong>
                    <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>No need for IT or external developers.</span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <ShieldCheck size={24} color="#fbbf24" style={{ flexShrink: 0 }} />
                  <div>
                    <strong style={{ color: 'white', fontSize: '0.9rem', display: 'block' }}>Better Control</strong>
                    <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Create exactly what your factory needs.</span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Flame size={24} color="#a855f7" style={{ flexShrink: 0 }} />
                  <div>
                    <strong style={{ color: 'white', fontSize: '0.9rem', display: 'block' }}>Go Live Quickly</strong>
                    <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Deploy and start using your app right away.</span>
                  </div>
                </div>
              </div>
            </section>

            {/* 2. WORKFLOW SECTION (IMAGE 2: BUILD, DEPLOY, AND USE APPS - WITHOUT CODING) */}
            <section style={{
              background: 'rgba(15, 23, 42, 0.75)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '28px',
              padding: '44px 36px',
              marginBottom: '50px'
            }}>
              <div style={{ textAlign: 'center', maxWidth: '850px', margin: '0 auto 36px auto' }}>
                <span style={{ fontSize: '0.8rem', color: '#38bdf8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  END-TO-END DEPLOYMENT WORKFLOW
                </span>
                <h2 style={{ fontSize: '2.3rem', fontWeight: 900, color: 'white', margin: '8px 0 12px 0', letterSpacing: '-0.02em' }}>
                  BUILD, DEPLOY, AND USE APPS – WITHOUT CODING
                </h2>
                <p style={{ color: '#94a3b8', fontSize: '1.05rem', margin: 0 }}>
                  From Admin to Operator – Everyone Can Build and Use Apps Easily
                </p>
              </div>

              {/* Illustration Image 2 */}
              <div style={{
                borderRadius: '20px',
                overflow: 'hidden',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                marginBottom: '36px',
                background: '#090d16'
              }}>
                <img
                  src="/assets/builder-workflow-deploy.jpg"
                  alt="Build, Deploy, and Use Apps - Without Coding"
                  style={{ width: '100%', height: 'auto', display: 'block', objectFit: 'contain' }}
                />
              </div>

              {/* 6 Step Interactive Cards Breakdown */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '18px',
                marginBottom: '32px'
              }}>
                {[
                  { step: '1', role: 'ADMIN', title: 'ADMIN BUILDS APP', desc: 'Admin uses drag & drop builder to create apps – no coding needed.', note: '✓ No coding. No database. Just drag & drop.', color: '#3b82f6' },
                  { step: '2', role: 'ADMIN', title: 'ADMIN CREATES STATION', desc: 'Admin creates stations and assigns the app to each station.', note: '✓ Organize stations. Assign apps. Done.', color: '#0284c7' },
                  { step: '3', role: 'ADMIN', title: 'ADMIN DEPLOYS APP TO STATION', desc: 'Admin deploys the app to the desired station so it\'s ready to use on the shop floor.', note: '✓ One-click deploy. Instantly available.', color: '#10b981' },
                  { step: '4', role: 'OPERATOR', title: 'OPERATOR OPENS APP', desc: 'Operator opens the app on the station device (PC, tablet, or kiosk).', note: '✓ Simple and user-friendly. Open and start working.', color: '#f59e0b' },
                  { step: '5', role: 'OPERATOR', title: 'OPERATOR FILLS & SUBMITS', desc: 'Operator fills out the form and submits data in real time.', note: '✓ No manual paperwork. Data is saved instantly.', color: '#ec4899' },
                  { step: '6', role: 'SYSTEM', title: 'DATA IS SAVED & TRACKED BY STATION', desc: 'All data is stored and can be tracked by station in real time.', note: '✓ Real-time visibility. Better control and traceability.', color: '#a855f7' }
                ].map((st, i) => (
                  <div key={i} style={{
                    background: 'rgba(15, 23, 42, 0.85)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '16px',
                    padding: '22px',
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: st.color }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                      <span style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: st.color,
                        color: 'white',
                        fontWeight: 900,
                        fontSize: '0.85rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {st.step}
                      </span>
                      <strong style={{ color: 'white', fontSize: '0.95rem' }}>{st.title}</strong>
                    </div>
                    <p style={{ color: '#94a3b8', fontSize: '0.85rem', lineHeight: '1.5', margin: '0 0 12px 0' }}>
                      {st.desc}
                    </p>
                    <div style={{ fontSize: '0.78rem', color: '#38bdf8', fontWeight: 700 }}>
                      {st.note}
                    </div>
                  </div>
                ))}
              </div>

              {/* Bottom Feature Badges (From Image 2) */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '12px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '16px',
                padding: '16px 20px'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <strong style={{ color: '#38bdf8', display: 'block', fontSize: '0.88rem' }}>FOR EVERYONE</strong>
                  <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Admins, engineers, operators – anyone can build.</span>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <strong style={{ color: '#34d399', display: 'block', fontSize: '0.88rem' }}>NO CODING</strong>
                  <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>No programming skills required.</span>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <strong style={{ color: '#fbbf24', display: 'block', fontSize: '0.88rem' }}>NO DATABASE SETUP</strong>
                  <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>No complex configurations needed.</span>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <strong style={{ color: '#a855f7', display: 'block', fontSize: '0.88rem' }}>DEPLOY IN MINUTES</strong>
                  <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Build, deploy, and use in minutes.</span>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <strong style={{ color: '#ec4899', display: 'block', fontSize: '0.88rem' }}>REAL-TIME VISIBILITY</strong>
                  <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Track data by station in real time.</span>
                </div>
              </div>
            </section>

            {/* 3. THREE WAYS TO CREATE APPS (IMAGE 3: 3 WAYS TO CREATE APPS - NO CODING, NO DATABASE) */}
            <section style={{
              background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.8) 100%)',
              border: '1px solid rgba(59, 130, 246, 0.25)',
              borderRadius: '28px',
              padding: '44px 36px',
              marginBottom: '50px'
            }}>
              <div style={{ textAlign: 'center', maxWidth: '850px', margin: '0 auto 36px auto' }}>
                <span style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  FLEXIBLE CREATION STRATEGIES
                </span>
                <h2 style={{ fontSize: '2.3rem', fontWeight: 900, color: 'white', margin: '8px 0 12px 0', letterSpacing: '-0.02em' }}>
                  3 WAYS TO CREATE APPS – NO CODING, NO DATABASE
                </h2>
                <p style={{ color: '#94a3b8', fontSize: '1.05rem', margin: 0 }}>
                  Build your industrial apps easily with MES CORE
                </p>
              </div>

              {/* Illustration Image 3 */}
              <div style={{
                borderRadius: '20px',
                overflow: 'hidden',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                marginBottom: '36px',
                background: '#090d16'
              }}>
                <img
                  src="/assets/builder-3ways-create.jpg"
                  alt="3 Ways to Create Apps - No Coding, No Database"
                  style={{ width: '100%', height: 'auto', display: 'block', objectFit: 'contain' }}
                />
              </div>

              {/* 3 Ways Detailed Columns */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '24px',
                marginBottom: '32px'
              }}>
                
                {/* Strategy 1: Template Store */}
                <div style={{
                  background: 'rgba(15, 23, 42, 0.85)',
                  border: '1px solid rgba(52, 211, 153, 0.3)',
                  borderRadius: '20px',
                  padding: '28px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                      <span style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#10b981', color: 'white', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>1</span>
                      <strong style={{ color: 'white', fontSize: '1.1rem' }}>DOWNLOAD TEMPLATE</strong>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: 700, display: 'block', marginBottom: '8px' }}>From MAVI App Store</span>
                    <p style={{ color: '#94a3b8', fontSize: '0.88rem', lineHeight: '1.6', margin: '0 0 16px 0' }}>
                      Browse and download ready-to-use templates from MAVI App Store. Customize and deploy instantly for Quality, Manufacturing, Production & more.
                    </p>
                    <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '10px 14px', borderRadius: '10px', fontSize: '0.78rem', color: '#34d399', fontWeight: 700, marginBottom: '16px' }}>
                      DOWNLOAD ➔ CUSTOMIZE ➔ DEPLOY ➔ USE
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#cbd5e1' }}>
                      <strong>Best for:</strong> Quick start with proven industry templates.
                    </div>
                  </div>
                  <button
                    onClick={() => switchTab('store')}
                    style={{
                      marginTop: '20px',
                      background: 'rgba(16, 185, 129, 0.15)',
                      border: '1px solid rgba(16, 185, 129, 0.4)',
                      color: '#34d399',
                      padding: '10px 16px',
                      borderRadius: '10px',
                      fontWeight: 800,
                      fontSize: '0.85rem',
                      cursor: 'pointer'
                    }}
                  >
                    Buka Mavi Store Catalog
                  </button>
                </div>

                {/* Strategy 2: Manual Drag & Drop */}
                <div style={{
                  background: 'rgba(15, 23, 42, 0.85)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  borderRadius: '20px',
                  padding: '28px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                      <span style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#3b82f6', color: 'white', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>2</span>
                      <strong style={{ color: 'white', fontSize: '1.1rem' }}>MANUAL DRAG & DROP</strong>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#60a5fa', fontWeight: 700, display: 'block', marginBottom: '8px' }}>To Visual Canvas</span>
                    <p style={{ color: '#94a3b8', fontSize: '0.88rem', lineHeight: '1.6', margin: '0 0 16px 0' }}>
                      Drag widgets from the toolbar and build your app on the canvas. Full control with logic triggers, relational tables, validation, and layout tools.
                    </p>
                    <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '10px 14px', borderRadius: '10px', fontSize: '0.78rem', color: '#60a5fa', fontWeight: 700, marginBottom: '16px' }}>
                      DRAG ➔ CONFIGURE ➔ SAVE ➔ DEPLOY
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#cbd5e1' }}>
                      <strong>Best for:</strong> Custom apps built to match your exact factory needs.
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      const el = document.getElementById('builder-simulator');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                    style={{
                      marginTop: '20px',
                      background: 'rgba(59, 130, 246, 0.15)',
                      border: '1px solid rgba(59, 130, 246, 0.4)',
                      color: '#60a5fa',
                      padding: '10px 16px',
                      borderRadius: '10px',
                      fontWeight: 800,
                      fontSize: '0.85rem',
                      cursor: 'pointer'
                    }}
                  >
                    Buka Drag & Drop Canvas
                  </button>
                </div>

                {/* Strategy 3: AI Copilot */}
                <div style={{
                  background: 'rgba(15, 23, 42, 0.85)',
                  border: '1px solid rgba(168, 85, 247, 0.3)',
                  borderRadius: '20px',
                  padding: '28px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                      <span style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#a855f7', color: 'white', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>3</span>
                      <strong style={{ color: 'white', fontSize: '1.1rem' }}>GENERATE WITH COPILOT</strong>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#c084fc', fontWeight: 700, display: 'block', marginBottom: '8px' }}>AI-Powered Generation</span>
                    <p style={{ color: '#94a3b8', fontSize: '0.88rem', lineHeight: '1.6', margin: '0 0 16px 0' }}>
                      Describe what you need in plain text. Copilot (AI) automatically generates the screens, forms, relational tables, logic triggers, and charts for you.
                    </p>
                    <div style={{ background: 'rgba(168, 85, 247, 0.1)', padding: '10px 14px', borderRadius: '10px', fontSize: '0.78rem', color: '#c084fc', fontWeight: 700, marginBottom: '16px' }}>
                      DESCRIBE ➔ GENERATE ➔ REVIEW ➔ DEPLOY
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#cbd5e1' }}>
                      <strong>Best for:</strong> Rapid application creation with conversational AI.
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      const el = document.getElementById('builder-simulator');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                    style={{
                      marginTop: '20px',
                      background: 'rgba(168, 85, 247, 0.15)',
                      border: '1px solid rgba(168, 85, 247, 0.4)',
                      color: '#c084fc',
                      padding: '10px 16px',
                      borderRadius: '10px',
                      fontWeight: 800,
                      fontSize: '0.85rem',
                      cursor: 'pointer'
                    }}
                  >
                    Coba AI Copilot Generator
                  </button>
                </div>

              </div>

              {/* Bottom Station Deployment Bar */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                padding: '20px 24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '16px'
              }}>
                <div>
                  <h4 style={{ color: 'white', margin: '0 0 4px 0', fontSize: '1rem', fontWeight: 800 }}>
                    DEPLOY TO STATION & START USING
                  </h4>
                  <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.85rem' }}>
                    Deploy your app to the right station. Operators open the app on PC, tablet, or kiosk and start working.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '0.82rem', color: '#cbd5e1', fontWeight: 700 }}>
                  <span style={{ color: '#34d399' }}>✓ Real-time Data</span>
                  <span style={{ color: '#38bdf8' }}>✓ Track & Monitor</span>
                  <span style={{ color: '#fbbf24' }}>✓ Improve Productivity</span>
                  <span style={{ color: '#c084fc' }}>✓ Ensure Quality</span>
                </div>
              </div>
            </section>

            {/* 4. INTERACTIVE VISUAL WIDGET SIMULATOR CANVAS */}
            <section
              id="builder-simulator"
              style={{
                background: 'rgba(15, 23, 42, 0.7)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '24px',
                padding: '36px',
                boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
                marginBottom: '48px'
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '36px', alignItems: 'center' }} className="grid-responsive">
                {/* Left Side: Interactive Palette */}
                <div>
                  <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'white', margin: '0 0 16px 0' }}>
                    Uji Coba Visual Drag-and-Drop Canvas Interaktif
                  </h3>
                  <p style={{ color: '#94a3b8', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '24px' }}>
                    Klik widget di bawah untuk mensimulasikan penambahan elemen secara instan ke layar preview terminal stasiun di sebelah kanan.
                  </p>

                  {/* Interactive Palette */}
                  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', padding: '18px', marginBottom: '24px' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#e2e8f0', display: 'block', marginBottom: '10px', textTransform: 'uppercase' }}>
                      Tambah Widget ke Layar Simulasi:
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
                      onClick={() => navigate('/login')}
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
                      Open Full App Builder Studio <Play size={15} fill="white" />
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
            </section>

          </div>
        )}

        {/* ========================================================================= */}
        {/* 4. TAB: PRICING & VALUE */}

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
          <button onClick={() => switchTab('store')} style={{ background: 'none', border: 'none', color: '#38bdf8', cursor: 'pointer', fontSize: '0.82rem', padding: 0 }}>Mavi Store</button>
          <span style={{ color: 'rgba(255,255,255,0.1)' }}>|</span>
          <button onClick={() => switchTab('pricing')} style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer', fontSize: '0.82rem', padding: 0 }}>Transparent Pricing</button>
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

      {/* MODAL: GOOGLE PLAY STORE STYLE APP DETAILS */}
      {selectedTemplateModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(10px)',
          zIndex: 1100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          overflowY: 'auto'
        }}>
          <div style={{
            background: '#0b1120',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            borderRadius: '24px',
            width: '100%',
            maxWidth: '720px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '32px',
            boxShadow: '0 25px 60px rgba(0,0,0,0.8)',
            position: 'relative',
            color: '#cbd5e1'
          }}>
            {/* Close Button */}
            <button
              onClick={() => setSelectedTemplateModal(null)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#cbd5e1',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'; e.currentTarget.style.color = 'white'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'; e.currentTarget.style.color = '#cbd5e1'; }}
            >
              <X size={18} />
            </button>

            {/* APP HEADER SECTION */}
            <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', marginBottom: '24px', paddingRight: '40px' }}>
              <div style={{
                width: '72px',
                height: '72px',
                borderRadius: '18px',
                background: selectedTemplateModal.iconBg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: `0 8px 24px ${selectedTemplateModal.color}50`
              }}>
                {renderTemplateIcon(selectedTemplateModal.icon, 36)}
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: 800, textTransform: 'uppercase' }}>
                    {selectedTemplateModal.category}
                  </span>
                  <span style={{ fontSize: '0.7rem', background: 'rgba(52, 211, 153, 0.15)', color: '#34d399', padding: '2px 8px', borderRadius: '100px', fontWeight: 700 }}>
                    Verified by Mavi
                  </span>
                </div>
                <h2 style={{ fontSize: '1.6rem', fontWeight: 900, color: 'white', margin: '0 0 6px 0', lineHeight: 1.25 }}>
                  {selectedTemplateModal.name}
                </h2>
                <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                  Developer: <span style={{ color: '#e2e8f0', fontWeight: 600 }}>Mavi Core Engineering</span> · {selectedTemplateModal.version}
                </div>
              </div>
            </div>

            {/* STATS STRIP (PLAY STORE STYLE: RATING, DOWNLOADS, SIZE) */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              padding: '14px 16px',
              textAlign: 'center',
              marginBottom: '24px'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', color: '#fbbf24', fontSize: '1.2rem', fontWeight: 900 }}>
                  <Star size={16} fill="#fbbf24" /> {selectedTemplateModal.rating}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{selectedTemplateModal.reviews} reviews</div>
              </div>
              <div style={{ borderLeft: '1px solid rgba(255,255,255,0.08)', borderRight: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 900, color: 'white' }}>
                  {selectedTemplateModal.installs}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Downloads</div>
              </div>
              <div>
                <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#38bdf8' }}>
                  Ready
                </div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>1-Click Install</div>
              </div>
            </div>

            {/* PRIMARY ACTION BUTTONS */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '28px' }}>
              <button
                onClick={() => {
                  handleInstallTemplate(selectedTemplateModal);
                  setSelectedTemplateModal(null);
                }}
                style={{
                  flex: 2,
                  padding: '14px 20px',
                  background: selectedTemplateModal.iconBg,
                  border: 'none',
                  color: 'white',
                  borderRadius: '12px',
                  fontSize: '0.95rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: `0 6px 20px ${selectedTemplateModal.color}40`
                }}
              >
                <Download size={18} /> Pasang ke Workspace Pabrik
              </button>
              <button
                onClick={() => {
                  setSelectedTemplateModal(null);
                  switchTab('builder');
                }}
                style={{
                  flex: 1,
                  padding: '14px 16px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: 'white',
                  borderRadius: '12px',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <Play size={16} fill="white" /> Live Demo
              </button>
            </div>

            {/* SCREENSHOTS / WORKFLOW STEP SLIDER */}
            <div style={{ marginBottom: '28px' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'white', margin: '0 0 12px 0' }}>
                Pratinjau Antarmuka & Langkah Kerja
              </h4>
              
              {/* Step selector tabs */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', overflowX: 'auto', paddingBottom: '4px' }}>
                {selectedTemplateModal.mockupSteps.map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => setStoreActiveStepIndex(idx)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      fontWeight: storeActiveStepIndex === idx ? 800 : 600,
                      background: storeActiveStepIndex === idx ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255,255,255,0.04)',
                      border: storeActiveStepIndex === idx ? '1px solid #3b82f6' : '1px solid rgba(255,255,255,0.08)',
                      color: storeActiveStepIndex === idx ? '#38bdf8' : '#94a3b8',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    Langkah {idx + 1}: {s.step}
                  </button>
                ))}
              </div>

              {/* Active Step Preview Canvas Card */}
              <div style={{
                background: '#030712',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                borderRadius: '14px',
                padding: '20px',
                position: 'relative'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#38bdf8', fontWeight: 700, fontSize: '0.88rem', marginBottom: '6px' }}>
                  <Monitor size={16} /> {selectedTemplateModal.mockupSteps[storeActiveStepIndex]?.step}
                </div>
                <p style={{ color: '#cbd5e1', fontSize: '0.86rem', margin: 0, lineHeight: '1.5' }}>
                  {selectedTemplateModal.mockupSteps[storeActiveStepIndex]?.desc}
                </p>
                <div style={{ marginTop: '14px', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px dashed rgba(255,255,255,0.1)', fontSize: '0.78rem', color: '#94a3b8' }}>
                  💡 <strong style={{ color: '#e2e8f0' }}>Logika Otomatis:</strong> Data pada langkah ini langsung tersinkronisasi ke basis data Supabase & PostgreSQL secara real-time.
                </div>
              </div>
            </div>

            {/* ABOUT THIS TEMPLATE */}
            <div style={{ marginBottom: '28px' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'white', margin: '0 0 8px 0' }}>
                Tentang Template Ini
              </h4>
              <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: '1.6', margin: '0 0 16px 0' }}>
                {selectedTemplateModal.description}
              </p>

              {/* Key Features list */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '8px' }}>
                {selectedTemplateModal.features.map((feat, fi) => (
                  <div key={fi} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.03)', padding: '8px 12px', borderRadius: '8px', fontSize: '0.82rem', color: '#e2e8f0' }}>
                    <CheckCircle2 size={15} color="#34d399" /> {feat}
                  </div>
                ))}
              </div>
            </div>

            {/* INCLUDED DATABASE TABLES */}
            <div style={{ marginBottom: '28px', background: 'rgba(15, 23, 42, 0.6)', padding: '16px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'white', margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Database size={15} color="#38bdf8" /> Tabel Database Terhubung Otomatis
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {selectedTemplateModal.tables.map((tbl, ti) => (
                  <span key={ti} style={{ background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.25)', color: '#38bdf8', padding: '4px 10px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 700, fontFamily: 'monospace' }}>
                    {tbl}
                  </span>
                ))}
              </div>
            </div>

            {/* AUTOMATED TRIGGERS */}
            <div style={{ marginBottom: '28px', background: 'rgba(15, 23, 42, 0.6)', padding: '16px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'white', margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Zap size={15} color="#f59e0b" /> Logika Trigger Otomatis Termasuk
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {selectedTemplateModal.triggers.map((trg, tri) => (
                  <div key={tri} style={{ fontSize: '0.8rem', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ color: '#f59e0b' }}>⚡</span> {trg}
                  </div>
                ))}
              </div>
            </div>

            {/* USER & ENGINEER REVIEWS */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'white', margin: 0 }}>
                  Ulasan Factory Engineer & Supervisor
                </h4>
                <span style={{ fontSize: '0.8rem', color: '#fbbf24', fontWeight: 700 }}>
                  ★ {selectedTemplateModal.rating} dari 5.0
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px 16px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <strong style={{ fontSize: '0.84rem', color: '#e2e8f0' }}>Budi Pratama — QC Supervisor</strong>
                    <span style={{ color: '#fbbf24', fontSize: '0.75rem' }}>★★★★★</span>
                  </div>
                  <p style={{ color: '#94a3b8', fontSize: '0.82rem', margin: 0 }}>
                    "Template ini langsung kami pasang di line 2 kemarin. Operator langsung terbiasa hanya dalam 1 jam tanpa pelatihan rumit."
                  </p>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px 16px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <strong style={{ fontSize: '0.84rem', color: '#e2e8f0' }}>Rian Hidayat — Manufacturing Lead</strong>
                    <span style={{ color: '#fbbf24', fontSize: '0.75rem' }}>★★★★★</span>
                  </div>
                  <p style={{ color: '#94a3b8', fontSize: '0.82rem', margin: 0 }}>
                    "Integrasi database dan trigger bawaannya sangat rapi. Menghemat waktu pengembangan berminggu-minggu."
                  </p>
                </div>
              </div>
            </div>

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

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
  Grid
} from 'lucide-react';

// Analytics chart data — replace with real-time data from Supabase when connected
const oeeData = [];

const LandingPage = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // App Builder Simulator States
  const [simulatorWidgets, setSimulatorWidgets] = useState([
    { id: 1, type: 'header', text: 'Quality Inspection Step' },
    { id: 2, type: 'text', text: 'Scan barcode of part to begin quality review.' },
    { id: 3, type: 'button', text: 'Confirm Inspection Check' }
  ]);
  const [activeWidgetIndex, setActiveWidgetIndex] = useState(0);
  const [mockAppColor, setMockAppColor] = useState('#2563eb');
  
  // Analytics Widget States
  const [activeMetric, setActiveMetric] = useState('oee'); // oee, yield, cycle
  
  // Live Connector States
  const [iotStatus, setIotStatus] = useState('Connected');
  const [machineData, setMachineData] = useState({ temp: 42, speed: 1200, pressure: 6.2 });
  const [terminalLogs, setTerminalLogs] = useState([
    'Initializing MQTT Client...',
    'Subscribing to topic: factory/line1/sensor/+',
    'Broker connected successfully.',
  ]);

  // Periodic updates for simulated machine data and terminal logs
  useEffect(() => {
    const interval = setInterval(() => {
      // update machine data
      setMachineData(prev => ({
        temp: Math.min(90, Math.max(30, Math.round(prev.temp + (Math.random() - 0.5) * 4))),
        speed: Math.min(1800, Math.max(900, Math.round(prev.speed + (Math.random() - 0.5) * 100))),
        pressure: parseFloat(Math.min(10, Math.max(2, prev.pressure + (Math.random() - 0.5) * 0.4)).toFixed(1))
      }));

      // add raw logs
      const logTemplates = [
        `[OPC-UA] Node value updated: PLC_Line1.CycleCounter = ${Math.floor(Math.random() * 1000)}`,
        `[MQTT] Payload received on factory/line1/temp: ${Math.floor(Math.random() * 40 + 30)}°C`,
        `[AppPlayer] Session started on Station-02 by Operator Jack`,
        `[EdgeDevice] GPIO Pin 4 triggered: part sensor high`,
        `[VisionService] Inspection result: APPROVED (Score: ${(95 + Math.random() * 5).toFixed(1)}%)`
      ];
      const randomLog = logTemplates[Math.floor(Math.random() * logTemplates.length)];
      setTerminalLogs(prev => [randomLog, ...prev.slice(0, 7)]);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const addWidgetToSimulator = (type) => {
    let text = '';
    if (type === 'button') text = 'New Action Button';
    if (type === 'input') text = 'Text Input Field';
    if (type === 'gauge') text = '98% OEE Meter';
    if (type === 'chart') text = 'OEE Live Trend Chart';
    
    setSimulatorWidgets(prev => [
      ...prev,
      { id: Date.now(), type, text }
    ]);
  };

  const removeWidget = (id) => {
    setSimulatorWidgets(prev => prev.filter(w => w.id !== id));
  };

  const getMetricColor = () => {
    if (activeMetric === 'oee') return '#3b82f6';
    if (activeMetric === 'yield') return '#10b981';
    return '#f59e0b';
  };

  return (
    <div style={{
      backgroundColor: '#0b0f19',
      color: '#cbd5e1',
      minHeight: '100%',
      fontFamily: "'Inter', sans-serif",
      overflowX: 'hidden',
      position: 'relative'
    }}>
      {/* Background Mesh Gradients */}
      <div style={{
        position: 'absolute',
        top: '-10%',
        left: '-10%',
        width: '60%',
        height: '60%',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(37, 99, 235, 0.15) 0%, rgba(0, 0, 0, 0) 70%)',
        filter: 'blur(80px)',
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

      {/* NAVBAR */}
      <nav style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'rgba(11, 15, 25, 0.85)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 40px',
        maxWidth: '1400px',
        margin: '0 auto',
        boxSizing: 'border-box',
        width: '100%'
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
            padding: '8px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
            display: 'flex',
            alignItems: 'center'
          }}>
            <Settings size={22} color="white" />
          </div>
          <span style={{
            fontSize: '1.4rem',
            fontWeight: 900,
            color: 'white',
            letterSpacing: '1px',
            background: 'linear-gradient(to right, #ffffff, #94a3b8)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            MAVI-MES
          </span>
        </div>

        {/* Desktop Navigation Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }} className="desktop-only">
          <a href="#builder" style={{ color: '#94a3b8', textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem', transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color = 'white'} onMouseLeave={e => e.target.style.color = '#94a3b8'}>App Builder</a>
          <a href="#analytics" style={{ color: '#94a3b8', textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem', transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color = 'white'} onMouseLeave={e => e.target.style.color = '#94a3b8'}>Analytics</a>
          <a href="#iot" style={{ color: '#94a3b8', textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem', transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color = 'white'} onMouseLeave={e => e.target.style.color = '#94a3b8'}>IoT & Machines</a>
          <a href="#capabilities" style={{ color: '#94a3b8', textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem', transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color = 'white'} onMouseLeave={e => e.target.style.color = '#94a3b8'}>Features</a>
        </div>

        {/* Desktop Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }} className="desktop-only">
          <button
            onClick={() => navigate('/login')}
            style={{
              background: 'transparent',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: 'white',
              padding: '10px 20px',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => { e.target.style.background = 'rgba(255, 255, 255, 0.05)'; e.target.style.borderColor = 'white'; }}
            onMouseLeave={e => { e.target.style.background = 'transparent'; e.target.style.borderColor = 'rgba(255, 255, 255, 0.15)'; }}
          >
            Sign In
          </button>
          <button
            onClick={() => navigate('/login')}
            style={{
              background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              border: 'none',
              color: 'white',
              padding: '10px 22px',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
            onMouseEnter={e => { e.target.style.transform = 'translateY(-1px)'; e.target.style.boxShadow = '0 6px 18px rgba(37, 99, 235, 0.5)'; }}
            onMouseLeave={e => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 4px 14px rgba(37, 99, 235, 0.4)'; }}
          >
            Launch Platform <ArrowRight size={15} />
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
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {/* MOBILE MENU DROPDOWN */}
      {mobileMenuOpen && (
        <div style={{
          position: 'fixed',
          top: '68px',
          left: 0,
          right: 0,
          backgroundColor: '#0b0f19',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '24px 30px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          zIndex: 99,
          boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
        }}>
          <a href="#builder" onClick={() => setMobileMenuOpen(false)} style={{ color: '#cbd5e1', textDecoration: 'none', fontSize: '1rem', fontWeight: 600 }}>App Builder</a>
          <a href="#analytics" onClick={() => setMobileMenuOpen(false)} style={{ color: '#cbd5e1', textDecoration: 'none', fontSize: '1rem', fontWeight: 600 }}>Analytics</a>
          <a href="#iot" onClick={() => setMobileMenuOpen(false)} style={{ color: '#cbd5e1', textDecoration: 'none', fontSize: '1rem', fontWeight: 600 }}>IoT & Machines</a>
          <a href="#capabilities" onClick={() => setMobileMenuOpen(false)} style={{ color: '#cbd5e1', textDecoration: 'none', fontSize: '1rem', fontWeight: 600 }}>Features</a>
          <div style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.08)' }}></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button onClick={() => navigate('/login')} style={{ width: '100%', padding: '12px', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'white', borderRadius: '8px', fontWeight: 700 }}>Sign In</button>
            <button onClick={() => navigate('/login')} style={{ width: '100%', padding: '12px', background: '#2563eb', border: 'none', color: 'white', borderRadius: '8px', fontWeight: 700, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>Launch Platform <ArrowRight size={16} /></button>
          </div>
        </div>
      )}

      {/* HERO SECTION */}
      <section style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '100px 40px 80px 40px',
        position: 'relative',
        zIndex: 1,
        textAlign: 'center',
        boxSizing: 'border-box'
      }}>
        {/* Announcement Badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(59, 130, 246, 0.08)',
          border: '1px solid rgba(59, 130, 246, 0.2)',
          padding: '6px 16px',
          borderRadius: '30px',
          color: '#60a5fa',
          fontSize: '0.8rem',
          fontWeight: 700,
          marginBottom: '28px',
          boxShadow: '0 0 15px rgba(59, 130, 246, 0.1)',
          animation: 'fadeIn 0.6s ease'
        }}>
          <Sparkles size={14} /> The Next-Generation Manufacturing Operations Platform
        </div>

        <h1 style={{
          fontSize: '3.6rem',
          lineHeight: 1.15,
          fontWeight: 900,
          color: 'white',
          maxWidth: '850px',
          margin: '0 auto 24px auto',
          letterSpacing: '-1px'
        }}>
          Build No-Code Factory Apps. <br />
          <span style={{
            background: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 50%, #1d4ed8 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Optimize Frontline Operations.
          </span>
        </h1>

        <p style={{
          fontSize: '1.25rem',
          lineHeight: '1.6',
          color: '#94a3b8',
          maxWidth: '650px',
          margin: '0 auto 40px auto',
          fontWeight: 500
        }}>
          Like Tulip, MAVI-MES lets manufacturing engineers build interactive operator guide apps, connect shop floor devices, automate quality logic, and visualize real-time OEE metrics—without writing code.
        </p>

        {/* Hero Actions */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '16px',
          flexWrap: 'wrap',
          marginBottom: '60px'
        }}>
          <button
            onClick={() => navigate('/login')}
            style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              border: 'none',
              color: 'white',
              padding: '16px 36px',
              borderRadius: '10px',
              fontWeight: 800,
              fontSize: '1rem',
              cursor: 'pointer',
              boxShadow: '0 8px 24px rgba(37, 99, 235, 0.4)',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            onMouseEnter={e => { e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 12px 28px rgba(37, 99, 235, 0.5)'; }}
            onMouseLeave={e => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 8px 24px rgba(37, 99, 235, 0.4)'; }}
          >
            Launch Platform Workspace <ArrowRight size={18} />
          </button>
          
          <a
            href="#builder"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: 'white',
              padding: '16px 36px',
              borderRadius: '10px',
              fontWeight: 800,
              fontSize: '1rem',
              cursor: 'pointer',
              textDecoration: 'none',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            onMouseEnter={e => { e.target.style.background = 'rgba(255, 255, 255, 0.08)'; e.target.style.borderColor = 'rgba(255,255,255,0.2)'; }}
            onMouseLeave={e => { e.target.style.background = 'rgba(255, 255, 255, 0.05)'; e.target.style.borderColor = 'rgba(255,255,255,0.1)'; }}
          >
            Try Interactive Simulators
          </a>
        </div>

        {/* Demo Credentials Info */}
        <div style={{
          maxWidth: '500px',
          margin: '0 auto',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: '12px',
          padding: '16px 24px',
          fontSize: '0.85rem',
          color: '#94a3b8',
          display: 'flex',
          justifyContent: 'center',
          gap: '24px',
          alignItems: 'center',
          backdropFilter: 'blur(5px)'
        }}>
          <div><strong>Engineer Mode:</strong> <span style={{ color: 'white', fontFamily: 'monospace' }}>engineer / 123</span></div>
          <div style={{ width: '1px', height: '16px', backgroundColor: 'rgba(255,255,255,0.15)' }}></div>
          <div><strong>Operator Terminal:</strong> <span style={{ color: 'white', fontFamily: 'monospace' }}>operator / 123</span></div>
        </div>
      </section>

      {/* PLATFORM DEMO SIMULATORS (THE MAIN VALUE PROPOSITION) */}
      <section style={{
        maxWidth: '1200px',
        margin: '0 auto 100px auto',
        padding: '0 40px',
        boxSizing: 'border-box'
      }}>
        
        {/* SIMULATOR 1: NO-CODE APP BUILDER */}
        <div id="builder" style={{
          background: 'rgba(15, 23, 42, 0.6)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '24px',
          padding: '40px',
          marginBottom: '60px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
          position: 'relative'
        }}>
          <div style={{
            position: 'absolute',
            top: '-20px',
            left: '40px',
            backgroundColor: '#3b82f6',
            color: 'white',
            padding: '6px 16px',
            borderRadius: '20px',
            fontSize: '0.75rem',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}>
            Interactive Simulator
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', alignItems: 'center' }} className="grid-responsive">
            {/* Left side info */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#60a5fa', fontWeight: 700, fontSize: '0.9rem', textTransform: 'uppercase', marginBottom: '12px' }}>
                <Layout size={16} /> 01. App Builder
              </div>
              <h2 style={{ fontSize: '2.2rem', fontWeight: 900, color: 'white', margin: '0 0 16px 0', lineHeight: '1.2' }}>
                No-Code Frontline App Builder
              </h2>
              <p style={{ color: '#94a3b8', fontSize: '1.05rem', lineHeight: '1.6', marginBottom: '24px' }}>
                Create interactive step-by-step applications to guide floor operators. Connect buttons to variables, display live charts, enforce validation, and build clean interfaces for desktop, tablet, or handheld devices.
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <div style={{ color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px', backgroundColor: 'rgba(16, 185, 129, 0.1)', borderRadius: '50%' }}><CheckCircle2 size={16} /></div>
                  <div style={{ fontSize: '0.95rem' }}><strong style={{ color: 'white' }}>Drag & Drop Components:</strong> Easily add forms, action buttons, live IoT stats, gauges, and tables to pages.</div>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <div style={{ color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px', backgroundColor: 'rgba(16, 185, 129, 0.1)', borderRadius: '50%' }}><CheckCircle2 size={16} /></div>
                  <div style={{ fontSize: '0.95rem' }}><strong style={{ color: 'white' }}>PWA Ready:</strong> Designed to run flawlessly on mobile terminals, tablets, and ruggedized shop-floor hardware.</div>
                </div>
              </div>

              {/* Interaction Controls */}
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '24px' }}>
                <h4 style={{ color: 'white', margin: '0 0 12px 0', fontSize: '0.95rem', fontWeight: 700 }}>Simulator Actions: Build your App</h4>
                
                {/* Palette */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8' }}>App Theme Color:</span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {['#2563eb', '#10b981', '#ef4444', '#714b67'].map(color => (
                      <button
                        key={color}
                        onClick={() => setMockAppColor(color)}
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          backgroundColor: color,
                          border: mockAppColor === color ? '2px solid white' : 'none',
                          cursor: 'pointer',
                          boxShadow: '0 2px 5px rgba(0,0,0,0.3)',
                          transform: mockAppColor === color ? 'scale(1.1)' : 'scale(1)',
                          transition: 'transform 0.1s'
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Add items */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  <button onClick={() => addWidgetToSimulator('button')} style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', color: '#60a5fa', padding: '8px 12px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>+ Add Action Button</button>
                  <button onClick={() => addWidgetToSimulator('input')} style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', color: '#60a5fa', padding: '8px 12px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>+ Add Input Form</button>
                  <button onClick={() => addWidgetToSimulator('gauge')} style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', color: '#10b981', padding: '8px 12px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>+ Add IoT Gauge</button>
                  <button onClick={() => addWidgetToSimulator('chart')} style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', color: '#f59e0b', padding: '8px 12px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>+ Add Trend Chart</button>
                </div>
              </div>
            </div>

            {/* Right side interactive mockup */}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div style={{
                width: '320px',
                height: '560px',
                backgroundColor: '#111827',
                border: '12px solid #374151',
                borderRadius: '36px',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.8), 0 0 40px rgba(59, 130, 246, 0.15)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                position: 'relative'
              }}>
                {/* Speaker/Camera notch */}
                <div style={{ height: '24px', backgroundColor: '#374151', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
                  <div style={{ width: '60px', height: '6px', backgroundColor: '#111827', borderRadius: '10px' }} />
                </div>

                {/* Simulated Screen */}
                <div style={{ flex: 1, backgroundColor: '#f1f5f9', display: 'flex', flexDirection: 'column', padding: '16px', color: '#1e293b', overflowY: 'auto' }}>
                  
                  {/* Top Bar of active App */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #cbd5e1', paddingBottom: '8px', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }} />
                      <span style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', color: '#64748b' }}>Device: Phone-03</span>
                    </div>
                    <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8' }}>v1.4.2</span>
                  </div>

                  {/* Simulator Screen Widgets */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                    {simulatorWidgets.map((w, index) => (
                      <div
                        key={w.id}
                        onClick={() => setActiveWidgetIndex(index)}
                        style={{
                          backgroundColor: 'white',
                          border: activeWidgetIndex === index ? `2px solid ${mockAppColor}` : '1px solid #e2e8f0',
                          borderRadius: '8px',
                          padding: '12px',
                          cursor: 'pointer',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                          position: 'relative',
                          transition: 'all 0.15s'
                        }}
                      >
                        {/* Remove Action */}
                        <button
                          onClick={(e) => { e.stopPropagation(); removeWidget(w.id); }}
                          style={{ position: 'absolute', top: '4px', right: '4px', background: 'transparent', border: 'none', color: '#cbd5e1', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '2px' }}
                          onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                          onMouseLeave={e => e.currentTarget.style.color = '#cbd5e1'}
                        >
                          <X size={12} />
                        </button>

                        {/* Rendering Widget Type */}
                        {w.type === 'header' && (
                          <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#0f172a', paddingRight: '12px' }}>
                            {w.text}
                          </div>
                        )}

                        {w.type === 'text' && (
                          <div style={{ fontSize: '0.75rem', color: '#64748b', lineHeight: '1.4', paddingRight: '12px' }}>
                            {w.text}
                          </div>
                        )}

                        {w.type === 'button' && (
                          <button style={{ width: '100%', padding: '8px', backgroundColor: mockAppColor, color: 'white', border: 'none', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                            <Play size={12} /> {w.text}
                          </button>
                        )}

                        {w.type === 'input' && (
                          <div>
                            <span style={{ display: 'block', fontSize: '0.65rem', fontWeight: 800, color: '#64748b', marginBottom: '4px' }}>Value Input</span>
                            <input type="text" placeholder="Scan or enter here..." disabled style={{ width: '100%', padding: '6px', fontSize: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '4px', boxSizing: 'border-box' }} />
                          </div>
                        )}

                        {w.type === 'gauge' && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ position: 'relative', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <div style={{ position: 'absolute', width: '100%', height: '100%', border: '4px solid #e2e8f0', borderRadius: '50%', boxSizing: 'border-box' }} />
                              <div style={{ position: 'absolute', width: '100%', height: '100%', border: '4px solid #10b981', borderBottomColor: 'transparent', borderRadius: '50%', boxSizing: 'border-box' }} />
                              <span style={{ fontSize: '0.6rem', fontWeight: 800 }}>98%</span>
                            </div>
                            <div>
                              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#334155' }}>IoT Integration Ready</div>
                              <div style={{ fontSize: '0.6rem', color: '#64748b' }}>OEE target: 95%</div>
                            </div>
                          </div>
                        )}

                        {w.type === 'chart' && (
                          <div>
                            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>Hourly Trend</div>
                            <div style={{ height: '35px', backgroundColor: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', color: '#94a3b8' }}>
                              [Live Chart Output]
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Simulator Screen Bottom Navigation */}
                  <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
                    <button style={{ flex: 1, padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700, background: 'white', color: '#475569' }}>Back</button>
                    <button style={{ flex: 1, padding: '8px', border: 'none', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700, background: mockAppColor, color: 'white' }}>Next Step</button>
                  </div>
                </div>

                {/* Home Indicator */}
                <div style={{ height: '18px', backgroundColor: '#374151', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <div style={{ width: '40px', height: '4px', backgroundColor: '#111827', borderRadius: '10px' }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SIMULATOR 2: REAL-TIME ANALYTICS */}
        <div id="analytics" style={{
          background: 'rgba(15, 23, 42, 0.6)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '24px',
          padding: '40px',
          marginBottom: '60px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
          position: 'relative'
        }}>
          <div style={{
            position: 'absolute',
            top: '-20px',
            left: '40px',
            backgroundColor: '#10b981',
            color: 'white',
            padding: '6px 16px',
            borderRadius: '20px',
            fontSize: '0.75rem',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}>
            Interactive Simulator
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', alignItems: 'center' }} className="grid-responsive-reverse">
            {/* Left side chart output */}
            <div style={{ background: 'rgba(11, 15, 25, 0.8)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '24px', boxShadow: 'inset 0 0 20px rgba(0,0,0,0.6)' }}>
              
              {/* Header inside Chart Widget */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <h4 style={{ color: 'white', margin: 0, fontSize: '1rem', fontWeight: 800 }}>Shop Floor Analytics</h4>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Live Line 01 performance data</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {['oee', 'yield', 'cycle'].map(metric => (
                    <button
                      key={metric}
                      onClick={() => setActiveMetric(metric)}
                      style={{
                        padding: '6px 12px',
                        background: activeMetric === metric ? 'rgba(59,130,246,0.15)' : 'transparent',
                        border: activeMetric === metric ? '1px solid #3b82f6' : '1px solid rgba(255,255,255,0.1)',
                        color: activeMetric === metric ? '#60a5fa' : '#94a3b8',
                        borderRadius: '6px',
                        fontSize: '0.7rem',
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

              {/* Chart Render - Lightweight SVG Area Chart */}
              <div style={{ height: '220px', width: '100%', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="100%" height="100%" viewBox="0 0 500 200" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
                  <defs>
                    <linearGradient id="landingChartGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={getMetricColor()} stopOpacity={0.35}/>
                      <stop offset="100%" stopColor={getMetricColor()} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  {/* Grid lines */}
                  <line x1="0" y1="40" x2="500" y2="40" stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />
                  <line x1="0" y1="90" x2="500" y2="90" stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />
                  <line x1="0" y1="140" x2="500" y2="140" stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />
                  {/* Area fill */}
                  <path
                    d="M 0 160 Q 70 110 140 130 T 280 70 T 420 85 T 500 45 L 500 200 L 0 200 Z"
                    fill="url(#landingChartGrad)"
                  />
                  {/* Smooth curve line */}
                  <path
                    d="M 0 160 Q 70 110 140 130 T 280 70 T 420 85 T 500 45"
                    fill="none"
                    stroke={getMetricColor()}
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  {/* Animated data points */}
                  <circle cx="280" cy="70" r="5" fill={getMetricColor()} stroke="#0f172a" strokeWidth="2" />
                  <circle cx="500" cy="45" r="5" fill={getMetricColor()} stroke="#0f172a" strokeWidth="2" />
                </svg>
                <div style={{ position: 'absolute', top: '15px', right: '20px', backgroundColor: 'rgba(15,23,42,0.85)', padding: '6px 12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', fontSize: '0.75rem', fontWeight: 600, color: '#e2e8f0', backdropFilter: 'blur(8px)' }}>
                  Live Signal: <span style={{ color: getMetricColor(), fontWeight: 800 }}>88.4%</span>
                </div>
              </div>

              {/* Performance Indicator bar */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '16px', marginTop: '16px' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>OEE Target</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 900, color: 'white' }}>85.0%</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>Average Yield</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#10b981' }}>94.2%</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>Cycle Target</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#f59e0b' }}>40s</div>
                </div>
              </div>
            </div>

            {/* Right side info */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', fontWeight: 700, fontSize: '0.9rem', textTransform: 'uppercase', marginBottom: '12px' }}>
                <BarChart3 size={16} /> 02. Analytics
              </div>
              <h2 style={{ fontSize: '2.2rem', fontWeight: 900, color: 'white', margin: '0 0 16px 0', lineHeight: '1.2' }}>
                Real-Time Operations Analytics
              </h2>
              <p style={{ color: '#94a3b8', fontSize: '1.05rem', lineHeight: '1.6', marginBottom: '24px' }}>
                Automatically aggregate floor activity into interactive visualizations. Log production output, monitor machine uptimes, track product defect rates, and calculate overall equipment effectiveness (OEE) instantly.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <div style={{ color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px', backgroundColor: 'rgba(16, 185, 129, 0.1)', borderRadius: '50%' }}><CheckCircle2 size={16} /></div>
                  <div style={{ fontSize: '0.95rem' }}><strong style={{ color: 'white' }}>Live Dashboards:</strong> Display dashboards on terminal screens, wallboards, and laptops across the facility.</div>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <div style={{ color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px', backgroundColor: 'rgba(16, 185, 129, 0.1)', borderRadius: '50%' }}><CheckCircle2 size={16} /></div>
                  <div style={{ fontSize: '0.95rem' }}><strong style={{ color: 'white' }}>Automatic Auditing:</strong> Log defect counts, step timings, operator sign-offs, and store histories directly in built-in tables.</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SIMULATOR 3: IOT & CONNECTORS */}
        <div id="iot" style={{
          background: 'rgba(15, 23, 42, 0.6)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '24px',
          padding: '40px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
          position: 'relative'
        }}>
          <div style={{
            position: 'absolute',
            top: '-20px',
            left: '40px',
            backgroundColor: '#f59e0b',
            color: 'white',
            padding: '6px 16px',
            borderRadius: '20px',
            fontSize: '0.75rem',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}>
            Interactive Simulator
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', alignItems: 'center' }} className="grid-responsive">
            {/* Left side info */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f59e0b', fontWeight: 700, fontSize: '0.9rem', textTransform: 'uppercase', marginBottom: '12px' }}>
                <Cpu size={16} /> 03. Connectors & IoT
              </div>
              <h2 style={{ fontSize: '2.2rem', fontWeight: 900, color: 'white', margin: '0 0 16px 0', lineHeight: '1.2' }}>
                Plug-and-Play IoT & Connectors
              </h2>
              <p style={{ color: '#94a3b8', fontSize: '1.05rem', lineHeight: '1.6', marginBottom: '24px' }}>
                Integrate directly with machines, APIs, databases, and third-party industrial platforms. Read and write data using MQTT brokers, OPC UA servers, Node-RED scripts, or raw HTTP/SQL queries.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <div style={{ color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px', backgroundColor: 'rgba(16, 185, 129, 0.1)', borderRadius: '50%' }}><CheckCircle2 size={16} /></div>
                  <div style={{ fontSize: '0.95rem' }}><strong style={{ color: 'white' }}>Machine Triggers:</strong> Kick off operations apps, fire andons, and log sensor changes automatically.</div>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <div style={{ color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px', backgroundColor: 'rgba(16, 185, 129, 0.1)', borderRadius: '50%' }}><CheckCircle2 size={16} /></div>
                  <div style={{ fontSize: '0.95rem' }}><strong style={{ color: 'white' }}>Unified Connectors:</strong> Talk to SQL databases, RESTful APIs, and ERP systems without leaving the platform.</div>
                </div>
              </div>
            </div>

            {/* Right side live IoT console */}
            <div style={{
              backgroundColor: '#0a0d16',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              padding: '24px',
              color: '#34d399',
              fontFamily: 'monospace',
              fontSize: '0.8rem',
              boxShadow: '0 15px 30px rgba(0,0,0,0.5)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}>
              {/* Header controls */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Terminal size={14} color="#34d399" />
                  <span style={{ fontWeight: 'bold', color: 'white' }}>connector-host.log</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: iotStatus === 'Connected' ? '#10b981' : '#dc2626', animation: iotStatus === 'Connected' ? 'pulse 2s infinite' : 'none' }} />
                  <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>MQTT Status: {iotStatus}</span>
                </div>
              </div>

              {/* Machine Metrics Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
                <div>
                  <div style={{ fontSize: '0.6rem', color: '#64748b' }}>TEMP</div>
                  <div style={{ fontSize: '1rem', fontWeight: 'bold', color: 'white' }}>{machineData.temp}°C</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.6rem', color: '#64748b' }}>SPINDLE SPEED</div>
                  <div style={{ fontSize: '1rem', fontWeight: 'bold', color: 'white' }}>{machineData.speed} RPM</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.6rem', color: '#64748b' }}>PRESSURE</div>
                  <div style={{ fontSize: '1rem', fontWeight: 'bold', color: 'white' }}>{machineData.pressure} BAR</div>
                </div>
              </div>

              {/* Live terminal streams */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', height: '140px', overflowY: 'hidden', padding: '8px', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.04)' }}>
                {terminalLogs.map((log, idx) => (
                  <div key={idx} style={{ opacity: 1 - idx * 0.12, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                    &gt; {log}
                  </div>
                ))}
              </div>

              {/* Simulator Action button */}
              <button
                onClick={() => {
                  setIotStatus(prev => prev === 'Connected' ? 'Disconnected' : 'Connected');
                  const act = iotStatus === 'Connected' ? 'Disconnected from broker.' : 'Reconnecting to broker...';
                  setTerminalLogs(prev => [act, ...prev]);
                }}
                style={{
                  background: iotStatus === 'Connected' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                  border: iotStatus === 'Connected' ? '1px solid #ef4444' : '1px solid #10b981',
                  color: iotStatus === 'Connected' ? '#f87171' : '#34d399',
                  padding: '8px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '0.75rem',
                  transition: 'all 0.2s',
                  fontFamily: 'monospace'
                }}
              >
                {iotStatus === 'Connected' ? 'TEST DISCONNECT' : 'TEST RECONNECT'}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CORE FEATURES LIST (TULIP PLATFORM EQUIVALENT FEATURES) */}
      <section id="capabilities" style={{
        maxWidth: '1200px',
        margin: '0 auto 80px auto',
        padding: '0 40px',
        boxSizing: 'border-box'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 900, color: 'white', margin: '0 0 16px 0' }}>
            Built for Modern Operations
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
            MAVI-MES combines all the aspects of Tulip's frontline execution platform into one consolidated local ecosystem.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '30px' }}>
          {/* Feature 1 */}
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '30px', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.borderColor = '#3b82f6'} onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
              <Layout size={24} />
            </div>
            <h3 style={{ color: 'white', margin: '0 0 10px 0', fontSize: '1.25rem', fontWeight: 800 }}>Frontline Apps</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: '1.6', margin: 0 }}>
              Build steps, forms, and custom operator terminals. Standardize high-mix assemblies and eliminate paper.
            </p>
          </div>

          {/* Feature 2 */}
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '30px', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.borderColor = '#10b981'} onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
              <Database size={24} />
            </div>
            <h3 style={{ color: 'white', margin: '0 0 10px 0', fontSize: '1.25rem', fontWeight: 800 }}>Relational Tables</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: '1.6', margin: 0 }}>
              Manage bills of materials, inventory quantities, and test logs directly in a user-friendly database.
            </p>
          </div>

          {/* Feature 3 */}
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '30px', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.borderColor = '#f59e0b'} onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
              <Link2 size={24} />
            </div>
            <h3 style={{ color: 'white', margin: '0 0 10px 0', fontSize: '1.25rem', fontWeight: 800 }}>Unified Connectors</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: '1.6', margin: 0 }}>
              Query external systems, REST endpoints, and SQL servers directly from inside application steps.
            </p>
          </div>

          {/* Feature 4 */}
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '30px', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.borderColor = '#6366f1'} onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: 'rgba(99, 102, 241, 0.1)', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
              <Cpu size={24} />
            </div>
            <h3 style={{ color: 'white', margin: '0 0 10px 0', fontSize: '1.25rem', fontWeight: 800 }}>IoT Node Automations</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: '1.6', margin: 0 }}>
              Automate logic flows using Blockly, Node-RED, or background scripts responding to edge signals.
            </p>
          </div>

          {/* Feature 5 */}
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '30px', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.borderColor = '#ec4899'} onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: 'rgba(236, 72, 153, 0.1)', color: '#ec4899', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
              <Eye size={24} />
            </div>
            <h3 style={{ color: 'white', margin: '0 0 10px 0', fontSize: '1.25rem', fontWeight: 800 }}>Vision Inspections</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: '1.6', margin: 0 }}>
              Use camera feeds, QR/barcode scans, OCR, and custom AI templates for inline quality checks.
            </p>
          </div>

          {/* Feature 6 */}
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '30px', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.borderColor = '#14b8a6'} onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: 'rgba(20, 184, 166, 0.1)', color: '#14b8a6', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
              <Users size={24} />
            </div>
            <h3 style={{ color: 'white', margin: '0 0 10px 0', fontSize: '1.25rem', fontWeight: 800 }}>Role-Based Access</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: '1.6', margin: 0 }}>
              Strict permissions for Administrators, Manufacturing Engineers, and Shop Floor Operators.
            </p>
          </div>
        </div>
      </section>

      {/* FINAL CALL TO ACTION */}
      <section style={{
        maxWidth: '1000px',
        margin: '0 auto 100px auto',
        padding: '0 40px',
        boxSizing: 'border-box'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.1) 0%, rgba(30, 41, 59, 0.4) 100%)',
          border: '1px solid rgba(59, 130, 246, 0.2)',
          borderRadius: '24px',
          padding: '60px 40px',
          textAlign: 'center',
          boxShadow: '0 15px 35px rgba(37, 99, 235, 0.05)',
          backdropFilter: 'blur(10px)'
        }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 900, color: 'white', margin: '0 0 16px 0' }}>
            Ready to Optimize Your Shop Floor?
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto 40px auto', lineHeight: '1.6' }}>
            Experience the complete no-code manufacturing ecosystem today. Sign in with your account to access either the Operator Terminal or the Engineer Workspace.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate('/login')}
              style={{
                background: '#2563eb',
                border: 'none',
                color: 'white',
                padding: '16px 36px',
                borderRadius: '10px',
                fontWeight: 800,
                fontSize: '1rem',
                cursor: 'pointer',
                boxShadow: '0 8px 20px rgba(37, 99, 235, 0.3)',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseEnter={e => { e.target.style.background = '#1d4ed8'; e.target.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.target.style.background = '#2563eb'; e.target.style.transform = 'translateY(0)'; }}
            >
              Sign In to workspace <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{
        borderTop: '1px solid rgba(255, 255, 255, 0.06)',
        padding: '40px 40px',
        textAlign: 'center',
        color: '#64748b',
        fontSize: '0.85rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginBottom: '16px' }}>
          <span style={{ fontWeight: 'bold', color: '#cbd5e1' }}>MAVI-MES Core Platform</span>
          <span style={{ color: 'rgba(255,255,255,0.1)' }}>|</span>
          <span>Version 3.4.0 (Latest)</span>
          <span style={{ color: 'rgba(255,255,255,0.1)' }}>|</span>
          <span>Authentication Ready</span>
        </div>
        <p style={{ margin: 0 }}>
          &copy; {new Date().getFullYear()} zainalkhmi/mavi-mes. Inspired by Tulip Frontline Operations. All rights reserved.
        </p>
      </footer>

      {/* Embedded Responsive styling helper classes */}
      <style>{`
        @media (max-width: 900px) {
          .grid-responsive {
            grid-template-columns: 1fr !important;
            gap: 30px !important;
          }
          .grid-responsive-reverse {
            grid-template-columns: 1fr !important;
            gap: 30px !important;
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
            font-size: 2.6rem !important;
          }
          section {
            padding: 60px 20px 40px 20px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default LandingPage;

import {
  Layout,
  Play,
  Settings,
  Zap,
  ClipboardList,
  Home as HomeIcon,
  Cpu,
  ChevronDown,
  Database,
  Link2,
  Variable,
  BarChart3,
  Monitor,
  MapPin,
  Tv,
  Activity,
  Box,
  Eye,
  BrainCircuit,
  SlidersHorizontal,
  Users
} from 'lucide-react';
import TableManager from './components/TableManager';
import ConnectorManager from './components/ConnectorManager';
import UserManager from './components/UserManager';
import { useState, useRef, useEffect } from 'react';
import { Link, Route, Routes, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { getCurrentUser, logout } from './utils/auth';
import Login from './components/Login';
import Home from './components/Home';
import AppBuilder from './components/AppBuilder';
import AppPlayer from './components/AppPlayer';
import AutomationEditor from './components/AutomationEditor';
import WorkOrderDashboard from './components/WorkOrderDashboard';
import FunctionsEditor from './components/FunctionsEditor';
import LiveTerminal from './components/LiveTerminal';
import StationManager from './components/StationManager';
import InterfaceManager from './components/InterfaceManager';
import MachineManager from './components/MachineManager';
import EdgeDeviceManager from './components/EdgeDeviceManager';
import VisionManager from './components/VisionManager';
import DataEntryFormGuide from './components/DataEntryFormGuide';
import VariableManager from './components/VariableManager';
import AnalysisManager from './components/AnalysisManager';
import AnalysisEditor from './components/AnalysisEditor';
import DashboardManager from './components/DashboardManager';
import DashboardEditor from './components/DashboardEditor';
import AiSettings from './components/AiSettings';
import SupabaseSettings from './components/SupabaseSettings';

const Placeholder = ({ title }) => (
  <div style={{ padding: '40px', textAlign: 'center' }}>
    <h2 style={{ fontSize: '2rem', fontWeight: 900, color: '#001e3c' }}>{title}</h2>
    <p style={{ color: '#64748b' }}>This workspace is currently under development.</p>
  </div>
);

const App = () => {
  const [user, setUser] = useState(() => getCurrentUser());
  const location = useLocation();
  const navigate = useNavigate();
  const isOperatorRoute = location.pathname.startsWith('/player') || location.pathname.startsWith('/terminal');
  const [appsMenuOpen, setAppsMenuOpen] = useState(false);
  const [analyticsMenuOpen, setAnalyticsMenuOpen] = useState(false);
  const [logicMenuOpen, setLogicMenuOpen] = useState(false);
  const [consoleMenuOpen, setConsoleMenuOpen] = useState(false);
  const [shopFloorMenuOpen, setShopFloorMenuOpen] = useState(false);
  const [systemMenuOpen, setSystemMenuOpen] = useState(false);
  const appsMenuRef = useRef(null);
  const analyticsMenuRef = useRef(null);
  const logicMenuRef = useRef(null);
  const consoleMenuRef = useRef(null);
  const shopFloorMenuRef = useRef(null);
  const systemMenuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (appsMenuRef.current && !appsMenuRef.current.contains(event.target)) {
        setAppsMenuOpen(false);
      }
      if (analyticsMenuRef.current && !analyticsMenuRef.current.contains(event.target)) {
        setAnalyticsMenuOpen(false);
      }
      if (logicMenuRef.current && !logicMenuRef.current.contains(event.target)) {
        setLogicMenuOpen(false);
      }
      if (consoleMenuRef.current && !consoleMenuRef.current.contains(event.target)) {
        setConsoleMenuOpen(false);
      }
      if (shopFloorMenuRef.current && !shopFloorMenuRef.current.contains(event.target)) {
        setShopFloorMenuOpen(false);
      }
      if (systemMenuRef.current && !systemMenuRef.current.contains(event.target)) {
        setSystemMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navLinkStyle = (path) => ({
    color: location.pathname === path ? '#001e3c' : 'rgba(255,255,255,0.7)',
    backgroundColor: location.pathname === path ? 'white' : 'transparent',
    textDecoration: 'none',
    fontSize: '0.75rem',
    padding: '8px 16px',
    borderRadius: '4px',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.2s',
    cursor: 'pointer',
    border: 'none'
  });

  const dropdownItemStyle = (path) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px 16px',
    textDecoration: 'none',
    color: location.pathname === path ? '#3b82f6' : '#1e293b',
    fontSize: '0.85rem',
    fontWeight: 600,
    transition: 'background-color 0.2s',
    borderLeft: location.pathname === path ? '3px solid #3b82f6' : '3px solid transparent',
    backgroundColor: location.pathname === path ? '#f0f7ff' : 'transparent'
  });

  const handleLoginSuccess = (loggedInUser) => {
    setUser(loggedInUser);
    if (loggedInUser.role === 'OPERATOR') {
      navigate('/terminal');
    } else {
      navigate('/');
    }
  };

  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  // Operator-only routing constraint
  const isOperator = user.role === 'OPERATOR';

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f1f5f9', fontFamily: "'Inter', sans-serif" }}>
      {/* Navigation Bar — hidden if Operator OR if on Operator Routes (terminal/player) */}
      {!isOperatorRoute && !isOperator && <nav style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        height: '56px',
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        zIndex: 1000
      }}>
        {/* LEFT SECTION */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          {/* LOGO */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
            <div style={{ backgroundColor: '#2563eb', padding: '6px', borderRadius: '6px', display: 'flex', alignItems: 'center' }}>
              <Settings size={18} color="white" />
            </div>
            <span style={{ fontWeight: 800, letterSpacing: '0.5px', fontSize: '1.1rem', color: '#0f172a' }}>MES CORE</span>
          </Link>

          {/* MAIN NAVIGATION */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {/* APPS */}
            <div style={{ position: 'relative' }} ref={appsMenuRef}>
              <button
                onClick={() => setAppsMenuOpen(!appsMenuOpen)}
                style={{
                  ...navLinkStyle('/builder'),
                  backgroundColor: ['/builder', '/tables', '/connectors', '/variables'].includes(location.pathname) ? '#f0f7ff' : 'transparent',
                  color: ['/builder', '/tables', '/connectors', '/variables'].includes(location.pathname) ? '#2563eb' : '#475569',
                  fontSize: '0.9rem', padding: '6px 12px', fontWeight: 600
                }}
                onMouseEnter={(e) => { if (!['/builder', '/tables', '/connectors', '/variables'].includes(location.pathname)) { e.target.style.backgroundColor = '#f8fafc'; e.target.style.color = '#0f172a'; } }}
                onMouseLeave={(e) => { if (!['/builder', '/tables', '/connectors', '/variables'].includes(location.pathname)) { e.target.style.backgroundColor = 'transparent'; e.target.style.color = '#475569'; } }}
              >
                Apps <ChevronDown size={14} style={{ transform: appsMenuOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s', marginLeft: '4px' }} />
              </button>
              {appsMenuOpen && (
                <div style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, backgroundColor: 'white', minWidth: '200px', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)', padding: '8px 0', display: 'flex', flexDirection: 'column', zIndex: 1001, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                  <Link to="/builder" onClick={() => setAppsMenuOpen(false)} style={dropdownItemStyle('/builder')} onMouseEnter={(e) => e.target.style.backgroundColor = '#f8fafc'} onMouseLeave={(e) => e.target.style.backgroundColor = location.pathname === '/builder' ? '#f0f7ff' : 'transparent'}><Layout size={16} /> App Builder</Link>
                  <Link to="/tables" onClick={() => setAppsMenuOpen(false)} style={dropdownItemStyle('/tables')} onMouseEnter={(e) => e.target.style.backgroundColor = '#f8fafc'} onMouseLeave={(e) => e.target.style.backgroundColor = location.pathname === '/tables' ? '#f0f7ff' : 'transparent'}><Database size={16} /> Tables</Link>
                  <Link to="/connectors" onClick={() => setAppsMenuOpen(false)} style={dropdownItemStyle('/connectors')} onMouseEnter={(e) => e.target.style.backgroundColor = '#f8fafc'} onMouseLeave={(e) => e.target.style.backgroundColor = location.pathname === '/connectors' ? '#f0f7ff' : 'transparent'}><Link2 size={16} /> Connectors</Link>
                  <Link to="/variables" onClick={() => setAppsMenuOpen(false)} style={dropdownItemStyle('/variables')} onMouseEnter={(e) => e.target.style.backgroundColor = '#f8fafc'} onMouseLeave={(e) => e.target.style.backgroundColor = location.pathname === '/variables' ? '#f0f7ff' : 'transparent'}><Variable size={16} /> Variables</Link>
                </div>
              )}
            </div>

            {/* SHOP FLOOR */}
            <div style={{ position: 'relative' }} ref={shopFloorMenuRef}>
              <button
                onClick={() => setShopFloorMenuOpen(!shopFloorMenuOpen)}
                style={{
                  ...navLinkStyle('/stations'),
                  backgroundColor: ['/stations', '/display-devices', '/machines', '/edge-devices', '/vision'].includes(location.pathname) ? '#f0f7ff' : 'transparent',
                  color: ['/stations', '/display-devices', '/machines', '/edge-devices', '/vision'].includes(location.pathname) ? '#2563eb' : '#475569',
                  fontSize: '0.9rem', padding: '6px 12px', fontWeight: 600
                }}
                onMouseEnter={(e) => { if (!['/stations', '/display-devices', '/machines', '/edge-devices', '/vision'].includes(location.pathname)) { e.target.style.backgroundColor = '#f8fafc'; e.target.style.color = '#0f172a'; } }}
                onMouseLeave={(e) => { if (!['/stations', '/display-devices', '/machines', '/edge-devices', '/vision'].includes(location.pathname)) { e.target.style.backgroundColor = 'transparent'; e.target.style.color = '#475569'; } }}
              >
                Shop Floor <ChevronDown size={14} style={{ transform: shopFloorMenuOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s', marginLeft: '4px' }} />
              </button>
              {shopFloorMenuOpen && (
                <div style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, backgroundColor: 'white', minWidth: '220px', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)', padding: '8px 0', display: 'flex', flexDirection: 'column', zIndex: 1001, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                  <Link to="/stations" onClick={() => setShopFloorMenuOpen(false)} style={dropdownItemStyle('/stations')} onMouseEnter={(e) => e.target.style.backgroundColor = '#f8fafc'} onMouseLeave={(e) => e.target.style.backgroundColor = location.pathname === '/stations' ? '#f0f7ff' : 'transparent'}><MapPin size={16} /> Stations</Link>
                  <Link to="/display-devices" onClick={() => setShopFloorMenuOpen(false)} style={dropdownItemStyle('/display-devices')} onMouseEnter={(e) => e.target.style.backgroundColor = '#f8fafc'} onMouseLeave={(e) => e.target.style.backgroundColor = location.pathname === '/display-devices' ? '#f0f7ff' : 'transparent'}><Tv size={16} /> Interfaces</Link>
                  <Link to="/machines" onClick={() => setShopFloorMenuOpen(false)} style={dropdownItemStyle('/machines')} onMouseEnter={(e) => e.target.style.backgroundColor = '#f8fafc'} onMouseLeave={(e) => e.target.style.backgroundColor = location.pathname === '/machines' ? '#f0f7ff' : 'transparent'}><Cpu size={16} /> Machines</Link>
                  <Link to="/edge-devices" onClick={() => setShopFloorMenuOpen(false)} style={dropdownItemStyle('/edge-devices')} onMouseEnter={(e) => e.target.style.backgroundColor = '#f8fafc'} onMouseLeave={(e) => e.target.style.backgroundColor = location.pathname === '/edge-devices' ? '#f0f7ff' : 'transparent'}><Activity size={16} /> Edge Devices</Link>
                </div>
              )}
            </div>

            {/* ANALYTICS */}
            <div style={{ position: 'relative' }} ref={analyticsMenuRef}>
              <button
                onClick={() => setAnalyticsMenuOpen(!analyticsMenuOpen)}
                style={{
                  ...navLinkStyle('/analytics'),
                  backgroundColor: ['/analytics', '/dashboards'].includes(location.pathname) ? '#f0f7ff' : 'transparent',
                  color: ['/analytics', '/dashboards'].includes(location.pathname) ? '#2563eb' : '#475569',
                  fontSize: '0.9rem', padding: '6px 12px', fontWeight: 600
                }}
                onMouseEnter={(e) => { if (!['/analytics', '/dashboards'].includes(location.pathname)) { e.target.style.backgroundColor = '#f8fafc'; e.target.style.color = '#0f172a'; } }}
                onMouseLeave={(e) => { if (!['/analytics', '/dashboards'].includes(location.pathname)) { e.target.style.backgroundColor = 'transparent'; e.target.style.color = '#475569'; } }}
              >
                Analytics <ChevronDown size={14} style={{ transform: analyticsMenuOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s', marginLeft: '4px' }} />
              </button>
              {analyticsMenuOpen && (
                <div style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, backgroundColor: 'white', minWidth: '200px', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)', padding: '8px 0', display: 'flex', flexDirection: 'column', zIndex: 1001, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                  <Link to="/analytics" onClick={() => setAnalyticsMenuOpen(false)} style={dropdownItemStyle('/analytics')} onMouseEnter={(e) => e.target.style.backgroundColor = '#f8fafc'} onMouseLeave={(e) => e.target.style.backgroundColor = location.pathname === '/analytics' ? '#f0f7ff' : 'transparent'}><BarChart3 size={16} /> Analysis Manager</Link>
                  <Link to="/dashboards" onClick={() => setAnalyticsMenuOpen(false)} style={dropdownItemStyle('/dashboards')} onMouseEnter={(e) => e.target.style.backgroundColor = '#f8fafc'} onMouseLeave={(e) => e.target.style.backgroundColor = location.pathname === '/dashboards' ? '#f0f7ff' : 'transparent'}><Layout size={16} /> Dashboards</Link>
                </div>
              )}
            </div>

            {/* LOGIC */}
            <div style={{ position: 'relative' }} ref={logicMenuRef}>
              <button
                onClick={() => setLogicMenuOpen(!logicMenuOpen)}
                style={{
                  ...navLinkStyle('/logic'),
                  backgroundColor: ['/automations', '/functions'].includes(location.pathname) ? '#f0f7ff' : 'transparent',
                  color: ['/automations', '/functions'].includes(location.pathname) ? '#2563eb' : '#475569',
                  fontSize: '0.9rem', padding: '6px 12px', fontWeight: 600
                }}
                onMouseEnter={(e) => { if (!['/automations', '/functions'].includes(location.pathname)) { e.target.style.backgroundColor = '#f8fafc'; e.target.style.color = '#0f172a'; } }}
                onMouseLeave={(e) => { if (!['/automations', '/functions'].includes(location.pathname)) { e.target.style.backgroundColor = 'transparent'; e.target.style.color = '#475569'; } }}
              >
                Logic <ChevronDown size={14} style={{ transform: logicMenuOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s', marginLeft: '4px' }} />
              </button>
              {logicMenuOpen && (
                <div style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, backgroundColor: 'white', minWidth: '200px', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)', padding: '8px 0', display: 'flex', flexDirection: 'column', zIndex: 1001, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                  <Link to="/automations" onClick={() => setLogicMenuOpen(false)} style={dropdownItemStyle('/automations')} onMouseEnter={(e) => e.target.style.backgroundColor = '#f8fafc'} onMouseLeave={(e) => e.target.style.backgroundColor = location.pathname === '/automations' ? '#f0f7ff' : 'transparent'}><Zap size={16} /> Automations</Link>
                  <Link to="/functions" onClick={() => setLogicMenuOpen(false)} style={dropdownItemStyle('/functions')} onMouseEnter={(e) => e.target.style.backgroundColor = '#f8fafc'} onMouseLeave={(e) => e.target.style.backgroundColor = location.pathname === '/functions' ? '#f0f7ff' : 'transparent'}><Cpu size={16} /> Functions</Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT SECTION: Console, System, User */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>

          {/* CONSOLE */}
          <div style={{ position: 'relative' }} ref={consoleMenuRef}>
            <button
              onClick={() => setConsoleMenuOpen(!consoleMenuOpen)}
              style={{
                ...navLinkStyle('/console'),
                backgroundColor: ['/terminal', '/player'].includes(location.pathname) ? '#f0f7ff' : 'transparent',
                color: ['/terminal', '/player'].includes(location.pathname) ? '#2563eb' : '#475569',
                fontSize: '0.9rem', padding: '6px 12px', fontWeight: 600
              }}
              onMouseEnter={(e) => { if (!['/terminal', '/player'].includes(location.pathname)) { e.target.style.backgroundColor = '#f8fafc'; e.target.style.color = '#0f172a'; } }}
              onMouseLeave={(e) => { if (!['/terminal', '/player'].includes(location.pathname)) { e.target.style.backgroundColor = 'transparent'; e.target.style.color = '#475569'; } }}
            >
              Console <ChevronDown size={14} style={{ transform: consoleMenuOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s', marginLeft: '4px' }} />
            </button>
            {consoleMenuOpen && (
              <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, backgroundColor: 'white', minWidth: '200px', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)', padding: '8px 0', display: 'flex', flexDirection: 'column', zIndex: 1001, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                <Link to="/player" onClick={() => setConsoleMenuOpen(false)} style={dropdownItemStyle('/player')} onMouseEnter={(e) => e.target.style.backgroundColor = '#f8fafc'} onMouseLeave={(e) => e.target.style.backgroundColor = location.pathname === '/player' ? '#f0f7ff' : 'transparent'}><Play size={16} /> App Player</Link>
                <Link to="/terminal" onClick={() => setConsoleMenuOpen(false)} style={dropdownItemStyle('/terminal')} onMouseEnter={(e) => e.target.style.backgroundColor = '#f8fafc'} onMouseLeave={(e) => e.target.style.backgroundColor = location.pathname === '/terminal' ? '#f0f7ff' : 'transparent'}><Monitor size={16} /> Live Terminal</Link>
              </div>
            )}
          </div>

          {/* SYSTEM */}
          <div style={{ position: 'relative' }} ref={systemMenuRef}>
            <button
              onClick={() => setSystemMenuOpen(!systemMenuOpen)}
              style={{
                ...navLinkStyle('/system'),
                backgroundColor: ['/users', '/ai-settings', '/supabase-settings'].includes(location.pathname) ? '#f0f7ff' : 'transparent',
                color: ['/users', '/ai-settings', '/supabase-settings'].includes(location.pathname) ? '#2563eb' : '#475569',
                fontSize: '0.9rem', padding: '6px 12px', fontWeight: 600
              }}
              onMouseEnter={(e) => { if (!['/users', '/ai-settings', '/supabase-settings'].includes(location.pathname)) { e.target.style.backgroundColor = '#f8fafc'; e.target.style.color = '#0f172a'; } }}
              onMouseLeave={(e) => { if (!['/users', '/ai-settings', '/supabase-settings'].includes(location.pathname)) { e.target.style.backgroundColor = 'transparent'; e.target.style.color = '#475569'; } }}
            >
              System <ChevronDown size={14} style={{ transform: systemMenuOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s', marginLeft: '4px' }} />
            </button>
            {systemMenuOpen && (
              <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, backgroundColor: 'white', minWidth: '200px', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)', padding: '8px 0', display: 'flex', flexDirection: 'column', zIndex: 1001, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                <Link to="/users" onClick={() => setSystemMenuOpen(false)} style={dropdownItemStyle('/users')} onMouseEnter={(e) => e.target.style.backgroundColor = '#f8fafc'} onMouseLeave={(e) => e.target.style.backgroundColor = location.pathname === '/users' ? '#f0f7ff' : 'transparent'}><Users size={16} /> User Access Role</Link>
                <div style={{ height: '1px', backgroundColor: '#e2e8f0', margin: '4px 0' }}></div>
                <Link to="/ai-settings" onClick={() => setSystemMenuOpen(false)} style={dropdownItemStyle('/ai-settings')} onMouseEnter={(e) => e.target.style.backgroundColor = '#f8fafc'} onMouseLeave={(e) => e.target.style.backgroundColor = location.pathname === '/ai-settings' ? '#f0f7ff' : 'transparent'}><BrainCircuit size={16} /> AI Settings</Link>
                <div style={{ height: '1px', backgroundColor: '#e2e8f0', margin: '4px 0' }}></div>
                <Link to="/supabase-settings" onClick={() => setSystemMenuOpen(false)} style={dropdownItemStyle('/supabase-settings')} onMouseEnter={(e) => e.target.style.backgroundColor = '#f8fafc'} onMouseLeave={(e) => e.target.style.backgroundColor = location.pathname === '/supabase-settings' ? '#f0f7ff' : 'transparent'}><Database size={16} /> Database Settings</Link>
              </div>
            )}
          </div>

          <div style={{ width: '1px', height: '24px', backgroundColor: '#e2e8f0', margin: '0 8px' }}></div>

          {/* USER MENU & LOGOUT */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', paddingLeft: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0f172a', fontSize: '0.85rem', fontWeight: 600 }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#2563eb', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700 }}>
                {user?.name?.charAt(0) || 'U'}
              </div>
              <span>{user?.name || 'User'}</span>
            </div>
            <button
              onClick={() => {
                logout();
                setUser(null);
              }}
              style={{
                backgroundColor: 'transparent',
                border: '1px solid #cbd5e1',
                color: '#64748b',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => { e.target.style.backgroundColor = '#fee2e2'; e.target.style.borderColor = '#ef4444'; e.target.style.color = '#ef4444'; }}
              onMouseLeave={(e) => { e.target.style.backgroundColor = 'transparent'; e.target.style.borderColor = '#cbd5e1'; e.target.style.color = '#64748b'; }}
            >
              Logout
            </button>
          </div>

        </div>
      </nav>}

      {/* Main Content */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <Routes>
          {isOperator ? (
            // OPERATOR ROUTES ONLY
            <>
              <Route path="/terminal" element={
                <div style={{ position: 'relative', height: '100%' }}>
                  <button onClick={() => { logout(); setUser(null); }} style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 9999, padding: '8px 16px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 600, cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>Logout</button>
                  <LiveTerminal />
                </div>
              } />
              <Route path="/terminal/:appId" element={
                <div style={{ position: 'relative', height: '100%' }}>
                  <button onClick={() => { logout(); setUser(null); }} style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 9999, padding: '8px 16px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 600, cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>Logout</button>
                  <LiveTerminal />
                </div>
              } />
              <Route path="/player" element={
                <div style={{ position: 'relative', height: '100%' }}>
                  <button onClick={() => { logout(); setUser(null); }} style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 9999, padding: '8px 16px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 600, cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>Logout</button>
                  <AppPlayer />
                </div>
              } />
              <Route path="*" element={<Navigate to="/terminal" replace />} />
            </>
          ) : (
            // ADMIN / ENGINEER FULL ROUTES
            <>
              <Route path="/" element={<Home />} />
              <Route path="/stations" element={<StationManager />} />
              <Route path="/display-devices" element={<InterfaceManager />} />
              <Route path="/machines" element={<MachineManager />} />
              <Route path="/edge-devices" element={<EdgeDeviceManager />} />
              <Route path="/vision" element={<VisionManager />} />
              <Route path="/builder" element={<AppBuilder />} />
              <Route path="/tables" element={<TableManager />} />
              <Route path="/connectors" element={<ConnectorManager />} />
              <Route path="/variables" element={<VariableManager />} />
              <Route path="/analytics" element={<AnalysisManager />} />
              <Route path="/analytics/new" element={<AnalysisEditor />} />
              <Route path="/analytics/edit/:id" element={<AnalysisEditor />} />
              <Route path="/dashboards" element={<DashboardManager />} />
              <Route path="/dashboards/new" element={<DashboardEditor />} />
              <Route path="/dashboards/edit/:id" element={<DashboardEditor />} />
              <Route path="/users" element={<UserManager />} />
              <Route path="/apps/data-entry-form-example" element={<DataEntryFormGuide />} />
              <Route path="/automations" element={<AutomationEditor />} />
              <Route path="/orders" element={<WorkOrderDashboard />} />
              <Route path="/functions" element={<FunctionsEditor />} />
              <Route path="/terminal" element={<LiveTerminal />} />
              <Route path="/terminal/:appId" element={<LiveTerminal />} />
              <Route path="/player" element={<AppPlayer />} />
              <Route path="/ai-settings" element={<AiSettings />} />
              <Route path="/supabase-settings" element={<SupabaseSettings />} />
              <Route path="*" element={<Home />} />
            </>
          )}
        </Routes>
      </div>
    </div>
  );
};

export default App;

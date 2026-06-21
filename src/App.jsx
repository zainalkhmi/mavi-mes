import {
  Layout,
  Play,
  Settings,
  Zap,
  ClipboardList,
  Camera,
  Home as HomeIcon,
  Cpu,
  ChevronDown,
  Database,
  Link2,
  Variable,
  BarChart3,
  Monitor,
  MapPin,
  Radio,
  Tv,
  Activity,
  Box,
  Eye,
  BrainCircuit,
  SlidersHorizontal,
  Users,
  ShoppingBag,
  AppWindow,
  Folder,
  ZoomIn,
  ZoomOut,
  Search,
  Volume2,
  Ruler,
  FileCode
} from 'lucide-react';
import TableManager from './components/TableManager';
import ConnectorManager from './components/ConnectorManager';
import UserManager from './components/UserManager';
import { useState, useRef, useEffect } from 'react';
import { Link, Route, Routes, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { getCurrentUser, logout } from './utils/auth';
import Login from './components/Login';
import LandingPage from './components/LandingPage';
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
import IoTHubManager from './components/IoTHubManager';
import PlcSettings from './components/PlcSettings';
import VisionManager from './components/VisionManager';
import CameraCalibration from './components/CameraCalibration';
import McpServerManager from './components/McpServerManager';
import DataEntryFormGuide from './components/DataEntryFormGuide';
import VariableManager from './components/VariableManager';
import AnalysisManager from './components/AnalysisManager';
import AnalysisEditor from './components/AnalysisEditor';
import DashboardManager from './components/DashboardManager';
import DashboardEditor from './components/DashboardEditor';
import AiSettings from './components/AiSettings';
import SupabaseSettings from './components/SupabaseSettings';
import AdminSettings from './components/AdminSettings';
import AppStore from './components/AppStore';
import AppManagement from './components/AppManagement';
import FileExplorer from './components/FileExplorer';
import BuildManager from './components/BuildManager';
import GlobalHelpAssistant from './components/GlobalHelpAssistant';
import VoiceControlledCaliperInspection from './components/VoiceControlledCaliperInspection';
import GlobalVoiceAssistant from './components/GlobalVoiceAssistant';
import DrawingManager from './components/DrawingManager';
import DrawingFileManager from './components/DrawingFileManager';
import { Toaster } from 'react-hot-toast';

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

  const [zoomLevel, setZoomLevel] = useState(() => {
    const saved = localStorage.getItem('mavi-zoom-level');
    return saved ? parseFloat(saved) : 1.0;
  });
  const [isZoomCollapsed, setIsZoomCollapsed] = useState(() => {
    const saved = localStorage.getItem('mavi-zoom-collapsed');
    return saved === 'true';
  });

  // Load PLC Settings from Supabase globally on startup
  useEffect(() => {
    const fetchGlobalPlcSettings = async () => {
      try {
        const { loadPlcSettingsFromSupabase } = await import('./utils/supabaseFrontlineDB');
        const { controllers, tags } = await loadPlcSettingsFromSupabase();
        if (controllers) {
          window.mavi_plc_controllers = controllers;
        }
        if (tags) {
          window.mavi_plc_tags = tags;
        }
      } catch (err) {
        console.error('Failed to load global PLC settings from Supabase:', err);
      }
    };
    fetchGlobalPlcSettings();
  }, []);

  // Apply zoom level dynamically to root wrapper using CSS zoom
  // CSS zoom properly scales layout flow, unlike transform: scale() which
  // only visually scales without adjusting layout calculations.
  useEffect(() => {
    const root = document.getElementById('root');
    if (root) {
      // Clean up any legacy transform-based zoom
      root.style.transform = '';
      root.style.transformOrigin = '';
      
      // Apply CSS zoom — this properly scales layout, scroll, and sizing
      root.style.zoom = zoomLevel === 1.0 ? '' : zoomLevel;
      if (zoomLevel !== 1.0) {
        root.style.height = `calc(100vh / ${zoomLevel})`;
        root.style.width = `calc(100vw / ${zoomLevel})`;
      } else {
        root.style.height = '100%';
        root.style.width = '100%';
      }
    }
    // Also clean up body zoom in case it was set by legacy code
    document.body.style.zoom = '';
    localStorage.setItem('mavi-zoom-level', zoomLevel.toFixed(2));
  }, [zoomLevel]);

  // Persist collapsed state
  useEffect(() => {
    localStorage.setItem('mavi-zoom-collapsed', isZoomCollapsed.toString());
  }, [isZoomCollapsed]);

  // Keyboard zoom event handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Check for Ctrl/Cmd key
      if (e.ctrlKey || e.metaKey) {
        // Ctrl + '=' or Ctrl + '+'
        if (e.key === '=' || e.key === '+' || e.key === 'Add') {
          e.preventDefault();
          setZoomLevel((prev) => Math.min(Math.round((prev + 0.1) * 10) / 10, 2.0));
        }
        // Ctrl + '-'
        else if (e.key === '-' || e.key === 'Subtract') {
          e.preventDefault();
          setZoomLevel((prev) => Math.max(Math.round((prev - 0.1) * 10) / 10, 0.5));
        }
        // Ctrl + '0'
        else if (e.key === '0') {
          e.preventDefault();
          setZoomLevel(1.0);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);
  const [appsMenuOpen, setAppsMenuOpen] = useState(false);
  const [analyticsMenuOpen, setAnalyticsMenuOpen] = useState(false);
  const [logicMenuOpen, setLogicMenuOpen] = useState(false);
  const [consoleMenuOpen, setConsoleMenuOpen] = useState(false);
  const [shopFloorMenuOpen, setShopFloorMenuOpen] = useState(false);
  const [visionMenuOpen, setVisionMenuOpen] = useState(false);
  const [systemMenuOpen, setSystemMenuOpen] = useState(false);
  const [drawingsMenuOpen, setDrawingsMenuOpen] = useState(false);
  const appsMenuRef = useRef(null);
  const analyticsMenuRef = useRef(null);
  const logicMenuRef = useRef(null);
  const consoleMenuRef = useRef(null);
  const shopFloorMenuRef = useRef(null);
  const visionMenuRef = useRef(null);
  const systemMenuRef = useRef(null);
  const drawingsMenuRef = useRef(null);

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
      if (visionMenuRef.current && !visionMenuRef.current.contains(event.target)) {
        setVisionMenuOpen(false);
      }
      if (systemMenuRef.current && !systemMenuRef.current.contains(event.target)) {
        setSystemMenuOpen(false);
      }
      if (drawingsMenuRef.current && !drawingsMenuRef.current.contains(event.target)) {
        setDrawingsMenuOpen(false);
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
    if (loggedInUser.role === 'OPERATOR' || loggedInUser.role === 'STATION_OPERATOR') {
      navigate('/terminal');
    } else {
      navigate('/');
    }
  };

  const hasAccess = (path) => {
    if (!user) return false;
    const role = user.role?.toUpperCase();
    
    // Account Owner: Access to everything
    if (role === 'ACCOUNT_OWNER') return true;
    
    // Administrator / ADMIN: All assets + User Access, but NO technical settings
    if (role === 'ADMINISTRATOR' || role === 'ADMIN') {
      return !['/supabase-settings'].includes(path);
    }
    
    // Connector Supervisor: Build apps, manage connectors/functions, logic, analytics, console
    if (role === 'CONNECTOR_SUPERVISOR') {
      const allowed = [
        '/', '/builder', '/file-explorer', '/store', '/app-management', '/variables',
        '/connectors', '/functions', '/automations', '/analytics', '/dashboards', '/mcp-server',
        '/player', '/terminal', '/plc-settings', '/voice-inspection'
      ];
      return allowed.some(p => path === p || path.startsWith(p + '/'));
    }
    
    // Station Supervisor: Build apps, manage stations/machines/devices/IoT/vision/analytics/console
    if (role === 'STATION_SUPERVISOR') {
      const allowed = [
        '/', '/builder', '/file-explorer', '/store', '/app-management', '/variables',
        '/stations', '/display-devices', '/machines', '/edge-devices', '/iot-hub', '/vision', '/mcp-server',
        '/analytics', '/dashboards', '/player', '/terminal', '/plc-settings', '/voice-inspection'
      ];
      return allowed.some(p => path === p || path.startsWith(p + '/'));
    }
    
    // Tulip Tables Supervisor: Build apps, manage Tables, analytics, console
    if (role === 'TABLES_SUPERVISOR') {
      const allowed = [
        '/', '/builder', '/file-explorer', '/store', '/app-management', '/variables',
        '/tables', '/analytics', '/dashboards', '/player', '/terminal', '/voice-inspection'
      ];
      return allowed.some(p => path === p || path.startsWith(p + '/'));
    }
    
    // Application Engineer: Build apps, variables, store, analytics, console
    if (role === 'APPLICATION_ENGINEER' || role === 'ENGINEER') {
      const allowed = [
        '/', '/builder', '/file-explorer', '/store', '/app-management', '/variables',
        '/analytics', '/dashboards', '/player', '/terminal', '/voice-inspection'
      ];
      return allowed.some(p => path === p || path.startsWith(p + '/'));
    }
    
    // Viewer: App Store, Analytics, Dashboards, Console
    if (role === 'VIEWER') {
      const allowed = [
        '/', '/store', '/analytics', '/dashboards', '/player', '/terminal', '/voice-inspection'
      ];
      return allowed.some(p => path === p || path.startsWith(p + '/'));
    }
    
    // Station Operator / OPERATOR
    if (role === 'STATION_OPERATOR' || role === 'OPERATOR') {
      const allowed = ['/player', '/terminal'];
      return allowed.some(p => path === p || path.startsWith(p + '/'));
    }
    
    return false;
  };

  if (!user) {
    return (
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login onLoginSuccess={handleLoginSuccess} />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // Operator-only routing constraint
  const isOperator = user.role === 'OPERATOR' || user.role === 'STATION_OPERATOR';

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#f1f5f9', fontFamily: "'Inter', sans-serif" }}>
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
            {/* HELP */}
            <Link
              to="/help"
              style={{
                ...navLinkStyle('/help'),
                backgroundColor: location.pathname === '/help' ? '#f0f7ff' : 'transparent',
                color: location.pathname === '/help' ? '#2563eb' : '#475569',
                fontSize: '0.9rem', padding: '6px 12px', fontWeight: 600
              }}
              onMouseEnter={(e) => { if (location.pathname !== '/help') { e.target.style.backgroundColor = '#f8fafc'; e.target.style.color = '#0f172a'; } }}
              onMouseLeave={(e) => { if (location.pathname !== '/help') { e.target.style.backgroundColor = 'transparent'; e.target.style.color = '#475569'; } }}
            >
              Help
            </Link>

            {/* APPS */}
            {['/builder', '/file-explorer', '/store', '/app-management', '/tables', '/connectors', '/variables'].some(hasAccess) && (
              <div style={{ position: 'relative' }} ref={appsMenuRef}>
                <button
                  onClick={() => setAppsMenuOpen(!appsMenuOpen)}
                  style={{
                    ...navLinkStyle('/builder'),
                    backgroundColor: ['/builder', '/store', '/app-management', '/file-explorer', '/tables', '/connectors', '/variables'].includes(location.pathname) ? '#f0f7ff' : 'transparent',
                    color: ['/builder', '/store', '/app-management', '/file-explorer', '/tables', '/connectors', '/variables'].includes(location.pathname) ? '#2563eb' : '#475569',
                    fontSize: '0.9rem', padding: '6px 12px', fontWeight: 600
                  }}
                  onMouseEnter={(e) => { if (!['/builder', '/tables', '/connectors', '/variables'].includes(location.pathname)) { e.target.style.backgroundColor = '#f8fafc'; e.target.style.color = '#0f172a'; } }}
                  onMouseLeave={(e) => { if (!['/builder', '/tables', '/connectors', '/variables'].includes(location.pathname)) { e.target.style.backgroundColor = 'transparent'; e.target.style.color = '#475569'; } }}
                >
                  Apps <ChevronDown size={14} style={{ transform: appsMenuOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s', marginLeft: '4px' }} />
                </button>
                {appsMenuOpen && (
                  <div style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, backgroundColor: 'white', minWidth: '200px', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)', padding: '8px 0', display: 'flex', flexDirection: 'column', zIndex: 1001, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                    {hasAccess('/builder') && <Link to="/builder" onClick={() => setAppsMenuOpen(false)} style={dropdownItemStyle('/builder')} onMouseEnter={(e) => e.target.style.backgroundColor = '#f8fafc'} onMouseLeave={(e) => e.target.style.backgroundColor = location.pathname === '/builder' ? '#f0f7ff' : 'transparent'}><Layout size={16} /> App Builder</Link>}
                    {hasAccess('/file-explorer') && <Link to="/file-explorer" onClick={() => setAppsMenuOpen(false)} style={dropdownItemStyle('/file-explorer')} onMouseEnter={(e) => e.target.style.backgroundColor = '#f8fafc'} onMouseLeave={(e) => e.target.style.backgroundColor = location.pathname === '/file-explorer' ? '#f0f7ff' : 'transparent'}><Folder size={16} /> File Explorer</Link>}
                    {hasAccess('/store') && <Link to="/store" onClick={() => setAppsMenuOpen(false)} style={dropdownItemStyle('/store')} onMouseEnter={(e) => e.target.style.backgroundColor = '#f8fafc'} onMouseLeave={(e) => e.target.style.backgroundColor = location.pathname === '/store' ? '#f0f7ff' : 'transparent'}><ShoppingBag size={16} /> App Store</Link>}
                    {hasAccess('/app-management') && <Link to="/app-management" onClick={() => setAppsMenuOpen(false)} style={dropdownItemStyle('/app-management')} onMouseEnter={(e) => e.target.style.backgroundColor = '#f8fafc'} onMouseLeave={(e) => e.target.style.backgroundColor = location.pathname === '/app-management' ? '#f0f7ff' : 'transparent'}><AppWindow size={16} /> App Management</Link>}
                    {hasAccess('/tables') && <Link to="/tables" onClick={() => setAppsMenuOpen(false)} style={dropdownItemStyle('/tables')} onMouseEnter={(e) => e.target.style.backgroundColor = '#f8fafc'} onMouseLeave={(e) => e.target.style.backgroundColor = location.pathname === '/tables' ? '#f0f7ff' : 'transparent'}><Database size={16} /> Tables</Link>}
                    {hasAccess('/connectors') && <Link to="/connectors" onClick={() => setAppsMenuOpen(false)} style={dropdownItemStyle('/connectors')} onMouseEnter={(e) => e.target.style.backgroundColor = '#f8fafc'} onMouseLeave={(e) => e.target.style.backgroundColor = location.pathname === '/connectors' ? '#f0f7ff' : 'transparent'}><Link2 size={16} /> Connectors</Link>}
                    {hasAccess('/mcp-server') && <Link to="/mcp-server" onClick={() => setAppsMenuOpen(false)} style={dropdownItemStyle('/mcp-server')} onMouseEnter={(e) => e.target.style.backgroundColor = '#f8fafc'} onMouseLeave={(e) => e.target.style.backgroundColor = location.pathname === '/mcp-server' ? '#f0f7ff' : 'transparent'}><BrainCircuit size={16} /> Mavi MCP Server</Link>}
                    {hasAccess('/variables') && <Link to="/variables" onClick={() => setAppsMenuOpen(false)} style={dropdownItemStyle('/variables')} onMouseEnter={(e) => e.target.style.backgroundColor = '#f8fafc'} onMouseLeave={(e) => e.target.style.backgroundColor = location.pathname === '/variables' ? '#f0f7ff' : 'transparent'}><Variable size={16} /> Variables</Link>}
                  </div>
                )}
              </div>
            )}

            {/* DRAWINGS */}
            {hasAccess('/builder') && (
              <div style={{ position: 'relative' }} ref={drawingsMenuRef}>
                <button
                  onClick={() => setDrawingsMenuOpen(!drawingsMenuOpen)}
                  style={{
                    ...navLinkStyle('/drawings'),
                    backgroundColor: ['/drawings', '/drawings/files'].includes(location.pathname) ? '#f0f7ff' : 'transparent',
                    color: ['/drawings', '/drawings/files'].includes(location.pathname) ? '#2563eb' : '#475569',
                    fontSize: '0.9rem', padding: '6px 12px', fontWeight: 600
                  }}
                  onMouseEnter={(e) => { if (!['/drawings', '/drawings/files'].includes(location.pathname)) { e.target.style.backgroundColor = '#f8fafc'; e.target.style.color = '#0f172a'; } }}
                  onMouseLeave={(e) => { if (!['/drawings', '/drawings/files'].includes(location.pathname)) { e.target.style.backgroundColor = 'transparent'; e.target.style.color = '#475569'; } }}
                >
                  Drawings <ChevronDown size={14} style={{ transform: drawingsMenuOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s', marginLeft: '4px' }} />
                </button>
                {drawingsMenuOpen && (
                  <div style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, backgroundColor: 'white', minWidth: '220px', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)', padding: '8px 0', display: 'flex', flexDirection: 'column', zIndex: 1001, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                    <Link to="/drawings" onClick={() => setDrawingsMenuOpen(false)} style={dropdownItemStyle('/drawings')} onMouseEnter={(e) => e.target.style.backgroundColor = '#f8fafc'} onMouseLeave={(e) => e.target.style.backgroundColor = location.pathname === '/drawings' ? '#f0f7ff' : 'transparent'}><Layout size={16} /> Drawing Canvas & Mapping</Link>
                    <Link to="/drawings/files" onClick={() => setDrawingsMenuOpen(false)} style={dropdownItemStyle('/drawings/files')} onMouseEnter={(e) => e.target.style.backgroundColor = '#f8fafc'} onMouseLeave={(e) => e.target.style.backgroundColor = location.pathname === '/drawings/files' ? '#f0f7ff' : 'transparent'}><FileCode size={16} /> Drawing File Management</Link>
                  </div>
                )}
              </div>
            )}

            {/* SHOP FLOOR */}
            {['/stations', '/display-devices', '/machines', '/edge-devices', '/iot-hub', '/plc-settings', '/voice-inspection'].some(hasAccess) && (
              <div style={{ position: 'relative' }} ref={shopFloorMenuRef}>
                <button
                  onClick={() => setShopFloorMenuOpen(!shopFloorMenuOpen)}
                  style={{
                    ...navLinkStyle('/stations'),
                    backgroundColor: ['/stations', '/display-devices', '/machines', '/edge-devices', '/iot-hub', '/plc-settings', '/voice-inspection'].includes(location.pathname) ? '#f0f7ff' : 'transparent',
                    color: ['/stations', '/display-devices', '/machines', '/edge-devices', '/iot-hub', '/plc-settings', '/voice-inspection'].includes(location.pathname) ? '#2563eb' : '#475569',
                    fontSize: '0.9rem', padding: '6px 12px', fontWeight: 600
                  }}
                  onMouseEnter={(e) => { if (!['/stations', '/display-devices', '/machines', '/edge-devices', '/iot-hub', '/plc-settings', '/voice-inspection'].includes(location.pathname)) { e.target.style.backgroundColor = '#f8fafc'; e.target.style.color = '#0f172a'; } }}
                  onMouseLeave={(e) => { if (!['/stations', '/display-devices', '/machines', '/edge-devices', '/iot-hub', '/plc-settings'].includes(location.pathname)) { e.target.style.backgroundColor = 'transparent'; e.target.style.color = '#475569'; } }}
                >
                  Shop Floor <ChevronDown size={14} style={{ transform: shopFloorMenuOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s', marginLeft: '4px' }} />
                </button>
                {shopFloorMenuOpen && (
                  <div style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, backgroundColor: 'white', minWidth: '220px', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)', padding: '8px 0', display: 'flex', flexDirection: 'column', zIndex: 1001, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                    {hasAccess('/stations') && <Link to="/stations" onClick={() => setShopFloorMenuOpen(false)} style={dropdownItemStyle('/stations')} onMouseEnter={(e) => e.target.style.backgroundColor = '#f8fafc'} onMouseLeave={(e) => e.target.style.backgroundColor = location.pathname === '/stations' ? '#f0f7ff' : 'transparent'}><MapPin size={16} /> Stations</Link>}
                    {hasAccess('/display-devices') && <Link to="/display-devices" onClick={() => setShopFloorMenuOpen(false)} style={dropdownItemStyle('/display-devices')} onMouseEnter={(e) => e.target.style.backgroundColor = '#f8fafc'} onMouseLeave={(e) => e.target.style.backgroundColor = location.pathname === '/display-devices' ? '#f0f7ff' : 'transparent'}><Tv size={16} /> Interfaces</Link>}
                    {hasAccess('/machines') && <Link to="/machines" onClick={() => setShopFloorMenuOpen(false)} style={dropdownItemStyle('/machines')} onMouseEnter={(e) => e.target.style.backgroundColor = '#f8fafc'} onMouseLeave={(e) => e.target.style.backgroundColor = location.pathname === '/machines' ? '#f0f7ff' : 'transparent'}><Cpu size={16} /> Machines</Link>}
                    {hasAccess('/edge-devices') && <Link to="/edge-devices" onClick={() => setShopFloorMenuOpen(false)} style={dropdownItemStyle('/edge-devices')} onMouseEnter={(e) => e.target.style.backgroundColor = '#f8fafc'} onMouseLeave={(e) => e.target.style.backgroundColor = location.pathname === '/edge-devices' ? '#f0f7ff' : 'transparent'}><Activity size={16} /> Edge Devices</Link>}
                    {hasAccess('/voice-inspection') && <Link to="/voice-inspection" onClick={() => setShopFloorMenuOpen(false)} style={dropdownItemStyle('/voice-inspection')} onMouseEnter={(e) => e.target.style.backgroundColor = '#f8fafc'} onMouseLeave={(e) => e.target.style.backgroundColor = location.pathname === '/voice-inspection' ? '#f0f7ff' : 'transparent'}><Volume2 size={16} /> Voice Inspection</Link>}
                    <div style={{ height: '1px', backgroundColor: '#e2e8f0', margin: '4px 0' }} />
                    {hasAccess('/iot-hub') && <Link to="/iot-hub" onClick={() => setShopFloorMenuOpen(false)} style={{ ...dropdownItemStyle('/iot-hub'), background: location.pathname === '/iot-hub' ? 'linear-gradient(135deg,#eff6ff,#f5f3ff)' : 'transparent' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = location.pathname === '/iot-hub' ? '#eff6ff' : 'transparent'}><Radio size={16} style={{ color: '#8b5cf6' }} /> <span style={{ background: 'linear-gradient(90deg,#3b82f6,#8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: 800 }}>IoT Hub</span> <span style={{ marginLeft: 'auto', fontSize: '0.6rem', fontWeight: 800, padding: '1px 6px', backgroundColor: '#8b5cf6', color: 'white', borderRadius: '10px' }}>NEW</span></Link>}
                    {hasAccess('/plc-settings') && <Link to="/plc-settings" onClick={() => setShopFloorMenuOpen(false)} style={dropdownItemStyle('/plc-settings')} onMouseEnter={(e) => e.target.style.backgroundColor = '#f8fafc'} onMouseLeave={(e) => e.target.style.backgroundColor = location.pathname === '/plc-settings' ? '#f0f7ff' : 'transparent'}><SlidersHorizontal size={16} /> PLC Settings</Link>}
                  </div>
                )}
              </div>
            )}

            {/* VISION DROPDOWN */}
            {hasAccess('/vision') && (
              <div style={{ position: 'relative' }} ref={visionMenuRef}>
                <button
                  onClick={() => setVisionMenuOpen(!visionMenuOpen)}
                  style={{
                    ...navLinkStyle('/vision'),
                    backgroundColor: ['/vision', '/vision/calibration'].includes(location.pathname) ? '#f0f7ff' : 'transparent',
                    color: ['/vision', '/vision/calibration'].includes(location.pathname) ? '#2563eb' : '#475569',
                    fontSize: '0.9rem', padding: '6px 12px', fontWeight: 600
                  }}
                  onMouseEnter={(e) => { if (!['/vision', '/vision/calibration'].includes(location.pathname)) { e.target.style.backgroundColor = '#f8fafc'; e.target.style.color = '#0f172a'; } }}
                  onMouseLeave={(e) => { if (!['/vision', '/vision/calibration'].includes(location.pathname)) { e.target.style.backgroundColor = 'transparent'; e.target.style.color = '#475569'; } }}
                >
                  Vision <ChevronDown size={14} style={{ transform: visionMenuOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s', marginLeft: '4px' }} />
                </button>
                {visionMenuOpen && (
                  <div style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, backgroundColor: 'white', minWidth: '220px', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)', padding: '8px 0', display: 'flex', flexDirection: 'column', zIndex: 1001, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                    <Link to="/vision" onClick={() => setVisionMenuOpen(false)} style={dropdownItemStyle('/vision')} onMouseEnter={(e) => e.target.style.backgroundColor = '#f8fafc'} onMouseLeave={(e) => e.target.style.backgroundColor = location.pathname === '/vision' ? '#f0f7ff' : 'transparent'}><Eye size={16} /> Vision</Link>
                    <Link to="/vision/calibration" onClick={() => setVisionMenuOpen(false)} style={dropdownItemStyle('/vision/calibration')} onMouseEnter={(e) => e.target.style.backgroundColor = '#f8fafc'} onMouseLeave={(e) => e.target.style.backgroundColor = location.pathname === '/vision/calibration' ? '#f0f7ff' : 'transparent'}><Camera size={16} /> Camera Calibration</Link>
                  </div>
                )}
              </div>
            )}

            {/* ANALYTICS */}
            {['/analytics', '/dashboards'].some(hasAccess) && (
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
                    {hasAccess('/analytics') && <Link to="/analytics" onClick={() => setAnalyticsMenuOpen(false)} style={dropdownItemStyle('/analytics')} onMouseEnter={(e) => e.target.style.backgroundColor = '#f8fafc'} onMouseLeave={(e) => e.target.style.backgroundColor = location.pathname === '/analytics' ? '#f0f7ff' : 'transparent'}><BarChart3 size={16} /> Analysis Manager</Link>}
                    {hasAccess('/dashboards') && <Link to="/dashboards" onClick={() => setAnalyticsMenuOpen(false)} style={dropdownItemStyle('/dashboards')} onMouseEnter={(e) => e.target.style.backgroundColor = '#f8fafc'} onMouseLeave={(e) => e.target.style.backgroundColor = location.pathname === '/dashboards' ? '#f0f7ff' : 'transparent'}><Layout size={16} /> Dashboards</Link>}
                  </div>
                )}
              </div>
            )}

            {/* LOGIC */}
            {['/automations', '/functions'].some(hasAccess) && (
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
                    {hasAccess('/automations') && <Link to="/automations" onClick={() => setLogicMenuOpen(false)} style={dropdownItemStyle('/automations')} onMouseEnter={(e) => e.target.style.backgroundColor = '#f8fafc'} onMouseLeave={(e) => e.target.style.backgroundColor = location.pathname === '/automations' ? '#f0f7ff' : 'transparent'}><Zap size={16} /> Automations</Link>}
                    {hasAccess('/functions') && <Link to="/functions" onClick={() => setLogicMenuOpen(false)} style={dropdownItemStyle('/functions')} onMouseEnter={(e) => e.target.style.backgroundColor = '#f8fafc'} onMouseLeave={(e) => e.target.style.backgroundColor = location.pathname === '/functions' ? '#f0f7ff' : 'transparent'}><Cpu size={16} /> Functions</Link>}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>

        {/* RIGHT SECTION: Console, System, User */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>

          {/* CONSOLE */}
          {['/player', '/terminal'].some(hasAccess) && (
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
                  {hasAccess('/player') && <Link to="/player" onClick={() => setConsoleMenuOpen(false)} style={dropdownItemStyle('/player')} onMouseEnter={(e) => e.target.style.backgroundColor = '#f8fafc'} onMouseLeave={(e) => e.target.style.backgroundColor = location.pathname === '/player' ? '#f0f7ff' : 'transparent'}><Play size={16} /> App Player</Link>}
                  {hasAccess('/terminal') && <Link to="/terminal" onClick={() => setConsoleMenuOpen(false)} style={dropdownItemStyle('/terminal')} onMouseEnter={(e) => e.target.style.backgroundColor = '#f8fafc'} onMouseLeave={(e) => e.target.style.backgroundColor = location.pathname === '/terminal' ? '#f0f7ff' : 'transparent'}><Monitor size={16} /> Live Terminal</Link>}
                </div>
              )}
            </div>
          )}

          {/* SYSTEM */}
          {['/users', '/ai-settings', '/supabase-settings', '/build-center', '/admin-settings'].some(hasAccess) && (
            <div style={{ position: 'relative' }} ref={systemMenuRef}>
              <button
                onClick={() => setSystemMenuOpen(!systemMenuOpen)}
                style={{
                  ...navLinkStyle('/system'),
                  backgroundColor: ['/users', '/ai-settings', '/supabase-settings', '/build-center', '/admin-settings'].includes(location.pathname) ? '#f0f7ff' : 'transparent',
                  color: ['/users', '/ai-settings', '/supabase-settings', '/build-center', '/admin-settings'].includes(location.pathname) ? '#2563eb' : '#475569',
                  fontSize: '0.9rem', padding: '6px 12px', fontWeight: 600
                }}
                onMouseEnter={(e) => { if (!['/users', '/ai-settings', '/supabase-settings', '/build-center', '/admin-settings'].includes(location.pathname)) { e.target.style.backgroundColor = '#f8fafc'; e.target.style.color = '#0f172a'; } }}
                onMouseLeave={(e) => { if (!['/users', '/ai-settings', '/supabase-settings', '/build-center', '/admin-settings'].includes(location.pathname)) { e.target.style.backgroundColor = 'transparent'; e.target.style.color = '#475569'; } }}
              >
                System <ChevronDown size={14} style={{ transform: systemMenuOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s', marginLeft: '4px' }} />
              </button>
              {systemMenuOpen && (
                <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, backgroundColor: 'white', minWidth: '200px', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)', padding: '8px 0', display: 'flex', flexDirection: 'column', zIndex: 1001, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                  {hasAccess('/users') && <Link to="/users" onClick={() => setSystemMenuOpen(false)} style={dropdownItemStyle('/users')} onMouseEnter={(e) => e.target.style.backgroundColor = '#f8fafc'} onMouseLeave={(e) => e.target.style.backgroundColor = location.pathname === '/users' ? '#f0f7ff' : 'transparent'}><Users size={16} /> User Access Role</Link>}
                  <div style={{ height: '1px', backgroundColor: '#e2e8f0', margin: '4px 0' }}></div>
                  {hasAccess('/ai-settings') && <Link to="/ai-settings" onClick={() => setSystemMenuOpen(false)} style={dropdownItemStyle('/ai-settings')} onMouseEnter={(e) => e.target.style.backgroundColor = '#f8fafc'} onMouseLeave={(e) => e.target.style.backgroundColor = location.pathname === '/ai-settings' ? '#f0f7ff' : 'transparent'}><BrainCircuit size={16} /> AI Settings</Link>}
                  <div style={{ height: '1px', backgroundColor: '#e2e8f0', margin: '4px 0' }}></div>
                  {hasAccess('/supabase-settings') && <Link to="/supabase-settings" onClick={() => setSystemMenuOpen(false)} style={dropdownItemStyle('/supabase-settings')} onMouseEnter={(e) => e.target.style.backgroundColor = '#f8fafc'} onMouseLeave={(e) => e.target.style.backgroundColor = location.pathname === '/supabase-settings' ? '#f0f7ff' : 'transparent'}><Database size={16} /> Database Settings</Link>}
                  <div style={{ height: '1px', backgroundColor: '#e2e8f0', margin: '4px 0' }}></div>
                  {hasAccess('/admin-settings') && <Link to="/admin-settings" onClick={() => setSystemMenuOpen(false)} style={dropdownItemStyle('/admin-settings')} onMouseEnter={(e) => e.target.style.backgroundColor = '#f8fafc'} onMouseLeave={(e) => e.target.style.backgroundColor = location.pathname === '/admin-settings' ? '#f0f7ff' : 'transparent'}><SlidersHorizontal size={16} /> Admin Settings</Link>}
                  <div style={{ height: '1px', backgroundColor: '#e2e8f0', margin: '4px 0' }}></div>
                  {hasAccess('/build-center') && <Link to="/build-center" onClick={() => setSystemMenuOpen(false)} style={dropdownItemStyle('/build-center')} onMouseEnter={(e) => e.target.style.backgroundColor = '#f8fafc'} onMouseLeave={(e) => e.target.style.backgroundColor = location.pathname === '/build-center' ? '#f0f7ff' : 'transparent'}><Cpu size={16} /> App Compiler</Link>}
                </div>
              )}
            </div>
          )}

          <Toaster position="top-right" />
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
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <Routes>
          {isOperator ? (
            // OPERATOR ROUTES ONLY
            <>
              <Route path="/terminal" element={<LiveTerminal />} />
              <Route path="/terminal/:appId" element={<LiveTerminal />} />
              <Route path="/player" element={<AppPlayer />} />
              <Route path="*" element={<Navigate to="/terminal" replace />} />
            </>
          ) : (
            // ADMIN / ENGINEER FULL ROUTES
            <>
              <Route path="/" element={<Home />} />
              <Route path="/stations" element={hasAccess('/stations') ? <StationManager /> : <Navigate to="/" replace />} />
              <Route path="/display-devices" element={hasAccess('/display-devices') ? <InterfaceManager /> : <Navigate to="/" replace />} />
              <Route path="/machines" element={hasAccess('/machines') ? <MachineManager /> : <Navigate to="/" replace />} />
              <Route path="/edge-devices" element={hasAccess('/edge-devices') ? <EdgeDeviceManager /> : <Navigate to="/" replace />} />
              <Route path="/vision" element={hasAccess('/vision') ? <VisionManager /> : <Navigate to="/" replace />} />
              <Route path="/vision/calibration" element={hasAccess('/vision') ? <CameraCalibration /> : <Navigate to="/" replace />} />
              <Route path="/iot-hub" element={hasAccess('/iot-hub') ? <IoTHubManager /> : <Navigate to="/" replace />} />
              <Route path="/plc-settings" element={hasAccess('/plc-settings') ? <PlcSettings /> : <Navigate to="/" replace />} />
              <Route path="/builder" element={hasAccess('/builder') ? <AppBuilder /> : <Navigate to="/" replace />} />
              <Route path="/file-explorer" element={hasAccess('/file-explorer') ? <FileExplorer /> : <Navigate to="/" replace />} />
              <Route path="/store" element={hasAccess('/store') ? <AppStore /> : <Navigate to="/" replace />} />
              <Route path="/drawings" element={hasAccess('/builder') ? <DrawingManager /> : <Navigate to="/" replace />} />
              <Route path="/drawings/files" element={hasAccess('/builder') ? <DrawingFileManager /> : <Navigate to="/" replace />} />
              <Route path="/app-management" element={hasAccess('/app-management') ? <AppManagement /> : <Navigate to="/" replace />} />
              <Route path="/tables" element={hasAccess('/tables') ? <TableManager /> : <Navigate to="/" replace />} />
              <Route path="/connectors" element={hasAccess('/connectors') ? <ConnectorManager /> : <Navigate to="/" replace />} />
              <Route path="/mcp-server" element={hasAccess('/mcp-server') ? <McpServerManager /> : <Navigate to="/" replace />} />
              <Route path="/variables" element={hasAccess('/variables') ? <VariableManager /> : <Navigate to="/" replace />} />
              <Route path="/analytics" element={hasAccess('/analytics') ? <AnalysisManager /> : <Navigate to="/" replace />} />
              <Route path="/analytics/new" element={hasAccess('/analytics') ? <AnalysisEditor /> : <Navigate to="/" replace />} />
              <Route path="/analytics/edit/:id" element={hasAccess('/analytics') ? <AnalysisEditor /> : <Navigate to="/" replace />} />
              <Route path="/dashboards" element={hasAccess('/dashboards') ? <DashboardManager /> : <Navigate to="/" replace />} />
              <Route path="/dashboards/new" element={hasAccess('/dashboards') ? <DashboardEditor /> : <Navigate to="/" replace />} />
              <Route path="/dashboards/edit/:id" element={hasAccess('/dashboards') ? <DashboardEditor /> : <Navigate to="/" replace />} />
              <Route path="/users" element={hasAccess('/users') ? <UserManager /> : <Navigate to="/" replace />} />
              <Route path="/apps/data-entry-form-example" element={<DataEntryFormGuide />} />
              <Route path="/automations" element={hasAccess('/automations') ? <AutomationEditor /> : <Navigate to="/" replace />} />
              <Route path="/orders" element={<WorkOrderDashboard />} />
              <Route path="/functions" element={hasAccess('/functions') ? <FunctionsEditor /> : <Navigate to="/" replace />} />
              <Route path="/terminal" element={hasAccess('/terminal') ? <LiveTerminal /> : <Navigate to="/" replace />} />
              <Route path="/terminal/:appId" element={hasAccess('/terminal') ? <LiveTerminal /> : <Navigate to="/" replace />} />
              <Route path="/player" element={hasAccess('/player') ? <AppPlayer /> : <Navigate to="/" replace />} />
               <Route path="/ai-settings" element={hasAccess('/ai-settings') ? <AiSettings /> : <Navigate to="/" replace />} />
              <Route path="/supabase-settings" element={hasAccess('/supabase-settings') ? <SupabaseSettings /> : <Navigate to="/" replace />} />
              <Route path="/admin-settings" element={hasAccess('/admin-settings') ? <AdminSettings /> : <Navigate to="/" replace />} />
              <Route path="/build-center" element={hasAccess('/build-center') ? <BuildManager /> : <Navigate to="/" replace />} />
              <Route path="/help" element={<GlobalHelpAssistant />} />
              <Route path="/voice-inspection" element={<VoiceControlledCaliperInspection />} />
              <Route path="*" element={<Home />} />
            </>
          )}
        </Routes>
      </div>

      {/* Floating Zoom Widget */}
      <div 
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: isZoomCollapsed ? '8px' : '6px 12px',
          borderRadius: '24px',
          backgroundColor: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(226, 232, 240, 0.8)',
          boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.15), 0 2px 8px -1px rgba(0, 0, 0, 0.1)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          fontFamily: "'Inter', sans-serif",
          color: '#1e293b',
          userSelect: 'none'
        }}
      >
        {isZoomCollapsed ? (
          // Collapsed circular button showing magnifier
          <button
            onClick={() => setIsZoomCollapsed(false)}
            title={`Zoom: ${Math.round(zoomLevel * 100)}% (Click to expand)`}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              margin: 0,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#2563eb',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: 'rgba(37, 99, 235, 0.08)',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(37, 99, 235, 0.15)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(37, 99, 235, 0.08)'; }}
          >
            <Search size={18} />
          </button>
        ) : (
          // Expanded pill showing full controls
          <>
            {/* Collapse Arrow */}
            <button
              onClick={() => setIsZoomCollapsed(true)}
              title="Collapse controls"
              style={{
                background: 'none',
                border: 'none',
                padding: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#64748b',
                borderRadius: '4px',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f1f5f9'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              <span style={{ fontSize: '10px', fontWeight: 'bold' }}>▶</span>
            </button>

            {/* Zoom Out Button */}
            <button
              onClick={() => setZoomLevel((prev) => Math.max(Math.round((prev - 0.1) * 10) / 10, 0.5))}
              disabled={zoomLevel <= 0.5}
              title="Zoom Out (Ctrl + -)"
              style={{
                background: 'none',
                border: 'none',
                padding: '6px',
                cursor: zoomLevel <= 0.5 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: zoomLevel <= 0.5 ? '#cbd5e1' : '#475569',
                borderRadius: '50%',
                backgroundColor: zoomLevel <= 0.5 ? 'transparent' : '#f1f5f9',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => { if (zoomLevel > 0.5) { e.currentTarget.style.backgroundColor = '#e2e8f0'; e.currentTarget.style.color = '#0f172a'; } }}
              onMouseLeave={(e) => { if (zoomLevel > 0.5) { e.currentTarget.style.backgroundColor = '#f1f5f9'; e.currentTarget.style.color = '#475569'; } }}
            >
              <ZoomOut size={14} />
            </button>

            {/* Zoom Level Indicator & Reset Button */}
            <button
              onClick={() => setZoomLevel(1.0)}
              title="Reset Zoom to 100% (Ctrl + 0)"
              style={{
                background: 'none',
                border: 'none',
                padding: '4px 8px',
                cursor: 'pointer',
                fontSize: '0.75rem',
                fontWeight: 700,
                color: zoomLevel === 1.0 ? '#475569' : '#2563eb',
                borderRadius: '6px',
                backgroundColor: zoomLevel === 1.0 ? 'transparent' : 'rgba(37, 99, 235, 0.08)',
                transition: 'all 0.2s',
                minWidth: '50px',
                textAlign: 'center'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = zoomLevel === 1.0 ? '#f1f5f9' : 'rgba(37, 99, 235, 0.15)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = zoomLevel === 1.0 ? 'transparent' : 'rgba(37, 99, 235, 0.08)'; }}
            >
              {Math.round(zoomLevel * 100)}%
            </button>

            {/* Zoom In Button */}
            <button
              onClick={() => setZoomLevel((prev) => Math.min(Math.round((prev + 0.1) * 10) / 10, 2.0))}
              disabled={zoomLevel >= 2.0}
              title="Zoom In (Ctrl + =)"
              style={{
                background: 'none',
                border: 'none',
                padding: '6px',
                cursor: zoomLevel >= 2.0 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: zoomLevel >= 2.0 ? '#cbd5e1' : '#475569',
                borderRadius: '50%',
                backgroundColor: zoomLevel >= 2.0 ? 'transparent' : '#f1f5f9',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => { if (zoomLevel < 2.0) { e.currentTarget.style.backgroundColor = '#e2e8f0'; e.currentTarget.style.color = '#0f172a'; } }}
              onMouseLeave={(e) => { if (zoomLevel < 2.0) { e.currentTarget.style.backgroundColor = '#f1f5f9'; e.currentTarget.style.color = '#475569'; } }}
            >
              <ZoomIn size={14} />
            </button>
          </>
        )}
      </div>
      <GlobalVoiceAssistant />
    </div>
  );
};

export default App;

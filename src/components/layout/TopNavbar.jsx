import { Link, useLocation } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import {
  Settings, Zap, Camera, Cpu, Database, Link2, Variable,
  BarChart3, BarChart2, Monitor, MapPin, Radio, Tv, Activity, Eye, BrainCircuit,
  SlidersHorizontal, Users, ShoppingBag, AppWindow, Folder, Volume2,
  FileCode, Webhook, Play, Layout, FileText, PieChart, Terminal, Bot, Clock,
  ClipboardCheck, FileSpreadsheet, Boxes, LayoutDashboard, FolderArchive, Layers,
  Workflow, ActivitySquare, Key, LayoutTemplate, GitBranch, Settings2,
  ChevronDown, ChevronRight, Ruler, Scale, Gauge, Shield,
  AlertTriangle, Smartphone, Sparkles
} from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import { useGlobalStore } from '../../store/useGlobalStore.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { hasAccess as checkRoleAccess } from '../../utils/roleAccess.js';
import { logout } from '../../utils/auth.js';
import NavDropdown from './NavDropdown.jsx';
import SystemStatusDropdown from './SystemStatusDropdown.jsx';

export default function TopNavbar() {
  const location = useLocation();
  const globalUser = useGlobalStore((state) => state.user);
  const setUser = useGlobalStore((state) => state.setUser);
  const isOperator = useGlobalStore((state) => state.getIsOperator());
  const { user: authUser } = useAuth();
  const user = authUser || globalUser;
  const isChecksheetRoute = 
    location.pathname.startsWith('/drawing-checksheet') ||
    location.pathname.startsWith('/qa-checksheet') ||
    location.pathname.startsWith('/live-checksheet') ||
    location.pathname.startsWith('/live-player') ||
    location.pathname.startsWith('/simple-checksheet') ||
    location.search.includes('standalone=true') ||
    location.search.includes('hideHeader=true') ||
    location.search.includes('mode=companion') ||
    window.location.hash.includes('standalone=true') ||
    window.location.hash.includes('mode=companion') ||
    location.pathname.startsWith('/app-player') ||
    window.location.hash.includes('app-player');

  const isOperatorRoute = location.pathname.startsWith('/player') || location.pathname.startsWith('/app-player') || location.pathname.startsWith('/terminal');
  const hasAccess = (path) => checkRoleAccess(user, path);

  // Logic dropdown state
  const [isOpen, setIsOpen] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState(null);
  const menuRef = useRef(null);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
        setActiveSubmenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Check if any automation/functions route is active
  const isLogicActive = ['/automations', '/functions'].some(path => location.pathname.startsWith(path));

  if (isOperatorRoute || isOperator || isChecksheetRoute) return null;

  const appItems = [
    {
      label: 'App Builder',
      icon: <Boxes size={16} className="text-indigo-600" />,
      badge: '3 Cabang',
      items: [
        { type: 'header', label: 'Suite App Builder (3 Cabang)' },
        {
          path: '/builder',
          matchPaths: ['/builder'],
          target: '_blank',
          icon: <Monitor size={18} className="text-blue-600" />,
          label: '1. PC — Mavi App Builder',
          shortLabel: 'PC',
          badge: 'PC / Desktop',
          description: 'Canvas App Builder untuk PC / Workstation MES'
        },
        {
          path: '/ui-engine',
          matchPaths: ['/ui-engine', '/gluestack'],
          target: '_blank',
          icon: <Smartphone size={18} className="text-purple-600" />,
          label: '2. Mobile — Gluestack App Builder',
          shortLabel: 'Mobile',
          badge: 'Mobile / Tablet',
          description: 'Gluestack UI Engine Studio untuk Smartphone & Tablet'
        },
        {
          path: '/sandbox',
          matchPaths: ['/sandbox'],
          target: '_blank',
          icon: <Sparkles size={18} className="text-amber-500" />,
          label: '3. Generatif — Sandbox App Builder',
          shortLabel: 'Generatif',
          badge: 'Generatif AI',
          description: 'Vibe Sandpack AI Code Generator & Live Interactive Sandbox'
        }
      ]
    },
    { type: 'divider' },
    hasAccess('/file-explorer') && { path: '/file-explorer', icon: <Folder size={16} />, label: 'File Explorer' },
    hasAccess('/app-management') && { path: '/app-management', icon: <AppWindow size={16} />, label: 'App Management' },
    hasAccess('/tables') && { path: '/tables', icon: <Database size={16} />, label: 'Tables' },
    hasAccess('/connectors') && { path: '/connectors', icon: <Link2 size={16} />, label: 'Connectors' },
    hasAccess('/mcp-server') && { path: '/mcp-server', icon: <BrainCircuit size={16} />, label: 'Mandor MCP Server' },
    hasAccess('/variables') && { path: '/variables', icon: <Variable size={16} />, label: 'Variables' }
  ].filter(Boolean);

  const plmItems = [
    { path: '/plm-integration', icon: <Layers size={16} />, label: 'PLM Dashboard' },
    { path: '/drawing-management', icon: <Folder size={16} />, label: 'Drawing Management' },
    { path: '/inspector-designer', icon: <FileCode size={16} />, label: 'Inspector Designer' },
    { path: '/drawing-checksheet', icon: <ClipboardCheck size={16} />, label: 'Digital Check Sheet' },
    { path: '/checksheets', icon: <FolderArchive size={16} />, label: 'Checksheet Management (ISO 9001)' },
    { type: 'divider' },
    { path: '/measuring-tools', icon: <Ruler size={16} />, label: 'Master Alat Ukur & Kalibrasi (ISO 17025)' },
    { path: '/defects', icon: <AlertTriangle size={16} />, label: 'Master Defect Library' }
  ].filter(Boolean);

  const shopFloorItems = [
    hasAccess('/stations') && { path: '/stations', icon: <MapPin size={16} />, label: 'Stations' },
    hasAccess('/display-devices') && { path: '/display-devices', icon: <Tv size={16} />, label: 'Interfaces' },
    hasAccess('/machines') && { path: '/machines', icon: <Cpu size={16} />, label: 'Machines' },
    hasAccess('/edge-devices') && { path: '/edge-devices', icon: <Activity size={16} />, label: 'Edge Devices' },
    { type: 'divider' },
    hasAccess('/plc-settings') && { path: '/plc-settings', icon: <SlidersHorizontal size={16} />, label: 'PLC Settings' },
    { path: '/nodered', icon: <Terminal size={16} />, label: 'Node-RED Dashboard' }
  ].filter(Boolean);

  const visionItems = [
    hasAccess('/vision') && { path: '/vision', icon: <Eye size={16} />, label: 'Vision' },
    hasAccess('/vision/quickbuild') && { path: '/vision/quickbuild', icon: <Zap size={16} className="text-orange-400" />, label: 'Vision Builder' },
    hasAccess('/vision/calibration') && { path: '/vision/calibration', icon: <Camera size={16} />, label: 'Camera Calibration' }
  ].filter(Boolean);

  const analyticsItems = [
    hasAccess('/bi') && { path: '/bi', icon: <BarChart2 size={16} className="text-blue-500" />, label: 'BI Studio' },
    hasAccess('/reports') && { path: '/reports', icon: <FileSpreadsheet size={16} className="text-emerald-500" />, label: 'Report Designer' },
    hasAccess('/shift-handoff') && { path: '/shift-handoff', icon: <Clock size={16} className="text-amber-500" />, label: 'Shift Handoff' }
  ].filter(Boolean);

  // Automation submenu items
  const automationSubItems = [
    { path: '/automations', icon: <Cpu size={16} />, label: 'Automation Hub' },
    { path: '/automations/editor', icon: <Workflow size={16} />, label: 'Workflow Editor' },
    { path: '/automations/monitor', icon: <ActivitySquare size={16} />, label: 'Execution Monitor' },
    { path: '/automations/templates', icon: <LayoutTemplate size={16} />, label: 'Templates Gallery' },
    { path: '/automations/credentials', icon: <Key size={16} />, label: 'Credentials Manager' }
  ];

  // Functions submenu items
  const functionsSubItems = [
    hasAccess('/functions') && { path: '/functions', icon: <Boxes size={16} />, label: 'Functions Editor' }
  ].filter(Boolean);

  // Logic section - main dropdown with 2 sub-items
  const logicItems = [
    {
      type: 'dropdown',
      label: 'Automation',
      icon: <Cpu size={16} />,
      items: automationSubItems
    },
    {
      type: 'dropdown',
      label: 'Function',
      icon: <Boxes size={16} />,
      items: functionsSubItems
    }
  ];

  const consoleItems = [
    hasAccess('/player') && { path: '/player', icon: <Play size={16} />, label: 'App Player' },
    hasAccess('/terminal') && { path: '/terminal', icon: <Monitor size={16} />, label: 'Live Terminal' }
  ].filter(Boolean);

  const systemItems = [
    hasAccess('/users') && { path: '/users', icon: <Users size={16} />, label: 'User Access Role' },
    { type: 'divider' },
    hasAccess('/ai-settings') && { path: '/ai-settings', icon: <BrainCircuit size={16} />, label: 'AI Settings' },
    { path: '/ai-agents', icon: <Bot size={16} className="text-purple-500" />, label: 'AI Agents' },
    { type: 'divider' },
    hasAccess('/supabase-settings') && { path: '/supabase-settings', icon: <Database size={16} />, label: 'Database Settings' },
    { type: 'divider' },
    hasAccess('/n8n-settings') && { path: '/n8n-settings', icon: <Webhook size={16} />, label: 'Outgoing Webhooks' },
    { type: 'divider' },
    hasAccess('/admin-settings') && { path: '/admin-settings', icon: <SlidersHorizontal size={16} />, label: 'Admin Settings' },
    { type: 'divider' },
    hasAccess('/build-center') && { path: '/build-center', icon: <Cpu size={16} />, label: 'App Compiler' }
  ].filter(Boolean);

  return (
    <nav className="border-b border-slate-200 bg-white sticky top-0 z-[99998]">
      <div className="flex h-12 items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">M</div>
            <span className="font-bold text-lg text-slate-900 tracking-tight">MANDOR</span>
          </Link>
          <div className="hidden lg:flex items-center gap-1">
            <Link to="/" className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${location.pathname === '/' ? 'bg-emerald-50 text-emerald-600' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>
              <LayoutDashboard size={16} /> Home
            </Link>
            <Link to="/store" className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${location.pathname === '/store' ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>
              <ShoppingBag size={16} /> App Store
            </Link>
            {appItems.length > 0 && (
              <NavDropdown 
                title="Apps" 
                icon={<Layers size={16} />}
                items={appItems} 
                alwaysShowTitle={true}
                menuWidth="w-64"
              />
            )}
            {plmItems.length > 0 && <NavDropdown title="PLM" items={plmItems} />}
            {shopFloorItems.length > 0 && <NavDropdown title="Shop Floor" items={shopFloorItems} />}
            {visionItems.length > 0 && <NavDropdown title="Vision" items={visionItems} />}
            {analyticsItems.length > 0 && <NavDropdown title="Analytics" items={analyticsItems} />}
            {logicItems.length > 0 && (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setIsOpen(!isOpen)}
                  className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded transition-colors ${isLogicActive ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                >
                  <Cpu size={16} />
                  Logic
                  <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                {isOpen && (
                  <div className="absolute top-full left-0 min-w-56 bg-white border border-slate-200 rounded-lg shadow-md py-2 flex flex-col z-50">
                    {logicItems.map((item, idx) => {
                      if (item.type === 'dropdown' && item.items) {
                        return (
                          <div
                            key={idx}
                            className="relative"
                            onMouseEnter={() => setActiveSubmenu(idx)}
                            onMouseLeave={() => setActiveSubmenu(null)}
                          >
                            <div
                              className={`flex items-center justify-between px-4 py-3 text-sm font-semibold cursor-pointer border-l-4 border-transparent hover:bg-slate-50`}
                            >
                              <div className="flex items-center gap-2">
                                {item.icon}
                                {item.label}
                              </div>
                              <ChevronRight size={14} className="text-slate-400" />
                            </div>

                            {activeSubmenu === idx && (
                              <div className="absolute left-full top-0 min-w-48 bg-white border border-slate-200 rounded-lg shadow-md py-2 ml-1">
                                {item.items.map((subItem, subIdx) => {
                                  if (subItem.type === 'divider') {
                                    return <div key={subIdx} className="h-px bg-slate-200 my-1" />;
                                  }
                                  const isSubItemActive = location.pathname === subItem.path;
                                  return (
                                    <Link
                                      key={subIdx}
                                      to={subItem.path}
                                      onClick={() => { setIsOpen(false); setActiveSubmenu(null); }}
                                      className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold transition-colors border-l-4 ${isSubItemActive ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-transparent text-slate-800 hover:bg-slate-50'}`}
                                    >
                                      {subItem.icon}
                                      {subItem.label}
                                    </Link>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      }
                      return null;
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {consoleItems.length > 0 && <NavDropdown title="Console" items={consoleItems} />}
          {systemItems.length > 0 && <NavDropdown title="System" items={systemItems} />}
          <SystemStatusDropdown />
          <div className="w-px h-6 bg-slate-200 mx-2" />
          <div className="flex items-center gap-4 pl-1">
            <div className="flex items-center gap-2 text-slate-900 text-[0.85rem] font-semibold">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">{user?.name?.charAt(0) || 'U'}</div>
              <span>{user?.name || 'User'}</span>
            </div>
            <button onClick={async () => { await logout(); setUser(null); window.location.href = '/'; }} className="bg-transparent border border-slate-300 text-slate-500 px-3 py-1.5 rounded-md text-[0.8rem] font-semibold hover:bg-red-50 hover:border-red-500 hover:text-red-500 transition-colors">
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}




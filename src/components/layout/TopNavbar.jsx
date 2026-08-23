import { Link, useLocation } from 'react-router-dom';
import {
  Settings, Zap, Camera, Cpu, Database, Link2, Variable,
  BarChart3, BarChart2, Monitor, MapPin, Radio, Tv, Activity, Eye, BrainCircuit,
  SlidersHorizontal, Users, ShoppingBag, AppWindow, Folder, Volume2,
  FileCode, Webhook, Play, Layout, FileText, PieChart, Terminal, Bot, Clock,
  ClipboardCheck, FileSpreadsheet, Boxes, LayoutDashboard, FolderArchive
} from 'lucide-react';
import { Toaster } from 'react-hot-toast';

import { useGlobalStore } from '../../store/useGlobalStore.js';
import { hasAccess as checkRoleAccess } from '../../utils/roleAccess.js';
import { logout } from '../../utils/auth.js';

import NavDropdown from './NavDropdown.jsx';
import SystemStatusDropdown from './SystemStatusDropdown.jsx';

export default function TopNavbar() {
  const location = useLocation();
  const user = useGlobalStore((state) => state.user);
  const setUser = useGlobalStore((state) => state.setUser);
  const isOperator = useGlobalStore((state) => state.getIsOperator());
  
  const isOperatorRoute = location.pathname.startsWith('/player') || location.pathname.startsWith('/terminal');

  const hasAccess = (path) => checkRoleAccess(user, path);

  if (isOperatorRoute || isOperator) return null;

  const appItems = [
    hasAccess('/builder') && { path: '/builder', icon: <Layout size={16} />, label: 'App Builder' },
    hasAccess('/file-explorer') && { path: '/file-explorer', icon: <Folder size={16} />, label: 'File Explorer' },
    hasAccess('/app-management') && { path: '/app-management', icon: <AppWindow size={16} />, label: 'App Management' },
    hasAccess('/tables') && { path: '/tables', icon: <Database size={16} />, label: 'Tables' },
    hasAccess('/connectors') && { path: '/connectors', icon: <Link2 size={16} />, label: 'Connectors' },
    hasAccess('/mcp-server') && { path: '/mcp-server', icon: <BrainCircuit size={16} />, label: 'Mandor MCP Server' },
    hasAccess('/variables') && { path: '/variables', icon: <Variable size={16} />, label: 'Variables' }
  ].filter(Boolean);

  const drawingItems = [
    hasAccess('/checksheets') && { path: '/checksheets', icon: <FolderArchive size={16} className="text-purple-500" />, label: 'Checksheet Management (ISO 9001)' },
    hasAccess('/inspector-designer') && { path: '/inspector-designer', icon: <FileCode size={16} className="text-indigo-500" />, label: 'Inspector Designer Studio' },
    hasAccess('/drawing-checksheet') && { path: '/drawing-checksheet', icon: <ClipboardCheck size={16} className="text-emerald-500" />, label: 'Digital Check Sheet' }
  ].filter(Boolean);

  const shopFloorItems = [
    hasAccess('/stations') && { path: '/stations', icon: <MapPin size={16} />, label: 'Stations' },
    hasAccess('/display-devices') && { path: '/display-devices', icon: <Tv size={16} />, label: 'Interfaces' },
    hasAccess('/machines') && { path: '/machines', icon: <Cpu size={16} />, label: 'Machines' },
    hasAccess('/edge-devices') && { path: '/edge-devices', icon: <Activity size={16} />, label: 'Edge Devices' },
    { type: 'divider' },
    hasAccess('/plc-settings') && { path: '/plc-settings', icon: <SlidersHorizontal size={16} />, label: 'PLC Settings' },
    { path: '/nodered', icon: <Terminal size={16} className="text-red-500" />, label: 'Node-RED Dashboard' }
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

  const logicItems = [
    hasAccess('/automations') && { path: '/automations', icon: <Cpu size={16} />, label: 'Automations' },
    hasAccess('/functions') && { path: '/functions', icon: <Boxes size={16} />, label: 'Functions' }
  ].filter(Boolean);

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
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
              M
            </div>
            <span className="font-bold text-lg text-slate-900 tracking-tight">MANDOR</span>
          </Link>

          {/* Core App Navigation Tabs */}
          <div className="hidden lg:flex items-center gap-1">
            <Link
              to="/"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                location.pathname === '/' ? 'bg-emerald-50 text-emerald-600' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <LayoutDashboard size={16} />
              Home
            </Link>

            {hasAccess('/store') && (
              <Link
                to="/store"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                  location.pathname === '/store' ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                App Store
              </Link>
            )}

            {appItems.length > 0 && <NavDropdown title="Apps" pathMatches={['/builder', '/file-explorer', '/app-management', '/tables', '/connectors', '/variables', '/mcp-server']} items={appItems} />}
            {drawingItems.length > 0 && <NavDropdown title="Drawings & QA" pathMatches={['/checksheets', '/checksheet-management', '/checksheet-manager', '/drawing-checksheet', '/qa-checksheet', '/inspector-designer']} items={drawingItems} />}
          {shopFloorItems.length > 0 && <NavDropdown title="Shop Floor" pathMatches={['/stations', '/display-devices', '/machines', '/edge-devices', '/plc-settings', '/nodered']} items={shopFloorItems} />}
          {visionItems.length > 0 && <NavDropdown title="Vision" pathMatches={['/vision', '/vision/calibration', '/vision/quickbuild']} items={visionItems} />}
          {analyticsItems.length > 0 && <NavDropdown title="Analytics" pathMatches={['/bi', '/reports', '/shift-handoff']} items={analyticsItems} />}
          {logicItems.length > 0 && <NavDropdown title="Logic" pathMatches={['/automations', '/functions']} items={logicItems} />}
        </div>
      </div>

      {/* RIGHT SECTION */}
      <div className="flex items-center gap-2">
        {consoleItems.length > 0 && <NavDropdown title="Console" pathMatches={['/player', '/terminal']} items={consoleItems} />}
        {systemItems.length > 0 && <NavDropdown title="System" pathMatches={['/users', '/ai-settings', '/supabase-settings', '/n8n-settings', '/build-center', '/admin-settings']} items={systemItems} />}

        <Toaster position="top-right" />

        <SystemStatusDropdown />

        <div className="w-px h-6 bg-slate-200 mx-2" />

        {/* USER MENU */}
        <div className="flex items-center gap-4 pl-1">
          <div className="flex items-center gap-2 text-slate-900 text-[0.85rem] font-semibold">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <span>{user?.name || 'User'}</span>
          </div>
          <button
            onClick={() => {
              logout();
              setUser(null);
            }}
            className="bg-transparent border border-slate-300 text-slate-500 px-3 py-1.5 rounded-md text-[0.8rem] font-semibold hover:bg-red-50 hover:border-red-500 hover:text-red-500 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  </nav>
);
}

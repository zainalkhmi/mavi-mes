import { useState, useRef, useEffect } from 'react';
import { Activity, Database, BrainCircuit, Play, StopCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSystemStatus } from '../../hooks/useSystemStatus.jsx';
import { useGlobalStore } from '../../store/useGlobalStore.js';
import { hasAccess as checkRoleAccess } from '../../utils/roleAccess.js';

export default function SystemStatusDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  
  const user = useGlobalStore((state) => state.user);
  const isOperator = useGlobalStore((state) => state.getIsOperator());
  // Determine if it's an operator route could be tricky here without location, 
  // but if the component is hidden on operator routes (in TopNavbar), we can pass false or just use hook defaults
  const {
    pythonActive,
    supabaseActive,
    aiActive,
    statusLoading,
    updateAllStatuses,
    handleTogglePythonServer
  } = useSystemStatus({ user, isOperatorRoute: false, isOperator });

  const hasAccess = (path) => checkRoleAccess(user, path);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) updateAllStatuses();
        }}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 hover:border-slate-400 transition-colors shadow-sm outline-none h-8"
      >
        <Activity size={14} className={`text-slate-600 ${statusLoading ? 'animate-pulse' : ''}`} />
        <span className="text-[0.75rem] font-bold text-slate-600">System</span>
        
        <div className="flex gap-1 items-center">
          <span className={`w-1.5 h-1.5 rounded-full ${pythonActive ? 'bg-emerald-500 shadow-[0_0_4px_#10b981]' : 'bg-red-500 shadow-[0_0_4px_#ef4444]'}`} title="Python API" />
          <span className={`w-1.5 h-1.5 rounded-full ${supabaseActive ? 'bg-emerald-500 shadow-[0_0_4px_#10b981]' : 'bg-red-500 shadow-[0_0_4px_#ef4444]'}`} title="Supabase DB" />
          <span className={`w-1.5 h-1.5 rounded-full ${aiActive.active ? 'bg-emerald-500 shadow-[0_0_4px_#10b981]' : 'bg-red-500 shadow-[0_0_4px_#ef4444]'}`} title="AI Assistant" />
        </div>
      </button>

      {isOpen && (
        <div className="absolute top-[calc(100%+8px)] right-0 bg-white/95 backdrop-blur-md min-w-[290px] rounded-xl shadow-lg border border-slate-200 p-4 z-[1001] flex flex-col gap-3">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <span className="text-[0.8rem] font-extrabold text-slate-900">System Control & Connections</span>
            <button
              onClick={updateAllStatuses}
              disabled={statusLoading}
              className="border-none bg-transparent text-blue-600 text-[0.7rem] font-bold cursor-pointer outline-none"
            >
              {statusLoading ? 'Checking...' : 'Refresh Status'}
            </button>
          </div>

          {/* Python Sidecar */}
          <div className="flex gap-2.5 items-start">
            <div className={`p-1.5 rounded-lg flex items-center ${pythonActive ? 'bg-emerald-50 text-emerald-500' : 'bg-red-50 text-red-500'}`}>
              <Activity size={16} />
            </div>
            <div className="flex-1 flex flex-col">
              <div className="flex justify-between items-center">
                <span className="text-[0.75rem] font-bold text-slate-700">Python Sidecar API</span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleTogglePythonServer}
                    title={pythonActive ? "Stop Python Server" : "Start Python Server"}
                    className={`w-5 h-5 flex items-center justify-center rounded transition-colors ${pythonActive ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200'}`}
                  >
                    {pythonActive ? <StopCircle size={12} /> : <Play size={12} className="fill-emerald-600" />}
                  </button>
                  <span className={`text-[0.62rem] font-extrabold px-1.5 py-[1px] rounded-full ${pythonActive ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                    {pythonActive ? 'ONLINE' : 'OFFLINE'}
                  </span>
                </div>
              </div>
              <span className="text-[0.65rem] text-slate-500 mt-[2px]">
                {pythonActive ? 'FastAPI & YOLOv8 service active on port 8000.' : 'FastAPI offline. Click Play to start or view guide.'}
              </span>
            </div>
          </div>

          {/* Supabase */}
          <div className="flex gap-2.5 items-start">
            <div className={`p-1.5 rounded-lg flex items-center ${supabaseActive ? 'bg-emerald-50 text-emerald-500' : 'bg-red-50 text-red-500'}`}>
              <Database size={16} />
            </div>
            <div className="flex-1 flex flex-col">
              <div className="flex justify-between items-center">
                <span className="text-[0.75rem] font-bold text-slate-700">Supabase Database</span>
                <span className={`text-[0.62rem] font-extrabold px-1.5 py-[1px] rounded-full ${supabaseActive ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                  {supabaseActive ? 'CONNECTED' : 'DISCONNECTED'}
                </span>
              </div>
              <span className="text-[0.65rem] text-slate-500 mt-[2px]">
                {supabaseActive ? 'Supabase tables and cloud storage synced.' : 'Database offline. Using localStorage fallback.'}
              </span>
            </div>
          </div>

          {/* AI Assistant */}
          <div className="flex gap-2.5 items-start">
            <div className={`p-1.5 rounded-lg flex items-center ${aiActive.active ? 'bg-emerald-50 text-emerald-500' : 'bg-red-50 text-red-500'}`}>
              <BrainCircuit size={16} />
            </div>
            <div className="flex-1 flex flex-col">
              <div className="flex justify-between items-center">
                <span className="text-[0.75rem] font-bold text-slate-700">AI Assistant</span>
                <span className={`text-[0.62rem] font-extrabold px-1.5 py-[1px] rounded-full ${aiActive.active ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                  {aiActive.active ? 'ACTIVE' : 'INACTIVE'}
                </span>
              </div>
              <span className="text-[0.65rem] text-slate-500 mt-[2px]">
                {aiActive.active ? `${aiActive.provider} (${aiActive.model}) configured.` : 'No AI provider config found. Setup in System.'}
              </span>
            </div>
          </div>

          <div className="h-px bg-slate-100 my-1" />

          {/* Nav Shortcuts */}
          <div className="flex gap-2">
            {hasAccess('/supabase-settings') && (
              <Link
                to="/supabase-settings"
                onClick={() => setIsOpen(false)}
                className="flex-1 text-center py-1.5 text-[0.68rem] font-bold bg-slate-100 text-slate-600 rounded-md border border-slate-200"
              >
                Database Config
              </Link>
            )}
            {hasAccess('/ai-settings') && (
              <Link
                to="/ai-settings"
                onClick={() => setIsOpen(false)}
                className="flex-1 text-center py-1.5 text-[0.68rem] font-bold bg-blue-50 text-blue-600 rounded-md border border-blue-100"
              >
                AI Config
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

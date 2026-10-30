import { useState, useRef, useEffect } from 'react';
import { Activity, Database, BrainCircuit, Cpu, Play, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSystemStatus } from '../../hooks/useSystemStatus.jsx';
import { useGlobalStore } from '../../store/useGlobalStore.js';
import { hasAccess as checkRoleAccess } from '../../utils/roleAccess.js';

export default function SystemStatusDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  
  const user = useGlobalStore((state) => state.user);
  const isOperator = useGlobalStore((state) => state.getIsOperator());
  
  const {
    supabaseActive,
    aiActive,
    pythonActive,
    pythonStarting,
    autoRunPython,
    statusLoading,
    updateAllStatuses,
    handleTogglePythonServer,
    handleToggleAutoRun
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
          if (!isOpen) {
            updateAllStatuses();
            checkPythonStatus();
          }
        }}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 hover:border-slate-400 transition-colors shadow-sm outline-none h-8"
      >
        <Activity size={14} className={`text-slate-600 ${statusLoading ? 'animate-pulse' : ''}`} />
        <span className="text-[0.75rem] font-bold text-slate-600">System</span>
        
        <div className="flex gap-1 items-center">
          <span className={`w-1.5 h-1.5 rounded-full ${supabaseActive ? 'bg-emerald-500 shadow-[0_0_4px_#10b981]' : 'bg-red-500 shadow-[0_0_4px_#ef4444]'}`} title="Supabase DB" />
          <span className={`w-1.5 h-1.5 rounded-full ${aiActive.active ? 'bg-emerald-500 shadow-[0_0_4px_#10b981]' : 'bg-red-500 shadow-[0_0_4px_#ef4444]'}`} title="AI Assistant" />
          <span className={`w-1.5 h-1.5 rounded-full ${
            pythonActive ? 'bg-emerald-500 shadow-[0_0_4px_#10b981]' :
            pythonStarting ? 'bg-amber-500 shadow-[0_0_4px_#f59e0b]' :
            'bg-red-500 shadow-[0_0_4px_#ef4444]'
          }`} title={pythonActive ? "Python Vision Backend (:8000) ONLINE" : pythonStarting ? "Python Vision Backend STARTING..." : "Python Vision Backend (:8000) OFFLINE"} />
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

          {/* Python Vision & YOLO Backend */}
          <div className="flex gap-2.5 items-start">
            <div className={`p-1.5 rounded-lg flex items-center ${
              pythonActive ? 'bg-emerald-50 text-emerald-500' :
              pythonStarting ? 'bg-amber-50 text-amber-500' :
              'bg-red-50 text-red-500'
            }`}>
              <Cpu size={16} className={pythonStarting ? 'animate-pulse' : ''} />
            </div>
            <div className="flex-1 flex flex-col">
              <div className="flex justify-between items-center">
                <span className="text-[0.75rem] font-bold text-slate-700">Python Vision Backend</span>
                <span className={`text-[0.62rem] font-extrabold px-1.5 py-[1px] rounded-full ${
                  pythonActive ? 'bg-emerald-100 text-emerald-800' :
                  pythonStarting ? 'bg-amber-100 text-amber-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {pythonActive ? 'ONLINE (:8000)' : pythonStarting ? 'STARTING...' : 'OFFLINE'}
                </span>
              </div>
              <span className="text-[0.65rem] text-slate-500 mt-[2px]">
                {pythonActive 
                  ? 'FastAPI, OpenCV & YOLOv8 local inference ready.' 
                  : pythonStarting
                    ? 'Menjalankan server yolo_server.py di port 8000...'
                    : 'Server offline. Vision runs in JS simulation mode.'}
              </span>

              {/* Auto Run & Start Controls */}
              <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between gap-2">
                <label className="flex items-center gap-1.5 cursor-pointer text-[0.65rem] font-bold text-slate-600 select-none">
                  <input
                    type="checkbox"
                    checked={autoRunPython}
                    onChange={(e) => handleToggleAutoRun(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-blue-600 accent-blue-600 cursor-pointer"
                  />
                  <span>Auto-run jika offline</span>
                </label>

                {!pythonActive && (
                  <button
                    onClick={handleTogglePythonServer}
                    disabled={pythonStarting}
                    className={`px-2 py-0.5 rounded text-[0.65rem] font-bold flex items-center gap-1 transition-all ${
                      pythonStarting 
                        ? 'bg-amber-100 text-amber-700 cursor-not-allowed' 
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer'
                    }`}
                    title="Jalankan server Python yolo_server.py sekarang"
                  >
                    {pythonStarting ? (
                      <>
                        <RefreshCw size={10} className="animate-spin" />
                        <span>Memulai...</span>
                      </>
                    ) : (
                      <>
                        <Play size={9} fill="currentColor" />
                        <span>Nyalakan</span>
                      </>
                    )}
                  </button>
                )}
              </div>
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
            <Link
              to="/vision/quickbuild"
              onClick={() => setIsOpen(false)}
              className="flex-1 text-center py-1.5 text-[0.68rem] font-bold bg-purple-50 text-purple-600 rounded-md border border-purple-100"
            >
              Vision Studio
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

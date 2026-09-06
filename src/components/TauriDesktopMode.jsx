/**
 * TauriDesktopMode
 * Shows desktop-specific features when running in Tauri
 */

import React, { useState, useEffect } from 'react';
import { isTauri, TauriSystem, TauriAppProjects } from '../../utils/tauri';
import { Desktop, Monitor, FolderOpen, Save, Folder, File, Trash2, ExternalLink, Info } from 'lucide-react';

export default function TauriDesktopMode({ children }) {
  const [isDesktop, setIsDesktop] = useState(false);
  const [systemInfo, setSystemInfo] = useState(null);
  const [appDataDir, setAppDataDir] = useState(null);
  const [showInfo, setShowInfo] = useState(false);

  useEffect(() => {
    const checkTauri = async () => {
      const desktop = isTauri();
      setIsDesktop(desktop);

      if (desktop) {
        try {
          const [sysInfo, dataDir] = await Promise.all([
            TauriSystem.getSystemInfo(),
            TauriSystem.getAppDataDir()
          ]);
          setSystemInfo(sysInfo);
          setAppDataDir(dataDir);
        } catch (e) {
          console.warn('Failed to get system info:', e);
        }
      }
    };

    checkTauri();
  }, []);

  if (!isDesktop) {
    // Browser mode - render children normally
    return <>{children}</>;
  }

  // Desktop mode - show Tauri-specific UI
  return (
    <div className="tauri-desktop-wrapper">
      {/* Tauri Desktop Header */}
      <div
        className="fixed top-0 left-0 right-0 z-50 h-8 flex items-center justify-between px-3"
        style={{
          backgroundColor: '#1a1a2e',
          WebkitAppRegion: 'drag' as any, // For window dragging
        }}
      >
        <div className="flex items-center gap-2">
          <Desktop size={14} className="text-emerald-400" />
          <span className="text-xs text-white/80 font-medium">Mavi Builder</span>
          {systemInfo && (
            <span className="text-xs text-white/40">
              {systemInfo.os} • {systemInfo.arch}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1" style={{ WebkitAppRegion: 'no-drag' as any }}>
          <button
            onClick={() => setShowInfo(!showInfo)}
            className="p-1.5 rounded hover:bg-white/10 text-white/60 hover:text-white transition-colors"
            title="App Info"
          >
            <Info size={14} />
          </button>
        </div>
      </div>

      {/* Info Panel */}
      {showInfo && (
        <div
          className="fixed top-8 right-3 z-50 w-80 bg-slate-900 rounded-xl border border-slate-700 shadow-2xl p-4"
        >
          <div className="flex items-center gap-2 mb-4">
            <Desktop size={20} className="text-emerald-400" />
            <h3 className="text-white font-bold">Mavi Builder Desktop</h3>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">Platform</span>
              <span className="text-white">{systemInfo?.os}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Architecture</span>
              <span className="text-white">{systemInfo?.arch}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">App Data</span>
              <span className="text-white text-xs break-all">{appDataDir}</span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-700">
            <p className="text-xs text-slate-500">
              Running in Tauri Desktop Mode with native file system access, serial communication, and system integration.
            </p>
          </div>

          <button
            onClick={() => setShowInfo(false)}
            className="mt-4 w-full py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500 transition-colors"
          >
            Close
          </button>
        </div>
      )}

      {/* Main Content - adjusted for header */}
      <div className="pt-8">
        {children}
      </div>

      {/* Tauri Desktop Status Bar */}
      <div
        className="fixed bottom-0 left-0 right-0 h-6 flex items-center justify-between px-3 text-xs"
        style={{
          backgroundColor: '#1a1a2e',
          borderTop: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="text-white/60">Desktop Mode</span>
        </div>
        <div className="flex items-center gap-3 text-white/40">
          <span>Projects: {appDataDir}</span>
        </div>
      </div>
    </div>
  );
}

// Hook for Tauri-specific features
export function useTauriFeatures() {
  const [isDesktop, setIsDesktop] = useState(false);
  const [systemInfo, setSystemInfo] = useState(null);

  useEffect(() => {
    const checkTauri = async () => {
      const desktop = isTauri();
      setIsDesktop(desktop);

      if (desktop) {
        try {
          const info = await TauriSystem.getSystemInfo();
          setSystemInfo(info);
        } catch (e) {
          console.warn('Failed to get system info:', e);
        }
      }
    };

    checkTauri();
  }, []);

  return { isDesktop, systemInfo };
}

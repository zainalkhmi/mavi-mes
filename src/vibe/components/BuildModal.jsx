import React, { useState, useEffect } from 'react';
import { X, Server, AlertTriangle, Download, Smartphone, Globe, Layers, Loader2, CheckCircle2 } from 'lucide-react';
import { buildService } from '../build/BuildService';
import toast from 'react-hot-toast';

export default function BuildModal({
  isOpen,
  onClose,
  projectFiles = {},
  appName = 'MaviCore App'
}) {
  const [bridgeStatus, setBridgeStatus] = useState('checking'); // 'checking' | 'online' | 'offline'
  const [buildType, setBuildType] = useState('apk'); // 'apk' | 'aab' | 'web'
  const [isBuilding, setIsBuilding] = useState(false);
  const [buildLogs, setBuildLogs] = useState([]);

  useEffect(() => {
    if (!isOpen) return;
    const check = async () => {
      setBridgeStatus('checking');
      const res = await buildService.checkStatus();
      setBridgeStatus(res.isOnline ? 'online' : 'offline');
    };
    check();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTriggerBuild = async () => {
    if (bridgeStatus !== 'online') {
      toast.error('Build service not connected! Jalankan "node build-bridge.js" di terminal.');
      return;
    }

    setIsBuilding(true);
    setBuildLogs(prev => [...prev, `[Sistem] Memulai proses compile ${buildType.toUpperCase()}...`]);

    try {
      await buildService.buildAndroidApk({
        projectFiles,
        appName,
        onLog: (text) => setBuildLogs(prev => [...prev, text]),
        onSuccess: (res) => {
          setIsBuilding(false);
          toast.success(res.message || 'Build berhasil!');
        },
        onError: (err) => {
          setIsBuilding(false);
          toast.error(err.message);
        }
      });
    } catch {
      setIsBuilding(false);
    }
  };

  const handleExportZip = async () => {
    try {
      await buildService.exportProjectZip(projectFiles, appName);
      toast.success('File ZIP proyek berhasil diunduh!');
    } catch (err) {
      toast.error('Gagal export ZIP: ' + err.message);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)',
      zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
    }}>
      <div style={{
        backgroundColor: '#0a0f1d', border: '1px solid #1e293b', borderRadius: '16px',
        width: '100%', maxWidth: '650px', maxHeight: '85vh', display: 'flex', flexDirection: 'column',
        boxShadow: '0 25px 60px -12px rgba(0,0,0,0.85)', overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px', borderBottom: '1px solid #1e293b',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#0f172a'
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#f8fafc' }}>
              App Compiler & Build Center
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: '#94a3b8' }}>
              Compile proyek MaviCore menjadi APK Android, AAB, atau Web bundle.
            </p>
          </div>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Bridge Status Notice */}
          <div style={{
            padding: '12px 16px', borderRadius: '10px',
            backgroundColor: bridgeStatus === 'online' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
            border: `1px solid ${bridgeStatus === 'online' ? '#059669' : '#dc2626'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {bridgeStatus === 'online' ? <Server size={18} color="#34d399" /> : <AlertTriangle size={18} color="#f87171" />}
              <div>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: bridgeStatus === 'online' ? '#34d399' : '#f87171' }}>
                  {bridgeStatus === 'online' ? 'Compiler Bridge: CONNECTED' : 'Build service not connected'}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                  {bridgeStatus === 'online' ? 'Build server lokal siap menerima tugas kompilasi' : 'Jalankan "node build-bridge.js" untuk mengaktifkan daemon compiler lokal'}
                </div>
              </div>
            </div>
          </div>

          {/* Target selection */}
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '8px' }}>
              Target Kompilasi
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              {[
                { id: 'apk', label: 'Build APK', desc: 'Android Package', icon: Smartphone },
                { id: 'aab', label: 'Build AAB', desc: 'Google Play Bundle', icon: Smartphone },
                { id: 'web', label: 'Build Web', desc: 'Production Dist', icon: Globe }
              ].map(t => {
                const Icon = t.icon;
                const isSel = buildType === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setBuildType(t.id)}
                    style={{
                      padding: '12px', borderRadius: '10px',
                      backgroundColor: isSel ? 'rgba(14,165,233,0.15)' : '#0f172a',
                      border: `1px solid ${isSel ? '#38bdf8' : '#1e293b'}`,
                      color: isSel ? '#38bdf8' : '#cbd5e1',
                      cursor: 'pointer', textAlign: 'left'
                    }}
                  >
                    <Icon size={16} style={{ marginBottom: '6px' }} />
                    <div style={{ fontSize: '0.82rem', fontWeight: 700 }}>{t.label}</div>
                    <div style={{ fontSize: '0.68rem', color: '#64748b' }}>{t.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Logs viewer if building */}
          {buildLogs.length > 0 && (
            <div style={{ backgroundColor: '#020617', border: '1px solid #1e293b', borderRadius: '10px', padding: '12px', maxHeight: '140px', overflowY: 'auto', fontFamily: 'monospace', fontSize: '0.72rem', color: '#cbd5e1' }}>
              {buildLogs.map((log, i) => (
                <div key={i}>{log}</div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 20px', borderTop: '1px solid #1e293b', backgroundColor: '#0f172a',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <button
            type="button"
            onClick={handleExportZip}
            style={{
              padding: '8px 16px', borderRadius: '8px', backgroundColor: '#1e293b',
              border: '1px solid #334155', color: '#cbd5e1', fontSize: '0.78rem', fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer'
            }}
          >
            <Download size={14} />
            <span>Export ZIP Proyek</span>
          </button>

          <button
            type="button"
            disabled={isBuilding}
            onClick={handleTriggerBuild}
            style={{
              padding: '8px 20px', borderRadius: '8px',
              backgroundColor: bridgeStatus === 'online' ? '#2563eb' : '#334155',
              border: 'none', color: '#fff', fontSize: '0.82rem', fontWeight: 700,
              display: 'flex', alignItems: 'center', gap: '6px',
              cursor: isBuilding ? 'not-allowed' : 'pointer'
            }}
          >
            {isBuilding ? <Loader2 size={14} className="animate-spin" /> : null}
            <span>{isBuilding ? 'Sedang Kompilasi...' : `Kompilasi ${buildType.toUpperCase()}`}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

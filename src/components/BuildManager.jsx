import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Download, Play, RefreshCw, Cpu, Server, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

const BuildManager = () => {
  const [bridgeStatus, setBridgeStatus] = useState('checking'); // 'checking', 'online', 'offline'
  const [buildStatus, setBuildStatus] = useState('idle'); // 'idle', 'building', 'success', 'failed'
  const [logs, setLogs] = useState([]);
  const [exeName, setExeName] = useState('');
  const terminalEndRef = useRef(null);
  
  const BRIDGE_URL = 'http://localhost:3010';

  const checkBridgeStatus = async () => {
    try {
      const response = await fetch(`${BRIDGE_URL}/status`);
      if (response.ok) {
        const data = await response.json();
        setBridgeStatus('online');
        if (data.isBuilding) {
          setBuildStatus('building');
        }
      } else {
        setBridgeStatus('offline');
      }
    } catch (error) {
      setBridgeStatus('offline');
    }
  };

  useEffect(() => {
    checkBridgeStatus();
    // Poll bridge status every 5 seconds
    const interval = setInterval(checkBridgeStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Auto-scroll terminal to bottom when logs update
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const triggerBuild = () => {
    if (buildStatus === 'building') return;

    setBuildStatus('building');
    setLogs([]);
    toast.loading('Mulai membangun aplikasi desktop. Silakan pantau log kompilasi.', { id: 'build-toast' });

    const eventSource = new EventSource(`${BRIDGE_URL}/build`, {
      // Connect to build endpoint which streams logs
      withCredentials: false
    });

    eventSource.addEventListener('status', (e) => {
      const data = JSON.parse(e.data);
      setLogs((prev) => [...prev, `[SISTEM] ${data.message}`]);
    });

    eventSource.addEventListener('log', (e) => {
      const data = JSON.parse(e.data);
      setLogs((prev) => [...prev, data.text]);
    });

    eventSource.addEventListener('success', (e) => {
      const data = JSON.parse(e.data);
      setBuildStatus('success');
      setExeName(data.exeName);
      toast.success('Build berhasil! File installer siap diunduh.', { id: 'build-toast' });
      eventSource.close();
    });

    eventSource.addEventListener('failed', (e) => {
      const data = JSON.parse(e.data);
      setBuildStatus('failed');
      setLogs((prev) => [...prev, `\n[ERROR] ${data.message}`]);
      toast.error('Build gagal. Periksa log konsol untuk detail kesalahan.', { id: 'build-toast' });
      eventSource.close();
    });

    eventSource.onerror = (err) => {
      console.error('SSE Error:', err);
      // Don't mark failed instantly if it's just a routine closing
      if (buildStatus === 'building') {
        setBuildStatus('failed');
        setLogs((prev) => [...prev, '\n[ERROR] Koneksi terputus dari compiler bridge.']);
        toast.error('Koneksi terputus dari compiler bridge.', { id: 'build-toast' });
      }
      eventSource.close();
    };
  };

  return (
    <div style={{ padding: '30px', maxWidth: '1200px', margin: '0 auto', fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>App Compiler Center</h2>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '4px' }}>
            Bangun installer desktop EXE Windows dan APK Android secara langsung dari panel admin.
          </p>
        </div>

        {/* Bridge Status Indicator */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 12px',
          borderRadius: '20px',
          backgroundColor: bridgeStatus === 'online' ? '#ecfdf5' : '#fef2f2',
          border: `1px solid ${bridgeStatus === 'online' ? '#a7f3d0' : '#fca5a5'}`,
          fontSize: '0.8rem',
          fontWeight: 700,
          color: bridgeStatus === 'online' ? '#059669' : '#dc2626'
        }}>
          {bridgeStatus === 'online' ? <Server size={14} /> : <AlertTriangle size={14} />}
          Compiler Bridge: {bridgeStatus === 'online' ? 'CONNECTED' : 'OFFLINE'}
        </div>
      </div>

      {bridgeStatus === 'offline' ? (
        /* Setup / Offline Warning */
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          padding: '32px',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
          textAlign: 'center',
          maxWidth: '650px',
          margin: '40px auto'
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: '#fffbeb',
            color: '#d97706',
            marginBottom: '16px'
          }}>
            <Server size={32} />
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b', marginBottom: '12px' }}>Compiler Bridge Belum Aktif</h3>
          <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '24px' }}>
            Untuk memicu proses compile `.exe` dari web browser, Anda perlu mengaktifkan server build lokal di komputer tempat aplikasi dijalankan.
          </p>

          <div style={{ textAlign: 'left', backgroundColor: '#0f172a', padding: '16px', borderRadius: '8px', marginBottom: '24px', fontFamily: 'monospace', fontSize: '0.85rem' }}>
            <span style={{ color: '#38bdf8' }}># Buka Terminal baru di folder proyek mandor-core lalu ketik:</span>
            <div style={{ color: '#f8fafc', marginTop: '8px', userSelect: 'all' }}>node build-bridge.js</div>
          </div>

          <button 
            onClick={checkBridgeStatus}
            style={{
              padding: '10px 20px',
              backgroundColor: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <RefreshCw size={16} /> Cek Ulang Koneksi
          </button>
        </div>
      ) : (
        /* Compiler Dashboard */
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
          
          {/* Settings Panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Windows Compilation Card */}
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              padding: '24px',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ backgroundColor: '#eff6ff', color: '#2563eb', padding: '8px', borderRadius: '8px' }}>
                  <Cpu size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#1e293b', margin: 0 }}>Windows Platform</h3>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Tauri Native Executable</span>
                </div>
              </div>

              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '12px', fontSize: '0.8rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>App Identifier:</span>
                  <strong style={{ fontFamily: 'monospace' }}>com.mandor.mes</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>App Version:</span>
                  <strong>0.1.0</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Installer Target:</span>
                  <strong>NSIS (.exe), WiX (.msi)</strong>
                </div>
              </div>

              {buildStatus === 'success' && (
                <div style={{
                  padding: '12px',
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  color: '#15803d',
                  fontSize: '0.8rem',
                  fontWeight: 600
                }}>
                  <ShieldCheck size={18} />
                  Kompilasi selesai & terverifikasi aman!
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
                <button
                  onClick={triggerBuild}
                  disabled={buildStatus === 'building'}
                  style={{
                    padding: '12px',
                    backgroundColor: buildStatus === 'building' ? '#94a3b8' : '#2563eb',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 700,
                    cursor: buildStatus === 'building' ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    fontSize: '0.85rem',
                    boxShadow: '0 2px 4px rgba(37,99,235,0.1)'
                  }}
                >
                  <Play size={16} /> {buildStatus === 'building' ? 'Membangun...' : 'Mulai Compile Windows App'}
                </button>

                {buildStatus === 'success' && (
                  <>
                    <a
                      href={`${BRIDGE_URL}/download/exe`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        padding: '12px',
                        backgroundColor: '#10b981',
                        color: 'white',
                        textDecoration: 'none',
                        textAlign: 'center',
                        borderRadius: '8px',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px',
                        fontSize: '0.85rem',
                        boxShadow: '0 2px 4px rgba(16,185,129,0.1)'
                      }}
                    >
                      <Download size={16} /> Unduh Setup Installer (.exe)
                    </a>
                    <a
                      href={`${BRIDGE_URL}/download/msi`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        padding: '12px',
                        backgroundColor: '#ffffff',
                        border: '1px solid #10b981',
                        color: '#10b981',
                        textDecoration: 'none',
                        textAlign: 'center',
                        borderRadius: '8px',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px',
                        fontSize: '0.85rem'
                      }}
                    >
                      <Download size={16} /> Unduh Paket MSI (.msi)
                    </a>
                  </>
                )}
              </div>
            </div>

            {/* Android Notice Card */}
            <div style={{
              backgroundColor: '#f8fafc',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              padding: '20px',
              fontSize: '0.8rem',
              color: '#64748b',
              lineHeight: '1.5'
            }}>
              <h4 style={{ color: '#475569', fontWeight: 800, margin: '0 0 8px 0' }}>💡 Info Tambahan Android</h4>
              Untuk membuat build Android (.apk) menggunakan jembatan lokal, konfigurasikan Android SDK Manager di komputer Anda terlebih dahulu seperti tertulis pada berkas panduan.
            </div>

          </div>

          {/* Logs Terminal Panel */}
          <div style={{
            backgroundColor: '#0f172a',
            borderRadius: '12px',
            border: '1px solid #1e293b',
            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
            display: 'flex',
            flexDirection: 'column',
            height: '520px',
            overflow: 'hidden'
          }}>
            {/* Terminal Header */}
            <div style={{
              backgroundColor: '#1e293b',
              padding: '12px 20px',
              borderBottom: '1px solid #334155',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8', fontSize: '0.8rem', fontWeight: 600 }}>
                <Terminal size={14} color="#38bdf8" />
                Live Build Console Output
              </div>
              {buildStatus === 'building' && (
                <div style={{ display: 'flex', gap: '4px' }}>
                  <span className="animate-ping" style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ef4444' }}></span>
                  <span style={{ fontSize: '0.7rem', color: '#f87171', fontWeight: 800 }}>COMPILING...</span>
                </div>
              )}
            </div>

            {/* Logs Window */}
            <div style={{
              flex: 1,
              padding: '20px',
              overflowY: 'auto',
              fontFamily: "'Courier New', Courier, monospace",
              fontSize: '0.8rem',
              lineHeight: '1.6',
              color: '#38bdf8',
              backgroundColor: '#0f172a',
              whiteSpace: 'pre-wrap'
            }}>
              {logs.length === 0 ? (
                <div style={{ color: '#64748b', fontStyle: 'italic', textAlign: 'center', marginTop: '150px' }}>
                  Console siap. Klik "Mulai Compile Windows App" untuk memulai proses packaging.
                </div>
              ) : (
                logs.map((log, index) => (
                  <div key={index} style={{
                    color: log.startsWith('[SISTEM]') ? '#34d399' : log.includes('error') || log.includes('ERROR') ? '#f87171' : '#f8fafc'
                  }}>
                    {log}
                  </div>
                ))
              )}
              <div ref={terminalEndRef} />
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

export default BuildManager;

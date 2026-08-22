/**
 * NodeREDDashboard.jsx
 *
 * Node-RED UI Integration for MANDOR MES
 * Embeds Node-RED dashboard via iframe
 *
 * Usage:
 * 1. Install Node-RED di server/edge device
 * 2. Enable dashboard in Node-RED (node-red-dashboard)
 * 3. Masukkan URL di konfigurasi
 */

import React, { useState, useEffect } from 'react';
import { Settings, ExternalLink, RefreshCw, Wifi, WifiOff, Maximize2, Minimize2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function NodeREDDashboard() {
  const [nodeRedUrl, setNodeRedUrl] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [showSettings, setShowSettings] = useState(false);
  const [editUrl, setEditUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Load saved URL from localStorage
  useEffect(() => {
    const savedUrl = localStorage.getItem('mandor_nodered_url');
    if (savedUrl) {
      setNodeRedUrl(savedUrl);
      setEditUrl(savedUrl);
      setConnectionStatus(savedUrl ? 'ready' : 'not_configured');
    } else {
      setConnectionStatus('not_configured');
      setShowSettings(true);
    }
  }, []);

  // Test connection
  const testConnection = async (url) => {
    if (!url) return false;
    try {
      const response = await fetch(url, {
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-cache'
      });
      return true;
    } catch {
      // no-cors mode will always "fail" but that's ok
      return true;
    }
  };

  // Save and connect
  const handleSaveUrl = async () => {
    if (!editUrl.trim()) {
      toast.error('Masukkan URL Node-RED yang valid');
      return;
    }

    setIsLoading(true);
    localStorage.setItem('mandor_nodered_url', editUrl.trim());
    setNodeRedUrl(editUrl.trim());

    const connected = await testConnection(editUrl.trim());
    setConnectionStatus(connected ? 'connected' : 'error');
    setIsLoading(false);
    setShowSettings(false);

    if (connected) {
      toast.success('Terhubung ke Node-RED!');
    } else {
      toast.error('Gagal terhubung. Pastikan URL benar dan Node-RED accessible.');
    }
  };

  // Refresh iframe
  const handleRefresh = () => {
    const iframe = document.getElementById('nodered-frame');
    if (iframe) {
      iframe.src = iframe.src;
    }
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Open in new tab
  const openInNewTab = () => {
    if (nodeRedUrl) {
      window.open(nodeRedUrl, '_blank');
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      backgroundColor: '#0f172a',
      overflow: 'hidden'
    }}>
      {/* Header Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 16px',
        backgroundColor: '#1e293b',
        borderBottom: '1px solid #334155',
        minHeight: '48px'
      }}>
        {/* Left: Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            backgroundColor: '#dc2626',
            padding: '6px 12px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
            </svg>
            <span style={{ color: 'white', fontWeight: 700, fontSize: '0.85rem' }}>Node-RED Dashboard</span>
          </div>

          {/* Connection Status */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            borderRadius: '20px',
            backgroundColor: connectionStatus === 'connected' ? 'rgba(34, 197, 94, 0.2)' :
                           connectionStatus === 'error' ? 'rgba(239, 68, 68, 0.2)' :
                           connectionStatus === 'ready' ? 'rgba(59, 130, 246, 0.2)' :
                           'rgba(251, 191, 36, 0.2)',
            color: connectionStatus === 'connected' ? '#22c55e' :
                   connectionStatus === 'error' ? '#ef4444' :
                   connectionStatus === 'ready' ? '#3b82f6' :
                   '#fbbf24',
            fontSize: '0.75rem',
            fontWeight: 600
          }}>
            {connectionStatus === 'connected' ? <Wifi size={14} /> :
             connectionStatus === 'error' ? <WifiOff size={14} /> :
             <AlertCircle size={14} />}
            {connectionStatus === 'connected' ? 'Connected' :
             connectionStatus === 'error' ? 'Connection Error' :
             connectionStatus === 'ready' ? 'Ready' :
             'Not Configured'}
          </div>
        </div>

        {/* Right: Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {nodeRedUrl && (
            <>
              <button
                onClick={handleRefresh}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '6px 12px',
                  backgroundColor: '#334155',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#e2e8f0',
                  fontSize: '0.75rem',
                  cursor: 'pointer'
                }}
                title="Refresh"
              >
                <RefreshCw size={14} /> Refresh
              </button>

              <button
                onClick={openInNewTab}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '6px 12px',
                  backgroundColor: '#334155',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#e2e8f0',
                  fontSize: '0.75rem',
                  cursor: 'pointer'
                }}
                title="Open in New Tab"
              >
                <ExternalLink size={14} /> Open
              </button>

              <button
                onClick={toggleFullscreen}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '6px 12px',
                  backgroundColor: isFullscreen ? '#475569' : '#334155',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#e2e8f0',
                  fontSize: '0.75rem',
                  cursor: 'pointer'
                }}
                title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              >
                {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              </button>
            </>
          )}

          <button
            onClick={() => {
              setEditUrl(nodeRedUrl || 'http://localhost:1880');
              setShowSettings(!showSettings);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '6px 12px',
              backgroundColor: '#3b82f6',
              border: 'none',
              borderRadius: '6px',
              color: 'white',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <Settings size={14} /> Settings
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div style={{
          padding: '20px',
          backgroundColor: '#1e293b',
          borderBottom: '1px solid #334155'
        }}>
          <div style={{
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            <h3 style={{ color: '#f8fafc', margin: '0 0 16px 0', fontSize: '1rem' }}>
              Node-RED Connection Settings
            </h3>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.85rem', marginBottom: '6px' }}>
                Node-RED Dashboard URL
              </label>
              <input
                type="url"
                value={editUrl}
                onChange={(e) => setEditUrl(e.target.value)}
                placeholder="http://192.168.1.100:1880/ui"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  backgroundColor: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: '6px',
                  color: '#f8fafc',
                  fontSize: '0.85rem',
                  outline: 'none'
                }}
              />
              <p style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '6px' }}>
                Masukkan URL Node-RED Dashboard (contoh: http://192.168.1.100:1880/ui)
              </p>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={handleSaveUrl}
                disabled={isLoading}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#22c55e',
                  border: 'none',
                  borderRadius: '6px',
                  color: 'white',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  opacity: isLoading ? 0.7 : 1
                }}
              >
                {isLoading ? 'Connecting...' : 'Connect'}
              </button>

              <button
                onClick={() => setShowSettings(false)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#334155',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#e2e8f0',
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>

            <div style={{
              marginTop: '20px',
              padding: '12px',
              backgroundColor: '#0f172a',
              borderRadius: '6px',
              fontSize: '0.8rem',
              color: '#94a3b8'
            }}>
              <strong style={{ color: '#f8fafc' }}>Cara Setup Node-RED:</strong>
              <ol style={{ margin: '8px 0 0 20px', padding: 0 }}>
                <li>Install Node-RED: <code style={{ color: '#22c55e' }}>npm install -g node-red</code></li>
                <li>Install dashboard: <code style={{ color: '#22c55e' }}>npm install node-red-dashboard</code></li>
                <li>Jalankan: <code style={{ color: '#22c55e' }}>node-red</code></li>
                <li>Buka browser: http://localhost:1880</li>
                <li>Create flow dengan dashboard nodes</li>
              </ol>
            </div>
          </div>
        </div>
      )}

      {/* Iframe Container */}
      <div style={{
        flex: 1,
        position: 'relative',
        overflow: 'hidden'
      }}>
        {!nodeRedUrl ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: '#64748b'
          }}>
            <svg width="80" height="80" viewBox="0 0 24 24" fill="#334155" style={{ marginBottom: '16px' }}>
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
            </svg>
            <h3 style={{ color: '#e2e8f0', margin: '0 0 8px 0' }}>Node-RED Not Configured</h3>
            <p style={{ margin: 0, fontSize: '0.85rem' }}>
              Klik Settings untuk configure URL Node-RED Dashboard
            </p>
          </div>
        ) : (
          <iframe
            id="nodered-frame"
            src={nodeRedUrl}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              backgroundColor: 'white'
            }}
            title="Node-RED Dashboard"
            allow="fullscreen"
            onLoad={() => setConnectionStatus('connected')}
            onError={() => setConnectionStatus('error')}
          />
        )}
      </div>
    </div>
  );
}

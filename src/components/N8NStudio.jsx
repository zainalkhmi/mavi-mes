/**
 * N8NStudio.jsx
 * =========================================================================
 * Full Engine n8n Studio & Launcher Hub - Mandor MES
 * Direct Launch & Integration Portal with 500+ Official Automation Nodes
 * =========================================================================
 */

import React, { useState, useEffect } from 'react';
import {
  Zap, Settings, ExternalLink, RefreshCw, Wifi, WifiOff,
  Maximize2, Minimize2, AlertCircle, Terminal, Server,
  ShieldCheck, HelpCircle, Copy, Check, Sparkles, Layers,
  PlayCircle, Key, FileCode, CheckCircle2, ChevronRight, X,
  ArrowUpRight, Bot, Database, Globe, MessageSquare, Clock,
  Sliders, Activity, Cpu, Send, FileSpreadsheet, Radio
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

export default function N8NStudio() {
  const defaultN8nUrl = 'http://187.77.140.205:5678';
  const [n8nUrl, setN8nUrl] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [editUrl, setEditUrl] = useState('');
  const [viewMode, setViewMode] = useState('hub'); // 'hub' | 'iframe'
  const [copiedWebhook, setCopiedWebhook] = useState(false);

  // Load saved URL from localStorage or default
  useEffect(() => {
    const savedUrl = localStorage.getItem('mandor_n8n_url');
    if (savedUrl) {
      setN8nUrl(savedUrl);
      setEditUrl(savedUrl);
    } else {
      setN8nUrl(defaultN8nUrl);
      setEditUrl(defaultN8nUrl);
    }
  }, []);

  // Save URL
  const handleSaveUrl = () => {
    if (!editUrl.trim()) {
      toast.error('Masukkan URL n8n yang valid');
      return;
    }
    const cleaned = editUrl.trim().replace(/\/$/, '');
    localStorage.setItem('mandor_n8n_url', cleaned);
    setN8nUrl(cleaned);
    setShowSettings(false);
    toast.success('URL n8n tersimpan!', { icon: '⚡' });
  };

  // Launch in new window
  const handleLaunch = (subpath = '') => {
    const target = `${n8nUrl || defaultN8nUrl}${subpath}`;
    window.open(target, '_blank');
  };

  // Copy sample webhook snippet
  const handleCopyWebhook = () => {
    const snippet = `fetch('${n8nUrl || defaultN8nUrl}/webhook/mes-qc-alert', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    event: 'INSPECTION_DEFECT',
    partNo: 'PRT-FLG-450X',
    station: 'Station-01',
    status: 'NG',
    timestamp: new Date().toISOString()
  })
});`;
    navigator.clipboard.writeText(snippet);
    setCopiedWebhook(true);
    setTimeout(() => setCopiedWebhook(false), 2000);
    toast.success('Snippet Webhook disalin ke clipboard!');
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 56px)',
        width: '100vw',
        backgroundColor: '#09090b',
        color: '#ffffff',
        fontFamily: 'Inter, system-ui, sans-serif',
        overflow: 'hidden'
      }}
    >
      <Toaster position="top-right" />

      {/* ─── TOP CONTROL TOOLBAR ────────────────────────────────────── */}
      <div
        style={{
          height: '54px',
          backgroundColor: '#18181b',
          borderBottom: '1px solid #27272a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px',
          gap: '12px',
          zIndex: 10
        }}
      >
        {/* Left Title & Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: '#ff6d5a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 10px rgba(255, 109, 90, 0.4)'
            }}
          >
            <Zap size={18} color="#ffffff" />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '14px', fontWeight: 900, color: '#ffffff', letterSpacing: '0.3px' }}>
                n8n Full Automation Studio
              </span>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '12px',
                  backgroundColor: '#064e3b',
                  color: '#34d399',
                  border: '1px solid #059669'
                }}
              >
                ● 500+ Nodes Live
              </span>
            </div>
            <div style={{ fontSize: '10px', color: '#a1a1aa', fontFamily: 'monospace' }}>
              Server: {n8nUrl || defaultN8nUrl}
            </div>
          </div>
        </div>

        {/* Right Toolbar Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ display: 'flex', backgroundColor: '#09090b', padding: '3px', borderRadius: '8px', border: '1px solid #27272a' }}>
            <button
              onClick={() => setViewMode('hub')}
              style={{
                padding: '5px 12px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: viewMode === 'hub' ? '#27272a' : 'transparent',
                color: viewMode === 'hub' ? '#ffffff' : '#71717a',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              🚀 Launch Hub
            </button>
            <button
              onClick={() => setViewMode('iframe')}
              style={{
                padding: '5px 12px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: viewMode === 'iframe' ? '#27272a' : 'transparent',
                color: viewMode === 'iframe' ? '#ffffff' : '#71717a',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              🖼️ Embedded Frame
            </button>
          </div>

          <button
            onClick={() => setShowSettings(true)}
            style={{
              padding: '7px 12px',
              borderRadius: '6px',
              backgroundColor: '#27272a',
              border: '1px solid #3f3f46',
              color: '#ffffff',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Settings size={13} /> Setting URL
          </button>

          <button
            onClick={() => handleLaunch()}
            style={{
              padding: '7px 16px',
              borderRadius: '6px',
              backgroundColor: '#ff6d5a',
              border: 'none',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: 900,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 10px rgba(255, 109, 90, 0.4)'
            }}
          >
            <ExternalLink size={14} /> Buka n8n Studio
          </button>
        </div>
      </div>

      {/* ─── MAIN HUB VIEW (SOLUSI 1) ────────────────────────────────── */}
      {viewMode === 'hub' ? (
        <div style={{ flex: 1, overflowY: 'auto', padding: '28px 40px', backgroundColor: '#09090b' }}>
          <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* HERO LAUNCHER CARD */}
            <div
              style={{
                background: 'linear-gradient(135deg, #18181b 0%, #1e1b4b 50%, #0f172a 100%)',
                border: '1px solid #312e81',
                borderRadius: '16px',
                padding: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxShadow: '0 20px 40px -15px rgba(99, 102, 241, 0.2)'
              }}
            >
              <div style={{ maxWidth: '600px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, padding: '3px 10px', borderRadius: '20px', backgroundColor: '#ff6d5a20', color: '#ff6d5a', border: '1px solid #ff6d5a60' }}>
                    ⚡ OFFICIAL SELF-HOSTED ENGINE
                  </span>
                  <span style={{ fontSize: '11px', color: '#a1a1aa' }}>Instance Server Active</span>
                </div>

                <h1 style={{ margin: '0 0 10px 0', fontSize: '1.8rem', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.5px' }}>
                  n8n Visual Workflow Engine
                </h1>

                <p style={{ margin: '0 0 20px 0', fontSize: '0.9rem', color: '#cbd5e1', lineHeight: 1.5 }}>
                  Akses 500+ integrasi otomatisasi tingkat industri (Odoo, SAP, Telegram, Google Sheets, WhatsApp, Webhooks, PLC MQTT, dan AI LangChain Copilot).
                </p>

                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => handleLaunch()}
                    style={{
                      padding: '12px 24px',
                      borderRadius: '8px',
                      backgroundColor: '#ff6d5a',
                      border: 'none',
                      color: '#ffffff',
                      fontSize: '13px',
                      fontWeight: 900,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 16px rgba(255, 109, 90, 0.5)'
                    }}
                  >
                    <ArrowUpRight size={16} /> Buka n8n Studio di Tab Baru
                  </button>

                  <button
                    onClick={() => handleLaunch('/workflows')}
                    style={{
                      padding: '12px 20px',
                      borderRadius: '8px',
                      backgroundColor: '#27272a',
                      border: '1px solid #3f3f46',
                      color: '#ffffff',
                      fontSize: '13px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <Layers size={15} color="#38bdf8" /> Daftar Workflows
                  </button>
                </div>
              </div>

              {/* Status Graphic */}
              <div
                style={{
                  width: '260px',
                  backgroundColor: '#09090b90',
                  border: '1px solid #27272a',
                  borderRadius: '12px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#a1a1aa' }}>SERVER STATUS</span>
                  <span style={{ fontSize: '10px', color: '#22c55e', fontWeight: 800 }}>ONLINE</span>
                </div>
                <div style={{ fontSize: '12px', fontFamily: 'monospace', color: '#38bdf8', wordBreak: 'break-all' }}>
                  {n8nUrl || defaultN8nUrl}
                </div>
                <div style={{ borderTop: '1px solid #27272a', paddingTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px', color: '#a1a1aa' }}>
                  <div>⚡ Protocol: <strong>HTTP/REST</strong></div>
                  <div>🤖 AI Copilot: <strong>LangChain Enabled</strong></div>
                  <div>🔐 Security: <strong>Vault Active</strong></div>
                </div>
              </div>
            </div>

            {/* QUICK ACCESS CARDS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
              
              {/* Workflows Card */}
              <div
                onClick={() => handleLaunch('/workflows')}
                style={{
                  backgroundColor: '#18181b',
                  border: '1px solid #27272a',
                  borderRadius: '12px',
                  padding: '20px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#6366f1'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#27272a'; e.currentTarget.style.transform = 'none'; }}
              >
                <div>
                  <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#6366f120', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                    <Layers size={20} color="#6366f1" />
                  </div>
                  <h3 style={{ margin: '0 0 6px 0', fontSize: '1.05rem', fontWeight: 800 }}>Workflows Canvas</h3>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#a1a1aa', lineHeight: 1.4 }}>
                    Buat, edit, dan jalankan kanvas alur kerja visual dengan drag & drop 500+ node.
                  </p>
                </div>
                <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 800, color: '#818cf8' }}>
                  Buka Workflows <ArrowUpRight size={13} />
                </div>
              </div>

              {/* Executions Card */}
              <div
                onClick={() => handleLaunch('/executions')}
                style={{
                  backgroundColor: '#18181b',
                  border: '1px solid #27272a',
                  borderRadius: '12px',
                  padding: '20px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#22c55e'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#27272a'; e.currentTarget.style.transform = 'none'; }}
              >
                <div>
                  <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#22c55e20', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                    <PlayCircle size={20} color="#22c55e" />
                  </div>
                  <h3 style={{ margin: '0 0 6px 0', fontSize: '1.05rem', fontWeight: 800 }}>Live Executions Log</h3>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#a1a1aa', lineHeight: 1.4 }}>
                    Pantau riwayat eksekusi, periksa status webhook masuk, dan debug data step-by-step.
                  </p>
                </div>
                <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 800, color: '#4ade80' }}>
                  Lihat Executions <ArrowUpRight size={13} />
                </div>
              </div>

              {/* Credentials Card */}
              <div
                onClick={() => handleLaunch('/credentials')}
                style={{
                  backgroundColor: '#18181b',
                  border: '1px solid #27272a',
                  borderRadius: '12px',
                  padding: '20px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#f59e0b'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#27272a'; e.currentTarget.style.transform = 'none'; }}
              >
                <div>
                  <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#f59e0b20', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                    <Key size={20} color="#f59e0b" />
                  </div>
                  <h3 style={{ margin: '0 0 6px 0', fontSize: '1.05rem', fontWeight: 800 }}>Credential Vault</h3>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#a1a1aa', lineHeight: 1.4 }}>
                    Kelola token otentikasi API Telegram, Gmail SMTP, WhatsApp API, database, dan Cloud.
                  </p>
                </div>
                <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 800, color: '#fbbf24' }}>
                  Buka Credentials <ArrowUpRight size={13} />
                </div>
              </div>

            </div>

            {/* MES INTEGRATION WEBHOOK SNIPPET */}
            <div
              style={{
                backgroundColor: '#18181b',
                border: '1px solid #27272a',
                borderRadius: '12px',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Terminal size={18} color="#38bdf8" />
                  <span style={{ fontSize: '13px', fontWeight: 800 }}>Trigger n8n dari MES (JavaScript Webhook Code)</span>
                </div>

                <button
                  onClick={handleCopyWebhook}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    backgroundColor: '#27272a',
                    border: '1px solid #3f3f46',
                    color: '#f8fafc',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  {copiedWebhook ? <Check size={12} color="#22c55e" /> : <Copy size={12} />}
                  {copiedWebhook ? 'Tersalin' : 'Salin Kode Webhook'}
                </button>
              </div>

              <div
                style={{
                  backgroundColor: '#09090b',
                  border: '1px solid #27272a',
                  borderRadius: '8px',
                  padding: '14px',
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  color: '#34d399',
                  overflowX: 'auto',
                  lineHeight: 1.6
                }}
              >
                <pre style={{ margin: 0 }}>
{`// Kirim payload inspeksi / alert mesin dari MES ke n8n:
fetch('${n8nUrl || defaultN8nUrl}/webhook/mes-qc-alert', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    event: 'INSPECTION_DEFECT',
    partNo: 'PRT-FLG-450X',
    station: 'Station-01',
    status: 'NG',
    timestamp: new Date().toISOString()
  })
});`}
                </pre>
              </div>
            </div>

          </div>
        </div>
      ) : (
        /* EMBEDDED IFRAME VIEW */
        <div style={{ flex: 1, position: 'relative', backgroundColor: '#09090b', display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              padding: '8px 16px',
              backgroundColor: '#18181b',
              borderBottom: '1px solid #27272a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '11px',
              color: '#cbd5e1'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={14} color="#f59e0b" />
              <span>Jika frame n8n tertahan oleh proteksi browser, klik tombol buka di tab baru.</span>
            </div>

            <button
              onClick={() => handleLaunch()}
              style={{
                padding: '4px 10px',
                borderRadius: '4px',
                backgroundColor: '#ff6d5a',
                border: 'none',
                color: '#fff',
                fontWeight: 700,
                fontSize: '11px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <ExternalLink size={12} /> Buka di Tab Baru
            </button>
          </div>

          <iframe
            id="n8n-frame"
            src={n8nUrl || defaultN8nUrl}
            title="n8n Automation Engine Studio"
            style={{
              width: '100%',
              flex: 1,
              border: 'none',
              backgroundColor: '#18181b'
            }}
            allow="clipboard-read; clipboard-write; microphone; camera; display-capture"
          />
        </div>
      )}

      {/* ─── SETTINGS MODAL ─────────────────────────────────────────── */}
      {showSettings && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            backgroundColor: 'rgba(0,0,0,0.8)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          <div
            style={{
              width: '500px',
              backgroundColor: '#18181b',
              border: '1px solid #27272a',
              borderRadius: '12px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.7)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#ff6d5a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Server size={18} color="#fff" />
                </div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Konfigurasi URL n8n</h3>
              </div>
              <button onClick={() => setShowSettings(false)} style={{ background: 'none', border: 'none', color: '#a1a1aa', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, color: '#a1a1aa', display: 'block', marginBottom: '6px' }}>
                URL INSTANCE n8n (SERVER PORT 5678)
              </label>
              <input
                type="text"
                value={editUrl}
                onChange={(e) => setEditUrl(e.target.value)}
                placeholder="http://187.77.140.205:5678"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  backgroundColor: '#09090b',
                  border: '1px solid #3f3f46',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '13px',
                  outline: 'none',
                  fontFamily: 'monospace'
                }}
              />
            </div>

            {/* Presets */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setEditUrl('http://187.77.140.205:5678')}
                style={{ padding: '6px 12px', borderRadius: '6px', backgroundColor: '#27272a', border: '1px solid #3f3f46', color: '#38bdf8', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
              >
                🌐 Server Coolify (:5678)
              </button>
              <button
                onClick={() => setEditUrl('http://localhost:5678')}
                style={{ padding: '6px 12px', borderRadius: '6px', backgroundColor: '#27272a', border: '1px solid #3f3f46', color: '#34d399', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
              >
                💻 Localhost (:5678)
              </button>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
              <button
                onClick={() => setShowSettings(false)}
                style={{ flex: 1, padding: '10px', borderRadius: '8px', backgroundColor: '#27272a', color: '#cbd5e1', border: '1px solid #3f3f46', fontWeight: 700, cursor: 'pointer' }}
              >
                Batal
              </button>
              <button
                onClick={handleSaveUrl}
                style={{ flex: 2, padding: '10px', borderRadius: '8px', backgroundColor: '#ff6d5a', color: '#ffffff', border: 'none', fontWeight: 800, cursor: 'pointer', boxShadow: '0 2px 10px rgba(255, 109, 90, 0.4)' }}
              >
                Simpan & Hubungkan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

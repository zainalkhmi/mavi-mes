import React, { useState, useEffect, useRef } from 'react';
import {
  SandpackProvider,
  SandpackLayout,
  SandpackPreview,
  SandpackCodeEditor
} from '@codesandbox/sandpack-react';
import {
  Monitor,
  Tablet,
  Smartphone,
  Code,
  Eye,
  Columns,
  RotateCcw,
  Copy,
  Check,
  Maximize2,
  Minimize2,
  Sparkles,
  Layers,
  Lock,
  Globe,
  Database,
  Table,
  Rocket,
  X,
  CheckCircle2,
  Send,
  ChevronDown,
  ExternalLink,
  RotateCw,
  Type,
  Link2,
  MessageSquare,
  Search,
  FileText,
  ArrowUp,
  Loader2,
  History,
  PanelLeftClose,
  PanelLeftOpen,
  Trash2,
  Bot,
  User
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  syncVibeAppToTable,
  initVibeMessageListener,
  deployVibeAppToFrontline,
  extractTableSchemaFromCode
} from '../../utils/vibeTableBridge';

export const DEFAULT_VIBE_HMI_CODE = `import React, { useState } from 'react';
import { 
  IonApp, IonHeader, IonToolbar, IonTitle, IonContent, 
  IonCard, IonCardHeader, IonCardTitle, IonCardContent,
  IonButton, IonIcon, IonGrid, IonRow, IonCol,
  setupIonicReact 
} from '@ionic/react';
import { addCircleOutline, warningOutline, constructOutline } from 'ionicons/icons';

// Core CSS required for Ionic components to work properly
import '@ionic/react/css/core.css';
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

setupIonicReact();

export default function IndustrialApp() {
  const [productionCount, setProductionCount] = useState(1452);
  const [rejectCount, setRejectCount] = useState(12);

  const handleLogProduction = () => {
    setProductionCount(prev => prev + 1);
  };

  const handleLogReject = () => {
    setRejectCount(prev => prev + 1);
  };

  return (
    <IonApp>
      <IonHeader>
        <IonToolbar color="dark">
          <IonTitle>Stasiun Assembly A1</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding" style={{ '--background': '#f4f5f8' }}>
        
        <div style={{ padding: '10px 0', textAlign: 'center', color: '#666' }}>
          <h4>Status Lini: Aktif <IonIcon icon={constructOutline} /></h4>
        </div>

        <IonGrid>
          <IonRow>
            {/* Kartu Produksi OK */}
            <IonCol size="12" sizeMd="6">
              <IonCard color="success">
                <IonCardHeader>
                  <IonCardTitle>Produksi Sesuai (OK)</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <h1 style={{ fontSize: '3rem', margin: '10px 0' }}>{productionCount}</h1>
                  <IonButton fill="solid" color="light" onClick={handleLogProduction}>
                    <IonIcon slot="start" icon={addCircleOutline} />
                    Catat Part OK
                  </IonButton>
                </IonCardContent>
              </IonCard>
            </IonCol>

            {/* Kartu Defect / NG */}
            <IonCol size="12" sizeMd="6">
              <IonCard color="danger">
                <IonCardHeader>
                  <IonCardTitle>Produksi Cacat (NG)</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <h1 style={{ fontSize: '3rem', margin: '10px 0' }}>{rejectCount}</h1>
                  <IonButton fill="solid" color="light" onClick={handleLogReject}>
                    <IonIcon slot="start" icon={warningOutline} />
                    Catat NG
                  </IonButton>
                </IonCardContent>
              </IonCard>
            </IonCol>
          </IonRow>
        </IonGrid>

      </IonContent>
    </IonApp>
  );
}
`;

export default function VibeSandpackViewer({
  code = DEFAULT_VIBE_HMI_CODE,
  onCodeChange = null,
  onApplyToCanvas = null,
  isFullScreen = false,
  onToggleFullScreen = null,
  onPromptSandbox = null,
  isLoading = false,
  onClose = null
}) {
  const [viewMode, setViewMode] = useState('preview'); // Default to 'preview' for maximum workspace
  const [viewportSize, setViewportSize] = useState('responsive'); // 'responsive' | 'desktop' | 'tablet' | 'mobile'
  const [copied, setCopied] = useState(false);
  const [connectedTable, setConnectedTable] = useState(null);
  const [isSyncingTable, setIsSyncingTable] = useState(false);
  const [liveRecordCount, setLiveRecordCount] = useState(0);
  const [isFullScreenLocal, setIsFullScreenLocal] = useState(false);
  const containerRef = useRef(null);
  const [inlinePrompt, setInlinePrompt] = useState('');
  const [isChatPanelOpen, setIsChatPanelOpen] = useState(true);
  const [chatHistory, setChatHistory] = useState([]);
  const chatEndRef = useRef(null);

  // Auto-scroll chat to bottom when new messages arrive
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, isLoading]);

  // Track when AI finishes generating (isLoading goes from true → false) to add AI response
  const prevIsLoadingRef = useRef(isLoading);
  useEffect(() => {
    if (prevIsLoadingRef.current && !isLoading && chatHistory.length > 0) {
      const lastMsg = chatHistory[chatHistory.length - 1];
      if (lastMsg.role === 'user') {
        setChatHistory(prev => [...prev, {
          role: 'assistant',
          content: 'Kode berhasil di-update! Lihat preview di sebelah kanan.',
          timestamp: new Date()
        }]);
      }
    }
    prevIsLoadingRef.current = isLoading;
  }, [isLoading]);

  const handleChatSubmit = (promptText) => {
    if (!promptText.trim() || isLoading) return;
    // Add user message to chat history
    setChatHistory(prev => [...prev, {
      role: 'user',
      content: promptText.trim(),
      timestamp: new Date()
    }]);
    // Send to AI
    onPromptSandbox(promptText.trim());
    setInlinePrompt('');
  };

  // Cara 1: postMessage listener from Sandpack to MaviCore table storage
  useEffect(() => {
    const cleanup = initVibeMessageListener((table, record) => {
      setConnectedTable(table);
      setLiveRecordCount(c => c + 1);
    });
    return cleanup;
  }, []);

  // Cara 2: Buat & Hubungkan Tabel MaviCore secara otomatis
  const handleSyncTable = async () => {
    setIsSyncingTable(true);
    try {
      const res = await syncVibeAppToTable(effectiveCode);
      setConnectedTable(res.table);
      setLiveRecordCount(res.recordCount);
      toast.success(
        res.isNew
          ? `Tabel "${res.table.name}" berhasil dibuat di database MaviCore dengan ${res.table.fields?.length || 0} kolom!`
          : `Tabel "${res.table.name}" terhubung (${res.recordCount} records tersimpan)!`,
        { duration: 4000 }
      );
    } catch (err) {
      toast.error(`Gagal menghubungkan tabel: ${err.message || 'Database error'}`);
    } finally {
      setIsSyncingTable(false);
    }
  };

  // State & handler untuk Simpan & Deploy ke MaviCore Frontline Apps
  const [isDeployModalOpen, setIsDeployModalOpen] = useState(false);
  const [deployName, setDeployName] = useState('');
  const [deployCategory, setDeployCategory] = useState('Shop Floor');
  const [deployPublish, setDeployPublish] = useState(true);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployedApp, setDeployedApp] = useState(null);

  const handleOpenDeployModal = () => {
    const schema = extractTableSchemaFromCode(effectiveCode);
    setDeployName(schema.name || 'HMI Stamping Press 04');
    setIsDeployModalOpen(true);
  };

  const handleConfirmDeploy = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!deployName.trim()) {
      toast.error('Silakan isi nama aplikasi');
      return;
    }
    setIsDeploying(true);
    try {
      // Auto-sinkron tabel juga jika belum
      if (!connectedTable) {
        try {
          const tRes = await syncVibeAppToTable(effectiveCode);
          setConnectedTable(tRes.table);
          setLiveRecordCount(tRes.recordCount);
        } catch (_) {}
      }

      const saved = await deployVibeAppToFrontline({
        name: deployName.trim(),
        category: deployCategory,
        code: effectiveCode,
        isPublished: deployPublish
      });

      setDeployedApp(saved);
      setIsDeployModalOpen(false);
      toast.success(
        `🚀 Aplikasi "${saved.name}" berhasil di-deploy ke MaviCore Frontline Apps!`,
        { duration: 5000, icon: '🎉' }
      );
    } catch (err) {
      console.error('[VibeSandpackViewer] Gagal deploy aplikasi:', err);
      toast.error(`Gagal deploy aplikasi: ${err.message || 'Database error'}`);
    } finally {
      setIsDeploying(false);
    }
  };

  const effectiveCode = code && code.trim().length > 0 ? code : DEFAULT_VIBE_HMI_CODE;

  const files = {
    '/App.js': effectiveCode,
    '/styles.css': `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
* {
  font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  box-sizing: border-box;
}
html, body, #root {
  margin: 0;
  padding: 0;
  min-height: 100%;
  background-color: #030712;
  color: #f8fafc;
  -webkit-font-smoothing: antialiased;
}
button {
  font-family: inherit;
}
`
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(effectiveCode);
      setCopied(true);
      toast.success('Kode React berhasil disalin ke clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Gagal menyalin kode');
    }
  };

  const getViewportStyle = () => {
    switch (viewportSize) {
      case 'desktop':
        return { maxWidth: '1280px', margin: '0 auto', height: '100%' };
      case 'tablet':
        return { maxWidth: '768px', margin: '0 auto', height: '100%' };
      case 'mobile':
        return { maxWidth: '390px', margin: '0 auto', height: '100%' };
      default:
        return { width: '100%', height: '100%' };
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
      {/* TOP NAVBAR - Inline styled for guaranteed visibility */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 16px', backgroundColor: 'rgba(15, 23, 42, 0.95)',
        backdropFilter: 'blur(12px)', borderBottom: '1px solid #1e293b',
        color: '#cbd5e1', userSelect: 'none', gap: '8px', flexShrink: 0
      }}>
        {/* Left: Branding */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          <div style={{
            width: '24px', height: '24px', borderRadius: '8px',
            background: 'linear-gradient(135deg, #f43f5e, #f59e0b, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Sparkles size={13} color="#fff" />
          </div>
          <span style={{ fontWeight: 700, color: '#fff', fontSize: '0.875rem' }}>{deployedApp?.name || 'Kaizen Vision'}</span>
          <button type="button" style={{
            display: 'flex', alignItems: 'center', gap: '4px', padding: '2px 8px',
            borderRadius: '6px', backgroundColor: '#1e293b', border: '1px solid rgba(51,65,85,0.6)',
            color: '#cbd5e1', fontSize: '0.75rem', fontWeight: 500, cursor: 'pointer'
          }} title="Branch: main">
            <span>main</span>
            <ChevronDown size={11} color="#94a3b8" />
          </button>
        </div>

        {/* Center: View Mode + Device + Reload */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>

          {/* View Mode Switcher: Preview / Code / Split */}
          <div style={{
            display: 'flex', alignItems: 'center', backgroundColor: '#020617',
            padding: '3px', borderRadius: '12px', border: '1px solid #1e293b'
          }}>
            {[
              { key: 'preview', label: 'Preview', icon: <Globe size={13} /> },
              { key: 'code', label: 'Code', icon: <Code size={13} /> },
              { key: 'split', label: 'Split', icon: <Columns size={13} /> },
            ].map(item => (
              <button
                key={item.key}
                type="button"
                onClick={() => setViewMode(item.key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '5px 12px', borderRadius: '9px', fontSize: '0.75rem',
                  fontWeight: viewMode === item.key ? 700 : 500, cursor: 'pointer',
                  border: viewMode === item.key ? '1px solid rgba(14,165,233,0.4)' : '1px solid transparent',
                  backgroundColor: viewMode === item.key ? 'rgba(14,165,233,0.15)' : 'transparent',
                  color: viewMode === item.key ? '#38bdf8' : '#94a3b8',
                  transition: 'all 0.15s'
                }}
                title={item.label}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          {/* Device Switcher: Desktop / Tablet / Mobile */}
          <div style={{
            display: 'flex', alignItems: 'center', backgroundColor: '#020617',
            padding: '3px', borderRadius: '8px', border: '1px solid #1e293b'
          }}>
            {[
              { key: 'desktop', icon: <Monitor size={14} />, label: 'Desktop' },
              { key: 'tablet', icon: <Tablet size={14} />, label: 'Tablet' },
              { key: 'mobile', icon: <Smartphone size={14} />, label: 'Mobile' },
            ].map(item => (
              <button
                key={item.key}
                type="button"
                onClick={() => setViewportSize(item.key)}
                style={{
                  padding: '5px 8px', borderRadius: '6px', cursor: 'pointer',
                  border: 'none',
                  backgroundColor: viewportSize === item.key ? '#1e293b' : 'transparent',
                  color: viewportSize === item.key ? '#fff' : '#64748b',
                  transition: 'all 0.15s', display: 'flex', alignItems: 'center'
                }}
                title={`${item.label} View`}
              >
                {item.icon}
              </button>
            ))}
          </div>

          {/* Reload + Route */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button
              type="button"
              onClick={() => {
                const ifr = document.querySelector('.sp-preview-iframe');
                if (ifr && ifr.contentWindow) ifr.contentWindow.location.reload();
                else toast.success('Reloaded preview');
              }}
              style={{
                padding: '5px', color: '#94a3b8', background: 'none', border: 'none',
                borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center'
              }}
              title="Reload Preview"
            >
              <RotateCw size={14} />
            </button>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 12px',
              backgroundColor: '#020617', border: '1px solid #1e293b', borderRadius: '8px',
              fontSize: '0.75rem', fontWeight: 500, color: '#cbd5e1'
            }}>
              <span>Homepage</span>
              <ChevronDown size={11} color="#64748b" />
            </div>
            {onToggleFullScreen && (
              <button
                type="button"
                onClick={onToggleFullScreen}
                style={{
                  padding: '5px', color: '#94a3b8', background: 'none', border: 'none',
                  borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center'
                }}
                title={isFullScreen ? 'Exit Full Screen' : 'Full Screen'}
              >
                {isFullScreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              </button>
            )}
          </div>
        </div>

        {/* Right: Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <button
            type="button"
            onClick={handleCopyCode}
            style={{
              padding: '5px 14px', borderRadius: '9999px', backgroundColor: '#1e293b',
              border: '1px solid #334155', color: '#e2e8f0', fontSize: '0.75rem',
              fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px',
              cursor: 'pointer', transition: 'all 0.15s'
            }}
            title="Copy Code"
          >
            {copied ? <Check size={12} color="#34d399" /> : null}
            <span>Share</span>
          </button>

          <button
            type="button"
            onClick={handleSyncTable}
            disabled={isSyncingTable}
            style={{
              padding: '5px 14px', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700,
              display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer',
              transition: 'all 0.15s',
              backgroundColor: connectedTable ? 'rgba(147,51,234,0.15)' : '#9333ea',
              color: connectedTable ? '#c4b5fd' : '#fff',
              border: connectedTable ? '1px solid rgba(147,51,234,0.4)' : 'none',
            }}
            title="Connect MaviCore Database"
          >
            <Database size={12} className={isSyncingTable ? 'animate-spin' : ''} />
            <span>{connectedTable ? connectedTable.name : 'Connect DB'}</span>
          </button>

          <button
            type="button"
            onClick={handleOpenDeployModal}
            style={{
              padding: '5px 16px', borderRadius: '9999px', backgroundColor: '#2563eb',
              color: '#fff', fontSize: '0.75rem', fontWeight: 700, border: 'none',
              display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(37,99,235,0.3)', transition: 'all 0.15s'
            }}
            title="Publish"
          >
            <Rocket size={12} />
            <span>{deployedApp ? 'Published' : 'Publish'}</span>
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '4px', marginLeft: '4px', color: '#94a3b8', background: 'none',
                border: 'none', borderRadius: '9999px', cursor: 'pointer',
                display: 'flex', alignItems: 'center'
              }}
              title="Tutup Sandbox"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Main Content: Left Chat Panel + Right Sandpack Area */}
      <div className="flex-1 w-full overflow-hidden bg-slate-950 flex" style={{ minHeight: '560px', height: '100%' }}>

        {/* ═══════════ LEFT SIDE: AI CHAT PANEL ═══════════ */}
        {onPromptSandbox && (
          <div
            style={{
              width: isChatPanelOpen ? '340px' : '0px',
              minWidth: isChatPanelOpen ? '340px' : '0px',
              transition: 'width 0.25s ease, min-width 0.25s ease',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              borderRight: isChatPanelOpen ? '1px solid #1e293b' : 'none',
              backgroundColor: '#0a0f1a',
            }}
          >
            {isChatPanelOpen && (
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '340px' }}>
                {/* Chat Panel Header */}
                <div style={{
                  padding: '12px 14px',
                  borderBottom: '1px solid #1e293b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: '#0f172a',
                  flexShrink: 0,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '28px', height: '28px', borderRadius: '8px',
                      background: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Sparkles size={14} color="#fff" />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.01em' }}>
                        Sandbox AI Chat
                      </div>
                      <div style={{ fontSize: '0.62rem', color: '#64748b', fontWeight: 500 }}>
                        {chatHistory.length > 0 ? `${chatHistory.filter(m => m.role === 'user').length} pesan` : 'Mulai percakapan'}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {chatHistory.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm('Hapus semua riwayat chat?')) {
                            setChatHistory([]);
                          }
                        }}
                        style={{
                          background: 'none', border: 'none', color: '#475569',
                          cursor: 'pointer', padding: '4px', borderRadius: '6px',
                          transition: 'color 0.15s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.color = '#f87171'}
                        onMouseLeave={e => e.currentTarget.style.color = '#475569'}
                        title="Hapus riwayat chat"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setIsChatPanelOpen(false)}
                      style={{
                        background: 'none', border: 'none', color: '#64748b',
                        cursor: 'pointer', padding: '4px', borderRadius: '6px',
                        transition: 'color 0.15s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.color = '#e2e8f0'}
                      onMouseLeave={e => e.currentTarget.style.color = '#64748b'}
                      title="Sembunyikan panel chat"
                    >
                      <PanelLeftClose size={16} />
                    </button>
                  </div>
                </div>

                {/* Chat Messages Area */}
                <div style={{
                  flex: 1, overflowY: 'auto', padding: '12px',
                  display: 'flex', flexDirection: 'column', gap: '10px',
                  scrollbarWidth: 'thin', scrollbarColor: '#1e293b transparent',
                }}>
                  {chatHistory.length === 0 ? (
                    /* Empty State */
                    <div style={{
                      flex: 1, display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'center', gap: '12px',
                      color: '#475569', padding: '24px 16px', textAlign: 'center',
                    }}>
                      <div style={{
                        width: '52px', height: '52px', borderRadius: '16px',
                        background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.1), rgba(99, 102, 241, 0.1))',
                        border: '1px solid rgba(56, 189, 248, 0.15)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <MessageSquare size={24} style={{ color: '#38bdf8' }} />
                      </div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#94a3b8' }}>
                        Mulai percakapan
                      </div>
                      <div style={{ fontSize: '0.72rem', lineHeight: 1.5, maxWidth: '240px' }}>
                        Tulis instruksi di bawah untuk menghasilkan atau memodifikasi kode React Sandbox secara otomatis.
                      </div>

                      {/* Quick Suggestion Chips in empty state */}
                      <div style={{
                        display: 'flex', flexDirection: 'column', gap: '6px',
                        width: '100%', marginTop: '8px',
                      }}>
                        {[
                          { label: '⚡ Emergency Stop', prompt: 'Tambahkan tombol emergency stop besar warna merah dengan alert status OK/NG' },
                          { label: '📊 Gauge OEE Live', prompt: 'Tambahkan gauge meter radial interaktif untuk OEE (Availability, Performance, Quality)' },
                          { label: '⏱️ Cycle Time Timer', prompt: 'Tambahkan stopwatch cycle-time otomatis yang menghitung durasi per stroke' },
                          { label: '🗄️ postMessage to DB', prompt: 'Tambahkan event postMessage MAVICORE_TABLE_INSERT pada tombol simpan' },
                        ].map((item, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleChatSubmit(item.prompt)}
                            style={{
                              width: '100%', textAlign: 'left',
                              fontSize: '0.72rem', padding: '8px 12px',
                              borderRadius: '10px',
                              backgroundColor: '#111827',
                              border: '1px solid #1e293b',
                              color: '#cbd5e1',
                              cursor: 'pointer',
                              transition: 'all 0.15s',
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.backgroundColor = '#1e293b';
                              e.currentTarget.style.borderColor = '#38bdf8';
                              e.currentTarget.style.color = '#f1f5f9';
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.backgroundColor = '#111827';
                              e.currentTarget.style.borderColor = '#1e293b';
                              e.currentTarget.style.color = '#cbd5e1';
                            }}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    /* Chat Messages */
                    chatHistory.map((msg, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
                          gap: '4px',
                        }}
                      >
                        {/* Avatar + Label */}
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: '6px',
                          flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                        }}>
                          <div style={{
                            width: '20px', height: '20px', borderRadius: '6px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '0.6rem', fontWeight: 800,
                            background: msg.role === 'user'
                              ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                              : 'linear-gradient(135deg, #0ea5e9, #06b6d4)',
                            color: '#fff',
                          }}>
                            {msg.role === 'user' ? <User size={11} /> : <Bot size={11} />}
                          </div>
                          <span style={{
                            fontSize: '0.62rem', fontWeight: 700,
                            color: msg.role === 'user' ? '#a5b4fc' : '#67e8f9',
                          }}>
                            {msg.role === 'user' ? 'Anda' : 'AI Sandbox'}
                          </span>
                          <span style={{ fontSize: '0.58rem', color: '#334155' }}>
                            {msg.timestamp?.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        {/* Message Bubble */}
                        <div style={{
                          maxWidth: '90%',
                          padding: '8px 12px',
                          borderRadius: msg.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                          backgroundColor: msg.role === 'user' ? '#1e1b4b' : '#0c1929',
                          border: `1px solid ${msg.role === 'user' ? 'rgba(99, 102, 241, 0.25)' : 'rgba(14, 165, 233, 0.2)'}`,
                          color: msg.role === 'user' ? '#e0e7ff' : '#bae6fd',
                          fontSize: '0.75rem',
                          lineHeight: 1.5,
                          wordBreak: 'break-word',
                        }}>
                          {msg.content}
                        </div>
                      </div>
                    ))
                  )}

                  {/* AI Typing Indicator */}
                  {isLoading && (
                    <div style={{
                      display: 'flex', flexDirection: 'column',
                      alignItems: 'flex-start', gap: '4px',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{
                          width: '20px', height: '20px', borderRadius: '6px',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: 'linear-gradient(135deg, #0ea5e9, #06b6d4)',
                          color: '#fff',
                        }}>
                          <Bot size={11} />
                        </div>
                        <span style={{ fontSize: '0.62rem', fontWeight: 700, color: '#67e8f9' }}>AI Sandbox</span>
                      </div>
                      <div style={{
                        padding: '10px 14px', borderRadius: '14px 14px 14px 4px',
                        backgroundColor: '#0c1929', border: '1px solid rgba(14, 165, 233, 0.2)',
                        display: 'flex', alignItems: 'center', gap: '8px',
                        color: '#7dd3fc', fontSize: '0.73rem',
                      }}>
                        <Loader2 size={13} className="animate-spin" style={{ color: '#38bdf8' }} />
                        <span>Menghasilkan kode...</span>
                      </div>
                    </div>
                  )}

                  <div ref={chatEndRef} />
                </div>

                {/* Quick Suggestion Chips (when chat has messages) */}
                {chatHistory.length > 0 && (
                  <div style={{
                    padding: '6px 12px', borderTop: '1px solid #1e293b',
                    display: 'flex', gap: '6px', overflowX: 'auto',
                    flexShrink: 0,
                  }}>
                    {[
                      { label: '⚡ Emergency Stop', prompt: 'Tambahkan tombol emergency stop besar warna merah dengan alert status OK/NG' },
                      { label: '📊 Gauge OEE', prompt: 'Tambahkan gauge meter radial interaktif untuk OEE' },
                      { label: '⏱️ Cycle Time', prompt: 'Tambahkan stopwatch cycle-time otomatis' },
                      { label: '🗄️ postMessage', prompt: 'Tambahkan event postMessage MAVICORE_TABLE_INSERT' },
                    ].map((item, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleChatSubmit(item.prompt)}
                        disabled={isLoading}
                        style={{
                          whiteSpace: 'nowrap',
                          fontSize: '0.62rem', padding: '3px 8px',
                          borderRadius: '8px',
                          backgroundColor: '#111827',
                          border: '1px solid #1e293b',
                          color: '#94a3b8',
                          cursor: isLoading ? 'not-allowed' : 'pointer',
                          transition: 'all 0.15s',
                          opacity: isLoading ? 0.5 : 1,
                        }}
                        onMouseEnter={e => { if (!isLoading) { e.currentTarget.style.borderColor = '#38bdf8'; e.currentTarget.style.color = '#e2e8f0'; }}}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = '#1e293b'; e.currentTarget.style.color = '#94a3b8'; }}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                )}

                {/* Chat Input Area */}
                <div style={{
                  padding: '10px 12px', borderTop: '1px solid #1e293b',
                  backgroundColor: '#0f172a', flexShrink: 0,
                }}>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleChatSubmit(inlinePrompt);
                    }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '8px',
                      backgroundColor: '#020617',
                      border: '1px solid #1e293b',
                      borderRadius: '12px',
                      padding: '6px 10px',
                      transition: 'border-color 0.2s',
                    }}
                    onFocus={e => e.currentTarget.style.borderColor = '#0ea5e9'}
                    onBlur={e => e.currentTarget.style.borderColor = '#1e293b'}
                  >
                    <input
                      type="text"
                      value={inlinePrompt}
                      onChange={(e) => setInlinePrompt(e.target.value)}
                      disabled={isLoading}
                      placeholder={isLoading ? 'AI sedang menulis kode...' : 'Tulis instruksi untuk AI...'}
                      style={{
                        flex: 1, backgroundColor: 'transparent',
                        border: 'none', outline: 'none',
                        fontSize: '0.76rem', color: '#f1f5f9',
                        fontFamily: 'inherit',
                      }}
                    />
                    <button
                      type="submit"
                      disabled={!inlinePrompt.trim() || isLoading}
                      style={{
                        width: '30px', height: '30px',
                        borderRadius: '8px',
                        border: 'none',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: !inlinePrompt.trim() || isLoading ? 'not-allowed' : 'pointer',
                        transition: 'all 0.15s',
                        background: inlinePrompt.trim() && !isLoading
                          ? 'linear-gradient(135deg, #0ea5e9, #6366f1)'
                          : '#1e293b',
                        color: inlinePrompt.trim() && !isLoading ? '#fff' : '#475569',
                        boxShadow: inlinePrompt.trim() && !isLoading ? '0 2px 8px rgba(14, 165, 233, 0.35)' : 'none',
                      }}
                      title="Kirim ke AI Sandbox"
                    >
                      {isLoading ? <Loader2 size={14} className="animate-spin" /> : <ArrowUp size={14} />}
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Toggle Chat Panel Button (when collapsed) */}
        {onPromptSandbox && !isChatPanelOpen && (
          <button
            type="button"
            onClick={() => setIsChatPanelOpen(true)}
            style={{
              position: 'absolute', left: '8px', bottom: '12px', zIndex: 30,
              width: '40px', height: '40px', borderRadius: '12px',
              background: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              color: '#fff', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 8px 20px rgba(14, 165, 233, 0.3)',
              transition: 'transform 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            title="Buka Panel AI Chat"
          >
            <PanelLeftOpen size={18} />
          </button>
        )}

        {/* ═══════════ RIGHT SIDE: SANDPACK EDITOR + PREVIEW ═══════════ */}
        <div className="vibe-sandpack-root flex-1 overflow-hidden bg-slate-950" style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
          <style>{`
            .vibe-sandpack-root .sp-wrapper {
              height: 100% !important;
              flex: 1 1 0% !important;
              display: flex !important;
              flex-direction: column !important;
            }
            .vibe-sandpack-root .sp-layout {
              height: 100% !important;
              min-height: 100% !important;
              flex: 1 1 0% !important;
              --sp-layout-height: 100% !important;
              display: flex !important;
            }
            .vibe-sandpack-root .sp-stack {
              height: 100% !important;
              min-height: 100% !important;
              flex: 1 1 0% !important;
            }
            .vibe-sandpack-root .sp-preview,
            .vibe-sandpack-root .sp-preview-container,
            .vibe-sandpack-root .sp-preview-iframe {
              height: 100% !important;
              min-height: 100% !important;
              flex: 1 1 0% !important;
            }
          `}</style>
          <div className="h-full transition-all duration-300 flex flex-col flex-1">
            <SandpackProvider
              key={effectiveCode.slice(0, 100)}
              template="react"
              theme="dark"
              files={files}
              customSetup={{
                dependencies: {
                  '@ionic/react': '^7.0.0',
                  'ionicons': '^7.0.0',
                  'lucide-react': 'latest',
                  'recharts': 'latest'
                }
              }}
              options={{
                activeFile: '/App.js',
                visibleFiles: ['/App.js'],
                externalResources: [
                  'https://cdn.tailwindcss.com',
                  'https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css',
                  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap'
                ]
              }}
            >
              <SandpackLayout style={{ height: '100%', minHeight: '100%', border: 'none', borderRadius: 0, flex: 1, display: 'flex' }}>
                {(viewMode === 'split' || viewMode === 'code') && (
                  <SandpackCodeEditor
                    showLineNumbers
                    showInlineErrors
                    wrapContent
                    style={{
                      height: '100%',
                      minHeight: '100%',
                      width: viewMode === 'code' ? '100%' : '40%',
                      fontFamily: 'monospace',
                      fontSize: '12px'
                    }}
                  />
                )}
                {(viewMode === 'split' || viewMode === 'preview') && (
                  <div style={{
                    position: 'relative',
                    flex: 1,
                    height: '100%',
                    minHeight: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'auto',
                    backgroundColor: '#020617',
                    padding: viewportSize === 'responsive' ? 0 : '16px'
                  }}>
                    {/* UNIFIED PERSISTENT DEVICE CONTAINER */}
                    <div style={{
                      width: viewportSize === 'mobile' ? '390px' : (viewportSize === 'tablet' ? '768px' : '100%'),
                      maxWidth: '100%',
                      height: '100%',
                      maxHeight: viewportSize === 'mobile' ? '820px' : (viewportSize === 'tablet' ? '1000px' : '100%'),
                      borderRadius: viewportSize === 'mobile' ? '44px' : (viewportSize === 'tablet' ? '24px' : (viewportSize === 'desktop' ? '12px' : '0')),
                      border: viewportSize === 'mobile' ? '10px solid #1e293b' : (viewportSize === 'tablet' ? '12px solid #1e293b' : (viewportSize === 'desktop' ? '1px solid #1e293b' : 'none')),
                      boxShadow: viewportSize === 'responsive' ? 'none' : '0 25px 60px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.08)',
                      display: 'flex',
                      flexDirection: 'column',
                      overflow: 'hidden',
                      backgroundColor: '#030712',
                      transition: 'width 0.3s ease, max-height 0.3s ease, border-radius 0.3s ease',
                      flexShrink: 0
                    }}>
                      {/* Dynamic Island for Mobile */}
                      {viewportSize === 'mobile' && (
                        <div style={{ height: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#030712', borderBottom: '1px solid rgba(255,255,255,0.05)', flexShrink: 0 }}>
                          <div style={{ width: '92px', height: '18px', backgroundColor: '#0f172a', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 8px' }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#0284c7' }} />
                            <span style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: '#334155' }} />
                          </div>
                        </div>
                      )}

                      {/* Camera Dot for Tablet */}
                      {viewportSize === 'tablet' && (
                        <div style={{ height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#030712', flexShrink: 0 }}>
                          <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#334155' }} />
                        </div>
                      )}

                      {/* Mac Chrome Bar for Desktop */}
                      {viewportSize === 'desktop' && (
                        <div style={{
                          height: '34px',
                          backgroundColor: '#0f172a',
                          borderBottom: '1px solid #1e293b',
                          display: 'flex',
                          alignItems: 'center',
                          padding: '0 12px',
                          gap: '12px',
                          flexShrink: 0
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#ef4444' }} />
                            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#f59e0b' }} />
                            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10b981' }} />
                          </div>
                          <div style={{
                            flex: 1,
                            maxWidth: '480px',
                            margin: '0 auto',
                            height: '22px',
                            backgroundColor: '#030712',
                            borderRadius: '6px',
                            border: '1px solid #1e293b',
                            display: 'flex',
                            alignItems: 'center',
                            padding: '0 8px',
                            gap: '6px',
                            fontSize: '0.7rem',
                            color: '#94a3b8'
                          }}>
                            <Lock size={10} color="#34d399" />
                            <span style={{ color: '#e2e8f0', fontWeight: 600 }}>https://mavicore.mes</span>
                            <span style={{ color: '#64748b' }}>/stamping-press-04</span>
                          </div>
                        </div>
                      )}

                      {/* THE PERSISTENT SINGLE SANDPACK PREVIEW */}
                      <div style={{ flex: 1, minHeight: 0, width: '100%', height: '100%', overflow: 'hidden' }}>
                        <SandpackPreview
                          showOpenInCodeSandbox={false}
                          showRefreshButton={true}
                          style={{ height: '100%', width: '100%', backgroundColor: '#030712' }}
                        />
                      </div>

                      {/* Home Bar for Mobile */}
                      {viewportSize === 'mobile' && (
                        <div style={{ height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#030712', flexShrink: 0 }}>
                          <div style={{ width: '120px', height: '4px', backgroundColor: '#475569', borderRadius: '9999px' }} />
                        </div>
                      )}
                    </div>

                    {/* LOVABLE BOTTOM FLOATING INSPECTOR ISLAND (only when no prompt) */}
                    {!onPromptSandbox && (
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-full px-3.5 py-1.5 shadow-2xl flex items-center gap-3 text-slate-300 text-xs select-none">
                        <button
                          type="button"
                          onClick={() => toast('🔍 Element Inspector Active', { icon: '✨' })}
                          className="p-1 hover:text-white rounded transition-colors flex items-center gap-1 text-[11px] cursor-pointer"
                          title="Inspect Element"
                        >
                          <Search size={12} />
                        </button>
                        <div className="w-[1px] h-3 bg-slate-700" />
                        <button
                          type="button"
                          onClick={() => toast('T Text Editor Active', { icon: '✏️' })}
                          className="p-1 hover:text-white rounded transition-colors text-[11px] cursor-pointer"
                          title="Edit Text"
                        >
                          <Type size={12} />
                        </button>
                        <div className="w-[1px] h-3 bg-slate-700" />
                        <button
                          type="button"
                          onClick={() => toast('🔗 Link Component Active', { icon: '🔗' })}
                          className="p-1 hover:text-white rounded transition-colors text-[11px] cursor-pointer"
                          title="Link Element"
                        >
                          <Link2 size={12} />
                        </button>
                        <div className="w-[1px] h-3 bg-slate-700" />
                        <button
                          type="button"
                          onClick={() => toast('💬 Leave Feedback Note', { icon: '📝' })}
                          className="p-1 hover:text-white rounded transition-colors text-[11px] cursor-pointer"
                          title="Feedback Comments"
                        >
                          <MessageSquare size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </SandpackLayout>
            </SandpackProvider>
          </div>
        </div>
      </div>

      {/* DEPLOY TO MAVICORE MODAL DIALOG */}
      {isDeployModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl text-slate-100 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
                  <Rocket size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Simpan & Deploy ke MaviCore</h3>
                  <p className="text-[11px] text-slate-400">Daftarkan aplikasi HMI ini ke database Frontline Apps</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDeployModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-all cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleConfirmDeploy} className="flex flex-col gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Nama Aplikasi MaviCore
                </label>
                <input
                  type="text"
                  value={deployName}
                  onChange={(e) => setDeployName(e.target.value)}
                  placeholder="Misal: HMI Stamping Press Line 04"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Kategori Stasiun
                </label>
                <select
                  value={deployCategory}
                  onChange={(e) => setDeployCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-sky-500"
                >
                  <option value="Shop Floor">Shop Floor (Lantai Produksi)</option>
                  <option value="Quality Control">Quality Control & Inspection</option>
                  <option value="HMI Automation">HMI Automation / SCADA</option>
                  <option value="Maintenance">Maintenance & Repair</option>
                  <option value="Assembly">Assembly Line</option>
                </select>
              </div>

              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-950/60 border border-slate-800 cursor-pointer hover:bg-slate-950 transition-all">
                <input
                  type="checkbox"
                  checked={deployPublish}
                  onChange={(e) => setDeployPublish(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-0 cursor-pointer"
                />
                <div>
                  <div className="text-xs font-bold text-white">Publikasikan Langsung (Status: PUBLISHED)</div>
                  <div className="text-[10px] text-slate-400">Aplikasi siap dijalankan di stasiun kerja operator & terminal</div>
                </div>
              </label>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsDeployModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-700 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isDeploying}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-xs font-bold text-white shadow-lg transition-all cursor-pointer disabled:opacity-50"
                >
                  {isDeploying ? (
                    <span>Menyimpan ke MaviCore...</span>
                  ) : (
                    <>
                      <Rocket size={13} />
                      <span>Simpan & Deploy Sekarang</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


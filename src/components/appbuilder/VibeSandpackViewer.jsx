import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  SandpackProvider,
  SandpackLayout,
  SandpackPreview,
  SandpackCodeEditor,
  useSandpack
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
  User,
  Smartphone as MobileIcon,
  Download,
  Server,
  FolderOpen,
  Wrench
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  syncVibeAppToTable,
  initVibeMessageListener,
  deployVibeAppToFrontline,
  extractTableSchemaFromCode
} from '../../utils/vibeTableBridge';

import { ProjectFileSystem } from '../../vibe/filesystem/ProjectFileSystem';
import { ProjectVersionControl } from '../../vibe/filesystem/ProjectVersionControl';
import { AIProvider } from '../../vibe/ai/AIProvider';
import { AgenticPromptEngine } from '../../vibe/ai/AgenticPromptEngine';
import { RuntimeManager } from '../../vibe/runtime/RuntimeManager';
import { ErrorFixEngine } from '../../vibe/autofix/ErrorFixEngine';
import { MAVICORE_UIKIT_VIRTUAL_FILE } from '../../vibe/uikit';
import { MAVICORE_SDK_VIRTUAL_FILE } from '../../vibe/sdk';

import FileTreeExplorer from '../../vibe/components/FileTreeExplorer';
import AiChangesReviewModal from '../../vibe/components/AiChangesReviewModal';
import BottomTerminalPanel from '../../vibe/components/BottomTerminalPanel';
import ManufacturingTemplatesModal from '../../vibe/components/ManufacturingTemplatesModal';
import BuildModal from '../../vibe/components/BuildModal';

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
    if (typeof window !== 'undefined' && window.parent) {
      window.parent.postMessage({
        type: 'MAVICORE_TABLE_INSERT',
        tableName: 'Stasiun Assembly A1 Log',
        data: { timestamp: new Date().toISOString(), type: 'OK', total: productionCount + 1 }
      }, '*');
    }
  };

  const handleLogReject = () => {
    setRejectCount(prev => prev + 1);
    if (typeof window !== 'undefined' && window.parent) {
      window.parent.postMessage({
        type: 'MAVICORE_TABLE_INSERT',
        tableName: 'Stasiun Assembly A1 Defect Log',
        data: { timestamp: new Date().toISOString(), type: 'NG', total: rejectCount + 1 }
      }, '*');
    }
  };

  return (
    <IonApp>
      <IonHeader>
        <IonToolbar color="dark">
          <IonTitle>Stasiun Assembly A1</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding" style={{ '--background': '#030712', color: '#f8fafc' }}>
        
        <div style={{ padding: '10px 0', textAlign: 'center', color: '#94a3b8' }}>
          <h4 style={{ margin: 0 }}>Status Lini: <span style={{ color: '#34d399' }}>Aktif Normal</span></h4>
        </div>

        <IonGrid>
          <IonRow>
            {/* Kartu Produksi OK */}
            <IonCol size="12" sizeMd="6">
              <IonCard color="dark" style={{ border: '1px solid #1e293b', borderRadius: '16px' }}>
                <IonCardHeader>
                  <IonCardTitle style={{ color: '#34d399' }}>Produksi Sesuai (OK)</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <h1 style={{ fontSize: '3rem', margin: '10px 0', color: '#f8fafc' }}>{productionCount}</h1>
                  <IonButton fill="solid" color="success" onClick={handleLogProduction}>
                    <IonIcon slot="start" icon={addCircleOutline} />
                    Catat Part OK
                  </IonButton>
                </IonCardContent>
              </IonCard>
            </IonCol>

            {/* Kartu Defect / NG */}
            <IonCol size="12" sizeMd="6">
              <IonCard color="dark" style={{ border: '1px solid #1e293b', borderRadius: '16px' }}>
                <IonCardHeader>
                  <IonCardTitle style={{ color: '#f43f5e' }}>Produksi Cacat (NG)</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <h1 style={{ fontSize: '3rem', margin: '10px 0', color: '#f8fafc' }}>{rejectCount}</h1>
                  <IonButton fill="solid" color="danger" onClick={handleLogReject}>
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

/**
 * Child helper component to capture runtime errors from Sandpack
 */
function SandpackErrorListener({ onError, onLog }) {
  const { sandpack } = useSandpack();
  const prevErrorsRef = useRef([]);

  useEffect(() => {
    const errs = sandpack?.errors || [];
    if (errs.length > 0 && JSON.stringify(errs) !== JSON.stringify(prevErrorsRef.current)) {
      prevErrorsRef.current = errs;
      const first = errs[0];
      const msg = typeof first === 'string' ? first : first.message || JSON.stringify(first);
      if (onError) onError(msg);
      if (onLog) onLog(`[Sandpack Error] ${msg}`);
    }
  }, [sandpack?.errors, onError, onLog]);

  return null;
}

export default function VibeSandpackViewer({
  code = DEFAULT_VIBE_HMI_CODE,
  onCodeChange = null,
  isFullScreen = false,
  onToggleFullScreen = null,
  onPromptSandbox = null,
  isLoading = false,
  onClose = null
}) {
  const effectiveInitialCode = code && code.trim().length > 0 ? code : DEFAULT_VIBE_HMI_CODE;

  // 1. Virtual File System & Version Control
  const [vfs] = useState(() => {
    const initialFiles = {
      '/App.js': effectiveInitialCode,
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
`,
      '/package.json': JSON.stringify({
        name: 'mavicore-app',
        version: '1.0.0',
        dependencies: {
          '@ionic/react': '^7.0.0',
          'ionicons': '^7.0.0',
          'lucide-react': 'latest',
          'recharts': 'latest'
        }
      }, null, 2),
      '/mavicore-ui.jsx': MAVICORE_UIKIT_VIRTUAL_FILE,
      '/mavicore-sdk.js': MAVICORE_SDK_VIRTUAL_FILE
    };
    return new ProjectFileSystem(initialFiles);
  });

  const [versionControl] = useState(() => new ProjectVersionControl());
  const [runtimeManager] = useState(() => new RuntimeManager('sandpack'));

  // Project state
  const [filesRecord, setFilesRecord] = useState(() => vfs.getAllFilesRecord());
  const [activeFilePath, setActiveFilePath] = useState('/App.js');
  const [fileTree, setFileTree] = useState(() => vfs.getFileTree());
  const [appMode, setAppMode] = useState('web'); // 'web' | 'mobile'

  // Sync external code prop if updated externally
  useEffect(() => {
    if (code && code.trim() && code !== vfs.readFile('/App.js')) {
      vfs.writeFile('/App.js', code);
      setFilesRecord(vfs.getAllFilesRecord());
      setFileTree(vfs.getFileTree());
    }
  }, [code, vfs]);

  // UI state
  const [viewMode, setViewMode] = useState('preview'); // 'preview' | 'code' | 'split'
  const [viewportSize, setViewportSize] = useState('responsive'); // 'responsive' | 'desktop' | 'tablet' | 'mobile'
  const [copied, setCopied] = useState(false);
  const [connectedTable, setConnectedTable] = useState(null);
  const [isSyncingTable, setIsSyncingTable] = useState(false);
  const [liveRecordCount, setLiveRecordCount] = useState(0);

  // Panels state
  const [isFilesPanelOpen, setIsFilesPanelOpen] = useState(true);
  const [isChatPanelOpen, setIsChatPanelOpen] = useState(true);
  const [isTerminalPanelOpen, setIsTerminalPanelOpen] = useState(false);

  // Modals state
  const [isTemplatesModalOpen, setIsTemplatesModalOpen] = useState(false);
  const [isBuildModalOpen, setIsBuildModalOpen] = useState(false);
  const [pendingFileActions, setPendingFileActions] = useState([]);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  // Chat & AI state
  const [inlinePrompt, setInlinePrompt] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [internalAiLoading, setInternalAiLoading] = useState(false);
  const chatEndRef = useRef(null);

  // Logs & errors
  const [logs, setLogs] = useState([]);
  const [errors, setErrors] = useState([]);
  const [aiActivity, setAiActivity] = useState(null);
  const [isAutoFixing, setIsAutoFixing] = useState(false);

  const errorFixEngine = useMemo(() => {
    const engine = new ErrorFixEngine(vfs, runtimeManager, 3);
    engine.onProgress((event) => {
      setAiActivity(event);
      if (event.message) {
        setLogs(prev => [...prev, { timestamp: new Date(), text: `[Auto-Fix] ${event.message}` }]);
      }
      if (event.stage === 'success') {
        setFilesRecord(vfs.getAllFilesRecord());
        setFileTree(vfs.getFileTree());
        setErrors([]);
        setIsAutoFixing(false);
        toast.success(event.message);
      } else if (event.stage === 'error' || event.stage === 'failed') {
        setIsAutoFixing(false);
        toast.error(event.message);
      }
    });
    return engine;
  }, [vfs, runtimeManager]);

  // Auto-scroll chat
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, internalAiLoading, isLoading]);

  // Listen to postMessage from Sandpack to MaviCore table storage
  useEffect(() => {
    const cleanup = initVibeMessageListener((table) => {
      setConnectedTable(table);
      setLiveRecordCount(c => c + 1);
      setLogs(prev => [...prev, { timestamp: new Date(), text: `[Table Synced] Record baru tersimpan di tabel "${table.name}"` }]);
    });
    return cleanup;
  }, []);

  // AI Prompt execution
  const handleChatSubmit = async (promptText) => {
    if (!promptText.trim() || internalAiLoading || isLoading) return;
    const userMsg = promptText.trim();
    setInlinePrompt('');

    // Add user message to chat history
    setChatHistory(prev => [...prev, {
      role: 'user',
      content: userMsg,
      timestamp: new Date()
    }]);

    setLogs(prev => [...prev, { timestamp: new Date(), text: `[AI Request] "${userMsg.slice(0, 60)}..."` }]);

    // Take snapshot before modification
    versionControl.createSnapshot(vfs.getAllFilesRecord(), `Before: ${userMsg.slice(0, 30)}`);

    // If external onPromptSandbox is provided and user didn't request internal multi-file prompt, call it as well
    if (onPromptSandbox) {
      onPromptSandbox(userMsg);
    }

    setInternalAiLoading(true);
    setAiActivity({ stage: 'thinking', message: 'Menganalisis prompt & arsitektur proyek...' });

    try {
      const systemPrompt = AgenticPromptEngine.buildSystemPrompt({
        appMode,
        vfs,
        context: { connectedTable, tables: [] }
      });

      const messages = [
        { role: 'system', content: systemPrompt },
        ...chatHistory.slice(-4).map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: userMsg }
      ];

      setAiActivity({ stage: 'generating', message: 'Menghasilkan rencana & file kode...' });
      const fullResponse = await AIProvider.getCompletion(messages);

      // Parse plan and file actions
      const { plan, fileActions } = AgenticPromptEngine.parseResponse(fullResponse);

      setChatHistory(prev => [...prev, {
        role: 'assistant',
        content: plan ? `📋 **Rencana AI:**\n${plan}\n\nMenghasilkan ${fileActions.length} perubahan file.` : 'Perubahan kode berhasil dihasilkan!',
        plan,
        fileActions,
        timestamp: new Date()
      }]);

      if (fileActions.length > 0) {
        setPendingFileActions(fileActions);
        setIsReviewModalOpen(true);
      } else {
        toast('AI merespon namun tidak mendeteksi kode yang dapat diubah.');
      }
    } catch (err) {
      console.error('[VibeSandpackViewer AI error]', err);
      toast.error(`Gagal update AI: ${err.message || 'Network error'}`);
      setLogs(prev => [...prev, { timestamp: new Date(), text: `[AI Error] ${err.message}` }]);
    } finally {
      setInternalAiLoading(false);
      setAiActivity(null);
    }
  };

  // Apply AI Changes after review
  const handleApplyFileActions = () => {
    if (pendingFileActions.length === 0) return;

    for (const action of pendingFileActions) {
      if (action.action === 'delete') {
        vfs.deleteFile(action.path);
        setLogs(prev => [...prev, { timestamp: new Date(), text: `[File Deleted] ${action.path}` }]);
      } else {
        vfs.writeFile(action.path, action.content);
        setLogs(prev => [...prev, { timestamp: new Date(), text: `[File Updated] ${action.path}` }]);
        if (action.path === '/App.js' || action.path === '/App.jsx') {
          if (onCodeChange) onCodeChange(action.content);
        }
      }
    }

    // Refresh files record for Sandpack
    setFilesRecord(vfs.getAllFilesRecord());
    setFileTree(vfs.getFileTree());
    versionControl.createSnapshot(vfs.getAllFilesRecord(), 'Applied AI changes');

    setIsReviewModalOpen(false);
    setPendingFileActions([]);
    toast.success('⚡ Semua perubahan file berhasil diterapkan!');
  };

  const handleRejectFileActions = () => {
    setIsReviewModalOpen(false);
    setPendingFileActions([]);
    toast('Perubahan AI dibatalkan.');
  };

  // Undo AI Change
  const handleUndo = () => {
    const snap = versionControl.undo();
    if (snap) {
      vfs.init(snap.files);
      setFilesRecord(vfs.getAllFilesRecord());
      setFileTree(vfs.getFileTree());
      const main = vfs.readFile('/App.js') || vfs.readFile('/App.jsx');
      if (main && onCodeChange) onCodeChange(main);
      toast.success(`Berhasil membatalkan ke snapshot: ${snap.label}`);
    } else {
      toast('Tidak ada riwayat untuk di-undo.');
    }
  };

  // Auto-Fix Error trigger
  const handleTriggerAutoFix = () => {
    if (errors.length === 0) {
      toast('Tidak ada error aktif untuk diperbaiki.');
      return;
    }
    setIsAutoFixing(true);
    errorFixEngine.attemptAutoFix(errors[0], activeFilePath);
  };

  // Table Sync
  const handleSyncTable = async () => {
    setIsSyncingTable(true);
    const mainCode = vfs.readFile('/App.js') || vfs.readFile('/App.jsx') || effectiveInitialCode;
    try {
      const res = await syncVibeAppToTable(mainCode);
      setConnectedTable(res.table);
      setLiveRecordCount(res.recordCount);
      toast.success(
        res.isNew
          ? `Tabel "${res.table.name}" berhasil dibuat di MaviCore dengan ${res.table.fields?.length || 0} kolom!`
          : `Tabel "${res.table.name}" terhubung (${res.recordCount} records tersimpan)!`,
        { duration: 4000 }
      );
    } catch (err) {
      toast.error(`Gagal menghubungkan tabel: ${err.message || 'Database error'}`);
    } finally {
      setIsSyncingTable(false);
    }
  };

  // Deploy to Frontline
  const [isDeployModalOpen, setIsDeployModalOpen] = useState(false);
  const [deployName, setDeployName] = useState('');
  const [deployCategory, setDeployCategory] = useState('Shop Floor');
  const [deployPublish, setDeployPublish] = useState(true);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployedApp, setDeployedApp] = useState(null);

  const handleOpenDeployModal = () => {
    const mainCode = vfs.readFile('/App.js') || vfs.readFile('/App.jsx') || effectiveInitialCode;
    const schema = extractTableSchemaFromCode(mainCode);
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
    const mainCode = vfs.readFile('/App.js') || vfs.readFile('/App.jsx') || effectiveInitialCode;
    try {
      const saved = await deployVibeAppToFrontline({
        name: deployName.trim(),
        category: deployCategory,
        code: mainCode,
        isPublished: deployPublish
      });
      setDeployedApp(saved);
      setIsDeployModalOpen(false);
      toast.success(`🚀 Aplikasi "${saved.name}" berhasil di-deploy ke Frontline Apps!`, { duration: 5000, icon: '🎉' });
    } catch (err) {
      toast.error(`Gagal deploy aplikasi: ${err.message || 'Database error'}`);
    } finally {
      setIsDeploying(false);
    }
  };

  // Copy active code
  const handleCopyCode = async () => {
    try {
      const activeCode = vfs.readFile(activeFilePath) || '';
      await navigator.clipboard.writeText(activeCode);
      setCopied(true);
      toast.success(`Kode ${activeFilePath} disalin ke clipboard!`);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Gagal menyalin kode');
    }
  };

  // Switch App Mode (Web vs Mobile)
  const handleSwitchAppMode = (mode) => {
    setAppMode(mode);
    toast(`Beralih ke mode ${mode === 'mobile' ? 'Mobile App (Ionic + Capacitor)' : 'Web App (React + Tailwind)'}`, { icon: '🔄' });
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-2xl" style={{ minHeight: '580px' }}>
      
      {/* ═══════════ TOP NAVBAR ═══════════ */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 16px', backgroundColor: 'rgba(15, 23, 42, 0.95)',
        backdropFilter: 'blur(12px)', borderBottom: '1px solid #1e293b',
        color: '#cbd5e1', userSelect: 'none', gap: '8px', flexShrink: 0
      }}>
        {/* Left: Branding & Mode Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          <div style={{
            width: '24px', height: '24px', borderRadius: '8px',
            background: 'linear-gradient(135deg, #f43f5e, #f59e0b, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Sparkles size={13} color="#fff" />
          </div>
          <span style={{ fontWeight: 800, color: '#fff', fontSize: '0.875rem' }}>
            {deployedApp?.name || 'MaviCore Copilot Engine'}
          </span>

          {/* Mode Switcher: Web App vs Mobile App */}
          <div style={{
            display: 'flex', alignItems: 'center', backgroundColor: '#020617',
            padding: '2px', borderRadius: '8px', border: '1px solid #1e293b', marginLeft: '6px'
          }}>
            <button
              type="button"
              onClick={() => handleSwitchAppMode('web')}
              style={{
                padding: '3px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: appMode === 'web' ? 700 : 500,
                border: 'none', cursor: 'pointer',
                backgroundColor: appMode === 'web' ? '#1e293b' : 'transparent',
                color: appMode === 'web' ? '#38bdf8' : '#64748b'
              }}
            >
              WEB APP
            </button>
            <button
              type="button"
              onClick={() => handleSwitchAppMode('mobile')}
              style={{
                padding: '3px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: appMode === 'mobile' ? 700 : 500,
                border: 'none', cursor: 'pointer',
                backgroundColor: appMode === 'mobile' ? '#1e293b' : 'transparent',
                color: appMode === 'mobile' ? '#a5b4fc' : '#64748b'
              }}
            >
              MOBILE APP
            </button>
          </div>

          {/* Undo AI Change */}
          {versionControl.canUndo() && (
            <button
              type="button"
              onClick={handleUndo}
              style={{
                display: 'flex', alignItems: 'center', gap: '4px', padding: '3px 8px',
                borderRadius: '6px', backgroundColor: '#1e293b', border: '1px solid rgba(51,65,85,0.6)',
                color: '#cbd5e1', fontSize: '0.72rem', cursor: 'pointer'
              }}
              title="Undo perubahan AI"
            >
              <RotateCcw size={11} />
              <span>Undo AI</span>
            </button>
          )}
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

          {/* Reload + Fullscreen */}
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

        {/* Right: Actions (Build APK, Connect DB, Publish) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          {/* Build APK / Mobile Button */}
          <button
            type="button"
            onClick={() => setIsBuildModalOpen(true)}
            style={{
              padding: '5px 12px', borderRadius: '9999px', backgroundColor: '#1e293b',
              border: '1px solid #334155', color: '#38bdf8', fontSize: '0.72rem',
              fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px',
              cursor: 'pointer', transition: 'all 0.15s'
            }}
            title="Build APK / AAB / Web"
          >
            <MobileIcon size={12} />
            <span>Build APK</span>
          </button>

          {/* Copy Code */}
          <button
            type="button"
            onClick={handleCopyCode}
            style={{
              padding: '5px 12px', borderRadius: '9999px', backgroundColor: '#1e293b',
              border: '1px solid #334155', color: '#e2e8f0', fontSize: '0.72rem',
              fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer'
            }}
            title="Copy Code"
          >
            {copied ? <Check size={12} color="#34d399" /> : null}
            <span>Copy</span>
          </button>

          {/* Connect DB */}
          <button
            type="button"
            onClick={handleSyncTable}
            disabled={isSyncingTable}
            style={{
              padding: '5px 12px', borderRadius: '9999px', fontSize: '0.72rem', fontWeight: 700,
              display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer',
              backgroundColor: connectedTable ? 'rgba(147,51,234,0.15)' : '#9333ea',
              color: connectedTable ? '#c4b5fd' : '#fff',
              border: connectedTable ? '1px solid rgba(147,51,234,0.4)' : 'none',
            }}
            title="Connect MaviCore Database"
          >
            <Database size={12} className={isSyncingTable ? 'animate-spin' : ''} />
            <span>{connectedTable ? `${connectedTable.name}${liveRecordCount > 0 ? ` (${liveRecordCount})` : ''}` : 'Connect DB'}</span>
          </button>

          {/* Publish */}
          <button
            type="button"
            onClick={handleOpenDeployModal}
            style={{
              padding: '5px 14px', borderRadius: '9999px', backgroundColor: '#2563eb',
              color: '#fff', fontSize: '0.72rem', fontWeight: 700, border: 'none',
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
                border: 'none', borderRadius: '9999px', cursor: 'pointer', display: 'flex', alignItems: 'center'
              }}
              title="Tutup Studio"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* ═══════════ MAIN WORKSPACE (LEFT FILES + CENTER SANDPACK + RIGHT COPILOT) ═══════════ */}
      <div className="flex-1 w-full overflow-hidden bg-slate-950 flex" style={{ minHeight: 0, height: '100%' }}>

        {/* 1. LEFT FILE TREE PANEL (Collapsible) */}
        <div style={{
          width: isFilesPanelOpen ? '200px' : '0px',
          minWidth: isFilesPanelOpen ? '200px' : '0px',
          transition: 'width 0.2s ease, min-width 0.2s ease',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {isFilesPanelOpen && (
            <FileTreeExplorer
              tree={fileTree}
              activePath={activeFilePath}
              onSelectFile={(path) => setActiveFilePath(path)}
              onCreateFile={(newPath) => {
                vfs.writeFile(newPath, '// New file\n');
                setFilesRecord(vfs.getAllFilesRecord());
                setFileTree(vfs.getFileTree());
                setActiveFilePath(newPath);
              }}
              onDeleteFile={(delPath) => {
                vfs.deleteFile(delPath);
                setFilesRecord(vfs.getAllFilesRecord());
                setFileTree(vfs.getFileTree());
                if (activeFilePath === delPath) setActiveFilePath('/App.js');
              }}
              onOpenTemplates={() => setIsTemplatesModalOpen(true)}
            />
          )}
        </div>

        {/* Toggle Files Panel button */}
        <button
          type="button"
          onClick={() => setIsFilesPanelOpen(v => !v)}
          style={{
            width: '18px', backgroundColor: '#0a0f1d', borderRight: '1px solid #1e293b',
            borderLeft: 'none', borderTop: 'none', borderBottom: 'none',
            color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
          title={isFilesPanelOpen ? 'Tutup File Explorer' : 'Buka File Explorer'}
        >
          {isFilesPanelOpen ? <PanelLeftClose size={12} /> : <PanelLeftOpen size={12} />}
        </button>

        {/* 2. CENTER: SANDPACK EDITOR + LIVE PREVIEW */}
        <div className="vibe-sandpack-root flex-1 overflow-hidden bg-slate-950 flex flex-col" style={{ minWidth: 0, height: '100%', position: 'relative' }}>
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

          <SandpackProvider
            key={activeFilePath + Object.keys(filesRecord).length}
            template="react"
            theme="dark"
            files={filesRecord}
            customSetup={{
              dependencies: {
                '@ionic/react': '^7.0.0',
                'ionicons': '^7.0.0',
                'lucide-react': 'latest',
                'recharts': 'latest'
              }
            }}
            options={{
              activeFile: activeFilePath,
              visibleFiles: [activeFilePath],
              externalResources: [
                'https://cdn.tailwindcss.com',
                'https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css',
                'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap'
              ]
            }}
          >
            {/* Listener capturing Sandpack compilation & runtime errors */}
            <SandpackErrorListener
              onError={(err) => {
                setErrors(prev => [err, ...prev.slice(0, 4)]);
                setIsTerminalPanelOpen(true);
              }}
              onLog={(text) => {
                setLogs(prev => [...prev, { timestamp: new Date(), text }]);
              }}
            />

            <SandpackLayout style={{ height: '100%', minHeight: '100%', border: 'none', borderRadius: 0, flex: 1, display: 'flex' }}>
              {(viewMode === 'split' || viewMode === 'code') && (
                <SandpackCodeEditor
                  showLineNumbers
                  showInlineErrors
                  wrapContent
                  style={{
                    height: '100%',
                    minHeight: '100%',
                    width: viewMode === 'code' ? '100%' : '42%',
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
                  {/* Device Container */}
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
                    transition: 'width 0.3s ease, max-height 0.3s ease',
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
                        height: '34px', backgroundColor: '#0f172a', borderBottom: '1px solid #1e293b',
                        display: 'flex', alignItems: 'center', padding: '0 12px', gap: '12px', flexShrink: 0
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#ef4444' }} />
                          <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#f59e0b' }} />
                          <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10b981' }} />
                        </div>
                        <div style={{
                          flex: 1, maxWidth: '480px', margin: '0 auto', height: '22px', backgroundColor: '#030712',
                          borderRadius: '6px', border: '1px solid #1e293b', display: 'flex', alignItems: 'center',
                          padding: '0 8px', gap: '6px', fontSize: '0.7rem', color: '#94a3b8'
                        }}>
                          <Lock size={10} color="#34d399" />
                          <span style={{ color: '#e2e8f0', fontWeight: 600 }}>https://mavicore.mes</span>
                          <span style={{ color: '#64748b' }}>/runtime</span>
                        </div>
                      </div>
                    )}

                    {/* Sandpack Preview */}
                    <div style={{ flex: 1, minHeight: 0, width: '100%', height: '100%', overflow: 'hidden' }}>
                      <SandpackPreview
                        showOpenInCodeSandbox={false}
                        showRefreshButton={true}
                        style={{ height: '100%', width: '100%', backgroundColor: '#030712' }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </SandpackLayout>
          </SandpackProvider>

          {/* 3. BOTTOM TERMINAL & AUTO-FIX PANEL */}
          <BottomTerminalPanel
            isOpen={isTerminalPanelOpen}
            onToggleOpen={() => setIsTerminalPanelOpen(v => !v)}
            logs={logs}
            errors={errors}
            aiActivity={aiActivity}
            isAutoFixing={isAutoFixing}
            onTriggerAutoFix={handleTriggerAutoFix}
            onClearLogs={() => setLogs([])}
          />
        </div>

        {/* 4. RIGHT SIDE: AI COPILOT CHAT PANEL */}
        <div style={{
          width: isChatPanelOpen ? '340px' : '0px',
          minWidth: isChatPanelOpen ? '340px' : '0px',
          transition: 'width 0.25s ease, min-width 0.25s ease',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          borderLeft: isChatPanelOpen ? '1px solid #1e293b' : 'none',
          backgroundColor: '#0a0f1a'
        }}>
          {isChatPanelOpen && (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '340px' }}>
              {/* Header */}
              <div style={{
                padding: '12px 14px', borderBottom: '1px solid #1e293b',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '26px', height: '26px', borderRadius: '8px', background: 'linear-gradient(135deg, #0ea5e9, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Bot size={15} color="#fff" />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#f1f5f9' }}>MaviCore Copilot</div>
                    <div style={{ fontSize: '0.65rem', color: '#64748b' }}>AI Coding Agent • Multi-File</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsChatPanelOpen(false)}
                  style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}
                >
                  <PanelLeftClose size={15} />
                </button>
              </div>

              {/* Chat messages */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {chatHistory.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '24px 10px', color: '#64748b' }}>
                    <Sparkles size={28} color="#38bdf8" style={{ margin: '0 auto 10px' }} />
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#e2e8f0', marginBottom: '4px' }}>
                      Halo! Saya MaviCore Copilot
                    </div>
                    <div style={{ fontSize: '0.72rem', lineHeight: '1.4' }}>
                      Deskripsikan aplikasi manufaktur yang ingin dibuat atau dimodifikasi, dan saya akan merancang kode multi-file secara otomatis.
                    </div>
                  </div>
                ) : (
                  chatHistory.map((msg, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex', flexDirection: 'column',
                        alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start', gap: '4px'
                      }}
                    >
                      <div style={{
                        maxWidth: '92%', padding: '10px 14px',
                        borderRadius: msg.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                        backgroundColor: msg.role === 'user' ? '#1e1b4b' : '#0c1929',
                        border: `1px solid ${msg.role === 'user' ? 'rgba(99, 102, 241, 0.3)' : 'rgba(14, 165, 233, 0.25)'}`,
                        color: msg.role === 'user' ? '#e0e7ff' : '#bae6fd',
                        fontSize: '0.75rem', lineHeight: 1.5, wordBreak: 'break-word', whiteSpace: 'pre-wrap'
                      }}>
                        {msg.content}
                      </div>
                    </div>
                  ))
                )}

                {(internalAiLoading || isLoading) && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', backgroundColor: '#0c1929', borderRadius: '12px', border: '1px solid rgba(14,165,233,0.2)' }}>
                    <Loader2 size={14} className="animate-spin text-sky-400" />
                    <span style={{ fontSize: '0.72rem', color: '#7dd3fc' }}>
                      {aiActivity?.message || 'Menganalisis & merancang kode...'}
                    </span>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Suggestions chips */}
              <div style={{ padding: '6px 12px', borderTop: '1px solid #1e293b', display: 'flex', gap: '6px', overflowX: 'auto', flexShrink: 0 }}>
                {[
                  { label: '📋 Digital Checksheet', prompt: 'Buatkan aplikasi Digital Checksheet untuk inspeksi 5 poin mesin' },
                  { label: '📊 Gauge OEE', prompt: 'Tambahkan gauge OEE real-time dan timeline status lini' },
                  { label: '🔍 Toleransi Part', prompt: 'Tambahkan verifikasi toleransi dimensi part PASS/FAIL' },
                  { label: '📱 Mode Mobile', prompt: 'Konversikan tampilan menjadi mobile app Ionic ramah sentuhan' }
                ].map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleChatSubmit(item.prompt)}
                    disabled={internalAiLoading || isLoading}
                    style={{
                      whiteSpace: 'nowrap', fontSize: '0.62rem', padding: '4px 8px', borderRadius: '6px',
                      backgroundColor: '#111827', border: '1px solid #1e293b', color: '#94a3b8', cursor: 'pointer'
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Chat Input form */}
              <div style={{ padding: '10px 12px', borderTop: '1px solid #1e293b', backgroundColor: '#0f172a', flexShrink: 0 }}>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleChatSubmit(inlinePrompt);
                  }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    backgroundColor: '#020617', border: '1px solid #1e293b',
                    borderRadius: '12px', padding: '6px 10px'
                  }}
                >
                  <input
                    type="text"
                    value={inlinePrompt}
                    onChange={(e) => setInlinePrompt(e.target.value)}
                    disabled={internalAiLoading || isLoading}
                    placeholder={internalAiLoading || isLoading ? 'AI sedang menulis...' : 'Instruksikan Copilot...'}
                    style={{ flex: 1, backgroundColor: 'transparent', border: 'none', outline: 'none', fontSize: '0.76rem', color: '#f1f5f9' }}
                  />
                  <button
                    type="submit"
                    disabled={!inlinePrompt.trim() || internalAiLoading || isLoading}
                    style={{
                      width: '30px', height: '30px', borderRadius: '8px', border: 'none',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: inlinePrompt.trim() && !(internalAiLoading || isLoading) ? 'linear-gradient(135deg, #0ea5e9, #6366f1)' : '#1e293b',
                      color: inlinePrompt.trim() && !(internalAiLoading || isLoading) ? '#fff' : '#475569',
                      cursor: inlinePrompt.trim() && !(internalAiLoading || isLoading) ? 'pointer' : 'not-allowed'
                    }}
                  >
                    {internalAiLoading || isLoading ? <Loader2 size={14} className="animate-spin" /> : <ArrowUp size={14} />}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>

        {/* Toggle Chat panel when closed */}
        {!isChatPanelOpen && (
          <button
            type="button"
            onClick={() => setIsChatPanelOpen(true)}
            style={{
              position: 'absolute', right: '12px', bottom: '16px', zIndex: 30,
              width: '40px', height: '40px', borderRadius: '12px',
              background: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 8px 20px rgba(14, 165, 233, 0.3)'
            }}
            title="Buka AI Copilot"
          >
            <Bot size={18} />
          </button>
        )}
      </div>

      {/* ═══════════ MODALS ═══════════ */}
      {/* 1. AI Changes Review Modal */}
      <AiChangesReviewModal
        isOpen={isReviewModalOpen}
        fileActions={pendingFileActions}
        onApply={handleApplyFileActions}
        onReject={handleRejectFileActions}
      />

      {/* 2. Manufacturing Templates Modal */}
      <ManufacturingTemplatesModal
        isOpen={isTemplatesModalOpen}
        onClose={() => setIsTemplatesModalOpen(false)}
        onSelectTemplate={(tmpl) => handleChatSubmit(tmpl.prompt)}
      />

      {/* 3. Build & Compiler Modal */}
      <BuildModal
        isOpen={isBuildModalOpen}
        onClose={() => setIsBuildModalOpen(false)}
        projectFiles={filesRecord}
        appName={deployedApp?.name || 'MaviCore App'}
      />

      {/* 4. Deploy to Frontline Modal */}
      {isDeployModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', maxWidth: '440px', width: '100%', padding: '24px' }}>
            <h3 style={{ margin: '0 0 16px', color: '#fff', fontSize: '1.1rem' }}>Deploy ke Frontline Apps</h3>
            <form onSubmit={handleConfirmDeploy} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#94a3b8', marginBottom: '6px' }}>Nama Aplikasi</label>
                <input
                  type="text"
                  value={deployName}
                  onChange={e => setDeployName(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', backgroundColor: '#020617', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#94a3b8', marginBottom: '6px' }}>Kategori</label>
                <select
                  value={deployCategory}
                  onChange={e => setDeployCategory(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', backgroundColor: '#020617', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }}
                >
                  <option value="Shop Floor">Shop Floor</option>
                  <option value="Quality Control">Quality Control</option>
                  <option value="Warehouse">Warehouse</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Management">Management</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  id="deployPublishCheck"
                  checked={deployPublish}
                  onChange={e => setDeployPublish(e.target.checked)}
                />
                <label htmlFor="deployPublishCheck" style={{ fontSize: '0.78rem', color: '#cbd5e1', cursor: 'pointer' }}>
                  Publikasikan langsung ke operator shop floor
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
                <button type="button" onClick={() => setIsDeployModalOpen(false)} style={{ padding: '8px 16px', borderRadius: '8px', backgroundColor: '#1e293b', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>Batal</button>
                <button type="submit" disabled={isDeploying} style={{ padding: '8px 20px', borderRadius: '8px', backgroundColor: '#2563eb', border: 'none', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>
                  {isDeploying ? 'Deploying...' : 'Deploy Sekarang'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

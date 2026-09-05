import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Send, X, Sparkles, User, Bot, Loader2,
  Trash2, BrainCircuit, Code, PlusCircle, Image as ImageIcon,
  CheckCircle2, AlertCircle, Wand2, Zap, LayoutTemplate,
  RotateCcw, RotateCw, ChevronDown, ChevronUp,
  MousePointer2, Layers, Settings, Plus, Activity,
  Type, BarChart3, Table, ToggleLeft, Camera, Hash,
  Square, Circle, Gauge, Bell, SlidersHorizontal,
  Stethoscope, History, Eye, EyeOff, Link, Database, ClipboardList,
  Check, Edit3, Mic, Download, Maximize2, Minimize2, PanelLeftClose, PanelLeftOpen, ArrowUp
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { getPrimaryAiConnector, saveIntegrationConnector } from '../utils/database';
import { getBuilderCopilotAdvice, getBuilderVisionAdvice, streamBuilderCopilotAdvice, diagnoseApp } from '../utils/aiService';
import { sanitizeCopilotCommands } from '../utils/copilotSafety';
import { getAllFrontlineApps } from '../utils/supabaseFrontlineDB';
import { getSupabaseClient, isSupabaseReady } from '../utils/supabaseManualDB';

// Widget type → icon/color mapping
const WIDGET_META = {
  BUTTON:       { icon: Square,           color: '#3b82f6', bg: '#eff6ff',  label: 'Button' },
  TEXT:         { icon: Type,             color: '#8b5cf6', bg: '#f5f3ff',  label: 'Text' },
  INPUT:        { icon: Type,             color: '#0ea5e9', bg: '#f0f9ff',  label: 'Input' },
  TABLE:        { icon: Table,            color: '#10b981', bg: '#ecfdf5',  label: 'Table' },
  CHART:        { icon: BarChart3,        color: '#f59e0b', bg: '#fffbeb',  label: 'Chart' },
  IMAGE:        { icon: ImageIcon,        color: '#ec4899', bg: '#fdf2f8',  label: 'Image' },
  TOGGLE:       { icon: ToggleLeft,       color: '#06b6d4', bg: '#ecfeff',  label: 'Toggle' },
  GAUGE:        { icon: Gauge,            color: '#f97316', bg: '#fff7ed',  label: 'Gauge' },
  CAMERA:       { icon: Camera,           color: '#64748b', bg: '#f8fafc',  label: 'Camera' },
  LABEL:        { icon: Type,             color: '#7c3aed', bg: '#f5f3ff',  label: 'Label' },
  SLIDER:       { icon: SlidersHorizontal,color: '#0891b2', bg: '#ecfeff',  label: 'Slider' },
  NOTIFICATION: { icon: Bell,             color: '#dc2626', bg: '#fef2f2',  label: 'Notification' },
  KPI:          { icon: Activity,         color: '#16a34a', bg: '#f0fdf4',  label: 'KPI Card' },
  DEFAULT:      { icon: Square,           color: '#64748b', bg: '#f8fafc',  label: 'Widget' },
};

const getWidgetMeta = (type = '') => {
  const key = type.toUpperCase().replace(/_/g, '');
  return WIDGET_META[type.toUpperCase()] || WIDGET_META[key] || WIDGET_META.DEFAULT;
};

// ─── UPGRADE 7: Command Preview helper ──────────────────────────────────────────
const getCommandPreview = (cmd) => {
  const p = cmd.payload || {};
  switch (cmd.type) {
    case 'ADD_WIDGET': return `Tambah ${p.type} "${p.displayName || p.type}" di (${p.x}, ${p.y})`;
    case 'UPDATE_WIDGET': return `Update props ${Object.keys(p.props || {}).join(', ')} pada "${p.widgetName || p.widgetId}"`.slice(0,80);
    case 'DELETE_WIDGET': return `⚠️ HAPUS widget "${p.widgetName}" — permanen!`;
    case 'CREATE_TRIGGER': return `Trigger ${p.event} → "${p.widgetId || 'global'}" (${(p.actions||[]).length} aksi)`;
    case 'CREATE_FUNCTION': return `⚡ Function baru: "${p.name}" — ${p.description || 'tanpa deskripsi'}`;
    case 'UPDATE_FUNCTION': return `✏️ Update function "${p.functionName || p.name}"`;
    case 'DELETE_FUNCTION': return `⚠️ Hapus function "${p.functionName || p.name}"`;
    case 'CREATE_AUTOMATION': return `🤖 Automation baru: "${p.name}" — ${p.description || 'tanpa deskripsi'}`;
    case 'UPDATE_AUTOMATION': return `✏️ Update automation "${p.automationName || p.name}"`;
    case 'DELETE_AUTOMATION': return `⚠️ Hapus automation "${p.automationName || p.name}"`;
    case 'CREATE_TABLE': return `Tabel "${p.name}" (${(p.columns||[]).length} kolom)`;
    case 'CREATE_VARIABLE': return `Variable "${p.name}" tipe ${p.type} = ${p.defaultValue}`;
    case 'GO_TO_STEP': return `Navigasi ke screen "${p.stepId}"`;
    case 'DELETE_STEP': return `⚠️ HAPUS screen "${p.stepTitle}" — permanen!`;
    case 'ADD_STEP': return `Screen baru: "${p.title || p.payload?.title}"`;
    case 'SET_APP_NAME': return `Ganti nama app → "${typeof p === 'string' ? p : p.name}"`;
    default: return cmd.type.replace(/_/g, ' ');
  }
};

const parsePlan = (text) => {
  if (!text) return null;
  const planRegex = /<ai_plan>([\s\S]*?)<\/ai_plan>/gi;
  const match = planRegex.exec(text);
  return match ? match[1].trim() : null;
};

// ─── UPGRADE 5: Smart quick actions per widget type ──────────────────────────────
const getSmartActions = (widget, context) => {
  const name = widget.displayName || widget.props?.label || widget.type;
  const id = widget.id;
  const tables = (context?.tables || []).map(t => t.name).join(', ') || 'tabel yang ada';
  const placeholders = (context?.recordPlaceholders || []).map(r => r.name).join(', ');
  const screens = (context?.steps || []).map(s => s.title).join(', ');
  const functions = (context?.functions || []).map(f => f.name).join(', ');
  const hasTrigger = (widget.props?.triggers || []).length > 0;
  const hasBinding = !!widget.props?.targetVariable;

  const editStyle = { icon: '✏️', label: 'Edit Style', prompt: `Ubah tampilan widget "${name}" (${widget.type}): warna, font, ukuran, border radius` };

  switch (widget.type) {
    case 'BUTTON': return [
      editStyle,
      { icon: '💾', label: 'Save → Table', prompt: `Buat trigger ON_CLICK pada button "${name}" untuk save data form ke tabel` },
      { icon: '🔗', label: 'Navigate →', prompt: `Buat trigger ON_CLICK pada button "${name}" untuk navigasi ke screen lain. Screens tersedia: ${screens}` },
      { icon: '📢', label: 'Show Notif', prompt: `Buat trigger ON_CLICK pada button "${name}" untuk menampilkan notifikasi sukses` },
      { icon: '🤖', label: 'Run Function', prompt: `Buat trigger ON_CLICK pada button "${name}" untuk menjalankan function. Functions: ${functions || 'belum ada, buat dulu'}` },
      { icon: '🌐', label: 'Send Webhook', prompt: `Buat trigger ON_CLICK pada button "${name}" untuk send webhook ke URL eksternal` },
    ];
    case 'TEXT_INPUT':
    case 'TEXT_AREA':
    case 'NUMBER_INPUT': return [
      editStyle,
      { icon: '🔗', label: 'Bind to Table', prompt: `Bind widget "${name}" ke kolom di tabel: ${tables}. Set targetVariable prop yang sesuai` },
      { icon: '⚡', label: 'On Change Trigger', prompt: `Buat trigger ON_CHANGE pada "${name}" untuk menjalankan aksi saat nilai berubah` },
      { icon: '✅', label: 'Add Validation', prompt: `Tambahkan validasi input untuk "${name}": required field, min/max value, atau format check` },
      { icon: '📌', label: 'Bind Variable', prompt: `Bind "${name}" ke variable app untuk menyimpan nilainya` },
    ];
    case 'DROPDOWN':
    case 'RADIO_GROUP':
    case 'CHECKBOX':
    case 'BOOLEAN_TOGGLE': return [
      editStyle,
      { icon: '🔗', label: 'Bind to Table', prompt: `Bind dropdown "${name}" ke kolom tabel: ${tables}` },
      { icon: '⚡', label: 'On Change Trigger', prompt: `Buat trigger ON_CHANGE pada "${name}" untuk filter data atau update widget lain` },
      { icon: '📋', label: 'Set Options', prompt: `Update pilihan/options pada widget "${name}" dengan daftar yang relevan` },
    ];
    case 'INTERACTIVE_TABLE': return [
      { icon: '🗄️', label: 'Connect Table', prompt: `Connect widget tabel "${name}" ke database tabel. Tables: ${tables}` },
      { icon: '🔍', label: 'Add Filter', prompt: `Tambahkan kemampuan filter/search pada tabel "${name}"` },
      { icon: '📤', label: 'Export Button', prompt: `Tambahkan button Export CSV di dekat tabel "${name}"` },
      { icon: '➕', label: 'Add Row Button', prompt: `Tambahkan button untuk menambah row baru ke tabel "${name}"` },
      editStyle,
    ];
    case 'CHART':
    case 'GAUGE':
    case 'DIAL_GAUGE':
    case 'GAUGE_CIRCULAR': return [
      { icon: '🗄️', label: 'Connect Data', prompt: `Connect chart/gauge "${name}" ke tabel untuk menampilkan data real: ${tables}` },
      editStyle,
      { icon: '🎨', label: 'Change Type', prompt: `Ubah tipe chart "${name}" (Bar, Line, Pie, Area)` },
      { icon: '⚡', label: 'Auto Refresh', prompt: `Tambahkan timer trigger untuk auto-refresh data chart "${name}" setiap 30 detik` },
    ];
    case 'MACHINE_STATUS':
    case 'MACHINE_TIMELINE': return [
      { icon: '🔧', label: 'Connect Machine', prompt: `Connect widget "${name}" ke machine/device yang tersedia` },
      editStyle,
      { icon: '⚡', label: 'Status Trigger', prompt: `Buat trigger saat status machine berubah pada "${name}"` },
    ];
    case 'SIGNATURE':
    case 'SIGNATURE_PAD': return [
      editStyle,
      { icon: '💾', label: 'Save Signature', prompt: `Buat trigger untuk menyimpan signature dari "${name}" ke tabel` },
      { icon: '✅', label: 'Require Sign', prompt: `Set signature "${name}" sebagai required sebelum submit form` },
    ];
    case 'CAMERA_CAPTURE':
    case 'IMAGE': return [
      editStyle,
      { icon: '💾', label: 'Save Photo', prompt: `Buat trigger untuk menyimpan foto dari "${name}" ke tabel atau variable` },
    ];
    default: return [
      editStyle,
      { icon: '⚡', label: 'Add Trigger', prompt: `Tambahkan trigger ke widget "${name}" (${widget.type}) saat diklik` },
      { icon: '🔗', label: 'Bind Data', prompt: `Bind widget "${name}" ke data dari tabel atau variable: ${tables}` },
      { icon: '🤖', label: 'Add Function', prompt: `Tambahkan function call pada widget "${name}"` },
    ];
  }
};

// ─── Selected Widget Context Panel ─────────────────────────────────────────────
const WidgetContextPanel = ({ widget, onPrompt, onSendToChat, context }) => {
  const [showProps, setShowProps] = useState(false);
  if (!widget) return null;

  const meta = getWidgetMeta(widget.type);
  const IconComponent = meta.icon;
  const widgetName = widget.displayName || widget.props?.label || widget.type;
  const triggerCount = (widget.props?.triggers || []).length;
  const hasBinding = !!widget.props?.targetVariable;
  const hasTableId = !!widget.props?.tableId;

  const smartActions = getSmartActions(widget, context);

  return (
    <div style={{
      margin: '0',
      padding: '8px 12px',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
      borderBottom: '1px solid rgba(255,255,255,0.08)',
      flexShrink: 0,
    }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
          <div style={{
            width: '26px', height: '26px', borderRadius: '7px',
            backgroundColor: meta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: `1px solid ${meta.color}30`, flexShrink: 0
          }}>
            <IconComponent size={14} color={meta.color} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, overflow: 'hidden' }}>
            <span style={{
              fontSize: '0.78rem', fontWeight: 700, color: '#f1f5f9',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
            }}>
              {widgetName}
            </span>
            <span style={{ fontSize: '0.58rem', fontWeight: 800, textTransform: 'uppercase', color: meta.color, background: meta.bg, padding: '1px 5px', borderRadius: '4px', flexShrink: 0 }}>
              {widget.type}
            </span>
            {triggerCount > 0 && <span style={{ fontSize: '0.58rem', fontWeight: 700, color: '#fbbf24', flexShrink: 0 }}>⚡ {triggerCount}t</span>}
            {hasBinding && <span style={{ fontSize: '0.58rem', fontWeight: 700, color: '#34d399', flexShrink: 0 }}>🔗 bound</span>}
            {hasTableId && <span style={{ fontSize: '0.58rem', fontWeight: 700, color: '#60a5fa', flexShrink: 0 }}>🗄️ table</span>}
            {!triggerCount && !hasBinding && <span style={{ fontSize: '0.58rem', fontWeight: 700, color: '#f87171', flexShrink: 0 }}>⚠️ orphan</span>}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
          <button
            onClick={() => setShowProps(v => !v)}
            title="Toggle property inspector"
            style={{ padding: '4px 6px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#94a3b8', fontSize: '0.62rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}
          >
            {showProps ? <EyeOff size={11} /> : <Eye size={11} />}
          </button>
          <button
            onClick={onSendToChat}
            title="Send widget context to chat"
            style={{ padding: '4px 8px', background: 'rgba(59,130,246,0.2)', border: '1px solid rgba(59,130,246,0.4)', borderRadius: '6px', color: '#93c5fd', fontSize: '0.65rem', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '4px', transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(59,130,246,0.35)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(59,130,246,0.2)'; }}
          >
            <MousePointer2 size={11} /> Chat
          </button>
        </div>
      </div>

      {/* Mini Property Inspector */}
      {showProps && (
        <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '8px', padding: '6px 8px', marginTop: '6px', fontSize: '0.65rem', color: '#94a3b8', display: 'flex', flexDirection: 'column', gap: '3px' }}>
          <div>📍 Pos: ({widget.x}, {widget.y}) &nbsp;|&nbsp; Size: {widget.w}×{widget.h}</div>
          {widget.props?.targetVariable && <div style={{ color: '#34d399' }}>🔗 Bound: {widget.props.targetVariable}</div>}
          {widget.props?.tableId && <div style={{ color: '#60a5fa' }}>🗄️ Table: {widget.props.tableId}</div>}
          {widget.props?.text && <div>📝 Text: "{String(widget.props.text).slice(0,30)}{String(widget.props.text).length > 30 ? '…' : ''}"</div>}
          {widget.props?.hint && <div>💬 Hint: "{widget.props.hint}"</div>}
          {(widget.props?.triggers || []).length > 0 && (
            <div style={{ color: '#fbbf24' }}>⚡ Triggers: {(widget.props.triggers || []).map(t => t.event).join(', ')}</div>
          )}
          {widget.id && <div style={{ color: '#475569' }}>🔑 ID: {widget.id.slice(0,20)}</div>}
        </div>
      )}

      {/* Smart Quick action buttons - Compact horizontal flex pills */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '6px' }}>
        {smartActions.slice(0, 6).map((action, i) => (
          <button
            key={i}
            onClick={() => onPrompt(action.prompt)}
            title={action.prompt.slice(0, 100)}
            style={{
              padding: '3px 8px', borderRadius: '6px',
              background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
              color: '#e2e8f0', fontSize: '0.66rem', fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '4px',
              transition: 'all 0.15s', whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.25)'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)'; e.currentTarget.style.color = '#ffffff'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = '#e2e8f0'; }}
          >
            <span style={{ fontSize: '0.72rem', flexShrink: 0 }}>{action.icon}</span>
            <span>{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

// ─── Typing dots animation ─────────────────────────────────────────────────────
const TypingDots = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '14px 18px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '4px 20px 20px 20px', width: 'fit-content', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
    {[0, 1, 2].map(i => (
      <div key={i} style={{
        width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#94a3b8',
        animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
      }} />
    ))}
    <style>{`
      @keyframes bounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-6px)} }
      @keyframes pulse-red { 0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); } 70% { box-shadow: 0 0 0 8px rgba(239, 68, 68, 0); } 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); } }
    `}</style>
  </div>
);

// ─── Command type badge colors ─────────────────────────────────────────────────
const getCmdStyle = (type = '') => {
  if (type.startsWith('ADD') || type.startsWith('CREATE')) return { bg: '#ecfdf5', color: '#059669' };
  if (type.startsWith('DELETE')) return { bg: '#fef2f2', color: '#dc2626' };
  if (type.startsWith('UPDATE')) return { bg: '#eff6ff', color: '#2563eb' };
  if (type === 'SET_APP_NAME') return { bg: '#fefce8', color: '#ca8a04' };
  return { bg: '#f1f5f9', color: '#475569' };
};

// ─── Main Component ────────────────────────────────────────────────────────────
const BuilderCopilot = ({
  isOpen,
  onClose,
  context,
  onApplyCommand,
  onHoverCommand,
  onLeaveCommand,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  hasSnapshot,
  selectedWidget,
  onOpenCopilot,
  onOpenSandbox = null,
}) => {
  const STORAGE_KEY = 'mandor_copilot_history';

  const loadMessages = () => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(m => ({ ...m, timestamp: new Date(m.timestamp) }));
        }
      }
    } catch (e) { /* ignore */ }
    return [{
      role: 'assistant',
      content: 'Halo! Saya **Mandor Builder Copilot** — AI Architect untuk aplikasi MES industrial.\n\nSaya bisa:\n• 🏗️ Generate full app dari deskripsi\n• 📊 Buat dashboard KPI & monitoring\n• 📋 Buat form input & quality inspection\n• 🔧 Tambah widget spesifik ke screen\n• 🤖 Buat trigger & automation\n\nApa yang ingin Anda buat hari ini?',
      timestamp: new Date()
    }];
  };

  const [messages, setMessages] = useState(loadMessages);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingText, setStreamingText] = useState('');  // UPGRADE 2: streaming
  const [aiConnector, setAiConnector] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const [commandStatus, setCommandStatus] = useState({});
  const [chipMode, setChipMode] = useState('build');
  const [prevWidget, setPrevWidget] = useState(null);
  // UPGRADE 4: App health issues
  const [appIssues, setAppIssues] = useState([]);
  const [showIssues, setShowIssues] = useState(false);
  // UPGRADE 6: Command log
  const [commandLog, setCommandLog] = useState([]);
  const [showCommandLog, setShowCommandLog] = useState(false);
  // UPGRADE 3: Rolling memory
  const [sessionSummary, setSessionSummary] = useState('');
  const [isDiagnosing, setIsDiagnosing] = useState(false); // UPGRADE 8

  // Enterprise additions: Dry-run checked commands, Listening state, Speech supported
  const [checkedCommands, setCheckedCommands] = useState({});
  const [isListening, setIsListening] = useState(false);
  const [isSpeechSupported, setIsSpeechSupported] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [executionProgress, setExecutionProgress] = useState({ total: 0, current: 0, isActive: false });
  const recognitionRef = useRef(null);

  useEffect(() => {
    setIsSpeechSupported(typeof window !== 'undefined' && !!(window.SpeechRecognition || window.webkitSpeechRecognition));
  }, []);

  // Supabase Realtime listener for logs sent back from Antigravity IDE
  useEffect(() => {
    if (!isSupabaseReady()) return;
    const supabase = getSupabaseClient();
    if (!supabase) return;
    
    let channel = null;
    try {
      channel = supabase
        .channel('antigravity_commands_feedback')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages'
        }, (payload) => {
          const msg = payload.new;
          if (msg.sender_id === 'antigravity') {
            setMessages(prev => [
              ...prev,
              {
                role: 'assistant',
                content: msg.content,
                timestamp: new Date(msg.created_at)
              }
            ]);
          }
        })
        .subscribe();
    } catch (e) {
      console.warn('[BuilderCopilot] Failed to subscribe to channel:', e);
    }

    return () => {
      if (supabase && channel) {
        try {
          supabase.removeChannel(channel);
        } catch (e) {}
      }
    };
  }, []);

  // Related Apps integration states
  const [allApps, setAllApps] = useState([]);
  const [selectedApps, setSelectedApps] = useState([]);
  const [showAppDropdown, setShowAppDropdown] = useState(false);
  const [appSearchQuery, setAppSearchQuery] = useState('');

  // Load frontline apps for related app selector
  useEffect(() => {
    if (isOpen) {
      getAllFrontlineApps().then(apps => {
        // Exclude current app
        const filtered = (apps || []).filter(app => app.name !== context?.appName);
        setAllApps(filtered);
      }).catch(err => {
        console.warn('Failed to fetch frontline apps:', err);
      });
    }
  }, [isOpen, context?.appName]);

  // Canva Design integration states
  const [canvaConnector, setCanvaConnector] = useState(null);
  const [canvaDesigns, setCanvaDesigns] = useState([]);
  const [showCanvaDropdown, setShowCanvaDropdown] = useState(false);
  const [canvaSearchQuery, setCanvaSearchQuery] = useState('');
  const [selectedCanvaDesign, setSelectedCanvaDesign] = useState(null);
  const [isFetchingCanva, setIsFetchingCanva] = useState(false);

  // Load Canva connector and designs list
  useEffect(() => {
    if (isOpen) {
      import('../utils/database').then(({ getIntegrationConnectors }) => {
        getIntegrationConnectors().then(connectors => {
          const canvaConn = (connectors || []).find(c => c.type === 'CANVA');
          if (canvaConn) {
            setCanvaConnector(canvaConn);
            const apiKey = canvaConn.canvaSettings?.apiKey || '';
            if (apiKey) {
              setIsFetchingCanva(true);
              fetch('https://api.canva.com/v1/designs', {
                headers: { 'Authorization': `Bearer ${apiKey}` }
              })
              .then(res => {
                if (res.ok) return res.json();
                throw new Error('Canva API Error');
              })
              .then(data => {
                setCanvaDesigns(data.items || []);
              })
              .catch(err => {
                console.warn('Canva API CORS or connection failed, loading simulation list:', err);
                // Fallback simulation list for user testing
                setCanvaDesigns([
                  { id: 'canva-design-1', name: 'Form Pengeluaran Barang MES' },
                  { id: 'canva-design-2', name: 'Dashboard Gudang & Inventory' },
                  { id: 'canva-design-3', name: 'Form Checklist QC Inspeksi Kualitas' }
                ]);
              })
              .finally(() => {
                setIsFetchingCanva(false);
              });
            }
          } else {
            // Default demo list when no connector is registered yet
            setCanvaDesigns([
              { id: 'canva-design-1', name: 'Form Pengeluaran Barang MES' },
              { id: 'canva-design-2', name: 'Dashboard Gudang & Inventory' },
              { id: 'canva-design-3', name: 'Form Checklist QC Inspeksi Kualitas' }
            ]);
          }
        });
      });
    }
  }, [isOpen]);

  const currentProvider = aiConnector?.aiSettings?.provider || aiConnector?.config?.provider || 'Gemini';
  const currentModelId = aiConnector?.aiSettings?.modelId || aiConnector?.config?.modelId || 'gemini-1.5-flash';

  const handleModelChange = async (newModelId) => {
    if (!aiConnector) return;
    
    // Update local state config
    const updatedConnector = {
      ...aiConnector,
      config: {
        ...(aiConnector.config || {}),
        modelId: newModelId
      },
      aiSettings: {
        ...(aiConnector.aiSettings || {}),
        modelId: newModelId
      }
    };
    setAiConnector(updatedConnector);

    // Save configuration update to database
    try {
      await saveIntegrationConnector(updatedConnector);
    } catch (err) {
      console.warn('Failed to save updated model to database:', err);
    }
  };

  const getModelsListForProvider = (provider) => {
    // If connector has configCache from connection tests, use those
    const cache = aiConnector?.aiSettings?.configCache?.[provider] || aiConnector?.config?.configCache?.[provider];
    if (cache?.availableModels && cache.availableModels.length > 0) {
      return cache.availableModels;
    }
    
    // Fallback static list
    const defaults = {
      Gemini: [
        { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' },
        { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' },
        { id: 'gemini-1.0-pro', name: 'Gemini 1.0 Pro' },
        { id: 'gemini-1.5-flash-002', name: 'Gemini 1.5 Flash-002' }
      ],
      OpenAI: [
        { id: 'gpt-4o-mini', name: 'GPT-4o Mini' },
        { id: 'gpt-4o', name: 'GPT-4o' },
        { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
        { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' }
      ],
      Groq: [
        { id: 'llama-3.1-70b-versatile', name: 'Llama 3.1 70B' },
        { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B' },
        { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B' },
        { id: 'gemma2-9b-it', name: 'Gemma 2 9B' }
      ],
      OpenRouter: [
        { id: 'google/gemini-flash-1.5', name: 'Gemini 1.5 Flash' },
        { id: 'google/gemini-pro-1.5', name: 'Gemini 1.5 Pro' },
        { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini' },
        { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet' },
        { id: 'meta-llama/llama-3-8b-instruct:free', name: 'Llama 3 8B' }
      ],
      Ollama: [
        { id: 'llama3', name: 'Llama 3' },
        { id: 'gemma2', name: 'Gemma 2' },
        { id: 'mistral', name: 'Mistral' },
        { id: 'phi3', name: 'Phi 3' }
      ],
      Custom: []
    };
    
    const list = [...(defaults[provider] || [])];
    if (currentModelId && !list.find(m => m.id === currentModelId)) {
      list.unshift({ id: currentModelId, name: currentModelId });
    }
    return list;
  };

  // Auto-announce newly selected widget in chat
  useEffect(() => {
    if (!isOpen) return;
    if (!selectedWidget) return;
    if (prevWidget?.id === selectedWidget.id) return;
    setPrevWidget(selectedWidget);
    // Don't spam — only announce if different widget
  }, [selectedWidget, isOpen]);

  // UPGRADE 4: App Health Scanner
  useEffect(() => {
    if (!context?.widgets) return;
    const widgets = context.widgets || [];
    const issues = [];
    const inputTypes = ['TEXT_INPUT','NUMBER_INPUT','DROPDOWN','DATE_PICKER','DATETIME_PICKER'];
    const unbound = widgets.filter(w => inputTypes.includes(w.type) && !w.props?.targetVariable);
    if (unbound.length > 0) issues.push(`${unbound.length} input widget belum di-bind ke tabel`);
    const untriggered = widgets.filter(w => w.type === 'BUTTON' && !(w.props?.triggers || []).length);
    if (untriggered.length > 0) issues.push(`${untriggered.length} button belum punya trigger`);
    const tables = context.tables || [];
    const placeholders = context.recordPlaceholders || [];
    if (tables.length > 0 && placeholders.length === 0) issues.push('Ada tabel tapi belum ada Record Placeholder');
    const hasInputs = unbound.length > 0 || widgets.some(w => inputTypes.includes(w.type));
    const hasNoTable = tables.length === 0 && hasInputs;
    if (hasNoTable) issues.push('Ada form input tapi belum ada tabel data');
    setAppIssues(issues);
  }, [context?.widgets, context?.tables, context?.recordPlaceholders]);

  // UPGRADE 3: Auto-compress memory when messages grow
  useEffect(() => {
    const compress = async () => {
      if (messages.length < 20 || !aiConnector) return;
      // Only compress if we haven't summarized yet and have many messages
      if (sessionSummary && messages.length < 30) return;
      try {
        const toSummarize = messages.slice(0, messages.length - 8);
        const summaryPrompt = `Ringkas percakapan Mandor Builder Copilot berikut dalam 5 poin bullet singkat (max 300 kata total). Fokus pada: widget apa yang dibuat, tabel apa yang ada, screen apa yang ada, dan masalah apa yang sudah diselesaikan:\n\n${toSummarize.map(m => `${m.role}: ${String(m.content).slice(0, 300)}`).join('\n')}`;
        const { getChatCompletion } = await import('../utils/aiService');
        // We use the connector directly for a quick summary
        const summaryResult = await getChatCompletion([{ role: 'user', content: summaryPrompt }], aiConnector);
        setSessionSummary(summaryResult);
        // Trim messages to last 8
        setMessages(prev => prev.slice(-8));
      } catch(e) { console.warn('[Copilot] Memory compression failed:', e); }
    };
    compress();
  }, [messages.length]);

  // Persist messages
  useEffect(() => {
    try {
      const toSave = messages.slice(-50).map(m => ({
        role: m.role, content: m.content,
        timestamp: m.timestamp, isError: m.isError || false,
        isApproved: m.isApproved || false
      }));
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    } catch (e) { /* storage full */ }
  }, [messages]);

  useEffect(() => {
    const loadAiConfig = async () => {
      const aiConn = await getPrimaryAiConnector();
      setAiConnector(aiConn);
    };
    if (isOpen) loadAiConfig();
  }, [isOpen]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // ── parseCommands ──────────────────────────────────────────────────────────
  const parseCommands = (text) => {
    if (!text) return null;
    const isCommandPayload = (parsed) => parsed && Array.isArray(parsed.commands);
    const cleanJsonLike = (raw = '') => raw
      .replace(/```json/gi, '').replace(/```/g, '')
      .replace(/\/\/.*$/gm, '').trim();
    const tryParse = (candidate) => {
      if (!candidate) return null;
      try {
        const parsed = JSON.parse(cleanJsonLike(candidate));
        return isCommandPayload(parsed) ? parsed : null;
      } catch { return null; }
    };

    const tagged = /<builder_cmds>([\s\S]*?)<\/builder_cmds>/gi.exec(text);
    const taggedParsed = tryParse(tagged?.[1]);
    if (taggedParsed) return taggedParsed;

    const blockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/gi;
    let blockMatch;
    while ((blockMatch = blockRegex.exec(text)) !== null) {
      const parsed = tryParse(blockMatch[1]);
      if (parsed) return parsed;
    }

    const starts = [];
    for (let i = 0; i < text.length; i++) if (text[i] === '{') starts.push(i);
    for (const start of starts) {
      let depth = 0;
      for (let i = start; i < text.length; i++) {
        if (text[i] === '{') depth++;
        if (text[i] === '}') depth--;
        if (depth === 0) {
          const parsed = tryParse(text.slice(start, i + 1));
          if (parsed) return parsed;
          break;
        }
      }
    }
    return null;
  };

  const handleSend = async (overrideInput) => {
    let text = overrideInput ?? input;
    if (selectedCanvaDesign) {
      text += `\n\n[CONTEKS DESAIN CANVA]: Gunakan Desain Canva bernama "${selectedCanvaDesign.name}" (ID: ${selectedCanvaDesign.id}) sebagai acuan tata letak/layout untuk membuat aplikasi ini.`;
    }

    if ((!text.trim() && !selectedFile) || isLoading) return;

    const userMessage = {
      role: 'user',
      content: text || (selectedFile ? 'Analyzing image...' : ''),
      timestamp: new Date(),
      image: selectedFile ? URL.createObjectURL(selectedFile) : null
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setSelectedCanvaDesign(null);
    setIsLoading(true);
    setStreamingText(''); // UPGRADE 2: reset streaming

    try {
      const settings = aiConnector?.aiSettings || aiConnector?.config;
      if (!aiConnector || !settings?.apiKey) {
        throw new Error('AI Connector belum dikonfigurasi. Silakan buka Integrasi > AI Settings.');
      }

      let response;
      if (selectedFile) {
        response = await getBuilderVisionAdvice(selectedFile, context, aiConnector);
        setSelectedFile(null);
      } else {
        const history = messages.slice(-8).map(m => ({ role: m.role, content: m.content }));
        const enrichedContext = {
          ...context,
          selectedWidget: selectedWidget || null,
          sessionSummary,
          vibeMode: context?.vibeMode || 'CANVAS',
          relatedApps: (selectedApps || []).map(app => ({
            id: app.id,
            name: app.name,
            category: app.category,
            screens: (app.config?.steps || app.config?.components || []).map(s => s.title || s.displayName || s.type),
            variables: (app.config?.variables || []).map(v => ({ name: v.name, type: v.type, defaultValue: v.defaultValue })),
            tablesUsed: app.config?.tablesUsed || []
          }))
        };

        // UPGRADE 2: Try streaming first, fallback to non-streaming
        try {
          let streamedText = '';
          await streamBuilderCopilotAdvice(text, history, enrichedContext, aiConnector, (chunk) => {
            streamedText += chunk;
            setStreamingText(streamedText);
            if (streamedText.includes('<vibe_code>') && streamedText.includes('</vibe_code>')) {
              const match = streamedText.match(/<vibe_code>([\s\S]*?)<\/vibe_code>/i);
              if (match && match[1] && onOpenSandbox) {
                onOpenSandbox(match[1].trim());
              }
            }
          });
          response = streamedText;
          setStreamingText('');
        } catch (streamErr) {
          console.warn('[Copilot] Streaming failed, falling back to non-streaming:', streamErr.message);
          setStreamingText('');
          response = await getBuilderCopilotAdvice(text, history, enrichedContext, aiConnector);
        }
      }

      // Check if response contains <vibe_code>
      if (response && response.includes('<vibe_code>')) {
        const match = response.match(/<vibe_code>([\s\S]*?)<\/vibe_code>/i);
        if (match && match[1] && onOpenSandbox) {
          onOpenSandbox(match[1].trim());
        }
      }

      setMessages(prev => [...prev, { role: 'assistant', content: response, timestamp: new Date() }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant', content: `Error: ${err.message}`,
        timestamp: new Date(), isError: true
      }]);
    } finally {
      setIsLoading(false);
      setStreamingText('');
    }
  };


  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) setSelectedFile(e.target.files[0]);
  };

  const handlePromptChip = (prompt) => {
    setInput(prompt);
    textareaRef.current?.focus();
  };

  const handleSendWidgetToChat = () => {
    if (!selectedWidget) return;
    const widgetName = selectedWidget.displayName || selectedWidget.props?.label || selectedWidget.type;
    const triggerInfo = (selectedWidget.props?.triggers || []).map(t => `  • ${t.name} (${t.event})`).join('\n') || '  (tidak ada trigger)';
    const ctx = `📌 Widget yang saya pilih di canvas:
**Nama:** ${widgetName}
**Type:** ${selectedWidget.type}
**ID:** ${selectedWidget.id}
**Posisi:** x=${selectedWidget.x}, y=${selectedWidget.y}
**Binding:** ${selectedWidget.props?.targetVariable || 'tidak ada'}
**Triggers:**
${triggerInfo}

Apa yang bisa kamu bantu untuk widget ini?`;
    handleSend(ctx);
  };

  // UPGRADE 8: Handle App Diagnosis
  const handleDiagnose = async () => {
    if (!aiConnector || isDiagnosing) return;
    setIsDiagnosing(true);
    setMessages(prev => [...prev, { role: 'user', content: '🔬 Diagnosa aplikasi saya sekarang — berikan laporan lengkap dan auto-fix jika ada masalah.', timestamp: new Date() }]);
    try {
      const report = await diagnoseApp({ ...context, selectedWidget: selectedWidget || null }, aiConnector);
      setMessages(prev => [...prev, { role: 'assistant', content: report, timestamp: new Date() }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: `Diagnosis Error: ${err.message}`, timestamp: new Date(), isError: true }]);
    } finally {
      setIsDiagnosing(false);
    }
  };

  // Enterprise Feature: Industrial Voice Control (Speech-to-Text)
  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
    } else {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) return;
      
      const rec = new SpeechRecognition();
      rec.lang = 'id-ID';
      rec.continuous = false;
      rec.interimResults = false;
      rec.maxAlternatives = 1;

      rec.onstart = () => {
        setIsListening(true);
      };

      rec.onerror = (e) => {
        console.error('Speech recognition error:', e);
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      rec.onresult = (e) => {
        const resultText = e.results[0][0].transcript;
        setInput(prev => prev ? `${prev} ${resultText}` : resultText);
      };

      recognitionRef.current = rec;
      rec.start();
    }
  };

  // Enterprise Feature: Export Audit Trail Log
  const handleExportAuditTrail = () => {
    let content = `==================================================\n`;
    content += `       MANDOR BUILDER COPILOT - AUDIT TRAIL LOG      \n`;
    content += `==================================================\n`;
    content += `Export Date  : ${new Date().toLocaleString('id-ID')}\n`;
    content += `App Name     : ${context?.appName || 'Unnamed App'}\n`;
    content += `Total Messages: ${messages.length}\n`;
    content += `Applied Cmds : ${commandLog.length}\n`;
    content += `--------------------------------------------------\n\n`;

    content += `[CHAT HISTORY]\n`;
    messages.forEach((msg, idx) => {
      const cleanMsg = msg.content
        .replace(/<builder_cmds>[\s\S]*?<\/builder_cmds>/gi, '')
        .replace(/<ai_plan>[\s\S]*?<\/ai_plan>/gi, '')
        .trim();
      const timeStr = msg.timestamp ? new Date(msg.timestamp).toLocaleString('id-ID') : 'Unknown Time';
      content += `[${timeStr}] ${msg.role.toUpperCase()}:\n${cleanMsg}\n`;
      content += `-`.repeat(50) + `\n`;
    });

    content += `\n[APPLIED COMMANDS LOG]\n`;
    if (commandLog.length === 0) {
      content += `No commands applied in this session.\n`;
    } else {
      commandLog.forEach((log, idx) => {
        content += `${idx + 1}. [${log.timestamp}] [${log.type}] ${log.label}\n`;
      });
    }
    content += `\n==================================================\n`;
    content += `END OF LOG\n`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `mandor_copilot_audit_trail_${new Date().toISOString().slice(0, 10)}.txt`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const sendToAntigravity = async (msg) => {
    if (!isSupabaseReady()) {
      alert("Koneksi Supabase belum siap.");
      return;
    }
    const supabase = getSupabaseClient();
    const cleanContent = msg.content
      .replace(/<builder_cmds>[\s\S]*?<\/builder_cmds>/gi, '')
      .replace(/<ai_plan>[\s\S]*?<\/ai_plan>/gi, '')
      .trim();

    const commandData = parseCommands(msg.content);
    
    const payload = {
      instruction: cleanContent,
      commands: commandData?.commands || []
    };

    const newMessage = {
      sender_id: 'copilot',
      sender_name: 'Mandor Builder Copilot',
      station_id: 'AppBuilder',
      target_station_id: 'antigravity',
      content: JSON.stringify(payload),
      type: 'IDE_COMMAND',
      is_read: false,
      created_at: new Date().toISOString()
    };

    try {
      const { error } = await supabase.from('chat_messages').insert([newMessage]);
      if (error) throw error;
      alert("Tugas berhasil dikirim ke Antigravity IDE!");
    } catch (err) {
      alert("Gagal mengirim tugas ke Antigravity: " + err.message);
    }
  };

  const handleSendDirectToAntigravity = async () => {
    const text = input.trim();
    if (!text) return;

    const userMessage = {
      role: 'user',
      content: `[KIRIM KE ANTIGRAVITY] ${text}`,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');

    if (!isSupabaseReady()) {
      alert("Koneksi Supabase belum siap.");
      return;
    }
    const supabase = getSupabaseClient();
    const payload = {
      instruction: text,
      commands: []
    };

    const newMessage = {
      sender_id: 'copilot_direct',
      sender_name: 'Mandor Copilot Direct Input',
      station_id: 'AppBuilder',
      target_station_id: 'antigravity',
      content: JSON.stringify(payload),
      type: 'IDE_COMMAND',
      is_read: false,
      created_at: new Date().toISOString()
    };

    try {
      const { error } = await supabase.from('chat_messages').insert([newMessage]);
      if (error) throw error;
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `📤 **Perintah terkirim langsung ke Antigravity:** "${text}"\nMenunggu Antigravity memproses...`,
          timestamp: new Date()
        }
      ]);
    } catch (err) {
      alert("Gagal mengirim perintah ke Antigravity: " + err.message);
    }
  };

  // Enterprise Feature: Rollback to pre-Copilot state
  const handleRollback = async () => {
    if (!hasSnapshot) return;
    try {
      await onApplyCommand({ type: 'ROLLBACK_SNAPSHOT', payload: {} });
      setMessages(prev => {
        let lastApprovedIdx = -1;
        for (let i = prev.length - 1; i >= 0; i--) {
          if (prev[i].role === 'assistant' && prev[i].isApproved) {
            lastApprovedIdx = i;
            break;
          }
        }

        if (lastApprovedIdx !== -1) {
          const updated = [...prev];
          const targetMsg = updated[lastApprovedIdx];
          updated[lastApprovedIdx] = { ...targetMsg, isApproved: false };

          // Clear commandStatus for commands inside this message
          const msgId = targetMsg.timestamp instanceof Date ? targetMsg.timestamp.getTime() : new Date(targetMsg.timestamp).getTime();
          setCommandStatus(prevStatus => {
            const newStatus = { ...prevStatus };
            Object.keys(newStatus).forEach(key => {
              if (key.startsWith(`${msgId}_`)) {
                delete newStatus[key];
              }
            });
            return newStatus;
          });

          updated.push({
            role: 'assistant',
            content: '⏪ **Rollback berhasil!** Aplikasi telah dikembalikan ke kondisi sebelum Copilot menjalankan perintah terakhir. Snapshot telah dihapus, dan rencana implementasi di atas telah dikembalikan ke status **Review Plan** untuk ditinjau ulang.',
            timestamp: new Date()
          });
          return updated;
        }

        return [...prev, {
          role: 'assistant',
          content: '⏪ **Rollback berhasil!** Aplikasi telah dikembalikan ke kondisi sebelum Copilot menjalankan perintah terakhir. Snapshot telah dihapus.',
          timestamp: new Date()
        }];
      });
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `❌ Rollback gagal: ${err.message}`,
        timestamp: new Date(),
        isError: true
      }]);
    }
  };

  const handleApprovePlan = async (msgIdx, msg) => {
    // 0. Auto-create snapshot before executing any plan
    try {
      await onApplyCommand({ type: 'CREATE_SNAPSHOT', payload: {} });
    } catch (e) { console.warn('[Copilot] Snapshot creation failed:', e); }

    // 1. Mark as approved in state
    setMessages(prev => prev.map((m, i) => i === msgIdx ? { ...m, isApproved: true } : m));

    // 2. Parse commands
    const commandData = parseCommands(msg.content);
    const thresholdFromSettings = Number(aiConnector?.aiSettings?.copilotSafetyThreshold ?? aiConnector?.config?.copilotSafetyThreshold);
    const safePack = commandData
      ? sanitizeCopilotCommands(commandData, context, { threshold: Number.isFinite(thresholdFromSettings) ? thresholdFromSettings : undefined })
      : null;

    if (!safePack || !safePack.safeCommands) return;

    const msgId = msg.timestamp instanceof Date ? msg.timestamp.getTime() : new Date(msg.timestamp).getTime();

    // Determine how many commands are checked and need execution
    const commandsToExecute = safePack.safeCommands.filter((cmd, cIdx) => {
      const uniqueKey = `${msgIdx}_${cIdx}`;
      const isChecked = checkedCommands[uniqueKey] !== false; // default to true
      const cmdKey = `${msgId}_${cIdx}`;
      return isChecked && commandStatus[cmdKey] !== 'success';
    });

    if (commandsToExecute.length > 0) {
      setExecutionProgress({
        total: commandsToExecute.length,
        current: 0,
        isActive: true
      });
    }

    let completedCount = 0;

    // 3. Execute all checked and safe commands
    for (let i = 0; i < safePack.safeCommands.length; i++) {
      const uniqueKey = `${msgIdx}_${i}`;
      const isChecked = checkedCommands[uniqueKey] !== false; // default to true
      if (!isChecked) continue; // skip unchecked commands

      const cmd = safePack.safeCommands[i];
      const cmdKey = `${msgId}_${i}`;
      if (commandStatus[cmdKey] === 'success') continue;
      setCommandStatus(prev => ({ ...prev, [cmdKey]: 'loading' }));
      try {
        await onApplyCommand(cmd);
        setCommandStatus(prev => ({ ...prev, [cmdKey]: 'success' }));
        setCommandLog(prev => [...prev, {
          label: getCommandPreview(cmd),
          type: cmd.type,
          timestamp: new Date().toLocaleTimeString('id', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        }]);
      } catch (e) {
        setCommandStatus(prev => ({ ...prev, [cmdKey]: 'error' }));
      }
      completedCount++;
      setExecutionProgress(prev => ({
        ...prev,
        current: completedCount
      }));
    }

    // Done executing
    setExecutionProgress(prev => ({
      ...prev,
      isActive: false
    }));
  };

  const handleRevisePlan = () => {
    setInput('Revisi rencana: ');
    textareaRef.current?.focus();
  };

  if (!isOpen) return null;

  // ── Build chip sets ────────────────────────────────────────────────────────
  const buildChips = [
    { label: '🏭 App Produksi', prompt: 'Buatkan app monitoring produksi pabrik dengan dashboard KPI, tabel data, dan machine status' },
    { label: '📋 Form QC', prompt: 'Buatkan form quality control dengan checklist, pass/fail, camera capture, dan signature' },
    { label: '📊 Dashboard', prompt: 'Buatkan dashboard monitoring dengan 4 KPI card, chart trend, dan tabel data' },
    { label: '📦 Inventory', prompt: 'Buatkan app inventory management dengan barcode scanner, tabel stok, dan form input' },
    { label: '🔧 Maintenance', prompt: 'Buatkan app work order maintenance dengan form permintaan, checklist, dan tanda tangan approval' },
    { label: '⚙️ SCADA', prompt: 'Buatkan SCADA monitoring dengan machine status, gauge, dial gauge, dan machine timeline' },
    { label: '📖 Panduan App', prompt: 'Buatkan panduan penggunaan lengkap untuk app ini — jelaskan semua screen, alur kerja, trigger, tabel, fungsi, dan cara mengisi data' },
  ];
  const editChips = [
    { label: '✏️ Ganti Warna', prompt: 'Ganti warna background widget [nama widget] menjadi [warna]' },
    { label: '🔧 Edit Trigger', prompt: 'Ubah trigger [nama trigger] agar menjalankan notifikasi dengan pesan [pesan]' },
    { label: '🗑️ Hapus Widget', prompt: 'Hapus widget bernama [nama widget]' },
    { label: '📌 Ubah Variabel', prompt: 'Ubah variabel [nama] menjadi tipe NUMBER dengan nilai default 0' },
    { label: '🖥️ Rename Screen', prompt: 'Ubah nama screen [nama lama] menjadi [nama baru]' },
    { label: '⚡ Update Fungsi', prompt: 'Update fungsi [nama fungsi] dengan logika baru: [deskripsi logika]' },
  ];
  const sandboxChips = [
    { label: '🏭 HMI Stamping Press', prompt: 'Buatkan UI HMI Stamping Press interaktif dengan indikator tekanan hidrolik, stroke counter, cycle time, status motor ON/OFF, dan tombol emergency stop' },
    { label: '📹 Terminal Face ID & GPS', prompt: 'Buatkan terminal absensi operator interaktif dengan simulasi kamera scanner Face ID, verifikasi koordinat GPS pabrik, dan auto sinkronisasi operator' },
    { label: '📊 OEE & Realtime Charts', prompt: 'Buatkan dashboard monitoring OEE live dengan visualisasi Availability, Performance, Quality, animated circular gauges, dan grafik tren produksi realtime' },
    { label: '📋 QC Digital Checksheet', prompt: 'Buatkan digital checksheet inspeksi part dengan scoring OK/NG, input dimensi toleransi, upload bukti foto cacat, dan signature digital' },
    { label: '⚡ PLC SCADA Telemetry', prompt: 'Buatkan panel SCADA telemetry untuk mesin CNC dengan live vibration sensor, temperature gauge, RPM motor, dan visualisasi alert threshold' },
    { label: '🗄️ Auto Table Bridge', prompt: 'Tambahkan event postMessage({ type: "MAVICORE_TABLE_INSERT", tableName: "Produksi_Log", data: {...} }) pada setiap tombol simpan agar tersimpan ke database MaviCore' },
  ];
  const chips = chipMode === 'build' ? buildChips : editChips;

  return (
    <div style={{
      position: 'fixed',
      top: isFullScreen ? '0' : '64px',
      right: isFullScreen ? '0' : '12px',
      bottom: isFullScreen ? '0' : '12px',
      left: isFullScreen ? '0' : 'auto',
      width: isFullScreen ? '100%' : '460px',
      height: isFullScreen ? '100%' : 'auto',
      backgroundColor: '#ffffff',
      borderRadius: isFullScreen ? '0' : '20px',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: isFullScreen ? 'none' : '0 32px 64px -12px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.05)',
      border: isFullScreen ? 'none' : '1px solid rgba(255,255,255,0.15)',
      zIndex: 1000,
      overflow: 'hidden',
      fontFamily: '"Inter", system-ui, -apple-system, sans-serif',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}>
        {/* Row 1: Title and Window Controls */}
        <div style={{
          padding: '7px 12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '26px', height: '26px',
              background: 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(59,130,246,0.3))',
              borderRadius: '7px',
              border: '1px solid rgba(99,102,241,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 10px rgba(99,102,241,0.2)',
            }}>
              <Wand2 size={13} color="#a5b4fc" />
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#f8fafc' }}>
                Builder Copilot
              </div>
              <div style={{ fontSize: '0.58rem', color: '#6366f1', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#22c55e', display: 'inline-block', boxShadow: '0 0 6px #22c55e' }} />
                <span>Active</span>
                <span style={{ color: 'rgba(255,255,255,0.2)' }}>•</span>
                <select
                  value={currentModelId}
                  onChange={(e) => handleModelChange(e.target.value)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#a5b4fc',
                    fontSize: '0.58rem',
                    fontWeight: 700,
                    outline: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    maxWidth: '120px',
                    textOverflow: 'ellipsis',
                  }}
                  title="Pilih Model AI yang Aktif"
                >
                  {getModelsListForProvider(currentProvider).map(m => (
                    <option key={m.id} value={m.id} style={{ backgroundColor: '#1e1b4b', color: '#ffffff' }}>
                      {m.name || m.id}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
 
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {/* Fullscreen toggle */}
            <button
              onClick={() => setIsFullScreen(v => !v)}
              title={isFullScreen ? 'Kecilkan Copilot' : 'Perbesar Copilot (Full Screen)'}
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#cbd5e1',
                cursor: 'pointer',
                padding: '4px 6px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                transition: 'all 0.15s'
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; e.currentTarget.style.color = '#e2e8f0'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#cbd5e1'; }}
            >
              {isFullScreen ? <Minimize2 size={11} /> : <Maximize2 size={11} />}
            </button>
 
            {/* Close */}
            <button
              onClick={onClose}
              title="Tutup Copilot"
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'white',
                cursor: 'pointer',
                padding: '4px 6px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                transition: 'all 0.15s'
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
            >
              <X size={11} />
            </button>
          </div>
        </div>
 
        {/* Row 2: Toolbar Actions */}
        <div style={{
          padding: '4px 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '6px',
          borderTop: '1px solid rgba(255,255,255,0.05)',
          background: 'rgba(0,0,0,0.15)',
          flexWrap: 'wrap',
        }}>
          {/* Left Actions: Undo/Redo & Diagnose */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            {/* Undo/Redo */}
            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.06)', borderRadius: '8px', padding: '1px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <button
                onClick={onUndo} disabled={!canUndo} title="Undo (Ctrl+Z)"
                style={{ background: 'none', border: 'none', color: 'white', opacity: canUndo ? 1 : 0.3, cursor: canUndo ? 'pointer' : 'default', padding: '5px 7px', borderRadius: '6px', display: 'flex', alignItems: 'center', transition: 'background 0.15s' }}
                onMouseEnter={e => canUndo && (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'none')}
              >
                <RotateCcw size={12} />
              </button>
              <button
                onClick={onRedo} disabled={!canRedo} title="Redo (Ctrl+Y)"
                style={{ background: 'none', border: 'none', color: 'white', opacity: canRedo ? 1 : 0.3, cursor: canRedo ? 'pointer' : 'default', padding: '5px 7px', borderRadius: '6px', display: 'flex', alignItems: 'center', transition: 'background 0.15s' }}
                onMouseEnter={e => canRedo && (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'none')}
              >
                <RotateCw size={12} />
              </button>
            </div>

            {/* UPGRADE 8: Diagnose button */}
            <button
              onClick={handleDiagnose}
              disabled={isDiagnosing}
              title="Diagnosa aplikasi — AI akan menganalisis dan auto-fix masalah"
              style={{
                background: isDiagnosing ? 'rgba(139,92,246,0.3)' : 'rgba(139,92,246,0.15)',
                border: '1px solid rgba(139,92,246,0.3)',
                color: '#c4b5fd',
                cursor: isDiagnosing ? 'default' : 'pointer',
                padding: '5px 8px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.65rem',
                fontWeight: 700,
                transition: 'all 0.15s'
              }}
              onMouseEnter={e => { if (!isDiagnosing) { e.currentTarget.style.background = 'rgba(139,92,246,0.3)'; }}}
              onMouseLeave={e => { if (!isDiagnosing) { e.currentTarget.style.background = 'rgba(139,92,246,0.15)'; }}}
            >
              {isDiagnosing ? <Loader2 size={11} className="animate-spin" /> : <Stethoscope size={11} />}
              {isDiagnosing ? 'Diagnosing...' : 'Diagnose'}
            </button>

            {/* UPGRADE 4: Health Issues Badge */}
            {appIssues.length > 0 && (
              <button
                onClick={() => setShowIssues(v => !v)}
                title={`${appIssues.length} masalah terdeteksi — klik untuk lihat`}
                style={{
                  background: 'rgba(239,68,68,0.15)',
                  border: '1px solid rgba(239,68,68,0.35)',
                  color: '#fca5a5',
                  cursor: 'pointer',
                  padding: '5px 8px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  transition: 'all 0.15s'
                }}
              >
                <AlertCircle size={11} />
                {appIssues.length}
              </button>
            )}
          </div>

          {/* Right Actions: Rollback, Export, Clear Chat */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
            {/* Rollback to Pre-Copilot State */}
            {hasSnapshot && (
              <button
                onClick={handleRollback}
                title="⏪ Rollback ke kondisi sebelum Copilot — kembalikan semua perubahan"
                style={{
                  background: 'rgba(245,158,11,0.2)',
                  border: '1px solid rgba(245,158,11,0.5)',
                  color: '#fbbf24',
                  cursor: 'pointer',
                  padding: '5px 8px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  transition: 'all 0.15s',
                  animation: 'pulse-red 2s infinite'
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(245,158,11,0.35)'; e.currentTarget.style.color = '#fde68a'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(245,158,11,0.2)'; e.currentTarget.style.color = '#fbbf24'; }}
              >
                <History size={11} />
                Rollback
              </button>
            )}

            {/* Export Audit Trail */}
            <button
              onClick={handleExportAuditTrail}
              title="Export Audit Trail (Download Chat & Command Log)"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: '#94a3b8',
                cursor: 'pointer',
                padding: '6px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                transition: 'all 0.15s'
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(59,130,246,0.2)'; e.currentTarget.style.color = '#93c5fd'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#94a3b8'; }}
            >
              <Download size={12} />
            </button>

            {/* Clear chat */}
            <button
              onClick={() => {
                sessionStorage.removeItem(STORAGE_KEY);
                setMessages([{
                  role: 'assistant',
                  content: 'Chat dibersihkan. Saya siap membantu Anda membangun aplikasi baru!',
                  timestamp: new Date()
                }]);
              }}
              title="Clear chat"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: '#94a3b8',
                cursor: 'pointer',
                padding: '6px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                transition: 'all 0.15s'
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.2)'; e.currentTarget.style.color = '#fca5a5'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#94a3b8'; }}
            >
              <Trash2 size={12} />
            </button>
          </div>
        </div>

        {/* Row 2: Status & Screen info */}
        <div style={{
          padding: '6px 14px',
          background: 'rgba(15, 23, 42, 0.75)',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: '#cbd5e1' }}>
            <LayoutTemplate size={12} className="text-sky-400" />
            <span style={{ fontWeight: 600 }}>Screen Aktif:</span>
            <span style={{ color: '#38bdf8', fontWeight: 700 }}>{context?.currentStepName || 'Screen 1'}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.68rem', color: '#94a3b8' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981' }} />
            <span>Mavi Canvas</span>
          </div>
        </div>
      </div>

      {/* Main Chat Column */}
      <div style={{
        flex: 1,
        minHeight: 0,
        overflow: 'hidden',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        height: '100%'
      }}>

      {/* UPGRADE 4: App Issues Panel */}
      {showIssues && appIssues.length > 0 && (
        <div style={{ background: '#fef2f2', borderBottom: '1px solid #fecaca', padding: '12px 16px', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#991b1b', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <AlertCircle size={12} /> {appIssues.length} Masalah Terdeteksi
            </span>
            <button
              onClick={() => {
                const prompt = `Perbaiki semua masalah ini:\n${appIssues.map((i, n) => `${n + 1}. ${i}`).join('\n')}`;
                handleSend(prompt);
                setShowIssues(false);
              }}
              style={{ fontSize: '0.68rem', fontWeight: 800, color: '#fff', background: '#ef4444', border: 'none', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer' }}
            >
              🤖 Fix All
            </button>
          </div>
          {appIssues.map((issue, i) => (
            <div key={i} style={{ fontSize: '0.72rem', color: '#7f1d1d', padding: '3px 0', display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
              <span style={{ flexShrink: 0, marginTop: '1px' }}>⚠️</span> {issue}
            </div>
          ))}
        </div>
      )}

      {/* ── Selected Widget Panel (pinned below header) ─────────────────────── */}
      {selectedWidget && (
        <WidgetContextPanel
          widget={selectedWidget}
          onPrompt={(prompt) => { handleSend(prompt); }}
          onSendToChat={handleSendWidgetToChat}
          context={context}
        />
      )}


      {/* Batch Execution Progress Bar */}
      {executionProgress.isActive && (
        <div style={{
          padding: '10px 14px',
          background: '#eff6ff',
          borderBottom: '1px solid #bfdbfe',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: '#1e40af', fontWeight: 700 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Loader2 size={12} className="animate-spin" /> Menerapkan perubahan ke kanvas...
            </span>
            <span>{executionProgress.current} / {executionProgress.total} Perintah</span>
          </div>
          <div style={{ width: '100%', height: '6px', backgroundColor: '#dbeafe', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{
              width: `${(executionProgress.current / executionProgress.total) * 100}%`,
              height: '100%',
              backgroundColor: '#2563eb',
              borderRadius: '3px',
              transition: 'width 0.3s ease-out'
            }} />
          </div>
        </div>
      )}

      {/* ── Messages ───────────────────────────────────────────────────────── */}
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          padding: '14px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          backgroundColor: '#f8fafc',
          backgroundImage: 'radial-gradient(circle at 20px 20px, #e2e8f020 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      >
        {messages.map((msg, idx) => {
          const commandData = msg.role === 'assistant' ? parseCommands(msg.content) : null;
          const thresholdFromSettings = Number(aiConnector?.aiSettings?.copilotSafetyThreshold ?? aiConnector?.config?.copilotSafetyThreshold);
          const safePack = commandData
            ? sanitizeCopilotCommands(commandData, context, { threshold: Number.isFinite(thresholdFromSettings) ? thresholdFromSettings : undefined })
            : null;
          const planText = msg.role === 'assistant' ? parsePlan(msg.content) : null;
          const cleanContent = msg.content
            .replace(/<builder_cmds>[\s\S]*?<\/builder_cmds>/gi, '')
            .replace(/<ai_plan>[\s\S]*?<\/ai_plan>/gi, '')
            .replace(/<vibe_code>[\s\S]*?<\/vibe_code>/gi, '')
            .trim();

          return (
            <div key={idx} style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
              gap: '5px',
            }}>
              {/* Avatar + role label */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {msg.role === 'assistant' ? (
                  <div style={{ width: '22px', height: '22px', borderRadius: '7px', background: 'linear-gradient(135deg,#6366f1,#3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Wand2 size={12} color="white" />
                  </div>
                ) : (
                  <div style={{ width: '22px', height: '22px', borderRadius: '7px', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <User size={12} color="#64748b" />
                  </div>
                )}
                <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {msg.role === 'user' ? 'You' : 'Copilot'}
                </span>
                <span style={{ fontSize: '0.6rem', color: '#cbd5e1' }}>
                  {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString('id', { hour: '2-digit', minute: '2-digit' }) : ''}
                </span>
              </div>

              {msg.image && (
                <img src={msg.image} alt="Uploaded context" style={{ maxWidth: '200px', borderRadius: '12px', marginBottom: '4px', border: '2px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
              )}

              {/* Bubble */}
              <div style={{
                maxWidth: '88%',
                padding: '10px 14px',
                borderRadius: msg.role === 'user' ? '18px 4px 18px 18px' : '4px 18px 18px 18px',
                background: msg.isError
                  ? '#fef2f2'
                  : msg.role === 'user'
                    ? 'linear-gradient(135deg, #3b82f6, #6366f1)'
                    : '#ffffff',
                color: msg.role === 'user' ? '#ffffff' : (msg.isError ? '#991b1b' : '#1e293b'),
                fontSize: '0.85rem',
                lineHeight: 1.65,
                border: msg.role === 'user' ? 'none' : (msg.isError ? '1px solid #fecaca' : '1px solid #e2e8f0'),
                boxShadow: msg.role === 'user'
                  ? '0 8px 24px rgba(59,130,246,0.35)'
                  : '0 2px 8px rgba(0,0,0,0.06)',
                whiteSpace: 'pre-wrap',
              }}>
                 {cleanContent}

                {/* Vibe Code Quick Apply to Sandpack Action */}
                {msg.content && msg.content.includes('<vibe_code>') && (
                  <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #e2e8f0' }}>
                    <button
                      type="button"
                      onClick={() => {
                        const match = msg.content.match(/<vibe_code>([\s\S]*?)<\/vibe_code>/i);
                        if (match && match[1]) {
                          setSandpackCode(match[1].trim());
                          setVibeEngineMode('sandpack');
                          setShowSandpackDrawer(true);
                        }
                      }}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        background: 'linear-gradient(135deg, #0284c7 0%, #6366f1 100%)',
                        color: 'white',
                        borderRadius: '8px',
                        border: 'none',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(2, 132, 199, 0.35)'
                      }}
                    >
                      <Sparkles size={14} />
                      <span>⚡ Buka di Sandpack Live Preview ➔</span>
                    </button>
                  </div>
                )}

                {msg.role === 'assistant' && !msg.isError && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px', borderTop: '1px dashed #e2e8f0', paddingTop: '6px' }}>
                    <button
                      onClick={() => sendToAntigravity(msg)}
                      style={{
                        background: 'none', border: 'none', color: '#8b5cf6',
                        fontSize: '0.68rem', fontWeight: 700, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 8px', borderRadius: '4px',
                        transition: 'background 0.15s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f3e8ff'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}
                    >
                      <BrainCircuit size={11} /> Kirim ke Antigravity
                    </button>
                  </div>
                )}

                {/* Command actions panel */}
                {safePack?.safeCommands && (
                  <div style={{
                    marginTop: '14px',
                    paddingTop: '14px',
                    borderTop: '1px solid #e2e8f0',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}>
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <ClipboardList size={14} color="#6366f1" /> 📋 Rencana Implementasi
                      </div>
                      <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#475569', background: '#f1f5f9', padding: '2px 8px', borderRadius: '999px', border: '1px solid #e2e8f0' }}>
                        Safe {safePack.safeCount ?? safePack.safeCommands.length}/{safePack.totalCount ?? safePack.safeCommands.length}
                      </span>
                    </div>

                    {/* Rencana/Plan description parsed from ai_plan */}
                    {planText && (
                      <div style={{
                        backgroundColor: '#f8fafc',
                        padding: '12px 14px',
                        borderRadius: '10px',
                        borderLeft: '4px solid #6366f1',
                        fontSize: '0.8rem',
                        color: '#334155',
                        lineHeight: '1.5',
                        overflowX: 'auto'
                      }} className="markdown-plan">
                        <ReactMarkdown>{planText}</ReactMarkdown>
                      </div>
                    )}

                    {/* Hard Fail Block */}
                    {safePack.hardFail && (
                      <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '10px' }}>
                        <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#991b1b', marginBottom: '4px' }}>HARD-FAIL SAFETY MODE</div>
                        <div style={{ fontSize: '0.72rem', color: '#991b1b' }}>
                          Safe ratio {(safePack.safeRatio * 100).toFixed(0)}% di bawah threshold {(safePack.threshold * 100).toFixed(0)}%.
                        </div>
                      </div>
                    )}

                    {/* Warnings */}
                    {safePack.warnings?.length > 0 && (
                      <div style={{ backgroundColor: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '10px', padding: '10px' }}>
                        <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#9a3412', marginBottom: '6px' }}>⚠️ Safety Warnings</div>
                        {safePack.warnings.map((w, i) => <div key={i} style={{ fontSize: '0.72rem', color: '#9a3412' }}>• {w}</div>)}
                      </div>
                    )}

                    {/* If NOT approved: show plan and confirm buttons */}
                    {!msg.isApproved ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {/* Proposed changes list (Checklist dry-run) */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', background: '#f8fafc', padding: '10px 12px', borderRadius: '10px', border: '1px dashed #cbd5e1' }}>
                          <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                            Daftar Perubahan yang Direncanakan (Pilih untuk dijalankan):
                          </div>
                          {safePack.safeCommands.map((cmd, cIdx) => {
                            const uniqueKey = `${idx}_${cIdx}`;
                            const isChecked = checkedCommands[uniqueKey] !== false; // default to true
                            return (
                              <label
                                key={cIdx}
                                style={{
                                  fontSize: '0.75rem',
                                  color: isChecked ? '#1e293b' : '#94a3b8',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                  cursor: 'pointer',
                                  padding: '4px 6px',
                                  borderRadius: '6px',
                                  backgroundColor: isChecked ? 'rgba(99,102,241,0.04)' : 'transparent',
                                  transition: 'all 0.15s'
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => setCheckedCommands(prev => ({ ...prev, [uniqueKey]: !isChecked }))}
                                  style={{
                                    width: '14px',
                                    height: '14px',
                                    accentColor: '#6366f1',
                                    cursor: 'pointer',
                                    borderRadius: '4px'
                                  }}
                                />
                                <span style={{ textDecoration: isChecked ? 'none' : 'line-through' }}>
                                  {getCommandPreview(cmd)}
                                </span>
                              </label>
                            );
                          })}
                        </div>

                        {/* Confirmation Buttons */}
                        <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                          <button
                            onClick={() => handleApprovePlan(idx, msg)}
                            disabled={safePack.hardFail || safePack.safeCommands.length === 0}
                            style={{
                              flex: 1,
                              padding: '10px 16px',
                              background: safePack.hardFail ? '#cbd5e1' : 'linear-gradient(135deg, #10b981, #059669)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              fontSize: '0.8rem',
                              fontWeight: 700,
                              cursor: safePack.hardFail ? 'default' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px',
                              boxShadow: safePack.hardFail ? 'none' : '0 4px 12px rgba(16,185,129,0.2)',
                              transition: 'all 0.2s',
                            }}
                          >
                            <Check size={14} /> Setujui & Jalankan
                          </button>
                          <button
                            onClick={handleRevisePlan}
                            style={{
                              padding: '10px 14px',
                              background: '#fffbeb',
                              color: '#b45309',
                              border: '1px solid #fcd34d',
                              borderRadius: '8px',
                              fontSize: '0.8rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px',
                              transition: 'all 0.2s',
                            }}
                          >
                            <Edit3 size={14} /> Revisi Rencana
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* If approved: show status and the commands with their individual retry buttons */
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          backgroundColor: '#ecfdf5',
                          border: '1px solid #a7f3d0',
                          borderRadius: '8px',
                          padding: '8px 12px',
                          color: '#065f46',
                          fontSize: '0.75rem',
                          fontWeight: 700
                        }}>
                          <CheckCircle2 size={14} color="#10b981" /> Rencana Disetujui & Dijalankan
                        </div>

                        {safePack.safeCommands.map((cmd, cIdx) => {
                          const msgId = msg.timestamp instanceof Date ? msg.timestamp.getTime() : new Date(msg.timestamp).getTime();
                          const cmdKey = `${msgId}_${cIdx}`;
                          const status = commandStatus[cmdKey];
                          const cs = getCmdStyle(cmd.type);

                          return (
                            <div key={cIdx} style={{
                              backgroundColor: '#f8fafc', padding: '10px 12px', borderRadius: '12px',
                              display: 'flex', flexDirection: 'column', gap: '7px',
                              border: `1px solid ${status === 'success' ? '#bbf7d0' : status === 'error' ? '#fecaca' : '#e2e8f0'}`,
                              transition: 'border-color 0.2s',
                            }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '7px', minWidth: 0 }}>
                                  <span style={{ padding: '3px 7px', borderRadius: '5px', fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', backgroundColor: cs.bg, color: cs.color, flexShrink: 0 }}>
                                    {cmd.type.replace(/_/g, ' ')}
                                  </span>
                                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {cmd.payload?.name || cmd.payload?.type || cmd.widgetId || 'Component'}
                                  </span>
                                  {cmd._safety?.repaired && (
                                    <span style={{ fontSize: '0.6rem', fontWeight: 800, color: '#1d4ed8', background: '#dbeafe', padding: '2px 5px', borderRadius: '4px', flexShrink: 0 }}>REPAIRED</span>
                                  )}
                                </div>
                                <button
                                  onClick={async () => {
                                    if (status === 'success' || status === 'loading') return;
                                    setCommandStatus(prev => ({ ...prev, [cmdKey]: 'loading' }));
                                    try {
                                      await onApplyCommand(cmd);
                                      setCommandStatus(prev => ({ ...prev, [cmdKey]: 'success' }));
                                      setCommandLog(prev => [...prev, {
                                        label: getCommandPreview(cmd),
                                        type: cmd.type,
                                        timestamp: new Date().toLocaleTimeString('id', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                                      }]);
                                    } catch (e) {
                                      setCommandStatus(prev => ({ ...prev, [cmdKey]: 'error' }));
                                    }
                                  }}
                                  disabled={status === 'success' || status === 'loading'}
                                  onMouseEnter={() => onHoverCommand?.(cmd)}
                                  onMouseLeave={() => onLeaveCommand?.()}
                                  style={{
                                    padding: '5px 12px', flexShrink: 0,
                                    backgroundColor: status === 'success' ? '#10b981' : status === 'error' ? '#ef4444' : cmd.type.startsWith('DELETE') ? '#ef4444' : cmd.type.startsWith('CREATE') || cmd.type.startsWith('ADD') ? '#6366f1' : '#10b981',
                                    color: 'white', border: 'none', borderRadius: '8px',
                                    fontSize: '0.72rem', fontWeight: 700, cursor: (status === 'success' || status === 'loading') ? 'default' : 'pointer',
                                    display: 'flex', alignItems: 'center', gap: '5px',
                                    boxShadow: '0 2px 6px rgba(0,0,0,0.12)', opacity: status === 'loading' ? 0.7 : 1,
                                    transition: 'all 0.15s',
                                  }}
                                >
                                  {status === 'loading' ? <Loader2 size={11} className="animate-spin" /> :
                                    status === 'success' ? <CheckCircle2 size={11} /> :
                                      status === 'error' ? <AlertCircle size={11} /> :
                                        cmd.type.startsWith('DELETE') ? <Trash2 size={11} /> :
                                          (cmd.type.startsWith('CREATE') || cmd.type.startsWith('ADD')) ? <Sparkles size={11} /> : <PlusCircle size={11} />}
                                  {status === 'loading' ? 'Applying...' : status === 'success' ? 'Applied ✓' : status === 'error' ? 'Failed' : cmd.type.startsWith('DELETE') ? 'Delete' : 'Apply'}
                                </button>
                              </div>

                              {/* Command Preview */}
                              <div style={{ fontSize: '0.68rem', color: '#64748b', padding: '4px 8px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <span style={{ flexShrink: 0 }}>💡</span>
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{getCommandPreview(cmd)}</span>
                              </div>

                              {cmd.type.startsWith('DELETE') && (
                                <div style={{ fontSize: '0.68rem', color: '#991b1b', padding: '5px 10px', backgroundColor: '#fef2f2', borderRadius: '6px', border: '1px solid #fecaca' }}>
                                  ⚠️ Operasi destruktif — akan meminta konfirmasi
                                </div>
                              )}
                              {cmd.type === 'UPDATE_WIDGET' && cmd.payload?.props && (
                                <div style={{ fontSize: '0.68rem', color: '#64748b', padding: '4px 8px', backgroundColor: '#fff', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                                  ✏️ Props: <strong>{Object.keys(cmd.payload.props).join(', ')}</strong>
                                </div>
                              )}
                              {(cmd.type === 'CREATE_TRIGGER' || cmd.type === 'UPDATE_TRIGGER') && cmd.payload?.event && (
                                <div style={{ fontSize: '0.68rem', color: '#64748b', padding: '4px 8px', backgroundColor: '#fff', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                                  ⚡ Event: {typeof cmd.payload?.event === 'object' ? (cmd.payload?.event?.eventName || cmd.payload?.event?.type || JSON.stringify(cmd.payload?.event)) : cmd.payload?.event}
                                  {cmd.payload?.widgetId ? ` → ${cmd.payload.widgetId}` : ''}
                                </div>
                              )}
                              {cmd.type === 'UPDATE_VARIABLE' && cmd.payload?.updates && (
                                <div style={{ fontSize: '0.68rem', color: '#64748b', padding: '4px 8px', backgroundColor: '#fff', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                                  📌 Variabel: {Object.keys(cmd.payload.updates).join(', ')}
                                </div>
                              )}
                              {cmd.type === 'UPDATE_STEP' && cmd.payload?.updates && (
                                <div style={{ fontSize: '0.68rem', color: '#64748b', padding: '4px 8px', backgroundColor: '#fff', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                                  🖥️ Screen: {Object.keys(cmd.payload.updates).join(', ')}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* UPGRADE 2: Streaming text bubble (live preview while streaming) */}
        {streamingText && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '5px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '22px', height: '22px', borderRadius: '7px', background: 'linear-gradient(135deg,#6366f1,#3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Wand2 size={12} color="white" />
              </div>
              <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Copilot</span>
              <span style={{ fontSize: '0.6rem', color: '#a5b4fc', fontWeight: 700 }}>● streaming...</span>
            </div>
            <div style={{
              maxWidth: '88%', padding: '12px 16px', borderRadius: '4px 18px 18px 18px',
              background: '#ffffff', border: '1px solid #e2e8f0',
              fontSize: '0.85rem', lineHeight: 1.65, color: '#1e293b',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)', whiteSpace: 'pre-wrap',
              borderLeft: '3px solid #6366f1',
            }}>
              {streamingText.replace(/<builder_cmds>[\s\S]*?<\/builder_cmds>/gi, '').replace(/<ai_plan>[\s\S]*?<\/ai_plan>/gi, '').trim()}
              <span style={{ display: 'inline-block', width: '2px', height: '14px', background: '#6366f1', marginLeft: '2px', verticalAlign: 'text-bottom', animation: 'blink 0.8s step-end infinite' }} />
            </div>
          </div>
        )}

        {isLoading && !streamingText && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '5px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '22px', height: '22px', borderRadius: '7px', background: 'linear-gradient(135deg,#6366f1,#3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Wand2 size={12} color="white" />
              </div>
              <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Copilot</span>
            </div>
            <TypingDots />
          </div>
        )}
      </div>

      {/* ── Input Area ─────────────────────────────────────────────────────── */}
      <div style={{ padding: '14px 16px 18px', borderTop: '1px solid #e2e8f0', backgroundColor: '#ffffff', flexShrink: 0 }}>

        {/* UPGRADE 6: Command Log panel (collapsible) */}
        {commandLog.length > 0 && (
          <div style={{ marginBottom: '10px' }}>
            <button
              onClick={() => setShowCommandLog(v => !v)}
              style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', fontSize: '0.68rem', fontWeight: 700, color: '#475569' }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <ClipboardList size={11} /> Applied Commands ({commandLog.length})
              </span>
              {showCommandLog ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
            {showCommandLog && (
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderTop: 'none', borderRadius: '0 0 8px 8px', padding: '6px', maxHeight: '120px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                {commandLog.slice().reverse().map((log, i) => {
                  const cs = getCmdStyle(log.type);
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.67rem', padding: '3px 6px', borderRadius: '5px', background: '#fff', border: '1px solid #e2e8f0' }}>
                      <span style={{ padding: '1px 5px', borderRadius: '4px', fontSize: '0.58rem', fontWeight: 800, backgroundColor: cs.bg, color: cs.color, flexShrink: 0 }}>{log.type.replace(/_/g, ' ')}</span>
                      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#475569' }}>{log.label}</span>
                      <span style={{ color: '#94a3b8', flexShrink: 0 }}>{log.timestamp}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Canvas Mode Tools */}
            {/* Chip mode tabs */}
            <div style={{ marginBottom: '6px' }}>
              <div style={{ display: 'flex', gap: '3px', marginBottom: '6px', background: '#f1f5f9', padding: '2px', borderRadius: '8px', width: 'fit-content' }}>
                {[{ id: 'build', label: '🏗️ Build' }, { id: 'edit', label: '✏️ Edit' }].map(({ id, label }) => (
                  <button
                    key={id}
                    onClick={() => setChipMode(id)}
                    style={{
                      padding: '4px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                      fontSize: '0.68rem', fontWeight: 700,
                      backgroundColor: chipMode === id ? '#ffffff' : 'transparent',
                      color: chipMode === id ? '#1e293b' : '#64748b',
                      boxShadow: chipMode === id ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
                      transition: 'all 0.15s',
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div style={{
                display: 'flex',
                overflowX: 'auto',
                gap: '6px',
                paddingBottom: '4px',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none'
              }} className="copilot-chips-scroll">
                <style>{`
                  .copilot-chips-scroll::-webkit-scrollbar {
                    display: none;
                  }
                `}</style>
                {chips.map((chip, i) => (
                  <button
                    key={i}
                    onClick={() => handlePromptChip(chip.prompt)}
                    style={{
                      padding: '4px 10px', borderRadius: '20px',
                      border: `1px solid ${chipMode === 'edit' ? '#fde68a' : '#e2e8f0'}`,
                      backgroundColor: chipMode === 'edit' ? '#fefce8' : '#f8fafc',
                      color: chipMode === 'edit' ? '#92400e' : '#475569',
                      fontSize: '0.68rem', fontWeight: 600, cursor: 'pointer',
                      transition: 'all 0.15s', whiteSpace: 'nowrap',
                    }}
                    onMouseEnter={e => {
                      e.target.style.backgroundColor = chipMode === 'edit' ? '#fef3c7' : '#eff6ff';
                      e.target.style.borderColor = chipMode === 'edit' ? '#fcd34d' : '#bfdbfe';
                      e.target.style.color = chipMode === 'edit' ? '#78350f' : '#1d4ed8';
                    }}
                    onMouseLeave={e => {
                      e.target.style.backgroundColor = chipMode === 'edit' ? '#fefce8' : '#f8fafc';
                      e.target.style.borderColor = chipMode === 'edit' ? '#fde68a' : '#e2e8f0';
                      e.target.style.color = chipMode === 'edit' ? '#92400e' : '#475569';
                    }}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Unified Integrations Toolbar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '10px' }}>
              {/* Buttons Row */}
              <div style={{ display: 'flex', gap: '8px' }}>
                {/* Related Apps Button */}
                <div style={{ flex: 1, position: 'relative' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAppDropdown(prev => !prev);
                      setShowCanvaDropdown(false);
                    }}
                    style={{
                      width: '100%',
                      background: showAppDropdown ? 'rgba(59,130,246,0.12)' : 'rgba(255,255,255,0.7)',
                      border: `1.5px solid ${showAppDropdown ? '#3b82f6' : '#e2e8f0'}`,
                      color: '#1e293b',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      borderRadius: '8px',
                      padding: '6px 10px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '4px',
                      transition: 'all 0.15s'
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Link size={12} color="#3b82f6" />
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        App Terkait ({selectedApps.length})
                      </span>
                    </span>
                    <ChevronDown size={10} style={{ transform: showAppDropdown ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
                  </button>

                  {/* Dropdown Menu for Apps */}
                  {showAppDropdown && (
                    <div style={{
                      position: 'absolute',
                      bottom: '100%',
                      left: 0,
                      width: '260px',
                      backgroundColor: '#ffffff',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 -10px 25px -5px rgba(0,0,0,0.15), 0 -8px 10px -6px rgba(0,0,0,0.15)',
                      zIndex: 50,
                      padding: '10px',
                      marginBottom: '8px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      maxHeight: '200px',
                      overflowY: 'auto'
                    }}>
                      <input
                        type="text"
                        placeholder="Cari nama aplikasi..."
                        value={appSearchQuery}
                        onChange={e => setAppSearchQuery(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '6px 10px',
                          borderRadius: '6px',
                          border: '1px solid #cbd5e1',
                          fontSize: '0.75rem',
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      />
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {allApps
                          .filter(app => app.name.toLowerCase().includes(appSearchQuery.toLowerCase()))
                          .map(app => {
                            const isChecked = selectedApps.some(a => a.id === app.id);
                            return (
                              <label
                                key={app.id}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                  fontSize: '0.75rem',
                                  color: '#334155',
                                  padding: '5px 8px',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  backgroundColor: isChecked ? 'rgba(59,130,246,0.05)' : 'transparent',
                                  transition: 'background-color 0.15s'
                                }}
                                onMouseEnter={e => { e.currentTarget.style.backgroundColor = isChecked ? 'rgba(59,130,246,0.08)' : '#f8fafc' }}
                                onMouseLeave={e => { e.currentTarget.style.backgroundColor = isChecked ? 'rgba(59,130,246,0.05)' : 'transparent' }}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {
                                    if (isChecked) {
                                      setSelectedApps(prev => prev.filter(a => a.id !== app.id));
                                    } else {
                                      setSelectedApps(prev => [...prev, app]);
                                    }
                                  }}
                                  style={{
                                    width: '13px',
                                    height: '13px',
                                    accentColor: '#3b82f6',
                                    cursor: 'pointer'
                                  }}
                                />
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                  <span style={{ fontWeight: 600 }}>{app.name}</span>
                                  <span style={{ fontSize: '0.62rem', color: '#64748b' }}>Kategori: {app.category || 'Shop Floor'}</span>
                                </div>
                              </label>
                            );
                          })}
                        {allApps.filter(app => app.name.toLowerCase().includes(appSearchQuery.toLowerCase())).length === 0 && (
                          <div style={{ fontSize: '0.72rem', color: '#94a3b8', textAlign: 'center', padding: '10px' }}>
                            Tidak ada aplikasi ditemukan
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Canva Layout Button */}
                <div style={{ flex: 1, position: 'relative' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCanvaDropdown(prev => !prev);
                      setShowAppDropdown(false);
                    }}
                    style={{
                      width: '100%',
                      background: showCanvaDropdown ? 'rgba(124,58,237,0.12)' : 'rgba(255,255,255,0.7)',
                      border: `1.5px solid ${showCanvaDropdown ? '#7c3aed' : '#e2e8f0'}`,
                      color: '#1e293b',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      borderRadius: '8px',
                      padding: '6px 10px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '4px',
                      transition: 'all 0.15s'
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px', minWidth: 0, width: '100%' }}>
                      <LayoutTemplate size={12} color="#7c3aed" />
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1, textAlign: 'left' }}>
                        {selectedCanvaDesign ? selectedCanvaDesign.name : 'Desain Canva'}
                      </span>
                    </span>
                    <ChevronDown size={10} style={{ transform: showCanvaDropdown ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
                  </button>

                  {/* Dropdown Menu for Canva */}
                  {showCanvaDropdown && (
                    <div style={{
                      position: 'absolute',
                      bottom: '100%',
                      right: 0,
                      width: '260px',
                      backgroundColor: '#ffffff',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 -10px 25px -5px rgba(0,0,0,0.15), 0 -8px 10px -6px rgba(0,0,0,0.15)',
                      zIndex: 50,
                      padding: '10px',
                      marginBottom: '8px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      maxHeight: '200px',
                      overflowY: 'auto'
                    }}>
                      <input
                        type="text"
                        placeholder="Cari nama desain Canva..."
                        value={canvaSearchQuery}
                        onChange={e => setCanvaSearchQuery(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '6px 10px',
                          borderRadius: '6px',
                          border: '1px solid #cbd5e1',
                          fontSize: '0.75rem',
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      />

                      {/* Loader */}
                      {isFetchingCanva && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px', gap: '6px', fontSize: '0.75rem', color: '#64748b' }}>
                          <Loader2 size={12} className="animate-spin" /> Memuat dari Canva...
                        </div>
                      )}

                      {/* Designs List */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {!isFetchingCanva && canvaDesigns
                          .filter(design => design.name.toLowerCase().includes(canvaSearchQuery.toLowerCase()))
                          .map(design => {
                            const isSelected = selectedCanvaDesign?.id === design.id;
                            return (
                              <button
                                key={design.id}
                                type="button"
                                onClick={() => {
                                  setSelectedCanvaDesign(design);
                                  setShowCanvaDropdown(false);
                                }}
                                style={{
                                  display: 'flex',
                                  alignItems: 'left',
                                  flexDirection: 'column',
                                  gap: '2px',
                                  fontSize: '0.75rem',
                                  color: '#334155',
                                  padding: '6px 8px',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  border: 'none',
                                  textAlign: 'left',
                                  backgroundColor: isSelected ? '#f5f3ff' : 'transparent',
                                  transition: 'background-color 0.15s',
                                  width: '100%'
                                }}
                                onMouseEnter={e => { e.currentTarget.style.backgroundColor = isSelected ? '#ede9fe' : '#f8fafc' }}
                                onMouseLeave={e => { e.currentTarget.style.backgroundColor = isSelected ? '#f5f3ff' : 'transparent' }}
                              >
                                <span style={{ fontWeight: 600, color: isSelected ? '#6d28d9' : '#334155' }}>🎨 {design.name}</span>
                                <span style={{ fontSize: '0.62rem', color: '#64748b' }}>ID: {design.id}</span>
                              </button>
                            );
                          })}
                        {!isFetchingCanva && canvaDesigns.filter(design => design.name.toLowerCase().includes(canvaSearchQuery.toLowerCase())).length === 0 && (
                          <div style={{ fontSize: '0.72rem', color: '#94a3b8', textAlign: 'center', padding: '10px' }}>
                            Tidak ada desain Canva ditemukan
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Unified selected items pill list */}
              {(selectedApps.length > 0 || selectedCanvaDesign) && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '2px' }}>
                  {selectedApps.map(app => (
                    <div
                      key={app.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        backgroundColor: '#eff6ff',
                        border: '1px solid #bfdbfe',
                        color: '#1e40af',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        borderRadius: '20px',
                        padding: '2px 8px',
                      }}
                    >
                      <span>📱 {app.name}</span>
                      <button
                        type="button"
                        onClick={() => setSelectedApps(prev => prev.filter(a => a.id !== app.id))}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#1e40af',
                          cursor: 'pointer',
                          padding: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                  {selectedCanvaDesign && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        backgroundColor: '#f5f3ff',
                        border: '1px solid #ddd6fe',
                        color: '#6d28d9',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        borderRadius: '20px',
                        padding: '2px 8px',
                      }}
                    >
                      <span>🎨 {selectedCanvaDesign.name}</span>
                      <button
                        type="button"
                        onClick={() => setSelectedCanvaDesign(null)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#6d28d9',
                          cursor: 'pointer',
                          padding: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <X size={10} />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Selected file preview */}
            {selectedFile && (
              <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', backgroundColor: '#eff6ff', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: '#1e40af', fontWeight: 600 }}>
                  <ImageIcon size={14} /> {selectedFile.name || 'Gambar Clipboard'}
                </div>
                <button onClick={() => setSelectedFile(null)} style={{ background: 'none', border: 'none', color: '#1e40af', cursor: 'pointer' }}>
                  <X size={14} />
                </button>
              </div>
            )}

            {/* Textarea + send - Compact Pro Bar */}
            <div style={{
              display: 'flex', flexDirection: 'column',
              backgroundColor: '#ffffff', borderRadius: '14px',
              border: '1.5px solid #e2e8f0', padding: '8px 10px 6px 12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
              transition: 'all 0.2s ease',
            }}
              onFocusCapture={e => { e.currentTarget.style.borderColor = '#6366f1'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.12)'; }}
              onBlurCapture={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.03)'; }}
            >
              <textarea
                ref={textareaRef}
                value={input}
                onChange={e => {
                  setInput(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                }}
                onPaste={e => {
                  const items = e.clipboardData?.items;
                  if (items) {
                    for (let i = 0; i < items.length; i++) {
                      if (items[i].type.indexOf('image') !== -1) {
                        const file = items[i].getAsFile();
                        if (file) {
                          const namedFile = new File([file], file.name || `Pasted_Image_${new Date().getTime()}.png`, { type: file.type });
                          setSelectedFile(namedFile);
                          e.preventDefault();
                          break;
                        }
                      }
                    }
                  }
                }}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder={selectedWidget
                  ? `Tanya tentang "${selectedWidget.displayName || selectedWidget.type}"...`
                  : 'Deskripsikan apa yang ingin Anda buat...'}
                rows={1}
                style={{
                  width: '100%', border: 'none', background: 'transparent',
                  fontSize: '0.84rem', outline: 'none', resize: 'none',
                  minHeight: '26px', maxHeight: '120px', lineHeight: 1.45,
                  fontFamily: 'inherit', color: '#1e293b', padding: '2px 0'
                }}
              />

              {/* Horizontal Action Bar */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px', paddingTop: '4px', borderTop: '1px solid #f1f5f9' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} accept="image/*" />
                  
                  {/* Plus Attachment Button */}
                  <button
                    onClick={() => fileInputRef.current.click()}
                    title="Add attachment"
                    style={{
                      backgroundColor: selectedFile ? '#e0e7ff' : '#f8fafc',
                      color: selectedFile ? '#4f46e5' : '#64748b',
                      border: '1px solid #e2e8f0', width: '26px', height: '26px', borderRadius: '50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', transition: 'all 0.15s',
                    }}
                  >
                    <Plus size={13} />
                  </button>

                  {/* Speech to Text button */}
                  {isSpeechSupported && (
                    <button
                      onClick={toggleListening}
                      title={isListening ? "Mendengarkan..." : "Voice Control"}
                      style={{
                        backgroundColor: isListening ? '#ef4444' : 'transparent',
                        color: isListening ? '#fff' : '#94a3b8',
                        border: 'none', width: '28px', height: '28px', borderRadius: '8px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', transition: 'all 0.15s', position: 'relative'
                      }}
                      onMouseEnter={e => { if (!isListening) { e.currentTarget.style.backgroundColor = '#f1f5f9'; e.currentTarget.style.color = '#475569'; }}}
                      onMouseLeave={e => { if (!isListening) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#94a3b8'; }}}
                    >
                      <Mic size={14} />
                      {isListening && (
                        <span style={{
                          position: 'absolute', top: '2px', right: '2px',
                          width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#ef4444',
                          border: '1px solid #fff'
                        }} />
                      )}
                    </button>
                  )}

                  {/* Direct to Antigravity IDE button */}
                  <button
                    onClick={handleSendDirectToAntigravity}
                    disabled={!input.trim() || isLoading}
                    title="Kirim langsung ke Antigravity IDE"
                    style={{
                      backgroundColor: 'transparent',
                      color: input.trim() && !isLoading ? '#8b5cf6' : '#cbd5e1',
                      border: 'none', width: '28px', height: '28px', borderRadius: '8px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: input.trim() && !isLoading ? 'pointer' : 'default', transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { if (input.trim() && !isLoading) { e.currentTarget.style.backgroundColor = '#f3e8ff'; e.currentTarget.style.color = '#7c3aed'; }}}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = input.trim() && !isLoading ? '#8b5cf6' : '#cbd5e1'; }}
                  >
                    <BrainCircuit size={14} />
                  </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {/* Build mode pill */}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '3px',
                    padding: '3px 8px', borderRadius: '8px',
                    backgroundColor: '#f8fafc', border: '1px solid #e2e8f0',
                    fontSize: '0.72rem', fontWeight: 700, color: '#334155'
                  }}>
                    <span>Build</span>
                    <ChevronDown size={11} color="#64748b" />
                  </div>

                  {/* Send Button */}
                  <button
                    onClick={() => handleSend()}
                    disabled={(!input.trim() && !selectedFile) || isLoading}
                    style={{
                      backgroundColor: (input.trim() || selectedFile) && !isLoading ? '#0f172a' : '#f1f5f9',
                      color: (input.trim() || selectedFile) && !isLoading ? '#ffffff' : '#94a3b8',
                      border: 'none', width: '30px', height: '30px', borderRadius: '50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: (input.trim() || selectedFile) && !isLoading ? 'pointer' : 'default',
                      boxShadow: (input.trim() || selectedFile) && !isLoading ? '0 2px 6px rgba(15,23,42,0.25)' : 'none',
                      transition: 'all 0.2s',
                    }}
                  >
                    {isLoading ? <Loader2 size={13} className="animate-spin" /> : <ArrowUp size={14} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Footer info */}
            <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', color: '#94a3b8', fontSize: '0.65rem' }}>
              <Zap size={9} />
              <span>
                {aiConnector?.aiSettings?.provider || aiConnector?.config?.provider || 'Mandor Brain'} • Enter kirim, Shift+Enter baris baru
              </span>
            </div>
          </div>
      </div>
    </div>
  );
};

export default BuilderCopilot;

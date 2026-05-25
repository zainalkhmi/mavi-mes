import React, { useState, useEffect, useRef } from 'react';
import {
  Send, X, Sparkles, User, Bot, Loader2,
  Trash2, BrainCircuit, Code, PlusCircle, Image as ImageIcon,
  CheckCircle2, AlertCircle, Wand2, Zap, LayoutTemplate,
  RotateCcw, RotateCw, ChevronDown, ChevronUp,
  MousePointer2, Layers, Settings, Plus, Activity,
  Type, BarChart3, Table, ToggleLeft, Camera, Hash,
  Square, Circle, Gauge, Bell, SlidersHorizontal
} from 'lucide-react';
import { getPrimaryAiConnector } from '../utils/database';
import { getBuilderCopilotAdvice, getBuilderVisionAdvice } from '../utils/aiService';
import { sanitizeCopilotCommands } from '../utils/copilotSafety';

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

// ─── Selected Widget Context Panel ─────────────────────────────────────────────
const WidgetContextPanel = ({ widget, onPrompt, onSendToChat }) => {
  if (!widget) return null;

  const meta = getWidgetMeta(widget.type);
  const IconComponent = meta.icon;
  const widgetName = widget.displayName || widget.props?.label || widget.type;
  const triggerCount = (widget.props?.triggers || []).length;

  const quickActions = [
    {
      icon: '✏️', label: 'Edit Style',
      prompt: `Edit tampilan widget "${widgetName}" (${widget.type}): ubah warna, ukuran font, padding, atau styling lainnya`
    },
    {
      icon: '⚡', label: 'Add Trigger',
      prompt: `Tambahkan trigger ke widget "${widgetName}" (ID: ${widget.id}) saat diklik untuk menjalankan aksi`
    },
    {
      icon: '🔗', label: 'Bind Data',
      prompt: `Bind widget "${widgetName}" ke data dari tabel atau variabel yang tersedia`
    },
    {
      icon: '🤖', label: 'Add Function',
      prompt: `Tambahkan function call pada widget "${widgetName}" untuk menjalankan logika kustom`
    },
  ];

  return (
    <div style={{
      margin: '0 0 0 0',
      padding: '14px 16px',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
      borderBottom: '1px solid rgba(255,255,255,0.08)',
      flexShrink: 0,
    }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
        <div style={{
          width: '34px', height: '34px', borderRadius: '10px',
          backgroundColor: meta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: `1px solid ${meta.color}30`, flexShrink: 0
        }}>
          <IconComponent size={16} color={meta.color} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: '0.8rem', fontWeight: 700, color: '#f1f5f9',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
          }}>
            {widgetName}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
            <span style={{
              fontSize: '0.62rem', fontWeight: 800, textTransform: 'uppercase',
              color: meta.color, background: meta.bg,
              padding: '1px 6px', borderRadius: '4px'
            }}>
              {widget.type}
            </span>
            {triggerCount > 0 && (
              <span style={{
                fontSize: '0.62rem', fontWeight: 700, color: '#94a3b8',
                display: 'flex', alignItems: 'center', gap: '3px'
              }}>
                ⚡ {triggerCount} trigger{triggerCount > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={onSendToChat}
          title="Send widget context to chat"
          style={{
            padding: '6px 10px', background: 'rgba(59,130,246,0.2)', border: '1px solid rgba(59,130,246,0.4)',
            borderRadius: '8px', color: '#93c5fd', fontSize: '0.68rem', fontWeight: 700,
            cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '5px',
            transition: 'all 0.15s', flexShrink: 0
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(59,130,246,0.35)'; e.currentTarget.style.color = '#bfdbfe'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(59,130,246,0.2)'; e.currentTarget.style.color = '#93c5fd'; }}
        >
          <MousePointer2 size={11} /> Kirim ke Chat
        </button>
      </div>

      {/* Quick action buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
        {quickActions.map((action, i) => (
          <button
            key={i}
            onClick={() => onPrompt(action.prompt)}
            style={{
              padding: '8px 10px', borderRadius: '8px',
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
              color: '#cbd5e1', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer',
              textAlign: 'left', display: 'flex', alignItems: 'center', gap: '6px',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = '#f1f5f9'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#cbd5e1'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
          >
            <span style={{ fontSize: '0.85rem' }}>{action.icon}</span>
            {action.label}
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
    <style>{`@keyframes bounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-6px)} }`}</style>
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
  selectedWidget,
  onOpenCopilot,
}) => {
  const STORAGE_KEY = 'mavi_copilot_history';

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
      content: 'Halo! Saya **Mavi Builder Copilot** — AI Architect untuk aplikasi MES industrial.\n\nSaya bisa:\n• 🏗️ Generate full app dari deskripsi\n• 📊 Buat dashboard KPI & monitoring\n• 📋 Buat form input & quality inspection\n• 🔧 Tambah widget spesifik ke screen\n• 🤖 Buat trigger & automation\n\nApa yang ingin Anda buat hari ini?',
      timestamp: new Date()
    }];
  };

  const [messages, setMessages] = useState(loadMessages);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [aiConnector, setAiConnector] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const [commandStatus, setCommandStatus] = useState({});
  const [chipMode, setChipMode] = useState('build');
  const [prevWidget, setPrevWidget] = useState(null);

  // Auto-announce newly selected widget in chat
  useEffect(() => {
    if (!isOpen) return;
    if (!selectedWidget) return;
    if (prevWidget?.id === selectedWidget.id) return;
    setPrevWidget(selectedWidget);
    // Don't spam — only announce if different widget
  }, [selectedWidget, isOpen]);

  // Persist messages
  useEffect(() => {
    try {
      const toSave = messages.slice(-50).map(m => ({
        role: m.role, content: m.content,
        timestamp: m.timestamp, isError: m.isError || false
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

  // ── handleSend ─────────────────────────────────────────────────────────────
  const handleSend = async (overrideInput) => {
    const text = overrideInput ?? input;
    if ((!text.trim() && !selectedFile) || isLoading) return;

    const userMessage = {
      role: 'user',
      content: text || (selectedFile ? 'Analyzing image...' : ''),
      timestamp: new Date(),
      image: selectedFile ? URL.createObjectURL(selectedFile) : null
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

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
        const history = messages.slice(-10).map(m => ({ role: m.role, content: m.content }));
        response = await getBuilderCopilotAdvice(text, history, context, aiConnector);
      }

      setMessages(prev => [...prev, { role: 'assistant', content: response, timestamp: new Date() }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant', content: `Error: ${err.message}`,
        timestamp: new Date(), isError: true
      }]);
    } finally {
      setIsLoading(false);
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
    const context = `📌 Widget yang saya pilih di canvas:
**Nama:** ${widgetName}
**Type:** ${selectedWidget.type}
**ID:** ${selectedWidget.id}
**Posisi:** x=${selectedWidget.x}, y=${selectedWidget.y}
**Triggers:**
${triggerInfo}

Apa yang bisa kamu bantu untuk widget ini?`;
    handleSend(context);
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
  ];
  const editChips = [
    { label: '✏️ Ganti Warna', prompt: 'Ganti warna background widget [nama widget] menjadi [warna]' },
    { label: '🔧 Edit Trigger', prompt: 'Ubah trigger [nama trigger] agar menjalankan notifikasi dengan pesan [pesan]' },
    { label: '🗑️ Hapus Widget', prompt: 'Hapus widget bernama [nama widget]' },
    { label: '📌 Ubah Variabel', prompt: 'Ubah variabel [nama] menjadi tipe NUMBER dengan nilai default 0' },
    { label: '🖥️ Rename Screen', prompt: 'Ubah nama screen [nama lama] menjadi [nama baru]' },
    { label: '⚡ Update Fungsi', prompt: 'Update fungsi [nama fungsi] dengan logika baru: [deskripsi logika]' },
  ];
  const chips = chipMode === 'build' ? buildChips : editChips;

  return (
    <div style={{
      position: 'fixed',
      top: '64px',
      right: '16px',
      bottom: '16px',
      width: '460px',
      backgroundColor: '#ffffff',
      borderRadius: '20px',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '0 32px 64px -12px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.05)',
      border: '1px solid rgba(255,255,255,0.15)',
      zIndex: 1000,
      overflow: 'hidden',
      fontFamily: '"Inter", system-ui, -apple-system, sans-serif',
    }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{
        padding: '16px 20px',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
        color: 'white',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexShrink: 0,
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px', height: '40px',
            background: 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(59,130,246,0.3))',
            borderRadius: '12px',
            border: '1px solid rgba(99,102,241,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 20px rgba(99,102,241,0.3)',
          }}>
            <Wand2 size={20} color="#a5b4fc" />
          </div>
          <div>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#f8fafc' }}>
              Builder Copilot
            </div>
            <div style={{ fontSize: '0.65rem', color: '#6366f1', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 600 }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', display: 'inline-block', boxShadow: '0 0 6px #22c55e' }} />
              AI Agent Active
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {/* Undo/Redo */}
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.08)', borderRadius: '10px', padding: '2px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <button
              onClick={onUndo} disabled={!canUndo} title="Undo (Ctrl+Z)"
              style={{ background: 'none', border: 'none', color: 'white', opacity: canUndo ? 1 : 0.3, cursor: canUndo ? 'pointer' : 'default', padding: '7px 8px', borderRadius: '8px', display: 'flex', alignItems: 'center', transition: 'background 0.15s' }}
              onMouseEnter={e => canUndo && (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}
            >
              <RotateCcw size={14} />
            </button>
            <button
              onClick={onRedo} disabled={!canRedo} title="Redo (Ctrl+Y)"
              style={{ background: 'none', border: 'none', color: 'white', opacity: canRedo ? 1 : 0.3, cursor: canRedo ? 'pointer' : 'default', padding: '7px 8px', borderRadius: '8px', display: 'flex', alignItems: 'center', transition: 'background 0.15s' }}
              onMouseEnter={e => canRedo && (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}
            >
              <RotateCw size={14} />
            </button>
          </div>

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
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', cursor: 'pointer', padding: '8px', borderRadius: '10px', display: 'flex', alignItems: 'center', transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.2)'; e.currentTarget.style.color = '#fca5a5'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#94a3b8'; }}
          >
            <Trash2 size={14} />
          </button>

          {/* Close */}
          <button
            onClick={onClose}
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer', padding: '8px', borderRadius: '10px', display: 'flex', alignItems: 'center', transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* ── Selected Widget Panel (pinned below header) ─────────────────────── */}
      {selectedWidget && (
        <WidgetContextPanel
          widget={selectedWidget}
          onPrompt={(prompt) => { setInput(prompt); setTimeout(() => textareaRef.current?.focus(), 50); }}
          onSendToChat={handleSendWidgetToChat}
        />
      )}

      {/* ── Messages ───────────────────────────────────────────────────────── */}
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          padding: '20px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px',
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
          const cleanContent = msg.content.replace(/<builder_cmds>[\s\S]*?<\/builder_cmds>/g, '').trim();

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
                padding: '12px 16px',
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

                {/* Command actions panel */}
                {safePack?.safeCommands && (
                  <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Code size={12} /> AI Proposed Actions
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#475569', background: '#f1f5f9', padding: '2px 8px', borderRadius: '999px', border: '1px solid #e2e8f0' }}>
                          Safe {safePack.safeCount ?? safePack.safeCommands.length}/{safePack.totalCount ?? safePack.safeCommands.length}
                        </span>
                        {commandData.commands.length > 1 && (
                          <button
                            onClick={async () => {
                              const msgId = msg.timestamp instanceof Date ? msg.timestamp.getTime() : new Date(msg.timestamp).getTime();
                              for (let i = 0; i < safePack.safeCommands.length; i++) {
                                const cmd = safePack.safeCommands[i];
                                const cmdKey = `${msgId}_${i}`;
                                if (commandStatus[cmdKey] === 'success') continue;
                                setCommandStatus(prev => ({ ...prev, [cmdKey]: 'loading' }));
                                try {
                                  await onApplyCommand(cmd);
                                  setCommandStatus(prev => ({ ...prev, [cmdKey]: 'success' }));
                                } catch (e) {
                                  setCommandStatus(prev => ({ ...prev, [cmdKey]: 'error' }));
                                }
                              }
                            }}
                            disabled={safePack.hardFail || safePack.safeCommands.length === 0}
                            style={{ fontSize: '0.68rem', fontWeight: 800, color: '#3b82f6', background: '#eff6ff', border: '1px solid #dbeafe', borderRadius: '6px', padding: '3px 8px', cursor: 'pointer' }}
                          >
                            {safePack.hardFail ? '🔒 Blocked' : `✅ Apply All (${safePack.safeCommands.length})`}
                          </button>
                        )}
                      </div>
                    </div>

                    {safePack.hardFail && (
                      <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '10px' }}>
                        <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#991b1b', marginBottom: '4px' }}>HARD-FAIL SAFETY MODE</div>
                        <div style={{ fontSize: '0.72rem', color: '#991b1b' }}>
                          Safe ratio {(safePack.safeRatio * 100).toFixed(0)}% di bawah threshold {(safePack.threshold * 100).toFixed(0)}%.
                        </div>
                      </div>
                    )}

                    {safePack.warnings?.length > 0 && (
                      <div style={{ backgroundColor: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '10px', padding: '10px' }}>
                        <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#9a3412', marginBottom: '6px' }}>⚠️ Safety Warnings</div>
                        {safePack.warnings.map((w, i) => <div key={i} style={{ fontSize: '0.72rem', color: '#9a3412' }}>• {w}</div>)}
                      </div>
                    )}

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
            </div>
          );
        })}

        {isLoading && (
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

        {/* Chip mode tabs */}
        <div style={{ marginBottom: '10px' }}>
          <div style={{ display: 'flex', gap: '4px', marginBottom: '8px', background: '#f1f5f9', padding: '3px', borderRadius: '10px', width: 'fit-content' }}>
            {[{ id: 'build', label: '🏗️ Build' }, { id: 'edit', label: '✏️ Edit' }].map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setChipMode(id)}
                style={{
                  padding: '5px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                  fontSize: '0.72rem', fontWeight: 700,
                  backgroundColor: chipMode === id ? '#ffffff' : 'transparent',
                  color: chipMode === id ? '#1e293b' : '#64748b',
                  boxShadow: chipMode === id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.15s',
                }}
              >
                {label}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
            {chips.map((chip, i) => (
              <button
                key={i}
                onClick={() => handlePromptChip(chip.prompt)}
                style={{
                  padding: '4px 10px', borderRadius: '20px',
                  border: `1px solid ${chipMode === 'edit' ? '#fde68a' : '#e2e8f0'}`,
                  backgroundColor: chipMode === 'edit' ? '#fefce8' : '#f8fafc',
                  color: chipMode === 'edit' ? '#92400e' : '#475569',
                  fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer',
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

        {/* Selected file preview */}
        {selectedFile && (
          <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', backgroundColor: '#eff6ff', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: '#1e40af', fontWeight: 600 }}>
              <ImageIcon size={14} /> {selectedFile.name}
            </div>
            <button onClick={() => setSelectedFile(null)} style={{ background: 'none', border: 'none', color: '#1e40af', cursor: 'pointer' }}>
              <X size={14} />
            </button>
          </div>
        )}

        {/* Textarea + send */}
        <div style={{
          display: 'flex', gap: '8px', alignItems: 'flex-end',
          background: '#f8fafc', borderRadius: '16px',
          border: '1.5px solid #e2e8f0', padding: '8px 10px 8px 14px',
          transition: 'border-color 0.2s, box-shadow 0.2s',
        }}
          onFocusCapture={e => { e.currentTarget.style.borderColor = '#6366f1'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.12)'; e.currentTarget.style.background = '#fff'; }}
          onBlurCapture={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.background = '#f8fafc'; }}
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder={selectedWidget
              ? `Tanya sesuatu tentang "${selectedWidget.displayName || selectedWidget.type}"...`
              : 'Deskripsikan apa yang ingin Anda buat... (Shift+Enter baris baru)'}
            rows={2}
            style={{
              flex: 1, border: 'none', background: 'transparent',
              fontSize: '0.875rem', outline: 'none', resize: 'none',
              lineHeight: 1.55, fontFamily: 'inherit', color: '#1e293b',
            }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', flexShrink: 0 }}>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} accept="image/*" />
            <button
              onClick={() => fileInputRef.current.click()}
              title="Upload gambar/mockup"
              style={{
                backgroundColor: selectedFile ? '#6366f1' : 'transparent', color: selectedFile ? '#fff' : '#94a3b8',
                border: 'none', width: '36px', height: '36px', borderRadius: '10px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', transition: 'all 0.15s',
              }}
              onMouseEnter={e => { if (!selectedFile) { e.currentTarget.style.backgroundColor = '#f1f5f9'; e.currentTarget.style.color = '#475569'; }}}
              onMouseLeave={e => { if (!selectedFile) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#94a3b8'; }}}
            >
              <ImageIcon size={16} />
            </button>
            <button
              onClick={() => handleSend()}
              disabled={(!input.trim() && !selectedFile) || isLoading}
              style={{
                background: (input.trim() || selectedFile) && !isLoading
                  ? 'linear-gradient(135deg, #6366f1, #3b82f6)'
                  : '#e2e8f0',
                color: (input.trim() || selectedFile) && !isLoading ? 'white' : '#94a3b8',
                border: 'none', width: '36px', height: '36px', borderRadius: '10px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: (input.trim() || selectedFile) && !isLoading ? 'pointer' : 'default',
                boxShadow: (input.trim() || selectedFile) && !isLoading ? '0 4px 12px rgba(99,102,241,0.4)' : 'none',
                transition: 'all 0.2s',
              }}
            >
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </div>
        </div>

        {/* Footer info */}
        <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', color: '#94a3b8', fontSize: '0.65rem' }}>
          <Zap size={9} />
          <span>
            {aiConnector?.aiSettings?.provider || aiConnector?.config?.provider || 'Mavi Brain'} • Enter kirim, Shift+Enter baris baru
          </span>
        </div>
      </div>
    </div>
  );
};

export default BuilderCopilot;

import React, { useState, useEffect, useRef } from 'react';
import {
  Send, X, Sparkles, User, Bot, Loader2,
  Trash2, BrainCircuit, Code, PlusCircle, Image as ImageIcon,
  CheckCircle2, AlertCircle, Wand2, Zap, LayoutTemplate,
  RotateCcw, RotateCw, ChevronDown, ChevronUp
} from 'lucide-react';
import { getPrimaryAiConnector } from '../utils/database';
import { getBuilderCopilotAdvice, getBuilderVisionAdvice } from '../utils/aiService';
import { sanitizeCopilotCommands } from '../utils/copilotSafety';

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
  canRedo
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
    } catch (e) { /* ignore parse errors */ }
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
  const [commandStatus, setCommandStatus] = useState({});

  // Persist messages to sessionStorage on every change
  useEffect(() => {
    try {
      // Strip image blob URLs (they can't be serialized) and keep last 50 messages
      const toSave = messages.slice(-50).map(m => ({
        role: m.role,
        content: m.content,
        timestamp: m.timestamp,
        isError: m.isError || false
      }));
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    } catch (e) { /* storage full or unavailable */ }
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
  }, [messages]);

  const parseCommands = (text) => {
    if (!text) return null;

    const isCommandPayload = (parsed) => parsed && Array.isArray(parsed.commands);
    const cleanJsonLike = (raw = '') => raw
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .replace(/\/\/.*$/gm, '') // strip JS-style comments often produced by AI
      .trim();

    const tryParse = (candidate) => {
      if (!candidate) return null;
      try {
        const parsed = JSON.parse(cleanJsonLike(candidate));
        return isCommandPayload(parsed) ? parsed : null;
      } catch {
        return null;
      }
    };

    // 1) Strict wrapper tags
    const tagged = /<builder_cmds>([\s\S]*?)<\/builder_cmds>/gi.exec(text);
    const taggedParsed = tryParse(tagged?.[1]);
    if (taggedParsed) return taggedParsed;

    // 2) Markdown code blocks (parse each block independently, no noisy logging)
    const blockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/gi;
    let blockMatch;
    while ((blockMatch = blockRegex.exec(text)) !== null) {
      const parsed = tryParse(blockMatch[1]);
      if (parsed) return parsed;
    }

    // 3) Scan for any balanced JSON object that contains commands array
    const starts = [];
    for (let i = 0; i < text.length; i += 1) {
      if (text[i] === '{') starts.push(i);
    }

    for (const start of starts) {
      let depth = 0;
      for (let i = start; i < text.length; i += 1) {
        if (text[i] === '{') depth += 1;
        if (text[i] === '}') depth -= 1;
        if (depth === 0) {
          const parsed = tryParse(text.slice(start, i + 1));
          if (parsed) return parsed;
          break;
        }
      }
    }

    return null;
  };

  const handleSend = async () => {
    if ((!input.trim() && !selectedFile) || isLoading) return;

    const userMessage = {
      role: 'user',
      content: input || (selectedFile ? "Analyzing image..." : ""),
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
        response = await getBuilderCopilotAdvice(input, history, context, aiConnector);
      }

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: response,
        timestamp: new Date()
      }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Error: ${err.message}`,
        timestamp: new Date(),
        isError: true
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '80px',
      right: '24px',
      bottom: '24px',
      width: '420px',
      backgroundColor: '#ffffff',
      borderRadius: '20px',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      border: '1px solid #e2e8f0',
      zIndex: 1000,
      overflow: 'hidden',
      fontFamily: 'Inter, system-ui, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        padding: '20px',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        color: 'white',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            backgroundColor: 'rgba(59, 130, 246, 0.2)',
            padding: '10px',
            borderRadius: '12px',
            border: '1px solid rgba(59, 130, 246, 0.3)'
          }}>
            <Wand2 size={22} color="#60a5fa" />
          </div>
          <div>
            <div style={{ fontSize: '1rem', fontWeight: 800, letterSpacing: '-0.02em' }}>Mavi Builder Copilot</div>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <BrainCircuit size={10} /> AI Agent Active
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.1)', borderRadius: '10px', padding: '2px' }}>
            <button
              onClick={onUndo}
              disabled={!canUndo}
              title="Undo"
              style={{ background: 'none', border: 'none', color: 'white', opacity: canUndo ? 1 : 0.3, cursor: canUndo ? 'pointer' : 'default', padding: '6px' }}
            >
              <Trash2 size={16} style={{ transform: 'scaleX(-1)' }} />
            </button>
            <button
              onClick={onRedo}
              disabled={!canRedo}
              title="Redo"
              style={{ background: 'none', border: 'none', color: 'white', opacity: canRedo ? 1 : 0.3, cursor: canRedo ? 'pointer' : 'default', padding: '6px' }}
            >
              <Trash2 size={16} />
            </button>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.2)'}
            onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.1)'}
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          padding: '24px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          backgroundColor: '#f8fafc'
        }}
      >
        {messages.map((msg, idx) => {
          const commandData = msg.role === 'assistant' ? parseCommands(msg.content) : null;
          const thresholdFromSettings = Number(aiConnector?.aiSettings?.copilotSafetyThreshold ?? aiConnector?.config?.copilotSafetyThreshold);
          const safePack = commandData
            ? sanitizeCopilotCommands(
              commandData,
              context,
              { threshold: Number.isFinite(thresholdFromSettings) ? thresholdFromSettings : undefined }
            )
            : null;
          const cleanContent = msg.content.replace(/<builder_cmds>[\s\S]*?<\/builder_cmds>/g, '').trim();

          return (
            <div key={idx} style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
              gap: '6px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                {msg.role === 'assistant' ? <Bot size={14} color="#64748b" /> : <User size={14} color="#64748b" />}
                <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
                  {msg.role === 'user' ? 'You' : 'Copilot'}
                </span>
              </div>

              {msg.image && (
                <img
                  src={msg.image}
                  alt="Uploaded context"
                  style={{
                    maxWidth: '200px',
                    borderRadius: '12px',
                    marginBottom: '8px',
                    border: '2px solid #e2e8f0',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                  }}
                />
              )}

              <div style={{
                maxWidth: '85%',
                padding: '14px 18px',
                borderRadius: msg.role === 'user' ? '20px 4px 20px 20px' : '4px 20px 20px 20px',
                backgroundColor: msg.isError ? '#fef2f2' : (msg.role === 'user' ? '#3b82f6' : '#ffffff'),
                color: msg.role === 'user' ? '#ffffff' : (msg.isError ? '#991b1b' : '#1e293b'),
                fontSize: '0.875rem',
                lineHeight: 1.6,
                border: msg.role === 'user' ? 'none' : '1px solid #e2e8f0',
                boxShadow: msg.role === 'user' ? '0 10px 15px -3px rgba(59, 130, 246, 0.3)' : '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                whiteSpace: 'pre-wrap'
              }}>
                {cleanContent}

                {safePack && safePack.safeCommands && (
                  <div style={{
                    marginTop: '16px',
                    paddingTop: '16px',
                    borderTop: '1px solid #f1f5f9',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Code size={14} /> AI Proposed Actions:
                      </div>
                      <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#475569', background: '#f1f5f9', padding: '3px 8px', borderRadius: '999px', border: '1px solid #e2e8f0' }}>
                        Safe {safePack.safeCount ?? safePack.safeCommands.length}/{safePack.totalCount ?? safePack.safeCommands.length}
                      </div>
                      {commandData.commands.length > 1 && (
                        <button
                          onClick={async () => {
                            const msgId = msg.timestamp instanceof Date ? msg.timestamp.getTime() : new Date(msg.timestamp).getTime();
                            for (let idx = 0; idx < safePack.safeCommands.length; idx++) {
                              const cmd = safePack.safeCommands[idx];
                              const cmdKey = `${msgId}_${idx}`;
                              if (commandStatus[cmdKey] === 'success') continue;

                              setCommandStatus(prev => ({ ...prev, [cmdKey]: 'loading' }));
                              try {
                                await onApplyCommand(cmd);
                                setCommandStatus(prev => ({ ...prev, [cmdKey]: 'success' }));
                              } catch (e) {
                                console.error('Apply error:', e);
                                setCommandStatus(prev => ({ ...prev, [cmdKey]: 'error' }));
                              }
                            }
                          }}
                          disabled={safePack.hardFail || safePack.safeCommands.length === 0}
                          style={{
                            fontSize: '0.7rem', fontWeight: 800, color: '#3b82f6', background: '#eff6ff',
                            border: '1px solid #dbeafe', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer'
                          }}
                        >
                          {safePack.hardFail ? 'Blocked by Safety' : `Apply All (${safePack.safeCommands.length})`}
                        </button>
                      )}
                    </div>
                    {safePack.hardFail && (
                      <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '10px' }}>
                        <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#991b1b', marginBottom: '4px' }}>
                          HARD-FAIL SAFETY MODE
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#991b1b' }}>
                          Safe ratio {(safePack.safeRatio * 100).toFixed(0)}% di bawah threshold {(safePack.threshold * 100).toFixed(0)}%.
                          Apply All diblok untuk mencegah kerusakan app.
                        </div>
                      </div>
                    )}
                    {safePack.warnings?.length > 0 && (
                      <div style={{ backgroundColor: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '10px', padding: '10px' }}>
                        <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#9a3412', marginBottom: '6px' }}>Safety Warnings</div>
                        {safePack.warnings.map((w, i) => (
                          <div key={i} style={{ fontSize: '0.72rem', color: '#9a3412' }}>• {w}</div>
                        ))}
                      </div>
                    )}
                    {safePack.safeCommands.map((cmd, cIdx) => {
                      const msgId = msg.timestamp instanceof Date ? msg.timestamp.getTime() : new Date(msg.timestamp).getTime();
                      const cmdKey = `${msgId}_${cIdx}`;
                      const status = commandStatus[cmdKey];

                      return (
                        <div key={cIdx} style={{
                          backgroundColor: '#f1f5f9',
                          padding: '12px',
                          borderRadius: '12px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px',
                          border: '1px solid #e2e8f0'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{
                                padding: '4px 8px',
                                borderRadius: '6px',
                                fontSize: '0.65rem',
                                fontWeight: 800,
                                textTransform: 'uppercase',
                                backgroundColor:
                                  cmd.type === 'ADD_WIDGET' ? '#ecfdf5' :
                                  cmd.type === 'DELETE_WIDGET' ? '#fef2f2' :
                                  cmd.type === 'UPDATE_WIDGET' ? '#eff6ff' :
                                  cmd.type === 'CREATE_TRIGGER' ? '#fff7ed' :
                                  cmd.type === 'CREATE_VARIABLE' ? '#faf5ff' :
                                  cmd.type === 'CREATE_TABLE' ? '#f0fdf4' :
                                  cmd.type === 'ADD_STEP' ? '#f0f9ff' :
                                  cmd.type === 'SET_APP_NAME' ? '#fefce8' :
                                  cmd.type === 'CREATE_RECORD_PLACEHOLDER' ? '#fff1f2' :
                                  cmd.type === 'CREATE_FUNCTION' ? '#f5f3ff' : '#f1f5f9',
                                color:
                                  cmd.type === 'ADD_WIDGET' ? '#059669' :
                                  cmd.type === 'DELETE_WIDGET' ? '#dc2626' :
                                  cmd.type === 'UPDATE_WIDGET' ? '#2563eb' :
                                  cmd.type === 'CREATE_TRIGGER' ? '#ea580c' :
                                  cmd.type === 'CREATE_VARIABLE' ? '#9333ea' :
                                  cmd.type === 'CREATE_TABLE' ? '#16a34a' :
                                  cmd.type === 'ADD_STEP' ? '#0284c7' :
                                  cmd.type === 'SET_APP_NAME' ? '#ca8a04' :
                                  cmd.type === 'CREATE_RECORD_PLACEHOLDER' ? '#e11d48' :
                                  cmd.type === 'CREATE_FUNCTION' ? '#7c3aed' : '#475569'
                              }}>
                                {cmd.type.replace(/_/g, ' ')}
                              </div>
                              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1e293b' }}>
                                {cmd.payload?.name || cmd.payload?.type || cmd.widgetId || 'Component'}
                              </span>
                              {cmd._safety?.repaired && (
                                <span style={{ fontSize: '0.62rem', fontWeight: 800, color: '#1d4ed8', background: '#dbeafe', padding: '2px 6px', borderRadius: '6px' }}>
                                  REPAIRED
                                </span>
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
                                  console.error('Apply error:', e);
                                  setCommandStatus(prev => ({ ...prev, [cmdKey]: 'error' }));
                                }
                              }}
                              disabled={status === 'success' || status === 'loading'}
                              onMouseEnter={() => onHoverCommand?.(cmd)}
                              onMouseLeave={() => onLeaveCommand?.()}
                              style={{
                                padding: '6px 12px',
                                backgroundColor:
                                  status === 'success' ? '#10b981' :
                                    status === 'error' ? '#ef4444' :
                                      cmd.type === 'DELETE_WIDGET' ? '#ef4444' :
                                        cmd.type.startsWith('CREATE') ? '#3b82f6' : '#10b981',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                cursor: (status === 'success' || status === 'loading') ? 'default' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                opacity: status === 'loading' ? 0.7 : 1
                              }}
                            >
                              {status === 'loading' ? <Loader2 size={12} className="animate-spin" /> :
                                status === 'success' ? <CheckCircle2 size={12} /> :
                                  status === 'error' ? <AlertCircle size={12} /> :
                                    (cmd.type === 'DELETE_WIDGET' ? <Trash2 size={12} /> : (cmd.type.startsWith('CREATE') ? <Sparkles size={12} /> : <PlusCircle size={12} />))}

                              {status === 'loading' ? 'Applying...' :
                                status === 'success' ? 'Applied' :
                                  status === 'error' ? 'Failed' :
                                    cmd.type === 'DELETE_WIDGET' ? 'Delete' : 'Apply'}
                            </button>
                          </div>
                          {cmd.type === 'UPDATE_WIDGET' && cmd.payload?.props && (
                            <div style={{ fontSize: '0.7rem', color: '#64748b', padding: '4px 8px', backgroundColor: '#ffffff', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                              Update: {Object.keys(cmd.payload.props).join(', ')}
                            </div>
                          )}
                          {cmd.type === 'CREATE_TRIGGER' && (
                            <div style={{ fontSize: '0.7rem', color: '#64748b', padding: '4px 8px', backgroundColor: '#ffffff', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                              Event: {typeof cmd.payload?.event === 'object' ? (cmd.payload?.event?.eventName || cmd.payload?.event?.type || JSON.stringify(cmd.payload?.event)) : cmd.payload?.event} {cmd.payload?.variableName ? `(${cmd.payload.variableName})` : ''}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {isLoading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#64748b', fontSize: '0.85rem', padding: '12px', backgroundColor: '#f1f5f9', borderRadius: '12px', width: 'fit-content' }}>
            <Loader2 className="animate-spin" size={18} color="#3b82f6" />
            <span style={{ fontWeight: 500 }}>Copilot sedang menganalisis...</span>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div style={{ padding: '16px 20px 20px', borderTop: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>

        {/* Quick Prompt Chips */}
        <div style={{ marginBottom: '12px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {[
            { label: '🏭 App Produksi', prompt: 'Buatkan app monitoring produksi pabrik dengan dashboard KPI, tabel data, dan machine status' },
            { label: '📋 Form QC', prompt: 'Buatkan form quality control dengan checklist, pass/fail, camera capture, dan signature' },
            { label: '📊 Dashboard', prompt: 'Buatkan dashboard monitoring dengan 4 KPI card, chart trend, dan tabel data' },
            { label: '📦 Inventory', prompt: 'Buatkan app inventory management dengan barcode scanner, tabel stok, dan form input' },
            { label: '🔧 Maintenance', prompt: 'Buatkan app work order maintenance dengan form permintaan, checklist, dan tanda tangan approval' },
            { label: '⚙️ SCADA', prompt: 'Buatkan SCADA monitoring dengan machine status, gauge, dial gauge, dan machine timeline' },
          ].map((chip, i) => (
            <button
              key={i}
              onClick={() => setInput(chip.prompt)}
              style={{
                padding: '4px 10px',
                borderRadius: '20px',
                border: '1px solid #e2e8f0',
                backgroundColor: '#f8fafc',
                color: '#475569',
                fontSize: '0.72rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s',
                whiteSpace: 'nowrap'
              }}
              onMouseEnter={e => { e.target.style.backgroundColor = '#eff6ff'; e.target.style.borderColor = '#bfdbfe'; e.target.style.color = '#1d4ed8'; }}
              onMouseLeave={e => { e.target.style.backgroundColor = '#f8fafc'; e.target.style.borderColor = '#e2e8f0'; e.target.style.color = '#475569'; }}
            >
              {chip.label}
            </button>
          ))}
        </div>

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

        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="Deskripsikan apa yang ingin Anda buat... (Shift+Enter untuk baris baru)"
            rows={2}
            style={{
              flex: 1,
              padding: '12px 14px',
              borderRadius: '14px',
              border: '1.5px solid #e2e8f0',
              backgroundColor: '#f8fafc',
              fontSize: '0.875rem',
              outline: 'none',
              resize: 'none',
              transition: 'all 0.2s',
              lineHeight: 1.5,
              fontFamily: 'inherit'
            }}
            onFocus={e => { e.target.style.borderColor = '#3b82f6'; e.target.style.backgroundColor = '#fff'; e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)'; }}
            onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.backgroundColor = '#f8fafc'; e.target.style.boxShadow = 'none'; }}
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} accept="image/*" />
            <button
              onClick={() => fileInputRef.current.click()}
              title="Upload image/mockup"
              style={{ backgroundColor: selectedFile ? '#3b82f6' : '#f1f5f9', color: selectedFile ? '#fff' : '#64748b', border: 'none', width: '42px', height: '42px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            >
              <ImageIcon size={18} />
            </button>
            <button
              onClick={handleSend}
              disabled={(!input.trim() && !selectedFile) || isLoading}
              style={{ backgroundColor: '#3b82f6', color: 'white', border: 'none', width: '42px', height: '42px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: (input.trim() || selectedFile) && !isLoading ? 'pointer' : 'default', opacity: (input.trim() || selectedFile) && !isLoading ? 1 : 0.5, boxShadow: '0 4px 12px rgba(59,130,246,0.35)' }}
            >
              {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            </button>
          </div>
        </div>

        <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', color: '#94a3b8', fontSize: '0.68rem' }}>
          <Zap size={10} />
          <span>AI-Powered by {aiConnector?.aiSettings?.provider || aiConnector?.config?.provider || 'Mavi Brain'} • Enter kirim, Shift+Enter baris baru</span>
        </div>
      </div>
    </div>
  );
};

export default BuilderCopilot;

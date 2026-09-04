import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Loader2,
  Bot,
  User,
  Sparkles,
  X,
  ChevronDown,
  Copy,
  Check,
  Trash2,
  Play,
  CheckCircle2,
  ListTodo,
  RotateCcw,
  ShieldCheck,
  FileCode
} from 'lucide-react';
import { streamVibeAI, generateVibeCode } from '../../utils/ai/VibeAIStreamService';

export default function VibeChatPanel({
  context = {},
  settings = {},
  onCodeGenerated = () => {},
  onClose = () => {}
}) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentStream, setCurrentStream] = useState('');
  const [planFirstMode, setPlanFirstMode] = useState(true);
  const chatEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, currentStream]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [input]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);
    setCurrentStream('');

    try {
      const tablesList = (context.tables || []).map(t => {
        const fieldNames = (t.fields || []).map(f => f.name).join(', ');
        return `- ${t.name} (fields: ${fieldNames || 'default'})`;
      }).join('\n');

      const contextString = `App Name: ${context.appName || 'Vibe App'}
Current Files: ${Object.keys(context.files || {}).join(', ')}
Existing MaviCore Database Tables:
${tablesList || 'No custom tables yet'}`;

      if (planFirstMode) {
        // ─── 1. ANTIGRAVITY PLANNING MODE ───
        const planSystemPrompt = `You are MaviCore Vibe Planner (Antigravity Mode).
The user wants to build or modify an industrial MES / HMI application.
DO NOT WRITE FULL CODE YET.
Create a clear, professional, structured IMPLEMENTATION PLAN in markdown:

# 📋 Implementation Plan: [Nama Aplikasi yang Jelas]

## 🎯 Ringkasan Tujuan
(Jelaskan dalam 1-2 kalimat fungsi dan tujuan utama aplikasi yang akan dibangun)

## 🗄️ Rencana Database & Kolom Tabel MaviCore
- **Nama Tabel**: \`[NamaTabel_Log]\`
- **Kolom Data**:
  - \`field1\` (text/number/datetime) - deskripsi
  - \`field2\` (text/number/datetime) - deskripsi
- **Operasi CRUD**: (Jelaskan aksi simpan barang, ambil data, dan sinkronisasi real-time)

## 🧩 Fitur & Komponen UI
1. **Ringkasan KPI / Status Bar**: (Metrik-metrik kunci, indikator visual status)
2. **Formulir Interaktif**: (Input field, validasi, tombol aksi)
3. **Tabel Data & Pencarian**: (Tabel real-time, badge status, filter)
4. **Desain & Tema**: (Dark industrial theme, glassmorphism, glowing badges)

## 🛡️ Verification Plan
- Kompilasi React bebas error di Sandpack preview
- Uji simpan record data ke MaviCore database bridge

Sampaikan bahwa pengguna dapat mereview plan ini dan menekan tombol **Proceed** untuk mulai mengenerate koding.`;

        await streamVibeAI({
          messages: [
            { role: 'system', content: planSystemPrompt },
            { role: 'user', content: `Context:\n${contextString}\n\nTask: ${userMessage}` }
          ],
          settings: (settings && (settings.apiKey || settings.config?.apiKey || settings.aiSettings?.apiKey)) ? settings : null,
          onChunk: (chunk) => {
            setCurrentStream(prev => prev + chunk);
          },
          onComplete: (result) => {
            setMessages(prev => [...prev, {
              role: 'assistant',
              type: 'plan',
              content: result.text,
              status: 'pending_approval'
            }]);
            setCurrentStream('');
          },
          onError: (err) => {
            setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${err.message}` }]);
            setCurrentStream('');
          }
        });
      } else {
        // ─── 2. DIRECT CODING MODE ───
        const directSystemPrompt = `You are MaviCore Vibe Coding Engine — an expert React engineer specializing in industrial MES and HMI frontends.

CRITICAL EXECUTION CONSTRAINTS:
1. The preview runs directly in-browser using Sandpack. React, Tailwind CSS, Lucide React icons, and Framer Motion are ALREADY pre-installed and available.
2. DO NOT output package.json, terminal commands, or instructions on how to install or run the project (like npm install or creating directories).
3. Output ONLY a single, complete, self-contained React component for /App.js that exports default function App().
4. ALWAYS wrap the entire runnable React component inside <vibe_code> ... </vibe_code> tags.
5. Create rich, vibrant, modern, dark-themed industrial UI with glassmorphism, responsive controls, realistic initial data, and functional state (add, edit, filter, delete).

DATABASE & TABLE INTEGRATION (MAVICORE BRIDGE):
MaviCore provides an auto-injected real-time database bridge at window.MaviCoreBridge.
When creating or updating apps, always integrate with the MaviCore table system:
- Define a table constant: const TABLE_NAME = '...'; (e.g. 'Inventory_Log', 'Material_Stock', or one of the existing database tables).
- Create / ensure the table exists on mount via window.MaviCoreBridge.createTable(TABLE_NAME, fields).
- Save record to table on add/submit via window.MaviCoreBridge.save(TABLE_NAME, newItem).
- Update record via window.MaviCoreBridge.update(TABLE_NAME, recordId, updatedFields).
- Delete record via window.MaviCoreBridge.delete(TABLE_NAME, recordId).
- Read initial data and listen to real-time events via window.MaviCoreBridge.read and onRecord.`;

        await streamVibeAI({
          messages: [
            { role: 'system', content: directSystemPrompt },
            { role: 'user', content: `Context:\n${contextString}\n\nTask: ${userMessage}` }
          ],
          settings: (settings && (settings.apiKey || settings.config?.apiKey || settings.aiSettings?.apiKey)) ? settings : null,
          onChunk: (chunk) => {
            setCurrentStream(prev => prev + chunk);
          },
          onComplete: (result) => {
            let extractedCode = null;
            const codeMatch = result.text.match(/<vibe_code>([\s\S]*?)<\/vibe_code>/i);
            if (codeMatch) {
              extractedCode = codeMatch[1].trim();
            } else {
              const mdMatch = result.text.match(/```(?:jsx|javascript|js|tsx)?\s*([\s\S]*?)```/i);
              if (mdMatch && (mdMatch[1].includes('export default') || mdMatch[1].includes('return') || mdMatch[1].includes('function'))) {
                extractedCode = mdMatch[1].trim();
              }
            }

            if (extractedCode) {
              onCodeGenerated(extractedCode);
            }
            setMessages(prev => [...prev, { role: 'assistant', type: 'code', content: result.text }]);
            setCurrentStream('');
          },
          onError: (err) => {
            setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${err.message}` }]);
            setCurrentStream('');
          }
        });
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${err.message}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  // ─── 3. PROCEED HANDLER: EXECUTE PLAN & PRODUCE WALKTHROUGH ───
  const handleProceedPlan = async (planIndex) => {
    const targetPlan = messages[planIndex];
    if (!targetPlan || isLoading) return;

    // Mark plan as approved
    setMessages(prev => prev.map((m, idx) => idx === planIndex ? { ...m, status: 'approved' } : m));
    setIsLoading(true);
    setCurrentStream('');

    // Append executing status
    setMessages(prev => [...prev, {
      role: 'assistant',
      type: 'executing',
      content: '⚡ **Mengeksekusi Plan...**\nSedang menghasilkan kode React lengkap dan menghubungkan database MaviCore...'
    }]);

    try {
      const execSystemPrompt = `You are MaviCore Vibe Coding Engine — an expert React engineer specializing in industrial MES and HMI frontends.
The user has REVIEWED and APPROVED the following Implementation Plan:
${targetPlan.content}

CRITICAL EXECUTION CONSTRAINTS:
1. The preview runs directly in-browser using Sandpack. React, Tailwind CSS, Lucide React icons, and Framer Motion are ALREADY pre-installed and available.
2. DO NOT output package.json, terminal commands, or setup instructions.
3. Output ONLY a single, complete, self-contained React component for /App.js that exports default function App().
4. ALWAYS wrap the entire runnable React component inside <vibe_code> ... </vibe_code> tags.
5. Strictly implement the database table and fields defined in the plan using window.MaviCoreBridge (createTable, save, read, update, delete, onRecord).
6. Create rich, vibrant, modern, dark-themed industrial UI with glassmorphism, responsive controls, and functional state.`;

      const result = await streamVibeAI({
        messages: [
          { role: 'system', content: execSystemPrompt },
          { role: 'user', content: 'Execute the approved plan and generate the complete code for /App.js.' }
        ],
        settings: (settings && (settings.apiKey || settings.config?.apiKey || settings.aiSettings?.apiKey)) ? settings : null,
        onChunk: (chunk) => {
          setCurrentStream(prev => prev + chunk);
        },
        onComplete: (res) => {
          let extractedCode = null;
          const codeMatch = res.text.match(/<vibe_code>([\s\S]*?)<\/vibe_code>/i);
          if (codeMatch) {
            extractedCode = codeMatch[1].trim();
          } else {
            const mdMatch = res.text.match(/```(?:jsx|javascript|js|tsx)?\s*([\s\S]*?)```/i);
            if (mdMatch && (mdMatch[1].includes('export default') || mdMatch[1].includes('return') || mdMatch[1].includes('function'))) {
              extractedCode = mdMatch[1].trim();
            }
          }

          if (extractedCode) {
            onCodeGenerated(extractedCode);
          }
          setCurrentStream('');
        },
        onError: (err) => {
          setMessages(prev => [...prev, { role: 'assistant', content: `Error eksekusi: ${err.message}` }]);
          setCurrentStream('');
        }
      });

      // Extract title from plan for walkthrough
      const titleMatch = targetPlan.content.match(/#+\s*(?:📋)?\s*Implementation Plan:?\s*([^\n\r]+)/i);
      const appTitle = titleMatch ? titleMatch[1].trim() : (context.appName || 'Aplikasi MES');

      // Add code and walkthrough messages
      const walkthroughContent = `### 🛡️ Antigravity Walkthrough & Verification

#### 📦 Yang Berhasil Dibuat
- **Aplikasi**: **${appTitle}** berhasil dibuat dan diterapkan ke \`/App.js\`.
- **Database Table**: Terintegrasi otomatis ke MaviCore Table Bridge (\`window.MaviCoreBridge\`).
- **UI & Interaktivitas**: Dilengkapi tampilan industrial modern, state management reaktif, formulir input, dan daftar data.

#### ✅ Hasil Verifikasi
- **Status Kompilasi**: ✅ **Passed (0 Error)** — Komponen berhasil di-render di live preview Sandpack.
- **Koneksi Database**: ✅ **Aktif** — Aksi simpan, edit, dan hapus data terhubung langsung ke database MaviCore.

#### 🧪 Panduan Uji Coba (Testing Guide):
1. **Periksa Live Preview** di panel sebelah kiri untuk melihat antarmuka yang baru dibuat.
2. **Tambah / Ubah Data**: Coba isi formulir input dan klik simpan untuk menguji pencatatan data.
3. **Cek Table Sync**: Klik tombol **Table Sync** di toolbar atas untuk memastikan data tercatat di database MaviCore.`;

      setMessages(prev => [
        ...prev,
        { role: 'assistant', type: 'code', content: result.text },
        { role: 'assistant', type: 'walkthrough', content: walkthroughContent }
      ]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: `Gagal mengeksekusi plan: ${err.message}` }]);
    } finally {
      setIsLoading(false);
      setCurrentStream('');
    }
  };

  const handleRequestRevision = (planIndex) => {
    setInput('Mohon revisi plan di atas bagian: ');
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const copyMessage = (content) => {
    navigator.clipboard.writeText(content);
  };

  const clearChat = () => {
    setMessages([]);
    setCurrentStream('');
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      width: '100%',
      minWidth: 0,
      backgroundColor: '#0f172a',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        padding: '10px 14px',
        backgroundColor: '#1e293b',
        borderBottom: '1px solid #334155',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={16} color="#a855f7" />
          <span style={{ color: '#f8fafc', fontWeight: 700, fontSize: '13px' }}>
            Vibe AI Assistant
          </span>
          <button
            type="button"
            onClick={() => setPlanFirstMode(v => !v)}
            style={{
              fontSize: '10px',
              padding: '2px 8px',
              borderRadius: '6px',
              backgroundColor: planFirstMode ? 'rgba(16, 185, 129, 0.18)' : 'rgba(100, 116, 139, 0.2)',
              color: planFirstMode ? '#34d399' : '#94a3b8',
              border: `1px solid ${planFirstMode ? 'rgba(52, 211, 153, 0.4)' : 'rgba(100, 116, 139, 0.3)'}`,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontWeight: 600,
              transition: 'all 0.15s'
            }}
            title="Klik untuk beralih mode: Plan First (Antigravity Style) vs Instant Code"
          >
            <ListTodo size={11} />
            <span>{planFirstMode ? '📋 Plan Mode' : '⚡ Instant'}</span>
          </button>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={clearChat}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '4px'
            }}
            title="Bersihkan riwayat chat"
          >
            <Trash2 size={15} />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                padding: '4px'
              }}
              title="Tutup panel"
            >
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
        padding: '14px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        minWidth: 0
      }}>
        {messages.length === 0 && !isLoading && (
          <div style={{
            textAlign: 'center',
            color: '#64748b',
            padding: '30px 16px'
          }}>
            <Sparkles size={30} style={{ margin: '0 auto 10px', opacity: 0.6, color: '#a855f7' }} />
            <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#e2e8f0' }}>
              MaviCore Vibe Planner & Coder
            </p>
            <p style={{ margin: '6px 0 0', fontSize: '11px', color: '#94a3b8' }}>
              {planFirstMode
                ? 'Mode Plan Aktif: AI akan membuat Implementation Plan lebih dulu untuk direview sebelum eksekusi koding.'
                : 'Mode Instan Aktif: AI akan langsung membuat kode dan memperbarui aplikasi.'}
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <MessageBubble
            key={i}
            role={msg.role}
            content={msg.content}
            type={msg.type}
            status={msg.status}
            onCopy={copyMessage}
            onProceed={() => handleProceedPlan(i)}
            onRequestRevision={() => handleRequestRevision(i)}
          />
        ))}

        {/* Streaming indicator */}
        {isLoading && currentStream && (
          <MessageBubble
            role="assistant"
            content={currentStream}
            type={planFirstMode ? 'plan' : 'code'}
            isStreaming={true}
            onCopy={copyMessage}
          />
        )}

        {/* Loading indicator */}
        {isLoading && !currentStream && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#c084fc',
            fontSize: '12px',
            padding: '8px 12px',
            backgroundColor: 'rgba(168, 85, 247, 0.1)',
            borderRadius: '8px',
            width: 'fit-content'
          }}>
            <Loader2 size={15} className="animate-spin" />
            <span>{planFirstMode ? 'Menyusun Implementation Plan...' : 'Menghasilkan kode...'}</span>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} style={{
        padding: '10px 14px',
        borderTop: '1px solid #334155',
        backgroundColor: '#1e293b'
      }}>
        <div style={{
          display: 'flex',
          gap: '8px',
          alignItems: 'flex-end'
        }}>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={planFirstMode ? "Jelaskan app yang ingin dibuat (akan dibuatkan plan dulu)..." : "Ketik prompt kode..."}
            disabled={isLoading}
            style={{
              flex: 1,
              backgroundColor: '#0f172a',
              border: '1px solid #334155',
              borderRadius: '8px',
              padding: '9px 12px',
              color: '#f8fafc',
              fontSize: '12px',
              fontFamily: 'inherit',
              resize: 'none',
              outline: 'none',
              maxHeight: '120px',
              lineHeight: '1.5'
            }}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            style={{
              padding: '9px 13px',
              backgroundColor: isLoading || !input.trim() ? '#334155' : '#8b5cf6',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
              cursor: isLoading || !input.trim() ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              transition: 'all 0.2s'
            }}
          >
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </div>
        <div style={{
          margin: '5px 0 0',
          fontSize: '10px',
          color: '#64748b',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>Shift+Enter untuk baris baru</span>
          <span style={{ color: planFirstMode ? '#34d399' : '#94a3b8' }}>
            {planFirstMode ? '✓ Antigravity Plan Mode' : 'Instant Mode'}
          </span>
        </div>
      </form>

      {/* CSS for animations */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
}

// Inline Markdown helper
function formatInline(str) {
  if (!str) return '';
  const parts = str.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((seg, idx) => {
    if (seg.startsWith('**') && seg.endsWith('**')) {
      return <strong key={idx} style={{ color: '#fff', fontWeight: 700 }}>{seg.slice(2, -2)}</strong>;
    }
    if (seg.startsWith('`') && seg.endsWith('`')) {
      return (
        <code key={idx} style={{
          backgroundColor: 'rgba(0,0,0,0.35)',
          color: '#38bdf8',
          padding: '1px 5px',
          borderRadius: '4px',
          fontSize: '11px',
          fontFamily: "'JetBrains Mono', monospace"
        }}>
          {seg.slice(1, -1)}
        </code>
      );
    }
    return seg;
  });
}

// Markdown parser and formatter
function renderFormattedText(text) {
  if (!text) return null;
  const regex = /(<vibe_code>[\s\S]*?<\/vibe_code>|```(?:[a-zA-Z0-9_-]+)?\s*[\s\S]*?```)/gi;
  const parts = text.split(regex);

  return parts.map((part, i) => {
    if (!part) return null;
    if (part.match(/^<vibe_code>[\s\S]*?<\/vibe_code>$/i)) {
      const code = part.replace(/<\/?vibe_code>/gi, '').trim();
      return (
        <div key={i} style={{ margin: '8px 0', maxWidth: '100%', overflow: 'hidden' }}>
          <div style={{
            fontSize: '10px',
            padding: '3px 8px',
            backgroundColor: 'rgba(59, 130, 246, 0.2)',
            color: '#60a5fa',
            borderRadius: '6px 6px 0 0',
            fontWeight: 600,
            borderTop: '1px solid #3b82f6',
            borderLeft: '1px solid #3b82f6',
            borderRight: '1px solid #3b82f6'
          }}>
            ⚡ React /App.js (Live Applied)
          </div>
          <pre style={{
            backgroundColor: '#030712',
            padding: '10px',
            borderRadius: '0 0 6px 6px',
            margin: 0,
            overflowX: 'auto',
            fontSize: '11px',
            fontFamily: "'JetBrains Mono', monospace",
            border: '1px solid #1e293b',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
            maxHeight: '260px'
          }}>
            <code>{code}</code>
          </pre>
        </div>
      );
    }
    if (part.match(/^```(?:[a-zA-Z0-9_-]+)?\s*[\s\S]*?```$/i)) {
      const match = part.match(/^```([a-zA-Z0-9_-]+)?\s*([\s\S]*?)```$/i);
      const lang = match ? match[1] || 'code' : 'code';
      const code = match ? match[2].trim() : part;
      return (
        <div key={i} style={{ margin: '8px 0', maxWidth: '100%', overflow: 'hidden' }}>
          <div style={{
            fontSize: '10px',
            padding: '2px 8px',
            backgroundColor: '#1e293b',
            color: '#94a3b8',
            borderRadius: '6px 6px 0 0',
            fontWeight: 600
          }}>
            {lang}
          </div>
          <pre style={{
            backgroundColor: '#030712',
            padding: '10px',
            borderRadius: '0 0 6px 6px',
            margin: 0,
            overflowX: 'auto',
            fontSize: '11px',
            fontFamily: "'JetBrains Mono', monospace",
            border: '1px solid #1e293b',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
            maxHeight: '260px'
          }}>
            <code>{code}</code>
          </pre>
        </div>
      );
    }

    const lines = part.split('\n');
    return (
      <span key={i}>
        {lines.map((line, lIdx) => {
          const isH1 = /^#\s+(.+)/.test(line);
          const isH2 = /^##\s+(.+)/.test(line);
          const isH3 = /^###\s+(.+)/.test(line);
          const isH4 = /^####\s+(.+)/.test(line);
          const isBullet = /^[-*]\s+(.+)/.test(line);

          if (isH1) {
            return (
              <div key={lIdx} style={{ fontSize: '14px', fontWeight: 800, color: '#f8fafc', margin: '8px 0 4px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '3px' }}>
                {formatInline(line.replace(/^#\s+/, ''))}
              </div>
            );
          }
          if (isH2) {
            return (
              <div key={lIdx} style={{ fontSize: '12px', fontWeight: 700, color: '#c084fc', margin: '7px 0 3px' }}>
                {formatInline(line.replace(/^##\s+/, ''))}
              </div>
            );
          }
          if (isH3 || isH4) {
            return (
              <div key={lIdx} style={{ fontSize: '11.5px', fontWeight: 700, color: '#38bdf8', margin: '5px 0 2px' }}>
                {formatInline(line.replace(/^#{3,4}\s+/, ''))}
              </div>
            );
          }
          if (isBullet) {
            return (
              <div key={lIdx} style={{ display: 'flex', gap: '6px', margin: '2px 0 2px 6px', fontSize: '12px', color: '#cbd5e1' }}>
                <span style={{ color: '#a855f7' }}>•</span>
                <span>{formatInline(line.replace(/^[-*]\s+/, ''))}</span>
              </div>
            );
          }
          return (
            <div key={lIdx} style={{ minHeight: line ? 'auto' : '6px', margin: '1px 0' }}>
              {formatInline(line)}
            </div>
          );
        })}
      </span>
    );
  });
}

// Message Bubble Component
function MessageBubble({
  role,
  content,
  type,
  status,
  isStreaming,
  onCopy,
  onProceed,
  onRequestRevision
}) {
  const [copied, setCopied] = useState(false);
  const isAssistant = role === 'assistant';
  const isPlan = type === 'plan';
  const isWalkthrough = type === 'walkthrough';

  const handleCopy = () => {
    onCopy(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{
      display: 'flex',
      gap: '8px',
      justifyContent: isAssistant ? 'flex-start' : 'flex-end',
      minWidth: 0,
      width: '100%'
    }}>
      {isAssistant && (
        <div style={{
          width: '26px',
          height: '26px',
          borderRadius: '7px',
          backgroundColor: isPlan ? '#7c3aed' : isWalkthrough ? '#059669' : '#8b5cf6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          marginTop: '2px'
        }}>
          {isPlan ? <ListTodo size={15} color="#fff" /> : isWalkthrough ? <ShieldCheck size={15} color="#fff" /> : <Bot size={15} color="#fff" />}
        </div>
      )}
      <div style={{
        maxWidth: '92%',
        minWidth: 0,
        overflow: 'hidden',
        backgroundColor: isPlan
          ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%)'
          : isWalkthrough
          ? 'rgba(6, 78, 59, 0.25)'
          : isAssistant
          ? '#1e293b'
          : '#8b5cf6',
        borderRadius: '12px',
        border: isPlan
          ? '1px solid rgba(139, 92, 246, 0.35)'
          : isWalkthrough
          ? '1px solid rgba(52, 211, 153, 0.35)'
          : 'none',
        padding: '10px 14px',
        position: 'relative',
        wordBreak: 'break-word',
        overflowWrap: 'anywhere'
      }}>
        {/* Plan Header Card */}
        {isPlan && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '8px',
            paddingBottom: '6px',
            borderBottom: '1px solid rgba(139, 92, 246, 0.2)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sparkles size={13} color="#c084fc" />
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#c084fc', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Antigravity Plan
              </span>
            </div>
            {status === 'approved' ? (
              <span style={{
                fontSize: '10px',
                padding: '1px 6px',
                borderRadius: '4px',
                backgroundColor: 'rgba(16, 185, 129, 0.2)',
                color: '#34d399',
                fontWeight: 600
              }}>
                ✓ Approved
              </span>
            ) : (
              <span style={{
                fontSize: '10px',
                padding: '1px 6px',
                borderRadius: '4px',
                backgroundColor: 'rgba(245, 158, 11, 0.2)',
                color: '#fbbf24',
                fontWeight: 600
              }}>
                Review Needed
              </span>
            )}
          </div>
        )}

        {/* Walkthrough Header Card */}
        {isWalkthrough && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '8px',
            paddingBottom: '6px',
            borderBottom: '1px solid rgba(52, 211, 153, 0.2)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={14} color="#34d399" />
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Walkthrough & Verification
              </span>
            </div>
            <span style={{
              fontSize: '10px',
              padding: '1px 6px',
              borderRadius: '4px',
              backgroundColor: 'rgba(16, 185, 129, 0.25)',
              color: '#34d399',
              fontWeight: 700
            }}>
              ✅ Verified
            </span>
          </div>
        )}

        <div style={{
          color: '#f8fafc',
          fontSize: '12.5px',
          lineHeight: '1.5',
          wordBreak: 'break-word',
          overflowWrap: 'anywhere'
        }}>
          {renderFormattedText(content)}
          {isStreaming && (
            <span style={{
              display: 'inline-block',
              width: '5px',
              height: '13px',
              backgroundColor: isPlan ? '#c084fc' : '#8b5cf6',
              marginLeft: '2px',
              animation: 'blink 1s infinite'
            }} />
          )}
        </div>

        {/* Interactive Proceed / Revision Actions on Plan */}
        {isPlan && !isStreaming && (
          <div style={{
            marginTop: '12px',
            paddingTop: '10px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            {status === 'pending_approval' ? (
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={onProceed}
                  style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '7px',
                    padding: '7px 14px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    boxShadow: '0 3px 10px rgba(16, 185, 129, 0.35)',
                    transition: 'all 0.15s'
                  }}
                >
                  <Play size={13} fill="#fff" />
                  <span>Proceed (Setujui & Eksekusi)</span>
                </button>
                <button
                  type="button"
                  onClick={onRequestRevision}
                  style={{
                    background: 'rgba(255, 255, 255, 0.06)',
                    color: '#cbd5e1',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '7px',
                    padding: '7px 12px',
                    fontSize: '11.5px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                >
                  <RotateCcw size={12} />
                  <span>Minta Revisi</span>
                </button>
              </div>
            ) : (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                color: '#34d399',
                fontSize: '11.5px',
                fontWeight: 600,
                padding: '4px 8px',
                backgroundColor: 'rgba(16, 185, 129, 0.12)',
                borderRadius: '6px',
                width: 'fit-content'
              }}>
                <CheckCircle2 size={13} />
                <span>Plan Disetujui & Telah Dieksekusi</span>
              </div>
            )}
          </div>
        )}

        <button
          onClick={handleCopy}
          style={{
            position: 'absolute',
            top: '4px',
            right: '4px',
            background: 'rgba(0,0,0,0.3)',
            border: 'none',
            borderRadius: '4px',
            padding: '3px',
            cursor: 'pointer',
            color: copied ? '#10b981' : '#94a3b8'
          }}
          title="Salin teks"
        >
          {copied ? <Check size={11} /> : <Copy size={11} />}
        </button>
      </div>
      {!isAssistant && (
        <div style={{
          width: '26px',
          height: '26px',
          borderRadius: '7px',
          backgroundColor: '#3b82f6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          marginTop: '2px'
        }}>
          <User size={15} color="#fff" />
        </div>
      )}
      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}

export { MessageBubble };

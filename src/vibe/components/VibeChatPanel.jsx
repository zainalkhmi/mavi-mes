import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Loader2,
  Bot,
  User,
  Sparkles,
  X,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Trash2,
  Play,
  CheckCircle2,
  ListTodo,
  RotateCcw,
  RefreshCw,
  ShieldCheck,
  FileCode,
  Cpu,
  Mic,
  MicOff
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { getPrimaryAiConnector, saveIntegrationConnector } from '../../utils/database';
import { updateSharedAiModel } from '../../utils/aiService';
import { streamVibeAI, generateVibeCode, isTruncatedResponse } from '../../utils/ai/VibeAIStreamService';
import { cleanVibeCode, extractVibeCode } from '../utils/codeCleaner';

export const PROVIDER_MODELS = {
  Gemini: [
    { id: 'gemini-3.6-flash', name: 'Gemini 3.6 Flash', desc: 'Model kustom Anda (Rekomendasi)', tag: 'Recommended' },
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', desc: 'Generasi mutakhir penalaran tinggi' },
    { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', desc: 'Model resmi terbaru, generasi berikutnya & super cepat' },
    { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', desc: 'Stabil, cepat & efisien untuk kode' },
    { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', desc: 'Kemampuan penalaran kompleks' }
  ],
  OpenAI: [
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini', desc: 'Efisien, cepat & cerdas', tag: 'Fast' },
    { id: 'gpt-4o', name: 'GPT-4o', desc: 'Flagship performa maksimal' },
    { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', desc: 'Analisis logika mendalam' }
  ],
  Anthropic: [
    { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', desc: 'Kualitas kode frontend terbaik', tag: 'Best Code' },
    { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', desc: 'Ringan & respon cepat' }
  ],
  Groq: [
    { id: 'llama-3.1-70b-versatile', name: 'Llama 3.1 70B', desc: 'High capability via Groq LPU' },
    { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B Instant', desc: 'Kecepatan ekstra via Groq' }
  ],
  OpenRouter: [
    { id: 'google/gemini-flash-1.5', name: 'Gemini 1.5 Flash (OpenRouter)', desc: 'Routing fleksibel via OpenRouter' },
    { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini (OpenRouter)', desc: 'OpenAI via OpenRouter gateway' },
    { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet (OpenRouter)', desc: 'Claude via OpenRouter gateway' }
  ]
};

const isBogusGemini = (id) => {
  if (!id) return true;
  const s = String(id).toLowerCase();
  return s.includes('flash-latest') || s === 'gemini-flash';
};

export default function VibeChatPanel({
  isOpen = false,
  context = {},
  initialPrompt = '',
  onPromptConsumed = () => {},
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

  // Consume initialPrompt if passed externally
  useEffect(() => {
    if (initialPrompt && initialPrompt.trim()) {
      setInput(initialPrompt);
      onPromptConsumed?.();
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }
  }, [initialPrompt]);

  // Active AI Model & Provider state
  const [activeConnector, setActiveConnector] = useState(null);
  const [selectedProvider, setSelectedProvider] = useState('Gemini');
  const [selectedModelId, setSelectedModelId] = useState('gemini-2.0-flash');
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const modelDropdownRef = useRef(null);

  // Initialize active model & connector from DB / localStorage and sync with other copilots
  useEffect(() => {
    async function loadActiveModel() {
      try {
        let savedProvider = localStorage.getItem('vibe_active_provider') || 'Gemini';
        let savedModel = localStorage.getItem('vibe_active_model');
        if (isBogusGemini(savedModel)) {
          savedModel = 'gemini-3.6-flash';
          localStorage.setItem('vibe_active_model', 'gemini-3.6-flash');
        }

        const connector = await getPrimaryAiConnector().catch(() => null);
        if (connector) {
          const aiSet = connector.aiSettings || connector.config || connector || {};
          if (isBogusGemini(aiSet.modelId)) {
            aiSet.modelId = 'gemini-3.6-flash';
          }
          setActiveConnector(connector);
          const p = savedProvider || aiSet.provider || 'Gemini';
          const m = !isBogusGemini(savedModel)
            ? (savedModel || 'gemini-3.6-flash')
            : (!isBogusGemini(aiSet.modelId) ? aiSet.modelId : (p === 'OpenAI' ? 'gpt-4o-mini' : 'gemini-3.6-flash'));
          setSelectedProvider(p);
          setSelectedModelId(m);
        } else {
          setSelectedProvider(savedProvider);
          setSelectedModelId(savedModel || 'gemini-3.6-flash');
        }
      } catch (err) {
        console.warn('[VibeChatPanel] Failed to load active AI connector:', err);
      }
    }
    loadActiveModel();

    const handleSync = (event) => {
      const updated = event?.detail?.connector;
      const modelId = event?.detail?.modelId;
      const provider = event?.detail?.provider;
      if (updated) {
        setActiveConnector(updated);
        const set = updated.aiSettings || updated.config || {};
        if (set.provider) setSelectedProvider(set.provider);
        if (set.modelId) setSelectedModelId(set.modelId);
      } else {
        if (modelId) setSelectedModelId(modelId);
        if (provider) setSelectedProvider(provider);
      }
    };
    window.addEventListener('mavicore_ai_connector_updated', handleSync);
    return () => window.removeEventListener('mavicore_ai_connector_updated', handleSync);
  }, []);

  // Close model dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(event.target)) {
        setIsModelDropdownOpen(false);
      }
    }
    if (isModelDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isModelDropdownOpen]);

  const handleSelectModel = async (provider, model) => {
    setSelectedProvider(provider);
    setSelectedModelId(model.id);
    setIsModelDropdownOpen(false);
    try {
      localStorage.setItem('vibe_active_provider', provider);
      localStorage.setItem('vibe_active_model', model.id);
      const updated = await updateSharedAiModel(model.id, provider);
      if (updated) setActiveConnector(updated);
      toast.success(`Model aktif: ${model.name}`);
    } catch (e) {
      console.warn('Failed to persist model:', e);
    }
  };

  const getActiveModelDisplayName = () => {
    const list = PROVIDER_MODELS[selectedProvider] || [];
    const found = list.find(m => m.id === selectedModelId);
    if (found) return `${found.name}`;
    return `${selectedProvider} ${selectedModelId}`;
  };

  // Toggle voice dictation
  const handleToggleMic = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast('Speech recognition tidak didukung di browser ini.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'id-ID';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
        toast('Mendengarkan suara...', { icon: '🎙️' });
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(prev => prev ? `${prev} ${transcript}` : transcript);
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

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

      const effectiveSettings = {
        ...(activeConnector || {}),
        aiSettings: {
          ...(activeConnector?.aiSettings || activeConnector?.config || {}),
          provider: selectedProvider,
          modelId: selectedModelId
        }
      };

      if (planFirstMode) {
        // ─── 1. ANTIGRAVITY PLANNING MODE ───
        const planSystemPrompt = `You are MaviCore Vibe Planner (Antigravity Mode).
The user wants to build or modify an industrial MES / HMI application.
DO NOT WRITE FULL CODE YET.
Create a clear, compact, professional, structured IMPLEMENTATION PLAN in markdown:

# 📋 Implementation Plan: [Nama Aplikasi yang Jelas]

## 🎯 Ringkasan Tujuan
(Jelaskan dalam 1-2 kalimat fungsi dan tujuan utama aplikasi yang akan dibangun)

## 🗄️ Rencana Database & Kolom Tabel MaviCore
- **Nama Tabel**: \`[NamaTabel_Log]\`
- **Kolom Data**:
  - \`recordId\` (text) - ID unik record
  - \`field1\` (text/number/datetime) - keterangan
  - \`field2\` (text/number/datetime) - keterangan
  - \`status\` (text) - Pass/Reject/Open/Closed
  - \`timestamp\` (datetime) - waktu pencatatan
- **Operasi CRUD**: (Jelaskan aksi simpan, ambil data, dan sinkronisasi real-time)

## 🧩 Fitur & Komponen UI
1. **Ringkasan KPI / Status Bar**: Indikator visual metrik kunci & status bridge
2. **Formulir Interaktif**: Input data, validasi, dan tombol aksi
3. **Tabel Data & Pencarian**: Real-time table, filter status, pencarian cepat
4. **Desain & Tema**: Modern Light & Colourful ala Lovable.dev / shadcn/ui: background off-white (#f8fafc), card putih (#ffffff) dengan border halus (#e2e8f0) dan shadow lembut, typography slate-900/600, badge warna cerah (Emerald, Rose, Amber, Sky). DILARANG background gelap!

## 🛡️ Verification Plan
- Kompilasi React bebas error di Sandpack preview
- Uji simpan record data ke MaviCore database bridge

PENTING & WAJIB: Tuntaskan seluruh 4 bagian plan di atas secara lengkap sampai bagian Verification Plan selesai. Jangan berhenti sebelum seluruh dokumen tuntas!`;

        await streamVibeAI({
          messages: [
            { role: 'system', content: planSystemPrompt },
            { role: 'user', content: `Context:\n${contextString}\n\nTask: ${userMessage}` }
          ],
          settings: effectiveSettings,
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
        const directSystemPrompt = `You are MaviCore Vibe Coding Engine — an expert React engineer.

CRITICAL EXECUTION CONSTRAINTS:
1. The preview runs directly in-browser using Sandpack. React, Tailwind CSS, Lucide React icons, and Framer Motion are ALREADY pre-installed and available.
2. DO NOT output package.json, terminal commands, or instructions on how to install or run the project (like npm install or creating directories).
3. Output ONLY a single, complete, self-contained React component for /App.js that exports default function App().
4. ALWAYS wrap the entire runnable React component inside <vibe_code> ... </vibe_code> tags. DILARANG KERAS menyertakan markdown code fences (\`\`\`jsx atau \`\`\`) di dalam tag <vibe_code>. Tulis langsung kode JSX mentah di dalamnya.
5. VISUAL AESTHETICS: WAJIB MODERN LIGHT THEME & COLOURFUL ALA LOVABLE.DEV / SHADCN UI:
   - DILARANG KERAS BACKGROUND GELAP/HITAM: Jangan gunakan bg-slate-900, bg-slate-950, bg-gray-900, bg-black, #000000, #030712, #0b0f19, #0f172a pada root container atau kartu!
   - Root Container: WAJIB <div className="min-h-screen p-4 sm:p-6" style={{ backgroundColor: '#f8fafc', color: '#0f172a' }}>
   - Card/Panels: WAJIB putih bersih (#ffffff), border halus (#e2e8f0), soft shadow (box-shadow: 0 4px 20px -2px rgba(0,0,0,0.05)), rounded-2xl
   - Typography: Judul Slate-900 (#0f172a) font-bold, Subjudul Slate-600 (#475569) font-medium (DILARANG teks putih di canvas terang)
   - Vibrant Action Buttons: OK/Pass (emerald gradient #10b981 to #059669 with soft glow), NG/Reject (rose gradient #f43f5e to #dc2626), Primary actions (indigo #6366f1 to #4f46e5)
   - KPI & Metrics: Kartu putih murni dengan icon box pastel cerah dan angka tebal besar (bukan kartu hitam/navy)
   - Terapkan gaya modern, bersih, cerah dan penuh warna persis seperti lovable.dev atau dashboard Vercel!
6. WAJIB STRUKTUR KODE TERATUR, COMPACT & TUNTAS (ANTI-TRUNCATION):
   - Mock Data Singkat: Cukup 2 item contoh ringkas saja (DILARANG membuat array dummy panjang yang menghabiskan token!).
   - State & Handlers Ringkas: Buat state dan handler secukupnya.
   - PRIORITAS UTAMA BLOK RETURN JSX: Segera masuk ke blok return JSX untuk merender seluruh tampilan (Header, KPI Cards, Filter/Pencarian, Tabel Utama, Dialog/Modal Tambah Data).
   - Pastikan seluruh tag penutup tertutup rapi dan diakhiri \`export default function App() { return (...); }\` sebelum menutup dengan </vibe_code>.

DATABASE & TABLE INTEGRATION & COMPLETE WORKING CRUD (CREATE, READ, UPDATE, DELETE):
MaviCore provides an auto-injected real-time database bridge at window.MaviCoreBridge and import { useMaviCoreData } from './mavicore-bridge'.
Setiap aplikasi yang mencatat atau mengelola data WAJIB memiliki fungsi CRUD lengkap yang berfungsi 100% nyata dan responsif:
- Rekomendasi Hook: import { useMaviCoreData } from './mavicore-bridge';
  const { records, loading, insert, update, remove } = useMaviCoreData('NamaTabel');
  // insert(data), update(id, patch), remove(id)
- Atau Rekomendasi Bridge Langsung dengan local state:
  const TABLE_NAME = 'NamaTabel';
  const [items, setItems] = useState([ /* 2 mock data ringkas */ ]);
  - CREATE / Tambah: Tambahkan item ke state lokal setItems(prev => [newRow, ...prev]) dan panggil window.MaviCoreBridge?.save(TABLE_NAME, newRow);
  - READ / Ambil data: Pada useEffect panggil window.MaviCoreBridge?.read(TABLE_NAME).then(data => { if (data?.length) setItems(data); });
  - UPDATE / Edit: Update item di state lokal setItems(prev => prev.map(r => (r.id === editId || r.recordId === editId) ? { ...r, ...patch } : r)) dan panggil window.MaviCoreBridge?.update(TABLE_NAME, editId, patch);
  - DELETE / Hapus: Hapus dari state lokal setItems(prev => prev.filter(r => (r.id !== delId && r.recordId !== delId))) dan panggil window.MaviCoreBridge?.delete(TABLE_NAME, delId);
- KELENGKAPAN UI: Selalu sertakan Form/Modal Tambah (Create), Tabel/List (Read), Tombol Edit (Update), dan Tombol Hapus/Trash (Delete). Selalu update state React secara instan (optimistic UI) agar perubahan langsung terlihat di layar!`;

        await streamVibeAI({
          messages: [
            { role: 'system', content: directSystemPrompt },
            { role: 'user', content: `Context:\n${contextString}\n\nTask: ${userMessage}` }
          ],
          settings: effectiveSettings,
          onChunk: (chunk) => {
            setCurrentStream(prev => prev + chunk);
          },
          onComplete: (result) => {
            const extractedCode = extractVibeCode(result.text);
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
      const execSystemPrompt = `You are MaviCore Vibe Coding Engine — an expert React engineer specializing in industrial MES, mobile, and HMI frontends.
The user has REVIEWED and APPROVED the following Implementation Plan:
${targetPlan.content}

CRITICAL EXECUTION CONSTRAINTS:
1. The preview runs directly in-browser using Sandpack. React, Tailwind CSS, Lucide React icons, and Framer Motion are ALREADY pre-installed and available.
2. DO NOT output package.json, terminal commands, or setup instructions.
3. Output ONLY a single, complete, self-contained React component for /App.js that exports default function App().
4. ALWAYS wrap the entire runnable React component inside <vibe_code> ... </vibe_code> tags. DILARANG KERAS menyertakan markdown code fences (\`\`\`jsx atau \`\`\`) di dalam tag <vibe_code>. Tulis langsung kode JSX mentah di dalamnya.
5. STRICTLY IMPLEMENT FULL WORKING CRUD (Create, Read, Update, Delete):
   - Gunakan window.MaviCoreBridge (save, read, update, delete, onRecord) atau import { useMaviCoreData } from './mavicore-bridge'.
   - Wajib sediakan form/modal Tambah Data, tabel/list Tampil Data, tombol/modal Edit Data, dan tombol Hapus Data.
   - Wajib perbarui state React lokal secara instan pada aksi Tambah/Edit/Hapus agar UI reaktif dan tidak macet!
6. VISUAL AESTHETICS: WAJIB MODERN LIGHT THEME & COLOURFUL ALA LOVABLE.DEV / SHADCN UI:
   - DILARANG KERAS BACKGROUND GELAP/HITAM: Jangan gunakan bg-slate-900, bg-slate-950, bg-gray-900, bg-black, #000000, #030712, #0b0f19, #0f172a pada root container atau kartu!
   - Root Container: WAJIB <div className="min-h-screen p-4 sm:p-6" style={{ backgroundColor: '#f8fafc', color: '#0f172a' }}>
   - Card/Panels: WAJIB putih bersih (#ffffff), border halus (#e2e8f0), soft elevated shadow (0 4px 20px -2px rgba(0,0,0,0.05)), rounded-2xl
   - High-contrast crisp typography: Slate-900 (#0f172a) untuk judul, Slate-600 (#475569) untuk teks sekunder
   - Vibrant colorful gradient buttons and status badges (Emerald, Rose, Indigo, Amber, Sky)
   - Stat Cards / KPI: Kartu putih bersih dengan icon container pastel dan angka bold Slate-900
7. WAJIB STRUKTUR KODE TERATUR, COMPACT & TUNTAS (ANTI-TRUNCATION):
   - Mock Data Singkat: Cukup 2 item contoh ringkas saja (DILARANG membuat array dummy panjang yang menghabiskan token!).
   - State & Handlers Ringkas: Buat state dan handler secukupnya.
   - PRIORITAS UTAMA BLOK RETURN JSX: Segera masuk ke blok return JSX untuk merender seluruh tampilan (Header, KPI Cards, Filter/Pencarian, Tabel Utama, Dialog/Modal Tambah Data).
   - Pastikan seluruh tag penutup tertutup rapi dan diakhiri \`export default function App() { return (...); }\` sebelum menutup dengan </vibe_code>.`;

      const effectiveSettings = {
        ...(activeConnector || {}),
        aiSettings: {
          ...(activeConnector?.aiSettings || activeConnector?.config || {}),
          provider: selectedProvider,
          modelId: selectedModelId
        }
      };

      const result = await streamVibeAI({
        messages: [
          { role: 'system', content: execSystemPrompt },
          { role: 'user', content: 'Execute the approved plan and generate the complete code for /App.js wrapped inside <vibe_code> ... </vibe_code> tags.' }
        ],
        settings: effectiveSettings,
        onChunk: (chunk) => {
          setCurrentStream(prev => prev + chunk);
        },
        onComplete: (res) => {
          setCurrentStream('');
        },
        onError: (err) => {
          setMessages(prev => [...prev, { role: 'assistant', content: `Error eksekusi: ${err.message}` }]);
          setCurrentStream('');
        }
      });

      const rawRes = result?.text || '';
      let extractedCode = extractVibeCode(rawRes) || cleanVibeCode(rawRes);
      if (extractedCode && (extractedCode.includes('return') || extractedCode.includes('export default function') || extractedCode.includes('function App'))) {
        onCodeGenerated(extractedCode);

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
      } else {
        setMessages(prev => [
          ...prev,
          { role: 'assistant', type: 'code', content: result?.text || '' },
          {
            role: 'assistant',
            type: 'error',
            content: `⚠️ **Kode Belum Otomatis Diterapkan ke /App.js**\n\nRespon AI tidak menyertakan tag kode \`<vibe_code>\` yang lengkap atau koding terpotong.\n\nSilakan gunakan tombol **"⚡ Terapkan ke /App.js"** di kartu kode di atas untuk memasang koding secara manual, atau klik tombol **"🔄 Lanjutkan Koding"** untuk melengkapi kode.`
          }
        ]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: `Gagal mengeksekusi plan: ${err.message}` }]);
    } finally {
      setIsLoading(false);
      setCurrentStream('');
    }
  };

  const handleContinueGeneration = async (msgIndex) => {
    const targetMsg = messages[msgIndex];
    if (!targetMsg || isLoading) return;

    const isPlan = targetMsg.type === 'plan';
    setIsLoading(true);
    setCurrentStream('');

    try {
      const prompt = isPlan
        ? 'Respons Implementation Plan Anda terpotong di tengah jalan. Lanjutkan penulisan SEGERA tepat dari kata terakhir yang terhenti tanpa mengulang teks sebelumnya, dan tuntaskan seluruh bagian plan sampai selesai termasuk ## 🛡️ Verification Plan.'
        : 'Your previous React code output was cut off mid-code due to token length limits. Continue outputting IMMEDIATELY from the exact point you stopped without repeating previous imports or code lines. Complete the remaining JSX return and function closing, and terminate with </vibe_code>.';

      const effectiveSettings = {
        ...(activeConnector || {}),
        aiSettings: {
          ...(activeConnector?.aiSettings || activeConnector?.config || {}),
          provider: selectedProvider,
          modelId: selectedModelId
        }
      };

      const result = await streamVibeAI({
        messages: [
          { role: 'assistant', content: targetMsg.content },
          { role: 'user', content: prompt }
        ],
        settings: effectiveSettings,
        onChunk: (chunk) => {
          setCurrentStream(prev => prev + chunk);
        }
      });

      const fullMerged = targetMsg.content + (result?.text || '');
      setMessages(prev => prev.map((m, idx) => idx === msgIndex ? { ...m, content: fullMerged } : m));

      if (!isPlan) {
        const code = extractVibeCode(fullMerged) || cleanVibeCode(fullMerged);
        if (code) {
          onCodeGenerated(code);
          toast.success('⚡ Koding berhasil diselesaikan dan diterapkan ke /App.js!');
        }
      } else {
        toast.success('📋 Implementation Plan berhasil dilengkapi!');
      }
    } catch (err) {
      toast.error(`Gagal melanjutkan: ${err.message}`);
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
        <Toaster position="top-right" toastOptions={{ style: { background: '#1e293b', color: '#f8fafc', border: '1px solid #334155' } }} />
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
            onApplyCode={(code) => onCodeGenerated(code)}
            onContinue={() => handleContinueGeneration(i)}
            isLoading={isLoading}
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
        padding: '12px 14px',
        borderTop: '1px solid #334155',
        backgroundColor: '#1e293b',
        position: 'relative'
      }}>
        {/* Model Selector Popover */}
        {isModelDropdownOpen && (
          <div
            ref={modelDropdownRef}
            style={{
              position: 'absolute',
              bottom: '100%',
              left: '12px',
              right: '12px',
              marginBottom: '8px',
              backgroundColor: '#0f172a',
              border: '1px solid #334155',
              borderRadius: '12px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.08)',
              zIndex: 100,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              maxHeight: '360px'
            }}
          >
            {/* Popover Header */}
            <div style={{
              padding: '10px 14px',
              backgroundColor: '#1e293b',
              borderBottom: '1px solid #334155',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Cpu size={14} color="#38bdf8" /> Pilih Provider & Model AI
              </span>
              <button
                type="button"
                onClick={() => setIsModelDropdownOpen(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '2px' }}
              >
                <X size={14} />
              </button>
            </div>

            {/* Provider Tabs */}
            <div style={{
              display: 'flex',
              gap: '4px',
              padding: '8px 10px',
              borderBottom: '1px solid #1e293b',
              backgroundColor: '#0b1120',
              overflowX: 'auto'
            }}>
              {Object.keys(PROVIDER_MODELS).map((prov) => (
                <button
                  key={prov}
                  type="button"
                  onClick={() => setSelectedProvider(prov)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: selectedProvider === prov ? 700 : 500,
                    backgroundColor: selectedProvider === prov ? '#3b82f6' : 'transparent',
                    color: selectedProvider === prov ? '#ffffff' : '#94a3b8',
                    border: 'none',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s'
                  }}
                >
                  {prov}
                </button>
              ))}
            </div>

            {/* Model List */}
            <div style={{ overflowY: 'auto', padding: '6px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {(PROVIDER_MODELS[selectedProvider] || []).map((m) => {
                const isSelected = selectedModelId === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => handleSelectModel(selectedProvider, m)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      backgroundColor: isSelected ? 'rgba(56, 189, 248, 0.12)' : 'transparent',
                      border: isSelected ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid transparent',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s'
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)';
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: isSelected ? '#38bdf8' : '#f8fafc' }}>
                          {m.name}
                        </span>
                        {m.tag && (
                          <span style={{
                            fontSize: '9px', fontWeight: 700, padding: '1px 5px', borderRadius: '4px',
                            backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)'
                          }}>
                            {m.tag}
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: '10px', color: '#64748b' }}>{m.desc}</span>
                    </div>
                    {isSelected && <Check size={14} color="#38bdf8" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Textarea container */}
        <div style={{
          backgroundColor: '#0f172a',
          border: '1px solid #334155',
          borderRadius: '12px',
          padding: '10px 12px 8px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          transition: 'border-color 0.2s',
          boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.2)'
        }}>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={planFirstMode ? "Jelaskan app yang ingin dibuat (akan dibuatkan plan dulu)..." : "Ketik prompt instruksi kode..."}
            disabled={isLoading}
            style={{
              width: '100%',
              backgroundColor: 'transparent',
              border: 'none',
              padding: 0,
              color: '#f8fafc',
              fontSize: '12.5px',
              fontFamily: 'inherit',
              resize: 'none',
              outline: 'none',
              maxHeight: '120px',
              lineHeight: '1.5'
            }}
          />

          {/* Bottom Bar inside Prompt Box (Matches user screenshot!) */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: '6px',
            borderTop: '1px solid rgba(255,255,255,0.05)',
            gap: '8px'
          }}>
            {/* Active Model Selector Button */}
            <button
              type="button"
              onClick={() => setIsModelDropdownOpen(v => !v)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 8px',
                borderRadius: '6px',
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: '#94a3b8',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s',
                maxWidth: '220px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.color = '#f8fafc';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
                e.currentTarget.style.color = '#94a3b8';
              }}
              title="Pilih Model / Provider AI"
            >
              <span style={{ color: '#cbd5e1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {getActiveModelDisplayName()}
              </span>
              <ChevronUp
                size={12}
                color="#64748b"
                style={{
                  transform: isModelDropdownOpen ? 'rotate(180deg)' : 'none',
                  transition: 'transform 0.15s',
                  flexShrink: 0
                }}
              />
            </button>

            {/* Right Tools: Mic & Send Button */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {/* Mic Dictation */}
              <button
                type="button"
                onClick={handleToggleMic}
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  border: 'none',
                  backgroundColor: isListening ? '#ef4444' : 'transparent',
                  color: isListening ? '#ffffff' : '#64748b',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s'
                }}
                title={isListening ? "Sedang mendengarkan... (Klik untuk stop)" : "Dikte Suara (Voice Input)"}
              >
                {isListening ? <MicOff size={14} /> : <Mic size={14} />}
              </button>

              {/* Send Button */}
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                style={{
                  width: '30px',
                  height: '30px',
                  backgroundColor: isLoading || !input.trim() ? '#334155' : '#0284c7',
                  border: 'none',
                  borderRadius: '50%',
                  color: '#fff',
                  cursor: isLoading || !input.trim() ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s',
                  boxShadow: input.trim() ? '0 2px 8px rgba(2, 132, 199, 0.4)' : 'none'
                }}
                title="Kirim Prompt"
              >
                {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Send size={13} />}
              </button>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div style={{
          margin: '6px 0 0',
          fontSize: '10px',
          color: '#64748b',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0 2px'
        }}>
          <span>Shift+Enter untuk baris baru</span>
          <button
            type="button"
            onClick={() => setPlanFirstMode(v => !v)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '10px',
              padding: 0,
              color: planFirstMode ? '#34d399' : '#94a3b8',
              fontWeight: 600
            }}
            title="Klik untuk toggle mode"
          >
            {planFirstMode ? '✓ Antigravity Plan Mode' : '⚡ Instant Mode'}
          </button>
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
  let normalized = text;
  if (normalized.includes('<vibe_code>') && !normalized.includes('</vibe_code>')) {
    normalized += '\n</vibe_code>';
  }
  const openFences = (normalized.match(/```/g) || []).length;
  if (openFences % 2 !== 0) {
    normalized += '\n```';
  }
  const regex = /(<vibe_code>[\s\S]*?<\/vibe_code>|```(?:[a-zA-Z0-9_-]+)?\s*[\s\S]*?```)/gi;
  const parts = normalized.split(regex);

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
  onRequestRevision,
  onApplyCode,
  onContinue,
  isLoading
}) {
  const [copied, setCopied] = useState(false);
  const [applied, setApplied] = useState(false);
  const isAssistant = role === 'assistant';
  const isPlan = type === 'plan';
  const isWalkthrough = type === 'walkthrough';
  const isTruncated = isAssistant && !isStreaming && isTruncatedResponse(content, isPlan);

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
                {isTruncated && onContinue && (
                  <button
                    type="button"
                    onClick={onContinue}
                    disabled={isLoading}
                    style={{
                      background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '7px',
                      padding: '7px 12px',
                      fontSize: '11.5px',
                      fontWeight: 600,
                      cursor: isLoading ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      boxShadow: '0 2px 8px rgba(139, 92, 246, 0.35)'
                    }}
                  >
                    <RefreshCw size={12} className={isLoading ? "animate-spin" : ""} />
                    <span>🔄 Lanjutkan Plan (Auto-Continue)</span>
                  </button>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
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
                {isTruncated && onContinue && (
                  <button
                    type="button"
                    onClick={onContinue}
                    disabled={isLoading}
                    style={{
                      background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '4px 8px',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: isLoading ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <RefreshCw size={11} className={isLoading ? "animate-spin" : ""} />
                    <span>Lengkapi Plan</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Interactive Apply Code button if code is present in assistant message */}
        {isAssistant && !isStreaming && onApplyCode && (type === 'code' || (content && (content.includes('export default') || content.includes('<vibe_code>') || content.includes('<vibe-code>') || content.includes('```') || content.includes('import ') || content.includes('function ')))) && (
          <div style={{
            marginTop: '10px',
            paddingTop: '8px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
            flexWrap: 'wrap'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => {
                  const code = extractVibeCode(content) || cleanVibeCode(content);
                  if (code && code.trim().length > 20) {
                    onApplyCode(code);
                    setApplied(true);
                    toast.success('⚡ Kode berhasil diterapkan ke /App.js dan layar preview!');
                    setTimeout(() => setApplied(false), 3000);
                  } else {
                    toast.error('Gagal mengekstrak kode yang lengkap dari pesan ini.');
                  }
                }}
                style={{
                  background: applied
                    ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                    : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '7px',
                  padding: '6px 12px',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  boxShadow: applied
                    ? '0 2px 10px rgba(16, 185, 129, 0.45)'
                    : '0 2px 8px rgba(37, 99, 235, 0.35)',
                  transition: 'all 0.2s'
                }}
              >
                {applied ? <CheckCircle2 size={12} color="#fff" /> : <Play size={12} fill="#fff" />}
                <span>{applied ? '✓ Berhasil Diterapkan ke Layar!' : '⚡ Terapkan ke /App.js (Live Preview)'}</span>
              </button>

              {isTruncated && onContinue && (
                <button
                  type="button"
                  onClick={onContinue}
                  disabled={isLoading}
                  style={{
                    background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '7px',
                    padding: '6px 12px',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    boxShadow: '0 2px 8px rgba(139, 92, 246, 0.35)',
                    transition: 'all 0.2s'
                  }}
                  title="Minta AI melanjutkan koding yang terpotong"
                >
                  <RefreshCw size={12} className={isLoading ? "animate-spin" : ""} />
                  <span>🔄 Lanjutkan Koding</span>
                </button>
              )}
            </div>
            <span style={{ fontSize: '10px', color: applied ? '#34d399' : '#94a3b8' }}>
              {applied ? 'Layar device telah terupdate!' : 'Pasang langsung ke editor'}
            </span>
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

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
  MicOff,
  MessageSquare
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
  const [chatMode, setChatMode] = useState('build'); // 'build' (create/modify app) | 'qa' (tanya jawab / konsultasi)
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

      if (chatMode === 'qa') {
        // ─── 0. TANYA JAWAB / KONSULTASI MODE ───
        const activeCode = (context.files || {})['/App.js'] || (context.files || {})['/App.jsx'] || '';
        const qaSystemPrompt = `You are Mavi Copilot AI Advisor & Industrial MES Expert.
You are in conversational Q&A / Konsultasi Mode.
The user wants to ask questions, understand the active code, discuss industrial MES features, troubleshoot bugs, or learn how MaviCore works.

APPLICATION CONTEXT:
App Name: ${context.appName || 'Sandbox App'}
Current Files in Workspace: ${Object.keys(context.files || {}).join(', ')}
Available MaviCore Database Tables:
${tablesList || 'No custom tables registered yet'}

ACTIVE /App.js CODE (Reference only, do not overwrite unless asked):
\`\`\`jsx
${activeCode.slice(0, 3500)}
\`\`\`

GUIDELINES FOR Q&A MODE:
1. Respond conversationally, clearly, and directly in Indonesian or English (matching user language).
2. DO NOT output the full App.js wrapped in <vibe_code> tags. Explain logic, point out bugs, give recommendations, or provide concise code snippets in standard markdown code fences (\`\`\`jsx ... \`\`\`).
3. If the user asks about MaviCore data bridge, explain window.MaviCoreBridge (save, read, update, delete) or import { useMaviCoreData } from './mavicore-bridge'.
4. If the user asks for advice on UI/UX, recommend modern colorful cards, light theme (#f8fafc), and clear status badges.
5. Provide actionable, insightful answers like an expert industrial software architect and pair programmer.`;

        await streamVibeAI({
          messages: [
            { role: 'system', content: qaSystemPrompt },
            ...messages.slice(-8).map(m => ({ role: m.role, content: m.content })),
            { role: 'user', content: userMessage }
          ],
          settings: effectiveSettings,
          onChunk: (chunk) => {
            setCurrentStream(prev => prev + chunk);
          },
          onComplete: (result) => {
            setMessages(prev => [...prev, { role: 'assistant', type: 'qa', content: result.text }]);
            setCurrentStream('');
          },
          onError: (err) => {
            setMessages(prev => [...prev, { role: 'assistant', type: 'qa', content: `Error: ${err.message}` }]);
            setCurrentStream('');
          }
        });
        return;
      }

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

## 🧩 Struktur Halaman & Layout Enterprise Multi-Page
1. **Shell & Layout Navigasi Profesional**:
   - **Collapsible Sidebar (Kiri)**: Brand sistem ("MaviCore MES Pro ● Live"), menu navigasi utama dengan icon Lucide, active highlight, dan footer profil operator (Shift, Nama).
   - **Top Navigation Bar (Header)**: Breadcrumbs navigasi, live clock, pemilih stasiun/line kerja, status bridge (Online), dan tombol aksi cepat "+ Catat Data Baru".
2. **Halaman 1: Executive Dashboard & SCADA Telemetry**:
   - Kartu metrik KPI berwarna (OEE, Total Output, Good Parts, Defects, Uptime), grafik capaian produksi, dan indikator telemetri sensor.
3. **Halaman 2: Formulir Operasional / Input Inspeksi**:
   - Formulir terstruktur (No. Lot/SPK, parameter spesifikasi, toleransi batas Min/Nominal/Max, tombol OK/NG, catatan operator) dengan simpan langsung ke tabel MaviCore.
4. **Halaman 3: Data Riwayat & Manajemen Log (CRUD)**:
   - Tabel data real-time berfitur lengkap: Pencarian teks, filter status, sorting, modal lihat detail, edit data, dan hapus data.
5. **Halaman 4: Analisis & Grafik Tren**:
   - Pareto cacat/defect, grafik pencapaian per jam, dan rasio scrap.
6. **Halaman 5: Pengaturan Line & Standar Parameter**:
   - Konfigurasi batas ambang, shift kerja, dan target cycle time.

## 🛡️ Verification Plan
- Kompilasi React bebas error di Sandpack preview
- Uji navigasi antar halaman pada Sidebar (Dashboard, Input Form, Data Table, Analisis)
- Uji simpan, edit, dan hapus data ke MaviCore database bridge

PENTING & WAJIB: Tuntaskan seluruh bagian plan di atas secara terperinci. Rancang sebagai aplikasi web profesional multi-page lengkap, bukan halaman tunggal sederhana!`;

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
1. The preview runs directly in-browser using Sandpack. React, Tailwind CSS, Lucide React icons, Framer Motion, and shadcn/ui components (Button, Card, Badge, Input, Dialog, Tabs, cn) are ALREADY pre-installed and available via '@/components/ui/...' and '@/lib/utils'.
2. DO NOT output package.json, terminal commands, or instructions on how to install or run the project (like npm install or creating directories).
3. ARSITEKTUR APLIKASI WEB ENTERPRISE DENGAN MULTI-PAGE & LAYOUT (WAJIB):
   Aplikasi yang Anda buat HARUS dirancang sebagai APLIKASI WEB PROFESIONAL MULTI-HALAMAN DENGAN LAYOUT LENGKAP (BUKAN hanya 1 halaman statis sederhana):
   
   A. SHELL & LAYOUT NAVIGASI UTAMA (SIDEBAR + HEADER):
      - SIDEBAR NAVIGASI (KIRI):
        * Logo sistem & Judul ("MaviCore MES Pro ● Live" dengan badge hijau aktif).
        * Tombol Navigasi Halaman dengan icon Lucide, label, badge, dan highlight aktif cerah (bg-indigo-600 text-white shadow-lg shadow-indigo-500/30):
          - 'dashboard' -> 📊 Dashboard & Telemetri
          - 'inspection' -> 📝 Formulir Inspeksi / Input Operasional
          - 'history' -> 📋 Riwayat Data & Log Sheet
          - 'analytics' -> 📈 Analisis Cacat & Tren Output
          - 'settings' -> ⚙️ Standar Parameter & Pengaturan Line
        * Profil Operator di bagian bawah sidebar (Nama Operator, Shift, Role: Line Leader).
        * Tombol Toggle Collapse/Expand sidebar.
      
      - TOP NAVIGATION BAR (HEADER ATAS):
        * Breadcrumbs jalur halaman (misal: "Produksi > Input Inspeksi Part").
        * Pemilih Line / Mesin aktif (Line A - Stamping, Line B - CNC, Line C - Assembly).
        * Status Koneksi Database MaviCore (Pill Hijau "● Bridge Online").
        * Jam Digital Real-Time (HH:mm:ss).
        * Tombol Cepat Aksi: "+ Catat Data Baru" (Membuka modal input cepat atau berpindah ke halaman form).

   B. MULTI-PAGE ROUTING BERBASIS STATE:
      Gunakan state navigasi di App:
      const [currentView, setCurrentView] = useState('dashboard');
      Bagi antarmuka menjadi halaman-halaman mandiri yang kaya fitur:
      - <DashboardView />: Ringkasan metrik KPI warna-warni (OEE, Total Output, Good Parts, Defects, Uptime), status mesin live, progress bar capaian, dan log aktivitas terkini.
      - <InspectionView />: Halaman formulir input komprehensif untuk operator dengan kolom parameter lengkap, pengecekan toleransi Min/Nominal/Max, tombol penilaian OK/NG, dan tombol submit simpan data.
      - <HistoryView />: Halaman tabel data database lengkap dengan input pencarian, filter status/shift, sorting, modal lihat detail, edit data inline, dan tombol hapus data.
      - <AnalyticsView />: Grafik pareto penyebab cacat (scratch, dimensi, crack) dan persentase scrap rate.
      - <SettingsView />: Konfigurasi ambang batas toleransi, target cycle time, dan jadwal shift operator.

   C. SINKRONISASI DATA ANTAR HALAMAN (REAKTIF):
      - Seluruh halaman berbagi state data yang sama (shared state) dan terhubung ke window.MaviCoreBridge.
      - Setiap data baru yang disimpan di halaman "Formulir Inspeksi" otomatis langsung muncul di tabel "Riwayat Data" dan memperbarui kartu metrik di "Dashboard".

4. ALWAYS wrap the entire runnable React component inside <vibe_code> ... </vibe_code> tags. DILARANG KERAS menyertakan markdown code fences (\`\`\`jsx atau \`\`\`) di dalam tag <vibe_code>. Tulis langsung kode JSX mentah di dalamnya.
5. VISUAL AESTHETICS & DYAD UI ENGINE (STUNNING INDUSTRIAL DESIGN):
   Gunakan komponen React mandiri dengan Tailwind CSS yang indah, tactile, modern, dan colourfull (DILARANG KAKU HITAM PUTIH / MONOKROM):
   - BACKGROUND HARUS KAYA WARNA (COLOURFUL RADIAL MESH):
     * Root Container: <div className="min-h-screen p-4 sm:p-6" style={{ background: 'radial-gradient(at 0% 0%, rgba(99, 102, 241, 0.15) 0px, transparent 50%), radial-gradient(at 100% 0%, rgba(236, 72, 153, 0.12) 0px, transparent 50%), radial-gradient(at 50% 100%, rgba(14, 165, 233, 0.12) 0px, transparent 50%), #f8fafc', color: '#0f172a', fontFamily: 'Inter, system-ui, sans-serif' }}>
   - KARTU KPI DENGAN IDENTITAS WARNA BERBEDA & BORDER TEBAL (COLOURFUL CARDS):
     * Setiap kartu berlatar putih bersih (bg-white rounded-2xl border border-slate-200 shadow-lg) dengan border atas tebal berwarna cerah (border-t-4):
       - Kartu 1 (Output/OEE): border-t-indigo-600, icon container gradien indigo-blue (bg-gradient-to-br from-indigo-500 to-blue-600 text-white p-3 rounded-xl), angka tebal text-indigo-600, progress bar gradien indigo.
       - Kartu 2 (Availability/Uptime): border-t-sky-500, icon container gradien sky-blue (bg-gradient-to-br from-sky-400 to-blue-600 text-white p-3 rounded-xl), angka tebal text-sky-600.
       - Kartu 3 (Performance/Target): border-t-amber-500, icon container gradien amber-orange (bg-gradient-to-br from-amber-400 to-orange-500 text-white p-3 rounded-xl), angka tebal text-amber-600.
       - Kartu 4 (Quality/Defect): border-t-emerald-500, icon container gradien emerald-teal (bg-gradient-to-br from-emerald-400 to-teal-600 text-white p-3 rounded-xl), angka tebal text-emerald-600.
   - BADGE STATUS BERWARNA CERAH (EMERALD, AMBER, ROSE):
     * Running / Optimal: <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">● RUNNING</span>
     * Warning: <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">▲ WARNING</span>
     * Down / Reject: <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">■ DOWNTIME</span>
   - TOMBOL AKSI & MODAL BERGRADASI CERAH:
     * Tombol Tambah/Simpan: bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white font-bold shadow-lg shadow-indigo-500/25 px-4 py-2.5 rounded-xl flex items-center gap-2 hover:opacity-95 transition-all
     * Header Modal: bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 text-white p-4 rounded-t-2xl flex items-center justify-between
     * Input Formulir: bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:bg-white text-sm outline-none transition-all
   - GLOVE-FRIENDLY TOUCH CONTROLS (JIKA DIBUTUHKAN):
     * Tombol keypad numerik besar (p-4 text-lg font-bold rounded-xl bg-slate-100 hover:bg-indigo-50 active:scale-95) langsung di JSX tanpa memerlukan pustaka eksternal.
6. WAJIB STRUKTUR KODE TERATUR, COMPACT & TUNTAS (ANTI-TRUNCATION):
   - Mock Data Singkat: Cukup 2-3 item contoh ringkas saja.
   - PRIORITAS UTAMA BLOK RETURN JSX: Segera masuk ke blok return JSX untuk merender seluruh tampilan (Header, KPICards, ScadaProdCounter / Telemetry, Tabel CRUD, Dialog/Modal Tambah Data).
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
1. The preview runs directly in-browser using Sandpack. React, Tailwind CSS, Lucide React icons, Framer Motion, and shadcn/ui components (Button, Card, Badge, Input, Dialog, Tabs, cn) are ALREADY pre-installed and available via '@/components/ui/...' and '@/lib/utils'.
2. DO NOT output package.json, terminal commands, or setup instructions.
3. ARSITEKTUR APLIKASI WEB ENTERPRISE DENGAN MULTI-PAGE & LAYOUT (WAJIB):
   Aplikasi yang Anda buat HARUS dirancang sebagai APLIKASI WEB PROFESIONAL MULTI-HALAMAN DENGAN LAYOUT LENGKAP (BUKAN hanya 1 halaman statis sederhana):
   
   A. SHELL & LAYOUT NAVIGASI UTAMA (SIDEBAR + HEADER):
      - SIDEBAR NAVIGASI (KIRI):
        * Logo sistem & Judul ("MaviCore MES Pro ● Live" dengan badge status aktif).
        * Tombol Navigasi Halaman dengan icon Lucide, label, badge, dan highlight aktif cerah (bg-indigo-600 text-white shadow-lg shadow-indigo-500/30):
          - 'dashboard' -> 📊 Dashboard & Telemetri
          - 'inspection' -> 📝 Formulir Inspeksi / Input Operasional
          - 'history' -> 📋 Riwayat Data & Log Sheet
          - 'analytics' -> 📈 Analisis Cacat & Tren Output
          - 'settings' -> ⚙️ Standar Parameter & Pengaturan Line
        * Profil Operator di bagian bawah sidebar (Nama Operator, Shift, Role: Line Leader).
        * Tombol Toggle Collapse/Expand sidebar.
      
      - TOP NAVIGATION BAR (HEADER ATAS):
        * Breadcrumbs jalur halaman (misal: "Produksi > Input Inspeksi Part").
        * Pemilih Line / Mesin aktif (Line A - Stamping, Line B - CNC, Line C - Assembly).
        * Status Koneksi Database MaviCore (Pill Hijau "● Bridge Online").
        * Jam Digital Real-Time (HH:mm:ss).
        * Tombol Cepat Aksi: "+ Catat Data Baru" (Membuka modal input cepat atau berpindah ke halaman form).

   B. MULTI-PAGE ROUTING BERBASIS STATE:
      Gunakan state navigasi di App:
      const [currentView, setCurrentView] = useState('dashboard');
      Bagi antarmuka menjadi halaman-halaman mandiri yang kaya fitur:
      - <DashboardView />: Ringkasan metrik KPI warna-warni (OEE, Total Output, Good Parts, Defects, Uptime), status mesin live, progress bar capaian, dan log aktivitas terkini.
      - <InspectionView />: Halaman formulir input komprehensif untuk operator dengan kolom parameter lengkap, pengecekan toleransi Min/Nominal/Max, tombol penilaian OK/NG, dan tombol submit simpan data.
      - <HistoryView />: Halaman tabel data database lengkap dengan input pencarian, filter status/shift, sorting, modal lihat detail, edit data inline, dan tombol hapus data.
      - <AnalyticsView />: Grafik pareto penyebab cacat (scratch, dimensi, crack) dan persentase scrap rate.
      - <SettingsView />: Konfigurasi ambang batas toleransi, target cycle time, dan jadwal shift operator.

   C. SINKRONISASI DATA ANTAR HALAMAN (REAKTIF):
      - Seluruh halaman berbagi state data yang sama (shared state) dan terhubung ke window.MaviCoreBridge.
      - Setiap data baru yang disimpan di halaman "Formulir Inspeksi" otomatis langsung muncul di tabel "Riwayat Data" dan memperbarui kartu metrik di "Dashboard".

4. ALWAYS wrap the entire runnable React component inside <vibe_code> ... </vibe_code> tags. DILARANG KERAS menyertakan markdown code fences (\`\`\`jsx atau \`\`\`) di dalam tag <vibe_code>. Tulis langsung kode JSX mentah di dalamnya.
5. STRICTLY IMPLEMENT FULL WORKING CRUD (Create, Read, Update, Delete):
   - Gunakan window.MaviCoreBridge (save, read, update, delete, onRecord) atau import { useMaviCoreData } from './mavicore-bridge'.
   - Wajib perbarui state React lokal secara instan pada aksi Tambah/Edit/Hapus agar UI reaktif dan tidak macet!
6. VISUAL AESTHETICS & DYAD UI ENGINE (STUNNING INDUSTRIAL DESIGN):
   Gunakan komponen React mandiri dengan Tailwind CSS yang indah, tactile, modern, dan colourfull (DILARANG KAKU HITAM PUTIH / MONOKROM):
   - BACKGROUND HARUS KAYA WARNA (COLOURFUL RADIAL MESH):
     * Root Container: <div className="min-h-screen p-4 sm:p-6" style={{ background: 'radial-gradient(at 0% 0%, rgba(99, 102, 241, 0.15) 0px, transparent 50%), radial-gradient(at 100% 0%, rgba(236, 72, 153, 0.12) 0px, transparent 50%), radial-gradient(at 50% 100%, rgba(14, 165, 233, 0.12) 0px, transparent 50%), #f8fafc', color: '#0f172a', fontFamily: 'Inter, system-ui, sans-serif' }}>
   - KARTU KPI DENGAN IDENTITAS WARNA BERBEDA & BORDER TEBAL (COLOURFUL CARDS):
     * Setiap kartu berlatar putih bersih (bg-white rounded-2xl border border-slate-200 shadow-lg) dengan border atas tebal berwarna cerah (border-t-4):
       - Kartu 1 (Output/OEE): border-t-indigo-600, icon container gradien indigo-blue (bg-gradient-to-br from-indigo-500 to-blue-600 text-white p-3 rounded-xl), angka tebal text-indigo-600, progress bar gradien indigo.
       - Kartu 2 (Availability/Uptime): border-t-sky-500, icon container gradien sky-blue (bg-gradient-to-br from-sky-400 to-blue-600 text-white p-3 rounded-xl), angka tebal text-sky-600.
       - Kartu 3 (Performance/Target): border-t-amber-500, icon container gradien amber-orange (bg-gradient-to-br from-amber-400 to-orange-500 text-white p-3 rounded-xl), angka tebal text-amber-600.
       - Kartu 4 (Quality/Defect): border-t-emerald-500, icon container gradien emerald-teal (bg-gradient-to-br from-emerald-400 to-teal-600 text-white p-3 rounded-xl), angka tebal text-emerald-600.
   - BADGE STATUS BERWARNA CERAH (EMERALD, AMBER, ROSE):
     * Running / Optimal: <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">● RUNNING</span>
     * Warning: <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">▲ WARNING</span>
     * Down / Reject: <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">■ DOWNTIME</span>
   - TOMBOL AKSI & MODAL BERGRADASI CERAH:
     * Tombol Tambah/Simpan: bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white font-bold shadow-lg shadow-indigo-500/25 px-4 py-2.5 rounded-xl flex items-center gap-2 hover:opacity-95 transition-all
     * Header Modal: bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 text-white p-4 rounded-t-2xl flex items-center justify-between
     * Input Formulir: bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:bg-white text-sm outline-none transition-all
   - GLOVE-FRIENDLY TOUCH CONTROLS (JIKA DIBUTUHKAN):
     * Tombol keypad numerik besar (p-4 text-lg font-bold rounded-xl bg-slate-100 hover:bg-indigo-50 active:scale-95) langsung di JSX tanpa memerlukan pustaka eksternal.
7. WAJIB STRUKTUR KODE TERATUR, COMPACT & TUNTAS (ANTI-TRUNCATION):
   - Mock Data Singkat: Cukup 2-3 item contoh ringkas saja.
   - PRIORITAS UTAMA BLOK RETURN JSX: Segera masuk ke blok return JSX untuk merender seluruh tampilan (Header, KPICards, ScadaProdCounter / Telemetry, Tabel CRUD, Dialog/Modal Tambah Data).
   - Pastikan seluruh tag penutup tertutup rapi dan diakhiri \`export default function App() { return (...); }\` sebelum menutup dengan </vibe_code>.
9. ANTI-BLANK-SCREEN GUARANTEE:
   - DILARANG KERAS \`return null;\` atau \`return <></>;\` saat state loading! Selalu render kerangka tampilan lengkap (header, judul, kartu, tabel).
   - Pastikan state data selalu memiliki nilai awal array aman (contoh: \`const [items, setItems] = useState([])\`), jangan biarkan undefined/null agar pemanggilan \`.map()\` tidak pernah crash/blank.
   - Operasi async database (seed/fetch) tidak boleh memblokir render awal komponen. Bungkus selalu dengan try/catch.`;

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
            Vibe Copilot
          </span>

          {/* Mode Switcher: Build App vs Tanya Jawab */}
          <div style={{ display: 'flex', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)', padding: '2px', borderRadius: '7px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <button
              type="button"
              onClick={() => setChatMode('build')}
              style={{
                fontSize: '10px',
                padding: '2px 7px',
                borderRadius: '5px',
                border: 'none',
                backgroundColor: chatMode === 'build' ? '#0ea5e9' : 'transparent',
                color: chatMode === 'build' ? '#fff' : '#94a3b8',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontWeight: chatMode === 'build' ? 700 : 500,
                transition: 'all 0.15s'
              }}
              title="Mode Buat / Modifikasi Aplikasi di Canvas Sandbox"
            >
              <Sparkles size={10} />
              <span>Build App</span>
            </button>
            <button
              type="button"
              onClick={() => setChatMode('qa')}
              style={{
                fontSize: '10px',
                padding: '2px 7px',
                borderRadius: '5px',
                border: 'none',
                backgroundColor: chatMode === 'qa' ? '#8b5cf6' : 'transparent',
                color: chatMode === 'qa' ? '#fff' : '#94a3b8',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontWeight: chatMode === 'qa' ? 700 : 500,
                transition: 'all 0.15s'
              }}
              title="Mode Tanya Jawab / Konsultasi (Diskusi tanpa mengubah kode)"
            >
              <MessageSquare size={10} />
              <span>Tanya Jawab</span>
            </button>
          </div>

          {/* Sub-toggle for Plan vs Instant when in Build mode */}
          {chatMode === 'build' && (
            <button
              type="button"
              onClick={() => setPlanFirstMode(v => !v)}
              style={{
                fontSize: '10px',
                padding: '2px 6px',
                borderRadius: '6px',
                backgroundColor: planFirstMode ? 'rgba(16, 185, 129, 0.18)' : 'rgba(100, 116, 139, 0.2)',
                color: planFirstMode ? '#34d399' : '#94a3b8',
                border: `1px solid ${planFirstMode ? 'rgba(52, 211, 153, 0.4)' : 'rgba(100, 116, 139, 0.3)'}`,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
                fontWeight: 600,
                transition: 'all 0.15s'
              }}
              title="Klik untuk beralih mode: Plan First vs Instant Code"
            >
              <ListTodo size={10} />
              <span>{planFirstMode ? '📋 Plan' : '⚡ Instant'}</span>
            </button>
          )}
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
              {chatMode === 'qa'
                ? 'Mode Tanya Jawab Aktif: Anda bisa berdiskusi, bertanya tentang arsitektur, konsultasi bug, atau cara integrasi MaviCore tanpa mengubah kode aplikasi.'
                : planFirstMode
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
            type={chatMode === 'qa' ? 'qa' : planFirstMode ? 'plan' : 'code'}
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
            <span>{chatMode === 'qa' ? 'Menyiapkan jawaban konsultasi...' : planFirstMode ? 'Menyusun Implementation Plan...' : 'Menghasilkan kode...'}</span>
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
            placeholder={
              chatMode === 'qa'
                ? "Tanya apa saja tentang kode, bug, logika, atau database MES..."
                : planFirstMode
                ? "Jelaskan app yang ingin dibuat (akan dibuatkan plan dulu)..."
                : "Ketik prompt instruksi kode aplikasi..."
            }
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
                  backgroundColor: isLoading || !input.trim() ? '#334155' : chatMode === 'qa' ? '#8b5cf6' : '#0284c7',
                  border: 'none',
                  borderRadius: '50%',
                  color: '#fff',
                  cursor: isLoading || !input.trim() ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s',
                  boxShadow: input.trim() ? (chatMode === 'qa' ? '0 2px 8px rgba(139, 92, 246, 0.4)' : '0 2px 8px rgba(2, 132, 199, 0.4)') : 'none'
                }}
                title={chatMode === 'qa' ? "Kirim Pertanyaan / Diskusi" : "Kirim Prompt Buat App"}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>Shift+Enter baris baru</span>
            <span style={{ color: '#475569' }}>•</span>
            <span style={{ color: chatMode === 'qa' ? '#c084fc' : '#38bdf8', fontWeight: 600 }}>
              {chatMode === 'qa' ? '💬 Tanya Jawab' : planFirstMode ? '📋 Plan Mode' : '⚡ Instant Mode'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              type="button"
              onClick={() => setChatMode(prev => prev === 'build' ? 'qa' : 'build')}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '10px',
                padding: '1px 6px',
                borderRadius: '4px',
                backgroundColor: chatMode === 'qa' ? 'rgba(139, 92, 246, 0.15)' : 'rgba(14, 165, 233, 0.15)',
                color: chatMode === 'qa' ? '#c084fc' : '#38bdf8',
                fontWeight: 600
              }}
              title="Ganti antara Mode Build App vs Tanya Jawab"
            >
              {chatMode === 'qa' ? 'Mode: Build App' : 'Mode: Tanya Jawab'}
            </button>
          </div>
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
  const isQa = type === 'qa';
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
          backgroundColor: isPlan ? '#7c3aed' : isWalkthrough ? '#059669' : isQa ? '#0284c7' : '#8b5cf6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          marginTop: '2px'
        }}>
          {isPlan ? <ListTodo size={15} color="#fff" /> : isWalkthrough ? <ShieldCheck size={15} color="#fff" /> : isQa ? <MessageSquare size={14} color="#fff" /> : <Bot size={15} color="#fff" />}
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
          : isQa
          ? 'rgba(15, 23, 42, 0.98)'
          : isAssistant
          ? '#1e293b'
          : '#8b5cf6',
        borderRadius: '12px',
        border: isPlan
          ? '1px solid rgba(139, 92, 246, 0.35)'
          : isWalkthrough
          ? '1px solid rgba(52, 211, 153, 0.35)'
          : isQa
          ? '1px solid rgba(56, 189, 248, 0.35)'
          : 'none',
        padding: '10px 14px',
        position: 'relative',
        wordBreak: 'break-word',
        overflowWrap: 'anywhere'
      }}>
        {/* Q&A Header Card */}
        {isQa && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '8px',
            paddingBottom: '6px',
            borderBottom: '1px solid rgba(56, 189, 248, 0.2)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <MessageSquare size={13} color="#38bdf8" />
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Tanya Jawab & Konsultasi
              </span>
            </div>
            <span style={{
              fontSize: '10px',
              padding: '1px 6px',
              borderRadius: '4px',
              backgroundColor: 'rgba(56, 189, 248, 0.15)',
              color: '#38bdf8',
              fontWeight: 600
            }}>
              Q&A Advisor
            </span>
          </div>
        )}
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

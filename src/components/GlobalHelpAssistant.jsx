import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, Bot, User, Loader2, BookOpen, 
  Layout, Cpu, BarChart3, Zap, Paperclip, X
} from 'lucide-react';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import { getPrimaryAiConnector } from '../utils/database';
import { getChatCompletion } from '../utils/aiService';
import { Link } from 'react-router-dom'; // For internal linking if needed, though markdown links handle href well

const SYSTEM_PROMPT = `
Anda adalah **Mavi Global AI Assistant**, pakar utama dari platform **Mavi MES (Manufacturing Execution System)**.
Tugas Anda adalah membantu pengguna memahami cara kerja Mavi, mulai dari konfigurasi hardware hingga pembuatan aplikasi industri.
Pengetahuan dasar Mavi meliputi:
1. **Apps (App Builder & Copilot):** Pengguna dapat membuat aplikasi operator/HMI secara drag-and-drop, mengatur tag PLC ke variabel UI, dan mempublish aplikasi. **PENTING:** Jika pengguna bertanya tentang cara membuat aplikasi (app), Anda WAJIB memberikan langkah-langkah dasar dan menyertakan tautan ini: [Buka Copilot App Builder](#/builder?copilot=true)
2. **Shop Floor (Hardware & Station):** Mavi menghubungkan hardware via Edge Devices, IoT Hub, dan PLC Settings (Modbus TCP/RTU, OPC UA, MQTT). Pengguna dapat memanajemen jalur produksi di Station Manager dan Assign App ke operator.
3. **Analytics:** Mavi memiliki Dashboard dan Analysis Manager untuk visualisasi data produksi (OEE, Downtime, dll).
4. **Logic & Automations:** Mavi mendukung otomatisasi berbasis node logic (Event-Condition-Action) dan Functions/API eksternal.
5. **Console:** Aplikasi dijalankan oleh operator melalui Live Terminal atau App Player.
Berikan panduan yang komprehensif, langkah demi langkah, dan mudah dipahami.
Gunakan format markdown yang rapi (bullet points, bold, code block).
`;

const MAVI_GUIDES = [
  {
    id: 'app-builder',
    title: 'App Builder & Copilot',
    icon: Layout,
    color: '#ec4899', // Pink
    content: `
**Membangun Aplikasi HMI/Operator**

Mavi menyediakan **App Builder** yang memungkinkan Anda membuat antarmuka aplikasi industri (HMI) secara *drag-and-drop* tanpa perlu coding.

1. **Membuat UI:** Buka menu **Apps -> App Builder**. Anda dapat menambahkan Widget seperti Tombol, Indikator Angka, Grafik, maupun Input Teks.
2. **Koneksi Variabel:** Setiap Widget dapat dikaitkan dengan *Variables* yang mana nilainya bisa bersumber dari PLC (Tag), Database (Tables), atau Input Operator.
3. **AI Copilot:** Anda bisa meminta Mavi AI Copilot untuk meng-*generate* layout UI berdasarkan prompt (contoh: "Buatkan form inspeksi quality control").
4. **Publishing:** Setelah selesai, aplikasi dapat di-Publish ke **App Store** internal untuk nantinya ditugaskan (assigned) ke *Station* tertentu di area Shop Floor.
    `
  },
  {
    id: 'shop-floor',
    title: 'Shop Floor & Konektivitas',
    icon: Cpu,
    color: '#3b82f6', // Blue
    content: `
**Manajemen Pabrik & Hardware**

Mavi mengatur hierarki lantai produksi dan mengumpulkan data dari mesin.

1. **Stations:** Titik kerja operator (misal: "Assembly Line 1"). Aplikasi (App) ditugaskan pada setiap Station, sehingga operator yang login di Station tersebut akan melihat App yang relevan.
2. **Machines & Edge Devices:** Repositori untuk mendaftarkan aset fisik pabrik. Edge Devices digunakan untuk memproses data komputasi di area lokal sebelum dikirim ke server.
3. **PLC Settings:** Untuk mengonfigurasi konektivitas Mavi ke PLC industri via protokol **Modbus TCP, Modbus RTU (Serial), OPC UA**, atau platform mikrokontroler seperti Arduino. Di sini Anda bisa memetakan memori register PLC menjadi Tag agar bisa dibaca oleh App.
4. **IoT Hub:** Menerima *streaming* data real-time via MQTT atau HTTP dari perangkat IoT.
    `
  },
  {
    id: 'logic',
    title: 'Logic & Automations',
    icon: Zap,
    color: '#f59e0b', // Orange
    content: `
**Automasi & Pengolahan Data**

1. **Automations:** Editor logika visual berbasis Node (*Event-Condition-Action*). Anda bisa membuat *Trigger* (misal: "Ketika Mesin Fault"), menentukan *Kondisi* ("Jika Suhu > 50"), dan mengeksekusi *Action* ("Kirim Email Alert" atau "Tulis log ke Database").
2. **Functions:** Menulis *script* kustom atau membuat konektor API pihak ketiga (misalnya ke sistem ERP eksternal seperti SAP atau Odoo). Fungsi-fungsi ini bisa dipanggil dari dalam aplikasi yang dibuat di App Builder.
    `
  },
  {
    id: 'analytics',
    title: 'Analytics & Dashboards',
    icon: BarChart3,
    color: '#10b981', // Green
    content: `
**Visualisasi Data Produksi**

1. **Tables (Database):** Mavi memiliki sistem database internal (mirip Tulip Tables) untuk menyimpan data riwayat produksi, inventory, atau work order.
2. **Analysis Manager:** Alat bantu untuk merumuskan dan menganalisa data dari Tables dan Hardware. Anda bisa membuat query untuk menghitung OEE (Overall Equipment Effectiveness), downtime mesin, atau target produksi.
3. **Dashboards:** Layar khusus untuk supervisor/manajer pabrik yang menampilkan berbagai grafik analisa (Bar chart, Line chart, Gauge) secara real-time.
    `
  }
];

export default function GlobalHelpAssistant() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Halo! Saya Mavi Global AI Assistant. Saya siap menjawab pertanyaan Anda mengenai platform Mavi, mulai dari App Builder, Manajemen Station, hingga konfigurasi PLC dan IoT. Ada yang ingin Anda pelajari hari ini?'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [aiConnector, setAiConnector] = useState(null);
  const [activeGuide, setActiveGuide] = useState(MAVI_GUIDES[0].id);
  const [knowledgeFiles, setKnowledgeFiles] = useState([]);
  const fileInputRef = useRef(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem('mavi_global_knowledge_files');
    if (saved) {
      try {
        setKnowledgeFiles(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2000000) { 
      toast.error('File terlalu besar! Batas maksimal 2 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target.result;
      const newFile = {
        id: Date.now().toString(),
        name: file.name,
        content: content,
        timestamp: new Date().toISOString()
      };
      const newFiles = [...knowledgeFiles, newFile];
      setKnowledgeFiles(newFiles);
      try {
        localStorage.setItem('mavi_global_knowledge_files', JSON.stringify(newFiles));
        toast.success(`File ${file.name} berhasil diunggah.`);
      } catch(err) {
        toast.error('Gagal menyimpan file ke penyimpanan lokal (melebihi batas kuota browser).');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleDeleteFile = (id) => {
    const newFiles = knowledgeFiles.filter(f => f.id !== id);
    setKnowledgeFiles(newFiles);
    localStorage.setItem('mavi_global_knowledge_files', JSON.stringify(newFiles));
  };

  useEffect(() => {
    const initAi = async () => {
      try {
        const connector = await getPrimaryAiConnector();
        setAiConnector(connector);
      } catch (err) {
        console.warn("Could not load AI connector:", err);
      }
    };
    initAi();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      if (!aiConnector || !aiConnector.config?.apiKey) {
        throw new Error('AI Connector belum dikonfigurasi. Silakan setting AI di halaman Integrasi terlebih dahulu.');
      }

      const history = messages.slice(-10).map(m => ({ role: m.role, content: m.content }));
      
      let systemPromptWithContext = SYSTEM_PROMPT;
      if (knowledgeFiles.length > 0) {
        systemPromptWithContext += `\n\n=== FILE KNOWLEDGE BASE ===\nAnda memiliki referensi file tambahan yang diunggah oleh pengguna:\n`;
        knowledgeFiles.forEach(f => {
          systemPromptWithContext += `\n[Nama File: ${f.name}]\n\`\`\`\n${f.content}\n\`\`\`\n`;
        });
      }

      const payload = [
        { role: 'system', content: systemPromptWithContext },
        ...history,
        { role: 'user', content: userMessage.content }
      ];

      const response = await getChatCompletion(payload, aiConnector);
      
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (err) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `❌ Error: ${err.message}`, 
        isError: true 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div style={{ display: 'flex', gap: '24px', padding: '24px', height: 'calc(100vh - 56px)', boxSizing: 'border-box', backgroundColor: '#f8fafc', flexDirection: 'row' }}>
      
      {/* ─── LEFT COLUMN: DOCUMENTATION ──────────────────────────── */}
      <div style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ padding: '10px', backgroundColor: 'rgba(59, 130, 246, 0.1)', borderRadius: '12px' }}>
            <BookOpen size={24} color="#3b82f6" />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a' }}>Panduan Aplikasi Mavi</h2>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>Pilih topik untuk melihat dokumentasi fungsional Mavi.</p>
          </div>
        </div>

        {/* Protocol Selector Tabs/Pills */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {MAVI_GUIDES.map(guide => {
            const isActive = activeGuide === guide.id;
            const Icon = guide.icon;
            return (
              <button
                key={guide.id}
                onClick={() => setActiveGuide(guide.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '10px 16px', borderRadius: '12px', border: isActive ? '1px solid ' + guide.color : '1px solid #cbd5e1',
                  backgroundColor: isActive ? `${guide.color}15` : '#ffffff',
                  color: isActive ? guide.color : '#475569',
                  cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600,
                  transition: 'all 0.2s'
                }}
              >
                <Icon size={16} />
                {guide.title}
              </button>
            );
          })}
        </div>

        {/* Content Viewer */}
        <div style={{ 
          flex: 1, 
          backgroundColor: '#ffffff', 
          border: '1px solid #cbd5e1', 
          borderRadius: '16px', 
          padding: '24px',
          overflowY: 'auto'
        }}>
          {MAVI_GUIDES.map(guide => guide.id === activeGuide && (
            <div key={guide.id} className="markdown-body" style={{ color: '#334155', fontSize: '0.9rem', lineHeight: '1.6' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
                <guide.icon size={28} color={guide.color} />
                <h3 style={{ margin: 0, fontSize: '1.4rem', color: '#0f172a' }}>{guide.title}</h3>
              </div>
              <ReactMarkdown>{guide.content}</ReactMarkdown>
            </div>
          ))}
        </div>
      </div>

      {/* ─── RIGHT COLUMN: AI CHATBOT ────────────────────────────── */}
      <div style={{ 
        flex: '1', 
        display: 'flex', 
        flexDirection: 'column', 
        backgroundColor: '#ffffff',
        border: '1px solid #cbd5e1',
        borderRadius: '16px',
        overflow: 'hidden'
      }}>
        {/* Chat Header */}
        <div style={{ 
          padding: '16px 20px', 
          backgroundColor: '#f8fafc', 
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ 
              width: '36px', height: '36px', borderRadius: '10px', 
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Bot size={20} color="#fff" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', color: '#0f172a', fontWeight: 600 }}>Mavi AI Assistant</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: aiConnector ? '#10b981' : '#ef4444' }} />
                <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                  {aiConnector ? 'Online • Ready to assist' : 'Offline • Configure AI Settings'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Messages */}
        <div 
          ref={scrollRef}
          style={{ 
            flex: 1, 
            padding: '20px', 
            overflowY: 'auto', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '16px' 
          }}
        >
          {messages.map((msg, idx) => {
            const isUser = msg.role === 'user';
            return (
              <div key={idx} style={{ 
                display: 'flex', 
                gap: '12px', 
                alignSelf: isUser ? 'flex-end' : 'flex-start',
                maxWidth: '85%'
              }}>
                {!isUser && (
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Bot size={18} color="#2563eb" />
                  </div>
                )}
                
                <div style={{ 
                  backgroundColor: isUser ? '#2563eb' : msg.isError ? 'rgba(239,68,68,0.1)' : '#f1f5f9',
                  border: msg.isError ? '1px solid rgba(239,68,68,0.2)' : '1px solid transparent',
                  padding: '12px 16px',
                  borderRadius: '16px',
                  borderTopRightRadius: isUser ? '4px' : '16px',
                  borderTopLeftRadius: !isUser ? '4px' : '16px',
                  color: isUser ? '#ffffff' : msg.isError ? '#ef4444' : '#1e293b',
                  fontSize: '0.9rem',
                  lineHeight: '1.5'
                }}>
                  <div className="markdown-body" style={{ color: 'inherit' }}>
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                </div>

                {isUser && (
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <User size={18} color="#ffffff" />
                  </div>
                )}
              </div>
            );
          })}
          
          {isLoading && (
            <div style={{ display: 'flex', gap: '12px', alignSelf: 'flex-start' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Bot size={18} color="#2563eb" />
              </div>
              <div style={{ backgroundColor: '#f1f5f9', padding: '12px 16px', borderRadius: '16px', borderTopLeftRadius: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Loader2 size={16} color="#64748b" className="animate-spin" />
                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Thinking...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div style={{ padding: '16px', backgroundColor: '#ffffff', borderTop: '1px solid #e2e8f0' }}>
          
          {/* Knowledge Base Chips */}
          {knowledgeFiles.length > 0 && (
            <div style={{ padding: '8px 12px', backgroundColor: '#f8fafc', borderRadius: '12px 12px 0 0', display: 'flex', gap: '8px', flexWrap: 'wrap', border: '1px solid #cbd5e1', borderBottom: 'none' }}>
              <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'flex', alignItems: 'center', marginRight: '4px', fontWeight: 600 }}>
                <BookOpen size={12} style={{ marginRight: '4px' }}/> File Referensi:
              </span>
              {knowledgeFiles.map(f => (
                <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 8px', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.75rem', color: '#334155' }}>
                  <span style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={f.name}>{f.name}</span>
                  <button onClick={() => handleDeleteFile(f.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0 2px' }}>
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div style={{ 
            display: 'flex', 
            alignItems: 'flex-end', 
            gap: '10px', 
            backgroundColor: '#f8fafc',
            borderRadius: knowledgeFiles.length > 0 ? '0 0 12px 12px' : '12px',
            border: '1px solid #cbd5e1',
            padding: '8px 8px 8px 16px',
            transition: 'border-color 0.2s',
          }}>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Tanya apapun tentang cara kerja Mavi..."
              rows={1}
              style={{
                flex: 1,
                backgroundColor: 'transparent',
                border: 'none',
                color: '#0f172a',
                fontSize: '0.95rem',
                outline: 'none',
                resize: 'none',
                maxHeight: '120px',
                paddingTop: '6px',
                fontFamily: 'inherit'
              }}
              onInput={(e) => {
                e.target.style.height = 'auto';
                e.target.style.height = (e.target.scrollHeight <= 120 ? e.target.scrollHeight : 120) + 'px';
              }}
            />
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".txt,.csv,.json,.md,.js" style={{ display: 'none' }} />
            <button
              onClick={() => fileInputRef.current?.click()}
              title="Unggah Dokumen Referensi"
              style={{
                width: '40px', height: '40px', borderRadius: '10px',
                backgroundColor: '#ffffff', color: '#64748b',
                border: '1px solid #cbd5e1', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s', flexShrink: 0
              }}
              onMouseEnter={e => { e.currentTarget.style.color = '#2563eb'; e.currentTarget.style.borderColor = '#2563eb'; }}
              onMouseLeave={e => { e.currentTarget.style.color = '#64748b'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
            >
              <Paperclip size={18} />
            </button>
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              style={{
                width: '40px', height: '40px', borderRadius: '10px',
                backgroundColor: (isLoading || !input.trim()) ? '#cbd5e1' : '#2563eb',
                color: '#ffffff',
                border: 'none', cursor: (isLoading || !input.trim()) ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s', flexShrink: 0
              }}
            >
              {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            </button>
          </div>
        </div>
      </div>
      
    </div>
  );
}

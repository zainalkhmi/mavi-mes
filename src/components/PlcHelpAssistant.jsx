import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, Bot, User, Loader2, Info, BookOpen, 
  Wifi, Cpu, Network, Cable, Play, Terminal, Paperclip, X
} from 'lucide-react';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import { getPrimaryAiConnector } from '../utils/database';
import { getChatCompletion } from '../utils/aiService';

const SYSTEM_PROMPT = `
Anda adalah Mavi PLC & Industrial Automation Expert.
Tugas Anda adalah membantu pengguna mengkonfigurasi koneksi PLC ke PC dan melakukan wiring untuk protokol industri seperti Modbus TCP, Modbus RTU (Serial RS485/RS232), MQTT, OPC UA, serta mikrokontroler Arduino (hardware wiring, sensor interface, C/C++ programming, Firmata/Modbus RTU).
Berikan panduan yang sangat jelas, langkah demi langkah, dan perhatikan aspek keamanan industri (wiring, grounding).
Gunakan bahasa Indonesia yang profesional namun mudah dipahami.
Gunakan markdown untuk memformat jawaban Anda agar lebih rapi (misal: bullet points, bold untuk nama terminal, code block jika perlu parameter).
`;

const WIRING_GUIDES = [
  {
    id: 'modbus-tcp',
    title: 'Modbus TCP / Ethernet',
    icon: Network,
    color: '#3b82f6', // Blue
    content: `
**Persiapan Hardware & Wiring:**
1. Gunakan kabel **Ethernet (RJ45) UTP/STP** kategori 5e atau 6.
2. Untuk lingkungan industri dengan banyak noise (EMI), gunakan kabel **STP (Shielded Twisted Pair)** dan pastikan shield terhubung ke grounding (PE).
3. Hubungkan port Ethernet pada PLC ke Industrial Switch/Router, lalu hubungkan PC ke Switch yang sama. (Bisa juga direct-connection PC ke PLC dengan kabel Cross/Straight, modern port biasanya mendukung Auto-MDIX).

**Konfigurasi IP (Network):**
1. Pastikan PC dan PLC berada pada **subnet yang sama**.
   - Contoh: PLC IP = \`192.168.1.10\`, PC IP = \`192.168.1.100\`.
   - Subnet Mask = \`255.255.255.0\`.
2. Port default Modbus TCP adalah **502**.

**Testing Konektivitas:**
1. Buka Command Prompt di PC, ketik \`ping 192.168.1.10\` (ganti dengan IP PLC).
2. Jika Reply, maka secara fisik koneksi sudah berhasil.
    `
  },
  {
    id: 'modbus-rtu',
    title: 'Modbus RTU / Serial (RS485/RS232)',
    icon: Cable,
    color: '#f59e0b', // Orange
    content: `
**Wiring RS485 (2-Wire / Half-Duplex):**
1. Gunakan kabel twisted pair (berpelindung/shielded sangat disarankan).
2. Hubungkan terminal **Data+ (A atau D+)** pada PLC ke **Data+** pada USB-to-RS485 converter di PC.
3. Hubungkan terminal **Data- (B atau D-)** pada PLC ke **Data-** pada converter.
4. Hubungkan **GND (Ground)** jika jarak jauh atau beda potensial untuk mencegah kerusakan transceiver.
5. Pada ujung jalur komunikasi (ujung terjauh), pasang **Terminating Resistor (120 Ohm)** di antara Data+ dan Data- jika jarak kabel lebih dari 100 meter.

**Wiring RS232 (Jarak dekat < 15m):**
1. **TX** PLC dihubungkan ke **RX** PC.
2. **RX** PLC dihubungkan ke **TX** PC.
3. **GND** PLC dihubungkan ke **GND** PC.

**Konfigurasi Serial (COM Port):**
1. Pastikan **Baud Rate**, **Data Bits** (biasanya 8), **Parity** (None/Even/Odd), dan **Stop Bits** (1/2) *sama persis* antara pengaturan PLC dan PC.
2. Cek Device Manager di PC untuk memastikan nomor COM Port dari USB-to-Serial.
    `
  },
  {
    id: 'mqtt',
    title: 'MQTT (IoT Protocol)',
    icon: Wifi,
    color: '#10b981', // Green
    content: `
**Persiapan Jaringan:**
1. PLC harus mendukung konektivitas Ethernet/Wi-Fi dan memiliki fungsi MQTT Client bawaan (seperti Siemens S7-1200 dengan library MQTT, atau PLC modern seperti Wago/Beckhoff).
2. Jika PLC tidak mendukung MQTT secara native, gunakan **IoT Gateway** (misal membaca Modbus dari PLC lalu publish ke MQTT).

**Konfigurasi MQTT Client di PLC:**
1. **Broker URL / IP:** Alamat IP atau hostname dari MQTT Broker (misal: Mosquitto, EMQX, HiveMQ).
2. **Port:** Biasanya \`1883\` (Unencrypted) atau \`8883\` (TLS/SSL Enkripsi).
3. **Client ID:** Harus unik untuk setiap PLC.
4. **Username & Password:** Jika Broker membutuhkan autentikasi.
5. **Topic Publish:** Topik di mana PLC mengirim data (misal: \`factory/line1/plc_status\`).
6. **Payload Format:** Biasanya JSON (misal: \`{"temp": 45.5, "status": "running"}\`).
    `
  },
  {
    id: 'opc-ua',
    title: 'OPC UA',
    icon: Cpu,
    color: '#8b5cf6', // Purple
    content: `
**Persiapan:**
1. Pastikan PLC mendukung **OPC UA Server** (misal: Siemens S7-1500, S7-1200 FW v4.4+, Omron NX102, Beckhoff).
2. Pastikan firmware PLC di-update ke versi terbaru.
3. Hubungkan PLC ke PC melalui jaringan Ethernet TCP/IP.

**Konfigurasi di PLC (contoh TIA Portal):**
1. Aktifkan **OPC UA Server** di Device Configuration.
2. Catat **Server Endpoint URL** (biasanya: \`opc.tcp://192.168.0.1:4840\`).
3. Aktifkan akses ke variabel/tag yang ingin di-expose (centang kotak 'Accessible from HMI/OPC UA').
4. Konfigurasikan Security (None, Basic256Sha256, dll). Untuk tahap testing awal, gunakan 'No Security'.
5. Compile dan Download konfigurasi hardware & software ke PLC.
    `
  },
  {
    id: 'arduino',
    title: 'Arduino / Mikrokontroler',
    icon: Terminal,
    color: '#0ea5e9', // Light Blue
    content: `
**Wiring Hardware & Sensor:**
1. **Power Supply:** Pastikan tegangan input sesuai dengan spesifikasi board (misal: 5V untuk UNO, 3.3V untuk ESP32/NodeMCU). Jangan berikan beban berlebih pada pin 5V/3.3V dari Arduino. Gunakan power supply eksternal untuk motor/relay.
2. **Grounding:** Jika menggunakan power supply eksternal, pastikan pin **GND Arduino** digabungkan (common ground) dengan **GND Power Supply Eksternal**.
3. **Sensor Digital/Analog:** Gunakan resistor pull-up/pull-down (biasanya 10k Ohm) pada pin input digital jika diperlukan untuk mencegah *floating state*.
4. **Modbus RTU via Arduino:** Gunakan modul RS485 (seperti MAX485). Hubungkan **RO ke RX**, **DI ke TX**, serta **DE dan RE** ke pin digital (misal D2) untuk kontrol *Transmit/Receive*.

**Programming (C/C++ & Modbus):**
1. Anda dapat menggunakan library \`ModbusRTU.h\` atau \`ModbusMaster.h\` di Arduino IDE untuk menjadikan Arduino sebagai Slave/Master.
2. Saat menggunakan komunikasi Serial untuk Modbus, pastikan Anda tidak menggunakan pin RX/TX utama (Pin 0 & 1) untuk debugging \`Serial.print()\` secara bersamaan, atau gunakan \`SoftwareSerial\`.
3. Anda juga dapat menggunakan protokol **Firmata** untuk mengontrol pin Arduino secara langsung dari PC tanpa perlu melakukan hardcoding program secara manual di Arduino IDE.
    `
  }
];

export default function PlcHelpAssistant() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Halo! Saya AI Assistant khusus untuk konfigurasi dan wiring PLC. Ada yang bisa saya bantu mengenai cara menghubungkan PC ke PLC Anda?'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [aiConnector, setAiConnector] = useState(null);
  const [activeGuide, setActiveGuide] = useState(WIRING_GUIDES[0].id);
  const [knowledgeFiles, setKnowledgeFiles] = useState([]);
  const fileInputRef = useRef(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem('mavi_plc_knowledge_files');
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
        localStorage.setItem('mavi_plc_knowledge_files', JSON.stringify(newFiles));
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
    localStorage.setItem('mavi_plc_knowledge_files', JSON.stringify(newFiles));
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
        systemPromptWithContext += `\n\n=== FILE KNOWLEDGE BASE ===\nAnda memiliki akses ke referensi file program PLC berikut yang diunggah oleh pengguna:\n`;
        knowledgeFiles.forEach(f => {
          systemPromptWithContext += `\n[Nama File: ${f.name}]\n\`\`\`\n${f.content}\n\`\`\`\n`;
        });
        systemPromptWithContext += `\nJika pengguna bertanya atau menganalisa program PLC, rujuk secara khusus ke baris/instruksi dalam file di atas.`;
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
    <div style={{ display: 'flex', gap: '24px', height: '100%', minHeight: '600px', flexDirection: 'row' }}>
      
      {/* ─── LEFT COLUMN: DOCUMENTATION ──────────────────────────── */}
      <div style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ padding: '10px', backgroundColor: 'rgba(59, 130, 246, 0.1)', borderRadius: '12px' }}>
            <BookOpen size={24} color="#3b82f6" />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#f8fafc' }}>Panduan Wiring & Koneksi</h2>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8' }}>Pilih protokol untuk melihat detail konfigurasi fisik dan jaringan.</p>
          </div>
        </div>

        {/* Protocol Selector Tabs/Pills */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {WIRING_GUIDES.map(guide => {
            const isActive = activeGuide === guide.id;
            const Icon = guide.icon;
            return (
              <button
                key={guide.id}
                onClick={() => setActiveGuide(guide.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '10px 16px', borderRadius: '12px', border: '1px solid',
                  backgroundColor: isActive ? `${guide.color}20` : '#111827',
                  borderColor: isActive ? guide.color : '#1f2937',
                  color: isActive ? guide.color : '#cbd5e1',
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
          backgroundColor: '#111827', 
          border: '1px solid #1f2937', 
          borderRadius: '16px', 
          padding: '24px',
          overflowY: 'auto'
        }}>
          {WIRING_GUIDES.map(guide => guide.id === activeGuide && (
            <div key={guide.id} className="markdown-body" style={{ color: '#e2e8f0', fontSize: '0.9rem', lineHeight: '1.6' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', borderBottom: '1px solid #1f2937', paddingBottom: '16px' }}>
                <guide.icon size={28} color={guide.color} />
                <h3 style={{ margin: 0, fontSize: '1.4rem', color: '#f8fafc' }}>{guide.title}</h3>
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
        backgroundColor: '#0f172a',
        border: '1px solid #1f2937',
        borderRadius: '16px',
        overflow: 'hidden'
      }}>
        {/* Chat Header */}
        <div style={{ 
          padding: '16px 20px', 
          backgroundColor: '#111827', 
          borderBottom: '1px solid #1f2937',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ 
              width: '36px', height: '36px', borderRadius: '10px', 
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Bot size={20} color="#fff" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', color: '#f8fafc', fontWeight: 600 }}>PLC AI Assistant</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: aiConnector ? '#10b981' : '#ef4444' }} />
                <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
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
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Bot size={18} color="#10b981" />
                  </div>
                )}
                
                <div style={{ 
                  backgroundColor: isUser ? '#3b82f6' : msg.isError ? 'rgba(239,68,68,0.1)' : '#1e293b',
                  border: msg.isError ? '1px solid rgba(239,68,68,0.2)' : '1px solid transparent',
                  padding: '12px 16px',
                  borderRadius: '16px',
                  borderTopRightRadius: isUser ? '4px' : '16px',
                  borderTopLeftRadius: !isUser ? '4px' : '16px',
                  color: isUser ? '#ffffff' : msg.isError ? '#ef4444' : '#e2e8f0',
                  fontSize: '0.9rem',
                  lineHeight: '1.5'
                }}>
                  <div className="markdown-body" style={{ color: 'inherit' }}>
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                </div>

                {isUser && (
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <User size={18} color="#ffffff" />
                  </div>
                )}
              </div>
            );
          })}
          
          {isLoading && (
            <div style={{ display: 'flex', gap: '12px', alignSelf: 'flex-start' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Bot size={18} color="#10b981" />
              </div>
              <div style={{ backgroundColor: '#1e293b', padding: '12px 16px', borderRadius: '16px', borderTopLeftRadius: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Loader2 size={16} color="#94a3b8" className="animate-spin" />
                <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Thinking...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div style={{ padding: '16px', backgroundColor: '#111827', borderTop: '1px solid #1f2937' }}>
          
          {/* Knowledge Base Chips */}
          {knowledgeFiles.length > 0 && (
            <div style={{ padding: '8px 12px', backgroundColor: '#1e293b', borderRadius: '12px 12px 0 0', display: 'flex', gap: '8px', flexWrap: 'wrap', border: '1px solid #334155', borderBottom: 'none' }}>
              <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'flex', alignItems: 'center', marginRight: '4px', fontWeight: 600 }}>
                <BookOpen size={12} style={{ marginRight: '4px' }}/> Attached PLC Files:
              </span>
              {knowledgeFiles.map(f => (
                <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 8px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', fontSize: '0.75rem', color: '#e2e8f0' }}>
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
            backgroundColor: '#1e293b',
            borderRadius: knowledgeFiles.length > 0 ? '0 0 12px 12px' : '12px',
            border: '1px solid #334155',
            padding: '8px 8px 8px 16px',
            transition: 'border-color 0.2s',
          }}>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Tanya soal wiring atau konfigurasi koneksi..."
              rows={1}
              style={{
                flex: 1,
                backgroundColor: 'transparent',
                border: 'none',
                color: '#f8fafc',
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
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".txt,.awl,.st,.xml,.csv,.json,.scl,.l5x" style={{ display: 'none' }} />
            <button
              onClick={() => fileInputRef.current?.click()}
              title="Upload File Program PLC (Teks/XML)"
              style={{
                width: '40px', height: '40px', borderRadius: '10px',
                backgroundColor: 'transparent', color: '#94a3b8',
                border: '1px solid #334155', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s', flexShrink: 0
              }}
              onMouseEnter={e => { e.currentTarget.style.color = '#3b82f6'; e.currentTarget.style.borderColor = '#3b82f6'; }}
              onMouseLeave={e => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.borderColor = '#334155'; }}
            >
              <Paperclip size={18} />
            </button>
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              style={{
                width: '40px', height: '40px', borderRadius: '10px',
                backgroundColor: (isLoading || !input.trim()) ? '#334155' : '#3b82f6',
                color: (isLoading || !input.trim()) ? '#64748b' : '#ffffff',
                border: 'none', cursor: (isLoading || !input.trim()) ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s', flexShrink: 0
              }}
            >
              {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            </button>
          </div>
          <div style={{ textAlign: 'center', marginTop: '10px' }}>
            <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
              Mavi AI Assistant dapat membuat kesalahan. Selalu periksa kembali skema wiring Anda sebelum menyalakan daya (power-on).
            </span>
          </div>
        </div>
      </div>
      
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, Bot, User, Loader2, Info, BookOpen, 
  Wifi, Cpu, Network, Cable, Play, Pause, Terminal, Paperclip, X,
  AlertTriangle, ShieldAlert, Eye, Database, FileText, CheckCircle,
  RefreshCw, Upload, HardDrive, Thermometer, Gauge, Zap,
  HelpCircle, FileSpreadsheet, Download, Settings
} from 'lucide-react';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import mqtt from 'mqtt';
import { getPrimaryAiConnector } from '../utils/database';
import { getChatCompletion } from '../utils/aiService';

// ==========================================
// PRESETS & SIMULATOR LOGIC
// ==========================================
const SCL_CYLINDER_PRESET = `// ==========================================
// MANDOR MES PLC PROGRAM - HYDRAULIC CYLINDER
// ==========================================

VAR_INPUT
  I_Start_Button : BOOL; // Start process (Green Button)
  I_Stop_Button : BOOL;  // Stop process (Red Button)
  I_EStop_Ok : BOOL := TRUE; // Emergency Stop OK (NC Contact)
  I_Cylinder_Retracted : BOOL := TRUE; // Proximity Sensor (X0)
  I_Cylinder_Extended : BOOL := FALSE; // Proximity Sensor (X1)
  I_Overload_Relay : BOOL := TRUE; // Motor Thermal Switch (NC)
END_VAR

VAR_OUTPUT
  Q_Pump_Motor : BOOL; // Hydraulic Pump Control
  Q_Solenoid_Extend : BOOL; // Valve Forward Coil
  Q_Solenoid_Retract : BOOL; // Valve Reverse Coil
  Q_System_Running : BOOL; // Green Status Lamp
  Q_Alarm_Beacon : BOOL; // Red Fault Strobe Lamp
END_VAR

VAR
  M_Fault_Active : BOOL; // Internal fault flag
  T_Cycle_Timer : INT; // Movement position count (0-100)
END_VAR

// 1. SAFETY INTERLOCK & ALARM
IF NOT I_EStop_Ok OR NOT I_Overload_Relay THEN
  M_Fault_Active := TRUE;
  Q_Pump_Motor := FALSE;
  Q_System_Running := FALSE;
  Q_Alarm_Beacon := TRUE;
ELSE
  Q_Alarm_Beacon := FALSE;
END_IF;

// 2. MOTOR LATCH CIRCUITS
IF I_Start_Button AND NOT M_Fault_Active THEN
  Q_Pump_Motor := TRUE;
  Q_System_Running := TRUE;
END_IF;

IF I_Stop_Button OR M_Fault_Active THEN
  Q_Pump_Motor := FALSE;
  Q_System_Running := FALSE;
END_IF;

// 3. CYLINDER DIRECTION CONTROL
IF Q_Pump_Motor THEN
  // Auto switch when limits hit
  IF I_Cylinder_Retracted THEN
    Q_Solenoid_Extend := TRUE;
    Q_Solenoid_Retract := FALSE;
  ELSIF I_Cylinder_Extended THEN
    Q_Solenoid_Extend := FALSE;
    Q_Solenoid_Retract := TRUE;
  END_IF;
ELSE
  Q_Solenoid_Extend := false;
  Q_Solenoid_Retract := false;
END_IF;`;

const SCL_DOL_MOTOR_PRESET = `// ==========================================
// MANDOR MES PLC PROGRAM - DIRECT ONLINE MOTOR
// ==========================================

VAR_INPUT
  I_Start_Button : BOOL; // Start Pushbutton
  I_Stop_Button : BOOL;  // Stop Pushbutton (NC)
  I_EStop_Ok : BOOL := TRUE; // E-Stop NC
  I_Overload_Relay : BOOL := TRUE; // Thermal Overload
END_VAR

VAR_OUTPUT
  Q_Motor : BOOL; // Main Contractor Coil
  Q_Fault : BOOL; // Fault Indicator
END_VAR

// Motor latch circuit with safety
Q_Motor := (I_Start_Button OR Q_Motor) AND I_Stop_Button AND I_EStop_Ok AND I_Overload_Relay;
Q_Fault := NOT I_Overload_Relay OR NOT I_EStop_Ok;`;



// Helper to load Tauri API
let tauriInvoke = null;
async function getTauriApi() {
  if (window.__TAURI_INTERNALS__) {
    if (!tauriInvoke) {
      try {
        const core = await import('@tauri-apps/api/core');
        tauriInvoke = core.invoke;
      } catch (e) {
        console.warn('Failed to load Tauri APIs:', e);
      }
    }
    return { invoke: tauriInvoke };
  }
  return { invoke: null };
}

// Default System Prompt
const SYSTEM_PROMPT = `
Anda adalah Mandor PLC & Industrial Automation Expert (Senior Automation Engineer Agent).
Tugas Anda adalah membantu pengguna merancang, memprogram, menguji, mensimulasikan, dan melakukan troubleshooting program PLC (Siemens TIA Portal, Mitsubishi GX Works, Omron Sysmac, Codesys, Allen-Bradley Logix) serta protokol jaringan industri (Modbus RTU/TCP, OPC UA, MQTT, Ethernet/IP, Profinet).

Gunakan keahlian Anda untuk:
1. Menganalisis potongan kode Structured Text (SCL/ST) yang diberikan atau diunggah.
2. Mendeteksi cacat program (Double Coil, Race Conditions, Safety Override, Deadlocks).
3. Memberikan panduan wiring listrik, kalkulasi Performance Level (ISO 13849-1), Kategori Safety, dan interlock PLC.
4. Mendiagnosis akar masalah kegagalan mesin berdasarkan status I/O.
5. Memberikan instruksi lapangan langkah-demi-langkah (Root Cause Analysis).

Gunakan bahasa Indonesia yang profesional dan markdown yang jelas dengan tabel atau poin-poin.
`;

export default function PlcHelpAssistant() {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState('editor'); // editor, simulator, ocr, iot, diagnostics, panel-vision
  
  // AI chatbot states
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Halo! Saya **Mandor Industrial Automation AI Agent**. Saya siap membantu Anda dalam analisis kode SCL, simulasi PLC, monitoring Modbus, diagnosa root cause lapangan, hingga wiring safety relay. Silakan pilih tab di samping untuk mengakses alat bantu interaktif!'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [aiConnector, setAiConnector] = useState(null);
  const [knowledgeFiles, setKnowledgeFiles] = useState([]);
  
  // Code Editor states
  const [stCode, setStCode] = useState(SCL_CYLINDER_PRESET);
  const [compiledIssues, setCompiledIssues] = useState([]);
  const [tagsList, setTagsList] = useState([]);
  
  // Live PLC simulator variables
  const [plcVariables, setPlcVariables] = useState({
    I_Start_Button: false,
    I_Stop_Button: false,
    I_EStop_Ok: true,
    I_Cylinder_Retracted: true,
    I_Cylinder_Extended: false,
    I_Overload_Relay: true,
    Q_Pump_Motor: false,
    Q_Solenoid_Extend: false,
    Q_Solenoid_Retract: false,
    Q_System_Running: false,
    Q_Alarm_Beacon: false,
    M_Fault_Active: false,
    T_Cycle_Timer: 0,
  });

  // OCR Ladder diagram states
  const [ocrScanning, setOcrScanning] = useState(false);
  const [ocrResult, setOcrResult] = useState(null);
  const [uploadedOcrFile, setUploadedOcrFile] = useState(null);

  // IoT Modbus settings & chart states
  const [connectionType, setConnectionType] = useState('modbus'); // modbus, mqtt
  const [plcIp, setPlcIp] = useState('127.0.0.1');
  const [plcPort, setPlcPort] = useState('502');
  const [plcUnitId, setPlcUnitId] = useState('1');
  const [mqttBroker, setMqttBroker] = useState('wss://broker.emqx.io:8084/mqtt');
  const [mqttTopic, setMqttTopic] = useState('mandor/factory/telemetry');
  const [iotStatus, setIotStatus] = useState('disconnected');
  const [modbusData, setModbusData] = useState([
    { register: 40001, name: 'Pump_Motor_Speed', value: 0, type: 'INT' },
    { register: 40002, name: 'Oil_Temperature', value: 24.5, type: 'REAL' },
    { register: 40003, name: 'System_Pressure', value: 0.0, type: 'REAL' },
    { register: 40004, name: 'Cycle_Counter', value: 0, type: 'DINT' },
    { register: 40005, name: 'Safety_Relay_State', value: 1, type: 'BOOL' }
  ]);
  const [pressureHistory, setPressureHistory] = useState(Array(20).fill(0));

  // References
  const fileInputRef = useRef(null);
  const ocrFileInputRef = useRef(null);
  const scrollRef = useRef(null);
  const mqttClientRef = useRef(null);

  // Load uploaded files from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('mandor_plc_knowledge_files');
    if (saved) {
      try {
        setKnowledgeFiles(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  // Fetch AI Config
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

  // Cleanup connections on unmount
  useEffect(() => {
    return () => {
      if (mqttClientRef.current) {
        try { mqttClientRef.current.end(); } catch(e) {}
      }
      const cleanupModbus = async () => {
        const api = await getTauriApi();
        if (api.invoke) {
          try { await api.invoke('modbus_disconnect', { id: 'mandor_studio_plc' }); } catch (e) {}
        }
      };
      cleanupModbus();
    };
  }, []);

  // Scroll chatbot to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // PLC Code Parser to extract tags
  const parseCodeTags = (code) => {
    const tags = [];
    const lines = code.split('\n');
    let section = 'local';
    
    // Check if it is XML export (Omron, Codesys)
    if (code.trim().startsWith('<')) {
      // Omron CXP style symbols
      const omronRegex = /<Symbol\s+Name="([^"]+)"\s+Type="([^"]+)"\s+Address="([^"]+)"/g;
      let match;
      while ((match = omronRegex.exec(code)) !== null) {
        tags.push({
          name: match[1],
          type: match[2].toUpperCase(),
          address: match[3],
          direction: match[3].toUpperCase().startsWith('I') ? 'Input' : match[3].toUpperCase().startsWith('Q') ? 'Output' : 'Memory',
          description: 'Omron CXP Tag'
        });
      }

      // Codesys style symbols
      const codesysRegex = /<variable\s+name="([^"]+)">\s*<type>\s*<([^/>]+)\/>/g;
      while ((match = codesysRegex.exec(code)) !== null) {
        tags.push({
          name: match[1],
          type: match[2].toUpperCase(),
          address: `DBX_${tags.length * 2}`,
          direction: 'Memory',
          description: 'Codesys XML Tag'
        });
      }

      if (tags.length > 0) return tags;
    }

    // Normal SCL text parsing
    lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('//')) return;

      if (trimmed.toUpperCase().startsWith('VAR_INPUT')) {
        section = 'Input';
        return;
      }
      if (trimmed.toUpperCase().startsWith('VAR_OUTPUT')) {
        section = 'Output';
        return;
      }
      if (trimmed.toUpperCase().startsWith('VAR')) {
        section = 'Memory';
        return;
      }
      if (trimmed.toUpperCase().startsWith('END_VAR')) {
        return;
      }

      if (trimmed.includes(':')) {
        const parts = trimmed.split(':');
        const name = parts[0].trim();
        const remain = parts[1].split(';');
        const typePart = remain[0].trim();
        const commentPart = remain[1] ? remain[1].replace('//', '').trim() : '';

        // Extract default val
        let defaultVal = '';
        let type = typePart;
        if (typePart.includes(':=')) {
          const typeSub = typePart.split(':=');
          type = typeSub[0].trim();
          defaultVal = typeSub[1].trim();
        }

        let address = 'M0.0';
        if (section === 'Input') {
          address = `I0.${tags.filter(t => t.direction === 'Input').length}`;
        } else if (section === 'Output') {
          address = `Q0.${tags.filter(t => t.direction === 'Output').length}`;
        } else {
          address = `MW${10 + tags.filter(t => t.direction === 'Memory').length * 2}`;
        }

        tags.push({
          name,
          type: type.toUpperCase(),
          address,
          direction: section,
          description: commentPart || `${section} variable`,
          defaultValue: defaultVal
        });
      }
    });

    if (tags.length === 0) {
      // Return default cylinder tags if nothing parsed
      return [
        { name: 'I_Start_Button', type: 'BOOL', address: 'I0.0', direction: 'Input', description: 'Start process (Green Button)' },
        { name: 'I_Stop_Button', type: 'BOOL', address: 'I0.1', direction: 'Input', description: 'Stop process (Red Button)' },
        { name: 'I_EStop_Ok', type: 'BOOL', address: 'I0.2', direction: 'Input', description: 'Emergency Stop OK (NC Contact)' },
        { name: 'I_Cylinder_Retracted', type: 'BOOL', address: 'I0.3', direction: 'Input', description: 'Proximity Sensor (X0)' },
        { name: 'I_Cylinder_Extended', type: 'BOOL', address: 'I0.4', direction: 'Input', description: 'Proximity Sensor (X1)' },
        { name: 'I_Overload_Relay', type: 'BOOL', address: 'I0.5', direction: 'Input', description: 'Motor Thermal Switch (NC)' },
        { name: 'Q_Pump_Motor', type: 'BOOL', address: 'Q0.0', direction: 'Output', description: 'Hydraulic Pump Control' },
        { name: 'Q_Solenoid_Extend', type: 'BOOL', address: 'Q0.1', direction: 'Output', description: 'Valve Forward Coil' },
        { name: 'Q_Solenoid_Retract', type: 'BOOL', address: 'Q0.2', direction: 'Output', description: 'Valve Reverse Coil' },
        { name: 'Q_System_Running', type: 'BOOL', address: 'Q0.3', direction: 'Output', description: 'Green Status Lamp' },
        { name: 'Q_Alarm_Beacon', type: 'BOOL', address: 'Q0.4', direction: 'Output', description: 'Red Fault Strobe Lamp' }
      ];
    }
    return tags;
  };

  // Static Logic Analysis (Double Coil, Safety, Race Condition)
  const analyzeSclLogic = (code) => {
    const issues = [];
    const lower = code.toLowerCase();

    // 1. Double Coil check
    const outputs = ['q_pump_motor', 'q_solenoid_extend', 'q_solenoid_retract', 'q_system_running', 'q_alarm_beacon', 'q_motor', 'q_fault'];
    outputs.forEach(out => {
      const occurrences = (code.match(new RegExp(`${out}\\s*:=`, 'gi')) || []).length;
      if (occurrences > 1) {
        issues.push({
          type: 'danger',
          icon: ShieldAlert,
          title: 'Cacat PLC: Double Coil',
          desc: `Variabel Output '${out}' ditulis sebanyak ${occurrences} kali dalam satu siklus. Ini menyebabkan penulisan terakhir mengesampingkan penulisan sebelumnya, sangat berbahaya di mesin fisik!`
        });
      }
    });

    // 2. Safety Relay bypass check
    if ((lower.includes('q_solenoid') || lower.includes('q_motor')) && !lower.includes('estop') && !lower.includes('emergency')) {
      issues.push({
        type: 'warning',
        icon: AlertTriangle,
        title: 'Safety Warning: Tidak ada Interlock E-Stop',
        desc: 'Kontrol aktuator terdeteksi tanpa melibatkan interlock Emergency Stop. Pastikan input E-Stop memutus power aktuator secara fisik dan melalui logika PLC!'
      });
    }

    // 3. Latching race condition check
    if (lower.includes('i_start_button') && !lower.includes('i_stop_button')) {
      issues.push({
        type: 'warning',
        icon: AlertTriangle,
        title: 'Kemungkinan Race Condition',
        desc: 'Tombol Start dideteksi tanpa interlock tombol Stop. Motor/sistem tidak akan bisa dihentikan dalam kondisi normal.'
      });
    }

    if (issues.length === 0) {
      issues.push({
        type: 'success',
        icon: CheckCircle,
        title: 'Sintaks & Safety Terverifikasi',
        desc: 'Tidak ditemukan double coil, bypass safety emergency stop, atau race condition dasar dalam program ini.'
      });
    }
    return issues;
  };

  // Initialize tags & compilation issues on code change
  useEffect(() => {
    setTagsList(parseCodeTags(stCode));
    setCompiledIssues(analyzeSclLogic(stCode));
  }, [stCode]);

  // PLC Logic Simulation Loop removed (mock simulator disabled)

  // helper file to base64
  const fileToBase64 = (f) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(f);
  });

  // REAL Gemini Vision OCR upload
  const handleOcrVisionUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setOcrScanning(true);
    setOcrResult(null);
    setUploadedOcrFile({
      name: file.name,
      type: file.type,
      previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : null
    });

    try {
      const settings = aiConnector?.aiSettings || aiConnector?.config;
      if (!aiConnector || !settings?.apiKey) {
        toast.error('AI API Key belum dikonfigurasi. Silakan lakukan konfigurasi pada menu AI Settings.');
        setOcrScanning(false);
        return;
      }

      const base64Data = await fileToBase64(file);
      const cleanModelId = settings.modelId.includes('/') ? settings.modelId.split('/').pop() : settings.modelId;
      const url = `https://generativelanguage.googleapis.com/v1/models/${cleanModelId}:generateContent?key=${settings.apiKey}`;

      const promptText = `
      You are an expert Industrial Automation Vision System.
      Analyze the provided image of a PLC Ladder Diagram and perform OCR:
      1. Identify all contacts, coils, and variables.
      2. Convert the ladder logic into standard SCL (Structured Text) code.
      3. Output the result in JSON format:
      {
        "detected": ["contact 1", "coil 2"],
        "stCode": "the Structured Text code here",
        "standards": "safety or standard review"
      }
      Reply with ONLY the raw JSON string. Do not wrap in markdown or any other tags.
      `;

      const payload = {
        contents: [{
          role: 'user',
          parts: [
            { text: promptText },
            { inline_data: { mime_type: file.type, data: base64Data } }
          ]
        }],
        generationConfig: { temperature: 0.1 }
      };

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('API vision call failed');
      const result = await res.json();
      const responseText = result.candidates[0].content.parts[0].text.trim();
      
      const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      
      setOcrResult(parsed);
      if (parsed.stCode) {
        setStCode(parsed.stCode);
        toast.success('Ladder diagram berhasil dikonversi ke SCL!');
      } else {
        toast.success('Analisis Vision AI selesai!');
      }
    } catch (err) {
      console.error(err);
      toast.error('AI Vision error. Gagal melakukan OCR real-time.');
      setOcrScanning(false);
    } finally {
      setOcrScanning(false);
    }
  };



  // REAL connection handler (Tauri Modbus TCP / Web MQTT)
  const handleConnectRealTime = async () => {
    if (iotStatus === 'connected') {
      if (connectionType === 'modbus') {
        const api = await getTauriApi();
        if (api.invoke) {
          try {
            await api.invoke('modbus_disconnect', { id: 'mandor_studio_plc' });
          } catch (e) {}
        }
      } else if (connectionType === 'mqtt') {
        if (mqttClientRef.current) {
          try { mqttClientRef.current.end(); } catch(e) {}
          mqttClientRef.current = null;
        }
      }
      setIotStatus('disconnected');
      toast.success('Koneksi diputus.');
      return;
    }

    setIotStatus('connecting');

    if (connectionType === 'modbus') {
      const api = await getTauriApi();
      if (!api.invoke) {
        setIotStatus('disconnected');
        toast.error('Koneksi Modbus TCP native membutuhkan launcher aplikasi Tauri Desktop.');
        return;
      }
      try {
        await api.invoke('modbus_connect', {
          id: 'mandor_studio_plc',
          ip: plcIp,
          port: parseInt(plcPort) || 502,
          unitId: parseInt(plcUnitId) || 1
        });
        setIotStatus('connected');
        toast.success(`Terhubung ke Modbus TCP PLC: ${plcIp}:${plcPort}`);
      } catch (err) {
        setIotStatus('disconnected');
        toast.error(`Koneksi Modbus Gagal: ${err}`);
      }
    } else if (connectionType === 'mqtt') {
      try {
        const client = mqtt.connect(mqttBroker, { connectTimeout: 4000 });
        mqttClientRef.current = client;

        client.on('connect', () => {
          client.subscribe(mqttTopic);
          setIotStatus('connected');
          toast.success(`Terhubung ke MQTT Broker: ${mqttBroker}`);
        });

        client.on('message', (topic, message) => {
          try {
            const payload = JSON.parse(message.toString());
            setModbusData(prev => prev.map(reg => {
              const key = reg.name.toLowerCase();
              for (const pKey of Object.keys(payload)) {
                if (pKey.toLowerCase() === key || pKey.toLowerCase().includes(key) || key.includes(pKey.toLowerCase())) {
                  let val = parseFloat(payload[pKey]);
                  if (!isNaN(val)) {
                    return { ...reg, value: val };
                  }
                }
              }
              return reg;
            }));
          } catch (e) {
            const rawVal = parseFloat(message.toString());
            if (!isNaN(rawVal)) {
              setModbusData(prev => prev.map((reg, i) => i === 0 ? { ...reg, value: rawVal } : reg));
            }
          }
        });

        client.on('error', (err) => {
          setIotStatus('disconnected');
          toast.error(`MQTT Error: ${err.message}`);
        });

        client.on('close', () => {
          setIotStatus('disconnected');
        });

      } catch (err) {
        setIotStatus('disconnected');
        toast.error(`MQTT Connection failed: ${err.message}`);
      }
    } else {
      // Simulator Mode
      setIotStatus('connected');
      toast.success('Mode Simulasi aktif.');
    }
  };

  // Modbus TCP register polling loop (Tauri Rust client)
  useEffect(() => {
    if (iotStatus !== 'connected' || connectionType !== 'modbus') return;

    let active = true;
    const pollRegisters = async () => {
      const api = await getTauriApi();
      if (!api.invoke) return;

      while (active) {
        try {
          // Read holding registers 0-4
          const data = await api.invoke('modbus_read', {
            id: 'mandor_studio_plc',
            regType: 'HOLDING_REGISTER',
            address: 0,
            quantity: 5
          });

          if (Array.isArray(data) && data.length >= 5) {
            setModbusData(prev => prev.map((reg, i) => {
              let val = data[i];
              if (reg.register === 40002 || reg.register === 40003) {
                val = parseFloat((val / 10).toFixed(1)); // scale decimals
              }
              return { ...reg, value: val };
            }));

            setPressureHistory(prev => {
              const next = [...prev.slice(1)];
              next.push(parseFloat((data[2] / 10).toFixed(1)) || 0);
              return next;
            });
          }
        } catch (err) {
          console.warn('Modbus poll error:', err);
        }
        await new Promise(r => setTimeout(r, 500));
      }
    };

    pollRegisters();
    return () => {
      active = false;
    };
  }, [iotStatus, connectionType]);

  // Simulator mode register cycles removed because mock simulator is disabled



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
      
      // Load directly if ST/SCL
      if (file.name.endsWith('.scl') || file.name.endsWith('.st') || file.name.endsWith('.txt')) {
        setStCode(content);
        toast.success(`Program ${file.name} dimuat ke editor.`);
      } else {
        // Tag parsing from XML or other formats
        const newTags = parseCodeTags(content);
        if (newTags.length > 0) {
          setTagsList(newTags);
          toast.success(`Berhasil mengekstrak ${newTags.length} tag dari ${file.name}`);
        }
      }

      const newFile = {
        id: Date.now().toString(),
        name: file.name,
        content: content,
        timestamp: new Date().toISOString()
      };
      const newFiles = [...knowledgeFiles, newFile];
      setKnowledgeFiles(newFiles);
      try {
        localStorage.setItem('mandor_plc_knowledge_files', JSON.stringify(newFiles));
      } catch(err) {}
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleDeleteFile = (id) => {
    const newFiles = knowledgeFiles.filter(f => f.id !== id);
    setKnowledgeFiles(newFiles);
    localStorage.setItem('mandor_plc_knowledge_files', JSON.stringify(newFiles));
  };

  const loadCodeToEditor = (code) => {
    setStCode(code);
    setActiveTab('editor');
    toast.success("Kode berhasil dimuat ke Editor SCL.");
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      if (!aiConnector || !aiConnector.config?.apiKey) {
        throw new Error('AI Connector belum dikonfigurasi. Silakan setting AI di halaman Integrasi.');
      }

      const history = messages.slice(-10).map(m => ({ role: m.role, content: m.content }));
      
      let systemPromptWithContext = SYSTEM_PROMPT;
      systemPromptWithContext += `\n\n=== LOGIKA PLC AKTIF (SCL) ===\n\`\`\`scl\n${stCode}\n\`\`\``;
      
      if (knowledgeFiles.length > 0) {
        systemPromptWithContext += `\n\n=== KNOWLEDGE BASE FILES ===\n`;
        knowledgeFiles.forEach(f => {
          systemPromptWithContext += `\n[File: ${f.name}]\n\`\`\`\n${f.content}\n\`\`\`\n`;
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

  // runOcrSimulator and runCabinetVision removed because mock simulators are disabled

  // Helper to export CSV Tag List
  const handleExportTagsCsv = () => {
    let csvContent = "data:text/csv;charset=utf-8,Tag Name,Type,Address,Direction,Description\n";
    tagsList.forEach(t => {
      csvContent += `"${t.name}","${t.type}","${t.address}","${t.direction}","${t.description}"\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `PLC_IO_List_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Daftar I/O diexport sebagai CSV.");
  };

  return (
    <div style={{ display: 'flex', gap: '20px', height: 'calc(100vh - 120px)', minHeight: '650px', color: '#f8fafc', fontFamily: 'system-ui, sans-serif' }}>
      
      {/* ─── LEFT CONTROL STUDIO PANEL ──────────────────────────────── */}
      <div style={{ flex: '1.5', display: 'flex', flexDirection: 'column', gap: '16px', minWidth: '0' }}>
        
        {/* Connection Status & Module Header */}
        <div style={{ 
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '16px', padding: '12px 20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ padding: '8px', backgroundColor: 'rgba(59, 130, 246, 0.1)', borderRadius: '10px' }}>
              <Cpu size={24} color="#3b82f6" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>MANDOR Industrial Automation Studio</h2>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>AI Automation Engineer Companion</span>
            </div>
          </div>
          
          {/* Active Network status badges */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <span style={{ 
              display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.7rem', padding: '4px 10px', 
              borderRadius: '20px', backgroundColor: '#1e293b', border: '1px solid #334155' 
            }}>
              <Network size={12} color="#10b981" />
              OPC UA: Active
            </span>
            <span style={{ 
              display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.7rem', padding: '4px 10px', 
              borderRadius: '20px', backgroundColor: iotStatus === 'connected' ? 'rgba(16,185,129,0.1)' : '#1e293b', 
              border: iotStatus === 'connected' ? '1px solid #10b981' : '1px solid #334155',
              color: iotStatus === 'connected' ? '#10b981' : '#cbd5e1'
            }}>
              <Cable size={12} color={iotStatus === 'connected' ? '#10b981' : '#94a3b8'} />
              Modbus Bridge: {iotStatus.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Studio Navigation Pills */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {[
            { id: 'editor', title: 'SCL Code Editor', icon: FileText },
            { id: 'ocr', title: 'Ladder Vision OCR', icon: Eye },
            { id: 'iot', title: 'IoT & Modbus Monitor', icon: Database }
          ].map(tab => {
            const ActiveIcon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '10px 16px', borderRadius: '12px', border: '1px solid',
                  backgroundColor: isActive ? 'rgba(59,130,246,0.15)' : '#111827',
                  borderColor: isActive ? '#3b82f6' : '#1f2937',
                  color: isActive ? '#3b82f6' : '#94a3b8',
                  cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600,
                  transition: 'all 0.2s'
                }}
              >
                <ActiveIcon size={14} />
                {tab.title}
              </button>
            );
          })}
        </div>

        {/* Tab Contents Card */}
        <div style={{ 
          flex: 1, backgroundColor: '#111827', border: '1px solid #1f2937', 
          borderRadius: '16px', display: 'flex', flexDirection: 'column', overflow: 'hidden'
        }}>

          {/* TAB 1: SCL EDITOR */}
          {activeTab === 'editor' && (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '20px', gap: '16px', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>Structured Text / SCL Editor</h3>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>IEC 61131-3 Code Standard</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    onClick={() => setStCode(SCL_CYLINDER_PRESET)}
                    style={{ padding: '6px 12px', fontSize: '0.75rem', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', cursor: 'pointer', color: '#cbd5e1' }}
                  >
                    Load Cylinder Preset
                  </button>
                  <button 
                    onClick={() => setStCode(SCL_DOL_MOTOR_PRESET)}
                    style={{ padding: '6px 12px', fontSize: '0.75rem', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', cursor: 'pointer', color: '#cbd5e1' }}
                  >
                    Load Motor Preset
                  </button>
                  <button 
                    onClick={() => ocrFileInputRef.current?.click()}
                    disabled={ocrScanning}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', fontSize: '0.75rem', backgroundColor: '#3b82f6', border: 'none', borderRadius: '8px', cursor: ocrScanning ? 'not-allowed' : 'pointer', color: '#fff', fontWeight: 600 }}
                  >
                    <Eye size={14} />
                    {ocrScanning ? 'Converting...' : 'Convert Ladder (Upload)'}
                  </button>
                  <button 
                    onClick={handleExportTagsCsv}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', fontSize: '0.75rem', backgroundColor: '#10b981', border: 'none', borderRadius: '8px', cursor: 'pointer', color: '#fff', fontWeight: 600 }}
                  >
                    <FileSpreadsheet size={14} />
                    Export Tags
                  </button>
                </div>
              </div>

              {/* Code TextArea */}
              <div style={{ flex: '1.5', minHeight: '180px', display: 'flex', flexDirection: 'column', border: '1px solid #1f2937', borderRadius: '12px', overflow: 'hidden' }}>
                <div style={{ backgroundColor: '#0f172a', padding: '6px 16px', fontSize: '0.7rem', color: '#64748b', borderBottom: '1px solid #1f2937', display: 'flex', justifyBetween: 'center' }}>
                  <span>SCL EDITOR v1.2</span>
                </div>
                <textarea
                  value={stCode}
                  onChange={(e) => setStCode(e.target.value)}
                  style={{
                    flex: 1, backgroundColor: '#090d16', color: '#a7f3d0', fontFamily: 'monospace',
                    padding: '16px', fontSize: '0.85rem', border: 'none', outline: 'none', resize: 'none',
                    lineHeight: '1.5'
                  }}
                />
              </div>

              {/* Static Analysis Results */}
              <div style={{ flex: '1', display: 'flex', gap: '16px', minHeight: '150px' }}>
                {/* Compiler issues check */}
                <div style={{ flex: 1, border: '1px solid #1f2937', borderRadius: '12px', padding: '16px', backgroundColor: '#0f172a', overflowY: 'auto' }}>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '0.8rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ShieldAlert size={14} color="#f59e0b" />
                    AI Code Analyzer (Static Analysis)
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {compiledIssues.map((issue, idx) => {
                      const IssueIcon = issue.icon;
                      let borderCol = '#1f2937';
                      if (issue.type === 'danger') borderCol = '#ef4444';
                      if (issue.type === 'warning') borderCol = '#f59e0b';
                      if (issue.type === 'success') borderCol = '#10b981';
                      return (
                        <div key={idx} style={{ border: `1px solid ${borderCol}`, padding: '8px 12px', borderRadius: '8px', backgroundColor: '#111827' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 700, color: issue.type === 'danger' ? '#ef4444' : issue.type === 'warning' ? '#f59e0b' : '#10b981' }}>
                            <IssueIcon size={12} />
                            {issue.title}
                          </div>
                          <p style={{ margin: '4px 0 0 0', fontSize: '0.7rem', color: '#94a3b8', lineHeight: 1.4 }}>{issue.desc}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Auto Extracted Tag List */}
                <div style={{ flex: 1, border: '1px solid #1f2937', borderRadius: '12px', padding: '16px', backgroundColor: '#0f172a', overflowY: 'auto' }}>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '0.8rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Database size={14} color="#3b82f6" />
                    Auto Tag Extraction ({tagsList.length} Tags)
                  </h4>
                  <table style={{ width: '100%', fontSize: '0.7rem', textAlign: 'left', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #1f2937', color: '#64748b' }}>
                        <th style={{ padding: '4px' }}>Address</th>
                        <th style={{ padding: '4px' }}>Symbol</th>
                        <th style={{ padding: '4px' }}>Data Type</th>
                        <th style={{ padding: '4px' }}>Type</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tagsList.map((tag, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #111827' }}>
                          <td style={{ padding: '4px', fontFamily: 'monospace', color: '#3b82f6' }}>{tag.address}</td>
                          <td style={{ padding: '4px', fontWeight: 600, color: '#e2e8f0' }}>{tag.name}</td>
                          <td style={{ padding: '4px', color: '#10b981' }}>{tag.type}</td>
                          <td style={{ padding: '4px', color: '#94a3b8' }}>{tag.direction}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
               {/* TAB 2: PLC SIMULATOR & HMI REMOVED */}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: LADDER VISION OCR */}
          {activeTab === 'ocr' && (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '20px', gap: '16px', overflowY: 'auto' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>AI Ladder Diagram Vision (OCR & Code Translation)</h3>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Konversi diagram tangga fisik/screenshot menjadi kode Structured Text (SCL) standar industri.</span>
              </div>

              <div style={{ display: 'flex', gap: '16px', flex: '1', minHeight: '300px' }}>
                <div style={{ flex: '1.2', border: '1px solid #1f2937', borderRadius: '12px', padding: '16px', backgroundColor: '#0f172a', display: 'flex', flexDirection: 'column', justifyBetween: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '8px' }}>Upload File Diagram Ladder (Gambar/PDF):</span>

                  {/* Simulated Image Display Area */}
                  <div 
                    onClick={() => { if (!uploadedOcrFile && !ocrScanning) ocrFileInputRef.current?.click(); }}
                    style={{ 
                      flex: 1, border: '2px dashed #334155', borderRadius: '8px', position: 'relative', overflow: 'hidden',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#090d16', minHeight: '160px',
                      cursor: ocrScanning ? 'wait' : (uploadedOcrFile ? 'default' : 'pointer')
                    }}
                  >
                    {ocrScanning && (
                      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', backgroundColor: '#3b82f6', boxShadow: '0 0 10px #3b82f6', animation: 'scan 1.5s ease-in-out infinite alternate' }} />
                    )}
                    
                    {uploadedOcrFile ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '12px', width: '100%', height: '100%', boxSizing: 'border-box' }}>
                        {uploadedOcrFile.type.startsWith('image/') ? (
                          <img src={uploadedOcrFile.previewUrl} alt="Uploaded diagram" style={{ maxWidth: '100%', maxHeight: '110px', objectFit: 'contain', borderRadius: '4px' }} />
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                            <FileText size={36} color="#38bdf8" />
                            <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#e2e8f0', textAlign: 'center', wordBreak: 'break-all', maxWidth: '200px' }}>{uploadedOcrFile.name}</span>
                          </div>
                        )}
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setUploadedOcrFile(null);
                          }}
                          style={{ marginTop: '8px', fontSize: '0.65rem', padding: '2px 8px', backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444', color: '#ef4444', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          Remove File
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '20px' }}>
                        <Upload size={32} color="#3b82f6" />
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', textAlign: 'center' }}>
                          Upload file Gambar atau PDF Diagram Tangga Anda
                        </span>
                        <span style={{ fontSize: '0.65rem', color: '#64748b', textAlign: 'center' }}>
                          Format yang didukung: PNG, JPG, JPEG, PDF
                        </span>
                      </div>
                    )}
                  </div>

                  {/* input element moved to unconditional footer */}
                  <button
                    onClick={() => ocrFileInputRef.current?.click()}
                    disabled={ocrScanning}
                    style={{
                      marginTop: '12px', padding: '10px', fontSize: '0.8rem', fontWeight: 700, borderRadius: '8px', border: 'none',
                      backgroundColor: '#3b82f6', color: '#fff', cursor: ocrScanning ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {ocrScanning ? 'SCANNING DIAGRAM...' : 'UPLOAD & ANALYZE LADDER DIAGRAM (AI)'}
                  </button>
                </div>

                {/* OCR Results output */}
                <div style={{ flex: '1', border: '1px solid #1f2937', borderRadius: '12px', padding: '16px', backgroundColor: '#0f172a', display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto' }}>
                  <h4 style={{ margin: 0, fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8' }}>OCR Logic translation:</h4>
                  
                  {ocrResult ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', height: '100%' }}>
                      <div>
                        <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Detected Tags:</span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                          {ocrResult.detected.map((tag, idx) => (
                            <span key={idx} style={{ fontSize: '0.65rem', padding: '2px 6px', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '4px', color: '#cbd5e1' }}>{tag}</span>
                          ))}
                        </div>
                      </div>

                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '0.7rem', color: '#64748b', marginBottom: '4px' }}>Generated ST Code:</span>
                        <pre style={{ flex: 1, backgroundColor: '#090d16', color: '#a7f3d0', padding: '10px', borderRadius: '6px', fontSize: '0.7rem', fontFamily: 'monospace', overflowX: 'auto', border: '1px solid #1f2937' }}>
                          {ocrResult.stCode}
                        </pre>
                      </div>

                      <button
                        onClick={() => loadCodeToEditor(ocrResult.stCode)}
                        style={{ padding: '8px', fontSize: '0.75rem', fontWeight: 700, border: 'none', borderRadius: '6px', backgroundColor: '#10b981', color: '#fff', cursor: 'pointer' }}
                      >
                        Load Code to Active Editor
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, color: '#64748b' }}>
                      <Eye size={36} />
                      <span style={{ fontSize: '0.75rem', marginTop: '10px' }}>Upload & klik analisis untuk menerjemahkan diagram tangga.</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: IOT & MODBUS MONITOR */}
          {activeTab === 'iot' && (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '20px', gap: '16px', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>IoT Gateway & Live Modbus Register Map</h3>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Monitor register PLC Modbus TCP/RTU langsung di platform MES.</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <select
                    value={connectionType}
                    onChange={(e) => setConnectionType(e.target.value)}
                    disabled={iotStatus === 'connected' || iotStatus === 'connecting'}
                    style={{ backgroundColor: '#1e293b', border: '1px solid #334155', color: '#f8fafc', fontSize: '0.75rem', padding: '6px 12px', borderRadius: '8px' }}
                  >
                    <option value="modbus">Modbus TCP (Tauri Native)</option>
                    <option value="mqtt">MQTT Telemetry (WebSocket)</option>
                  </select>

                  <button
                    onClick={handleConnectRealTime}
                    disabled={iotStatus === 'connecting'}
                    style={{
                      padding: '8px 16px', fontSize: '0.75rem', fontWeight: 700, borderRadius: '8px', border: 'none',
                      backgroundColor: iotStatus === 'connected' ? '#ef4444' : (iotStatus === 'connecting' ? '#94a3b8' : '#10b981'), color: '#fff', cursor: 'pointer'
                    }}
                  >
                    {iotStatus === 'connected' ? 'DISCONNECT BRIDGE' : (iotStatus === 'connecting' ? 'CONNECTING...' : 'CONNECT REAL-TIME')}
                  </button>
                </div>
              </div>

              {/* Connection settings inputs */}
              {connectionType !== 'simulator' && (
                <div style={{
                  display: 'flex', gap: '12px', flexWrap: 'wrap', padding: '12px',
                  backgroundColor: '#0f172a', border: '1px solid #1f2937', borderRadius: '8px',
                  alignItems: 'flex-end'
                }}>
                  {connectionType === 'modbus' && (
                    <>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 600 }}>PLC IP ADDRESS</span>
                        <input
                          type="text"
                          value={plcIp}
                          onChange={(e) => setPlcIp(e.target.value)}
                          disabled={iotStatus === 'connected' || iotStatus === 'connecting'}
                          style={{
                            backgroundColor: '#1e293b', border: '1px solid #334155', color: '#f8fafc',
                            fontSize: '0.75rem', padding: '6px 10px', borderRadius: '6px', width: '120px'
                          }}
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 600 }}>PORT</span>
                        <input
                          type="text"
                          value={plcPort}
                          onChange={(e) => setPlcPort(e.target.value)}
                          disabled={iotStatus === 'connected' || iotStatus === 'connecting'}
                          style={{
                            backgroundColor: '#1e293b', border: '1px solid #334155', color: '#f8fafc',
                            fontSize: '0.75rem', padding: '6px 10px', borderRadius: '6px', width: '60px'
                          }}
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 600 }}>UNIT ID</span>
                        <input
                          type="text"
                          value={plcUnitId}
                          onChange={(e) => setPlcUnitId(e.target.value)}
                          disabled={iotStatus === 'connected' || iotStatus === 'connecting'}
                          style={{
                            backgroundColor: '#1e293b', border: '1px solid #334155', color: '#f8fafc',
                            fontSize: '0.75rem', padding: '6px 10px', borderRadius: '6px', width: '50px'
                          }}
                        />
                      </div>
                    </>
                  )}
                  {connectionType === 'mqtt' && (
                    <>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: '200px' }}>
                        <span style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 600 }}>MQTT BROKER WEBSOCKET URL</span>
                        <input
                          type="text"
                          value={mqttBroker}
                          onChange={(e) => setMqttBroker(e.target.value)}
                          disabled={iotStatus === 'connected' || iotStatus === 'connecting'}
                          style={{
                            backgroundColor: '#1e293b', border: '1px solid #334155', color: '#f8fafc',
                            fontSize: '0.75rem', padding: '6px 10px', borderRadius: '6px'
                          }}
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '180px' }}>
                        <span style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 600 }}>SUBSCRIBE TOPIC</span>
                        <input
                          type="text"
                          value={mqttTopic}
                          onChange={(e) => setMqttTopic(e.target.value)}
                          disabled={iotStatus === 'connected' || iotStatus === 'connecting'}
                          style={{
                            backgroundColor: '#1e293b', border: '1px solid #334155', color: '#f8fafc',
                            fontSize: '0.75rem', padding: '6px 10px', borderRadius: '6px'
                          }}
                        />
                      </div>
                    </>
                  )}
                </div>
              )}

              <div style={{ display: 'flex', gap: '16px', flex: '1', minHeight: '300px' }}>
                {/* Modbus registers table */}
                <div style={{ flex: '1.2', border: '1px solid #1f2937', borderRadius: '12px', padding: '16px', backgroundColor: '#0f172a', overflowY: 'auto' }}>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '0.8rem', color: '#94a3b8' }}>Active Register Map</h4>
                  <table style={{ width: '100%', fontSize: '0.75rem', textAlign: 'left', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #1f2937', color: '#64748b' }}>
                        <th style={{ padding: '6px' }}>Reg Address</th>
                        <th style={{ padding: '6px' }}>Tag Name</th>
                        <th style={{ padding: '6px' }}>Value</th>
                        <th style={{ padding: '6px' }}>Data Type</th>
                      </tr>
                    </thead>
                    <tbody>
                      {modbusData.map((reg, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #111827', backgroundColor: iotStatus === 'connected' ? 'transparent' : 'rgba(239, 68, 68, 0.02)' }}>
                          <td style={{ padding: '6px', fontFamily: 'monospace', color: '#fbbf24' }}>{reg.register}</td>
                          <td style={{ padding: '6px', fontWeight: 600 }}>{reg.name}</td>
                          <td style={{ padding: '6px', color: '#10b981', fontWeight: 700 }}>
                            {iotStatus === 'connected' ? reg.value : '---'}
                          </td>
                          <td style={{ padding: '6px', color: '#94a3b8' }}>{reg.type}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Live SVG Graph plotting Pressure */}
                <div style={{ flex: '1', border: '1px solid #1f2937', borderRadius: '12px', padding: '16px', backgroundColor: '#0f172a', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <h4 style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8' }}>Pressure Sensor Trend (Register 40003)</h4>
                  
                  {iotStatus === 'connected' ? (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <div style={{ flex: 1, position: 'relative' }}>
                        <svg viewBox="0 0 200 80" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                          {/* Grid lines */}
                          <line x1="0" y1="20" x2="200" y2="20" stroke="#1f2937" strokeWidth="0.5" />
                          <line x1="0" y1="40" x2="200" y2="40" stroke="#1f2937" strokeWidth="0.5" />
                          <line x1="0" y1="60" x2="200" y2="60" stroke="#1f2937" strokeWidth="0.5" />

                          {/* Pressure path */}
                          <path
                            d={`M ${pressureHistory.map((val, idx) => `${idx * 10.5}, ${80 - (val * 0.8)}`).join(' L ')}`}
                            fill="none"
                            stroke="#3b82f6"
                            strokeWidth="1.5"
                            style={{ transition: 'all 0.1s' }}
                          />
                        </svg>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: '#64748b', marginTop: '6px' }}>
                        <span>Last 10 seconds</span>
                        <span style={{ color: '#3b82f6', fontWeight: 700 }}>Cur: {modbusData[2].value} Bar</span>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, color: '#64748b' }}>
                      <Wifi size={32} />
                      <span style={{ fontSize: '0.75rem', marginTop: '10px' }}>Connect bridge to plot active register data.</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}



        </div>
      </div>

      {/* ─── RIGHT AI CHATBOT EXPERT AGENT PANEL ───────────────────── */}
      <div style={{ 
        flex: '1', display: 'flex', flexDirection: 'column', 
        backgroundColor: '#0f172a', border: '1px solid #1f2937', borderRadius: '16px', overflow: 'hidden'
      }}>
        
        {/* Chat Header */}
        <div style={{ 
          padding: '16px 20px', backgroundColor: '#111827', borderBottom: '1px solid #1f2937',
          display: 'flex', alignItems: 'center', justifyBetween: 'center'
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
              <h3 style={{ margin: 0, fontSize: '0.9rem', color: '#f8fafc', fontWeight: 700 }}>PLC AI Automation Agent</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: aiConnector ? '#10b981' : '#ef4444' }} />
                <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                  {aiConnector ? 'Connected to Gemini Agent' : 'Simulation Mode'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Messages */}
        <div 
          ref={scrollRef}
          style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}
        >
          {messages.map((msg, idx) => {
            const isUser = msg.role === 'user';
            return (
              <div key={idx} style={{ 
                display: 'flex', gap: '10px', alignSelf: isUser ? 'flex-end' : 'flex-start', maxWidth: '85%'
              }}>
                {!isUser && (
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Bot size={14} color="#10b981" />
                  </div>
                )}
                
                <div style={{ 
                  backgroundColor: isUser ? '#3b82f6' : msg.isError ? 'rgba(239,68,68,0.1)' : '#1e293b',
                  border: msg.isError ? '1px solid rgba(239,68,68,0.2)' : '1px solid transparent',
                  padding: '10px 14px', borderRadius: '12px',
                  borderTopRightRadius: isUser ? '2px' : '12px',
                  borderTopLeftRadius: !isUser ? '2px' : '12px',
                  color: isUser ? '#ffffff' : msg.isError ? '#ef4444' : '#cbd5e1',
                  fontSize: '0.85rem', lineHeight: '1.5'
                }}>
                  <div className="markdown-body" style={{ color: 'inherit' }}>
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                </div>
              </div>
            );
          })}
          
          {isLoading && (
            <div style={{ display: 'flex', gap: '10px', alignSelf: 'flex-start' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Bot size={14} color="#10b981" />
              </div>
              <div style={{ backgroundColor: '#1e293b', padding: '10px 14px', borderRadius: '12px', borderTopLeftRadius: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Loader2 size={14} color="#94a3b8" className="animate-spin" />
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Agent is working...</span>
              </div>
            </div>
          )}
        </div>

        {/* Chat Input & File Drawer */}
        <div style={{ padding: '14px', backgroundColor: '#111827', borderTop: '1px solid #1f2937' }}>
          
          {/* File drawer */}
          {knowledgeFiles.length > 0 && (
            <div style={{ padding: '6px 10px', backgroundColor: '#1e293b', borderRadius: '8px 8px 0 0', display: 'flex', gap: '6px', flexWrap: 'wrap', border: '1px solid #334155', borderBottom: 'none' }}>
              {knowledgeFiles.map(f => (
                <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '2px 6px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '6px', fontSize: '0.65rem', color: '#e2e8f0' }}>
                  <span style={{ maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={f.name}>{f.name}</span>
                  <button onClick={() => handleDeleteFile(f.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                    <X size={10} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div style={{ 
            display: 'flex', alignItems: 'flex-end', gap: '8px', backgroundColor: '#1e293b',
            borderRadius: knowledgeFiles.length > 0 ? '0 0 8px 8px' : '8px', border: '1px solid #334155', padding: '8px'
          }}>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Tanya detail kode SCL, kalkulasi safety PL, atau mintalah wiring diagram..."
              rows={1}
              style={{
                flex: 1, backgroundColor: 'transparent', border: 'none', color: '#f8fafc', fontSize: '0.85rem',
                outline: 'none', resize: 'none', maxHeight: '80px', paddingTop: '4px', fontFamily: 'inherit'
              }}
            />
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".txt,.awl,.st,.xml,.csv,.json,.scl,.l5x,.ap17,.gx3,.cxp" style={{ display: 'none' }} />
            <input type="file" ref={ocrFileInputRef} onChange={handleOcrVisionUpload} accept="image/*,application/pdf" style={{ display: 'none' }} />

            
            <button
              onClick={() => fileInputRef.current?.click()}
              title="Unggah File Proyek PLC (.scl, .st, .ap17, .gx3)"
              style={{
                width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'transparent', color: '#94a3b8',
                border: '1px solid #334155', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
            >
              <Paperclip size={14} />
            </button>

            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              style={{
                width: '32px', height: '32px', borderRadius: '8px',
                backgroundColor: (isLoading || !input.trim()) ? '#334155' : '#3b82f6',
                color: (isLoading || !input.trim()) ? '#64748b' : '#ffffff',
                border: 'none', cursor: (isLoading || !input.trim()) ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
            >
              <Send size={14} />
            </button>
          </div>
        </div>

      </div>

      {/* Embedded CSS Animations */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes scan {
          0% { top: 0%; }
          100% { top: 100%; }
        }
        @keyframes pulse {
          0% { opacity: 0.6; }
          50% { opacity: 1; }
          100% { opacity: 0.6; }
        }
      `}</style>
      
    </div>
  );
}

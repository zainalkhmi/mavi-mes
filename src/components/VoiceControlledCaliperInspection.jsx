import React, { useState, useEffect, useRef } from 'react';
import { 
  Volume2, Gamepad, Sliders, Mic, MicOff, AlertCircle, RefreshCw, Languages, Info, KeyRound, Bluetooth
} from 'lucide-react';

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
import toast from 'react-hot-toast';

const GAMEPAD_BUTTON_LABELS = {
  0: "Cross / A Button",
  1: "Circle / B Button",
  2: "Square / X Button",
  3: "Triangle / Y Button",
  4: "L1 / LB Shoulder",
  5: "R1 / RB Shoulder",
  6: "L2 / LT (Trigger Kiri)",
  7: "R2 / RT (Trigger Kanan)",
  8: "Share / Back",
  9: "Options / Start",
  10: "L3 (Left Stick Click)",
  11: "R3 (Right Stick Click)",
  12: "D-Pad Up",
  13: "D-Pad Down",
  14: "D-Pad Left",
  15: "D-Pad Right",
  16: "Home / PS Button"
};

const DEFAULT_BINDINGS = [
  { action: 'nextStep', btnIdx: 0 },    // Cross
  { action: 'prevStep', btnIdx: 2 },    // Square
  { action: 'toggleMic', btnIdx: 3 },   // Triangle
  { action: 'resetForm', btnIdx: 1 },   // Circle
  { action: 'passStatus', btnIdx: 6 },  // L2
  { action: 'failStatus', btnIdx: 7 },  // R2
  { action: 'focusNext', btnIdx: 5 },   // R1
  { action: 'focusPrev', btnIdx: 4 }    // L1
];

export default function VoiceControlledCaliperInspection() {
  // Config states
  const [bindings, setBindings] = useState(DEFAULT_BINDINGS);
  const [language, setLanguage] = useState('id-ID'); // id-ID, en-US
  
  // Gamepad states
  const [gamepadConnected, setGamepadConnected] = useState(false);
  const [gamepadName, setGamepadName] = useState('');
  const [activeButtonsState, setActiveButtonsState] = useState(Array(18).fill(false));
  const [lastPressedRawButton, setLastPressedRawButton] = useState(null);

  // Local mic test states
  const [isTestingMic, setIsTestingMic] = useState(false);
  const [testTranscript, setTestTranscript] = useState('');
  
  const recognitionRef = useRef(null);

  const handleOpenPairingWizard = async () => {
    const api = await getTauriApi();
    if (api.invoke) {
      try {
        await api.invoke('open_device_pairing_wizard');
        toast.success('Membuka Wizard Bluetooth / Pairing Stick...');
      } catch (err) {
        toast.error('Gagal membuka wizard pairing: ' + err.message);
      }
    } else {
      toast.error(
        'Koneksi stick via wizard membutuhkan aplikasi desktop Tauri. Silakan hubungkan stick via Bluetooth Settings di sistem Anda.',
        { duration: 6000 }
      );
    }
  };

  // Load configs on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('mavi_gamepad_bindings');
      if (saved) {
        setBindings(JSON.parse(saved));
      }
    } catch(e) {}

    const savedLang = localStorage.getItem('mavi_voice_language') || 'id-ID';
    setLanguage(savedLang);
  }, []);

  // Poll controller status for button tests and SVG lighting
  useEffect(() => {
    let animationFrameId = null;

    const handleConnect = (e) => {
      setGamepadConnected(true);
      setGamepadName(e.gamepad.id);
      toast.success(`Joystick terdeteksi: ${e.gamepad.id.split('(')[0]}`);
    };

    const handleDisconnect = () => {
      setGamepadConnected(false);
      setGamepadName('');
      setLastPressedRawButton(null);
      setActiveButtonsState(Array(18).fill(false));
      toast.error('Joystick diputus.');
    };

    window.addEventListener("gamepadconnected", handleConnect);
    window.addEventListener("gamepaddisconnected", handleDisconnect);

    const checkGamepad = () => {
      const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
      const gp = gamepads[0] || gamepads.find(g => g !== null);

      if (gp) {
        if (!gamepadConnected) {
          setGamepadConnected(true);
          setGamepadName(gp.id);
        }

        // Map active presses
        const states = gp.buttons.map((btn, idx) => {
          if (btn.pressed) {
            setLastPressedRawButton(idx);
            return true;
          }
          return false;
        });
        setActiveButtonsState(states);
      }
      animationFrameId = requestAnimationFrame(checkGamepad);
    };

    checkGamepad();

    return () => {
      window.removeEventListener("gamepadconnected", handleConnect);
      window.removeEventListener("gamepaddisconnected", handleDisconnect);
      cancelAnimationFrame(animationFrameId);
    };
  }, [gamepadConnected]);

  // Local Microphone tester
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = false;
    rec.lang = language;

    rec.onresult = (event) => {
      const text = event.results[event.results.length - 1][0].transcript;
      setTestTranscript(text);
    };

    rec.onend = () => {
      if (isTestingMic) {
        try { rec.start(); } catch(e) {}
      }
    };

    recognitionRef.current = rec;

    if (isTestingMic) {
      try { rec.start(); } catch(e) {}
    } else {
      try { rec.stop(); } catch(e) {}
    }

    return () => {
      try { rec.stop(); } catch(e) {}
    };
  }, [isTestingMic, language]);

  const updateMapping = (action, val) => {
    const newBtnIdx = parseInt(val);
    
    // Temukan tombol lama untuk aksi yang sedang diubah
    const currentBinding = bindings.find(b => b.action === action);
    const oldBtnIdx = currentBinding ? currentBinding.btnIdx : null;

    const updated = bindings.map(b => {
      if (b.action === action) {
        return { ...b, btnIdx: newBtnIdx };
      } else if (b.btnIdx === newBtnIdx && oldBtnIdx !== null) {
        // Tukar tombol jika ada konflik (1 tombol 1 aksi)
        return { ...b, btnIdx: oldBtnIdx };
      }
      return b;
    });

    setBindings(updated);
    localStorage.setItem('mavi_gamepad_bindings', JSON.stringify(updated));
    toast.success('Tombol dikonfigurasi (tombol konflik otomatis ditukar)!');
  };

  const updateLanguage = (langVal) => {
    setLanguage(langVal);
    localStorage.setItem('mavi_voice_language', langVal);
    toast.success(`Bahasa diubah ke: ${langVal === 'id-ID' ? 'Bahasa Indonesia' : 'English'}`);
  };

  const handleResetToDefault = () => {
    setBindings(DEFAULT_BINDINGS);
    localStorage.setItem('mavi_gamepad_bindings', JSON.stringify(DEFAULT_BINDINGS));
    toast.success('Konfigurasi stick dikembalikan ke setelan pabrik.');
  };

  // Render vector controller where buttons light up on press state
  const renderGamepadSVG = () => {
    const isPressed = (idx) => activeButtonsState[idx] || false;

    return (
      <div style={styles.svgContainer}>
        <svg viewBox="0 0 600 330" style={{ width: '100%', height: 'auto', maxHeight: '240px' }}>
          
          {/* L2 (Trigger Kiri - Button 6) */}
          <path d="M 120 30 C 140 28 170 34 180 50 L 165 80 Q 140 70 120 74 Z" 
            fill={isPressed(6) ? "#10b981" : "#1e293b"} stroke="#475569" strokeWidth="2" />
          <text x="100" y="25" fill={isPressed(6) ? "#10b981" : "#94a3b8"} fontSize="12" fontWeight="bold">L2</text>
          
          {/* R2 (Trigger Kanan - Button 7) */}
          <path d="M 480 30 C 460 28 430 34 420 50 L 435 80 Q 460 70 480 74 Z" 
            fill={isPressed(7) ? "#10b981" : "#1e293b"} stroke="#475569" strokeWidth="2" />
          <text x="490" y="25" fill={isPressed(7) ? "#10b981" : "#94a3b8"} fontSize="12" fontWeight="bold">R2</text>

          {/* L1 (Shoulder Kiri - Button 4) */}
          <path d="M 110 80 Q 150 72 200 84 L 195 102 Q 150 90 115 96 Z" 
            fill={isPressed(4) ? "#10b981" : "#334155"} stroke="#475569" strokeWidth="1.5" />
          <text x="85" y="90" fill={isPressed(4) ? "#10b981" : "#cbd5e1"} fontSize="12" fontWeight="bold">L1</text>

          {/* R1 (Shoulder Kanan - Button 5) */}
          <path d="M 490 80 Q 450 72 400 84 L 405 102 Q 450 90 485 96 Z" 
            fill={isPressed(5) ? "#10b981" : "#334155"} stroke="#475569" strokeWidth="1.5" />
          <text x="500" y="90" fill={isPressed(5) ? "#10b981" : "#cbd5e1"} fontSize="12" fontWeight="bold">R1</text>

          {/* Controller Body Shell */}
          <path d="M 160 102 C 200 100 400 100 440 102 C 510 102 570 140 560 250 C 550 300 500 320 440 290 L 390 250 L 210 250 L 160 290 C 100 320 50 300 40 250 C 30 140 90 102 160 102 Z" 
            fill="#0f172a" stroke="#334155" strokeWidth="4" />

          {/* Touchpad (Button 17 / click) */}
          <rect x="220" y="106" width="160" height="75" rx="6" 
            fill={isPressed(17) ? "rgba(16,185,129,0.2)" : "#1e293b"} stroke="#475569" strokeWidth="2" />
          <text x="278" y="148" fill="#475569" fontSize="10" fontWeight="bold">TOUCHPAD</text>

          {/* Share Button (Button 8) */}
          <rect x="195" y="130" width="8" height="20" rx="2" transform="rotate(-15 195 130)" 
            fill={isPressed(8) ? "#10b981" : "#334155"} />
          
          {/* Options Button (Button 9) */}
          <rect x="395" y="130" width="8" height="20" rx="2" transform="rotate(15 395 130)" 
            fill={isPressed(9) ? "#10b981" : "#334155"} />

          {/* D-PAD BACKGROUND CROSS */}
          <rect x="106" y="145" width="22" height="60" rx="4" fill="#1e293b" />
          <rect x="87" y="164" width="60" height="22" rx="4" fill="#1e293b" />

          {/* D-Pad Up (Button 12) */}
          <path d="M 108 147 L 126 147 L 126 163 L 108 163 Z" 
            fill={isPressed(12) ? "#10b981" : "#475569"} rx="2" />
          
          {/* D-Pad Down (Button 13) */}
          <path d="M 108 187 L 126 187 L 126 203 L 108 203 Z" 
            fill={isPressed(13) ? "#10b981" : "#475569"} rx="2" />

          {/* D-Pad Left (Button 14) */}
          <path d="M 89 166 L 105 166 L 105 184 L 89 184 Z" 
            fill={isPressed(14) ? "#10b981" : "#475569"} rx="2" />

          {/* D-Pad Right (Button 15) */}
          <path d="M 129 166 L 145 166 L 145 184 L 129 184 Z" 
            fill={isPressed(15) ? "#10b981" : "#475569"} rx="2" />

          {/* Action Face Buttons Area (Triangle, Circle, Cross, Square) */}
          <circle cx="480" cy="175" r="45" fill="#1e293b" />

          {/* Triangle (Button 3) */}
          <circle cx="480" cy="144" r="12" fill={isPressed(3) ? "#10b981" : "#0f172a"} stroke="#475569" />
          <text x="476" y="148" fill="#ffffff" fontSize="11" fontWeight="bold">△</text>

          {/* Circle (Button 1) */}
          <circle cx="511" cy="175" r="12" fill={isPressed(1) ? "#10b981" : "#0f172a"} stroke="#475569" />
          <text x="507" y="179" fill="#ffffff" fontSize="11" fontWeight="bold">◯</text>

          {/* Cross (Button 0) */}
          <circle cx="480" cy="206" r="12" fill={isPressed(0) ? "#10b981" : "#0f172a"} stroke="#475569" />
          <text x="476" y="210" fill="#ffffff" fontSize="11" fontWeight="bold">✕</text>

          {/* Square (Button 2) */}
          <circle cx="449" cy="175" r="12" fill={isPressed(2) ? "#10b981" : "#0f172a"} stroke="#475569" />
          <text x="445" y="179" fill="#ffffff" fontSize="11" fontWeight="bold">▢</text>

          {/* Left Stick (L3 - Button 10) */}
          <circle cx="230" cy="225" r="34" fill="#1e293b" stroke="#334155" strokeWidth="2" />
          <circle cx="230" cy="225" r="24" fill={isPressed(10) ? "#10b981" : "#0f172a"} />
          <text x="222" y="229" fill="#475569" fontSize="10" fontWeight="bold">L3</text>

          {/* Right Stick (R3 - Button 11) */}
          <circle cx="370" cy="225" r="34" fill="#1e293b" stroke="#334155" strokeWidth="2" />
          <circle cx="370" cy="225" r="24" fill={isPressed(11) ? "#10b981" : "#0f172a"} />
          <text x="362" y="229" fill="#475569" fontSize="10" fontWeight="bold">R3</text>

          {/* Home / PS Button (Button 16) */}
          <circle cx="300" cy="235" r="18" fill={isPressed(16) ? "#10b981" : "#334155"} stroke="#475569" strokeWidth="2" />
          <text x="293" y="239" fill="#ffffff" fontSize="11" fontWeight="bold">PS</text>

        </svg>
      </div>
    );
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerInfo}>
            <div style={styles.iconContainer}>
              <Sliders size={22} color="#3b82f6" />
            </div>
            <div>
              <h2 style={styles.title}>Voice & Gamepad Control Panel</h2>
              <p style={styles.subtitle}>Konfigurasi Aksesibilitas Sistem Hands-Free</p>
            </div>
          </div>
        </div>

        {/* Informative instructions banner */}
        <div style={styles.bannerInfo}>
          <Info size={16} color="#60a5fa" style={{ flexShrink: 0, marginTop: '2px' }} />
          <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8', lineHeight: '1.4' }}>
            Halaman ini digunakan untuk mengonfigurasi mikrofon global dan stick controller. Setelah dikonfigurasi, Anda dapat <b>mengklik kolom input di halaman mana saja</b> dan berbicara, atau menekan tombol stick untuk mengisi form dan memindahkan layar.
          </p>
        </div>

        {/* SETTINGS SECTION GRID */}
        <div style={styles.settingsGrid}>
          
          {/* SECTION A: VOICE DICTATION CONFIG */}
          <div style={styles.sectionCard}>
            <h3 style={styles.sectionTitle}><Mic size={16} color="#3b82f6" style={{ marginRight: '8px' }} /> Pengaturan Asisten Suara</h3>
            
            <div style={styles.formRow}>
              <label style={styles.fieldLabel}><Languages size={14} style={{ marginRight: '6px' }} /> Bahasa Pendiktean</label>
              <select 
                value={language} 
                onChange={(e) => updateLanguage(e.target.value)}
                style={styles.selectInput}
              >
                <option value="id-ID">Bahasa Indonesia (id-ID)</option>
                <option value="en-US">English (en-US)</option>
              </select>
            </div>

            {/* Mic Live Tester */}
            <div style={styles.micTestPanel}>
              <div style={styles.micTestHeader}>
                <span style={styles.testLabel}>Tes Mikrofon Lokal</span>
                <button 
                  onClick={() => {
                    setIsTestingMic(!isTestingMic);
                    setTestTranscript('');
                  }}
                  style={{
                    ...styles.micTestBtn,
                    backgroundColor: isTestingMic ? '#ef4444' : '#1e293b'
                  }}
                >
                  {isTestingMic ? <MicOff size={12} /> : <Mic size={12} />}
                  {isTestingMic ? 'Stop Tes' : 'Mulai Tes'}
                </button>
              </div>

              <div style={styles.testConsole}>
                {isTestingMic ? (
                  <p style={{ margin: 0, color: '#f1f5f9', fontStyle: 'normal' }}>
                    {testTranscript || 'Silakan bicara ke mikrofon...'}
                  </p>
                ) : (
                  <p style={{ margin: 0, color: '#475569', fontStyle: 'italic' }}>
                    Klik 'Mulai Tes' untuk mencoba input suara Anda.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* SECTION B: GAMEPAD CONTROLLER CONFIG & VISUAL TESTER */}
          <div style={styles.sectionCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h3 style={styles.sectionTitle}><Gamepad size={16} color="#10b981" style={{ marginRight: '8px' }} /> Pengaturan Stick Joystick</h3>
              <span style={{
                ...styles.statusBadge,
                backgroundColor: gamepadConnected ? 'rgba(16, 185, 129, 0.15)' : 'rgba(148, 163, 184, 0.1)',
                color: gamepadConnected ? '#34d399' : '#64748b'
              }}>
                {gamepadConnected ? 'Terhubung' : 'Terputus'}
              </span>
            </div>

            {gamepadConnected ? (
              <div style={styles.gamepadInfo}>
                <span style={{ fontSize: '0.75rem', color: '#cbd5e1', fontWeight: 600 }}>{gamepadName.split('(')[0]}</span>
              </div>
            ) : (
              <div style={styles.warningBanner}>
                <AlertCircle size={14} color="#fbbf24" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: '0.7rem', color: '#fbbf24' }}>
                  Hubungkan Controller stick PS4/Xbox via USB atau Bluetooth untuk menguji tombol.
                </span>
              </div>
            )}

            {/* Bluetooth Pairing Button */}
            <button 
              onClick={handleOpenPairingWizard}
              style={styles.connectStickBtn}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.25)';
                e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.5)';
                e.currentTarget.style.boxShadow = '0 0 16px rgba(59, 130, 246, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.15)';
                e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.3)';
                e.currentTarget.style.boxShadow = '0 0 12px rgba(59, 130, 246, 0.15)';
              }}
            >
              <Bluetooth size={14} style={{ marginRight: '6px' }} />
              Hubungkan Stick Baru (Bluetooth)
            </button>

            {/* Render Interactive Vector Gamepad Illustration */}
            {gamepadConnected && renderGamepadSVG()}

            {/* Raw Button Press Test Panel */}
            {gamepadConnected && (
              <div style={styles.rawKeyTester}>
                <span style={styles.testLabel}>Tombol Ditekan:</span>
                <span style={styles.rawPressedVal}>
                  {lastPressedRawButton !== null 
                    ? GAMEPAD_BUTTON_LABELS[lastPressedRawButton] || `Tombol Index ${lastPressedRawButton}`
                    : 'Tekan tombol pada stick untuk mencoba...'}
                </span>
              </div>
            )}

            {/* Mapping Config Grid */}
            <div style={styles.mappingList}>
              <div style={styles.mappingHeader}>
                <span>Aksi Sistem</span>
                <span>Pemicu Tombol Stick</span>
              </div>

              {bindings.map(({ action, btnIdx }) => (
                <div key={action} style={styles.mappingRow}>
                  <span style={styles.actionName}>
                    <KeyRound size={12} style={{ marginRight: '6px', opacity: 0.7 }} />
                    {
                      action === 'nextStep' ? 'Halaman Selanjutnya' :
                      action === 'prevStep' ? 'Halaman Sebelumnya' :
                      action === 'toggleMic' ? 'Aktifkan/Matikan Mic' :
                      action === 'resetForm' ? 'Kosongkan Input Aktif' :
                      action === 'passStatus' ? 'Set Dropdown ke PASS' :
                      action === 'failStatus' ? 'Set Dropdown ke FAIL' :
                      action === 'focusNext' ? 'Pindah Fokus Depan' :
                      'Pindah Fokus Belakang'
                    }
                  </span>
                  <select
                    value={btnIdx}
                    onChange={(e) => updateMapping(action, e.target.value)}
                    style={styles.mappingSelect}
                  >
                    {Object.entries(GAMEPAD_BUTTON_LABELS).map(([idx, label]) => (
                      <option key={idx} value={idx}>{label}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            {/* Reset to Default */}
            <button 
              onClick={handleResetToDefault}
              style={{
                ...styles.resetBtn,
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)';
                e.currentTarget.style.color = '#cbd5e1';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.02)';
                e.currentTarget.style.color = '#94a3b8';
              }}
            >
              <RefreshCw size={12} /> Setel Ulang ke Pengaturan Pabrik
            </button>

          </div>

        </div>

      </div>
    </div>
  );
}

// ─── STYLES ────────────────────────────────────────────────────────
const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    padding: '20px',
    boxSizing: 'border-box',
  },
  card: {
    width: '100%',
    maxWidth: '820px',
    background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.92), rgba(8, 12, 24, 0.96))',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '24px',
    padding: '28px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
    color: '#f8fafc',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    boxSizing: 'border-box',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
    paddingBottom: '16px',
    marginBottom: '20px',
  },
  headerInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  iconContainer: {
    padding: '10px',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    border: '1px solid rgba(59, 130, 246, 0.15)',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    margin: 0,
    fontSize: '1.05rem',
    fontWeight: 800,
    color: '#ffffff',
  },
  subtitle: {
    margin: '2px 0 0 0',
    fontSize: '0.75rem',
    color: '#94a3b8',
  },
  bannerInfo: {
    display: 'flex',
    gap: '10px',
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
    border: '1px solid rgba(59, 130, 246, 0.12)',
    borderRadius: '14px',
    padding: '14px 16px',
    marginBottom: '24px',
  },
  settingsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
    gap: '24px',
  },
  sectionCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    border: '1px solid rgba(255, 255, 255, 0.04)',
    borderRadius: '18px',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    boxSizing: 'border-box',
  },
  sectionTitle: {
    margin: 0,
    fontSize: '0.9rem',
    fontWeight: 800,
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
  },
  statusBadge: {
    fontSize: '0.65rem',
    fontWeight: 800,
    padding: '4px 10px',
    borderRadius: '12px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  formRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  fieldLabel: {
    fontSize: '0.75rem',
    color: '#cbd5e1',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
  },
  selectInput: {
    backgroundColor: '#0f172a',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '10px',
    padding: '10px 12px',
    color: '#ffffff',
    fontSize: '0.8rem',
    outline: 'none',
    cursor: 'pointer',
  },
  micTestPanel: {
    borderTop: '1px solid rgba(255, 255, 255, 0.05)',
    paddingTop: '14px',
    marginTop: '6px',
  },
  micTestHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
  },
  testLabel: {
    fontSize: '0.7rem',
    fontWeight: 700,
    color: '#64748b',
    textTransform: 'uppercase',
  },
  micTestBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    border: 'none',
    color: 'white',
    fontSize: '0.7rem',
    fontWeight: 600,
    padding: '6px 12px',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  testConsole: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: '10px',
    padding: '12px 14px',
    minHeight: '60px',
    fontSize: '0.8rem',
    border: '1px solid rgba(255, 255, 255, 0.03)',
  },
  warningBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: 'rgba(251, 191, 36, 0.08)',
    border: '1px solid rgba(251, 191, 36, 0.15)',
    borderRadius: '10px',
    padding: '8px 12px',
  },
  gamepadInfo: {
    backgroundColor: 'rgba(16, 185, 129, 0.06)',
    border: '1px solid rgba(16, 185, 129, 0.15)',
    borderRadius: '10px',
    padding: '10px 12px',
  },
  svgContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    border: '1px solid rgba(255, 255, 255, 0.04)',
    borderRadius: '14px',
    padding: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rawKeyTester: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: '10px',
    padding: '10px 14px',
    border: '1px solid rgba(255, 255, 255, 0.04)',
  },
  rawPressedVal: {
    fontSize: '0.75rem',
    fontWeight: 700,
    color: '#10b981',
  },
  mappingList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  mappingHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.65rem',
    fontWeight: 800,
    color: '#64748b',
    textTransform: 'uppercase',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
    paddingBottom: '6px',
  },
  mappingRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '6px 0',
    borderBottom: '1px solid rgba(255, 255, 255, 0.02)',
  },
  actionName: {
    fontSize: '0.75rem',
    color: '#cbd5e1',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
  },
  mappingSelect: {
    backgroundColor: '#0a0f1d',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '8px',
    color: '#ffffff',
    fontSize: '0.75rem',
    padding: '6px 10px',
    outline: 'none',
    cursor: 'pointer',
    minWidth: '150px',
  },
  resetBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    borderRadius: '12px',
    color: '#94a3b8',
    fontSize: '0.75rem',
    fontWeight: 600,
    padding: '10px 14px',
    marginTop: '10px',
    transition: 'all 0.2s',
  },
  connectStickBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    width: '100%',
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    border: '1px solid rgba(59, 130, 246, 0.3)',
    borderRadius: '12px',
    color: '#60a5fa',
    fontSize: '0.75rem',
    fontWeight: 700,
    padding: '10px 14px',
    cursor: 'pointer',
    transition: 'all 0.25s ease',
    boxShadow: '0 0 12px rgba(59, 130, 246, 0.15)',
    boxSizing: 'border-box',
    outline: 'none',
  }
};

import React, { useState, useEffect, useRef } from 'react';
import {
  Camera, Scan, QrCode, X, Check, Lock, User, Key, ArrowRight,
  LogOut, ShieldAlert, Sparkles, ExternalLink, Zap, Flashlight,
  FlipHorizontal, Search, RefreshCw, Layers, CheckCircle2, HelpCircle
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { getAllUsers, login as localLogin } from '../utils/auth';
import { useGlobalStore } from '../store/useGlobalStore';

// ─── AUDIO SYNTHESIZER FOR DOZUKI HAPTIC & CHIME ──────────────────
const playDozukiSound = (type = 'tap') => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    if (type === 'tap' || type === 'click') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1400, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(700, ctx.currentTime + 0.03);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.035);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.035);
    } else if (type === 'scan' || type === 'success') {
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      osc1.type = 'sine';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(1046.5, ctx.currentTime);
      osc2.frequency.setValueAtTime(1318.5, ctx.currentTime);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);
      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 0.15);
      osc2.stop(ctx.currentTime + 0.15);
    }
  } catch (e) {
    // ignore
  }
};

// ─── HAPTIC FEEDBACK ──────────────────────────────────────────────
const triggerHaptic = (pattern = 20) => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(pattern);
  }
};

export default function DozukiMobileCheckSheet({
  onClose,
  initialStation = 'ST-CNC-01',
  defaultLoggedIn = false,
  onOpenMobileCheckSheet
}) {
  const navigate = useNavigate();
  const setUser = useGlobalStore((state) => state.setUser);
  const globalUser = useGlobalStore((state) => state.user);

  // ─── AUTHENTICATION STATE (ROLE-BASED MANDOR LOGIN) ───────────────
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    try {
      return defaultLoggedIn || !!globalUser || localStorage.getItem('dozuki_logged_in') === 'true';
    } catch {
      return defaultLoggedIn;
    }
  });
  const [username, setUsername] = useState(() => globalUser?.username || localStorage.getItem('mandor_username') || 'operator');
  const [password, setPassword] = useState('123');
  const [userRole, setUserRole] = useState(() => globalUser?.role || localStorage.getItem('mandor_user_role') || 'STATION_OPERATOR');
  const [operatorName, setOperatorName] = useState(() => globalUser?.name || localStorage.getItem('mandor_operator_name') || 'Station Operator');
  const [stationId, setStationId] = useState(() => globalUser?.assignedStation && globalUser.assignedStation !== 'NONE' && globalUser.assignedStation !== 'ALL' ? globalUser.assignedStation : initialStation);

  // ─── SCANNER STATE (CLEAN SCANNER BUTTON & REDIRECT) ───────────────
  const [isScannerModalOpen, setIsScannerModalOpen] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' | 'user'
  const [manualInput, setManualInput] = useState('');
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [scannedTargetUrl, setScannedTargetUrl] = useState('');
  const html5QrCodeRef = useRef(null);

  // ─── ROLE-BASED LOGIN HANDLER (APP CREDENTIALS VALIDATION) ─────────
  const handleLogin = (e, explicitUser = null, explicitPass = null) => {
    if (e) e.preventDefault();
    triggerHaptic(30);
    playDozukiSound('click');

    const inputUser = (explicitUser || username).trim();
    const inputPass = explicitPass !== null ? explicitPass : password;

    if (!inputUser) {
      toast.error('Silakan isi Username');
      return;
    }

    // 1. Query registered users from app database (src/utils/auth.js)
    const allUsers = getAllUsers();
    const foundUser = allUsers.find(
      u => u.username.toLowerCase() === inputUser.toLowerCase() ||
           (u.email && u.email.toLowerCase() === inputUser.toLowerCase())
    );

    if (!foundUser) {
      toast.error(`User "${inputUser}" tidak terdaftar di sistem! Pilih role terdaftar di bawah.`, { duration: 4000 });
      return;
    }

    // 2. Validate Password (supports user password or standard '123' PIN)
    if (inputPass && foundUser.password && inputPass !== foundUser.password && inputPass !== '123') {
      toast.error('Password / PIN tidak valid!');
      return;
    }

    const opName = foundUser.name || foundUser.username;
    const role = foundUser.role || 'STATION_OPERATOR';
    const stId = foundUser.assignedStation && foundUser.assignedStation !== 'NONE' && foundUser.assignedStation !== 'ALL'
      ? foundUser.assignedStation
      : (stationId || 'ST-CNC-01');

    setOperatorName(opName);
    setUserRole(role);
    setStationId(stId);
    setUsername(foundUser.username);
    setIsLoggedIn(true);

    const sessionUser = {
      id: foundUser.id || `usr-${Date.now()}`,
      username: foundUser.username,
      name: opName,
      email: foundUser.email || `${foundUser.username}@mavi.io`,
      role: role,
      assignedStation: stId,
      assignedApp: foundUser.assignedApp || 'ALL'
    };

    try {
      localStorage.setItem('mandor_mes_auth_session', JSON.stringify(sessionUser));
      localStorage.setItem('dozuki_logged_in', 'true');
      localStorage.setItem('mandor_username', foundUser.username);
      localStorage.setItem('mandor_operator_name', opName);
      localStorage.setItem('mandor_user_role', role);
    } catch {}

    if (setUser) {
      setUser(sessionUser);
    }

    playDozukiSound('success');
    toast.success(`Selamat datang, ${opName}! [${role.replace(/_/g, ' ')}] 🚀`);
  };

  const handleLogout = () => {
    triggerHaptic(20);
    playDozukiSound('tap');
    setIsLoggedIn(false);
    try {
      localStorage.removeItem('dozuki_logged_in');
    } catch {}
    toast('Logout berhasil', { icon: '👋' });
  };

  // ─── CAMERA SCANNER CONTROLLER (Html5Qrcode) ───────────────────────
  useEffect(() => {
    if (isScannerModalOpen) {
      startScanner();
    } else {
      stopScanner();
    }
    return () => {
      stopScanner();
    };
  }, [isScannerModalOpen, facingMode]);

  const startScanner = async () => {
    try {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        await html5QrCodeRef.current.stop();
      }

      const qrScanner = new Html5Qrcode('dozuki-fullscreen-scanner');
      html5QrCodeRef.current = qrScanner;

      const config = {
        fps: 24,
        qrbox: (viewfinderWidth, viewfinderHeight) => {
          const minEdge = Math.min(viewfinderWidth || 300, viewfinderHeight || 400);
          const edge = Math.min(260, Math.floor(minEdge * 0.75));
          return { width: edge, height: edge };
        }
      };

      await qrScanner.start(
        { facingMode: facingMode },
        config,
        (decodedText) => {
          handleScanSuccess(decodedText);
        },
        () => {
          // ignore per-frame failures
        }
      );
    } catch (err) {
      console.warn('Camera scanner init error:', err);
    }
  };

  const stopScanner = async () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      } catch (e) {
        console.warn('Stop scanner error:', e);
      }
    }
  };

  const toggleTorch = async () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      try {
        const next = !isTorchOn;
        await html5QrCodeRef.current.applyVideoConstraints({
          advanced: [{ torch: next }]
        });
        setIsTorchOn(next);
      } catch {
        toast('Flashlight tidak didukung pada perangkat ini', { icon: '🔦' });
      }
    }
  };

  // ─── SCAN SUCCESS & AUTO-REDIRECT TO MOBILE CHECKSHEET ────────────
  const handleScanSuccess = (code) => {
    if (isRedirecting) return;
    setIsRedirecting(true);
    triggerHaptic([40, 60, 40]);
    playDozukiSound('scan');
    stopScanner();

    let targetLink = '/drawing-checksheet';

    // 1. Direct external / internal full URL
    if (code.startsWith('http://') || code.startsWith('https://')) {
      const glue = code.includes('?') ? '&' : '?';
      const fullUrl = `${code}${glue}mobile=true&mode=mobile`;
      toast.success(`Membuka Checksheet Mobile: ${code} 🚀`);
      setTimeout(() => {
        window.location.href = fullUrl;
      }, 600);
      return;
    } else if (code.startsWith('#/')) {
      targetLink = code.replace('#', '');
    } else if (code.startsWith('/')) {
      targetLink = code;
    } else {
      // 2. Work Order / Part Code
      const cleanCode = encodeURIComponent(code.trim());
      targetLink = `/drawing-checksheet?wo=${cleanCode}&station=${stationId}&operator=${encodeURIComponent(operatorName)}`;
    }

    // Always append mobile=true & mode=mobile so it opens MobileTabletCheckSheet view
    const glue = targetLink.includes('?') ? '&' : '?';
    if (!targetLink.includes('mobile=true') && !targetLink.includes('mode=mobile')) {
      targetLink = `${targetLink}${glue}mobile=true&mode=mobile`;
    }

    setScannedTargetUrl(targetLink);
    toast.success(`Checksheet Siap! Mengarahkan ke Versi Mobile... 📱`, { duration: 2500 });

    setTimeout(() => {
      setIsScannerModalOpen(false);
      setIsRedirecting(false);
      if (onOpenMobileCheckSheet) {
        onOpenMobileCheckSheet();
      }
      if (onClose) onClose();
      navigate(targetLink);
    }, 700);
  };

  return (
    <div
      id="dozuki-root-container"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: '#000000',
        zIndex: 999999,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        userSelect: 'none',
        overflow: 'hidden'
      }}
    >
      <style>{`
        #dozuki-fullscreen-scanner {
          width: 100% !important;
          height: 100% !important;
          position: absolute !important;
          inset: 0 !important;
          overflow: hidden !important;
          background: #000000 !important;
        }
        #dozuki-fullscreen-scanner video {
          width: 100% !important;
          height: 100% !important;
          min-width: 100% !important;
          min-height: 100% !important;
          object-fit: cover !important;
          object-position: center !important;
          position: absolute !important;
          inset: 0 !important;
        }
        #dozuki-fullscreen-scanner #qr-shaded-region {
          display: none !important;
        }
        #dozuki-fullscreen-scanner img {
          display: none !important;
        }
        #dozuki-fullscreen-scanner canvas {
          display: none !important;
        }
      `}</style>
      {/* ─── MOBILE SMARTPHONE SHELL (DOZUKI THEME) ────────────────── */}
      <div
        style={{
          width: '390px',
          maxWidth: '100vw',
          height: '100%',
          maxHeight: '100vh',
          backgroundColor: '#ffffff',
          color: '#0f172a',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 0 50px rgba(0,0,0,0.85), 0 0 0 1px #cbd5e1'
        }}
      >
        {/* ─── VIEW 1: ODOO THEME MANDOR LOGIN SCREEN ─── */}
        {!isLoggedIn && (
          <div
            style={{
              flex: 1,
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              padding: '28px 24px 32px',
              background: 'linear-gradient(145deg, #714B67 0%, #875A7B 38%, #5b3952 70%, #017e84 100%)',
              overflow: 'hidden'
            }}
          >
            {/* Odoo Decorative Ambient Geometric Glows */}
            <div
              style={{
                position: 'absolute',
                top: '-50px',
                right: '-50px',
                width: '180px',
                height: '180px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(0, 160, 157, 0.35) 0%, transparent 70%)',
                filter: 'blur(20px)',
                pointerEvents: 'none'
              }}
            />
            <div
              style={{
                position: 'absolute',
                bottom: '80px',
                left: '-40px',
                width: '160px',
                height: '160px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(235, 169, 73, 0.25) 0%, transparent 70%)',
                filter: 'blur(25px)',
                pointerEvents: 'none'
              }}
            />

            {/* Top Text Header (Connect Your Frontline) */}
            <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', paddingTop: '10px' }}>
              <h3 style={{ margin: 0, color: '#ffffff', fontSize: '15.5px', fontWeight: 800, letterSpacing: '0.4px' }}>
                Connect Your Frontline
              </h3>
              <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: '11px', marginTop: '4px', fontWeight: 600 }}>
                MANDOR Mobile Digital Checksheet Portal
              </div>
            </div>

            {/* Center Logo & Odoo Login Card */}
            <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
              
              {/* MANDOR Wordmark Logo (Odoo Typography Parity) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '3px', marginBottom: '24px' }}>
                <div style={{ fontSize: '34px', fontWeight: 900, color: '#ffffff', letterSpacing: '3.5px', textShadow: '0 2px 12px rgba(0,0,0,0.3)' }}>
                  MANDOR
                </div>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#00A09D', boxShadow: '0 0 10px #00A09D', marginTop: '8px' }} />
              </div>

              {/* Login Form Container */}
              <form onSubmit={handleLogin} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '13px' }}>
                
                {/* Username Input with User Icon */}
                <div style={{ position: 'relative', width: '100%' }}>
                  <div style={{ position: 'absolute', left: '16px', top: '14px', color: '#875A7B' }}>
                    <User size={18} />
                  </div>
                  <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      backgroundColor: '#ffffff',
                      border: '1.5px solid rgba(255,255,255,0.4)',
                      borderRadius: '24px',
                      padding: '13px 18px 13px 46px',
                      color: '#0f172a',
                      fontSize: '13.5px',
                      fontWeight: 700,
                      outline: 'none',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.18)'
                    }}
                  />
                </div>

                {/* Password Input with Lock Icon */}
                <div style={{ position: 'relative', width: '100%' }}>
                  <div style={{ position: 'absolute', left: '16px', top: '14px', color: '#875A7B' }}>
                    <Lock size={18} />
                  </div>
                  <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      backgroundColor: '#ffffff',
                      border: '1.5px solid rgba(255,255,255,0.4)',
                      borderRadius: '24px',
                      padding: '13px 18px 13px 46px',
                      color: '#0f172a',
                      fontSize: '13.5px',
                      fontWeight: 700,
                      outline: 'none',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.18)'
                    }}
                  />
                </div>

                {/* Odoo Teal / Coral Primary LOGIN Button */}
                <button
                  type="submit"
                  style={{
                    marginTop: '4px',
                    width: '100%',
                    padding: '13.5px',
                    backgroundColor: '#00A09D',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '24px',
                    fontSize: '14px',
                    fontWeight: 900,
                    letterSpacing: '1.2px',
                    cursor: 'pointer',
                    boxShadow: '0 6px 20px rgba(0, 160, 157, 0.45)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  LOGIN
                </button>

                {/* Quick Role Credentials Chip Selector */}
                <div style={{ marginTop: '8px', width: '100%', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.7)', fontWeight: 700, textAlign: 'center' }}>
                    PILIH ROLE / AKUN TERDAFTAR:
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setUsername('operator');
                        setPassword('123');
                        handleLogin(null, 'operator', '123');
                      }}
                      style={{
                        padding: '7px 4px',
                        borderRadius: '12px',
                        backgroundColor: 'rgba(255,255,255,0.15)',
                        border: '1px solid rgba(255,255,255,0.3)',
                        color: '#ffffff',
                        fontSize: '10.5px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        backdropFilter: 'blur(4px)',
                        textAlign: 'center'
                      }}
                    >
                      👷 Operator
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setUsername('engineer');
                        setPassword('123');
                        handleLogin(null, 'engineer', '123');
                      }}
                      style={{
                        padding: '7px 4px',
                        borderRadius: '12px',
                        backgroundColor: 'rgba(255,255,255,0.15)',
                        border: '1px solid rgba(255,255,255,0.3)',
                        color: '#ffffff',
                        fontSize: '10.5px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        backdropFilter: 'blur(4px)',
                        textAlign: 'center'
                      }}
                    >
                      ⚙️ Engineer
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setUsername('admin');
                        setPassword('123');
                        handleLogin(null, 'admin', '123');
                      }}
                      style={{
                        padding: '7px 4px',
                        borderRadius: '12px',
                        backgroundColor: 'rgba(255,255,255,0.15)',
                        border: '1px solid rgba(255,255,255,0.3)',
                        color: '#ffffff',
                        fontSize: '10.5px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        backdropFilter: 'blur(4px)',
                        textAlign: 'center'
                      }}
                    >
                      🛡️ Admin
                    </button>
                  </div>
                </div>
              </form>
            </div>

            {/* Bottom Footer Info */}
            <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', color: 'rgba(255,255,255,0.65)', fontSize: '10.5px' }}>
              Station: <b style={{ color: '#ffffff' }}>{stationId}</b> • ISO 9001 & IATF 16949 Compliant
            </div>
          </div>
        )}

        {/* ─── VIEW 2: ULTRA-CLEAN SCANNER HUB ("UINYA HANYA TOMBOL SCANER") ─── */}
        {isLoggedIn && (
          <div
            style={{
              flex: 1,
              backgroundColor: '#f8fafc',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              padding: '16px'
            }}
          >
            {/* Top Bar (Logged in Operator & Station Header) */}
            <div
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '14px',
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#714B67', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '13px' }}>
                  {operatorName.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 900, color: '#0f172a' }}>
                      {operatorName}
                    </span>
                    <span style={{
                      fontSize: '9px',
                      fontWeight: 800,
                      padding: '1px 5px',
                      borderRadius: '6px',
                      backgroundColor: userRole === 'ADMINISTRATOR' ? '#f3e8ff' : userRole === 'APPLICATION_ENGINEER' ? '#e0f2fe' : '#fef3c7',
                      color: userRole === 'ADMINISTRATOR' ? '#7e22ce' : userRole === 'APPLICATION_ENGINEER' ? '#0369a1' : '#b45309',
                      border: userRole === 'ADMINISTRATOR' ? '1px solid #d8b4fe' : userRole === 'APPLICATION_ENGINEER' ? '1px solid #7dd3fc' : '1px solid #fde68a'
                    }}>
                      {userRole.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 700, marginTop: '2px' }}>
                    Station: <span style={{ color: '#00A09D' }}>{stationId}</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  onClick={handleLogout}
                  style={{
                    backgroundColor: '#fee2e2',
                    border: 'none',
                    color: '#dc2626',
                    borderRadius: '8px',
                    padding: '6px 8px',
                    fontSize: '11px',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: 'pointer'
                  }}
                  title="Logout"
                >
                  <LogOut size={13} />
                </button>
                {onClose && (
                  <button
                    onClick={onClose}
                    style={{
                      backgroundColor: '#f1f5f9',
                      border: 'none',
                      color: '#475569',
                      borderRadius: '8px',
                      width: '28px',
                      height: '28px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '13px',
                      fontWeight: 900,
                      cursor: 'pointer'
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Center Area: PROMINENT SCANNER BUTTON HERO */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '18px', padding: '10px 0' }}>
              
              <div style={{ width: '64px', height: '64px', borderRadius: '18px', backgroundColor: 'rgba(0, 160, 157, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00A09D' }}>
                <Scan size={36} />
              </div>

              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 900, color: '#0f172a', margin: '0 0 6px' }}>
                  Pindai QR / Barcode Part
                </h2>
                <p style={{ fontSize: '12px', color: '#64748b', margin: 0, maxWidth: '280px', lineHeight: 1.4 }}>
                  Arahkan kamera ke Traveler Card, Work Order, atau Gambar Blueprint untuk langsung membuka Checksheet.
                </p>
              </div>

              {/* 🎯 MAIN BIG GLOWING SCANNER BUTTON (ODOO PURPLE/TEAL THEME) */}
              <button
                onClick={() => {
                  triggerHaptic(30);
                  playDozukiSound('click');
                  setIsScannerModalOpen(true);
                }}
                style={{
                  width: '200px',
                  height: '200px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #714B67 0%, #875A7B 60%, #00A09D 100%)',
                  color: '#ffffff',
                  border: '6px solid rgba(113, 75, 103, 0.25)',
                  boxShadow: '0 0 35px rgba(113, 75, 103, 0.5), 0 0 15px rgba(0, 160, 157, 0.35), inset 0 0 20px rgba(0,0,0,0.25)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  transform: 'scale(1)',
                  transition: 'transform 0.12s ease, box-shadow 0.12s ease'
                }}
                onPointerDown={e => { e.currentTarget.style.transform = 'scale(0.94)'; }}
                onPointerUp={e => { e.currentTarget.style.transform = 'scale(1)'; }}
                onPointerLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
              >
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Camera size={28} />
                </div>
                <div style={{ fontSize: '15px', fontWeight: 900, letterSpacing: '1px' }}>
                  BUKA SCANNER
                </div>
                <div style={{ fontSize: '10px', opacity: 0.85, fontWeight: 700 }}>
                  (Sentuh Disini)
                </div>
              </button>
            </div>

            {/* Bottom Actions: PASTE LINK / MANUAL INPUT & SIMULATOR */}
            <div style={{ backgroundColor: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: '14px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '11px', fontWeight: 900, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span>📋</span>
                  <span>TEMPEL LINK / PASTE CHECKSHEET</span>
                </div>
                
                {/* 1-Tap Paste from Clipboard Button */}
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      triggerHaptic(20);
                      playDozukiSound('tap');
                      if (navigator.clipboard && navigator.clipboard.readText) {
                        const text = await navigator.clipboard.readText();
                        if (text && text.trim()) {
                          setManualInput(text.trim());
                          toast.success('Link ditempel dari Clipboard! 📋');
                          handleScanSuccess(text.trim());
                        } else {
                          toast('Clipboard kosong', { icon: 'ℹ️' });
                        }
                      } else {
                        toast('Gunakan kotak input untuk paste link manual', { icon: 'ℹ️' });
                      }
                    } catch (err) {
                      toast('Izin clipboard belum aktif. Silakan paste manual di kolom input.', { icon: '⚠️' });
                    }
                  }}
                  style={{
                    padding: '4px 8px',
                    backgroundColor: '#eff6ff',
                    border: '1px solid #93c5fd',
                    color: '#1d4ed8',
                    borderRadius: '6px',
                    fontSize: '10px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <span>📋 Paste 1-Tap</span>
                </button>
              </div>

              {/* Manual input & Open Button */}
              <div style={{ display: 'flex', gap: '6px' }}>
                <input
                  type="text"
                  placeholder="Paste URL, link checksheet, atau nomor WO..."
                  value={manualInput}
                  onChange={e => setManualInput(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    color: '#0f172a',
                    outline: 'none',
                    backgroundColor: '#f8fafc'
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && manualInput.trim()) {
                      handleScanSuccess(manualInput.trim());
                    }
                  }}
                />
                <button
                  onClick={() => {
                    if (manualInput.trim()) {
                      handleScanSuccess(manualInput.trim());
                    } else {
                      toast.error('Ketik atau paste link checksheet terlebih dahulu');
                    }
                  }}
                  style={{
                    padding: '9px 14px',
                    backgroundColor: '#0284c7',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontWeight: 900,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    boxShadow: '0 2px 6px rgba(2,132,199,0.3)'
                  }}
                >
                  Buka Link ▸
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── MODAL: FULLSCREEN LIVE CAMERA BARCODE / QR SCANNER ─────── */}
        {isScannerModalOpen && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: '#000000',
              zIndex: 100,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              overflow: 'hidden'
            }}
          >
            {/* Live Camera Viewfinder Video (Layer 1: Edge to Edge) */}
            <div id="dozuki-fullscreen-scanner" />

            {/* Top Bar Header (Layer 20: Floating Transparent Header) */}
            <div style={{ padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)', zIndex: 20 }}>
              <div style={{ color: '#ffffff', fontSize: '12px', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Scan size={16} color="#ea3a3a" />
                <span>ARAHKAN KAMERA KE BARCODE / QR</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  onClick={toggleTorch}
                  style={{ background: 'none', border: 'none', color: isTorchOn ? '#facc15' : '#ffffff', cursor: 'pointer' }}
                  title="Flashlight"
                >
                  <Flashlight size={18} />
                </button>
                <button
                  onClick={() => setFacingMode(m => m === 'environment' ? 'user' : 'environment')}
                  style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer' }}
                  title="Putar Kamera"
                >
                  <FlipHorizontal size={18} />
                </button>
                <button
                  onClick={() => setIsScannerModalOpen(false)}
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.25)',
                    border: 'none',
                    color: '#ffffff',
                    borderRadius: '50%',
                    width: '28px',
                    height: '28px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '13px',
                    fontWeight: 900,
                    cursor: 'pointer'
                  }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Red Laser Targeting Box (Layer 15: Center Aim Reticle) */}
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '260px',
                height: '260px',
                border: '3px solid #ea3a3a',
                borderRadius: '20px',
                boxShadow: '0 0 30px rgba(234, 58, 58, 0.8), inset 0 0 15px rgba(234, 58, 58, 0.3)',
                pointerEvents: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 15
              }}
            >
              {/* Laser Scan Horizontal Line */}
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  height: '2.5px',
                  backgroundColor: '#ea3a3a',
                  boxShadow: '0 0 12px #ea3a3a, 0 0 20px #f87171',
                  animation: 'pulse 1.2s infinite'
                }}
              />
            </div>

            {/* Bottom Status Info (Layer 20: Floating Transparent Footer) */}
            <div style={{ padding: '14px', backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(6px)', textAlign: 'center', color: '#cbd5e1', fontSize: '11px', fontWeight: 700, zIndex: 20 }}>
              {isRedirecting ? '⏳ Membuka Link Checksheet...' : '⚡ Scan Barcode/QR untuk otomatis membuka Checksheet'}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

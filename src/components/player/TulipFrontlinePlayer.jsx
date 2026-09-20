import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  QrCode, Link as LinkIcon, Smartphone, Monitor, ShieldCheck,
  Play, Maximize2, Minimize2, Camera, Clock, Wifi,
  Battery, X, Sparkles, Layers
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import toast from 'react-hot-toast';
import ProToaster from '../common/ProToaster';
import { getAllFrontlineApps } from '../../utils/supabaseFrontlineDB';
import { getAllUsers, getCurrentUser } from '../../utils/auth';
import { useBarcodeScannerWedge } from '../../hooks/useBarcodeScannerWedge';

// ─── LOCAL STORAGE KEYS ────────────────────────────────────────────────────────
const LS_STATION_ID = 'tulip_player_station_id';
const LS_STATION_NAME = 'tulip_player_station_name';
const LS_CURRENT_OPERATOR = 'tulip_player_active_operator';
const LS_RECENT_APPS = 'tulip_player_recent_apps';

// ─── ROLE DEFINITIONS ──────────────────────────────────────────────────────────
const ROLE_CONFIG = {
  STATION_OPERATOR: {
    label: 'Station Operator',
    badgeBg: '#1e3a8a',
    badgeText: '#93c5fd',
    desc: 'Menjalankan instruksi kerja & pelaporan standar'
  },
  QUALITY_INSPECTOR: {
    label: 'QC / QA Inspector',
    badgeBg: '#14532d',
    badgeText: '#86efac',
    desc: 'Inspeksi mutu, verifikasi dimensi, & audit lot'
  },
  STATION_SUPERVISOR: {
    label: 'Mandor / Supervisor',
    badgeBg: '#713f12',
    badgeText: '#fde047',
    desc: 'Otorisasi defect, andon clearance, & shift handoff'
  },
  MAINTENANCE: {
    label: 'Maintenance Tech',
    badgeBg: '#581c87',
    badgeText: '#d8b4fe',
    desc: 'Perbaikan mesin, kalibrasi alat, & preventive maintenance'
  },
  APPLICATION_ENGINEER: {
    label: 'Manufacturing Engineer',
    badgeBg: '#164e63',
    badgeText: '#67e8f9',
    desc: 'Parameter proses, route routing, & rilis aplikasi'
  },
  ADMINISTRATOR: {
    label: 'System Admin',
    badgeBg: '#7f1d1d',
    badgeText: '#fca5a5',
    desc: 'Akses penuh seluruh modul sistem'
  }
};

// ─── PRESET BUILT-IN DEMO FRONTLINE APPS ──────────────────────────────────────
const BUILTIN_DEMO_APPS = [
  {
    id: 'app-drawing-qc',
    name: 'Dual Stage Planetary Gearbox QC',
    category: 'Quality Inspection',
    version: 'v2.4',
    requiredRole: 'QUALITY_INSPECTOR',
    targetUrl: '/drawing-checksheet',
    thumbnail: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop&q=60',
    description: 'Pemeriksaan dimensi part shaft, housing, dan bearing dengan toleransi ISO 2768-mK.',
    taktTimeSec: 180
  },
  {
    id: 'app-assembly-step',
    name: 'Station 04 Final Unit Assembly',
    category: 'Assembly Line',
    version: 'v1.8',
    requiredRole: 'STATION_OPERATOR',
    targetUrl: '/live-terminal',
    thumbnail: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=500&auto=format&fit=crop&q=60',
    description: 'Instruksi perakitan step-by-step lengkap dengan verifikasi torsi baut M6.',
    taktTimeSec: 120
  },
  {
    id: 'app-dozuki-sop',
    name: 'SOP Kalibrasi Digital Caliper & Micrometer',
    category: 'Maintenance & Tooling',
    version: 'v3.0',
    requiredRole: 'MAINTENANCE',
    targetUrl: '/mandor-checksheet',
    thumbnail: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=500&auto=format&fit=crop&q=60',
    description: 'Standar kalibrasi berkala alat ukur presisi dengan log SPC otomatis.',
    taktTimeSec: 240
  },
  {
    id: 'app-machine-oee',
    name: 'CNC 5-Axis Milling OEE & Activity Tracker',
    category: 'Machine Monitoring',
    version: 'v1.5',
    requiredRole: 'STATION_OPERATOR',
    targetUrl: '/machine-monitoring',
    thumbnail: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=500&auto=format&fit=crop&q=60',
    description: 'Pelacakan status mesin runtime, idle, setup, dan scrap secara real-time.',
    taktTimeSec: 300
  }
];

function checkRolePermission(userRole, requiredRole) {
  if (!requiredRole || requiredRole === 'ALL' || requiredRole === 'STATION_OPERATOR') return true;
  const hierarchy = [
    'STATION_OPERATOR',
    'QUALITY_INSPECTOR',
    'MAINTENANCE',
    'STATION_SUPERVISOR',
    'APPLICATION_ENGINEER',
    'ADMINISTRATOR',
    'ACCOUNT_OWNER'
  ];
  const userIndex = hierarchy.indexOf(userRole || 'STATION_OPERATOR');
  const reqIndex = hierarchy.indexOf(requiredRole);
  if (userIndex === -1 || reqIndex === -1) return true;
  return userIndex >= reqIndex;
}

export default function TulipFrontlinePlayer() {
  // ─── DEVICE & OS DETECTION ──────────────────────────────────────────────────
  const isAndroid = useMemo(() => {
    return /Android/i.test(navigator.userAgent);
  }, []);

  const isWindows = useMemo(() => {
    return /Windows/i.test(navigator.userAgent);
  }, []);

  const platformName = isAndroid ? 'Android Player' : (isWindows ? 'Windows Player' : 'Tulip Web Player');

  // ─── PLAYER STATE ────────────────────────────────────────────────────────────
  const [stationName] = useState(() => {
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const stationParam = searchParams.get('station');
      if (stationParam) {
        localStorage.setItem(LS_STATION_NAME, stationParam);
        return stationParam;
      }
    } catch {
      // noop
    }
    return localStorage.getItem(LS_STATION_NAME) || 'Workstation 01 - Assembly';
  });

  const [activeOperator, setActiveOperator] = useState(() => {
    try {
      const saved = localStorage.getItem(LS_CURRENT_OPERATOR);
      if (saved) return JSON.parse(saved);
    } catch {
      // noop
    }
    const cur = getCurrentUser();
    if (cur) return cur;
    return {
      id: 'opr-01',
      name: 'Budi Santoso',
      username: 'operator',
      role: 'STATION_OPERATOR',
      badgeId: 'BADGE-101'
    };
  });

  // Available apps from DB + Builtin
  const [appsList, setAppsList] = useState(BUILTIN_DEMO_APPS);
  const [recentApps, setRecentApps] = useState(() => {
    try {
      const rec = localStorage.getItem(LS_RECENT_APPS);
      return rec ? JSON.parse(rec) : [BUILTIN_DEMO_APPS[0], BUILTIN_DEMO_APPS[1]];
    } catch {
      return [BUILTIN_DEMO_APPS[0]];
    }
  });

  // Current Running App
  const [runningApp, setRunningApp] = useState(() => {
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const appParam = searchParams.get('app') || searchParams.get('appId');
      const urlParam = searchParams.get('url');
      if (appParam) {
        const found = BUILTIN_DEMO_APPS.find(a => a.id.toLowerCase() === appParam.toLowerCase());
        return found || {
          id: appParam,
          name: `Frontline App ${appParam}`,
          category: 'Manufacturing',
          version: 'v1.0',
          requiredRole: 'STATION_OPERATOR',
          targetUrl: `/terminal/${appParam}`,
          taktTimeSec: 180
        };
      }
      if (urlParam) {
        return {
          id: 'custom-' + Date.now(),
          name: 'Deep Link App',
          category: 'Web App',
          version: 'v1.0',
          requiredRole: 'STATION_OPERATOR',
          targetUrl: urlParam.trim(),
          taktTimeSec: 180
        };
      }
    } catch {
      // noop
    }
    return null;
  });

  const [activeUrl, setActiveUrl] = useState(() => {
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const appParam = searchParams.get('app') || searchParams.get('appId');
      const urlParam = searchParams.get('url');
      if (appParam) {
        const found = BUILTIN_DEMO_APPS.find(a => a.id.toLowerCase() === appParam.toLowerCase());
        return found ? found.targetUrl : `/terminal/${appParam}`;
      }
      if (urlParam) {
        return urlParam.trim();
      }
    } catch {
      // noop
    }
    return null;
  });

  // Modals & UI States
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [pendingAppToRun, setPendingAppToRun] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [activeTab, setActiveTab] = useState('scan'); // 'scan' | 'link' | 'catalog'
  const [loginMethod, setLoginMethod] = useState('badge'); // 'badge' | 'userpass' | 'fast'
  
  // Login Form States
  const [inputBadge, setInputBadge] = useState('');
  const [inputUsername, setInputUsername] = useState('');
  const [inputPassword, setInputPassword] = useState('');
  const [allUsersList] = useState(() => {
    try {
      return getAllUsers() || [];
    } catch {
      return [];
    }
  });

  // Timer & Telemetry
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [batteryLevel, setBatteryLevel] = useState(null);

  // ─── LAUNCH HANDLERS ─────────────────────────────────────────────────────────
  const executeLaunch = useCallback((app) => {
    setElapsedSeconds(0);
    setRunningApp(app);
    setActiveUrl(app.targetUrl);
    setIsLoginModalOpen(false);
    setPendingAppToRun(null);

    try {
      sessionStorage.setItem(`mavi_launch_app_${app.id}`, JSON.stringify(app));
      localStorage.setItem(`mavi_launch_app_${app.id}`, JSON.stringify(app));
    } catch (e) {}

    // Update Recents
    setRecentApps(prevRecents => {
      const updated = [app, ...prevRecents.filter(a => a.id !== app.id)].slice(0, 6);
      try {
        localStorage.setItem(LS_RECENT_APPS, JSON.stringify(updated));
      } catch {
        // noop
      }
      return updated;
    });

    toast.success(`Menjalankan: ${app.name}`, { icon: '🚀' });
  }, []);

  const requestAppLaunch = useCallback((app) => {
    setPendingAppToRun(app);

    // If there is an active operator, check role permission
    if (activeOperator) {
      const meetsRole = checkRolePermission(activeOperator.role, app.requiredRole);
      if (meetsRole) {
        executeLaunch(app);
        return;
      }
    }

    // Otherwise open role-based login modal
    setIsLoginModalOpen(true);
  }, [activeOperator, executeLaunch]);

  const handleSelectAppById = useCallback((id) => {
    const found = appsList.find(a => a.id.toLowerCase() === id.toLowerCase());
    if (found) {
      requestAppLaunch(found);
    } else {
      requestAppLaunch({
        id,
        name: `Frontline App ${id}`,
        category: 'Manufacturing',
        version: 'v1.0',
        requiredRole: 'STATION_OPERATOR',
        targetUrl: `/terminal/${id}`,
        taktTimeSec: 180
      });
    }
  }, [appsList, requestAppLaunch]);

  const handleSelectAppByUrl = useCallback((url, fallbackName = 'Frontline App') => {
    const cleanUrl = url.trim();
    const uniqueId = 'custom-' + Date.now();
    requestAppLaunch({
      id: uniqueId,
      name: fallbackName,
      category: 'Web App',
      version: 'v1.0',
      requiredRole: 'STATION_OPERATOR',
      targetUrl: cleanUrl,
      taktTimeSec: 180
    });
  }, [requestAppLaunch]);

  const handleProcessAppPayload = useCallback((payload) => {
    if (!payload) return;
    const str = payload.trim();

    // Check if it's a URL
    if (str.startsWith('http://') || str.startsWith('https://') || str.startsWith('/')) {
      handleSelectAppByUrl(str, 'Scanned Web App');
      return;
    }

    // Check if it's an App ID
    const foundApp = appsList.find(a => a.id.toLowerCase() === str.toLowerCase() || a.name.toLowerCase() === str.toLowerCase());
    if (foundApp) {
      requestAppLaunch(foundApp);
      return;
    }

    // Default: treat as deep link or path
    handleSelectAppByUrl(str, `App (${str})`);
  }, [appsList, handleSelectAppByUrl, requestAppLaunch]);

  // ─── LOGIN HANDLERS ──────────────────────────────────────────────────────────
  const handleBadgeLogin = useCallback((badgeOrUsername) => {
    const clean = (badgeOrUsername || '').trim();
    if (!clean) {
      toast.error('Masukkan Badge ID!');
      return;
    }

    // Match badge from users
    let found = allUsersList.find(u => 
      u.badgeId?.toLowerCase() === clean.toLowerCase() ||
      u.username?.toLowerCase() === clean.toLowerCase() ||
      u.id?.toLowerCase() === clean.toLowerCase()
    );

    if (!found) {
      found = {
        id: 'usr-' + clean,
        name: `Operator (${clean})`,
        username: clean,
        role: pendingAppToRun?.requiredRole || 'STATION_OPERATOR',
        badgeId: clean
      };
    }

    setActiveOperator(found);
    try {
      localStorage.setItem(LS_CURRENT_OPERATOR, JSON.stringify(found));
    } catch {
      // noop
    }
    toast.success(`Login berhasil: ${found.name}`);

    if (pendingAppToRun) {
      executeLaunch(pendingAppToRun);
    } else {
      setIsLoginModalOpen(false);
    }
  }, [allUsersList, executeLaunch, pendingAppToRun]);

  const handleUserPassLogin = (e) => {
    e?.preventDefault();
    if (!inputUsername) {
      toast.error('Masukkan Username!');
      return;
    }

    const found = allUsersList.find(u => 
      u.username.toLowerCase() === inputUsername.toLowerCase()
    );

    if (found) {
      if (inputPassword && found.password && found.password !== inputPassword) {
        toast.error('Password salah!');
        return;
      }
      setActiveOperator(found);
      try {
        localStorage.setItem(LS_CURRENT_OPERATOR, JSON.stringify(found));
      } catch {
        // noop
      }
      toast.success(`Selamat datang, ${found.name}!`);
      if (pendingAppToRun) {
        executeLaunch(pendingAppToRun);
      } else {
        setIsLoginModalOpen(false);
      }
    } else {
      const newUser = {
        id: 'usr-' + Date.now(),
        name: inputUsername,
        username: inputUsername,
        role: pendingAppToRun?.requiredRole || 'STATION_OPERATOR',
        badgeId: 'B-101'
      };
      setActiveOperator(newUser);
      try {
        localStorage.setItem(LS_CURRENT_OPERATOR, JSON.stringify(newUser));
      } catch {
        // noop
      }
      toast.success(`Login: ${newUser.name}`);
      if (pendingAppToRun) {
        executeLaunch(pendingAppToRun);
      } else {
        setIsLoginModalOpen(false);
      }
    }
  };

  const handleQuickOperatorSelect = (user) => {
    setActiveOperator(user);
    try {
      localStorage.setItem(LS_CURRENT_OPERATOR, JSON.stringify(user));
    } catch {
      // noop
    }
    toast.success(`Operator aktif: ${user.name}`);
    if (pendingAppToRun) {
      executeLaunch(pendingAppToRun);
    } else {
      setIsLoginModalOpen(false);
    }
  };

  // ─── INITIALIZATION ──────────────────────────────────────────────────────────
  useEffect(() => {
    // Load Frontline Apps from DB
    getAllFrontlineApps().then(dbApps => {
      if (dbApps && dbApps.length > 0) {
        const formatted = dbApps.map(app => ({
          id: app.id,
          name: app.name || 'Untitled Frontline App',
          category: app.category || 'Shop Floor',
          version: app.version || 'v1.0',
          requiredRole: app.required_role || 'STATION_OPERATOR',
          targetUrl: `/terminal/${app.id}`,
          thumbnail: app.config?.thumbnail || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop&q=60',
          description: app.description || 'Frontline manufacturing application',
          taktTimeSec: app.config?.taktTime || 180
        }));
        setAppsList([...BUILTIN_DEMO_APPS, ...formatted]);
      }
    }).catch(() => {});

    // Online/Offline status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Battery status if supported
    if (navigator.getBattery) {
      navigator.getBattery().then(bat => {
        setBatteryLevel(Math.round(bat.level * 100));
        bat.addEventListener('levelchange', () => setBatteryLevel(Math.round(bat.level * 100)));
      }).catch(() => {});
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [handleSelectAppById, handleSelectAppByUrl]);

  // ─── TIMER LOGIC ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!runningApp) return;

    timerRef.current = setInterval(() => {
      setElapsedSeconds(s => s + 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [runningApp]);

  // ─── HARDWARE BARCODE / QR SCANNER LISTENER ──────────────────────────────────
  useBarcodeScannerWedge((scannedCode) => {
    if (!scannedCode) return;
    const clean = scannedCode.trim();
    toast.success(`Barcode Scanned: ${clean}`, { icon: '🔍' });

    // 1. If Login modal is open, treat as badge scan
    if (isLoginModalOpen) {
      handleBadgeLogin(clean);
      return;
    }

    // 2. Check if it matches an operator badge
    const matchedUser = allUsersList.find(u => 
      u.badgeId === clean || 
      u.username.toLowerCase() === clean.toLowerCase()
    );
    if (matchedUser && !runningApp) {
      setActiveOperator(matchedUser);
      try {
        localStorage.setItem(LS_CURRENT_OPERATOR, JSON.stringify(matchedUser));
      } catch {
        // noop
      }
      toast.success(`Operator Switched: ${matchedUser.name} (${matchedUser.role})`);
      return;
    }

    // 3. Otherwise treat as App QR / URL
    handleProcessAppPayload(clean);
  }, { enabled: true });

  // ─── FULLSCREEN TOGGLE ───────────────────────────────────────────────────────
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(err => {
        console.warn('Fullscreen error:', err);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      }).catch(() => {});
    }
  };

  // ─── EXIT / CLOSE APP ────────────────────────────────────────────────────────
  const handleExitApp = () => {
    setElapsedSeconds(0);
    setRunningApp(null);
    setActiveUrl(null);
  };

  const formatTimer = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="tulip-player-root" style={{
      display: 'flex',
      flexDirection: 'column',
      width: '100vw',
      height: '100vh',
      backgroundColor: '#0f172a',
      color: '#f8fafc',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      overflow: 'hidden',
      userSelect: 'none'
    }}>
      {/* ──────────────────────────────────────────────────────────────────────────
          TULIP PLAYER TOP BAR (Persistent Frontline Header)
      ────────────────────────────────────────────────────────────────────────── */}
      <header style={{
        height: '48px',
        backgroundColor: '#1b2332',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        zIndex: 50,
        flexShrink: 0
      }}>
        {/* Left: Platform OS Badge + Brand + Station */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '24px',
            height: '24px',
            borderRadius: '6px',
            background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
          }}>
            <Sparkles size={14} color="#ffffff" />
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span style={{ fontWeight: 800, fontSize: '0.88rem', letterSpacing: '0.04em', color: '#ffffff' }}>
              TULIP
            </span>
            <span style={{ fontWeight: 600, fontSize: '0.72rem', color: '#38bdf8', textTransform: 'uppercase' }}>
              PLAYER
            </span>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '2px 8px',
            borderRadius: '4px',
            backgroundColor: isWindows ? 'rgba(14, 165, 233, 0.15)' : 'rgba(34, 197, 94, 0.15)',
            border: `1px solid ${isWindows ? 'rgba(14, 165, 233, 0.3)' : 'rgba(34, 197, 94, 0.3)'}`,
            fontSize: '0.65rem',
            fontWeight: 700,
            color: isWindows ? '#38bdf8' : '#4ade80'
          }}>
            {isWindows ? <Monitor size={11} /> : <Smartphone size={11} />}
            {platformName}
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            fontSize: '0.72rem',
            color: '#94a3b8',
            marginLeft: '6px',
            borderLeft: '1px solid rgba(255,255,255,0.1)',
            paddingLeft: '12px'
          }}>
            <span style={{ color: '#64748b' }}>STATION:</span>
            <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{stationName}</span>
          </div>
        </div>

        {/* Center: Running App & Cycle Time (when app is active) */}
        {runningApp && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'rgba(255,255,255,0.06)',
              padding: '4px 12px',
              borderRadius: '6px',
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#f8fafc' }}>
                {runningApp.name}
              </span>
              <span style={{ fontSize: '0.65rem', color: '#94a3b8', padding: '1px 4px', background: '#334155', borderRadius: '3px' }}>
                {runningApp.version || 'v1.0'}
              </span>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'rgba(2, 132, 199, 0.15)',
              border: '1px solid rgba(2, 132, 199, 0.3)',
              padding: '4px 10px',
              borderRadius: '6px',
              color: '#38bdf8',
              fontFamily: 'monospace',
              fontSize: '0.82rem',
              fontWeight: 700
            }}>
              <Clock size={13} />
              {formatTimer(elapsedSeconds)}
            </div>
          </div>
        )}

        {/* Right: Operator Badge & Control Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => setIsLoginModalOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '20px',
              padding: '3px 10px',
              color: '#f8fafc',
              cursor: 'pointer',
              fontSize: '0.72rem'
            }}
            title="Klik untuk ganti Operator"
          >
            <div style={{
              width: '18px',
              height: '18px',
              borderRadius: '50%',
              backgroundColor: '#0284c7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.65rem',
              fontWeight: 800
            }}>
              {activeOperator?.name ? activeOperator.name[0].toUpperCase() : 'U'}
            </div>
            <span style={{ fontWeight: 600, maxWidth: '110px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {activeOperator?.name || 'Login Operator'}
            </span>
            <span style={{
              fontSize: '0.62rem',
              padding: '1px 5px',
              borderRadius: '3px',
              backgroundColor: ROLE_CONFIG[activeOperator?.role]?.badgeBg || '#1e293b',
              color: ROLE_CONFIG[activeOperator?.role]?.badgeText || '#94a3b8',
              fontWeight: 700
            }}>
              {ROLE_CONFIG[activeOperator?.role]?.label || activeOperator?.role || 'OPERATOR'}
            </span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '0.7rem' }}>
            {isOnline ? <Wifi size={14} color="#22c55e" title="Network Online" /> : <Wifi size={14} color="#ef4444" title="Offline" />}
            {batteryLevel !== null && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '2px', color: '#94a3b8' }}>
                <Battery size={13} /> {batteryLevel}%
              </span>
            )}
          </div>

          {runningApp && (
            <button
              onClick={handleExitApp}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 10px',
                borderRadius: '6px',
                backgroundColor: '#dc2626',
                color: '#ffffff',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.72rem',
                fontWeight: 700
              }}
              title="Keluar dari App / Scan App Baru"
            >
              <QrCode size={13} />
              Ganti App
            </button>
          )}

          <button
            onClick={toggleFullscreen}
            style={{
              padding: '6px',
              borderRadius: '6px',
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#94a3b8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
            title={isFullscreen ? 'Exit Kiosk Fullscreen' : 'Enter Kiosk Fullscreen'}
          >
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
        </div>
      </header>

      {/* ──────────────────────────────────────────────────────────────────────────
          MAIN VIEWPORT: RUNNING APP OR LAUNCHER HUB
      ────────────────────────────────────────────────────────────────────────── */}
      {runningApp ? (
        <main style={{ flex: 1, width: '100%', height: 'calc(100% - 48px)', position: 'relative', overflow: 'hidden' }}>
          <iframe
            src={activeUrl}
            title={runningApp.name}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              backgroundColor: '#0f172a'
            }}
            allow="camera; microphone; geolocation; fullscreen"
          />
        </main>
      ) : (
        <main style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-start'
        }}>
          {/* Hero Banner */}
          <div style={{ textAlign: 'center', maxWidth: '640px', marginBottom: '24px' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f8fafc', margin: '0 0 6px 0' }}>
              Frontline MES App Player
            </h1>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: 0 }}>
              Pindai QR Code pada stasiun kerja, traveler sheet, atau masukkan link aplikasi untuk memulai pengerjaan.
            </p>
          </div>

          {/* Launch Method Switcher Tabs */}
          <div style={{
            display: 'flex',
            gap: '8px',
            background: '#1e293b',
            padding: '4px',
            borderRadius: '10px',
            border: '1px solid rgba(255,255,255,0.08)',
            marginBottom: '24px'
          }}>
            <button
              onClick={() => setActiveTab('scan')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 18px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.82rem',
                fontWeight: 700,
                backgroundColor: activeTab === 'scan' ? '#0284c7' : 'transparent',
                color: activeTab === 'scan' ? '#ffffff' : '#94a3b8',
                transition: 'all 0.15s'
              }}
            >
              <QrCode size={16} /> Scan QR App
            </button>

            <button
              onClick={() => setActiveTab('link')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 18px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.82rem',
                fontWeight: 700,
                backgroundColor: activeTab === 'link' ? '#0284c7' : 'transparent',
                color: activeTab === 'link' ? '#ffffff' : '#94a3b8',
                transition: 'all 0.15s'
              }}
            >
              <LinkIcon size={16} /> Masukkan Link / ID
            </button>

            <button
              onClick={() => setActiveTab('catalog')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 18px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.82rem',
                fontWeight: 700,
                backgroundColor: activeTab === 'catalog' ? '#0284c7' : 'transparent',
                color: activeTab === 'catalog' ? '#ffffff' : '#94a3b8',
                transition: 'all 0.15s'
              }}
            >
              <Layers size={16} /> Daftar App Stasiun
            </button>
          </div>

          {/* TAB 1: SCAN QR CODE */}
          {activeTab === 'scan' && (
            <div style={{
              width: '100%',
              maxWidth: '520px',
              backgroundColor: '#1e293b',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '16px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)'
            }}>
              <div style={{
                width: '120px',
                height: '120px',
                borderRadius: '16px',
                background: 'rgba(2, 132, 199, 0.1)',
                border: '2px dashed #0284c7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '18px'
              }}>
                <QrCode size={64} color="#38bdf8" />
              </div>

              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 6px 0', color: '#f8fafc' }}>
                Siap Memindai QR Code
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8', textAlign: 'center', margin: '0 0 20px 0' }}>
                Arahkan kamera ke QR Code aplikasi, atau gunakan USB/Bluetooth Barcode Scanner wedge kapan saja.
              </p>

              <button
                onClick={() => setIsScannerOpen(true)}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '10px',
                  backgroundColor: '#0284c7',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 6px -1px rgba(2, 132, 199, 0.3)'
                }}
              >
                <Camera size={18} /> Buka Kamera Scanner
              </button>

              <div style={{ marginTop: '16px', fontSize: '0.72rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#22c55e' }}></span>
                Hardware Barcode Scanner Wedge Aktif (Otomatis Deteksi)
              </div>
            </div>
          )}

          {/* TAB 2: MANUAL LINK OR APP ID */}
          {activeTab === 'link' && (
            <div style={{
              width: '100%',
              maxWidth: '520px',
              backgroundColor: '#1e293b',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)'
            }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 6px 0', color: '#f8fafc' }}>
                Masukkan Link atau ID Aplikasi
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0 0 16px 0' }}>
                Ketikkan path rute internal (misal: <code>/drawing-checksheet</code>) atau URL web app tujuan.
              </p>

              <form onSubmit={(e) => { e.preventDefault(); handleProcessAppPayload(manualInput); }}>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                  <input
                    type="text"
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    placeholder="Contoh: app-drawing-qc atau /drawing-checksheet"
                    style={{
                      flex: 1,
                      backgroundColor: '#0f172a',
                      border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: '8px',
                      padding: '10px 14px',
                      color: '#f8fafc',
                      fontSize: '0.85rem'
                    }}
                  />
                  <button
                    type="submit"
                    style={{
                      padding: '10px 18px',
                      borderRadius: '8px',
                      backgroundColor: '#0284c7',
                      color: '#ffffff',
                      border: 'none',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <Play size={15} /> Jalankan
                  </button>
                </div>
              </form>

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '14px' }}>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 700, marginBottom: '8px' }}>
                  PRESET CEPAT SHOP FLOOR:
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {[
                    { label: 'QC Drawing', val: '/drawing-checksheet' },
                    { label: 'SOP Caliper', val: '/mandor-checksheet' },
                    { label: 'Work Terminal', val: '/live-terminal' },
                    { label: 'OEE Monitor', val: '/machine-monitoring' }
                  ].map(p => (
                    <button
                      key={p.val}
                      onClick={() => handleProcessAppPayload(p.val)}
                      style={{
                        padding: '5px 10px',
                        borderRadius: '6px',
                        backgroundColor: '#334155',
                        border: '1px solid rgba(255,255,255,0.05)',
                        color: '#cbd5e1',
                        fontSize: '0.72rem',
                        cursor: 'pointer'
                      }}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: APP CATALOG */}
          {activeTab === 'catalog' && (
            <div style={{
              width: '100%',
              maxWidth: '820px',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
              gap: '16px'
            }}>
              {appsList.map(app => (
                <div
                  key={app.id}
                  onClick={() => requestAppLaunch(app)}
                  style={{
                    backgroundColor: '#1e293b',
                    borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.08)',
                    padding: '16px',
                    cursor: 'pointer',
                    transition: 'transform 0.15s, border-color 0.15s',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#0284c7'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <span style={{
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        backgroundColor: ROLE_CONFIG[app.requiredRole]?.badgeBg || '#1e3a8a',
                        color: ROLE_CONFIG[app.requiredRole]?.badgeText || '#93c5fd'
                      }}>
                        {ROLE_CONFIG[app.requiredRole]?.label || app.requiredRole}
                      </span>
                      <span style={{ fontSize: '0.65rem', color: '#64748b' }}>{app.version || 'v1.0'}</span>
                    </div>
                    <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#f8fafc', margin: '0 0 6px 0' }}>
                      {app.name}
                    </h4>
                    <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '0 0 12px 0', lineHeight: 1.4 }}>
                      {app.description}
                    </p>
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: '10px',
                    borderTop: '1px solid rgba(255,255,255,0.06)'
                  }}>
                    <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Takt: {app.taktTimeSec}s</span>
                    <button style={{
                      backgroundColor: '#0284c7',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '4px 10px',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <Play size={11} /> Buka
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* RECENT APPS SECTION (Persistent Quick Access) */}
          {recentApps.length > 0 && activeTab !== 'catalog' && (
            <div style={{ width: '100%', maxWidth: '640px', marginTop: '36px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <Clock size={16} color="#38bdf8" />
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#e2e8f0' }}>
                  Aplikasi Terakhir Dijalankan:
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: '10px' }}>
                {recentApps.map(app => (
                  <div
                    key={app.id}
                    onClick={() => requestAppLaunch(app)}
                    style={{
                      backgroundColor: '#1e293b',
                      borderRadius: '8px',
                      padding: '10px 12px',
                      border: '1px solid rgba(255,255,255,0.06)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}
                  >
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '6px',
                      backgroundColor: '#0369a1',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <Play size={14} color="#ffffff" />
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {app.name}
                      </div>
                      <div style={{ fontSize: '0.65rem', color: '#64748b' }}>
                        {ROLE_CONFIG[app.requiredRole]?.label || 'Operator'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      )}

      {/* ──────────────────────────────────────────────────────────────────────────
          MODAL 1: LIVE QR CAMERA SCANNER (HTML5-QRCode)
      ────────────────────────────────────────────────────────────────────────── */}
      {isScannerOpen && (
        <ScannerModal
          onScan={(result) => {
            setIsScannerOpen(false);
            handleProcessAppPayload(result);
          }}
          onClose={() => setIsScannerOpen(false)}
        />
      )}

      {/* ──────────────────────────────────────────────────────────────────────────
          MODAL 2: ROLE-BASED LOGIN & GATEKEEPER FORM
      ────────────────────────────────────────────────────────────────────────── */}
      {isLoginModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(4px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '460px',
            backgroundColor: '#1e293b',
            borderRadius: '16px',
            border: '1px solid rgba(255,255,255,0.15)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '16px 20px',
              backgroundColor: '#0f172a',
              borderBottom: '1px solid rgba(255,255,255,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={18} color="#38bdf8" />
                <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#ffffff' }}>
                  Otentikasi Role Operator
                </span>
              </div>
              <button
                onClick={() => { setIsLoginModalOpen(false); setPendingAppToRun(null); }}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Target App Details Banner */}
            {pendingAppToRun && (
              <div style={{
                padding: '12px 20px',
                backgroundColor: 'rgba(2, 132, 199, 0.1)',
                borderBottom: '1px solid rgba(2, 132, 199, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ fontSize: '0.68rem', color: '#38bdf8', fontWeight: 700 }}>APLIKASI DITARGETKAN:</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f8fafc' }}>{pendingAppToRun.name}</div>
                </div>
                <span style={{
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: '4px',
                  backgroundColor: ROLE_CONFIG[pendingAppToRun.requiredRole]?.badgeBg || '#1e3a8a',
                  color: ROLE_CONFIG[pendingAppToRun.requiredRole]?.badgeText || '#93c5fd'
                }}>
                  Syarat: {ROLE_CONFIG[pendingAppToRun.requiredRole]?.label || pendingAppToRun.requiredRole}
                </span>
              </div>
            )}

            {/* Login Tab Switcher */}
            <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.08)', backgroundColor: '#162032' }}>
              <button
                onClick={() => setLoginMethod('badge')}
                style={{
                  flex: 1,
                  padding: '10px 0',
                  border: 'none',
                  borderBottom: loginMethod === 'badge' ? '2px solid #0284c7' : 'none',
                  backgroundColor: 'transparent',
                  color: loginMethod === 'badge' ? '#38bdf8' : '#94a3b8',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Scan Badge / RFID
              </button>
              <button
                onClick={() => setLoginMethod('userpass')}
                style={{
                  flex: 1,
                  padding: '10px 0',
                  border: 'none',
                  borderBottom: loginMethod === 'userpass' ? '2px solid #0284c7' : 'none',
                  backgroundColor: 'transparent',
                  color: loginMethod === 'userpass' ? '#38bdf8' : '#94a3b8',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Username & PIN
              </button>
              <button
                onClick={() => setLoginMethod('fast')}
                style={{
                  flex: 1,
                  padding: '10px 0',
                  border: 'none',
                  borderBottom: loginMethod === 'fast' ? '2px solid #0284c7' : 'none',
                  backgroundColor: 'transparent',
                  color: loginMethod === 'fast' ? '#38bdf8' : '#94a3b8',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Fast Switcher
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '20px' }}>
              {/* TAB 1: BADGE SCAN */}
              {loginMethod === 'badge' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: 0 }}>
                    Tap atau scan kartu badge pegawai Anda menggunakan scanner fisik, atau ketikkan nomor badge di bawah.
                  </p>
                  <form onSubmit={(e) => { e.preventDefault(); handleBadgeLogin(inputBadge); }}>
                    <input
                      type="text"
                      autoFocus
                      value={inputBadge}
                      onChange={(e) => setInputBadge(e.target.value)}
                      placeholder="Contoh: BADGE-101 atau operator"
                      style={{
                        width: '100%',
                        backgroundColor: '#0f172a',
                        border: '1px solid rgba(255,255,255,0.15)',
                        borderRadius: '8px',
                        padding: '12px',
                        color: '#f8fafc',
                        fontSize: '0.9rem',
                        boxSizing: 'border-box',
                        marginBottom: '12px'
                      }}
                    />
                    <button
                      type="submit"
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '8px',
                        backgroundColor: '#0284c7',
                        color: '#ffffff',
                        border: 'none',
                        fontSize: '0.88rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      Verifikasi & Masuk
                    </button>
                  </form>
                </div>
              )}

              {/* TAB 2: USERNAME & PIN */}
              {loginMethod === 'userpass' && (
                <form onSubmit={handleUserPassLogin} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                      Username
                    </label>
                    <input
                      type="text"
                      value={inputUsername}
                      onChange={(e) => setInputUsername(e.target.value)}
                      placeholder="operator / qc / admin"
                      style={{
                        width: '100%',
                        backgroundColor: '#0f172a',
                        border: '1px solid rgba(255,255,255,0.15)',
                        borderRadius: '8px',
                        padding: '10px 12px',
                        color: '#f8fafc',
                        fontSize: '0.85rem',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                      PIN / Password
                    </label>
                    <input
                      type="password"
                      value={inputPassword}
                      onChange={(e) => setInputPassword(e.target.value)}
                      placeholder="Default: 123"
                      style={{
                        width: '100%',
                        backgroundColor: '#0f172a',
                        border: '1px solid rgba(255,255,255,0.15)',
                        borderRadius: '8px',
                        padding: '10px 12px',
                        color: '#f8fafc',
                        fontSize: '0.85rem',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                  <button
                    type="submit"
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '8px',
                      backgroundColor: '#0284c7',
                      color: '#ffffff',
                      border: 'none',
                      fontSize: '0.88rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      marginTop: '6px'
                    }}
                  >
                    Masuk Shift
                  </button>
                </form>
              )}

              {/* TAB 3: FAST SHIFT SWITCHER */}
              {loginMethod === 'fast' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '240px', overflowY: 'auto' }}>
                  {allUsersList.map(u => (
                    <div
                      key={u.id}
                      onClick={() => handleQuickOperatorSelect(u)}
                      style={{
                        padding: '10px 12px',
                        backgroundColor: '#0f172a',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          backgroundColor: '#0284c7',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.75rem',
                          fontWeight: 800
                        }}>
                          {u.name[0].toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f8fafc' }}>{u.name}</div>
                          <div style={{ fontSize: '0.65rem', color: '#64748b' }}>@{u.username}</div>
                        </div>
                      </div>
                      <span style={{
                        fontSize: '0.65rem',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        backgroundColor: ROLE_CONFIG[u.role]?.badgeBg || '#1e3a8a',
                        color: ROLE_CONFIG[u.role]?.badgeText || '#93c5fd',
                        fontWeight: 700
                      }}>
                        {ROLE_CONFIG[u.role]?.label || u.role}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── HIGH PERFORMANCE CAMERA SCANNER SUBCOMPONENT ─────────────────────────────
function ScannerModal({ onScan, onClose }) {
  const scannerRef = useRef(null);
  const [cameraError, setCameraError] = useState(null);

  useEffect(() => {
    const html5QrCode = new Html5Qrcode('tulip-reader');
    scannerRef.current = html5QrCode;

    const config = {
      fps: 12,
      qrbox: { width: 260, height: 260 },
      aspectRatio: 1.0
    };

    html5QrCode.start(
      { facingMode: 'environment' },
      config,
      (decodedText) => {
        onScan(decodedText);
        html5QrCode.stop().catch(() => {});
      },
      () => {
        // Ignored frame error
      }
    ).catch(err => {
      console.warn('Camera failed with environment mode, falling back to default:', err);
      // Fallback to any camera
      html5QrCode.start(
        {},
        config,
        (decodedText) => {
          onScan(decodedText);
          html5QrCode.stop().catch(() => {});
        },
        () => {}
      ).catch(() => {
        setCameraError('Gagal mengakses kamera. Mohon izinkan izin kamera browser.');
      });
    });

    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, [onScan]);

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: '#000000',
      zIndex: 99999,
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Top Header */}
      <div style={{
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(0,0,0,0.7)',
        zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ffffff', fontWeight: 800, fontSize: '0.9rem' }}>
          <Camera size={18} color="#38bdf8" /> Arahkan ke QR Code Aplikasi
        </div>
        <button
          onClick={onClose}
          style={{
            backgroundColor: 'rgba(255,255,255,0.2)',
            border: 'none',
            color: '#ffffff',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <X size={20} />
        </button>
      </div>

      {/* Camera Viewport */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        <div id="tulip-reader" style={{ width: '100%', maxWidth: '480px' }}></div>
        {cameraError && (
          <div style={{
            position: 'absolute',
            padding: '16px 24px',
            backgroundColor: '#dc2626',
            color: '#ffffff',
            borderRadius: '8px',
            fontSize: '0.85rem',
            textAlign: 'center',
            maxWidth: '320px'
          }}>
            {cameraError}
          </div>
        )}
      </div>

      {/* Bottom Hint */}
      <div style={{
        padding: '16px',
        textAlign: 'center',
        backgroundColor: 'rgba(0,0,0,0.7)',
        color: '#94a3b8',
        fontSize: '0.78rem'
      }}>
        Mendukung QR Code Aplikasi, Station Barcode, dan Traveler Work Order Card.
      </div>
    </div>
  );
}

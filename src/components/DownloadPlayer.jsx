import React, { useState, useEffect } from 'react';
import {
    Monitor,
    Smartphone,
    Globe,
    Download,
    QrCode,
    CheckCircle2,
    Copy,
    ExternalLink,
    Play,
    Shield,
    HardDrive,
    Cpu,
    Wifi,
    Settings,
    Layers,
    Tv,
    Barcode,
    Terminal,
    Key,
    ArrowRight,
    RefreshCw
} from 'lucide-react';
import QRCode from 'react-qr-code';
import toast from 'react-hot-toast';
import { getStations, getInterfaces } from '../utils/database';

export default function DownloadPlayer() {
    const [stations, setStations] = useState([]);
    const [, setInterfaces] = useState([]);
    const [selectedStationId, setSelectedStationId] = useState('');
    const [activeTab, setActiveTab] = useState('windows'); // 'windows' | 'android' | 'pwa' | 'pairing'
    const [pairingCode, setPairingCode] = useState('');
    const [, setCopied] = useState(false);

    // Host & URL discovery
    const currentOrigin = window.location.origin;
    const currentPath = window.location.pathname.replace(/\/$/, '');
    const baseUrl = `${currentOrigin}${currentPath}`;

    const generatePairingCode = (stId) => {
        const hash = Math.abs(stId.split('').reduce((acc, c) => acc * 31 + c.charCodeAt(0), 0))
            .toString(36)
            .toUpperCase()
            .slice(0, 6)
            .padStart(6, '7');
        setPairingCode(`MNDR-${hash}`);
    };

    useEffect(() => {
        async function loadData() {
            try {
                const [sList, iList] = await Promise.all([getStations(), getInterfaces()]);
                setStations(sList || []);
                setInterfaces(iList || []);
                if (sList && sList.length > 0) {
                    setSelectedStationId(sList[0].id);
                    generatePairingCode(sList[0].id);
                }
            } catch (err) {
                console.error('Error loading stations:', err);
            }
        }
        loadData();
    }, []);

    const handleStationChange = (id) => {
        setSelectedStationId(id);
        generatePairingCode(id);
    };

    const selectedStation = stations.find(s => s.id === selectedStationId);

    const stationQuery = selectedStationId ? `?station=${encodeURIComponent(selectedStation?.name || selectedStationId)}` : '';
    const tulipPlayerUrl = `${currentOrigin}/#/tulip-player${stationQuery}`;
    const playerTargetUrl = tulipPlayerUrl;
    const _terminalTargetUrl = `${currentOrigin}/#/terminal${stationQuery}`;
    void _terminalTargetUrl;

    const handleCopy = (text, msg = 'Tersalin ke clipboard!') => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        toast.success(msg);
        setTimeout(() => setCopied(false), 2000);
    };

    // Download batch file for Windows Kiosk
    const handleDownloadWindowsLauncher = () => {
        const batchContent = `@echo off
:: ===================================================
:: MANDOR MES DEDICATED PLAYER - INDUSTRIAL KIOSK
:: Workstation Station: ${selectedStation?.name || 'Default Station'}
:: ===================================================
title Mandor Industrial Player Launcher
echo Menghubungkan ke Factory Station: ${selectedStation?.name || 'Default'}...
timeout /t 1 /nobreak >nul

set PLAYER_URL="${playerTargetUrl}"

:: Cek keberadaan Google Chrome
if exist "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" (
    echo Membuka Mandor Player via Chrome Kiosk...
    start "" "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" --kiosk --no-first-run --disable-pinch --overscroll-history-navigation=0 --incognito %PLAYER_URL%
    exit
)
if exist "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe" (
    echo Membuka Mandor Player via Chrome (x86) Kiosk...
    start "" "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe" --kiosk --no-first-run --disable-pinch --overscroll-history-navigation=0 --incognito %PLAYER_URL%
    exit
)

:: Cek keberadaan Microsoft Edge
if exist "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe" (
    echo Membuka Mandor Player via Microsoft Edge Kiosk...
    start "" "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe" --kiosk --no-first-run --edge-kiosk-type=fullscreen --incognito %PLAYER_URL%
    exit
)
if exist "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe" (
    echo Membuka Mandor Player via Microsoft Edge Kiosk...
    start "" "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe" --kiosk --no-first-run --edge-kiosk-type=fullscreen --incognito %PLAYER_URL%
    exit
)

:: Fallback Default Browser
echo Membuka via browser default...
start "" %PLAYER_URL%
exit
`;
        const blob = new Blob([batchContent], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Launch-MandorPlayer-${(selectedStation?.name || 'Station').replace(/\s+/g, '_')}.bat`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success('File launcher Windows (.bat) berhasil diunduh!');
    };

    return (
        <div style={{
            minHeight: '100%',
            backgroundColor: '#0f172a',
            color: '#f8fafc',
            fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
            padding: '32px 24px',
            boxSizing: 'border-box'
        }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                
                {/* Header Section */}
                <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '20px',
                    borderBottom: '1px solid #1e293b',
                    paddingBottom: '24px',
                    marginBottom: '32px'
                }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                            <div style={{
                                width: '42px',
                                height: '42px',
                                borderRadius: '10px',
                                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 4px 14px rgba(59, 130, 246, 0.4)'
                            }}>
                                <Monitor size={24} color="#ffffff" />
                            </div>
                            <div>
                                <h1 style={{ margin: 0, fontSize: '26px', fontWeight: 800, letterSpacing: '-0.02em', color: '#ffffff' }}>
                                    Mandor Dedicated Player
                                </h1>
                                <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8' }}>
                                    Native Kiosk Client & Station Display Device untuk Windows PC & Android Tablet (1:1 Tulip Player)
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Server Host Badge */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        backgroundColor: '#1e293b',
                        padding: '10px 16px',
                        borderRadius: '10px',
                        border: '1px solid #334155'
                    }}>
                        <div style={{
                            width: '10px',
                            height: '10px',
                            borderRadius: '50%',
                            backgroundColor: '#10b981',
                            boxShadow: '0 0 10px #10b981'
                        }} />
                        <div>
                            <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>
                                Factory Host Origin
                            </div>
                            <div style={{ fontSize: '13px', fontWeight: 600, color: '#38bdf8' }}>
                                {baseUrl}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Station Selection Banner */}
                <div style={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '14px',
                    padding: '20px 24px',
                    marginBottom: '32px',
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '20px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{
                            width: '46px',
                            height: '46px',
                            borderRadius: '12px',
                            backgroundColor: 'rgba(59, 130, 246, 0.15)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <Tv size={24} color="#60a5fa" />
                        </div>
                        <div>
                            <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>
                                Target Station Binding
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
                                <select
                                    value={selectedStationId}
                                    onChange={(e) => handleStationChange(e.target.value)}
                                    style={{
                                        backgroundColor: '#0f172a',
                                        color: '#f8fafc',
                                        border: '1px solid #475569',
                                        borderRadius: '8px',
                                        padding: '8px 14px',
                                        fontSize: '14px',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        outline: 'none'
                                    }}
                                >
                                    {stations.map(st => (
                                        <option key={st.id} value={st.id}>
                                            {st.name} ({st.area || 'Shop Floor'})
                                        </option>
                                    ))}
                                </select>
                                <span style={{
                                    fontSize: '12px',
                                    padding: '4px 10px',
                                    borderRadius: '6px',
                                    backgroundColor: '#0369a1',
                                    color: '#e0f2fe',
                                    fontWeight: 700
                                }}>
                                    Pairing Code: {pairingCode}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Direct Test Buttons */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                        <button
                            onClick={() => window.open(tulipPlayerUrl, '_blank')}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                backgroundColor: '#0284c7',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '10px 18px',
                                fontSize: '13px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                boxShadow: '0 4px 12px rgba(2, 132, 199, 0.35)'
                            }}
                        >
                            <QrCode size={16} /> Buka Tulip Player (Win/Android)
                        </button>
                        <button
                            onClick={() => window.open(playerTargetUrl, '_blank')}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                backgroundColor: '#2563eb',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '10px 18px',
                                fontSize: '13px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
                            }}
                        >
                            <Play size={16} /> Buka Player di Browser
                        </button>
                        <button
                            onClick={() => handleCopy(playerTargetUrl, 'URL Player disalin!')}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                backgroundColor: '#334155',
                                color: '#f8fafc',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '10px 16px',
                                fontSize: '13px',
                                fontWeight: 600,
                                cursor: 'pointer'
                            }}
                        >
                            <Copy size={16} /> Copy URL
                        </button>
                    </div>
                </div>

                {/* Platform Navigation Tabs */}
                <div style={{
                    display: 'flex',
                    borderBottom: '1px solid #334155',
                    marginBottom: '28px',
                    gap: '8px'
                }}>
                    <button
                        onClick={() => setActiveTab('windows')}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '12px 20px',
                            fontSize: '14px',
                            fontWeight: 700,
                            color: activeTab === 'windows' ? '#38bdf8' : '#94a3b8',
                            borderBottom: activeTab === 'windows' ? '2px solid #38bdf8' : '2px solid transparent',
                            backgroundColor: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'color 0.2s'
                        }}
                    >
                        <Monitor size={18} /> 1. Windows Desktop (PC / Touchscreen)
                    </button>
                    <button
                        onClick={() => setActiveTab('android')}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '12px 20px',
                            fontSize: '14px',
                            fontWeight: 700,
                            color: activeTab === 'android' ? '#38bdf8' : '#94a3b8',
                            borderBottom: activeTab === 'android' ? '2px solid #38bdf8' : '2px solid transparent',
                            backgroundColor: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'color 0.2s'
                        }}
                    >
                        <Smartphone size={18} /> 2. Android (Tablet & Handheld Zebra)
                    </button>
                    <button
                        onClick={() => setActiveTab('pwa')}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '12px 20px',
                            fontSize: '14px',
                            fontWeight: 700,
                            color: activeTab === 'pwa' ? '#38bdf8' : '#94a3b8',
                            borderBottom: activeTab === 'pwa' ? '2px solid #38bdf8' : '2px solid transparent',
                            backgroundColor: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'color 0.2s'
                        }}
                    >
                        <Globe size={18} /> 3. PWA Kiosk (Zero-Install)
                    </button>
                    <button
                        onClick={() => setActiveTab('pairing')}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '12px 20px',
                            fontSize: '14px',
                            fontWeight: 700,
                            color: activeTab === 'pairing' ? '#38bdf8' : '#94a3b8',
                            borderBottom: activeTab === 'pairing' ? '2px solid #38bdf8' : '2px solid transparent',
                            backgroundColor: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'color 0.2s'
                        }}
                    >
                        <Key size={18} /> 4. Station Pairing Guide
                    </button>
                </div>

                {/* TAB 1: WINDOWS DESKTOP */}
                {activeTab === 'windows' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>
                        {/* Option 1: 1-Click Kiosk Launcher Batch */}
                        <div style={{
                            backgroundColor: '#1e293b',
                            border: '1px solid #3b82f6',
                            borderRadius: '14px',
                            padding: '24px',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            boxShadow: '0 8px 24px rgba(59, 130, 246, 0.15)'
                        }}>
                            <div>
                                <div style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    backgroundColor: 'rgba(59, 130, 246, 0.2)',
                                    color: '#60a5fa',
                                    padding: '4px 10px',
                                    borderRadius: '6px',
                                    fontSize: '12px',
                                    fontWeight: 700,
                                    marginBottom: '12px'
                                }}>
                                    ⚡ Metode Tercepat (Siap Pakai)
                                </div>
                                <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 700, color: '#ffffff' }}>
                                    1-Click Windows Kiosk Launcher (.bat)
                                </h3>
                                <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#cbd5e1', lineHeight: '1.6' }}>
                                    Menjalankan Mandor Player di Windows dalam mode <strong>True Fullscreen Kiosk</strong> menggunakan engine Chrome/Edge bawaan Windows. Menghilangkan address bar, tombol navigasi, dan mengunci layar stasiun kerja.
                                </p>
                                <div style={{
                                    backgroundColor: '#0f172a',
                                    padding: '12px',
                                    borderRadius: '8px',
                                    fontSize: '12px',
                                    fontFamily: 'monospace',
                                    color: '#38bdf8',
                                    marginBottom: '16px',
                                    overflowX: 'auto'
                                }}>
                                    chrome.exe --kiosk --no-first-run {playerTargetUrl}
                                </div>
                                <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '13px', color: '#94a3b8', lineHeight: '1.7' }}>
                                    <li>Layar penuh otomatis (menghilangkan gangguan operator)</li>
                                    <li>Bisa ditaruh di folder <code>shell:startup</code> agar otomatis jalan saat PC menyala</li>
                                    <li>Terikat langsung ke <strong>{selectedStation?.name || 'Stasiun'}</strong></li>
                                </ul>
                            </div>
                            <button
                                onClick={handleDownloadWindowsLauncher}
                                style={{
                                    marginTop: '24px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '10px',
                                    backgroundColor: '#2563eb',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '10px',
                                    padding: '14px 20px',
                                    fontSize: '14px',
                                    fontWeight: 700,
                                    cursor: 'pointer'
                                }}
                            >
                                <Download size={18} /> Download Launcher Windows (.bat)
                            </button>
                        </div>

                        {/* Option 2: Native Electron Packaging Guide */}
                        <div style={{
                            backgroundColor: '#1e293b',
                            border: '1px solid #334155',
                            borderRadius: '14px',
                            padding: '24px',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between'
                        }}>
                            <div>
                                <div style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    backgroundColor: '#334155',
                                    color: '#cbd5e1',
                                    padding: '4px 10px',
                                    borderRadius: '6px',
                                    fontSize: '12px',
                                    fontWeight: 700,
                                    marginBottom: '12px'
                                }}>
                                    📦 Standalone Installer (.exe / .msi)
                                </div>
                                <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 700, color: '#ffffff' }}>
                                    Native Electron Desktop Player
                                </h3>
                                <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#cbd5e1', lineHeight: '1.6' }}>
                                    Compile project menjadi satu file installer <code>MandorPlayer-Setup.exe</code> menggunakan Electron. Memberikan kontrol penuh atas port COM serial timbangan/caliper dan lock-down Windows.
                                </p>
                                <div style={{
                                    backgroundColor: '#0f172a',
                                    padding: '12px',
                                    borderRadius: '8px',
                                    fontSize: '12px',
                                    fontFamily: 'monospace',
                                    color: '#a78bfa',
                                    marginBottom: '16px'
                                }}>
                                    npm install -D electron electron-builder<br />
                                    npm run build:electron
                                </div>
                                <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '13px', color: '#94a3b8', lineHeight: '1.7' }}>
                                    <li>Mendukung pembacaan hardware USB COM Port & HID scanner</li>
                                    <li>Direct ZPL / ESC-POS thermal label printing tanpa dialog print</li>
                                    <li>Anti-Alt+Tab / Task Manager lockdown (opsional)</li>
                                </ul>
                            </div>
                            <button
                                onClick={() => handleCopy('npm install -D electron electron-builder', 'Perintah build tersalin!')}
                                style={{
                                    marginTop: '24px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '10px',
                                    backgroundColor: '#334155',
                                    color: '#f8fafc',
                                    border: 'none',
                                    borderRadius: '10px',
                                    padding: '14px 20px',
                                    fontSize: '14px',
                                    fontWeight: 700,
                                    cursor: 'pointer'
                                }}
                            >
                                <Copy size={18} /> Salin Perintah Build Electron
                            </button>
                        </div>
                    </div>
                )}

                {/* TAB 2: ANDROID TABLET & HANDHELD */}
                {activeTab === 'android' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>
                        {/* QR Code Instant Mobile Scanner */}
                        <div style={{
                            backgroundColor: '#1e293b',
                            border: '1px solid #10b981',
                            borderRadius: '14px',
                            padding: '24px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            textAlign: 'center'
                        }}>
                            <div style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                                color: '#34d399',
                                padding: '4px 10px',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: 700,
                                marginBottom: '14px'
                            }}>
                                📷 Scan QR untuk Buka Langsung di Android
                            </div>
                            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 700, color: '#ffffff' }}>
                                Hubungkan Tablet ke Stasiun Ini
                            </h3>
                            <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: '#cbd5e1' }}>
                                Buka kamera Android tablet Anda dan arahkan ke QR Code di bawah untuk langsung membuka Player yang terikat ke <strong>{selectedStation?.name || 'Stasiun'}</strong>:
                            </p>

                            <div style={{
                                backgroundColor: '#ffffff',
                                padding: '16px',
                                borderRadius: '12px',
                                display: 'inline-block',
                                boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                                marginBottom: '18px'
                            }}>
                                <QRCode value={playerTargetUrl} size={180} />
                            </div>

                            <div style={{ fontSize: '12px', color: '#94a3b8', wordBreak: 'break-all', maxWidth: '320px' }}>
                                {playerTargetUrl}
                            </div>
                        </div>

                        {/* Capacitor APK Build Instructions */}
                        <div style={{
                            backgroundColor: '#1e293b',
                            border: '1px solid #334155',
                            borderRadius: '14px',
                            padding: '24px',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between'
                        }}>
                            <div>
                                <div style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    backgroundColor: '#334155',
                                    color: '#cbd5e1',
                                    padding: '4px 10px',
                                    borderRadius: '6px',
                                    fontSize: '12px',
                                    fontWeight: 700,
                                    marginBottom: '12px'
                                }}>
                                    📱 Capacitor Android (.apk)
                                </div>
                                <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 700, color: '#ffffff' }}>
                                    Native Android APK & Zebra DataWedge
                                </h3>
                                <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#cbd5e1', lineHeight: '1.6' }}>
                                    Bungkus web player ini menjadi file <code>MandorPlayer.apk</code> untuk tablet Samsung, Lenovo, dan scanner industri Zebra TC21/TC26 / Honeywell.
                                </p>

                                <div style={{
                                    backgroundColor: '#0f172a',
                                    padding: '14px',
                                    borderRadius: '8px',
                                    fontSize: '12px',
                                    fontFamily: 'monospace',
                                    color: '#34d399',
                                    lineHeight: '1.8',
                                    marginBottom: '16px'
                                }}>
                                    npx cap init "Mandor Player" "com.mandor.player"<br />
                                    npx cap add android<br />
                                    npm run build &amp;&amp; npx cap sync android<br />
                                    npx cap open android
                                </div>

                                <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '13px', color: '#94a3b8', lineHeight: '1.7' }}>
                                    <li><strong>Hardware Trigger:</strong> Scanner laser barcode langsung memicu event input</li>
                                    <li><strong>Android LockTask / Kiosk:</strong> Mengunci tombol Back dan Home</li>
                                    <li><strong>Offline Local Cache:</strong> Tetap aktif saat Wi-Fi lantai pabrik drop</li>
                                </ul>
                            </div>

                            <button
                                onClick={() => handleCopy('npx cap add android && npm run build && npx cap sync android', 'Perintah Capacitor tersalin!')}
                                style={{
                                    marginTop: '24px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '10px',
                                    backgroundColor: '#059669',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '10px',
                                    padding: '14px 20px',
                                    fontSize: '14px',
                                    fontWeight: 700,
                                    cursor: 'pointer'
                                }}
                            >
                                <Copy size={18} /> Salin Perintah Build APK
                            </button>
                        </div>
                    </div>
                )}

                {/* TAB 3: PWA KIOSK */}
                {activeTab === 'pwa' && (
                    <div style={{
                        backgroundColor: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '14px',
                        padding: '28px'
                    }}>
                        <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            backgroundColor: 'rgba(56, 189, 248, 0.15)',
                            color: '#38bdf8',
                            padding: '4px 10px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: 700,
                            marginBottom: '14px'
                        }}>
                            🌐 Progressive Web App (PWA)
                        </div>
                        <h3 style={{ margin: '0 0 10px 0', fontSize: '20px', fontWeight: 700, color: '#ffffff' }}>
                            Pasang Mandor Player Sebagai Aplikasi Desktop / Mobile Tanpa Install File Apapun
                        </h3>
                        <p style={{ margin: '0 0 24px 0', fontSize: '14px', color: '#cbd5e1', lineHeight: '1.6', maxWidth: '800px' }}>
                            Mandor Player sudah terdaftar dengan manifest PWA. Anda dapat meng-install aplikasi ini langsung dari browser di PC Windows, Mac, maupun Android tanpa perlu mengunduh file installer.
                        </p>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '24px' }}>
                            <div style={{ backgroundColor: '#0f172a', padding: '18px', borderRadius: '10px', border: '1px solid #334155' }}>
                                <div style={{ fontSize: '14px', fontWeight: 700, color: '#60a5fa', marginBottom: '8px' }}>
                                    💻 Cara Install di Windows (Chrome / Edge):
                                </div>
                                <ol style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#94a3b8', lineHeight: '1.7' }}>
                                    <li>Buka URL Player di browser: <code style={{ color: '#38bdf8' }}>{playerTargetUrl}</code></li>
                                    <li>Klik icon <strong>Install</strong> (tanda komputer dengan tanda panah ke bawah di address bar kanan atas).</li>
                                    <li>Aplikasi akan terpasang dengan icon Mandor Player di Desktop Windows Anda.</li>
                                </ol>
                            </div>

                            <div style={{ backgroundColor: '#0f172a', padding: '18px', borderRadius: '10px', border: '1px solid #334155' }}>
                                <div style={{ fontSize: '14px', fontWeight: 700, color: '#34d399', marginBottom: '8px' }}>
                                    📱 Cara Install di Android Tablet:
                                </div>
                                <ol style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#94a3b8', lineHeight: '1.7' }}>
                                    <li>Buka URL Player di Google Chrome Android.</li>
                                    <li>Klik tombol menu titik tiga (⋮) di pojok kanan atas.</li>
                                    <li>Pilih <strong>"Add to Home Screen" (Tambahkan ke Layar Utama)</strong>.</li>
                                    <li>Aplikasi akan berjalan fullscreen tanpa address bar.</li>
                                </ol>
                            </div>
                        </div>

                        <button
                            onClick={() => window.open(playerTargetUrl, '_blank')}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                backgroundColor: '#2563eb',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '12px 24px',
                                fontSize: '14px',
                                fontWeight: 700,
                                cursor: 'pointer'
                            }}
                        >
                            <ExternalLink size={16} /> Buka Player Sekarang Untuk Install PWA
                        </button>
                    </div>
                )}

                {/* TAB 4: STATION PAIRING */}
                {activeTab === 'pairing' && (
                    <div style={{
                        backgroundColor: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '14px',
                        padding: '28px'
                    }}>
                        <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            backgroundColor: 'rgba(234, 179, 8, 0.15)',
                            color: '#facc15',
                            padding: '4px 10px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: 700,
                            marginBottom: '14px'
                        }}>
                            🔗 Konsep Station Pairing Seperti Tulip
                        </div>
                        <h3 style={{ margin: '0 0 10px 0', fontSize: '20px', fontWeight: 700, color: '#ffffff' }}>
                            Bagaimana Player Terhubung ke Stasiun Fisik di Pabrik?
                        </h3>
                        <p style={{ margin: '0 0 24px 0', fontSize: '14px', color: '#cbd5e1', lineHeight: '1.6', maxWidth: '850px' }}>
                            Di sistem Tulip, Player yang baru pertama kali dibuka di PC/Tablet akan menampilkan <strong>6-Karakter Pairing Code</strong>. Admin pabrik memasukkan kode tersebut ke <strong>Station Manager</strong> untuk mengesahkan perangkat fisik tersebut.
                        </p>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '24px' }}>
                            <div style={{ backgroundColor: '#0f172a', padding: '20px', borderRadius: '10px', border: '1px solid #334155' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                                    <span style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#2563eb', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '13px' }}>1</span>
                                    <h4 style={{ margin: 0, fontSize: '15px', color: '#ffffff' }}>Buka Player di Perangkat</h4>
                                </div>
                                <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8', lineHeight: '1.6' }}>
                                    Install Mandor Player di PC Windows atau Tablet Android operator. Buka aplikasi tersebut untuk pertama kali.
                                </p>
                            </div>

                            <div style={{ backgroundColor: '#0f172a', padding: '20px', borderRadius: '10px', border: '1px solid #334155' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                                    <span style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#2563eb', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '13px' }}>2</span>
                                    <h4 style={{ margin: 0, fontSize: '15px', color: '#ffffff' }}>Masukkan Kode Pairing</h4>
                                </div>
                                <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8', lineHeight: '1.6' }}>
                                    Pilih stasiun kerja (contoh: <em>{selectedStation?.name || 'Assembly Station'}</em>) dan masukkan kode <strong>{pairingCode}</strong>, atau scan QR code yang tampil di layar stasiun.
                                </p>
                            </div>

                            <div style={{ backgroundColor: '#0f172a', padding: '20px', borderRadius: '10px', border: '1px solid #334155' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                                    <span style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#10b981', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '13px' }}>3</span>
                                    <h4 style={{ margin: 0, fontSize: '15px', color: '#ffffff' }}>Otomatis Terikat &amp; Siap Kerja</h4>
                                </div>
                                <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8', lineHeight: '1.6' }}>
                                    Perangkat akan otomatis mengunduh aplikasi &amp; checksheet yang ditugaskan ke stasiun tersebut. Operator login dengan ID Badge / Barcode.
                                </p>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '12px' }}>
                            <a
                                href="#/stations"
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    backgroundColor: '#0f172a',
                                    color: '#38bdf8',
                                    textDecoration: 'none',
                                    border: '1px solid #334155',
                                    borderRadius: '8px',
                                    padding: '10px 20px',
                                    fontSize: '13px',
                                    fontWeight: 600
                                }}
                            >
                                <ArrowRight size={16} /> Buka Station Manager
                            </a>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}

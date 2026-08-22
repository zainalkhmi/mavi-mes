import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import {
    Search, Play, Square, RefreshCw, ExternalLink, User, MapPin,
    Rocket, Clock3, Package, Maximize2, Minimize2, Star, LayoutGrid,
    AlertTriangle, RotateCcw, X, ChevronRight, Pause, MessageSquare, Info, Code, Play as PlayIcon,
    Wifi, Cpu, HardDrive, CheckCircle2, XCircle, AlertCircle, Signal, Bug,
    Languages, Camera, PenTool, Globe, Plus, FilePlus, Settings2, Sparkles, CheckCircle2 as CheckIcon,
    LogOut, Menu, ChevronDown, BookOpen, ChevronLeft, Smartphone, Tablet, Monitor, RotateCw
} from 'lucide-react';
import { DEVICE_PRESETS } from './appbuilder/utils';
import { getAllFrontlineApps, getProductionQueue, logPlayerSession, saveFrontlineApp } from '../utils/supabaseFrontlineDB';
import { getStations, getEdgeDevices, createTable, getTables } from '../utils/database';
import iotConnector from '../utils/iotConnector';
import { useLanguage } from '../contexts/LanguageContext';
import { createIncomingInspectionTemplate } from '../utils/incomingInspectionTemplate';
import { createProductDrawingInspectionTemplate } from '../utils/productDrawingInspectionTemplate';
import { createQuickBuildCadVisionTemplate } from '../utils/quickbuildVisionDrawingTemplate';
import { logout } from '../utils/auth';

// ─── helpers ────────────────────────────────────────────────────────────────

const LS_FAVORITES = 'mavi_player_favorites';
const LS_RECENT = 'mavi_player_recent';
const LS_DEV_MODE = 'mavi_player_dev_mode';
const LS_APP_SCALE_MODE = 'mavi_player_app_scale_mode_v2';
const RECENT_MAX = 5;

function loadLS(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
    catch { return fallback; }
}

function saveLS(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* noop */ }
}

function nameToHue(str = '') {
    let hash = 0;
    for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
    return Math.abs(hash) % 360;
}

function appGradient(name) {
    const h = nameToHue(name);
    return `linear-gradient(135deg, hsl(${h},70%,55%) 0%, hsl(${(h + 40) % 360},80%,40%) 100%)`;
}

const formatDuration = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

// ─── sub-components ──────────────────────────────────────────────────────────

function FilterTabs({ active, onChange }) {
    const tabs = ['All', 'Recent', 'Favorites', 'Pending'];
    return (
        <div style={{ display: 'flex', gap: '4px', marginBottom: '10px' }}>
            {tabs.map((t) => (
                <button
                    key={t}
                    onClick={() => onChange(t)}
                    style={{
                        flex: 1,
                        padding: '6px 0',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        backgroundColor: active === t ? '#2563eb' : '#f1f5f9',
                        color: active === t ? 'white' : '#64748b',
                        transition: 'all 0.15s'
                    }}
                >
                    {t}
                </button>
            ))}
        </div>
    );
}

function AppCard({ app, isActive, isFavorite, isRecent, onLaunch, onFavorite }) {
    const gradient = appGradient(app.name);
    const bgImage = app.config?.thumbnail ? `url(${app.config.thumbnail})` : gradient;
    
    const handleLaunchClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        onLaunch(app);
    };
    
    const getStatusStyle = (status) => {
        if (status === 'PUBLISHED') return { bg: '#dcfce7', text: '#166534' };
        if (status === 'PENDING') return { bg: '#fef9c3', text: '#854d0e' };
        return { bg: '#f1f5f9', text: '#475569' };
    };
    const statusStyle = getStatusStyle(app.approval_status || 'DRAFT');

    return (
        <div
            style={{
                borderRadius: '12px',
                border: `1px solid ${isActive ? '#93c5fd' : '#e2e8f0'}`,
                backgroundColor: isActive ? '#eff6ff' : '#fff',
                marginBottom: '10px',
                overflow: 'hidden',
                boxShadow: isActive ? '0 0 0 2px rgba(59,130,246,0.2)' : 'none',
                transition: 'box-shadow 0.2s, border-color 0.2s'
            }}
        >
            {/* thumbnail */}
            <div style={{
                height: '64px',
                background: bgImage,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                padding: '8px 12px',
                position: 'relative'
            }}>
                {/* Overlay gradient for text readability if using an image */}
                {app.config?.thumbnail && (
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, transparent 100%)' }} />
                )}
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Rocket size={16} color="white" />
                        <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'white', textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>
                            {app.name}
                        </span>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                        <span style={{ fontSize: '0.6rem', fontWeight: 700, backgroundColor: statusStyle.bg, color: statusStyle.text, padding: '1px 6px', borderRadius: '4px' }}>
                            {app.approval_status || 'DRAFT'}
                        </span>
                        <span style={{ fontSize: '0.6rem', fontWeight: 700, backgroundColor: 'rgba(0,0,0,0.4)', color: 'white', padding: '1px 6px', borderRadius: '4px', backdropFilter: 'blur(2px)' }}>
                            v{app.version || 1}
                        </span>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', position: 'absolute', right: '12px', top: '8px', zIndex: 1 }}>
                    <button
                        onClick={(e) => { e.stopPropagation(); onFavorite(app.id); }}
                        title={isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
                        style={{
                            background: 'rgba(255,255,255,0.2)',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '4px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: isFavorite ? '#fde68a' : 'rgba(255,255,255,0.7)',
                            transition: 'color 0.15s'
                        }}
                    >
                        <Star size={14} fill={isFavorite ? '#fde68a' : 'none'} />
                    </button>
                </div>
            </div>

            {/* actions */}
            <div style={{ padding: '8px 10px', display: 'flex', gap: '6px', alignItems: 'center' }}>
                {isRecent && (
                    <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#7c3aed', backgroundColor: '#f3e8ff', borderRadius: '4px', padding: '2px 6px' }}>
                        Recent
                    </span>
                )}
                {app.category && (
                    <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#0369a1', backgroundColor: '#e0f2fe', borderRadius: '4px', padding: '2px 6px' }}>
                        {app.category}
                    </span>
                )}
                <button
                    type="button"
                    onClick={handleLaunchClick}
                    style={{
                        marginLeft: 'auto',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        border: `1px solid ${isActive ? '#3b82f6' : '#3b82f6'}`,
                        backgroundColor: isActive ? '#3b82f6' : '#eff6ff',
                        color: isActive ? 'white' : '#2563eb',
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        transition: 'all 0.15s'
                    }}
                >
                    <Play size={12} />
                    {isActive ? 'Running' : 'Launch'}
                </button>
            </div>
        </div>
    );
}

function AuthModal({ app, operatorDefault, stationDefault, stations = [], onConfirm, onCancel }) {
    const [opName, setOpName] = useState(operatorDefault || '');
    const [stn, setStn] = useState(stationDefault || (stations[0]?.id || ''));
    const [isScanning, setIsScanning] = useState(false);
    const badgeBuffer = useRef('');
    const lastKeyTime = useRef(0);
    const hue = nameToHue(app?.name || '');

    useEffect(() => {
        const handleKeyDown = (e) => {
            const now = Date.now();
            
            // Fast typing (scanner simulation)
            if (now - lastKeyTime.current < 50) {
                setIsScanning(true);
            }
            
            if (e.key === 'Enter') {
                if (badgeBuffer.current.length > 2) {
                    // Valid badge scanned
                    const scannedValue = badgeBuffer.current;
                    setOpName(scannedValue);
                    onConfirm(scannedValue, stn || 'Station-01');
                }
                badgeBuffer.current = '';
                setIsScanning(false);
            } else if (e.key.length === 1) {
                badgeBuffer.current += e.key;
            }
            
            lastKeyTime.current = now;
            
            // Reset buffer if idle for too long
            setTimeout(() => {
                if (Date.now() - lastKeyTime.current > 100) {
                    badgeBuffer.current = '';
                    setIsScanning(false);
                }
            }, 150);
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [stn, onConfirm]);

    return (
        <div style={{
            position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
            backdropFilter: 'blur(4px)'
        }}>
            <div style={{
                backgroundColor: 'white', borderRadius: '16px', width: '380px',
                boxShadow: '0 20px 60px rgba(0,0,0,0.3)', overflow: 'hidden'
            }}>
                <div style={{ background: appGradient(app?.name || ''), padding: '20px', position: 'relative' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Launch App
                            </div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'white', marginTop: '3px' }}>
                                {app?.name}
                            </div>
                        </div>
                        <button onClick={onCancel} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '6px', cursor: 'pointer', padding: '4px', color: 'white', display: 'flex' }}>
                            <X size={16} />
                        </button>
                    </div>
                </div>

                <div style={{ padding: '20px' }}>
                    {isScanning && (
                        <div style={{ 
                            marginBottom: '14px', padding: '10px', borderRadius: '8px', 
                            backgroundColor: '#eff6ff', border: '1px dashed #3b82f6',
                            display: 'flex', alignItems: 'center', gap: '8px',
                            animation: 'pulse 1.5s infinite'
                        }}>
                            <Rocket size={14} color="#3b82f6" />
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1d4ed8' }}>Waiting for Badge Scan...</span>
                        </div>
                    )}

                    <div style={{ marginBottom: '14px' }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '6px' }}>
                            <User size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                            Operator Name / Badge ID <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <input
                            autoFocus
                            value={opName}
                            onChange={(e) => setOpName(e.target.value)}
                            placeholder="Scan badge or enter name..."
                            style={{
                                width: '100%', padding: '8px 12px', borderRadius: '8px',
                                border: `1px solid ${opName.trim() ? '#cbd5e1' : '#fca5a5'}`,
                                fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box',
                                backgroundColor: opName.trim() ? 'white' : '#fff5f5'
                            }}
                        />
                        {!opName.trim() && !isScanning && (
                            <div style={{ fontSize: '0.7rem', color: '#ef4444', marginTop: '4px' }}>Operator name is required to launch.</div>
                        )}
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '6px' }}>
                            <MapPin size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                            Station
                        </label>
                        <select
                            value={stn}
                            onChange={(e) => setStn(e.target.value)}
                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box', backgroundColor: 'white' }}
                        >
                            <option value="">Select a Station...</option>
                            {stations.map(s => <option key={s.id} value={s.id}>{s.name} ({s.site})</option>)}
                        </select>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button type="button" onClick={onCancel} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: 'white', color: '#64748b', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}>
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onConfirm(opName.trim(), stn.trim() || 'Station-01');
                            }}
                            disabled={!opName.trim()}
                            style={{
                                flex: 2, padding: '10px', borderRadius: '8px', border: 'none',
                                background: opName.trim() ? `hsl(${hue},70%,45%)` : '#cbd5e1',
                                color: 'white', fontWeight: 700, fontSize: '0.85rem',
                                cursor: opName.trim() ? 'pointer' : 'not-allowed',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
                                transition: 'background 0.15s'
                            }}
                        >
                            <Play size={14} /> Launch App
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function DeviceConnectivityWidget() {
    const [devices, setDevices] = useState([]);
    const [iotStatus, setIotStatus] = useState('disconnected');

    useEffect(() => {
        getEdgeDevices().then(setDevices).catch(console.error);
        const unsub = iotConnector.subscribeStatus(s => setIotStatus(s.status));
        return () => unsub();
    }, []);

    const getStatusIcon = (status) => {
        if (status === 'ONLINE' || status === 'connected') return <CheckCircle2 size={12} color="#10b981" />;
        if (status === 'error' || status === 'OFFLINE') return <XCircle size={12} color="#ef4444" />;
        return <AlertCircle size={12} color="#f59e0b" />;
    };

    return (
        <div style={{ marginTop: 'auto', padding: '16px', borderTop: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Wifi size={12} /> Device Connectivity
                </div>
                <div style={{ 
                    fontSize: '0.6rem', fontWeight: 700, padding: '2px 6px', borderRadius: '4px',
                    backgroundColor: iotStatus === 'connected' ? '#dcfce7' : '#fee2e2',
                    color: iotStatus === 'connected' ? '#166534' : '#991b1b',
                    display: 'flex', alignItems: 'center', gap: '4px'
                }}>
                    <Signal size={10} /> MQTT: {iotStatus.toUpperCase()}
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '120px', overflowY: 'auto' }}>
                {devices.length === 0 ? (
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontStyle: 'italic' }}>No edge devices assigned.</div>
                ) : (
                    devices.map(d => (
                        <div key={d.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'white', padding: '6px 10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <HardDrive size={14} color="#64748b" />
                                <div style={{ minWidth: 0 }}>
                                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.name}</div>
                                    <div style={{ fontSize: '0.6rem', color: '#94a3b8' }}>{d.ipAddress || 'No IP'}</div>
                                </div>
                            </div>
                            {getStatusIcon(d.status || 'ONLINE')}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}



// ─── Modals ──────────────────────────────────────────────────────────────────

function CameraCaptureModal({ onCapture, onClose }) {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [stream, setStream] = useState(null);

    useEffect(() => {
        navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
            .then(s => {
                setStream(s);
                if (videoRef.current) videoRef.current.srcObject = s;
            })
            .catch(err => console.error("Camera access denied", err));

        return () => {
            if (stream) stream.getTracks().forEach(track => track.stop());
        };
    }, []);

    const handleCapture = () => {
        if (!videoRef.current || !canvasRef.current) return;
        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        if (stream) stream.getTracks().forEach(track => track.stop());
        onCapture(dataUrl);
    };

    const handleClose = () => {
        if (stream) stream.getTracks().forEach(track => track.stop());
        onClose();
    };

    return (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, backdropFilter: 'blur(4px)' }}>
            <div style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '90vw' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ color: 'white', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Camera size={18} /> Media Capture
                    </div>
                    <button onClick={handleClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={20} /></button>
                </div>
                <div style={{ backgroundColor: 'black', borderRadius: '8px', overflow: 'hidden', position: 'relative', width: '100%', maxWidth: '640px', aspectRatio: '4/3' }}>
                    <video ref={videoRef} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <canvas ref={canvasRef} style={{ display: 'none' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <button onClick={handleCapture} style={{ padding: '12px 32px', borderRadius: '30px', backgroundColor: '#3b82f6', color: 'white', border: 'none', fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 12px rgba(59,130,246,0.3)' }}>
                        Capture Photo
                    </button>
                </div>
            </div>
        </div>
    );
}

function ESignatureModal({ operator, onClose, onSign }) {
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');

    const getCoordinates = (e, canvas) => {
        const rect = canvas.getBoundingClientRect();
        if (e.touches && e.touches.length > 0) {
            return {
                x: e.touches[0].clientX - rect.left,
                y: e.touches[0].clientY - rect.top
            };
        }
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    };

    const startDrawing = (e) => {
        setIsDrawing(true);
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const { x, y } = getCoordinates(e, canvas);
        ctx.beginPath();
        ctx.moveTo(x, y);
    };

    const draw = (e) => {
        if (!isDrawing) return;
        e.preventDefault(); // Prevent scrolling on touch
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const { x, y } = getCoordinates(e, canvas);
        ctx.lineTo(x, y);
        ctx.stroke();
    };

    const stopDrawing = () => {
        setIsDrawing(false);
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.closePath();
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    };

    const handleSign = () => {
        if (pin.length < 4) {
            setError('Valid PIN is required for 21 CFR Part 11 compliance.');
            return;
        }
        const canvas = canvasRef.current;
        const signatureBase64 = canvas.toDataURL('image/png');
        onSign({ signatureBase64, operator, timestamp: new Date().toISOString() });
    };

    return (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, backdropFilter: 'blur(4px)' }}>
            <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '16px', width: '400px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ color: '#0f172a', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <PenTool size={18} color="#3b82f6" /> Digital Signature
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={20} /></button>
                </div>
                
                <div style={{ fontSize: '0.8rem', color: '#475569', backgroundColor: '#f1f5f9', padding: '10px', borderRadius: '8px' }}>
                    I, <strong>{operator || 'Operator'}</strong>, hereby electronically sign this record in accordance with 21 CFR Part 11.
                </div>

                <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', display: 'block', marginBottom: '6px' }}>Draw Signature</label>
                    <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#f8fafc', position: 'relative' }}>
                        <canvas 
                            ref={canvasRef}
                            width={350}
                            height={150}
                            style={{ width: '100%', height: '150px', cursor: 'crosshair', touchAction: 'none' }}
                            onMouseDown={startDrawing}
                            onMouseMove={draw}
                            onMouseUp={stopDrawing}
                            onMouseLeave={stopDrawing}
                            onTouchStart={startDrawing}
                            onTouchMove={draw}
                            onTouchEnd={stopDrawing}
                        />
                        <button onClick={clearCanvas} style={{ position: 'absolute', top: '8px', right: '8px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '0.65rem', padding: '2px 6px', cursor: 'pointer' }}>Clear</button>
                    </div>
                </div>

                <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', display: 'block', marginBottom: '6px' }}>Operator PIN / Password</label>
                    <input 
                        type="password" 
                        value={pin}
                        onChange={(e) => { setPin(e.target.value); setError(''); }}
                        placeholder="Enter 4-digit PIN"
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: `1px solid ${error ? '#ef4444' : '#cbd5e1'}`, fontSize: '0.85rem' }}
                    />
                    {error && <div style={{ fontSize: '0.7rem', color: '#ef4444', marginTop: '4px' }}>{error}</div>}
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                    <button onClick={onClose} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: 'white', fontWeight: 700, color: '#64748b', cursor: 'pointer' }}>Cancel</button>
                    <button onClick={handleSign} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', backgroundColor: '#3b82f6', color: 'white', fontWeight: 800, cursor: 'pointer' }}>Sign & Verify</button>
                </div>
            </div>
        </div>
    );
}

function NewAppModal({ onConfirm, onCancel }) {
    const [step, setStep] = useState(1);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [selectedDevice, setSelectedDevice] = useState('IPHONE_14');
    const [selectedOrientation, setSelectedOrientation] = useState('PORTRAIT');

    // Custom size state
    const [useCustomSize, setUseCustomSize] = useState(false);
    const [customWidth, setCustomWidth] = useState(360);
    const [customHeight, setCustomHeight] = useState(640);
    const [customLabel, setCustomLabel] = useState('Custom Device');

    const templates = [
        {
            id: 'incoming-inspection',
            name: 'Incoming Quality Inspection',
            description: 'Professional incoming material inspection with dimensional checks and auto pass/fail.',
            icon: <Search size={24} color="#0284c7" />,
            bg: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
            accent: '#0284c7'
        },
        {
            id: 'product-drawing-inspection',
            name: 'Product Drawing QC Terminal',
            description: 'Interactive quality terminal using 2D engineering blueprints and 3D CAD digital twins.',
            icon: <PenTool size={24} color="#8b5cf6" />,
            bg: 'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)',
            accent: '#8b5cf6'
        }
    ];

    // Group devices by kind
    const deviceGroups = {
        PHONE: Object.entries(DEVICE_PRESETS).filter(([, p]) => p.kind === 'PHONE'),
        TABLET: Object.entries(DEVICE_PRESETS).filter(([, p]) => p.kind === 'TABLET'),
        PC: Object.entries(DEVICE_PRESETS).filter(([, p]) => p.kind === 'PC'),
        TV: Object.entries(DEVICE_PRESETS).filter(([, p]) => p.kind === 'TV'),
    };

    // Calculate canvas dimensions based on selection
    const getCanvasDimensions = () => {
        if (useCustomSize) {
            return selectedOrientation === 'PORTRAIT'
                ? { width: customWidth, height: customHeight }
                : { width: customHeight, height: customWidth };
        }
        const preset = DEVICE_PRESETS[selectedDevice];
        if (!preset || selectedDevice === 'RESPONSIVE') {
            return { width: 1000, height: 625 };
        }
        return selectedOrientation === 'PORTRAIT'
            ? { width: preset.width, height: preset.height }
            : { width: preset.height, height: preset.width };
    };

    const selectedPreset = DEVICE_PRESETS[selectedDevice];
    const canvasDim = getCanvasDimensions();

    // Scale factor for visual preview
    const previewScale = Math.min(80 / canvasDim.width, 120 / canvasDim.height, 1);
    const previewWidth = canvasDim.width * previewScale;
    const previewHeight = canvasDim.height * previewScale;

    const handleTemplateSelect = (templateId) => {
        setSelectedTemplate(templateId);
        // Auto-detect recommended device based on template
        if (templateId === 'product-drawing-inspection') {
            setSelectedDevice('DESKTOP_FHD');
        } else {
            setSelectedDevice('IPHONE_14');
        }
        setStep(2);
    };

    const handleConfirm = () => {
        onConfirm({
            templateId: selectedTemplate,
            devicePreset: useCustomSize ? 'CUSTOM' : selectedDevice,
            orientation: selectedOrientation,
            customWidth: useCustomSize ? customWidth : undefined,
            customHeight: useCustomSize ? customHeight : undefined,
            customLabel: useCustomSize ? customLabel : undefined
        });
    };

    const handleBack = () => {
        setStep(1);
        setSelectedTemplate(null);
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
            backdropFilter: 'blur(8px)'
        }}>
            <div style={{
                backgroundColor: 'white', borderRadius: '24px', width: step === 1 ? '500px' : '800px',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', overflow: 'hidden'
            }}>
                <div style={{ padding: '24px 32px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                            {step === 1 ? 'Create New App' : 'Select Device Target'}
                        </h2>
                        <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                            {step === 1 ? 'Step 1: Choose a template' : 'Step 2: Choose target device & size'}
                        </p>
                    </div>
                    <button onClick={step === 1 ? onCancel : handleBack} style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', padding: '8px', cursor: 'pointer', color: '#64748b' }}>
                        {step === 1 ? <X size={20} /> : <ChevronLeft size={20} />}
                    </button>
                </div>

                {step === 1 ? (
                    /* Step 1: Template Selection */
                    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {templates.map(t => (
                            <div
                                key={t.id}
                                onClick={() => handleTemplateSelect(t.id)}
                                style={{
                                    padding: '20px', borderRadius: '16px', border: '2px solid #f1f5f9',
                                    background: t.bg, cursor: 'pointer', transition: 'all 0.2s',
                                    display: 'flex', gap: '16px', alignItems: 'center'
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.borderColor = t.accent;
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.borderColor = '#f1f5f9';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                }}
                            >
                                <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                                    {t.icon}
                                </div>
                                <div>
                                    <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '1rem' }}>{t.name}</div>
                                    <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: '2px', lineHeight: 1.4 }}>{t.description}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    /* Step 2: Device Selection with Visual Preview */
                    <div style={{ padding: '24px', display: 'flex', gap: '24px' }}>
                        {/* Left Panel: Device List */}
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '400px' }}>
                            {/* Device Kind Tabs */}
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                                {Object.entries(deviceGroups).map(([kind, devices]) => {
                                    if (devices.length === 0) return null;
                                    const isActive = devices.some(([key]) => selectedDevice === key) || (kind === 'PHONE' && selectedDevice === 'RESPONSIVE');
                                    return (
                                        <button
                                            key={kind}
                                            style={{
                                                padding: '4px 10px', borderRadius: '6px', border: 'none',
                                                backgroundColor: isActive ? '#3b82f6' : '#f1f5f9',
                                                color: isActive ? 'white' : '#64748b', fontSize: '0.7rem', fontWeight: 700,
                                                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'
                                            }}
                                        >
                                            {kind === 'PHONE' && <Smartphone size={12} />}
                                            {kind === 'TABLET' && <Tablet size={12} />}
                                            {kind === 'PC' && <Monitor size={12} />}
                                            {kind === 'TV' && <Monitor size={12} />}
                                            {kind}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Device List */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '280px', overflowY: 'auto' }}>
                                {/* Responsive Option */}
                                <div
                                    onClick={() => { setSelectedDevice('RESPONSIVE'); setUseCustomSize(false); }}
                                    style={{
                                        padding: '12px', borderRadius: '10px', border: `2px solid ${selectedDevice === 'RESPONSIVE' && !useCustomSize ? '#3b82f6' : '#e2e8f0'}`,
                                        backgroundColor: selectedDevice === 'RESPONSIVE' && !useCustomSize ? '#eff6ff' : 'white',
                                        cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '10px'
                                    }}
                                >
                                    <LayoutGrid size={18} color={selectedDevice === 'RESPONSIVE' && !useCustomSize ? '#3b82f6' : '#64748b'} />
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 700, fontSize: '0.8rem', color: selectedDevice === 'RESPONSIVE' && !useCustomSize ? '#1e40af' : '#0f172a' }}>Responsive</div>
                                        <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>Adapts to any screen</div>
                                    </div>
                                </div>

                                {/* All Preset Devices */}
                                {Object.entries(deviceGroups).flatMap(([, devices]) => devices).map(([key, preset]) => {
                                    const PresetIcon = preset.icon || LayoutGrid;
                                    const isSelected = selectedDevice === key && !useCustomSize;
                                    return (
                                        <div
                                            key={key}
                                            onClick={() => { setSelectedDevice(key); setUseCustomSize(false); }}
                                            style={{
                                                padding: '12px', borderRadius: '10px', border: `2px solid ${isSelected ? '#3b82f6' : '#e2e8f0'}`,
                                                backgroundColor: isSelected ? '#eff6ff' : 'white',
                                                cursor: 'pointer', transition: 'all 0.2s'
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                                                <PresetIcon size={16} color={isSelected ? '#3b82f6' : '#64748b'} />
                                                <span style={{ fontWeight: 700, fontSize: '0.75rem', color: isSelected ? '#1e40af' : '#0f172a' }}>
                                                    {preset.label.split('(')[0].trim()}
                                                </span>
                                            </div>
                                            <div style={{ display: 'flex', gap: '4px' }}>
                                                {['PORTRAIT', 'LANDSCAPE'].map(orient => (
                                                    <button
                                                        key={orient}
                                                        onClick={e => { e.stopPropagation(); setSelectedOrientation(orient); setUseCustomSize(false); setSelectedDevice(key); }}
                                                        style={{
                                                            flex: 1, padding: '4px', borderRadius: '4px',
                                                            border: `1px solid ${selectedOrientation === orient && isSelected ? '#3b82f6' : '#e2e8f0'}`,
                                                            backgroundColor: selectedOrientation === orient && isSelected ? '#3b82f6' : 'white',
                                                            color: selectedOrientation === orient && isSelected ? 'white' : '#64748b',
                                                            fontSize: '0.65rem', fontWeight: 600, cursor: 'pointer'
                                                        }}
                                                    >
                                                        {orient === 'PORTRAIT' ? 'P' : 'L'}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}

                                {/* Custom Size Option */}
                                <div
                                    onClick={() => setUseCustomSize(true)}
                                    style={{
                                        padding: '12px', borderRadius: '10px', border: `2px solid ${useCustomSize ? '#8b5cf6' : '#e2e8f0'}`,
                                        backgroundColor: useCustomSize ? '#faf5ff' : 'white',
                                        cursor: 'pointer', transition: 'all 0.2s'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                                        <Settings2 size={16} color={useCustomSize ? '#8b5cf6' : '#64748b'} />
                                        <span style={{ fontWeight: 700, fontSize: '0.75rem', color: useCustomSize ? '#7c3aed' : '#0f172a' }}>Custom Size</span>
                                    </div>
                                    {useCustomSize && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            <input
                                                type="text"
                                                value={customLabel}
                                                onChange={e => setCustomLabel(e.target.value)}
                                                placeholder="Device name"
                                                style={{ padding: '6px 8px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.75rem' }}
                                            />
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <div style={{ flex: 1 }}>
                                                    <label style={{ fontSize: '0.6rem', color: '#64748b', display: 'block', marginBottom: '2px' }}>Width</label>
                                                    <input
                                                        type="number"
                                                        value={customWidth}
                                                        onChange={e => setCustomWidth(Number(e.target.value))}
                                                        style={{ width: '100%', padding: '6px 8px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.75rem' }}
                                                    />
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <label style={{ fontSize: '0.6rem', color: '#64748b', display: 'block', marginBottom: '2px' }}>Height</label>
                                                    <input
                                                        type="number"
                                                        value={customHeight}
                                                        onChange={e => setCustomHeight(Number(e.target.value))}
                                                        style={{ width: '100%', padding: '6px 8px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.75rem' }}
                                                    />
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', gap: '4px' }}>
                                                {['PORTRAIT', 'LANDSCAPE'].map(orient => (
                                                    <button
                                                        key={orient}
                                                        onClick={e => { e.stopPropagation(); setSelectedOrientation(orient); }}
                                                        style={{
                                                            flex: 1, padding: '4px', borderRadius: '4px',
                                                            border: `1px solid ${selectedOrientation === orient ? '#8b5cf6' : '#e2e8f0'}`,
                                                            backgroundColor: selectedOrientation === orient ? '#8b5cf6' : 'white',
                                                            color: selectedOrientation === orient ? 'white' : '#64748b',
                                                            fontSize: '0.65rem', fontWeight: 600, cursor: 'pointer'
                                                        }}
                                                    >
                                                        {orient === 'PORTRAIT' ? 'Portrait' : 'Landscape'}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Right Panel: Visual Preview */}
                        <div style={{ width: '200px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {/* Device Preview */}
                            <div style={{
                                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                backgroundColor: '#f8fafc', borderRadius: '12px', padding: '16px', minHeight: '300px'
                            }}>
                                <div style={{ marginBottom: '12px', fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Preview</div>

                                {/* Device Frame */}
                                <div style={{
                                    position: 'relative',
                                    padding: '12px',
                                    backgroundColor: useCustomSize ? '#2a2a38' : (selectedPreset?.kind === 'PHONE' ? '#1a1a2e' : selectedPreset?.kind === 'TABLET' ? '#2a2a38' : 'transparent'),
                                    borderRadius: selectedDevice !== 'RESPONSIVE' && !useCustomSize ? (selectedPreset?.kind === 'PHONE' ? '20px' : '8px') : '4px',
                                    boxShadow: selectedDevice !== 'RESPONSIVE' && !useCustomSize ? '0 4px 20px rgba(0,0,0,0.3)' : 'none'
                                }}>
                                    {/* Notch for phones */}
                                    {selectedDevice !== 'RESPONSIVE' && !useCustomSize && selectedPreset?.kind === 'PHONE' && (
                                        <div style={{
                                            position: 'absolute', top: '6px', left: '50%', transform: 'translateX(-50%)',
                                            width: '40px', height: '6px', backgroundColor: '#000', borderRadius: '3px'
                                        }} />
                                    )}

                                    {/* Screen */}
                                    <div style={{
                                        width: `${previewWidth}px`,
                                        height: `${previewHeight}px`,
                                        backgroundColor: 'white',
                                        borderRadius: selectedDevice === 'RESPONSIVE' || useCustomSize ? '2px' : '8px',
                                        overflow: 'hidden',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        padding: '4px'
                                    }}>
                                        {/* Mock content */}
                                        <div style={{ backgroundColor: '#e2e8f0', height: '20%', borderRadius: '2px', marginBottom: '2px' }} />
                                        <div style={{ backgroundColor: '#cbd5e1', flex: 1, borderRadius: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <span style={{ fontSize: '6px', color: '#94a3b8' }}>Content</span>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ marginTop: '12px', textAlign: 'center' }}>
                                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#0f172a' }}>
                                        {useCustomSize ? customLabel : (selectedPreset?.label?.split('(')[0].trim() || 'Responsive')}
                                    </div>
                                    <div style={{ fontSize: '0.65rem', color: '#64748b', marginTop: '2px' }}>
                                        {canvasDim.width} × {canvasDim.height}px
                                    </div>
                                    <div style={{ fontSize: '0.6rem', color: '#94a3b8', marginTop: '2px' }}>
                                        {selectedOrientation}
                                    </div>
                                </div>
                            </div>

                            {/* Create Button */}
                            <button
                                onClick={handleConfirm}
                                style={{
                                    padding: '14px', borderRadius: '12px', border: 'none',
                                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                                    color: 'white', fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                                }}
                            >
                                <Rocket size={16} /> Create App
                            </button>
                        </div>
                    </div>
                )}

                {step === 1 && (
                    <div style={{ padding: '16px 24px', backgroundColor: '#f8fafc', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end' }}>
                        <button onClick={onCancel} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: 'white', color: '#64748b', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}>
                            Cancel
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── AppHelpGuideScreen ──────────────────────────────────────────────────────

function renderMarkdown(md = '') {
    const lines = md.split('\n');
    const elements = [];
    let key = 0;
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const applyInline = (text) => {
            // bold **text**
            const parts = text.split(/(\*\*[^*]+\*\*)/g);
            return parts.map((p, j) =>
                p.startsWith('**') && p.endsWith('**')
                    ? <strong key={j} style={{ color: '#f8fafc' }}>{p.slice(2, -2)}</strong>
                    : p
            );
        };
        if (line.startsWith('# ')) {
            elements.push(<h1 key={key++} style={{ fontSize: '1.5rem', fontWeight: 900, color: '#f8fafc', margin: '0 0 8px', letterSpacing: '-0.02em', lineHeight: 1.2 }}>{applyInline(line.slice(2))}</h1>);
        } else if (line.startsWith('## ')) {
            elements.push(<h2 key={key++} style={{ fontSize: '1rem', fontWeight: 800, color: '#a5b4fc', margin: '24px 0 8px', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(165,180,252,0.15)', paddingBottom: '6px' }}>{applyInline(line.slice(3))}</h2>);
        } else if (line.startsWith('### ')) {
            elements.push(<h3 key={key++} style={{ fontSize: '0.9rem', fontWeight: 700, color: '#93c5fd', margin: '12px 0 4px' }}>{applyInline(line.slice(4))}</h3>);
        } else if (line.startsWith('- ') || line.startsWith('* ')) {
            elements.push(
                <div key={key++} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', margin: '4px 0', fontSize: '0.88rem', color: '#cbd5e1', lineHeight: 1.55 }}>
                    <span style={{ color: '#6366f1', fontWeight: 900, flexShrink: 0, marginTop: '2px' }}>▸</span>
                    <span>{applyInline(line.slice(2))}</span>
                </div>
            );
        } else if (line.match(/^\d+\.\s/)) {
            const num = line.match(/^(\d+)\.\s/)[1];
            elements.push(
                <div key={key++} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', margin: '4px 0', fontSize: '0.88rem', color: '#cbd5e1', lineHeight: 1.55 }}>
                    <span style={{ minWidth: '22px', height: '22px', borderRadius: '50%', background: 'rgba(99,102,241,0.3)', border: '1px solid rgba(99,102,241,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 800, color: '#a5b4fc', flexShrink: 0 }}>{num}</span>
                    <span style={{ marginTop: '2px' }}>{applyInline(line.replace(/^\d+\.\s/, ''))}</span>
                </div>
            );
        } else if (line.startsWith('---') || line.startsWith('===')) {
            elements.push(<hr key={key++} style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.08)', margin: '16px 0' }} />);
        } else if (line.trim() === '') {
            elements.push(<div key={key++} style={{ height: '6px' }} />);
        } else {
            elements.push(<p key={key++} style={{ fontSize: '0.88rem', color: '#94a3b8', lineHeight: 1.65, margin: '4px 0' }}>{applyInline(line)}</p>);
        }
    }
    return elements;
}

function AppHelpGuideScreen({ app, helpGuide, onStart, onSkip }) {
    const handleStartClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        onStart();
    };

    const handleSkipClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        onSkip();
    };

    return (
        <div style={{
            position: 'absolute', inset: 0, zIndex: 50,
            display: 'flex', flexDirection: 'column',
            background: 'linear-gradient(135deg, #0a0f1e 0%, #0f172a 40%, #1a0a2e 100%)',
            overflow: 'hidden',
            fontFamily: '"Inter", system-ui, sans-serif'
        }}>
            {/* Animated background orbs */}
            <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
                <div style={{ position: 'absolute', top: '-80px', left: '-80px', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)', filter: 'blur(40px)' }} />
                <div style={{ position: 'absolute', bottom: '-60px', right: '-60px', width: '350px', height: '350px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)', filter: 'blur(40px)' }} />
                <div style={{ position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%,-50%)', width: '600px', height: '300px', background: 'radial-gradient(ellipse, rgba(139,92,246,0.06) 0%, transparent 70%)', filter: 'blur(60px)' }} />
            </div>

            {/* Header */}
            <div style={{
                flexShrink: 0, padding: '20px 32px 16px',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                background: 'rgba(0,0,0,0.3)',
                backdropFilter: 'blur(10px)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                position: 'relative', zIndex: 1
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{
                        width: '44px', height: '44px', borderRadius: '12px',
                        background: 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(59,130,246,0.3))',
                        border: '1px solid rgba(99,102,241,0.4)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 0 20px rgba(99,102,241,0.3)'
                    }}>
                        <BookOpen size={20} color="#a5b4fc" />
                    </div>
                    <div>
                        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Panduan Penggunaan</div>
                        <div style={{ fontSize: '1rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.01em' }}>{app?.name}</div>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={handleSkipClick}
                    title="Lewati panduan"
                    style={{
                        background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px', padding: '8px 14px', color: '#94a3b8',
                        cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600,
                        display: 'flex', alignItems: 'center', gap: '6px',
                        transition: 'all 0.15s'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = '#f1f5f9'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = '#94a3b8'; }}
                >
                    <ChevronLeft size={14} /> Lewati
                </button>
            </div>

            {/* Scrollable content */}
            <div style={{
                flex: 1, overflowY: 'auto', padding: '28px 32px',
                position: 'relative', zIndex: 1,
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgba(99,102,241,0.3) transparent'
            }}>
                <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                    {renderMarkdown(helpGuide)}
                </div>
            </div>

            {/* Footer CTA */}
            <div style={{
                flexShrink: 0, padding: '20px 32px',
                borderTop: '1px solid rgba(255,255,255,0.06)',
                background: 'rgba(0,0,0,0.4)',
                backdropFilter: 'blur(10px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: '16px', position: 'relative', zIndex: 1
            }}>
                <div style={{ fontSize: '0.8rem', color: '#64748b', textAlign: 'center' }}>
                    Baca panduan di atas sebelum memulai aplikasi
                </div>
                <button
                    type="button"
                    onClick={handleStartClick}
                    id="help-guide-start-btn"
                    style={{
                        padding: '12px 32px',
                        borderRadius: '12px',
                        border: 'none',
                        background: 'linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)',
                        color: 'white',
                        fontWeight: 800,
                        fontSize: '0.95rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        boxShadow: '0 4px 20px rgba(99,102,241,0.4), 0 0 40px rgba(99,102,241,0.15)',
                        transition: 'all 0.2s',
                        letterSpacing: '-0.01em'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(99,102,241,0.5), 0 0 60px rgba(99,102,241,0.2)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(99,102,241,0.4), 0 0 40px rgba(99,102,241,0.15)'; }}
                >
                    <Play size={16} /> Mulai Aplikasi
                </button>
            </div>
        </div>
    );
}

// ─── Main Component ──────────────────────────────────────────────────────────

const AppPlayer = () => {
    const [apps, setApps] = useState([]);
    const [stations, setStations] = useState([]);
    const [queue, setQueue] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    useEffect(() => {
        const h1 = () => setIsOnline(true);
        const h2 = () => setIsOnline(false);
        window.addEventListener('online', h1);
        window.addEventListener('offline', h2);
        return () => {
            window.removeEventListener('online', h1);
            window.removeEventListener('offline', h2);
        };
    }, []);
    
    // Auto-detect station from URL if available, else keep state
    const [stationIdFilter, setStationIdFilter] = useState(''); 
    const [operator, setOperator] = useState('');
    const [activeAppId, setActiveAppId] = useState('');
    const [sessionStartedAt, setSessionStartedAt] = useState(null);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);

    // Player states
    const [isPaused, setIsPaused] = useState(false);
    const [devMode, setDevMode] = useState(() => loadLS(LS_DEV_MODE, false));
    const [appScaleMode, setAppScaleMode] = useState(() => loadLS(LS_APP_SCALE_MODE, 'FIT_SCREEN'));
    const [appLayoutMode, setAppLayoutMode] = useState(() => {
        try {
            return localStorage.getItem('mavi_runtime_layout_mode') || 'PROPORTIONAL';
        } catch (e) {
            return 'PROPORTIONAL';
        }
    });
    const [showComments, setShowComments] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [sessionComments, setSessionComments] = useState([]);
    const [showTechDetails, setShowTechDetails] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);

    // Filter tab
    const [filterTab, setFilterTab] = useState('All');
    const [categoryFilter, setCategoryFilter] = useState('All');

    // Favorites & Recent (localStorage)
    const [favorites, setFavorites] = useState(() => loadLS(LS_FAVORITES, []));
    const [recentIds, setRecentIds] = useState(() => loadLS(LS_RECENT, []));

    // Step progress from postMessage
    const [stepProgress, setStepProgress] = useState(null); 

    // Fullscreen
    const [isFullscreen, setIsFullscreen] = useState(false);
    const playerContainerRef = useRef(null);
    const iframeRef = useRef(null);

    // Debugging states (Tulip parity)
    const [syncedVariables, setSyncedVariables] = useState([]);
    const [triggerHistory, setTriggerHistory] = useState([]);
    const [showDebugPanel, setShowDebugPanel] = useState(devMode); // Default show if dev mode
    const [activeDebugTab, setActiveDebugTab] = useState('variables'); // 'variables' | 'triggers'

    // Advanced Enterprise Features
    const { changeLanguage, currentLanguage } = useLanguage();
    const [themeColor, setThemeColor] = useState(() => loadLS('mavi_theme_color', '#1e293b'));
    const [companyLogo, setCompanyLogo] = useState(() => loadLS('mavi_company_logo', ''));
    
    // Modals
    const [showCameraModal, setShowCameraModal] = useState(false);
    const [showSignatureModal, setShowSignatureModal] = useState(false);

    // Auth modal
    const [pendingApp, setPendingApp] = useState(null);
    const [showNewAppModal, setShowNewAppModal] = useState(false);
    const [isCreating, setIsCreating] = useState(false);

    // Iframe error
    const [iframeError, setIframeError] = useState(false);
    const iframeLoadTimer = useRef(null);

    // Device Preset & Orientation in AppPlayer
    const [playerDevicePreset, setPlayerDevicePreset] = useState(null);
    const [playerOrientation, setPlayerOrientation] = useState(null);
    const [showPlayerDeviceMenu, setShowPlayerDeviceMenu] = useState(false);
    const playerDeviceMenuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (playerDeviceMenuRef.current && !playerDeviceMenuRef.current.contains(e.target)) {
                setShowPlayerDeviceMenu(false);
            }
        };
        if (showPlayerDeviceMenu) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [showPlayerDeviceMenu]);

    // Help Guide
    const [showHelpGuide, setShowHelpGuide] = useState(false);

    const activeApp = useMemo(() => apps.find((a) => a.id === activeAppId) || null, [apps, activeAppId]);
    const activeStationName = useMemo(() => stations.find(s => s.id === stationIdFilter)?.name || stationIdFilter, [stations, stationIdFilter]);

    const activeDevicePresetKey = useMemo(() => {
        if (playerDevicePreset && DEVICE_PRESETS[playerDevicePreset]) return playerDevicePreset;
        return activeApp?.config?.devicePreset || 'RESPONSIVE';
    }, [playerDevicePreset, activeApp]);

    const activeOrientation = useMemo(() => {
        if (playerOrientation) return playerOrientation;
        return activeApp?.config?.previewOrientation || 'PORTRAIT';
    }, [playerOrientation, activeApp]);

    const appLaunchUrl = useMemo(() => {
        if (!activeAppId) return '';
        const params = new URLSearchParams({ 
            station: stationIdFilter || 'Station-01', 
            operator: operator || 'Operator',
            devMode: devMode ? 'true' : 'false',
            scaleMode: appScaleMode,
            layoutMode: appLayoutMode,
            devicePreset: activeDevicePresetKey,
            orientation: activeOrientation
        });
        return `/#/terminal/${activeAppId}?${params.toString()}`;
    }, [activeAppId, stationIdFilter, operator, devMode, appScaleMode, appLayoutMode, activeDevicePresetKey, activeOrientation]);

    // ── Load data ────────────────────────────────────────────────────────────
    const loadData = async () => {
        setLoading(true);
        setError('');
        try {
            const [appRows, queueRows, stationRows] = await Promise.all([
                getAllFrontlineApps(),
                getProductionQueue().catch(() => []),
                getStations().catch(() => [])
            ]);
            setApps(appRows || []);
            setQueue(queueRows || []);
            setStations(stationRows || []);
            
            // Auto-detect station from URL parameter (supports both HashRouter and BrowserRouter search params)
            const getCombinedParams = () => {
                const searchParams = new URLSearchParams(window.location.search);
                const hash = window.location.hash || '';
                const hashSearchIndex = hash.indexOf('?');
                if (hashSearchIndex !== -1) {
                    const hashParams = new URLSearchParams(hash.substring(hashSearchIndex));
                    for (const [key, value] of hashParams.entries()) {
                        if (!searchParams.has(key)) searchParams.set(key, value);
                    }
                }
                return searchParams;
            };
            const params = getCombinedParams();
            const urlStation = params.get('station');
            if (urlStation) {
                setStationIdFilter(urlStation);
            } else if (stationRows.length > 0 && !stationIdFilter) {
                // If no station in URL, we could optionally default to the first one, 
                // but let's allow "All Stations" if none is selected
                // setStationIdFilter(stationRows[0].id);
            }

            const urlAppId = params.get('appId') || params.get('app');
            if (urlAppId && appRows && appRows.length > 0) {
                const app = appRows.find(a => a.id === urlAppId);
                if (app) {
                    setOperator(params.get('operator') || 'Designer');
                    setStationIdFilter(urlStation || 'Test Station 1');
                    setActiveAppId(urlAppId);
                    setSessionStartedAt(new Date());
                    setElapsedSeconds(0);
                    setStepProgress(null);
                    setIframeError(false);
                    setIsPaused(false);
                    setSessionComments([]);
                    clearTimeout(iframeLoadTimer.current);
                    iframeLoadTimer.current = setTimeout(() => setIframeError(true), 8000);
                }
            }
        } catch (err) {
            setError(err?.message || 'Failed to load apps');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, []);

    // Save devMode to local storage
    useEffect(() => {
        saveLS(LS_DEV_MODE, devMode);
    }, [devMode]);

    useEffect(() => {
        saveLS(LS_APP_SCALE_MODE, appScaleMode);
    }, [appScaleMode]);

    useEffect(() => {
        try {
            localStorage.setItem('mavi_runtime_layout_mode', appLayoutMode);
        } catch (e) {}
    }, [appLayoutMode]);

    // ── Timer ────────────────────────────────────────────────────────────────
    useEffect(() => {
        if (!sessionStartedAt) { setElapsedSeconds(0); return; }
        const id = setInterval(() => {
            if (!isPaused) {
                setElapsedSeconds(prev => prev + 1);
            }
        }, 1000);
        return () => clearInterval(id);
    }, [sessionStartedAt, isPaused]);

    // ── Fullscreen sync ──────────────────────────────────────────────────────
    useEffect(() => {
        const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', onFsChange);
        return () => document.removeEventListener('fullscreenchange', onFsChange);
    }, []);

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            playerContainerRef.current?.requestFullscreen?.();
        } else {
            document.exitFullscreen?.();
        }
    };

    // ── postMessage listener (Tulip parity: variables & triggers) ────────────────
    useEffect(() => {
        const handler = (e) => {
            if (e.data?.type === 'STEP_PROGRESS') {
                setStepProgress({
                    stepIndex: e.data.stepIndex ?? 0,
                    totalSteps: e.data.totalSteps ?? 0,
                    stepTitle: e.data.stepTitle || ''
                });
            } else if (e.data?.type === 'VARIABLES_SYNC') {
                setSyncedVariables(e.data.variables || []);
            } else if (e.data?.type === 'TRIGGER_FIRED') {
                setTriggerHistory(prev => [{
                    ...e.data,
                    id: Math.random().toString(36).substr(2, 9)
                }, ...prev].slice(0, 50));
            }
        };
        window.addEventListener('message', handler);
        return () => window.removeEventListener('message', handler);
    }, []);

    // ── Favorites ────────────────────────────────────────────────────────────
    const toggleFavorite = (appId) => {
        setFavorites((prev) => {
            const next = prev.includes(appId) ? prev.filter((id) => id !== appId) : [...prev, appId];
            saveLS(LS_FAVORITES, next);
            return next;
        });
    };

    // ── Filtered app list ────────────────────────────────────────────────────
    const filteredApps = useMemo(() => {
        let list = apps;

        // Station-based filtering
        if (stationIdFilter) {
            const stn = stations.find(s => s.id === stationIdFilter);
            if (stn && stn.assignedApps && stn.assignedApps.length > 0) {
                const assignedIds = stn.assignedApps.map(a => typeof a === 'string' ? a : a.id);
                list = list.filter(a => assignedIds.includes(a.id));
            } else if (stn) {
                // If a station is selected but has no assigned apps
                list = [];
            }
        }

        const q = search.trim().toLowerCase();
        if (q) list = list.filter((a) => (a.name || '').toLowerCase().includes(q));
        if (filterTab === 'Favorites') list = list.filter((a) => favorites.includes(a.id));
        if (filterTab === 'Recent') {
            const order = recentIds;
            list = list.filter((a) => order.includes(a.id)).sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
        }
        if (filterTab === 'Pending') {
            list = list.filter((a) => a.approval_status === 'PENDING');
        }
        if (categoryFilter !== 'All') {
            list = list.filter((a) => (a.category || 'Shop Floor') === categoryFilter);
        }
        return list;
    }, [apps, search, filterTab, favorites, recentIds, categoryFilter, stationIdFilter, stations]);

    // ── Launch flow ──────────────────────────────────────────────────────────
    const requestLaunch = (app) => {
        setPendingApp(app);
    };

    const confirmLaunch = (opName, stn) => {
        if (!pendingApp) return;
        setOperator(opName);
        setStationIdFilter(stn); // update station if changed in modal

        // Track recent
        setRecentIds((prev) => {
            const next = [pendingApp.id, ...prev.filter((id) => id !== pendingApp.id)].slice(0, RECENT_MAX);
            saveLS(LS_RECENT, next);
            return next;
        });

        setActiveAppId(pendingApp.id);
        setSessionStartedAt(new Date());
        setElapsedSeconds(0);
        setStepProgress(null);
        setIframeError(false);
        setIsPaused(false);
        setSessionComments([]);

        // Show help guide splash if app has one
        const launchingApp = apps.find(a => a.id === pendingApp.id);
        const guide = launchingApp?.config?.helpGuide || '';
        setShowHelpGuide(!!guide.trim());

        // Arm iframe error timeout (5 s) — only start counting after guide dismissed
        clearTimeout(iframeLoadTimer.current);
        if (!guide.trim()) {
            iframeLoadTimer.current = setTimeout(() => setIframeError(true), 8000);
        }

        setPendingApp(null);
    };

    const handleCreateTemplate = async (options) => {
        // Support both old signature (templateId string) and new signature (object)
        const templateId = typeof options === 'string' ? options : options?.templateId;
        const devicePreset = typeof options === 'object' ? (options?.devicePreset || 'RESPONSIVE') : 'RESPONSIVE';
        const orientation = typeof options === 'object' ? (options?.orientation || 'PORTRAIT') : 'PORTRAIT';
        const customWidth = typeof options === 'object' ? options?.customWidth : undefined;
        const customHeight = typeof options === 'object' ? options?.customHeight : undefined;
        const customLabel = typeof options === 'object' ? options?.customLabel : undefined;

        setShowNewAppModal(false);
        setIsCreating(true);
        try {
            let templateApp;
            if (templateId === 'product-drawing-inspection') {
                templateApp = createProductDrawingInspectionTemplate();
                try {
                    const plTable = await createTable({
                        name: 'Inspection_Plans',
                        fields: [
                            { name: 'Product_ID', type: 'text' },
                            { name: 'Inspection_Name', type: 'text' },
                            { name: 'Inspection_Description', type: 'text' },
                            { name: 'Target', type: 'number' },
                            { name: 'UoM', type: 'text' }
                        ]
                    });
                    const rsTable = await createTable({
                        name: 'Inspection_Results',
                        fields: [
                            { name: 'Work_Order_ID', type: 'text' },
                            { name: 'Inspection_Plan_ID', type: 'text' },
                            { name: 'Operator', type: 'text' },
                            { name: 'Recorded_Value', type: 'number' },
                            { name: 'Status', type: 'text' },
                            { name: 'Comments', type: 'text' }
                        ]
                    });
                    let appStr = JSON.stringify(templateApp);
                    const tIds = [];
                    if (plTable && plTable.id) { appStr = appStr.replace(/tbl_qi_inspection_plans/g, plTable.id); tIds.push(plTable.id); }
                    if (rsTable && rsTable.id) { appStr = appStr.replace(/tbl_qi_inspection_results/g, rsTable.id); tIds.push(rsTable.id); }
                    templateApp = JSON.parse(appStr);
                    templateApp.config.appTables = tIds;
                } catch (qiErr) {
                    console.warn('Could not create Quality Inspection tables for product drawing inspection:', qiErr);
                }
            } else if (templateId === 'quickbuild-cad-vision') {
                templateApp = createQuickBuildCadVisionTemplate();
                try {
                    const visionTable = await createTable({
                        name: 'live_measurements',
                        fields: [
                            { name: 'Work_Order', type: 'text' },
                            { name: 'Lot_Number', type: 'text' },
                            { name: 'Operator', type: 'text' },
                            { name: 'Meas_Bore', type: 'number' },
                            { name: 'Meas_Length', type: 'number' },
                            { name: 'Yield_Score', type: 'number' },
                            { name: 'Yield_Result', type: 'text' },
                            { name: 'Timestamp', type: 'datetime' }
                        ]
                    });
                    if (visionTable && visionTable.id) {
                        const appStr = JSON.stringify(templateApp).replace(/live_measurements/g, visionTable.id);
                        templateApp = JSON.parse(appStr);
                        templateApp.config.appTables = [visionTable.id];
                    }
                } catch (vErr) {
                    console.warn('Could not create live measurements table for quickbuild template:', vErr);
                }
            } else {
                templateApp = createIncomingInspectionTemplate();
                try {
                    const iqcTable = await createTable({
                        name: 'IQC_Inspections',
                        fields: [
                            { name: 'Part_Number', type: 'text' },
                            { name: 'Lot_Number', type: 'text' },
                            { name: 'Supplier', type: 'text' },
                            { name: 'Received_Qty', type: 'number' },
                            { name: 'Overall_Result', type: 'text' },
                            { name: 'Timestamp', type: 'datetime' }
                        ]
                    });
                    if (iqcTable && iqcTable.id) {
                        const appStr = JSON.stringify(templateApp).replace(/iqc_inspections/g, iqcTable.id);
                        templateApp = JSON.parse(appStr);
                        templateApp.config.appTables = [iqcTable.id];
                    }
                } catch (tErr) {
                    console.warn('Could not create IQC table:', tErr);
                }
            }

            // Apply device preset and orientation settings
            if (templateApp.config) {
                templateApp.config.devicePreset = devicePreset;
                templateApp.config.previewOrientation = orientation;

                // Handle custom size
                if (devicePreset === 'CUSTOM' && customWidth && customHeight) {
                    templateApp.config.customDeviceWidth = customWidth;
                    templateApp.config.customDeviceHeight = customHeight;
                    templateApp.config.customDeviceLabel = customLabel || 'Custom Device';
                }

                // Scale components to fit the selected device
                const preset = DEVICE_PRESETS[devicePreset];
                const canvasWidth = devicePreset === 'CUSTOM'
                    ? (orientation === 'PORTRAIT' ? customWidth : customHeight)
                    : (preset ? (orientation === 'PORTRAIT' ? preset.width : preset.height) : 1000);
                const canvasHeight = devicePreset === 'CUSTOM'
                    ? (orientation === 'PORTRAIT' ? customHeight : customWidth)
                    : (preset ? (orientation === 'PORTRAIT' ? preset.height : preset.width) : 625);

                // Scale all components in steps
                const originalWidth = 1000;
                const originalHeight = 625;
                const scaleX = canvasWidth / originalWidth;
                const scaleY = canvasHeight / originalHeight;

                if (templateApp.config.steps) {
                    templateApp.config.steps = templateApp.config.steps.map(step => ({
                        ...step,
                        components: (step.components || []).map(comp => ({
                            ...comp,
                            x: comp.x != null ? Math.round(comp.x * scaleX) : comp.x,
                            y: comp.y != null ? Math.round(comp.y * scaleY) : comp.y,
                            w: comp.w != null ? Math.round(comp.w * scaleX) : comp.w,
                            h: comp.h != null ? Math.round(comp.h * scaleY) : comp.h
                        }))
                    }));
                }
            }

            // Save the new app
            const { id, ...templateData } = templateApp;
            const savedApp = await saveFrontlineApp({
                ...templateData,
                is_published: false,
                approval_status: 'DRAFT',
                updated_at: new Date().toISOString()
            });

            // Refresh and load
            await loadData();
            if (savedApp) {
                // Navigate to AppBuilder with the new app and device preset set
                const devicePreset = templateApp.config?.devicePreset || 'RESPONSIVE';
                const orientation = templateApp.config?.previewOrientation || 'PORTRAIT';
                const url = `/#/builder?appId=${savedApp.id}&devicePreset=${devicePreset}&orientation=${orientation}`;
                window.location.href = url;
            }
        } catch (err) {
            console.error('Failed to create template:', err);
            alert('Failed to create application: ' + err.message);
        } finally {
            setIsCreating(false);
        }
    };

    const cancelLaunch = () => setPendingApp(null);

    const stopSession = async () => {
        if (activeAppId) {
            // Log session to Supabase
            try {
                await logPlayerSession({
                    appId: activeAppId,
                    appName: activeApp?.name || 'Unknown',
                    stationId: stationIdFilter,
                    stationName: activeStationName,
                    operator: operator,
                    durationSeconds: elapsedSeconds,
                    stepCount: stepProgress?.stepIndex || 0,
                    devMode: devMode,
                    comments: sessionComments,
                    startedAt: sessionStartedAt
                });
            } catch (err) {
                console.error('Failed to log session', err);
            }
        }

        setActiveAppId('');
        setSessionStartedAt(null);
        setStepProgress(null);
        setIframeError(false);
        setIsPaused(false);
        setSessionComments([]);
        setSyncedVariables([]);
        setTriggerHistory([]);
        clearTimeout(iframeLoadTimer.current);
    };

    const handleIframeLoad = () => {
        clearTimeout(iframeLoadTimer.current);
        setIframeError(false);
    };

    const handleIframeError = () => {
        clearTimeout(iframeLoadTimer.current);
        setIframeError(true);
    };

    const retryLoad = () => {
        setIframeError(false);
        clearTimeout(iframeLoadTimer.current);
        iframeLoadTimer.current = setTimeout(() => setIframeError(true), 8000);
        const id = activeAppId;
        setActiveAppId('');
        setTimeout(() => setActiveAppId(id), 50);
    };

    // ── Player Actions ───────────────────────────────────────────────────────
    
    const handlePauseToggle = () => {
        const nextPaused = !isPaused;
        setIsPaused(nextPaused);
        if (iframeRef.current?.contentWindow) {
            iframeRef.current.contentWindow.postMessage({ type: nextPaused ? 'PAUSE' : 'RESUME' }, '*');
        }
    };

    const handleRestart = () => {
        if (iframeRef.current?.contentWindow) {
            iframeRef.current.contentWindow.postMessage({ type: 'RESTART' }, '*');
        } else {
            const id = activeAppId;
            setActiveAppId('');
            setTimeout(() => setActiveAppId(id), 50);
        }
        setElapsedSeconds(0);
        setStepProgress(null);
        setIsPaused(false);
        setTriggerHistory([]); // Clear logs on restart
    };

    const handleChangeApp = () => {
        stopSession();
        // Focus search or sidebar happens naturally as activeAppId becomes empty
    };

    const handleBackToBuilder = () => {
        const params = new URLSearchParams();
        if (activeAppId) params.set('appId', activeAppId);
        window.location.hash = params.toString() ? `/builder?${params.toString()}` : '/builder';
    };

    const handleAddComment = () => {
        if (!newComment.trim()) return;
        setSessionComments(prev => [...prev, {
            text: newComment,
            stepIndex: stepProgress?.stepIndex || 0,
            timestamp: new Date().toISOString()
        }]);
        setNewComment('');
        setShowComments(false);
    };

    // ── Step progress label ───────────────────────────────────────────────────
    const stepLabel = stepProgress
        ? `Step ${stepProgress.stepIndex + 1} of ${stepProgress.totalSteps}${stepProgress.stepTitle ? ` — ${stepProgress.stepTitle}` : ''}`
        : null;

    // ── Styles ───────────────────────────────────────────────────────────────
    const panelStyle = {
        backgroundColor: 'white',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        boxShadow: '0 6px 24px rgba(15,23,42,0.06)'
    };

    const sidebarHidden = isFullscreen || !!activeAppId;

    return (
        <div
            ref={playerContainerRef}
            style={{ height: '100%', backgroundColor: '#f1f5f9', padding: sidebarHidden ? '0' : '20px', overflow: 'hidden', boxSizing: 'border-box' }}
        >
            {pendingApp && (
                <AuthModal
                    app={pendingApp}
                    operatorDefault={operator}
                    stationDefault={stationIdFilter}
                    stations={stations}
                    onConfirm={confirmLaunch}
                    onCancel={cancelLaunch}
                />
            )}

            {showNewAppModal && (
                <NewAppModal
                    onConfirm={handleCreateTemplate}
                    onCancel={() => setShowNewAppModal(false)}
                />
            )}

            {isCreating && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(4px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '20px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', textAlign: 'center' }}>
                        <div style={{ width: '40px', height: '40px', border: '3px solid #f1f5f9', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'mavi-spin 1s linear infinite', margin: '0 auto 16px' }} />
                        <div style={{ fontWeight: 800, color: '#0f172a' }}>Creating Your App...</div>
                        <p style={{ margin: '8px 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>Initializing tables and workflow structure</p>
                        <style>{`@keyframes mavi-spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                    </div>
                </div>
            )}

            <div style={{
                height: '100%',
                display: 'grid',
                gridTemplateColumns: sidebarHidden
                    ? (showDebugPanel && devMode ? '1fr 320px' : '1fr')
                    : (showDebugPanel && devMode ? '360px 1fr 320px' : '360px 1fr'),
                gap: sidebarHidden ? '0' : '16px',
                transition: 'grid-template-columns 0.3s ease'
            }}>

                {/* ── SIDEBAR ──────────────────────────────────────────────── */}
                <div style={{
                    ...panelStyle,
                    display: sidebarHidden ? 'none' : 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    height: '100%',
                    opacity: sidebarHidden ? 0 : 1,
                    pointerEvents: sidebarHidden ? 'none' : 'auto',
                    transition: 'opacity 0.2s'
                }}>
                    <div style={{ padding: '16px', borderBottom: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Rocket size={18} color="#2563eb" />
                                <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>App Player</h2>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ 
                                    fontSize: '0.65rem', fontWeight: 800, padding: '3px 8px', borderRadius: '20px',
                                    backgroundColor: isOnline ? '#dcfce7' : '#fee2e2',
                                    color: isOnline ? '#166534' : '#991b1b',
                                    display: 'flex', alignItems: 'center', gap: '5px'
                                }}>
                                    <span className={`pulse-dot ${isOnline ? 'pulse-dot-success' : 'pulse-dot-danger'}`} style={{ width: '6px', height: '6px' }} />
                                    {isOnline ? 'ONLINE' : 'OFFLINE'}
                                </div>
                                <button
                                    onClick={() => setShowNewAppModal(true)}
                                    title="Create New App"
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 10px',
                                        backgroundColor: '#2563eb', color: 'white', border: 'none',
                                        borderRadius: '6px', fontSize: '0.72rem', fontWeight: 800,
                                        cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#1d4ed8'}
                                    onMouseLeave={e => e.currentTarget.style.backgroundColor = '#2563eb'}
                                >
                                    <Plus size={14} /> NEW
                                </button>
                                <button
                                    onClick={() => {
                                        if (window.confirm("Are you sure you want to log out?")) {
                                            logout();
                                            window.location.reload();
                                        }
                                    }}
                                    title="Logout"
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 8px',
                                        border: '1px solid #ef4444', color: '#ef4444', backgroundColor: 'transparent',
                                        borderRadius: '6px', fontSize: '0.72rem', fontWeight: 800,
                                        cursor: 'pointer', transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.08)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                                >
                                    <LogOut size={12} /> LOGOUT
                                </button>
                            </div>
                        </div>

                        {/* Station Selector */}
                        <div style={{ marginBottom: '10px' }}>
                            <select
                                value={stationIdFilter}
                                onChange={(e) => setStationIdFilter(e.target.value)}
                                style={{
                                    width: '100%', padding: '8px 10px', borderRadius: '8px', 
                                    border: '1px solid #cbd5e1', fontSize: '0.85rem', outline: 'none',
                                    backgroundColor: '#f8fafc', color: '#334155', fontWeight: 600
                                }}
                            >
                                <option value="">All Stations</option>
                                {stations.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>

                        <div style={{ position: 'relative', marginBottom: '10px' }}>
                            <Search size={14} color="#94a3b8" style={{ position: 'absolute', left: 10, top: 10 }} />
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search apps…"
                                style={{ width: '100%', padding: '8px 10px 8px 30px', border: '1px solid #cbd5e1', borderRadius: '8px', outline: 'none', boxSizing: 'border-box', fontSize: '0.85rem' }}
                            />
                        </div>

                        <FilterTabs active={filterTab} onChange={(t) => { setFilterTab(t); }} />

                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '4px' }}>
                            {['All', 'Shop Floor', 'Lab', 'Quality', 'Maintenance', 'Logistics', 'Office'].map((cat) => {
                                const catColors = {
                                    'Shop Floor': '#0ea5e9', Lab: '#8b5cf6', Quality: '#10b981',
                                    Maintenance: '#f59e0b', Logistics: '#ef4444', Office: '#6366f1', All: '#64748b'
                                };
                                const isActive = categoryFilter === cat;
                                const col = catColors[cat] || '#64748b';
                                return (
                                    <button
                                        key={cat}
                                        onClick={() => setCategoryFilter(cat)}
                                        style={{
                                            padding: '3px 9px', borderRadius: '20px',
                                            border: `1px solid ${isActive ? col : '#e2e8f0'}`,
                                            backgroundColor: isActive ? col : 'white',
                                            color: isActive ? 'white' : '#64748b',
                                            fontSize: '0.65rem', fontWeight: 700,
                                            cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap'
                                        }}
                                    >
                                        {cat}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div style={{ padding: '10px 12px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>
                            {filteredApps.length} app{filteredApps.length !== 1 ? 's' : ''}
                        </span>
                        <button
                            onClick={loadData}
                            style={{ border: 'none', background: 'transparent', color: '#3b82f6', cursor: 'pointer', display: 'flex', gap: '5px', alignItems: 'center', fontWeight: 700, fontSize: '0.72rem' }}
                        >
                            <RefreshCw size={12} /> Refresh
                        </button>
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
                        {loading ? (
                            <div style={{ fontSize: '0.85rem', color: '#64748b', padding: '12px 0' }}>Loading apps…</div>
                        ) : error ? (
                            <div style={{ fontSize: '0.85rem', color: '#dc2626' }}>{error}</div>
                        ) : filteredApps.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '24px 12px', color: '#94a3b8', fontSize: '0.85rem' }}>
                                {filterTab === 'Favorites' ? '⭐ No favorites yet. Star an app to save it here.' :
                                    filterTab === 'Recent' ? '⏱ No recently launched apps.' :
                                    filterTab === 'Pending' ? 'No apps pending approval.' :
                                        'No apps found for this station.'}
                            </div>
                        ) : (
                            filteredApps.map((app) => (
                                <AppCard
                                    key={app.id}
                                    app={app}
                                    isActive={app.id === activeAppId}
                                    isFavorite={favorites.includes(app.id)}
                                    isRecent={recentIds.includes(app.id)}
                                    onLaunch={requestLaunch}
                                    onFavorite={toggleFavorite}
                                />
                            ))
                        )}
                    </div>

                    {/* Device Connectivity Widget */}
                    <DeviceConnectivityWidget />
                </div>

                {/* ── PLAYER PANE ───────────────────────────────────────────── */}
                <div style={{ 
                    ...panelStyle, 
                    display: 'flex', 
                    flexDirection: 'column', 
                    overflow: 'hidden',
                    height: '100%',
                    border: sidebarHidden ? 'none' : panelStyle.border,
                    borderRadius: sidebarHidden ? '0' : panelStyle.borderRadius,
                    boxShadow: sidebarHidden ? 'none' : panelStyle.boxShadow
                }}>
                    {/* Header */}
                    {activeApp ? (
                        <>
                            {/* Consolidated Header Bar */}
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '0 16px',
                                height: '48px',
                                backgroundColor: '#090d16', // Ultra dark background
                                color: 'white',
                                borderBottom: '1px solid #1e293b',
                                flexShrink: 0,
                                position: 'relative'
                            }}>
                                {/* Left side: Logo, App Title, Badge, Duration, Step, User/Station Info */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flexWrap: 'nowrap' }}>
                                    {companyLogo && (
                                        <img src={companyLogo} alt="Logo" style={{ height: '14px', objectFit: 'contain', marginRight: '2px' }} />
                                    )}
                                    <span style={{ fontSize: '1.05rem', fontWeight: 800, color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {activeApp.name}
                                    </span>
                                    <span style={{
                                        fontSize: '0.65rem', fontWeight: 800, color: 'white', 
                                        backgroundColor: activeApp.approval_status === 'PUBLISHED' ? '#16a34a' : '#ef4444',
                                        borderRadius: '4px', padding: '2px 6px', textTransform: 'uppercase', letterSpacing: '0.05em',
                                        whiteSpace: 'nowrap'
                                    }}>
                                        {activeApp.approval_status || 'DRAFT'}
                                    </span>
                                    
                                    <div style={{ width: '1px', height: '16px', backgroundColor: 'rgba(255,255,255,0.15)', flexShrink: 0 }} />
                                    <span style={{ fontSize: '0.72rem', color: '#cbd5e1', whiteSpace: 'nowrap' }}>
                                        Duration: <strong style={{ color: 'white', fontFamily: 'monospace' }}>{formatDuration(elapsedSeconds)}</strong>
                                    </span>

                                    {stepLabel && (
                                        <>
                                            <div style={{ width: '1px', height: '16px', backgroundColor: 'rgba(255,255,255,0.15)', flexShrink: 0 }} />
                                            <span style={{
                                                fontSize: '0.7rem', fontWeight: 700, color: '#090d16', backgroundColor: '#f1f5f9',
                                                borderRadius: '4px', padding: '2px 6px', display: 'inline-flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap',
                                                overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px'
                                            }}>
                                                <ChevronRight size={11} /> {stepLabel}
                                            </span>
                                        </>
                                    )}

                                    <div style={{ width: '1px', height: '16px', backgroundColor: 'rgba(255,255,255,0.15)', flexShrink: 0 }} />
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap', fontSize: '0.72rem', color: '#94a3b8' }}>
                                        <User size={11} color="#3b82f6" />
                                        <span>USER: <strong style={{ color: 'white' }}>{operator || '-'}</strong></span>
                                    </div>

                                    <div style={{ width: '1px', height: '16px', backgroundColor: 'rgba(255,255,255,0.15)', flexShrink: 0 }} />
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap', fontSize: '0.72rem', color: '#94a3b8', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        <MapPin size={11} color="#10b981" />
                                        <span>STATION: <strong style={{ color: 'white' }}>{activeStationName || '-'}</strong></span>
                                    </div>
                                </div>

                                {/* Right side: Status, Language, Dev Mode, Fullscreen, Scale Mode, Menu, Logout */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                                    <div style={{ 
                                        fontSize: '0.62rem', fontWeight: 800, padding: '3px 8px', borderRadius: '20px',
                                        backgroundColor: isOnline ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                                        color: isOnline ? '#4ade80' : '#fca5a5',
                                        display: 'flex', alignItems: 'center', gap: '4px', border: `1px solid ${isOnline ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}`
                                    }}>
                                        <span className={`pulse-dot ${isOnline ? 'pulse-dot-success' : 'pulse-dot-danger'}`} style={{ width: '5px', height: '5px' }} />
                                        {isOnline ? 'ONLINE' : 'OFFLINE'}
                                    </div>

                                    {/* Language selection */}
                                    <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '1px 6px', borderRadius: '4px', gap: '2px' }}>
                                        <Globe size={10} color="#cbd5e1" />
                                        <select 
                                            value={currentLanguage} 
                                            onChange={(e) => changeLanguage(e.target.value)}
                                            style={{ background: 'transparent', border: 'none', color: '#cbd5e1', fontSize: '0.68rem', fontWeight: 700, outline: 'none', cursor: 'pointer' }}
                                        >
                                            <option value="en" style={{ color: 'black' }}>EN</option>
                                            <option value="id" style={{ color: 'black' }}>ID</option>
                                            <option value="ja" style={{ color: 'black' }}>JA</option>
                                        </select>
                                    </div>

                                    {/* Dev Mode toggle */}
                                    <button
                                        onClick={() => setDevMode(!devMode)}
                                        title="Toggle Developer Mode"
                                        style={{ 
                                            padding: '4px 8px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', 
                                            backgroundColor: devMode ? 'rgba(255,255,255,0.1)' : 'transparent', color: '#cbd5e1', 
                                            cursor: 'pointer', display: 'flex', gap: '4px', alignItems: 'center', fontWeight: 700, fontSize: '0.68rem',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        <Code size={10} /> {devMode ? 'Dev' : 'Prod'}
                                    </button>

                                    {/* Fullscreen Kiosk toggle */}
                                    <button
                                        onClick={toggleFullscreen}
                                        title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
                                        style={{ 
                                            padding: '4px 8px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', 
                                            backgroundColor: isFullscreen ? 'rgba(0,0,0,0.3)' : 'transparent', color: '#cbd5e1', 
                                            cursor: 'pointer', display: 'flex', gap: '4px', alignItems: 'center', fontWeight: 700, fontSize: '0.68rem',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        {isFullscreen ? <Minimize2 size={10} /> : <Maximize2 size={10} />}
                                        Kiosk
                                    </button>

                                    {/* Device Preset Selector & Orientation */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', position: 'relative' }} ref={playerDeviceMenuRef}>
                                        <button
                                            onClick={() => setShowPlayerDeviceMenu(prev => !prev)}
                                            title={`Device Preset: ${DEVICE_PRESETS[activeDevicePresetKey]?.label || 'Responsive'}`}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '5px',
                                                padding: '4px 8px',
                                                borderRadius: '4px',
                                                border: '1px solid rgba(255,255,255,0.15)',
                                                backgroundColor: showPlayerDeviceMenu ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.05)',
                                                color: activeDevicePresetKey !== 'RESPONSIVE' ? '#38bdf8' : '#cbd5e1',
                                                fontWeight: 700,
                                                fontSize: '0.68rem',
                                                cursor: 'pointer',
                                                transition: 'all 0.15s'
                                            }}
                                        >
                                            {React.createElement(DEVICE_PRESETS[activeDevicePresetKey]?.icon || LayoutGrid, { size: 11 })}
                                            <span style={{ maxWidth: '95px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {DEVICE_PRESETS[activeDevicePresetKey]?.label?.split(' ')[0] || 'Responsive'}
                                            </span>
                                            <ChevronDown size={10} style={{ opacity: 0.7 }} />
                                        </button>

                                        {activeDevicePresetKey !== 'RESPONSIVE' && (
                                            <button
                                                onClick={() => setPlayerOrientation(prev => {
                                                    const current = prev || activeApp?.config?.previewOrientation || 'PORTRAIT';
                                                    return current === 'PORTRAIT' ? 'LANDSCAPE' : 'PORTRAIT';
                                                })}
                                                title={`Orientation: ${activeOrientation} (Click to rotate)`}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    padding: '4px 6px',
                                                    borderRadius: '4px',
                                                    border: '1px solid rgba(255,255,255,0.15)',
                                                    backgroundColor: activeOrientation === 'LANDSCAPE' ? 'rgba(245,158,11,0.18)' : 'rgba(255,255,255,0.05)',
                                                    color: activeOrientation === 'LANDSCAPE' ? '#fbbf24' : '#cbd5e1',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.15s'
                                                }}
                                            >
                                                <RotateCw size={10} />
                                            </button>
                                        )}

                                        {showPlayerDeviceMenu && (
                                            <div style={{
                                                position: 'absolute',
                                                top: '30px',
                                                right: 0,
                                                width: '230px',
                                                backgroundColor: '#0f172a',
                                                border: '1px solid #334155',
                                                borderRadius: '8px',
                                                boxShadow: '0 12px 30px rgba(0,0,0,0.5)',
                                                zIndex: 1000,
                                                padding: '4px',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: '2px'
                                            }}>
                                                <div style={{ padding: '6px 10px', fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                    Device Presets
                                                </div>
                                                {Object.entries(DEVICE_PRESETS).map(([key, preset]) => {
                                                    const isSelected = activeDevicePresetKey === key;
                                                    const PresetIcon = preset.icon || LayoutGrid;
                                                    return (
                                                        <button
                                                            key={key}
                                                            onClick={() => {
                                                                setPlayerDevicePreset(key);
                                                                setShowPlayerDeviceMenu(false);
                                                            }}
                                                            style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'space-between',
                                                                padding: '6px 10px',
                                                                borderRadius: '6px',
                                                                border: 'none',
                                                                backgroundColor: isSelected ? '#2563eb' : 'transparent',
                                                                color: isSelected ? 'white' : '#cbd5e1',
                                                                fontSize: '0.72rem',
                                                                fontWeight: isSelected ? 700 : 500,
                                                                cursor: 'pointer',
                                                                textAlign: 'left',
                                                                transition: 'all 0.15s'
                                                            }}
                                                            onMouseEnter={e => { if (!isSelected) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)'; }}
                                                            onMouseLeave={e => { if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent'; }}
                                                        >
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                <PresetIcon size={12} color={isSelected ? 'white' : '#94a3b8'} />
                                                                <span>{preset.label}</span>
                                                            </div>
                                                            {isSelected && <span style={{ fontSize: '0.75rem' }}>✓</span>}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        onClick={() => setAppScaleMode(prev => prev === 'FIT_SCREEN' ? 'FIT_WIDTH' : 'FIT_SCREEN')}
                                        title={appScaleMode === 'FIT_SCREEN' ? 'Switch to Fit Width' : 'Switch to Fit Screen'}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                            padding: '4px 8px',
                                            borderRadius: '4px',
                                            border: '1px solid rgba(255,255,255,0.15)',
                                            backgroundColor: appScaleMode === 'FIT_SCREEN' ? 'rgba(34,197,94,0.18)' : 'rgba(59,130,246,0.18)',
                                            color: appScaleMode === 'FIT_SCREEN' ? '#86efac' : '#93c5fd',
                                            fontWeight: 700,
                                            fontSize: '0.68rem',
                                            cursor: 'pointer',
                                            transition: 'all 0.15s'
                                        }}
                                    >
                                        <Maximize2 size={10} />
                                        {appScaleMode === 'FIT_SCREEN' ? 'Fit Screen' : 'Fit Width'}
                                    </button>

                                    {activeApp?.config?.devicePreset === 'RESPONSIVE' && (
                                        <button
                                            onClick={() => setAppLayoutMode(prev => prev === 'PROPORTIONAL' ? 'RESPONSIVE' : 'PROPORTIONAL')}
                                            title={appLayoutMode === 'PROPORTIONAL' ? 'Switch to Responsive Stack Layout' : 'Switch to Proportional Canvas Layout'}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '4px',
                                                padding: '4px 8px',
                                                borderRadius: '4px',
                                                border: '1px solid rgba(255,255,255,0.15)',
                                                backgroundColor: appLayoutMode === 'PROPORTIONAL' ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.05)',
                                                color: appLayoutMode === 'PROPORTIONAL' ? '#93c5fd' : 'white',
                                                fontWeight: 700,
                                                fontSize: '0.68rem',
                                                cursor: 'pointer',
                                                transition: 'all 0.15s'
                                            }}
                                        >
                                            <LayoutGrid size={10} />
                                            {appLayoutMode === 'PROPORTIONAL' ? 'Proportional UI' : 'Responsive Stack'}
                                        </button>
                                    )}

                                    <div style={{ position: 'relative', flexShrink: 0 }}>
                                        <button
                                            onClick={() => setMenuOpen(!menuOpen)}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                padding: '4px 8px',
                                                borderRadius: '4px',
                                                border: '1px solid rgba(255,255,255,0.15)',
                                                backgroundColor: menuOpen ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)',
                                                color: 'white',
                                                fontWeight: 700,
                                                fontSize: '0.68rem',
                                                cursor: 'pointer',
                                                transition: 'all 0.15s'
                                            }}
                                        >
                                            <Menu size={12} />
                                            Menu
                                            <ChevronDown size={10} style={{ transform: menuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                                        </button>

                                        {/* Dropdown Menu overlay - Glassmorphic Dark */}
                                        {menuOpen && (
                                            <div style={{
                                                position: 'absolute',
                                                top: '100%',
                                                right: 0,
                                                width: '260px',
                                                background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)',
                                                color: 'white',
                                                borderRadius: '12px',
                                                boxShadow: '0 20px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.08)',
                                                padding: '8px 0',
                                                border: '1px solid rgba(255,255,255,0.08)',
                                                zIndex: 1000,
                                                marginTop: '8px',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                backdropFilter: 'blur(20px)'
                                            }}>
                                                {/* Menu Header */}
                                                <div style={{ padding: '6px 16px 10px', borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: '4px' }}>
                                                    <div style={{ fontSize: '0.6rem', fontWeight: 800, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                                                        App Controls
                                                    </div>
                                                </div>

                                                {/* Comment item */}
                                                <button
                                                    onClick={() => { setShowComments(true); setMenuOpen(false); }}
                                                    style={{
                                                        display: 'flex', alignItems: 'center', gap: '12px',
                                                        padding: '9px 16px', width: '100%', border: 'none',
                                                        background: 'none', textAlign: 'left', fontSize: '0.82rem',
                                                        fontWeight: 600, color: 'rgba(255,255,255,0.75)',
                                                        cursor: 'pointer', transition: 'all 0.15s'
                                                    }}
                                                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'white'; }}
                                                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.75)'; }}
                                                >
                                                    <div style={{ width: '28px', height: '28px', borderRadius: '7px', backgroundColor: 'rgba(100,116,139,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                        <MessageSquare size={13} color="#94a3b8" />
                                                    </div>
                                                    <span style={{ flex: 1 }}>Comments</span>
                                                    {sessionComments.length > 0 && <span style={{ fontSize: '0.68rem', fontWeight: 800, backgroundColor: 'rgba(59,130,246,0.2)', color: '#93c5fd', borderRadius: '10px', padding: '1px 7px' }}>{sessionComments.length}</span>}
                                                </button>

                                                {/* Pause/Resume item */}
                                                <button
                                                    onClick={() => { handlePauseToggle(); setMenuOpen(false); }}
                                                    style={{
                                                        display: 'flex', alignItems: 'center', gap: '12px',
                                                        padding: '9px 16px', width: '100%', border: 'none',
                                                        background: isPaused ? 'rgba(16,185,129,0.1)' : 'none',
                                                        textAlign: 'left', fontSize: '0.82rem',
                                                        fontWeight: 600, color: isPaused ? '#6ee7b7' : 'rgba(255,255,255,0.75)',
                                                        cursor: 'pointer', transition: 'all 0.15s'
                                                    }}
                                                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = isPaused ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'white'; }}
                                                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = isPaused ? 'rgba(16,185,129,0.1)' : 'transparent'; e.currentTarget.style.color = isPaused ? '#6ee7b7' : 'rgba(255,255,255,0.75)'; }}
                                                >
                                                    <div style={{ width: '28px', height: '28px', borderRadius: '7px', backgroundColor: isPaused ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                        {isPaused ? <PlayIcon size={13} color="#34d399" /> : <Pause size={13} color="#fbbf24" />}
                                                    </div>
                                                    <span style={{ flex: 1 }}>{isPaused ? 'Resume App' : 'Pause App'}</span>
                                                </button>

                                                {/* Restart App item */}
                                                <button
                                                    onClick={() => { handleRestart(); setMenuOpen(false); }}
                                                    style={{
                                                        display: 'flex', alignItems: 'center', gap: '12px',
                                                        padding: '9px 16px', width: '100%', border: 'none',
                                                        background: 'none', textAlign: 'left', fontSize: '0.82rem',
                                                        fontWeight: 600, color: 'rgba(255,255,255,0.75)',
                                                        cursor: 'pointer', transition: 'all 0.15s'
                                                    }}
                                                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'white'; }}
                                                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.75)'; }}
                                                >
                                                    <div style={{ width: '28px', height: '28px', borderRadius: '7px', backgroundColor: 'rgba(79,70,229,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                        <RotateCcw size={13} color="#a5b4fc" />
                                                    </div>
                                                    <span style={{ flex: 1 }}>Restart App</span>
                                                </button>

                                                <button
                                                    onClick={() => { handleBackToBuilder(); setMenuOpen(false); }}
                                                    style={{
                                                        display: 'flex', alignItems: 'center', gap: '12px',
                                                        padding: '9px 16px', width: '100%', border: 'none',
                                                        background: 'none', textAlign: 'left', fontSize: '0.82rem',
                                                        fontWeight: 600, color: 'rgba(255,255,255,0.75)',
                                                        cursor: 'pointer', transition: 'all 0.15s'
                                                    }}
                                                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'white'; }}
                                                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.75)'; }}
                                                >
                                                    <div style={{ width: '28px', height: '28px', borderRadius: '7px', backgroundColor: 'rgba(59,130,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                        <ExternalLink size={13} color="#93c5fd" />
                                                    </div>
                                                    <span style={{ flex: 1 }}>Back to App Builder</span>
                                                </button>

                                                {/* Change App item */}
                                                <button
                                                    onClick={() => { handleChangeApp(); setMenuOpen(false); }}
                                                    style={{
                                                        display: 'flex', alignItems: 'center', gap: '12px',
                                                        padding: '9px 16px', width: '100%', border: 'none',
                                                        background: 'none', textAlign: 'left', fontSize: '0.82rem',
                                                        fontWeight: 600, color: 'rgba(255,255,255,0.75)',
                                                        cursor: 'pointer', transition: 'all 0.15s'
                                                    }}
                                                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'white'; }}
                                                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.75)'; }}
                                                >
                                                    <div style={{ width: '28px', height: '28px', borderRadius: '7px', backgroundColor: 'rgba(8,145,178,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                        <RefreshCw size={13} color="#38bdf8" />
                                                    </div>
                                                    <span style={{ flex: 1 }}>Change App</span>
                                                </button>

                                                {/* Camera Capture item */}
                                                <button
                                                    onClick={() => { setShowCameraModal(true); setMenuOpen(false); }}
                                                    style={{
                                                        display: 'flex', alignItems: 'center', gap: '12px',
                                                        padding: '9px 16px', width: '100%', border: 'none',
                                                        background: 'none', textAlign: 'left', fontSize: '0.82rem',
                                                        fontWeight: 600, color: 'rgba(255,255,255,0.75)',
                                                        cursor: 'pointer', transition: 'all 0.15s'
                                                    }}
                                                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'white'; }}
                                                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.75)'; }}
                                                >
                                                    <div style={{ width: '28px', height: '28px', borderRadius: '7px', backgroundColor: 'rgba(13,148,136,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                        <Camera size={13} color="#2dd4bf" />
                                                    </div>
                                                    <span style={{ flex: 1 }}>Camera Capture</span>
                                                </button>

                                                {/* Sign Session item */}
                                                <button
                                                    onClick={() => { setShowSignatureModal(true); setMenuOpen(false); }}
                                                    style={{
                                                        display: 'flex', alignItems: 'center', gap: '12px',
                                                        padding: '9px 16px', width: '100%', border: 'none',
                                                        background: 'none', textAlign: 'left', fontSize: '0.82rem',
                                                        fontWeight: 600, color: 'rgba(255,255,255,0.75)',
                                                        cursor: 'pointer', transition: 'all 0.15s'
                                                    }}
                                                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'white'; }}
                                                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.75)'; }}
                                                >
                                                    <div style={{ width: '28px', height: '28px', borderRadius: '7px', backgroundColor: 'rgba(234,88,12,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                        <PenTool size={13} color="#fb923c" />
                                                    </div>
                                                    <span style={{ flex: 1 }}>Sign Session</span>
                                                </button>

                                                {/* Panduan Aplikasi - hanya tampil jika app punya help guide */}
                                                {activeApp?.config?.helpGuide && (
                                                    <button
                                                        onClick={() => { setShowHelpGuide(true); setMenuOpen(false); }}
                                                        style={{
                                                            display: 'flex', alignItems: 'center', gap: '12px',
                                                            padding: '9px 16px', width: '100%', border: 'none',
                                                            background: 'none', textAlign: 'left', fontSize: '0.82rem',
                                                            fontWeight: 600, color: 'rgba(255,255,255,0.75)',
                                                            cursor: 'pointer', transition: 'all 0.15s'
                                                        }}
                                                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'white'; }}
                                                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.75)'; }}
                                                    >
                                                        <div style={{ width: '28px', height: '28px', borderRadius: '7px', backgroundColor: 'rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                            <BookOpen size={13} color="#a5b4fc" />
                                                        </div>
                                                        <span style={{ flex: 1 }}>Panduan Aplikasi</span>
                                                    </button>
                                                )}

                                                <div style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.07)', margin: '6px 0' }} />

                                                {/* Debug Panel toggle (if in dev mode) */}
                                                {devMode && (
                                                    <button
                                                        onClick={() => { setShowDebugPanel(!showDebugPanel); setMenuOpen(false); }}
                                                        style={{
                                                            display: 'flex', alignItems: 'center', gap: '12px',
                                                            padding: '9px 16px', width: '100%', border: 'none',
                                                            background: 'none', textAlign: 'left', fontSize: '0.82rem',
                                                            fontWeight: 600, color: 'rgba(255,255,255,0.75)',
                                                            cursor: 'pointer', transition: 'all 0.15s'
                                                        }}
                                                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'white'; }}
                                                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.75)'; }}
                                                    >
                                                        <div style={{ width: '28px', height: '28px', borderRadius: '7px', backgroundColor: 'rgba(217,119,6,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                            <Bug size={13} color="#fbbf24" />
                                                        </div>
                                                        <span style={{ flex: 1 }}>{showDebugPanel ? 'Hide Debugger' : 'Show Debugger'}</span>
                                                    </button>
                                                )}

                                                {/* Tech Details toggle */}
                                                <button
                                                    onClick={() => { setShowTechDetails(!showTechDetails); setMenuOpen(false); }}
                                                    style={{
                                                        display: 'flex', alignItems: 'center', gap: '12px',
                                                        padding: '9px 16px', width: '100%', border: 'none',
                                                        background: 'none', textAlign: 'left', fontSize: '0.82rem',
                                                        fontWeight: 600, color: 'rgba(255,255,255,0.75)',
                                                        cursor: 'pointer', transition: 'all 0.15s'
                                                    }}
                                                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'white'; }}
                                                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.75)'; }}
                                                >
                                                    <div style={{ width: '28px', height: '28px', borderRadius: '7px', backgroundColor: 'rgba(71,85,105,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                        <Info size={13} color="#94a3b8" />
                                                    </div>
                                                    <span style={{ flex: 1 }}>Technical Details</span>
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Logout */}
                                    <button
                                        onClick={() => {
                                            if (window.confirm("Are you sure you want to log out?")) {
                                                logout();
                                                window.location.reload();
                                            }
                                        }}
                                        title="Logout"
                                        style={{ 
                                            padding: '4px 8px', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '4px', 
                                            backgroundColor: 'rgba(239,68,68,0.1)', color: '#fca5a5', 
                                            cursor: 'pointer', display: 'flex', gap: '4px', alignItems: 'center', fontWeight: 700, fontSize: '0.68rem',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        <LogOut size={10} /> Logout
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        /* No active app - show simple Row 1 layout only */
                        <div style={{
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'space-between',
                            padding: '0 16px', 
                            height: '48px',
                            backgroundColor: themeColor || '#1e293b',
                            color: 'white',
                            borderBottom: `1px solid ${themeColor || '#1e293b'}`,
                            flexShrink: 0
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                {companyLogo && (
                                    <img src={companyLogo} alt="Logo" style={{ height: '18px', objectFit: 'contain' }} />
                                )}
                                <span style={{ fontSize: '0.9rem', fontWeight: 800 }}>Select an app to begin</span>
                            </div>
                            
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '6px', gap: '2px' }}>
                                    <Globe size={11} color="white" />
                                    <select 
                                        value={currentLanguage} 
                                        onChange={(e) => changeLanguage(e.target.value)}
                                        style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '0.72rem', fontWeight: 700, outline: 'none', cursor: 'pointer' }}
                                    >
                                        <option value="en" style={{ color: 'black' }}>EN</option>
                                        <option value="id" style={{ color: 'black' }}>ID</option>
                                        <option value="ja" style={{ color: 'black' }}>JA</option>
                                    </select>
                                </div>
                                
                                <button
                                    onClick={() => setDevMode(!devMode)}
                                    style={{ 
                                        padding: '5px 8px', border: `1px solid rgba(255,255,255,0.2)`, borderRadius: '6px', 
                                        backgroundColor: devMode ? 'rgba(255,255,255,0.2)' : 'transparent', color: 'white', 
                                        cursor: 'pointer', display: 'flex', gap: '4px', alignItems: 'center', fontWeight: 700, fontSize: '0.72rem'
                                    }}
                                >
                                    <Code size={11} /> {devMode ? 'Dev Mode' : 'Prod Mode'}
                                </button>

                                <button
                                    onClick={toggleFullscreen}
                                    style={{ 
                                        padding: '5px 8px', border: `1px solid rgba(255,255,255,0.2)`, borderRadius: '6px', 
                                        backgroundColor: isFullscreen ? 'rgba(0,0,0,0.3)' : 'transparent', color: 'white', 
                                        cursor: 'pointer', display: 'flex', gap: '4px', alignItems: 'center', fontWeight: 700, fontSize: '0.72rem'
                                    }}
                                >
                                    {isFullscreen ? <Minimize2 size={11} /> : <Maximize2 size={11} />}
                                    Kiosk
                                </button>
                                
                                <button
                                    onClick={() => {
                                        if (window.confirm("Are you sure you want to log out?")) {
                                            logout();
                                            window.location.reload();
                                        }
                                    }}
                                    style={{ 
                                        padding: '5px 8px', border: `1px solid rgba(239,68,68,0.4)`, borderRadius: '6px', 
                                        backgroundColor: 'rgba(239,68,68,0.15)', color: '#fca5a5', cursor: 'pointer', 
                                        display: 'flex', gap: '4px', alignItems: 'center', fontWeight: 700, fontSize: '0.72rem'
                                    }}
                                >
                                    <LogOut size={11} /> Logout
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Tech Details Dropdown */}
                    {showTechDetails && activeApp && (
                        <div style={{ padding: '12px 16px', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontSize: '0.75rem', color: '#475569' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                <div><strong>App ID:</strong> {activeApp.id}</div>
                                <div><strong>Version:</strong> {activeApp.version || 1} ({activeApp.approval_status || 'DRAFT'})</div>
                                <div><strong>Station ID:</strong> {stationIdFilter || 'None'}</div>
                                <div><strong>Session Start:</strong> {sessionStartedAt?.toLocaleTimeString()}</div>
                            </div>
                        </div>
                    )}



                    {/* Main Content Area */}
                    <div style={{ flex: 1, backgroundColor: '#f8fafc', position: 'relative', overflow: 'hidden' }}>
                        
                        {showCameraModal && (
                            <CameraCaptureModal 
                                onClose={() => setShowCameraModal(false)}
                                onCapture={(imgUrl) => {
                                    // In a real implementation, this could save to session variables or cloud
                                    console.log('Captured Media length:', imgUrl.length);
                                    setShowCameraModal(false);
                                    alert('Media Captured (Base64 string ready for logic variables)');
                                }}
                            />
                        )}

                        {showSignatureModal && (
                            <ESignatureModal 
                                operator={operator}
                                onClose={() => setShowSignatureModal(false)}
                                onSign={(data) => {
                                    console.log('Signature Data:', data);
                                    setShowSignatureModal(false);
                                    alert(`Session signed by ${data.operator} at ${data.timestamp}. Base64 ready for 21 CFR Part 11 storage.`);
                                }}
                            />
                        )}
                        
                        {/* Pause Overlay */}
                        {isPaused && (
                            <div style={{ 
                                position: 'absolute', inset: 0, backgroundColor: 'rgba(15,23,42,0.8)', 
                                zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', 
                                justifyContent: 'center', backdropFilter: 'blur(4px)' 
                            }}>
                                <Pause size={48} color="white" style={{ marginBottom: '16px' }} />
                                <h2 style={{ color: 'white', margin: '0 0 8px 0' }}>App Paused</h2>
                                <p style={{ color: '#cbd5e1', margin: '0 0 24px 0' }}>Timer has been suspended.</p>
                                <button
                                    onClick={handlePauseToggle}
                                    style={{ padding: '12px 24px', borderRadius: '8px', border: 'none', backgroundColor: '#10b981', color: 'white', fontWeight: 700, fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                                >
                                    <PlayIcon size={18} /> Resume Work
                                </button>
                            </div>
                        )}

                        {/* Comments Modal */}
                        {showComments && (
                            <div style={{ position: 'absolute', right: '20px', top: '20px', width: '320px', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.15)', zIndex: 20, border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', maxHeight: '80%' }}>
                                <div style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700 }}>Step Comments</h3>
                                    <button onClick={() => setShowComments(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={16} /></button>
                                </div>
                                <div style={{ padding: '12px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {sessionComments.length === 0 ? (
                                        <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.8rem', padding: '20px 0' }}>No comments yet for this session.</div>
                                    ) : (
                                        sessionComments.map((c, i) => (
                                            <div key={i} style={{ backgroundColor: '#f1f5f9', padding: '8px 12px', borderRadius: '8px', fontSize: '0.8rem' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', marginBottom: '4px', fontSize: '0.7rem' }}>
                                                    <span>Step {c.stepIndex + 1}</span>
                                                    <span>{new Date(c.timestamp).toLocaleTimeString()}</span>
                                                </div>
                                                <div style={{ color: '#334155' }}>{c.text}</div>
                                            </div>
                                        ))
                                    )}
                                </div>
                                <div style={{ padding: '12px', borderTop: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <textarea
                                        value={newComment}
                                        onChange={e => setNewComment(e.target.value)}
                                        placeholder="Add a comment about this step..."
                                        style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem', minHeight: '60px', boxSizing: 'border-box', outline: 'none' }}
                                    />
                                    <button
                                        onClick={handleAddComment}
                                        disabled={!newComment.trim()}
                                        style={{ padding: '8px', borderRadius: '6px', border: 'none', backgroundColor: newComment.trim() ? '#3b82f6' : '#cbd5e1', color: 'white', fontWeight: 600, cursor: newComment.trim() ? 'pointer' : 'not-allowed' }}
                                    >
                                        Add Comment
                                    </button>
                                </div>
                            </div>
                        )}

                        {!activeApp ? (
                            <div style={{ height: '100%', display: 'grid', placeItems: 'center', padding: '24px' }}>
                                <div style={{ textAlign: 'center', maxWidth: '560px' }}>
                                    <div style={{ width: '72px', height: '72px', borderRadius: '18px', background: 'linear-gradient(135deg,#3b82f6,#6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                                        <Package size={36} color="white" />
                                    </div>
                                    <h3 style={{ color: '#334155', margin: '0 0 8px', fontSize: '1.15rem' }}>App Player Ready</h3>
                                    <p style={{ color: '#64748b', fontSize: '0.9rem', margin: '0 0 16px' }}>
                                        Select an app from the sidebar and click <strong>Launch</strong> to start a production session.
                                    </p>
                                </div>
                            </div>
                        ) : showHelpGuide && activeApp?.config?.helpGuide ? (
                            <div style={{ position: 'relative', height: '100%', overflow: 'hidden' }}>
                                <AppHelpGuideScreen
                                    app={activeApp}
                                    helpGuide={activeApp.config.helpGuide}
                                    onStart={() => {
                                        setShowHelpGuide(false);
                                        clearTimeout(iframeLoadTimer.current);
                                        iframeLoadTimer.current = setTimeout(() => setIframeError(true), 8000);
                                    }}
                                    onSkip={() => {
                                        setShowHelpGuide(false);
                                        clearTimeout(iframeLoadTimer.current);
                                        iframeLoadTimer.current = setTimeout(() => setIframeError(true), 8000);
                                    }}
                                />
                            </div>
                        ) : iframeError ? (
                            <div style={{ height: '100%', display: 'grid', placeItems: 'center', padding: '24px' }}>
                                <div style={{ textAlign: 'center', maxWidth: '420px' }}>
                                    <div style={{ width: '64px', height: '64px', borderRadius: '16px', backgroundColor: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', border: '1px solid #fecaca' }}>
                                        <AlertTriangle size={30} color="#ef4444" />
                                    </div>
                                    <h3 style={{ color: '#991b1b', margin: '0 0 8px' }}>App Failed to Load</h3>
                                    <p style={{ color: '#6b7280', fontSize: '0.9rem', margin: '0 0 20px' }}>
                                        <strong>{activeApp.name}</strong> could not be loaded. Check your network connection or try again.
                                    </p>
                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                        <button onClick={retryLoad} style={{ padding: '9px 18px', borderRadius: '8px', border: 'none', backgroundColor: '#3b82f6', color: 'white', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                                            <RotateCcw size={14} /> Retry
                                        </button>
                                        <button onClick={stopSession} style={{ padding: '9px 18px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: 'white', color: '#64748b', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}>
                                            Close
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <iframe
                                ref={iframeRef}
                                key={`${activeAppId}_${activeDevicePresetKey}_${activeOrientation}_${appScaleMode}_${appLayoutMode}`}
                                title="frontline-app-player"
                                src={appLaunchUrl}
                                onLoad={handleIframeLoad}
                                onError={handleIframeError}
                                style={{ 
                                    width: '100%', height: '100%', border: 'none', 
                                    backgroundColor: activeApp?.config?.appBackgroundColor || 'white',
                                    pointerEvents: isPaused ? 'none' : 'auto',
                                    transition: 'filter 0.3s',
                                    filter: isPaused ? 'blur(2px) grayscale(50%)' : 'none'
                                }}
                            />
                        )}
                    </div>
                </div>

                {/* ── DEBUG PANEL (Tulip parity: Variable Watcher & Trigger Log) ── */}
                {devMode && showDebugPanel && (
                    <div style={{
                        ...panelStyle,
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                        height: '100%',
                        backgroundColor: '#0f172a',
                        color: '#cbd5e1',
                        border: 'none'
                    }}>
                        {/* Debug Header */}
                        <div style={{ padding: '14px', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Bug size={16} color="#f59e0b" />
                                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'white' }}>Debug Inspector</span>
                            </div>
                            <button onClick={() => setShowDebugPanel(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><X size={16} /></button>
                        </div>

                        {/* Debug Tabs */}
                        <div style={{ display: 'flex', backgroundColor: '#1e293b' }}>
                            <button
                                onClick={() => setActiveDebugTab('variables')}
                                style={{
                                    flex: 1, padding: '10px 0', border: 'none', background: activeDebugTab === 'variables' ? '#334155' : 'transparent',
                                    color: activeDebugTab === 'variables' ? 'white' : '#94a3b8', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer'
                                }}
                            >
                                Variables ({syncedVariables.length})
                            </button>
                            <button
                                onClick={() => setActiveDebugTab('triggers')}
                                style={{
                                    flex: 1, padding: '10px 0', border: 'none', background: activeDebugTab === 'triggers' ? '#334155' : 'transparent',
                                    color: activeDebugTab === 'triggers' ? 'white' : '#94a3b8', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer'
                                }}
                            >
                                Trigger Log ({triggerHistory.length})
                            </button>
                        </div>

                        {/* Debug Content */}
                        <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
                            {activeDebugTab === 'variables' ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {syncedVariables.length === 0 ? (
                                        <div style={{ textAlign: 'center', padding: '20px', color: '#64748b', fontSize: '0.75rem' }}>No variables found in app.</div>
                                    ) : (
                                        syncedVariables.map((v, i) => (
                                            <div key={i} style={{ backgroundColor: '#1e293b', borderRadius: '6px', padding: '8px 10px', border: '1px solid #334155' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                                    <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#f59e0b' }}>{v.name}</span>
                                                    <span style={{ fontSize: '0.6rem', color: '#64748b' }}>{v.type}</span>
                                                </div>
                                                <div style={{ fontSize: '0.8rem', color: 'white', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                                                    {v.value === null || v.value === undefined ? <span style={{ color: '#64748b', fontStyle: 'italic' }}>null</span> : String(v.value)}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {triggerHistory.length === 0 ? (
                                        <div style={{ textAlign: 'center', padding: '20px', color: '#64748b', fontSize: '0.75rem' }}>No triggers fired yet.</div>
                                    ) : (
                                        triggerHistory.map((log) => (
                                            <div key={log.id} style={{ borderLeft: '2px solid #f59e0b', paddingLeft: '10px', marginBottom: '4px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'white' }}>{log.triggerName || 'Unnamed Trigger'}</span>
                                                    <span style={{ fontSize: '0.6rem', color: '#64748b' }}>{new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                                                </div>
                                                <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>
                                                    {log.eventId} on <span style={{ color: '#3b82f6' }}>{log.source}</span>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Debug Footer */}
                        <div style={{ padding: '8px 12px', borderTop: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.6rem', color: '#64748b' }}>Real-time Sync Active</span>
                            <button 
                                onClick={() => activeDebugTab === 'variables' ? setSyncedVariables([]) : setTriggerHistory([])}
                                style={{ background: 'none', border: 'none', color: '#3b82f6', fontSize: '0.65rem', fontWeight: 700, cursor: 'pointer' }}
                            >
                                Clear Logs
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AppPlayer;

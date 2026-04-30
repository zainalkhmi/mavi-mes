import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    Search, Play, Square, RefreshCw, ExternalLink, User, MapPin,
    Rocket, Clock3, Package, Maximize2, Minimize2, Star,
    AlertTriangle, RotateCcw, X, ChevronRight, Pause, MessageSquare, Info, Code, Play as PlayIcon
} from 'lucide-react';
import { getAllFrontlineApps, getProductionQueue, logPlayerSession } from '../utils/supabaseFrontlineDB';
import { getStations } from '../utils/database';

// ─── helpers ────────────────────────────────────────────────────────────────

const LS_FAVORITES = 'mavi_player_favorites';
const LS_RECENT = 'mavi_player_recent';
const LS_DEV_MODE = 'mavi_player_dev_mode';
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
                        transition: 'color 0.15s',
                        position: 'relative',
                        zIndex: 1
                    }}
                >
                    <Star size={14} fill={isFavorite ? '#fde68a' : 'none'} />
                </button>
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
                    onClick={() => onLaunch(app)}
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
    const hue = nameToHue(app?.name || '');

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
                    <div style={{ marginBottom: '14px' }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '6px' }}>
                            <User size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                            Operator Name <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <input
                            autoFocus
                            value={opName}
                            onChange={(e) => setOpName(e.target.value)}
                            placeholder="Enter your name..."
                            style={{
                                width: '100%', padding: '8px 12px', borderRadius: '8px',
                                border: `1px solid ${opName.trim() ? '#cbd5e1' : '#fca5a5'}`,
                                fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box',
                                backgroundColor: opName.trim() ? 'white' : '#fff5f5'
                            }}
                        />
                        {!opName.trim() && (
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
                        <button onClick={onCancel} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: 'white', color: '#64748b', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}>
                            Cancel
                        </button>
                        <button
                            onClick={() => onConfirm(opName.trim(), stn.trim() || 'Station-01')}
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

// ─── Main Component ──────────────────────────────────────────────────────────

const AppPlayer = () => {
    const [apps, setApps] = useState([]);
    const [stations, setStations] = useState([]);
    const [queue, setQueue] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    
    // Auto-detect station from URL if available, else keep state
    const [stationIdFilter, setStationIdFilter] = useState(''); 
    const [operator, setOperator] = useState('');
    const [activeAppId, setActiveAppId] = useState('');
    const [sessionStartedAt, setSessionStartedAt] = useState(null);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);

    // Player states
    const [isPaused, setIsPaused] = useState(false);
    const [devMode, setDevMode] = useState(() => loadLS(LS_DEV_MODE, false));
    const [showComments, setShowComments] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [sessionComments, setSessionComments] = useState([]);
    const [showTechDetails, setShowTechDetails] = useState(false);

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

    // Auth modal
    const [pendingApp, setPendingApp] = useState(null);

    // Iframe error
    const [iframeError, setIframeError] = useState(false);
    const iframeLoadTimer = useRef(null);

    const activeApp = useMemo(() => apps.find((a) => a.id === activeAppId) || null, [apps, activeAppId]);
    const activeStationName = useMemo(() => stations.find(s => s.id === stationIdFilter)?.name || stationIdFilter, [stations, stationIdFilter]);

    const appLaunchUrl = useMemo(() => {
        if (!activeAppId) return '';
        const params = new URLSearchParams({ 
            station: stationIdFilter || 'Station-01', 
            operator: operator || 'Operator',
            devMode: devMode ? 'true' : 'false'
        });
        return `/terminal/${activeAppId}?${params.toString()}`;
    }, [activeAppId, stationIdFilter, operator, devMode]);

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
            
            // Auto-detect station from URL parameter
            const params = new URLSearchParams(window.location.search);
            const urlStation = params.get('station');
            if (urlStation) {
                setStationIdFilter(urlStation);
            } else if (stationRows.length > 0 && !stationIdFilter) {
                // If no station in URL, we could optionally default to the first one, 
                // but let's allow "All Stations" if none is selected
                // setStationIdFilter(stationRows[0].id);
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

    // ── postMessage listener (step progress) ─────────────────────────────────
    useEffect(() => {
        const handler = (e) => {
            if (e.data?.type === 'STEP_PROGRESS') {
                setStepProgress({
                    stepIndex: e.data.stepIndex ?? 0,
                    totalSteps: e.data.totalSteps ?? 0,
                    stepTitle: e.data.stepTitle || ''
                });
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

        // Arm iframe error timeout (5 s)
        clearTimeout(iframeLoadTimer.current);
        iframeLoadTimer.current = setTimeout(() => setIframeError(true), 8000);

        setPendingApp(null);
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
    };

    const handleChangeApp = () => {
        stopSession();
        // Focus search or sidebar happens naturally as activeAppId becomes empty
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

    const sidebarHidden = isFullscreen;

    return (
        <div
            ref={playerContainerRef}
            style={{ height: '100%', backgroundColor: '#f1f5f9', padding: '20px', overflow: 'hidden', boxSizing: 'border-box' }}
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

            <div style={{
                height: '100%',
                display: 'grid',
                gridTemplateColumns: sidebarHidden ? '0 1fr' : '360px 1fr',
                gap: sidebarHidden ? '0' : '16px',
                transition: 'grid-template-columns 0.3s ease'
            }}>

                {/* ── SIDEBAR ──────────────────────────────────────────────── */}
                <div style={{
                    ...panelStyle,
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
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
                </div>

                {/* ── PLAYER PANE ───────────────────────────────────────────── */}
                <div style={{ ...panelStyle, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    {/* Header */}
                    <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        gap: '12px', borderBottom: '1px solid #e2e8f0', padding: '10px 14px', minHeight: '52px'
                    }}>
                        <div style={{ minWidth: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div>
                                <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {activeApp ? activeApp.name : 'Select an app to begin'}
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '2px' }}>
                                    {activeApp && (
                                        <>
                                            <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                                <MapPin size={11} /> {activeStationName || '-'}
                                            </span>
                                            <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                                <User size={11} /> {operator || '-'}
                                            </span>
                                            <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                                <Clock3 size={11} /> {formatDuration(elapsedSeconds)}
                                            </span>
                                            {stepLabel && (
                                                <span style={{
                                                    fontSize: '0.72rem', fontWeight: 700, color: '#7c3aed', backgroundColor: '#f3e8ff',
                                                    borderRadius: '6px', padding: '1px 7px', display: 'inline-flex', alignItems: 'center', gap: '4px'
                                                }}>
                                                    <ChevronRight size={11} /> {stepLabel}
                                                </span>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '6px', flexShrink: 0, alignItems: 'center' }}>
                            <button
                                onClick={() => setDevMode(!devMode)}
                                title="Toggle Developer Mode (Skip DB writes)"
                                style={{ 
                                    padding: '7px 10px', border: `1px solid ${devMode ? '#8b5cf6' : '#cbd5e1'}`, borderRadius: '8px', 
                                    backgroundColor: devMode ? '#ede9fe' : 'white', color: devMode ? '#7c3aed' : '#64748b', 
                                    cursor: 'pointer', display: 'flex', gap: '5px', alignItems: 'center', fontWeight: 700, fontSize: '0.75rem' 
                                }}
                            >
                                <Code size={13} /> {devMode ? 'Dev Mode' : 'Prod Mode'}
                            </button>
                            
                            {activeApp && (
                                <button
                                    onClick={() => setShowTechDetails(!showTechDetails)}
                                    title="Technical Details"
                                    style={{ padding: '7px', border: '1px solid #cbd5e1', borderRadius: '8px', backgroundColor: 'white', color: '#334155', cursor: 'pointer', display: 'flex' }}
                                >
                                    <Info size={14} />
                                </button>
                            )}
                            <button
                                onClick={toggleFullscreen}
                                title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen / Kiosk Mode'}
                                style={{ padding: '7px 10px', border: '1px solid #cbd5e1', borderRadius: '8px', backgroundColor: isFullscreen ? '#0f172a' : 'white', color: isFullscreen ? 'white' : '#334155', cursor: 'pointer', display: 'flex', gap: '5px', alignItems: 'center', fontWeight: 700, fontSize: '0.75rem' }}
                            >
                                {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
                                {isFullscreen ? 'Exit' : 'Kiosk'}
                            </button>
                        </div>
                    </div>

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

                    {/* App Player Action Bar (Tulip-style) */}
                    {activeApp && (
                        <div style={{ 
                            padding: '8px 14px', backgroundColor: '#1e293b', display: 'flex', 
                            justifyContent: 'center', gap: '12px', alignItems: 'center' 
                        }}>
                            <button
                                onClick={() => setShowComments(true)}
                                style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #475569', backgroundColor: '#334155', color: 'white', cursor: 'pointer', display: 'flex', gap: '6px', alignItems: 'center', fontSize: '0.75rem', fontWeight: 600 }}
                            >
                                <MessageSquare size={13} /> Step Comments {sessionComments.length > 0 && `(${sessionComments.length})`}
                            </button>
                            <div style={{ width: '1px', height: '20px', backgroundColor: '#475569' }} />
                            <button
                                onClick={handlePauseToggle}
                                style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', backgroundColor: isPaused ? '#10b981' : '#f59e0b', color: 'white', cursor: 'pointer', display: 'flex', gap: '6px', alignItems: 'center', fontSize: '0.75rem', fontWeight: 600 }}
                            >
                                {isPaused ? <><PlayIcon size={13} /> Resume App</> : <><Pause size={13} /> Pause App</>}
                            </button>
                            <button
                                onClick={handleRestart}
                                style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #475569', backgroundColor: '#334155', color: 'white', cursor: 'pointer', display: 'flex', gap: '6px', alignItems: 'center', fontSize: '0.75rem', fontWeight: 600 }}
                            >
                                <RotateCcw size={13} /> Restart App
                            </button>
                            <button
                                onClick={handleChangeApp}
                                style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #475569', backgroundColor: '#334155', color: 'white', cursor: 'pointer', display: 'flex', gap: '6px', alignItems: 'center', fontSize: '0.75rem', fontWeight: 600 }}
                            >
                                <RefreshCw size={13} /> Change App
                            </button>
                        </div>
                    )}

                    {/* Main Content Area */}
                    <div style={{ flex: 1, backgroundColor: '#f8fafc', position: 'relative', overflow: 'hidden' }}>
                        
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
                                key={activeAppId}
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
            </div>
        </div>
    );
};

export default AppPlayer;
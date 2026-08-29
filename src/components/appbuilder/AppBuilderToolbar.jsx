import React from 'react';
import { 
    FilePlus, HelpCircle, Save, Smartphone, Undo2, Redo2, 
    Lock, Unlock, Layout, Code, Play, Blocks, Sun, Moon, Settings2, LayoutGrid, Monitor
} from 'lucide-react';
import ProjectManager from '../ProjectManager';

export default function AppBuilderToolbar({
    builderTheme, currentAppId, getCurrentApp, handleImportProject, handleDuplicateProject, loadApp,
    setIsCreateDrawerOpen, helpGuide, setIsHelpGuideOpen, handleSave, isSaving, setCompanionModal,
    handleUndo, history, handleRedo, future, DEVICE_PRESETS, previewDevice, handleDeviceChange,
    previewOrientation, handleOrientationToggle, viewMode, setIsCanvasLocked, isCanvasLocked,
    setViewMode, setActiveLogicScopeId, appName, setAppName, toggleTheme, isSettingsOpen, setIsSettingsOpen,
    appZoom, setAppZoom, isGridVisible, setIsGridVisible
}) {
    const SelectedDeviceIcon = DEVICE_PRESETS[previewDevice]?.icon || LayoutGrid;

    return (
        <>
            {/* Top Navigation / Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0 20px',
                height: '56px',
                backgroundColor: 'var(--header-bg)',
                color: 'var(--header-text)',
                zIndex: 100,
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                position: 'relative',
                gap: '16px'
            }}>
                {/* Left Side: Project Manager / Quick actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: '1 1 0%', justifyContent: 'flex-start', minWidth: 'max-content' }}>
                    {currentAppId && (
                        <ProjectManager
                            app={getCurrentApp()}
                            onImport={handleImportProject}
                            onDuplicate={handleDuplicateProject}
                            onAppChange={(app) => {
                                loadApp(app);
                                handleImportProject(app);
                            }}
                        />
                    )}
                </div>

                {/* Center Side: Main Action Toolbar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: '0 0 auto', justifyContent: 'center' }}>
                    <button
                        onClick={() => setIsCreateDrawerOpen(true)}
                        style={{
                            width: '36px',
                            height: '36px',
                            backgroundColor: '#10b981',
                            border: 'none',
                            borderRadius: '6px',
                            color: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(1.1)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.filter = 'none'; }}
                        title="Buat Aplikasi Baru"
                    >
                        <FilePlus size={18} />
                    </button>
                    {helpGuide && (
                        <button
                            onClick={() => setIsHelpGuideOpen(true)}
                            style={{
                                width: '36px',
                                height: '36px',
                                backgroundColor: '#f59e0b',
                                border: 'none',
                                borderRadius: '6px',
                                color: '#fff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                transition: 'all 0.2s',
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(1.1)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.filter = 'none'; }}
                            title="Buka Panduan Aplikasi (Help Guide)"
                        >
                            <HelpCircle size={18} />
                        </button>
                    )}
                    <button
                        onClick={() => handleSave()}
                        disabled={isSaving}
                        style={{
                            width: '36px',
                            height: '36px',
                            backgroundColor: '#06b6d4',
                            border: 'none',
                            borderRadius: '6px',
                            color: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                            transition: 'all 0.2s',
                            opacity: isSaving ? 0.7 : 1
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(1.1)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.filter = 'none'; }}
                        title={isSaving ? 'Menyimpan...' : 'Simpan Aplikasi'}
                    >
                        <Save size={18} />
                    </button>
                    <button
                        onClick={() => {
                            if (!currentAppId) {
                                alert('Please save the app first.');
                                return;
                            }
                            const url = `${window.location.origin}/#/terminal/${currentAppId}?devMode=true`;
                            setCompanionModal({ isOpen: true, url });
                        }}
                        style={{
                            width: '36px',
                            height: '36px',
                            backgroundColor: '#4f46e5',
                            border: 'none',
                            borderRadius: '6px',
                            color: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                            transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.filter = 'brightness(1.1)';
                            e.currentTarget.style.transform = 'scale(1.05)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.filter = 'none';
                            e.currentTarget.style.transform = 'none';
                        }}
                        title="Companion Connect"
                    >
                        <Smartphone size={18} />
                    </button>

                    {/* Relocated Device & Lock Controls */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: '4px' }}>
                        <button
                            onClick={() => handleUndo()}
                            disabled={history.length === 0}
                            style={{
                                background: history.length === 0 ? 'rgba(255, 255, 255, 0.02)' : 'rgba(56, 189, 248, 0.12)',
                                border: history.length === 0 ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(56, 189, 248, 0.35)',
                                color: history.length === 0 ? 'rgba(255, 255, 255, 0.35)' : '#38bdf8',
                                cursor: history.length === 0 ? 'not-allowed' : 'pointer',
                                opacity: history.length === 0 ? 0.6 : 1,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                padding: '4px 10px',
                                borderRadius: '6px',
                                gap: '2px',
                                transition: 'all 0.2s',
                                outline: 'none'
                            }}
                            onMouseEnter={(e) => {
                                if (history.length > 0) {
                                    e.currentTarget.style.backgroundColor = 'rgba(56, 189, 248, 0.25)';
                                    e.currentTarget.style.borderColor = '#38bdf8';
                                    e.currentTarget.style.transform = 'scale(1.08)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (history.length > 0) {
                                    e.currentTarget.style.backgroundColor = 'rgba(56, 189, 248, 0.12)';
                                    e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.35)';
                                    e.currentTarget.style.transform = 'none';
                                }
                            }}
                            title="Undo"
                        >
                            <Undo2 size={16} />
                            <span style={{ fontSize: '0.65rem', fontWeight: 700 }}>Undo</span>
                        </button>
                        <button
                            onClick={() => handleRedo()}
                            disabled={future.length === 0}
                            style={{
                                background: future.length === 0 ? 'rgba(255, 255, 255, 0.02)' : 'rgba(167, 139, 250, 0.12)',
                                border: future.length === 0 ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(167, 139, 250, 0.35)',
                                color: future.length === 0 ? 'rgba(255, 255, 255, 0.35)' : '#a78bfa',
                                cursor: future.length === 0 ? 'not-allowed' : 'pointer',
                                opacity: future.length === 0 ? 0.6 : 1,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                padding: '4px 10px',
                                borderRadius: '6px',
                                gap: '2px',
                                transition: 'all 0.2s',
                                outline: 'none'
                            }}
                            onMouseEnter={(e) => {
                                if (future.length > 0) {
                                    e.currentTarget.style.backgroundColor = 'rgba(167, 139, 250, 0.25)';
                                    e.currentTarget.style.borderColor = '#a78bfa';
                                    e.currentTarget.style.transform = 'scale(1.08)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (future.length > 0) {
                                    e.currentTarget.style.backgroundColor = 'rgba(167, 139, 250, 0.12)';
                                    e.currentTarget.style.borderColor = 'rgba(167, 139, 250, 0.35)';
                                    e.currentTarget.style.transform = 'none';
                                }
                            }}
                            title="Redo"
                        >
                            <Redo2 size={16} />
                            <span style={{ fontSize: '0.65rem', fontWeight: 700 }}>Redo</span>
                        </button>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'rgba(255, 255, 255, 0.1)', padding: '4px 6px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.2)', backdropFilter: 'blur(4px)' }}>
                        {(() => {
                            const deviceKind = DEVICE_PRESETS[previewDevice]?.kind || 'RESPONSIVE';
                            const deviceColor = deviceKind === 'RESPONSIVE' ? '#38bdf8' : deviceKind === 'PHONE' ? '#34d399' : deviceKind === 'TABLET' ? '#c084fc' : '#fb923c';
                            const deviceBg = deviceKind === 'RESPONSIVE' ? 'rgba(56, 189, 248, 0.15)' : deviceKind === 'PHONE' ? 'rgba(52, 211, 153, 0.15)' : deviceKind === 'TABLET' ? 'rgba(192, 132, 252, 0.15)' : 'rgba(251, 146, 60, 0.15)';
                            const deviceBorder = deviceKind === 'RESPONSIVE' ? '1px solid rgba(56, 189, 248, 0.4)' : deviceKind === 'PHONE' ? '1px solid rgba(52, 211, 153, 0.4)' : deviceKind === 'TABLET' ? '1px solid rgba(192, 132, 252, 0.4)' : '1px solid rgba(251, 146, 60, 0.4)';
                            return (
                                <div style={{ 
                                    position: 'relative', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center', 
                                    width: '28px', 
                                    height: '28px', 
                                    backgroundColor: deviceBg, 
                                    border: deviceBorder,
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }} 
                                onMouseEnter={(e) => { 
                                    e.currentTarget.style.transform = 'scale(1.08)'; 
                                    e.currentTarget.style.filter = 'brightness(1.2)';
                                }}
                                onMouseLeave={(e) => { 
                                    e.currentTarget.style.transform = 'none'; 
                                    e.currentTarget.style.filter = 'none';
                                }}
                                title={`Device Preset: ${DEVICE_PRESETS[previewDevice]?.label || 'Responsive'}`}>
                                    <SelectedDeviceIcon size={14} color={deviceColor} />
                                    <select
                                        value={previewDevice}
                                        onChange={e => handleDeviceChange(e.target.value)}
                                        style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            width: '100%',
                                            height: '100%',
                                            opacity: 0,
                                            cursor: 'pointer',
                                            border: 'none',
                                            outline: 'none'
                                        }}
                                    >
                                        {Object.entries(DEVICE_PRESETS).map(([key, preset]) => (
                                            <option key={key} value={key} style={{ color: '#000' }}>
                                                {preset.label}{preset.width ? ` (${preset.width}x${preset.height})` : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            );
                        })()}

                        {/* Portrait / Landscape Toggle — shown when a fixed device is selected */}
                        {previewDevice !== 'RESPONSIVE' && (
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                backgroundColor: 'rgba(0,0,0,0.18)',
                                borderRadius: '6px',
                                padding: '2px',
                                gap: '2px'
                            }}>
                                {/* Portrait */}
                                <button
                                    onClick={() => previewOrientation !== 'PORTRAIT' && handleOrientationToggle()}
                                    title="Portrait"
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: '24px',
                                        height: '24px',
                                        borderRadius: '5px',
                                        border: 'none',
                                        cursor: 'pointer',
                                        transition: 'all 0.15s',
                                        backgroundColor: previewOrientation === 'PORTRAIT' ? 'rgba(56, 189, 248, 0.25)' : 'transparent',
                                        color: previewOrientation === 'PORTRAIT' ? '#38bdf8' : 'rgba(255,255,255,0.4)',
                                        boxShadow: previewOrientation === 'PORTRAIT' ? '0 1px 4px rgba(0,0,0,0.25)' : 'none'
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.08)'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; }}
                                >
                                    {/* Tall rectangle = portrait icon */}
                                    <svg width="10" height="14" viewBox="0 0 10 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <rect x="0.5" y="0.5" width="9" height="13" rx="1.5" stroke="currentColor" strokeWidth="1.2" fill={previewOrientation === 'PORTRAIT' ? 'currentColor' : 'none'} fillOpacity="0.2" />
                                    </svg>
                                </button>

                                {/* Landscape */}
                                <button
                                    onClick={() => previewOrientation !== 'LANDSCAPE' && handleOrientationToggle()}
                                    title="Landscape"
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: '24px',
                                        height: '24px',
                                        borderRadius: '5px',
                                        border: 'none',
                                        cursor: 'pointer',
                                        transition: 'all 0.15s',
                                        backgroundColor: previewOrientation === 'LANDSCAPE' ? 'rgba(251, 146, 60, 0.25)' : 'transparent',
                                        color: previewOrientation === 'LANDSCAPE' ? '#fb923c' : 'rgba(255,255,255,0.4)',
                                        boxShadow: previewOrientation === 'LANDSCAPE' ? '0 1px 4px rgba(0,0,0,0.25)' : 'none'
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.08)'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; }}
                                >
                                    {/* Wide rectangle = landscape icon */}
                                    <svg width="14" height="10" viewBox="0 0 14 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <rect x="0.5" y="0.5" width="13" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.2" fill={previewOrientation === 'LANDSCAPE' ? 'currentColor' : 'none'} fillOpacity="0.2" />
                                    </svg>
                                </button>
                            </div>
                        )}

                        {viewMode === 'DESIGN' && (
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setIsCanvasLocked(v => !v); }}
                                title={isCanvasLocked ? 'Buka kunci — klik untuk menggeser widget lagi' : 'Kunci kanvas — widget tidak bisa digeser'}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: '28px',
                                    height: '28px',
                                    borderRadius: '6px',
                                    backgroundColor: isCanvasLocked ? 'rgba(245, 158, 11, 0.25)' : 'rgba(16, 185, 129, 0.25)',
                                    border: isCanvasLocked ? '1px solid #f59e0b' : '1px solid #10b981',
                                    color: isCanvasLocked ? '#fbbf24' : '#34d399',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    padding: 0
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'scale(1.08)';
                                    e.currentTarget.style.filter = 'brightness(1.2)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'none';
                                    e.currentTarget.style.filter = 'none';
                                }}
                                                         {isCanvasLocked ? <Unlock size={14} /> : <Lock size={14} />}
                            </button>
                        )}
                    </div>

                    <div style={{ display: 'flex', gap: '4px', backgroundColor: 'rgba(0,0,0,0.15)', borderRadius: '8px', padding: '4px' }}>
                        <button
                            onClick={() => setViewMode('DESIGN')}
                            style={{
                                width: '36px',
                                height: '36px',
                                borderRadius: '6px',
                                backgroundColor: viewMode === 'DESIGN' ? '#3b82f6' : 'transparent',
                                border: 'none',
                                color: viewMode === 'DESIGN' ? 'white' : '#60a5fa',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: viewMode === 'DESIGN' ? '0 2px 4px rgba(0,0,0,0.2)' : 'none'
                            }}
                            onMouseEnter={(e) => {
                                if (viewMode !== 'DESIGN') {
                                    e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.2)';
                                    e.currentTarget.style.color = '#93c5fd';
                                    e.currentTarget.style.transform = 'scale(1.05)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (viewMode !== 'DESIGN') {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                    e.currentTarget.style.color = '#60a5fa';
                                    e.currentTarget.style.transform = 'none';
                                }
                            }}
                            title="Design Mode"
                        >
                            <Layout size={18} />
                        </button>
                        <button
                            onClick={() => setViewMode('PREVIEW')}
                            style={{
                                width: '36px',
                                height: '36px',
                                borderRadius: '6px',
                                backgroundColor: viewMode === 'PREVIEW' ? '#8b5cf6' : 'transparent',
                                border: 'none',
                                color: viewMode === 'PREVIEW' ? 'white' : '#c084fc',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: viewMode === 'PREVIEW' ? '0 2px 4px rgba(0,0,0,0.2)' : 'none'
                            }}
                            onMouseEnter={(e) => {
                                if (viewMode !== 'PREVIEW') {
                                    e.currentTarget.style.backgroundColor = 'rgba(139, 92, 246, 0.2)';
                                    e.currentTarget.style.color = '#d8b4fe';
                                    e.currentTarget.style.transform = 'scale(1.05)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (viewMode !== 'PREVIEW') {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                    e.currentTarget.style.color = '#c084fc';
                                    e.currentTarget.style.transform = 'none';
                                }
                            }}
                            title="Developer Mode"
                        >
                            <Code size={18} />
                        </button>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (!currentAppId) {
                                    alert('Please save the app first.');
                                    return;
                                }
                                const params = new URLSearchParams({
                                    appId: currentAppId,
                                    operator: 'Designer',
                                    station: 'Test Station 1'
                                });
                                if (window.location.search) {
                                    window.history.replaceState(null, '', window.location.pathname);
                                }
                                window.location.hash = `/player?${params.toString()}`;
                            }}
                            title="Buka di App Player"
                            style={{
                                width: '36px',
                                height: '36px',
                                borderRadius: '6px',
                                backgroundColor: 'transparent',
                                border: 'none',
                                color: '#10b981',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.2)';
                                e.currentTarget.style.transform = 'scale(1.08)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                                e.currentTarget.style.transform = 'none';
                            }}
                        >
                            <Play size={18} fill="#10b981" />
                        </button>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (!currentAppId) {
                                    alert('Please save the app first.');
                                    return;
                                }
                                if (window.location.search) {
                                    window.history.replaceState(null, '', window.location.pathname);
                                }
                                window.location.hash = `/terminal/${currentAppId}?devMode=true`;
                            }}
                            title="Buka Live Terminal"
                            style={{
                                width: '36px',
                                height: '36px',
                                borderRadius: '6px',
                                backgroundColor: 'transparent',
                                border: 'none',
                                color: '#06b6d4',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = 'rgba(6, 182, 212, 0.2)';
                                e.currentTarget.style.transform = 'scale(1.08)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                                e.currentTarget.style.transform = 'none';
                            }}
                        >
                            <Monitor size={18} />
                        </button>
                        <button
                            onClick={() => { setActiveLogicScopeId('STEP'); setViewMode('DIAGRAM'); }}
                            style={{
                                width: '36px',
                                height: '36px',
                                borderRadius: '6px',
                                backgroundColor: viewMode === 'DIAGRAM' ? '#f97316' : 'transparent',
                                border: 'none',
                                color: viewMode === 'DIAGRAM' ? 'white' : '#fb923c',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: viewMode === 'DIAGRAM' ? '0 2px 4px rgba(0,0,0,0.2)' : 'none'
                            }}
                            onMouseEnter={(e) => {
                                if (viewMode !== 'DIAGRAM') {
                                    e.currentTarget.style.backgroundColor = 'rgba(249, 115, 22, 0.2)';
                                    e.currentTarget.style.color = '#fdbb2d';
                                    e.currentTarget.style.transform = 'scale(1.05)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (viewMode !== 'DIAGRAM') {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                    e.currentTarget.style.color = '#fb923c';
                                    e.currentTarget.style.transform = 'none';
                                }
                            }}
                            title="Code Blocks"
                        >
                            <Blocks size={18} />
                        </button>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: '1 1 0%', justifyContent: 'flex-end', minWidth: 'max-content' }}>
                    <input
                        value={appName}
                        onChange={(e) => setAppName(e.target.value)}
                        style={{
                            backgroundColor: 'transparent',
                            border: 'none',
                            color: 'var(--header-text)',
                            fontSize: '1rem',
                            fontWeight: '500',
                            outline: 'none',
                            width: '260px',
                            textAlign: 'right'
                        }}
                    />
                </div>
            </div>
        </>
    );
}

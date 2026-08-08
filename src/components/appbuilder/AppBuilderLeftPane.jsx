import React from 'react';
import { 
    X, RotateCw, Hash, ToggleRight, Calendar, Database, Layout, 
    ChevronRight, Plus, Trash2, FileText, Square, FolderOpen 
} from 'lucide-react';
// import { COMPONENT_TYPES } from './componentTypes'; 
// Temporarily using mock if COMPONENT_TYPES not exported or available. 
// We will just assume it is passed or imported if needed, but it seems COMPONENT_TYPES is in AppBuilder's scope,
// wait, COMPONENT_TYPES is imported from './appbuilder/componentTypes' in AppBuilder.jsx.
import { COMPONENT_TYPES } from './componentTypes';

export default function AppBuilderLeftPane({
    viewMode, devModeStation, setDevModeStation, devModeUser, setDevModeUser, devModeConnEnv, setDevModeConnEnv,
    currentStepId, setCurrentStepId, steps, previewDevice, handleDeviceChange, DEVICE_PRESETS,
    previewOrientation, handleOrientationToggle, devModeLiveTab, setDevModeLiveTab, appVariables,
    recordPlaceholders, setRecordPlaceholders, tables, appTables, stepPanelTab, setStepPanelTab,
    filteredSteps, collapsedStepGroups, setCollapsedStepGroups, addStep, deleteStep, handleStepDrop,
    expandedSteps, setExpandedSteps, setSelectedCompIds, setActiveTab, selectedCompId,
    activeDropdown, setActiveDropdown, handleAddTableToApp, handleRemoveTableFromApp,
    setQueryEditor, updateTable, setAggregationEditor, setProPrompt, appsList, loadApp,
    currentAppId, handleDeleteApp
}) {
    return (
        <>
                        {/* Left Pane: Developer Mode Panel OR Steps Panel */}
                        {viewMode === 'PREVIEW' && (
                            <div style={{
                                width: '260px',
                                backgroundColor: 'var(--bg-panel)',
                                borderRight: '1px solid var(--border-primary)',
                                display: 'flex',
                                flexDirection: 'column',
                                fontFamily: "'Inter', sans-serif"
                            }}>
                                {/* Developer Mode Header */}
                                <div style={{
                                    padding: '12px 16px',
                                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                                    backgroundColor: '#1a1a2e',
                                    borderLeft: '4px solid #22c55e',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '2px'
                                }}>
                                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f1f5f9', letterSpacing: '0.01em' }}>Developer Mode</span>
                                    <span style={{ fontSize: '0.65rem', color: '#64748b', letterSpacing: '0.03em' }}>Test sessions are not saved</span>
                                </div>

                                {/* Session Parameters */}
                                <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-secondary)', overflowY: 'auto', flex: '0 0 auto' }}>
                                    <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>Session Parameters</div>

                                    {/* Station */}
                                    <div style={{ marginBottom: '10px' }}>
                                        <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', marginBottom: '5px', letterSpacing: '0.04em' }}>Station</label>
                                        <select
                                            value={devModeStation}
                                            onChange={e => setDevModeStation(e.target.value)}
                                            style={{ width: '100%', padding: '7px 10px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.8rem', color: '#334155', backgroundColor: '#f8fafc', outline: 'none', cursor: 'pointer', transition: 'border-color 0.15s', appearance: 'auto' }}
                                            onFocus={e => e.target.style.borderColor = '#93c5fd'}
                                            onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                                        >
                                            {['Test Station 1', 'Test Station 2', 'Line A - Station 1', 'Line B - Station 1', 'Quality Control'].map(s => (
                                                <option key={s} value={s}>{s}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* User */}
                                    <div style={{ marginBottom: '10px' }}>
                                        <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', marginBottom: '5px', letterSpacing: '0.04em' }}>User</label>
                                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                            <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.7rem', fontWeight: 700, flexShrink: 0 }}>
                                                {devModeUser.charAt(0).toUpperCase()}
                                            </div>
                                            <select
                                                value={devModeUser}
                                                onChange={e => setDevModeUser(e.target.value)}
                                                style={{ flex: 1, padding: '7px 10px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.8rem', color: '#334155', backgroundColor: '#f8fafc', outline: 'none', cursor: 'pointer', transition: 'border-color 0.15s' }}
                                                onFocus={e => e.target.style.borderColor = '#93c5fd'}
                                                onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                                            >
                                                {['Operator', 'John Smith', 'Jane Doe', 'Supervisor', 'QC Inspector'].map(u => (
                                                    <option key={u} value={u}>{u}</option>
                                                ))}
                                            </select>
                                            <button title="Clear user" onClick={() => setDevModeUser('')} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', borderRadius: '4px', transition: 'color 0.15s' }} onMouseEnter={e => e.currentTarget.style.color = '#ef4444'} onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}>
                                                <X size={14} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Connector Environment */}
                                    <div style={{ marginBottom: '10px' }}>
                                        <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', marginBottom: '5px', letterSpacing: '0.04em' }}>Connector Environment</label>
                                        <select
                                            value={devModeConnEnv}
                                            onChange={e => setDevModeConnEnv(e.target.value)}
                                            style={{ width: '100%', padding: '7px 10px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.8rem', color: '#64748b', backgroundColor: '#f8fafc', outline: 'none', cursor: 'pointer', transition: 'border-color 0.15s' }}
                                            onFocus={e => e.target.style.borderColor = '#93c5fd'}
                                            onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                                        >
                                            <option value="development">development</option>
                                            <option value="production">production</option>
                                            <option value="staging">staging</option>
                                        </select>
                                    </div>

                                    {/* Screen Navigation */}
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', marginBottom: '5px', letterSpacing: '0.04em' }}>Screen Navigation</label>
                                        <select
                                            value={currentStepId}
                                            onChange={e => setCurrentStepId(e.target.value)}
                                            style={{ width: '100%', padding: '7px 10px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.8rem', color: '#334155', backgroundColor: '#f8fafc', outline: 'none', cursor: 'pointer', transition: 'border-color 0.15s' }}
                                            onFocus={e => e.target.style.borderColor = '#93c5fd'}
                                            onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                                        >
                                            {steps.map(s => (
                                                <option key={s.id} value={s.id}>{s.title}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Device Simulator */}
                                <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-secondary)' }}>
                                    <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <Layout size={12} /> Device Simulator
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', marginBottom: '5px', letterSpacing: '0.04em' }}>Model</label>
                                            <select
                                                value={previewDevice}
                                                onChange={e => handleDeviceChange(e.target.value)}
                                                style={{ width: '100%', padding: '7px 10px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.8rem', color: '#334155', backgroundColor: '#f8fafc', outline: 'none', cursor: 'pointer', transition: 'border-color 0.15s' }}
                                                onFocus={e => e.target.style.borderColor = '#93c5fd'}
                                                onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                                            >
                                                {Object.entries(DEVICE_PRESETS).map(([key, preset]) => (
                                                    <option key={key} value={key}>{preset.label}{preset.width ? ` (${preset.width}x${preset.height})` : ''}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {previewDevice !== 'RESPONSIVE' && (
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f0f7ff', padding: '8px 10px', borderRadius: '6px', border: '1px solid #dbeafe' }}>
                                                <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#1e40af' }}>{previewOrientation}</span>
                                                <button
                                                    onClick={handleOrientationToggle}
                                                    style={{
                                                        background: '#2563eb',
                                                        border: 'none',
                                                        color: 'white',
                                                        borderRadius: '4px',
                                                        padding: '5px 10px',
                                                        fontSize: '0.65rem',
                                                        fontWeight: 600,
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '4px',
                                                        transition: 'background 0.15s'
                                                    }}
                                                    onMouseEnter={e => e.currentTarget.style.background = '#1d4ed8'}
                                                    onMouseLeave={e => e.currentTarget.style.background = '#2563eb'}
                                                >
                                                    <RotateCw size={12} /> Rotate
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Live Data Panel */}
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                                    {/* Tabs */}
                                    <div style={{ display: 'flex', borderBottom: '2px solid #e2e8f0', backgroundColor: '#ffffff' }}>
                                        {['Variables', 'Record Placeholders'].map(tab => (
                                            <button
                                                key={tab}
                                                onClick={() => setDevModeLiveTab(tab)}
                                                style={{
                                                    padding: '10px 14px',
                                                    fontSize: '0.72rem',
                                                    fontWeight: devModeLiveTab === tab ? 700 : 500,
                                                    border: 'none',
                                                    borderBottom: devModeLiveTab === tab ? '2px solid #2563eb' : '2px solid transparent',
                                                    backgroundColor: 'transparent',
                                                    color: devModeLiveTab === tab ? '#2563eb' : '#94a3b8',
                                                    cursor: 'pointer',
                                                    whiteSpace: 'nowrap',
                                                    transition: 'all 0.15s',
                                                    marginBottom: '-2px'
                                                }}
                                                onMouseEnter={e => { if (devModeLiveTab !== tab) e.currentTarget.style.color = '#64748b' }}
                                                onMouseLeave={e => { if (devModeLiveTab !== tab) e.currentTarget.style.color = '#94a3b8' }}
                                            >
                                                {tab}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Variables Tab */}
                                    {devModeLiveTab === 'Variables' && (
                                        <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
                                            {/* Search */}
                                            <div style={{ position: 'relative', marginBottom: '10px' }}>
                                                <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                                                <input
                                                    placeholder="Search Variables"
                                                    style={{ width: '100%', padding: '7px 10px 7px 30px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.78rem', color: '#334155', backgroundColor: '#f8fafc', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s' }}
                                                    onFocus={e => e.target.style.borderColor = '#93c5fd'}
                                                    onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                                                />
                                            </div>
                                            {/* Variable Filter */}
                                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
                                                <span style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 600 }}>Type ({appVariables.length}/{appVariables.length})</span>
                                            </div>
                                            {/* Variable list */}
                                            {appVariables.length === 0 ? (
                                                <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.78rem', padding: '24px 0' }}>No variables defined</div>
                                            ) : (
                                                appVariables.map(v => (
                                                    <div key={v.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 8px', borderRadius: '6px', marginBottom: '3px', backgroundColor: '#f8fafc', border: '1px solid #f1f5f9', transition: 'all 0.12s' }}
                                                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#eef2ff'; e.currentTarget.style.borderColor = '#e0e7ff' }}
                                                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#f8fafc'; e.currentTarget.style.borderColor = '#f1f5f9' }}
                                                    >
                                                        <div style={{ width: '24px', height: '24px', borderRadius: '5px', backgroundColor: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                            {v.type === 'Number' ? <Hash size={12} color="#6366f1" /> :
                                                                v.type === 'Boolean' ? <ToggleRight size={12} color="#6366f1" /> :
                                                                    v.type === 'Date' ? <Calendar size={12} color="#6366f1" /> :
                                                                        <Type size={12} color="#6366f1" />}
                                                        </div>
                                                        <div style={{ flex: 1, minWidth: 0 }}>
                                                            <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{v.name}</div>
                                                            <div style={{ fontSize: '0.62rem', color: '#94a3b8' }}>{v.type}</div>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    )}

                                    {/* Record Placeholders Tab */}
                                    {devModeLiveTab === 'Record Placeholders' && (
                                        <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
                                            {recordPlaceholders.length === 0 ? (
                                                <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.78rem', padding: '24px 0' }}>No record placeholders defined</div>
                                            ) : (
                                                recordPlaceholders.map(rp => {
                                                    const tbl = tables.find(t => t.id === rp.tableId);
                                                    return (
                                                        <div key={rp.id} style={{ padding: '10px 12px', borderRadius: '6px', marginBottom: '4px', backgroundColor: '#f0fdf4', border: '1px solid #dcfce7', transition: 'all 0.12s' }}
                                                            onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#ecfdf5'; e.currentTarget.style.borderColor = '#bbf7d0' }}
                                                            onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#f0fdf4'; e.currentTarget.style.borderColor = '#dcfce7' }}
                                                        >
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                                                                <Database size={12} color="#16a34a" />
                                                                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#166534' }}>{rp.name}</span>
                                                            </div>
                                                            <span style={{ fontSize: '0.62rem', color: '#22c55e', paddingLeft: '20px' }}>{tbl ? tbl.name : rp.tableId}</span>
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {viewMode === 'DESIGN' && (
                            <div style={{
                                width: '380px',
                                backgroundColor: 'var(--bg-panel)',
                                borderRight: '1px solid var(--bg-tertiary)',
                                display: 'flex',
                                flexDirection: 'column'
                            }}>
                                <div style={{ display: 'flex', minHeight: '310px', borderBottom: '1px solid var(--border-primary)' }}>
                                    {/* Tulip-like Screen Browser */}
                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-primary)', backgroundColor: '#f3f4f6' }}>
                                            {['SCREENS', 'RECORDS'].map(tab => (
                                                <button
                                                    key={tab}
                                                    onClick={() => setStepPanelTab(tab)}
                                                    style={{
                                                        flex: 1,
                                                        padding: '10px 8px',
                                                        border: 'none',
                                                        borderRight: tab === 'SCREENS' ? '1px solid #e5e7eb' : 'none',
                                                        backgroundColor: stepPanelTab === tab ? '#e5e7eb' : 'transparent',
                                                        color: '#374151',
                                                        fontWeight: 700,
                                                        fontSize: '0.95rem',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    {tab}
                                                </button>
                                            ))}
                                        </div>

                                        {stepPanelTab === 'SCREENS' ? (
                                            <>
                                                <div style={{ flex: 1, overflowY: 'auto', padding: '8px', backgroundColor: '#f9fafb' }}>
                                                    {filteredSteps.length === 0 ? (
                                                        <div style={{ padding: '10px', fontSize: '0.85rem', color: 'var(--text-quaternary)' }}>No screen found.</div>
                                                    ) : (
                                                        filteredSteps.map((step, idx) => {
                                                            const isGroup = step.stepType === 'Step Group';
                                                            const isChild = !!step.parentGroupId;
                                                            const groupCollapsed = collapsedStepGroups[step.id];
                                                            const groupChildrenCount = steps.filter(s => s.parentGroupId === step.id).length;

                                                            if (isGroup) {
                                                                return (
                                                                    <div
                                                                        key={step.id}
                                                                        draggable={true}
                                                                        onDragStart={(e) => {
                                                                            e.dataTransfer.setData('sourceStepId', step.id);
                                                                            e.stopPropagation();
                                                                        }}
                                                                        onDragOver={(e) => e.preventDefault()}
                                                                        onDrop={(e) => handleStepDrop(e, step.id)}
                                                                        style={{
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            gap: '8px',
                                                                            padding: '8px 6px',
                                                                            borderRadius: '6px',
                                                                            marginBottom: '3px',
                                                                            backgroundColor: currentStepId === step.id ? '#f3e8ff' : '#f8fafc',
                                                                            border: `1px solid ${currentStepId === step.id ? '#ddd6fe' : '#e2e8f0'}`,
                                                                            cursor: 'grab'
                                                                        }}
                                                                    >
                                                                        <button
                                                                            onClick={() => setCollapsedStepGroups(prev => ({ ...prev, [step.id]: !prev[step.id] }))}
                                                                            style={{ border: 'none', background: 'transparent', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#6d28d9' }}
                                                                            title={groupCollapsed ? 'Expand group' : 'Collapse group'}
                                                                        >
                                                                            <ChevronRight size={14} style={{ transform: groupCollapsed ? 'rotate(0deg)' : 'rotate(90deg)', transition: 'transform 0.15s' }} />
                                                                        </button>

                                                                        <button
                                                                            onClick={() => setCurrentStepId(step.id)}
                                                                            style={{ border: 'none', background: 'transparent', padding: 0, margin: 0, display: 'flex', alignItems: 'center', gap: '8px', flex: 1, cursor: 'pointer', textAlign: 'left' }}
                                                                        >
                                                                            <Layout size={14} color="#6d28d9" />
                                                                            <span style={{ fontSize: '0.92rem', color: '#5b21b6', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                                                {step.title || `Step Group ${idx + 1}`}
                                                                            </span>
                                                                        </button>

                                                                        <span style={{ fontSize: '0.66rem', color: '#6d28d9', backgroundColor: '#ede9fe', border: '1px solid #ddd6fe', borderRadius: '999px', padding: '2px 6px', fontWeight: 700 }}>
                                                                            {groupChildrenCount}
                                                                        </span>

                                                                        <button
                                                                            onClick={() => {
                                                                                setCurrentStepId(step.id);
                                                                                addStep('Screen');
                                                                            }}
                                                                            style={{ border: 'none', background: 'transparent', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#7c3aed' }}
                                                                            title="Add screen inside group"
                                                                        >
                                                                            <Plus size={14} />
                                                                        </button>

                                                                        <button
                                                                            onClick={(e) => deleteStep(step.id, e)}
                                                                            title="Delete Group"
                                                                            style={{ border: 'none', background: 'transparent', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--text-quaternary)' }}
                                                                            onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                                                                            onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
                                                                        >
                                                                            <Trash2 size={14} />
                                                                        </button>
                                                                    </div>
                                                                );
                                                            }

                                                            const typeBadge = step.stepType === 'Signature Form'
                                                                ? { text: 'Signature', bg: '#dcfce7', color: '#166534', border: '#bbf7d0' }
                                                                : step.stepType === 'Form Step'
                                                                    ? { text: 'Form', bg: '#dbeafe', color: '#1e40af', border: '#bfdbfe' }
                                                                    : null;

                                                            return (
                                                                <div key={step.id}>
                                                                    <div
                                                                        draggable={true}
                                                                        onDragStart={(e) => {
                                                                            e.dataTransfer.setData('sourceStepId', step.id);
                                                                            e.stopPropagation();
                                                                        }}
                                                                        onDragOver={(e) => e.preventDefault()}
                                                                        onDrop={(e) => handleStepDrop(e, step.id)}
                                                                        onClick={() => setCurrentStepId(step.id)}
                                                                        style={{
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            gap: '8px',
                                                                            padding: '6px 6px',
                                                                            paddingLeft: isChild ? '24px' : '6px',
                                                                            borderRadius: '4px',
                                                                            cursor: 'pointer',
                                                                            backgroundColor: currentStepId === step.id ? '#dbeafe' : 'transparent',
                                                                            color: 'var(--text-secondary)',
                                                                            fontWeight: currentStepId === step.id ? 700 : 500,
                                                                            marginBottom: '2px'
                                                                        }}
                                                                    >
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                setExpandedSteps(prev => ({ ...prev, [step.id]: !prev[step.id] }));
                                                                            }}
                                                                            style={{ border: 'none', background: 'transparent', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--text-quaternary)' }}
                                                                        >
                                                                            <ChevronRight size={14} style={{ transform: expandedSteps[step.id] ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }} />
                                                                        </button>

                                                                        <FileText size={14} color={step.stepType === 'Signature Form' ? '#16a34a' : '#64748b'} />
                                                                        <span style={{ fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>
                                                                            {step.title || `Screen ${idx + 1}`}
                                                                        </span>
                                                                        {typeBadge && (
                                                                            <span style={{ fontSize: '0.62rem', color: typeBadge.color, backgroundColor: typeBadge.bg, border: `1px solid ${typeBadge.border}`, borderRadius: '999px', padding: '2px 6px', fontWeight: 700 }}>
                                                                                {typeBadge.text}
                                                                            </span>
                                                                        )}

                                                                        <button
                                                                            onClick={(e) => deleteStep(step.id, e)}
                                                                            title="Delete Screen"
                                                                            style={{ border: 'none', background: 'transparent', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--text-quaternary)' }}
                                                                            onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                                                                            onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
                                                                        >
                                                                            <Trash2 size={12} />
                                                                        </button>
                                                                    </div>

                                                                    {/* Expanded Widget View */}
                                                                    {expandedSteps[step.id] && (
                                                                        <div style={{ paddingLeft: isChild ? '45px' : '27px', marginBottom: '6px' }}>
                                                                            {step.components.length === 0 ? (
                                                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-quaternary)', fontStyle: 'italic', padding: '4px' }}>No widgets</div>
                                                                            ) : (
                                                                                step.components.map(comp => {
                                                                                    const compConfig = COMPONENT_TYPES[comp.type] || { label: comp.type, icon: Square };
                                                                                    const CompIcon = compConfig.icon || Square;
                                                                                    return (
                                                                                        <div
                                                                                            key={comp.id}
                                                                                            onClick={() => {
                                                                                                setCurrentStepId(step.id);
                                                                                                setSelectedCompIds([comp.id]);
                                                                                                setActiveTab('WIDGET');
                                                                                            }}
                                                                                            style={{
                                                                                                display: 'flex',
                                                                                                alignItems: 'center',
                                                                                                gap: '6px',
                                                                                                padding: '4px 6px',
                                                                                                borderRadius: '4px',
                                                                                                cursor: 'pointer',
                                                                                                backgroundColor: selectedCompId === comp.id && currentStepId === step.id ? '#f1f5f9' : 'transparent',
                                                                                                color: selectedCompId === comp.id && currentStepId === step.id ? '#3b82f6' : '#64748b'
                                                                                            }}
                                                                                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                                                                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = selectedCompId === comp.id && currentStepId === step.id ? '#f1f5f9' : 'transparent'}
                                                                                        >
                                                                                            <CompIcon size={12} />
                                                                                            <span style={{ fontSize: '0.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                                                                {comp.displayName || comp.name || comp.props.label || comp.props.text || comp.type}
                                                                                            </span>
                                                                                        </div>
                                                                                    );
                                                                                })
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        })
                                                    )}

                                                </div>
                                            </>
                                        ) : (
                                            <div style={{ padding: '14px', flex: 1, overflowY: 'auto', backgroundColor: 'var(--bg-secondary)' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                                                    <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>App Data Sources</div>
                                                    <div style={{ position: 'relative' }}>
                                                        <button
                                                            onClick={() => setActiveDropdown(activeDropdown === 'ADD_TABLE' ? null : 'ADD_TABLE')}
                                                            style={{ background: '#3b82f6', border: 'none', color: 'white', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: 700 }}
                                                        >
                                                            <Plus size={14} /> Add Table
                                                        </button>
                                                        {activeDropdown === 'ADD_TABLE' && (
                                                            <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '4px', width: '200px', backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-primary)', borderRadius: '6px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', zIndex: 100 }}>
                                                                {tables.filter(t => !appTables.includes(t.id)).length === 0 ? (
                                                                    <div style={{ padding: '10px', fontSize: '0.75rem', color: 'var(--text-quaternary)', fontStyle: 'italic' }}>No more tables available</div>
                                                                ) : (
                                                                    tables.filter(t => !appTables.includes(t.id)).map(t => (
                                                                        <div
                                                                            key={t.id}
                                                                            onClick={() => {
                                                                                handleAddTableToApp(t.id);
                                                                                setActiveDropdown(null);
                                                                            }}
                                                                            style={{ padding: '8px 12px', fontSize: '0.8rem', cursor: 'pointer', borderBottom: '1px solid var(--border-secondary)' }}
                                                                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                                                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                                                        >
                                                                            {t.name}
                                                                        </div>
                                                                    ))
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {appTables.length === 0 ? (
                                                    <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-quaternary)', backgroundColor: 'var(--bg-panel)', borderRadius: '8px', border: '1px dashed var(--border-secondary)', fontSize: '0.85rem' }}>
                                                        No tables added to this app yet. Click "Add Table" to start.
                                                    </div>
                                                ) : (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                        {appTables.map(tId => {
                                                            const table = tables.find(t => t.id === tId);
                                                            if (!table) return null;
                                                            return (
                                                                <div key={tId} style={{ backgroundColor: 'var(--bg-panel)', borderRadius: '8px', border: '1px solid var(--border-primary)', overflow: 'hidden', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                                                                    <div style={{ padding: '10px 12px', backgroundColor: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                            <Database size={14} color="#3b82f6" />
                                                                            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>{table.name}</span>
                                                                        </div>
                                                                        <button
                                                                            onClick={() => handleRemoveTableFromApp(tId)}
                                                                            style={{ background: 'transparent', border: 'none', color: 'var(--text-quaternary)', cursor: 'pointer', padding: '4px' }}
                                                                            title="Remove Table from App"
                                                                        >
                                                                            <X size={14} />
                                                                        </button>
                                                                    </div>

                                                                    <div style={{ padding: '10px' }}>
                                                                        {/* Queries Section */}
                                                                        <div style={{ marginBottom: '12px' }}>
                                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                                                                <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-quaternary)', textTransform: 'uppercase' }}>Queries</span>
                                                                                <button
                                                                                    onClick={() => setQueryEditor({
                                                                                        isOpen: true, tableId: tId, query: { name: '', filters: [], sort: [] }, onSave: (q) => {
                                                                                            const updatedQueries = table.queries ? [...table.queries, { ...q, id: `q_${Date.now()}` }] : [{ ...q, id: `q_${Date.now()}` }];
                                                                                            updateTable(tId, { queries: updatedQueries });
                                                                                        }
                                                                                    })}
                                                                                    style={{ background: 'transparent', border: 'none', color: '#3b82f6', cursor: 'pointer', padding: 0 }}
                                                                                ><Plus size={12} /></button>
                                                                            </div>
                                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                                                {(table.queries || []).map(q => (
                                                                                    <div key={q.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 8px', backgroundColor: 'var(--bg-secondary)', borderRadius: '4px', fontSize: '0.75rem', border: '1px solid var(--border-secondary)' }}>
                                                                                        <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{q.name}</span>
                                                                                        <button onClick={() => setQueryEditor({
                                                                                            isOpen: true, tableId: tId, query: q, onSave: (updatedQ) => {
                                                                                                const nextQueries = table.queries.map(item => item.id === q.id ? updatedQ : item);
                                                                                                updateTable(tId, { queries: nextQueries });
                                                                                            }
                                                                                        })} style={{ border: 'none', background: 'transparent', color: 'var(--text-quaternary)', cursor: 'pointer' }}><ChevronRight size={12} /></button>
                                                                                    </div>
                                                                                ))}
                                                                                {(table.queries || []).length === 0 && <div style={{ fontSize: '0.7rem', color: 'var(--text-quaternary)', fontStyle: 'italic' }}>No queries defined</div>}
                                                                            </div>
                                                                        </div>

                                                                        {/* Aggregations Section */}
                                                                        <div style={{ marginBottom: '12px' }}>
                                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                                                                <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-quaternary)', textTransform: 'uppercase' }}>Aggregations</span>
                                                                                <button
                                                                                    onClick={() => setAggregationEditor({
                                                                                        isOpen: true, tableId: tId, aggregation: { name: '', calculation: 'count', field: '' }, onSave: (a) => {
                                                                                            const updatedAggs = table.aggregations ? [...table.aggregations, { ...a, id: `agg_${Date.now()}` }] : [{ ...a, id: `agg_${Date.now()}` }];
                                                                                            updateTable(tId, { aggregations: updatedAggs });
                                                                                        }
                                                                                    })}
                                                                                    style={{ background: 'transparent', border: 'none', color: '#3b82f6', cursor: 'pointer', padding: 0 }}
                                                                                ><Plus size={12} /></button>
                                                                            </div>
                                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                                                {(table.aggregations || []).map(a => (
                                                                                    <div key={a.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 8px', backgroundColor: 'var(--bg-secondary)', borderRadius: '4px', fontSize: '0.75rem', border: '1px solid var(--border-secondary)' }}>
                                                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                                                            <span style={{ color: 'var(--text-quaternary)', fontWeight: 800, fontSize: '0.6rem', textTransform: 'uppercase' }}>{a.calculation}</span>
                                                                                            <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{a.name}</span>
                                                                                        </div>
                                                                                        <button onClick={() => setAggregationEditor({
                                                                                            isOpen: true, tableId: tId, aggregation: a, onSave: (updatedA) => {
                                                                                                const nextAggs = table.aggregations.map(item => item.id === a.id ? updatedA : item);
                                                                                                updateTable(tId, { aggregations: nextAggs });
                                                                                            }
                                                                                        })} style={{ border: 'none', background: 'transparent', color: 'var(--text-quaternary)', cursor: 'pointer' }}><ChevronRight size={12} /></button>
                                                                                    </div>
                                                                                ))}
                                                                                {(table.aggregations || []).length === 0 && <div style={{ fontSize: '0.7rem', color: 'var(--text-quaternary)', fontStyle: 'italic' }}>No aggregations defined</div>}
                                                                            </div>
                                                                        </div>

                                                                        {/* Record Placeholders for this table */}
                                                                        <div>
                                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                                                                <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-quaternary)', textTransform: 'uppercase' }}>Record Placeholders</span>
                                                                                <button
                                                                                    onClick={() => setProPrompt({
                                                                                        isOpen: true,
                                                                                        title: 'New Placeholder',
                                                                                        message: `Name for placeholder on table ${table.name}:`,
                                                                                        initialValue: '',
                                                                                        onConfirm: (name) => {
                                                                                            if (!name) return;
                                                                                            setRecordPlaceholders([...recordPlaceholders, { id: `rec_${Date.now()}`, name, tableId: tId }]);
                                                                                        }
                                                                                    })}
                                                                                    style={{ background: 'transparent', border: 'none', color: '#3b82f6', cursor: 'pointer', padding: 0 }}
                                                                                ><Plus size={12} /></button>
                                                                            </div>
                                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                                                {recordPlaceholders.filter(rp => rp.tableId === tId).map(rp => (
                                                                                    <div key={rp.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 8px', backgroundColor: '#f0fdf4', borderRadius: '4px', fontSize: '0.75rem', border: '1px solid #dcfce7' }}>
                                                                                        <span style={{ color: '#166534', fontWeight: 700 }}>{rp.name}</span>
                                                                                        <button onClick={() => setRecordPlaceholders(recordPlaceholders.filter(r => r.id !== rp.id))} style={{ border: 'none', background: 'transparent', color: 'var(--text-quaternary)', cursor: 'pointer' }}><Trash2 size={10} /></button>
                                                                                    </div>
                                                                                ))}
                                                                                {recordPlaceholders.filter(rp => rp.tableId === tId).length === 0 && <div style={{ fontSize: '0.7rem', color: 'var(--text-quaternary)', fontStyle: 'italic' }}>No placeholders</div>}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div style={{ padding: '20px', borderTop: '1px solid var(--border-secondary)', flex: 1, overflowY: 'auto' }}>
                                    <div style={{ fontSize: '0.65rem', color: 'var(--text-quaternary)', marginBottom: '15px', textTransform: 'uppercase', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <FolderOpen size={12} /> MY FRONT-LINE APPS
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        {appsList.length === 0 ? (
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-quaternary)', fontStyle: 'italic', padding: '10px', textAlign: 'center' }}>No saved apps yet.</div>
                                        ) : (
                                            appsList.map(app => (
                                                <div
                                                    key={app.id}
                                                    onClick={() => loadApp(app)}
                                                    style={{
                                                        padding: '10px 12px',
                                                        borderRadius: '6px',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center',
                                                        backgroundColor: currentAppId === app.id ? 'var(--odoo-accent)' : 'transparent',
                                                        border: currentAppId === app.id ? '1px solid var(--odoo-teal)' : '1px solid transparent',
                                                        transition: 'all 0.15s',
                                                        position: 'relative',
                                                        group: true
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.backgroundColor = 'var(--odoo-accent)';
                                                        const btn = e.currentTarget.querySelector('[data-delete-btn]');
                                                        if (btn) btn.style.opacity = '1';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        if (currentAppId !== app.id) {
                                                            e.currentTarget.style.backgroundColor = 'transparent';
                                                        }
                                                        const btn = e.currentTarget.querySelector('[data-delete-btn]');
                                                        if (btn) btn.style.opacity = '0.3';
                                                    }}
                                                >
                                                    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
                                                        <span style={{ fontSize: '0.85rem', fontWeight: currentAppId === app.id ? 700 : 500, color: currentAppId === app.id ? 'var(--odoo-teal)' : 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{app.name}</span>
                                                        <span style={{ fontSize: '0.65rem', color: 'var(--text-quaternary)' }}>Updated {new Date(app.updated_at).toLocaleDateString()}</span>
                                                    </div>
                                                    <div style={{ opacity: 0.3, transition: 'opacity 0.2s ease', display: 'flex', gap: '5px', marginLeft: '8px' }} data-delete-btn>
                                                        <button
                                                            onClick={(e) => handleDeleteApp(app.id, e)}
                                                            title="Delete App"
                                                            style={{
                                                                border: 'none',
                                                                backgroundColor: 'transparent',
                                                                color: '#ef4444',
                                                                padding: '6px 8px',
                                                                cursor: 'pointer',
                                                                borderRadius: '4px',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                fontSize: '0.8rem',
                                                                fontWeight: '600',
                                                                transition: 'all 0.2s ease'
                                                            }}
                                                            onMouseEnter={(e) => {
                                                                e.currentTarget.style.backgroundColor = '#ef4444';
                                                                e.currentTarget.style.color = '#ffffff';
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                e.currentTarget.style.backgroundColor = 'transparent';
                                                                e.currentTarget.style.color = '#ef4444';
                                                            }}
                                                        >
                                                            <Trash2 size={14} style={{ marginRight: '4px' }} />
                                                            Delete
                                                        </button>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Center Pane: Canvas & Completions */}
        </>
    );
}

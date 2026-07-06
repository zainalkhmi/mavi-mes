import React, { useState } from 'react';
import {
    FolderOpen, FolderPlus, Plus, Trash2, ChevronRight, ChevronDown,
    Play, Edit2, Check, X, Copy, Layers, Zap
} from 'lucide-react';
import toast from 'react-hot-toast';
import { TEMPLATES, createDefaultJob } from './quickbuildToolTypes';

/**
 * QuickBuildWorkspace — Workspace Explorer tree view (Cognex-style hierarchy)
 * 
 * Workspace
 * ├── Job 1 (pipeline + image source)
 * ├── Job 2
 * └── ...
 */
export default function QuickBuildWorkspace({
    workspace,
    setWorkspace,
    activeJobIndex,
    setActiveJobIndex,
    onLoadTemplate,
    onRunAllJobs,
    isRunning,
}) {
    const [editingJobId, setEditingJobId] = useState(null);
    const [editName, setEditName] = useState('');
    const [expandedWorkspace, setExpandedWorkspace] = useState(true);
    const [editingWorkspaceName, setEditingWorkspaceName] = useState(false);
    const [wsNameDraft, setWsNameDraft] = useState('');

    const jobs = workspace?.jobs || [];
    const activeJob = jobs[activeJobIndex] || null;

    // ── Add new Job ────────────────────────────────────────────
    const handleAddJob = () => {
        const newJob = createDefaultJob(`Job ${jobs.length + 1}`);
        setWorkspace(prev => ({
            ...prev,
            updatedAt: new Date().toISOString(),
            jobs: [...prev.jobs, newJob],
        }));
        setActiveJobIndex(jobs.length);
        toast.success(`Created "${newJob.name}"`);
    };

    // ── Delete Job ─────────────────────────────────────────────
    const handleDeleteJob = (index) => {
        if (jobs.length <= 1) {
            toast.error('Cannot delete the last job in a workspace.');
            return;
        }
        const jobName = jobs[index].name;
        setWorkspace(prev => ({
            ...prev,
            updatedAt: new Date().toISOString(),
            jobs: prev.jobs.filter((_, i) => i !== index),
        }));
        if (activeJobIndex >= index && activeJobIndex > 0) {
            setActiveJobIndex(prev => prev - 1);
        }
        toast.success(`Deleted "${jobName}"`);
    };

    // ── Duplicate Job ──────────────────────────────────────────
    const handleDuplicateJob = (index) => {
        const source = jobs[index];
        const clone = {
            ...JSON.parse(JSON.stringify(source)),
            id: `job_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            name: `${source.name} (Copy)`,
        };
        setWorkspace(prev => ({
            ...prev,
            updatedAt: new Date().toISOString(),
            jobs: [...prev.jobs, clone],
        }));
        setActiveJobIndex(jobs.length);
        toast.success(`Duplicated "${source.name}"`);
    };

    // ── Rename Job ─────────────────────────────────────────────
    const startRenameJob = (index) => {
        setEditingJobId(jobs[index].id);
        setEditName(jobs[index].name);
    };
    const confirmRenameJob = (index) => {
        if (!editName.trim()) return;
        setWorkspace(prev => ({
            ...prev,
            updatedAt: new Date().toISOString(),
            jobs: prev.jobs.map((j, i) => i === index ? { ...j, name: editName.trim() } : j),
        }));
        setEditingJobId(null);
        toast.success('Job renamed');
    };

    // ── Rename Workspace ───────────────────────────────────────
    const startRenameWs = () => {
        setEditingWorkspaceName(true);
        setWsNameDraft(workspace.name);
    };
    const confirmRenameWs = () => {
        if (!wsNameDraft.trim()) return;
        setWorkspace(prev => ({
            ...prev,
            name: wsNameDraft.trim(),
            updatedAt: new Date().toISOString(),
        }));
        setEditingWorkspaceName(false);
        toast.success('Workspace renamed');
    };

    // ── Styles ─────────────────────────────────────────────────
    const treeItemStyle = (isActive) => ({
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 8px 6px 24px',
        borderRadius: '6px',
        backgroundColor: isActive ? 'rgba(59, 130, 246, 0.08)' : 'transparent',
        border: isActive ? '1px solid rgba(59, 130, 246, 0.2)' : '1px solid transparent',
        cursor: 'pointer',
        transition: 'all 0.12s',
        fontSize: '0.75rem',
        fontWeight: isActive ? 700 : 600,
        color: isActive ? '#2563eb' : '#334155',
    });

    const iconBtnStyle = {
        border: 'none',
        backgroundColor: 'transparent',
        cursor: 'pointer',
        padding: '2px',
        borderRadius: '4px',
        display: 'flex',
        alignItems: 'center',
        color: '#94a3b8',
        transition: 'color 0.1s',
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            backgroundColor: 'white',
            borderRadius: '16px',
            border: '1px solid #cbd5e1',
            padding: '12px',
            overflow: 'hidden',
        }}>
            {/* ── Header ────────────────────────────────────────── */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingBottom: '8px',
                borderBottom: '1px solid #e2e8f0',
                marginBottom: '4px',
            }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Layers size={14} color="#3b82f6" /> Workspace Explorer
                </span>
                <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                        onClick={handleAddJob}
                        title="Add new Job"
                        style={{ ...iconBtnStyle, color: '#3b82f6' }}
                    >
                        <FolderPlus size={14} />
                    </button>
                    <button
                        onClick={onRunAllJobs}
                        disabled={isRunning}
                        title="Run All Jobs"
                        style={{
                            ...iconBtnStyle,
                            color: isRunning ? '#94a3b8' : '#10b981',
                            cursor: isRunning ? 'default' : 'pointer',
                        }}
                    >
                        <Play size={14} />
                    </button>
                </div>
            </div>

            {/* ── Workspace Node ─────────────────────────────────── */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 8px',
                    cursor: 'pointer',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(59, 130, 246, 0.04)',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    color: '#1e293b',
                }}
                onClick={() => setExpandedWorkspace(!expandedWorkspace)}
            >
                {expandedWorkspace ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                <FolderOpen size={14} color="#3b82f6" />
                {editingWorkspaceName ? (
                    <div style={{ display: 'flex', gap: '4px', flex: 1, alignItems: 'center' }} onClick={e => e.stopPropagation()}>
                        <input
                            value={wsNameDraft}
                            onChange={e => setWsNameDraft(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') confirmRenameWs(); if (e.key === 'Escape') setEditingWorkspaceName(false); }}
                            autoFocus
                            style={{ flex: 1, padding: '2px 6px', border: '1px solid #3b82f6', borderRadius: '4px', fontSize: '0.75rem', outline: 'none' }}
                        />
                        <button onClick={confirmRenameWs} style={iconBtnStyle}><Check size={12} color="#10b981" /></button>
                        <button onClick={() => setEditingWorkspaceName(false)} style={iconBtnStyle}><X size={12} color="#ef4444" /></button>
                    </div>
                ) : (
                    <span
                        style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                        onDoubleClick={(e) => { e.stopPropagation(); startRenameWs(); }}
                        title="Double-click to rename"
                    >
                        {workspace.name}
                    </span>
                )}
            </div>

            {/* ── Job List ───────────────────────────────────────── */}
            {expandedWorkspace && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', paddingLeft: '8px' }}>
                    {jobs.map((job, index) => {
                        const isActive = index === activeJobIndex;
                        const isEditing = editingJobId === job.id;
                        const resultIcon = job.lastRunResult === true ? '✅' : job.lastRunResult === false ? '❌' : '';

                        return (
                            <div
                                key={job.id}
                                style={treeItemStyle(isActive)}
                                onClick={() => { if (!isEditing) setActiveJobIndex(index); }}
                                onMouseEnter={e => { if (!isActive) e.currentTarget.style.backgroundColor = '#f1f5f9'; }}
                                onMouseLeave={e => { if (!isActive) e.currentTarget.style.backgroundColor = 'transparent'; }}
                            >
                                <Zap size={12} color={isActive ? '#3b82f6' : '#94a3b8'} />

                                {isEditing ? (
                                    <div style={{ display: 'flex', gap: '4px', flex: 1, alignItems: 'center' }} onClick={e => e.stopPropagation()}>
                                        <input
                                            value={editName}
                                            onChange={e => setEditName(e.target.value)}
                                            onKeyDown={e => { if (e.key === 'Enter') confirmRenameJob(index); if (e.key === 'Escape') setEditingJobId(null); }}
                                            autoFocus
                                            style={{ flex: 1, padding: '2px 6px', border: '1px solid #3b82f6', borderRadius: '4px', fontSize: '0.72rem', outline: 'none' }}
                                        />
                                        <button onClick={() => confirmRenameJob(index)} style={iconBtnStyle}><Check size={10} color="#10b981" /></button>
                                        <button onClick={() => setEditingJobId(null)} style={iconBtnStyle}><X size={10} color="#ef4444" /></button>
                                    </div>
                                ) : (
                                    <>
                                        <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                                            onDoubleClick={e => { e.stopPropagation(); startRenameJob(index); }}
                                            title="Double-click to rename"
                                        >
                                            {job.name} {resultIcon}
                                        </span>

                                        {/* Actions (visible on active only) */}
                                        {isActive && (
                                            <div style={{ display: 'flex', gap: '2px' }} onClick={e => e.stopPropagation()}>
                                                <button onClick={() => startRenameJob(index)} title="Rename" style={iconBtnStyle}><Edit2 size={10} /></button>
                                                <button onClick={() => handleDuplicateJob(index)} title="Duplicate" style={iconBtnStyle}><Copy size={10} /></button>
                                                <button onClick={() => handleDeleteJob(index)} title="Delete" style={{ ...iconBtnStyle, color: '#ef4444' }}><Trash2 size={10} /></button>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        );
                    })}

                    {/* Add Job button inline */}
                    <button
                        onClick={handleAddJob}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '5px 8px 5px 24px',
                            border: '1px dashed #cbd5e1',
                            borderRadius: '6px',
                            backgroundColor: 'transparent',
                            color: '#94a3b8',
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.12s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.color = '#3b82f6'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.color = '#94a3b8'; }}
                    >
                        <Plus size={12} /> Add Job
                    </button>
                </div>
            )}

            {/* ── Template Quick Load ────────────────────────────── */}
            <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Quick Templates
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '6px' }}>
                    {TEMPLATES.map((t, idx) => (
                        <button
                            key={t.name}
                            onClick={() => onLoadTemplate(idx)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '5px 8px',
                                border: '1px solid #e2e8f0',
                                borderRadius: '6px',
                                backgroundColor: '#fafafa',
                                color: '#475569',
                                fontSize: '0.68rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                textAlign: 'left',
                                transition: 'all 0.12s',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.backgroundColor = '#f0f7ff'; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.backgroundColor = '#fafafa'; }}
                            title={t.description}
                        >
                            <Zap size={10} color="#f59e0b" />
                            <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.name}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

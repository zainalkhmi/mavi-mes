import React, { useState, useEffect, useRef } from 'react';
import {
    Play, Plus, Save, Sliders, Sparkles, ChevronDown, Layers
} from 'lucide-react';
import toast from 'react-hot-toast';

// Sub-components
import QuickBuildWorkspace from './quickbuild/QuickBuildWorkspace';
import QuickBuildCanvas from './quickbuild/QuickBuildCanvas';
import QuickBuildNodeEditor from './quickbuild/QuickBuildNodeEditor';
import QuickBuildMonitor from './quickbuild/QuickBuildMonitor';
import {
    NODE_TYPES,
    TOOL_CATEGORIES,
    CATEGORY_ORDER,
    getToolsByCategory,
    createNodeFromType,
    getSimulatedValue,
    TEMPLATES,
    DEFAULT_DRAWINGS,
    createDefaultWorkspace,
    createDefaultJob,
} from './quickbuild/quickbuildToolTypes';

/**
 * QuickBuildPipeline — Main composer component (Cognex QuickBuild equivalent).
 * 
 * Layout:
 * ┌─────────────┬───────────────────────────┬─────────────────┐
 * │  Workspace   │     Flowchart Canvas      │  Tool Blocks    │
 * │  Explorer    │    (drag & drop nodes)    │  Parameter Ed.  │
 * │             │                           │  Live Monitor   │
 * └─────────────┴───────────────────────────┴─────────────────┘
 */
export default function QuickBuildPipeline({ appVariables = [], cameraConfigs = [] }) {
    // ═══ Workspace State ═══════════════════════════════════════
    const [workspace, setWorkspace] = useState(() => {
        const saved = localStorage.getItem('mavi_quickbuild_workspace');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (parsed && parsed.jobs) return parsed;
            } catch (e) { /* ignore */ }
        }
        // Load default workspace with first template
        const ws = createDefaultWorkspace();
        ws.jobs[0] = {
            ...ws.jobs[0],
            name: TEMPLATES[0].name,
            nodes: JSON.parse(JSON.stringify(TEMPLATES[0].nodes)),
            links: JSON.parse(JSON.stringify(TEMPLATES[0].links)),
        };
        return ws;
    });
    const [activeJobIndex, setActiveJobIndex] = useState(workspace.activeJobIndex || 0);

    // Active job shortcuts
    const activeJob = workspace.jobs[activeJobIndex] || workspace.jobs[0];
    const nodes = activeJob?.nodes || [];
    const links = activeJob?.links || [];

    // ═══ Derived state setters for active job ══════════════════
    const setNodes = (updater) => {
        setWorkspace(prev => {
            const newJobs = [...prev.jobs];
            const job = { ...newJobs[activeJobIndex] };
            job.nodes = typeof updater === 'function' ? updater(job.nodes) : updater;
            newJobs[activeJobIndex] = job;
            return { ...prev, jobs: newJobs, updatedAt: new Date().toISOString() };
        });
    };
    const setLinks = (updater) => {
        setWorkspace(prev => {
            const newJobs = [...prev.jobs];
            const job = { ...newJobs[activeJobIndex] };
            job.links = typeof updater === 'function' ? updater(job.links) : updater;
            newJobs[activeJobIndex] = job;
            return { ...prev, jobs: newJobs, updatedAt: new Date().toISOString() };
        });
    };

    // ═══ UI State ══════════════════════════════════════════════
    const [selectedNodeId, setSelectedNodeId] = useState(null);
    const [isSimulating, setIsSimulating] = useState(false);
    const [simStepIndex, setSimStepIndex] = useState(-1);
    const [isRunning, setIsRunning] = useState(false);
    
    // App Builder style layout states
    const [activeLeftTab, setActiveLeftTab] = useState('jobs'); // 'jobs' | 'plc_comm'
    const [activeCenterTab, setActiveCenterTab] = useState('flowchart'); // 'flowchart' | 'monitor'
    const [activeToolbarCategory, setActiveToolbarCategory] = useState('source'); // category ID or null
    
    const [expandedCategories, setExpandedCategories] = useState(
        CATEGORY_ORDER.reduce((acc, cat) => ({ ...acc, [cat]: true }), {})
    );
    const [uploadedFile, setUploadedFile] = useState(null);
    const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
    const [processedImage, setProcessedImage] = useState(null);
    const webcamRef = useRef(null);
    const [useLiveCamera, setUseLiveCamera] = useState(false);
    const [devices, setDevices] = useState([]);
    const [selectedDeviceId, setSelectedDeviceId] = useState('');
    const [isContinuous, setIsContinuous] = useState(false);

    // ═══ Filmstrip Buffer States & Handlers ═════════════════════
    const [filmstripFrames, setFilmstripFrames] = useState([]);
    const [activeFilmstripIndex, setActiveFilmstripIndex] = useState(-1);
    const [isFilmstripPlaying, setIsFilmstripPlaying] = useState(false);

    // Filmstrip frame auto-playback effect
    useEffect(() => {
        if (!isFilmstripPlaying || filmstripFrames.length === 0) return;
        const interval = setInterval(() => {
            setActiveFilmstripIndex((prev) => (prev + 1) % filmstripFrames.length);
        }, 1000); // cycle every 1 second
        return () => clearInterval(interval);
    }, [isFilmstripPlaying, filmstripFrames.length]);

    // Sync selected filmstrip frame with processedImage display
    useEffect(() => {
        if (activeFilmstripIndex >= 0 && activeFilmstripIndex < filmstripFrames.length) {
            setProcessedImage(filmstripFrames[activeFilmstripIndex]);
        }
    }, [activeFilmstripIndex, filmstripFrames]);

    const handleAddFilmstripFrame = () => {
        const frameSource = processedImage || imagePreviewUrl;
        if (!frameSource) return;
        setFilmstripFrames(prev => {
            const next = [...prev, frameSource];
            if (next.length > 10) {
                next.shift();
            }
            return next;
        });
        setActiveFilmstripIndex(prev => {
            const newLen = Math.min(filmstripFrames.length + 1, 10);
            return newLen - 1;
        });
    };

    const handleClearFilmstrip = () => {
        setFilmstripFrames([]);
        setActiveFilmstripIndex(-1);
        setIsFilmstripPlaying(false);
    };

    // ═══ ROI State ═════════════════════════════════════════════
    const [roiRegions, setRoiRegions] = useState(activeJob?.roiRegions || []);

    // ═══ CAD Drawings ══════════════════════════════════════════
    const [drawingsList] = useState(() => {
        const saved = localStorage.getItem('mavi_drawings');
        if (saved) { try { const p = JSON.parse(saved); if (Array.isArray(p) && p.length) return p; } catch (e) { /* */ } }
        return DEFAULT_DRAWINGS;
    });

    // ═══ Modal State ═══════════════════════════════════════════
    const [modalConfig, setModalConfig] = useState(null);

    // ═══ Webcam devices ════════════════════════════════════════
    useEffect(() => {
        if (!navigator.mediaDevices?.enumerateDevices) return;
        navigator.mediaDevices.enumerateDevices().then(all => {
            const vids = all.filter(d => d.kind === 'videoinput');
            setDevices(vids);
            if (vids.length > 0 && !selectedDeviceId) setSelectedDeviceId(vids[0].deviceId);
        }).catch(() => {});
    }, [useLiveCamera]);

    // ═══ Auto-save workspace ═══════════════════════════════════
    useEffect(() => {
        const timer = setTimeout(() => {
            localStorage.setItem('mavi_quickbuild_workspace', JSON.stringify({
                ...workspace,
                activeJobIndex,
            }));
        }, 500);
        return () => clearTimeout(timer);
    }, [workspace, activeJobIndex]);

    // Sync ROI to job when changed
    useEffect(() => {
        setWorkspace(prev => {
            const newJobs = [...prev.jobs];
            if (newJobs[activeJobIndex]) {
                newJobs[activeJobIndex] = { ...newJobs[activeJobIndex], roiRegions };
            }
            return { ...prev, jobs: newJobs };
        });
    }, [roiRegions]);

    // Reset selection when switching jobs
    useEffect(() => {
        setSelectedNodeId(null);
        setIsSimulating(false);
        setSimStepIndex(-1);
        setProcessedImage(null);
        setRoiRegions(workspace.jobs[activeJobIndex]?.roiRegions || []);
    }, [activeJobIndex]);

    // ═══ DataURL to Blob ═══════════════════════════════════════
    const dataURLtoBlob = (dataurl) => {
        if (!dataurl || typeof dataurl !== 'string' || !dataurl.includes(',')) return null;
        try {
            const arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1];
            const bstr = atob(arr[1]);
            let n = bstr.length;
            const u8arr = new Uint8Array(n);
            while (n--) u8arr[n] = bstr.charCodeAt(n);
            return new Blob([u8arr], { type: mime });
        } catch (e) {
            console.error("Failed to convert dataURL to blob:", e);
            return null;
        }
    };

    // ═══ Continuous tick runner ═════════════════════════════════
    const runSingleContinuousTick = async () => {
        if (isRunning || !useLiveCamera || !webcamRef.current) return;
        try {
            const screenshot = webcamRef.current.getScreenshot();
            if (!screenshot) return;
            const blob = dataURLtoBlob(screenshot);
            const fileToSend = new File([blob], 'camera_frame.jpg', { type: 'image/jpeg' });
            const formData = new FormData();
            formData.append('file', fileToSend);
            formData.append('nodes', JSON.stringify(nodes));
            formData.append('links', JSON.stringify(links));
            formData.append('roi_regions', JSON.stringify(roiRegions));
            const response = await fetch('http://localhost:8000/quickbuild/run', { method: 'POST', body: formData });
            if (response.ok) {
                const data = await response.json();
                if (data.success) { setNodes(data.nodes); setProcessedImage(data.image); }
            }
        } catch (error) { console.error('Continuous error:', error); }
    };

    useEffect(() => {
        let intervalId;
        if (isContinuous && useLiveCamera) {
            intervalId = setInterval(runSingleContinuousTick, 1500);
        }
        return () => { if (intervalId) clearInterval(intervalId); };
    }, [isContinuous, useLiveCamera, nodes, links]);

    // ═══ Add Node ══════════════════════════════════════════════
    const handleAddNode = (type) => {
        const newNode = createNodeFromType(type);
        if (!newNode) return;
        setNodes(prev => [...prev, newNode]);
        setSelectedNodeId(newNode.id);
        toast.success(`Created: "${newNode.name}"`);
    };

    // ═══ Delete Node ═══════════════════════════════════════════
    const handleDeleteNode = (nodeId) => {
        setNodes(prev => prev.filter(n => n.id !== nodeId));
        setLinks(prev => prev.filter(l => l.fromNode !== nodeId && l.toNode !== nodeId));
        if (selectedNodeId === nodeId) setSelectedNodeId(null);
        toast.error('Removed node and connections.');
    };

    // ═══ Run Pipeline (Backend) ════════════════════════════════
    const handleRunPipeline = async () => {
        if (isRunning) return;
        setIsRunning(true);
        setProcessedImage(null);
        setNodes(prev => prev.map(n => ({ ...n, status: 'idle', value: 'Processing...' })));

        try {
            const formData = new FormData();
            let fileToSend = uploadedFile;
            if (useLiveCamera && webcamRef.current) {
                const screenshot = webcamRef.current.getScreenshot();
                if (screenshot) {
                    const blob = dataURLtoBlob(screenshot);
                    if (blob) fileToSend = new File([blob], 'camera_frame.jpg', { type: 'image/jpeg' });
                }
            }
            if (fileToSend) formData.append('file', fileToSend);
            formData.append('nodes', JSON.stringify(nodes));
            formData.append('links', JSON.stringify(links));
            formData.append('roi_regions', JSON.stringify(roiRegions));

            const response = await fetch('http://localhost:8000/quickbuild/run', { method: 'POST', body: formData });
            if (!response.ok) throw new Error(`Server ${response.status}`);

            const data = await response.json();
            if (data.success) {
                setNodes(data.nodes);
                setProcessedImage(data.image);
                // Update job result
                setWorkspace(prev => {
                    const newJobs = [...prev.jobs];
                    newJobs[activeJobIndex] = { ...newJobs[activeJobIndex], lastRunResult: data.overall_pass };
                    return { ...prev, jobs: newJobs };
                });
                toast[data.overall_pass ? 'success' : 'error'](`Inspection: ${data.overall_pass ? 'PASSED' : 'FAILED'}`);
            } else {
                toast.error(`Error: ${data.error || 'Unknown'}`);
            }
        } catch (error) {
            console.error('Backend offline, using simulator:', error);
            toast.error('Backend offline. Running simulator...');
            handleRunSimulation();
        } finally {
            setIsRunning(false);
        }
    };

    // ═══ Run Simulation ════════════════════════════════════════
    const handleRunSimulation = () => {
        if (isSimulating) return;
        setIsSimulating(true);
        setSimStepIndex(0);
        setNodes(prev => prev.map(n => ({ ...n, status: 'idle', value: null })));
    };

    useEffect(() => {
        if (isSimulating && simStepIndex >= 0 && simStepIndex < nodes.length) {
            const timer = setTimeout(() => {
                const updatedNodes = [...nodes];
                const currentNode = updatedNodes[simStepIndex];
                currentNode.value = getSimulatedValue(currentNode);
                currentNode.status = currentNode.value?.includes('FAIL') ? 'failed' : 'success';
                setNodes(updatedNodes);
                setSimStepIndex(prev => prev + 1);
            }, 800);
            return () => clearTimeout(timer);
        } else if (simStepIndex >= nodes.length && isSimulating) {
            setIsSimulating(false);
            setSimStepIndex(-1);
            // Update job result based on simulation
            const allPassed = nodes.every(n => n.status !== 'failed');
            setWorkspace(prev => {
                const newJobs = [...prev.jobs];
                newJobs[activeJobIndex] = { ...newJobs[activeJobIndex], lastRunResult: allPassed };
                return { ...prev, jobs: newJobs };
            });
            toast.success('Simulation completed!');
        }
    }, [isSimulating, simStepIndex]);

    // ═══ Load Template into current job ════════════════════════
    const handleLoadTemplate = (templateIdx) => {
        const template = TEMPLATES[templateIdx];
        if (!template) return;
        setWorkspace(prev => {
            const newJobs = [...prev.jobs];
            newJobs[activeJobIndex] = {
                ...newJobs[activeJobIndex],
                name: template.name,
                nodes: JSON.parse(JSON.stringify(template.nodes)),
                links: JSON.parse(JSON.stringify(template.links)),
                lastRunResult: null,
            };
            return { ...prev, jobs: newJobs, updatedAt: new Date().toISOString() };
        });
        setSelectedNodeId(null);
        setProcessedImage(null);
        toast.success(`Loaded template: "${template.name}"`);
    };

    // ═══ Run All Jobs ══════════════════════════════════════════
    const handleRunAllJobs = async () => {
        toast.success(`Running all ${workspace.jobs.length} jobs...`);
        for (let i = 0; i < workspace.jobs.length; i++) {
            setActiveJobIndex(i);
            // Small delay to allow UI update
            await new Promise(r => setTimeout(r, 300));
            await handleRunPipeline();
        }
        toast.success('All jobs completed!');
    };

    // ═══ Save Workspace ════════════════════════════════════════
    const handleSaveWorkspace = () => {
        setModalConfig({
            type: 'prompt',
            title: 'Save Workspace',
            message: 'Enter a name for this workspace:',
            defaultValue: workspace.name,
            onConfirm: (name) => {
                if (!name?.trim()) return;
                setWorkspace(prev => ({ ...prev, name: name.trim(), updatedAt: new Date().toISOString() }));
                localStorage.setItem('mavi_quickbuild_workspace', JSON.stringify({ ...workspace, name: name.trim() }));
                toast.success(`Workspace "${name.trim()}" saved!`);
            },
        });
    };

    // Tool groups for sidebar
    const toolGroups = getToolsByCategory();
    const selectedNode = nodes.find(n => n.id === selectedNodeId);

    // ═══════════════════════════════════════════════════════════
    // ═══ RENDER ════════════════════════════════════════════════
    // ═══════════════════════════════════════════════════════════
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            minHeight: 0,
            padding: '16px',
            gap: '16px',
            backgroundColor: '#f8fafc',
        }}>
            {/* ═══ APP BUILDER STYLE TOP TOOLBAR ═══════════════════ */}
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: 'white',
                borderRadius: '16px',
                border: '1px solid #cbd5e1',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                flexShrink: 0,
                zIndex: 100,
            }}>
                {/* Upper row: Workspace name & global actions */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 16px',
                    borderBottom: '1px solid #f1f5f9',
                    gap: '16px',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Layers size={16} color="#3b82f6" />
                        <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#1e293b' }}>
                            {workspace.name}
                        </span>
                    </div>

                    {/* Quick template load & global run/save actions */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748b' }}>Load Template:</span>
                            <select
                                onChange={e => { if (e.target.value !== '') { handleLoadTemplate(Number(e.target.value)); e.target.value = ''; } }}
                                style={{
                                    padding: '5px 10px',
                                    borderRadius: '8px',
                                    border: '1px solid #cbd5e1',
                                    fontSize: '0.72rem',
                                    fontWeight: 600,
                                    color: '#475569',
                                    outline: 'none',
                                    cursor: 'pointer'
                                }}
                            >
                                <option value="">Select template...</option>
                                {TEMPLATES.map((t, idx) => (
                                    <option key={t.name} value={idx}>{t.name}</option>
                                ))}
                            </select>
                        </div>

                        <button
                            onClick={handleRunAllJobs}
                            disabled={isRunning || isSimulating}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '6px 12px',
                                border: 'none',
                                borderRadius: '8px',
                                backgroundColor: '#10b981',
                                color: 'white',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                opacity: (isRunning || isSimulating) ? 0.6 : 1
                            }}
                        >
                            <Play size={12} fill="white" /> Run All
                        </button>

                        <button
                            onClick={handleSaveWorkspace}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '6px 12px',
                                border: '1px solid #cbd5e1',
                                borderRadius: '8px',
                                backgroundColor: 'white',
                                color: '#475569',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                cursor: 'pointer'
                            }}
                        >
                            <Save size={12} /> Save Workspace
                        </button>
                    </div>
                </div>

                {/* Lower row: Tool Blocks Categories */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    backgroundColor: 'white',
                    padding: '8px 12px',
                    gap: '8px',
                    overflowX: 'auto',
                }}>
                    <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginRight: '6px', whiteSpace: 'nowrap' }}>
                        🛠️ Categories:
                    </span>

                    {CATEGORY_ORDER.map(catId => {
                        const group = toolGroups[catId];
                        if (!group?.tools.length) return null;
                        const isActive = activeToolbarCategory === catId;

                        return (
                            <button
                                key={catId}
                                onClick={() => setActiveToolbarCategory(catId)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '6px 12px',
                                    borderRadius: '8px',
                                    border: '1px solid',
                                    borderColor: isActive ? '#3b82f6' : '#cbd5e1',
                                    backgroundColor: isActive ? '#eff6ff' : 'white',
                                    color: isActive ? '#1d4ed8' : '#475569',
                                    fontSize: '0.72rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    transition: 'all 0.15s',
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                <span style={{ fontSize: '1rem' }}>{group.icon}</span>
                                <span>{group.label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Sub-tools Horizontal Strip Drawer (App Builder Widget Style) */}
                {activeToolbarCategory && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        backgroundColor: '#f8fafc',
                        padding: '10px 16px',
                        borderTop: '1px solid #cbd5e1',
                        borderBottomLeftRadius: '16px',
                        borderBottomRightRadius: '16px',
                        gap: '8px',
                        overflowX: 'auto',
                    }}>
                        <span style={{ fontSize: '0.62rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginRight: '6px', whiteSpace: 'nowrap' }}>
                            📦 Widgets:
                        </span>
                        {toolGroups[activeToolbarCategory]?.tools.map(tool => (
                            <button
                                key={tool.typeId}
                                onClick={() => handleAddNode(tool.typeId)}
                                title={tool.desc}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '8px 14px',
                                    borderRadius: '10px',
                                    border: '1px solid #cbd5e1',
                                    backgroundColor: 'white',
                                    color: '#334155',
                                    fontSize: '0.72rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    transition: 'all 0.12s',
                                    whiteSpace: 'nowrap',
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.borderColor = tool.color;
                                    e.currentTarget.style.backgroundColor = '#f0f9ff';
                                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.borderColor = '#cbd5e1';
                                    e.currentTarget.style.backgroundColor = 'white';
                                    e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.02)';
                                }}
                            >
                                <span style={{ fontSize: '1.2rem' }}>{tool.icon}</span>
                                <span>{tool.label}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* ═══ MAIN WORKSPACE GRID ══════════════════════════════ */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '280px 1fr 340px',
                gap: '16px',
                flex: 1,
                minHeight: 0,
            }}>
                {/* ═══ LEFT PANEL: Jobs Explorer & PLC Comm ═══════════ */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', minHeight: 0 }}>
                    {/* Left Tabs (Jobs vs PLC Comm) */}
                    <div style={{ display: 'flex', backgroundColor: '#f1f5f9', padding: '3px', borderRadius: '8px', border: '1px solid #e2e8f0', flexShrink: 0 }}>
                        <button
                            onClick={() => setActiveLeftTab('jobs')}
                            style={{
                                flex: 1, padding: '6px 0', border: 'none', borderRadius: '6px', fontSize: '0.68rem', fontWeight: 800,
                                backgroundColor: activeLeftTab === 'jobs' ? 'white' : 'transparent',
                                color: activeLeftTab === 'jobs' ? '#0f172a' : '#64748b',
                                boxShadow: activeLeftTab === 'jobs' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                                cursor: 'pointer', transition: 'all 0.15s'
                            }}
                        >
                            📁 Jobs List
                        </button>
                        <button
                            onClick={() => setActiveLeftTab('plc_comm')}
                            style={{
                                flex: 1, padding: '6px 0', border: 'none', borderRadius: '6px', fontSize: '0.68rem', fontWeight: 800,
                                backgroundColor: activeLeftTab === 'plc_comm' ? 'white' : 'transparent',
                                color: activeLeftTab === 'plc_comm' ? '#0f172a' : '#64748b',
                                boxShadow: activeLeftTab === 'plc_comm' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                                cursor: 'pointer', transition: 'all 0.15s'
                            }}
                        >
                            🔌 PLC Comm
                        </button>
                    </div>

                    {activeLeftTab === 'jobs' ? (
                        <QuickBuildWorkspace
                            workspace={workspace}
                            setWorkspace={setWorkspace}
                            activeJobIndex={activeJobIndex}
                            setActiveJobIndex={setActiveJobIndex}
                            onLoadTemplate={handleLoadTemplate}
                            onRunAllJobs={handleRunAllJobs}
                            isRunning={isRunning || isSimulating}
                        />
                    ) : (
                        /* PLC Comm Simulator Panel */
                        <div style={{
                            backgroundColor: 'white', borderRadius: '16px', border: '1px solid #cbd5e1',
                            padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, overflowY: 'auto'
                        }}>
                            <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '6px' }}>
                                <h3 style={{ margin: 0, fontSize: '0.82rem', fontWeight: 800, color: '#1e293b' }}>
                                    🔌 PLC Communications
                                </h3>
                                <p style={{ margin: '4px 0 0 0', fontSize: '0.58rem', color: '#64748b' }}>
                                    Industrial I/O & Network Register Simulator.
                                </p>
                            </div>

                            {/* Connection info */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', backgroundColor: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.62rem', fontWeight: 700, color: '#64748b' }}>Protocol:</span>
                                    <select
                                        value={industrialCommState.protocol}
                                        onChange={e => setIndustrialCommState(prev => ({ ...prev, protocol: e.target.value }))}
                                        style={{ fontSize: '0.62rem', padding: '2px 4px', border: '1px solid #cbd5e1', borderRadius: '4px', outline: 'none' }}
                                    >
                                        <option value="Profinet">Profinet (Siemens)</option>
                                        <option value="EtherNetIP">EtherNet/IP (Rockwell)</option>
                                    </select>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.62rem', fontWeight: 700, color: '#64748b' }}>Status:</span>
                                    <span style={{ fontSize: '0.55rem', fontWeight: 700, color: '#10b981', backgroundColor: '#e2fbe8', padding: '2px 6px', borderRadius: '4px' }}>
                                        CONNECTED
                                    </span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                    <span style={{ fontSize: '0.58rem', fontWeight: 700, color: '#64748b' }}>PLC IP Address:</span>
                                    <input
                                        type="text"
                                        value={industrialCommState.plcIp}
                                        onChange={e => setIndustrialCommState(prev => ({ ...prev, plcIp: e.target.value }))}
                                        style={{ fontSize: '0.62rem', padding: '4px 8px', border: '1px solid #cbd5e1', borderRadius: '4px', outline: 'none' }}
                                    />
                                </div>
                            </div>

                            {/* IO Bit simulator */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#475569' }}>
                                    Live I/O Registers (Byte 0)
                                </span>
                                
                                {/* PLC output (Trigger) */}
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 8px', backgroundColor: '#f1f5f9', borderRadius: '6px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <span style={{
                                            width: '8px', height: '8px', borderRadius: '50%',
                                            backgroundColor: industrialCommState.bits.Trigger ? '#3b82f6' : '#cbd5e1',
                                            boxShadow: industrialCommState.bits.Trigger ? '0 0 6px #3b82f6' : 'none'
                                        }} />
                                        <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#1e293b' }}>Trigger</span>
                                    </div>
                                    <span style={{ fontSize: '0.55rem', fontFamily: 'monospace', color: '#64748b' }}>
                                        {industrialCommState.protocol === 'Profinet' ? 'I:0.0' : 'O:1/0'}
                                    </span>
                                </div>

                                {/* Camera outputs */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', border: '1px dashed #cbd5e1', padding: '8px', borderRadius: '8px' }}>
                                    <span style={{ fontSize: '0.55rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
                                        Camera Status bits
                                    </span>
                                    
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '3px 0' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <span style={{
                                                width: '8px', height: '8px', borderRadius: '50%',
                                                backgroundColor: industrialCommState.bits.Busy ? '#f59e0b' : '#cbd5e1',
                                                boxShadow: industrialCommState.bits.Busy ? '0 0 6px #f59e0b' : 'none'
                                            }} />
                                            <span style={{ fontSize: '0.62rem', color: '#475569' }}>Busy</span>
                                        </div>
                                        <span style={{ fontSize: '0.55rem', fontFamily: 'monospace', color: '#94a3b8' }}>
                                            {industrialCommState.protocol === 'Profinet' ? 'Q:0.0' : 'I:1/0'}
                                        </span>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '3px 0' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <span style={{
                                                width: '8px', height: '8px', borderRadius: '50%',
                                                backgroundColor: industrialCommState.bits.Done ? '#10b981' : '#cbd5e1',
                                                boxShadow: industrialCommState.bits.Done ? '0 0 6px #10b981' : 'none'
                                            }} />
                                            <span style={{ fontSize: '0.62rem', color: '#475569' }}>Acq Done</span>
                                        </div>
                                        <span style={{ fontSize: '0.55rem', fontFamily: 'monospace', color: '#94a3b8' }}>
                                            {industrialCommState.protocol === 'Profinet' ? 'Q:0.1' : 'I:1/1'}
                                        </span>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '3px 0' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <span style={{
                                                width: '8px', height: '8px', borderRadius: '50%',
                                                backgroundColor: industrialCommState.bits.Pass ? '#10b981' : '#cbd5e1',
                                                boxShadow: industrialCommState.bits.Pass ? '0 0 6px #10b981' : 'none'
                                            }} />
                                            <span style={{ fontSize: '0.62rem', color: '#475569' }}>Pass Result</span>
                                        </div>
                                        <span style={{ fontSize: '0.55rem', fontFamily: 'monospace', color: '#94a3b8' }}>
                                            {industrialCommState.protocol === 'Profinet' ? 'Q:0.2' : 'I:1/2'}
                                        </span>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '3px 0' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <span style={{
                                                width: '8px', height: '8px', borderRadius: '50%',
                                                backgroundColor: industrialCommState.bits.Fail ? '#ef4444' : '#cbd5e1',
                                                boxShadow: industrialCommState.bits.Fail ? '0 0 6px #ef4444' : 'none'
                                            }} />
                                            <span style={{ fontSize: '0.62rem', color: '#475569' }}>Fail Result</span>
                                        </div>
                                        <span style={{ fontSize: '0.55rem', fontFamily: 'monospace', color: '#94a3b8' }}>
                                            {industrialCommState.protocol === 'Profinet' ? 'Q:0.3' : 'I:1/3'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Force PLC Soft-Trigger */}
                            <button
                                onClick={() => handleRunPipeline()}
                                disabled={isRunning}
                                style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                                    padding: '8px', borderRadius: '8px', border: 'none',
                                    backgroundColor: isRunning ? '#94a3b8' : '#2563eb',
                                    color: 'white', fontWeight: 700, fontSize: '0.68rem',
                                    cursor: isRunning ? 'default' : 'pointer',
                                }}
                            >
                                ⚡ Force PLC Soft-Trigger
                            </button>
                        </div>
                    )}
                </div>

                {/* ═══ CENTER PANEL: Canvas Flow switchable to Camera ═══════════ */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', minHeight: 0 }}>
                    {/* Center View Tabs (Flowchart vs Camera) */}
                    <div style={{ display: 'flex', backgroundColor: '#f1f5f9', padding: '3px', borderRadius: '8px', border: '1px solid #e2e8f0', flexShrink: 0 }}>
                        <button
                            onClick={() => setActiveCenterTab('flowchart')}
                            style={{
                                flex: 1, padding: '6px 0', border: 'none', borderRadius: '6px', fontSize: '0.68rem', fontWeight: 800,
                                backgroundColor: activeCenterTab === 'flowchart' ? 'white' : 'transparent',
                                color: activeCenterTab === 'flowchart' ? '#0f172a' : '#64748b',
                                boxShadow: activeCenterTab === 'flowchart' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                                cursor: 'pointer', transition: 'all 0.15s'
                            }}
                        >
                            📊 Flowchart Canvas
                        </button>
                        <button
                            onClick={() => setActiveCenterTab('monitor')}
                            style={{
                                flex: 1, padding: '6px 0', border: 'none', borderRadius: '6px', fontSize: '0.68rem', fontWeight: 800,
                                backgroundColor: activeCenterTab === 'monitor' ? 'white' : 'transparent',
                                color: activeCenterTab === 'monitor' ? '#0f172a' : '#64748b',
                                boxShadow: activeCenterTab === 'monitor' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                                cursor: 'pointer', transition: 'all 0.15s'
                            }}
                        >
                            👁️ Camera / Live Monitor
                        </button>
                    </div>

                    {activeCenterTab === 'flowchart' ? (
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                            {/* Canvas Header bar */}
                            <div style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', padding: '8px 12px',
                                borderTopLeftRadius: '16px', borderTopRightRadius: '16px', borderBottom: 'none'
                            }}>
                                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#334155' }}>
                                    Flowchart Canvas: <span style={{ fontWeight: 600, color: '#64748b' }}>{activeJob?.name}</span> ({nodes.length} blocks)
                                </span>
                                <div style={{ display: 'flex', gap: '6px' }}>
                                    <button
                                        onClick={handleRunPipeline}
                                        disabled={isRunning || isSimulating}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '6px',
                                            padding: '5px 12px', borderRadius: '6px', border: 'none',
                                            backgroundColor: (isRunning || isSimulating) ? '#94a3b8' : '#10b981',
                                            color: 'white', fontWeight: 700, fontSize: '0.68rem',
                                            cursor: (isRunning || isSimulating) ? 'default' : 'pointer',
                                        }}
                                    >
                                        <Play size={10} fill="white" /> Run Pipeline
                                    </button>
                                </div>
                            </div>
                            
                            <QuickBuildCanvas
                                nodes={nodes}
                                setNodes={setNodes}
                                links={links}
                                setLinks={setLinks}
                                selectedNodeId={selectedNodeId}
                                setSelectedNodeId={setSelectedNodeId}
                                isSimulating={isSimulating}
                                simStepIndex={simStepIndex}
                            />
                        </div>
                    ) : (
                        <div style={{
                            backgroundColor: 'white', borderRadius: '16px', border: '1px solid #cbd5e1',
                            padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, overflowY: 'auto'
                        }}>
                            <QuickBuildMonitor
                                processedImage={processedImage}
                                setProcessedImage={setProcessedImage}
                                uploadedFile={uploadedFile}
                                setUploadedFile={setUploadedFile}
                                imagePreviewUrl={imagePreviewUrl}
                                setImagePreviewUrl={setImagePreviewUrl}
                                useLiveCamera={useLiveCamera}
                                setUseLiveCamera={setUseLiveCamera}
                                webcamRef={webcamRef}
                                devices={devices}
                                selectedDeviceId={selectedDeviceId}
                                setSelectedDeviceId={setSelectedDeviceId}
                                isContinuous={isContinuous}
                                setIsContinuous={setIsContinuous}
                                roiRegions={roiRegions}
                                setRoiRegions={setRoiRegions}
                                filmstripFrames={filmstripFrames}
                                activeFilmstripIndex={activeFilmstripIndex}
                                isFilmstripPlaying={isFilmstripPlaying}
                                onAddFilmstripFrame={handleAddFilmstripFrame}
                                onClearFilmstrip={handleClearFilmstrip}
                                onSelectFilmstripFrame={setActiveFilmstripIndex}
                                onPlayPauseFilmstrip={() => setIsFilmstripPlaying(!isFilmstripPlaying)}
                                nodes={nodes}
                                selectedNodeId={selectedNodeId}
                            />
                        </div>
                    )}
                </div>

                {/* ═══ RIGHT PANEL: Block Settings ══════════════════ */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', minHeight: 0 }}>
                    <QuickBuildNodeEditor
                        selectedNode={selectedNode}
                        nodes={nodes}
                        setNodes={setNodes}
                        onDeleteNode={handleDeleteNode}
                        drawingsList={drawingsList}
                        appVariables={appVariables}
                        onTrainOcrFont={() => setOcrTrainingModalOpen(true)}
                        cameraConfigs={cameraConfigs}
                    />
                </div>
            </div>

            {/* ═══ MODAL OVERLAY ══════════════════════════════════ */}
            {modalConfig && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
                }}>
                    <div style={{
                        backgroundColor: 'white', borderRadius: '16px', border: '1px solid #e2e8f0',
                        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', padding: '24px', width: '380px',
                        display: 'flex', flexDirection: 'column', gap: '16px',
                    }}>
                        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#1e293b' }}>{modalConfig.title}</h3>
                        <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b', lineHeight: 1.5 }}>{modalConfig.message}</p>
                        {modalConfig.type === 'prompt' && (
                            <input
                                type="text" id="qb-modal-input" defaultValue={modalConfig.defaultValue} autoFocus
                                style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.8rem', outline: 'none', boxSizing: 'border-box' }}
                                onKeyDown={e => { if (e.key === 'Enter' && e.target.value?.trim()) { modalConfig.onConfirm(e.target.value); setModalConfig(null); } }}
                            />
                        )}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                            <button onClick={() => setModalConfig(null)} style={{ padding: '6px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: 'white', color: '#64748b', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>
                                Cancel
                            </button>
                            <button onClick={() => {
                                const val = modalConfig.type === 'prompt' ? document.getElementById('qb-modal-input')?.value : undefined;
                                modalConfig.onConfirm(val);
                                setModalConfig(null);
                            }} style={{ padding: '6px 14px', borderRadius: '8px', border: 'none', backgroundColor: '#3b82f6', color: 'white', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

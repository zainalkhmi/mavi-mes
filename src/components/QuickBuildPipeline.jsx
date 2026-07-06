import React, { useState, useEffect, useRef } from 'react';
import {
    Play, Plus, Save, Sliders, Sparkles, ChevronDown
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
export default function QuickBuildPipeline({ appVariables = [] }) {
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
    const [expandedCategories, setExpandedCategories] = useState(
        CATEGORY_ORDER.reduce((acc, cat) => ({ ...acc, [cat]: true }), {})
    );

    // ═══ Image / Camera State ══════════════════════════════════
    const [uploadedFile, setUploadedFile] = useState(null);
    const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
    const [processedImage, setProcessedImage] = useState(null);
    const webcamRef = useRef(null);
    const [useLiveCamera, setUseLiveCamera] = useState(false);
    const [devices, setDevices] = useState([]);
    const [selectedDeviceId, setSelectedDeviceId] = useState('');
    const [isContinuous, setIsContinuous] = useState(false);

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
        if (!dataurl) return null;
        const arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) u8arr[n] = bstr.charCodeAt(n);
        return new Blob([u8arr], { type: mime });
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
            display: 'grid',
            gridTemplateColumns: '270px 1fr 350px',
            gap: '16px',
            flex: 1,
            minHeight: 0,
            padding: '16px',
        }}>
            {/* ═══ LEFT PANEL: Workspace + Tool Palette ═══════════ */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', minHeight: 0 }}>

                {/* Workspace Explorer */}
                <QuickBuildWorkspace
                    workspace={workspace}
                    setWorkspace={setWorkspace}
                    activeJobIndex={activeJobIndex}
                    setActiveJobIndex={setActiveJobIndex}
                    onLoadTemplate={handleLoadTemplate}
                    onRunAllJobs={handleRunAllJobs}
                    isRunning={isRunning || isSimulating}
                />

                {/* Tool Block Palette (grouped by category) */}
                <div style={{
                    backgroundColor: 'white', borderRadius: '16px', border: '1px solid #cbd5e1',
                    padding: '12px', display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, overflowY: 'auto',
                }}>
                    <h3 style={{ margin: '0 0 4px 0', fontSize: '0.82rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Sparkles size={14} color="#f59e0b" /> Tool Blocks
                    </h3>

                    {CATEGORY_ORDER.map(catId => {
                        const group = toolGroups[catId];
                        if (!group?.tools.length) return null;
                        const isExpanded = expandedCategories[catId];

                        return (
                            <div key={catId}>
                                {/* Category Header */}
                                <button
                                    onClick={() => setExpandedCategories(prev => ({ ...prev, [catId]: !prev[catId] }))}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '6px', width: '100%',
                                        padding: '5px 8px', borderRadius: '6px', border: 'none',
                                        backgroundColor: `${group.color}08`, cursor: 'pointer',
                                        fontSize: '0.68rem', fontWeight: 800, color: group.color,
                                        textTransform: 'uppercase', letterSpacing: '0.5px',
                                    }}
                                >
                                    <ChevronDown size={10} style={{ transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.15s' }} />
                                    {group.icon} {group.label}
                                    <span style={{ marginLeft: 'auto', fontSize: '0.58rem', fontWeight: 600, color: '#94a3b8' }}>
                                        {group.tools.length}
                                    </span>
                                </button>

                                {/* Tool Buttons */}
                                {isExpanded && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '4px', paddingLeft: '4px' }}>
                                        {group.tools.map(tool => (
                                            <button
                                                key={tool.typeId}
                                                onClick={() => handleAddNode(tool.typeId)}
                                                style={{
                                                    display: 'flex', alignItems: 'center', gap: '8px', width: '100%',
                                                    padding: '6px 10px', borderRadius: '8px',
                                                    border: '1px solid #e2e8f0', backgroundColor: '#fafafa',
                                                    textAlign: 'left', cursor: 'pointer', transition: 'all 0.12s',
                                                }}
                                                onMouseEnter={e => { e.currentTarget.style.borderColor = tool.color; e.currentTarget.style.backgroundColor = 'white'; }}
                                                onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.backgroundColor = '#fafafa'; }}
                                            >
                                                <span style={{ fontSize: '0.9rem' }}>{tool.icon}</span>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#334155', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                        {tool.label}
                                                    </div>
                                                    <div style={{ fontSize: '0.55rem', color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                        {tool.desc}
                                                    </div>
                                                </div>
                                                <Plus size={12} color="#cbd5e1" />
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ═══ CENTER: Canvas ═════════════════════════════════ */}
            <div style={{
                display: 'flex', flexDirection: 'column',
                backgroundColor: 'white', borderRadius: '16px', border: '1px solid #cbd5e1',
                overflow: 'hidden', position: 'relative',
            }}>
                {/* Toolbar */}
                <div style={{
                    padding: '10px 16px', borderBottom: '1px solid #cbd5e1',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    backgroundColor: '#f8fafc', flexShrink: 0,
                }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <Sliders size={14} color="#64748b" />
                        <span style={{ fontSize: '0.82rem', fontWeight: 800 }}>
                            {workspace.name}
                        </span>
                        <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>›</span>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#3b82f6' }}>
                            {activeJob?.name || 'Job'}
                        </span>
                        <span style={{
                            fontSize: '0.58rem', padding: '2px 6px', borderRadius: '4px',
                            backgroundColor: '#f1f5f9', color: '#64748b', fontWeight: 600,
                        }}>
                            {nodes.length} blocks
                        </span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                            onClick={handleRunPipeline}
                            disabled={isRunning || isSimulating}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                padding: '6px 14px', borderRadius: '8px', border: 'none',
                                backgroundColor: (isRunning || isSimulating) ? '#94a3b8' : '#10b981',
                                color: 'white', fontWeight: 700, fontSize: '0.75rem',
                                cursor: (isRunning || isSimulating) ? 'default' : 'pointer',
                            }}
                        >
                            <Play size={12} fill="white" />
                            {isRunning ? 'RUNNING...' : isSimulating ? 'SIMULATING...' : 'RUN PIPELINE'}
                        </button>
                        <button
                            onClick={handleSaveWorkspace}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                padding: '6px 14px', borderRadius: '8px', border: '1px solid #cbd5e1',
                                backgroundColor: 'white', color: '#334155', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer',
                            }}
                        >
                            <Save size={12} /> Save
                        </button>
                    </div>
                </div>

                {/* Canvas */}
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

            {/* ═══ RIGHT PANEL: Monitor + Editor ══════════════════ */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', minHeight: 0 }}>

                {/* Live Inspection Monitor */}
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
                />

                {/* Node Parameter Editor */}
                <QuickBuildNodeEditor
                    selectedNode={selectedNode}
                    nodes={nodes}
                    setNodes={setNodes}
                    onDeleteNode={handleDeleteNode}
                    drawingsList={drawingsList}
                    appVariables={appVariables}
                />
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

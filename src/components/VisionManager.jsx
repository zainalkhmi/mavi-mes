import React, { useMemo, useState, useEffect, useRef } from 'react';
import {
    Eye,
    Camera,
    Plus,
    Search,
    Settings,
    Activity,
    Layers,
    Trash2,
    AlertCircle,
    CheckCircle2,
    XCircle,
    Info,
    Play,
    Box,
    Maximize,
    X,
    Download,
    RefreshCw,
    FolderPlus,
    Grid,
    Sliders,
    Loader2
} from 'lucide-react';
import JSZip from 'jszip';
import { getAllDatasets, saveDataset, deleteDataset } from '../utils/supabaseUtilityDB';

const VisionManager = () => {
    // Tab Management: 'cameras' | 'datasets'
    const [activeTab, setActiveTab] = useState('cameras');

    // Camera Config State
    const [cameraConfigs, setCameraConfigs] = useState([
        { id: 'cam_1', name: 'Workstation 1 Top View', status: 'ACTIVE', regions: 3, detectors: ['Change Detector', 'Object Detector'] },
        { id: 'cam_2', name: 'Inspection Area Zoom', status: 'INACTIVE', regions: 1, detectors: ['OCR Detector'] }
    ]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showCameraForm, setShowCameraForm] = useState(false);
    const [newCameraName, setNewCameraName] = useState('');
    const [selectedCamera, setSelectedCamera] = useState(null);

    // Dataset Management State
    const [datasets, setDatasets] = useState([]);
    const [activeDataset, setActiveDataset] = useState(null);
    const [isLoadingDatasets, setIsLoadingDatasets] = useState(false);
    const [showNewDatasetModal, setShowNewDatasetModal] = useState(false);
    const [newDatasetName, setNewDatasetName] = useState('');
    const [newDatasetProject, setNewDatasetProject] = useState('');

    // Webcam State for Data Collection
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);
    const [hasCameraPermission, setHasCameraPermission] = useState(null);
    const [showCameraGrid, setShowCameraGrid] = useState(true);
    const [customLabel, setCustomLabel] = useState('');
    const [cameraError, setCameraError] = useState('');
    const [isCapturing, setIsCapturing] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    // Load Datasets on mount or tab switch
    useEffect(() => {
        if (activeTab === 'datasets') {
            loadDatasets();
        }
    }, [activeTab]);

    const loadDatasets = async () => {
        setIsLoadingDatasets(true);
        try {
            const data = await getAllDatasets();
            setDatasets(data);
            // Auto-select first or update active if it exists
            if (activeDataset) {
                const refreshed = data.find(d => d.id === activeDataset.id);
                if (refreshed) setActiveDataset(refreshed);
            } else if (data.length > 0) {
                setActiveDataset(data[0]);
            }
        } catch (err) {
            console.error('Failed to load datasets:', err);
        } finally {
            setIsLoadingDatasets(false);
        }
    };

    // Camera list search filter
    const filteredConfigs = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();
        if (!term) return cameraConfigs;
        return cameraConfigs.filter((config) =>
            config.name.toLowerCase().includes(term) ||
            config.detectors.some((d) => d.toLowerCase().includes(term))
        );
    }, [cameraConfigs, searchTerm]);

    const toggleCameraStatus = (id) => {
        setCameraConfigs((prev) =>
            prev.map((cfg) =>
                cfg.id === id
                    ? { ...cfg, status: cfg.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' }
                    : cfg
            )
        );
    };

    const addCameraConfig = () => {
        const name = newCameraName.trim();
        if (!name) {
            alert('Camera name is required.');
            return;
        }
        const newConfig = {
            id: `cam_${Date.now()}`,
            name,
            status: 'INACTIVE',
            regions: 1,
            detectors: ['Change Detector']
        };
        setCameraConfigs((prev) => [newConfig, ...prev]);
        setNewCameraName('');
        setShowCameraForm(false);
    };

    // Dataset logic
    const handleCreateDataset = async () => {
        const name = newDatasetName.trim();
        const project = newDatasetProject.trim();
        if (!name) {
            alert('Dataset Name is required.');
            return;
        }

        try {
            const payload = {
                name,
                projectName: project || 'Default Project',
                metadata: { samples: [] }
            };
            const result = await saveDataset(payload);
            setDatasets(prev => [result, ...prev]);
            setActiveDataset(result);
            setNewDatasetName('');
            setNewDatasetProject('');
            setShowNewDatasetModal(false);
        } catch (err) {
            console.error('Failed to create dataset:', err);
            alert(`Error creating dataset: ${err.message}`);
        }
    };

    const handleDeleteDataset = async (id, name) => {
        if (!confirm(`Are you sure you want to delete the dataset "${name}"? All image samples will be lost.`)) {
            return;
        }

        try {
            await deleteDataset(id);
            setDatasets(prev => prev.filter(d => d.id !== id));
            if (activeDataset?.id === id) {
                setActiveDataset(null);
            }
        } catch (err) {
            console.error('Failed to delete dataset:', err);
            alert(`Error deleting dataset: ${err.message}`);
        }
    };

    // Camera stream activation for dataset collection
    useEffect(() => {
        if (activeTab !== 'datasets' || !activeDataset) {
            stopCameraStream();
            return;
        }

        startCameraStream();

        return () => {
            stopCameraStream();
        };
    }, [activeTab, activeDataset]);

    const startCameraStream = () => {
        stopCameraStream();
        setCameraError('');

        navigator.mediaDevices.getUserMedia({
            video: {
                width: { ideal: 640 },
                height: { ideal: 480 },
                facingMode: 'environment'
            }
        })
        .then((stream) => {
            setHasCameraPermission(true);
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play().catch(e => console.warn('Stream play interrupted:', e));
            }
        })
        .catch((err) => {
            console.error('Webcam stream access failed:', err);
            setHasCameraPermission(false);
            setCameraError(err.message || 'Webcam permission denied or camera not found.');
        });
    };

    const stopCameraStream = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
    };

    // Capture Frame & Save Sample to Supabase
    const captureAndTag = async (tagLabel) => {
        if (!activeDataset || isCapturing) return;
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas) return;

        setIsCapturing(true);
        try {
            const ctx = canvas.getContext('2d');
            // Draw video frame to compressed 320x240 canvas to optimize base64 database cell storage
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);

            // Construct new sample record
            const newSample = {
                id: `sample_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                image: dataUrl,
                label: tagLabel.toUpperCase().trim(),
                timestamp: new Date().toISOString()
            };

            const existingSamples = activeDataset.metadata?.samples || [];
            const updatedSamples = [newSample, ...existingSamples];

            const updatedDataset = {
                ...activeDataset,
                metadata: {
                    ...activeDataset.metadata,
                    samples: updatedSamples
                }
            };

            // Save dataset in Supabase
            const saved = await saveDataset(updatedDataset);
            
            // Update local state
            setActiveDataset(saved);
            setDatasets(prev => prev.map(d => d.id === saved.id ? saved : d));
            setCustomLabel('');
        } catch (err) {
            console.error('Failed to capture and tag image:', err);
            alert(`Failed to save image sample: ${err.message}`);
        } finally {
            setIsCapturing(false);
        }
    };

    // Delete individual sample
    const handleDeleteSample = async (sampleId) => {
        if (!activeDataset) return;
        const existingSamples = activeDataset.metadata?.samples || [];
        const updatedSamples = existingSamples.filter(s => s.id !== sampleId);

        const updatedDataset = {
            ...activeDataset,
            metadata: {
                ...activeDataset.metadata,
                samples: updatedSamples
            }
        };

        try {
            const saved = await saveDataset(updatedDataset);
            setActiveDataset(saved);
            setDatasets(prev => prev.map(d => d.id === saved.id ? saved : d));
        } catch (err) {
            console.error('Failed to delete sample:', err);
            alert(`Failed to delete sample: ${err.message}`);
        }
    };

    // Export dataset as ZIP with JPEGs + manifest.csv
    const handleExportZIP = async () => {
        if (!activeDataset || isExporting) return;
        const samples = activeDataset.metadata?.samples || [];
        if (samples.length === 0) {
            alert('Cannot export an empty dataset. Capture some samples first!');
            return;
        }

        setIsExporting(true);
        try {
            const zip = new JSZip();
            let csvContent = 'filename,label,timestamp\n';

            // Loop and append images + manifest rows
            samples.forEach((sample, index) => {
                const base64Data = sample.image.split(',')[1];
                const filename = `sample_${index + 1}.jpg`;
                zip.file(filename, base64Data, { base64: true });
                csvContent += `${filename},${sample.label},${sample.timestamp}\n`;
            });

            // Append manifest CSV
            zip.file('manifest.csv', csvContent);

            // Generate ZIP blob and trigger browser download
            const blob = await zip.generateAsync({ type: 'blob' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${activeDataset.name.toLowerCase().replace(/\s+/g, '_')}_dataset.zip`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('ZIP generation failed:', err);
            alert(`Error creating export package: ${err.message}`);
        } finally {
            setIsExporting(false);
        }
    };

    // Stats calculations
    const stats = useMemo(() => {
        if (!activeDataset) return { total: 0, pass: 0, fail: 0, custom: 0 };
        const samples = activeDataset.metadata?.samples || [];
        const pass = samples.filter(s => s.label === 'PASS').length;
        const fail = samples.filter(s => s.label === 'FAIL').length;
        return {
            total: samples.length,
            pass,
            fail,
            custom: samples.length - (pass + fail)
        };
    }, [activeDataset]);

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#f8fafc', fontFamily: 'Inter, system-ui, sans-serif' }}>
            {/* Main Header & Tab Navigation */}
            <div style={{ padding: '24px 24px 0 24px', backgroundColor: 'white', borderBottom: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: '#0f172a' }}>Vision</h2>
                            <span style={{ backgroundColor: '#f1f5f9', color: '#1e293b', padding: '2px 8px', borderRadius: '10px', fontSize: '0.65rem', fontWeight: 700 }}>Active</span>
                        </div>
                        <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '0.85rem' }}>Configure cameras and manage visual inspection datasets.</p>
                    </div>
                </div>

                {/* Tab Selector Buttons */}
                <div style={{ display: 'flex', gap: '24px' }}>
                    <button
                        onClick={() => setActiveTab('cameras')}
                        style={{
                            padding: '12px 4px', border: 'none', borderBottom: activeTab === 'cameras' ? '3px solid #3b82f6' : '3px solid transparent',
                            backgroundColor: 'transparent', color: activeTab === 'cameras' ? '#3b82f6' : '#64748b',
                            fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.15s'
                        }}
                    >
                        Camera Configurations
                    </button>
                    <button
                        onClick={() => setActiveTab('datasets')}
                        style={{
                            padding: '12px 4px', border: 'none', borderBottom: activeTab === 'datasets' ? '3px solid #3b82f6' : '3px solid transparent',
                            backgroundColor: 'transparent', color: activeTab === 'datasets' ? '#3b82f6' : '#64748b',
                            fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.15s'
                        }}
                    >
                        Visual Inspection Datasets
                    </button>
                </div>
            </div>

            {/* TAB CONTENT: CAMERA CONFIGURATIONS */}
            {activeTab === 'cameras' && (
                <div style={{ flex: 1, padding: '24px', display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
                    {/* Configurations List */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#1e293b' }}>Connected Cameras</h3>
                            <button
                                onClick={() => setShowCameraForm(true)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '8px',
                                    padding: '8px 16px', backgroundColor: '#3b82f6', color: 'white',
                                    border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem'
                                }}
                            >
                                <Plus size={16} /> New Camera
                            </button>
                        </div>
                        <div style={{ position: 'relative', maxWidth: '420px' }}>
                            <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                            <input
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search camera or detector..."
                                style={{ width: '100%', padding: '10px 12px 10px 38px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: 'white', fontSize: '0.85rem' }}
                            />
                        </div>

                        {showCameraForm && (
                            <div style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                                <input
                                    value={newCameraName}
                                    onChange={(e) => setNewCameraName(e.target.value)}
                                    placeholder="Enter camera configuration name (e.g. Area Inspection)"
                                    style={{ flex: 1, padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                                />
                                <button onClick={addCameraConfig} style={{ padding: '10px 16px', borderRadius: '8px', border: 'none', backgroundColor: '#3b82f6', color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}>
                                    Save
                                </button>
                                <button onClick={() => setShowCameraForm(false)} style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: 'white', cursor: 'pointer', fontSize: '0.85rem' }}>
                                    Cancel
                                </button>
                            </div>
                        )}

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                            {filteredConfigs.map(config => (
                                <div key={config.id} style={{ backgroundColor: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                                    <div style={{ height: '160px', backgroundColor: '#0f172a', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Camera size={44} color="#334155" />
                                        <div style={{ position: 'absolute', top: '12px', right: '12px' }}>
                                            <span style={{
                                                padding: '4px 10px', borderRadius: '20px', backgroundColor: config.status === 'ACTIVE' ? '#dcfce7' : '#f1f5f9',
                                                color: config.status === 'ACTIVE' ? '#166534' : '#64748b', fontSize: '0.65rem', fontWeight: 800,
                                                border: '1px solid rgba(0,0,0,0.05)'
                                            }}>
                                                {config.status}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => setSelectedCamera(config)}
                                            style={{ position: 'absolute', bottom: '12px', right: '12px', padding: '6px', borderRadius: '6px', backgroundColor: 'rgba(255,255,255,0.15)', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                        >
                                            <Maximize size={14} />
                                        </button>
                                    </div>
                                    <div style={{ padding: '16px' }}>
                                        <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#1e293b', marginBottom: '4px' }}>{config.name}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '12px' }}>{config.regions} monitored regions</div>

                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
                                            {config.detectors.map(d => (
                                                <span key={d} style={{ padding: '2px 6px', borderRadius: '4px', backgroundColor: '#f1f5f9', color: '#475569', fontSize: '0.65rem', fontWeight: 700 }}>
                                                    {d}
                                                </span>
                                            ))}
                                        </div>

                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            <button
                                                onClick={() => toggleCameraStatus(config.id)}
                                                style={{ flex: 1, padding: '8px', borderRadius: '8px', backgroundColor: '#3b82f6', color: 'white', border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                                            >
                                                <Play size={12} /> LIVE STREAM
                                            </button>
                                            <button
                                                onClick={() => alert(`Settings opened for: ${config.name}`)}
                                                style={{ width: '36px', padding: '8px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                            >
                                                <Settings size={16} color="#64748b" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {filteredConfigs.length === 0 && (
                                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '32px', backgroundColor: 'white', border: '1px dashed #cbd5e1', borderRadius: '12px', color: '#64748b', fontSize: '0.85rem' }}>
                                    No camera configurations match "{searchTerm}".
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Side panel: Detectors & Guides */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div style={{ padding: '20px', backgroundColor: 'white', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                            <h3 style={{ margin: '0 0 16px 0', fontSize: '0.95rem', fontWeight: 800 }}>Available Detectors</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {[
                                    { name: 'Change Detector', desc: 'Monitors regions for visual changes' },
                                    { name: 'Jig Detector', desc: 'Tracks objects with markers' },
                                    { name: 'Color Detector', desc: 'Identifies colors in specified regions' },
                                    { name: 'OCR Detector', desc: 'Reads text from images' }
                                ].map(d => (
                                    <div key={d.name} style={{ padding: '10px', border: '1px solid #f1f5f9', borderRadius: '8px' }}>
                                        <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#334155' }}>{d.name}</div>
                                        <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px' }}>{d.desc}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div style={{ padding: '20px', backgroundColor: '#f8fafc', borderRadius: '16px', border: '1px dashed #cbd5e1', textAlign: 'center' }}>
                            <Eye size={28} color="#cbd5e1" style={{ marginBottom: '10px', margin: '0 auto' }} />
                            <h4 style={{ margin: '8px 0 0 0', fontWeight: 800, fontSize: '0.85rem' }}>IP Cameras</h4>
                            <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '4px 0 12px 0' }}>Connect network stream cameras for visual processing.</p>
                            <button
                                onClick={() => setShowCameraForm(true)}
                                style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #3b82f6', color: '#3b82f6', backgroundColor: 'white', fontWeight: 700, cursor: 'pointer', fontSize: '0.75rem' }}
                            >
                                Add IP Camera
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB CONTENT: VISUAL INSPECTION DATA DATASETS */}
            {activeTab === 'datasets' && (
                <div style={{ flex: 1, padding: '24px', display: 'grid', gridTemplateColumns: '280px 1fr', gap: '24px', overflow: 'hidden' }}>
                    {/* Left Sidebar: Dataset List */}
                    <div style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                        <div style={{ padding: '16px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#1e293b' }}>Visual Datasets</span>
                            <button
                                onClick={() => setShowNewDatasetModal(true)}
                                style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    width: '28px', height: '28px', borderRadius: '6px', border: 'none',
                                    backgroundColor: '#3b82f6', color: 'white', cursor: 'pointer'
                                }}
                                title="Create new dataset"
                            >
                                <Plus size={16} />
                            </button>
                        </div>

                        <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
                            {isLoadingDatasets ? (
                                <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>
                                    <Loader2 size={20} className="animate-spin" style={{ margin: '0 auto 8px' }} />
                                    <span style={{ fontSize: '0.75rem' }}>Loading datasets...</span>
                                </div>
                            ) : datasets.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8', fontSize: '0.75rem' }}>
                                    No datasets available. Click "+" to create one.
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    {datasets.map(ds => {
                                        const sampleCount = ds.metadata?.samples?.length || 0;
                                        const isActive = activeDataset?.id === ds.id;
                                        return (
                                            <div
                                                key={ds.id}
                                                onClick={() => setActiveDataset(ds)}
                                                style={{
                                                    padding: '10px 12px', borderRadius: '8px', cursor: 'pointer',
                                                    backgroundColor: isActive ? '#eff6ff' : 'transparent',
                                                    border: isActive ? '1px solid #bfdbfe' : '1px solid transparent',
                                                    display: 'flex', flexDirection: 'column', gap: '4px',
                                                    transition: 'all 0.15s'
                                                }}
                                            >
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                    <span style={{ fontSize: '0.8rem', fontWeight: isActive ? 800 : 600, color: isActive ? '#1e3a8a' : '#334155', wordBreak: 'break-word', paddingRight: '6px' }}>
                                                        {ds.name}
                                                    </span>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleDeleteDataset(ds.id, ds.name); }}
                                                        style={{ border: 'none', background: 'transparent', color: '#94a3b8', cursor: 'pointer', padding: 0 }}
                                                        title="Delete dataset"
                                                    >
                                                        <Trash2 size={12} className="hover:text-red-500" />
                                                    </button>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.65rem', color: '#64748b' }}>
                                                    <span>{ds.project_name || 'Default Project'}</span>
                                                    <span style={{ backgroundColor: isActive ? '#dbeafe' : '#f1f5f9', padding: '1px 5px', borderRadius: '4px', fontWeight: 700 }}>
                                                        {sampleCount} img
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Area: Active Dataset Collector & Statistics */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', overflow: 'hidden' }}>
                        {activeDataset ? (
                            <>
                                {/* Dashboard: Header & Actions */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                                    <div>
                                        <div style={{ fontSize: '1rem', fontWeight: 900, color: '#0f172a' }}>{activeDataset.name}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                                            Project: {activeDataset.project_name || 'Default'} • Created at: {new Date(activeDataset.created_at).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleExportZIP}
                                        disabled={isExporting || stats.total === 0}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '8px',
                                            padding: '10px 18px', backgroundColor: stats.total > 0 ? '#10b981' : '#cbd5e1',
                                            color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700,
                                            cursor: stats.total > 0 ? 'pointer' : 'not-allowed', fontSize: '0.8rem'
                                        }}
                                    >
                                        {isExporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                                        EXPORT DATASET (.ZIP)
                                    </button>
                                </div>

                                {/* Main Grid: Capture Workspace & Statistics */}
                                <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px', minHeight: 0 }}>
                                    {/* Left Panel: Camera Stream & Capture Guide */}
                                    <div style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                                        {/* Camera Sub-header */}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid #e2e8f0' }}>
                                            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#475569', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <Camera size={16} /> LIVE CAMERA CAPTURE
                                            </span>
                                            <div style={{ display: 'flex', gap: '10px' }}>
                                                <button
                                                    onClick={() => setShowCameraGrid(p => !p)}
                                                    style={{
                                                        border: '1px solid #cbd5e1', backgroundColor: showCameraGrid ? '#eff6ff' : 'white',
                                                        color: showCameraGrid ? '#3b82f6' : '#64748b', fontSize: '0.7rem', fontWeight: 700,
                                                        padding: '4px 8px', borderRadius: '6px', cursor: 'pointer'
                                                    }}
                                                >
                                                    Grid Overlay
                                                </button>
                                                <button
                                                    onClick={startCameraStream}
                                                    style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748b' }}
                                                    title="Refresh stream"
                                                >
                                                    <RefreshCw size={14} />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Viewfinder Canvas */}
                                        <div style={{ flex: 1, backgroundColor: '#000', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            {hasCameraPermission === false ? (
                                                <div style={{ textAlign: 'center', color: '#cbd5e1', padding: '20px' }}>
                                                    <AlertCircle size={36} color="#ef4444" style={{ margin: '0 auto 10px' }} />
                                                    <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>Kamera tidak terdeteksi</div>
                                                    <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '4px' }}>{cameraError}</div>
                                                </div>
                                            ) : (
                                                <>
                                                    <video
                                                        ref={videoRef}
                                                        style={{ display: 'none' }}
                                                        width="640"
                                                        height="480"
                                                        playsInline
                                                        muted
                                                    />
                                                    {/* Real-time scaling canvas */}
                                                    <canvas
                                                        ref={canvasRef}
                                                        width="320"
                                                        height="240"
                                                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                                    />

                                                    {/* Grid alignment overlay */}
                                                    {showCameraGrid && (
                                                        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gridTemplateRows: '1fr 1fr 1fr' }}>
                                                            <div style={{ borderRight: '1px dashed rgba(255,255,255,0.25)', borderBottom: '1px dashed rgba(255,255,255,0.25)' }}></div>
                                                            <div style={{ borderRight: '1px dashed rgba(255,255,255,0.25)', borderBottom: '1px dashed rgba(255,255,255,0.25)' }}></div>
                                                            <div style={{ borderBottom: '1px dashed rgba(255,255,255,0.25)' }}></div>
                                                            <div style={{ borderRight: '1px dashed rgba(255,255,255,0.25)', borderBottom: '1px dashed rgba(255,255,255,0.25)' }}></div>
                                                            <div style={{ borderRight: '1px dashed rgba(255,255,255,0.25)', borderBottom: '1px dashed rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                {/* Central focus ring */}
                                                                <div style={{ width: '60px', height: '60px', borderRadius: '50%', border: '2px solid rgba(239,68,68,0.4)' }} />
                                                            </div>
                                                            <div style={{ borderBottom: '1px dashed rgba(255,255,255,0.25)' }}></div>
                                                            <div style={{ borderRight: '1px dashed rgba(255,255,255,0.25)' }}></div>
                                                            <div style={{ borderRight: '1px dashed rgba(255,255,255,0.25)' }}></div>
                                                            <div></div>
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>

                                        {/* Label Tagging Controls */}
                                        <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                            {/* Standard PASS/FAIL buttons */}
                                            <div style={{ display: 'flex', gap: '10px' }}>
                                                <button
                                                    onClick={() => captureAndTag('PASS')}
                                                    disabled={hasCameraPermission === false || isCapturing}
                                                    style={{
                                                        flex: 1, padding: '12px', border: 'none', borderRadius: '8px',
                                                        backgroundColor: hasCameraPermission ? '#22c55e' : '#cbd5e1',
                                                        color: 'white', fontWeight: 800, fontSize: '0.85rem', cursor: hasCameraPermission ? 'pointer' : 'not-allowed',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 2px 4px rgba(34,197,94,0.2)'
                                                    }}
                                                >
                                                    {isCapturing ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                                                    CAPTURE AS PASS
                                                </button>
                                                <button
                                                    onClick={() => captureAndTag('FAIL')}
                                                    disabled={hasCameraPermission === false || isCapturing}
                                                    style={{
                                                        flex: 1, padding: '12px', border: 'none', borderRadius: '8px',
                                                        backgroundColor: hasCameraPermission ? '#ef4444' : '#cbd5e1',
                                                        color: 'white', fontWeight: 800, fontSize: '0.85rem', cursor: hasCameraPermission ? 'pointer' : 'not-allowed',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 2px 4px rgba(239,68,68,0.2)'
                                                    }}
                                                >
                                                    {isCapturing ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
                                                    CAPTURE AS FAIL
                                                </button>
                                            </div>

                                            {/* Custom Defect tag input */}
                                            <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
                                                <input
                                                    value={customLabel}
                                                    onChange={(e) => setCustomLabel(e.target.value)}
                                                    placeholder="Custom defect label (e.g. Scratched, Dented)"
                                                    style={{ flex: 1, padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }}
                                                />
                                                <button
                                                    onClick={() => captureAndTag(customLabel || 'CUSTOM')}
                                                    disabled={hasCameraPermission === false || !customLabel.trim() || isCapturing}
                                                    style={{
                                                        padding: '8px 16px', backgroundColor: '#7c3aed', color: 'white', border: 'none',
                                                        borderRadius: '6px', fontWeight: 700, fontSize: '0.8rem',
                                                        cursor: (hasCameraPermission && customLabel.trim()) ? 'pointer' : 'not-allowed'
                                                    }}
                                                >
                                                    Capture custom
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Panel: Dataset Stats & Sample Gallery */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', minHeight: 0 }}>
                                        {/* Statistics Overview Card */}
                                        <div style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '16px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', textAlign: 'center' }}>
                                            <div style={{ borderRight: '1px solid #f1f5f9' }}>
                                                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#1e293b' }}>{stats.total}</div>
                                                <div style={{ fontSize: '0.6rem', color: '#64748b', fontWeight: 700 }}>TOTAL IMAGES</div>
                                            </div>
                                            <div style={{ borderRight: '1px solid #f1f5f9' }}>
                                                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#22c55e' }}>{stats.pass}</div>
                                                <div style={{ fontSize: '0.6rem', color: '#22c55e', fontWeight: 700 }}>PASS</div>
                                            </div>
                                            <div style={{ borderRight: '1px solid #f1f5f9' }}>
                                                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#ef4444' }}>{stats.fail}</div>
                                                <div style={{ fontSize: '0.6rem', color: '#ef4444', fontWeight: 700 }}>FAIL</div>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#7c3aed' }}>{stats.custom}</div>
                                                <div style={{ fontSize: '0.6rem', color: '#7c3aed', fontWeight: 700 }}>DEFECTS</div>
                                            </div>
                                        </div>

                                        {/* Tulip ML Recommendation banner */}
                                        <div style={{ backgroundColor: '#fff7ed', border: '1px solid #ffedd5', borderRadius: '12px', padding: '10px 14px', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                                            <Info size={14} color="#ea580c" style={{ marginTop: '2px', flexShrink: 0 }} />
                                            <div style={{ fontSize: '0.7rem', color: '#c2410c', lineHeight: 1.4 }}>
                                                <strong>Rekomendasi Pelatihan Model:</strong> Kumpulkan minimal <strong>30-50 sampel</strong> untuk setiap kategori (PASS dan Kategori Defect) agar model AI Custom Vision mencapai tingkat akurasi yang optimal di lapangan.
                                            </div>
                                        </div>

                                        {/* Scrollable Gallery */}
                                        <div style={{ flex: 1, backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                                            <div style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', fontWeight: 800, fontSize: '0.8rem', color: '#475569' }}>
                                                CAPTURED SAMPLES (GALLERY)
                                            </div>
                                            <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
                                                {activeDataset.metadata?.samples?.length > 0 ? (
                                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '12px' }}>
                                                        {activeDataset.metadata.samples.map((sample) => {
                                                            const isPass = sample.label === 'PASS';
                                                            const isFail = sample.label === 'FAIL';
                                                            const tagBg = isPass ? '#dcfce7' : isFail ? '#ffeeeb' : '#f3e8ff';
                                                            const tagColor = isPass ? '#166534' : isFail ? '#991b1b' : '#6b21a8';
                                                            return (
                                                                <div
                                                                    key={sample.id}
                                                                    style={{
                                                                        border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden',
                                                                        display: 'flex', flexDirection: 'column', position: 'relative'
                                                                    }}
                                                                >
                                                                    {/* Thumbnail */}
                                                                    <div style={{ height: '70px', backgroundColor: '#f1f5f9', overflow: 'hidden', position: 'relative' }}>
                                                                        <img
                                                                            src={sample.image}
                                                                            alt="Sample"
                                                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                                        />
                                                                        <button
                                                                            onClick={() => handleDeleteSample(sample.id)}
                                                                            style={{
                                                                                position: 'absolute', top: '4px', right: '4px', border: 'none',
                                                                                borderRadius: '4px', backgroundColor: 'rgba(239,68,68,0.9)',
                                                                                color: 'white', width: '18px', height: '18px', display: 'flex',
                                                                                alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                                                                            }}
                                                                            title="Delete sample"
                                                                        >
                                                                            <X size={10} />
                                                                        </button>
                                                                    </div>
                                                                    {/* Label and Info */}
                                                                    <div style={{ padding: '6px', textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                                                        <span style={{
                                                                            padding: '2px 4px', borderRadius: '4px', backgroundColor: tagBg,
                                                                            color: tagColor, fontSize: '0.55rem', fontWeight: 800,
                                                                            wordBreak: 'break-all', display: 'inline-block'
                                                                        }}>
                                                                            {sample.label}
                                                                        </span>
                                                                        <span style={{ fontSize: '0.5rem', color: '#94a3b8', marginTop: '4px', display: 'block' }}>
                                                                            {new Date(sample.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                ) : (
                                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8', textAlign: 'center', padding: '20px' }}>
                                                        <Grid size={32} style={{ marginBottom: '8px' }} />
                                                        <div style={{ fontSize: '0.75rem', fontWeight: 700 }}>No Samples Captured Yet</div>
                                                        <div style={{ fontSize: '0.65rem', maxWidth: '180px', marginTop: '2px' }}>Use the camera workspace to capture and tag your first item.</div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div style={{ flex: 1, backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px', color: '#64748b', textAlign: 'center' }}>
                                <FolderPlus size={48} color="#cbd5e1" style={{ marginBottom: '16px' }} />
                                <h3 style={{ margin: 0, fontWeight: 900, color: '#1e293b' }}>Visual Inspection Workspace</h3>
                                <p style={{ fontSize: '0.85rem', color: '#64748b', maxWidth: '320px', margin: '8px 0 20px 0' }}>Select an existing dataset on the left or create a new one to begin capturing and classifying inspection images.</p>
                                <button
                                    onClick={() => setShowNewDatasetModal(true)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '8px',
                                        padding: '10px 20px', backgroundColor: '#3b82f6', color: 'white',
                                        border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem'
                                    }}
                                >
                                    <Plus size={16} /> Create Dataset
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Camera fullscreen live view modal */}
            {selectedCamera && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
                    <div style={{ width: 'min(900px, 92vw)', backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 20px 30px rgba(0,0,0,0.25)' }}>
                        <div style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <strong>{selectedCamera.name} — Live Preview</strong>
                            <button onClick={() => setSelectedCamera(null)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748b' }}>
                                <X size={18} />
                            </button>
                        </div>
                        <div style={{ height: '420px', backgroundColor: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1' }}>
                            <div style={{ textAlign: 'center' }}>
                                <Camera size={48} style={{ marginBottom: '12px' }} />
                                <div>Stream connected in demo mode</div>
                                <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>Status: {selectedCamera.status}</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: New Dataset Creation Form */}
            {showNewDatasetModal && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
                    <div style={{ width: '420px', backgroundColor: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc' }}>
                            <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#1e293b' }}>Create Visual Dataset</span>
                            <button onClick={() => setShowNewDatasetModal(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center' }}>
                                <X size={18} />
                            </button>
                        </div>
                        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569' }}>Dataset Name</label>
                                <input
                                    value={newDatasetName}
                                    onChange={(e) => setNewDatasetName(e.target.value)}
                                    placeholder="e.g. Bumper QC Inspection"
                                    style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                                />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569' }}>Project Name</label>
                                <input
                                    value={newDatasetProject}
                                    onChange={(e) => setNewDatasetProject(e.target.value)}
                                    placeholder="e.g. Model X-120 Quality Control"
                                    style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                                />
                            </div>
                        </div>
                        <div style={{ padding: '16px 20px', backgroundColor: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                            <button
                                onClick={() => setShowNewDatasetModal(false)}
                                style={{ padding: '8px 16px', border: '1px solid #cbd5e1', backgroundColor: 'white', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateDataset}
                                style={{ padding: '8px 16px', border: 'none', backgroundColor: '#3b82f6', color: 'white', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
                            >
                                Create Dataset
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VisionManager;

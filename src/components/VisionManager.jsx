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
    Loader2,
    Shield,
    ShieldAlert,
    Sparkles,
    ChevronDown,
    ChevronUp,
    HelpCircle
} from 'lucide-react';
import JSZip from 'jszip';
import { getAllCameras, saveCamera, deleteCamera, getAllDatasets, saveDataset, deleteDataset } from '../utils/supabaseUtilityDB';
import { getStations } from '../utils/supabaseFrontlineDB';

const VisionManager = () => {
    // Tab Management: 'cameras' | 'datasets' | 'privacy'
    const [activeTab, setActiveTab] = useState('cameras');

    // Privacy & Security States
    const [privacyMode, setPrivacyMode] = useState(localStorage.getItem('mavi-vision-privacy-access') || 'ASK');
    const [simulatedAccessRequest, setSimulatedAccessRequest] = useState(null);

    useEffect(() => {
        localStorage.setItem('mavi-vision-privacy-access', privacyMode);
    }, [privacyMode]);

    // Camera Config State
    const [cameraConfigs, setCameraConfigs] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showCameraForm, setShowCameraForm] = useState(false);
    const [newCameraName, setNewCameraName] = useState('');
    const [newCameraSource, setNewCameraSource] = useState('DEVICE');
    const [newCameraIpUrl, setNewCameraIpUrl] = useState('');
    const [selectedCamera, setSelectedCamera] = useState(null);

    // Camera Settings/Regions state
    const [editingCameraConfig, setEditingCameraConfig] = useState(null);
    const [selectedRegionId, setSelectedRegionId] = useState(null);
    const [regionsByCamera, setRegionsByCamera] = useState({});

    // Keep camera config stats sync'd with regionsByCamera
    useEffect(() => {
        setCameraConfigs(prev => prev.map(cfg => {
            const list = regionsByCamera[cfg.id] || [];
            const activeDetectors = [];
            list.forEach(r => {
                if (r.detectors.changeDetector?.enabled) activeDetectors.push('Change Detector');
                if (r.detectors.colorDetector?.enabled) activeDetectors.push('Color Detector');
            });
            const uniqueDets = [...new Set(activeDetectors)];
            if (uniqueDets.length === 0) uniqueDets.push('Change Detector');
            return {
                ...cfg,
                regions: list.length,
                detectors: uniqueDets
            };
        }));
    }, [regionsByCamera]);

    // Dataset Management State
    const [datasets, setDatasets] = useState([]);
    const [activeDataset, setActiveDataset] = useState(null);
    const [isLoadingDatasets, setIsLoadingDatasets] = useState(false);
    const [isLoadingCameras, setIsLoadingCameras] = useState(false);
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

    // Load Datasets & Cameras on mount or tab switch
    useEffect(() => {
        if (activeTab === 'datasets') {
            loadDatasets();
        } else if (activeTab === 'cameras') {
            loadCameras();
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

    const loadCameras = async () => {
        setIsLoadingCameras(true);
        try {
            const data = await getAllCameras();
            const mappedConfigs = data.map(c => {
                const settings = c.settings || {};
                return {
                    id: c.id,
                    name: c.name,
                    status: settings.status || 'ACTIVE',
                    regions: settings.regionsCount || 0,
                    detectors: settings.detectors || ['Change Detector'],
                    cameraSource: c.type || 'DEVICE',
                    ipCameraUrl: c.url || ''
                };
            });
            setCameraConfigs(mappedConfigs);

            const newRegionsByCamera = {};
            data.forEach(c => {
                const settings = c.settings || {};
                newRegionsByCamera[c.id] = settings.regions || [];
            });
            setRegionsByCamera(newRegionsByCamera);
        } catch (err) {
            console.error('Failed to load cameras:', err);
        } finally {
            setIsLoadingCameras(false);
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

    const toggleCameraStatus = async (id) => {
        const target = cameraConfigs.find(c => c.id === id);
        if (!target) return;
        const newStatus = target.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';

        // Update local state first
        setCameraConfigs((prev) =>
            prev.map((cfg) =>
                cfg.id === id
                    ? { ...cfg, status: newStatus }
                    : cfg
            )
        );

        try {
            const list = regionsByCamera[id] || [];
            const activeDetectors = [];
            list.forEach(r => {
                if (r.detectors?.changeDetector?.enabled) activeDetectors.push('Change Detector');
                if (r.detectors?.colorDetector?.enabled) activeDetectors.push('Color Detector');
                if (r.detectors?.jigDetector?.enabled) activeDetectors.push('Jig Detector');
                if (r.detectors?.ocrDetector?.enabled) activeDetectors.push('OCR Detector');
                if (r.detectors?.dimensionDetector?.enabled) activeDetectors.push('Dimension Detector');
            });
            const uniqueDets = [...new Set(activeDetectors)];
            if (uniqueDets.length === 0) uniqueDets.push('Change Detector');

            const payload = {
                id: target.id,
                name: target.name,
                url: target.ipCameraUrl || '',
                type: target.cameraSource || 'DEVICE',
                settings: {
                    status: newStatus,
                    regionsCount: list.length,
                    detectors: uniqueDets,
                    regions: list
                }
            };
            await saveCamera(payload);
        } catch (err) {
            console.error('Failed to toggle camera status in Supabase:', err);
        }
    };

    const addCameraConfig = async () => {
        const name = newCameraName.trim();
        if (!name) {
            alert('Camera name is required.');
            return;
        }
        
        try {
            const payload = {
                name,
                url: newCameraSource === 'IP_CAMERA' ? newCameraIpUrl : '',
                type: newCameraSource,
                settings: {
                    status: 'INACTIVE',
                    regionsCount: 0,
                    detectors: ['Change Detector'],
                    regions: []
                }
            };
            const saved = await saveCamera(payload);
            
            const newConfig = {
                id: saved.id,
                name: saved.name,
                status: 'INACTIVE',
                regions: 0,
                detectors: ['Change Detector'],
                cameraSource: saved.type,
                ipCameraUrl: saved.url
            };
            
            setCameraConfigs(prev => [newConfig, ...prev]);
            setRegionsByCamera(prev => ({
                ...prev,
                [saved.id]: []
            }));
            
            setNewCameraName('');
            setNewCameraSource('DEVICE');
            setNewCameraIpUrl('');
            setShowCameraForm(false);
        } catch (err) {
            console.error('Failed to save camera:', err);
            alert(`Error saving camera: ${err.message}`);
        }
    };

    const handleDeleteCamera = async (id, name) => {
        if (!confirm(`Are you sure you want to delete camera "${name}"? This action cannot be undone.`)) {
            return;
        }
        
        try {
            await deleteCamera(id);
            setCameraConfigs(prev => prev.filter(c => c.id !== id));
            setRegionsByCamera(prev => {
                const copy = { ...prev };
                delete copy[id];
                return copy;
            });
        } catch (err) {
            console.error('Failed to delete camera:', err);
            alert(`Error deleting camera: ${err.message}`);
        }
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

    // Export dataset split into train/val subfolders grouped by label for YOLOv8 Classification
    const handleExportYolo = async () => {
        if (!activeDataset || isExporting) return;
        const samples = activeDataset.metadata?.samples || [];
        if (samples.length === 0) {
            alert('Cannot export an empty dataset. Capture some samples first!');
            return;
        }

        setIsExporting(true);
        try {
            const zip = new JSZip();
            
            // 1. Group samples by label
            const samplesByLabel = {};
            samples.forEach(sample => {
                const label = (sample.label || 'UNKNOWN').toUpperCase().replace(/\s+/g, '_');
                if (!samplesByLabel[label]) {
                    samplesByLabel[label] = [];
                }
                samplesByLabel[label].push(sample);
            });

            // 2. Split into train (80%) and val (20%) and add to ZIP
            Object.keys(samplesByLabel).forEach(label => {
                const list = samplesByLabel[label];
                // Shuffle list
                const shuffled = [...list].sort(() => 0.5 - Math.random());
                const splitIndex = Math.floor(shuffled.length * 0.8);
                const trainList = shuffled.slice(0, splitIndex);
                const valList = shuffled.slice(splitIndex);

                // Add train images
                trainList.forEach((sample, i) => {
                    const base64Data = sample.image.split(',')[1];
                    zip.file(`train/${label}/sample_${label.toLowerCase()}_${i + 1}.jpg`, base64Data, { base64: true });
                });

                // Add val images
                valList.forEach((sample, i) => {
                    const base64Data = sample.image.split(',')[1];
                    zip.file(`val/${label}/sample_${label.toLowerCase()}_${i + 1}.jpg`, base64Data, { base64: true });
                });
            });

            // 3. Generate ZIP blob and trigger browser download
            const blob = await zip.generateAsync({ type: 'blob' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${activeDataset.name.toLowerCase().replace(/\s+/g, '_')}_yolo_classify.zip`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('YOLO Export failed:', err);
            alert(`Error creating YOLO export package: ${err.message}`);
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

    const triggerSimulatedRequest = () => {
        if (privacyMode === 'DENY') {
            alert('Akses Ditolak: Pengaturan privasi saat ini disetel ke DENY. Permintaan streaming remote diblokir secara otomatis.');
            return;
        }
        if (privacyMode === 'ALLOW') {
            alert('Akses Diberikan: Pengaturan privasi saat ini disetel ke ALLOW. Streaming langsung dimulai secara remote tanpa meminta konfirmasi.');
            return;
        }
        setSimulatedAccessRequest({
            id: `req_${Date.now()}`,
            supervisor: 'Supervisor John Doe',
            camera: 'Inspection Area Zoom'
        });
    };

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
                    <button
                        onClick={() => setActiveTab('privacy')}
                        style={{
                            padding: '12px 4px', border: 'none', borderBottom: activeTab === 'privacy' ? '3px solid #3b82f6' : '3px solid transparent',
                            backgroundColor: 'transparent', color: activeTab === 'privacy' ? '#3b82f6' : '#64748b',
                            fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.15s'
                        }}
                    >
                        Vision & Privacy Settings
                    </button>
                </div>
            </div>

            {/* TAB CONTENT: CAMERA CONFIGURATIONS */}
            {activeTab === 'cameras' && (
                editingCameraConfig ? (
                    <CameraRegionEditor
                        camera={editingCameraConfig}
                        onBack={() => {
                            setEditingCameraConfig(null);
                            setSelectedRegionId(null);
                        }}
                        regionsByCamera={regionsByCamera}
                        setRegionsByCamera={setRegionsByCamera}
                        selectedRegionId={selectedRegionId}
                        setSelectedRegionId={setSelectedRegionId}
                    />
                ) : (
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
                                <div style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                        <div style={{ flex: '2 1 300px' }}>
                                            <label style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', fontWeight: 600, marginBottom: '4px' }}>Camera Name</label>
                                            <input
                                                value={newCameraName}
                                                onChange={(e) => setNewCameraName(e.target.value)}
                                                placeholder="e.g. Workstation 1 Top View"
                                                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                                            />
                                        </div>
                                        <div style={{ flex: '1 1 180px' }}>
                                            <label style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', fontWeight: 600, marginBottom: '4px' }}>Camera Source</label>
                                            <select
                                                value={newCameraSource}
                                                onChange={(e) => setNewCameraSource(e.target.value)}
                                                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', backgroundColor: 'white' }}
                                            >
                                                <option value="DEVICE">Local / USB Camera</option>
                                                <option value="IP_CAMERA">IP Camera (Network Stream)</option>
                                                <option value="SCREEN_CAPTURE">Screen Capture / Share Source</option>
                                            </select>
                                        </div>
                                    </div>
                                    
                                    {newCameraSource === 'IP_CAMERA' && (
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', fontWeight: 600, marginBottom: '4px' }}>IP Camera Stream URL</label>
                                            <input
                                                value={newCameraIpUrl}
                                                onChange={(e) => setNewCameraIpUrl(e.target.value)}
                                                placeholder="e.g. rtsp://username:password@192.168.1.100:554/h264 or http://192.168.1.50/mjpeg"
                                                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                                            />
                                        </div>
                                    )}

                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '4px' }}>
                                        <button onClick={() => setShowCameraForm(false)} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: 'white', cursor: 'pointer', fontSize: '0.85rem' }}>
                                            Cancel
                                        </button>
                                        <button onClick={addCameraConfig} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', backgroundColor: '#3b82f6', color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}>
                                            Save Configuration
                                        </button>
                                    </div>
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
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                                <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#1e293b' }}>{config.name}</div>
                                                <span style={{ fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', backgroundColor: config.cameraSource === 'IP_CAMERA' ? '#eff6ff' : config.cameraSource === 'SCREEN_CAPTURE' ? '#f5f3ff' : '#f1f5f9', color: config.cameraSource === 'IP_CAMERA' ? '#2563eb' : config.cameraSource === 'SCREEN_CAPTURE' ? '#7c3aed' : '#475569', fontWeight: 700 }}>
                                                    {config.cameraSource === 'IP_CAMERA' ? 'IP CAM' : config.cameraSource === 'SCREEN_CAPTURE' ? 'SCREEN' : 'USB'}
                                                </span>
                                            </div>
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
                                                    onClick={() => setEditingCameraConfig(config)}
                                                    style={{ width: '36px', padding: '8px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                    title="Configure Regions"
                                                >
                                                    <Settings size={16} color="#64748b" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteCamera(config.id, config.name)}
                                                    style={{ width: '36px', padding: '8px', borderRadius: '8px', border: '1px solid #fee2e2', backgroundColor: '#fef2f2', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
                                                    title="Delete Camera"
                                                >
                                                    <Trash2 size={16} color="#ef4444" />
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
                                        { name: 'OCR Detector', desc: 'Reads text from images' },
                                        { name: 'Dimension Detector', desc: 'Measures object dimensions (mm) with calibration' }
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
                )
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
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button
                                            onClick={handleExportZIP}
                                            disabled={isExporting || stats.total === 0}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: '8px',
                                                padding: '10px 18px', backgroundColor: stats.total > 0 ? '#64748b' : '#cbd5e1',
                                                color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700,
                                                cursor: stats.total > 0 ? 'pointer' : 'not-allowed', fontSize: '0.8rem'
                                            }}
                                        >
                                            {isExporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                                            EXPORT DATASET (.ZIP)
                                        </button>
                                        <button
                                            onClick={handleExportYolo}
                                            disabled={isExporting || stats.total === 0}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: '8px',
                                                padding: '10px 18px', backgroundColor: stats.total > 0 ? '#8b5cf6' : '#cbd5e1',
                                                color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700,
                                                cursor: stats.total > 0 ? 'pointer' : 'not-allowed', fontSize: '0.8rem'
                                            }}
                                        >
                                            {isExporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                                            EXPORT FOR YOLO
                                        </button>
                                    </div>
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
                        <div style={{ height: '420px', backgroundColor: '#0f172a' }}>
                            <CameraPreviewer camera={selectedCamera} />
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

            {/* TAB CONTENT: VISION & PRIVACY SETTINGS */}
            {activeTab === 'privacy' && (
                <div style={{ flex: 1, padding: '24px', display: 'grid', gridTemplateColumns: '2fr 1.2fr', gap: '24px', overflowY: 'auto' }}>
                    {/* Left: Settings */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={{ padding: '24px', backgroundColor: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                            <h3 style={{ margin: '0 0 8px 0', fontSize: '1.1rem', fontWeight: 900, color: '#0f172a' }}>Remote Camera Access</h3>
                            <p style={{ margin: '0 0 20px 0', color: '#64748b', fontSize: '0.85rem' }}>
                                Tentukan izin akses bagi Supervisor atau Administrator untuk melihat feed kamera secara remote.
                            </p>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                                {[
                                    { value: 'ALLOW', title: 'Allow (Izinkan)', desc: 'Supervisor dapat langsung melihat streaming video kamera secara remote tanpa konfirmasi operator.', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.04)', border: '#bfdbfe' },
                                    { value: 'ASK', title: 'Ask (Tanyakan - Default)', desc: 'Menampilkan dialog konfirmasi di layar ketika ada permintaan streaming remote. Operator harus menyetujui.', color: '#eab308', bg: 'rgba(234, 179, 8, 0.04)', border: '#fef08a' },
                                    { value: 'DENY', title: 'Deny (Tolak)', desc: 'Blokir semua permintaan streaming remote secara instan. Feed video hanya diolah secara lokal.', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.04)', border: '#fca5a5' }
                                ].map(option => {
                                    const isSelected = privacyMode === option.value;
                                    return (
                                        <div
                                            key={option.value}
                                            onClick={() => setPrivacyMode(option.value)}
                                            style={{
                                                padding: '16px', borderRadius: '12px', cursor: 'pointer',
                                                backgroundColor: isSelected ? option.bg : 'white',
                                                border: isSelected ? `2px solid ${option.color}` : '1px solid #e2e8f0',
                                                display: 'flex', alignItems: 'flex-start', gap: '12px',
                                                transition: 'all 0.15s'
                                            }}
                                        >
                                            <input
                                                type="radio"
                                                checked={isSelected}
                                                onChange={() => {}}
                                                style={{ marginTop: '3px', cursor: 'pointer', accentColor: option.color }}
                                            />
                                            <div>
                                                <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    {option.title}
                                                    {option.value === 'ASK' && (
                                                        <span style={{ fontSize: '0.65rem', backgroundColor: '#fef08a', color: '#854d0e', padding: '1px 6px', borderRadius: '4px', fontWeight: 800 }}>Rekomendasi</span>
                                                    )}
                                                </div>
                                                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '3px', lineHeight: 1.4 }}>{option.desc}</div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                <ShieldAlert size={20} color="#64748b" style={{ flexShrink: 0 }} />
                                <div style={{ fontSize: '0.75rem', color: '#475569', lineHeight: 1.4 }}>
                                    <strong>Uji Coba Alur Kerja:</strong> Anda dapat mensimulasikan bagaimana sistem merespons permintaan akses remote berdasarkan opsi yang dipilih di atas.
                                </div>
                                <button
                                    onClick={triggerSimulatedRequest}
                                    style={{
                                        marginLeft: 'auto', flexShrink: 0, padding: '8px 14px', borderRadius: '8px', border: 'none',
                                        backgroundColor: '#0f172a', color: 'white', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer'
                                    }}
                                >
                                    Mulai Simulasi
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Right: Info Banner */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={{ padding: '24px', backgroundColor: '#0f172a', color: 'white', borderRadius: '16px', border: '1px solid #1e293b' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                                <Sparkles size={20} color="#38bdf8" />
                                <h4 style={{ margin: 0, fontWeight: 900, fontSize: '0.95rem', letterSpacing: '0.05em' }}>EDGE PRIVACY GUARANTEE</h4>
                            </div>
                            <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '0 0 12px 0', lineHeight: 1.5 }}>
                                Tulip Vision memproses semua data citra di tingkat <strong>Edge (Lokal)</strong>. Detektor garis tepi (Canny), pembacaan display caliper (OCR), analisis pressure gauge, dan pendeteksi barcode berjalan langsung pada perangkat komputer operator.
                            </p>
                            <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>
                                Selama operasional rutin, tidak ada streaming video yang diunggah ke cloud. Server pusat hanya menerima data event numerik atau string (misal: hasil baca caliper atau status Pass/Fail), sehingga privasi operator terjaga secara penuh.
                            </p>
                        </div>

                        <div style={{ padding: '20px', backgroundColor: 'white', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                            <h4 style={{ margin: '0 0 12px 0', fontSize: '0.85rem', fontWeight: 800, color: '#334155' }}>Indikator Keamanan</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#22c55e' }} />
                                    <span style={{ fontSize: '0.75rem', color: '#475569' }}>Lokal: Pemrosesan offline aman</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#38bdf8' }} />
                                    <span style={{ fontSize: '0.75rem', color: '#475569' }}>Remote Aktif: Supervisor sedang memantau</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ef4444' }} />
                                    <span style={{ fontSize: '0.75rem', color: '#475569' }}>Diblokir: Remote access dinonaktifkan</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Simulated Remote Access Request Pop-up */}
            {simulatedAccessRequest && (
                <div style={{
                    position: 'fixed', bottom: '24px', right: '24px', width: '360px',
                    backgroundColor: 'white', borderRadius: '16px', border: '1px solid #e2e8f0',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                    padding: '16px', zIndex: 3000
                }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                        <div style={{ backgroundColor: '#fef08a', padding: '8px', borderRadius: '50%', color: '#854d0e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Shield size={20} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <h4 style={{ margin: '0 0 4px 0', fontSize: '0.85rem', fontWeight: 800, color: '#0f172a' }}>Permintaan Akses Kamera</h4>
                            <p style={{ margin: 0, fontSize: '0.75rem', color: '#475569', lineHeight: 1.4 }}>
                                <strong>{simulatedAccessRequest.supervisor}</strong> meminta akses video langsung untuk kamera <strong>{simulatedAccessRequest.camera}</strong>.
                            </p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '16px' }}>
                        <button
                            onClick={() => {
                                setSimulatedAccessRequest(null);
                                alert('Permintaan streaming dibatalkan oleh operator.');
                            }}
                            style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', backgroundColor: 'white', color: '#475569', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                        >
                            Tolak (Reject)
                        </button>
                        <button
                            onClick={() => {
                                setSimulatedAccessRequest(null);
                                alert('Akses Diberikan: Video stream remote diaktifkan.');
                            }}
                            style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', backgroundColor: '#3b82f6', color: 'white', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                        >
                            Izinkan (Allow)
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

// Full interactive camera preview with IP Camera support and monitored regions drawing
function CameraPreviewer({ camera }) {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);
    const animationFrameRef = useRef(null);
    const [hasPermission, setHasPermission] = useState(null);
    const [ipImageError, setIpImageError] = useState(false);
    const [ipImageLoaded, setIpImageLoaded] = useState(false);
    const ipImageRef = useRef(null);

    const isIpCamera = camera.cameraSource === 'IP_CAMERA';
    const isScreenCapture = camera.cameraSource === 'SCREEN_CAPTURE';
    const ipUrl = camera.ipCameraUrl || '';

    useEffect(() => {
        if (isIpCamera) {
            setHasPermission(true);
            return;
        }

        let activeStream = null;
        const startStream = async () => {
            try {
                let stream;
                if (isScreenCapture) {
                    stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
                } else {
                    stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
                }
                setHasPermission(true);
                activeStream = stream;
                streamRef.current = stream;
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.play().catch(e => console.warn(e));
                }
            } catch (err) {
                console.error(err);
                setHasPermission(false);
            }
        };

        startStream();

        return () => {
            if (activeStream) {
                activeStream.getTracks().forEach(track => track.stop());
            }
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [isIpCamera, isScreenCapture, ipUrl]);

    // Track Image load for MJPEG
    useEffect(() => {
        if (!isIpCamera || !ipUrl) {
            ipImageRef.current = null;
            setIpImageLoaded(false);
            setIpImageError(false);
            return;
        }

        const isRtsp = ipUrl.toLowerCase().startsWith('rtsp://');
        if (isRtsp) {
            ipImageRef.current = null;
            setIpImageLoaded(true);
            return;
        }

        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            setIpImageLoaded(true);
            setIpImageError(false);
        };
        img.onerror = () => {
            setIpImageError(true);
        };
        img.src = ipUrl;
        ipImageRef.current = img;

        return () => {
            img.onload = null;
            img.onerror = null;
        };
    }, [isIpCamera, ipUrl]);

    // Canvas drawing loop
    useEffect(() => {
        if (!hasPermission) return;

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let tick = 0;
        const render = () => {
            tick = (tick + 1) % 1000;
            const w = canvas.width;
            const h = canvas.height;

            const isRtsp = ipUrl.toLowerCase().startsWith('rtsp://');

            if (isIpCamera) {
                if (isRtsp || ipImageError || !ipUrl) {
                    // Draw simulated IP Camera stream
                    ctx.fillStyle = '#0f172a';
                    ctx.fillRect(0, 0, w, h);
                    
                    // Grid
                    ctx.strokeStyle = '#1e293b';
                    ctx.lineWidth = 1;
                    for (let i = 40; i < w; i += 40) {
                        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, h); ctx.stroke();
                    }
                    for (let i = 40; i < h; i += 40) {
                        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(w, i); ctx.stroke();
                    }

                    // Conveyor track
                    ctx.fillStyle = '#334155';
                    ctx.fillRect(0, h - 80, w, 20);
                    // Rollers
                    ctx.fillStyle = '#475569';
                    for (let rx = (tick * 2) % 60; rx < w; rx += 60) {
                        ctx.beginPath(); ctx.arc(rx, h - 70, 8, 0, Math.PI * 2); ctx.fill();
                    }

                    // Passing parts
                    const px = (tick * 1.5) % (w + 120) - 60;
                    ctx.fillStyle = '#4f46e5';
                    ctx.fillRect(px, h - 130, 60, 50);

                    // Overlay details
                    ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
                    ctx.fillRect(10, 10, w - 20, 26);
                    ctx.strokeStyle = '#38bdf8';
                    ctx.strokeRect(10, 10, w - 20, 26);
                    ctx.fillStyle = '#38bdf8';
                    ctx.font = 'bold 9px monospace';
                    ctx.textAlign = 'left';
                    ctx.fillText(`STREAM: ${ipUrl ? ipUrl.toUpperCase() : 'RTSP STREAM NOT CONFIG'}`, 16, 26);
                    
                    ctx.textAlign = 'right';
                    ctx.fillStyle = '#ef4444';
                    ctx.beginPath(); ctx.arc(w - 24, 23, 4, 0, Math.PI * 2); ctx.fill();
                    ctx.fillText('LIVE-FEED SIM', w - 34, 26);
                } else if (ipImageRef.current && ipImageLoaded) {
                    try {
                        ctx.drawImage(ipImageRef.current, 0, 0, w, h);
                    } catch (e) {
                        // fallback
                    }
                } else {
                    ctx.fillStyle = '#1e293b';
                    ctx.fillRect(0, 0, w, h);
                    ctx.fillStyle = '#94a3b8';
                    ctx.font = '14px Inter, sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText('Connecting to IP Camera Stream...', w / 2, h / 2);
                }
            } else if (videoRef.current && videoRef.current.readyState >= 2) {
                ctx.drawImage(videoRef.current, 0, 0, w, h);
            }

            // Draw regions monitored overlays
            ctx.strokeStyle = '#22c55e'; // Green bounding boxes for regions
            ctx.lineWidth = 2;
            ctx.fillStyle = 'rgba(34, 197, 94, 0.1)';
            
            // Draw 2 mock regions
            ctx.strokeRect(w * 0.15, h * 0.2, w * 0.2, h * 0.3);
            ctx.fillRect(w * 0.15, h * 0.2, w * 0.2, h * 0.3);
            ctx.fillStyle = '#22c55e';
            ctx.font = 'bold 9px Inter, sans-serif';
            ctx.fillText('REGION 1: OK', w * 0.15, h * 0.2 - 6);

            ctx.strokeStyle = '#eab308'; // Yellow for region 2
            ctx.fillStyle = 'rgba(234, 179, 8, 0.1)';
            ctx.strokeRect(w * 0.6, h * 0.3, w * 0.25, h * 0.25);
            ctx.fillRect(w * 0.6, h * 0.3, w * 0.25, h * 0.25);
            ctx.fillStyle = '#eab308';
            ctx.fillText('REGION 2: CHECKING', w * 0.6, h * 0.3 - 6);

            animationFrameRef.current = requestAnimationFrame(render);
        };

        animationFrameRef.current = requestAnimationFrame(render);
        return () => {
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        };
    }, [hasPermission, isIpCamera, ipUrl, ipImageError, ipImageLoaded]);

    return (
        <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {!isIpCamera && (
                <video
                    ref={videoRef}
                    style={{ display: 'none' }}
                    width="640"
                    height="480"
                    playsInline
                    muted
                />
            )}
            {hasPermission === false && !isIpCamera ? (
                <div style={{ textAlign: 'center', color: '#94a3b8' }}>
                    <AlertTriangle size={36} color="#ef4444" style={{ margin: '0 auto 10px' }} />
                    <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>Kamera Tidak Tersedia</div>
                </div>
            ) : (
                <canvas
                    ref={canvasRef}
                    width="640"
                    height="480"
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
            )}
        </div>
    );
}

function CameraRegionEditor({
    camera,
    onBack,
    regionsByCamera,
    setRegionsByCamera,
    selectedRegionId,
    setSelectedRegionId
}) {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);
    const animationFrameRef = useRef(null);
    const [hasPermission, setHasPermission] = useState(null);
    const [cameraLoading, setCameraLoading] = useState(true);

    // Configure Offline toggle
    const [configureOffline, setConfigureOffline] = useState(false);

    // Accordion expand states
    const [changeDetectorExpanded, setChangeDetectorExpanded] = useState(false);
    const [colorDetectorExpanded, setColorDetectorExpanded] = useState(true);
    const [jigDetectorExpanded, setJigDetectorExpanded] = useState(false);
    const [ocrDetectorExpanded, setOcrDetectorExpanded] = useState(false);
    const [dimensionDetectorExpanded, setDimensionDetectorExpanded] = useState(false);
    const [showDetectorSelector, setShowDetectorSelector] = useState(false);

    // Settings panel throttled similarity value
    const [settingsSimilarity, setSettingsSimilarity] = useState(0);

    // Interaction states
    const [isDrawing, setIsDrawing] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [drawStart, setDrawStart] = useState({ x: 0, y: 0 });
    const [drawCurrent, setDrawCurrent] = useState({ x: 0, y: 0 });
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    // Station selection state
    const [selectedStation, setSelectedStation] = useState('Station A');
    const [stations, setStations] = useState([]);

    // Fetch real stations from DB to connect vision settings with station menu
    useEffect(() => {
        let isMounted = true;
        getStations().then(data => {
            if (isMounted && data && data.length > 0) {
                setStations(data);
                const hasMatch = data.some(s => s.name === selectedStation || s.id === selectedStation);
                if (!hasMatch) {
                    setSelectedStation(data[0].name || data[0].id);
                }
            }
        }).catch(err => {
            console.error('Failed to load stations in Vision:', err);
        });
        return () => { isMounted = false; };
    }, []);

    // Tooltip states for help icons
    const [hoveredHelp, setHoveredHelp] = useState(null);

    // Menu open state for detector rows
    const [openDetectorMenu, setOpenDetectorMenu] = useState(null);

    // Refs to hold live calculated values without re-rendering React
    const similarityRef = useRef({});
    const avgColorsRef = useRef({});
    const prevIntensityRef = useRef({});
    const lastAnalysisTimeRef = useRef(0);
    const logsRef = useRef([
        {
            id: 'init_1',
            time: new Date(Date.now() - 120000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            regionName: 'System Monitor',
            detectorType: 'System',
            value: 'Camera connected',
            status: 'ACTIVE'
        },
        {
            id: 'init_2',
            time: new Date(Date.now() - 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            regionName: 'System Monitor',
            detectorType: 'System',
            value: 'Stream started',
            status: 'ACTIVE'
        }
    ]);

    const [showGridOverlay, setShowGridOverlay] = useState(false);
    const [brightness, setBrightness] = useState(100);
    const [contrast, setContrast] = useState(100);
    const [activityLogs, setActivityLogs] = useState([]);

    // Periodic synchronization of activity logs to local state to avoid high frequency render thrashing
    useEffect(() => {
        setActivityLogs([...logsRef.current]);
        const interval = setInterval(() => {
            setActivityLogs([...logsRef.current]);
        }, 800);
        return () => clearInterval(interval);
    }, []);

    const regions = regionsByCamera[camera.id] || [];
    const selectedRegion = regions.find(r => r.id === selectedRegionId);

    // Debounced auto-save camera configs and region list back to Supabase
    useEffect(() => {
        if (cameraLoading) return;

        const delayDebounce = setTimeout(async () => {
            try {
                const activeDetectors = [];
                regions.forEach(r => {
                    if (r.detectors?.changeDetector?.enabled) activeDetectors.push('Change Detector');
                    if (r.detectors?.colorDetector?.enabled) activeDetectors.push('Color Detector');
                    if (r.detectors?.jigDetector?.enabled) activeDetectors.push('Jig Detector');
                    if (r.detectors?.ocrDetector?.enabled) activeDetectors.push('OCR Detector');
                    if (r.detectors?.dimensionDetector?.enabled) activeDetectors.push('Dimension Detector');
                });
                const uniqueDets = [...new Set(activeDetectors)];
                if (uniqueDets.length === 0) uniqueDets.push('Change Detector');

                const settings = {
                    status: camera.status || 'ACTIVE',
                    regionsCount: regions.length,
                    detectors: uniqueDets,
                    regions: regions
                };

                const payload = {
                    id: camera.id,
                    name: camera.name,
                    url: camera.ipCameraUrl || '',
                    type: camera.cameraSource || 'DEVICE',
                    settings: settings
                };

                await saveCamera(payload);
                console.log('[Supabase] Camera config and regions auto-saved successfully.');
            } catch (err) {
                console.error('[Supabase] Failed to auto-save camera config:', err);
            }
        }, 1500);

        return () => clearTimeout(delayDebounce);
    }, [regions, camera.name, camera.status, camera.cameraSource, camera.ipCameraUrl, cameraLoading]);

    // Start real camera stream
    useEffect(() => {
        if (configureOffline) {
            setCameraLoading(false);
            return;
        }

        if (camera.cameraSource === 'IP_CAMERA') {
            setHasPermission(true);
            setCameraLoading(false);
            return;
        }

        if (camera.cameraSource === 'SCREEN_CAPTURE') {
            setCameraLoading(true);
            let activeStream = null;
            navigator.mediaDevices.getDisplayMedia({ video: true })
            .then((stream) => {
                setHasPermission(true);
                setCameraLoading(false);
                activeStream = stream;
                streamRef.current = stream;
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.play().catch(e => console.warn(e));
                }
            })
            .catch((err) => {
                console.error('Screen capture error:', err);
                setHasPermission(false);
                setCameraLoading(false);
            });
            return () => {
                if (activeStream) activeStream.getTracks().forEach(track => track.stop());
                if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
            };
        }

        // Default: DEVICE camera
        setCameraLoading(true);
        let activeStream = null;
        navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'environment' }
        })
        .then((stream) => {
            setHasPermission(true);
            setCameraLoading(false);
            activeStream = stream;
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play().catch(e => console.warn(e));
            }
        })
        .catch((err) => {
            console.error('Camera access error:', err);
            setHasPermission(false);
            setCameraLoading(false);
        });

        return () => {
            if (activeStream) {
                activeStream.getTracks().forEach(track => track.stop());
            }
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [camera.cameraSource, configureOffline]);

    // Throttle similarity updates for the settings panel to avoid lag
    useEffect(() => {
        const interval = setInterval(() => {
            if (selectedRegionId) {
                const sim = similarityRef.current[selectedRegionId] || 0;
                setSettingsSimilarity(sim);
            }
        }, 150);
        return () => clearInterval(interval);
    }, [selectedRegionId]);

    // Helper functions for updating state
    const updateRegionName = (id, name) => {
        setRegionsByCamera(prev => ({
            ...prev,
            [camera.id]: prev[camera.id].map(r => r.id === id ? {
                ...r,
                name,
                detectors: {
                    ...r.detectors,
                    colorDetector: {
                        ...r.detectors.colorDetector,
                        name: `${name} Color`
                    }
                }
            } : r)
        }));
    };

    const updateRegionThresholds = (id, begin, end) => {
        setRegionsByCamera(prev => ({
            ...prev,
            [camera.id]: prev[camera.id].map(r => r.id === id ? {
                ...r,
                detectors: {
                    ...r.detectors,
                    colorDetector: {
                        ...r.detectors.colorDetector,
                        beginThreshold: begin,
                        endThreshold: end
                    }
                }
            } : r)
        }));
    };

    const updateRegionTargetColor = (id, color) => {
        setRegionsByCamera(prev => ({
            ...prev,
            [camera.id]: prev[camera.id].map(r => r.id === id ? {
                ...r,
                detectors: {
                    ...r.detectors,
                    colorDetector: {
                        ...r.detectors.colorDetector,
                        targetColor: color
                    }
                }
            } : r)
        }));
    };

    const toggleDetector = (id, type, enabled) => {
        setRegionsByCamera(prev => ({
            ...prev,
            [camera.id]: prev[camera.id].map(r => r.id === id ? {
                ...r,
                detectors: {
                    ...r.detectors,
                    [type]: {
                        ...r.detectors[type],
                        enabled
                    }
                }
            } : r)
        }));
    };

    const updateChangeDetectorSetting = (id, key, value) => {
        setRegionsByCamera(prev => ({
            ...prev,
            [camera.id]: prev[camera.id].map(r => r.id === id ? {
                ...r,
                detectors: {
                    ...r.detectors,
                    changeDetector: {
                        ...r.detectors.changeDetector,
                        [key]: value
                    }
                }
            } : r)
        }));
    };

    const updateJigDetectorSetting = (id, key, value) => {
        setRegionsByCamera(prev => ({
            ...prev,
            [camera.id]: prev[camera.id].map(r => r.id === id ? {
                ...r,
                detectors: {
                    ...r.detectors,
                    jigDetector: {
                        ...r.detectors.jigDetector,
                        [key]: value
                    }
                }
            } : r)
        }));
    };

    const updateOcrDetectorSetting = (id, key, value) => {
        setRegionsByCamera(prev => ({
            ...prev,
            [camera.id]: prev[camera.id].map(r => r.id === id ? {
                ...r,
                detectors: {
                    ...r.detectors,
                    ocrDetector: {
                        ...r.detectors.ocrDetector,
                        [key]: value
                    }
                }
            } : r)
        }));
    };

    const updateDimensionDetectorSetting = (id, key, value) => {
        setRegionsByCamera(prev => ({
            ...prev,
            [camera.id]: prev[camera.id].map(r => r.id === id ? {
                ...r,
                detectors: {
                    ...r.detectors,
                    dimensionDetector: {
                        ...r.detectors.dimensionDetector,
                        [key]: value
                    }
                }
            } : r)
        }));
    };

    const deleteRegion = (id) => {
        setRegionsByCamera(prev => ({
            ...prev,
            [camera.id]: prev[camera.id].filter(r => r.id !== id)
        }));
        if (selectedRegionId === id) setSelectedRegionId(null);
    };

    const handleCreateDetector = (e) => {
        e.preventDefault();
        if (!selectedRegionId) return;
        setShowDetectorSelector(prev => !prev);
    };

    // Helper functions for parsing colors
    const hexToRgb = (hex) => {
        if (!hex) return { r: 0, g: 0, b: 0 };
        const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
        const fullHex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 0, g: 0, b: 0 };
    };

    const rgbToHex = (r, g, b) => {
        const toHex = (c) => {
            const hex = Math.round(c).toString(16);
            return hex.length === 1 ? "0" + hex : hex;
        };
        return "#" + toHex(r) + toHex(g) + toHex(b);
    };

    const handleSetCurrentRegionColor = () => {
        if (!selectedRegionId) return;
        const avg = avgColorsRef.current[selectedRegionId];
        if (avg) {
            const hex = rgbToHex(avg.r, avg.g, avg.b);
            updateRegionTargetColor(selectedRegionId, hex);
        } else {
            updateRegionTargetColor(selectedRegionId, '#cbd5e1');
        }
    };

    const getMousePos = (e) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
        const y = ((e.clientY - rect.top) / rect.height) * canvas.height;
        return { x: Math.round(x), y: Math.round(y) };
    };

    const handleMouseDown = (e) => {
        const pos = getMousePos(e);
        const clickedRegion = [...regions].reverse().find(r => 
            pos.x >= r.x && pos.x <= r.x + r.w &&
            pos.y >= r.y && pos.y <= r.y + r.h
        );

        if (clickedRegion) {
            setSelectedRegionId(clickedRegion.id);
            setIsDragging(true);
            setDragStart({
                x: pos.x - clickedRegion.x,
                y: pos.y - clickedRegion.y
            });
        } else {
            setIsDrawing(true);
            setDrawStart(pos);
            setDrawCurrent(pos);
        }
    };

    const handleMouseMove = (e) => {
        const pos = getMousePos(e);
        if (isDragging && selectedRegionId) {
            const updatedRegions = regions.map(r => {
                if (r.id === selectedRegionId) {
                    let newX = pos.x - dragStart.x;
                    let newY = pos.y - dragStart.y;
                    newX = Math.max(0, Math.min(newX, 640 - r.w));
                    newY = Math.max(0, Math.min(newY, 480 - r.h));
                    return { ...r, x: newX, y: newY };
                }
                return r;
            });
            setRegionsByCamera(prev => ({
                ...prev,
                [camera.id]: updatedRegions
            }));
        } else if (isDrawing) {
            setDrawCurrent(pos);
        }
    };

    const handleMouseUp = () => {
        if (isDragging) {
            setIsDragging(false);
        } else if (isDrawing) {
            setIsDrawing(false);
            const x = Math.min(drawStart.x, drawCurrent.x);
            const y = Math.min(drawStart.y, drawCurrent.y);
            const w = Math.abs(drawStart.x - drawCurrent.x);
            const h = Math.abs(drawStart.y - drawCurrent.y);

            if (w > 20 && h > 20) {
                const nextNum = regions.length + 1;
                const newReg = {
                    id: `reg_${Date.now()}`,
                    name: `Region ${nextNum}`,
                    x: Math.round(x),
                    y: Math.round(y),
                    w: Math.round(w),
                    h: Math.round(h),
                    detectors: {
                        changeDetector: {
                            enabled: false,
                            beginThreshold: 40,
                            upperThreshold: 100,
                            lowerThreshold: 10,
                            adaptationSpeed: 'Medium',
                            resetOnEnd: true,
                            resetDuration: 0.50
                        },
                        colorDetector: {
                            enabled: true,
                            name: `Region ${nextNum} Color`,
                            beginThreshold: 72,
                            endThreshold: 66,
                            targetColor: '#eab308',
                            similarity: 0
                        },
                        jigDetector: {
                            enabled: false,
                            name: `Region ${nextNum} Jig`,
                            markerType: 'ArUco',
                            markerId: 0
                        },
                        ocrDetector: {
                            enabled: false,
                            name: `Region ${nextNum} OCR`,
                            language: 'English',
                            matchPattern: '',
                            confidenceThreshold: 80
                        },
                        dimensionDetector: {
                            enabled: false,
                            name: `Region ${nextNum} Dimension`,
                            referenceSize: 20,
                            measureMode: 'Width',
                            unit: 'mm',
                            minArea: 100,
                            cannyThreshold: 100,
                            lsl: 19.5,
                            usl: 20.5
                        }
                    }
                };
                setRegionsByCamera(prev => ({
                    ...prev,
                    [camera.id]: [...(prev[camera.id] || []), newReg]
                }));
                setSelectedRegionId(newReg.id);
            } else {
                setSelectedRegionId(null);
            }
        }
    };

    // Draw L-shaped corner markers on a region (Tulip-style)
    const drawCornerMarkers = (ctx, x, y, w, h, color, size = 12) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        // Top-left
        ctx.beginPath();
        ctx.moveTo(x, y + size); ctx.lineTo(x, y); ctx.lineTo(x + size, y);
        ctx.stroke();
        // Top-right
        ctx.beginPath();
        ctx.moveTo(x + w - size, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y + size);
        ctx.stroke();
        // Bottom-left
        ctx.beginPath();
        ctx.moveTo(x, y + h - size); ctx.lineTo(x, y + h); ctx.lineTo(x + size, y + h);
        ctx.stroke();
        // Bottom-right
        ctx.beginPath();
        ctx.moveTo(x + w - size, y + h); ctx.lineTo(x + w, y + h); ctx.lineTo(x + w, y + h - size);
        ctx.stroke();
    };

    // Draw camera offline placeholder
    const drawOfflinePlaceholder = (ctx, w, h) => {
        ctx.fillStyle = '#111827';
        ctx.fillRect(0, 0, w, h);
        // Subtle grid
        ctx.strokeStyle = 'rgba(255,255,255,0.04)';
        ctx.lineWidth = 1;
        for (let i = 40; i < w; i += 40) {
            ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, h); ctx.stroke();
        }
        for (let i = 40; i < h; i += 40) {
            ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(w, i); ctx.stroke();
        }
        // Center icon
        ctx.fillStyle = 'rgba(255,255,255,0.08)';
        ctx.beginPath();
        ctx.arc(w / 2, h / 2 - 10, 30, 0, Math.PI * 2);
        ctx.fill();
        // Camera icon (simple rect + circle)
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.fillRect(w / 2 - 18, h / 2 - 20, 36, 24);
        ctx.beginPath();
        ctx.arc(w / 2, h / 2 - 8, 8, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255,255,255,0.25)';
        ctx.lineWidth = 2;
        ctx.stroke();
        // Text
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.font = '600 13px Inter, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(configureOffline ? 'Configure Offline Mode' : 'Camera Offline', w / 2, h / 2 + 30);
        ctx.font = '400 11px Inter, system-ui, sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.18)';
        ctx.fillText('Draw regions on this area to configure detection zones', w / 2, h / 2 + 48);
    };

    // Main animation and canvas processing loop
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const render = () => {
            const w = canvas.width;
            const h = canvas.height;

            // 1. Draw Feed — real camera feed or offline placeholder
            let hasVideoFeed = false;
            if (!configureOffline && hasPermission && camera.cameraSource === 'DEVICE' && videoRef.current && videoRef.current.readyState >= 2) {
                try {
                    ctx.filter = `brightness(${brightness}%) contrast(${contrast}%)`;
                    ctx.drawImage(videoRef.current, 0, 0, w, h);
                    ctx.filter = 'none';
                    hasVideoFeed = true;
                } catch (e) {
                    ctx.filter = 'none';
                    drawOfflinePlaceholder(ctx, w, h);
                }
            } else if (!configureOffline && hasPermission && camera.cameraSource === 'SCREEN_CAPTURE' && videoRef.current && videoRef.current.readyState >= 2) {
                try {
                    ctx.filter = `brightness(${brightness}%) contrast(${contrast}%)`;
                    ctx.drawImage(videoRef.current, 0, 0, w, h);
                    ctx.filter = 'none';
                    hasVideoFeed = true;
                } catch (e) {
                    ctx.filter = 'none';
                    drawOfflinePlaceholder(ctx, w, h);
                }
            } else {
                drawOfflinePlaceholder(ctx, w, h);
            }

            // Draw fine grid lines overlay if enabled
            if (showGridOverlay) {
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
                ctx.lineWidth = 1;
                ctx.setLineDash([4, 4]);
                // Vertical lines
                ctx.beginPath(); ctx.moveTo(w / 3, 0); ctx.lineTo(w / 3, h); ctx.stroke();
                ctx.beginPath(); ctx.moveTo((2 * w) / 3, 0); ctx.lineTo((2 * w) / 3, h); ctx.stroke();
                // Horizontal lines
                ctx.beginPath(); ctx.moveTo(0, h / 3); ctx.lineTo(w, h / 3); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(0, (2 * h) / 3); ctx.lineTo(w, (2 * h) / 3); ctx.stroke();
                ctx.setLineDash([]);
            }

            // 2. Process Regions (read colors, compute similarities, draw overlays)
            const now = Date.now();
            const shouldAnalyze = now - lastAnalysisTimeRef.current >= 100; // 10 FPS for heavy pixel processing
            if (shouldAnalyze) {
                lastAnalysisTimeRef.current = now;
            }

            regions.forEach((region, regionIndex) => {
                const rx = Math.max(0, Math.min(region.x, w - 2));
                const ry = Math.max(0, Math.min(region.y, h - 2));
                const rw = Math.max(2, Math.min(region.w, w - rx));
                const rh = Math.max(2, Math.min(region.h, h - ry));

                // A. Extract average color under the region (only if live feed and shouldAnalyze)
                const colorDet = region.detectors?.colorDetector;
                const changeDet = region.detectors?.changeDetector;
                const jigDet = region.detectors?.jigDetector;
                const ocrDet = region.detectors?.ocrDetector;
                const dimDet = region.detectors?.dimensionDetector;

                if (hasVideoFeed && shouldAnalyze) {
                    try {
                        const imgData = ctx.getImageData(rx, ry, rw, rh);
                        const pixels = imgData.data;
                        let rSum = 0, gSum = 0, bSum = 0, count = 0;
                        // Skip pixels to optimize further: skip by 24 for larger steps to save CPU
                        for (let i = 0; i < pixels.length; i += 24) {
                            rSum += pixels[i];
                            gSum += pixels[i+1];
                            bSum += pixels[i+2];
                            count++;
                        }
                        const avgR = rSum / count;
                        const avgG = gSum / count;
                        const avgB = bSum / count;
                        
                        avgColorsRef.current[region.id] = { r: avgR, g: avgG, b: avgB };
                        
                        // Compute color similarity
                        if (colorDet && colorDet.enabled) {
                            const targetRGB = hexToRgb(colorDet.targetColor);
                            const dr = avgR - targetRGB.r;
                            const dg = avgG - targetRGB.g;
                            const db = avgB - targetRGB.b;
                            const dist = Math.sqrt(dr*dr + dg*dg + db*db);
                            const colorSimilarity = Math.round(Math.max(0, 100 - (dist / 441.67) * 100));
                            
                            region.colorSimilarity = colorSimilarity;
                            
                            if (region.id === selectedRegionId) {
                                similarityRef.current[region.id] = colorSimilarity;
                            }

                            const oldMatching = region.isMatching;
                            let isMatching = region.isMatching || false;
                            if (colorSimilarity >= colorDet.beginThreshold) {
                                isMatching = true;
                            } else if (colorSimilarity < colorDet.endThreshold) {
                                isMatching = false;
                            }
                            region.isMatching = isMatching;

                            // Log event on transition
                            if (oldMatching !== undefined && oldMatching !== isMatching) {
                                const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                                const newLog = {
                                    id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                                    time: timestamp,
                                    regionName: region.name,
                                    detectorType: 'Color',
                                    value: `Sim: ${colorSimilarity}%`,
                                    status: isMatching ? 'MATCH' : 'NO MATCH'
                                };
                                logsRef.current = [newLog, ...logsRef.current].slice(0, 20);
                            }
                        }

                        // Compute change detection
                        if (changeDet && changeDet.enabled) {
                            const currentIntensity = (avgR + avgG + avgB) / 3;
                            const prevIntensity = prevIntensityRef.current[region.id];
                            let delta = 0;
                            if (prevIntensity !== undefined) {
                                delta = Math.abs(currentIntensity - prevIntensity);
                            }
                            prevIntensityRef.current[region.id] = currentIntensity;

                            // Scale delta so minor movement triggers nicely
                            const changePercent = Math.round(Math.min(100, (delta / 12) * 100));
                            region.changePercent = changePercent;
                            
                            if (region.id === selectedRegionId && (!colorDet || !colorDet.enabled)) {
                                similarityRef.current[region.id] = changePercent;
                            }

                            const oldTriggered = region.changeTriggered;
                            let changeTriggered = region.changeTriggered || false;
                            if (changePercent >= changeDet.beginThreshold) {
                                changeTriggered = true;
                            } else if (changePercent < changeDet.lowerThreshold) {
                                changeTriggered = false;
                            }
                            region.changeTriggered = changeTriggered;

                            // Log event on transition
                            if (oldTriggered !== undefined && oldTriggered !== changeTriggered) {
                                const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                                const newLog = {
                                    id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                                    time: timestamp,
                                    regionName: region.name,
                                    detectorType: 'Change',
                                    value: `Delta: ${changePercent}%`,
                                    status: changeTriggered ? 'TRIGGERED' : 'IDLE'
                                };
                                logsRef.current = [newLog, ...logsRef.current].slice(0, 20);
                            }
                        }

                        // Dimension Detector
                        if (dimDet && dimDet.enabled) {
                             const totalPixels = rw * rh;
                             const intensities = new Float32Array(totalPixels);
                             for (let i = 0; i < totalPixels; i++) {
                                 const idx = i * 4;
                                 intensities[i] = 0.299 * pixels[idx] + 0.587 * pixels[idx+1] + 0.114 * pixels[idx+2];
                             }
                             
                             const threshold = dimDet.cannyThreshold ?? 100;
                             const minArea = dimDet.minArea ?? 100;
                             
                             let minX = rw;
                             let maxX = 0;
                             let minY = rh;
                             let maxY = 0;
                             let edgeCount = 0;
                             
                             for (let y = 1; y < rh - 1; y++) {
                                 for (let x = 1; x < rw - 1; x++) {
                                     const val00 = intensities[(y-1)*rw + (x-1)];
                                     const val01 = intensities[(y-1)*rw + x];
                                     const val02 = intensities[(y-1)*rw + (x+1)];
                                     
                                     const val10 = intensities[y*rw + (x-1)];
                                     const val12 = intensities[y*rw + (x+1)];
                                     
                                     const val20 = intensities[(y+1)*rw + (x-1)];
                                     const val21 = intensities[(y+1)*rw + x];
                                     const val22 = intensities[(y+1)*rw + (x+1)];
                                     
                                     const gx = (val02 + 2*val12 + val22) - (val00 + 2*val10 + val20);
                                     const gy = (val20 + 2*val21 + val22) - (val00 + 2*val01 + val02);
                                     const g = Math.sqrt(gx*gx + gy*gy);
                                     
                                     if (g > threshold) {
                                         if (x < minX) minX = x;
                                         if (x > maxX) maxX = x;
                                         if (y < minY) minY = y;
                                         if (y > maxY) maxY = y;
                                         edgeCount++;
                                     }
                                 }
                             }
                             
                             const detectedW = (maxX >= minX) ? (maxX - minX + 1) : 0;
                             const detectedH = (maxY >= minY) ? (maxY - minY + 1) : 0;
                             const detectedArea = detectedW * detectedH;
                             
                             let measuredValue = 0;
                             let isPass = false;
                             
                             if (edgeCount >= 5 && detectedW > 0 && detectedH > 0 && detectedArea >= minArea) {
                                 const mode = dimDet.measureMode || 'Width';
                                 const unit = dimDet.unit || 'mm';
                                 const referenceSize = dimDet.referenceSize ?? 20;
                                 let scale = 1;
                                 
                                 if (unit === 'px') {
                                     if (mode === 'Width') measuredValue = detectedW;
                                     else if (mode === 'Height') measuredValue = detectedH;
                                     else if (mode === 'Diagonal') measuredValue = Number(Math.sqrt(detectedW*detectedW + detectedH*detectedH).toFixed(1));
                                     else if (mode === 'Area') measuredValue = detectedArea;
                                 } else {
                                     if (mode === 'Width') {
                                         scale = referenceSize / rw;
                                         measuredValue = Number((detectedW * scale).toFixed(2));
                                     } else if (mode === 'Height') {
                                         scale = referenceSize / rh;
                                         measuredValue = Number((detectedH * scale).toFixed(2));
                                     } else if (mode === 'Diagonal') {
                                         scale = referenceSize / Math.sqrt(rw * rw + rh * rh);
                                         const diagPixels = Math.sqrt(detectedW * detectedW + detectedH * detectedH);
                                         measuredValue = Number((diagPixels * scale).toFixed(2));
                                     } else if (mode === 'Area') {
                                         scale = referenceSize / (rw * rh);
                                         measuredValue = Number((detectedArea * scale).toFixed(2));
                                     }
                                 }
                                 
                                 isPass = measuredValue >= (dimDet.lsl ?? 19.5) && measuredValue <= (dimDet.usl ?? 20.5);
                                 region.objectBox = {
                                     ox: rx + minX,
                                     oy: ry + minY,
                                     ow: detectedW,
                                     oh: detectedH
                                 };
                             } else {
                                 measuredValue = 0;
                                 isPass = false;
                                 region.objectBox = null;
                             }
                             
                             region.measuredValue = measuredValue;
                             
                             const oldPass = region.lastPassStatus;
                             region.lastPassStatus = isPass;
                             
                             if (oldPass !== undefined && oldPass !== isPass) {
                                 const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                                 const newLog = {
                                     id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                                     time: timestamp,
                                     regionName: region.name,
                                     detectorType: 'Dimension',
                                     value: `${measuredValue} ${dimDet.unit || 'mm'}`,
                                     status: isPass ? 'PASS' : 'FAIL'
                                 };
                                 logsRef.current = [newLog, ...logsRef.current].slice(0, 20);
                             }
                        } else {
                             region.objectBox = null;
                        }
                    } catch (e) {
                        // silent
                    }
                }

                // Retrieve cached or calculated status for drawing
                const isMatching = region.isMatching || false;
                const changeTriggered = region.changeTriggered || false;
                const colorSimilarity = region.colorSimilarity || 0;
                const changePercent = region.changePercent || 0;

                // Draw bounding box
                const isSelected = region.id === selectedRegionId;
                let borderColor = '#3b82f6';
                let fillStyle = 'rgba(255, 255, 255, 0.02)';

                if (colorDet && colorDet.enabled) {
                    borderColor = isMatching ? '#22c55e' : '#ef4444';
                    fillStyle = isMatching ? 'rgba(34, 197, 94, 0.04)' : 'rgba(239, 68, 68, 0.03)';
                } else if (changeDet && changeDet.enabled) {
                    borderColor = changeTriggered ? '#10b981' : '#f59e0b';
                    fillStyle = changeTriggered ? 'rgba(16, 185, 129, 0.04)' : 'rgba(245, 158, 11, 0.03)';
                } else if (jigDet && jigDet.enabled) {
                    borderColor = '#a855f7'; // Purple
                    fillStyle = 'rgba(168, 85, 247, 0.04)';
                } else if (ocrDet && ocrDet.enabled) {
                    borderColor = '#ec4899'; // Pink
                    fillStyle = 'rgba(236, 72, 153, 0.04)';
                } else if (dimDet && dimDet.enabled) {
                    const isPass = region.lastPassStatus ?? false;
                    borderColor = isPass ? '#10b981' : '#ef4444';
                    fillStyle = isPass ? 'rgba(16, 185, 129, 0.04)' : 'rgba(239, 68, 68, 0.03)';
                }

                if (isSelected) {
                    borderColor = '#0ea5e9';
                    fillStyle = 'rgba(14, 165, 233, 0.06)';
                }

                // Thin border line
                ctx.strokeStyle = borderColor;
                ctx.lineWidth = isSelected ? 2.5 : 1.5;
                ctx.strokeRect(region.x, region.y, region.w, region.h);

                // Draw detected object bounding box inside the region
                if (dimDet && dimDet.enabled && region.objectBox && hasVideoFeed) {
                    const { ox, oy, ow, oh } = region.objectBox;
                    const isPass = region.lastPassStatus ?? false;
                    ctx.strokeStyle = isPass ? '#10b981' : '#ef4444';
                    ctx.lineWidth = 1;
                    ctx.setLineDash([3, 3]);
                    ctx.strokeRect(ox, oy, ow, oh);
                    ctx.setLineDash([]);
                }

                // L-shaped corner markers (Tulip-style)
                const cornerSize = Math.min(16, Math.min(region.w, region.h) * 0.25);
                drawCornerMarkers(ctx, region.x, region.y, region.w, region.h, borderColor, cornerSize);

                // Light tint inside region
                ctx.fillStyle = fillStyle;
                ctx.fillRect(region.x + 1, region.y + 1, region.w - 2, region.h - 2);

                // Region name label
                ctx.fillStyle = '#ffffff';
                ctx.font = '600 11px Inter, system-ui, sans-serif';
                ctx.textAlign = 'left';
                const labelText = region.name;
                const labelWidth = ctx.measureText(labelText).width + 12;
                
                ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
                const labelX = region.x + 6;
                const labelY = region.y + 6;
                ctx.fillRect(labelX, labelY, labelWidth, 20);
                
                ctx.fillStyle = '#ffffff';
                ctx.fillText(labelText, labelX + 6, labelY + 14);

                // Selected region resize handles
                if (isSelected) {
                    const handleSize = 6;
                    ctx.fillStyle = '#ffffff';
                    ctx.strokeStyle = borderColor;
                    ctx.lineWidth = 1.5;
                    const handles = [
                        [region.x - handleSize/2, region.y - handleSize/2],
                        [region.x + region.w - handleSize/2, region.y - handleSize/2],
                        [region.x - handleSize/2, region.y + region.h - handleSize/2],
                        [region.x + region.w - handleSize/2, region.y + region.h - handleSize/2],
                    ];
                    handles.forEach(([hx, hy]) => {
                        ctx.fillRect(hx, hy, handleSize, handleSize);
                        ctx.strokeRect(hx, hy, handleSize, handleSize);
                    });
                }

                // Draw similarity indicator
                if (colorDet && colorDet.enabled && hasVideoFeed) {
                    ctx.fillStyle = isMatching ? '#22c55e' : '#ffffff';
                    ctx.font = '600 10px Inter, system-ui, sans-serif';
                    ctx.textAlign = 'left';
                    ctx.fillText(`${colorSimilarity}%`, region.x + 6, region.y + region.h - 8);
                } else if (changeDet && changeDet.enabled && hasVideoFeed) {
                    ctx.fillStyle = changeTriggered ? '#10b981' : '#ffffff';
                    ctx.font = '600 10px Inter, system-ui, sans-serif';
                    ctx.textAlign = 'left';
                    ctx.fillText(`${changePercent}%`, region.x + 6, region.y + region.h - 8);
                } else if (jigDet && jigDet.enabled && hasVideoFeed) {
                    ctx.fillStyle = '#a855f7';
                    ctx.font = '600 10px Inter, system-ui, sans-serif';
                    ctx.textAlign = 'left';
                    ctx.fillText(`Jig ID: ${jigDet.markerId ?? 0}`, region.x + 6, region.y + region.h - 8);
                } else if (ocrDet && ocrDet.enabled && hasVideoFeed) {
                    ctx.fillStyle = '#ec4899';
                    ctx.font = '600 10px Inter, system-ui, sans-serif';
                    ctx.textAlign = 'left';
                    ctx.fillText(`OCR Active`, region.x + 6, region.y + region.h - 8);
                } else if (dimDet && dimDet.enabled && hasVideoFeed) {
                    const isPass = region.lastPassStatus ?? false;
                    ctx.fillStyle = isPass ? '#10b981' : '#ef4444';
                    ctx.font = '700 10px Inter, system-ui, sans-serif';
                    ctx.textAlign = 'left';
                    const mode = dimDet.measureMode || 'Width';
                    const val = region.measuredValue !== undefined ? region.measuredValue : 0;
                    ctx.fillText(`${mode}: ${val} ${dimDet.unit ?? 'mm'} (${isPass ? 'PASS' : 'FAIL'})`, region.x + 6, region.y + region.h - 8);
                }
            });

            // 3. Draw currently drawing region box
            if (isDrawing) {
                const dx = drawStart.x;
                const dy = drawStart.y;
                const dw = drawCurrent.x - drawStart.x;
                const dh = drawCurrent.y - drawStart.y;
                ctx.strokeStyle = '#0ea5e9';
                ctx.lineWidth = 1.5;
                ctx.setLineDash([6, 4]);
                ctx.strokeRect(dx, dy, dw, dh);
                ctx.setLineDash([]);
                // Preview corner markers
                if (Math.abs(dw) > 20 && Math.abs(dh) > 20) {
                    const cx = Math.min(dx, dx + dw);
                    const cy = Math.min(dy, dy + dh);
                    const cw = Math.abs(dw);
                    const ch = Math.abs(dh);
                    drawCornerMarkers(ctx, cx, cy, cw, ch, '#0ea5e9', 10);
                }
            }

            animationFrameRef.current = requestAnimationFrame(render);
        };

        animationFrameRef.current = requestAnimationFrame(render);
        return () => {
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        };
    }, [regions, isDrawing, drawStart, drawCurrent, selectedRegionId, hasPermission, configureOffline, showGridOverlay, brightness, contrast]);

    // Toggle switch component
    const ToggleSwitch = ({ checked, onChange, size = 'normal' }) => {
        const w = size === 'small' ? 32 : 38;
        const h = size === 'small' ? 16 : 20;
        const dot = size === 'small' ? 12 : 16;
        return (
            <label style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }} onClick={(e) => e.stopPropagation()}>
                <input type="checkbox" checked={checked} onChange={onChange} style={{ display: 'none' }} />
                <div style={{
                    width: `${w}px`, height: `${h}px`,
                    backgroundColor: checked ? '#3b82f6' : '#cbd5e1',
                    borderRadius: `${h/2}px`, position: 'relative', transition: 'background-color 0.2s'
                }}>
                    <div style={{
                        width: `${dot}px`, height: `${dot}px`, backgroundColor: 'white', borderRadius: '50%',
                        position: 'absolute', top: `${(h - dot)/2}px`,
                        left: checked ? `${w - dot - (h - dot)/2}px` : `${(h - dot)/2}px`,
                        transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.15)'
                    }} />
                </div>
            </label>
        );
    };

    return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#ffffff', fontFamily: 'Inter, system-ui, sans-serif' }}>
            {/* Tulip-style Breadcrumb Header */}
            <div style={{ padding: '16px 24px', borderBottom: '1px solid #e5e7eb' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                            <button
                                onClick={onBack}
                                style={{
                                    border: 'none', backgroundColor: 'transparent', color: '#6b7280',
                                    fontWeight: 500, fontSize: '0.85rem', cursor: 'pointer', padding: 0
                                }}
                            >
                                Camera Configurations
                            </button>
                            <span style={{ color: '#9ca3af', fontSize: '0.85rem' }}>/</span>
                            <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#111827' }}>{camera.name}</span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '2px' }}>
                            For {selectedStation} • {camera.cameraSource === 'IP_CAMERA' ? 'IP Camera' : camera.cameraSource === 'SCREEN_CAPTURE' ? 'Screen Capture' : 'USB Device'}
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <button style={{ 
                            width: '32px', height: '32px', border: '1px solid #e5e7eb', borderRadius: '6px', 
                            backgroundColor: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', 
                            justifyContent: 'center', color: '#6b7280', fontSize: '1.1rem' 
                        }}>
                            ···
                        </button>
                        <button 
                            onClick={onBack}
                            style={{ 
                                padding: '7px 14px', border: '1px solid #e5e7eb', borderRadius: '6px', 
                                backgroundColor: 'white', fontWeight: 600, fontSize: '0.8rem', color: '#374151', 
                                cursor: 'pointer' 
                            }}
                        >
                            Edit Assignment
                        </button>
                    </div>
                </div>
            </div>

            {/* Live View Toolbar */}
            <div style={{ padding: '10px 24px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fafafa' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#374151' }}>Live View</span>
                    <div style={{ width: '1px', height: '16px', backgroundColor: '#d1d5db' }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: hasPermission && !configureOffline ? '#22c55e' : '#9ca3af' }} />
                        <select
                            value={selectedStation}
                            onChange={(e) => setSelectedStation(e.target.value)}
                            style={{ 
                                padding: '4px 8px', borderRadius: '4px', border: '1px solid #d1d5db', 
                                fontSize: '0.8rem', fontWeight: 600, backgroundColor: 'white', cursor: 'pointer',
                                color: '#374151'
                            }}
                        >
                            {stations.length > 0 ? (
                                stations.map(s => (
                                    <option key={s.id} value={s.name || s.id}>{s.name || s.id}</option>
                                ))
                            ) : (
                                <>
                                    <option>Station A</option>
                                    <option>Station B</option>
                                    <option>Workstation 1</option>
                                    <option>Quality Inspection Bench</option>
                                </>
                            )}
                        </select>
                    </div>
                    <Info size={15} color="#9ca3af" style={{ cursor: 'pointer' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Settings size={14} color="#9ca3af" />
                    <span style={{ fontSize: '0.78rem', color: '#6b7280', fontWeight: 500 }}>Configure Offline</span>
                    <ToggleSwitch 
                        checked={configureOffline} 
                        onChange={(e) => setConfigureOffline(e.target.checked)} 
                        size="small"
                    />
                </div>
            </div>

            {/* Main workspace grid */}
            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 360px', minHeight: 0, overflow: 'hidden' }}>
                {/* Left: Camera Canvas + Thumbnail Strip + Activity Stream */}
                <div className="custom-scrollbar" style={{ flex: 1, backgroundColor: '#f8fafc', padding: '24px', overflowY: 'auto' }}>
                    <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '24px',
                        maxWidth: '100%',
                        width: '100%'
                    }}>
                        {/* Column 1: Camera Canvas & Region Thumbnail Strip */}
                        <div style={{
                            flex: '1.2 1 500px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '20px',
                            minWidth: 0
                        }}>
                            {/* Hidden video element */}
                            <video ref={videoRef} style={{ display: 'none' }} width="1280" height="720" playsInline muted />

                            {/* Camera Monitor Card */}
                            <div style={{
                                backgroundColor: '#ffffff',
                                borderRadius: '8px',
                                border: '1px solid #e2e8f0',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.02)',
                                display: 'flex',
                                flexDirection: 'column',
                                width: '100%',
                                overflow: 'hidden'
                            }}>
                                {/* Card Header */}
                                <div style={{
                                    padding: '12px 16px',
                                    borderBottom: '1px solid #e2e8f0',
                                    backgroundColor: '#fafafa',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={{
                                            width: '8px', height: '8px', borderRadius: '50%',
                                            backgroundColor: hasPermission && !configureOffline ? '#22c55e' : '#9ca3af',
                                            boxShadow: hasPermission && !configureOffline ? '0 0 8px #22c55e' : 'none'
                                        }} />
                                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#374151' }}>
                                            {camera.name}
                                        </span>
                                        <span style={{
                                            fontSize: '0.65rem',
                                            backgroundColor: '#eff6ff',
                                            color: '#2563eb',
                                            padding: '2px 6px',
                                            borderRadius: '4px',
                                            fontWeight: 600
                                        }}>
                                            {camera.cameraSource}
                                        </span>
                                    </div>
                                    <span style={{ fontSize: '0.72rem', color: '#6b7280', fontWeight: 500 }}>
                                        1280×720 @ 30 FPS
                                    </span>
                                </div>

                                {/* Card Body: Video and Sidebar side-by-side */}
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 240px',
                                    backgroundColor: '#ffffff',
                                    width: '100%',
                                }}>
                                    {/* Left: Camera Screen Feed Area */}
                                    <div style={{
                                        position: 'relative',
                                        backgroundColor: '#111827',
                                        width: '100%',
                                        aspectRatio: '4 / 3',
                                        cursor: isDragging ? 'grabbing' : 'crosshair'
                                    }}
                                    onMouseDown={handleMouseDown}
                                    onMouseMove={handleMouseMove}
                                    onMouseUp={handleMouseUp}
                                    >
                                        {/* Camera loading indicator */}
                                        {cameraLoading && !configureOffline && (
                                            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 5, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                                <Loader2 size={24} color="#60a5fa" style={{ animation: 'spin 1s linear infinite' }} />
                                                <span style={{ color: '#9ca3af', fontSize: '0.75rem' }}>Connecting stream...</span>
                                            </div>
                                        )}

                                        <canvas
                                            ref={canvasRef}
                                            width="640"
                                            height="480"
                                            style={{ display: 'block', width: '100%', height: '100%', objectFit: 'contain' }}
                                        />
                                    </div>

                                    {/* Right: Sidebar controls */}
                                    <div style={{
                                        borderLeft: '1px solid #e2e8f0',
                                        backgroundColor: '#ffffff',
                                        padding: '16px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '16px',
                                        justifyContent: 'space-between'
                                    }}>
                                        {/* Top portion of sidebar */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                            <div style={{ fontSize: '0.72rem', color: '#6b7280', display: 'flex', alignItems: 'flex-start', gap: '4px', lineHeight: '1.4' }}>
                                                <Info size={14} color="#9ca3af" style={{ flexShrink: 0, marginTop: '1px' }} />
                                                <span>Drag on canvas to define active monitoring regions.</span>
                                            </div>

                                            {/* Action Buttons */}
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button
                                                    onClick={() => setShowGridOverlay(!showGridOverlay)}
                                                    style={{
                                                        flex: 1,
                                                        padding: '6px 10px',
                                                        borderRadius: '6px',
                                                        border: showGridOverlay ? '1px solid #3b82f6' : '1px solid #e2e8f0',
                                                        backgroundColor: showGridOverlay ? '#eff6ff' : '#ffffff',
                                                        color: showGridOverlay ? '#2563eb' : '#374151',
                                                        fontSize: '0.75rem',
                                                        fontWeight: 600,
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        gap: '4px',
                                                        transition: 'all 0.15s'
                                                    }}
                                                    title="Toggle Calibration Grid"
                                                >
                                                    <Grid size={13} />
                                                    Grid
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        if (confirm('Are you sure you want to clear all regions?')) {
                                                            setRegionsByCamera(prev => ({ ...prev, [camera.id]: [] }));
                                                            setSelectedRegionId(null);
                                                        }
                                                    }}
                                                    style={{
                                                        flex: 1,
                                                        padding: '6px 10px',
                                                        borderRadius: '6px',
                                                        border: '1px solid #e2e8f0',
                                                        backgroundColor: '#ffffff',
                                                        color: '#ef4444',
                                                        fontSize: '0.75rem',
                                                        fontWeight: 600,
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        gap: '4px',
                                                        transition: 'all 0.15s'
                                                    }}
                                                    title="Clear all configured regions"
                                                >
                                                    <Trash2 size={13} />
                                                    Clear
                                                </button>
                                            </div>
                                        </div>

                                        {/* Bottom portion of sidebar (Sliders) */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span style={{ fontSize: '0.72rem', color: '#6b7280', fontWeight: 600 }}>Brightness</span>
                                                    <span style={{ fontSize: '0.72rem', color: '#374151', fontWeight: 700 }}>{brightness}%</span>
                                                </div>
                                                <input
                                                    type="range"
                                                    min="50"
                                                    max="150"
                                                    value={brightness}
                                                    onChange={(e) => setBrightness(Number(e.target.value))}
                                                    style={{ width: '100%', height: '4px', cursor: 'pointer' }}
                                                />
                                            </div>

                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span style={{ fontSize: '0.72rem', color: '#6b7280', fontWeight: 600 }}>Contrast</span>
                                                    <span style={{ fontSize: '0.72rem', color: '#374151', fontWeight: 700 }}>{contrast}%</span>
                                                </div>
                                                <input
                                                    type="range"
                                                    min="50"
                                                    max="150"
                                                    value={contrast}
                                                    onChange={(e) => setContrast(Number(e.target.value))}
                                                    style={{ width: '100%', height: '4px', cursor: 'pointer' }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Region Thumbnail Strip (Tulip-style inside slate dashboard) */}
                            {regions.length > 0 && (
                                <div style={{ 
                                    backgroundColor: '#ffffff',
                                    borderRadius: '8px',
                                    border: '1px solid #e2e8f0',
                                    padding: '12px 16px',
                                    display: 'flex', gap: '8px', 
                                    alignItems: 'center', justifyContent: 'center', flexWrap: 'nowrap',
                                    overflowX: 'auto',
                                    width: '100%'
                                }}>
                                    {[...regions].reverse().map((region, idx) => {
                                        const isActive = region.id === selectedRegionId;
                                        const regionNum = regions.length - idx;
                                        return (
                                            <div
                                                key={region.id}
                                                onClick={() => setSelectedRegionId(region.id)}
                                                style={{
                                                    width: '56px', height: '48px', borderRadius: '6px', cursor: 'pointer',
                                                    border: isActive ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                                                    backgroundColor: isActive ? 'rgba(59,130,246,0.05)' : '#ffffff',
                                                    position: 'relative', overflow: 'hidden', flexShrink: 0,
                                                    transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                }}
                                            >
                                                {/* Region number badge */}
                                                <div style={{
                                                    position: 'absolute', top: '3px', left: '3px',
                                                    width: '16px', height: '16px', borderRadius: '50%',
                                                    backgroundColor: isActive ? '#3b82f6' : '#94a3b8',
                                                    color: '#ffffff', fontSize: '0.58rem', fontWeight: 800,
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                }}>
                                                    {regionNum}
                                                </div>
                                                {/* Mini region preview icon */}
                                                <Maximize size={12} color={isActive ? '#3b82f6' : '#94a3b8'} />
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Column 2: Real-time Detection Activity Log Table */}
                        <div style={{
                            flex: '0.8 1 360px',
                            display: 'flex',
                            flexDirection: 'column',
                            minWidth: 0
                        }}>
                            <div style={{
                                backgroundColor: '#ffffff',
                                borderRadius: '8px',
                                border: '1px solid #e2e8f0',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.02)',
                                display: 'flex',
                                flexDirection: 'column',
                                width: '100%',
                                flex: 1,
                                minHeight: '360px',
                                overflow: 'hidden'
                            }}>
                                {/* Header */}
                                <div style={{
                                    padding: '10px 16px',
                                    borderBottom: '1px solid #e2e8f0',
                                    backgroundColor: '#fafafa',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Activity size={15} color="#3b82f6" />
                                        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#374151' }}>
                                            Real-time Detection Activity Stream
                                        </span>
                                    </div>
                                    <span style={{ fontSize: '0.65rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                                        <span style={{
                                            width: '6px', height: '6px', borderRadius: '50%',
                                            backgroundColor: '#10b981', display: 'inline-block',
                                            boxShadow: '0 0 6px #10b981'
                                        }} />
                                        LIVE FEED
                                    </span>
                                </div>

                                {/* Table content */}
                                <div style={{ flex: 1, overflowY: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem', textAlign: 'left' }}>
                                        <thead>
                                            <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', backgroundColor: '#f8fafc' }}>
                                                <th style={{ padding: '8px 12px', fontWeight: 600 }}>Time</th>
                                                <th style={{ padding: '8px 12px', fontWeight: 600 }}>Region</th>
                                                <th style={{ padding: '8px 12px', fontWeight: 600 }}>Detector</th>
                                                <th style={{ padding: '8px 12px', fontWeight: 600 }}>Value</th>
                                                <th style={{ padding: '8px 12px', fontWeight: 600 }}>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {activityLogs.length === 0 ? (
                                                <tr>
                                                    <td colSpan={5} style={{ padding: '24px 12px', textAlign: 'center', color: '#94a3b8' }}>
                                                        No detection events recorded. Adjust region boundaries or trigger states to update logs.
                                                    </td>
                                                </tr>
                                            ) : (
                                                activityLogs.map((log) => {
                                                    const isMatch = log.status === 'MATCH' || log.status === 'TRIGGERED' || log.status === 'ACTIVE';
                                                    return (
                                                        <tr key={log.id} style={{ borderBottom: '1px solid #f1f5f9', color: '#334155' }}>
                                                            <td style={{ padding: '8px 12px', color: '#64748b', width: '90px' }}>{log.time}</td>
                                                            <td style={{ padding: '8px 12px', fontWeight: 600 }}>{log.regionName}</td>
                                                            <td style={{ padding: '8px 12px' }}>
                                                                <span style={{
                                                                    padding: '2px 6px',
                                                                    borderRadius: '4px',
                                                                    fontSize: '0.65rem',
                                                                    fontWeight: 600,
                                                                    backgroundColor: log.detectorType === 'Color' ? '#eff6ff' : log.detectorType === 'Change' ? '#f0fdf4' : '#f1f5f9',
                                                                    color: log.detectorType === 'Color' ? '#2563eb' : log.detectorType === 'Change' ? '#16a34a' : '#475569'
                                                                }}>
                                                                    {log.detectorType}
                                                                </span>
                                                            </td>
                                                            <td style={{ padding: '8px 12px', fontFamily: 'monospace', color: '#475569' }}>{log.value}</td>
                                                            <td style={{ padding: '8px 12px' }}>
                                                                <span style={{
                                                                    display: 'inline-flex',
                                                                    alignItems: 'center',
                                                                    gap: '4px',
                                                                    fontWeight: 700,
                                                                    color: isMatch ? '#16a34a' : '#ef4444'
                                                                }}>
                                                                    <span style={{
                                                                        width: '6px',
                                                                        height: '6px',
                                                                        borderRadius: '50%',
                                                                        backgroundColor: isMatch ? '#22c55e' : '#ef4444'
                                                                    }} />
                                                                    {log.status}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Tulip-style Region Configuration Panel */}
                <div style={{ borderLeft: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', overflow: 'hidden', backgroundColor: '#ffffff' }}>
                    {!selectedRegion ? (
                        /* Empty state — Tulip-style */
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 32px', textAlign: 'center' }}>
                            <div style={{ 
                                width: '72px', height: '72px', border: '2px dashed #d1d5db', borderRadius: '12px', 
                                display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', color: '#d1d5db' 
                            }}>
                                <Maximize size={28} />
                            </div>
                            <h3 style={{ margin: '0 0 8px 0', fontSize: '0.95rem', fontWeight: 700, color: '#111827' }}>No region has been created</h3>
                            <p style={{ margin: 0, fontSize: '0.8rem', color: '#6b7280', lineHeight: 1.5, maxWidth: '240px' }}>
                                Regions are areas of interests within which events such as color change can be detected. Drag anywhere on the Live Station View to create a new region. <a href="#learn" style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: 600 }}>Learn more</a>
                            </p>
                        </div>
                    ) : (
                        /* Tulip-style Region configuration panel */
                        <div className="custom-scrollbar" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
                            {/* Region configuration header */}
                            <div style={{ padding: '14px 20px', borderBottom: '1px solid #e5e7eb', backgroundColor: '#fafafa' }}>
                                <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Region configuration</span>
                            </div>

                            {/* Region name row */}
                            <div style={{ padding: '14px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontSize: '0.78rem', color: '#6b7280', fontWeight: 500 }}>Name:</span>
                                    <input
                                        type="text"
                                        value={selectedRegion.name}
                                        onChange={(e) => updateRegionName(selectedRegion.id, e.target.value)}
                                        style={{ 
                                            border: 'none', outline: 'none', padding: '2px 0', fontSize: '0.88rem', 
                                            fontWeight: 700, color: '#111827', backgroundColor: 'transparent', width: '100%' 
                                        }}
                                        onFocus={(e) => e.target.style.borderBottom = '1.5px solid #3b82f6'}
                                        onBlur={(e) => e.target.style.borderBottom = 'none'}
                                    />
                                </div>
                                <button
                                    onClick={() => deleteRegion(selectedRegion.id)}
                                    style={{ 
                                        border: 'none', backgroundColor: 'transparent', padding: '4px', 
                                        cursor: 'pointer', color: '#9ca3af', display: 'flex', alignItems: 'center' 
                                    }}
                                    title="More options"
                                >
                                    ···
                                </button>
                            </div>

                            {/* Detectors header */}
                            {/* Detectors header */}
                            <div style={{ padding: '14px 20px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#374151' }}>Detectors</span>
                                <a
                                    href="#create"
                                    onClick={handleCreateDetector}
                                    style={{ fontSize: '0.78rem', color: '#3b82f6', fontWeight: 600, textDecoration: 'none' }}
                                >
                                    Create Detector
                                </a>

                                {/* Create Detector Modal */}
                                {showDetectorSelector && (
                                    <div style={{
                                        position: 'fixed', inset: 0, zIndex: 1000,
                                        backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        padding: '20px'
                                    }}>
                                        <div style={{
                                            backgroundColor: '#ffffff', borderRadius: '16px', width: '100%', maxWidth: '480px',
                                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden',
                                            border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column'
                                        }}>
                                            {/* Modal Header */}
                                            <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div>
                                                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#1e293b' }}>Add Detector</h3>
                                                    <p style={{ margin: '4px 0 0 0', fontSize: '0.75rem', color: '#64748b' }}>Select a visual intelligence tool to add to this region.</p>
                                                </div>
                                                <button
                                                    onClick={() => setShowDetectorSelector(false)}
                                                    style={{ border: 'none', backgroundColor: 'transparent', color: '#94a3b8', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
                                                >
                                                    <X size={18} />
                                                </button>
                                            </div>

                                            {/* Modal Body: Detector Types List */}
                                            <div style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '400px', overflowY: 'auto' }}>
                                                {[
                                                    { key: 'colorDetector', name: 'Color Detector', desc: 'Identifies and monitors specific target colors in the region.', color: '#3b82f6', icon: Sparkles },
                                                    { key: 'changeDetector', name: 'Change Detector', desc: 'Detects visual movement, intrusion, or state change.', color: '#10b981', icon: Activity },
                                                    { key: 'jigDetector', name: 'Jig Detector', desc: 'Tracks spatial tags, alignment pins, or custom fixtures.', color: '#a855f7', icon: Box },
                                                    { key: 'ocrDetector', name: 'OCR Detector', desc: 'Extracts alpha-numeric serials, numbers, or text barcodes.', color: '#ec4899', icon: Eye },
                                                    { key: 'dimensionDetector', name: 'Dimension Detector', desc: 'Measures height, width, area, or contours in millimeters.', color: '#14b8a6', icon: Maximize }
                                                ].map(opt => {
                                                    const isEnabled = selectedRegion.detectors?.[opt.key]?.enabled;
                                                    const IconComp = opt.icon;
                                                    return (
                                                        <div
                                                            key={opt.key}
                                                            onClick={() => {
                                                                if (!isEnabled) {
                                                                    toggleDetector(selectedRegion.id, opt.key, true);
                                                                    // Auto expand newly added detector
                                                                    if (opt.key === 'colorDetector') setColorDetectorExpanded(true);
                                                                    if (opt.key === 'changeDetector') setChangeDetectorExpanded(true);
                                                                    if (opt.key === 'jigDetector') setJigDetectorExpanded(true);
                                                                    if (opt.key === 'ocrDetector') setOcrDetectorExpanded(true);
                                                                    if (opt.key === 'dimensionDetector') setDimensionDetectorExpanded(true);
                                                                    setShowDetectorSelector(false);
                                                                }
                                                            }}
                                                            style={{
                                                                display: 'flex', gap: '16px', padding: '14px', borderRadius: '10px',
                                                                border: '1.5px solid ' + (isEnabled ? '#e2e8f0' : '#f1f5f9'),
                                                                backgroundColor: isEnabled ? '#f8fafc' : '#ffffff',
                                                                cursor: isEnabled ? 'not-allowed' : 'pointer',
                                                                transition: 'all 0.15s',
                                                                opacity: isEnabled ? 0.6 : 1,
                                                                boxShadow: isEnabled ? 'none' : '0 1px 2px rgba(0,0,0,0.02)',
                                                                textAlign: 'left'
                                                            }}
                                                            onMouseEnter={(e) => {
                                                                if (!isEnabled) {
                                                                    e.currentTarget.style.borderColor = '#3b82f6';
                                                                    e.currentTarget.style.backgroundColor = '#f8fafc';
                                                                }
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                if (!isEnabled) {
                                                                    e.currentTarget.style.borderColor = '#f1f5f9';
                                                                    e.currentTarget.style.backgroundColor = '#ffffff';
                                                                }
                                                            }}
                                                        >
                                                            <div style={{
                                                                width: '36px', height: '36px', borderRadius: '8px',
                                                                backgroundColor: isEnabled ? '#e2e8f0' : `${opt.color}15`,
                                                                display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center',
                                                                color: isEnabled ? '#94a3b8' : opt.color, flexShrink: 0
                                                            }}>
                                                                <IconComp size={18} />
                                                            </div>
                                                            <div style={{ flex: 1 }}>
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                    <span style={{ fontSize: '0.82rem', fontWeight: 800, color: isEnabled ? '#94a3b8' : '#1e293b' }}>
                                                                        {opt.name}
                                                                    </span>
                                                                    {isEnabled && (
                                                                        <span style={{ fontSize: '0.65rem', backgroundColor: '#e2e8f0', color: '#64748b', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                                                                            Active
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <p style={{ margin: '4px 0 0 0', fontSize: '0.7rem', color: '#64748b', lineHeight: 1.4 }}>
                                                                    {opt.desc}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            {/* Modal Footer */}
                                            <div style={{ padding: '16px 24px', backgroundColor: '#f8fafc', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end' }}>
                                                <button
                                                    onClick={() => setShowDetectorSelector(false)}
                                                    style={{
                                                        padding: '8px 16px', borderRadius: '6px', border: '1px solid #d1d5db',
                                                        backgroundColor: '#ffffff', color: '#374151', fontSize: '0.78rem',
                                                        fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s'
                                                    }}
                                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ffffff'}
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Active Detectors List */}
                            <div style={{ padding: '0 0 100px 0' }}>
                                {!(selectedRegion.detectors?.colorDetector?.enabled ||
                                   selectedRegion.detectors?.changeDetector?.enabled ||
                                   selectedRegion.detectors?.jigDetector?.enabled ||
                                   selectedRegion.detectors?.ocrDetector?.enabled ||
                                   selectedRegion.detectors?.dimensionDetector?.enabled) ? (
                                    <div style={{ padding: '36px 20px', textAlign: 'center', color: '#94a3b8', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                                        <Info size={20} color="#cbd5e1" />
                                        <span>No active detectors configured.</span>
                                        <button
                                            onClick={() => setShowDetectorSelector(true)}
                                            style={{
                                                marginTop: '4px', padding: '6px 14px', borderRadius: '6px',
                                                border: '1px solid #3b82f6', color: '#3b82f6', backgroundColor: '#ffffff',
                                                fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s'
                                            }}
                                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#eff6ff'; }}
                                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#ffffff'; }}
                                        >
                                            + Add Detector
                                        </button>
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        {/* 1. Color Detector */}
                                        {selectedRegion.detectors?.colorDetector?.enabled && (
                                            <div style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                <div 
                                                    style={{ 
                                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                                                        padding: '12px 20px', cursor: 'pointer', transition: 'background-color 0.15s',
                                                        backgroundColor: colorDetectorExpanded ? '#f8fafc' : 'transparent'
                                                    }}
                                                    onClick={() => setColorDetectorExpanded(prev => !prev)}
                                                >
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                        {colorDetectorExpanded ? <ChevronDown size={14} color="#64748b" /> : <ChevronDown size={14} color="#64748b" style={{ transform: 'rotate(-90deg)', transition: 'transform 0.15s' }} />}
                                                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#3b82f6' }} />
                                                        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>
                                                            {selectedRegion.detectors.colorDetector.name || `${selectedRegion.name} Color`}
                                                        </span>
                                                    </div>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (confirm('Remove Color Detector from this region?')) {
                                                                toggleDetector(selectedRegion.id, 'colorDetector', false);
                                                            }
                                                        }}
                                                        style={{ border: 'none', backgroundColor: 'transparent', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center', padding: '4px', borderRadius: '4px', transition: 'all 0.15s' }}
                                                        title="Remove Detector"
                                                        onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                                                        onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>

                                                {colorDetectorExpanded && (
                                                    <div style={{ padding: '12px 20px 18px 44px', display: 'flex', flexDirection: 'column', gap: '14px', backgroundColor: '#f8fafc' }}>
                                                        {/* Begin threshold */}
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>Begin Color detection threshold</span>
                                                            </div>
                                                            <input
                                                                type="number" min="0" max="100"
                                                                value={selectedRegion.detectors.colorDetector.beginThreshold}
                                                                onChange={(e) => updateRegionThresholds(selectedRegion.id, Number(e.target.value), selectedRegion.detectors.colorDetector.endThreshold)}
                                                                style={{ padding: '7px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.82rem', width: '100%', outline: 'none' }}
                                                            />
                                                        </div>

                                                        {/* End threshold */}
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>End Color detection threshold</span>
                                                            </div>
                                                            <input
                                                                type="number" min="0" max="100"
                                                                value={selectedRegion.detectors.colorDetector.endThreshold}
                                                                onChange={(e) => updateRegionThresholds(selectedRegion.id, selectedRegion.detectors.colorDetector.beginThreshold, Number(e.target.value))}
                                                                style={{ padding: '7px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.82rem', width: '100%', outline: 'none' }}
                                                            />
                                                        </div>

                                                        {/* Target color */}
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
                                                            <div style={{ 
                                                                width: '32px', height: '32px', borderRadius: '6px', 
                                                                border: '1.5px solid #cbd5e1', backgroundColor: selectedRegion.detectors.colorDetector.targetColor,
                                                                position: 'relative', overflow: 'hidden', cursor: 'pointer',
                                                                boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                                            }}>
                                                                <input
                                                                    type="color"
                                                                    value={selectedRegion.detectors.colorDetector.targetColor}
                                                                    onChange={(e) => updateRegionTargetColor(selectedRegion.id, e.target.value)}
                                                                    style={{ position: 'absolute', inset: 0, opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }}
                                                                />
                                                            </div>
                                                            <button
                                                                onClick={handleSetCurrentRegionColor}
                                                                style={{
                                                                    padding: '6px 12px', border: '1px solid #cbd5e1', borderRadius: '6px',
                                                                    backgroundColor: 'white', color: '#374151', fontWeight: 600,
                                                                    fontSize: '0.75rem', cursor: 'pointer'
                                                                }}
                                                            >
                                                                Set current region color
                                                            </button>
                                                        </div>

                                                        {/* Live Similarity */}
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', backgroundColor: '#e0f2fe', border: '1px solid #bae6fd', borderRadius: '6px' }}>
                                                            <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#0369a1' }}>Current Similarity</span>
                                                            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0369a1' }}>{settingsSimilarity}%</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* 2. Change Detector */}
                                        {selectedRegion.detectors?.changeDetector?.enabled && (
                                            <div style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                <div 
                                                    style={{ 
                                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                                                        padding: '12px 20px', cursor: 'pointer', transition: 'background-color 0.15s',
                                                        backgroundColor: changeDetectorExpanded ? '#f8fafc' : 'transparent'
                                                    }}
                                                    onClick={() => setChangeDetectorExpanded(prev => !prev)}
                                                >
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                        {changeDetectorExpanded ? <ChevronDown size={14} color="#64748b" /> : <ChevronDown size={14} color="#64748b" style={{ transform: 'rotate(-90deg)', transition: 'transform 0.15s' }} />}
                                                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }} />
                                                        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>
                                                            {selectedRegion.detectors.changeDetector.name || `${selectedRegion.name} Change`}
                                                        </span>
                                                    </div>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (confirm('Remove Change Detector from this region?')) {
                                                                toggleDetector(selectedRegion.id, 'changeDetector', false);
                                                            }
                                                        }}
                                                        style={{ border: 'none', backgroundColor: 'transparent', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center', padding: '4px', borderRadius: '4px', transition: 'all 0.15s' }}
                                                        title="Remove Detector"
                                                        onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                                                        onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>

                                                {changeDetectorExpanded && (
                                                    <div style={{ padding: '12px 20px 18px 44px', display: 'flex', flexDirection: 'column', gap: '14px', backgroundColor: '#f8fafc' }}>
                                                        {/* Begin changes threshold */}
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>Begin changes threshold (% of region area)</span>
                                                            <input
                                                                type="number" min="0" max="100"
                                                                value={selectedRegion.detectors.changeDetector.beginThreshold ?? 40}
                                                                onChange={(e) => updateChangeDetectorSetting(selectedRegion.id, 'beginThreshold', Number(e.target.value))}
                                                                style={{ padding: '7px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.82rem', width: '100%', outline: 'none' }}
                                                            />
                                                        </div>

                                                        {/* Upper threshold */}
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>Upper threshold (mm)</span>
                                                            <input
                                                                type="number"
                                                                value={selectedRegion.detectors.changeDetector.upperThreshold ?? 100}
                                                                onChange={(e) => updateChangeDetectorSetting(selectedRegion.id, 'upperThreshold', Number(e.target.value))}
                                                                style={{ padding: '7px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.82rem', width: '100%', outline: 'none' }}
                                                            />
                                                        </div>

                                                        {/* Lower threshold */}
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>Lower threshold (mm)</span>
                                                            <input
                                                                type="number"
                                                                value={selectedRegion.detectors.changeDetector.lowerThreshold ?? 10}
                                                                onChange={(e) => updateChangeDetectorSetting(selectedRegion.id, 'lowerThreshold', Number(e.target.value))}
                                                                style={{ padding: '7px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.82rem', width: '100%', outline: 'none' }}
                                                            />
                                                        </div>

                                                        {/* Adaptation speed */}
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>Adaptation speed</span>
                                                            <select
                                                                value={selectedRegion.detectors.changeDetector.adaptationSpeed ?? 'Medium'}
                                                                onChange={(e) => updateChangeDetectorSetting(selectedRegion.id, 'adaptationSpeed', e.target.value)}
                                                                style={{ padding: '7px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.82rem', backgroundColor: 'white', width: '100%', outline: 'none' }}
                                                            >
                                                                <option value="None">None</option>
                                                                <option value="Slow">Slow</option>
                                                                <option value="Medium">Medium</option>
                                                                <option value="Fast">Fast</option>
                                                            </select>
                                                        </div>

                                                        {/* Reset when changes end */}
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <input
                                                                type="checkbox"
                                                                id="resetOnEnd"
                                                                checked={selectedRegion.detectors.changeDetector.resetOnEnd ?? true}
                                                                onChange={(e) => updateChangeDetectorSetting(selectedRegion.id, 'resetOnEnd', e.target.checked)}
                                                                style={{ width: '15px', height: '15px', cursor: 'pointer', accentColor: '#3b82f6' }}
                                                            />
                                                            <label htmlFor="resetOnEnd" style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', cursor: 'pointer' }}>
                                                                Reset when changes end
                                                            </label>
                                                        </div>

                                                        {/* Reset duration */}
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>Reset duration (s)</span>
                                                            <input
                                                                type="number" step="0.05"
                                                                value={selectedRegion.detectors.changeDetector.resetDuration ?? 0.50}
                                                                onChange={(e) => updateChangeDetectorSetting(selectedRegion.id, 'resetDuration', Number(e.target.value))}
                                                                style={{ padding: '7px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.82rem', width: '100%', outline: 'none' }}
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* 3. Jig Detector */}
                                        {selectedRegion.detectors?.jigDetector?.enabled && (
                                            <div style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                <div 
                                                    style={{ 
                                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                                                        padding: '12px 20px', cursor: 'pointer', transition: 'background-color 0.15s',
                                                        backgroundColor: jigDetectorExpanded ? '#f8fafc' : 'transparent'
                                                    }}
                                                    onClick={() => setJigDetectorExpanded(prev => !prev)}
                                                >
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                        {jigDetectorExpanded ? <ChevronDown size={14} color="#64748b" /> : <ChevronDown size={14} color="#64748b" style={{ transform: 'rotate(-90deg)', transition: 'transform 0.15s' }} />}
                                                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#a855f7' }} />
                                                        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>
                                                            {selectedRegion.detectors.jigDetector.name || `${selectedRegion.name} Jig`}
                                                        </span>
                                                    </div>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (confirm('Remove Jig Detector from this region?')) {
                                                                toggleDetector(selectedRegion.id, 'jigDetector', false);
                                                            }
                                                        }}
                                                        style={{ border: 'none', backgroundColor: 'transparent', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center', padding: '4px', borderRadius: '4px', transition: 'all 0.15s' }}
                                                        title="Remove Detector"
                                                        onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                                                        onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>

                                                {jigDetectorExpanded && (
                                                    <div style={{ padding: '12px 20px 18px 44px', display: 'flex', flexDirection: 'column', gap: '14px', backgroundColor: '#f8fafc' }}>
                                                        {/* Marker Type */}
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>Marker Type</span>
                                                            <select
                                                                value={selectedRegion.detectors.jigDetector.markerType || 'ArUco'}
                                                                onChange={(e) => updateJigDetectorSetting(selectedRegion.id, 'markerType', e.target.value)}
                                                                style={{ padding: '7px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.82rem', backgroundColor: 'white', width: '100%', outline: 'none' }}
                                                            >
                                                                <option value="ArUco">ArUco Marker</option>
                                                                <option value="AprilTag">AprilTag</option>
                                                                <option value="Custom Marker">Custom Marker</option>
                                                            </select>
                                                        </div>

                                                        {/* Marker ID */}
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>Marker ID</span>
                                                            <input
                                                                type="number" min="0"
                                                                value={selectedRegion.detectors.jigDetector.markerId ?? 0}
                                                                onChange={(e) => updateJigDetectorSetting(selectedRegion.id, 'markerId', Number(e.target.value))}
                                                                style={{ padding: '7px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.82rem', width: '100%', outline: 'none' }}
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* 4. OCR Detector */}
                                        {selectedRegion.detectors?.ocrDetector?.enabled && (
                                            <div style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                <div 
                                                    style={{ 
                                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                                                        padding: '12px 20px', cursor: 'pointer', transition: 'background-color 0.15s',
                                                        backgroundColor: ocrDetectorExpanded ? '#f8fafc' : 'transparent'
                                                    }}
                                                    onClick={() => setOcrDetectorExpanded(prev => !prev)}
                                                >
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                        {ocrDetectorExpanded ? <ChevronDown size={14} color="#64748b" /> : <ChevronDown size={14} color="#64748b" style={{ transform: 'rotate(-90deg)', transition: 'transform 0.15s' }} />}
                                                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ec4899' }} />
                                                        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>
                                                            {selectedRegion.detectors.ocrDetector.name || `${selectedRegion.name} OCR`}
                                                        </span>
                                                    </div>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (confirm('Remove OCR Detector from this region?')) {
                                                                toggleDetector(selectedRegion.id, 'ocrDetector', false);
                                                            }
                                                        }}
                                                        style={{ border: 'none', backgroundColor: 'transparent', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center', padding: '4px', borderRadius: '4px', transition: 'all 0.15s' }}
                                                        title="Remove Detector"
                                                        onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                                                        onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>

                                                {ocrDetectorExpanded && (
                                                    <div style={{ padding: '12px 20px 18px 44px', display: 'flex', flexDirection: 'column', gap: '14px', backgroundColor: '#f8fafc' }}>
                                                        {/* OCR Language */}
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>OCR Language</span>
                                                            <select
                                                                value={selectedRegion.detectors.ocrDetector.language || 'English'}
                                                                onChange={(e) => updateOcrDetectorSetting(selectedRegion.id, 'language', e.target.value)}
                                                                style={{ padding: '7px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.82rem', backgroundColor: 'white', width: '100%', outline: 'none' }}
                                                            >
                                                                <option value="English">English</option>
                                                                <option value="Spanish">Spanish</option>
                                                                <option value="Indonesian">Indonesian</option>
                                                                <option value="German">German</option>
                                                                <option value="French">French</option>
                                                            </select>
                                                        </div>

                                                        {/* Match Pattern */}
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>Match Validation Pattern (Regex)</span>
                                                            <input
                                                                type="text"
                                                                value={selectedRegion.detectors.ocrDetector.matchPattern || ''}
                                                                onChange={(e) => updateOcrDetectorSetting(selectedRegion.id, 'matchPattern', e.target.value)}
                                                                placeholder="e.g. [A-Z]{3}-\d{4}"
                                                                style={{ padding: '7px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.82rem', width: '100%', outline: 'none' }}
                                                            />
                                                        </div>

                                                        {/* Confidence Threshold */}
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>Confidence Threshold (%)</span>
                                                                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#3b82f6' }}>{selectedRegion.detectors.ocrDetector.confidenceThreshold ?? 80}%</span>
                                                            </div>
                                                            <input
                                                                type="range" min="10" max="100" step="5"
                                                                value={selectedRegion.detectors.ocrDetector.confidenceThreshold ?? 80}
                                                                onChange={(e) => updateOcrDetectorSetting(selectedRegion.id, 'confidenceThreshold', Number(e.target.value))}
                                                                style={{ height: '4px', cursor: 'pointer' }}
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* 5. Dimension Detector */}
                                        {selectedRegion.detectors?.dimensionDetector?.enabled && (
                                            <div style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                <div 
                                                    style={{ 
                                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                                                        padding: '12px 20px', cursor: 'pointer', transition: 'background-color 0.15s',
                                                        backgroundColor: dimensionDetectorExpanded ? '#f8fafc' : 'transparent'
                                                    }}
                                                    onClick={() => setDimensionDetectorExpanded(prev => !prev)}
                                                >
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                        {dimensionDetectorExpanded ? <ChevronDown size={14} color="#64748b" /> : <ChevronDown size={14} color="#64748b" style={{ transform: 'rotate(-90deg)', transition: 'transform 0.15s' }} />}
                                                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#14b8a6' }} />
                                                        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>
                                                            {selectedRegion.detectors.dimensionDetector.name || `${selectedRegion.name} Dimension`}
                                                        </span>
                                                    </div>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (confirm('Remove Dimension Detector from this region?')) {
                                                                toggleDetector(selectedRegion.id, 'dimensionDetector', false);
                                                            }
                                                        }}
                                                        style={{ border: 'none', backgroundColor: 'transparent', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center', padding: '4px', borderRadius: '4px', transition: 'all 0.15s' }}
                                                        title="Remove Detector"
                                                        onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                                                        onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>

                                                {dimensionDetectorExpanded && (
                                                    <div style={{ padding: '12px 20px 18px 44px', display: 'flex', flexDirection: 'column', gap: '14px', backgroundColor: '#f8fafc' }}>
                                                        {/* Current Measurement Value Preview */}
                                                        <div style={{
                                                            display: 'flex',
                                                            justifyContent: 'space-between',
                                                            alignItems: 'center',
                                                            padding: '8px 12px',
                                                            backgroundColor: selectedRegion.lastPassStatus ? '#f0fdf4' : '#fef2f2',
                                                            border: selectedRegion.lastPassStatus ? '1px solid #bbf7d0' : '1px solid #fecaca',
                                                            borderRadius: '6px',
                                                            marginBottom: '2px'
                                                        }}>
                                                            <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#475569' }}>Measured:</span>
                                                            <span style={{
                                                                fontSize: '0.82rem',
                                                                fontWeight: 800,
                                                                color: selectedRegion.lastPassStatus ? '#16a34a' : '#dc2626'
                                                            }}>
                                                                {selectedRegion.measuredValue !== undefined ? selectedRegion.measuredValue : 0} {selectedRegion.detectors.dimensionDetector.unit || 'mm'} ({selectedRegion.lastPassStatus ? 'PASS' : 'FAIL'})
                                                            </span>
                                                        </div>

                                                        {/* Reference Size */}
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>Calibration Reference Size (mm)</span>
                                                            <input
                                                                type="number" step="0.1" min="0.1"
                                                                value={selectedRegion.detectors.dimensionDetector.referenceSize ?? 20}
                                                                onChange={(e) => updateDimensionDetectorSetting(selectedRegion.id, 'referenceSize', Number(e.target.value))}
                                                                style={{ padding: '7px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.82rem', width: '100%', outline: 'none' }}
                                                            />
                                                        </div>

                                                        {/* Measure Mode */}
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>Measure Mode</span>
                                                            <select
                                                                value={selectedRegion.detectors.dimensionDetector.measureMode || 'Width'}
                                                                onChange={(e) => updateDimensionDetectorSetting(selectedRegion.id, 'measureMode', e.target.value)}
                                                                style={{ padding: '7px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.82rem', backgroundColor: 'white', width: '100%', outline: 'none' }}
                                                            >
                                                                <option value="Width">Width (Lebar)</option>
                                                                <option value="Height">Height (Tinggi)</option>
                                                                <option value="Diagonal">Diagonal</option>
                                                                <option value="Area">Area</option>
                                                            </select>
                                                        </div>

                                                        {/* Display Unit */}
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>Display Unit</span>
                                                            <select
                                                                value={selectedRegion.detectors.dimensionDetector.unit || 'mm'}
                                                                onChange={(e) => updateDimensionDetectorSetting(selectedRegion.id, 'unit', e.target.value)}
                                                                style={{ padding: '7px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.82rem', backgroundColor: 'white', width: '100%', outline: 'none' }}
                                                            >
                                                                <option value="mm">Millimeters (mm)</option>
                                                                <option value="px">Pixels (px)</option>
                                                                <option value="inch">Inches (in)</option>
                                                            </select>
                                                        </div>

                                                        {/* Min Contour Area */}
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>Min Contour Area (px²)</span>
                                                                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#3b82f6' }}>{selectedRegion.detectors.dimensionDetector.minArea ?? 100} px²</span>
                                                            </div>
                                                            <input
                                                                type="range" min="10" max="5000" step="50"
                                                                value={selectedRegion.detectors.dimensionDetector.minArea ?? 100}
                                                                onChange={(e) => updateDimensionDetectorSetting(selectedRegion.id, 'minArea', Number(e.target.value))}
                                                                style={{ height: '4px', cursor: 'pointer' }}
                                                            />
                                                        </div>

                                                        {/* Canny Threshold */}
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>Canny Edge Threshold</span>
                                                                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#3b82f6' }}>{selectedRegion.detectors.dimensionDetector.cannyThreshold ?? 100}</span>
                                                            </div>
                                                            <input
                                                                type="range" min="10" max="255" step="5"
                                                                value={selectedRegion.detectors.dimensionDetector.cannyThreshold ?? 100}
                                                                onChange={(e) => updateDimensionDetectorSetting(selectedRegion.id, 'cannyThreshold', Number(e.target.value))}
                                                                style={{ height: '4px', cursor: 'pointer' }}
                                                            />
                                                        </div>

                                                        {/* Specification Limits (LSL / USL) */}
                                                        <div style={{ display: 'flex', gap: '10px' }}>
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', flex: 1 }}>
                                                                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>Min Limit (LSL)</span>
                                                                <input
                                                                    type="number" step="0.05"
                                                                    value={selectedRegion.detectors.dimensionDetector.lsl ?? 19.5}
                                                                    onChange={(e) => updateDimensionDetectorSetting(selectedRegion.id, 'lsl', Number(e.target.value))}
                                                                    style={{ padding: '7px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.82rem', width: '100%', outline: 'none' }}
                                                                />
                                                            </div>
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', flex: 1 }}>
                                                                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>Max Limit (USL)</span>
                                                                <input
                                                                    type="number" step="0.05"
                                                                    value={selectedRegion.detectors.dimensionDetector.usl ?? 20.5}
                                                                    onChange={(e) => updateDimensionDetectorSetting(selectedRegion.id, 'usl', Number(e.target.value))}
                                                                    style={{ padding: '7px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.82rem', width: '100%', outline: 'none' }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default VisionManager;

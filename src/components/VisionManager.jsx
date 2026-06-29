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
    HelpCircle,
    Save
} from 'lucide-react';
import JSZip from 'jszip';
import toast from 'react-hot-toast';
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
                if (r.detectors.jigDetector?.enabled) activeDetectors.push('Jig Detector');
                if (r.detectors.ocrDetector?.enabled) activeDetectors.push('OCR Detector');
                if (r.detectors.dimensionDetector?.enabled) activeDetectors.push('Dimension Detector');
                if (r.detectors.aiDetector?.enabled) activeDetectors.push('AI Detector');
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

    // AI Models & Inspection Settings
    const [aiModels, setAiModels] = useState([]);
    const [isLoadingAiModels, setIsLoadingAiModels] = useState(false);
    const [aiDatasets, setAiDatasets] = useState([]);
    const [isLoadingAiDatasets, setIsLoadingAiDatasets] = useState(false);
    const [selectedDataset, setSelectedDataset] = useState('');
    const [newModelName, setNewModelName] = useState('');
    const [modelType, setModelType] = useState('anomaly'); // 'anomaly' | 'classification'
    const [epochs, setEpochs] = useState(1);
    const [classNamesInput, setClassNamesInput] = useState('ok, ng');
    const [isTraining, setIsTraining] = useState(false);
    const [trainingError, setTrainingError] = useState('');
    const [trainingSuccess, setTrainingSuccess] = useState('');

    // AI Inference Testing States
    const [testModel, setTestModel] = useState(null);
    const [testFile, setTestFile] = useState(null);
    const [testFilePreview, setTestFilePreview] = useState('');
    const [isTesting, setIsTesting] = useState(false);
    const [testResultImage, setTestResultImage] = useState('');
    const [testResultMeta, setTestResultMeta] = useState(null);
    const [testError, setTestError] = useState('');

    // Local backend dataset creation/uploading
    const [backendDatasetName, setBackendDatasetName] = useState('');
    const [uploadLabel, setUploadLabel] = useState('ok');
    const [uploadFiles, setUploadFiles] = useState([]);
    const [isUploadingFiles, setIsUploadingFiles] = useState(false);
    const [uploadStatus, setUploadStatus] = useState('');

    // MAVi-Style AI Studio States
    const [backendImages, setBackendImages] = useState([]);
    const [isLoadingBackendImages, setIsLoadingBackendImages] = useState(false);
    const [showPaintModal, setShowPaintModal] = useState(false);
    const [paintImage, setPaintImage] = useState(null);
    const [activeSuggestions, setActiveSuggestions] = useState([]);
    const [isActiveSelecting, setIsActiveSelecting] = useState(false);
    const [separationGraphData, setSeparationGraphData] = useState(null);
    const [isLoadingSeparationGraph, setIsLoadingSeparationGraph] = useState(false);

    const loadBackendImages = async (datasetName) => {
        if (!datasetName) return;
        setIsLoadingBackendImages(true);
        try {
            const res = await fetch(`http://localhost:8000/ai/dataset/get_images?dataset_name=${datasetName}`);
            const data = await res.json();
            if (data.success) {
                setBackendImages(data.images || []);
            } else {
                console.error('Failed to load backend images:', data.error);
            }
        } catch (err) {
            console.warn('Connection error loading backend images:', err);
        } finally {
            setIsLoadingBackendImages(false);
        }
    };

    const loadSeparationGraph = async (datasetName, modelName = 'default') => {
        if (!datasetName) return;
        setIsLoadingSeparationGraph(true);
        try {
            const res = await fetch(`http://localhost:8000/ai/dataset/separation_graph?dataset_name=${datasetName}&model_name=${modelName}`);
            const data = await res.json();
            if (data.success) {
                setSeparationGraphData(data);
            } else {
                console.error('Failed to load separation graph:', data.error);
            }
        } catch (err) {
            console.warn('Connection error loading separation graph:', err);
        } finally {
            setIsLoadingSeparationGraph(false);
        }
    };

    const handleActiveSelect = async (datasetName, modelName = 'default') => {
        if (!datasetName) return;
        setIsActiveSelecting(true);
        try {
            const res = await fetch(`http://localhost:8000/ai/dataset/active_select?dataset_name=${datasetName}&model_name=${modelName}`);
            const data = await res.json();
            if (data.success) {
                setActiveSuggestions(data.suggestions || []);
                const suggestionPaths = new Set(data.suggestions.map(s => s.relative_path));
                setBackendImages(prev => {
                    const sorted = [...prev].sort((a, b) => {
                        const aSuggested = suggestionPaths.has(a.relative_path);
                        const bSuggested = suggestionPaths.has(b.relative_path);
                        if (aSuggested && !bSuggested) return -1;
                        if (!aSuggested && bSuggested) return 1;
                        return 0;
                    });
                    return sorted;
                });
                alert(`AI Auto Image Selector: Prioritized ${data.suggestions.length} unannotated images with high model uncertainty!`);
            } else {
                alert(`Error: ${data.error}`);
            }
        } catch (err) {
            alert(`Connection error: ${err.message}`);
        } finally {
            setIsActiveSelecting(false);
        }
    };

    useEffect(() => {
        if (selectedDataset) {
            loadBackendImages(selectedDataset);
            loadSeparationGraph(selectedDataset);
        } else {
            setBackendImages([]);
            setSeparationGraphData(null);
        }
    }, [selectedDataset]);

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
        } else if (activeTab === 'ai_models') {
            loadAiModels();
            loadAiDatasets();
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

    const loadAiModels = async () => {
        setIsLoadingAiModels(true);
        try {
            const res = await fetch('http://localhost:8000/ai/model/list');
            const data = await res.json();
            if (data.success) {
                setAiModels(data.models || []);
            } else {
                console.error('Failed to load AI models:', data.error);
            }
        } catch (err) {
            console.error('Failed to connect to backend for AI models:', err);
        } finally {
            setIsLoadingAiModels(false);
        }
    };

    const loadAiDatasets = async () => {
        setIsLoadingAiDatasets(true);
        try {
            const res = await fetch('http://localhost:8000/ai/dataset/list');
            const data = await res.json();
            if (data.success) {
                setAiDatasets(data.datasets || []);
            } else {
                console.error('Failed to load AI datasets:', data.error);
            }
        } catch (err) {
            console.error('Failed to connect to backend for AI datasets:', err);
        } finally {
            setIsLoadingAiDatasets(false);
        }
    };

    const handleTrainModel = async () => {
        if (!newModelName.trim()) {
            alert('Please specify a model name.');
            return;
        }
        if (!selectedDataset) {
            alert('Please select a dataset.');
            return;
        }

        setIsTraining(true);
        setTrainingError('');
        setTrainingSuccess('');

        try {
            let res;
            if (modelType === 'anomaly') {
                res = await fetch('http://localhost:8000/ai/anomaly/train', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        model_name: newModelName.trim(),
                        dataset_name: selectedDataset,
                        epochs: Number(epochs)
                    })
                });
            } else if (modelType === 'classification') {
                const classes = classNamesInput.split(',').map(s => s.trim()).filter(Boolean);
                if (classes.length < 2) {
                    alert('Please specify at least 2 class names separated by comma.');
                    setIsTraining(false);
                    return;
                }
                res = await fetch('http://localhost:8000/ai/classify/train', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        model_name: newModelName.trim(),
                        dataset_name: selectedDataset,
                        class_names: classes
                    })
                });
            } else if (modelType === 'segmentation') {
                res = await fetch('http://localhost:8000/ai/segment/train', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        model_name: newModelName.trim(),
                        dataset_name: selectedDataset,
                        epochs: Number(epochs || 5)
                    })
                });
            } else {
                alert('Unknown model type');
                setIsTraining(false);
                return;
            }

            const data = await res.json();
            if (data.success) {
                setTrainingSuccess(`Model "${newModelName}" successfully trained!`);
                setNewModelName('');
                loadAiModels();
            } else {
                setTrainingError(data.error || 'Training failed.');
            }
        } catch (err) {
            setTrainingError(`Connection error: ${err.message}`);
        } finally {
            setIsTraining(false);
        }
    };

    const handleDeleteModel = async (type, name) => {
        if (!confirm(`Are you sure you want to delete the model "${name}" (${type})?`)) {
            return;
        }
        try {
            const formData = new FormData();
            formData.append('model_type', type);
            formData.append('model_name', name);

            const res = await fetch('http://localhost:8000/ai/model/delete', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            if (data.success) {
                alert('Model deleted successfully.');
                loadAiModels();
                if (testModel?.model_name === name && testModel?.model_type === type) {
                    setTestModel(null);
                }
            } else {
                alert(`Error deleting model: ${data.error}`);
            }
        } catch (err) {
            alert(`Error connecting to backend: ${err.message}`);
        }
    };

    const handleUploadDatasetFiles = async () => {
        const dsName = backendDatasetName.trim() || selectedDataset;
        if (!dsName) {
            alert('Please specify or select a dataset name.');
            return;
        }
        if (uploadFiles.length === 0) {
            alert('Please select files to upload.');
            return;
        }

        setIsUploadingFiles(true);
        setUploadStatus(`Uploading 0/${uploadFiles.length} files...`);

        try {
            let successCount = 0;
            for (let i = 0; i < uploadFiles.length; i++) {
                const file = uploadFiles[i];
                const formData = new FormData();
                formData.append('file', file);
                formData.append('dataset_name', dsName);
                formData.append('label', uploadLabel);

                setUploadStatus(`Uploading ${i + 1}/${uploadFiles.length}: ${file.name}...`);
                const res = await fetch('http://localhost:8000/ai/dataset/upload', {
                    method: 'POST',
                    body: formData
                });
                const data = await res.json();
                if (data.success) {
                    successCount++;
                }
            }
            setUploadStatus(`Successfully uploaded ${successCount} files to dataset "${dsName}" under label "${uploadLabel}"!`);
            setUploadFiles([]);
            loadAiDatasets();
            setSelectedDataset(dsName);
        } catch (err) {
            setUploadStatus(`Error uploading files: ${err.message}`);
        } finally {
            setIsUploadingFiles(false);
        }
    };

    const handleTestInference = async () => {
        if (!testModel) {
            alert('Please select a model to test.');
            return;
        }
        if (!testFile) {
            alert('Please select an image file to upload for testing.');
            return;
        }

        setIsTesting(true);
        setTestError('');
        setTestResultImage('');
        setTestResultMeta(null);

        try {
            const formData = new FormData();
            formData.append('file', testFile);
            formData.append('model_name', testModel.model_name);

            let endpoint = '';
            if (testModel.model_type === 'anomaly') {
                endpoint = 'http://localhost:8000/ai/anomaly/detect';
            } else if (testModel.model_type === 'segmentation') {
                endpoint = 'http://localhost:8000/ai/segment';
                formData.append('threshold', '0.5');
            } else if (testModel.model_type === 'classification') {
                endpoint = 'http://localhost:8000/ai/classify';
            } else {
                alert('Unknown model type');
                setIsTesting(false);
                return;
            }

            const res = await fetch(endpoint, {
                method: 'POST',
                body: formData
            });

            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || `HTTP ${res.status}`);
            }

            const isPassed = res.headers.get('X-Is-Passed') || res.headers.get('X-Is-Anomaly') === 'false';
            const calcVal = res.headers.get('X-Calculated-Value') || res.headers.get('X-Anomaly-Score') || '';
            const segmentMetaStr = res.headers.get('X-Segment-Result');
            const classifyMetaStr = res.headers.get('X-Classify-Result');
            const score = res.headers.get('X-Anomaly-Score');

            let meta = {
                isPassed: isPassed === 'true' || isPassed === true,
                calculatedValue: calcVal,
                anomalyScore: score
            };

            if (segmentMetaStr) {
                meta.segmentDetails = JSON.parse(segmentMetaStr);
            }
            if (classifyMetaStr) {
                meta.classifyDetails = JSON.parse(classifyMetaStr);
            }

            setTestResultMeta(meta);

            const blob = await res.blob();
            const imgUrl = URL.createObjectURL(blob);
            setTestResultImage(imgUrl);
        } catch (err) {
            setTestError(err.message || 'Error occurred during inference.');
        } finally {
            setIsTesting(false);
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
                    ipCameraUrl: c.url || '',
                    settings: settings
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
                if (r.detectors?.aiDetector?.enabled) activeDetectors.push('AI Detector');
            });
            const uniqueDets = [...new Set(activeDetectors)];
            if (uniqueDets.length === 0) uniqueDets.push('Change Detector');

            const payload = {
                id: target.id,
                name: target.name,
                url: target.ipCameraUrl || '',
                type: target.cameraSource || 'DEVICE',
                settings: {
                    ...(target.settings || {}),
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

        const savedCameraId = localStorage.getItem('mavi-selected-camera-id');
        const videoConstraints = savedCameraId 
            ? { width: { ideal: 640 }, height: { ideal: 480 }, deviceId: { exact: savedCameraId } }
            : { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'environment' };

        navigator.mediaDevices.getUserMedia({
            video: videoConstraints
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
        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', backgroundColor: '#f8fafc', fontFamily: 'Inter, system-ui, sans-serif' }}>
            {/* Main Header & Tab Navigation */}
            {!editingCameraConfig && (
                <div style={{ padding: '16px 20px 0 20px', backgroundColor: 'white', borderBottom: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900, color: '#0f172a' }}>Vision</h2>
                                <span style={{ backgroundColor: '#f1f5f9', color: '#1e293b', padding: '2px 8px', borderRadius: '10px', fontSize: '0.65rem', fontWeight: 700 }}>Active</span>
                            </div>
                            <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '0.8rem' }}>Configure cameras and manage visual inspection datasets.</p>
                        </div>
                    </div>

                    {/* Tab Selector Buttons */}
                    <div style={{ display: 'flex', gap: '20px' }}>
                        <button
                            onClick={() => setActiveTab('cameras')}
                            style={{
                                padding: '10px 4px', border: 'none', borderBottom: activeTab === 'cameras' ? '3px solid #3b82f6' : '3px solid transparent',
                                backgroundColor: 'transparent', color: activeTab === 'cameras' ? '#3b82f6' : '#64748b',
                                fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.15s'
                            }}
                        >
                            Camera Configurations
                        </button>
                        <button
                            onClick={() => setActiveTab('datasets')}
                            style={{
                                padding: '10px 4px', border: 'none', borderBottom: activeTab === 'datasets' ? '3px solid #3b82f6' : '3px solid transparent',
                                backgroundColor: 'transparent', color: activeTab === 'datasets' ? '#3b82f6' : '#64748b',
                                fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.15s'
                            }}
                        >
                            Visual Inspection Datasets
                        </button>
                        <button
                            onClick={() => setActiveTab('privacy')}
                            style={{
                                padding: '10px 4px', border: 'none', borderBottom: activeTab === 'privacy' ? '3px solid #3b82f6' : '3px solid transparent',
                                backgroundColor: 'transparent', color: activeTab === 'privacy' ? '#3b82f6' : '#64748b',
                                fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.15s'
                            }}
                        >
                            Vision & Privacy Settings
                        </button>
                        <button
                            onClick={() => setActiveTab('ai_models')}
                            style={{
                                padding: '10px 4px', border: 'none', borderBottom: activeTab === 'ai_models' ? '3px solid #3b82f6' : '3px solid transparent',
                                backgroundColor: 'transparent', color: activeTab === 'ai_models' ? '#3b82f6' : '#64748b',
                                fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.15s'
                            }}
                        >
                            AI Models & Inspection
                        </button>
                        <button
                            onClick={() => setActiveTab('ai_guide')}
                            style={{
                                padding: '10px 4px', border: 'none', borderBottom: activeTab === 'ai_guide' ? '3px solid #7c3aed' : '3px solid transparent',
                                backgroundColor: 'transparent', color: activeTab === 'ai_guide' ? '#7c3aed' : '#64748b',
                                fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.15s'
                            }}
                        >
                            🎓 MAVi AI Guide
                        </button>
                    </div>
                </div>
            )}

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
                                                <button
                                                    onClick={() => toggleCameraStatus(config.id)}
                                                    style={{
                                                        padding: '4px 10px', borderRadius: '20px', backgroundColor: config.status === 'ACTIVE' ? '#dcfce7' : '#f1f5f9',
                                                        color: config.status === 'ACTIVE' ? '#166534' : '#64748b', fontSize: '0.65rem', fontWeight: 800,
                                                        border: '1px solid rgba(0,0,0,0.05)', cursor: 'pointer', transition: 'all 0.15s'
                                                    }}
                                                    title={config.status === 'ACTIVE' ? "Deactivate Camera" : "Activate Camera"}
                                                >
                                                    {config.status}
                                                </button>
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
                                                    onClick={() => {
                                                        if (config.status !== 'ACTIVE') {
                                                            toggleCameraStatus(config.id);
                                                        }
                                                        setSelectedCamera(config);
                                                    }}
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
                                        { 
                                            name: 'Presence Check', 
                                            desc: 'Monitors regions for visual changes or object presence',
                                            icon: (
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '12px', flexShrink: 0 }}>
                                                    <rect width="24" height="24" rx="4" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
                                                    <rect x="5" y="5" width="6" height="6" rx="1" fill="#3b82f6" />
                                                    <rect x="13" y="5" width="6" height="6" rx="1" stroke="#3b82f6" strokeWidth="1.5" fill="none" />
                                                    <rect x="5" y="13" width="6" height="6" rx="1" fill="#3b82f6" />
                                                    <rect x="13" y="13" width="6" height="6" rx="1" fill="#3b82f6" />
                                                </svg>
                                            )
                                        },
                                        { 
                                            name: 'Scratch Inspection', 
                                            desc: 'Detects surface scratches, cracks, and defects using anomaly detection',
                                            icon: (
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '12px', flexShrink: 0 }}>
                                                    <rect width="24" height="24" rx="4" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
                                                    <rect x="4" y="4" width="16" height="16" fill="#3b82f6" rx="1" />
                                                    <circle cx="12" cy="12" r="5.5" fill="#10b981" opacity="0.8" />
                                                    <circle cx="12" cy="12" r="3.5" fill="#eab308" opacity="0.9" />
                                                    <circle cx="12" cy="12" r="1.5" fill="#ef4444" />
                                                </svg>
                                            )
                                        },
                                        { 
                                            name: 'GD&T Measurement', 
                                            desc: 'Measures object dimensions (width, height, circle diameter, diagonal)',
                                            icon: (
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '12px', flexShrink: 0 }}>
                                                    <rect width="24" height="24" rx="4" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
                                                    <circle cx="10" cy="12" r="5" fill="#3b82f6" />
                                                    <line x1="17.5" y1="5" x2="17.5" y2="19" stroke="#1e293b" strokeWidth="1.2" />
                                                    <path d="M15.5 8L17.5 5L19.5 8" stroke="#1e293b" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                                                    <path d="M15.5 16L17.5 19L19.5 16" stroke="#1e293b" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                                                    <line x1="13.5" y1="6" x2="17.5" y2="6" stroke="#475569" strokeWidth="0.8" strokeDasharray="2" />
                                                    <line x1="13.5" y1="18" x2="17.5" y2="18" stroke="#475569" strokeWidth="0.8" strokeDasharray="2" />
                                                </svg>
                                            )
                                        },
                                        { 
                                            name: 'Positioning (Jig)', 
                                            desc: 'Tracks object position shifts and adjusts coordinate ROIs',
                                            icon: (
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '12px', flexShrink: 0 }}>
                                                    <rect width="24" height="24" rx="4" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
                                                    <rect x="5" y="5" width="5" height="5" rx="0.5" transform="rotate(45 7.5 7.5)" fill="#f97316" />
                                                    <rect x="13" y="13" width="5" height="5" rx="0.5" transform="rotate(45 15.5 15.5)" stroke="#f97316" strokeWidth="1.5" fill="none" />
                                                    <path d="M9.5 9.5L13.5 13.5" stroke="#f97316" strokeWidth="1.5" strokeLinecap="round" />
                                                    <path d="M13.5 10.5V13.5H10.5" stroke="#f97316" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            )
                                        },
                                        { 
                                            name: 'Color Inspection', 
                                            desc: 'Identifies and validates colors in specified regions',
                                            icon: (
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '12px', flexShrink: 0 }}>
                                                    <rect width="24" height="24" rx="4" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
                                                    <rect x="5" y="5" width="4.5" height="14" fill="#10b981" />
                                                    <rect x="9.75" y="5" width="4.5" height="14" fill="#3b82f6" />
                                                    <rect x="14.5" y="5" width="4.5" height="14" fill="#ef4444" />
                                                    <rect x="5" y="5" width="14" height="14" stroke="#475569" strokeWidth="1" fill="none" />
                                                </svg>
                                            )
                                        },
                                        { 
                                            name: 'Count Detector', 
                                            desc: 'Counts target components, pins, or items within the ROI',
                                            icon: (
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '12px', flexShrink: 0 }}>
                                                    <rect width="24" height="24" rx="4" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
                                                    <circle cx="9.5" cy="14.5" r="5" stroke="#475569" strokeWidth="1.5" fill="white" />
                                                    <circle cx="14.5" cy="9.5" r="5" stroke="#475569" strokeWidth="1.5" fill="white" />
                                                    <text x="7.5" y="17" fill="#2563eb" fontSize="7" fontWeight="900" fontFamily="sans-serif">1</text>
                                                    <text x="12.5" y="12" fill="#2563eb" fontSize="7" fontWeight="900" fontFamily="sans-serif">2</text>
                                                </svg>
                                            )
                                        },
                                        { 
                                            name: 'Character Recognition', 
                                            desc: 'Reads serial numbers, lot codes, and alphanumeric characters',
                                            icon: (
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '12px', flexShrink: 0 }}>
                                                    <rect width="24" height="24" rx="4" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
                                                    <rect x="4.5" y="6.5" width="15" height="11" rx="1.5" stroke="#475569" strokeWidth="1.5" fill="none" />
                                                    <text x="6" y="14.5" fill="#475569" fontSize="7" fontWeight="bold" fontFamily="monospace">ABC</text>
                                                </svg>
                                            )
                                        },
                                        { 
                                            name: '1D Code Reader', 
                                            desc: 'Scans and decodes linear barcodes (Code39, Code128, etc.)',
                                            icon: (
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '12px', flexShrink: 0 }}>
                                                    <rect width="24" height="24" rx="4" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
                                                    <rect x="4" y="5" width="2" height="14" fill="#1e293b" />
                                                    <rect x="7" y="5" width="1" height="14" fill="#1e293b" />
                                                    <rect x="9" y="5" width="3" height="14" fill="#1e293b" />
                                                    <rect x="13" y="5" width="1" height="14" fill="#1e293b" />
                                                    <rect x="15" y="5" width="2" height="14" fill="#1e293b" />
                                                    <rect x="18" y="5" width="2" height="14" fill="#1e293b" />
                                                </svg>
                                            )
                                        },
                                        { 
                                            name: '2D Code Reader', 
                                            desc: 'Scans and decodes QR codes and DataMatrix symbols',
                                            icon: (
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '12px', flexShrink: 0 }}>
                                                    <rect width="24" height="24" rx="4" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
                                                    <rect x="4" y="4" width="6" height="6" fill="#1e293b" />
                                                    <rect x="5" y="5" width="4" height="4" fill="white" />
                                                    <rect x="6" y="6" width="2" height="2" fill="#1e293b" />
                                                    
                                                    <rect x="14" y="4" width="6" height="6" fill="#1e293b" />
                                                    <rect x="15" y="5" width="4" height="4" fill="white" />
                                                    <rect x="16" y="6" width="2" height="2" fill="#1e293b" />
                                                    
                                                    <rect x="4" y="14" width="6" height="6" fill="#1e293b" />
                                                    <rect x="5" y="15" width="4" height="4" fill="white" />
                                                    <rect x="6" y="16" width="2" height="2" fill="#1e293b" />

                                                    <rect x="14" y="14" width="2" height="2" fill="#1e293b" />
                                                    <rect x="18" y="14" width="2" height="2" fill="#1e293b" />
                                                    <rect x="14" y="18" width="2" height="2" fill="#1e293b" />
                                                    <rect x="16" y="16" width="2" height="2" fill="#1e293b" />
                                                    <rect x="18" y="18" width="2" height="2" fill="#1e293b" />
                                                </svg>
                                            )
                                        },
                                        { 
                                            name: 'Calibration Tool', 
                                            desc: 'Calibrates lens distortion and converts pixel-to-millimeter coordinates',
                                            icon: (
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '12px', flexShrink: 0 }}>
                                                    <rect width="24" height="24" rx="4" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
                                                    <rect x="4" y="4" width="4" height="4" fill="#ec4899" />
                                                    <rect x="12" y="4" width="4" height="4" fill="#ec4899" />
                                                    <rect x="8" y="8" width="4" height="4" fill="#ec4899" />
                                                    <rect x="16" y="8" width="4" height="4" fill="#ec4899" />
                                                    <rect x="4" y="12" width="4" height="4" fill="#ec4899" />
                                                    <rect x="12" y="12" width="4" height="4" fill="#ec4899" />
                                                    <rect x="8" y="16" width="4" height="4" fill="#ec4899" />
                                                    <rect x="16" y="16" width="4" height="4" fill="#ec4899" />
                                                    <rect x="4" y="4" width="16" height="16" stroke="#db2777" strokeWidth="1" fill="none" />
                                                </svg>
                                            )
                                        }
                                    ].map(d => (
                                        <div key={d.name} style={{ padding: '10px', border: '1px solid #f1f5f9', borderRadius: '8px', display: 'flex', alignItems: 'center' }}>
                                            {d.icon}
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#334155' }}>{d.name}</div>
                                                <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px' }}>{d.desc}</div>
                                            </div>
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

            {/* TAB CONTENT: AI MODELS & INSPECTION */}
            {activeTab === 'ai_models' && (
                <div style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', overflowY: 'auto' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
                        {/* LEFT PANEL: MODEL LIST & TRAINING */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        
                        {/* Models List Box */}
                        <div style={{ padding: '24px', backgroundColor: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: '#0f172a' }}>Trained AI Models</h3>
                                    <p style={{ margin: '2px 0 0 0', color: '#64748b', fontSize: '0.75rem' }}>List of models available for inspections.</p>
                                </div>
                                <button 
                                    onClick={loadAiModels} 
                                    disabled={isLoadingAiModels}
                                    style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', fontWeight: 700 }}
                                >
                                    {isLoadingAiModels ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                                    Refresh
                                </button>
                            </div>

                            {isLoadingAiModels ? (
                                <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                                    <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto 8px' }} />
                                    <span style={{ fontSize: '0.8rem' }}>Loading models...</span>
                                </div>
                            ) : aiModels.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '30px', border: '1px dashed #cbd5e1', borderRadius: '12px', color: '#64748b' }}>
                                    <Sparkles size={28} color="#94a3b8" style={{ margin: '0 auto 8px' }} />
                                    <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>No AI models found</div>
                                    <div style={{ fontSize: '0.7rem', marginTop: '2px' }}>Use the training panel below to create your first model.</div>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
                                    {aiModels.map((model, idx) => (
                                        <div 
                                            key={idx}
                                            style={{
                                                padding: '12px 16px', borderRadius: '12px', border: '1px solid #e2e8f0',
                                                backgroundColor: testModel?.model_name === model.model_name && testModel?.model_type === model.model_type ? '#eff6ff' : '#f8fafc',
                                                borderColor: testModel?.model_name === model.model_name && testModel?.model_type === model.model_type ? '#bfdbfe' : '#e2e8f0',
                                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                transition: 'all 0.15s'
                                            }}
                                        >
                                            <div style={{ cursor: 'pointer', flex: 1 }} onClick={() => {
                                                setTestModel(model);
                                                setTestFile(null);
                                                setTestFilePreview('');
                                                setTestResultImage('');
                                                setTestResultMeta(null);
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <span style={{ fontWeight: 800, fontSize: '0.85rem', color: '#1e293b' }}>{model.model_name}</span>
                                                    <span style={{
                                                        fontSize: '0.65rem', fontWeight: 800, padding: '2px 6px', borderRadius: '6px',
                                                        backgroundColor: model.model_type === 'anomaly' ? '#fef3c7' : model.model_type === 'segmentation' ? '#fee2e2' : '#f3e8ff',
                                                        color: model.model_type === 'anomaly' ? '#d97706' : model.model_type === 'segmentation' ? '#dc2626' : '#7c3aed'
                                                    }}>
                                                        {model.model_type.toUpperCase()}
                                                    </span>
                                                    {model.status && (
                                                        <span style={{
                                                            fontSize: '0.65rem', fontWeight: 700, padding: '1px 5px', borderRadius: '4px',
                                                            backgroundColor: model.status === 'ready' || model.status === 'complete' ? '#dcfce7' : '#f1f5f9',
                                                            color: model.status === 'ready' || model.status === 'complete' ? '#15803d' : '#475569'
                                                        }}>
                                                            {model.status}
                                                        </span>
                                                    )}
                                                </div>
                                                <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '4px', wordBreak: 'break-all' }}>
                                                    {model.dataset_name ? `Dataset: ${model.dataset_name}` : ''} {model.created_at ? `• ${new Date(model.created_at).toLocaleDateString()}` : ''}
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button
                                                    onClick={() => {
                                                        setTestModel(model);
                                                        setTestFile(null);
                                                        setTestFilePreview('');
                                                        setTestResultImage('');
                                                        setTestResultMeta(null);
                                                    }}
                                                    style={{
                                                        border: 'none', backgroundColor: '#3b82f6', color: 'white',
                                                        padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer'
                                                    }}
                                                >
                                                    Select for Test
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteModel(model.model_type, model.model_name)}
                                                    style={{ border: 'none', background: 'transparent', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                                    title="Delete model"
                                                >
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Model Training Form Panel */}
                        <div style={{ padding: '24px', backgroundColor: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', fontWeight: 900, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Sparkles size={18} color="#3b82f6" />
                                Train a New AI Model
                            </h3>

                            {/* Model Type */}
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>MODEL INSPECTION TYPE</label>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                                    {[
                                        { id: 'anomaly', label: 'Anomaly Detection', desc: 'Unsupervised (OK only)' },
                                        { id: 'segmentation', label: 'Defect Segmentation', desc: 'Supervised U-Net (Masks)' },
                                        { id: 'classification', label: 'Classification', desc: 'Supervised OK/NG' }
                                    ].map(type => (
                                        <div
                                            key={type.id}
                                            onClick={() => setModelType(type.id)}
                                            style={{
                                                padding: '10px 14px', borderRadius: '10px', cursor: 'pointer',
                                                border: modelType === type.id ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                                                backgroundColor: modelType === type.id ? 'rgba(59, 130, 246, 0.02)' : 'white',
                                                transition: 'all 0.15s'
                                            }}
                                        >
                                            <div style={{ fontWeight: 800, fontSize: '0.8rem', color: '#1e293b' }}>{type.label}</div>
                                            <div style={{ fontSize: '0.65rem', color: '#64748b', marginTop: '2px' }}>{type.desc}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Model Name */}
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>MODEL NAME</label>
                                <input
                                    type="text"
                                    placeholder="e.g. pcb_inspection_anomaly"
                                    value={newModelName}
                                    onChange={e => setNewModelName(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ''))}
                                    style={{ width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.85rem', outline: 'none' }}
                                />
                            </div>

                            {/* Select Backend Dataset */}
                            <div style={{ marginBottom: '16px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>SELECT TRAINING DATASET (BACKEND)</label>
                                    <button 
                                        onClick={loadAiDatasets}
                                        style={{ border: 'none', background: 'transparent', color: '#3b82f6', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer' }}
                                    >
                                        Refresh List
                                    </button>
                                </div>
                                <select
                                    value={selectedDataset}
                                    onChange={e => setSelectedDataset(e.target.value)}
                                    style={{ width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.85rem', backgroundColor: 'white', outline: 'none' }}
                                >
                                    <option value="">-- Select local dataset --</option>
                                    {aiDatasets.map((ds, idx) => (
                                        <option key={idx} value={ds.name}>
                                            {ds.name} ({ds.total_images} images total)
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Anomaly or Segmentation specific settings */}
                            {(modelType === 'anomaly' || modelType === 'segmentation') && (
                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                                        {modelType === 'segmentation' ? 'TRAINING EPOCHS (5-10 recommended)' : 'TRAINING EPOCHS (1-10 recommended for CPU/fast testing)'}
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="100"
                                        value={epochs}
                                        onChange={e => setEpochs(Number(e.target.value))}
                                        style={{ width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.85rem', outline: 'none' }}
                                    />
                                    <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '6px' }}>
                                        {modelType === 'segmentation' 
                                            ? '* Note: Segmentation trains a local PyTorch U-Net model from your painted defect masks.'
                                            : '* Note: Anomaly model uses PatchCore/FastFlow which trains fast on local CPU, requiring only OK images in the selected dataset.'}
                                    </div>
                                </div>
                            )}

                            {/* Classification specific settings */}
                            {modelType === 'classification' && (
                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>CLASS LABELS (comma-separated folders inside dataset)</label>
                                    <input
                                        type="text"
                                        placeholder="ok, ng"
                                        value={classNamesInput}
                                        onChange={e => setClassNamesInput(e.target.value)}
                                        style={{ width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.85rem', outline: 'none' }}
                                    />
                                    <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '6px' }}>
                                        * Make sure the dataset on backend has corresponding folders (e.g. <code>datasets/{selectedDataset || '&lt;dataset_name&gt;'}/ok</code> and <code>datasets/{selectedDataset || '&lt;dataset_name&gt;'}/ng</code>) populated with training images.
                                    </div>
                                </div>
                            )}

                            {/* Feedback messages */}
                            {trainingError && (
                                <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: '0.8rem', fontWeight: 600, marginBottom: '16px' }}>
                                    ❌ Training Error: {trainingError}
                                </div>
                            )}

                            {trainingSuccess && (
                                <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', color: '#16a34a', fontSize: '0.8rem', fontWeight: 600, marginBottom: '16px' }}>
                                    ✅ {trainingSuccess}
                                </div>
                            )}

                            {/* Submit Button */}
                            <button
                                onClick={handleTrainModel}
                                disabled={isTraining}
                                style={{
                                    width: '100%', padding: '12px 20px', border: 'none', borderRadius: '8px',
                                    backgroundColor: isTraining ? '#94a3b8' : '#3b82f6',
                                    color: 'white', fontSize: '0.85rem', fontWeight: 800, cursor: isTraining ? 'not-allowed' : 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                    boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.2)', transition: 'all 0.15s'
                                }}
                            >
                                {isTraining ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" />
                                        TRAINING MODEL IN PROGRESS (Backend script)...
                                    </>
                                ) : (
                                    <>
                                        <Play size={16} fill="white" />
                                        START TRAINING
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* RIGHT PANEL: MODEL TESTING & LOCAL DATASET UPLOADER */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        
                        {/* Model Inference Testing Panel */}
                        <div style={{ padding: '24px', backgroundColor: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', fontWeight: 900, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Eye size={18} color="#10b981" />
                                Test Inference on Image
                            </h3>

                            {testModel ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', marginBottom: '16px' }}>
                                    <CheckCircle2 size={16} color="#16a34a" />
                                    <div>
                                        <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#166534' }}>SELECTED MODEL</div>
                                        <div style={{ fontSize: '0.8rem', fontWeight: 900, color: '#14532d' }}>{testModel.model_name} ({testModel.model_type.toUpperCase()})</div>
                                    </div>
                                    <button 
                                        onClick={() => setTestModel(null)} 
                                        style={{ marginLeft: 'auto', border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8', fontSize: '0.7rem' }}
                                    >
                                        Change
                                    </button>
                                </div>
                            ) : (
                                <div style={{ padding: '12px', backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px', color: '#b45309', fontSize: '0.75rem', fontWeight: 700, marginBottom: '16px' }}>
                                    ⚠️ Please select a model from the list on the left to begin testing.
                                </div>
                            )}

                            {/* Image selector */}
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>SELECT TEST IMAGE</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={e => {
                                        const file = e.target.files[0];
                                        if (file) {
                                            setTestFile(file);
                                            setTestFilePreview(URL.createObjectURL(file));
                                            setTestResultImage('');
                                            setTestResultMeta(null);
                                        }
                                    }}
                                    style={{ fontSize: '0.8rem' }}
                                />
                            </div>

                            {/* Image Previews Side-by-Side or Sequential */}
                            {(testFilePreview || testResultImage) && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: testResultImage ? '1fr 1fr' : '1fr', gap: '12px' }}>
                                        {testFilePreview && (
                                            <div>
                                                <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', marginBottom: '4px', textAlign: 'center' }}>Original Input</div>
                                                <div style={{ width: '100%', height: '200px', backgroundColor: '#0f172a', borderRadius: '10px', overflow: 'hidden', border: '1px solid #cbd5e1' }}>
                                                    <img src={testFilePreview} alt="Original" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                                </div>
                                            </div>
                                        )}
                                        
                                        {testResultImage && (
                                            <div>
                                                <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#3b82f6', marginBottom: '4px', textAlign: 'center' }}>AI Inspection Output</div>
                                                <div style={{ width: '100%', height: '200px', backgroundColor: '#0f172a', borderRadius: '10px', overflow: 'hidden', border: '1px solid #cbd5e1', position: 'relative' }}>
                                                    <img src={testResultImage} alt="Result" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                                    {testResultMeta && (
                                                        <div style={{
                                                            position: 'absolute', top: '8px', right: '8px',
                                                            backgroundColor: testResultMeta.isPassed ? 'rgba(34, 197, 94, 0.9)' : 'rgba(239, 68, 68, 0.9)',
                                                            color: 'white', fontWeight: 900, fontSize: '0.75rem', padding: '2px 8px', borderRadius: '6px',
                                                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                                        }}>
                                                            {testResultMeta.isPassed ? 'OK' : 'NG'}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Test Result Metadata Details */}
                                    {testResultMeta && (
                                        <div style={{ padding: '14px', borderRadius: '12px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc' }}>
                                            <div style={{ fontSize: '0.8rem', fontWeight: 900, color: '#334155', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px', marginBottom: '8px' }}>
                                                Inspection Details
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.75rem' }}>
                                                <div>
                                                    <span style={{ color: '#64748b' }}>Decision:</span>{' '}
                                                    <span style={{ fontWeight: 800, color: testResultMeta.isPassed ? '#16a34a' : '#dc2626' }}>
                                                        {testResultMeta.isPassed ? '✅ PASS (OK)' : '❌ FAIL (NG)'}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span style={{ color: '#64748b' }}>Value/Summary:</span>{' '}
                                                    <span style={{ fontWeight: 800, color: '#334155' }}>
                                                        {testResultMeta.calculatedValue || 'N/A'}
                                                    </span>
                                                </div>
                                                {testResultMeta.anomalyScore && (
                                                    <div style={{ gridColumn: 'span 2' }}>
                                                        <span style={{ color: '#64748b' }}>Anomaly Score:</span>{' '}
                                                        <span style={{ fontWeight: 800, color: '#475569' }}>
                                                            {Number(testResultMeta.anomalyScore).toFixed(4)}
                                                        </span>
                                                    </div>
                                                )}
                                                
                                                {/* Segment info */}
                                                {testResultMeta.segmentDetails && (
                                                    <div style={{ gridColumn: 'span 2', marginTop: '6px', borderTop: '1px solid #e2e8f0', paddingTop: '6px' }}>
                                                        <div style={{ fontWeight: 700, color: '#475569', marginBottom: '4px' }}>Segmentation Result:</div>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', color: '#64748b' }}>
                                                            <span>• Defect Count: <strong>{testResultMeta.segmentDetails.defect_count}</strong></span>
                                                            <span>• Defect Area Ratio: <strong>{(testResultMeta.segmentDetails.defect_ratio * 100).toFixed(3)}%</strong> ({testResultMeta.segmentDetails.total_area_px} px)</span>
                                                            <span>• Method: <code>{testResultMeta.segmentDetails.method}</code></span>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Classify info */}
                                                {testResultMeta.classifyDetails && (
                                                    <div style={{ gridColumn: 'span 2', marginTop: '6px', borderTop: '1px solid #e2e8f0', paddingTop: '6px' }}>
                                                        <div style={{ fontWeight: 700, color: '#475569', marginBottom: '4px' }}>Classification Result:</div>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', color: '#64748b' }}>
                                                            <span>• Predicted Class: <strong style={{ color: '#7c3aed' }}>{testResultMeta.classifyDetails.predicted_class}</strong></span>
                                                            <span>• Confidence: <strong>{Number(testResultMeta.classifyDetails.confidence).toFixed(1)}%</strong></span>
                                                            {testResultMeta.classifyDetails.probabilities && (
                                                                <span style={{ fontSize: '0.7rem', display: 'block', marginTop: '3px' }}>
                                                                    Probabilities: {Object.entries(testResultMeta.classifyDetails.probabilities).map(([c, p]) => `${c}: ${(p*100).toFixed(1)}%`).join(' | ')}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {testError && (
                                <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: '0.8rem', fontWeight: 600, marginBottom: '16px' }}>
                                    ❌ Test Error: {testError}
                                </div>
                            )}

                            {/* Test Execution Button */}
                            <button
                                onClick={handleTestInference}
                                disabled={isTesting || !testModel || !testFile}
                                style={{
                                    width: '100%', padding: '10px 18px', border: 'none', borderRadius: '8px',
                                    backgroundColor: (isTesting || !testModel || !testFile) ? '#cbd5e1' : '#10b981',
                                    color: 'white', fontSize: '0.8rem', fontWeight: 800, cursor: (isTesting || !testModel || !testFile) ? 'not-allowed' : 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                    transition: 'all 0.15s'
                                }}
                            >
                                {isTesting ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" />
                                        Running Inference...
                                    </>
                                ) : (
                                    <>
                                        <Play size={16} fill="white" />
                                        TEST INFERENCE
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Local backend dataset manager */}
                        <div style={{ padding: '24px', backgroundColor: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', fontWeight: 900, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <FolderPlus size={18} color="#eab308" />
                                Create or Add Files to Backend Dataset
                            </h3>

                            {/* Create / Select dataset */}
                            <div style={{ marginBottom: '12px' }}>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>DATASET NAME (FOLDER ON BACKEND)</label>
                                <input
                                    type="text"
                                    placeholder="Enter new dataset name or type existing one"
                                    value={backendDatasetName}
                                    onChange={e => setBackendDatasetName(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ''))}
                                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.8rem', outline: 'none' }}
                                />
                                <div style={{ fontSize: '0.65rem', color: '#64748b', marginTop: '4px' }}>
                                    Leave blank to upload directly to selected dataset: <strong>{selectedDataset || '(None)'}</strong>
                                </div>
                            </div>

                            {/* Label selection */}
                            <div style={{ marginBottom: '12px' }}>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>IMAGE LABEL / SUBFOLDER</label>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    {['ok', 'ng'].map(lbl => (
                                        <button
                                            key={lbl}
                                            onClick={() => setUploadLabel(lbl)}
                                            style={{
                                                flex: 1, padding: '6px 12px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer',
                                                border: uploadLabel === lbl ? '2px solid #eab308' : '1px solid #e2e8f0',
                                                backgroundColor: uploadLabel === lbl ? 'rgba(234, 179, 8, 0.04)' : 'white',
                                                color: uploadLabel === lbl ? '#854d0e' : '#475569', transition: 'all 0.15s'
                                            }}
                                        >
                                            {lbl.toUpperCase()} folder
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Select multiple files */}
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>CHOOSE OK/NG IMAGES TO UPLOAD</label>
                                <input
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    onChange={e => setUploadFiles(Array.from(e.target.files))}
                                    style={{ fontSize: '0.8rem' }}
                                />
                                {uploadFiles.length > 0 && (
                                    <div style={{ fontSize: '0.7rem', color: '#475569', marginTop: '6px', fontWeight: 600 }}>
                                        Selected: {uploadFiles.length} files ready for upload.
                                    </div>
                                )}
                            </div>

                            {/* Upload feedback */}
                            {uploadStatus && (
                                <div style={{
                                    padding: '10px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 600, marginBottom: '14px',
                                    backgroundColor: uploadStatus.includes('Error') ? '#fef2f2' : uploadStatus.includes('Successfully') ? '#f0fdf4' : '#f8fafc',
                                    border: uploadStatus.includes('Error') ? '1px solid #fecaca' : uploadStatus.includes('Successfully') ? '1px solid #bbf7d0' : '1px solid #cbd5e1',
                                    color: uploadStatus.includes('Error') ? '#dc2626' : uploadStatus.includes('Successfully') ? '#16a34a' : '#475569'
                                }}>
                                    {uploadStatus}
                                </div>
                            )}

                            {/* Upload button */}
                            <button
                                onClick={handleUploadDatasetFiles}
                                disabled={isUploadingFiles || uploadFiles.length === 0}
                                style={{
                                    width: '100%', padding: '8px 16px', border: 'none', borderRadius: '8px',
                                    backgroundColor: (isUploadingFiles || uploadFiles.length === 0) ? '#cbd5e1' : '#eab308',
                                    color: uploadFiles.length > 0 ? '#854d0e' : 'white', fontSize: '0.75rem', fontWeight: 800,
                                    cursor: (isUploadingFiles || uploadFiles.length === 0) ? 'not-allowed' : 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                                    transition: 'all 0.15s'
                                }}
                            >
                                {isUploadingFiles ? (
                                    <>
                                        <Loader2 size={14} className="animate-spin" />
                                        UPLOADING...
                                    </>
                                ) : (
                                    <>
                                        <Download size={14} style={{ transform: 'rotate(180deg)' }} />
                                        UPLOAD FILES TO BACKEND
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* MAVi-STYLE DATASET INSPECTOR & ACTIVE LEARNING STUDIO */}
                {selectedDataset && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '24px', backgroundColor: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', marginTop: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '16px' }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.18rem', fontWeight: 900, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    🔍 MAVi AI Studio: Dataset Inspector
                                </h3>
                                <p style={{ margin: '2px 0 0 0', color: '#64748b', fontSize: '0.78rem' }}>
                                    Kelola dataset "<strong>{selectedDataset}</strong>" langsung di server. Lukis cacat produk dengan kuas mask interaktif.
                                </p>
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button
                                    onClick={() => handleActiveSelect(selectedDataset)}
                                    disabled={isActiveSelecting}
                                    style={{
                                        border: 'none', backgroundColor: '#7c3aed', color: 'white',
                                        padding: '8px 16px', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 800,
                                        cursor: isActiveSelecting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
                                    }}
                                >
                                    {isActiveSelecting ? <Loader2 size={14} className="animate-spin" /> : '⚡ AI Auto Image Selector'}
                                </button>
                                <button
                                    onClick={() => {
                                        loadBackendImages(selectedDataset);
                                        loadSeparationGraph(selectedDataset);
                                    }}
                                    style={{
                                        border: '1px solid #cbd5e1', backgroundColor: 'white', color: '#475569',
                                        padding: '8px 16px', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer'
                                    }}
                                >
                                    🔄 Refresh Images
                                </button>
                            </div>
                        </div>

                        {/* Dual layout: Separation Graph (Left) & Suggestions info (Right) */}
                        {separationGraphData && (
                            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px', backgroundColor: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                <div>
                                    <h4 style={{ margin: '0 0 12px 0', fontSize: '0.85rem', fontWeight: 800, color: '#1e293b' }}>
                                        📈 Degree of Separation Graph (OK vs NG Scores)
                                    </h4>
                                    
                                    {/* Separation graph visual representation */}
                                    <div style={{ height: '140px', display: 'flex', alignItems: 'flex-end', gap: '4px', borderBottom: '2px solid #cbd5e1', paddingBottom: '5px', position: 'relative' }}>
                                        <div style={{ position: 'absolute', left: 0, right: 0, top: '25%', borderTop: '1px dashed #e2e8f0', pointerEvents: 'none' }} />
                                        <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', borderTop: '1px dashed #e2e8f0', pointerEvents: 'none' }} />
                                        <div style={{ position: 'absolute', left: 0, right: 0, top: '75%', borderTop: '1px dashed #e2e8f0', pointerEvents: 'none' }} />
                                        
                                        {separationGraphData.bin_labels.map((label, idx) => {
                                            const okVal = separationGraphData.ok_histogram[idx] || 0;
                                            const ngVal = separationGraphData.ng_histogram[idx] || 0;
                                            const maxVal = Math.max(1, ...separationGraphData.ok_histogram, ...separationGraphData.ng_histogram);
                                            
                                            const okHeight = `${(okVal / maxVal) * 100}%`;
                                            const ngHeight = `${(ngVal / maxVal) * 100}%`;
                                            
                                            return (
                                                <div key={idx} style={{ flex: 1, height: '100%', display: 'flex', gap: '2px', alignItems: 'flex-end', position: 'relative' }} title={`Score Bin: ${label}\nOK Count: ${okVal}\nNG Count: ${ngVal}`}>
                                                    {okVal > 0 && (
                                                        <div style={{ flex: 1, height: okHeight, backgroundColor: '#22c55e', opacity: 0.8, borderRadius: '2px 2px 0 0', minHeight: '2px', transition: 'height 0.3s' }} />
                                                    )}
                                                    {ngVal > 0 && (
                                                        <div style={{ flex: 1, height: ngHeight, backgroundColor: '#ef4444', opacity: 0.8, borderRadius: '2px 2px 0 0', minHeight: '2px', transition: 'height 0.3s' }} />
                                                    )}
                                                </div>
                                            );
                                        })}

                                        {(() => {
                                            const minS = separationGraphData.min_score;
                                            const maxS = separationGraphData.max_score;
                                            const thresh = separationGraphData.suggested_threshold;
                                            const percent = maxS > minS ? ((thresh - minS) / (maxS - minS)) * 100 : 50;
                                            
                                             return (
                                                 <div style={{ position: 'absolute', left: `${percent}%`, top: 0, bottom: 0, width: '2px', backgroundColor: '#7c3aed', zIndex: 10 }}>
                                                     <div style={{ position: 'absolute', top: '-18px', transform: 'translateX(-50%)', backgroundColor: '#7c3aed', color: 'white', padding: '1px 5px', borderRadius: '4px', fontSize: '0.55rem', fontWeight: 800, whiteSpace: 'nowrap' }}>
                                                         Cutoff: {thresh.toFixed(2)}
                                                     </div>
                                                 </div>
                                             );
                                        })()}
                                    </div>
                                    
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '0.62rem', color: '#64748b', fontWeight: 600 }}>
                                        <span>OK (Clean) area ───</span>
                                        <span>Separation Threshold</span>
                                        <span>─── Defect / NG area</span>
                                    </div>
                                </div>
                                <div style={{ borderLeft: '1px solid #cbd5e1', paddingLeft: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                    <h4 style={{ margin: '0 0 6px 0', fontSize: '0.78rem', fontWeight: 800, color: '#1e293b' }}>
                                        🎯 AI Training Recommendation
                                    </h4>
                                    <p style={{ margin: 0, fontSize: '0.7rem', color: '#475569', lineHeight: 1.4 }}>
                                        Grafik di samping memperlihatkan hasil pemisahan AI saat ini. Bagian persinggungan (overlap) adalah area kritis.
                                        Tekan tombol <strong>AI Auto Image Selector</strong> di atas untuk menyaring gambar tak berlabel yang paling membingungkan model.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Images Gallery */}
                        <div>
                            <h4 style={{ margin: '0 0 12px 0', fontSize: '0.82rem', fontWeight: 800, color: '#475569' }}>
                                📂 Dataset Images ({backendImages.length} items on server)
                            </h4>
                            {isLoadingBackendImages ? (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px', color: '#94a3b8' }}>
                                    <Loader2 size={24} className="animate-spin" style={{ marginRight: '8px' }} />
                                    <span style={{ fontSize: '0.8rem' }}>Loading dataset files...</span>
                                </div>
                            ) : backendImages.length === 0 ? (
                                <div style={{ padding: '30px', textAlign: 'center', border: '1px dashed #cbd5e1', borderRadius: '12px', color: '#64748b', fontSize: '0.8rem' }}>
                                    Belum ada file di dataset ini. Gunakan panel Uploader di kanan atas untuk mengunggah gambar.
                                </div>
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '14px', maxHeight: '350px', overflowY: 'auto', padding: '4px' }}>
                                    {backendImages.map((img, idx) => {
                                        const isSuggested = activeSuggestions.some(s => s.relative_path === img.relative_path);
                                        return (
                                            <div
                                                key={idx}
                                                style={{
                                                    backgroundColor: 'white', border: isSuggested ? '2px solid #7c3aed' : '1px solid #cbd5e1',
                                                    borderRadius: '12px', overflow: 'hidden', display: 'flex', flexDirection: 'column',
                                                    boxShadow: isSuggested ? '0 0 8px rgba(124, 58, 237, 0.25)' : 'none', position: 'relative'
                                                }}
                                            >
                                                {isSuggested && (
                                                    <div style={{ position: 'absolute', top: '4px', left: '4px', backgroundColor: '#7c3aed', color: 'white', padding: '2px 6px', borderRadius: '6px', fontSize: '0.55rem', fontWeight: 900, zIndex: 5 }}>
                                                        🔥 REKOMENDASI AI
                                                    </div>
                                                )}
                                                
                                                <div style={{ height: '85px', backgroundColor: '#f1f5f9', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid #cbd5e1' }}>
                                                    <img
                                                        src={`http://localhost:8000/ai/dataset/image?dataset_name=${selectedDataset}&relative_path=${encodeURIComponent(img.relative_path)}`}
                                                        alt={img.filename}
                                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                        loading="lazy"
                                                    />
                                                </div>

                                                <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                                                    <div style={{ fontSize: '0.62rem', fontWeight: 700, color: '#334155', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={img.filename}>
                                                        {img.filename}
                                                    </div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.58rem' }}>
                                                        <span style={{ padding: '2px 4px', borderRadius: '4px', backgroundColor: img.label.toLowerCase() === 'ok' ? '#dcfce7' : '#fee2e2', color: img.label.toLowerCase() === 'ok' ? '#15803d' : '#b91c1c', fontWeight: 800 }}>
                                                            {img.label.toUpperCase()}
                                                        </span>
                                                        <span style={{ padding: '2px 4px', borderRadius: '4px', backgroundColor: img.has_mask ? '#e0f2fe' : '#f1f5f9', color: img.has_mask ? '#0369a1' : '#64748b', fontWeight: 700 }}>
                                                            {img.has_mask ? '🟢 Mask' : '⚪ No Mask'}
                                                        </span>
                                                    </div>
                                                    <button
                                                        onClick={() => {
                                                            setPaintImage(img);
                                                            setShowPaintModal(true);
                                                        }}
                                                        style={{
                                                            width: '100%', border: 'none', backgroundColor: '#e2e8f0', color: '#1e293b',
                                                            padding: '5px', borderRadius: '6px', fontSize: '0.65rem', fontWeight: 800,
                                                            cursor: 'pointer', marginTop: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px'
                                                        }}
                                                    >
                                                        🎨 Paint Defect
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                )}
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

            {/* TAB CONTENT: MAVi AI USE CASES GUIDE */}
            {activeTab === 'ai_guide' && <AiGuideView />}

            {showPaintModal && paintImage && (
                <DefectPainterModal
                    image={paintImage}
                    datasetName={selectedDataset}
                    onClose={() => {
                        setShowPaintModal(false);
                        setPaintImage(null);
                        loadBackendImages(selectedDataset);
                    }}
                />
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
                    const savedCameraId = localStorage.getItem('mavi-selected-camera-id');
                    const videoConstraints = savedCameraId 
                        ? { width: { ideal: 640 }, height: { ideal: 480 }, deviceId: { exact: savedCameraId } }
                        : { width: { ideal: 640 }, height: { ideal: 480 } };
                    stream = await navigator.mediaDevices.getUserMedia({ video: videoConstraints });
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
    const [isSaving, setIsSaving] = useState(false);

    // Normalize regions to ensure all detectors are defined (backward compatibility)
    useEffect(() => {
        if (!camera.id || !regionsByCamera[camera.id]) return;
        const currentRegions = regionsByCamera[camera.id];
        let hasChanges = false;
        
        const normalized = currentRegions.map(r => {
            let rChanged = false;
            const updatedDetectors = { ...r.detectors };
            
            const defaults = {
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
                    enabled: false,
                    name: `${r.name} Color`,
                    beginThreshold: 72,
                    endThreshold: 66,
                    targetColor: '#eab308',
                    similarity: 0
                },
                jigDetector: {
                    enabled: false,
                    name: `${r.name} Jig`,
                    markerType: 'ArUco',
                    markerId: 0
                },
                ocrDetector: {
                    enabled: false,
                    name: `${r.name} OCR`,
                    language: 'English',
                    matchPattern: '',
                    confidenceThreshold: 80
                },
                dimensionDetector: {
                    enabled: false,
                    name: `${r.name} Dimension`,
                    referenceSize: 20,
                    measureMode: 'Width',
                    unit: 'mm',
                    minArea: 100,
                    cannyThreshold: 100,
                    lsl: 19.5,
                    usl: 20.5
                },
                aiDetector: {
                    enabled: false,
                    name: `${r.name} AI`,
                    modelType: 'anomaly',
                    modelName: 'default',
                    anomalyThreshold: 0.5,
                    expectedClass: 'ok',
                    threshold: 0.5,
                    defectAreaLimit: 100
                },
                countDetector: {
                    enabled: false,
                    name: `${r.name} Count`,
                    targetClass: 'object',
                    expectedCount: 1,
                    confidenceThreshold: 50
                },
                barcode1dDetector: {
                    enabled: false,
                    name: `${r.name} Barcode`,
                    barcodeType: 'ANY',
                    expectedValue: ''
                },
                barcode2dDetector: {
                    enabled: false,
                    name: `${r.name} 2D Code`,
                    codeType: 'ANY',
                    expectedValue: ''
                },
                calibrationDetector: {
                    enabled: false,
                    name: `${r.name} Calibration`,
                    calibrationType: 'Scale Factor',
                    unit: 'mm'
                }
            };
            
            if (!r.detectors) {
                r.detectors = {};
                rChanged = true;
            }
            
            Object.keys(defaults).forEach(key => {
                if (!r.detectors[key]) {
                    updatedDetectors[key] = defaults[key];
                    rChanged = true;
                }
            });
            
            if (rChanged) {
                hasChanges = true;
                return { ...r, detectors: updatedDetectors };
            }
            return r;
        });
        
        if (hasChanges) {
            setRegionsByCamera(prev => ({
                ...prev,
                [camera.id]: normalized
            }));
        }
    }, [camera.id]);

    // Camera Selection State
    const [availableCameras, setAvailableCameras] = useState([]);
    const [selectedCameraId, setSelectedCameraId] = useState('');

    useEffect(() => {
        if (camera.cameraSource !== 'DEVICE') return;
        navigator.mediaDevices.enumerateDevices().then(devices => {
            const cameras = devices.filter(d => d.kind === 'videoinput');
            setAvailableCameras(cameras);
            const saved = localStorage.getItem('mavi-selected-camera-id');
            if (saved && cameras.find(c => c.deviceId === saved)) {
                setSelectedCameraId(saved);
            } else if (cameras.length > 0) {
                const backCam = cameras.find(c => c.label.toLowerCase().includes('back') || c.label.toLowerCase().includes('environment'));
                setSelectedCameraId(backCam ? backCam.deviceId : cameras[0].deviceId);
            }
        }).catch(err => console.warn('Failed to enumerate devices:', err));
    }, [camera.cameraSource]);

    const handleCameraChange = (e) => {
        const id = e.target.value;
        setSelectedCameraId(id);
        localStorage.setItem('mavi-selected-camera-id', id);
    };

    // Configure Offline toggle
    const [configureOffline, setConfigureOffline] = useState(false);

    // Accordion expand states
    const [changeDetectorExpanded, setChangeDetectorExpanded] = useState(false);
    const [colorDetectorExpanded, setColorDetectorExpanded] = useState(true);
    const [jigDetectorExpanded, setJigDetectorExpanded] = useState(false);
    const [ocrDetectorExpanded, setOcrDetectorExpanded] = useState(false);
    const [dimensionDetectorExpanded, setDimensionDetectorExpanded] = useState(false);
    const [aiDetectorExpanded, setAiDetectorExpanded] = useState(false);
    const [countDetectorExpanded, setCountDetectorExpanded] = useState(false);
    const [barcode1dDetectorExpanded, setBarcode1dDetectorExpanded] = useState(false);
    const [barcode2dDetectorExpanded, setBarcode2dDetectorExpanded] = useState(false);
    const [calibrationDetectorExpanded, setCalibrationDetectorExpanded] = useState(false);
    const [editorAiModels, setEditorAiModels] = useState([]);
    const [showDetectorSelector, setShowDetectorSelector] = useState(false);

    // Fetch AI Models in editor context
    useEffect(() => {
        fetch('http://localhost:8000/ai/model/list')
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setEditorAiModels(data.models || []);
                }
            })
            .catch(err => console.error('Error fetching AI models in editor:', err));
    }, []);

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
    const lastFetchTimesRef = useRef({});
    const activeFetchesRef = useRef({});
    const detectionResultsRef = useRef({});
    const lastLogValuesRef = useRef({});
    const lastSuccessTimesRef = useRef({});
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

    const handleSaveConfig = async () => {
        setIsSaving(true);
        try {
            const activeDetectors = [];
            regions.forEach(r => {
                if (r.detectors?.changeDetector?.enabled) activeDetectors.push('Change Detector');
                if (r.detectors?.colorDetector?.enabled) activeDetectors.push('Color Detector');
                if (r.detectors?.jigDetector?.enabled) activeDetectors.push('Jig Detector');
                if (r.detectors?.ocrDetector?.enabled) activeDetectors.push('OCR Detector');
                if (r.detectors?.dimensionDetector?.enabled) activeDetectors.push('Dimension Detector');
                if (r.detectors?.aiDetector?.enabled) activeDetectors.push('AI Detector');
                if (r.detectors?.countDetector?.enabled) activeDetectors.push('Count Detector');
                if (r.detectors?.barcode1dDetector?.enabled) activeDetectors.push('1D Code Reader');
                if (r.detectors?.barcode2dDetector?.enabled) activeDetectors.push('2D Code Reader');
                if (r.detectors?.calibrationDetector?.enabled) activeDetectors.push('Calibration Tool');
            });
            const uniqueDets = [...new Set(activeDetectors)];
            if (uniqueDets.length === 0) uniqueDets.push('Change Detector');

            const settings = {
                ...(camera.settings || {}),
                status: camera.status || 'ACTIVE',
                regionsCount: regions.length,
                detectors: uniqueDets,
                regions: regions,
                deviceId: selectedCameraId
            };

            const payload = {
                id: camera.id,
                name: camera.name,
                url: camera.ipCameraUrl || '',
                type: camera.cameraSource || 'DEVICE',
                settings: settings
            };

            await saveCamera(payload);
            toast.success(`Camera configuration for "${camera.name}" saved successfully to Supabase.`);
        } catch (err) {
            console.error('Failed to save camera config:', err);
            toast.error(`Error saving camera configuration: ${err.message}`);
        } finally {
            setIsSaving(false);
        }
    };

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
                    if (r.detectors?.aiDetector?.enabled) activeDetectors.push('AI Detector');
                    if (r.detectors?.countDetector?.enabled) activeDetectors.push('Count Detector');
                    if (r.detectors?.barcode1dDetector?.enabled) activeDetectors.push('1D Code Reader');
                    if (r.detectors?.barcode2dDetector?.enabled) activeDetectors.push('2D Code Reader');
                    if (r.detectors?.calibrationDetector?.enabled) activeDetectors.push('Calibration Tool');
                });
                const uniqueDets = [...new Set(activeDetectors)];
                if (uniqueDets.length === 0) uniqueDets.push('Change Detector');

                const settings = {
                    ...(camera.settings || {}),
                    status: camera.status || 'ACTIVE',
                    regionsCount: regions.length,
                    detectors: uniqueDets,
                    regions: regions,
                    deviceId: selectedCameraId
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
    }, [regions, camera.name, camera.status, camera.cameraSource, camera.ipCameraUrl, cameraLoading, selectedCameraId]);

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
        
        const savedCameraId = localStorage.getItem('mavi-selected-camera-id');
        const videoConstraints = savedCameraId 
            ? { width: { ideal: 1280 }, height: { ideal: 720 }, deviceId: { exact: savedCameraId } }
            : { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'environment' };

        navigator.mediaDevices.getUserMedia({
            video: videoConstraints
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
    }, [camera.cameraSource, configureOffline, selectedCameraId]);

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

    const updateAiDetectorSetting = (id, key, value) => {
        setRegionsByCamera(prev => ({
            ...prev,
            [camera.id]: prev[camera.id].map(r => r.id === id ? {
                ...r,
                detectors: {
                    ...r.detectors,
                    aiDetector: {
                        ...r.detectors.aiDetector,
                        [key]: value
                    }
                }
            } : r)
        }));
    };

    const updateGenericDetectorSetting = (id, detectorKey, key, value) => {
        setRegionsByCamera(prev => ({
            ...prev,
            [camera.id]: prev[camera.id].map(r => r.id === id ? {
                ...r,
                detectors: {
                    ...r.detectors,
                    [detectorKey]: {
                        ...r.detectors[detectorKey],
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
                        },
                        aiDetector: {
                            enabled: false,
                            name: `Region ${nextNum} AI`,
                            modelType: 'anomaly',
                            modelName: 'default',
                            anomalyThreshold: 0.5,
                            expectedClass: 'ok',
                            threshold: 0.5,
                            defectAreaLimit: 100
                        },
                        countDetector: {
                            enabled: false,
                            name: `Region ${nextNum} Count`,
                            targetClass: 'object',
                            expectedCount: 1,
                            confidenceThreshold: 50
                        },
                        barcode1dDetector: {
                            enabled: false,
                            name: `Region ${nextNum} Barcode`,
                            barcodeType: 'ANY',
                            expectedValue: ''
                        },
                        barcode2dDetector: {
                            enabled: false,
                            name: `Region ${nextNum} 2D Code`,
                            codeType: 'ANY',
                            expectedValue: ''
                        },
                        calibrationDetector: {
                            enabled: false,
                            name: `Region ${nextNum} Calibration`,
                            calibrationType: 'Scale Factor',
                            unit: 'mm'
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
                const barcode1dDet = region.detectors?.barcode1dDetector;
                const barcode2dDet = region.detectors?.barcode2dDetector;

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
                        
                        // Barcode 1D / 2D and OCR backend fetching
                        const handleBackendDetector = (detector, detectorKey, url, detectorName) => {
                            if (detector && detector.enabled) {
                                const cacheKey = region.id + '-' + detectorKey;
                                const lastFetch = lastFetchTimesRef.current[cacheKey] || 0;
                                const isFetching = activeFetchesRef.current[cacheKey] || false;
                                
                                if (!isFetching && now - lastFetch > 800) {
                                    activeFetchesRef.current[cacheKey] = true;
                                    lastFetchTimesRef.current[cacheKey] = now;
                                    
                                    const cropCanvas = document.createElement('canvas');
                                    cropCanvas.width = rw;
                                    cropCanvas.height = rh;
                                    const cropCtx = cropCanvas.getContext('2d');
                                    if (cropCtx) {
                                        if (!configureOffline && hasPermission && camera.cameraSource === 'DEVICE' && videoRef.current && videoRef.current.readyState >= 2) {
                                            const scaleX = videoRef.current.videoWidth / w;
                                            const scaleY = videoRef.current.videoHeight / h;
                                            cropCtx.drawImage(
                                                videoRef.current,
                                                rx * scaleX, ry * scaleY, rw * scaleX, rh * scaleY,
                                                0, 0, rw, rh
                                            );
                                        } else {
                                            cropCtx.drawImage(
                                                canvas,
                                                rx, ry, rw, rh,
                                                0, 0, rw, rh
                                            );
                                        }
                                        
                                        cropCanvas.toBlob((blob) => {
                                            if (!blob) {
                                                activeFetchesRef.current[cacheKey] = false;
                                                return;
                                            }
                                            const formData = new FormData();
                                            formData.append('file', blob, 'region.jpg');
                                            if (detectorKey === 'ocrDetector') {
                                                formData.append('languages', detector.language === 'Indonesian' ? 'id,en' : 'en');
                                            }
                                            
                                            fetch(url, {
                                                method: 'POST',
                                                body: formData
                                            })
                                            .then(res => {
                                                if (!res.ok) throw new Error('API error');
                                                const val = res.headers.get('X-Calculated-Value') || '';
                                                const isPassedStr = res.headers.get('X-Is-Passed') || 'false';
                                                
                                                // Expected value validation
                                                let finalPass = isPassedStr === 'true';
                                                const expected = detector.expectedValue || detector.matchPattern || '';
                                                if (expected && val && !val.toLowerCase().includes('no code') && !val.toLowerCase().includes('no text')) {
                                                    const cleanVal = val.includes(':') ? val.split(':').slice(1).join(':').trim() : val.trim();
                                                    const pattern = expected.replace(/[-\/\\^$*+?.()|[\]{}]/g, (m) => m === '*' ? '.*' : '\\' + m);
                                                    const regex = new RegExp('^' + pattern + '$', 'i');
                                                    finalPass = regex.test(cleanVal);
                                                }

                                                detectionResultsRef.current[cacheKey] = {
                                                    value: val,
                                                    isPassed: finalPass,
                                                    lastUpdated: Date.now()
                                                };
                                                
                                                // Trigger successful scan animation
                                                if (val && !val.toLowerCase().includes('no code') && !val.toLowerCase().includes('no text')) {
                                                    const cacheKeySuccess = region.id + '-success';
                                                    const lastSuccess = lastSuccessTimesRef.current[cacheKeySuccess] || 0;
                                                    if (lastLogValuesRef.current[cacheKey] !== val || (Date.now() - lastSuccess > 2500)) {
                                                        lastSuccessTimesRef.current[cacheKeySuccess] = Date.now();
                                                    }
                                                }

                                                if (lastLogValuesRef.current[cacheKey] !== val) {
                                                    lastLogValuesRef.current[cacheKey] = val;
                                                    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                                                    const newLog = {
                                                        id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                                                        time: timestamp,
                                                        regionName: region.name,
                                                        detectorType: detectorName,
                                                        value: val,
                                                        status: finalPass ? 'MATCH' : 'NO MATCH'
                                                    };
                                                    logsRef.current = [newLog, ...logsRef.current].slice(0, 20);
                                                }
                                            })
                                            .catch(err => {
                                                console.error('Region API error:', err);
                                            })
                                            .finally(() => {
                                                activeFetchesRef.current[cacheKey] = false;
                                            });
                                        }, 'image/jpeg', 0.85);
                                    }
                                }
                            }
                        };
                        
                        handleBackendDetector(barcode1dDet, 'barcode1dDetector', 'http://localhost:8000/cv/barcode', 'Barcode 1D');
                        handleBackendDetector(barcode2dDet, 'barcode2dDetector', 'http://localhost:8000/cv/barcode', '2D Code');
                        handleBackendDetector(ocrDet, 'ocrDetector', 'http://localhost:8000/cv/ocr', 'OCR Text');
                        
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
                             
                             const edgePoints = [];
                             
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
                                         edgePoints.push({ x, y });
                                     }
                                 }
                             }
                             
                             const detectedW = (maxX >= minX) ? (maxX - minX + 1) : 0;
                             const detectedH = (maxY >= minY) ? (maxY - minY + 1) : 0;
                             const detectedArea = detectedW * detectedH;
                             
                             let measuredValue = 0;
                             let isPass = false;
                             let detectedShape = 'Object';
                             let shapeDiameter = 0;
                             let shapeWidth = 0;
                             let shapeHeight = 0;
                             
                             if (edgeCount >= 8 && detectedW > 4 && detectedH > 4 && detectedArea >= minArea) {
                                 const cx = (minX + maxX) / 2;
                                 const cy = (minY + maxY) / 2;
                                 
                                 let sumDist = 0;
                                 const distances = [];
                                 for (let i = 0; i < edgePoints.length; i++) {
                                     const p = edgePoints[i];
                                     const dx = p.x - cx;
                                     const dy = p.y - cy;
                                     const d = Math.sqrt(dx*dx + dy*dy);
                                     distances.push(d);
                                     sumDist += d;
                                 }
                                 const meanDist = sumDist / edgePoints.length;
                                 
                                 let sumSqDiff = 0;
                                 for (let i = 0; i < distances.length; i++) {
                                     sumSqDiff += (distances[i] - meanDist) * (distances[i] - meanDist);
                                 }
                                 const stdDevDist = Math.sqrt(sumSqDiff / edgePoints.length);
                                 const cvDist = meanDist > 0 ? (stdDevDist / meanDist) : 1;
                                 
                                 const aspect = detectedW / detectedH;
                                 const isRoundAspect = aspect >= 0.75 && aspect <= 1.33;
                                 
                                 if (isRoundAspect && cvDist < 0.09) {
                                     detectedShape = 'Circle';
                                     shapeDiameter = meanDist * 2;
                                 } else if (isRoundAspect && cvDist >= 0.09 && cvDist < 0.17) {
                                     detectedShape = 'Square';
                                     shapeWidth = detectedW;
                                     shapeHeight = detectedH;
                                 } else {
                                     detectedShape = (detectedW === detectedH || (aspect >= 0.9 && aspect <= 1.1)) ? 'Square' : 'Rectangle';
                                     shapeWidth = detectedW;
                                     shapeHeight = detectedH;
                                 }
                                 
                                 const mode = dimDet.measureMode || 'Width';
                                 const unit = dimDet.unit || 'mm';
                                 
                                 const calMmPerPixel = camera?.settings?.mmPerPixel;
                                 const mmPerPixel = (calMmPerPixel && calMmPerPixel > 0) ? calMmPerPixel : 0.1170;
                                 const linearScale = (unit === 'px') ? 1 : ((unit === 'inch') ? (mmPerPixel / 25.4) : mmPerPixel);
                                 
                                 let scale = (mode === 'Area') ? (linearScale * linearScale) : linearScale;

                                 if (unit === 'px') {
                                     if (detectedShape === 'Circle') {
                                         measuredValue = Number(shapeDiameter.toFixed(1));
                                     } else {
                                         if (mode === 'Width') measuredValue = shapeWidth;
                                         else if (mode === 'Height') measuredValue = shapeHeight;
                                         else if (mode === 'Diagonal') measuredValue = Number(Math.sqrt(shapeWidth*shapeWidth + shapeHeight*shapeHeight).toFixed(1));
                                         else if (mode === 'Area') measuredValue = shapeWidth * shapeHeight;
                                     }
                                 } else {
                                     if (mode === 'Width') {
                                         measuredValue = Number(((detectedShape === 'Circle' ? shapeDiameter : shapeWidth) * scale).toFixed(2));
                                     } else if (mode === 'Height') {
                                         measuredValue = Number(((detectedShape === 'Circle' ? shapeDiameter : shapeHeight) * scale).toFixed(2));
                                     } else if (mode === 'Diagonal') {
                                         if (detectedShape === 'Circle') {
                                             measuredValue = Number((shapeDiameter * scale).toFixed(2));
                                         } else {
                                             const diagPixels = Math.sqrt(shapeWidth * shapeWidth + shapeHeight * shapeHeight);
                                             measuredValue = Number((diagPixels * scale).toFixed(2));
                                         }
                                     } else if (mode === 'Area') {
                                         if (detectedShape === 'Circle') {
                                             const areaPixels = Math.PI * (shapeDiameter / 2) * (shapeDiameter / 2);
                                             measuredValue = Number((areaPixels * scale).toFixed(2));
                                         } else {
                                             measuredValue = Number((detectedArea * scale).toFixed(2));
                                         }
                                     }
                                 }
                                 
                                 isPass = measuredValue >= (dimDet.lsl ?? 19.5) && measuredValue <= (dimDet.usl ?? 20.5);
                                 region.objectBox = {
                                     ox: rx + minX,
                                     oy: ry + minY,
                                     ow: detectedW,
                                     oh: detectedH,
                                     shape: detectedShape,
                                     shapeDiameter: detectedShape === 'Circle' ? measuredValue : 0,
                                     shapeWidth: detectedShape !== 'Circle' ? (unit === 'px' ? shapeWidth : Number((shapeWidth * linearScale).toFixed(2))) : 0,
                                     shapeHeight: detectedShape !== 'Circle' ? (unit === 'px' ? shapeHeight : Number((shapeHeight * linearScale).toFixed(2))) : 0,
                                     unit: unit
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
                    const result = detectionResultsRef.current[region.id + '-ocrDetector'];
                    const isPass = result ? result.isPassed : true;
                    borderColor = isPass ? '#ec4899' : '#ef4444';
                    fillStyle = isPass ? 'rgba(236, 72, 153, 0.04)' : 'rgba(239, 68, 68, 0.03)';
                } else if (dimDet && dimDet.enabled) {
                    const isPass = region.lastPassStatus ?? false;
                    borderColor = isPass ? '#10b981' : '#ef4444';
                    fillStyle = isPass ? 'rgba(16, 185, 129, 0.04)' : 'rgba(239, 68, 68, 0.03)';
                } else if (barcode1dDet && barcode1dDet.enabled) {
                    const result = detectionResultsRef.current[region.id + '-barcode1dDetector'];
                    const isPass = result ? result.isPassed : true;
                    borderColor = isPass ? '#38bdf8' : '#ef4444';
                    fillStyle = isPass ? 'rgba(56, 189, 248, 0.04)' : 'rgba(239, 68, 68, 0.03)';
                } else if (barcode2dDet && barcode2dDet.enabled) {
                    const result = detectionResultsRef.current[region.id + '-barcode2dDetector'];
                    const isPass = result ? result.isPassed : true;
                    borderColor = isPass ? '#38bdf8' : '#ef4444';
                    fillStyle = isPass ? 'rgba(56, 189, 248, 0.04)' : 'rgba(239, 68, 68, 0.03)';
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
                    const { ox, oy, ow, oh, shape, shapeDiameter, shapeWidth, shapeHeight, unit } = region.objectBox;
                    const isPass = region.lastPassStatus ?? false;
                    const color = isPass ? '#10b981' : '#ef4444';
                    ctx.strokeStyle = color;
                    ctx.lineWidth = 1.5;
                    ctx.setLineDash([3, 3]);
                    if (shape === 'Circle') {
                        ctx.beginPath();
                        ctx.arc(ox + ow / 2, oy + oh / 2, (ow + oh) / 4, 0, 2 * Math.PI);
                        ctx.stroke();
                    } else {
                        ctx.strokeRect(ox, oy, ow, oh);
                    }
                    ctx.setLineDash([]);
                    
                    // Display size and shape label directly on camera feed
                    ctx.fillStyle = color;
                    ctx.font = 'bold 9px sans-serif';
                    let label = '';
                    if (shape === 'Circle') {
                        label = `Circle d=${shapeDiameter} ${unit}`;
                    } else {
                        label = `${shape} ${shapeWidth}x${shapeHeight} ${unit}`;
                    }
                    ctx.fillText(label, ox, oy - 4);
                }

                // L-shaped corner markers (Tulip-style)
                const cornerSize = Math.min(16, Math.min(region.w, region.h) * 0.25);
                drawCornerMarkers(ctx, region.x, region.y, region.w, region.h, borderColor, cornerSize);

                // Light tint inside region
                ctx.fillStyle = fillStyle;
                ctx.fillRect(region.x + 1, region.y + 1, region.w - 2, region.h - 2);

                // Success Scan Ripple & Glow Animation
                const lastSuccess = lastSuccessTimesRef.current[region.id + '-success'];
                if (lastSuccess && now - lastSuccess < 800) {
                    const elapsed = now - lastSuccess;
                    
                    // Ripple expanding outward
                    const progressRipple = elapsed / 800;
                    const alphaRipple = 1 - progressRipple;
                    const padRipple = progressRipple * 24;
                    ctx.strokeStyle = `rgba(34, 197, 94, ${alphaRipple})`;
                    ctx.lineWidth = 2.5;
                    ctx.strokeRect(region.x - padRipple, region.y - padRipple, region.w + padRipple * 2, region.h + padRipple * 2);
                    
                    // Glow flashing inward
                    const progressGlow = Math.min(1, elapsed / 400);
                    const alphaGlow = 0.25 * (1 - progressGlow);
                    ctx.fillStyle = `rgba(34, 197, 94, ${alphaGlow})`;
                    ctx.fillRect(region.x + 1, region.y + 1, region.w - 2, region.h - 2);

                    // Dynamic scanning bar sweeping down
                    const scanY = region.y + (elapsed / 800) * region.h;
                    ctx.strokeStyle = 'rgba(34, 197, 94, 0.8)';
                    ctx.lineWidth = 2;
                    ctx.shadowColor = '#22c55e';
                    ctx.shadowBlur = 6;
                    ctx.beginPath();
                    ctx.moveTo(region.x, scanY);
                    ctx.lineTo(region.x + region.w, scanY);
                    ctx.stroke();
                    ctx.shadowBlur = 0; // Reset shadow
                }

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

                // Draw active detector icons at top-right of the region box
                const activeIcons = [];
                if (colorDet && colorDet.enabled) activeIcons.push('🎨');
                if (changeDet && changeDet.enabled) activeIcons.push('⚡');
                if (jigDet && jigDet.enabled) activeIcons.push('🧩');
                if (ocrDet && ocrDet.enabled) activeIcons.push('📝');
                if (dimDet && dimDet.enabled) activeIcons.push('📐');
                if (region.detectors?.aiDetector?.enabled) activeIcons.push('🤖');
                if (region.detectors?.countDetector?.enabled) activeIcons.push('🔢');
                if (barcode1dDet && barcode1dDet.enabled) activeIcons.push('📊');
                if (barcode2dDet && barcode2dDet.enabled) activeIcons.push('📱');
                if (region.detectors?.calibrationDetector?.enabled) activeIcons.push('📏');
                
                if (activeIcons.length > 0) {
                    ctx.font = '11px sans-serif';
                    ctx.textAlign = 'right';
                    
                    const iconsText = activeIcons.join(' ');
                    const pillWidth = ctx.measureText(iconsText).width + 10;
                    const pillX = region.x + region.w - 6 - pillWidth;
                    const pillY = region.y + 6;
                    
                    ctx.fillStyle = 'rgba(15, 23, 42, 0.65)';
                    ctx.fillRect(pillX, pillY, pillWidth, 20);
                    
                    ctx.fillStyle = '#ffffff';
                    ctx.fillText(iconsText, region.x + region.w - 11, pillY + 14);
                }

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
                    const result = detectionResultsRef.current[region.id + '-ocrDetector'];
                    const val = result ? result.value : 'OCR Active';
                    ctx.fillStyle = '#ec4899';
                    ctx.font = '600 10px Inter, system-ui, sans-serif';
                    ctx.textAlign = 'left';
                    ctx.fillText(val, region.x + 6, region.y + region.h - 8);
                } else if (dimDet && dimDet.enabled && hasVideoFeed) {
                    const isPass = region.lastPassStatus ?? false;
                    ctx.fillStyle = isPass ? '#10b981' : '#ef4444';
                    ctx.font = '700 10px Inter, system-ui, sans-serif';
                    ctx.textAlign = 'left';
                    const mode = dimDet.measureMode || 'Width';
                    const val = region.measuredValue !== undefined ? region.measuredValue : 0;
                    const shape = region.objectBox?.shape || 'Object';
                    ctx.fillText(`${shape} (${mode}): ${val} ${dimDet.unit ?? 'mm'} (${isPass ? 'PASS' : 'FAIL'})`, region.x + 6, region.y + region.h - 8);
                } else if (barcode1dDet && barcode1dDet.enabled && hasVideoFeed) {
                    const result = detectionResultsRef.current[region.id + '-barcode1dDetector'];
                    const val = result ? result.value : 'Barcode Active';
                    ctx.fillStyle = '#38bdf8';
                    ctx.font = '600 10px Inter, system-ui, sans-serif';
                    ctx.textAlign = 'left';
                    ctx.fillText(val, region.x + 6, region.y + region.h - 8);
                } else if (barcode2dDet && barcode2dDet.enabled && hasVideoFeed) {
                    const result = detectionResultsRef.current[region.id + '-barcode2dDetector'];
                    const val = result ? result.value : '2D Code Active';
                    ctx.fillStyle = '#38bdf8';
                    ctx.font = '600 10px Inter, system-ui, sans-serif';
                    ctx.textAlign = 'left';
                    ctx.fillText(val, region.x + 6, region.y + region.h - 8);
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
            <div style={{ padding: '10px 20px', borderBottom: '1px solid #e5e7eb' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                            <button
                                onClick={onBack}
                                style={{
                                    border: 'none', backgroundColor: 'transparent', color: '#6b7280',
                                    fontWeight: 500, fontSize: '0.82rem', cursor: 'pointer', padding: 0
                                }}
                            >
                                Camera Configurations
                            </button>
                            <span style={{ color: '#9ca3af', fontSize: '0.82rem' }}>/</span>
                            <span style={{ fontWeight: 700, fontSize: '0.82rem', color: '#111827' }}>{camera.name}</span>
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: '2px' }}>
                            For {selectedStation} • {camera.cameraSource === 'IP_CAMERA' ? 'IP Camera' : camera.cameraSource === 'SCREEN_CAPTURE' ? 'Screen Capture' : 'USB Device'}
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <button style={{ 
                            width: '28px', height: '28px', border: '1px solid #e5e7eb', borderRadius: '6px', 
                            backgroundColor: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', 
                            justifyContent: 'center', color: '#6b7280', fontSize: '1rem' 
                        }}>
                            ···
                        </button>
                        <button 
                            onClick={onBack}
                            style={{ 
                                padding: '6px 12px', border: '1px solid #e5e7eb', borderRadius: '6px', 
                                backgroundColor: 'white', fontWeight: 600, fontSize: '0.78rem', color: '#374151', 
                                cursor: 'pointer' 
                            }}
                        >
                            Edit Assignment
                        </button>
                        <button 
                            onClick={handleSaveConfig}
                            disabled={isSaving}
                            style={{ 
                                padding: '6px 14px', border: 'none', borderRadius: '6px', 
                                backgroundColor: '#3b82f6', fontWeight: 700, fontSize: '0.78rem', color: 'white', 
                                cursor: isSaving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                                opacity: isSaving ? 0.7 : 1
                            }}
                        >
                            {isSaving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                            Save Configuration
                        </button>
                    </div>
                </div>
            </div>

            {/* Live View Toolbar */}
            <div style={{ padding: '8px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fafafa' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#374151' }}>Live View</span>
                    <div style={{ width: '1px', height: '14px', backgroundColor: '#d1d5db' }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: hasPermission && !configureOffline ? '#22c55e' : '#9ca3af' }} />
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
                <div className="custom-scrollbar" style={{ flex: 1, backgroundColor: '#f8fafc', padding: '16px', overflowY: 'auto' }}>
                    <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '16px',
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
                                        {camera.cameraSource === 'DEVICE' && availableCameras.length > 1 && (
                                            <select
                                                value={selectedCameraId}
                                                onChange={handleCameraChange}
                                                style={{
                                                    background: '#ffffff',
                                                    color: '#374151',
                                                    border: '1px solid #d1d5db',
                                                    borderRadius: '4px',
                                                    fontSize: '0.65rem',
                                                    padding: '2px 4px',
                                                    maxWidth: '150px',
                                                    cursor: 'pointer',
                                                    marginLeft: '8px'
                                                }}
                                            >
                                                {availableCameras.map(cam => (
                                                    <option key={cam.deviceId} value={cam.deviceId}>
                                                        {cam.label || `Camera ${cam.deviceId.substring(0, 5)}...`}
                                                    </option>
                                                ))}
                                            </select>
                                        )}
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
                        regions.length === 0 ? (
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
                            /* List of existing regions when regions exist but none is selected */
                            <div className="custom-scrollbar" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '20px', overflowY: 'auto' }}>
                                <h3 style={{ fontSize: '0.88rem', fontWeight: 800, color: '#1e293b', marginBottom: '14px' }}>
                                    Active Regions ({regions.length})
                                </h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {regions.map((r, idx) => {
                                        // Find active detectors for this region
                                        const activeDets = [];
                                        if (r.detectors?.colorDetector?.enabled) activeDets.push('Color');
                                        if (r.detectors?.changeDetector?.enabled) activeDets.push('Change');
                                        if (r.detectors?.jigDetector?.enabled) activeDets.push('Jig');
                                        if (r.detectors?.ocrDetector?.enabled) activeDets.push('OCR');
                                        if (r.detectors?.dimensionDetector?.enabled) activeDets.push('Dimension');
                                        if (r.detectors?.aiDetector?.enabled) activeDets.push('AI Anomaly');
                                        if (r.detectors?.countDetector?.enabled) activeDets.push('Count');
                                        if (r.detectors?.barcode1dDetector?.enabled) activeDets.push('Barcode 1D');
                                        if (r.detectors?.barcode2dDetector?.enabled) activeDets.push('2D Code');
                                        if (r.detectors?.calibrationDetector?.enabled) activeDets.push('Calibration');
                                        
                                        return (
                                            <div
                                                key={r.id}
                                                onClick={() => setSelectedRegionId(r.id)}
                                                style={{
                                                    padding: '12px 16px',
                                                    borderRadius: '8px',
                                                    border: '1px solid #e2e8f0',
                                                    backgroundColor: '#ffffff',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.15s',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    gap: '6px'
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.borderColor = '#3b82f6';
                                                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.borderColor = '#e2e8f0';
                                                    e.currentTarget.style.boxShadow = 'none';
                                                }}
                                            >
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>
                                                        {r.name}
                                                    </span>
                                                    <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>
                                                        {r.w}x{r.h} px
                                                    </span>
                                                </div>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                                    {activeDets.length === 0 ? (
                                                        <span style={{ fontSize: '0.65rem', color: '#94a3b8', fontStyle: 'italic' }}>
                                                            No active detectors
                                                        </span>
                                                    ) : (
                                                        activeDets.map(detName => (
                                                            <span
                                                                key={detName}
                                                                style={{
                                                                    padding: '2px 6px',
                                                                    borderRadius: '4px',
                                                                    fontSize: '0.65rem',
                                                                    fontWeight: 600,
                                                                    backgroundColor: '#f1f5f9',
                                                                    color: '#475569'
                                                                }}
                                                            >
                                                                {detName}
                                                            </span>
                                                        ))
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )
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
                                                    { 
                                                        key: 'colorDetector', 
                                                        name: 'Color Inspection', 
                                                        desc: 'Identifies and monitors specific target colors in the region.', 
                                                        color: '#10b981', 
                                                        icon: (
                                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
                                                                <rect width="24" height="24" rx="4" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
                                                                <rect x="5" y="5" width="4.5" height="14" fill="#10b981" />
                                                                <rect x="9.75" y="5" width="4.5" height="14" fill="#3b82f6" />
                                                                <rect x="14.5" y="5" width="4.5" height="14" fill="#ef4444" />
                                                                <rect x="5" y="5" width="14" height="14" stroke="#475569" strokeWidth="1" fill="none" />
                                                            </svg>
                                                        )
                                                    },
                                                    { 
                                                        key: 'changeDetector', 
                                                        name: 'Presence Check', 
                                                        desc: 'Detects visual movement, intrusion, or state change.', 
                                                        color: '#3b82f6', 
                                                        icon: (
                                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
                                                                <rect width="24" height="24" rx="4" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
                                                                <rect x="5" y="5" width="6" height="6" rx="1" fill="#3b82f6" />
                                                                <rect x="13" y="5" width="6" height="6" rx="1" stroke="#3b82f6" strokeWidth="1.5" fill="none" />
                                                                <rect x="5" y="13" width="6" height="6" rx="1" fill="#3b82f6" />
                                                                <rect x="13" y="13" width="6" height="6" rx="1" fill="#3b82f6" />
                                                            </svg>
                                                        )
                                                    },
                                                    { 
                                                        key: 'jigDetector', 
                                                        name: 'Positioning (Jig)', 
                                                        desc: 'Tracks spatial tags, alignment fixtures, or anchors.', 
                                                        color: '#f97316', 
                                                        icon: (
                                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
                                                                <rect width="24" height="24" rx="4" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
                                                                <rect x="5" y="5" width="5" height="5" rx="0.5" transform="rotate(45 7.5 7.5)" fill="#f97316" />
                                                                <rect x="13" y="13" width="5" height="5" rx="0.5" transform="rotate(45 15.5 15.5)" stroke="#f97316" strokeWidth="1.5" fill="none" />
                                                                <path d="M9.5 9.5L13.5 13.5" stroke="#f97316" strokeWidth="1.5" strokeLinecap="round" />
                                                                <path d="M13.5 10.5V13.5H10.5" stroke="#f97316" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                            </svg>
                                                        )
                                                    },
                                                    { 
                                                        key: 'ocrDetector', 
                                                        name: 'Character Recognition', 
                                                        desc: 'Extracts alpha-numeric serials, numbers, or text.', 
                                                        color: '#475569', 
                                                        icon: (
                                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
                                                                <rect width="24" height="24" rx="4" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
                                                                <rect x="4.5" y="6.5" width="15" height="11" rx="1.5" stroke="#475569" strokeWidth="1.5" fill="none" />
                                                                <text x="6" y="14.5" fill="#475569" fontSize="7" fontWeight="bold" fontFamily="monospace">ABC</text>
                                                            </svg>
                                                        )
                                                    },
                                                    { 
                                                        key: 'dimensionDetector', 
                                                        name: 'GD&T Measurement', 
                                                        desc: 'Measures height, width, area, or contours in millimeters.', 
                                                        color: '#3b82f6', 
                                                        icon: (
                                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
                                                                <rect width="24" height="24" rx="4" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
                                                                <circle cx="10" cy="12" r="5" fill="#3b82f6" />
                                                                <line x1="17.5" y1="5" x2="17.5" y2="19" stroke="#1e293b" strokeWidth="1.2" />
                                                                <path d="M15.5 8L17.5 5L19.5 8" stroke="#1e293b" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                                                                <path d="M15.5 16L17.5 19L19.5 16" stroke="#1e293b" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                                                                <line x1="13.5" y1="6" x2="17.5" y2="6" stroke="#475569" strokeWidth="0.8" strokeDasharray="2" />
                                                                <line x1="13.5" y1="18" x2="17.5" y2="18" stroke="#475569" strokeWidth="0.8" strokeDasharray="2" />
                                                            </svg>
                                                        )
                                                    },
                                                    { 
                                                        key: 'aiDetector', 
                                                        name: 'Scratch Inspection', 
                                                        desc: 'Runs industrial Anomaly Detection or defect inspection.', 
                                                        color: '#ef4444', 
                                                        icon: (
                                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
                                                                <rect width="24" height="24" rx="4" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
                                                                <rect x="5" y="5" width="14" height="14" fill="#3b82f6" rx="1" />
                                                                <circle cx="12" cy="12" r="4.5" fill="#10b981" opacity="0.8" />
                                                                <circle cx="12" cy="12" r="2.5" fill="#eab308" opacity="0.9" />
                                                                <circle cx="12" cy="12" r="1.2" fill="#ef4444" />
                                                            </svg>
                                                        )
                                                    },
                                                    { 
                                                        key: 'countDetector', 
                                                        name: 'Count Detector', 
                                                        desc: 'Counts target components, pins, or items within the region.', 
                                                        color: '#3b82f6', 
                                                        icon: (
                                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
                                                                <rect width="24" height="24" rx="4" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
                                                                <circle cx="9.5" cy="14.5" r="5" stroke="#475569" strokeWidth="1.5" fill="white" />
                                                                <circle cx="14.5" cy="9.5" r="5" stroke="#475569" strokeWidth="1.5" fill="white" />
                                                                <text x="7.5" y="17" fill="#2563eb" fontSize="7" fontWeight="900" fontFamily="sans-serif">1</text>
                                                                <text x="12.5" y="12" fill="#2563eb" fontSize="7" fontWeight="900" fontFamily="sans-serif">2</text>
                                                            </svg>
                                                        )
                                                    },
                                                    { 
                                                        key: 'barcode1dDetector', 
                                                        name: '1D Code Reader', 
                                                        desc: 'Scans and decodes linear barcodes (Code39, Code128, etc.)', 
                                                        color: '#1e293b', 
                                                        icon: (
                                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
                                                                <rect width="24" height="24" rx="4" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
                                                                <rect x="4" y="5" width="2" height="14" fill="#1e293b" />
                                                                <rect x="7" y="5" width="1" height="14" fill="#1e293b" />
                                                                <rect x="9" y="5" width="3" height="14" fill="#1e293b" />
                                                                <rect x="13" y="5" width="1" height="14" fill="#1e293b" />
                                                                <rect x="15" y="5" width="2" height="14" fill="#1e293b" />
                                                                <rect x="18" y="5" width="2" height="14" fill="#1e293b" />
                                                            </svg>
                                                        )
                                                    },
                                                    { 
                                                        key: 'barcode2dDetector', 
                                                        name: '2D Code Reader', 
                                                        desc: 'Scans and decodes QR codes and DataMatrix symbols', 
                                                        color: '#1e293b', 
                                                        icon: (
                                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
                                                                <rect width="24" height="24" rx="4" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
                                                                <rect x="4" y="4" width="6" height="6" fill="#1e293b" />
                                                                <rect x="5" y="5" width="4" height="4" fill="white" />
                                                                <rect x="6" y="6" width="2" height="2" fill="#1e293b" />
                                                                <rect x="14" y="4" width="6" height="6" fill="#1e293b" />
                                                                <rect x="15" y="5" width="4" height="4" fill="white" />
                                                                <rect x="16" y="6" width="2" height="2" fill="#1e293b" />
                                                                <rect x="4" y="14" width="6" height="6" fill="#1e293b" />
                                                                <rect x="5" y="15" width="4" height="4" fill="white" />
                                                                <rect x="6" y="16" width="2" height="2" fill="#1e293b" />
                                                                <rect x="14" y="14" width="2" height="2" fill="#1e293b" />
                                                                <rect x="18" y="14" width="2" height="2" fill="#1e293b" />
                                                            </svg>
                                                        )
                                                    },
                                                    { 
                                                        key: 'calibrationDetector', 
                                                        name: 'Calibration Tool', 
                                                        desc: 'Verifies calibration grids or active coordinate mapping', 
                                                        color: '#ec4899', 
                                                        icon: (
                                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
                                                                <rect width="24" height="24" rx="4" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
                                                                <rect x="4" y="4" width="4" height="4" fill="#ec4899" />
                                                                <rect x="12" y="4" width="4" height="4" fill="#ec4899" />
                                                                <rect x="8" y="8" width="4" height="4" fill="#ec4899" />
                                                                <rect x="16" y="8" width="4" height="4" fill="#ec4899" />
                                                                <rect x="4" y="12" width="4" height="4" fill="#ec4899" />
                                                                <rect x="12" y="12" width="4" height="4" fill="#ec4899" />
                                                                <rect x="8" y="16" width="4" height="4" fill="#ec4899" />
                                                                <rect x="16" y="16" width="4" height="4" fill="#ec4899" />
                                                            </svg>
                                                        )
                                                    }
                                                ].map(opt => {
                                                    const isEnabled = selectedRegion.detectors?.[opt.key]?.enabled;
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
                                                                    if (opt.key === 'aiDetector') setAiDetectorExpanded(true);
                                                                    if (opt.key === 'countDetector') setCountDetectorExpanded(true);
                                                                    if (opt.key === 'barcode1dDetector') setBarcode1dDetectorExpanded(true);
                                                                    if (opt.key === 'barcode2dDetector') setBarcode2dDetectorExpanded(true);
                                                                    if (opt.key === 'calibrationDetector') setCalibrationDetectorExpanded(true);
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
                                                                {opt.icon}
                                                            </div>
                                                            <div style={{ flex: 1 }}>
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                    <span style={{ fontSize: '0.82rem', fontWeight: 800, color: isEnabled ? '#94a3b8' : '#1e293b' }}>
                                                                        {opt.name}
                                                                    </span>
                                                                    {isEnabled && (
                                                                        <span style={{ fontSize: '0.62rem', fontWeight: 700, backgroundColor: '#f1f5f9', color: '#64748b', padding: '2px 6px', borderRadius: '4px' }}>
                                                                            Active
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <p style={{ margin: '4px 0 0 0', fontSize: '0.72rem', color: isEnabled ? '#cbd5e1' : '#64748b', lineHeight: 1.4 }}>{opt.desc}</p>
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
                                   selectedRegion.detectors?.dimensionDetector?.enabled ||
                                   selectedRegion.detectors?.aiDetector?.enabled ||
                                   selectedRegion.detectors?.countDetector?.enabled ||
                                   selectedRegion.detectors?.barcode1dDetector?.enabled ||
                                   selectedRegion.detectors?.barcode2dDetector?.enabled ||
                                   selectedRegion.detectors?.calibrationDetector?.enabled) ? (
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

                                                        {/* Show info about integrated camera calibration */}
                                                        {selectedRegion.detectors.dimensionDetector.unit !== 'px' && (
                                                            <div style={{
                                                                padding: '8px 12px',
                                                                backgroundColor: '#eff6ff',
                                                                border: '1px solid #bfdbfe',
                                                                borderRadius: '6px',
                                                                fontSize: '0.72rem',
                                                                color: '#1e40af',
                                                                display: 'flex',
                                                                flexDirection: 'column',
                                                                gap: '2px',
                                                                marginTop: '2px'
                                                            }}>
                                                                <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                                    <Info size={13} /> Camera Calibration Integrated
                                                                </div>
                                                                <div>Active Scale: <strong>{(camera?.settings?.mmPerPixel || 0.1170).toFixed(5)} mm/px</strong></div>
                                                                <div style={{ fontSize: '0.65rem', color: '#60a5fa' }}>Configured in Camera Calibration menu</div>
                                                            </div>
                                                        )}

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

                                        {/* 6. AI Detector */}
                                        {selectedRegion.detectors?.aiDetector?.enabled && (
                                            <div style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                <div 
                                                    style={{ 
                                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                                                        padding: '12px 20px', cursor: 'pointer', transition: 'background-color 0.15s',
                                                        backgroundColor: aiDetectorExpanded ? '#f8fafc' : 'transparent'
                                                    }}
                                                    onClick={() => setAiDetectorExpanded(prev => !prev)}
                                                >
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                        {aiDetectorExpanded ? <ChevronDown size={14} color="#64748b" /> : <ChevronDown size={14} color="#64748b" style={{ transform: 'rotate(-90deg)', transition: 'transform 0.15s' }} />}
                                                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#f59e0b' }} />
                                                        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>
                                                            {selectedRegion.detectors.aiDetector.name || `${selectedRegion.name} AI`}
                                                        </span>
                                                    </div>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (confirm('Remove AI Detector from this region?')) {
                                                                toggleDetector(selectedRegion.id, 'aiDetector', false);
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

                                                {aiDetectorExpanded && (
                                                    <div style={{ padding: '12px 20px 18px 44px', display: 'flex', flexDirection: 'column', gap: '14px', backgroundColor: '#f8fafc' }}>
                                                        {/* Model Type */}
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>AI Inspection Type</span>
                                                            <select
                                                                value={selectedRegion.detectors.aiDetector.modelType || 'anomaly'}
                                                                onChange={(e) => updateAiDetectorSetting(selectedRegion.id, 'modelType', e.target.value)}
                                                                style={{ padding: '7px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.82rem', backgroundColor: 'white', width: '100%', outline: 'none' }}
                                                            >
                                                                <option value="anomaly">Anomaly Detection (PatchCore)</option>
                                                                <option value="classification">Classification (Transfer Learning)</option>
                                                                <option value="segmentation">Segmentation (U-Net)</option>
                                                            </select>
                                                        </div>

                                                        {/* Model Name Select (Filtered by type) */}
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>Select Trained Model</span>
                                                            <select
                                                                value={selectedRegion.detectors.aiDetector.modelName || 'default'}
                                                                onChange={(e) => updateAiDetectorSetting(selectedRegion.id, 'modelName', e.target.value)}
                                                                style={{ padding: '7px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.82rem', backgroundColor: 'white', width: '100%', outline: 'none' }}
                                                            >
                                                                <option value="default">default</option>
                                                                {editorAiModels
                                                                    .filter(m => m.model_type === (selectedRegion.detectors.aiDetector.modelType || 'anomaly'))
                                                                    .map((m, idx) => (
                                                                        <option key={idx} value={m.model_name}>{m.model_name}</option>
                                                                    ))
                                                                }
                                                            </select>
                                                        </div>

                                                        {/* Type Specific Threshold Settings */}
                                                        {(selectedRegion.detectors.aiDetector.modelType || 'anomaly') === 'anomaly' && (
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>Anomaly Score Threshold</span>
                                                                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f59e0b' }}>
                                                                        {selectedRegion.detectors.aiDetector.anomalyThreshold ?? 0.5}
                                                                    </span>
                                                                </div>
                                                                <input
                                                                    type="range" min="0.05" max="1.0" step="0.05"
                                                                    value={selectedRegion.detectors.aiDetector.anomalyThreshold ?? 0.5}
                                                                    onChange={(e) => updateAiDetectorSetting(selectedRegion.id, 'anomalyThreshold', Number(e.target.value))}
                                                                    style={{ height: '4px', cursor: 'pointer' }}
                                                                />
                                                                <span style={{ fontSize: '0.65rem', color: '#64748b' }}>If anomaly score is higher than threshold, region fails (NG).</span>
                                                            </div>
                                                        )}

                                                        {(selectedRegion.detectors.aiDetector.modelType || 'anomaly') === 'classification' && (
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                                                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>Expected PASS Class Label</span>
                                                                <input
                                                                    type="text"
                                                                    placeholder="e.g. ok"
                                                                    value={selectedRegion.detectors.aiDetector.expectedClass || 'ok'}
                                                                    onChange={(e) => updateAiDetectorSetting(selectedRegion.id, 'expectedClass', e.target.value)}
                                                                    style={{ padding: '7px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.82rem', width: '100%', outline: 'none' }}
                                                                />
                                                                <span style={{ fontSize: '0.65rem', color: '#64748b' }}>Region passes ONLY if the predicted class matches this label.</span>
                                                            </div>
                                                        )}

                                                        {(selectedRegion.detectors.aiDetector.modelType || 'anomaly') === 'segmentation' && (
                                                            <>
                                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>Segmentation Pixel Threshold</span>
                                                                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#ef4444' }}>
                                                                            {selectedRegion.detectors.aiDetector.threshold ?? 0.5}
                                                                        </span>
                                                                    </div>
                                                                    <input
                                                                        type="range" min="0.1" max="0.9" step="0.05"
                                                                        value={selectedRegion.detectors.aiDetector.threshold ?? 0.5}
                                                                        onChange={(e) => updateAiDetectorSetting(selectedRegion.id, 'threshold', Number(e.target.value))}
                                                                        style={{ height: '4px', cursor: 'pointer' }}
                                                                    />
                                                                </div>
                                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>Max Defect Area Limit (px)</span>
                                                                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#ef4444' }}>
                                                                            {selectedRegion.detectors.aiDetector.defectAreaLimit ?? 100} px
                                                                        </span>
                                                                    </div>
                                                                    <input
                                                                        type="range" min="10" max="5000" step="50"
                                                                        value={selectedRegion.detectors.aiDetector.defectAreaLimit ?? 100}
                                                                        onChange={(e) => updateAiDetectorSetting(selectedRegion.id, 'defectAreaLimit', Number(e.target.value))}
                                                                        style={{ height: '4px', cursor: 'pointer' }}
                                                                    />
                                                                    <span style={{ fontSize: '0.65rem', color: '#64748b' }}>If defect pixel area is higher than this, region fails.</span>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* 7. Count Detector */}
                                        {selectedRegion.detectors?.countDetector?.enabled && (
                                            <div style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                <div 
                                                    style={{ 
                                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                                                        padding: '12px 20px', cursor: 'pointer', transition: 'background-color 0.15s',
                                                        backgroundColor: countDetectorExpanded ? '#f8fafc' : 'transparent'
                                                    }}
                                                    onClick={() => setCountDetectorExpanded(prev => !prev)}
                                                >
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                        {countDetectorExpanded ? <ChevronDown size={14} color="#64748b" /> : <ChevronDown size={14} color="#64748b" style={{ transform: 'rotate(-90deg)', transition: 'transform 0.15s' }} />}
                                                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#3b82f6' }} />
                                                        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>
                                                            {selectedRegion.detectors.countDetector.name || `${selectedRegion.name} Count`}
                                                        </span>
                                                    </div>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (confirm('Remove Count Detector from this region?')) {
                                                                toggleDetector(selectedRegion.id, 'countDetector', false);
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

                                                {countDetectorExpanded && (
                                                    <div style={{ padding: '12px 20px 18px 44px', display: 'flex', flexDirection: 'column', gap: '14px', backgroundColor: '#f8fafc' }}>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>Target Object Class (YOLO)</span>
                                                            <input
                                                                type="text"
                                                                value={selectedRegion.detectors.countDetector.targetClass || 'object'}
                                                                onChange={(e) => updateGenericDetectorSetting(selectedRegion.id, 'countDetector', 'targetClass', e.target.value)}
                                                                style={{ padding: '7px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.82rem', width: '100%', outline: 'none' }}
                                                            />
                                                        </div>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>Expected Count</span>
                                                            <input
                                                                type="number" min="1"
                                                                value={selectedRegion.detectors.countDetector.expectedCount ?? 1}
                                                                onChange={(e) => updateGenericDetectorSetting(selectedRegion.id, 'countDetector', 'expectedCount', Number(e.target.value))}
                                                                style={{ padding: '7px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.82rem', width: '100%', outline: 'none' }}
                                                            />
                                                        </div>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>Confidence Threshold (%)</span>
                                                            <input
                                                                type="number" min="1" max="100"
                                                                value={selectedRegion.detectors.countDetector.confidenceThreshold ?? 50}
                                                                onChange={(e) => updateGenericDetectorSetting(selectedRegion.id, 'countDetector', 'confidenceThreshold', Number(e.target.value))}
                                                                style={{ padding: '7px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.82rem', width: '100%', outline: 'none' }}
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                                  {/* 8. 1D Code Reader */}
                                        {selectedRegion.detectors?.barcode1dDetector?.enabled && (
                                            <div style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                <div 
                                                    style={{ 
                                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                                                        padding: '12px 20px', cursor: 'pointer', transition: 'background-color 0.15s',
                                                        backgroundColor: barcode1dDetectorExpanded ? '#f8fafc' : 'transparent'
                                                     }}
                                                    onClick={() => setBarcode1dDetectorExpanded(prev => !prev)}
                                                >
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                        {barcode1dDetectorExpanded ? <ChevronDown size={14} color="#64748b" /> : <ChevronDown size={14} color="#64748b" style={{ transform: 'rotate(-90deg)', transition: 'transform 0.15s' }} />}
                                                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#3b82f6' }} />
                                                        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>
                                                            {selectedRegion.detectors?.barcode1dDetector?.name || `${selectedRegion.name} Barcode`}
                                                        </span>
                                                    </div>
                                                    <button
                                                        onClick={(e) => {
                                                             e.stopPropagation();
                                                             if (confirm('Remove Barcode Reader from this region?')) {
                                                                 toggleDetector(selectedRegion.id, 'barcode1dDetector', false);
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
 
                                                {barcode1dDetectorExpanded && (
                                                    <div style={{ padding: '12px 20px 18px 44px', display: 'flex', flexDirection: 'column', gap: '14px', backgroundColor: '#f8fafc' }}>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>Symbology Filter</span>
                                                            <select
                                                                value={selectedRegion.detectors?.barcode1dDetector?.barcodeType || 'ANY'}
                                                                onChange={(e) => updateGenericDetectorSetting(selectedRegion.id, 'barcode1dDetector', 'barcodeType', e.target.value)}
                                                                style={{ padding: '7px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.82rem', backgroundColor: 'white', width: '100%', outline: 'none' }}
                                                            >
                                                                <option value="ANY">Any Barcode Type</option>
                                                                <option value="CODE128">Code 128</option>
                                                                <option value="CODE39">Code 39</option>
                                                                <option value="EAN13">EAN-13 / UPC</option>
                                                            </select>
                                                        </div>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>Expected Value (Match Pattern)</span>
                                                            <input
                                                                type="text"
                                                                placeholder="e.g. PROD-* (Optional)"
                                                                value={selectedRegion.detectors?.barcode1dDetector?.expectedValue || ''}
                                                                onChange={(e) => updateGenericDetectorSetting(selectedRegion.id, 'barcode1dDetector', 'expectedValue', e.target.value)}
                                                                style={{ padding: '7px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.82rem', width: '100%', outline: 'none' }}
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
 
                                        {/* 9. 2D Code Reader */}
                                        {selectedRegion.detectors?.barcode2dDetector?.enabled && (
                                            <div style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                <div 
                                                    style={{ 
                                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                                                        padding: '12px 20px', cursor: 'pointer', transition: 'background-color 0.15s',
                                                        backgroundColor: barcode2dDetectorExpanded ? '#f8fafc' : 'transparent'
                                                     }}
                                                    onClick={() => setBarcode2dDetectorExpanded(prev => !prev)}
                                                >
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                        {barcode2dDetectorExpanded ? <ChevronDown size={14} color="#64748b" /> : <ChevronDown size={14} color="#64748b" style={{ transform: 'rotate(-90deg)', transition: 'transform 0.15s' }} />}
                                                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#3b82f6' }} />
                                                        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>
                                                            {selectedRegion.detectors?.barcode2dDetector?.name || `${selectedRegion.name} 2D Code`}
                                                        </span>
                                                    </div>
                                                    <button
                                                        onClick={(e) => {
                                                             e.stopPropagation();
                                                             if (confirm('Remove 2D Code Reader from this region?')) {
                                                                 toggleDetector(selectedRegion.id, 'barcode2dDetector', false);
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
 
                                                {barcode2dDetectorExpanded && (
                                                    <div style={{ padding: '12px 20px 18px 44px', display: 'flex', flexDirection: 'column', gap: '14px', backgroundColor: '#f8fafc' }}>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>Code Format</span>
                                                            <select
                                                                value={selectedRegion.detectors?.barcode2dDetector?.codeType || 'ANY'}
                                                                onChange={(e) => updateGenericDetectorSetting(selectedRegion.id, 'barcode2dDetector', 'codeType', e.target.value)}
                                                                style={{ padding: '7px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.82rem', backgroundColor: 'white', width: '100%', outline: 'none' }}
                                                            >
                                                                <option value="ANY">QR or DataMatrix</option>
                                                                <option value="QR">QR Code</option>
                                                                <option value="DATAMATRIX">DataMatrix</option>
                                                            </select>
                                                        </div>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>Expected Value (Match Pattern)</span>
                                                            <input
                                                                type="text"
                                                                placeholder="e.g. SN-*"
                                                                value={selectedRegion.detectors?.barcode2dDetector?.expectedValue || ''}
                                                                onChange={(e) => updateGenericDetectorSetting(selectedRegion.id, 'barcode2dDetector', 'expectedValue', e.target.value)}
                                                                style={{ padding: '7px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.82rem', width: '100%', outline: 'none' }}
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
 
                                        {/* 10. Calibration Tool */}
                                        {selectedRegion.detectors?.calibrationDetector?.enabled && (
                                            <div style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                <div 
                                                    style={{ 
                                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                                                        padding: '12px 20px', cursor: 'pointer', transition: 'background-color 0.15s',
                                                        backgroundColor: calibrationDetectorExpanded ? '#f8fafc' : 'transparent'
                                                     }}
                                                    onClick={() => setCalibrationDetectorExpanded(prev => !prev)}
                                                >
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                        {calibrationDetectorExpanded ? <ChevronDown size={14} color="#64748b" /> : <ChevronDown size={14} color="#64748b" style={{ transform: 'rotate(-90deg)', transition: 'transform 0.15s' }} />}
                                                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#3b82f6' }} />
                                                        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>
                                                            {selectedRegion.detectors?.calibrationDetector?.name || `${selectedRegion.name} Calibration`}
                                                        </span>
                                                    </div>
                                                    <button
                                                        onClick={(e) => {
                                                             e.stopPropagation();
                                                             if (confirm('Remove Calibration Tool from this region?')) {
                                                                 toggleDetector(selectedRegion.id, 'calibrationDetector', false);
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
 
                                                {calibrationDetectorExpanded && (
                                                    <div style={{ padding: '12px 20px 18px 44px', display: 'flex', flexDirection: 'column', gap: '14px', backgroundColor: '#f8fafc' }}>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>Calibration Type</span>
                                                            <select
                                                                value={selectedRegion.detectors?.calibrationDetector?.calibrationType || 'Scale Factor'}
                                                                onChange={(e) => updateGenericDetectorSetting(selectedRegion.id, 'calibrationDetector', 'calibrationType', e.target.value)}
                                                                style={{ padding: '7px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.82rem', backgroundColor: 'white', width: '100%', outline: 'none' }}
                                                            >
                                                                <option value="Scale Factor">Linear Scale Factor (mm/px)</option>
                                                                <option value="Lens Distortion">OpenCV Chessboard Calibration</option>
                                                            </select>
                                                        </div>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>Active Calibration Status</span>
                                                            <div style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#22c55e' }} />
                                                                <span>Camera matrix loaded & active</span>
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

// ─── MAVi-STYLE HTML5 DRAWING & PAINT CANVAS OVERLAY MODAL ────────────────
function DefectPainterModal({ image, datasetName, onClose }) {
    const canvasRef = useRef(null);
    const contextRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [brushSize, setBrushSize] = useState(15);
    const [toolMode, setToolMode] = useState('paint'); // 'paint' | 'erase' | 'polygon'
    const [isSaving, setIsSaving] = useState(false);
    
    // Polygon variables
    const [polygonPoints, setPolygonPoints] = useState([]);
    
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = `http://localhost:8000/ai/dataset/image?dataset_name=${datasetName}&relative_path=${encodeURIComponent(image.relative_path)}`;
        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            
            const context = canvas.getContext('2d');
            context.lineCap = 'round';
            context.lineJoin = 'round';
            contextRef.current = context;
            
            if (image.has_mask) {
                const maskImg = new Image();
                maskImg.crossOrigin = 'anonymous';
                maskImg.src = `http://localhost:8000/ai/dataset/mask?dataset_name=${datasetName}&filename=${image.filename}`;
                maskImg.onload = () => {
                    const tempCanvas = document.createElement('canvas');
                    tempCanvas.width = img.width;
                    tempCanvas.height = img.height;
                    const tempCtx = tempCanvas.getContext('2d');
                    tempCtx.drawImage(maskImg, 0, 0);
                    
                    const imgData = tempCtx.getImageData(0, 0, img.width, img.height);
                    const data = imgData.data;
                    for (let i = 0; i < data.length; i += 4) {
                        const r = data[i];
                        const g = data[i+1];
                        const b = data[i+2];
                        if (r > 127 && g > 127 && b > 127) {
                            data[i] = 255;
                            data[i+1] = 0;
                            data[i+2] = 0;
                            data[i+3] = 160;
                        } else {
                            data[i+3] = 0;
                        }
                    }
                    tempCtx.putImageData(imgData, 0, 0);
                    context.drawImage(tempCanvas, 0, 0);
                };
            }
        };
    }, [image, datasetName]);

    const getCanvasCoordinates = (e) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        
        let clientX, clientY;
        if (e.touches && e.touches.length > 0) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }
        
        const x = ((clientX - rect.left) / rect.width) * canvas.width;
        const y = ((clientY - rect.top) / rect.height) * canvas.height;
        return { x, y };
    };

    const startDrawing = (e) => {
        if (toolMode === 'polygon') {
            const { x, y } = getCanvasCoordinates(e);
            setPolygonPoints(prev => [...prev, { x, y }]);
            return;
        }
        
        const { x, y } = getCanvasCoordinates(e);
        const ctx = contextRef.current;
        ctx.beginPath();
        ctx.moveTo(x, y);
        
        if (toolMode === 'paint') {
            ctx.strokeStyle = 'rgba(255, 0, 0, 0.6)';
            ctx.globalCompositeOperation = 'source-over';
        } else if (toolMode === 'erase') {
            ctx.globalCompositeOperation = 'destination-out';
        }
        
        ctx.lineWidth = brushSize;
        setIsDrawing(true);
    };

    const draw = (e) => {
        if (!isDrawing || toolMode === 'polygon') return;
        const { x, y } = getCanvasCoordinates(e);
        const ctx = contextRef.current;
        ctx.lineTo(x, y);
        ctx.stroke();
    };

    const stopDrawing = () => {
        if (toolMode === 'polygon') return;
        setIsDrawing(false);
    };

    const fillPolygon = () => {
        if (polygonPoints.length < 3) {
            alert('Silakan pilih minimal 3 titik koordinat untuk membuat polygon.');
            return;
        }
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = 'rgba(255, 0, 0, 0.6)';
        ctx.beginPath();
        ctx.moveTo(polygonPoints[0].x, polygonPoints[0].y);
        for (let i = 1; i < polygonPoints.length; i++) {
            ctx.lineTo(polygonPoints[i].x, polygonPoints[i].y);
        }
        ctx.closePath();
        ctx.fill();
        setPolygonPoints([]);
    };

    const clearDrawing = () => {
        if (!confirm('Apakah Anda yakin ingin menghapus semua coretan lukis?')) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setPolygonPoints([]);
    };

    const handleSaveMask = async () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        setIsSaving(true);
        try {
            const binaryCanvas = document.createElement('canvas');
            binaryCanvas.width = canvas.width;
            binaryCanvas.height = canvas.height;
            const bCtx = binaryCanvas.getContext('2d');
            
            bCtx.fillStyle = '#000000';
            bCtx.fillRect(0, 0, canvas.width, canvas.height);
            bCtx.drawImage(canvas, 0, 0);
            
            const imgData = bCtx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imgData.data;
            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i+1];
                const b = data[i+2];
                if (r > 0 || g > 0 || b > 0) {
                    data[i] = 255;
                    data[i+1] = 255;
                    data[i+2] = 255;
                } else {
                    data[i] = 0;
                    data[i+1] = 0;
                    data[i+2] = 0;
                }
                data[i+3] = 255;
            }
            bCtx.putImageData(imgData, 0, 0);
            
            binaryCanvas.toBlob(async (blob) => {
                if (!blob) {
                    throw new Error('Gagal merender data blob dari kanvas.');
                }
                
                const formData = new FormData();
                formData.append('mask_file', blob, `${image.filename}`);
                formData.append('dataset_name', datasetName);
                formData.append('filename', image.filename);
                
                const res = await fetch('http://localhost:8000/ai/dataset/upload_mask', {
                    method: 'POST',
                    body: formData
                });
                const responseData = await res.json();
                if (responseData.success) {
                    alert('Mask berhasil disimpan ke server!');
                    onClose();
                } else {
                    alert(`Gagal menyimpan mask: ${responseData.error}`);
                }
            }, 'image/png');
        } catch (err) {
            alert(`Error: ${err.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(8px)',
            zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
            <div style={{
                backgroundColor: 'white', borderRadius: '20px', width: '95%', height: '90%', maxWidth: '1200px',
                display: 'grid', gridTemplateColumns: '260px 1fr', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
            }}>
                <div style={{ backgroundColor: '#f8fafc', borderRight: '1px solid #cbd5e1', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 900, color: '#0f172a' }}>🎨 Paint defect areas</h3>
                        <p style={{ margin: '4px 0 0 0', fontSize: '0.72rem', color: '#64748b', lineHeight: 1.4 }}>
                            Warnai bagian yang terdapat cacat/defect dengan warna merah. Area ini akan digunakan untuk melatih AI mendeteksi cacat.
                        </p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#475569' }}>LUKIS DENGAN ALAT</span>
                        {[
                            { id: 'paint', label: '🖌️ Kuas (Brush Paint)', desc: 'Lukis cacat secara manual' },
                            { id: 'erase', label: '🧽 Penghapus (Eraser)', desc: 'Hapus goresan merah' },
                            { id: 'polygon', label: '📐 Polygon Point', desc: 'Klik titik pembatas' }
                        ].map(mode => (
                            <button
                                key={mode.id}
                                onClick={() => {
                                    setToolMode(mode.id);
                                    setPolygonPoints([]);
                                }}
                                style={{
                                    textAlign: 'left', padding: '10px 14px', borderRadius: '10px', cursor: 'pointer',
                                    border: toolMode === mode.id ? '2px solid #7c3aed' : '1px solid #cbd5e1',
                                    backgroundColor: toolMode === mode.id ? '#f5f3ff' : 'white',
                                    transition: 'all 0.15s'
                                }}
                            >
                                <div style={{ fontSize: '0.78rem', fontWeight: 800, color: toolMode === mode.id ? '#6d28d9' : '#1e293b' }}>{mode.label}</div>
                                <div style={{ fontSize: '0.62rem', color: '#64748b', marginTop: '2px' }}>{mode.desc}</div>
                            </button>
                        ))}
                    </div>

                    {toolMode === 'polygon' && (
                        <div style={{ backgroundColor: '#eff6ff', padding: '12px', borderRadius: '10px', border: '1px solid #bfdbfe' }}>
                            <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#1e3a8a', marginBottom: '4px' }}>📐 MODE POLYGON</div>
                            <div style={{ fontSize: '0.62rem', color: '#3b82f6', lineHeight: 1.3, marginBottom: '8px' }}>
                                Klik beberapa kali pada tepi area cacat untuk membuat simpul titik, lalu tekan tombol "Tutup & Isi Polygon".
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                    onClick={fillPolygon}
                                    style={{
                                        flex: 1, padding: '6px 8px', border: 'none', backgroundColor: '#3b82f6',
                                        color: 'white', fontSize: '0.68rem', fontWeight: 800, borderRadius: '6px', cursor: 'pointer'
                                    }}
                                >
                                    Tutup & Isi
                                </button>
                                <button
                                    onClick={() => setPolygonPoints([])}
                                    style={{
                                        padding: '6px 8px', border: '1px solid #bfdbfe', backgroundColor: 'white',
                                        color: '#3b82f6', fontSize: '0.68rem', fontWeight: 800, borderRadius: '6px', cursor: 'pointer'
                                    }}
                                >
                                    Batal
                                </button>
                            </div>
                            {polygonPoints.length > 0 && (
                                <div style={{ fontSize: '0.6rem', color: '#475569', marginTop: '6px', fontWeight: 700 }}>
                                    Titik terpilih: {polygonPoints.length}
                                </div>
                            )}
                        </div>
                    )}

                    {toolMode !== 'polygon' && (
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', fontWeight: 800, color: '#475569', marginBottom: '6px' }}>
                                <span>UKURAN KUAS</span>
                                <span>{brushSize} px</span>
                            </div>
                            <input
                                type="range"
                                min="2"
                                max="80"
                                value={brushSize}
                                onChange={(e) => setBrushSize(Number(e.target.value))}
                                style={{ width: '100%', accentColor: '#7c3aed', cursor: 'pointer' }}
                            />
                        </div>
                    )}

                    <button
                        onClick={clearDrawing}
                        style={{
                            width: '100%', padding: '10px', border: '1px dashed #ef4444', color: '#ef4444',
                            borderRadius: '8px', fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer',
                            backgroundColor: 'transparent', transition: 'all 0.15s', marginTop: 'auto'
                        }}
                    >
                        🗑️ Bersihkan Semua Coretan
                    </button>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <button
                            onClick={handleSaveMask}
                            disabled={isSaving}
                            style={{
                                width: '100%', padding: '12px', border: 'none', backgroundColor: '#22c55e',
                                color: 'white', borderRadius: '10px', fontSize: '0.78rem', fontWeight: 800,
                                cursor: isSaving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                                boxShadow: '0 4px 6px -1px rgba(34,197,94,0.2)'
                            }}
                        >
                            {isSaving ? <Loader2 size={14} className="animate-spin" /> : '💾 Simpan Mask ke Server'}
                        </button>
                        <button
                            onClick={onClose}
                            style={{
                                width: '100%', padding: '10px', border: '1px solid #cbd5e1', backgroundColor: 'white',
                                color: '#475569', borderRadius: '10px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer'
                            }}
                        >
                            Kembali (Batal)
                        </button>
                    </div>
                </div>

                <div style={{ backgroundColor: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', padding: '20px' }}>
                    <div style={{ position: 'relative', maxWidth: '100%', maxHeight: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img
                            src={`http://localhost:8000/ai/dataset/image?dataset_name=${datasetName}&relative_path=${encodeURIComponent(image.relative_path)}`}
                            alt={image.filename}
                            style={{ maxWidth: '100%', maxHeight: '75vh', objectFit: 'contain', pointerEvents: 'none', userSelect: 'none' }}
                        />
                        
                        <canvas
                            ref={canvasRef}
                            onMouseDown={startDrawing}
                            onMouseMove={draw}
                            onMouseUp={stopDrawing}
                            onMouseLeave={stopDrawing}
                            onTouchStart={startDrawing}
                            onTouchMove={draw}
                            onTouchEnd={stopDrawing}
                            style={{
                                position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                                objectFit: 'contain', cursor: toolMode === 'paint' ? 'crosshair' : toolMode === 'erase' ? 'pointer' : 'cell',
                                zIndex: 10
                            }}
                        />

                        {toolMode === 'polygon' && polygonPoints.length > 0 && (
                            <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 11 }}>
                                {polygonPoints.map((pt, idx) => {
                                    const nextPt = polygonPoints[idx + 1] || null;
                                    
                                    const canvas = canvasRef.current;
                                    if (!canvas) return null;
                                    const rect = canvas.getBoundingClientRect();
                                    
                                    const screenX = (pt.x / canvas.width) * rect.width;
                                    const screenY = (pt.y / canvas.height) * rect.height;
                                    
                                    let nextScreenX = null, nextScreenY = null;
                                    if (nextPt) {
                                        nextScreenX = (nextPt.x / canvas.width) * rect.width;
                                        nextScreenY = (nextPt.y / canvas.height) * rect.height;
                                    }
                                    
                                    return (
                                        <g key={idx}>
                                            <circle cx={screenX} cy={screenY} r="5" fill="#ef4444" stroke="white" strokeWidth="1.5" />
                                            {nextPt && (
                                                <line x1={screenX} y1={screenY} x2={nextScreenX} y2={nextScreenY} stroke="#ef4444" strokeWidth="2" strokeDasharray="3 3" />
                                            )}
                                        </g>
                                    );
                                })}
                            </svg>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── INTERACTIVE MAVi AI USE CASES CONFIGURATION GUIDE ────────────────────
function AiGuideView() {
    const [activeCaseId, setActiveCaseId] = useState('general_workflow_guide');

    const categories = [
        {
            name: "MAVi Workflow Guide",
            icon: "🚀",
            cases: [
                {
                    id: "general_workflow_guide",
                    title: "Panduan Integrasi MAVi A-Z: Dari Kamera Hingga App Builder & Live Player",
                    mode: "Panduan Alur Sistem Lengkap",
                    image: "/assets/shop-floor-connectivity.png",
                    desc: "Panduan terstruktur langkah-demi-langkah bagi operator dan sistem integrator untuk menyetujui, melatih, menghubungkan, dan menjalankan sistem visual inspeksi otomatis berbasis MAVi AI.",
                    setup: [
                        "LANGKAH 1: KONFIGURASI KAMERA & DATASET (Camera & Dataset) — Pergi ke tab 'Camera Configurations', tambahkan kamera baru (masukkan nama, tipe IP RTSP stream atau Webcam lokal). Klik 'Save Camera'. Setelah kamera aktif, pergi ke tab 'Visual Inspection Datasets', buat folder dataset baru, dan mulailah mengambil gambar sampel produk yang lewat (minimal 10-20 sampel).",
                        "LANGKAH 2: ANOTASI DI MAVi AI STUDIO (Labeling & Painting) — Pergi ke tab 'AI Models & Inspection' dan pilih dataset Anda. Di bagian bawah, panel 'MAVi AI Studio: Dataset Inspector' akan terbuka. Klik tombol 'Paint Defect' pada foto produk. Gunakan 'Brush Tool' atau 'Polygon Tool' untuk menandai dengan presisi area cacat produk dengan warna merah transparan, lalu klik 'Simpan Mask ke Server'. Tekan 'AI Auto Image Selector' jika Anda ingin AI memilih otomatis gambar tersisa yang paling membingungkan model untuk segera Anda warnai.",
                        "LANGKAH 3: PELATIHAN & OPTIMASI MODEL (Training & Threshold) — Pada form 'Train a New AI Model', pilih tipe inspeksi (Anomaly, Classification, atau Segmentation), masukkan nama model, dan tentukan jumlah Epochs. Tekan 'START TRAINING'. Setelah pelatihan selesai, analisis hasil sebaran OK vs NG di 'Degree of Separation Graph'. Geser garis pembatas cutoff threshold vertikal ke titik overlap terendah untuk memastikan performa pemisahan OK/NG yang paling aman tanpa salah reject.",
                        "LANGKAH 4: INTEGRASI KE WIDGET APP BUILDER (HMI/SCADA Binding) — Buka menu utama 'App Builder' di MAVi-MES. Tarik widget 'CAMERA' ke dalam area kanvas desain HMI Anda. Klik widget tersebut, lalu pada panel properti kanan, ikat (bind) widget ke nama kamera MAVi yang telah Anda buat di tab Vision. Tambahkan widget indikator status SCADA (seperti Lampu Status atau Teks) dan hubungkan ke variabel output deteksi model AI (misal: 'model_result'). Untuk otomatisasi perangkat keras, buka 'Blockly Editor' atau 'Automation Editor', lalu buat aturan logika: 'JIKA model_result = NG, MAKA picu PLC Write Tag ke register Output Silinder Penolak'."
                    ],
                    verify: "LANGKAH 5: EKSEKUSI REAL-TIME DI APP PLAYER (Live Shop Floor Execution) — Buka menu utama 'App Player' dan jalankan aplikasi HMI yang Anda desain. Klik tombol 'START STREAMING' pada widget kamera. Kamera akan membaca konveyor secara real-time, AI akan menjalankan inferensi lokal pada setiap frame, menampilkan heatmap cacat merah di layar, dan jika terdeteksi NG, aplikasi secara otomatis mengirimkan instruksi ke PLC untuk menggerakkan aktuator silinder penolak guna membuang barang cacat secara fisik dari jalur konveyor."
                }
            ]
        },
        {
            name: "Automotive & Metals",
            icon: "🚗",
            cases: [
                {
                    id: "auto_metal_foreign",
                    title: "Detection of Foreign Objects (Deteksi Benda Asing)",
                    mode: "Anomaly Detection (Unsupervised)",
                    image: "/assets/auto_metal_foreign.png",
                    desc: "Mendeteksi partikel asing, kotoran, oli, atau sisa serpihan logam di dalam wadah/palet kosong sebelum perakitan.",
                    setup: [
                        "1. Image Acquisition: Pasang kamera tegak lurus di atas palet. Berikan pencahayaan rata (dome light/diffuser) untuk menghilangkan refleksi mengkilap dari bahan palet.",
                        "2. Anotasi/Labeling: Kumpulkan 15-20 gambar palet yang benar-benar bersih dan kosong. Unggah gambar ke dataset backend, beri label seluruh gambar sebagai 'OK' (tidak perlu melukis area cacat karena ini Unsupervised).",
                        "3. Model Training: Pilih tipe 'Anomaly Detection' pada form pelatihan, beri nama model (misal: 'pallet_foreign_detector'), lalu klik 'START TRAINING'."
                    ],
                    verify: "Unggah gambar palet baru yang diuji ke panel 'Test Inference'. Sistem akan mendeteksi perbedaan dari standar palet bersih, memunculkan heatmap merah pada kotoran asing, dan menghitung skor anomali. Gunakan 'Separation Graph' untuk mengatur ambang batas batas aman."
                },
                {
                    id: "auto_metal_thread",
                    title: "Thread Inspection on Screws (Ulir Baut)",
                    mode: "Defect Segmentation (Supervised U-Net)",
                    image: "/assets/guide_auto_metals.png",
                    desc: "Mendeteksi bagian ulir baut yang aus, terpotong, atau penyok secara presisi terlepas dari pantulan kilau logam.",
                    setup: [
                        "1. Image Acquisition: Tempatkan sensor sela/kamera di posisi lateral sekrup. Gunakan backlight untuk menghasilkan gambar siluet hitam-putih baut yang tajam dan kontras tinggi.",
                        "2. Anotasi/Labeling: Unggah foto baut cacat. Klik 'Paint Defect' di dataset inspector. Lukis dengan kuas merah atau gunakan 'Polygon Tool' untuk menutup area gigi ulir sekrup yang penyok.",
                        "3. Model Training: Pilih tipe 'Defect Segmentation', beri nama model (misal: 'screw_thread_seg'), atur epoch ke 10, dan klik 'START TRAINING'."
                    ],
                    verify: "Unggah gambar baut pada panel 'Test Inference'. AI akan melokalisasi gigi ulir yang penyok, mengarsirnya dengan warna merah, menggambar garis batas tepi, serta menghitung total defect area (%) dan jumlah cacat (defect count)."
                },
                {
                    id: "auto_metal_rubber",
                    title: "Defect on Rubber Hoses (Selang Karet)",
                    mode: "Anomaly Detection atau Defect Segmentation",
                    image: "/assets/guide_auto_metals.png",
                    desc: "Mengidentifikasi retakan halus, robekan, atau gelembung pada permukaan selang karet hitam bergelombang.",
                    setup: [
                        "1. Image Acquisition: Gunakan ring light terpolarisasi untuk meminimalkan bayangan tajam yang ditimbulkan oleh kerutan permukaan selang karet.",
                        "2. Anotasi/Labeling: Latih dengan model Anomali (unggah selang normal ke folder 'OK') atau model Segmentasi (lukis retakan selang menggunakan Paint Tool jika retakan sudah spesifik).",
                        "3. Model Training: Pilih tipe model yang diinginkan, isi nama model, dan tekan tombol 'START TRAINING'."
                    ],
                    verify: "Jalankan uji inferensi. Cacat retak atau kerutan tidak normal akan langsung diberi tanda biner merah oleh AI."
                },
                {
                    id: "auto_metal_weld",
                    title: "Weld Inspection (Porositas & Lubang Las)",
                    mode: "Defect Segmentation (Supervised U-Net)",
                    image: "/assets/guide_auto_metals.png",
                    desc: "Mendeteksi lubang jarum (blowhole), cipratan las (spatter), dan lasan yang terputus pada sambungan logam.",
                    setup: [
                        "1. Image Acquisition: Arahkan kamera ke sambungan las. Gunakan pencahayaan coaxial light atau angle bar light untuk menonjolkan tekstur manik-manik lasan.",
                        "2. Anotasi/Labeling: Klik 'Paint Defect' pada area hasil las yang memiliki lubang jarum atau cipratan logam liar. Warnai lubang tersebut dengan warna merah.",
                        "3. Model Training: Latih model bertipe 'Defect Segmentation' dengan epoch 10 menggunakan dataset lasan yang telah diwarnai."
                    ],
                    verify: "Lakukan inferensi. AI U-Net akan mendeteksi dan memberi tanda merah pada setiap titik lubang jarum atau spatter secara real-time."
                }
            ]
        },
        {
            name: "Food, Pharma & Commodities",
            icon: "🍏",
            cases: [
                {
                    id: "food_crates",
                    title: "Appearance Inspection of Crates & Totes (Residu Keranjang)",
                    mode: "Anomaly Detection (Unsupervised)",
                    image: "/assets/guide_food_pharma.png",
                    desc: "Mendeteksi sisa segel plastik, keretakan, atau deformasi bentuk pada keranjang wadah logistik farmasi/snack.",
                    setup: [
                        "1. Image Acquisition: Pasang kamera tegak lurus di atas konveyor cuci keranjang. Gunakan dome light seragam.",
                        "2. Anotasi/Labeling: Ambil 15 gambar keranjang dalam kondisi benar-benar bersih dan kering. Simpan ke dataset backend sebagai kategori 'OK'.",
                        "3. Model Training: Latih model 'Anomaly Detection' menggunakan dataset bersih tersebut."
                    ],
                    verify: "Jika terdapat sisa segel plastik/label yang belum terkelupas setelah pencucian, area tersebut akan menyala merah pada heatmap deteksi."
                },
                {
                    id: "food_spillage",
                    title: "Inspection for Spillage (Kebocoran Cairan Botol)",
                    mode: "Anomaly Detection (Unsupervised)",
                    image: "/assets/guide_food_pharma.png",
                    desc: "Mendeteksi tumpahan atau kebocoran cairan di leher botol atau badan botol kaca obat/snack.",
                    setup: [
                        "1. Image Acquisition: Gunakan backlight berintensitas tinggi di belakang botol untuk memperlihatkan bayangan tingkat pengisian air.",
                        "2. Anotasi/Labeling: Unggah foto botol yang tersegel rapat dan kering ke folder 'OK'.",
                        "3. Model Training: Jalankan training Anomaly Detection."
                    ],
                    verify: "Tumpahan air di luar botol akan mengubah indeks bias cahaya dan dideteksi oleh AI sebagai anomali berupa warna merah mencolok."
                },
                {
                    id: "food_bakery",
                    title: "Food Appearance Inspection (Cacat Kue/Biskuit)",
                    mode: "Anomaly Detection (Unsupervised)",
                    image: "/assets/guide_food_pharma.png",
                    desc: "Mendeteksi cacat gosong, patah, atau perubahan pola permukaan pada biskuit makanan.",
                    setup: [
                        "1. Image Acquisition: Gunakan konveyor sabuk makanan dengan pencahayaan overhead diffuser light.",
                        "2. Anotasi/Labeling: Kumpulkan biskuit dengan tingkat kematangan dan bentuk sempurna, unggah ke folder 'OK'.",
                        "3. Model Training: Jalankan training Anomaly Detection."
                    ],
                    verify: "Bagian biskuit yang gosong (hitam) atau patah akan langsung dideteksi sebagai anomali bernilai tinggi."
                },
                {
                    id: "food_bristle",
                    title: "Toothbrush Bristle Tips (Bulu Sikat Gigi)",
                    mode: "Anomaly Detection (Unsupervised)",
                    image: "/assets/guide_food_pharma.png",
                    desc: "Mendeteksi bulu sikat gigi yang mekar, miring, atau tidak merata pada lini perakitan sikat gigi.",
                    setup: [
                        "1. Image Acquisition: Gunakan ujung lensa pembesar (macro zoom) dengan ring light agar ujung bulu sikat gigi terlihat kontras.",
                        "2. Anotasi/Labeling: Latih menggunakan sikat gigi yang bulunya tersusun rapi sempurna sebagai standar 'OK'.",
                        "3. Model Training: Jalankan training Anomaly Detection."
                    ],
                    verify: "Ujung bulu sikat yang mencuat keluar dari formasi akan dideteksi sebagai anomali karena tidak sesuai dengan standar kelurusan."
                },
                {
                    id: "food_shrink",
                    title: "Shrink Wrap & Label Wrinkle (Label Kemasan Kusut)",
                    mode: "Defect Segmentation (Supervised U-Net)",
                    image: "/assets/guide_food_pharma.png",
                    desc: "Mendeteksi lipatan/kerutan lecek pada plastik label kemasan yang dapat merusak penampilan kemasan produk.",
                    setup: [
                        "1. Image Acquisition: Pasang lampu di sudut samping kemasan (low-angle light) untuk menciptakan bayangan pada lipatan plastik lecek.",
                        "2. Anotasi/Labeling: Klik 'Paint Defect' pada label yang lecek. Lukis garis kerutan lecek tersebut dengan Paint kuas merah.",
                        "3. Model Training: Jalankan training Defect Segmentation."
                    ],
                    verify: "Kemasan produk yang lecek saat pengetesan akan ditandai dengan garis merah tebal di lokasi kerutan kemasan."
                },
                {
                    id: "food_alignment",
                    title: "Packaging Alignment Inspection (Tata Letak Botol)",
                    mode: "Anomaly Detection (Unsupervised)",
                    image: "/assets/guide_food_pharma.png",
                    desc: "Mendeteksi botol yang terbalik, kosong, miring, atau hilang di dalam boks kemasan kardus isi banyak.",
                    setup: [
                        "1. Image Acquisition: Pasang kamera di atas boks kemasan secara tegak lurus (bird's-eye view).",
                        "2. Anotasi/Labeling: Gunakan boks yang terisi penuh dengan botol yang tertata sempurna sebagai contoh gambar 'OK'.",
                        "3. Model Training: Latih model Anomaly Detection."
                    ],
                    verify: "Jika ada satu botol yang hilang atau miring, area botol tersebut akan langsung memicu alarm merah."
                }
            ]
        },
        {
            name: "Electric & Electronic Parts",
            icon: "🔌",
            cases: [
                {
                    id: "elec_wafer",
                    title: "Wafer Appearance Inspection (Cacat Silikon Wafer)",
                    mode: "Defect Segmentation (Supervised U-Net)",
                    image: "/assets/guide_electronics.png",
                    desc: "Mendeteksi goresan halus (scratch) atau rompal (chipping) pada tepi silikon wafer semikonduktor.",
                    setup: [
                        "1. Image Acquisition: Gunakan pencahayaan darkfield (cahaya dari samping) untuk memantulkan retakan halus wafer ke kamera.",
                        "2. Anotasi/Labeling: Anotasikan tepi wafer yang rompal atau retak tipis dengan Paint kuas merah di galeri.",
                        "3. Model Training: Latih model bertipe 'Defect Segmentation'."
                    ],
                    verify: "Retakan wafer akan langsung menyala merah terang terisolasi tanpa mengganggu pola sirkuit wafer lainnya."
                },
                {
                    id: "elec_winding",
                    title: "Inductor Winding Inspection (Lilitan Kabel Induktor)",
                    mode: "Anomaly Detection (Unsupervised)",
                    image: "/assets/guide_electronics.png",
                    desc: "Mendeteksi kawat tembaga induktor yang terlilit berantakan, renggang, atau keluar jalur lilitan.",
                    setup: [
                        "1. Image Acquisition: Pasang kamera fokus makro dengan backlight dikombinasikan dengan overhead ring light.",
                        "2. Anotasi/Labeling: Unggah kawat lilitan induktor yang terlilit rapi dan rapat sebagai gambar standar 'OK'.",
                        "3. Model Training: Jalankan training Anomaly Detection."
                    ],
                    verify: "Jika ada kawat lilitan renggang atau bertumpuk, area lilitan yang salah tersebut akan diberi tanda anomali merah."
                },
                {
                    id: "elec_capacitor",
                    title: "Capacitor Sleeve Inspection (Sobek Selongsong Kondensator)",
                    mode: "Defect Segmentation (Supervised U-Net)",
                    image: "/assets/guide_electronics.png",
                    desc: "Mendeteksi sobekan kecil atau goresan pada selongsong plastik pembungkus kondensator.",
                    setup: [
                        "1. Image Acquisition: Gunakan kamera 360-derajat atau putar produk di bawah kamera dengan pencahayaan dome light.",
                        "2. Anotasi/Labeling: Warnai sobekan plastik kondensator dengan Paint kuas merah.",
                        "3. Model Training: Jalankan training Defect Segmentation."
                    ],
                    verify: "Kondensator yang sobek plastik pelindungnya akan ditandai merah secara otomatis."
                },
                {
                    id: "elec_gasket",
                    title: "Gasket Float Inspection (Deteksi Floter Gasket)",
                    mode: "Anomaly Detection (Unsupervised)",
                    image: "/assets/guide_electronics.png",
                    desc: "Mendeteksi gasket karet atau segel yang melayang/longgar pada celah bodi logam.",
                    setup: [
                        "1. Image Acquisition: Pasang kamera dari samping produk. Gunakan lampu sorot terarah.",
                        "2. Anotasi/Labeling: Ambil foto gasket yang terpasang rapat dan pas masuk ke celah logam sebagai standar 'OK'.",
                        "3. Model Training: Latih model Anomaly Detection."
                    ],
                    verify: "Gasket yang melar atau melayang keluar dari jalurnya akan langsung memunculkan tanda anomali merah."
                },
                {
                    id: "elec_connector",
                    title: "Connector Short Shot Inspection (Plastik Konektor Cacat)",
                    mode: "Anomaly Detection (Unsupervised)",
                    image: "/assets/guide_electronics.png",
                    desc: "Mendeteksi plastik cetakan konektor yang kurang terinjeksi (*short shot*) pada pin-pin konektor.",
                    setup: [
                        "1. Image Acquisition: Arahkan kamera makro ke pin konektor. Gunakan backlight untuk mempertegas bentuk pin.",
                        "2. Anotasi/Labeling: Latih menggunakan gambar konektor dengan bentuk fisik utuh tanpa cacat sebagai standar 'OK'.",
                        "3. Model Training: Jalankan training Anomaly Detection."
                    ],
                    verify: "Jika ada pin yang kurang terlindungi plastik (short shot), AI akan mendeteksi perbedaan bentuk fisik tersebut."
                },
                {
                    id: "elec_module",
                    title: "Module Alignment Confirmation (Tumpukan Modul PCB)",
                    mode: "Anomaly Detection (Unsupervised)",
                    image: "/assets/guide_electronics.png",
                    desc: "Mendeteksi kesalahan susunan PCB atau modul elektronik yang terbalik atau miring pada baki perakitan.",
                    setup: [
                        "1. Image Acquisition: Gunakan kamera overhead dengan pencahayaan ring light.",
                        "2. Anotasi/Labeling: Masukkan foto susunan PCB yang terpasang lurus dan benar ke dalam kategori 'OK'.",
                        "3. Model Training: Latih model Anomaly Detection."
                    ],
                    verify: "PCB yang miring atau terbalik akan dideteksi karena pola fisiknya berbeda dari standar referensi."
                }
            ]
        },
        {
            name: "Vision-Guided Robotics",
            icon: "🤖",
            cases: [
                {
                    id: "robot_overlapped",
                    title: "Detection of Overlapped Products (Barang Bertumpuk)",
                    mode: "Anomaly Detection + Koordinat JSON",
                    image: "/assets/guide_robotics.png",
                    desc: "Mendeteksi produk yang bertumpuk atau tumpang tindih di nampan agar lengan robot tidak salah mencengkeram produk.",
                    setup: [
                        "1. Image Acquisition: Tempatkan kamera 2D tepat di atas area pengambilan robot (picking area) dengan pencahayaan merata.",
                        "2. Anotasi/Labeling: Latih model deteksi dengan gambar satu lapisan produk yang tersebar rapi tanpa saling bertumpukan sebagai standar 'OK'.",
                        "3. Model Training: Jalankan training Anomaly Detection untuk mengenali bentuk produk standar."
                    ],
                    verify: "Saat inferensi, jika ada barang yang bertumpuk, area tumpang tindih tersebut akan dideteksi sebagai anomali. Koordinat `x, y` dari anomali dikirimkan ke robot agar robot menghindari pengambilan produk di area tersebut."
                },
                {
                    id: "robot_guidance",
                    title: "Vision Guidance & Type Identification (Klasifikasi & Panduan Pemetik)",
                    mode: "Classification (OK/NG) + Panduan Posisi",
                    image: "/assets/guide_robotics.png",
                    desc: "Mendeteksi orientasi posisi produk dan mengklasifikasikan jenis produk (misal rasa stroberi vs jeruk) untuk menyortir produk.",
                    setup: [
                        "1. Image Acquisition: Pasang kamera di ujung lengan robot atau di atas konveyor feeder robot.",
                        "2. Anotasi/Labeling: Buat folder kelas terpisah (misalnya folder `stroberi` dan folder `jeruk`) pada dataset untuk melatih sistem klasifikasi.",
                        "3. Model Training: Pilih tipe 'Classification', masukkan daftar kelas tersebut, dan klik 'START TRAINING'."
                    ],
                    verify: "Ketika produk lewat, model klasifikasi mendeteksi tipenya dan OpenCV menghitung sudut rotasi serta pusat koordinat `x, y` produk, lalu mengirimkan perintah ke robot untuk mengambil dan mengarahkan produk ke wadah sortir yang tepat."
                }
            ]
        }
    ];

    const activeCase = useMemo(() => {
        for (const cat of categories) {
            const found = cat.cases.find(c => c.id === activeCaseId);
            if (found) return found;
        }
        return null;
    }, [activeCaseId]);

    return (
        <div style={{ flex: 1, padding: '24px', display: 'grid', gridTemplateColumns: '320px 1fr', gap: '24px', overflowY: 'hidden', height: '78vh' }}>
            {/* Sidebar List */}
            <div style={{ backgroundColor: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', overflowY: 'auto', padding: '16px' }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '1rem', fontWeight: 900, color: '#0f172a' }}>📖 AI Use Cases Index</h3>
                {categories.map((cat, catIdx) => (
                    <div key={catIdx} style={{ marginBottom: '20px' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>{cat.icon}</span> {cat.name}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {cat.cases.map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveCaseId(item.id)}
                                    style={{
                                        textAlign: 'left', padding: '10px 12px', borderRadius: '10px', border: 'none',
                                        backgroundColor: activeCaseId === item.id ? '#f5f3ff' : 'transparent',
                                        color: activeCaseId === item.id ? '#6d28d9' : '#475569',
                                        fontWeight: activeCaseId === item.id ? 800 : 600,
                                        fontSize: '0.78rem', cursor: 'pointer', transition: 'all 0.15s',
                                        display: 'flex', flexDirection: 'column', gap: '2px',
                                        borderLeft: activeCaseId === item.id ? '3px solid #7c3aed' : '3px solid transparent'
                                    }}
                                >
                                    <span>{item.title}</span>
                                    <span style={{ fontSize: '0.62rem', color: activeCaseId === item.id ? '#8b5cf6' : '#94a3b8', fontWeight: 500 }}>
                                        {item.mode.split(' ')[0]}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Content Details */}
            {activeCase && (
                <div style={{ backgroundColor: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', overflowY: 'auto', padding: '24px', gap: '20px' }}>
                    {/* Header */}
                    <div style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                            <span style={{ backgroundColor: '#f5f3ff', color: '#7c3aed', padding: '4px 10px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 900 }}>
                                {activeCase.mode}
                            </span>
                        </div>
                        <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900, color: '#0f172a' }}>
                            {activeCase.title}
                        </h2>
                    </div>

                    {/* Section: Deskripsi */}
                    <div>
                        <h4 style={{ margin: '0 0 8px 0', fontSize: '0.85rem', fontWeight: 900, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            📝 Deskripsi Use Case
                        </h4>
                        <p style={{ margin: 0, fontSize: '0.82rem', color: '#475569', lineHeight: 1.5 }}>
                            {activeCase.desc}
                        </p>
                    </div>

                    {/* Section: Setup A-Z */}
                    <div style={{ backgroundColor: '#faf5ff', border: '1px solid #f3e8ff', padding: '16px', borderRadius: '12px' }}>
                        <h4 style={{ margin: '0 0 12px 0', fontSize: '0.85rem', fontWeight: 900, color: '#6b21a8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            ⚙️ Langkah Setup & Konfigurasi A-Z
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {activeCase.setup.map((step, idx) => (
                                <div key={idx} style={{ fontSize: '0.8rem', color: '#581c87', lineHeight: 1.4, display: 'flex', gap: '8px' }}>
                                    <span style={{ fontWeight: 800 }}>•</span>
                                    <span>{step}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Section: Verifikasi */}
                    <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #dcfce7', padding: '16px', borderRadius: '12px' }}>
                        <h4 style={{ margin: '0 0 8px 0', fontSize: '0.85rem', fontWeight: 900, color: '#166534', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            ✅ Cara Verifikasi & Hasil di Aplikasi
                        </h4>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: '#14532d', lineHeight: 1.4 }}>
                            {activeCase.verify}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}

export default VisionManager;

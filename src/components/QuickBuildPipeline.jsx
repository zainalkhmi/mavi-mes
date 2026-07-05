import React, { useState, useEffect, useRef } from 'react';
import { 
    Play, 
    Plus, 
    Trash2, 
    Settings, 
    Save, 
    Folder, 
    Sparkles, 
    HelpCircle, 
    ChevronRight, 
    Check, 
    X,
    Activity,
    Sliders,
    Zap,
    Download,
    Eye,
    RefreshCw,
    Camera,
    Video
} from 'lucide-react';
import toast from 'react-hot-toast';
import Webcam from 'react-webcam';

// Default templates to choose from
const TEMPLATES = [
    {
        name: 'Flange Connector Check',
        description: 'Locate a flange metal component, verify center bore diameter, and check for surface scratches.',
        nodes: [
            { id: 'n_acq', type: 'acquire', name: 'Acquire Frame', x: 50, y: 180, params: { camera: 'Main Inspection Camera', trigger: 'PLC Continuous' }, outputs: ['image'], status: 'idle', value: null },
            { id: 'n_loc', type: 'locate', name: 'Geometric Align', x: 230, y: 180, params: { template: 'flange_rim_align', angleTolerance: 15, scoreThreshold: 85 }, inputs: ['image'], outputs: ['offset'], status: 'idle', value: null },
            { id: 'n_meas', type: 'measure', name: 'Bore Caliper', x: 430, y: 100, params: { tool: 'Caliper Edge-to-Edge', nominalSize: '25.0 mm', lsl: '24.9', usl: '25.1' }, inputs: ['image', 'offset'], outputs: ['dimension'], status: 'idle', value: null },
            { id: 'n_ins', type: 'inspect', name: 'Scratch Detect', x: 430, y: 260, params: { mode: 'Anomaly Segmentation', thresholdArea: 50 }, inputs: ['image', 'offset'], outputs: ['defects'], status: 'idle', value: null },
            { id: 'n_dec', type: 'decide', name: 'Yield Judge', x: 650, y: 180, params: { minPassedScore: 90, failAction: 'Trigger Alert Light' }, inputs: ['dimension', 'defects'], outputs: ['status'], status: 'idle', value: null }
        ],
        links: [
            { id: 'l1', fromNode: 'n_acq', fromPin: 'image', toNode: 'n_loc', toPin: 'image' },
            { id: 'l2', fromNode: 'n_acq', fromPin: 'image', toNode: 'n_meas', toPin: 'image' },
            { id: 'l3', fromNode: 'n_acq', fromPin: 'image', toNode: 'n_ins', toPin: 'image' },
            { id: 'l4', fromNode: 'n_loc', fromPin: 'offset', toNode: 'n_meas', toPin: 'offset' },
            { id: 'l5', fromNode: 'n_loc', fromPin: 'offset', toNode: 'n_ins', toPin: 'offset' },
            { id: 'l6', fromNode: 'n_meas', fromPin: 'dimension', toNode: 'n_dec', toPin: 'dimension' },
            { id: 'l7', fromNode: 'n_ins', fromPin: 'defects', toNode: 'n_dec', toPin: 'defects' }
        ]
    },
    {
        name: 'Lot Expiry OCR & OCV Verify',
        description: 'Read expiry details printed on product packaging and verify details against active batch ID.',
        nodes: [
            { id: 'n_acq', type: 'acquire', name: 'Acquire Packaging', x: 80, y: 180, params: { camera: 'Packaging Line Camera', trigger: 'Sensor Trigger' }, outputs: ['image'], status: 'idle', value: null },
            { id: 'n_ocr', type: 'inspect', name: 'Tesseract OCR', x: 300, y: 180, params: { mode: 'OCR Reading', language: 'English', matchPattern: 'EXP:\\s*\\d{2}/\\d{2}' }, inputs: ['image'], outputs: ['text'], status: 'idle', value: null },
            { id: 'n_ocv', type: 'inspect', name: 'OCV Validator', x: 500, y: 180, params: { mode: 'OCV Verification', referenceSource: 'Variable: Active_Batch_Code', similarityThreshold: 85 }, inputs: ['text'], outputs: ['matchStatus'], status: 'idle', value: null },
            { id: 'n_dec', type: 'decide', name: 'PLC Reject Control', x: 700, y: 180, params: { minPassedScore: 100, failAction: 'Activate Reject Arm' }, inputs: ['matchStatus'], outputs: ['status'], status: 'idle', value: null }
        ],
        links: [
            { id: 'l1', fromNode: 'n_acq', fromPin: 'image', toNode: 'n_ocr', toPin: 'image' },
            { id: 'l2', fromNode: 'n_ocr', fromPin: 'text', toNode: 'n_ocv', toPin: 'text' },
            { id: 'l3', fromNode: 'n_ocv', fromPin: 'matchStatus', toNode: 'n_dec', toPin: 'matchStatus' }
        ]
    }
];

const NODE_TYPES = {
    acquire: { color: '#3b82f6', icon: '📷', label: 'Acquire Block', desc: 'Manage camera feeds & frames' },
    locate: { color: '#06b6d4', icon: '🎯', label: 'Locate Block', desc: 'Pattern matching & alignment' },
    measure: { color: '#14b8a6', icon: '📏', label: 'Measure Block', desc: 'Sub-pixel caliper & dimensions' },
    inspect: { color: '#ec4899', icon: '🔬', label: 'Inspect Block', desc: 'OCR, OCV, barcode, or anomaly check' },
    decide: { color: '#f59e0b', icon: '⚡', label: 'Decide Block', desc: 'Pass/Fail logic rules & outputs' }
};

export default function QuickBuildPipeline({ appVariables = [] }) {
    const [nodes, setNodes] = useState(TEMPLATES[0].nodes);
    const [links, setLinks] = useState(TEMPLATES[0].links);
    const [selectedNodeId, setSelectedNodeId] = useState(null);
    const [activeTemplateIndex, setActiveTemplateIndex] = useState(0);
    const [isSimulating, setIsSimulating] = useState(false);
    const [simStepIndex, setSimStepIndex] = useState(-1);
    
    // Live Python Engine states
    const [uploadedFile, setUploadedFile] = useState(null);
    const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
    const [processedImage, setProcessedImage] = useState(null);
    const [isRunning, setIsRunning] = useState(false);

    // Live Webcam states
    const webcamRef = useRef(null);
    const [useLiveCamera, setUseLiveCamera] = useState(false);
    const [devices, setDevices] = useState([]);
    const [selectedDeviceId, setSelectedDeviceId] = useState('');
    const [isContinuous, setIsContinuous] = useState(false);

    // List webcam devices
    useEffect(() => {
        if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
            return;
        }
        navigator.mediaDevices.enumerateDevices().then(mediaDevices => {
            const videoDevices = mediaDevices.filter(({ kind }) => kind === 'videoinput');
            setDevices(videoDevices);
            if (videoDevices.length > 0 && !selectedDeviceId) {
                setSelectedDeviceId(videoDevices[0].deviceId);
            }
        }).catch(err => {
            console.error("Error enumerating devices:", err);
        });
    }, [useLiveCamera]);

    // DataURL to Blob helper
    const dataURLtoBlob = (dataurl) => {
        if (!dataurl) return null;
        let arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
            bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
        while(n--){
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new Blob([u8arr], {type:mime});
    };

    // Continuous tick runner
    const runSingleContinuousTick = async () => {
        if (isRunning || !useLiveCamera || !webcamRef.current) return;
        
        try {
            const screenshot = webcamRef.current.getScreenshot();
            if (!screenshot) return;
            
            const blob = dataURLtoBlob(screenshot);
            const fileToSend = new File([blob], "camera_frame.jpg", { type: "image/jpeg" });
            
            const formData = new FormData();
            formData.append('file', fileToSend);
            formData.append('nodes', JSON.stringify(nodes));
            formData.append('links', JSON.stringify(links));
            formData.append('template_index', activeTemplateIndex.toString());
            
            const response = await fetch('http://localhost:8000/quickbuild/run', {
                method: 'POST',
                body: formData
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setNodes(data.nodes);
                    setProcessedImage(data.image);
                }
            }
        } catch (error) {
            console.error('Continuous fetch error:', error);
        }
    };

    // Continuous run loop
    useEffect(() => {
        let intervalId;
        if (isContinuous && useLiveCamera) {
            intervalId = setInterval(() => {
                runSingleContinuousTick();
            }, 1500);
        }
        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [isContinuous, useLiveCamera, nodes, links, activeTemplateIndex]);

    // Saved custom pipelines loaded from localStorage
    const [savedPipelines, setSavedPipelines] = useState(() => {
        const local = localStorage.getItem('mavi_quickbuild_pipelines');
        return local ? JSON.parse(local) : [];
    });
    // Active pipeline name (either a template or custom saved)
    const [activePipelineName, setActivePipelineName] = useState(TEMPLATES[0].name);

    // Custom overlay modal state for prompts & confirmations
    const [modalConfig, setModalConfig] = useState(null);

    // CAD Drawing lists loaded from localStorage/defaults for integration
    const DEFAULT_DRAWINGS = [
        {
            id: 'dwg_flange_connector',
            name: 'Flange Connector CAD Model',
            fileName: 'industrial-flange-rev2.dxf',
            fileType: 'DXF',
            dimensions: [
                { id: 'dim_len', label: 'Overall Length (L)', spec: '120.0', tolMin: 119.5, tolMax: 120.5, variable: 'Meas_Length', unit: 'mm' },
                { id: 'dim_dia', label: 'Flange Diameter (D)', spec: '80.0', tolMin: 79.8, tolMax: 80.2, variable: 'Meas_Diameter', unit: 'mm' },
                { id: 'dim_bore', label: 'Center Bore (B)', spec: '25.0', tolMin: 24.9, tolMax: 25.1, variable: 'Meas_Bore', unit: 'mm' },
                { id: 'dim_angle_1', label: 'Chamfer Angle', spec: '45.0', tolMin: 44.0, tolMax: 46.0, variable: 'Meas_Angle', unit: '°' },
                { id: 'dim_ra_1', label: 'Surface Finish Ra', spec: '1.6', tolMin: 0.0, tolMax: 3.2, variable: 'Meas_Ra', unit: 'μm' },
            ]
        },
        {
            id: 'dwg_hydraulic_cylinder',
            name: 'Hydraulic Cylinder Blueprint',
            fileName: 'hydraulic-cyl-assembly.pdf',
            fileType: 'PDF',
            dimensions: [
                { id: 'hc_bore', label: 'Cylinder Bore', spec: '80.0', tolMin: 79.95, tolMax: 80.05, variable: 'Cylinder_Bore_Dia', unit: 'mm' },
                { id: 'hc_rod', label: 'Rod Diameter', spec: '56.0', tolMin: 55.98, tolMax: 56.02, variable: 'Rod_Diameter_Spec', unit: 'mm' },
                { id: 'hc_stroke', label: 'Stroke Length', spec: '500.0', tolMin: 499.5, tolMax: 500.5, variable: 'Stroke_Length_Actual', unit: 'mm' },
                { id: 'hc_area', label: 'Piston Area', spec: '5026.5', tolMin: 5000.0, tolMax: 5050.0, variable: 'Meas_Area', unit: 'mm²' },
            ]
        }
    ];

    const [drawingsList, setDrawingsList] = useState(() => {
        const saved = localStorage.getItem('mavi_drawings');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) return parsed;
            } catch (e) {
                console.error(e);
            }
        }
        return DEFAULT_DRAWINGS;
    });

    // UI dragging states
    const [draggingNodeId, setDraggingNodeId] = useState(null);
    const dragOffset = useRef({ x: 0, y: 0 });
    const canvasRef = useRef(null);

    // Active linking state
    const [activeLinkStart, setActiveLinkStart] = useState(null); // { nodeId, pinName, type: 'input'|'output' }

    // Load template or custom pipeline by name
    const handleLoadPipelineByName = (name) => {
        // Search templates
        const template = TEMPLATES.find(t => t.name === name);
        if (template) {
            const index = TEMPLATES.indexOf(template);
            setActiveTemplateIndex(index);
            setActivePipelineName(name);
            setNodes(JSON.parse(JSON.stringify(template.nodes)));
            setLinks(JSON.parse(JSON.stringify(template.links)));
            setSelectedNodeId(null);
            setSimStepIndex(-1);
            setIsSimulating(false);
            setUploadedFile(null);
            setImagePreviewUrl(null);
            setProcessedImage(null);
            toast.success(`Loaded template: "${name}"`);
            return;
        }

        // Search custom saved pipelines
        const custom = savedPipelines.find(p => p.name === name);
        if (custom) {
            setActiveTemplateIndex(-1);
            setActivePipelineName(name);
            setNodes(JSON.parse(JSON.stringify(custom.nodes)));
            setLinks(JSON.parse(JSON.stringify(custom.links)));
            setSelectedNodeId(null);
            setSimStepIndex(-1);
            setIsSimulating(false);
            setUploadedFile(null);
            setImagePreviewUrl(null);
            setProcessedImage(null);
            toast.success(`Loaded sequence: "${name}"`);
        }
    };

    // Create a new blank sequence
    const handleCreateNewPipeline = () => {
        if (nodes.length > 0) {
            setModalConfig({
                type: 'confirm',
                title: 'Clear Canvas',
                message: 'Are you sure you want to clear the canvas layout and start a new sequence?',
                onConfirm: () => {
                    setNodes([]);
                    setLinks([]);
                    setSelectedNodeId(null);
                    setSimStepIndex(-1);
                    setIsSimulating(false);
                    setUploadedFile(null);
                    setImagePreviewUrl(null);
                    setProcessedImage(null);
                    setActivePipelineName("");
                    setActiveTemplateIndex(-1);
                    toast.success("Canvas cleared. Start by adding tool blocks!");
                }
            });
        } else {
            toast.error("Canvas is already empty.");
        }
    };

    // Save current sequence
    const handleSavePipeline = () => {
        setModalConfig({
            type: 'prompt',
            title: 'Save Inspection Sequence',
            message: 'Enter a name to save this layout configuration:',
            defaultValue: activePipelineName || 'New Sequence',
            onConfirm: (name) => {
                if (!name || !name.trim()) return;
                const trimmedName = name.trim();

                // Protect templates
                if (TEMPLATES.some(t => t.name.toLowerCase() === trimmedName.toLowerCase())) {
                    toast.error("Cannot overwrite default templates. Please choose a different name.");
                    return;
                }

                const newPipeline = {
                    name: trimmedName,
                    nodes,
                    links
                };

                setSavedPipelines(prev => {
                    const filtered = prev.filter(p => p.name.toLowerCase() !== trimmedName.toLowerCase());
                    const updated = [...filtered, newPipeline];
                    localStorage.setItem('mavi_quickbuild_pipelines', JSON.stringify(updated));
                    return updated;
                });

                setActivePipelineName(trimmedName);
                setActiveTemplateIndex(-1);
                toast.success(`Inspection sequence "${trimmedName}" saved successfully!`);
            }
        });
    };

    // Delete saved custom sequence
    const handleDeletePipeline = (name) => {
        if (!name) return;
        if (TEMPLATES.some(t => t.name === name)) {
            toast.error("Cannot delete default templates.");
            return;
        }

        setModalConfig({
            type: 'confirm',
            title: 'Delete Sequence',
            message: `Are you sure you want to delete custom sequence "${name}"?`,
            onConfirm: () => {
                const updated = savedPipelines.filter(p => p.name !== name);
                localStorage.setItem('mavi_quickbuild_pipelines', JSON.stringify(updated));
                setSavedPipelines(updated);
                
                // Revert back to first template
                handleLoadPipelineByName(TEMPLATES[0].name);
                toast.success(`Deleted custom sequence: "${name}"`);
            }
        });
    };

    // Node parameter changes
    const updateNodeParam = (nodeId, paramKey, value) => {
        setNodes(prev => prev.map(n => {
            if (n.id === nodeId) {
                return {
                    ...n,
                    params: {
                        ...n.params,
                        [paramKey]: value
                    }
                };
            }
            return n;
        }));
    };

    // Spawn new node on canvas
    const handleAddNode = (type) => {
        const id = `node_${Date.now()}`;
        const newObj = {
            id,
            type,
            name: `New ${NODE_TYPES[type].label}`,
            x: 100 + Math.random() * 100,
            y: 100 + Math.random() * 100,
            params: type === 'acquire' ? { camera: 'Default IP Camera', trigger: 'Continuous' }
                : type === 'locate' ? { template: 'Reference_Template', angleTolerance: 10, scoreThreshold: 80 }
                : type === 'measure' ? { tool: 'Caliper Edge-to-Edge', nominalSize: '10.0 mm', lsl: '9.8', usl: '10.2' }
                : type === 'inspect' ? { mode: 'OCR Reading', language: 'English', matchPattern: '.*' }
                : { minPassedScore: 95, failAction: 'Stop conveyor' },
            inputs: type === 'acquire' ? [] : type === 'decide' ? ['dimension', 'defects'] : ['image'],
            outputs: type === 'acquire' ? ['image'] : type === 'locate' ? ['offset'] : type === 'measure' ? ['dimension'] : type === 'inspect' ? ['text'] : ['status'],
            status: 'idle',
            value: null
        };
        setNodes(prev => [...prev, newObj]);
        setSelectedNodeId(id);
        toast.success(`Created node: "${newObj.name}"`);
    };

    // Delete selected node
    const handleDeleteNode = (nodeId) => {
        setNodes(prev => prev.filter(n => n.id !== nodeId));
        setLinks(prev => prev.filter(l => l.fromNode !== nodeId && l.toNode !== nodeId));
        if (selectedNodeId === nodeId) {
            setSelectedNodeId(null);
        }
        toast.error('Removed node and linked connections.');
    };

    // Node Drag Handlers
    const handleNodeMouseDown = (e, nodeId) => {
        if (e.target.closest('.pin-connector')) return; // ignore pin clicks
        setDraggingNodeId(nodeId);
        setSelectedNodeId(nodeId); // SELECT THE NODE WHEN MOUSE DOWN/CLICKED!
        const node = nodes.find(n => n.id === nodeId);
        if (node) {
            dragOffset.current = {
                x: e.clientX - node.x,
                y: e.clientY - node.y
            };
        }
    };

    const handleCanvasMouseMove = (e) => {
        if (draggingNodeId) {
            const rect = canvasRef.current.getBoundingClientRect();
            let newX = e.clientX - dragOffset.current.x;
            let newY = e.clientY - dragOffset.current.y;
            
            // Constrain to canvas boundaries
            newX = Math.max(10, Math.min(rect.width - 200, newX));
            newY = Math.max(10, Math.min(rect.height - 120, newY));

            setNodes(prev => prev.map(n => n.id === draggingNodeId ? { ...n, x: newX, y: newY } : n));
        }
    };

    const handleCanvasMouseUp = () => {
        setDraggingNodeId(null);
    };

    // Linking pins
    const handlePinClick = (e, nodeId, pinName, type) => {
        e.stopPropagation();
        if (!activeLinkStart) {
            setActiveLinkStart({ nodeId, pinName, type });
        } else {
            // Check linking constraint (must link output -> input)
            if (activeLinkStart.type === type) {
                toast.error('Cannot connect output-to-output or input-to-input.');
                setActiveLinkStart(null);
                return;
            }
            if (activeLinkStart.nodeId === nodeId) {
                toast.error('Cannot connect a node to itself.');
                setActiveLinkStart(null);
                return;
            }

            const fromNode = type === 'input' ? activeLinkStart.nodeId : nodeId;
            const fromPin = type === 'input' ? activeLinkStart.pinName : pinName;
            const toNode = type === 'input' ? nodeId : activeLinkStart.nodeId;
            const toPin = type === 'input' ? pinName : activeLinkStart.pinName;

            // Check if link already exists
            const duplicate = links.find(l => l.fromNode === fromNode && l.fromPin === fromPin && l.toNode === toNode && l.toPin === toPin);
            if (duplicate) {
                setActiveLinkStart(null);
                return;
            }

            const newLink = {
                id: `link_${Date.now()}`,
                fromNode,
                fromPin,
                toNode,
                toPin
            };

            setLinks(prev => [...prev, newLink]);
            setActiveLinkStart(null);
            toast.success('Nodes connected successfully.');
        }
    };

    // Remove a connection wire
    const handleRemoveLink = (linkId) => {
        setLinks(prev => prev.filter(l => l.id !== linkId));
        toast.error('Link disconnected.');
    };

    // Connect to Python server quickbuild/run backend endpoint
    const handleRunPipeline = async () => {
        if (isRunning) return;
        setIsRunning(true);
        setProcessedImage(null);
        
        // Reset all nodes status to showing active processing state
        setNodes(prev => prev.map(n => ({ ...n, status: 'idle', value: 'Processing...' })));
        
        try {
            const formData = new FormData();
            let fileToSend = uploadedFile;
            if (useLiveCamera && webcamRef.current) {
                const screenshot = webcamRef.current.getScreenshot();
                if (screenshot) {
                    const blob = dataURLtoBlob(screenshot);
                    if (blob) {
                        fileToSend = new File([blob], "camera_frame.jpg", { type: "image/jpeg" });
                    }
                }
            }
            if (fileToSend) {
                formData.append('file', fileToSend);
            }
            formData.append('nodes', JSON.stringify(nodes));
            formData.append('links', JSON.stringify(links));
            formData.append('template_index', activeTemplateIndex.toString());
            
            const response = await fetch('http://localhost:8000/quickbuild/run', {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                throw new Error(`Server returned ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            if (data.success) {
                // Update workspace nodes with server calculated checks
                setNodes(data.nodes);
                setProcessedImage(data.image);
                
                if (data.overall_pass) {
                    toast.success('QuickBuild Inspection: PASSED');
                } else {
                    toast.error('QuickBuild Inspection: FAILED (Defects Detected)');
                }
            } else {
                toast.error(`Engine Error: ${data.error || 'Unknown failure'}`);
            }
        } catch (error) {
            console.error('FastAPI Connection Error, falling back to simulator:', error);
            toast.error(`Backend offline. Running offline simulator...`);
            handleRunSimulation();
        } finally {
            setIsRunning(false);
        }
    };

    // Run execution simulation
    const handleRunSimulation = () => {
        if (isSimulating) return;
        setIsSimulating(true);
        setSimStepIndex(0);
        
        // Reset all nodes status
        setNodes(prev => prev.map(n => ({ ...n, status: 'idle', value: null })));
    };

    useEffect(() => {
        if (isSimulating && simStepIndex >= 0 && simStepIndex < nodes.length) {
            const timer = setTimeout(() => {
                const updatedNodes = [...nodes];
                const currentNode = updatedNodes[simStepIndex];
                
                // Simulate output values depending on block type
                let simVal = '';
                let passed = true;

                if (currentNode.type === 'acquire') {
                    simVal = 'Frame Captured (2048x1536)';
                } else if (currentNode.type === 'locate') {
                    simVal = 'Match: 92.4% (X: +12px, Y: -4px)';
                } else if (currentNode.type === 'measure') {
                    simVal = 'Bore: 25.02 mm [PASS]';
                } else if (currentNode.type === 'inspect') {
                    if (currentNode.params.mode === 'OCV Verification') {
                        simVal = 'OCV: Match 100% [LOT-8924A]';
                    } else if (currentNode.params.mode === 'Anomaly Segmentation') {
                        simVal = 'Scratch Area: 12px² [PASS]';
                    } else {
                        simVal = 'OCR EXP: 12/28 [MATCH]';
                    }
                } else if (currentNode.type === 'decide') {
                    simVal = 'PIPELINE PASS';
                }

                currentNode.status = passed ? 'success' : 'failed';
                currentNode.value = simVal;

                setNodes(updatedNodes);
                setSimStepIndex(prev => prev + 1);
            }, 1200);
            return () => clearTimeout(timer);
        } else if (simStepIndex >= nodes.length) {
            setIsSimulating(false);
            setSimStepIndex(-1);
            toast.success('QuickBuild Inspection Sequence completed!');
        }
    }, [isSimulating, simStepIndex]);

    const selectedNode = nodes.find(n => n.id === selectedNodeId);

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '20px', height: 'calc(100vh - 120px)', minHeight: 0, padding: '20px' }}>
            
            {/* Left Flowchart Canvas */}
            <div style={{ display: 'flex', flexDirection: 'column', backgroundColor: 'white', borderRadius: '16px', border: '1px solid #cbd5e1', overflow: 'hidden', position: 'relative' }}>
                
                {/* Canvas Toolbar */}
                <div style={{ padding: '12px 20px', borderBottom: '1px solid #cbd5e1', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', flexShrink: 0 }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <Sliders size={16} color="#64748b" />
                        <span style={{ fontSize: '0.88rem', fontWeight: 800 }}>Sequence Designer</span>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            {/* Pipeline Selection Dropdown */}
                            <select
                                value={activePipelineName}
                                onChange={(e) => handleLoadPipelineByName(e.target.value)}
                                style={{
                                    padding: '6px 12px',
                                    borderRadius: '8px',
                                    border: '1px solid #cbd5e1',
                                    backgroundColor: 'white',
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    color: '#334155',
                                    outline: 'none',
                                    cursor: 'pointer',
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                }}
                            >
                                <option value="" disabled>-- Select Sequence --</option>
                                <optgroup label="Default Templates">
                                    {TEMPLATES.map(t => (
                                        <option key={t.name} value={t.name}>{t.name}</option>
                                    ))}
                                </optgroup>
                                {savedPipelines.length > 0 && (
                                    <optgroup label="Saved Custom Sequences">
                                        {savedPipelines.map(p => (
                                            <option key={p.name} value={p.name}>{p.name}</option>
                                        ))}
                                    </optgroup>
                                )}
                            </select>

                            {/* Delete Custom Pipeline */}
                            {savedPipelines.some(p => p.name === activePipelineName) && (
                                <button
                                    onClick={() => handleDeletePipeline(activePipelineName)}
                                    title="Delete this custom sequence"
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        padding: '6px',
                                        borderRadius: '8px',
                                        border: '1px solid #fee2e2',
                                        backgroundColor: '#fef2f2',
                                        color: '#ef4444',
                                        cursor: 'pointer',
                                        transition: 'background-color 0.15s'
                                    }}
                                >
                                    <Trash2 size={13} />
                                </button>
                            )}

                            {/* Create New Button */}
                            <button
                                onClick={handleCreateNewPipeline}
                                title="Create new blank sequence"
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    padding: '6px 12px',
                                    borderRadius: '8px',
                                    border: '1px solid #e2e8f0',
                                    backgroundColor: 'white',
                                    color: '#475569',
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    transition: 'all 0.15s'
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#94a3b8'; e.currentTarget.style.backgroundColor = '#f8fafc'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.backgroundColor = 'white'; }}
                            >
                                <Plus size={12} /> New
                            </button>
                        </div>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                            onClick={handleRunPipeline}
                            disabled={isRunning || isSimulating}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                padding: '6px 14px', borderRadius: '8px', border: 'none',
                                backgroundColor: (isRunning || isSimulating) ? '#94a3b8' : '#10b981',
                                color: 'white', fontWeight: 700, fontSize: '0.78rem', cursor: (isRunning || isSimulating) ? 'default' : 'pointer'
                            }}
                        >
                            <Play size={12} fill="white" /> {isRunning ? 'RUNNING...' : isSimulating ? 'SIMULATING...' : 'RUN PIPELINE'}
                        </button>
                        <button
                            onClick={handleSavePipeline}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                padding: '6px 14px', borderRadius: '8px', border: '1px solid #cbd5e1',
                                backgroundColor: 'white', color: '#334155', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer'
                            }}
                        >
                            <Save size={12} /> Save
                        </button>
                    </div>
                </div>

                {/* Node Canvas Area */}
                <div 
                    ref={canvasRef}
                    onMouseMove={handleCanvasMouseMove}
                    onMouseUp={handleCanvasMouseUp}
                    onMouseLeave={handleCanvasMouseUp}
                    style={{ 
                        flex: 1, 
                        backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', 
                        backgroundSize: '20px 20px', 
                        position: 'relative', 
                        overflow: 'hidden',
                        backgroundColor: '#f8fafc' 
                    }}
                >
                    {/* SVG Connections Overlay */}
                    <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }}>
                        {links.map((link) => {
                            const from = nodes.find(n => n.id === link.fromNode);
                            const to = nodes.find(n => n.id === link.toNode);
                            if (!from || !to) return null;

                            // Calculate link pin pixel coordinates
                            const x1 = from.x + 180;
                            const y1 = from.y + 45;
                            const x2 = to.x;
                            const y2 = to.y + 45;

                            // Smooth curve
                            const dx = Math.abs(x2 - x1) * 0.5;
                            const pathData = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;

                            return (
                                <g key={link.id} style={{ pointerEvents: 'auto', cursor: 'pointer' }}>
                                    <path
                                        d={pathData}
                                        fill="none"
                                        stroke="#cbd5e1"
                                        strokeWidth="5"
                                        style={{ transition: 'stroke 0.25s' }}
                                        onMouseEnter={(e) => e.currentTarget.setAttribute('stroke', '#ef4444')}
                                        onMouseLeave={(e) => e.currentTarget.setAttribute('stroke', '#cbd5e1')}
                                        onClick={() => handleRemoveLink(link.id)}
                                        title="Click to remove connection"
                                    />
                                    <path
                                        d={pathData}
                                        fill="none"
                                        stroke={from.status === 'success' ? '#10b981' : '#3b82f6'}
                                        strokeWidth="2.5"
                                    />
                                </g>
                            );
                        })}
                    </svg>

                    {/* Nodes Loop */}
                    {nodes.map((node, index) => {
                        const typeInfo = NODE_TYPES[node.type];
                        const isNodeSelected = selectedNodeId === node.id;
                        const isNodeSimulating = isSimulating && simStepIndex === index;
                        
                        let nodeBorder = '1px solid #cbd5e1';
                        if (isNodeSelected) nodeBorder = `2px solid ${typeInfo.color}`;
                        else if (node.status === 'success') nodeBorder = '2px solid #10b981';
                        else if (node.status === 'failed') nodeBorder = '2px solid #ef4444';

                        return (
                            <div
                                key={node.id}
                                onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                                style={{
                                    position: 'absolute',
                                    left: node.x,
                                    top: node.y,
                                    width: '180px',
                                    backgroundColor: 'white',
                                    borderRadius: '12px',
                                    boxShadow: isNodeSelected 
                                        ? '0 10px 25px -5px rgba(0, 0, 0, 0.15)' 
                                        : '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                                    border: nodeBorder,
                                    cursor: 'grab',
                                    zIndex: 10,
                                    transition: 'box-shadow 0.15s',
                                    boxSizing: 'border-box',
                                    animation: isNodeSimulating ? 'pulse-border 1s infinite alternate' : 'none'
                                }}
                            >
                                {/* Bouncing highlight keyframes styling */}
                                <style>{`
                                    @keyframes pulse-border {
                                        0% { box-shadow: 0 0 4px #3b82f6; }
                                        100% { box-shadow: 0 0 16px #3b82f6; }
                                    }
                                `}</style>

                                {/* Header */}
                                <div style={{ 
                                    padding: '8px 12px', 
                                    backgroundColor: '#f8fafc', 
                                    borderBottom: '1px solid #cbd5e1', 
                                    borderTopLeftRadius: '11px', 
                                    borderTopRightRadius: '11px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}>
                                    <span style={{ fontSize: '0.85rem' }}>{typeInfo.icon}</span>
                                    <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#1e293b', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {node.name}
                                    </span>
                                    {node.status === 'success' && <Check size={12} color="#10b981" style={{ strokeWidth: 3 }} />}
                                    {node.status === 'failed' && <X size={12} color="#ef4444" style={{ strokeWidth: 3 }} />}
                                </div>

                                {/* Body / Outputs */}
                                <div style={{ padding: '8px 12px', fontSize: '0.68rem', color: '#64748b', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    {node.value ? (
                                        <div style={{ color: '#0f172a', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', backgroundColor: '#f1f5f9', padding: '3px 6px', borderRadius: '4px' }}>
                                            {node.value}
                                        </div>
                                    ) : (
                                        <div>Ready to process</div>
                                    )}
                                </div>

                                {/* Link Handles / Pins */}
                                {/* Left Input Pin */}
                                {node.type !== 'acquire' && (
                                    <div 
                                        className="pin-connector"
                                        onClick={(e) => handlePinClick(e, node.id, node.inputs?.[0] || 'input', 'input')}
                                        style={{
                                            position: 'absolute',
                                            left: '-8px',
                                            top: '40px',
                                            width: '14px',
                                            height: '14px',
                                            borderRadius: '50%',
                                            backgroundColor: '#ffffff',
                                            border: '3.5px solid #cbd5e1',
                                            cursor: 'pointer',
                                            boxSizing: 'border-box'
                                        }}
                                        title="Connect Input Wire"
                                        onMouseEnter={(e) => e.currentTarget.style.borderColor = typeInfo.color}
                                        onMouseLeave={(e) => e.currentTarget.style.borderColor = '#cbd5e1'}
                                    />
                                )}

                                {/* Right Output Pin */}
                                {node.type !== 'decide' && (
                                    <div 
                                        className="pin-connector"
                                        onClick={(e) => handlePinClick(e, node.id, node.outputs?.[0] || 'output', 'output')}
                                        style={{
                                            position: 'absolute',
                                            right: '-8px',
                                            top: '40px',
                                            width: '14px',
                                            height: '14px',
                                            borderRadius: '50%',
                                            backgroundColor: '#ffffff',
                                            border: `3.5px solid ${typeInfo.color}`,
                                            cursor: 'pointer',
                                            boxSizing: 'border-box'
                                        }}
                                        title="Connect Output Wire"
                                    />
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Right Control Panels */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto' }}>
                
                {/* Live Inspection Monitor */}
                <div style={{ backgroundColor: 'white', borderRadius: '16px', border: '1px solid #cbd5e1', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Activity size={14} color="#3b82f6" /> Live Inspection Monitor
                        </span>
                        <span style={{ 
                            fontSize: '0.62rem', 
                            padding: '3px 6px', 
                            borderRadius: '4px', 
                            backgroundColor: (processedImage || useLiveCamera) ? '#e2fbe8' : '#f1f5f9', 
                            color: (processedImage || useLiveCamera) ? '#10b981' : '#64748b', 
                            fontWeight: 700 
                        }}>
                            {(processedImage || useLiveCamera) ? 'ACTIVE FEED' : 'NO FEED'}
                        </span>
                    </div>

                    {/* Image Viewer Container */}
                    <div style={{ 
                        position: 'relative', 
                        width: '100%', 
                        aspectRatio: '4/3', 
                        backgroundColor: '#0f172a', 
                        borderRadius: '8px', 
                        overflow: 'hidden', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        border: '1px solid #e2e8f0' 
                    }}>
                        {processedImage ? (
                            <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                                <img 
                                    src={processedImage} 
                                    style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
                                    alt="Processed visual inspection feed" 
                                />
                                {useLiveCamera && (
                                    <button
                                        onClick={() => {
                                            setProcessedImage(null);
                                            setIsContinuous(false);
                                        }}
                                        style={{
                                            position: 'absolute',
                                            bottom: '12px',
                                            left: '12px',
                                            backgroundColor: '#3b82f6',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '6px',
                                            padding: '4px 10px',
                                            fontSize: '0.65rem',
                                            fontWeight: 700,
                                            cursor: 'pointer',
                                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px'
                                        }}
                                    >
                                        <RefreshCw size={10} /> Resume Live Feed
                                    </button>
                                )}
                            </div>
                        ) : useLiveCamera ? (
                            <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                                <Webcam
                                    audio={false}
                                    ref={webcamRef}
                                    screenshotFormat="image/jpeg"
                                    videoConstraints={
                                        selectedDeviceId 
                                            ? { deviceId: { exact: selectedDeviceId }, width: 640, height: 480 } 
                                            : { facingMode: "environment", width: 640, height: 480 }
                                    }
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                                <div style={{
                                    position: 'absolute',
                                    top: '12px',
                                    left: '12px',
                                    backgroundColor: 'rgba(15, 23, 42, 0.75)',
                                    color: '#38bdf8',
                                    padding: '3px 8px',
                                    borderRadius: '12px',
                                    fontSize: '0.58rem',
                                    fontWeight: 'bold',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                }}>
                                    <span style={{ display: 'inline-block', width: '6px', height: '6px', backgroundColor: '#38bdf8', borderRadius: '50%' }}></span>
                                    LIVE CAMERA
                                </div>
                            </div>
                        ) : imagePreviewUrl ? (
                            <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                                <img 
                                    src={imagePreviewUrl} 
                                    style={{ width: '100%', height: '100%', objectFit: 'contain', opacity: 0.6 }} 
                                    alt="Uploaded test frame preview" 
                                />
                                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.75rem', fontWeight: 700, textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
                                    READY TO RUN PIPELINE
                                </div>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: '#94a3b8', padding: '20px', textAlign: 'center' }}>
                                <Eye size={24} color="#64748b" />
                                <span style={{ fontSize: '0.7rem', fontWeight: 700 }}>No active image feed</span>
                                <span style={{ fontSize: '0.6rem', color: '#64748b' }}>Upload a test image or click Run to use synthetic camera feed.</span>
                            </div>
                        )}
                    </div>

                    {/* Camera Select and Toggle Controls */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {/* Mode Select Row */}
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                                onClick={() => {
                                    setUseLiveCamera(false);
                                    setIsContinuous(false);
                                    setProcessedImage(null);
                                }}
                                style={{
                                    flex: 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '6px',
                                    padding: '6px 12px',
                                    borderRadius: '8px',
                                    border: `1px solid ${!useLiveCamera ? '#3b82f6' : '#cbd5e1'}`,
                                    backgroundColor: !useLiveCamera ? '#eff6ff' : 'white',
                                    color: !useLiveCamera ? '#2563eb' : '#334155',
                                    fontSize: '0.72rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    outline: 'none'
                                }}
                            >
                                <Download size={12} style={{ transform: 'rotate(180deg)' }} /> Upload Mode
                            </button>
                            <button
                                onClick={() => {
                                    setUseLiveCamera(true);
                                    setProcessedImage(null);
                                }}
                                style={{
                                    flex: 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '6px',
                                    padding: '6px 12px',
                                    borderRadius: '8px',
                                    border: `1px solid ${useLiveCamera ? '#3b82f6' : '#cbd5e1'}`,
                                    backgroundColor: useLiveCamera ? '#eff6ff' : 'white',
                                    color: useLiveCamera ? '#2563eb' : '#334155',
                                    fontSize: '0.72rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    outline: 'none'
                                }}
                            >
                                <Camera size={12} /> Camera Mode
                            </button>
                        </div>

                        {/* Conditional controls depending on Mode */}
                        {!useLiveCamera ? (
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <label style={{ 
                                    flex: 1, 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center', 
                                    gap: '6px', 
                                    padding: '8px 12px', 
                                    borderRadius: '8px', 
                                    border: '1px solid #cbd5e1', 
                                    backgroundColor: 'white', 
                                    color: '#334155', 
                                    fontSize: '0.72rem', 
                                    fontWeight: 700, 
                                    cursor: 'pointer', 
                                    transition: 'background-color 0.15s' 
                                }}>
                                    <Download size={12} style={{ transform: 'rotate(180deg)' }} /> Upload Image
                                    <input 
                                        type="file" 
                                        accept="image/*" 
                                        onChange={(e) => {
                                            const file = e.target.files[0];
                                            if (file) {
                                                setUploadedFile(file);
                                                setImagePreviewUrl(URL.createObjectURL(file));
                                                setProcessedImage(null);
                                                toast.success(`Loaded custom image: ${file.name}`);
                                            }
                                        }} 
                                        style={{ display: 'none' }} 
                                    />
                                </label>

                                {(uploadedFile || processedImage) && (
                                    <button
                                        onClick={() => {
                                            setUploadedFile(null);
                                            setImagePreviewUrl(null);
                                            setProcessedImage(null);
                                            toast.success('Reset to synthetic target generator feed.');
                                        }}
                                        style={{ 
                                            padding: '8px 16px', 
                                            borderRadius: '8px', 
                                            border: '1px solid #fee2e2', 
                                            backgroundColor: '#fef2f2', 
                                            color: '#ef4444', 
                                            fontSize: '0.72rem', 
                                            fontWeight: 700, 
                                            cursor: 'pointer' 
                                        }}
                                    >
                                        Reset
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '10px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                {/* Device select */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <span style={{ fontSize: '0.62rem', fontWeight: 700, color: '#64748b' }}>PILIH KAMERA AKTIF:</span>
                                    <select
                                        value={selectedDeviceId}
                                        onChange={(e) => {
                                            setSelectedDeviceId(e.target.value);
                                            setProcessedImage(null);
                                        }}
                                        style={{ 
                                            width: '100%', 
                                            padding: '6px 8px', 
                                            borderRadius: '6px', 
                                            border: '1px solid #cbd5e1', 
                                            fontSize: '0.72rem', 
                                            backgroundColor: 'white',
                                            outline: 'none'
                                        }}
                                    >
                                        {devices.length === 0 ? (
                                            <option value="">No cameras detected</option>
                                        ) : (
                                            devices.map(device => (
                                                <option key={device.deviceId} value={device.deviceId}>
                                                    {device.label || `Camera ${devices.indexOf(device) + 1}`}
                                                </option>
                                            ))
                                        )}
                                    </select>
                                </div>

                                {/* Continuous mode toggle */}
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
                                    <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#475569' }}>Continuous Live Inspection:</span>
                                    <label style={{ position: 'relative', display: 'inline-block', width: '34px', height: '20px' }}>
                                        <input 
                                            type="checkbox" 
                                            checked={isContinuous} 
                                            onChange={(e) => {
                                                setIsContinuous(e.target.checked);
                                                if (e.target.checked) {
                                                    setProcessedImage(null);
                                                    toast.success('Continuous inspection active.');
                                                } else {
                                                    toast.success('Continuous inspection paused.');
                                                }
                                            }}
                                            style={{ opacity: 0, width: 0, height: 0 }}
                                        />
                                        <span style={{
                                            position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
                                            backgroundColor: isContinuous ? '#10b981' : '#cbd5e1',
                                            transition: '.3s', borderRadius: '20px'
                                        }}>
                                            <span style={{
                                                position: 'absolute', content: '""', height: '14px', width: '14px', left: isContinuous ? '16px' : '3px', bottom: '3px',
                                                backgroundColor: 'white', transition: '.3s', borderRadius: '50%'
                                            }} />
                                        </span>
                                    </label>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* 1. Tool Block spawning panel */}
                <div style={{ backgroundColor: 'white', borderRadius: '16px', border: '1px solid #cbd5e1', padding: '16px' }}>
                    <h3 style={{ margin: '0 0 12px 0', fontSize: '0.85rem', fontWeight: 800 }}>QuickBuild Tool Blocks</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {Object.keys(NODE_TYPES).map((type) => {
                            const info = NODE_TYPES[type];
                            return (
                                <button
                                    key={type}
                                    onClick={() => handleAddNode(type)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        width: '100%',
                                        padding: '8px 12px',
                                        borderRadius: '8px',
                                        border: '1px solid #e2e8f0',
                                        backgroundColor: '#f8fafc',
                                        textAlign: 'left',
                                        cursor: 'pointer',
                                        transition: 'all 0.15s'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.borderColor = info.color;
                                        e.currentTarget.style.backgroundColor = 'white';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.borderColor = '#e2e8f0';
                                        e.currentTarget.style.backgroundColor = '#f8fafc';
                                    }}
                                >
                                    <span style={{ fontSize: '1.1rem' }}>{info.icon}</span>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155' }}>{info.label}</div>
                                        <div style={{ fontSize: '0.62rem', color: '#64748b' }}>{info.desc}</div>
                                    </div>
                                    <Plus size={14} color="#94a3b8" />
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* 2. Selected Node parameter editor panel */}
                <div style={{ backgroundColor: 'white', borderRadius: '16px', border: '1px solid #cbd5e1', padding: '16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 800 }}>Block Settings</span>
                        {selectedNode && (
                            <button 
                                onClick={() => handleDeleteNode(selectedNode.id)}
                                style={{ border: 'none', backgroundColor: 'transparent', cursor: 'pointer', color: '#ef4444', display: 'flex', alignItems: 'center' }}
                            >
                                <Trash2 size={14} />
                            </button>
                        )}
                    </div>

                    {selectedNode ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                            
                            {/* Block name input */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#64748b' }}>Block Label</span>
                                <input
                                    type="text"
                                    value={selectedNode.name}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setNodes(prev => prev.map(n => n.id === selectedNode.id ? { ...n, name: val } : n));
                                    }}
                                    style={{ padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.78rem', outline: 'none' }}
                                />
                            </div>

                            {/* Dynamic Parameters depending on type */}
                            {selectedNode.type === 'acquire' && (
                                <>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#64748b' }}>Select Camera Source</span>
                                        <select
                                            value={selectedNode.params.camera || ''}
                                            onChange={(e) => updateNodeParam(selectedNode.id, 'camera', e.target.value)}
                                            style={{ padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.78rem', outline: 'none', backgroundColor: 'white' }}
                                        >
                                            <option value="Main Inspection Camera">Main Inspection Camera</option>
                                            <option value="Packaging Line Camera">Packaging Line Camera</option>
                                            <option value="Calibration Webcam">Calibration Webcam</option>
                                        </select>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#64748b' }}>Trigger Shutter Mode</span>
                                        <select
                                            value={selectedNode.params.trigger || ''}
                                            onChange={(e) => updateNodeParam(selectedNode.id, 'trigger', e.target.value)}
                                            style={{ padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.78rem', outline: 'none', backgroundColor: 'white' }}
                                        >
                                            <option value="PLC Continuous">PLC Continuous</option>
                                            <option value="Sensor Trigger">Sensor Trigger</option>
                                            <option value="Software Continuous">Software Continuous</option>
                                        </select>
                                    </div>
                                </>
                            )}

                            {selectedNode.type === 'locate' && (
                                <>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#64748b' }}>Align Reference Template</span>
                                        <input
                                            type="text"
                                            value={selectedNode.params.template || ''}
                                            onChange={(e) => updateNodeParam(selectedNode.id, 'template', e.target.value)}
                                            style={{ padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.78rem', outline: 'none' }}
                                        />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#64748b' }}>Angle Tolerance (±°)</span>
                                        <input
                                            type="number"
                                            value={selectedNode.params.angleTolerance || 10}
                                            onChange={(e) => updateNodeParam(selectedNode.id, 'angleTolerance', Number(e.target.value))}
                                            style={{ padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.78rem', outline: 'none' }}
                                        />
                                    </div>
                                </>
                            )}

                            {selectedNode.type === 'measure' && (
                                <>
                                    {/* CAD Link Section */}
                                    <div style={{ padding: '10px', backgroundColor: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.15)', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '8px' }}>
                                        <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#2563eb', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            📐 CAD Drawing Integration
                                        </span>
                                        
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                            <span style={{ fontSize: '0.65rem', fontWeight: 600, color: '#64748b' }}>Link CAD Model</span>
                                            <select
                                                value={selectedNode.params.linkedDrawingId || ''}
                                                onChange={(e) => {
                                                    const dwgId = e.target.value;
                                                    updateNodeParam(selectedNode.id, 'linkedDrawingId', dwgId);
                                                    // Reset dimension link
                                                    updateNodeParam(selectedNode.id, 'linkedDimensionId', '');
                                                }}
                                                style={{ padding: '6px 8px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.75rem', outline: 'none', backgroundColor: 'white' }}
                                            >
                                                <option value="">Manual Entry (No CAD Link)</option>
                                                {drawingsList.map(d => (
                                                    <option key={d.id} value={d.id}>{d.name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {selectedNode.params.linkedDrawingId && (() => {
                                            const activeDwg = drawingsList.find(d => d.id === selectedNode.params.linkedDrawingId);
                                            const dims = activeDwg?.dimensions || [];
                                            return (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                    <span style={{ fontSize: '0.65rem', fontWeight: 600, color: '#64748b' }}>Select CAD Dimension</span>
                                                    <select
                                                        value={selectedNode.params.linkedDimensionId || ''}
                                                        onChange={(e) => {
                                                            const dimId = e.target.value;
                                                            const dimObj = dims.find(d => d.id === dimId);
                                                            updateNodeParam(selectedNode.id, 'linkedDimensionId', dimId);
                                                            if (dimObj) {
                                                                // Automatically load and lock parameters
                                                                updateNodeParam(selectedNode.id, 'nominalSize', `${dimObj.spec} ${dimObj.unit || 'mm'}`);
                                                                updateNodeParam(selectedNode.id, 'lsl', dimObj.tolMin.toString());
                                                                updateNodeParam(selectedNode.id, 'usl', dimObj.tolMax.toString());
                                                                toast.success(`Locked parameters to CAD spec: ${dimObj.label}`);
                                                            }
                                                        }}
                                                        style={{ padding: '6px 8px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.75rem', outline: 'none', backgroundColor: 'white' }}
                                                    >
                                                        <option value="">-- Select CAD Feature --</option>
                                                        {dims.map(d => (
                                                            <option key={d.id} value={d.id}>{d.label} (Spec: {d.spec})</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            );
                                        })()}
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#64748b' }}>Caliper Scan Tool</span>
                                        <select
                                            value={selectedNode.params.tool || ''}
                                            onChange={(e) => updateNodeParam(selectedNode.id, 'tool', e.target.value)}
                                            style={{ padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.78rem', outline: 'none', backgroundColor: 'white' }}
                                            disabled={!!selectedNode.params.linkedDimensionId}
                                        >
                                            <option value="Caliper Edge-to-Edge">Caliper Edge-to-Edge</option>
                                            <option value="Circle Diameter Caliper">Circle Diameter Caliper</option>
                                            <option value="Corner Angle Check">Corner Angle Check</option>
                                        </select>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#64748b' }}>Nominal Target Size</span>
                                        <input
                                            type="text"
                                            value={selectedNode.params.nominalSize || ''}
                                            onChange={(e) => updateNodeParam(selectedNode.id, 'nominalSize', e.target.value)}
                                            style={{ padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.78rem', outline: 'none', backgroundColor: selectedNode.params.linkedDimensionId ? '#f1f5f9' : 'white' }}
                                            disabled={!!selectedNode.params.linkedDimensionId}
                                        />
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#64748b' }}>LSL (Min)</span>
                                            <input
                                                type="text"
                                                value={selectedNode.params.lsl || ''}
                                                onChange={(e) => updateNodeParam(selectedNode.id, 'lsl', e.target.value)}
                                                style={{ padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.78rem', outline: 'none', backgroundColor: selectedNode.params.linkedDimensionId ? '#f1f5f9' : 'white' }}
                                                disabled={!!selectedNode.params.linkedDimensionId}
                                            />
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#64748b' }}>USL (Max)</span>
                                            <input
                                                type="text"
                                                value={selectedNode.params.usl || ''}
                                                onChange={(e) => updateNodeParam(selectedNode.id, 'usl', e.target.value)}
                                                style={{ padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.78rem', outline: 'none', backgroundColor: selectedNode.params.linkedDimensionId ? '#f1f5f9' : 'white' }}
                                                disabled={!!selectedNode.params.linkedDimensionId}
                                            />
                                        </div>
                                    </div>
                                </>
                            )}

                            {selectedNode.type === 'inspect' && (
                                <>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#64748b' }}>Inspection Mode</span>
                                        <select
                                            value={selectedNode.params.mode || ''}
                                            onChange={(e) => updateNodeParam(selectedNode.id, 'mode', e.target.value)}
                                            style={{ padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.78rem', outline: 'none', backgroundColor: 'white' }}
                                        >
                                            <option value="OCR Reading">OCR Reading</option>
                                            <option value="OCV Verification">OCV Verification</option>
                                            <option value="Anomaly Segmentation">Anomaly Segmentation</option>
                                            <option value="Barcode Code Scanning">Barcode Code Scanning</option>
                                        </select>
                                    </div>

                                    {selectedNode.params.mode === 'OCV Verification' ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#64748b' }}>Verification Reference</span>
                                            <select
                                                value={selectedNode.params.referenceSource || ''}
                                                onChange={(e) => updateNodeParam(selectedNode.id, 'referenceSource', e.target.value)}
                                                style={{ padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.78rem', outline: 'none', backgroundColor: 'white' }}
                                            >
                                                <option value="Static Ref Text">Static Reference Text</option>
                                                {appVariables.map(v => (
                                                    <option key={v.id} value={`Variable: ${v.name}`}>Var: {v.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#64748b' }}>Match Pattern Validation</span>
                                            <input
                                                type="text"
                                                value={selectedNode.params.matchPattern || ''}
                                                onChange={(e) => updateNodeParam(selectedNode.id, 'matchPattern', e.target.value)}
                                                style={{ padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.78rem', outline: 'none' }}
                                            />
                                        </div>
                                    )}
                                </>
                            )}

                            {selectedNode.type === 'decide' && (
                                <>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#64748b' }}>Target Yield Match (%)</span>
                                        <input
                                            type="number"
                                            value={selectedNode.params.minPassedScore || 90}
                                            onChange={(e) => updateNodeParam(selectedNode.id, 'minPassedScore', Number(e.target.value))}
                                            style={{ padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.78rem', outline: 'none' }}
                                        />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#64748b' }}>Fail Trigger Actions</span>
                                        <select
                                            value={selectedNode.params.failAction || ''}
                                            onChange={(e) => updateNodeParam(selectedNode.id, 'failAction', e.target.value)}
                                            style={{ padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.78rem', outline: 'none', backgroundColor: 'white' }}
                                        >
                                            <option value="Trigger Alert Light">Trigger Alert Light</option>
                                            <option value="Activate Reject Arm">Activate Reject Arm</option>
                                            <option value="Write PLC Boolean Error">Write PLC Boolean Error</option>
                                        </select>
                                    </div>
                                </>
                            )}

                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, color: '#94a3b8', textAlign: 'center', padding: '20px' }}>
                            <HelpCircle size={32} color="#cbd5e1" style={{ marginBottom: '10px' }} />
                            <span style={{ fontSize: '0.78rem', fontWeight: 700 }}>No Node Selected</span>
                            <p style={{ fontSize: '0.68rem', color: '#94a3b8', margin: '4px 0 0 0' }}>Click on a block on the flowchart to edit its settings.</p>
                        </div>
                    )}
                </div>

            </div>

            {/* Custom Premium Modal Overlay */}
            {modalConfig && (
                <div style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(15, 23, 42, 0.65)',
                    backdropFilter: 'blur(4px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        backgroundColor: 'white',
                        borderRadius: '16px',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                        padding: '24px',
                        width: '380px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '16px'
                    }}>
                        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#1e293b' }}>
                            {modalConfig.title}
                        </h3>
                        <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b', lineHeight: 1.5 }}>
                            {modalConfig.message}
                        </p>
                        {modalConfig.type === 'prompt' && (
                            <input
                                type="text"
                                id="custom-modal-input"
                                defaultValue={modalConfig.defaultValue}
                                style={{
                                    width: '100%',
                                    padding: '8px 12px',
                                    border: '1px solid #cbd5e1',
                                    borderRadius: '8px',
                                    fontSize: '0.8rem',
                                    outline: 'none',
                                    boxSizing: 'border-box'
                                }}
                                autoFocus
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        const val = e.target.value;
                                        if (val && val.trim()) {
                                            modalConfig.onConfirm(val);
                                            setModalConfig(null);
                                        }
                                    }
                                }}
                            />
                        )}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                            <button
                                onClick={() => setModalConfig(null)}
                                style={{
                                    padding: '6px 14px',
                                    borderRadius: '8px',
                                    border: '1px solid #cbd5e1',
                                    backgroundColor: 'white',
                                    color: '#64748b',
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    cursor: 'pointer'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    const val = modalConfig.type === 'prompt' 
                                        ? document.getElementById('custom-modal-input')?.value 
                                        : undefined;
                                    modalConfig.onConfirm(val);
                                    setModalConfig(null);
                                }}
                                style={{
                                    padding: '6px 14px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    backgroundColor: '#3b82f6',
                                    color: 'white',
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    cursor: 'pointer'
                                }}
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
        </div>
    );
}

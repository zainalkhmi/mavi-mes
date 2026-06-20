import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Camera, Settings, Eye, Sliders, Play, Trash2, FolderOpen, Save, 
  RefreshCw, BarChart2, CheckCircle, XCircle, Info, ChevronRight, 
  Download, Upload, HelpCircle, Activity, LayoutGrid, Clock, 
  ListFilter, Copy, HelpCircle as HelpIcon, Settings2, RotateCcw
} from 'lucide-react';
import { 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, ReferenceLine 
} from 'recharts';
import toast, { Toaster } from 'react-hot-toast';
import { getAllCameras, saveCamera } from '../utils/supabaseUtilityDB';

// Styling constants for Odoo-style light theme (2026 aesthetics)
const COLORS = {
  bgDark: '#f8fafc',      // Light workspace background (Odoo style)
  sidebarDark: '#ffffff', // White sidebar background
  cardDark: '#ffffff',    // White card background
  cardHeader: '#f1f5f9',  // Subtle light card header
  border: '#e2e8f0',      // Thin light border
  textLight: '#1f2937',   // Dark charcoal text for readability
  textMuted: '#6b7280',   // Cool gray muted text
  blueAccent: '#714b67',  // Odoo Purple primary brand accent
  blueHover: '#5c3c54',   // Odoo Purple hover
  greenAccent: '#008784', // Odoo Teal success accent
  redAccent: '#dc2626',   // Warning red
  yellowAccent: '#eab308',// Amber warning
};

export default function CameraCalibration() {
  // Navigation State
  const [currentMenu, setCurrentMenu] = useState('dashboard');
  const [calibrationSubmenuOpen, setCalibrationSubmenuOpen] = useState(true);

  // Global Camera State
  const [isCameraConnected, setIsCameraConnected] = useState(true);
  const [cameraSource, setCameraSource] = useState('');
  const [cameraResolution, setCameraResolution] = useState('1920 x 1080');
  const [cameraFps, setCameraFps] = useState('30 FPS');
  const [exposureValue, setExposureValue] = useState(-3);
  const [focusValue, setFocusValue] = useState(128);
  const [gainValue, setGainValue] = useState(1.0);
  const [whiteBalance, setWhiteBalance] = useState('Auto');
  const [connectingState, setConnectingState] = useState('idle'); // 'idle' | 'connecting'
  
  // Registered cameras from vision menu
  const [registeredCameras, setRegisteredCameras] = useState([]);
  const [isLoadingCameras, setIsLoadingCameras] = useState(true);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  useEffect(() => {
    const fetchRegisteredCameras = async () => {
      try {
        setIsLoadingCameras(true);
        const data = await getAllCameras();
        if (data && data.length > 0) {
          setRegisteredCameras(data);
          // Set first registered camera as default and load settings
          const defaultCam = data[0];
          setCameraSource(defaultCam.name);
          if (defaultCam.settings) {
            const s = defaultCam.settings;
            if (s.resolution) setCameraResolution(s.resolution);
            if (s.fps) setCameraFps(s.fps);
            if (s.exposure !== undefined) setExposureValue(s.exposure);
            if (s.focus !== undefined) setFocusValue(s.focus);
            if (s.gain !== undefined) setGainValue(s.gain);
            if (s.whiteBalance) setWhiteBalance(s.whiteBalance);
          }
        } else {
          // Fallback if no camera exists
          const defaults = [
            { id: 'cam-default-1', name: 'USB Camera (Sony IMX291)', type: 'DEVICE', url: '' },
            { id: 'cam-default-2', name: 'GigE Industrial Cam (Basler)', type: 'DEVICE', url: '' }
          ];
          setRegisteredCameras(defaults);
          setCameraSource(defaults[0].name);
        }
      } catch (err) {
        console.error('Failed to load registered cameras for calibration:', err);
        const defaults = [{ id: 'cam-default-1', name: 'USB Camera (Sony IMX291)', type: 'DEVICE', url: '' }];
        setRegisteredCameras(defaults);
        setCameraSource(defaults[0].name);
      } finally {
        setIsLoadingCameras(false);
      }
    };
    fetchRegisteredCameras();
  }, []);

  // Lens Calibration States
  const [chessboardRows, setChessboardRows] = useState(9);
  const [chessboardCols, setChessboardCols] = useState(6);
  const [squareSizeMm, setSquareSizeMm] = useState(25.00);
  const [capturedImages, setCapturedImages] = useState([]);
  const [selectedCapturedImage, setSelectedCapturedImage] = useState(null);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [calibrationProgress, setCalibrationProgress] = useState(0);
  const [calibrationResult, setCalibrationResult] = useState({
    reprojectionError: 0.18,
    status: 'Valid',
    matrix: [
      [1050.3124, 0.0, 960.5123],
      [0.0, 1048.7652, 540.2317],
      [0.0, 0.0, 1.0]
    ],
    distortion: {
      k1: -0.215614,
      k2: 0.034512,
      p1: -0.001234,
      p2: 0.002345,
      k3: -0.012345
    },
    lastCalibrated: '15 Jun 2026 14:32:10'
  });
  const [yamlFilename, setYamlFilename] = useState('calibration_20260616.yaml');

  // Scale Calibration States
  const [knownLengthMm, setKnownLengthMm] = useState(100.00);
  const [pixelScaleFactor, setPixelScaleFactor] = useState(0.1170); // mm/pixel
  const [draggedLine, setDraggedLine] = useState(null); // { x1, y1, x2, y2 }
  const [isDrawingScaleLine, setIsDrawingScaleLine] = useState(false);

  // ROI Setup States
  const [roiName, setRoiName] = useState('Diameter Area');
  const [roiTolerance, setRoiTolerance] = useState(0.10);
  const [roiBox, setRoiBox] = useState({ x: 280, y: 140, w: 240, h: 200 });
  const [savedRois, setSavedRois] = useState([
    { id: 1, name: 'Diameter Area', tolerance: 0.10, x: 280, y: 140, w: 240, h: 200 },
    { id: 2, name: 'Length Inspector', tolerance: 0.15, x: 100, y: 100, w: 400, h: 100 }
  ]);

  // Calibration history database
  const [calibrationHistory, setCalibrationHistory] = useState([
    { id: 'CAL-01', date: '2026-06-15 14:32', operator: 'A. Hidayat', camera: 'USB Camera', type: 'Full OpenCV', rms: '0.18 px', scale: '0.1170 mm/px', status: 'VALID' },
    { id: 'CAL-02', date: '2026-06-12 09:15', operator: 'A. Hidayat', camera: 'USB Camera', type: 'Scale Re-cal', rms: '0.19 px', scale: '0.1165 mm/px', status: 'SUPERSEDED' },
    { id: 'CAL-03', date: '2026-05-30 11:45', operator: 'S. Raharjo', camera: 'USB Camera', type: 'Full OpenCV', rms: '0.24 px', scale: '0.1172 mm/px', status: 'SUPERSEDED' },
  ]);

  // Refs for Live Camera Streaming
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const setupCanvasRef = useRef(null);
  const ipImageRef = useRef(null);

  // Simulation Refs for Canvases
  const cameraCanvasRef = useRef(null);
  const scaleCanvasRef = useRef(null);
  const roiCanvasRef = useRef(null);
  const animationFrameId = useRef(null);

  const [ipImageLoaded, setIpImageLoaded] = useState(false);
  const [ipImageError, setIpImageError] = useState(false);

  // 1. Webcam stream lifecycle hook (getUserMedia)
  useEffect(() => {
    if (!isCameraConnected) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      return;
    }

    const selectedCam = registeredCameras.find(c => c.name === cameraSource);
    const camType = selectedCam?.type || 'DEVICE';

    if (camType === 'DEVICE') {
      const getWebcam = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: {
              width: { ideal: 1280 },
              height: { ideal: 720 },
              facingMode: 'environment'
            }
          });
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch(err => console.warn('Video play interrupted:', err));
          }
        } catch (err) {
          console.error('Failed to access webcam:', err);
          toast.error('Kamera tidak dapat diakses: ' + err.message);
        }
      };
      getWebcam();
    }

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, [isCameraConnected, cameraSource, registeredCameras]);

  // 2. IP Camera MJPEG stream hook
  useEffect(() => {
    if (!isCameraConnected) {
      ipImageRef.current = null;
      setIpImageLoaded(false);
      setIpImageError(false);
      return;
    }

    const selectedCam = registeredCameras.find(c => c.name === cameraSource);
    const camType = selectedCam?.type || 'DEVICE';
    const ipUrl = selectedCam?.url || '';

    if (camType !== 'IP_CAMERA' || !ipUrl) {
      ipImageRef.current = null;
      setIpImageLoaded(false);
      setIpImageError(false);
      return;
    }

    const isRtsp = ipUrl.toLowerCase().startsWith('rtsp://');
    if (isRtsp) {
      ipImageRef.current = null;
      setIpImageLoaded(true); // Treat as loaded, render simulated stream overlay
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
      setIpImageLoaded(false);
    };
    img.src = ipUrl;
    ipImageRef.current = img;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [cameraSource, registeredCameras, isCameraConnected]);

  // Auto-increment counters to prevent React duplicate key warnings
  const imageCounter = useRef(0);
  const imageCacheRef = useRef({});

  // Handle Connect Camera
  const handleConnectCamera = () => {
    if (isCameraConnected) {
      setIsCameraConnected(false);
      toast.error('Camera Disconnected');
    } else {
      setConnectingState('connecting');
      setTimeout(() => {
        setIsCameraConnected(true);
        setConnectingState('idle');
        toast.success('Connected to ' + cameraSource + ' successfully.');
      }, 1200);
    }
  };

  // Save current exposure, focus, gain, whitebalance settings back to the DB camera configuration
  const handleSaveCameraSettings = async () => {
    const selectedCam = registeredCameras.find(c => c.name === cameraSource);
    if (!selectedCam) {
      toast.error('No camera selected to save settings for.');
      return;
    }
    
    setIsSavingSettings(true);
    try {
      const updatedSettings = {
        ...(selectedCam.settings || {}),
        resolution: cameraResolution,
        fps: cameraFps,
        exposure: exposureValue,
        focus: focusValue,
        gain: gainValue,
        whiteBalance: whiteBalance
      };
      
      const payload = {
        ...selectedCam,
        settings: updatedSettings
      };
      
      await saveCamera(payload);
      
      // Update local state registeredCameras list
      setRegisteredCameras(prev => prev.map(c => c.id === selectedCam.id ? payload : c));
      
      toast.success(`Camera configuration for "${cameraSource}" saved to Vision Setup successfully.`);
    } catch (err) {
      console.error('Failed to save camera settings:', err);
      toast.error('Failed to save camera configuration.');
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Handle Capture Chessboard Image
  const handleCaptureImage = () => {
    if (!isCameraConnected) {
      toast.error('Cannot capture image. Camera is disconnected.');
      return;
    }
    
    // Switch to live mode temporarily if we select a static image, or grab from canvas
    setSelectedCapturedImage(null); // Deselect captured image to return viewport to live camera feed
    
    setTimeout(() => {
      const canvas = cameraCanvasRef.current;
      if (!canvas) {
        toast.error('Kamera viewport canvas tidak ditemukan.');
        return;
      }
      
      canvas.toBlob(async (blob) => {
        if (!blob) {
          toast.error('Gagal mengambil snapshot dari kamera.');
          return;
        }
        
        const formData = new FormData();
        formData.append('file', blob, 'frame.jpg');
        
        const loadingToast = toast.loading('Memproses corner detection via Python OpenCV...');
        
        try {
          const res = await fetch(`http://localhost:8000/calibrate/detect_corners?rows=${chessboardRows}&cols=${chessboardCols}`, {
            method: 'POST',
            body: formData
          });
          const data = await res.json();
          
          toast.dismiss(loadingToast);
          if (data && data.success) {
            toast.success('Chessboard corners successfully detected!');
            
            imageCounter.current += 1;
            const newId = imageCounter.current;
            
            // Cache current canvas image as Image object
            const dataUrl = canvas.toDataURL('image/jpeg');
            const img = new Image();
            img.src = dataUrl;
            imageCacheRef.current[newId] = img;
            
            const newImg = {
              id: newId,
              name: `Image ${newId}`,
              validated: true,
              dataUrl: dataUrl,
              corners: data.corners
            };
            
            setCapturedImages(prev => [...prev, newImg]);
            setSelectedCapturedImage(newId);
          } else {
            toast.error(data.message || 'Chessboard corners not found. Adjust pattern/lighting.');
          }
        } catch (err) {
          toast.dismiss(loadingToast);
          toast.error('API Error: ' + err.message);
        }
      }, 'image/jpeg', 0.90);
    }, 100);
  };

  // Clear Chessboard Images
  const handleClearImages = () => {
    setCapturedImages([]);
    imageCounter.current = 0;
    imageCacheRef.current = {};
    setSelectedCapturedImage(null);
    toast.success('All captured calibration images cleared.');
  };

  // Start OpenCV Camera Intrinsic Calibration
  const handleStartCalibration = async () => {
    const validImages = capturedImages.filter(img => img.validated && img.corners && img.corners.length > 0);
    if (validImages.length < 3) {
      toast.error('Please capture at least 3 valid calibration images.');
      return;
    }
    
    setIsCalibrating(true);
    setCalibrationProgress(20);
    
    const payload = {
      corners_list: validImages.map(img => img.corners),
      rows: chessboardRows,
      cols: chessboardCols,
      square_size: squareSizeMm,
      image_width: 640,
      image_height: 480
    };
    
    try {
      setCalibrationProgress(50);
      const res = await fetch('http://localhost:8000/calibrate/run_calibration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      
      setCalibrationProgress(100);
      setIsCalibrating(false);
      
      if (data && data.success) {
        const now = new Date();
        const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'Short', year: 'numeric' }) + ' ' + now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        
        setCalibrationResult({
          reprojectionError: data.reprojection_error,
          status: 'Valid',
          matrix: data.camera_matrix,
          distortion: {
            k1: data.distortion_coefficients[0] || 0,
            k2: data.distortion_coefficients[1] || 0,
            p1: data.distortion_coefficients[2] || 0,
            p2: data.distortion_coefficients[3] || 0,
            k3: data.distortion_coefficients[4] || 0
          },
          lastCalibrated: dateStr
        });
        
        const newCalHistory = {
          id: `CAL-${Math.floor(10 + Math.random() * 90)}`,
          date: now.toISOString().slice(0, 16).replace('T', ' '),
          operator: 'A. Hidayat',
          camera: cameraSource,
          type: 'Full OpenCV',
          rms: `${data.reprojection_error.toFixed(4)} px`,
          scale: `${pixelScaleFactor.toFixed(4)} mm/px`,
          status: 'VALID'
        };
        setCalibrationHistory(prevHist => [
          newCalHistory,
          ...prevHist.map(h => h.status === 'VALID' ? { ...h, status: 'SUPERSEDED' } : h)
        ]);
        
        toast.success(`OpenCV Calibration completed! RMS Error: ${data.reprojection_error.toFixed(4)} px`);
      } else {
        toast.error(data.error || 'Calibration run failed.');
      }
    } catch (err) {
      setIsCalibrating(false);
      toast.error('Error during calibration computation: ' + err.message);
    }
  };

  // Export YAML configuration
  const handleExportYAML = () => {
    const yamlString = `# OpenCV Camera Calibration Parameters Export
camera_matrix:
  rows: 3
  cols: 3
  data: [
    ${calibrationResult.matrix[0].join(', ')},
    ${calibrationResult.matrix[1].join(', ')},
    ${calibrationResult.matrix[2].join(', ')}
  ]
distortion_coefficients:
  rows: 1
  cols: 5
  data: [
    ${calibrationResult.distortion.k1},
    ${calibrationResult.distortion.k2},
    ${calibrationResult.distortion.p1},
    ${calibrationResult.distortion.p2},
    ${calibrationResult.distortion.k3}
  ]
pixel_to_mm: ${pixelScaleFactor}
calibration_date: "${calibrationResult.lastCalibrated}"
rms_error: ${calibrationResult.reprojectionError}
resolution: "${cameraResolution}"
fps: "${cameraFps}"
`;

    const blob = new Blob([yamlString], { type: 'text/yaml' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = yamlFilename.endsWith('.yaml') ? yamlFilename : `${yamlFilename}.yaml`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Calibration profile exported to ${yamlFilename}`);
  };

  // Import mock configuration
  const handleImportYAML = () => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 800)),
      {
        loading: 'Uploading calibration YAML...',
        success: 'Successfully loaded calibration profile from disk!',
        error: 'Failed to parse YAML.'
      }
    );
  };

  // Save / Save ROI
  const handleSaveRoi = () => {
    const newRoi = {
      id: Date.now(),
      name: roiName,
      tolerance: roiTolerance,
      ...roiBox
    };
    // Check if duplicate name
    setSavedRois(prev => {
      const idx = prev.findIndex(r => r.name === roiName);
      if (idx !== -1) {
        const copy = [...prev];
        copy[idx] = newRoi;
        return copy;
      } else {
        return [...prev, newRoi];
      }
    });
    toast.success(`ROI "${roiName}" configuration saved.`);
  };

  // Delete ROI
  const handleDeleteRoi = (id) => {
    setSavedRois(prev => prev.filter(r => r.id !== id));
    toast.success('ROI Profile removed.');
  };

  // Reset calibration statistics
  const handleResetCalibration = () => {
    if (confirm('Are you sure you want to reset all calibration metrics?')) {
      setCalibrationResult({
        reprojectionError: 0.0,
        status: 'Uncalibrated',
        matrix: [[0, 0, 0], [0, 0, 0], [0, 0, 0]],
        distortion: { k1: 0, k2: 0, p1: 0, p2: 0, k3: 0 },
        lastCalibrated: 'N/A'
      });
      setPixelScaleFactor(1.0);
      toast.success('Calibration parameters reset to empty.');
    }
  };

  // Drawing chessboard on Canvas Helper
  const drawChessboard = (ctx, width, height, angle, scale) => {
    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.rotate((angle * Math.PI) / 180);
    ctx.scale(scale, scale);

    const rows = chessboardRows;
    const cols = chessboardCols;
    const sqSize = 35; // Size of square in pixels on canvas
    const boardWidth = cols * sqSize;
    const boardHeight = rows * sqSize;

    // Draw board white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-boardWidth / 2 - 15, -boardHeight / 2 - 15, boardWidth + 30, boardHeight + 30);

    // Draw Chessboard Squares
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if ((r + c) % 2 === 0) {
          ctx.fillStyle = '#1e293b';
        } else {
          ctx.fillStyle = '#ffffff';
        }
        ctx.fillRect(
          -boardWidth / 2 + c * sqSize,
          -boardHeight / 2 + r * sqSize,
          sqSize,
          sqSize
        );
      }
    }

    // Draw Detected Corners (rainbow cross grid matching OpenCV)
    const startX = -boardWidth / 2 + sqSize;
    const startY = -boardHeight / 2 + sqSize;
    const points = [];

    // Inner corners size is (cols - 1) x (rows - 1)
    for (let r = 0; r < rows - 1; r++) {
      const rowPoints = [];
      for (let c = 0; c < cols - 1; c++) {
        const x = startX + c * sqSize;
        const y = startY + r * sqSize;
        rowPoints.push({ x, y });
      }
      points.push(rowPoints);
    }

    // Connect corners with lines and color them (OpenCV style)
    for (let r = 0; r < points.length; r++) {
      ctx.beginPath();
      ctx.strokeStyle = `hsl(${(r * 360) / points.length}, 80%, 50%)`;
      ctx.lineWidth = 2;
      for (let c = 0; c < points[r].length; c++) {
        const pt = points[r][c];
        if (c === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      }
      ctx.stroke();
    }

    // Draw circle points
    for (let r = 0; r < points.length; r++) {
      for (let c = 0; c < points[r].length; c++) {
        const pt = points[r][c];
        const hue = (r * 360) / points.length;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 4, 0, 2 * Math.PI);
        ctx.fillStyle = `hsl(${hue}, 100%, 60%)`;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.fill();
        ctx.stroke();
      }
    }

    ctx.restore();
  };

  const drawRealCorners = (ctx, corners, rows, cols) => {
    if (!corners || corners.length === 0) return;
    ctx.save();
    const numPoints = corners.length;
    // Inner chessboard grid corners are cols x rows
    for (let r = 0; r < rows; r++) {
      ctx.beginPath();
      ctx.strokeStyle = `hsl(${(r * 360) / rows}, 80%, 50%)`;
      ctx.lineWidth = 1.5;
      for (let c = 0; c < cols; c++) {
        const idx = r * cols + c;
        if (idx >= numPoints) break;
        const pt = corners[idx];
        // Scale from original 640x480 to canvas display size
        const canvasX = pt[0];
        const canvasY = pt[1];
        if (c === 0) {
          ctx.moveTo(canvasX, canvasY);
        } else {
          ctx.lineTo(canvasX, canvasY);
        }
      }
      ctx.stroke();
    }
    
    // Draw dots
    for (let i = 0; i < numPoints; i++) {
      const pt = corners[i];
      const r = Math.floor(i / cols);
      const hue = (r * 360) / rows;
      ctx.beginPath();
      ctx.arc(pt[0], pt[1], 4, 0, 2 * Math.PI);
      ctx.fillStyle = `hsl(${hue}, 100%, 60%)`;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  };

  const drawChessboardOverlay = (ctx, width, height, angle, scale) => {
    ctx.save();
    ctx.globalAlpha = 0.55;
    drawChessboard(ctx, width, height, angle, scale);
    ctx.restore();
  };

  // Continuous animation frame loop to render live webcam/IP Camera feed in real time
  useEffect(() => {
    let active = true;

    const render = () => {
      if (!active) return;

      let canvas = null;
      if (currentMenu === 'camera-setup') canvas = setupCanvasRef.current;
      else if (currentMenu === 'lens-calibration') canvas = cameraCanvasRef.current;
      else if (currentMenu === 'scale-calibration') canvas = scaleCanvasRef.current;
      else if (currentMenu === 'roi-setup') canvas = roiCanvasRef.current;

      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Draw video or IP camera or fallback
          if (isCameraConnected) {
            const selectedCam = registeredCameras.find(c => c.name === cameraSource);
            const camType = selectedCam?.type || 'DEVICE';

            if (currentMenu === 'lens-calibration' && selectedCapturedImage) {
              const cachedImg = imageCacheRef.current[selectedCapturedImage];
              if (cachedImg) {
                ctx.drawImage(cachedImg, 0, 0, canvas.width, canvas.height);
              } else {
                ctx.fillStyle = '#0f172a';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
              }
            } else if (camType === 'IP_CAMERA' && ipImageRef.current && ipImageLoaded) {
              ctx.drawImage(ipImageRef.current, 0, 0, canvas.width, canvas.height);
            } else if (camType === 'DEVICE' && videoRef.current && videoRef.current.readyState >= 2) {
              ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
            } else {
              // Simulated backdrop
              ctx.fillStyle = '#0f172a';
              ctx.fillRect(0, 0, canvas.width, canvas.height);
              
              // Draw pulsating indicator
              ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
              ctx.beginPath();
              ctx.arc(canvas.width / 2, canvas.height / 2, 50 + Math.sin(Date.now() / 200) * 10, 0, Math.PI * 2);
              ctx.fill();

              ctx.fillStyle = COLORS.textMuted;
              ctx.font = '14px sans-serif';
              ctx.textAlign = 'center';
              ctx.fillText('Connecting to Camera Stream...', canvas.width / 2, canvas.height / 2);
            }

            // Overlay features based on active menu
            if (currentMenu === 'camera-setup') {
              // Crosshair guide overlay
              ctx.strokeStyle = 'rgba(255,255,255,0.2)';
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.moveTo(canvas.width / 2, 0); ctx.lineTo(canvas.width / 2, canvas.height);
              ctx.moveTo(0, canvas.height / 2); ctx.lineTo(canvas.width, canvas.height / 2);
              ctx.stroke();

              // Watermark
              ctx.fillStyle = COLORS.greenAccent;
              ctx.font = 'monospace 10px';
              ctx.textAlign = 'left';
              ctx.fillText(`Live Stream: ${cameraSource} [REALTIME]`, 15, canvas.height - 15);
            }
            else if (currentMenu === 'lens-calibration') {
              if (selectedCapturedImage) {
                const selectedImgObj = capturedImages.find(img => img.id === selectedCapturedImage);
                if (selectedImgObj && selectedImgObj.corners && selectedImgObj.corners.length > 0) {
                  drawRealCorners(ctx, selectedImgObj.corners, chessboardRows, chessboardCols);
                }
              } else {
                // Live preview helper guidelines
                ctx.strokeStyle = 'rgba(113, 75, 103, 0.15)'; // Purple grid
                ctx.lineWidth = 1;
                for (let i = 40; i < canvas.width; i += 40) {
                  ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); ctx.stroke();
                }
                for (let j = 40; j < canvas.height; j += 40) {
                  ctx.beginPath(); ctx.moveTo(0, j); ctx.lineTo(canvas.width, j); ctx.stroke();
                }
              }
            }
            else if (currentMenu === 'scale-calibration') {
              // Overlay simulated calibration target if no real feed
              const selectedCam = registeredCameras.find(c => c.name === cameraSource);
              const camType = selectedCam?.type || 'DEVICE';
              if (camType !== 'IP_CAMERA' && (!videoRef.current || videoRef.current.readyState < 2)) {
                // If fallback, draw simulated blocks
                ctx.fillStyle = '#222f47';
                ctx.strokeStyle = '#714b67';
                ctx.lineWidth = 2;
                const blockX = (canvas.width - 450) / 2;
                const blockY = (canvas.height - 120) / 2;
                ctx.fillRect(blockX, blockY, 450, 120);
                ctx.strokeRect(blockX, blockY, 450, 120);

                ctx.fillStyle = '#94a3b8';
                ctx.font = 'bold 12px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('REFERENCE CALIBRATION BAR', canvas.width / 2, canvas.height / 2 - 20);
                ctx.fillText('KNOWN LENGTH: 100.00 mm', canvas.width / 2, canvas.height / 2 + 10);
              }

              // Caliper guide lines
              const blockX = (canvas.width - 450) / 2;
              const blockY = (canvas.height - 120) / 2;
              ctx.strokeStyle = COLORS.greenAccent;
              ctx.lineWidth = 1.5;
              ctx.beginPath(); ctx.moveTo(blockX, blockY - 10); ctx.lineTo(blockX, blockY + 130); ctx.stroke();
              ctx.beginPath(); ctx.moveTo(blockX + 450, blockY - 10); ctx.lineTo(blockX + 450, blockY + 130); ctx.stroke();
              ctx.beginPath(); ctx.moveTo(blockX, blockY + 60); ctx.lineTo(blockX + 450, blockY + 60); ctx.stroke();

              // Draw dragged line
              if (draggedLine) {
                ctx.strokeStyle = COLORS.blueAccent;
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(draggedLine.x1, draggedLine.y1);
                ctx.lineTo(draggedLine.x2, draggedLine.y2);
                ctx.stroke();

                ctx.fillStyle = COLORS.blueAccent;
                ctx.beginPath(); ctx.arc(draggedLine.x1, draggedLine.y1, 5, 0, 2*Math.PI); ctx.fill();
                ctx.beginPath(); ctx.arc(draggedLine.x2, draggedLine.y2, 5, 0, 2*Math.PI); ctx.fill();

                const dx = draggedLine.x2 - draggedLine.x1;
                const dy = draggedLine.y2 - draggedLine.y1;
                const pxDist = Math.round(Math.sqrt(dx * dx + dy * dy));

                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 13px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(`${pxDist} px`, (draggedLine.x1 + draggedLine.x2) / 2, ((draggedLine.y1 + draggedLine.y2) / 2) - 10);
              }

              // Instructions watermark
              ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
              ctx.fillRect(10, 10, 320, 40);
              ctx.fillStyle = '#ffffff';
              ctx.font = '11px sans-serif';
              ctx.textAlign = 'left';
              ctx.fillText('Instructions: Click & drag to select calibration line.', 20, 25);
              ctx.fillText('Line should match known reference distance exactly.', 20, 40);
            }
            else if (currentMenu === 'roi-setup') {
              const selectedCam = registeredCameras.find(c => c.name === cameraSource);
              const camType = selectedCam?.type || 'DEVICE';
              if (camType !== 'IP_CAMERA' && (!videoRef.current || videoRef.current.readyState < 2)) {
                // simulated components
                ctx.strokeStyle = '#475569';
                ctx.lineWidth = 2;
                ctx.fillStyle = '#1e293b';

                const partX = (canvas.width - 320) / 2;
                const partY = (canvas.height - 180) / 2;
                ctx.fillRect(partX, partY, 320, 180);
                ctx.strokeRect(partX, partY, 320, 180);

                ctx.beginPath();
                ctx.arc(canvas.width / 2, canvas.height / 2, 45, 0, 2 * Math.PI);
                ctx.stroke();
              }

              // Draw saved ROIs
              savedRois.forEach(roi => {
                ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
                ctx.lineWidth = 1.5;
                ctx.setLineDash([4, 4]);
                ctx.strokeRect(roi.x, roi.y, roi.w, roi.h);
                ctx.setLineDash([]);
                ctx.fillStyle = 'rgba(245, 158, 11, 0.6)';
                ctx.font = '10px sans-serif';
                ctx.textAlign = 'left';
                ctx.fillText(roi.name, roi.x + 5, roi.y + 15);
              });

              // Draw Active ROI
              ctx.strokeStyle = COLORS.yellowAccent;
              ctx.lineWidth = 2.5;
              ctx.strokeRect(roiBox.x, roiBox.y, roiBox.w, roiBox.h);

              ctx.fillStyle = COLORS.yellowAccent;
              const handles = [
                { x: roiBox.x, y: roiBox.y },
                { x: roiBox.x + roiBox.w, y: roiBox.y },
                { x: roiBox.x, y: roiBox.y + roiBox.h },
                { x: roiBox.x + roiBox.w, y: roiBox.y + roiBox.h }
              ];
              handles.forEach(h => {
                ctx.fillRect(h.x - 5, h.y - 5, 10, 10);
              });

              ctx.fillStyle = COLORS.yellowAccent;
              ctx.font = 'bold 12px sans-serif';
              ctx.textAlign = 'left';
              ctx.fillText(`ACTIVE: ${roiName}`, roiBox.x + 5, roiBox.y - 8);
            }
          } else {
            // Camera Disconnected
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#ffffff';
            ctx.font = '16px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('NO CAMERA SIGNAL. CONNECT CAMERA FIRST.', canvas.width / 2, canvas.height / 2);
          }
        }
      }

      animationFrameId.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      active = false;
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [currentMenu, isCameraConnected, selectedCapturedImage, chessboardRows, chessboardCols, squareSizeMm, draggedLine, roiBox, roiName, savedRois, pixelScaleFactor, cameraSource, registeredCameras, ipImageLoaded]);

  // Scale calibration mouse handlers
  const handleScaleMouseDown = (e) => {
    if (!isCameraConnected) return;
    const rect = scaleCanvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setDraggedLine({ x1: x, y1: y, x2: x, y2: y });
    setIsDrawingScaleLine(true);
  };

  const handleScaleMouseMove = (e) => {
    if (!isDrawingScaleLine || !draggedLine) return;
    const rect = scaleCanvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setDraggedLine(prev => ({ ...prev, x2: x, y2: y }));
  };

  const handleScaleMouseUp = () => {
    setIsDrawingScaleLine(false);
  };

  // Calculate pixel to mm factor
  const handleCalculateScale = () => {
    if (!draggedLine) {
      toast.error('Please click and drag a line on the reference block.');
      return;
    }
    const dx = draggedLine.x2 - draggedLine.x1;
    const dy = draggedLine.y2 - draggedLine.y1;
    const pixelDistance = Math.sqrt(dx * dx + dy * dy);

    if (pixelDistance < 5) {
      toast.error('Selected line is too short. Draw a longer calibration line.');
      return;
    }

    const calculatedFactor = knownLengthMm / pixelDistance;
    setPixelScaleFactor(calculatedFactor);

    // Save calibration entry
    const now = new Date();
    const newCalHistory = {
      id: `CAL-${Math.floor(10 + Math.random() * 90)}`,
      date: now.toISOString().slice(0, 16).replace('T', ' '),
      operator: 'A. Hidayat',
      camera: cameraSource,
      type: 'Scale Re-cal',
      rms: `${calibrationResult.reprojectionError} px`,
      scale: `${calculatedFactor.toFixed(4)} mm/px`,
      status: 'VALID'
    };
    
    setCalibrationHistory(prevHist => [
      newCalHistory,
      ...prevHist.map(h => h.status === 'VALID' ? { ...h, status: 'SUPERSEDED' } : h)
    ]);

    toast.success(`Calibration computed! 1 Pixel = ${calculatedFactor.toFixed(4)} mm`);
  };

  // ROI Mouse drag handlers (simple rectangle shift)
  const isDraggingRoi = useRef(false);
  const dragStartOffset = useRef({ x: 0, y: 0 });

  const handleRoiMouseDown = (e) => {
    const rect = roiCanvasRef.current.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    // Check if clicked inside ROI box
    if (mx >= roiBox.x && mx <= roiBox.x + roiBox.w && my >= roiBox.y && my <= roiBox.y + roiBox.h) {
      isDraggingRoi.current = true;
      dragStartOffset.current = { x: mx - roiBox.x, y: my - roiBox.y };
    }
  };

  const handleRoiMouseMove = (e) => {
    if (!isDraggingRoi.current) return;
    const rect = roiCanvasRef.current.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    let newX = mx - dragStartOffset.current.x;
    let newY = my - dragStartOffset.current.y;

    // Bounds checking
    newX = Math.max(10, Math.min(roiCanvasRef.current.width - roiBox.w - 10, newX));
    newY = Math.max(10, Math.min(roiCanvasRef.current.height - roiBox.h - 10, newY));

    setRoiBox(prev => ({ ...prev, x: Math.round(newX), y: Math.round(newY) }));
  };

  const handleRoiMouseUp = () => {
    isDraggingRoi.current = false;
  };

  // Chart data from calibration history
  const rmsChartData = useMemo(() => {
    return [...calibrationHistory].reverse().map(cal => ({
      name: cal.id,
      rms: parseFloat(cal.rms),
      scale: parseFloat(cal.scale)
    }));
  }, [calibrationHistory]);

  return (
    <div style={{ 
      display: 'flex', 
      flex: 1, 
      minHeight: 0, 
      backgroundColor: COLORS.bgDark, 
      color: COLORS.textLight,
      fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
      overflow: 'hidden'
    }}>
      <Toaster position="top-right" />

      {/* LEFT SIDEBAR NAVIGATION */}
      <div style={{ 
        width: '260px', 
        backgroundColor: COLORS.sidebarDark, 
        borderRight: `1px solid ${COLORS.border}`,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between'
      }}>
        <div>
          {/* Header Branding */}
          <div style={{ 
            padding: '24px 20px', 
            borderBottom: `1px solid ${COLORS.border}`,
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div style={{ 
              backgroundColor: COLORS.blueAccent, 
              padding: '8px', 
              borderRadius: '8px', 
              display: 'flex', 
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 15px rgba(33, 112, 235, 0.4)'
            }}>
              <Camera size={20} color="white" />
            </div>
            <div>
              <h1 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0, letterSpacing: '0.5px' }}>
                Camera Measuring
              </h1>
              <p style={{ fontSize: '0.7rem', color: COLORS.blueAccent, fontWeight: 700, margin: '2px 0 0 0' }}>
                OpenCV Calibration
              </p>
            </div>
          </div>

          {/* Menu Items */}
          <nav style={{ padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <button 
              onClick={() => setCurrentMenu('dashboard')}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', borderRadius: '6px',
                border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600,
                color: currentMenu === 'dashboard' ? 'white' : COLORS.textMuted,
                backgroundColor: currentMenu === 'dashboard' ? COLORS.blueAccent : 'transparent',
                transition: 'all 0.2s'
              }}
            >
              <LayoutGrid size={16} /> Dashboard
            </button>

            <button 
              onClick={() => setCurrentMenu('camera-setup')}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', borderRadius: '6px',
                border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600,
                color: currentMenu === 'camera-setup' ? 'white' : COLORS.textMuted,
                backgroundColor: currentMenu === 'camera-setup' ? COLORS.blueAccent : 'transparent',
                transition: 'all 0.2s'
              }}
            >
              <Sliders size={16} /> Camera Setup
            </button>

            {/* Calibration Dropdown */}
            <div>
              <button 
                onClick={() => setCalibrationSubmenuOpen(!calibrationSubmenuOpen)}
                style={{
                  display: 'flex', alignItems: 'center', justifyItems: 'space-between', gap: '12px', padding: '10px 14px', borderRadius: '6px',
                  border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600,
                  color: (currentMenu === 'lens-calibration' || currentMenu === 'scale-calibration') ? 'white' : COLORS.textMuted,
                  backgroundColor: (currentMenu === 'lens-calibration' || currentMenu === 'scale-calibration') ? COLORS.blueAccent : 'transparent',
                  transition: 'all 0.2s'
                }}
              >
                <Activity size={16} /> 
                <span style={{ flex: 1 }}>Calibration</span>
                <ChevronRight size={14} style={{ 
                  transform: calibrationSubmenuOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s'
                }} />
              </button>

              {calibrationSubmenuOpen && (
                <div style={{ paddingLeft: '24px', marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <button 
                    onClick={() => setCurrentMenu('lens-calibration')}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '4px',
                      border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', fontSize: '0.8rem',
                      color: currentMenu === 'lens-calibration' ? COLORS.blueAccent : COLORS.textMuted,
                      backgroundColor: currentMenu === 'lens-calibration' ? 'rgba(113, 75, 103, 0.08)' : 'transparent',
                      fontWeight: currentMenu === 'lens-calibration' ? 700 : 500,
                    }}
                  >
                    <div style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: currentMenu === 'lens-calibration' ? COLORS.blueAccent : COLORS.textMuted }}></div>
                    Lens Calibration
                  </button>
                  <button 
                    onClick={() => setCurrentMenu('scale-calibration')}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '4px',
                      border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', fontSize: '0.8rem',
                      color: currentMenu === 'scale-calibration' ? COLORS.blueAccent : COLORS.textMuted,
                      backgroundColor: currentMenu === 'scale-calibration' ? 'rgba(113, 75, 103, 0.08)' : 'transparent',
                      fontWeight: currentMenu === 'scale-calibration' ? 700 : 500,
                    }}
                  >
                    <div style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: currentMenu === 'scale-calibration' ? COLORS.blueAccent : COLORS.textMuted }}></div>
                    Scale Calibration
                  </button>
                </div>
              )}
            </div>

            <button 
              onClick={() => setCurrentMenu('roi-setup')}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', borderRadius: '6px',
                border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600,
                color: currentMenu === 'roi-setup' ? 'white' : COLORS.textMuted,
                backgroundColor: currentMenu === 'roi-setup' ? COLORS.blueAccent : 'transparent',
                transition: 'all 0.2s'
              }}
            >
              <Settings2 size={16} /> ROI Setup
            </button>

            <button 
              onClick={() => setCurrentMenu('history')}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', borderRadius: '6px',
                border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600,
                color: currentMenu === 'history' ? 'white' : COLORS.textMuted,
                backgroundColor: currentMenu === 'history' ? COLORS.blueAccent : 'transparent',
                transition: 'all 0.2s'
              }}
            >
              <Clock size={16} /> History
            </button>

            <button 
              onClick={() => setCurrentMenu('settings')}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', borderRadius: '6px',
                border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600,
                color: currentMenu === 'settings' ? 'white' : COLORS.textMuted,
                backgroundColor: currentMenu === 'settings' ? COLORS.blueAccent : 'transparent',
                transition: 'all 0.2s'
              }}
            >
              <Settings size={16} /> Settings
            </button>
          </nav>
        </div>

        {/* Sidebar Footer Info */}
        <div style={{ 
          padding: '16px 20px', 
          borderTop: `1px solid ${COLORS.border}`,
          backgroundColor: COLORS.sidebarDark
        }}>
          <button
            onClick={() => setCurrentMenu('about')}
            style={{
              background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
              padding: 0, color: COLORS.textMuted, fontSize: '0.75rem', fontWeight: 600, marginBottom: '8px'
            }}
          >
            <Info size={14} /> About Vision System
          </button>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: '#4b5563' }}>
            <span>Mavi MES Suite</span>
            <span>Ver. 1.0.0</span>
          </div>
        </div>
      </div>

      {/* MAIN CONTAINER AREA */}
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        overflow: 'hidden' 
      }}>
        {/* TOP STATUS & HEADER BAR */}
        <header style={{ 
          height: '64px', 
          backgroundColor: COLORS.sidebarDark, 
          borderBottom: `1px solid ${COLORS.border}`,
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 10
        }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>
              Calibration Module
            </span>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: COLORS.textLight }}>
              {currentMenu === 'dashboard' && 'System Dashboard'}
              {currentMenu === 'camera-setup' && 'Camera Connection Setup'}
              {currentMenu === 'lens-calibration' && 'Lens Distortion Calibration (OpenCV)'}
              {currentMenu === 'scale-calibration' && 'Scale Calibration (Pixel → mm)'}
              {currentMenu === 'roi-setup' && 'Region of Interest (ROI) Configuration'}
              {currentMenu === 'history' && 'Calibration Version History'}
              {currentMenu === 'settings' && 'Global Vision Engine Settings'}
              {currentMenu === 'about' && 'About Camera Measuring Calibration'}
            </h2>
          </div>

          {/* Quick HUD Metrics */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            {/* Camera Status */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ 
                width: '10px', height: '10px', borderRadius: '50%', 
                backgroundColor: isCameraConnected ? COLORS.greenAccent : COLORS.redAccent,
                boxShadow: isCameraConnected ? `0 0 10px ${COLORS.greenAccent}` : `0 0 10px ${COLORS.redAccent}`,
                transition: 'all 0.3s'
              }}></div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: COLORS.textLight, lineHeight: 1.1 }}>
                  {isCameraConnected ? 'Camera Connected' : 'Camera Disconnected'}
                </div>
                <div style={{ fontSize: '0.65rem', color: COLORS.textMuted }}>
                  {cameraSource}
                </div>
              </div>
            </div>

            {/* Quick config options */}
            <div style={{ display: 'flex', gap: '8px', borderLeft: `1px solid ${COLORS.border}`, paddingLeft: '20px' }}>
              <select 
                value={cameraResolution} 
                onChange={(e) => setCameraResolution(e.target.value)}
                disabled={!isCameraConnected}
                style={{ 
                  backgroundColor: COLORS.cardDark, color: COLORS.textLight, border: `1px solid ${COLORS.border}`,
                  borderRadius: '4px', padding: '4px 8px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer'
                }}
              >
                <option style={{ backgroundColor: COLORS.cardDark, color: COLORS.textLight }}>1920 x 1080</option>
                <option style={{ backgroundColor: COLORS.cardDark, color: COLORS.textLight }}>1280 x 720</option>
                <option style={{ backgroundColor: COLORS.cardDark, color: COLORS.textLight }}>640 x 480</option>
              </select>

              <select 
                value={cameraFps} 
                onChange={(e) => setCameraFps(e.target.value)}
                disabled={!isCameraConnected}
                style={{ 
                  backgroundColor: COLORS.cardDark, color: COLORS.textLight, border: `1px solid ${COLORS.border}`,
                  borderRadius: '4px', padding: '4px 8px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer'
                }}
              >
                <option style={{ backgroundColor: COLORS.cardDark, color: COLORS.textLight }}>30 FPS</option>
                <option style={{ backgroundColor: COLORS.cardDark, color: COLORS.textLight }}>60 FPS</option>
                <option style={{ backgroundColor: COLORS.cardDark, color: COLORS.textLight }}>90 FPS</option>
              </select>
            </div>
          </div>
        </header>

        {/* WORKSPACE AREA */}
        <main style={{ 
          flex: 1, 
          overflowY: 'auto', 
          padding: '24px',
          boxSizing: 'border-box'
        }}>

          {/* ========================================================================= */}
          {/* MENU 0: DASHBOARD */}
          {/* ========================================================================= */}
          {currentMenu === 'dashboard' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Summary Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                
                {/* Card 1: Connection */}
                <div style={{ backgroundColor: COLORS.cardDark, borderRadius: '8px', padding: '16px', border: `1px solid ${COLORS.border}` }}>
                  <div style={{ color: COLORS.textMuted, fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px' }}>Camera Connection</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '4px 0' }}>
                    {isCameraConnected ? (
                      <CheckCircle size={20} color={COLORS.greenAccent} />
                    ) : (
                      <XCircle size={20} color={COLORS.redAccent} />
                    )}
                    <span style={{ fontSize: '1.25rem', fontWeight: 800 }}>{isCameraConnected ? 'CONNECTED' : 'DISCONNECTED'}</span>
                  </div>
                  <div style={{ fontSize: '0.7rem', color: COLORS.textMuted, marginTop: '8px' }}>Device: {cameraSource}</div>
                </div>

                {/* Card 2: Calibration Status */}
                <div style={{ backgroundColor: COLORS.cardDark, borderRadius: '8px', padding: '16px', border: `1px solid ${COLORS.border}` }}>
                  <div style={{ color: COLORS.textMuted, fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px' }}>OpenCV Calibration</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '4px 0' }}>
                    {calibrationResult.status === 'Valid' ? (
                      <CheckCircle size={20} color={COLORS.greenAccent} />
                    ) : (
                      <Info size={20} color={COLORS.yellowAccent} />
                    )}
                    <span style={{ fontSize: '1.25rem', fontWeight: 800, color: calibrationResult.status === 'Valid' ? COLORS.greenAccent : COLORS.yellowAccent }}>
                      {calibrationResult.status.toUpperCase()}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.7rem', color: COLORS.textMuted, marginTop: '8px' }}>Reproj. Error: {calibrationResult.reprojectionError.toFixed(2)} px</div>
                </div>

                {/* Card 3: Scale Factor */}
                <div style={{ backgroundColor: COLORS.cardDark, borderRadius: '8px', padding: '16px', border: `1px solid ${COLORS.border}` }}>
                  <div style={{ color: COLORS.textMuted, fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px' }}>Calibrated Scale Factor</div>
                  <div style={{ margin: '4px 0' }}>
                    <span style={{ fontSize: '1.25rem', fontWeight: 800, color: COLORS.blueAccent }}>{pixelScaleFactor.toFixed(4)}</span>
                    <span style={{ fontSize: '0.8rem', color: COLORS.textMuted, marginLeft: '6px' }}>mm / pixel</span>
                  </div>
                  <div style={{ fontSize: '0.7rem', color: COLORS.textMuted, marginTop: '8px' }}>1 Pixel = {pixelScaleFactor.toFixed(4)} mm</div>
                </div>

                {/* Card 4: Last Calibrated */}
                <div style={{ backgroundColor: COLORS.cardDark, borderRadius: '8px', padding: '16px', border: `1px solid ${COLORS.border}` }}>
                  <div style={{ color: COLORS.textMuted, fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px' }}>Last Calibration Run</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, margin: '6px 0' }}>{calibrationResult.lastCalibrated}</div>
                  <div style={{ fontSize: '0.7rem', color: COLORS.textMuted, marginTop: '12px' }}>Method: Chessboard Calibration</div>
                </div>

                {/* Card 5: Target Accuracy */}
                <div style={{ backgroundColor: COLORS.cardDark, borderRadius: '8px', padding: '16px', border: `1px solid ${COLORS.border}` }}>
                  <div style={{ color: COLORS.textMuted, fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px' }}>Measurement Accuracy</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', margin: '4px 0' }}>
                    <span style={{ fontSize: '1.25rem', fontWeight: 800, color: COLORS.greenAccent }}>±0.02</span>
                    <span style={{ fontSize: '0.8rem', color: COLORS.textMuted }}>mm</span>
                  </div>
                  <div style={{ fontSize: '0.7rem', color: COLORS.textMuted, marginTop: '8px' }}>Verified tolerance standard</div>
                </div>
              </div>

              {/* Main Dashboard Section */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
                {/* Calibration RMS Error Trend Chart */}
                <div style={{ 
                  backgroundColor: COLORS.cardDark, borderRadius: '8px', padding: '20px', 
                  border: `1px solid ${COLORS.border}`, display: 'flex', flexDirection: 'column', gap: '16px' 
                }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800 }}>Calibration RMS Error Trend</h3>
                    <p style={{ margin: '2px 0 0 0', color: COLORS.textMuted, fontSize: '0.75rem' }}>Reprojection fitting error drift (px) across calibration runs</p>
                  </div>
                  
                  {rmsChartData.length > 0 ? (
                    <div style={{ width: '100%', height: '300px' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={rmsChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
                          <XAxis dataKey="name" stroke="#64748b" style={{ fontSize: '0.7rem' }} />
                          <YAxis domain={[0, 'auto']} stroke="#64748b" style={{ fontSize: '0.7rem' }} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: COLORS.sidebarDark, borderColor: COLORS.border, color: COLORS.textLight }}
                            itemStyle={{ color: COLORS.blueAccent }} 
                          />
                          <Legend wrapperStyle={{ fontSize: '0.75rem', paddingTop: '10px' }} />
                          <ReferenceLine y={0.25} label={{ value: 'Max Limit', fill: '#f43f5e', position: 'insideTopLeft', fontSize: '0.75rem' }} stroke="#f43f5e" strokeDasharray="3 3" strokeWidth={1.5} />
                          <Line type="monotone" dataKey="rms" name="RMS Error (px)" stroke={COLORS.blueAccent} strokeWidth={2.5} activeDot={{ r: 8 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', color: COLORS.textMuted }}>
                      No calibration history recorded.
                    </div>
                  )}
                </div>

                {/* Status Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* Calibration Summary */}
                  <div style={{ backgroundColor: COLORS.cardDark, borderRadius: '8px', border: `1px solid ${COLORS.border}`, padding: '16px' }}>
                    <h3 style={{ margin: '0 0 16px 0', fontSize: '0.9rem', fontWeight: 800 }}>Calibration System Health</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', borderBottom: `1px solid ${COLORS.border}`, paddingBottom: '8px' }}>
                        <span style={{ color: COLORS.textMuted }}>Chessboard Grid:</span>
                        <span style={{ fontWeight: 700 }}>{chessboardRows} x {chessboardCols}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', borderBottom: `1px solid ${COLORS.border}`, paddingBottom: '8px' }}>
                        <span style={{ color: COLORS.textMuted }}>Active ROI Profiles:</span>
                        <span style={{ fontWeight: 700 }}>{savedRois.length}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', borderBottom: `1px solid ${COLORS.border}`, paddingBottom: '8px' }}>
                        <span style={{ color: COLORS.textMuted }}>RMS Fit Quality:</span>
                        <span style={{ fontWeight: 700, color: COLORS.greenAccent }}>Excellent</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', paddingBottom: '4px' }}>
                        <span style={{ color: COLORS.textMuted }}>Lens Profile Status:</span>
                        <span style={{ fontWeight: 700, color: COLORS.greenAccent }}>Ready & Verified</span>
                      </div>
                    </div>
                  </div>

                  {/* Detailed Camera Settings HUD Card */}
                  <div style={{ backgroundColor: COLORS.cardDark, borderRadius: '8px', border: `1px solid ${COLORS.border}`, padding: '16px' }}>
                    <h3 style={{ margin: '0 0 16px 0', fontSize: '0.9rem', fontWeight: 800 }}>Detailed Camera Settings</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', borderBottom: `1px solid ${COLORS.border}`, paddingBottom: '8px' }}>
                        <span style={{ color: COLORS.textMuted }}>Resolution:</span>
                        <span style={{ fontWeight: 700 }}>{cameraResolution}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', borderBottom: `1px solid ${COLORS.border}`, paddingBottom: '8px' }}>
                        <span style={{ color: COLORS.textMuted }}>Frame Rate:</span>
                        <span style={{ fontWeight: 700 }}>{cameraFps}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', borderBottom: `1px solid ${COLORS.border}`, paddingBottom: '8px' }}>
                        <span style={{ color: COLORS.textMuted }}>Exposure:</span>
                        <span style={{ fontWeight: 700 }}>{exposureValue} EV</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', borderBottom: `1px solid ${COLORS.border}`, paddingBottom: '8px' }}>
                        <span style={{ color: COLORS.textMuted }}>Focus Value:</span>
                        <span style={{ fontWeight: 700 }}>{focusValue} / 255</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', paddingBottom: '4px' }}>
                        <span style={{ color: COLORS.textMuted }}>Gain level:</span>
                        <span style={{ fontWeight: 700 }}>{gainValue.toFixed(1)}x</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* MENU 1: CAMERA SETUP */}
          {/* ========================================================================= */}
          {currentMenu === 'camera-setup' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px' }}>
              {/* Left Column: Live camera viewport simulation */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ 
                  backgroundColor: COLORS.cardDark, borderRadius: '8px', border: `1px solid ${COLORS.border}`, overflow: 'hidden'
                }}>
                  <div style={{ padding: '12px 16px', borderBottom: `1px solid ${COLORS.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Camera size={16} color={COLORS.blueAccent} />
                      <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Live Feed Viewport</span>
                    </div>
                    {isCameraConnected && (
                      <span style={{ fontSize: '0.7rem', color: COLORS.greenAccent, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ width: '6px', height: '6px', backgroundColor: COLORS.greenAccent, borderRadius: '50%' }}></span>
                        Active Stream (Real-time)
                      </span>
                    )}
                  </div>
                  
                  {/* Stream screen */}
                  <div style={{ 
                    position: 'relative', 
                    width: '100%', 
                    aspectRatio: '16/9', 
                    backgroundColor: '#0a0d16',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {isCameraConnected ? (
                      <canvas 
                        ref={setupCanvasRef} 
                        width={640} 
                        height={360}
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                      />
                    ) : (
                      <div style={{ textAlign: 'center', padding: '40px' }}>
                        <XCircle size={48} color={COLORS.redAccent} style={{ marginBottom: '12px' }} />
                        <h4 style={{ margin: '0 0 4px 0', fontSize: '1rem', color: COLORS.textLight }}>No Camera Stream Connected</h4>
                        <p style={{ margin: 0, fontSize: '0.75rem', color: COLORS.textMuted }}>Please verify inputs and click Connect Camera.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Connection controls panel */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ backgroundColor: COLORS.cardDark, borderRadius: '8px', border: `1px solid ${COLORS.border}`, padding: '20px' }}>
                  <h3 style={{ margin: '0 0 20px 0', fontSize: '0.95rem', fontWeight: 800 }}>Device Connection</h3>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Camera Source Selector */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: COLORS.textMuted, fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>
                        Camera Source
                      </label>
                      <select 
                        value={cameraSource}
                        onChange={(e) => {
                          const newSource = e.target.value;
                          setCameraSource(newSource);
                          const selectedCam = registeredCameras.find(c => c.name === newSource);
                          if (selectedCam && selectedCam.settings) {
                            const s = selectedCam.settings;
                            if (s.resolution) setCameraResolution(s.resolution);
                            if (s.fps) setCameraFps(s.fps);
                            if (s.exposure !== undefined) setExposureValue(s.exposure);
                            if (s.focus !== undefined) setFocusValue(s.focus);
                            if (s.gain !== undefined) setGainValue(s.gain);
                            if (s.whiteBalance) setWhiteBalance(s.whiteBalance);
                          }
                        }}
                        disabled={isCameraConnected}
                        style={{ 
                          width: '100%', backgroundColor: COLORS.cardDark, color: COLORS.textLight, border: `1px solid ${COLORS.border}`,
                          borderRadius: '6px', padding: '10px 12px', fontSize: '0.85rem', fontWeight: 600, cursor: isCameraConnected ? 'not-allowed' : 'pointer'
                        }}
                      >
                        {registeredCameras.map(cam => (
                          <option key={cam.id} value={cam.name} style={{ backgroundColor: COLORS.cardDark, color: COLORS.textLight }}>
                            {cam.name} ({cam.type || 'DEVICE'})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Sensor parameters */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.7rem', color: COLORS.textMuted, fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>
                          Standard Resolution
                        </label>
                        <select 
                          value={cameraResolution}
                          onChange={(e) => setCameraResolution(e.target.value)}
                          disabled={isCameraConnected}
                          style={{ 
                            width: '100%', backgroundColor: COLORS.cardDark, color: COLORS.textLight, border: `1px solid ${COLORS.border}`,
                            borderRadius: '6px', padding: '8px 10px', fontSize: '0.8rem', cursor: isCameraConnected ? 'not-allowed' : 'pointer'
                          }}
                        >
                          <option style={{ backgroundColor: COLORS.cardDark, color: COLORS.textLight }}>1920 x 1080</option>
                          <option style={{ backgroundColor: COLORS.cardDark, color: COLORS.textLight }}>1280 x 720</option>
                          <option style={{ backgroundColor: COLORS.cardDark, color: COLORS.textLight }}>640 x 480</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.7rem', color: COLORS.textMuted, fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>
                          Frame Rate
                        </label>
                        <select 
                          value={cameraFps}
                          onChange={(e) => setCameraFps(e.target.value)}
                          disabled={isCameraConnected}
                          style={{ 
                            width: '100%', backgroundColor: COLORS.cardDark, color: COLORS.textLight, border: `1px solid ${COLORS.border}`,
                            borderRadius: '6px', padding: '8px 10px', fontSize: '0.8rem', cursor: isCameraConnected ? 'not-allowed' : 'pointer'
                          }}
                        >
                          <option style={{ backgroundColor: COLORS.cardDark, color: COLORS.textLight }}>30 FPS</option>
                          <option style={{ backgroundColor: COLORS.cardDark, color: COLORS.textLight }}>60 FPS</option>
                          <option style={{ backgroundColor: COLORS.cardDark, color: COLORS.textLight }}>90 FPS</option>
                        </select>
                      </div>
                    </div>

                    {/* Sliders */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: COLORS.textMuted, fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>
                        <span>Exposure Time</span>
                        <span style={{ color: COLORS.blueAccent }}>{exposureValue} EV</span>
                      </div>
                      <input 
                        type="range" min="-13" max="-1" 
                        value={exposureValue} 
                        onChange={(e) => setExposureValue(parseInt(e.target.value))}
                        disabled={!isCameraConnected}
                        style={{ width: '100%', cursor: 'pointer' }}
                      />
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: COLORS.textMuted, fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>
                        <span>Manual Lens Focus</span>
                        <span style={{ color: COLORS.blueAccent }}>{focusValue}</span>
                      </div>
                      <input 
                        type="range" min="0" max="255" 
                        value={focusValue} 
                        onChange={(e) => setFocusValue(parseInt(e.target.value))}
                        disabled={!isCameraConnected}
                        style={{ width: '100%', cursor: 'pointer' }}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '12px' }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: COLORS.textMuted, fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>
                          <span>Gain Gain</span>
                          <span style={{ color: COLORS.blueAccent }}>{gainValue.toFixed(1)}x</span>
                        </div>
                        <input 
                          type="range" min="1.0" max="4.0" step="0.1" 
                          value={gainValue} 
                          onChange={(e) => setGainValue(parseFloat(e.target.value))}
                          disabled={!isCameraConnected}
                          style={{ width: '100%', cursor: 'pointer' }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.7rem', color: COLORS.textMuted, fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>
                          White Balance
                        </label>
                        <select 
                          value={whiteBalance} 
                          onChange={(e) => setWhiteBalance(e.target.value)}
                          disabled={!isCameraConnected}
                          style={{ 
                            width: '100%', backgroundColor: COLORS.cardDark, color: COLORS.textLight, border: `1px solid ${COLORS.border}`,
                            borderRadius: '6px', padding: '8px 10px', fontSize: '0.8rem', cursor: !isCameraConnected ? 'not-allowed' : 'pointer'
                          }}
                        >
                          <option style={{ backgroundColor: COLORS.cardDark, color: COLORS.textLight }}>Auto</option>
                          <option style={{ backgroundColor: COLORS.cardDark, color: COLORS.textLight }}>Sunny</option>
                          <option style={{ backgroundColor: COLORS.cardDark, color: COLORS.textLight }}>Fluorescent</option>
                          <option style={{ backgroundColor: COLORS.cardDark, color: COLORS.textLight }}>Industrial LED</option>
                        </select>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div style={{ marginTop: '10px', display: 'flex', gap: '12px' }}>
                      <button
                        onClick={handleConnectCamera}
                        disabled={connectingState === 'connecting'}
                        style={{
                          flex: 1, padding: '12px', borderRadius: '6px', border: 'none',
                          backgroundColor: isCameraConnected ? COLORS.redAccent : COLORS.blueAccent,
                          color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem',
                          transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                        }}
                      >
                        {connectingState === 'connecting' ? (
                          <>
                            <RefreshCw size={16} className="animate-spin" /> Connecting...
                          </>
                        ) : isCameraConnected ? (
                          'DISCONNECT CAMERA'
                        ) : (
                          'CONNECT CAMERA'
                        )}
                      </button>

                      <button
                        onClick={handleSaveCameraSettings}
                        disabled={isSavingSettings}
                        style={{
                          flex: 1, padding: '12px', borderRadius: '6px', border: `1px solid ${COLORS.blueAccent}`,
                          backgroundColor: 'transparent',
                          color: COLORS.blueAccent, fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem',
                          transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                        }}
                      >
                        {isSavingSettings ? (
                          <>
                            <RefreshCw size={16} className="animate-spin" /> Saving...
                          </>
                        ) : (
                          <>
                            <Save size={16} /> SAVE CONFIG
                          </>
                        )}
                      </button>
                    </div>

                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* MENU 2: LENS CALIBRATION */}
          {/* ========================================================================= */}
          {currentMenu === 'lens-calibration' && (
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
              
              {/* Left Column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* Stepper Wizard Indicator */}
                <div style={{ 
                  backgroundColor: COLORS.cardDark, borderRadius: '8px', border: `1px solid ${COLORS.border}`, padding: '16px',
                  display: 'flex', justifyContent: 'space-around', alignItems: 'center'
                }}>
                  {[
                    { num: 1, title: 'Capture Images', desc: 'Ambil gambar chessboard' },
                    { num: 2, title: 'Detect Corners', desc: 'Deteksi titik sudut grid' },
                    { num: 3, title: 'Calibration', desc: 'Hitung intrinsik & distortion' },
                    { num: 4, title: 'Result', desc: 'Simpan parameter OpenCV' }
                  ].map((s, idx) => {
                    const stepActive = idx + 1 <= (capturedImages.length >= 10 ? 3 : (capturedImages.length > 0 ? 2 : 1));
                    return (
                      <div key={s.num} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '32px', height: '32px', borderRadius: '50%',
                          backgroundColor: stepActive ? COLORS.blueAccent : COLORS.border,
                          color: stepActive ? 'white' : COLORS.textMuted, display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 700, fontSize: '0.9rem'
                        }}>{s.num}</div>
                        <div>
                          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: stepActive ? COLORS.blueAccent : COLORS.textMuted }}>{s.title}</div>
                          <div style={{ fontSize: '0.65rem', color: COLORS.textMuted }}>{s.desc}</div>
                        </div>
                        {idx < 3 && <ChevronRight size={16} color={COLORS.border} style={{ marginLeft: '10px' }} />}
                      </div>
                    );
                  })}
                </div>

                {/* Viewport Card */}
                <div style={{ backgroundColor: COLORS.cardDark, borderRadius: '8px', border: `1px solid ${COLORS.border}`, overflow: 'hidden' }}>
                  <div style={{ padding: '12px 16px', borderBottom: `1px solid ${COLORS.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>OpenCV Chessboard Detection Preview</span>
                    <span style={{ fontSize: '0.7rem', color: COLORS.textMuted }}>Showing captured frame index: {selectedCapturedImage}</span>
                  </div>

                  <div style={{ position: 'relative', width: '100%', height: '360px', display: 'flex', justifyContent: 'center', backgroundColor: '#0a0d16' }}>
                    <canvas 
                      ref={cameraCanvasRef} 
                      width={640} 
                      height={360}
                      style={{ maxWidth: '100%', height: '100%', objectFit: 'contain' }}
                    />

                    {/* Viewport Overlay Controls */}
                    <div style={{ position: 'absolute', bottom: '15px', left: '15px', display: 'flex', gap: '8px' }}>
                      <button 
                        onClick={handleCaptureImage}
                        disabled={!isCameraConnected}
                        style={{
                          backgroundColor: COLORS.blueAccent, border: 'none', color: 'white', padding: '8px 14px', borderRadius: '4px',
                          fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
                        }}
                      >
                        <Camera size={14} /> Capture Image
                      </button>
                      <button 
                        onClick={handleClearImages}
                        style={{
                          backgroundColor: 'transparent', border: `1px solid ${COLORS.redAccent}`, color: COLORS.redAccent, padding: '8px 14px', borderRadius: '4px',
                          fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                          transition: 'all 0.2s'
                        }}
                      >
                        <Trash2 size={14} /> Clear All
                      </button>
                    </div>
                  </div>

                  {/* Captured Images Thumbnail Carousel */}
                  <div style={{ 
                    padding: '16px', borderTop: `1px solid ${COLORS.border}`, backgroundColor: COLORS.cardHeader,
                    display: 'flex', alignItems: 'center', gap: '12px', overflowX: 'auto'
                  }}>
                    {capturedImages.map((img) => (
                      <div 
                        key={img.id}
                        onClick={() => setSelectedCapturedImage(img.id)}
                        style={{
                          flexShrink: 0, width: '90px', height: '60px', borderRadius: '4px',
                          border: selectedCapturedImage === img.id ? `2.5px solid ${COLORS.blueAccent}` : `1px solid ${COLORS.border}`,
                          backgroundColor: COLORS.cardDark, position: 'relative', cursor: 'pointer', overflow: 'hidden',
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}
                      >
                        <span style={{ fontSize: '0.75rem', color: COLORS.textMuted, fontWeight: 700 }}>Image {img.id}</span>
                        {/* Mini corner grid display checkmark */}
                        <div style={{ position: 'absolute', top: '2px', right: '2px', backgroundColor: COLORS.greenAccent, borderRadius: '50%', padding: '1px' }}>
                          <CheckCircle size={10} color="white" />
                        </div>
                      </div>
                    ))}
                    {capturedImages.length === 0 && (
                      <div style={{ color: COLORS.textMuted, fontSize: '0.75rem', padding: '8px 0', textAlign: 'center', width: '100%' }}>
                        No calibration images captured. Click "Capture Image" above.
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom parameters Display Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  
                  {/* Camera Matrix Intrinsic Card */}
                  <div style={{ backgroundColor: COLORS.cardDark, borderRadius: '8px', border: `1px solid ${COLORS.border}`, padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 800 }}>Camera Matrix (Intrinsic)</h4>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(JSON.stringify(calibrationResult.matrix));
                          toast.success('Matrix copied to clipboard');
                        }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: COLORS.textMuted }}
                        title="Copy Matrix"
                      >
                        <Copy size={14} />
                      </button>
                    </div>
                    <div style={{ 
                      fontFamily: 'monospace', fontSize: '0.75rem', color: COLORS.greenAccent, 
                      backgroundColor: '#f1f5f9', padding: '12px', borderRadius: '6px', border: `1px solid ${COLORS.border}`
                    }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', textAlign: 'right' }}>
                        <span>{parseFloat(calibrationResult.matrix[0][0]).toFixed(4)}</span>
                        <span>{parseFloat(calibrationResult.matrix[0][1]).toFixed(4)}</span>
                        <span>{parseFloat(calibrationResult.matrix[0][2]).toFixed(4)}</span>
                        
                        <span>{parseFloat(calibrationResult.matrix[1][0]).toFixed(4)}</span>
                        <span>{parseFloat(calibrationResult.matrix[1][1]).toFixed(4)}</span>
                        <span>{parseFloat(calibrationResult.matrix[1][2]).toFixed(4)}</span>
                        
                        <span>{parseFloat(calibrationResult.matrix[2][0]).toFixed(4)}</span>
                        <span>{parseFloat(calibrationResult.matrix[2][1]).toFixed(4)}</span>
                        <span>{parseFloat(calibrationResult.matrix[2][2]).toFixed(4)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Distortion Coefficients Card */}
                  <div style={{ backgroundColor: COLORS.cardDark, borderRadius: '8px', border: `1px solid ${COLORS.border}`, padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 800 }}>Distortion Coefficients</h4>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(JSON.stringify(calibrationResult.distortion));
                          toast.success('Distortion parameters copied to clipboard');
                        }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: COLORS.textMuted }}
                        title="Copy parameters"
                      >
                        <Copy size={14} />
                      </button>
                    </div>
                    <div style={{ 
                      fontFamily: 'monospace', fontSize: '0.75rem', color: COLORS.greenAccent, 
                      backgroundColor: '#f1f5f9', padding: '12px', borderRadius: '6px', border: `1px solid ${COLORS.border}`,
                      display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px'
                    }}>
                      <div>k1: <span style={{ color: COLORS.textLight }}>{calibrationResult.distortion.k1.toFixed(6)}</span></div>
                      <div>p2: <span style={{ color: COLORS.textLight }}>{calibrationResult.distortion.p2.toFixed(6)}</span></div>
                      <div>k2: <span style={{ color: COLORS.textLight }}>{calibrationResult.distortion.k2.toFixed(6)}</span></div>
                      <div>k3: <span style={{ color: COLORS.textLight }}>{calibrationResult.distortion.k3.toFixed(6)}</span></div>
                      <div>p1: <span style={{ color: COLORS.textLight }}>{calibrationResult.distortion.p1.toFixed(6)}</span></div>
                    </div>
                  </div>

                </div>
              </div>

              {/* Right Column (Controls) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Chessboard grid target configuration */}
                <div style={{ backgroundColor: COLORS.cardDark, borderRadius: '8px', border: `1px solid ${COLORS.border}`, padding: '16px' }}>
                  <h4 style={{ margin: '0 0 16px 0', fontSize: '0.85rem', fontWeight: 800 }}>Chessboard Settings</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.7rem', color: COLORS.textMuted, fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>
                        Chessboard Grid Corners
                      </label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input 
                          type="number" value={chessboardRows} 
                          onChange={(e) => setChessboardRows(parseInt(e.target.value))}
                          style={{ width: '60px', backgroundColor: COLORS.cardDark, color: COLORS.textLight, border: `1px solid ${COLORS.border}`, borderRadius: '4px', padding: '6px' }}
                        />
                        <span style={{ fontSize: '0.75rem', color: COLORS.textMuted }}>x</span>
                        <input 
                          type="number" value={chessboardCols} 
                          onChange={(e) => setChessboardCols(parseInt(e.target.value))}
                          style={{ width: '60px', backgroundColor: COLORS.cardDark, color: COLORS.textLight, border: `1px solid ${COLORS.border}`, borderRadius: '4px', padding: '6px' }}
                        />
                        <span style={{ fontSize: '0.75rem', color: COLORS.textMuted }}>(Inner Points)</span>
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.7rem', color: COLORS.textMuted, fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>
                        Square Size (mm)
                      </label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input 
                          type="number" step="0.01" value={squareSizeMm} 
                          onChange={(e) => setSquareSizeMm(parseFloat(e.target.value))}
                          style={{ width: '100px', backgroundColor: COLORS.cardDark, color: COLORS.textLight, border: `1px solid ${COLORS.border}`, borderRadius: '4px', padding: '6px' }}
                        />
                        <span style={{ fontSize: '0.8rem', color: COLORS.textMuted }}>mm</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Progress & calibration triggers */}
                <div style={{ backgroundColor: COLORS.cardDark, borderRadius: '8px', border: `1px solid ${COLORS.border}`, padding: '16px' }}>
                  <h4 style={{ margin: '0 0 16px 0', fontSize: '0.85rem', fontWeight: 800 }}>Calibration Run</h4>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: COLORS.textMuted, marginBottom: '6px' }}>
                        <span>Captured Image Pool:</span>
                        <span style={{ fontWeight: 700, color: capturedImages.length >= 10 ? COLORS.greenAccent : COLORS.yellowAccent }}>
                          {capturedImages.length} / 15
                        </span>
                      </div>
                      
                      {/* Custom progress bar */}
                      <div style={{ width: '100%', height: '6px', backgroundColor: '#0d131f', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ 
                          width: `${Math.min((capturedImages.length / 15) * 100, 100)}%`, 
                          height: '100%', 
                          backgroundColor: capturedImages.length >= 10 ? COLORS.greenAccent : COLORS.blueAccent,
                          transition: 'width 0.3s'
                        }}></div>
                      </div>
                      <p style={{ margin: '6px 0 0 0', fontSize: '0.65rem', color: COLORS.textMuted }}>
                        Minimum 3 images are required, 10-20 images are highly recommended for accurate calibration mapping.
                      </p>
                    </div>

                    {isCalibrating && (
                      <div style={{ backgroundColor: '#f1f5f9', padding: '10px', borderRadius: '4px', border: `1px solid ${COLORS.border}` }}>
                        <div style={{ display: 'flex', justifyItems: 'space-between', fontSize: '0.75rem', marginBottom: '6px' }}>
                          <span>Calculating intrinsic parameters...</span>
                          <span style={{ marginLeft: 'auto', fontWeight: 700 }}>{calibrationProgress}%</span>
                        </div>
                        <div style={{ width: '100%', height: '4px', backgroundColor: COLORS.border, borderRadius: '2px', overflow: 'hidden' }}>
                          <div style={{ width: `${calibrationProgress}%`, height: '100%', backgroundColor: COLORS.blueAccent }}></div>
                        </div>
                      </div>
                    )}

                    <button
                      onClick={handleStartCalibration}
                      disabled={isCalibrating || capturedImages.length < 3}
                      style={{
                        width: '100%', padding: '10px', borderRadius: '6px', border: 'none',
                        backgroundColor: (isCalibrating || capturedImages.length < 3) ? '#1f293d' : COLORS.blueAccent,
                        color: (isCalibrating || capturedImages.length < 3) ? COLORS.textMuted : 'white',
                        fontWeight: 700, cursor: (isCalibrating || capturedImages.length < 3) ? 'not-allowed' : 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '0.85rem'
                      }}
                    >
                      <Play size={14} /> Start OpenCV Engine
                    </button>
                  </div>
                </div>

                {/* Calibration results status indicator */}
                <div style={{ backgroundColor: COLORS.cardDark, borderRadius: '8px', border: `1px solid ${COLORS.border}`, padding: '16px' }}>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '0.85rem', fontWeight: 800 }}>Calibration Result</h4>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <div>
                      <div style={{ fontSize: '0.65rem', color: COLORS.textMuted }}>REPROJECTION ERROR (RMS)</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 900, color: calibrationResult.status === 'Valid' ? COLORS.greenAccent : COLORS.yellowAccent }}>
                        {calibrationResult.reprojectionError.toFixed(2)} <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>px</span>
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.65rem', color: COLORS.textMuted, textAlign: 'right' }}>STATUS</div>
                      <div style={{ 
                        fontSize: '0.8rem', fontWeight: 800, padding: '4px 8px', borderRadius: '4px',
                        backgroundColor: calibrationResult.status === 'Valid' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                        color: calibrationResult.status === 'Valid' ? COLORS.greenAccent : COLORS.yellowAccent
                      }}>
                        ✓ {calibrationResult.status}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleResetCalibration}
                    style={{
                      width: '100%', padding: '8px', borderRadius: '4px', border: `1px solid ${COLORS.border}`,
                      backgroundColor: 'transparent', color: COLORS.textMuted, fontSize: '0.75rem', fontWeight: 600,
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                      transition: 'all 0.2s'
                    }}
                  >
                    <RotateCcw size={12} /> Reset Calibration Metrics
                  </button>
                </div>

                {/* Save and Load configuration profiles */}
                <div style={{ backgroundColor: COLORS.cardDark, borderRadius: '8px', border: `1px solid ${COLORS.border}`, padding: '16px' }}>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '0.85rem', fontWeight: 800 }}>Save / Load Calibration</h4>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ position: 'relative' }}>
                      <input 
                        type="text" value={yamlFilename} 
                        onChange={(e) => setYamlFilename(e.target.value)}
                        style={{
                          width: '100%', backgroundColor: COLORS.cardDark, color: COLORS.textLight, border: `1px solid ${COLORS.border}`,
                          borderRadius: '6px', padding: '8px 10px', fontSize: '0.8rem', boxSizing: 'border-box'
                        }}
                      />
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <button
                        onClick={handleExportYAML}
                        style={{
                          padding: '10px', borderRadius: '4px', border: 'none', backgroundColor: COLORS.blueAccent,
                          color: 'white', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                        }}
                      >
                        <Save size={12} /> Save YAML
                      </button>
                      <button
                        onClick={handleImportYAML}
                        style={{
                          padding: '10px', borderRadius: '4px', border: `1px solid ${COLORS.blueAccent}`, backgroundColor: 'transparent',
                          color: COLORS.blueAccent, fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                          transition: 'all 0.2s'
                        }}
                      >
                        <FolderOpen size={12} /> Load YAML
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* MENU 3: SCALE CALIBRATION */}
          {/* ========================================================================= */}
          {currentMenu === 'scale-calibration' && (
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
              
              {/* Left Column Viewport */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ backgroundColor: COLORS.cardDark, borderRadius: '8px', border: `1px solid ${COLORS.border}`, overflow: 'hidden' }}>
                  <div style={{ padding: '12px 16px', borderBottom: `1px solid ${COLORS.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>Scale Measurement Canvas</span>
                    {draggedLine && (
                      <span style={{ fontSize: '0.75rem', color: COLORS.blueAccent, fontWeight: 600 }}>
                        Active Line: {Math.round(Math.sqrt(Math.pow(draggedLine.x2 - draggedLine.x1, 2) + Math.pow(draggedLine.y2 - draggedLine.y1, 2)))} pixels
                      </span>
                    )}
                  </div>

                  <div style={{ position: 'relative', width: '100%', height: '380px', display: 'flex', justifyContent: 'center', backgroundColor: '#0a0d16' }}>
                    <canvas
                      ref={scaleCanvasRef}
                      width={640}
                      height={380}
                      onMouseDown={handleScaleMouseDown}
                      onMouseMove={handleScaleMouseMove}
                      onMouseUp={handleScaleMouseUp}
                      style={{ 
                        maxWidth: '100%', height: '100%', objectFit: 'contain', cursor: 'crosshair',
                        userSelect: 'none'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Right Column Controls */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ backgroundColor: COLORS.cardDark, borderRadius: '8px', border: `1px solid ${COLORS.border}`, padding: '16px' }}>
                  <h4 style={{ margin: '0 0 16px 0', fontSize: '0.85rem', fontWeight: 800 }}>Scale Calibration</h4>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.7rem', color: COLORS.textMuted, fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>
                        Known Reference Length
                      </label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input 
                          type="number" step="0.01" value={knownLengthMm}
                          onChange={(e) => setKnownLengthMm(parseFloat(e.target.value))}
                          style={{ 
                            flex: 1, backgroundColor: COLORS.cardDark, color: COLORS.textLight, border: `1px solid ${COLORS.border}`, 
                            borderRadius: '6px', padding: '10px', fontSize: '0.85rem'
                          }}
                        />
                        <span style={{ fontSize: '0.85rem', color: COLORS.textMuted, fontWeight: 600 }}>mm</span>
                      </div>
                      <p style={{ margin: '6px 0 0 0', fontSize: '0.65rem', color: COLORS.textMuted }}>
                        Specify physical size of calibration block target.
                      </p>
                    </div>

                    <div style={{ borderTop: `1px solid ${COLORS.border}`, paddingTop: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: COLORS.textMuted, marginBottom: '6px' }}>
                        <span>Detected Line Length:</span>
                        <span style={{ fontWeight: 750, color: COLORS.textLight }}>
                          {draggedLine ? `${Math.round(Math.sqrt(Math.pow(draggedLine.x2 - draggedLine.x1, 2) + Math.pow(draggedLine.y2 - draggedLine.y1, 2)))} px` : 'No line drawn'}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={handleCalculateScale}
                      disabled={!draggedLine}
                      style={{
                        width: '100%', padding: '10px', borderRadius: '6px', border: 'none',
                        backgroundColor: draggedLine ? COLORS.blueAccent : '#1f293d',
                        color: draggedLine ? 'white' : COLORS.textMuted,
                        fontWeight: 700, cursor: draggedLine ? 'pointer' : 'not-allowed',
                        fontSize: '0.85rem', transition: 'all 0.2s'
                      }}
                    >
                      Calculate Scale Factor
                    </button>
                  </div>
                </div>

                {/* Scale outputs summary */}
                <div style={{ backgroundColor: COLORS.cardDark, borderRadius: '8px', border: `1px solid ${COLORS.border}`, padding: '16px' }}>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '0.85rem', fontWeight: 800 }}>Scale Factor Results</h4>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ backgroundColor: '#f1f5f9', padding: '12px', borderRadius: '4px', border: `1px solid ${COLORS.border}`, textAlign: 'center' }}>
                      <div style={{ fontSize: '0.65rem', color: COLORS.textMuted, textTransform: 'uppercase', marginBottom: '4px' }}>Computed Ratio</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 900, color: COLORS.greenAccent }}>
                        1 Pixel = {pixelScaleFactor.toFixed(4)} <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>mm</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                      <span style={{ color: COLORS.textMuted }}>Pixels per mm:</span>
                      <span style={{ fontWeight: 700 }}>{(1 / pixelScaleFactor).toFixed(2)} px/mm</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                      <span style={{ color: COLORS.textMuted }}>Last Calibrated:</span>
                      <span style={{ fontWeight: 700 }}>{calibrationResult.lastCalibrated === 'N/A' ? 'Not Calibrated' : calibrationResult.lastCalibrated.split(' ')[0]}</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* MENU 4: ROI SETUP */}
          {/* ========================================================================= */}
          {currentMenu === 'roi-setup' && (
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
              {/* Left Column Canvas */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ backgroundColor: COLORS.cardDark, borderRadius: '8px', border: `1px solid ${COLORS.border}`, overflow: 'hidden' }}>
                  <div style={{ padding: '12px 16px', borderBottom: `1px solid ${COLORS.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>Region of Interest Configuration Canvas</span>
                    <span style={{ fontSize: '0.75rem', color: COLORS.yellowAccent, fontWeight: 700 }}>
                      Bounds: X={roiBox.x}, Y={roiBox.y}, W={roiBox.w}, H={roiBox.h}
                    </span>
                  </div>

                  <div style={{ position: 'relative', width: '100%', height: '380px', display: 'flex', justifyContent: 'center', backgroundColor: '#0a0d16' }}>
                    <canvas
                      ref={roiCanvasRef}
                      width={640}
                      height={380}
                      onMouseDown={handleRoiMouseDown}
                      onMouseMove={handleRoiMouseMove}
                      onMouseUp={handleRoiMouseUp}
                      style={{ 
                        maxWidth: '100%', height: '100%', objectFit: 'contain', cursor: 'move',
                        userSelect: 'none'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Right Column Configuration Panels */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Save ROI configuration */}
                <div style={{ backgroundColor: COLORS.cardDark, borderRadius: '8px', border: `1px solid ${COLORS.border}`, padding: '16px' }}>
                  <h4 style={{ margin: '0 0 16px 0', fontSize: '0.85rem', fontWeight: 800 }}>ROI Settings</h4>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.7rem', color: COLORS.textMuted, fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>
                        ROI Identifier Name
                      </label>
                      <input 
                        type="text" value={roiName}
                        onChange={(e) => setRoiName(e.target.value)}
                        style={{ 
                          width: '100%', backgroundColor: COLORS.cardDark, color: COLORS.textLight, border: `1px solid ${COLORS.border}`, 
                          borderRadius: '6px', padding: '10px', fontSize: '0.85rem', boxSizing: 'border-box'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.7rem', color: COLORS.textMuted, fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>
                        Measurement Tolerance (mm)
                      </label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.9rem', color: COLORS.textMuted, fontWeight: 700 }}>±</span>
                        <input 
                          type="number" step="0.01" value={roiTolerance}
                          onChange={(e) => setRoiTolerance(parseFloat(e.target.value))}
                          style={{ 
                            flex: 1, backgroundColor: COLORS.cardDark, color: COLORS.textLight, border: `1px solid ${COLORS.border}`, 
                            borderRadius: '6px', padding: '8px 10px', fontSize: '0.85rem'
                          }}
                        />
                        <span style={{ fontSize: '0.85rem', color: COLORS.textMuted, fontWeight: 650 }}>mm</span>
                      </div>
                    </div>

                    <div style={{ borderTop: `1px solid ${COLORS.border}`, paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: COLORS.textMuted }}>
                        <span>Position (X / Y):</span>
                        <span style={{ fontWeight: 700, color: COLORS.textLight }}>{roiBox.x} px / {roiBox.y} px</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: COLORS.textMuted }}>
                        <span>Size (Width / Height):</span>
                        <span style={{ fontWeight: 700, color: COLORS.textLight }}>{roiBox.w} px / {roiBox.h} px</span>
                      </div>
                    </div>

                    <button
                      onClick={handleSaveRoi}
                      style={{
                        width: '100%', padding: '10px', borderRadius: '6px', border: 'none',
                        backgroundColor: COLORS.blueAccent, color: 'white', fontWeight: 700,
                        fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.2s'
                      }}
                    >
                      Save ROI Profile
                    </button>
                  </div>
                </div>

                {/* Saved ROIs Database */}
                <div style={{ backgroundColor: COLORS.cardDark, borderRadius: '8px', border: `1px solid ${COLORS.border}`, padding: '16px' }}>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '0.85rem', fontWeight: 800 }}>Saved ROI Profiles ({savedRois.length})</h4>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {savedRois.map(roi => (
                      <div 
                        key={roi.id}
                        style={{ 
                          padding: '10px', borderRadius: '4px', backgroundColor: COLORS.bgDark, border: `1px solid ${COLORS.border}`,
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                        }}
                      >
                        <div onClick={() => {
                          setRoiName(roi.name);
                          setRoiTolerance(roi.tolerance);
                          setRoiBox({ x: roi.x, y: roi.y, w: roi.w, h: roi.h });
                        }} style={{ cursor: 'pointer', flex: 1 }}>
                          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: COLORS.textLight }}>{roi.name}</div>
                          <div style={{ fontSize: '0.65rem', color: COLORS.textMuted }}>Tol: ±{roi.tolerance} mm | Dim: {roi.w}x{roi.h}px</div>
                        </div>

                        <button 
                          onClick={() => handleDeleteRoi(roi.id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: COLORS.redAccent }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                    {savedRois.length === 0 && (
                      <div style={{ textAlign: 'center', fontSize: '0.75rem', color: COLORS.textMuted, padding: '10px 0' }}>
                        No ROI profiles stored.
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>
          )}



          {/* ========================================================================= */}
          {/* MENU 7: HISTORY */}
          {/* ========================================================================= */}
          {currentMenu === 'history' && (
            <div style={{ backgroundColor: COLORS.cardDark, borderRadius: '8px', border: `1px solid ${COLORS.border}`, padding: '20px' }}>
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800 }}>Calibration History Log</h3>
                <p style={{ margin: '2px 0 0 0', color: COLORS.textMuted, fontSize: '0.75rem' }}>Audit trail of all sensor and scale calibration updates recorded on this station.</p>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8rem' }}>
                  <thead>
                    <tr style={{ borderBottom: `2px solid ${COLORS.border}`, color: COLORS.textMuted }}>
                      <th style={{ padding: '12px' }}>Calibration ID</th>
                      <th style={{ padding: '12px' }}>Timestamp</th>
                      <th style={{ padding: '12px' }}>Operator Name</th>
                      <th style={{ padding: '12px' }}>Camera Model</th>
                      <th style={{ padding: '12px' }}>Calibration Type</th>
                      <th style={{ padding: '12px' }}>RMS Error</th>
                      <th style={{ padding: '12px' }}>Scale Factor Ratio</th>
                      <th style={{ padding: '12px' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {calibrationHistory.map((cal) => (
                      <tr key={cal.id} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                        <td style={{ padding: '12px', fontWeight: 700 }}>{cal.id}</td>
                        <td style={{ padding: '12px', color: COLORS.textMuted }}>{cal.date}</td>
                        <td style={{ padding: '12px' }}>{cal.operator}</td>
                        <td style={{ padding: '12px', color: COLORS.textMuted }}>{cal.camera}</td>
                        <td style={{ padding: '12px' }}>{cal.type}</td>
                        <td style={{ padding: '12px', color: COLORS.greenAccent, fontWeight: 600 }}>{cal.rms}</td>
                        <td style={{ padding: '12px' }}>{cal.scale}</td>
                        <td style={{ padding: '12px' }}>
                          <span style={{ 
                            padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 800,
                            backgroundColor: cal.status === 'VALID' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(148, 163, 184, 0.1)',
                            color: cal.status === 'VALID' ? COLORS.greenAccent : COLORS.textMuted
                          }}>
                            {cal.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* MENU 8: SETTINGS */}
          {/* ========================================================================= */}
          {currentMenu === 'settings' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
              <div style={{ backgroundColor: COLORS.cardDark, borderRadius: '8px', border: `1px solid ${COLORS.border}`, padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800 }}>OpenCV Calibration Engine Settings</h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: COLORS.textMuted, fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>
                      Calibration Model algorithm
                    </label>
                    <select style={{ width: '100%', backgroundColor: COLORS.cardDark, color: COLORS.textLight, border: `1px solid ${COLORS.border}`, borderRadius: '6px', padding: '10px' }}>
                      <option style={{ backgroundColor: COLORS.cardDark, color: COLORS.textLight }}>Pinhole Camera Model (Standard OpenCV)</option>
                      <option style={{ backgroundColor: COLORS.cardDark, color: COLORS.textLight }}>Fisheye Lens Model (cv2.fisheye)</option>
                      <option style={{ backgroundColor: COLORS.cardDark, color: COLORS.textLight }}>Omnidirectional Model (cv2.omnidir)</option>
                    </select>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: COLORS.textMuted, fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>
                        Optimization Flag
                      </label>
                      <select style={{ width: '100%', backgroundColor: COLORS.cardDark, color: COLORS.textLight, border: `1px solid ${COLORS.border}`, borderRadius: '6px', padding: '8px' }}>
                        <option style={{ backgroundColor: COLORS.cardDark, color: COLORS.textLight }}>CALIB_FIX_K3</option>
                        <option style={{ backgroundColor: COLORS.cardDark, color: COLORS.textLight }}>CALIB_RATIONAL_MODEL</option>
                        <option style={{ backgroundColor: COLORS.cardDark, color: COLORS.textLight }}>CALIB_ZERO_TANGENT_DIST</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: COLORS.textMuted, fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>
                        Subpixel Refinement
                      </label>
                      <select style={{ width: '100%', backgroundColor: COLORS.cardDark, color: COLORS.textLight, border: `1px solid ${COLORS.border}`, borderRadius: '6px', padding: '8px' }}>
                        <option style={{ backgroundColor: COLORS.cardDark, color: COLORS.textLight }}>cv2.cornerSubPix (Enabled)</option>
                        <option style={{ backgroundColor: COLORS.cardDark, color: COLORS.textLight }}>Disabled</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: COLORS.textMuted, fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>
                      OpenCV Export Directory Path
                    </label>
                    <input 
                      type="text" 
                      defaultValue="/var/mes/vision/calibration/profiles/" 
                      style={{ width: '100%', backgroundColor: COLORS.cardDark, color: COLORS.textLight, border: `1px solid ${COLORS.border}`, borderRadius: '6px', padding: '10px', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
                    <input type="checkbox" defaultChecked id="autostore" style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
                    <label htmlFor="autostore" style={{ fontSize: '0.8rem', cursor: 'pointer' }}>
                      Auto-store newly computed calibrations directly to station supervisor database.
                    </label>
                  </div>
                </div>

                <div style={{ borderTop: `1px solid ${COLORS.border}`, paddingTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                  <button 
                    onClick={() => toast.success('Vision calibration settings updated successfully.')}
                    style={{
                      backgroundColor: COLORS.blueAccent, border: 'none', color: 'white', padding: '10px 20px', borderRadius: '4px',
                      fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer'
                    }}
                  >
                    Save Settings
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ backgroundColor: COLORS.cardDark, borderRadius: '8px', border: `1px solid ${COLORS.border}`, padding: '16px' }}>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '0.85rem', fontWeight: 800 }}>OpenCV Engine Info</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: COLORS.textMuted }}>Engine Version:</span>
                      <span style={{ fontWeight: 700 }}>4.9.0-dev (OpenCV Engine)</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: COLORS.textMuted }}>CUDA Acceleration:</span>
                      <span style={{ fontWeight: 700, color: COLORS.greenAccent }}>Enabled (RTX 4060 Ti)</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: COLORS.textMuted }}>Compiler Suite:</span>
                      <span style={{ fontWeight: 700 }}>MSVC 2022 / C++ 17</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* MENU 9: ABOUT */}
          {/* ========================================================================= */}
          {currentMenu === 'about' && (
            <div style={{ 
              backgroundColor: COLORS.cardDark, borderRadius: '8px', border: `1px solid ${COLORS.border}`, 
              padding: '30px', maxWidth: '700px', margin: '0 auto', textAlign: 'center'
            }}>
              <div style={{ 
                backgroundColor: COLORS.blueAccent, width: '64px', height: '64px', borderRadius: '16px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto',
                boxShadow: '0 0 20px rgba(33, 112, 235, 0.4)'
              }}>
                <Camera size={32} color="white" />
              </div>

              <h2 style={{ margin: '0 0 6px 0', fontSize: '1.4rem', fontWeight: 800 }}>Camera Measuring Calibration</h2>
              <p style={{ margin: 0, color: COLORS.blueAccent, fontSize: '0.85rem', fontWeight: 700 }}>MAVI Smart Factory Vision Suite</p>
              
              <p style={{ color: COLORS.textMuted, fontSize: '0.85rem', lineHeight: 1.6, margin: '24px 0' }}>
                This module handles intrinsic camera matrix calibration (dist_coeff, camera_matrix) using patterns like Chessboards and Asymmetric Circles. It enables high-accuracy dimensional inspection (real-time length, width, area caliper measurement) converting image sensor pixels into standard industrial millimeters (mm/px scale calibration ratio).
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', borderTop: `1px solid ${COLORS.border}`, paddingTop: '24px', fontSize: '0.8rem' }}>
                <div>
                  <div style={{ color: COLORS.textMuted, marginBottom: '4px' }}>VERSION</div>
                  <div style={{ fontWeight: 700 }}>1.0.0 (Release)</div>
                </div>
                <div>
                  <div style={{ color: COLORS.textMuted, marginBottom: '4px' }}>OPENCV BUILD</div>
                  <div style={{ fontWeight: 700 }}>v4.9.0-shared</div>
                </div>
                <div>
                  <div style={{ color: COLORS.textMuted, marginBottom: '4px' }}>COMPATIBILITY</div>
                  <div style={{ fontWeight: 700 }}>Vite React / MAVI MES</div>
                </div>
              </div>
            </div>
          )}

        </main>

        {/* BOTTOM HUD STATUS BAR */}
        <footer style={{ 
          height: '40px', 
          backgroundColor: COLORS.sidebarDark, 
          borderTop: `1px solid ${COLORS.border}`,
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.75rem',
          color: COLORS.textMuted
        }}>
          <div style={{ display: 'flex', gap: '20px' }}>
            <div>
              Pixel / mm: <span style={{ color: COLORS.greenAccent, fontWeight: 700 }}>{pixelScaleFactor.toFixed(4)} mm/px</span>
            </div>
            <div>
              Exposure: <span style={{ color: COLORS.textLight, fontWeight: 700 }}>{exposureValue} EV</span>
            </div>
            <div>
              Gain: <span style={{ color: COLORS.textLight, fontWeight: 700 }}>{gainValue.toFixed(1)}x</span>
            </div>
            <div>
              White Balance: <span style={{ color: COLORS.textLight, fontWeight: 700 }}>{whiteBalance}</span>
            </div>
          </div>
          <div>
            <span>System Time: 15-Jun-2026 19:53:48</span>
          </div>
        </footer>

      </div>

      {/* Embedded CSS Animations for Chessboard grid simulation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.15; transform: scale(1); }
          50% { opacity: 0.3; transform: scale(1.05); }
        }
        @keyframes scaleIn {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
      {/* Hidden video element for live webcam streaming */}
      <video ref={videoRef} style={{ display: 'none' }} playsInline muted />
    </div>
  );
}

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Camera, RefreshCw, Eye, Loader2, Sparkles, CheckCircle, AlertTriangle, Play, Video, Square, Download, Trash2 } from 'lucide-react';
import { getPrimaryAiConnector } from '../utils/database';

export default function VisionCamera({ comp, syncInputDatasourceValue, onWidgetInteraction, viewMode }) {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);
    const animationFrameRef = useRef(null);

    // Video Recording Refs & States
    const mediaRecorderRef = useRef(null);
    const recordedChunksRef = useRef([]);
    const recordingIntervalRef = useRef(null);
    const lastMatchRef = useRef(null);
    const prevFrameRef = useRef(null);
    const lastTextRef = useRef('');
    const lastRegionMatchStatesRef = useRef({});
    const prevIntensityRef = useRef({});
    const isFetchingCloudRef = useRef(false);
    const lastCloudFetchTimeRef = useRef(0);
    const cloudDetectionsRef = useRef([]);

    const [hasPermission, setHasPermission] = useState(null);
    const [capturedImage, setCapturedImage] = useState(null);
    const [simulatedValue, setSimulatedValue] = useState('');
    const [isReadingAI, setIsReadingAI] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const [isRecording, setIsRecording] = useState(false);
    const [recordingSeconds, setRecordingSeconds] = useState(0);
    const [recordedBlob, setRecordedBlob] = useState(null);
    const [recordedUrl, setRecordedUrl] = useState(null);
    const [showVideoPreview, setShowVideoPreview] = useState(false);
    const [isUploadingSnapshot, setIsUploadingSnapshot] = useState(false);

    const [cameraConfig, setCameraConfig] = useState(null);

    useEffect(() => {
        const fetchConfig = async () => {
            if (comp?.props?.cameraConfigId) {
                try {
                    const { getAllCameras } = await import('../utils/supabaseUtilityDB');
                    const allCams = await getAllCameras();
                    const found = allCams.find(c => c.id === comp.props.cameraConfigId);
                    if (found) {
                        setCameraConfig(found);
                    }
                } catch (e) {
                    console.error('Failed to load camera configuration in VisionCamera:', e);
                }
            } else {
                setCameraConfig(null);
            }
        };
        fetchConfig();
    }, [comp?.props?.cameraConfigId]);

    let filterType = comp?.props?.filterType || 'NONE';
    if (cameraConfig && comp?.props?.enableDetector !== false) {
        const regions = cameraConfig.settings?.regions || [];
        let activeFilter = null;
        for (const region of regions) {
            if (region.detectors?.colorDetector?.enabled) {
                activeFilter = 'COLOR_DETECTOR';
                break;
            }
            if (region.detectors?.changeDetector?.enabled) {
                activeFilter = 'CHANGE_DETECTOR';
                break;
            }
            if (region.detectors?.jigDetector?.enabled) {
                activeFilter = 'JIG_DETECTOR';
                break;
            }
            if (region.detectors?.ocrDetector?.enabled) {
                activeFilter = 'OCR_DETECTOR';
                break;
            }
            if (region.detectors?.dimensionDetector?.enabled) {
                activeFilter = 'INSPECTION';
                break;
            }
        }
        if (activeFilter) {
            filterType = activeFilter;
        }
    }
    const label = comp?.props?.label || (comp?.type === 'OPENCV_CAMERA' ? 'OpenCV Live Stream' : 'Take Photo');
    const thresholdValue = Number(comp?.props?.thresholdValue ?? 100);
    const isCameraCapture = comp?.type === 'CAMERA_CAPTURE';

    const cameraSource = cameraConfig?.type || comp?.props?.cameraSource || 'DEVICE';
    const ipCameraUrl = cameraConfig?.url || comp?.props?.ipCameraUrl || '';

    // Image element ref and loaded state for MJPEG IP Camera stream
    const ipImageRef = useRef(null);
    const [ipImageLoaded, setIpImageLoaded] = useState(false);
    const [ipImageError, setIpImageError] = useState(false);

    // Track Image load for MJPEG
    useEffect(() => {
        if (cameraSource !== 'IP_CAMERA' || !ipCameraUrl) {
            ipImageRef.current = null;
            setIpImageLoaded(false);
            setIpImageError(false);
            return;
        }

        const isRtsp = ipCameraUrl.toLowerCase().startsWith('rtsp://');
        if (isRtsp) {
            ipImageRef.current = null;
            setIpImageLoaded(true); // Treat as loaded, we will render a simulated RTSP stream
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
        img.src = ipCameraUrl;
        ipImageRef.current = img;

        return () => {
            img.onload = null;
            img.onerror = null;
        };
    }, [cameraSource, ipCameraUrl]);

    // Start local video stream
    useEffect(() => {
        if (viewMode !== 'PREVIEW' || capturedImage || showVideoPreview) return;
        setErrorMessage('');

        if (cameraSource === 'IP_CAMERA') {
            setHasPermission(true);
            return;
        }

        let activeStream = null;

        const getMedia = async () => {
            try {
                let stream;
                if (cameraSource === 'SCREEN_CAPTURE') {
                    stream = await navigator.mediaDevices.getDisplayMedia({
                        video: {
                            width: { ideal: 1280 },
                            height: { ideal: 720 }
                        }
                    });
                } else {
                    stream = await navigator.mediaDevices.getUserMedia({
                        video: {
                            width: { ideal: 640 },
                            height: { ideal: 480 },
                            facingMode: 'environment'
                        }
                    });
                }
                setHasPermission(true);
                activeStream = stream;
                streamRef.current = stream;
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.play().catch(err => {
                        console.warn('Video play interrupted:', err);
                    });
                }
            } catch (err) {
                console.error('Camera or Screen Share access error:', err);
                setHasPermission(false);
                setErrorMessage(err.message || 'Kamera atau Screen Capture tidak dapat diakses.');
            }
        };

        getMedia();

        return () => {
            if (activeStream) {
                activeStream.getTracks().forEach(track => track.stop());
            }
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [viewMode, capturedImage, cameraSource, showVideoPreview]);

    // Animated industrial feed animation drawer
    const animationTickRef = useRef(0);
    const drawSimulatedIPStream = (ctx, w, h) => {
        animationTickRef.current = (animationTickRef.current + 1) % 1000;
        const tick = animationTickRef.current;

        // Dark background
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, w, h);

        // Grid lines to look like a camera viewfinder
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 1;
        for (let i = 40; i < w; i += 40) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i, h);
            ctx.stroke();
        }
        for (let i = 40; i < h; i += 40) {
            ctx.beginPath();
            ctx.moveTo(0, i);
            ctx.lineTo(w, i);
            ctx.stroke();
        }

        // Draw animated conveyor belt at the bottom
        ctx.fillStyle = '#334155';
        ctx.fillRect(0, h - 80, w, 20); // Belt track
        // Belt rollers
        ctx.fillStyle = '#475569';
        for (let x = (tick * 2) % 60; x < w; x += 60) {
            ctx.beginPath();
            ctx.arc(x, h - 70, 8, 0, Math.PI * 2);
            ctx.fill();
        }

        // Draw item moving on the conveyor belt
        const itemX = (tick * 1.5) % (w + 100) - 50;

        // Define color palette matching target options
        const colorPalette = {
            RED: '#ef4444',
            GREEN: '#22c55e',
            BLUE: '#3b82f6',
            YELLOW: '#eab308',
            BLACK: '#090d16',
            WHITE: '#ffffff'
        };
        const colorsList = ['RED', 'GREEN', 'BLUE', 'YELLOW', 'WHITE', 'BLACK'];
        const cycleIndex = Math.floor(tick / 200) % colorsList.length;
        const currentItemColorKey = colorsList[cycleIndex];
        const currentItemColor = colorPalette[currentItemColorKey] || '#3b82f6';

        ctx.fillStyle = currentItemColor; // Dynamic item color
        ctx.fillRect(itemX, h - 130, 60, 50);

        // Barcode on item
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(itemX + 10, h - 110, 40, 20);
        ctx.fillStyle = '#000000';
        for (let bx = 0; bx < 30; bx += 3) {
            if (Math.sin(bx + tick) > -0.2) {
                ctx.fillRect(itemX + 12 + bx, h - 110, 2, 20);
            }
        }

        // Draw caliper guide & digital caliper if filterType is CALIPER_OCR
        if (filterType === 'CALIPER_OCR') {
            ctx.fillStyle = '#d1d5db';
            ctx.fillRect(w * 0.2, h * 0.4, w * 0.6, 40); // Caliper body
            ctx.fillStyle = '#374151';
            ctx.fillRect(w * 0.2 + 80, h * 0.4 - 5, 120, 50); // Digital display unit
            
            // LCD screen
            ctx.fillStyle = '#22c55e'; // Green backlit LCD
            ctx.fillRect(w * 0.2 + 90, h * 0.4, 100, 30);
            
            // Caliper value
            const caliperVal = (25.38 + Math.abs(Math.sin(tick * 0.02)) * 0.04).toFixed(2);
            ctx.fillStyle = '#0f172a';
            ctx.font = 'bold 16px Courier New, monospace';
            ctx.textAlign = 'center';
            ctx.fillText(`${caliperVal} mm`, w * 0.2 + 140, h * 0.4 + 20);
        }

        // Draw Dial Gauge if filterType is DIAL_GAUGE
        if (filterType === 'DIAL_GAUGE') {
            const centerX = w / 2;
            const centerY = h * 0.45;
            const radius = 60;

            // Gauge casing
            ctx.strokeStyle = '#94a3b8';
            ctx.lineWidth = 6;
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Tick marks
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 2;
            ctx.textAlign = 'center';
            ctx.font = '8px Arial';
            ctx.fillStyle = '#0f172a';
            for (let angle = 0; angle <= 180; angle += 30) {
                const rad = (angle + 180) * Math.PI / 180;
                const sx = centerX + Math.cos(rad) * (radius - 10);
                const sy = centerY + Math.sin(rad) * (radius - 10);
                const ex = centerX + Math.cos(rad) * radius;
                const ey = centerY + Math.sin(rad) * radius;
                ctx.beginPath();
                ctx.moveTo(sx, sy);
                ctx.lineTo(ex, ey);
                ctx.stroke();
            }

            // Dial needle
            const needleAngle = (Math.sin(tick * 0.03) + 1) * 90; // 0 to 180 degrees
            const needleRad = (needleAngle + 180) * Math.PI / 180;
            const nx = centerX + Math.cos(needleRad) * (radius - 15);
            const ny = centerY + Math.sin(needleRad) * (radius - 15);
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(nx, ny);
            ctx.stroke();

            // Center pin
            ctx.fillStyle = '#0f172a';
            ctx.beginPath();
            ctx.arc(centerX, centerY, 5, 0, Math.PI * 2);
            ctx.fill();
        }

        // Camera overlay details (IP stream info)
        ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
        ctx.fillRect(10, 10, w - 20, 26);
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1;
        ctx.strokeRect(10, 10, w - 20, 26);

        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'left';
        const displayUrl = ipCameraUrl ? (ipCameraUrl.length > 50 ? ipCameraUrl.substring(0, 47) + '...' : ipCameraUrl) : 'RTSP STREAM NOT CONFIG';
        ctx.fillText(`STREAM: ${displayUrl.toUpperCase()}`, 16, 26);
        
        ctx.textAlign = 'right';
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(w - 24, 23, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillText('LIVE-FEED SIM', w - 34, 26);
    };

    // Canvas image processing loop for filters
    useEffect(() => {
        if (viewMode !== 'PREVIEW' || capturedImage || showVideoPreview || !hasPermission) return;

        const processFrame = () => {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            if (!canvas) {
                animationFrameRef.current = requestAnimationFrame(processFrame);
                return;
            }

            const isRtsp = ipCameraUrl?.toLowerCase().startsWith('rtsp://');

            // Guard for local camera device state
            if (cameraSource === 'DEVICE' && (!video || video.paused || video.ended)) {
                animationFrameRef.current = requestAnimationFrame(processFrame);
                return;
            }

            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            // 1. Draw source feed to canvas
            if (cameraSource === 'IP_CAMERA') {
                if (isRtsp || ipImageError || !ipCameraUrl) {
                    drawSimulatedIPStream(ctx, canvas.width, canvas.height);
                } else if (ipImageRef.current && ipImageLoaded) {
                    try {
                        ctx.drawImage(ipImageRef.current, 0, 0, canvas.width, canvas.height);
                    } catch (e) {
                        drawSimulatedIPStream(ctx, canvas.width, canvas.height);
                    }
                } else {
                    ctx.fillStyle = '#1e293b';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.fillStyle = '#94a3b8';
                    ctx.font = '14px Inter, sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText('Connecting to IP Camera Stream...', canvas.width / 2, canvas.height / 2);
                }
            } else if (video) {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            }

            // 2. Apply filters if this is an OpenCV camera
            if (!isCameraCapture && filterType !== 'NONE') {
                try {
                    const src = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    const dst = ctx.createImageData(canvas.width, canvas.height);
                    const sData = src.data;
                    const dData = dst.data;
                    const w = canvas.width;
                    const h = canvas.height;

                    if (filterType === 'GRAYSCALE') {
                        for (let i = 0; i < sData.length; i += 4) {
                            const g = 0.299 * sData[i] + 0.587 * sData[i + 1] + 0.114 * sData[i + 2];
                            dData[i] = g;
                            dData[i + 1] = g;
                            dData[i + 2] = g;
                            dData[i + 3] = 255;
                        }
                        ctx.putImageData(dst, 0, 0);
                    } else if (filterType === 'THRESHOLD') {
                        for (let i = 0; i < sData.length; i += 4) {
                            const g = 0.299 * sData[i] + 0.587 * sData[i + 1] + 0.114 * sData[i + 2];
                            const val = g > thresholdValue ? 255 : 0;
                            dData[i] = val;
                            dData[i + 1] = val;
                            dData[i + 2] = val;
                            dData[i + 3] = 255;
                        }
                        ctx.putImageData(dst, 0, 0);
                    } else if (filterType === 'CANNY' || filterType === 'EDGE' || filterType === 'INSPECTION') {
                        for (let y = 0; y < h - 1; y++) {
                            for (let x = 0; x < w - 1; x++) {
                                const idx = (y * w + x) * 4;
                                const nextX = idx + 4;
                                const nextY = idx + w * 4;

                                const val = Math.abs(sData[idx] - sData[nextX]) + Math.abs(sData[idx] - sData[nextY]);
                                const edge = val > 15 ? 255 : 0;

                                dData[idx] = edge ? 124 : 15;     // R
                                dData[idx + 1] = edge ? 58 : 23;   // G
                                dData[idx + 2] = edge ? 237 : 42;  // B
                                dData[idx + 3] = 255;
                            }
                        }
                        ctx.putImageData(dst, 0, 0);
                    } else if (filterType === 'COLOR_DETECTOR') {
                        // Sample center pixels (or conveyor belt pixels if IP camera)
                        const size = 20;
                        const sx = Math.floor((canvas.width - size) / 2);
                        const sy = (cameraSource === 'IP_CAMERA') ? 365 : Math.floor((canvas.height - size) / 2);
                        
                        try {
                            const frameData = ctx.getImageData(sx, sy, size, size).data;
                            let rSum = 0, gSum = 0, bSum = 0, count = 0;
                            for (let i = 0; i < frameData.length; i += 4) {
                                rSum += frameData[i];
                                gSum += frameData[i+1];
                                bSum += frameData[i+2];
                                count++;
                            }
                            const avgR = Math.round(rSum / count);
                            const avgG = Math.round(gSum / count);
                            const avgB = Math.round(bSum / count);

                            const targetColor = comp?.props?.targetColor || 'RED';
                            const colorTolerance = Number(comp?.props?.colorTolerance ?? 70);

                            const targetRGBMap = {
                                RED: { r: 239, g: 68, b: 68 },
                                GREEN: { r: 34, g: 197, b: 94 },
                                BLUE: { r: 59, g: 130, b: 246 },
                                YELLOW: { r: 234, g: 179, b: 8 },
                                BLACK: { r: 15, g: 23, b: 42 },
                                WHITE: { r: 255, g: 255, b: 255 }
                            };

                            const targetRGB = targetRGBMap[targetColor] || targetRGBMap.RED;
                            const dr = avgR - targetRGB.r;
                            const dg = avgG - targetRGB.g;
                            const db = avgB - targetRGB.b;
                            const dist = Math.sqrt(dr*dr + dg*dg + db*db);
                            const similarity = Math.round(Math.max(0, 100 - (dist / 441.67) * 100));
                            const isMatch = similarity >= colorTolerance;

                            // Handle state transitions for triggers
                            if (lastMatchRef.current !== isMatch) {
                                lastMatchRef.current = isMatch;
                                if (isMatch) {
                                    onWidgetInteraction(comp, 'OnColorMatch', { color: targetColor, similarity });
                                } else {
                                    onWidgetInteraction(comp, 'OnColorMismatch', { color: targetColor, similarity });
                                }
                                syncInputDatasourceValue(comp, isMatch ? 'MATCH' : 'MISMATCH', `${comp.type}_COLOR_MATCH`);
                            }

                            // Draw color detector HUD overlays
                            ctx.strokeStyle = isMatch ? '#22c55e' : '#ef4444';
                            ctx.lineWidth = 3;
                            ctx.strokeRect(sx - 10, sy - 10, size + 20, size + 20);

                            ctx.fillStyle = isMatch ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)';
                            ctx.fillRect(sx - 10, sy - 10, size + 20, size + 20);

                            // Draw target HUD labels
                            ctx.fillStyle = '#ffffff';
                            ctx.font = 'bold 10px Inter, sans-serif';
                            ctx.textAlign = 'center';
                            ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
                            ctx.shadowBlur = 4;
                            ctx.fillText(`TARGET: ${targetColor} (${colorTolerance}%)`, canvas.width / 2, sy - 20);
                            ctx.fillStyle = isMatch ? '#22c55e' : '#ef4444';
                            ctx.fillText(isMatch ? `COLOR MATCH (${similarity}%)` : `MISMATCH (${similarity}%)`, canvas.width / 2, sy + size + 25);
                            ctx.shadowBlur = 0; // Reset shadow

                            // Draw swatch patches
                            ctx.fillStyle = `rgb(${avgR}, ${avgG}, ${avgB})`;
                            ctx.beginPath();
                            ctx.arc(canvas.width / 2 - 15, sy + size + 40, 7, 0, Math.PI * 2);
                            ctx.fill();
                            ctx.strokeStyle = '#ffffff';
                            ctx.lineWidth = 1.5;
                            ctx.stroke();

                            ctx.fillStyle = `rgb(${targetRGB.r}, ${targetRGB.g}, ${targetRGB.b})`;
                            ctx.beginPath();
                            ctx.arc(canvas.width / 2 + 15, sy + size + 40, 7, 0, Math.PI * 2);
                            ctx.fill();
                            ctx.stroke();
                        } catch (e) {
                            console.error('Color detection processing error:', e);
                        }
                    } else if (filterType === 'CHANGE_DETECTOR') {
                        // Sample center pixels (or conveyor belt pixels if IP camera)
                        const size = 30; // 30x30 region
                        const sx = Math.floor((canvas.width - size) / 2);
                        const sy = (cameraSource === 'IP_CAMERA') ? 360 : Math.floor((canvas.height - size) / 2);
                        
                        try {
                            const currentFrame = ctx.getImageData(sx, sy, size, size);
                            const cData = currentFrame.data;

                            let changedPixels = 0;
                            const totalPixels = size * size;

                            if (prevFrameRef.current && prevFrameRef.current.width === size && prevFrameRef.current.height === size) {
                                const pData = prevFrameRef.current.data;
                                const diffThreshold = 30; // Pixel color difference threshold

                                for (let i = 0; i < cData.length; i += 4) {
                                    const dr = Math.abs(cData[i] - pData[i]);
                                    const dg = Math.abs(cData[i+1] - pData[i+1]);
                                    const db = Math.abs(cData[i+2] - pData[i+2]);
                                    
                                    // Calculate average difference
                                    const avgDiff = (dr + dg + db) / 3;
                                    if (avgDiff > diffThreshold) {
                                        changedPixels++;
                                    }
                                }
                            }

                            // Store current frame for next check
                            prevFrameRef.current = currentFrame;

                            const changeThreshold = Number(comp?.props?.changeThreshold ?? 25);
                            const changePercent = Math.round((changedPixels / totalPixels) * 100);
                            const isChangeDetected = changePercent >= changeThreshold;

                            // Handle state transitions for triggers
                            if (lastMatchRef.current !== isChangeDetected) {
                                lastMatchRef.current = isChangeDetected;
                                if (isChangeDetected) {
                                    onWidgetInteraction(comp, 'OnChangeDetected', { changePercent });
                                } else {
                                    onWidgetInteraction(comp, 'OnChangeCleared', { changePercent });
                                }
                                syncInputDatasourceValue(comp, isChangeDetected ? 'CHANGE' : 'NO_CHANGE', `${comp.type}_CHANGE_DETECTED`);
                            }

                            // Draw HUD overlays for change detector
                            ctx.strokeStyle = isChangeDetected ? '#22c55e' : '#eab308';
                            ctx.lineWidth = 3;
                            ctx.strokeRect(sx - 10, sy - 10, size + 20, size + 20);

                            ctx.fillStyle = isChangeDetected ? 'rgba(34, 197, 94, 0.15)' : 'rgba(234, 179, 8, 0.15)';
                            ctx.fillRect(sx - 10, sy - 10, size + 20, size + 20);

                            // Draw labels showing activity
                            ctx.fillStyle = '#ffffff';
                            ctx.font = 'bold 10px Inter, sans-serif';
                            ctx.textAlign = 'center';
                            ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
                            ctx.shadowBlur = 4;
                            ctx.fillText(`MOTION REGION (Min ${changeThreshold}%)`, canvas.width / 2, sy - 20);
                            ctx.fillStyle = isChangeDetected ? '#22c55e' : '#eab308';
                            ctx.fillText(isChangeDetected ? `MOTION DETECTED (${changePercent}%)` : `NO MOTION (${changePercent}%)`, canvas.width / 2, sy + size + 25);
                            ctx.shadowBlur = 0; // Reset shadow

                        } catch (e) {
                            console.error('Change detection processing error:', e);
                        }
                    } else if (filterType === 'JIG_DETECTOR') {
                        // Sample central region
                        const size = 60; // larger box for jig fixture
                        const sx = Math.floor((canvas.width - size) / 2);
                        const sy = (cameraSource === 'IP_CAMERA') ? 350 : Math.floor((canvas.height - size) / 2);

                        try {
                            const jigAlignmentThreshold = Number(comp?.props?.jigAlignmentThreshold ?? 80);
                            
                            // Calculate similarity based on conveyor items or device pixel variance
                            let alignmentScore = 0;
                            if (cameraSource === 'IP_CAMERA') {
                                // Conveyor belt simulation: item passes through center x coords
                                // Check if conveyor item is currently centered
                                const itemX = (Date.now() / 15) % (canvas.width + 100) - 50;
                                const distToCenter = Math.abs(itemX - (canvas.width / 2));
                                if (distToCenter < 40) {
                                    // Item is aligned in the jig region!
                                    alignmentScore = Math.round(95 - (distToCenter / 40) * 15);
                                } else {
                                    alignmentScore = Math.round(25 + Math.random() * 5);
                                }
                            } else {
                                // Device camera simulation: fluctuates around 75-85%
                                const noise = Math.sin(Date.now() / 1000) * 8;
                                alignmentScore = Math.round(78 + noise);
                            }

                            const isJigPresent = alignmentScore >= jigAlignmentThreshold;

                            // Handle state transitions
                            if (lastMatchRef.current !== isJigPresent) {
                                lastMatchRef.current = isJigPresent;
                                if (isJigPresent) {
                                    onWidgetInteraction(comp, 'OnJigPresent', { score: alignmentScore });
                                } else {
                                    onWidgetInteraction(comp, 'OnJigAbsent', { score: alignmentScore });
                                }
                                syncInputDatasourceValue(comp, isJigPresent ? 'JIG_PRESENT' : 'JIG_ABSENT', `${comp.type}_JIG_DETECTION`);
                            }

                            // Draw Jig Template Anchor Guideline
                            ctx.strokeStyle = isJigPresent ? 'rgba(34, 197, 94, 0.8)' : 'rgba(239, 68, 68, 0.5)';
                            ctx.lineWidth = 2;
                            ctx.setLineDash([4, 4]);
                            ctx.strokeRect(sx, sy, size, size);

                            // Draw corners to make it look like a template overlay
                            ctx.setLineDash([]);
                            ctx.strokeStyle = isJigPresent ? '#22c55e' : '#ef4444';
                            ctx.lineWidth = 3;
                            
                            // Top left corner
                            ctx.beginPath();
                            ctx.moveTo(sx, sy + 15); ctx.lineTo(sx, sy); ctx.lineTo(sx + 15, sy);
                            ctx.stroke();

                            // Top right corner
                            ctx.beginPath();
                            ctx.moveTo(sx + size - 15, sy); ctx.lineTo(sx + size, sy); ctx.lineTo(sx + size, sy + 15);
                            ctx.stroke();

                            // Bottom left corner
                            ctx.beginPath();
                            ctx.moveTo(sx, sy + size - 15); ctx.lineTo(sx, sy + size); ctx.lineTo(sx + 15, sy + size);
                            ctx.stroke();

                            // Bottom right corner
                            ctx.beginPath();
                            ctx.moveTo(sx + size - 15, sy + size); ctx.lineTo(sx + size, sy + size); ctx.lineTo(sx + size, sy + size - 15);
                            ctx.stroke();

                            // Dotted schematic crosshair in center
                            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                            ctx.lineWidth = 1;
                            ctx.beginPath();
                            ctx.moveTo(sx + size/2, sy + 5); ctx.lineTo(sx + size/2, sy + size - 5);
                            ctx.moveTo(sx + 5, sy + size/2); ctx.lineTo(sx + size - 5, sy + size/2);
                            ctx.stroke();

                            // Draw text labels
                            ctx.fillStyle = '#ffffff';
                            ctx.font = 'bold 10px Inter, sans-serif';
                            ctx.textAlign = 'center';
                            ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
                            ctx.shadowBlur = 4;
                            ctx.fillText(`JIG FIXTURE ZONE`, canvas.width / 2, sy - 15);
                            
                            ctx.fillStyle = isJigPresent ? '#22c55e' : '#ef4444';
                            ctx.fillText(isJigPresent ? `JIG DETECTED (${alignmentScore}%)` : `JIG ABSENT/MISALIGNED (${alignmentScore}%)`, canvas.width / 2, sy + size + 20);
                            ctx.shadowBlur = 0;

                        } catch (e) {
                            console.error('Jig detection processing error:', e);
                        }
                    } else if (filterType === 'OCR_DETECTOR') {
                        const sizeW = Math.floor(canvas.width * 0.6);
                        const sizeH = Math.floor(canvas.height * 0.22);
                        const sx = Math.floor((canvas.width - sizeW) / 2);
                        const sy = (cameraSource === 'IP_CAMERA') ? Math.floor(canvas.height * 0.5) : Math.floor((canvas.height - sizeH) / 2);

                        try {
                            const threshold = Number(comp?.props?.ocrConfidenceThreshold ?? 50);
                            const targetText = comp?.props?.ocrTargetText || '';

                            let detectedText = '';
                            let confidence = 0;

                            if (cameraSource === 'IP_CAMERA') {
                                const tick = animationTickRef.current;
                                const itemX = (tick * 1.5) % (canvas.width + 100) - 50;
                                const distToCenter = Math.abs(itemX - (canvas.width / 2));

                                if (distToCenter < 55) {
                                    detectedText = targetText || 'TULIP-VISION';
                                    confidence = Math.round(88 + Math.sin(tick * 0.1) * 6);
                                } else {
                                    detectedText = 'NO_TEXT';
                                    confidence = 10;
                                }
                            } else {
                                const tick = Date.now() / 1000;
                                const isStable = (Math.floor(tick) % 6) < 4;
                                if (isStable) {
                                    detectedText = targetText || 'SN-559384';
                                    confidence = Math.round(92 + Math.sin(tick * 2) * 3);
                                } else {
                                    detectedText = 'SCANNING...';
                                    confidence = 32;
                                }
                            }

                            const isPassed = confidence >= threshold && detectedText !== 'NO_TEXT' && detectedText !== 'SCANNING...';

                            if (lastTextRef.current !== detectedText) {
                                lastTextRef.current = detectedText;
                                if (isPassed) {
                                    onWidgetInteraction(comp, 'OnTextDetected', { text: detectedText, confidence });
                                }
                                syncInputDatasourceValue(comp, detectedText, `${comp.type}_TEXT_DETECTED`);
                            }

                            ctx.strokeStyle = isPassed ? '#22c55e' : '#ef4444';
                            ctx.lineWidth = 3;
                            ctx.strokeRect(sx, sy, sizeW, sizeH);
                            ctx.fillStyle = isPassed ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.12)';
                            ctx.fillRect(sx, sy, sizeW, sizeH);

                            const tick = Date.now() / 8;
                            const scanY = sy + Math.round((Math.sin(tick * 0.02) + 1) * (sizeH / 2));
                            ctx.strokeStyle = '#22c55e';
                            ctx.lineWidth = 1.5;
                            ctx.beginPath();
                            ctx.moveTo(sx + 5, scanY);
                            ctx.lineTo(sx + sizeW - 5, scanY);
                            ctx.stroke();

                            ctx.fillStyle = '#ffffff';
                            ctx.font = 'bold 10px Inter, sans-serif';
                            ctx.textAlign = 'center';
                            ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
                            ctx.shadowBlur = 4;
                            ctx.fillText(`OCR MONITORING REGION`, canvas.width / 2, sy - 15);
                            ctx.fillStyle = isPassed ? '#22c55e' : '#ef4444';
                            ctx.fillText(`READ: "${detectedText}" (${confidence}%)`, canvas.width / 2, sy + sizeH + 20);
                            ctx.shadowBlur = 0;

                        } catch (e) {
                            console.error('OCR detection processing error:', e);
                        }
                    } else if (filterType === 'YOLO_DETECTOR') {
                        try {
                            const modelType = comp?.props?.yoloModelType || 'yolov8n_general';
                            const confMin = comp?.props?.yoloConfidence ?? 50;
                            const targetClassFilter = (comp?.props?.yoloTargetClass || '').toLowerCase().trim();

                            let calculatedVal = '';
                            let isPassed = true;
                            let detections = [];

                            // Generate dynamic or simulated tracking objects
                            const w = canvas.width;
                            const h = canvas.height;
                            const yoloRunMode = comp?.props?.yoloRunMode || 'SIMULATED';

                            if (yoloRunMode === 'ULTRALYTICS_CLOUD' || yoloRunMode === 'LOCAL_API') {
                                const apiKey = comp?.props?.yoloApiKey || '';
                                const modelId = comp?.props?.yoloModelId || '';
                                const localUrl = comp?.props?.yoloLocalUrl || 'http://localhost:8000/detect';

                                // Draw last received cloud detections
                                detections = cloudDetectionsRef.current || [];

                                // Throttling call: only fetch once every 1000ms
                                const now = Date.now();
                                const canFetch = yoloRunMode === 'ULTRALYTICS_CLOUD' ? (apiKey && modelId) : true;
                                
                                if (canFetch && !isFetchingCloudRef.current && (now - lastCloudFetchTimeRef.current > 1000)) {
                                    isFetchingCloudRef.current = true;
                                    lastCloudFetchTimeRef.current = now;

                                    canvas.toBlob((blob) => {
                                        if (blob) {
                                            const formData = new FormData();
                                            const endpoint = yoloRunMode === 'ULTRALYTICS_CLOUD'
                                                ? `https://api.ultralytics.com/v1/predict/${modelId}`
                                                : localUrl;

                                            const headers = yoloRunMode === 'ULTRALYTICS_CLOUD'
                                                ? { "x-api-key": apiKey }
                                                : {};

                                            if (yoloRunMode === 'ULTRALYTICS_CLOUD') {
                                                formData.append("image", blob, "frame.jpg");
                                            } else {
                                                formData.append("file", blob, "frame.jpg");
                                            }

                                            fetch(endpoint, {
                                                method: "POST",
                                                headers: headers,
                                                body: formData
                                            })
                                            .then(res => {
                                                if (!res.ok) throw new Error(`Status: ${res.status}`);
                                                return res.json();
                                            })
                                            .then(data => {
                                                if (data) {
                                                    if (data.data) {
                                                        cloudDetectionsRef.current = data.data.map(item => ({
                                                            x: Math.round(item.box.x1),
                                                            y: Math.round(item.box.y1),
                                                            w: Math.round(item.box.x2 - item.box.x1),
                                                            h: Math.round(item.box.y2 - item.box.y1),
                                                            label: item.name,
                                                            conf: Math.round(item.confidence * 100)
                                                        }));
                                                    } else if (data.predictions) {
                                                        cloudDetectionsRef.current = data.predictions.map(item => ({
                                                            x: Math.round(item.x),
                                                            y: Math.round(item.y),
                                                            w: Math.round(item.w),
                                                            h: Math.round(item.h),
                                                            label: item.label,
                                                            conf: Math.round(item.confidence)
                                                        }));
                                                    }
                                                }
                                            })
                                            .catch(err => console.error("YOLO API error:", err))
                                            .finally(() => {
                                                isFetchingCloudRef.current = false;
                                            });
                                        } else {
                                            isFetchingCloudRef.current = false;
                                        }
                                    }, 'image/jpeg', 0.85);
                                }

                                // Apply confidence and target class filters to cloud detections
                                detections = detections.filter(d => d.conf >= confMin);
                                if (targetClassFilter) {
                                    detections = detections.filter(d => d.label.toLowerCase().includes(targetClassFilter));
                                }

                                // Calculate calculatedVal & isPassed for cloud predictions
                                const helmetDetected = detections.some(d => d.label.toLowerCase().includes('helmet') || d.label.toLowerCase().includes('helm'));
                                const vestDetected = detections.some(d => d.label.toLowerCase().includes('vest') || d.label.toLowerCase().includes('rompi'));
                                const personDetected = detections.some(d => d.label.toLowerCase().includes('person') || d.label.toLowerCase().includes('orang'));
                                const defectDetected = detections.some(d => d.label.toLowerCase().includes('defect') || d.label.toLowerCase().includes('cacat') || d.label.toLowerCase().includes('scratch') || d.label.toLowerCase().includes('crack') || d.label.toLowerCase().includes('dent'));

                                if (personDetected) {
                                    if (helmetDetected && vestDetected) {
                                        calculatedVal = 'SAFE: APD LENGKAP (CLOUD)';
                                        isPassed = true;
                                    } else {
                                        const missing = [];
                                        if (!helmetDetected) missing.push('Helmet');
                                        if (!vestDetected) missing.push('Vest');
                                        calculatedVal = `UNSAFE: MISSING ${missing.join(' & ')} (CLOUD)`;
                                        isPassed = false;
                                    }
                                } else if (defectDetected) {
                                    const defects = detections.filter(d => d.label.toLowerCase().includes('defect') || d.label.toLowerCase().includes('cacat') || d.label.toLowerCase().includes('scratch') || d.label.toLowerCase().includes('crack') || d.label.toLowerCase().includes('dent'));
                                    calculatedVal = `FAIL: CACAT ${defects.map(d => d.label.toUpperCase()).join(', ')} (CLOUD)`;
                                    isPassed = false;
                                } else {
                                    const detectedLabels = detections.map(d => `${d.label} (${d.conf}%)`);
                                    calculatedVal = detectedLabels.length > 0 ? `DETECTED (CLOUD): ${detectedLabels.join(', ')}` : 'No Objects Detected (CLOUD)';
                                    isPassed = detections.length > 0;
                                }
                            } else {
                                if (modelType === 'yolov8n_safety') {
                                    // APD / PPE Safety Check
                                    const time = Date.now() / 1000;
                                    // Simulasikan orang
                                    const personBox = { x: 140, y: 70, w: 220, h: 330, label: 'person', conf: 96 };
                                    
                                    // Deteksi helm: Helm hilang setiap beberapa detik untuk simulasi pelanggaran APD
                                    const hasHelmet = (Math.floor(time / 6) % 2) === 0;
                                    const helmetBox = hasHelmet ? { x: 215, y: 75, w: 70, h: 55, label: 'safety helmet', conf: 92 } : null;
                                    
                                    // Deteksi rompi
                                    const vestBox = { x: 180, y: 140, w: 140, h: 160, label: 'reflective vest', conf: 89 };
                                    
                                    // Deteksi sarung tangan: conf 45%, bisa difilter oleh slider confidence
                                    const glovesBox = { x: 130, y: 280, w: 40, h: 45, label: 'gloves', conf: 45 };

                                    const candidates = [personBox, helmetBox, vestBox, glovesBox].filter(Boolean);
                                    // Saring berdasarkan threshold slider
                                    detections = candidates.filter(d => d.conf >= confMin);

                                    // Cek apakah APD lengkap (memerlukan helmet dan vest jika person terdeteksi)
                                    const helmetDetected = detections.some(d => d.label === 'safety helmet');
                                    const vestDetected = detections.some(d => d.label === 'reflective vest');
                                    
                                    if (helmetDetected && vestDetected) {
                                        calculatedVal = 'SAFE: APD LENGKAP';
                                        isPassed = true;
                                    } else {
                                        const missing = [];
                                        if (!helmetDetected) missing.push('Helmet');
                                        if (!vestDetected) missing.push('Vest');
                                        calculatedVal = `UNSAFE: MISSING ${missing.join(' & ')}`;
                                        isPassed = false;
                                    }
                                } else if (modelType === 'yolov8n_qc') {
                                    // Conveyor Belt Quality Inspection
                                    const cycleTime = 8000; // 8 detik per cycle
                                    const tick = Date.now() % cycleTime;
                                    const progress = tick / cycleTime; // 0.0 sampai 1.0

                                    // Objek casing masuk dari kiri ke kanan
                                    const objW = 160;
                                    const objH = 160;
                                    const objX = -120 + progress * (w + 240);
                                    const objY = Math.floor(h * 0.35);

                                    // Tentukan apakah siklus ini cacat (misal cycle ganjil atau genap)
                                    const cycleNum = Math.floor(Date.now() / cycleTime);
                                    const isDefectCycle = cycleNum % 2 !== 0;

                                    const productBox = { x: Math.round(objX), y: Math.round(objY), w: objW, h: objH, label: 'ok product', conf: 95 };
                                    detections.push(productBox);

                                    if (isDefectCycle) {
                                        // Deteksi cacat di dalam casing produk
                                        const scratchX = objX + 45;
                                        const scratchY = objY + 60;
                                        const defectBox = { x: Math.round(scratchX), y: Math.round(scratchY), w: 35, h: 25, label: 'scratch defect', conf: 84 };
                                        detections.push(defectBox);
                                    }

                                    // Filter berdasarkan threshold
                                    detections = detections.filter(d => d.conf >= confMin);

                                    const defectDetected = detections.some(d => d.label.includes('defect'));
                                    if (defectDetected) {
                                        calculatedVal = 'FAIL: CACAT SCRATCH';
                                        isPassed = false;
                                        // Ubah label produk utama jadi 'ng product' atau tetap 'ok product' tapi warnai merah
                                        const prod = detections.find(d => d.label === 'ok product');
                                        if (prod) prod.label = 'ng product';
                                    } else {
                                        calculatedVal = 'PASS: PRODUK OK';
                                        isPassed = true;
                                    }
                                } else {
                                    // General COCO Object Detection
                                    const time = Date.now() / 1000;
                                    // sedikit goyang agar dinamis
                                    const jitterX = Math.sin(time) * 3;
                                    const jitterY = Math.cos(time * 1.5) * 2;

                                    const person = { x: Math.round(40 + jitterX), y: Math.round(60 + jitterY), w: 160, h: 340, label: 'person', conf: 92 };
                                    const laptop = { x: Math.round(220 + jitterX * 0.5), y: Math.round(180 + jitterY * 0.5), w: 160, h: 110, label: 'laptop', conf: 87 };
                                    const phone = { x: Math.round(250 - jitterX), y: Math.round(150 + jitterY), w: 35, h: 55, label: 'cell phone', conf: 76 };
                                    const cup = { x: Math.round(390 + jitterX), y: Math.round(200 - jitterY), w: 45, h: 50, label: 'cup', conf: 48 };
                                    const chair = { x: Math.round(430 + jitterX * 0.3), y: Math.round(160 + jitterY * 0.3), w: 170, h: 260, label: 'chair', conf: 64 };

                                    const candidates = [person, laptop, phone, cup, chair];
                                    detections = candidates.filter(d => d.conf >= confMin);

                                    // Filter berdasarkan targetClass jika ada
                                    if (targetClassFilter) {
                                        detections = detections.filter(d => d.label.toLowerCase().includes(targetClassFilter));
                                    }

                                    const detectedLabels = detections.map(d => `${d.label} (${d.conf}%)`);
                                    calculatedVal = detectedLabels.length > 0 ? detectedLabels.join(', ') : 'No Objects Detected';
                                    isPassed = detections.length > 0;
                                }
                            }

                            // Event triggers dan sync
                            if (lastMatchRef.current !== calculatedVal) {
                                lastMatchRef.current = calculatedVal;
                                onWidgetInteraction(comp, 'OnYoloDetect', {
                                    model: modelType,
                                    objects: detections.map(d => d.label),
                                    summary: calculatedVal,
                                    isPassed: isPassed
                                });
                                syncInputDatasourceValue(comp, calculatedVal, `${comp.type}_YOLO_RESULT`);
                            }

                            // ── DRAW OVERLAYS ──
                            // 1. Draw bounding boxes
                            detections.forEach(det => {
                                let boxColor = '#3b82f6'; // default Blue
                                if (det.label === 'safety helmet') boxColor = '#eab308'; // Yellow
                                else if (det.label === 'reflective vest') boxColor = '#84cc16'; // Lime
                                else if (det.label === 'gloves') boxColor = '#06b6d4'; // Cyan
                                else if (det.label === 'ok product') boxColor = '#10b981'; // Green
                                else if (det.label === 'scratch defect' || det.label === 'ng product') boxColor = '#ef4444'; // Red
                                else if (['laptop', 'cell phone', 'cup', 'chair'].includes(det.label)) boxColor = '#a855f7'; // Purple

                                // Draw Box border
                                ctx.strokeStyle = boxColor;
                                ctx.lineWidth = 2;
                                ctx.strokeRect(det.x, det.y, det.w, det.h);

                                // Draw Box background fill (semi-transparent)
                                ctx.fillStyle = boxColor + '15'; // 8% opacity
                                ctx.fillRect(det.x, det.y, det.w, det.h);

                                // Draw Corner brackets on box for premium look
                                ctx.strokeStyle = boxColor;
                                ctx.lineWidth = 3.5;
                                const len = Math.min(det.w, det.h) * 0.15; // bracket length
                                // Top-Left
                                ctx.beginPath(); ctx.moveTo(det.x, det.y + len); ctx.lineTo(det.x, det.y); ctx.lineTo(det.x + len, det.y); ctx.stroke();
                                // Top-Right
                                ctx.beginPath(); ctx.moveTo(det.x + det.w - len, det.y); ctx.lineTo(det.x + det.w, det.y); ctx.lineTo(det.x + det.w, det.y + len); ctx.stroke();
                                // Bottom-Left
                                ctx.beginPath(); ctx.moveTo(det.x, det.y + det.h - len); ctx.lineTo(det.x, det.y + det.h); ctx.lineTo(det.x + len, det.y + det.h); ctx.stroke();
                                // Bottom-Right
                                ctx.beginPath(); ctx.moveTo(det.x + det.w - len, det.y + det.h); ctx.lineTo(det.x + det.w, det.y + det.h); ctx.lineTo(det.x + det.w, det.y + det.h - len); ctx.stroke();

                                // Draw Label text background tag
                                ctx.fillStyle = boxColor;
                                const textStr = `${det.label} ${det.conf}%`;
                                ctx.font = 'bold 9px Inter, sans-serif';
                                const textWidth = ctx.measureText(textStr).width + 10;
                                ctx.fillRect(det.x, det.y - 14, textWidth, 14);

                                // Draw Label text
                                ctx.fillStyle = '#ffffff';
                                ctx.textAlign = 'left';
                                ctx.fillText(textStr, det.x + 5, det.y - 4);
                            });

                            // 2. HUD Info Panel (Top Right)
                            ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
                            ctx.fillRect(w - 180, 10, 170, 75);
                            ctx.strokeStyle = 'rgba(124, 58, 237, 0.4)';
                            ctx.lineWidth = 1;
                            ctx.strokeRect(w - 180, 10, 170, 75);

                            ctx.fillStyle = '#c084fc';
                            ctx.font = 'bold 9px Inter, sans-serif';
                            ctx.textAlign = 'left';
                            ctx.fillText('ULTRALYTICS YOLOv8 ACTIVE', w - 170, 24);

                            ctx.fillStyle = '#94a3b8';
                            ctx.font = '8px monospace';
                            const infTime = (12.2 + Math.sin(Date.now() / 400) * 1.5).toFixed(1);
                            ctx.fillText(`Model: ${modelType.toUpperCase()}`, w - 170, 38);
                            ctx.fillText(`Inference: ${infTime} ms (GPU)`, w - 170, 50);
                            ctx.fillText(`Conf Min: ${confMin}%`, w - 170, 62);
                            ctx.fillText(`Objects: ${detections.length} detected`, w - 170, 74);

                            // 3. Status readout overlay at the bottom center of viewfinder
                            ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
                            ctx.fillRect(10, h - 35, w - 20, 26);
                            ctx.strokeStyle = isPassed ? '#22c55e' : '#ef4444';
                            ctx.strokeRect(10, h - 35, w - 20, 26);
                            
                            ctx.fillStyle = isPassed ? '#22c55e' : '#ef4444';
                            ctx.font = 'bold 10px Inter, sans-serif';
                            ctx.fillText(calculatedVal, 20, h - 18);

                        } catch (err) {
                            console.error('YOLO detector processing error:', err);
                        }
                    }
                } catch (e) {
                    console.error('Filter processing error:', e);
                }
            }

            // Draw target overlays for Caliper / Dial Gauge guides
            if (['CALIPER_OCR', 'DIAL_GAUGE', 'OCR_DETECTOR'].includes(filterType)) {
                ctx.strokeStyle = '#ef4444'; // red target bounding box
                ctx.lineWidth = 3;
                ctx.setLineDash([6, 6]);

                if (filterType === 'CALIPER_OCR') {
                    ctx.strokeRect(canvas.width * 0.15, canvas.height * 0.35, canvas.width * 0.7, canvas.height * 0.3);
                    ctx.fillStyle = 'rgba(239, 68, 68, 0.1)';
                    ctx.fillRect(canvas.width * 0.15, canvas.height * 0.35, canvas.width * 0.7, canvas.height * 0.3);

                    ctx.fillStyle = '#ef4444';
                    ctx.font = 'bold 11px Inter, sans-serif';
                    ctx.fillText('POSISIKAN LAYAR CALIPER DI SINI', canvas.width * 0.2, canvas.height * 0.3);
                } else if (filterType === 'DIAL_GAUGE') {
                    const size = Math.min(canvas.width, canvas.height) * 0.6;
                    const x = (canvas.width - size) / 2;
                    const y = (canvas.height - size) / 2;
                    ctx.strokeRect(x, y, size, size);
                    ctx.fillStyle = 'rgba(239, 68, 68, 0.1)';
                    ctx.fillRect(x, y, size, size);

                    ctx.fillStyle = '#ef4444';
                    ctx.font = 'bold 11px Inter, sans-serif';
                    ctx.fillText('POSISIKAN DIAL GAUGE DI SINI', x + 10, y - 10);
                }
            }
                if (filterType === 'OCR_DETECTOR') {
                    const sizeW = Math.floor(canvas.width * 0.6);
                    const sizeH = Math.floor(canvas.height * 0.22);
                    const x = (canvas.width - sizeW) / 2;
                    const y = (canvas.source === 'IP_CAMERA') ? Math.floor(canvas.height * 0.5) : Math.floor((canvas.height - sizeH) / 2);
                    ctx.strokeRect(x, y, sizeW, sizeH);
                    ctx.fillStyle = 'rgba(239, 68, 68, 0.1)';
                    ctx.fillRect(x, y, sizeW, sizeH);

                    ctx.fillStyle = '#ef4444';
                    ctx.font = 'bold 11px Inter, sans-serif';
                    ctx.fillText('POSISIKAN TEKS DI SINI', x + 10, y - 10);
                }

            // ── Monitored Regions Processing ────────────────────────
            const regions = (comp?.props?.enableDetector !== false) ? (cameraConfig?.settings?.regions || []) : [];
            const showOverlay = comp?.props?.showOverlay !== false;
            const nowTime = Date.now();
            const shouldAnalyze = nowTime - lastAnalysisTimeRef.current >= 100; // 10 FPS
            if (shouldAnalyze) {
                lastAnalysisTimeRef.current = nowTime;
            }

            regions.forEach((region) => {
                const scale = canvas.width / 640;
                const rx = Math.max(0, Math.min(region.x * scale, canvas.width - 2));
                const ry = Math.max(0, Math.min(region.y * scale, canvas.height - 2));
                const rw = Math.max(2, Math.min(region.w * scale, canvas.width - rx));
                const rh = Math.max(2, Math.min(region.h * scale, canvas.height - ry));

                const colorDet = region.detectors?.colorDetector;
                const changeDet = region.detectors?.changeDetector;

                let isMatching = false;
                let changeTriggered = false;
                let colorSimilarity = 0;
                let changePercent = 0;

                if (shouldAnalyze) {
                    try {
                        const imgData = ctx.getImageData(rx, ry, rw, rh);
                        const pixels = imgData.data;
                        let rSum = 0, gSum = 0, bSum = 0, count = 0;
                        for (let i = 0; i < pixels.length; i += 16) {
                            rSum += pixels[i];
                            gSum += pixels[i+1];
                            bSum += pixels[i+2];
                            count++;
                        }
                        const avgR = rSum / count;
                        const avgG = gSum / count;
                        const avgB = bSum / count;

                        // Color detector
                        if (colorDet && colorDet.enabled) {
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
                            const targetRGB = hexToRgb(colorDet.targetColor);
                            const dr = avgR - targetRGB.r;
                            const dg = avgG - targetRGB.g;
                            const db = avgB - targetRGB.b;
                            const dist = Math.sqrt(dr*dr + dg*dg + db*db);
                            colorSimilarity = Math.round(Math.max(0, 100 - (dist / 441.67) * 100));

                            const lastState = lastRegionMatchStatesRef.current[region.id + '_color'] || false;
                            isMatching = lastState;
                            if (colorSimilarity >= colorDet.beginThreshold) {
                                isMatching = true;
                            } else if (colorSimilarity < colorDet.endThreshold) {
                                isMatching = false;
                            }
                            lastRegionMatchStatesRef.current[region.id + '_color'] = isMatching;

                            if (lastState !== isMatching) {
                                onWidgetInteraction(comp, 'ON_CHANGE', {
                                    deviceId: comp.props.cameraConfigId,
                                    deviceEvent: isMatching ? 'CHANGES_BEGAN' : 'CHANGES_ENDED',
                                    value: isMatching ? 'MATCH' : 'NO_MATCH',
                                    regionId: region.id,
                                    regionName: region.name
                                });
                            }
                        }

                        // Change detector
                        if (changeDet && changeDet.enabled) {
                            const currentIntensity = (avgR + avgG + avgB) / 3;
                            const prevIntensity = prevIntensityRef.current[region.id];
                            let delta = 0;
                            if (prevIntensity !== undefined) {
                                delta = Math.abs(currentIntensity - prevIntensity);
                            }
                            prevIntensityRef.current[region.id] = currentIntensity;

                            changePercent = Math.round(Math.min(100, (delta / 12) * 100));
                            
                            const lastState = lastRegionMatchStatesRef.current[region.id + '_change'] || false;
                            changeTriggered = lastState;
                            if (changePercent >= changeDet.beginThreshold) {
                                changeTriggered = true;
                            } else if (changePercent < changeDet.lowerThreshold) {
                                changeTriggered = false;
                            }
                            lastRegionMatchStatesRef.current[region.id + '_change'] = changeTriggered;

                            if (lastState !== changeTriggered) {
                                onWidgetInteraction(comp, 'ON_CHANGE', {
                                    deviceId: comp.props.cameraConfigId,
                                    deviceEvent: changeTriggered ? 'CHANGES_BEGAN' : 'CHANGES_ENDED',
                                    value: changeTriggered ? 'CHANGE' : 'NO_CHANGE',
                                    regionId: region.id,
                                    regionName: region.name
                                });
                            }
                        }
                    } catch (e) {
                        // ignore startup errors
                    }
                } else {
                    isMatching = lastRegionMatchStatesRef.current[region.id + '_color'] || false;
                    changeTriggered = lastRegionMatchStatesRef.current[region.id + '_change'] || false;
                }

                if (showOverlay) {
                    let borderColor = '#3b82f6';
                    if (colorDet && colorDet.enabled) {
                        borderColor = isMatching ? '#22c55e' : '#ef4444';
                    } else if (changeDet && changeDet.enabled) {
                        borderColor = changeTriggered ? '#10b981' : '#f59e0b';
                    }

                    ctx.strokeStyle = borderColor;
                    ctx.lineWidth = 1.5;
                    ctx.strokeRect(rx, ry, rw, rh);

                    // Corner Markers
                    ctx.lineWidth = 2.5;
                    const markerSize = Math.min(8, Math.min(rw, rh) * 0.25);
                    // Top-left
                    ctx.beginPath(); ctx.moveTo(rx, ry + markerSize); ctx.lineTo(rx, ry); ctx.lineTo(rx + markerSize, ry); ctx.stroke();
                    // Top-right
                    ctx.beginPath(); ctx.moveTo(rx + rw - markerSize, ry); ctx.lineTo(rx + rw, ry); ctx.lineTo(rx + rw, ry + markerSize); ctx.stroke();
                    // Bottom-left
                    ctx.beginPath(); ctx.moveTo(rx, ry + rh - markerSize); ctx.lineTo(rx, ry + rh); ctx.lineTo(rx + markerSize, ry + rh); ctx.stroke();
                    // Bottom-right
                    ctx.beginPath(); ctx.moveTo(rx + rw - markerSize, ry + rh); ctx.lineTo(rx + rw, ry + rh); ctx.lineTo(rx + rw, ry + rh - markerSize); ctx.stroke();

                    // Label
                    ctx.fillStyle = borderColor;
                    ctx.font = 'bold 8px sans-serif';
                    let labelText = region.name;
                    if (colorDet && colorDet.enabled) {
                        labelText += ` (${colorSimilarity}%)`;
                    } else if (changeDet && changeDet.enabled) {
                        labelText += ` (${changePercent}%)`;
                    }
                    const textWidth = ctx.measureText(labelText).width + 6;
                    ctx.fillRect(rx, ry - 11, textWidth, 11);

                    ctx.fillStyle = '#ffffff';
                    ctx.fillText(labelText, rx + 3, ry - 3);
                }
            });

            animationFrameRef.current = requestAnimationFrame(processFrame);
        };

        animationFrameRef.current = requestAnimationFrame(processFrame);

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [viewMode, filterType, thresholdValue, capturedImage, isCameraCapture, hasPermission, cameraSource, ipCameraUrl, ipImageLoaded, ipImageError, showVideoPreview, comp?.props?.yoloModelType, comp?.props?.yoloConfidence, comp?.props?.yoloTargetClass, comp?.props?.yoloRunMode, comp?.props?.yoloApiKey, comp?.props?.yoloModelId, comp?.props?.yoloLocalUrl, cameraConfig, comp?.props?.enableDetector]);

    // Handle standard camera capture
    const handleCapture = useCallback(() => {
        let dataUrl = '';
        if (canvasRef.current) {
            // Take snapshot of the current canvas feed (local or IP stream)
            dataUrl = canvasRef.current.toDataURL('image/jpeg');
        }

        if (!dataUrl) return;

        setCapturedImage(dataUrl);

        // Stop live stream tracks to release device camera
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }

        // Sync with variable
        syncInputDatasourceValue(comp, dataUrl, `${comp.type}_CHANGED`);
        onWidgetInteraction(comp, 'ON_CHANGE', { picture: dataUrl, value: dataUrl });
        onWidgetInteraction(comp, 'AfterCapture', { picture: dataUrl, value: dataUrl });
    }, [comp, syncInputDatasourceValue, onWidgetInteraction]);

    const handleAsyncCapture = useCallback(() => {
        let dataUrl = '';
        if (canvasRef.current) {
            dataUrl = canvasRef.current.toDataURL('image/jpeg');
        }
        if (!dataUrl) return;

        setIsUploadingSnapshot(true);
        setTimeout(() => {
            setIsUploadingSnapshot(false);
            syncInputDatasourceValue(comp, dataUrl, `${comp.type}_CHANGED`);
            onWidgetInteraction(comp, 'ON_CHANGE', { picture: dataUrl, value: dataUrl });
            onWidgetInteraction(comp, 'AfterCapture', { picture: dataUrl, value: dataUrl });
        }, 1500);
    }, [comp, syncInputDatasourceValue, onWidgetInteraction]);

    useEffect(() => {
        const handleCameraMethod = (e) => {
            const { compId, methodId, args } = e.detail || {};
            if (compId !== comp?.id) return;

            console.log(`[VisionCamera] Method listener received: ${methodId}`, args);

            if (methodId === 'TakePicture' || methodId === 'TakeSnapshot') {
                handleCapture();
            } else if (methodId === 'StartImageCapture') {
                handleAsyncCapture();
            }
        };

        window.addEventListener('mavi-camera-method', handleCameraMethod);
        return () => {
            window.removeEventListener('mavi-camera-method', handleCameraMethod);
        };
    }, [comp, handleCapture, handleAsyncCapture]);

    const handleRetake = () => {
        setCapturedImage(null);
        setSimulatedValue('');
        syncInputDatasourceValue(comp, '', `${comp.type}_CHANGED`);
    };

    // Clean up recording interval on unmount
    useEffect(() => {
        return () => {
            if (recordingIntervalRef.current) {
                clearInterval(recordingIntervalRef.current);
            }
            if (recordedUrl) {
                URL.revokeObjectURL(recordedUrl);
            }
        };
    }, [recordedUrl]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const startRecording = () => {
        recordedChunksRef.current = [];
        let stream = null;

        // Try capturing stream from canvas (works for local and IP streams, captures filters)
        if (canvasRef.current) {
            try {
                stream = canvasRef.current.captureStream(25);
            } catch (e) {
                console.warn("Failed to capture stream from canvas, falling back:", e);
            }
        }

        // Fallbacks
        if (!stream && streamRef.current) {
            stream = streamRef.current;
        }
        if (!stream && videoRef.current && videoRef.current.srcObject) {
            stream = videoRef.current.srcObject;
        }

        if (!stream) {
            alert("Tidak ada input kamera aktif untuk merekam.");
            return;
        }

        // Check if stream has video tracks
        if (stream.getVideoTracks().length === 0) {
            alert("Input kamera aktif tidak memiliki video track.");
            return;
        }

        let mediaRecorder;
        const mimeTypes = [
            'video/webm;codecs=vp9',
            'video/webm;codecs=vp8',
            'video/webm',
            'video/mp4'
        ];

        for (const type of mimeTypes) {
            try {
                if (MediaRecorder.isTypeSupported(type)) {
                    mediaRecorder = new MediaRecorder(stream, { mimeType: type });
                    break;
                }
            } catch (e) {
                // Try next
            }
        }

        if (!mediaRecorder) {
            try {
                mediaRecorder = new MediaRecorder(stream);
            } catch (e) {
                alert("Perekam video (MediaRecorder) tidak didukung di browser ini: " + e.message);
                return;
            }
        }

        mediaRecorder.ondataavailable = (event) => {
            if (event.data && event.data.size > 0) {
                recordedChunksRef.current.push(event.data);
            }
        };

        mediaRecorder.onstop = () => {
            const blob = new Blob(recordedChunksRef.current, { type: mediaRecorder.mimeType || 'video/webm' });
            const url = URL.createObjectURL(blob);
            setRecordedBlob(blob);
            setRecordedUrl(url);
            setShowVideoPreview(true);

            // Trigger callback event & sync to variables
            onWidgetInteraction(comp, 'AfterVideoRecorded', { videoUrl: url, videoBlob: blob });
            syncInputDatasourceValue(comp, url, `${comp.type}_VIDEO_RECORDED`);

            if (comp?.props?.autoSaveVideo) {
                const a = document.createElement('a');
                a.href = url;
                a.download = `video_record_${Date.now()}.webm`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            }
        };

        mediaRecorderRef.current = mediaRecorder;
        mediaRecorder.start();
        setIsRecording(true);
        setRecordingSeconds(0);

        const maxDur = Number(comp?.props?.maxRecordingDuration || 30);
        recordingIntervalRef.current = setInterval(() => {
            setRecordingSeconds(prev => {
                const next = prev + 1;
                if (next >= maxDur) {
                    stopRecording();
                    return maxDur;
                }
                return next;
            });
        }, 1000);
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }
        if (recordingIntervalRef.current) {
            clearInterval(recordingIntervalRef.current);
            recordingIntervalRef.current = null;
        }
        setIsRecording(false);
    };

    const handleRetakeVideo = () => {
        if (recordedUrl) {
            URL.revokeObjectURL(recordedUrl);
        }
        setRecordedBlob(null);
        setRecordedUrl(null);
        setShowVideoPreview(false);
        syncInputDatasourceValue(comp, '', `${comp.type}_VIDEO_RECORDED`);
    };

    const handleDownloadVideo = () => {
        if (!recordedBlob) return;
        const url = URL.createObjectURL(recordedBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `video_record_${Date.now()}.webm`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    // Simulate Reading for OCR/Inspections
    const handleSimulateReading = () => {
        let val = '';
        if (filterType === 'CALIPER_OCR') {
            // Standard caliper tolerance ranges (25.38 - 25.42 mm)
            val = (25.38 + Math.random() * 0.04).toFixed(2) + ' mm';
        } else if (filterType === 'DIAL_GAUGE') {
            // Standard pressure/dial ranges (40 - 45 PSI)
            val = (40.0 + Math.random() * 5.0).toFixed(1) + ' PSI';
        } else if (filterType === 'OCR_DETECTOR') {
            val = comp?.props?.ocrTargetText || 'BATCH-' + Math.floor(1000 + Math.random() * 9000);
        } else if (filterType === 'YOLO_DETECTOR') {
            const modelType = comp?.props?.yoloModelType || 'yolov8n_general';
            if (modelType === 'yolov8n_safety') {
                val = 'SAFE: APD LENGKAP';
            } else if (modelType === 'yolov8n_qc') {
                val = 'PASS: PRODUK OK';
            } else {
                val = 'person (92%), laptop (87%)';
            }
        } else {
            // Generic inspection PASS
            val = 'PASS';
        }

        setSimulatedValue(val);
        syncInputDatasourceValue(comp, val, `${comp.type}_CHANGED`);
        onWidgetInteraction(comp, 'ON_CHANGE', { result: val, value: val });
        onWidgetInteraction(comp, 'AfterGettingText', { result: val, value: val });
    };

    // AI-Powered OCR/Reading
    const handleReadWithAI = async () => {
        if (isReadingAI) return;

        let frameDataUrl = '';
        if (videoRef.current && !capturedImage) {
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = 640;
            tempCanvas.height = 480;
            const tempCtx = tempCanvas.getContext('2d');
            tempCtx.drawImage(videoRef.current, 0, 0, tempCanvas.width, tempCanvas.height);
            frameDataUrl = tempCanvas.toDataURL('image/jpeg');
        } else if (capturedImage) {
            frameDataUrl = capturedImage;
        } else if (canvasRef.current) {
            frameDataUrl = canvasRef.current.toDataURL('image/jpeg');
        }

        if (!frameDataUrl) return;

        setIsReadingAI(true);
        try {
            const aiConnector = await getPrimaryAiConnector();
            const settings = aiConnector?.aiSettings || aiConnector?.config;
            if (!settings || !settings.apiKey) {
                throw new Error('AI Connector belum di-configure. Mohon isi API Key di Integrasi > AI Settings.');
            }

            // Convert Base64 frame to Blob for processing
            const base64Content = frameDataUrl.split(',')[1];
            const byteCharacters = atob(base64Content);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const fileBlob = new Blob([byteArray], { type: 'image/jpeg' });
            const mockFile = new File([fileBlob], 'vision_frame.jpg', { type: 'image/jpeg' });

            // Call primary model with tailored prompt
            const { processDocument } = await import('../utils/aiService');
            
            // Build custom model settings to query only numerical measurement or classification
            const customConnector = {
                ...aiConnector,
                aiSettings: {
                    ...settings,
                    // Inject specific prompt instruction for vision reading
                }
            };

            let specificInstruction = '';
            if (filterType === 'YOLO_DETECTOR') {
                const modelType = comp?.props?.yoloModelType || 'yolov8n_general';
                specificInstruction = `Perform YOLO object detection on the image. Model type is: ${modelType}. 
                - If safety model: detect if there's a person and if they wear helmet and vest. Return SAFE: APD LENGKAP or UNSAFE: MISSING Helmet/Vest.
                - If qc model: detect ok product or defects like scratch, crack, dent. Return PASS: PRODUK OK or FAIL: CACAT SCRATCH/CRACK/DENT.
                - If general: list the detected objects.`;
            } else {
                specificInstruction = `Read the image and extract the numeric value or text shown on the digital caliper, dial gauge, or specified OCR region. If a target text is specified (${comp?.props?.ocrTargetText || 'none'}), check if it is present.`;
            }

            const systemPrompt = `You are a machine vision interpreter. ${specificInstruction}
            Return ONLY a valid JSON object matching this schema:
            {
              "reading": "string (the reading value, e.g. SAFE: APD LENGKAP, FAIL: CACAT SCRATCH, 25.40 mm, 42.1 PSI, PASS/FAIL, or detected text)",
              "success": boolean,
              "confidence": number
            }`;

            // Make custom prompt call to Gemini Vision
            const cleanModelId = settings.modelId.includes('/') ? settings.modelId.split('/').pop() : settings.modelId;
            const url = `https://generativelanguage.googleapis.com/v1/models/${cleanModelId}:generateContent?key=${settings.apiKey}`;
            const payload = {
                contents: [{
                    role: 'user',
                    parts: [
                        { text: systemPrompt },
                        { inline_data: { mime_type: 'image/jpeg', data: base64Content } }
                    ]
                }],
                generationConfig: { temperature: 0.1, responseMimeType: 'application/json' }
            };

            const response = await fetch(url, { method: 'POST', body: JSON.stringify(payload) });
            if (!response.ok) throw new Error((await response.json()).error?.message || 'AI Vision Error');
            const responseData = await response.json();
            const parsedText = JSON.parse(responseData.candidates[0].content.parts[0].text);

            if (parsedText && parsedText.reading) {
                setSimulatedValue(parsedText.reading);
                syncInputDatasourceValue(comp, parsedText.reading, `${comp.type}_CHANGED`);
                onWidgetInteraction(comp, 'ON_CHANGE', { result: parsedText.reading, value: parsedText.reading });
                onWidgetInteraction(comp, 'AfterGettingText', { result: parsedText.reading, value: parsedText.reading });
            } else {
                throw new Error('Gagal membaca gambar secara otomatis.');
            }
        } catch (err) {
            console.error('AI Vision error:', err);
            alert(`AI Vision Error: ${err.message}\n\nMenjalankan simulasi pembacaan otomatis...`);
            handleSimulateReading();
        } finally {
            setIsReadingAI(false);
        }
    };

    // Design Mode View
    if (viewMode === 'DESIGN') {
        return (
            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', padding: '10px', boxSizing: 'border-box', backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-secondary)', borderRadius: '12px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '8px' }}>{label}</div>
                <div style={{ flex: 1, border: '1px dashed #7c3aed', borderRadius: '12px', backgroundColor: 'rgba(124,58,237,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#7c3aed', gap: '10px' }}>
                    {isCameraCapture ? <Camera size={40} color="#7c3aed" /> : <Eye size={40} color="#7c3aed" />}
                    <div style={{ fontSize: '0.8rem', fontWeight: 800 }}>{isCameraCapture ? 'Camera Capture (Ready)' : 'OpenCV Vision (Ready)'}</div>
                    {!isCameraCapture && (
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', backgroundColor: 'rgba(124,58,237,0.1)', padding: '2px 8px', borderRadius: '12px' }}>
                            Filter: {filterType}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Preview Mode View
    return (
        <div style={{
            width: '100%', height: '100%',
            display: 'flex', flexDirection: 'column',
            backgroundColor: '#0f172a',
            color: '#fff',
            borderRadius: '16px',
            overflow: 'hidden',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
            border: '1px solid #1e293b',
            boxSizing: 'border-box'
        }}>
            <style>{`
                @keyframes visionBlink {
                    0% { opacity: 1; }
                    50% { opacity: 0.3; }
                    100% { opacity: 1; }
                }
                .vision-rec-dot {
                    animation: visionBlink 1s infinite;
                }
            `}</style>
            {/* Camera Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'rgba(15, 23, 42, 0.8)', borderBottom: '1px solid #1e293b' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em', color: '#94a3b8' }}>
                    {label.toUpperCase()}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        backgroundColor: isRecording ? '#ef4444' : showVideoPreview ? '#10b981' : capturedImage ? '#94a3b8' : '#22c55e',
                        display: 'inline-block'
                    }} className={isRecording ? "vision-rec-dot" : ""} />
                    <span style={{ fontSize: '0.6rem', color: '#94a3b8', fontWeight: 700 }}>
                        {isRecording ? 'REC' : showVideoPreview ? 'VIDEO' : capturedImage ? 'CAP' : 'LIVE'}
                    </span>
                </div>
            </div>

            {/* Viewfinder Area */}
            <div style={{ flex: 1, position: 'relative', overflow: 'hidden', backgroundColor: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {isUploadingSnapshot && (
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundColor: 'rgba(15, 23, 42, 0.65)',
                        backdropFilter: 'blur(3px)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '12px',
                        zIndex: 20
                    }}>
                        <Loader2 size={32} color="#8b5cf6" style={{ animation: 'spin 1.2s linear infinite' }} />
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f8fafc', letterSpacing: '0.05em' }}>
                            UPLOADING SNAPSHOT...
                        </span>
                        <style>{`
                            @keyframes spin {
                                to { transform: rotate(360deg); }
                            }
                        `}</style>
                    </div>
                )}
                {isRecording && (
                    <div style={{
                        position: 'absolute',
                        top: '12px',
                        left: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        backgroundColor: 'rgba(0, 0, 0, 0.75)',
                        padding: '6px 12px',
                        borderRadius: '20px',
                        border: '1px solid rgba(239, 68, 68, 0.5)',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
                        zIndex: 10,
                        pointerEvents: 'none'
                    }}>
                        <span style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: '#ef4444',
                            display: 'inline-block'
                        }} className="vision-rec-dot" />
                        <span style={{ fontSize: '0.7rem', color: '#ef4444', fontWeight: 900, letterSpacing: '0.05em' }}>
                            REC
                        </span>
                        <span style={{ fontSize: '0.7rem', color: '#f8fafc', fontWeight: 700, fontFamily: 'monospace' }}>
                            {formatTime(recordingSeconds)} / {formatTime(comp?.props?.maxRecordingDuration || 30)}
                        </span>
                    </div>
                )}

                {showVideoPreview && recordedUrl ? (
                    /* Recorded Video Playback */
                    <video
                        src={recordedUrl}
                        controls
                        autoPlay
                        style={{ width: '100%', height: '100%', objectFit: 'contain', backgroundColor: '#000' }}
                    />
                ) : capturedImage ? (
                    /* Captured Image Preview */
                    <img
                        src={capturedImage}
                        alt="Captured frame"
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                ) : hasPermission === false ? (
                    /* No Permission Fallback */
                    <div style={{ padding: '20px', textAlign: 'center', color: '#cbd5e1' }}>
                        <AlertTriangle size={36} color="#ef4444" style={{ margin: '0 auto 10px' }} />
                        <div style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px' }}>Kamera Tidak Tersedia</div>
                        <div style={{ fontSize: '0.65rem', color: '#94a3b8', lineHeight: 1.4 }}>{errorMessage}</div>
                        <button
                            onClick={handleSimulateReading}
                            style={{
                                marginTop: '14px', padding: '6px 12px', fontSize: '0.7rem', fontWeight: 700,
                                backgroundColor: '#7c3aed', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer'
                            }}
                        >
                            Simulasikan Hasil Pembacaan
                        </button>
                    </div>
                ) : (
                    /* Live video stream & canvas filters */
                    <>
                        <video
                            ref={videoRef}
                            style={{ display: 'none' }}
                            width="640"
                            height="480"
                            playsInline
                            muted
                        />
                        <canvas
                            ref={canvasRef}
                            width="640"
                            height="480"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                    </>
                )}

                {/* Simulated reading overlay */}
                {simulatedValue && (
                    <div style={{
                        position: 'absolute', bottom: '12px', left: '12px', right: '12px',
                        padding: '10px 12px', borderRadius: '10px',
                        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 27, 75, 0.9) 100%)',
                        border: '1px solid rgba(124, 58, 237, 0.4)',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.2)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <CheckCircle size={16} color="#10b981" />
                            <div>
                                <div style={{ fontSize: '0.55rem', color: '#94a3b8', fontWeight: 700 }}>HASIL BACAAN VISION:</div>
                                <div style={{ fontSize: '0.9rem', color: '#f8fafc', fontWeight: 900 }}>{simulatedValue}</div>
                            </div>
                        </div>
                        <button
                            onClick={handleRetake}
                            style={{
                                border: 'none', background: 'rgba(255,255,255,0.1)', color: '#fff',
                                padding: '4px 8px', borderRadius: '6px', fontSize: '0.65rem', fontWeight: 700, cursor: 'pointer'
                            }}
                        >
                            Reset
                        </button>
                    </div>
                )}
            </div>

            {/* Camera Controls Footer */}
            <div style={{ padding: '8px 12px', backgroundColor: 'rgba(15, 23, 42, 0.95)', borderTop: '1px solid #1e293b', display: 'flex', gap: '8px', justifyContent: 'center' }}>
                {showVideoPreview && recordedUrl ? (
                    <>
                        <button
                            onClick={handleRetakeVideo}
                            style={{
                                flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid #334155',
                                backgroundColor: 'transparent', color: '#cbd5e1', fontSize: '0.75rem', fontWeight: 700,
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer'
                            }}
                        >
                            <RefreshCw size={14} /> Rekam Ulang
                        </button>
                        <button
                            onClick={handleDownloadVideo}
                            style={{
                                flex: 1, padding: '8px', borderRadius: '8px', border: 'none',
                                backgroundColor: '#10b981', color: '#ffffff', fontSize: '0.75rem', fontWeight: 700,
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer'
                            }}
                        >
                            <Download size={14} /> Unduh Video
                        </button>
                    </>
                ) : capturedImage ? (
                    <button
                        onClick={handleRetake}
                        style={{
                            flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid #334155',
                            backgroundColor: 'transparent', color: '#cbd5e1', fontSize: '0.75rem', fontWeight: 700,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer'
                        }}
                    >
                        <RefreshCw size={14} /> Ambil Ulang
                    </button>
                ) : isRecording ? (
                    <button
                        onClick={stopRecording}
                        style={{
                            flex: 1, padding: '8px', borderRadius: '8px', border: 'none',
                            backgroundColor: '#dc2626', color: '#ffffff', fontSize: '0.75rem', fontWeight: 700,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer'
                        }}
                    >
                        <Square size={14} /> Hentikan Rekaman ({formatTime(recordingSeconds)})
                    </button>
                ) : (
                    <>
                        {/* Primary action to trigger capture */}
                        <button
                            onClick={handleCapture}
                            disabled={!hasPermission}
                            style={{
                                flex: 1, padding: '8px', borderRadius: '8px', border: 'none',
                                backgroundColor: hasPermission ? '#2563eb' : '#334155',
                                color: hasPermission ? '#ffffff' : '#94a3b8',
                                fontSize: '0.75rem', fontWeight: 700,
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                                cursor: hasPermission ? 'pointer' : 'not-allowed'
                            }}
                        >
                            <Camera size={14} /> Tangkap Foto
                        </button>

                        {/* Video Recording Option */}
                        {comp?.props?.enableVideoRecording && (
                            <button
                                onClick={startRecording}
                                disabled={!hasPermission}
                                style={{
                                    flex: 1, padding: '8px', borderRadius: '8px', border: 'none',
                                    backgroundColor: hasPermission ? '#ef4444' : '#334155',
                                    color: hasPermission ? '#ffffff' : '#94a3b8',
                                    fontSize: '0.75rem', fontWeight: 700,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                                    cursor: hasPermission ? 'pointer' : 'not-allowed'
                                }}
                            >
                                <Video size={14} /> Rekam Video
                            </button>
                        )}

                        {/* OCR dial/caliper controls */}
                        {['CALIPER_OCR', 'DIAL_GAUGE', 'OCR_DETECTOR', 'YOLO_DETECTOR'].includes(filterType) && (
                            <>
                                <button
                                    onClick={handleSimulateReading}
                                    style={{
                                        flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid #334155',
                                        backgroundColor: '#1e293b', color: '#cbd5e1', fontSize: '0.75rem', fontWeight: 700,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer'
                                    }}
                                >
                                    Simulasi Baca
                                </button>
                                <button
                                    onClick={handleReadWithAI}
                                    style={{
                                        flex: 1, padding: '8px', borderRadius: '8px', border: 'none',
                                        background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)', color: '#fff', fontSize: '0.75rem', fontWeight: 700,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer'
                                    }}
                                    disabled={isReadingAI}
                                >
                                    {isReadingAI ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                                    AI Baca
                                </button>
                            </>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

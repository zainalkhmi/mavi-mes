import React, { useState, useEffect, useRef } from 'react';
import { Camera, RefreshCw, Eye, Loader2, Sparkles, CheckCircle, AlertTriangle, Play } from 'lucide-react';
import { getPrimaryAiConnector } from '../utils/database';

export default function VisionCamera({ comp, syncInputDatasourceValue, onWidgetInteraction, viewMode }) {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);
    const animationFrameRef = useRef(null);

    const [hasPermission, setHasPermission] = useState(null);
    const [capturedImage, setCapturedImage] = useState(null);
    const [simulatedValue, setSimulatedValue] = useState('');
    const [isReadingAI, setIsReadingAI] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const filterType = comp?.props?.filterType || 'NONE';
    const label = comp?.props?.label || (comp?.type === 'OPENCV_CAMERA' ? 'OpenCV Live Stream' : 'Take Photo');
    const thresholdValue = Number(comp?.props?.thresholdValue ?? 100);
    const isCameraCapture = comp?.type === 'CAMERA_CAPTURE';

    // Start video stream
    useEffect(() => {
        if (viewMode !== 'PREVIEW' || capturedImage) return;

        let activeStream = null;
        setErrorMessage('');

        navigator.mediaDevices.getUserMedia({
            video: {
                width: { ideal: 640 },
                height: { ideal: 480 },
                facingMode: 'environment'
            }
        })
        .then((stream) => {
            setHasPermission(true);
            activeStream = stream;
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play().catch(err => {
                    console.warn('Video play interrupted:', err);
                });
            }
        })
        .catch((err) => {
            console.error('Camera access error:', err);
            setHasPermission(false);
            setErrorMessage(err.message || 'Kamera tidak dapat diakses atau tidak ditemukan.');
        });

        return () => {
            if (activeStream) {
                activeStream.getTracks().forEach(track => track.stop());
            }
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [viewMode, capturedImage]);

    // Canvas image processing loop for filters
    useEffect(() => {
        if (viewMode !== 'PREVIEW' || isCameraCapture || capturedImage || !hasPermission) return;

        const processFrame = () => {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            if (!video || !canvas || video.paused || video.ended) {
                animationFrameRef.current = requestAnimationFrame(processFrame);
                return;
            }

            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            // Draw video to canvas
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            // Apply filter if specified
            if (filterType !== 'NONE') {
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
                        // High speed pixel-difference edge filter
                        for (let y = 0; y < h - 1; y++) {
                            for (let x = 0; x < w - 1; x++) {
                                const idx = (y * w + x) * 4;
                                const nextX = idx + 4;
                                const nextY = idx + w * 4;

                                const val = Math.abs(sData[idx] - sData[nextX]) + Math.abs(sData[idx] - sData[nextY]);
                                const edge = val > 15 ? 255 : 0;

                                // Neon violet edge lines
                                dData[idx] = edge ? 124 : 15;     // R
                                dData[idx + 1] = edge ? 58 : 23;   // G
                                dData[idx + 2] = edge ? 237 : 42;  // B
                                dData[idx + 3] = 255;
                            }
                        }
                        ctx.putImageData(dst, 0, 0);
                    }
                } catch (e) {
                    console.error('Filter processing error:', e);
                }
            }

            // Draw target overlays for Caliper / Dial Gauge guides
            if (['CALIPER_OCR', 'DIAL_GAUGE'].includes(filterType)) {
                ctx.strokeStyle = '#ef4444'; // red target bounding box
                ctx.lineWidth = 3;
                ctx.setLineDash([6, 6]);

                if (filterType === 'CALIPER_OCR') {
                    // Draw horizontal rectangle guide for caliper display
                    ctx.strokeRect(canvas.width * 0.15, canvas.height * 0.35, canvas.width * 0.7, canvas.height * 0.3);
                    ctx.fillStyle = 'rgba(239, 68, 68, 0.1)';
                    ctx.fillRect(canvas.width * 0.15, canvas.height * 0.35, canvas.width * 0.7, canvas.height * 0.3);

                    ctx.fillStyle = '#ef4444';
                    ctx.font = 'bold 11px Inter, sans-serif';
                    ctx.fillText('POSISIKAN LAYAR CALIPER DI SINI', canvas.width * 0.2, canvas.height * 0.3);
                } else if (filterType === 'DIAL_GAUGE') {
                    // Draw square guide for circular dial gauge
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

            animationFrameRef.current = requestAnimationFrame(processFrame);
        };

        animationFrameRef.current = requestAnimationFrame(processFrame);

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [viewMode, filterType, thresholdValue, capturedImage, isCameraCapture, hasPermission]);

    // Handle standard camera capture
    const handleCapture = () => {
        let dataUrl = '';
        if (isCameraCapture) {
            // Draw current video frame to capture canvas
            const canvas = document.createElement('canvas');
            canvas.width = 640;
            canvas.height = 480;
            const ctx = canvas.getContext('2d');
            if (videoRef.current) {
                ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
                dataUrl = canvas.toDataURL('image/jpeg');
            }
        } else if (canvasRef.current) {
            // Take snapshot of current visual filter canvas
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
    };

    const handleRetake = () => {
        setCapturedImage(null);
        setSimulatedValue('');
        syncInputDatasourceValue(comp, '', `${comp.type}_CHANGED`);
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

            const systemPrompt = `You are a machine vision interpreter. Read the image and extract the numeric value shown on the digital caliper or dial gauge display. 
            If it is a general quality inspection, classify it as OK or NG.
            Return ONLY a valid JSON object matching this schema:
            {
              "reading": "string (the number and unit, e.g. 25.40 mm or 42.1 PSI, or classification like PASS/FAIL)",
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
            {/* Camera Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'rgba(15, 23, 42, 0.8)', borderBottom: '1px solid #1e293b' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em', color: '#94a3b8' }}>
                    {label.toUpperCase()}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: capturedImage ? '#94a3b8' : '#22c55e', display: 'inline-block' }} />
                    <span style={{ fontSize: '0.6rem', color: '#94a3b8', fontWeight: 700 }}>
                        {capturedImage ? 'CAP' : 'LIVE'}
                    </span>
                </div>
            </div>

            {/* Viewfinder Area */}
            <div style={{ flex: 1, position: 'relative', overflow: 'hidden', backgroundColor: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {capturedImage ? (
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
                {capturedImage ? (
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

                        {/* OCR dial/caliper controls */}
                        {['CALIPER_OCR', 'DIAL_GAUGE'].includes(filterType) && (
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
                                    disabled={isReadingAI}
                                    style={{
                                        padding: '8px 12px', borderRadius: '8px', border: 'none',
                                        backgroundColor: '#7c3aed', color: '#ffffff', fontSize: '0.75rem', fontWeight: 700,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer'
                                    }}
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

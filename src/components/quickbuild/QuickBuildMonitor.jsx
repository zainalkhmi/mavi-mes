import React, { useState, useRef, useEffect } from 'react';
import {
    Activity, Eye, Download, Camera, RefreshCw, Square, Circle, Minus,
    Crosshair, Move, MousePointer, Trash2
} from 'lucide-react';
import toast from 'react-hot-toast';
import Webcam from 'react-webcam';

/**
 * QuickBuildMonitor — Live inspection image viewer with interactive ROI overlay editor.
 * 
 * ROI Types: rect, circle, line, annulus
 */
export default function QuickBuildMonitor({
    processedImage,
    setProcessedImage,
    uploadedFile,
    setUploadedFile,
    imagePreviewUrl,
    setImagePreviewUrl,
    useLiveCamera,
    setUseLiveCamera,
    webcamRef,
    devices,
    selectedDeviceId,
    setSelectedDeviceId,
    isContinuous,
    setIsContinuous,
    roiRegions,
    setRoiRegions,
}) {
    // ROI drawing state
    const [activeRoiTool, setActiveRoiTool] = useState(null); // 'rect' | 'circle' | 'line' | null
    const [isDrawingRoi, setIsDrawingRoi] = useState(false);
    const [roiDraft, setRoiDraft] = useState(null);
    const [selectedRoiId, setSelectedRoiId] = useState(null);
    const canvasOverlayRef = useRef(null);
    const containerRef = useRef(null);

    // ── ROI Drawing Handlers ───────────────────────────────────
    const getRelativeCoords = (e) => {
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return { x: 0, y: 0 };
        return {
            x: ((e.clientX - rect.left) / rect.width) * 100,
            y: ((e.clientY - rect.top) / rect.height) * 100,
        };
    };

    const handleOverlayMouseDown = (e) => {
        if (!activeRoiTool) return;
        e.preventDefault();
        const { x, y } = getRelativeCoords(e);
        setIsDrawingRoi(true);
        setRoiDraft({ type: activeRoiTool, startX: x, startY: y, endX: x, endY: y });
    };

    const handleOverlayMouseMove = (e) => {
        if (!isDrawingRoi || !roiDraft) return;
        const { x, y } = getRelativeCoords(e);
        setRoiDraft(prev => ({ ...prev, endX: x, endY: y }));
    };

    const handleOverlayMouseUp = () => {
        if (!isDrawingRoi || !roiDraft) return;
        setIsDrawingRoi(false);

        const dx = Math.abs(roiDraft.endX - roiDraft.startX);
        const dy = Math.abs(roiDraft.endY - roiDraft.startY);
        if (dx < 2 && dy < 2) { setRoiDraft(null); return; } // Too small, ignore

        const newRoi = {
            id: `roi_${Date.now()}`,
            type: roiDraft.type,
            x: Math.min(roiDraft.startX, roiDraft.endX),
            y: Math.min(roiDraft.startY, roiDraft.endY),
            width: dx,
            height: dy,
            // For circle: use center + radius
            cx: (roiDraft.startX + roiDraft.endX) / 2,
            cy: (roiDraft.startY + roiDraft.endY) / 2,
            radius: Math.sqrt(dx * dx + dy * dy) / 2,
            // For line: use start/end
            x1: roiDraft.startX, y1: roiDraft.startY,
            x2: roiDraft.endX, y2: roiDraft.endY,
            color: ROI_COLORS[roiRegions.length % ROI_COLORS.length],
            label: `ROI ${roiRegions.length + 1}`,
        };

        setRoiRegions(prev => [...prev, newRoi]);
        setRoiDraft(null);
        setActiveRoiTool(null);
        toast.success(`Added ${newRoi.type} ROI: "${newRoi.label}"`);
    };

    const handleDeleteRoi = (roiId) => {
        setRoiRegions(prev => prev.filter(r => r.id !== roiId));
        if (selectedRoiId === roiId) setSelectedRoiId(null);
        toast.success('ROI removed');
    };

    // ── ROI Tool Buttons ───────────────────────────────────────
    const roiTools = [
        { id: null, icon: MousePointer, label: 'Select' },
        { id: 'rect', icon: Square, label: 'Rectangle' },
        { id: 'circle', icon: Circle, label: 'Circle' },
        { id: 'line', icon: Minus, label: 'Line' },
    ];

    return (
        <div style={{
            backgroundColor: 'white', borderRadius: '16px', border: '1px solid #cbd5e1',
            padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px',
        }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Activity size={14} color="#3b82f6" /> Live Monitor
                </span>
                <span style={{
                    fontSize: '0.62rem', padding: '3px 6px', borderRadius: '4px',
                    backgroundColor: (processedImage || useLiveCamera) ? '#e2fbe8' : '#f1f5f9',
                    color: (processedImage || useLiveCamera) ? '#10b981' : '#64748b', fontWeight: 700,
                }}>
                    {(processedImage || useLiveCamera) ? 'ACTIVE' : 'NO FEED'}
                </span>
            </div>

            {/* ROI Toolbar */}
            <div style={{ display: 'flex', gap: '4px', padding: '4px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                {roiTools.map(tool => {
                    const Icon = tool.icon;
                    const isActive = activeRoiTool === tool.id;
                    return (
                        <button
                            key={tool.id || 'select'}
                            onClick={() => setActiveRoiTool(tool.id)}
                            title={tool.label}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '4px',
                                padding: '4px 8px', borderRadius: '6px',
                                border: isActive ? '1px solid #3b82f6' : '1px solid transparent',
                                backgroundColor: isActive ? '#eff6ff' : 'transparent',
                                color: isActive ? '#2563eb' : '#64748b',
                                fontSize: '0.62rem', fontWeight: 700, cursor: 'pointer',
                            }}
                        >
                            <Icon size={12} /> {tool.label}
                        </button>
                    );
                })}
                {roiRegions.length > 0 && (
                    <button
                        onClick={() => { setRoiRegions([]); setSelectedRoiId(null); toast.success('All ROIs cleared'); }}
                        title="Clear all ROIs"
                        style={{
                            marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '3px',
                            padding: '4px 8px', borderRadius: '6px', border: '1px solid #fee2e2',
                            backgroundColor: '#fef2f2', color: '#ef4444', fontSize: '0.62rem', fontWeight: 700, cursor: 'pointer',
                        }}
                    >
                        <Trash2 size={10} /> Clear
                    </button>
                )}
            </div>

            {/* Image Viewer + ROI Canvas Overlay */}
            <div
                ref={containerRef}
                onMouseDown={handleOverlayMouseDown}
                onMouseMove={handleOverlayMouseMove}
                onMouseUp={handleOverlayMouseUp}
                onMouseLeave={() => { if (isDrawingRoi) handleOverlayMouseUp(); }}
                style={{
                    position: 'relative', width: '100%', aspectRatio: '4/3',
                    backgroundColor: '#0f172a', borderRadius: '8px', overflow: 'hidden',
                    border: '1px solid #e2e8f0',
                    cursor: activeRoiTool ? 'crosshair' : 'default',
                }}
            >
                {/* Image Layer */}
                {processedImage ? (
                    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                        <img src={processedImage} style={{ width: '100%', height: '100%', objectFit: 'contain' }} alt="Processed" />
                        {useLiveCamera && (
                            <button onClick={() => { setProcessedImage(null); setIsContinuous(false); }}
                                style={{ position: 'absolute', bottom: 8, left: 8, backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', padding: '4px 8px', fontSize: '0.6rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                <RefreshCw size={10} /> Live Feed
                            </button>
                        )}
                    </div>
                ) : useLiveCamera ? (
                    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                        <Webcam
                            audio={false} ref={webcamRef} screenshotFormat="image/jpeg"
                            videoConstraints={selectedDeviceId ? { deviceId: { exact: selectedDeviceId }, width: 640, height: 480 } : { facingMode: 'environment', width: 640, height: 480 }}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        <div style={{ position: 'absolute', top: 8, left: 8, backgroundColor: 'rgba(15,23,42,0.75)', color: '#38bdf8', padding: '3px 8px', borderRadius: '12px', fontSize: '0.55rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{ display: 'inline-block', width: '6px', height: '6px', backgroundColor: '#38bdf8', borderRadius: '50%', animation: 'qb-pulse 1s infinite' }} />LIVE
                        </div>
                    </div>
                ) : imagePreviewUrl ? (
                    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                        <img src={imagePreviewUrl} style={{ width: '100%', height: '100%', objectFit: 'contain', opacity: 0.6 }} alt="Preview" />
                        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.72rem', fontWeight: 700, textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
                            READY TO RUN
                        </div>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '8px', color: '#94a3b8', textAlign: 'center' }}>
                        <Eye size={24} color="#64748b" />
                        <span style={{ fontSize: '0.68rem', fontWeight: 700 }}>No image feed</span>
                        <span style={{ fontSize: '0.58rem', color: '#64748b' }}>Upload image or run pipeline</span>
                    </div>
                )}

                {/* ROI SVG Overlay */}
                <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: activeRoiTool ? 'none' : 'auto', zIndex: 5 }}>
                    {/* Existing ROIs */}
                    {roiRegions.map(roi => (
                        <g key={roi.id} onClick={() => setSelectedRoiId(roi.id)} style={{ cursor: 'pointer' }}>
                            {roi.type === 'rect' && (
                                <>
                                    <rect x={`${roi.x}%`} y={`${roi.y}%`} width={`${roi.width}%`} height={`${roi.height}%`}
                                        fill={`${roi.color}15`} stroke={selectedRoiId === roi.id ? '#ffffff' : roi.color}
                                        strokeWidth={selectedRoiId === roi.id ? 2.5 : 1.5} strokeDasharray={selectedRoiId === roi.id ? '6 3' : 'none'}
                                    />
                                    <text x={`${roi.x + 0.5}%`} y={`${roi.y + roi.height + 3}%`} fill={roi.color} fontSize="10" fontWeight="bold">{roi.label}</text>
                                </>
                            )}
                            {roi.type === 'circle' && (
                                <>
                                    <ellipse cx={`${roi.cx}%`} cy={`${roi.cy}%`} rx={`${roi.width / 2}%`} ry={`${roi.height / 2}%`}
                                        fill={`${roi.color}15`} stroke={selectedRoiId === roi.id ? '#ffffff' : roi.color}
                                        strokeWidth={selectedRoiId === roi.id ? 2.5 : 1.5} strokeDasharray={selectedRoiId === roi.id ? '6 3' : 'none'}
                                    />
                                    <text x={`${roi.cx}%`} y={`${roi.cy + roi.height / 2 + 3}%`} fill={roi.color} fontSize="10" fontWeight="bold" textAnchor="middle">{roi.label}</text>
                                </>
                            )}
                            {roi.type === 'line' && (
                                <>
                                    <line x1={`${roi.x1}%`} y1={`${roi.y1}%`} x2={`${roi.x2}%`} y2={`${roi.y2}%`}
                                        stroke={selectedRoiId === roi.id ? '#ffffff' : roi.color} strokeWidth={selectedRoiId === roi.id ? 3 : 2}
                                    />
                                    <circle cx={`${roi.x1}%`} cy={`${roi.y1}%`} r="4" fill={roi.color} />
                                    <circle cx={`${roi.x2}%`} cy={`${roi.y2}%`} r="4" fill={roi.color} />
                                    <text x={`${(roi.x1 + roi.x2) / 2}%`} y={`${(roi.y1 + roi.y2) / 2 - 2}%`} fill={roi.color} fontSize="10" fontWeight="bold" textAnchor="middle">{roi.label}</text>
                                </>
                            )}
                        </g>
                    ))}

                    {/* Draft ROI being drawn */}
                    {roiDraft && (
                        <g>
                            {roiDraft.type === 'rect' && (
                                <rect
                                    x={`${Math.min(roiDraft.startX, roiDraft.endX)}%`}
                                    y={`${Math.min(roiDraft.startY, roiDraft.endY)}%`}
                                    width={`${Math.abs(roiDraft.endX - roiDraft.startX)}%`}
                                    height={`${Math.abs(roiDraft.endY - roiDraft.startY)}%`}
                                    fill="rgba(59, 130, 246, 0.15)" stroke="#3b82f6" strokeWidth="2" strokeDasharray="6 3"
                                />
                            )}
                            {roiDraft.type === 'circle' && (
                                <ellipse
                                    cx={`${(roiDraft.startX + roiDraft.endX) / 2}%`}
                                    cy={`${(roiDraft.startY + roiDraft.endY) / 2}%`}
                                    rx={`${Math.abs(roiDraft.endX - roiDraft.startX) / 2}%`}
                                    ry={`${Math.abs(roiDraft.endY - roiDraft.startY) / 2}%`}
                                    fill="rgba(59, 130, 246, 0.15)" stroke="#3b82f6" strokeWidth="2" strokeDasharray="6 3"
                                />
                            )}
                            {roiDraft.type === 'line' && (
                                <line
                                    x1={`${roiDraft.startX}%`} y1={`${roiDraft.startY}%`}
                                    x2={`${roiDraft.endX}%`} y2={`${roiDraft.endY}%`}
                                    stroke="#3b82f6" strokeWidth="2.5" strokeDasharray="6 3"
                                />
                            )}
                        </g>
                    )}
                </svg>
            </div>

            {/* Camera Mode Switch + Controls */}
            <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => { setUseLiveCamera(false); setIsContinuous(false); setProcessedImage(null); }}
                    style={modeBtnStyle(!useLiveCamera)}>
                    <Download size={12} style={{ transform: 'rotate(180deg)' }} /> Upload
                </button>
                <button onClick={() => { setUseLiveCamera(true); setProcessedImage(null); }}
                    style={modeBtnStyle(useLiveCamera)}>
                    <Camera size={12} /> Camera
                </button>
            </div>

            {/* Upload or Camera controls */}
            {!useLiveCamera ? (
                <div style={{ display: 'flex', gap: '8px' }}>
                    <label style={uploadBtnStyle}>
                        <Download size={12} style={{ transform: 'rotate(180deg)' }} /> Upload Image
                        <input type="file" accept="image/*" onChange={e => {
                            const file = e.target.files[0];
                            if (file) { setUploadedFile(file); setImagePreviewUrl(URL.createObjectURL(file)); setProcessedImage(null); toast.success(`Loaded: ${file.name}`); }
                        }} style={{ display: 'none' }} />
                    </label>
                    {(uploadedFile || processedImage) && (
                        <button onClick={() => { setUploadedFile(null); setImagePreviewUrl(null); setProcessedImage(null); }}
                            style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #fee2e2', backgroundColor: '#fef2f2', color: '#ef4444', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer' }}>
                            Reset
                        </button>
                    )}
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '8px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        <span style={{ fontSize: '0.6rem', fontWeight: 700, color: '#64748b' }}>ACTIVE CAMERA:</span>
                        <select value={selectedDeviceId} onChange={e => { setSelectedDeviceId(e.target.value); setProcessedImage(null); }}
                            style={{ width: '100%', padding: '5px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.7rem', backgroundColor: 'white', outline: 'none' }}>
                            {devices.length === 0 ? <option value="">No cameras</option> : devices.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label || `Camera ${devices.indexOf(d) + 1}`}</option>)}
                        </select>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.62rem', fontWeight: 700, color: '#475569' }}>Continuous:</span>
                        <label style={{ position: 'relative', display: 'inline-block', width: '34px', height: '20px' }}>
                            <input type="checkbox" checked={isContinuous} onChange={e => {
                                setIsContinuous(e.target.checked);
                                toast.success(e.target.checked ? 'Continuous active' : 'Continuous paused');
                            }} style={{ opacity: 0, width: 0, height: 0 }} />
                            <span style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: isContinuous ? '#10b981' : '#cbd5e1', transition: '.3s', borderRadius: '20px', cursor: 'pointer' }}>
                                <span style={{ position: 'absolute', height: '14px', width: '14px', left: isContinuous ? '16px' : '3px', bottom: '3px', backgroundColor: 'white', transition: '.3s', borderRadius: '50%' }} />
                            </span>
                        </label>
                    </div>
                </div>
            )}

            {/* ROI List */}
            {roiRegions.length > 0 && (
                <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '8px' }}>
                    <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Regions of Interest ({roiRegions.length})
                    </span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '6px' }}>
                        {roiRegions.map(roi => (
                            <div key={roi.id}
                                onClick={() => setSelectedRoiId(roi.id)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '6px',
                                    padding: '4px 8px', borderRadius: '6px',
                                    backgroundColor: selectedRoiId === roi.id ? `${roi.color}10` : 'transparent',
                                    border: selectedRoiId === roi.id ? `1px solid ${roi.color}30` : '1px solid transparent',
                                    cursor: 'pointer', fontSize: '0.65rem',
                                }}>
                                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: roi.color, flexShrink: 0 }} />
                                <span style={{ flex: 1, fontWeight: 600, color: '#334155' }}>{roi.label}</span>
                                <span style={{ fontSize: '0.58rem', color: '#94a3b8' }}>{roi.type}</span>
                                <button onClick={(e) => { e.stopPropagation(); handleDeleteRoi(roi.id); }}
                                    style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#ef4444', display: 'flex', padding: '2px' }}>
                                    <Trash2 size={10} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Constants ────────────────────────────────────────────────────
const ROI_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

// ─── Shared Styles ────────────────────────────────────────────────
const modeBtnStyle = (active) => ({
    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
    padding: '6px 12px', borderRadius: '8px',
    border: `1px solid ${active ? '#3b82f6' : '#cbd5e1'}`,
    backgroundColor: active ? '#eff6ff' : 'white',
    color: active ? '#2563eb' : '#334155',
    fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer', outline: 'none',
});

const uploadBtnStyle = {
    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
    padding: '6px 12px', borderRadius: '8px', border: '1px solid #cbd5e1',
    backgroundColor: 'white', color: '#334155', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer',
};

import React, { useState, useRef, useEffect } from 'react';
import {
    Activity, Eye, Download, Camera, RefreshCw, Square, Circle, Minus,
    Crosshair, Move, MousePointer, Trash2
} from 'lucide-react';
import toast from 'react-hot-toast';
import Webcam from 'react-webcam';

// Custom icons for Cognex advanced ROIs
const RotatedSquare = ({ size = 12 }) => (
    <svg viewBox="0 0 24 24" width={size} height={size} stroke="currentColor" strokeWidth="2" fill="none" style={{ transform: 'rotate(20deg)' }}>
        <rect x="4" y="4" width="16" height="16" rx="2" />
    </svg>
);

const AnnulusIcon = ({ size = 12 }) => (
    <svg viewBox="0 0 24 24" width={size} height={size} stroke="currentColor" strokeWidth="2" fill="none">
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="5" strokeDasharray="3 3" />
    </svg>
);

/**
 * QuickBuildMonitor — Live inspection image viewer with interactive ROI overlay editor.
 * 
 * ROI Types: rect, circle, line, annulus, rotated_rect
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
    // Filmstrip Props
    filmstripFrames = [],
    activeFilmstripIndex = -1,
    isFilmstripPlaying = false,
    onAddFilmstripFrame = () => {},
    onClearFilmstrip = () => {},
    onSelectFilmstripFrame = () => {},
    onPlayPauseFilmstrip = () => {},
    nodes = [],
    selectedNodeId = null,
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
            // For circle & annulus: use center + radius
            cx: (roiDraft.startX + roiDraft.endX) / 2,
            cy: (roiDraft.startY + roiDraft.endY) / 2,
            radius: Math.sqrt(dx * dx + dy * dy) / 2,
            // For line: use start/end
            x1: roiDraft.startX, y1: roiDraft.startY,
            x2: roiDraft.endX, y2: roiDraft.endY,
            rotation: roiDraft.type === 'rotated_rect' ? 25 : 0,
            color: ROI_COLORS[roiRegions.length % ROI_COLORS.length],
            label: `${roiDraft.type === 'annulus' ? 'Annulus' : roiDraft.type === 'rotated_rect' ? 'Rotated' : 'ROI'} ${roiRegions.length + 1}`,
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
        { id: 'rotated_rect', icon: RotatedSquare, label: 'Rotated Rect' },
        { id: 'circle', icon: Circle, label: 'Circle' },
        { id: 'annulus', icon: AnnulusIcon, label: 'Annulus' },
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
                            {roi.type === 'rotated_rect' && (
                                <>
                                    <rect x={`${roi.x}%`} y={`${roi.y}%`} width={`${roi.width}%`} height={`${roi.height}%`}
                                        fill={`${roi.color}15`} stroke={selectedRoiId === roi.id ? '#ffffff' : roi.color}
                                        strokeWidth={selectedRoiId === roi.id ? 2.5 : 1.5} strokeDasharray={selectedRoiId === roi.id ? '6 3' : 'none'}
                                        transform={`rotate(${roi.rotation || 25}, ${roi.x + roi.width / 2} ${roi.y + roi.height / 2})`}
                                    />
                                    <text x={`${roi.x + 0.5}%`} y={`${roi.y + roi.height + 3}%`} fill={roi.color} fontSize="10" fontWeight="bold" transform={`rotate(${roi.rotation || 25}, ${roi.x + roi.width / 2} ${roi.y + roi.height / 2})`}>{roi.label}</text>
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
                            {roi.type === 'annulus' && (
                                <>
                                    <circle cx={`${roi.cx}%`} cy={`${roi.cy}%`} r={`${roi.radius}%`}
                                        fill={`${roi.color}15`} stroke={selectedRoiId === roi.id ? '#ffffff' : roi.color}
                                        strokeWidth={selectedRoiId === roi.id ? 2.5 : 1.5} strokeDasharray={selectedRoiId === roi.id ? '6 3' : 'none'}
                                    />
                                    <circle cx={`${roi.cx}%`} cy={`${roi.cy}%`} r={`${roi.radius * 0.5}%`}
                                        fill="none" stroke={selectedRoiId === roi.id ? '#ffffff' : roi.color}
                                        strokeWidth={1} strokeDasharray="3 3"
                                    />
                                    <text x={`${roi.cx}%`} y={`${roi.cy + roi.radius + 3}%`} fill={roi.color} fontSize="10" fontWeight="bold" textAnchor="middle">{roi.label}</text>
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

                    {/* Custom Parity Visualizers for Selected Node / Nodes */}
                    {nodes?.some(n => n.type === 'grid_calibration' && n.params.showGrid !== false) && (
                        <g opacity="0.4">
                            {[10, 20, 30, 40, 50, 60, 70, 80, 90].map(val => (
                                <React.Fragment key={val}>
                                    <line x1={`${val}%`} y1="0%" x2={`${val}%`} y2="100%" stroke="#e2e8f0" strokeWidth="0.5" strokeDasharray="2 2" />
                                    <line x1="0%" y1={`${val}%`} x2="100%" y2={`${val}%`} stroke="#e2e8f0" strokeWidth="0.5" strokeDasharray="2 2" />
                                    <text x={`${val}%`} y="3.5%" fill="#cbd5e1" fontSize="8" textAnchor="middle">{(val * 0.25).toFixed(1)}mm</text>
                                    <text x="0.8%" y={`${val}%`} fill="#cbd5e1" fontSize="8" alignmentBaseline="middle">{(val * 0.25).toFixed(1)}mm</text>
                                </React.Fragment>
                            ))}
                        </g>
                    )}

                    {nodes?.filter(n => n.type === 'geom_construction').map(n => (
                        <g key={n.id}>
                            {n.params.geomMode === 'Line-Line Intersection' && (
                                <g>
                                    {/* Neon cyan perpotongan silang */}
                                    <circle cx="55%" cy="45%" r="6" fill="none" stroke="#22d3ee" strokeWidth="2" />
                                    <line x1="55%" y1="35%" x2="55%" y2="55%" stroke="#22d3ee" strokeWidth="1.5" />
                                    <line x1="45%" y1="45%" x2="65%" y2="45%" stroke="#22d3ee" strokeWidth="1.5" />
                                    <line x1="10%" y1="90%" x2="90%" y2="10%" stroke="#22d3ee" strokeWidth="1" strokeDasharray="4 4" opacity="0.45" />
                                    <line x1="10%" y1="10%" x2="90%" y2="90%" stroke="#22d3ee" strokeWidth="1" strokeDasharray="4 4" opacity="0.45" />
                                    <text x="57%" y="43%" fill="#22d3ee" fontSize="9" fontWeight="bold">Intersection ({n.name})</text>
                                </g>
                            )}
                            {n.params.geomMode === 'Point-Line Distance' && (
                                <g>
                                    <circle cx="35%" cy="30%" r="5" fill="#22d3ee" />
                                    <line x1="15%" y1="65%" x2="85%" y2="65%" stroke="#94a3b8" strokeWidth="2" />
                                    <line x1="35%" y1="30%" x2="35%" y2="65%" stroke="#22d3ee" strokeWidth="2" strokeDasharray="4 4" />
                                    <text x="37%" y="45%" fill="#22d3ee" fontSize="9" fontWeight="bold">Dist Point-Line: 8.75 mm</text>
                                </g>
                            )}
                            {n.params.geomMode === 'Point-Point Distance' && (
                                <g>
                                    <circle cx="30%" cy="40%" r="5" fill="#22d3ee" />
                                    <circle cx="70%" cy="50%" r="5" fill="#22d3ee" />
                                    <line x1="30%" y1="40%" x2="70%" y2="50%" stroke="#22d3ee" strokeWidth="2" strokeDasharray="5 5" />
                                    <text x="50%" y="42%" fill="#22d3ee" fontSize="9" fontWeight="bold" textAnchor="middle">Dist P1-P2: 12.40 mm</text>
                                </g>
                            )}
                        </g>
                    ))}

                    {nodes?.filter(n => n.type === 'spatial_flaw').map(n => (
                        <g key={n.id}>
                            <rect x="42%" y="30%" width="20%" height="12%" fill="rgba(239, 68, 68, 0.15)" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="4 2" />
                            <path d="M 45,35 Q 48,32 52,38 T 60,34" fill="none" stroke="#ef4444" strokeWidth="2.5" />
                            <text x="42%" y="27%" fill="#ef4444" fontSize="9" fontWeight="bold">NG: Micro-Scratch Defect</text>
                        </g>
                    ))}

                    {nodes?.filter(n => n.type === 'dpm_enhancer').map(n => (
                        <g key={n.id}>
                            <rect x="25%" y="65%" width="50%" height="25%" fill="rgba(168, 85, 247, 0.1)" stroke="#a855f7" strokeWidth="1.5" strokeDasharray="4 4" />
                            <text x="25%" y="63%" fill="#a855f7" fontSize="9" fontWeight="bold">DPM Enhancer (Active)</text>
                        </g>
                    ))}

                    {nodes?.filter(n => n.type === 'polar_unwrap').map(n => (
                        <g key={n.id}>
                            <circle cx="50%" cy="50%" r="30%" fill="none" stroke="#a855f7" strokeWidth="1.5" strokeDasharray="5 5" />
                            <circle cx="50%" cy="50%" r="10%" fill="none" stroke="#a855f7" strokeWidth="1.5" strokeDasharray="5 5" />
                            <path d="M 50,15 A 35,35 0 0,1 85,50" fill="none" stroke="#a855f7" strokeWidth="2" strokeDasharray="2 2" />
                            <text x="50%" y="87%" fill="#a855f7" fontSize="9" fontWeight="bold" textAnchor="middle">Polar Unwrapper Zone ({n.name})</text>
                        </g>
                    ))}

                    {nodes?.filter(n => n.type === 'searchmax').map(n => (
                        <g key={n.id}>
                            <rect x="48%" y="38%" width="14%" height="14%" fill="rgba(6, 182, 212, 0.15)" stroke="#06b6d4" strokeWidth="2" />
                            <rect x="49%" y="39%" width="12%" height="12%" fill="none" stroke="#f43f5e" strokeWidth="1" />
                            <text x="48%" y="35%" fill="#06b6d4" fontSize="9" fontWeight="bold">SearchMax: 95.8% ({n.name})</text>
                        </g>
                    ))}

                    {nodes?.filter(n => n.type === 'golden_template').map(n => (
                        <g key={n.id} opacity="0.8">
                            <circle cx="50%" cy="50%" r="33%" fill="none" stroke="#10b981" strokeWidth="1" strokeDasharray="2 2" />
                            <circle cx="50%" cy="50%" r="10%" fill="none" stroke="#10b981" strokeWidth="1" strokeDasharray="2 2" />
                            {[0, 90, 180, 270].map(deg => {
                                const rad = (deg * Math.PI) / 180;
                                const cx = 50 + 22 * Math.cos(rad);
                                const cy = 50 + 22 * Math.sin(rad);
                                return <circle key={deg} cx={`${cx}%`} cy={`${cy}%`} r="3%" fill="none" stroke="#10b981" strokeWidth="1" strokeDasharray="2 2" />;
                            })}
                            <text x="50%" y="13%" fill="#10b981" fontSize="9" fontWeight="bold" textAnchor="middle">CAD Overlay: OK ({n.params.cadFile})</text>
                        </g>
                    ))}

                    {nodes?.filter(n => n.type === 'vidi_ai').map(n => {
                        const mode = n.params.modelMode || 'Red-Analyze (Anomaly)';
                        return (
                            <g key={n.id}>
                                {mode === 'Green-Classify (Class)' ? (
                                    <g>
                                        <rect x="2%" y="12%" width="38%" height="10%" rx="4" fill="rgba(16, 185, 129, 0.85)" />
                                        <text x="4%" y="18%" fill="white" fontSize="8" fontWeight="800">CLASS: FLANGE_TYPE_A (99.4%)</text>
                                    </g>
                                ) : (
                                    <g>
                                        <ellipse cx="65%" cy="35%" rx="6%" ry="4%" fill="rgba(239, 68, 68, 0.4)" stroke="#ef4444" strokeWidth="1" />
                                        <ellipse cx="63%" cy="36%" rx="3%" ry="2%" fill="rgba(245, 158, 11, 0.5)" />
                                        <text x="73%" y="34%" fill="#ef4444" fontSize="9" fontWeight="bold">ViDi Anomaly: NG</text>
                                    </g>
                                )}
                            </g>
                        );
                    })}

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
                            {roiDraft.type === 'rotated_rect' && (
                                <rect
                                    x={`${Math.min(roiDraft.startX, roiDraft.endX)}%`}
                                    y={`${Math.min(roiDraft.startY, roiDraft.endY)}%`}
                                    width={`${Math.abs(roiDraft.endX - roiDraft.startX)}%`}
                                    height={`${Math.abs(roiDraft.endY - roiDraft.startY)}%`}
                                    fill="rgba(59, 130, 246, 0.15)" stroke="#3b82f6" strokeWidth="2" strokeDasharray="6 3"
                                    transform={`rotate(25, ${(roiDraft.startX + roiDraft.endX)/2} ${(roiDraft.startY + roiDraft.endY)/2})`}
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
                            {roiDraft.type === 'annulus' && (
                                <g>
                                    <circle
                                        cx={`${(roiDraft.startX + roiDraft.endX) / 2}%`}
                                        cy={`${(roiDraft.startY + roiDraft.endY) / 2}%`}
                                        r={`${Math.sqrt(Math.pow(roiDraft.endX - roiDraft.startX, 2) + Math.pow(roiDraft.endY - roiDraft.startY, 2)) / 2}%`}
                                        fill="rgba(59, 130, 246, 0.15)" stroke="#3b82f6" strokeWidth="2" strokeDasharray="6 3"
                                    />
                                    <circle
                                        cx={`${(roiDraft.startX + roiDraft.endX) / 2}%`}
                                        cy={`${(roiDraft.startY + roiDraft.endY) / 2}%`}
                                        r={`${(Math.sqrt(Math.pow(roiDraft.endX - roiDraft.startX, 2) + Math.pow(roiDraft.endY - roiDraft.startY, 2)) / 2) * 0.5}%`}
                                        fill="none" stroke="#3b82f6" strokeWidth="1" strokeDasharray="3 3"
                                    />
                                </g>
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

            {/* Filmstrip Frame Buffer */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '8px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.62rem', fontWeight: 800, color: '#475569', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        🎞️ Filmstrip Buffer ({filmstripFrames?.length || 0}/10)
                    </span>
                    <div style={{ display: 'flex', gap: '4px' }}>
                        <button 
                            onClick={onAddFilmstripFrame} 
                            title="Record Current Frame" 
                            style={{ padding: '2px 6px', fontSize: '0.55rem', fontWeight: 700, backgroundColor: '#fecaca', color: '#dc2626', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                        >
                            🔴 Rec
                        </button>
                        <button 
                            onClick={onClearFilmstrip} 
                            title="Clear Buffer" 
                            style={{ padding: '2px 6px', fontSize: '0.55rem', fontWeight: 700, backgroundColor: '#e2e8f0', color: '#475569', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                        >
                            Clear
                        </button>
                    </div>
                </div>
                {filmstripFrames && filmstripFrames.length > 0 ? (
                    <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
                        {filmstripFrames.map((frame, idx) => (
                            <div 
                                key={idx}
                                onClick={() => onSelectFilmstripFrame(idx)}
                                style={{
                                    position: 'relative', width: '56px', height: '42px',
                                    borderRadius: '4px', overflow: 'hidden', cursor: 'pointer',
                                    border: activeFilmstripIndex === idx ? '2px solid #3b82f6' : '1px solid #cbd5e1',
                                    backgroundColor: '#0f172a', flexShrink: 0,
                                }}
                            >
                                <img src={frame} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={`Frame ${idx+1}`} />
                                <span style={{ position: 'absolute', bottom: 1, right: 1, fontSize: '0.45rem', color: 'white', backgroundColor: 'rgba(0,0,0,0.6)', padding: '0.5px 2px', borderRadius: '1.5px' }}>
                                    #{idx+1}
                                </span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{ fontSize: '0.58rem', color: '#94a3b8', textAlign: 'center', padding: '4px' }}>
                        Buffer empty. Run pipeline to capture frame logs.
                    </div>
                )}
                {filmstripFrames && filmstripFrames.length > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', borderTop: '1px solid #f1f5f9', paddingTop: '4px' }}>
                        <button 
                            onClick={onPlayPauseFilmstrip} 
                            style={{ padding: '3px 8px', fontSize: '0.58rem', fontWeight: 700, backgroundColor: isFilmstripPlaying ? '#fef3c7' : '#dbeafe', color: isFilmstripPlaying ? '#d97706' : '#2563eb', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                        >
                            {isFilmstripPlaying ? '⏸️ Pause' : '▶️ Play Filmstrip'}
                        </button>
                        <button 
                            onClick={() => onSelectFilmstripFrame((activeFilmstripIndex - 1 + filmstripFrames.length) % filmstripFrames.length)} 
                            style={{ padding: '3px 6px', fontSize: '0.58rem', backgroundColor: 'transparent', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer' }}
                        >
                            ◀
                        </button>
                        <button 
                            onClick={() => onSelectFilmstripFrame((activeFilmstripIndex + 1) % filmstripFrames.length)} 
                            style={{ padding: '3px 6px', fontSize: '0.58rem', backgroundColor: 'transparent', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer' }}
                        >
                            ▶
                        </button>
                    </div>
                )}
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

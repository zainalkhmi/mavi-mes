import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Html, Line } from '@react-three/drei';
import * as THREE from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// ─────────────────────────────────────────
// CUSTOM HOOK: LOAD & DECODE 3D MODEL
// ─────────────────────────────────────────
export function useCADModel(dataUrl, fileType) {
    const [model, setModel] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!dataUrl) {
            setModel(null);
            return;
        }

        setLoading(true);
        setError(null);

        const type = (fileType || '').toUpperCase();
        let loader;

        if (type === 'STL') {
            loader = new STLLoader();
        } else if (type === 'OBJ') {
            loader = new OBJLoader();
        } else if (type === 'GLTF' || type === 'GLB') {
            loader = new GLTFLoader();
        } else {
            // Inference based on string signature
            if (dataUrl.includes('model/stl') || dataUrl.includes('octet-stream') || dataUrl.toLowerCase().includes('.stl')) {
                loader = new STLLoader();
            } else if (dataUrl.toLowerCase().includes('.obj')) {
                loader = new OBJLoader();
            } else {
                loader = new GLTFLoader();
            }
        }

        try {
            loader.load(
                dataUrl,
                (loaded) => {
                    const group = new THREE.Group();
                    if (type === 'STL' || loaded instanceof THREE.BufferGeometry) {
                        // STL Loader returns a BufferGeometry
                        loaded.center();
                        loaded.computeBoundingSphere();
                        loaded.computeVertexNormals();

                        const material = new THREE.MeshStandardMaterial({
                            color: 0x94a3b8,
                            metalness: 0.6,
                            roughness: 0.35,
                        });
                        const mesh = new THREE.Mesh(loaded, material);
                        group.add(mesh);
                    } else if (type === 'OBJ') {
                        // OBJ Loader returns a Group/Object3D
                        const box = new THREE.Box3().setFromObject(loaded);
                        const center = new THREE.Vector3();
                        box.getCenter(center);
                        loaded.position.sub(center);

                        loaded.traverse((child) => {
                            if (child.isMesh) {
                                child.material = new THREE.MeshStandardMaterial({
                                    color: 0x94a3b8,
                                    metalness: 0.6,
                                    roughness: 0.35,
                                });
                            }
                        });
                        group.add(loaded);
                    } else {
                        // GLTF/GLB returns scene
                        const scene = loaded.scene || loaded;
                        const box = new THREE.Box3().setFromObject(scene);
                        const center = new THREE.Vector3();
                        box.getCenter(center);
                        scene.position.sub(center);
                        group.add(scene);
                    }

                    // Auto-scale to fit nice viewport (max dimension of 3.0 units)
                    const box = new THREE.Box3().setFromObject(group);
                    const size = box.getSize(new THREE.Vector3());
                    const maxDim = Math.max(size.x, size.y, size.z);
                    if (maxDim > 0) {
                        const scaleFactor = 3.0 / maxDim;
                        group.scale.set(scaleFactor, scaleFactor, scaleFactor);
                    }

                    setModel(group);
                    setLoading(false);
                },
                undefined,
                (err) => {
                    console.error('Error loading 3D model:', err);
                    setError(err.message || 'Gagal memproses file model 3D.');
                    setLoading(false);
                }
            );
        } catch (e) {
            console.error('Loader exception:', e);
            setError(e.message || 'Gagal menginisialisasi CAD loader.');
            setLoading(false);
        }
    }, [dataUrl, fileType]);

    return { model, loading, error };
}

// ─────────────────────────────────────────
// FALLBACK PREMIUM 3D MECHANICAL MODEL
// ─────────────────────────────────────────
export function FallbackModel() {
    return (
        <group>
            {/* Base Flange Disk */}
            <mesh castShadow receiveShadow>
                <cylinderGeometry args={[2.2, 2.2, 0.4, 64]} />
                <meshStandardMaterial color="#64748b" metalness={0.65} roughness={0.3} />
            </mesh>
            {/* Raised Flange Neck */}
            <mesh position={[0, 0.5, 0]} castShadow>
                <cylinderGeometry args={[1.3, 1.4, 0.6, 64]} />
                <meshStandardMaterial color="#475569" metalness={0.7} roughness={0.25} />
            </mesh>
            {/* Top Connector Lip */}
            <mesh position={[0, 0.9, 0]} castShadow>
                <cylinderGeometry args={[1.5, 1.5, 0.2, 64]} />
                <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.2} />
            </mesh>
            {/* Inner Center Hollow Bore */}
            <mesh position={[0, 0.4, 0]}>
                <cylinderGeometry args={[0.7, 0.7, 1.3, 64]} />
                <meshBasicMaterial color="#090d16" />
            </mesh>
            {/* Flange Bolt Holes Visualizer */}
            {[0, 60, 120, 180, 240, 300].map((angle, idx) => {
                const rad = (angle * Math.PI) / 180;
                const r = 1.7;
                return (
                    <mesh key={idx} position={[r * Math.cos(rad), 0, r * Math.sin(rad)]}>
                        <cylinderGeometry args={[0.15, 0.15, 0.42, 16]} />
                        <meshBasicMaterial color="#090d16" />
                    </mesh>
                );
            })}
        </group>
    );
}

// ─────────────────────────────────────────
// MOCK DATA FOR FALLBACK MODEL Blueprints
// ─────────────────────────────────────────
const MOCK_FALLBACK_DIMS = [
    {
        id: 'dim_fallback_dia',
        label: 'Outer Diameter',
        spec: '80.0', tolMin: 79.8, tolMax: 80.2,
        variable: 'Meas_Diameter', unit: 'mm',
        category: 'diameter', measureType: 'diameter', indicatorType: 'radial', gdt_symbol: '⌀',
        x1: 2.2, y1: 0, z1: 0,
        lx: 3.2, ly: 0.6, lz: 0
    },
    {
        id: 'dim_fallback_bore',
        label: 'Center Bore',
        spec: '25.0', tolMin: 24.9, tolMax: 25.1,
        variable: 'Meas_Bore', unit: 'mm',
        category: 'diameter', measureType: 'diameter', indicatorType: 'radial', gdt_symbol: '⌀',
        x1: 0.7, y1: 0.9, z1: 0,
        lx: 0.0, ly: 1.8, lz: 0.0
    },
    {
        id: 'dim_fallback_height',
        label: 'Overall Height',
        spec: '25.0', tolMin: 24.5, tolMax: 25.5,
        variable: 'Meas_Height', unit: 'mm',
        category: 'dimension', measureType: 'linear_vertical', indicatorType: 'vertical', gdt_symbol: '',
        x1: 1.3, y1: 0.8, z1: 0,
        lx: 2.2, ly: 1.2, lz: 0.5
    },
    {
        id: 'dim_fallback_weld',
        label: 'Weld Seam',
        spec: 'OK', tolMin: 1, tolMax: 1,
        variable: 'Visual_Weld', unit: '',
        category: 'visual', measureType: 'visual', indicatorType: 'callout', gdt_symbol: '⚡',
        x1: 0, y1: 0.8, z1: 1.3,
        lx: -1.5, ly: 1.5, lz: 1.5
    },
    {
        id: 'dim_fallback_screws',
        label: 'Flange Bolts',
        spec: 'OK', tolMin: 1, tolMax: 1,
        variable: 'Visual_Screws', unit: '',
        category: 'visual', measureType: 'visual', indicatorType: 'callout', gdt_symbol: '🔩',
        x1: 1.7 * Math.cos(0), y1: 0, z1: 1.7 * Math.sin(0),
        lx: 2.0, ly: -0.8, lz: 1.8
    }
];

// ─────────────────────────────────────────
// 3D VIEWER EDITOR COMPONENT
// ─────────────────────────────────────────
export function CADViewer3DEditor({ drawing, dimensions, activeDimId, onAddDimension, onSelectDimension }) {
    const { model, loading, error } = useCADModel(drawing?.dataUrl || drawing?.data_url, drawing?.fileType);

    const lastClickTimeRef = useRef(0);

    const handlePointerDown = (e) => {
        const now = Date.now();
        const diff = now - lastClickTimeRef.current;
        lastClickTimeRef.current = now;

        if (diff < 300) {
            e.stopPropagation();
            const pt = e.point;
            if (pt && onAddDimension) {
                // Round to 3 decimals for storage cleanliness
                onAddDimension(
                    parseFloat(pt.x.toFixed(3)),
                    parseFloat(pt.y.toFixed(3)),
                    parseFloat(pt.z.toFixed(3))
                );
            }
        }
    };

    return (
        <div style={{ width: '100%', height: '100%', position: 'relative', backgroundColor: '#0f172a', borderRadius: '8px', overflow: 'hidden' }}>
            {loading && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(15, 23, 42, 0.8)', color: 'white', zIndex: 10 }}>
                    <div style={{ border: '4px solid #f3f3f3', borderTop: '4px solid #3b82f6', borderRadius: '50%', width: '30px', height: '30px', animation: 'spin 1s linear infinite' }} />
                    <span style={{ marginTop: '10px', fontSize: '0.8rem' }}>Memuat Model 3D...</span>
                </div>
            )}

            {error && (
                <div style={{ position: 'absolute', top: '10px', left: '10px', right: '10px', display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'rgba(239, 68, 68, 0.9)', color: 'white', padding: '8px 12px', borderRadius: '6px', fontSize: '0.7rem', zIndex: 10 }}>
                    <span>⚠️ {error}. Menampilkan model generic.</span>
                </div>
            )}

            <Canvas camera={{ position: [4, 4, 4], fov: 45 }}>
                <ambientLight intensity={0.8} />
                <pointLight position={[10, 10, 10]} intensity={1.5} />
                <directionalLight position={[-5, 5, -5]} intensity={0.6} />

                {model ? (
                    <group onPointerDown={handlePointerDown}>
                        <primitive object={model} />
                    </group>
                ) : (
                    <group onPointerDown={handlePointerDown}>
                        <FallbackModel />
                    </group>
                )}

                {/* Render Dimension Anchors & Callout Balloons */}
                {dimensions.map((dim) => {
                    const isActive = dim.id === activeDimId;
                    let x1 = dim.x1 ?? 0;
                    let y1 = dim.y1 ?? 0;
                    let z1 = dim.z1 ?? 0;
                    let lx = dim.lx ?? x1;
                    let ly = dim.ly ?? y1;
                    let lz = dim.lz ?? z1;

                    if (drawing?.id === 'dwg_product_checking') {
                        if (dim.id === 'linear_2d') {
                            x1 = -1.5; y1 = -0.2; z1 = 0;
                            lx = -2.2; ly = 0.5; lz = 0;
                        } else if (dim.id === 'pdf_height') {
                            x1 = 0; y1 = 0.5; z1 = 0;
                            lx = -0.5; ly = 1.6; lz = 0;
                        } else if (dim.id === 'balloon_mark') {
                            x1 = 1.7 * Math.cos(Math.PI/4); y1 = 0.2; z1 = 1.7 * Math.sin(Math.PI/4);
                            lx = 2.2 * Math.cos(Math.PI/4); ly = 1.0; lz = 2.2 * Math.sin(Math.PI/4);
                        } else if (dim.id === 'cad_angle') {
                            x1 = 0; y1 = 0.9; z1 = 0;
                            lx = 1.0; ly = 2.0; lz = 0;
                        } else if (dim.id === 'qc_check') {
                            x1 = 1.7 * Math.cos(Math.PI); y1 = -0.2; z1 = 1.7 * Math.sin(Math.PI);
                            lx = 2.5 * Math.cos(Math.PI); ly = 0.8; lz = 2.5 * Math.sin(Math.PI);
                        } else if (dim.id === 'trigger_check') {
                            x1 = 1.7 * Math.cos(-Math.PI/4); y1 = -0.2; z1 = 1.7 * Math.sin(-Math.PI/4);
                            lx = 2.5 * Math.cos(-Math.PI/4); ly = 0.8; lz = 2.5 * Math.sin(-Math.PI/4);
                        } else if (dim.id === 'camera_check') {
                            x1 = 1.7 * Math.cos(-Math.PI/2); y1 = -0.2; z1 = 1.7 * Math.sin(-Math.PI/2);
                            lx = 2.5 * Math.cos(-Math.PI/2); ly = 0.8; lz = 2.5 * Math.sin(-Math.PI/2);
                        }
                    }

                    return (
                        <group key={dim.id}>
                            {/* Marker dot at contact point */}
                            <mesh position={[x1, y1, z1]}>
                                <sphereGeometry args={[0.04, 16, 16]} />
                                <meshBasicMaterial color={isActive ? '#3b82f6' : '#94a3b8'} />
                            </mesh>

                            {/* Guideline connecting contact point to balloon */}
                            {(x1 !== lx || y1 !== ly || z1 !== lz) && (
                                <Line
                                    points={[[x1, y1, z1], [lx, ly, lz]]}
                                    color={isActive ? '#2563eb' : '#64748b'}
                                    lineWidth={dim.lineWidth !== undefined ? (isActive ? dim.lineWidth + 1.0 : dim.lineWidth) : (isActive ? 2.5 : 1.5)}
                                    dashed={!isActive}
                                    dashSize={0.15}
                                    gapSize={0.08}
                                />
                            )}

                            {/* Annotations Balloon */}
                            <Html position={[lx, ly, lz]} distanceFactor={7} center>
                                <div
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (onSelectDimension) onSelectDimension(dim.id);
                                    }}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '5px',
                                        backgroundColor: isActive ? '#2563eb' : '#1e293b',
                                        color: '#ffffff',
                                        padding: '4px 8px',
                                        borderRadius: '6px',
                                        border: `2px solid ${isActive ? '#ffffff' : '#475569'}`,
                                        fontSize: '0.62rem',
                                        fontWeight: 'bold',
                                        cursor: 'pointer',
                                        boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
                                        whiteSpace: 'nowrap',
                                        userSelect: 'none',
                                        transform: 'translate(-50%, -50%)',
                                        transition: 'all 0.15s ease'
                                    }}
                                >
                                    <span style={{ display: 'inline-block', backgroundColor: '#0f172a', padding: '1px 4px', borderRadius: '3px', fontSize: '0.55rem' }}>
                                        {dim.gdt_symbol || '📍'}
                                    </span>
                                    <span>{dim.label || 'Dim'}</span>
                                    <span style={{ color: '#93c5fd' }}>{dim.spec}{dim.unit}</span>
                                </div>
                            </Html>
                        </group>
                    );
                })}

                <OrbitControls makeDefault />
            </Canvas>

            <div style={{ position: 'absolute', bottom: '8px', left: '8px', backgroundColor: 'rgba(15, 23, 42, 0.75)', padding: '5px 8px', borderRadius: '4px', fontSize: '0.62rem', color: '#cbd5e1', pointerEvents: 'none', border: '1px solid #334155' }}>
                🖱️ Rotate: Drag | ✋ Pan: Right-click Drag | 📍 Place tag: Double-click model
            </div>
        </div>
    );
}

// ─────────────────────────────────────────
// 3D VIEWER RUNTIME (LIVE PLAYER) COMPONENT
// ─────────────────────────────────────────
export function CADViewer3D({ fileUrl, appVariables, setAppVariables }) {
    const drawings = (() => {
        try {
            const saved = localStorage.getItem('mavi_drawings');
            let parsed = saved ? JSON.parse(saved) : [];
            if (!Array.isArray(parsed)) parsed = [];
            
            if (!parsed.some(d => d.id === 'dwg_product_checking')) {
                const templateDwg = {
                    id: 'dwg_product_checking',
                    name: 'Product Checking Template',
                    fileName: 'product-checking-template.pdf',
                    fileType: 'PDF',
                    uploadedAt: '2026-06-26T12:00:00Z',
                    dimensions: [
                        { id: 'linear_2d', label: '2D Length Dimension', spec: '50.0', tolMin: 49.8, tolMax: 50.2, variable: 'Linear_2D_Val', unit: 'mm', category: 'dimension', measureType: 'linear_horizontal', indicatorType: 'horizontal', gdt_symbol: '', x1: 50, y1: 300, x2: 250, y2: 300, lx: 150, ly: 320, triggers: [] },
                        { id: 'pdf_height', label: 'PDF Thickness Check', spec: '12.0', tolMin: 11.8, tolMax: 12.2, variable: 'PDF_Thickness_Val', unit: 'mm', category: 'dimension', measureType: 'linear_vertical', indicatorType: 'vertical', gdt_symbol: '', x1: 400, y1: 100, x2: 400, y2: 200, lx: 420, ly: 150, triggers: [] },
                        { id: 'balloon_mark', label: 'Balloon Marker', spec: '10.0', tolMin: 9.5, tolMax: 10.5, variable: 'Balloon_Marker', unit: 'mm', category: 'diameter', measureType: 'diameter', indicatorType: 'radial', gdt_symbol: '⌀', x1: 200, y1: 200, lx: 250, ly: 200, triggers: [] },
                        { id: 'cad_angle', label: '3D Included Angle', spec: '90.0', tolMin: 89.5, tolMax: 90.5, variable: 'CAD_Angle_Val', unit: '°', category: 'angle', measureType: 'angle', indicatorType: 'arc', gdt_symbol: '∠', x1: 350, y1: 250, x2: 450, y2: 350, lx: 470, ly: 280, triggers: [] },
                        { id: 'qc_check', label: 'QC Check Status', spec: 'PASS', tolMin: 1, tolMax: 1, variable: 'QC_Check_Status', unit: '', category: 'custom', measureType: 'custom', indicatorType: 'callout', gdt_symbol: 'QC', x1: 100, y1: 100, lx: 150, ly: 100, triggers: [] },
                        { id: 'trigger_check', label: 'Trigger Check', spec: '1.0', tolMin: 1.0, tolMax: 1.0, variable: 'Trigger_Output', unit: '', category: 'custom', measureType: 'custom', indicatorType: 'callout', gdt_symbol: '⚡', x1: 300, y1: 150, lx: 350, ly: 150, triggers: [
                            { id: 'trig_p1', type: 'STOP_MACHINE', condition: 'ON_FAIL', priority: 'critical', message: 'Trigger failed! Stopping machine.', enabled: true }
                        ] },
                        { id: 'camera_check', label: 'Camera/Vision Check', spec: '24.0', tolMin: 23.5, tolMax: 24.5, variable: 'Vision_Camera_Val', unit: 'fps', category: 'roughness', measureType: 'surface_roughness', indicatorType: 'callout', gdt_symbol: 'Ra', x1: 150, y1: 250, lx: 200, ly: 270, triggers: [] }
                    ]
                };
                parsed.push(templateDwg);
                try {
                    localStorage.setItem('mavi_drawings', JSON.stringify(parsed));
                } catch (e) {
                    console.warn('[Storage Quota] Failed to write drawings list in CADViewer3D:', e);
                }
            }
            return parsed;
        } catch {
            return [];
        }
    })();
    const selectedDwg = drawings.find(d => d.id === fileUrl || d.fileName === fileUrl || d.name === fileUrl)
        || drawings.find(d => ['STL', 'OBJ', 'GLTF', 'GLB'].includes(d.fileType));

    const dimensions = selectedDwg?.dimensions || MOCK_FALLBACK_DIMS;
    const activeDimKey = appVariables.find(v => v.name === 'Active_Dimension_Key')?.value || '';

    const { model, loading, error } = useCADModel(selectedDwg?.dataUrl || selectedDwg?.data_url, selectedDwg?.fileType);

    const getValidationStatus = (dim) => {
        if (!dim || !dim.variable) return 'PENDING';
        const variableVal = appVariables.find(v => v.name === dim.variable)?.value;
        const val = parseFloat(variableVal);
        if (isNaN(val) || val === 0) return 'PENDING';
        return (val >= dim.tolMin && val <= dim.tolMax) ? 'PASS' : 'FAIL';
    };

    const getStatusColor = (status, isActive) => {
        if (status === 'PASS') return '#22c55e'; // Green
        if (status === 'FAIL') return '#ef4444'; // Red
        return isActive ? '#2563eb' : '#475569'; // Blue active or Gray
    };

    const handleSelectDim = (dim) => {
        if (!dim || !dim.variable) return;
        setAppVariables(prev => prev.map(v => 
            v.name === 'Active_Dimension_Key' 
                ? { ...v, value: dim.variable } 
                : v
        ));
    };

    return (
        <div style={{ width: '100%', height: '100%', position: 'relative', backgroundColor: '#090d16', borderRadius: '12px', overflow: 'hidden', border: '1px solid #1e293b' }}>
            {loading && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(9, 13, 22, 0.8)', color: 'white', zIndex: 10 }}>
                    <div style={{ border: '4px solid #1e293b', borderTop: '4px solid #10b981', borderRadius: '50%', width: '30px', height: '30px', animation: 'spin 1s linear infinite' }} />
                    <span style={{ marginTop: '10px', fontSize: '0.75rem', color: '#94a3b8' }}>Memuat Model CAD 3D Twin...</span>
                </div>
            )}

            <Canvas camera={{ position: [3.5, 3.5, 3.5], fov: 45 }}>
                <ambientLight intensity={0.7} />
                <pointLight position={[8, 8, 8]} intensity={1.5} />
                <directionalLight position={[-8, 5, -8]} intensity={0.5} />

                {model ? (
                    <primitive object={model} />
                ) : (
                    <FallbackModel />
                )}

                {/* Render Live Status Balloons */}
                {dimensions.map((dim) => {
                    const status = getValidationStatus(dim);
                    const isSelected = activeDimKey === dim.variable;
                    const color = getStatusColor(status, isSelected);

                    let x1 = dim.x1 ?? 0;
                    let y1 = dim.y1 ?? 0;
                    let z1 = dim.z1 ?? 0;
                    let lx = dim.lx ?? x1;
                    let ly = dim.ly ?? y1;
                    let lz = dim.lz ?? z1;

                    if (selectedDwg?.id === 'dwg_product_checking' || fileUrl === 'dwg_product_checking') {
                        if (dim.id === 'linear_2d') {
                            x1 = -1.5; y1 = -0.2; z1 = 0;
                            lx = -2.2; ly = 0.5; lz = 0;
                        } else if (dim.id === 'pdf_height') {
                            x1 = 0; y1 = 0.5; z1 = 0;
                            lx = -0.5; ly = 1.6; lz = 0;
                        } else if (dim.id === 'balloon_mark') {
                            x1 = 1.7 * Math.cos(Math.PI/4); y1 = 0.2; z1 = 1.7 * Math.sin(Math.PI/4);
                            lx = 2.2 * Math.cos(Math.PI/4); ly = 1.0; lz = 2.2 * Math.sin(Math.PI/4);
                        } else if (dim.id === 'cad_angle') {
                            x1 = 0; y1 = 0.9; z1 = 0;
                            lx = 1.0; ly = 2.0; lz = 0;
                        } else if (dim.id === 'qc_check') {
                            x1 = 1.7 * Math.cos(Math.PI); y1 = -0.2; z1 = 1.7 * Math.sin(Math.PI);
                            lx = 2.5 * Math.cos(Math.PI); ly = 0.8; lz = 2.5 * Math.sin(Math.PI);
                        } else if (dim.id === 'trigger_check') {
                            x1 = 1.7 * Math.cos(-Math.PI/4); y1 = -0.2; z1 = 1.7 * Math.sin(-Math.PI/4);
                            lx = 2.5 * Math.cos(-Math.PI/4); ly = 0.8; lz = 2.5 * Math.sin(-Math.PI/4);
                        } else if (dim.id === 'camera_check') {
                            x1 = 1.7 * Math.cos(-Math.PI/2); y1 = -0.2; z1 = 1.7 * Math.sin(-Math.PI/2);
                            lx = 2.5 * Math.cos(-Math.PI/2); ly = 0.8; lz = 2.5 * Math.sin(-Math.PI/2);
                        }
                    }

                    return (
                        <group key={dim.id}>
                            {/* Contact point dot */}
                            <mesh position={[x1, y1, z1]}>
                                <sphereGeometry args={[0.04, 16, 16]} />
                                <meshBasicMaterial color={color} />
                            </mesh>

                            {/* Guideline to balloon */}
                            {(x1 !== lx || y1 !== ly || z1 !== lz) && (
                                <Line
                                    points={[[x1, y1, z1], [lx, ly, lz]]}
                                    color={color}
                                    lineWidth={dim.lineWidth !== undefined ? (isSelected ? dim.lineWidth + 1.0 : dim.lineWidth) : (isSelected ? 2.5 : 1.5)}
                                    dashed={!isSelected}
                                    dashSize={0.15}
                                    gapSize={0.08}
                                />
                            )}

                            {/* HTML Balloon Overlay */}
                            <Html position={[lx, ly, lz]} distanceFactor={7} center>
                                <div
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleSelectDim(dim);
                                    }}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        backgroundColor: color,
                                        color: '#ffffff',
                                        padding: '5px 9px',
                                        borderRadius: '20px',
                                        border: `2px solid ${isSelected ? '#ffffff' : 'transparent'}`,
                                        fontSize: '0.62rem',
                                        fontWeight: 'bold',
                                        cursor: 'pointer',
                                        boxShadow: '0 4px 10px rgba(0,0,0,0.4)',
                                        whiteSpace: 'nowrap',
                                        userSelect: 'none',
                                        transform: 'translate(-50%, -50%)',
                                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                        animation: status === 'FAIL' ? 'pulse-fail 1.5s infinite' : 'none'
                                    }}
                                >
                                    <span style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: '12px',
                                        height: '12px',
                                        backgroundColor: 'rgba(0,0,0,0.25)',
                                        borderRadius: '50%',
                                        fontSize: '0.55rem'
                                    }}>
                                        {status === 'PASS' && '✓'}
                                        {status === 'FAIL' && '✗'}
                                        {status === 'PENDING' && '?'}
                                    </span>
                                    <span>{dim.label}</span>
                                    <span style={{ opacity: 0.9, backgroundColor: 'rgba(0,0,0,0.15)', padding: '1px 5px', borderRadius: '10px' }}>
                                        {appVariables.find(v => v.name === dim.variable)?.value || '--'}/{dim.spec} {dim.unit}
                                    </span>
                                </div>
                            </Html>
                        </group>
                    );
                })}

                <OrbitControls makeDefault />
            </Canvas>

            {/* Animation style tag for flashing FAIL status balloons */}
            <style>{`
                @keyframes pulse-fail {
                    0% { transform: translate(-50%, -50%) scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
                    70% { transform: translate(-50%, -50%) scale(1.05); box-shadow: 0 0 0 8px rgba(239, 68, 68, 0); }
                    100% { transform: translate(-50%, -50%) scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
                }
            `}</style>

            <div style={{ position: 'absolute', bottom: '8px', left: '8px', right: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', pointerEvents: 'none' }}>
                <span style={{ backgroundColor: 'rgba(15, 23, 42, 0.8)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.6rem', color: '#94a3b8', border: '1px solid #1e293b' }}>
                    🧊 Interactive CAD Digital Twin
                </span>
                <div style={{ display: 'flex', gap: '4px' }}>
                    <span style={{ backgroundColor: 'rgba(34, 197, 94, 0.95)', padding: '2px 6px', borderRadius: '3px', fontSize: '0.55rem', color: 'white', fontWeight: 'bold' }}>✓ PASS</span>
                    <span style={{ backgroundColor: 'rgba(239, 68, 68, 0.95)', padding: '2px 6px', borderRadius: '3px', fontSize: '0.55rem', color: 'white', fontWeight: 'bold' }}>✗ FAIL</span>
                    <span style={{ backgroundColor: 'rgba(71, 85, 105, 0.95)', padding: '2px 6px', borderRadius: '3px', fontSize: '0.55rem', color: 'white', fontWeight: 'bold' }}>? PENDING</span>
                </div>
            </div>
        </div>
    );
}

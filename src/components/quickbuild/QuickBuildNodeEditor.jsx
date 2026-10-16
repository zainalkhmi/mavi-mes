import React, { useState } from 'react';
import { Trash2, HelpCircle, Link, Sparkles, Cpu, CheckCircle2, AlertTriangle, Play, RefreshCw, Eye, EyeOff, Key, Bot, Cloud, Database } from 'lucide-react';
import { NODE_TYPES } from './quickbuildToolTypes';
import toast from 'react-hot-toast';
import {
    GOOGLE_VISION_MODELS,
    runGeminiVisionInspection,
    runTeachableMachineClassifier,
    runGoogleCloudVisionOcr,
    syncToGoogleSheets
} from '../../utils/googleVisionService';

/**
 * QuickBuildNodeEditor — Full parameter editor for all tool types including Google Cloud & Edge AI.
 */
export default function QuickBuildNodeEditor({
    selectedNode,
    nodes,
    setNodes,
    onDeleteNode,
    drawingsList = [],
    appVariables = [],
    onTrainOcrFont = () => { },
    cameraConfigs = [],
    onNavigateToCameraSettings = () => { },
}) {
    if (!selectedNode) {
        return (
            <div style={panelStyle}>
                <div style={headerStyle}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 800 }}>Block Settings</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, color: '#94a3b8', textAlign: 'center', padding: '20px' }}>
                    <HelpCircle size={32} color="#cbd5e1" style={{ marginBottom: '10px' }} />
                    <span style={{ fontSize: '0.78rem', fontWeight: 700 }}>No Node Selected</span>
                    <p style={{ fontSize: '0.68rem', color: '#94a3b8', margin: '4px 0 0 0' }}>Click on a block on the flowchart to edit its settings.</p>
                </div>
            </div>
        );
    }

    const typeInfo = NODE_TYPES[selectedNode.type] || {};
    const [isTestingAi, setIsTestingAi] = useState(false);
    const [isTestingTeachable, setIsTestingTeachable] = useState(false);
    const [isTestingOcr, setIsTestingOcr] = useState(false);
    const [isTestingLogger, setIsTestingLogger] = useState(false);
    const [showApiKey, setShowApiKey] = useState(false);

    // Google Vertex AI & Gemini Multimodal Execution
    const handleTestVertexAi = async () => {
        setIsTestingAi(true);
        const { apiKey, model, taskMode, inspectionPrompt, confidenceThreshold } = selectedNode.params || {};

        try {
            const res = await runGeminiVisionInspection({
                apiKey,
                model: model || 'gemini-2.0-flash',
                taskMode: taskMode || 'Defect Detection',
                prompt: inspectionPrompt || '',
                confidenceThreshold: confidenceThreshold || 85
            });

            const isNg = res.verdict === 'FAIL';
            const resultMsg = `Vertex [${res.model}]: ${isNg ? 'NG ' + (res.detectedLabels[0] || 'Defect') : 'PASS'} [${res.confidence}%]`;

            setNodes(prev => prev.map(n => {
                if (n.id === selectedNode.id) {
                    return {
                        ...n,
                        status: isNg ? 'failed' : 'success',
                        value: resultMsg,
                        lastAiInference: {
                            model: res.model,
                            task: taskMode || 'Defect Detection',
                            latencyMs: res.latencyMs,
                            confidence: res.confidence,
                            verdict: res.verdict,
                            detectedLabels: res.detectedLabels,
                            boundingBoxes: res.boundingBoxes,
                            summary: res.summary,
                            rcaNotes: res.rcaNotes,
                            isLiveApi: res.isLiveApi
                        }
                    };
                }
                return n;
            }));

            if (isNg) {
                toast.error(`Vertex AI: Defect Detected! (${res.confidence}%)`);
            } else {
                toast.success(`Vertex AI: Inspection Passed! (${res.confidence}%)`);
            }
        } catch (err) {
            toast.error(`Vertex AI Error: ${err.message}`);
        } finally {
            setIsTestingAi(false);
        }
    };

    // Google Teachable Machine Execution
    const handleTestTeachableMachine = async () => {
        setIsTestingTeachable(true);
        const { modelUrl, classes, minConfidence, targetPassClass } = selectedNode.params || {};

        try {
            const res = await runTeachableMachineClassifier({
                modelUrl: modelUrl || '',
                classes: classes || 'OK, NG_Scratch, NG_Dent, Misaligned',
                minConfidence: minConfidence || 85
            });

            const passClass = (targetPassClass || 'OK').toUpperCase();
            const isPass = res.topClass.toUpperCase() === passClass || res.topClass.toUpperCase().includes('PASS');
            const resultMsg = `Teachable: ${res.topClass} [${res.confidence}%] → ${isPass ? 'PASS' : 'FAIL'}`;

            setNodes(prev => prev.map(n => {
                if (n.id === selectedNode.id) {
                    return {
                        ...n,
                        status: isPass ? 'success' : 'failed',
                        value: resultMsg,
                        lastTeachableInference: {
                            topClass: res.topClass,
                            confidence: res.confidence,
                            verdict: isPass ? 'PASS' : 'FAIL',
                            latencyMs: res.latencyMs,
                            allScores: res.allScores
                        }
                    };
                }
                return n;
            }));

            if (isPass) {
                toast.success(`Teachable Machine: Classified ${res.topClass} (${res.confidence}%) [PASS]`);
            } else {
                toast.error(`Teachable Machine: Defect ${res.topClass} (${res.confidence}%) [FAIL]`);
            }
        } catch (err) {
            toast.error(`Teachable Machine Error: ${err.message}`);
        } finally {
            setIsTestingTeachable(false);
        }
    };

    // Google Cloud Vision OCR Execution
    const handleTestGoogleOcr = async () => {
        setIsTestingOcr(true);
        const { apiKey, expectedPattern, exactMatch } = selectedNode.params || {};

        try {
            const res = await runGoogleCloudVisionOcr({
                apiKey,
                expectedPattern: expectedPattern || 'LOT-[A-Z0-9]+',
                exactMatch: exactMatch || ''
            });

            const isPass = res.verdict === 'PASS';
            const resultMsg = `Google OCR: "${res.detectedText.split('\n')[0]}" [${isPass ? 'MATCH' : 'MISMATCH'}]`;

            setNodes(prev => prev.map(n => {
                if (n.id === selectedNode.id) {
                    return {
                        ...n,
                        status: isPass ? 'success' : 'failed',
                        value: resultMsg,
                        lastOcrInference: {
                            detectedText: res.detectedText,
                            verdict: res.verdict,
                            confidence: res.confidence || 98.5,
                            latencyMs: res.latencyMs,
                            isLiveApi: res.isLiveApi
                        }
                    };
                }
                return n;
            }));

            toast.success(`Google Cloud OCR: "${res.detectedText.split('\n')[0]}"`);
        } catch (err) {
            toast.error(`Google OCR Error: ${err.message}`);
        } finally {
            setIsTestingOcr(false);
        }
    };

    // Google Sheets & GCS Logger Execution
    const handleTestGoogleLogger = async () => {
        setIsTestingLogger(true);
        const { webhookUrl, targetType, sheetName } = selectedNode.params || {};

        try {
            const res = await syncToGoogleSheets({
                webhookUrl,
                inspectionRecord: {
                    jobName: 'Visual Inspection Pipeline',
                    status: 'PASS',
                    confidence: 97.5,
                    target: sheetName || 'QC_Inspections_Live'
                }
            });

            if (res.success) {
                toast.success(`Logged to ${targetType || 'Google Sheets'} row #${res.sheetRowId}`);
            } else {
                toast.error(`Sync error: ${res.error}`);
            }
        } catch (e) {
            toast.error(`Logger error: ${e.message}`);
        } finally {
            setIsTestingLogger(false);
        }
    };

    const cameraNames = cameraConfigs && cameraConfigs.length > 0
        ? cameraConfigs.map(c => c.name)
        : ['Default IP Camera', 'Main Inspection Camera', 'Packaging Line Camera', 'Calibration Webcam'];

    const updateParam = (key, value) => {
        setNodes(prev => prev.map(n => {
            if (n.id === selectedNode.id) {
                return { ...n, params: { ...n.params, [key]: value } };
            }
            return n;
        }));
    };

    const updateName = (name) => {
        setNodes(prev => prev.map(n => n.id === selectedNode.id ? { ...n, name } : n));
    };

    return (
        <div style={panelStyle}>
            {/* Header */}
            <div style={headerStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '0.95rem' }}>{typeInfo.icon}</span>
                    <span style={{ fontSize: '0.82rem', fontWeight: 800 }}>Block Settings</span>
                </div>
                <button onClick={() => onDeleteNode(selectedNode.id)} style={deleteBtnStyle}>
                    <Trash2 size={14} />
                </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, overflowY: 'auto', paddingRight: '4px' }}>

                {/* Category badge */}
                <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                    padding: '3px 8px', borderRadius: '6px', alignSelf: 'flex-start',
                    backgroundColor: `${typeInfo.color}12`, border: `1px solid ${typeInfo.color}25`,
                    fontSize: '0.62rem', fontWeight: 700, color: typeInfo.color, textTransform: 'uppercase', letterSpacing: '0.5px',
                }}>
                    {typeInfo.label}
                </div>

                {/* Block Name */}
                <Field label="Block Label">
                    <input type="text" value={selectedNode.name} onChange={e => updateName(e.target.value)} style={inputStyle} />
                </Field>

                {/* Coordinate Fixturing Reference */}
                {['measure', 'circle_gauge', 'line_fitter', 'caliper_array', 'radial_caliper', 'inspect', 'barcode', 'bead_inspection'].includes(selectedNode.type) && (
                    <Field label="Coordinate Fixturing Reference">
                        <select
                            value={selectedNode.params.fixtureSource || ''}
                            onChange={e => updateParam('fixtureSource', e.target.value)}
                            style={selectStyle}
                        >
                            <option value="">None (Absolute Space)</option>
                            {nodes
                                .filter(n => ['locate', 'patmax'].includes(n.type) && n.id !== selectedNode.id)
                                .map(n => (
                                    <option key={n.id} value={n.id}>
                                        {n.name} ({n.type.toUpperCase()})
                                    </option>
                                ))
                            }
                        </select>
                    </Field>
                )}

                {/* ═══ Type-specific parameter panels ═══ */}

                {/* ── ACQUIRE ──────────────────────────── */}
                {selectedNode.type === 'acquire' && (<>
                    <Field label="Camera Source">
                        <select
                            value={selectedNode.params.camera || (cameraConfigs[0]?.name || '')}
                            onChange={e => {
                                const chosenName = e.target.value;
                                updateParam('camera', chosenName);
                                const matchedCam = cameraConfigs.find(c => c.name === chosenName);
                                if (matchedCam) {
                                    updateParam('cameraId', matchedCam.id);
                                    updateParam('cameraSource', matchedCam.cameraSource || matchedCam.url);
                                }
                            }}
                            style={selectStyle}
                        >
                            {cameraConfigs && cameraConfigs.length > 0 ? (
                                cameraConfigs.map(c => (
                                    <option key={c.id || c.name} value={c.name}>
                                        {c.name} {c.cameraSource ? `(${c.cameraSource})` : ''}
                                    </option>
                                ))
                            ) : (
                                cameraNames.map(name => (
                                    <option key={name} value={name}>{name}</option>
                                ))
                            )}
                        </select>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                            <span style={{ fontSize: '0.65rem', color: '#64748b' }}>
                                {cameraConfigs.find(c => c.name === selectedNode.params.camera)?.cameraSource || 'IP RTSP / USB Vision'}
                            </span>
                            <button
                                type="button"
                                onClick={onNavigateToCameraSettings}
                                style={{
                                    border: 'none',
                                    background: 'transparent',
                                    color: '#2563eb',
                                    fontSize: '0.68rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    textDecoration: 'underline',
                                    padding: 0
                                }}
                            >
                                ⚙️ Atur di Menu Kamera
                            </button>
                        </div>
                    </Field>
                    <Field label="Trigger Mode">
                        <select value={selectedNode.params.trigger || ''} onChange={e => updateParam('trigger', e.target.value)} style={selectStyle}>
                            <option value="Continuous">Continuous</option>
                            <option value="PLC Continuous">PLC Continuous</option>
                            <option value="Sensor Trigger">Sensor Trigger</option>
                            <option value="Software Trigger">Software Trigger</option>
                            <option value="Manual">Manual</option>
                        </select>
                    </Field>
                    <Row>
                        <Field label="Exposure"><select value={selectedNode.params.exposure || 'Auto'} onChange={e => updateParam('exposure', e.target.value)} style={selectStyle}><option>Auto</option><option>100μs</option><option>500μs</option><option>1ms</option><option>5ms</option><option>10ms</option></select></Field>
                        <Field label="Gain"><select value={selectedNode.params.gain || 'Auto'} onChange={e => updateParam('gain', e.target.value)} style={selectStyle}><option>Auto</option><option>0dB</option><option>6dB</option><option>12dB</option><option>24dB</option></select></Field>
                    </Row>
                </>)}

                {/* ── PRE-PROCESS ──────────────────────── */}
                {selectedNode.type === 'preprocess' && (<>
                    <Field label="Filter Type">
                        <select value={selectedNode.params.filter || 'Gaussian Blur'} onChange={e => updateParam('filter', e.target.value)} style={selectStyle}>
                            <option>Gaussian Blur</option><option>Median</option><option>Bilateral</option><option>CLAHE</option><option>Sharpen</option>
                        </select>
                    </Field>
                    <Row>
                        <Field label="Kernel Size"><input type="number" min={1} max={31} step={2} value={selectedNode.params.kernelSize || 5} onChange={e => updateParam('kernelSize', Number(e.target.value))} style={inputStyle} /></Field>
                        <Field label="Threshold"><input type="number" min={0} max={255} value={selectedNode.params.threshold || 128} onChange={e => updateParam('threshold', Number(e.target.value))} style={inputStyle} /></Field>
                    </Row>
                    <Field label="Morphology Op">
                        <select value={selectedNode.params.morphOp || 'None'} onChange={e => updateParam('morphOp', e.target.value)} style={selectStyle}>
                            <option>None</option><option>Erode</option><option>Dilate</option><option>Open</option><option>Close</option>
                        </select>
                    </Field>
                </>)}

                {/* ── LOCATE (Pattern) ─────────────────── */}
                {selectedNode.type === 'locate' && (<>
                    <Field label="Align Reference Template"><input type="text" value={selectedNode.params.template || ''} onChange={e => updateParam('template', e.target.value)} style={inputStyle} /></Field>
                    <Row>
                        <Field label="Angle Tol (±°)"><input type="number" value={selectedNode.params.angleTolerance || 10} onChange={e => updateParam('angleTolerance', Number(e.target.value))} style={inputStyle} /></Field>
                        <Field label="Score Min %"><input type="number" value={selectedNode.params.scoreThreshold || 80} onChange={e => updateParam('scoreThreshold', Number(e.target.value))} style={inputStyle} /></Field>
                    </Row>
                </>)}

                {/* ── PATMAX ───────────────────────────── */}
                {selectedNode.type === 'patmax' && (<>
                    <Field label="Reference Template"><input type="text" value={selectedNode.params.template || ''} onChange={e => updateParam('template', e.target.value)} style={inputStyle} placeholder="Select or train template..." /></Field>
                    <Row>
                        <Field label="Angle Range (°)"><input type="number" value={selectedNode.params.angleRange || 360} onChange={e => updateParam('angleRange', Number(e.target.value))} style={inputStyle} /></Field>
                        <Field label="Accept Score %"><input type="number" value={selectedNode.params.acceptScore || 70} onChange={e => updateParam('acceptScore', Number(e.target.value))} style={inputStyle} /></Field>
                    </Row>
                    <Row>
                        <Field label="Scale Min %"><input type="number" value={selectedNode.params.scaleMin || 80} onChange={e => updateParam('scaleMin', Number(e.target.value))} style={inputStyle} /></Field>
                        <Field label="Scale Max %"><input type="number" value={selectedNode.params.scaleMax || 120} onChange={e => updateParam('scaleMax', Number(e.target.value))} style={inputStyle} /></Field>
                    </Row>
                    <Field label="Max Results"><input type="number" min={1} max={20} value={selectedNode.params.maxResults || 1} onChange={e => updateParam('maxResults', Number(e.target.value))} style={inputStyle} /></Field>
                </>)}

                {/* ── BLOB ─────────────────────────────── */}
                {selectedNode.type === 'blob' && (<>
                    <Field label="Polarity">
                        <select value={selectedNode.params.polarity || 'Light on Dark'} onChange={e => updateParam('polarity', e.target.value)} style={selectStyle}>
                            <option>Light on Dark</option><option>Dark on Light</option><option>Auto</option>
                        </select>
                    </Field>
                    <Row>
                        <Field label="Min Area (px²)"><input type="number" value={selectedNode.params.minArea || 100} onChange={e => updateParam('minArea', Number(e.target.value))} style={inputStyle} /></Field>
                        <Field label="Max Area (px²)"><input type="number" value={selectedNode.params.maxArea || 50000} onChange={e => updateParam('maxArea', Number(e.target.value))} style={inputStyle} /></Field>
                    </Row>
                    <Row>
                        <Field label="Circularity"><input type="number" step={0.1} min={0} max={1} value={selectedNode.params.circularity || 0.5} onChange={e => updateParam('circularity', Number(e.target.value))} style={inputStyle} /></Field>
                        <Field label="Max Blobs"><input type="number" min={1} max={100} value={selectedNode.params.maxBlobs || 10} onChange={e => updateParam('maxBlobs', Number(e.target.value))} style={inputStyle} /></Field>
                    </Row>
                </>)}

                {/* ── EDGE ─────────────────────────────── */}
                {selectedNode.type === 'edge' && (<>
                    <Field label="Algorithm">
                        <select value={selectedNode.params.algorithm || 'Canny'} onChange={e => updateParam('algorithm', e.target.value)} style={selectStyle}>
                            <option>Canny</option><option>Sobel</option><option>Laplacian</option>
                        </select>
                    </Field>
                    <Row>
                        <Field label="Low Threshold"><input type="number" value={selectedNode.params.lowThreshold || 50} onChange={e => updateParam('lowThreshold', Number(e.target.value))} style={inputStyle} /></Field>
                        <Field label="High Threshold"><input type="number" value={selectedNode.params.highThreshold || 150} onChange={e => updateParam('highThreshold', Number(e.target.value))} style={inputStyle} /></Field>
                    </Row>
                    <Field label="Direction">
                        <select value={selectedNode.params.direction || 'Both'} onChange={e => updateParam('direction', e.target.value)} style={selectStyle}>
                            <option>Both</option><option>Horizontal</option><option>Vertical</option>
                        </select>
                    </Field>
                </>)}

                {/* ── CALIPER MEASURE ──────────────────── */}
                {selectedNode.type === 'measure' && (<>
                    {/* CAD Integration */}
                    <CadLinkSection selectedNode={selectedNode} updateParam={updateParam} drawingsList={drawingsList} />
                    <Field label="Caliper Tool">
                        <select value={selectedNode.params.tool || ''} onChange={e => updateParam('tool', e.target.value)} style={selectStyle} disabled={!!selectedNode.params.linkedDimensionId}>
                            <option>Caliper Edge-to-Edge</option><option>Circle Diameter Caliper</option><option>Corner Angle Check</option>
                        </select>
                    </Field>
                    <Field label="Nominal Size"><input type="text" value={selectedNode.params.nominalSize || ''} onChange={e => updateParam('nominalSize', e.target.value)} style={{ ...inputStyle, backgroundColor: selectedNode.params.linkedDimensionId ? '#f1f5f9' : 'white' }} disabled={!!selectedNode.params.linkedDimensionId} /></Field>
                    <Row>
                        <Field label="LSL (Min)"><input type="text" value={selectedNode.params.lsl || ''} onChange={e => updateParam('lsl', e.target.value)} style={{ ...inputStyle, backgroundColor: selectedNode.params.linkedDimensionId ? '#f1f5f9' : 'white' }} disabled={!!selectedNode.params.linkedDimensionId} /></Field>
                        <Field label="USL (Max)"><input type="text" value={selectedNode.params.usl || ''} onChange={e => updateParam('usl', e.target.value)} style={{ ...inputStyle, backgroundColor: selectedNode.params.linkedDimensionId ? '#f1f5f9' : 'white' }} disabled={!!selectedNode.params.linkedDimensionId} /></Field>
                    </Row>
                </>)}

                {/* ── CIRCLE GAUGE ─────────────────────── */}
                {selectedNode.type === 'circle_gauge' && (<>
                    <Field label="Measure Mode">
                        <select value={selectedNode.params.measureMode || 'Best Fit'} onChange={e => updateParam('measureMode', e.target.value)} style={selectStyle}>
                            <option>Best Fit</option><option>Min Enclosing</option><option>Max Inscribed</option>
                        </select>
                    </Field>
                    <Row>
                        <Field label="Expected Radius"><input type="number" value={selectedNode.params.expectedRadius || 50} onChange={e => updateParam('expectedRadius', Number(e.target.value))} style={inputStyle} /></Field>
                        <Field label="Tolerance (±)"><input type="number" value={selectedNode.params.radiusTolerance || 5} onChange={e => updateParam('radiusTolerance', Number(e.target.value))} style={inputStyle} /></Field>
                    </Row>
                    <Field label="Min Score %"><input type="number" value={selectedNode.params.minScore || 80} onChange={e => updateParam('minScore', Number(e.target.value))} style={inputStyle} /></Field>
                </>)}

                {/* ── LINE FITTER ──────────────────────── */}
                {selectedNode.type === 'line_fitter' && (<>
                    <Field label="Edge Polarity">
                        <select value={selectedNode.params.edgePolarity || 'Dark to Light'} onChange={e => updateParam('edgePolarity', e.target.value)} style={selectStyle}>
                            <option>Dark to Light</option><option>Light to Dark</option><option>Either</option>
                        </select>
                    </Field>
                    <Row>
                        <Field label="Num Points"><input type="number" value={selectedNode.params.numPoints || 20} onChange={e => updateParam('numPoints', Number(e.target.value))} style={inputStyle} /></Field>
                        <Field label="Proj Length"><input type="number" value={selectedNode.params.projectionLength || 100} onChange={e => updateParam('projectionLength', Number(e.target.value))} style={inputStyle} /></Field>
                    </Row>
                </>)}

                {/* ── ANGLE MEASURE ────────────────────── */}
                {selectedNode.type === 'angle_measure' && (<>
                    <Row>
                        <Field label="Expected Angle"><input type="number" value={selectedNode.params.expectedAngle || 90} onChange={e => updateParam('expectedAngle', Number(e.target.value))} style={inputStyle} /></Field>
                        <Field label="Tolerance (±°)"><input type="number" value={selectedNode.params.tolerance || 2} onChange={e => updateParam('tolerance', Number(e.target.value))} style={inputStyle} /></Field>
                    </Row>
                </>)}

                {/* ── CALIPER ARRAY ────────────────────── */}
                {selectedNode.type === 'caliper_array' && (<>
                    <Field label="Expected Distance (px)"><input type="number" value={selectedNode.params.expectedDistance || 120} onChange={e => updateParam('expectedDistance', Number(e.target.value))} style={inputStyle} /></Field>
                    <Field label="Edge Polarity">
                        <select value={selectedNode.params.edgePolarity || 'Dark to Light'} onChange={e => updateParam('edgePolarity', e.target.value)} style={selectStyle}>
                            <option>Dark to Light</option><option>Light to Dark</option><option>Either</option>
                        </select>
                    </Field>
                    <Row>
                        <Field label="Caliper Count"><input type="number" value={selectedNode.params.numCalipers || 10} onChange={e => updateParam('numCalipers', Number(e.target.value))} style={inputStyle} /></Field>
                        <Field label="Caliper Width"><input type="number" value={selectedNode.params.caliperWidth || 20} onChange={e => updateParam('caliperWidth', Number(e.target.value))} style={inputStyle} /></Field>
                    </Row>
                </>)}

                {/* ── RADIAL CALIPER ───────────────────── */}
                {selectedNode.type === 'radial_caliper' && (<>
                    <Row>
                        <Field label="Expected Radius"><input type="number" value={selectedNode.params.expectedRadius || 80} onChange={e => updateParam('expectedRadius', Number(e.target.value))} style={inputStyle} /></Field>
                        <Field label="Tolerance (±)"><input type="number" value={selectedNode.params.radiusTolerance || 5} onChange={e => updateParam('radiusTolerance', Number(e.target.value))} style={inputStyle} /></Field>
                    </Row>
                    <Field label="Caliper Count"><input type="number" value={selectedNode.params.numCalipers || 16} onChange={e => updateParam('numCalipers', Number(e.target.value))} style={inputStyle} /></Field>
                </>)}

                {/* ── COLOR EXTRACTOR ──────────────────── */}
                {selectedNode.type === 'color_extract' && (<>
                    <Field label="Color Space">
                        <select value={selectedNode.params.colorSpace || 'HSV'} onChange={e => updateParam('colorSpace', e.target.value)} style={selectStyle}>
                            <option>HSV</option><option>RGB</option><option>LAB</option>
                        </select>
                    </Field>
                    <Row>
                        <Field label="Target Hue"><input type="number" min={0} max={180} value={selectedNode.params.targetHue || 120} onChange={e => updateParam('targetHue', Number(e.target.value))} style={inputStyle} /></Field>
                        <Field label="Hue Tol (±)"><input type="number" value={selectedNode.params.hueTolerance || 15} onChange={e => updateParam('hueTolerance', Number(e.target.value))} style={inputStyle} /></Field>
                    </Row>
                    <Row>
                        <Field label="Min Sat %"><input type="number" value={selectedNode.params.minSaturation || 50} onChange={e => updateParam('minSaturation', Number(e.target.value))} style={inputStyle} /></Field>
                        <Field label="Min Value %"><input type="number" value={selectedNode.params.minValue || 50} onChange={e => updateParam('minValue', Number(e.target.value))} style={inputStyle} /></Field>
                    </Row>
                </>)}

                {/* ── HISTOGRAM ────────────────────────── */}
                {selectedNode.type === 'histogram' && (<>
                    <Field label="Channel">
                        <select value={selectedNode.params.channel || 'Grayscale'} onChange={e => updateParam('channel', e.target.value)} style={selectStyle}>
                            <option>Grayscale</option><option>Red</option><option>Green</option><option>Blue</option>
                        </select>
                    </Field>
                    <Row>
                        <Field label="Expected Mean"><input type="number" value={selectedNode.params.expectedMean || 128} onChange={e => updateParam('expectedMean', Number(e.target.value))} style={inputStyle} /></Field>
                        <Field label="Mean Tol (±)"><input type="number" value={selectedNode.params.meanTolerance || 30} onChange={e => updateParam('meanTolerance', Number(e.target.value))} style={inputStyle} /></Field>
                    </Row>
                    <Row>
                        <Field label="Expected StdDev"><input type="number" value={selectedNode.params.expectedStdDev || 40} onChange={e => updateParam('expectedStdDev', Number(e.target.value))} style={inputStyle} /></Field>
                        <Field label="StdDev Tol (±)"><input type="number" value={selectedNode.params.stdDevTol || 15} onChange={e => updateParam('stdDevTol', Number(e.target.value))} style={inputStyle} /></Field>
                    </Row>
                </>)}

                {/* ── INSPECT (OCR/OCV/Anomaly) ────────── */}
                {selectedNode.type === 'inspect' && (<>
                    <Field label="Inspection Mode">
                        <select value={selectedNode.params.mode || ''} onChange={e => updateParam('mode', e.target.value)} style={selectStyle}>
                            <option>OCR Reading</option><option>OCV Verification</option><option>Anomaly Segmentation</option><option>Barcode Code Scanning</option>
                        </select>
                    </Field>
                    {selectedNode.params.mode === 'OCV Verification' ? (
                        <Field label="Verification Reference">
                            <select value={selectedNode.params.referenceSource || ''} onChange={e => updateParam('referenceSource', e.target.value)} style={selectStyle}>
                                <option value="Static Ref Text">Static Reference Text</option>
                                {appVariables.map(v => (<option key={v.id} value={`Variable: ${v.name}`}>Var: {v.name}</option>))}
                            </select>
                        </Field>
                    ) : selectedNode.params.mode === 'Anomaly Segmentation' ? (
                        <Field label="Max Defect Area (px²)"><input type="number" value={selectedNode.params.thresholdArea || 50} onChange={e => updateParam('thresholdArea', Number(e.target.value))} style={inputStyle} /></Field>
                    ) : (
                        <>
                            <Field label="Match Pattern (Regex)"><input type="text" value={selectedNode.params.matchPattern || ''} onChange={e => updateParam('matchPattern', e.target.value)} style={inputStyle} /></Field>
                            <button
                                onClick={onTrainOcrFont}
                                style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                                    padding: '8px 12px', borderRadius: '8px', border: '1px solid #7c3aed',
                                    backgroundColor: '#f5f3ff', color: '#7c3aed', fontWeight: 700, fontSize: '0.72rem',
                                    cursor: 'pointer', marginTop: '6px', width: '100%'
                                }}
                            >
                                🔠 Train OCR Font Characters
                            </button>
                        </>
                    )}
                </>)}

                {/* ── BARCODE ──────────────────────────── */}
                {selectedNode.type === 'barcode' && (<>
                    <Field label="Symbology">
                        <select value={selectedNode.params.symbology || 'Auto'} onChange={e => updateParam('symbology', e.target.value)} style={selectStyle}>
                            <option>Auto</option><option>Code128</option><option>Code39</option><option>EAN-13</option><option>QR Code</option><option>Data Matrix</option>
                        </select>
                    </Field>
                    <Field label="Expected Format"><input type="text" value={selectedNode.params.expectedFormat || ''} onChange={e => updateParam('expectedFormat', e.target.value)} style={inputStyle} placeholder="e.g. LOT-####" /></Field>
                    <Field label="Verify Checksum">
                        <ToggleSwitch checked={selectedNode.params.verifyChecksum !== false} onChange={v => updateParam('verifyChecksum', v)} />
                    </Field>
                </>)}

                {/* ── BEAD INSPECTION ──────────────────── */}
                {selectedNode.type === 'bead_inspection' && (<>
                    <Field label="Bead Color">
                        <select value={selectedNode.params.beadColor || 'Dark'} onChange={e => updateParam('beadColor', e.target.value)} style={selectStyle}>
                            <option value="Dark">Dark on Light</option>
                            <option value="Light">Light on Dark</option>
                        </select>
                    </Field>
                    <Row>
                        <Field label="Expected Width (px)"><input type="number" value={selectedNode.params.expectedWidth || 8} onChange={e => updateParam('expectedWidth', Number(e.target.value))} style={inputStyle} /></Field>
                        <Field label="Tolerance ± (px)"><input type="number" value={selectedNode.params.widthTolerance || 3} onChange={e => updateParam('widthTolerance', Number(e.target.value))} style={inputStyle} /></Field>
                    </Row>
                    <Field label="Max Allowable Gap (px)"><input type="number" value={selectedNode.params.maxGapLength || 5} onChange={e => updateParam('maxGapLength', Number(e.target.value))} style={inputStyle} /></Field>
                </>)}

                {/* ── CAMERA INSPECTION ────────────────── */}
                {selectedNode.type === 'camera_inspect' && (<>
                    <Field label="Camera Source">
                        <select
                            value={selectedNode.params.camera || (cameraConfigs[0]?.name || '')}
                            onChange={e => {
                                const chosenName = e.target.value;
                                updateParam('camera', chosenName);
                                const matchedCam = cameraConfigs.find(c => c.name === chosenName);
                                if (matchedCam) {
                                    updateParam('cameraId', matchedCam.id);
                                }
                            }}
                            style={selectStyle}
                        >
                            {cameraConfigs && cameraConfigs.length > 0 ? (
                                cameraConfigs.map(c => (
                                    <option key={c.id || c.name} value={c.name}>
                                        {c.name} {c.cameraSource ? `(${c.cameraSource})` : ''}
                                    </option>
                                ))
                            ) : (
                                cameraNames.map(name => (
                                    <option key={name} value={name}>{name}</option>
                                ))
                            )}
                        </select>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
                            <button
                                type="button"
                                onClick={onNavigateToCameraSettings}
                                style={{
                                    border: 'none',
                                    background: 'transparent',
                                    color: '#2563eb',
                                    fontSize: '0.68rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    textDecoration: 'underline',
                                    padding: 0
                                }}
                            >
                                ⚙️ Konfigurasi Kamera
                            </button>
                        </div>
                    </Field>
                    <Field label="Filter Regions">
                        <select value={selectedNode.params.filterRegions || 'All Regions'} onChange={e => updateParam('filterRegions', e.target.value)} style={selectStyle}>
                            <option value="All Regions">All Regions</option>
                            <option value="Only Presence Checks">Only Presence Checks</option>
                            <option value="Only Measurements">Only Measurements</option>
                            <option value="Only OCR Readers">Only OCR Readers</option>
                            <option value="Only Barcode Readers">Only Barcode Readers</option>
                        </select>
                    </Field>
                </>)}

                {/* ── MATH/FORMULA ─────────────────────── */}
                {selectedNode.type === 'math_formula' && (<>
                    <Field label="Formula Expression"><input type="text" value={selectedNode.params.formula || ''} onChange={e => updateParam('formula', e.target.value)} style={inputStyle} placeholder="e.g. A + B, A / B * 100" /></Field>
                    <Row>
                        <Field label="Input A Source"><input type="text" value={selectedNode.params.inputA || ''} onChange={e => updateParam('inputA', e.target.value)} style={inputStyle} placeholder="From node..." /></Field>
                        <Field label="Input B Source"><input type="text" value={selectedNode.params.inputB || ''} onChange={e => updateParam('inputB', e.target.value)} style={inputStyle} placeholder="From node..." /></Field>
                    </Row>
                    <Row>
                        <Field label="Output Label"><input type="text" value={selectedNode.params.outputLabel || ''} onChange={e => updateParam('outputLabel', e.target.value)} style={inputStyle} /></Field>
                        <Field label="Precision"><input type="number" min={0} max={6} value={selectedNode.params.precision || 2} onChange={e => updateParam('precision', Number(e.target.value))} style={inputStyle} /></Field>
                    </Row>
                </>)}

                {/* ── COMPARATOR ───────────────────────── */}
                {selectedNode.type === 'comparator' && (<>
                    <Field label="Compare Mode">
                        <select value={selectedNode.params.compareMode || 'Range'} onChange={e => updateParam('compareMode', e.target.value)} style={selectStyle}>
                            <option>Range</option><option>Greater Than</option><option>Less Than</option><option>Equal</option><option>Not Equal</option>
                        </select>
                    </Field>
                    {(selectedNode.params.compareMode === 'Range' || !selectedNode.params.compareMode) && (
                        <Row>
                            <Field label="Lower Bound"><input type="number" value={selectedNode.params.lowerBound || 0} onChange={e => updateParam('lowerBound', Number(e.target.value))} style={inputStyle} /></Field>
                            <Field label="Upper Bound"><input type="number" value={selectedNode.params.upperBound || 100} onChange={e => updateParam('upperBound', Number(e.target.value))} style={inputStyle} /></Field>
                        </Row>
                    )}
                    <Field label="Pass Condition">
                        <select value={selectedNode.params.passCondition || 'In Range'} onChange={e => updateParam('passCondition', e.target.value)} style={selectStyle}>
                            <option>In Range</option><option>Out of Range</option>
                        </select>
                    </Field>
                </>)}

                {/* ── DATA LOGGER ──────────────────────── */}
                {selectedNode.type === 'data_logger' && (<>
                    <Field label="Log Target">
                        <select value={selectedNode.params.target || 'Supabase'} onChange={e => updateParam('target', e.target.value)} style={selectStyle}>
                            <option>Supabase</option><option>CSV File</option><option>Variable</option><option>Console</option>
                        </select>
                    </Field>
                    {selectedNode.params.target === 'Supabase' && (
                        <Field label="Table Name"><input type="text" value={selectedNode.params.tableName || ''} onChange={e => updateParam('tableName', e.target.value)} style={inputStyle} /></Field>
                    )}
                    <Field label="Include Image Snapshot">
                        <ToggleSwitch checked={!!selectedNode.params.includeImage} onChange={v => updateParam('includeImage', v)} />
                    </Field>
                </>)}

                {/* ── DECIDE / YIELD JUDGE ─────────────── */}
                {selectedNode.type === 'decide' && (<>
                    <Field label="Target Yield Score %"><input type="number" value={selectedNode.params.minPassedScore || 90} onChange={e => updateParam('minPassedScore', Number(e.target.value))} style={inputStyle} /></Field>
                    <Field label="Pass Action">
                        <select value={selectedNode.params.passAction || 'Signal Green Light'} onChange={e => updateParam('passAction', e.target.value)} style={selectStyle}>
                            <option>Signal Green Light</option><option>Continue Conveyor</option><option>Write PLC OK</option>
                        </select>
                    </Field>
                    <Field label="Fail Action">
                        <select value={selectedNode.params.failAction || ''} onChange={e => updateParam('failAction', e.target.value)} style={selectStyle}>
                            <option>Trigger Alert Light</option><option>Activate Reject Arm</option><option>Stop Conveyor</option><option>Write PLC Boolean Error</option>
                        </select>
                    </Field>
                    <Field label="Write to PLC">
                        <ToggleSwitch checked={!!selectedNode.params.writeToPlc} onChange={v => updateParam('writeToPlc', v)} />
                    </Field>
                    {selectedNode.params.writeToPlc && (
                        <Field label="PLC Address"><input type="text" value={selectedNode.params.plcAddress || ''} onChange={e => updateParam('plcAddress', e.target.value)} style={inputStyle} placeholder="e.g. DB1.DBX0.0" /></Field>
                    )}
                </>)}

                {/* ── GEOMETRY CONSTRUCTION ────────────── */}
                {selectedNode.type === 'geom_construction' && (<>
                    <Field label="Geometry Relation Mode">
                        <select value={selectedNode.params.geomMode || 'Line-Line Intersection'} onChange={e => updateParam('geomMode', e.target.value)} style={selectStyle}>
                            <option>Line-Line Intersection</option>
                            <option>Point-Line Distance</option>
                            <option>Point-Point Distance</option>
                        </select>
                    </Field>
                    <Row>
                        <Field label="Geometry Ref 1">
                            <select value={selectedNode.params.ref1 || ''} onChange={e => updateParam('ref1', e.target.value)} style={selectStyle}>
                                <option value="">Select node...</option>
                                {nodes.filter(n => n.id !== selectedNode.id).map(n => (
                                    <option key={n.id} value={n.id}>{n.name} ({n.type.toUpperCase()})</option>
                                ))}
                            </select>
                        </Field>
                        <Field label="Geometry Ref 2">
                            <select value={selectedNode.params.ref2 || ''} onChange={e => updateParam('ref2', e.target.value)} style={selectStyle}>
                                <option value="">Select node...</option>
                                {nodes.filter(n => n.id !== selectedNode.id).map(n => (
                                    <option key={n.id} value={n.id}>{n.name} ({n.type.toUpperCase()})</option>
                                ))}
                            </select>
                        </Field>
                    </Row>
                    <Row>
                        <Field label="Nominal Size (mm/px)"><input type="text" value={selectedNode.params.nominalVal || '0.0'} onChange={e => updateParam('nominalVal', e.target.value)} style={inputStyle} /></Field>
                        <Field label="Tolerance ±"><input type="text" value={selectedNode.params.tolerance || '0.5'} onChange={e => updateParam('tolerance', e.target.value)} style={inputStyle} /></Field>
                    </Row>
                </>)}

                {/* ── GRID CALIBRATION ─────────────────── */}
                {selectedNode.type === 'grid_calibration' && (<>
                    <Field label="Calibration Mode">
                        <select value={selectedNode.params.calibMode || 'Checkerboard Grid'} onChange={e => updateParam('calibMode', e.target.value)} style={selectStyle}>
                            <option>Checkerboard Grid</option>
                            <option>Manual Scale</option>
                            <option>N-Point Homography</option>
                        </select>
                    </Field>
                    <Field label="Resolution (pixels/mm)"><input type="number" step="0.01" value={selectedNode.params.pxPerMm || 4.25} onChange={e => updateParam('pxPerMm', Number(e.target.value))} style={inputStyle} /></Field>
                    <Row>
                        <Field label="Origin X offset"><input type="number" value={selectedNode.params.originX || 0} onChange={e => updateParam('originX', Number(e.target.value))} style={inputStyle} /></Field>
                        <Field label="Origin Y offset"><input type="number" value={selectedNode.params.originY || 0} onChange={e => updateParam('originY', Number(e.target.value))} style={inputStyle} /></Field>
                    </Row>
                    <Field label="Overlay Alignment Grid">
                        <ToggleSwitch checked={selectedNode.params.showGrid !== false} onChange={v => updateParam('showGrid', v)} />
                    </Field>
                </>)}

                {/* ── SPATIAL FLAW DETECTOR ────────────── */}
                {selectedNode.type === 'spatial_flaw' && (<>
                    <Field label="Flaw Sensitivity %"><input type="number" min={1} max={100} value={selectedNode.params.sensitivity || 80} onChange={e => updateParam('sensitivity', Number(e.target.value))} style={inputStyle} /></Field>
                    <Row>
                        <Field label="Min Flaw Area (px²)"><input type="number" value={selectedNode.params.minArea || 5} onChange={e => updateParam('minArea', Number(e.target.value))} style={inputStyle} /></Field>
                        <Field label="FFT Filter Size"><input type="number" value={selectedNode.params.filterSize || 15} onChange={e => updateParam('filterSize', Number(e.target.value))} style={inputStyle} /></Field>
                    </Row>
                    <Field label="Max Defects Allowed"><input type="number" value={selectedNode.params.maxDefects || 5} onChange={e => updateParam('maxDefects', Number(e.target.value))} style={inputStyle} /></Field>
                </>)}

                {/* ── BARCODE DPM ENHANCER ─────────────── */}
                {selectedNode.type === 'dpm_enhancer' && (<>
                    <Field label="Local Adaptive Radius"><input type="number" min={3} max={99} step={2} value={selectedNode.params.localRadius || 15} onChange={e => updateParam('localRadius', Number(e.target.value))} style={inputStyle} /></Field>
                    <Row>
                        <Field label="Morph Close Radius"><input type="number" value={selectedNode.params.morphCloseSize || 3} onChange={e => updateParam('morphCloseSize', Number(e.target.value))} style={inputStyle} /></Field>
                        <Field label="Contrast Gain multiplier"><input type="number" step="0.1" value={selectedNode.params.contrastGain || 1.5} onChange={e => updateParam('contrastGain', Number(e.target.value))} style={inputStyle} /></Field>
                    </Row>
                </>)}

                {/* ── POLAR UNWRAPPER ───────────────────── */}
                {selectedNode.type === 'polar_unwrap' && (<>
                    <Row>
                        <Field label="Center X (px)"><input type="number" value={selectedNode.params.cx || 320} onChange={e => updateParam('cx', Number(e.target.value))} style={inputStyle} /></Field>
                        <Field label="Center Y (px)"><input type="number" value={selectedNode.params.cy || 240} onChange={e => updateParam('cy', Number(e.target.value))} style={inputStyle} /></Field>
                    </Row>
                    <Row>
                        <Field label="Inner Radius (px)"><input type="number" value={selectedNode.params.innerRadius || 50} onChange={e => updateParam('innerRadius', Number(e.target.value))} style={inputStyle} /></Field>
                        <Field label="Outer Radius (px)"><input type="number" value={selectedNode.params.outerRadius || 150} onChange={e => updateParam('outerRadius', Number(e.target.value))} style={inputStyle} /></Field>
                    </Row>
                    <Field label="Unwrap Direction">
                        <select value={selectedNode.params.direction || 'Clockwise'} onChange={e => updateParam('direction', e.target.value)} style={selectStyle}>
                            <option>Clockwise</option>
                            <option>Counter-Clockwise</option>
                        </select>
                    </Field>
                </>)}

                {/* ── SEARCHMAX COLOR ──────────────────── */}
                {selectedNode.type === 'searchmax' && (<>
                    <Field label="Reference Color Template"><input type="text" value={selectedNode.params.template || ''} onChange={e => updateParam('template', e.target.value)} style={inputStyle} placeholder="e.g. Flange_Color_Mask" /></Field>
                    <Row>
                        <Field label="Min Accept Score %"><input type="number" value={selectedNode.params.acceptScore || 75} onChange={e => updateParam('acceptScore', Number(e.target.value))} style={inputStyle} /></Field>
                        <Field label="Max Results"><input type="number" min={1} value={selectedNode.params.maxResults || 1} onChange={e => updateParam('maxResults', Number(e.target.value))} style={inputStyle} /></Field>
                    </Row>
                    <Field label="Verify Hue/Color Gradient">
                        <ToggleSwitch checked={selectedNode.params.matchHue !== false} onChange={v => updateParam('matchHue', v)} />
                    </Field>
                </>)}

                {/* ── GOLDEN TEMPLATE COMPARATOR ───────── */}
                {selectedNode.type === 'golden_template' && (<>
                    <Field label="Target CAD Alignment Blueprint">
                        <select value={selectedNode.params.cadFile || 'industrial-flange-rev2.dxf'} onChange={e => updateParam('cadFile', e.target.value)} style={selectStyle}>
                            <option value="">Select CAD Model...</option>
                            {drawingsList.map(dwg => (
                                <option key={dwg.id} value={dwg.fileName}>{dwg.fileName} ({dwg.fileType})</option>
                            ))}
                        </select>
                    </Field>
                    <Field label="Pixel Deviation Tolerance"><input type="number" step="0.1" value={selectedNode.params.tolerancePixels || 2.0} onChange={e => updateParam('tolerancePixels', Number(e.target.value))} style={inputStyle} /></Field>
                    <Field label="Reject on Missing Features">
                        <ToggleSwitch checked={selectedNode.params.rejectOnMissing !== false} onChange={v => updateParam('rejectOnMissing', v)} />
                    </Field>
                </>)}

                {/* ── VIDI AI SEGMENTER ────────────────── */}
                {selectedNode.type === 'vidi_ai' && (<>
                    <Field label="ViDi Tool Mode">
                        <select value={selectedNode.params.modelMode || 'Red-Analyze (Anomaly)'} onChange={e => updateParam('modelMode', e.target.value)} style={selectStyle}>
                            <option>Red-Analyze (Anomaly)</option>
                            <option>Green-Classify (Class)</option>
                        </select>
                    </Field>
                    <Field label="Min Confidence Score %"><input type="number" value={selectedNode.params.minConfidence || 85} onChange={e => updateParam('minConfidence', Number(e.target.value))} style={inputStyle} /></Field>
                    <Field label="Deep Learning Model Weights"><input type="text" value={selectedNode.params.modelWeights || 'vidi-flange-anomaly.weights'} onChange={e => updateParam('modelWeights', e.target.value)} style={inputStyle} /></Field>
                </>)}

                {/* ── GOOGLE CLOUD VERTEX AI & GEMINI VISION ── */}
                {selectedNode.type === 'vertex_ai' && (<>
                    <div style={{
                        padding: '10px 12px',
                        background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.08) 0%, rgba(16, 185, 129, 0.08) 50%, rgba(245, 158, 11, 0.08) 100%)',
                        border: '1px solid rgba(37, 99, 235, 0.25)',
                        borderRadius: '10px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#1d4ed8', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <Sparkles size={13} color="#2563eb" /> Google Vertex AI
                            </span>
                            <span style={{ fontSize: '0.55rem', fontWeight: 800, padding: '2px 6px', borderRadius: '4px', backgroundColor: '#dbeafe', color: '#1e40af', border: '1px solid #bfdbfe' }}>
                                MULTIMODAL
                            </span>
                        </div>
                        <p style={{ margin: 0, fontSize: '0.62rem', color: '#475569', lineHeight: 1.35 }}>
                            Zero-shot visual inspection & defect localization powered by Google Gemini 2.0 & Vertex AI Model Garden.
                        </p>
                    </div>

                    {/* Test Prediction Button */}
                    <button
                        onClick={handleTestVertexAi}
                        disabled={isTestingAi}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            border: 'none',
                            backgroundColor: isTestingAi ? '#94a3b8' : '#2563eb',
                            color: 'white',
                            fontWeight: 700,
                            fontSize: '0.7rem',
                            cursor: isTestingAi ? 'default' : 'pointer',
                            boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)',
                            transition: 'all 0.15s'
                        }}
                    >
                        {isTestingAi ? (
                            <>
                                <RefreshCw size={13} className="animate-spin" />
                                <span>Running Vertex Prediction...</span>
                            </>
                        ) : (
                            <>
                                <Play size={12} fill="white" />
                                <span>⚡ Test Vertex AI Prediction</span>
                            </>
                        )}
                    </button>

                    {/* Recent AI Result Card if available */}
                    {selectedNode.lastAiInference && (
                        <div style={{
                            backgroundColor: selectedNode.lastAiInference.verdict === 'PASS' ? '#f0fdf4' : '#fef2f2',
                            border: `1px solid ${selectedNode.lastAiInference.verdict === 'PASS' ? '#bbf7d0' : '#fecaca'}`,
                            borderRadius: '8px',
                            padding: '8px 10px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '4px',
                            fontSize: '0.65rem'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontWeight: 800, color: selectedNode.lastAiInference.verdict === 'PASS' ? '#15803d' : '#b91c1c' }}>
                                    Verdict: {selectedNode.lastAiInference.verdict}
                                </span>
                                <span style={{ color: '#64748b', fontSize: '0.58rem' }}>
                                    {selectedNode.lastAiInference.latencyMs}ms ({selectedNode.lastAiInference.confidence}%)
                                </span>
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px', marginTop: '2px' }}>
                                {selectedNode.lastAiInference.detectedLabels.map((lbl, idx) => (
                                    <span key={idx} style={{
                                        fontSize: '0.55rem',
                                        padding: '1px 5px',
                                        borderRadius: '3px',
                                        backgroundColor: selectedNode.lastAiInference.verdict === 'PASS' ? '#dcfce7' : '#fee2e2',
                                        color: selectedNode.lastAiInference.verdict === 'PASS' ? '#166534' : '#991b1b',
                                        fontWeight: 600
                                    }}>
                                        {lbl}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* API Key */}
                    <Field label="Google Gemini / Vertex API Key">
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                            <input
                                type={showApiKey ? 'text' : 'password'}
                                value={selectedNode.params.apiKey || ''}
                                onChange={e => updateParam('apiKey', e.target.value)}
                                style={{ ...inputStyle, paddingRight: '28px' }}
                                placeholder="Optional: Enter AI Studio Key (or use offline simulator)"
                            />
                            <button
                                type="button"
                                onClick={() => setShowApiKey(!showApiKey)}
                                style={{ position: 'absolute', right: '6px', border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center', padding: '2px' }}
                                title={showApiKey ? 'Hide key' : 'Show key'}
                            >
                                {showApiKey ? <EyeOff size={13} /> : <Eye size={13} />}
                            </button>
                        </div>
                    </Field>

                    <Field label="Foundation Model / Endpoint">
                        <select
                            value={selectedNode.params.model || 'gemini-2.0-flash'}
                            onChange={e => updateParam('model', e.target.value)}
                            style={selectStyle}
                        >
                            <option value="gemini-2.5-flash">Gemini 2.5 Flash (Ultra Fast & Accurate)</option>
                            <option value="gemini-2.0-flash">Gemini 2.0 Flash (Sub-Second Latency)</option>
                            <option value="gemini-1.5-flash">Gemini 1.5 Flash (Factory Edge Optimized)</option>
                            <option value="gemini-1.5-pro">Gemini 1.5 Pro (Deep 1M+ Reasoning)</option>
                            <option value="automl-vision-custom">Vertex AI AutoML Vision (Custom Endpoint)</option>
                        </select>
                    </Field>

                    <Field label="Inspection Task Profile">
                        <select
                            value={selectedNode.params.taskMode || 'Defect Detection'}
                            onChange={e => updateParam('taskMode', e.target.value)}
                            style={selectStyle}
                        >
                            <option value="Defect Detection">Visual Defect & Micro-Crack Detection</option>
                            <option value="Assembly Verification">Assembly Verification & Poka-Yoke</option>
                            <option value="Visual QA / OCR">Extreme OCR & Dot-Peen Code Verification</option>
                            <option value="Root Cause Analysis">Auto 5-Why & Root Cause Analysis (RCA)</option>
                        </select>
                    </Field>

                    <Field label="Multimodal Inspection Prompt">
                        <textarea
                            value={selectedNode.params.inspectionPrompt || ''}
                            onChange={e => updateParam('inspectionPrompt', e.target.value)}
                            style={{ ...inputStyle, minHeight: '65px', resize: 'vertical', fontFamily: 'monospace', fontSize: '0.62rem', lineHeight: 1.3 }}
                            placeholder="Describe what Gemini / Vertex AI should inspect..."
                        />
                    </Field>

                    <Row>
                        <Field label="Confidence Threshold (%)">
                            <input
                                type="number"
                                min={50}
                                max={99}
                                value={selectedNode.params.confidenceThreshold || 85}
                                onChange={e => updateParam('confidenceThreshold', Number(e.target.value))}
                                style={inputStyle}
                            />
                        </Field>
                        <Field label="GCP Region">
                            <select
                                value={selectedNode.params.location || 'asia-southeast1'}
                                onChange={e => updateParam('location', e.target.value)}
                                style={selectStyle}
                            >
                                <option value="asia-southeast1">Jakarta (asia-southeast1)</option>
                                <option value="asia-east1">Taiwan (asia-east1)</option>
                                <option value="us-central1">Iowa (us-central1)</option>
                                <option value="europe-west1">Belgium (europe-west1)</option>
                            </select>
                        </Field>
                    </Row>

                    <Field label="GCP Project ID">
                        <input
                            type="text"
                            value={selectedNode.params.projectId || 'mavi-factory-ai'}
                            onChange={e => updateParam('projectId', e.target.value)}
                            style={inputStyle}
                            placeholder="e.g. your-gcp-project-id"
                        />
                    </Field>

                    {selectedNode.params.model === 'automl-vision-custom' && (
                        <Field label="Vertex AI Endpoint ID">
                            <input
                                type="text"
                                value={selectedNode.params.endpointId || ''}
                                onChange={e => updateParam('endpointId', e.target.value)}
                                style={inputStyle}
                                placeholder="e.g. projects/.../endpoints/123456"
                            />
                        </Field>
                    )}

                    <Field label="Auto-Quarantine to MES on NG">
                        <ToggleSwitch
                            checked={selectedNode.params.autoQuarantineOnFail !== false}
                            onChange={v => updateParam('autoQuarantineOnFail', v)}
                        />
                    </Field>

                    <Field label="Record to Quality Database">
                        <ToggleSwitch
                            checked={selectedNode.params.saveToMESLogs !== false}
                            onChange={v => updateParam('saveToMESLogs', v)}
                        />
                    </Field>
                </>)}

                {/* ── GOOGLE TEACHABLE MACHINE (EDGE AI) ── */}
                {selectedNode.type === 'teachable_machine' && (<>
                    <div style={{
                        padding: '10px 12px',
                        background: 'linear-gradient(135deg, rgba(66, 133, 244, 0.08) 0%, rgba(52, 168, 83, 0.08) 100%)',
                        border: '1px solid rgba(66, 133, 244, 0.25)',
                        borderRadius: '10px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#1a73e8', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <Bot size={13} color="#4285f4" /> Google Teachable Machine
                            </span>
                            <span style={{ fontSize: '0.55rem', fontWeight: 800, padding: '2px 6px', borderRadius: '4px', backgroundColor: '#e8f0fe', color: '#1a73e8', border: '1px solid #d2e3fc' }}>
                                ON-PREMISE EDGE
                            </span>
                        </div>
                        <p style={{ margin: 0, fontSize: '0.62rem', color: '#475569', lineHeight: 1.35 }}>
                            Zero-cloud-cost model inference in browser/IPC. Train models visually with webcams on Google Teachable Machine.
                        </p>
                    </div>

                    <button
                        onClick={handleTestTeachableMachine}
                        disabled={isTestingTeachable}
                        style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                            padding: '8px 12px', borderRadius: '8px', border: 'none',
                            backgroundColor: isTestingTeachable ? '#94a3b8' : '#4285f4', color: 'white',
                            fontWeight: 700, fontSize: '0.7rem', cursor: isTestingTeachable ? 'default' : 'pointer',
                            boxShadow: '0 2px 4px rgba(66, 133, 244, 0.2)'
                        }}
                    >
                        {isTestingTeachable ? (
                            <><RefreshCw size={13} className="animate-spin" /><span>Classifying Frame...</span></>
                        ) : (
                            <><Play size={12} fill="white" /><span>⚡ Run Teachable Machine Inference</span></>
                        )}
                    </button>

                    {selectedNode.lastTeachableInference && (
                        <div style={{
                            backgroundColor: selectedNode.lastTeachableInference.verdict === 'PASS' ? '#f0fdf4' : '#fef2f2',
                            border: `1px solid ${selectedNode.lastTeachableInference.verdict === 'PASS' ? '#bbf7d0' : '#fecaca'}`,
                            borderRadius: '8px', padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.65rem'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontWeight: 800, color: selectedNode.lastTeachableInference.verdict === 'PASS' ? '#15803d' : '#b91c1c' }}>
                                    Detected: {selectedNode.lastTeachableInference.topClass} ({selectedNode.lastTeachableInference.verdict})
                                </span>
                                <span style={{ color: '#64748b', fontSize: '0.58rem' }}>
                                    {selectedNode.lastTeachableInference.latencyMs}ms ({selectedNode.lastTeachableInference.confidence}%)
                                </span>
                            </div>
                        </div>
                    )}

                    <Field label="Hosted Model URL (Teachable Machine)">
                        <input
                            type="text"
                            value={selectedNode.params.modelUrl || ''}
                            onChange={e => updateParam('modelUrl', e.target.value)}
                            style={inputStyle}
                            placeholder="https://teachablemachine.withgoogle.com/models/.../"
                        />
                    </Field>

                    <Field label="Trained Classes (comma-separated)">
                        <input
                            type="text"
                            value={selectedNode.params.classes || 'OK, NG_Scratch, NG_Dent, Misaligned'}
                            onChange={e => updateParam('classes', e.target.value)}
                            style={inputStyle}
                            placeholder="OK, NG_Scratch, NG_Dent"
                        />
                    </Field>

                    <Row>
                        <Field label="Target PASS Class">
                            <input
                                type="text"
                                value={selectedNode.params.targetPassClass || 'OK'}
                                onChange={e => updateParam('targetPassClass', e.target.value)}
                                style={inputStyle}
                            />
                        </Field>
                        <Field label="Min Confidence (%)">
                            <input
                                type="number"
                                min={50} max={99}
                                value={selectedNode.params.minConfidence || 85}
                                onChange={e => updateParam('minConfidence', Number(e.target.value))}
                                style={inputStyle}
                            />
                        </Field>
                    </Row>

                    <Field label="Reject on Unknown / Low Confidence">
                        <ToggleSwitch
                            checked={selectedNode.params.rejectOnUnknown !== false}
                            onChange={v => updateParam('rejectOnUnknown', v)}
                        />
                    </Field>
                </>)}

                {/* ── GOOGLE CLOUD VISION OCR ── */}
                {selectedNode.type === 'google_ocr' && (<>
                    <div style={{
                        padding: '10px 12px',
                        background: 'linear-gradient(135deg, rgba(52, 168, 83, 0.08) 0%, rgba(251, 188, 5, 0.08) 100%)',
                        border: '1px solid rgba(52, 168, 83, 0.25)',
                        borderRadius: '10px',
                        display: 'flex', flexDirection: 'column', gap: '6px'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#137333', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <Sparkles size={13} color="#34a853" /> Google Cloud Vision OCR
                            </span>
                            <span style={{ fontSize: '0.55rem', fontWeight: 800, padding: '2px 6px', borderRadius: '4px', backgroundColor: '#e6f4ea', color: '#137333', border: '1px solid #ceead6' }}>
                                INDUSTRIAL OCR
                            </span>
                        </div>
                        <p style={{ margin: 0, fontSize: '0.62rem', color: '#475569', lineHeight: 1.35 }}>
                            High-precision text reading for laser-etched barcodes, dot-peen batch codes, and expiration stamps.
                        </p>
                    </div>

                    <button
                        onClick={handleTestGoogleOcr}
                        disabled={isTestingOcr}
                        style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                            padding: '8px 12px', borderRadius: '8px', border: 'none',
                            backgroundColor: isTestingOcr ? '#94a3b8' : '#34a853', color: 'white',
                            fontWeight: 700, fontSize: '0.7rem', cursor: isTestingOcr ? 'default' : 'pointer',
                            boxShadow: '0 2px 4px rgba(52, 168, 83, 0.2)'
                        }}
                    >
                        {isTestingOcr ? (
                            <><RefreshCw size={13} className="animate-spin" /><span>Reading Text via Google Vision...</span></>
                        ) : (
                            <><Play size={12} fill="white" /><span>⚡ Run Google OCR Inspection</span></>
                        )}
                    </button>

                    {selectedNode.lastOcrInference && (
                        <div style={{
                            backgroundColor: selectedNode.lastOcrInference.verdict === 'PASS' ? '#f0fdf4' : '#fef2f2',
                            border: `1px solid ${selectedNode.lastOcrInference.verdict === 'PASS' ? '#bbf7d0' : '#fecaca'}`,
                            borderRadius: '8px', padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.65rem'
                        }}>
                            <div style={{ fontWeight: 800, color: '#1e293b' }}>
                                Read: "{selectedNode.lastOcrInference.detectedText.split('\n')[0]}"
                            </div>
                            <span style={{ color: selectedNode.lastOcrInference.verdict === 'PASS' ? '#15803d' : '#b91c1c', fontWeight: 700 }}>
                                Verdict: {selectedNode.lastOcrInference.verdict} ({selectedNode.lastOcrInference.latencyMs}ms)
                            </span>
                        </div>
                    )}

                    <Field label="Google Cloud Vision API Key">
                        <input
                            type="password"
                            value={selectedNode.params.apiKey || ''}
                            onChange={e => updateParam('apiKey', e.target.value)}
                            style={inputStyle}
                            placeholder="Optional: Google Cloud API Key"
                        />
                    </Field>

                    <Field label="Expected Regex Pattern">
                        <input
                            type="text"
                            value={selectedNode.params.expectedPattern || 'LOT-[A-Z0-9]+'}
                            onChange={e => updateParam('expectedPattern', e.target.value)}
                            style={inputStyle}
                            placeholder="e.g. LOT-[A-Z0-9]+"
                        />
                    </Field>

                    <Field label="Exact Match Requirement (Optional)">
                        <input
                            type="text"
                            value={selectedNode.params.exactMatch || ''}
                            onChange={e => updateParam('exactMatch', e.target.value)}
                            style={inputStyle}
                            placeholder="e.g. BATCH-2026-X9"
                        />
                    </Field>
                </>)}

                {/* ── GOOGLE SHEETS & GCS LOGGER ── */}
                {selectedNode.type === 'google_logger' && (<>
                    <div style={{
                        padding: '10px 12px',
                        background: 'linear-gradient(135deg, rgba(15, 157, 88, 0.08) 0%, rgba(66, 133, 244, 0.08) 100%)',
                        border: '1px solid rgba(15, 157, 88, 0.25)',
                        borderRadius: '10px',
                        display: 'flex', flexDirection: 'column', gap: '6px'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#0f9d58', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <Database size={13} color="#0f9d58" /> Google Sheets & GCS Logger
                            </span>
                            <span style={{ fontSize: '0.55rem', fontWeight: 800, padding: '2px 6px', borderRadius: '4px', backgroundColor: '#e6f4ea', color: '#137333', border: '1px solid #ceead6' }}>
                                STREAMING LOG
                            </span>
                        </div>
                        <p style={{ margin: 0, fontSize: '0.62rem', color: '#475569', lineHeight: 1.35 }}>
                            Stream live QC passes, defect rates, and snapshot URLs to Google Sheets and Looker Studio.
                        </p>
                    </div>

                    <button
                        onClick={handleTestGoogleLogger}
                        disabled={isTestingLogger}
                        style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                            padding: '8px 12px', borderRadius: '8px', border: 'none',
                            backgroundColor: isTestingLogger ? '#94a3b8' : '#0f9d58', color: 'white',
                            fontWeight: 700, fontSize: '0.7rem', cursor: isTestingLogger ? 'default' : 'pointer',
                            boxShadow: '0 2px 4px rgba(15, 157, 88, 0.2)'
                        }}
                    >
                        {isTestingLogger ? (
                            <><RefreshCw size={13} className="animate-spin" /><span>Syncing to Google Sheets...</span></>
                        ) : (
                            <><Play size={12} fill="white" /><span>⚡ Test Live Sync</span></>
                        )}
                    </button>

                    <Field label="Logger Destination">
                        <select
                            value={selectedNode.params.targetType || 'Google Sheets Webhook'}
                            onChange={e => updateParam('targetType', e.target.value)}
                            style={selectStyle}
                        >
                            <option value="Google Sheets Webhook">Google Sheets (Apps Script Webhook)</option>
                            <option value="Google BigQuery">Google BigQuery Real-Time Stream</option>
                            <option value="Google Cloud Storage Archive">GCS Defect Snapshot Archive</option>
                        </select>
                    </Field>

                    <Field label="Google Sheets Webhook / Apps Script URL">
                        <input
                            type="text"
                            value={selectedNode.params.webhookUrl || ''}
                            onChange={e => updateParam('webhookUrl', e.target.value)}
                            style={inputStyle}
                            placeholder="https://script.google.com/macros/s/.../exec"
                        />
                    </Field>

                    <Field label="Target Sheet / Table Name">
                        <input
                            type="text"
                            value={selectedNode.params.sheetName || 'QC_Inspections_Live'}
                            onChange={e => updateParam('sheetName', e.target.value)}
                            style={inputStyle}
                        />
                    </Field>

                    <Field label="GCS Defect Bucket URL">
                        <input
                            type="text"
                            value={selectedNode.params.archiveGcsBucket || 'gs://mavi-ng-archive/'}
                            onChange={e => updateParam('archiveGcsBucket', e.target.value)}
                            style={inputStyle}
                        />
                    </Field>

                    <Field label="Log Only NG (Defects) Frames">
                        <ToggleSwitch
                            checked={selectedNode.params.logDefectsOnly === true}
                            onChange={v => updateParam('logDefectsOnly', v)}
                        />
                    </Field>
                </>)}

                {/* ── GOOGLE CLOUD STORAGE SOURCE ── */}
                {selectedNode.type === 'gcs_source' && (<>
                    <div style={{
                        padding: '10px 12px',
                        background: 'linear-gradient(135deg, rgba(26, 115, 232, 0.08) 0%, rgba(139, 92, 246, 0.08) 100%)',
                        border: '1px solid rgba(26, 115, 232, 0.25)',
                        borderRadius: '10px',
                        display: 'flex', flexDirection: 'column', gap: '6px'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#1a73e8', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <Cloud size={13} color="#1a73e8" /> GCS Image Stream Source
                            </span>
                            <span style={{ fontSize: '0.55rem', fontWeight: 800, padding: '2px 6px', borderRadius: '4px', backgroundColor: '#e8f0fe', color: '#1a73e8', border: '1px solid #d2e3fc' }}>
                                CLOUD SOURCE
                            </span>
                        </div>
                        <p style={{ margin: 0, fontSize: '0.62rem', color: '#475569', lineHeight: 1.35 }}>
                            Stream raw factory images or replay inspection batches stored in Google Cloud Storage or Google Drive.
                        </p>
                    </div>

                    <Field label="Google Cloud Storage Bucket URI">
                        <input
                            type="text"
                            value={selectedNode.params.bucketUrl || 'gs://mavi-quality-images-bucket/station-1/'}
                            onChange={e => updateParam('bucketUrl', e.target.value)}
                            style={inputStyle}
                            placeholder="gs://bucket-name/folder/"
                        />
                    </Field>

                    <Row>
                        <Field label="Poll Interval (sec)">
                            <input
                                type="number"
                                min={1} max={60}
                                value={selectedNode.params.pollIntervalSec || 5}
                                onChange={e => updateParam('pollIntervalSec', Number(e.target.value))}
                                style={inputStyle}
                            />
                        </Field>
                        <Field label="Prefix Filter">
                            <input
                                type="text"
                                value={selectedNode.params.filterPrefix || 'batch_2026'}
                                onChange={e => updateParam('filterPrefix', e.target.value)}
                                style={inputStyle}
                            />
                        </Field>
                    </Row>

                    <Field label="Auto-Loop Dataset Replay">
                        <ToggleSwitch
                            checked={selectedNode.params.autoLoop !== false}
                            onChange={v => updateParam('autoLoop', v)}
                        />
                    </Field>
                </>)}
            </div>
        </div>
    );
}

// ─── Reusable Sub-Components ──────────────────────────────────────

function Field({ label, children }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748b' }}>{label}</span>
            {children}
        </div>
    );
}

function Row({ children }) {
    return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>{children}</div>;
}

function ToggleSwitch({ checked, onChange }) {
    return (
        <label style={{ position: 'relative', display: 'inline-block', width: '34px', height: '20px', cursor: 'pointer' }}>
            <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} style={{ opacity: 0, width: 0, height: 0 }} />
            <span style={{
                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: checked ? '#10b981' : '#cbd5e1', transition: '.3s', borderRadius: '20px',
            }}>
                <span style={{
                    position: 'absolute', height: '14px', width: '14px', left: checked ? '16px' : '3px', bottom: '3px',
                    backgroundColor: 'white', transition: '.3s', borderRadius: '50%',
                }} />
            </span>
        </label>
    );
}

function CadLinkSection({ selectedNode, updateParam, drawingsList }) {
    return (
        <div style={{
            padding: '10px', backgroundColor: 'rgba(59, 130, 246, 0.05)',
            border: '1px solid rgba(59, 130, 246, 0.15)', borderRadius: '8px',
            display: 'flex', flexDirection: 'column', gap: '8px',
        }}>
            <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#2563eb', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Link size={12} /> CAD Drawing Integration
            </span>
            <Field label="Link CAD Model">
                <select
                    value={selectedNode.params.linkedDrawingId || ''}
                    onChange={e => { updateParam('linkedDrawingId', e.target.value); updateParam('linkedDimensionId', ''); }}
                    style={selectStyle}
                >
                    <option value="">Manual Entry (No CAD Link)</option>
                    {drawingsList.map(d => (<option key={d.id} value={d.id}>{d.name}</option>))}
                </select>
            </Field>
            {selectedNode.params.linkedDrawingId && (() => {
                const dwg = drawingsList.find(d => d.id === selectedNode.params.linkedDrawingId);
                const dims = dwg?.dimensions || [];
                return (
                    <Field label="Select CAD Dimension">
                        <select
                            value={selectedNode.params.linkedDimensionId || ''}
                            onChange={e => {
                                const dimId = e.target.value;
                                const dimObj = dims.find(d => d.id === dimId);
                                updateParam('linkedDimensionId', dimId);
                                if (dimObj) {
                                    updateParam('nominalSize', `${dimObj.spec} ${dimObj.unit || 'mm'}`);
                                    updateParam('lsl', dimObj.tolMin.toString());
                                    updateParam('usl', dimObj.tolMax.toString());
                                }
                            }}
                            style={selectStyle}
                        >
                            <option value="">-- Select CAD Feature --</option>
                            {dims.map(d => (<option key={d.id} value={d.id}>{d.label} (Spec: {d.spec})</option>))}
                        </select>
                    </Field>
                );
            })()}
        </div>
    );
}

// ─── Shared Styles ────────────────────────────────────────────────
const panelStyle = {
    backgroundColor: 'white', borderRadius: '16px', border: '1px solid #cbd5e1',
    padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0,
};
const headerStyle = {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: '12px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px',
};
const deleteBtnStyle = {
    border: 'none', backgroundColor: 'transparent', cursor: 'pointer',
    color: '#ef4444', display: 'flex', alignItems: 'center',
};
const inputStyle = {
    padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '6px',
    fontSize: '0.75rem', outline: 'none', width: '100%', boxSizing: 'border-box',
};
const selectStyle = {
    ...inputStyle, backgroundColor: 'white',
};

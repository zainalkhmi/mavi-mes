import React from 'react';
import { Trash2, HelpCircle, Link } from 'lucide-react';
import { NODE_TYPES } from './quickbuildToolTypes';

/**
 * QuickBuildNodeEditor — Full parameter editor for all 18 tool types.
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
                        <select value={selectedNode.params.camera || ''} onChange={e => updateParam('camera', e.target.value)} style={selectStyle}>
                            {cameraNames.map(name => (
                                <option key={name} value={name}>{name}</option>
                            ))}
                        </select>
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
                        <select value={selectedNode.params.camera || ''} onChange={e => updateParam('camera', e.target.value)} style={selectStyle}>
                            {cameraNames.map(name => (
                                <option key={name} value={name}>{name}</option>
                            ))}
                        </select>
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

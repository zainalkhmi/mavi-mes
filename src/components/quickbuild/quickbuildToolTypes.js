/**
 * QuickBuild Vision Tool Types — Complete Cognex-equivalent tool palette
 * 18 tool types organized into categories: Source, Filter, Locate, Measure, Inspect, Logic, Output
 */

// ─── Tool Category Definitions ────────────────────────────────────
export const TOOL_CATEGORIES = {
    source:  { label: 'Source',  color: '#3b82f6', icon: '📷' },
    filter:  { label: 'Filter',  color: '#8b5cf6', icon: '🔧' },
    locate:  { label: 'Locate',  color: '#06b6d4', icon: '🎯' },
    measure: { label: 'Measure', color: '#14b8a6', icon: '📏' },
    inspect: { label: 'Inspect', color: '#ec4899', icon: '🔬' },
    logic:   { label: 'Logic',   color: '#f97316', icon: '🧮' },
    output:  { label: 'Output',  color: '#f59e0b', icon: '⚡' },
};

// ─── Full Tool Type Registry ──────────────────────────────────────
export const NODE_TYPES = {
    // ── Source ──
    acquire: {
        color: '#3b82f6', icon: '📷', label: 'Acquire Image', category: 'source',
        desc: 'Camera capture, file input, or image database',
        defaultParams: { camera: 'Default IP Camera', trigger: 'Continuous', exposure: 'Auto', gain: 'Auto' },
        inputs: [],
        outputs: ['image'],
        simValue: () => 'Frame Captured (2048×1536)',
    },

    // ── Filter ──
    preprocess: {
        color: '#8b5cf6', icon: '🔧', label: 'Pre-Process', category: 'filter',
        desc: 'Grayscale, blur, threshold, morphology',
        defaultParams: { filter: 'Gaussian Blur', kernelSize: 5, threshold: 128, morphOp: 'None', morphKernel: 3 },
        inputs: ['image'],
        outputs: ['processed'],
        simValue: () => 'Gaussian 5×5 Applied',
    },

    // ── Locate ──
    locate: {
        color: '#06b6d4', icon: '🎯', label: 'Pattern Locate', category: 'locate',
        desc: 'Template matching & geometric alignment',
        defaultParams: { template: 'Reference_Template', angleTolerance: 10, scoreThreshold: 80 },
        inputs: ['image'],
        outputs: ['offset'],
        simValue: () => `Match: ${(88 + Math.random() * 10).toFixed(1)}% (X:+${Math.floor(Math.random()*20-10)}px)`,
    },
    patmax: {
        color: '#0ea5e9', icon: '🧲', label: 'PatMax Finder', category: 'locate',
        desc: 'Rotation & scale invariant pattern search',
        defaultParams: { template: '', angleRange: 360, scaleMin: 80, scaleMax: 120, acceptScore: 70, maxResults: 1 },
        inputs: ['image'],
        outputs: ['offset', 'score'],
        simValue: () => `PatMax: ${(90 + Math.random() * 9).toFixed(1)}% (θ=${(Math.random()*8-4).toFixed(1)}°)`,
    },
    blob: {
        color: '#22d3ee', icon: '🫧', label: 'Blob Analyzer', category: 'locate',
        desc: 'Blob detection: area, circularity, count',
        defaultParams: { minArea: 100, maxArea: 50000, circularity: 0.5, polarity: 'Light on Dark', maxBlobs: 10 },
        inputs: ['image'],
        outputs: ['blobs', 'count'],
        simValue: () => `Blobs: ${Math.floor(Math.random()*5+1)} found (Area: ${Math.floor(Math.random()*3000+500)}px²)`,
    },
    edge: {
        color: '#67e8f9', icon: '📐', label: 'Edge Detector', category: 'locate',
        desc: 'Canny/Sobel edge detection',
        defaultParams: { algorithm: 'Canny', lowThreshold: 50, highThreshold: 150, kernelSize: 3, direction: 'Both' },
        inputs: ['image'],
        outputs: ['edges'],
        simValue: () => `Edges: ${Math.floor(Math.random()*200+50)} points detected`,
    },

    // ── Measure ──
    measure: {
        color: '#14b8a6', icon: '📏', label: 'Caliper Measure', category: 'measure',
        desc: 'Sub-pixel edge-to-edge caliper',
        defaultParams: { tool: 'Caliper Edge-to-Edge', nominalSize: '10.0 mm', lsl: '9.8', usl: '10.2', linkedDrawingId: '', linkedDimensionId: '' },
        inputs: ['image', 'offset'],
        outputs: ['dimension'],
        simValue: (params) => {
            const nom = parseFloat(params?.nominalSize) || 10.0;
            const val = (nom + (Math.random() * 0.2 - 0.1)).toFixed(2);
            const lsl = parseFloat(params?.lsl) || 9.8;
            const usl = parseFloat(params?.usl) || 10.2;
            const pass = val >= lsl && val <= usl;
            return `${val} mm [${pass ? 'PASS' : 'FAIL'}]`;
        },
    },
    circle_gauge: {
        color: '#2dd4bf', icon: '⭕', label: 'Circle Gauge', category: 'measure',
        desc: 'Circle fitting: center, radius, runout',
        defaultParams: { expectedRadius: 50, radiusTolerance: 5, minScore: 80, measureMode: 'Best Fit' },
        inputs: ['image', 'offset'],
        outputs: ['radius', 'center', 'runout'],
        simValue: (params) => {
            const r = parseFloat(params?.expectedRadius) || 50;
            const meas = (r + (Math.random() * 2 - 1)).toFixed(2);
            return `R=${meas}px, Runout=${(Math.random()*0.5).toFixed(2)}px [PASS]`;
        },
    },
    line_fitter: {
        color: '#5eead4', icon: '📈', label: 'Line Fitter', category: 'measure',
        desc: 'Best-fit line: angle, intercept, deviation',
        defaultParams: { edgePolarity: 'Dark to Light', numPoints: 20, projectionLength: 100, lineThickness: 2 },
        inputs: ['image', 'offset'],
        outputs: ['line', 'angle'],
        simValue: () => `Angle: ${(89.5 + Math.random()).toFixed(2)}° Dev: ${(Math.random()*0.3).toFixed(2)}px`,
    },
    angle_measure: {
        color: '#99f6e4', icon: '📐', label: 'Angle Measure', category: 'measure',
        desc: 'Angle between two lines or edges',
        defaultParams: { line1Source: '', line2Source: '', expectedAngle: 90, tolerance: 2 },
        inputs: ['line1', 'line2'],
        outputs: ['angle'],
        simValue: (params) => {
            const expected = parseFloat(params?.expectedAngle) || 90;
            const val = (expected + (Math.random() * 2 - 1)).toFixed(2);
            return `Angle: ${val}° [PASS]`;
        },
    },
    caliper_array: {
        color: '#14b8a6', icon: '📏', label: 'Caliper Array', category: 'measure',
        desc: 'Detects parallel/linear multiple edge points & fits line (RANSAC)',
        defaultParams: { expectedDistance: 120, edgePolarity: 'Dark to Light', numCalipers: 10, caliperWidth: 20, caliperLength: 60, fixtureSource: '' },
        inputs: ['image', 'offset'],
        outputs: ['distance', 'points', 'angle'],
        simValue: (params) => {
            const exp = parseFloat(params?.expectedDistance) || 120;
            const val = (exp + (Math.random() * 1.5 - 0.75)).toFixed(2);
            return `Dist: ${val}px, Points: ${params?.numCalipers || 10}/${params?.numCalipers || 10} [PASS]`;
        },
    },
    radial_caliper: {
        color: '#0d9488', icon: '🌀', label: 'Radial Caliper', category: 'measure',
        desc: 'Detects circular edges radially inside circle sector / annulus',
        defaultParams: { expectedRadius: 80, radiusTolerance: 5, numCalipers: 16, startAngle: 0, endAngle: 360, edgePolarity: 'Any', fixtureSource: '' },
        inputs: ['image', 'offset'],
        outputs: ['radius', 'center', 'dev'],
        simValue: (params) => {
            const r = parseFloat(params?.expectedRadius) || 80;
            const val = (r + (Math.random() * 0.8 - 0.4)).toFixed(2);
            return `R: ${val}px, Center: (320, 240) [PASS]`;
        },
    },

    // ── Inspect ──
    color_extract: {
        color: '#f472b6', icon: '🎨', label: 'Color Extractor', category: 'inspect',
        desc: 'HSV/RGB color analysis & matching',
        defaultParams: { colorSpace: 'HSV', targetHue: 120, hueTolerance: 15, minSaturation: 50, minValue: 50 },
        inputs: ['image'],
        outputs: ['colorMatch', 'dominant'],
        simValue: () => `H:${Math.floor(Math.random()*180)} S:${Math.floor(Math.random()*100+50)}% [MATCH]`,
    },
    histogram: {
        color: '#f9a8d4', icon: '📊', label: 'Histogram Check', category: 'inspect',
        desc: 'Image intensity distribution analysis',
        defaultParams: { channel: 'Grayscale', expectedMean: 128, meanTolerance: 30, expectedStdDev: 40, stdDevTol: 15 },
        inputs: ['image'],
        outputs: ['mean', 'stddev'],
        simValue: () => `Mean: ${Math.floor(Math.random()*60+100)} StdDev: ${Math.floor(Math.random()*20+25)} [PASS]`,
    },
    inspect: {
        color: '#ec4899', icon: '🔬', label: 'OCR/OCV/Anomaly', category: 'inspect',
        desc: 'OCR reading, OCV verification, anomaly detection',
        defaultParams: { mode: 'OCR Reading', language: 'English', matchPattern: '.*', referenceSource: '', thresholdArea: 50, similarityThreshold: 85 },
        inputs: ['image'],
        outputs: ['text', 'defects'],
        simValue: (params) => {
            const mode = params?.mode || 'OCR Reading';
            if (mode === 'OCV Verification') return 'OCV: Match 100% [LOT-8924A]';
            if (mode === 'Anomaly Segmentation') return `Scratch Area: ${Math.floor(Math.random()*30)}px² [PASS]`;
            if (mode === 'Barcode Code Scanning') return 'QR: https://mavi.vetaure.com [DECODED]';
            return 'OCR EXP: 12/28 [MATCH]';
        },
    },
    barcode: {
        color: '#db2777', icon: '📱', label: 'Barcode/QR Reader', category: 'inspect',
        desc: '1D/2D barcode & QR code decode',
        defaultParams: { symbology: 'Auto', expectedFormat: '', verifyChecksum: true, maxCodes: 1 },
        inputs: ['image'],
        outputs: ['decoded', 'format'],
        simValue: () => `Code128: "LOT-8924A-EXP1228" [VERIFIED]`,
    },
    bead_inspection: {
        color: '#f43f5e', icon: '〰️', label: 'Bead Inspector', category: 'inspect',
        desc: 'Inspect width, continuity, and position of adhesive/sealant beads',
        defaultParams: { beadColor: 'Dark', expectedWidth: 8, widthTolerance: 3, maxGapLength: 5 },
        inputs: ['image'],
        outputs: ['status', 'minWidth', 'maxWidth'],
        simValue: (params) => {
            const w = parseFloat(params?.expectedWidth) || 8;
            const tol = parseFloat(params?.widthTolerance) || 3;
            const meas = (w + (Math.random() * 2 - 1)).toFixed(1);
            const pass = Math.abs(meas - w) <= tol;
            return `Width: ${meas}px, Gaps: 0 [${pass ? 'PASS' : 'FAIL'}]`;
        },
    },

    // ── Logic ──
    math_formula: {
        color: '#fb923c', icon: '🧮', label: 'Math / Formula', category: 'logic',
        desc: 'Arithmetic on measurements (A+B, ratio, etc.)',
        defaultParams: { formula: 'A + B', inputA: '', inputB: '', outputLabel: 'Result', precision: 2 },
        inputs: ['valueA', 'valueB'],
        outputs: ['result'],
        simValue: () => `Result: ${(Math.random()*50+10).toFixed(2)}`,
    },
    comparator: {
        color: '#fdba74', icon: '⚖️', label: 'Comparator', category: 'logic',
        desc: 'Compare value vs spec or variable (>, <, range)',
        defaultParams: { compareMode: 'Range', lowerBound: 0, upperBound: 100, referenceVar: '', passCondition: 'In Range' },
        inputs: ['value'],
        outputs: ['pass', 'deviation'],
        simValue: () => `Value: 45.2 ∈ [0, 100] → PASS`,
    },

    // ── Output ──
    data_logger: {
        color: '#fbbf24', icon: '💾', label: 'Data Logger', category: 'output',
        desc: 'Write results to database, CSV, or variable',
        defaultParams: { target: 'Supabase', tableName: 'inspection_logs', includeImage: false, variableTarget: '' },
        inputs: ['data'],
        outputs: ['logId'],
        simValue: () => `Logged → inspection_logs #${Math.floor(Math.random()*9000+1000)}`,
    },
    decide: {
        color: '#f59e0b', icon: '⚡', label: 'Yield Judge', category: 'output',
        desc: 'Pass/Fail pipeline decision & output actions',
        defaultParams: { minPassedScore: 95, failAction: 'Stop conveyor', passAction: 'Signal Green Light', writeToPlc: false, plcAddress: '' },
        inputs: ['dimension', 'defects'],
        outputs: ['status'],
        simValue: () => 'PIPELINE PASS',
    },
    geom_construction: {
        color: '#14b8a6', icon: '📐', label: 'Geometry Construct', category: 'measure',
        desc: 'Constructs geometric relations (Line-Line intersection, Point-Line distance)',
        defaultParams: { geomMode: 'Line-Line Intersection', ref1: '', ref2: '', nominalVal: '0.0', tolerance: '0.5' },
        inputs: ['ref1', 'ref2'],
        outputs: ['resultX', 'resultY', 'distance'],
        simValue: (params) => {
            const mode = params?.geomMode || 'Line-Line Intersection';
            if (mode === 'Line-Line Intersection') return `Intersection: (${(Math.random()*100+250).toFixed(1)}, ${(Math.random()*100+180).toFixed(1)})`;
            if (mode === 'Point-Line Distance') return `Dist: ${(Math.random()*2+5).toFixed(2)}px`;
            return `Dist: ${(Math.random()*3+15).toFixed(2)}px`;
        },
    },
    grid_calibration: {
        color: '#8b5cf6', icon: '🏁', label: 'Grid Calibration', category: 'filter',
        desc: 'N-Point/Checkerboard calibration to real world coordinates (mm)',
        defaultParams: { calibMode: 'Checkerboard Grid', pxPerMm: 4.25, originX: 0, originY: 0, showGrid: true },
        inputs: ['image'],
        outputs: ['calibratedImage', 'scaleMatrix'],
        simValue: (params) => {
            return `Grid Calibrated: 1px = ${(1 / (params?.pxPerMm || 4.25)).toFixed(3)} mm`;
        },
    },
    spatial_flaw: {
        color: '#ec4899', icon: '🕸️', label: 'Spatial Flaw Detector', category: 'inspect',
        desc: 'Fourier FFT / Local Adaptive Scratch and pit finder in textures',
        defaultParams: { sensitivity: 80, minArea: 5, filterSize: 15, maxDefects: 5 },
        inputs: ['image'],
        outputs: ['defectsCount', 'defectRegions'],
        simValue: (params) => {
            const cnt = Math.random() > 0.7 ? 1 : 0;
            return cnt > 0 ? `NG: 1 scratch detected (Area: ${(Math.random()*15+5).toFixed(1)}px²)` : 'PASS: No flaws detected';
        },
    },
    dpm_enhancer: {
        color: '#8b5cf6', icon: '🔲', label: 'Barcode DPM Enhancer', category: 'filter',
        desc: 'Advanced Otsu local contrast & morphology binarization for laser-marked barcodes',
        defaultParams: { localRadius: 15, morphCloseSize: 3, contrastGain: 1.5 },
        inputs: ['image'],
        outputs: ['enhancedImage'],
        simValue: () => 'DPM Contrast Repaired',
    },
    polar_unwrap: {
        color: '#8b5cf6', icon: '🍩', label: 'Polar Unwrapper', category: 'filter',
        desc: 'Unrolls circular/arc regions to linear rectangle strip for standard OCR/Barcode readers',
        defaultParams: { cx: 320, cy: 240, innerRadius: 50, outerRadius: 150, direction: 'Clockwise' },
        inputs: ['image', 'offset'],
        outputs: ['unwrappedImage'],
        simValue: () => 'Circular Arc unwrapped to 800x120px strip',
    },
    searchmax: {
        color: '#06b6d4', icon: '🎨', label: 'SearchMax Color', category: 'locate',
        desc: 'Geometric color pattern matching invariant to rotation, scale, and lighting',
        defaultParams: { template: 'Color_Part_Ref', acceptScore: 75, matchHue: true, maxResults: 1 },
        inputs: ['image'],
        outputs: ['offset', 'score', 'colorDiff'],
        simValue: (params) => {
            const accept = params?.acceptScore || 75;
            const score = (92.4 + Math.random()*4).toFixed(1);
            return `ColorMatch: ${score}% [PASS] (Hue Diff: ${(Math.random()*1.5).toFixed(2)}°)`;
        },
    },
    golden_template: {
        color: '#ec4899', icon: '🔍', label: 'Golden Comparator', category: 'inspect',
        desc: 'Pixel-by-pixel comparisons vs Golden Image reference or DXF CAD file',
        defaultParams: { tolerancePixels: 2.0, rejectOnMissing: true, cadFile: 'industrial-flange-rev2.dxf' },
        inputs: ['image', 'offset'],
        outputs: ['deviationArea', 'defects'],
        simValue: () => `CAD Dev: 0.12px, Missing Features: 0 [PASS]`,
    },
    vidi_ai: {
        color: '#ec4899', icon: '🧠', label: 'ViDi AI Segmenter', category: 'inspect',
        desc: 'Deep learning classification & textured defect segmentation (Red-Analyze & Green-Classify)',
        defaultParams: { modelMode: 'Red-Analyze (Anomaly)', minConfidence: 85, modelWeights: 'vidi-flange-anomaly.weights' },
        inputs: ['image'],
        outputs: ['classLabel', 'confidence', 'defectMask'],
        simValue: (params) => {
            const mode = params?.modelMode || 'Red-Analyze (Anomaly)';
            if (mode === 'Green-Classify (Class)') return 'Classify: Flange_Type_A [Conf: 99.4%]';
            return 'DL Anomaly Score: 12.5% [PASS]';
        },
    },
};

// ─── Helper: Get ordered category keys for sidebar grouping ───────
export const CATEGORY_ORDER = ['source', 'filter', 'locate', 'measure', 'inspect', 'logic', 'output'];

// ─── Helper: Get tools grouped by category ────────────────────────
export function getToolsByCategory() {
    const groups = {};
    for (const cat of CATEGORY_ORDER) {
        groups[cat] = {
            ...TOOL_CATEGORIES[cat],
            tools: [],
        };
    }
    for (const [typeId, toolDef] of Object.entries(NODE_TYPES)) {
        const cat = toolDef.category;
        if (groups[cat]) {
            groups[cat].tools.push({ typeId, ...toolDef });
        }
    }
    return groups;
}

// ─── Helper: Create a new node instance from a tool type ──────────
export function createNodeFromType(type) {
    const def = NODE_TYPES[type];
    if (!def) return null;

    return {
        id: `node_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        type,
        name: `New ${def.label}`,
        x: 80 + Math.random() * 120,
        y: 80 + Math.random() * 120,
        params: { ...def.defaultParams },
        inputs: [...(def.inputs || [])],
        outputs: [...(def.outputs || [])],
        status: 'idle',
        value: null,
        roiRegion: null,   // linked ROI overlay region
    };
}

// ─── Helper: Generate simulation value for a node ─────────────────
export function getSimulatedValue(node) {
    const def = NODE_TYPES[node.type];
    if (!def || !def.simValue) return 'Processed';
    return def.simValue(node.params);
}

// ─── Default Workspace Template ───────────────────────────────────
export function createDefaultWorkspace() {
    return {
        id: `ws_${Date.now()}`,
        name: 'Untitled Workspace',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        activeJobIndex: 0,
        globalVariables: [],
        jobs: [
            createDefaultJob('Job 1'),
        ],
    };
}

export function createDefaultJob(name = 'New Job') {
    return {
        id: `job_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        name,
        nodes: [],
        links: [],
        imageSource: { type: 'upload', camera: '', trigger: 'Continuous' },
        roiRegions: [],
        lastRunResult: null,
    };
}

// ─── Built-in Templates ───────────────────────────────────────────
export const TEMPLATES = [
    {
        name: 'Flange Connector Check',
        description: 'Locate a flange metal component, verify center bore diameter, and check for surface scratches.',
        nodes: [
            { id: 'n_acq', type: 'acquire', name: 'Acquire Frame', x: 60, y: 220, params: { camera: 'Main Inspection Camera', trigger: 'PLC Continuous', exposure: 'Auto', gain: 'Auto' }, inputs: [], outputs: ['image'], status: 'idle', value: null, roiRegion: null },
            { id: 'n_pre', type: 'preprocess', name: 'Denoise Filter', x: 280, y: 110, params: { filter: 'Gaussian Blur', kernelSize: 3, threshold: 128, morphOp: 'None', morphKernel: 3 }, inputs: ['image'], outputs: ['processed'], status: 'idle', value: null, roiRegion: null },
            { id: 'n_loc', type: 'locate', name: 'Geometric Align', x: 280, y: 330, params: { template: 'flange_rim_align', angleTolerance: 15, scoreThreshold: 85 }, inputs: ['image'], outputs: ['offset'], status: 'idle', value: null, roiRegion: null },
            { id: 'n_meas', type: 'measure', name: 'Bore Caliper', x: 520, y: 110, params: { tool: 'Caliper Edge-to-Edge', nominalSize: '25.0 mm', lsl: '24.9', usl: '25.1', linkedDrawingId: '', linkedDimensionId: '' }, inputs: ['image', 'offset'], outputs: ['dimension'], status: 'idle', value: null, roiRegion: null },
            { id: 'n_circ', type: 'circle_gauge', name: 'Bore Circle Fit', x: 520, y: 240, params: { expectedRadius: 50, radiusTolerance: 5, minScore: 80, measureMode: 'Best Fit' }, inputs: ['image', 'offset'], outputs: ['radius', 'center', 'runout'], status: 'idle', value: null, roiRegion: null },
            { id: 'n_ins', type: 'inspect', name: 'Scratch Detect', x: 520, y: 370, params: { mode: 'Anomaly Segmentation', thresholdArea: 50 }, inputs: ['image'], outputs: ['text', 'defects'], status: 'idle', value: null, roiRegion: null },
            { id: 'n_dec', type: 'decide', name: 'Yield Judge', x: 790, y: 240, params: { minPassedScore: 90, failAction: 'Trigger Alert Light', passAction: 'Signal Green Light', writeToPlc: false, plcAddress: '' }, inputs: ['dimension', 'defects'], outputs: ['status'], status: 'idle', value: null, roiRegion: null }
        ],
        links: [
            { id: 'l1', fromNode: 'n_acq', fromPin: 'image', toNode: 'n_pre', toPin: 'image' },
            { id: 'l2', fromNode: 'n_acq', fromPin: 'image', toNode: 'n_loc', toPin: 'image' },
            { id: 'l3', fromNode: 'n_pre', fromPin: 'processed', toNode: 'n_meas', toPin: 'image' },
            { id: 'l4', fromNode: 'n_loc', fromPin: 'offset', toNode: 'n_meas', toPin: 'offset' },
            { id: 'l5', fromNode: 'n_loc', fromPin: 'offset', toNode: 'n_circ', toPin: 'offset' },
            { id: 'l6', fromNode: 'n_pre', fromPin: 'processed', toNode: 'n_circ', toPin: 'image' },
            { id: 'l7', fromNode: 'n_acq', fromPin: 'image', toNode: 'n_ins', toPin: 'image' },
            { id: 'l8', fromNode: 'n_meas', fromPin: 'dimension', toNode: 'n_dec', toPin: 'dimension' },
            { id: 'l9', fromNode: 'n_ins', fromPin: 'defects', toNode: 'n_dec', toPin: 'defects' }
        ]
    },
    {
        name: 'Lot Expiry OCR & OCV Verify',
        description: 'Read expiry details printed on product packaging and verify details against active batch ID.',
        nodes: [
            { id: 'n_acq', type: 'acquire', name: 'Acquire Packaging', x: 80, y: 240, params: { camera: 'Packaging Line Camera', trigger: 'Sensor Trigger', exposure: 'Auto', gain: 'Auto' }, inputs: [], outputs: ['image'], status: 'idle', value: null, roiRegion: null },
            { id: 'n_pre', type: 'preprocess', name: 'Contrast Enhance', x: 300, y: 120, params: { filter: 'CLAHE', kernelSize: 3, threshold: 128, morphOp: 'None', morphKernel: 3 }, inputs: ['image'], outputs: ['processed'], status: 'idle', value: null, roiRegion: null },
            { id: 'n_bar', type: 'barcode', name: 'Barcode Scanner', x: 300, y: 360, params: { symbology: 'Auto', expectedFormat: '', verifyChecksum: true, maxCodes: 1 }, inputs: ['image'], outputs: ['decoded', 'format'], status: 'idle', value: null, roiRegion: null },
            { id: 'n_ocr', type: 'inspect', name: 'Tesseract OCR', x: 520, y: 120, params: { mode: 'OCR Reading', language: 'English', matchPattern: 'EXP:\\\\s*\\\\d{2}/\\\\d{2}' }, inputs: ['image'], outputs: ['text', 'defects'], status: 'idle', value: null, roiRegion: null },
            { id: 'n_ocv', type: 'inspect', name: 'OCV Validator', x: 520, y: 360, params: { mode: 'OCV Verification', referenceSource: 'Variable: Active_Batch_Code', similarityThreshold: 85 }, inputs: ['image'], outputs: ['text', 'defects'], status: 'idle', value: null, roiRegion: null },
            { id: 'n_log', type: 'data_logger', name: 'Log Result', x: 760, y: 120, params: { target: 'Supabase', tableName: 'inspection_logs', includeImage: false, variableTarget: '' }, inputs: ['data'], outputs: ['logId'], status: 'idle', value: null, roiRegion: null },
            { id: 'n_dec', type: 'decide', name: 'PLC Reject Control', x: 760, y: 360, params: { minPassedScore: 100, failAction: 'Activate Reject Arm', passAction: 'Signal Green Light', writeToPlc: false, plcAddress: '' }, inputs: ['dimension', 'defects'], outputs: ['status'], status: 'idle', value: null, roiRegion: null }
        ],
        links: [
            { id: 'l1', fromNode: 'n_acq', fromPin: 'image', toNode: 'n_pre', toPin: 'image' },
            { id: 'l2', fromNode: 'n_acq', fromPin: 'image', toNode: 'n_bar', toPin: 'image' },
            { id: 'l3', fromNode: 'n_pre', fromPin: 'processed', toNode: 'n_ocr', toPin: 'image' },
            { id: 'l4', fromNode: 'n_ocr', fromPin: 'text', toNode: 'n_ocv', toPin: 'image' },
            { id: 'l5', fromNode: 'n_ocr', fromPin: 'text', toNode: 'n_log', toPin: 'data' },
            { id: 'l6', fromNode: 'n_ocv', fromPin: 'defects', toNode: 'n_dec', toPin: 'defects' },
            { id: 'l7', fromNode: 'n_bar', fromPin: 'decoded', toNode: 'n_dec', toPin: 'dimension' }
        ]
    },
    {
        name: 'Color & Dimensional QC',
        description: 'Full dimensional + color inspection: blob detection, circle gauge, color verification, and histogram analysis.',
        nodes: [
            { id: 'n_acq', type: 'acquire', name: 'Acquire Part', x: 60, y: 280, params: { camera: 'Main Inspection Camera', trigger: 'PLC Continuous', exposure: 'Auto', gain: 'Auto' }, inputs: [], outputs: ['image'], status: 'idle', value: null, roiRegion: null },
            { id: 'n_pre', type: 'preprocess', name: 'Smooth Filter', x: 280, y: 140, params: { filter: 'Median', kernelSize: 5, threshold: 128, morphOp: 'None', morphKernel: 3 }, inputs: ['image'], outputs: ['processed'], status: 'idle', value: null, roiRegion: null },
            { id: 'n_blob', type: 'blob', name: 'Find Components', x: 280, y: 420, params: { minArea: 500, maxArea: 50000, circularity: 0.3, polarity: 'Light on Dark', maxBlobs: 5 }, inputs: ['image'], outputs: ['blobs', 'count'], status: 'idle', value: null, roiRegion: null },
            { id: 'n_circ', type: 'circle_gauge', name: 'Hole Gauge', x: 520, y: 140, params: { expectedRadius: 30, radiusTolerance: 3, minScore: 85, measureMode: 'Best Fit' }, inputs: ['image', 'offset'], outputs: ['radius', 'center', 'runout'], status: 'idle', value: null, roiRegion: null },
            { id: 'n_color', type: 'color_extract', name: 'Color Verify', x: 520, y: 340, params: { colorSpace: 'HSV', targetHue: 120, hueTolerance: 15, minSaturation: 50, minValue: 50 }, inputs: ['image'], outputs: ['colorMatch', 'dominant'], status: 'idle', value: null, roiRegion: null },
            { id: 'n_hist', type: 'histogram', name: 'Brightness Check', x: 520, y: 560, params: { channel: 'Grayscale', expectedMean: 128, meanTolerance: 30, expectedStdDev: 40, stdDevTol: 15 }, inputs: ['image'], outputs: ['mean', 'stddev'], status: 'idle', value: null, roiRegion: null },
            { id: 'n_dec', type: 'decide', name: 'Final Judge', x: 780, y: 280, params: { minPassedScore: 90, failAction: 'Trigger Alert Light', passAction: 'Signal Green Light', writeToPlc: false, plcAddress: '' }, inputs: ['dimension', 'defects'], outputs: ['status'], status: 'idle', value: null, roiRegion: null }
        ],
        links: [
            { id: 'l1', fromNode: 'n_acq', fromPin: 'image', toNode: 'n_pre', toPin: 'image' },
            { id: 'l2', fromNode: 'n_acq', fromPin: 'image', toNode: 'n_blob', toPin: 'image' },
            { id: 'l3', fromNode: 'n_pre', fromPin: 'processed', toNode: 'n_circ', toPin: 'image' },
            { id: 'l4', fromNode: 'n_blob', fromPin: 'blobs', toNode: 'n_circ', toPin: 'offset' },
            { id: 'l5', fromNode: 'n_acq', fromPin: 'image', toNode: 'n_color', toPin: 'image' },
            { id: 'l6', fromNode: 'n_acq', fromPin: 'image', toNode: 'n_hist', toPin: 'image' },
            { id: 'l7', fromNode: 'n_circ', fromPin: 'radius', toNode: 'n_dec', toPin: 'dimension' },
            { id: 'l8', fromNode: 'n_color', fromPin: 'colorMatch', toNode: 'n_dec', toPin: 'defects' }
        ]
    }
];

// ─── Default CAD Drawings ─────────────────────────────────────────
export const DEFAULT_DRAWINGS = [
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

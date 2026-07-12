const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, 'src', 'components', 'DrawingManager.jsx');
let content = fs.readFileSync(targetPath, 'utf8');

// Normalize line endings to LF (\n)
content = content.replace(/\r\n/g, '\n');

console.log('Original file size:', content.length);

// ==========================================
// STEP 1: Extract buttons from Floating Toolbar & remove it
// ==========================================
const toolbarStartMarker = '                                    {/* Floating Drawing Toolbar (Top Center) */}';
const toolbarEndMarker = '                                    {/* Floating Zoom Control Pill */}';

const startIndex = content.indexOf(toolbarStartMarker);
const endIndex = content.indexOf(toolbarEndMarker);

if (startIndex === -1 || endIndex === -1) {
    console.error('ERROR: Could not find floating toolbar block.');
    process.exit(1);
}

// Find closing div of the floating toolbar
const toolbarRawSection = content.substring(startIndex, endIndex);
const lastDivIndex = toolbarRawSection.lastIndexOf('</div>');
if (lastDivIndex === -1) {
    console.error('ERROR: Could not locate closing div of floating toolbar.');
    process.exit(1);
}

const toolbarFullCode = content.substring(startIndex, startIndex + lastDivIndex + 6);

// Extract the buttons content
const innerPillStart = toolbarFullCode.indexOf('<div style={{', toolbarFullCode.indexOf('{/* Floating Drawing Toolbar'));
const innerPillEnd = toolbarFullCode.lastIndexOf('</div>');
const buttonsContent = toolbarFullCode.substring(innerPillStart, innerPillEnd + 6);

// Remove floating toolbar from Canvas SVG container
content = content.replace(toolbarFullCode, '');
console.log('SUCCESS: Removed floating toolbar overlay.');

// ==========================================
// STEP 2: Redesign buttons to look like separate rounded widget cards
// ==========================================
let updatedButtons = buttonsContent;

const buttonReplacements = [
    {
        name: 'Pilih',
        findStyle: `                                                background: 'none', border: 'none', padding: '6px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center',
                                                cursor: 'pointer', borderRadius: '8px', gap: '3px', transition: 'all 0.15s', outline: 'none',
                                                color: cadTool === 'select' ? '#2563eb' : '#64748b',
                                                backgroundColor: cadTool === 'select' ? '#eff6ff' : 'transparent'`,
        replaceStyle: `                                                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                                padding: '8px 12px', borderRadius: '12px', cursor: 'pointer', outline: 'none',
                                                minWidth: '72px', height: '64px', gap: '4px', transition: 'all 0.2s',
                                                border: cadTool === 'select' ? '1px solid #3b82f6' : '1px solid #e2e8f0',
                                                color: cadTool === 'select' ? '#2563eb' : '#64748b',
                                                backgroundColor: cadTool === 'select' ? '#eff6ff' : '#ffffff',
                                                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'`
    },
    {
        name: 'Pan',
        findStyle: `                                                background: 'none', border: 'none', padding: '6px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center',
                                                cursor: 'pointer', borderRadius: '8px', gap: '3px', transition: 'all 0.15s', outline: 'none',
                                                color: cadTool === 'pan' ? '#2563eb' : '#64748b',
                                                backgroundColor: cadTool === 'pan' ? '#eff6ff' : 'transparent'`,
        replaceStyle: `                                                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                                padding: '8px 12px', borderRadius: '12px', cursor: 'pointer', outline: 'none',
                                                minWidth: '72px', height: '64px', gap: '4px', transition: 'all 0.2s',
                                                border: cadTool === 'pan' ? '1px solid #3b82f6' : '1px solid #e2e8f0',
                                                color: cadTool === 'pan' ? '#2563eb' : '#64748b',
                                                backgroundColor: cadTool === 'pan' ? '#eff6ff' : '#ffffff',
                                                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'`
    },
    {
        name: 'Zoom',
        findStyle: `                                                background: 'none', border: 'none', padding: '6px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center',
                                                cursor: 'pointer', borderRadius: '8px', gap: '3px', transition: 'all 0.15s', outline: 'none',
                                                color: '#64748b'`,
        replaceStyle: `                                                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                                padding: '8px 12px', borderRadius: '12px', cursor: 'pointer', outline: 'none',
                                                minWidth: '72px', height: '64px', gap: '4px', transition: 'all 0.2s',
                                                border: '1px solid #e2e8f0',
                                                color: '#64748b',
                                                backgroundColor: '#ffffff',
                                                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'`
    },
    {
        name: 'Garis',
        findStyle: `                                                    background: 'none', border: 'none', padding: '6px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center',
                                                    cursor: 'pointer', borderRadius: '8px', gap: '3px', transition: 'all 0.15s', outline: 'none',
                                                    color: cadTool === 'line' ? '#2563eb' : '#64748b',
                                                    backgroundColor: cadTool === 'line' ? '#eff6ff' : 'transparent'`,
        replaceStyle: `                                                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                                    padding: '8px 12px', borderRadius: '12px', cursor: 'pointer', outline: 'none',
                                                    minWidth: '72px', height: '64px', gap: '4px', transition: 'all 0.2s',
                                                    border: cadTool === 'line' ? '1px solid #3b82f6' : '1px solid #e2e8f0',
                                                    color: cadTool === 'line' ? '#2563eb' : '#64748b',
                                                    backgroundColor: cadTool === 'line' ? '#eff6ff' : '#ffffff',
                                                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'`
    },
    {
        name: 'Bentuk',
        findStyle: `                                                    background: 'none', border: 'none', padding: '6px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center',
                                                    cursor: 'pointer', borderRadius: '8px', gap: '3px', transition: 'all 0.15s', outline: 'none',
                                                    color: ['rect', 'circle', 'arc'].includes(cadTool) ? '#2563eb' : '#64748b',
                                                    backgroundColor: ['rect', 'circle', 'arc'].includes(cadTool) ? '#eff6ff' : 'transparent'`,
        replaceStyle: `                                                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                                    padding: '8px 12px', borderRadius: '12px', cursor: 'pointer', outline: 'none',
                                                    minWidth: '72px', height: '64px', gap: '4px', transition: 'all 0.2s',
                                                    border: ['rect', 'circle', 'arc'].includes(cadTool) ? '1px solid #3b82f6' : '1px solid #e2e8f0',
                                                    color: ['rect', 'circle', 'arc'].includes(cadTool) ? '#2563eb' : '#64748b',
                                                    backgroundColor: ['rect', 'circle', 'arc'].includes(cadTool) ? '#eff6ff' : '#ffffff',
                                                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'`
    },
    {
        name: 'Teks',
        findStyle: `                                                    background: 'none', border: 'none', padding: '6px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center',
                                                    cursor: 'pointer', borderRadius: '8px', gap: '3px', transition: 'all 0.15s', outline: 'none',
                                                    color: cadTool === 'text' ? '#2563eb' : '#64748b',
                                                    backgroundColor: cadTool === 'text' ? '#eff6ff' : 'transparent'`,
        replaceStyle: `                                                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                                    padding: '8px 12px', borderRadius: '12px', cursor: 'pointer', outline: 'none',
                                                    minWidth: '72px', height: '64px', gap: '4px', transition: 'all 0.2s',
                                                    border: cadTool === 'text' ? '1px solid #3b82f6' : '1px solid #e2e8f0',
                                                    color: cadTool === 'text' ? '#2563eb' : '#64748b',
                                                    backgroundColor: cadTool === 'text' ? '#eff6ff' : '#ffffff',
                                                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'`
    },
    {
        name: 'Dimensi',
        findStyle: `                                                    background: 'none', border: 'none', padding: '6px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center',
                                                    cursor: 'pointer', borderRadius: '8px', gap: '3px', transition: 'all 0.15s', outline: 'none',
                                                    color: cadTool === 'dimension' ? '#2563eb' : '#64748b',
                                                    backgroundColor: cadTool === 'dimension' ? '#eff6ff' : 'transparent'`,
        replaceStyle: `                                                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                                    padding: '8px 12px', borderRadius: '12px', cursor: 'pointer', outline: 'none',
                                                    minWidth: '72px', height: '64px', gap: '4px', transition: 'all 0.2s',
                                                    border: cadTool === 'dimension' ? '1px solid #3b82f6' : '1px solid #e2e8f0',
                                                    color: cadTool === 'dimension' ? '#2563eb' : '#64748b',
                                                    backgroundColor: cadTool === 'dimension' ? '#eff6ff' : '#ffffff',
                                                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'`
    },
    {
        name: 'Catatan',
        findStyle: `                                                    background: 'none', border: 'none', padding: '6px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center',
                                                    cursor: 'pointer', borderRadius: '8px', gap: '3px', transition: 'all 0.15s', outline: 'none',
                                                    color: cadTool === 'callout' ? '#2563eb' : '#64748b',
                                                    backgroundColor: cadTool === 'callout' ? '#eff6ff' : 'transparent'`,
        replaceStyle: `                                                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                                    padding: '8px 12px', borderRadius: '12px', cursor: 'pointer', outline: 'none',
                                                    minWidth: '72px', height: '64px', gap: '4px', transition: 'all 0.2s',
                                                    border: cadTool === 'callout' ? '1px solid #3b82f6' : '1px solid #e2e8f0',
                                                    color: cadTool === 'callout' ? '#2563eb' : '#64748b',
                                                    backgroundColor: cadTool === 'callout' ? '#eff6ff' : '#ffffff',
                                                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'`
    },
    {
        name: 'Simbol',
        findStyle: `                                                    background: 'none', border: 'none', padding: '6px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center',
                                                    cursor: 'pointer', borderRadius: '8px', gap: '3px', transition: 'all 0.15s', outline: 'none',
                                                    color: cadTool === 'symbol' ? '#2563eb' : '#64748b',
                                                    backgroundColor: cadTool === 'symbol' ? '#eff6ff' : 'transparent'`,
        replaceStyle: `                                                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                                    padding: '8px 12px', borderRadius: '12px', cursor: 'pointer', outline: 'none',
                                                    minWidth: '72px', height: '64px', gap: '4px', transition: 'all 0.2s',
                                                    border: cadTool === 'symbol' ? '1px solid #3b82f6' : '1px solid #e2e8f0',
                                                    color: cadTool === 'symbol' ? '#2563eb' : '#64748b',
                                                    backgroundColor: cadTool === 'symbol' ? '#eff6ff' : '#ffffff',
                                                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'`
    },
    {
        name: 'Hapus',
        findStyle: `                                                    background: 'none', border: 'none', padding: '6px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center',
                                                    cursor: 'pointer', borderRadius: '8px', gap: '3px', transition: 'all 0.15s', outline: 'none',
                                                    color: cadTool === 'erase' ? '#2563eb' : '#64748b',
                                                    backgroundColor: cadTool === 'erase' ? '#eff6ff' : 'transparent'`,
        replaceStyle: `                                                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                                    padding: '8px 12px', borderRadius: '12px', cursor: 'pointer', outline: 'none',
                                                    minWidth: '72px', height: '64px', gap: '4px', transition: 'all 0.2s',
                                                    border: cadTool === 'erase' ? '1px solid #ef4444' : '1px solid #e2e8f0',
                                                    color: cadTool === 'erase' ? '#ef4444' : '#64748b',
                                                    backgroundColor: cadTool === 'erase' ? '#fee2e2' : '#ffffff',
                                                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'`
    },
    {
        name: 'Warna',
        findStyle: `                                                    background: 'none', border: 'none', padding: '6px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center',
                                                    cursor: 'pointer', borderRadius: '8px', gap: '3px', transition: 'all 0.15s', outline: 'none',
                                                    color: showColorPopup ? '#2563eb' : '#64748b',
                                                    backgroundColor: showColorPopup ? '#eff6ff' : 'transparent'`,
        replaceStyle: `                                                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                                    padding: '8px 12px', borderRadius: '12px', cursor: 'pointer', outline: 'none',
                                                    minWidth: '72px', height: '64px', gap: '4px', transition: 'all 0.2s',
                                                    border: showColorPopup ? '1px solid #3b82f6' : '1px solid #e2e8f0',
                                                    color: showColorPopup ? '#2563eb' : '#64748b',
                                                    backgroundColor: showColorPopup ? '#eff6ff' : '#ffffff',
                                                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'`
    },
    {
        name: 'Gaya',
        findStyle: `                                                    background: 'none', border: 'none', padding: '6px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center',
                                                    cursor: 'pointer', borderRadius: '8px', gap: '3px', transition: 'all 0.15s', outline: 'none',
                                                    color: showStylePopup ? '#2563eb' : '#64748b',
                                                    backgroundColor: showStylePopup ? '#eff6ff' : 'transparent'`,
        replaceStyle: `                                                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                                    padding: '8px 12px', borderRadius: '12px', cursor: 'pointer', outline: 'none',
                                                    minWidth: '72px', height: '64px', gap: '4px', transition: 'all 0.2s',
                                                    border: showStylePopup ? '1px solid #3b82f6' : '1px solid #e2e8f0',
                                                    color: showStylePopup ? '#2563eb' : '#64748b',
                                                    backgroundColor: showStylePopup ? '#eff6ff' : '#ffffff',
                                                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'`
    },
    {
        name: 'Layer',
        findStyle: `                                                    background: 'none', border: 'none', padding: '6px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center',
                                                    cursor: 'pointer', borderRadius: '8px', gap: '3px', transition: 'all 0.15s', outline: 'none',
                                                    color: showLayerPopup ? '#2563eb' : '#64748b',
                                                    backgroundColor: showLayerPopup ? '#eff6ff' : 'transparent'`,
        replaceStyle: `                                                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                                    padding: '8px 12px', borderRadius: '12px', cursor: 'pointer', outline: 'none',
                                                    minWidth: '72px', height: '64px', gap: '4px', transition: 'all 0.2s',
                                                    border: showLayerPopup ? '1px solid #3b82f6' : '1px solid #e2e8f0',
                                                    color: showLayerPopup ? '#2563eb' : '#64748b',
                                                    backgroundColor: showLayerPopup ? '#eff6ff' : '#ffffff',
                                                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'`
    }
];

buttonReplacements.forEach(rep => {
    const targetRep = rep.findStyle.replace(/\r\n/g, '\n');
    if (updatedButtons.includes(targetRep)) {
        updatedButtons = updatedButtons.replace(targetRep, rep.replaceStyle);
        console.log(`Updated button style: ${rep.name}`);
    } else {
        console.warn(`WARN: Style not found for button: ${rep.name}`);
    }
});

const findInnerWrapperStart = `<div style={{
                                            
                                            
                                            
                                            
                                            backgroundColor: '#ffffff',
                                            borderRadius: '30px',
                                            border: '1px solid #cbd5e1',
                                            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
                                            padding: '4px 16px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            zIndex: 50,
                                            userSelect: 'none',
                                            fontFamily: "'Inter', sans-serif"
                                        }}>`.replace(/\r\n/g, '\n');

const replaceInnerWrapperStart = `<div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '12px',
                                            userSelect: 'none',
                                            fontFamily: "'Inter', sans-serif"
                                        }}>`.replace(/\r\n/g, '\n');

if (updatedButtons.includes(findInnerWrapperStart)) {
    updatedButtons = updatedButtons.replace(findInnerWrapperStart, replaceInnerWrapperStart);
    console.log('SUCCESS: Simplified inner wrapper style.');
} else {
    console.warn('WARN: Could not find inner wrapper start matching string.');
}

// Build the new Horizontal Toolbar Cards block
const newToolbarContainer = `                        {/* Horizontal Toolbar Widget Cards (Positioned above canvas card) */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'flex-start',
                            padding: '0 4px',
                            marginBottom: '4px',
                            zIndex: 15,
                            flexShrink: 0
                        }}>
${updatedButtons.trim().split('\n').map(line => '    ' + line).join('\n')}
                        </div>`;

// ==========================================
// STEP 3: Replace legacy Integrated CAD Toolbar with new horizontal toolbar
// ==========================================
const legacyStartMarker = '                        {/* Integrated CAD Toolbar (App Builder Style UI, positioned at the top of the canvas layout) */}';
const legacyEndMarker = '                        {/* AutoCAD Workspace Area (contains Vertical Toolbar + Canvas) */}';

const legacyStartIdx = content.indexOf(legacyStartMarker);
const legacyEndIdx = content.indexOf(legacyEndMarker);

if (legacyStartIdx === -1 || legacyEndIdx === -1) {
    console.error('ERROR: Could not locate the legacy integrated toolbar block.');
    process.exit(1);
}

const legacyToolbarFullBlock = content.substring(legacyStartIdx, legacyEndIdx);
content = content.replace(legacyToolbarFullBlock, newToolbarContainer + '\n\n');
console.log('SUCCESS: Swapped legacy toolbar with redesigned widgets row.');

// ==========================================
// STEP 4: Convert CAD Canvas Panel into transparent layout container
// ==========================================
const findCanvasPanelStart = `                    {/* CAD Canvas Panel */}
                    <div style={{ display: 'flex', flexDirection: 'column', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #cbd5e1', overflow: 'hidden', position: 'relative', height: '100%', minHeight: 0 }}>`.replace(/\r\n/g, '\n');

const replaceCanvasPanelStart = `                    {/* CAD Canvas Panel - Transparent Layout Container */}
                    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, height: '100%', minHeight: 0, gap: '10px' }}>`.replace(/\r\n/g, '\n');

if (content.includes(findCanvasPanelStart)) {
    content = content.replace(findCanvasPanelStart, replaceCanvasPanelStart);
    console.log('SUCCESS: Converted CAD Canvas Panel to layout box.');
} else {
    console.error('ERROR: Could not find CAD Canvas Panel start.');
    process.exit(1);
}

// ==========================================
// STEP 5: Wrap AutoCAD Canvas Workspace into white rounded card
// ==========================================
const findTabStripStart = `                        {/* AutoCAD File tab strip */}
                        <div style={{`.replace(/\r\n/g, '\n');

const replaceTabStripStart = `                        {/* AutoCAD Canvas Card Content */}
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            backgroundColor: '#ffffff',
                            borderRadius: '16px',
                            border: '1px solid #cbd5e1',
                            overflow: 'hidden',
                            position: 'relative',
                            flex: 1,
                            minHeight: 0
                        }}>

                        {/* AutoCAD File tab strip */}
                        <div style={{`.replace(/\r\n/g, '\n');

if (content.includes(findTabStripStart)) {
    content = content.replace(findTabStripStart, replaceTabStripStart);
    console.log('SUCCESS: Wrapped workspace tab strip inside AutoCAD Canvas Card.');
} else {
    console.error('ERROR: Could not find tab strip block.');
    process.exit(1);
}

// ==========================================
// STEP 6: Restyle and reposition Right Sidebar (QC Inspector)
// ==========================================
// Find sidebar start
const sidebarStartMarker = '                    {/* Right Sidebar: QC Inspector (Tabs: Parameter Mapping / QC Simulator) */}';
const sidebarStartIdx = content.indexOf(sidebarStartMarker);
if (sidebarStartIdx === -1) {
    console.error('ERROR: Could not find right sidebar start.');
    process.exit(1);
}

const sidebarSearchFromIdx = content.indexOf('showQCInspector && (', sidebarStartIdx);
if (sidebarSearchFromIdx === -1) {
    console.error('ERROR: Could not find showQCInspector condition.');
    process.exit(1);
}

let openBrackets = 1;
let sidebarEndIdx = -1;
for (let i = sidebarSearchFromIdx + 'showQCInspector && ('.length; i < content.length; i++) {
    const char = content[i];
    if (char === '(' || char === '{') {
        openBrackets++;
    } else if (char === ')' || char === '}') {
        openBrackets--;
    }
    if (openBrackets <= 0) {
        sidebarEndIdx = content.indexOf(')', i) + 2;
        break;
    }
}

const tempSub = content.substring(sidebarStartIdx, sidebarEndIdx);
const lastBraceIdx = tempSub.lastIndexOf(')}');
if (lastBraceIdx === -1) {
    console.error('ERROR: Could not find ending of sidebar block.');
    process.exit(1);
}
const exactEndIdx = sidebarStartIdx + lastBraceIdx + 2;

let sidebarCodeBlock = content.substring(sidebarStartIdx, exactEndIdx);

// Modify sidebar styling to sit statically on the right side
const findSidebarStyles = `                        <div style={{
                            position: 'absolute',
                            top: '12px',
                            right: '12px',
                            bottom: '12px',
                            width: '350px',
                            display: 'flex',
                            flexDirection: 'column',
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            backdropFilter: 'blur(8px)',
                            borderRadius: '12px',
                            border: '1px solid #cbd5e1',
                            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3), 0 8px 10px -6px rgba(0,0,0,0.3)',
                            overflow: 'hidden',
                            fontFamily: "'Inter', sans-serif",
                            color: '#1e293b',
                            zIndex: 20
                        }}>`.replace(/\r\n/g, '\n');

const replaceSidebarStyles = `                        <div style={{
                            width: '350px',
                            display: 'flex',
                            flexDirection: 'column',
                            backgroundColor: '#ffffff',
                            borderRadius: '16px',
                            border: '1px solid #cbd5e1',
                            overflow: 'hidden',
                            fontFamily: "'Inter', sans-serif",
                            color: '#1e293b',
                            flexShrink: 0,
                            height: '100%',
                            zIndex: 10
                        }}>`.replace(/\r\n/g, '\n');

if (sidebarCodeBlock.includes(findSidebarStyles)) {
    sidebarCodeBlock = sidebarCodeBlock.replace(findSidebarStyles, replaceSidebarStyles);
    console.log('SUCCESS: Restyled sidebar block to sit statically next to canvas.');
} else {
    console.warn('WARN: Could not replace sidebar styles. Checking alternative styles...');
    // In clean file, it originally was absolute:
    const findOriginalSidebarStyles = `                        <div style={{
                            position: 'absolute',
                            top: '12px',
                            right: '12px',
                            bottom: '12px',
                            width: '350px',
                            display: 'flex',
                            flexDirection: 'column',
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            backdropFilter: 'blur(8px)',
                            borderRadius: '12px',
                            border: '1px solid #cbd5e1',
                            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3), 0 8px 10px -6px rgba(0,0,0,0.3)',
                            overflow: 'hidden',
                            fontFamily: "'Inter', sans-serif",
                            color: '#1e293b',
                            zIndex: 20
                        }}>`.replace(/\r\n/g, '\n');
    if (sidebarCodeBlock.includes(findOriginalSidebarStyles)) {
        sidebarCodeBlock = sidebarCodeBlock.replace(findOriginalSidebarStyles, replaceSidebarStyles);
        console.log('SUCCESS: Restyled sidebar block using clean styles.');
    } else {
        console.error('ERROR: Could not find target styling block in clean sidebar code.');
        process.exit(1);
    }
}

// Remove the nested sidebar from its original position
content = content.replace(content.substring(sidebarStartIdx, exactEndIdx), '');
console.log('SUCCESS: Removed nested sidebar block.');

// Locate insertion point right before Scale Calibration Modal
const insertMarker = '            </div>\n\n            {/* Scale Calibration Overlay Modal */}'.replace(/\r\n/g, '\n');
const insertIdx = content.indexOf(insertMarker);
if (insertIdx === -1) {
    console.error('ERROR: Could not find insertion marker.');
    process.exit(1);
}

// Wrap closing tags correctly:
// We close the AutoCAD Workspace Area, close the new AutoCAD Canvas Card wrapper,
// and then render the static QC Inspector sidebar next to it!
const siblingReplacement = `            </div> {/* Closes AutoCAD Workspace Area */}

                        </div> {/* Closes AutoCAD Canvas Card wrapper */}

${sidebarCodeBlock}

            </div>\n\n            {/* Scale Calibration Overlay Modal */}`;

content = content.replace(insertMarker, siblingReplacement);
console.log('SUCCESS: Replaced insertion marker with side-by-side components.');

fs.writeFileSync(targetPath, content, 'utf8');
console.log('New file size:', content.length);
console.log('FULL REDESIGN SUCCESSFULLY COMPLETED!');

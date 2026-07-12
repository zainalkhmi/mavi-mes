const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, 'src', 'components', 'DrawingManager.jsx');
let content = fs.readFileSync(targetPath, 'utf8');

// Normalize line endings to LF (\n)
content = content.replace(/\r\n/g, '\n');

console.log('Original file size:', content.length);

// 1. Locate the toolbar container currently at the top of the AutoCAD Workspace
const startMarker = `                        {/* Centered CAD Toolbar positioned above the canvas */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: '#f8fafc',
                            borderBottom: '1px solid #cbd5e1',
                            padding: '10px 12px',
                            gap: '6px',
                            zIndex: 15,
                            userSelect: 'none',
                            fontFamily: "'Inter', sans-serif",
                            flexShrink: 0,
                            position: 'relative'
                        }}>`.replace(/\r\n/g, '\n');

const startIdx = content.indexOf(startMarker);
if (startIdx === -1) {
    console.error('ERROR: Could not locate the toolbar container block.');
    process.exit(1);
}

// Find where this container closes
const endMarker = `                        </div>\n\n                        {/* AutoCAD Workspace Area (contains Vertical Toolbar + Canvas) */}`.replace(/\r\n/g, '\n');
const endIdx = content.indexOf(endMarker, startIdx);

if (endIdx === -1) {
    console.error('ERROR: Could not find end marker of toolbar container block.');
    process.exit(1);
}

const fullToolbarBlock = content.substring(startIdx, endIdx + '                        </div>'.length);

// Let's locate the buttons part
const innerDivStart = fullToolbarBlock.indexOf('<div style={{', 100);
const innerDivEnd = fullToolbarBlock.lastIndexOf('</div>');

const buttonsContent = fullToolbarBlock.substring(innerDivStart, innerDivEnd);

// Redefine button styles to look like separate rounded white cards
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
    // Normalize newlines in replacement target
    const targetRep = rep.findStyle.replace(/\r\n/g, '\n');
    if (updatedButtons.includes(targetRep)) {
        updatedButtons = updatedButtons.replace(targetRep, rep.replaceStyle);
        console.log(`Updated button style for: ${rep.name}`);
    } else {
        console.warn(`WARN: Could not find style match for button: ${rep.name}`);
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
                                            gap: '10px',
                                            userSelect: 'none',
                                            fontFamily: "'Inter', sans-serif"
                                        }}>`.replace(/\r\n/g, '\n');

if (updatedButtons.includes(findInnerWrapperStart)) {
    updatedButtons = updatedButtons.replace(findInnerWrapperStart, replaceInnerWrapperStart);
    console.log('SUCCESS: Simplified inner wrapper style to simple horizontal row.');
} else {
    console.warn('WARN: Could not find inner wrapper start matching string.');
}

// Reconstruct the parent toolbar container block to be a transparent row container above the canvas card
const newToolbarContainer = `                        {/* Horizontal Toolbar Widget Cards (Positioned above canvas card) */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'flex-start',
                            padding: '0 4px',
                            marginBottom: '6px',
                            zIndex: 15,
                            flexShrink: 0
                        }}>
${updatedButtons.trim().split('\n').map(line => '    ' + line).join('\n')}
                        </div>`;

content = content.replace(fullToolbarBlock, newToolbarContainer);
console.log('SUCCESS: Swapped old toolbar block for premium card widgets bar.');

// 2. Adjust the CAD Canvas Panel container styles to be a transparent vertical flex box
// and wrap its inner AutoCAD workspace area inside a beautiful white rounded card container.
const findCanvasPanelStart = `                    {/* CAD Canvas Panel */}
                    <div style={{ display: 'flex', flexDirection: 'column', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #cbd5e1', overflow: 'hidden', position: 'relative', height: '100%', minHeight: 0 }}>`.replace(/\r\n/g, '\n');

const replaceCanvasPanelStart = `                    {/* CAD Canvas Panel - Transparent Layout Container */}
                    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, height: '100%', minHeight: 0, gap: '10px' }}>`.replace(/\r\n/g, '\n');

if (content.includes(findCanvasPanelStart)) {
    content = content.replace(findCanvasPanelStart, replaceCanvasPanelStart);
    console.log('SUCCESS: Turned CAD Canvas Panel into transparent layout container.');
} else {
    console.error('ERROR: Could not find CAD Canvas Panel start block.');
    process.exit(1);
}

// 3. Wrap everything below the new toolbar (AutoCAD File tab strip up to Workspace Area close)
// inside a white rounded card:
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
    console.log('SUCCESS: Wrapped tab strip inside AutoCAD Canvas Card.');
} else {
    console.error('ERROR: Could not find AutoCAD File tab strip block.');
    process.exit(1);
}

// Now we need to close this new AutoCAD Canvas Card wrapper right before the Workspace Area closes
const originalWorkspaceClose = `                </div>\n\n            </div>`.replace(/\r\n/g, '\n');

const replaceWorkspaceClose = `                </div>\n\n            </div>\n\n                        </div> {/* Closes AutoCAD Canvas Card */}\n`.replace(/\r\n/g, '\n');

if (content.includes(originalWorkspaceClose)) {
    content = content.replace(originalWorkspaceClose, replaceWorkspaceClose);
    console.log('SUCCESS: Closed AutoCAD Canvas Card container.');
} else {
    console.error('ERROR: Could not locate original AutoCAD Workspace Area closing sequence.');
    process.exit(1);
}

fs.writeFileSync(targetPath, content, 'utf8');
console.log('New file size:', content.length);
console.log('REDESIGN COMPLETE!');

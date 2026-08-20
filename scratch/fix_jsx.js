const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '../../src/components/DrawingManager.jsx');
let content = fs.readFileSync(filePath, 'utf8');

const targetStr = `                                                 onSelectDimension={(id) => setActiveDimId(id)}
                                             <MLightCadViewer`;

const replaceStr = `                                                 onSelectDimension={(id) => setActiveDimId(id)}
                                             />
                                        </Suspense>
                                    ) : (
                                        <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8', fontSize: '0.8rem' }}>Memuat MLightCAD WebAssembly Engine...</div>}>
                                            <MLightCadViewer
                                                fileName={selectedDwg?.fileName || (selectedDwg?.name ? selectedDwg.name + '.dxf' : 'drawing.dxf')}
                                                fileData={selectedDwg?.dataUrl || selectedDwg?.data_url || selectedDwg?.rawDxf || selectedDwg?.fileName}
                                                isBalloonMode={isBalloonMode || cadTool === 'balloon'}
                                                onToggleBalloonMode={() => {
                                                    setIsBalloonMode(prev => {
                                                        const next = !prev;
                                                        setCadTool(next ? 'balloon' : 'select');
                                                        toast.success(next ? '🎈 Mode Balon QC Aktif: Klik pada titik CAD untuk membuat Balon Inspeksi' : 'Mode Balon nonaktif');
                                                        return next;
                                                    });
                                                }}`;

// Handle both CRLF and LF
const normalizedContent = content.replace(/\r\n/g, '\n');
const normalizedTarget = targetStr.replace(/\r\n/g, '\n');

if (normalizedContent.includes(normalizedTarget)) {
    const updated = normalizedContent.replace(normalizedTarget, replaceStr.replace(/\r\n/g, '\n'));
    fs.writeFileSync(filePath, updated, 'utf8');
    console.log('REPLACED_SUCCESSFULLY');
} else {
    console.log('TARGET_NOT_FOUND');
    // Find index of onSelectDimension
    const idx = normalizedContent.indexOf('onSelectDimension={(id) => setActiveDimId(id)}');
    if (idx !== -1) {
        console.log('Context around onSelectDimension:');
        console.log(JSON.stringify(normalizedContent.substring(idx - 50, idx + 150)));
    }
}

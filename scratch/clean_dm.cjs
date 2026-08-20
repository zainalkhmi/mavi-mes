const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '../src/components/DrawingManager.jsx');
let lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);

let startIdx = -1;
let endIdx = -1;

for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("selectedDwg && ['STL', 'OBJ', 'GLTF', 'GLB'].includes(selectedDwg.fileType)")) {
        startIdx = i;
    }
    if (startIdx !== -1 && lines[i].includes("cadTool={cadTool}") && lines[i+1]?.includes("onSelectCadTool")) {
        endIdx = i;
        break;
    }
}

if (startIdx !== -1 && endIdx !== -1) {
    const replacementLines = [
        "                                     {selectedDwg && ['STL', 'OBJ', 'GLTF', 'GLB'].includes(selectedDwg.fileType) ? (",
        "                                         <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8', fontSize: '0.8rem' }}>Memuat 3D CAD Editor...</div>}>",
        "                                             <CADViewer3DEditor",
        "                                                  drawing={selectedDwg}",
        "                                                  dimensions={selectedDwg.dimensions || []}",
        "                                                  activeDimId={activeDimId}",
        "                                                  onAddDimension={handleAdd3DDimension}",
        "                                                  onSelectDimension={(id) => setActiveDimId(id)}",
        "                                             />",
        "                                         </Suspense>",
        "                                     ) : (",
        "                                         <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8', fontSize: '0.8rem' }}>Memuat MLightCAD WebAssembly Engine...</div>}>",
        "                                             <MLightCadViewer",
        "                                                 fileName={selectedDwg?.fileName || (selectedDwg?.name ? selectedDwg.name + '.dxf' : 'drawing.dxf')}",
        "                                                 fileData={selectedDwg?.dataUrl || selectedDwg?.data_url || selectedDwg?.rawDxf || selectedDwg?.fileName}",
        "                                                 isBalloonMode={isBalloonMode || cadTool === 'balloon'}",
        "                                                 onToggleBalloonMode={() => {",
        "                                                     const nextMode = !isBalloonMode;",
        "                                                     setIsBalloonMode(nextMode);",
        "                                                     setCadTool(nextMode ? 'balloon' : 'select');",
        "                                                     toast.success(nextMode ? '🎈 Mode Balon QC Aktif: Klik pada titik CAD untuk membuat Balon Inspeksi' : 'Mode Balon nonaktif');",
        "                                                 }}",
        "                                                 cadTool={cadTool}"
    ];
    lines.splice(startIdx, endIdx - startIdx + 1, ...replacementLines);
    fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
    console.log('REPLACED_LINES_SUCCESSFULLY');
} else {
    console.log('INDICES_NOT_FOUND', { startIdx, endIdx });
}

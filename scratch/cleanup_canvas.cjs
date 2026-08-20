const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '../src/components/DrawingManager.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// Replace conditional CAD engine so it always renders MLightCadViewer for 2D drawings
const searchPattern = /\s*\)\s*:\s*cadEngineMode === 'mlightcad'\s*\?\s*\(\s*<Suspense fallback=\{<div[^>]*>Memuat MLightCAD WebAssembly Engine\.\.\.<\/div>\}>([\s\S]*?<\/MLightCadViewer>\s*<\/Suspense>\s*)\)\s*:\s*\(\s*<svg\s+ref=\{svgRef\}[\s\S]*?<\/svg>\s*\)/;

const match = content.match(searchPattern);
if (match) {
    const mLightViewerBlock = match[1];
    const replacement = `                                     ) : (
                                         <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8', fontSize: '0.8rem' }}>Memuat MLightCAD WebAssembly Engine...</div>}>
${mLightViewerBlock}                                         </Suspense>
                                     )`;
    content = content.replace(searchPattern, replacement);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('CLEANED_UP_CANVAS_SUCCESSFULLY');
} else {
    console.log('PATTERN_NOT_MATCHED');
}

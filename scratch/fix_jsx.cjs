const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '../src/components/DrawingManager.jsx');
let content = fs.readFileSync(filePath, 'utf8');

const updated = content.replace(
    /\)\s*:\s*\(\s*<Suspense fallback=\{<div[^>]*>Memuat MLightCAD WebAssembly Engine\.\.\.<\/div>\}>/,
    `) : cadEngineMode === 'mlightcad' ? (\n                                        <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8', fontSize: '0.8rem' }}>Memuat MLightCAD WebAssembly Engine...</div>}>`
);

if (updated !== content) {
    fs.writeFileSync(filePath, updated, 'utf8');
    console.log('REPLACED_REGEX_SUCCESSFULLY');
} else {
    console.log('REGEX_NOT_MATCHED');
}

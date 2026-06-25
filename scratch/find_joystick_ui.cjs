const fs = require('fs');

const filePath = 'c:\\Users\\ndens\\mavi-core\\src\\components\\DrawingManager.jsx';
const lines = fs.readFileSync(filePath, 'utf8').split('\n');

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('DRAG KNOB') || line.includes('FINE TUNE') || line.includes('MODE INPUT') || line.includes('TARGET KOORDINAT')) {
        console.log(`${i + 1}: ${line.trim()}`);
    }
}

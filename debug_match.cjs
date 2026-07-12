const fs = require('fs');
let content = fs.readFileSync('src/components/DrawingManager.jsx', 'utf8').replace(/\r\n/g, '\n');

const marker = 'Centered CAD Toolbar positioned above the canvas';
const idx = content.indexOf(marker);

if (idx === -1) {
    console.log('Marker not found');
} else {
    console.log('Found marker at index:', idx);
    // Print 400 characters around the marker
    console.log('=== FILE CONTENT ===');
    console.log(content.substring(idx - 50, idx + 450));
    console.log('====================');
}

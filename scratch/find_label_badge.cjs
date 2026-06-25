const fs = require('fs');

const filePath = 'c:\\Users\\ndens\\mavi-core\\src\\components\\DrawingManager.jsx';
const lines = fs.readFileSync(filePath, 'utf8').split('\n');

for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('renderLabelBadge')) {
        console.log(`${i + 1}: ${lines[i]}`);
    }
}

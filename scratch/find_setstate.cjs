const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '../src/components/DrawingManager.jsx');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split(/\r?\n/);

// Look for bad setState during render execution
for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Check if line calls setXxx() directly in render body without being wrapped in function
    if (/^\s*set[A-Z]\w+\(/.test(line)) {
        console.log(`Line ${i + 1}: ${line}`);
    }
}

const fs = require('fs');

const filePath = 'c:\\Users\\ndens\\mavi-core\\src\\App.jsx';
const lines = fs.readFileSync(filePath, 'utf8').split('\n');

console.log("Searching in App.jsx:");
for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lower = line.toLowerCase();
    if (lower.includes('drag') || lower.includes('title') || lower.includes('header') || lower.includes('button') && (lower.includes('height') || lower.includes('width') || lower.includes('padding'))) {
        // Only print lines that look like they could be related to window control UI
        if (line.includes('flex') || line.includes('justify') || line.includes('x') || line.includes('-') || line.includes('cursor')) {
            console.log(`L${i+1}: ${line.trim()}`);
        }
    }
}

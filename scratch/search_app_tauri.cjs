const fs = require('fs');

const filePath = 'c:\\Users\\ndens\\mavi-core\\src\\App.jsx';
const lines = fs.readFileSync(filePath, 'utf8').split('\n');

console.log("Searching in App.jsx:");
for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lower = line.toLowerCase();
    if (lower.includes('tauri') || lower.includes('titlebar') || lower.includes('window.minim') || lower.includes('window.maxim') || lower.includes('window.close')) {
        console.log(`L${i+1}: ${line.trim()}`);
    }
}

const fs = require('fs');

const filePath = 'c:\\Users\\ndens\\mavi-core\\src\\App.jsx';
const lines = fs.readFileSync(filePath, 'utf8').split('\n');

console.log("Searching in App.jsx:");
for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('tauri') || line.includes('window') && (line.includes('minimize') || line.includes('maximize') || line.includes('close') || line.includes('getCurrentWindow') || line.includes('appWindow'))) {
        console.log(`L${i+1}: ${line.trim()}`);
    }
}

const fs = require('fs');
const content = fs.readFileSync('src/components/DrawingManager.jsx', 'utf8').replace(/\r\n/g, '\n');
const lines = content.split('\n');

const stack = [];
let targetLine = 9048; // {showQCInspector && (

console.log('Tracing parent tags and hierarchy for line ' + targetLine + ':');
for (let i = 0; i < targetLine; i++) {
    const line = lines[i];
    // Simple regex to find divs
    const openDivs = (line.match(/<div\b/g) || []).length;
    const closeDivs = (line.match(/<\/div>/g) || []).length;
    
    if (openDivs > closeDivs) {
        for (let d = 0; d < openDivs - closeDivs; d++) {
            stack.push({ lineNum: i + 1, content: line.trim() });
        }
    } else if (closeDivs > openDivs) {
        for (let d = 0; d < closeDivs - openDivs; d++) {
            stack.pop();
        }
    }
}

stack.forEach((item, index) => {
    console.log(`Level ${index + 1} (Line ${item.lineNum}): ${item.content}`);
});

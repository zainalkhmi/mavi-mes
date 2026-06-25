const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const fullPath = path.join(dir, file);
        if (file === 'node_modules' || file === '.git' || file === 'dist' || file === 'build') return;
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(fullPath));
        } else if (file.endsWith('.jsx') || file.endsWith('.js')) {
            results.push(fullPath);
        }
    });
    return results;
}

const files = walk('c:\\Users\\ndens\\mavi-core\\src');
console.log("Searching in files:", files.length);

for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    if (content.includes('tauri') || content.includes('maximize') || content.includes('appWindow') || content.includes('getCurrentWindow')) {
        console.log(`Found in: ${file}`);
        // Let's print lines that mention maximize or window
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes('maximize') || lines[i].includes('getCurrentWindow') || lines[i].includes('appWindow') || lines[i].includes('window') && lines[i].includes('Tauri')) {
                console.log(`  L${i+1}: ${lines[i].trim()}`);
            }
        }
    }
}

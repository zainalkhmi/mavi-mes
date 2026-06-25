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
        } else if (file.endsWith('.jsx') || file.endsWith('.js') || file.endsWith('.html') || file.endsWith('.css')) {
            results.push(fullPath);
        }
    });
    return results;
}

const files = walk('c:\\Users\\ndens\\mavi-core\\src');

for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.includes('appWindow') || line.includes('getCurrentWindow') || line.includes('tauri') && (line.includes('min') || line.includes('max') || line.includes('close')) || line.includes('titlebar') || line.includes('minimize') || line.includes('maximize')) {
            console.log(`${file}: L${i+1}: ${line.trim()}`);
        }
    }
}

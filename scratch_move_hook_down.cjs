const fs = require('fs');
let lines = fs.readFileSync('src/components/AppBuilder.jsx', 'utf8').split('\n');

const start = lines.findIndex(l => l.includes('= useAppBuilderProject('));
const end = lines.findIndex((l, i) => i > start && l.includes('});'));

const actualStart = start - 1;
const hookCallLines = lines.slice(actualStart, end + 1);

lines.splice(actualStart, hookCallLines.length);

// Let's insert it at line 3500
const insertIdx = 3500;
lines.splice(insertIdx, 0, ...hookCallLines);
fs.writeFileSync('src/components/AppBuilder.jsx', lines.join('\n'));
console.log('Successfully moved useAppBuilderProject down to line ' + insertIdx);

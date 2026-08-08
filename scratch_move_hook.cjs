const fs = require('fs');
let lines = fs.readFileSync('src/components/AppBuilder.jsx', 'utf8').split('\n');

const start = lines.findIndex(l => l.includes('= useAppBuilderProject('));
const end = lines.findIndex((l, i) => i > start && l.includes('});'));

// Include the `const {` which is at start - 1
const actualStart = start - 1;
const hookCallLines = lines.slice(actualStart, end + 1);

// Remove it from current location
lines.splice(actualStart, hookCallLines.length);

// Find where to insert it. We want it right before `useEffect(() => {` which is around line 2200.
// But since we removed lines, the indices shifted!
const insertIdx = lines.findIndex(l => l.includes('useEffect(() => {') && l.trim() === 'useEffect(() => {');
if (insertIdx > -1) {
    lines.splice(insertIdx, 0, ...hookCallLines);
    fs.writeFileSync('src/components/AppBuilder.jsx', lines.join('\n'));
    console.log('Successfully moved useAppBuilderProject down to line ' + insertIdx);
} else {
    console.error('Could not find useEffect(() => {');
}

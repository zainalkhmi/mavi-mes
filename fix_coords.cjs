const fs = require('fs');
const files = ['src/utils/hospitalLabTemplate.js', 'src/utils/diabetesManagementTemplate.js'];

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    
    // Some lines might already have x, y coordinates from previous attempts, we should clean them out if any
    content = content.replace(/x:\s*\d+,\s*y:\s*\d+,\s*w:\s*\d+,\s*h:\s*\d+,\s*\n\s*/g, '');

    let stepSplit = content.split(/components:\s*\[/);
    if (stepSplit.length <= 1) return;
    
    let result = stepSplit[0];
    
    for (let i = 1; i < stepSplit.length; i++) {
        let stepContent = stepSplit[i];
        let currentY = 50; // Starting Y coordinate for each step
        
        stepContent = stepContent.replace(/(type:\s*"[^"]+",\s*)(props:\s*\{)/g, (match, typeGroup, propsGroup) => {
            const repl = `${typeGroup}x: 50, y: ${currentY}, w: 900, h: 100,\n                            ${propsGroup}`;
            currentY += 120; // Increment Y coordinate for the next component
            return repl;
        });
        
        result += 'components: [' + stepContent;
    }
    
    fs.writeFileSync(file, result, 'utf8');
    console.log('Fixed ' + file);
});

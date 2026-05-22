const fs = require('fs');
const path = require('path');

function replaceTemplates(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');

    // 1. Replace RECORD_DISPLAY
    // We will find objects of type 'RECORD_DISPLAY' and replace them with a function call or directly inline them.
    // It's safer to use regex to find them, extract props, and replace with multiple objects.
    const recordDisplayRegex = /\{\s*id:\s*`([^`]+)`,\s*type:\s*'RECORD_DISPLAY',\s*x:\s*(\d+),\s*y:\s*(\d+),\s*w:\s*(\d+),\s*h:\s*(\d+),\s*props:\s*\{\s*placeholderId:\s*`([^`]+)`,\s*fieldsToShow:\s*\[(.*?)\]\s*\}\s*\}/gs;

    content = content.replace(recordDisplayRegex, (match, id, x, y, w, h, placeholderId, fieldsStr) => {
        const fields = fieldsStr.split(',').map(s => s.trim().replace(/['"]/g, ''));
        const startX = parseInt(x);
        const startY = parseInt(y);
        const width = parseInt(w);
        
        // Let's generate a 2-column layout or 1-column layout depending on width
        const cols = width > 350 ? 2 : 1;
        const colWidth = (width - (cols-1)*20) / cols;
        
        let newComponents = [];
        for (let i=0; i<fields.length; i++) {
            const field = fields[i];
            const col = i % cols;
            const row = Math.floor(i / cols);
            
            const currX = startX + col * (colWidth + 20);
            const currY = startY + row * 50;
            
            // We need to know the placeholder name. Let's infer it from placeholderId or standard naming.
            // But we don't have the R array. Actually, we can use a hardcoded mapping or just use targetVariable: `{{@Placeholder.${field}}}`? 
            // Wait, targetVariable needs to be the actual variable name, e.g., 'Selected_Inventory_Item.ID'.
            // How do we get the placeholder name? 
            // We can match placeholderId to the placeholder name. 
            // Let's extract R array from content!
            return match; // fallback for now
        }
    });

    // Actually, writing a precise AST-based parser in 1 minute is hard. Let's do simple regex replacements for the specific TEXT grids first.

    // 2. Replace the TEXT grids.
    // We can find texts like `props: { text: 'Label\\n{{@Placeholder.Field}}', ... }`
    const textGridRegex = /\{\s*id:\s*`([^`]+)`,\s*type:\s*'TEXT',\s*x:\s*(\d+),\s*y:\s*(\d+),\s*w:\s*(\d+),\s*h:\s*(\d+),\s*props:\s*\{\s*text:\s*'([^']+)\\n\{\{@([^}]+)\}\}',\s*fontSize:\s*(\d+),\s*color:\s*'([^']+)',\s*fontWeight:\s*'([^']+)'\s*\}\s*\}/gs;

    content = content.replace(textGridRegex, (match, id, x, y, w, h, label, variable, fontSize, color, fontWeight) => {
        const width = parseInt(w);
        const yNum = parseInt(y);
        
        const labelHeight = 20;
        const inputHeight = 30; // standard TEXT_INPUT height
        const inputY = yNum + labelHeight;

        return `{
                id: \`${id}_lbl_\${ts}\`, type: 'TEXT',
                x: ${x}, y: ${yNum}, w: ${width}, h: ${labelHeight},
                props: { text: '${label}', fontSize: ${fontSize}, color: '${color}', fontWeight: '${fontWeight}' }
            },
            {
                id: \`${id}_\${ts}\`, type: 'TEXT_INPUT',
                x: ${x}, y: ${inputY}, w: ${width}, h: ${inputHeight},
                props: { targetVariable: '${variable}', readOnly: true, backgroundColor: '#f8fafc' }
            }`;
    });
    
    // Replace Container Bin Label Preview
    const binLabelRegex = /\{\s*id:\s*`([^`]+)`,\s*type:\s*'TEXT',\s*x:\s*(\d+),\s*y:\s*(\d+),\s*w:\s*(\d+),\s*h:\s*(\d+),\s*props:\s*\{\s*text:\s*'BIN CONTAINER LABEL([^']+)',\s*fontSize:\s*(\d+),\s*fontWeight:\s*'([^']+)',\s*border:\s*'([^']+)',\s*padding:\s*'([^']+)',\s*backgroundColor:\s*'([^']+)'\s*\}\s*\}/gs;
    
    content = content.replace(binLabelRegex, (match, id, x, y, w, h, restOfText, fontSize, fontWeight, border, padding, backgroundColor) => {
        // We will just change it to TEXT_INPUT and multiLine: true, maybe it works, but targetVariable is not possible.
        // Let's replace the content with a proper UI for the label.
        return `{
                id: \`${id}_lbl_title_\${ts}\`, type: 'TEXT',
                x: ${x}, y: ${y}, w: ${w}, h: 30,
                props: { text: 'BIN CONTAINER LABEL', fontSize: 16, fontWeight: 'bold', textAlignment: 1 }
            },
            {
                id: \`${id}_lbl_kanban_\${ts}\`, type: 'TEXT',
                x: ${x}, y: ${parseInt(y)+40}, w: 100, h: 20,
                props: { text: 'KANBAN ID:', fontSize: 13, fontWeight: 'bold' }
            },
            {
                id: \`${id}_in_kanban_\${ts}\`, type: 'TEXT_INPUT',
                x: ${parseInt(x)+100}, y: ${parseInt(y)+35}, w: ${parseInt(w)-110}, h: 30,
                props: { targetVariable: 'Selected_Kanban_ID', readOnly: true }
            },
            {
                id: \`${id}_lbl_part_\${ts}\`, type: 'TEXT',
                x: ${x}, y: ${parseInt(y)+75}, w: 100, h: 20,
                props: { text: 'PART:', fontSize: 13, fontWeight: 'bold' }
            },
            {
                id: \`${id}_in_part_\${ts}\`, type: 'TEXT_INPUT',
                x: ${parseInt(x)+100}, y: ${parseInt(y)+70}, w: ${parseInt(w)-110}, h: 30,
                props: { targetVariable: 'Selected_Kanban_Card.Part_Number', readOnly: true }
            },
            {
                id: \`${id}_lbl_desc_\${ts}\`, type: 'TEXT',
                x: ${x}, y: ${parseInt(y)+110}, w: 100, h: 20,
                props: { text: 'DESC:', fontSize: 13, fontWeight: 'bold' }
            },
            {
                id: \`${id}_in_desc_\${ts}\`, type: 'TEXT_INPUT',
                x: ${parseInt(x)+100}, y: ${parseInt(y)+105}, w: ${parseInt(w)-110}, h: 30,
                props: { targetVariable: 'Selected_Kanban_Card.Part_Description', readOnly: true }
            },
            {
                id: \`${id}_lbl_qty_\${ts}\`, type: 'TEXT',
                x: ${x}, y: ${parseInt(y)+145}, w: 100, h: 20,
                props: { text: 'QTY:', fontSize: 13, fontWeight: 'bold' }
            },
            {
                id: \`${id}_in_qty_\${ts}\`, type: 'TEXT_INPUT',
                x: ${parseInt(x)+100}, y: ${parseInt(y)+140}, w: ${parseInt(w)-110}, h: 30,
                props: { targetVariable: 'Selected_Kanban_Card.QTY', readOnly: true }
            },
            {
                id: \`${id}_lbl_dest_\${ts}\`, type: 'TEXT',
                x: ${x}, y: ${parseInt(y)+180}, w: 100, h: 20,
                props: { text: 'DEST:', fontSize: 13, fontWeight: 'bold' }
            },
            {
                id: \`${id}_in_dest_\${ts}\`, type: 'TEXT_INPUT',
                x: ${parseInt(x)+100}, y: ${parseInt(y)+175}, w: ${parseInt(w)-110}, h: 30,
                props: { targetVariable: 'Selected_Kanban_Card.Consuming_location', readOnly: true }
            },
            {
                id: \`${id}_barcode_\${ts}\`, type: 'TEXT',
                x: ${x}, y: ${parseInt(y)+215}, w: ${w}, h: 30,
                props: { text: '[ SCANNABLE BARCODE ]', fontSize: 14, fontWeight: 'bold', textAlignment: 1 }
            }`;
    });

    // Save
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Processed', filePath);
}

const templates = [
    path.join(__dirname, 'src/utils/inventoryManagementTemplate.js'),
    path.join(__dirname, 'src/utils/materialRequestTemplate.js'),
    path.join(__dirname, 'src/utils/replenishmentTemplate.js')
];

templates.forEach(t => replaceTemplates(t));

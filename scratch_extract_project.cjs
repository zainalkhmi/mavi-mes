const fs = require('fs');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

const code = fs.readFileSync('src/components/AppBuilder.jsx', 'utf8');

const ast = parser.parse(code, {
    sourceType: 'module',
    plugins: ['jsx']
});

const projectFns = [
    'handleCreateTemplateApp',
    'handleCreateTuneUpTemplate',
    'handleSave',
    'handleDeleteApp',
    'handlePublish',
    'handleRequestApproval',
    'handleApproveApp',
    'handleImportProject',
    'handleDuplicateProject',
    'handleAutoSave',
    'handleRecoverDraft',
    'getCurrentApp',
    'handleCopyUrl',
    'loadApp'
];

let extractedCode = '';
const extractedNodes = [];
let lines = code.split('\n');

traverse(ast, {
    VariableDeclarator(path) {
        if (path.node.id && projectFns.includes(path.node.id.name)) {
            // Special case: ignore handleSave inside renderTargetVariableOptions or DataEntryFormGuide
            if (path.node.loc.start.line < 5000) return; // The real ones are around 6700-7200
            
            const decl = path.findParent(p => p.isVariableDeclaration());
            if (decl && !extractedNodes.includes(decl.node)) {
                extractedNodes.push(decl.node);
                const blockCode = lines.slice(decl.node.loc.start.line - 1, decl.node.loc.end.line).join('\n');
                extractedCode += blockCode + '\n\n';
            }
        }
    }
});

fs.writeFileSync('scratch_extracted_project.js', extractedCode);
console.log('Extracted ' + extractedNodes.length + ' functions.');

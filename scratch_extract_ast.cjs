const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

const appBuilderPath = path.join('c:/Users/ndens/mavi-core', 'src/components/AppBuilder.jsx');
const rightPanePath = path.join('c:/Users/ndens/mavi-core', 'src/components/appbuilder/AppBuilderRightPane.jsx');

let code = fs.readFileSync(appBuilderPath, 'utf8');
const lines = code.split('\n');

const startIndex = 14323; // {/* Right Pane: Context Pane */}
const endIndex = 24302; // )}

const rightPaneJsx = lines.slice(startIndex, endIndex + 1).join('\n');

// We need to wrap it in a component to parse it as valid JSX
const wrapperCode = `
import React from 'react';
export default function Wrapper() {
    return (
        <>
            ${rightPaneJsx}
        </>
    );
}
`;

const ast = parser.parse(wrapperCode, {
    sourceType: 'module',
    plugins: ['jsx']
});

const unboundIdentifiers = new Set();
const globals = new Set([
    'React', 'console', 'window', 'document', 'Math', 'JSON', 'Object', 'Array', 'String', 'Number', 'Boolean', 'Date',
    'setTimeout', 'clearTimeout', 'parseFloat', 'parseInt', 'isNaN', 'isFinite', 'undefined',
    // Lucide/components
    'FilePlus', 'HelpCircle', 'Save', 'Smartphone', 'Undo2', 'Redo2',
    'Lock', 'Unlock', 'Layout', 'Code', 'Play', 'Blocks', 'Network', 'Sun', 'Moon', 'Settings2', 'LayoutGrid',
    'AlignLeft', 'AlignCenter', 'AlignRight', 'AlignJustify', 'Type', 'Image', 'FormInput', 'MousePointer2',
    'Settings', 'Copy', 'Trash', 'Plus', 'Minus', 'ChevronDown', 'ChevronRight', 'Search', 'Table', 'LayoutDashboard',
    'Component', 'Info', 'Palette', 'ToggleRight', 'X', 'Clock', 'Eye', 'Sliders', 'Trash2', 'FolderOpen', 'FileText',
    'COMPONENT_TYPES', 'SelectedDeviceIcon'
]);

traverse(ast, {
    Identifier(path) {
        // If it's a JSXIdentifier, it could be a prop name or intrinsic element
        if (path.isJSXIdentifier()) {
            const parent = path.parent;
            // If it's an attribute name, ignore
            if (parent.type === 'JSXAttribute' && parent.name === path.node) return;
            // If it's a built in HTML element, ignore (lowercase start)
            if (parent.type === 'JSXOpeningElement' || parent.type === 'JSXClosingElement') {
                if (/^[a-z]/.test(path.node.name)) return;
            }
        }
        
        // Skip properties of objects (e.g. `foo` in `obj.foo`) unless it's computed
        if (path.parent.type === 'MemberExpression' && path.parent.property === path.node && !path.parent.computed) {
            return;
        }

        // Skip object keys
        if (path.parent.type === 'ObjectProperty' && path.parent.key === path.node && !path.parent.computed) {
            return;
        }
        
        const name = path.node.name;
        if (!path.scope.hasBinding(name) && !globals.has(name)) {
            unboundIdentifiers.add(name);
        }
    }
});

const props = Array.from(unboundIdentifiers).filter(Boolean);

console.log("Extracted Props:", props.join(', '));

// Let's create the Right Pane file
const rightPaneCode = `import React from 'react';
import { 
    AlignLeft, AlignCenter, AlignRight, AlignJustify,
    Type, Layout, Image, FormInput, MousePointer2,
    Settings, Copy, Trash, Plus, Minus, ChevronDown, ChevronRight,
    Search, Table, LayoutDashboard, Component, Info, Palette, Play, ToggleRight, X, Clock, Eye, Sliders,
    Trash2, FolderOpen, FileText
} from 'lucide-react';
import { COMPONENT_TYPES } from './componentTypes';

export default function AppBuilderRightPane({
    ${props.join(', ')}
}) {
    return (
        <>
            {/* Right Pane: Context Pane */}
${rightPaneJsx}
        </>
    );
}
`;

fs.writeFileSync(rightPanePath, rightPaneCode);

// Now update AppBuilder.jsx
const prefix = lines.slice(0, startIndex);
const suffix = lines.slice(endIndex + 1);

const callJsx = `                        {/* Right Pane: Context Pane */}
                        <AppBuilderRightPane
                            ${props.map(p => `${p}={${p}}`).join('\n                            ')}
                        />`;

const newLines = [...prefix, callJsx, ...suffix];

// insert import if not exists
const importLine = `import AppBuilderRightPane from './appbuilder/AppBuilderRightPane';`;
const importExists = newLines.some(l => l.includes('import AppBuilderRightPane'));
if (!importExists) {
    const importIndex = newLines.findIndex(l => l.includes('import AppBuilderLeftPane'));
    if (importIndex !== -1) {
        newLines.splice(importIndex + 1, 0, importLine);
    }
}

fs.writeFileSync(appBuilderPath, newLines.join('\n'));

console.log("Done extracting Right Pane with Babel!");

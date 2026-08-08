const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

const appBuilderPath = path.join('c:/Users/ndens/mavi-core', 'src/components/AppBuilder.jsx');

let code = fs.readFileSync(appBuilderPath, 'utf8');
const lines = code.split('\n');

const ast = parser.parse(code, {
    sourceType: 'module',
    plugins: ['jsx']
});

let rightPaneNode = null;

traverse(ast, {
    JSXExpressionContainer(path) {
        const exp = path.node.expression;
        if (exp.type === 'LogicalExpression' && exp.operator === '&&') {
            const left = exp.left;
            if (left.type === 'BinaryExpression' && left.operator === '===') {
                if (left.left.name === 'viewMode' && left.right.value === 'DESIGN') {
                    if (exp.right.type === 'JSXElement') {
                        const open = exp.right.openingElement;
                        if (open.name.name === 'div') {
                            const styleAttr = open.attributes.find(a => a.name && a.name.name === 'style');
                            if (styleAttr && styleAttr.value.type === 'JSXExpressionContainer') {
                                const styleObj = styleAttr.value.expression;
                                const widthProp = styleObj.properties.find(p => p.key.name === 'width');
                                if (widthProp && widthProp.value.value === '340px') {
                                    rightPaneNode = exp.right;
                                    path.stop();
                                }
                            }
                        }
                    }
                }
            }
        }
    }
});

if (!rightPaneNode) {
    console.log("Could not find Right Pane Node!");
    process.exit(1);
}

const unboundIdentifiers = new Set();
const globals = new Set([
    'React', 'console', 'window', 'document', 'Math', 'JSON', 'Object', 'Array', 'String', 'Number', 'Boolean', 'Date',
    'setTimeout', 'clearTimeout', 'parseFloat', 'parseInt', 'isNaN', 'isFinite', 'undefined',
    'div', 'span', 'input', 'button', 'select', 'option', 'textarea', 'label', 'img',
    'FilePlus', 'HelpCircle', 'Save', 'Smartphone', 'Undo2', 'Redo2',
    'Lock', 'Unlock', 'Layout', 'Code', 'Play', 'Blocks', 'Network', 'Sun', 'Moon', 'Settings2', 'LayoutGrid',
    'AlignLeft', 'AlignCenter', 'AlignRight', 'AlignJustify', 'Type', 'Image', 'FormInput', 'MousePointer2',
    'Settings', 'Copy', 'Trash', 'Plus', 'Minus', 'ChevronDown', 'ChevronRight', 'Search', 'Table', 'LayoutDashboard',
    'Component', 'Info', 'Palette', 'ToggleRight', 'X', 'Clock', 'Eye', 'Sliders', 'Trash2', 'FolderOpen', 'FileText',
    'COMPONENT_TYPES', 'SelectedDeviceIcon', 'e'
]);

traverse(ast, {
    Identifier(path) {
        if (path.node.start < rightPaneNode.start || path.node.end > rightPaneNode.end) return;
        if (path.parent.type === 'JSXAttribute' && path.parent.name === path.node) return;
        if (path.parent.type === 'JSXOpeningElement' || path.parent.type === 'JSXClosingElement') {
            if (/^[a-z]/.test(path.node.name)) return;
        }
        if (path.parent.type === 'MemberExpression' && path.parent.property === path.node && !path.parent.computed) return;
        if (path.parent.type === 'ObjectProperty' && path.parent.key === path.node && !path.parent.computed) return;

        const name = path.node.name;

        if (path.scope.hasBinding(name)) {
            const binding = path.scope.getBinding(name);
            if (binding && binding.path && binding.path.node && binding.path.node.start >= rightPaneNode.start && binding.path.node.end <= rightPaneNode.end) {
                return;
            }
            unboundIdentifiers.add(name);
        } else {
            if (!globals.has(name)) {
                unboundIdentifiers.add(name);
            }
        }
    }
});

const props = Array.from(unboundIdentifiers).filter(Boolean);

// Now perform the injection
const rightPaneJsx = lines.slice(rightPaneNode.loc.start.line - 1, rightPaneNode.loc.end.line).join('\n');
const rightPaneCode = `import React from 'react';
import { 
    AlignLeft, AlignCenter, AlignRight, AlignJustify,
    Type, Layout, Image, FormInput, MousePointer2,
    Settings, Copy, Trash, Plus, Minus, ChevronDown, ChevronRight,
    Search, Table, LayoutDashboard, Component, Info, Palette, Play, ToggleRight, X, Clock, Eye, Sliders,
    Trash2, FolderOpen, FileText, Lock, Unlock, Moon, Sun, Monitor, Smartphone, Tablet
} from 'lucide-react';
import { COMPONENT_TYPES } from './componentTypes';

export default function AppBuilderRightPane({
    viewMode,
    ${props.join(',\n    ')}
}) {
    return (
        <>
${rightPaneJsx}
        </>
    );
}
`;

fs.writeFileSync('src/components/appbuilder/AppBuilderRightPane.jsx', rightPaneCode);

const prefix = lines.slice(0, rightPaneNode.loc.start.line - 1);
const suffix = lines.slice(rightPaneNode.loc.end.line);

const callJsx = `                            <AppBuilderRightPane
                                viewMode={viewMode}
                                ${props.map(p => `${p}={${p}}`).join('\n                                ')}
                            />`;

const newLines = [...prefix, callJsx, ...suffix];

const importLine = `import AppBuilderRightPane from './appbuilder/AppBuilderRightPane';`;
if (!newLines.some(l => l.includes('import AppBuilderRightPane'))) {
    const importIndex = newLines.findIndex(l => l.includes('import AppBuilderLeftPane'));
    if (importIndex !== -1) {
        newLines.splice(importIndex + 1, 0, importLine);
    } else {
        newLines.splice(2, 0, importLine);
    }
}

fs.writeFileSync(appBuilderPath, newLines.join('\n'));
console.log("Successfully extracted Right Pane to AppBuilderRightPane.jsx and updated AppBuilder.jsx!");

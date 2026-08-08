const fs = require('fs');

let file = fs.readFileSync('src/components/AppBuilder.jsx', 'utf8');

// 1. Remove System 1 (builderStack, preCopilotSnapshot, saveToHistory, undo, redo)
const sys1Start = file.indexOf('// --- History / Undo Stack ---');
const sys1End = file.indexOf('// --- Query & Aggregation Editor State ---');
if (sys1Start !== -1 && sys1End !== -1) {
    file = file.substring(0, sys1Start) + file.substring(sys1End);
}

// 2. Remove System 2 State
const sys2Start = file.indexOf('// --- Undo/Redo State ---');
const sys2End = file.indexOf('// --- Completion Records Tracking State ---');
if (sys2Start !== -1 && sys2End !== -1) {
    file = file.substring(0, sys2Start) + file.substring(sys2End);
}

// 3. Remove System 2 Logic (saveHistory, handleHistorySnapshot, handleUndo, handleRedo)
const logicStart = file.indexOf('const saveHistory = () => {');
const logicEnd = file.indexOf('const duplicateWidget = (compToCopy) => {');
if (logicStart !== -1 && logicEnd !== -1) {
    file = file.substring(0, logicStart) + file.substring(logicEnd);
}

// 4. Inject Import
const importHook = `import useAppBuilderHistory from '../hooks/useAppBuilderHistory';\n`;
if (!file.includes('useAppBuilderHistory')) {
    const importTarget = `import AppBuilderLeftPane`;
    const importIndex = file.indexOf(importTarget);
    if (importIndex !== -1) {
        file = file.substring(0, importIndex) + importHook + file.substring(importIndex);
    }
}

// 5. Inject Hook Call
const hookCall = `
    const { 
        builderStack, setBuilderStack, 
        preCopilotSnapshot, setPreCopilotSnapshot, 
        saveToHistory, undo, redo, 
        history, setHistory, 
        future, setFuture, 
        saveHistory, handleHistorySnapshot, handleUndo, handleRedo 
    } = useAppBuilderHistory({ 
        steps, setSteps, 
        baseComponents, setBaseComponents, 
        appTriggers, setAppTriggers, 
        appVariables, setAppVariables, 
        appName, setAppName 
    });
`;
const compStart = file.indexOf('const AppBuilder = () => {');
if (compStart !== -1 && !file.includes('const { builderStack, setBuilderStack')) {
    const compBodyStart = file.indexOf('{', compStart) + 1;
    file = file.substring(0, compBodyStart) + hookCall + file.substring(compBodyStart);
}

fs.writeFileSync('src/components/AppBuilder.jsx', file);
console.log('AppBuilder.jsx successfully updated with useAppBuilderHistory!');

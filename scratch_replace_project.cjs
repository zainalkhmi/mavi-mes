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

let lines = code.split('\n');
const nodesToRemove = [];

traverse(ast, {
    VariableDeclarator(path) {
        if (path.node.id && projectFns.includes(path.node.id.name)) {
            // Ignore handleSave in specific components above line 5000
            if (path.node.loc.start.line < 5000) return;
            const decl = path.findParent(p => p.isVariableDeclaration());
            if (decl && !nodesToRemove.includes(decl.node)) {
                nodesToRemove.push(decl.node);
            }
        }
    }
});

// Sort by line number descending to splice safely
nodesToRemove.sort((a, b) => b.loc.start.line - a.loc.start.line);

for (const node of nodesToRemove) {
    const startLine = node.loc.start.line - 1;
    const endLine = node.loc.end.line; // .end.line is 1-based, so endLine - startLine is count
    lines.splice(startLine, endLine - startLine);
}

// Now insert import and hook call
const importStmt = `import useAppBuilderProject from '../hooks/useAppBuilderProject';`;
if (!lines.some(l => l.includes('import useAppBuilderProject'))) {
    const importIdx = lines.findIndex(l => l.includes('import useAppBuilderHistory'));
    if (importIdx !== -1) {
        lines.splice(importIdx + 1, 0, importStmt);
    }
}

const hookCall = `
    const {
        handleCreateTemplateApp, handleCreateTuneUpTemplate, handleSave, handleDeleteApp, handlePublish, handleRequestApproval, handleApproveApp, handleImportProject, handleDuplicateProject, handleAutoSave, handleRecoverDraft, getCurrentApp, handleCopyUrl, loadApp
    } = useAppBuilderProject({
        state: { setIsSaving, createTable, getTables, setTables, loadApps, setIsCreateDrawerOpen, setProUiDialog, currentAppId, appName, appCategory, appMeta, steps, baseComponents, appTriggers, appVariables, appFunctions, appTables, recordPlaceholders, globalLogic, helpGuide, materialId, productImage, iotConfig, integrationConnectors, appBackgroundColor, appThemeMode, leftSidebarEnabled, rightSidebarEnabled, copilotEnabled, stepListEnabled, isCanvasLocked, previewDevice, previewOrientation, scalingMode, setAppMeta, setCurrentAppId, resetBuilder, setPublishModal, setProPrompt, setAppName, setAppCategory, setSteps, setBaseComponents, setAppTriggers, setAppVariables, setAppFunctions, setAppTables, setRecordPlaceholders, setMaterialId, setProductImage, setIotConfig, setIntegrationConnectors, setAppBackgroundColor, setAppThemeMode, setScalingMode, setLeftSidebarEnabled, setRightSidebarEnabled, setCopilotEnabled, setStepListEnabled, setGlobalLogic, setHelpGuide, setRecordPlaceholderData, setCurrentStepId, setSelectedCompIds, setViewMode, setIsCanvasLocked },
        utils: { projectMgmt, clampNonNegativeInt, normalizeFormSubmitConfig, uploadManualImage, isSupabaseReady, updateComponentProps, setIsUploadingImage, setIsUploadingPdf }
    });
`;

const hookIdx = lines.findIndex(l => l.includes('} = useAppBuilderHistory('));
if (hookIdx !== -1) {
    // Find the end of useAppBuilderHistory call
    let endIdx = hookIdx;
    while (!lines[endIdx].includes('});') && endIdx < lines.length) {
        endIdx++;
    }
    lines.splice(endIdx + 1, 0, hookCall);
}

fs.writeFileSync('src/components/AppBuilder.jsx', lines.join('\n'));
console.log('Successfully removed ' + nodesToRemove.length + ' functions and injected hook!');

const fs = require('fs');

const appBuilderPath = 'src/components/AppBuilder.jsx';
const toolbarPath = 'src/components/appbuilder/AppBuilderToolbar.jsx';

if (!fs.existsSync('src/components/appbuilder')) {
    fs.mkdirSync('src/components/appbuilder', { recursive: true });
}

let code = fs.readFileSync(appBuilderPath, 'utf8');
const lines = code.split('\n');

const startIndex = 13084;
const endIndex = 13650;

const toolbarJsx = lines.slice(startIndex, endIndex + 1).join('\n');

const toolbarComponent = `import React from 'react';
import { 
    FilePlus, HelpCircle, Save, Smartphone, Undo2, Redo2, 
    Lock, Unlock, Layout, Code, Play, Blocks, Network, Sun, Moon, Settings2 
} from 'lucide-react';
import ProjectManager from '../ProjectManager';
// import { SelectedDeviceIcon } from '../AppBuilder';

export default function AppBuilderToolbar({
    builderTheme, currentAppId, getCurrentApp, handleImportProject, handleDuplicateProject, loadApp,
    setIsCreateDrawerOpen, helpGuide, setIsHelpGuideOpen, handleSave, isSaving, setCompanionModal,
    handleUndo, history, handleRedo, future, DEVICE_PRESETS, previewDevice, handleDeviceChange,
    previewOrientation, handleOrientationToggle, viewMode, setIsCanvasLocked, isCanvasLocked,
    setViewMode, setActiveLogicScopeId, appName, setAppName, toggleTheme, isSettingsOpen, setIsSettingsOpen,
    appZoom, setAppZoom, isGridVisible, setIsGridVisible
}) {
    return (
${toolbarJsx}
    );
}
`;

fs.writeFileSync(toolbarPath, toolbarComponent);

const replacement = `            <AppBuilderToolbar
                builderTheme={builderTheme}
                currentAppId={currentAppId}
                getCurrentApp={getCurrentApp}
                handleImportProject={handleImportProject}
                handleDuplicateProject={handleDuplicateProject}
                loadApp={loadApp}
                setIsCreateDrawerOpen={setIsCreateDrawerOpen}
                helpGuide={helpGuide}
                setIsHelpGuideOpen={setIsHelpGuideOpen}
                handleSave={handleSave}
                isSaving={isSaving}
                setCompanionModal={setCompanionModal}
                handleUndo={handleUndo}
                history={history}
                handleRedo={handleRedo}
                future={future}
                DEVICE_PRESETS={DEVICE_PRESETS}
                previewDevice={previewDevice}
                handleDeviceChange={handleDeviceChange}
                previewOrientation={previewOrientation}
                handleOrientationToggle={handleOrientationToggle}
                viewMode={viewMode}
                setIsCanvasLocked={setIsCanvasLocked}
                isCanvasLocked={isCanvasLocked}
                setViewMode={setViewMode}
                setActiveLogicScopeId={setActiveLogicScopeId}
                appName={appName}
                setAppName={setAppName}
                toggleTheme={toggleTheme}
                isSettingsOpen={isSettingsOpen}
                setIsSettingsOpen={setIsSettingsOpen}
                appZoom={appZoom}
                setAppZoom={setAppZoom}
                isGridVisible={isGridVisible}
                setIsGridVisible={setIsGridVisible}
            />`;

lines.splice(startIndex, endIndex - startIndex + 1, replacement);
const updatedAppBuilderCode = lines.join('\n');

let importLines = updatedAppBuilderCode.split('\n');
const importIndex = importLines.findIndex(l => l.includes('import ProjectManager'));
if (importIndex !== -1) {
    importLines.splice(importIndex + 1, 0, "import AppBuilderToolbar from './appbuilder/AppBuilderToolbar';");
} else {
    importLines.splice(2, 0, "import AppBuilderToolbar from './appbuilder/AppBuilderToolbar';");
}

fs.writeFileSync(appBuilderPath, importLines.join('\n'));
console.log('Extraction complete!');

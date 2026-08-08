const fs = require('fs');

const appBuilderPath = 'src/components/AppBuilder.jsx';
const panePath = 'src/components/appbuilder/AppBuilderLeftPane.jsx';

let code = fs.readFileSync(appBuilderPath, 'utf8');
const lines = code.split('\n');

const startIndex = 13642;
const endIndex = 14363;

const paneJsx = lines.slice(startIndex, endIndex + 1).join('\n');

const paneComponent = `import React from 'react';
import { 
    X, RotateCw, Hash, ToggleRight, Calendar, Database, Layout, 
    ChevronRight, Plus, Trash2, FileText, Square, FolderOpen 
} from 'lucide-react';
// import { COMPONENT_TYPES } from './componentTypes'; 
// Temporarily using mock if COMPONENT_TYPES not exported or available. 
// We will just assume it is passed or imported if needed, but it seems COMPONENT_TYPES is in AppBuilder's scope,
// wait, COMPONENT_TYPES is imported from './appbuilder/componentTypes' in AppBuilder.jsx.
import { COMPONENT_TYPES } from './componentTypes';

export default function AppBuilderLeftPane({
    viewMode, devModeStation, setDevModeStation, devModeUser, setDevModeUser, devModeConnEnv, setDevModeConnEnv,
    currentStepId, setCurrentStepId, steps, previewDevice, handleDeviceChange, DEVICE_PRESETS,
    previewOrientation, handleOrientationToggle, devModeLiveTab, setDevModeLiveTab, appVariables,
    recordPlaceholders, setRecordPlaceholders, tables, appTables, stepPanelTab, setStepPanelTab,
    filteredSteps, collapsedStepGroups, setCollapsedStepGroups, addStep, deleteStep, handleStepDrop,
    expandedSteps, setExpandedSteps, setSelectedCompIds, setActiveTab, selectedCompId,
    activeDropdown, setActiveDropdown, handleAddTableToApp, handleRemoveTableFromApp,
    setQueryEditor, updateTable, setAggregationEditor, setProPrompt, appsList, loadApp,
    currentAppId, handleDeleteApp
}) {
    return (
        <>
${paneJsx}
        </>
    );
}
`;

fs.writeFileSync(panePath, paneComponent);

const replacement = `            <AppBuilderLeftPane
                viewMode={viewMode}
                devModeStation={devModeStation}
                setDevModeStation={setDevModeStation}
                devModeUser={devModeUser}
                setDevModeUser={setDevModeUser}
                devModeConnEnv={devModeConnEnv}
                setDevModeConnEnv={setDevModeConnEnv}
                currentStepId={currentStepId}
                setCurrentStepId={setCurrentStepId}
                steps={steps}
                previewDevice={previewDevice}
                handleDeviceChange={handleDeviceChange}
                DEVICE_PRESETS={DEVICE_PRESETS}
                previewOrientation={previewOrientation}
                handleOrientationToggle={handleOrientationToggle}
                devModeLiveTab={devModeLiveTab}
                setDevModeLiveTab={setDevModeLiveTab}
                appVariables={appVariables}
                recordPlaceholders={recordPlaceholders}
                setRecordPlaceholders={setRecordPlaceholders}
                tables={tables}
                appTables={appTables}
                stepPanelTab={stepPanelTab}
                setStepPanelTab={setStepPanelTab}
                filteredSteps={filteredSteps}
                collapsedStepGroups={collapsedStepGroups}
                setCollapsedStepGroups={setCollapsedStepGroups}
                addStep={addStep}
                deleteStep={deleteStep}
                handleStepDrop={handleStepDrop}
                expandedSteps={expandedSteps}
                setExpandedSteps={setExpandedSteps}
                setSelectedCompIds={setSelectedCompIds}
                setActiveTab={setActiveTab}
                selectedCompId={selectedCompId}
                activeDropdown={activeDropdown}
                setActiveDropdown={setActiveDropdown}
                handleAddTableToApp={handleAddTableToApp}
                handleRemoveTableFromApp={handleRemoveTableFromApp}
                setQueryEditor={setQueryEditor}
                updateTable={updateTable}
                setAggregationEditor={setAggregationEditor}
                setProPrompt={setProPrompt}
                appsList={appsList}
                loadApp={loadApp}
                currentAppId={currentAppId}
                handleDeleteApp={handleDeleteApp}
            />`;

lines.splice(startIndex, endIndex - startIndex + 1, replacement);
const updatedAppBuilderCode = lines.join('\n');

let importLines = updatedAppBuilderCode.split('\n');
const importIndex = importLines.findIndex(l => l.includes('import AppBuilderToolbar'));
if (importIndex !== -1) {
    importLines.splice(importIndex + 1, 0, "import AppBuilderLeftPane from './appbuilder/AppBuilderLeftPane';");
} else {
    importLines.splice(2, 0, "import AppBuilderLeftPane from './appbuilder/AppBuilderLeftPane';");
}

fs.writeFileSync(appBuilderPath, importLines.join('\n'));
console.log('Extraction complete!');

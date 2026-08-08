const fs=require('fs');
const code=fs.readFileSync('scratch_extracted_project.js','utf8');
const hookCode = `import { saveFrontlineApp, deleteFrontlineApp, publishApp, requestApproval, approveApp } from '../utils/supabaseFrontlineDB';
import { createIncomingInspectionTemplate } from '../utils/incomingInspectionTemplate';

export default function useAppBuilderProject({ state, utils }) {
    const { setIsSaving, createTable, getTables, setTables, loadApps, setIsCreateDrawerOpen, setProUiDialog, currentAppId, appName, appCategory, appMeta, steps, baseComponents, appTriggers, appVariables, appFunctions, appTables, recordPlaceholders, globalLogic, helpGuide, materialId, productImage, iotConfig, integrationConnectors, appBackgroundColor, appThemeMode, leftSidebarEnabled, rightSidebarEnabled, copilotEnabled, stepListEnabled, isCanvasLocked, previewDevice, previewOrientation, scalingMode, setAppMeta, setCurrentAppId, resetBuilder, setPublishModal, setProPrompt, setAppName, setAppCategory, setSteps, setBaseComponents, setAppTriggers, setAppVariables, setAppFunctions, setAppTables, setRecordPlaceholders, setMaterialId, setProductImage, setIotConfig, setIntegrationConnectors, setAppBackgroundColor, setAppThemeMode, setScalingMode, setLeftSidebarEnabled, setRightSidebarEnabled, setCopilotEnabled, setStepListEnabled, setGlobalLogic, setHelpGuide, setRecordPlaceholderData, setCurrentStepId, setSelectedCompIds, setViewMode, setIsCanvasLocked } = state;
    const { projectMgmt, clampNonNegativeInt, normalizeFormSubmitConfig, uploadManualImage, isSupabaseReady, updateComponentProps, setIsUploadingImage, setIsUploadingPdf } = utils;

${code.replace(/^/gm, '    ')}

    return { handleCreateTemplateApp, handleCreateTuneUpTemplate, handleSave, handleDeleteApp, handlePublish, handleRequestApproval, handleApproveApp, handleImportProject, handleDuplicateProject, handleAutoSave, handleRecoverDraft, getCurrentApp, handleCopyUrl, loadApp };
}
`;
fs.writeFileSync('src/hooks/useAppBuilderProject.js', hookCode);
console.log('Created hook!');

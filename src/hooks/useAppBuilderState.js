import { useState, useEffect, useRef } from 'react';
import { DEFAULT_FRONTLINE_APP_NAME, DEFAULT_FRONTLINE_APP_CATEGORY } from '../components/appbuilder/utils';

export const useAppBuilderState = () => {
    const [appName, setAppName] = useState(DEFAULT_FRONTLINE_APP_NAME);
    const [hiddenCategories, setHiddenCategories] = useState(() => {
        try {
            const val = localStorage.getItem('mavi_hidden_categories');
            return val ? JSON.parse(val) : [];
        } catch {
            return [];
        }
    });
    const [hiddenWidgets, setHiddenWidgets] = useState(() => {
        try {
            const val = localStorage.getItem('mavi_hidden_widgets');
            return val ? JSON.parse(val) : [];
        } catch {
            return [];
        }
    });
    const [appMeta, setAppMeta] = useState({
        version: 1,
        approval_status: 'DRAFT',
        is_published: false,
        lastPublishedAt: null,
        approved_by: null,
        approved_at: null
    });
    const [appCategory, setAppCategory] = useState(DEFAULT_FRONTLINE_APP_CATEGORY);
    const [steps, setSteps] = useState([
        { id: 'screen_1', title: 'Screen 1', stepType: 'Screen', cycleTimeSeconds: 60, components: [], triggers: [], logic: { xml: null, code: '' } }
    ]);
    const [globalLogic, setGlobalLogic] = useState({ xml: null, code: '' });
    const [blocklyRuntimeError, setBlocklyRuntimeError] = useState(null);
    const [baseComponents, setBaseComponents] = useState([]);
    const [currentStepId, setCurrentStepId] = useState('screen_1');
    const [activeLogicScopeId, setActiveLogicScopeId] = useState('STEP'); 
    const [selectedCompIds, setSelectedCompIds] = useState([]);
    const [currentAppId, setCurrentAppId] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [recentlyAddedCompId, setRecentlyAddedCompId] = useState(null);
    const [appsList, setAppsList] = useState([]);
    const [builderCameras, setBuilderCameras] = useState([]);
    const [projectSearch, setProjectSearch] = useState('');
    const [lastSavedSignature, setLastSavedSignature] = useState(null);
    const [lastSavedAt, setLastSavedAt] = useState(null);
    const [lastDraftSavedAt, setLastDraftSavedAt] = useState(null);
    const [viewMode, setViewMode] = useState('DESIGN'); 
    const [clipboard, setClipboard] = useState(null);
    const [appBackgroundColor, setAppBackgroundColor] = useState('#ffffff');
    const [appThemeMode, setAppThemeMode] = useState('LIGHT');
    const [builderTheme, setBuilderTheme] = useState(localStorage.getItem('mavi-builder-theme') || 'LIGHT');
    const [refreshKey, setRefreshKey] = useState(0);

    useEffect(() => {
        localStorage.setItem('mavi-builder-theme', builderTheme);
    }, [builderTheme]);

    const [zoomScale, setZoomScale] = useState(1);
    const [activeGuides, setActiveGuides] = useState({ h: [], v: [] }); 
    const [sidebarSearch, setSidebarSearch] = useState('');
    const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const [panStart, setPanStart] = useState({ x: 0, y: 0 });
    const [activeTab, setActiveTab] = useState('WIDGET'); 
    const [appCompletions, setAppCompletions] = useState([]);
    const [selectedCompletion, setSelectedCompletion] = useState(null);
    const [isCompletionModalOpen, setIsCompletionModalOpen] = useState(false);
    const [leftSidebarEnabled, setLeftSidebarEnabled] = useState(true);
    const [rightSidebarEnabled, setRightSidebarEnabled] = useState(true);
    const [copilotEnabled, setCopilotEnabled] = useState(true);
    const [stepListEnabled, setStepListEnabled] = useState(true);
    const [selectionBox, setSelectionBox] = useState(null); 
    const [proUiDialog, setProUiDialog] = useState(null); 
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isCopilotOpen, setIsCopilotOpen] = useState(false);
    const [ghostWidgets, setGhostWidgets] = useState([]); 

    const [previewTimer, setPreviewTimer] = useState(0);
    const [previewChecklistState, setPreviewChecklistState] = useState({});
    const [previewToggleState, setPreviewToggleState] = useState({});
    const [previewQuantityLog, setPreviewQuantityLog] = useState({});
    const [previewFormValues, setPreviewFormValues] = useState({});
    const [previewMenuState, setPreviewMenuState] = useState({});
    const [cameraScannerActive, setCameraScannerActive] = useState({});
    const [activeListPicker, setActiveListPicker] = useState(null); 
    const [cameraScannerValues, setCameraScannerValues] = useState({});
    const [cameraScannerStatus, setCameraScannerStatus] = useState({});
    const [cameraValues, setCameraValues] = useState({});
    const [uploadValues, setUploadValues] = useState({});
    const [drawValues, setDrawValues] = useState({});
    const [signatureValues, setSignatureValues] = useState({});
    const [signatureAuditTrail, setSignatureAuditTrail] = useState([]);
    const [signedStepLocks, setSignedStepLocks] = useState({});
    const [eSignModal, setESignModal] = useState({
        isOpen: false,
        compId: null,
        username: '',
        password: '',
        comment: ''
    });
    const [canvasDrawings, setCanvasDrawings] = useState({}); 
    const [recordingState, setRecordingState] = useState({});
    const [mediaRecorderValues, setMediaRecorderValues] = useState({});
    const [drawActiveRefs] = useState({ current: {} });
    const cameraScannerVideoRefs = useRef({});
    const cameraScannerStreams = useRef({});
    const cameraScannerIntervals = useRef({});
    const drawCanvasRefs = useRef({});
    const drawCtxRefs = useRef({});
    const signatureCanvasRefs = useRef({});
    const signatureCtxRefs = useRef({});
    const signatureActiveRefs = useRef({});
    const mediaRecorderRefs = useRef({});
    const mediaChunksRefs = useRef({});
    const mediaStreamRefs = useRef({});

    const [contextMenu, setContextMenu] = useState({ isOpen: false, x: 0, y: 0, compId: null });
    const [isCanvasLocked, setIsCanvasLocked] = useState(true);
    const [dragState, setDragState] = useState(null); 
    const [resizeState, setResizeState] = useState(null); 
    const dragRafRef = useRef(null);

    useEffect(() => {
        if (isCanvasLocked) {
            setDragState(null);
            setResizeState(null);
        }
    }, [isCanvasLocked]);

    const [appTriggers, setAppTriggers] = useState([]);
    const [appVariables, setAppVariables] = useState([]);
    const [appFunctions, setAppFunctions] = useState([]);
    const [tables, setTables] = useState([]);
    const [savedAnalyses, setSavedAnalyses] = useState([]);
    const [appTables, setAppTables] = useState([]);
    const [recordPlaceholders, setRecordPlaceholders] = useState([]);
    const [recordPlaceholderData, setRecordPlaceholderData] = useState({});
    const [helpGuide, setHelpGuide] = useState('');
    const [isHelpGuideOpen, setIsHelpGuideOpen] = useState(false);

    const currentStepIdRef = useRef(currentStepId);
    const stepsRef = useRef(steps);
    const baseComponentsRef = useRef(baseComponents);
    const appVariablesRef = useRef(appVariables);
    const appFunctionsRef = useRef(appFunctions);
    const appTriggersRef = useRef(appTriggers);
    const tablesRef = useRef(tables);
    const recordPlaceholdersRef = useRef(recordPlaceholders);

    useEffect(() => { currentStepIdRef.current = currentStepId; }, [currentStepId]);
    useEffect(() => { stepsRef.current = steps; }, [steps]);
    useEffect(() => { baseComponentsRef.current = baseComponents; }, [baseComponents]);
    useEffect(() => { appVariablesRef.current = appVariables; }, [appVariables]);
    useEffect(() => { appFunctionsRef.current = appFunctions; }, [appFunctions]);
    useEffect(() => { appTriggersRef.current = appTriggers; }, [appTriggers]);
    useEffect(() => { tablesRef.current = tables; }, [tables]);
    useEffect(() => { recordPlaceholdersRef.current = recordPlaceholders; }, [recordPlaceholders]);

    return {
        appName, setAppName,
        hiddenCategories, setHiddenCategories,
        hiddenWidgets, setHiddenWidgets,
        appMeta, setAppMeta,
        appCategory, setAppCategory,
        steps, setSteps,
        globalLogic, setGlobalLogic,
        blocklyRuntimeError, setBlocklyRuntimeError,
        baseComponents, setBaseComponents,
        currentStepId, setCurrentStepId,
        activeLogicScopeId, setActiveLogicScopeId,
        selectedCompIds, setSelectedCompIds,
        currentAppId, setCurrentAppId,
        isSaving, setIsSaving,
        recentlyAddedCompId, setRecentlyAddedCompId,
        appsList, setAppsList,
        builderCameras, setBuilderCameras,
        projectSearch, setProjectSearch,
        lastSavedSignature, setLastSavedSignature,
        lastSavedAt, setLastSavedAt,
        lastDraftSavedAt, setLastDraftSavedAt,
        viewMode, setViewMode,
        clipboard, setClipboard,
        appBackgroundColor, setAppBackgroundColor,
        appThemeMode, setAppThemeMode,
        builderTheme, setBuilderTheme,
        refreshKey, setRefreshKey,
        zoomScale, setZoomScale,
        activeGuides, setActiveGuides,
        sidebarSearch, setSidebarSearch,
        panOffset, setPanOffset,
        isPanning, setIsPanning,
        panStart, setPanStart,
        activeTab, setActiveTab,
        appCompletions, setAppCompletions,
        selectedCompletion, setSelectedCompletion,
        isCompletionModalOpen, setIsCompletionModalOpen,
        leftSidebarEnabled, setLeftSidebarEnabled,
        rightSidebarEnabled, setRightSidebarEnabled,
        copilotEnabled, setCopilotEnabled,
        stepListEnabled, setStepListEnabled,
        selectionBox, setSelectionBox,
        proUiDialog, setProUiDialog,
        isFullscreen, setIsFullscreen,
        isCopilotOpen, setIsCopilotOpen,
        ghostWidgets, setGhostWidgets,
        previewTimer, setPreviewTimer,
        previewChecklistState, setPreviewChecklistState,
        previewToggleState, setPreviewToggleState,
        previewQuantityLog, setPreviewQuantityLog,
        previewFormValues, setPreviewFormValues,
        previewMenuState, setPreviewMenuState,
        cameraScannerActive, setCameraScannerActive,
        activeListPicker, setActiveListPicker,
        cameraScannerValues, setCameraScannerValues,
        cameraScannerStatus, setCameraScannerStatus,
        cameraValues, setCameraValues,
        uploadValues, setUploadValues,
        drawValues, setDrawValues,
        signatureValues, setSignatureValues,
        signatureAuditTrail, setSignatureAuditTrail,
        signedStepLocks, setSignedStepLocks,
        eSignModal, setESignModal,
        canvasDrawings, setCanvasDrawings,
        recordingState, setRecordingState,
        mediaRecorderValues, setMediaRecorderValues,
        drawActiveRefs,
        cameraScannerVideoRefs,
        cameraScannerStreams,
        cameraScannerIntervals,
        drawCanvasRefs,
        drawCtxRefs,
        signatureCanvasRefs,
        signatureCtxRefs,
        signatureActiveRefs,
        mediaRecorderRefs,
        mediaChunksRefs,
        mediaStreamRefs,
        contextMenu, setContextMenu,
        isCanvasLocked, setIsCanvasLocked,
        dragState, setDragState,
        resizeState, setResizeState,
        dragRafRef,
        appTriggers, setAppTriggers,
        appVariables, setAppVariables,
        appFunctions, setAppFunctions,
        tables, setTables,
        savedAnalyses, setSavedAnalyses,
        appTables, setAppTables,
        recordPlaceholders, setRecordPlaceholders,
        recordPlaceholderData, setRecordPlaceholderData,
        helpGuide, setHelpGuide,
        isHelpGuideOpen, setIsHelpGuideOpen,
        currentStepIdRef,
        stepsRef,
        baseComponentsRef,
        appVariablesRef,
        appFunctionsRef,
        appTriggersRef,
        tablesRef,
        recordPlaceholdersRef
    };
};

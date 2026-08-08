    const handleCreateTemplateApp = async () => {
        setIsSaving(true);
        try {
            const templateApp = createIncomingInspectionTemplate();
            let logTableId = null;
            try {
                const newTable = await createTable({
                    name: 'IQC_Inspections',
                    fields: [
                        { name: 'Part_Number', type: 'text' },
                        { name: 'Lot_Number', type: 'text' },
                        { name: 'Overall_Result', type: 'text' },
                        { name: 'Timestamp', type: 'datetime' }
                    ]
                });
                if (newTable && newTable.id) logTableId = newTable.id;
                const updatedTables = await getTables();
                setTables(updatedTables);
            } catch (tErr) {
                console.warn('Could not create IQC table:', tErr);
            }
            if (logTableId) {
                const appStr = JSON.stringify(templateApp).replace(/iqc_inspections/g, logTableId);
                const parsed = JSON.parse(appStr);
                parsed.config.appTables = [logTableId];
                Object.assign(templateApp, parsed);
            }
            const { id, ...templateData } = templateApp;
            const savedApp = await saveFrontlineApp({
                ...templateData,
                config: {
                    ...(templateData.config || {}),
                    isLocked: true
                },
                is_published: templateApp.published ?? false,
                approval_status: templateApp.approvalStatus || 'DRAFT',
                updated_at: new Date().toISOString()
            });
            await loadApps();
            setIsCreateDrawerOpen(false);
            loadApp(savedApp || templateApp);
            setProUiDialog({
                type: 'success',
                message: 'Incoming Inspection Template Created!',
                detail: 'IQC inspection flow and database table are ready.'
            });
        } catch (error) {
            console.error('Failed to create template app:', error);
            alert('Error: ' + (error.message || 'Unknown error'));
        } finally {
            setIsSaving(false);
        }
    };

    const handleCreateTuneUpTemplate = handleCreateTemplateApp;

    const handleLocalImageUpload = async (e, compId) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploadingImage(true);
        try {
            const fileToDataUrl = (inputFile) => new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = () => reject(new Error('Failed to read image file'));
                reader.readAsDataURL(inputFile);
            });

            // Prefer Supabase URL, but gracefully fallback to local data URL
            // so IMAGE widget can still be used when Supabase is not configured.
            if (isSupabaseReady()) {
                const storagePath = `app-builder/${currentAppId || 'new'}/${compId}_${Date.now()}.jpg`;
                const publicUrl = await uploadManualImage(storagePath, file);
                updateComponentProps(compId, { picture: publicUrl, src: publicUrl });
            } else {
                const dataUrl = await fileToDataUrl(file);
                updateComponentProps(compId, { picture: dataUrl, src: dataUrl });
                alert('Supabase belum dikonfigurasi. Gambar dipakai sebagai local (data URL).');
            }
        } catch (err) {
            console.error('Widget image upload failed:', err);
            try {
                const fallbackDataUrl = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result);
                    reader.onerror = () => reject(new Error('Failed to read image file'));
                    reader.readAsDataURL(file);
                });
                updateComponentProps(compId, { picture: fallbackDataUrl, src: fallbackDataUrl });
                alert(`Upload ke Supabase gagal, gambar tetap dipakai lokal. Detail: ${err?.message || 'unknown error'}`);
            } catch {
                alert('Failed to upload image and failed to read local file.');
            }
        } finally {
            setIsUploadingImage(false);
            if (widgetImageInputRef.current) widgetImageInputRef.current.value = '';
        }
    };

    const handleLocalPdfUpload = async (e, compId) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploadingPdf(true);
        try {
            const fileToDataUrl = (inputFile) => new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = () => reject(new Error('Failed to read PDF file'));
                reader.readAsDataURL(inputFile);
            });

            if (isSupabaseReady()) {
                const storagePath = `app-builder/${currentAppId || 'new'}/${compId}_${Date.now()}.pdf`;
                // Reusing uploadManualImage since it handles generic Blobs/Files
                const publicUrl = await uploadManualImage(storagePath, file);
                updateComponentProps(compId, { url: publicUrl });
            } else {
                const dataUrl = await fileToDataUrl(file);
                updateComponentProps(compId, { url: dataUrl });
                alert('Supabase belum dikonfigurasi. PDF dipakai sebagai local (data URL).');
            }
        } catch (err) {
            console.error('Widget PDF upload failed:', err);
            try {
                const fallbackDataUrl = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result);
                    reader.onerror = () => reject(new Error('Failed to read PDF file'));
                    reader.readAsDataURL(file);
                });
                updateComponentProps(compId, { url: fallbackDataUrl });
                alert(`Upload ke Supabase gagal, PDF tetap dipakai lokal. Detail: ${err?.message || 'unknown error'}`);
            } catch {
                alert('Failed to upload PDF and failed to read local file.');
            }
        } finally {
            setIsUploadingPdf(false);
            if (widgetPdfInputRef.current) widgetPdfInputRef.current.value = '';
        }
    };

    const updateStepTriggers = (stepId, newTriggers) => {
        setSteps(steps.map(s => s.id === stepId ? { ...s, triggers: newTriggers } : s));
    };

    const addStepTriggerTemplate = (event, name) => {
        const newTrig = {
            id: `trig_${Date.now()}`,
            name: name || (event || 'Unnamed').replace('ON_', '').replace(/_/g, ' ') + ' Trigger',
            event,
            enabled: true,
            clauses: [{ conditions: [], actions: [] }],
            elseActions: [],
            ...(event === 'TIMER' ? { timerInterval: 60 } : {}),
            ...(event === 'ON_VARIABLE_CHANGE' ? { watchVar: '' } : {})
        };
        setTriggerEditor({ isOpen: true, sourceType: 'STEP', sourceId: currentStepId, trigger: newTrig });
    };

    const handleSave = async (silent = false, overrides = {}) => {
        if (!silent) setIsSaving(true);
        try {
            const saved = await saveFrontlineApp({
                id: currentAppId,
                name: appName,
                category: appCategory,
                config: {
                    steps: overrides.steps || steps,
                    baseComponents: overrides.baseComponents || baseComponents,
                    appTriggers: overrides.appTriggers || appTriggers,
                    appVariables: overrides.appVariables || appVariables,
                    appFunctions: overrides.appFunctions || appFunctions,
                    appTables: overrides.appTables || appTables,
                    recordPlaceholders: overrides.recordPlaceholders || recordPlaceholders,
                    globalLogic: overrides.globalLogic || globalLogic,
                    helpGuide: overrides.helpGuide || helpGuide,
                    materialId,
                    productImage,
                    iotConfig,
                    integrationConnectors,
                    appBackgroundColor,
                    appThemeMode,
                    leftSidebarEnabled,
                    rightSidebarEnabled,
                    copilotEnabled,
                    stepListEnabled,
                    isLocked: isCanvasLocked,
                    devicePreset: previewDevice,
                    previewOrientation: previewOrientation,
                    scalingMode
                },
                version: appMeta.version,
                approval_status: appMeta.approval_status,
                is_published: appMeta.is_published
            });
            setCurrentAppId(saved.id);
            if (!silent) alert('App saved successfully!');
            loadApps();
            return saved;
        } catch (err) {
            console.error('Save failed:', err);
            if (!silent) alert('Failed to save app.');
            throw err;
        } finally {
            if (!silent) setIsSaving(false);
        }
    };

    const handleDeleteApp = async (id, e) => {
        e.stopPropagation();
        e.preventDefault();

        if (!id) {
            alert('Project ID tidak valid');
            return;
        }

        if (confirm('Are you sure you want to delete this app? This action cannot be undone.')) {
            try {
                await deleteFrontlineApp(id);

                // Purge from all localStorage caches so LiveTerminal doesn't show ghost entries
                const cacheKeys = ['mavi_offline_vault', 'offline_apps_cache', 'draft_frontline_apps'];
                cacheKeys.forEach(key => {
                    try {
                        const raw = localStorage.getItem(key);
                        if (raw) {
                            const arr = JSON.parse(raw);
                            if (Array.isArray(arr)) {
                                const filtered = arr.filter(a => String(a.id) !== String(id));
                                if (filtered.length !== arr.length) {
                                    localStorage.setItem(key, JSON.stringify(filtered));
                                    console.log(`[Delete] Purged app ${id} from cache "${key}"`);
                                }
                            }
                        }
                    } catch (e) { /* ignore parse errors */ }
                });

                // Remove from AppStore installed templates so template shows "Install" again
                try {
                    const raw = localStorage.getItem('installedAppStoreTemplates');
                    if (raw) {
                        const mapping = JSON.parse(raw);
                        const updatedMapping = {};
                        for (const [templateId, appId] of Object.entries(mapping)) {
                            if (String(appId) !== String(id)) {
                                updatedMapping[templateId] = appId;
                            }
                        }
                        localStorage.setItem('installedAppStoreTemplates', JSON.stringify(updatedMapping));
                    }
                } catch (e) { /* ignore parse errors */ }

                if (currentAppId === id) resetBuilder();
                await loadApps();
                alert('Project deleted successfully!');
            } catch (err) {
                console.error('Delete failed:', err);
                alert('Failed to delete app: ' + (err.message || 'Unknown error'));
            }
        }
    };

    const handlePublish = async () => {
        if (!currentAppId) {
            alert('Please save the app first.');
            return;
        }
        if (!confirm('Publish new version? This will update the Shop Floor to the current draft configuration.')) return;

        setIsSaving(true);
        try {
            await handleSave(true);
            const published = await publishApp(currentAppId);
            setAppMeta({
                ...appMeta,
                version: published.version,
                approval_status: published.approval_status,
                is_published: true,
                lastPublishedAt: published.updated_at
            });
            const url = `${window.location.origin}/#/terminal/${published.id}`;
            setPublishModal({ isOpen: true, url });
            alert(`App Published V${published.version || 1} successfully!`);
            if (!published.is_published && published.id) {
                console.warn('App published but is_published flag missing in DB. Running in legacy mode.');
            }
        } catch (err) {
            console.error('Publish failed:', err);
            if (String(err.message || '').includes('column')) {
                alert('Publish failed: Database schema mismatch. Please run the latest SQL setup script in your Supabase SQL Editor.');
            } else {
                alert('Failed to publish app. Check console for details.');
            }
        } finally {
            setIsSaving(false);
        }
    };

    const handleRequestApproval = async () => {
        if (!currentAppId) return;
        setIsSaving(true);
        try {
            const updated = await requestApproval(currentAppId);
            setAppMeta({ ...appMeta, approval_status: 'PENDING' });
            alert('Approval requested.');
        } catch (err) {
            alert('Failed to request approval.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleApproveApp = async () => {
        if (!currentAppId) return;
        setProPrompt({
            isOpen: true,
            title: 'Electronic Signature',
            message: 'Enter your name or password to sign this approval:',
            initialValue: 'ADMIN_USER',
            onConfirm: async (val) => {
                const signature = val;
                if (!signature) return;
                setIsSaving(true);
                try {
                    await approveApp(currentAppId, 'System Admin');
                    setAppMeta({
                        ...appMeta,
                        approval_status: 'APPROVED',
                        approved_by: 'System Admin',
                        approved_at: new Date().toISOString()
                    });
                    alert('App approved and locked for deployment.');
                } catch (err) {
                    console.error('Failed to approve app:', err);
                    alert('Failed to approve app.');
                } finally {
                    setIsSaving(false);
                }
            }
        });
    };


    const handleImportProject = async (importedData) => {
        try {
            // Create new app with imported data
            setCurrentAppId(null);
            setAppName(importedData.name);
            setAppCategory(importedData.category);
            setAppMeta({
                version: 1,
                approval_status: 'DRAFT',
                is_published: false,
                lastPublishedAt: null,
                approved_by: null,
                approved_at: null
            });
            setSteps(importedData.config?.steps || []);
            setBaseComponents(importedData.config?.baseComponents || []);
            setAppTriggers(importedData.config?.appTriggers || []);
            setAppVariables(importedData.config?.appVariables || []);
            setAppFunctions(importedData.config?.appFunctions || []);
            setAppTables(importedData.config?.appTables || []);
            setRecordPlaceholders(importedData.config?.recordPlaceholders || []);
            setMaterialId(importedData.config?.materialId || null);
            setProductImage(importedData.config?.productImage || '');
            setIotConfig(importedData.config?.iotConfig || {});
            setIntegrationConnectors(importedData.config?.integrationConnectors || []);
            setAppBackgroundColor(importedData.config?.appBackgroundColor || '#ffffff');
            setAppThemeMode(importedData.config?.appThemeMode || 'light');
            setScalingMode(importedData.config?.scalingMode || 'FIT_SCREEN');
            setLeftSidebarEnabled(importedData.config?.leftSidebarEnabled !== false);
            setRightSidebarEnabled(importedData.config?.rightSidebarEnabled !== false);
            setCopilotEnabled(importedData.config?.copilotEnabled !== false);
            setStepListEnabled(importedData.config?.stepListEnabled !== false);

            alert('Project imported successfully! Click Save to save this as a new project.');
        } catch (error) {
            console.error('Import failed:', error);
            alert('Failed to import project: ' + error.message);
        }
    };

    const handleDuplicateProject = async (duplicatedData) => {
        try {
            // Create new app with duplicated data
            setCurrentAppId(null);
            setAppName(duplicatedData.name);
            setAppCategory(duplicatedData.category);
            setSteps(duplicatedData.config?.steps || []);
            setBaseComponents(duplicatedData.config?.baseComponents || []);
            setAppTriggers(duplicatedData.config?.appTriggers || []);
            setAppVariables(duplicatedData.config?.appVariables || []);
            setAppFunctions(duplicatedData.config?.appFunctions || []);
            setAppTables(duplicatedData.config?.appTables || []);
            setRecordPlaceholders(duplicatedData.config?.recordPlaceholders || []);
            setMaterialId(duplicatedData.config?.materialId || null);
            setProductImage(duplicatedData.config?.productImage || '');
            setIotConfig(duplicatedData.config?.iotConfig || {});
            setIntegrationConnectors(duplicatedData.config?.integrationConnectors || []);
            setAppBackgroundColor(duplicatedData.config?.appBackgroundColor || '#ffffff');
            setAppThemeMode(duplicatedData.config?.appThemeMode || 'light');
            setScalingMode(duplicatedData.config?.scalingMode || 'FIT_SCREEN');
            setLeftSidebarEnabled(duplicatedData.config?.leftSidebarEnabled !== false);
            setRightSidebarEnabled(duplicatedData.config?.rightSidebarEnabled !== false);
            setCopilotEnabled(duplicatedData.config?.copilotEnabled !== false);
            setStepListEnabled(duplicatedData.config?.stepListEnabled !== false);

            alert('Project duplicated successfully! Click Save to save this as a new project.');
        } catch (error) {
            console.error('Duplication failed:', error);
            alert('Failed to duplicate project: ' + error.message);
        }
    };

    const handleAutoSave = () => {
        try {
            if (currentAppId) {
                const draft = {
                    id: currentAppId,
                    name: appName,
                    category: appCategory,
                    config: {
                        steps,
                        baseComponents,
                        appTriggers,
                        appVariables,
                        appFunctions,
                        appTables,
                        recordPlaceholders,
                        materialId,
                        productImage,
                        iotConfig,
                        integrationConnectors,
                        appBackgroundColor,
                        appThemeMode,
                        scalingMode,
                        leftSidebarEnabled,
                        rightSidebarEnabled,
                        copilotEnabled,
                        stepListEnabled
                    }
                };
                projectMgmt.autoSaveDraft(draft);
            }
        } catch (error) {
            console.error('Auto-save failed:', error);
        }
    };

    const handleRecoverDraft = (appId) => {
        try {
            const draft = projectMgmt.getAutoSavedDraft(appId);
            if (draft) {
                handleImportProject(draft.data);
                projectMgmt.clearAutoSavedDraft(appId);
            }
        } catch (error) {
            console.error('Draft recovery failed:', error);
        }
    };

    const getCurrentApp = () => ({
        id: currentAppId,
        name: appName,
        category: appCategory,
        config: {
            steps,
            baseComponents,
            appTriggers,
            appVariables,
            appFunctions,
            appTables,
            recordPlaceholders,
            materialId,
            productImage,
            iotConfig,
            integrationConnectors,
            appBackgroundColor,
            appThemeMode,
            leftSidebarEnabled,
            rightSidebarEnabled,
            copilotEnabled,
            stepListEnabled
        },
        version: appMeta.version,
        approval_status: appMeta.approval_status,
        is_published: appMeta.is_published
    });

    const handleCopyUrl = () => {
        navigator.clipboard.writeText(publishModal.url);
        alert('URL copied to clipboard!');
    };

    const loadApp = (app) => {
        setCurrentAppId(app.id);
        setAppName(app.name);
        setAppCategory(app.category || 'Shop Floor');
        setAppMeta({
            version: app.version || 1,
            approval_status: app.approval_status || 'DRAFT',
            is_published: !!app.is_published,
            lastPublishedAt: app.last_published_at || null,
            approved_by: app.approved_by || null,
            approved_at: app.approved_at || null
        });

        // Update URL query parameters without page reload
        try {
            const url = new URL(window.location.href);
            url.searchParams.set('appId', app.id);
            window.history.pushState({}, '', url.pathname + url.search);
        } catch (e) {
            console.warn('Failed to update URL search parameters:', e);
        }
        // Migration for legacy single-config apps
        const config = app.config || {};
        const appSteps = (config.steps || [
            { id: 'screen_1', title: 'Screen 1', components: config.components || [] }
        ]).map(s => ({
            ...s,
            cycleTimeSeconds: clampNonNegativeInt(s.cycleTimeSeconds ?? s.stepCycleTimeSeconds, 60),
            formSubmit: normalizeFormSubmitConfig(s),
            components: (s.components || []).map(c => {
                let triggers = c.props?.triggers;
                if (!triggers && Array.isArray(c.triggers)) {
                    triggers = c.triggers;
                }
                const updatedProps = { ...(c.props || {}) };
                if (triggers) {
                    updatedProps.triggers = triggers;
                }
                return {
                    ...c,
                    props: updatedProps,
                    x: c.x ?? 50,
                    y: c.y ?? 50,
                    w: c.w ?? 300,
                    h: c.h ?? 120
                };
            })
        }));

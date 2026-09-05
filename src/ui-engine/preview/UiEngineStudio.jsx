import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  GluestackUIProvider
} from '../adapters/GluestackAdapter';
import {
  Button, ButtonText, ButtonIcon,
  Input, InputField, InputIcon,
  Card,
  Badge, BadgeText,
  Avatar, AvatarFallbackText,
  Tabs, TabsTabList, TabsTab, TabsTabPanels, TabsTabPanel,
  Switch,
  Progress,
  Spinner
} from '../components';
import { COMPONENT_REGISTRY } from '../registry/componentRegistry';
import { TEMPLATE_CATALOG } from '../templates';
import {
  MobileLoginTemplate,
  MobileDashboardTemplate,
  MobileListTemplate,
  MobileDetailTemplate,
  MobileFormTemplate,
  MobileInspectionFormTemplate,
  MobileChecklistTemplate,
  MobileBarcodeScanTemplate,
  MobileApprovalTemplate,
  MobileProfileTemplate,
  MobileSettingsTemplate,
  MobileNotificationTemplate,
  MobileSearchTemplate,
  MobileEmptyStateTemplate,
  MobileErrorStateTemplate,
  MobileLoadingStateTemplate
} from '../templates';
import { generateUI } from '../ai/uiGenerator';
import { activityTracker } from '../ai/activityTracker';
import { INSPECTION_WALKTHROUGH_STEPS } from './walkthroughGuide';
import AppCanvas from './AppCanvas';
import { getFrontlineAppById } from '../../utils/supabaseFrontlineDB';
import { checkBuilderCompatibility, BUILDER_TYPES } from '../../utils/builderType';

import {
  Smartphone, Tablet, Monitor, Play, RotateCcw,
  Sparkles, Layers, Box, Cpu, Eye, CheckCircle2,
  ChevronRight, ChevronLeft, Sun, Moon, ArrowLeft,
  ExternalLink, Compass, ShieldCheck, LayoutDashboard,
  Save, Link, QrCode, Edit3, AlertTriangle
} from 'lucide-react';

export default function UiEngineStudio({ canvasMode = true }) {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('canvas'); // default to canvas editor
  const [selectedTemplateId, setSelectedTemplateId] = useState('inspection');
  const [deviceFrame, setDeviceFrame] = useState('iphone'); // iphone | android | tablet | responsive
  const [colorMode, setColorMode] = useState('light');
  const [isLoadingApp, setIsLoadingApp] = useState(false);
  const [incompatibleNotice, setIncompatibleNotice] = useState(null);

  const [appName, setAppName] = useState('app test');
  const [isEditingAppName, setIsEditingAppName] = useState(false);
  const [isSavedAppFeedback, setIsSavedAppFeedback] = useState(false);

  // Load app from Supabase if appId query param is provided
  useEffect(() => {
    const appId = searchParams.get('appId');
    if (appId) {
      setIsLoadingApp(true);
      getFrontlineAppById(appId)
        .then(appData => {
          if (appData) {
            const compatibility = checkBuilderCompatibility(BUILDER_TYPES.GLUESTACK, appData);
            if (!compatibility.allowed) {
              console.warn('[UiEngineStudio] Incompatible app for Gluestack:', compatibility);
              setIncompatibleNotice(compatibility);
              return;
            }
            setAppName(appData.name || 'Untitled App');
            // Dispatch event to AppCanvas to load the app
            window.dispatchEvent(new CustomEvent('mavi_ui_engine_load_app', {
              detail: {
                appId: appData.id,
                name: appData.name,
                config: appData.config
              }
            }));
          }
        })
        .catch(err => console.error('[UiEngineStudio] Failed to load app:', err))
        .finally(() => setIsLoadingApp(false));
    }
  }, [searchParams]);

  // Sync companion state with AppCanvas
  useEffect(() => {
    const handleSaved = () => {
      setIsSavedAppFeedback(true);
      setTimeout(() => setIsSavedAppFeedback(false), 2200);
    };
    const handleNameSync = (e) => {
      if (e.detail?.appName) setAppName(e.detail.appName);
    };
    window.addEventListener('mavi_ui_engine_app_saved', handleSaved);
    window.addEventListener('mavi_ui_engine_app_name_changed', handleNameSync);
    return () => {
      window.removeEventListener('mavi_ui_engine_app_saved', handleSaved);
      window.removeEventListener('mavi_ui_engine_app_name_changed', handleNameSync);
    };
  }, []);

  // Ensure canvas mode is maintained
  useEffect(() => {
    setActiveTab('canvas');
  }, [canvasMode]);

  // AI Generator state
  const [aiPrompt, setAiPrompt] = useState('Create mobile inspection screen');
  const [isGenerating, setIsGenerating] = useState(false);
  const [activities, setActivities] = useState([]);
  const [generatedResult, setGeneratedResult] = useState(null);

  // Walkthrough state
  const [isTourActive, setIsTourActive] = useState(false);
  const [tourStep, setTourStep] = useState(0);

  // Subscribe to activity tracker
  useEffect(() => {
    return activityTracker.subscribe((entry, history) => {
      setActivities([...history]);
    });
  }, []);

  const handleRunAiGenerate = async () => {
    setIsGenerating(true);
    try {
      const res = await generateUI(aiPrompt);
      setGeneratedResult(res);
      if (res.templateId) {
        setSelectedTemplateId(res.templateId);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const currentTour = INSPECTION_WALKTHROUGH_STEPS[tourStep];

  const handleNextTour = () => {
    if (tourStep < INSPECTION_WALKTHROUGH_STEPS.length - 1) {
      setTourStep(tourStep + 1);
    } else {
      setIsTourActive(false);
      setTourStep(0);
    }
  };

  const handlePrevTour = () => {
    if (tourStep > 0) setTourStep(tourStep - 1);
  };

  const renderTemplateComponent = () => {
    switch (selectedTemplateId) {
      case 'login': return <MobileLoginTemplate />;
      case 'dashboard': return <MobileDashboardTemplate />;
      case 'list': return <MobileListTemplate />;
      case 'detail': return <MobileDetailTemplate />;
      case 'form': return <MobileFormTemplate />;
      case 'inspection': return <MobileInspectionFormTemplate />;
      case 'checklist': return <MobileChecklistTemplate />;
      case 'scan': return <MobileBarcodeScanTemplate />;
      case 'approval': return <MobileApprovalTemplate />;
      case 'profile': return <MobileProfileTemplate />;
      case 'settings': return <MobileSettingsTemplate />;
      case 'notification': return <MobileNotificationTemplate />;
      case 'search': return <MobileSearchTemplate />;
      case 'empty': return <MobileEmptyStateTemplate onAction={() => setSelectedTemplateId('scan')} />;
      case 'error': return <MobileErrorStateTemplate onRetry={() => setSelectedTemplateId('inspection')} />;
      case 'loading': return <MobileLoadingStateTemplate />;
      default: return <MobileInspectionFormTemplate />;
    }
  };

  const deviceWidths = {
    iphone: 'w-[360px] max-w-full h-[calc(100vh-190px)] max-h-[660px] min-h-[460px]',
    android: 'w-[760px] max-w-full h-[calc(100vh-190px)] max-h-[440px] min-h-[380px]',
    tablet: 'w-[680px] max-w-full h-[calc(100vh-190px)] max-h-[700px] min-h-[500px]',
    responsive: 'w-full h-full min-h-[500px] max-w-5xl'
  }[deviceFrame] || 'w-[360px] max-w-full h-[calc(100vh-190px)] max-h-[660px]';

  return (
    <GluestackUIProvider colorMode={colorMode}>
      <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-100 dark:bg-[#0c0d14] text-slate-800 dark:text-slate-100 font-sans">
        {/* Top Studio Bar */}
        <header className="h-14 px-4 bg-[#714b67] text-white flex items-center justify-between shadow-md shrink-0 z-30 relative">
          {/* Left: Companion Buttons (NAMA, SAVE APP, LINK APP, QRCODE) */}
          <div className="flex items-center gap-2 flex-1 justify-start">
            <a
              href="#/"
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/90 hover:text-white transition-colors flex items-center justify-center shrink-0"
              title="Kembali ke MaviCore MES"
            >
              <ArrowLeft className="w-4 h-4" />
            </a>

            <div className="h-4 w-px bg-white/20 hidden sm:block" />

            {/* Loading indicator */}
            {isLoadingApp && (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-white/80 hidden sm:inline">Memuat aplikasi...</span>
                <div className="h-4 w-px bg-white/20 hidden sm:block" />
              </>
            )}

            {/* NAMA APP (Editable Inline Input) */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/15 hover:bg-white/20 border border-white/20 rounded-xl transition-all group max-w-[170px] sm:max-w-[220px]">
              <Smartphone className="w-3.5 h-3.5 text-teal-300 shrink-0" />
              {isEditingAppName ? (
                <input
                  type="text"
                  value={appName}
                  onChange={(e) => {
                    setAppName(e.target.value);
                    window.dispatchEvent(new CustomEvent('mavi_ui_engine_set_app_name', { detail: { appName: e.target.value } }));
                  }}
                  onBlur={() => setIsEditingAppName(false)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') setIsEditingAppName(false);
                  }}
                  autoFocus
                  className="bg-white px-1.5 py-0.5 text-xs font-bold text-slate-800 border border-teal-400 rounded-md outline-none w-full shadow-inner"
                  placeholder="Nama Aplikasi..."
                />
              ) : (
                <div
                  onClick={() => setIsEditingAppName(true)}
                  className="flex items-center gap-1.5 cursor-pointer overflow-hidden flex-1 min-w-0"
                  title="Klik untuk mengubah nama aplikasi"
                >
                  <span className="text-xs font-bold text-white truncate select-none">
                    {appName || 'Nama Aplikasi'}
                  </span>
                  <Edit3 className="w-3 h-3 text-white/60 group-hover:text-teal-300 shrink-0 transition-colors ml-auto" />
                </div>
              )}
            </div>

            {/* SAVE APP BUTTON */}
            <button
              type="button"
              onClick={() => {
                window.dispatchEvent(new CustomEvent('mavi_ui_engine_save_app'));
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-95 ${
                isSavedAppFeedback
                  ? 'bg-emerald-500 text-white border-emerald-400 shadow-emerald-700/50'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500/80 hover:border-emerald-400'
              }`}
              title="Simpan konfigurasi aplikasi (Save App)"
            >
              {isSavedAppFeedback ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-white animate-in zoom-in-50 duration-200" />
                  <span className="hidden md:inline">Saved!</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5 text-emerald-200" />
                  <span className="hidden md:inline">Save App</span>
                </>
              )}
            </button>

            {/* COMPANION BUTTON (QR Code & Link App) */}
            <button
              type="button"
              onClick={() => {
                window.dispatchEvent(new CustomEvent('mavi_ui_engine_open_qr'));
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-95 bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-500/80 hover:border-indigo-400"
              title="Buka MES Companion (QR Code & Link App)"
            >
              <Smartphone className="w-3.5 h-3.5 text-indigo-200" />
              <span>Companion</span>
            </button>


          </div>

          {/* Center: Viewport Frame Selectors */}
          <div className="hidden md:flex items-center bg-black/25 backdrop-blur-xs p-1 rounded-xl gap-1 border border-white/10 shadow-inner">
            <button
              onClick={() => setDeviceFrame('iphone')}
              title="iPhone Portrait (375px)"
              className={`p-1.5 rounded-lg transition-colors ${deviceFrame === 'iphone' ? 'bg-white text-[#714b67] shadow-xs' : 'text-white/80 hover:bg-white/10'}`}
            >
              <Smartphone className="w-4 h-4" />
            </button>
            <button
              onClick={() => setDeviceFrame('android')}
              title="Mobile Landscape (780px)"
              className={`p-1.5 rounded-lg transition-colors ${deviceFrame === 'android' ? 'bg-white text-[#714b67] shadow-xs' : 'text-white/80 hover:bg-white/10'}`}
            >
              <Smartphone className="w-4 h-4 rotate-90" />
            </button>
            <button
              onClick={() => setDeviceFrame('tablet')}
              title="Tablet (720px)"
              className={`p-1.5 rounded-lg transition-colors ${deviceFrame === 'tablet' ? 'bg-white text-[#714b67] shadow-xs' : 'text-white/80 hover:bg-white/10'}`}
            >
              <Tablet className="w-4 h-4" />
            </button>
            <button
              onClick={() => setDeviceFrame('responsive')}
              title="Desktop / Responsive"
              className={`p-1.5 rounded-lg transition-colors ${deviceFrame === 'responsive' ? 'bg-white text-[#714b67] shadow-xs' : 'text-white/80 hover:bg-white/10'}`}
            >
              <Monitor className="w-4 h-4" />
            </button>
          </div>

          {/* Right: Theme Toggle & Actions */}
          <div className="flex items-center gap-2 flex-1 justify-end">
            {/* Dark Mode Toggle */}
            <button
              onClick={() => setColorMode(colorMode === 'light' ? 'dark' : 'light')}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
              title="Toggle Theme"
            >
              {colorMode === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-amber-300" />}
            </button>

            {/* Walkthrough Button */}
            <Button
              action="positive"
              size="sm"
              onPress={() => {
                setSelectedTemplateId('inspection');
                setIsTourActive(true);
                setTourStep(0);
              }}
            >
              <ButtonIcon as={Compass} />
              <ButtonText className="hidden sm:inline">Start Walkthrough</ButtonText>
            </Button>
          </div>
        </header>

        {/* Main Workspace Layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar: Navigation & Controls (Only shown for non-canvas tabs) */}
          {activeTab !== 'canvas' && (
            <div className="w-80 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-[#13151f] flex flex-col shrink-0">
            <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex gap-1 flex-wrap">
              <button
                onClick={() => setActiveTab('templates')}
                className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-colors min-w-[80px] ${activeTab === 'templates' ? 'bg-[#714b67] text-white' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              >
                Templates (16)
              </button>
              <button
                onClick={() => setActiveTab('canvas')}
                className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-colors min-w-[80px] flex items-center justify-center gap-1 ${activeTab === 'canvas' ? 'bg-[#008784] text-white' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" /> Canvas
              </button>
              <button
                onClick={() => setActiveTab('registry')}
                className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-colors min-w-[80px] ${activeTab === 'registry' ? 'bg-[#714b67] text-white' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              >
                Components (24)
              </button>
              <button
                onClick={() => setActiveTab('ai-generator')}
                className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1 min-w-[80px] ${activeTab === 'ai-generator' ? 'bg-[#008784] text-white' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              >
                <Sparkles className="w-3.5 h-3.5" /> AI Gen
              </button>
            </div>

            {/* Tab: Templates List */}
            {activeTab === 'templates' && (
              <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
                <div className="text-[11px] font-bold text-slate-400 px-2 py-1 uppercase tracking-wider">
                  Mobile UI Templates
                </div>
                {TEMPLATE_CATALOG.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTemplateId(t.id)}
                    className={`p-2.5 rounded-xl cursor-pointer transition-all text-xs flex flex-col gap-0.5 ${selectedTemplateId === t.id ? 'bg-[#714b67]/10 border border-[#714b67]/30 text-[#714b67] dark:text-[#dcbfd3] font-semibold' : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-transparent'}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold">{t.title}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500">{t.category}</span>
                    </div>
                    <span className="text-[11px] text-slate-400 line-clamp-1">{t.description}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Tab: Components Registry */}
            {activeTab === 'registry' && (
              <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
                <div className="text-[11px] font-bold text-slate-400 px-2 py-1 uppercase tracking-wider">
                  Gluestack UI Registry
                </div>
                {COMPONENT_REGISTRY.map((c) => (
                  <div
                    key={c.name}
                    className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between font-bold">
                      <span className="text-[#714b67] dark:text-[#dcbfd3]">&lt;{c.name} /&gt;</span>
                      <Badge action="info" size="sm"><BadgeText>{c.category}</BadgeText></Badge>
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-2">{c.description}</p>
                    {c.subComponents && c.subComponents.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {c.subComponents.map((s) => (
                          <span key={s} className="text-[9px] px-1 py-0.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-slate-600 dark:text-slate-300">
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Tab: AI Generator Testbench */}
            {activeTab === 'ai-generator' && (
              <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    AI Prompt (Natural Language)
                  </label>
                  <textarea
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    rows={3}
                    placeholder="Contoh: Create mobile inspection screen"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-[#008784]/30 resize-none"
                  />
                </div>

                <Button
                  action="positive"
                  size="md"
                  isLoading={isGenerating}
                  onPress={handleRunAiGenerate}
                  className="w-full"
                >
                  <ButtonIcon as={Sparkles} />
                  <ButtonText>Generate UI with Engine</ButtonText>
                </Button>

                {/* AI Activity Feed */}
                <div className="flex-1 flex flex-col mt-2 border border-slate-200 dark:border-slate-800 rounded-2xl p-2.5 bg-slate-50 dark:bg-slate-900/60 overflow-hidden">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center justify-between">
                    <span>AI Activity Stream</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  </div>
                  <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 text-xs">
                    {activities.length === 0 ? (
                      <div className="text-[11px] text-slate-400 italic text-center py-6">
                        Ketuk tombol di atas untuk menjalankan simulasi AI Activity
                      </div>
                    ) : (
                      activities.map((a) => (
                        <div key={a.id} className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 text-[11px] animate-in fade-in">
                          <div className="font-semibold flex items-center gap-1.5">
                            <span>{a.icon}</span>
                            <span>{a.label}</span>
                          </div>
                          {a.details && <div className="text-[10px] text-slate-500 dark:text-slate-400 pl-5">{a.details}</div>}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {generatedResult && generatedResult.tree && generatedResult.tree.length > 0 && (
                  <div className="border border-teal-200 dark:border-teal-800/60 rounded-2xl p-2.5 bg-teal-50/50 dark:bg-teal-950/20 text-xs">
                    <div className="font-bold text-teal-800 dark:text-teal-300 text-[11px] uppercase mb-1.5 flex items-center justify-between">
                      <span>Generated Hierarchy Tree</span>
                      <span className="text-[10px] bg-teal-200/60 dark:bg-teal-800 px-1.5 py-0.2 rounded font-mono">Gluestack UI</span>
                    </div>
                    <div className="space-y-1 font-mono text-[11px] text-slate-700 dark:text-slate-200 pl-1">
                      {generatedResult.tree.map((node) => (
                        <div key={node.name} className="flex items-center gap-1.5">
                          <span className="text-teal-600 dark:text-teal-400 font-bold">{node.parent ? '└──' : '■'}</span>
                          <span>{node.name}</span>
                          <span className="text-[10px] text-slate-400">({node.type})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          )}

          {/* Main Content Area - Canvas or Preview */}
          {activeTab === 'canvas' ? (
            <main className="flex-1 overflow-hidden">
              <AppCanvas
                deviceFrame={deviceFrame}
                onDeviceFrameChange={setDeviceFrame}
              />
            </main>
          ) : (
          /* Right Center: Device Viewport Canvas */
          <main className="flex-1 flex flex-col items-center justify-center py-3 px-4 pb-8 overflow-y-auto relative bg-slate-200/60 dark:bg-[#090a0f]">
            {/* Viewport Frame */}
            <div className={`transition-all duration-300 bg-white dark:bg-[#12131c] shadow-2xl rounded-3xl overflow-hidden border border-slate-300 dark:border-slate-700 flex flex-col relative ${deviceWidths}`}>
              {/* Phone Notch/Status Header */}
              {deviceFrame !== 'responsive' && (
                <div className="h-6 bg-slate-900 text-white flex items-center justify-between px-6 shrink-0 select-none text-[10px] font-bold">
                  <span>09:41</span>
                  <div className="w-20 h-3 bg-black rounded-full" />
                  <div className="flex items-center gap-1.5">
                    <span>5G</span>
                    <div className="w-3.5 h-2 border border-white rounded-xs relative">
                      <div className="h-full w-2.5 bg-white" />
                    </div>
                  </div>
                </div>
              )}

              {/* Mobile Content Display */}
              <div className="flex-1 min-h-0 overflow-y-auto relative">
                {renderTemplateComponent()}
              </div>

              {/* Mobile Home Bar */}
              {deviceFrame !== 'responsive' && (
                <div className="h-4 bg-white dark:bg-[#12131c] flex items-center justify-center shrink-0">
                  <div className="w-28 h-1 bg-slate-300 dark:bg-slate-700 rounded-full" />
                </div>
              )}
            </div>

            {/* Floating Visual Walkthrough Spotlight Card */}
            {isTourActive && currentTour && (
              <div className="absolute inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
                <Card variant="elevated" className="max-w-md w-full p-5 space-y-4 shadow-2xl border-2 border-[#714b67] bg-white dark:bg-slate-900 animate-in zoom-in-95">
                  <div className="flex items-center justify-between border-b pb-2">
                    <Badge action="info" size="sm">
                      <BadgeText>Langkah {tourStep + 1} dari {INSPECTION_WALKTHROUGH_STEPS.length}</BadgeText>
                    </Badge>
                    <button
                      onClick={() => setIsTourActive(false)}
                      className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                    >
                      Lewati (Exit)
                    </button>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                      <Compass className="w-4 h-4 text-[#714b67]" />
                      {currentTour.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-300 mt-1 leading-relaxed">
                      {currentTour.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <Button
                      action="default"
                      size="sm"
                      isDisabled={tourStep === 0}
                      onPress={handlePrevTour}
                    >
                      <ButtonIcon as={ChevronLeft} />
                      <ButtonText>Kembali</ButtonText>
                    </Button>

                    <Button
                      action="primary"
                      size="sm"
                      onPress={handleNextTour}
                    >
                      <ButtonText>
                        {tourStep === INSPECTION_WALKTHROUGH_STEPS.length - 1 ? 'Selesai Walkthrough' : 'Langkah Berikutnya'}
                      </ButtonText>
                      <ButtonIcon as={ChevronRight} />
                    </Button>
                  </div>
                </Card>
              </div>
            )}
          </main>
          )}
        </div>
      </div>

      {/* Incompatible Builder Warning Modal */}
      {incompatibleNotice && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 99999,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            maxWidth: '500px',
            width: '100%',
            padding: '32px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid #e2e8f0',
            textAlign: 'center'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: '#fef3c7',
              color: '#d97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              border: '1px solid #fde68a'
            }}>
              <AlertTriangle size={28} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a', margin: '0 0 10px' }}>
              Akses Ditolak: Builder Tidak Kompatibel
            </h3>
            <p style={{ fontSize: '0.92rem', color: '#475569', lineHeight: 1.6, margin: '0 0 24px' }}>
              {incompatibleNotice.message}
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={() => setIncompatibleNotice(null)}
                style={{
                  padding: '10px 18px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: 'white',
                  color: '#475569',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontSize: '0.88rem'
                }}
              >
                Tutup
              </button>
              <button
                onClick={() => {
                  window.location.href = incompatibleNotice.recommendedUrl;
                }}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#7c3aed',
                  color: 'white',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontSize: '0.88rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 6px -1px rgba(124, 58, 237, 0.3)'
                }}
              >
                <ExternalLink size={15} /> Buka di {incompatibleNotice.appBuilderLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </GluestackUIProvider>
  );
}

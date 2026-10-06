import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
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
  Save, Link, QrCode, Edit3, AlertTriangle, Plus,
  FolderOpen, ChevronDown, MonitorPlay, Maximize2,
  UploadCloud, Lock, Unlock, Clock, Radio, X,
  Barcode, FileCheck2, WifiOff, Camera, Database
} from 'lucide-react';

export default function UiEngineStudio({ canvasMode = true }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('canvas'); // default to canvas editor
  const [selectedTemplateId, setSelectedTemplateId] = useState('inspection');
  const [deviceFrame, setDeviceFrame] = useState('iphone'); // iphone | android | tablet | responsive
  const [colorMode, setColorMode] = useState('light');
  const [isLoadingApp, setIsLoadingApp] = useState(false);
  const [incompatibleNotice, setIncompatibleNotice] = useState(null);

  const [appName, setAppName] = useState('Mobile App');
  const [isEditingAppName, setIsEditingAppName] = useState(false);
  const [isSavedAppFeedback, setIsSavedAppFeedback] = useState(false);

  // App Lifecycle & Governance state (Fase 1 Enterprise MES)
  const [appStatus, setAppStatus] = useState('draft'); // 'draft' | 'published'
  const [appVersion, setAppVersion] = useState('v1.0.0');
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [publishVersion, setPublishVersion] = useState('v1.0.0');
  const [publishStation, setPublishStation] = useState('Line 1 - Station 01 (Milling & QC)');
  const [publishNotes, setPublishNotes] = useState('Pembaruan batas toleransi QC dan checklist harian mesin');
  const [publishApprover, setPublishApprover] = useState('Lead Production Engineer');

  // Offline store-and-forward state (Fase 2)
  const [isOnline, setIsOnline] = useState(() => typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [pendingSyncCount, setPendingSyncCount] = useState(() => {
    try {
      const q = localStorage.getItem('mavi_gluestack_offline_queue');
      return q ? JSON.parse(q).length : 0;
    } catch (e) { return 0; }
  });

  // App Switcher state
  const [studioAppsList, setStudioAppsList] = useState(() => {
    try {
      const s = localStorage.getItem('mavi_ui_engine_apps');
      if (s) {
        const parsed = JSON.parse(s);
        return (parsed || []).filter(a => a && a.id !== 'app_1' && a.id !== 'app_2' && a.name !== 'app test');
      }
    } catch (e) {}
    return [];
  });
  const [isAppsDropdownOpen, setIsAppsDropdownOpen] = useState(false);

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
    const handleAppsUpdate = (e) => {
      if (e.detail?.apps) setStudioAppsList(e.detail.apps);
    };
    const handleStatusSync = (e) => {
      if (e.detail?.status) setAppStatus(e.detail.status);
      if (e.detail?.version) setAppVersion(e.detail.version);
    };
    const handleQueueSync = (e) => {
      setPendingSyncCount(e.detail?.count || 0);
    };
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('mavi_ui_engine_app_saved', handleSaved);
    window.addEventListener('mavi_ui_engine_app_name_changed', handleNameSync);
    window.addEventListener('mavi_ui_engine_apps_updated', handleAppsUpdate);
    window.addEventListener('mavi_ui_engine_app_status_changed', handleStatusSync);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('mavi_offline_queue_updated', handleQueueSync);

    return () => {
      window.removeEventListener('mavi_ui_engine_app_saved', handleSaved);
      window.removeEventListener('mavi_ui_engine_app_name_changed', handleNameSync);
      window.removeEventListener('mavi_ui_engine_apps_updated', handleAppsUpdate);
      window.removeEventListener('mavi_ui_engine_app_status_changed', handleStatusSync);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('mavi_offline_queue_updated', handleQueueSync);
    };
  }, []);

  const handleConfirmPublish = () => {
    const vStr = publishVersion.trim() || 'v1.0.0';
    setAppStatus('published');
    setAppVersion(vStr);
    setIsPublishModalOpen(false);

    window.dispatchEvent(new CustomEvent('mavi_ui_engine_publish_app', {
      detail: {
        version: vStr,
        station: publishStation,
        notes: publishNotes,
        approver: publishApprover
      }
    }));
  };

  const handleCreateNewDraftRevision = () => {
    setAppStatus('draft');
    window.dispatchEvent(new CustomEvent('mavi_ui_engine_create_draft_revision', {
      detail: { currentVersion: appVersion }
    }));
  };

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
    iphone: 'w-[380px] max-w-full h-[780px] min-h-[740px]',
    android: 'w-[780px] max-w-full h-[390px] min-h-[360px]',
    tablet: 'w-[768px] max-w-full h-[880px] min-h-[680px]',
    responsive: 'w-full h-full min-h-[680px] max-w-5xl'
  }[deviceFrame] || 'w-[380px] max-w-full h-[780px] min-h-[740px]';

  return (
    <GluestackUIProvider colorMode={colorMode}>
      <div className="flex flex-col w-full h-full flex-1 min-w-0 min-h-0 overflow-hidden bg-slate-100 dark:bg-[#0c0d14] text-slate-800 dark:text-slate-100 font-sans">
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

            {/* NAMA APP (Editable Inline Input + Apps Switcher Dropdown) */}
            <div className="relative">
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/15 hover:bg-white/20 border border-white/20 rounded-xl transition-all group max-w-[200px] sm:max-w-[260px]">
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
                  <div className="flex items-center gap-1.5 overflow-hidden flex-1 min-w-0">
                    <span
                      onClick={() => setIsEditingAppName(true)}
                      className="text-xs font-bold text-white truncate select-none cursor-pointer flex-1"
                      title="Klik untuk mengubah nama aplikasi"
                    >
                      {appName || 'Nama Aplikasi'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsEditingAppName(true)}
                      className="p-0.5 text-white/50 hover:text-teal-300 transition-colors cursor-pointer"
                      title="Ubah Nama Aplikasi"
                    >
                      <Edit3 className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAppsDropdownOpen(prev => !prev)}
                      className="p-0.5 text-white/50 hover:text-white transition-colors cursor-pointer"
                      title="Pilih / Tukar Aplikasi"
                    >
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isAppsDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                )}
              </div>

              {/* Apps Switcher Dropdown */}
              {isAppsDropdownOpen && (
                <div className="absolute left-0 top-full mt-1.5 w-64 bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95">
                  <div className="flex items-center justify-between px-2 py-1 text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                    <span>Frontline Apps ({studioAppsList.length})</span>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAppsDropdownOpen(false);
                        window.dispatchEvent(new CustomEvent('mavi_ui_engine_create_app'));
                      }}
                      className="text-[10px] text-teal-400 hover:text-teal-300 font-bold cursor-pointer"
                    >
                      + Buat Baru
                    </button>
                  </div>

                  <div className="mt-1 space-y-1 max-h-48 overflow-y-auto custom-scrollbar">
                    {studioAppsList.length === 0 ? (
                      <div className="text-center py-3 text-[11px] text-slate-400">
                        Belum ada aplikasi tersimpan.
                      </div>
                    ) : (
                      studioAppsList.map(app => (
                        <div
                          key={app.id}
                          onClick={() => {
                            window.dispatchEvent(new CustomEvent('mavi_ui_engine_load_app', {
                              detail: { appId: app.id, name: app.name, config: app.config }
                            }));
                            setIsAppsDropdownOpen(false);
                          }}
                          className={`px-2.5 py-1.5 rounded-xl cursor-pointer transition-colors flex items-center justify-between text-xs ${
                            app.name === appName ? 'bg-teal-500/20 text-teal-300 font-bold border border-teal-500/40' : 'text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          <span className="truncate">{app.name}</span>
                          {app.name === appName && <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0" />}
                        </div>
                      ))
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setIsAppsDropdownOpen(false);
                      window.dispatchEvent(new CustomEvent('mavi_ui_engine_create_app'));
                    }}
                    className="mt-2 w-full py-1.5 px-3 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create App</span>
                  </button>
                </div>
              )}
            </div>

            {/* CREATE APP BUTTON (Icon Only) */}
            <button
              type="button"
              onClick={() => {
                window.dispatchEvent(new CustomEvent('mavi_ui_engine_create_app'));
              }}
              className="p-2 rounded-xl border transition-all shadow-2xs cursor-pointer active:scale-95 bg-teal-600 hover:bg-teal-500 text-white border-teal-500/80 hover:border-teal-400 flex items-center justify-center shrink-0"
              title="Buat Aplikasi Baru (Create App)"
            >
              <Plus className="w-4 h-4" strokeWidth={2.5} />
            </button>

            {/* GOVERNANCE BADGE & PUBLISH/REVISION ACTION */}
            <div className="flex items-center gap-1.5 shrink-0">
              {appStatus === 'published' ? (
                <div
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold select-none"
                  title="Aplikasi berstatus PUBLISHED (Aktif di Produksi & Terkunci)"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden sm:inline">PROD</span>
                  <span className="text-[10px] font-mono text-emerald-200">{appVersion || 'v1.0.0'}</span>
                  <Lock className="w-3 h-3 text-emerald-400 ml-0.5" />
                </div>
              ) : (
                <div
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold select-none"
                  title="Aplikasi berstatus DRAFT (Dalam Pengembangan)"
                >
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  <span>DRAFT</span>
                </div>
              )}

              {appStatus === 'published' ? (
                <button
                  type="button"
                  onClick={handleCreateNewDraftRevision}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all border border-white/20 cursor-pointer"
                  title="Buat draf revisi baru untuk diedit tanpa mengganggu versi produksi yang aktif"
                >
                  <Edit3 className="w-3 h-3 text-amber-300" />
                  <span className="hidden md:inline">Draft Revisi</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsPublishModalOpen(true)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition-all border border-emerald-400/50 cursor-pointer shadow-xs active:scale-95"
                  title="Rilis aplikasi ini ke lini produksi pabrik (Publish)"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Publish Prod</span>
                </button>
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

          {/* Right: Unified Operational Tools & Operator Kiosk */}
          <div className="flex items-center gap-1.5 flex-1 justify-end">
            {/* Online / Offline Sync Pill */}
            {isOnline && pendingSyncCount === 0 ? (
              <div
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white text-emerald-700 border border-emerald-200 text-xs font-bold shadow-2xs select-none"
                title="Online (Tersinkronisasi ke server)"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="hidden sm:inline">Online</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('mavi_ui_engine_trigger_sync'));
                }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white text-amber-700 border border-amber-300 text-xs font-bold transition-all cursor-pointer shadow-2xs hover:bg-amber-50"
                title="Klik untuk sinkronisasi antrian offline"
              >
                <WifiOff className="w-3.5 h-3.5 text-amber-600" />
                <span>{isOnline ? 'Sync' : 'Offline'} ({pendingSyncCount})</span>
              </button>
            )}

            {/* Scan Hardware Button */}
            <button
              type="button"
              onClick={() => {
                window.dispatchEvent(new CustomEvent('mavi_ui_engine_open_scan'));
              }}
              className="p-1.5 px-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all cursor-pointer shadow-2xs flex items-center gap-1.5"
              title="Simulasi Scan Barcode (Hardware Wedge)"
            >
              <Barcode className="w-3.5 h-3.5 text-cyan-600" />
              <span className="hidden sm:inline">Scan</span>
            </button>

            {/* Audit Trail & e-Sign Button */}
            <button
              type="button"
              onClick={() => {
                window.dispatchEvent(new CustomEvent('mavi_ui_engine_open_audit'));
              }}
              className="p-1.5 px-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all cursor-pointer shadow-2xs flex items-center gap-1.5"
              title="Log Audit & e-Signature (21 CFR Part 11)"
            >
              <FileCheck2 className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden sm:inline">Audit</span>
            </button>

            {/* IoT Telemetry Button */}
            <button
              type="button"
              onClick={() => {
                window.dispatchEvent(new CustomEvent('mavi_ui_engine_open_iot'));
              }}
              className="p-1.5 px-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all cursor-pointer shadow-2xs flex items-center gap-1.5"
              title="Live IoT & PLC Machine Telemetry"
            >
              <Cpu className="w-3.5 h-3.5 text-cyan-600" />
              <span className="hidden sm:inline">IoT</span>
            </button>

            {/* AI Vision Defect Inspector Button */}
            <button
              type="button"
              onClick={() => {
                window.dispatchEvent(new CustomEvent('mavi_ui_engine_open_vision'));
              }}
              className="p-1.5 px-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all cursor-pointer shadow-2xs flex items-center gap-1.5"
              title="AI Computer Vision Defect Inspector"
            >
              <Camera className="w-3.5 h-3.5 text-purple-600" />
              <span className="hidden sm:inline">AI Vision</span>
            </button>

            {/* SAP / ERP Connector Button */}
            <button
              type="button"
              onClick={() => {
                window.dispatchEvent(new CustomEvent('mavi_ui_engine_open_erp'));
              }}
              className="p-1.5 px-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all cursor-pointer shadow-2xs flex items-center gap-1.5"
              title="SAP S/4HANA & ERP Two-Way Connector"
            >
              <Database className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden sm:inline">ERP</span>
            </button>

            {/* Preview / Edit Toggle */}
            <button
              type="button"
              onClick={() => {
                window.dispatchEvent(new CustomEvent('mavi_ui_engine_toggle_preview'));
              }}
              className="p-1.5 px-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all cursor-pointer shadow-2xs flex items-center justify-center"
              title="Toggle Mode Preview / Edit"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>

            {/* OPERATOR KIOSK BUTTON (Full-Screen Production Runner) */}
            <button
              type="button"
              onClick={() => {
                window.dispatchEvent(new CustomEvent('mavi_ui_engine_toggle_kiosk'));
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-md cursor-pointer active:scale-95 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white border-purple-400/50"
              title="Buka Mode Kiosk Operator (Layar Penuh Pabrik)"
            >
              <MonitorPlay className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Operator Kiosk</span>
            </button>
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
                initialAppId={searchParams.get('appId')}
              />
            </main>
          ) : (
          /* Right Center: Device Viewport Canvas */
          <main className="flex-1 flex flex-col items-center py-6 px-4 pb-16 overflow-y-auto relative bg-slate-200/60 dark:bg-[#090a0f]">
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
                onClick={() => {
                  setIncompatibleNotice(null);
                  try {
                    const cleanHash = window.location.hash.split('?')[0];
                    window.history.replaceState({}, '', cleanHash);
                  } catch (e) {}
                }}
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
                  if (incompatibleNotice?.recommendedUrl) {
                    const targetUrl = incompatibleNotice.recommendedUrl;
                    const cleanRoute = targetUrl.replace(/^\/?#/, '');
                    try {
                      navigate(cleanRoute);
                    } catch (e) {
                      console.warn('[UiEngineStudio] Navigate error:', e);
                    }
                    window.location.href = window.location.origin + window.location.pathname + targetUrl;
                    window.location.reload();
                  }
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

      {/* MODAL: PUBLISH APP TO PRODUCTION (Fase 1 Governance) */}
      {isPublishModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full flex flex-col shadow-2xl border border-slate-200 animate-in zoom-in-95 overflow-hidden text-slate-800">
            {/* Modal Header */}
            <div className="p-5 px-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-50 via-teal-50 to-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    Rilis Aplikasi ke Produksi
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded-full border border-emerald-200 uppercase tracking-wider">
                      CFR 21 / ISO 9001
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Kunci versi ini dan aktifkan untuk operator lini produksi pabrik.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPublishModalOpen(false)}
                className="p-2 rounded-xl hover:bg-slate-200/80 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Versi Rilis (Semantic Versioning)
                </label>
                <input
                  type="text"
                  value={publishVersion}
                  onChange={(e) => setPublishVersion(e.target.value)}
                  placeholder="v1.0.0"
                  className="w-full text-xs font-mono font-bold px-3 py-2 rounded-xl border border-slate-300 focus:border-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Stasiun / Lini Target Pabrik
                </label>
                <input
                  type="text"
                  value={publishStation}
                  onChange={(e) => setPublishStation(e.target.value)}
                  placeholder="Line 1 - Station 01 (Milling & QC)"
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:border-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Catatan Rilis (Release Notes)
                </label>
                <textarea
                  rows={3}
                  value={publishNotes}
                  onChange={(e) => setPublishNotes(e.target.value)}
                  placeholder="Deskripsikan fitur atau parameter inspeksi yang diubah..."
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:border-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Penyetuju / Approver Sign-off
                </label>
                <input
                  type="text"
                  value={publishApprover}
                  onChange={(e) => setPublishApprover(e.target.value)}
                  placeholder="Nama Quality / Production Engineer"
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:border-emerald-500 outline-none"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 px-6 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                Aplikasi akan berstatus Production-Locked.
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsPublishModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmPublish}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer active:scale-95"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>Rilis ke Produksi</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </GluestackUIProvider>
  );
}

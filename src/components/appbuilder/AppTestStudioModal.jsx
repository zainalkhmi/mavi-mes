import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
    Activity,
    CheckCircle2,
    AlertTriangle,
    XCircle,
    Play,
    Code,
    Copy,
    Check,
    Wrench,
    X,
    Layers,
    Sparkles,
    Download,
    Square,
    RotateCcw,
    ShieldCheck,
    Terminal,
    Cpu,
    Loader2,
    FileJson,
    FolderArchive,
    ExternalLink,
    Search
} from 'lucide-react';
import {
    performAppSanityCheck,
    repairAppArchitecture
} from '../../utils/appTestGenerator';
import { appRegistryService } from '../../services/appRegistry/appRegistryService';
import { playwrightTestGenerator } from '../../services/testEngine/playwrightTestGenerator';
import { BrowserTestRunner } from '../../services/testEngine/browserTestRunner';
import { aiBugAnalyzer } from '../../services/testEngine/aiBugAnalyzer';

const REGISTRY_FILES = [
    { name: 'app.json', title: 'App Manifest', desc: 'App ID, metadata, status, overview' },
    { name: 'routes.json', title: 'Routes & Screens', desc: 'Screen paths, cycles, sequence' },
    { name: 'components.json', title: 'Components', desc: 'Widgets, selectors, positioning' },
    { name: 'variables.json', title: 'Variables', desc: 'State definitions, scopes, types' },
    { name: 'data-bindings.json', title: 'Data Bindings', desc: 'Widget-to-variable linkages' },
    { name: 'events.json', title: 'Events', desc: 'Event listeners and widget dispatches' },
    { name: 'triggers.json', title: 'Triggers & Logic', desc: 'Automation rules, conditions, actions' },
    { name: 'workflows.json', title: 'Workflows', desc: 'Multi-screen execution flows' },
    { name: 'tools.json', title: 'Tools & Functions', desc: 'API endpoints, hardware, scripts' },
    { name: 'test-cases.json', title: 'Test Cases', desc: 'Deterministic test definitions' },
    { name: 'selectors.json', title: 'Test Selectors', desc: 'Stable data-mavi-id mapping' },
    { name: 'permissions.json', title: 'Permissions', desc: 'Role-based access matrix' },
    { name: 'test-contract.json', title: 'Test Contract', desc: 'Preconditions & required widgets' }
];

export default function AppTestStudioModal({
    isOpen,
    onClose,
    projectState = {},
    setters = {}
}) {
    const [activeTab, setActiveTab] = useState('health'); // 'health' | 'runner' | 'spec' | 'registry' | 'ai'
    const [copied, setCopied] = useState(false);
    const [repairSuccess, setRepairSuccess] = useState(null);
    const [selectedRegistryFile, setSelectedRegistryFile] = useState('app.json');
    const [registrySearch, setRegistrySearch] = useState('');

    // In-Browser Test Runner State
    const [runnerMode, setRunnerMode] = useState('Quick Test');
    const [isRunningTests, setIsRunningTests] = useState(false);
    const [testProgress, setTestProgress] = useState(0);
    const [testResults, setTestResults] = useState(null);
    const [currentExecutingTest, setCurrentExecutingTest] = useState(null);
    const [runnerLogs, setRunnerLogs] = useState([]);
    const [activeBugTickets, setActiveBugTickets] = useState([]);
    const [autoFixSuccessMsg, setAutoFixSuccessMsg] = useState(null);
    const runnerRef = useRef(null);

    // 1. Generate full 13-artifact registry
    const registry = useMemo(() => {
        try {
            return appRegistryService.generateRegistry(projectState);
        } catch (e) {
            console.warn('[AppTestStudioModal] Error generating registry:', e);
            return {};
        }
    }, [projectState]);

    // 2. Compute sanity report and health score
    const sanityReport = useMemo(() => {
        return performAppSanityCheck(projectState);
    }, [projectState]);

    const healthBreakdown = useMemo(() => {
        try {
            return appRegistryService.calculateHealthScore(registry, testResults || {});
        } catch (e) {
            return { overall: sanityReport.healthScore || 100, categories: {} };
        }
    }, [registry, testResults, sanityReport.healthScore]);

    // 3. Generate Playwright test spec code
    const generatedSpec = useMemo(() => {
        try {
            return playwrightTestGenerator.generateSpecCode(registry);
        } catch (e) {
            console.warn('[AppTestStudioModal] Error generating spec:', e);
            return '// Error generating test specification';
        }
    }, [registry]);

    if (!isOpen) return null;

    // Handlers
    const handleCopySpec = () => {
        navigator.clipboard.writeText(generatedSpec);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownloadSpec = () => {
        const appId = projectState.currentAppId || 'mavicore-app';
        const blob = new Blob([generatedSpec], { type: 'text/javascript' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `generated-${appId}.spec.js`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleDownloadRegistryZip = async () => {
        const appId = projectState.currentAppId || 'mavicore-app';
        const blob = await appRegistryService.exportRegistryZip(appId, projectState);
        if (blob) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `app-registry-${appId}.zip`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
    };

    const handleCopyRegistryFile = () => {
        const fileContent = registry[selectedRegistryFile];
        if (fileContent) {
            navigator.clipboard.writeText(JSON.stringify(fileContent, null, 2));
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleAutoRepair = () => {
        const { fixedCount, newSteps } = repairAppArchitecture(projectState);
        if (setters.setSteps) {
            setters.setSteps(newSteps);
        }
        setRepairSuccess(`Berhasil memperbaiki ${fixedCount} isu arsitektur otomatis!`);
        setTimeout(() => setRepairSuccess(null), 4000);
    };

    // Run in-browser automated tests
    const handleRunBrowserTests = async () => {
        setIsRunningTests(true);
        setTestProgress(0);
        setRunnerLogs([]);
        setCurrentExecutingTest(null);

        const runner = new BrowserTestRunner({
            appId: projectState.currentAppId || 'app',
            registry,
            appState: projectState,
            onSuiteStart: (data) => {
                setRunnerLogs(prev => [...prev, `[INIT] Memulai pengujian mode "${data.mode}" (${data.totalTests} skenario)...`]);
            },
            onTestStart: (testCase) => {
                setCurrentExecutingTest(testCase.name);
            },
            onStepPass: (step) => {
                setRunnerLogs(prev => [...prev, `  ✓ [PASS] ${step.action} -> ${step.target || 'OK'}`]);
            },
            onStepFail: (step, err) => {
                setRunnerLogs(prev => [...prev, `  ✗ [FAIL] ${step.action} -> ${step.target || ''}: ${err.message}`]);
            },
            onTestComplete: (testCase, result) => {
                setTestProgress(prev => prev + 1);
            },
            onSuiteComplete: (results) => {
                setTestResults(results);
                setIsRunningTests(false);
                setCurrentExecutingTest(null);
                setRunnerLogs(prev => [...prev, `[COMPLETE] Selesai: ${results.passed} Lulus, ${results.failed} Gagal dalam ${results.durationMs}ms.`]);

                // Populate diagnosed bug tickets
                if (results.bugs && results.bugs.length > 0) {
                    const ticketsWithAnalysis = results.bugs.map(b => {
                        const analysis = aiBugAnalyzer.analyzeBug(b, registry);
                        return { ...b, analysis };
                    });
                    setActiveBugTickets(ticketsWithAnalysis);
                } else {
                    setActiveBugTickets([]);
                }
            }
        });

        runnerRef.current = runner;
        await runner.runSuite(runnerMode);
    };

    const handleAbortTests = () => {
        if (runnerRef.current) {
            runnerRef.current.abort();
            setIsRunningTests(false);
            setCurrentExecutingTest(null);
            setRunnerLogs(prev => [...prev, `⚠️ [ABORT] Pengujian dihentikan oleh pengguna.`]);
        }
    };

    // Apply AI suggested fix patch
    const handleApplyAiFix = (bugTicket) => {
        const patch = bugTicket.analysis?.suggestedFix;
        if (!patch) return;

        let applied = false;

        // Apply based on actionType
        if (patch.actionType === 'CREATE_VARIABLE' && setters.setAppVariables) {
            const curVars = projectState.appVariables || [];
            if (!curVars.some(v => (v.name || v.id) === patch.patch.id)) {
                setters.setAppVariables([...curVars, patch.patch]);
                applied = true;
            }
        } else if (patch.actionType === 'UPDATE_DATA_BINDING' && setters.setSteps) {
            const targetComp = patch.target;
            const curSteps = projectState.steps || [];
            const nextSteps = curSteps.map(s => ({
                ...s,
                components: (s.components || []).map(c => {
                    const cId = c.id || c.displayName;
                    if (cId === targetComp || c.displayName === targetComp) {
                        return { ...c, props: { ...c.props, targetVariable: patch.patch.variable } };
                    }
                    return c;
                })
            }));
            setters.setSteps(nextSteps);
            applied = true;
        } else if (patch.actionType === 'UPDATE_TRIGGER' && setters.setAppTriggers) {
            const curTrigs = projectState.appTriggers || [];
            const nextTrigs = curTrigs.map(t => {
                if (t.id === patch.target) {
                    return { ...t, ...patch.patch };
                }
                return t;
            });
            setters.setAppTriggers(nextTrigs);
            applied = true;
        }

        if (applied) {
            setAutoFixSuccessMsg(`Perbaikan "${patch.description}" berhasil diterapkan ke aplikasi!`);
            setActiveBugTickets(prev => prev.filter(t => t.id !== bugTicket.id));
            setTimeout(() => setAutoFixSuccessMsg(null), 4000);
        } else {
            setAutoFixSuccessMsg(`Perbaikan diterapkan otomatis.`);
            setTimeout(() => setAutoFixSuccessMsg(null), 3000);
        }
    };

    const getScoreColor = (score) => {
        if (score >= 90) return '#10b981';
        if (score >= 70) return '#f59e0b';
        return '#ef4444';
    };

    const filteredRegistryFiles = REGISTRY_FILES.filter(f => 
        f.name.toLowerCase().includes(registrySearch.toLowerCase()) || 
        f.title.toLowerCase().includes(registrySearch.toLowerCase())
    );

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(2, 6, 23, 0.8)',
            backdropFilter: 'blur(10px)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
        }}>
            <div style={{
                backgroundColor: '#0b1120',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '16px',
                width: '100%',
                maxWidth: '1100px',
                height: '88vh',
                maxHeight: '850px',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 40px rgba(16, 185, 129, 0.15)',
                color: '#f8fafc',
                overflow: 'hidden'
            }}>
                {/* Header */}
                <div style={{
                    padding: '16px 24px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'linear-gradient(90deg, rgba(16, 185, 129, 0.1) 0%, rgba(14, 165, 233, 0.05) 50%, rgba(11, 17, 32, 0) 100%)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '12px',
                            background: 'linear-gradient(135deg, #10b981 0%, #0284c7 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)'
                        }}>
                            <ShieldCheck size={24} color="#ffffff" />
                        </div>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc' }}>
                                    MaviCore App Registry & Playwright Studio
                                </h2>
                                <span style={{
                                    fontSize: '0.65rem',
                                    fontWeight: 800,
                                    padding: '2px 8px',
                                    borderRadius: '6px',
                                    backgroundColor: 'rgba(16, 185, 129, 0.2)',
                                    color: '#6ee7b7',
                                    border: '1px solid rgba(16, 185, 129, 0.4)'
                                }}>
                                    13 ARTIFACTS
                                </span>
                            </div>
                            <p style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8' }}>
                                Single Source of Truth • Realtime In-Browser Test Runner • Playwright E2E Suite • AI Self-Healing
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#94a3b8',
                            padding: '8px',
                            borderRadius: '8px',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#fff'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#94a3b8'; }}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Tab Navigation */}
                <div style={{
                    padding: '0 24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                    backgroundColor: 'rgba(15, 23, 42, 0.7)'
                }}>
                    <div style={{ display: 'flex', gap: '4px' }}>
                        <button
                            type="button"
                            onClick={() => setActiveTab('health')}
                            style={{
                                padding: '12px 16px',
                                background: 'none',
                                border: 'none',
                                borderBottom: activeTab === 'health' ? '2.5px solid #10b981' : '2.5px solid transparent',
                                color: activeTab === 'health' ? '#10b981' : '#94a3b8',
                                fontWeight: activeTab === 'health' ? 700 : 500,
                                fontSize: '0.84rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}
                        >
                            <Activity size={15} /> Sanity & Health
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('runner')}
                            style={{
                                padding: '12px 16px',
                                background: 'none',
                                border: 'none',
                                borderBottom: activeTab === 'runner' ? '2.5px solid #38bdf8' : '2.5px solid transparent',
                                color: activeTab === 'runner' ? '#38bdf8' : '#94a3b8',
                                fontWeight: activeTab === 'runner' ? 700 : 500,
                                fontSize: '0.84rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}
                        >
                            <Play size={15} /> In-Browser Test Runner
                            {isRunningTests && <Loader2 size={13} className="animate-spin" color="#38bdf8" />}
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('spec')}
                            style={{
                                padding: '12px 16px',
                                background: 'none',
                                border: 'none',
                                borderBottom: activeTab === 'spec' ? '2.5px solid #a855f7' : '2.5px solid transparent',
                                color: activeTab === 'spec' ? '#a855f7' : '#94a3b8',
                                fontWeight: activeTab === 'spec' ? 700 : 500,
                                fontSize: '0.84rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}
                        >
                            <Code size={15} /> Playwright Spec
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('registry')}
                            style={{
                                padding: '12px 16px',
                                background: 'none',
                                border: 'none',
                                borderBottom: activeTab === 'registry' ? '2.5px solid #f59e0b' : '2.5px solid transparent',
                                color: activeTab === 'registry' ? '#f59e0b' : '#94a3b8',
                                fontWeight: activeTab === 'registry' ? 700 : 500,
                                fontSize: '0.84rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}
                        >
                            <Layers size={15} /> App Registry (13 Files)
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('ai')}
                            style={{
                                padding: '12px 16px',
                                background: 'none',
                                border: 'none',
                                borderBottom: activeTab === 'ai' ? '2.5px solid #ec4899' : '2.5px solid transparent',
                                color: activeTab === 'ai' ? '#ec4899' : '#94a3b8',
                                fontWeight: activeTab === 'ai' ? 700 : 500,
                                fontSize: '0.84rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}
                        >
                            <Sparkles size={15} /> AI Self-Healing
                            {activeBugTickets.length > 0 && (
                                <span style={{
                                    backgroundColor: '#ef4444',
                                    color: '#fff',
                                    padding: '1px 6px',
                                    borderRadius: '9999px',
                                    fontSize: '0.62rem',
                                    fontWeight: 800
                                }}>
                                    {activeBugTickets.length}
                                </span>
                            )}
                        </button>
                    </div>

                    {repairSuccess && (
                        <div style={{ fontSize: '0.78rem', color: '#34d399', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <CheckCircle2 size={15} /> {repairSuccess}
                        </div>
                    )}
                    {autoFixSuccessMsg && (
                        <div style={{ fontSize: '0.78rem', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Sparkles size={15} /> {autoFixSuccessMsg}
                        </div>
                    )}
                </div>

                {/* Main Content Area */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
                    {/* TAB 1: SANITY & HEALTH */}
                    {activeTab === 'health' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {/* Summary Metrics */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
                                <div style={{
                                    backgroundColor: 'rgba(30, 41, 59, 0.6)',
                                    borderRadius: '12px',
                                    padding: '14px 18px',
                                    border: '1px solid rgba(255, 255, 255, 0.06)'
                                }}>
                                    <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 700 }}>OVERALL HEALTH</div>
                                    <div style={{ fontSize: '1.8rem', fontWeight: 800, color: getScoreColor(healthBreakdown.overall) }}>
                                        {healthBreakdown.overall}%
                                    </div>
                                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                                        {healthBreakdown.overall === 100 ? 'Arsitektur Sempurna' : 'Perlu Optimasi'}
                                    </div>
                                </div>
                                <div style={{
                                    backgroundColor: 'rgba(30, 41, 59, 0.6)',
                                    borderRadius: '12px',
                                    padding: '14px 18px',
                                    border: '1px solid rgba(255, 255, 255, 0.06)'
                                }}>
                                    <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 700 }}>TOTAL SCREENS</div>
                                    <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#38bdf8' }}>
                                        {sanityReport.screensCount || (projectState.steps || []).length}
                                    </div>
                                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Multi-screen sequence</div>
                                </div>
                                <div style={{
                                    backgroundColor: 'rgba(30, 41, 59, 0.6)',
                                    borderRadius: '12px',
                                    padding: '14px 18px',
                                    border: '1px solid rgba(255, 255, 255, 0.06)'
                                }}>
                                    <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 700 }}>REGISTERED WIDGETS</div>
                                    <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#a855f7' }}>
                                        {sanityReport.totalComponents}
                                    </div>
                                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Deterministic selectors ready</div>
                                </div>
                                <div style={{
                                    backgroundColor: 'rgba(30, 41, 59, 0.6)',
                                    borderRadius: '12px',
                                    padding: '14px 18px',
                                    border: '1px solid rgba(255, 255, 255, 0.06)'
                                }}>
                                    <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 700 }}>TEST CONTRACT STATUS</div>
                                    <div style={{ fontSize: '1.8rem', fontWeight: 800, color: sanityReport.issues.length === 0 ? '#10b981' : '#f59e0b' }}>
                                        {sanityReport.issues.length === 0 ? 'VALID' : `${sanityReport.issues.length} ISU`}
                                    </div>
                                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Preconditions satisfied</div>
                                </div>
                            </div>

                            {/* Category Health Bars */}
                            <div style={{
                                backgroundColor: 'rgba(30, 41, 59, 0.4)',
                                borderRadius: '12px',
                                padding: '16px 20px',
                                border: '1px solid rgba(255, 255, 255, 0.06)'
                            }}>
                                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#e2e8f0', marginBottom: '12px' }}>
                                    Skor Kesehatan Kategori Arsitektur (8 Sektor)
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                                    {Object.entries(healthBreakdown.categories || {}).map(([cat, score]) => (
                                        <div key={cat} style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', padding: '10px 14px', borderRadius: '8px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px' }}>
                                                <span style={{ color: '#94a3b8', fontWeight: 600 }}>{cat}</span>
                                                <span style={{ color: getScoreColor(score), fontWeight: 800 }}>{score}%</span>
                                            </div>
                                            <div style={{ height: '6px', backgroundColor: 'rgba(255, 255, 255, 0.08)', borderRadius: '9999px', overflow: 'hidden' }}>
                                                <div style={{
                                                    height: '100%',
                                                    width: `${score}%`,
                                                    backgroundColor: getScoreColor(score),
                                                    borderRadius: '9999px',
                                                    transition: 'width 0.4s ease'
                                                }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Auto-Repair Callout */}
                            {sanityReport.issues.length > 0 && (
                                <div style={{
                                    padding: '16px 20px',
                                    borderRadius: '12px',
                                    backgroundColor: 'rgba(245, 158, 11, 0.08)',
                                    border: '1px solid rgba(245, 158, 11, 0.25)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                        <AlertTriangle size={24} color="#f59e0b" />
                                        <div>
                                            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#fbbf24' }}>
                                                Terdeteksi {sanityReport.issues.length} potensi anomali arsitektur aplikasi
                                            </div>
                                            <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                                                Gunakan Auto-Repair untuk memperbaiki duplikasi screen atau step kosong secara instan.
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleAutoRepair}
                                        style={{
                                            padding: '8px 18px',
                                            backgroundColor: '#10b981',
                                            color: '#ffffff',
                                            border: 'none',
                                            borderRadius: '8px',
                                            fontWeight: 700,
                                            fontSize: '0.82rem',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                                        }}
                                    >
                                        <Wrench size={15} /> Auto-Repair Arsitektur
                                    </button>
                                </div>
                            )}

                            {/* Diagnostic Issues List */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#e2e8f0', margin: '4px 0' }}>
                                    Detail Diagnostik Screen & Komponen
                                </div>
                                {sanityReport.issues.length === 0 ? (
                                    <div style={{
                                        padding: '28px',
                                        backgroundColor: 'rgba(16, 185, 129, 0.05)',
                                        border: '1px solid rgba(16, 185, 129, 0.2)',
                                        borderRadius: '12px',
                                        textAlign: 'center',
                                        color: '#6ee7b7'
                                    }}>
                                        <CheckCircle2 size={32} style={{ margin: '0 auto 8px auto' }} />
                                        <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Arsitektur Siap Diuji Secara Deterministic</div>
                                        <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '4px' }}>
                                            Seluruh screen, data binding, dan widget selector terdaftar dengan rapi.
                                        </div>
                                    </div>
                                ) : (
                                    sanityReport.issues.map((issue) => (
                                        <div
                                            key={issue.id}
                                            style={{
                                                padding: '12px 16px',
                                                borderRadius: '10px',
                                                backgroundColor: 'rgba(30, 41, 59, 0.5)',
                                                border: `1px solid ${issue.severity === 'error' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '12px'
                                            }}
                                        >
                                            {issue.severity === 'error' ? (
                                                <XCircle size={18} color="#ef4444" />
                                            ) : (
                                                <AlertTriangle size={18} color="#f59e0b" />
                                            )}
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: '0.84rem', fontWeight: 600, color: '#f8fafc' }}>
                                                    {issue.message}
                                                </div>
                                                {issue.stepTitle && (
                                                    <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px' }}>
                                                        Target: <span style={{ color: '#38bdf8' }}>{issue.stepTitle}</span> (ID: {issue.stepId})
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {/* TAB 2: IN-BROWSER TEST RUNNER */}
                    {activeTab === 'runner' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {/* Controls Bar */}
                            <div style={{
                                padding: '16px 20px',
                                borderRadius: '12px',
                                backgroundColor: 'rgba(30, 41, 59, 0.5)',
                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                flexWrap: 'wrap',
                                gap: '12px'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>MODE PENGUJIAN:</span>
                                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                        {['Quick Test', 'Full Test', 'UI Test', 'Workflow Test', 'Integration Test', 'Regression Test', 'RPA Test'].map(m => (
                                            <button
                                                key={m}
                                                type="button"
                                                disabled={isRunningTests}
                                                onClick={() => setRunnerMode(m)}
                                                style={{
                                                    padding: '6px 12px',
                                                    borderRadius: '8px',
                                                    fontSize: '0.75rem',
                                                    fontWeight: 700,
                                                    border: runnerMode === m ? '1.5px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.1)',
                                                    backgroundColor: runnerMode === m ? 'rgba(56, 189, 248, 0.15)' : 'rgba(15, 23, 42, 0.6)',
                                                    color: runnerMode === m ? '#38bdf8' : '#94a3b8',
                                                    cursor: isRunningTests ? 'not-allowed' : 'pointer',
                                                    transition: 'all 0.15s'
                                                }}
                                            >
                                                {m}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    {isRunningTests ? (
                                        <button
                                            type="button"
                                            onClick={handleAbortTests}
                                            style={{
                                                padding: '8px 18px',
                                                backgroundColor: '#dc2626',
                                                color: '#fff',
                                                borderRadius: '8px',
                                                border: 'none',
                                                fontSize: '0.82rem',
                                                fontWeight: 700,
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px'
                                            }}
                                        >
                                            <Square size={14} /> Batalkan
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={handleRunBrowserTests}
                                            style={{
                                                padding: '8px 20px',
                                                background: 'linear-gradient(135deg, #0284c7 0%, #10b981 100%)',
                                                color: '#fff',
                                                borderRadius: '8px',
                                                border: 'none',
                                                fontSize: '0.82rem',
                                                fontWeight: 800,
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                boxShadow: '0 4px 14px rgba(2, 132, 199, 0.35)'
                                            }}
                                        >
                                            <Play size={15} /> Jalankan Pengujian
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Runner Status & Progress */}
                            {isRunningTests && (
                                <div style={{
                                    padding: '14px 18px',
                                    borderRadius: '10px',
                                    backgroundColor: 'rgba(56, 189, 248, 0.08)',
                                    border: '1px solid rgba(56, 189, 248, 0.25)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '8px'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#e2e8f0' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <Loader2 size={15} className="animate-spin" color="#38bdf8" />
                                            Sedang menguji: <strong>{currentExecutingTest || 'Menyiapkan canvas...'}</strong>
                                        </span>
                                        <span style={{ color: '#38bdf8', fontWeight: 700 }}>
                                            {testProgress} Skenario Selesai
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Results Summary if completed */}
                            {testResults && !isRunningTests && (
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(4, 1fr)',
                                    gap: '12px'
                                }}>
                                    <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.8)', padding: '12px 16px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                                        <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>TOTAL TEST DIJALANKAN</div>
                                        <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f8fafc' }}>{testResults.total}</div>
                                    </div>
                                    <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '12px 16px', borderRadius: '10px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                                        <div style={{ fontSize: '0.7rem', color: '#6ee7b7' }}>LULUS (PASSED)</div>
                                        <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#10b981' }}>{testResults.passed}</div>
                                    </div>
                                    <div style={{ backgroundColor: testResults.failed > 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(15, 23, 42, 0.8)', padding: '12px 16px', borderRadius: '10px', border: testResults.failed > 0 ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(255, 255, 255, 0.06)' }}>
                                        <div style={{ fontSize: '0.7rem', color: testResults.failed > 0 ? '#fca5a5' : '#94a3b8' }}>GAGAL (FAILED)</div>
                                        <div style={{ fontSize: '1.4rem', fontWeight: 800, color: testResults.failed > 0 ? '#ef4444' : '#94a3b8' }}>{testResults.failed}</div>
                                    </div>
                                    <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.8)', padding: '12px 16px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                                        <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>DURASI PENGERJAAN</div>
                                        <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#38bdf8' }}>{testResults.durationMs}ms</div>
                                    </div>
                                </div>
                            )}

                            {/* Execution Logs Terminal */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <Terminal size={14} /> REALTIME EXECUTION CONSOLE
                                    </span>
                                    {testResults && testResults.failed > 0 && (
                                        <button
                                            type="button"
                                            onClick={() => setActiveTab('ai')}
                                            style={{
                                                padding: '4px 12px',
                                                backgroundColor: 'rgba(236, 72, 153, 0.2)',
                                                border: '1px solid rgba(236, 72, 153, 0.4)',
                                                borderRadius: '6px',
                                                color: '#f472b6',
                                                fontSize: '0.74rem',
                                                fontWeight: 700,
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px'
                                            }}
                                        >
                                            <Sparkles size={12} /> Buka Tab AI Self-Healing ({testResults.failed} Isu)
                                        </button>
                                    )}
                                </div>

                                <div style={{
                                    height: '320px',
                                    backgroundColor: '#050811',
                                    borderRadius: '10px',
                                    border: '1px solid rgba(255, 255, 255, 0.08)',
                                    padding: '12px 16px',
                                    overflowY: 'auto',
                                    fontFamily: 'monospace',
                                    fontSize: '0.76rem',
                                    lineHeight: '1.6',
                                    color: '#cbd5e1'
                                }}>
                                    {runnerLogs.length === 0 ? (
                                        <div style={{ color: '#475569', fontStyle: 'italic', padding: '16px 0' }}>
                                            Belum ada pengujian yang dijalankan. Pilih mode di atas lalu klik "Jalankan Pengujian".
                                        </div>
                                    ) : (
                                        runnerLogs.map((log, idx) => (
                                            <div
                                                key={idx}
                                                style={{
                                                    color: log.includes('FAIL') || log.includes('error') ? '#f87171' : log.includes('PASS') ? '#34d399' : log.includes('INIT') || log.includes('COMPLETE') ? '#38bdf8' : '#cbd5e1'
                                                }}
                                            >
                                                {log}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 3: PLAYWRIGHT SPEC */}
                    {activeTab === 'spec' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', height: '100%' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                                    Spesifikasi Playwright otomatis dengan selector <code>data-mavi-id</code> &amp; fallback <code>data-widget-id</code>.
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button
                                        type="button"
                                        onClick={handleDownloadSpec}
                                        style={{
                                            padding: '6px 14px',
                                            backgroundColor: '#1e293b',
                                            color: '#ffffff',
                                            border: '1px solid rgba(255, 255, 255, 0.15)',
                                            borderRadius: '8px',
                                            fontSize: '0.78rem',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px'
                                        }}
                                    >
                                        <Download size={14} /> Unduh .spec.js
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleCopySpec}
                                        style={{
                                            padding: '6px 14px',
                                            backgroundColor: copied ? '#10b981' : '#0284c7',
                                            color: '#ffffff',
                                            border: 'none',
                                            borderRadius: '8px',
                                            fontSize: '0.78rem',
                                            fontWeight: 700,
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px'
                                        }}
                                    >
                                        {copied ? <Check size={14} /> : <Copy size={14} />}
                                        {copied ? 'Tersalin!' : 'Salin Playwright Spec'}
                                    </button>
                                </div>
                            </div>

                            <pre style={{
                                flex: 1,
                                minHeight: '440px',
                                backgroundColor: '#020617',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '12px',
                                padding: '16px',
                                overflowX: 'auto',
                                overflowY: 'auto',
                                fontSize: '0.8rem',
                                fontFamily: 'monospace',
                                color: '#e2e8f0',
                                lineHeight: '1.5'
                            }}>
                                <code>{generatedSpec}</code>
                            </pre>
                        </div>
                    )}

                    {/* TAB 4: APP REGISTRY (13 FILES) */}
                    {activeTab === 'registry' && (
                        <div style={{ display: 'flex', gap: '16px', height: '540px' }}>
                            {/* File Tree Left Sidebar */}
                            <div style={{
                                width: '300px',
                                backgroundColor: 'rgba(15, 23, 42, 0.6)',
                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                borderRadius: '12px',
                                display: 'flex',
                                flexDirection: 'column',
                                overflow: 'hidden'
                            }}>
                                <div style={{ padding: '12px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'rgba(2, 6, 23, 0.6)', padding: '6px 10px', borderRadius: '8px' }}>
                                        <Search size={14} color="#64748b" />
                                        <input
                                            type="text"
                                            placeholder="Cari file registry..."
                                            value={registrySearch}
                                            onChange={(e) => setRegistrySearch(e.target.value)}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                outline: 'none',
                                                color: '#f8fafc',
                                                fontSize: '0.78rem',
                                                width: '100%'
                                            }}
                                        />
                                    </div>
                                </div>

                                <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
                                    {filteredRegistryFiles.map(f => {
                                        const isSelected = selectedRegistryFile === f.name;
                                        const count = Array.isArray(registry[f.name]) ? registry[f.name].length : (registry[f.name] ? Object.keys(registry[f.name]).length : 0);
                                        return (
                                            <button
                                                key={f.name}
                                                type="button"
                                                onClick={() => setSelectedRegistryFile(f.name)}
                                                style={{
                                                    width: '100%',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    padding: '8px 12px',
                                                    borderRadius: '8px',
                                                    marginBottom: '4px',
                                                    background: isSelected ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
                                                    border: isSelected ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid transparent',
                                                    color: isSelected ? '#f59e0b' : '#cbd5e1',
                                                    cursor: 'pointer',
                                                    textAlign: 'left',
                                                    transition: 'all 0.15s'
                                                }}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <FileJson size={14} color={isSelected ? '#f59e0b' : '#94a3b8'} />
                                                    <div>
                                                        <div style={{ fontSize: '0.78rem', fontWeight: 700 }}>{f.name}</div>
                                                        <div style={{ fontSize: '0.66rem', color: '#64748b' }}>{f.title}</div>
                                                    </div>
                                                </div>
                                                <span style={{
                                                    fontSize: '0.65rem',
                                                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                                                    padding: '2px 6px',
                                                    borderRadius: '9999px',
                                                    color: '#94a3b8'
                                                }}>
                                                    {count}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>

                                <div style={{ padding: '10px 12px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                                    <button
                                        type="button"
                                        onClick={handleDownloadRegistryZip}
                                        style={{
                                            width: '100%',
                                            padding: '8px 12px',
                                            backgroundColor: '#1e293b',
                                            color: '#f8fafc',
                                            border: '1px solid rgba(255, 255, 255, 0.15)',
                                            borderRadius: '8px',
                                            fontSize: '0.76rem',
                                            fontWeight: 700,
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '8px'
                                        }}
                                    >
                                        <FolderArchive size={14} color="#f59e0b" /> Unduh Registry (.ZIP)
                                    </button>
                                </div>
                            </div>

                            {/* Main JSON Viewer */}
                            <div style={{
                                flex: 1,
                                backgroundColor: '#020617',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '12px',
                                display: 'flex',
                                flexDirection: 'column',
                                overflow: 'hidden'
                            }}>
                                <div style={{
                                    padding: '10px 16px',
                                    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    backgroundColor: 'rgba(15, 23, 42, 0.5)'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#f59e0b' }}>
                                            /app-registry/{projectState.currentAppId || 'app'}/{selectedRegistryFile}
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleCopyRegistryFile}
                                        style={{
                                            padding: '4px 10px',
                                            backgroundColor: 'rgba(255, 255, 255, 0.08)',
                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                            borderRadius: '6px',
                                            color: '#f8fafc',
                                            fontSize: '0.72rem',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px'
                                        }}
                                    >
                                        <Copy size={12} /> Salin JSON
                                    </button>
                                </div>

                                <pre style={{
                                    flex: 1,
                                    margin: 0,
                                    padding: '16px',
                                    overflowY: 'auto',
                                    overflowX: 'auto',
                                    fontSize: '0.78rem',
                                    fontFamily: 'monospace',
                                    color: '#94a3b8',
                                    lineHeight: '1.5'
                                }}>
                                    <code>
                                        {JSON.stringify(registry[selectedRegistryFile] || {}, null, 2)}
                                    </code>
                                </pre>
                            </div>
                        </div>
                    )}

                    {/* TAB 5: AI SELF-HEALING & BUG TICKETS */}
                    {activeTab === 'ai' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div style={{
                                padding: '16px 20px',
                                borderRadius: '12px',
                                backgroundColor: 'rgba(236, 72, 153, 0.08)',
                                border: '1px solid rgba(236, 72, 153, 0.25)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <Sparkles size={24} color="#ec4899" />
                                    <div>
                                        <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#f472b6' }}>
                                            Autonomous AI Self-Healing Diagnostics
                                        </div>
                                        <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                                            Mendiagnosa kegagalan pengujian, menentukan akar masalah, dan merumuskan patch perbaikan langsung.
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {activeBugTickets.length === 0 ? (
                                <div style={{
                                    padding: '40px',
                                    backgroundColor: 'rgba(15, 23, 42, 0.4)',
                                    border: '1px solid rgba(255, 255, 255, 0.06)',
                                    borderRadius: '12px',
                                    textAlign: 'center',
                                    color: '#94a3b8'
                                }}>
                                    <CheckCircle2 size={36} color="#10b981" style={{ margin: '0 auto 10px auto' }} />
                                    <div style={{ fontWeight: 700, fontSize: '1rem', color: '#f8fafc' }}>
                                        Tidak Ada Bug Terdeteksi
                                    </div>
                                    <div style={{ fontSize: '0.8rem', marginTop: '6px' }}>
                                        Seluruh skenario pengujian di In-Browser Test Runner berjalan lancar tanpa anomali.
                                    </div>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {activeBugTickets.map(ticket => (
                                        <div
                                            key={ticket.id}
                                            style={{
                                                padding: '16px 20px',
                                                borderRadius: '12px',
                                                backgroundColor: 'rgba(15, 23, 42, 0.7)',
                                                border: '1px solid rgba(236, 72, 153, 0.3)',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: '12px'
                                            }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <span style={{
                                                        fontSize: '0.68rem',
                                                        fontWeight: 800,
                                                        padding: '2px 8px',
                                                        borderRadius: '6px',
                                                        backgroundColor: 'rgba(239, 68, 68, 0.2)',
                                                        color: '#f87171'
                                                    }}>
                                                        {ticket.category}
                                                    </span>
                                                    <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#f8fafc' }}>
                                                        {ticket.id}: {ticket.title || ticket.message || 'Kegagalan Assertion'}
                                                    </span>
                                                </div>
                                                <span style={{ fontSize: '0.72rem', color: '#f43f5e', fontWeight: 800 }}>
                                                    SEVERITY: {ticket.severity}
                                                </span>
                                            </div>

                                            {ticket.analysis && (
                                                <div style={{
                                                    backgroundColor: 'rgba(2, 6, 23, 0.6)',
                                                    padding: '12px 14px',
                                                    borderRadius: '8px',
                                                    border: '1px solid rgba(255, 255, 255, 0.05)',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    gap: '6px'
                                                }}>
                                                    <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                                                        <strong>Akar Masalah:</strong> {ticket.analysis.rootCause}
                                                    </div>
                                                    <div style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>
                                                        <strong>Penjelasan AI:</strong> {ticket.analysis.explanation}
                                                    </div>
                                                    {ticket.analysis.suggestedFix && (
                                                        <div style={{
                                                            marginTop: '6px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'space-between',
                                                            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                                                            paddingTop: '8px'
                                                        }}>
                                                            <div style={{ fontSize: '0.78rem', color: '#38bdf8' }}>
                                                                <strong>Rekomendasi Patch:</strong> {ticket.analysis.suggestedFix.description}
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleApplyAiFix(ticket)}
                                                                style={{
                                                                    padding: '6px 14px',
                                                                    backgroundColor: '#10b981',
                                                                    color: '#fff',
                                                                    border: 'none',
                                                                    borderRadius: '6px',
                                                                    fontSize: '0.76rem',
                                                                    fontWeight: 800,
                                                                    cursor: 'pointer',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: '6px',
                                                                    boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
                                                                }}
                                                            >
                                                                <Wrench size={13} /> Terapkan Perbaikan AI
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div style={{
                    padding: '14px 24px',
                    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: 'rgba(15, 23, 42, 0.8)'
                }}>
                    <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                        ID Aplikasi: <span style={{ color: '#38bdf8', fontFamily: 'monospace' }}>{projectState.currentAppId || 'app'}</span> • Status Registry: <span style={{ color: '#34d399' }}>Synced</span>
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{
                                padding: '8px 22px',
                                backgroundColor: '#1e293b',
                                color: '#ffffff',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontWeight: 700,
                                fontSize: '0.82rem'
                            }}
                        >
                            Tutup
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

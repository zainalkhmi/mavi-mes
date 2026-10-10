import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Cpu,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Database,
  Cloud,
  Layers,
  ArrowRight,
  RefreshCw,
  Zap,
  ShieldCheck,
  Eye,
  Wrench,
  Bot,
  Terminal,
  Play,
  Sliders,
  FileText,
  TrendingDown,
  TrendingUp,
  Download,
  ExternalLink,
  ChevronRight,
  Server,
  Gauge,
  SlidersHorizontal,
  Check,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { GEMINI_SAMPLE_PARTS, GEMINI_FACTORY_DOCUMENTS, GeminiAgenticMES } from '../services/ai/GeminiAgenticMES';

export default function GoogleCloudAiShowcase() {
  const [activeTab, setActiveTab] = useState('vision'); // 'vision' | 'pdm' | 'copilot' | 'bigquery' | 'architecture'
  
  // ── Tab 1: Vision QC States ──
  const [selectedPartId, setSelectedPartId] = useState('DEMO-CYL-A1');
  const [isInspecting, setIsInspecting] = useState(false);
  const [visionResult, setVisionResult] = useState(null);
  const [quarantineStatus, setQuarantineStatus] = useState(null);

  // ── Tab 2: Predictive Maintenance States ──
  const [simulatedSpindleRpm, setSimulatedSpindleRpm] = useState(2400);
  const [deratingActive, setDeratingActive] = useState(false);
  const [vibrationRms, setVibrationRms] = useState(5.82);
  const [tempCelsius, setTempCelsius] = useState(74.6);
  const [workOrderCreated, setWorkOrderCreated] = useState(false);

  // ── Tab 3: Frontline Copilot States ──
  const [chatMessages, setChatMessages] = useState([
    {
      sender: 'ai',
      text: 'Halo! Saya Frontline Industrial Copilot bertenaga Gemini 3.8 Flash on Vertex AI. Saya telah memuat 1,420 halaman OEM Manual DMG MORI NLX-2500, log telemetri sensor 30 hari (1.2M data points), dan arsip tiket CAPA. Ada yang bisa saya bantu di lini produksi saat ini?',
      timestamp: '14:22:15'
    }
  ]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [isCopilotThinking, setIsCopilotThinking] = useState(false);
  const [actionDispatched, setActionDispatched] = useState(null);

  // ── Tab 4: BigQuery Optimizer States ──
  const [activeQueryIndex, setActiveQueryIndex] = useState(0);
  const [isQueryRunning, setIsQueryRunning] = useState(false);
  const [queryOutput, setQueryOutput] = useState(null);

  // Auto-run initial inspection on part select
  useEffect(() => {
    handleRunVisionInspection(selectedPartId);
  }, [selectedPartId]);

  const handleRunVisionInspection = async (partId) => {
    setIsInspecting(true);
    setQuarantineStatus(null);
    try {
      const res = await GeminiAgenticMES.inspectPartVision(partId);
      setVisionResult(res);
    } catch (e) {
      toast.error('Gagal menjalankan Gemini Vision');
    } finally {
      setIsInspecting(false);
    }
  };

  const handleQuarantineMRB = () => {
    setQuarantineStatus('QUARANTINED');
    toast.success(`Part ${visionResult?.partId} berhasil di-karantina ke Material Review Board (MRB). Tiket CAPA dibuat.`);
  };

  const handleToggleDerating = () => {
    if (!deratingActive) {
      setDeratingActive(true);
      setSimulatedSpindleRpm(1200);
      setVibrationRms(1.42);
      setTempCelsius(46.2);
      toast.success('⚡ Safe Speed Derating diaplikasikan ke PLC (2400 RPM -> 1200 RPM). Mesin terlindungi dari catastrophic failure.');
    } else {
      setDeratingActive(false);
      setSimulatedSpindleRpm(2400);
      setVibrationRms(5.82);
      setTempCelsius(74.6);
      toast('Derating dinonaktifkan. Kecepatan spindle kembali ke nominal (2400 RPM).');
    }
  };

  const handleCreatePdMWorkOrder = () => {
    setWorkOrderCreated(true);
    toast.success('🛠️ Autonomous Work Order #WO-PDM-2026-882 otomatis dikirim ke teknisi shift!');
  };

  const handleSendCopilotPrompt = async (promptText) => {
    const text = promptText || inputPrompt;
    if (!text.trim()) return;

    const userMsg = { sender: 'user', text, timestamp: new Date().toLocaleTimeString('id-ID') };
    setChatMessages(prev => [...prev, userMsg]);
    setInputPrompt('');
    setIsCopilotThinking(true);

    try {
      const rca = await GeminiAgenticMES.runFactoryMemoryRCA(text);
      const aiMsg = {
        sender: 'ai',
        text: `### 🎯 Hasil Analisis 5-Why (Gemini 1M+ Context Reasoning)\n\n` +
              rca.fiveWhyAnalysis.map(w => `**${w.why}**\n↳ ${w.answer}`).join('\n\n') +
              `\n\n### ⚡ Rekomendasi Tindakan Autonomous:\n` +
              rca.actionPlan.join('\n'),
        citations: rca.sourcesSynthesized,
        timestamp: new Date().toLocaleTimeString('id-ID')
      };
      setChatMessages(prev => [...prev, aiMsg]);
    } catch (e) {
      toast.error('Gagal meminta penalaran Gemini Copilot');
    } finally {
      setIsCopilotThinking(false);
    }
  };

  const handleDispatchCopilotAction = (actionName) => {
    setActionDispatched(actionName);
    toast.success(`✅ Action "${actionName}" berhasil dieksekusi ke Shopfloor PLC & Scheduler MES.`);
  };

  const BQ_QUERIES = [
    {
      title: '1. OEE & Line Balancing Anomaly Detection',
      desc: 'Query telemetri 1.2M rows untuk mendeteksi stasiun dengan micro-stoppages tersembunyi',
      sql: `SELECT \n  station_id, \n  COUNT(*) AS total_cycles,\n  AVG(cycle_time_sec) AS avg_cycle_time,\n  ROUND(SUM(CASE WHEN status = 'DEFECT' THEN 1 ELSE 0 END) / COUNT(*) * 100, 2) AS defect_pct,\n  ROUND(AVG(vibration_rms), 3) AS avg_vibration\nFROM \`mavi-factory-analytics.telemetry.sensor_events_30d\`\nWHERE timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 7 DAY)\nGROUP BY station_id\nORDER BY defect_pct DESC LIMIT 5;`,
      metrics: [
        { label: 'Rows Scanned', val: '1,248,500' },
        { label: 'Query Latency', val: '118 ms (BigQuery BI Engine)' },
        { label: 'Identified Bottleneck', val: 'Stasiun CNC-02 (Defect 4.8%)' }
      ]
    },
    {
      title: '2. Energy (kWh) vs. Yield Sustainability Correlation',
      desc: 'Mengoptimalkan jejak karbon dengan mengidentifikasi idle power waste pada shift malam',
      sql: `SELECT \n  FORMAT_TIMESTAMP('%Y-%m-%d %H:00:00', timestamp) AS hour_window,\n  SUM(power_consumption_kwh) AS total_kwh,\n  SUM(parts_produced) AS units,\n  ROUND(SUM(power_consumption_kwh) / NULLIF(SUM(parts_produced), 0), 4) AS kwh_per_unit\nFROM \`mavi-factory-analytics.sustainability.power_meters\`\nGROUP BY 1\nHAVING units > 0\nORDER BY kwh_per_unit DESC LIMIT 5;`,
      metrics: [
        { label: 'Energy Saved', val: '14.2% per cycle' },
        { label: 'Carbon Reduction', val: '2.4 Ton CO2e/Bulan' },
        { label: 'Waste Minimization', val: 'IDR 48.500.000 / bln' }
      ]
    }
  ];

  const handleRunBqQuery = () => {
    setIsQueryRunning(true);
    setTimeout(() => {
      setIsQueryRunning(false);
      setQueryOutput(BQ_QUERIES[activeQueryIndex]);
      toast.success('Query BigQuery berhasil dieksekusi dengan BigQuery BI Engine!');
    }, 450);
  };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%', width: '100%',
      backgroundColor: '#0a0f1d', color: '#f8fafc', fontFamily: 'Inter, system-ui, sans-serif',
      overflow: 'hidden'
    }}>
      {/* ── HEADER BANNER ── */}
      <div style={{
        padding: '16px 28px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        background: 'linear-gradient(90deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 58, 138, 0.4) 50%, rgba(15, 23, 42, 0.95) 100%)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '44px', height: '44px', borderRadius: '12px',
            background: 'linear-gradient(135deg, #4285F4 0%, #34A853 50%, #FBBC05 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 20px rgba(66, 133, 244, 0.4)'
          }}>
            <Sparkles size={24} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#ffffff' }}>
                MAVI Autonomous MES — Google Cloud AI Platform
              </h1>
              <span style={{
                fontSize: '0.68rem', fontWeight: 700, padding: '3px 8px', borderRadius: '20px',
                backgroundColor: 'rgba(66, 133, 244, 0.15)', border: '1px solid rgba(66, 133, 244, 0.3)',
                color: '#60a5fa', textTransform: 'uppercase'
              }}>
                Hackathon Submission Showcase
              </span>
            </div>
            <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
              Transforming Shopfloor Telemetry into Autonomous Insights, 5-Why RCA & Closed-Loop Actions
            </p>
          </div>
        </div>

        {/* Live Google Cloud Services Badges */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '8px', backgroundColor: 'rgba(52, 211, 153, 0.1)', border: '1px solid rgba(52, 211, 153, 0.25)', fontSize: '0.72rem', color: '#34d399', fontWeight: 600 }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981', animation: 'pulse 1.5s infinite' }} />
            Gemini 3.8 Flash on Vertex AI (Online)
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '8px', backgroundColor: 'rgba(96, 165, 250, 0.1)', border: '1px solid rgba(96, 165, 250, 0.25)', fontSize: '0.72rem', color: '#60a5fa', fontWeight: 600 }}>
            <Database size={12} /> BigQuery Streaming (1.2M rows)
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '8px', backgroundColor: 'rgba(251, 191, 36, 0.1)', border: '1px solid rgba(251, 191, 36, 0.25)', fontSize: '0.72rem', color: '#fbbf24', fontWeight: 600 }}>
            <Zap size={12} /> Pub/Sub 14.8k msg/s
          </div>
        </div>
      </div>

      {/* ── NAVIGATION TABS ── */}
      <div style={{
        display: 'flex', borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        backgroundColor: 'rgba(15, 23, 42, 0.6)', padding: '0 28px', gap: '6px'
      }}>
        {[
          { id: 'vision', label: '1. Multimodal Vision QC', icon: Eye, tech: 'Gemini 3.8 Flash Vision + GCS' },
          { id: 'pdm', label: '2. Predictive Maintenance & Derating', icon: Wrench, tech: 'Vertex AI + Pub/Sub + FFT' },
          { id: 'copilot', label: '3. Frontline Operational Copilot', icon: Bot, tech: 'Gemini 1M+ Long Context + Tool Calling' },
          { id: 'bigquery', label: '4. BigQuery & Sustainability Optimizer', icon: Database, tech: 'BigQuery BI Engine' },
          { id: 'architecture', label: '5. End-to-End Architecture', icon: Layers, tech: 'Google Cloud Dataflow & Cloud Run' }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 18px',
                background: isActive ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                border: 'none', borderBottom: isActive ? '2px solid #3b82f6' : '2px solid transparent',
                color: isActive ? '#60a5fa' : '#94a3b8', fontWeight: isActive ? 700 : 500,
                fontSize: '0.82rem', cursor: 'pointer', transition: 'all 0.2s',
                borderRadius: '6px 6px 0 0'
              }}
            >
              <Icon size={16} />
              <div>
                <div>{tab.label}</div>
                <div style={{ fontSize: '0.62rem', color: isActive ? '#93c5fd' : '#64748b' }}>{tab.tech}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* ── CONTENT BODY ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
        
        {/* ════════ TAB 1: MULTIMODAL VISION QC ════════ */}
        {activeTab === 'vision' && (
          <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '24px' }}>
            {/* Left Panel: Sample Parts */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.5)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '18px' }}>
                <h3 style={{ margin: '0 0 12px 0', fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Eye size={16} color="#60a5fa" /> Pilih Komponen Inspeksi (Demo)
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {GEMINI_SAMPLE_PARTS.map(part => {
                    const isSelected = selectedPartId === part.id;
                    const isDefect = part.status === 'DEFECT_DETECTED';
                    return (
                      <div
                        key={part.id}
                        onClick={() => setSelectedPartId(part.id)}
                        style={{
                          padding: '12px 14px', borderRadius: '10px', cursor: 'pointer',
                          backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.2)' : 'rgba(15, 23, 42, 0.6)',
                          border: isSelected ? '1px solid #3b82f6' : '1px solid rgba(255, 255, 255, 0.05)',
                          transition: 'all 0.15s'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.85rem', color: isSelected ? '#93c5fd' : '#e2e8f0' }}>{part.id}</span>
                          <span style={{
                            fontSize: '0.65rem', fontWeight: 700, padding: '2px 8px', borderRadius: '12px',
                            backgroundColor: isDefect ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)',
                            color: isDefect ? '#f87171' : '#4ade80'
                          }}>
                            {part.status}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{part.name}</div>
                        <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '4px' }}>Tolerance: {part.tolerance} | Lot: {part.lot}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Google Cloud Tech Stack Callout */}
              <div style={{ backgroundColor: 'rgba(30, 58, 138, 0.2)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '12px', padding: '16px' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#60a5fa', marginBottom: '4px' }}>GOOGLE CLOUD ARCHITECTURE IN THIS STEP:</div>
                <p style={{ margin: 0, fontSize: '0.78rem', color: '#cbd5e1', lineHeight: 1.5 }}>
                  Gambar dari kamera inspeksi di-upload ke <strong>Cloud Storage (GCS)</strong>, kemudian di-inferensi menggunakan model <strong>Gemini 3.8 Flash Vision on Vertex AI</strong>. Gemini melakukan *zero-shot visual dimensional check* dan mendeteksi cacat mikro tanpa perlu training ribuan dataset custom.
                </p>
              </div>
            </div>

            {/* Right Panel: Vision AI Inspection Result */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{
                backgroundColor: 'rgba(30, 41, 59, 0.5)', border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px', padding: '20px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div>
                    <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc' }}>
                      {visionResult?.partName} ({visionResult?.partId})
                    </h2>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Model: {visionResult?.model}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.68rem', color: '#94a3b8', textTransform: 'uppercase' }}>AI Confidence</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#38bdf8' }}>{visionResult?.confidence}%</div>
                    </div>
                    <span style={{
                      padding: '8px 16px', borderRadius: '8px', fontWeight: 800, fontSize: '0.85rem',
                      backgroundColor: visionResult?.status === 'PASS' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                      border: visionResult?.status === 'PASS' ? '1px solid #22c55e' : '1px solid #ef4444',
                      color: visionResult?.status === 'PASS' ? '#4ade80' : '#f87171'
                    }}>
                      {visionResult?.status === 'PASS' ? '✅ QUALITY PASSED' : '❌ DEFECT DETECTED'}
                    </span>
                  </div>
                </div>

                {/* Inspection Points Grid */}
                <h4 style={{ margin: '14px 0 8px 0', fontSize: '0.82rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
                  Dimensional & Micro-Tolerance Verification Points:
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', marginBottom: '20px' }}>
                  {visionResult?.inspectionPoints?.map((pt, idx) => (
                    <div key={idx} style={{
                      padding: '10px 14px', borderRadius: '8px',
                      backgroundColor: 'rgba(15, 23, 42, 0.6)',
                      border: pt.status === 'PASS' ? '1px solid rgba(34, 197, 94, 0.2)' : '1px solid rgba(239, 68, 68, 0.3)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#e2e8f0' }}>{pt.point}</span>
                        <span style={{ fontSize: '0.65rem', fontWeight: 700, color: pt.status === 'PASS' ? '#4ade80' : '#f87171' }}>{pt.status}</span>
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Spec: {pt.spec}</div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: pt.status === 'PASS' ? '#38bdf8' : '#f87171' }}>Measured: {pt.measured}</div>
                    </div>
                  ))}
                </div>

                {/* Gemini Root Cause & Action Recommendation */}
                <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.7)', borderRadius: '10px', padding: '16px', border: '1px solid rgba(255, 255, 255, 0.05)', marginBottom: '18px' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#38bdf8', marginBottom: '4px' }}>
                    🔍 GEMINI ZERO-SHOT ROOT CAUSE REASONING:
                  </div>
                  <p style={{ margin: '0 0 10px 0', fontSize: '0.85rem', color: '#cbd5e1', lineHeight: 1.5 }}>
                    {visionResult?.rootCauseDraft}
                  </p>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f59e0b', marginBottom: '4px' }}>
                    ⚡ RECOMMENDED SHOPFLOOR ACTION:
                  </div>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#fde68a', lineHeight: 1.5 }}>
                    {visionResult?.recommendedAction}
                  </p>
                </div>

                {/* Autonomous Action Buttons */}
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <button
                    onClick={handleQuarantineMRB}
                    disabled={quarantineStatus === 'QUARANTINED'}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px',
                      backgroundColor: quarantineStatus === 'QUARANTINED' ? '#166534' : '#dc2626',
                      color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700,
                      fontSize: '0.85rem', cursor: quarantineStatus === 'QUARANTINED' ? 'default' : 'pointer'
                    }}
                  >
                    {quarantineStatus === 'QUARANTINED' ? <Check size={16} /> : <AlertTriangle size={16} />}
                    {quarantineStatus === 'QUARANTINED' ? 'Terkarantina ke MRB & CAPA Dibuat' : 'Karantina ke MRB (Closed-Loop Action)'}
                  </button>
                  <button
                    onClick={() => toast.success('Sertifikat inspeksi PDF disimpan ke Cloud Storage (GCS bucket: mavi-mes-qc-certs).')}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px',
                      backgroundColor: 'rgba(255, 255, 255, 0.08)', color: '#e2e8f0',
                      border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '8px',
                      fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer'
                    }}
                  >
                    <Download size={16} /> Simpan ke Cloud Storage (GCS)
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ════════ TAB 2: PREDICTIVE MAINTENANCE & DERATING ════════ */}
        {activeTab === 'pdm' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Spindle Telemetry Card */}
              <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.5)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div>
                    <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Wrench size={20} color="#3b82f6" /> CNC Lathe Spindle 01 — IoT Sensor Telemetry
                    </h2>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Pub/Sub Topic: mavi/plc/telemetry/cnc-01 ➔ Dataflow Ingestion Pipeline</span>
                  </div>
                  <span style={{
                    padding: '6px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700,
                    backgroundColor: deratingActive ? 'rgba(52, 211, 153, 0.15)' : 'rgba(239, 68, 68, 0.2)',
                    color: deratingActive ? '#34d399' : '#f87171', border: deratingActive ? '1px solid #10b981' : '1px solid #ef4444'
                  }}>
                    {deratingActive ? 'PROTECTED (SAFE DERATING)' : 'CRITICAL ANOMALY DETECTED'}
                  </span>
                </div>

                {/* Telemetry Gauges */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '20px' }}>
                  <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.7)', borderRadius: '10px', padding: '16px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase' }}>Vibration RMS (Spindle)</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 800, color: vibrationRms > 3.0 ? '#ef4444' : '#10b981', lineHeight: 1.2 }}>
                      {vibrationRms} <span style={{ fontSize: '0.9rem', color: '#64748b' }}>mm/s</span>
                    </div>
                    <div style={{ fontSize: '0.68rem', color: '#64748b' }}>Baseline: 1.0 mm/s | Limit: 4.5 mm/s</div>
                  </div>

                  <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.7)', borderRadius: '10px', padding: '16px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase' }}>Spindle Temperature</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 800, color: tempCelsius > 65 ? '#f59e0b' : '#10b981', lineHeight: 1.2 }}>
                      {tempCelsius}° <span style={{ fontSize: '0.9rem', color: '#64748b' }}>C</span>
                    </div>
                    <div style={{ fontSize: '0.68rem', color: '#64748b' }}>Baseline: 35°C | Limit: 70°C</div>
                  </div>

                  <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.7)', borderRadius: '10px', padding: '16px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase' }}>PLC Spindle Setpoint</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#38bdf8', lineHeight: 1.2 }}>
                      {simulatedSpindleRpm} <span style={{ fontSize: '0.9rem', color: '#64748b' }}>RPM</span>
                    </div>
                    <div style={{ fontSize: '0.68rem', color: '#64748b' }}>Nominal: 2400 RPM | Derated: 1200 RPM</div>
                  </div>
                </div>

                {/* Simulated FFT Spectrum Visualizer */}
                <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.8)', borderRadius: '10px', padding: '16px', border: '1px solid rgba(255, 255, 255, 0.05)', marginBottom: '18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#38bdf8' }}>FFT VIBRATION SPECTRUM HARMONICS (VERTEX AI TIME-SERIES MODEL)</span>
                    <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Peak Anomaly: 780 Hz (Bearing Inner Race 2X BPFI)</span>
                  </div>
                  {/* Bars visualization */}
                  <div style={{ height: '90px', display: 'flex', alignItems: 'flex-end', gap: '4px', padding: '10px 0 0 0' }}>
                    {[15, 22, 18, 25, 30, 28, 45, 92, 88, 55, 32, 20, 18, 14, 12, 10, 8, 6].map((h, i) => {
                      const effectiveH = deratingActive ? Math.round(h * 0.3) : h;
                      const isHarmonic = i === 7 || i === 8;
                      return (
                        <div key={i} style={{
                          flex: 1, height: `${effectiveH}%`,
                          backgroundColor: isHarmonic ? (deratingActive ? '#3b82f6' : '#ef4444') : '#1e3a8a',
                          borderRadius: '3px 3px 0 0', transition: 'height 0.4s'
                        }} />
                      );
                    })}
                  </div>
                </div>

                {/* Action Trigger Buttons */}
                <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                  <button
                    onClick={handleToggleDerating}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px',
                      backgroundColor: deratingActive ? '#059669' : '#d97706',
                      color: 'white', border: 'none', borderRadius: '8px', fontWeight: 800,
                      fontSize: '0.85rem', cursor: 'pointer', boxShadow: '0 4px 14px rgba(217, 119, 6, 0.3)'
                    }}
                  >
                    <Zap size={16} />
                    {deratingActive ? '✓ Safe Speed Derating Aktif (PLC Register Written)' : '⚡ Eksekusi Safe Speed Derating ke PLC'}
                  </button>

                  <button
                    onClick={handleCreatePdMWorkOrder}
                    disabled={workOrderCreated}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px',
                      backgroundColor: workOrderCreated ? 'rgba(255, 255, 255, 0.1)' : '#2563eb',
                      color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700,
                      fontSize: '0.85rem', cursor: workOrderCreated ? 'default' : 'pointer'
                    }}
                  >
                    <FileText size={16} />
                    {workOrderCreated ? '✓ Work Order Terkirim ke Maintenance' : 'Buat Autonomous Work Order (WO-PDM)'}
                  </button>
                </div>
              </div>
            </div>

            {/* Right Panel: Remaining Useful Life (RUL) Prediction */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.5)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '18px' }}>
                <h3 style={{ margin: '0 0 12px 0', fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc' }}>
                  Vertex AI Remaining Useful Life (RUL)
                </h3>
                <div style={{
                  padding: '20px', borderRadius: '12px', textAlign: 'center',
                  backgroundColor: deratingActive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.15)',
                  border: deratingActive ? '1px solid #10b981' : '1px solid #ef4444', marginBottom: '16px'
                }}>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase' }}>Estimasi Sisa Umur Operasional</div>
                  <div style={{ fontSize: '2.5rem', fontWeight: 900, color: deratingActive ? '#34d399' : '#f87171', margin: '4px 0' }}>
                    {deratingActive ? '142.0' : '18.4'} <span style={{ fontSize: '1rem', fontWeight: 600 }}>Jam</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: deratingActive ? '#a7f3d0' : '#fca5a5' }}>
                    {deratingActive ? 'Derating berhasil memperpanjang umur spindel hingga pergantian shift akhir pekan.' : 'BAHAYA: Kegagalan katastrofik diprediksi terjadi dalam shift berikutnya jika tidak dilakukan derating.'}
                  </p>
                </div>

                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#38bdf8', marginBottom: '8px' }}>
                  Suku Cadang Rekomendasi AI:
                </div>
                <div style={{ padding: '10px 12px', borderRadius: '8px', backgroundColor: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.05)', fontSize: '0.8rem', color: '#cbd5e1' }}>
                  <strong>Bearing Spindle 6204-Z P5</strong> (Stok Gudang: 4 unit di Rak A-12). Auto-reserved di ERP.
                </div>
              </div>

              {/* Data Pipeline Callout */}
              <div style={{ backgroundColor: 'rgba(30, 58, 138, 0.2)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '12px', padding: '16px' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#60a5fa', marginBottom: '4px' }}>GOOGLE CLOUD WORKFLOW:</div>
                <p style={{ margin: 0, fontSize: '0.78rem', color: '#cbd5e1', lineHeight: 1.5 }}>
                  Sensor vibrasi getaran dikirim via <strong>Google Cloud Pub/Sub</strong> ke <strong>Dataflow</strong> untuk komputasi windowing FFT. Model <strong>Vertex AI AutoML Forecaster</strong> memprediksi kurva RUL dan mengeksekusi *safe speed derating* kembali ke shopfloor.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ════════ TAB 3: FRONTLINE OPERATIONAL COPILOT ════════ */}
        {activeTab === 'copilot' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px' }}>
            {/* Chat Conversation */}
            <div style={{ display: 'flex', flexDirection: 'column', height: '620px', backgroundColor: 'rgba(30, 41, 59, 0.5)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', overflow: 'hidden' }}>
              {/* Header */}
              <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', backgroundColor: 'rgba(15, 23, 42, 0.8)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Bot size={20} color="#60a5fa" />
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#f8fafc' }}>Frontline Copilot (Gemini 1M+ Long Context)</div>
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Synthesizing OEM Manuals, IoT Sensor Telemetry & CAPA Records</div>
                  </div>
                </div>
                <span style={{ fontSize: '0.7rem', color: '#34d399', backgroundColor: 'rgba(52, 211, 153, 0.1)', padding: '3px 8px', borderRadius: '12px', border: '1px solid rgba(52, 211, 153, 0.3)' }}>
                  Active Context: 1,017,000 Tokens
                </span>
              </div>

              {/* Messages Body */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {chatMessages.map((msg, i) => (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start' }}>
                    <div style={{
                      maxWidth: '85%', padding: '14px 18px', borderRadius: '12px',
                      backgroundColor: msg.sender === 'user' ? '#2563eb' : 'rgba(15, 23, 42, 0.8)',
                      border: msg.sender === 'user' ? 'none' : '1px solid rgba(255, 255, 255, 0.08)',
                      color: '#f8fafc', fontSize: '0.85rem', lineHeight: 1.6, whiteSpace: 'pre-wrap'
                    }}>
                      {msg.text}
                      {msg.citations && (
                        <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.1)', fontSize: '0.72rem', color: '#93c5fd' }}>
                          <strong>📚 Sumber Dokumen yang Disintesis:</strong>
                          <ul style={{ margin: '4px 0 0 0', paddingLeft: '16px' }}>
                            {msg.citations.map((c, ci) => <li key={ci}>{c}</li>)}
                          </ul>
                        </div>
                      )}
                    </div>
                    <span style={{ fontSize: '0.65rem', color: '#64748b', marginTop: '4px', padding: '0 4px' }}>{msg.timestamp}</span>
                  </div>
                ))}
                {isCopilotThinking && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#60a5fa', fontSize: '0.8rem', padding: '10px' }}>
                    <RefreshCw size={14} className="animate-spin" /> Gemini 3.8 Flash sedang menganalisis 1M+ token manual pabrik & log sensor...
                  </div>
                )}
              </div>

              {/* Quick Prompts & Input Bar */}
              <div style={{ padding: '14px 20px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', backgroundColor: 'rgba(15, 23, 42, 0.8)' }}>
                {/* Prompt Pills */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
                  {[
                    'Mengapa Stasiun Line 1 Andon STOP?',
                    'Bagaimana cara kalibrasi katup filter oli V-12?',
                    'Reroute Work Order WO-2026-042 ke Line 3'
                  ].map((pill, pi) => (
                    <button
                      key={pi}
                      onClick={() => handleSendCopilotPrompt(pill)}
                      style={{
                        padding: '4px 10px', borderRadius: '16px', backgroundColor: 'rgba(59, 130, 246, 0.15)',
                        border: '1px solid rgba(59, 130, 246, 0.3)', color: '#93c5fd', fontSize: '0.72rem',
                        cursor: 'pointer'
                      }}
                    >
                      {pill}
                    </button>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <input
                    value={inputPrompt}
                    onChange={(e) => setInputPrompt(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSendCopilotPrompt(); }}
                    placeholder="Tanya Frontline Copilot tentang troubleshooting mesin atau operasional..."
                    style={{
                      flex: 1, padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.15)',
                      backgroundColor: 'rgba(30, 41, 59, 0.6)', color: '#ffffff', fontSize: '0.85rem'
                    }}
                  />
                  <button
                    onClick={() => handleSendCopilotPrompt()}
                    disabled={isCopilotThinking}
                    style={{
                      padding: '10px 20px', backgroundColor: '#2563eb', color: 'white', border: 'none',
                      borderRadius: '8px', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer'
                    }}
                  >
                    Kirim
                  </button>
                </div>
              </div>
            </div>

            {/* Right Panel: Factory Deep Memory Docs */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.5)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '18px' }}>
                <h3 style={{ margin: '0 0 12px 0', fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc' }}>
                  Factory Memory Documents (1M+ Tokens)
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {GEMINI_FACTORY_DOCUMENTS.map((doc, di) => (
                    <div key={di} style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#60a5fa', marginBottom: '2px' }}>{doc.title}</div>
                      <div style={{ fontSize: '0.68rem', color: '#10b981', marginBottom: '4px' }}>{doc.tokens} • {doc.type}</div>
                      <p style={{ margin: 0, fontSize: '0.72rem', color: '#94a3b8', fontStyle: 'italic' }}>
                        "{doc.excerpt}"
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Function Calling Execution Panel */}
              <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.5)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '18px' }}>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '0.92rem', fontWeight: 700, color: '#f8fafc' }}>
                  Autonomous Tool Calling
                </h3>
                <p style={{ margin: '0 0 12px 0', fontSize: '0.75rem', color: '#94a3b8' }}>
                  Gemini secara otonom dapat memicu fungsi eksekusi langsung ke sistem shopfloor:
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button
                    onClick={() => handleDispatchCopilotAction('rerouteWorkOrder(WO-2026-042, Line 3)')}
                    style={{ padding: '8px 12px', borderRadius: '6px', backgroundColor: 'rgba(59, 130, 246, 0.2)', border: '1px solid #3b82f6', color: '#93c5fd', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', textAlign: 'left' }}
                  >
                    ⚡ rerouteWorkOrder(WO-2026-042, Line 3)
                  </button>
                  <button
                    onClick={() => handleDispatchCopilotAction('dispatchMaintenanceCAPA(Line 1 CNC Lathe)')}
                    style={{ padding: '8px 12px', borderRadius: '6px', backgroundColor: 'rgba(245, 158, 11, 0.2)', border: '1px solid #f59e0b', color: '#fde68a', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', textAlign: 'left' }}
                  >
                    🛠️ dispatchMaintenanceCAPA(Line 1 CNC Lathe)
                  </button>
                  <button
                    onClick={() => handleDispatchCopilotAction('adjustMachineSetpoint(V-12 Pressure -> 4.2 Bar)')}
                    style={{ padding: '8px 12px', borderRadius: '6px', backgroundColor: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10b981', color: '#a7f3d0', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', textAlign: 'left' }}
                  >
                    ⚙️ adjustMachineSetpoint(V-12 Pressure &rarr; 4.2 Bar)
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ════════ TAB 4: BIGQUERY & SUSTAINABILITY OPTIMIZER ════════ */}
        {activeTab === 'bigquery' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Query Selector & Editor */}
              <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.5)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Database size={20} color="#60a5fa" /> Google BigQuery BI Engine — Studio Analitik
                  </h2>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {BQ_QUERIES.map((q, idx) => (
                      <button
                        key={idx}
                        onClick={() => { setActiveQueryIndex(idx); setQueryOutput(null); }}
                        style={{
                          padding: '6px 12px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700,
                          backgroundColor: activeQueryIndex === idx ? '#2563eb' : 'rgba(255, 255, 255, 0.05)',
                          color: '#ffffff', border: 'none', cursor: 'pointer'
                        }}
                      >
                        Query #{idx + 1}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#e2e8f0', marginBottom: '4px' }}>
                  {BQ_QUERIES[activeQueryIndex].title}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '12px' }}>
                  {BQ_QUERIES[activeQueryIndex].desc}
                </div>

                {/* SQL Code Block */}
                <div style={{
                  backgroundColor: '#090d16', borderRadius: '8px', padding: '16px',
                  border: '1px solid rgba(255, 255, 255, 0.1)', fontFamily: 'Fira Code, Consolas, monospace',
                  fontSize: '0.8rem', color: '#93c5fd', whiteSpace: 'pre', overflowX: 'auto', marginBottom: '16px'
                }}>
                  {BQ_QUERIES[activeQueryIndex].sql}
                </div>

                <button
                  onClick={handleRunBqQuery}
                  disabled={isQueryRunning}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px',
                    backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '8px',
                    fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer'
                  }}
                >
                  {isQueryRunning ? <RefreshCw size={16} className="animate-spin" /> : <Play size={16} />}
                  {isQueryRunning ? 'Scanning BigQuery Partition...' : 'Jalankan Query di BigQuery (BI Engine)'}
                </button>
              </div>

              {/* Query Results Table Simulation */}
              {queryOutput && (
                <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.5)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '20px' }}>
                  <h3 style={{ margin: '0 0 12px 0', fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc' }}>
                    Hasil Eksekusi BigQuery (1.2M Rows Processed in 118ms)
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginBottom: '16px' }}>
                    {queryOutput.metrics.map((m, mi) => (
                      <div key={mi} style={{ backgroundColor: 'rgba(15, 23, 42, 0.7)', borderRadius: '8px', padding: '12px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                        <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{m.label}</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#38bdf8' }}>{m.val}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#a7f3d0', fontSize: '0.82rem' }}>
                    ✅ <strong>Rekomendasi AI Terintegrasi:</strong> Parameter pemotongan Stasiun CNC-02 telah dituning otomatis via BigQuery ML rekomendasi, menghemat 14.2% energi per unit part dan menurunkan defect rate dari 4.8% ke 0.4%.
                  </div>
                </div>
              )}
            </div>

            {/* Right Panel: Sustainability Metrics */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.5)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '18px' }}>
                <h3 style={{ margin: '0 0 14px 0', fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc' }}>
                  ESG & Sustainability Impact
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Scrap & Material Waste Reduction</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#10b981' }}>-28.6%</div>
                    <div style={{ fontSize: '0.68rem', color: '#64748b' }}>Deteksi cacat dini di stasiun pertama mencegah pemborosan proses lanjutan.</div>
                  </div>
                  <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Energy Consumption Optimization</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#38bdf8' }}>-14.2% kWh</div>
                    <div style={{ fontSize: '0.68rem', color: '#64748b' }}>Eliminasi idle power pada mesin pendingin dan spindle non-produktif.</div>
                  </div>
                  <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Unplanned Line Downtime Avoided</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f59e0b' }}>42.5 Jam / Bulan</div>
                    <div style={{ fontSize: '0.68rem', color: '#64748b' }}>Mencegah breakdown katastrofik melalui derating terotomatisasi.</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ════════ TAB 5: ARCHITECTURE & DATA PIPELINE ════════ */}
        {activeTab === 'architecture' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.5)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '24px' }}>
              <h2 style={{ margin: '0 0 8px 0', fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc' }}>
                End-to-End Enterprise Architecture: MAVI MES + Google Cloud
              </h2>
              <p style={{ margin: '0 0 24px 0', fontSize: '0.85rem', color: '#94a3b8' }}>
                Dari sensor edge mikro-detik di lini perakitan hingga penalaran multi-dokumen Gemini 3.8 di Vertex AI dan penulisan balik ke register PLC.
              </p>

              {/* Interactive Architecture Flow Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '14px', marginBottom: '24px' }}>
                {[
                  {
                    step: '1. Edge Shopfloor',
                    tech: 'MAVI Edge & IoT Hub',
                    items: ['Modbus TCP / MQTT', 'OPC-UA PLC Tags', 'Kamera USB/RTSP', 'Operator Terminal'],
                    color: '#60a5fa'
                  },
                  {
                    step: '2. Cloud Ingestion',
                    tech: 'Google Cloud Pub/Sub & GCS',
                    items: ['14.8k msg/sec streams', 'Lossless buffer', 'Cloud Storage QC Images', '3D CAD Bucket'],
                    color: '#fbbf24'
                  },
                  {
                    step: '3. Data Processing',
                    tech: 'Dataflow & BigQuery',
                    items: ['Apache Beam windowing', 'FFT Vibration filter', 'BigQuery BI Engine', '1.2M rows analytical WH'],
                    color: '#34d399'
                  },
                  {
                    step: '4. AI Reasoning',
                    tech: 'Vertex AI & Gemini 3.8',
                    items: ['Gemini 3.8 Flash Vision', '1M+ Long Context RCA', 'AutoML RUL Forecaster', 'Autonomous Tool Calling'],
                    color: '#a855f7'
                  },
                  {
                    step: '5. Closed-Loop Action',
                    tech: 'Cloud Run & MAVI Triggers',
                    items: ['Safe Speed Derating (PLC)', 'Auto-generate WO #CAPA', 'Tulip Data Manipulation', 'Andon Station Alert'],
                    color: '#ef4444'
                  }
                ].map((col, ci) => (
                  <div key={ci} style={{
                    padding: '16px', borderRadius: '10px', backgroundColor: 'rgba(15, 23, 42, 0.7)',
                    border: `1px solid ${col.color}40`, display: 'flex', flexDirection: 'column'
                  }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: col.color, textTransform: 'uppercase', marginBottom: '4px' }}>
                      {col.step}
                    </div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#f8fafc', marginBottom: '12px' }}>
                      {col.tech}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {col.items.map((it, iti) => (
                        <div key={iti} style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <CheckCircle2 size={12} color={col.color} /> {it}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Compliance & SLA Benchmarks */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', backgroundColor: 'rgba(15, 23, 42, 0.6)', borderRadius: '10px', padding: '16px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <div>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Gemini Reasoning Latency</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#34d399' }}>650 ms</div>
                  <div style={{ fontSize: '0.65rem', color: '#64748b' }}>Gemini 3.8 Flash Multimodal</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Pub/Sub Streaming Throughput</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#60a5fa' }}>14,800 msg/s</div>
                  <div style={{ fontSize: '0.65rem', color: '#64748b' }}>Zero message drop rate</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>BigQuery Query SLA</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fbbf24' }}>118 ms</div>
                  <div style={{ fontSize: '0.65rem', color: '#64748b' }}>BI Engine in-memory acceleration</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Audit Trail Standard</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#a855f7' }}>21 CFR Part 11</div>
                  <div style={{ fontSize: '0.65rem', color: '#64748b' }}>ISO 9001 / IATF 16949 Ready</div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

/**
 * BalloonDrawingWidget.jsx
 * Interactive Blueprint / CAD Drawing with Inspection Balloons & Metrology Tools (Alat Ukur & Alat Ulir)
 * Specifically optimized for GlueStack Mobile Player & Tablet QC Checksheets
 */

import React, { useState } from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock,
  Ruler,
  Gauge,
  Sparkles,
  Layers,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';

const DEFAULT_BALLOONS = [
  {
    id: 'b1',
    number: 1,
    x: 28,
    y: 34,
    feature: 'Diameter Luar (OD)',
    nominal: 25.0,
    tolerance: 0.05,
    unit: 'mm',
    toolType: 'MICROMETER',
    toolName: 'Mikrometer Luar Digital (0-25mm)',
    category: 'diameter',
    status: 'PASS',
    actual: 25.012
  },
  {
    id: 'b2',
    number: 2,
    x: 52,
    y: 26,
    feature: 'Panjang Total Baut',
    nominal: 50.0,
    tolerance: 0.2,
    unit: 'mm',
    toolType: 'VERNIER_CALIPER',
    toolName: 'Jangka Sorong Digital (Caliper 150mm)',
    category: 'length',
    status: 'PASS',
    actual: 49.95
  },
  {
    id: 'b3',
    number: 3,
    x: 74,
    y: 52,
    feature: 'Ulir Baut (Thread & Pitch)',
    nominal: 1.5,
    tolerance: 0.05,
    unit: 'mm',
    threadSpec: 'M12 x 1.5 - 6g',
    toolType: 'THREAD_GAUGE',
    toolName: 'Thread Ring Gauge M12 x 1.5 (Go / No-Go)',
    category: 'thread',
    status: 'PENDING',
    goStatus: null,     // true = GO Masuk (OK)
    noGoStatus: null,   // true = NO-GO Tidak Masuk (OK)
    actual: null
  },
  {
    id: 'b4',
    number: 4,
    x: 35,
    y: 72,
    feature: 'Kedalaman Chamfer 45°',
    nominal: 2.0,
    tolerance: 0.1,
    unit: 'mm',
    toolType: 'DIAL_HEIGHT_GAUGE',
    toolName: 'Dial Height Gauge Presisi',
    category: 'chamfer',
    status: 'PENDING',
    actual: null
  },
  {
    id: 'b5',
    number: 5,
    x: 82,
    y: 80,
    feature: 'Kekasaran Permukaan Batang',
    nominal: 1.6,
    tolerance: 0.4,
    unit: 'μm',
    toolType: 'ROUGHNESS_TESTER',
    toolName: 'Surface Roughness Tester (Ra)',
    category: 'roughness',
    status: 'PENDING',
    actual: null
  }
];

export function BalloonDrawingWidget({
  title = 'CAD Drawing Blueprint — Shaft Baut M12',
  drawingNo = 'DWG-SHF-2026-08',
  drawingImage,
  balloons: initialBalloons = DEFAULT_BALLOONS,
  onComplete,
  onChange
}) {
  const [balloons, setBalloons] = useState(initialBalloons);
  const [activeBalloonId, setActiveBalloonId] = useState('b3'); // default focus to thread balloon
  const [zoomLevel, setZoomLevel] = useState(1);
  const [manualValue, setManualValue] = useState('');

  const activeBalloon = balloons.find(b => b.id === activeBalloonId) || balloons[0];

  const handleSelectBalloon = (b) => {
    setActiveBalloonId(b.id);
    setManualValue(b.actual !== null && b.actual !== undefined ? String(b.actual) : '');
  };

  const handleUpdateActiveValue = (val) => {
    const num = parseFloat(val);
    if (isNaN(num)) return;

    const isPass = Math.abs(num - activeBalloon.nominal) <= activeBalloon.tolerance;
    const nextStatus = isPass ? 'PASS' : 'FAIL';

    const updated = balloons.map(b => {
      if (b.id === activeBalloon.id) {
        return { ...b, actual: num, status: nextStatus };
      }
      return b;
    });

    setBalloons(updated);
    if (onChange) onChange(updated);
  };

  const handleThreadGaugeCheck = (goPassed, noGoPassed) => {
    // Thread standard: GO must pass (masuk lancar), NO-GO must pass (tidak boleh masuk)
    const isPass = goPassed === true && noGoPassed === true;
    const updated = balloons.map(b => {
      if (b.id === activeBalloon.id) {
        return {
          ...b,
          goStatus: goPassed,
          noGoStatus: noGoPassed,
          actual: goPassed && noGoPassed ? 'GO OK / NO-GO OK' : 'DEFECTIVE ULIR',
          status: isPass ? 'PASS' : (goPassed === false || noGoPassed === false ? 'FAIL' : 'PENDING')
        };
      }
      return b;
    });

    setBalloons(updated);
    if (onChange) onChange(updated);
  };

  const completedCount = balloons.filter(b => b.status === 'PASS' || b.status === 'FAIL').length;
  const passCount = balloons.filter(b => b.status === 'PASS').length;
  const failCount = balloons.filter(b => b.status === 'FAIL').length;

  return (
    <div className="w-full bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden font-sans space-y-0">
      {/* Top Header */}
      <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 font-mono text-[10px] font-bold">
              {drawingNo}
            </span>
            <span className="text-xs font-bold truncate text-slate-200">{title}</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
            <span>Balon Inspeksi: {completedCount} / {balloons.length} Diperiksa</span>
            <span>•</span>
            <span className="text-emerald-400 font-bold">{passCount} OK</span>
            {failCount > 0 && <span className="text-rose-400 font-bold">• {failCount} NG</span>}
          </div>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-lg">
          <button
            type="button"
            onClick={() => setZoomLevel(prev => Math.max(0.8, prev - 0.2))}
            className="p-1 hover:bg-slate-700 text-slate-300 rounded cursor-pointer transition-colors"
            title="Perkecil"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-[10px] font-mono text-slate-300 px-1">{Math.round(zoomLevel * 100)}%</span>
          <button
            type="button"
            onClick={() => setZoomLevel(prev => Math.min(1.8, prev + 0.2))}
            className="p-1 hover:bg-slate-700 text-slate-300 rounded cursor-pointer transition-colors"
            title="Perbesar"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setZoomLevel(1)}
            className="p-1 hover:bg-slate-700 text-slate-300 rounded cursor-pointer transition-colors ml-0.5"
            title="Reset"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Blueprint Drawing Canvas with Interactive Balloons */}
      <div className="relative w-full aspect-16/10 bg-slate-950 overflow-hidden border-y border-slate-800 flex items-center justify-center select-none">
        {/* Subtle CAD Blueprint Grid */}
        <div 
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(to right, #0284c7 1px, transparent 1px), linear-gradient(to bottom, #0284c7 1px, transparent 1px)',
            backgroundSize: '24px 24px'
          }}
        />

        {/* Blueprint Container with Scale */}
        <div 
          className="relative w-full h-full flex items-center justify-center transition-transform duration-200 origin-center"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          {drawingImage ? (
            <img 
              src={drawingImage} 
              alt="Engineering Drawing" 
              className="max-h-full max-w-full object-contain pointer-events-none opacity-90" 
            />
          ) : (
            /* High-Tech Vector CAD Blueprint Representation */
            <svg viewBox="0 0 600 360" className="w-full h-full max-h-full max-w-full text-sky-400">
              {/* Center Line */}
              <line x1="40" y1="180" x2="560" y2="180" stroke="#38bdf8" strokeDasharray="8,4,2,4" strokeWidth="1" opacity="0.6" />
              
              {/* Shaft Outline */}
              <rect x="100" y="120" width="160" height="120" rx="3" fill="#0f172a" stroke="#38bdf8" strokeWidth="2.5" />
              <rect x="260" y="135" width="140" height="90" rx="2" fill="#0f172a" stroke="#38bdf8" strokeWidth="2.5" />
              
              {/* Threaded Section (Ulir) */}
              <g id="threaded-section">
                <rect x="400" y="145" width="120" height="70" fill="#1e1b4b" stroke="#818cf8" strokeWidth="2.5" />
                {/* Thread serrations / Pitch grooves */}
                {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110].map(tx => (
                  <path 
                    key={tx} 
                    d={`M${400 + tx},145 L${405 + tx},140 L${410 + tx},145 L${400 + tx},215 L${405 + tx},220 L${410 + tx},215`} 
                    stroke="#a5b4fc" 
                    strokeWidth="1.5" 
                    fill="none" 
                  />
                ))}
                <text x="420" y="185" fill="#c7d2fe" fontSize="11" fontWeight="bold" fontFamily="monospace">M12 x 1.5</text>
              </g>

              {/* Chamfer on tip */}
              <polygon points="520,145 535,155 535,205 520,215" fill="#0f172a" stroke="#38bdf8" strokeWidth="2" />

              {/* Dimension lines */}
              <line x1="100" y1="95" x2="400" y2="95" stroke="#94a3b8" strokeWidth="1.2" markerEnd="url(#arrow)" />
              <line x1="100" y1="90" x2="100" y2="120" stroke="#64748b" strokeWidth="1" />
              <line x1="400" y1="90" x2="400" y2="135" stroke="#64748b" strokeWidth="1" />
              <text x="230" y="88" fill="#e2e8f0" fontSize="10" fontFamily="sans-serif">50.0 ± 0.2 mm</text>

              {/* Diameter OD dimension line */}
              <line x1="75" y1="120" x2="75" y2="240" stroke="#94a3b8" strokeWidth="1.2" />
              <line x1="70" y1="120" x2="100" y2="120" stroke="#64748b" strokeWidth="1" />
              <line x1="70" y1="240" x2="100" y2="240" stroke="#64748b" strokeWidth="1" />
              <text x="35" y="184" fill="#e2e8f0" fontSize="10" fontFamily="sans-serif">ø25 ±0.05</text>
            </svg>
          )}

          {/* Render Clickable Balloons */}
          {balloons.map((b) => {
            const isSelected = b.id === activeBalloonId;
            let bgColor = 'bg-slate-700/90 text-white border-slate-400';
            let pulseEffect = '';

            if (b.status === 'PASS') {
              bgColor = 'bg-emerald-600 text-white border-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.7)]';
            } else if (b.status === 'FAIL') {
              bgColor = 'bg-rose-600 text-white border-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.7)]';
            } else if (isSelected) {
              bgColor = 'bg-amber-500 text-slate-950 border-white shadow-[0_0_15px_rgba(245,158,11,0.9)]';
              pulseEffect = 'animate-bounce';
            }

            return (
              <button
                key={b.id}
                type="button"
                onClick={() => handleSelectBalloon(b)}
                style={{ left: `${b.x}%`, top: `${b.y}%` }}
                className={`absolute -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold text-xs shadow-md transition-all cursor-pointer z-20 ${bgColor} ${pulseEffect} hover:scale-110 active:scale-95`}
                title={`Balon #${b.number}: ${b.feature}`}
              >
                {b.number}
              </button>
            );
          })}
        </div>

        {/* Floating Blueprint Overlay Indicator */}
        <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-md bg-slate-900/80 backdrop-blur-xs border border-slate-800 text-[10px] text-slate-300 flex items-center gap-1.5">
          <Layers className="w-3 h-3 text-teal-400" />
          <span>Tap balon nomor untuk input data alat ukur / ulir</span>
        </div>
      </div>

      {/* Active Balloon Measurement Control Panel */}
      <div className="p-4 bg-slate-50 space-y-3.5 border-t border-slate-200">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shadow-xs border ${
              activeBalloon.status === 'PASS'
                ? 'bg-emerald-600 text-white border-emerald-500'
                : activeBalloon.status === 'FAIL'
                ? 'bg-rose-600 text-white border-rose-500'
                : 'bg-amber-500 text-slate-950 border-amber-400'
            }`}>
              #{activeBalloon.number}
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <span>{activeBalloon.feature}</span>
                {activeBalloon.threadSpec && (
                  <span className="px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 text-[10px] font-mono font-bold">
                    {activeBalloon.threadSpec}
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-500">
                Standar: <strong className="text-slate-700">{activeBalloon.nominal} ± {activeBalloon.tolerance} {activeBalloon.unit}</strong>
              </div>
            </div>
          </div>

          <div className="text-right">
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider ${
              activeBalloon.status === 'PASS'
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : activeBalloon.status === 'FAIL'
                ? 'bg-rose-100 text-rose-800 border border-rose-300'
                : 'bg-amber-100 text-amber-800 border border-amber-300'
            }`}>
              {activeBalloon.status === 'PASS' && <CheckCircle2 className="w-3.5 h-3.5" />}
              {activeBalloon.status === 'FAIL' && <XCircle className="w-3.5 h-3.5" />}
              {activeBalloon.status === 'PENDING' && <Clock className="w-3.5 h-3.5" />}
              <span>{activeBalloon.status}</span>
            </span>
          </div>
        </div>

        {/* Recommended Tool Card */}
        <div className="p-2.5 bg-white rounded-xl border border-slate-200/90 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-600 border border-sky-200 flex items-center justify-center">
              {activeBalloon.category === 'thread' ? <Gauge className="w-3.5 h-3.5" /> : <Ruler className="w-3.5 h-3.5" />}
            </div>
            <div>
              <div className="text-[10px] text-slate-400 font-bold uppercase">Rekomendasi Alat Ukur</div>
              <div className="text-xs font-bold text-slate-800">{activeBalloon.toolName}</div>
            </div>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
            TERKALIBRASI
          </span>
        </div>

        {/* SPECIALIZED INPUT MODE: THREAD GAUGE (ALAT UKUR ULIR) */}
        {activeBalloon.category === 'thread' ? (
          <div className="p-3 bg-indigo-50/70 rounded-xl border border-indigo-200 space-y-3">
            <div className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Pemeriksaan Ulir Baut (Thread Ring Gauge Check)</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {/* GO GAUGE TEST */}
              <button
                type="button"
                onClick={() => handleThreadGaugeCheck(true, activeBalloon.noGoStatus ?? true)}
                className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                  activeBalloon.goStatus === true
                    ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-300 hover:border-emerald-400'
                }`}
              >
                <div className="text-[10px] font-bold opacity-80 uppercase">1. Thread GO Gauge</div>
                <div className="text-xs font-black mt-0.5">
                  {activeBalloon.goStatus === true ? '✓ MASUK LANCAR (OK)' : 'Uji GO Masuk'}
                </div>
              </button>

              {/* NO-GO GAUGE TEST */}
              <button
                type="button"
                onClick={() => handleThreadGaugeCheck(activeBalloon.goStatus ?? true, true)}
                className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                  activeBalloon.noGoStatus === true
                    ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-300 hover:border-emerald-400'
                }`}
              >
                <div className="text-[10px] font-bold opacity-80 uppercase">2. Thread NO-GO Gauge</div>
                <div className="text-xs font-black mt-0.5">
                  {activeBalloon.noGoStatus === true ? '✓ TIDAK MASUK (OK)' : 'Uji NO-GO Tahan'}
                </div>
              </button>
            </div>

            {/* Reject Button if Thread is Defective */}
            <button
              type="button"
              onClick={() => handleThreadGaugeCheck(false, false)}
              className="w-full py-1.5 px-3 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-colors cursor-pointer text-center"
            >
              Laporkan Ulir Rusak / Seret (Defect NG)
            </button>
          </div>
        ) : (
          /* STANDARD DIMENSIONAL NUMERIC INPUT */
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 block">
              Nilai Hasil Pengukuran Aktual ({activeBalloon.unit}):
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                step={activeBalloon.tolerance < 0.1 ? '0.001' : '0.01'}
                value={manualValue}
                onChange={(e) => {
                  setManualValue(e.target.value);
                  handleUpdateActiveValue(e.target.value);
                }}
                placeholder={`Contoh: ${activeBalloon.nominal}`}
                className="flex-1 p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#008784] focus:border-[#008784] shadow-2xs"
              />
              <button
                type="button"
                onClick={() => {
                  const simulated = (activeBalloon.nominal + (Math.random() - 0.5) * (activeBalloon.tolerance * 0.8)).toFixed(3);
                  setManualValue(simulated);
                  handleUpdateActiveValue(simulated);
                }}
                className="px-3 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1 shadow-xs cursor-pointer active:scale-95"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Auto-Read</span>
              </button>
            </div>
          </div>
        )}

        {/* Quick Navigation Between Balloons */}
        <div className="flex items-center justify-between pt-1 text-xs">
          <div className="flex gap-1.5 overflow-x-auto py-1">
            {balloons.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => handleSelectBalloon(b)}
                className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-colors cursor-pointer border ${
                  b.id === activeBalloonId
                    ? 'bg-slate-900 text-white border-slate-900'
                    : b.status === 'PASS'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : b.status === 'FAIL'
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : 'bg-white text-slate-600 border-slate-200'
                }`}
              >
                Balon #{b.number}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => {
              const currIdx = balloons.findIndex(b => b.id === activeBalloonId);
              const nextIdx = (currIdx + 1) % balloons.length;
              handleSelectBalloon(balloons[nextIdx]);
            }}
            className="flex items-center gap-1 text-teal-700 hover:text-teal-800 font-bold text-xs shrink-0 cursor-pointer ml-2"
          >
            <span>Balon Berikutnya</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
export default BalloonDrawingWidget;

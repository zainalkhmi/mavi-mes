/**
 * MESWidgets.jsx
 * Industrial Manufacturing Execution System (MES) widgets for Gluestack
 * Exports: ProductionCounter, OEEWidget, AlarmBanner
 */

import React, { useState, useEffect } from 'react';
import {
  Activity, AlertTriangle, Bell, CheckCircle2, ChevronRight,
  TrendingUp, Clock, Factory, Zap, ShieldAlert, Check
} from 'lucide-react';

/**
 * 1. ProductionCounter
 * Big tactile target vs actual vs defect counter for assembly stations
 */
export function ProductionCounter({
  id,
  label = 'Pencatatan Produksi Part',
  targetQty = 500,
  actualQty: controlledActual,
  defectQty: controlledDefect,
  unit = 'pcs',
  onChange,
  onTargetReached
}) {
  const [actual, setActual] = useState(controlledActual !== undefined ? Number(controlledActual) : 0);
  const [defect, setDefect] = useState(controlledDefect !== undefined ? Number(controlledDefect) : 0);

  useEffect(() => {
    if (controlledActual !== undefined) setActual(Number(controlledActual));
  }, [controlledActual]);

  useEffect(() => {
    if (controlledDefect !== undefined) setDefect(Number(controlledDefect));
  }, [controlledDefect]);

  const goodQty = Math.max(0, actual - defect);
  const progressPct = targetQty > 0 ? Math.min(100, Math.round((goodQty / targetQty) * 100)) : 0;
  const remaining = Math.max(0, targetQty - goodQty);

  const handleNudgeActual = (delta) => {
    const next = Math.max(0, actual + delta);
    setActual(next);
    if (onChange) onChange({ actual: next, defect, good: Math.max(0, next - defect), progressPct });
    if (next >= targetQty && onTargetReached) onTargetReached();
  };

  const handleNudgeDefect = (delta) => {
    const next = Math.max(0, defect + delta);
    setDefect(next);
    if (onChange) onChange({ actual, defect: next, good: Math.max(0, actual - next), progressPct });
  };

  return (
    <div className="w-full p-4 bg-white rounded-2xl border border-slate-200/90 shadow-xs space-y-3 font-sans">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
            <Factory className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-extrabold text-slate-800">{label}</div>
            <div className="text-[11px] text-slate-500 font-medium">
              Sisa Target: <strong className="text-slate-700">{remaining} {unit}</strong>
            </div>
          </div>
        </div>

        <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${
          progressPct >= 100 ? 'bg-emerald-100 text-emerald-700 border border-emerald-300' : 'bg-blue-100 text-blue-700 border border-blue-200'
        }`}>
          {progressPct}% SELESAI
        </span>
      </div>

      {/* 3 Metric Columns: Target | Good (Aktual) | Defect */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Target</div>
          <div className="text-lg font-black font-mono text-slate-800 mt-0.5">{targetQty}</div>
        </div>

        <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200">
          <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Good Part</div>
          <div className="text-lg font-black font-mono text-emerald-800 mt-0.5">{goodQty}</div>
        </div>

        <div className="p-2.5 bg-rose-50 rounded-xl border border-rose-200">
          <div className="text-[10px] font-bold uppercase tracking-wider text-rose-700">Defect (NG)</div>
          <div className="text-lg font-black font-mono text-rose-800 mt-0.5">{defect}</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
        <div
          className={`h-full transition-all duration-300 ${
            progressPct >= 100 ? 'bg-emerald-500' : 'bg-blue-600'
          }`}
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Quick Operator Action Buttons */}
      <div className="grid grid-cols-2 gap-2 pt-1">
        <button
          type="button"
          onClick={() => handleNudgeActual(1)}
          className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-xl text-xs font-black transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <span>+1 Part Selesai</span>
        </button>

        <button
          type="button"
          onClick={() => handleNudgeDefect(1)}
          className="py-2.5 px-3 bg-rose-50 hover:bg-rose-100 active:scale-98 text-rose-700 border border-rose-300 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <span>+1 Catat Defect</span>
        </button>
      </div>
    </div>
  );
}

/**
 * 2. OEEWidget
 * Overall Equipment Effectiveness (Availability x Performance x Quality)
 */
export function OEEWidget({
  id,
  label = 'Efektivitas Mesin (OEE)',
  availability = 92.5,
  performance = 88.0,
  quality = 98.4
}) {
  const oee = Math.round(((availability / 100) * (performance / 100) * (quality / 100)) * 1000) / 10;
  const isWorldClass = oee >= 85.0;

  return (
    <div className="w-full p-4 bg-white rounded-2xl border border-slate-200/90 shadow-xs space-y-3 font-sans">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-extrabold text-slate-800">{label}</div>
            <div className="text-[11px] text-slate-500 font-medium">Benchmark Kelas Dunia: &ge; 85%</div>
          </div>
        </div>

        <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${
          isWorldClass ? 'bg-emerald-100 text-emerald-700 border border-emerald-300' : 'bg-amber-100 text-amber-700 border border-amber-300'
        }`}>
          {isWorldClass ? 'WORLD CLASS' : 'PERLU OPTIMASI'}
        </span>
      </div>

      {/* Main Big OEE Gauge Banner */}
      <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-center flex items-center justify-between px-6">
        <div className="text-left">
          <div className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider">SKOR KESELURUHAN OEE</div>
          <div className="text-2xl font-black font-mono text-teal-400 drop-shadow-[0_0_8px_rgba(45,212,191,0.5)]">
            {oee}%
          </div>
        </div>

        <div className="text-right">
          <div className="text-[10px] text-slate-400 font-mono">STATUS LINI</div>
          <div className="text-xs font-black text-emerald-400 flex items-center gap-1.5 justify-end">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>RUNNING</span>
          </div>
        </div>
      </div>

      {/* 3 Sub-Factor Bars */}
      <div className="space-y-2 pt-1 text-xs">
        <div>
          <div className="flex justify-between font-bold text-slate-700 text-[11px] mb-0.5">
            <span>Availability (Kesiapan Mesin)</span>
            <span className="font-mono">{availability}%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(100, availability)}%` }} />
          </div>
        </div>

        <div>
          <div className="flex justify-between font-bold text-slate-700 text-[11px] mb-0.5">
            <span>Performance (Kecepatan Siklus)</span>
            <span className="font-mono">{performance}%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${Math.min(100, performance)}%` }} />
          </div>
        </div>

        <div>
          <div className="flex justify-between font-bold text-slate-700 text-[11px] mb-0.5">
            <span>Quality (Tingkat Kualitas Part)</span>
            <span className="font-mono">{quality}%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, quality)}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 3. AlarmBanner
 * Industrial alert flashing banner with Acknowledge button
 */
export function AlarmBanner({
  id,
  severity = 'WARNING', // 'INFO' | 'WARNING' | 'CRITICAL'
  title = 'Peringatan Parameter Mesin',
  message = 'Suhu motor melebihi batas operasional normal (78°C).',
  onAcknowledge
}) {
  const [acknowledged, setAcknowledged] = useState(false);

  const styleMap = {
    INFO: {
      bg: 'bg-blue-50 border-blue-300 text-blue-900',
      iconBg: 'bg-blue-200 text-blue-800',
      btn: 'bg-blue-600 hover:bg-blue-700 text-white'
    },
    WARNING: {
      bg: 'bg-amber-50 border-amber-300 text-amber-900',
      iconBg: 'bg-amber-200 text-amber-800',
      btn: 'bg-amber-600 hover:bg-amber-700 text-white'
    },
    CRITICAL: {
      bg: 'bg-rose-50 border-rose-300 text-rose-900',
      iconBg: 'bg-rose-200 text-rose-800',
      btn: 'bg-rose-600 hover:bg-rose-700 text-white'
    }
  }[severity] || {
    bg: 'bg-amber-50 border-amber-300 text-amber-900',
    iconBg: 'bg-amber-200 text-amber-800',
    btn: 'bg-amber-600 hover:bg-amber-700 text-white'
  };

  const handleAck = () => {
    setAcknowledged(true);
    if (onAcknowledge) onAcknowledge();
  };

  return (
    <div className={`w-full p-3.5 rounded-2xl border shadow-xs transition-all font-sans ${styleMap.bg} ${
      !acknowledged && severity === 'CRITICAL' ? 'animate-pulse' : ''
    }`}>
      <div className="flex items-start gap-3">
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${styleMap.iconBg}`}>
          <AlertTriangle className="w-4 h-4" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-extrabold uppercase tracking-wide">{title}</span>
            <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-md bg-white/70">
              {severity}
            </span>
          </div>
          <p className="text-xs mt-0.5 opacity-90 leading-relaxed font-medium">{message}</p>
        </div>
      </div>

      {!acknowledged ? (
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={handleAck}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95 ${styleMap.btn}`}
          >
            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Acknowledge Alarm</span>
          </button>
        </div>
      ) : (
        <div className="mt-2 text-right text-[11px] font-bold opacity-75 flex items-center justify-end gap-1">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Alarm telah dikonfirmasi oleh operator</span>
        </div>
      )}
    </div>
  );
}

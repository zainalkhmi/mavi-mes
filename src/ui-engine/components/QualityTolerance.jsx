/**
 * QualityTolerance.jsx
 * Mobile & Tablet friendly dimensional quality inspection widget for Gluestack
 * Evaluates live measurements against Nominal, USL (Upper Spec), and LSL (Lower Spec).
 */

import React, { useState, useEffect, useMemo } from 'react';
import { CheckCircle2, AlertTriangle, ArrowDown, ArrowUp, Ruler } from 'lucide-react';

export function QualityTolerance({
  id,
  label = 'Pemeriksaan Dimensi Part',
  nominal = 25.0,
  usl = 25.05,
  lsl = 24.95,
  unit = 'mm',
  defaultValue = '',
  value: controlledValue,
  step = 0.01,
  onChange,
  onPass,
  onFail,
  required = false
}) {
  const [internalValue, setInternalValue] = useState(
    controlledValue !== undefined ? controlledValue : defaultValue
  );

  useEffect(() => {
    if (controlledValue !== undefined) {
      setInternalValue(controlledValue);
    }
  }, [controlledValue]);

  const numVal = parseFloat(internalValue);
  const hasValue = !isNaN(numVal) && internalValue !== '';

  const status = useMemo(() => {
    if (!hasValue) return 'PENDING';
    if (numVal >= lsl && numVal <= usl) return 'PASS';
    if (numVal < lsl) return 'UNDER';
    return 'OVER';
  }, [hasValue, numVal, lsl, usl]);

  // Deviation percentage relative to tolerance range for visualization
  const gaugePercent = useMemo(() => {
    if (!hasValue) return 50;
    const range = usl - lsl;
    if (range <= 0) return 50;
    const pct = ((numVal - lsl) / range) * 100;
    return Math.max(0, Math.min(100, pct));
  }, [hasValue, numVal, lsl, usl]);

  const handleChange = (newVal) => {
    setInternalValue(newVal);
    const parsed = parseFloat(newVal);
    if (onChange) onChange(newVal);

    if (!isNaN(parsed) && newVal !== '') {
      if (parsed >= lsl && parsed <= usl) {
        if (onPass) onPass(parsed);
      } else {
        if (onFail) onFail(parsed);
      }
    }
  };

  const handleQuickNudge = (delta) => {
    const base = hasValue ? numVal : nominal;
    const nextVal = (Math.round((base + delta) * 1000) / 1000).toFixed(3);
    handleChange(nextVal);
  };

  return (
    <div className="w-full p-4 bg-white rounded-2xl border border-slate-200/90 shadow-xs space-y-3 font-sans">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0 border border-teal-100">
            <Ruler className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-extrabold text-slate-800 truncate">
              {label} {required && <span className="text-rose-500">*</span>}
            </div>
            <div className="text-[11px] text-slate-500 font-medium">
              Nominal: <strong className="text-slate-700">{nominal} {unit}</strong> (LSL: {lsl} / USL: {usl})
            </div>
          </div>
        </div>

        {/* Status Badge */}
        {hasValue && (
          <div className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shrink-0 ${
            status === 'PASS' 
              ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
              : status === 'UNDER'
              ? 'bg-amber-100 text-amber-700 border border-amber-300'
              : 'bg-rose-100 text-rose-700 border border-rose-300'
          }`}>
            {status === 'PASS' && <CheckCircle2 className="w-3 h-3" />}
            {status === 'UNDER' && <ArrowDown className="w-3 h-3" />}
            {status === 'OVER' && <ArrowUp className="w-3 h-3" />}
            <span>{status === 'PASS' ? 'IN TOLERANCE' : status === 'UNDER' ? 'UNDER SPEC' : 'OVER SPEC'}</span>
          </div>
        )}
      </div>

      {/* Input Row & Quick Adjust Buttons */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => handleQuickNudge(-step)}
          className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 font-black text-sm flex items-center justify-center transition-all cursor-pointer border border-slate-200"
          title="Kurangi"
        >
          -
        </button>

        <div className="relative flex-1">
          <input
            type="number"
            step={step}
            value={internalValue}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={`Target: ${nominal} ${unit}`}
            className={`w-full h-10 px-3 pr-10 text-center font-mono font-bold text-sm rounded-xl outline-none transition-all border ${
              !hasValue 
                ? 'border-slate-300 bg-white text-slate-800 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20'
                : status === 'PASS'
                ? 'border-emerald-500 bg-emerald-50/50 text-emerald-900 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20'
                : 'border-rose-500 bg-rose-50/50 text-rose-900 focus:border-rose-600 focus:ring-2 focus:ring-rose-500/20'
            }`}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 pointer-events-none">
            {unit}
          </span>
        </div>

        <button
          type="button"
          onClick={() => handleQuickNudge(step)}
          className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 font-black text-sm flex items-center justify-center transition-all cursor-pointer border border-slate-200"
          title="Tambah"
        >
          +
        </button>
      </div>

      {/* Visual Tolerance Bar (LSL | Nominal | USL) */}
      <div className="space-y-1 pt-1">
        <div className="relative h-2.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200 flex">
          {/* Under Zone */}
          <div className="w-1/4 bg-amber-200/70" title="Zona Under Spec" />
          {/* Safe Zone */}
          <div className="w-2/4 bg-emerald-300/80" title="Zona In Spec" />
          {/* Over Zone */}
          <div className="w-1/4 bg-rose-200/70" title="Zona Over Spec" />

          {/* Current Needle Marker */}
          {hasValue && (
            <div
              className={`absolute top-0 bottom-0 w-2 -ml-1 rounded-full shadow-md transition-all duration-200 ${
                status === 'PASS' ? 'bg-emerald-600 ring-2 ring-white' : 'bg-rose-600 ring-2 ring-white'
              }`}
              style={{ left: `${gaugePercent}%` }}
            />
          )}
        </div>

        <div className="flex justify-between text-[10px] text-slate-400 font-semibold px-0.5 font-mono">
          <span>{lsl}</span>
          <span className="text-slate-600 font-bold">{nominal}</span>
          <span>{usl}</span>
        </div>
      </div>
    </div>
  );
}
export default QualityTolerance;

/**
 * MetrologyWidget.jsx
 * Precision workshop metrology instruments digital twin for Gluestack
 * Supports: MICROMETER, TORQUE_WRENCH, WEIGHING_SCALE, ROUGHNESS_TESTER, DIAL_HEIGHT_GAUGE
 */

import React, { useState, useEffect } from 'react';
import { Ruler, Scale, Gauge, Activity, CheckCircle2, RotateCcw, Bluetooth, Sparkles } from 'lucide-react';

export function MetrologyWidget({
  id,
  instrumentType = 'MICROMETER', // 'MICROMETER' | 'TORQUE_WRENCH' | 'WEIGHING_SCALE' | 'ROUGHNESS_TESTER' | 'DIAL_HEIGHT_GAUGE'
  label,
  targetValue = 25.0,
  tolerance = 0.05,
  unit,
  value: controlledValue,
  onChange,
  onCapture,
  isConnected = true
}) {
  // Determine defaults by instrument type
  const config = {
    MICROMETER: {
      defaultLabel: 'Mikrometer Luar Digital (0-25mm)',
      defaultUnit: 'mm',
      step: 0.001,
      min: 0,
      max: 25.0,
      precision: 3,
      icon: Ruler,
      color: '#0284c7'
    },
    TORQUE_WRENCH: {
      defaultLabel: 'Kunci Torsi Digital (Torque Wrench)',
      defaultUnit: 'Nm',
      step: 0.5,
      min: 0,
      max: 120.0,
      precision: 1,
      icon: Gauge,
      color: '#f59e0b'
    },
    WEIGHING_SCALE: {
      defaultLabel: 'Timbangan Presisi Digital (Weighing Scale)',
      defaultUnit: 'g',
      step: 0.1,
      min: 0,
      max: 5000.0,
      precision: 2,
      icon: Scale,
      color: '#10b981'
    },
    ROUGHNESS_TESTER: {
      defaultLabel: 'Surface Roughness Tester (Ra)',
      defaultUnit: 'μm',
      step: 0.01,
      min: 0,
      max: 12.5,
      precision: 2,
      icon: Activity,
      color: '#8b5cf6'
    },
    DIAL_HEIGHT_GAUGE: {
      defaultLabel: 'Dial Height Gauge',
      defaultUnit: 'mm',
      step: 0.01,
      min: 0,
      max: 300.0,
      precision: 2,
      icon: Ruler,
      color: '#06b6d4'
    },
    VERNIER_CALIPER: {
      defaultLabel: 'Jangka Sorong Digital (Caliper 0-150mm)',
      defaultUnit: 'mm',
      step: 0.01,
      min: 0,
      max: 150.0,
      precision: 2,
      icon: Ruler,
      color: '#3b82f6'
    },
    THREAD_GAUGE: {
      defaultLabel: 'Alat Ukur Ulir (Thread Pitch & Plug Gauge)',
      defaultUnit: 'mm',
      step: 0.05,
      min: 0,
      max: 50.0,
      precision: 2,
      icon: Gauge,
      color: '#8b5cf6'
    }
  }[instrumentType] || {
    defaultLabel: 'Alat Ukur Digital',
    defaultUnit: 'mm',
    step: 0.01,
    min: 0,
    max: 100,
    precision: 2,
    icon: Ruler,
    color: '#0284c7'
  };

  const activeUnit = unit || config.defaultUnit;
  const activeLabel = label || config.defaultLabel;
  const IconComponent = config.icon;

  const [currentVal, setCurrentVal] = useState(
    controlledValue !== undefined ? Number(controlledValue) : targetValue
  );
  const [isStable, setIsStable] = useState(true);

  useEffect(() => {
    if (controlledValue !== undefined) {
      setCurrentVal(Number(controlledValue));
    }
  }, [controlledValue]);

  const handleValChange = (val) => {
    const clamped = Math.max(config.min, Math.min(config.max, Number(val)));
    setCurrentVal(clamped);
    if (onChange) onChange(clamped);
  };

  const handleNudge = (delta) => {
    const next = Number((currentVal + delta).toFixed(config.precision));
    handleValChange(next);
  };

  const handleSimulateCapture = () => {
    // Generate realistic measurement around target
    const randomVariation = (Math.random() - 0.5) * (tolerance * 1.5);
    const measured = Number((targetValue + randomVariation).toFixed(config.precision));
    setCurrentVal(measured);
    setIsStable(true);
    if (onChange) onChange(measured);
    const isPass = Math.abs(measured - targetValue) <= tolerance;
    if (onCapture) onCapture({
      instrument: instrumentType,
      value: measured,
      status: isPass ? 'PASS' : 'FAIL',
      unit: config.defaultUnit
    });
  };

  const isWithinTolerance = Math.abs(currentVal - targetValue) <= tolerance;

  // Torque progress if torque wrench
  const torquePct = instrumentType === 'TORQUE_WRENCH'
    ? Math.min(100, Math.round((currentVal / targetValue) * 100))
    : 0;

  return (
    <div className="w-full p-4 bg-white rounded-2xl border border-slate-200/90 shadow-xs space-y-3.5 font-sans">
      {/* Header with connection badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <div 
            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border"
            style={{ backgroundColor: `${config.color}15`, borderColor: `${config.color}30`, color: config.color }}
          >
            <IconComponent className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-extrabold text-slate-800 truncate">{activeLabel}</div>
            <div className="text-[11px] text-slate-500 font-medium">
              Target: <strong className="text-slate-700">{targetValue} ± {tolerance} {activeUnit}</strong>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Bluetooth className="w-2.5 h-2.5" />
            <span>ONLINE</span>
          </span>
        </div>
      </div>

      {/* Digital LED Screen Display */}
      <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 shadow-inner flex flex-col items-center justify-center relative overflow-hidden">
        {/* Subtle grid pattern background */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:8px_8px]" />

        <div className="w-full flex items-center justify-between text-[10px] text-slate-400 font-mono mb-1 z-10">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            {isStable ? 'STABLE' : 'MEASURING...'}
          </span>
          <span className="font-bold text-slate-300">CALIBRATED</span>
        </div>

        {/* Big Digital Numbers */}
        <div className="text-3xl font-black font-mono tracking-tight text-teal-400 drop-shadow-[0_0_12px_rgba(45,212,191,0.5)] z-10">
          {currentVal.toFixed(config.precision)}
          <span className="text-sm ml-1.5 font-bold text-slate-400 font-sans">{activeUnit}</span>
        </div>

        {/* Live Status indicator */}
        <div className="mt-1 z-10 flex items-center gap-1">
          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
            isWithinTolerance ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400 border border-rose-800'
          }`}>
            {isWithinTolerance ? '✓ IN SPEC' : '⚠ OUT OF SPEC'}
          </span>
        </div>
      </div>

      {/* Torque Wrench Progress Bar (if applicable) */}
      {instrumentType === 'TORQUE_WRENCH' && (
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] font-bold text-slate-600">
            <span>Beban Torsi: {torquePct}%</span>
            <span>Target: {targetValue} Nm</span>
          </div>
          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200 relative">
            <div 
              className={`h-full transition-all duration-150 ${
                torquePct >= 100 ? 'bg-emerald-500' : torquePct >= 80 ? 'bg-amber-500' : 'bg-blue-500'
              }`}
              style={{ width: `${Math.min(100, torquePct)}%` }}
            />
          </div>
        </div>
      )}

      {/* Action Buttons: Fine Nudge & Capture Simulator */}
      <div className="flex items-center gap-2 pt-1">
        <button
          type="button"
          onClick={() => handleNudge(-config.step)}
          className="px-3 py-2 bg-slate-100 hover:bg-slate-200 active:scale-95 rounded-xl text-xs font-black text-slate-700 border border-slate-200 transition-all cursor-pointer"
        >
          -{config.step}
        </button>

        <button
          type="button"
          onClick={() => handleNudge(config.step)}
          className="px-3 py-2 bg-slate-100 hover:bg-slate-200 active:scale-95 rounded-xl text-xs font-black text-slate-700 border border-slate-200 transition-all cursor-pointer"
        >
          +{config.step}
        </button>

        <button
          type="button"
          onClick={handleSimulateCapture}
          className="flex-1 py-2 px-3 bg-teal-600 hover:bg-teal-700 active:scale-98 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Ambil Nilai Ukur</span>
        </button>
      </div>
    </div>
  );
}
export default MetrologyWidget;

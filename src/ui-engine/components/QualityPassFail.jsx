/**
 * QualityPassFail.jsx
 * Tactile Pass/Fail inspection decision widget with defect reason picker for Gluestack
 */

import React, { useState, useEffect } from 'react';
import { Check, X, AlertCircle, ChevronDown } from 'lucide-react';

const DEFAULT_DEFECT_REASONS = [
  'Cacat Dimensi (Out of Tolerance)',
  'Goresan / Baret Permukaan',
  'Porositas / Rongga Udara',
  'Burrs / Sisa Gram Pemotongan',
  'Warna / Finishing Tidak Rata',
  'Part Bengkok / Deformasi',
  'Kontaminasi Oli / Debu',
  'Lainnya (Tuliskan Catatan)'
];

export function QualityPassFail({
  id,
  label = 'Keputusan Kualitas Part (Pass / Fail)',
  value: controlledValue,
  defectReasons = DEFAULT_DEFECT_REASONS,
  onChange,
  onPass,
  onFail,
  required = false
}) {
  const [selectedDecision, setSelectedDecision] = useState(controlledValue || null);
  const [selectedReason, setSelectedReason] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (controlledValue !== undefined) {
      setSelectedDecision(controlledValue);
    }
  }, [controlledValue]);

  const handleDecision = (decision) => {
    setSelectedDecision(decision);
    if (onChange) {
      onChange({
        decision,
        status: decision,
        reason: decision === 'FAIL' ? selectedReason : null,
        defectReason: decision === 'FAIL' ? selectedReason : null,
        notes: decision === 'FAIL' ? notes : null,
        timestamp: new Date().toISOString()
      });
    }

    if (decision === 'PASS') {
      setSelectedReason('');
      if (onPass) onPass();
    } else if (decision === 'FAIL') {
      const defaultReason = selectedReason || defectReasons[0];
      if (!selectedReason && defectReasons.length > 0) {
        setSelectedReason(defaultReason);
      }
      if (onFail) onFail({ defectReason: defaultReason });
    }
  };

  const handleReasonChange = (reason) => {
    setSelectedReason(reason);
    if (onChange) {
      onChange({
        decision: 'FAIL',
        status: 'FAIL',
        reason,
        defectReason: reason,
        notes,
        timestamp: new Date().toISOString()
      });
    }
  };

  const handleNotesChange = (txt) => {
    setNotes(txt);
    if (onChange) {
      onChange({
        decision: 'FAIL',
        status: 'FAIL',
        reason: selectedReason,
        defectReason: selectedReason,
        notes: txt,
        timestamp: new Date().toISOString()
      });
    }
  };

  return (
    <div className="w-full p-4 bg-white rounded-2xl border border-slate-200/90 shadow-xs space-y-3 font-sans">
      <div className="flex items-center justify-between">
        <div className="text-xs font-extrabold text-slate-800">
          {label} {required && <span className="text-rose-500">*</span>}
        </div>
        {selectedDecision && (
          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
            selectedDecision === 'PASS' 
              ? 'bg-emerald-100 text-emerald-700 border border-emerald-300' 
              : 'bg-rose-100 text-rose-700 border border-rose-300'
          }`}>
            {selectedDecision === 'PASS' ? 'LULUS (OK)' : 'REJECT (NG)'}
          </span>
        )}
      </div>

      {/* Dual Big Tactile Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => handleDecision('PASS')}
          className={`py-3.5 px-4 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98 border shadow-xs ${
            selectedDecision === 'PASS'
              ? 'bg-emerald-600 border-emerald-600 text-white shadow-emerald-500/20 shadow-md ring-2 ring-emerald-500/30'
              : 'bg-white border-slate-200 text-emerald-600 hover:bg-emerald-50/50 hover:border-emerald-300'
          }`}
        >
          <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
            selectedDecision === 'PASS' ? 'bg-white text-emerald-700' : 'bg-emerald-100 text-emerald-600'
          }`}>
            <Check className="w-3.5 h-3.5 stroke-[3]" />
          </div>
          <span>PASS (OK)</span>
        </button>

        <button
          type="button"
          onClick={() => handleDecision('FAIL')}
          className={`py-3.5 px-4 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98 border shadow-xs ${
            selectedDecision === 'FAIL'
              ? 'bg-rose-600 border-rose-600 text-white shadow-rose-500/20 shadow-md ring-2 ring-rose-500/30'
              : 'bg-white border-slate-200 text-rose-600 hover:bg-rose-50/50 hover:border-rose-300'
          }`}
        >
          <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
            selectedDecision === 'FAIL' ? 'bg-white text-rose-700' : 'bg-rose-100 text-rose-600'
          }`}>
            <X className="w-3.5 h-3.5 stroke-[3]" />
          </div>
          <span>FAIL (NG)</span>
        </button>
      </div>

      {/* Expanded Defect Reason Drawer if FAIL */}
      {selectedDecision === 'FAIL' && (
        <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-xl space-y-2.5 animate-in fade-in-50 duration-150">
          <div className="flex items-center gap-1.5 text-xs font-bold text-rose-800">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Pilih Jenis Cacat / Defect:</span>
          </div>

          <div className="relative">
            <select
              value={selectedReason}
              onChange={(e) => handleReasonChange(e.target.value)}
              className="w-full p-2.5 bg-white border border-rose-300 rounded-xl text-xs font-semibold text-slate-800 appearance-none pr-8 focus:outline-none focus:ring-2 focus:ring-rose-500 shadow-2xs cursor-pointer"
            >
              {defectReasons.map((r, i) => (
                <option key={i} value={r}>{r}</option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <input
            type="text"
            value={notes}
            onChange={(e) => handleNotesChange(e.target.value)}
            placeholder="Catatan tambahan teknisi (opsional)..."
            className="w-full p-2 bg-white border border-rose-200 rounded-xl text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-400"
          />
        </div>
      )}
    </div>
  );
}
export default QualityPassFail;

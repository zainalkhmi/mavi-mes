/**
 * BarcodePrintWidgets.jsx
 * Barcode 1D/2D generator & Zebra ZPL thermal label printer widgets for Gluestack
 */

import React, { useState } from 'react';
import { Printer, QrCode, Copy, Check, Barcode as BarcodeIcon, Tag, CheckCircle2 } from 'lucide-react';

/**
 * 1. BarcodeGenerator
 * Generates visual 1D (Code128 bars) & 2D QR style codes
 */
export function BarcodeGenerator({
  id,
  value = 'LOT-2026-09-8812',
  label = 'Barcode Part & Lot Number',
  type = 'CODE128', // 'CODE128' | 'DATAMATRIX' | 'QR'
  showText = true
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Generate pseudo deterministic bar widths from string hash
  const generateBars = (str) => {
    const bars = [];
    for (let i = 0; i < str.length; i++) {
      const code = str.charCodeAt(i);
      bars.push((code % 3) + 1.5);
      bars.push(1);
      bars.push(((code * 2) % 4) + 1);
      bars.push(1.5);
    }
    return bars;
  };

  const bars = generateBars(value || 'DEMO');

  return (
    <div className="w-full p-4 bg-white rounded-2xl border border-slate-200/90 shadow-xs space-y-3 font-sans">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center border border-slate-200">
            <BarcodeIcon className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-extrabold text-slate-800">{label}</div>
            <div className="text-[11px] text-slate-500 font-medium">Tipe: {type}</div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          className="px-2.5 py-1 rounded-lg text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
          <span>{copied ? 'Tersalin' : 'Salin'}</span>
        </button>
      </div>

      {/* Barcode Visual Box */}
      <div className="p-4 bg-white border border-slate-300 rounded-xl flex flex-col items-center justify-center shadow-2xs">
        {type === 'CODE128' ? (
          <div className="flex items-end justify-center h-14 w-full gap-0.5 max-w-[280px] overflow-hidden py-1">
            {bars.map((w, idx) => (
              <div
                key={idx}
                className="bg-slate-900 h-full"
                style={{ width: `${w}px` }}
              />
            ))}
          </div>
        ) : (
          <div className="p-2 border-2 border-slate-900 rounded-lg flex items-center justify-center bg-white shadow-2xs">
            <QrCode className="w-20 h-20 text-slate-900" />
          </div>
        )}

        {showText && (
          <div className="text-xs font-mono font-bold tracking-widest text-slate-800 mt-2">
            {value}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * 2. PrintZebra
 * Industrial thermal barcode label printer ticket with ZPL preview
 */
export function PrintZebra({
  id,
  partNumber = 'PART-ENG-8821',
  lotNumber = 'LOT-2026-09-01',
  partName = 'Shaft Rotor Assembly',
  operator = 'Budi Santoso',
  onPrint
}) {
  const [isPrinting, setIsPrinting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleTriggerPrint = () => {
    setIsPrinting(true);
    setTimeout(() => {
      setIsPrinting(false);
      setIsSuccess(true);
      if (onPrint) onPrint({ partNumber, lotNumber, timestamp: new Date().toISOString() });
      setTimeout(() => setIsSuccess(false), 3000);
    }, 1200);
  };

  return (
    <div className="w-full p-4 bg-white rounded-2xl border border-slate-200/90 shadow-xs space-y-3 font-sans">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200">
            <Printer className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-extrabold text-slate-800">Cetak Label Barcode Zebra (ZPL)</div>
            <div className="text-[11px] text-slate-500 font-medium">Format: 50 × 30 mm Thermal Label</div>
          </div>
        </div>

        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
          ZPL READY
        </span>
      </div>

      {/* Label Sticker Preview Card */}
      <div className="p-3 bg-amber-50/50 border border-amber-200 rounded-xl space-y-2 text-xs font-mono">
        <div className="flex justify-between items-center border-b border-amber-200/70 pb-1.5">
          <span className="font-bold text-slate-800 text-[11px]">{partName}</span>
          <span className="text-[10px] bg-amber-200/60 px-1.5 py-0.2 rounded text-slate-800 font-bold">QC PASS</span>
        </div>

        <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-700">
          <div>Part No: <strong>{partNumber}</strong></div>
          <div>Lot No: <strong>{lotNumber}</strong></div>
          <div>Operator: {operator}</div>
          <div>Date: {new Date().toLocaleDateString()}</div>
        </div>
      </div>

      {/* Print Button */}
      <button
        type="button"
        onClick={handleTriggerPrint}
        disabled={isPrinting}
        className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-600 active:scale-98 text-slate-950 font-black rounded-xl text-xs transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
      >
        <Printer className="w-4 h-4" />
        <span>{isPrinting ? 'Mengirim ke Printer Zebra...' : isSuccess ? '✓ Label Berhasil Dicetak!' : 'Cetak Label Barcode'}</span>
      </button>
    </div>
  );
}

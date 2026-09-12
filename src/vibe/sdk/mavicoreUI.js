// MaviCore UI Component Library for Sandbox & Device Runner
// Exports all major App Builder widgets as clean, reusable, touch-friendly React components

export const MAVICORE_UI_VIRTUAL_FILE = `import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Play, Square, RotateCcw, AlertTriangle, CheckCircle2, XCircle, Gauge, Activity, 
  Cpu, Thermometer, ShieldCheck, Camera, Barcode, Eye, FileSpreadsheet, Layers, 
  Sliders, Database, ArrowRight, ArrowLeft, Trash2, Check, RefreshCw, Wifi, 
  WifiOff, Clock, User, Users, Zap, ChevronDown, ChevronRight, ChevronUp, ChevronLeft,
  X, Sparkles, Droplet, Volume2, Settings, Lock, Unlock, Hash, Calendar, Search, 
  Filter, Plus, Minus, Edit, Edit2, Edit3, History, Save, Download, Upload, Share2,
  Package, Box, Truck, Factory, Wrench, Clipboard, ClipboardCheck, ClipboardList,
  QrCode, Power, Bell, FileText, BarChart2, PieChart, LineChart, FilePlus, Globe,
  Smartphone, Pause, RotateCw, TrendingUp, TrendingDown, Info, ShieldAlert, CheckSquare,
  AlertCircle, HelpCircle
} from 'lucide-react';

/* =========================================================================
   1. TOUCHSCREEN INPUTS & INTERFACE WIDGETS
   ========================================================================= */

/**
 * Industrial Touchscreen Numpad
 * Specially designed for shopfloor operators wearing gloves.
 */
export function Numpad({ value = '', onChange, onEnter, max = 999999, allowDecimal = true, title = 'NUMPAD INPUT' }) {
  const [internalVal, setInternalVal] = useState(String(value || ''));

  useEffect(() => {
    setInternalVal(String(value || ''));
  }, [value]);

  const handlePress = (key) => {
    let next = internalVal;
    if (key === 'C') {
      next = '';
    } else if (key === 'DEL') {
      next = next.slice(0, -1);
    } else if (key === '.') {
      if (allowDecimal && !next.includes('.')) {
        next = next ? next + '.' : '0.';
      }
    } else {
      if (next === '0' && key !== '.') next = key;
      else next = next + key;
    }
    if (next.length <= 10) {
      setInternalVal(next);
      if (onChange) onChange(next);
    }
  };

  const handleEnter = () => {
    if (onEnter) onEnter(internalVal);
  };

  const keys = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['C', '0', allowDecimal ? '.' : 'DEL']
  ];

  return (
    <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-4 max-w-xs w-full shadow-2xl font-sans select-none text-white">
      {title && (
        <div className="text-[10px] font-black text-indigo-400 uppercase tracking-wider mb-2 flex justify-between items-center">
          <span>{title}</span>
          <span className="text-slate-500 font-mono">GLOVE TOUCH</span>
        </div>
      )}
      
      {/* Display Screen */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 mb-3 text-right">
        <div className="text-2xl font-mono font-black text-emerald-400 tracking-wider truncate min-h-[36px] flex items-center justify-end">
          {internalVal || <span className="text-slate-600">0</span>}
        </div>
      </div>

      {/* Keypad Grid */}
      <div className="grid grid-cols-3 gap-2 mb-2">
        {keys.map((row, rIdx) => (
          <React.Fragment key={rIdx}>
            {row.map(k => (
              <button
                key={k}
                type="button"
                onClick={() => handlePress(k)}
                className={'h-12 rounded-xl font-black text-base transition active:scale-95 flex items-center justify-center ' + (
                  k === 'C' ? 'bg-rose-950/60 text-rose-300 border border-rose-800/80 hover:bg-rose-900' :
                  k === 'DEL' ? 'bg-amber-950/60 text-amber-300 border border-amber-800/80 hover:bg-amber-900' :
                  'bg-slate-800 text-white border border-slate-700 hover:bg-slate-700 hover:border-slate-600'
                )}
              >
                {k}
              </button>
            ))}
          </React.Fragment>
        ))}
      </div>

      {/* Action Row */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => handlePress('DEL')}
          className="h-11 rounded-xl font-black text-xs bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 active:scale-95 transition"
        >
          HAPUS (DEL)
        </button>
        <button
          type="button"
          onClick={handleEnter}
          className="h-11 rounded-xl font-black text-xs bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/25 active:scale-95 transition"
        >
          ENTER (OK)
        </button>
      </div>
    </div>
  );
}

/**
 * Full Touchscreen QWERTY Keyboard
 */
export function KeyboardPro({ value = '', onChange, onEnter, placeholder = 'Ketik di sini...' }) {
  const [internalVal, setInternalVal] = useState(value);
  const [caps, setCaps] = useState(false);

  useEffect(() => setInternalVal(value), [value]);

  const rows = [
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-'],
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['Z', 'X', 'C', 'V', 'B', 'N', 'M', '.', '_']
  ];

  const handleKey = (char) => {
    const c = caps ? char.toUpperCase() : char.toLowerCase();
    const next = internalVal + c;
    setInternalVal(next);
    if (onChange) onChange(next);
  };

  const handleBackspace = () => {
    const next = internalVal.slice(0, -1);
    setInternalVal(next);
    if (onChange) onChange(next);
  };

  const handleClear = () => {
    setInternalVal('');
    if (onChange) onChange('');
  };

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-2xl p-3 shadow-xl w-full max-w-xl select-none font-sans text-white">
      {/* Input Display */}
      <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl p-2.5 mb-3">
        <input 
          type="text" 
          value={internalVal} 
          placeholder={placeholder}
          readOnly
          className="bg-transparent flex-1 text-emerald-400 font-mono text-sm outline-none"
        />
        {internalVal && (
          <button type="button" onClick={handleClear} className="text-slate-500 hover:text-slate-300">
            <X size={14} />
          </button>
        )}
      </div>

      {/* Keyboard Grid */}
      <div className="space-y-1.5 mb-2">
        {rows.map((row, rIdx) => (
          <div key={rIdx} className="flex justify-center gap-1">
            {row.map(k => (
              <button
                key={k}
                type="button"
                onClick={() => handleKey(k)}
                className="h-10 px-3 rounded-lg bg-slate-800 border border-slate-700 text-xs font-bold text-white hover:bg-slate-700 active:scale-95 transition"
              >
                {caps ? k.toUpperCase() : k.toLowerCase()}
              </button>
            ))}
          </div>
        ))}
      </div>

      {/* Control Row */}
      <div className="flex justify-between items-center gap-2 pt-1 border-t border-slate-800">
        <button
          type="button"
          onClick={() => setCaps(!caps)}
          className={'px-4 py-2 rounded-lg text-xs font-bold transition ' + (caps ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300')}
        >
          CAPS
        </button>
        <button
          type="button"
          onClick={() => handleKey(' ')}
          className="flex-1 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs font-bold text-slate-300 hover:bg-slate-700 active:scale-95"
        >
          SPASI (SPACE)
        </button>
        <button
          type="button"
          onClick={handleBackspace}
          className="px-4 py-2 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 text-xs font-bold hover:bg-rose-900 active:scale-95"
        >
          DEL
        </button>
        <button
          type="button"
          onClick={() => onEnter && onEnter(internalVal)}
          className="px-5 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-black active:scale-95"
        >
          SELESAI
        </button>
      </div>
    </div>
  );
}

/**
 * Signature Pad for Operator & Supervisor Sign-off
 */
export function SignaturePad({ title = 'Tanda Tangan Operator', onSave, height = 140 }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  const startDraw = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
    const y = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#0f172a';
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasDrawn(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
    const y = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const endDraw = () => {
    setIsDrawing(false);
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    if (onSave) onSave(dataUrl);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm max-w-sm w-full font-sans">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-black text-slate-800 uppercase tracking-wider">{title}</span>
        {hasDrawn && <span className="text-[10px] text-emerald-600 font-bold">✓ Tertanda</span>}
      </div>
      <div className="border border-dashed border-slate-300 rounded-xl bg-slate-50 relative overflow-hidden touch-none mb-3">
        <canvas
          ref={canvasRef}
          width={320}
          height={height}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={endDraw}
          className="w-full h-full cursor-crosshair"
        />
        {!hasDrawn && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-xs text-slate-400 font-medium">
            Tanda tangan di sini dengan jari atau stylus
          </div>
        )}
      </div>
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={clear}
          className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition"
        >
          Bersihkan
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={!hasDrawn}
          className={'px-4 py-1.5 rounded-xl text-xs font-black text-white transition ' + (
            hasDrawn ? 'bg-gradient-to-r from-indigo-600 to-blue-600 shadow-md shadow-indigo-500/25 active:scale-95' : 'bg-slate-300 cursor-not-allowed'
          )}
        >
          Simpan TTD
        </button>
      </div>
    </div>
  );
}

/**
 * Industrial Heavy Toggle Switch
 */
export function BooleanToggle({ label = 'Machine Power', checked = false, onChange, activeColor = 'emerald' }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200 shadow-sm">
      <span className="text-xs font-black text-slate-900">{label}</span>
      <button
        type="button"
        onClick={() => onChange && onChange(!checked)}
        className={'w-14 h-7 rounded-full p-1 transition-colors duration-200 ease-in-out relative flex items-center ' + (
          checked ? 'bg-emerald-600' : 'bg-slate-300'
        )}
      >
        <div className={'w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-200 flex items-center justify-center text-[9px] font-black ' + (
          checked ? 'translate-x-7 text-emerald-600' : 'translate-x-0 text-slate-400'
        )}>
          {checked ? 'ON' : 'OFF'}
        </div>
      </button>
    </div>
  );
}

/* =========================================================================
   2. QUALITY & INSPECTION WIDGETS
   ========================================================================= */

/**
 * Quality Tolerance Visual Gauge
 * Shows Min, Nominal, Max with auto Pass/Fail detection.
 */
export function QualityTolerance({ nominal = 25.0, tolerance = 0.5, actual = 25.1, unit = 'mm', title = 'Dimension Check' }) {
  const min = +(nominal - tolerance).toFixed(3);
  const max = +(nominal + tolerance).toFixed(3);
  const isPass = actual >= min && actual <= max;
  const deviation = +(actual - nominal).toFixed(3);

  // Calculate needle percentage on bar (range min-20% to max+20%)
  const span = (max - min) * 1.5;
  const zeroPt = nominal - span / 2;
  const percent = Math.min(100, Math.max(0, ((actual - zeroPt) / span) * 100));

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-4 max-w-sm w-full font-sans">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-black text-slate-900 uppercase tracking-wider">{title}</span>
        <span className={'px-2.5 py-0.5 rounded-full text-[10px] font-black border ' + (
          isPass ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-rose-100 text-rose-800 border-rose-300'
        )}>
          {isPass ? 'PASS (OK)' : 'FAIL (OUT OF SPEC)'}
        </span>
      </div>

      <div className="flex justify-between items-baseline mb-3">
        <div>
          <span className="text-3xl font-black font-mono text-slate-900">{actual}</span>
          <span className="text-xs text-slate-500 ml-1 font-bold">{unit}</span>
        </div>
        <div className="text-right text-[10px] text-slate-500">
          Deviasi: <strong className={deviation > 0 ? 'text-amber-600' : 'text-indigo-600'}>{deviation > 0 ? '+' : ''}{deviation} {unit}</strong>
        </div>
      </div>

      {/* Visual Bar */}
      <div className="relative h-4 bg-slate-100 rounded-full overflow-hidden border border-slate-200 mb-2">
        {/* Target Zone */}
        <div className="absolute top-0 bottom-0 bg-emerald-300/60 left-[25%] right-[25%] border-x border-emerald-500" />
        {/* Needle Marker */}
        <div 
          className={'absolute top-0 bottom-0 w-2 rounded-full transform -translate-x-1/2 shadow-md transition-all duration-300 ' + (
            isPass ? 'bg-emerald-600' : 'bg-rose-600'
          )}
          style={{ left: percent + '%' }}
        />
      </div>

      <div className="flex justify-between text-[10px] text-slate-400 font-mono font-bold">
        <span>Min: {min}</span>
        <span className="text-slate-800">Nom: {nominal}</span>
        <span>Max: {max}</span>
      </div>
    </div>
  );
}

/**
 * Quality Inspection Checklist
 */
export function QualityChecklist({ items = [], onStatusChange, title = 'Inspection Items' }) {
  const [list, setList] = useState(items);

  useEffect(() => setList(items), [items]);

  const toggle = (id, status) => {
    const updated = list.map(i => i.id === id ? { ...i, status } : i);
    setList(updated);
    if (onStatusChange) onStatusChange(id, status, updated);
  };

  const passCount = list.filter(i => i.status === 'pass').length;
  const failCount = list.filter(i => i.status === 'fail').length;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-4 w-full font-sans">
      <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
        <div>
          <h4 className="text-sm font-black text-slate-900">{title}</h4>
          <span className="text-[10px] text-slate-500">Total {list.length} item pengujian</span>
        </div>
        <div className="flex gap-2">
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
            {passCount} Pass
          </span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-200">
            {failCount} Fail
          </span>
        </div>
      </div>

      <div className="space-y-2.5">
        {list.map(item => (
          <div key={item.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3">
            <div className="flex-1">
              <div className="text-xs font-bold text-slate-900">{item.text || item.title}</div>
              {item.standard && <div className="text-[10px] text-slate-500">Standar: {item.standard}</div>}
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => toggle(item.id, 'pass')}
                className={'px-3 py-1.5 rounded-lg text-xs font-black transition flex items-center gap-1 ' + (
                  item.status === 'pass' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                )}
              >
                <Check size={12} />
                <span>PASS</span>
              </button>
              <button
                type="button"
                onClick={() => toggle(item.id, 'fail')}
                className={'px-3 py-1.5 rounded-lg text-xs font-black transition flex items-center gap-1 ' + (
                  item.status === 'fail' ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                )}
              >
                <XCircle size={12} />
                <span>FAIL</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* =========================================================================
   3. METROLOGY & INDUSTRIAL MEASUREMENT WIDGETS
   ========================================================================= */

/**
 * Circular Dial Gauge Indicator (Analog + Digital)
 */
export function DialGauge({ value = 0, min = 0, max = 100, unit = 'mm', title = 'Dial Gauge' }) {
  const percent = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
  // Needle rotation from -120 deg to +120 deg
  const rotation = -120 + (percent / 100) * 240;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-4 max-w-xs w-full text-center font-sans">
      <div className="text-xs font-black text-slate-900 uppercase tracking-wider mb-2">{title}</div>
      <div className="relative w-36 h-36 mx-auto mb-2 flex items-center justify-center">
        {/* Outer Dial Circle */}
        <div className="absolute inset-0 rounded-full border-4 border-slate-800 bg-slate-900 shadow-inner flex items-center justify-center">
          {/* Tick marks */}
          <div className="w-28 h-28 rounded-full border border-dashed border-slate-700" />
        </div>
        {/* Needle */}
        <div 
          className="absolute w-1 bg-rose-500 origin-bottom rounded-full shadow-lg transition-transform duration-300"
          style={{ height: '54px', bottom: '50%', transform: 'rotate(' + rotation + 'deg)' }}
        />
        {/* Center Pivot */}
        <div className="w-5 h-5 rounded-full bg-slate-200 border-2 border-slate-800 z-10 shadow" />
      </div>
      <div className="text-2xl font-mono font-black text-slate-900">
        {value} <span className="text-xs font-sans text-slate-500 font-bold">{unit}</span>
      </div>
    </div>
  );
}

/**
 * Digital Caliper / Micrometer LCD Display
 */
export function DigitalCaliper({ value = 0.0, onZero, unit = 'mm', title = 'Digital Caliper' }) {
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-2xl p-4 max-w-sm w-full text-white font-sans shadow-xl">
      <div className="flex justify-between items-center mb-2">
        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-wider">{title}</span>
        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded-full">
          HIGH PRECISION
        </span>
      </div>
      
      {/* LCD Screen */}
      <div className="bg-[#b4c8a8] text-slate-950 rounded-xl p-3 mb-3 border-2 border-slate-700 shadow-inner flex justify-between items-baseline font-mono">
        <span className="text-xs font-bold text-slate-700">INC</span>
        <span className="text-3xl font-black tracking-wider">{Number(value).toFixed(2)}</span>
        <span className="text-sm font-black">{unit}</span>
      </div>

      <div className="flex justify-between items-center gap-2">
        <button
          type="button"
          onClick={onZero}
          className="flex-1 py-1.5 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 text-xs font-bold text-white transition active:scale-95"
        >
          ZERO / TARE
        </button>
        <div className="text-[10px] text-slate-400 font-mono">0.00 - 150.00 mm</div>
      </div>
    </div>
  );
}

/**
 * Barcode & QR Code Scanner Trigger Widget
 */
export function BarcodeScanner({ onScan, placeholder = 'Scan Barcode Part / Work Order' }) {
  const [manualCode, setManualCode] = useState('');

  const handleSimulatedScan = () => {
    const mock = 'LOT-' + Math.floor(100000 + Math.random() * 900000);
    setManualCode(mock);
    if (onScan) onScan(mock);
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualCode && onScan) onScan(manualCode);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-sm max-w-sm w-full font-sans">
      <div className="flex items-center gap-2 mb-2">
        <Barcode size={16} className="text-indigo-600" />
        <span className="text-xs font-black text-slate-900 uppercase tracking-wider">Barcode & QR Reader</span>
      </div>
      <form onSubmit={handleManualSubmit} className="flex gap-2">
        <input
          type="text"
          value={manualCode}
          onChange={e => setManualCode(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
        />
        <button
          type="button"
          onClick={handleSimulatedScan}
          className="px-3 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 text-white text-xs font-bold hover:from-indigo-500 hover:to-blue-500 active:scale-95 transition"
          title="Simulasikan Scan Kamera"
        >
          Scan
        </button>
      </form>
    </div>
  );
}

/* =========================================================================
   4. SCADA HMI & PROCESS EQUIPMENT WIDGETS
   ========================================================================= */

/**
 * Heavy Industrial START Button
 */
export function ScadaStartBtn({ onClick, disabled = false, label = 'START MACHINE' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-gradient-to-b from-emerald-500 to-emerald-700 text-white font-black text-sm tracking-wider uppercase border-b-4 border-emerald-900 shadow-xl shadow-emerald-500/30 hover:brightness-110 active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center gap-2"
    >
      <Play size={16} fill="white" />
      <span>{label}</span>
    </button>
  );
}

/**
 * Heavy Industrial STOP / Emergency Button
 */
export function ScadaStopBtn({ onClick, disabled = false, label = 'STOP / E-STOP' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-gradient-to-b from-rose-500 to-red-700 text-white font-black text-sm tracking-wider uppercase border-b-4 border-rose-950 shadow-xl shadow-rose-500/30 hover:brightness-110 active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center gap-2"
    >
      <Square size={16} fill="white" />
      <span>{label}</span>
    </button>
  );
}

/**
 * Process Tank with Fluid Level Animation
 */
export function ScadaTank({ level = 65, capacity = 1000, unit = 'Liter', title = 'Holding Tank A1' }) {
  const percent = Math.min(100, Math.max(0, level));
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-4 max-w-[200px] w-full text-center font-sans">
      <div className="text-xs font-black text-slate-800 mb-2 truncate">{title}</div>
      <div className="relative w-24 h-40 mx-auto rounded-3xl border-4 border-slate-800 bg-slate-100 overflow-hidden shadow-inner flex flex-col justify-end">
        {/* Liquid Fill */}
        <div 
          className="w-full bg-gradient-to-t from-sky-600 via-cyan-500 to-sky-400 transition-all duration-500 flex items-center justify-center"
          style={{ height: percent + '%' }}
        >
          <Droplet size={16} className="text-white/40 animate-pulse" />
        </div>
        {/* Markers */}
        <div className="absolute top-[20%] left-0 right-0 border-t border-dashed border-rose-400 opacity-60" />
        <div className="absolute bottom-[20%] left-0 right-0 border-t border-dashed border-amber-400 opacity-60" />
      </div>
      <div className="mt-2">
        <div className="text-lg font-black font-mono text-slate-900">{percent}%</div>
        <div className="text-[10px] text-slate-500 font-bold">{Math.round((percent / 100) * capacity)} / {capacity} {unit}</div>
      </div>
    </div>
  );
}

/**
 * PLC Heartbeat & Connection Status
 */
export function ScadaPlcStatus({ isOnline = true, scanTime = 12, ip = '192.168.1.10', name = 'Siemens S7-1500' }) {
  return (
    <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-3.5 shadow-md flex items-center justify-between gap-3 text-white font-sans max-w-sm w-full">
      <div className="flex items-center gap-2.5">
        <div className={'w-3 h-3 rounded-full animate-ping ' + (isOnline ? 'bg-emerald-500' : 'bg-rose-500')} />
        <div>
          <div className="text-xs font-black text-white">{name}</div>
          <div className="text-[10px] text-slate-400 font-mono">{ip}</div>
        </div>
      </div>
      <div className="text-right">
        <div className={'text-[10px] font-black uppercase px-2 py-0.5 rounded-full inline-block ' + (
          isOnline ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400 border border-rose-800'
        )}>
          {isOnline ? 'ONLINE' : 'OFFLINE'}
        </div>
        <div className="text-[10px] text-slate-400 font-mono mt-0.5">Scan: {scanTime}ms</div>
      </div>
    </div>
  );
}

/* =========================================================================
   5. MES METRICS, OEE, & ALARMS
   ========================================================================= */

/**
 * Vibrant Industrial KPI Card
 */
export function KPICard({ title = 'Metric', value = '0', unit = '', trend = '', color = 'indigo', icon: Icon = Activity }) {
  const colorStyles = {
    indigo: 'border-t-indigo-600 text-indigo-600 bg-indigo-50',
    sky: 'border-t-sky-500 text-sky-600 bg-sky-50',
    amber: 'border-t-amber-500 text-amber-600 bg-amber-50',
    emerald: 'border-t-emerald-500 text-emerald-600 bg-emerald-50',
    rose: 'border-t-rose-500 text-rose-600 bg-rose-50'
  };

  const style = colorStyles[color] || colorStyles.indigo;
  const SafeIcon = (typeof Icon === 'function' || (typeof Icon === 'object' && Icon !== null)) ? Icon : Activity;

  return (
    <div className={'bg-white rounded-2xl border border-slate-200 border-t-4 p-4 shadow-md font-sans ' + style.split(' ')[0]}>
      <div className="flex justify-between items-center mb-2">
        <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider">{title}</span>
        <div className={'w-7 h-7 rounded-xl flex items-center justify-center ' + style.split(' ')[2]}>
          {SafeIcon && typeof SafeIcon === 'function' ? (
            <SafeIcon size={14} className={style.split(' ')[1]} />
          ) : (
            <Activity size={14} className={style.split(' ')[1]} />
          )}
        </div>
      </div>
      <div className="flex items-baseline justify-between">
        <div>
          <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">{value}</span>
          {unit && <span className="text-xs text-slate-500 ml-1 font-bold">{unit}</span>}
        </div>
        {trend && (
          <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
            {trend}
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * Production Counter (Target vs Actual vs Defect)
 */
export function ScadaProdCounter({ target = 1000, actual = 850, defect = 12 }) {
  const percent = Math.min(100, Math.round((actual / (target || 1)) * 100));
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-4 w-full font-sans">
      <div className="flex justify-between items-center mb-3">
        <span className="text-xs font-black text-slate-900 uppercase tracking-wider">Production Output</span>
        <span className="text-xs font-black font-mono text-indigo-600">{percent}% of target</span>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center mb-3">
        <div className="p-2 rounded-xl bg-slate-50 border border-slate-200">
          <div className="text-[10px] font-bold text-slate-400">TARGET</div>
          <div className="text-lg font-black font-mono text-slate-900">{target}</div>
        </div>
        <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200">
          <div className="text-[10px] font-bold text-emerald-700">ACTUAL</div>
          <div className="text-lg font-black font-mono text-emerald-700">{actual}</div>
        </div>
        <div className="p-2 rounded-xl bg-rose-50 border border-rose-200">
          <div className="text-[10px] font-bold text-rose-700">DEFECT/NG</div>
          <div className="text-lg font-black font-mono text-rose-700">{defect}</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200">
        <div 
          className="h-full bg-gradient-to-r from-indigo-600 to-emerald-500 transition-all duration-300 rounded-full"
          style={{ width: percent + '%' }}
        />
      </div>
    </div>
  );
}

/**
 * Industrial Status Badge Pill
 */
export function StatusBadge({ status = 'RUNNING' }) {
  const map = {
    RUNNING: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    OPTIMAL: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    WARNING: 'bg-amber-100 text-amber-800 border-amber-300',
    WARN: 'bg-amber-100 text-amber-800 border-amber-300',
    DOWNTIME: 'bg-rose-100 text-rose-800 border-rose-300',
    DOWN: 'bg-rose-100 text-rose-800 border-rose-300',
    MAINTENANCE: 'bg-purple-100 text-purple-800 border-purple-300',
    IDLE: 'bg-slate-100 text-slate-700 border-slate-300'
  };

  const style = map[String(status).toUpperCase()] || map.IDLE;

  return (
    <span className={'px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ' + style}>
      {status}
    </span>
  );
}

/**
 * Telemetry Live Gauge
 */
export function TelemetryGauge({ title = 'Spindle Speed', value = 1450, unit = 'RPM', status = 'OPTIMAL' }) {
  return (
    <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between font-sans">
      <div>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{title}</span>
        <div className="text-lg font-mono font-black text-slate-900 mt-0.5">
          {value} <span className="text-[10px] font-sans text-slate-500 font-bold">{unit}</span>
        </div>
      </div>
      <StatusBadge status={status} />
    </div>
  );
}

/* =========================================================================
   6. UNIVERSAL UI BUILDING BLOCKS & COMPONENT ALIASES
   ========================================================================= */

export function Card({ children, className = '', ...props }) {
  return <div className={'bg-white rounded-2xl border border-slate-200 shadow-md p-4 ' + className} {...props}>{children}</div>;
}

export function CardHeader({ children, className = '', ...props }) {
  return <div className={'mb-3 flex justify-between items-center ' + className} {...props}>{children}</div>;
}

export function CardTitle({ children, className = '', ...props }) {
  return <h3 className={'text-sm font-black text-slate-900 uppercase tracking-wider ' + className} {...props}>{children}</h3>;
}

export function CardContent({ children, className = '', ...props }) {
  return <div className={'space-y-3 ' + className} {...props}>{children}</div>;
}

export function CardFooter({ children, className = '', ...props }) {
  return <div className={'mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-2 ' + className} {...props}>{children}</div>;
}

export function Badge({ children, variant = 'default', className = '', ...props }) {
  const vStyles = {
    default: 'bg-slate-100 text-slate-800',
    success: 'bg-emerald-100 text-emerald-800',
    warning: 'bg-amber-100 text-amber-800',
    danger: 'bg-rose-100 text-rose-800',
    info: 'bg-sky-100 text-sky-800'
  };
  return (
    <span className={'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ' + (vStyles[variant] || vStyles.default) + ' ' + className} {...props}>
      {children}
    </span>
  );
}

export function Button({ children, variant = 'default', className = '', onClick, ...props }) {
  const bStyles = {
    default: 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-500/20',
    destructive: 'bg-rose-600 text-white hover:bg-rose-700 shadow-rose-500/20',
    outline: 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50',
    secondary: 'bg-slate-800 text-white hover:bg-slate-700',
    ghost: 'bg-transparent text-slate-600 hover:bg-slate-100'
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className={'px-4 py-2 rounded-xl font-bold text-xs shadow-sm transition active:scale-95 flex items-center justify-center gap-1.5 ' + (bStyles[variant] || bStyles.default) + ' ' + className}
      {...props}
    >
      {children}
    </button>
  );
}

export function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-5 overflow-hidden">
        <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
          <h4 className="text-base font-black text-slate-900">{title}</h4>
          {onClose && (
            <button type="button" onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100">
              <X size={16} />
            </button>
          )}
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
}

export const Dialog = Modal;

// Universal UI Components
export function Input({ className = '', ...props }) {
  return <input className={'w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition ' + className} {...props} />;
}

export function Label({ children, className = '', ...props }) {
  return <label className={'block text-xs font-semibold text-slate-400 mb-1 ' + className} {...props}>{children}</label>;
}

export function Textarea({ className = '', ...props }) {
  return <textarea className={'w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition ' + className} {...props} />;
}

export function Switch({ checked = false, onCheckedChange, onChange, className = '' }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => { (onCheckedChange || onChange)?.(!checked); }}
      className={'w-10 h-5 flex items-center rounded-full p-0.5 transition duration-300 ' + (checked ? 'bg-indigo-600' : 'bg-slate-700') + ' ' + className}
    >
      <div className={'bg-white w-4 h-4 rounded-full shadow-md transform transition duration-300 ' + (checked ? 'translate-x-5' : 'translate-x-0')} />
    </button>
  );
}

export function Checkbox({ checked = false, onCheckedChange, onChange, className = '', ...props }) {
  return (
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => (onCheckedChange || onChange)?.(e.target.checked)}
      className={'w-4 h-4 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-900 ' + className}
      {...props}
    />
  );
}

export function Table({ children, className = '', ...props }) {
  return <div className="w-full overflow-x-auto"><table className={'w-full text-left text-xs text-slate-300 ' + className} {...props}>{children}</table></div>;
}
export function TableHeader({ children, className = '', ...props }) {
  return <thead className={'bg-slate-800/80 text-slate-400 font-bold uppercase tracking-wider text-[10px] ' + className} {...props}>{children}</thead>;
}
export function TableBody({ children, className = '', ...props }) {
  return <tbody className={'divide-y divide-slate-800 ' + className} {...props}>{children}</tbody>;
}
export function TableRow({ children, className = '', ...props }) {
  return <tr className={'hover:bg-slate-800/50 transition ' + className} {...props}>{children}</tr>;
}
export function TableHead({ children, className = '', ...props }) {
  return <th className={'px-3 py-2.5 ' + className} {...props}>{children}</th>;
}
export function TableCell({ children, className = '', ...props }) {
  return <td className={'px-3 py-2.5 ' + className} {...props}>{children}</td>;
}

export function Tabs({ defaultValue, value: controlledValue, onValueChange, children, className = '' }) {
  const [activeTab, setActiveTab] = useState(controlledValue || defaultValue || '');
  const currentTab = controlledValue !== undefined ? controlledValue : activeTab;
  const setTab = onValueChange || setActiveTab;
  return (
    <div className={'space-y-3 ' + className} data-active-tab={currentTab}>
      {React.Children.map(children, child => React.isValidElement(child) ? React.cloneElement(child, { activeTab: currentTab, setActiveTab: setTab }) : child)}
    </div>
  );
}
export function TabsList({ children, className = '', activeTab, setActiveTab }) {
  return (
    <div className={'inline-flex p-1 bg-slate-900 border border-slate-800 rounded-xl gap-1 ' + className}>
      {React.Children.map(children, child => React.isValidElement(child) ? React.cloneElement(child, { activeTab, setActiveTab }) : child)}
    </div>
  );
}
export function TabsTrigger({ value, children, className = '', activeTab, setActiveTab }) {
  const isActive = activeTab === value;
  return (
    <button
      type="button"
      onClick={() => setActiveTab && setActiveTab(value)}
      className={'px-3 py-1.5 text-xs font-bold rounded-lg transition ' + (isActive ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200') + ' ' + className}
    >
      {children}
    </button>
  );
}
export function TabsContent({ value, children, className = '', activeTab }) {
  if (activeTab !== value) return null;
  return <div className={className}>{children}</div>;
}

export function Select({ value, onChange, children, className = '' }) {
  return <select value={value} onChange={onChange} className={'px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 ' + className}>{children}</select>;
}
export function SelectTrigger({ children, className = '' }) { return <div className={className}>{children}</div>; }
export function SelectValue({ placeholder = 'Select...' }) { return <span>{placeholder}</span>; }
export function SelectContent({ children }) { return <>{children}</>; }
export function SelectItem({ value, children }) { return <option value={value}>{children}</option>; }

export function Progress({ value = 0, max = 100, className = '', barClassName = 'bg-indigo-500' }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className={'w-full h-2 bg-slate-800 rounded-full overflow-hidden ' + className}>
      <div className={'h-full transition-all duration-300 ' + barClassName} style={{ width: pct + '%' }} />
    </div>
  );
}

export function Alert({ children, variant = 'default', className = '', ...props }) {
  const v = variant === 'destructive' ? 'bg-rose-950/40 border-rose-800 text-rose-300' : 'bg-slate-900 border-slate-800 text-slate-300';
  return <div className={'p-3 rounded-xl border text-xs flex gap-2.5 items-start ' + v + ' ' + className} {...props}>{children}</div>;
}
export function AlertTitle({ children, className = '', ...props }) {
  return <h5 className={'font-bold leading-none mb-1 text-white ' + className} {...props}>{children}</h5>;
}
export function AlertDescription({ children, className = '', ...props }) {
  return <div className={'text-xs opacity-90 ' + className} {...props}>{children}</div>;
}

export function Tooltip({ children, content, className = '' }) {
  return <div className={'relative group inline-block ' + className}>{children}</div>;
}

// Re-export all popular Lucide icons so named imports from ./mavicore-ui never return undefined
export { 
  Play, Square, RotateCcw, AlertTriangle, CheckCircle2, XCircle, Gauge, Activity, 
  Cpu, Thermometer, ShieldCheck, Camera, Barcode, Eye, FileSpreadsheet, Layers, 
  Sliders, Database, ArrowRight, ArrowLeft, Trash2, Check, RefreshCw, Wifi, 
  WifiOff, Clock, User, Users, Zap, ChevronDown, ChevronRight, ChevronUp, ChevronLeft,
  X, Sparkles, Droplet, Volume2, Settings, Lock, Unlock, Hash, Calendar, Search, 
  Filter, Plus, Minus, Edit, Edit2, Edit3, History, Save, Download, Upload, Share2,
  Package, Box, Truck, Factory, Wrench, Clipboard, ClipboardCheck, ClipboardList,
  QrCode, Power, Bell, FileText, BarChart2, PieChart, LineChart, FilePlus, Globe,
  Smartphone, Pause, RotateCw, TrendingUp, TrendingDown, Info, ShieldAlert, CheckSquare,
  AlertCircle, HelpCircle
};

// Backward-compatibility aliases with early UI kit and alternate naming
export const MaviButton = ScadaStartBtn;
export const MaviCard = KPICard;
export const MaviKPI = KPICard;
export const MaviStatus = StatusBadge;
export const MaviChecklist = QualityChecklist;
export const MetricCard = KPICard;
export const StatCard = KPICard;
export const KpiCard = KPICard;

// Universal Safe Component Factory for undefined/unknown components
const createSafeComponent = (name) => {
  const SafeComp = ({ children, className = '', ...props }) => (
    <div className={'inline-flex items-center justify-center p-0.5 ' + className} data-safe-comp={name} {...props}>
      {children || null}
    </div>
  );
  SafeComp.displayName = name || 'SafeComp';
  return SafeComp;
};

const _uiComponents = {
  Numpad, KeyboardPro, SignaturePad, BooleanToggle, QualityTolerance,
  QualityChecklist, DialGauge, DigitalCaliper, BarcodeScanner,
  ScadaStartBtn, ScadaStopBtn, ScadaTank, ScadaPlcStatus, KPICard,
  ScadaProdCounter, StatusBadge, TelemetryGauge, Card, CardHeader,
  CardTitle, CardContent, CardFooter, Badge, Button, Modal, Dialog,
  MetricCard, StatCard, KpiCard, Input, Label, Textarea, Switch, Checkbox,
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
  Tabs, TabsList, TabsTrigger, TabsContent, Select, SelectTrigger,
  SelectValue, SelectContent, SelectItem, Progress, Alert, AlertTitle,
  AlertDescription, Tooltip, MaviButton, MaviCard, MaviKPI, MaviStatus,
  MaviChecklist, Activity, Gauge, Clock, CheckCircle2, AlertTriangle,
  Sparkles, Plus, Search, Filter, Trash2, RefreshCw, Layers, Sliders,
  Cpu, Zap, Settings, Play, Square, RotateCcw, XCircle, Thermometer,
  ShieldCheck, Camera, Barcode, Eye, FileSpreadsheet, Database,
  ArrowRight, ArrowLeft, Check, Wifi, WifiOff, User, Users,
  ChevronDown, ChevronRight, ChevronUp, ChevronLeft, X, Droplet,
  Volume2, Lock, Unlock, Hash, Calendar, Minus, Edit, Edit2, Edit3,
  History, Save, Download, Upload, Share2, Package, Box, Truck,
  Factory, Wrench, Clipboard, ClipboardCheck, ClipboardList, QrCode,
  Power, Bell, FileText, BarChart2, PieChart, LineChart, FilePlus,
  Globe, Smartphone, Pause, RotateCw, TrendingUp, TrendingDown, Info,
  ShieldAlert, CheckSquare, AlertCircle, HelpCircle
};

const _uiProxy = new Proxy(_uiComponents, {
  get(target, prop) {
    if (prop in target) return target[prop];
    if (typeof prop === 'string' && prop !== '__esModule' && prop !== 'default' && /^[A-Z]/.test(prop)) {
      return createSafeComponent(prop);
    }
    return target[prop];
  }
});

export default _uiComponents;

// In Node/Sandpack CJS interop, ensure both exports and module.exports have all components and safe proxy fallbacks
if (typeof exports !== 'undefined') {
  Object.assign(exports, _uiComponents);
  exports.default = _uiComponents;
  try { Object.setPrototypeOf(exports, _uiProxy); } catch (_) {}
  try { Object.defineProperty(exports, '__esModule', { value: true }); } catch (_) {}
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = _uiProxy;
  module.exports.default = _uiComponents;
  try { Object.assign(module.exports, _uiComponents); } catch (_) {}
  try { Object.defineProperty(module.exports, '__esModule', { value: true }); } catch (_) {}
}

if (typeof window !== 'undefined') {
  window.MaviCoreUI = _uiProxy;
}
`;

export default {
  MAVICORE_UI_VIRTUAL_FILE
};

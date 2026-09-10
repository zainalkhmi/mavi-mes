import React, { useState } from 'react';
import { 
  X, Copy, Check, Plus, Layers, Gauge, Activity, Cpu, Sliders, 
  ShieldCheck, Thermometer, Barcode, Droplet, Play, Square, Hash
} from 'lucide-react';
import toast from 'react-hot-toast';

const WIDGET_CATALOG = [
  {
    category: 'Interface & Keypad',
    icon: Hash,
    color: '#6366f1',
    items: [
      {
        name: 'Numpad',
        title: 'Industrial Touchscreen Numpad',
        desc: 'Keypad angka besar khusus sarung tangan operator shopfloor, lengkap dengan tombol C, DEL, dan Enter.',
        importCode: "import { Numpad } from './mavicore-ui';",
        sampleCode: `<Numpad 
  title="INPUT QTY PRODUKSI" 
  onEnter={(val) => {
    alert("Nilai disimpan: " + val);
  }} 
/>`
      },
      {
        name: 'KeyboardPro',
        title: 'Full QWERTY On-screen Keyboard',
        desc: 'Keyboard virtual layar sentuh lengkap (QWERTY, Angka, Simbol) untuk tablet kiosk tanpa keyboard fisik.',
        importCode: "import { KeyboardPro } from './mavicore-ui';",
        sampleCode: `<KeyboardPro 
  placeholder="Ketik catatan part / operator..." 
  onEnter={(text) => alert("Catatan: " + text)} 
/>`
      },
      {
        name: 'SignaturePad',
        title: 'Digital Signature Pad',
        desc: 'Canvas tanda tangan digital touch/stylus untuk serah terima shift atau verifikasi supervisor.',
        importCode: "import { SignaturePad } from './mavicore-ui';",
        sampleCode: `<SignaturePad 
  title="Tanda Tangan Verifikator QA" 
  onSave={(dataUrl) => {
    console.log("Signature saved", dataUrl);
  }} 
/>`
      },
      {
        name: 'BooleanToggle',
        title: 'Heavy Duty Toggle Switch',
        desc: 'Saklar switch mesin industri (ON / OFF) dengan indikator status tegas.',
        importCode: "import { BooleanToggle } from './mavicore-ui';",
        sampleCode: `<BooleanToggle 
  label="Safety Interlock Guard" 
  checked={true} 
  onChange={(val) => console.log("Toggle:", val)} 
/>`
      }
    ]
  },
  {
    category: 'Quality & Inspection',
    icon: ShieldCheck,
    color: '#f59e0b',
    items: [
      {
        name: 'QualityTolerance',
        title: 'Visual Tolerance Gauge (Min/Nom/Max)',
        desc: 'Bar visual pengecekan dimensi QC dengan deteksi otomatis PASS (hijau) atau FAIL/NG (merah).',
        importCode: "import { QualityTolerance } from './mavicore-ui';",
        sampleCode: `<QualityTolerance 
  title="Diameter Poros Spindle" 
  nominal={25.00} 
  tolerance={0.05} 
  actual={25.02} 
  unit="mm" 
/>`
      },
      {
        name: 'QualityChecklist',
        title: 'Inspection Checklist',
        desc: 'Daftar periksa inspeksi shift harian dengan tombol verifikasi PASS/FAIL cepat.',
        importCode: "import { QualityChecklist } from './mavicore-ui';",
        sampleCode: `<QualityChecklist 
  title="Pre-Flight Safety Check"
  items={[
    { id: 1, text: 'Emergency stop aktif', standard: 'Mati saat ditekan', status: 'pass' },
    { id: 2, text: 'Level oli hidrolik', standard: '> 75%', status: 'pass' },
    { id: 3, text: 'Sensor tirai cahaya', standard: 'Interlock OK', status: 'fail' }
  ]}
  onStatusChange={(id, status) => console.log(id, status)}
/>`
      },
      {
        name: 'BarcodeScanner',
        title: 'Barcode & QR Reader',
        desc: 'Widget pemindai barcode / QR lot material dengan kamera bawaan tablet atau input manual.',
        importCode: "import { BarcodeScanner } from './mavicore-ui';",
        sampleCode: `<BarcodeScanner 
  placeholder="Scan Barcode Work Order / Lot"
  onScan={(lotNo) => {
    alert("Lot discan: " + lotNo);
  }}
/>`
      }
    ]
  },
  {
    category: 'Metrology & Gauges',
    icon: Gauge,
    color: '#ec4899',
    items: [
      {
        name: 'DialGauge',
        title: 'Analog Dial Indicator Gauge',
        desc: 'Indikator dial bundar bergaya analog jarum presisi tinggi dengan pembacaan digital.',
        importCode: "import { DialGauge } from './mavicore-ui';",
        sampleCode: `<DialGauge 
  title="Runout Spindle CMM" 
  value={42} 
  min={0} 
  max={100} 
  unit="μm" 
/>`
      },
      {
        name: 'DigitalCaliper',
        title: 'Digital Caliper LCD Screen',
        desc: 'Tampilan vernier caliper digital dengan tombol Zero/Tare dan format angka LCD mikrometer.',
        importCode: "import { DigitalCaliper } from './mavicore-ui';",
        sampleCode: `<DigitalCaliper 
  title="Vernier Caliper Outside" 
  value={12.48} 
  unit="mm" 
  onZero={() => console.log("Tare zeroed")} 
/>`
      }
    ]
  },
  {
    category: 'SCADA HMI & Machine Controls',
    icon: Activity,
    color: '#06b6d4',
    items: [
      {
        name: 'ScadaStartBtn & ScadaStopBtn',
        title: 'Industrial Heavy Push Buttons',
        desc: 'Tombol Start hijau dan Stop merah bertekstur 3D industrial tactile untuk menjalankan mesin.',
        importCode: "import { ScadaStartBtn, ScadaStopBtn } from './mavicore-ui';",
        sampleCode: `<div className="flex gap-4">
  <ScadaStartBtn onClick={() => alert("Mesin Dijalankan!")} />
  <ScadaStopBtn onClick={() => alert("E-STOP Ditekan!")} />
</div>`
      },
      {
        name: 'ScadaTank',
        title: 'Fluid Process Tank',
        desc: 'Tangki vertikal dengan animasi level cairan, persentase isi, dan garis batas ambang.',
        importCode: "import { ScadaTank } from './mavicore-ui';",
        sampleCode: `<ScadaTank 
  title="Tangki Coolant CNC" 
  level={78} 
  capacity={500} 
  unit="L" 
/>`
      },
      {
        name: 'ScadaPlcStatus',
        title: 'PLC Heartbeat Monitor',
        desc: 'Status koneksi PLC industri (Online/Offline, Scan time ms, dan IP Address mesin).',
        importCode: "import { ScadaPlcStatus } from './mavicore-ui';",
        sampleCode: `<ScadaPlcStatus 
  isOnline={true} 
  name="Siemens S7-1500 (Line 1)" 
  ip="192.168.1.10" 
  scanTime={8} 
/>`
      }
    ]
  },
  {
    category: 'MES Metrics & OEE',
    icon: Layers,
    color: '#8b5cf6',
    items: [
      {
        name: 'KPICard',
        title: 'Vibrant Metric KPI Card',
        desc: 'Kartu metrik OEE/Yield bergradien warna dengan border accent tegas dan badge tren persentase.',
        importCode: "import { KPICard } from './mavicore-ui';",
        sampleCode: `<KPICard 
  title="Overall OEE" 
  value="94.2%" 
  trend="+2.4%" 
  color="indigo" 
/>`
      },
      {
        name: 'ScadaProdCounter',
        title: 'Production Target vs Actual Counter',
        desc: 'Tiga kotak ringkasan Target, Actual, dan NG/Defect lengkap dengan visual progress bar.',
        importCode: "import { ScadaProdCounter } from './mavicore-ui';",
        sampleCode: `<ScadaProdCounter 
  target={1500} 
  actual={1240} 
  defect={18} 
/>`
      },
      {
        name: 'StatusBadge & TelemetryGauge',
        title: 'Machine Status & Telemetry Sensors',
        desc: 'Pill status andon (RUNNING, DOWN, WARN) dan gauge pembacaan sensor IoT live.',
        importCode: "import { StatusBadge, TelemetryGauge } from './mavicore-ui';",
        sampleCode: `<div className="space-y-2">
  <StatusBadge status="RUNNING" />
  <TelemetryGauge title="Suhu Motor" value={54.2} unit="°C" status="OPTIMAL" />
</div>`
      }
    ]
  }
];

export default function WidgetCatalogModal({ isOpen, onClose, onInsertCode }) {
  const [activeCategory, setActiveCategory] = useState(WIDGET_CATALOG[0].category);
  const [copiedIndex, setCopiedIndex] = useState(null);

  if (!isOpen) return null;

  const currentCat = WIDGET_CATALOG.find(c => c.category === activeCategory) || WIDGET_CATALOG[0];

  const handleCopy = (code, idx) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(idx);
    toast.success('Snippet kode berhasil disalin!');
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleInsert = (item) => {
    if (onInsertCode) {
      onInsertCode(item.importCode, item.sampleCode);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-white font-sans">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <Layers size={18} className="text-white" />
            </div>
            <div>
              <h2 className="text-base font-black text-white">Katalog Widget MaviCore UI</h2>
              <p className="text-xs text-slate-400">Komponen industri dari Mavi App Builder siap pakai di Sandbox (<code className="text-cyan-400 font-mono">./mavicore-ui</code>)</p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content Body: Sidebar + Items */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          
          {/* Category Tabs */}
          <div className="w-full md:w-60 bg-slate-950/80 p-3 border-r border-slate-800 flex md:flex-col gap-1.5 overflow-x-auto md:overflow-y-auto">
            {WIDGET_CATALOG.map(cat => {
              const Icon = cat.icon;
              const isActive = cat.category === activeCategory;
              return (
                <button
                  key={cat.category}
                  type="button"
                  onClick={() => setActiveCategory(cat.category)}
                  className={'flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-left transition whitespace-nowrap ' + (
                    isActive ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  )}
                >
                  <Icon size={15} style={{ color: isActive ? '#fff' : cat.color }} />
                  <span>{cat.category}</span>
                </button>
              );
            })}
          </div>

          {/* Items Grid */}
          <div className="flex-1 p-5 overflow-y-auto space-y-4">
            <div className="text-xs font-black uppercase text-indigo-400 tracking-wider">
              {currentCat.category} ({currentCat.items.length} Widget)
            </div>

            <div className="grid grid-cols-1 gap-4">
              {currentCat.items.map((item, idx) => (
                <div key={item.name} className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/80 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-1.5">
                      <h4 className="font-black text-sm text-white">{item.title}</h4>
                      <code className="text-[10px] font-mono font-bold text-indigo-400 bg-indigo-950/60 px-2 py-0.5 rounded-md border border-indigo-800/60">
                        {item.name}
                      </code>
                    </div>
                    <p className="text-xs text-slate-300 mb-3">{item.desc}</p>
                    
                    {/* Code Snippet Box */}
                    <div className="bg-slate-950 rounded-xl p-3 border border-slate-800 font-mono text-[11px] text-emerald-400 overflow-x-auto mb-3">
                      <div className="text-slate-500 text-[10px] mb-1">{item.importCode}</div>
                      <pre className="whitespace-pre-wrap">{item.sampleCode}</pre>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-700/60">
                    <button
                      type="button"
                      onClick={() => handleCopy(item.importCode + '\n\n' + item.sampleCode, idx)}
                      className="px-3 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-xs font-bold text-slate-200 flex items-center gap-1.5 transition active:scale-95"
                    >
                      {copiedIndex === idx ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                      <span>{copiedIndex === idx ? 'Tersalin!' : 'Salin Snippet'}</span>
                    </button>
                    {onInsertCode && (
                      <button
                        type="button"
                        onClick={() => handleInsert(item)}
                        className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 text-white text-xs font-black flex items-center gap-1.5 shadow-md shadow-indigo-500/20 hover:brightness-110 active:scale-95 transition"
                      >
                        <Plus size={13} />
                        <span>Sisipkan ke /App.js</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

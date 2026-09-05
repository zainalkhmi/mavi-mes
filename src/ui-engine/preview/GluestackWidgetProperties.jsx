import React, { useState } from 'react';
import {
  Box, Type, Sparkles, Copy, Trash2, ArrowUp, ArrowDown,
  BringToFront, SendToBack, Zap, Plus, Edit3, Check, Search,
  Sliders, Eye, EyeOff, Layout, Palette, AlignLeft, AlignCenter,
  AlignRight, Bold, Italic, Underline, ChevronDown, ChevronRight,
  Database, Variable, Play, Link, CheckCircle2, AlertCircle,
  ExternalLink, Layers, Smartphone, RefreshCw, Hash, SlidersHorizontal
} from 'lucide-react';

const COLOR_PRESETS = [
  { label: 'Teal (Mavi)', value: '#008784' },
  { label: 'Plum (Core)', value: '#714b67' },
  { label: 'Slate 900', value: '#0f172a' },
  { label: 'Slate 600', value: '#475569' },
  { label: 'White', value: '#ffffff' },
  { label: 'Emerald', value: '#10b981' },
  { label: 'Blue', value: '#2563eb' },
  { label: 'Indigo', value: '#6366f1' },
  { label: 'Amber', value: '#f59e0b' },
  { label: 'Rose', value: '#ef4444' },
  { label: 'Transparent', value: 'transparent' }
];

export default function GluestackWidgetProperties({
  selectedComponent,
  updateProps,
  updateDataSource,
  updateComponentName,
  updateComponentDisplayName,
  removeComponent,
  duplicateComponent,
  reorderComponent,
  moveComponent,
  screens = [],
  currentScreenId = '',
  variables = [],
  setVariables = () => {},
  tables = [],
  recordPlaceholders = [],
  openAddTrigger = () => {},
  openEditTrigger = () => {},
  handleDeleteTrigger = () => {},
  onOpenCopilot = () => {}
}) {
  const [activeSection, setActiveSection] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [newVarName, setNewVarName] = useState('');
  const [showAddVar, setShowAddVar] = useState(false);

  if (!selectedComponent) {
    return (
      <div className="flex flex-col items-center justify-center h-80 text-slate-400 space-y-2 text-center p-6">
        <Box className="w-12 h-12 opacity-25 text-slate-400" />
        <div className="text-xs font-bold text-slate-600">Tidak Ada Widget Dipilih</div>
        <div className="text-[11px] text-slate-400 max-w-xs">
          Klik salah satu widget pada kanvas untuk mengatur properti, data binding variabel, aksi navigasi layar, style, dan triggers.
        </div>
      </div>
    );
  }

  const props = selectedComponent.props || {};
  const compType = selectedComponent.type || 'Widget';

  const matchesSearch = (text) => {
    if (!searchQuery.trim()) return true;
    return String(text || '').toLowerCase().includes(searchQuery.toLowerCase());
  };

  const handleCreateVariable = () => {
    if (!newVarName.trim()) return;
    const cleanName = newVarName.trim().toUpperCase().replace(/\s+/g, '_');
    const newV = {
      id: `var_${Date.now()}`,
      name: cleanName,
      type: 'string',
      value: '',
      persisted: false
    };
    setVariables(prev => [...prev, newV]);
    updateProps(selectedComponent.id, { targetVariable: cleanName });
    setNewVarName('');
    setShowAddVar(false);
  };

  const isButtonLike = ['Button', 'FAB', 'IconButton', 'Pressable'].includes(compType);
  const isInputLike = ['Input', 'Textarea', 'Select', 'Dropdown'].includes(compType);
  const isCheckLike = ['Checkbox', 'Switch', 'Radio'].includes(compType);
  const isProgressLike = ['Progress', 'Slider', 'Gauge'].includes(compType);
  const isTextLike = ['Heading', 'Text', 'Badge'].includes(compType);
  const isMediaLike = ['Image', 'Video', 'Camera', 'QRCodeScanner', 'BarcodeScanner'].includes(compType);
  const isContainerLike = ['Card', 'Container', 'Box', 'HStack', 'VStack'].includes(compType);

  return (
    <div className="space-y-4 pt-1 text-slate-700">
      
      {/* ─── 1. WIDGET HEADER & TOP ACTIONS ────────────────────────────────────────── */}
      <div className="pb-3 border-b border-slate-200">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="p-1 rounded-md bg-[#008784]/10 text-[#008784]">
              <Box className="w-4 h-4" />
            </span>
            <div className="min-w-0">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
                GLUESTACK WIDGET
              </span>
              <span className="text-sm font-bold text-slate-800 truncate block">
                {selectedComponent.displayName || props.label || props.text || props.title || compType}
              </span>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onOpenCopilot(selectedComponent)}
              title="Tanya Copilot tentang Widget ini"
              className="p-1.5 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => duplicateComponent(selectedComponent.id)}
              title="Duplicate Widget"
              className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => removeComponent(selectedComponent.id)}
              title="Hapus Widget"
              className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Display Name & Widget Identifier (Name for triggers & code) */}
        <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">
              Display Name
            </label>
            <input
              type="text"
              value={selectedComponent.displayName || ''}
              placeholder={compType}
              onChange={(e) => {
                if (updateComponentDisplayName) {
                  updateComponentDisplayName(selectedComponent.id, e.target.value);
                } else {
                  updateProps(selectedComponent.id, { displayName: e.target.value });
                }
              }}
              className="w-full text-xs px-2 py-1.5 bg-white border border-slate-300 rounded-lg font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#008784]"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">
              Widget Identifier
            </label>
            <input
              type="text"
              value={selectedComponent.name || ''}
              placeholder={selectedComponent.id?.slice(0, 10)}
              onChange={(e) => {
                if (updateComponentName) {
                  updateComponentName(selectedComponent.id, e.target.value);
                } else {
                  updateProps(selectedComponent.id, { name: e.target.value });
                }
              }}
              className="w-full text-xs px-2 py-1.5 bg-white border border-slate-300 rounded-lg font-mono text-[11px] text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#008784]"
            />
          </div>
        </div>

        {/* Layer / Stack Arrange bar */}
        <div className="flex items-center gap-1 mt-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">Arrange:</span>
          <button
            type="button"
            onClick={() => reorderComponent ? reorderComponent(selectedComponent.id, 'FRONT') : moveComponent(selectedComponent.id, 'up')}
            title="Bring to Front (Paling Depan)"
            className="flex-1 py-1 px-1.5 text-[10px] font-bold bg-white hover:bg-slate-50 border border-slate-200 rounded-md flex items-center justify-center gap-1 text-slate-600 shadow-2xs"
          >
            <BringToFront className="w-3 h-3 text-indigo-600" />
            <span>Front</span>
          </button>
          <button
            type="button"
            onClick={() => moveComponent(selectedComponent.id, 'up')}
            title="Move Up"
            className="flex-1 py-1 px-1.5 text-[10px] font-bold bg-white hover:bg-slate-50 border border-slate-200 rounded-md flex items-center justify-center gap-1 text-slate-600 shadow-2xs"
          >
            <ArrowUp className="w-3 h-3" />
            <span>Up</span>
          </button>
          <button
            type="button"
            onClick={() => moveComponent(selectedComponent.id, 'down')}
            title="Move Down"
            className="flex-1 py-1 px-1.5 text-[10px] font-bold bg-white hover:bg-slate-50 border border-slate-200 rounded-md flex items-center justify-center gap-1 text-slate-600 shadow-2xs"
          >
            <ArrowDown className="w-3 h-3" />
            <span>Down</span>
          </button>
          <button
            type="button"
            onClick={() => reorderComponent ? reorderComponent(selectedComponent.id, 'BACK') : moveComponent(selectedComponent.id, 'down')}
            title="Send to Back (Paling Belakang)"
            className="flex-1 py-1 px-1.5 text-[10px] font-bold bg-white hover:bg-slate-50 border border-slate-200 rounded-md flex items-center justify-center gap-1 text-slate-600 shadow-2xs"
          >
            <SendToBack className="w-3 h-3 text-slate-400" />
            <span>Back</span>
          </button>
        </div>
      </div>

      {/* ─── 2. SEARCH BAR & SECTION TABS ─────────────────────────────────────────── */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari properti widget..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#008784] focus:bg-white"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-[10px]"
            >
              ✕
            </button>
          )}
        </div>

        {/* Section Tabs */}
        <div className="flex flex-wrap gap-1 p-0.5 bg-slate-100 rounded-lg">
          {[
            { id: 'ALL', label: 'All' },
            { id: 'CONTENT', label: 'Content' },
            ...(isButtonLike ? [{ id: 'ACTION', label: 'Action' }] : []),
            { id: 'DATA', label: 'Data Binding' },
            { id: 'STYLE', label: 'Style' },
            { id: 'TRIGGERS', label: 'Triggers' },
            { id: 'VISIBILITY', label: 'Visibility' }
          ].map(sec => (
            <button
              key={sec.id}
              type="button"
              onClick={() => setActiveSection(sec.id)}
              className={`px-2 py-1 text-[10px] font-bold rounded-md transition-colors ${
                activeSection === sec.id
                  ? 'bg-white text-[#008784] shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {sec.label}
            </button>
          ))}
        </div>
      </div>

      {/* ─── 3. CONTENT & PRIMARY PROPS ───────────────────────────────────────────── */}
      {(activeSection === 'ALL' || activeSection === 'CONTENT') && (
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
              CONTENT & SPECIFICATIONS
            </span>
            <span className="text-[9px] font-bold px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded">
              {compType}
            </span>
          </div>

          {/* Text Prop */}
          {('text' in props || isButtonLike || compType === 'Text' || compType === 'Heading' || compType === 'Badge') && matchesSearch('text content label') && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 block">
                {compType === 'Heading' ? 'Heading Text' : compType === 'Button' ? 'Button Label' : 'Text Content'}
              </label>
              <input
                type="text"
                value={props.text || props.label || ''}
                onChange={(e) => updateProps(selectedComponent.id, { text: e.target.value, label: e.target.value })}
                className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white focus:ring-1 focus:ring-[#008784]"
              />
            </div>
          )}

          {/* Label Prop */}
          {'label' in props && !('text' in props) && matchesSearch('label') && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 block">Label Field</label>
              <input
                type="text"
                value={props.label || ''}
                onChange={(e) => updateProps(selectedComponent.id, { label: e.target.value })}
                className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white focus:ring-1 focus:ring-[#008784]"
              />
            </div>
          )}

          {/* Title & Subtitle Props (Cards & Headers) */}
          {('title' in props || isContainerLike) && matchesSearch('title judul') && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 block">Judul / Title</label>
              <input
                type="text"
                value={props.title || ''}
                onChange={(e) => updateProps(selectedComponent.id, { title: e.target.value })}
                className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white focus:ring-1 focus:ring-[#008784]"
              />
            </div>
          )}

          {('subtitle' in props || isContainerLike) && matchesSearch('subtitle deskripsi') && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 block">Subtitle / Keterangan</label>
              <input
                type="text"
                value={props.subtitle || ''}
                onChange={(e) => updateProps(selectedComponent.id, { subtitle: e.target.value })}
                className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white focus:ring-1 focus:ring-[#008784]"
              />
            </div>
          )}

          {/* Content / Body Text */}
          {('content' in props || compType === 'Textarea') && matchesSearch('content body teks catatan') && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 block">Isi Konten / Body</label>
              <textarea
                rows={3}
                value={props.content || ''}
                onChange={(e) => updateProps(selectedComponent.id, { content: e.target.value })}
                className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white resize-none focus:ring-1 focus:ring-[#008784]"
              />
            </div>
          )}

          {/* Placeholder for Inputs */}
          {isInputLike && matchesSearch('placeholder') && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 block">Placeholder Hint</label>
              <input
                type="text"
                value={props.placeholder || ''}
                onChange={(e) => updateProps(selectedComponent.id, { placeholder: e.target.value })}
                className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white focus:ring-1 focus:ring-[#008784]"
              />
            </div>
          )}

          {/* Input Type for Inputs */}
          {compType === 'Input' && matchesSearch('input type number password email date') && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 block">Input Type</label>
              <select
                value={props.inputType || 'text'}
                onChange={(e) => updateProps(selectedComponent.id, { inputType: e.target.value })}
                className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white font-medium"
              >
                <option value="text">Text (Biasa)</option>
                <option value="number">Number (Angka / Counter)</option>
                <option value="password">Password (Sensor/PIN)</option>
                <option value="email">Email</option>
                <option value="tel">Telepon / Barcode</option>
                <option value="date">Date Picker (Tanggal)</option>
                <option value="time">Time Picker (Waktu)</option>
              </select>
            </div>
          )}

          {/* Options for Select / Dropdown / Radio */}
          {(compType === 'Select' || compType === 'Dropdown' || compType === 'Radio') && matchesSearch('options pilihan') && (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-600 block">Daftar Pilihan (1 per baris)</label>
                <span className="text-[10px] text-slate-400">{(props.options || []).length} opsi</span>
              </div>
              <textarea
                rows={4}
                value={Array.isArray(props.options) ? props.options.join('\n') : (props.options || '')}
                onChange={(e) => {
                  const lines = e.target.value.split('\n');
                  updateProps(selectedComponent.id, { options: lines });
                }}
                placeholder="Shift 1 (Pagi)&#10;Shift 2 (Siang)&#10;Shift 3 (Malam)"
                className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white font-mono text-[11px] focus:ring-1 focus:ring-[#008784]"
              />
            </div>
          )}

          {/* Checkbox / Switch Checked state */}
          {isCheckLike && matchesSearch('checked default') && (
            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <span className="text-xs font-bold text-slate-700 block">Default Checked / ON</span>
                <span className="text-[10px] text-slate-400">Status awal saat aplikasi dimuat</span>
              </div>
              <input
                type="checkbox"
                checked={!!props.checked}
                onChange={(e) => updateProps(selectedComponent.id, { checked: e.target.checked })}
                className="w-4 h-4 rounded text-[#008784] focus:ring-[#008784]"
              />
            </div>
          )}

          {/* Value for Progress, Slider, Gauge */}
          {isProgressLike && matchesSearch('value min max step') && (
            <div className="space-y-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Nilai</label>
                  <input
                    type="number"
                    value={props.value ?? 50}
                    onChange={(e) => updateProps(selectedComponent.id, { value: Number(e.target.value) })}
                    className="w-full text-xs p-1.5 border border-slate-300 rounded-lg bg-white text-center font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Min</label>
                  <input
                    type="number"
                    value={props.min ?? 0}
                    onChange={(e) => updateProps(selectedComponent.id, { min: Number(e.target.value) })}
                    className="w-full text-xs p-1.5 border border-slate-300 rounded-lg bg-white text-center"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Max</label>
                  <input
                    type="number"
                    value={props.max ?? 100}
                    onChange={(e) => updateProps(selectedComponent.id, { max: Number(e.target.value) })}
                    className="w-full text-xs p-1.5 border border-slate-300 rounded-lg bg-white text-center"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Media / URL Props */}
          {isMediaLike && matchesSearch('src url media gambar video') && (
            <div className="space-y-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 block">Source URL / Gambar / Stream</label>
                <input
                  type="text"
                  value={props.src || ''}
                  onChange={(e) => updateProps(selectedComponent.id, { src: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white font-mono text-[11px]"
                />
              </div>

              {'poster' in props && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600 block">Poster Thumbnail URL</label>
                  <input
                    type="text"
                    value={props.poster || ''}
                    onChange={(e) => updateProps(selectedComponent.id, { poster: e.target.value })}
                    className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white font-mono text-[11px]"
                  />
                </div>
              )}

              {'aspectRatio' in props && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600 block">Aspect Ratio</label>
                  <select
                    value={props.aspectRatio || '16:9'}
                    onChange={(e) => updateProps(selectedComponent.id, { aspectRatio: e.target.value })}
                    className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white font-medium"
                  >
                    <option value="square">1:1 Square (Mobile HUD)</option>
                    <option value="16:9">16:9 Widescreen (HD Media)</option>
                    <option value="4:3">4:3 Standard</option>
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Toggle Required / Disabled for inputs */}
          {isInputLike && matchesSearch('required disabled readonly wajib') && (
            <div className="grid grid-cols-2 gap-2 pt-1">
              <label className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer text-xs font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={!!props.required}
                  onChange={(e) => updateProps(selectedComponent.id, { required: e.target.checked })}
                  className="w-3.5 h-3.5 rounded text-[#008784]"
                />
                <span>Wajib Diisi</span>
              </label>

              <label className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer text-xs font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={!!props.disabled}
                  onChange={(e) => updateProps(selectedComponent.id, { disabled: e.target.checked })}
                  className="w-3.5 h-3.5 rounded text-[#008784]"
                />
                <span>Disabled / Read-Only</span>
              </label>
            </div>
          )}
        </div>
      )}

      {/* ─── 4. BUTTON ACTIONS & NAVIGATION SYSTEM ─────────────────────────────────── */}
      {(activeSection === 'ALL' || activeSection === 'ACTION') && isButtonLike && matchesSearch('action navigasi next screen go to step') && (
        <div className="space-y-3 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
              NAVIGATION & ON-CLICK ACTION
            </span>
            <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
              Native Mobile Flow
            </span>
          </div>

          <div className="space-y-2 bg-indigo-50/40 p-3 rounded-xl border border-indigo-100">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Aksi Tombol (On-Click)</label>
              <select
                value={props.action || 'NONE'}
                onChange={(e) => updateProps(selectedComponent.id, { action: e.target.value })}
                className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white font-semibold text-slate-800 focus:ring-1 focus:ring-indigo-500"
              >
                <option value="NONE">-- Tidak Ada Aksi Khusus (Trigger Saja) --</option>
                <option value="NEXT_SCREEN">⏩ Pindah ke Layar Berikutnya (Next Screen)</option>
                <option value="PREV_SCREEN">⏪ Kembali ke Layar Sebelumnya (Prev Screen)</option>
                <option value="GO_TO_SCREEN">🎯 Loncat ke Layar Spesifik (Go to Screen)</option>
                <option value="COMPLETE_APP">✅ Selesaikan Aplikasi / Submit Work Order</option>
              </select>
            </div>

            {props.action === 'GO_TO_SCREEN' && (
              <div className="pt-1">
                <label className="text-xs font-bold text-slate-700 block mb-1">Pilih Layar Target</label>
                <select
                  value={props.targetScreenId || ''}
                  onChange={(e) => updateProps(selectedComponent.id, { targetScreenId: e.target.value })}
                  className="w-full text-xs p-2 border border-indigo-300 rounded-lg bg-white font-medium text-slate-800"
                >
                  <option value="">-- Pilih Layar --</option>
                  {screens.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.title} {s.id === currentScreenId ? '(Layar Saat Ini)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── 5. DATA BINDING & APP VARIABLES ───────────────────────────────────────── */}
      {(activeSection === 'ALL' || activeSection === 'DATA') && matchesSearch('data binding variable tabel placeholder') && (
        <div className="space-y-3 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
              DATA BINDING & VARIABLES
            </span>
            <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
              MaviCore DB Link
            </span>
          </div>

          <div className="space-y-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
            {/* Direct Variable Binding (Target Variable) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <Variable className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Bind ke Variabel Aplikasi</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowAddVar(!showAddVar)}
                  className="text-[10px] font-bold text-[#008784] hover:underline"
                >
                  {showAddVar ? 'Batal' : '+ Variabel Baru'}
                </button>
              </div>

              {showAddVar && (
                <div className="flex gap-1 mb-2">
                  <input
                    type="text"
                    value={newVarName}
                    onChange={(e) => setNewVarName(e.target.value)}
                    placeholder="NAMA_VARIABEL"
                    className="flex-1 text-xs p-1.5 border border-slate-300 rounded-lg bg-white font-mono uppercase"
                  />
                  <button
                    type="button"
                    onClick={handleCreateVariable}
                    className="px-2 py-1 bg-[#008784] text-white text-xs font-bold rounded-lg hover:bg-[#007471]"
                  >
                    Simpan
                  </button>
                </div>
              )}

              <select
                value={props.targetVariable || props.varSource || ''}
                onChange={(e) => updateProps(selectedComponent.id, { targetVariable: e.target.value, varSource: e.target.value })}
                className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white font-mono text-[11px] text-slate-800"
              >
                <option value="">-- Tidak Terhubung ke Variabel (Statis) --</option>
                {variables.map(v => (
                  <option key={v.id || v.name} value={v.name}>
                    {v.name} ({v.type || 'string'}) = "{String(v.value || '')}"
                  </option>
                ))}
              </select>
              <div className="text-[10px] text-slate-400 mt-1">
                Nilai widget ini otomatis disimpan ke variabel saat runtime, atau menampilkan nilai variabel secara dinamis.
              </div>
            </div>

            {/* Record Placeholder Link */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Record Placeholder (MES Work Order)</label>
              <select
                value={selectedComponent.dataSource?.recordPlaceholderId || ''}
                onChange={(e) => updateDataSource(selectedComponent.id, { recordPlaceholderId: e.target.value })}
                className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white"
              >
                <option value="">-- None (Statis) --</option>
                {recordPlaceholders.map(rp => (
                  <option key={rp.id} value={rp.id}>
                    {rp.name} ({rp.field})
                  </option>
                ))}
              </select>
            </div>

            {/* Target Table Link */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Target Tabel Database</label>
              <select
                value={selectedComponent.dataSource?.tableId || props.tableId || ''}
                onChange={(e) => {
                  updateDataSource(selectedComponent.id, { tableId: e.target.value });
                  updateProps(selectedComponent.id, { tableId: e.target.value });
                }}
                className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white"
              >
                <option value="">-- None --</option>
                {tables.map(tbl => (
                  <option key={tbl.id} value={tbl.id}>
                    {tbl.name} ({(tbl.columns || []).length} kolom)
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* ─── 6. APPEARANCE, STYLING & TYPOGRAPHY ───────────────────────────────────── */}
      {(activeSection === 'ALL' || activeSection === 'STYLE') && matchesSearch('style warna color font border radius background') && (
        <div className="space-y-3 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
              APPEARANCE & STYLING
            </span>
            <span className="text-[9px] font-bold text-slate-400">Design System</span>
          </div>

          {/* Color Variant for Buttons & Badges */}
          {(isButtonLike || compType === 'Badge') && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 block">Color Variant Theme</label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { key: 'primary', label: 'Primary Teal', bg: 'bg-[#008784] text-white' },
                  { key: 'secondary', label: 'Secondary Dark', bg: 'bg-slate-800 text-white' },
                  { key: 'positive', label: 'Positive Green', bg: 'bg-emerald-600 text-white' },
                  { key: 'danger', label: 'Danger Red', bg: 'bg-rose-600 text-white' },
                  { key: 'warning', label: 'Warning Amber', bg: 'bg-amber-500 text-white' },
                  { key: 'outline', label: 'Outline Clean', bg: 'bg-white text-slate-700 border border-slate-300' }
                ].map(v => (
                  <button
                    key={v.key}
                    type="button"
                    onClick={() => updateProps(selectedComponent.id, { variant: v.key })}
                    className={`py-1.5 px-2 rounded-lg text-[10px] font-bold transition-all text-center truncate ${v.bg} ${
                      props.variant === v.key ? 'ring-2 ring-indigo-500 shadow-xs' : 'opacity-85 hover:opacity-100'
                    }`}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Background Color Picker & Swatches */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-600">Background Color</label>
              <div className="flex items-center gap-1">
                <input
                  type="color"
                  value={props.backgroundColor && props.backgroundColor !== 'transparent' ? props.backgroundColor : '#ffffff'}
                  onChange={(e) => updateProps(selectedComponent.id, { backgroundColor: e.target.value })}
                  className="w-5 h-5 rounded cursor-pointer border-0 p-0"
                />
                <span className="text-[10px] font-mono text-slate-500">{props.backgroundColor || 'default'}</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-1">
              {COLOR_PRESETS.map(c => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => updateProps(selectedComponent.id, { backgroundColor: c.value })}
                  title={c.label}
                  style={{ backgroundColor: c.value === 'transparent' ? '#fff' : c.value }}
                  className={`w-5 h-5 rounded-full border border-slate-300 transition-transform hover:scale-110 ${
                    props.backgroundColor === c.value ? 'ring-2 ring-indigo-500 ring-offset-1' : ''
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Font Color Picker & Swatches */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-600">Text / Font Color</label>
              <div className="flex items-center gap-1">
                <input
                  type="color"
                  value={props.color || '#0f172a'}
                  onChange={(e) => updateProps(selectedComponent.id, { color: e.target.value })}
                  className="w-5 h-5 rounded cursor-pointer border-0 p-0"
                />
                <span className="text-[10px] font-mono text-slate-500">{props.color || 'default'}</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-1">
              {COLOR_PRESETS.filter(c => c.value !== 'transparent').map(c => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => updateProps(selectedComponent.id, { color: c.value })}
                  title={c.label}
                  style={{ backgroundColor: c.value }}
                  className={`w-5 h-5 rounded-full border border-slate-300 transition-transform hover:scale-110 ${
                    props.color === c.value ? 'ring-2 ring-indigo-500 ring-offset-1' : ''
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Typography: Font Size, Weight, Align */}
          <div className="space-y-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Font Size</span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="9"
                  max="48"
                  value={props.fontSize || 14}
                  onChange={(e) => updateProps(selectedComponent.id, { fontSize: Number(e.target.value) })}
                  className="w-14 text-xs p-1 border border-slate-300 rounded bg-white text-center font-bold"
                />
                <span className="text-[10px] text-slate-400">px</span>
              </div>
            </div>

            {/* Bold, Italic, Underline */}
            <div className="flex gap-1 pt-1">
              <button
                type="button"
                onClick={() => updateProps(selectedComponent.id, { fontWeight: props.fontWeight === 'bold' ? 'normal' : 'bold' })}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition-colors flex items-center justify-center ${
                  props.fontWeight === 'bold' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-200'
                }`}
              >
                <Bold className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => updateProps(selectedComponent.id, { fontStyle: props.fontStyle === 'italic' ? 'normal' : 'italic' })}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition-colors flex items-center justify-center ${
                  props.fontStyle === 'italic' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-200'
                }`}
              >
                <Italic className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => updateProps(selectedComponent.id, { textDecoration: props.textDecoration === 'underline' ? 'none' : 'underline' })}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition-colors flex items-center justify-center ${
                  props.textDecoration === 'underline' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-200'
                }`}
              >
                <Underline className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Text Alignment */}
            <div className="flex gap-1 pt-1">
              <button
                type="button"
                onClick={() => updateProps(selectedComponent.id, { textAlign: 'left' })}
                className={`flex-1 py-1 text-xs font-bold rounded-lg border flex items-center justify-center ${
                  props.textAlign === 'left' || !props.textAlign ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200'
                }`}
              >
                <AlignLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => updateProps(selectedComponent.id, { textAlign: 'center' })}
                className={`flex-1 py-1 text-xs font-bold rounded-lg border flex items-center justify-center ${
                  props.textAlign === 'center' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200'
                }`}
              >
                <AlignCenter className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => updateProps(selectedComponent.id, { textAlign: 'right' })}
                className={`flex-1 py-1 text-xs font-bold rounded-lg border flex items-center justify-center ${
                  props.textAlign === 'right' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200'
                }`}
              >
                <AlignRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Border Radius & Elevation */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Border Radius</label>
              <select
                value={props.borderRadius || 'rounded-xl'}
                onChange={(e) => updateProps(selectedComponent.id, { borderRadius: e.target.value })}
                className="w-full text-xs p-1.5 border border-slate-300 rounded-lg bg-white"
              >
                <option value="rounded-none">Square (0px)</option>
                <option value="rounded-md">Small (6px)</option>
                <option value="rounded-xl">Medium (12px)</option>
                <option value="rounded-2xl">Large (16px)</option>
                <option value="rounded-full">Pill / Full</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Shadow / Shadow</label>
              <select
                value={props.elevation || 'shadow-xs'}
                onChange={(e) => updateProps(selectedComponent.id, { elevation: e.target.value })}
                className="w-full text-xs p-1.5 border border-slate-300 rounded-lg bg-white"
              >
                <option value="shadow-none">None</option>
                <option value="shadow-xs">Subtle (Light)</option>
                <option value="shadow-md">Medium</option>
                <option value="shadow-lg">Elevated (Card)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* ─── 7. TRIGGERS & BUSINESS LOGIC ─────────────────────────────────────────── */}
      {(activeSection === 'ALL' || activeSection === 'TRIGGERS') && matchesSearch('trigger logika event clause action') && (
        <div className="space-y-3 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                TRIGGERS & EVENT LOGIC
              </span>
              <span className="text-[9px] text-slate-400 font-medium">Mavi Trigger Engine</span>
            </div>
            <button
              type="button"
              onClick={() => openAddTrigger('WIDGET', selectedComponent.id)}
              className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-extrabold flex items-center gap-1 shadow-2xs transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>Add Trigger</span>
            </button>
          </div>

          <div className="space-y-2">
            {(selectedComponent.triggers || []).length === 0 ? (
              <div className="text-[11px] text-slate-400 bg-slate-50/80 p-3 rounded-xl border border-dashed border-slate-200 text-center space-y-1.5">
                <Zap className="w-4 h-4 mx-auto text-slate-300" />
                <div className="text-slate-500 font-medium">Belum ada trigger pada widget ini.</div>
                <button
                  type="button"
                  onClick={() => openAddTrigger('WIDGET', selectedComponent.id)}
                  className="text-[10px] font-bold text-indigo-600 hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" /> Tambah trigger baru
                </button>
              </div>
            ) : (
              selectedComponent.triggers.map((trig, idx) => {
                const clauseCount = (trig.clauses || []).length;
                let totalActions = (trig.elseActions || []).length;
                (trig.clauses || []).forEach(c => {
                  totalActions += (c.actions || []).length;
                });
                const isActive = trig.enabled !== false;

                return (
                  <div
                    key={trig.id || idx}
                    onClick={() => openEditTrigger(trig, idx, 'WIDGET', selectedComponent.id)}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer group hover:shadow-xs ${
                      isActive ? 'bg-white border-slate-200 hover:border-indigo-300' : 'bg-slate-50/70 border-slate-200 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wide shrink-0 ${
                          isActive ? 'bg-purple-100 text-purple-700' : 'bg-slate-200 text-slate-500'
                        }`}>
                          {isActive ? 'ACTIVE' : 'OFF'}
                        </span>
                        <span className="font-bold text-slate-800 text-xs truncate">
                          {trig.name || 'New Trigger'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditTrigger(trig, idx, 'WIDGET', selectedComponent.id);
                          }}
                          className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition-colors"
                          title="Edit Trigger"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTrigger(trig.id);
                          }}
                          className="p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                          title="Hapus Trigger"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                      <span className="font-mono text-indigo-600 font-semibold bg-indigo-50 px-1.5 py-0.2 rounded text-[9px]">
                        {trig.event || 'ON_CLICK'}
                      </span>
                      <span>{clauseCount} clause • {totalActions} aksi</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ─── 8. VISIBILITY CONDITIONS & EFFECTS ────────────────────────────────────── */}
      {(activeSection === 'ALL' || activeSection === 'VISIBILITY') && matchesSearch('visibility condition tampil sembunyi blink kedip') && (
        <div className="space-y-3 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
              VISIBILITY & EFFECTS
            </span>
            <span className="text-[9px] font-bold text-slate-400">Conditional</span>
          </div>

          <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
            {/* Visibility condition checkbox */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id={`vis-${selectedComponent.id}`}
                checked={!!props.visibilityCondition}
                onChange={(e) => {
                  if (e.target.checked) {
                    updateProps(selectedComponent.id, {
                      visibilityCondition: { variable: variables[0]?.name || '', operator: '==', value: '' }
                    });
                  } else {
                    updateProps(selectedComponent.id, { visibilityCondition: null });
                  }
                }}
                className="w-4 h-4 rounded text-[#008784]"
              />
              <label htmlFor={`vis-${selectedComponent.id}`} className="text-xs font-bold text-slate-700 cursor-pointer">
                Aktifkan Syarat Tampil (Visibility Rule)
              </label>
            </div>

            {props.visibilityCondition && (
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">Berdasarkan Variabel</label>
                  <select
                    value={props.visibilityCondition.variable || ''}
                    onChange={(e) => updateProps(selectedComponent.id, {
                      visibilityCondition: { ...props.visibilityCondition, variable: e.target.value }
                    })}
                    className="w-full text-xs p-1.5 border border-slate-300 rounded-lg bg-white font-mono text-[11px]"
                  >
                    <option value="">-- Pilih Variabel --</option>
                    {variables.map(v => (
                      <option key={v.id || v.name} value={v.name}>{v.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">Operator</label>
                    <select
                      value={props.visibilityCondition.operator || '=='}
                      onChange={(e) => updateProps(selectedComponent.id, {
                        visibilityCondition: { ...props.visibilityCondition, operator: e.target.value }
                      })}
                      className="w-full text-xs p-1.5 border border-slate-300 rounded-lg bg-white font-bold"
                    >
                      <option value="==">Sama Dengan (==)</option>
                      <option value="!=">Tidak Sama (!=)</option>
                      <option value=">">Lebih Besar (&gt;)</option>
                      <option value="<">Lebih Kecil (&lt;)</option>
                      <option value="contains">Mengandung teks</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">Nilai Target</label>
                    <input
                      type="text"
                      value={props.visibilityCondition.value ?? ''}
                      onChange={(e) => updateProps(selectedComponent.id, {
                        visibilityCondition: { ...props.visibilityCondition, value: e.target.value }
                      })}
                      placeholder="Contoh: TRUE / 100"
                      className="w-full text-xs p-1.5 border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Blink Animation Effect */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
              <input
                type="checkbox"
                id={`blink-${selectedComponent.id}`}
                checked={!!props.isBlinking}
                onChange={(e) => updateProps(selectedComponent.id, { isBlinking: e.target.checked })}
                className="w-4 h-4 rounded text-[#008784]"
              />
              <label htmlFor={`blink-${selectedComponent.id}`} className="text-xs font-bold text-slate-700 cursor-pointer flex items-center gap-1.5">
                <span>Efek Kedip / Blink Alert</span>
                <span className="text-[9px] text-amber-600 bg-amber-50 px-1 rounded">Visual Attention</span>
              </label>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

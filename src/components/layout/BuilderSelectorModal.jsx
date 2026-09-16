import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  X,
  Monitor,
  Cpu,
  Smartphone,
  Tablet,
  Sparkles,
  Bot,
  BrainCircuit,
  ArrowRight,
  ExternalLink,
  Layers,
  Wand2,
  Workflow,
  CheckCircle2,
  Zap,
  LayoutGrid
} from 'lucide-react';
import { BUILDER_METADATA } from '../../utils/builderType';

/**
 * BuilderSelectorModal
 * Premium futuristic modal for switching between the 3 MaviCore App Builders:
 * 1. PC — Mavi App Builder (PC/Desktop Workstation Canvas)
 * 2. Mobile — Gluestack App Builder (Mobile/Tablet UI Engine Studio)
 * 3. Generatif — Sandbox App Builder (AI Prompt-to-App & Sandpack Live)
 */
export default function BuilderSelectorModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const location = useLocation();

  // Determine current active builder
  const currentPath = location.pathname;
  const isPcActive = currentPath === '/builder' || currentPath.startsWith('/builder');
  const isMobileActive = currentPath === '/ui-engine' || currentPath.startsWith('/ui-engine') || currentPath.startsWith('/gluestack');
  const isSandboxActive = currentPath === '/sandbox' || currentPath.startsWith('/sandbox');

  // Keyboard navigation: Escape to close, 1/2/3 to select
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === '1' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        handleNavigate('/builder');
      } else if (e.key === '2' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        handleNavigate('/ui-engine');
      } else if (e.key === '3' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        handleNavigate('/sandbox');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleNavigate = (path, newTab = false) => {
    onClose();
    if (newTab) {
      window.open(`/#${path}`, '_blank', 'noopener,noreferrer');
    } else {
      navigate(path);
    }
  };

  const builders = [
    {
      id: 'pc_builder',
      num: '1',
      key: 'app_builder',
      title: 'PC — Mavi App Builder',
      badge: 'PC / Desktop',
      category: 'Workstation & MES HMI',
      path: '/builder',
      isActive: isPcActive,
      theme: {
        glow: 'hover:border-blue-500/80 hover:shadow-blue-500/20',
        badgeBg: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
        iconBg: 'bg-gradient-to-br from-blue-600 via-indigo-600 to-cyan-500 shadow-blue-500/30',
        buttonBg: 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-600/30',
        borderActive: 'border-blue-500 ring-2 ring-blue-500/30 bg-blue-950/20'
      },
      icon: (
        <div className="relative">
          <Monitor size={32} className="text-white drop-shadow" />
          <div className="absolute -bottom-1.5 -right-1.5 p-1 rounded-md bg-slate-900/90 border border-blue-400/40 text-blue-300 shadow-sm">
            <Cpu size={14} />
          </div>
        </div>
      ),
      description: 'Studio kanvas drag-and-drop visual untuk PC operator shopfloor, terminal workstation, dan integrasi barcode/PLC.',
      features: [
        { icon: <LayoutGrid size={13} />, text: 'Visual Canvas & Drag-and-Drop' },
        { icon: <Workflow size={13} />, text: 'Step Triggers & Industrial Logic' },
        { icon: <Zap size={13} />, text: 'Station, PLC & Barcode HMI' }
      ]
    },
    {
      id: 'mobile_builder',
      num: '2',
      key: 'gluestack',
      title: 'Mobile — Gluestack App Builder',
      badge: 'Mobile / Tablet',
      category: 'Gluestack UI Engine Studio',
      path: '/ui-engine',
      isActive: isMobileActive,
      theme: {
        glow: 'hover:border-purple-500/80 hover:shadow-purple-500/20',
        badgeBg: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
        iconBg: 'bg-gradient-to-br from-purple-600 via-fuchsia-600 to-violet-500 shadow-purple-500/30',
        buttonBg: 'bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white shadow-purple-600/30',
        borderActive: 'border-purple-500 ring-2 ring-purple-500/30 bg-purple-950/20'
      },
      icon: (
        <div className="relative">
          <Smartphone size={32} className="text-white drop-shadow" />
          <div className="absolute -bottom-1.5 -right-1.5 p-1 rounded-md bg-slate-900/90 border border-purple-400/40 text-purple-300 shadow-sm">
            <Layers size={14} />
          </div>
        </div>
      ),
      description: 'UI Engine berbasis Gluestack UI native untuk frontline operator bergerak, inspeksi QC tablet, dan layout bebas X-Y.',
      features: [
        { icon: <Smartphone size={13} />, text: 'Gluestack UI Native Engine' },
        { icon: <Tablet size={13} />, text: 'Free X-Y & Responsive Mobile Grid' },
        { icon: <Zap size={13} />, text: 'Camera Barcode & Touch Ready' }
      ]
    },
    {
      id: 'sandbox_builder',
      num: '3',
      key: 'sandbox',
      title: 'Generatif — Sandbox App Builder',
      badge: 'Generatif AI',
      category: 'Vibe Sandpack AI Code Generator',
      path: '/sandbox',
      isActive: isSandboxActive,
      theme: {
        glow: 'hover:border-amber-500/80 hover:shadow-amber-500/20',
        badgeBg: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
        iconBg: 'bg-gradient-to-br from-amber-500 via-orange-500 to-emerald-500 shadow-amber-500/30',
        buttonBg: 'bg-gradient-to-r from-amber-500 via-orange-500 to-emerald-600 hover:from-amber-400 hover:to-emerald-500 text-white shadow-amber-600/30',
        borderActive: 'border-amber-500 ring-2 ring-amber-500/30 bg-amber-950/20'
      },
      icon: (
        <div className="relative">
          <Sparkles size={32} className="text-white drop-shadow" />
          <div className="absolute -bottom-1.5 -right-1.5 p-1 rounded-md bg-slate-900/90 border border-amber-400/40 text-amber-300 shadow-sm">
            <Bot size={14} />
          </div>
        </div>
      ),
      description: 'Sintesis aplikasi React MES secara instan menggunakan AI Prompt Engine dan Sandpack live interactive code sandbox.',
      features: [
        { icon: <BrainCircuit size={13} />, text: 'AI Prompt-to-React Generator' },
        { icon: <Wand2 size={13} />, text: 'Live Interactive Sandpack Runner' },
        { icon: <Sparkles size={13} />, text: 'Otonom Code Synthesis & Preview' }
      ]
    }
  ];

  return (
    <div
      className="fixed inset-0 z-[100000] flex items-center justify-center p-4 sm:p-6 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="builder-modal-title"
    >
      <div
        className="relative w-full max-w-5xl bg-slate-900/95 border border-slate-700/80 rounded-2xl shadow-2xl shadow-black/80 overflow-hidden text-slate-100 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient Top Glow */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-amber-500" />
        <div className="absolute -top-24 left-1/4 w-96 h-32 bg-blue-500/10 blur-3xl rounded-full pointer-events-none" />
        <div className="absolute -top-24 right-1/4 w-96 h-32 bg-purple-500/10 blur-3xl rounded-full pointer-events-none" />

        {/* Modal Header */}
        <div className="relative flex items-start justify-between px-6 pt-6 pb-4 border-b border-slate-800/80">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase bg-slate-800/80 border border-slate-700/60 text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Suite App Builder • 3 Pilihan Lingkungan
            </div>
            <h2 id="builder-modal-title" className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
              <span>Pilih Lingkungan App Builder</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
              MaviCore menyediakan 3 arsitektur builder khusus. Pilih studio yang sesuai dengan kebutuhan PC MES, Mobile Operator, atau AI Generatif.
            </p>
          </div>

          <button
            onClick={onClose}
            className="shrink-0 flex items-center justify-center w-9 h-9 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-all border border-slate-700/60 shadow-sm group"
            title="Tutup (Esc)"
          >
            <X size={18} className="group-hover:rotate-90 transition-transform duration-200" />
          </button>
        </div>

        {/* Modal Body: 3 Builder Cards */}
        <div className="relative p-6 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {builders.map((builder) => (
              <div
                key={builder.id}
                onClick={() => handleNavigate(builder.path)}
                className={`relative group flex flex-col justify-between rounded-xl p-5 bg-slate-800/50 border transition-all duration-300 cursor-pointer shadow-lg hover:shadow-2xl hover:-translate-y-1 ${
                  builder.isActive
                    ? builder.theme.borderActive
                    : `border-slate-700/70 hover:bg-slate-800/90 ${builder.theme.glow}`
                }`}
              >
                {/* Active Indicator Badge */}
                {builder.isActive && (
                  <div className="absolute -top-3 right-4 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider uppercase bg-emerald-500 text-slate-950 shadow-md flex items-center gap-1">
                    <CheckCircle2 size={11} className="stroke-[3]" />
                    Aktif Saat Ini
                  </div>
                )}

                {/* Card Top: Number & Badge */}
                <div>
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <span className="w-6 h-6 rounded-lg bg-slate-700/60 border border-slate-600/50 text-[11px] font-black text-slate-300 flex items-center justify-center font-mono">
                      {builder.num}
                    </span>
                    <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-md border tracking-wide uppercase ${builder.theme.badgeBg}`}>
                      {builder.badge}
                    </span>
                  </div>

                  {/* Icon & Title */}
                  <div className="flex items-start gap-4 mb-3">
                    <div className={`shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-105 ${builder.theme.iconBg}`}>
                      {builder.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base font-bold text-white group-hover:text-blue-300 transition-colors leading-snug">
                        {builder.title}
                      </h3>
                      <div className="text-[11px] font-medium text-slate-400 mt-0.5">
                        {builder.category}
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-300/90 leading-relaxed mb-4 min-h-[48px]">
                    {builder.description}
                  </p>

                  {/* Features List */}
                  <div className="space-y-2 mb-5 pt-3 border-t border-slate-700/50">
                    {builder.features.map((feature, fIdx) => (
                      <div key={fIdx} className="flex items-center gap-2 text-[11px] text-slate-300 font-medium">
                        <span className="text-slate-400 shrink-0">{feature.icon}</span>
                        <span className="truncate">{feature.text}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-4 border-t border-slate-700/50 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNavigate(builder.path, false);
                    }}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all duration-200 shadow-md ${builder.theme.buttonBg}`}
                  >
                    <span>Buka Builder</span>
                    <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNavigate(builder.path, true);
                    }}
                    className="p-2.5 rounded-xl bg-slate-700/50 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-600/50 transition-colors shadow-sm"
                    title="Buka di Tab Baru"
                  >
                    <ExternalLink size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-950/80 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="text-amber-400">💡</span>
            <span>Semua builder tersinkronisasi otomatis dengan runtime MaviCore MES & Supabase Database.</span>
          </div>
          <div className="flex items-center gap-3 shrink-0 text-[11px] text-slate-400">
            <span>Pintasan:</span>
            <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono">[1] PC</span>
            <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono">[2] Mobile</span>
            <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono">[3] AI</span>
            <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono">[Esc] Tutup</span>
          </div>
        </div>
      </div>
    </div>
  );
}

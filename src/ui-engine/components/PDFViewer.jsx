/**
 * PDFViewer Component for GlueStack UI & App Builder
 * Digital Work Instruction (WI) & SOP Document Viewer for Shop Floor Operators
 */

import React, { useState } from 'react';
import { 
  FileText, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, 
  Maximize2, Minimize2, ExternalLink, Download, CheckCircle2, AlertTriangle, Shield 
} from 'lucide-react';

export default function PDFViewer({
  src,
  title = 'WI-042: Standar Perakitan & Torsi',
  docNo = 'SOP-MFG-2026-08',
  rev = 'Rev 2.3',
  pages = 3,
  initialPage = 1,
  showControls = true,
  height = '360px',
  className = ''
}) {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleZoomIn = () => setZoomLevel(prev => Math.min(150, prev + 25));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(75, prev - 25));
  const handlePrev = () => setCurrentPage(prev => Math.max(1, prev - 1));
  const handleNext = () => setCurrentPage(prev => Math.min(pages, prev + 1));

  return (
    <div className={`w-full bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col transition-all ${isFullscreen ? 'fixed inset-0 z-50 rounded-none h-screen' : ''} ${className}`}>
      {/* ── TOP DOCUMENT TOOLBAR ── */}
      <div className="px-3.5 py-2.5 bg-slate-900 text-white flex items-center justify-between gap-2 shrink-0 border-b border-slate-800">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/30">
            <FileText className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-white truncate leading-tight">{title}</div>
            <div className="text-[10px] text-slate-400 flex items-center gap-1.5 truncate">
              <span className="font-mono text-teal-400">{docNo}</span>
              <span>•</span>
              <span className="text-slate-300">{rev}</span>
            </div>
          </div>
        </div>

        {/* Right Tools */}
        {showControls && (
          <div className="flex items-center gap-1 shrink-0">
            {/* Page Navigation */}
            <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700 mr-1 text-[10px] font-bold">
              <button
                type="button"
                onClick={handlePrev}
                disabled={currentPage <= 1}
                className="p-1 text-slate-300 hover:text-white disabled:opacity-30 cursor-pointer"
                title="Halaman Sebelumnya"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="px-2 font-mono text-slate-200">
                {currentPage} / {pages}
              </span>
              <button
                type="button"
                onClick={handleNext}
                disabled={currentPage >= pages}
                className="p-1 text-slate-300 hover:text-white disabled:opacity-30 cursor-pointer"
                title="Halaman Berikutnya"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Zoom Controls */}
            <div className="hidden sm:flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700">
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={zoomLevel <= 75}
                className="p-1 text-slate-300 hover:text-white disabled:opacity-30 cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="px-1.5 text-[10px] font-mono text-slate-300">{zoomLevel}%</span>
              <button
                type="button"
                onClick={handleZoomIn}
                disabled={zoomLevel >= 150}
                className="p-1 text-slate-300 hover:text-white disabled:opacity-30 cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Fullscreen */}
            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Toggle Fullscreen"
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        )}
      </div>

      {/* ── DOCUMENT CONTENT VIEWER ── */}
      <div 
        className="flex-1 bg-slate-100 overflow-y-auto p-3 sm:p-4 flex items-center justify-center"
        style={{ minHeight: isFullscreen ? 'auto' : height }}
      >
        {src ? (
          <iframe
            src={src}
            title={title}
            className="w-full h-full min-h-[300px] border-none rounded-xl bg-white shadow-md"
          />
        ) : (
          /* High-Fidelity SOP / Work Instruction Sheet Simulation */
          <div 
            className="w-full max-w-2xl bg-white rounded-xl border border-slate-300 shadow-md p-5 space-y-4 transition-transform duration-150 origin-top text-slate-800"
            style={{ transform: `scale(${zoomLevel / 100})` }}
          >
            {/* Header Box of Work Instruction */}
            <div className="border border-slate-300 rounded-lg p-3 bg-slate-50 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black tracking-wider uppercase text-slate-400 block">STANDARD OPERATING PROCEDURE</span>
                <h4 className="text-sm font-black text-slate-900 leading-snug">{title}</h4>
              </div>
              <div className="text-right">
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 border border-teal-200">
                  APPROVED QC
                </span>
                <div className="text-[10px] text-slate-500 font-mono mt-0.5">HALAMAN {currentPage} DARI {pages}</div>
              </div>
            </div>

            {/* Content page by page */}
            {currentPage === 1 && (
              <div className="space-y-3">
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2 text-xs text-amber-900">
                  <Shield className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-bold">Instruksi Keselamatan Kerja (K3)</strong>
                    <span>Wajib gunakan sarung tangan nitril dan kacamata safety saat perakitan bearing primer.</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-slate-700">Langkah 1: Pemeriksaan Visual Housing</span>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Pastikan permukaan dalam silinder bebas dari gram, burr, dan kotoran oli berlebih. Lakukan pembersihan menggunakan kain micro fiber dan degreaser.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-slate-400 block text-[9px] uppercase font-bold">Standard Torsi</span>
                    <strong className="text-slate-800 text-xs">45.0 ± 2.0 Nm</strong>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-slate-400 block text-[9px] uppercase font-bold">Toleransi Gap</span>
                    <strong className="text-slate-800 text-xs">0.02 - 0.05 mm</strong>
                  </div>
                </div>
              </div>
            )}

            {currentPage === 2 && (
              <div className="space-y-3">
                <span className="text-xs font-bold text-slate-700">Langkah 2: Pemasangan Snap Ring & Seal</span>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Pasang snap ring penahan bearing menggunakan tang snap ring khusus. Pastikan terdengar bunyi 'klik' yang menandakan ring telah duduk sempurna pada alur housing.
                </p>
                <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg flex items-center gap-2 text-xs text-teal-900">
                  <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                  <span>Verifikasi kelurusan snap ring 360 derajat sebelum melangkah ke proses uji tekanan.</span>
                </div>
              </div>
            )}

            {currentPage >= 3 && (
              <div className="space-y-3">
                <span className="text-xs font-bold text-slate-700">Langkah 3: Pengujian Akhir & Sign-Off</span>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Lakukan pengetesan putaran manual dengan tangan. Putaran harus halus tanpa ada grinding noise atau hambatan mekanis.
                </p>
                <div className="p-2.5 bg-slate-100 rounded-lg border border-slate-200 text-center text-xs text-slate-600">
                  Dokumen ini telah divalidasi oleh QA Engineering • MaviCore Industrial System
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── FOOTER STATUS ── */}
      <div className="px-3.5 py-1.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500 font-medium">
        <span>SOP Digital Viewer • Read Only</span>
        <span className="font-mono">Status: ACTIVE</span>
      </div>
    </div>
  );
}

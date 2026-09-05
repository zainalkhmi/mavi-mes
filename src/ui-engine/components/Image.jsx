/**
 * Image Component for GlueStack UI & App Builder
 * High-fidelity visual display for CAD drawings, defect photos, and SOP blueprints
 */

import React, { useState } from 'react';
import { Image as ImageIcon, ZoomIn, X, Download, Maximize2, AlertCircle } from 'lucide-react';

export default function Image({
  src,
  alt = 'Inspection Image',
  title,
  caption,
  aspectRatio = '16:9', // '16:9' | '4:3' | 'square' | 'auto'
  objectFit = 'cover', // 'cover' | 'contain'
  zoomable = true,
  badgeText,
  badgeVariant = 'teal', // 'teal' | 'amber' | 'rose' | 'indigo'
  rounded = 'xl',
  className = '',
  onClick
}) {
  const [isZoomed, setIsZoomed] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Aspect ratio class mapping
  const aspectClasses = {
    '16:9': 'aspect-video',
    '4:3': 'aspect-4/3',
    'square': 'aspect-square',
    'auto': 'h-auto max-h-72'
  }[aspectRatio] || 'aspect-video';

  const badgeColors = {
    teal: 'bg-teal-500/90 text-white border-teal-400',
    amber: 'bg-amber-500/90 text-white border-amber-400',
    rose: 'bg-rose-500/90 text-white border-rose-400',
    indigo: 'bg-indigo-500/90 text-white border-indigo-400'
  }[badgeVariant] || 'bg-teal-500/90 text-white border-teal-400';

  const defaultSampleImg = 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800';
  const effectiveSrc = hasError ? defaultSampleImg : (src || defaultSampleImg);

  return (
    <div className={`w-full bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden group/img transition-all ${className}`}>
      {/* Optional Top Title Bar */}
      {title && (
        <div className="px-3.5 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <ImageIcon className="w-3.5 h-3.5 text-teal-600 shrink-0" />
            <span className="text-xs font-bold text-slate-800 truncate">{title}</span>
          </div>
          {badgeText && (
            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border shadow-2xs shrink-0 ${badgeColors}`}>
              {badgeText}
            </span>
          )}
        </div>
      )}

      {/* Image Container with Hover Overlay & Zoom */}
      <div 
        className={`relative w-full bg-slate-900/5 flex items-center justify-center overflow-hidden cursor-pointer ${aspectClasses}`}
        onClick={(e) => {
          if (onClick) onClick(e);
          if (zoomable) setIsZoomed(true);
        }}
      >
        <img
          src={effectiveSrc}
          alt={alt}
          onError={() => setHasError(true)}
          className={`w-full h-full object-${objectFit} transition-transform duration-300 group-hover/img:scale-102`}
        />

        {/* Badge on top of image if no title bar */}
        {!title && badgeText && (
          <div className="absolute top-2.5 left-2.5">
            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md border shadow-2xs ${badgeColors}`}>
              {badgeText}
            </span>
          </div>
        )}

        {/* Hover zoom indicator */}
        {zoomable && (
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
            <div className="p-2 bg-white/90 backdrop-blur-xs rounded-full text-slate-800 shadow-md">
              <ZoomIn className="w-4 h-4" />
            </div>
          </div>
        )}
      </div>

      {/* Optional Caption */}
      {caption && (
        <div className="px-3.5 py-2 bg-slate-50/70 border-t border-slate-100 text-[11px] text-slate-500 font-medium">
          {caption}
        </div>
      )}

      {/* Lightbox Modal for Zoom */}
      {isZoomed && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center p-4"
          onClick={() => setIsZoomed(false)}
        >
          <div className="absolute top-4 right-4 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <a
              href={effectiveSrc}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-colors"
              title="Download / Open Full Size"
            >
              <Download className="w-5 h-5" />
            </a>
            <button
              type="button"
              onClick={() => setIsZoomed(false)}
              className="p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="max-w-4xl max-h-[85vh] rounded-2xl overflow-hidden shadow-2xl border border-white/20" onClick={(e) => e.stopPropagation()}>
            <img
              src={effectiveSrc}
              alt={alt}
              className="w-full h-auto max-h-[85vh] object-contain bg-black"
            />
          </div>

          {(title || caption) && (
            <div className="mt-3 text-center text-white" onClick={(e) => e.stopPropagation()}>
              {title && <div className="text-sm font-bold">{title}</div>}
              {caption && <div className="text-xs text-white/70 mt-0.5">{caption}</div>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

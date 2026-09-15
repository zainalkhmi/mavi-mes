/**
 * Signature Component for GlueStack UI
 * Canvas-based digital signature capture for approvals
 */

import React, { useRef, useState, useEffect } from 'react';
import { Eraser, Check, X, Download } from 'lucide-react';

export function Signature({
  value,
  onChange,
  label = 'Signature',
  placeholder = 'Sign here',
  width = 400,
  height = 200,
  strokeColor = '#0f172a',
  strokeWidth = 2,
  backgroundColor = '#ffffff',
  borderColor = '#e2e8f0',
  disabled = false,
  required = false,
  isValid = true,
  errorText,
  showClearButton = true,
  showDownloadButton = false,
  format = 'image/png', // 'image/png' | 'image/jpeg' | 'image/svg+xml'
  quality = 0.9,
  className = ''
}) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Load existing signature if provided as data URL
    if (value) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
        setHasSignature(true);
      };
      img.src = value;
    }
  }, [backgroundColor, value]);

  const getPosition = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if (e.touches && e.touches.length > 0) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e) => {
    if (disabled) return;
    if (e.cancelable) e.preventDefault();

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const pos = getPosition(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);

    setIsDrawing(true);
    setLastPos(pos);
    setHasSignature(true);
  };

  const draw = (e) => {
    if (!isDrawing || disabled) return;
    if (e.cancelable) e.preventDefault();

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const pos = getPosition(e);
    ctx.beginPath();
    ctx.moveTo(lastPos.x, lastPos.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();

    setLastPos(pos);
  };

  const stopDrawing = () => {
    if (!isDrawing) return;

    setIsDrawing(false);

    // Export signature
    const canvas = canvasRef.current;
    if (canvas) {
      const dataUrl = canvas.toDataURL(format, quality);
      onChange?.(dataUrl);
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    setHasSignature(false);
    onChange?.(null);
  };

  const downloadSignature = () => {
    if (!value) return;

    const link = document.createElement('a');
    link.download = `signature-${Date.now()}.${format.split('/')[1] || 'png'}`;
    link.href = value;
    link.click();
  };

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {label && (
        <div className="flex items-center gap-1">
          <label className={`text-xs font-bold ${isValid ? 'text-slate-700' : 'text-rose-500'}`}>
            {label}
          </label>
          {required && <span className="text-rose-500 text-xs font-bold">*</span>}
        </div>
      )}

      <div className="relative w-full">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className={`w-full border-2 rounded-xl cursor-crosshair touch-none ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          style={{
            borderColor: !isValid ? '#ef4444' : hasSignature ? '#22c55e' : borderColor,
            backgroundColor,
            maxHeight: `${height}px`,
          }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />

        {/* Placeholder */}
        {!hasSignature && !disabled && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-slate-400 text-sm font-medium">{placeholder}</span>
          </div>
        )}

        {/* Signature indicator */}
        {hasSignature && (
          <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-100 border border-emerald-300 pointer-events-none">
            <Check size={12} className="text-emerald-700 stroke-[3]" />
            <span className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider">Signed</span>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        {showClearButton && (
          <button
            type="button"
            onClick={clearSignature}
            disabled={disabled || !hasSignature}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-2xs"
          >
            <Eraser size={14} className="text-slate-500" />
            <span>Clear</span>
          </button>
        )}

        {showDownloadButton && hasSignature && (
          <button
            type="button"
            onClick={downloadSignature}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer shadow-2xs"
          >
            <Download size={14} className="text-slate-500" />
            <span>Download</span>
          </button>
        )}

        {required && !hasSignature && (
          <span className="text-xs text-rose-500 flex items-center font-medium ml-auto">
            <X size={12} className="mr-1" />
            {errorText || 'Signature is required'}
          </span>
        )}
      </div>

      {/* Validation error */}
      {!isValid && errorText && (
        <span className="text-xs text-rose-500 font-medium">{errorText}</span>
      )}
    </div>
  );
}

export default Signature;

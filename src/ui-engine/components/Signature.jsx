/**
 * Signature Component for GlueStack UI
 * Canvas-based digital signature capture for approvals
 */

import React, { useRef, useState, useEffect } from 'react';
import { Box, Text, Button } from '../components';
import { Eraser, Check, X, Download } from 'lucide-react';

export default function Signature({
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
  }, []);

  const getPosition = (e) => {
    const canvas = canvasRef.current;
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
    e.preventDefault();

    const canvas = canvasRef.current;
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
    e.preventDefault();

    const canvas = canvasRef.current;
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
    link.download = `signature-${Date.now()}.${format.split('/')[1]}`;
    link.href = value;
    link.click();
  };

  return (
    <Box className="flex flex-col gap-2">
      {label && (
        <Box className="flex items-center gap-1">
          <Text size="sm" className={`font-medium ${isValid ? 'text-slate-700' : 'text-red-500'}`}>
            {label}
          </Text>
          {required && <Text className="text-red-500">*</Text>}
        </Box>
      )}

      <Box className="relative">
        <Box
          as="canvas"
          ref={canvasRef}
          width={width}
          height={height}
          className={`border-2 rounded-xl cursor-crosshair touch-none ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          style={{
            borderColor: !isValid ? '#ef4444' : hasSignature ? '#22c55e' : borderColor,
            backgroundColor,
            maxWidth: '100%',
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
          <Box className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <Text className="text-slate-400 text-lg">{placeholder}</Text>
          </Box>
        )}

        {/* Signature indicator */}
        {hasSignature && (
          <Box
            className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-full bg-green-100"
          >
            <Check size={14} className="text-green-600" />
            <Text size="xs" className="text-green-700 font-medium">Signed</Text>
          </Box>
        )}
      </Box>

      {/* Action buttons */}
      <Box className="flex gap-2">
        {showClearButton && (
          <Button
            variant="outline"
            size="sm"
            onPress={clearSignature}
            disabled={disabled || !hasSignature}
          >
            <Button.Icon as={Eraser} />
            <Button.Text>Clear</Button.Text>
          </Button>
        )}

        {showDownloadButton && hasSignature && (
          <Button
            variant="outline"
            size="sm"
            onPress={downloadSignature}
          >
            <Button.Icon as={Download} />
            <Button.Text>Download</Button.Text>
          </Button>
        )}

        {required && !hasSignature && (
          <Text size="xs" className="text-red-500 flex items-center">
            <X size={12} className="mr-1" />
            {errorText || 'Signature is required'}
          </Text>
        )}
      </Box>

      {/* Validation error */}
      {!isValid && errorText && (
        <Text size="xs" className="text-red-500">{errorText}</Text>
      )}
    </Box>
  );
}

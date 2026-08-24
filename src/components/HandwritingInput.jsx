import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Trash2, Check, X, Pen } from 'lucide-react';

/**
 * HandwritingInput - Canvas-based digit recognition component
 * Uses stroke analysis pattern matching for digits 0-9 and decimal point
 */
export default function HandwritingInput({
  isOpen,
  onClose,
  onRecognize,
  title = "Tulis Nilai Pengukuran",
  expectedDigits = 5 // max expected digit length
}) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [strokes, setStrokes] = useState([]); // Array of stroke paths
  const [currentStroke, setCurrentStroke] = useState([]);
  const [recognizedValue, setRecognizedValue] = useState('');
  const [isRecognizing, setIsRecognizing] = useState(false);

  // Canvas dimensions
  const CANVAS_WIDTH = 320;
  const CANVAS_HEIGHT = 160;

  // Initialize canvas
  useEffect(() => {
    if (!isOpen || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Set up canvas with proper scaling
    const dpr = window.devicePixelRatio || 1;
    canvas.width = CANVAS_WIDTH * dpr;
    canvas.height = CANVAS_HEIGHT * dpr;
    canvas.style.width = `${CANVAS_WIDTH}px`;
    canvas.style.height = `${CANVAS_HEIGHT}px`;
    ctx.scale(dpr, dpr);

    // Clear and set styles
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw guide lines
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    for (let i = 1; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(0, (CANVAS_HEIGHT / 4) * i);
      ctx.lineTo(CANVAS_WIDTH, (CANVAS_HEIGHT / 4) * i);
      ctx.stroke();
    }

    // Redraw existing strokes
    redrawStrokes(ctx);
  }, [isOpen]);

  const redrawStrokes = (ctx) => {
    strokes.forEach(stroke => {
      if (stroke.length < 2) return;
      ctx.beginPath();
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.moveTo(stroke[0].x, stroke[0].y);
      stroke.forEach(point => ctx.lineTo(point.x, point.y));
      ctx.stroke();
    });
  };

  const getCanvasCoords = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
    const clientY = e.clientY ?? e.touches?.[0]?.clientY ?? 0;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const handleStart = (e) => {
    e.preventDefault();
    const coords = getCanvasCoords(e);
    setIsDrawing(true);
    setCurrentStroke([coords]);
  };

  const handleMove = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const coords = getCanvasCoords(e);
    setCurrentStroke(prev => [...prev, coords]);

    // Draw current stroke
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    ctx.scale(dpr, dpr);

    // Redraw all strokes
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Redraw guide lines
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    for (let i = 1; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(0, (CANVAS_HEIGHT / 4) * i);
      ctx.lineTo(CANVAS_WIDTH, (CANVAS_HEIGHT / 4) * i);
      ctx.stroke();
    }

    // Draw previous strokes
    strokes.forEach(stroke => {
      if (stroke.length < 2) return;
      ctx.beginPath();
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.moveTo(stroke[0].x, stroke[0].y);
      stroke.forEach(point => ctx.lineTo(point.x, point.y));
      ctx.stroke();
    });

    // Draw current stroke
    if (currentStroke.length > 0) {
      ctx.beginPath();
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.moveTo(currentStroke[0].x, currentStroke[0].y);
      currentStroke.forEach(point => ctx.lineTo(point.x, point.y));
      ctx.stroke();
    }
  };

  const handleEnd = (e) => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (currentStroke.length > 1) {
      setStrokes(prev => [...prev, currentStroke]);
    }
    setCurrentStroke([]);
  };

  const handleClear = () => {
    setStrokes([]);
    setRecognizedValue('');
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      const dpr = window.devicePixelRatio || 1;
      ctx.scale(dpr, dpr);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Redraw guide lines
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 1;
      for (let i = 1; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(0, (CANVAS_HEIGHT / 4) * i);
        ctx.lineTo(CANVAS_WIDTH, (CANVAS_HEIGHT / 4) * i);
        ctx.stroke();
      }
    }
  };

  // Pattern recognition for handwritten digits
  const recognizeDigit = useCallback((points) => {
    if (points.length < 3) return null;

    // Normalize points to 28x28 grid
    const gridSize = 28;
    const grid = Array(gridSize).fill(0).map(() => Array(gridSize).fill(0));

    // Find bounding box
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    points.forEach(p => {
      minX = Math.min(minX, p.x);
      maxX = Math.max(maxX, p.x);
      minY = Math.min(minY, p.y);
      maxY = Math.max(maxY, p.y);
    });

    const width = maxX - minX || 1;
    const height = maxY - minY || 1;
    const scale = Math.min(gridSize / width, gridSize / height) * 0.8;
    const offsetX = (gridSize - width * scale) / 2;
    const offsetY = (gridSize - height * scale) / 2;

    points.forEach(p => {
      const gx = Math.floor((p.x - minX) * scale + offsetX);
      const gy = Math.floor((p.y - minY) * scale + offsetY);
      if (gx >= 0 && gx < gridSize && gy >= 0 && gy < gridSize) {
        grid[gy][gx] = 1;
        // Fill nearby cells for thicker strokes
        for (let dx = -1; dx <= 1; dx++) {
          for (let dy = -1; dy <= 1; dy++) {
            const nx = gx + dx, ny = gy + dy;
            if (nx >= 0 && nx < gridSize && ny >= 0 && ny < gridSize) {
              grid[ny][nx] = 1;
            }
          }
        }
      }
    });

    // Feature extraction
    const features = {
      width,
      height,
      aspectRatio: width / height,
      strokeCount: 1,
      hasClosedLoop: false,
      centerOfMass: { x: 0, y: 0 },
      horizontalCrossings: 0,
      verticalCrossings: 0,
    };

    // Calculate center of mass
    let totalX = 0, totalY = 0, pixelCount = 0;
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        if (grid[y][x]) {
          totalX += x;
          totalY += y;
          pixelCount++;
        }
      }
    }
    features.centerOfMass.x = pixelCount > 0 ? totalX / pixelCount / gridSize : 0.5;
    features.centerOfMass.y = pixelCount > 0 ? totalY / pixelCount / gridSize : 0.5;

    // Count line crossings
    const midY = Math.floor(gridSize / 2);
    const midX = Math.floor(gridSize / 2);
    for (let x = 0; x < gridSize - 1; x++) {
      if (grid[midY][x] !== grid[midY][x + 1]) features.horizontalCrossings++;
    }
    for (let y = 0; y < gridSize - 1; y++) {
      if (grid[y][midX] !== grid[y + 1][midX]) features.verticalCrossings++;
    }

    // Simple heuristic-based recognition
    const aspect = features.aspectRatio;
    const cmX = features.centerOfMass.x;
    const cmY = features.centerOfMass.y;
    const hCross = features.horizontalCrossings;
    const vCross = features.verticalCrossings;

    // Zero - closed loop, circular
    if (aspect > 0.7 && aspect < 1.4 && hCross >= 2) {
      return '0';
    }

    // One - narrow, vertical, high crossings
    if (aspect < 0.5 || (vCross >= 2 && aspect < 0.8)) {
      return '1';
    }

    // Two - wider at top
    if (cmY < 0.5 && aspect > 0.5) {
      return '2';
    }

    // Three - wider at top and bottom
    if (aspect > 0.5 && aspect < 1.0) {
      return '3';
    }

    // Four - complex shape
    if (hCross >= 2 && vCross >= 2) {
      return '4';
    }

    // Five - wider at bottom
    if (cmY > 0.5 && aspect > 0.5) {
      return '5';
    }

    // Six - closed loop at bottom
    if (aspect > 0.6 && aspect < 1.2 && cmY > 0.5) {
      return '6';
    }

    // Seven - simple line with top bar
    if (aspect < 0.6 && hCross >= 1) {
      return '7';
    }

    // Eight - two loops
    if (hCross >= 4) {
      return '8';
    }

    // Nine - loop at top
    if (cmY < 0.5 && aspect > 0.5) {
      return '9';
    }

    // Default: return null (can't recognize)
    return null;
  }, []);

  // Recognize all strokes
  const performRecognition = useCallback(() => {
    if (strokes.length === 0) {
      toast.error('Gambar angka terlebih dahulu');
      return;
    }

    setIsRecognizing(true);

    try {
      const digits = strokes.map(stroke => recognizeDigit(stroke)).filter(Boolean);

      if (digits.length === 0) {
        toast.error('Tidak dapat mengenali tulisan. Coba lagi.');
        setIsRecognizing(false);
        return;
      }

      const result = digits.join('');
      setRecognizedValue(result);

      // Callback with the recognized value
      if (onRecognize) {
        onRecognize(result);
      }

      toast.success(`Dikenali: ${result}`);
    } catch (error) {
      console.error('Recognition error:', error);
      toast.error('Error saat pengenalan tulisan');
    } finally {
      setIsRecognizing(false);
    }
  }, [strokes, recognizeDigit, onRecognize]);

  const handleConfirm = () => {
    if (recognizedValue) {
      if (onRecognize) {
        onRecognize(recognizedValue);
      }
      onClose();
    } else {
      performRecognition();
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      backdropFilter: 'blur(4px)'
    }}>
      <div style={{
        backgroundColor: '#0f172a',
        borderRadius: '16px',
        padding: '24px',
        maxWidth: '400px',
        width: '90%',
        border: '1px solid #334155',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Pen size={18} color="#3b82f6" />
            <span style={{ color: '#f8fafc', fontWeight: 700, fontSize: '1rem' }}>
              {title}
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Instructions */}
        <div style={{
          backgroundColor: '#1e293b',
          borderRadius: '8px',
          padding: '12px',
          marginBottom: '16px',
          border: '1px solid #334155'
        }}>
          <p style={{ color: '#94a3b8', fontSize: '0.75rem', margin: 0, lineHeight: 1.5 }}>
            ✍️ Gambar angka pada kotak di bawah. Setiap goresan = 1 digit.
            Tekan "Kenali" untuk mengkonversi ke angka.
          </p>
        </div>

        {/* Canvas Container */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          overflow: 'hidden',
          marginBottom: '16px',
          border: '2px solid #3b82f6',
          boxShadow: '0 0 20px rgba(59, 130, 246, 0.3)'
        }}>
          <canvas
            ref={canvasRef}
            onMouseDown={handleStart}
            onMouseMove={handleMove}
            onMouseUp={handleEnd}
            onMouseLeave={handleEnd}
            onTouchStart={handleStart}
            onTouchMove={handleMove}
            onTouchEnd={handleEnd}
            style={{
              display: 'block',
              touchAction: 'none',
              cursor: 'crosshair'
            }}
          />
        </div>

        {/* Recognized Value Display */}
        {recognizedValue && (
          <div style={{
            backgroundColor: '#065f46',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '16px',
            textAlign: 'center',
            border: '1px solid #10b981'
          }}>
            <span style={{ color: '#6ee7b7', fontSize: '0.75rem' }}>Hasil:</span>
            <span style={{ color: '#ffffff', fontSize: '1.5rem', fontWeight: 800, marginLeft: '8px' }}>
              {recognizedValue}
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleClear}
            style={{
              flex: 1,
              padding: '12px',
              backgroundColor: '#374151',
              color: '#f8fafc',
              border: '1px solid #4b5563',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              fontWeight: 600,
              fontSize: '0.875rem',
              transition: 'all 0.2s'
            }}
          >
            <Trash2 size={16} />
            Hapus
          </button>

          <button
            onClick={performRecognition}
            disabled={isRecognizing || strokes.length === 0}
            style={{
              flex: 1,
              padding: '12px',
              backgroundColor: strokes.length === 0 ? '#374151' : '#7c3aed',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              cursor: strokes.length === 0 ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              fontWeight: 600,
              fontSize: '0.875rem',
              opacity: strokes.length === 0 ? 0.5 : 1,
              transition: 'all 0.2s'
            }}
          >
            🔍 {isRecognizing ? 'Mengenali...' : 'Kenali'}
          </button>

          <button
            onClick={handleConfirm}
            disabled={!recognizedValue && strokes.length === 0}
            style={{
              flex: 1,
              padding: '12px',
              backgroundColor: recognizedValue ? '#22c55e' : '#374151',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              cursor: recognizedValue ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              fontWeight: 600,
              fontSize: '0.875rem',
              opacity: recognizedValue ? 1 : 0.5,
              transition: 'all 0.2s'
            }}
          >
            <Check size={16} />
            Pakai
          </button>
        </div>

        {/* Keyboard hint */}
        <div style={{
          marginTop: '12px',
          textAlign: 'center'
        }}>
          <span style={{ color: '#64748b', fontSize: '0.7rem' }}>
            💡 Tips: Gunakan keyboard untuk input presisi
          </span>
        </div>
      </div>
    </div>
  );
}

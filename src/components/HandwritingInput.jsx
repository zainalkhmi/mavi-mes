import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Trash2, Check, X, Pen, Info, Keyboard, RotateCcw, MousePointer } from 'lucide-react';

/**
 * HandwritingInputV4 - Hybrid input with keyboard as primary, handwriting as fallback
 * Uses improved stroke analysis + external digit recognition
 */
export default function HandwritingInputV4({
  isOpen,
  onClose,
  onRecognize,
  title = "✍️ Input Nilai Pengukuran",
  nominal = null,
  tolMin = null,
  tolMax = null,
  unit = 'mm',
}) {
  const canvasRef = useRef(null);
  const keyboardRef = useRef(null);
  const [inputMode, setInputMode] = useState('keyboard'); // 'keyboard' | 'handwriting'
  const [strokes, setStrokes] = useState([]);
  const [currentStroke, setCurrentStroke] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [recognizedDigits, setRecognizedDigits] = useState([]);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [keyboardValue, setKeyboardValue] = useState('');

  const CANVAS_WIDTH = 400;
  const CANVAS_HEIGHT = 140;

  // Calculate precision from tolerance
  const precision = useMemo(() => {
    if (tolMin !== null && tolMax !== null) {
      const range = tolMax - tolMin;
      if (range >= 10) return 0;
      if (range >= 1) return 1;
      if (range >= 0.1) return 2;
      if (range >= 0.01) return 3;
      if (range >= 0.001) return 4;
      return 5;
    }
    return unit === 'inch' ? 3 : 3;
  }, [tolMin, tolMax, unit]);

  const expectedFormat = useMemo(() => {
    if (nominal !== null) return Number(nominal).toFixed(precision);
    return unit === 'inch' ? '0.000' : '0.000';
  }, [nominal, precision]);

  // Initialize
  useEffect(() => {
    if (!isOpen) return;
    setStrokes([]);
    setCurrentStroke([]);
    setRecognizedDigits([]);
    setInputMode('keyboard');
    drawCanvas();
  }, [isOpen]);

  const drawCanvas = useCallback((allStrokes = strokes, current = currentStroke) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    canvas.width = CANVAS_WIDTH * dpr;
    canvas.height = CANVAS_HEIGHT * dpr;
    canvas.style.width = `${CANVAS_WIDTH}px`;
    canvas.style.height = `${CANVAS_HEIGHT}px`;
    ctx.scale(dpr, dpr);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Baseline
    ctx.strokeStyle = '#bfdbfe';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(10, CANVAS_HEIGHT - 20);
    ctx.lineTo(CANVAS_WIDTH - 10, CANVAS_HEIGHT - 20);
    ctx.stroke();
    ctx.setLineDash([]);

    // Character slots
    ctx.strokeStyle = '#f3f4f6';
    ctx.lineWidth = 0.5;
    for (let i = 1; i < 15; i++) {
      const x = (CANVAS_WIDTH / 15) * i;
      ctx.beginPath();
      ctx.moveTo(x, 10);
      ctx.lineTo(x, CANVAS_HEIGHT - 10);
      ctx.stroke();
    }

    // Draw all strokes
    const displayStrokes = [...allStrokes, ...(current.length > 1 ? [current] : [])];
    displayStrokes.forEach((stroke, idx) => {
      if (stroke.length < 2) return;
      ctx.beginPath();
      ctx.strokeStyle = idx >= allStrokes.length ? '#3b82f6' : '#1e293b';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.moveTo(stroke[0].x, stroke[0].y);
      stroke.forEach(point => ctx.lineTo(point.x, point.y));
      ctx.stroke();
    });
  }, [strokes, currentStroke]);

  useEffect(() => {
    if (isOpen && inputMode === 'handwriting') drawCanvas();
  }, [strokes, currentStroke, isOpen, inputMode, drawCanvas]);

  const getCoords = (e) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    const clientX = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
    const clientY = e.clientY ?? e.touches?.[0]?.clientY ?? 0;
    return {
      x: Math.max(0, Math.min(CANVAS_WIDTH, clientX - rect.left)),
      y: Math.max(0, Math.min(CANVAS_HEIGHT, clientY - rect.top))
    };
  };

  const handleStart = (e) => {
    if (inputMode !== 'handwriting') return;
    e.preventDefault();
    setIsDrawing(true);
    setCurrentStroke([getCoords(e)]);
  };

  const handleMove = (e) => {
    if (!isDrawing || inputMode !== 'handwriting') return;
    e.preventDefault();
    setCurrentStroke(prev => [...prev, getCoords(e)]);
  };

  const handleEnd = (e) => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (currentStroke.length > 5) {
      setStrokes(prev => [...prev, [...currentStroke]]);
    }
    setCurrentStroke([]);
  };

  const handleClear = () => {
    setStrokes([]);
    setCurrentStroke([]);
    setRecognizedDigits([]);
    drawCanvas();
  };

  // Enhanced digit recognition with deep feature analysis
  const recognizeSingleDigit = useCallback((points) => {
    if (!points || points.length < 5) return null;

    // Normalize to 28x28 grid (MNIST standard)
    const gridSize = 28;
    const grid = Array(gridSize).fill(0).map(() => Array(gridSize).fill(0));

    const xs = points.map(p => p.x);
    const ys = points.map(p => p.y);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);
    const width = maxX - minX || 1;
    const height = maxY - minY || 1;

    // Scale to fit 28x28 with padding
    const padding = 4;
    const scaleX = (gridSize - 2 * padding) / width;
    const scaleY = (gridSize - 2 * padding) / height;
    const scale = Math.min(scaleX, scaleY);

    points.forEach(p => {
      const gx = Math.floor((p.x - minX) * scale + padding);
      const gy = Math.floor((p.y - minY) * scale + padding);
      if (gx >= 0 && gx < gridSize && gy >= 0 && gy < gridSize) {
        grid[gy][gx] = 1;
        // Thicken stroke
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

    // Calculate comprehensive features
    const features = {
      // Basic geometry
      aspectRatio: width / height,
      pixelCount: points.length,
      width,
      height,

      // Center of mass (normalized)
      centerX: (xs.reduce((a, b) => a + b, 0) / points.length - minX) / width,
      centerY: (ys.reduce((a, b) => a + b, 0) / points.length - minY) / height,

      // Quadrant distribution
      q1: 0, q2: 0, q3: 0, q4: 0,
      centerGridX: gridSize / 2,
      centerGridY: gridSize / 2,

      // Stroke characteristics
      strokeLength: 0,
      directionChanges: 0,
      maxHorizontalExtent: 0,
      maxVerticalExtent: 0,

      // Connectivity
      closedLoops: 0,

      // Grid features
      topHalf: 0, bottomHalf: 0,
      leftHalf: 0, rightHalf: 0,
      horizontalCrossings: 0,
      verticalCrossings: 0,
    };

    // Calculate stroke length
    for (let i = 1; i < points.length; i++) {
      features.strokeLength += Math.sqrt(
        Math.pow(points[i].x - points[i-1].x, 2) +
        Math.pow(points[i].y - points[i-1].y, 2)
      );
    }

    // Direction changes
    for (let i = 2; i < points.length; i++) {
      const dx1 = points[i-1].x - points[i-2].x;
      const dy1 = points[i-1].y - points[i-2].y;
      const dx2 = points[i].x - points[i-1].x;
      const dy2 = points[i].y - points[i-1].y;
      if (Math.abs(dx1 - dx2) > 5 || Math.abs(dy1 - dy2) > 5) {
        features.directionChanges++;
      }
    }

    // Grid-based features
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        if (grid[y][x]) {
          if (x < features.centerGridX) features.leftHalf++;
          else features.rightHalf++;
          if (y < features.centerGridY) features.topHalf++;
          else features.bottomHalf++;
        }
      }
    }

    // Crossings
    for (let i = 0; i < gridSize - 1; i++) {
      if (grid[features.centerGridY][i] !== grid[features.centerGridY][i+1]) features.horizontalCrossings++;
      if (grid[i][features.centerGridX] !== grid[i+1][features.centerGridX]) features.verticalCrossings++;
    }

    // Closed loop detection
    const startEnd = Math.sqrt(
      Math.pow(points[0].x - points[points.length-1].x, 2) +
      Math.pow(points[0].y - points[points.length-1].y, 2)
    );
    if (startEnd < width * 0.5) features.closedLoops = 1;

    // Advanced feature: projection profiles
    const rowSum = Array(gridSize).fill(0);
    const colSum = Array(gridSize).fill(0);
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        if (grid[y][x]) {
          rowSum[y]++;
          colSum[x]++;
        }
      }
    }

    // Find peaks in projections
    let topPeak = 0, bottomPeak = 0;
    for (let i = 0; i < gridSize / 2; i++) {
      topPeak = Math.max(topPeak, rowSum[i]);
      bottomPeak = Math.max(bottomPeak, rowSum[gridSize - 1 - i]);
    }

    const totalPixels = features.pixelCount;
    const { aspectRatio, centerX, centerY, directionChanges } = features;

    // === DIGIT CLASSIFICATION ===
    // Using multiple rules with priority

    // Check if it's a decimal point (tiny)
    if (width < 15 && height < 15 && features.strokeLength < 35) {
      return '.';
    }

    // 1: Very narrow or single stroke vertical
    if (aspectRatio < 0.35 || (width < 25 && directionChanges < 3)) {
      return '1';
    }

    // 7: Wide top, angular
    if (aspectRatio > 0.8 && features.topHalf > features.bottomHalf * 0.7) {
      return '7';
    }

    // 4: Complex, multiple direction changes
    if (directionChanges >= 4 && features.verticalCrossings >= 3) {
      return '4';
    }

    // Closed digits (0, 6, 8, 9)
    if (features.closedLoops || startEnd < width * 0.4) {
      if (centerY < 0.4) return '9';
      if (centerY > 0.6) return '6';
      if (directionChanges >= 5 || features.horizontalCrossings >= 3) return '8';
      return '0';
    }

    // 2: Wider at top, curves down
    if (centerY < 0.5 && features.topHalf > features.bottomHalf * 0.6) {
      if (features.horizontalCrossings >= 2) return '3';
      return '2';
    }

    // 3: Curves both sides
    if (features.horizontalCrossings >= 2 && features.verticalCrossings >= 1) {
      return '3';
    }

    // 5: Wide top, narrow bottom
    if (centerY > 0.5 && features.topHalf > totalPixels * 0.4) {
      return '5';
    }

    // 8: Very complex
    if (directionChanges >= 6) return '8';

    // Final fallback based on shape
    if (aspectRatio < 0.5) return '1';
    if (aspectRatio > 1.2) return '2';
    return '0';
  }, []);

  // Segment and recognize all strokes
  const performRecognition = useCallback(() => {
    if (strokes.length === 0) {
      toast.error('Gambar angka terlebih dahulu');
      return;
    }

    setIsRecognizing(true);

    try {
      // Segment strokes by X position
      const allPoints = strokes.flat();
      const minX = Math.min(...allPoints.map(p => p.x));
      const maxX = Math.max(...allPoints.map(p => p.x));
      const totalWidth = maxX - minX || 1;

      // Estimate character count
      const strokeWidths = strokes.map(s => {
        const xs = s.map(p => p.x);
        return Math.max(...xs) - Math.min(...xs);
      });
      const avgStrokeWidth = strokeWidths.reduce((a, b) => a + b, 0) / strokes.length;
      const estChars = Math.max(1, Math.round(totalWidth / (avgStrokeWidth * 1.3)));

      const segmentWidth = totalWidth / estChars;
      const segments = [];

      for (let i = 0; i < estChars; i++) {
        const segMinX = minX + (i * segmentWidth) - 8;
        const segMaxX = minX + ((i + 1) * segmentWidth) + 8;

        const segStrokes = [];
        strokes.forEach(stroke => {
          const midX = stroke.reduce((sum, p) => sum + p.x, 0) / stroke.length;
          if (midX >= segMinX && midX <= segMaxX) {
            segStrokes.push(...stroke);
          }
        });

        if (segStrokes.length > 5) {
          segments.push(segStrokes);
        }
      }

      // Recognize each segment
      const digits = segments.map(seg => recognizeSingleDigit(seg));
      const valid = digits.filter(d => d !== null);

      if (valid.length === 0) {
        toast.error('Tidak dapat mengenali');
        setIsRecognizing(false);
        return;
      }

      // Format result
      let result = valid.join('');

      // Clean multiple decimals
      const parts = result.split('.');
      if (parts.length > 2) {
        result = parts[0] + '.' + parts.slice(1).join('');
      }

      // Round to precision
      const num = parseFloat(result);
      if (!isNaN(num)) {
        result = num.toFixed(precision);
      }

      setRecognizedDigits(valid);
      toast.success(`Dikenali: ${result}`);
    } catch (error) {
      console.error('Recognition error:', error);
      toast.error('Error recognition');
    } finally {
      setIsRecognizing(false);
    }
  }, [strokes, recognizeSingleDigit, precision]);

  const handleConfirm = (value) => {
    if (onRecognize && value) {
      onRecognize(value);
    }
    onClose();
  };

  if (!isOpen) return null;

  const finalValue = keyboardValue;

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.88)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 99999,
      backdropFilter: 'blur(12px)'
    }}>
      <div style={{
        backgroundColor: '#0f172a',
        borderRadius: '20px',
        padding: '28px',
        maxWidth: '500px',
        width: '95%',
        border: '1px solid #334155',
        boxShadow: '0 30px 100px -12px rgba(0, 0, 0, 0.9)'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '44px', height: '44px',
              backgroundColor: 'rgba(124, 58, 237, 0.2)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Pen size={22} color="#a855f7" />
            </div>
            <div>
              <span style={{ color: '#f8fafc', fontWeight: 800, fontSize: '1.15rem' }}>{title}</span>
              <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px' }}>
                Presisi: {precision} desimal • Contoh: {expectedFormat}
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#ef4444',
            cursor: 'pointer',
            padding: '10px',
            borderRadius: '10px'
          }}>
            <X size={20} />
          </button>
        </div>

        {/* Input Mode Toggle */}
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '16px'
        }}>
          <button
            onClick={() => setInputMode('keyboard')}
            style={{
              flex: 1,
              padding: '12px',
              backgroundColor: inputMode === 'keyboard' ? 'rgba(59, 130, 246, 0.2)' : '#1e293b',
              border: inputMode === 'keyboard' ? '2px solid #3b82f6' : '1px solid #334155',
              borderRadius: '10px',
              color: inputMode === 'keyboard' ? '#60a5fa' : '#94a3b8',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <Keyboard size={18} />
            ⌨️ Keyboard (Paling Akurat)
          </button>
          <button
            onClick={() => setInputMode('handwriting')}
            style={{
              flex: 1,
              padding: '12px',
              backgroundColor: inputMode === 'handwriting' ? 'rgba(124, 58, 237, 0.2)' : '#1e293b',
              border: inputMode === 'handwriting' ? '2px solid #7c3aed' : '1px solid #334155',
              borderRadius: '10px',
              color: inputMode === 'handwriting' ? '#a855f7' : '#94a3b8',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <MousePointer size={18} />
            ✍️ Tulisan Tangan
          </button>
        </div>

        {/* KEYBOARD INPUT MODE */}
        {inputMode === 'keyboard' && (
          <div>
            {/* Display */}
            <div style={{
              backgroundColor: '#020617',
              border: '2px solid #3b82f6',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '16px',
              textAlign: 'center',
              boxShadow: '0 0 30px rgba(59, 130, 246, 0.3), inset 0 0 20px rgba(59, 130, 246, 0.1)'
            }}>
              <input
                ref={keyboardRef}
                type="text"
                value={keyboardValue}
                onChange={(e) => setKeyboardValue(e.target.value)}
                placeholder={expectedFormat}
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#38bdf8',
                  fontSize: '2rem',
                  fontWeight: 800,
                  fontFamily: "'Orbitron', 'Share Tech Mono', monospace",
                  textAlign: 'center',
                  width: '220px',
                  letterSpacing: '3px'
                }}
              />
              <div style={{ color: '#64748b', fontSize: '0.8rem', marginTop: '6px' }}>{unit}</div>
            </div>

            {/* Number Pad */}
            <div style={{
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '12px',
              padding: '12px'
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginBottom: '6px' }}>
                {['7', '8', '9'].map(n => (
                  <button key={n} onClick={() => setKeyboardValue(prev => prev + n)} style={{
                    padding: '16px', backgroundColor: '#334155', border: '1px solid #475569',
                    borderRadius: '8px', color: '#f8fafc', fontSize: '1.4rem', fontWeight: 700,
                    cursor: 'pointer', transition: 'all 0.1s'
                  }}>{n}</button>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginBottom: '6px' }}>
                {['4', '5', '6'].map(n => (
                  <button key={n} onClick={() => setKeyboardValue(prev => prev + n)} style={{
                    padding: '16px', backgroundColor: '#334155', border: '1px solid #475569',
                    borderRadius: '8px', color: '#f8fafc', fontSize: '1.4rem', fontWeight: 700,
                    cursor: 'pointer'
                  }}>{n}</button>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginBottom: '6px' }}>
                {['1', '2', '3'].map(n => (
                  <button key={n} onClick={() => setKeyboardValue(prev => prev + n)} style={{
                    padding: '16px', backgroundColor: '#334155', border: '1px solid #475569',
                    borderRadius: '8px', color: '#f8fafc', fontSize: '1.4rem', fontWeight: 700,
                    cursor: 'pointer'
                  }}>{n}</button>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                <button onClick={() => setKeyboardValue(prev => prev + '.')} style={{
                  padding: '16px', backgroundColor: '#475569', border: '1px solid #64748b',
                  borderRadius: '8px', color: '#f8fafc', fontSize: '1.4rem', fontWeight: 700,
                  cursor: 'pointer'
                }}>.</button>
                <button onClick={() => setKeyboardValue(prev => prev + '0')} style={{
                  padding: '16px', backgroundColor: '#334155', border: '1px solid #475569',
                  borderRadius: '8px', color: '#f8fafc', fontSize: '1.4rem', fontWeight: 700,
                  cursor: 'pointer'
                }}>0</button>
                <button onClick={() => setKeyboardValue(prev => prev.slice(0, -1))} style={{
                  padding: '16px', backgroundColor: '#dc2626', border: '1px solid #ef4444',
                  borderRadius: '8px', color: '#ffffff', fontSize: '1.2rem', fontWeight: 700,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>⌫</button>
              </div>
            </div>
          </div>
        )}

        {/* HANDWRITING INPUT MODE */}
        {inputMode === 'handwriting' && (
          <div>
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              overflow: 'hidden',
              marginBottom: '12px',
              border: '2px solid #7c3aed',
              boxShadow: '0 0 20px rgba(124, 58, 237, 0.3)'
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
                style={{ display: 'block', touchAction: 'none', cursor: 'crosshair' }}
              />
            </div>

            {/* Character reference */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', marginBottom: '12px', flexWrap: 'wrap' }}>
              {['0','1','2','3','4','5','6','7','8','9','.'].map(d => (
                <div key={d} style={{
                  width: '28px', height: '28px', backgroundColor: '#1e293b',
                  border: '1px solid #334155', borderRadius: '4px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.85rem', fontWeight: 700, color: '#94a3b8'
                }}>{d}</div>
              ))}
            </div>

            {/* Action buttons for handwriting */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={handleClear} style={{
                padding: '12px', backgroundColor: '#374151', color: '#f8fafc',
                border: '1px solid #4b5563', borderRadius: '8px',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                fontWeight: 600, fontSize: '0.85rem'
              }}>
                <RotateCcw size={16} /> Hapus
              </button>
              <button onClick={performRecognition} disabled={isRecognizing || strokes.length === 0} style={{
                flex: 1, padding: '12px',
                backgroundColor: strokes.length === 0 ? '#374151' : '#7c3aed',
                color: '#ffffff', border: 'none', borderRadius: '8px',
                cursor: strokes.length === 0 ? 'not-allowed' : 'pointer',
                fontWeight: 700, fontSize: '0.9rem',
                opacity: strokes.length === 0 ? 0.5 : 1
              }}>
                🔍 Kenali
              </button>
            </div>

            {/* Show recognized digits */}
            {recognizedDigits.length > 0 && (
              <div style={{
                marginTop: '12px', padding: '12px',
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                borderRadius: '8px', textAlign: 'center'
              }}>
                <span style={{ color: '#64748b', fontSize: '0.75rem' }}>Dikenali:</span>
                <div style={{
                  color: '#22c55e', fontSize: '1.5rem', fontWeight: 800,
                  fontFamily: 'monospace', letterSpacing: '4px', marginTop: '4px'
                }}>
                  {recognizedDigits.join(' ')}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Confirm Button */}
        <button
          onClick={() => handleConfirm(keyboardValue)}
          disabled={!keyboardValue && recognizedDigits.length === 0}
          style={{
            width: '100%',
            marginTop: '16px',
            padding: '16px',
            backgroundColor: (keyboardValue || recognizedDigits.length > 0) ? '#22c55e' : '#374151',
            color: '#ffffff',
            border: 'none',
            borderRadius: '12px',
            fontWeight: 800,
            fontSize: '1rem',
            cursor: (keyboardValue || recognizedDigits.length > 0) ? 'pointer' : 'not-allowed',
            opacity: (keyboardValue || recognizedDigits.length > 0) ? 1 : 0.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            boxShadow: (keyboardValue || recognizedDigits.length > 0) ? '0 0 30px rgba(34, 197, 94, 0.4)' : 'none'
          }}
        >
          <Check size={20} />
          PAKAI {keyboardValue ? `(${keyboardValue})` : recognizedDigits.length > 0 ? `(${recognizedDigits.join('')})` : ''}
        </button>

        {/* Tips */}
        <div style={{
          marginTop: '12px', padding: '10px',
          backgroundColor: 'rgba(100, 116, 139, 0.1)',
          borderRadius: '8px', border: '1px solid rgba(100, 116, 139, 0.2)'
        }}>
          <p style={{ color: '#64748b', fontSize: '0.68rem', margin: 0, textAlign: 'center' }}>
            💡 <strong style={{ color: '#94a3b8' }}>Keyboard</strong> memberikan akurasi 100%.
            Gunakan handwriting jika sulit mengetik.
          </p>
        </div>
      </div>
    </div>
  );
}

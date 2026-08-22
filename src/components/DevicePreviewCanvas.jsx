/**
 * DevicePreviewCanvas.jsx
 * High-Performance Konva Canvas dengan Device-Specific Preview
 * Supports: Smartphones, Tablets, PCs, Smartwatches, TVs, Industrial Displays
 */

import { useState, useEffect, useRef, useMemo } from 'react';
import { Stage, Layer, Rect, Text, Circle, Arc, Line, Group } from 'react-konva';
import { DEVICE_PRESETS, getPresetsByCategory } from '../utils/DevicePresets';

// Re-export for consumers of DevicePreviewCanvas
export { DEVICE_PRESETS };

/**
 * DevicePreviewCanvas - Main Component
 */
export const DevicePreviewCanvas = ({
  devicePreset = 'desktop-1080p',
  scaleMode = 'FIT', // 'FIT', 'FILL', 'ACTUAL', 'STRETCH'
  showDeviceFrame = true,
  showSafeArea = false,
  backgroundColor = '#1a1a2e',
  children,
  onReady
}) => {
  const containerRef = useRef(null);
  const stageRef = useRef(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [fps, setFps] = useState(0);

  // Get device preset
  const device = DEVICE_PRESETS[devicePreset] || DEVICE_PRESETS['desktop-1080p'];
  const { width: dw, height: dh } = device;

  // FPS tracking
  const frameCount = useRef(0);
  const lastTime = useRef(0);

  // Initialize lastTime
  useEffect(() => {
    lastTime.current = Date.now();
  }, []);

  // Calculate scaled dimensions
  const scaledDimensions = useMemo(() => {
    if (containerSize.width === 0 || containerSize.height === 0) {
      return { width: dw, height: dh, scale: 1 };
    }

    switch (scaleMode) {
      case 'FIT': {
        const scaleX = containerSize.width / dw;
        const scaleY = containerSize.height / dh;
        const scale = Math.min(scaleX, scaleY);
        return {
          width: dw * scale,
          height: dh * scale,
          scale
        };
      }
      case 'FILL': {
        const scaleX = containerSize.width / dw;
        const scaleY = containerSize.height / dh;
        const scale = Math.max(scaleX, scaleY);
        return {
          width: dw * scale,
          height: dh * scale,
          scale
        };
      }
      case 'ACTUAL': {
        return {
          width: dw,
          height: dh,
          scale: 1
        };
      }
      case 'STRETCH': {
        return {
          width: containerSize.width,
          height: containerSize.height,
          scaleX: containerSize.width / dw,
          scaleY: containerSize.height / dh
        };
      }
      default:
        return { width: dw, height: dh, scale: 1 };
    }
  }, [containerSize.width, containerSize.height, dw, dh, scaleMode]);

  // Handle container resize
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateSize = () => {
      const rect = container.getBoundingClientRect();
      setContainerSize({ width: rect.width, height: rect.height });
    };

    updateSize();

    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(container);

    return () => resizeObserver.disconnect();
  }, []);

  // FPS counter
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const delta = now - lastTime.current;
      setFps(Math.round((frameCount.current / delta) * 1000));
      frameCount.current = 0;
      lastTime.current = now;
    }, 1000);

    const countFrame = () => {
      frameCount.current++;
      requestAnimationFrame(countFrame);
    };
    const frameId = requestAnimationFrame(countFrame);

    if (onReady) onReady();

    return () => {
      clearInterval(interval);
      cancelAnimationFrame(frameId);
    };
  }, [onReady]);

  // Calculate position to center the canvas
  const canvasStyle = useMemo(() => {
    if (scaleMode === 'STRETCH') {
      return {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%'
      };
    }

    const { width, height } = scaledDimensions;
    const offsetX = (containerSize.width - width) / 2;
    const offsetY = (containerSize.height - height) / 2;

    return {
      position: 'absolute',
      left: `${offsetX}px`,
      top: `${offsetY}px`,
      width: `${width}px`,
      height: `${height}px`
    };
  }, [scaledDimensions, containerSize, scaleMode]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        backgroundColor,
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Device Info Badge */}
      <div style={{
        position: 'absolute',
        top: 10,
        left: 10,
        zIndex: 1000,
        background: 'rgba(0,0,0,0.8)',
        color: '#fff',
        padding: '8px 12px',
        borderRadius: 8,
        fontSize: 12,
        fontFamily: 'monospace',
        display: 'flex',
        flexDirection: 'column',
        gap: 4
      }}>
        <div>{device.icon} {device.name}</div>
        <div style={{ color: '#888' }}>
          {dw} × {dh}px
          {device.pixelRatio > 1 && ` @${device.pixelRatio}x`}
        </div>
        <div style={{ color: fps >= 55 ? '#22c55e' : fps >= 30 ? '#f59e0b' : '#ef4444' }}>
          FPS: {fps}
        </div>
      </div>

      {/* Scale Mode Indicator */}
      <div style={{
        position: 'absolute',
        top: 10,
        right: 10,
        zIndex: 1000,
        background: 'rgba(0,0,0,0.8)',
        color: '#fff',
        padding: '6px 10px',
        borderRadius: 6,
        fontSize: 11,
        fontFamily: 'monospace'
      }}>
        Scale: {scaleMode}
      </div>

      {/* Canvas Container */}
      <div style={canvasStyle}>
        {/* Device Frame (optional) */}
        {showDeviceFrame && device.shape !== 'round' && (
          <div style={{
            position: 'absolute',
            inset: -8,
            borderRadius: 12,
            background: '#2a2a3a',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
          }} />
        )}

        {/* Round watch frame */}
        {showDeviceFrame && device.shape === 'round' && (
          <div style={{
            position: 'absolute',
            inset: -8,
            borderRadius: '50%',
            background: '#2a2a3a',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
          }} />
        )}

        {/* Safe Area Indicator */}
        {showSafeArea && (
          <div style={{
            position: 'absolute',
            inset: 0,
            border: '2px dashed #f59e0b',
            pointerEvents: 'none',
            zIndex: 999
          }}>
            <div style={{
              position: 'absolute',
              top: device.safeArea.top,
              left: 0,
              right: 0,
              height: device.safeArea.top,
              background: 'rgba(245, 158, 11, 0.1)'
            }} />
            <div style={{
              position: 'absolute',
              bottom: device.safeArea.bottom,
              left: 0,
              right: 0,
              height: device.safeArea.bottom,
              background: 'rgba(245, 158, 11, 0.1)'
            }} />
          </div>
        )}

        {/* Konva Stage */}
        <Stage
          ref={stageRef}
          width={dw}
          height={dh}
          scaleX={scaleMode === 'STRETCH' ? scaledDimensions.scaleX : scaledDimensions.scale}
          scaleY={scaleMode === 'STRETCH' ? scaledDimensions.scaleY : scaledDimensions.scale}
          style={{
            borderRadius: device.shape === 'round' ? '50%' : 0,
            overflow: 'hidden'
          }}
        >
          {/* Background Layer */}
          <Layer listening={false}>
            <Rect
              x={0}
              y={0}
              width={dw}
              height={dh}
              fill="#ffffff"
            />

            {/* Grid pattern for alignment */}
            {Array.from({ length: Math.ceil(dw / 50) }).map((_, i) => (
              <Line
                key={`vgrid-${i}`}
                points={[i * 50, 0, i * 50, dh]}
                stroke="#f0f0f0"
                strokeWidth={1}
              />
            ))}
            {Array.from({ length: Math.ceil(dh / 50) }).map((_, i) => (
              <Line
                key={`hgrid-${i}`}
                points={[0, i * 50, dw, i * 50]}
                stroke="#f0f0f0"
                strokeWidth={1}
              />
            ))}
          </Layer>

          {/* Content Layer */}
          <Layer listening={true}>
            {children}
          </Layer>
        </Stage>
      </div>
    </div>
  );
};

/**
 * DeviceSelector - Component to select device preset
 */
export const DeviceSelector = ({ selectedDevice, onSelect }) => {
  const categories = getPresetsByCategory();

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
      padding: 16,
      background: '#1e1e2e',
      borderRadius: 12,
      maxHeight: 400,
      overflowY: 'auto'
    }}>
      {Object.entries(categories).map(([category, presets]) => (
        <div key={category}>
          <div style={{
            fontSize: 11,
            fontWeight: 600,
            color: '#888',
            textTransform: 'uppercase',
            marginBottom: 8,
            letterSpacing: 1
          }}>
            {category}
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
            gap: 8
          }}>
            {presets.map(preset => {
              const isSelected = selectedDevice === preset.key;
              return (
                <button
                  key={preset.key}
                  onClick={() => onSelect(preset.key)}
                  style={{
                    padding: '12px 8px',
                    background: isSelected ? '#3b82f6' : '#2a2a3a',
                    border: isSelected ? '2px solid #60a5fa' : '2px solid transparent',
                    borderRadius: 8,
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.15s'
                  }}
                >
                  <div style={{ fontSize: 24, marginBottom: 4 }}>{preset.icon}</div>
                  <div style={{
                    fontSize: 11,
                    color: isSelected ? '#fff' : '#ccc',
                    fontWeight: isSelected ? 600 : 400
                  }}>
                    {preset.name}
                  </div>
                  <div style={{
                    fontSize: 10,
                    color: '#888',
                    marginTop: 2
                  }}>
                    {preset.width}×{preset.height}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Demo HMI Dashboard Component
 */
export const DemoHmiDashboard = ({ deviceWidth = 1920 }) => {
  // Scale values for smaller devices
  const scale = Math.min(1, deviceWidth / 1920);
  const scaledFont = (size) => Math.max(10, Math.round(size * scale));

  return (
    <>
      {/* Header */}
      <Group y={20 * scale}>
        <Rect
          x={40 * scale}
          y={0}
          width={deviceWidth - 80 * scale}
          height={60 * scale}
          fill="#1e293b"
          cornerRadius={8 * scale}
        />
        <Text
          x={60 * scale}
          y={15 * scale}
          text="🏭 INDUSTRIAL HMI"
          fontSize={scaledFont(28)}
          fontStyle="bold"
          fill="#ffffff"
        />
        <Circle
          x={deviceWidth - 100 * scale}
          y={30 * scale}
          radius={12 * scale}
          fill="#22c55e"
        />
      </Group>

      {/* Gauges Row */}
      {[0, 1, 2].map((i) => {
        const x = 40 * scale + i * (deviceWidth / 3 - 40 * scale);
        const values = [
          { label: 'TEMP', value: 45 + i * 10, max: 100, unit: '°C', color: '#ef4444' },
          { label: 'PSI', value: 120 + i * 20, max: 200, unit: 'PSI', color: '#f59e0b' },
          { label: 'RPM', value: 1500 + i * 200, max: 3000, unit: 'RPM', color: '#22c55e' }
        ][i];

        return (
          <Group key={i} x={x} y={100 * scale}>
            {/* Card */}
            <Rect
              width={deviceWidth / 3 - 80 * scale}
              height={200 * scale}
              fill="#1e293b"
              cornerRadius={8 * scale}
            />
            {/* Title */}
            <Text
              x={20 * scale}
              y={15 * scale}
              text={values.label}
              fontSize={scaledFont(18)}
              fontStyle="bold"
              fill="#94a3b8"
            />
            {/* Gauge */}
            <Arc
              x={(deviceWidth / 3 - 80 * scale) / 2}
              y={100 * scale}
              angle={270}
              rotation={-135}
              innerRadius={50 * scale}
              outerRadius={70 * scale}
              fill="#374151"
            />
            <Arc
              x={(deviceWidth / 3 - 80 * scale) / 2}
              y={100 * scale}
              angle={(values.value / values.max) * 270}
              rotation={-135}
              innerRadius={50 * scale}
              outerRadius={70 * scale}
              fill={values.color}
            />
            {/* Value */}
            <Text
              x={(deviceWidth / 3 - 80 * scale) / 2 - 40 * scale}
              y={90 * scale}
              text={`${values.value}${values.unit}`}
              fontSize={scaledFont(24)}
              fontStyle="bold"
              fontFamily="monospace"
              fill={values.color}
            />
          </Group>
        );
      })}

      {/* Status Panel */}
      <Group x={40 * scale} y={320 * scale}>
        <Rect
          width={deviceWidth - 80 * scale}
          height={100 * scale}
          fill="#1e293b"
          cornerRadius={8 * scale}
        />
        <Text
          x={20 * scale}
          y={15 * scale}
          text="SYSTEM STATUS"
          fontSize={scaledFont(16)}
          fontStyle="bold"
          fill="#94a3b8"
        />
        {/* Status LEDs */}
        {['Motor', 'Conveyor', 'Sensor', 'Valve'].map((item, i) => (
          <Group key={item} x={20 * scale + i * ((deviceWidth - 160 * scale) / 4)} y={45 * scale}>
            <Circle
              radius={10 * scale}
              fill="#22c55e"
            />
            <Text
              x={25 * scale}
              y={-2 * scale}
              text={item}
              fontSize={scaledFont(12)}
              fill="#fff"
            />
          </Group>
        ))}
      </Group>
    </>
  );
};

export default DevicePreviewCanvas;

// Alias for backward compatibility
export const KonvaHmiDashboard = DemoHmiDashboard;

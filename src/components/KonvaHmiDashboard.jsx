/**
 * KonvaHmiDashboard.jsx - High Performance Konva.js HMI Dashboard
 * Demo implementation for industrial terminal with 60fps rendering
 */

import React, { useState, useEffect, useRef } from 'react';
import { Stage, Layer, Rect, Text, Circle, Arc, Line, Group } from 'react-konva';

/**
 * KonvaHmiDashboard - Main HMI Dashboard Component
 * Optimized for industrial terminal displays
 */
const KonvaHmiDashboard = ({
  designWidth = 1920,
  designHeight = 1080,
  scaleMode = 'FIT', // 'FIT', 'FILL', 'STRETCH'
  backgroundColor = '#0f172a',
  data = {} // PLC/variable data
}) => {
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: designWidth, height: designHeight });
  const [scale, setScale] = useState({ x: 1, y: 1 });

  // FPS tracking
  const [fps, setFps] = useState(0);
  const frameCount = useRef(0);
  const lastTime = useRef(0);

  // Initialize lastTime
  useEffect(() => {
    lastTime.current = Date.now();
  }, []);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current) return;

      const containerWidth = containerRef.current.clientWidth;
      const containerHeight = containerRef.current.clientHeight;

      let newScale = { x: 1, y: 1 };

      if (scaleMode === 'FIT') {
        const scaleX = containerWidth / designWidth;
        const scaleY = containerHeight / designHeight;
        const minScale = Math.min(scaleX, scaleY);
        newScale = { x: minScale, y: minScale };
      } else if (scaleMode === 'FILL') {
        const scaleX = containerWidth / designWidth;
        const scaleY = containerHeight / designHeight;
        const maxScale = Math.max(scaleX, scaleY);
        newScale = { x: maxScale, y: maxScale };
      } else {
        newScale = {
          x: containerWidth / designWidth,
          y: containerHeight / designHeight
        };
      }

      setDimensions({ width: containerWidth, height: containerHeight });
      setScale(newScale);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [designWidth, designHeight, scaleMode]);

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

    return () => {
      clearInterval(interval);
      cancelAnimationFrame(frameId);
    };
  }, []);

  // Get values from data prop
  const getValue = (key, defaultValue = 0) => {
    return data[key] !== undefined ? data[key] : defaultValue;
  };

  // Color based on thresholds
  const getStatusColor = (value, warning, critical) => {
    if (value >= critical) return '#ef4444';
    if (value >= warning) return '#f59e0b';
    return '#22c55e';
  };

  // Scale value to percentage
  const toPercent = (value, min, max) => {
    return Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
  };

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        backgroundColor,
        overflow: 'hidden',
        position: 'relative',
        fontFamily: 'sans-serif'
      }}
    >
      {/* FPS Counter */}
      <div style={{
        position: 'absolute',
        top: 10,
        right: 10,
        zIndex: 100,
        background: 'rgba(0,0,0,0.7)',
        color: fps >= 50 ? '#22c55e' : fps >= 30 ? '#f59e0b' : '#ef4444',
        padding: '4px 8px',
        borderRadius: 4,
        fontSize: 12,
        fontFamily: 'monospace'
      }}>
        FPS: {fps}
      </div>

      <Stage
        width={dimensions.width}
        height={dimensions.height}
        scaleX={scale.x}
        scaleY={scale.y}
        style={{ position: 'absolute', top: 0, left: 0 }}
      >
        {/* Background Layer */}
        <Layer listening={false}>
          {/* Main background */}
          <Rect
            x={0} y={0}
            width={designWidth} height={designHeight}
            fill={backgroundColor}
          />

          {/* Grid pattern */}
          {Array.from({ length: Math.ceil(designWidth / 50) }).map((_, i) => (
            <Line
              key={`vgrid-${i}`}
              points={[i * 50, 0, i * 50, designHeight]}
              stroke="#1e293b"
              strokeWidth={1}
            />
          ))}
          {Array.from({ length: Math.ceil(designHeight / 50) }).map((_, i) => (
            <Line
              key={`hgrid-${i}`}
              points={[0, i * 50, designWidth, i * 50]}
              stroke="#1e293b"
              strokeWidth={1}
            />
          ))}
        </Layer>

        {/* Main Content Layer */}
        <Layer listening={false}>
          {/* Header Bar */}
          <Rect
            x={0} y={0}
            width={designWidth} height={80}
            fill="#1e293b"
          />

          {/* Header Title */}
          <Text
            x={30} y={25}
            text="🏭 INDUSTRIAL HMI DASHBOARD"
            fontSize={28}
            fontStyle="bold"
            fill="#ffffff"
          />

          {/* Status Indicator */}
          <Circle
            x={designWidth - 100} y={40}
            radius={15}
            fill={getValue('systemStatus', 1) ? '#22c55e' : '#ef4444'}
          />
          <Text
            x={designWidth - 70} y={30}
            text={getValue('systemStatus', 1) ? 'ONLINE' : 'OFFLINE'}
            fontSize={16}
            fontStyle="bold"
            fill={getValue('systemStatus', 1) ? '#22c55e' : '#ef4444'}
          />

          {/* Time Display */}
          <Text
            x={designWidth - 300} y={30}
            text={new Date().toLocaleTimeString()}
            fontSize={20}
            fontFamily="monospace"
            fill="#94a3b8"
          />

          {/* === GAUGE 1: Temperature === */}
          <Group x={100} y={150}>
            {/* Card Background */}
            <Rect
              width={400} height={320}
              fill="#1e293b"
              cornerRadius={12}
            />

            {/* Title */}
            <Text
              x={20} y={20}
              text="🌡️ TEMPERATURE"
              fontSize={18}
              fontStyle="bold"
              fill="#94a3b8"
            />

            {/* Gauge */}
            <Arc
              x={200} y={160}
              angle={270}
              rotation={-135}
              innerRadius={80}
              outerRadius={110}
              fill="#374151"
            />
            <Arc
              x={200} y={160}
              angle={toPercent(getValue('temperature', 45), 0, 100) * 2.7}
              rotation={-135}
              innerRadius={80}
              outerRadius={110}
              fill={getStatusColor(getValue('temperature', 45), 70, 85)}
            />

            {/* Value */}
            <Text
              x={140} y={140}
              text={`${getValue('temperature', 45).toFixed(1)}°C`}
              fontSize={36}
              fontStyle="bold"
              fontFamily="monospace"
              fill={getStatusColor(getValue('temperature', 45), 70, 85)}
            />

            {/* Range Labels */}
            <Text x={90} y={270} text="0°C" fontSize={12} fill="#64748b" />
            <Text x={290} y={270} text="100°C" fontSize={12} fill="#64748b" />
          </Group>

          {/* === GAUGE 2: Pressure === */}
          <Group x={550} y={150}>
            <Rect width={400} height={320} fill="#1e293b" cornerRadius={12} />

            <Text x={20} y={20} text="⚡ PRESSURE" fontSize={18} fontStyle="bold" fill="#94a3b8" />

            <Arc
              x={200} y={160}
              angle={270}
              rotation={-135}
              innerRadius={80}
              outerRadius={110}
              fill="#374151"
            />
            <Arc
              x={200} y={160}
              angle={toPercent(getValue('pressure', 120), 0, 200) * 2.7}
              rotation={-135}
              innerRadius={80}
              outerRadius={110}
              fill={getStatusColor(getValue('pressure', 120), 150, 180)}
            />

            <Text
              x={140} y={140}
              text={`${getValue('pressure', 120).toFixed(1)} PSI`}
              fontSize={36}
              fontStyle="bold"
              fontFamily="monospace"
              fill={getStatusColor(getValue('pressure', 120), 150, 180)}
            />

            <Text x={90} y={270} text="0 PSI" fontSize={12} fill="#64748b" />
            <Text x={270} y={270} text="200 PSI" fontSize={12} fill="#64748b" />
          </Group>

          {/* === GAUGE 3: Speed/RPM === */}
          <Group x={1000} y={150}>
            <Rect width={400} height={320} fill="#1e293b" cornerRadius={12} />

            <Text x={20} y={20} text="🔄 MOTOR SPEED" fontSize={18} fontStyle="bold" fill="#94a3b8" />

            <Arc
              x={200} y={160}
              angle={270}
              rotation={-135}
              innerRadius={80}
              outerRadius={110}
              fill="#374151"
            />
            <Arc
              x={200} y={160}
              angle={toPercent(getValue('motorRpm', 1500), 0, 3000) * 2.7}
              rotation={-135}
              innerRadius={80}
              outerRadius={110}
              fill={getStatusColor(getValue('motorRpm', 1500), 2500, 2800)}
            />

            <Text
              x={140} y={140}
              text={`${Math.round(getValue('motorRpm', 1500))} RPM`}
              fontSize={36}
              fontStyle="bold"
              fontFamily="monospace"
              fill={getStatusColor(getValue('motorRpm', 1500), 2500, 2800)}
            />

            <Text x={90} y={270} text="0" fontSize={12} fill="#64748b" />
            <Text x={270} y={270} text="3000" fontSize={12} fill="#64748b" />
          </Group>

          {/* === STATUS PANEL === */}
          <Group x={1450} y={150}>
            <Rect width={420} height={320} fill="#1e293b" cornerRadius={12} />

            <Text x={20} y={20} text="📊 SYSTEM STATUS" fontSize={18} fontStyle="bold" fill="#94a3b8" />

            {/* Status Items */}
            {['Motor', 'Conveyor', 'Sensor', 'Valve'].map((item, i) => {
              const isOn = getValue(`${item.toLowerCase()}Status`, i < 3);
              return (
                <Group key={item} y={60 + i * 60}>
                  <Circle
                    x={30} y={10}
                    radius={10}
                    fill={isOn ? '#22c55e' : '#ef4444'}
                  />
                  <Text x={55} y={0} text={item} fontSize={16} fill="#ffffff" />
                  <Text x={55} y={20} text={isOn ? 'Running' : 'Stopped'} fontSize={12} fill="#64748b" />
                </Group>
              );
            })}
          </Group>

          {/* === PRODUCTION COUNTER === */}
          <Group x={100} y={520}>
            <Rect width={550} height={200} fill="#1e293b" cornerRadius={12} />

            <Text x={20} y={20} text="📦 PRODUCTION COUNTER" fontSize={18} fontStyle="bold" fill="#94a3b8" />

            {/* Current Count */}
            <Text x={20} y={70} text="Total Output" fontSize={14} fill="#64748b" />
            <Text x={20} y={100} text={getValue('totalOutput', 1247).toLocaleString()} fontSize={48} fontStyle="bold" fontFamily="monospace" fill="#22c55e" />

            {/* Target */}
            <Text x={300} y={70} text="Target" fontSize={14} fill="#64748b" />
            <Text x={300} y={100} text={getValue('targetOutput', 1500).toLocaleString()} fontSize={32} fontStyle="bold" fontFamily="monospace" fill="#94a3b8" />

            {/* Progress Bar */}
            <Rect x={20} y={160} width={510} height={20} fill="#374151" cornerRadius={10} />
            <Rect
              x={20} y={160}
              width={510 * Math.min(1, getValue('totalOutput', 1247) / getValue('targetOutput', 1500))}
              height={20}
              fill="#22c55e"
              cornerRadius={10}
            />
            <Text
              x={20} y={160}
              width={510} height={20}
              text={`${Math.round((getValue('totalOutput', 1247) / getValue('targetOutput', 1500)) * 100)}%`}
              fontSize={12}
              fontStyle="bold"
              fill="#ffffff"
              align="center"
              verticalAlign="middle"
            />
          </Group>

          {/* === OEE DISPLAY === */}
          <Group x={700} y={520}>
            <Rect width={550} height={200} fill="#1e293b" cornerRadius={12} />

            <Text x={20} y={20} text="📈 OEE METRICS" fontSize={18} fontStyle="bold" fill="#94a3b8" />

            {/* OEE Components */}
            {[
              { label: 'Availability', value: getValue('availability', 92), color: '#3b82f6' },
              { label: 'Performance', value: getValue('performance', 87), color: '#22c55e' },
              { label: 'Quality', value: getValue('quality', 98), color: '#f59e0b' }
            ].map((item, i) => (
              <Group key={item.label} x={20 + i * 175} y={60}>
                <Text x={0} y={0} text={item.label} fontSize={12} fill="#64748b" />
                <Text x={0} y={25} text={`${item.value}%`} fontSize={28} fontStyle="bold" fontFamily="monospace" fill={item.color} />

                {/* Mini bar */}
                <Rect x={0} y={65} width={150} height={10} fill="#374151" cornerRadius={5} />
                <Rect x={0} y={65} width={150 * (item.value / 100)} height={10} fill={item.color} cornerRadius={5} />
              </Group>
            ))}

            {/* Total OEE */}
            <Group x={20} y={140}>
              <Text x={0} y={0} text="TOTAL OEE" fontSize={14} fill="#94a3b8" />
              <Text
                x={0} y={20}
                text={`${Math.round((getValue('availability', 92) * getValue('performance', 87) * getValue('quality', 98)) / 10000)}%`}
                fontSize={32}
                fontStyle="bold"
                fontFamily="monospace"
                fill="#8b5cf6"
              />
            </Group>
          </Group>

          {/* === ALARM PANEL === */}
          <Group x={1300} y={520}>
            <Rect width={570} height={200} fill="#1e293b" cornerRadius={12} />

            <Text x={20} y={20} text="🚨 ACTIVE ALARMS" fontSize={18} fontStyle="bold" fill="#ef4444" />

            {/* Alarm List */}
            {getValue('alarms', []).slice(0, 3).map((alarm, i) => (
              <Group key={i} y={55 + i * 45}>
                <Rect
                  width={530} height={40}
                  fill="#7f1d1d"
                  cornerRadius={6}
                />
                <Circle x={30} y={20} radius={8} fill="#ef4444" />
                <Text x={50} y={5} text={alarm.message || `Alarm ${i + 1}`} fontSize={14} fill="#fca5a5" />
                <Text x={50} y={22} text={alarm.time || 'Just now'} fontSize={11} fill="#f87171" />
              </Group>
            ))}

            {(!getValue('alarms', []) || getValue('alarms', []).length === 0) && (
              <Text x={20} y={80} text="✓ No active alarms" fontSize={16} fill="#22c55e" />
            )}
          </Group>

          {/* === FOOTER === */}
          <Rect x={0} y={designHeight - 50} width={designWidth} height={50} fill="#0f172a" />
          <Text
            x={30} y={designHeight - 30}
            text={`MANDOR Industrial HMI | Konva.js Canvas Engine | ${dimensions.width}x${dimensions.height}`}
            fontSize={12}
            fill="#64748b"
          />
        </Layer>

        {/* Interactive Layer */}
        <Layer listening={true}>
          {/* Buttons would go here */}
        </Layer>
      </Stage>
    </div>
  );
};

export default KonvaHmiDashboard;

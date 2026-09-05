/**
 * Chart Component (Line & Bar) for GlueStack UI & App Builder
 * KPI Dashboard, OEE Trends, and Production Output Visualization
 */

import React, { useState } from 'react';
import { BarChart3, LineChart as LineChartIcon, TrendingUp, Target, Activity } from 'lucide-react';

const DEFAULT_DATA = [
  { label: '07:00', value: 42, target: 50 },
  { label: '08:00', value: 48, target: 50 },
  { label: '09:00', value: 54, target: 50 },
  { label: '10:00', value: 52, target: 50 },
  { label: '11:00', value: 58, target: 50 },
  { label: '12:00', value: 35, target: 50 },
  { label: '13:00', value: 56, target: 50 },
  { label: '14:00', value: 60, target: 50 },
];

export default function Chart({
  type = 'line', // 'line' | 'bar'
  title = 'KPI Output & Trend Produksi',
  subtitle = 'Pencapaian per jam vs Target Shift',
  data = DEFAULT_DATA,
  unit = 'pcs',
  color = '#0d9488', // teal-600
  showTarget = true,
  targetValue = 50,
  height = 200,
  className = ''
}) {
  const [chartType, setChartType] = useState(type);
  const [hoveredPoint, setHoveredPoint] = useState(null);

  const safeData = Array.isArray(data) && data.length > 0 ? data : DEFAULT_DATA;
  const values = safeData.map(d => Number(d.value) || 0);
  const maxValue = Math.max(...values, targetValue, 10) * 1.15;
  const minValue = 0;

  const totalOutput = values.reduce((a, b) => a + b, 0);
  const avgOutput = Math.round(totalOutput / values.length);
  const targetAchievement = Math.round((avgOutput / (targetValue || 1)) * 100);

  // SVG Chart Geometry
  const svgWidth = 500;
  const svgHeight = height;
  const paddingX = 40;
  const paddingTop = 25;
  const paddingBottom = 35;
  const plotWidth = svgWidth - paddingX * 2;
  const plotHeight = svgHeight - paddingTop - paddingBottom;

  const getX = (index) => paddingX + (index / (safeData.length - 1 || 1)) * plotWidth;
  const getY = (val) => paddingTop + plotHeight - ((val - minValue) / (maxValue - minValue)) * plotHeight;

  // Build Line Path
  const linePoints = safeData.map((d, i) => `${getX(i)},${getY(d.value)}`).join(' ');
  const areaPoints = `${getX(0)},${paddingTop + plotHeight} ${linePoints} ${getX(safeData.length - 1)},${paddingTop + plotHeight}`;

  const targetY = getY(targetValue);

  return (
    <div className={`w-full bg-white rounded-2xl border border-slate-200 shadow-2xs p-4 space-y-3 transition-all ${className}`}>
      {/* Header & Mode Switcher */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 leading-tight">
            {chartType === 'line' ? (
              <LineChartIcon className="w-3.5 h-3.5 text-teal-600" />
            ) : (
              <BarChart3 className="w-3.5 h-3.5 text-teal-600" />
            )}
            <span>{title}</span>
          </h4>
          {subtitle && <p className="text-[10px] text-slate-500 mt-0.5">{subtitle}</p>}
        </div>

        {/* Toggle Line / Bar */}
        <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
          <button
            type="button"
            onClick={() => setChartType('line')}
            className={`p-1 rounded-md text-xs transition-colors cursor-pointer ${
              chartType === 'line' ? 'bg-white shadow-xs text-teal-700 font-bold' : 'text-slate-400 hover:text-slate-600'
            }`}
            title="Line Chart"
          >
            <LineChartIcon className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setChartType('bar')}
            className={`p-1 rounded-md text-xs transition-colors cursor-pointer ${
              chartType === 'bar' ? 'bg-white shadow-xs text-teal-700 font-bold' : 'text-slate-400 hover:text-slate-600'
            }`}
            title="Bar Chart"
          >
            <BarChart3 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* KPI Stat Badges */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
          <span className="text-[9px] font-bold text-slate-400 uppercase block">Total Output</span>
          <strong className="text-xs font-black text-slate-800">{totalOutput} {unit}</strong>
        </div>
        <div className="p-2 bg-teal-50 rounded-xl border border-teal-100">
          <span className="text-[9px] font-bold text-teal-600 uppercase block">Rata-Rata</span>
          <strong className="text-xs font-black text-teal-800">{avgOutput} {unit}/jam</strong>
        </div>
        <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
          <span className="text-[9px] font-bold text-slate-400 uppercase block">Achievement</span>
          <strong className={`text-xs font-black ${targetAchievement >= 100 ? 'text-emerald-600' : 'text-amber-600'}`}>
            {targetAchievement}%
          </strong>
        </div>
      </div>

      {/* Responsive SVG Chart */}
      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto overflow-visible select-none"
        >
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.35" />
              <stop offset="100%" stopColor={color} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
            const y = paddingTop + plotHeight * pct;
            return (
              <line
                key={idx}
                x1={paddingX}
                y1={y}
                x2={svgWidth - paddingX}
                y2={y}
                stroke="#e2e8f0"
                strokeDasharray="3 3"
              />
            );
          })}

          {/* Target Reference Line */}
          {showTarget && (
            <g>
              <line
                x1={paddingX}
                y1={targetY}
                x2={svgWidth - paddingX}
                y2={targetY}
                stroke="#ef4444"
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />
              <text
                x={svgWidth - paddingX}
                y={targetY - 5}
                textAnchor="end"
                className="text-[9px] fill-rose-500 font-bold font-mono"
              >
                Target: {targetValue} {unit}
              </text>
            </g>
          )}

          {/* Render BAR CHART */}
          {chartType === 'bar' && safeData.map((d, i) => {
            const barWidth = Math.max(14, (plotWidth / safeData.length) * 0.55);
            const x = getX(i) - barWidth / 2;
            const y = getY(d.value);
            const h = Math.max(2, paddingTop + plotHeight - y);
            const isHovered = hoveredPoint === i;

            return (
              <g
                key={i}
                onMouseEnter={() => setHoveredPoint(i)}
                onMouseLeave={() => setHoveredPoint(null)}
                className="cursor-pointer"
              >
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={h}
                  rx="4"
                  fill={isHovered ? '#0f766e' : color}
                  className="transition-all duration-150"
                />
                <text
                  x={getX(i)}
                  y={svgHeight - 12}
                  textAnchor="middle"
                  className="text-[10px] fill-slate-400 font-medium"
                >
                  {d.label}
                </text>
              </g>
            );
          })}

          {/* Render LINE CHART */}
          {chartType === 'line' && (
            <g>
              <polygon points={areaPoints} fill="url(#chartGradient)" />
              <polyline
                points={linePoints}
                fill="none"
                stroke={color}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {safeData.map((d, i) => {
                const cx = getX(i);
                const cy = getY(d.value);
                const isHovered = hoveredPoint === i;

                return (
                  <g
                    key={i}
                    onMouseEnter={() => setHoveredPoint(i)}
                    onMouseLeave={() => setHoveredPoint(null)}
                    className="cursor-pointer"
                  >
                    <circle
                      cx={cx}
                      cy={cy}
                      r={isHovered ? 6 : 3.5}
                      fill="#ffffff"
                      stroke={color}
                      strokeWidth={isHovered ? 3 : 2}
                      className="transition-all duration-150"
                    />
                    <text
                      x={cx}
                      y={svgHeight - 12}
                      textAnchor="middle"
                      className="text-[10px] fill-slate-400 font-medium"
                    >
                      {d.label}
                    </text>
                  </g>
                );
              })}
            </g>
          )}
        </svg>

        {/* Floating Tooltip when hovered */}
        {hoveredPoint !== null && safeData[hoveredPoint] && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-2.5 py-1 rounded-lg text-[11px] font-bold shadow-lg border border-slate-700 flex items-center gap-1.5 pointer-events-none">
            <span className="text-slate-300">{safeData[hoveredPoint].label}:</span>
            <span className="text-teal-400">{safeData[hoveredPoint].value} {unit}</span>
            <span className="text-[9px] text-slate-400">
              ({Math.round(((safeData[hoveredPoint].value || 0) / targetValue) * 100)}% target)
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export { Chart as LineChart, Chart as BarChart };

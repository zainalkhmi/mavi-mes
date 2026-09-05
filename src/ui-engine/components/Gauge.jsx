/**
 * Gauge Component for GlueStack UI
 * Circular gauge/dial for RPM, temperature, speed visualization
 */

import React, { useEffect, useState } from 'react';
import { Box, Text } from '../components';

export default function Gauge({
  value = 0,
  min = 0,
  max = 100,
  label,
  unit = '',
  size = 200,
  strokeWidth = 12,
  startAngle = -135, // degrees
  endAngle = 135, // degrees
  showValue = true,
  showMinMax = true,
  showLabel = true,
  color = '#714b67', // Primary color
  trackColor = '#e2e8f0',
  warningThreshold,
  dangerThreshold,
  warningColor = '#f59e0b',
  dangerColor = '#ef4444',
  safeColor = '#22c55e',
  animationDuration = 1000,
  decimals = 0,
  formatValue,
}) {
  const [animatedValue, setAnimatedValue] = useState(0);

  useEffect(() => {
    // Animate the value
    const startValue = animatedValue;
    const endValue = value;
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / animationDuration, 1);

      // Easing function (ease-out cubic)
      const eased = 1 - Math.pow(1 - progress, 3);

      const currentValue = startValue + (endValue - startValue) * eased;
      setAnimatedValue(currentValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [value]);

  const getValueColor = (val) => {
    if (dangerThreshold !== undefined && val >= dangerThreshold) return dangerColor;
    if (warningThreshold !== undefined && val >= warningThreshold) return warningColor;
    return color;
  };

  const currentColor = getValueColor(animatedValue);
  const percentage = Math.max(0, Math.min(100, ((animatedValue - min) / (max - min)) * 100));

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const angleRange = endAngle - startAngle;
  const arcLength = (angleRange / 360) * circumference;

  // SVG arc calculation
  const centerX = size / 2;
  const centerY = size / 2;

  const polarToCartesian = (angle) => {
    const angleInRadians = ((angle - 90) * Math.PI) / 180;
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians),
    };
  };

  const createArc = (startDeg, endDeg) => {
    const start = polarToCartesian(endAngle - (angleRange - (endDeg - startAngle)));
    const end = polarToCartesian(endAngle);
    const largeArcFlag = (endDeg - startAngle) - (endAngle - angleRange) <= 180 ? 0 : 1;

    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
  };

  // Tick marks
  const tickCount = 11;
  const tickAngleRange = endAngle - startAngle;

  const displayValue = formatValue
    ? formatValue(animatedValue)
    : animatedValue.toFixed(decimals);

  return (
    <Box className="flex flex-col items-center gap-2">
      {showLabel && label && (
        <Text size="sm" className="text-slate-600 font-semibold text-center">{label}</Text>
      )}

      <Box className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background track */}
          <circle
            cx={centerX}
            cy={centerY}
            r={radius}
            fill="none"
            stroke={trackColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={`${arcLength * 0.98} ${circumference}`}
            strokeDashoffset={0}
            style={{
              transform: `rotate(${startAngle + 90}deg)`,
              transformOrigin: 'center',
            }}
          />

          {/* Warning zone */}
          {warningThreshold !== undefined && (
            <circle
              cx={centerX}
              cy={centerY}
              r={radius}
              fill="none"
              stroke={warningColor}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeOpacity={0.3}
              strokeDasharray={`${arcLength * 0.98 * Math.min(1, (warningThreshold - min) / (max - min))} ${circumference}`}
              strokeDashoffset={0}
              style={{
                transform: `rotate(${startAngle + 90}deg)`,
                transformOrigin: 'center',
              }}
            />
          )}

          {/* Danger zone */}
          {dangerThreshold !== undefined && (
            <circle
              cx={centerX}
              cy={centerY}
              r={radius}
              fill="none"
              stroke={dangerColor}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeOpacity={0.3}
              strokeDasharray={`${arcLength * 0.98 * Math.min(1, Math.max(0, (dangerThreshold - min) / (max - min)))} ${circumference}`}
              strokeDashoffset={0}
              style={{
                transform: `rotate(${startAngle + 90}deg)`,
                transformOrigin: 'center',
              }}
            />
          )}

          {/* Value arc */}
          <circle
            cx={centerX}
            cy={centerY}
            r={radius}
            fill="none"
            stroke={currentColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={`${arcLength * 0.98 * (percentage / 100)} ${circumference}`}
            strokeDashoffset={0}
            style={{
              transform: `rotate(${startAngle + 90}deg)`,
              transformOrigin: 'center',
              transition: 'stroke 0.3s ease',
            }}
          />

          {/* Tick marks */}
          {Array.from({ length: tickCount }).map((_, i) => {
            const tickAngle = startAngle + (tickAngleRange / (tickCount - 1)) * i;
            const innerRadius = radius - strokeWidth / 2 - 4;
            const outerRadius = radius - strokeWidth / 2 - 10;
            const inner = polarToCartesian(tickAngle);
            const outer = {
              x: centerX + outerRadius * Math.cos(((tickAngle - 90) * Math.PI) / 180),
              y: centerY + outerRadius * Math.sin(((tickAngle - 90) * Math.PI) / 180),
            };

            return (
              <line
                key={i}
                x1={inner.x}
                y1={inner.y}
                x2={outer.x}
                y2={outer.y}
                stroke={trackColor}
                strokeWidth={2}
                strokeLinecap="round"
              />
            );
          })}
        </svg>

        {/* Center value display */}
        <Box
          className="absolute inset-0 flex flex-col items-center justify-center"
          style={{ transform: 'rotate(0deg)' }}
        >
          {showValue && (
            <>
              <Text
                className="font-bold"
                style={{
                  fontSize: size * 0.2,
                  color: currentColor,
                  lineHeight: 1,
                }}
              >
                {displayValue}
              </Text>
              {unit && (
                <Text size="sm" className="text-slate-500 font-medium">
                  {unit}
                </Text>
              )}
            </>
          )}
        </Box>

        {/* Indicator dot */}
        <Box
          className="absolute rounded-full"
          style={{
            width: strokeWidth + 4,
            height: strokeWidth + 4,
            backgroundColor: currentColor,
            left: '50%',
            top: '50%',
            transformOrigin: 'center',
            transform: `translate(-50%, -50%) rotate(${startAngle + (angleRange * percentage / 100)}deg) translateY(-${radius}px)`,
            transition: 'transform 0.3s ease, background-color 0.3s ease',
            boxShadow: `0 0 8px ${currentColor}`,
          }}
        />
      </Box>

      {showMinMax && (
        <Box className="flex justify-between w-full px-2">
          <Text size="xs" className="text-slate-400">{min}</Text>
          <Text size="xs" className="text-slate-400">{max}</Text>
        </Box>
      )}

      {/* Status indicator */}
      <Box className="flex items-center gap-2">
        <Box
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: currentColor }}
        />
        <Text size="xs" className="text-slate-500 font-medium">
          {dangerThreshold !== undefined && animatedValue >= dangerThreshold
            ? 'CRITICAL'
            : warningThreshold !== undefined && animatedValue >= warningThreshold
              ? 'WARNING'
              : 'NORMAL'}
        </Text>
      </Box>
    </Box>
  );
}

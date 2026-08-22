/**
 * KonvaCanvas.jsx - React Component for Konva.js HMI Rendering
 * High Performance Canvas for Industrial Terminal
 */

import React, { useEffect, useRef, useState } from 'react';
import { Stage, Layer, Rect, Text, Circle, Arc, Line, Group, Image } from 'react-konva';
import Konva from 'konva';

/**
 * KonvaCanvas - Main Canvas Component
 */
export const KonvaCanvas = ({
  width = 1920,
  height = 1080,
  scaleMode = 'FIT', // 'FIT', 'FILL', 'STRETCH'
  backgroundColor = '#1a1a2e',
  children
}) => {
  const containerRef = useRef(null);
  const stageRef = useRef(null);
  const [stageSize, setStageSize] = useState({ width, height });
  const [scale, setScale] = useState({ x: 1, y: 1 });

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current) return;

      const containerWidth = containerRef.current.clientWidth;
      const containerHeight = containerRef.current.clientHeight;

      let newScale = { x: 1, y: 1 };

      if (scaleMode === 'FIT') {
        newScale = {
          x: containerWidth / width,
          y: containerHeight / height
        };
        const minScale = Math.min(newScale.x, newScale.y);
        newScale = { x: minScale, y: minScale };
      } else if (scaleMode === 'FILL') {
        newScale = {
          x: containerWidth / width,
          y: containerHeight / height
        };
        const maxScale = Math.max(newScale.x, newScale.y);
        newScale = { x: maxScale, y: maxScale };
      }

      setStageSize({ width: containerWidth, height: containerHeight });
      setScale(newScale);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [width, height, scaleMode]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        backgroundColor,
        overflow: 'hidden',
        position: 'relative'
      }}
    >
      <Stage
        ref={stageRef}
        width={stageSize.width}
        height={stageSize.height}
        scaleX={scale.x}
        scaleY={scale.y}
        style={{
          position: 'absolute',
          top: 0,
          left: 0
        }}
      >
        {children}
      </Stage>
    </div>
  );
};

/**
 * CanvasLayer - Container for canvas elements
 */
export const CanvasLayer = ({ children, listening = true }) => {
  return (
    <Layer listening={listening}>
      {children}
    </Layer>
  );
};

/**
 * CanvasRect - Rectangle component
 */
export const CanvasRect = ({
  x = 0,
  y = 0,
  width = 100,
  height = 100,
  fill = '#ffffff',
  stroke = null,
  strokeWidth = 1,
  cornerRadius = 0,
  opacity = 1,
  shadowColor = null,
  shadowBlur = 0,
  shadowOffsetX = 0,
  shadowOffsetY = 0,
  onClick,
  onDragEnd
}) => {
  return (
    <Rect
      x={x}
      y={y}
      width={width}
      height={height}
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
      cornerRadius={cornerRadius}
      opacity={opacity}
      shadowColor={shadowColor}
      shadowBlur={shadowBlur}
      shadowOffsetX={shadowOffsetX}
      shadowOffsetY={shadowOffsetY}
      onClick={onClick}
      onTap={onClick}
      draggable={!!onDragEnd}
      onDragEnd={onDragEnd}
    />
  );
};

/**
 * CanvasText - Text component
 */
export const CanvasText = ({
  x = 0,
  y = 0,
  text = '',
  fontSize = 16,
  fontFamily = 'sans-serif',
  fontStyle = 'normal',
  fill = '#ffffff',
  align = 'left',
  width = null,
  height = null,
  padding = 0,
  lineHeight = 1.2,
  rotation = 0
}) => {
  return (
    <Text
      x={x}
      y={y}
      text={text}
      fontSize={fontSize}
      fontFamily={fontFamily}
      fontStyle={fontStyle}
      fill={fill}
      align={align}
      width={width}
      height={height}
      padding={padding}
      lineHeight={lineHeight}
      rotation={rotation}
    />
  );
};

/**
 * CanvasCircle - Circle component
 */
export const CanvasCircle = ({
  x = 0,
  y = 0,
  radius = 50,
  fill = '#ffffff',
  stroke = null,
  strokeWidth = 1,
  opacity = 1
}) => {
  return (
    <Circle
      x={x}
      y={y}
      radius={radius}
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
      opacity={opacity}
    />
  );
};

/**
 * CanvasGauge - Arc Gauge component for HMI
 */
export const CanvasGauge = ({
  x = 0,
  y = 0,
  value = 0,
  min = 0,
  max = 100,
  radius = 80,
  arcAngle = 270,
  startAngle = -135,
  innerRadius = 60,
  outerRadius = 80,
  bgColor = '#333333',
  valueColor = '#00ff00',
  warningThreshold = 70,
  criticalThreshold = 90,
  showValue = true,
  showLabel = false,
  label = '',
  unit = '',
  decimals = 1
}) => {
  const percentage = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
  const valueAngle = (percentage / 100) * arcAngle;

  // Determine color based on thresholds
  let currentColor = valueColor;
  if (value >= criticalThreshold) {
    currentColor = '#ff0000';
  } else if (value >= warningThreshold) {
    currentColor = '#ffaa00';
  }

  // Calculate arc path
  const startRad = (startAngle * Math.PI) / 180;
  const endRad = ((startAngle + arcAngle) * Math.PI) / 180;

  // Background arc
  const bgPoints = [];
  for (let i = 0; i <= 64; i++) {
    const angle = startRad + (endRad - startRad) * (i / 64);
    bgPoints.push({
      x: x + radius + Math.cos(angle) * outerRadius,
      y: y + radius + Math.sin(angle) * outerRadius
    });
  }

  return (
    <Group x={x} y={y}>
      {/* Background Arc */}
      <Arc
        angle={arcAngle}
        rotation={startAngle}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        fill={bgColor}
        x={radius}
        y={radius}
      />
      {/* Value Arc */}
      <Arc
        angle={valueAngle}
        rotation={startAngle}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        fill={currentColor}
        x={radius}
        y={radius}
      />
      {/* Center Value */}
      {showValue && (
        <Text
          x={0}
          y={radius - 10}
          text={value.toFixed(decimals)}
          fontSize={28}
          fontFamily="monospace"
          fontStyle="bold"
          fill={currentColor}
          width={radius * 2}
          height={30}
          align="center"
        />
      )}
      {/* Unit */}
      {showValue && (
        <Text
          x={0}
          y={radius + 15}
          text={unit}
          fontSize={12}
          fill="#888888"
          width={radius * 2}
          height={20}
          align="center"
        />
      )}
      {/* Label */}
      {showLabel && (
        <Text
          x={0}
          y={radius * 2 + 5}
          text={label}
          fontSize={11}
          fill="#888888"
          width={radius * 2}
          height={20}
          align="center"
        />
      )}
    </Group>
  );
};

/**
 * CanvasButton - Touch-friendly button component
 */
export const CanvasButton = ({
  x = 0,
  y = 0,
  width = 120,
  height = 50,
  text = 'Button',
  fontSize = 14,
  backgroundColor = '#4a90d9',
  textColor = '#ffffff',
  cornerRadius = 8,
  onClick,
  disabled = false
}) => {
  const [isPressed, setIsPressed] = useState(false);

  const handleClick = () => {
    if (!disabled && onClick) {
      onClick();
    }
  };

  const pressedColor = disabled ? '#666666' : darkenColor(backgroundColor, 15);

  return (
    <Group
      x={x}
      y={y}
      onClick={handleClick}
      onTap={handleClick}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      onTouchStart={() => setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
    >
      <Rect
        width={width}
        height={height}
        fill={isPressed ? pressedColor : backgroundColor}
        cornerRadius={cornerRadius}
        shadowColor="rgba(0,0,0,0.3)"
        shadowBlur={4}
        shadowOffsetY={isPressed ? 1 : 2}
        opacity={disabled ? 0.6 : 1}
      />
      <Text
        x={0}
        y={0}
        width={width}
        height={height}
        text={text}
        fontSize={fontSize}
        fontFamily="sans-serif"
        fontStyle="bold"
        fill={textColor}
        align="center"
        verticalAlign="middle"
      />
    </Group>
  );
};

/**
 * CanvasLED - LED indicator component
 */
export const CanvasLED = ({
  x = 0,
  y = 0,
  radius = 12,
  isOn = false,
  onColor = '#00ff00',
  offColor = '#333333',
  glowIntensity = 8
}) => {
  const color = isOn ? onColor : offColor;
  const glowRadius = isOn ? glowIntensity : 0;

  return (
    <Group x={x} y={y}>
      {/* Glow effect when on */}
      {isOn && (
        <Circle
          radius={radius + glowRadius}
          fill={onColor}
          opacity={0.3}
        />
      )}
      {/* LED body */}
      <Circle
        radius={radius}
        fill={color}
        stroke="#555555"
        strokeWidth={2}
      />
      {/* Highlight */}
      <Circle
        x={-radius * 0.3}
        y={-radius * 0.3}
        radius={radius * 0.3}
        fill="#ffffff"
        opacity={isOn ? 0.4 : 0.1}
      />
    </Group>
  );
};

/**
 * CanvasBar - Progress/level bar component
 */
export const CanvasBar = ({
  x = 0,
  y = 0,
  width = 200,
  height = 20,
  value = 50,
  min = 0,
  max = 100,
  orientation = 'horizontal', // 'horizontal', 'vertical'
  bgColor = '#333333',
  valueColor = '#00ff00',
  warningThreshold = 70,
  criticalThreshold = 90,
  cornerRadius = 4
}) => {
  const percentage = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
  const filledWidth = (percentage / 100) * width;
  const filledHeight = (percentage / 100) * height;

  // Determine color based on thresholds
  let currentColor = valueColor;
  if (value >= criticalThreshold) {
    currentColor = '#ff0000';
  } else if (value >= warningThreshold) {
    currentColor = '#ffaa00';
  }

  if (orientation === 'vertical') {
    return (
      <Group x={x} y={y}>
        <Rect
          width={width}
          height={height}
          fill={bgColor}
          cornerRadius={cornerRadius}
        />
        <Rect
          y={height - filledHeight}
          width={width}
          height={filledHeight}
          fill={currentColor}
          cornerRadius={cornerRadius}
        />
      </Group>
    );
  }

  return (
    <Group x={x} y={y}>
      <Rect
        width={width}
        height={height}
        fill={bgColor}
        cornerRadius={cornerRadius}
      />
      <Rect
        width={filledWidth}
        height={height}
        fill={currentColor}
        cornerRadius={cornerRadius}
      />
    </Group>
  );
};

/**
 * CanvasLine - Line component
 */
export const CanvasLine = ({
  points = [0, 0, 100, 100],
  stroke = '#ffffff',
  strokeWidth = 1,
  lineCap = 'round',
  lineJoin = 'round',
  dash = null
}) => {
  return (
    <Line
      points={points}
      stroke={stroke}
      strokeWidth={strokeWidth}
      lineCap={lineCap}
      lineJoin={lineJoin}
      dash={dash}
    />
  );
};

/**
 * CanvasGroup - Group container for multiple elements
 */
export const CanvasGroup = ({
  x = 0,
  y = 0,
  rotation = 0,
  children
}) => {
  return (
    <Group x={x} y={y} rotation={rotation}>
      {children}
    </Group>
  );
};

/**
 * CanvasImage - Image component
 */
export const CanvasImage = ({
  x = 0,
  y = 0,
  width = 100,
  height = 100,
  src,
  onLoad
}) => {
  const [image, setImage] = useState(null);

  useEffect(() => {
    const img = new window.Image();
    img.src = src;
    img.onload = () => {
      setImage(img);
      if (onLoad) onLoad(img);
    };
  }, [src, onLoad]);

  if (!image) return null;

  return (
    <Image
      x={x}
      y={y}
      width={width}
      height={height}
      image={image}
    />
  );
};

// Utility function to darken color
function darkenColor(hex, percent = 20) {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max((num >> 16) - amt, 0);
  const G = Math.max((num >> 8 & 0x00FF) - amt, 0);
  const B = Math.max((num & 0x0000FF) - amt, 0);
  return `#${(1 << 24 | R << 16 | G << 8 | B).toString(16).slice(1)}`;
}

export default {
  KonvaCanvas,
  CanvasLayer,
  CanvasRect,
  CanvasText,
  CanvasCircle,
  CanvasGauge,
  CanvasButton,
  CanvasLED,
  CanvasBar,
  CanvasLine,
  CanvasGroup,
  CanvasImage
};

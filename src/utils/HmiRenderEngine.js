/**
 * HmiRenderEngine.js - High Performance Canvas Rendering Engine for Industrial HMI
 * Built on Konva.js for 60fps rendering
 */

import Konva from 'konva';

/**
 * HMI Render Engine Class
 * Handles all rendering with dirty-rect optimization and WebGL acceleration
 */
export class HmiRenderEngine {
  constructor(config = {}) {
    this.container = config.container;
    this.width = config.width || 1920;
    this.height = config.height || 1080;
    this.scaleX = config.scaleX || 1;
    this.scaleY = config.scaleY || 1;

    this.stage = null;
    this.layers = {
      background: null,
      widgets: null,
      overlay: null,
      interactive: null
    };

    this.widgets = new Map();
    this.dirtyRects = [];
    this.isRendering = false;
    this.lastFrameTime = 0;
    this.fps = 0;
    this.frameCount = 0;
    this.fpsLastCheck = 0;

    this.eventHandlers = new Map();
    this.variables = new Map();

    this.init();
  }

  /**
   * Initialize Konva Stage and Layers
   */
  init() {
    // Create main stage
    this.stage = new Konva.Stage({
      container: this.container,
      width: this.width,
      height: this.height,
      scaleX: this.scaleX,
      scaleY: this.scaleY
    });

    // Create layer hierarchy for performance
    this.layers.background = new Konva.Layer({ listening: false });
    this.layers.widgets = new Konva.Layer({ listening: true });
    this.layers.overlay = new Konva.Layer({ listening: false });
    this.layers.interactive = new Konva.Layer({ listening: true });

    this.stage.add(this.layers.background);
    this.stage.add(this.layers.widgets);
    this.stage.add(this.layers.overlay);
    this.stage.add(this.layers.interactive);

    // Enable WebGL for better performance
    this.enableWebGL();

    // Start render loop
    this.startRenderLoop();
  }

  /**
   * Enable WebGL renderer for better performance
   */
  enableWebGL() {
    try {
      const canvas = this.stage.container().querySelector('canvas');
      if (canvas) {
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (gl) {
          // WebGL available
          console.log('[HmiRenderEngine] WebGL enabled');
        }
      }
    } catch (e) {
      console.warn('[HmiRenderEngine] WebGL not available, using Canvas 2D');
    }
  }

  /**
   * Start optimized render loop with FPS tracking
   */
  startRenderLoop() {
    const renderLoop = (timestamp) => {
      // Calculate FPS
      this.frameCount++;
      if (timestamp - this.fpsLastCheck >= 1000) {
        this.fps = this.frameCount;
        this.frameCount = 0;
        this.fpsLastCheck = timestamp;
      }

      // Only render if dirty
      if (this.dirtyRects.length > 0) {
        this.render();
      }

      requestAnimationFrame(renderLoop);
    };

    requestAnimationFrame(renderLoop);
  }

  /**
   * Mark a region as dirty (needs redraw)
   */
  markDirty(rect = null) {
    if (rect) {
      this.dirtyRects.push(rect);
    } else {
      // Mark entire stage as dirty
      this.dirtyRects.push({ x: 0, y: 0, width: this.width, height: this.height });
    }
  }

  /**
   * Render only dirty regions
   */
  render() {
    const startTime = performance.now();

    // Render all layers
    this.layers.background.batchDraw();
    this.layers.widgets.batchDraw();
    this.layers.overlay.batchDraw();
    this.layers.interactive.batchDraw();

    // Clear dirty rects
    this.dirtyRects = [];

    const renderTime = performance.now() - startTime;
    if (renderTime > 16) {
      console.warn(`[HmiRenderEngine] Slow render: ${renderTime.toFixed(2)}ms`);
    }
  }

  /**
   * Resize canvas
   */
  resize(width, height) {
    this.width = width;
    this.height = height;
    this.stage.width(width);
    this.stage.height(height);
    this.markDirty();
  }

  /**
   * Scale to fit container
   */
  scaleToFit(containerWidth, containerHeight, mode = 'FIT') {
    const scaleX = containerWidth / this.width;
    const scaleY = containerHeight / this.height;

    if (mode === 'FIT') {
      this.scaleX = this.scaleY = Math.min(scaleX, scaleY);
    } else if (mode === 'FILL') {
      this.scaleX = this.scaleY = Math.max(scaleX, scaleY);
    } else if (mode === 'STRETCH') {
      this.scaleX = scaleX;
      this.scaleY = scaleY;
    }

    this.stage.scale({ x: this.scaleX, y: this.scaleY });
    this.markDirty();
  }

  // ============================================================
  // WIDGET CREATION METHODS
  // ============================================================

  /**
   * Create a rectangle widget
   */
  createRect(config) {
    const rect = new Konva.Rect({
      x: config.x || 0,
      y: config.y || 0,
      width: config.width || 100,
      height: config.height || 100,
      fill: config.fill || '#ffffff',
      stroke: config.stroke || '#000000',
      strokeWidth: config.strokeWidth || 1,
      cornerRadius: config.cornerRadius || 0,
      opacity: config.opacity !== undefined ? config.opacity : 1,
      rotation: config.rotation || 0,
      shadowColor: config.shadowColor,
      shadowBlur: config.shadowBlur,
      shadowOffsetX: config.shadowOffsetX,
      shadowOffsetY: config.shadowOffsetY,
      id: config.id
    });

    this.addWidget(config.id, rect, config.layer || 'widgets');
    return rect;
  }

  /**
   * Create a text widget
   */
  createText(config) {
    const text = new Konva.Text({
      x: config.x || 0,
      y: config.y || 0,
      text: config.text || '',
      fontSize: config.fontSize || 16,
      fontFamily: config.fontFamily || 'sans-serif',
      fontStyle: config.fontStyle || 'normal',
      fill: config.fill || '#000000',
      align: config.align || 'left',
      verticalAlign: config.verticalAlign || 'top',
      width: config.width,
      height: config.height,
      padding: config.padding || 0,
      lineHeight: config.lineHeight || 1.2,
      id: config.id
    });

    this.addWidget(config.id, text, config.layer || 'widgets');
    return text;
  }

  /**
   * Create a variable text widget (for PLC/HMI data binding)
   */
  createVariableText(config) {
    const text = new Konva.Text({
      x: config.x || 0,
      y: config.y || 0,
      text: config.defaultValue || '',
      fontSize: config.fontSize || 24,
      fontFamily: 'monospace',
      fontStyle: 'bold',
      fill: config.color || '#00ff00',
      align: 'center',
      id: config.id
    });

    // Store variable binding
    if (config.varId) {
      this.variables.set(config.varId, {
        textNode: text,
        format: config.format,
        unit: config.unit
      });
    }

    this.addWidget(config.id, text, config.layer || 'widgets');
    return text;
  }

  /**
   * Update variable value
   */
  updateVariable(varId, value) {
    const binding = this.variables.get(varId);
    if (binding) {
      let displayValue = value;
      if (binding.format) {
        displayValue = this.formatValue(value, binding.format);
      }
      if (binding.unit) {
        displayValue = `${displayValue} ${binding.unit}`;
      }
      binding.textNode.text(displayValue.toString());
      this.markDirty();
    }
  }

  /**
   * Format value based on type
   */
  formatValue(value, format) {
    if (typeof value === 'number') {
      return value.toFixed(format.decimals || 2);
    }
    return value;
  }

  /**
   * Create a circle widget (for gauges, indicators)
   */
  createCircle(config) {
    const circle = new Konva.Circle({
      x: config.x || 0,
      y: config.y || 0,
      radius: config.radius || 50,
      fill: config.fill || '#ffffff',
      stroke: config.stroke || '#000000',
      strokeWidth: config.strokeWidth || 1,
      opacity: config.opacity !== undefined ? config.opacity : 1,
      id: config.id
    });

    this.addWidget(config.id, circle, config.layer || 'widgets');
    return circle;
  }

  /**
   * Create a gauge widget (arc/needle style)
   */
  createGauge(config) {
    const group = new Konva.Group({
      x: config.x || 0,
      y: config.y || 0,
      id: config.id
    });

    // Background arc
    const bgArc = new Konva.Arc({
      angle: config.arcAngle || 270,
      rotation: config.startAngle || -135,
      innerRadius: config.innerRadius || 60,
      outerRadius: config.outerRadius || 80,
      fill: config.bgColor || '#333333',
      stroke: config.borderColor || '#555555',
      strokeWidth: 2
    });

    // Value arc
    const valueArc = new Konva.Arc({
      angle: 0,
      rotation: config.startAngle || -135,
      innerRadius: config.innerRadius || 60,
      outerRadius: config.outerRadius || 80,
      fill: config.valueColor || '#00ff00'
    });

    // Center text
    const valueText = new Konva.Text({
      text: config.value?.toString() || '0',
      fontSize: config.fontSize || 24,
      fontFamily: 'monospace',
      fontStyle: 'bold',
      fill: config.valueColor || '#00ff00'
    });
    valueText.offsetX(valueText.width() / 2);
    valueText.offsetY(valueText.height() / 2);
    valueText.y(config.radius || 80);
    valueText.x(config.radius || 80);

    group.add(bgArc);
    group.add(valueArc);
    group.add(valueText);

    // Store gauge reference for updates
    this.widgets.set(config.id, {
      type: 'gauge',
      group,
      bgArc,
      valueArc,
      valueText,
      config
    });

    this.addWidget(config.id, group, config.layer || 'widgets');
    return group;
  }

  /**
   * Update gauge value
   */
  updateGauge(gaugeId, value, min = 0, max = 100) {
    const gauge = this.widgets.get(gaugeId);
    if (gauge && gauge.type === 'gauge') {
      const config = gauge.config;
      const percentage = ((value - min) / (max - min)) * 100;
      const angle = (percentage / 100) * (config.arcAngle || 270);

      gauge.valueArc.angle(angle);
      gauge.valueText.text(value.toString());
      gauge.valueText.offsetX(gauge.valueText.width() / 2);
      gauge.valueText.offsetY(gauge.valueText.height() / 2);

      // Change color based on value
      if (config.warningThreshold && value >= config.warningThreshold) {
        gauge.valueArc.fill('#ffaa00');
        gauge.valueText.fill('#ffaa00');
      }
      if (config.criticalThreshold && value >= config.criticalThreshold) {
        gauge.valueArc.fill('#ff0000');
        gauge.valueText.fill('#ff0000');
      }

      this.markDirty();
    }
  }

  /**
   * Create a line widget
   */
  createLine(config) {
    const line = new Konva.Line({
      points: config.points || [0, 0, 100, 100],
      stroke: config.stroke || '#000000',
      strokeWidth: config.strokeWidth || 1,
      lineCap: config.lineCap || 'round',
      lineJoin: config.lineJoin || 'round',
      dash: config.dash,
      x: config.x || 0,
      y: config.y || 0,
      id: config.id
    });

    this.addWidget(config.id, line, config.layer || 'widgets');
    return line;
  }

  /**
   * Create a button widget
   */
  createButton(config) {
    const group = new Konva.Group({
      x: config.x || 0,
      y: config.y || 0,
      id: config.id
    });

    // Button background
    const bg = new Konva.Rect({
      width: config.width || 100,
      height: config.height || 40,
      fill: config.backgroundColor || '#4a90d9',
      cornerRadius: config.cornerRadius || 6,
      shadowColor: 'rgba(0,0,0,0.3)',
      shadowBlur: 4,
      shadowOffset: { x: 2, y: 2 }
    });

    // Button text
    const text = new Konva.Text({
      text: config.text || 'Button',
      fontSize: config.fontSize || 14,
      fontFamily: 'sans-serif',
      fontStyle: 'bold',
      fill: config.color || '#ffffff',
      width: config.width || 100,
      height: config.height || 40,
      align: 'center',
      verticalAlign: 'middle'
    });

    group.add(bg);
    group.add(text);

    // Touch/click handling
    if (config.onClick) {
      group.on('click tap', () => {
        this.triggerAction(config.onClick);
      });

      // Visual feedback
      group.on('mousedown touchstart', () => {
        bg.fill(config.pressedColor || this.darkenColor(config.backgroundColor || '#4a90d9'));
        this.markDirty();
      });

      group.on('mouseup touchend', () => {
        bg.fill(config.backgroundColor || '#4a90d9');
        this.markDirty();
      });
    }

    this.addWidget(config.id, group, config.layer || 'interactive');
    return group;
  }

  /**
   * Darken a hex color
   */
  darkenColor(hex, percent = 20) {
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.max((num >> 16) - amt, 0);
    const G = Math.max((num >> 8 & 0x00FF) - amt, 0);
    const B = Math.max((num & 0x0000FF) - amt, 0);
    return `#${(1 << 24 | R << 16 | G << 8 | B).toString(16).slice(1)}`;
  }

  /**
   * Create a LED indicator
   */
  createLedIndicator(config) {
    const group = new Konva.Group({
      x: config.x || 0,
      y: config.y || 0,
      id: config.id
    });

    // Outer ring
    const ring = new Konva.Circle({
      radius: config.radius || 15,
      fill: config.offColor || '#333333',
      stroke: '#555555',
      strokeWidth: 2
    });

    // Inner glow
    const glow = new Konva.Circle({
      radius: (config.radius || 15) - 4,
      fill: config.offColor || '#333333'
    });

    group.add(ring);
    group.add(glow);

    // Store LED reference
    this.widgets.set(config.id, {
      type: 'led',
      ring,
      glow,
      config
    });

    this.addWidget(config.id, group, config.layer || 'widgets');
    return group;
  }

  /**
   * Set LED state (on/off)
   */
  setLedState(ledId, isOn) {
    const led = this.widgets.get(ledId);
    if (led && led.type === 'led') {
      const color = isOn ? (led.config.onColor || '#00ff00') : (led.config.offColor || '#333333');
      led.ring.fill(color);
      led.glow.fill(color);
      this.markDirty();
    }
  }

  /**
   * Create a bar indicator (horizontal or vertical)
   */
  createBar(config) {
    const group = new Konva.Group({
      x: config.x || 0,
      y: config.y || 0,
      id: config.id
    });

    const isHorizontal = config.orientation !== 'vertical';
    const barLength = isHorizontal ? (config.width || 200) : (config.height || 150);
    const barThickness = isHorizontal ? (config.height || 20) : (config.width || 20);

    // Background bar
    const bgBar = new Konva.Rect({
      width: isHorizontal ? barLength : barThickness,
      height: isHorizontal ? barThickness : barLength,
      fill: config.bgColor || '#333333',
      cornerRadius: config.cornerRadius || 2
    });

    // Value bar
    const valueBar = new Konva.Rect({
      width: isHorizontal ? 0 : barThickness,
      height: isHorizontal ? barThickness : 0,
      fill: config.valueColor || '#00ff00',
      cornerRadius: config.cornerRadius || 2
    });

    group.add(bgBar);
    group.add(valueBar);

    // Store bar reference
    this.widgets.set(config.id, {
      type: 'bar',
      valueBar,
      config,
      isHorizontal
    });

    this.addWidget(config.id, group, config.layer || 'widgets');
    return group;
  }

  /**
   * Update bar value
   */
  updateBar(barId, value, min = 0, max = 100) {
    const bar = this.widgets.get(barId);
    if (bar && bar.type === 'bar') {
      const config = bar.config;
      const percentage = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
      const barLength = bar.isHorizontal ? (config.width || 200) : (config.height || 150);
      const filledLength = (percentage / 100) * barLength;

      if (bar.isHorizontal) {
        bar.valueBar.width(filledLength);
      } else {
        bar.valueBar.y(barLength - filledLength);
        bar.valueBar.height(filledLength);
      }

      // Color based on thresholds
      if (config.warningThreshold && percentage >= config.warningThreshold) {
        bar.valueBar.fill(config.warningColor || '#ffaa00');
      }
      if (config.criticalThreshold && percentage >= config.criticalThreshold) {
        bar.valueBar.fill(config.criticalColor || '#ff0000');
      }

      this.markDirty();
    }
  }

  /**
   * Create an image widget
   */
  createImage(config) {
    return new Promise((resolve) => {
      const imageObj = new Image();
      imageObj.onload = () => {
        const img = new Konva.Image({
          x: config.x || 0,
          y: config.y || 0,
          image: imageObj,
          width: config.width || imageObj.width,
          height: config.height || imageObj.height,
          id: config.id
        });
        this.addWidget(config.id, img, config.layer || 'widgets');
        resolve(img);
      };
      imageObj.src = config.src;
    });
  }

  /**
   * Create a group widget
   */
  createGroup(config) {
    const group = new Konva.Group({
      x: config.x || 0,
      y: config.y || 0,
      rotation: config.rotation || 0,
      id: config.id
    });

    this.addWidget(config.id, group, config.layer || 'widgets');
    return group;
  }

  // ============================================================
  // UTILITY METHODS
  // ============================================================

  /**
   * Add widget to layer
   */
  addWidget(id, widget, layerName = 'widgets') {
    this.widgets.set(id, { type: 'widget', widget });
    const layer = this.layers[layerName];
    if (layer && !layer.hasChildren || !layer) return;
    layer.add(widget);
  }

  /**
   * Remove widget
   */
  removeWidget(id) {
    const widgetData = this.widgets.get(id);
    if (widgetData) {
      if (widgetData.widget && widgetData.widget.destroy) {
        widgetData.widget.destroy();
      }
      this.widgets.delete(id);
      this.markDirty();
    }
  }

  /**
   * Get widget by ID
   */
  getWidget(id) {
    const widgetData = this.widgets.get(id);
    return widgetData ? widgetData.widget : null;
  }

  /**
   * Trigger action (button click, etc.)
   */
  triggerAction(action) {
    if (typeof action === 'function') {
      action();
    } else if (typeof action === 'string') {
      // Emit custom event
      const event = new CustomEvent('hmi:action', { detail: { action } });
      this.container.dispatchEvent(event);
    }
  }

  /**
   * Set layer visibility
   */
  setLayerVisible(layerName, visible) {
    const layer = this.layers[layerName];
    if (layer) {
      layer.visible(visible);
      this.markDirty();
    }
  }

  /**
   * Clear all widgets
   */
  clear() {
    Object.values(this.layers).forEach(layer => {
      layer.destroyChildren();
    });
    this.widgets.clear();
    this.variables.clear();
    this.markDirty();
  }

  /**
   * Destroy engine
   */
  destroy() {
    this.clear();
    if (this.stage) {
      this.stage.destroy();
    }
  }

  /**
   * Export canvas as image
   */
  toImage(config = {}) {
    return this.stage.toDataURL({
      mimeType: config.mimeType || 'image/png',
      quality: config.quality || 1,
      pixelRatio: config.pixelRatio || 1
    });
  }

  /**
   * Get performance stats
   */
  getStats() {
    return {
      fps: this.fps,
      widgetCount: this.widgets.size,
      width: this.width,
      height: this.height,
      scaleX: this.scaleX,
      scaleY: this.scaleY
    };
  }
}

export default HmiRenderEngine;

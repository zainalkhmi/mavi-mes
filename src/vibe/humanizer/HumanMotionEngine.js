/**
 * HumanMotionEngine.js
 * Advanced Humanizer Physics & Trajectory Engine for Jarvis Copilot.
 * 
 * Provides:
 * 1. Cubic Bézier mouse trajectory generation with randomized human arc.
 * 2. Fitts's Law velocity profiles (acceleration, cruising, deceleration).
 * 3. Micro-jitter and target overshoot/settle physics (like a real human hand).
 * 4. Realistic variable-speed typing cadence with natural pauses.
 * 5. Synthetic DOM event simulation (Pointer, Mouse, Input, Drop).
 */

/**
 * Generates a smooth, curved human-like Bézier trajectory between two points.
 * @param {{x: number, y: number}} start 
 * @param {{x: number, y: number}} end 
 * @param {object} [options]
 * @returns {Array<{x: number, y: number}>} Array of interpolated points
 */
export function generateHumanBezierPath(start, end, options = {}) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const distance = Math.hypot(dx, dy);

  if (distance < 5) {
    return [start, end];
  }

  // Determine number of interpolation steps based on distance & smoothness
  const steps = Math.max(16, Math.min(80, Math.round(distance / 12)));

  // Perpendicular vector for arc curvature
  const perpX = -dy / distance;
  const perpY = dx / distance;

  // Arc curvature magnitude: human arm naturally arcs slightly outward
  // Add mild randomness to curvature direction and amplitude
  const arcBias = options.arcDirection || (Math.random() > 0.5 ? 1 : -1);
  const maxArc = Math.min(120, Math.max(25, distance * 0.22));
  const curvature = (0.4 + Math.random() * 0.6) * maxArc * arcBias;

  // Control point 1: near start, influenced by initial inertia
  const cp1Distance = distance * (0.25 + Math.random() * 0.15);
  const cp1 = {
    x: start.x + (dx * 0.25) + (perpX * curvature * 0.75),
    y: start.y + (dy * 0.25) + (perpY * curvature * 0.75)
  };

  // Control point 2: approaching end, beginning deceleration
  const cp2 = {
    x: start.x + (dx * 0.75) + (perpX * curvature * 0.35),
    y: start.y + (dy * 0.75) + (perpY * curvature * 0.35)
  };

  const path = [];

  for (let i = 0; i <= steps; i++) {
    // Normal progress t from 0 to 1
    const rawT = i / steps;

    // Apply Fitts's Law human velocity curve (smooth ease-in-out)
    // Slower at start, fast cruise in middle, gentle landing at target
    const t = fittsEasing(rawT);

    // Cubic Bézier formula: B(t) = (1-t)^3*P0 + 3*(1-t)^2*t*P1 + 3*(1-t)*t^2*P2 + t^3*P3
    const oneMinusT = 1 - t;
    const tSq = t * t;
    const oneMinusTSq = oneMinusT * oneMinusT;

    let x = (oneMinusTSq * oneMinusT * start.x) +
            (3 * oneMinusTSq * t * cp1.x) +
            (3 * oneMinusT * tSq * cp2.x) +
            (tSq * t * end.x);

    let y = (oneMinusTSq * oneMinusT * start.y) +
            (3 * oneMinusTSq * t * cp1.y) +
            (3 * oneMinusT * tSq * cp2.y) +
            (tSq * t * end.y);

    // Micro-jitter: simulate human motor tremor (0.4px jitter in mid-flight, decays near target)
    if (i > 2 && i < steps - 2) {
      const jitterFactor = Math.sin(rawT * Math.PI) * 0.65;
      x += (Math.random() - 0.5) * jitterFactor;
      y += (Math.random() - 0.5) * jitterFactor;
    }

    path.push({ x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 });
  }

  // Slight overshoot at target (3-5px overshoot then settle, classic human cursor behavior)
  if (options.overshoot && distance > 80) {
    const overshootDist = Math.min(6, distance * 0.03);
    const dirX = dx / distance;
    const dirY = dy / distance;
    path.splice(path.length - 2, 0, {
      x: Math.round((end.x + dirX * overshootDist) * 10) / 10,
      y: Math.round((end.y + dirY * overshootDist) * 10) / 10
    });
  }

  // Ensure absolute precision on final point
  path[path.length - 1] = { x: end.x, y: end.y };

  return path;
}

/**
 * Fitts's Law human easing curve:
 * S-curve with asymmetric deceleration (humans take longer to settle precisely on target).
 */
export function fittsEasing(t) {
  // Asymmetric cubic-like sigmoid
  if (t < 0.45) {
    return 2.4 * Math.pow(t, 2.1);
  }
  return 1 - Math.pow(1 - t, 2.5);
}

/**
 * Animates mouse cursor smoothly along human Bézier curve via requestAnimationFrame.
 * @param {{x: number, y: number}} start 
 * @param {{x: number, y: number}} end 
 * @param {Function} onStep Callback receiving ({ x, y, progress })
 * @param {object} [options] Duration, speed multiplier, abort signal
 * @returns {Promise<void>}
 */
export function animateHumanCursor(start, end, onStep, options = {}) {
  return new Promise((resolve) => {
    const speed = options.speed || 1;
    const distance = Math.hypot(end.x - start.x, end.y - start.y);
    
    // Dynamic duration based on distance (Fitts's Law MT = a + b * log2(2D/W))
    const baseDurationMs = Math.max(260, Math.min(650, 180 + Math.sqrt(distance) * 16));
    const duration = baseDurationMs / speed;

    const path = generateHumanBezierPath(start, end, {
      overshoot: options.overshoot !== false,
      arcDirection: options.arcDirection
    });

    const startTime = performance.now();

    function frame(now) {
      if (options.isAborted && options.isAborted()) {
        resolve();
        return;
      }

      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);

      // Map progress to path index
      const targetIndex = Math.min(path.length - 1, Math.floor(progress * (path.length - 1)));
      const currentPoint = path[targetIndex];

      if (onStep && currentPoint) {
        onStep({ ...currentPoint, progress });
      }

      if (progress < 1) {
        requestAnimationFrame(frame);
      } else {
        if (onStep) onStep({ x: end.x, y: end.y, progress: 1 });
        resolve();
      }
    }

    requestAnimationFrame(frame);
  });
}

/**
 * Simulates human typing letter-by-letter with natural pauses, punctuation delays,
 * and optional typographical rhythm.
 * @param {string} text 
 * @param {Function} onChar Callback receiving (accumulatedText, nextChar)
 * @param {object} [options]
 * @returns {Promise<void>}
 */
export async function simulateHumanTyping(text, onChar, options = {}) {
  const speed = options.speed || 1;
  const isAborted = options.isAborted || (() => false);

  let accumulated = '';
  const chars = Array.from(text);

  for (let i = 0; i < chars.length; i++) {
    if (isAborted()) break;

    const ch = chars[i];
    accumulated += ch;

    if (onChar) {
      onChar(accumulated, ch);
    }

    // Natural human keystroke delay (40ms - 110ms with cadence variation)
    let delay = (45 + Math.random() * 65) / speed;

    // Punctuation & spaces cause slight cognitive pause
    if (['.', '!', '?', ';'].includes(ch)) {
      delay += (180 + Math.random() * 120) / speed;
    } else if ([' ', ',', '-'].includes(ch)) {
      delay += (70 + Math.random() * 50) / speed;
    } else if (i === 0) {
      // First character pause (human positioning finger)
      delay += 80 / speed;
    }

    await new Promise(r => setTimeout(r, delay));
  }
}

/**
 * Dispatches synthetic DOM events (pointer, mouse, click) to make UI live-respond.
 * @param {HTMLElement|string} target 
 * @param {'click'|'pointerdown'|'pointerup'|'pointermove'|'focus'|'input'} eventType 
 * @param {object} [coords]
 */
export function dispatchSyntheticEvent(target, eventType, coords = {}) {
  const el = typeof target === 'string' ? document.querySelector(target) : target;
  if (!el) return;

  const clientX = coords.x || 0;
  const clientY = coords.y || 0;

  try {
    if (eventType === 'click') {
      const clickEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window,
        clientX,
        clientY
      });
      el.dispatchEvent(clickEvent);
    } else if (eventType.startsWith('pointer')) {
      const pointerEvent = new PointerEvent(eventType, {
        bubbles: true,
        cancelable: true,
        view: window,
        clientX,
        clientY,
        pointerId: 1,
        pointerType: 'mouse',
        isPrimary: true
      });
      el.dispatchEvent(pointerEvent);
    } else if (eventType === 'focus') {
      el.focus();
    }
  } catch (err) {
    // Non-critical event dispatch warning
  }
}

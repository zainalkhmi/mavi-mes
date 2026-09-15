import { useEffect, useRef } from 'react';

/**
 * useBarcodeScannerWedge
 * ==============================================================================
 * Global hardware keyboard-wedge barcode scanner listener.
 * Industrial barcode scanners (USB / Bluetooth) emulate high-speed keyboard
 * typing (<50ms between keystrokes) followed by an 'Enter' key.
 *
 * This hook captures that keystroke burst globally anywhere on the Player
 * window, WITHOUT requiring the operator to focus an input field!
 * ==============================================================================
 */
export function useBarcodeScannerWedge(onBarcodeScanned, options = {}) {
  const {
    maxIntervalMs = 60,
    minChars = 3,
    enabled = true
  } = options;

  const bufferRef = useRef([]);
  const lastTimeRef = useRef(0);
  const onScannedRef = useRef(onBarcodeScanned);

  useEffect(() => {
    onScannedRef.current = onBarcodeScanned;
  }, [onBarcodeScanned]);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e) => {
      // Don't intercept if user is deliberately typing in a standard input or textarea
      const targetTag = e.target?.tagName?.toLowerCase();
      const isInput = targetTag === 'input' || targetTag === 'textarea';

      const currentTime = Date.now();
      const timeDiff = currentTime - lastTimeRef.current;
      lastTimeRef.current = currentTime;

      // Enter key signals end of barcode payload
      if (e.key === 'Enter') {
        if (bufferRef.current.length >= minChars) {
          const barcode = bufferRef.current.join('');
          bufferRef.current = [];
          if (onScannedRef.current) {
            onScannedRef.current(barcode);
          }
          if (!isInput) {
            e.preventDefault();
          }
        } else {
          bufferRef.current = [];
        }
        return;
      }

      // If key is printable character
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        // If speed is rapid (<maxIntervalMs) or buffer is fresh, append
        if (bufferRef.current.length === 0 || timeDiff <= maxIntervalMs) {
          bufferRef.current.push(e.key);
        } else {
          // Key was typed too slowly (human typing), reset buffer
          bufferRef.current = [e.key];
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [enabled, maxIntervalMs, minChars]);
}

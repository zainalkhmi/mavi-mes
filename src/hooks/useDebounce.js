/**
 * useDebounce.js
 * =====================================================
 * React hook for debouncing values
 * Prevents too many re-renders/request during typing/search
 * =====================================================
 */

import { useState, useEffect } from 'react';

/**
 * Debounce a value by the specified delay
 * @param {*} value - Value to debounce
 * @param {number} delay - Delay in milliseconds (default: 300ms)
 * @returns {*} Debounced value
 */
export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * useDebouncedCallback - Returns a debounced version of a callback
 * @param {Function} callback - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
export function useDebouncedCallback(callback, delay = 300) {
  const [timeoutId, setTimeoutId] = useState(null);

  useEffect(() => {
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [timeoutId]);

  return (...args) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    const id = setTimeout(() => {
      callback(...args);
    }, delay);
    setTimeoutId(id);
  };
}

export default useDebounce;

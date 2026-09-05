import { clsx } from 'clsx';

/**
 * Utility for combining CSS class names cleanly.
 */
export function cn(...inputs) {
  return clsx(inputs);
}

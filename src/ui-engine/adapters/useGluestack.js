import { createContext, useContext } from 'react';
import { maviDesignTokens } from '../tokens/theme';

export const GluestackContext = createContext({
  colorMode: 'light',
  toggleColorMode: () => {},
  setColorMode: () => {},
  tokens: maviDesignTokens,
  toasts: [],
  showToast: () => {},
  closeToast: () => {}
});

export function useGluestackUI() {
  return useContext(GluestackContext);
}

export function useToast() {
  const { showToast, closeToast } = useContext(GluestackContext);
  return {
    show: showToast,
    close: closeToast
  };
}

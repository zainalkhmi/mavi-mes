import { useState, useEffect } from 'react';

export function useZoom() {
  const [zoomLevel, setZoomLevel] = useState(() => {
    const saved = localStorage.getItem('mandor-zoom-level');
    return saved ? parseFloat(saved) : 1.0;
  });
  const [isZoomCollapsed, setIsZoomCollapsed] = useState(() => {
    const saved = localStorage.getItem('mandor-zoom-collapsed');
    return saved === 'true';
  });

  useEffect(() => {
    const root = document.getElementById('root');
    if (root) {
      root.style.transform = '';
      root.style.transformOrigin = '';
      root.style.zoom = zoomLevel === 1.0 ? '' : zoomLevel;
      if (zoomLevel !== 1.0) {
        root.style.height = `calc(100vh / ${zoomLevel})`;
        root.style.width = `calc(100vw / ${zoomLevel})`;
      } else {
        root.style.height = '100%';
        root.style.width = '100%';
      }
    }
    document.body.style.zoom = '';
    localStorage.setItem('mandor-zoom-level', zoomLevel.toFixed(2));
  }, [zoomLevel]);

  useEffect(() => {
    localStorage.setItem('mandor-zoom-collapsed', isZoomCollapsed.toString());
  }, [isZoomCollapsed]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === '=' || e.key === '+' || e.key === 'Add') {
          e.preventDefault();
          setZoomLevel((prev) => Math.min(Math.round((prev + 0.1) * 10) / 10, 2.0));
        } else if (e.key === '-' || e.key === 'Subtract') {
          e.preventDefault();
          setZoomLevel((prev) => Math.max(Math.round((prev - 0.1) * 10) / 10, 0.5));
        } else if (e.key === '0') {
          e.preventDefault();
          setZoomLevel(1.0);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return { zoomLevel, setZoomLevel, isZoomCollapsed, setIsZoomCollapsed };
}

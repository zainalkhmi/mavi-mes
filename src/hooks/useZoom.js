import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function useZoom() {
  const location = useLocation();
  const [zoomLevel, setZoomLevel] = useState(() => {
    const saved = localStorage.getItem('mandor-zoom-level');
    return saved ? parseFloat(saved) : 1.0;
  });
  const [isZoomCollapsed, setIsZoomCollapsed] = useState(() => {
    const saved = localStorage.getItem('mandor-zoom-collapsed');
    return saved === 'true';
  });

  useEffect(() => {
    const path = (location.pathname || '').toLowerCase();
    const hash = (window.location.hash || '').toLowerCase();
    const search = (location.search || '').toLowerCase();

    const isStandalonePage = 
      path.startsWith('/sandbox') ||
      path.startsWith('/player') ||
      path.startsWith('/app-player') ||
      path.startsWith('/standalone-player') ||
      path.startsWith('/tulip-player') ||
      path.startsWith('/mobile-player') ||
      path.startsWith('/mandor-player') ||
      path.startsWith('/dozuki-player') ||
      path.startsWith('/terminal') ||
      path.startsWith('/checksheet') ||
      path.startsWith('/drawing-checksheet') ||
      path.startsWith('/qa-checksheet') ||
      path.startsWith('/live-checksheet') ||
      path.startsWith('/live-player') ||
      path.startsWith('/simple-checksheet') ||
      path.startsWith('/builder') ||
      path.startsWith('/ui-engine') ||
      path.startsWith('/gluestack') ||
      path.startsWith('/query-studio') ||
      path.startsWith('/automations') ||
      hash.includes('sandbox') ||
      hash.includes('player') ||
      hash.includes('terminal') ||
      hash.includes('checksheet') ||
      hash.includes('builder') ||
      hash.includes('ui-engine') ||
      hash.includes('gluestack') ||
      hash.includes('query-studio') ||
      hash.includes('automations') ||
      search.includes('standalone=true') ||
      search.includes('hideheader=true') ||
      search.includes('mode=companion');

    const effectiveZoom = isStandalonePage ? 1.0 : zoomLevel;

    const root = document.getElementById('root');
    if (root) {
      root.style.transform = '';
      root.style.transformOrigin = '';
      root.style.zoom = effectiveZoom === 1.0 ? '' : effectiveZoom;
      if (effectiveZoom !== 1.0) {
        root.style.height = `calc(100vh / ${effectiveZoom})`;
        root.style.width = `calc(100vw / ${effectiveZoom})`;
      } else {
        root.style.height = '100%';
        root.style.width = '100%';
      }
    }
    document.body.style.zoom = '';
    if (!isStandalonePage) {
      localStorage.setItem('mandor-zoom-level', zoomLevel.toFixed(2));
    }
  }, [zoomLevel, location.pathname, location.search]);

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

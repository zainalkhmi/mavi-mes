import { useEffect, lazy, Suspense } from 'react';
import { useLocation, useNavigate, Routes, Route, Navigate } from 'react-router-dom';

import TopNavbar from './components/layout/TopNavbar';
import ZoomWidget from './components/layout/ZoomWidget';
import AppRouter from './AppRouter';
import { useZoom } from './hooks/useZoom';
import Login from './components/Login';
import LoadingScreen from './components/layout/LoadingScreen';
import { useGlobalStore } from './store/useGlobalStore';

import LandingPage from './components/LandingPage';

export default function App() {
  const user = useGlobalStore((state) => state.user);
  const setUser = useGlobalStore((state) => state.setUser);
  
  const location = useLocation();
  const navigate = useNavigate();

  const isOperatorRoute = location.pathname.startsWith('/player') || location.pathname.startsWith('/terminal');
  const isOperator = user?.role === 'OPERATOR' || user?.role === 'STATION_OPERATOR';

  const { zoomLevel, setZoomLevel, isZoomCollapsed, setIsZoomCollapsed } = useZoom();

  // Load PLC Settings from Supabase globally after login
  useEffect(() => {
    if (!user) return;
    const fetchGlobalPlcSettings = async () => {
      try {
        const { loadPlcSettingsFromSupabase } = await import('./utils/supabaseFrontlineDB');
        const { controllers, tags } = await loadPlcSettingsFromSupabase();
        if (controllers) {
          window.mavi_plc_controllers = controllers;
        }
        if (tags) {
          window.mavi_plc_tags = tags;
        }
      } catch (err) {
        console.error('Failed to load global PLC settings from Supabase:', err);
      }
    };
    fetchGlobalPlcSettings();
  }, [user]);

  const handleLoginSuccess = (loggedInUser) => {
    setUser(loggedInUser);
    if (loggedInUser.role === 'OPERATOR' || loggedInUser.role === 'STATION_OPERATOR') {
      navigate('/terminal');
    } else {
      navigate('/');
    }
  };

  if (!user) {
    return (
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login onLoginSuccess={handleLoginSuccess} />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Suspense>
    );
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#f1f5f9', fontFamily: "'Inter', sans-serif" }}>
      <TopNavbar
        user={user}
        setUser={setUser}
        isOperator={isOperator}
        isOperatorRoute={isOperatorRoute}
      />
      
      <AppRouter user={user} isOperator={isOperator} />

      <ZoomWidget 
        zoomLevel={zoomLevel} 
        setZoomLevel={setZoomLevel} 
        isZoomCollapsed={isZoomCollapsed} 
        setIsZoomCollapsed={setIsZoomCollapsed} 
      />
    </div>
  );
}

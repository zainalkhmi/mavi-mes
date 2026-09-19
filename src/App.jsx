import { useEffect, lazy, Suspense } from 'react';
import { useLocation, useNavigate, Routes, Route, Navigate } from 'react-router-dom';

import TopNavbar from './components/layout/TopNavbar';
import ZoomWidget from './components/layout/ZoomWidget';
import AppRouter from './AppRouter';
import { useZoom } from './hooks/useZoom';
import Login from './components/Login';
import LoadingScreen from './components/layout/LoadingScreen';
import { useGlobalStore } from './store/useGlobalStore';
import { useAuth } from './contexts/AuthContext';

import Register from './components/Register';
import LandingPage from './components/LandingPage';

import { EnterpriseDialogContainer } from './components/common/EnterpriseDialog';
import ProToaster from './components/common/ProToaster';

const ProductionPlantDashboard = lazy(() => import('./components/ProductionPlantDashboard'));
const MachineActivityYieldTracker = lazy(() => import('./components/MachineActivityYieldTracker'));
const AgentManager = lazy(() => import('./components/AgentManager'));
const ShiftHandoffDashboard = lazy(() => import('./components/ShiftHandoffDashboard'));
const DigitalDrawingCheckSheet = lazy(() => import('./components/DigitalDrawingCheckSheet'));
const SimpleCheckSheetDemo = lazy(() => import('./components/SimpleCheckSheetDemo'));
const DrawingManagement = lazy(() => import('./components/DrawingManagement'));
const PLMIntegrationDashboard = lazy(() => import('./components/PLMIntegrationDashboard'));
const AppPlayer = lazy(() => import('./components/AppPlayer'));
const TulipFrontlinePlayer = lazy(() => import('./components/player/TulipFrontlinePlayer'));
const GluestackAppPlayer = lazy(() => import('./ui-engine/preview/GluestackAppPlayer'));
const MandorMobilePlayer = lazy(() => import('./components/MandorMobilePlayer'));
const DozukiMobileCheckSheet = lazy(() => import('./components/DozukiMobileCheckSheet'));
const LiveTerminal = lazy(() => import('./components/LiveTerminal'));
const VibeSandpackViewer = lazy(() => import('./components/appbuilder/VibeSandpackViewer'));

export default function App() {
  const user = useGlobalStore((state) => state.user);
  const setUser = useGlobalStore((state) => state.setUser);
  const { user: authUser, loading: authLoading, isAuthenticated } = useAuth();

  const location = useLocation();
  const navigate = useNavigate();

  const isOperatorRoute = location.pathname.startsWith('/player') || location.pathname.startsWith('/app-player') || location.pathname.startsWith('/terminal');
  const isChecksheetRoute = 
    location.pathname.startsWith('/sandbox') ||
    window.location.hash.includes('sandbox') ||
    location.pathname.startsWith('/drawing-checksheet') ||
    location.pathname.startsWith('/qa-checksheet') ||
    location.pathname.startsWith('/live-checksheet') ||
    location.pathname.startsWith('/live-player') ||
    location.pathname.startsWith('/simple-checksheet') ||
    location.pathname.startsWith('/player') ||
    location.pathname.startsWith('/app-player') ||
    window.location.hash.includes('app-player') ||
    location.pathname.startsWith('/sandbox-runner') ||
    window.location.hash.includes('sandbox-runner') ||
    location.pathname.startsWith('/sandbox-player') ||
    window.location.hash.includes('sandbox-player') ||
    location.pathname.startsWith('/terminal') ||
    location.pathname.startsWith('/mobile-player') ||
    location.pathname.startsWith('/tulip-player') ||
    location.pathname.startsWith('/standalone-player') ||
    location.pathname.startsWith('/player-app') ||
    window.location.hash.includes('tulip-player') ||
    window.location.hash.includes('standalone-player') ||
    window.location.hash.includes('player-app') ||
    window.location.hash.includes('mobile-player') ||
    location.pathname.startsWith('/mandor-player') ||
    location.pathname.startsWith('/mandor-checksheet') ||
    location.pathname.startsWith('/mandor-mobile') ||
    location.pathname.startsWith('/mandor-portal') ||
    location.pathname.startsWith('/dozuki-player') ||
    location.pathname.startsWith('/dozuki-checksheet') ||
    location.pathname.startsWith('/dozuki-mobile') ||
    location.search.includes('standalone=true') ||
    location.search.includes('hideHeader=true') ||
    location.search.includes('mode=companion') ||
    window.location.hash.includes('standalone=true') ||
    window.location.hash.includes('mode=companion');

  const isUiEngineRoute = 
    location.pathname.startsWith('/ui-engine') ||
    location.pathname.startsWith('/gluestack') ||
    window.location.hash.includes('ui-engine') ||
    window.location.hash.includes('gluestack');

  const isOperator = user?.role === 'OPERATOR' || user?.role === 'STATION_OPERATOR';

  const { zoomLevel, setZoomLevel, isZoomCollapsed, setIsZoomCollapsed } = useZoom();

  // Sync AuthContext user to useGlobalStore
  useEffect(() => {
    if (authLoading) return;
    if (authUser && !user) {
      setUser(authUser);
    }
  }, [authUser, authLoading, user, setUser]);

  // Load PLC Settings from Supabase globally after login
  useEffect(() => {
    if (!user) return;
    const fetchGlobalPlcSettings = async () => {
      try {
        const { loadPlcSettingsFromSupabase } = await import('./utils/supabaseFrontlineDB');
        const { controllers, tags } = await loadPlcSettingsFromSupabase();
        if (controllers) {
          window.mandor_plc_controllers = controllers;
        }
        if (tags) {
          window.mandor_plc_tags = tags;
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

  // Effective user from either Zustand store or AuthContext
  const currentUser = user || authUser;
  const isUserLoggedIn = !!currentUser || isAuthenticated;

  // Show loading screen while auth is initializing to prevent early redirect (except for open/standalone checksheet routes)
  if (authLoading && !currentUser && !isChecksheetRoute) {
    return <LoadingScreen />;
  }

  if (!isUserLoggedIn) {
    return (
      <div style={{ minHeight: '100vh', width: '100%', display: 'flex', flexDirection: 'column' }}>
        <EnterpriseDialogContainer />
        <ProToaster position="top-right" limit={2} />
        <Suspense fallback={<LoadingScreen />}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/store" element={<LandingPage initialTab="store" />} />
            <Route path="/builder" element={<LandingPage initialTab="builder" />} />
            <Route path="/sandbox" element={<VibeSandpackViewer isStandalone={true} />} />
            <Route path="/pricing" element={<LandingPage initialTab="pricing" />} />
            <Route path="/faq" element={<LandingPage initialTab="faq" />} />
            <Route path="/tulip-player" element={<TulipFrontlinePlayer />} />
            <Route path="/standalone-player" element={<TulipFrontlinePlayer />} />
            <Route path="/player-app" element={<TulipFrontlinePlayer />} />
            <Route path="/player" element={<AppPlayer />} />
            <Route path="/app-player" element={<GluestackAppPlayer />} />
            <Route path="/mobile-player" element={<MandorMobilePlayer />} />
            <Route path="/mandor-player" element={<DozukiMobileCheckSheet />} />
            <Route path="/mandor-checksheet" element={<DozukiMobileCheckSheet />} />
            <Route path="/mandor-mobile" element={<DozukiMobileCheckSheet />} />
            <Route path="/mandor-portal" element={<DozukiMobileCheckSheet />} />
            <Route path="/dozuki-checksheet" element={<DozukiMobileCheckSheet />} />
            <Route path="/dozuki-player" element={<DozukiMobileCheckSheet />} />
            <Route path="/terminal" element={<LiveTerminal />} />
            <Route path="/terminal/:appId" element={<LiveTerminal />} />
            <Route path="/production-dashboard" element={<ProductionPlantDashboard />} />
            <Route path="/plant-dashboard" element={<ProductionPlantDashboard />} />
            <Route path="/machine-activity-tracker" element={<MachineActivityYieldTracker />} />
            <Route path="/yield-tracker" element={<MachineActivityYieldTracker />} />
            <Route path="/ai-agents" element={<AgentManager />} />
            <Route path="/shift-handoff" element={<ShiftHandoffDashboard />} />
            <Route path="/drawing-checksheet" element={<DigitalDrawingCheckSheet />} />
            <Route path="/qa-checksheet" element={<DigitalDrawingCheckSheet />} />
            <Route path="/live-checksheet" element={<DigitalDrawingCheckSheet />} />
            <Route path="/live-player" element={<DigitalDrawingCheckSheet />} />
            <Route path="/simple-checksheet" element={<SimpleCheckSheetDemo />} />
            <Route path="/drawing-management" element={<DrawingManagement />} />
            <Route path="/plm-integration" element={<PLMIntegrationDashboard />} />
            <Route path="/login" element={<Login onLoginSuccess={handleLoginSuccess} />} />
            <Route path="/register" element={<Register />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100%', minWidth: 0, minHeight: 0, flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: isChecksheetRoute ? '#0f172a' : '#f1f5f9', fontFamily: "'Inter', sans-serif" }}>
      <EnterpriseDialogContainer />
      <ProToaster position="top-right" limit={2} />
      {!isChecksheetRoute && (
        <TopNavbar
          user={currentUser}
          setUser={setUser}
          isOperator={isOperator}
          isOperatorRoute={isOperatorRoute}
        />
      )}
      
      <AppRouter user={currentUser} isOperator={isOperator} />

      {!isChecksheetRoute && !isUiEngineRoute && (
        <ZoomWidget 
          zoomLevel={zoomLevel} 
          setZoomLevel={setZoomLevel} 
          isZoomCollapsed={isZoomCollapsed} 
          setIsZoomCollapsed={setIsZoomCollapsed} 
        />
      )}
    </div>
  );
}

import { lazy, Suspense, Component } from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import { hasAccess as checkRoleAccess } from './utils/roleAccess';

import Home from './components/Home';
import ReportDesignerFallback from './components/ReportDesignerFallback';

// Error Boundary for Report Designer
class ReportDesignerErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    console.error('ReportDesigner Error:', error);
  }

  render() {
    if (this.state.hasError) {
      return <ReportDesignerFallback />;
    }
    return this.props.children;
  }
}

const TableManager = lazy(() => import('./components/TableManager'));
const ConnectorManager = lazy(() => import('./components/ConnectorManager'));
const UserManager = lazy(() => import('./components/UserManager'));
const AppBuilder = lazy(() => import('./components/AppBuilder'));
const AppPlayer = lazy(() => import('./components/AppPlayer'));
const AutomationEditor = lazy(() => import('./components/AutomationEditor'));
const LiveTerminal = lazy(() => import('./components/LiveTerminal'));
const PlcSettings = lazy(() => import('./components/PlcSettings'));
const VisionManager = lazy(() => import('./components/VisionManager'));
const CameraCalibration = lazy(() => import('./components/CameraCalibration'));
const AnalysisEditor = lazy(() => import('./components/AnalysisEditor'));
const DashboardEditor = lazy(() => import('./components/DashboardEditor'));
const AppStore = lazy(() => import('./components/AppStore'));
const GlobalHelpAssistant = lazy(() => import('./components/GlobalHelpAssistant'));
const WorkOrderDashboard = lazy(() => import('./components/WorkOrderDashboard'));
const FunctionsEditor = lazy(() => import('./components/FunctionsEditor'));
const StationManager = lazy(() => import('./components/StationManager'));
const InterfaceManager = lazy(() => import('./components/InterfaceManager'));
const MachineManager = lazy(() => import('./components/MachineManager'));
const EdgeDeviceManager = lazy(() => import('./components/EdgeDeviceManager'));
const IoTHubManager = lazy(() => import('./components/IoTHubManager'));
const McpServerManager = lazy(() => import('./components/McpServerManager'));
const SCADADashboard = lazy(() => import('./components/SCADADashboard'));
const DataEntryFormGuide = lazy(() => import('./components/DataEntryFormGuide'));
const VariableManager = lazy(() => import('./components/VariableManager'));
const AnalysisManager = lazy(() => import('./components/AnalysisManager'));
const DashboardManager = lazy(() => import('./components/DashboardManager'));
const AiSettings = lazy(() => import('./components/AiSettings'));
const SupabaseSettings = lazy(() => import('./components/SupabaseSettings'));
const AdminSettings = lazy(() => import('./components/AdminSettings'));
const SimpleDigitalCheckSheet = lazy(() => import('./components/SimpleDigitalCheckSheet'));
const SimpleCheckSheetDemo = lazy(() => import('./components/SimpleCheckSheetDemo'));
const DrawingManagement = lazy(() => import('./components/DrawingManagement'));
const PLMIntegrationDashboard = lazy(() => import('./components/PLMIntegrationDashboard'));
const N8nWebhookSettings = lazy(() => import('./components/N8nWebhookSettings'));
const AppManagement = lazy(() => import('./components/AppManagement'));
const FileExplorer = lazy(() => import('./components/FileExplorer'));
const BuildManager = lazy(() => import('./components/BuildManager'));
const VoiceControlledCaliperInspection = lazy(() => import('./components/VoiceControlledCaliperInspection'));
const PredictiveMaintenanceManager = lazy(() => import('./components/PredictiveMaintenanceManager'));
const SkillManager = lazy(() => import('./components/SkillManager'));
const ProductionPlantDashboard = lazy(() => import('./components/ProductionPlantDashboard'));
const MachineActivityYieldTracker = lazy(() => import('./components/MachineActivityYieldTracker'));
const DigitalDrawingCheckSheet = lazy(() => import('./components/DigitalDrawingCheckSheet'));
const ReportDesigner = lazy(() => import('./components/ReportDesigner'));
const BiStudio = lazy(() => import('./components/BiStudio'));
const NodeREDDashboard = lazy(() => import('./components/NodeREDDashboard'));
const ShiftHandoffDashboard = lazy(() => import('./components/ShiftHandoffDashboard'));
const ShiftHandoffSettings = lazy(() => import('./components/ShiftHandoffSettings'));
const InspectorDesigner = lazy(() => import('./components/InspectorDesigner'));
const CheckSheetManager = lazy(() => import('./components/CheckSheetManager'));

export default function AppRouter({ user, isOperator }) {
  const hasAccess = (path) => checkRoleAccess(user, path);

  return (
    <div style={{ flex: 1, width: '100%', height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <Suspense fallback={null}>
        <Routes>
          {isOperator ? (
            // OPERATOR ROUTES ONLY
            <>
              <Route path="/terminal" element={<LiveTerminal />} />
              <Route path="/terminal/:appId" element={<LiveTerminal />} />
              <Route path="/player" element={<AppPlayer />} />
              <Route path="/drawing-checksheet" element={<DigitalDrawingCheckSheet />} />
              <Route path="/qa-checksheet" element={<DigitalDrawingCheckSheet />} />
              <Route path="/simple-checksheet" element={<SimpleCheckSheetDemo />} />
              <Route path="/drawing-management" element={<DrawingManagement />} />
              <Route path="/plm-integration" element={<PLMIntegrationDashboard />} />
              <Route path="/checksheets" element={<CheckSheetManager />} />
              <Route path="/checksheet-management" element={<CheckSheetManager />} />
              <Route path="/checksheet-manager" element={<CheckSheetManager />} />
              <Route path="/inspector-designer" element={<InspectorDesigner />} />
              <Route path="*" element={<Navigate to="/terminal" replace />} />
            </>
          ) : (
            // ADMIN / ENGINEER FULL ROUTES
            <>
              <Route path="/" element={<Home />} />
              <Route path="/stations" element={hasAccess('/stations') ? <StationManager /> : <Navigate to="/" replace />} />
              <Route path="/display-devices" element={hasAccess('/display-devices') ? <InterfaceManager /> : <Navigate to="/" replace />} />
              <Route path="/machines" element={hasAccess('/machines') ? <MachineManager /> : <Navigate to="/" replace />} />
              <Route path="/predictive-maintenance" element={hasAccess('/predictive-maintenance') ? <PredictiveMaintenanceManager /> : <Navigate to="/" replace />} />
              <Route path="/edge-devices" element={hasAccess('/edge-devices') ? <EdgeDeviceManager /> : <Navigate to="/" replace />} />
              <Route path="/vision" element={hasAccess('/vision') ? <VisionManager initialTab="cameras" /> : <Navigate to="/" replace />} />
              <Route path="/vision/quickbuild" element={hasAccess('/vision') ? <VisionManager initialTab="pipeline_builder" /> : <Navigate to="/" replace />} />
              <Route path="/vision/calibration" element={hasAccess('/vision') ? <CameraCalibration /> : <Navigate to="/" replace />} />
              <Route path="/iot-hub" element={hasAccess('/iot-hub') ? <IoTHubManager /> : <Navigate to="/" replace />} />
              <Route path="/plc-settings" element={hasAccess('/plc-settings') ? <PlcSettings /> : <Navigate to="/" replace />} />
              <Route path="/builder" element={hasAccess('/builder') ? <AppBuilder /> : <Navigate to="/" replace />} />
              <Route path="/file-explorer" element={hasAccess('/file-explorer') ? <FileExplorer /> : <Navigate to="/" replace />} />
              <Route path="/store" element={hasAccess('/store') ? <AppStore /> : <Navigate to="/" replace />} />
              <Route path="/checksheets" element={<CheckSheetManager />} />
              <Route path="/checksheet-management" element={<CheckSheetManager />} />
              <Route path="/checksheet-manager" element={<CheckSheetManager />} />
              <Route path="/inspector-designer" element={<InspectorDesigner />} />
              <Route path="/drawing-checksheet" element={<DigitalDrawingCheckSheet />} />
              <Route path="/qa-checksheet" element={<DigitalDrawingCheckSheet />} />
              <Route path="/drawing-management" element={<DrawingManagement />} />
              <Route path="/plm-integration" element={<PLMIntegrationDashboard />} />
              <Route path="/app-management" element={hasAccess('/app-management') ? <AppManagement /> : <Navigate to="/" replace />} />
              <Route path="/tables" element={hasAccess('/tables') ? <TableManager /> : <Navigate to="/" replace />} />
              <Route path="/connectors" element={hasAccess('/connectors') ? <ConnectorManager /> : <Navigate to="/" replace />} />
              <Route path="/mcp-server" element={hasAccess('/mcp-server') ? <McpServerManager /> : <Navigate to="/" replace />} />
              <Route path="/variables" element={hasAccess('/variables') ? <VariableManager /> : <Navigate to="/" replace />} />
              <Route path="/analytics" element={hasAccess('/analytics') ? <AnalysisManager /> : <Navigate to="/" replace />} />
              <Route path="/analytics/new" element={hasAccess('/analytics') ? <AnalysisEditor /> : <Navigate to="/" replace />} />
              <Route path="/analytics/edit/:id" element={hasAccess('/analytics') ? <AnalysisEditor /> : <Navigate to="/" replace />} />
              <Route path="/dashboards" element={hasAccess('/dashboards') ? <DashboardManager /> : <Navigate to="/" replace />} />
              <Route path="/dashboards/new" element={hasAccess('/dashboards') ? <DashboardEditor /> : <Navigate to="/" replace />} />
              <Route path="/dashboards/edit/:id" element={hasAccess('/dashboards') ? <DashboardEditor /> : <Navigate to="/" replace />} />
              <Route path="/bi" element={<BiStudio />} />
              <Route path="/bi-studio" element={<BiStudio />} />
              <Route path="/power-bi" element={<BiStudio />} />
              <Route path="/reports" element={hasAccess('/reports') ? <ReportDesignerErrorBoundary><ReportDesigner /></ReportDesignerErrorBoundary> : <Navigate to="/" replace />} />
              <Route path="/shift-handoff" element={<ShiftHandoffDashboard />} />
              <Route path="/shift-handoff-settings" element={<ShiftHandoffSettings />} />
              <Route path="/nodered" element={hasAccess('/plc-settings') ? <NodeREDDashboard /> : <Navigate to="/" replace />} />
              <Route path="/users" element={hasAccess('/users') ? <UserManager /> : <Navigate to="/" replace />} />
              <Route path="/apps/data-entry-form-example" element={<DataEntryFormGuide />} />
              <Route path="/automations" element={hasAccess('/automations') ? <AutomationEditor /> : <Navigate to="/" replace />} />
              <Route path="/orders" element={<WorkOrderDashboard />} />
              <Route path="/functions" element={hasAccess('/functions') ? <FunctionsEditor /> : <Navigate to="/" replace />} />
              <Route path="/terminal" element={hasAccess('/terminal') ? <LiveTerminal /> : <Navigate to="/" replace />} />
              <Route path="/terminal/:appId" element={hasAccess('/terminal') ? <LiveTerminal /> : <Navigate to="/" replace />} />
              <Route path="/scada" element={<SCADADashboard />} />
              <Route path="/player" element={hasAccess('/player') ? <AppPlayer /> : <Navigate to="/" replace />} />
              <Route path="/ai-settings" element={hasAccess('/ai-settings') ? <AiSettings /> : <Navigate to="/" replace />} />
              <Route path="/supabase-settings" element={hasAccess('/supabase-settings') ? <SupabaseSettings /> : <Navigate to="/" replace />} />
              <Route path="/n8n-settings" element={hasAccess('/n8n-settings') ? <N8nWebhookSettings /> : <Navigate to="/" replace />} />
              <Route path="/admin-settings" element={hasAccess('/admin-settings') ? <AdminSettings /> : <Navigate to="/" replace />} />
              <Route path="/build-center" element={hasAccess('/build-center') ? <BuildManager /> : <Navigate to="/" replace />} />
              <Route path="/help" element={<GlobalHelpAssistant />} />
              <Route path="/voice-inspection" element={<VoiceControlledCaliperInspection />} />
              <Route path="/skill-manager" element={<SkillManager />} />
              <Route path="/production-dashboard" element={<ProductionPlantDashboard />} />
              <Route path="/plant-dashboard" element={<ProductionPlantDashboard />} />
              <Route path="/machine-activity-tracker" element={<MachineActivityYieldTracker />} />
              <Route path="/yield-tracker" element={<MachineActivityYieldTracker />} />
              <Route path="*" element={<Home />} />
            </>
          )}
        </Routes>
      </Suspense>
    </div>
  );
}

export * from './mobileTemplates';

export const TEMPLATE_CATALOG = [
  { id: 'login', title: '1. Login Screen', category: 'Auth', description: 'Operator NIK & PIN login with biometric shortcut', componentName: 'MobileLoginTemplate' },
  { id: 'dashboard', title: '2. Dashboard', category: 'Shop Floor', description: 'Real-time shift counter, OEE target progress, and machine telemetry', componentName: 'MobileDashboardTemplate' },
  { id: 'list', title: '3. Production Lot List', category: 'Data', description: 'Part order list with status badges, search filter, and floating scan button', componentName: 'MobileListTemplate' },
  { id: 'detail', title: '4. Part Details', category: 'Data', description: 'Part technical specifications, tabs for CAD drawing & inspection logs', componentName: 'MobileDetailTemplate' },
  { id: 'form', title: '5. Deviation Form', category: 'Input', description: 'Responsive incident & deviation form with shift dropdown selector', componentName: 'MobileFormTemplate' },
  { id: 'inspection', title: '6. Inspection Form (QC)', category: 'Quality Control', description: 'Core shop floor inspection screen: CAD blueprint, measurements, OK/NG, photo & signature', componentName: 'MobileInspectionFormTemplate' },
  { id: 'checklist', title: '7. TPM Checklist', category: 'Shop Floor', description: 'Step-by-step daily machine verification checklist with progress bar', componentName: 'MobileChecklistTemplate' },
  { id: 'scan', title: '8. Barcode / QR Scanner', category: 'Hardware', description: 'Camera viewfinder interface with flash toggle & scanned validation card', componentName: 'MobileBarcodeScanTemplate' },
  { id: 'approval', title: '9. Approval Screen', category: 'Management', description: 'Multi-stage engineering approval with cost impact & decision buttons', componentName: 'MobileApprovalTemplate' },
  { id: 'profile', title: '10. Operator Profile', category: 'User', description: 'Technician avatar, skill badges, shift metrics, and logout action', componentName: 'MobileProfileTemplate' },
  { id: 'settings', title: '11. Station Settings', category: 'Configuration', description: 'Machine switch toggles for auto-scanner, audio beep, and contrast mode', componentName: 'MobileSettingsTemplate' },
  { id: 'notification', title: '12. Notification Center', category: 'Feedback', description: 'Machine telemetry alerts, lot arrivals, and shift target broadcasts', componentName: 'MobileNotificationTemplate' },
  { id: 'search', title: '13. Quick Search', category: 'Navigation', description: 'Search input with quick-access history chips and filter tags', componentName: 'MobileSearchTemplate' },
  { id: 'empty', title: '14. Empty State', category: 'Status', description: 'Clean empty state card when all lot inspections are finished', componentName: 'MobileEmptyStateTemplate' },
  { id: 'error', title: '15. Error State', category: 'Status', description: 'Graceful disconnection recovery screen with retry button', componentName: 'MobileErrorStateTemplate' },
  { id: 'loading', title: '16. Loading State', category: 'Status', description: 'Smooth spinner and parameter synchronization indicator', componentName: 'MobileLoadingStateTemplate' }
];

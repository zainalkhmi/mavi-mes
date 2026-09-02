/**
 * Metrology Measuring Tools Definitions & Type Detector (ISO 9001: 7.1.5)
 * Enhanced with calibration tracking, expiry validation, and measurement uncertainty.
 */

export const TOOL_DEFINITIONS = [
  {
    id: 'caliper',
    name: 'Digital Caliper 0-150mm',
    code: 'CAL-003',
    icon: '📏',
    manufacturer: 'Mitutoyo',
    model: 'CD-15APX',
    serial_number: 'MT-2024-881',
    cert: 'CAL-CERT-2026-985',
    lastCalibrated: '2026-09-01',
    calibrationDueDate: '2027-03-01',
    calibrationInterval: 180,
    uncertainty: 0.02,
    uncertaintyUnit: 'mm',
    confidenceLevel: '95% (k=2)',
    resolution: 0.01,
    traceability: 'BSML Jakarta → PTB Germany (SI Meter BIPM)',
    calibratedBy: 'PT. Kalibrasi Presisi Indonesia (KAN LP-123)'
  },
  {
    id: 'micrometer',
    name: 'Outside Micrometer 0-25mm',
    code: 'MIC-102',
    icon: '🔍',
    manufacturer: 'Mitutoyo',
    model: 'QuantuMike 293-240-30',
    serial_number: 'MT-2024-102',
    cert: 'CAL-CERT-2026-102',
    lastCalibrated: '2026-07-01',
    calibrationDueDate: '2027-01-01',
    calibrationInterval: 180,
    uncertainty: 0.003,
    uncertaintyUnit: 'mm',
    confidenceLevel: '95% (k=2)',
    resolution: 0.001,
    traceability: 'BSML Jakarta → PTB Germany (SI Meter BIPM)',
    calibratedBy: 'PT. Kalibrasi Presisi Indonesia (KAN LP-123)'
  },
  {
    id: 'dial_indicator',
    name: 'Dial Indicator (0.001mm)',
    code: 'DI-007',
    icon: '⏲️',
    manufacturer: 'Teclock / Mitutoyo',
    model: 'TM-1201 Digimatic',
    serial_number: 'MT-2023-007',
    cert: 'CAL-CERT-2025-007',
    lastCalibrated: '2025-11-20',
    calibrationDueDate: '2026-05-20',
    calibrationInterval: 180,
    uncertainty: 0.005,
    uncertaintyUnit: 'mm',
    confidenceLevel: '95% (k=2)',
    resolution: 0.001,
    traceability: 'BSML Jakarta → PTB Germany (SI Meter BIPM)',
    calibratedBy: 'PT. Kalibrasi Presisi Indonesia (KAN LP-123)'
  },
  {
    id: 'bore_gauge',
    name: 'Digital Bore Gauge 18-35mm',
    code: 'BG-014',
    icon: '🕳️',
    manufacturer: 'Mitutoyo',
    model: '511-711 Series',
    serial_number: 'MT-2024-014',
    cert: 'CAL-CERT-2025-014',
    lastCalibrated: '2026-03-10',
    calibrationDueDate: '2026-09-10',
    calibrationInterval: 180,
    uncertainty: 0.008,
    uncertaintyUnit: 'mm',
    confidenceLevel: '95% (k=2)',
    resolution: 0.001,
    traceability: 'BSML Jakarta → PTB Germany (SI Meter BIPM)',
    calibratedBy: 'PT. Kalibrasi Presisi Indonesia (KAN LP-123)'
  },
  {
    id: 'height_gauge',
    name: 'Digital Height Gauge 300mm',
    code: 'HG-002',
    icon: '📐',
    manufacturer: 'Mitutoyo',
    model: '192-663-10 Digimatic',
    serial_number: 'HG-2024-002',
    cert: 'CAL-CERT-2025-002',
    lastCalibrated: '2026-05-25',
    calibrationDueDate: '2026-11-25',
    calibrationInterval: 180,
    uncertainty: 0.015,
    uncertaintyUnit: 'mm',
    confidenceLevel: '95% (k=2)',
    resolution: 0.01,
    traceability: 'BSML Jakarta → PTB Germany (SI Meter BIPM)',
    calibratedBy: 'PT. Kalibrasi Presisi Indonesia (KAN LP-123)'
  },
  {
    id: 'cmm',
    name: 'Zeiss Contura 3D CMM',
    code: 'CMM-001',
    icon: '🤖',
    manufacturer: 'Carl Zeiss',
    model: 'Contura G2 RDS',
    serial_number: 'CZ-2022-001',
    cert: 'CAL-CERT-2026-001',
    lastCalibrated: '2026-08-01',
    calibrationDueDate: '2027-08-01',
    calibrationInterval: 365,
    uncertainty: 0.0018,
    uncertaintyUnit: 'mm',
    confidenceLevel: '95% (k=2)',
    resolution: 0.0005,
    traceability: 'Zeiss Factory Calibration → PTB Germany → SI Meter BIPM',
    calibratedBy: 'Carl Zeiss SEA Service (ISO 17025 Accredited)'
  }
];

/**
 * Detect the recommended measuring tool type from checkpoint metadata
 */
export function detectMeasuringToolType(activePoint) {
  if (!activePoint) return 'caliper';
  const method = (activePoint.inspectionMethod || '').toLowerCase();
  const toolId = (activePoint.toolId || '').toLowerCase();
  const title = (activePoint.title || '').toLowerCase();
  const cat = (activePoint.category || '').toLowerCase();

  if (toolId.includes('mic') || method.includes('micrometer') || title.includes('micrometer') || title.includes('outside mic')) {
    return 'micrometer';
  }
  if (toolId.includes('cmm') || method.includes('cmm') || title.includes('cmm') || title.includes('zeiss') || title.includes('3d')) {
    return 'cmm';
  }
  if (toolId.includes('di-') || toolId.includes('dial') || method.includes('dial') || method.includes('indicator') || title.includes('flatness') || title.includes('runout') || cat.includes('flatness') || cat.includes('runout')) {
    return 'dial_indicator';
  }
  if (toolId.includes('bg-') || toolId.includes('bore') || method.includes('bore') || title.includes('bore') || title.includes('hole') || title.includes('internal diameter') || title.includes('inside diameter')) {
    return 'bore_gauge';
  }
  if (toolId.includes('hg-') || toolId.includes('height') || method.includes('height') || title.includes('height') || title.includes('step') || cat.includes('height')) {
    return 'height_gauge';
  }
  return 'caliper';
}

// ─── CALIBRATION STATUS CHECKER ────────────────────────────────
/**
 * Get calibration status for a tool definition
 * @param {object} toolDef - Tool definition from TOOL_DEFINITIONS
 * @param {Date} [referenceDate] - Date to check against (default: now)
 * @returns {{ status: 'VALID'|'DUE_SOON'|'EXPIRED', daysRemaining: number, color: string, label: string }}
 */
export function getCalibrationStatus(toolDef, referenceDate) {
  if (!toolDef || !toolDef.calibrationDueDate) {
    return { status: 'UNKNOWN', daysRemaining: 0, color: '#64748b', label: 'Tidak Ada Data Kalibrasi', icon: '❓' };
  }

  const now = referenceDate || new Date();
  const dueDate = new Date(toolDef.calibrationDueDate);
  const diffMs = dueDate.getTime() - now.getTime();
  const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (daysRemaining < 0) {
    return {
      status: 'EXPIRED',
      daysRemaining,
      color: '#ef4444',
      bg: 'rgba(239,68,68,.15)',
      border: '#ef4444',
      label: `KALIBRASI EXPIRED (${Math.abs(daysRemaining)} hari lalu)`,
      icon: '🔴'
    };
  }

  if (daysRemaining <= 30) {
    return {
      status: 'DUE_SOON',
      daysRemaining,
      color: '#eab308',
      bg: 'rgba(234,179,8,.12)',
      border: '#eab308',
      label: `Kalibrasi ${daysRemaining} hari lagi (${dueDate.toLocaleDateString('id-ID')})`,
      icon: '⚠️'
    };
  }

  return {
    status: 'VALID',
    daysRemaining,
    color: '#22c55e',
    bg: 'rgba(34,197,94,.1)',
    border: '#22c55e',
    label: `CAL Valid s.d. ${dueDate.toLocaleDateString('id-ID')}`,
    icon: '✅'
  };
}

/**
 * Check if a tool is allowed for measurement (not expired)
 * @param {object} toolDef - Tool definition
 * @returns {boolean} true if tool calibration is valid or due soon
 */
export function isToolAllowedForMeasurement(toolDef) {
  const status = getCalibrationStatus(toolDef);
  return status.status !== 'EXPIRED';
}

/**
 * Get the tool definition with calibration status merged
 * @param {string} toolType - Tool type id (e.g. 'caliper', 'micrometer')
 * @returns {object} Tool definition with calibration status
 */
export function getToolWithCalibration(toolType) {
  const toolDef = TOOL_DEFINITIONS.find(t => t.id === toolType) || TOOL_DEFINITIONS[0];
  const calStatus = getCalibrationStatus(toolDef);
  return { ...toolDef, calStatus };
}

/**
 * supabaseMeasuringToolsDB.js
 * =====================================================
 * Supabase Cloud Storage Layer for Measuring Tools Management (ISO 17025)
 * Full CRUD, Calibration Logs, Master Reference Standards & Real-Time Sync.
 * =====================================================
 */

import { getSupabaseAuth } from './supabaseAuth.js';

const STORAGE_KEY_TOOLS = 'mavi_measuring_tools_registry';
const STORAGE_KEY_STANDARDS = 'mavi_measuring_standards_registry';
const STORAGE_KEY_LOGS = 'mavi_measuring_calibration_logs';

export const DEFAULT_MEASURING_TOOLS = [
  {
    id: 'CAL-003',
    name: 'Digital Caliper 150mm',
    type: 'caliper',
    manufacturer: 'Mitutoyo',
    model: 'CD-15APX',
    serial_number: 'MT-2024-881',
    range: '0-150mm',
    resolution: '0.01mm',
    accuracy: '±0.02mm',
    location: 'QC Lab Line 1',
    responsible: 'Budi (QA Metrology)',
    calibration_interval: 6,
    last_calibration: '2026-06-15',
    next_calibration: '2026-12-15',
    status: 'VALID',
    certificate_number: 'CAL-CERT-2025-881',
    calibrated_by: 'PT. Kalibrasi Presisi Indonesia (KAN LP-123)',
    uncertainty: '0.02mm (k=2)',
    traceable: true,
    notes: 'Primary digital caliper for machining dimensional checks'
  },
  {
    id: 'MIC-102',
    name: 'Outside Micrometer 0-25mm',
    type: 'micrometer',
    manufacturer: 'Mitutoyo',
    model: 'MDC-25MX',
    serial_number: 'MT-2024-102',
    range: '0-25mm',
    resolution: '0.001mm',
    accuracy: '±0.003mm',
    location: 'QC Lab Station 2',
    responsible: 'Rian (QC Lead)',
    calibration_interval: 6,
    last_calibration: '2026-07-01',
    next_calibration: '2027-01-01',
    status: 'VALID',
    certificate_number: 'CAL-CERT-2026-102',
    calibrated_by: 'PT. Kalibrasi Presisi Indonesia (KAN LP-123)',
    uncertainty: '0.003mm (k=2)',
    traceable: true,
    notes: 'High precision shaft diameter measurement standard'
  },
  {
    id: 'DI-007',
    name: 'Dial Indicator 0.001mm',
    type: 'dial_indicator',
    manufacturer: 'Mitutoyo',
    model: '543-390B',
    serial_number: 'MT-2023-007',
    range: '0-12.7mm',
    resolution: '0.001mm',
    accuracy: '±0.005mm',
    location: 'Assembly QC Area',
    responsible: 'Ahmad (QC Inspector)',
    calibration_interval: 6,
    last_calibration: '2025-11-20',
    next_calibration: '2026-05-20',
    status: 'OVERDUE',
    certificate_number: 'CAL-CERT-2025-007',
    calibrated_by: 'PT. Kalibrasi Presisi Indonesia (KAN LP-123)',
    uncertainty: '0.005mm (k=2)',
    traceable: true,
    notes: 'Runout and flatness measurement indicator'
  },
  {
    id: 'BG-014',
    name: 'Digital Bore Gauge 18-35mm',
    type: 'bore_gauge',
    manufacturer: 'Mitutoyo',
    model: '511-701',
    serial_number: 'BG-2024-014',
    range: '18-35mm',
    resolution: '0.001mm',
    accuracy: '±0.008mm',
    location: 'Machining Station 4',
    responsible: 'Budi (QA Metrology)',
    calibration_interval: 6,
    last_calibration: '2026-03-10',
    next_calibration: '2026-09-10',
    status: 'DUE_SOON',
    certificate_number: 'CAL-CERT-2025-014',
    calibrated_by: 'PT. Kalibrasi Presisi Indonesia (KAN LP-123)',
    uncertainty: '0.008mm (k=2)',
    traceable: true,
    notes: 'Internal cylinder bore diameter inspector'
  },
  {
    id: 'HG-002',
    name: 'Digital Height Gauge 300mm',
    type: 'height_gauge',
    manufacturer: 'Mitutoyo',
    model: '192-663-10',
    serial_number: 'HG-2024-002',
    range: '0-300mm',
    resolution: '0.01mm',
    accuracy: '±0.015mm',
    location: 'Granite Surface Table',
    responsible: 'Siti (QA Technician)',
    calibration_interval: 6,
    last_calibration: '2026-05-25',
    next_calibration: '2026-11-25',
    status: 'VALID',
    certificate_number: 'CAL-CERT-2025-002',
    calibrated_by: 'PT. Kalibrasi Presisi Indonesia (KAN LP-123)',
    uncertainty: '0.015mm (k=2)',
    traceable: true,
    notes: 'Step height & surface plate reference tool'
  },
  {
    id: 'CMM-001',
    name: 'Zeiss Contura 3D CMM',
    type: 'cmm',
    manufacturer: 'Carl Zeiss',
    model: 'Contura G2 7/10/6',
    serial_number: 'ZEISS-2024-001',
    range: '700x1000x600mm',
    resolution: '0.0005mm',
    accuracy: '±0.0018mm',
    location: 'Clean Metrology Lab',
    responsible: 'Dr. Hendra (Metrology Lead)',
    calibration_interval: 12,
    last_calibration: '2026-08-01',
    next_calibration: '2027-08-01',
    status: 'VALID',
    certificate_number: 'CAL-CERT-2026-001',
    calibrated_by: 'Carl Zeiss SEA Service (ISO 17025 Accredited)',
    uncertainty: '0.0018mm (k=2)',
    traceable: true,
    notes: 'Master 3D Coordinate Measuring Machine'
  }
];

export const DEFAULT_STANDARDS = [
  { id: 'REF-01', name: 'Master Gauge Block Set (Grade 0)', code: 'GB-SET-001', range: '1.005 - 100mm (87 pcs)', cert: 'KAN-STD-2026-01', dueDate: '2027-04-10', lab: 'BSML Jakarta', traceability: 'PTB Germany → BIPM SI Meter' },
  { id: 'REF-02', name: 'Master Setting Ring Set Ø25.000 & Ø50.000', code: 'RING-SET-01', range: 'Ø25.000, Ø50.000mm', cert: 'KAN-STD-2026-02', dueDate: '2027-06-15', lab: 'BSML Jakarta', traceability: 'BSML Jakarta → SI Meter' },
  { id: 'REF-03', name: 'Optical Flat Grade 00 (Flatness Reference)', code: 'OPT-FLAT-01', range: 'Ø60mm (λ/10 accuracy)', cert: 'KAN-STD-2025-99', dueDate: '2027-01-20', lab: 'NIST USA', traceability: 'NIST Laser Wavelength Standard' },
  { id: 'REF-04', name: 'Calibrated Fluke Thermal Reference Probe', code: 'TEMP-STD-01', range: '-50 to +250°C (±0.01°C)', cert: 'KAN-STD-2026-04', dueDate: '2026-12-05', lab: 'BSML Jakarta', traceability: 'ITS-90 Temperature Standard' }
];

// ─── 1. FETCH ALL MEASURING TOOLS ────────────────────────────────
export async function getMeasuringTools() {
  const supabase = getSupabaseAuth();
  
  try {
    const { data, error } = await supabase
      .from('measuring_tools')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('[Supabase Metrology] Error querying table, loading cache:', error.message);
      return getLocalTools();
    }

    if (data && data.length > 0) {
      // Sync cache
      localStorage.setItem(STORAGE_KEY_TOOLS, JSON.stringify(data));
      return data;
    } else {
      // Table is empty, seed defaults
      console.info('[Supabase Metrology] Seeding default tools to database...');
      await seedInitialTools(supabase);
      return DEFAULT_MEASURING_TOOLS;
    }
  } catch (err) {
    console.warn('[Supabase Metrology] Fetch exception, using local fallback:', err);
    return getLocalTools();
  }
}

// ─── 2. SAVE OR UPDATE MEASURING TOOL ────────────────────────────
export async function saveMeasuringTool(tool) {
  const supabase = getSupabaseAuth();
  const payload = {
    ...tool,
    updated_at: new Date().toISOString()
  };

  try {
    const { data, error } = await supabase
      .from('measuring_tools')
      .upsert(payload, { onConflict: 'id' })
      .select()
      .single();

    if (error) throw error;

    // Update local cache
    const current = getLocalTools();
    const idx = current.findIndex(i => i.id === tool.id);
    const updated = idx >= 0
      ? current.map(i => i.id === tool.id ? (data || payload) : i)
      : [data || payload, ...current];
    localStorage.setItem(STORAGE_KEY_TOOLS, JSON.stringify(updated));

    return data || payload;
  } catch (err) {
    console.warn('[Supabase Metrology] Save failed, saving locally:', err);
    const current = getLocalTools();
    const idx = current.findIndex(i => i.id === tool.id);
    const updated = idx >= 0
      ? current.map(i => i.id === tool.id ? payload : i)
      : [payload, ...current];
    localStorage.setItem(STORAGE_KEY_TOOLS, JSON.stringify(updated));
    return payload;
  }
}

// ─── 3. DELETE MEASURING TOOL ────────────────────────────────────
export async function deleteMeasuringTool(id) {
  const supabase = getSupabaseAuth();

  try {
    const { error } = await supabase
      .from('measuring_tools')
      .delete()
      .eq('id', id);

    if (error) console.warn('[Supabase Metrology] Delete error:', error.message);
  } catch (err) {
    console.warn('[Supabase Metrology] Delete exception:', err);
  }

  // Always update local cache
  const current = getLocalTools();
  const filtered = current.filter(i => i.id !== id);
  localStorage.setItem(STORAGE_KEY_TOOLS, JSON.stringify(filtered));
  return true;
}

// ─── 4. LOG CALIBRATION & UPDATE STATUS ──────────────────────────
export async function logCalibrationRecord(record) {
  const supabase = getSupabaseAuth();
  const logPayload = {
    id: `CAL-LOG-${Date.now()}`,
    tool_id: record.tool_id || record.id,
    tool_name: record.tool_name || record.name,
    certificate_number: record.certificate_number,
    calibrated_by: record.calibrated_by,
    calibration_date: record.last_calibration || new Date().toISOString().split('T')[0],
    next_due_date: record.next_calibration,
    uncertainty: record.uncertainty,
    status: 'VALID',
    created_at: new Date().toISOString()
  };

  try {
    await supabase.from('measuring_tool_calibrations').insert(logPayload);
  } catch (err) {
    console.warn('[Supabase Metrology] Log calibration insert error:', err);
  }

  // Update instrument status in Supabase
  await saveMeasuringTool({
    ...record,
    status: 'VALID'
  });

  return logPayload;
}

// ─── 5. REFERENCE STANDARDS ──────────────────────────────────────
export async function getReferenceStandards() {
  const supabase = getSupabaseAuth();

  try {
    const { data, error } = await supabase
      .from('measuring_tool_standards')
      .select('*')
      .order('code', { ascending: true });

    if (error || !data || data.length === 0) {
      return getLocalStandards();
    }
    localStorage.setItem(STORAGE_KEY_STANDARDS, JSON.stringify(data));
    return data;
  } catch {
    return getLocalStandards();
  }
}

// ─── LOCAL STORAGE FALLBACK HELPERS ──────────────────────────────
function getLocalTools() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_TOOLS);
    return saved ? JSON.parse(saved) : DEFAULT_MEASURING_TOOLS;
  } catch {
    return DEFAULT_MEASURING_TOOLS;
  }
}

function getLocalStandards() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_STANDARDS);
    return saved ? JSON.parse(saved) : DEFAULT_STANDARDS;
  } catch {
    return DEFAULT_STANDARDS;
  }
}

async function seedInitialTools(supabase) {
  try {
    await supabase.from('measuring_tools').upsert(DEFAULT_MEASURING_TOOLS, { onConflict: 'id' });
    localStorage.setItem(STORAGE_KEY_TOOLS, JSON.stringify(DEFAULT_MEASURING_TOOLS));
  } catch (e) {
    console.warn('[Supabase Metrology] Seeding failed:', e);
  }
}

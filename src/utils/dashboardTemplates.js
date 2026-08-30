/**
 * Enterprise Dashboard Templates for MANDOR BI Studio
 * 1. QA & Metrology Quality Hub
 * 2. Production Planning & Schedule Adherence (PPC)
 * 3. Warehouse Inventory & Stock Monitoring
 * 4. Factory Performance & Overall OEE Telemetry
 */

export const DASHBOARD_TEMPLATES = [
  // ─── 1. QA & METROLOGY QUALITY HUB ─────────────────────────────────
  {
    id: 'tpl_qa',
    name: '🛡️ QA & Metrology Quality Hub',
    badge: 'ISO 9001 / IATF 16949',
    category: 'Quality Assurance',
    color: '#0284c7',
    icon: 'ShieldCheck',
    description: 'First Pass Yield, Pareto 80/20 Defect Breakdown, Cpk Process Capability, and NCR Dispositions.',
    calculatedColumns: [
      { name: 'yieldRate', label: 'Yield Rate (%)', expression: '(passedQty / sampleQty) * 100', isPercent: true },
      { name: 'scrapCost', label: 'Scrap Cost (IDR)', expression: 'ncrQty * 35000', isCurrency: true }
    ],
    dataset: [
      { date: '2026-08-12', lotNo: 'LOT-2026-081', partName: 'Gearbox Housing A', inspector: 'Hendro W.', sampleQty: 500, passedQty: 492, ncrQty: 8, defectCategory: 'Dimension Out', cpk: 1.45, disposition: 'Rework' },
      { date: '2026-08-12', lotNo: 'LOT-2026-082', partName: 'Flange Joint 20mm', inspector: 'Siti Rahma', sampleQty: 600, passedQty: 595, ncrQty: 5, defectCategory: 'Burr Excess', cpk: 1.62, disposition: 'Accept Concession' },
      { date: '2026-08-13', lotNo: 'LOT-2026-083', partName: 'Bracket Motor B', inspector: 'Budi S.', sampleQty: 750, passedQty: 732, ncrQty: 18, defectCategory: 'Crack', cpk: 1.12, disposition: 'Scrap' },
      { date: '2026-08-13', lotNo: 'LOT-2026-084', partName: 'Cover Plate Stamping', inspector: 'Hendro W.', sampleQty: 900, passedQty: 888, ncrQty: 12, defectCategory: 'Pinhole', cpk: 1.38, disposition: 'Scrap' },
      { date: '2026-08-14', lotNo: 'LOT-2026-085', partName: 'Main Shaft Rotor', inspector: 'Agus P.', sampleQty: 400, passedQty: 391, ncrQty: 9, defectCategory: 'Surface Scratch', cpk: 1.28, disposition: 'Rework' },
      { date: '2026-08-14', lotNo: 'LOT-2026-086', partName: 'Gearbox Housing A', inspector: 'Siti Rahma', sampleQty: 500, passedQty: 497, ncrQty: 3, defectCategory: 'Burr Excess', cpk: 1.71, disposition: 'Rework' },
      { date: '2026-08-15', lotNo: 'LOT-2026-087', partName: 'Bracket Motor B', inspector: 'Budi S.', sampleQty: 750, passedQty: 745, ncrQty: 5, defectCategory: 'Porosity', cpk: 1.55, disposition: 'Accept Concession' },
      { date: '2026-08-15', lotNo: 'LOT-2026-088', partName: 'Main Shaft Rotor', inspector: 'Agus P.', sampleQty: 425, passedQty: 421, ncrQty: 4, defectCategory: 'Dimension Out', cpk: 1.60, disposition: 'Rework' }
    ],
    elements: [
      { id: 'el_qa_title', type: 'TEXT', x: 20, y: 20, width: 420, height: 65, title: '🛡️ QA & METROLOGY QUALITY BI DASHBOARD', textContent: 'ISO 9001: 7.1.5 Metrology Sync & Inspection Disposition Telemetry', fontSize: 15, color: '#0284c7', bgColor: '#ffffff' },
      { id: 'el_qa_kpi_inspected', type: 'KPI_CARD', x: 460, y: 20, width: 220, height: 90, title: 'Total Sample Inspected', metric: 'sampleQty', aggregation: 'SUM', suffix: ' pcs', color: '#0284c7' },
      { id: 'el_qa_kpi_passed', type: 'KPI_CARD', x: 700, y: 20, width: 220, height: 90, title: 'First Pass Yield (FPY)', metric: 'passedQty', aggregation: 'PERCENT', suffix: '%', color: '#16a34a' },
      { id: 'el_qa_kpi_ncr', type: 'KPI_CARD', x: 940, y: 20, width: 220, height: 90, title: 'Total NCR Defects', metric: 'ncrQty', aggregation: 'SUM', suffix: ' defects', color: '#dc2626' },
      { id: 'el_qa_slicer_insp', type: 'SLICER', x: 1180, y: 20, width: 200, height: 90, title: 'Filter Inspector', dimension: 'inspector' },
      { id: 'el_qa_pareto', type: 'PARETO', x: 20, y: 130, width: 560, height: 290, title: '🔍 Pareto 80/20 QC Defect Breakdown', dimension: 'defectCategory', metric: 'ncrQty' },
      { id: 'el_qa_bar_part', type: 'BAR', x: 600, y: 130, width: 440, height: 290, title: '📊 NCR Defects per Part Number', dimension: 'partName', metric: 'ncrQty', color: '#0284c7' },
      { id: 'el_qa_donut_disp', type: 'DONUT', x: 1060, y: 130, width: 320, height: 290, title: '🍩 Disposition Breakdown', dimension: 'disposition', metric: 'ncrQty' },
      { id: 'el_qa_line_cpk', type: 'LINE', x: 20, y: 440, width: 680, height: 280, title: '📈 Cpk Process Capability Index Trend', dimension: 'lotNo', metric: 'cpk', color: '#16a34a' },
      { id: 'el_qa_sankey', type: 'SANKEY', x: 720, y: 440, width: 660, height: 280, title: '🌊 Quality Flow: Inspection ➔ Disposition ➔ Status' }
    ]
  },

  // ─── 2. PRODUCTION CONTROL & SCHEDULE ADHERENCE (PPC) ──────────────
  {
    id: 'tpl_ppc',
    name: '🏭 Production Control & Schedule Adherence',
    badge: 'PPC / MES Telemetry',
    category: 'Production Control',
    color: '#714B67',
    icon: 'SlidersHorizontal',
    description: 'Work Order Target vs Realization, Schedule Adherence %, Hourly Velocity, and Line Balance.',
    calculatedColumns: [
      { name: 'adherenceRate', label: 'Adherence %', expression: '(actualQty / targetQty) * 100', isPercent: true },
      { name: 'gapOutput', label: 'Gap Target (pcs)', expression: 'targetQty - actualQty' }
    ],
    dataset: [
      { date: '2026-08-12', workOrder: 'WO-2026-001', line: 'Line A (Machining)', product: 'Gearbox Housing A', targetQty: 2000, actualQty: 1950, balanceQty: 50, adherencePct: 97.5, shift: 'Shift 1', status: 'On-Time' },
      { date: '2026-08-12', workOrder: 'WO-2026-002', line: 'Line A (Machining)', product: 'Flange Joint 20mm', targetQty: 2400, actualQty: 2360, balanceQty: 40, adherencePct: 98.3, shift: 'Shift 2', status: 'On-Time' },
      { date: '2026-08-13', workOrder: 'WO-2026-003', line: 'Line B (Stamping)', product: 'Bracket Motor B', targetQty: 3000, actualQty: 2840, balanceQty: 160, adherencePct: 94.6, shift: 'Shift 1', status: 'Delayed' },
      { date: '2026-08-13', workOrder: 'WO-2026-004', line: 'Line B (Stamping)', product: 'Cover Plate Stamping', targetQty: 3600, actualQty: 3580, balanceQty: 20, adherencePct: 99.4, shift: 'Shift 2', status: 'On-Time' },
      { date: '2026-08-14', workOrder: 'WO-2026-005', line: 'Line C (Assembly)', product: 'Main Shaft Rotor', targetQty: 1600, actualQty: 1520, balanceQty: 80, adherencePct: 95.0, shift: 'Shift 1', status: 'Delayed' },
      { date: '2026-08-14', workOrder: 'WO-2026-006', line: 'Line C (Assembly)', product: 'Main Shaft Rotor', targetQty: 1700, actualQty: 1680, balanceQty: 20, adherencePct: 98.8, shift: 'Shift 2', status: 'On-Time' },
      { date: '2026-08-15', workOrder: 'WO-2026-007', line: 'Line A (Machining)', product: 'Gearbox Housing A', targetQty: 2000, actualQty: 1980, balanceQty: 20, adherencePct: 99.0, shift: 'Shift 1', status: 'On-Time' },
      { date: '2026-08-15', workOrder: 'WO-2026-008', line: 'Line B (Stamping)', product: 'Bracket Motor B', targetQty: 3000, actualQty: 2950, balanceQty: 50, adherencePct: 98.3, shift: 'Shift 2', status: 'On-Time' }
    ],
    elements: [
      { id: 'el_ppc_title', type: 'TEXT', x: 20, y: 20, width: 420, height: 65, title: '🏭 PPC & SHOPFLOOR SCHEDULE ADHERENCE', textContent: 'Daily Plan vs Actual Realization & Line Balance Monitoring', fontSize: 15, color: '#714B67', bgColor: '#ffffff' },
      { id: 'el_ppc_kpi_target', type: 'KPI_CARD', x: 460, y: 20, width: 220, height: 90, title: 'Total Target Plan', metric: 'targetQty', aggregation: 'SUM', suffix: ' pcs', color: '#714B67' },
      { id: 'el_ppc_kpi_actual', type: 'KPI_CARD', x: 700, y: 20, width: 220, height: 90, title: 'Actual Realization', metric: 'actualQty', aggregation: 'SUM', suffix: ' pcs', color: '#16a34a' },
      { id: 'el_ppc_kpi_adh', type: 'KPI_CARD', x: 940, y: 20, width: 220, height: 90, title: 'Schedule Adherence', metric: 'actualQty', aggregation: 'PERCENT', suffix: '%', color: '#0284c7' },
      { id: 'el_ppc_slicer_line', type: 'SLICER', x: 1180, y: 20, width: 200, height: 90, title: 'Filter Line', dimension: 'line' },
      { id: 'el_ppc_bar_plan_act', type: 'BAR', x: 20, y: 130, width: 580, height: 290, title: '📊 Target vs Actual Output per Work Order', dimension: 'workOrder', metric: 'actualQty', color: '#714B67' },
      { id: 'el_ppc_bar_line', type: 'BAR', x: 620, y: 130, width: 420, height: 290, title: '📈 Realization Output per Production Line', dimension: 'line', metric: 'actualQty', color: '#16a34a' },
      { id: 'el_ppc_donut_status', type: 'DONUT', x: 1060, y: 130, width: 320, height: 290, title: '🍩 Work Order Status', dimension: 'status', metric: 'actualQty' },
      { id: 'el_ppc_line_trend', type: 'LINE', x: 20, y: 440, width: 680, height: 280, title: '📅 Output Velocity Trend (Daily Run Rate)', dimension: 'date', metric: 'actualQty', color: '#0284c7' },
      { id: 'el_ppc_gauge_adh', type: 'OEE_GAUGE', x: 720, y: 440, width: 320, height: 280, title: '⚡ Plan Attainment %' },
      { id: 'el_ppc_radar', type: 'RADAR', x: 1060, y: 440, width: 320, height: 280, title: '🎯 Shift & Line Multi-Axis' }
    ]
  },

  // ─── 3. STOCK & WAREHOUSE INVENTORY MONITORING ──────────────────────
  {
    id: 'tpl_stock',
    name: '📦 Stock & Warehouse Inventory Monitoring',
    badge: 'Supply Chain / WMS',
    category: 'Inventory & Stock',
    color: '#f59e0b',
    icon: 'Package',
    description: 'Inventory Valuation (IDR), Stock Shortage Alert, Min/Max Safety Stock, and Category Breakdown.',
    calculatedColumns: [
      { name: 'stockValuation', label: 'Valuation (IDR)', expression: 'currentStock * unitPriceIDR', isCurrency: true },
      { name: 'safetyStockGap', label: 'Safety Stock Deficit', expression: 'currentStock - safetyStock' }
    ],
    dataset: [
      { itemCode: 'RM-AL-380', itemName: 'Aluminium Ingot A380', category: 'Raw Material', currentStock: 12500, safetyStock: 5000, minStock: 3000, maxStock: 20000, unitPriceIDR: 45000, totalValueIDR: 562500000, zone: 'Zone A - Ingot Yard', stockStatus: 'Safe' },
      { itemCode: 'RM-ST-S45C', itemName: 'Carbon Steel Bar Ø35', category: 'Raw Material', currentStock: 8400, safetyStock: 4000, minStock: 2500, maxStock: 15000, unitPriceIDR: 38000, totalValueIDR: 319200000, zone: 'Zone A - Ingot Yard', stockStatus: 'Safe' },
      { itemCode: 'WIP-GB-01', itemName: 'WIP Semi-Machined Housing', category: 'Work In Progress', currentStock: 850, safetyStock: 1200, minStock: 1000, maxStock: 3000, unitPriceIDR: 120000, totalValueIDR: 102000000, zone: 'Zone B - Line Buffer', stockStatus: 'Low Stock' },
      { itemCode: 'WIP-BR-02', itemName: 'WIP Stamped Bracket', category: 'Work In Progress', currentStock: 2400, safetyStock: 1500, minStock: 1000, maxStock: 5000, unitPriceIDR: 65000, totalValueIDR: 156000000, zone: 'Zone B - Line Buffer', stockStatus: 'Safe' },
      { itemCode: 'FG-GB-A1', itemName: 'Finished Gearbox Housing A', category: 'Finished Goods', currentStock: 3200, safetyStock: 2000, minStock: 1500, maxStock: 8000, unitPriceIDR: 285000, totalValueIDR: 912000000, zone: 'Zone C - FG Racks', stockStatus: 'Safe' },
      { itemCode: 'FG-MS-R1', itemName: 'Finished Main Shaft Rotor', category: 'Finished Goods', currentStock: 450, safetyStock: 800, minStock: 600, maxStock: 2500, unitPriceIDR: 340000, totalValueIDR: 153000000, zone: 'Zone C - FG Racks', stockStatus: 'Critical' },
      { itemCode: 'PKG-BX-01', itemName: 'Heavy Duty Export Carton Box', category: 'Packaging', currentStock: 4500, safetyStock: 3000, minStock: 2000, maxStock: 10000, unitPriceIDR: 18000, totalValueIDR: 81000000, zone: 'Zone D - Packaging', stockStatus: 'Safe' },
      { itemCode: 'SP-CNC-INS', itemName: 'Carbide Insert CNMG1204', category: 'Sparepart', currentStock: 45, safetyStock: 100, minStock: 80, maxStock: 300, unitPriceIDR: 95000, totalValueIDR: 4275000, zone: 'Zone E - Tool Crib', stockStatus: 'Critical' }
    ],
    elements: [
      { id: 'el_stk_title', type: 'TEXT', x: 20, y: 20, width: 420, height: 65, title: '📦 WAREHOUSE INVENTORY & STOCK MONITORING', textContent: 'Real-time Stock Health, Safety Stock Buffers, & Inventory Valuation', fontSize: 15, color: '#d97706', bgColor: '#ffffff' },
      { id: 'el_stk_kpi_val', type: 'KPI_CARD', x: 460, y: 20, width: 220, height: 90, title: 'Total Stock Valuation', metric: 'totalValueIDR', aggregation: 'SUM', prefix: 'Rp ', color: '#d97706' },
      { id: 'el_stk_kpi_total_qty', type: 'KPI_CARD', x: 700, y: 20, width: 220, height: 90, title: 'Total Physical Inventory', metric: 'currentStock', aggregation: 'SUM', suffix: ' units', color: '#16a34a' },
      { id: 'el_stk_kpi_safety', type: 'KPI_CARD', x: 940, y: 20, width: 220, height: 90, title: 'Safety Stock Target', metric: 'safetyStock', aggregation: 'SUM', suffix: ' buffer', color: '#0284c7' },
      { id: 'el_stk_slicer_cat', type: 'SLICER', x: 1180, y: 20, width: 200, height: 90, title: 'Filter Category', dimension: 'category' },
      { id: 'el_stk_bar_stock', type: 'BAR', x: 20, y: 130, width: 620, height: 290, title: '📊 Current Stock Level vs Item Code', dimension: 'itemCode', metric: 'currentStock', color: '#d97706' },
      { id: 'el_stk_donut_cat', type: 'DONUT', x: 660, y: 130, width: 340, height: 290, title: '🍩 Stock Valuation by Category', dimension: 'category', metric: 'totalValueIDR' },
      { id: 'el_stk_donut_status', type: 'DONUT', x: 1020, y: 130, width: 360, height: 290, title: '🚨 Stock Health Status Breakdown', dimension: 'stockStatus', metric: 'currentStock' },
      { id: 'el_stk_sankey_flow', type: 'SANKEY', x: 20, y: 440, width: 780, height: 280, title: '🌊 Material Flow: Receiving ➔ Line Buffer ➔ FG Warehouse' },
      { id: 'el_stk_bar_zone', type: 'BAR', x: 820, y: 440, width: 560, height: 280, title: '🏢 Stock Quantity by Warehouse Zone', dimension: 'zone', metric: 'currentStock', color: '#0284c7' }
    ]
  },

  // ─── 4. FACTORY PERFORMANCE & OEE TELEMETRY ─────────────────────────
  {
    id: 'tpl_factory',
    name: '⚡ Factory Performance & OEE Telemetry',
    badge: 'TPM / Industry 4.0',
    category: 'Factory Operations',
    color: '#16a34a',
    icon: 'Gauge',
    description: 'Plant Overall OEE, Availability, Performance, Quality (Six Big Losses) and Breakdown Tracking.',
    calculatedColumns: [
      { name: 'oeeScore', label: 'OEE Score (%)', expression: '(operatingTimeMin / plannedTimeMin) * 100', isPercent: true },
      { name: 'unplannedLossMin', label: 'Unplanned Loss (Min)', expression: 'plannedTimeMin - operatingTimeMin' }
    ],
    dataset: [
      { machineId: 'CNC-01 (5-Axis Mill)', section: 'Machining', availabilityPct: 92.5, performancePct: 96.0, qualityPct: 98.4, oeePct: 87.4, plannedTimeMin: 480, operatingTimeMin: 444, downtimeMin: 36, lossReason: 'Tool Setup' },
      { machineId: 'CNC-02 (H-Mill)', section: 'Machining', availabilityPct: 95.0, performancePct: 94.5, qualityPct: 99.0, oeePct: 88.9, plannedTimeMin: 480, operatingTimeMin: 456, downtimeMin: 24, lossReason: 'Minor Stoppage' },
      { machineId: 'Stamping-01 (300T)', section: 'Press Stamping', availabilityPct: 88.0, performancePct: 92.0, qualityPct: 97.5, oeePct: 78.9, plannedTimeMin: 480, operatingTimeMin: 422, downtimeMin: 58, lossReason: 'Die Jamming' },
      { machineId: 'Stamping-02 (500T)', section: 'Press Stamping', availabilityPct: 94.0, performancePct: 97.0, qualityPct: 98.2, oeePct: 89.5, plannedTimeMin: 480, operatingTimeMin: 451, downtimeMin: 29, lossReason: 'Coil Loading' },
      { machineId: 'Lathe-01 (Turning)', section: 'Turning', availabilityPct: 86.5, performancePct: 91.0, qualityPct: 96.8, oeePct: 76.2, plannedTimeMin: 480, operatingTimeMin: 415, downtimeMin: 65, lossReason: 'Pump Alarm' },
      { machineId: 'Lathe-02 (Turning)', section: 'Turning', availabilityPct: 96.0, performancePct: 95.0, qualityPct: 99.1, oeePct: 90.4, plannedTimeMin: 480, operatingTimeMin: 461, downtimeMin: 19, lossReason: 'Inspection Delay' }
    ],
    elements: [
      { id: 'el_fac_title', type: 'TEXT', x: 20, y: 20, width: 420, height: 65, title: '⚡ FACTORY PERFORMANCE & OEE TELEMETRY', textContent: 'TPM Availability, Performance, Quality & Six Big Losses', fontSize: 15, color: '#16a34a', bgColor: '#ffffff' },
      { id: 'el_fac_kpi_oee', type: 'KPI_CARD', x: 460, y: 20, width: 220, height: 90, title: 'Overall Plant OEE', metric: 'oeePct', aggregation: 'AVG', suffix: '%', color: '#16a34a' },
      { id: 'el_fac_kpi_dt', type: 'KPI_CARD', x: 700, y: 20, width: 220, height: 90, title: 'Total Downtime Loss', metric: 'downtimeMin', aggregation: 'SUM', suffix: ' Min', color: '#dc2626' },
      { id: 'el_fac_kpi_avail', type: 'KPI_CARD', x: 940, y: 20, width: 220, height: 90, title: 'Average Availability', metric: 'availabilityPct', aggregation: 'AVG', suffix: '%', color: '#0284c7' },
      { id: 'el_fac_slicer_sec', type: 'SLICER', x: 1180, y: 20, width: 200, height: 90, title: 'Filter Section', dimension: 'section' },
      { id: 'el_fac_oee_gauge', type: 'OEE_GAUGE', x: 20, y: 130, width: 340, height: 290, title: '⚡ Master Plant OEE Gauge' },
      { id: 'el_fac_bar_oee', type: 'BAR', x: 380, y: 130, width: 500, height: 290, title: '📊 OEE Score per Machine (%)', dimension: 'machineId', metric: 'oeePct', color: '#16a34a' },
      { id: 'el_fac_pareto_losses', type: 'PARETO', x: 900, y: 130, width: 480, height: 290, title: '🔍 Six Big Losses Breakdown (Minutes)', dimension: 'lossReason', metric: 'downtimeMin' },
      { id: 'el_fac_radar_5p', type: 'RADAR', x: 20, y: 440, width: 440, height: 280, title: '🎯 5-Pillar Plant Benchmark (TPM Radar)' },
      { id: 'el_fac_bar_downtime', type: 'BAR', x: 480, y: 440, width: 460, height: 280, title: '⏱️ Machine Downtime Duration (Min)', dimension: 'machineId', metric: 'downtimeMin', color: '#dc2626' },
      { id: 'el_fac_donut_section', type: 'DONUT', x: 960, y: 440, width: 420, height: 280, title: '🍩 Downtime Share by Section', dimension: 'section', metric: 'downtimeMin' }
    ]
  }
];

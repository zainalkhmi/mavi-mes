/**
 * Metrology Measuring Tools Definitions & Type Detector (ISO 9001: 7.1.5)
 */

export const TOOL_DEFINITIONS = [
  { id: 'caliper', name: 'Digital Caliper 0-150mm', code: 'CAL-003', icon: '📏', cert: 'CAL-CERT-2025-881' },
  { id: 'micrometer', name: 'Outside Micrometer 0-25mm', code: 'MIC-102', icon: '🔍', cert: 'CAL-CERT-2026-102' },
  { id: 'dial_indicator', name: 'Dial Indicator (0.001mm)', code: 'DI-007', icon: '⏲️', cert: 'CAL-CERT-2025-007' },
  { id: 'bore_gauge', name: 'Digital Bore Gauge 18-35mm', code: 'BG-014', icon: '🕳️', cert: 'CAL-CERT-2025-014' },
  { id: 'height_gauge', name: 'Digital Height Gauge 300mm', code: 'HG-002', icon: '📐', cert: 'CAL-CERT-2025-002' },
  { id: 'cmm', name: 'Zeiss Contura 3D CMM', code: 'CMM-001', icon: '🤖', cert: 'CAL-CERT-2026-001' }
];

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

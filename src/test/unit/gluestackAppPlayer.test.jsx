import { describe, it, expect } from 'vitest';
import { hasAccess } from '../../utils/roleAccess';

describe('Gluestack Companion & Player Access Control', () => {
  it('allows /app-player for STATION_OPERATOR without redirect', () => {
    const operatorUser = { id: 'u1', role: 'STATION_OPERATOR' };
    expect(hasAccess(operatorUser, '/app-player')).toBe(true);
    expect(hasAccess(operatorUser, '/app-player?appId=app_1&mode=companion&devMode=true')).toBe(true);
  });

  it('allows /app-player for OPERATOR role', () => {
    const operatorUser = { id: 'u2', role: 'OPERATOR' };
    expect(hasAccess(operatorUser, '/app-player')).toBe(true);
  });

  it('allows /app-player universally for unauthenticated or any role', () => {
    expect(hasAccess(null, '/app-player')).toBe(true);
    expect(hasAccess({ role: 'ADMIN' }, '/app-player')).toBe(true);
    expect(hasAccess({ role: 'ENGINEER' }, '/app-player')).toBe(true);
    expect(hasAccess({ role: 'VIEWER' }, '/app-player')).toBe(true);
  });

  it('allows /player universally', () => {
    expect(hasAccess({ role: 'STATION_OPERATOR' }, '/player')).toBe(true);
    expect(hasAccess(null, '/player')).toBe(true);
  });

  it('exports Box, Text, and all 10 Embed widgets from ui-engine/components without error', async () => {
    const components = await import('../../ui-engine/components');
    expect(components.Box).toBeDefined();
    expect(components.Text).toBeDefined();
    // 10 Embed widgets
    expect(components.Timer).toBeDefined();
    expect(components.Counter).toBeDefined();
    expect(components.NumberInput).toBeDefined();
    expect(components.DateTimePicker).toBeDefined();
    expect(components.Gauge).toBeDefined();
    expect(components.Image).toBeDefined();
    expect(components.PDFViewer).toBeDefined();
    expect(components.Signature).toBeDefined();
    expect(components.ListItem).toBeDefined();
    expect(components.Chart).toBeDefined();
    expect(components.LineChart).toBeDefined();
    expect(components.BarChart).toBeDefined();
  });
});

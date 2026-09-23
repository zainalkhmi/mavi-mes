import { describe, it, expect } from 'vitest';
import { sanitizeCopilotCommands } from '../../utils/copilotSafety';

describe('Copilot Safety Widget Handling', () => {
  it('correctly auto-wraps flat widget list without explicit ADD_WIDGET command type', () => {
    const rawData = {
      commands: [
        {
          displayName: 'Card Container Utama',
          x: 16,
          y: 20,
          w: 328,
          h: 580,
          props: { backgroundColor: '#ffffff', borderRadius: 12 }
        },
        {
          displayName: 'Tombol Simpan',
          props: { text: 'Simpan Data' }
        }
      ]
    };

    const res = sanitizeCopilotCommands(rawData, {});
    expect(res.safeCommands).toHaveLength(2);
    expect(res.safeCommands[0].type).toBe('ADD_WIDGET');
    expect(res.safeCommands[0].payload.type).toBe('Card');
    expect(res.safeCommands[0].payload.displayName).toBe('Card Container Utama');
    expect(res.safeCommands[0].payload.x).toBe(16);
    expect(res.safeCommands[0].payload.w).toBe(328);
    expect(res.safeCommands[0].payload.props.backgroundColor).toBe('#ffffff');

    expect(res.safeCommands[1].type).toBe('ADD_WIDGET');
    expect(res.safeCommands[1].payload.type).toBe('Button');
  });

  it('correctly maps raw widget types like Card, Button, Input to ADD_WIDGET', () => {
    const rawData = {
      commands: [
        { type: 'Card', payload: { title: 'Informasi Mesin' } },
        { type: 'Input', payload: { label: 'Operator NIK' } },
        { type: 'Button', payload: { text: 'Submit' } }
      ]
    };

    const res = sanitizeCopilotCommands(rawData, {});
    expect(res.safeCommands).toHaveLength(3);
    expect(res.safeCommands[0].type).toBe('ADD_WIDGET');
    expect(res.safeCommands[0].payload.type).toBe('SHAPE_RECTANGLE');
    expect(res.safeCommands[1].type).toBe('ADD_WIDGET');
    expect(res.safeCommands[1].payload.type).toBe('TEXT_INPUT');
    expect(res.safeCommands[2].type).toBe('ADD_WIDGET');
    expect(res.safeCommands[2].payload.type).toBe('BUTTON');
  });
});

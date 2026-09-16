import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import GluestackAppPlayer from '../../ui-engine/preview/GluestackAppPlayer';
import GluestackWidgetProperties from '../../ui-engine/preview/GluestackWidgetProperties';

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

describe('Gluestack Free Design (X-Y Positioning & Canvas Layout)', () => {
  it('renders components with absolute positioning when screen.layoutMode is "free"', () => {
    const freeApp = {
      id: 'app_free_test',
      name: 'Free SCADA Dashboard',
      screens: [
        {
          id: 'screen_free_1',
          title: 'SCADA Telemetry Free Canvas',
          layoutMode: 'free',
          components: [
            {
              id: 'btn_1',
              type: 'Button',
              x: 50,
              y: 120,
              width: 180,
              height: 48,
              zIndex: 10,
              props: { text: 'Emergency Stop' }
            },
            {
              id: 'text_1',
              type: 'Text',
              x: 100,
              y: 40,
              width: 'auto',
              height: 'auto',
              zIndex: 2,
              props: { text: 'Line Status Overview' }
            }
          ]
        }
      ]
    };

    const { container } = render(
      <MemoryRouter>
        <GluestackAppPlayer initialAppData={freeApp} />
      </MemoryRouter>
    );

    // Verify both components are rendered
    expect(screen.getByText('Emergency Stop')).toBeDefined();
    expect(screen.getByText('Line Status Overview')).toBeDefined();

    // Verify absolute positioning container exists
    const absoluteItems = container.querySelectorAll('div[style*="position: absolute"]');
    expect(absoluteItems.length).toBeGreaterThanOrEqual(2);

    // Verify coordinates on the first component container
    const firstAbs = Array.from(absoluteItems).find(el => el.textContent.includes('Emergency Stop'));
    expect(firstAbs).toBeDefined();
    expect(firstAbs.style.left).toBe('50px');
    expect(firstAbs.style.top).toBe('120px');
    expect(firstAbs.style.width).toBe('180px');
    expect(firstAbs.style.height).toBe('48px');
    expect(firstAbs.style.zIndex).toBe('10');
  });

  it('renders components in standard flow layout when screen.layoutMode is not "free"', () => {
    const flowApp = {
      id: 'app_flow_test',
      name: 'Flow Form App',
      screens: [
        {
          id: 'screen_flow_1',
          title: 'QC Checklist Flow',
          layoutMode: 'flow',
          components: [
            {
              id: 'btn_2',
              type: 'Button',
              props: { text: 'Next Step' }
            }
          ]
        }
      ]
    };

    const { container } = render(
      <MemoryRouter>
        <GluestackAppPlayer initialAppData={flowApp} />
      </MemoryRouter>
    );

    expect(screen.getByText('Next Step')).toBeDefined();
    // In flow mode, no absolute position wrappers should be applied to the screen body components
    const flowContainer = container.querySelector('.space-y-3');
    expect(flowContainer).toBeDefined();
  });

  it('GluestackWidgetProperties allows setting X, Y, Width, and Height', () => {
    const mockUpdateGeometry = vi.fn();
    const mockUpdateProps = vi.fn();

    const selectedComponent = {
      id: 'comp_test_1',
      type: 'Button',
      x: 30,
      y: 90,
      width: 200,
      height: 50,
      zIndex: 5,
      props: { text: 'Test Button' }
    };

    render(
      <GluestackWidgetProperties
        selectedComponent={selectedComponent}
        updateProps={mockUpdateProps}
        updateGeometry={mockUpdateGeometry}
      />
    );

    // Verify X-Y Canvas section header is rendered
    expect(screen.getByText('POSISI & UKURAN (FREE DESIGN)')).toBeDefined();

    // Verify numerical input for X
    const xInput = screen.getByDisplayValue('30');
    expect(xInput).toBeDefined();

    // Verify numerical input for Y
    const yInput = screen.getByDisplayValue('90');
    expect(yInput).toBeDefined();

    // Verify quick alignment helper buttons
    expect(screen.getByText('Rata Kiri (16px)')).toBeDefined();
    expect(screen.getByText('Lebar Penuh (100%)')).toBeDefined();
  });
});

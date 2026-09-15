import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import * as GluestackComponents from '../../ui-engine/components';
import {
  ScadaMotor,
  ScadaValve,
  ScadaTank,
  ScadaPipe,
  ScadaPump,
  ScadaConveyor,
  ScadaGauge,
  ScadaDigitalDisplay,
  ScadaStartStop,
  ScadaToggleSwitch,
  ScadaPlcStatus,
  ScadaTrend,
  ScadaUniversalWidget
} from '../../ui-engine/components';

describe('Gluestack Phase 2 SCADA HMI Widgets', () => {
  describe('Component Export & Registry Verifications', () => {
    it('exports all Phase 2 SCADA components from ui-engine/components', () => {
      expect(GluestackComponents.ScadaMotor).toBeDefined();
      expect(GluestackComponents.ScadaValve).toBeDefined();
      expect(GluestackComponents.ScadaTank).toBeDefined();
      expect(GluestackComponents.ScadaPipe).toBeDefined();
      expect(GluestackComponents.ScadaPump).toBeDefined();
      expect(GluestackComponents.ScadaConveyor).toBeDefined();
      expect(GluestackComponents.ScadaGauge).toBeDefined();
      expect(GluestackComponents.ScadaDigitalDisplay).toBeDefined();
      expect(GluestackComponents.ScadaStartStop).toBeDefined();
      expect(GluestackComponents.ScadaToggleSwitch).toBeDefined();
      expect(GluestackComponents.ScadaPlcStatus).toBeDefined();
      expect(GluestackComponents.ScadaTrend).toBeDefined();
      expect(GluestackComponents.ScadaUniversalWidget).toBeDefined();
    });

    it('registers all Phase 2 SCADA components in COMPONENT_REGISTRY under SCADA HMI', async () => {
      const { COMPONENT_REGISTRY } = await import('../../ui-engine/registry/componentRegistry');
      const scadaEntries = COMPONENT_REGISTRY.filter(c => c.category === 'SCADA HMI');
      const scadaNames = scadaEntries.map(c => c.name);

      expect(scadaNames).toContain('ScadaMotor');
      expect(scadaNames).toContain('ScadaValve');
      expect(scadaNames).toContain('ScadaTank');
      expect(scadaNames).toContain('ScadaPipe');
      expect(scadaNames).toContain('ScadaPump');
      expect(scadaNames).toContain('ScadaConveyor');
      expect(scadaNames).toContain('ScadaGauge');
      expect(scadaNames).toContain('ScadaDigitalDisplay');
      expect(scadaNames).toContain('ScadaStartStop');
      expect(scadaNames).toContain('ScadaToggleSwitch');
      expect(scadaNames).toContain('ScadaPlcStatus');
      expect(scadaNames).toContain('ScadaTrend');
    });
  });

  describe('ScadaMotor Widget', () => {
    it('renders label, STOPPED state, and 0 RPM when stopped', () => {
      render(
        <ScadaMotor
          id="m1"
          label="Motor Pompa Feed"
          motorState="STOPPED"
          rpm={1450}
          current={12.5}
        />
      );

      expect(screen.getByText('Motor Pompa Feed')).toBeDefined();
      expect(screen.getByText('STOPPED')).toBeDefined();
      expect(screen.getByText('0 RPM')).toBeDefined();
    });

    it('renders RUNNING state with live RPM and current', () => {
      render(
        <ScadaMotor
          id="m2"
          label="Motor Utama"
          motorState="RUNNING"
          rpm={1480}
          current={14.2}
        />
      );

      expect(screen.getByText('RUNNING')).toBeDefined();
      expect(screen.getByText('1480 RPM')).toBeDefined();
      expect(screen.getByText('14.2 A')).toBeDefined();
    });

    it('toggles state on click and invokes onStart callback', () => {
      const onStart = vi.fn();
      const onChange = vi.fn();

      const { container } = render(
        <ScadaMotor
          id="m3"
          label="Motor Test"
          motorState="STOPPED"
          rpm={1500}
          onStart={onStart}
          onChange={onChange}
        />
      );

      const motorCard = container.querySelector('.gluestack-scada-motor');
      fireEvent.click(motorCard);

      expect(onStart).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ state: 'RUNNING', rpm: 1500 }));
    });
  });

  describe('ScadaValve Widget', () => {
    it('renders valve in CLOSED state and toggles to OPEN', () => {
      const onOpen = vi.fn();
      const onChange = vi.fn();

      const { container } = render(
        <ScadaValve
          id="v1"
          label="Katup Solenoid Tangki"
          valveState="CLOSED"
          onOpen={onOpen}
          onChange={onChange}
        />
      );

      expect(screen.getByText('Katup Solenoid Tangki')).toBeDefined();
      expect(screen.getByText('CLOSED')).toBeDefined();
      expect(screen.getByText('ALIRAN TERTUTUP')).toBeDefined();

      const valveCard = container.querySelector('.gluestack-scada-valve');
      fireEvent.click(valveCard);

      expect(onOpen).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ state: 'OPEN', isOpen: true }));
    });
  });

  describe('ScadaTank Widget', () => {
    it('renders level percentage and capacity correctly', () => {
      render(
        <ScadaTank
          id="t1"
          label="Tangki Buffer"
          capacity={1000}
          level={750}
          unit="L"
        />
      );

      expect(screen.getByText('Tangki Buffer')).toBeDefined();
      expect(screen.getByText('75%')).toBeDefined();
      expect(screen.getByText('750 / 1000 L')).toBeDefined();
    });

    it('evaluates HIGH ALARM when level exceeds highAlarm limit', () => {
      render(
        <ScadaTank
          id="t2"
          label="Tangki Kimia"
          capacity={1000}
          level={950}
          highAlarm={900}
        />
      );

      expect(screen.getByText('HIGH ALARM')).toBeDefined();
    });

    it('evaluates LOW LEVEL when level falls below lowAlarm limit', () => {
      render(
        <ScadaTank
          id="t3"
          label="Tangki Kimia"
          capacity={1000}
          level={100}
          lowAlarm={150}
        />
      );

      expect(screen.getByText('LOW LEVEL')).toBeDefined();
    });

    it('nudges level with step buttons', () => {
      const onChange = vi.fn();
      render(
        <ScadaTank
          id="t4"
          capacity={1000}
          level={500}
          unit="L"
          onChange={onChange}
        />
      );

      const addBtn = screen.getByText('+50 L');
      fireEvent.click(addBtn);

      expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ level: 550, percentage: 55 }));
    });
  });

  describe('ScadaPipe Widget', () => {
    it('renders horizontal pipe with active flow', () => {
      const { container } = render(
        <ScadaPipe
          id="p1"
          direction="horizontal"
          fluidColor="#06b6d4"
          flowSpeed={4}
          isActive={true}
        />
      );

      const svg = container.querySelector('svg');
      expect(svg).toBeDefined();
      const line = container.querySelector('line');
      expect(line?.getAttribute('stroke')).toBe('#06b6d4');
    });

    it('renders vertical pipe with appropriate orientation', () => {
      const { container } = render(
        <ScadaPipe
          id="p2"
          direction="vertical"
          fluidColor="#3b82f6"
        />
      );

      const root = container.querySelector('.gluestack-scada-pipe');
      expect(root?.style.width).toBe('32px');
    });
  });

  describe('ScadaPump Widget', () => {
    it('renders pump state and handles toggling', () => {
      const onStart = vi.fn();
      const { container } = render(
        <ScadaPump
          id="pump1"
          label="Pompa Suplai"
          pumpState="STOPPED"
          rpm={2900}
          onStart={onStart}
        />
      );

      expect(screen.getByText('Pompa Suplai')).toBeDefined();
      expect(screen.getAllByText('STOPPED').length).toBeGreaterThanOrEqual(1);

      const pumpCard = container.querySelector('.gluestack-scada-pump');
      fireEvent.click(pumpCard);

      expect(onStart).toHaveBeenCalledTimes(1);
    });
  });

  describe('ScadaConveyor Widget', () => {
    it('renders conveyor speed, direction, and handles toggle', () => {
      const onChange = vi.fn();
      const { container } = render(
        <ScadaConveyor
          id="cv1"
          label="Belt Conveyor Line 1"
          conveyorState="RUNNING"
          speed={1.5}
          direction="RIGHT"
          onChange={onChange}
        />
      );

      expect(screen.getByText('Belt Conveyor Line 1')).toBeDefined();
      expect(screen.getByText('1.5 m/s')).toBeDefined();
      expect(screen.getByText('Arah: RIGHT')).toBeDefined();

      const conveyorCard = container.querySelector('.gluestack-scada-conveyor');
      fireEvent.click(conveyorCard);

      expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ state: 'STOPPED', speed: 0 }));
    });
  });

  describe('ScadaGauge Widget', () => {
    it('renders gauge value and unit', () => {
      render(
        <ScadaGauge
          id="g1"
          label="Tekanan Angin"
          value={5.5}
          min={0}
          max={10}
          unit="bar"
        />
      );

      expect(screen.getByText('Tekanan Angin')).toBeDefined();
      expect(screen.getByText('5.5')).toBeDefined();
      expect(screen.getByText('bar')).toBeDefined();
      expect(screen.getByText('NORMAL')).toBeDefined();
    });

    it('shows CRITICAL badge when value exceeds alarmLimit', () => {
      render(
        <ScadaGauge
          id="g2"
          value={9.2}
          alarmLimit={8.5}
          unit="bar"
        />
      );

      expect(screen.getByText('CRITICAL')).toBeDefined();
    });
  });

  describe('ScadaDigitalDisplay Widget', () => {
    it('renders high-contrast digital display value and online badge', () => {
      render(
        <ScadaDigitalDisplay
          id="dd1"
          label="Laju Aliran Air"
          value={185.4}
          unit="m³/h"
          status="ONLINE"
        />
      );

      expect(screen.getByText('Laju Aliran Air')).toBeDefined();
      expect(screen.getByText('185.4')).toBeDefined();
      expect(screen.getByText('m³/h')).toBeDefined();
      expect(screen.getByText('ONLINE')).toBeDefined();
    });
  });

  describe('ScadaStartStop Widget', () => {
    it('renders START, STOP, RESET buttons and fires actions', () => {
      const onStart = vi.fn();
      const onStop = vi.fn();
      const onReset = vi.fn();

      render(
        <ScadaStartStop
          id="btn1"
          label="Panel Kontrol Motor"
          onStart={onStart}
          onStop={onStop}
          onReset={onReset}
        />
      );

      expect(screen.getByText('Panel Kontrol Motor')).toBeDefined();

      fireEvent.click(screen.getByText('START'));
      expect(onStart).toHaveBeenCalledTimes(1);

      fireEvent.click(screen.getByText('STOP'));
      expect(onStop).toHaveBeenCalledTimes(1);

      fireEvent.click(screen.getByText('RESET'));
      expect(onReset).toHaveBeenCalledTimes(1);
    });
  });

  describe('ScadaToggleSwitch Widget', () => {
    it('renders selector switch options and fires onChange when selected', () => {
      const onChange = vi.fn();

      render(
        <ScadaToggleSwitch
          id="sw1"
          label="Mode Operasi"
          mode="AUTO"
          options={['AUTO', 'MANUAL', 'OFF']}
          onChange={onChange}
        />
      );

      expect(screen.getByText('Mode Operasi')).toBeDefined();

      const manualBtn = screen.getByText('MANUAL');
      fireEvent.click(manualBtn);

      expect(onChange).toHaveBeenCalledWith({ mode: 'MANUAL' });
    });
  });

  describe('ScadaPlcStatus Widget', () => {
    it('renders controller info, IP address, cycle time, and connection badge', () => {
      render(
        <ScadaPlcStatus
          id="plc1"
          controllerName="Siemens S7-1500 Line 2"
          ipAddress="192.168.1.155"
          cycleTime={12}
          status="ONLINE"
        />
      );

      expect(screen.getByText('Siemens S7-1500 Line 2')).toBeDefined();
      expect(screen.getByText('192.168.1.155')).toBeDefined();
      expect(screen.getByText('12 ms')).toBeDefined();
      expect(screen.getByText('ONLINE')).toBeDefined();
    });
  });

  describe('ScadaTrend Widget', () => {
    it('renders sparkline chart with data statistics', () => {
      render(
        <ScadaTrend
          id="tr1"
          label="Suhu Furnace"
          data={[100, 120, 140, 160, 180]}
          unit="°C"
        />
      );

      expect(screen.getByText('Suhu Furnace')).toBeDefined();
      expect(screen.getByText('180 °C')).toBeDefined();
      expect(screen.getByText('Min: 100 °C')).toBeDefined();
      expect(screen.getByText('Max: 180 °C')).toBeDefined();
    });
  });
});

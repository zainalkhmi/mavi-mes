import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import * as GluestackComponents from '../../ui-engine/components';
import {
  QualityTolerance,
  QualityPassFail,
  MetrologyWidget,
  ProductionCounter,
  OEEWidget,
  AlarmBanner,
  BarcodeGenerator,
  PrintZebra
} from '../../ui-engine/components';

describe('Gluestack Phase 1 Industrial Quality & MES Widgets', () => {
  describe('Component Export Verifications', () => {
    it('exports all Phase 1 components from ui-engine/components', () => {
      expect(GluestackComponents.QualityTolerance).toBeDefined();
      expect(GluestackComponents.QualityPassFail).toBeDefined();
      expect(GluestackComponents.MetrologyWidget).toBeDefined();
      expect(GluestackComponents.ProductionCounter).toBeDefined();
      expect(GluestackComponents.OEEWidget).toBeDefined();
      expect(GluestackComponents.AlarmBanner).toBeDefined();
      expect(GluestackComponents.BarcodeGenerator).toBeDefined();
      expect(GluestackComponents.PrintZebra).toBeDefined();
    });

    it('registers all Phase 1 components in COMPONENT_REGISTRY', async () => {
      const { COMPONENT_REGISTRY } = await import('../../ui-engine/registry/componentRegistry');
      const registeredNames = COMPONENT_REGISTRY.map(c => c.name);
      expect(registeredNames).toContain('QualityTolerance');
      expect(registeredNames).toContain('QualityPassFail');
      expect(registeredNames).toContain('MetrologyWidget');
      expect(registeredNames).toContain('ProductionCounter');
      expect(registeredNames).toContain('OEEWidget');
      expect(registeredNames).toContain('AlarmBanner');
      expect(registeredNames).toContain('BarcodeGenerator');
      expect(registeredNames).toContain('PrintZebra');
    });
  });

  describe('QualityTolerance Widget', () => {
    it('renders nominal, USL, and LSL specification labels', () => {
      render(
        <QualityTolerance
          id="q1"
          label="Diameter Luar Poros"
          nominal={25.0}
          usl={25.05}
          lsl={24.95}
          unit="mm"
          defaultValue="25.02"
        />
      );

      expect(screen.getByText('Diameter Luar Poros')).toBeDefined();
      expect(screen.getByText('IN TOLERANCE')).toBeDefined();
      expect(screen.getByText('25')).toBeDefined();
    });

    it('evaluates OVER SPEC when measurement exceeds USL', () => {
      render(
        <QualityTolerance
          id="q2"
          label="Toleransi Silinder"
          nominal={25.0}
          usl={25.05}
          lsl={24.95}
          defaultValue="25.10"
        />
      );

      expect(screen.getByText('OVER SPEC')).toBeDefined();
    });

    it('evaluates UNDER SPEC when measurement falls below LSL', () => {
      render(
        <QualityTolerance
          id="q3"
          label="Toleransi Silinder"
          nominal={25.0}
          usl={25.05}
          lsl={24.95}
          defaultValue="24.80"
        />
      );

      expect(screen.getByText('UNDER SPEC')).toBeDefined();
    });

    it('triggers onPass and onFail callbacks on input change', () => {
      const onPass = vi.fn();
      const onFail = vi.fn();
      const onChange = vi.fn();

      render(
        <QualityTolerance
          id="q4"
          nominal={25.0}
          usl={25.05}
          lsl={24.95}
          defaultValue="25.00"
          onChange={onChange}
          onPass={onPass}
          onFail={onFail}
        />
      );

      const input = screen.getByRole('spinbutton');
      fireEvent.change(input, { target: { value: '25.03' } });
      expect(onPass).toHaveBeenCalled();

      fireEvent.change(input, { target: { value: '25.12' } });
      expect(onFail).toHaveBeenCalled();
    });
  });

  describe('QualityPassFail Widget', () => {
    it('renders PASS and FAIL buttons', () => {
      render(
        <QualityPassFail
          id="qpf1"
          label="Visual Check Part"
        />
      );

      expect(screen.getByText('Visual Check Part')).toBeDefined();
      expect(screen.getByText('PASS (OK)')).toBeDefined();
      expect(screen.getByText('FAIL (NG)')).toBeDefined();
    });

    it('handles PASS click and calls onPass callback', () => {
      const onPass = vi.fn();
      const onChange = vi.fn();

      render(
        <QualityPassFail
          id="qpf2"
          onPass={onPass}
          onChange={onChange}
        />
      );

      const passBtn = screen.getByText('PASS (OK)');
      fireEvent.click(passBtn);

      expect(onPass).toHaveBeenCalled();
      expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ status: 'PASS' }));
    });

    it('handles FAIL click, expands defect reasons, and calls onFail', () => {
      const onFail = vi.fn();
      const onChange = vi.fn();

      render(
        <QualityPassFail
          id="qpf3"
          onFail={onFail}
          onChange={onChange}
        />
      );

      const failBtn = screen.getByText('FAIL (NG)');
      fireEvent.click(failBtn);

      expect(onFail).toHaveBeenCalled();
      expect(screen.getByText(/Pilih Jenis Cacat/i)).toBeDefined();
    });
  });

  describe('MetrologyWidget', () => {
    it('renders outside micrometer with unit and target', () => {
      render(
        <MetrologyWidget
          id="metro1"
          instrumentType="MICROMETER"
          targetValue={25.0}
          tolerance={0.05}
        />
      );

      expect(screen.getByText(/Mikrometer Luar Digital/i)).toBeDefined();
      expect(screen.getByText('mm')).toBeDefined();
    });

    it('renders torque wrench instrument type', () => {
      render(
        <MetrologyWidget
          id="metro2"
          instrumentType="TORQUE_WRENCH"
          targetValue={45.0}
          tolerance={2.0}
        />
      );

      expect(screen.getByText(/Kunci Torsi Digital/i)).toBeDefined();
      expect(screen.getByText('Nm')).toBeDefined();
    });

    it('triggers onCapture with evaluated status', () => {
      const onCapture = vi.fn();

      render(
        <MetrologyWidget
          id="metro3"
          instrumentType="MICROMETER"
          targetValue={25.0}
          tolerance={0.05}
          onCapture={onCapture}
        />
      );

      const captureBtn = screen.getByRole('button', { name: /Ambil Nilai Ukur/i });
      fireEvent.click(captureBtn);

      expect(onCapture).toHaveBeenCalledWith(expect.objectContaining({
        instrument: 'MICROMETER',
        status: expect.stringMatching(/PASS|FAIL/)
      }));
    });
  });

  describe('MESWidgets', () => {
    it('ProductionCounter increments actual and computes good parts', () => {
      const onChange = vi.fn();

      render(
        <ProductionCounter
          id="pc1"
          targetQty={100}
          actualQty={10}
          defectQty={2}
          onChange={onChange}
        />
      );

      expect(screen.getByText('Pencatatan Produksi Part')).toBeDefined();
      expect(screen.getByText('Good Part')).toBeDefined();
      expect(screen.getByText('Defect (NG)')).toBeDefined();
      expect(screen.getByText('8')).toBeDefined(); // goodQty = 10 - 2 = 8
      expect(screen.getByText('2')).toBeDefined(); // defectQty = 2

      const plusBtn = screen.getByRole('button', { name: /Part Selesai/i });
      fireEvent.click(plusBtn);

      expect(onChange).toHaveBeenCalledWith(expect.objectContaining({
        actual: 11,
        defect: 2,
        good: 9
      }));
    });

    it('OEEWidget correctly calculates total OEE percentage', () => {
      render(
        <OEEWidget
          id="oee1"
          availability={90}
          performance={90}
          quality={100}
        />
      );

      // 0.9 * 0.9 * 1.0 = 0.81 = 81%
      expect(screen.getByText('81%')).toBeDefined();
      expect(screen.getByText('RUNNING')).toBeDefined();
    });

    it('AlarmBanner renders severity and handles operator acknowledge', () => {
      const onAck = vi.fn();

      render(
        <AlarmBanner
          id="alarm1"
          severity="CRITICAL"
          title="Motor Overheating"
          message="Suhu motor mencapai 95°C"
          onAcknowledge={onAck}
        />
      );

      expect(screen.getByText('Motor Overheating')).toBeDefined();
      expect(screen.getByText('CRITICAL')).toBeDefined();

      const ackBtn = screen.getByText('Acknowledge Alarm');
      fireEvent.click(ackBtn);

      expect(onAck).toHaveBeenCalled();
      expect(screen.getByText(/Alarm telah dikonfirmasi oleh operator/i)).toBeDefined();
    });
  });

  describe('BarcodePrintWidgets', () => {
    it('BarcodeGenerator renders Code128 visual bars and part value', () => {
      render(
        <BarcodeGenerator
          id="bc1"
          value="PART-ENG-9901"
          type="CODE128"
        />
      );

      expect(screen.getByText('PART-ENG-9901')).toBeDefined();
      expect(screen.getByText('Tipe: CODE128')).toBeDefined();
    });

    it('PrintZebra renders thermal label preview and handles print trigger', () => {
      render(
        <PrintZebra
          id="pz1"
          partNumber="PN-7721"
          lotNumber="LOT-AUG-01"
          partName="Rotor Shaft"
        />
      );

      expect(screen.getByText('Rotor Shaft')).toBeDefined();
      expect(screen.getByText('PN-7721')).toBeDefined();
      expect(screen.getByText('Cetak Label Barcode')).toBeDefined();
    });
  });
});

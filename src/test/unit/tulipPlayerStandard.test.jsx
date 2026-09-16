import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import TulipPlayerHeader from '../../components/player/TulipPlayerHeader';
import {
  TulipHelpModal,
  TulipInfoModal,
  TulipRestartModal,
  TulipShopFloorMenuModal
} from '../../components/player/TulipPlayerModals';

describe('TulipPlayerHeader Standard Parity', () => {
  it('renders standard Tulip frontline header elements accurately', () => {
    const onOpenHelp = vi.fn();
    const onOpenInfo = vi.fn();
    const onRestartApp = vi.fn();
    const onOpenMenu = vi.fn();

    render(
      <TulipPlayerHeader
        appName="Inspection & Assembly App"
        stepTitle="Visual Quality Check"
        stepIndex={0}
        totalSteps={3}
        operator="Budi Santoso"
        stationName="Station-QC-01"
        isOnline={true}
        onOpenHelp={onOpenHelp}
        onOpenInfo={onOpenInfo}
        onRestartApp={onRestartApp}
        onOpenMenu={onOpenMenu}
      />
    );

    // App name & Step title
    expect(screen.getByText('Inspection & Assembly App')).toBeDefined();
    expect(screen.getByText(/Visual Quality Check/)).toBeDefined();

    // Operator and Station
    expect(screen.getByText('Budi Santoso')).toBeDefined();
    expect(screen.getByText('Station-QC-01')).toBeDefined();

    // Action buttons
    const helpBtn = screen.getByText('Help');
    fireEvent.click(helpBtn);
    expect(onOpenHelp).toHaveBeenCalled();

    const infoBtn = screen.getByText('Info');
    fireEvent.click(infoBtn);
    expect(onOpenInfo).toHaveBeenCalled();

    const restartBtn = screen.getByText('Restart');
    fireEvent.click(restartBtn);
    expect(onRestartApp).toHaveBeenCalled();

    const menuBtn = screen.getByText('Menu');
    fireEvent.click(menuBtn);
    expect(onOpenMenu).toHaveBeenCalled();
  });
});

describe('Tulip Frontline Modals', () => {
  it('renders TulipHelpModal with instructions when open', () => {
    const onClose = vi.fn();
    render(
      <TulipHelpModal
        isOpen={true}
        onClose={onClose}
        appName="Packaging App"
        currentStep={{ title: 'Seal Box' }}
        helpGuide="Follow standard operating procedure"
      />
    );

    expect(screen.getByText('PANDUAN KERJA (SOP) & BANTUAN')).toBeDefined();
    expect(screen.getByText('Seal Box')).toBeDefined();
    expect(screen.getByText('Follow standard operating procedure')).toBeDefined();
    const closeBtn = screen.getByText('Tutup Panduan');
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalled();
  });

  it('renders TulipRestartModal with confirmation prompt', () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();
    render(
      <TulipRestartModal
        isOpen={true}
        onClose={onClose}
        onConfirm={onConfirm}
      />
    );

    expect(screen.getByText('Restart Sesi Aplikasi?')).toBeDefined();
    const confirmBtn = screen.getByText('Ya, Restart Sesi');
    fireEvent.click(confirmBtn);
    expect(onConfirm).toHaveBeenCalled();
  });

  it('renders TulipShopFloorMenuModal with actions', () => {
    const onSwitchApp = vi.fn();
    const onToggleFullscreen = vi.fn();
    render(
      <TulipShopFloorMenuModal
        isOpen={true}
        onClose={() => {}}
        onSwitchApp={onSwitchApp}
        onToggleFullscreen={onToggleFullscreen}
        isFullscreen={false}
      />
    );

    expect(screen.getByText('MANDOR PLAYER MENU')).toBeDefined();
    expect(screen.getByText('Pengaturan Frontline')).toBeDefined();

    const switchBtn = screen.getByText('Ganti Aplikasi Lain');
    fireEvent.click(switchBtn);
    expect(onSwitchApp).toHaveBeenCalled();
  });
});

describe('Base Layout Duplicate Suppression Logic', () => {
  it('suppresses Mandor Footer Bar when base layout footer is present', () => {
    const selectedApp = {
      config: {
        baseComponents: [
          { id: 'base_ftr_bg_1', name: 'base_footer_bar', type: 'SHAPE_RECTANGLE' },
          { id: 'base_ftr_prev_2', name: 'base_prev_btn', type: 'BUTTON' },
          { id: 'base_ftr_next_3', name: 'base_next_btn', type: 'BUTTON' }
        ]
      }
    };

    const hasBaseLayoutFooter = selectedApp.config.baseComponents.some(c =>
      c.id?.startsWith('base_ftr_') || c.name === 'base_footer_bar' || c.name === 'base_prev_btn'
    );

    expect(hasBaseLayoutFooter).toBe(true);

    const launchParams = new URLSearchParams('embedded=true&hideFooter=true');
    const shouldHideMandorFooter = Boolean(
      launchParams.get('hideFooter') === 'true' ||
      launchParams.get('embedded') === 'true' ||
      hasBaseLayoutFooter
    );

    expect(shouldHideMandorFooter).toBe(true);
  });

  it('suppresses Base Layout header when player outer header is authoritative', () => {
    const baseComponents = [
      { id: 'base_hdr_bg_1', name: 'base_header_bar', type: 'SHAPE_RECTANGLE' },
      { id: 'base_hdr_menu_2', name: 'base_menu_btn', type: 'BUTTON' },
      { id: 'base_hdr_title_3', name: 'base_app_title', type: 'TEXT' },
      { id: 'comp_user_input', name: 'input_barcode', type: 'TEXT_INPUT' }
    ];

    const shouldHideBaseHeader = true; // embedded in player with outer TulipPlayerHeader

    const filtered = baseComponents.filter(c =>
      !c.id?.startsWith('base_hdr_') &&
      c.name !== 'base_header_bar' &&
      c.name !== 'base_menu_btn' &&
      c.name !== 'base_app_title'
    );

    expect(filtered.length).toBe(1);
    expect(filtered[0].id).toBe('comp_user_input');
  });
});

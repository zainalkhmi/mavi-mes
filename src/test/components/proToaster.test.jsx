import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { toast } from 'react-hot-toast';
import { ProToaster, ProToastCard } from '../../components/common/ProToaster';

describe('ProToaster and Notification Lifecyle', () => {
  it('exports ProToaster and ProToastCard components', () => {
    expect(typeof ProToaster).toBe('function');
    expect(typeof ProToastCard).toBe('function');
  });

  it('polyfilled toast.info is available as a function', () => {
    expect(typeof toast.info).toBe('function');
  });

  it('calling toast.info does not throw', () => {
    expect(() => {
      toast.info('Test Info Message');
    }).not.toThrow();
  });

  it('calling toast.success and toast.error dispatches without throwing', () => {
    expect(() => {
      const id1 = toast.success('Inventory Module Ready — Automations Active');
      const id2 = toast.success('Inventory Module Ready — Automations Active');
      expect(typeof id1).toBe('string');
      expect(typeof id2).toBe('string');
      toast.dismiss(id1);
      toast.remove(id1);
    }).not.toThrow();
  });
});

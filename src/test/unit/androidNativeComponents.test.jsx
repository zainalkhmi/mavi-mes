import { describe, it, expect } from 'vitest';
import * as UI from '../../ui-engine/components';
import { COMPONENT_REGISTRY } from '../../ui-engine/registry/componentRegistry';
import { maviDesignTokens } from '../../ui-engine/tokens/theme';

describe('Android Native / MD3 Components Verification', () => {
  it('exports all new Android Native components from ui-engine/components', () => {
    // 1. BottomSheet
    expect(UI.BottomSheet).toBeDefined();

    // 2. Snackbar
    expect(UI.Snackbar).toBeDefined();
    expect(UI.SnackbarHost).toBeDefined();
    expect(UI.showSnackbar).toBeDefined();
    expect(UI.dismissSnackbar).toBeDefined();

    // 3. Chip & FilterChip
    expect(UI.Chip).toBeDefined();
    expect(UI.FilterChip).toBeDefined();
    expect(UI.ChipGroup).toBeDefined();

    // 4. SearchBar
    expect(UI.SearchBar).toBeDefined();

    // 5. PullToRefresh
    expect(UI.PullToRefresh).toBeDefined();

    // 6. SwipeableRow
    expect(UI.SwipeableRow).toBeDefined();

    // 7. SegmentedButton
    expect(UI.SegmentedButton).toBeDefined();

    // 8. TopAppBar
    expect(UI.TopAppBar).toBeDefined();
    expect(UI.IconButton).toBeDefined();

    // 9. Slider & RangeSlider
    expect(UI.Slider).toBeDefined();
    expect(UI.RangeSlider).toBeDefined();
  });

  it('includes all Android Native components in COMPONENT_REGISTRY', () => {
    const registryNames = COMPONENT_REGISTRY.map(c => c.name);
    
    expect(registryNames).toContain('BottomSheet');
    expect(registryNames).toContain('Snackbar');
    expect(registryNames).toContain('Chip');
    expect(registryNames).toContain('SearchBar');
    expect(registryNames).toContain('PullToRefresh');
    expect(registryNames).toContain('SwipeableRow');
    expect(registryNames).toContain('SegmentedButton');
    expect(registryNames).toContain('TopAppBar');
    expect(registryNames).toContain('Slider');
  });

  it('verifies theme tokens have Material Design 3 elevation, motion, and typography', () => {
    expect(maviDesignTokens).toBeDefined();
    expect(maviDesignTokens.elevation).toBeDefined();
    expect(maviDesignTokens.elevation.level1).toBeDefined();
    expect(maviDesignTokens.elevation.level3).toBeDefined();
    expect(maviDesignTokens.motion).toBeDefined();
    expect(maviDesignTokens.motion.easing.emphasized).toBeDefined();
    expect(maviDesignTokens.stateLayer).toBeDefined();
    expect(maviDesignTokens.typographyRoles).toBeDefined();
    expect(maviDesignTokens.touchTarget).toBeDefined();
  });
});

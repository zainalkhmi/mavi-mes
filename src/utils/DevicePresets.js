/**
 * DevicePresets.js
 * Device Presets Registry for Canvas Preview
 */

export const DEVICE_PRESETS = {
  // Smartphones
  'iphone-15-pro': {
    name: 'iPhone 15 Pro',
    category: 'Smartphone',
    width: 393,
    height: 852,
    pixelRatio: 3,
    safeArea: { top: 59, bottom: 34 },
    icon: '📱'
  },
  'iphone-15': {
    name: 'iPhone 15',
    category: 'Smartphone',
    width: 390,
    height: 844,
    pixelRatio: 2,
    safeArea: { top: 47, bottom: 34 },
    icon: '📱'
  },
  'samsung-s24': {
    name: 'Samsung S24',
    category: 'Smartphone',
    width: 412,
    height: 915,
    pixelRatio: 2.625,
    safeArea: { top: 48, bottom: 32 },
    icon: '📱'
  },
  'xiaomi-14': {
    name: 'Xiaomi 14',
    category: 'Smartphone',
    width: 393,
    height: 851,
    pixelRatio: 2.625,
    safeArea: { top: 50, bottom: 34 },
    icon: '📱'
  },

  // Tablets
  'ipad-pro-12': {
    name: 'iPad Pro 12.9"',
    category: 'Tablet',
    width: 1024,
    height: 1366,
    pixelRatio: 2,
    safeArea: { top: 24, bottom: 24 },
    icon: '📲'
  },
  'ipad-air': {
    name: 'iPad Air',
    category: 'Tablet',
    width: 820,
    height: 1180,
    pixelRatio: 2,
    safeArea: { top: 24, bottom: 24 },
    icon: '📲'
  },
  'samsung-tab-s9': {
    name: 'Samsung Tab S9',
    category: 'Tablet',
    width: 1024,
    height: 1366,
    pixelRatio: 2,
    safeArea: { top: 32, bottom: 32 },
    icon: '📲'
  },

  // Desktop/Laptop
  'desktop-1080p': {
    name: 'Desktop 1080p',
    category: 'Desktop',
    width: 1920,
    height: 1080,
    pixelRatio: 1,
    safeArea: { top: 0, bottom: 0 },
    icon: '🖥️'
  },
  'desktop-720p': {
    name: 'Desktop 720p',
    category: 'Desktop',
    width: 1280,
    height: 720,
    pixelRatio: 1,
    safeArea: { top: 0, bottom: 0 },
    icon: '🖥️'
  },
  'laptop-13': {
    name: 'Laptop 13"',
    category: 'Desktop',
    width: 1280,
    height: 800,
    pixelRatio: 1,
    safeArea: { top: 0, bottom: 0 },
    icon: '💻'
  },

  // Smartwatch
  'apple-watch-49': {
    name: 'Apple Watch 49mm',
    category: 'Smartwatch',
    width: 410,
    height: 410,
    pixelRatio: 3,
    safeArea: { top: 45, bottom: 45 },
    shape: 'round',
    icon: '⌚'
  },
  'galaxy-watch': {
    name: 'Galaxy Watch',
    category: 'Smartwatch',
    width: 360,
    height: 360,
    pixelRatio: 2,
    safeArea: { top: 40, bottom: 40 },
    shape: 'round',
    icon: '⌚'
  },
  'wear-os-square': {
    name: 'Wear OS Square',
    category: 'Smartwatch',
    width: 320,
    height: 320,
    pixelRatio: 1.5,
    safeArea: { top: 30, bottom: 30 },
    shape: 'round',
    icon: '⌚'
  },

  // TV Displays
  'tv-1080p': {
    name: 'TV 1080p (55")',
    category: 'TV Display',
    width: 1920,
    height: 1080,
    pixelRatio: 1,
    safeArea: { top: 0, bottom: 0 },
    icon: '📺'
  },
  'tv-4k': {
    name: 'TV 4K (55")',
    category: 'TV Display',
    width: 3840,
    height: 2160,
    pixelRatio: 1,
    safeArea: { top: 0, bottom: 0 },
    icon: '📺'
  },
  'tv-landscape': {
    name: 'TV Landscape Wide',
    category: 'TV Display',
    width: 2560,
    height: 1080,
    pixelRatio: 1,
    safeArea: { top: 0, bottom: 0 },
    icon: '📺'
  },

  // Industrial HMI
  'hmi-7inch': {
    name: 'HMI 7" (800×480)',
    category: 'Industrial HMI',
    width: 800,
    height: 480,
    pixelRatio: 1,
    safeArea: { top: 0, bottom: 0 },
    icon: '🏭'
  },
  'hmi-10inch': {
    name: 'HMI 10" (1280×800)',
    category: 'Industrial HMI',
    width: 1280,
    height: 800,
    pixelRatio: 1,
    safeArea: { top: 0, bottom: 0 },
    icon: '🏭'
  },
  'hmi-15inch': {
    name: 'HMI 15" (1024×768)',
    category: 'Industrial HMI',
    width: 1024,
    height: 768,
    pixelRatio: 1,
    safeArea: { top: 0, bottom: 0 },
    icon: '🏭'
  },
  'hmi-21inch': {
    name: 'HMI 21" (1920×1080)',
    category: 'Industrial HMI',
    width: 1920,
    height: 1080,
    pixelRatio: 1,
    safeArea: { top: 0, bottom: 0 },
    icon: '🏭'
  },

  // LED Display
  'led-wall-hd': {
    name: 'LED Wall HD',
    category: 'LED Display',
    width: 1920,
    height: 1080,
    pixelRatio: 1,
    safeArea: { top: 0, bottom: 0 },
    icon: '🖥️'
  },
  'led-wall-4k': {
    name: 'LED Wall 4K',
    category: 'LED Display',
    width: 3840,
    height: 2160,
    pixelRatio: 1,
    safeArea: { top: 0, bottom: 0 },
    icon: '🖥️'
  },

  // Custom
  'custom-portrait': {
    name: 'Custom Portrait',
    category: 'Custom',
    width: 400,
    height: 800,
    pixelRatio: 1,
    safeArea: { top: 0, bottom: 0 },
    icon: '⚙️'
  },
  'custom-landscape': {
    name: 'Custom Landscape',
    category: 'Custom',
    width: 800,
    height: 400,
    pixelRatio: 1,
    safeArea: { top: 0, bottom: 0 },
    icon: '⚙️'
  }
};

/**
 * Get presets by category
 */
export const getPresetsByCategory = () => {
  const categories = {};
  Object.entries(DEVICE_PRESETS).forEach(([key, preset]) => {
    if (!categories[preset.category]) {
      categories[preset.category] = [];
    }
    categories[preset.category].push({ key, ...preset });
  });
  return categories;
};

export default DEVICE_PRESETS;
